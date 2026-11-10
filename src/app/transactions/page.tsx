"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL, TREATMENT_LABEL, type Treatment, type TxStatus } from "@/lib/types";
import { Button, Card, PageHeader } from "@/components/ui";
import { TxTable } from "@/components/TxTable";

const MCCS = ["Retail", "Electronics", "Restaurants", "Fitness", "Airlines", "Lodging", "Rideshare", "Transit", "Parking", "Telecom", "Education", "Software", "Clothing", "Entertainment", "Office supplies", "Digital services"];

const EXAMPLES = [
  { merchant: "Amazon", mccCategory: "Retail", amount: 249.99, memo: "standing desk converter for home office" },
  { merchant: "Barry's", mccCategory: "Fitness", amount: 38, memo: "" },
  { merchant: "Visa Gift Card (CVS)", mccCategory: "Retail", amount: 100, memo: "raffle prize" },
  { merchant: "Lyft", mccCategory: "Rideshare", amount: 22.1, memo: "home after 11pm launch" },
];

function NewSwipe({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [f, setF] = useState({ employeeId: "e1", merchant: "", mccCategory: "Retail", amount: "", memo: "" });
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 p-4 animate-fadein" onClick={onClose}>
      <Card className="w-full max-w-md p-5 shadow-xl">
        <div onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Simulate a card swipe</h2>
            <button onClick={onClose} aria-label="Close">
              <X className="size-5 text-muted" />
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex.merchant} onClick={() => setF({ ...f, ...ex, amount: String(ex.amount) })} className="rounded-full border border-line-2 px-2.5 py-1 text-[12px] hover:bg-paper">
                {ex.merchant}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <select value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })} className="rounded-lg border border-line-2 px-3 py-2 text-sm">
              {s.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.title}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input value={f.merchant} onChange={(e) => setF({ ...f, merchant: e.target.value })} placeholder="Merchant" className="rounded-lg border border-line-2 px-3 py-2 text-sm" />
              <input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Amount" type="number" step="0.01" className="tabular rounded-lg border border-line-2 px-3 py-2 text-sm" />
            </div>
            <select value={f.mccCategory} onChange={(e) => setF({ ...f, mccCategory: e.target.value })} className="rounded-lg border border-line-2 px-3 py-2 text-sm">
              {MCCS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input value={f.memo} onChange={(e) => setF({ ...f, memo: e.target.value })} placeholder="Memo (optional)" className="rounded-lg border border-line-2 px-3 py-2 text-sm" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!f.merchant || !f.amount || saving}
              onClick={async () => {
                setSaving(true);
                const id = s.addTransaction({ employeeId: f.employeeId, merchant: f.merchant, mccCategory: f.mccCategory, amount: parseFloat(f.amount), memo: f.memo, receipt: null, date: "2026-11-10" });
                onClose();
                s.select(await id);
              }}
            >
              Swipe card
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Transactions() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [treat, setTreat] = useState<Treatment | "all">("all");
  const [status, setStatus] = useState<TxStatus | "all">("all");
  const [emp, setEmp] = useState("all");
  const [period, setPeriod] = useState("all");
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      s.transactions
        .filter((t) => (treat === "all" || t.classification?.treatment === treat) && (status === "all" || t.status === status) && (emp === "all" || t.employeeId === emp) && (period === "all" || t.payPeriod === period))
        .filter((t) => !q || `${t.merchant} ${t.memo} ${t.mccCategory}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [s.transactions, q, treat, status, emp, period],
  );

  const sel = "rounded-lg border border-line-2 bg-white px-2.5 py-2 text-[13px]";
  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every Ramp card swipe, classified for payroll tax as it happens."
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Simulate swipe
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchant or memo" className="w-full rounded-lg border border-line-2 bg-white py-2 pl-8 pr-3 text-[13px]" />
        </div>
        <select className={sel} value={treat} onChange={(e) => setTreat(e.target.value as Treatment | "all")}>
          <option value="all">All treatments</option>
          {Object.entries(TREATMENT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value as TxStatus | "all")}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className={sel} value={emp} onChange={(e) => setEmp(e.target.value)}>
          <option value="all">All employees</option>
          {s.employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select className={sel} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="all">All pay periods</option>
          {s.periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <Card>
        <TxTable txs={rows} />
        <div className="border-t border-line px-4 py-2.5 text-[12px] text-muted">{rows.length} transactions</div>
      </Card>
      {open && <NewSwipe onClose={() => setOpen(false)} />}
    </>
  );
}
