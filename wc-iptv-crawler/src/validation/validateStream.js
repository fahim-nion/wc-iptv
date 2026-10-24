import fetch from 'node-fetch';

export async function validateStream(url, referer = "", timeoutMs = 5000) {
    if (!url) return { isValid: false, error: "No URL" };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const urlObj = new URL(url);
        let reqReferer = referer;
        let reqOrigin = "";

        if (urlObj.hostname.includes('kora-plus') || urlObj.hostname.includes('goalakor') || urlObj.hostname.includes('goalikor')) {
            reqReferer = 'https://goalakor.space/';
            reqOrigin = 'https://goalakor.space';
        } else if (urlObj.hostname.includes('camel4.live') || urlObj.hostname.includes('camel1.tv')) {
            reqReferer = 'https://www.camel1.tv/';
            reqOrigin = 'https://www.camel1.tv';
        } else if (urlObj.hostname.includes('edgestream') || urlObj.hostname.includes('streame.center')) {
            reqReferer = 'https://streame.center/';
            reqOrigin = 'https://streame.center';
        } else if (urlObj.hostname.includes('duckdns.org') || urlObj.hostname.includes('kozow.com') || urlObj.hostname.includes('iximiuz.com') || urlObj.hostname.includes('xyzstream') || urlObj.hostname.includes('workers.dev')) {
            reqReferer = 'https://xyzstreams.st/';
            reqOrigin = 'https://xyzstreams.st';
        } else if (referer) {
            reqReferer = referer;
            try { reqOrigin = new URL(referer).origin; } catch(e) {}
        } else {
            reqReferer = urlObj.origin;
            reqOrigin = urlObj.origin;
        }

        const headers = { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        };
        if (reqReferer) headers['Referer'] = reqReferer;
        if (reqOrigin) headers['Origin'] = reqOrigin;

        const token = urlObj.searchParams.get('token');
        if (token && (urlObj.hostname.includes('duckdns.org') || urlObj.hostname.includes('kozow.com') || urlObj.hostname.includes('iximiuz.com') || urlObj.hostname.includes('xyzstream') || urlObj.hostname.includes('workers.dev'))) {
            headers['x-token'] = token;
        }

        const response = await fetch(url, { 
            signal: controller.signal,
            redirect: 'manual',
            headers
        });
        
        // 3xx redirects (e.g. kora-plus redirecting to google.com) indicate expired/invalid tokens
        if (response.status >= 300 && response.status < 400) {
            return { isValid: false, status: response.status, error: "Redirected (expired stream)" };
        }

        // Support IFRAME stream players (StreamCorner / embeds)
        if (url.includes('pandecocogaming') || url.includes('/embed/') || url.includes('/stream/')) {
            return { isValid: response.status === 200, status: response.status, contentType };
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        
        // Reject HTML error/landing pages
        if (contentType.includes('text/html')) {
            return { isValid: false, status: response.status, error: "HTML response instead of stream" };
        }

        // Some FLV streams return application/octet-stream, we must allow that.
        const isValid = response.status === 200 && (
            contentType.includes('mpegurl') || 
            contentType.includes('video/') || 
            contentType.includes('application/octet-stream') ||
            url.includes('.m3u8') || 
            url.includes('.flv')
        );

        return { isValid, status: response.status, contentType };
    } catch (e) {
        return { isValid: false, error: e.message };
    } finally {
        clearTimeout(timeout);
    }
}