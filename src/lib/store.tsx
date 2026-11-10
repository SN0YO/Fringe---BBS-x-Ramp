"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { classifyRules } from "./rules";
import { CURRENT_PERIOD, EMPLOYEES, PAY_PERIODS, SEED_TRANSACTIONS, payPeriodFor } from "./seed";
import type { Classification, Employee, PayPeriod, Receipt, Transaction, Treatment, TxStatus } from "./types";
import { AUTO_APPROVE_THRESHOLD } from "./types";

const KEY = "ramp-fringe-state-v2";

export type Role = "finance" | "employee";

export interface SyncRecord {
  id: string;
  payPeriod: string;
  provider: "Gusto" | "Rippling";
  reference: string;
  postedAt: string;
  total: number;
  grossUpTotal: number;
  employees: number;
  payload: unknown;
}

interface State {
  transactions: Transaction[];
  periods: PayPeriod[];
  syncs: SyncRecord[];
}

function statusFor(c: Classification): TxStatus {
  if (c.treatment === "needs_info") return "awaiting_employee";
  return c.confidence >= AUTO_APPROVE_THRESHOLD ? "auto_approved" : "in_review";
}

const nowIso = () => new Date().toISOString();

function seedState(): State {
  const transactions: Transaction[] = SEED_TRANSACTIONS.map((s) => {
    const emp = EMPLOYEES.find((e) => e.id === s.employeeId)!;
    const c = classifyRules({ ...s, employeeTitle: emp.title });
    const prior = s.date < "2026-11-01";
    return {
      id: s.id,
      employeeId: s.employeeId,
      date: s.date,
      merchant: s.merchant,
      mccCategory: s.mccCategory,
      amount: s.amount,
      memo: s.memo,
      receipt: s.receipt,
      payPeriod: payPeriodFor(s.date),
      classification: c,
      status: prior ? "synced" : statusFor(c),
      history: [
        { at: `${s.date}T12:00:00.000Z`, actor: "Ramp", action: "Card swipe received" },
        { at: `${s.date}T12:00:02.000Z`, actor: "Fringe", action: `Classified as ${c.treatment.replace("_", " ")} (${Math.round(c.confidence * 100)}% confidence)` },
        ...(prior ? [{ at: "2026-11-01T09:00:00.000Z", actor: "Fringe", action: "Posted to payroll" }] : []),
      ],
    };
  });
  return { transactions, periods: PAY_PERIODS, syncs: [] };
}

