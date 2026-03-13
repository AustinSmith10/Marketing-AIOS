import { AgentStreamEvent, ContentBrief } from "@/types";
import { runResearchAgent } from "@/agents/research";
import { getSeoKeywords, getSeoReview } from "@/agents/seo";
import { runBlogAgent } from "@/agents/blog";
import { runLinkedInAgent } from "@/agents/linkedin";
import { runCapabilityAgent } from "@/agents/capability";

export async function* runOrchestrator(
  brief: ContentBrief
): AsyncGenerator<AgentStreamEvent> {
  let researchBrief = "";

  if (brief.includeResearch) {
    try {
      researchBrief = await runResearchAgent(brief);
      yield { event: "research", data: researchBrief };
    } catch (error) {
      console.error(error);
      researchBrief = "";
    }
  }

  try {
    const seoKeywords = await getSeoKeywords(brief);
    yield { event: "seo-pre", data: seoKeywords };
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
  for await (const chunk of writingAgent(brief, researchBrief)) {
    fullContent += chunk;
    yield { event: "content", data: chunk };
  }

  try {
    const seoReview = await getSeoReview(brief, fullContent);
    yield { event: "seo-post", data: seoReview };
  } catch (error) {
    console.error(error);
  }

  yield { event: "done", data: "" };
}

