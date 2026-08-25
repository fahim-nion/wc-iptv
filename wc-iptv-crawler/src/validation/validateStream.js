import fetch from 'node-fetch';

export async function validateStream(url, referer = "") {
    if (!url) return { isValid: false, error: "No URL" };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const urlObj = new URL(url);
        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': referer || urlObj.origin,
                'Origin': referer ? new URL(referer).origin : urlObj.origin,
                'Accept': '*/*'
            }
        });
        
        const contentType = response.headers.get('content-type') || '';
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