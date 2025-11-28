import { useOverallTendencies } from "../hooks/useOverallTendencies";
import type { TendencyDashboardProps } from "../types/local.ts";
import {
  IN_TUNE_THRESHOLD,
  TENDENCY_DASHBOARD_DISPLAY_LIMIT,
} from "../constants";
import { useRef } from "react";

export function TendencyDashboard({
  instrumentId,
  refreshTrigger,
  instrumentName,
}: TendencyDashboardProps) {
  // 1. Consume the data hook
  const { tendencies, isLoading, error } = useOverallTendencies(
    instrumentId,
    refreshTrigger,
  );
  const listRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return <p>Loading overall tendencies...</p>;
  }

  if (error) {
    return <p className="error">Error: {error}</p>;
  }

  // 2. Sort the data for better visualization (e.g., largest magnitude first)
  const sortedTendencies = tendencies.sort(
    (a, b) => Math.abs(b.meanCents) - Math.abs(a.meanCents),
  );

  // color palette shared with the tuner visuals
  const softGreen = "#34d399"; // in-tune
  const softPurple = "#a78bfa"; // sharp
  const softOrange = "#fb923c"; // flat
  // const neutralGray = "#94a3b8"; // muted text

  // Visual constants for bars
  const MAX_BAR_CENTS = 50; // cents that correspond to 100% bar width

  const totalSamples = sortedTendencies.reduce(
    (sum, t) => sum + t.totalSamples,
    0,
  );
  // Limit displayed rows to 10 and make the list scrollable when larger
  const DISPLAY_LIMIT = TENDENCY_DASHBOARD_DISPLAY_LIMIT;
  const displayedTendencies = sortedTendencies.slice(0, DISPLAY_LIMIT);

  // scroll position state
  const isAtBottom = listRef.current
    ? listRef.current.scrollHeight - listRef.current.scrollTop <=
      listRef.current.clientHeight + 1
    : true;

  return (
    <div className="tendency-dashboard space-y-4">
      <div className="flex items-baseline justify-around">
        <div>
          <h2 className="text-lg font-semibold">
            Overall Tendencies {instrumentName ? `— ${instrumentName}` : ""}
          </h2>
          <div className="text-sm text-gray-400">
            Data based on {totalSamples} total pitch samples.
          </div>
        </div>
      </div>

      {/* Responsive table-like list container */}
      <div className="bg-white/3 rounded-lg p-3">
        <div className="hidden md:grid grid-cols-12 gap-4 text-xs text-gray-400 pb-2 border-b border-white/6">
          <div className="col-span-3">Note</div>
          <div className="col-span-5">Deviation</div>
          <div className="col-span-2 text-right">Samples</div>
          <div className="col-span-2 text-right">Avg (¢)</div>
        </div>

        <div
          ref={listRef}
          className="space-y-2 mt-3 max-h-[48vh] overflow-y-auto pr-2 relative"
        >
          {displayedTendencies.map((t) => {
            const mean = t.meanCents;
            const absMean = Math.abs(mean);
            const color =
              absMean <= IN_TUNE_THRESHOLD
                ? softGreen
                : mean > 0
                  ? softPurple
                  : softOrange;
            const barPct = Math.min(100, (absMean / MAX_BAR_CENTS) * 100);

            return (
              <div
                key={`${t.noteString}-${t.instrumentId}`}
                className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4 py-2 px-2 rounded hover:bg-white/5"
              >
                {/* Note */}
                <div className="col-span-3 flex items-center">
                  <span className="text-base font-semibold mr-3 text-gray-100">
                    {t.noteString}
                  </span>
                </div>

                {/* Deviation bar */}
                <div className="col-span-5">
                  <div className="relative h-6 bg-white/5 rounded flex items-center">
                    {/* center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />

                    {/* negative (flat) bar goes to left */}
                    {mean < 0 && (
                      <div
                        className="absolute right-1/2 h-3 rounded-l"
                        style={{
                          width: `${barPct / 2}%`,
                          background: color,
                          transformOrigin: "right",
                        }}
                        aria-hidden={true}
                      />
                    )}

                    {/* positive (sharp) bar goes to right */}
                    {mean > 0 && (
                      <div
                        className="absolute left-1/2 h-3 rounded-r"
                        style={{
                          width: `${barPct / 2}%`,
                          background: color,
                          transformOrigin: "left",
                        }}
                        aria-hidden={true}
                      />
                    )}

                    {/* in-tune small indicator */}
                    {Math.abs(mean) <= IN_TUNE_THRESHOLD && (
                      <div
                        className="absolute left-1/2 w-2 h-2 rounded-full"
                        style={{
                          background: color,
                          transform: "translateX(-50%)",
                        }}
                        aria-hidden={true}
                      />
                    )}
                  </div>
                </div>

                {/* Samples */}
                <div className="col-span-2 text-right text-sm text-gray-300">
                  {t.totalSamples}
                </div>

                {/* Numeric mean */}
                <div
                  className="col-span-2 text-right text-sm"
                  style={{ color: color, width: "6ch" }}
                >
                  {mean >= 0 ? "+" : ""}
                  {mean.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalSamples > DISPLAY_LIMIT && (
        <button
          // 1. Add 'disabled' attribute based on state
          disabled={isAtBottom}
          onClick={() => {
            const el = listRef.current;
            if (el) {
              el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            }
          }}
          aria-label="Scroll to bottom"
          // 2. Adjust Tailwind classes based on state
          className={`block mx-auto mt-2 z-20
               ${
                 isAtBottom
                   ? "opacity-40 cursor-not-allowed" // Greyed out/disabled style
                   : "text-red-500"
               }
             `}
        >
          <svg
            width="28"
            height="14"
            viewBox="0 0 28 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden={true}
          >
            {/* Use currentColor so the path inherits the color/opacity set by the button class */}
            <path d="M2 0 H26 L14 14 Z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
