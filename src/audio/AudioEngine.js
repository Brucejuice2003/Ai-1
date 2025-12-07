/**
 * AudioEngine.js
 *
 * Professional Audio Analysis Engine.
 * Implements:
 * 1. YIN Algorithm (Pitch Detection)
 * 2. FFT-based Chromagram Analysis (Key Detection)
 * 3. Offline Full-Buffer Processing
 * 4. Vocal-focused filtering for mixed audio
 */

import { getNoteFromFrequency, getVoiceTypesFromRange, yinPitch } from './utils';

// --- CONSTANTS ---
const SILENCE_RMS = 0.005;   // Adjusted for mixed audio
const MIN_VOCAL_FREQ = 80;   // ~E2 (Low male voice)
const MAX_VOCAL_FREQ = 1100; // ~C6 (High soprano)

// Krumhansl-Schmuckler Key Profiles (Major/Minor) - Empirically derived
const KEY_PROFILES = {
    major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
    minor: [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Note frequencies for chromagram (A4 = 440Hz)
const NOTE_FREQUENCIES = NOTE_NAMES.map((_, i) => 440 * Math.pow(2, (i - 9) / 12));

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

        // 1. Preprocess: Apply vocal-range bandpass filter
        const processedBuffer = await this.preprocess(audioBuffer);
        const channelData = processedBuffer.getChannelData(0);

        // 2. FFT-based Key Detection (works on full mix)
        console.log("AudioEngine: Detecting Key via FFT Chromagram...");
        const keyResult = await this.detectKeyFFT(audioBuffer);

        // 3. Pitch Scanning for Voice Analysis (on filtered buffer)
        console.log("AudioEngine: Analyzing Vocal Content...");
        const scanResult = await this.scan(channelData);

        // 4. Build final result with confidence scores
        const finalResult = {
            key: keyResult?.key || scanResult.key || "Unknown",
            keyConfidence: keyResult?.confidence || 0,
            voiceType: scanResult.voiceType,
            range: scanResult.range,
            bpm: 0
        };

        // Final summary log
        console.log("═══════════════════════════════════════════");
        console.log("📊 FINAL ANALYSIS RESULTS");
        console.log("═══════════════════════════════════════════");
        console.log(`Key: ${finalResult.key} (${finalResult.keyConfidence}% confident)`);
        console.log(`Voice Type: ${finalResult.voiceType}`);
        console.log(`Range: ${finalResult.range}`);
        console.log("═══════════════════════════════════════════");

        return finalResult;
    }

    /**
     * Pre-process using OfflineAudioContext (Filters)
     * Applies bandpass filter focused on vocal frequencies to reduce instrument interference.
     */
    async preprocess(buffer) {
        const ctx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Vocal-focused bandpass: 150Hz - 1200Hz
        // This cuts bass guitar/kick (below 150Hz) and most cymbals/hi-hats (above 1200Hz)
        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 150;
        highpass.Q.value = 0.7;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 1200;
        lowpass.Q.value = 0.7;

        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(ctx.destination);

        source.start(0);
        return await ctx.startRendering();
    }

    /**
     * The Main Loop: Scans the filtered audio data for vocal analysis.
     */
    async scan(data) {
        const windowSize = 2048;
        const hopSize = 1024;

        const pitchCandidates = [];
        let voicedFrames = 0;
        let totalBrightness = 0;

        // Calculate overall signal level to set adaptive threshold
        let overallRms = 0;
        for (let i = 0; i < data.length; i++) {
            overallRms += data[i] * data[i];
        }
        overallRms = Math.sqrt(overallRms / data.length);
        const adaptiveThreshold = Math.max(SILENCE_RMS, overallRms * 0.1);

        // Process in chunks to avoid UI freeze
        const CHUNK_SIZE = 500;
        let loopCount = 0;
        let lastYield = Date.now();

        for (let i = 0; i < data.length - windowSize; i += hopSize) {
            loopCount++;
            if (loopCount % CHUNK_SIZE === 0 && Date.now() - lastYield > 16) {
                await new Promise(r => setTimeout(r, 0));
                lastYield = Date.now();
            }

            const frame = data.slice(i, i + windowSize);
            const rms = this.calculateRMS(frame);

            if (rms < adaptiveThreshold) continue;

            // YIN Pitch Detection
            const pitch = yinPitch(frame, this.sampleRate);
            if (pitch !== -1 && pitch >= MIN_VOCAL_FREQ && pitch <= MAX_VOCAL_FREQ) {
                pitchCandidates.push(pitch);
                voicedFrames++;
                totalBrightness += this.calculateBrightness(frame);
            }
        }

        // Voice Analysis
        const voiceResult = this.analyzeVoice(pitchCandidates, totalBrightness, voicedFrames);

        return {
            ...voiceResult,
            bpm: 0
        };
    }

    /**
     * FFT-based Key Detection using Chromagram
     * Works on full mix by analyzing harmonic content across all octaves.
     */
    async detectKeyFFT(audioBuffer) {
        try {
            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            const fftSize = 4096;
            const hopSize = 2048;

            // Chromagram accumulator (12 pitch classes)
            const chroma = new Float32Array(12).fill(0);

            // Create offline context for FFT analysis
            const offlineCtx = new OfflineAudioContext(1, fftSize, sampleRate);
            const analyser = offlineCtx.createAnalyser();
            analyser.fftSize = fftSize;
            const frequencyBins = analyser.frequencyBinCount;
            const binSize = sampleRate / fftSize;

            // Manual FFT using typed arrays (simple DFT for key detection)
            // We'll use a simpler approach: analyze pitch histogram from the full buffer
            const numFrames = Math.floor((channelData.length - fftSize) / hopSize);

            for (let frameIdx = 0; frameIdx < numFrames; frameIdx++) {
                const startSample = frameIdx * hopSize;
                const frame = channelData.slice(startSample, startSample + fftSize);

                // Calculate magnitude spectrum using simple DFT for key frequencies
                // We focus on frequencies from C2 (~65Hz) to C6 (~1047Hz)
                for (let noteIdx = 0; noteIdx < 12; noteIdx++) {
                    // Check multiple octaves (2-5) for each pitch class
                    for (let octave = 2; octave <= 5; octave++) {
                        const freq = 440 * Math.pow(2, (noteIdx - 9 + (octave - 4) * 12) / 12);
                        const magnitude = this.goertzel(frame, freq, sampleRate);
                        chroma[noteIdx] += magnitude;
                    }
                }

                // Yield periodically
                if (frameIdx % 100 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            // Normalize chroma
            const maxChroma = Math.max(...chroma);
            if (maxChroma > 0) {
                for (let i = 0; i < 12; i++) {
                    chroma[i] /= maxChroma;
                }
            }

            // Correlate with key profiles
            let bestKey = "Unknown";
            let maxCorr = -Infinity;

            // Check Major keys
            for (let i = 0; i < 12; i++) {
                const correlation = this.correlate(chroma, KEY_PROFILES.major, i);
                if (correlation > maxCorr) {
                    maxCorr = correlation;
                    bestKey = NOTE_NAMES[i] + " Major";
                }
            }

            // Check Minor keys
            for (let i = 0; i < 12; i++) {
                const correlation = this.correlate(chroma, KEY_PROFILES.minor, i);
                if (correlation > maxCorr) {
                    maxCorr = correlation;
                    bestKey = NOTE_NAMES[i] + " Minor";
                }
            }

            // Calculate confidence as percentage (correlation typically ranges 0-50+)
            // A confidence above 30 is generally reliable
            const confidence = Math.min(100, Math.round((maxCorr / 50) * 100));

            // Log detailed analysis for verification
            console.log("═══════════════════════════════════════════");
            console.log("🎵 KEY DETECTION ANALYSIS");
            console.log("═══════════════════════════════════════════");
            console.log("Chromagram (normalized note strengths):");
            NOTE_NAMES.forEach((note, i) => {
                const bar = "█".repeat(Math.round(chroma[i] * 20));
                console.log(`  ${note.padEnd(2)}: ${bar} (${(chroma[i] * 100).toFixed(1)}%)`);
            });
            console.log("───────────────────────────────────────────");
            console.log(`Detected Key: ${bestKey}`);
            console.log(`Correlation Score: ${maxCorr.toFixed(2)}`);
            console.log(`Confidence: ${confidence}%`);
            console.log("═══════════════════════════════════════════");

            return { key: bestKey, confidence, correlation: maxCorr };

        } catch (e) {
            console.error("FFT Key Detection failed:", e);
            return null;
        }
    }

    /**
     * Goertzel algorithm - efficient single-frequency DFT
     * Much faster than full FFT when we only need specific frequencies.
     */
    goertzel(samples, targetFreq, sampleRate) {
        const k = Math.round((samples.length * targetFreq) / sampleRate);
        const w = (2 * Math.PI * k) / samples.length;
        const cosW = Math.cos(w);
        const sinW = Math.sin(w);
        const coeff = 2 * cosW;

        let s0 = 0, s1 = 0, s2 = 0;

        for (let i = 0; i < samples.length; i++) {
            s0 = samples[i] + coeff * s1 - s2;
            s2 = s1;
            s1 = s0;
        }

        // Calculate magnitude
        const real = s1 - s2 * cosW;
        const imag = s2 * sinW;
        return Math.sqrt(real * real + imag * imag);
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
        // Not enough pitched frames detected
        if (pitches.length < 10) {
            if (pitches.length > 0) {
                pitches.sort((a, b) => a - b);
                const minN = getNoteFromFrequency(pitches[0]);
                const maxN = getNoteFromFrequency(pitches[pitches.length - 1]);
                return {
                    voiceType: "Instrumental",
                    range: minN && maxN ? `${minN.name}${minN.octave} - ${maxN.name}${maxN.octave}` : "-"
                };
            }
            return { voiceType: "Instrumental", range: "-" };
        }

        // Sort and remove outliers (5% from each end)
        pitches.sort((a, b) => a - b);
        const cut = Math.floor(pitches.length * 0.05);
        const corePitches = pitches.slice(cut, pitches.length - cut);

        if (corePitches.length === 0) {
            return { voiceType: "Unknown", range: "-" };
        }

        const minFreq = corePitches[0];
        const maxFreq = corePitches[corePitches.length - 1];

        // Calculate tessitura (weighted average MIDI)
        let sumMidi = 0;
        corePitches.forEach(f => sumMidi += (12 * Math.log2(f / 440) + 69));
        const avgMidi = sumMidi / corePitches.length;

        // Classify voice type
        const type = this.classifyVoice(minFreq, maxFreq, avgMidi);

        const minN = getNoteFromFrequency(minFreq);
        const maxN = getNoteFromFrequency(maxFreq);

        return {
            voiceType: type,
            range: `${minN.name}${minN.octave} - ${maxN.name}${maxN.octave}`
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
