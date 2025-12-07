import { useState, useRef, useEffect } from 'react';
import { Upload, Music, Search, AlertCircle, Play, Check, Settings, LogIn, Youtube, Lock, X, Wand2 } from 'lucide-react';
import { useAudio } from '../audio/AudioContext';
import { searchSongs, getRandomSuggestions } from '../services/SongKeyService';
import { YouTubeService } from '../services/YouTubeService';
import ChordDiagram from './ChordDiagram';
import PianoChord from './PianoChord';
import { addChordsToSong, transposeProgression } from '../services/ChordService';
import { useFileAnalysis } from '../hooks/useFileAnalysis';

// --- SMART COVER COMPONENT ---
const coverQueue = [];
let queueProcessing = false;

const processQueue = async () => {
    if (queueProcessing) return;
    queueProcessing = true;

    while (coverQueue.length > 0) {
        const task = coverQueue.pop();
        await task.run();
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    queueProcessing = false;
};

const enqueueCoverFetch = (task) => {
    coverQueue.push(task);
    processQueue();
};

const gradients = [
    'from-pink-500 to-rose-600',
    'from-purple-600 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-fuchsia-600 to-purple-600',
    'from-blue-600 to-indigo-700'
];

const getGradient = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
};

const getInitials = (title) => {
    return title
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
};

const SmartCover = ({ song }) => {
    const cacheKey = `cover_${song.artist}_${song.title}`;
    const [src, setSrc] = useState(() => {
        return localStorage.getItem(cacheKey) || song.cover;
    });

    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isQueued, setIsQueued] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const containerRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isVisible && song.isDemo && !src && !hasError && !isQueued) {
            setIsQueued(true);
            enqueueCoverFetch({
                run: async () => {
                    if (localStorage.getItem(cacheKey)) return;
                    try {
                        let artwork = null;
                        try {
                            artwork = await YouTubeService.getCoverArt(song.title, song.artist);
                        } catch (ytErr) {
                            console.warn('YouTube cover fetch failed, using iTunes fallback');
                        }

                        if (!artwork) {
                            const cleanArtist = song.artist.replace(/\s(ft\.|feat\.\|&).*$/i, '');
                            const term = encodeURIComponent(`${song.title} ${cleanArtist}`);
                            const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=10`);
                            const data = await res.json();
                            if (data.resultCount > 0) {
                                const match = data.results.find(item =>
                                    item.trackName.toLowerCase().includes(song.title.toLowerCase()) ||
                                    song.title.toLowerCase().includes(item.trackName.toLowerCase())
                                );
                                if (match) {
                                    artwork = match.artworkUrl100?.replace('100x100', '300x300') || match.artworkUrl100;
                                }
                            }
                        }

                        if (artwork) {
                            setSrc(artwork);
                            localStorage.setItem(cacheKey, artwork);
                            setRetryCount(0);
                        } else {
                            setHasError(true);
                        }
                    } catch (e) {
                        setHasError(true);
                    }
                }
            });
        }
    }, [isVisible, song, src, hasError, isQueued, cacheKey]);

    useEffect(() => {
        if (hasError && retryCount < 3) {
            const delay = Math.pow(2, retryCount + 1) * 1000;
            retryTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setHasError(false);
                setIsQueued(false);
            }, delay);
        }
        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, [hasError, retryCount]);

    const handleRetry = (e) => {
        e.stopPropagation();
        setHasError(false);
        setIsQueued(false);
    };

    const bgGradient = useRef(getGradient(song.title + song.artist)).current;
    const initials = useRef(getInitials(song.title)).current;

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-square rounded bg-gray-800 shrink-0 overflow-hidden group cursor-pointer"
            onClick={!src ? handleRetry : undefined}
            title={!src ? "Click to retry loading cover" : ""}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} flex items-center justify-center`}>
                {isQueued && !src && !hasError ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <span className="text-white/40 font-black text-xs tracking-tighter transform -rotate-6 select-none overlay-text">
                        {initials}
                    </span>
                )}
            </div>
            {src && (
                <img
                    src={src}
                    alt={song.title}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => {
                        setSrc(null);
                        setIsLoaded(false);
                        setHasError(true);
                        localStorage.removeItem(cacheKey);
                    }}
                    loading="eager"
                />
            )}
            {!src && !isQueued && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity z-10">
                    <p className="text-[8px] text-white font-bold uppercase tracking-wider">Retry</p>
                </div>
            )}
        </div>
    );
};

