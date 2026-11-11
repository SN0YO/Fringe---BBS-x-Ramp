"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Loader2, Play, Upload, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { HOLDOUT } from "@/lib/holdout";
import { EXTENDED } from "@/lib/extended";
import { SNAPSHOT, snapshotResults } from "@/lib/eval-snapshot";

const UNSEEN = [...HOLDOUT, ...EXTENDED];
import { SEED_TRANSACTIONS, type SeedTx } from "@/lib/seed";
import { classifyMccBaseline, classifyRules } from "@/lib/rules";
import { TREATMENT_LABEL, type Classification, type Treatment } from "@/lib/types";
import { money } from "@/lib/payroll";
import { Button, Card, PageHeader, TreatmentPill, cx } from "@/components/ui";

type Engine = "mcc" | "rules" | "ai";
const ENGINE_LABEL: Record<Engine, string> = { mcc: "Status quo: tax by merchant category", rules: "Keyword rules (offline engine)", ai: "Fringe AI" };

function correct(c: Classification | undefined, t: SeedTx) {
  return !!c && c.treatment === t.truth.treatment && Math.abs(c.taxableAmount - t.truth.taxableAmount) < 1;
}

function metrics(cases: SeedTx[], res: Record<string, Classification | undefined>) {
  const done = cases.filter((c) => res[c.id]);
  let ok = 0, over = 0, under = 0, treat = 0;
  for (const t of done) {
    const c = res[t.id]!;
    if (correct(c, t)) ok++;
    if (c.treatment === t.truth.treatment) treat++;
    if (t.truth.treatment === "needs_info" || c.treatment === "needs_info") continue;
    const d = c.taxableAmount - t.truth.taxableAmount;
    if (d > 0) over += d;
    else under -= d;
  }
  return { n: done.length, acc: done.length ? ok / done.length : 0, treat: done.length ? treat / done.length : 0, over, under };
}

