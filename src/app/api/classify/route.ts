import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { aiEnabled, classifyWithClaude, type ClassifyInput } from "@/lib/agent";
import { classifyRules } from "@/lib/rules";

export const maxDuration = 60;

export async function POST(req: Request) {
  const tx = (await req.json()) as ClassifyInput;
  if (!aiEnabled()) {
    return NextResponse.json({ classification: classifyRules(tx), fallback: "no_api_key" });
  }
  try {
    return NextResponse.json({ classification: await classifyWithClaude(tx) });
  } catch (err) {
    const msg =
      err instanceof Anthropic.RateLimitError ? "Rate limited by the Claude API"
      : err instanceof Anthropic.AuthenticationError ? "Invalid Anthropic API key"
      : err instanceof Anthropic.APIError ? `Claude API error ${err.status}: ${err.message}`
      : err instanceof Error ? err.message : "Unknown error";
    // Degrade gracefully: return the offline engine's answer and surface the error.
    return NextResponse.json({ classification: classifyRules(tx), fallback: "error", error: msg });
  }
}
