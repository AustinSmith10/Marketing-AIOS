import { AgentStreamEvent, AgentUsage, ContentBrief } from "@/types";
import { getSeoKeywords, getSeoReview } from "@/agents/seo";
import { runBlogAgent } from "@/agents/blog";
import { runLinkedInAgent } from "@/agents/linkedin";
import { runCapabilityAgent } from "@/agents/capability";

function addUsage(acc: AgentUsage, delta: AgentUsage): AgentUsage {
  return {
    inputTokens: acc.inputTokens + delta.inputTokens,
    outputTokens: acc.outputTokens + delta.outputTokens,
  };
}

export async function* runOrchestrator(
  brief: ContentBrief,
  researchBrief = ""
): AsyncGenerator<AgentStreamEvent> {
  const totalUsage: AgentUsage = { inputTokens: 0, outputTokens: 0 };

  try {
    const seo = await getSeoKeywords(brief);
    Object.assign(totalUsage, addUsage(totalUsage, seo.usage));
    yield { event: "seo-pre", data: seo.text };
  } catch (error) {
    console.error(error);
  }

  const writingAgent =
    brief.contentType === "linkedin"
      ? runLinkedInAgent
      : brief.contentType === "capability"
        ? runCapabilityAgent
        : runBlogAgent;

  let fullContent = "";
  for await (const chunk of writingAgent(brief, researchBrief, (usage) => {
    Object.assign(totalUsage, addUsage(totalUsage, usage));
  })) {
    fullContent += chunk;
    yield { event: "content", data: chunk };
  }

  try {
    const seoReview = await getSeoReview(brief, fullContent);
    Object.assign(totalUsage, addUsage(totalUsage, seoReview.usage));
    yield { event: "seo-post", data: seoReview.text };
  } catch (error) {
    console.error(error);
  }

  yield { event: "usage", data: totalUsage };
  yield { event: "done", data: "" };
}
