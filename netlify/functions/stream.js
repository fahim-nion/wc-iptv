// netlify/functions/stream.js
export const config = {
  path: ["/api/stream", "/.netlify/functions/stream"]
};

export default async (req, context) => {
  const urlParams = new URL(req.url).searchParams;
  const targetUrl = urlParams.get("url");

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return new Response("Invalid URL", { status: 400 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Range": req.headers.get("range") || ""
    };

    const isXyzStream = 
      targetUrl.includes("duckdns.org") ||
      targetUrl.includes("kozow.com") ||
      targetUrl.includes("iximiuz.com") ||
      targetUrl.includes("xyzstreams") ||
      targetUrl.includes("workers.dev") ||
      targetUrl.includes("fancy-shark151.workers.dev") || 
      targetUrl.includes("tokenized.b-cdn.net") || 
      targetUrl.includes("xyzstreams.space");

    if (isXyzStream) {
      fetchHeaders["Referer"] = "https://xyzstreams.st/";
      fetchHeaders["Origin"] = "https://xyzstreams.st";
      const token = urlParams.get("token") || new URL(targetUrl).searchParams.get("token");
      if (token) fetchHeaders["x-token"] = token;
    } else if (targetUrl.includes("camel4.live") || targetUrl.includes("camel1.tv")) {
      fetchHeaders["Referer"] = "https://www.camel1.tv/";
      fetchHeaders["Origin"] = "https://www.camel1.tv";
    } else if (targetUrl.includes("edgestream") || targetUrl.includes("streame.center") || targetUrl.includes("cyberbingo")) {
      fetchHeaders["Referer"] = "https://streame.center/";
      fetchHeaders["Origin"] = "https://streame.center";
    } else if (targetUrl.includes("kora-plus") || targetUrl.includes("goalakor") || targetUrl.includes("goalikor") || targetUrl.includes("kora-api")) {
      fetchHeaders["Referer"] = "https://goalakor.space/";
      fetchHeaders["Origin"] = "https://goalakor.space";
    }

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: fetchHeaders,
      redirect: "manual"
    });

    clearTimeout(timeoutId);

    // If upstream returns 3xx (e.g. kora-plus redirect to google.com), stream is expired
    if (response.status >= 300 && response.status < 400) {
      return new Response("Stream Expired", { status: 410 });
    }

    if (!response.ok && response.status !== 206) {
      return new Response("Upstream Error", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return new Response("Invalid Stream Format", { status: 502 });
    }

    const isPlaylist = contentType.includes("mpegurl") || contentType.includes("mpegURL") || targetUrl.includes(".m3u8");

    // 1. If it's a playlist, rewrite all segment URLs to go back through this proxy
    if (isPlaylist) {
      let text = await response.text();
      const baseUrl = "/api/stream";

      const rewriteUri = (uri) => {
        try {
          const absoluteUrl = new URL(uri, targetUrl);
          // If child/variant URL doesn't have search parameters, inherit authentication token from targetUrl
          if (!absoluteUrl.search && new URL(targetUrl).search) {
            absoluteUrl.search = new URL(targetUrl).search;
          }
          return `${baseUrl}?url=${encodeURIComponent(absoluteUrl.href)}`;
        } catch (e) {
          return uri;
        }
      };

      const rewrittenPlaylist = text.split(/\r?\n/).map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith("#")) {
          return line.replace(/URI="([^"]+)"/g, (match, uri) => `URI="${rewriteUri(uri)}"`);
        }
        return rewriteUri(trimmed);
      }).join("\n");

      return new Response(rewrittenPlaylist, {
        headers: {
          "Content-Type": contentType || "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache"
        }
      });
    }

    // 2. If it's a media segment (.ts, .mp4, etc), buffer and return binary data
    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    if (response.headers.get("content-type")) headers.set("Content-Type", response.headers.get("content-type"));
    headers.set("Content-Length", arrayBuffer.byteLength.toString());
    if (response.headers.get("accept-ranges")) headers.set("Accept-Ranges", response.headers.get("accept-ranges"));
    if (response.headers.get("content-range")) headers.set("Content-Range", response.headers.get("content-range"));

    return new Response(arrayBuffer, {
      status: response.status,
      headers
    });

  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response("Stream Unreachable", { status: 502 });
  }
};