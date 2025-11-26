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
}

/**
 * Props for the PracticeSession component, including session active state and start/stop handlers.
 */
export interface PracticeSessionProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
}
