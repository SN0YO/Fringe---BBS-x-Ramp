"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, Loader2, Send } from "lucide-react";
import { useStore } from "@/lib/store";
import { TAX, TOTAL_RATE, grossUp, money, payrollLines, round2, taxOn } from "@/lib/payroll";
import { Avatar, Button, Card, Empty, PageHeader, cx } from "@/components/ui";

export default function Payroll() {
  const s = useStore();
  const [periodId, setPeriodId] = useState(s.currentPeriod);
  const [gross, setGross] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);
  const [preview, setPreview] = useState<unknown>(null);
  const period = s.periods.find((p) => p.id === periodId)!;
  const lines = payrollLines(s.transactions, s.employees, periodId).filter((l) => l.transactions.some((t) => t.status !== "synced"));
  const syncedLines = payrollLines(s.transactions, s.employees, periodId).filter((l) => l.transactions.every((t) => t.status === "synced"));
  const blockers = s.transactions.filter((t) => t.payPeriod === periodId && (t.status === "in_review" || t.status === "awaiting_employee"));
  const providers = ["Gusto", "Rippling"] as const;

  const post = async (provider: "Gusto" | "Rippling") => {
    const mine = lines.filter((l) => l.employee.payroll === provider);
    if (!mine.length) return;
    setPosting(provider);
    const body = {
      provider,
      payPeriod: periodId,
      lines: mine.map((l) => ({ employeeId: l.employee.id, employeeName: l.employee.name, amount: l.amount, grossUp: gross ? grossUp(l.amount) : 0, transactionIds: l.transactions.map((t) => t.id) })),
    };
    const res = await fetch("/api/payroll", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setPreview(data.payload);
    s.recordSync(
      {
        id: data.reference,
        payPeriod: periodId,
        provider,
        reference: data.reference,
        postedAt: data.postedAt,
        total: round2(mine.reduce((a, l) => a + l.amount, 0)),
        grossUpTotal: round2(body.lines.reduce((a, l) => a + l.grossUp, 0)),
        employees: mine.length,
        payload: data.payload,
      },
      mine.flatMap((l) => l.transactions.map((t) => t.id)),
    );
    setPosting(null);
  };

  const exportCsv = () => {
    const rows = [["employee", "payroll_provider", "pay_period", "transaction_id", "date", "merchant", "amount", "taxable_amount", "irs_basis", "status"]];
    s.transactions
      .filter((t) => t.payPeriod === periodId && (t.classification?.taxableAmount ?? 0) > 0)
      .forEach((t) => {
        const e = s.employee(t.employeeId);
        rows.push([e.name, e.payroll, periodId, t.id, t.date, t.merchant, t.amount.toFixed(2), t.classification!.taxableAmount.toFixed(2), t.classification!.basis, t.status]);
      });
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fringe-imputed-income-${periodId}.csv`;
    a.click();
  };

  return (
    <>
      <PageHeader
        title="Payroll sync"
        subtitle="Approved taxable fringe becomes imputed income on the right paycheck, with no spreadsheet and no retyping."
        actions={
          <>
            <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="rounded-lg border border-line-2 bg-white px-2.5 py-2 text-[13px]">
              {s.periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} · pays {p.payDate.slice(5)}
                </option>
              ))}
            </select>
            <Button onClick={exportCsv}>
              <Download className="size-4" /> CSV
            </Button>
          </>
        }
      />

      {blockers.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-tax/30 bg-tax-bg px-4 py-3 text-sm">
          <AlertTriangle className="size-4 text-tax" />
          <span className="flex-1">
            <b>{blockers.length} transactions</b> still need a decision. They&apos;ll be held for the next pay period if unresolved.
          </span>
          <Link href="/review">
            <Button size="sm">Resolve</Button>
          </Link>
        </div>
      )}

      <Card className="mb-4 flex flex-wrap items-center gap-4 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <span className={cx("relative h-5 w-9 rounded-full transition", gross ? "bg-ink" : "bg-line-2")}>
            <span className={cx("absolute top-0.5 size-4 rounded-full bg-white transition-all", gross ? "left-[18px]" : "left-0.5")} />
          </span>
          <input type="checkbox" className="sr-only" checked={gross} onChange={(e) => setGross(e.target.checked)} />
          <span className="text-sm">
            <b>Gross up</b> taxable perks, so the company covers the tax and employees net the full benefit
          </span>
        </label>
        <span className="ml-auto text-[12px] text-muted">
          Est. rate {(TOTAL_RATE * 100).toFixed(2)}% = federal supplemental {+(TAX.federalSupplemental * 100).toFixed(2)}% + SS {+(TAX.socialSecurity * 100).toFixed(2)}% + Medicare {+(TAX.medicare * 100).toFixed(2)}% + state {(TAX.stateEstimate * 100).toFixed(1)}%
        </span>
      </Card>

      {lines.length === 0 ? (
        <Empty title={syncedLines.length ? "Everything for this period is synced" : "No taxable fringe in this period"} sub={period.status === "synced" ? `Posted before the ${period.payDate} payroll.` : undefined} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {providers.map((p) => {
            const mine = lines.filter((l) => l.employee.payroll === p);
            const total = mine.reduce((a, l) => a + l.amount, 0);
            return (
              <Card key={p} className="flex flex-col">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <div>
                    <div className="font-semibold">{p}</div>
                    <div className="text-[12px] text-muted">
                      {mine.length} employees · {money(total)} imputed{gross ? ` + ${money(mine.reduce((a, l) => a + grossUp(l.amount), 0))} gross-up` : ""}
                    </div>
                  </div>
                  <Button variant="primary" disabled={!mine.length || !!posting} onClick={() => post(p)}>
                    {posting === p ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Post to {p}
                  </Button>
                </div>
                <div className="divide-y divide-line">
                  {mine.length === 0 && <div className="px-5 py-6 text-sm text-muted">Nothing to post.</div>}
                  {mine.map((l) => (
                    <details key={l.employee.id} className="group px-5 py-3">
                      <summary className="flex cursor-pointer list-none items-center gap-3">
                        <Avatar name={l.employee.name} color={l.employee.color} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{l.employee.name}</div>
                          <div className="text-[12px] text-muted">{l.transactions.length} taxable items</div>
                        </div>
                        <div className="text-right">
                          <div className="tabular text-sm font-semibold">{money(l.amount)}</div>
                          <div className="tabular text-[11px] text-muted">{gross ? `+${money(grossUp(l.amount))} gross-up` : `−${money(taxOn(l.amount))} withholding`}</div>
                        </div>
                      </summary>
                      <ul className="mt-2 space-y-1 pl-11">
                        {l.transactions.map((t) => (
                          <li key={t.id}>
                            <button onClick={() => s.select(t.id)} className="flex w-full justify-between text-[13px] text-ink-2 hover:text-ink">
                              <span>
                                {t.merchant} <span className="text-muted">· {t.classification!.basis.replace(/_/g, " ")}</span>
                              </span>
                              <span className="tabular">{money(t.classification!.taxableAmount)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {preview != null && (
        <Card className="mt-4 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="size-4 text-free" /> Last request sent (simulated connector)
          </div>
          <pre className="max-h-72 overflow-auto rounded-xl bg-ink p-4 text-[12px] leading-relaxed text-white/90">{JSON.stringify(preview, null, 2)}</pre>
        </Card>
      )}

      <Card className="mt-4">
        <div className="border-b border-line px-5 py-4 font-semibold">Sync history</div>
        <div className="divide-y divide-line text-sm">
          {s.syncs.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <CheckCircle2 className="size-4 text-free" />
              <span className="font-medium">{r.provider}</span>
              <span className="text-muted">{s.periods.find((p) => p.id === r.payPeriod)?.label}</span>
              <span className="font-mono text-[12px] text-muted">{r.reference}</span>
              <span className="tabular ml-auto">
                {money(r.total)} · {r.employees} employees{r.grossUpTotal ? ` · ${money(r.grossUpTotal)} gross-up` : ""}
              </span>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 px-5 py-3">
            <CheckCircle2 className="size-4 text-free" />
            <span className="font-medium">Gusto + Rippling</span>
            <span className="text-muted">Oct 16 – Oct 31</span>
            <span className="tabular ml-auto">{money(payrollLines(s.transactions, s.employees, "2026-10b").reduce((a, l) => a + l.amount, 0))} · posted Nov 1</span>
          </div>
        </div>
      </Card>
    </>
  );
}
