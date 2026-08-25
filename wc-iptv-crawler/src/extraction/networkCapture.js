import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { validateStream } from '../validation/validateStream.js';

puppeteer.use(stealth());

const CHROME_PATH = '/data/data/com.termux/files/usr/bin/chromium-browser';

export async function captureNetworkStream(targetUrl, label = "Source") {
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const candidates = [];

    try {
        page.on('response', async (res) => {
            const url = res.url();
            if (url.includes('.m3u8') || url.includes('.flv')) {
                candidates.push({ url, type: url.includes('.m3u8') ? 'HLS' : 'FLV' });
            }
        });

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.click('body').catch(() => {});
        // Standard Wait
        await new Promise(r => setTimeout(r, 10000));

        if (candidates.length > 0) {
            for (const cand of candidates) {
                const validation = await validateStream(cand.url, targetUrl); 
                if (validation.isValid) return { url: cand.url, type: cand.type };
            }
        }
    } catch (e) { } finally {
        await browser.close();
    }
    return null;
}
