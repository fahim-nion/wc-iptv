import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from './store/useStore';
import { parseM3U } from './utils/m3uParser';
import { mapJsonToChannels } from './utils/channelMapper';
import Player from './components/Player';
import AvailableMatches from './components/AvailableMatches';
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
  Share2,
  Shield,
  Clock
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
    setCategory,
    streamDelayEnabled,
    toggleStreamDelay,
    hasSeenDelayNotice,
    dismissDelayNotice
  } = useStore();

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [onlineCount] = useState(Math.floor(Math.random() * 85) + 342);
  const [allChannels, setAllChannels] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | 'LIVELIVE24' | 'CAMEL1' | 'PERMANENT'
  const [permanentSearch, setPermanentSearch] = useState('');

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

  // Helper to extract base match title (ignoring server tags, club affixes) and normalizing team names
  const getBaseMatchTitle = (title = '') => {
    if (!title) return '';
    let base = title
      .replace(/\[SERVER\s*[^\]]*\]/gi, '')
      .replace(/\[(HD|SD|FHD|720P|1080P)\]/gi, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(FOOTBALL CLUB|CAU LAC BO BONG DA|CAU LAC BO|CLB|SPORTS CLUB|SPORT CLUB|FC|CF|AC|RC|SC|ESTAC|UD|CD|CA|FK|SK|AS|SSC|RCD)\b/gi, '')
      .replace(/\bATHLETIC CLUB\b/gi, 'ATHLETIC BILBAO')
      .replace(/\bFC BARCELONA\b|\bBARCA\b/gi, 'BARCELONA')
      .replace(/\bREAL BETIS BALOMPIE\b/gi, 'REAL BETIS')
      .replace(/\bFC BAYERN MUNICH\b|\bBAYERN MUNCHEN\b/gi, 'BAYERN MUNICH')
      .replace(/\bINTER MILAN\b|\bINTERNAZIONALE\b/gi, 'INTER')
      .replace(/\bPARIS SAINT-GERMAIN\b|\bPARIS SG\b|\bPSG\b/gi, 'PARIS SAINT GERMAIN')
      .replace(/\bMANCHESTER UNITED\b/gi, 'MAN UTD')
      .replace(/\bMANCHESTER CITY\b/gi, 'MAN CITY')
      .replace(/\bSPORTING LISBON\b/gi, 'SPORTING CP')
      .replace(/\bNEWCASTLE UNITED\b/gi, 'NEWCASTLE')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    if (base.includes(' VS ')) {
      const parts = base.split(' VS ').map(p => p.trim());
      if (parts.length === 2) {
        return parts.sort().join(' VS ');
      }
    }
    return base;
  };

  // Find all sibling servers for current match
  const relatedServers = useMemo(() => {
    if (!currentChannel?.name) return [];
    const base = getBaseMatchTitle(currentChannel.name);
    
    // 1. Exact match on normalized base title
    const exactMatches = allChannels.filter(c => getBaseMatchTitle(c.name) === base);
    if (exactMatches.length > 1) return exactMatches;

    // 2. Fuzzy team-name overlap matching (handles variations in naming across sources)
    if (base.includes(' VS ')) {
      const [currT1, currT2] = base.split(' VS ').map(t => t.trim());
      const c1Words = currT1.split(' ').filter(w => w.length > 2);
      const c2Words = currT2.split(' ').filter(w => w.length > 2);

      const fuzzyMatches = allChannels.filter(c => {
        const cBase = getBaseMatchTitle(c.name);
        if (cBase === base) return true;
        if (!cBase.includes(' VS ')) return false;
        const [t1, t2] = cBase.split(' VS ').map(t => t.trim());

        const matchDirect = 
          c1Words.some(w => t1.includes(w)) && c2Words.some(w => t2.includes(w));
        const matchReverse = 
          c1Words.some(w => t2.includes(w)) && c2Words.some(w => t1.includes(w));

        return matchDirect || matchReverse;
      });

      if (fuzzyMatches.length > 0) return fuzzyMatches;
    }

    return exactMatches;
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
      else if (sourceFilter === 'HESGOAL') matchesSource = (c.source || '').toLowerCase().includes('hesgoal');
      else if (sourceFilter === 'CAMEL1') matchesSource = (c.source || '').toLowerCase().includes('camel1');
      else if (sourceFilter === 'PERMANENT') matchesSource = !!c.isPermanent;

      return matchesSearch && matchesCategory && matchesSource;
    });
  }, [allChannels, searchQuery, selectedCategory, favorites, sourceFilter]);

  // Filter permanent 24/7 channels for right sidebar
  const filteredPermanent = useMemo(() => {
    const q = permanentSearch.toLowerCase().trim();
    return PERMANENT_CHANNELS.filter(c => {
      if (!q) return true;
      return (c.name || '').toLowerCase().includes(q) ||
             (c.country || '').toLowerCase().includes(q) ||
             (c.group || '').toLowerCase().includes(q);
    });
  }, [permanentSearch]);

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
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setSourceFilter(sourceFilter === 'LIVELIVE24' ? 'ALL' : 'LIVELIVE24')}
                  className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 justify-center border ${
                    sourceFilter === 'LIVELIVE24' 
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  <Flame size={12} /> Live24
                </button>
                <button
                  onClick={() => setSourceFilter(sourceFilter === 'HESGOAL' ? 'ALL' : 'HESGOAL')}
                  className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 justify-center border ${
                    sourceFilter === 'HESGOAL' 
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  <Globe size={12} /> HesGoal
                </button>
                <button
                  onClick={() => setSourceFilter(sourceFilter === 'CAMEL1' ? 'ALL' : 'CAMEL1')}
                  className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 justify-center border ${
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

          {/* Quick Navigation in Left Sidebar (Matches moved to main page) */}
          <div className="flex-1 overflow-y-auto px-4 border-t border-white/5 pt-3 scrollbar-hide space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick Navigation</p>
            
            <button
              onClick={() => {
                const el = document.getElementById('available-matches-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full text-left p-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between bg-white/5 hover:bg-amber-500 hover:text-black text-white border border-white/5 group"
            >
              <div className="flex items-center gap-2">
                <Trophy size={15} className="text-amber-400 group-hover:text-black transition-colors" />
                <span>Live Match Fixtures</span>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-black" />
            </button>

            <button
              onClick={() => setRightOpen(true)}
              className="w-full text-left p-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between bg-white/5 hover:bg-white/10 text-white border border-white/5 group"
            >
              <div className="flex items-center gap-2">
                <Star size={15} className="text-amber-400 fill-amber-400" />
                <span>Permanent 24/7 Channels</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold">
                {PERMANENT_CHANNELS.length}
              </span>
            </button>
          </div>

          <div className="p-4 border-t border-white/5 bg-[#0b1220]/50"><DevCard /></div>
        </aside>

        {/* Center Main Stage (Player + Details) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#060b15] overflow-y-auto scrollbar-hide p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto w-full space-y-6">
            {/* Anti-Lag 10s Buffer User Notification Banner */}
            {!hasSeenDelayNotice && (
              <div className="bg-gradient-to-r from-emerald-950/80 via-[#0b1626]/95 to-[#0b1220]/95 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0 shadow-lg shadow-emerald-500/10">
                    <Shield size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase">
                        Anti-Lag 10s Buffer Enabled by Default
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-relaxed">
                      Streams automatically preload a 10-second buffer for smooth, lag-free viewing. You can toggle between 10s Buffer and Real-Time anytime.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => toggleStreamDelay()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95 ${
                      streamDelayEnabled
                        ? 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                        : 'bg-emerald-500 text-black border-emerald-400 font-black'
                    }`}
                  >
                    {streamDelayEnabled ? (
                      <>
                        <Zap size={12} className="text-amber-400" />
                        <span>Switch to Real-Time</span>
                      </>
                    ) : (
                      <>
                        <Shield size={12} />
                        <span>Enable 10s Buffer</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => dismissDelayNotice()}
                    className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-emerald-500/30 active:scale-95 flex items-center gap-1"
                  >
                    <Check size={14} /> Got It
                  </button>
                </div>
              </div>
            )}

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
              streamDelayEnabled={streamDelayEnabled}
              onToggleDelay={toggleStreamDelay}
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
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {/* 10s Buffer Toggle Button */}
                    <button
                      onClick={() => toggleStreamDelay()}
                      title={streamDelayEnabled ? "10s Buffer Delay is ON. Click to switch to Real-Time." : "Real-time is ON (0s Delay). Click to add 10s buffer."}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 active:scale-95 ${
                        streamDelayEnabled
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-black shadow-sm shadow-emerald-500/10'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                      }`}
                    >
                      {streamDelayEnabled ? (
                        <>
                          <Shield size={16} className="text-emerald-400" />
                          <span>10s Buffer: ON</span>
                        </>
                      ) : (
                        <>
                          <Zap size={16} className="text-amber-400" />
                          <span>Buffer: OFF</span>
                        </>
                      )}
                    </button>

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

            {/* Live & Available Matches Section (With Crawl Timestamp) */}
            <AvailableMatches 
              channels={allChannels}
              currentChannel={currentChannel}
              onSelectChannel={setCurrentChannel}
              updatedAt={channelData.updatedAt}
            />

            {/* Developer Card (Positioned directly below Available Matches) */}
            <div className="pt-2 pb-16">
              <DevCard />
            </div>
          </div>
        </main>

        {/* Right Sidebar: Permanent 24/7 Channels List (Only Permanent TV Channels) */}
        <aside className={`${
          rightOpen ? 'w-full md:w-96 border-l fixed md:relative z-40 h-[calc(100vh-64px)]' : 'w-0'
        } transition-all duration-300 border-white/10 bg-[#0b1220]/95 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden right-0`}>
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex flex-col gap-3 shrink-0 bg-[#0b1220]/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Star size={16} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                    Permanent TV Channels
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {PERMANENT_CHANNELS.length} 24/7 Official Feeds
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setRightOpen(false)} 
                className="md:hidden p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white"
              >
                <X size={18}/>
              </button>
            </div>

            {/* Search Permanent Channels */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search TV channels, countries (beIN, S Sport, T Sports)..." 
                className="w-full bg-[#060b15] border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all" 
                value={permanentSearch} 
                onChange={(e) => setPermanentSearch(e.target.value)} 
              />
              {permanentSearch && (
                <button 
                  onClick={() => setPermanentSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Permanent Channels Cards */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2.5 scrollbar-hide pb-24">
            {filteredPermanent.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Search size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase tracking-wider">No matching channels</p>
                <p className="text-[10px] mt-1">Try another channel name or country</p>
              </div>
            ) : (
              filteredPermanent.map((channel, idx) => {
                const isSelected = currentChannel?.url === channel.url;
                const isFav = (favorites || []).includes(channel.url);

                return (
                  <div 
                    key={channel.id || `${channel.url}-${idx}`} 
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

                    {/* Real Official Channel Logo */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105 p-1 ${
                      isSelected ? 'bg-amber-500/20 border border-amber-500/40 shadow-md shadow-amber-500/20' : 'bg-[#060b15] border border-white/10'
                    }`}>
                      {channel.logo ? (
                        <img 
                          src={channel.logo} 
                          className="w-full h-full object-contain" 
                          alt="" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Globe size={20} className={isSelected ? 'text-amber-400' : 'text-slate-500'} />
                      )}
                    </div>

                    {/* Channel Info & Real Country Badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={`text-xs font-black truncate uppercase tracking-tight ${
                          isSelected ? 'text-amber-400' : 'text-white'
                        }`}>
                          {channel.name}
                        </h4>
                        <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {/* Real Country Flag & Name */}
                        {channel.country && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {channel.countryFlag && (
                              <img src={channel.countryFlag} className="w-3.5 h-2.5 object-cover rounded-xs" alt="" />
                            )}
                            <span className="truncate max-w-[95px]">{channel.country}</span>
                          </span>
                        )}

                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-black uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          24/7 LIVE
                        </span>
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
                      <Star size={16} fill={isFav ? "currentColor" : "none"} />
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
                <span className="text-slate-400">10s Buffer / Real-Time</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[11px] font-mono font-bold">B</kbd>
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