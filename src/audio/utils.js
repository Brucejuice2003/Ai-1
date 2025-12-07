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
 * Now includes Step 4: Parabolic Interpolation for sub-sample accuracy.
 */
export function yinPitch(buffer, sampleRate) {
    const threshold = 0.15; // Standard YIN threshold
    const bufferSize = buffer.length;
    const halfBuffer = Math.floor(bufferSize / 2);
    const yinBuffer = new Float32Array(halfBuffer);

    // Step 1: Difference Function
    for (let tau = 0; tau < halfBuffer; tau++) {
        yinBuffer[tau] = 0;
        for (let i = 0; i < halfBuffer; i++) {
            const delta = buffer[i] - buffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
    }

    // Step 2: Cumulative Mean Normalized Difference Function (CMNDF)
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfBuffer; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    // Step 3: Absolute Threshold - find first minimum below threshold
    let tauEstimate = -1;
    for (let tau = 2; tau < halfBuffer; tau++) {
        if (yinBuffer[tau] < threshold) {
            // Find the local minimum
            while (tau + 1 < halfBuffer && yinBuffer[tau + 1] < yinBuffer[tau]) {
                tau++;
            }
            tauEstimate = tau;
            break;
        }
    }

    if (tauEstimate === -1) return -1;

    // Step 4: Parabolic Interpolation for sub-sample accuracy
    // This significantly improves frequency precision
    let betterTau = tauEstimate;
    if (tauEstimate > 0 && tauEstimate < halfBuffer - 1) {
        const s0 = yinBuffer[tauEstimate - 1];
        const s1 = yinBuffer[tauEstimate];
        const s2 = yinBuffer[tauEstimate + 1];
        // Parabolic interpolation: find vertex of parabola through 3 points
        const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
        if (Math.abs(adjustment) < 1) {
            betterTau = tauEstimate + adjustment;
        }
    }

    return sampleRate / betterTau;
}

/**
 * Calculates onset strength envelope using spectral flux.
 * Returns an array of onset strengths for each frame.
 */
function calculateOnsetEnvelope(channelData, sampleRate, frameSize = 1024, hopSize = 512) {
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
  const onsetEnvelope = new Float32Array(numFrames);

  let prevEnergy = 0;

  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;

    // Calculate frame energy (sum of squared samples)
    let energy = 0;
    for (let i = 0; i < frameSize; i++) {
      energy += channelData[start + i] * channelData[start + i];
    }
    energy = Math.sqrt(energy / frameSize);

    // Spectral flux: positive difference in energy (half-wave rectification)
    const flux = Math.max(0, energy - prevEnergy);
    onsetEnvelope[frame] = flux;
    prevEnergy = energy;
  }

  // Normalize the envelope
  let maxOnset = 0;
  for (let i = 0; i < onsetEnvelope.length; i++) {
    if (onsetEnvelope[i] > maxOnset) maxOnset = onsetEnvelope[i];
  }
  if (maxOnset > 0) {
    for (let i = 0; i < onsetEnvelope.length; i++) {
      onsetEnvelope[i] /= maxOnset;
    }
  }

  return onsetEnvelope;
}

/**
 * Finds tempo from onset envelope using autocorrelation.
 * Returns BPM in the range 60-200 with harmonic validation.
 */
