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
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    const candidates = [];

    try {
        // 1. Network Listener (Standard capture for Socolive/ColaTV/Xoilac)
        page.on('response', async (res) => {
            try {
                const url = res.url();
                if (url.includes('.m3u8') || url.includes('.flv')) {
                    candidates.push({ url, type: url.includes('.m3u8') ? 'HLS' : 'FLV' });
                }
            } catch (e) {}
        });

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
        
        // 2. WAIT FOR PLAYER (Crucial for Camel1 and Fanzone to generate signed tokens)
        await page.waitForSelector('video, iframe, #player, .video-player', { timeout: 10000 }).catch(() => {});

        // 3. IMPROVED SOURCE SCAN (Specifically updated for Camel1 signed m3u8 links)
        const html = await page.content();
        // This regex now supports characters like ?, =, &, and _ found in txSecret tokens
        const m3u8Matches = html.match(/https?[:%][^"'\s\\]+\.m3u8[^"'\s\\]*/gi) || [];
        
        for (let raw of m3u8Matches) {
            const cleanUrl = decodeURIComponent(raw).replace(/\\/g, '');
            if (cleanUrl.startsWith('http')) {
                candidates.push({ url: cleanUrl, type: 'HLS' });
            }
        }

        // 4. INTERACTION (Wakes up player logic)
        await page.mouse.click(640, 360).catch(() => {});
        await new Promise(r => setTimeout(r, 10000)); // Wait for tokens to finalize

        if (candidates.length > 0) {
            // Deduplicate and filter out obvious ads
            const unique = [...new Map(candidates.map(item => [item.url, item])).values()];
            
            // Prioritize Camel1/Socolive links with tokens (txSecret, auth_key, wsSecret)
            const sorted = unique.sort((a, b) => {
                const aHasToken = a.url.includes('Secret') || a.url.includes('key') || a.url.includes('token');
                const bHasToken = b.url.includes('Secret') || b.url.includes('key') || b.url.includes('token');
                return aHasToken ? -1 : 1;
            });

            for (const cand of sorted) {
                const validation = await validateStream(cand.url, targetUrl); 
                if (validation.isValid) return { url: cand.url, type: cand.type };
            }
        }
    } catch (e) { 
        console.log(`   ✘ [${label}] Extraction failed`);
    } finally {
        await browser.close();
    }
    return null;
}