const PROXY = import.meta.env.VITE_PROXY_URL;

export function getStreamUrl(channelOrUrl) {
  const url = typeof channelOrUrl === 'string' ? channelOrUrl : (channelOrUrl?.url || '');
  const source = typeof channelOrUrl === 'string' ? '' : (channelOrUrl?.source || '');

  if (!url) return '';

  if (PROXY && PROXY.length > 0) {
    if (url.startsWith(PROXY)) return url;
    return `${PROXY}?url=${encodeURIComponent(url)}`;
  }
  
  // Auto-route streams that restrict CORS (HesGoal / kora-plus / camel / edgestream / xyzstreams / etc) through the built-in proxy
  const isCorsRestricted = 
    source.toLowerCase().includes('hesgoal') ||
    source.toLowerCase().includes('xyzstreams') ||
    source.toLowerCase().includes('camel') ||
    source.toLowerCase().includes('aurasports') ||
    source.toLowerCase().includes('falconstreams') ||
    url.includes('camel4.live') ||
    url.includes('camel1.tv') ||
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
    url.includes('robotiva');

  if (isCorsRestricted) {
    if (url.includes('/api/stream?url=') || url.includes('/.netlify/functions/stream?url=')) return url;
    return `/api/stream?url=${encodeURIComponent(url)}`;
  }

  return url;
}
