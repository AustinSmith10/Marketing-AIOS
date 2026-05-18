"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "@/components/ui/Button";

interface ContentPlanProps {
  plan: string;
  isLoading: boolean;
  onApprove: (plan: string, notes: string) => void;
  onResearchMore: (reprompt: string, urls: string, currentPlan: string) => void;
  onCancel: () => void;
}

const ContentPlan: React.FC<ContentPlanProps> = ({
  plan,
  isLoading,
  onApprove,
  onResearchMore,
  onCancel,
}) => {
  const [editedPlan, setEditedPlan] = useState(plan);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [notes, setNotes] = useState("");
  const [urls, setUrls] = useState("");
  const [reprompt, setReprompt] = useState("");
  const [showExpand, setShowExpand] = useState(false);

  useEffect(() => {
    setEditedPlan(plan);
    setMode("preview");
  }, [plan]);

  return (
    <div className="flex gap-6 items-start">
      {/* Left: content plan document */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Content Plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review the strategy and structure, then approve to start writing
            </p>
          </div>
          {!isLoading && editedPlan && (
            <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`px-3 py-1.5 transition-colors ${
                  mode === "preview" ? "bg-[#0b1f5c] text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`px-3 py-1.5 transition-colors ${
                  mode === "edit" ? "bg-[#0b1f5c] text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Plan surface */}
        <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-[#0b1f5c]" />
                <span className="text-xs text-gray-500">Updating plan...</span>
              </div>
            </div>
          )}

          {mode === "preview" ? (
            <div className="px-8 py-6 min-h-[560px] prose prose-sm prose-gray max-w-none
              prose-headings:font-semibold prose-headings:text-gray-900
              prose-h1:text-xl prose-h1:mt-0 prose-h1:mb-4
              prose-h2:text-base prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
              prose-h3:text-sm prose-h3:mt-5 prose-h3:mb-2 prose-h3:font-semibold
              prose-p:text-gray-700 prose-p:leading-7 prose-p:my-2
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:my-2 prose-li:my-0.5 prose-li:text-gray-700
              prose-a:text-[#0b1f5c] prose-a:no-underline hover:prose-a:underline
              prose-hr:border-gray-100 prose-hr:my-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {editedPlan}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={editedPlan}
              onChange={(e) => setEditedPlan(e.target.value)}
              disabled={isLoading}
              rows={30}
              className="w-full px-8 py-6 text-sm leading-7 text-gray-800 font-mono resize-none focus:outline-none disabled:text-gray-400 bg-transparent"
              placeholder="Content plan will appear here..."
            />
          )}
        </div>
      </div>

      {/* Right: controls sidebar */}
      <div className="w-72 shrink-0 space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Notes for the writer
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="e.g. Lead with the cost angle, avoid mentioning competitor X, keep it practical"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed text-gray-800 focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Specific URLs to include
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={3}
              placeholder={"https://abcb.gov.au/...\nhttps://vba.vic.gov.au/..."}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono leading-relaxed text-gray-700 focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c] resize-none"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowExpand((v) => !v)}
              className="text-xs font-semibold text-[#0b1f5c] hover:underline uppercase tracking-wide"
            >
              {showExpand ? "− Hide" : "+ Refine the plan"}
            </button>
            {showExpand && (
              <textarea
                value={reprompt}
                onChange={(e) => setReprompt(e.target.value)}
                rows={4}
                placeholder="e.g. Make the SEO angle stronger, add a section on heritage buildings, change the structure to lead with regulation context"
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed text-gray-800 focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c] resize-none"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => onApprove(editedPlan, notes)}
            disabled={isLoading || !editedPlan}
          >
            Approve & Write
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            loading={isLoading}
            onClick={() => onResearchMore(reprompt, urls, editedPlan)}
            disabled={isLoading}
          >
            Refine Plan
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onCancel}
            disabled={isLoading}
          >
            ← Start Over
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentPlan;
