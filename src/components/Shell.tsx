"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, FlaskConical, Inbox, LayoutGrid, MessageSquare, ReceiptText, RotateCcw, Send, Sparkles, UserRound, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Avatar, cx, modelName } from "./ui";
import { TxDrawer } from "./TxDrawer";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-ink">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path d="M5 19 L12 5 L19 19" fill="none" stroke="#e4f222" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Fringe</span>
      <span className="rounded-md border border-line-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">for Ramp</span>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const s = useStore();
  const reviewCount = s.transactions.filter((t) => t.status === "in_review" || t.status === "awaiting_employee").length;
  const me = s.employee(s.employeeId);
  const myQuestions = s.transactions.filter((t) => t.employeeId === s.employeeId && t.status === "awaiting_employee").length;

  const finance = [
    { href: "/", label: "Overview", icon: LayoutGrid },
    { href: "/review", label: "Review queue", icon: Inbox, badge: reviewCount },
    { href: "/transactions", label: "Transactions", icon: ReceiptText },
    { href: "/payroll", label: "Payroll sync", icon: Send },
    { href: "/policy", label: "Policy & IRS 15-B", icon: BookOpen },
    { href: "/eval", label: "Accuracy", icon: FlaskConical },
    { href: "/ask", label: "Ask Fringe", icon: MessageSquare },
  ];
  const employee = [
    { href: "/employee", label: "My Fringe", icon: UserRound, badge: myQuestions },
    { href: "/ask", label: "Ask Fringe", icon: MessageSquare },
  ];
  const nav = s.role === "finance" ? finance : employee;

  const switchRole = (role: "finance" | "employee") => {
    s.setRole(role);
    s.select(null);
    router.push(role === "finance" ? "/" : "/employee");
  };

  return (
    <div className="min-h-dvh lg:flex">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-paper px-3 py-4 lg:flex">
        <div className="px-2 pb-5">
          <Logo />
        </div>
        <div className="mb-4 grid grid-cols-2 rounded-lg border border-line-2 bg-white p-0.5 text-[13px]">
          {(["finance", "employee"] as const).map((r) => (
            <button key={r} onClick={() => switchRole(r)} className={cx("rounded-md py-1.5 font-medium capitalize", s.role === r ? "bg-ink text-white" : "text-ink-2 hover:bg-paper")}>
              {r === "finance" ? "Finance" : "Employee"}
            </button>
          ))}
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cx("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", active ? "bg-white font-medium shadow-[0_0_0_1px_var(--color-line)]" : "text-ink-2 hover:bg-white/70")}>
                <n.icon className="size-4" />
                <span className="flex-1">{n.label}</span>
                {!!n.badge && <span className="tabular rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">{n.badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <AiBadge />
          {s.role === "employee" ? (
            <select value={s.employeeId} onChange={(e) => s.setEmployeeId(e.target.value)} className="w-full rounded-lg border border-line-2 bg-white px-2 py-1.5 text-[13px]" aria-label="Viewing as employee">
              {s.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          ) : null}
          <div className="flex items-center gap-2 px-1">
            {s.role === "employee" ? <Avatar name={me.name} color={me.color} /> : <Avatar name="Finance Admin" color="#121212" />}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-medium">{s.role === "employee" ? me.name : "Alex Rivera"}</div>
              <div className="truncate text-[11px] text-muted">{s.role === "employee" ? me.title : "Controller · Northwind Labs"}</div>
            </div>
            <button title="Reset demo data" onClick={s.reset} className="rounded-md p-1 text-muted hover:bg-white hover:text-ink">
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <select value={s.role} onChange={(e) => switchRole(e.target.value as "finance" | "employee")} className="rounded-lg border border-line-2 bg-white px-2 py-1 text-[13px]">
            <option value="finance">Finance</option>
            <option value="employee">Employee</option>
          </select>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {nav.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cx("shrink-0 rounded-full px-3 py-1 text-[13px]", active ? "bg-ink text-white" : "bg-white text-ink-2")}>
                {n.label}
                {!!n.badge && ` · ${n.badge}`}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>

      <TxDrawer />

      {s.lastError && (
        <div className="fixed bottom-4 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg animate-fadein">
          <span>
            Fringe AI fell back to the offline engine: <span className="text-white/70">{s.lastError}</span>
          </span>
          <button onClick={s.clearError} aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function AiBadge() {
  const { ai } = useStore();
  if (!ai.checked) return null;
  return ai.enabled ? (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-2 text-[12px]">
      <Sparkles className="size-3.5 text-ink" />
      <div className="leading-tight">
        <div className="font-medium">Fringe AI connected</div>
        <div className="text-muted">{modelName(ai.model)}</div>
      </div>
    </div>
  ) : (
    <div className="rounded-lg border border-dashed border-line-2 bg-white px-2.5 py-2 text-[12px] leading-tight">
      <div className="font-medium">Demo mode · no API cost</div>
      <div className="text-muted">Recorded AI results + offline engine. Set FRINGE_LIVE=true for live AI.</div>
    </div>
  );
}
