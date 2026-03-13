"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BriefForm from "@/components/BriefForm";
import ContentOutput from "@/components/ContentOutput";
import { AgentStreamEvent, ContentBrief, GeneratedContent } from "@/types";
import { deleteContent, getAllContent, saveContent } from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { copyToClipboard } from "@/lib/export";
import { User } from "lucide-react";

export default function Home() {
  const router = useRouter();
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const loadLibrary = useCallback(async () => {
    const items = await getAllContent();
    setLibraryItems(items);
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

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
    async (editedContent: string) => {
      if (!currentBrief) return;
      const saved = await saveContent(
        {
          brief: currentBrief,
          content: editedContent,
          seoNotes,
          researchBrief,
          status: "draft",
        },
        currentUser?.id || "",
        currentUser?.email || "",
        currentUser?.user_metadata?.full_name || currentUser?.email || ""
      );
      setSavedContent(saved);
    },
    [currentBrief, seoNotes, researchBrief, currentUser]
  );

  const handleLogout = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-end">
          <div className="flex items-center gap-3 text-sm">
            {currentUser?.email && (
              <span className="text-gray-600">{currentUser.email}</span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Log out
            </button>
          </div>
        </div>

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
                ? "grid grid-cols-1 gap-6 pt-6 lg:grid-cols-2"
                : "mx-auto max-w-2xl pt-6"
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
          <div className="pt-6">
            <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Content Library
              </h2>
              <p className="text-sm text-gray-500">
                {libraryItems.length}{" "}
                {libraryItems.length === 1 ? "piece saved" : "pieces saved"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadLibrary()}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Refresh
            </button>
          </div>

            {libraryItems.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-center text-gray-400">
                <p className="text-sm font-medium">No content saved yet</p>
                <p className="mt-1 text-xs">
                  Generate your first piece using the Generate Content tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {libraryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {item.brief.topic}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                          item.brief.contentType === "blog"
                            ? "bg-blue-100 text-blue-800"
                            : item.brief.contentType === "linkedin"
                              ? "bg-purple-100 text-purple-800"
                              : item.brief.contentType === "capability"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.brief.contentType === "blog"
                          ? "Blog"
                          : item.brief.contentType === "linkedin"
                            ? "LinkedIn"
                            : item.brief.contentType === "capability"
                              ? "Capability"
                              : item.brief.contentType}
                      </span>

                      <span className="text-gray-500">
                        {item.brief.serviceArea}
                      </span>

                      <span className="text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString("en-AU", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        {item.userName || item.userEmail || "Unknown author"}
                      </span>
                    </div>

                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "draft"
                            ? "bg-gray-100 text-gray-700"
                            : item.status === "reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                      </span>
                    </div>
                  </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={async () => {
                          await copyToClipboard(item);
                        }}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50"
                        onClick={async () => {
                          await deleteContent(item.id);
                          await loadLibrary();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
