import { useTuner } from "../hooks/useTuner.ts";
import { useState } from "react";
import { Tuner } from "./Tuner.tsx";
import { PracticeSession } from "./PracticeSession.tsx";
import { TendencyDashboard } from "./TendencyDashboard.tsx";
import { exportSessionData } from "../services/dataService.ts";
import type { SessionData } from "../types/api.ts";

export function TunerController() {
  const { frequency, note, calculateFinalAggregates, resetAggregates } =
    useTuner();
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

  return (
    <div>
      <h1>Pitch Tendency Analyzer</h1>
      <Tuner displayFrequency={frequency} displayNote={note} />
      <PracticeSession
        isActive={isSessionActive}
        onStart={handleStartSession}
        onStop={handleStopSession}
      />
      <p>Status: {isSessionActive ? "Recording..." : "Ready"}</p>
      <TendencyDashboard
        instrumentId={1} // TODO: Make instrument ID dynamic
        refreshTrigger={dataExportedCount}
      />
    </div>
  );
}
