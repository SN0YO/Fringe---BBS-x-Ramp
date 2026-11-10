import { NextResponse } from "next/server";
import { aiEnabled, MODEL } from "@/lib/agent";

export async function GET() {
  return NextResponse.json({ ai: aiEnabled(), model: aiEnabled() ? MODEL : null });
}
