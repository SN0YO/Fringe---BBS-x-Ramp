import { NextResponse } from "next/server";
import { aiEnabled, readReceipt } from "@/lib/agent";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { imageDataUrl } = (await req.json()) as { imageDataUrl: string };
  if (!aiEnabled()) return NextResponse.json({ error: "Receipt reading needs ANTHROPIC_API_KEY. Add line items manually instead." }, { status: 400 });
  try {
    return NextResponse.json({ receipt: await readReceipt(imageDataUrl) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to read receipt" }, { status: 500 });
  }
}
