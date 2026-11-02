const PROXY = import.meta.env.VITE_PROXY_URL;

export function getStreamUrl(channelOrUrl) {
  const url = typeof channelOrUrl === 'string' ? channelOrUrl : (channelOrUrl?.url || '');
  const source = typeof channelOrUrl === 'string' ? '' : (channelOrUrl?.source || '');
  const type = typeof channelOrUrl === 'string' ? '' : (channelOrUrl?.type || '');

  if (!url) return '';

  // Never proxy IFRAME embeds (BinTV, StreamCorner, Youtube, PPV, etc)
  if (
    type === 'IFRAME' || 
    url.includes('bintv-sources') || 
    url.includes('/embed/') || 
    url.includes('ehgembxe') ||
    url.includes('taifood-blog')
  ) {
    return url;
  }

  if (PROXY && PROXY.length > 0) {
    const cleanProxy = PROXY.replace(/\/+$/, '');
    if (url.startsWith(cleanProxy)) return url;
    return `${cleanProxy}?url=${encodeURIComponent(url)}`;
  }
  
  // Auto-route streams that restrict CORS (HesGoal / kora-plus / camel / edgestream / xyzstreams / etc) through the built-in proxy
  const isCorsRestricted = 
    source.toLowerCase().includes('hesgoal') ||
    source.toLowerCase().includes('xyzstreams') ||
    source.toLowerCase().includes('camel') ||
    source.toLowerCase().includes('aurasports') ||
    source.toLowerCase().includes('falconstreams') ||
    source.toLowerCase().includes('bintv') ||
    url.includes('camel4.live') ||
    url.includes('camel1.tv') ||
    url.includes('duckdns.org') ||
    url.includes('kozow.com') ||
    url.includes('iximiuz.com') ||
    url.includes('xyzstreams') ||
    url.includes('workers.dev') ||
    url.includes('fancy-shark151.workers.dev') ||
    url.includes('tokenized.b-cdn.net') ||
    url.includes('xyzstreams.space') ||
    url.includes('kora-plus') || 
    url.includes('edgestream') || 
    url.includes('streame.center') ||
    url.includes('cyberbingo') ||
    url.includes('goalakor') || 
    url.includes('goalikor') ||
    url.includes('kora-api') ||
    url.includes('robotiva') ||
    url.includes('uzhi.ru') ||
    url.includes('sytes.net');

  if (isCorsRestricted) {
    if (url.includes('/api/stream?url=') || url.includes('/.netlify/functions/stream?url=')) return url;
    return `/api/stream?url=${encodeURIComponent(url)}`;
  }

  return url;
}
