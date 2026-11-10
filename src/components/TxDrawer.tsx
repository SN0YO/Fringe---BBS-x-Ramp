"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, Loader2, Pencil, Sparkles, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { BASIS_LABEL, TREATMENT_LABEL, type Treatment } from "@/lib/types";
import { money, taxOn } from "@/lib/payroll";
import { Avatar, Button, Confidence, MerchantLogo, StatusPill, TreatmentPill, cx, fmtDate } from "./ui";
import { ReceiptUpload } from "./ReceiptUpload";

export function TxDrawer() {
  const s = useStore();
  const tx = s.transactions.find((t) => t.id === s.selectedId);
  const [overriding, setOverriding] = useState(false);
  const [ovT, setOvT] = useState<Treatment>("tax_free");
  const [ovAmt, setOvAmt] = useState("0");
  const [ovNote, setOvNote] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    setOverriding(false);
    setAnswer("");
    setOvNote("");
  }, [s.selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && s.select(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s]);

  if (!tx) return null;
  const c = tx.classification!;
  const emp = s.employee(tx.employeeId);
  const busy = s.busy[tx.id];
  const finance = s.role === "finance";
  const locked = tx.status === "synced";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20 animate-fadein" onClick={() => s.select(null)} />
      <aside className="relative flex h-full w-full max-w-[520px] flex-col overflow-y-auto bg-white shadow-2xl animate-slidein" role="dialog" aria-label={`${tx.merchant} transaction`}>
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start gap-3">
            <MerchantLogo name={tx.merchant} size={40} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{tx.merchant}</div>
              <div className="text-[13px] text-muted">
                {fmtDate(tx.date)} · {tx.mccCategory} · Card ••{(parseInt(tx.employeeId.slice(1)) * 1373).toString().slice(-4)}
              </div>
            </div>
            <div className="text-right">
              <div className="tabular text-lg font-semibold">{money(tx.amount)}</div>
              <StatusPill s={tx.status} />
            </div>
            <button onClick={() => s.select(null)} className="-mr-1 rounded-md p-1 text-muted hover:bg-paper" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex items-center gap-2 text-sm">
            <Avatar name={emp.name} color={emp.color} size={24} />
            <span className="font-medium">{emp.name}</span>
            <span className="text-muted">· {emp.title}</span>
          </div>

          {/* Decision */}
          <section className={cx("rounded-2xl border p-4", busy ? "border-line" : "border-line-2")}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[13px] font-medium">
                <Sparkles className="size-4" /> Fringe decision
              </div>
              <span className="rounded-md bg-paper px-1.5 py-0.5 text-[11px] text-muted">
                {c.engine === "claude" ? `Claude · ${c.model}${s.ai.enabled ? "" : " · recorded"}` : c.engine === "human" ? "Set by finance" : "Offline engine"}
              </span>
            </div>
            {busy ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Reading memo, receipt and policy…
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <TreatmentPill t={c.treatment} />
                  {c.basis !== "unknown" && <span className="text-[13px] text-ink-2">{BASIS_LABEL[c.basis]}</span>}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-[12px] text-muted">Taxable amount</div>
                    <div className="tabular font-semibold">{money(c.taxableAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[12px] text-muted">Tax-free amount</div>
                    <div className="tabular font-semibold">{c.treatment === "needs_info" ? "—" : money(tx.amount - c.taxableAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[12px] text-muted">Confidence</div>
                    <Confidence v={c.confidence} />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-2">{c.rationale}</p>
                {c.treatment !== "needs_info" && (
                  <div className="mt-3 rounded-lg bg-paper px-3 py-2 text-[13px] text-ink-2">
                    {c.taxableAmount > 0 ? (
                      <>Paycheck impact: about <b className="tabular">{money(taxOn(c.taxableAmount))}</b> extra withholding on {emp.name.split(" ")[0]}&apos;s next paycheck.</>
                    ) : (
                      <>Kept tax-free. Taxing this “to be safe” would have cost {emp.name.split(" ")[0]} about <b className="tabular">{money(taxOn(tx.amount))}</b>.</>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Question for employee */}
          {c.question && tx.status === "awaiting_employee" && (
            <section className="rounded-2xl border border-info/30 bg-info-bg/50 p-4">
              <div className="text-[13px] font-medium text-info">Fringe asked {finance ? emp.name.split(" ")[0] : "you"}</div>
              <p className="mt-1 text-sm">{c.question}</p>
              <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (answer.trim()) s.answer(tx.id, answer.trim());
                  }}
                >
                  <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={finance ? "Answer on the employee's behalf…" : "e.g. Noise-cancelling headset for customer calls"} className="min-w-0 flex-1 rounded-lg border border-line-2 bg-white px-3 py-2 text-sm outline-none focus:border-ink" />
                  <Button variant="primary" disabled={!answer.trim() || busy}>Send</Button>
                </form>
            </section>
          )}
          {tx.employeeAnswer && (
            <div className="rounded-xl border border-line px-3 py-2 text-[13px]">
              <span className="text-muted">Employee said:</span> “{tx.employeeAnswer}”
            </div>
          )}

          {/* Memo + receipt */}
          <section>
            <h3 className="mb-2 text-[13px] font-medium text-muted">Memo</h3>
            <div className="rounded-xl border border-line px-3 py-2 text-sm">{tx.memo || <span className="text-muted">No memo</span>}</div>
          </section>
          <section>
            <h3 className="mb-2 text-[13px] font-medium text-muted">Receipt</h3>
            {tx.receipt ? (
              <div className="overflow-hidden rounded-xl border border-line">
                {tx.receipt.imageDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tx.receipt.imageDataUrl} alt="Receipt" className="max-h-64 w-full bg-paper object-contain" />
                )}
                <table className="w-full text-sm">
                  <tbody>
                    {tx.receipt.lines.map((l, i) => (
                      <tr key={i} className="border-t border-line first:border-t-0">
                        <td className="px-3 py-2">{l.description}</td>
                        <td className="tabular px-3 py-2 text-right">{money(l.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-muted">No receipt attached.</div>
            )}
            {!locked && <ReceiptUpload txId={tx.id} amount={tx.amount} merchant={tx.merchant} />}
          </section>

          {/* Citations */}
          {c.citations.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-muted">
                <BookOpen className="size-3.5" /> Grounded in
              </h3>
              <div className="space-y-2">
                {c.citations.map((ct, i) => (
                  <div key={i} className="rounded-xl border border-line px-3 py-2">
                    <div className="text-[12px] font-medium">
                      {ct.source} · <span className="text-muted">{ct.ref}</span>
                    </div>
                    <div className="mt-0.5 text-[13px] text-ink-2">{ct.source === "Company policy" ? ct.excerpt : `“${ct.excerpt}”`}</div>
                    {ct.url && (
                      <a href={ct.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-muted underline-offset-2 hover:text-ink hover:underline">
                        Open {ct.source} (2026) ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Override */}
          {finance && overriding && (
            <section className="rounded-2xl border border-line-2 p-4">
              <div className="mb-3 text-[13px] font-medium">Override Fringe</div>
              <div className="grid grid-cols-2 gap-2">
                <select value={ovT} onChange={(e) => setOvT(e.target.value as Treatment)} className="rounded-lg border border-line-2 px-2 py-2 text-sm">
                  {(["tax_free", "taxable", "partial"] as Treatment[]).map((t) => (
                    <option key={t} value={t}>
                      {TREATMENT_LABEL[t]}
                    </option>
                  ))}
                </select>
                <input disabled={ovT !== "partial"} value={ovT === "tax_free" ? "0" : ovT === "taxable" ? tx.amount.toFixed(2) : ovAmt} onChange={(e) => setOvAmt(e.target.value)} className="tabular rounded-lg border border-line-2 px-2 py-2 text-sm disabled:bg-paper" aria-label="Taxable amount" />
              </div>
              <input value={ovNote} onChange={(e) => setOvNote(e.target.value)} placeholder="Reason (kept in the audit trail)" className="mt-2 w-full rounded-lg border border-line-2 px-3 py-2 text-sm" />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOverriding(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    s.override(tx.id, ovT, parseFloat(ovAmt) || 0, ovNote);
                    setOverriding(false);
                  }}
                >
                  Save override
                </Button>
              </div>
            </section>
          )}

          {/* History */}
          <section>
            <h3 className="mb-2 text-[13px] font-medium text-muted">Audit trail</h3>
            <ol className="space-y-2 border-l border-line pl-4">
              {tx.history.map((h, i) => (
                <li key={i} className="relative text-[13px]">
                  <span className="absolute -left-[21px] top-1.5 size-2 rounded-full border-2 border-white bg-line-2" />
                  <span className="font-medium">{h.actor}</span> <span className="text-ink-2">{h.action}</span>
                  <div className="text-[11px] text-muted">{new Date(h.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Footer actions */}
        {finance && !locked && (
          <div className="sticky bottom-0 mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white px-5 py-3">
            <Button variant="ghost" onClick={() => s.classify(tx.id)} disabled={busy}>
              <Sparkles className="size-4" /> {s.ai.enabled ? "Re-run Fringe AI" : "Re-run"}
            </Button>
            <Button onClick={() => setOverriding(true)} disabled={busy}>
              <Pencil className="size-4" /> Override
            </Button>
            {c.treatment !== "needs_info" && tx.status !== "approved" && (
              <Button variant="primary" onClick={() => s.approve(tx.id)} disabled={busy}>
                <Check className="size-4" /> Approve
              </Button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
