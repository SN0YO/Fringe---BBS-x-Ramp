// Knowledge base used for retrieval-augmented classification.
//
// IRS chunks (src/lib/irs-2026.ts) quote IRS Publication 15-B (2026) and
// Publication 15 (2026) verbatim, with page references.
//
// Company-policy chunks describe a fictional company ("Northwind Labs") so the
// demo has a concrete benefits policy to reason against.

import { IRS_CHUNKS } from "./irs-2026";
export { IRS_CHUNKS };

export interface KnowledgeChunk {
  id: string;
  source: "IRS Pub 15-B" | "IRS Pub 15" | "Company policy";
  ref: string;
  url?: string;
  title: string;
  /** For IRS chunks: verbatim official text. */
  text: string;
  /** Fringe's application note (not IRS text). */
  note?: string;
  keywords: string[];
}

export const POLICY_CHUNKS: KnowledgeChunk[] = [
  {
    id: "pol-home-office",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy Section 3.1",
    title: "Home office equipment",
    text: "Remote and hybrid employees may purchase home office equipment required for their job on their Ramp card: monitors, keyboards, mice, docks, webcams, headsets, desks and ergonomic chairs. Combined limit: $1,000 per employee per year. Equipment remains company property. Personal electronics (gaming consoles, TVs, personal tablets, smart-home devices) are not covered.",
    keywords: ["monitor", "keyboard", "mouse", "dock", "webcam", "headset", "desk", "chair", "ergonomic", "home office", "remote", "equipment", "laptop stand"],
  },
  {
    id: "pol-wellness",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy Section 4.2",
    title: "Wellness stipend (taxable)",
    text: "Each employee receives up to $100 per month for wellness: gym or studio memberships, fitness classes, meditation apps and fitness equipment. Wellness purchases are a taxable benefit and are reported as imputed income through payroll each pay period.",
    keywords: ["gym", "fitness", "wellness", "yoga", "meditation", "classpass", "peloton", "equinox", "stipend", "massage", "headspace"],
  },
  {
    id: "pol-meals",
    source: "Company policy",
    ref: "Northwind Labs Expense Policy Section 2.4",
    title: "Meals",
    text: "Client meals and team meals with a documented business purpose are reimbursable business expenses. Employees working past 7pm on a deadline may expense one dinner up to $30, occasionally. Personal or weekend meals are not covered; if charged to the card they are treated as taxable or must be repaid.",
    keywords: ["meal", "dinner", "lunch", "client", "team", "doordash", "ubereats", "late", "deadline", "weekend"],
  },
  {
    id: "pol-travel",
    source: "Company policy",
    ref: "Northwind Labs Expense Policy Section 2.1",
    title: "Business travel",
    text: "Flights, lodging, ground transportation and meals while traveling for business are covered when a receipt and business purpose are submitted within 30 days. Travel costs for spouses, partners or family members are not covered and are taxable if charged to the card.",
    keywords: ["travel", "flight", "hotel", "airline", "lodging", "uber", "lyft", "rental", "trip", "spouse", "partner", "family"],
  },
  {
    id: "pol-learning",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy Section 5.1",
    title: "Learning & development",
    text: "Northwind maintains a written educational assistance program. Employees may spend up to $5,250 per year on courses, certifications, books and conferences. Courses do not need to be job-related to qualify under the program, but hobby or recreational classes (cooking, golf, painting) are excluded.",
    keywords: ["course", "certification", "book", "conference", "learning", "education", "tuition", "training", "udemy", "coursera"],
  },
  {
    id: "pol-phone-internet",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy Section 3.3",
    title: "Phone & internet",
    text: "Employees who must be reachable for work (on-call engineers, sales, support leads) may expense their monthly mobile plan up to $85. Northwind also pays a flat $50/month internet stipend to remote employees; because it is not substantiated, the internet stipend is taxable.",
    keywords: ["phone", "mobile", "verizon", "t-mobile", "at&t", "internet", "comcast", "xfinity", "wifi", "stipend", "on-call"],
  },
  {
    id: "pol-commute",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy Section 6.1",
    title: "Commuter benefits",
    text: "Northwind pays for transit passes and office parking up to the IRS monthly limit. Rideshare between home and the office is not a commuter benefit, except a ride home after 9pm when working late, which is allowed occasionally.",
    keywords: ["commute", "transit", "parking", "clipper", "bart", "uber", "lyft", "office", "late", "monthly"],
  },
  {
    id: "pol-gifts",
    source: "Company policy",
    ref: "Northwind Labs Expense Policy Section 7.2",
    title: "Gifts, celebrations and awards",
    text: "Managers may buy occasional team celebrations (cake, snacks, small team outings) and low-value holiday gifts. Gift cards to employees are allowed for recognition but are always taxable and must be reported to payroll. Service anniversary awards are tangible items chosen from the awards catalog, up to $400.",
    keywords: ["gift", "gift card", "celebration", "cake", "snacks", "holiday", "award", "anniversary", "recognition", "team", "outing"],
  },
];

export const ALL_CHUNKS: KnowledgeChunk[] = [...IRS_CHUNKS, ...POLICY_CHUNKS];

export function chunkById(id: string): KnowledgeChunk | undefined {
  return ALL_CHUNKS.find((c) => c.id === id);
}

const STOP = new Set(["the", "a", "an", "for", "and", "of", "to", "in", "on", "my", "with", "at", "is", "it", "this", "from", "i", "we", "our", "x"]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9&@\-\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * Lightweight lexical retrieval (keyword overlap + BM25-ish term weighting).
 * Good enough for a small, curated corpus; swap for embeddings in production.
 */
export function retrieve(query: string, k = 6): KnowledgeChunk[] {
  const q = query.toLowerCase();
  const qTokens = new Set(tokenize(query));
  const scored = ALL_CHUNKS.map((c) => {
    let score = 0;
    for (const kw of c.keywords) {
      if (kw.includes(" ") ? q.includes(kw) : qTokens.has(kw)) score += 3;
    }
    const body = tokenize(c.title + " " + c.text);
    const bodySet = new Set(body);
    for (const t of qTokens) if (bodySet.has(t)) score += 0.5;
    return { c, score };
  });
  const top = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  const picked = top.slice(0, k).map((s) => s.c);
  // Always ground in the general rule.
  if (!picked.find((c) => c.id === "irs-general")) picked.push(chunkById("irs-general")!);
  return picked;
}

/** Citation shown in the UI: the opening of the verbatim passage plus a link. */
export function toCitation(c: KnowledgeChunk) {
  const first = c.text.split(" … ")[0];
  const sentences = first.match(/[^.]+(\.|$)/g) ?? [first];
  const excerpt = sentences.slice(0, 2).join("").trim();
  return { source: c.source, ref: c.ref, url: c.url, excerpt };
}
