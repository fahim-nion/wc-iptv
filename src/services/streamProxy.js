const PROXY = import.meta.env.VITE_PROXY_URL;

export function getStreamUrl(url) {
  if (!url) return '';

  if (PROXY && PROXY.length > 0) {
    if (url.startsWith(PROXY)) return url;
    return `${PROXY}?url=${encodeURIComponent(url)}`;
  }
  
  // Auto-route streams that restrict CORS (HesGoal / kora-plus.li) through the built-in proxy
  const isCorsRestricted = 
    url.includes('kora-plus.li') || 
    url.includes('goalakor.space') || 
    url.includes('kora-api') ||
    url.includes('robotiva.online');

  if (isCorsRestricted) {
    if (url.includes('/api/stream?url=')) return url;
    return `/api/stream?url=${encodeURIComponent(url)}`;
  }

  return url;
}