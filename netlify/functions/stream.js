// netlify/functions/stream.js
export const config = {
  path: "/.netlify/functions/stream"
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
      targetUrl.includes("fancy-shark151.workers.dev") || 
      targetUrl.includes("tokenized.b-cdn.net") || 
      targetUrl.includes("xyzstreams.space");

    const needsReferer = 
      targetUrl.includes("kora-plus.li") || 
      targetUrl.includes("goalakor") || 
      targetUrl.includes("edgestream") ||
      targetUrl.includes("robotiva") ||
      targetUrl.includes("indianservers.st") ||
      isXyzStream;

    if (needsReferer) {
      if (isXyzStream) {
        fetchHeaders["Referer"] = "https://xyzstreams.st/";
        fetchHeaders["Origin"] = "https://xyzstreams.st";
        const token = urlParams.get("token") || new URL(targetUrl).searchParams.get("token");
        if (token) fetchHeaders["x-token"] = token;
      } else if (targetUrl.includes("indianservers.st")) {
        fetchHeaders["Referer"] = "https://taifood-blog.asia/";
        fetchHeaders["Origin"] = "https://taifood-blog.asia";
      } else {
        fetchHeaders["Referer"] = "https://goalakor.space/";
        fetchHeaders["Origin"] = "https://goalakor.space";
      }
    }

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: fetchHeaders
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    const isPlaylist = contentType.includes("mpegurl") || contentType.includes("mpegURL") || targetUrl.includes(".m3u8");

    // 1. If it's a playlist, rewrite all segment URLs to go back through this proxy
    if (isPlaylist) {
      let text = await response.text();
      const baseUrl = new URL(req.url).origin + (new URL(req.url).pathname.includes("/api/stream") ? "/api/stream" : "/.netlify/functions/stream");

      const rewriteUri = (uri) => {
        try {
          const absoluteUrl = new URL(uri, targetUrl).href;
          return `${baseUrl}?url=${encodeURIComponent(absoluteUrl)}`;
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
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache"
        }
      });
    }

    // 2. If it's a media segment (.ts, .mp4, etc), stream the binary data
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    if (response.headers.get("content-type")) headers.set("Content-Type", response.headers.get("content-type"));
    if (response.headers.get("content-length")) headers.set("Content-Length", response.headers.get("content-length"));
    if (response.headers.get("accept-ranges")) headers.set("Accept-Ranges", response.headers.get("accept-ranges"));
    if (response.headers.get("content-range")) headers.set("Content-Range", response.headers.get("content-range"));

    return new Response(response.body, {
      status: response.status,
      headers
    });

  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response("Stream Unreachable", { status: 502 });
  }
};