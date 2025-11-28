import { useEffect, useState, useRef, useCallback } from "react";
import type { AggregateData, NoteAnalysis } from "../types/api.ts";
import type { NoteInfo } from "../types/local";
import { STABILITY_THRESHOLD, MIN_SAMPLES_FOR_EXPORT } from "../constants";

export function useTuner() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<NoteInfo | null>(null);
  // Keep a full NoteInfo for the last seen note so the UI can display the
  // last pitch details even when nothing is currently sounding.
  const [lastNote, setLastNote] = useState<NoteInfo | null>(null);
  // Keep the most recent detected frequency so components can display it
  // without recomputing from NoteInfo.
  const [lastFrequency, setLastFrequency] = useState<number | null>(null);
  const [runningAggregateData, setRunningAggregateData] =
    useState<AggregateData>({});
  const [stabilityCounter, setStabilityCounter] = useState<number>(0);

  // Refs to hold the latest values for real-time loop
  const stabilityCounterRef = useRef<number>(stabilityCounter);
  const runningAggregateDataRef = useRef<AggregateData>(runningAggregateData);
  const lastNoteRef = useRef<NoteInfo | null>(null);

  useEffect(() => {
    stabilityCounterRef.current = stabilityCounter;
  }, [stabilityCounter]);
  useEffect(() => {
    runningAggregateDataRef.current = runningAggregateData;
  }, [runningAggregateData]);

  const resetAggregates = useCallback(() => {
    setFrequency(null);
    setNote(null);
    setLastNote(null);
    setLastFrequency(null);
    setRunningAggregateData({});
    setStabilityCounter(0);
    // clear the ref too so subsequent detections start fresh
    lastNoteRef.current = null;
  }, []);

  const calculateFinalAggregates = (): NoteAnalysis[] => {
    return Object.keys(runningAggregateDataRef.current)
      .map((noteString) => {
        const { sumCents, count } = runningAggregateDataRef.current[noteString];
        const meanCents = count > 0 ? sumCents / count : 0;
        return {
          noteString,
          meanCents,
          count,
        };
      })
      .filter((entry) => entry.count >= MIN_SAMPLES_FOR_EXPORT);
  };

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let rafId: number;

    function frequencyToNote(frequency: number): NoteInfo {
      /* same as before */
      const notes = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      const A4 = 440;
      const C0 = A4 * Math.pow(2, -4.75);

      const exactSemitone = 12 * Math.log2(frequency / C0);
      const rounded = Math.round(exactSemitone);
      const octave = Math.floor(rounded / 12);
      const noteIndex = ((rounded % 12) + 12) % 12;
      // produce cents with one decimal of precision (e.g. 12.3)
      // Use numeric rounding to avoid any string parsing issues and ensure
      // consistent numeric results across runtimes.
      const rawCents = (exactSemitone - rounded) * 100; // e.g. 12.345
      // Add a tiny epsilon to avoid floating-point edge cases where a value
      // like 12.299999999 becomes 12.2 or where 12.3000000001 becomes 12.3
      const EPS = 1e-6;
      const cents = Math.round((rawCents + EPS) * 10) / 10; // one decimal, e.g. 12.3

      return {
        note: notes[noteIndex],
        octave,
        noteString: `${notes[noteIndex]}${octave}`,
        cents,
      };
    }

    /**
     * Auto-correlation algorithm to estimate pitch from audio buffer.
     * The buffer is a "snapshot" of the audio. The goal is to find a frequency for a note,
     * which is how many times the wave repeats each second, so since the buffer is so small,
     * you find the length of one single repetition of the wave.
     * Autocorrelation does this by comparing the buffer to a shifted version of itself,
     * and finding the shift that produces the highest correlation. In this implementation,
     * we found the best offset after getting to the bottom of the first "valley" after the
     * offset = 0 peak. Parabolic interpolation is also used to refine the estimate of the peak position.
     *
     * @param {Float32Array} buffer - The audio buffer containing time-domain data.
     * @param {number} sampleRate - The sample rate of the audio context.
     * @returns {number | null} Estimated frequency in Hz or null if no pitch is detected.
     */
    function autoCorrelate(
      buffer: Float32Array,
      sampleRate: number,
    ): number | null {
      const SIZE = buffer.length;
      const maxShift = Math.floor(SIZE / 2);
      let rms = 0;

      for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.03) return null;

      const correlations = new Float32Array(maxShift).fill(0);
      for (let offset = 0; offset < maxShift; offset++) {
        for (let i = 0; i < SIZE - offset; i++) {
          correlations[offset] += buffer[i] * buffer[i + offset];
        }
      }

      // Find the first peak after the initial drop
      let dipIndex = 1;
      while (
        correlations[dipIndex] > correlations[dipIndex + 1] &&
        dipIndex < maxShift - 1
      ) {
        dipIndex++;
      }

      // Then find the first peak (local maximum) after that dip.
      let peakIndex = dipIndex;
      while (
        correlations[peakIndex] < correlations[peakIndex + 1] &&
        peakIndex < maxShift - 1
      ) {
        peakIndex++;
      }

      if (
        peakIndex === maxShift - 1 ||
        correlations[peakIndex] < correlations[0] * 0.4
      ) {
        // Reject a weak peak
        return null;
      }

      let bestOffset = peakIndex;

      // Parabolic interpolation
      if (bestOffset > 0 && bestOffset < maxShift - 1) {
        const p1 = correlations[bestOffset - 1];
        const p2 = correlations[bestOffset];
        const p3 = correlations[bestOffset + 1];

        // Finds "vertex" of the parabola defined by the three points
        const peakAdjustment = (p3 - p1) / (2 * (2 * p2 - p3 - p1));
        if (!isNaN(peakAdjustment)) {
          bestOffset += peakAdjustment;
        }
      }

      return bestOffset > 0 ? sampleRate / bestOffset : null;
    }

    /**
     * Initialize audio context and start pitch detection.
     * @returns {Promise<void>}
     */
    async function start(): Promise<void> {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 400; // center frequency
      filter.Q.value = 0.7; // width

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      filter.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);

      const update = () => {
        if (!analyser) return;
        analyser.getFloatTimeDomainData(buffer);
        const freq = autoCorrelate(buffer, audioCtx!.sampleRate);
        if (freq) {
          const noteInfo = frequencyToNote(freq);
          setFrequency(freq);
          setNote(noteInfo);
          setLastFrequency(freq);
          setLastNote(noteInfo);

          if (noteInfo.noteString === lastNoteRef.current?.noteString) {
            const newCount = stabilityCounterRef.current + 1;
            setStabilityCounter(newCount);
            stabilityCounterRef.current = newCount;
          } else {
            // update the ref immediately so subsequent frames see the new baseline
            lastNoteRef.current = noteInfo;
            setStabilityCounter(1);
            stabilityCounterRef.current = 1;
          }

          // Read from ref for decision
          if (stabilityCounterRef.current >= STABILITY_THRESHOLD) {
            const key = noteInfo.noteString;
            setRunningAggregateData((prevData) => {
              const existing = prevData[key] || { sumCents: 0, count: 0 };
              const next = {
                ...prevData,
                [key]: {
                  sumCents: existing.sumCents + noteInfo.cents,
                  count: existing.count + 1,
                },
              };
              // keep ref in sync
              runningAggregateDataRef.current = next;
              return next;
            });
            // console.log("Aggregated:", noteInfo.noteString, noteInfo.cents);
          }
        } else {
          setFrequency(null);
          setNote(null);
          // don't clear `lastNote` here; we want the UI to be able to show the most
          // recently seen note even while silence is present. Stability counter does reset.
          setStabilityCounter(0);
          stabilityCounterRef.current = 0;
        }
        rafId = requestAnimationFrame(update);
      };

      update();
    }

    start().catch(console.error);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (audioCtx) audioCtx.close();
    };
  }, []);

  return {
    frequency,
    note,
    lastNote,
    lastFrequency,
    calculateFinalAggregates,
    resetAggregates,
  };
}
