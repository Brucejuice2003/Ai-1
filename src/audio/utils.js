export const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const A4_FREQ = 440;

/**
 * Converts frequency (Hz) to the nearest musical note and cents deviation.
 */
export function getNoteFromFrequency(frequency) {
    if (!frequency || frequency < 20) return null;

    const noteNum = 12 * (Math.log(frequency / A4_FREQ) / Math.log(2)) + 69;
    const roundedNote = Math.round(noteNum);
    const cents = Math.floor((noteNum - roundedNote) * 100);

    const noteName = NOTE_STRINGS[roundedNote % 12];
    const octave = Math.floor(roundedNote / 12) - 1;

    const targetFrequency = A4_FREQ * Math.pow(2, (roundedNote - 69) / 12);

    return {
        name: noteName,
        octave: octave,
        fullName: `${noteName}${octave}`,
        cents: cents,
        frequency: frequency,
        targetFrequency: targetFrequency,
        midi: roundedNote
    };
}

/**
 * Simple autocorrelation pitch detection.
 */
export function autoCorrelate(buffer, sampleRate) {
    const SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.001) return -1; // Too quiet

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    const buf2 = buffer.slice(r1, r2);
    const c = new Array(buf2.length).fill(0);

    for (let i = 0; i < buf2.length; i++) {
        for (let j = 0; j < buf2.length - i; j++) {
            c[i] = c[i] + buf2[j] * buf2[j + i];
        }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buf2.length; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;

    // Parabolic interpolation
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
}

/**
 * YIN Pitch Detection Algorithm (The "Gold Standard")
 * Robust against noise and octave errors.
 */
export function yinPitch(buffer, sampleRate) {
    const threshold = 0.15; // Standard YIN threshold
    const bufferSize = buffer.length;
    const yinBuffer = new Float32Array(Math.floor(bufferSize / 2));

    // Step 1: Difference Function
    for (let tau = 0; tau < yinBuffer.length; tau++) {
        yinBuffer[tau] = 0;
        for (let i = 0; i < yinBuffer.length; i++) {
            const delta = buffer[i] - buffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
    }

    // Step 2: CMNDF
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < yinBuffer.length; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    // Step 3: Absolute Threshold
    let tauEstimate = -1;
    for (let tau = 2; tau < yinBuffer.length; tau++) {
        if (yinBuffer[tau] < threshold) {
            while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
                tau++;
            }
            tauEstimate = tau;
            break;
        }
    }

    if (tauEstimate === -1) return -1;

    return sampleRate / tauEstimate;
}

/**
 * Calculates Spectral Centroid.
 */
export function getSpectralCentroid(frequencyData, sampleRate) {
    let numerator = 0;
    let denominator = 0;
    const binSize = sampleRate / (frequencyData.length * 2);

    for (let i = 0; i < frequencyData.length; i++) {
        const magnitude = frequencyData[i];
        const frequency = i * binSize;
        numerator += frequency * magnitude;
        denominator += magnitude;
    }

    if (denominator === 0) return 0;
    return numerator / denominator;
}

/**
 * Detects BPM from an AudioBuffer using OfflineAudioContext (Background Thread).
 * Applies Low-Pass Filter to isolate Kick/Bass for superior accuracy.
 */
export async function detectBPM(audioBuffer) {
    try {
        // Create Offline Context to render audio in background
        const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;

        // Lowpass Filter to isolate Bass/Kick (The "Beat")
        const filter = offlineCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 150;
        filter.Q.value = 1;

        source.connect(filter);
        filter.connect(offlineCtx.destination);
        source.start(0);

        const renderedBuffer = await offlineCtx.startRendering();
        const channelData = renderedBuffer.getChannelData(0);
        const sampleRate = renderedBuffer.sampleRate;

        // 1. Calculate volume peaks
        const windowSize = Math.floor(sampleRate * 0.05);
        let peaks = [];

        for (let i = 0; i < channelData.length; i += windowSize) {
            let max = 0;
            for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
                const vol = Math.abs(channelData[i + j]);
                if (vol > max) max = vol;
            }
            peaks.push(max);
        }

        // 2. Find significantly high peaks (beats) using dynamic threshold
        // Instead of sorting all, find max peak first
        let maxPeak = 0;
        for (let p of peaks) if (p > maxPeak) maxPeak = p;

        const threshold = maxPeak * 0.5; // 50% of max volume seems safer than sorting 30% percentile

        const beatIndices = [];
        for (let i = 0; i < peaks.length; i++) {
            if (peaks[i] > threshold) {
                if (beatIndices.length === 0 || i - beatIndices[beatIndices.length - 1] > 4) {
                    beatIndices.push(i);
                }
            }
        }

        // 3. Calculate intervals and convert to immediate BPMs
        const rawBpms = [];
        for (let i = 1; i < beatIndices.length; i++) {
            const intervalUnits = beatIndices[i] - beatIndices[i - 1];
            // intervalUnits is in windows of (sampleRate * 0.05)
            const seconds = intervalUnits * 0.05;
            if (seconds === 0) continue;

            let bpm = 60 / seconds;
            // Best fit range for general music 70-170
            while (bpm < 70) bpm *= 2;
            while (bpm > 170) bpm /= 2;
            rawBpms.push(bpm);
        }

        // 4. Histogram of BPMs
        const bpmCounts = {};
        rawBpms.forEach(b => {
            const rounded = Math.round(b);
            bpmCounts[rounded] = (bpmCounts[rounded] || 0) + 1;
            bpmCounts[rounded - 1] = (bpmCounts[rounded - 1] || 0) + 0.5;
            bpmCounts[rounded + 1] = (bpmCounts[rounded + 1] || 0) + 0.5;
        });

        let maxCount = 0;
        let bestBpm = 0;
        for (const b in bpmCounts) {
            if (bpmCounts[b] > maxCount) {
                maxCount = bpmCounts[b];
                bestBpm = Number(b);
            }
        }

        return bestBpm || 0;

    } catch (e) {
        console.error("BPM Detection failed", e);
        return 0;
    }
}

