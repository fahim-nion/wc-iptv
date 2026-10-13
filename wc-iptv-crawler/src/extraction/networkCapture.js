import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { validateStream } from '../validation/validateStream.js';
import { getCamel1Stream } from './camelStreamResolver.js';
import { getXyzStream } from './xyzStreamResolver.js';
import config from '../../config.js';
import fs from 'fs';

puppeteer.use(stealth());

const getChromePath = () => {
    const paths = ['/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/data/data/com.termux/files/usr/bin/chromium-browser'];
    for (const p of paths) { if (fs.existsSync(p)) return p; }
    return null;
};
const CHROME_PATH = getChromePath();

export async function captureNetworkStream(targetUrl, label = "Source") {
    // 0. Fast-path resolver for Camel1 matches
    if (label.toUpperCase().includes('CAMEL') || targetUrl.includes('camel1.tv')) {
        const matchId = targetUrl.match(/\/([a-zA-Z0-9]{10,})\/?$/)?.[1];
        if (matchId) {
            const camelStream = await getCamel1Stream(matchId);
            if (camelStream && camelStream.url) {
                return camelStream;
            }
        }
    }

    if (label.toUpperCase().includes('XYZSTREAMS') || targetUrl.includes('xyzstreams.st')) {
        const xyzStream = await getXyzStream(targetUrl);
        if (xyzStream && xyzStream.url) {
            return xyzStream;
        }
    }

    // 0b. Fast-path resolver for LiveLive24 and direct HLS/FLV streams
    if (
        label.toUpperCase().includes('LIVELIVE') ||
        targetUrl.includes('livelive24.com') ||
        targetUrl.includes('dlhd.html') ||
        targetUrl.includes('cqsycw.com') ||
        targetUrl.includes('100ycdn.com') ||
        targetUrl.includes('yiom1.com') ||
        (targetUrl.includes('.m3u8') && !targetUrl.includes('camel1.tv'))
    ) {
        let streamUrl = targetUrl;
        if (targetUrl.includes('dlhd.html?url=')) {
            const b64 = targetUrl.split('dlhd.html?url=')[1].split('&')[0];
            try {
                streamUrl = Buffer.from(b64, 'base64').toString();
            } catch (e) {}
        }
        if (streamUrl.includes('pullws-ac.yiom1.com')) {
            try {
                const r = await fetch(streamUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                    signal: AbortSignal.timeout(5000)
                }).catch(() => null);
                if (r && r.status === 200) {
                    const text = await r.text();
                    const cdnMatch = text.match(/https?:\/\/[^\s\r\n]+\.100ycdn\.com[^\s\r\n]+/);
                    if (cdnMatch) streamUrl = cdnMatch[0];
                }
            } catch (e) {}
        }
        const val = await validateStream(streamUrl);
        if (val.isValid) {
            return { url: streamUrl, type: 'HLS' };
        }
        return null;
    }

    // 0c. Fast resolver for HesGoal (kora.html / goalakor.space)
    if (
        label.toUpperCase().includes('HESGOAL') ||
        targetUrl.includes('kora.html') ||
        targetUrl.includes('goalakor.space') ||
        targetUrl.includes('hesgoalltv.net')
    ) {
        const browser = await puppeteer.launch({ 
            executablePath: CHROME_PATH || undefined,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        let streamUrl = null;

        try {
            page.on('response', (res) => {
                const u = res.url();
                if (u.includes('.m3u8') && !streamUrl) {
                    streamUrl = u;
                }
            });

            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
            await page.waitForResponse(res => res.url().includes('.m3u8'), { timeout: 8000 }).catch(() => {});
            
            if (streamUrl) {
                const val = await validateStream(streamUrl, targetUrl);
                if (val.isValid) {
                    return { url: streamUrl, type: 'HLS' };
                }
            }
        } catch (e) {
            console.log(`   ✘ [${label}] Extraction failed: ${e.message}`);
        } finally {
            await browser.close();
        }
        return null;
    }

    // 0d. Fast resolver for PPV (taifood-blog.asia / indianservers.st)
    if (
        label.toUpperCase().includes('PPV') ||
        targetUrl.includes('taifood-blog.asia') ||
        targetUrl.includes('ppvservices')
    ) {
        const browser = await puppeteer.launch({ 
            executablePath: CHROME_PATH || undefined,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        let streamUrl = null;

        try {
            page.on('response', (res) => {
                const u = res.url();
                if ((u.includes('.m3u8') || u.includes('indianservers.st')) && u.includes('index.m3u8') && !streamUrl) {
                    streamUrl = u;
                }
            });

            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
            
            for (let i = 0; i < 20; i++) {
                if (streamUrl) break;
                await new Promise(r => setTimeout(r, 500));
            }
            
            if (streamUrl) {
                return { url: streamUrl, type: 'HLS' };
            }
        } catch (e) {
            console.log(`   ✘ [${label}] Extraction failed: ${e.message}`);
        } finally {
            await browser.close();
        }
        return null;
    }

    // Socolive mirror fallback URLs if primary domain fails
    const urlsToAttempt = [targetUrl];
    if (label.toUpperCase().includes('SOCOLIVE') || targetUrl.includes('socolive') || targetUrl.includes('athleticbilbao')) {
        const socoMirrors = (config.sources?.socolive?.mirrors || []).concat([config.sources?.socolive?.homepage || '']);
        for (const mirror of socoMirrors) {
            if (!mirror) continue;
            try {
                const targetObj = new URL(targetUrl);
                const mirrorObj = new URL(mirror);
                if (targetObj.hostname !== mirrorObj.hostname) {
                    urlsToAttempt.push(`${mirrorObj.origin}${targetObj.pathname}${targetObj.search}`);
                }
            } catch (e) {}
        }
    }

    for (const currentUrl of urlsToAttempt.slice(0, 2)) {
        const browser = await puppeteer.launch({ 
            executablePath: CHROME_PATH || undefined,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--autoplay-policy=no-user-gesture-required']
        });

        const page = await browser.newPage();
        const candidates = [];

        try {
            // 1. Network Listener (Standard capture for Socolive/ColaTV/Xoilac)
            page.on('response', async (res) => {
                try {
                    const url = res.url();
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
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
            
            // 2. WAIT FOR PLAYER
            await page.waitForSelector('video, iframe, #player, .video-player, .player-container', { timeout: 8000 }).catch(() => {});

            // 3. Polling wait for media streams (up to 7 seconds)
            for (let i = 0; i < 14; i++) {
                if (candidates.length > 0) break;
                await new Promise(r => setTimeout(r, 500));
            }

            // 4. IMPROVED SOURCE SCAN (Regex backup for both M3U8 and FLV)
            const html = await page.content();
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

            // 5. INTERACTION (Wakes up player logic if needed)
            if (candidates.length === 0) {
                await page.mouse.click(640, 360).catch(() => {});
                for (let i = 0; i < 6; i++) {
                    if (candidates.length > 0) break;
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            if (candidates.length > 0) {
                // Deduplicate
                const unique = [...new Map(candidates.map(item => [item.url, item])).values()];
                
                const sorted = unique.sort((a, b) => {
                    if (a.priority !== b.priority) return a.priority - b.priority;
                    const aHasToken = a.url.includes('Secret') || a.url.includes('key') || a.url.includes('token') || a.url.includes('auth_key');
                    const bHasToken = b.url.includes('Secret') || b.url.includes('key') || b.url.includes('token') || b.url.includes('auth_key');
                    if (aHasToken && !bHasToken) return -1;
                    if (!aHasToken && bHasToken) return 1;
                    return 0;
                });

                for (const cand of sorted) {
                    const validation = await validateStream(cand.url, currentUrl); 
                    if (validation.isValid) return { url: cand.url, type: cand.type };
                }
            }
        } catch (e) { 
            console.log(`   ✘ [${label}] Extraction failed: ${e.message}`);
        } finally {
            await browser.close();
        }
    }
    return null;
}