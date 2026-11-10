import { NextResponse } from "next/server";
import { aiEnabled, askFringe } from "@/lib/agent";
import { retrieve } from "@/lib/knowledge";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, context } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    context: string;
  };
  if (!aiEnabled()) {
    const last = messages.at(-1)?.content ?? "";
    const docs = retrieve(last, 2).filter((d) => d.id !== "irs-general");
    const d = docs[0] ?? retrieve(last, 1)[0];
    return NextResponse.json({
      answer: `Offline mode (no ANTHROPIC_API_KEY set), so here's the most relevant section I found:\n\n**${d.title}** (${d.source} · ${d.ref})\n\n${d.text}`,
      offline: true,
    });
  }
  try {
    return NextResponse.json({ answer: await askFringe(messages, context) });
  } catch (e) {
    return NextResponse.json({ answer: `Something went wrong reaching Claude: ${e instanceof Error ? e.message : "unknown error"}` });
  }
}
