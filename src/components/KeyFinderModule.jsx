import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Music, Search, Play, Pause, X, Wand2, Youtube, ExternalLink } from 'lucide-react';
import { useAudio } from '../audio/AudioContext';
import { searchSongs, getRandomSuggestions } from '../services/SongKeyService';
import { YouTubeService } from '../services/YouTubeService';
import ChordDiagram from './ChordDiagram';
import PianoChord from './PianoChord';
import { addChordsToSong, transposeProgression } from '../services/ChordService';
import { useFileAnalysis } from '../hooks/useFileAnalysis';
import { cn } from '../lib/utils';

// Components
import { PageContainer } from './layout/PageContainer';
import { Card, StatCard } from './ui/Card';
import { Button, IconButton } from './ui/Button';
import { Input, SearchInput, Select, Label } from './ui/Input';
import { Badge } from './ui/Badge';
import { BlurFade } from './ui/BlurFade';
import { BorderBeam } from './ui/BorderBeam';
import { Skeleton, SkeletonText } from './ui/Skeleton';

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
  'from-primary to-accent',
  'from-secondary to-info',
  'from-success to-secondary',
  'from-warning to-error',
  'from-accent to-primary',
  'from-info to-secondary',
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

const SmartCover = ({ song, size = 'md' }) => {
  const cacheKey = `cover_${song.artist}_${song.title}`;
  const [src, setSrc] = useState(() => localStorage.getItem(cacheKey) || song.cover);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-full aspect-square',
  };

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

  const bgGradient = useRef(getGradient(song.title + song.artist)).current;
  const initials = useRef(getInitials(song.title)).current;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-lg bg-surface-3 shrink-0 overflow-hidden',
        sizeClasses[size]
      )}
    >
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br flex items-center justify-center',
        bgGradient
      )}>
        {isQueued && !src && !hasError ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span className="text-white/40 font-bold text-xs select-none">
            {initials}
          </span>
        )}
      </div>
      {src && (
        <img
          src={src}
          alt={song.title}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setSrc(null);
            setIsLoaded(false);
            setHasError(true);
            localStorage.removeItem(cacheKey);
          }}
          loading="lazy"
        />
      )}
    </div>
  );
};

// --- SONG ITEM COMPONENT ---
const SongItem = ({ song, onClick, isSelected }) => (
  <motion.div
    layout
    onClick={onClick}
    className={cn(
      'flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200',
      'hover:bg-surface-3 border border-transparent',
      isSelected ? 'bg-surface-3 border-primary/30' : 'hover:border-border-subtle'
    )}
  >
    <SmartCover song={song} size="md" />
    <div className="flex-grow min-w-0">
      <h4 className={cn(
        'font-semibold truncate transition-colors',
        isSelected ? 'text-primary' : 'text-white'
      )}>
        {song.title}
      </h4>
      <p className="text-xs text-text-muted truncate">{song.artist}</p>
    </div>
    <Badge
      variant={song.key === 'Unknown' ? 'default' : 'secondary'}
      size="sm"
    >
      {song.key}
    </Badge>
  </motion.div>
);

