// Real AI model outputs recorded from live calls to the deployed app on
// 2026-11-10 (model Opus 5.5). In demo mode (FRINGE_LIVE not "true")
// the app replays these instead of calling the API, so it costs nothing.
// Only outputs that were actually recorded are listed here. Nothing is made up.

import { chunkById, toCitation } from "./knowledge";
import type { Classification, Receipt } from "./types";

export interface ClassifyKeyInput {
  merchant: string;
  amount: number;
  memo: string;
  receipt: Receipt | null;
  employeeAnswer?: string;
}

export function recordKey(t: ClassifyKeyInput) {
  const lines = (t.receipt?.lines ?? []).map((l) => `${l.description}:${l.amount.toFixed(2)}`).join("|");
  return [t.merchant, t.amount.toFixed(2), t.memo.trim(), lines, (t.employeeAnswer ?? "").trim()].join("#").toLowerCase();
}

const cites = (...ids: string[]) => ids.map((id) => chunkById(id)).filter(Boolean).map((c) => toCitation(c!));

const RECORDED_CLASSIFICATIONS: { input: ClassifyKeyInput; output: Classification }[] = [
  {
    input: {
      merchant: "Amazon",
      amount: 512.48,
      memo: "home office setup",
      receipt: {
        merchant: "Amazon.com",
        lines: [
          { description: "Logitech MX Keys S wireless keyboard", amount: 129.99 },
          { description: "Ergonomic mesh office chair, lumbar support", amount: 302.49 },
          { description: "Mario Kart 8 Deluxe - Nintendo Switch", amount: 80.0 },
        ],
      },
    },
    output: {
      treatment: "partial",
      basis: "working_condition",
      taxableAmount: 80,
      confidence: 0.88,
      rationale:
        "The keyboard and ergonomic chair are home office equipment you need for your job, so they are tax-free working condition benefits under company policy. The Mario Kart game is a personal entertainment item with no business use, so its $80.00 cost is taxable income and will be reported to payroll (or you can repay it). Line items: Logitech MX Keys S wireless keyboard ($129.99) → tax-free; Ergonomic mesh office chair, lumbar support ($302.49) → tax-free; Mario Kart 8 Deluxe - Nintendo Switch ($80.00) → taxable.",
      citations: cites("pol-home-office", "irs-working-condition", "irs-general"),
      question: null,
      engine: "ai",
      model: "opus-5-5",
      retrieved: ["pol-home-office", "irs-working-condition", "irs-general"],
      classifiedAt: "2026-11-10T04:38:18.250Z",
    },
  },
];

const BY_KEY = new Map(RECORDED_CLASSIFICATIONS.map((r) => [recordKey(r.input), r.output]));

export function recordedClassification(t: ClassifyKeyInput): Classification | null {
  return BY_KEY.get(recordKey(t)) ?? null;
}

const norm = (q: string) => q.toLowerCase().replace(/[^a-z0-9$ ]/g, "").replace(/\s+/g, " ").trim();

const RECORDED_ANSWERS: Record<string, string> = {
  [norm("Is a $50 Amazon gift card for a work anniversary taxable?")]:
    "**Yes, the full $50 is taxable** and should be reported to payroll as imputed income.\n\n- **Not de minimis:** Gift cards are cash equivalents, so they're never excludable as de minimis, no matter how small the amount (Pub 15-B · De Minimis Benefits — cash equivalents).\n- **Not an achievement award:** Length-of-service awards can be tax-free only if they're *tangible personal property*. Gift cards and cash don't qualify (Pub 15-B · Achievement Awards).\n- **Company policy agrees:** Gift cards for recognition are allowed but \"always taxable and must be reported to payroll\" (Northwind Expense Policy §7.2).\n\n**Tax-free alternative:** Service anniversary awards are meant to be tangible items from the awards catalog, up to $400 (Northwind Expense Policy §7.2). Choosing a catalog item instead of a gift card would let the award be excluded from the employee's income under Pub 15-B · Achievement Awards.",
};

export function recordedAnswer(question: string): string | null {
  return RECORDED_ANSWERS[norm(question)] ?? null;
}
