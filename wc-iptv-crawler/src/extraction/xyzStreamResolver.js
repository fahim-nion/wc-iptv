import crypto from 'crypto';
import { validateStream } from '../validation/validateStream.js';

const SECRET_KEY = "MySuperSecretKey123!";
const KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();

function decryptToken(ivHex, tokenHex) {
    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, Buffer.from(ivHex, 'hex'));
        let decrypted = decipher.update(Buffer.from(tokenHex, 'hex'), undefined, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted.trim().replace(/[^\x20-\x7E]/g, '');
    } catch {
        return null;
    }
}

async function resolveEmbedUrl(embedUrl, referer = 'https://xyzstreams.st/') {
    try {
        const urlObj = new URL(embedUrl);
        const streamId = urlObj.search.replace(/^\?/, '');
        if (!streamId) return null;

        const embedRes = await fetch(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': referer },
            signal: AbortSignal.timeout(6000)
        });
        if (!embedRes.ok) return null;
        const html = await embedRes.text();

        // Extract token API URLs from embed page (e.g. duckdns.org, kozow.com, etc.)
        const tokenApis = [...new Set(html.match(/https:\/\/[a-zA-Z0-9.-]+\/api\/token/g) || [])];
        if (tokenApis.length === 0) {
            tokenApis.push(
                'https://eu-4605069466.duckdns.org/api/token',
                'https://hls.kozow.com/api/token',
                'https://xyzstream.duckdns.org/api/token'
            );
        }

        for (const tokenApi of tokenApis) {
            try {
                const tokenRes = await fetch(tokenApi, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(4000)
                });
                if (!tokenRes.ok) continue;
                const tokenData = await tokenRes.json();
                if (!tokenData?.iv || !tokenData?.token) continue;

                const token = decryptToken(tokenData.iv, tokenData.token);
                if (!token) continue;

                const host = new URL(tokenApi).origin;
                const streamUrl = `${host}/${streamId}/mono.ts.m3u8?token=${encodeURIComponent(token)}&server=1`;

                const valid = await validateStream(streamUrl, 'https://xyzstreams.st/', 3500);
                if (valid.isValid) {
                    return { url: streamUrl, type: 'HLS' };
                }
            } catch {}
        }
    } catch {}
    return null;
}

export async function getXyzStream(targetUrl) {
    try {
        if (!targetUrl) return null;
        const urlObj = new URL(targetUrl);

        // Case 1: Directly an embed URL
        if (urlObj.pathname.includes('/embed')) {
            return await resolveEmbedUrl(targetUrl);
        }

        // Case 2: Match page (e.g. i-epl-1.html or stream.html?usa)
        const res = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return null;
        const text = await res.text();

        // Check for query parameter dynamic embed (e.g. stream.html?usa -> embed?usa)
        const embedCandidates = [];
        if (urlObj.search && urlObj.search.length > 1) {
            embedCandidates.push(`https://xyzstreams.st/embed${urlObj.search}`);
        }

        // Extract button data-urls and iframe srcs
        const fullUrls = text.match(/https:\/\/xyzstreams\.st\/embed[a-zA-Z0-9_]*\?[^"'\s<>]+/g) || [];
        const relUrls = (text.match(/embed[a-zA-Z0-9_]*\?[^"'\s<>]+/g) || []).map(r => `https://xyzstreams.st/${r}`);
        
        for (const u of [...fullUrls, ...relUrls]) {
            if (!embedCandidates.includes(u)) embedCandidates.push(u);
        }

        for (const cand of embedCandidates) {
            const stream = await resolveEmbedUrl(cand, targetUrl);
            if (stream) return stream;
        }
    } catch (e) {
        // Silently skip if XYZ stream is unavailable
    }
    return null;
}
