import { anthropic, MODEL } from "@/lib/anthropic";
import { ContentBrief } from "@/types";
import {
  getBaseSystemPrompt,
  getAudiencePrompt,
  getServicePrompt,
} from "@/knowledge/ddeg-domain-knowledge";

export async function* runBlogAgent(
  brief: ContentBrief,
  researchBrief?: string
): AsyncGenerator<string> {
  const systemPrompt = [
    getBaseSystemPrompt(),
    getAudiencePrompt(brief.audience as any),
    getServicePrompt(brief.serviceArea as any),
  ].join("\n\n");

  const targetLength = brief.targetLength ?? "approximately 1000 words";
  const userParts: string[] = [
    `Topic: ${brief.topic}`,
    brief.keyPoints ? `Key points to cover:\n${brief.keyPoints}` : "",
    `Target length: ${targetLength}`,
    `Tone: ${brief.tone}`,
    researchBrief ? `Research brief (use to inform the article):\n${researchBrief}` : "",
    "Write in markdown format with proper H1, H2, H3 headings.",
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
}
