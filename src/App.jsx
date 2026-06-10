import React from 'react';
import { useStore } from './store/useStore';
import { parseM3U } from './utils/m3uParser';
import Player from './components/Player';
import { Search, Trophy, Star, Globe, Upload, Mail } from 'lucide-react';

export default function App() {
  const { 
    channels = [], setChannels, 
    currentChannel, setCurrentChannel, 
    searchQuery = '', setSearchQuery, 
    favorites = [], toggleFavorite, 
    selectedCategory = 'All', setCategory 
  } = useStore();

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
    <div className="h-screen bg-[#0B1220] text-white font-sans flex flex-col overflow-hidden">
      
      {/* DESKTOP HEADER */}
      <header className="hidden md:flex h-16 border-b border-white/5 bg-[#101827] px-6 items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Trophy className="text-amber-500" />
          <h1 className="font-bold text-xl tracking-tight">WORLD CUP <span className="text-amber-500">IPTV</span></h1>
        </div>
        <label className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer flex items-center gap-2">
          <Upload size={16} /> Import List <input type="file" className="hidden" onChange={handleFile} />
        </label>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 border-r border-white/5 bg-[#101827]/50 p-4 flex-col justify-between">
          <div className="space-y-1 overflow-y-auto">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${selectedCategory === cat ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-slate-400 hover:bg-white/5'}`}>{cat}</button>
            ))}
          </div>

          {/* SIDEBAR DEV INFO */}
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Developed By</p>
            <h3 className="font-bold text-sm">Fahim Morshed Nion</h3>
            <div className="flex gap-4 mt-3">
              <a href="https://facebook.com/itz.nion00" target="_blank" className="text-slate-400 hover:text-amber-500">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="https://x.com/FahimM0rshed" target="_blank" className="text-slate-400 hover:text-amber-500">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          
          {/* STICKY PLAYER */}
          <div className="sticky top-0 z-40 bg-[#0B1220] p-2 md:p-6 border-b border-white/5 shadow-2xl">
            <div className="max-w-4xl mx-auto w-full">
               <Player channel={currentChannel} />
               {currentChannel && <h2 className="mt-3 text-lg font-bold truncate">{currentChannel.name}</h2>}
            </div>
          </div>

          {/* SEARCH */}
          <div className="px-4 py-3 bg-[#101827]/30 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search channels..." 
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide pb-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(channel => (
                <div 
                  key={channel.url} 
                  onClick={() => setCurrentChannel(channel)} 
                  className={`p-3 rounded-2xl border cursor-pointer ${currentChannel?.url === channel.url ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-900/40 border-white/5'}`}
                >
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                    {channel.logo ? <img src={channel.logo} className="w-full h-full object-contain" /> : <Globe size={20} className="text-slate-700" />}
                  </div>
                  <h4 className="font-medium text-[10px] md:text-xs line-clamp-2">{channel.name}</h4>
                </div>
              ))}
            </div>

            {/* MOBILE DEV INFO */}
            <div className="md:hidden mt-12 p-6 text-center border-t border-white/5">
                <p className="text-[10px] font-bold text-amber-500 uppercase mb-2">Developed By</p>
                <h3 className="font-bold text-xl">Fahim Morshed Nion</h3>
                <div className="flex justify-center gap-6 mt-4 pb-10">
                  <a href="https://facebook.com/itz.nion00" className="text-slate-400">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                  </a>
                  <a href="https://x.com/FahimM0rshed" className="text-slate-400">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="mailto:i.fahimnion@gmail.com" className="text-slate-400"><Mail size={24} /></a>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}