import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ALL_CHUNKS, chunkById, retrieve, toCitation } from "./knowledge";
import { LIMITS } from "./rules";
import type { Classification, Receipt } from "./types";

export const MODEL = process.env.FRINGE_MODEL || "claude-opus-5-5";
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORT = (process.env.FRINGE_EFFORT as Effort) || "medium";

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let _client: Anthropic | null = null;
function client() {
  if (!_client) _client = new Anthropic();
  return _client;
}

// Server-side refusal fallback: on a policy decline the API re-runs the request
// on a fallback model inside the same call.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

/* ------------------------------------------------------------------ */
/*  Frozen system prompt (cached): role + full knowledge base           */
/* ------------------------------------------------------------------ */

const KB_TEXT = ALL_CHUNKS.map(
  (c) =>
    `<doc id="${c.id}" source="${c.source}" ref="${c.ref}">\n<title>${c.title}</title>\n<text>${c.text}</text>` +
    (c.note ? `\n<application_note>${c.note}</application_note>` : "") +
    `\n</doc>`,
).join("\n");

const SYSTEM = `You are Fringe, a payroll-tax agent built into Ramp's corporate card platform. For each card transaction you decide whether the spend is a tax-free business expense / excludable fringe benefit, or a taxable fringe benefit that must be reported to payroll as imputed income, under IRS Publication 15-B and the company's benefits policy.

How to decide:
- Start from the general rule: everything is taxable unless a specific exclusion applies. But do NOT tax things "to be safe": over-taxing employees is an error just like under-taxing.
- Read every signal: merchant, merchant category, memo, itemized receipt lines, the employee's job, and any answer the employee gave you.
- When a receipt has several lines, judge each line. If some lines are taxable and others are not, the treatment is "partial" and taxable_amount is the sum of the taxable lines.
- Apply statutory and policy limits: qualified parking and transit are $${LIMITS.qualifiedParkingMonthly}/month each (excess taxable); the company phone-plan cap is $${LIMITS.phonePlanPolicyCap}/month for eligible roles (excess taxable); §127 educational assistance is $${LIMITS.educationalAssistanceAnnual}/year.
- Cash and cash equivalents (any gift card) are always taxable, regardless of amount.
- Policy violations (e.g., exceeding the home-office allowance) are not by themselves a tax issue. Mention them in the rationale but classify the tax treatment on its merits.
- If you genuinely cannot tell a work tool from a personal perk (no memo, no receipt, ambiguous merchant), choose "needs_info" and write one short, friendly question for the employee. Do not guess.
- confidence is your calibrated probability (0 to 1) that a payroll specialist would agree with your treatment and taxable amount. Use values below 0.85 when a reasonable specialist could disagree.
- cite only doc ids from the knowledge base below that actually support your decision.
- rationale: 1–3 plain-English sentences an employee would understand.

About the knowledge base: IRS docs quote IRS Publication 15-B (2026) and Publication 15 (2026) verbatim; "…" marks omitted text. An <application_note> is the company's guidance on applying that passage to card spend, not IRS text. Company policy docs describe this employer's benefits plans.

<knowledge_base>
${KB_TEXT}
</knowledge_base>`;

const TREATMENTS = ["tax_free", "taxable", "partial", "needs_info"] as const;
const BASES = [
  "working_condition", "de_minimis", "accountable_plan", "qualified_transportation", "educational_assistance",
  "achievement_award", "cell_phone", "taxable_cash_equivalent", "taxable_wellness", "taxable_personal",
  "taxable_commuting", "unknown",
] as const;

const ClassificationSchema = z.object({
  treatment: z.enum(TREATMENTS),
  basis: z.enum(BASES),
  taxable_amount: z.number(),
  confidence: z.number(),
  rationale: z.string(),
  line_items: z.array(
    z.object({ description: z.string(), amount: z.number(), taxable: z.boolean(), reason: z.string() }),
  ),
  citation_ids: z.array(z.string()),
  question_for_employee: z.string().nullable(),
});

export interface ClassifyInput {
  merchant: string;
  mccCategory: string;
  amount: number;
  date: string;
  memo: string;
  receipt: Receipt | null;
  employeeTitle?: string;
  employeeAnswer?: string;
}

