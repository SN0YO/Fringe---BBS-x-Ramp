"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { money } from "@/lib/payroll";
import { Card, PageHeader, cx } from "@/components/ui";

type Msg = { role: "user" | "assistant"; content: string };

const FINANCE_PROMPTS = ["Why is the T-Mobile charge partially taxable?", "Which employees have taxable perks this pay period?", "Is a $50 Amazon gift card for a work anniversary taxable?", "What happens if we miss a taxable perk until year-end?"];
const EMPLOYEE_PROMPTS = ["Will my monitor purchase be taxed?", "Why is my gym membership taxable?", "Can I expense a standing desk tax-free?", "What does imputed income mean for my paycheck?"];

function render(text: string) {
  // Show legal shorthand in plain words ("§7.2" -> "Section 7.2").
  return text.replace(/§\s?/g, "Section ").split("\n").map((line, i) => (
    <p key={i} className={cx(line.trim() === "" && "h-2")}>
      {line.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((part, j) =>
        part.startsWith("**") ? <b key={j}>{part.slice(2, -2)}</b> : part.length > 2 && part.startsWith("*") && part.endsWith("*") ? <i key={j}>{part.slice(1, -1)}</i> : part,
      )}
    </p>
  ));
}

export default function Ask() {
  const s = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  // Braces matter: newer Chrome returns a Promise from scrollIntoView, and an
  // effect must not return anything but a cleanup function.
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const context = () => {
    const txs = s.role === "employee" ? s.transactions.filter((t) => t.employeeId === s.employeeId) : s.transactions;
    const who = s.role === "employee" ? `Viewer: employee ${s.employee(s.employeeId).name} (${s.employee(s.employeeId).title}).` : "Viewer: finance admin at Northwind Labs.";
    return (
      who +
      "\nTransactions (id | date | employee | merchant | amount | memo | decision | taxable | status):\n" +
      txs.map((t) => `${t.id} | ${t.date} | ${s.employee(t.employeeId).name} | ${t.merchant} | ${money(t.amount)} | ${t.memo || "-"} | ${t.classification?.treatment} (${t.classification?.basis}) | ${money(t.classification?.taxableAmount ?? 0)} | ${t.status}`).join("\n")
    );
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next = [...msgs, { role: "user" as const, content: text.trim() }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next, context: context() }) });
      const data = await res.json();
      setMsgs([...next, { role: "assistant", content: data.answer }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Couldn't reach Fringe. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const prompts = s.role === "employee" ? EMPLOYEE_PROMPTS : FINANCE_PROMPTS;
  return (
    <>
      <PageHeader title="Ask Fringe" subtitle="Ask instead of guessing. Answers are grounded in IRS Pub 15-B, your company policy, and your live Ramp data." />
      <Card className="flex min-h-[60vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent">
                <Sparkles className="size-5 text-accent-ink" />
              </span>
              <div className="mt-3 font-medium">What do you want to know about taxable benefits?</div>
              <div className="mt-5 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {prompts.map((p) => (
                  <button key={p} onClick={() => send(p)} className="rounded-xl border border-line px-3 py-2.5 text-left text-[13px] hover:bg-paper">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={cx("flex", m.role === "user" && "justify-end")}>
              <div className={cx("max-w-[85%] space-y-1 rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.role === "user" ? "bg-ink text-white" : "bg-paper")}>{render(m.content)}</div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" /> Checking Pub 15-B and policy…
            </div>
          )}
          <div ref={end} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-line p-3"
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about any purchase, perk or policy…" className="min-w-0 flex-1 rounded-xl border border-line-2 px-4 py-2.5 text-sm outline-none focus:border-ink" />
          <button disabled={!input.trim() || loading} className="flex size-10 items-center justify-center rounded-xl bg-ink text-white disabled:opacity-40" aria-label="Send">
            <ArrowUp className="size-4" />
          </button>
        </form>
      </Card>
    </>
  );
}
