import { GeneratedContent } from "@/types";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "ddeg-content-library";

export function saveContent(
  content: Omit<GeneratedContent, "id" | "createdAt">
): GeneratedContent {
  const item: GeneratedContent = {
    ...content,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = getAllContent();
    const updated = [item, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error(error);
  }

  return item;
}

export function getAllContent(): GeneratedContent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GeneratedContent[]) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function getContent(id: string): GeneratedContent | null {
  const all = getAllContent();
  return all.find((x) => x.id === id) ?? null;
}

export function updateContent(
  id: string,
  updates: Partial<GeneratedContent>
): GeneratedContent | null {
  try {
    const all = getAllContent();
    const idx = all.findIndex((x) => x.id === id);
    if (idx === -1) return null;

    const updatedItem: GeneratedContent = { ...all[idx], ...updates };
    const updatedAll = [...all];
    updatedAll[idx] = updatedItem;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));
    return updatedItem;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function deleteContent(id: string): void {
  try {
    const all = getAllContent();
    const filtered = all.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error(error);
  }
}

