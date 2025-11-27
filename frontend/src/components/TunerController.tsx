import { useTuner } from "../hooks/useTuner.ts";
import { useState } from "react";
import { Tuner } from "./Tuner.tsx";
import { PracticeSession } from "./PracticeSession.tsx";
import { TendencyDashboard } from "./TendencyDashboard.tsx";
import { exportSessionData } from "../services/dataService.ts";
import type { SessionData } from "../types/api.ts";

export function TunerController() {
  const {
    frequency,
    note,
    lastNote,
    lastFrequency,
    calculateFinalAggregates,
    resetAggregates,
  } = useTuner();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [dataExportedCount, setDataExportedCount] = useState(0);

  const handleStartSession = () => {
    resetAggregates();
    setIsSessionActive(true);
  };

  const handleStopSession = async () => {
    setIsSessionActive(false);
    const finalAggregates = calculateFinalAggregates();

    // Send data to backend
    if (finalAggregates.length === 0) {
      console.log("Session ended with no data to send.");
      setIsSessionActive(false);
      return;
    }

    const sessionPayload: SessionData = {
      sessionId: Date.now(),
      instrument: "Clarinet",
      instrumentId: 1,
      noteStrings: finalAggregates,
    };

    setDataExportedCount((prevCount) => prevCount + 1);

    console.log("Attempting to export data:", sessionPayload);
    await exportSessionData(sessionPayload);
  };

  // Compute aggregates and sample count for display (we no longer show mean deviation)
  const aggregates = calculateFinalAggregates();
  const sampleCount = aggregates.reduce((s, a) => s + (a.count ?? 0), 0);

  return (
    // Ensure controller fills the viewport height and children stretch equally
    <div className="flex gap-6 w-full px-6 h-screen items-stretch">
      {/* Left: Practice controls and session summary */}
      <aside className="w-80 space-y-4 h-full overflow-auto flex flex-col justify-center">
        <PracticeSession
          isActive={isSessionActive}
          onStart={handleStartSession}
          onStop={handleStopSession}
        />

        <div className="rounded-lg p-4 bg-white/5">
          <h3 className="text-lg font-semibold mb-2">Session Summary</h3>
          <p className="mb-1">
            Status: {isSessionActive ? "Recording..." : "Ready"}
          </p>
          <p className="text-sm text-gray-400">Samples: {sampleCount}</p>
        </div>
      </aside>

      {/* Center: make tuner expansive and allow it to take most of the width */}
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-full h-full flex items-center justify-center">
          <Tuner
            displayFrequency={frequency}
            displayNote={note}
            lastNote={lastNote}
            lastFrequency={lastFrequency}
          />
        </div>
      </div>

      {/* Right panel: dashboard only */}
      <aside className="w-80 space-y-4 h-full overflow-auto flex flex-col justify-center">
        <TendencyDashboard
          instrumentId={1}
          refreshTrigger={dataExportedCount}
        />
      </aside>
    </div>
  );
}
