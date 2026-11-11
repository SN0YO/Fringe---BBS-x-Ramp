"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { classifyMccBaseline } from "@/lib/rules";
import { BASIS_LABEL, type Basis, type Treatment } from "@/lib/types";
import { money, payrollLines, round2, taxOn } from "@/lib/payroll";
import { Button, Card, PageHeader, Stat, TreatmentPill, cx } from "@/components/ui";
import { TxTable } from "@/components/TxTable";

// Assumption (to be validated in practitioner interviews): manual review of a
// card transaction for fringe-benefit taxability takes ~4 minutes end to end.
const MANUAL_MIN_PER_TX = 4;

export default function Overview() {
  const s = useStore();
  const period = s.periods.find((p) => p.id === s.currentPeriod)!;
  const txs = s.transactions.filter((t) => t.payPeriod === s.currentPeriod);
  const spend = txs.reduce((a, t) => a + t.amount, 0);
  const taxable = round2(txs.reduce((a, t) => a + (t.classification?.taxableAmount ?? 0), 0));
  const auto = txs.filter((t) => t.status === "auto_approved").length;
  const queue = txs.filter((t) => t.status === "in_review" || t.status === "awaiting_employee");

  // Versus "guess from the card feed": what would have been over- or under-taxed?
  let overTaxPrevented = 0;
  let underReportCaught = 0;
  for (const t of txs) {
    const c = t.classification!;
    if (c.treatment === "needs_info") continue;
    const base = classifyMccBaseline(t).taxableAmount;
    if (base > c.taxableAmount) overTaxPrevented += base - c.taxableAmount;
    if (c.taxableAmount > base) underReportCaught += c.taxableAmount - base;
  }

  const byBasis = new Map<Basis, number>();
  txs.forEach((t) => {
    const c = t.classification!;
    if (c.taxableAmount > 0) byBasis.set(c.basis, (byBasis.get(c.basis) ?? 0) + c.taxableAmount);
  });
  const basisRows = [...byBasis.entries()].sort((a, b) => b[1] - a[1]);
  const maxBasis = Math.max(1, ...basisRows.map((r) => r[1]));

  const mix: Record<Treatment, number> = { tax_free: 0, taxable: 0, partial: 0, needs_info: 0 };
  txs.forEach((t) => mix[t.classification!.treatment]++);
  const lines = payrollLines(s.transactions, s.employees, s.currentPeriod);
  const pendingLines = lines.reduce((a, l) => a + l.amount, 0);

  return (
    <>
      <PageHeader
        title="Fringe overview"
        subtitle={`Pay period ${period.label} · payroll runs ${new Date(period.payDate + "T12:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
        actions={
          <>
            {s.ai.enabled && (
              <Button onClick={() => s.classifyMany(txs.filter((t) => t.status !== "synced" && t.classification?.engine !== "ai").map((t) => t.id))}>
                <Sparkles className="size-4" /> Run Fringe AI on period
              </Button>
            )}
            <Link href="/review">
              <Button variant="primary">
                Review {queue.length} items <ArrowRight className="size-4" />
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Card spend analyzed" value={money(spend, false)} sub={`${txs.length} transactions, every memo + receipt read`} />
        <Stat label="Taxable fringe found" value={money(taxable)} sub="Reported as imputed income" />
        <Stat label="Over-taxing prevented" value={money(overTaxPrevented)} sub="vs. taxing by merchant category" accent />
        <Stat label="Missed income caught" value={money(underReportCaught)} sub="W-2c corrections avoided" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Handled automatically" value={`${Math.round((auto / Math.max(1, txs.length)) * 100)}%`} sub={`${auto} of ${txs.length} transactions. Fringe was at least 85% sure, so no human review needed`} />
        <Stat label="Needs a human" value={queue.length} sub={`${txs.filter((t) => t.status === "awaiting_employee").length} waiting on employees`} />
        <Stat label="Finance time saved" value={`${((auto * MANUAL_MIN_PER_TX) / 60).toFixed(1)} hrs`} sub={`Assumes ${MANUAL_MIN_PER_TX} min manual review per txn`} />
        <Stat label="Employee tax avoided" value={money(taxOn(overTaxPrevented))} sub="Withholding employees keep" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Taxable fringe by IRS basis</h2>
            <span className="text-[12px] text-muted">This period</span>
          </div>
          {basisRows.length === 0 ? (
            <div className="text-sm text-muted">No taxable items yet.</div>
          ) : (
            <div className="space-y-3">
              {basisRows.map(([b, v]) => (
                <div key={b} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[220px_minmax(0,1fr)_80px]" title={`${BASIS_LABEL[b]}: ${money(v)}`}>
                  <div className="truncate text-[13px] text-ink-2">{BASIS_LABEL[b]}</div>
                  <div className="order-3 col-span-2 h-2.5 rounded-full bg-paper sm:order-none sm:col-span-1">
                    <div className="h-full rounded-full bg-ink transition-all group-hover:bg-ink-2" style={{ width: `${(v / maxBasis) * 100}%` }} />
                  </div>
                  <div className="tabular text-right text-[13px] font-medium">{money(v, false)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-line pt-4">
            <div className="mb-2 text-[13px] font-medium">Decision mix</div>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {(Object.keys(mix) as Treatment[]).map((k) =>
                mix[k] ? (
                  <div
                    key={k}
                    title={`${k}: ${mix[k]}`}
                    className={cx(k === "tax_free" && "bg-free", k === "taxable" && "bg-tax", k === "partial" && "bg-partial", k === "needs_info" && "bg-info")}
                    style={{ flex: mix[k] }}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {(Object.keys(mix) as Treatment[]).map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <TreatmentPill t={k} /> <span className="tabular text-[13px] text-muted">{mix[k]}</span>
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="text-[13px] text-muted">Next payroll</div>
          <div className="mt-1 text-lg font-semibold">{new Date(period.payDate + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Ready to post</span>
              <span className="tabular font-medium">{money(pendingLines)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Employees affected</span>
              <span className="tabular font-medium">{lines.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Blocking items</span>
              <span className="tabular font-medium">{queue.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Providers</span>
              <span className="font-medium">Gusto · Rippling</span>
            </div>
          </div>
          <Link href="/payroll" className="mt-auto pt-5">
            <Button variant="accent" className="w-full">
              Open payroll sync <ArrowRight className="size-4" />
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Needs attention</h2>
          <Link href="/review" className="text-[13px] text-ink-2 hover:underline">
            View queue
          </Link>
        </div>
        <TxTable txs={queue.slice(0, 6)} compact />
      </Card>
    </>
  );
}
