"use client";

import { useEffect, useState } from "react";
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
  const [copied, setCopied] = useState<boolean>(false);
  const [showResearch, setShowResearch] = useState<boolean>(false);

  useEffect(() => {
    if (isStreaming) setEditableContent(content);
  }, [content, isStreaming]);

  const status = isStreaming
    ? { label: "Generating...", className: "bg-yellow-100 text-yellow-800" }
    : isComplete && savedContent
      ? { label: "Saved", className: "bg-green-100 text-green-800" }
      : isComplete
        ? { label: "Ready to save", className: "bg-blue-100 text-blue-800" }
        : { label: "", className: "" };

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
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Generated Content</h2>
        {(isStreaming || isComplete) && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        )}
      </div>

      {researchBrief && (
        <div className="mt-4">
          <button
            type="button"
            className="text-sm font-medium text-[#0b1f5c] hover:underline"
            onClick={() => setShowResearch((v) => !v)}
          >
            {showResearch ? "Hide research brief" : "Show research brief"}
          </button>
          {showResearch && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-[#f8f9fa] p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {researchBrief}
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <textarea
          className="w-full min-h-[400px] rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c]"
          value={editableContent}
          onChange={(e) => setEditableContent(e.target.value)}
          readOnly={isStreaming}
        />
      </div>

      {isComplete && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              await copyToClipboard({ ...exportPayload, content: editableContent });
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>

          <Button onClick={() => onSave(editableContent)}>Save to Library</Button>

          <Button
            variant="ghost"
            onClick={() =>
              exportToMarkdown({ ...exportPayload, content: editableContent })
            }
          >
            Download MD
          </Button>

          <Button
            variant="ghost"
            onClick={() => exportToWord({ ...exportPayload, content: editableContent })}
          >
            Download Word
          </Button>
        </div>
      )}

      {isComplete && seoNotes && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900">SEO notes</h3>
          <div className="mt-2 rounded-lg border border-gray-200 bg-[#f8f9fa] p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {seoNotes}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentOutput;

