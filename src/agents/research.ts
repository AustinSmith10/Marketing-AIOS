import { anthropic, MODEL } from "@/lib/anthropic";
import { ContentBrief } from "@/types";
import { getBaseSystemPrompt } from "@/knowledge/ddeg-domain-knowledge";

export async function runResearchAgent(brief: ContentBrief): Promise<string> {
  try {
    const system = [
      getBaseSystemPrompt(),
      'You are a research assistant. Your job is to find accurate, current, Australian-context information to support content creation. Search for authoritative sources including ABCB, VBA, Engineers Australia, and relevant industry publications. Return a structured research brief only — no fluff.',
    ].join("\n\n");

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system,
      messages: [
        {
          role: "user",
          content: `Research the following topic for an Australian engineering audience and return a structured brief with: key facts, relevant Australian regulations or standards, current industry context, and 3-5 specific insights that would strengthen content about this topic.
       
       Topic: ${brief.topic}
       Target audience: ${brief.audience}
       Service area: ${brief.serviceArea}`,
        },
      ],
    });

    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }

    return text;
  } catch (error) {
    console.error(error);
    return "";
  }
}

