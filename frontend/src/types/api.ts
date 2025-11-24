/**
 * Interface representing aggregated analysis of a musical note, including the note string,
 * mean cents deviation, and count of occurrences.
 */
export interface NoteAnalysis {
    noteString: string;
    meanCents: number;
    count: number;
}

/**
 * Interface representing session data, including session ID, instrument details, and analyzed note strings.
 */
export interface SessionData {
    sessionId: number;
    instrument: string;
    instrumentId: number;
    noteStrings: NoteAnalysis[];
}

/**
 * Interface representing running analysis data, including the sum of cents deviations and count of occurrences.
 */
export interface RunningAnalysis {
    sumCents: number
    count: number
}

/**
 * Interface representing aggregate data mapping note strings to their running analysis.
 */
export interface AggregateData {
    [noteString: string]: RunningAnalysis;
}