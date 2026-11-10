"use client";

import { Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { money } from "@/lib/payroll";
import { Avatar, Confidence, MerchantLogo, StatusPill, TreatmentPill, cx, fmtDate } from "./ui";

export function TxTable({ txs, showEmployee = true, compact = false }: { txs: Transaction[]; showEmployee?: boolean; compact?: boolean }) {
  const s = useStore();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[12px] text-muted">
            <th className="py-2.5 pl-4 font-medium">Date</th>
            <th className="py-2.5 font-medium">Merchant</th>
            {showEmployee && <th className="py-2.5 font-medium">Employee</th>}
            <th className="py-2.5 pr-6 text-right font-medium">Amount</th>
            <th className="py-2.5 font-medium">Fringe</th>
            <th className="py-2.5 pr-6 text-right font-medium">Taxable</th>
            {!compact && <th className="py-2.5 font-medium">Confidence</th>}
            <th className="py-2.5 pr-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((t) => {
            const e = s.employee(t.employeeId);
            const c = t.classification!;
            return (
              <tr key={t.id} onClick={() => s.select(t.id)} className={cx("cursor-pointer border-b border-line last:border-0 hover:bg-paper/70", s.selectedId === t.id && "bg-paper")}>
                <td className="tabular whitespace-nowrap py-3 pl-4 pr-3 text-ink-2">{fmtDate(t.date)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <MerchantLogo name={t.merchant} size={28} />
                    <div className="min-w-0">
                      <div className="font-medium">{t.merchant}</div>
                      <div className="max-w-[240px] truncate text-[12px] text-muted">{t.memo || t.mccCategory}</div>
                    </div>
                  </div>
                </td>
                {showEmployee && (
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={e.name} color={e.color} size={22} />
                      <span className="text-ink-2">{e.name}</span>
                    </div>
                  </td>
                )}
                <td className="tabular py-3 pr-6 text-right font-medium">{money(t.amount)}</td>
                <td className="py-3">{s.busy[t.id] ? <Loader2 className="size-4 animate-spin text-muted" /> : <TreatmentPill t={c.treatment} />}</td>
                <td className="tabular py-3 pr-6 text-right">{c.taxableAmount > 0 ? money(c.taxableAmount) : <span className="text-muted">—</span>}</td>
                {!compact && (
                  <td className="py-3">
                    <Confidence v={c.confidence} />
                  </td>
                )}
                <td className="py-3 pr-4">
                  <StatusPill s={t.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
