import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';
import fs from 'fs';

puppeteer.use(stealth());

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

// --- Keep your existing performDiscovery for the other sources ---
async function performDiscovery(sourceKey, selector) {
    const source = config.sources[sourceKey];
    if (!source) return [];
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
                    return anchors.map(a => ({ url: a.href, text: a.innerText.trim() }));
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
    } finally { await browser.close(); }
    return matches;
}

// --- DEBUGGED COLATV DISCOVERY ---
export async function discoverColaTV() {
    const source = config.sources.colatv;
    console.log(`\n🔍 [COLATV] Running Deep Scan for Hot Matches...`);
    
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH || undefined,
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    const matches = [];
    
    try {
        await page.goto(source.homepage, { waitUntil: 'load', timeout: 30000 });
        
        // 1. Scroll slightly to trigger lazy-loading matches
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 8000));

        // 2. Specialized selector for ColaTV match blocks
        const data = await page.evaluate(() => {
            // Find all containers that likely hold match info
            const items = document.querySelectorAll('a[href*="/truc-tiep/"]');
            return Array.from(items).map(a => {
                // Look for team names in spans or specific classes (ColaTV common structure)
                const teamElements = a.querySelectorAll('.name, .team-name, span');
                let extractedTitle = "";
                
                if (teamElements.length >= 2) {
                    extractedTitle = teamElements[0].innerText.trim() + " VS " + teamElements[1].innerText.trim();
                } else {
                    extractedTitle = a.innerText.trim();
                }

                return {
                    url: a.href,
                    rawText: extractedTitle
                };
            });
        });

        const seen = new Set();
        for (const item of data) {
            if (seen.has(item.url) || item.url.includes('/link/')) continue;

            // Strict cleaning for ColaTV
            let clean = item.rawText
                .split('\n')[0]
                .replace(/^[0-9]{2}:[0-9]{2}/g, '') // Remove times like 21:00
                .replace(/TRỰC TIẾP|HOT|LIVE|LIVE NOW/gi, '')
                .replace(/-/g, ' VS ')
                .trim();

            if (clean.length > 5 && !clean.includes('KẾT THÚC')) {
                seen.add(item.url);
                matches.push({
                    source: 'colatv',
                    title: clean.toUpperCase(),
                    url: item.url
                });
            }
        }
    } catch (e) {
        console.error(`[Cola Debug Error]: ${e.message}`);
    } finally {
        await browser.close();
    }
    return matches;
}

export const discoverSocolive = () => performDiscovery('socolive', 'a[href*="/truc-tiep/"]');
export const discoverXoilac = () => performDiscovery('xoilac', 'a[href*="/truc-tiep/"]');
export const discoverFanzone = () => performDiscovery('fanzone', 'a[href*="/match/"], a[href*="/live/"]');
export const discoverCamel1 = () => performDiscovery('camel1', 'a[href*="/truc-tiep/"]');