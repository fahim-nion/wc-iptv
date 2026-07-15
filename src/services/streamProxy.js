const PROXY = import.meta.env.VITE_PROXY_URL;

/**
 * Wraps the stream URL with a proxy if defined in the environment.
 * Expects backend to handle: /proxy?url=...
 */
export function getStreamUrl(url) {
  if (!PROXY || PROXY.length === 0) {
    return url;
  }
  
  // Ensure we don't double-proxy
  if (url.startsWith(PROXY)) return url;

  return `${PROXY}?url=${encodeURIComponent(url)}`;
}