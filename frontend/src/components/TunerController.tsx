import { useTuner } from "../hooks/useTuner.ts";
import { useState, useEffect, useRef } from "react";
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
  const [activePanel, setActivePanel] = useState(1); // 0=Session, 1=Tuner, 2=Dashboard
  const containerRef = useRef<HTMLDivElement>(null);

  // Track current instrument id selected in the left panel
  const [instrumentId, setInstrumentId] = useState<number>(() => {
    const storedInstrumentId = localStorage.getItem("currentInstrumentId");
    return storedInstrumentId ? parseInt(storedInstrumentId, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem("currentInstrumentId", instrumentId.toString());
  }, [instrumentId]);

  // derive instrument name from localStorage (keep it reactive by reading on each render)
  const getInstrumentName = (id: number) => {
    try {
      const raw = localStorage.getItem("pta_instruments_v1");
      if (!raw) return `Instrument ${id}`;
      const parsed = JSON.parse(raw);
      const found = Array.isArray(parsed)
        ? parsed.find((p: any) => p.id === id)
        : null;
      return found ? found.name : `Instrument ${id}`;
    } catch {
      return `Instrument ${id}`;
    }
  };
  const instrumentName = getInstrumentName(instrumentId);

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
      instrument: `Instrument ${instrumentId}`,
      instrumentId,
      noteStrings: finalAggregates,
    };

    setDataExportedCount((prevCount) => prevCount + 1);

    console.log("Attempting to export data:", sessionPayload);
    await exportSessionData(sessionPayload);
  };

  // Mobile navigation function
  const navigateToPanel = (panelIndex: number) => {
    setActivePanel(panelIndex);
    if (containerRef.current) {
      const panelWidth = containerRef.current.offsetWidth;
      containerRef.current.scrollTo({
        left: panelIndex * panelWidth,
        behavior: "smooth",
      });
    }
  };

  // Handle scroll events to update active panel on mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const panelWidth = container.offsetWidth;
      const currentPanel = Math.round(scrollLeft / panelWidth);
      setActivePanel(currentPanel);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute aggregates and sample count for display (we no longer show mean deviation)
  const aggregates = calculateFinalAggregates();
  const sampleCount = aggregates.reduce((s, a) => s + (a.count ?? 0), 0);

  return (
    <>
      {/* Desktop Layout - Keep original layout */}
      <div className="hidden md:flex gap-6 w-full px-[6%] h-screen items-stretch">
        {/* Left: Practice controls and session summary */}
        <aside className="w-96 space-y-4 h-full overflow-auto flex flex-col justify-center">
          <PracticeSession
            isActive={isSessionActive}
            onStart={handleStartSession}
            onStop={handleStopSession}
            instrumentId={instrumentId}
            onInstrumentChange={setInstrumentId}
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
            {/* constrain visual size of the tuner so side panels occupy more space */}
            <div className="w-full max-w-md">
              <Tuner
                displayFrequency={frequency}
                displayNote={note}
                lastNote={lastNote}
                lastFrequency={lastFrequency}
              />
            </div>
          </div>
        </div>

        {/* Right panel: dashboard only */}
        <aside className="w-96 space-y-4 h-full overflow-auto flex flex-col justify-center">
          <TendencyDashboard
            instrumentId={instrumentId}
            refreshTrigger={dataExportedCount}
            instrumentName={instrumentName}
          />
        </aside>
      </div>

      {/* Mobile Layout with swipeable panels and bottom navigation */}
      <div className="md:hidden flex flex-col h-screen">
        <div ref={containerRef} className="mobile-container">
          {/* Panel 0: Practice Session */}
          <div className="mobile-panel p-4 flex items-center justify-center">
            <div className="space-y-4 max-w-md mx-auto w-full">
              <PracticeSession
                isActive={isSessionActive}
                onStart={handleStartSession}
                onStop={handleStopSession}
                instrumentId={instrumentId}
                onInstrumentChange={setInstrumentId}
              />

              <div className="rounded-lg p-4 bg-white/5">
                <h3 className="text-lg font-semibold mb-2">Session Summary</h3>
                <p className="mb-1">
                  Status: {isSessionActive ? "Recording..." : "Ready"}
                </p>
                <p className="text-sm text-gray-400">Samples: {sampleCount}</p>
              </div>
            </div>
          </div>

          {/* Panel 1: Tuner */}
          <div className="mobile-panel flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
              <Tuner
                displayFrequency={frequency}
                displayNote={note}
                lastNote={lastNote}
                lastFrequency={lastFrequency}
              />
            </div>
          </div>

          {/* Panel 2: Dashboard */}
          <div className="mobile-panel p-4 flex items-center justify-center">
            <div className="max-w-md mx-auto w-full">
              <TendencyDashboard
                instrumentId={instrumentId}
                refreshTrigger={dataExportedCount}
                instrumentName={instrumentName}
              />
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-nav">
          <button
            className={activePanel === 0 ? "active" : ""}
            onClick={() => navigateToPanel(0)}
          >
            Session
          </button>
          <button
            className={activePanel === 1 ? "active" : ""}
            onClick={() => navigateToPanel(1)}
          >
            Tuner
          </button>
          <button
            className={activePanel === 2 ? "active" : ""}
            onClick={() => navigateToPanel(2)}
          >
            Dashboard
          </button>
        </nav>
      </div>
    </>
  );
}