function findTempoFromOnsets(onsetEnvelope, hopSize, sampleRate) {
  const minBPM = 60;
  const maxBPM = 200;

  // Convert BPM range to lag range (in onset frames)
  const secondsPerFrame = hopSize / sampleRate;
  const minLag = Math.floor(60 / (maxBPM * secondsPerFrame)); // ~200 BPM
  const maxLag = Math.ceil(60 / (minBPM * secondsPerFrame));  // ~60 BPM

  const n = onsetEnvelope.length;
  if (n < maxLag * 2) return { bpm: 0, confidence: 0 };

  // Compute autocorrelation for ALL lags we might need (including harmonics)
  const extendedMaxLag = maxLag * 2; // Need double for harmonic checking
  const correlation = new Float32Array(extendedMaxLag + 1);

  for (let lag = minLag; lag <= extendedMaxLag && lag < n; lag++) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += onsetEnvelope[i] * onsetEnvelope[i + lag];
      count++;
    }
    correlation[lag] = count > 0 ? sum / count : 0;
  }

  // Find peaks in correlation within our BPM range
  const peaks = [];
  for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
    if (correlation[lag] > correlation[lag - 1] && correlation[lag] > correlation[lag + 1]) {
      const lagBpm = 60 / (lag * secondsPerFrame);
      peaks.push({
        lag: lag,
        bpm: lagBpm,
        value: correlation[lag]
      });
    }
  }

  if (peaks.length === 0) return { bpm: 0, confidence: 0 };

  // Sort by correlation value
  peaks.sort((a, b) => b.value - a.value);

  // Evaluate top candidates with harmonic checking
  // For each candidate, check if double-tempo (half-lag) exists and is stronger
  let bestCandidate = null;
  let bestScore = -1;

  for (const peak of peaks.slice(0, 5)) { // Check top 5 candidates
    const halfLag = Math.round(peak.lag / 2);
    const doubleLag = peak.lag * 2;

    // Get correlation at harmonic positions
    const halfCorr = halfLag >= minLag ? correlation[halfLag] || 0 : 0;
    const doubleCorr = doubleLag < correlation.length ? correlation[doubleLag] || 0 : 0;

    // Score: prefer tempos where the half-tempo (double BPM) also has correlation
    // This helps distinguish 80 BPM from 160 BPM
    let score = peak.value;

    // If half-lag (double BPM) has good correlation, boost this candidate
    // because it suggests we found a strong sub-beat
    if (halfCorr > peak.value * 0.5) {
      // The half-lag is also strong - prefer the faster tempo
      const halfBpm = 60 / (halfLag * secondsPerFrame);
      if (halfBpm >= minBPM && halfBpm <= maxBPM) {
        // Use the faster tempo instead
        score = halfCorr * 1.5; // Boost score
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = { lag: halfLag, bpm: halfBpm, value: halfCorr };
        }
        continue;
      }
    }

    // Penalize if this looks like a half-time detection
    // (if double-lag has similar or stronger correlation)
    if (doubleCorr > peak.value * 0.8) {
      score *= 0.7; // Penalize - likely detecting half-time
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = peak;
    }
  }

  if (!bestCandidate) return { bpm: 0, confidence: 0 };

  // Parabolic interpolation for sub-frame accuracy
  let betterLag = bestCandidate.lag;
  if (bestCandidate.lag > 1 && bestCandidate.lag < correlation.length - 1) {
    const y0 = correlation[bestCandidate.lag - 1];
    const y1 = correlation[bestCandidate.lag];
    const y2 = correlation[bestCandidate.lag + 1];
    const denom = 2 * (y0 - 2 * y1 + y2);
    if (Math.abs(denom) > 0.0001) {
      const adjustment = (y0 - y2) / denom;
      if (Math.abs(adjustment) < 1) {
        betterLag = bestCandidate.lag + adjustment;
      }
    }
  }

  // Convert lag to BPM
  const bpm = 60 / (betterLag * secondsPerFrame);

  return { bpm: Math.round(bpm), confidence: bestScore };
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
 * Detects BPM from an AudioBuffer using onset detection and autocorrelation.
 * Uses OfflineAudioContext for background processing with bandpass filtering.
 * Supports 60-200 BPM range with improved accuracy.
 */
export async function detectBPM(audioBuffer) {
  try {
    const sampleRate = audioBuffer.sampleRate;

    // Create Offline Context with bandpass filtering
    const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    // High-pass filter to remove rumble (30Hz)
    const highPass = offlineCtx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 30;
    highPass.Q.value = 0.7;

    // Low-pass filter to isolate bass/kick (200Hz)
    const lowPass = offlineCtx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 200;
    lowPass.Q.value = 0.7;

    // Chain: source -> highpass -> lowpass -> destination
    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);

    // Parameters for onset detection
    const frameSize = 1024;  // ~23ms at 44.1kHz
    const hopSize = 512;     // 50% overlap

    // Step 1: Calculate onset envelope
    const onsetEnvelope = calculateOnsetEnvelope(channelData, sampleRate, frameSize, hopSize);

    if (onsetEnvelope.length < 100) {
      console.warn("Audio too short for reliable BPM detection");
      return 0;
    }

    // Step 2: Find tempo using autocorrelation
    const result = findTempoFromOnsets(onsetEnvelope, hopSize, sampleRate);

    if (result.bpm === 0) {
      // Fallback: try with different parameters
      const fallbackEnvelope = calculateOnsetEnvelope(channelData, sampleRate, 2048, 1024);
      const fallbackResult = findTempoFromOnsets(fallbackEnvelope, 1024, sampleRate);
      return fallbackResult.bpm;
    }

    return result.bpm;

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

            if (rms > 0.02) {
                const frequency = yinPitch(frame, sampleRate);
                if (frequency !== -1 && frequency > 85 && frequency < 1400) {
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
