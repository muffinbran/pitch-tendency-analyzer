/**
 * Interface representing note information, including note name, octave, full note string, and cents deviation.
 */
export interface NoteInfo {
  note: string;
  octave: number;
  noteString: string;
  cents: number;
}

/**
 * Props for the Tuner component, including the displayed frequency and note information.
 */
export interface TunerProps {
  displayFrequency: number | null;
  displayNote: NoteInfo | null;
  lastNote?: NoteInfo | null; // C0 by default
  lastFrequency?: number | null; // last detected frequency (Hz) for textual fallback
}

/**
 * Props for the PracticeSession component, including session active state and start/stop handlers.
 */
export interface PracticeSessionProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

/**
 * Props for the TendencyDashboard component, including instrument ID and refresh trigger.
 */
export interface TendencyDashboardProps {
  instrumentId: number;
  refreshTrigger: number;
}