export default function KeyFinderModule() {
    const { isListening, stopListening } = useAudio();

    // Independent File Analysis Hook
    const {
        analyzeFile,
        result: fileResult,
        isAnalyzing,
        progress: analysisProgress,
        audioBuffer,
        clearResults
    } = useFileAnalysis();

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const playbackSourceRef = useRef(null);
    const playbackCtxRef = useRef(null);

    // Toggle Playback for the uploaded file
    const togglePlayback = async () => {
        if (isPlaying) {
            if (playbackSourceRef.current) {
                playbackSourceRef.current.stop();
                playbackSourceRef.current = null;
            }
            setIsPlaying(false);
        } else {
            if (!audioBuffer) return;
            if (!playbackCtxRef.current) {
                playbackCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (playbackCtxRef.current.state === 'suspended') {
                await playbackCtxRef.current.resume();
            }

            const source = playbackCtxRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(playbackCtxRef.current.destination);
            source.start(0);
            playbackSourceRef.current = source;
            setIsPlaying(true);

            source.onended = () => setIsPlaying(false);
        }
    };

    useEffect(() => {
        return () => {
            if (playbackSourceRef.current) {
                try { playbackSourceRef.current.stop(); } catch (e) { }
            }
            if (playbackCtxRef.current) {
                playbackCtxRef.current.close();
            }
        };
    }, []);

    // Local UI State
    const [dragActive, setDragActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const fileInputRef = useRef(null);

    const onFileSelect = (file) => {
        if (!file) return;
        stopListening();
        analyzeFile(file, analysisDuration);
    };

    const closeResults = () => {
        if (isPlaying) togglePlayback();
        clearResults();
    };

    // Settings
    const [showSettings, setShowSettings] = useState(false);
    const [youtubeApiKey, setYoutubeApiKey] = useState(localStorage.getItem("youtube_api_key") || "");
    const [selectedSong, setSelectedSong] = useState(null);
    const [instrument, setInstrument] = useState('guitar');
    const [transposeSteps, setTransposeSteps] = useState(0);
    const [analysisDuration, setAnalysisDuration] = useState(0); // 0 = Full, 30, 60

    // Reset transpose when song changes & Auto-Smart Capo
    useEffect(() => {
        setTransposeSteps(0);
        if (selectedSong && selectedSong.chords && instrument === 'guitar') {
            const bestStep = calculateSmartCapoStep(selectedSong.chords);
            if (bestStep !== 0) {
                setTransposeSteps(bestStep);
            }
        }
    }, [selectedSong, instrument]);

    const calculateSmartCapoStep = (chords) => {
        const openRoots = ['C', 'G', 'D', 'A', 'E'];
        for (let i = -5; i <= 6; i++) {
            const testChords = transposeProgression(chords, i);
            if (!testChords[0]) continue;
            const firstChordRoot = testChords[0].replace(/m|dim|aug|7|sus.*/, '');
            if (openRoots.includes(firstChordRoot)) return i;
        }
        return 0;
    };

    const findSmartCapo = () => {
        if (!selectedSong || !selectedSong.chords) return;
        const bestStep = calculateSmartCapoStep(selectedSong.chords);
        setTransposeSteps(bestStep);
    };

    const currentChords = selectedSong ? transposeProgression(selectedSong.chords, transposeSteps) : [];
    const [selectedGenre, setSelectedGenre] = useState('All');

    // Initial Load - Reference List
    useEffect(() => {
        let demoData = getRandomSuggestions().map(s => ({
            ...s, source: 'mock', isDemo: true
        }));
        if (selectedGenre !== 'All') {
            demoData = demoData.filter(song => song.genre === selectedGenre);
        }
        setSearchResults(demoData.slice(0, 100));
    }, [selectedGenre]);

    useEffect(() => {
        if (youtubeApiKey) localStorage.setItem("youtube_api_key", youtubeApiKey);
    }, [youtubeApiKey]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length === 0) {
            const demoData = getRandomSuggestions().map(s => ({ ...s, source: 'mock', isDemo: true }));
            setSearchResults(demoData);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            const localResults = await searchSongs(query);
            const formattedLocal = localResults.map(s => ({ ...s, source: 'mock', isDemo: true }));
            let globalResults = [];
            if (query.length > 2) {
                try {
                    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`);
                    const data = await res.json();
                    globalResults = data.results.map(item => ({
                        id: item.trackId,
                        title: item.trackName,
                        artist: item.artistName,
                        cover: item.artworkUrl100?.replace('100x100', '300x300'),
                        key: "Unknown", bpm: "-", source: 'itunes', isDemo: false
                    }));
                } catch (apiErr) { console.warn("iTunes search failed", apiErr); }
            }
            const localTitles = new Set(formattedLocal.map(s => s.title.toLowerCase()));
            const uniqueGlobal = globalResults.filter(s => !localTitles.has(s.title.toLowerCase()));
            setSearchResults([...formattedLocal, ...uniqueGlobal]);
        } catch (err) { console.error(err); }
        finally { setIsSearching(false); }
    };

    const selectSong = async (song) => {
        const songWithChords = addChordsToSong(song);
        setSelectedSong(songWithChords);
    };

    // --- RENDER ---
    return (
        <>
            {/* SONG INFO MODAL */}
            {selectedSong && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4" onClick={() => setSelectedSong(null)}>
                    <div className="relative max-w-md w-full max-h-[85vh] overflow-y-auto custom-scrollbar rounded-3xl" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedSong(null)} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all backdrop-blur-md">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="glass-panel p-6 space-y-4 animate-scale-in">
                            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20">
                                <div className="w-full h-full"><SmartCover song={selectedSong} /></div>
                            </div>
                            <div className="text-center space-y-1">
                                <h2 className="text-2xl font-black text-white">{selectedSong.title}</h2>
                                <p className="text-sm text-gray-300">{selectedSong.artist}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex bg-white/5 rounded-lg p-1">
                                <button onClick={() => setInstrument('guitar')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${instrument === 'guitar' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>🎸 Guitar</button>
                                <button onClick={() => setInstrument('piano')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${instrument === 'piano' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>🎹 Piano</button>
                            </div>
                            {/* Transpose */}
                            <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setTransposeSteps(s => s - 1)} className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 font-bold">-</button>
                                    <div className="text-center min-w-[60px]">
                                        <div className="text-xs text-gray-400 uppercase">Transpose</div>
                                        <div className={`font-bold ${transposeSteps !== 0 ? 'text-neon-blue' : 'text-white'}`}>{transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps}</div>
                                    </div>
                                    <button onClick={() => setTransposeSteps(s => s + 1)} className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 font-bold">+</button>
                                </div>
                                <button onClick={findSmartCapo} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-xs font-bold transition-all flex items-center gap-2">✨ Magic Capo</button>
                            </div>
                            {/* Chords */}
                            <div className="grid grid-cols-4 gap-2">
                                {currentChords.map((chord, index) => (
                                    <div key={index + transposeSteps}>
                                        {instrument === 'guitar' ? <ChordDiagram chord={chord} /> : <PianoChord chord={chord} />}
                                    </div>
                                ))}
                            </div>
                            <button onClick={async () => {
                                const url = await YouTubeService.getMostViewedVideo(selectedSong.title, selectedSong.artist);
                                window.open(url, '_blank');
                            }} className="block w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg text-center cursor-pointer">
                                🎵 Play on YouTube Music
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto px-4 pt-24 pb-32 md:p-6 md:pt-28 z-10 animate-fade-in">
                <h2 className="text-4xl font-bold mb-8 neon-text">Top Songs</h2>

                {/* SETTINGS TOGGLE */}
                <div className="w-full flex justify-end items-center mb-4">
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
                {/* SETTINGS PANEL */}
                {showSettings && (
                    <div className="w-full mb-6 glass-panel p-4 animate-fade-in">
                        <h3 className="text-lg font-bold mb-4 text-gray-200">Settings</h3>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">YouTube Data API Key</label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <span className="absolute left-3 top-2.5 text-gray-500"><Youtube className="w-4 h-4" /></span>
                                    <input type="password" value={youtubeApiKey} onChange={(e) => setYoutubeApiKey(e.target.value)} placeholder="Enter API Key" className="w-full bg-black/50 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors" />
                                </div>
                                <button onClick={() => { localStorage.setItem("youtube_api_key", youtubeApiKey); setShowSettings(false); }} className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue px-4 py-2 rounded-lg font-bold transition-colors">Save</button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Required for high-quality cover art.</p>
                        </div>
                    </div>
                )}

                {/* MAIN SEARCH & RESULTS AREA */}
                <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-start justify-center">

                    {/* LEFT: RESULTS or DROPZONE */}
                    <div className="w-full max-w-md mx-auto aspect-video relative group perspective">
                        {/* 1. LOADING STATE */}
                        {isAnalyzing ? (
                            <div className="w-full h-full glass-panel flex flex-col items-center justify-center text-center p-10">
                                <div className="relative w-20 h-20 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent border-r-transparent border-b-cyan-500 animate-spin"></div>
                                    <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 animate-pulse"></div>
                                </div>
                                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse">
                                    {analysisProgress || 'Analyzing...'}
                                </h3>
                            </div>
                        ) : fileResult ? (
                            /* 2. RESULTS STATE */
                            <div className="w-full h-auto min-h-full glass-panel flex flex-col items-center p-6 pb-8 relative animate-fade-in border-neon-blue/20 border justify-between">
                                {/* Header with Close Button */}
                                <div className="w-full flex justify-between items-start mb-6">
                                    <h3 className="text-lg font-bold text-white/90">Result</h3>
                                    <button onClick={closeResults} className="p-2 -mr-2 -mt-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Close"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                    {/* Key Card */}
                                    <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-5 rounded-2xl border border-cyan-500/30 shadow-lg shadow-cyan-900/20 backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between h-32 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-400/10 rounded-full blur-xl -mr-10 -mt-10"></div>
                                        <div className="text-cyan-400 text-[10px] uppercase font-bold tracking-wider z-10">Key</div>
                                        <div className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] z-10 tracking-tight">{fileResult.key}</div>
                                    </div>

                                    {/* BPM Card */}
                                    <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-5 rounded-2xl border border-purple-500/30 shadow-lg shadow-purple-900/20 backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between h-32 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/10 rounded-full blur-xl -mr-10 -mt-10"></div>
                                        <div className="text-purple-400 text-[10px] uppercase font-bold tracking-wider z-10">BPM</div>
                                        <div className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(192,132,252,0.6)] z-10 tracking-tight">{fileResult.bpm || '-'}</div>
                                    </div>

                                    {/* Range Card */}
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 col-span-2 relative overflow-hidden group hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Vocal Range</div>
                                                <div className="text-2xl font-bold text-pink-300 bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-rose-300">{fileResult.range}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Voice Type</div>
                                                <div className="text-2xl font-bold text-cyan-300 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">{fileResult.voiceType}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Play Preview Player Bar */}
                                {audioBuffer && (
                                    <div className="w-full mt-auto">
                                        <button
                                            onClick={togglePlayback}
                                            className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${isPlaying ? 'bg-gradient-to-r from-red-500/20 to-pink-600/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' : 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'}`}
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                            {isPlaying ? 'STOP PREVIEW' : 'PLAY PREVIEW'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* 3. IDLE / DROPZONE */
                            <div
                                className={`w-full h-full glass-panel flex flex-col items-center justify-center text-center p-10 relative overflow-hidden transition-all duration-200 border-2 border-dashed ${dragActive ? 'border-neon-blue bg-white/5' : 'border-white/10'}`}
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag}
                                onDrop={(e) => { handleDrag(e); onFileSelect(e.dataTransfer.files[0]); }}
                            >
                                <Upload className={`w-12 h-12 mb-4 ${dragActive ? 'text-neon-blue' : 'text-gray-600'}`} />
                                <p className="text-gray-500 mt-2 mb-6 text-sm">Find Key, BPM & Range</p>

                                {/* Duration Selector */}
                                <div className="mb-8 flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Analysis Window</span>
                                    <div className="flex bg-black/40 rounded-full p-1 border border-white/5 backdrop-blur-md">
                                        {[
                                            { label: '30s', value: 30 },
                                            { label: '60s', value: 60 },
                                            { label: 'Full Song', value: 0 }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setAnalysisDuration(opt.value); }}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${analysisDuration === opt.value ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <input type="file" ref={fileInputRef} onChange={(e) => onFileSelect(e.target.files[0])} accept="audio/*,video/*" className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current.click()} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 text-sm">
                                    <Music className="w-4 h-4" /> Select File
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: SONG SEARCH LIST */}
                    <div className="w-full md:w-1/2 flex flex-col h-[500px]">
                        <div className="search-bar-container mb-4 relative z-20">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Search className="h-5 w-5" /></div>
                            <input type="text" className="search-input pl-10" placeholder="Search song database..." value={searchQuery} onChange={handleSearch} />
                        </div>
                        <div className="flex-1 glass-panel overflow-hidden flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                {/* Genre Filters */}
                                {!isSearching && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                                        {['All', 'Pop', 'Rock', 'R&B', 'Ballad', 'Jazz'].map(genre => (
                                            <button key={genre} onClick={() => setSelectedGenre(genre)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedGenre === genre ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                                                {genre}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {searchResults.map((song, idx) => (
                                        <div key={song.id || idx} onClick={() => selectSong(song)} className="flex items-center p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer group border border-transparent hover:border-white/10 hover:shadow-lg hover:scale-[1.01] duration-200">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden relative shadow-lg mr-4 group-hover:shadow-cyan-500/20 transition-all">
                                                <SmartCover song={song} />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h4 className="font-bold text-white truncate group-hover:text-cyan-300 transition-colors">{song.title}</h4>
                                                <p className="text-xs text-gray-400 truncate group-hover:text-gray-300">{song.artist}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${song.key === 'Unknown' ? 'bg-gray-800 text-gray-500' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>{song.key}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
