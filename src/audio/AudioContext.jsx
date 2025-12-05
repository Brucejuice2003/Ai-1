import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { autoCorrelate, getNoteFromFrequency } from './utils';
import { analyzeVoiceType } from './VoiceTypeAnalyzer';
import { KeyFinder } from './KeyFinder';

const AudioContextState = createContext(null);

export function AudioProvider({ children }) {
    const [isListening, setIsListening] = useState(false);
    const [sourceType, setSourceType] = useState('mic'); // 'mic' or 'file'
    const [audioData, setAudioData] = useState({
        frequency: 0,
        note: '-',
        cents: 0,
        voiceType: 'Silence',
        voiceTypeColor: 'text-gray-500',
        volume: 0,
        estimatedKey: '-'
    });

    const audioCtxRef = useRef(null);
    const analyzerRef = useRef(null);
    const sourceRef = useRef(null);
    const rafIdRef = useRef(null);
    const keyFinderRef = useRef(new KeyFinder());

    // For visualizer
    const [freqData, setFreqData] = useState(new Uint8Array(0));

    useEffect(() => {
        return () => stopListening();
    }, []);

    const startMic = async () => {
        if (audioCtxRef.current) await audioCtxRef.current.close();

        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyzerRef.current = audioCtxRef.current.createAnalyser();
        analyzerRef.current.fftSize = 2048;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyzerRef.current);
            setSourceType('mic');
            setIsListening(true);
            keyFinderRef.current.reset();
            updateLoop();
        } catch (err) {
            console.error("Microphone access denied", err);
        }
    };

    const handleFileUpload = async (file) => {
        stopListening();

        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyzerRef.current = audioCtxRef.current.createAnalyser();
        analyzerRef.current.fftSize = 2048;

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);

        sourceRef.current = audioCtxRef.current.createBufferSource();
        sourceRef.current.buffer = audioBuffer;
        sourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioCtxRef.current.destination); // Connect to speakers

        sourceRef.current.start(0);
        setSourceType('file');
        setIsListening(true);
        keyFinderRef.current.reset();

        sourceRef.current.onended = () => setIsListening(false);
        updateLoop();
    };

    const stopListening = () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) { /* ignore */ }
            sourceRef.current.disconnect();
        }
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        setIsListening(false);
    };

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
        const frequency = autoCorrelate(timeDomainData, audioCtxRef.current.sampleRate);

        let noteInfo = null;
        let voiceTypeData = { type: 'Silence', confidence: 0, color: 'text-gray-500' };

        // Calculate Volume (RMS)
        let rms = 0;
        for (let i = 0; i < timeDomainData.length; i++) rms += timeDomainData[i] * timeDomainData[i];
        rms = Math.sqrt(rms / timeDomainData.length);

        if (frequency !== -1 && rms > 0.01) {
            noteInfo = getNoteFromFrequency(frequency);
            if (noteInfo) {
                voiceTypeData = analyzeVoiceType(frequency, 'male'); // Default to male for now, make configurable later
                keyFinderRef.current.processNote(noteInfo.midi % 12);
            }
        }

        // Update Key Estimate every 60 frames (approx 1 sec) roughly, or just every frame (computationally cheap)
        const estimatedKey = keyFinderRef.current.estimateKey();

        setAudioData({
            frequency: frequency !== -1 ? Math.round(frequency) : 0,
            note: noteInfo ? noteInfo.name + noteInfo.octave : '-',
            cents: noteInfo ? noteInfo.cents : 0,
            voiceType: voiceTypeData.type,
            voiceTypeColor: voiceTypeData.color,
            volume: rms,
            estimatedKey: estimatedKey
        });

        rafIdRef.current = requestAnimationFrame(updateLoop);
    };

    return (
        <AudioContextState.Provider value={{
            isListening,
            startMic,
            stopListening,
            handleFileUpload,
            audioData,
            freqData,
            sourceType
        }}>
            {children}
        </AudioContextState.Provider>
    );
}

export const useAudio = () => useContext(AudioContextState);
