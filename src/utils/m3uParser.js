export const parseM3U = (data) => {
  const lines = data.split('\n');
  const channels = [];
  let currentChannel = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const name = line.split(',').pop();
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      
      currentChannel = {
        name: name || 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'General',
      };
    } else if (line.startsWith('http')) {
      if (currentChannel) {
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }
  }
  return channels;
};