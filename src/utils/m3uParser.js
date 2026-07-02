export const parseM3U = (data) => {
  const lines = data.split(/\r?\n/);
  const channels = [];
  let currentChannel = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 1. Capture metadata from #EXTINF lines
    if (line.startsWith('#EXTINF:')) {
      const info = line.split('#EXTINF:')[1];
      const name = info.split(',').pop()?.trim() || 'Unknown Channel';
      const logoMatch = info.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = info.match(/group-title="([^"]+)"/i);
      
      currentChannel = {
        name: name,
        logo: logoMatch ? logoMatch[1].trim() : null,
        group: groupMatch ? groupMatch[1].trim() : 'General',
      };
    } 
    // 2. Ignore non-URL comment lines (like #EXTVLCOPT or #EXTGRP) that some .ts playlists inject
    else if (line.startsWith('#')) {
      continue;
    } 
    // 3. Capture stream URL (Supports HTTP, HTTPS, RTMP, RTSP - for .ts, .m3u8, .mp4, .flv, etc.)
    else if ((line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('rtsp://')) && currentChannel) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null; // Reset for the next channel
    }
  }
  
  return channels;
};