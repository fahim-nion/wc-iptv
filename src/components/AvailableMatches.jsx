import React, { useState, useMemo } from 'react';
import { getTeamLogo } from '../utils/teamLogos';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Server, 
  Search, 
  Play, 
  CheckCircle2, 
  Radio, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function AvailableMatches({ 
  channels = [], 
  currentChannel = null, 
  onSelectChannel, 
  updatedAt = null 
}) {
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');

  // Format crawl timestamp (relative + absolute)
  const formattedTimestamp = useMemo(() => {
    if (!updatedAt) return 'Updated recently';
    try {
      const date = new Date(updatedAt);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / (1000 * 60));

      let relative = '';
      if (diffMinutes < 1) relative = 'Just now';
      else if (diffMinutes === 1) relative = '1 min ago';
      else if (diffMinutes < 60) relative = `${diffMinutes} mins ago`;
      else relative = `${Math.floor(diffMinutes / 60)}h ago`;

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${timeStr} (${relative})`;
    } catch (e) {
      return updatedAt;
    }
  }, [updatedAt]);

  // Group multiple stream links into consolidated unique matches
  const groupedMatches = useMemo(() => {
    const map = new Map();

    for (const ch of channels) {
      if (ch.isPermanent) continue; // Exclude permanent 24/7 channels from match grid
      const rawTitle = ch.name || ch.title || '';
      if (!rawTitle) continue;

      // Extract base match title by removing server and quality brackets
      const baseTitle = rawTitle
        .replace(/\[SERVER\s*[^\]]*\]/gi, '')
        .replace(/\[(HD|SD|FHD|720P|1080P)\]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Normalize key for grouping
      const key = baseTitle.toUpperCase();

      if (!map.has(key)) {
        // Parse teams
        let team1 = baseTitle;
        let team2 = '';
        if (baseTitle.includes(' VS ') || baseTitle.includes(' vs ')) {
          const parts = baseTitle.split(/\s+(?:VS|vs)\s+/i);
          team1 = parts[0]?.trim() || '';
          team2 = parts[1]?.trim() || '';
        } else if (baseTitle.includes(' @ ')) {
          const parts = baseTitle.split(' @ ');
          team1 = parts[1]?.trim() || '';
          team2 = parts[0]?.trim() || '';
        }

        map.set(key, {
          id: ch.id || key,
          baseTitle,
          team1,
          team2,
          team1Logo: getTeamLogo(team1),
          team2Logo: getTeamLogo(team2),
          group: ch.group || 'Live Football',
          servers: [ch],
          primaryChannel: ch,
          sources: new Set([ch.source || 'IPTV'])
        });
      } else {
        const item = map.get(key);
        item.servers.push(ch);
        if (ch.source) item.sources.add(ch.source);
      }
    }

    return Array.from(map.values());
  }, [channels]);

  // Filter matches based on search and source
  const filteredMatches = useMemo(() => {
    return groupedMatches.filter(m => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        m.baseTitle.toLowerCase().includes(q) || 
        m.team1.toLowerCase().includes(q) || 
        m.team2.toLowerCase().includes(q) ||
        m.group.toLowerCase().includes(q);

      const matchSource = filterSource === 'ALL' || 
        Array.from(m.sources).some(s => s.toUpperCase().includes(filterSource));

      return matchSearch && matchSource;
    });
  }, [groupedMatches, search, filterSource]);

  return (
    <section id="available-matches-section" className="bg-gradient-to-b from-[#0c1427]/80 to-[#070b14]/90 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-5 scroll-mt-20">
      {/* Header with Title and Last Crawling Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/15">
            <Trophy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white uppercase italic tracking-tight">
                Available Matches Now
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-[10px] font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {groupedMatches.length} Live Fixtures
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Select any live match below to broadcast instantly with multi-server backup
            </p>
          </div>
        </div>

        {/* Crawling Timestamp Stamp */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs self-start sm:self-center shrink-0">
          <Clock size={14} className="text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Last Crawl
            </span>
            <span className="text-[11px] font-bold text-white font-mono">
              {formattedTimestamp}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1 animate-pulse" title="Crawler Active" />
        </div>
      </div>

      {/* Search & Source Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input 
            type="text" 
            placeholder="Search teams or fixture..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#060b15]/80 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Quick Source Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
          {['ALL', 'FUTBOLX', '90MIN', 'BINTV', 'LIVELIVE24'].map(src => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border ${
                filterSource === src
                  ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
              }`}
            >
              {src === 'ALL' ? 'All Sources' : src}
            </button>
          ))}
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl bg-black/20">
          <Trophy size={28} className="mx-auto mb-2 opacity-40 text-amber-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No matches found</p>
          <p className="text-[10px] mt-0.5">Try a different team search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMatches.map(match => {
            const isCurrentPlaying = currentChannel && match.servers.some(s => s.url === currentChannel.url);

            return (
              <div 
                key={match.id}
                onClick={() => {
                  if (onSelectChannel) {
                    onSelectChannel(match.primaryChannel);
                    // Smooth scroll up to player
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`group relative p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between overflow-hidden active:scale-[0.98] ${
                  isCurrentPlaying
                    ? 'bg-gradient-to-br from-amber-500/20 via-[#0b1626] to-[#070b14] border-amber-500 shadow-lg shadow-amber-500/15 ring-1 ring-amber-500/40'
                    : 'bg-[#060b15]/70 hover:bg-[#0c1427] border-white/10 hover:border-white/20 shadow-md'
                }`}
              >
                {/* Active Indicator Glow */}
                {isCurrentPlaying && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black uppercase rounded-bl-lg flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    Now Playing
                  </div>
                )}

                {/* Team Badges & Names */}
                <div className="space-y-2.5">
                  {/* Team 1 */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-sm">
                      {match.team1Logo ? (
                        <img 
                          src={match.team1Logo} 
                          alt="" 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-[10px] font-black text-amber-400 font-mono">
                          {match.team1.slice(0, 3)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-amber-400 transition-colors">
                      {match.team1}
                    </span>
                  </div>

                  {/* Team 2 */}
                  {match.team2 && (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-sm">
                        {match.team2Logo ? (
                          <img 
                            src={match.team2Logo} 
                            alt="" 
                            className="w-full h-full object-contain" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 font-mono">
                            {match.team2.slice(0, 3)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-amber-400 transition-colors">
                        {match.team2}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Badges & Watch Action */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Server Count Pill */}
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black uppercase text-amber-400 flex items-center gap-1">
                      <Server size={10} />
                      {match.servers.length} {match.servers.length === 1 ? 'Server' : 'Servers'}
                    </span>

                    {/* Quality badge if any */}
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[9px] font-black uppercase">
                      HD
                    </span>
                  </div>

                  <button className="text-[10px] font-black text-amber-400 hover:text-white uppercase flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Watch</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
