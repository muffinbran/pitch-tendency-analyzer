import type { TunerProps } from "../types/local";
import { IN_TUNE_THRESHOLD } from "../constants.ts";

export function Tuner({ displayFrequency, displayNote }: TunerProps) {
  const cents = displayNote?.cents;
  const threshold = IN_TUNE_THRESHOLD; // cents threshold for "in tune"

  // softer, less piercing colors (base hex colors)
  const softGreen = "#34d399"; // green-400
  const softPurple = "#a78bfa"; // purple-300
  const softOrange = "#fb923c"; // orange-400
  const neutralGray = "#f3f4f6"; // gray-100
  const subtleOutline = "#e5e7eb"; // gray-200-ish for outline when idle
  const idleLabelGray = "#9ca3af"; // gray-400 for text when idle

  const hasNote = !!displayNote;

  // Visual geometry (units are SVG viewBox units: 0..100)
  // Scaled up for larger visual tuner
  // Make the visual inner circle smaller so the ring starts further outside it
  // Reduce the inner circle slightly and increase the gaps so the ring visibly sits further away
  const INNER_R = 12; // slightly smaller inner circle radius
  const BASE_GAP = 14; // larger baseline gap so the ring starts noticeably outside the circle
  const MAX_ADDITIONAL_GAP = 18; // more room for the ring to expand outward when off-tune
  const MAX_VISIBLE_CENTS = 50; // cents mapped to the full additional gap
  const STROKE_WIDTH = 4; // thinner ring stroke for a more delicate appearance

  // compute excess beyond the in-tune threshold
  const excess =
    typeof cents === "number" ? Math.max(0, Math.abs(cents) - threshold) : 0;
  const frac = Math.min(excess / MAX_VISIBLE_CENTS, 1);

  // compute ring radius: base (inner + BASE_GAP) plus extra proportional to excess
  const ringR = INNER_R + BASE_GAP + frac * MAX_ADDITIONAL_GAP;

  // Ensure ringR stays within reasonable SVG bounds
  const R = Math.max(10, Math.min(ringR, 48));

  // default: ring invisible (transparent) when there's no detected note or when in-tune
  let topColor: string = "transparent";
  let bottomColor: string = "transparent";

  if (hasNote && typeof cents === "number") {
    if (Math.abs(cents) <= threshold) {
      // In tune -> hide the ring entirely (no visible halves)
      topColor = bottomColor = "transparent";
    } else if (cents > 0) {
      // Sharp -> only top half visible (soft purple)
      topColor = softPurple;
      bottomColor = "transparent";
    } else {
      // Flat -> only bottom half visible (soft orange)
      bottomColor = softOrange;
      topColor = "transparent";
    }
  } else if (hasNote) {
    // We have a note object but no numeric cents yet; show a subtle ring at baseline radius
    topColor = bottomColor = subtleOutline;
  }

  // intensity mapping for color saturation/opacity (0..1)
  // minOpacity: faint when barely out; maxOpacity: full when strongly out
  const MIN_OPACITY = 0.28;
  const MAX_OPACITY = 1;
  const intensity = frac; // 0..1 based on excess

  // helper to convert 6-digit or 3-digit hex to rgba string
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || hex === "transparent") return "transparent";
    let h = hex.replace("#", "");
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Determine opacities for top/bottom ring halves
  let topOpacity = 0;
  let bottomOpacity = 0;
  if (!hasNote) {
    topOpacity = bottomOpacity = 0;
  } else if (hasNote && typeof cents !== "number") {
    // subtle hint opacity when note exists but cents unknown
    topOpacity = bottomOpacity = 0.32;
  } else if (hasNote && typeof cents === "number") {
    if (Math.abs(cents) <= threshold) {
      topOpacity = bottomOpacity = 0; // ring hidden in-tune
    } else {
      const mapped = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * intensity;
      if (cents > 0) {
        topOpacity = mapped;
        bottomOpacity = 0;
      } else {
        bottomOpacity = mapped;
        topOpacity = 0;
      }
    }
  }

  // Choose a single color for the inner circle; we'll set its rgba fill with variable opacity when off
  let circleFill = "transparent";
  if (hasNote && typeof cents === "number") {
    if (Math.abs(cents) <= threshold) {
      // in tune: solid green (clear feedback)
      circleFill = hexToRgba(softGreen, 0.95);
    } else if (cents > 0) {
      // sharp: purple, intensity-based opacity
      const a = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * intensity;
      circleFill = hexToRgba(softPurple, a);
    } else {
      // flat: orange, intensity-based opacity
      const a = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * intensity;
      circleFill = hexToRgba(softOrange, a);
    }
  } else if (hasNote) {
    // have a note but no cents yet: neutral subtle fill
    circleFill = hexToRgba(neutralGray, 0.55);
  }

  // Note label shows note + octave when available (e.g., A#4)
  const noteLabel = displayNote
    ? `${displayNote.note}${displayNote.octave}`
    : "--";
  const centsLabel =
    typeof cents === "number"
      ? `${cents >= 0 ? "+" : ""}${cents.toFixed(2)} cents`
      : "--";

  // Use fixed base colors for the pitch label (no intensity/opacity modulation)
  let labelColor = idleLabelGray;
  if (hasNote && typeof cents === "number") {
    if (Math.abs(cents) <= threshold) {
      labelColor = softGreen; // in-tune
    } else if (cents > 0) {
      labelColor = softPurple; // sharp
    } else {
      labelColor = softOrange; // flat
    }
  } else if (hasNote) {
    // Note detected but cents not available yet -> keep muted label
    labelColor = idleLabelGray;
  }

  // SVG arc start/end coordinates based on computed radius R
  const leftX = Math.max(2, 50 - R);
  const rightX = Math.min(98, 50 + R);
  const arcRadius = Math.max(6, R);

  return (
    // Fill the available vertical space and center content vertically/horizontally
    <div className="flex h-full items-center justify-center overflow-visible">
      <div className="text-center w-full h-full flex flex-col items-center justify-center">
        <h1 className="text-3xl font-semibold mb-6">Tuner</h1>

        {/* Ring + circle: SVG provides two semicircles for coloring halves; ring radius varies with cents */}
        <div
          className="w-full max-h-full mx-auto relative flex items-center justify-center mb-3"
          style={{ minHeight: 0 }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-auto h-full max-h-[76vh]"
            role="img"
            aria-label="Tuning ring"
          >
            {/* Top semicircle (left -> right across top) - radius is dynamic */}
            <path
              d={`M ${leftX} 50 A ${arcRadius} ${arcRadius} 0 0 1 ${rightX} 50`}
              fill="none"
              stroke={topColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeOpacity={topOpacity}
            />

            {/* Bottom semicircle (right -> left across bottom) - radius is dynamic */}
            <path
              d={`M ${rightX} 50 A ${arcRadius} ${arcRadius} 0 0 1 ${leftX} 50`}
              fill="none"
              stroke={bottomColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeOpacity={bottomOpacity}
            />

            <circle
              cx="50"
              cy="50"
              r={arcRadius}
              fill="none"
              stroke="rgba(0,0,0,0)"
            />
          </svg>

          {/* Inner circle: filled with state color when we have a note; otherwise a subtle outline */}
          {hasNote ? (
            <div
              className="absolute z-10 flex items-center justify-center"
              role="img"
              aria-label="Tuning circle"
              style={{
                width: "40%",
                height: "40%",
                borderRadius: "9999px",
                backgroundColor: circleFill,
              }}
            >
              {/* Show sharp/flat symbol when we have numeric cents and are outside the in-tune threshold */}
              {typeof cents === "number" && Math.abs(cents) > threshold ? (
                <span
                  className="text-7xl font-extrabold leading-none"
                  style={{ color: labelColor }}
                >
                  {cents > 0 ? "♯" : "♭"}
                </span>
              ) : null}
            </div>
          ) : (
            <div
              className="absolute z-10 flex items-center justify-center"
              role="img"
              aria-label="Tuning circle idle"
              style={{
                width: "40%",
                height: "40%",
                borderRadius: "9999px",
                backgroundColor: "transparent",
                border: `2px solid ${subtleOutline}`,
              }}
            />
          )}
        </div>

        {/* Note and cents displayed outside the ring; note colored to match the circle for clarity */}
        <div className="mb-1">
          <div className="text-3xl font-semibold" style={{ color: labelColor }}>
            {noteLabel}
          </div>
          <div className="text-lg text-gray-600">{centsLabel}</div>
        </div>

        {/* Frequency remains outside */}
        <p className="text-base text-gray-700">
          Frequency: {displayFrequency ? displayFrequency.toFixed(2) : "--"} Hz
        </p>
      </div>
    </div>
  );
}
