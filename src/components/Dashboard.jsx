import { useAudio } from '../audio/AudioContext';
import { motion } from 'framer-motion';
import { Mic, MicOff, Activity, Music, Waves, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

// Components
import Visualizer from './Visualizer';
import VibratoGraph from './VibratoGraph';
import { PageContainer, PageHeader } from './layout/PageContainer';
import { Card, StatCard } from './ui/Card';
import { Button, IconButton } from './ui/Button';
import { Badge, LiveBadge } from './ui/Badge';
import { BlurFade } from './ui/BlurFade';
import { BorderBeam } from './ui/BorderBeam';
import { NumberTicker } from './ui/NumberTicker';
import { Select, Label } from './ui/Input';

export default function Dashboard() {
  const {
    isListening,
    startMic,
    stopListening,
    audioData,
    freqData,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    inputGain,
    setInputGain,
    noiseGateThreshold,
    setNoiseGateThreshold
  } = useAudio();

  const [showSettings, setShowSettings] = useState(false);

  // Calculate cents indicator position and color
  const centsPosition = 50 + (audioData.cents / 50) * 50;
  const centsColor =
    Math.abs(audioData.cents) < 10
      ? 'bg-success'
      : audioData.cents < 0
        ? 'bg-info'
        : 'bg-error';

  const isActive = audioData.note !== '-' && audioData.frequency > 50;

  return (
    <PageContainer maxWidth="6xl" className="py-6 lg:py-8">
      {/* Header */}
      <BlurFade delay={0}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">Live Analysis</h1>
              {isListening && <LiveBadge />}
            </div>
            <p className="text-text-secondary">
              Real-time pitch detection and voice analysis
            </p>
          </div>
          <IconButton
            variant="secondary"
            onClick={() => setShowSettings(!showSettings)}
            className={showSettings ? 'bg-surface-4' : ''}
          >
            <Settings2 className="w-5 h-5" />
          </IconButton>
        </div>
      </BlurFade>

      {/* Settings Panel (Collapsible) */}
      <motion.div
        initial={false}
        animate={{ height: showSettings ? 'auto' : 0, opacity: showSettings ? 1 : 0 }}
        className="overflow-hidden"
      >
        <BlurFade delay={0.1}>
          <Card variant="default" padding="md" className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Device Selector */}
              <div>
                <Label>Input Device</Label>
                <Select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    if (isListening) stopListening();
                  }}
                >
                  <option value="default">Default Microphone</option>
                  {availableDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Mic ${device.deviceId.slice(0, 5)}...`}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Gain Control */}
              <div>
                <Label className="flex justify-between">
                  <span>Input Gain</span>
                  <span className="text-secondary font-mono">{inputGain.toFixed(1)}x</span>
                </Label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={inputGain}
                  onChange={(e) => setInputGain(parseFloat(e.target.value))}
                  className="w-full h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-secondary mt-2"
                />
              </div>

              {/* Noise Gate Control */}
              <div>
                <Label className="flex justify-between">
                  <span>Noise Gate</span>
                  <span className="text-error font-mono">{noiseGateThreshold.toFixed(3)}</span>
                </Label>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.001"
                  value={noiseGateThreshold}
                  onChange={(e) => setNoiseGateThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-error mt-2"
                />
              </div>
            </div>
          </Card>
        </BlurFade>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pitch Display Card */}
        <BlurFade delay={0.1}>
          <Card
            variant="glass"
            padding="lg"
            className="relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]"
          >
            {/* Border beam effect when active */}
            {isActive && <BorderBeam size={400} duration={8} />}

            {/* Note Display */}
            <div className="text-center mb-8">
              <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-3">
                Current Note
              </p>
              <motion.div
                key={audioData.note}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  'text-8xl lg:text-9xl font-bold tracking-tight',
                  isActive ? audioData.voiceTypeColor : 'text-text-dim'
                )}
              >
                {audioData.note}
              </motion.div>
              <div className="mt-3 text-xl font-mono text-text-secondary">
                {isActive ? (
                  <>
                    <NumberTicker value={audioData.frequency} decimalPlaces={1} className="text-white" />
                    <span className="text-text-muted ml-1">Hz</span>
                  </>
                ) : (
                  <span className="text-text-dim">-- Hz</span>
                )}
              </div>
            </div>

            {/* Cents Deviation Meter */}
            <div className="w-full max-w-xs">
              <div className="relative h-2 bg-surface-3 rounded-full overflow-hidden">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 z-10 -translate-x-1/2" />
                {/* Indicator */}
                {isActive && (
                  <motion.div
                    className={cn('h-full w-3 rounded-full', centsColor)}
                    initial={{ left: '50%' }}
                    animate={{ left: `${centsPosition}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ position: 'absolute', transform: 'translateX(-50%)' }}
                  />
                )}
              </div>

              {/* Scale markers */}
              <div className="flex justify-between mt-2 text-xs text-text-dim font-mono">
                <span>-50</span>
                <span>-25</span>
                <span className="text-text-secondary">0</span>
                <span>+25</span>
                <span>+50</span>
              </div>

              {/* Cents value */}
              <p className="text-center mt-3 text-sm text-text-secondary">
                {isActive ? (
                  <span className={cn(
                    Math.abs(audioData.cents) < 10 ? 'text-success' :
                      audioData.cents < 0 ? 'text-info' : 'text-error'
                  )}>
                    {audioData.cents > 0 ? '+' : ''}{audioData.cents} cents
                  </span>
                ) : (
                  <span className="text-text-dim">-- cents</span>
                )}
              </p>
            </div>
          </Card>
        </BlurFade>

        {/* Stats & Visualizers Column */}
        <div className="flex flex-col gap-6">
          {/* Stats Grid */}
          <BlurFade delay={0.2}>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Voice Type"
                value={isActive ? audioData.voiceType : '--'}
                icon={<Activity className="w-5 h-5" />}
                className={cn(isActive && 'border-primary/30')}
              />
              <StatCard
                label="Estimated Key"
                value={isActive ? audioData.estimatedKey : '--'}
                icon={<Music className="w-5 h-5" />}
                className={cn(isActive && 'border-secondary/30')}
              />
            </div>
          </BlurFade>

          {/* Vibrato Meter */}
          <BlurFade delay={0.3}>
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-1">
                    Vibrato
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      'text-3xl font-bold',
                      audioData.vibrato?.isVibrato ? 'text-success' : 'text-text-dim'
                    )}>
                      {audioData.vibrato?.isVibrato ? audioData.vibrato.rate : '--'}
                    </span>
                    <span className="text-text-muted">Hz</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-text-muted">
                      Depth: {audioData.vibrato?.isVibrato ? `${audioData.vibrato.depth} cents` : '--'}
                    </span>
                    {audioData.vibrato?.isVibrato && (
                      <Badge
                        variant={
                          audioData.vibrato.quality === 'Excellent' ? 'success' :
                            audioData.vibrato.quality === 'Good' ? 'primary' : 'warning'
                        }
                        size="sm"
                      >
                        {audioData.vibrato.quality}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Vibrato Graph */}
                <div className="w-48 h-16 rounded-lg overflow-hidden bg-surface-2 border border-border-subtle">
                  <VibratoGraph
                    pitch={audioData.exactMidi}
                    isActive={audioData.frequency > 50}
                  />
                </div>
              </div>
            </Card>
          </BlurFade>

          {/* Frequency Visualizer */}
          <BlurFade delay={0.4}>
            <Card variant="default" padding="sm" className="flex-1 min-h-[180px]">
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-muted">Frequency Spectrum</span>
                </div>
              </div>
              <div className="h-[140px] rounded-lg overflow-hidden">
                <Visualizer data={freqData} />
              </div>
            </Card>
          </BlurFade>
        </div>
      </div>

      {/* Start/Stop Button */}
      <BlurFade delay={0.5}>
        <div className="flex justify-center mt-8">
          <Button
            variant={isListening ? 'danger' : 'primary'}
            size="lg"
            onClick={isListening ? stopListening : startMic}
            leftIcon={isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            className={cn(
              'px-8 py-6 text-lg',
              isListening
                ? 'bg-gradient-to-r from-error to-accent shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                : 'shadow-[0_0_30px_rgba(188,19,254,0.4)]'
            )}
          >
            {isListening ? 'Stop Listening' : 'Start Microphone'}
          </Button>
        </div>
      </BlurFade>

      {/* Footer hint */}
      <BlurFade delay={0.6}>
        <p className="text-center text-text-dim text-sm mt-6">
          {isListening
            ? 'Listening... Sing or play an instrument to see analysis'
            : 'Click the button above to start real-time pitch detection'}
        </p>
      </BlurFade>
    </PageContainer>
  );
}
