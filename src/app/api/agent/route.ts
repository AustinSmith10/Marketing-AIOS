import { NextRequest } from "next/server";
import { ContentBrief } from "@/types";
import { runOrchestrator } from "@/agents/orchestrator";

export async function POST(req: NextRequest) {
  const brief: ContentBrief = await req.json();

  if (!brief?.topic || !brief?.contentType) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: topic and contentType" }),
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runOrchestrator(brief)) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
      } catch (error) {
        const status = (error as any)?.status ?? (error as any)?.statusCode;
        const isRateLimit = status === 429;
        const message = isRateLimit
          ? "Rate limit reached — please wait 30 seconds and try again"
          : "An error occurred while generating content. Please try again.";
        const errorEvent = { event: "done", data: message };
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
        );
        console.error("Orchestrator error:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

