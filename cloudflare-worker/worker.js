/**
 * Cloudflare Worker IPTV Stream Proxy
 * High-performance edge proxy for HLS live streams and segments.
 */

export default {
  async fetch(request, env, ctx) {
    const requestUrl = new URL(request.url);

    // 1. Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const targetUrl = requestUrl.searchParams.get("url");

    // 2. Health check when visited without parameters
    if (!targetUrl) {
      return new Response(
        JSON.stringify({
          status: "online",
          service: "Cloudflare IPTV Stream Proxy",
          usage: `${requestUrl.origin}${requestUrl.pathname}?url=<ENCODED_STREAM_URL>`,
        }, null, 2),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return new Response("Invalid URL protocol. Must start with http:// or https://", { 
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      const targetObj = new URL(targetUrl);
      const fetchHeaders = new Headers({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "*/*",
      });

      // Pass byte-range headers for seeking and video segments
      const rangeHeader = request.headers.get("range");
      if (rangeHeader) {
        fetchHeaders.set("Range", rangeHeader);
      }

      // Dynamic header spoofing based on stream origin
      const hostname = targetObj.hostname.toLowerCase();

      // XYZStreams edge nodes
      const isXyzStream = 
        hostname.includes("duckdns.org") ||
        hostname.includes("kozow.com") ||
        hostname.includes("iximiuz.com") ||
        hostname.includes("xyzstreams") ||
        hostname.includes("workers.dev");

      if (isXyzStream) {
        fetchHeaders.set("Referer", "https://xyzstreams.st/");
        fetchHeaders.set("Origin", "https://xyzstreams.st");
        const token = requestUrl.searchParams.get("token") || targetObj.searchParams.get("token");
        if (token) fetchHeaders.set("x-token", token);
      } 
      // Camel1 / Camel4 streams
      else if (hostname.includes("camel4.live") || hostname.includes("camel1.tv")) {
        fetchHeaders.set("Referer", "https://www.camel1.tv/");
        fetchHeaders.set("Origin", "https://www.camel1.tv");
      } 
      // HesGoal / Kora-Plus streams
      else if (hostname.includes("kora-plus") || hostname.includes("goalakor") || hostname.includes("goalikor") || hostname.includes("kora-api")) {
        fetchHeaders.set("Referer", "https://goalakor.space/");
        fetchHeaders.set("Origin", "https://goalakor.space");
      } 
      // AuraSports / FalconStreams
      else if (hostname.includes("streame.center") || hostname.includes("edgestream") || hostname.includes("cyberbingo")) {
        fetchHeaders.set("Referer", "https://streame.center/");
        fetchHeaders.set("Origin", "https://streame.center");
      }

      // Fetch upstream stream
      const upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers: fetchHeaders,
        redirect: "manual",
      });

      // Handle upstream redirects (e.g. expired Kora tokens redirect to google.com)
      if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
        const location = upstreamResponse.headers.get("location");
        if (location && (location.includes("google.com") || location.includes("blocked"))) {
          return new Response("Stream Session Expired", { 
            status: 410, 
            headers: { "Access-Control-Allow-Origin": "*" } 
          });
        }
      }

      if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
        return new Response(`Upstream Error: ${upstreamResponse.statusText}`, { 
          status: upstreamResponse.status,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }

      const contentType = (upstreamResponse.headers.get("content-type") || "").toLowerCase();

      // Reject HTML landing or error pages
      if (contentType.includes("text/html")) {
        return new Response("Invalid stream payload (received HTML)", { 
          status: 502,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }

      const isPlaylist = 
        contentType.includes("mpegurl") || 
        targetObj.pathname.endsWith(".m3u8") ||
        targetUrl.includes(".m3u8");

      // 3. PLAYLIST REWRITING: rewrite segment URLs to route back through this Worker
      if (isPlaylist) {
        const playlistText = await upstreamResponse.text();
        const baseProxyUrl = `${requestUrl.origin}${requestUrl.pathname}`;

        const rewriteUri = (uri) => {
          try {
            const absoluteUrl = new URL(uri, targetUrl);
            
            // Merge parent authentication parameters (txSecret, auth, token, etc.)
            for (const [key, val] of targetObj.searchParams.entries()) {
              if (!absoluteUrl.searchParams.has(key)) {
                absoluteUrl.searchParams.set(key, val);
              }
            }

            return `${baseProxyUrl}?url=${encodeURIComponent(absoluteUrl.href)}`;
          } catch {
            return uri;
          }
        };

        const rewrittenPlaylist = playlistText.split(/\r?\n/).map(line => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith("#")) {
            // Rewrite URI="..." attributes in tags like #EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA
            return line.replace(/URI="([^"]+)"/g, (match, uri) => `URI="${rewriteUri(uri)}"`);
          }
          // Segment / variant playlist line
          return rewriteUri(trimmed);
        }).join("\n");

        return new Response(rewrittenPlaylist, {
          status: 200,
          headers: {
            "Content-Type": contentType || "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      // 4. BINARY STREAMING: Direct zero-copy streaming of video segments (.ts, .m4s, etc.)
      const responseHeaders = new Headers();
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Headers", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

      const forwardHeaders = ["content-type", "content-length", "accept-ranges", "content-range"];
      for (const h of forwardHeaders) {
        const val = upstreamResponse.headers.get(h);
        if (val) responseHeaders.set(h, val);
      }

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });

    } catch (err) {
      return new Response(`Proxy Exception: ${err.message}`, {
        status: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
