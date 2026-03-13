import { anthropic, MODEL } from "@/lib/anthropic";
import { ContentBrief } from "@/types";
import {
  getBaseSystemPrompt,
  getAudiencePrompt,
  getServicePrompt,
} from "@/knowledge/ddeg-domain-knowledge";

export async function* runLinkedInAgent(
  brief: ContentBrief,
  researchBrief?: string
): AsyncGenerator<string> {
  const systemPrompt = [
    getBaseSystemPrompt(),
    getAudiencePrompt(brief.audience as any),
    getServicePrompt(brief.serviceArea as any),
  ].join("\n\n");

  const baseInstructions = [
    "Write a LinkedIn post of 150-300 words. For thought-leadership tone you may go up to 500 words if needed.",
    "Start with a strong hook in the first line that is compelling before the 'see more' cutoff (around 150 characters).",
    "Use short paragraphs with one idea per paragraph and plenty of white space.",
    "End with a question or prompt that encourages comments and discussion.",
    "Include 4-6 relevant hashtags at the end, chosen from: #PerformanceSolutions #NCC #BCA #FireEngineering #BuildingCompliance #AustralianConstruction #PerformanceBasedDesign #DDEG #AcousticsEngineering #FacadeEngineering #BuildingSurveyors.",
    "Do NOT use phrases like 'excited to share', 'thrilled to announce', or any generic corporate clichés.",
    "Write like a senior Australian engineer sharing a genuine insight with peers.",
    "Do not use markdown headings. LinkedIn is plain text with line breaks only.",
    "Be specific to the Australian building industry.",
    "Educate first, do not sell.",
  ];

  const userParts: string[] = [
    `Content type: LinkedIn post`,
    `Topic: ${brief.topic}`,
    brief.keyPoints ? `Key points to cover:\n${brief.keyPoints}` : "",
    `Tone: ${brief.tone}`,
    researchBrief ? `Research brief (use to inform the post):\n${researchBrief}` : "",
    baseInstructions.join("\n"),
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

