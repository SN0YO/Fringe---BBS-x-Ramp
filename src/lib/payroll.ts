import type { Employee, Transaction } from "./types";

// Supplemental-wage withholding assumptions for estimates shown in the UI.
export const TAX = {
  federalSupplemental: 0.22,
  socialSecurity: 0.062,
  medicare: 0.0145,
  stateEstimate: 0.066, // CA supplemental (non-bonus) rate, as an example
};
export const TOTAL_RATE = TAX.federalSupplemental + TAX.socialSecurity + TAX.medicare + TAX.stateEstimate;

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Gross-up so the employee nets the full benefit: G = A / (1 - r) - A */
export function grossUp(amount: number, rate = TOTAL_RATE) {
  return round2(amount / (1 - rate) - amount);
}

export function taxOn(amount: number, rate = TOTAL_RATE) {
  return round2(amount * rate);
}

export function isFinal(t: Transaction) {
  return ["auto_approved", "approved", "overridden", "synced"].includes(t.status);
}

export interface PayrollLine {
  employee: Employee;
  amount: number;
  transactions: Transaction[];
}

export function payrollLines(txs: Transaction[], employees: Employee[], period: string): PayrollLine[] {
  return employees
    .map((e) => {
      const mine = txs.filter((t) => t.employeeId === e.id && t.payPeriod === period && isFinal(t) && (t.classification?.taxableAmount ?? 0) > 0);
      return { employee: e, amount: round2(mine.reduce((s, t) => s + (t.classification?.taxableAmount ?? 0), 0)), transactions: mine };
    })
    .filter((l) => l.amount > 0);
}

export const money = (n: number, cents = true) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
