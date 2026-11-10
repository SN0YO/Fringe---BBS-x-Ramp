// Knowledge base used for retrieval-augmented classification.
//
// IRS chunks are plain-English SUMMARIES of IRS Publication 15-B (Employer's Tax
// Guide to Fringe Benefits) and related guidance, written for this prototype.
// They are not verbatim IRS text. Before production use, replace each `text`
// with the exact current-year language and have a payroll practitioner review it.
//
// Company-policy chunks describe a fictional company ("Northwind Labs") so the
// demo has a concrete benefits policy to reason against.

export interface KnowledgeChunk {
  id: string;
  source: "IRS Pub 15-B" | "Company policy" | "IRS Notice 2011-72" | "IRC";
  ref: string;
  title: string;
  text: string;
  keywords: string[];
}

export const IRS_CHUNKS: KnowledgeChunk[] = [
  {
    id: "irs-general",
    source: "IRS Pub 15-B",
    ref: "Section 1 · Fringe Benefit Overview",
    title: "General rule: fringe benefits are taxable unless excluded",
    text: "Any fringe benefit an employer provides is taxable and must be included in the recipient's pay unless the law specifically excludes it. Taxable fringe benefits are valued at fair market value, reduced by any amount the employee paid, and are subject to income tax withholding and FICA. The employer may treat taxable noncash fringe benefits as paid on any basis (pay period, quarter, etc.) as long as they are treated as paid at least annually.",
    keywords: ["taxable", "fringe", "general", "income", "wages", "fair market value", "w-2", "withholding"],
  },
  {
    id: "irs-working-condition",
    source: "IRS Pub 15-B",
    ref: "Section 2 · Working Condition Benefits",
    title: "Working condition fringe (IRC §132(d))",
    text: "Property or services provided to an employee are excluded from income to the extent the employee could deduct the cost as a business expense if they had paid for it themselves. The property must be used for the employee's work for the employer. Examples include equipment, tools, software, professional subscriptions and job-related education. If property is used partly for personal purposes, only the business-use portion is excluded; the personal-use portion is taxable.",
    keywords: ["monitor", "laptop", "keyboard", "mouse", "equipment", "tool", "software", "home office", "desk", "chair", "webcam", "headset", "dock", "work", "subscription", "conference", "license", "dues", "professional"],
  },
  {
    id: "irs-de-minimis",
    source: "IRS Pub 15-B",
    ref: "Section 2 · De Minimis (Minimal) Benefits",
    title: "De minimis fringe (IRC §132(e))",
    text: "A benefit is excluded if its value is so small and it is provided so infrequently that accounting for it would be unreasonable or administratively impracticable. Examples: occasional snacks or coffee, occasional parties or picnics, holiday gifts of property with low fair market value (such as a turkey), occasional theater or sporting event tickets, occasional meal money or local transportation fare provided because overtime work requires an extended workday, and items with a company logo of low value. Cash and cash equivalents (such as gift cards, gift certificates, or a charge card usable like cash) are never excludable as de minimis, regardless of amount. Season tickets and memberships are not de minimis.",
    keywords: ["snack", "coffee", "party", "holiday", "gift", "turkey", "flowers", "ticket", "occasional", "overtime", "late", "swag", "logo", "team", "celebration", "cake", "birthday", "gift card", "cash"],
  },
  {
    id: "irs-cash-equivalent",
    source: "IRS Pub 15-B",
    ref: "Section 2 · De Minimis Benefits — cash equivalents",
    title: "Gift cards and cash equivalents are always taxable",
    text: "Cash, gift cards, gift certificates and other cash-equivalent fringe benefits are never excludable as de minimis benefits, even if the amount is small. The full face value is included in the employee's wages. The only narrow exception is occasional meal money or transportation fare provided for overtime work.",
    keywords: ["gift card", "visa gift", "amazon gift", "gift certificate", "prepaid", "cash", "voucher", "egift", "e-gift", "stored value"],
  },
  {
    id: "irs-accountable-plan",
    source: "IRS Pub 15-B",
    ref: "Section 2 · Working Condition Benefits / Pub 15 accountable plans",
    title: "Business travel and meals under an accountable plan",
    text: "Amounts paid for ordinary and necessary business expenses (travel away from home, lodging, client or business meals, business-purpose transportation) are not wages when paid under an accountable plan: the expense has a business connection, it is substantiated within a reasonable time, and any excess is returned. Expenses for a spouse or family member who has no business purpose on the trip are taxable to the employee. Business meals with clients or during business travel are not taxable fringe benefits.",
    keywords: ["travel", "hotel", "flight", "airline", "lodging", "client", "dinner", "lunch", "meal", "business", "trip", "conference", "uber", "lyft", "taxi", "rental", "car", "substantiated", "receipt", "spouse", "family"],
  },
  {
    id: "irs-meals",
    source: "IRS Pub 15-B",
    ref: "Section 2 · Meals",
    title: "Meals: de minimis vs. taxable",
    text: "Occasional meals or meal money provided so an employee can work overtime are excludable as de minimis. Meals provided regularly, or meal stipends paid on a recurring basis without a business reason, are taxable wages. Meals furnished on business premises for the employer's convenience may be excludable. Personal meals with no business purpose (for example, a weekend family dinner) are taxable.",
    keywords: ["meal", "doordash", "ubereats", "grubhub", "dinner", "lunch", "overtime", "late", "weekend", "family", "groceries", "stipend", "food"],
  },
  {
    id: "irs-transportation",
    source: "IRS Pub 15-B",
    ref: "Section 2 · Transportation (Commuting) Benefits",
    title: "Qualified transportation fringe (IRC §132(f))",
    text: "Transit passes, commuter highway vehicle transportation, and qualified parking near work may be excluded up to the monthly limit for the year ($340 per month for 2026 for transit and for parking, each). Amounts above the monthly limit are taxable. Rideshare (Uber, Lyft) trips between home and the regular workplace are personal commuting and are taxable, unless they fall under the occasional overtime/unsafe-conditions rules. The qualified bicycle commuting reimbursement is no longer excludable.",
    keywords: ["commute", "commuting", "transit", "parking", "clipper", "bart", "metro", "train", "bus", "uber", "lyft", "home to office", "office", "monthly pass", "bike", "bicycle"],
  },
  {
    id: "irs-education",
    source: "IRS Pub 15-B",
    ref: "Section 2 · Educational Assistance",
    title: "Educational assistance (IRC §127) and job-related education",
    text: "Under a written educational assistance program, up to $5,250 per year of tuition, fees, books and supplies may be excluded from income; amounts over $5,250 are taxable unless they qualify as a working condition benefit (job-related education that maintains or improves skills for the current job). Courses involving sports, games or hobbies are not covered unless job-related.",
    keywords: ["course", "class", "tuition", "udemy", "coursera", "certification", "training", "education", "book", "textbook", "degree", "bootcamp", "masterclass", "workshop", "learning"],
  },
  {
    id: "irs-achievement",
    source: "IRS Pub 15-B",
    ref: "Section 2 · Achievement Awards",
    title: "Employee achievement awards (IRC §74(c))",
    text: "Tangible personal property given for length of service or safety achievement may be excluded up to $400 per employee per year ($1,600 under a qualified written plan). Cash, gift cards, vacations, meals, lodging, tickets and securities do not qualify as achievement awards and are taxable.",
    keywords: ["award", "anniversary", "service", "years", "recognition", "plaque", "watch", "achievement", "milestone"],
  },
  {
    id: "irs-athletic",
    source: "IRS Pub 15-B",
    ref: "Section 2 · Athletic Facilities",
    title: "Athletic facilities and gym memberships",
    text: "Only the use of an on-premises athletic facility operated by the employer is excludable. Memberships to off-site gyms, fitness studios, fitness apps or classes paid or reimbursed by the employer are taxable wages. Cash wellness stipends and reimbursements for general wellness (massage, meditation apps, fitness equipment for personal use) are taxable.",
    keywords: ["gym", "fitness", "equinox", "classpass", "peloton", "yoga", "pilates", "wellness", "massage", "spa", "headspace", "calm", "orangetheory", "soulcycle", "crossfit", "membership", "stipend", "health"],
  },
  {
    id: "irs-cell-phone",
    source: "IRS Notice 2011-72",
    ref: "Notice 2011-72 · Employer-provided cell phones",
    title: "Cell phones provided for business reasons",
    text: "When an employer provides an employee with a cell phone (or reimburses its cost) primarily for noncompensatory business reasons, such as needing to contact the employee for work, the business and incidental personal use are excludable as a working condition fringe and de minimis fringe. A phone provided to boost morale, attract talent or as extra compensation is taxable.",
    keywords: ["phone", "cell", "verizon", "t-mobile", "at&t", "att", "mobile", "wireless", "iphone", "android", "on-call", "plan"],
  },
  {
    id: "irs-clothing",
    source: "IRS Pub 15-B",
    ref: "Section 2 · Working Condition Benefits (uniforms) / De Minimis",
    title: "Clothing, uniforms and personal items",
    text: "Clothing suitable for everyday wear is a personal expense and taxable even if worn to work. Uniforms or protective gear required for the job and not suitable for ordinary wear are excludable. Low-value branded company items given occasionally are de minimis.",
    keywords: ["clothing", "shoes", "jacket", "apparel", "uniform", "nordstrom", "uniqlo", "nike", "lululemon", "protective", "swag", "hoodie", "t-shirt"],
  },
];

