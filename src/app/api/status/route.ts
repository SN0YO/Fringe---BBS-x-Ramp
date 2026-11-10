import { NextResponse } from "next/server";
import { aiEnabled, hasKey, MODEL } from "@/lib/agent";

export async function GET() {
  return NextResponse.json({ ai: aiEnabled(), mode: aiEnabled() ? "live" : "demo", hasKey: hasKey(), model: aiEnabled() ? MODEL : null });
}
