import { useAudio } from '../audio/AudioContext';
import Visualizer from './Visualizer';
import { Mic, Upload, Activity, Music } from 'lucide-react';
import { useRef } from 'react';

export default function Dashboard() {
    const { isListening, startMic, stopListening, handleFileUpload, audioData, freqData } = useAudio();
    const fileInputRef = useRef(null);

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background ambient light */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

            <header className="z-10 mb-12 text-center">
                <h1 className="text-5xl font-bold mb-2 neon-text tracking-tighter">VOCAL PITCH MONITOR</h1>
                <p className="text-gray-400">Professional Voice Analysis & Key Detection</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl z-10">
                {/* Main Pitch Display */}
                <div className="glass-panel p-8 flex flex-col items-center justify-center aspect-square md:aspect-auto neon-border transition-all duration-300">
                    <div className="text-center mb-6">
                        <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-2">Current Note</h2>
                        <div className={`text-9xl font-bold transition-colors duration-200 ${audioData.voiceTypeColor}`}>
                            {audioData.note}
                        </div>
                        <div className="mt-2 text-xl font-mono text-gray-300">
                            {audioData.frequency} Hz
                        </div>
                    </div>

                    {/* Cents deviation meter */}
                    <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4 relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
                        <div
                            className="h-full transition-all duration-100 ease-linear"
                            style={{
                                width: '10%',
                                backgroundColor: Math.abs(audioData.cents) < 10 ? '#00ff00' : audioData.cents < 0 ? '#3b82f6' : '#ef4444',
                                marginLeft: `${50 + (audioData.cents / 50) * 50}%`,
                                opacity: audioData.note === '-' ? 0 : 1
                            }}
                        ></div>
                    </div>
                    <span className="text-sm text-gray-400">{audioData.cents > 0 ? `+${audioData.cents}` : audioData.cents} cents</span>
                </div>

                {/* Info & Visualizer */}
                <div className="flex flex-col gap-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="glass-panel p-6 flex flex-col items-center justify-center">
                            <Activity className="w-8 h-8 mb-2 text-purple-400" />
                            <span className="text-gray-400 text-sm uppercase">Voice Type</span>
                            <span className={`text-2xl font-bold mt-1 ${audioData.voiceTypeColor}`}>{audioData.voiceType}</span>
                        </div>
                        <div className="glass-panel p-6 flex flex-col items-center justify-center">
                            <Music className="w-8 h-8 mb-2 text-cyan-400" />
                            <span className="text-gray-400 text-sm uppercase">Detailed Key</span>
                            <span className="text-2xl font-bold mt-1 text-cyan-400">{audioData.estimatedKey}</span>
                        </div>
                    </div>

                    {/* Visualizer Area */}
                    <div className="glass-panel flex-grow p-4 min-h-[200px] relative">
                        <Visualizer data={freqData} />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="z-10 mt-12 flex gap-6">
                <button
                    onClick={isListening ? stopListening : startMic}
                    className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 
                    ${isListening ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 hover:bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.5)]'}`}
                >
                    <Mic className="w-6 h-6" />
                    {isListening ? "Stop Listening" : "Start Mic"}
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 border border-gray-600"
                >
                    <Upload className="w-6 h-6" />
                    Upload File
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="audio/*,video/*"
                    onChange={(e) => {
                        if (e.target.files[0]) handleFileUpload(e.target.files[0]);
                    }}
                />
            </div>
        </div>
    )
}
