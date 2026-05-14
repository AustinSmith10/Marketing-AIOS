import { anthropic, MODEL } from "@/lib/anthropic";
import { AgentUsage, ContentBrief } from "@/types";
import { getBaseSystemPrompt } from "@/knowledge/ddeg-domain-knowledge";

interface ResearchOptions {
  reprompt?: string;
  additionalUrls?: string;
  existingResearch?: string;
}

interface ResearchResult {
  research: string;
  usage: AgentUsage;
}

const MARKETING_GOALS = `
MARKETING GOALS — evaluate the brief against each of these and identify which ones this content serves:

1. SEO & Organic Search — rank for terms architects/developers/certifiers search when they have a compliance problem
2. Thought Leadership — own the performance-based compliance conversation; position DDEG as the authoritative voice
3. Market Education — grow awareness of Performance Solutions and engineering thinking; grow the pie
4. Lead Generation — direct CTA-driven content that converts readers into enquiries for DDEG
5. Referral & Shareability — content professionals forward to colleagues or share on LinkedIn
6. Trust & Credibility — build confidence with risk-averse audiences (certifiers, councils, heritage bodies)
7. Client Retention & Cross-sell — remind existing clients of DDEG services they haven't yet engaged
8. Talent Attraction — signal to engineers that DDEG is the most interesting and expert firm to work at
`.trim();

export async function runResearchAgent(
  brief: ContentBrief,
  options: ResearchOptions = {}
): Promise<ResearchResult> {
  const { reprompt, additionalUrls, existingResearch } = options;

  const today = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const system = [
    getBaseSystemPrompt(),
    "You are a content strategist and researcher for DDEG. Your job is to produce a structured CONTENT PLAN that will be reviewed and approved before writing begins. The plan must be strategic, specific, and actionable — not generic.",
  ].join("\n\n");

  const outputFormat = `
Return the content plan in exactly this format using markdown:

## Content Strategy

**Primary goal:** [single goal from the list below — the main reason to write this]
**Supporting goals:** [1–2 others that apply]
**Strategic rationale:** [2–3 sentences: why this topic, why now, why DDEG is the right voice]
**Target reader outcome:** [what the reader should think, feel, or do after reading]
**SEO opportunity:** [2–3 specific keyword phrases to target, and what search intent they reflect]

---

## Content Plan

**Recommended title:** [a compelling, specific H1 — not generic]
**Recommended word count:** ~[number] words
**Tone:** ${brief.tone}

### Outline

For each section, provide the H2 title, approximate word count, and a 1–2 sentence description of what it covers and why it earns its place in the piece.

**Introduction** (~[X] words)
[Hook idea. What problem, tension, or insight opens the piece. What the reader is promised.]

[Continue with all H2 sections...]

**Conclusion** (~[X] words)
[Key takeaway. How it connects back to DDEG's positioning. What the CTA will be.]

---

## Research Findings

[Key facts, current statistics, relevant Australian regulations, and industry context that should inform the content. Be specific — cite numbers, regulation names, dates.]

---

## Sources

- [Title](URL) — brief description
`.trim();

  const goals = MARKETING_GOALS;

  let userContent: string;

  if (existingResearch) {
    userContent = [
      `Today's date is ${today}.`,
      `You previously produced this content plan. EXPAND and IMPROVE it based on the additional instructions below. Return a single integrated, updated plan — do not just append.`,
      `\n## Existing Content Plan\n${existingResearch}`,
      reprompt ? `\n## Additional Focus\n${reprompt}` : "",
      additionalUrls ? `\n## Specific Sources to Include\nSearch for and incorporate:\n${additionalUrls}` : "",
      `\nTopic: ${brief.topic} | Audience: ${brief.audience} | Service area: ${brief.serviceArea}`,
      `\n${outputFormat}`,
    ].filter(Boolean).join("\n");
  } else {
    userContent = [
      `Today's date is ${today}.`,
      `Produce a content plan for the following brief.`,
      `Topic: ${brief.topic}`,
      `Content type: ${brief.contentType}`,
      `Service area: ${brief.serviceArea}`,
      `Target audience: ${brief.audience}`,
      `Tone: ${brief.tone}`,
      brief.keyPoints ? `Additional direction from the team:\n${brief.keyPoints}` : "",
      reprompt ? `Additional focus: ${reprompt}` : "",
      additionalUrls ? `Specific sources to include:\n${additionalUrls}` : "",
      `\n${goals}`,
      `\n${outputFormat}`,
    ].filter(Boolean).join("\n\n");
  }

  try {
    const tools: any[] = brief.includeResearch
      ? [{ type: "web_search_20250305", name: "web_search" }]
      : [];

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8096,
      ...(tools.length ? { tools } : {}),
      system,
      messages: [{ role: "user", content: userContent }],
    });

    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }

    return {
      research: text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error(error);
    return { research: "", usage: { inputTokens: 0, outputTokens: 0 } };
  }
}
