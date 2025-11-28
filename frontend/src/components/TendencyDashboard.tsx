import { useState, useRef } from "react";
import { useOverallTendencies } from "../hooks/useOverallTendencies";
import type { TendencyDashboardProps } from "../types/local.ts";
import {
  IN_TUNE_THRESHOLD,
  TENDENCY_DASHBOARD_DISPLAY_LIMIT,
} from "../constants";

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

  const [sortOption, setSortOption] = useState("pitch"); // Default sort by pitch
  const [sortOrder, setSortOrder] = useState("asc"); // Default ascending order

  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  const handleSortOrderChange = (order: string) => {
    setSortOrder(order);
  };

  // 2. Sort the data for better visualization (e.g., largest magnitude first)
  const sortedTendencies = tendencies.sort((a, b) => {
    let comparison = 0;
    if (sortOption === "pitch") {
      const pitchOrder = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      const aMatch = a.noteString.match(/([A-G]#?)(\d+)/);
      const bMatch = b.noteString.match(/([A-G]#?)(\d+)/);

      if (aMatch && bMatch) {
        const [_, aNote, aOctave] = aMatch;
        const [__, bNote, bOctave] = bMatch;
        const aIndex = pitchOrder.indexOf(aNote) + parseInt(aOctave) * 12;
        const bIndex = pitchOrder.indexOf(bNote) + parseInt(bOctave) * 12;
        comparison = aIndex - bIndex;
      }
    } else if (sortOption === "cents") {
      comparison = a.meanCents - b.meanCents;
    } else if (sortOption === "samples") {
      comparison = a.totalSamples - b.totalSamples;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

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

  if (isLoading) {
    return <p>Loading overall tendencies...</p>;
  }

  if (error) {
    return <p className="error">Error: {error}</p>;
  }

  return (
    <div className="tendency-dashboard space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {instrumentName ? `${instrumentName}` : ""}
        </h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-400">Sort by:</label>
          <button
            onClick={() => {
              const options = ["pitch", "cents", "samples"];
              const currentIndex = options.indexOf(sortOption);
              const nextIndex = (currentIndex + 1) % options.length;
              handleSortChange(options[nextIndex]);
            }}
            className="bg-white/5 text-white text-sm rounded px-2 py-1"
            aria-label="Cycle sort option"
            style={{ minWidth: "12ch" }}
          >
            {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
          </button>
          <button
            onClick={() =>
              handleSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
            }
            className="bg-white/5 text-white rounded px-2 py-1"
            aria-label="Toggle sort order"
          >
            {sortOrder === "asc" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M12 4.5a.75.75 0 01.53.22l6 6a.75.75 0 11-1.06 1.06L12 6.31l-5.47 5.47a.75.75 0 11-1.06-1.06l6-6A.75.75 0 0112 4.5z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M11.47 19.28a.75.75 0 001.06 0l6-6a.75.75 0 10-1.06-1.06L12 17.69l-5.47-5.47a.75.75 0 10-1.06 1.06l6 6z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Responsive table-like list for readability */}
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
