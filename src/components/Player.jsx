import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { Play, Pause, Maximize, Minimize2, Volume2, VolumeX, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function Player({ channel, onStall }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const controlsTimer = useRef(null);
  const stallTimer = useRef(null); // Ref to track freezing during playback
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolumeBar, setShowVolumeBar] = useState(false);
  const [streamType, setStreamType] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!channel || !videoRef.current) return;
    setIsLoading(true);
    setLoadingProgress(0);
    setHasError(false);

    const url = channel.url.toLowerCase();
    const isTS = url.includes('.ts') || url.includes('mpegts');
    setStreamType(isTS ? 'MPEG-TS' : 'HLS');

    // 1. Progress Bar Logic (Slower for 10s buffer)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => (prev < 95 ? prev + Math.random() * 5 : prev));
    }, 500);

    // 2. INCREASED WATCHDOG: Wait 12 seconds for initial loading before error
    const watchdog = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 3) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 12000);

    if (isTS && mpegts.getFeatureList().mseLivePlayback) {
      const tsPlayer = mpegts.createPlayer({ type: 'mse', isLive: true, url: channel.url, hasVideo: true }, {
        enableWorker: true, enableStashBuffer: true, stashInitialSize: 1024 * 1024 * 6, lazyLoad: false
      });
      tsPlayer.attachMediaElement(videoRef.current);
      tsPlayer.load();
      tsPlayer.play().then(() => finishLoading()).catch(() => {});
      engineRef.current = tsPlayer;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ 
        enableWorker: true, 
        maxBufferSize: 200 * 1024 * 1024,
        manifestLoadingTimeOut: 15000, // Wait 15s for manifest
        fragLoadingTimeOut: 15000     // Wait 15s for video chunks
      });
      hls.loadSource(channel.url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play().then(() => finishLoading()).catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (e, data) => { if(data.fatal) setHasError(true); });
      engineRef.current = hls;
    }

    function finishLoading() {
      clearTimeout(watchdog);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => { setIsLoading(false); setIsPlaying(true); }, 400);
    }

    // 3. INCREASED STALL TIMER: Handles freezing during playback
    const v = videoRef.current;
    const handleWaiting = () => {
      clearTimeout(stallTimer.current);
      // Wait 10 seconds of "Waiting/Buffering" state before switching channel
      stallTimer.current = setTimeout(() => {
        if (v.paused || v.readyState < 3) onStall();
      }, 15000); 
    };

    const handlePlaying = () => clearTimeout(stallTimer.current);

    v.addEventListener('waiting', handleWaiting);
    v.addEventListener('playing', handlePlaying);
    v.addEventListener('play', () => setIsPlaying(true));
    v.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      clearTimeout(watchdog);
      clearTimeout(stallTimer.current);
      clearInterval(progressInterval);
      v.removeEventListener('waiting', handleWaiting);
      v.removeEventListener('playing', handlePlaying);
      if (engineRef.current) engineRef.current.destroy();
    };
  }, [channel]);

  // UI Handlers (Same as before)
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => { setShowControls(false); setShowVolumeBar(false); }, 2500);
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

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  if (!channel) return (
    <div className="aspect-video w-full bg-[#0B1220] rounded-[2.5rem] flex flex-col items-center justify-center border border-white/5 shadow-2xl">
      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse text-amber-500 text-2xl">🏆</div>
      <h3 className="text-white font-black text-sm uppercase tracking-widest italic">Satellite Standby</h3>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 cursor-none" onMouseMove={handleUserActivity} onClick={handleUserActivity}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline onClick={() => videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()} />

      {/* SYNCING PROGRESS BAR (10s Mode) */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#060B15] z-20 px-12">
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-24 h-24 border-2 border-amber-500/10 rounded-full animate-ping" />
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between items-end mb-2 text-amber-500 font-black text-[10px] uppercase">
               <span className="animate-pulse tracking-widest">Optimizing 4K Broadcast...</span>
               <span>{Math.round(loadingProgress)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 transition-all duration-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]" style={{ width: `${loadingProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 text-center px-6">
           <AlertCircle className="text-red-500 w-10 h-10 mb-4" />
           <p className="text-white font-black text-sm uppercase">Broadcast Failed to Load</p>
           <p className="text-slate-500 text-[10px] mt-2 uppercase font-bold">Please try another channel</p>
           <button onClick={onStall} className="mt-6 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase">Try Next Channel</button>
        </div>
      )}

      {/* OVERLAY CONTROLS */}
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
           <div className="flex items-center justify-between bg-black/60 backdrop-blur-3xl p-3 md:p-4 rounded-[1.5rem] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button onClick={(e) => { e.stopPropagation(); videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); }} className="text-white shrink-0">
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>
                <div className="flex items-center gap-2 relative pl-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setShowVolumeBar(!showVolumeBar); }} className="text-white">
                    {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  </button>
                  {showVolumeBar && <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-16 md:w-24 accent-amber-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer ml-3" />}
                </div>
                <div className="h-8 w-px bg-white/10 mx-1 md:mx-2 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                   <span className="text-[10px] md:text-sm font-black text-white truncate uppercase italic leading-tight">{channel.name}</span>
                </div>
              </div>
              <button onClick={toggleFullscreen} className="bg-amber-500 p-2 rounded-xl text-black ml-4 shrink-0 shadow-lg active:scale-90 transition-all">
                {isFullscreen ? <Minimize2 size={20} strokeWidth={3} /> : <Maximize size={20} strokeWidth={3} />}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}