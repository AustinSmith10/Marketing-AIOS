"use client";

import { useEffect } from "react";
import { ContentBrief } from "@/types";

type WorkflowPhase = "idle" | "researching" | "research-review" | "writing" | "complete";

interface SessionState {
  phase: WorkflowPhase;
  currentBrief: ContentBrief | null;
  research: string;
  streamedContent: string;
  seoNotes: string;
}

const KEY = "ddeg_session";

export function saveSession(state: SessionState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function loadSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const state: SessionState = JSON.parse(raw);

    // Recover mid-flight phases to nearest stable state
    if (state.phase === "researching") {
      state.phase = state.research ? "research-review" : "idle";
    }
    if (state.phase === "writing") {
      state.phase = state.streamedContent ? "complete" : "idle";
    }

    return state;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function useSessionPersistence(state: SessionState) {
  useEffect(() => {
    // Don't persist idle — nothing to recover
    if (state.phase === "idle") {
      clearSession();
      return;
    }
    saveSession(state);
  }, [state.phase, state.currentBrief, state.research, state.streamedContent, state.seoNotes]);
}