function parseCsv(text: string): SeedTx[] {
  // columns: merchant,mcc,amount,memo,receipt_lines,truth_treatment,truth_taxable
  // receipt_lines: "desc:12.50|desc2:30" (optional)
  const rows = text.trim().split(/\r?\n/).map((l) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')));
  const [head, ...body] = rows;
  const idx = (k: string) => head.findIndex((h) => h.trim().toLowerCase() === k);
  return body.filter((r) => r.length > 3).map((r, i) => {
    const lines = (r[idx("receipt_lines")] || "").split("|").filter(Boolean).map((p) => {
      const j = p.lastIndexOf(":");
      return { description: p.slice(0, j), amount: parseFloat(p.slice(j + 1)) };
    });
    return {
      id: `csv-${i + 1}`,
      employeeId: "e1",
      date: "2026-11-10",
      merchant: r[idx("merchant")],
      mccCategory: r[idx("mcc")] || "Retail",
      amount: parseFloat(r[idx("amount")]),
      memo: r[idx("memo")] || "",
      receipt: lines.length ? { merchant: r[idx("merchant")], lines } : null,
      truth: { treatment: (r[idx("truth_treatment")] as Treatment) || "needs_info", taxableAmount: parseFloat(r[idx("truth_taxable")]) || 0, basis: "unknown", note: "Imported" },
    };
  });
}

export default function Eval() {
  const s = useStore();
  const [set, setSet] = useState<"unseen" | "holdout" | "extended" | "seed" | "csv">("unseen");
  const [csv, setCsv] = useState<SeedTx[]>([]);
  const [liveResults, setLiveResults] = useState<Record<string, Classification | undefined>>({});
  const [running, setRunning] = useState(false);
  const [fallbacks, setFallbacks] = useState(0);
  const file = useRef<HTMLInputElement>(null);

  const cases = set === "unseen" ? UNSEEN : set === "holdout" ? HOLDOUT : set === "extended" ? EXTENDED : set === "seed" ? SEED_TRANSACTIONS : csv;
  const emp = (id: string) => s.employees.find((e) => e.id === id);
  const mcc = useMemo(() => Object.fromEntries(cases.map((t) => [t.id, classifyMccBaseline(t)])), [cases]);
  const rules = useMemo(() => Object.fromEntries(cases.map((t) => [t.id, classifyRules({ ...t, employeeTitle: emp(t.employeeId)?.title })])), [cases]); // eslint-disable-line react-hooks/exhaustive-deps
  // Until a live run produces results, show the saved run (no API cost).
  const live = Object.keys(liveResults).length > 0 || running;
  const saved = useMemo(() => snapshotResults(), []);
  const usingSnapshot = !live && set !== "seed" && set !== "csv";
  const results: Record<Engine, Record<string, Classification | undefined>> = { mcc, rules, ai: usingSnapshot ? saved : liveResults };

  const runLive = async () => {
    setRunning(true);
    setFallbacks(0);
    const queue = [...cases];
    const work = async () => {
      while (queue.length) {
        const t = queue.shift()!;
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...t, employeeTitle: emp(t.employeeId)?.title }),
        }).then((r) => r.json());
        if (res.fallback) setFallbacks((f) => f + 1);
        else setLiveResults((c) => ({ ...c, [t.id]: res.classification }));
      }
    };
    await Promise.all(Array.from({ length: 4 }, work));
    setRunning(false);
  };

  return (
    <>
      <PageHeader
        title="Accuracy"
        subtitle="Labeled test sets, scored the same way for every engine: correct only if the treatment matches and the taxable amount is within $1."
        actions={
          <>
            <input ref={file} type="file" accept=".csv" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setCsv(parseCsv(await f.text()));
              setSet("csv");
              setLiveResults({});
            }} />
            <Button onClick={() => file.current?.click()}>
              <Upload className="size-4" /> Import labeled CSV
            </Button>
            <Button variant="primary" disabled={!s.ai.enabled || running || !cases.length} onClick={runLive} title={s.ai.enabled ? "Runs Fringe AI live on every case (uses API credits)" : "Live AI calls are off (demo mode)"}>
              {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run Fringe AI
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-line-2 bg-white p-0.5 text-[13px] sm:w-fit">
        {([
          ["unseen", `All unseen (${UNSEEN.length})`],
          ["holdout", `Held-out (${HOLDOUT.length})`],
          ["extended", `Pub 15-B scenarios (${EXTENDED.length})`],
          ["seed", `Demo workspace (${SEED_TRANSACTIONS.length})`],
          ["csv", `Imported (${csv.length})`],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => { setSet(k); setLiveResults({}); }} className={cx("rounded-md px-3 py-1.5 font-medium", set === k ? "bg-ink text-white" : "text-ink-2")}>
            {l}
          </button>
        ))}
      </div>
      <p className="mb-4 text-[13px] text-muted">
        {set === "unseen" && "Held-out + Pub 15-B scenarios: every case the keyword rules were never tuned on. Use this number in the pitch."}
        {set === "holdout" && "Written after the keyword rules were tuned and never used to tune them, so this measures generalization."}
        {set === "extended" && "50 scenarios written against the 2026 Pub 15-B / Pub 15 text (gift cards, awards, limits, mixed receipts, spouse travel, bicycle commuting…). Each label cites its page. Drafted by AI, so have a practitioner review it."}
        {set === "seed" && "The demo workspace's transactions. The keyword rules were tuned on these, so their score here is optimistic."}
        {set === "csv" && "Columns: merchant, mcc, amount, memo, receipt_lines (\"desc:12.50|desc2:30\"), truth_treatment (tax_free | taxable | partial | needs_info), truth_taxable."}
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(ENGINE_LABEL) as Engine[]).map((e) => {
          const m = metrics(cases, results[e]);
          return (
            <Card key={e} className={cx("p-4", e === "ai" && "border-ink")}>
              <div className="flex items-center justify-between gap-2 text-[13px] text-muted">
                <span>{ENGINE_LABEL[e]}</span>
                {e === "ai" && m.n > 0 && (
                  <span className={cx("rounded-md px-1.5 py-0.5 text-[11px] font-medium", usingSnapshot ? "bg-paper text-ink-2" : "bg-accent text-accent-ink")}>
                    {usingSnapshot ? `Saved run · ${SNAPSHOT.runAt}` : running ? "Live run…" : "Live run"}
                  </span>
                )}
              </div>
              {e === "ai" && m.n === 0 ? (
                <div className="mt-2 text-sm text-muted">{s.ai.enabled ? (running ? "Running…" : "Click “Run Fringe AI” to score Fringe AI on this set.") : "Live AI calls are off (demo mode)."}</div>
              ) : (
                <>
                  <div className="tabular mt-1 text-3xl font-semibold">{Math.round(m.acc * 100)}%</div>
                  <div className="text-[12px] text-muted">
                    exact accuracy · {m.n}/{cases.length} scored · treatment {Math.round(m.treat * 100)}%
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                    <div className="rounded-lg bg-paper px-2 py-1.5">
                      <div className="text-muted">Over-taxed employees</div>
                      <div className="tabular font-semibold">{money(m.over)}</div>
                    </div>
                    <div className="rounded-lg bg-paper px-2 py-1.5">
                      <div className="text-muted">Under-reported income</div>
                      <div className="tabular font-semibold">{money(m.under)}</div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>
      {fallbacks > 0 && <div className="mt-3 text-[13px] text-tax">{fallbacks} cases returned an error from the AI model and were left unscored.</div>}

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[12px] text-muted">
              <th className="px-4 py-2.5 font-medium">Case</th>
              <th className="py-2.5 font-medium">Ground truth</th>
              {(Object.keys(ENGINE_LABEL) as Engine[]).map((e) => (
                <th key={e} className="py-2.5 font-medium">{e === "mcc" ? "Status quo" : e === "rules" ? "Keyword rules" : "Fringe AI"}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.map((t) => (
              <tr key={t.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {t.merchant} <span className="tabular font-normal text-muted">{money(t.amount)}</span>
                  </div>
                  <div className="max-w-[260px] text-[12px] text-muted">{t.memo || "no memo"}{t.receipt ? ` · receipt: ${t.receipt.lines.map((l) => l.description).join(", ")}` : ""}</div>
                </td>
                <td className="py-3">
                  <TreatmentPill t={t.truth.treatment} />
                  {t.truth.taxableAmount > 0 && t.truth.treatment !== "taxable" && <div className="tabular mt-1 text-[12px] text-muted">{money(t.truth.taxableAmount)} taxable</div>}
                  {t.truth.note && t.truth.note !== "Imported" && <div className="mt-1 max-w-[220px] text-[11px] leading-snug text-muted">{t.truth.note}</div>}
                </td>
                {(Object.keys(ENGINE_LABEL) as Engine[]).map((e) => {
                  const c = results[e][t.id];
                  if (!c) return <td key={e} className="py-3 text-[12px] text-muted">{e === "ai" && running ? <Loader2 className="size-4 animate-spin" /> : "—"}</td>;
                  const ok = correct(c, t);
                  return (
                    <td key={e} className="py-3">
                      <div className="flex items-center gap-1.5">
                        {ok ? <Check className="size-4 text-free" /> : <X className="size-4 text-red-600" />}
                        <span className={cx("text-[13px]", !ok && "text-ink-2")}>{TREATMENT_LABEL[c.treatment]}</span>
                      </div>
                      {c.taxableAmount > 0 && c.treatment !== "taxable" && <div className="tabular pl-5 text-[12px] text-muted">{money(c.taxableAmount)} taxable</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
