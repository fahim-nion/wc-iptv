import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { parseM3U } from './utils/m3uParser';
import { mapJsonToChannels } from './utils/channelMapper';
import Player from './components/Player';
import channelData from './data/channels.json'; // Dynamic Data Source
import { Search, Trophy, Star, Globe, Upload, Menu, X, ChevronRight, Info } from 'lucide-react';

export default function App() {
  const { channels, setChannels, currentChannel, setCurrentChannel, searchQuery, setSearchQuery, favorites, toggleFavorite, selectedCategory, setCategory } = useStore();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [onlineCount] = useState(Math.floor(Math.random() * 100) + 313);

  useEffect(() => {
    // Load data from JSON instead of hardcoded string
    const initialChannels = mapJsonToChannels(channelData.channels);
    setChannels(initialChannels);

    if (window.innerWidth < 768) {
      setLeftOpen(false);
      setRightOpen(false);
    }
  }, [setChannels]);

  const handleFile = (e) => {
    const reader = new FileReader();
    reader.onload = (res) => {
      setChannels(parseM3U(res.target.result));
      setCategory('All');
    };
    reader.readAsText(e.target.files[0]);
  };

  const autoSwitch = () => {
    if (channels.length === 0) return;
    const currentIndex = channels.findIndex(c => c.url === currentChannel?.url);
    const nextIndex = (currentIndex + 1) % channels.length;
    setCurrentChannel(channels[nextIndex]);
  };

  const filtered = channels.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) && 
    (selectedCategory === 'All' || c.group === selectedCategory || (selectedCategory === 'Favorites' && favorites.includes(c.url)))
  );

  const categories = ['All', 'Favorites', ...new Set(channels.map(c => c.group || 'General'))];

  const DevCard = () => (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-5 shrink-0 shadow-2xl">
      <p className="text-[10px] font-black text-amber-500 uppercase mb-1">Developed By</p>
      <h3 className="text-sm font-black text-white uppercase">Fahim Morshed Nion</h3>
      <div className="flex gap-4 mt-4">
        <a href="https://facebook.com/itz.nion00" target="_blank" className="text-slate-400 hover:text-amber-400 transition-all"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg></a>
        <a href="https://x.com/FahimM0rshed" target="_blank" className="text-slate-400 hover:text-amber-400 transition-all"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#060B15] text-white font-sans flex flex-col overflow-hidden">
      <header className="flex h-16 border-b border-white/5 bg-[#0B1220] px-4 md:px-6 items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setLeftOpen(!leftOpen)} className="p-2 bg-white/5 hover:bg-amber-500 transition-all text-amber-500 rounded-xl"><Menu size={20} /></button>
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} /><h1 className="font-black text-xl tracking-tighter italic hidden sm:block uppercase">Fußball IPTV 📺</h1>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end px-4 border-l border-white/5">
            <span className="text-[10px] font-black text-emerald-500 uppercase leading-none">Online:{onlineCount}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter italic">Broadcasting Live</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-900/20"><Upload size={16} /> <span className="hidden md:inline">IMPORT M3U</span> <input type="file" accept=".m3u" className="hidden" onChange={handleFile} /></label>
          <button onClick={() => setRightOpen(!rightOpen)} className="p-2 bg-white/5 hover:bg-amber-500 rounded-xl text-amber-500 transition-colors"><ChevronRight size={20} /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`${leftOpen ? 'w-64 border-r' : 'w-0'} transition-all duration-500 border-white/5 bg-[#0B1220] flex flex-col shrink-0 overflow-hidden`}>
          <div className="p-4 space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2 italic text-center border-b border-white/5 pb-2">Category Filter</p>
            <div className="space-y-1">
              {categories.map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>{cat}</button>))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 scrollbar-hide border-t border-white/5 mt-2 pt-4">
             <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 px-2 italic">Quick Select</p>
             <div className="space-y-1 pb-4">
               {filtered.slice(0, 50).map(c => (
                 <button key={c.url} onClick={() => setCurrentChannel(c)} className={`w-full text-left px-4 py-2 rounded-lg text-[10px] font-bold truncate transition-all ${currentChannel?.url === c.url ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                   {c.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 mr-2 animate-pulse"></span>}
                   {c.name}
                 </button>
               ))}
             </div>
          </div>

          <div className="p-4 hidden md:block border-t border-white/5 bg-[#0B1220]"><DevCard /></div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#060B15] overflow-y-auto scrollbar-hide p-4 md:p-8">
          <div className="max-w-4xl mx-auto w-full relative">
            {channels.length === 0 && (
              <div className="mb-6 p-6 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
                <Info size={24} className="text-blue-400 shrink-0" />
                <p className="text-sm text-blue-100 font-bold leading-relaxed uppercase tracking-tighter">No channels found. Use the crawler or import an M3U file above.</p>
              </div>
            )}
            
            <Player key={currentChannel?.url} channel={currentChannel} onStall={autoSwitch} />
            
            {currentChannel && (
              <div className="mt-8 border-b border-white/5 pb-8 px-2">
                <div className="flex justify-between items-start">
                   <div>
                      <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{currentChannel.name}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-amber-500 font-black uppercase tracking-[0.4em] text-[11px]">{currentChannel.group}</p>
                        {currentChannel.status === 'live' && <div className="bg-red-600/10 text-red-500 text-[10px] font-black px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest">Live</div>}
                      </div>
                   </div>
                   {currentChannel.source && (
                     <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                       Source: {currentChannel.source}
                     </div>
                   )}
                </div>
              </div>
            )}
            {(!leftOpen || window.innerWidth < 768) && <div className="mt-12 animate-in fade-in duration-700 pb-24"><DevCard /></div>}
          </div>
        </main>

        <aside className={`${rightOpen ? 'w-full md:w-96 border-l fixed md:relative z-50 h-[calc(100vh-64px)]' : 'w-0'} transition-all duration-500 border-white/5 bg-[#0B1220] flex flex-col shrink-0 overflow-hidden right-0`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0B1220]/80 backdrop-blur-md">
            <div className="relative flex-1 group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input type="text" placeholder="Search Broadcasts..." className="w-full bg-[#060B15] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <button onClick={() => setRightOpen(false)} className="md:hidden ml-2 p-2 bg-white/5 rounded-lg text-slate-400"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide pb-24">
             {filtered.map(channel => (
               <div key={channel.url} onClick={() => { setCurrentChannel(channel); if(window.innerWidth < 768) setRightOpen(false); }} className={`group p-3 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all ${currentChannel?.url === channel.url ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'bg-white/5 border-transparent hover:border-white/5'}`}>
                 <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105 ${currentChannel?.url === channel.url ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'bg-black'}`}>
                   {channel.logo ? <img src={channel.logo} className="w-full h-full object-contain p-1.5" alt="" /> : <Globe size={24} className={currentChannel?.url === channel.url ? 'text-black' : 'text-slate-600'} />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className={`text-[11px] font-black truncate uppercase tracking-tight ${currentChannel?.url === channel.url ? 'text-amber-500' : 'text-white'}`}>{channel.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-[9px] text-slate-500 uppercase font-black truncate opacity-60">{channel.group}</p>
                       {channel.status === 'live' && <span className="w-1 h-1 rounded-full bg-red-600"></span>}
                    </div>
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); toggleFavorite(channel.url); }} className={`${favorites.includes(channel.url) ? 'text-amber-500' : 'text-slate-700'} hover:scale-125 transition-transform`}><Star size={20} fill={favorites.includes(channel.url) ? "currentColor" : "none"} /></button>
               </div>
             ))}
          </div>
        </aside>
      </div>
    </div>
  );
}