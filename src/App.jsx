import React, { useState } from 'react';
import { useStore } from './store/useStore';
import { parseM3U } from './utils/m3uParser';
import Player from './components/Player';
import { Search, Trophy, Star, Globe, Upload, Mail, Menu, X } from 'lucide-react';

export default function App() {
  const { 
    channels = [], setChannels, 
    currentChannel, setCurrentChannel, 
    searchQuery = '', setSearchQuery, 
    favorites = [], toggleFavorite, 
    selectedCategory, setCategory 
  } = useStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  return (
    <div className="h-screen bg-[#060B15] text-white font-sans flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <header className="flex h-16 border-b border-white/5 bg-[#0B1220] px-4 md:px-6 items-center justify-between shrink-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl transition-all duration-300 text-amber-500 shadow-lg"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={22} />
            <h1 className="font-black text-lg md:text-2xl tracking-tighter italic">WORLD CUP <span className="text-amber-500">IPTV</span></h1>
          </div>
        </div>

        <label className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-xs md:text-sm font-bold cursor-pointer flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
          <Upload size={16} /> <span className="hidden sm:inline">IMPORT M3U</span> <input type="file" className="hidden" onChange={handleFile} />
        </label>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR */}
        <aside 
          className={`
            ${isSidebarOpen ? 'w-64 border-r' : 'w-0'} 
            transition-all duration-500 ease-in-out border-white/5 bg-[#0B1220] flex flex-col justify-between shrink-0 overflow-hidden
          `}
        >
          <div className="p-4 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Live Categories</p>
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategory(cat)} 
                className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SIDEBAR DEV INFO (OPEN) */}
          <div className="m-4 p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 whitespace-nowrap">
            <p className="text-[10px] font-black text-amber-500 uppercase mb-1">Developer</p>
            <h3 className="font-bold text-sm tracking-tight">Fahim Morshed Nion</h3>
            <div className="flex gap-4 mt-4">
              <a href="https://facebook.com/itz.nion00" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-500 transition-transform hover:scale-110">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="https://x.com/FahimM0rshed" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-500 transition-transform hover:scale-110">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#060B15] relative">
          
          {/* FLOATING DEV INFO (CLOSED) */}
          {!isSidebarOpen && (
            <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-[#0B1220]/90 backdrop-blur-xl p-2 pr-5 rounded-full border border-amber-500/30 shadow-2xl animate-in slide-in-from-right-10 duration-500">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-xs shadow-lg">FN</div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-amber-500 leading-none">DEVELOPED BY</span>
                <span className="text-xs font-bold text-white">Fahim Morshed Nion</span>
              </div>
              <div className="flex gap-3 ml-3 border-l border-white/10 pl-3">
                <a href="https://facebook.com/itz.nion00" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-500 transition-colors">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="https://x.com/FahimM0rshed" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-500 transition-colors">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          )}

          {/* STICKY PLAYER */}
          <div className="sticky top-0 z-40 bg-[#060B15]/90 backdrop-blur-md p-2 md:p-6 border-b border-white/5 shadow-2xl">
            <div className="max-w-4xl mx-auto w-full">
               <Player channel={currentChannel} />
               {currentChannel && (
                 <div className="mt-4 flex items-center justify-between px-2">
                    <div className="flex flex-col min-w-0">
                      <h2 className="text-lg md:text-2xl font-black truncate text-white tracking-tight">{currentChannel.name}</h2>
                      <p className="text-[10px] md:text-xs font-bold text-amber-500/80 uppercase tracking-widest">{currentChannel.group}</p>
                    </div>
                    <span className="bg-red-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-red-900/40 animate-pulse shrink-0">Live</span>
                 </div>
               )}
            </div>
          </div>

          {/* SEARCH */}
          <div className="px-4 py-4 md:px-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Find a channel..." 
                className="w-full bg-[#0B1220] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-lg" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>

          {/* CHANNEL LIST */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0 scrollbar-hide">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(channel => (
                <div 
                  key={channel.url} 
                  onClick={() => {
                    setCurrentChannel(channel);
                    document.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className={`
                    group p-4 rounded-[2rem] border transition-all duration-500 flex flex-col items-center text-center cursor-pointer
                    ${currentChannel?.url === channel.url 
                      ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.15)] scale-105 z-10' 
                      : 'bg-[#0B1220]/40 border-white/5 hover:border-amber-500/40 hover:bg-[#0B1220] hover:scale-105'
                    }
                  `}
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center overflow-hidden mb-3 ${currentChannel?.url === channel.url ? 'bg-amber-500 shadow-lg' : 'bg-black/50'}`}>
                    {channel.logo ? 
                      <img src={channel.logo} className="w-full h-full object-contain p-2" alt="" /> : 
                      <Globe size={28} className={currentChannel?.url === channel.url ? 'text-black' : 'text-slate-700'} />
                    }
                  </div>
                  <h4 className={`text-[11px] md:text-sm font-bold line-clamp-2 leading-tight ${currentChannel?.url === channel.url ? 'text-amber-500' : 'text-slate-300'}`}>
                    {channel.name}
                  </h4>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(channel.url); }} className="mt-2">
                    <Star size={16} fill={favorites.includes(channel.url) ? "#fbbf24" : "none"} className={favorites.includes(channel.url) ? "text-amber-500" : "text-slate-600"} />
                  </button>
                </div>
              ))}
            </div>
            <div className="h-64 w-full" />
          </div>
        </main>
      </div>
    </div>
  );
}