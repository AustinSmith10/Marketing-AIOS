"use client";

import { useState } from "react";
import { GeneratedContent } from "@/types";

const ANALYTICS_PASSWORD = "DDEG123!";

// Claude Sonnet 4.6 pricing (USD per million tokens)
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

function calcCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`;
  return `$${usd.toFixed(4)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog: "Blog",
  linkedin: "LinkedIn",
  capability: "Capability",
  research: "Research",
};

interface AnalyticsTabProps {
  items: GeneratedContent[];
  onRefresh: () => void;
}

export default function AnalyticsTab({ items, onRefresh }: AnalyticsTabProps) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  if (!unlocked) {
    return (
      <div className="pt-6 flex justify-center">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Analytics</h2>
            <p className="text-sm text-gray-400 mt-0.5">Enter the password to continue</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (input === ANALYTICS_PASSWORD) {
              setUnlocked(true);
              setError(false);
            } else {
              setError(true);
              setInput("");
            }
          }} className="space-y-3">
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="Password"
              autoFocus
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                error ? "border-red-300 bg-red-50 placeholder-red-300" : "border-gray-200 focus:border-[#0b1f5c]"
              }`}
            />
            {error && <p className="text-xs text-red-500">Incorrect password</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#0b1f5c] px-4 py-2 text-sm font-medium text-white hover:bg-[#1539a8] transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tracked = items.filter(
    (i) => (i.inputTokens ?? 0) > 0 || (i.outputTokens ?? 0) > 0
  );
  const untracked = items.length - tracked.length;

  const totalInput = tracked.reduce((s, i) => s + (i.inputTokens ?? 0), 0);
  const totalOutput = tracked.reduce((s, i) => s + (i.outputTokens ?? 0), 0);
  const totalCost = calcCost(totalInput, totalOutput);
  const avgCost = tracked.length > 0 ? totalCost / tracked.length : 0;

  // Per content-type breakdown
  const byType = tracked.reduce<Record<string, { count: number; inputTokens: number; outputTokens: number }>>(
    (acc, item) => {
      const t = item.brief.contentType;
      if (!acc[t]) acc[t] = { count: 0, inputTokens: 0, outputTokens: 0 };
      acc[t].count++;
      acc[t].inputTokens += item.inputTokens ?? 0;
      acc[t].outputTokens += item.outputTokens ?? 0;
      return acc;
    },
    {}
  );

  return (
    <div className="pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">API Usage & Cost</h2>
          <p className="text-sm text-gray-500">
            Claude Sonnet 4.6 · $3 / MTok input · $15 / MTok output
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total spend" value={`$${totalCost.toFixed(4)}`} sub="USD" />
        <StatCard label="Pieces tracked" value={String(tracked.length)} sub={untracked > 0 ? `${untracked} without data` : "all tracked"} />
        <StatCard label="Avg per piece" value={`$${avgCost.toFixed(4)}`} sub="USD" />
        <StatCard
          label="Total tokens"
          value={formatTokens(totalInput + totalOutput)}
          sub={`${formatTokens(totalInput)} in · ${formatTokens(totalOutput)} out`}
        />
      </div>

      {/* By content type */}
      {Object.keys(byType).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Breakdown by content type
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(byType)
              .sort(([, a], [, b]) => calcCost(b.inputTokens, b.outputTokens) - calcCost(a.inputTokens, a.outputTokens))
              .map(([type, stats]) => {
                const cost = calcCost(stats.inputTokens, stats.outputTokens);
                const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
                return (
                  <div key={type} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-24 shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          type === "blog"
                            ? "bg-blue-100 text-blue-800"
                            : type === "linkedin"
                              ? "bg-purple-100 text-purple-800"
                              : type === "capability"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {CONTENT_TYPE_LABELS[type] ?? type}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0b1f5c]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 w-20 shrink-0">
                      {stats.count} {stats.count === 1 ? "piece" : "pieces"}
                    </div>
                    <div className="text-right text-sm font-medium text-gray-900 w-24 shrink-0">
                      ${cost.toFixed(4)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Per-item table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Per-piece breakdown
          </h3>
        </div>
        {tracked.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No usage data yet. Generate content to start tracking costs.
            {untracked > 0 && (
              <p className="mt-1 text-xs">
                {untracked} existing {untracked === 1 ? "piece was" : "pieces were"} created before tracking was enabled.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-2 font-medium">Topic</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium text-right">Input</th>
                  <th className="px-3 py-2 font-medium text-right">Output</th>
                  <th className="px-3 py-2 font-medium text-right">Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tracked.map((item) => {
                  const inp = item.inputTokens ?? 0;
                  const out = item.outputTokens ?? 0;
                  const cost = calcCost(inp, out);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-800 max-w-[260px] truncate">
                        {item.brief.topic}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.brief.contentType === "blog"
                              ? "bg-blue-100 text-blue-800"
                              : item.brief.contentType === "linkedin"
                                ? "bg-purple-100 text-purple-800"
                                : item.brief.contentType === "capability"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {CONTENT_TYPE_LABELS[item.brief.contentType] ?? item.brief.contentType}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-xs">
                        {new Date(item.createdAt).toLocaleDateString("en-AU", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-500 whitespace-nowrap text-xs">
                        {formatTokens(inp)}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-500 whitespace-nowrap text-xs">
                        {formatTokens(out)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatCost(cost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-medium">
                  <td className="px-5 py-3 text-gray-700" colSpan={3}>
                    Total ({tracked.length} {tracked.length === 1 ? "piece" : "pieces"})
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 text-xs">{formatTokens(totalInput)}</td>
                  <td className="px-3 py-3 text-right text-gray-600 text-xs">{formatTokens(totalOutput)}</td>
                  <td className="px-3 py-3 text-right text-gray-900">${totalCost.toFixed(4)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
    </div>
  );
}
