import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { getStreamUrl } from '../services/streamProxy';
import { 
  Play, 
  Pause, 
  Maximize, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Tv, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  Radio, 
  Sparkles,
  Maximize2,
  Minimize,
  Server,
  Layers,
  Film
} from 'lucide-react';

export default function Player({ 
  channel, 
  onStall, 
  onNextChannel, 
  onPrevChannel,
  relatedServers = [],
  onSelectServer 
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const controlsTimer = useRef(null);
  const stallTimer = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [showVolumeBar, setShowVolumeBar] = useState(false);
  const [streamType, setStreamType] = useState('HLS');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [fitMode, setFitMode] = useState('contain'); // 'contain' | 'cover'
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Reconnection trigger
  const handleReload = useCallback(() => {
    setIsLoading(true);
    setLoadingProgress(10);
    setHasError(false);
    setReloadKey(k => k + 1);
  }, []);

  // Copy Stream URL
  const handleCopyUrl = (e) => {
    e.stopPropagation();
    if (!channel?.url) return;
    navigator.clipboard.writeText(channel.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Picture in Picture
  const togglePiP = async (e) => {
    e.stopPropagation();
    try {
      if (!document.pictureInPictureElement) {
        if (videoRef.current) await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      } else {
        await document.exitPictureInPicture();
        setIsPiP(false);
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Fullscreen
  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Stream Player Engine Setup
  useEffect(() => {
    if (!channel || !videoRef.current) return;
    setIsLoading(true);
    setLoadingProgress(5);
    setHasError(false);
    setErrorMessage('');

    // Protocol upgrade (HTTP -> HTTPS when site is HTTPS)
    let rawUrl = channel.url || '';
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawUrl.startsWith('http://')) {
      rawUrl = rawUrl.replace(/^http:\/\//i, 'https://');
      channel = { ...channel, url: rawUrl }; // update channel url for the proxy check
    }
    const streamUrl = getStreamUrl(channel);

    const rawLower = rawUrl.toLowerCase();
    const isHLS = rawLower.includes('.m3u8');
    const isFLV = !isHLS && rawLower.includes('.flv');
    const isTS = !isHLS && (rawLower.includes('.ts') || rawLower.includes('mpegts'));
    setStreamType(isFLV ? 'HTTP-FLV' : (isTS ? 'MPEG-TS' : 'HLS'));

    // Progress Bar simulation
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => (prev < 90 ? prev + Math.random() * 8 : prev));
    }, 400);

    if (channel.type === 'IFRAME') {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setIsLoading(false);
      setIsPlaying(true);
      return;
    }

    // Watchdog timer (15 seconds before timeout)
    const watchdog = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 3) {
        setHasError(true);
        setErrorMessage('Stream connection timed out. Alternative server recommended.');
        setIsLoading(false);
      }
    }, 15000);

    const finishLoading = () => {
      clearTimeout(watchdog);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setIsPlaying(true);
      }, 350);
    };

    // Engine initialization
    if ((isFLV || isTS) && mpegts.isSupported()) {
      const player = mpegts.createPlayer({
        type: isFLV ? 'flv' : 'mse',
        isLive: true,
        url: streamUrl,
        hasVideo: true,
        hasAudio: true,
        cors: true
      }, {
        enableWorker: true,
        enableStashBuffer: true,
        stashInitialSize: 1024 * 1024 * 4,
        lazyLoad: false,
        liveBufferLatencyChasing: true,
        autoCleanupSourceBuffer: true
      });

      player.attachMediaElement(videoRef.current);
      player.load();
      player.play()
        .then(() => finishLoading())
        .catch((err) => {
          console.warn('FLV unmuted autoplay blocked, retrying muted:', err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => finishLoading()).catch(() => finishLoading());
          }
        });

      player.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
        console.error('mpegts error:', errorType, errorDetail, errorInfo);
        setHasError(true);
        setErrorMessage(`Stream decoder error (${errorDetail || errorType})`);
      });

      engineRef.current = player;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ 
        enableWorker: true, 
        maxBufferSize: 200 * 1024 * 1024,
        manifestLoadingTimeOut: 15000,
        fragLoadingTimeOut: 15000,
        enableSoftwareAES: true,
        lowLatencyMode: true
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const playPromise = videoRef.current?.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => finishLoading())
            .catch(() => {
              if (videoRef.current) {
                videoRef.current.muted = true;
                setIsMuted(true);
                videoRef.current.play().then(() => finishLoading()).catch(() => finishLoading());
              }
            });
        }
      });

      hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Hls network error, attempting automatic recovery...', data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Hls media error, recovering...', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('Hls fatal unrecoverable error:', data);
              setHasError(true);
              setErrorMessage('Failed to decode video stream.');
              hls.destroy();
              break;
          }
        }
      });

      engineRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari / iOS)
      videoRef.current.src = streamUrl;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => finishLoading())
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => finishLoading()).catch(() => finishLoading());
            }
          });
      }
    }

    // Video Element Event Listeners
    const v = videoRef.current;
    const handleWaiting = () => {
      clearTimeout(stallTimer.current);
      stallTimer.current = setTimeout(() => {
        if (v.paused || v.readyState < 3) {
          if (onStall) onStall();
        }
      }, 15000);
    };

    const handlePlaying = () => {
      clearTimeout(stallTimer.current);
      finishLoading();
    };

    const handleCanPlay = () => finishLoading();

    v.addEventListener('waiting', handleWaiting);
    v.addEventListener('playing', handlePlaying);
    v.addEventListener('canplay', handleCanPlay);
    v.addEventListener('play', () => setIsPlaying(true));
    v.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      clearTimeout(watchdog);
      clearTimeout(stallTimer.current);
      clearInterval(progressInterval);
      v.removeEventListener('waiting', handleWaiting);
      v.removeEventListener('playing', handlePlaying);
      v.removeEventListener('canplay', handleCanPlay);
      v.removeEventListener('play', () => setIsPlaying(true));
      v.removeEventListener('pause', () => setIsPlaying(false));
      if (engineRef.current) engineRef.current.destroy();
    };
  }, [channel, reloadKey]);

  // UI Inactivity Auto-hide
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
      setShowVolumeBar(false);
    }, 3000);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;
      
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) videoRef.current.play();
          else videoRef.current.pause();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen(e);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePiP(e);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReload();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        changeVolume(Math.min(1, volume + 0.1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        changeVolume(Math.max(0, volume - 0.1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isMuted, handleReload]);

  const changeVolume = (val) => {
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      changeVolume(0.5);
    }
  };

  if (!channel) {
    return (
      <div className="aspect-video w-full bg-gradient-to-br from-[#0c1427] to-[#060b15] rounded-3xl flex flex-col items-center justify-center border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.08),transparent_70%)]" />
        <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
          <Film className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <h3 className="text-white font-black text-lg uppercase tracking-wider italic">No Broadcast Selected</h3>
        <p className="text-slate-400 text-xs mt-1 uppercase font-semibold tracking-widest">Select a match from the schedule</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Video Viewport */}
      <div 
        ref={containerRef} 
        className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/10 group select-none"
        onMouseMove={handleUserActivity} 
        onClick={handleUserActivity}
      >
        {/* Ambient Backlight Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 blur-xl opacity-50 pointer-events-none" />

        {channel?.type === 'IFRAME' ? (
          <iframe 
            src={channel.url}
            className={`w-full h-full relative z-0 bg-black`}
            allowFullScreen
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        ) : (
          <video 
            ref={videoRef} 
            className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'} relative z-0 transition-all duration-300`} 
            playsInline 
            onClick={() => {
              if (!videoRef.current) return;
              if (videoRef.current.paused) videoRef.current.play();
              else videoRef.current.pause();
            }} 
          />
        )}

        {/* Modern Loading State (Glowing Radar) */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#060b15]/90 backdrop-blur-md z-20 px-8">
            <div className="relative flex items-center justify-center mb-8">
              <div className="w-24 h-24 rounded-full border border-amber-500/20 animate-ping absolute" />
              <div className="w-20 h-20 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
              <Radio className="w-8 h-8 text-amber-400 absolute" />
            </div>
            
            <div className="w-full max-w-sm text-center">
              <div className="flex justify-between items-center mb-2 px-1 text-xs font-black uppercase tracking-wider">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Connecting Live Stream
                </span>
                <span className="text-white font-mono">{Math.round(loadingProgress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]" 
                  style={{ width: `${loadingProgress}%` }} 
                />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3 truncate px-4">
                {channel.name}
              </p>
            </div>
          </div>
        )}

        {/* Modern Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-lg z-30 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-white font-black text-base uppercase tracking-tight">Stream Signal Interrupted</h3>
            <p className="text-slate-400 text-xs mt-1.5 max-w-md font-medium">
              {errorMessage || 'The broadcaster server is temporarily unavailable or refreshing.'}
            </p>
            
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <button 
                onClick={handleReload}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
              >
                <RotateCw size={14} /> Reconnect
              </button>

              {relatedServers.length > 1 && (
                <button 
                  onClick={() => {
                    const currentIndex = relatedServers.findIndex(s => s.url === channel.url);
                    const nextServer = relatedServers[(currentIndex + 1) % relatedServers.length];
                    if (onSelectServer && nextServer) onSelectServer(nextServer);
                  }}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 active:scale-95 flex items-center gap-2"
                >
                  <Server size={14} /> Try Server 2
                </button>
              )}

              {onStall && (
                <button 
                  onClick={onStall}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/5 active:scale-95"
                >
                  Next Channel
                </button>
              )}
            </div>
          </div>
        )}

        {/* HUD OVERLAY CONTROLS */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 transition-opacity duration-300 z-10 flex flex-col justify-between p-4 md:p-6 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Bar Indicators */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live Badge */}
              <div className="bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-lg flex items-center gap-1.5 border border-red-400/40">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
                LIVE
              </div>

              {/* Protocol Badge */}
              <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-amber-400 border border-white/10 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} />
                {streamType}
              </div>

              {/* Source Tag */}
              {channel.source && (
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-slate-300 border border-white/10 uppercase tracking-widest hidden sm:inline-flex">
                  {channel.source}
                </div>
              )}
            </div>

            {/* Quick Actions (Right Top) */}
            <div className="flex items-center gap-2">
              {/* Copy Stream Link */}
              <button 
                onClick={handleCopyUrl}
                title="Copy Stream URL (for VLC / external player)"
                className="bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white p-2 rounded-xl border border-white/10 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span className="text-[10px] hidden md:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              {/* Fit Mode Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFitMode(f => f === 'contain' ? 'cover' : 'contain');
                }}
                title={fitMode === 'contain' ? 'Stretch / Fill Screen' : 'Original Ratio'}
                className="bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white p-2 rounded-xl border border-white/10 transition-all active:scale-95"
              >
                {fitMode === 'contain' ? <Maximize2 size={16} /> : <Minimize size={16} />}
              </button>
            </div>
          </div>

          {/* Bottom HUD Bar */}
          <div className="w-full">
            <div className="bg-[#0b1220]/80 backdrop-blur-2xl p-3 md:p-4 rounded-2xl border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3">
              {/* Left Controls: Play, Volume, Reload */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Play / Pause Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!videoRef.current) return;
                    if (videoRef.current.paused) videoRef.current.play();
                    else videoRef.current.pause();
                  }}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25 active:scale-90 transition-all"
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>

                {/* Volume Button & Slider */}
                <div 
                  className="flex items-center gap-2 relative bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 transition-colors"
                  onMouseEnter={() => setShowVolumeBar(true)}
                >
                  <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:text-amber-400 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  {showVolumeBar && (
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={isMuted ? 0 : volume} 
                      onChange={(e) => changeVolume(parseFloat(e.target.value))} 
                      className="w-16 md:w-20 accent-amber-500 h-1 bg-white/20 rounded-lg cursor-pointer transition-all" 
                    />
                  )}
                </div>

                {/* Reconnect / Refresh */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleReload(); }}
                  title="Reload / Reconnect Stream (Key: R)"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all active:rotate-180 duration-300"
                >
                  <RotateCw size={17} />
                </button>

                {/* Divider */}
                <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

                {/* Match Title on HUD */}
                <div className="min-w-0 flex-1 hidden md:block">
                  <h4 className="text-xs font-black text-white uppercase italic tracking-tight truncate">
                    {channel.name}
                  </h4>
                  <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest truncate">
                    {channel.group || 'Live Sports'}
                  </p>
                </div>
              </div>

              {/* Right Controls: PiP & Fullscreen */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Picture in Picture */}
                {document.pictureInPictureEnabled && (
                  <button 
                    onClick={togglePiP}
                    title="Picture in Picture (Key: P)"
                    className={`p-2.5 rounded-xl border transition-all ${
                      isPiP ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
                    }`}
                  >
                    <Tv size={17} />
                  </button>
                )}

                {/* Fullscreen Button */}
                <button 
                  onClick={toggleFullscreen}
                  title="Fullscreen (Key: F)"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-lg active:scale-95 transition-all"
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Server Switcher Bar (when match has multiple servers) */}
      {relatedServers && relatedServers.length > 1 && (
        <div className="bg-[#0b1220]/60 border border-white/10 rounded-2xl p-3 flex flex-wrap items-center gap-2 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider mr-2">
            <Server size={14} />
            <span>Servers:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {relatedServers.map((s, idx) => {
              const isActive = s.url === channel.url;
              // Extract quality or server number from title
              const serverMatch = s.name?.match(/\[SERVER\s*(\d+)(?:\s*-\s*([A-Za-z0-9]+))?\]/i);
              const label = serverMatch 
                ? `Server ${serverMatch[1]} ${serverMatch[2] ? `(${serverMatch[2]})` : ''}` 
                : (s.source ? `${s.source.toUpperCase()} #${idx + 1}` : `Server ${idx + 1}`);

              return (
                <button
                  key={s.url || idx}
                  onClick={() => onSelectServer && onSelectServer(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isActive 
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 font-black' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5 hover:border-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}