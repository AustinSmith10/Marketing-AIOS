import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { GeneratedContent } from "@/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function exportToMarkdown(content: GeneratedContent): Promise<void> {
  const header = `---\ntitle: ${content.brief.topic}\ndate: ${content.createdAt}\naudience: ${content.brief.audience}\nservice: ${content.brief.serviceArea}\n---\n\n`;
  const markdown = header + content.content;
  const blob = new Blob([markdown], { type: "text/markdown" });
  saveAs(blob, `${slugify(content.brief.topic)}.md`);
}

export async function exportToWord(content: GeneratedContent): Promise<void> {
  try {
    const paragraphs: Paragraph[] = [];
    const lines = content.content.split("\n");

    for (const line of lines) {
      if (line.startsWith("# ")) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(line.slice(2))],
          })
        );
        continue;
      }

      if (line.startsWith("## ")) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun(line.slice(3))],
          })
        );
        continue;
      }

      if (line.startsWith("### ")) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun(line.slice(4))],
          })
        );
        continue;
      }

      if (line.trim() === "") {
        paragraphs.push(new Paragraph({}));
        continue;
      }

      paragraphs.push(new Paragraph({ children: [new TextRun(line)] }));
    }

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${slugify(content.brief.topic)}.docx`);
  } catch (error) {
    console.error(error);
  }
}

export async function copyToClipboard(content: GeneratedContent): Promise<void> {
  try {
    await navigator.clipboard.writeText(content.content);
  } catch (error) {
    console.error(error);
  }
}

