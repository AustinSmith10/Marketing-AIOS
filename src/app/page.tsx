"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AnalyticsTab from "@/components/AnalyticsTab";
import BriefForm from "@/components/BriefForm";
import ContentCalendar from "@/components/ContentCalendar";
import ContentOutput from "@/components/ContentOutput";
import ContentPlan from "@/components/ContentPlan";
import StepIndicator from "@/components/StepIndicator";
import { AgentStreamEvent, AgentUsage, ContentBrief, GeneratedContent } from "@/types";
import { deleteContent, getAllContent, saveContent, updateContent } from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { copyToClipboard } from "@/lib/export";
import { loadSession, useSessionPersistence, clearSession } from "@/lib/useSessionPersistence";
import { User } from "lucide-react";

type WorkflowPhase = "idle" | "researching" | "research-review" | "writing" | "complete";

export default function Home() {
  const router = useRouter();

  const [phase, setPhase] = useState<WorkflowPhase>("idle");
  const [currentBrief, setCurrentBrief] = useState<ContentBrief | null>(null);
  const [research, setResearch] = useState<string>("");
  const [isResearchLoading, setIsResearchLoading] = useState<boolean>(false);
  const researchAbortRef = useRef<AbortController | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [seoNotes, setSeoNotes] = useState<string>("");

  // Restore session after mount (avoids SSR/localStorage hydration mismatch)
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setPhase(session.phase);
      setCurrentBrief(session.currentBrief);
      setResearch(session.research);
      setStreamedContent(session.streamedContent);
      setSeoNotes(session.seoNotes);
    }
  }, []);
  const [savedContent, setSavedContent] = useState<GeneratedContent | null>(null);
  const [sessionUsage, setSessionUsage] = useState<AgentUsage>({ inputTokens: 0, outputTokens: 0 });
  const [activeTab, setActiveTab] = useState<"generate" | "library" | "calendar" | "analytics">("generate");

  useEffect(() => {
    const saved = localStorage.getItem("activeTab") as any;
    if (saved) setActiveTab(saved);
  }, []);
  const [libraryItems, setLibraryItems] = useState<GeneratedContent[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isAdmin = currentUser?.email?.endsWith("@ddeg.com.au") ?? false;

  function switchTab(tab: "generate" | "library" | "calendar" | "analytics") {
    localStorage.setItem("activeTab", tab);
    setActiveTab(tab);
  }

  useSessionPersistence({ phase, currentBrief, research, streamedContent, seoNotes });

  useEffect(() => {
    const getUser = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const loadLibrary = useCallback(async () => {
    const items = await getAllContent();
    setLibraryItems(items);
  }, []);

  const toggleReady = useCallback(async (item: GeneratedContent) => {
    const newStatus = item.status === "ready" ? "draft" : "ready";
    const updated = await updateContent(item.id, { status: newStatus });
    if (updated) setLibraryItems(prev => prev.map(i => i.id === item.id ? updated : i));
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const runResearch = useCallback(async (
    brief: ContentBrief,
    options: { reprompt?: string; additionalUrls?: string; existingResearch?: string } = {}
  ): Promise<string> => {
    researchAbortRef.current?.abort();
    const controller = new AbortController();
    researchAbortRef.current = controller;
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, ...options }),
        signal: controller.signal,
      });
      const { research: result, usage } = await res.json();
      if (usage) {
        setSessionUsage((prev) => ({
          inputTokens: prev.inputTokens + (usage.inputTokens ?? 0),
          outputTokens: prev.outputTokens + (usage.outputTokens ?? 0),
        }));
      }
      return result ?? "";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "";
      throw err;
    }
  }, []);

  const runWriting = useCallback(async (brief: ContentBrief, researchBrief: string) => {
    setPhase("writing");
    setStreamedContent("");
    setSeoNotes("");
    setSavedContent(null);

    // Local accumulators so we have the final values for auto-save
    let finalContent = "";
    let finalSeoNotes = "";
    let writingUsage: AgentUsage = { inputTokens: 0, outputTokens: 0 };

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, researchBrief }),
      });

      const reader = response.body?.getReader();
      if (!reader) { setPhase("idle"); return; }

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

          if (event.event === "content") {
            finalContent += event.data;
            setStreamedContent((prev) => prev + event.data);
          } else if (event.event === "seo-post") {
            finalSeoNotes = event.data;
            setSeoNotes(event.data);
          } else if (event.event === "usage") {
            writingUsage = event.data;
          } else if (event.event === "done") {
            setPhase("complete");
            break outer;
          }
        }
      }

      // Merge writing usage into session usage
      const totalInputTokens = sessionUsage.inputTokens + writingUsage.inputTokens;
      const totalOutputTokens = sessionUsage.outputTokens + writingUsage.outputTokens;
      setSessionUsage({ inputTokens: totalInputTokens, outputTokens: totalOutputTokens });

      // Auto-save on completion (include combined token counts for this content session)
      if (finalContent) {
        const saved = await saveContent(
          {
            brief,
            content: finalContent,
            seoNotes: finalSeoNotes,
            researchBrief,
            status: "draft",
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
          },
          currentUser?.id || "",
          currentUser?.email || "",
          currentUser?.user_metadata?.full_name || currentUser?.email || ""
        );
        if (saved) setSavedContent(saved);
      }
    } catch (error) {
      console.error(error);
      setPhase("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, sessionUsage]);

  const handleSubmit = useCallback(async (brief: ContentBrief) => {
    setCurrentBrief(brief);
    setResearch("");
    setStreamedContent("");
    setSeoNotes("");
    setSavedContent(null);
    setSessionUsage({ inputTokens: 0, outputTokens: 0 });
    setPhase("researching");
    const result = await runResearch(brief);
    if (!result) return;
    setResearch(result);
    setPhase("research-review");
  }, [runResearch]);

  const handleResearchMore = useCallback(async (
    reprompt: string,
    additionalUrls: string,
    currentResearch: string
  ) => {
    if (!currentBrief) return;
    setIsResearchLoading(true);
    const result = await runResearch(currentBrief, { reprompt, additionalUrls, existingResearch: currentResearch });
    setResearch(result);
    setIsResearchLoading(false);
  }, [currentBrief, runResearch]);

  const handleReject = useCallback(async (reprompt: string, additionalUrls: string) => {
    if (!currentBrief) return;
    setPhase("researching");
    setResearch("");
    const result = await runResearch(currentBrief, { reprompt, additionalUrls });
    setResearch(result);
    setPhase("research-review");
  }, [currentBrief, runResearch]);

  const handleApprove = useCallback(async (editedResearch: string, notes: string) => {
    if (!currentBrief) return;
    const combined = [
      editedResearch,
      notes ? `\n## Writer Notes\n${notes}` : "",
    ].filter(Boolean).join("\n");
    await runWriting(currentBrief, combined);
  }, [currentBrief, runWriting]);

  const handleSave = useCallback(async (editedContent: string) => {
    if (!currentBrief) return;
    if (savedContent) {
      // Update the existing auto-saved record
      const updated = await updateContent(savedContent.id, { content: editedContent, seoNotes });
      if (updated) setSavedContent(updated);
    } else {
      const saved = await saveContent(
        { brief: currentBrief, content: editedContent, seoNotes, researchBrief: research, status: "draft" },
        currentUser?.id || "",
        currentUser?.email || "",
        currentUser?.user_metadata?.full_name || currentUser?.email || ""
      );
      if (saved) setSavedContent(saved);
    }
  }, [currentBrief, seoNotes, research, currentUser, savedContent]);

  const handleOpen = useCallback((item: GeneratedContent) => {
    clearSession();
    setCurrentBrief(item.brief);
    setStreamedContent(item.content);
    setSeoNotes(item.seoNotes ?? "");
    setResearch(item.researchBrief ?? "");
    setSavedContent(item);
    setPhase("complete");
    switchTab("generate");
  }, []);

  const handleReset = useCallback(() => {
    researchAbortRef.current?.abort();
    researchAbortRef.current = null;
    clearSession();
    setPhase("idle");
    setCurrentBrief(null);
    setResearch("");
    setStreamedContent("");
    setSeoNotes("");
    setSavedContent(null);
    setSessionUsage({ inputTokens: 0, outputTokens: 0 });
  }, []);

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
            onClick={() => switchTab("generate")}
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
            onClick={() => switchTab("library")}
          >
            Content Library
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === "calendar"
                ? "border-b-2 border-[#0b1f5c] text-[#0b1f5c] font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => { switchTab("calendar"); loadLibrary(); }}
          >
            Calendar
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === "analytics"
                ? "border-b-2 border-[#0b1f5c] text-[#0b1f5c] font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => switchTab("analytics")}
          >
            Analytics
          </button>
        </div>

        {activeTab === "generate" && (
          <div className="pt-6">
            <StepIndicator
              current={
                phase === "idle" ? 1
                : phase === "researching" || phase === "research-review" ? 2
                : 3
              }
            />

            {phase === "idle" && (
              <div className="mx-auto max-w-xl">
                <BriefForm onSubmit={handleSubmit} isLoading={false} />
              </div>
            )}

            {phase === "researching" && (
              <div className="mx-auto max-w-xl">
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0b1f5c]" />
                  <p className="text-sm font-semibold text-gray-700">Building your content plan...</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {currentBrief?.includeResearch
                      ? "Researching and mapping out the strategy"
                      : "Mapping out the strategy and structure"}
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {phase === "research-review" && (
              <ContentPlan
                plan={research}
                isLoading={isResearchLoading}
                onApprove={handleApprove}
                onResearchMore={handleResearchMore}
                onCancel={handleReset}
              />
            )}

            {(phase === "writing" || phase === "complete") && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  {currentBrief && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">{currentBrief.topic}</span>
                      <span className="mx-2 text-gray-300">·</span>
                      <span className="capitalize">{currentBrief.contentType}</span>
                      <span className="mx-2 text-gray-300">·</span>
                      <span className="capitalize">{currentBrief.audience}</span>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    Start New
                  </button>
                </div>
                <ContentOutput
                  content={streamedContent}
                  isStreaming={phase === "writing"}
                  isComplete={phase === "complete"}
                  seoNotes={seoNotes}
                  researchBrief={research}
                  savedContent={savedContent}
                  onSave={handleSave}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "calendar" && (
          <ContentCalendar
            items={libraryItems}
            onItemsChange={(updated) => setLibraryItems(updated)}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab items={libraryItems} onRefresh={loadLibrary} />
        )}

        {activeTab === "library" && (
          <div className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Content Library</h2>
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

                        <span className="text-gray-500">{item.brief.serviceArea}</span>

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
                        <span>{item.userName || item.userEmail || "Unknown author"}</span>
                      </div>

                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.status === "ready"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "draft"
                                ? "bg-gray-100 text-gray-700"
                                : item.status === "reviewed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        className={`w-full rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          item.status === "ready"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                        onClick={() => toggleReady(item)}
                      >
                        {item.status === "ready" ? "✓ Ready for calendar" : "Mark as ready"}
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded-lg border border-[#0b1f5c] bg-[#0b1f5c] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1539a8]"
                          onClick={() => handleOpen(item)}
                        >
                          Open & Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={async () => { await copyToClipboard(item); }}
                        >
                          Copy
                        </button>
                        {(isAdmin || currentUser?.id === item.userId) && (
                          <button
                            type="button"
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50"
                            onClick={async () => {
                              await deleteContent(item.id);
                              await loadLibrary();
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
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
