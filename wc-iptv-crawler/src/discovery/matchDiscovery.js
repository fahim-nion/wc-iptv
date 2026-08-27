import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';
import fs from 'fs';

puppeteer.use(stealth());

// AUTO-DETECT BROWSER (Works on Laptop & Termux)
const getChromePath = () => {
    const paths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/data/data/com.termux/files/usr/bin/chromium-browser',
        '/data/data/com.termux/files/usr/bin/chromium'
    ];
    for (const p of paths) { if (fs.existsSync(p)) return p; }
    return null; 
};
const CHROME_PATH = getChromePath();

async function performDiscovery(sourceKey, selector) {
    const source = config.sources[sourceKey];
    if (!source) return [];

    console.log(`\n🔍 [${sourceKey.toUpperCase()}] Scanning...`);
    
    // Headless: true for mobile/background speed, false for laptop debugging
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH || undefined,
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    const matches = [];
    const urls = [source.homepage, ...(source.mirrors || [])];

    try {
        for (const url of urls) {
            try {
                await page.goto(url, { waitUntil: 'load', timeout: 30000 });
                await new Promise(r => setTimeout(r, 7000));

                const links = await page.$$eval(selector, (anchors) => {
                    return anchors.map(a => ({
                        url: a.href,
                        text: a.innerText.trim()
                    }));
                });

                const seen = new Set();
                for (const link of links) {
                    if (seen.has(link.url) || link.url.includes('/link/')) continue;
                    let cleanTitle = link.text.split('\n')[0].replace(/LINK TRỰC TIẾP |TRỰC TIẾP |VÀO LÚC.*/gi, '').trim();
                    if (cleanTitle.length > 3 && !cleanTitle.includes('KẾT THÚC')) {
                        seen.add(link.url);
                        matches.push({ source: sourceKey, title: cleanTitle.toUpperCase(), url: link.url });
                    }
                }
                if (matches.length > 0) break;
            } catch (e) { }
        }
    } finally {
        await browser.close();
    }
    return matches;
}

export const discoverSocolive = () => performDiscovery('socolive', 'a[href*="/truc-tiep/"]');
export const discoverColaTV = () => performDiscovery('colatv', 'a[href*="/truc-tiep/"]');
export const discoverXoilac = () => performDiscovery('xoilac', 'a[href*="/truc-tiep/"]');
export const discoverFanzone = () => performDiscovery('fanzone', 'a[href*="/match/"], a[href*="/live/"]');