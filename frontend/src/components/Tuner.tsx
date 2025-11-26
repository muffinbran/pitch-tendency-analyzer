import type { TunerProps } from "../types/local";

export function Tuner({ displayFrequency, displayNote }: TunerProps) {
  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <h1>Tuner</h1>
        <p>
          Frequency: {displayFrequency ? displayFrequency.toFixed(2) : "--"} Hz
        </p>
        <p>Note: {displayNote?.noteString ?? "--"}</p>
        <p>{displayNote?.cents ?? "--"}</p>
      </div>
    </div>
  );
}
