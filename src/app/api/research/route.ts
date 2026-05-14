import { NextRequest } from "next/server";
import { ContentBrief } from "@/types";
import { runResearchAgent } from "@/agents/research";

export async function POST(req: NextRequest) {
  const { brief, reprompt, additionalUrls, existingResearch } = await req.json();

  if (!brief?.topic) {
    return new Response(JSON.stringify({ error: "Missing topic" }), { status: 400 });
  }

  try {
    const result = await runResearchAgent(brief as ContentBrief, {
      reprompt,
      additionalUrls,
      existingResearch,
    });
    return new Response(
      JSON.stringify({ research: result.research, usage: result.usage }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Research error:", error);
    return new Response(JSON.stringify({ error: "Research failed" }), { status: 500 });
  }
}
