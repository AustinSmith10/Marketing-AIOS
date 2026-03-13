import { anthropic, MODEL } from "@/lib/anthropic";
import { ContentBrief } from "@/types";

export async function getSeoKeywords(brief: ContentBrief): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are an SEO specialist for an Australian engineering consultancy. Suggest SEO keywords and a meta description for the following content brief.

       Topic: ${brief.topic}
       Content type: ${brief.contentType}
       Target audience: ${brief.audience}
       Service area: ${brief.serviceArea}

       Return exactly this format:
       Primary keyword: [one keyword phrase]
       Secondary keywords: [comma separated list of 3-5 phrases]
       Meta description: [155 characters max, compelling, includes primary keyword]`,
        },
      ],
    });

    return (response.content[0] as any).text ?? "";
  } catch (error) {
    console.error(error);
    return "";
  }
}

export async function getSeoReview(
  brief: ContentBrief,
  content: string
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are an SEO specialist. Review the following content and provide a brief SEO assessment.

       Topic: ${brief.topic}
       Target audience: ${brief.audience}

       Content to review:
       ${content.substring(0, 3000)}

       Return a short bullet-point review covering: heading structure, keyword usage, readability, content length, and one suggested improvement. Max 150 words.`,
        },
      ],
    });

    return (response.content[0] as any).text ?? "";
  } catch (error) {
    console.error(error);
    return "";
  }
}

