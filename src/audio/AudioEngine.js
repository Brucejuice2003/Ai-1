/**
 * AudioEngine.js
 * 
 * The "Nuclear Option" for Audio Analysis.
 * Implements:
 * 1. YIN Algorithm (Pitch Detection)
 * 2. Chromagram Analysis (Key Detection)
 * 3. Offline Full-Buffer Processing
 */

import { getNoteFromFrequency, getVoiceTypesFromRange, detectPitchRange, yinPitch } from './utils'; // Reuse helper

// --- CONSTANTS ---
const YIN_THRESHOLD = 0.15; // More tolerant (0.10 -> 0.15)
const SILENCE_RMS = 0.001;   // Extremely sensitive (0.005 -> 0.001)
const MIN_FREQ = 50;         // ~G1 (Sub-bass support)
const MAX_FREQ = 1400;       // ~F6 (High Soprano)

// Krumhansl-Schmuckler Key Profiles (Major/Minor)
const KEY_PROFILES = {
    major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
    minor: [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class AudioEngine {
    constructor() {
        this.buffer = null;
        this.sampleRate = 44100;
        this.offlineCtx = null;
    }

    /**
     * Main Entry Point: Analyze the entire buffer.
     * @param {AudioBuffer} audioBuffer
     */
    async analyze(audioBuffer) {
        console.log("AudioEngine: Starting Deep Analysis...");
        this.buffer = audioBuffer;
        this.sampleRate = audioBuffer.sampleRate;

        // 1. Render Offline (Filter/Normalize)
        const processedBuffer = await this.preprocess(audioBuffer);
        const channelData = processedBuffer.getChannelData(0);

        // 2. Scan Buffer (YIN + Chroma)
        // We still run scan for KEY DETECTION (Chroma)
        const scanResult = await this.scan(channelData);

        // 3. Advanced Cluster Analysis for VOICE/RANGE
        // This replaces the simple scan-based voice detection
        console.log("AudioEngine: Running Cluster Analysis...");
        const clusterResult = await detectPitchRange(audioBuffer);

        let finalResult = { ...scanResult };

        if (clusterResult && !clusterResult.isInstrumental) {
            const type = getVoiceTypesFromRange(clusterResult.minFreq, clusterResult.maxFreq, clusterResult.avgMidi)[0];
            finalResult.voiceType = type;
            finalResult.range = `${clusterResult.minNote.name}${clusterResult.minNote.octave} - ${clusterResult.maxNote.name}${clusterResult.maxNote.octave}`;
            // We use the Key from Scan (Chroma is better for Key)
        } else if (clusterResult && clusterResult.isInstrumental) {
            finalResult.voiceType = "Instrumental";
            finalResult.range = `${clusterResult.minNote.name}${clusterResult.minNote.octave} - ${clusterResult.maxNote.name}${clusterResult.maxNote.octave}`;
        }

        return finalResult;
    }

    /**
     * Pre-process using OfflineAudioContext (Filters)
     */
    async preprocess(buffer) {
        const ctx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Bandpass Filter (30Hz - 2000Hz) - Wide enough for Bass & Soprano, cuts noise
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 2000;

        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 85;

        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(ctx.destination);

        source.start(0);
        return await ctx.startRendering();
    }

    /**
     * The Main Loop: Scans the audio data.
     */
    async scan(data) {
        const windowSize = 2048; // For YIN
        const hopSize = 1024;    // 50% overlap

        // Results Containers
        const pitchCandidates = [];
        const chromaSums = new Float32Array(12).fill(0);
        let totalFrames = 0;
        let voicedFrames = 0;
        let totalBrightness = 0;

        // Optimization: Process in chunks to avoid UI freeze
        const CHUNK_SIZE = 500; // frames per yield
        let loopCount = 0;
        let lastYield = Date.now();

        for (let i = 0; i < data.length - windowSize; i += hopSize) {
            loopCount++;
            if (loopCount % CHUNK_SIZE === 0) {
                if (Date.now() - lastYield > 16) {
                    await new Promise(r => setTimeout(r, 0));
                    lastYield = Date.now();
                }
            }

            const frame = data.slice(i, i + windowSize);

            // 1. RMS (Silence Detection)
            const rms = this.calculateRMS(frame);
            if (rms < SILENCE_RMS) continue;

            // 2. Chroma Accumulation (for Key)
            // this.accumulateChroma(frame, chromaSums); // Legacy removed
            totalFrames++;

            // 3. YIN Pitch Detection (for Voice)
            // Only run YIN if RMS is significant (voice candidate)
            // Use slightly higher threshold for Pitch to avoid noise-pitch
            if (rms > 0.01) {
                const pitch = yinPitch(frame, this.sampleRate);
                if (pitch !== -1 && pitch >= MIN_FREQ && pitch <= MAX_FREQ) {
                    pitchCandidates.push(pitch);
                    voicedFrames++;

                    // Simple ZCR Brightness
                    totalBrightness += this.calculateBrightness(frame);
                }
            }
        }

        // --- ANALYSIS ---

        // Key Detection
        const detectedKey = this.detectKey(chromaSums);

        // Voice Analysis
        const voiceResult = this.analyzeVoice(pitchCandidates, totalBrightness, voicedFrames);

        return {
            key: detectedKey,
            ...voiceResult,
            bpm: 0 // BPM not handled here yet, keep legacy or impl later
        };
    }

    // --- ALGORITHMS ---

    /**
     * YIN Pitch Detection Algorithm
     * Steps 1-3 implemented for robust detection.
     */
    /**
     * YIN Pitch Detection Algorithm
     * Steps 1-3 implemented for robust detection.
     */
    // yinPitch(buffer)  <-- REMOVED (Moved to utils.js)

    // accumulateChroma removed (using Pitch Histogram instead)

    /**
     * Krumhansl-Schmuckler Key Finding
     * Uses the chroma sums (or pitch histogram) to correlate with profiles.
     */
    detectKey(chromaSums) {
        // Re-implementing simplified logic:
        // We will need to capture pitches in `scan` for this to work given the limitation above.
        // See `analyzeVoice` for pitch usage. we will perform key detection there.
        return "Unknown"; // Placeholder - logic moved to analyzeVoice/scan end
    }

    // --- HELPER METRICS ---

    calculateRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        return Math.sqrt(sum / buffer.length);
    }

    calculateBrightness(buffer) {
        let zcr = 0;
        for (let i = 1; i < buffer.length; i++) {
            if ((buffer[i] >= 0 && buffer[i - 1] < 0) || (buffer[i] < 0 && buffer[i - 1] >= 0)) zcr++;
        }
        return zcr;
    }

    // --- RESULTS ---

    analyzeVoice(pitches, totalBrightness, frameCount) {
        // 1. Voice vs Instrumental
        // Threshold: Lowered to catch short clips (10 frames ~ 200ms)
        if (pitches.length < 10) {
            // Very short or silent - Use whatever we have if > 0
            if (pitches.length > 0) {
                pitches.sort((a, b) => a - b);
                const minF = pitches[0];
                const maxF = pitches[pitches.length - 1];
                const minN = getNoteFromFrequency(minF);
                const maxN = getNoteFromFrequency(maxF);

                // Predict Key from limited pitches
                const key = this.estimateKeyFromPitches(pitches);

                return {
                    isInstrumental: true,
                    voiceType: "Instrumental (Short)",
                    range: `${minN.name}${minN.octave} - ${maxN.name}${maxN.octave}`,
                    key: key
                };
            }
            // Absolute failure case
            return { isInstrumental: true, voiceType: "Instrumental", range: "-", key: "Unknown" };
        }

        // 2. Vocal Analysis
        pitches.sort((a, b) => a - b);

        // Remove outliers (1% from ends)
        const cut = Math.floor(pitches.length * 0.05);
        const corePitches = pitches.slice(cut, pitches.length - cut);

        const minFreq = corePitches[0];
        const maxFreq = corePitches[corePitches.length - 1];

        // Average Midi
        let sumMidi = 0;
        corePitches.forEach(f => sumMidi += (12 * Math.log2(f / 440) + 69));
        const avgMidi = sumMidi / corePitches.length;

        const avgBrightness = totalBrightness / frameCount;

        // Classification
        const type = this.classifyVoice(minFreq, maxFreq, avgMidi, avgBrightness);

        // Key Detection from Vocal Line
        const key = this.estimateKeyFromPitches(pitches);

        const minN = getNoteFromFrequency(minFreq);
        const maxN = getNoteFromFrequency(maxFreq);

        return {
            isInstrumental: false,
            voiceType: type,
            range: `${minN.name}${minN.octave} - ${maxN.name}${maxN.octave}`,
            key: key
        };
    }

    classifyVoice(min, max, avgMidi, brightness) {
        // Use the shared, more advanced logic from utils
        const types = getVoiceTypesFromRange(min, max, avgMidi);
        return types[0] || "Unknown";
    }

    estimateKeyFromPitches(pitches) {
        // Build Chroma Histogram
        const chroma = new Float32Array(12).fill(0);

        for (let f of pitches) {
            const midi = 12 * Math.log2(f / 440) + 69;
            const noteIndex = Math.round(midi) % 12;
            chroma[noteIndex]++;
        }

        // Correlate with Profiles
        let bestKey = "";
        let maxCorr = -Infinity;

        // Normalize Chroma
        const maxVal = Math.max(...chroma);
        if (maxVal > 0) chroma.forEach((v, i) => chroma[i] = v / maxVal);

        // Check Major
        for (let i = 0; i < 12; i++) {
            // Rotate Profile
            const correlation = this.correlate(chroma, KEY_PROFILES.major, i);
            if (correlation > maxCorr) {
                maxCorr = correlation;
                bestKey = NOTE_NAMES[i] + " Major";
            }
        }

        // Check Minor
        for (let i = 0; i < 12; i++) {
            const correlation = this.correlate(chroma, KEY_PROFILES.minor, i);
            if (correlation > maxCorr) {
                maxCorr = correlation;
                bestKey = NOTE_NAMES[i] + " Minor";
            }
        }

        return bestKey;
    }

    correlate(chroma, profile, offset) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += chroma[(i + offset) % 12] * profile[i];
        }
        return sum;
    }
}
