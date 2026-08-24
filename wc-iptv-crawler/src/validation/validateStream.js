import fetch from 'node-fetch';

export async function validateStream(url) {
    if (!url) return { isValid: false, error: "No URL provided" };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const contentType = response.headers.get('content-type') || '';
        const isValid = response.status === 200 && (
            contentType.includes('mpegurl') || contentType.includes('video/') || url.includes('.m3u8')
        );
        return { isValid, status: response.status, contentType };
    } catch (e) {
        return { isValid: false, error: e.message };
    } finally {
        clearTimeout(timeout);
    }
}
