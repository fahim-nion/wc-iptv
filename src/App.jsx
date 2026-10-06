import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from './store/useStore';
import { parseM3U } from './utils/m3uParser';
import { mapJsonToChannels } from './utils/channelMapper';
import Player from './components/Player';
import channelData from './data/channels.json';
import { PERMANENT_CHANNELS } from './config/permanentChannels';
import { 
  Search, 
  Trophy, 
  Star, 
  Globe, 
  Upload, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Info,
  Flame,
  Zap,
  Copy,
  Check,
  Keyboard,
  Server,
  Radio,
  SlidersHorizontal,
  Share2
} from 'lucide-react';

export default function App() {
  const { 
    channels, 
    setChannels, 
    currentChannel, 
    setCurrentChannel, 
    searchQuery, 
    setSearchQuery, 
    favorites, 
    toggleFavorite, 
    selectedCategory, 
    setCategory 
  } = useStore();

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [onlineCount] = useState(Math.floor(Math.random() * 85) + 342);
  const [allChannels, setAllChannels] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | 'LIVELIVE24' | 'CAMEL1' | 'PERMANENT'

  // Combine scraped channels with permanent channels
  const combineWithPermanent = (channelList) => {
    const nonPermanentChannels = channelList.filter(ch => !ch.isPermanent);
    return [...nonPermanentChannels, ...PERMANENT_CHANNELS];
  };

  useEffect(() => {
    const initialChannels = mapJsonToChannels(channelData.channels || []);
    const combinedChannels = combineWithPermanent(initialChannels);
    setAllChannels(combinedChannels);
    setChannels(combinedChannels);

    // Default select first channel if none selected
    if (!currentChannel && combinedChannels.length > 0) {
      setCurrentChannel(combinedChannels[0]);
    }

    if (window.innerWidth < 768) {
      setLeftOpen(false);
      setRightOpen(false);
    }
  }, [setChannels]);

  // Handle M3U file import
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (res) => {
      const parsedChannels = parseM3U(res.target.result);
      const combined = combineWithPermanent(parsedChannels);
      setAllChannels(combined);
      setChannels(combined);
      setCategory('All');
    };
    reader.readAsText(file);
  };

  // Switch to next channel automatically on persistent freeze
  const autoSwitch = () => {
    if (allChannels.length === 0) return;
    const currentIndex = allChannels.findIndex(c => c.url === currentChannel?.url);
    const nextIndex = (currentIndex + 1) % allChannels.length;
    setCurrentChannel(allChannels[nextIndex]);
  };

  // Helper to extract base match title (ignoring [SERVER X - HD])
  const getBaseMatchTitle = (title = '') => {
    return title.replace(/\[SERVER\s*\d+[^\]]*\]/gi, '').trim().toUpperCase();
  };

  // Find all sibling servers for current match
  const relatedServers = useMemo(() => {
    if (!currentChannel?.name) return [];
    const base = getBaseMatchTitle(currentChannel.name);
    return allChannels.filter(c => getBaseMatchTitle(c.name) === base);
  }, [currentChannel, allChannels]);

  // Filter channels based on search, category, and source
  const filtered = useMemo(() => {
    return allChannels.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.source || '').toLowerCase().includes(q);
      
      const matchesCategory = selectedCategory === 'All' || 
                             c.group === selectedCategory || 
                             (selectedCategory === 'Favorites' && favorites.includes(c.url)) ||
                             (selectedCategory === 'Permanent' && c.isPermanent);

      let matchesSource = true;
      if (sourceFilter === 'LIVELIVE24') matchesSource = (c.source || '').toLowerCase().includes('livelive24');
      else if (sourceFilter === 'CAMEL1') matchesSource = (c.source || '').toLowerCase().includes('camel1');
      else if (sourceFilter === 'PERMANENT') matchesSource = !!c.isPermanent;

      return matchesSearch && matchesCategory && matchesSource;
    });
  }, [allChannels, searchQuery, selectedCategory, favorites, sourceFilter]);

  // Categories list
  const categories = useMemo(() => {
    const rawGroups = new Set(allChannels.map(c => c.group || 'Sports'));
    return ['All', 'Favorites', 'Permanent', ...rawGroups];
  }, [allChannels]);

  const handleCopyCurrent = () => {
    if (!currentChannel?.url) return;
    navigator.clipboard.writeText(currentChannel.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const DevCard = () => (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-4 shrink-0 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Architect & Dev</p>
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
      </div>
      <h3 className="text-sm font-black text-white tracking-tight">Fahim Morshed Nion</h3>
      <div className="flex gap-3 mt-3">
        <a 
          href="https://facebook.com/itz.nion00" 
          target="_blank" 
          rel="noreferrer"
          className="px-2.5 py-1 bg-white/5 hover:bg-amber-500 hover:text-black rounded-lg text-slate-400 text-xs font-bold transition-all flex items-center gap-1.5"
        >
          Facebook
        </a>
        <a 
          href="https://x.com/FahimM0rshed" 
          target="_blank" 
          rel="noreferrer"
          className="px-2.5 py-1 bg-white/5 hover:bg-amber-500 hover:text-black rounded-lg text-slate-400 text-xs font-bold transition-all flex items-center gap-1.5"
        >
          Twitter / X
        </a>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#060b15] text-white font-sans flex flex-col overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <header className="flex h-16 border-b border-white/10 bg-[#0b1220]/90 backdrop-blur-xl px-4 md:px-6 items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLeftOpen(!leftOpen)} 
            className="p-2 bg-white/5 hover:bg-white/10 text-amber-400 rounded-xl transition-all border border-white/5 active:scale-95"
            title="Toggle Categories"
          >
            <Menu size={19} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="text-black" size={20} />
            </div>
            <div>
              <h1 className="font-black text-lg md:text-xl tracking-tighter italic uppercase flex items-center gap-1.5 leading-none">
                Fußball IPTV <span className="text-amber-400 text-xs font-mono font-normal">v4.0</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block mt-0.5">
                World Live Match Network
              </p>
            </div>
          </div>
        </div>

        {/* Center Live Badges */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-black/40 rounded-full border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">{onlineCount} Viewers Online</span>
          </div>
          <div className="w-px h-3 bg-white/15" />
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <Radio size={13} className="text-red-500 animate-pulse" />
            <span>{allChannels.length} Streams Active</span>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          {/* Keyboard Shortcuts Trigger */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors hidden sm:flex items-center"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={18} />
          </button>

          {/* Import M3U */}
          <label className="bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-950/40 border border-emerald-400/20">
            <Upload size={15} /> 
            <span className="hidden md:inline uppercase tracking-wider">Import M3U</span> 
            <input type="file" accept=".m3u" className="hidden" onChange={handleFile} />
          </label>

          {/* Right Sidebar Toggle */}
          <button 
            onClick={() => setRightOpen(!rightOpen)} 
            className="p-2 bg-white/5 hover:bg-white/10 text-amber-400 rounded-xl transition-colors border border-white/5 active:scale-95"
            title="Toggle Schedule"
          >
            <ChevronRight size={19} className={`transition-transform duration-300 ${rightOpen ? 'rotate-180 md:rotate-0' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Categories & Filters */}
        <aside className={`${leftOpen ? 'w-64 border-r' : 'w-0'} transition-all duration-300 border-white/10 bg-[#0b1220]/95 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden z-20`}>
          <div className="p-4 space-y-4">
            {/* Source Switcher Quick Filter */}
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <SlidersHorizontal size={12} /> Sources
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setSourceFilter(sourceFilter === 'LIVELIVE24' ? 'ALL' : 'LIVELIVE24')}
                  className={`px-2.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 justify-center border ${
                    sourceFilter === 'LIVELIVE24' 
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  <Flame size={12} /> LiveLive24
                </button>
                <button
                  onClick={() => setSourceFilter(sourceFilter === 'CAMEL1' ? 'ALL' : 'CAMEL1')}
                  className={`px-2.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 justify-center border ${
                    sourceFilter === 'CAMEL1' 
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  <Radio size={12} /> Camel1
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Categories
              </p>
              <div className="space-y-1">
                {categories.map(cat => {
                  const count = cat === 'All' 
                    ? allChannels.length 
                    : cat === 'Favorites' 
                      ? favorites.length 
                      : cat === 'Permanent' 
                        ? PERMANENT_CHANNELS.length 
                        : allChannels.filter(c => c.group === cat).length;

                  return (
                    <button 
                      key={cat} 
                      onClick={() => setCategory(cat)} 
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        selectedCategory === cat 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        selectedCategory === cat ? 'bg-black/20 text-black font-black' : 'bg-white/5 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permanent Channels Info */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
              <p className="text-[9px] text-amber-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={12} /> {PERMANENT_CHANNELS.length} Permanent Feeds Online
              </p>
            </div>
          </div>

          {/* Quick Select List in Left Sidebar */}
          <div className="flex-1 overflow-y-auto px-4 border-t border-white/5 pt-3 scrollbar-hide">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Live Feeds</p>
            <div className="space-y-1 pb-4">
              {filtered.slice(0, 40).map(c => (
                <button 
                  key={c.url} 
                  onClick={() => setCurrentChannel(c)} 
                  className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold truncate transition-all flex items-center gap-2 ${
                    currentChannel?.url === c.url 
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    currentChannel?.url === c.url ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-red-500 animate-pulse'
                  }`} />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-[#0b1220]/50"><DevCard /></div>
        </aside>

        {/* Center Main Stage (Player + Details) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#060b15] overflow-y-auto scrollbar-hide p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto w-full space-y-6">
            {allChannels.length === 0 && (
              <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
                <Info size={24} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-black text-sm uppercase">Waiting for Channel Feed</h4>
                  <p className="text-xs text-blue-200 mt-1">Please import an M3U playlist or run the crawler cycle to populate live matches.</p>
                </div>
              </div>
            )}
            
            {/* The Ultra-Modern Video Player */}
            <Player 
              key={currentChannel?.url} 
              channel={currentChannel} 
              onStall={autoSwitch}
              relatedServers={relatedServers}
              onSelectServer={setCurrentChannel}
            />
            
            {/* Active Match Details & Action Banner */}
            {currentChannel && (
              <div className="bg-[#0b1220]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE STREAM
                      </span>
                      
                      {currentChannel.group && (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                          {currentChannel.group}
                        </span>
                      )}

                      {currentChannel.source && (
                        <span className="px-2.5 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10 text-[10px] font-black uppercase tracking-wider">
                          SRC: {currentChannel.source}
                        </span>
                      )}

                      {currentChannel.isPermanent && (
                        <span className="px-2.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Star size={11} fill="currentColor" /> Permanent
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase italic leading-tight">
                      {currentChannel.name}
                    </h2>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={handleCopyCurrent}
                      title="Copy stream URL"
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-2 active:scale-95"
                    >
                      {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      <span>{copiedLink ? 'Copied' : 'Share URL'}</span>
                    </button>

                    <button
                      onClick={() => toggleFavorite(currentChannel.url)}
                      title="Toggle Favorite"
                      className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                        favorites.includes(currentChannel.url)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                      }`}
                    >
                      <Star size={18} fill={favorites.includes(currentChannel.url) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Developer Card (when left sidebar closed) */}
            {(!leftOpen || window.innerWidth < 768) && (
              <div className="mt-8 pb-16"><DevCard /></div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Broadcast Channels List */}
        <aside className={`${
          rightOpen ? 'w-full md:w-96 border-l fixed md:relative z-40 h-[calc(100vh-64px)]' : 'w-0'
        } transition-all duration-300 border-white/10 bg-[#0b1220]/95 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden right-0`}>
          {/* Search Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0b1220]/80 backdrop-blur-md gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search matches, leagues, servers..." 
                className="w-full bg-[#060b15] border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button 
              onClick={() => setRightOpen(false)} 
              className="md:hidden p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white"
            >
              <X size={18}/>
            </button>
          </div>

          {/* Channels Cards */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2.5 scrollbar-hide pb-24">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase tracking-wider">No matching broadcasts</p>
                <p className="text-[10px] mt-1">Try another search or clear the filter</p>
              </div>
            ) : (
              filtered.map(channel => {
                const isSelected = currentChannel?.url === channel.url;
                const isFav = favorites.includes(channel.url);

                // Detect server tag in title
                const serverMatch = channel.name?.match(/\[SERVER\s*(\d+)(?:\s*-\s*([A-Za-z0-9]+))?\]/i);
                const displayTitle = serverMatch 
                  ? channel.name.replace(/\[SERVER\s*\d+[^\]]*\]/gi, '').trim()
                  : channel.name;
                const serverBadge = serverMatch ? `SRV ${serverMatch[1]} ${serverMatch[2] || ''}` : null;

                return (
                  <div 
                    key={channel.url} 
                    onClick={() => { 
                      setCurrentChannel(channel); 
                      if (window.innerWidth < 768) setRightOpen(false); 
                    }} 
                    className={`group p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center gap-3.5 relative overflow-hidden ${
                      isSelected 
                        ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.15)]' 
                        : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/[0.08]'
                    }`}
                  >
                    {/* Active Edge Indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                    )}

                    {/* Logo / Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105 ${
                      isSelected ? 'bg-amber-500 shadow-md shadow-amber-500/25' : 'bg-[#060b15] border border-white/5'
                    }`}>
                      {channel.logo ? (
                        <img src={channel.logo} className="w-full h-full object-contain p-1" alt="" />
                      ) : (
                        <Globe size={22} className={isSelected ? 'text-black' : 'text-slate-500'} />
                      )}
                    </div>

                    {/* Channel Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={`text-xs font-black truncate uppercase tracking-tight ${
                          isSelected ? 'text-amber-400' : 'text-white'
                        }`}>
                          {displayTitle}
                        </h4>
                        {channel.isPermanent && (
                          <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {serverBadge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black uppercase">
                            {serverBadge}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 uppercase font-black truncate">
                          {channel.source || channel.group}
                        </span>
                        {channel.status === 'live' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite(channel.url); 
                      }} 
                      className={`p-1.5 rounded-lg transition-transform active:scale-75 ${
                        isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'
                      }`}
                    >
                      <Star size={18} fill={isFav ? "currentColor" : "none"} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="bg-[#0b1220] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-white text-base uppercase flex items-center gap-2">
                <Keyboard size={18} className="text-amber-400" /> Hotkeys
              </h3>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Play / Pause</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[11px] font-mono font-bold">Space / K</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Mute / Unmute</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[11px] font-mono font-bold">M</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Fullscreen Toggle</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[11px] font-mono font-bold">F</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Picture in Picture</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[11px] font-mono font-bold">P</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Reload / Reconnect</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[11px] font-mono font-bold">R</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Volume Adjust</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[11px] font-mono font-bold">↑ / ↓</kbd>
              </div>
            </div>

            <button 
              onClick={() => setShowShortcuts(false)}
              className="w-full py-2.5 bg-amber-500 text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-amber-500/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}