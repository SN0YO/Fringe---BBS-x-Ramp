import type { SeedTx } from "./seed";

// Extended labeled set: 50 scenarios written against the 2026 editions of
// IRS Publication 15-B and Publication 15, plus the Northwind policy.
// Each `note` names the governing passage. Labels were drafted by the AI
// assistant that built this app and should be reviewed by a payroll
// practitioner. Like the held-out set, these cases were NOT used to tune
// the keyword rules.
//
// Conventions: one transaction = one month's charge where a monthly limit
// applies; year-to-date usage of annual limits is assumed to be $0 unless the
// memo says otherwise.

type L = [string, number][];
let n = 0;
const tx = (
  employeeId: string,
  merchant: string,
  mccCategory: string,
  amount: number,
  memo: string,
  truth: SeedTx["truth"],
  lines?: L,
): SeedTx => ({
  id: `ex-${String(++n).padStart(2, "0")}`,
  employeeId,
  date: `2026-11-${String(1 + (n % 14)).padStart(2, "0")}`,
  merchant,
  mccCategory,
  amount,
  memo,
  receipt: lines ? { merchant, lines: lines.map(([description, a]) => ({ description, amount: a })) } : null,
  truth,
});

const free = (basis: SeedTx["truth"]["basis"], note: string): SeedTx["truth"] => ({ treatment: "tax_free", taxableAmount: 0, basis, note });
const taxed = (amount: number, basis: SeedTx["truth"]["basis"], note: string): SeedTx["truth"] => ({ treatment: "taxable", taxableAmount: amount, basis, note });
const part = (amount: number, basis: SeedTx["truth"]["basis"], note: string): SeedTx["truth"] => ({ treatment: "partial", taxableAmount: amount, basis, note });
const ask = (note: string): SeedTx["truth"] => ({ treatment: "needs_info", taxableAmount: 0, basis: "unknown", note });

