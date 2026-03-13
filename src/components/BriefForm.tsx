"use client";

import { useState, FormEvent } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import {
  Audience,
  ContentBrief,
  ContentType,
  ServiceArea,
  Tone,
} from "@/types";

interface BriefFormProps {
  onSubmit: (brief: ContentBrief) => void;
  isLoading: boolean;
}

const BriefForm: React.FC<BriefFormProps> = ({ onSubmit, isLoading }) => {
  const [contentType, setContentType] = useState<ContentType>("blog");
  const [serviceArea, setServiceArea] = useState<ServiceArea>("general");
  const [audience, setAudience] = useState<Audience>("general");
  const [tone, setTone] = useState<Tone>("educational");
  const [topic, setTopic] = useState<string>("");
  const [keyPoints, setKeyPoints] = useState<string>("");
  const [targetLength, setTargetLength] = useState<string>("medium");
  const [topicError, setTopicError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      setTopicError("Please enter a topic");
      return;
    }

    setTopicError(null);

    const brief: ContentBrief = {
      contentType,
      serviceArea,
      audience,
      tone,
      topic: topic.trim(),
      keyPoints: keyPoints.trim() || undefined,
      targetLength,
      includeResearch: false,
    };

    onSubmit(brief);
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              { value: "fire", label: "Fire Safety Engineering" },
              {
                value: "buildingPerformance",
                label: "Building Performance Solutions",
              },
              { value: "acoustics", label: "Acoustics & Vibration" },
              { value: "access", label: "Access Consulting" },
              { value: "facade", label: "Façade Engineering" },
              { value: "esd", label: "ESD / Energy Efficiency" },
              { value: "general", label: "General / Multi-discipline" },
            ]}
            required
          />

          <Select
            label="Audience"
            value={audience}
            onChange={(value) => setAudience(value as Audience)}
            options={[
              { value: "architects", label: "Architects & Designers" },
              { value: "builders", label: "Builders & Developers" },
              {
                value: "certifiers",
                label: "Building Surveyors & Certifiers",
              },
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

          <Select
            label="Target Length"
            value={targetLength}
            onChange={setTargetLength}
            options={[
              { value: "short", label: "Short (~400 words)" },
              { value: "medium", label: "Medium (~800 words)" },
              { value: "long", label: "Long (~1200 words)" },
            ]}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            rows={3}
            placeholder="e.g. Why performance solutions are underused in heritage buildings"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c]"
          />
          {topicError && (
            <p className="mt-1 text-sm text-red-600">{topicError}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Key Points (optional)
          </label>
          <textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            rows={3}
            placeholder="Add specific angles, points, or notes for the agent"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0b1f5c] focus:outline-none focus:ring-1 focus:ring-[#0b1f5c]"
          />
        </div>

        <Button
          type="submit"
          loading={isLoading}
          className="mt-2 w-full"
        >
          Generate Content
        </Button>
      </form>
    </div>
  );
};

export default BriefForm;

