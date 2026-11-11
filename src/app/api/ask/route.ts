import { NextResponse } from "next/server";
import { aiEnabled, askFringe } from "@/lib/agent";
import { retrieve } from "@/lib/knowledge";
import { recordedAnswer } from "@/lib/recorded";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, context } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    context: string;
  };
  if (!aiEnabled()) {
    const last = messages.at(-1)?.content ?? "";
    // Demo mode: replay the recorded AI answer for this exact question if we have one.
    const rec = recordedAnswer(last);
    if (rec) return NextResponse.json({ answer: rec, recorded: true });
    const docs = retrieve(last, 3).filter((d) => d.id !== "irs-general");
    const d = docs[0] ?? retrieve(last, 1)[0];
    const also = docs.slice(1, 3).map((x) => x.title).join("; ");
    return NextResponse.json({
      answer:
        `**Demo mode:** live AI answers are off, so here is the most relevant passage Fringe retrieved:\n\n**${d.title}** (${d.ref})\n\n${d.text}` +
        (d.note ? `\n\n*Fringe note (not IRS text):* ${d.note}` : "") +
        (also ? `\n\nAlso relevant: ${also}.` : ""),
      offline: true,
    });
  }
  try {
    return NextResponse.json({ answer: await askFringe(messages, context) });
  } catch (e) {
    return NextResponse.json({ answer: `Something went wrong reaching the AI model: ${e instanceof Error ? e.message : "unknown error"}` });
  }
}
