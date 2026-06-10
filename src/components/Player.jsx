import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function Player({ channel }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!channel || !videoRef.current) return;
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(channel.url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play().catch(() => console.log("Autoplay blocked"));
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = channel.url;
    }
    return () => { if (hls) hls.destroy(); };
  }, [channel]);

  if (!channel) return (
    <div className="aspect-video w-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-white/5 text-center px-4">
      <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3 text-amber-500 text-2xl">🏆</div>
      <p className="text-slate-400 font-medium text-sm">Select a channel to kick off!</p>
    </div>
  );

  return (
    <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      <video ref={videoRef} className="w-full aspect-video object-contain" controls autoPlay playsInline />
      <div className="absolute top-3 left-3 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse">Live</div>
    </div>
  );
}