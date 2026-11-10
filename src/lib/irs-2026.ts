// Official IRS text, 2026 editions.
//
// `text` is quoted VERBATIM from:
//   - IRS Publication 15-B (2026), Employer's Tax Guide to Fringe Benefits
//     https://www.irs.gov/pub/irs-pdf/p15b.pdf
//   - IRS Publication 15 (2026), (Circular E) Employer's Tax Guide
//     https://www.irs.gov/pub/irs-pdf/p15.pdf
// Passages are excerpted (marked with "…" where text is omitted); only line-wrap
// hyphenation from the PDF was removed. Page numbers refer to the PDF editions.
//
// `note` is NOT IRS text. It is Fringe's application note explaining how the
// passage is applied to corporate-card spend. It is shown separately in the UI.

import type { KnowledgeChunk } from "./knowledge";

const P15B = "https://www.irs.gov/pub/irs-pdf/p15b.pdf";
const P15 = "https://www.irs.gov/pub/irs-pdf/p15.pdf";

export const IRS_CHUNKS: KnowledgeChunk[] = [
  {
    id: "irs-general",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §1 · Are Fringe Benefits Taxable? · p. 3",
    url: P15B,
    title: "General rule: fringe benefits are taxable unless excluded",
    text: "Any fringe benefit you provide is taxable and must be included in the recipient’s pay unless the law specifically excludes it. Section 2 discusses the exclusions that apply to certain fringe benefits. Any benefit not excluded under the rules discussed in section 2 is taxable. … You must include in a recipient’s pay the amount by which the value of a fringe benefit is more than the sum of the following amounts. • Any amount the law excludes from pay. • Any amount the recipient paid for the benefit. … If the recipient of a taxable fringe benefit is your employee, the benefit is generally subject to employment taxes and must be reported on Form W-2, Wage and Tax Statement.",
    keywords: ["taxable", "fringe", "general", "income", "wages", "fair market value", "w-2", "withholding", "perk", "benefit"],
  },
  {
    id: "irs-working-condition",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Working Condition Benefits · pp. 23–24",
    url: P15B,
    title: "Working condition benefits",
    text: "This exclusion applies to property and services you provide to an employee so that the employee can perform their job. It applies to the extent the cost of the property or services would be allowable as a business expense or depreciation expense deduction to the employee if they had paid for it. The employee must meet any substantiation requirements that apply to the deduction. Examples of working condition benefits include an employee’s use of a company car for business, an employer-provided cell phone provided primarily for noncompensatory business purposes (discussed earlier), and job-related education provided to an employee. This exclusion also applies to a cash payment you provide for an employee’s expenses for a specific or prearranged business activity if such expenses would otherwise be allowable as a business expense or depreciation expense deduction to the employee. You must require the employee to verify that the payment is actually used for those expenses and to return any unused part of the payment.",
    note: "Applied to card spend: equipment, software, supplies and professional dues the employee needs to do their job (a monitor, keyboard, design software, a professional membership) are excluded. When one purchase mixes work and personal items, only the work portion is excluded.",
    keywords: ["monitor", "laptop", "keyboard", "mouse", "equipment", "tool", "software", "home office", "desk", "chair", "webcam", "headset", "dock", "work", "subscription", "conference", "license", "dues", "professional", "job"],
  },
  {
    id: "irs-de-minimis",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · De Minimis (Minimal) Benefits · p. 10",
    url: P15B,
    title: "De minimis (minimal) benefits",
    text: "You can exclude the value of a de minimis benefit you provide to an employee from the employee’s wages. A de minimis benefit is any property or service you provide to an employee that has so little value (taking into account how frequently you provide similar benefits to your employees) that accounting for it would be unreasonable or administratively impracticable. … Examples of de minimis benefits include the following. … • Holiday or birthday gifts, other than cash, with a low fair market value (FMV). Also, flowers or fruit or similar items provided to employees under special circumstances (for example, on account of illness, a family crisis, or outstanding performance). … • Certain meals. … • Occasional parties or picnics for employees and their guests. • Occasional tickets for theater or sporting events. • Certain transportation fare.",
    keywords: ["snack", "coffee", "party", "holiday", "gift", "turkey", "flowers", "fruit", "ticket", "occasional", "overtime", "late", "swag", "logo", "team", "celebration", "cake", "birthday", "illness", "baby"],
  },
  {
    id: "irs-cash-equivalent",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · De Minimis (Minimal) Benefits · p. 10",
    url: P15B,
    title: "Cash and cash equivalents are never de minimis",
    text: "Cash and cash equivalent fringe benefits (for example, gift certificates, gift cards, and the use of a charge card or credit card), no matter how little, are never excludable as a de minimis benefit. However, meal money and local transportation fare, if provided on an occasional basis and because of overtime work, may be excluded, as discussed later.",
    keywords: ["gift card", "visa gift", "amazon gift", "gift certificate", "prepaid", "cash", "voucher", "egift", "e-gift", "stored value", "giftcard"],
  },
  {
    id: "irs-not-de-minimis",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · De Minimis (Minimal) Benefits · p. 10",
    url: P15B,
    title: "Benefits that aren’t de minimis",
    text: "Some examples of benefits that aren’t excludable as de minimis fringe benefits are season tickets to sporting or theatrical events; the commuting use of an employer-provided automobile or other vehicle more than 1 day a month; membership in a private country club or athletic facility, regardless of the frequency with which the employee uses the facility; and use of employer-owned or -leased facilities (such as an apartment, hunting lodge, boat, etc.) for a weekend. If a benefit provided to an employee doesn’t qualify as de minimis (for example, the frequency exceeds a limit described earlier), then generally the entire benefit must be included in income.",
    keywords: ["season tickets", "season", "membership", "country club", "athletic", "gym", "weekend", "lodge", "boat"],
  },
  {
    id: "irs-meals",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Meals · De Minimis Meals · p. 18",
    url: P15B,
    title: "De minimis meals",
    text: "You can exclude any occasional meal you provide to an employee if it has so little value (taking into account how frequently you provide meals to your employees) that accounting for it would be unreasonable or administratively impracticable. The exclusion applies, for example, to the following items. • Coffee, doughnuts, or soft drinks. • Occasional meals or meal money provided to enable an employee to work overtime. However, the exclusion doesn’t apply to meal money figured on the basis of hours worked (for example, $2.00 per hour for each hour over 8 hours), or meals or meal money provided on a regular or routine basis. • Occasional parties or picnics for employees and their guests.",
    note: "Applied to card spend: an occasional dinner because the employee is working late is excluded; routine personal lunches and weekend meals are not, so they are taxable (or must be repaid). Client and business-travel meals are business expenses under an accountable plan (see Pub 15).",
    keywords: ["meal", "doordash", "ubereats", "grubhub", "dinner", "lunch", "overtime", "late", "weekend", "groceries", "food", "coffee", "doughnuts", "soft drinks"],
  },
  {
    id: "irs-transportation",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Transportation (Commuting) Benefits · pp. 22–23",
    url: P15B,
    title: "Qualified transportation benefits: 2026 limits",
    text: "This exclusion applies to the following benefits. • A ride in a commuter highway vehicle between the employee’s home and work place. • A transit pass. • Qualified parking. … Qualified parking is parking you provide to your employees on or near your business premises. … It doesn’t include parking at or near your employee’s home. … You can generally exclude the value of transportation benefits that you provide to an employee during 2026 from the employee’s wages up to the following limits. • $340 per month for combined commuter highway vehicle transportation and transit passes. • $340 per month for qualified parking. Benefits more than the limit. If the value of a benefit for any month is more than its limit, include in the employee’s wages the amount over the limit minus any amount the employee paid for the benefit.",
    keywords: ["commute", "commuting", "transit", "parking", "garage", "clipper", "bart", "metro", "train", "bus", "ferry", "monthly pass", "vanpool"],
  },
  {
    id: "irs-de-minimis-transport",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · De Minimis Transportation Benefits · p. 22",
    url: P15B,
    title: "Occasional local transportation for overtime",
    text: "A de minimis transportation benefit is any local transportation benefit you provide to an employee if it has so little value (taking into account how frequently you provide transportation to your employees) that accounting for it would be unreasonable or administratively impracticable. For example, it applies to occasional local transportation fare you give an employee because the employee is working overtime if the benefit is reasonable and isn’t based on hours worked. Local transportation fare provided on a regular or routine basis doesn’t qualify for this exclusion.",
    note: "Applied to card spend: an occasional late-night rideshare home because of overtime is excluded. Routine rideshare between home and the office is personal commuting and is taxable.",
    keywords: ["uber", "lyft", "taxi", "rideshare", "ride home", "late", "overtime", "commute", "office", "home"],
  },
  {
    id: "irs-bicycle",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Qualified bicycle commuting reimbursement eliminated · pp. 22–23",
    url: P15B,
    title: "Bicycle commuting reimbursement eliminated",
    text: "Section 11047 of P.L. 115-97 suspended the exclusion of qualified bicycle commuting reimbursements from your employee’s income for any tax year beginning after 2017 and before 2026. For tax years beginning after 2025, P.L. 119-21 permanently eliminates the exclusion of qualified bicycle commuting reimbursements from your employee’s income.",
    keywords: ["bike", "bicycle", "cycling", "e-bike", "scooter"],
  },
  {
    id: "irs-education",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Educational Assistance · pp. 11–12",
    url: P15B,
    title: "Educational assistance ($5,250)",
    text: "This exclusion applies to educational assistance you provide to employees under an educational assistance program. The exclusion also applies to graduate-level courses. “Educational assistance” means amounts you pay or incur for your employees’ education expenses. These expenses generally include the cost of books, equipment, fees, supplies, and tuition. However, these expenses don’t include the cost of a course or other education involving sports, games, or hobbies, unless the education: • Has a reasonable relationship to your business, or • Is required as part of a degree program. … Exclusion from wages. You can exclude up to $5,250 of educational assistance you provide to an employee under an educational assistance program from the employee’s wages each year. Assistance over $5,250. If you don’t have an educational assistance plan, or you provide an employee with assistance exceeding $5,250, you must include the value of these benefits as wages, unless the benefits are working condition benefits.",
    keywords: ["course", "class", "tuition", "udemy", "coursera", "certification", "exam", "training", "education", "book", "textbook", "degree", "bootcamp", "masterclass", "workshop", "learning", "hobby", "cooking", "golf"],
  },
  {
    id: "irs-ai-literacy",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) What’s New · AI literacy and AI development programs · p. 2",
    url: P15B,
    title: "AI literacy and skill programs",
    text: "Employer-provided AI literacy and skill development programs may be tax-free as working condition fringe benefits if they maintain or improve employee job skills at their current job. See Working Condition Benefits, later.",
    keywords: ["ai", "artificial intelligence", "machine learning", "deep learning", "llm", "course", "training", "skill"],
  },
  {
    id: "irs-student-loans",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Exclusion for employer payments of student loans · p. 11",
    url: P15B,
    title: "Employer payments of student loans",
    text: "Employer-provided educational assistance benefits include payments made after March 27, 2020, whether paid to the employee or to a lender, of principal or interest on any qualified education loan incurred by the employee for education of the employee.",
    note: "Pub 15-B (2026) What’s New: P.L. 119-21 permanently extends the $5,250 exclusion for employer payments of student loans made after 2025.",
    keywords: ["student loan", "loan", "navient", "nelnet", "fedloan", "mohela", "sallie mae"],
  },
  {
    id: "irs-achievement",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Achievement Awards · p. 8",
    url: P15B,
    title: "Achievement awards ($400 / $1,600)",
    text: "This exclusion applies to the value of any tangible personal property you give to an employee as an award for either length of service or safety achievement. The exclusion doesn’t apply to awards of cash, cash equivalents, gift cards, gift coupons, or gift certificates (other than arrangements granting only the right to select and receive tangible personal property from a limited assortment of items preselected or preapproved by you). The exclusion also doesn’t apply to vacations, meals, lodging, tickets to theater or sporting events, stocks, bonds, other securities, and other similar items. … The excludable annual amount is $1,600 ($400 for awards that aren’t “qualified plan awards”).",
    keywords: ["award", "anniversary", "service", "years", "recognition", "plaque", "watch", "achievement", "milestone", "safety"],
  },
  {
    id: "irs-athletic",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Athletic Facilities · pp. 9–10",
    url: P15B,
    title: "Athletic facilities (on-premises only)",
    text: "You can exclude the value of an employee’s use of an on-premises gym or other athletic facility you operate from an employee’s wages if substantially all use of the facility during the calendar year is by your employees, their spouses, and their dependent children. … The exclusion doesn’t apply to any athletic facility if access to the facility is made available to the general public through the sale of memberships, the rental of the facility, or a similar arrangement. On-premises facility. The athletic facility must be located on premises you own or lease and must be operated by you.",
    note: "Applied to card spend: memberships at outside gyms and studios, fitness classes, fitness apps and other wellness purchases aren’t covered by this or any other Pub 15-B exclusion, so under the general rule they are taxable wages.",
    keywords: ["gym", "fitness", "equinox", "classpass", "peloton", "yoga", "pilates", "wellness", "massage", "spa", "headspace", "calm", "orangetheory", "soulcycle", "crossfit", "membership", "stipend", "health"],
  },
  {
    id: "irs-cell-phone",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §2 · Employer-Provided Cell Phones · p. 14",
    url: P15B,
    title: "Employer-provided cell phones",
    text: "The value of the business use of an employer-provided cell phone, provided primarily for noncompensatory business reasons, is excludable from an employee’s income as a working condition fringe benefit. Personal use of an employer-provided cell phone, provided primarily for noncompensatory business reasons, is excludable from an employee’s income as a de minimis fringe benefit. … Examples of substantial business reasons include the employer’s: • Need to contact the employee at all times for work-related emergencies, • Requirement that the employee be available to speak with clients at times when the employee is away from the office, and • Need to speak with clients located in other time zones at times outside the employee’s normal workday. … You can’t exclude from an employee’s wages the value of a cell phone provided to promote goodwill of an employee, to attract a prospective employee, or as a means of providing additional compensation to an employee.",
    keywords: ["phone", "cell", "verizon", "t-mobile", "at&t", "att", "mobile", "wireless", "iphone", "android", "on-call", "plan"],
  },
  {
    id: "irs-accountable-plan",
    source: "IRS Pub 15",
    ref: "Pub 15 (2026) §5 · Accountable plan · p. 19",
    url: P15,
    title: "Business expense reimbursements: accountable plan",
    text: "To be an accountable plan, your reimbursement or allowance arrangement must require your employees to meet all three of the following rules. 1. They must have paid or incurred allowable expenses while performing services as your employees. The reimbursement or advance must be payment for the expenses and must not be an amount that would have otherwise been paid to the employee as wages. 2. They must substantiate these expenses to you within a reasonable period of time. 3. They must return any amounts in excess of substantiated expenses within a reasonable period of time. Amounts paid under an accountable plan aren’t wages and aren’t subject to income, social security, Medicare, and FUTA taxes. If the expenses covered by this arrangement aren’t substantiated (or amounts in excess of substantiated expenses aren’t returned within a reasonable period of time), the amount paid under the arrangement in excess of the substantiated expenses is treated as paid under a nonaccountable plan.",
    note: "Applied to card spend: business travel (flights, lodging, ground transport), client meals and team meals with a documented business purpose and a receipt aren’t wages. Costs for a companion or family member with no business purpose, and unsubstantiated flat stipends, are wages.",
    keywords: ["travel", "hotel", "flight", "airline", "lodging", "client", "customer", "dinner", "lunch", "meal", "business", "trip", "conference", "uber", "lyft", "taxi", "rental", "car", "gas", "fuel", "substantiated", "receipt", "spouse", "family", "companion", "stipend", "reimbursement"],
  },
  {
    id: "irs-nonaccountable",
    source: "IRS Pub 15",
    ref: "Pub 15 (2026) §5 · Nonaccountable plan · p. 19",
    url: P15,
    title: "Nonaccountable plan payments are wages",
    text: "Payments to your employee for travel and other necessary expenses of your business under a nonaccountable plan are wages and are treated as supplemental wages and subject to income, social security, Medicare, and FUTA taxes. Your payments are treated as paid under a nonaccountable plan if: • Your employee isn’t required to or doesn’t substantiate timely those expenses to you with receipts or other documentation, • You advance an amount to your employee for business expenses and your employee isn’t required to or doesn’t return timely any amount they don’t use for business expenses,",
    keywords: ["stipend", "allowance", "flat", "unsubstantiated", "no receipt", "internet", "per diem", "advance"],
  },
  {
    id: "irs-timing",
    source: "IRS Pub 15-B",
    ref: "Pub 15-B (2026) §4 · Rules for Withholding, Depositing, and Reporting · p. 31",
    url: P15B,
    title: "When to report taxable noncash benefits",
    text: "For employment tax and withholding purposes, you can treat taxable noncash fringe benefits (including personal use of employer-provided highway motor vehicles) as paid on a pay period, quarter, semiannual, annual, or other basis. But the benefits must be treated as paid no less frequently than annually. … The above choice for reporting and withholding doesn’t apply to a cash fringe benefit or a fringe benefit that is a transfer of tangible or intangible personal property of a kind normally held for investment or a transfer of real property. For these kinds of fringe benefits, you must use the actual date the property was transferred to the employee.",
    keywords: ["pay period", "payroll", "report", "withholding", "deposit", "annual", "quarter", "when", "imputed"],
  },
];
