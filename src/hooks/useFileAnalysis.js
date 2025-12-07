import { useState, useRef, useCallback } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { detectBPM } from '../audio/utils';

export function useFileAnalysis() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(''); // 'Decoding', 'Analyzing', 'Finalizing'
    const [error, setError] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [audioBuffer, setAudioBuffer] = useState(null); // Store for playback

    const analyzeFile = useCallback(async (file, duration = 0) => {
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);
        setAudioBuffer(null);

        try {
            // 1. Decode Audio (Offline)
            setProgress('Decoding Audio...');
            const arrayBuffer = await file.arrayBuffer();
            const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
                2,              // Channels
                44100 * 1,      // Length (dummy, will be resizing or just for decoding)
                44100           // Sample Rate
            );

            // Note: decodeAudioData doesn't strictly need an OfflineContext context but using a standard one 
            // is fine. Usually new AudioContext() is better for decodeAudioData compatibility 
            // but we want to avoid "running" hardware.
            // Actually, we can just use a temporary standard AudioContext for decoding if Offline is tricky.
            // Let's use a temporary AudioContext and close it immediately.
            const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
            const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
            await tempCtx.close();

            setAudioBuffer(decodedBuffer);

            // Slice buffer if duration is specified
            let processingBuffer = decodedBuffer;
            if (duration > 0 && duration < decodedBuffer.duration) {
                const length = Math.floor(duration * decodedBuffer.sampleRate);
                const sliced = new AudioBuffer({
                    length: length,
                    numberOfChannels: decodedBuffer.numberOfChannels,
                    sampleRate: decodedBuffer.sampleRate
                });
                for (let c = 0; c < decodedBuffer.numberOfChannels; c++) {
                    sliced.copyToChannel(decodedBuffer.getChannelData(c).slice(0, length), c);
                }
                processingBuffer = sliced;
            }

            // 2. Analyze (CPU Intensive)
            setProgress('Analyzing Pitch & Timbre...');
            // Allow UI to update before blocking main thread
            await new Promise(r => setTimeout(r, 50));

            const engine = new AudioEngine();
            const result = await engine.analyze(processingBuffer);

            // 3. BPM (Async)
            setProgress('Detecting Tempo...');
            const bpm = await detectBPM(processingBuffer);

            // 4. Finalize
            setAnalysisResult({
                ...result,
                bpm,
                fileName: file.name
            });

        } catch (err) {
            console.error("Analysis Failed:", err);
            setError("Could not analyze file. It might be corrupted or an unsupported format.");
        } finally {
            setIsAnalyzing(false);
            setProgress('');
        }
    }, []);

    const clearResults = useCallback(() => {
        setAnalysisResult(null);
        setError(null);
        setAudioBuffer(null);
    }, []);

    return {
        analyzeFile,
        clearResults,
        isAnalyzing,
        progress,
        error,
        result: analysisResult,
        audioBuffer
    };
}
