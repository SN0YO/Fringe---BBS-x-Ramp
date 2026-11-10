"use client";

import { useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import type { ReceiptLine } from "@/lib/types";
import { money } from "@/lib/payroll";
import { Button } from "./ui";

async function toDataUrl(file: File, maxDim = 1600): Promise<string> {
  const raw = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  // Downscale large photos so requests stay small.
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = raw;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ReceiptUpload({ txId, amount, merchant }: { txId: string; amount: number; merchant: string }) {
  const s = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "reading" | "manual">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [lines, setLines] = useState<ReceiptLine[]>([{ description: "", amount }]);

  const onFile = async (f: File) => {
    setErr(null);
    setState("reading");
    try {
      const imageDataUrl = await toDataUrl(f);
      if (!s.ai.enabled) {
        setState("manual");
        setErr("Receipt photo reading needs a live Claude call, which is off in demo mode. Enter the line items instead.");
        return;
      }
      const res = await fetch("/api/receipt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageDataUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await s.attachReceipt(txId, { merchant: data.receipt.merchant || merchant, lines: data.receipt.lines, imageDataUrl });
      setState("idle");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read receipt");
      setState("manual");
    }
  };

  const total = lines.reduce((a, l) => a + (Number(l.amount) || 0), 0);

  return (
    <div className="mt-2">
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {state === "idle" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => input.current?.click()}>
            <Upload className="size-3.5" /> Upload receipt photo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setState("manual")}>
            Enter line items
          </Button>
        </div>
      )}
      {state === "reading" && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" /> Reading receipt with Claude vision…
        </div>
      )}
      {err && <div className="mt-2 text-[13px] text-tax">{err}</div>}
      {state === "manual" && (
        <div className="mt-2 space-y-2 rounded-xl border border-line p-3">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input value={l.description} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} placeholder="Item description" className="min-w-0 flex-1 rounded-lg border border-line-2 px-2 py-1.5 text-sm" />
              <input type="number" step="0.01" value={l.amount} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, amount: parseFloat(e.target.value) } : x)))} className="tabular w-24 rounded-lg border border-line-2 px-2 py-1.5 text-sm" />
              <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-muted hover:text-ink" aria-label="Remove line">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button onClick={() => setLines([...lines, { description: "", amount: 0 }])} className="flex items-center gap-1 text-[13px] text-ink-2">
              <Plus className="size-3.5" /> Add line
            </button>
            <span className={`tabular text-[13px] ${Math.abs(total - amount) > 0.01 ? "text-tax" : "text-muted"}`}>
              {money(total)} of {money(amount)}
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setState("idle")}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={lines.some((l) => !l.description.trim())}
              onClick={async () => {
                await s.attachReceipt(txId, { merchant, lines });
                setState("idle");
                setErr(null);
              }}
            >
              Attach & re-classify
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
