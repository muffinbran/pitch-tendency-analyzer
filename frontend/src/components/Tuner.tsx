import type { TunerProps } from "../types/local";
import { IN_TUNE_THRESHOLD } from "../constants.ts";

export function Tuner({
  displayFrequency,
  displayNote,
  lastNote,
  lastFrequency,
}: TunerProps) {
  // Prefer currently sounding note for visual state, but fall back to lastNote
  // for textual/frequency display. If neither exists, use C0 default.
  const fallback: Required<
    Pick<
      import("../types/local").NoteInfo,
      "note" | "octave" | "noteString" | "cents"
    >
  > = {
    note: "C",
    octave: 0,
    noteString: "C0",
    cents: 0,
  };
  const textNote = displayNote ?? lastNote ?? fallback;
  const cents = displayNote?.cents ?? textNote.cents;
  const threshold = IN_TUNE_THRESHOLD; // cents threshold for "in tune"

  // Prefer the live displayFrequency, then the lastFrequency captured by the hook,
  // and only if neither is available compute an approximate frequency from the NoteInfo.
  const displayFreqForText = displayFrequency ?? lastFrequency ?? 16.35; // C0 frequency fallback

  // softer, less piercing colors (base hex colors)
  const softGreen = "#34d399"; // green-400
  const softPurple = "#a78bfa"; // purple-300
  const softOrange = "#fb923c"; // orange-400
  const neutralGray = "#f3f4f6"; // gray-100
  const subtleOutline = "#e5e7eb"; // gray-200-ish for outline when idle
  const idleLabelGray = "#9ca3af"; // gray-400 for text when idle

  // `hasNote` (for ring/visuals) should reflect whether something is currently sounding
  const hasNote = !!displayNote;

  // Visual geometry (units are SVG viewBox units: 0..100)
  const INNER_R = 28; // Inner circle radius
  const BASE_GAP = 12; // Default ring gap
  const MAX_ADDITIONAL_GAP = 24; // Max extra gap for ring when very off-tune
  const MAX_VISIBLE_CENTS = 50;
  // Increase base active stroke so the ring starts thicker when active
  const STROKE_WIDTH = 6; // was 4

  // Base stroke sizes: raise idle widths so the starting outline is thicker
  const IDLE_RING_WIDTH = 1.6; // was 0.8
  const IDLE_INNER_WIDTH = 1.2; // was 0.8

  // compute excess beyond the in-tune threshold
  const excess = Math.max(0, Math.abs(cents) - threshold);
  const frac = Math.min(excess / MAX_VISIBLE_CENTS, 1);

  // Map tuning error (frac 0..1) to a stroke width for the ring: make it grow non-linearly
  // when off-tune, so small deviations are subtle and large deviations produce a thicker ring.
  // Increase sensitivity and max growth so the ring thickness responds more strongly to cents error.
  const MAX_RING_INCREASE = 14; // increase max growth (was 10)
  const RING_SENSITIVITY_EXP = 1.5; // slight adjustment to response curve
  const activeRingStrokeWidth =
    STROKE_WIDTH + Math.pow(frac, RING_SENSITIVITY_EXP) * MAX_RING_INCREASE;

  // Inner circle stroke: increase base and growth so it ends thicker at max error
  const ACTIVE_INNER_BASE = 2.0; // was 1.4
  const innerGrowth = 3.0; // was 2.0

  // Final stroke widths depend on whether a note exists; idle keeps thin outlines
  const ringStrokeWidth = hasNote
    ? Math.max(IDLE_RING_WIDTH, activeRingStrokeWidth)
    : IDLE_RING_WIDTH;
  const innerStrokeWidth = hasNote
    ? Math.max(IDLE_INNER_WIDTH, ACTIVE_INNER_BASE + frac * innerGrowth)
    : IDLE_INNER_WIDTH;

  // compute ring radius: base (inner + BASE_GAP) plus extra proportional to excess
  // Use a non-linear mapping so small frac values (tiny errors) produce much less movement.
  const RADIUS_SENSITIVITY_EXP = 3.0; // larger exponent compresses tiny errors further
  const ringR =
    INNER_R +
    BASE_GAP +
    Math.pow(frac, RADIUS_SENSITIVITY_EXP) * MAX_ADDITIONAL_GAP;

  // Ensure ringR stays within reasonable SVG bounds (clamped to 46 units max for padding)
  const R = Math.max(10, Math.min(ringR, 46)); // Use 46 instead of 48
  const arcRadius = Math.max(6, R);

  // Idle (no-note) ring radius — smallest visible ring when not tuning
  const idleRadius = Math.max(6, Math.min(INNER_R + BASE_GAP, 46));

  // default: ring invisible (transparent) when there's no detected note or when in-tune
  let topColor: string = "transparent";
  let bottomColor: string = "transparent";

  if (hasNote) {
    if (Math.abs(cents) <= threshold) {
      // In-tune: show a subtle green ring at the default radius
      topColor = bottomColor = softGreen;
    } else if (cents > 0) {
      topColor = softPurple;
      bottomColor = "transparent";
    } else {
      bottomColor = softOrange;
      topColor = "transparent";
    }
  } else if (hasNote) {
    topColor = bottomColor = subtleOutline;
  }

  // Determine fill color for the inner circle (solid colors only)
  let circleFill = "transparent";
  if (hasNote) {
    if (Math.abs(cents) <= threshold) {
      // in tune: solid green
      circleFill = softGreen;
    } else if (cents > 0) {
      // sharp: purple
      circleFill = softPurple;
    } else {
      // flat: orange
      circleFill = softOrange;
    }
  } else if (hasNote) {
    // have a note but no cents yet: neutral fill
    circleFill = neutralGray;
  }

  let labelColor = idleLabelGray;
  if (hasNote) {
    if (Math.abs(cents) <= threshold) {
      labelColor = softGreen; // in-tune
    } else if (cents > 0) {
      labelColor = softPurple; // sharp
    } else {
      labelColor = softOrange; // flat
    }
  } else if (hasNote) {
    labelColor = idleLabelGray;
  }

  // SVG arc start/end coordinates based on computed radius R
  const leftX = Math.max(4, 50 - arcRadius);
  const rightX = Math.min(96, 50 + arcRadius);

  return (
    <div className="flex h-full items-center justify-center overflow-visible w-full">
      <div className="text-center w-full h-full flex flex-col items-center justify-center">
        {/* Ring + circle Container */}
        <div
          className="relative mx-auto mb-6 w-4/5 max-w-sm aspect-square"
          style={{ minHeight: 0 }}
        >
          {/* SVG: The visual element that scales */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full"
            role="img"
            aria-label="Tuning ring"
          >
            {/* Idle ring outline when there's no detected note */}
            {!hasNote && (
              <circle
                cx="50"
                cy="50"
                r={idleRadius}
                fill="none"
                stroke={subtleOutline}
                strokeWidth={ringStrokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Inner circle: fill when we have a note; otherwise show a very thin subtle outline */}
            {hasNote ? (
              <circle
                cx="50"
                cy="50"
                r={INNER_R}
                fill={circleFill}
                stroke="rgba(0,0,0,0.06)"
                strokeWidth={innerStrokeWidth}
                style={{ filter: "drop-shadow(0px 0px 5px rgba(0,0,0,0.5))" }}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <circle
                cx="50"
                cy="50"
                r={INNER_R}
                fill="transparent"
                stroke={subtleOutline}
                strokeWidth={innerStrokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Top semicircle (left -> right across top) - radius is dynamic (arcRadius) */}
            <path
              d={`M ${leftX} 50 A ${arcRadius} ${arcRadius} 0 0 1 ${rightX} 50`}
              fill="none"
              stroke={topColor}
              strokeWidth={ringStrokeWidth}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Bottom semicircle (right -> left across bottom) - radius is dynamic (arcRadius) */}
            <path
              d={`M ${rightX} 50 A ${arcRadius} ${arcRadius} 0 0 1 ${leftX} 50`}
              fill="none"
              stroke={bottomColor}
              strokeWidth={ringStrokeWidth}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Three-column summary: Note (+sharp sign top-right, octave bottom-right), Cents deviation, Frequency */}
        <div className="w-full max-w-lg mx-auto mb-2 flex gap-16 items-center justify-center">
          {/* Column 1: Note with sharp/natural sign (top-right) and octave (bottom-right) */}
          <div className="text-left">
            <div
              className="text-7xl font-bold relative inline-block" // Added 'relative inline-block'
              style={{ color: labelColor }}
            >
              {textNote ? textNote.note[0] : "--"}

              {/* sharp/natural sign at top-right of the note letter */}
              <div
                className="absolute top-0 right-0 text-2xl translate-x-5"
                style={{ color: labelColor }}
              >
                {textNote
                  ? textNote.note.includes("#")
                    ? "♯"
                    : textNote.note.toLowerCase().includes("b")
                      ? "♭"
                      : "♮"
                  : null}
              </div>

              {/* octave at bottom-right of the note letter */}
              <div
                className="absolute bottom-0 right-0 text-2xl translate-x-5"
                style={{ color: labelColor }}
              >
                {textNote ? textNote.octave : "--"}
              </div>
            </div>
          </div>

          {/* Column 2: Cents deviation */}
          <div className="text-right" style={{ width: "12ch" }}>
            <div className="text-4xl font-light" style={{ color: labelColor }}>
              {`${cents >= 0 ? "+" : ""}${cents.toFixed(1)}`}
            </div>
          </div>

          {/* Column 3: Frequency */}
          <div className="text-right" style={{ width: "12ch" }}>
            <div className="text-xl font-thin text-gray-200">
              {displayFreqForText
                ? displayFreqForText.toFixed(2) + " Hz"
                : "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
