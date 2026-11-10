import { chunkById, toCitation } from "./knowledge";
import type { Basis, Citation, Classification, Transaction, Treatment } from "./types";

export const LIMITS = {
  qualifiedParkingMonthly: 340,
  qualifiedTransitMonthly: 340,
  educationalAssistanceAnnual: 5250,
  phonePlanPolicyCap: 85,
  homeOfficeAnnual: 1000,
  wellnessMonthly: 100,
};

type TxInput = Pick<Transaction, "merchant" | "mccCategory" | "amount" | "memo" | "receipt" | "date"> & {
  employeeAnswer?: string;
  employeeTitle?: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function cite(...ids: string[]): Citation[] {
  return ids
    .map((id) => chunkById(id))
    .filter(Boolean)
    .map((c) => toCitation(c!));
}

/* ------------------------------------------------------------------ */
/*  Baseline: what finance teams do today — guess from the MCC alone.   */
/* ------------------------------------------------------------------ */

const MCC_TAX_FREE = new Set(["Electronics", "Software", "Office supplies", "Restaurants", "Airlines", "Lodging", "Rideshare", "Transit", "Telecom", "Education", "Professional associations", "Coworking", "Parking", "Wholesale"]);

export function classifyMccBaseline(tx: TxInput): Classification {
  const free = MCC_TAX_FREE.has(tx.mccCategory);
  return {
    treatment: free ? "tax_free" : "taxable",
    basis: free ? "accountable_plan" : "taxable_personal",
    taxableAmount: free ? 0 : tx.amount,
    confidence: 0.5,
    rationale: `Merchant category "${tx.mccCategory}" ${free ? "usually looks like a business expense" : "isn't on the safe list, so it is taxed to be safe"}. No memo or receipt was read.`,
    citations: [],
    question: null,
    engine: "mcc_baseline",
    classifiedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Fringe offline heuristics: reads memo + receipt lines.              */
/* ------------------------------------------------------------------ */

interface LineCall {
  treatment: "tax_free" | "taxable" | "unknown";
  basis: Basis;
  confidence: number;
  chunks: string[];
  why: string;
}

const has = (s: string, re: RegExp) => re.test(s);

function classifyLine(text: string, mcc: string): LineCall {
  const t = text.toLowerCase();
  const m = mcc.toLowerCase();

  if (has(t, /gift ?card|e-?gift|gift certificate|prepaid card|visa gift|giftcard/))
    return { treatment: "taxable", basis: "taxable_cash_equivalent", confidence: 0.97, chunks: ["irs-cash-equivalent", "pol-gifts"], why: "Gift cards are cash equivalents and are never de minimis" };
  if (has(t, /season ticket/))
    return { treatment: "taxable", basis: "taxable_personal", confidence: 0.9, chunks: ["irs-not-de-minimis"], why: "Season tickets are explicitly not de minimis" };
  if (has(t, /companion|spouse|partner ticket|\bwife\b|\bhusband\b|my kids|vacation|weekend|saturday|sunday/))
    return { treatment: "taxable", basis: "taxable_personal", confidence: 0.85, chunks: ["irs-accountable-plan", "pol-travel"], why: "Personal or family use with no business purpose" };
  if (has(t, /playstation|nintendo|xbox|switch game|mario|video game|console|dualsense|game controller|controller|\btv\b|television/))
    return { treatment: "taxable", basis: "taxable_personal", confidence: 0.9, chunks: ["irs-working-condition", "pol-home-office"], why: "Personal electronics are not work equipment" };
  if (has(t, /gym|fitness|equinox|classpass|peloton|yoga|pilates|wellness|massage|headspace|\bcalm\b|soulcycle|orangetheory|crossfit/) || m === "fitness")
    return { treatment: "taxable", basis: "taxable_wellness", confidence: 0.95, chunks: ["irs-athletic", "irs-not-de-minimis", "pol-wellness"], why: "Off-site fitness and wellness benefits are taxable" };
  if (has(t, /cooking|golf|painting|hobby|masterclass/))
    return { treatment: "taxable", basis: "taxable_personal", confidence: 0.75, chunks: ["irs-education", "pol-learning"], why: "Hobby/recreational classes are excluded from the education program" };
  if (has(t, /stipend/))
    return { treatment: "taxable", basis: "taxable_personal", confidence: 0.85, chunks: ["irs-nonaccountable", "pol-phone-internet"], why: "Flat, unsubstantiated stipends are wages" };
  if (has(t, /commute|to (the )?office|home to office/) && !has(t, /late|pm\b|after|incident|overtime/))
    return { treatment: "taxable", basis: "taxable_commuting", confidence: 0.85, chunks: ["irs-de-minimis-transport", "pol-commute"], why: "Rideshare between home and the office is personal commuting" };
  if (has(t, /transit|clipper|bart|metro|parking|garage/) || m === "transit" || m === "parking")
    return { treatment: "tax_free", basis: "qualified_transportation", confidence: 0.88, chunks: ["irs-transportation", "pol-commute"], why: "Qualified transportation fringe up to the monthly limit" };
  if (has(t, /verizon|t-mobile|at&t|phone plan|mobile plan|cell plan/) || m === "telecom")
    return { treatment: "tax_free", basis: "cell_phone", confidence: has(t, /on-?call|work|support/) ? 0.9 : 0.7, chunks: ["irs-cell-phone", "pol-phone-internet"], why: "Phone provided for noncompensatory business reasons" };
  if (has(t, /course|coursera|udemy|certification|tuition|textbook|specialization|bootcamp/) || m === "education")
    return { treatment: "tax_free", basis: "educational_assistance", confidence: 0.9, chunks: ["irs-education", "pol-learning"], why: "Covered by the written §127 educational assistance program" };
  if (has(t, /membership|dues|association|license|creative cloud|adobe|figma|software|subscription/) && !has(t, /netflix|spotify|hulu/))
    return { treatment: "tax_free", basis: "working_condition", confidence: 0.86, chunks: ["irs-working-condition"], why: "Professional dues and job software are deductible working-condition costs" };
  if (has(t, /monitor|keyboard|mouse|webcam|headset|headphone|airpods|dock|chair|desk|ipad|laptop|printer|ink|notebook|stand|pencil|applecare|home office/) || m === "office supplies")
    return { treatment: "tax_free", basis: "working_condition", confidence: has(t, /work|office|calls|design|review/) ? 0.92 : 0.8, chunks: ["irs-working-condition", "pol-home-office"], why: "Equipment used for the employee's job is a working-condition fringe" };
  if ((m === "clothing" && !has(t, /uniform|protective|logo|swag/)) || has(t, /outfit|jacket|shoes|apparel|dress|lululemon|nordstrom/))
    return { treatment: "taxable", basis: "taxable_personal", confidence: 0.72, chunks: ["irs-general", "irs-working-condition"], why: "Clothing suitable for everyday wear is personal" };
  if (has(t, /flight|airline|hotel|lodging|airbnb|offsite|qbr|onsite|conference|kubecon|workshop|sfo|jfk|trip/) || ["airlines", "lodging", "coworking"].includes(m))
    return has(t, /client|customer|offsite|qbr|onsite|conference|kubecon|workshop|business|trip|main cabin/)
      ? { treatment: "tax_free", basis: "accountable_plan", confidence: 0.9, chunks: ["irs-accountable-plan", "pol-travel"], why: "Substantiated business travel under an accountable plan" }
      : { treatment: "unknown", basis: "unknown", confidence: 0.45, chunks: ["irs-accountable-plan", "pol-travel"], why: "Travel without a stated business purpose" };
  if (has(t, /snack|party|celebration|cake|holiday gift|mug|logo|swag|team gift/))
    return { treatment: "tax_free", basis: "de_minimis", confidence: 0.86, chunks: ["irs-de-minimis", "pol-gifts"], why: "Occasional, low-value benefit is de minimis" };
  if (has(t, /late|overtime|deadline|release|incident|after \d|pm\b/))
    return { treatment: "tax_free", basis: "de_minimis", confidence: 0.84, chunks: ["irs-meals", "irs-de-minimis-transport", "pol-meals"], why: "Occasional meal or ride because of overtime is de minimis" };
  if (has(t, /client|customer|team lunch|team dinner|attendees|renewal|planning/))
    return { treatment: "tax_free", basis: "accountable_plan", confidence: 0.88, chunks: ["irs-accountable-plan", "pol-meals"], why: "Business meal with documented purpose" };

  return { treatment: "unknown", basis: "unknown", confidence: 0.35, chunks: ["irs-general"], why: "Not enough context to tell a work expense from a perk" };
}

function questionFor(tx: TxInput): string {
  const amt = `$${tx.amount.toFixed(2)}`;
  const day = new Date(tx.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (tx.mccCategory === "Lodging" || tx.mccCategory === "Airlines")
    return `Was your ${tx.merchant} charge of ${amt} on ${day} for a business trip? If so, what was the purpose and who traveled?`;
  if (tx.mccCategory === "Restaurants")
    return `Who was the ${tx.merchant} meal (${amt}) for, and what was the business reason?`;
  return `What did you buy at ${tx.merchant} for ${amt} on ${day}, and is it something you use for your job?`;
}

export function classifyRules(tx: TxInput): Classification {
  const context = [tx.memo, tx.employeeAnswer].filter(Boolean).join(" · ");
  const base = `${tx.merchant} ${context}`;
  const lines = tx.receipt?.lines ?? [];
  const now = new Date().toISOString();

  // Line-level classification when we have an itemized receipt.
  let calls: { amount: number; call: LineCall; desc: string }[];
  if (lines.length > 0) {
    calls = lines.map((l) => {
      const own = classifyLine(`${l.description} ${tx.merchant}`, tx.mccCategory);
      const call = own.treatment === "unknown" ? classifyLine(`${l.description} ${base}`, tx.mccCategory) : own;
      return { amount: l.amount, call, desc: l.description };
    });
    // Context (memo) can raise confidence on equipment lines.
    if (/work|office|calls|design/.test(context.toLowerCase()))
      calls.forEach((c) => c.call.basis === "working_condition" && (c.call.confidence = Math.max(c.call.confidence, 0.9)));
  } else {
    calls = [{ amount: tx.amount, call: classifyLine(base, tx.mccCategory), desc: tx.merchant }];
  }

  const unknown = calls.filter((c) => c.call.treatment === "unknown");
  const chunkIds = Array.from(new Set(calls.flatMap((c) => c.call.chunks)));

  if (unknown.length > 0) {
    return {
      treatment: "needs_info",
      basis: "unknown",
      taxableAmount: 0,
      confidence: Math.min(...calls.map((c) => c.call.confidence)),
      rationale: `${unknown[0].call.why}. Fringe will ask the employee instead of guessing.`,
      citations: cite(...chunkIds),
      question: questionFor(tx),
      engine: "rules",
      retrieved: chunkIds,
      classifiedAt: now,
    };
  }

  let taxable = round2(calls.filter((c) => c.call.treatment === "taxable").reduce((s, c) => s + c.amount, 0));
  const freeCalls = calls.filter((c) => c.call.treatment === "tax_free");
  let basis: Basis = (freeCalls[0] ?? calls[0]).call.basis;
  let extra = "";

  // Statutory / policy limits.
  if (basis === "qualified_transportation" && /park|garage/i.test(base) && tx.amount > LIMITS.qualifiedParkingMonthly) {
    taxable = round2(tx.amount - LIMITS.qualifiedParkingMonthly);
    extra = ` Amount exceeds the $${LIMITS.qualifiedParkingMonthly}/mo qualified parking limit; the $${taxable.toFixed(2)} excess is taxable.`;
  }
  if (basis === "qualified_transportation" && /transit|clipper|bart|metro/i.test(base) && tx.amount > LIMITS.qualifiedTransitMonthly) {
    taxable = round2(tx.amount - LIMITS.qualifiedTransitMonthly);
    extra = ` Amount exceeds the $${LIMITS.qualifiedTransitMonthly}/mo transit limit; the excess is taxable.`;
  }
  if (basis === "cell_phone" && tx.amount > LIMITS.phonePlanPolicyCap) {
    taxable = round2(tx.amount - LIMITS.phonePlanPolicyCap);
    extra = ` Policy covers up to $${LIMITS.phonePlanPolicyCap}/mo; the $${taxable.toFixed(2)} excess is treated as taxable.`;
  }

  const treatment: Treatment = taxable <= 0 ? "tax_free" : taxable >= tx.amount - 0.005 ? "taxable" : "partial";
  if (treatment === "taxable") basis = calls.find((c) => c.call.treatment === "taxable")!.call.basis;

  const confidence = Math.min(...calls.map((c) => c.call.confidence)) * (lines.length > 0 ? 1 : tx.memo || tx.employeeAnswer ? 1 : 0.92);

  const lineNote =
    lines.length > 1
      ? " Line items: " + calls.map((c) => `${c.desc} ($${c.amount.toFixed(2)}) → ${c.call.treatment === "taxable" ? "taxable" : "tax-free"}`).join("; ") + "."
      : "";

  return {
    treatment,
    basis,
    taxableAmount: Math.max(0, taxable),
    confidence: round2(confidence),
    rationale: `${calls[0].call.why}.${lineNote}${extra}`,
    citations: cite(...chunkIds),
    question: null,
    engine: "rules",
    retrieved: chunkIds,
    classifiedAt: now,
  };
}
