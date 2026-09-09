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
                // Captured logic now includes .flv and checks for high-priority domains like domainkqt
                if (url.includes('.m3u8') || url.includes('.flv')) {
                    const isHighPriority = url.includes('domainkqt') || url.includes('originpullstream');
                    candidates.push({ 
                        url, 
                        type: url.includes('.m3u8') ? 'HLS' : 'FLV',
                        priority: isHighPriority ? 1 : 2 
                    });
                }
            } catch (e) {}
        });

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
        
        // 2. WAIT FOR PLAYER (Crucial for Camel1 and Fanzone to generate signed tokens)
        await page.waitForSelector('video, iframe, #player, .video-player', { timeout: 10000 }).catch(() => {});

        // 3. IMPROVED SOURCE SCAN (Updated for both M3U8 and FLV)
        const html = await page.content();
        // Regex now supports .m3u8 OR .flv with complex query parameters
        const mediaMatches = html.match(/https?[:%][^"'\s\\]+\.(?:m3u8|flv)[^"'\s\\]*/gi) || [];
        
        for (let raw of mediaMatches) {
            const cleanUrl = decodeURIComponent(raw).replace(/\\/g, '');
            if (cleanUrl.startsWith('http')) {
                const isHighPriority = cleanUrl.includes('domainkqt') || cleanUrl.includes('originpullstream');
                candidates.push({ 
                    url: cleanUrl, 
                    type: cleanUrl.includes('.m3u8') ? 'HLS' : 'FLV',
                    priority: isHighPriority ? 1 : 3
                });
            }
        }

        // 4. INTERACTION (Wakes up player logic)
        await page.mouse.click(640, 360).catch(() => {});
        await new Promise(r => setTimeout(r, 10000)); 

        if (candidates.length > 0) {
            // Deduplicate
            const unique = [...new Map(candidates.map(item => [item.url, item])).values()];
            
            // COMPLEX SORTING:
            // 1. Matches from your screenshot (domainkqt) go first
            // 2. Links with security tokens go second
            // 3. Normal links go third
            const sorted = unique.sort((a, b) => {
                // If one is high priority and the other isn't
                if (a.priority !== b.priority) return a.priority - b.priority;
                
                // If same priority, check for tokens (Camel1/Socolive fix)
                const aHasToken = a.url.includes('Secret') || a.url.includes('key') || a.url.includes('token');
                const bHasToken = b.url.includes('Secret') || b.url.includes('key') || b.url.includes('token');
                
                if (aHasToken && !bHasToken) return -1;
                if (!aHasToken && bHasToken) return 1;
                return 0;
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