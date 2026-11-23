import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function streamProxyPlugin() {
  const handler = async (req, res, next) => {
    if (!req.url.startsWith('/api/stream') && !req.url.startsWith('/.netlify/functions/stream')) {
      return next();
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.statusCode = 204;
      return res.end();
    }

    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const targetUrl = parsedUrl.searchParams.get('url');

      if (!targetUrl || !targetUrl.startsWith('http')) {
        res.statusCode = 400;
        return res.end('Invalid URL');
      }

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
      if (req.headers.range) headers['Range'] = req.headers.range;

      const isXyzStream = 
        targetUrl.includes('duckdns.org') ||
        targetUrl.includes('kozow.com') ||
        targetUrl.includes('iximiuz.com') ||
        targetUrl.includes('xyzstreams') ||
        targetUrl.includes('workers.dev') ||
        targetUrl.includes('fancy-shark151.workers.dev') || 
        targetUrl.includes('tokenized.b-cdn.net') || 
        targetUrl.includes('xyzstreams.space');

      if (isXyzStream) {
        headers['Referer'] = 'https://xyzstreams.st/';
        headers['Origin'] = 'https://xyzstreams.st';
        const token = parsedUrl.searchParams.get('token') || new URL(targetUrl).searchParams.get('token');
        if (token) headers['x-token'] = token;
      } else if (targetUrl.includes('camel4.live') || targetUrl.includes('camel1.tv')) {
        headers['Referer'] = 'https://www.camel1.tv/';
        headers['Origin'] = 'https://www.camel1.tv';
      } else if (targetUrl.includes('edgestream') || targetUrl.includes('streame.center') || targetUrl.includes('cyberbingo')) {
        headers['Referer'] = 'https://streame.center/';
        headers['Origin'] = 'https://streame.center';
      } else if (targetUrl.includes('kora-plus') || targetUrl.includes('goalakor') || targetUrl.includes('goalikor') || targetUrl.includes('kora-api')) {
        headers['Referer'] = 'https://goalakor.space/';
        headers['Origin'] = 'https://goalakor.space';
      } else if (targetUrl.includes('evrenesoglu') || targetUrl.includes('mahsunsports')) {
        headers['Referer'] = 'https://mahsunsports.xyz/';
        headers['Origin'] = 'https://mahsunsports.xyz';
      }

      const response = await fetch(targetUrl, { 
        headers, 
        redirect: 'manual',
        signal: AbortSignal.timeout(15000)
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

      if (response.status >= 300 && response.status < 400) {
        res.statusCode = 410;
        return res.end('Stream Expired');
      }

      if (!response.ok && response.status !== 206) {
        res.statusCode = response.status;
        return res.end('Upstream Error');
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        res.statusCode = 502;
        return res.end('Invalid Stream Format');
      }

      const isPlaylist = contentType.includes('mpegurl') || targetUrl.includes('.m3u8');

      if (isPlaylist) {
        const text = await response.text();
        const baseUrl = '/api/stream';

        const rewriteUri = (uri) => {
          try {
            const abs = new URL(uri, targetUrl);
            const targetParams = new URL(targetUrl).searchParams;
            for (const [key, val] of targetParams.entries()) {
              if (!abs.searchParams.has(key)) {
                abs.searchParams.set(key, val);
              }
            }
            if (abs.hostname.includes('tiktokcdn.com') || abs.hostname.includes('camel4.live') || abs.hostname.includes('camel1.tv')) {
              return abs.href;
            }
            return `${baseUrl}?url=${encodeURIComponent(abs.href)}`;
          } catch (e) {
            return uri;
          }
        };

        const rewrittenPlaylist = text.split(/\r?\n/).map(line => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith('#')) {
            return line.replace(/URI="([^"]+)"/g, (match, uri) => `URI="${rewriteUri(uri)}"`);
          }
          return rewriteUri(trimmed);
        }).join('\n');

        res.setHeader('Content-Type', contentType || 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache');
        return res.end(rewrittenPlaylist);
      }

      if (contentType) res.setHeader('Content-Type', contentType);
      const contentLen = response.headers.get('content-length');
      if (contentLen) res.setHeader('Content-Length', contentLen);
      const acceptRanges = response.headers.get('accept-ranges');
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

      res.statusCode = response.status;
      const arrayBuffer = await response.arrayBuffer();
      return res.end(Buffer.from(arrayBuffer));
    } catch (err) {
      if (req.destroyed || res.destroyed || err.name === 'AbortError' || err.message?.includes('terminated')) {
        // Normal client-side stream cancellation or channel switch
        return;
      }
      console.warn(`[Stream Proxy] Stream notice (${err.message}) for:`, targetUrl?.substring(0, 80));
      if (!res.headersSent) {
        res.statusCode = 502;
        return res.end('Proxy Error');
      }
    }
  };

  return {
    name: 'stream-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

function embedProxyPlugin() {
  const handler = async (req, res, next) => {
    if (!req.url.startsWith('/api/embed') && !req.url.startsWith('/.netlify/functions/embed')) {
      return next();
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.statusCode = 204;
      return res.end();
    }

    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      let targetUrl = parsedUrl.searchParams.get('url');

      if (!targetUrl || !targetUrl.startsWith('http')) {
        res.statusCode = 400;
        return res.end('Invalid URL');
      }

      if (targetUrl.includes('embedsports.me/a/')) {
        targetUrl = targetUrl.replace('embedsports.me/a/', 'sportsframe.me/a/');
      }

      let defaultReferer = 'https://fc26.netlify.app/';
      if (targetUrl.includes('taifood-blog') || targetUrl.includes('ppv')) {
        defaultReferer = 'https://ppv.land/';
      } else if (targetUrl.includes('thedaddy') || targetUrl.includes('dembed')) {
        defaultReferer = 'https://thedaddy.li/';
      } else if (targetUrl.includes('bintv')) {
        defaultReferer = 'https://www.bintv.cc/';
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': defaultReferer,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'iframe',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'cross-site'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        res.statusCode = response.status;
        return res.end(`Upstream error: HTTP ${response.status}`);
      }

      const finalUrl = response.url || targetUrl;
      let finalOrigin = '';
      try {
        finalOrigin = new URL(finalUrl).origin;
      } catch (e) {
        finalOrigin = targetUrl.split('/').slice(0, 3).join('/');
      }

      let html = await response.text();

      // Base tag
      if (!html.includes('<base')) {
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>\n<base href="${finalOrigin}/">\n`);
        } else if (html.includes('<html')) {
          html = html.replace(/<html[^>]*>/i, `$&<head><base href="${finalOrigin}/"></head>`);
        }
      }

      // Shield script
      const shieldScript = `
<script>
(function() {
  try {
    window.open = function() {
      console.warn('[Shield] Blocked popup window.open call');
      return null;
    };
    Object.defineProperty(window, 'open', {
      value: function() { return null; },
      writable: false,
      configurable: false
    });
  } catch(e) {}

  window.sandDetect = function() {};

  try {
    if (!document.referrer) {
      Object.defineProperty(document, 'referrer', {
        value: ${JSON.stringify(finalUrl)},
        configurable: true
      });
    }
  } catch(e) {}

  const origAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'click' || type === 'mousedown' || type === 'pointerdown' || type === 'mouseup') {
      const fnStr = (listener && listener.toString) ? listener.toString() : '';
      if (
        fnStr.includes('window.open') ||
        fnStr.includes('aclib') ||
        fnStr.includes('gripping-table') ||
        fnStr.includes('artoumemo') ||
        fnStr.includes('intellipopup') ||
        fnStr.includes('popunder')
      ) {
        console.warn('[Shield] Neutralized ad click listener');
        return;
      }
    }
    return origAddEventListener.call(this, type, listener, options);
  };
})();
</script>
<meta name="referrer" content="no-referrer-when-downgrade" />
`;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${shieldScript}`);
      } else {
        html = shieldScript + html;
      }

      // Eliminate fake PDF canary object
      html = html.replace(/<object\s+data=["'][^"']*pdf[^"']*["'][^>]*>[\s\S]*?<\/object>/gi, '');
      html = html.replace(/<object[^>]*onerror=["'][^"']*sandDetect[^"']*["'][^>]*>[\s\S]*?<\/object>/gi, '');
      html = html.replace(/<object[^>]*data=["']data:application\/pdf[^>]*>/gi, '');

      // Defang sandDetect & referrer checks
      html = html.replace(/window\.sandDetect\s*=\s*\(\)\s*=>[^,]*,/g, 'window.sandDetect=()=>{},');
      html = html.replace(/sandDetect\(\)/g, 'void(0)');
      html = html.replace(/throw\s+e\("Referrer check failed[^"]*"\)[^;]*;/g, '/*referrer check bypassed*/;');
      html = html.replace(/if\s*\(\s*!\s*\(\s*document\.referrer[^)]*\)\s*\)/g, 'if(false)');

      // Strip ad scripts
      html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (full) => {
        if (
          full.includes('gripping-table') ||
          full.includes('intellipopup') ||
          full.includes('artoumemo') ||
          full.includes('disable-devtool') ||
          full.includes('aclib') ||
          full.includes('acscdn') ||
          full.includes('wpnxiswpuyrfn') ||
          full.includes('vbcojhroxkoaf') ||
          full.includes('x4G9Tq2Kw6R7v1Dy3P0B5N8Lc9M2zF') ||
          full.includes('ZpQw9XkLmN8c3vR3')
        ) {
          return '<!-- [Shield] Intrusive ad script stripped -->';
        }
        return full;
      });

      html = html.replace(/aclib\.runPop\s*\([^)]*\);?/gi, '');
      html = html.replace(/var a\s*=\s*location\.protocol\s*\+\s*["']\/\/["']\s*\+\s*location\.host/gi, `var a="${finalOrigin}"`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.statusCode = 200;
      return res.end(html);
    } catch (err) {
      console.error('Embed proxy error:', err.message);
      res.statusCode = 502;
      return res.end('Embed Proxy Error');
    }
  };

  return {
    name: 'embed-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), streamProxyPlugin(), embedProxyPlugin()]
});
