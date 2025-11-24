import type {PracticeSessionProps} from "../types/local.ts";

export function PracticeSession({isActive, onStart, onStop}: PracticeSessionProps) {
    return (
        <div>
            <h3>Session Controls</h3>
            {isActive ? (
                <button
                    onClick={onStop}
                >
                    Stop Practice Session
                </button>
            ) : (
                <button
                    onClick={onStart}
                >
                    Start New Session
                </button>
            )}
        </div>
    );
}