"use client";

import { useState, FormEvent } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { Audience, ContentBrief, ContentType, ServiceArea, Tone } from "@/types";

interface BriefFormProps {
  onSubmit: (brief: ContentBrief) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const BriefForm: React.FC<BriefFormProps> = ({ onSubmit, isLoading, disabled }) => {
  const [contentType, setContentType] = useState<ContentType>("blog");
  const [serviceArea, setServiceArea] = useState<ServiceArea>("general");
  const [audience, setAudience] = useState<Audience>("general");
  const [tone, setTone] = useState<Tone>("educational");
  const [topic, setTopic] = useState<string>("");
  const [keyPoints, setKeyPoints] = useState<string>("");
  const [includeResearch, setIncludeResearch] = useState<boolean>(false);
  const [topicError, setTopicError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setTopicError("Please enter a topic");
      return;
    }
    setTopicError(null);
    onSubmit({
      contentType,
      serviceArea,
      audience,
      tone,
      topic: topic.trim(),
      keyPoints: keyPoints.trim() || undefined,
      includeResearch,
    });
  };

  return (
    <div className={`rounded-xl bg-white shadow-sm overflow-hidden ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Content Brief</h2>
        <p className="text-xs text-gray-400 mt-0.5">Fill in the brief &mdash; we&apos;ll build a content plan before writing</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Content Type"
            value={contentType}
            onChange={(value) => setContentType(value as ContentType)}
            options={[
              { value: "blog", label: "Blog Post" },
              { value: "linkedin", label: "LinkedIn Post" },
              { value: "capability", label: "Capability Statement" },
            ]}
            required
          />
          <Select
            label="Service Area"
            value={serviceArea}
            onChange={(value) => setServiceArea(value as ServiceArea)}
            options={[
              { value: "fire", label: "Fire Safety" },
              { value: "buildingPerformance", label: "Building Performance" },
              { value: "acoustics", label: "Acoustics" },
              { value: "access", label: "Access Consulting" },
              { value: "facade", label: "Façade Engineering" },
              { value: "esd", label: "ESD / Energy" },
              { value: "general", label: "General" },
            ]}
            required
          />
          <Select
            label="Audience"
            value={audience}
            onChange={(value) => setAudience(value as Audience)}
            options={[
              { value: "architects", label: "Architects" },
              { value: "builders", label: "Builders & Developers" },
              { value: "certifiers", label: "Building Surveyors" },
              { value: "developers", label: "Property Developers" },
              { value: "general", label: "General" },
            ]}
            required
          />
          <Select
            label="Tone"
            value={tone}
            onChange={(value) => setTone(value as Tone)}
            options={[
              { value: "thought-leadership", label: "Thought Leadership" },
              { value: "educational", label: "Educational" },
              { value: "technical", label: "Technical" },
              { value: "commercial", label: "Commercial" },
              { value: "news-commentary", label: "News Commentary" },
            ]}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Topic</label>
          <textarea
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setTopicError(null); }}
            required
            rows={3}
            placeholder="e.g. Why performance solutions are underused in heritage buildings"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm leading-relaxed focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c] resize-none"
          />
          {topicError && <p className="mt-1 text-xs text-red-500">{topicError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Direction{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            rows={2}
            placeholder="Specific angles, points, or context for the content plan"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm leading-relaxed focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c] resize-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setIncludeResearch((v) => !v)}
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            includeResearch
              ? "border-[#0b1f5c] bg-[#0b1f5c] text-white"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span className="font-medium">Web Research</span>
          <span className={`text-xs ${includeResearch ? "text-blue-200" : "text-gray-400"}`}>
            {includeResearch ? "On — live Australian industry search" : "Off — uses DDEG knowledge base only"}
          </span>
        </button>

        <Button type="submit" loading={isLoading} className="w-full">
          Build Content Plan
        </Button>
      </form>
    </div>
  );
};

export default BriefForm;
