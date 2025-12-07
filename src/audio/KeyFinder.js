import { NOTE_STRINGS } from "./utils";

// Major key profile (Krumhansl-Kessler)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
// Minor key profile
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

/**
 * KeyFinder class that accumulates chroma data over time to estimate key.
 */
export class KeyFinder {
    constructor() {
        this.chroma = new Array(12).fill(0);
        this.totalSamples = 0;

        // Stabilization for Live Mode
        this.lastKeyCandidate = "";
        this.stableKey = "Detecting...";
        this.consistencyCount = 0;
    }

    // Add a detected note to the accumulator
    processNote(noteIndex) { // 0=C, 1=C#, etc.
        if (noteIndex == null || noteIndex < 0 || noteIndex > 11) return;

        // DECAY for live mode: Smoothly forget old notes
        // Multiply existing chroma by 0.995 (decays old history over ~200 frames or ~3-4s)
        for (let i = 0; i < 12; i++) {
            this.chroma[i] *= 0.995;
        }

        this.chroma[noteIndex] += 1.0;
        this.totalSamples++;
    }

    reset() {
        this.chroma = new Array(12).fill(0);
        this.totalSamples = 0;
        this.lastKeyCandidate = "";
        this.stableKey = "Detecting...";
        this.consistencyCount = 0;
    }

    // Call this periodically to get the estimated key
    // useStability: set to true for real-time mic to prevent flickering
    estimateKey(useStability = false) {
        if (this.totalSamples < 10) return "Detecting..."; // Needs more data

        // Normalize chroma
        const normalizedChroma = this.chroma.map(val => val / this.totalSamples);

        let bestKey = "";
        let maxCorrelation = -Infinity;

        // Correlation for Major keys
        for (let i = 0; i < 12; i++) {
            let corr = 0;
            for (let j = 0; j < 12; j++) {
                corr += normalizedChroma[(i + j) % 12] * MAJOR_PROFILE[j];
            }
            if (corr > maxCorrelation) {
                maxCorrelation = corr;
                bestKey = `${NOTE_STRINGS[i]} Major`;
            }
        }

        // Correlation for Minor keys
        for (let i = 0; i < 12; i++) {
            let corr = 0;
            for (let j = 0; j < 12; j++) {
                corr += normalizedChroma[(i + j) % 12] * MINOR_PROFILE[j];
            }
            if (corr > maxCorrelation) {
                maxCorrelation = corr;
                bestKey = `${NOTE_STRINGS[i]} Minor`;
            }
        }

        if (!useStability) return bestKey;

        // Stability Logic
        if (bestKey === this.lastKeyCandidate) {
            this.consistencyCount++;
        } else {
            this.lastKeyCandidate = bestKey;
            this.consistencyCount = 0;
        }

        // Require 15 consecutive frames of consistency (approx 0.25s)
        if (this.consistencyCount > 15) {
            this.stableKey = bestKey;
        }

        return this.stableKey;
    }
}

/**
 * Static analysis of the entire buffer to find the definitive key.
 */
import { autoCorrelate, getNoteFromFrequency } from "./utils";

export async function detectKeyFromBuffer(audioBuffer) {
    try {
        const kf = new KeyFinder();
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;

        // Process in chunks (skip some for speed, but ensure coverage)
        const windowSize = 4096;
        const hopSize = 8192; // ~0.18s

        let lastYield = Date.now();
        const startTime = Date.now();
        const MAX_DURATION = 30000; // 30s timeout (User requested thorough analysis)
        let loopCounter = 0;

        for (let i = 0; i < channelData.length; i += hopSize) {
            loopCounter++;

            // Safety Timeout
            if (Date.now() - startTime > MAX_DURATION) {
                console.warn("Key detection timed out!");
                return "Unknown";
            }

            // Yield to main thread every 50 chunks (approx 125ms of audio processed)
            if (loopCounter % 50 === 0) {
                if (Date.now() - lastYield > 30) {
                    await new Promise(r => setTimeout(r, 0));
                    lastYield = Date.now();
                }
            }

            const chunk = channelData.slice(i, i + windowSize);
            if (chunk.length < windowSize) break;

            // RMS check (skip silence)
            let rms = 0;
            for (let j = 0; j < chunk.length; j++) rms += chunk[j] * chunk[j];
            rms = Math.sqrt(rms / windowSize);

            if (rms > 0.005) {
                const freq = autoCorrelate(chunk, sampleRate);
                if (freq !== -1 && freq > 60 && freq < 2000) {
                    const note = getNoteFromFrequency(freq);
                    if (note) {
                        kf.processNote(note.midi % 12);
                    }
                }
            }
        }

        return kf.estimateKey();
    } catch (e) {
        console.error("Key detection failed:", e);
        return "Unknown";
    }
}
