import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { Play, Pause, Maximize, Volume2, VolumeX, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function Player({ channel }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const controlsTimer = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolumeBar, setShowVolumeBar] = useState(false);
  const [streamType, setStreamType] = useState('');

  useEffect(() => {
    if (!channel || !videoRef.current) return;
    setIsLoading(true);
    setLoadingProgress(0);
    setHasError(false);
    setIsPlaying(false);
    
    let hlsInstance = null;
    let tsInstance = null;
    
    // Watchdog to check if channel is dead (Triggers error if no data in 6 seconds)
    const deadChannelCheck = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 3 && !hasError) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 6000);

    const url = channel.url.toLowerCase();
    const isTS = url.includes('.ts') || url.includes('mpegts');
    setStreamType(isTS ? 'MPEG-TS' : 'HLS');

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => (prev < 95 ? prev + Math.random() * 10 : prev));
    }, 400);

    if (isTS && mpegts.getFeatureList().mseLivePlayback) {
      tsInstance = mpegts.createPlayer({ type: 'mse', isLive: true, url: channel.url, hasVideo: true, hasAudio: true }, {
        enableWorker: true, enableStashBuffer: true, stashInitialSize: 1024 * 1024 * 8, lazyLoad: false
      });
      tsInstance.attachMediaElement(videoRef.current);
      tsInstance.load();
      tsInstance.play().then(() => { clearTimeout(deadChannelCheck); finishLoading(); }).catch(() => setHasError(true));
      tsInstance.on(mpegts.Events.ERROR, () => setHasError(true));
      engineRef.current = tsInstance;
    } else if (Hls.isSupported()) {
      hlsInstance = new Hls({ 
        enableWorker: true, 
        maxBufferSize: 250 * 1024 * 1024,
        // Shortened timeouts for faster dead-channel detection
        manifestLoadingTimeOut: 5000,
        manifestLoadingMaxRetry: 1,
        levelLoadingTimeOut: 5000,
        levelLoadingMaxRetry: 1,
        fragLoadingTimeOut: 5000,
        fragLoadingMaxRetry: 1
      });
      hlsInstance.loadSource(channel.url);
      hlsInstance.attachMedia(videoRef.current);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play().then(() => { clearTimeout(deadChannelCheck); finishLoading(); }).catch(() => setHasError(true));
      });
      hlsInstance.on(Hls.Events.ERROR, (event, data) => { if (data.fatal) setHasError(true); });
      engineRef.current = hlsInstance;
    }

    function finishLoading() {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => { setIsLoading(false); setIsPlaying(true); }, 500);
    }

    return () => {
      clearTimeout(deadChannelCheck);
      clearInterval(progressInterval);
      if (hlsInstance) hlsInstance.destroy();
      if (tsInstance) { tsInstance.unload(); tsInstance.destroy(); }
    };
  }, [channel]);

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
      setShowVolumeBar(false);
    }, 2000);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  if (!channel) return (
    <div className="aspect-video w-full bg-[#0B1220] rounded-[2.5rem] flex flex-col items-center justify-center border border-white/5">
      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse border border-amber-500/20 text-amber-500 text-2xl">🏆</div>
      <h3 className="text-white font-black text-sm uppercase tracking-widest italic">Satellite Standby</h3>
    </div>
  );

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] border border-white/10 cursor-none" 
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
    >
      <video ref={videoRef} className="w-full h-full object-contain" playsInline onClick={() => setIsPlaying(!isPlaying)} />

      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#060B15] z-20 px-12 cursor-default">
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-24 h-24 border-2 border-amber-500/10 rounded-full animate-ping" />
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
          
          <div className="w-full max-w-xs">
            <div className="flex justify-between items-end mb-2">
               <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Syncing 4K Satellite...</span>
               <span className="text-[10px] font-black text-amber-500">{Math.round(loadingProgress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
               <div className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]" style={{ width: `${loadingProgress}%` }} />
            </div>
          </div>
          <p className="text-slate-500 text-[8px] mt-6 uppercase tracking-[0.4em] italic font-bold">Establishing Satellite Link</p>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 px-6 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <AlertCircle className="text-red-500 w-8 h-8" />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-tighter">Broadcast Failed to Load</h3>
          <p className="text-slate-400 text-[10px] mt-2 leading-relaxed max-w-[200px] uppercase font-bold">The stream is currently unavailable. Please try another channel.</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase transition-all">Retry Connection</button>
        </div>
            )}

      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent transition-opacity duration-300 z-10 ${showControls ? 'opacity-100 cursor-default' : 'opacity-0'}`}>
        <div className="absolute top-4 left-6 right-6 flex justify-between">
          <div className="flex gap-2">
            <div className="bg-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-xl flex items-center gap-1.5 border border-red-500/50 animate-[pulse_2s_infinite]">
               <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" /> LIVE
            </div>
            <div className="bg-white/10 backdrop-blur-xl px-3 py-1 rounded-full text-[9px] font-black text-amber-400 border border-white/10 uppercase tracking-widest">{streamType} 4K</div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8">
           <div className="flex items-center justify-between bg-black/60 backdrop-blur-3xl p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                <button onClick={(e) => { e.stopPropagation(); videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); }} className="text-white">
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>
                
                <div className="flex items-center gap-2 relative pl-1">
                  <button onClick={(e) => { e.stopPropagation(); setShowVolumeBar(!showVolumeBar); }} className="text-white">
                    {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  </button>
                  <div className={`transition-all duration-300 overflow-hidden flex items-center ${showVolumeBar ? 'w-16 md:w-24 ml-2' : 'w-0'}`}>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-full accent-amber-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>

                <div className="h-8 w-px bg-white/10 mx-1 md:mx-2" />
                <div className="flex flex-col min-w-0 flex-1">
                   <span className="text-[8px] font-black text-amber-500 uppercase leading-none mb-0.5 opacity-70">Broadcast Feed</span>
                   <span className="text-[10px] md:text-sm font-black text-white truncate uppercase italic">{channel.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="bg-amber-500 p-2 md:p-2.5 rounded-xl text-black hover:bg-white transition-all shadow-lg active:scale-90">
                  <Maximize size={20} strokeWidth={3} />
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}