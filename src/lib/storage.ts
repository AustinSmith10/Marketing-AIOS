import { createSupabaseBrowserClient } from "@/lib/supabase";
import { ContentBrief, GeneratedContent } from "@/types";

type ContentRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  topic: string;
  content_type: ContentBrief["contentType"];
  service_area: ContentBrief["serviceArea"];
  audience: ContentBrief["audience"];
  tone: ContentBrief["tone"];
  target_length: string | null;
  content: string;
  seo_notes: string | null;
  research_brief: string | null;
  created_at: string;
  status: GeneratedContent["status"];
};

export async function saveContent(
  content: Omit<GeneratedContent, "id" | "createdAt">,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<GeneratedContent | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("content")
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName || userEmail,
        topic: content.brief.topic,
        content_type: content.brief.contentType,
        service_area: content.brief.serviceArea,
        audience: content.brief.audience,
        tone: content.brief.tone,
        target_length: content.brief.targetLength ?? null,
        content: content.content,
        seo_notes: content.seoNotes ?? null,
        research_brief: content.researchBrief ?? null,
        status: content.status,
      })
      .select()
      .single<ContentRow>();

    if (error || !data) {
      console.error(error);
      return null;
    }

    const mapped: GeneratedContent = {
      id: data.id,
      brief: {
        contentType: data.content_type,
        serviceArea: data.service_area,
        audience: data.audience,
        tone: data.tone,
        topic: data.topic,
        targetLength: data.target_length ?? undefined,
        includeResearch: Boolean(data.research_brief),
      },
      content: data.content,
      seoNotes: data.seo_notes ?? undefined,
      researchBrief: data.research_brief ?? undefined,
      createdAt: data.created_at,
      status: data.status,
      userEmail: data.user_email,
      userName: data.user_name ?? undefined,
    };

    return mapped;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getAllContent(): Promise<GeneratedContent[]> {
  try {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error(error);
      return [];
    }

    return (data as ContentRow[]).map((row) => ({
      id: row.id,
      brief: {
        contentType: row.content_type,
        serviceArea: row.service_area,
        audience: row.audience,
        tone: row.tone,
        topic: row.topic,
        targetLength: row.target_length ?? undefined,
        includeResearch: Boolean(row.research_brief),
      },
      content: row.content,
      seoNotes: row.seo_notes ?? undefined,
      researchBrief: row.research_brief ?? undefined,
      createdAt: row.created_at,
      status: row.status,
      userEmail: row.user_email,
      userName: row.user_name ?? undefined,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function deleteContent(id: string): Promise<void> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("content").delete().eq("id", id);
    if (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
}

export async function updateContent(
  id: string,
  updates: Partial<GeneratedContent>
): Promise<GeneratedContent | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    const updatePayload: Partial<Pick<ContentRow, "status">> = {};
    if (updates.status) {
      updatePayload.status = updates.status;
    }

    if (Object.keys(updatePayload).length === 0) {
      return null;
    }

    const { data, error } = await supabase
      .from("content")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single<ContentRow>();

    if (error || !data) {
      console.error(error);
      return null;
    }

    const mapped: GeneratedContent = {
      id: data.id,
      brief: {
        contentType: data.content_type,
        serviceArea: data.service_area,
        audience: data.audience,
        tone: data.tone,
        topic: data.topic,
        targetLength: data.target_length ?? undefined,
        includeResearch: Boolean(data.research_brief),
      },
      content: data.content,
      seoNotes: data.seo_notes ?? undefined,
      researchBrief: data.research_brief ?? undefined,
      createdAt: data.created_at,
      status: data.status,
      userEmail: data.user_email,
      userName: data.user_name ?? undefined,
    };

    return mapped;
  } catch (error) {
    console.error(error);
    return null;
  }
}

