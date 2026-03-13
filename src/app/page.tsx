"use client";

import { useCallback, useEffect, useState } from "react";
import BriefForm from "@/components/BriefForm";
import ContentOutput from "@/components/ContentOutput";
import { AgentStreamEvent, ContentBrief, GeneratedContent } from "@/types";
import { getAllContent, saveContent } from "@/lib/storage";

export default function Home() {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [seoNotes, setSeoNotes] = useState<string>("");
  const [researchBrief, setResearchBrief] = useState<string>("");
  const [savedContent, setSavedContent] = useState<GeneratedContent | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"generate" | "library">("generate");
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentBrief, setCurrentBrief] = useState<ContentBrief | null>(null);
  const [libraryItems, setLibraryItems] = useState<GeneratedContent[]>([]);

  useEffect(() => {
    if (activeTab !== "library") return;
    setLibraryItems(getAllContent());
  }, [activeTab]);

  const handleSubmit = useCallback(async (brief: ContentBrief) => {
    setIsStreaming(true);
    setIsComplete(false);
    setStreamedContent("");
    setSeoNotes("");
    setResearchBrief("");
    setSavedContent(null);
    setHasStarted(true);
    setCurrentBrief(brief);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });

      const reader = response.body?.getReader();
      if (!reader) {
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();

      outer: while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const messages = chunkText.split("\n\n");

        for (const msg of messages) {
          if (!msg.startsWith("data: ")) continue;
          const json = msg.slice("data: ".length).trim();
          if (!json) continue;

          const event: AgentStreamEvent = JSON.parse(json);

          if (event.event === "research") {
            setResearchBrief(event.data);
          } else if (event.event === "seo-pre") {
            // ignore for now
          } else if (event.event === "content") {
            setStreamedContent((prev) => prev + event.data);
          } else if (event.event === "seo-post") {
            setSeoNotes(event.data);
          } else if (event.event === "done") {
            setIsStreaming(false);
            setIsComplete(true);
            break outer;
          }
        }
      }
    } catch (error) {
      console.error(error);
      setIsStreaming(false);
    }
  }, []);

  const handleSave = useCallback(
    (editedContent: string) => {
      if (!currentBrief) return;
      const saved = saveContent({
        brief: currentBrief,
        content: editedContent,
        seoNotes,
        researchBrief,
        status: "draft",
      });
      setSavedContent(saved);
    },
    [currentBrief, seoNotes, researchBrief]
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          className={`px-4 py-2 text-sm transition-colors ${
            activeTab === "generate"
              ? "border-b-2 border-[#0b1f5c] text-[#0b1f5c] font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("generate")}
        >
          Generate Content
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm transition-colors ${
            activeTab === "library"
              ? "border-b-2 border-[#0b1f5c] text-[#0b1f5c] font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("library")}
        >
          Content Library
        </button>
      </div>

      {activeTab === "generate" && (
        <div
          className={
            hasStarted
              ? "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6"
              : "max-w-2xl mx-auto mt-6"
          }
        >
          <div>
            <BriefForm onSubmit={handleSubmit} isLoading={isStreaming} />
          </div>

          {hasStarted && (
            <div>
              <ContentOutput
                content={streamedContent}
                isStreaming={isStreaming}
                isComplete={isComplete}
                seoNotes={seoNotes}
                researchBrief={researchBrief}
                savedContent={savedContent}
                onSave={handleSave}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "library" && (
        <div className="mt-6">
          {libraryItems.length === 0 ? (
            <div className="text-sm text-gray-600">
              No saved content yet. Generate your first piece above.
            </div>
          ) : (
            <div className="space-y-3">
              {libraryItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.brief.topic}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-[#f0f4ff] px-2 py-0.5 text-xs font-medium text-[#0b1f5c]">
                          {item.brief.contentType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm transition-colors text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        navigator.clipboard.writeText(item.content)
                      }
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
