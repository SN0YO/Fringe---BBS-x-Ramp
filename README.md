# Ramp Fringe

**Team Fringe · BBS × Ramp hackathon** · Ishan Anand & Aarushi Shukla (UC Berkeley)

An AI agent inside Ramp. It reads every corporate-card transaction, receipt and memo, decides whether the spend is a **tax-free** business expense or a **taxable fringe benefit** under IRS Publication 15-B and the company's benefits policy, asks the employee when it can't tell, and posts imputed income straight to payroll (Gusto / Rippling).

> Buy a monitor for your home office on the company card → stays tax-free.
> Gym membership or a gift card → reported as imputed income on the right paycheck.
> No spreadsheet. No guessing. No surprise W-2c.

## What's in the app

| Screen | What it shows |
|---|---|
| **Overview** (`/`) | Period KPIs: taxable fringe found, over-taxing prevented, missed income caught, auto-approval rate, time saved; taxable $ by IRS basis; next payroll |
| **Review queue** (`/review`) | Only what Fringe isn't sure about (<85% confidence), plus open questions to employees. One-click approve |
| **Transactions** (`/transactions`) | Every swipe with Fringe's decision. Click any row for the reasoning drawer (rationale, line-item split, citations to Pub 15-B and policy, paycheck impact, audit trail, override, receipt upload). **Simulate swipe** to demo live |
| **Payroll sync** (`/payroll`) | Imputed income per employee grouped by provider, optional **tax gross-up**, post to Gusto/Rippling (simulated connector, shows the payload), CSV export, sync history |
| **Policy & IRS 15-B** (`/policy`) | The retrieval corpus (IRS summaries + company policy), statutory limits, and a live retrieval tester |
| **Accuracy** (`/eval`) | Labeled test sets scored for three engines: status quo (tax by merchant category), keyword rules, and Fringe AI (Claude). Import your own labeled CSV |
| **Ask Fringe** (`/ask`) | Chat grounded in Pub 15-B, policy and live workspace data |
| **Employee view** (toggle top-left) | "Kept tax-free" savings, Fringe's questions with quick replies, card activity in plain English, benefit balances |

## Run it

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Without a key the app still works end to end on the **offline engine** (keyword heuristics). With a key, every decision, receipt read (vision), and chat answer comes from Claude, and the Accuracy page can score it.

### Deploy (Vercel)

1. Import `SN0YO/Fringe---BBS-x-Ramp` at vercel.com/new (framework auto-detected: Next.js).
2. Add the environment variable `ANTHROPIC_API_KEY`.
3. Deploy.

## How the agent works

`src/lib/agent.ts`
1. **Retrieve.** Lexical retrieval over `src/lib/knowledge.ts` (IRS Pub 15-B sections + company policy chunks). The full corpus also sits in a cached system prompt.
2. **Reason.** Claude (`claude-opus-5-5`) gets merchant, MCC, memo, itemized receipt lines (or the receipt **image**), the employee's role, and any answer they gave. It returns **structured output** (Zod schema): treatment, IRS basis, taxable amount, per-line split, calibrated confidence, citations, and a question for the employee when context is missing.
3. **Route (human-in-the-loop).** ≥85% confidence → auto-approved; below → finance review queue; `needs_info` → question to the cardholder. Answers re-trigger classification.
4. **Post.** Approved taxable amounts aggregate per employee per pay period → payroll connector (`/api/payroll`, simulated).

Statutory limits applied: qualified parking/transit $340/mo (2026), §127 educational assistance $5,250/yr, gift cards never de minimis, plus policy caps (phone plan, home office, wellness).

## Accuracy: honest numbers

Scoring: correct only if the treatment matches **and** taxable amount is within $1.

| Engine | Demo set (46) | **Held-out set (16)** |
|---|---|---|
| Status quo: tax by merchant category | 72% | 50% |
| Keyword rules (offline engine) | 100%* | 44% |
| Fringe AI (Claude) | run on `/eval` with a key | run on `/eval` with a key |

\*The keyword rules were tuned on the demo set, so 100% there is overfit. The held-out set was written afterward and never used for tuning. Keyword rules collapse on it, which is the case for an LLM. **Run Claude on `/eval` before the pitch and put the real number on the slide.**

## Team to-dos

**Ishan (validation, pitch)**
- [ ] Replace the IRS summaries in `src/lib/knowledge.ts` with exact 2026 Pub 15-B language; have a practitioner review limits.
- [ ] Build a bigger practitioner-labeled set → import on `/eval` (CSV columns: `merchant,mcc,amount,memo,receipt_lines,truth_treatment,truth_taxable`; `receipt_lines` like `Monitor:349.99|Game:80`).
- [ ] Validate the 4 min/transaction manual-review assumption (Overview "time saved").

**Aarushi (engineering)**
- [ ] Swap lexical retrieval for embeddings if the corpus grows.
- [ ] Real Ramp data: Ramp Developer API transactions + receipts → `addTransaction`.
- [ ] Real Gusto / Rippling OAuth connectors behind `/api/payroll`.
- [ ] Persist state in a DB (currently localStorage per browser; "reset" icon bottom-left restores the demo).

## Demo script (~2 min)

1. **Employee view → Maya.** "$459 kept tax-free." Answer Fringe's Amazon question → watch it re-classify.
2. **Finance → Transactions → Amazon $512 (Jordan).** Receipt split: keyboard and chair tax-free, Mario Kart taxable → *partial*, $80. Show citations.
3. **Simulate swipe** → "Visa Gift Card, raffle prize" → instantly taxable (gift cards are never de minimis).
4. **Payroll sync** → toggle gross-up → Post to Gusto → payload.
5. **Accuracy** → held-out set: status quo 50%, rules 44%, Fringe AI _X_%.

---
IRS content in this prototype is summarized for demonstration and is not tax advice. Company, employees and transactions are fictional.
