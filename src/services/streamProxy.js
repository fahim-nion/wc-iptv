const PROXY = import.meta.env.VITE_PROXY_URL;

export function getStreamUrl(channelOrUrl) {
  const url = typeof channelOrUrl === 'string' ? channelOrUrl : (channelOrUrl?.url || '');
  const source = typeof channelOrUrl === 'string' ? '' : (channelOrUrl?.source || '');

  if (!url) return '';

  if (PROXY && PROXY.length > 0) {
    if (url.startsWith(PROXY)) return url;
    return `${PROXY}?url=${encodeURIComponent(url)}`;
  }
  
  // Auto-route streams that restrict CORS (HesGoal / kora-plus.li / edgestream / xyzstreams) through the built-in proxy
  const isCorsRestricted = 
    source.toLowerCase().includes('hesgoal') ||
    source.toLowerCase().includes('xyzstreams') ||
    url.includes('fancy-shark151.workers.dev') ||
    url.includes('tokenized.b-cdn.net') ||
    url.includes('xyzstreams.space') ||
    url.includes('kora-plus.li') || 
    url.includes('edgestream') || 
    url.includes('goalakor.space') || 
    url.includes('kora-api') ||
    url.includes('robotiva.online') ||
    url.includes('indianservers.st') ||
    source.toLowerCase().includes('ppv');

  if (isCorsRestricted) {
    if (url.includes('/api/stream?url=')) return url;
    return `/api/stream?url=${encodeURIComponent(url)}`;
  }

  return url;
}