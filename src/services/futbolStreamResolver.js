/**
 * FutbolX Live Stream & Flussonic Token Resolver
 * Mints fresh, valid 900-second stream tokens on the fly from FutbolX API
 */

export async function refreshFutbolXStreamUrl(currentUrl) {
  if (!currentUrl) return currentUrl;

  try {
    const parsed = new URL(currentUrl);
    const pathname = parsed.pathname;
    const hostname = parsed.hostname;

    // Check if this is a FutbolX Flussonic stream
    if (!hostname.includes('futx.nx.kg') && !hostname.includes('futbol-x')) {
      return currentUrl;
    }

    const tokenEndpoint = `https://www.futbol-x.xyz/api/token.js?path=${encodeURIComponent(pathname)}&sourceHost=${hostname}&expires=900`;
    
    const res = await fetch(tokenEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('[FutbolX Resolver] Dynamic token minting failed:', err.message);
  }

  return currentUrl;
}
