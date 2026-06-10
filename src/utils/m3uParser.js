export const parseM3U = (data) => {
  const lines = data.split('\n');
  const channels = [];
  let currentChannel = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const info = line.split('#EXTINF:')[1];
      const name = info.split(',').pop();
      const logoMatch = info.match(/tvg-logo="([^"]+)"/);
      const groupMatch = info.match(/group-title="([^"]+)"/);
      currentChannel = {
        name: name || 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'General',
      };
    } else if (line.startsWith('http') && currentChannel) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null;
    }
  }
  return channels;
};