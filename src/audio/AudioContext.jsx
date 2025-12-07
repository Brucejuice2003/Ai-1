import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { autoCorrelate, getNoteFromFrequency, getSpectralCentroid, detectBPM } from './utils'; // Removed legacy imports

import { KeyFinder } from './KeyFinder'; // Kept for mic usage if any, or remove? Keeping for safety
import { VibratoDetector } from './VibratoDetector';
import { CrepeDetector } from './CrepeDetector';

const AudioContextState = createContext(null);

export function AudioProvider({ children }) {
    const [isListening, setIsListening] = useState(false);
    const [sourceType, setSourceType] = useState('idle'); // 'mic', 'file', or 'idle'
    const [availableDevices, setAvailableDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('default');

    // Audio Data State
    const [audioData, setAudioData] = useState({
        frequency: 0,
        note: '-',
        cents: 0,
        exactMidi: null,
        targetFrequency: 0,
        voiceType: 'Silence',
        voiceTypeColor: 'text-gray-500',
        volume: 0,
        estimatedKey: '--',
        vibrato: { isVibrato: false, rate: 0, depth: 0, quality: '', color: '' },
        bpm: 0,
        pitchRange: null,
        detectedVoiceTypes: []
    });

    // Audio Settings
    const [inputGain, setInputGain] = useState(1.0);
    const [noiseGateThreshold, setNoiseGateThreshold] = useState(0.01);
    const [useCrepe, setUseCrepe] = useState(true);

    // Core Audio Refs
    const audioCtxRef = useRef(null);
    const analyzerRef = useRef(null);
    const gainNodeRef = useRef(null);
    const sourceRef = useRef(null);

    const rafIdRef = useRef(null);
    const keyFinderRef = useRef(new KeyFinder());
    const vibratoRef = useRef(new VibratoDetector());
    const crepeRef = useRef(null);
    const crepeFreqRef = useRef(null); // Stores latest async freq from CREPE
    const lastUiUpdateRef = useRef(0);


    // For visualizer
    const [freqData, setFreqData] = useState(new Uint8Array(0));

    useEffect(() => {
        getDevices();
        navigator.mediaDevices.addEventListener('devicechange', getDevices);
        return () => {
            stopListening();
            navigator.mediaDevices.removeEventListener('devicechange', getDevices);
        }
    }, []);

    const getDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            setAvailableDevices(audioInputs);
        } catch (err) {
            console.error("Error fetching devices", err);
        }
    };

    const startMic = async () => {
        if (audioCtxRef.current) await audioCtxRef.current.close();

        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyzerRef.current = audioCtxRef.current.createAnalyser();
        analyzerRef.current.fftSize = 2048;

        // Create Gain Node
        gainNodeRef.current = audioCtxRef.current.createGain();
        gainNodeRef.current.gain.value = inputGain;
        try {
            // Attempt with preferred constraints (disable processing for raw audio)
            const constraints = {
                audio: {
                    deviceId: selectedDeviceId !== 'default' ? { exact: selectedDeviceId } : undefined,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
            initAudio();
        } catch (err) {
            console.warn("Preferred mic constraints failed, falling back to default.", err);
            try {
                // Fallback: Default settings
                const fallbackConstraints = {
                    audio: {
                        deviceId: selectedDeviceId !== 'default' ? { exact: selectedDeviceId } : undefined
                    }
                };
                const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
                sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
                initAudio();
            } catch (fatalErr) {
                console.error("Microphone access denied completely", fatalErr);
                alert("Could not access microphone. Please check permissions.");
            }
        }
    };

    const initAudio = () => {
        // Graph: Source -> Gain -> Analyzer -> Destination (if file) / Default (if mic, don't connect to destination)
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(analyzerRef.current);

        setSourceType('mic');
        setIsListening(true);
        // Legacy reset
        keyFinderRef.current.reset();
        vibratoRef.current.reset();

        // Initialize CREPE if enabled
        if (useCrepe) {
            crepeRef.current = new CrepeDetector(audioCtxRef.current, sourceRef.current.mediaStream, (freq) => {
                crepeFreqRef.current = freq;
            });
        }

        updateLoop();
    };

    // Update gain when state changes
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = inputGain;
        }
    }, [inputGain]);



    const stopListening = () => {
        if (sourceRef.current) {
            // STOP TRACKS to remove Red Dot
            if (sourceRef.current.mediaStream) {
                sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
            }

            try { sourceRef.current.stop(); } catch (e) { /* ignore */ }
            sourceRef.current.disconnect();
        }
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        setIsListening(false);
    };

    // State for stabilizers
    const voiceTypeBufferRef = useRef({ currentType: 'Silence', bufferLength: 0, candidate: null });
    const pitchBufferRef = useRef({ lastFreq: 0, stableFreq: 0, frames: 0 });

    const updateLoop = () => {
        if (!analyzerRef.current) return;

        const bufferLength = analyzerRef.current.fftSize;
        const timeDomainData = new Float32Array(bufferLength);
        const frequencyData = new Uint8Array(analyzerRef.current.frequencyBinCount);

        analyzerRef.current.getFloatTimeDomainData(timeDomainData);
        analyzerRef.current.getByteFrequencyData(frequencyData);

        // Update Visualizer Data using a copy to avoid render issues
        setFreqData(new Uint8Array(frequencyData));

        // Pitch Detection
        let frequency = autoCorrelate(timeDomainData, audioCtxRef.current.sampleRate);
        const centroid = getSpectralCentroid(frequencyData, audioCtxRef.current.sampleRate);

        let noteInfo = null;
        let voiceTypeData = { type: 'Silence', confidence: 0, color: 'text-gray-500', isStraining: false };

        // Calculate Volume (RMS)
        let rms = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
            rms += timeDomainData[i] * timeDomainData[i];
        }
        rms = Math.sqrt(rms / timeDomainData.length);

        const SILENCE_THRESHOLD = noiseGateThreshold; // Use user setting

        if (rms > SILENCE_THRESHOLD && frequency !== -1 && frequency > 60 && frequency < 1400) {
            noteInfo = getNoteFromFrequency(frequency);

            // --- VIBRATO DETECTION ---
            vibratoRef.current.update(frequency, Date.now() / 1000);

            // Note Stabilization
            if (Math.abs(frequency - pitchBufferRef.current.lastFreq) < 2) {
                pitchBufferRef.current.frames++;
                if (pitchBufferRef.current.frames > 3) {
                    pitchBufferRef.current.stableFreq = frequency;
                }
            } else {
                pitchBufferRef.current.frames = 0;
                pitchBufferRef.current.lastFreq = frequency;
            }
        } else {
            vibratoRef.current.reset();
        }

        // --- OVERRIDE WITH CREPE IF AVAILABLE ---
        if (useCrepe && crepeFreqRef.current) {
            // Trust CREPE more, but maybe apply simple smoothing?
            // CREPE is usually very stable.
            frequency = crepeFreqRef.current;

            // Re-calculate note info based on CREPE freq
            noteInfo = getNoteFromFrequency(frequency);

            // Update vibrato with this better frequency
            vibratoRef.current.update(frequency, Date.now() / 1000);

            // Update stable freq for display
            pitchBufferRef.current.stableFreq = frequency;
        }

        // Only update UI if mic is active source OR if we want live feedback for file play (optional)
        // For file playback, we rely on the Static Analysis for Key/Type, but we can show Note/Freq live
        // if (sourceType === 'mic') ... logic? 
        // Let's allow live feedback for both.

        // Throttled UI Updates (every 50ms)
        const now = Date.now();
        if (now - lastUiUpdateRef.current > 50) {
            if (noteInfo) {
                setAudioData(prev => ({
                    ...prev,
                    frequency: Math.round(pitchBufferRef.current.stableFreq || frequency),
                    note: noteInfo.note,
                    cents: noteInfo.cents,
                    volume: Math.round(rms * 100),
                    targetFrequency: noteInfo.frequency
                }));
            }
            lastUiUpdateRef.current = now;
        }

        rafIdRef.current = requestAnimationFrame(updateLoop);
    };

    return (
        <AudioContextState.Provider value={{
            isListening,
            startMic,
            stopListening,
            audioData,
            freqData,
            availableDevices,
            selectedDeviceId,
            setSelectedDeviceId,
            initAudio,
            inputGain,
            setInputGain,
            noiseGateThreshold,
            setNoiseGateThreshold,
            useCrepe,
            setUseCrepe
        }}>
            {children}
        </AudioContextState.Provider>
    );
}

export function useAudio() {
    return useContext(AudioContextState);
}
