import {useTuner} from "../hooks/useTuner.ts";
import {useState} from "react";
import {Tuner} from "./Tuner.tsx";
import {PracticeSession} from "./PracticeSession.tsx";

export function TunerController() {
    const {frequency, note, calculateFinalAggregates} = useTuner();
    const [isSessionActive, setIsSessionActive] = useState(false);

    const handleStartSession = () => {
        setIsSessionActive(true);
    };

    const handleStopSession = () => {
        setIsSessionActive(false);
        const finalAggregates = calculateFinalAggregates();

        // Send data to backend
        if (finalAggregates.length === 0) {
            console.log("Session ended with no data to send.");
            setIsSessionActive(false);
            return;
        }

        const sessionPayload = {
            sessionId: new Date().toISOString(),
            instrument: "Clarinet",
            instrumentId: 1,
            noteStrings: finalAggregates
        };

        console.log("Attempting to export data:", sessionPayload);
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
            <p>Status: {isSessionActive ? 'Recording...' : 'Ready'}</p>
        </div>
    )
}