export type Treatment = "tax_free" | "taxable" | "partial" | "needs_info";

export type Basis =
  | "working_condition" // IRC §132(d)
  | "de_minimis" // IRC §132(e)
  | "accountable_plan" // ordinary business expense, substantiated
  | "qualified_transportation" // IRC §132(f)
  | "educational_assistance" // IRC §127
  | "achievement_award" // IRC §74(c)
  | "cell_phone" // IRS Notice 2011-72
  | "taxable_cash_equivalent"
  | "taxable_wellness"
  | "taxable_personal"
  | "taxable_commuting"
  | "unknown";

export type TxStatus =
  | "auto_approved" // high-confidence, no human needed
  | "in_review" // low confidence -> finance queue
  | "awaiting_employee" // Fringe asked the employee a question
  | "approved" // human approved Fringe's call
  | "overridden" // human changed Fringe's call
  | "synced"; // posted to payroll

export interface Citation {
  source: "IRS Pub 15-B" | "IRS Pub 15" | "Company policy";
  url?: string;
  ref: string;
  excerpt: string;
}

export interface Classification {
  treatment: Treatment;
  basis: Basis;
  taxableAmount: number;
  confidence: number; // 0..1
  rationale: string;
  citations: Citation[];
  question: string | null; // question for the employee when context is missing
  engine: "claude" | "rules" | "mcc_baseline" | "human";
  model?: string;
  retrieved?: string[]; // ids of knowledge chunks retrieved for this decision
  classifiedAt: string;
}

export interface ReceiptLine {
  description: string;
  amount: number;
}

export interface Receipt {
  merchant: string;
  lines: ReceiptLine[];
  imageDataUrl?: string; // uploaded receipt image
}

export interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  payroll: "Gusto" | "Rippling";
  annualSalary: number;
  color: string;
}

export interface Transaction {
  id: string;
  employeeId: string;
  date: string; // ISO date
  merchant: string;
  mccCategory: string; // what the card network tells you
  amount: number;
  memo: string;
  receipt: Receipt | null;
  status: TxStatus;
  payPeriod: string; // id of pay period
  classification: Classification | null;
  employeeAnswer?: string;
  history: { at: string; actor: string; action: string }[];
}

export interface GroundTruth {
  treatment: Treatment;
  taxableAmount: number;
  basis: Basis;
  note: string;
}

export interface PayPeriod {
  id: string;
  label: string;
  start: string;
  end: string;
  payDate: string;
  status: "open" | "synced";
}

export const TREATMENT_LABEL: Record<Treatment, string> = {
  tax_free: "Tax-free",
  taxable: "Taxable",
  partial: "Partially taxable",
  needs_info: "Needs info",
};

export const BASIS_LABEL: Record<Basis, string> = {
  working_condition: "Working condition fringe · §132(d)",
  de_minimis: "De minimis fringe · §132(e)",
  accountable_plan: "Business expense · accountable plan",
  qualified_transportation: "Qualified transportation · §132(f)",
  educational_assistance: "Educational assistance · §127",
  achievement_award: "Employee achievement award · §74(c)",
  cell_phone: "Employer-provided cell phone · §132(d)/(e)",
  taxable_cash_equivalent: "Cash / cash equivalent (always taxable)",
  taxable_wellness: "Wellness / fitness benefit (taxable)",
  taxable_personal: "Personal expense (taxable)",
  taxable_commuting: "Personal commuting (taxable)",
  unknown: "Unclassified",
};

export const STATUS_LABEL: Record<TxStatus, string> = {
  auto_approved: "Auto-approved",
  in_review: "In review",
  awaiting_employee: "Awaiting employee",
  approved: "Approved",
  overridden: "Overridden",
  synced: "Synced to payroll",
};

export const AUTO_APPROVE_THRESHOLD = 0.85;