interface Ctx extends State {
  employees: Employee[];
  currentPeriod: string;
  role: Role;
  setRole: (r: Role) => void;
  employeeId: string;
  setEmployeeId: (id: string) => void;
  ai: { enabled: boolean; model: string | null; checked: boolean };
  busy: Record<string, boolean>;
  lastError: string | null;
  clearError: () => void;
  selectedId: string | null;
  select: (id: string | null) => void;
  employee: (id: string) => Employee;
  classify: (id: string, opts?: { answer?: string; receipt?: Receipt }) => Promise<void>;
  classifyMany: (ids: string[]) => Promise<void>;
  approve: (id: string, actor?: string) => void;
  override: (id: string, treatment: Treatment, taxableAmount: number, note: string) => void;
  answer: (id: string, text: string) => Promise<void>;
  attachReceipt: (id: string, receipt: Receipt) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, "id" | "status" | "classification" | "history" | "payPeriod">) => Promise<string>;
  recordSync: (rec: SyncRecord, txIds: string[]) => void;
  reset: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(seedState);
  const [hydrated, setHydrated] = useState(false);
  const [role, setRole] = useState<Role>("finance");
  const [employeeId, setEmployeeId] = useState("e1");
  const [ai, setAi] = useState({ enabled: false, model: null as string | null, checked: false });
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  const [selectedId, select] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as State;
        // Ignore anything that doesn't look like our state shape.
        if (Array.isArray(saved?.transactions) && Array.isArray(saved?.periods) && saved.transactions.every((t) => t?.classification)) setState({ ...saved, syncs: saved.syncs ?? [] });
      }
      const r = localStorage.getItem(KEY + ":role");
      if (r) {
        const { role, employeeId } = JSON.parse(r);
        setRole(role);
        setEmployeeId(employeeId);
      }
    } catch {}
    setHydrated(true);
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setAi({ enabled: d.ai, model: d.model, checked: true }))
      .catch(() => setAi((a) => ({ ...a, checked: true })));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY + ":role", JSON.stringify({ role, employeeId }));
    } catch {}
  }, [role, employeeId, hydrated]);

  const patchTx = useCallback((id: string, fn: (t: Transaction) => Transaction) => {
    setState((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? fn(t) : t)) }));
  }, []);

  const employee = useCallback((id: string) => EMPLOYEES.find((e) => e.id === id)!, []);

  const classify = useCallback(
    async (id: string, opts?: { answer?: string; receipt?: Receipt }) => {
      const tx = stateRef.current.transactions.find((t) => t.id === id);
      if (!tx) return;
      setBusy((b) => ({ ...b, [id]: true }));
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            merchant: tx.merchant,
            mccCategory: tx.mccCategory,
            amount: tx.amount,
            date: tx.date,
            memo: tx.memo,
            receipt: opts?.receipt ?? tx.receipt,
            employeeTitle: employee(tx.employeeId).title,
            employeeAnswer: opts?.answer ?? tx.employeeAnswer,
          }),
        });
        const data = (await res.json()) as { classification: Classification; error?: string };
        if (data.error) setLastError(data.error);
        const c = data.classification;
        patchTx(id, (t) => ({
          ...t,
          classification: c,
          status: t.status === "synced" ? "synced" : statusFor(c),
          history: [
            ...t.history,
            {
              at: nowIso(),
              actor: c.engine === "claude" ? "Fringe AI" : "Fringe (offline engine)",
              action: `Re-classified as ${c.treatment.replace("_", " ")} (${Math.round(c.confidence * 100)}% confidence)`,
            },
          ],
        }));
      } catch (e) {
        setLastError(e instanceof Error ? e.message : "Classification failed");
      } finally {
        setBusy((b) => ({ ...b, [id]: false }));
      }
    },
    [employee, patchTx],
  );

  const classifyMany = useCallback(
    async (ids: string[]) => {
      const queue = [...ids];
      const worker = async () => {
        while (queue.length) await classify(queue.shift()!);
      };
      await Promise.all(Array.from({ length: 4 }, worker));
    },
    [classify],
  );

  const approve = useCallback(
    (id: string, actor = "Finance") =>
      patchTx(id, (t) => ({ ...t, status: "approved", history: [...t.history, { at: nowIso(), actor, action: "Approved Fringe's decision" }] })),
    [patchTx],
  );

  const override = useCallback(
    (id: string, treatment: Treatment, taxableAmount: number, note: string) =>
      patchTx(id, (t) => ({
        ...t,
        status: "overridden",
        classification: {
          ...(t.classification as Classification),
          treatment,
          taxableAmount: treatment === "tax_free" ? 0 : treatment === "taxable" ? t.amount : taxableAmount,
          engine: "human",
          confidence: 1,
          rationale: note || "Manually set by finance.",
          question: null,
          classifiedAt: nowIso(),
        },
        history: [...t.history, { at: nowIso(), actor: "Finance", action: `Overrode to ${treatment.replace("_", " ")}${note ? `: “${note}”` : ""}` }],
      })),
    [patchTx],
  );

  const answer = useCallback(
    async (id: string, text: string) => {
      patchTx(id, (t) => ({ ...t, employeeAnswer: text, history: [...t.history, { at: nowIso(), actor: employee(t.employeeId).name, action: `Answered: “${text}”` }] }));
      await classify(id, { answer: text });
    },
    [classify, employee, patchTx],
  );

  const attachReceipt = useCallback(
    async (id: string, receipt: Receipt) => {
      patchTx(id, (t) => ({ ...t, receipt, history: [...t.history, { at: nowIso(), actor: employee(t.employeeId).name, action: `Attached receipt (${receipt.lines.length} line items)` }] }));
      await classify(id, { receipt });
    },
    [classify, employee, patchTx],
  );

  const addTransaction = useCallback<Ctx["addTransaction"]>(
    async (tx) => {
      const id = `tx-${Math.floor(2000 + Math.random() * 7999)}`;
      const c = classifyRules({ ...tx, employeeTitle: employee(tx.employeeId).title });
      const full: Transaction = {
        ...tx,
        id,
        payPeriod: payPeriodFor(tx.date),
        classification: c,
        status: statusFor(c),
        history: [{ at: nowIso(), actor: "Ramp", action: "Card swipe received" }],
      };
      setState((s) => ({ ...s, transactions: [full, ...s.transactions] }));
      await classify(id);
      return id;
    },
    [classify, employee],
  );

  const recordSync = useCallback((rec: SyncRecord, txIds: string[]) => {
    const ids = new Set(txIds);
    setState((s) => ({
      ...s,
      syncs: [rec, ...s.syncs],
      transactions: s.transactions.map((t) =>
        ids.has(t.id) ? { ...t, status: "synced", history: [...t.history, { at: rec.postedAt, actor: "Fringe", action: `Posted to ${rec.provider} (${rec.reference})` }] } : t,
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setState(seedState());
    select(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      employees: EMPLOYEES,
      currentPeriod: CURRENT_PERIOD,
      role,
      setRole,
      employeeId,
      setEmployeeId,
      ai,
      busy,
      lastError,
      clearError: () => setLastError(null),
      selectedId,
      select,
      employee,
      classify,
      classifyMany,
      approve,
      override,
      answer,
      attachReceipt,
      addTransaction,
      recordSync,
      reset,
    }),
    [state, role, employeeId, ai, busy, lastError, selectedId, employee, classify, classifyMany, approve, override, answer, attachReceipt, addTransaction, recordSync, reset],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
