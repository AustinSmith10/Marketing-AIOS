import { anthropic, MODEL } from "@/lib/anthropic";
import { AgentUsage, ContentBrief } from "@/types";
import {
  getBaseSystemPrompt,
  getAudiencePrompt,
  getServicePrompt,
} from "@/knowledge/ddeg-domain-knowledge";

export async function* runCapabilityAgent(
  brief: ContentBrief,
  researchBrief?: string,
  onUsage?: (usage: AgentUsage) => void
): AsyncGenerator<string> {
  const systemPrompt = [
    getBaseSystemPrompt(),
    getAudiencePrompt(brief.audience as any),
    getServicePrompt(brief.serviceArea as any),
  ].join("\n\n");

  const today = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const userParts: string[] = [
    `Today's date is ${today}. All content must reflect the current year and current industry context.`,
    `Topic: ${brief.topic}`,
    brief.keyPoints ? `Key points to cover:\n${brief.keyPoints}` : "",
    `Tone: ${brief.tone}`,
    researchBrief
      ? `Content plan — use the strategy and research findings from this plan to inform the capability statement:\n\n${researchBrief}`
      : "",
    "Write a capability statement that:",
    '- Is written in third person (e.g. "DDEG provides...", "The DDEG team...")',
    "- Leads with outcomes the client receives, then explains process",
    "- Is factual and specific — no vague marketing language",
    "- Uses clear sections with these headings: Overview, What We Do, How We Work, Why DDEG",
    "- Is approximately 400-600 words",
    "- Mentions relevant credentials where appropriate to the service area: ISO 9001/14001/45001, Engineers Australia, AAAC, ACA, AIBS, NATA accreditation",
    "- References DDEG's national presence (offices in Melbourne, Sydney, Brisbane, Canberra, Hobart, Albury, Adelaide) and experience since 2012",
    '- Ends with: "Contact DDEG at ddeg.com.au or call 1300 470 578"',
    "Write in markdown format with proper headings.",
    "Be specific to the Australian building industry.",
    "Educate first, do not sell.",
  ].filter(Boolean);

  const userMessage = userParts.join("\n\n");

  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      yield chunk.delta.text;
    }
  }

  const finalMsg = await stream.finalMessage();
  if (onUsage) {
    onUsage({
      inputTokens: finalMsg.usage.input_tokens,
      outputTokens: finalMsg.usage.output_tokens,
    });
  }
}
