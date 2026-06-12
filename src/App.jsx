import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { parseM3U } from './utils/m3uParser';
import Player from './components/Player';
import { Search, Trophy, Star, Globe, Upload, Mail, Menu, X, ChevronRight, Users, Info } from 'lucide-react';

export default function App() {
  const { 
    channels = [], setChannels, 
    currentChannel, setCurrentChannel, 
    searchQuery = '', setSearchQuery, 
    favorites = [], toggleFavorite, 
    selectedCategory, setCategory 
  } = useStore();

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [viewerCount, setViewerCount] = useState(1240);

  // 1. AUTO-CLOSE SIDEBAR ON MOBILE
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setLeftOpen(false);
        setRightOpen(false);
      } else {
        setLeftOpen(true);
        setRightOpen(true);
      }
    };
    handleResize(); // Run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. LIVE VIEWER SIMULATION
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 21) - 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFile = (e) => {
    const reader = new FileReader();
    reader.onload = (res) => setChannels(parseM3U(res.target.result));
    reader.readAsText(e.target.files[0]);
  };

  const categories = ['All', 'Favorites', ...new Set(channels.map(c => c.group || 'General'))];
  const filtered = channels.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === 'All' || c.group === selectedCategory || (selectedCategory === 'Favorites' && favorites.includes(c.url)))
  );

  const DevInfo = ({ compact = false }) => (
    <div className={`rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 ${compact ? 'p-6 mt-6 max-w-2xl mx-auto w-full' : 'p-5 m-4'}`}>
      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Developer</p>
      <h3 className={`${compact ? 'text-2xl' : 'text-sm'} font-black tracking-tight text-white`}>Fahim Morshed Nion</h3>
      <p className="text-xs text-slate-400 mt-1">Feel free to reach out to me for m3u file</p>
      <div className="flex gap-4 mt-4">
        <a href="https://facebook.com/itz.nion00" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-500 transition-transform hover:scale-110">
          <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
        </a>
        <a href="https://x.com/FahimM0rshed" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-500 transition-transform hover:scale-110">
          <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="mailto:i.fahimnion@gmail.com" className="text-slate-400 hover:text-amber-500 transition-transform hover:scale-110"><Mail size={22} /></a>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#060B15] text-white font-sans flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <header className="flex h-16 border-b border-white/5 bg-[#0B1220] px-4 md:px-6 items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setLeftOpen(!leftOpen)} className="p-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl transition-all text-amber-500">
            {leftOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} />
            <h1 className="font-black text-xl tracking-tighter italic hidden sm:block text-white uppercase">WORLD CUP IPTV 📺</h1>
          </div>
        </div>

        {/* LIVE VIEWERS COUNT */}
        <div className="hidden lg:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0B1220] bg-slate-800 flex items-center justify-center text-[8px] overflow-hidden"><img src={`https://i.pravatar.cc/100?img=${i+10}`} /></div>)}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 leading-none uppercase">Live Viewers</span>
            <span className="text-xs font-black text-emerald-500">{viewerCount.toLocaleString()} Devices Online</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all shadow-lg active:scale-95">
            <Upload size={16} /> <span className="hidden md:inline">IMPORT M3U</span> <input type="file" className="hidden" onChange={handleFile} />
          </label>
          <button onClick={() => setRightOpen(!rightOpen)} className="p-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl transition-all text-amber-500">
            {rightOpen ? <ChevronRight size={20} /> : <Search size={20} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL */}
        <aside className={`${leftOpen ? 'w-64 border-r fixed md:relative z-50 h-[calc(100vh-64px)]' : 'w-0'} transition-all duration-500 border-white/5 bg-[#0B1220] flex flex-col justify-between shrink-0 overflow-hidden`}>
          <div className="p-4 space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Live Filter</p>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>{cat}</button>
            ))}
          </div>
          {rightOpen && <DevInfo />}
        </aside>

        {/* CENTER PANEL */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#060B15] overflow-y-auto scrollbar-hide p-4 md:p-8">
          <div className="max-w-4xl mx-auto w-full">
            
            {/* INSTRUCTION TEXT */}
            <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
              <div className="bg-blue-500 p-2 rounded-xl text-white shrink-0"><Info size={20} /></div>
              <p className="text-sm text-blue-100 leading-relaxed">
                <span className="font-bold text-white">How to watch:</span> Go to {' '}
                <a href="https://t.ly/CVQtD" target="_blank" className="text-amber-500 underline font-black hover:text-amber-400">This Link</a> 
                {' '} and download the file name <code className="bg-black/40 px-2 py-0.5 rounded italic text-amber-300">"sports.m3u"</code> cause Works Best and then import the file using the button above. Done! Select Sports and Try Watching <code className="bg-black/40 px-2 py-0.5 rounded italic text-amber-300">"bein Sport 1 HD"</code> when internet is slow. Other files works as well.
              </p>
            </div>

            <Player channel={currentChannel} />
            
            {currentChannel && (
              <div className="mt-6 flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter">{currentChannel.name}</h2>
                  <p className="text-amber-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">{currentChannel.group}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl">
                   <Users size={18} className="text-slate-400" />
                   <span className="text-slate-300 font-bold text-xs">{Math.floor(viewerCount/4)} watching this channel</span>
                </div>
              </div>
            )}

            {!rightOpen && <DevInfo compact={true} />}
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className={`${rightOpen ? 'w-full md:w-96 border-l fixed md:relative z-50 h-[calc(100vh-64px)]' : 'w-0'} transition-all duration-500 border-white/5 bg-[#0B1220] flex flex-col shrink-0 overflow-hidden right-0`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500" size={16} />
              <input 
                type="text" 
                placeholder="Find Channel..." 
                className="w-full bg-[#060B15] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:outline-none" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <button onClick={() => setRightOpen(false)} className="md:hidden ml-2 p-2 bg-white/5 rounded-lg"><X size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
             {filtered.map(channel => (
               <div 
                 key={channel.url} 
                 onClick={() => {
                    setCurrentChannel(channel);
                    if(window.innerWidth < 768) setRightOpen(false);
                 }}
                 className={`group p-3 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all ${currentChannel?.url === channel.url ? 'bg-amber-500/10 border-amber-500 shadow-lg' : 'bg-white/5 border-transparent'}`}
               >
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${currentChannel?.url === channel.url ? 'bg-amber-500' : 'bg-black'}`}>
                   {channel.logo ? <img src={channel.logo} className="w-full h-full object-contain p-1" /> : <Globe size={20} className={currentChannel?.url === channel.url ? 'text-black' : 'text-slate-600'} />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold truncate ${currentChannel?.url === channel.url ? 'text-amber-500' : 'text-white'}`}>{channel.name}</h4>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">{channel.group}</p>
                 </div>
               </div>
             ))}
             <div className="h-20" />
          </div>
        </aside>

      </div>
    </div>
  );
}