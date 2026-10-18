import crypto from 'crypto';
import { validateStream } from '../validation/validateStream.js';

export async function getXyzStream(targetUrl) {
    try {
        const res = await fetch(targetUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        const text = await res.text();
        const embedMatches = text.match(/embed\?[^"']+/g);
        if (!embedMatches || embedMatches.length === 0) return null;
        
        // Grab token safely with timeout
        const tokenRes = await fetch("https://hls.fancy-shark151.workers.dev/api/token", {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(6000)
        }).catch(() => null);

        if (!tokenRes || !tokenRes.ok) {
            return null;
        }

        const textData = await tokenRes.text().catch(() => '');
        let data;
        try {
            data = JSON.parse(textData);
        } catch {
            return null;
        }

        if (!data || !data.iv || !data.token) {
            return null;
        }

        const SECRET_KEY = "MySuperSecretKey123!";
        const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(data.iv, 'hex'));
        let decrypted = decipher.update(Buffer.from(data.token, 'hex'), undefined, 'utf8');
        decrypted += decipher.final('utf8');
        const token = decrypted.trim().replace(/[^\x20-\x7E]/g, '');
        
        // Find the stream source path from the embed page HTML servers object
        const embedRes = await fetch(`https://xyzstreams.st/${embedMatches[0]}`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(8000)
        });
        if (!embedRes.ok) return null;
        const embedHtml = await embedRes.text();
        const serverMatch = embedHtml.match(/'1':\s*'([^']+)'/);
        const serverPath = serverMatch ? serverMatch[1] : 'https://hls.fancy-shark151.workers.dev/usa/index.m3u8';
        
        const m3u8Url = `${serverPath}?token=${encodeURIComponent(token)}&server=1`;
        
        return { url: m3u8Url, type: 'HLS' };
    } catch (e) {
        // Silently skip if XYZ streams token API is offline
    }
    return null;
}
