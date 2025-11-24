import React from "react";
import { useTuner } from "../hooks/usePitch";

export const Tuner: React.FC = () => {
    const {frequency, note} = useTuner();

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Tuner</h1>
            <p>Frequency: {frequency ? frequency.toFixed(2) : "--"} Hz</p>
            <p>Note: {note?.noteString ?? "--"}</p>
            <p>{note?.cents ?? "--"}</p>
        </div>
    );
};
