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
        targetUrl.includes('fancy-shark151.workers.dev') || 
        targetUrl.includes('tokenized.b-cdn.net') || 
        targetUrl.includes('xyzstreams.space');

      const needsReferer = 
        targetUrl.includes('kora-plus.li') || 
        targetUrl.includes('goalakor') || 
        targetUrl.includes('edgestream') ||
        targetUrl.includes('robotiva') ||
        targetUrl.includes('indianservers.st') ||
        isXyzStream;
      
      if (needsReferer) {
        if (isXyzStream) {
          headers['Referer'] = 'https://xyzstreams.st/';
          headers['Origin'] = 'https://xyzstreams.st';
          const token = parsedUrl.searchParams.get('token');
          if (token) headers['x-token'] = token;
        } else if (targetUrl.includes('indianservers.st')) {
          headers['Referer'] = 'https://taifood-blog.asia/';
          headers['Origin'] = 'https://taifood-blog.asia';
        } else {
          headers['Referer'] = 'https://goalakor.space/';
          headers['Origin'] = 'https://goalakor.space';
        }
      }

      const response = await fetch(targetUrl, { headers });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

      const contentType = response.headers.get('content-type') || '';
      const isPlaylist = contentType.includes('mpegurl') || targetUrl.includes('.m3u8');

      if (isPlaylist) {
        const text = await response.text();
        const baseUrl = '/api/stream';

        const rewriteUri = (uri) => {
          try {
            const abs = new URL(uri, targetUrl).href;
            return `${baseUrl}?url=${encodeURIComponent(abs)}`;
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
      console.error('Stream proxy error:', err.message);
      res.statusCode = 502;
      return res.end('Proxy Error');
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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), streamProxyPlugin()]
});
