import type { Employee, GroundTruth, PayPeriod, Receipt } from "./types";

// Fictional company used for the demo: Northwind Labs (~120 employees, hybrid).
export const COMPANY = {
  name: "Northwind Labs",
  plan: "Ramp Plus",
  payrollProviders: ["Gusto", "Rippling"] as const,
};

export const EMPLOYEES: Employee[] = [
  { id: "e1", name: "Maya Chen", title: "Senior Software Engineer", department: "Engineering", payroll: "Gusto", annualSalary: 185000, color: "#6366f1" },
  { id: "e2", name: "Jordan Alvarez", title: "Account Executive", department: "Sales", payroll: "Gusto", annualSalary: 120000, color: "#f59e0b" },
  { id: "e3", name: "Priya Natarajan", title: "Product Designer", department: "Design", payroll: "Rippling", annualSalary: 150000, color: "#ec4899" },
  { id: "e4", name: "Sam Okafor", title: "Support Lead (on-call)", department: "Customer Success", payroll: "Rippling", annualSalary: 95000, color: "#10b981" },
  { id: "e5", name: "Leah Goldberg", title: "Engineering Manager", department: "Engineering", payroll: "Gusto", annualSalary: 210000, color: "#0ea5e9" },
  { id: "e6", name: "Diego Ramos", title: "Data Scientist", department: "Data", payroll: "Rippling", annualSalary: 165000, color: "#8b5cf6" },
  { id: "e7", name: "Hannah Park", title: "People Ops Manager", department: "People", payroll: "Gusto", annualSalary: 130000, color: "#ef4444" },
  { id: "e8", name: "Theo Brooks", title: "Marketing Lead", department: "Marketing", payroll: "Rippling", annualSalary: 140000, color: "#14b8a6" },
];

export const PAY_PERIODS: PayPeriod[] = [
  { id: "2026-10b", label: "Oct 16 – Oct 31", start: "2026-10-16", end: "2026-10-31", payDate: "2026-11-05", status: "synced" },
  { id: "2026-11a", label: "Nov 1 – Nov 15", start: "2026-11-01", end: "2026-11-15", payDate: "2026-11-20", status: "open" },
];

export const CURRENT_PERIOD = "2026-11a";

export interface SeedTx {
  id: string;
  employeeId: string;
  date: string;
  merchant: string;
  mccCategory: string;
  amount: number;
  memo: string;
  receipt: Receipt | null;
  truth: GroundTruth;
}

const r = (merchant: string, lines: [string, number][]): Receipt => ({
  merchant,
  lines: lines.map(([description, amount]) => ({ description, amount })),
});

