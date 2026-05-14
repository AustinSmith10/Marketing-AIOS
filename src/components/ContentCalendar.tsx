"use client";

import { useState, useCallback, useRef } from "react";
import { GeneratedContent } from "@/types";
import { updateContent } from "@/lib/storage";

// ─── helpers ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return toDateKey(new Date());
}

function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const dowMon = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < dowMon; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const TYPE_PILL: Record<string, string> = {
  blog: "bg-blue-100 text-blue-700 border border-blue-200",
  linkedin: "bg-purple-100 text-purple-700 border border-purple-200",
  capability: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};
function typePill(ct: string) {
  return TYPE_PILL[ct] ?? "bg-gray-100 text-gray-600 border border-gray-200";
}
const TYPE_LABEL: Record<string, string> = {
  blog: "Blog", linkedin: "LinkedIn", capability: "Capability",
};

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  items: GeneratedContent[];
  onItemsChange: (updated: GeneratedContent[]) => void;
}

export default function ContentCalendar({ items, onItemsChange }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Dragging ID — must survive async schedule call
  const draggingId = useRef<string | null>(null);

  // Counter map: tracks how many dragEnter events fired per zone without a
  // matching dragLeave. Required because dragging over a child element fires
  // dragLeave on the parent, so a simple boolean toggle doesn't work.
  const enterCount = useRef<Record<string, number>>({});

  const unscheduled = items.filter((i) => !i.scheduledDate);
  const scheduled = items.filter((i) => !!i.scheduledDate);
  const byDate = scheduled.reduce<Record<string, GeneratedContent[]>>((acc, item) => {
    const k = item.scheduledDate!;
    (acc[k] ??= []).push(item);
    return acc;
  }, {});

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  }

  const schedule = useCallback(async (contentId: string, dateKey: string | null) => {
    setScheduleError(null);
    try {
      const updated = await updateContent(contentId, { scheduledDate: dateKey ?? undefined });
      if (!updated) return;
      onItemsChange(items.map(i => i.id === contentId ? updated : i));
      setSelected(prev => prev?.id === contentId ? updated : prev);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setScheduleError(`Save failed: ${msg}`);
    }
  }, [items, onItemsChange]);

  // ── drag handlers ──────────────────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, id: string) {
    // text/plain is the only format guaranteed across all browsers
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    draggingId.current = id;
  }

  function onDragEnter(e: React.DragEvent, zone: string) {
    e.preventDefault();
    enterCount.current[zone] = (enterCount.current[zone] ?? 0) + 1;
    setDragOver(zone);
  }

  function onDragOver(e: React.DragEvent) {
    // Must prevent default on every dragover to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDragLeave(e: React.DragEvent, zone: string) {
    enterCount.current[zone] = Math.max(0, (enterCount.current[zone] ?? 1) - 1);
    if (enterCount.current[zone] === 0) setDragOver(null);
  }

  function onDrop(e: React.DragEvent, dateKey: string | null, zone: string) {
    e.preventDefault();
    enterCount.current[zone] = 0;
    setDragOver(null);
    // Read from dataTransfer first; fall back to ref in case getData returns ""
    const id = e.dataTransfer.getData("text/plain") || draggingId.current;
    draggingId.current = null;
    if (id) schedule(id, dateKey);
  }

  async function copyContent(item: GeneratedContent) {
    await navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const grid = monthGrid(year, month);
  const tk = todayKey();

  return (
    <div className="pt-6 space-y-3">
      {scheduleError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {scheduleError}
        </div>
      )}

      <div className="flex gap-4 min-h-[600px]">

        {/* ── Unscheduled sidebar ── */}
        <div className="w-56 shrink-0 flex flex-col gap-2">
          <div className={`text-xs font-semibold uppercase tracking-wide mb-1 px-1 transition-colors ${
            dragOver === "unscheduled" ? "text-[#0b1f5c]" : "text-gray-400"
          }`}>
            Unscheduled ({unscheduled.length})
          </div>

          <div
            onDragEnter={(e) => onDragEnter(e, "unscheduled")}
            onDragOver={onDragOver}
            onDragLeave={(e) => onDragLeave(e, "unscheduled")}
            onDrop={(e) => onDrop(e, null, "unscheduled")}
            className={`flex-1 rounded-xl border-2 border-dashed transition-all p-2 space-y-2 min-h-[80px] ${
              dragOver === "unscheduled"
                ? "border-[#0b1f5c] bg-blue-50 scale-[1.01]"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {unscheduled.length === 0 && dragOver !== "unscheduled" && (
              <p className="text-xs text-gray-400 text-center pt-4 px-2">All pieces are scheduled</p>
            )}
            {unscheduled.map((item) => (
              <DraggableCard
                key={item.id}
                item={item}
                onDragStart={(e) => onDragStart(e, item.id)}
                onClick={() => setSelected(item)}
                isSelected={selected?.id === item.id}
              />
            ))}
          </div>
        </div>

        {/* ── Calendar ── */}
        <div className="flex-1 flex flex-col">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              ←
            </button>
            <h2 className="text-base font-bold text-gray-900">{MONTHS[month]} {year}</h2>
            <button type="button" onClick={nextMonth}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              →
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className={`text-center text-xs font-semibold uppercase tracking-wide py-1 ${
                d === "Sat" || d === "Sun" ? "text-gray-300" : "text-gray-400"
              }`}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {grid.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              const dk = toDateKey(date);
              const isToday = dk === tk;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const dayItems = byDate[dk] ?? [];
              const isOver = dragOver === dk;

              return (
                <div
                  key={dk}
                  onDragEnter={(e) => onDragEnter(e, dk)}
                  onDragOver={onDragOver}
                  onDragLeave={(e) => onDragLeave(e, dk)}
                  onDrop={(e) => onDrop(e, dk, dk)}
                  className={`rounded-lg border p-1.5 min-h-[80px] flex flex-col gap-1 transition-all ${
                    isOver
                      ? "border-[#0b1f5c] bg-blue-50 ring-1 ring-[#0b1f5c] scale-[1.02]"
                      : isToday
                        ? "border-[#0b1f5c] bg-white"
                        : isWeekend
                          ? "border-gray-100 bg-gray-50/50"
                          : "border-gray-200 bg-white"
                  }`}
                >
                  <span className={`text-xs font-medium self-end leading-none ${
                    isToday ? "text-[#0b1f5c] font-bold" : isWeekend ? "text-gray-300" : "text-gray-400"
                  }`}>
                    {date.getDate()}
                  </span>

                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.id)}
                      onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                      className={`rounded px-1.5 py-1 text-xs font-medium truncate cursor-grab active:cursor-grabbing select-none ${typePill(item.brief.contentType)} hover:opacity-80`}
                    >
                      {item.brief.topic}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <div className="w-72 shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="space-y-1 min-w-0 pr-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typePill(selected.brief.contentType)}`}>
                  {TYPE_LABEL[selected.brief.contentType] ?? selected.brief.contentType}
                </span>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{selected.brief.topic}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)}
                className="text-gray-300 hover:text-gray-500 text-lg leading-none shrink-0 mt-0.5">×</button>
            </div>

            <div className="px-4 py-3 border-b border-gray-100 space-y-1.5 text-xs text-gray-500">
              <Row label="Audience" value={selected.brief.audience} />
              <Row label="Tone" value={selected.brief.tone.replace("-", " ")} />
              <Row label="Created" value={new Date(selected.createdAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })} />
              {selected.scheduledDate && (
                <div className="flex items-center justify-between">
                  <span>Scheduled</span>
                  <span className="font-medium text-[#0b1f5c]">
                    {new Date(selected.scheduledDate + "T00:00:00").toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Content</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {selected.content.slice(0, 800)}{selected.content.length > 800 ? "\n\n…" : ""}
              </pre>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 space-y-2">
              <button type="button" onClick={() => copyContent(selected)}
                className="w-full rounded-lg bg-[#0b1f5c] px-3 py-2 text-sm font-medium text-white hover:bg-[#1539a8] transition-colors">
                {copied ? "Copied!" : "Copy full content"}
              </button>
              {selected.scheduledDate ? (
                <button type="button" onClick={() => schedule(selected.id, null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Remove from calendar
                </button>
              ) : (
                <p className="text-xs text-gray-400 text-center">Drag to a date to schedule</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="capitalize font-medium text-gray-700">{value}</span>
    </div>
  );
}

// ─── DraggableCard ───────────────────────────────────────────────────────────

function DraggableCard({
  item, onDragStart, onClick, isSelected,
}: {
  item: GeneratedContent;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`rounded-lg border p-2 cursor-grab active:cursor-grabbing select-none transition-colors ${
        isSelected ? "border-[#0b1f5c] bg-white shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium mb-1 ${typePill(item.brief.contentType)}`}>
        {TYPE_LABEL[item.brief.contentType] ?? item.brief.contentType}
      </span>
      <p className="text-xs text-gray-800 font-medium leading-snug line-clamp-2">{item.brief.topic}</p>
    </div>
  );
}
