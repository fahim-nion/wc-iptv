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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Range": req.headers.get("range") || ""
      }
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    const isPlaylist = contentType.includes("mpegurl") || contentType.includes("mpegURL") || targetUrl.includes(".m3u8");

    // 1. If it's a playlist, rewrite all segment URLs to go back through this proxy
    if (isPlaylist) {
      let text = await response.text();
      const baseUrl = new URL(req.url).origin + "/.netlify/functions/stream";

      const rewrittenPlaylist = text.split("\n").map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return line;
        
        // Resolve relative URLs to absolute before proxying
        try {
          const absoluteUrl = new URL(trimmed, targetUrl).href;
          return `${baseUrl}?url=${encodeURIComponent(absoluteUrl)}`;
        } catch (e) {
          return line;
        }
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