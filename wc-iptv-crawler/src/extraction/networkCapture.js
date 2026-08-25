import { chromium as baseChromium } from 'playwright-core';
import { addExtra } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { validateStream } from '../validation/validateStream.js';

const chromium = addExtra(baseChromium);
chromium.use(stealth());

export async function captureNetworkStream(targetUrl, label = "Source") {
    const DEBUG = process.env.CRAWLER_DEBUG === 'true';
    const browser = await chromium.launch({ 
        executablePath: '/data/data/com.termux/files/usr/bin/chromium',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    const candidates = [];
    let matchTitle = "";

    try {
        page.on('response', async (response) => {
            const url = response.url();
            const headers = response.headers();
            const contentType = headers['content-type'] || '';

            if (url.includes('.m3u8') || url.includes('.flv')) {
                candidates.push({ url, type: url.includes('.m3u8') ? 'HLS' : 'FLV', priority: 1 });
                return;
            }

            if (url.includes('api.trackervsb.live') || url.includes('tracker.sportbo.live') || url.includes('api/room/live')) {
                if (contentType.includes('json') || contentType.includes('text')) {
                    try {
                        const text = await response.text();
                        const match = text.match(/https?[:%][^"'\\\s]+?\.(?:m3u8|flv)(?:\?[^"'\\\s]*)?/i);
                        if (match) {
                            const foundUrl = decodeURIComponent(match[0].replace(/\\/g, ''));
                            candidates.push({ 
                                url: foundUrl, 
                                type: foundUrl.includes('.m3u8') ? 'HLS' : 'FLV',
                                priority: 2 
                            });
                        }
                    } catch (err) {}
                }
            }
        });

        if (DEBUG) console.log(`[${label}] Opening: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        matchTitle = await page.title().catch(() => "");

        await page.evaluate(() => {
            const playElements = document.querySelectorAll('video, iframe, button, .player, .video, [class*=play]');
            if (playElements.length > 0) playElements[0].click();
        });

        await page.waitForTimeout(10000);

        if (candidates.length > 0) {
            const sorted = candidates.sort((a, b) => a.priority - b.priority);
            for (const cand of sorted) {
                const validation = await validateStream(cand.url, targetUrl); 
                if (validation.isValid) return { url: cand.url, type: cand.type, title: matchTitle };
            }
        }
    } catch (e) {
        if (DEBUG) console.error(`[${label}] Capture error: ${e.message}`);
    } finally {
        await browser.close();
    }
    return null;
}
