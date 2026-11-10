import { NextResponse } from "next/server";

// SIMULATED payroll connector. The payload shape is illustrative: in production,
// map each line to the provider's imputed-income / fringe earning type via the
// Gusto or Rippling API using the company's OAuth connection.
export async function POST(req: Request) {
  const body = (await req.json()) as {
    provider: "Gusto" | "Rippling";
    payPeriod: string;
    lines: { employeeId: string; employeeName: string; amount: number; grossUp: number; transactionIds: string[] }[];
  };
  await new Promise((r) => setTimeout(r, 900));
  const ref = `${body.provider === "Gusto" ? "gus" : "rip"}_${Math.random().toString(36).slice(2, 10)}`;
  const payload =
    body.provider === "Gusto"
      ? {
          endpoint: "PUT /v1/companies/{company_uuid}/payrolls/{payroll_uuid}",
          employee_compensations: body.lines.map((l) => ({
            employee_uuid: `emp_${l.employeeId}`,
            fixed_compensations: [
              { name: "Imputed income – taxable fringe (Ramp Fringe)", amount: l.amount.toFixed(2) },
              ...(l.grossUp > 0 ? [{ name: "Tax gross-up (Ramp Fringe)", amount: l.grossUp.toFixed(2) }] : []),
            ],
          })),
        }
      : {
          endpoint: "POST /platform/api/payroll/earnings",
          earnings: body.lines.flatMap((l) => [
            { worker_id: `wrk_${l.employeeId}`, earning_type: "IMPUTED_INCOME", amount: l.amount, memo: `Ramp Fringe · ${l.transactionIds.length} txns` },
            ...(l.grossUp > 0 ? [{ worker_id: `wrk_${l.employeeId}`, earning_type: "GROSS_UP", amount: l.grossUp }] : []),
          ]),
        };
  return NextResponse.json({ ok: true, simulated: true, reference: ref, postedAt: new Date().toISOString(), payload });
}
