export type ContentType = "blog" | "linkedin" | "capability" | "research";

export type ServiceArea =
  | "fire"
  | "buildingPerformance"
  | "acoustics"
  | "access"
  | "facade"
  | "esd"
  | "general";

export type Audience =
  | "architects"
  | "builders"
  | "certifiers"
  | "developers"
  | "general";

export type Tone =
  | "thought-leadership"
  | "educational"
  | "technical"
  | "commercial"
  | "news-commentary";

export interface ContentBrief {
  contentType: ContentType;
  serviceArea: ServiceArea;
  audience: Audience;
  tone: Tone;
  topic: string;
  keyPoints?: string;
  targetLength?: string;
  includeResearch: boolean;
}

export interface AgentUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GeneratedContent {
  id: string;
  brief: ContentBrief;
  content: string;
  seoNotes?: string;
  researchBrief?: string;
  createdAt: string;
  status: "draft" | "reviewed" | "exported";
  userEmail?: string;
  userName?: string;
  inputTokens?: number;
  outputTokens?: number;
  scheduledDate?: string; // YYYY-MM-DD
}

export type AgentStreamEvent =
  | { event: "research" | "seo-pre" | "content" | "seo-post" | "done"; data: string }
  | { event: "usage"; data: AgentUsage };