export const SEED_TRANSACTIONS: SeedTx[] = [
  // ---------- Current period: Nov 1 – Nov 15 ----------
  { id: "tx-1001", employeeId: "e1", date: "2026-11-02", merchant: "Best Buy", mccCategory: "Electronics", amount: 389.99, memo: "Monitor for home office", receipt: r("Best Buy", [["Dell 27\" 4K USB-C Monitor S2722QC", 389.99]]), truth: { treatment: "tax_free", taxableAmount: 0, basis: "working_condition", note: "Work equipment for remote employee; within $1,000 home-office allowance." } },
  { id: "tx-1002", employeeId: "e1", date: "2026-11-01", merchant: "Equinox", mccCategory: "Fitness", amount: 95.0, memo: "November membership", receipt: null, truth: { treatment: "taxable", taxableAmount: 95, basis: "taxable_wellness", note: "Off-site gym membership is taxable." } },
  { id: "tx-1003", employeeId: "e2", date: "2026-11-03", merchant: "Amazon", mccCategory: "Retail", amount: 512.48, memo: "home office setup", receipt: r("Amazon.com", [["Logitech MX Keys S wireless keyboard", 129.99], ["Ergonomic mesh office chair, lumbar support", 302.49], ["Mario Kart 8 Deluxe - Nintendo Switch", 80.0]]), truth: { treatment: "partial", taxableAmount: 80, basis: "working_condition", note: "Keyboard + chair are working-condition; the video game is personal." } },
  { id: "tx-1004", employeeId: "e2", date: "2026-11-04", merchant: "The Capital Grille", mccCategory: "Restaurants", amount: 286.4, memo: "Dinner w/ Acme Corp (2 attendees) – Q4 renewal", receipt: r("The Capital Grille", [["Dinner for 3 incl. tip", 286.4]]), truth: { treatment: "tax_free", taxableAmount: 0, basis: "accountable_plan", note: "Client meal with documented business purpose." } },
  { id: "tx-1005", employeeId: "e3", date: "2026-11-02", merchant: "Amazon", mccCategory: "Retail", amount: 50.0, memo: "", receipt: r("Amazon.com", [["Amazon.com eGift Card - $50.00", 50.0]]), truth: { treatment: "taxable", taxableAmount: 50, basis: "taxable_cash_equivalent", note: "Gift cards are never de minimis." } },
  { id: "tx-1006", employeeId: "e3", date: "2026-11-05", merchant: "ClassPass", mccCategory: "Fitness", amount: 49.0, memo: "", receipt: null, truth: { treatment: "taxable", taxableAmount: 49, basis: "taxable_wellness", note: "Fitness classes are a taxable wellness benefit." } },
  { id: "tx-1007", employeeId: "e4", date: "2026-11-01", merchant: "Verizon Wireless", mccCategory: "Telecom", amount: 80.0, memo: "On-call support phone plan – Nov", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "cell_phone", note: "Phone provided for business reasons (on-call) under $85 cap." } },
  { id: "tx-1008", employeeId: "e4", date: "2026-11-06", merchant: "Uber", mccCategory: "Rideshare", amount: 23.4, memo: "ride home 10:40pm after P1 incident escalation", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "de_minimis", note: "Occasional late-night ride due to overtime is de minimis." } },
  { id: "tx-1009", employeeId: "e5", date: "2026-11-05", merchant: "DoorDash", mccCategory: "Restaurants", amount: 24.8, memo: "dinner – staying late for release cut", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "de_minimis", note: "Occasional overtime meal is de minimis." } },
  { id: "tx-1010", employeeId: "e6", date: "2026-11-03", merchant: "Coursera", mccCategory: "Education", amount: 399.0, memo: "Deep Learning Specialization", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "educational_assistance", note: "Within $5,250 §127 limit." } },
  { id: "tx-1011", employeeId: "e6", date: "2026-11-04", merchant: "Delta Air Lines", mccCategory: "Airlines", amount: 642.3, memo: "NYC offsite flight + partner ticket", receipt: r("Delta Air Lines", [["SFO-JFK Main Cabin - Diego Ramos", 321.15], ["SFO-JFK Main Cabin - Ana Ramos (companion)", 321.15]]), truth: { treatment: "partial", taxableAmount: 321.15, basis: "accountable_plan", note: "Employee's ticket is business travel; companion ticket is taxable." } },
  { id: "tx-1012", employeeId: "e6", date: "2026-11-09", merchant: "Marriott Marquis", mccCategory: "Lodging", amount: 878.0, memo: "NYC offsite – 3 nights", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "accountable_plan", note: "Business travel lodging." } },
  { id: "tx-1013", employeeId: "e7", date: "2026-11-01", merchant: "Costco", mccCategory: "Wholesale", amount: 186.2, memo: "Snacks + drinks for Halloween team party", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "de_minimis", note: "Occasional party is de minimis." } },
  { id: "tx-1014", employeeId: "e7", date: "2026-11-02", merchant: "Headspace", mccCategory: "Digital services", amount: 69.99, memo: "annual subscription", receipt: null, truth: { treatment: "taxable", taxableAmount: 69.99, basis: "taxable_wellness", note: "Meditation app = taxable wellness." } },
  { id: "tx-1015", employeeId: "e8", date: "2026-11-04", merchant: "Uber", mccCategory: "Rideshare", amount: 31.75, memo: "commute to office", receipt: null, truth: { treatment: "taxable", taxableAmount: 31.75, basis: "taxable_commuting", note: "Home-to-office rideshare is personal commuting." } },
  { id: "tx-1016", employeeId: "e8", date: "2026-11-01", merchant: "Clipper (BART)", mccCategory: "Transit", amount: 120.0, memo: "monthly transit pass", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "qualified_transportation", note: "Under $340/mo §132(f) limit." } },
  { id: "tx-1017", employeeId: "e8", date: "2026-11-07", merchant: "Nordstrom", mccCategory: "Clothing", amount: 214.0, memo: "outfit for conference keynote", receipt: null, truth: { treatment: "taxable", taxableAmount: 214, basis: "taxable_personal", note: "Clothing suitable for everyday wear is personal." } },
  { id: "tx-1018", employeeId: "e1", date: "2026-11-06", merchant: "Udemy", mccCategory: "Education", amount: 14.99, memo: "Kubernetes course", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "educational_assistance", note: "Job-related course." } },
  { id: "tx-1019", employeeId: "e1", date: "2026-11-06", merchant: "Amazon", mccCategory: "Retail", amount: 189.0, memo: "", receipt: null, truth: { treatment: "needs_info", taxableAmount: 0, basis: "unknown", note: "No memo or receipt; correct behavior is to ask the employee." } },
  { id: "tx-1020", employeeId: "e3", date: "2026-11-03", merchant: "Apple", mccCategory: "Electronics", amount: 1299.0, memo: "iPad Pro for design reviews + sketching wireframes", receipt: r("Apple Store", [["iPad Pro 11-inch (M4) 256GB", 999.0], ["Apple Pencil Pro", 129.0], ["AppleCare+ for iPad Pro", 171.0]]), truth: { treatment: "tax_free", taxableAmount: 0, basis: "working_condition", note: "Design tool used for work. (Over the $1,000 home-office allowance: policy flag, not a tax issue.)" } },
  { id: "tx-1021", employeeId: "e3", date: "2026-11-01", merchant: "Adobe", mccCategory: "Software", amount: 59.99, memo: "Creative Cloud – Nov", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "working_condition", note: "Job software." } },
  { id: "tx-1022", employeeId: "e2", date: "2026-11-01", merchant: "Comcast Xfinity", mccCategory: "Utilities", amount: 50.0, memo: "internet stipend – Nov", receipt: null, truth: { treatment: "taxable", taxableAmount: 50, basis: "taxable_personal", note: "Flat, unsubstantiated stipend is taxable." } },
  { id: "tx-1023", employeeId: "e4", date: "2026-11-08", merchant: "Lululemon", mccCategory: "Clothing", amount: 128.0, memo: "", receipt: null, truth: { treatment: "taxable", taxableAmount: 128, basis: "taxable_personal", note: "Everyday clothing is personal." } },
  { id: "tx-1024", employeeId: "e5", date: "2026-11-07", merchant: "Etsy", mccCategory: "Retail", amount: 82.0, memo: "Holiday gifts for my team", receipt: r("Etsy - NorthStudio", [["Custom ceramic mug w/ Northwind logo x8", 82.0]]), truth: { treatment: "tax_free", taxableAmount: 0, basis: "de_minimis", note: "Low-value holiday gift of property with logo." } },
  { id: "tx-1025", employeeId: "e5", date: "2026-11-02", merchant: "Ticketmaster", mccCategory: "Entertainment", amount: 1680.0, memo: "Warriors season tickets (half season)", receipt: null, truth: { treatment: "taxable", taxableAmount: 1680, basis: "taxable_personal", note: "Season tickets are never de minimis." } },
  { id: "tx-1026", employeeId: "e6", date: "2026-11-02", merchant: "Peloton", mccCategory: "Fitness", amount: 1445.0, memo: "bike for wellness", receipt: null, truth: { treatment: "taxable", taxableAmount: 1445, basis: "taxable_wellness", note: "Personal fitness equipment is taxable (also over policy cap)." } },
  { id: "tx-1027", employeeId: "e7", date: "2026-11-05", merchant: "Grubhub", mccCategory: "Restaurants", amount: 142.6, memo: "Team lunch – People Ops quarterly planning (6 attendees)", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "accountable_plan", note: "Team meal with business purpose." } },
  { id: "tx-1028", employeeId: "e8", date: "2026-11-05", merchant: "WeWork", mccCategory: "Coworking", amount: 45.0, memo: "day pass – client workshop in Austin", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "accountable_plan", note: "Business travel workspace." } },
  { id: "tx-1029", employeeId: "e8", date: "2026-11-06", merchant: "Amazon", mccCategory: "Retail", amount: 69.99, memo: "webcam for customer calls", receipt: r("Amazon.com", [["Logitech C920 HD Pro Webcam", 69.99]]), truth: { treatment: "tax_free", taxableAmount: 0, basis: "working_condition", note: "Work equipment." } },
  { id: "tx-1030", employeeId: "e2", date: "2026-11-09", merchant: "Delta Air Lines", mccCategory: "Airlines", amount: 412.0, memo: "Flight to Chicago – customer QBR", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "accountable_plan", note: "Business travel." } },
  { id: "tx-1031", employeeId: "e2", date: "2026-11-09", merchant: "Hilton Chicago", mccCategory: "Lodging", amount: 389.0, memo: "Chicago QBR – 1 night", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "accountable_plan", note: "Business travel." } },
  { id: "tx-1032", employeeId: "e5", date: "2026-11-08", merchant: "Best Buy", mccCategory: "Electronics", amount: 549.99, memo: "", receipt: r("Best Buy", [["PlayStation 5 Slim Console", 499.99], ["DualSense Wireless Controller", 50.0]]), truth: { treatment: "taxable", taxableAmount: 549.99, basis: "taxable_personal", note: "Gaming console is personal." } },
  { id: "tx-1033", employeeId: "e6", date: "2026-11-07", merchant: "Airbnb", mccCategory: "Lodging", amount: 1240.0, memo: "weekend in Tahoe", receipt: null, truth: { treatment: "taxable", taxableAmount: 1240, basis: "taxable_personal", note: "Personal vacation." } },
  { id: "tx-1034", employeeId: "e3", date: "2026-11-08", merchant: "CVS Pharmacy", mccCategory: "Drugstore", amount: 32.18, memo: "", receipt: null, truth: { treatment: "needs_info", taxableAmount: 0, basis: "unknown", note: "No context; ask the employee." } },
  { id: "tx-1035", employeeId: "e7", date: "2026-11-03", merchant: "SHRM", mccCategory: "Professional associations", amount: 244.0, memo: "SHRM annual professional membership", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "working_condition", note: "Professional dues." } },
  { id: "tx-1036", employeeId: "e8", date: "2026-11-02", merchant: "MasterClass", mccCategory: "Education", amount: 120.0, memo: "Annual – cooking & golf classes", receipt: null, truth: { treatment: "taxable", taxableAmount: 120, basis: "taxable_personal", note: "Hobby classes are excluded from the education program." } },
  { id: "tx-1037", employeeId: "e1", date: "2026-11-09", merchant: "Uber", mccCategory: "Rideshare", amount: 54.2, memo: "SFO to hotel – KubeCon", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "accountable_plan", note: "Business travel ground transport." } },
  { id: "tx-1038", employeeId: "e4", date: "2026-11-01", merchant: "T-Mobile", mccCategory: "Telecom", amount: 140.0, memo: "phone plan (family plan, I'm on-call)", receipt: null, truth: { treatment: "partial", taxableAmount: 55, basis: "cell_phone", note: "Policy covers up to $85; excess $55 is taxable." } },
  { id: "tx-1039", employeeId: "e6", date: "2026-11-01", merchant: "SpotHero", mccCategory: "Parking", amount: 410.0, memo: "monthly office garage parking", receipt: null, truth: { treatment: "partial", taxableAmount: 70, basis: "qualified_transportation", note: "Over the $340/mo qualified parking limit by $70." } },
  { id: "tx-1040", employeeId: "e2", date: "2026-11-08", merchant: "DoorDash", mccCategory: "Restaurants", amount: 64.3, memo: "Saturday dinner", receipt: null, truth: { treatment: "taxable", taxableAmount: 64.3, basis: "taxable_personal", note: "Personal weekend meal." } },
  { id: "tx-1041", employeeId: "e3", date: "2026-11-06", merchant: "Staples", mccCategory: "Office supplies", amount: 74.12, memo: "printer ink + notebooks for home office", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "working_condition", note: "Office supplies." } },
  { id: "tx-1042", employeeId: "e7", date: "2026-11-09", merchant: "Target", mccCategory: "Retail", amount: 100.0, memo: "", receipt: r("Target", [["Target GiftCard", 100.0]]), truth: { treatment: "taxable", taxableAmount: 100, basis: "taxable_cash_equivalent", note: "Gift card." } },

  // ---------- Prior period (already synced): Oct 16 – Oct 31 ----------
  { id: "tx-0901", employeeId: "e1", date: "2026-10-20", merchant: "Equinox", mccCategory: "Fitness", amount: 95.0, memo: "October membership", receipt: null, truth: { treatment: "taxable", taxableAmount: 95, basis: "taxable_wellness", note: "Gym membership." } },
  { id: "tx-0902", employeeId: "e3", date: "2026-10-18", merchant: "ClassPass", mccCategory: "Fitness", amount: 49.0, memo: "", receipt: null, truth: { treatment: "taxable", taxableAmount: 49, basis: "taxable_wellness", note: "Fitness classes." } },
  { id: "tx-0903", employeeId: "e2", date: "2026-10-22", merchant: "United Airlines", mccCategory: "Airlines", amount: 380.0, memo: "Flight to Denver – customer onsite", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "accountable_plan", note: "Business travel." } },
  { id: "tx-0904", employeeId: "e5", date: "2026-10-25", merchant: "Apple", mccCategory: "Electronics", amount: 249.0, memo: "AirPods Pro for calls – home office", receipt: null, truth: { treatment: "tax_free", taxableAmount: 0, basis: "working_condition", note: "Headset for work calls." } },
];

export const PRIOR_PERIOD_IDS = new Set(SEED_TRANSACTIONS.filter((t) => t.date < "2026-11-01").map((t) => t.id));

export function payPeriodFor(date: string): string {
  return date < "2026-11-01" ? "2026-10b" : "2026-11a";
}
