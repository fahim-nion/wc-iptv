import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { validateStream } from '../validation/validateStream.js';
import fs from 'fs';

puppeteer.use(stealth());

const getChromePath = () => {
    const paths = ['/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/data/data/com.termux/files/usr/bin/chromium-browser'];
    for (const p of paths) { if (fs.existsSync(p)) return p; }
    return null;
};
const CHROME_PATH = getChromePath();

export async function captureNetworkStream(targetUrl, label = "Source") {
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH || undefined,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const candidates = [];

    try {
        page.on('response', async (res) => {
            try {
                const url = res.url();
                if (url.includes('.m3u8') || url.includes('.flv')) {
                    candidates.push({ url, type: url.includes('.m3u8') ? 'HLS' : 'FLV' });
                }
            } catch (e) {}
        });

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // --- FANZONE SPECIAL: GRAB ALL M3U8 LINKS FROM PAGE SOURCE ---
        const html = await page.content();
        const m3u8Matches = html.match(/https?[:%][^"']+\.m3u8[^"']*/gi) || [];
        for (let raw of m3u8Matches) {
            const cleanUrl = decodeURIComponent(raw).replace(/\\/g, '');
            candidates.push({ url: cleanUrl, type: 'HLS' });
        }

        await page.mouse.click(640, 360).catch(() => {});
        await new Promise(r => setTimeout(r, 8000));

        if (candidates.length > 0) {
            const unique = [...new Map(candidates.map(item => [item.url, item])).values()];
            for (const cand of unique) {
                const validation = await validateStream(cand.url, targetUrl); 
                if (validation.isValid) return { url: cand.url, type: cand.type };
            }
        }
    } catch (e) { } finally {
        await browser.close();
    }
    return null;
}