/**
 * Detects Pitch Range from an AudioBuffer using YIN and cluster analysis.
 * Returns min/max frequencies and voice type estimation.
 */
export async function detectPitchRange(audioBuffer) {
    try {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const windowSize = 2048;
        const hopSize = 1024;

        const midiCounts = {};
        const midiEnergy = {};
        let totalVoicedFrames = 0;

        // Scan buffer for pitches
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            const frame = channelData.slice(i, i + windowSize);

            // RMS check
            let rms = 0;
            for (let j = 0; j < frame.length; j++) rms += frame[j] * frame[j];
            rms = Math.sqrt(rms / frame.length);

            if (rms > 0.01) {
                const frequency = yinPitch(frame, sampleRate);
                if (frequency !== -1 && frequency > 60 && frequency < 1400) {
                    const note = getNoteFromFrequency(frequency);
                    if (note) {
                        midiCounts[note.midi] = (midiCounts[note.midi] || 0) + 1;
                        midiEnergy[note.midi] = (midiEnergy[note.midi] || 0) + rms;
                        totalVoicedFrames++;
                    }
                }
            }
        }

        if (totalVoicedFrames < 10) {
            return { isInstrumental: true, minFreq: 0, maxFreq: 0, minNote: null, maxNote: null, avgMidi: 0 };
        }

        // Find the largest cluster of MIDI notes
        const threshold = totalVoicedFrames * 0.01;
        const validMidis = Object.keys(midiCounts)
            .map(Number)
            .filter(midi => midiCounts[midi] > threshold)
            .sort((a, b) => a - b);

        if (validMidis.length === 0) {
            return { isInstrumental: true, minFreq: 0, maxFreq: 0, minNote: null, maxNote: null, avgMidi: 0 };
        }

        // Cluster analysis - find largest contiguous group
        const clusters = [];
        let currentCluster = [validMidis[0]];

        for (let i = 1; i < validMidis.length; i++) {
            if (validMidis[i] - validMidis[i - 1] <= 3) {
                currentCluster.push(validMidis[i]);
            } else {
                clusters.push(currentCluster);
                currentCluster = [validMidis[i]];
            }
        }
        clusters.push(currentCluster);

        // Find the cluster with most notes
        let bestCluster = clusters[0];
        let maxClusterWeight = 0;
        for (const cluster of clusters) {
            const weight = cluster.reduce((sum, m) => sum + (midiCounts[m] || 0), 0);
            if (weight > maxClusterWeight) {
                maxClusterWeight = weight;
                bestCluster = cluster;
            }
        }

        // Calculate range from best cluster
        const minMidi = bestCluster[0];
        const maxMidi = bestCluster[bestCluster.length - 1];

        // Calculate average MIDI (tessitura)
        let weightedSum = 0;
        let totalWeight = 0;
        bestCluster.forEach(m => {
            const weight = midiCounts[m] || 0;
            weightedSum += m * weight;
            totalWeight += weight;
        });
        const avgMidi = totalWeight > 0 ? weightedSum / totalWeight : (minMidi + maxMidi) / 2;

        const minFreq = 440 * Math.pow(2, (minMidi - 69) / 12);
        const maxFreq = 440 * Math.pow(2, (maxMidi - 69) / 12);

        return {
            isInstrumental: false,
            minFreq: minFreq,
            maxFreq: maxFreq,
            minNote: getNoteFromFrequency(minFreq),
            maxNote: getNoteFromFrequency(maxFreq),
            avgMidi: avgMidi
        };
    } catch (e) {
        console.error("Range detection failed", e);
        return null;
    }
}

/**
 * Maps a frequency range to potential voice types using Range AND Tessitura.
 */
export function getVoiceTypesFromRange(minFreq, maxFreq, avgMidi = null) {
    const types = [];

    // If avgMidi isn't provided (legacy calls), estimate it from range center
    if (!avgMidi) {
        const minMidi = 12 * Math.log2(minFreq / 440) + 69;
        const maxMidi = 12 * Math.log2(maxFreq / 440) + 69;
        avgMidi = (minMidi + maxMidi) / 2;
    }

    // Tessitura-based classification
    if (avgMidi < 48) { // Below C3 range
        types.push("Bass");
        if (avgMidi > 43) types.push("Baritone");
    } else if (avgMidi < 55) { // C3 - G3 range
        types.push("Baritone");
        if (avgMidi < 50) types.push("Bass");
        else types.push("Tenor");
    } else if (avgMidi < 63) { // G3 - Eb4 range
        types.push("Tenor");
        if (avgMidi > 59) types.push("Alto");
        else types.push("Baritone");
    } else if (avgMidi < 69) { // Eb4 - A4 range
        types.push("Alto / Countertenor");
        if (avgMidi > 65) types.push("Soprano");
        else types.push("Tenor");
    } else { // Above A4
        types.push("Soprano");
        if (avgMidi < 74) types.push("Alto / Countertenor");
    }

    // Safety fallback for weird noise analysis
    if (types.length === 0) return ["Unknown"];

    return types.slice(0, 1);
}
