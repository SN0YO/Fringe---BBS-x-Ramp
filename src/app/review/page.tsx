"use client";

import { Check, Clock, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { BASIS_LABEL, type Transaction } from "@/lib/types";
import { money } from "@/lib/payroll";
import { Avatar, Button, Card, Confidence, Empty, MerchantLogo, PageHeader, TreatmentPill, fmtDate } from "@/components/ui";

function ReviewCard({ t }: { t: Transaction }) {
  const s = useStore();
  const c = t.classification!;
  const e = s.employee(t.employeeId);
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <MerchantLogo name={t.merchant} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold">{t.merchant}</span>
            <span className="tabular font-semibold">{money(t.amount)}</span>
            <span className="text-[13px] text-muted">· {fmtDate(t.date)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
            <Avatar name={e.name} color={e.color} size={16} /> {e.name} · {t.memo ? `“${t.memo}”` : "no memo"}
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-paper p-3">
        <div className="flex flex-wrap items-center gap-2">
          <TreatmentPill t={c.treatment} />
          {c.basis !== "unknown" && <span className="text-[12px] text-ink-2">{BASIS_LABEL[c.basis]}</span>}
          <span className="ml-auto">
            <Confidence v={c.confidence} />
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{c.rationale}</p>
        {c.question && (
          <p className="mt-2 flex gap-1.5 text-[13px] text-info">
            <MessageCircleQuestion className="mt-0.5 size-3.5 shrink-0" /> Asked {e.name.split(" ")[0]}: “{c.question}”
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {s.ai.enabled && c.engine !== "claude" && (
          <Button size="sm" variant="ghost" onClick={() => s.classify(t.id)} disabled={s.busy[t.id]}>
            <Sparkles className="size-3.5" /> Ask Fringe AI
          </Button>
        )}
        <Button size="sm" onClick={() => s.select(t.id)}>
          Details
        </Button>
        {c.treatment !== "needs_info" && (
          <Button size="sm" variant="primary" onClick={() => s.approve(t.id)}>
            <Check className="size-3.5" /> Approve {c.taxableAmount > 0 ? `${money(c.taxableAmount)} taxable` : "as tax-free"}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function Review() {
  const s = useStore();
  const review = s.transactions.filter((t) => t.status === "in_review");
  const waiting = s.transactions.filter((t) => t.status === "awaiting_employee");
  return (
    <>
      <PageHeader
        title="Review queue"
        subtitle="Fringe only escalates what it isn't sure about. When Fringe is at least 85% sure, it approves automatically. Anything less comes here for a human, with a full audit trail."
        actions={
          review.length > 0 && (
            <Button variant="primary" onClick={() => review.forEach((t) => s.approve(t.id))}>
              <Check className="size-4" /> Approve all {review.length}
            </Button>
          )
        }
      />
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          Needs finance review <span className="tabular rounded-full bg-tax-bg px-2 text-[12px] text-tax">{review.length}</span>
        </h2>
        {review.length === 0 ? <Empty title="Nothing to review" sub="Fringe is confident about everything else." /> : <div className="grid gap-3 md:grid-cols-2">{review.map((t) => <ReviewCard key={t.id} t={t} />)}</div>}
      </section>
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Clock className="size-4" /> Waiting on employees <span className="tabular rounded-full bg-info-bg px-2 text-[12px] text-info">{waiting.length}</span>
        </h2>
        <p className="-mt-1 mb-3 text-[13px] text-muted">Instead of guessing, Fringe asked the cardholder in Ramp (push + Slack). Answers are re-classified automatically.</p>
        {waiting.length === 0 ? <Empty title="No open questions" /> : <div className="grid gap-3 md:grid-cols-2">{waiting.map((t) => <ReviewCard key={t.id} t={t} />)}</div>}
      </section>
    </>
  );
}
