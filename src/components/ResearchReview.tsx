"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

interface ResearchReviewProps {
  research: string;
  isLoading: boolean;
  onApprove: (research: string, notes: string) => void;
  onResearchMore: (reprompt: string, urls: string, currentResearch: string) => void;
  onReject: (reprompt: string, urls: string) => void;
}

const ResearchReview: React.FC<ResearchReviewProps> = ({
  research,
  isLoading,
  onApprove,
  onResearchMore,
  onReject,
}) => {
  const [editedResearch, setEditedResearch] = useState(research);
  const [notes, setNotes] = useState("");
  const [urls, setUrls] = useState("");
  const [reprompt, setReprompt] = useState("");
  const [showExpand, setShowExpand] = useState(false);

  useEffect(() => {
    setEditedResearch(research);
  }, [research]);

  return (
    <div className="flex gap-6 items-start">
      {/* Left: research document */}
      <div className="flex-1 min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Research Brief</h2>
            <p className="text-xs text-gray-400 mt-0.5">Edit directly, then approve when ready</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1 font-medium">
            Step 2 of 3
          </span>
        </div>

        <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-[#0b1f5c]" />
                <span className="text-xs text-gray-500">Researching...</span>
              </div>
            </div>
          )}
          <textarea
            value={editedResearch}
            onChange={(e) => setEditedResearch(e.target.value)}
            disabled={isLoading}
            rows={28}
            className="w-full px-6 py-5 text-sm leading-7 text-gray-800 resize-none focus:outline-none disabled:text-gray-400 bg-transparent"
            placeholder="Research will appear here..."
          />
        </div>
      </div>

      {/* Right: controls panel */}
      <div className="w-72 shrink-0 space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Notes for the writer
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="e.g. Focus on NCC 2025 changes, lead with the cost angle"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed text-gray-800 focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Specific URLs to pull in
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
              {showExpand ? "Hide" : "+ Add research focus"}
            </button>
            {showExpand && (
              <textarea
                value={reprompt}
                onChange={(e) => setReprompt(e.target.value)}
                rows={4}
                placeholder="e.g. Also cover embodied carbon requirements for Class 2 buildings in WA"
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed text-gray-800 focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c] resize-none"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => onApprove(editedResearch, notes)}
            disabled={isLoading}
          >
            Approve & Write
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            loading={isLoading}
            onClick={() => onResearchMore(reprompt, urls, editedResearch)}
            disabled={isLoading}
          >
            Research More
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onReject(reprompt, urls)}
            disabled={isLoading}
          >
            Reject & Redo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResearchReview;