function dataUrlToImage(dataUrl: string): Anthropic.Beta.BetaImageBlockParam | null {
  const m = /^data:(image\/(?:png|jpeg|gif|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { type: "image", source: { type: "base64", media_type: m[1] as "image/png", data: m[2] } };
}

export async function classifyWithClaude(tx: ClassifyInput): Promise<Classification> {
  const lines = tx.receipt?.lines?.length
    ? tx.receipt.lines.map((l) => `  - ${l.description}: $${l.amount.toFixed(2)}`).join("\n")
    : "  (no itemized receipt)";
  const query = [tx.merchant, tx.mccCategory, tx.memo, tx.employeeAnswer, ...(tx.receipt?.lines ?? []).map((l) => l.description)].join(" ");
  const retrieved = retrieve(query, 5).map((c) => c.id);

  const text = `Classify this Ramp card transaction.

Employee role: ${tx.employeeTitle ?? "unknown"}
Date: ${tx.date}
Merchant: ${tx.merchant}
Merchant category (MCC): ${tx.mccCategory}
Amount: $${tx.amount.toFixed(2)}
Memo: ${tx.memo || "(none)"}
Receipt lines:
${lines}
${tx.employeeAnswer ? `Employee's answer to Fringe's question: "${tx.employeeAnswer}"` : ""}
Most relevant knowledge-base docs (retrieved): ${retrieved.join(", ")}`;

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (tx.receipt?.imageDataUrl) {
    const img = dataUrlToImage(tx.receipt.imageDataUrl);
    if (img) content.push(img);
  }
  content.push({ type: "text", text });

  const res = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
    output_config: { effort: EFFORT, format: betaZodOutputFormat(ClassificationSchema) },
  });

  if (res.stop_reason === "refusal") throw new Error("The model declined to classify this transaction.");
  const out = res.parsed_output;
  if (!out) throw new Error(`No structured output (stop_reason: ${res.stop_reason}).`);

  const citations = out.citation_ids
    .map((id) => chunkById(id))
    .filter(Boolean)
    .map((c) => toCitation(c!));

  const lineNote =
    out.line_items.length > 1
      ? " Line items: " + out.line_items.map((l) => `${l.description} ($${l.amount.toFixed(2)}) → ${l.taxable ? "taxable" : "tax-free"}`).join("; ") + "."
      : "";

  const taxable = Math.max(0, Math.min(tx.amount, Math.round(out.taxable_amount * 100) / 100));
  return {
    treatment: out.treatment,
    basis: out.basis,
    taxableAmount: out.treatment === "tax_free" || out.treatment === "needs_info" ? 0 : out.treatment === "taxable" ? tx.amount : taxable,
    confidence: Math.max(0, Math.min(1, out.confidence)),
    rationale: out.rationale + lineNote,
    citations,
    question: out.treatment === "needs_info" ? out.question_for_employee ?? "Can you tell us what this purchase was for?" : null,
    engine: "claude",
    model: res.model,
    retrieved,
    classifiedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Receipt reading (multimodal)                                        */
/* ------------------------------------------------------------------ */

const ReceiptSchema = z.object({
  merchant: z.string(),
  date: z.string().nullable(),
  total: z.number(),
  lines: z.array(z.object({ description: z.string(), amount: z.number() })),
});

export async function readReceipt(imageDataUrl: string) {
  const img = dataUrlToImage(imageDataUrl);
  if (!img) throw new Error("Unsupported image format. Use PNG, JPEG, GIF or WebP.");
  const res = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    messages: [
      {
        role: "user",
        content: [
          img,
          {
            type: "text",
            text: "Read this receipt. Return the merchant, date (YYYY-MM-DD if visible), total charged, and each purchased item with its price. Fold tax, shipping and tip proportionally into the item amounts so the line amounts sum to the total.",
          },
        ],
      },
    ],
    output_config: { effort: "low", format: betaZodOutputFormat(ReceiptSchema) },
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined to read this receipt.");
  if (!res.parsed_output) throw new Error("Could not read the receipt.");
  return res.parsed_output;
}

/* ------------------------------------------------------------------ */
/*  Ask Fringe (grounded Q&A)                                           */
/* ------------------------------------------------------------------ */

export async function askFringe(
  messages: { role: "user" | "assistant"; content: string }[],
  context: string,
) {
  const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const docs = retrieve(last, 5);
  const res = await client().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    system: [
      { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
      {
        type: "text",
        text: `You are now answering questions in a chat panel inside Ramp, for employees and finance staff. Be concise (under 150 words unless asked for more), friendly and specific. Cite the policy or Pub 15-B section you rely on in parentheses, e.g. (Pub 15-B · De Minimis Benefits). You are not a substitute for a tax advisor; say so only when the question is genuinely outside Pub 15-B and the company policy.\n\nLive workspace data:\n${context}`,
      },
    ],
    messages: [
      ...messages.slice(0, -1),
      { role: "user", content: `${last}\n\n(Retrieved docs most relevant to this question: ${docs.map((d) => d.id).join(", ")})` },
    ],
    output_config: { effort: "low" },
  });
  if (res.stop_reason === "refusal") return "I can't help with that one. Try rephrasing, or ask your finance team.";
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
}
