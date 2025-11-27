import type { PracticeSessionProps } from "../types/local.ts";

export function PracticeSession({
  isActive,
  onStart,
  onStop,
}: PracticeSessionProps) {
  return (
    <div>
      {isActive ? (
        <button onClick={onStop}>Stop Practice Session</button>
      ) : (
        <button onClick={onStart}>Start New Session</button>
      )}
    </div>
  );
}
