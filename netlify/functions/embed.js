// netlify/functions/embed.js
export const config = {
  path: ["/api/embed", "/.netlify/functions/embed"]
};

export default async (req, context) => {
  const urlParams = new URL(req.url).searchParams;
  let targetUrl = urlParams.get("url");

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return new Response("Invalid or missing URL parameter", { status: 400 });
  }

  // Pre-normalize embedsports.me -> sportsframe.me to bypass slow 301 redirects
  if (targetUrl.includes("embedsports.me/a/")) {
    targetUrl = targetUrl.replace("embedsports.me/a/", "sportsframe.me/a/");
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
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    let defaultReferer = "https://fc26.netlify.app/";
    if (targetUrl.includes("sportsframe") || targetUrl.includes("embedsports")) {
      defaultReferer = "https://fc26.netlify.app/";
    } else if (targetUrl.includes("taifood-blog") || targetUrl.includes("ppv")) {
      defaultReferer = "https://ppv.land/";
    } else if (targetUrl.includes("thedaddy") || targetUrl.includes("dembed")) {
      defaultReferer = "https://thedaddy.li/";
    } else if (targetUrl.includes("bintv")) {
      defaultReferer = "https://www.bintv.cc/";
    }

    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": defaultReferer,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Fetch-Dest": "iframe",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site"
    };

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: fetchHeaders,
      redirect: "follow"
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(`Upstream server responded with HTTP ${response.status}`, { 
        status: response.status,
        headers: { "Content-Type": "text/plain" }
      });
    }

    const finalUrl = response.url || targetUrl;
    let finalOrigin = "";
    try {
      finalOrigin = new URL(finalUrl).origin;
    } catch (e) {
      finalOrigin = targetUrl.split("/").slice(0, 3).join("/");
    }

    let html = await response.text();

    // 1. Inject base tag so all relative assets (images, css, scripts) resolve properly
    if (!html.includes("<base")) {
      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>\n<base href="${finalOrigin}/">\n`);
      } else if (html.includes("<html")) {
        html = html.replace(/<html[^>]*>/i, `$&<head><base href="${finalOrigin}/"></head>`);
      }
    }

    // 2. Comprehensive Anti-Ad & Anti-Popup Shield Script
    const shieldScript = `
<script>
(function() {
  // 1. Defang window.open to completely block popup windows, new tabs & popunders
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

  // 2. Neutralize fake PDF canary and sandDetect anti-sandbox traps
  window.sandDetect = function() {};

  // 3. Satisfy document.referrer checks so "Referrer check failed" is never thrown
  try {
    if (!document.referrer) {
      Object.defineProperty(document, 'referrer', {
        value: ${JSON.stringify(finalUrl)},
        configurable: true
      });
    }
  } catch(e) {}

  // 4. Intercept and block ad click-jackers and popunder event listeners
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

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${shieldScript}`);
    } else {
      html = shieldScript + html;
    }

    // 3. Eliminate fake PDF canary object that causes "Remove sandbox attributes"
    html = html.replace(/<object\s+data=["'][^"']*pdf[^"']*["'][^>]*>[\s\S]*?<\/object>/gi, "");
    html = html.replace(/<object[^>]*onerror=["'][^"']*sandDetect[^"']*["'][^>]*>[\s\S]*?<\/object>/gi, "");
    html = html.replace(/<object[^>]*data=["']data:application\/pdf[^>]*>/gi, "");

    // 4. Defang sandDetect and referrer error triggers inside inline scripts
    html = html.replace(/window\.sandDetect\s*=\s*\(\)\s*=>[^,]*,/g, "window.sandDetect=()=>{},");
    html = html.replace(/sandDetect\(\)/g, "void(0)");
    html = html.replace(/throw\s+e\("Referrer check failed[^"]*"\)[^;]*;/g, "/*referrer check bypassed*/;");
    html = html.replace(/if\s*\(\s*!\s*\(\s*document\.referrer[^)]*\)\s*\)/g, "if(false)");

    // 5. Strip all known third-party intrusive ad scripts
    html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (full) => {
      if (
        full.includes("gripping-table") ||
        full.includes("intellipopup") ||
        full.includes("artoumemo") ||
        full.includes("disable-devtool") ||
        full.includes("aclib") ||
        full.includes("acscdn") ||
        full.includes("wpnxiswpuyrfn") ||
        full.includes("vbcojhroxkoaf") ||
        full.includes("x4G9Tq2Kw6R7v1Dy3P0B5N8Lc9M2zF") ||
        full.includes("ZpQw9XkLmN8c3vR3")
      ) {
        return "<!-- [Shield] Intrusive ad script stripped -->";
      }
      return full;
    });

    html = html.replace(/aclib\.runPop\s*\([^)]*\);?/gi, "");

    // 6. Fix taifood-blog bundle script host resolution
    html = html.replace(/var a\s*=\s*location\.protocol\s*\+\s*["']\/\/["']\s*\+\s*location\.host/gi, `var a="${finalOrigin}"`);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err) {
    clearTimeout(timeoutId);
    return new Response(
      `<!DOCTYPE html><html><body style="background:#090a0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><p style="font-size:16px;color:#f87171;">⚠️ Stream Gateway Timeout</p><p style="font-size:12px;color:#94a3b8;">${err.message}</p><button onclick="window.location.reload()" style="background:#f59e0b;color:#000;border:0;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;">Retry</button></div></body></html>`,
      {
        status: 504,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    );
  }
};