// --- MAIN COMPONENT ---
export default function KeyFinderModule() {
  const { isListening, stopListening } = useAudio();

  // File Analysis Hook
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
  const [analysisDuration, setAnalysisDuration] = useState(0);

  const onFileSelect = (file) => {
    if (!file) return;
    stopListening();
    analyzeFile(file, analysisDuration);
  };

  const closeResults = () => {
    if (isPlaying) togglePlayback();
    clearResults();
  };

  // Song Modal State
  const [selectedSong, setSelectedSong] = useState(null);
  const [instrument, setInstrument] = useState('guitar');
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Reset transpose when song changes
  useEffect(() => {
    setTransposeSteps(0);
    if (selectedSong && selectedSong.chords && instrument === 'guitar') {
      const bestStep = calculateSmartCapoStep(selectedSong.chords);
      if (bestStep !== 0) setTransposeSteps(bestStep);
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

  // Initial Load
  useEffect(() => {
    let demoData = getRandomSuggestions().map(s => ({
      ...s, source: 'mock', isDemo: true
    }));
    if (selectedGenre !== 'All') {
      demoData = demoData.filter(song => song.genre === selectedGenre);
    }
    setSearchResults(demoData.slice(0, 100));
  }, [selectedGenre]);

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

  const genres = ['All', 'Pop', 'Rock', 'R&B', 'Ballad', 'Jazz'];

  // --- RENDER ---
  return (
    <>
      {/* SONG INFO MODAL */}
      <AnimatePresence>
        {selectedSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedSong(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full max-h-[85vh] overflow-y-auto rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Card variant="elevated" padding="lg" className="relative">
                {/* Close Button */}
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSong(null)}
                  className="absolute top-4 right-4 z-10"
                >
                  <X className="w-5 h-5" />
                </IconButton>

                {/* Cover Art */}
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-6 shadow-2xl ring-1 ring-white/10">
                  <SmartCover song={selectedSong} size="lg" />
                </div>

                {/* Song Info */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedSong.title}</h2>
                  <p className="text-text-secondary">{selectedSong.artist}</p>
                </div>

                {/* Key & BPM Badges */}
                <div className="flex justify-center gap-3 mb-6">
                  <Badge variant="secondary" size="lg">Key: {selectedSong.key}</Badge>
                  <Badge variant="primary" size="lg">BPM: {selectedSong.bpm}</Badge>
                </div>

                {/* Instrument Toggle */}
                <div className="flex bg-surface-3 rounded-xl p-1 mb-4">
                  <button
                    onClick={() => setInstrument('guitar')}
                    className={cn(
                      'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all',
                      instrument === 'guitar'
                        ? 'bg-secondary text-white shadow-lg'
                        : 'text-text-muted hover:text-white'
                    )}
                  >
                    🎸 Guitar
                  </button>
                  <button
                    onClick={() => setInstrument('piano')}
                    className={cn(
                      'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all',
                      instrument === 'piano'
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-text-muted hover:text-white'
                    )}
                  >
                    🎹 Piano
                  </button>
                </div>

                {/* Transpose Controls */}
                <div className="flex items-center justify-between bg-surface-3 p-3 rounded-xl mb-6">
                  <div className="flex items-center gap-3">
                    <IconButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setTransposeSteps(s => s - 1)}
                    >
                      -
                    </IconButton>
                    <div className="text-center min-w-[70px]">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">Transpose</div>
                      <div className={cn(
                        'font-bold text-lg',
                        transposeSteps !== 0 ? 'text-secondary' : 'text-white'
                      )}>
                        {transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps}
                      </div>
                    </div>
                    <IconButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setTransposeSteps(s => s + 1)}
                    >
                      +
                    </IconButton>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={findSmartCapo}
                    leftIcon={<Wand2 className="w-4 h-4" />}
                  >
                    Magic Capo
                  </Button>
                </div>

                {/* Chord Grid */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {currentChords.map((chord, index) => (
                    <div key={index + transposeSteps} className="bg-surface-3 rounded-lg p-1">
                      {instrument === 'guitar' ? (
                        <ChordDiagram chord={chord} />
                      ) : (
                        <PianoChord chord={chord} />
                      )}
                    </div>
                  ))}
                </div>

                {/* YouTube Button */}
                <Button
                  variant="danger"
                  size="lg"
                  className="w-full"
                  leftIcon={<Youtube className="w-5 h-5" />}
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                  onClick={async () => {
                    const url = await YouTubeService.getMostViewedVideo(selectedSong.title, selectedSong.artist);
                    window.open(url, '_blank');
                  }}
                >
                  Play on YouTube Music
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <PageContainer maxWidth="6xl" className="py-6 lg:py-8">
        {/* Header */}
        <BlurFade delay={0}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Key Finder</h1>
            <p className="text-text-secondary">
              Upload audio files or browse the song database
            </p>
          </div>
        </BlurFade>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Upload / Results */}
          <BlurFade delay={0.1}>
            <div className="h-[500px]">
              {/* Loading State */}
              {isAnalyzing ? (
                <Card variant="glass" padding="lg" className="h-full flex flex-col items-center justify-center text-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-surface-4" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-secondary border-l-transparent border-r-transparent border-b-transparent animate-spin" />
                    <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-info animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-info">
                    {analysisProgress || 'Analyzing...'}
                  </h3>
                </Card>
              ) : fileResult ? (
                /* Results State */
                <Card variant="glass" padding="lg" className="h-full flex flex-col relative overflow-hidden">
                  <BorderBeam size={250} duration={8} />

                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Analysis Result</h3>
                    <IconButton variant="ghost" size="sm" onClick={closeResults}>
                      <X className="w-5 h-5" />
                    </IconButton>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {/* Key Card */}
                    <div className="bg-gradient-to-br from-secondary/20 to-info/20 p-5 rounded-xl border border-secondary/30 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/20 rounded-full blur-2xl -mr-8 -mt-8" />
                      <div className="flex justify-between items-center z-10">
                        <span className="text-secondary text-[10px] uppercase font-bold tracking-wider">Key</span>
                        {fileResult.keyConfidence > 0 && (
                          <Badge
                            variant={fileResult.keyConfidence >= 70 ? 'success' : fileResult.keyConfidence >= 40 ? 'warning' : 'error'}
                            size="sm"
                          >
                            {fileResult.keyConfidence}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-4xl font-bold text-white z-10">{fileResult.key}</div>
                    </div>

                    {/* BPM Card */}
                    <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-5 rounded-xl border border-primary/30 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-full blur-2xl -mr-8 -mt-8" />
                      <span className="text-primary text-[10px] uppercase font-bold tracking-wider z-10">BPM</span>
                      <div className="text-4xl font-bold text-white z-10">{fileResult.bpm || '-'}</div>
                    </div>

                    {/* Vocal Range Card */}
                    <div className="col-span-2 bg-surface-3 p-4 rounded-xl border border-border-subtle">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1">Vocal Range</span>
                          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">{fileResult.range}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1">Voice Type</span>
                          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-info">{fileResult.voiceType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Playback Button */}
                  {audioBuffer && (
                    <Button
                      variant={isPlaying ? 'danger' : 'primary'}
                      size="lg"
                      onClick={togglePlayback}
                      leftIcon={isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      className="mt-6"
                    >
                      {isPlaying ? 'Stop Preview' : 'Play Preview'}
                    </Button>
                  )}
                </Card>
              ) : (
                /* Dropzone */
                <Card
                  variant="glass"
                  padding="lg"
                  className={cn(
                    'h-full flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200',
                    'border-2 border-dashed',
                    dragActive ? 'border-secondary bg-secondary/5' : 'border-border-subtle hover:border-border-default'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => { handleDrag(e); onFileSelect(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors',
                    dragActive ? 'bg-secondary/20' : 'bg-surface-3'
                  )}>
                    <Upload className={cn(
                      'w-8 h-8 transition-colors',
                      dragActive ? 'text-secondary' : 'text-text-muted'
                    )} />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">
                    Drop your audio file here
                  </h3>
                  <p className="text-text-muted text-sm mb-8">
                    Find Key, BPM & Vocal Range
                  </p>

                  {/* Duration Selector */}
                  <div className="mb-8" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-3">
                      Analysis Window
                    </span>
                    <div className="flex bg-surface-3 rounded-full p-1">
                      {[
                        { label: '30s', value: 30 },
                        { label: '60s', value: 60 },
                        { label: 'Full', value: 0 }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setAnalysisDuration(opt.value)}
                          className={cn(
                            'px-4 py-2 rounded-full text-xs font-semibold transition-all',
                            analysisDuration === opt.value
                              ? 'bg-secondary text-white shadow-lg'
                              : 'text-text-muted hover:text-white'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => onFileSelect(e.target.files[0])}
                    accept="audio/*,video/*"
                    className="hidden"
                  />

                  <Button
                    variant="secondary"
                    leftIcon={<Music className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Select File
                  </Button>
                </Card>
              )}
            </div>
          </BlurFade>

          {/* Right: Song Search */}
          <BlurFade delay={0.2}>
            <div className="flex flex-col h-[500px]">
              {/* Search Input */}
              <div className="mb-4">
                <SearchInput
                  placeholder="Search song database..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>

              {/* Song List */}
              <Card variant="default" padding="none" className="flex-1 overflow-hidden flex flex-col">
                {/* Genre Filters */}
                <div className="flex gap-2 p-3 border-b border-border-subtle overflow-x-auto">
                  {genres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                        selectedGenre === genre
                          ? 'bg-white text-surface-1'
                          : 'bg-surface-3 text-text-muted hover:bg-surface-4 hover:text-white'
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-2">
                  {isSearching ? (
                    <div className="space-y-3 p-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 p-3">
                          <Skeleton className="w-12 h-12 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <Music className="w-12 h-12 text-text-dim mb-4" />
                      <p className="text-text-muted">No songs found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map((song, idx) => (
                        <SongItem
                          key={song.id || idx}
                          song={song}
                          onClick={() => selectSong(song)}
                          isSelected={selectedSong?.id === song.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </BlurFade>
        </div>
      </PageContainer>
    </>
  );
}
