"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { IRS_CHUNKS, POLICY_CHUNKS, retrieve, type KnowledgeChunk } from "@/lib/knowledge";
import { LIMITS } from "@/lib/rules";
import { money } from "@/lib/payroll";
import { Card, PageHeader, cx } from "@/components/ui";

function Chunk({ c, hit }: { c: KnowledgeChunk; hit?: number }) {
  return (
    <div id={c.id} className={cx("rounded-xl border p-4 transition", hit !== undefined ? "border-ink bg-white shadow-sm" : "border-line bg-white")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[12px] text-muted">
            {c.source} · {c.ref}
          </div>
          <div className="mt-0.5 font-medium">{c.title}</div>
        </div>
        {hit !== undefined && <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-ink">#{hit + 1}</span>}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{c.text}</p>
      <div className="mt-2 font-mono text-[11px] text-muted">{c.id}</div>
    </div>
  );
}

export default function Policy() {
  const [q, setQ] = useState("");
  const hits = q.trim() ? retrieve(q, 4) : [];
  const rank = (id: string) => {
    const i = hits.findIndex((h) => h.id === id);
    return i < 0 ? undefined : i;
  };
  const limits = [
    ["Qualified parking (§132(f))", `${money(LIMITS.qualifiedParkingMonthly, false)}/mo`, "IRS 2026"],
    ["Transit & vanpool (§132(f))", `${money(LIMITS.qualifiedTransitMonthly, false)}/mo`, "IRS 2026"],
    ["Educational assistance (§127)", `${money(LIMITS.educationalAssistanceAnnual, false)}/yr`, "IRS"],
    ["Achievement awards (§74(c))", "$400 / $1,600 qualified plan", "IRS"],
    ["De minimis cash / gift cards", "Never excludable", "IRS"],
    ["Home office equipment", `${money(LIMITS.homeOfficeAnnual, false)}/yr`, "Northwind policy"],
    ["Wellness stipend (taxable)", `${money(LIMITS.wellnessMonthly, false)}/mo`, "Northwind policy"],
    ["Mobile plan (eligible roles)", `${money(LIMITS.phonePlanPolicyCap, false)}/mo`, "Northwind policy"],
  ];
  return (
    <>
      <PageHeader title="Policy & IRS 15-B" subtitle="The knowledge Fringe retrieves from on every decision: your company's benefits policy, grounded in IRS Publication 15-B." />
      <Card className="mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Test retrieval: try “standing desk”, “gift card for anniversary”, or “parking garage”" className="w-full rounded-lg border border-line-2 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ink" />
        </div>
        {hits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            {hits.map((h, i) => (
              <a key={h.id} href={`#${h.id}`} className="rounded-full bg-paper px-2.5 py-1 hover:bg-line">
                #{i + 1} {h.title}
              </a>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-6 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[12px] text-muted">
              <th className="px-4 py-2.5 font-medium">Limit</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {limits.map(([a, b, c]) => (
              <tr key={a} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{a}</td>
                <td className="tabular px-4 py-2.5 font-medium">{b}</td>
                <td className="px-4 py-2.5 text-muted">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold">IRS Publication 15-B &amp; guidance</h2>
          <p className="-mt-2 mb-3 text-[12px] text-muted">Plain-English summaries for this prototype, not verbatim IRS text. Verify against the current-year publication.</p>
          <div className="space-y-3">{IRS_CHUNKS.map((c) => <Chunk key={c.id} c={c} hit={rank(c.id)} />)}</div>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold">Northwind Labs benefits &amp; expense policy</h2>
          <p className="-mt-2 mb-3 text-[12px] text-muted">Each customer connects their own policy; Fringe chunks and indexes it.</p>
          <div className="space-y-3">{POLICY_CHUNKS.map((c) => <Chunk key={c.id} c={c} hit={rank(c.id)} />)}</div>
        </section>
      </div>
    </>
  );
}
