"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "@/components/ui/Button";
import { GeneratedContent } from "@/types";
import { copyToClipboard, exportToMarkdown, exportToWord } from "@/lib/export";

interface ContentOutputProps {
  content: string;
  seoNotes: string;
  researchBrief: string;
  isStreaming: boolean;
  isComplete: boolean;
  onSave: (editedContent: string) => void;
  savedContent: GeneratedContent | null;
}

function splitReferences(text: string): { body: string; references: string } {
  const match = /^##\s*References\s*$/im.exec(text);
  if (!match) return { body: text, references: "" };
  return {
    body: text.slice(0, match.index).trimEnd(),
    references: text.slice(match.index + match[0].length).trim(),
  };
}

const ContentOutput: React.FC<ContentOutputProps> = ({
  content,
  seoNotes,
  researchBrief,
  isStreaming,
  isComplete,
  onSave,
  savedContent,
}) => {
  const [editableContent, setEditableContent] = useState<string>(content);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [copied, setCopied] = useState<boolean>(false);
  const [showResearch, setShowResearch] = useState<boolean>(false);

  useEffect(() => {
    if (isStreaming) setEditableContent(content);
  }, [content, isStreaming]);

  // Switch to preview when streaming completes
  useEffect(() => {
    if (isComplete) setMode("preview");
  }, [isComplete]);

  const { body, references } = splitReferences(editableContent);

  const exportPayload: GeneratedContent =
    savedContent ??
    ({
      id: "unsaved",
      createdAt: new Date().toISOString(),
      status: "draft",
      brief: {
        contentType: "blog",
        serviceArea: "general",
        audience: "general",
        tone: "educational",
        topic: "Generated Content",
        includeResearch: Boolean(researchBrief),
      },
      content: editableContent,
      seoNotes,
      researchBrief,
    } as GeneratedContent);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status */}
          {isStreaming && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Writing...
            </div>
          )}
          {isComplete && savedContent && (
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              Auto-saved
            </span>
          )}

          {/* Preview / Edit toggle */}
          {!isStreaming && editableContent && (
            <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`px-3 py-1.5 transition-colors ${
                  mode === "preview"
                    ? "bg-[#0b1f5c] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`px-3 py-1.5 transition-colors ${
                  mode === "edit"
                    ? "bg-[#0b1f5c] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {isComplete && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                await copyToClipboard({ ...exportPayload, content: editableContent });
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => exportToMarkdown({ ...exportPayload, content: editableContent })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              .md
            </button>
            <button
              type="button"
              onClick={() => exportToWord({ ...exportPayload, content: editableContent })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              .docx
            </button>
            <Button size="sm" onClick={() => onSave(editableContent)}>
              Save edits
            </Button>
          </div>
        )}
      </div>

      {/* Editor / Preview surface */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Streaming: raw text */}
        {isStreaming && (
          <div className="px-8 py-6 min-h-[560px] text-sm leading-8 text-gray-800 whitespace-pre-wrap">
            {editableContent}
          </div>
        )}

        {/* Preview mode: rendered markdown */}
        {!isStreaming && mode === "preview" && (
          <div className="px-8 py-6 min-h-[560px] prose prose-sm prose-gray max-w-none
            prose-headings:font-semibold prose-headings:text-gray-900
            prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0
            prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-gray-700 prose-p:leading-8 prose-p:my-3
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:my-3 prose-li:my-1 prose-li:text-gray-700
            prose-a:text-[#0b1f5c] prose-a:no-underline hover:prose-a:underline
            prose-hr:border-gray-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {body}
            </ReactMarkdown>
          </div>
        )}

        {/* Edit mode: raw textarea */}
        {!isStreaming && mode === "edit" && (
          <textarea
            className="w-full min-h-[560px] px-8 py-6 text-sm leading-8 text-gray-800 resize-none focus:outline-none font-mono"
            value={body}
            onChange={(e) =>
              setEditableContent(
                references
                  ? `${e.target.value}\n\n## References\n${references}`
                  : e.target.value
              )
            }
          />
        )}
      </div>

      {/* References */}
      {references && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            References
          </h3>
          <div className="space-y-2.5">
            {references.split("\n").filter(Boolean).map((line, i) => {
              const match = line.match(/^-\s*\[(.+?)\]\((.+?)\)(?:\s*[—–-]\s*(.+))?/);
              if (match) {
                return (
                  <div key={i} className="flex gap-2.5 text-sm">
                    <span className="text-gray-300 shrink-0 select-none mt-0.5">—</span>
                    <span>
                      <a
                        href={match[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#0b1f5c] hover:underline"
                      >
                        {match[1]}
                      </a>
                      {match[3] && (
                        <span className="text-gray-400 text-xs"> — {match[3]}</span>
                      )}
                    </span>
                  </div>
                );
              }
              return (
                <p key={i} className="text-sm text-gray-600">
                  {line.replace(/^-\s*/, "")}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Research brief (collapsible) */}
      {researchBrief && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:bg-gray-50 transition-colors"
            onClick={() => setShowResearch((v) => !v)}
          >
            <span>Research Brief</span>
            <span>{showResearch ? "Hide" : "Show"}</span>
          </button>
          {showResearch && (
            <div className="px-6 pb-5 text-sm leading-7 text-gray-700 whitespace-pre-wrap border-t border-gray-100">
              {researchBrief}
            </div>
          )}
        </div>
      )}

      {/* SEO notes */}
      {isComplete && seoNotes && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            SEO Notes
          </h3>
          <div className="text-sm leading-7 text-gray-700 whitespace-pre-wrap">{seoNotes}</div>
        </div>
      )}
    </div>
  );
};

export default ContentOutput;