export const POLICY_CHUNKS: KnowledgeChunk[] = [
  {
    id: "pol-home-office",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy §3.1",
    title: "Home office equipment",
    text: "Remote and hybrid employees may purchase home office equipment required for their job on their Ramp card: monitors, keyboards, mice, docks, webcams, headsets, desks and ergonomic chairs. Combined limit: $1,000 per employee per year. Equipment remains company property. Personal electronics (gaming consoles, TVs, personal tablets, smart-home devices) are not covered.",
    keywords: ["monitor", "keyboard", "mouse", "dock", "webcam", "headset", "desk", "chair", "ergonomic", "home office", "remote", "equipment", "laptop stand"],
  },
  {
    id: "pol-wellness",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy §4.2",
    title: "Wellness stipend (taxable)",
    text: "Each employee receives up to $100 per month for wellness: gym or studio memberships, fitness classes, meditation apps and fitness equipment. Wellness purchases are a taxable benefit and are reported as imputed income through payroll each pay period.",
    keywords: ["gym", "fitness", "wellness", "yoga", "meditation", "classpass", "peloton", "equinox", "stipend", "massage", "headspace"],
  },
  {
    id: "pol-meals",
    source: "Company policy",
    ref: "Northwind Labs Expense Policy §2.4",
    title: "Meals",
    text: "Client meals and team meals with a documented business purpose are reimbursable business expenses. Employees working past 7pm on a deadline may expense one dinner up to $30, occasionally. Personal or weekend meals are not covered; if charged to the card they are treated as taxable or must be repaid.",
    keywords: ["meal", "dinner", "lunch", "client", "team", "doordash", "ubereats", "late", "deadline", "weekend"],
  },
  {
    id: "pol-travel",
    source: "Company policy",
    ref: "Northwind Labs Expense Policy §2.1",
    title: "Business travel",
    text: "Flights, lodging, ground transportation and meals while traveling for business are covered when a receipt and business purpose are submitted within 30 days. Travel costs for spouses, partners or family members are not covered and are taxable if charged to the card.",
    keywords: ["travel", "flight", "hotel", "airline", "lodging", "uber", "lyft", "rental", "trip", "spouse", "partner", "family"],
  },
  {
    id: "pol-learning",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy §5.1",
    title: "Learning & development",
    text: "Northwind maintains a written educational assistance program. Employees may spend up to $5,250 per year on courses, certifications, books and conferences. Courses do not need to be job-related to qualify under the program, but hobby or recreational classes (cooking, golf, painting) are excluded.",
    keywords: ["course", "certification", "book", "conference", "learning", "education", "tuition", "training", "udemy", "coursera"],
  },
  {
    id: "pol-phone-internet",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy §3.3",
    title: "Phone & internet",
    text: "Employees who must be reachable for work (on-call engineers, sales, support leads) may expense their monthly mobile plan up to $85. Northwind also pays a flat $50/month internet stipend to remote employees; because it is not substantiated, the internet stipend is taxable.",
    keywords: ["phone", "mobile", "verizon", "t-mobile", "at&t", "internet", "comcast", "xfinity", "wifi", "stipend", "on-call"],
  },
  {
    id: "pol-commute",
    source: "Company policy",
    ref: "Northwind Labs Benefits Policy §6.1",
    title: "Commuter benefits",
    text: "Northwind pays for transit passes and office parking up to the IRS monthly limit. Rideshare between home and the office is not a commuter benefit, except a ride home after 9pm when working late, which is allowed occasionally.",
    keywords: ["commute", "transit", "parking", "clipper", "bart", "uber", "lyft", "office", "late", "monthly"],
  },
  {
    id: "pol-gifts",
    source: "Company policy",
    ref: "Northwind Labs Expense Policy §7.2",
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
