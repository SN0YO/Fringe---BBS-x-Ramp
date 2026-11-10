"use client";

import { useState } from "react";
import { Loader2, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { LIMITS } from "@/lib/rules";
import type { Transaction } from "@/lib/types";
import { money, round2, taxOn } from "@/lib/payroll";
import { Button, Card, Empty, MerchantLogo, PageHeader, TreatmentPill, fmtDate } from "@/components/ui";

const QUICK = ["It's work equipment I use for my job", "Client / business meal", "Business travel", "It was personal, so tax it"];

function Question({ t }: { t: Transaction }) {
  const s = useStore();
  const [a, setA] = useState("");
  const busy = s.busy[t.id];
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <MerchantLogo name={t.merchant} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2">
            <span className="font-semibold">{t.merchant}</span>
            <span className="tabular font-semibold">{money(t.amount)}</span>
          </div>
          <div className="text-[13px] text-muted">{fmtDate(t.date)}</div>
        </div>
      </div>
      <p className="mt-3 flex gap-2 text-sm">
        <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-info" />
        {t.classification!.question}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button key={q} disabled={busy} onClick={() => setA(q)} className="rounded-full border border-line-2 px-2.5 py-1 text-[12px] hover:bg-paper">
            {q}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (a.trim()) s.answer(t.id, a.trim());
        }}
      >
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Tell Fringe what it was for…" className="min-w-0 flex-1 rounded-lg border border-line-2 px-3 py-2 text-sm outline-none focus:border-ink" />
        <Button variant="primary" disabled={!a.trim() || busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Send"}
        </Button>
      </form>
      <button onClick={() => s.select(t.id)} className="mt-2 text-[12px] text-ink-2 underline-offset-2 hover:underline">
        or upload the receipt instead
      </button>
    </Card>
  );
}

function Balance({ label, used, limit, note }: { label: string; used: number; limit: number; note: string }) {
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular text-ink-2">
          {money(used, false)} / {money(limit, false)}
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-paper">
        <div className={`h-full rounded-full ${used > limit ? "bg-tax" : "bg-ink"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[12px] text-muted">{note}</div>
    </div>
  );
}

export default function EmployeePortal() {
  const s = useStore();
  const me = s.employee(s.employeeId);
  const mine = s.transactions.filter((t) => t.employeeId === me.id).sort((a, b) => b.date.localeCompare(a.date));
  const period = mine.filter((t) => t.payPeriod === s.currentPeriod);
  const questions = mine.filter((t) => t.status === "awaiting_employee");
  const keptFree = round2(period.filter((t) => t.classification!.treatment !== "needs_info").reduce((a, t) => a + (t.amount - t.classification!.taxableAmount), 0));
  const taxable = round2(period.reduce((a, t) => a + t.classification!.taxableAmount, 0));
  const sumBasis = (b: string[]) => mine.filter((t) => b.includes(t.classification!.basis)).reduce((a, t) => a + t.amount, 0);
  const pd = s.periods.find((p) => p.id === s.currentPeriod)!;

  return (
    <>
      <PageHeader title={`Hi ${me.name.split(" ")[0]}`} subtitle="Here's how your Ramp card spend shows up on your paycheck. Fringe reads every receipt so you're never taxed for a work tool." />

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="border-transparent bg-ink p-5 text-white lg:col-span-2">
          <div className="flex items-center gap-2 text-[13px] text-white/70">
            <ShieldCheck className="size-4 text-accent" /> Kept tax-free this pay period
          </div>
          <div className="tabular mt-2 text-4xl font-semibold tracking-tight">{money(keptFree)}</div>
          <div className="mt-2 text-sm text-white/70">
            That&apos;s about <b className="text-accent">{money(taxOn(keptFree))}</b> you would have lost to withholding if finance had taxed everything to be safe.
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[13px] text-muted">Taxable perks on your {new Date(pd.payDate + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} paycheck</div>
          <div className="tabular mt-2 text-2xl font-semibold">{money(taxable)}</div>
          <div className="mt-1 text-[13px] text-muted">≈ {money(taxOn(taxable))} extra withholding. Added as imputed income, no cash taken out.</div>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">Fringe has {questions.length || "no"} question{questions.length === 1 ? "" : "s"} for you</h2>
        {questions.length === 0 ? <Empty title="You're all caught up" sub="Nothing needs your input right now." /> : <div className="grid gap-3 md:grid-cols-2">{questions.map((t) => <Question key={t.id} t={t} />)}</div>}
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-line px-5 py-4 font-semibold">My card activity</div>
          <div className="divide-y divide-line">
            {mine.map((t) => (
              <button key={t.id} onClick={() => s.select(t.id)} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-paper/60">
                <MerchantLogo name={t.merchant} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{t.merchant}</span>
                    {s.busy[t.id] ? <Loader2 className="size-3.5 animate-spin" /> : <TreatmentPill t={t.classification!.treatment} />}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[13px] text-muted">{t.classification!.rationale}</div>
                </div>
                <div className="text-right">
                  <div className="tabular text-sm font-medium">{money(t.amount)}</div>
                  <div className="text-[12px] text-muted">{fmtDate(t.date)}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="h-fit space-y-5 p-5">
          <div className="font-semibold">Benefit balances · 2026</div>
          <Balance label="Home office equipment" used={mine.filter((t) => t.classification!.basis === "working_condition" && /monitor|chair|keyboard|webcam|desk|airpods|ipad|dock|headset|home office/i.test(t.memo + JSON.stringify(t.receipt ?? ""))).reduce((a, t) => a + t.amount - t.classification!.taxableAmount, 0)} limit={LIMITS.homeOfficeAnnual} note="Tax-free working-condition fringe (Section 132(d))" />
          <Balance label="Learning & development" used={sumBasis(["educational_assistance"])} limit={LIMITS.educationalAssistanceAnnual} note="Tax-free up to $5,250/yr under Section 127" />
          <Balance label="Wellness (this month)" used={period.filter((t) => t.classification!.basis === "taxable_wellness").reduce((a, t) => a + t.amount, 0)} limit={LIMITS.wellnessMonthly} note="Taxable benefit, reported through payroll" />
        </Card>
      </div>
    </>
  );
}
