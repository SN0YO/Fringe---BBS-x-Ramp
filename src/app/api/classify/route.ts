import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { aiEnabled, classifyWithModel, type ClassifyInput } from "@/lib/agent";
import { classifyRules } from "@/lib/rules";
import { recordedClassification } from "@/lib/recorded";

export const maxDuration = 60;

export async function POST(req: Request) {
  const tx = (await req.json()) as ClassifyInput;
  if (!aiEnabled()) {
    // Demo mode: replay a recorded AI output if we have one, else the free offline engine.
    const rec = recordedClassification(tx);
    if (rec) return NextResponse.json({ classification: { ...rec, classifiedAt: new Date().toISOString() }, recorded: true });
    return NextResponse.json({ classification: classifyRules(tx), fallback: "demo_mode" });
  }
  try {
    return NextResponse.json({ classification: await classifyWithModel(tx) });
  } catch (err) {
    const msg =
      err instanceof Anthropic.RateLimitError ? "Rate limited by the AI provider"
      : err instanceof Anthropic.AuthenticationError ? "Invalid Anthropic API key"
      : err instanceof Anthropic.APIError ? `AI API error ${err.status}: ${err.message}`
      : err instanceof Error ? err.message : "Unknown error";
    // Degrade gracefully: return the offline engine's answer and surface the error.
    return NextResponse.json({ classification: classifyRules(tx), fallback: "error", error: msg });
  }
}