export const EXTENDED: SeedTx[] = [
  // ---- Cash & cash equivalents (Pub 15-B p.10) ----
  tx("e7", "Amazon", "Retail", 25, "gift card for Priya's work anniversary", taxed(25, "taxable_cash_equivalent", "Gift cards are never de minimis (p.10) and can't be achievement awards (p.8).")),
  tx("e5", "DoorDash", "Restaurants", 50, "DoorDash gift card – thank-you to on-call team member", taxed(50, "taxable_cash_equivalent", "Gift card = cash equivalent (p.10).")),
  tx("e7", "Visa Prepaid (Walgreens)", "Retail", 200, "prepaid Visa cards, holiday raffle prize", taxed(200, "taxable_cash_equivalent", "Prepaid cards are cash equivalents (p.10).")),
  tx("e7", "Uber", "Rideshare", 30, "Uber Cash credit sent to a new hire as welcome perk", taxed(30, "taxable_cash_equivalent", "Stored-value credit is a cash equivalent (p.10).")),

  // ---- Achievement awards (p.8) ----
  tx("e7", "Tiffany & Co.", "Jewelry", 350, "10-year service award (watch) presented at all-hands", free("achievement_award", "Tangible property for length of service, under $400 non-qualified limit (p.8).")),
  tx("e7", "Apple", "Electronics", 650, "5-year service award – iPad, no written awards plan", part(250, "achievement_award", "Without a qualified plan the exclusion is $400; $250 excess is wages (p.8).")),

  // ---- De minimis (p.10) ----
  tx("e7", "1-800-Flowers", "Florist", 85, "flowers for Sam – in the hospital", free("de_minimis", "Flowers under special circumstances such as illness (p.10).")),
  tx("e5", "HoneyBaked Ham", "Grocery", 64, "holiday hams for my 4 direct reports", free("de_minimis", "Holiday gifts, other than cash, with low FMV (p.10).")),
  tx("e8", "Ticketmaster", "Entertainment", 240, "2 tickets to Warriors game for top performer this quarter", free("de_minimis", "Occasional tickets for sporting events (p.10).")),
  tx("e8", "Ticketmaster", "Entertainment", 2400, "SF Symphony season subscription for my team", taxed(2400, "taxable_personal", "Season tickets are not de minimis (p.10).")),
  tx("e3", "Blue Bottle Coffee", "Restaurants", 36, "coffee + pastries for design critique", free("de_minimis", "Coffee, doughnuts or soft drinks are de minimis meals (p.18).")),
  tx("e7", "Party City", "Retail", 142, "decorations for office holiday party", free("de_minimis", "Occasional parties for employees (p.10).")),
  tx("e1", "Soho House", "Clubs", 300, "monthly club membership (I meet candidates there sometimes)", taxed(300, "taxable_personal", "Membership in a private club is not de minimis regardless of use (p.10).")),

  // ---- Wellness / athletic (pp.9–10) ----
  tx("e2", "Barry's", "Fitness", 38, "", taxed(38, "taxable_wellness", "Off-site fitness class; athletic-facility exclusion is on-premises only (pp.9–10).")),
  tx("e6", "Strava", "Digital services", 79.99, "annual subscription", taxed(79.99, "taxable_wellness", "Fitness app; no exclusion applies (general rule, p.3).")),
  tx("e3", "Calm", "Digital services", 69.99, "meditation app – wellness stipend", taxed(69.99, "taxable_wellness", "Wellness stipend purchase is taxable (policy Section 4.2; p.3).")),
  tx("e4", "24 Hour Fitness", "Fitness", 49.99, "gym membership", taxed(49.99, "taxable_wellness", "Athletic facility membership is not de minimis (p.10).")),

  // ---- Working condition (pp.23–24) ----
  tx("e1", "Apple", "Electronics", 1599, "MacBook Pro – replacement work laptop approved by IT", free("working_condition", "Property provided so the employee can perform their job (p.23).")),
  tx("e6", "JetBrains", "Software", 289, "PyCharm Professional annual license", free("working_condition", "Job software (p.23).")),
  tx("e4", "Zendesk", "Software", 115, "extra agent seat for support queue", free("working_condition", "Business software.")),
  tx("e5", "IEEE", "Professional associations", 220, "IEEE membership renewal", free("working_condition", "Professional dues deductible as business expense (p.23).")),
  tx("e3", "Wacom", "Electronics", 379.95, "drawing tablet for product illustration work", free("working_condition", "Work equipment for a designer.")),
  tx("e1", "Amazon", "Retail", 284.97, "monitor arm for home office", part(154.98, "working_condition", "Monitor arm is a work item; the personal items on the receipt are taxable."), [["Ergotron LX monitor arm", 129.99], ["AirPods Max – birthday gift for my partner", 154.98]]),
  tx("e6", "Best Buy", "Electronics", 1379.98, "laptop for ML experiments", part(79.99, "working_condition", "Laptop is work equipment; the video game is personal."), [["Lenovo ThinkPad X1 Carbon", 1299.99], ["EA Sports FC 26 – PS5", 79.99]]),
  tx("e8", "Nordstrom", "Clothing", 189, "blazer for investor demo day", taxed(189, "taxable_personal", "Clothing suitable for everyday wear isn't a deductible business expense, so no working-condition exclusion (p.23).")),
  tx("e4", "Red Wing Shoes", "Clothing", 240, "steel-toe safety boots required for data center visits", free("working_condition", "Protective gear required for the job and not suitable for everyday wear.")),

  // ---- Cell phones (p.14) ----
  tx("e2", "AT&T", "Telecom", 75, "mobile plan – need to be reachable by clients while traveling", free("cell_phone", "Substantial business reason: reachable by clients away from the office (p.14).")),
  tx("e7", "Apple", "Electronics", 999, "new iPhones as holiday perk for People team (morale)", taxed(999, "taxable_personal", "Phone provided to boost morale/as compensation is not excludable (p.14).")),

  // ---- Meals (p.18; Pub 15 accountable plan) ----
  tx("e6", "Uber Eats", "Restaurants", 27.4, "dinner – staying late for model training deadline", free("de_minimis", "Occasional overtime meal (p.18).")),
  tx("e1", "Chipotle", "Restaurants", 14.25, "", ask("Single small meal with no memo: could be overtime, business, or personal; ask.")),
  tx("e2", "Nobu", "Restaurants", 612, "dinner with Globex procurement team (4 guests) – contract signing", free("accountable_plan", "Client meal with documented business purpose (Pub 15 Section 5).")),
  tx("e3", "Safeway", "Grocery", 143.2, "weekly groceries", taxed(143.2, "taxable_personal", "Personal groceries: no exclusion (p.3).")),
  tx("e7", "Costco", "Wholesale", 268.4, "snacks for office kitchen", part(119.45, "de_minimis", "Office snacks are de minimis; the personal household items are taxable."), [["Kirkland trail mix, sparkling water, granola bars (office kitchen)", 148.95], ["Kirkland paper towels + laundry detergent (home)", 119.45]]),
  tx("e2", "Sweetgreen", "Restaurants", 18.5, "lunch (my daily lunch)", taxed(18.5, "taxable_personal", "Regular personal lunch: not occasional, no business purpose (p.18).")),

  // ---- Travel (Pub 15 accountable plan) ----
  tx("e2", "Hertz", "Car rental", 214.6, "rental car – customer visits in Dallas", free("accountable_plan", "Business travel ground transportation (Pub 15 Section 5).")),
  tx("e6", "SFO Long-Term Parking", "Parking", 96, "airport parking during NYC offsite", free("accountable_plan", "Parking while traveling for business is a travel expense, not commuter parking.")),
  tx("e1", "The Linux Foundation", "Education", 1199, "KubeCon NA registration", free("working_condition", "Job-related conference registration (p.23).")),
  tx("e8", "Four Seasons Austin", "Lodging", 1270, "Austin client workshop – 2 nights", part(260, "accountable_plan", "Room is business travel; the spa charge is personal."), [["Room – 2 nights", 1010], ["Spa – 80-min massage", 260]]),
  tx("e5", "United Airlines", "Airlines", 896, "flights to Tokyo eng summit for me + my spouse", part(448, "accountable_plan", "Spouse's ticket with no business purpose is wages (Pub 15 Section 5)."), [["SFO-HND Economy – Leah Goldberg", 448], ["SFO-HND Economy – spouse", 448]]),
  tx("e6", "Airbnb", "Lodging", 780, "", ask("Lodging with no stated purpose: ask before deciding.")),

  // ---- Transportation (pp.22–23) ----
  tx("e3", "Clipper (BART)", "Transit", 380, "monthly transit pass + ferry", part(40, "qualified_transportation", "Transit limit is $340/month for 2026; $40 excess is wages (p.23).")),
  tx("e1", "SpotHero", "Parking", 210, "monthly garage parking near the office", free("qualified_transportation", "Qualified parking near business premises, under $340/month (p.22).")),
  tx("e2", "ParkMobile", "Parking", 160, "residential parking permit at my apartment", taxed(160, "taxable_commuting", "Parking at or near the employee's home isn't qualified parking (p.22).")),
  tx("e8", "Rad Power Bikes", "Sporting goods", 1499, "e-bike to commute to the office", taxed(1499, "taxable_commuting", "Bicycle commuting exclusion permanently eliminated for tax years after 2025 (p.23).")),
  tx("e4", "Uber", "Rideshare", 26.3, "home from office 11:30pm after outage", free("de_minimis", "Occasional local transportation because of overtime (p.22).")),
  tx("e8", "Lyft", "Rideshare", 21.9, "daily ride to work", taxed(21.9, "taxable_commuting", "Regular/routine local transportation doesn't qualify (p.22).")),

  // ---- Education (pp.11–12, p.2) ----
  tx("e6", "Stanford Online", "Education", 6400, "graduate art history course toward my MA (not related to my job; no other education benefits used this year)", part(1150, "educational_assistance", "Up to $5,250/yr excludable under the written program; the $1,150 excess is wages because it isn't job-related, so it isn't a working condition benefit (p.12).")),
  tx("e3", "DeepLearning.AI", "Education", 49, "AI for designers course", free("educational_assistance", "AI skills program that improves current job skills (p.2); within Section 127 limit.")),
  tx("e2", "Sur La Table", "Education", 125, "pasta-making cooking class", taxed(125, "taxable_personal", "Hobby courses are excluded from educational assistance (p.11).")),
  tx("e4", "Navient", "Loan payment", 300, "student loan payment – company loan-assistance benefit", free("educational_assistance", "Employer payments of qualified education loans are educational assistance (p.11).")),
];
