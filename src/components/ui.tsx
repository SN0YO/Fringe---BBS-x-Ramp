"use client";

import clsx from "clsx";
import type { TxStatus, Treatment } from "@/lib/types";
import { STATUS_LABEL, TREATMENT_LABEL } from "@/lib/types";
import { CheckCircle2, CircleDollarSign, HelpCircle, SplitSquareHorizontal } from "lucide-react";

export const cx = clsx;

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("rounded-2xl border border-line bg-card", className)}>{children}</div>;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "accent" | "danger"; size?: "sm" | "md" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap",
        size === "sm" ? "h-8 px-2.5 text-[13px]" : "h-9 px-3.5 text-sm",
        variant === "primary" && "bg-ink text-white hover:bg-ink-2",
        variant === "accent" && "bg-accent text-accent-ink hover:brightness-95",
        variant === "secondary" && "border border-line-2 bg-white text-ink hover:bg-paper",
        variant === "ghost" && "text-ink-2 hover:bg-paper",
        variant === "danger" && "border border-red-200 bg-white text-red-700 hover:bg-red-50",
        className,
      )}
    />
  );
}

const TREAT_STYLE: Record<Treatment, string> = {
  tax_free: "bg-free-bg text-free",
  taxable: "bg-tax-bg text-tax",
  partial: "bg-partial-bg text-partial",
  needs_info: "bg-info-bg text-info",
};
const TREAT_ICON: Record<Treatment, React.ComponentType<{ className?: string }>> = {
  tax_free: CheckCircle2,
  taxable: CircleDollarSign,
  partial: SplitSquareHorizontal,
  needs_info: HelpCircle,
};

export function TreatmentPill({ t, className }: { t: Treatment; className?: string }) {
  const Icon = TREAT_ICON[t];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", TREAT_STYLE[t], className)}>
      <Icon className="size-3.5" />
      {TREATMENT_LABEL[t]}
    </span>
  );
}

const STATUS_DOT: Record<TxStatus, string> = {
  auto_approved: "bg-free",
  approved: "bg-free",
  overridden: "bg-partial",
  in_review: "bg-tax",
  awaiting_employee: "bg-info",
  synced: "bg-ink",
};

export function StatusPill({ s }: { s: TxStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2 whitespace-nowrap">
      <span className={cx("size-1.5 rounded-full", STATUS_DOT[s])} />
      {STATUS_LABEL[s]}
    </span>
  );
}

export function Confidence({ v, showLabel = true }: { v: number; showLabel?: boolean }) {
  const pct = Math.round(v * 100);
  const color = v >= 0.85 ? "bg-free" : v >= 0.6 ? "bg-tax" : "bg-red-500";
  return (
    <span className="inline-flex items-center gap-2" title={`${pct}% confidence`}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-line">
        <span className={cx("block h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </span>
      {showLabel && <span className="tabular text-xs text-muted">{pct}%</span>}
    </span>
  );
}

const PALETTE = ["#111827", "#7c2d12", "#1e3a8a", "#14532d", "#581c87", "#831843", "#134e4a", "#713f12"];
export function MerchantLogo({ name, size = 32 }: { name: string; size?: number }) {
  const i = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTE.length;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white"
      style={{ width: size, height: size, background: PALETTE[i], fontSize: size * 0.42 }}
      aria-hidden
    >
      {name.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase()}
    </span>
  );
}

export function Avatar({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={cx("p-4", accent && "border-transparent bg-ink text-white")}>
      <div className={cx("text-[13px]", accent ? "text-white/70" : "text-muted")}>{label}</div>
      <div className="tabular mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className={cx("mt-1 text-xs", accent ? "text-white/60" : "text-muted")}>{sub}</div>}
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-2 px-6 py-14 text-center">
      <div className="text-sm font-medium">{title}</div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}

export function fmtDate(d: string) {
  return new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
