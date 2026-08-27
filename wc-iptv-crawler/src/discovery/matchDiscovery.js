import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';
import fs from 'fs';

puppeteer.use(stealth());

// 1. AUTO-DETECT BROWSER PATH (Fixed for Termux)
const getChromePath = () => {
    const paths = [
        '/data/data/com.termux/files/usr/bin/chromium-browser',
        '/data/data/com.termux/files/usr/bin/chromium'
    ];
    for (const p of paths) { if (fs.existsSync(p)) return p; }
    return paths[0]; 
};
const CHROME_PATH = getChromePath();

// 2. RESOURCE BLOCKER (Stops ads from freezing the browser)
async function setupDiscoveryPage(browser) {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const type = req.resourceType();
        // We block images and CSS to save Termux RAM and prevent hangs
        if (['image', 'font', 'stylesheet', 'media'].includes(type)) req.abort();
        else req.continue();
    });
    return page;
}

// 3. MIRROR HANDLER (Handles domain rotation)
async function smartGoto(page, sourceKey) {
    const source = config.sources[sourceKey];
    const urls = [source.homepage, ...(source.mirrors || [])];
    
    for (const url of urls) {
        try {
            console.log(`   ➤ Trying ${sourceKey}: ${new URL(url).hostname}`);
            await page.setUserAgent(config.userAgent);
            const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
            
            // Wait to ensure the list actually exists in the HTML
            await page.waitForSelector('a[href*="/truc-tiep/"], a[href*="/match/"], a[href*="/live/"]', { timeout: 10000 });
            return true;
        } catch (e) {
            console.log(`   ⚠ Mirror failed: ${new URL(url).hostname}`);
            continue;
        }
    }
    return false;
}

export async function discoverSocolive() {
    console.log("🔍 [Socolive] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
    const page = await setupDiscoveryPage(browser);
    const matches = [];
    try {
        const ok = await smartGoto(page, 'socolive');
        if (!ok) return [];
        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                const t = a.querySelector('.name-match, .title, .name-team, h3, span');
                return { url: a.href, title: t ? t.innerText.trim() : a.innerText.trim() };
            });
        });
        const seen = new Set();
        for (const link of links) {
            const clean = link.title.split('\n')[0].replace(/LINK TRỰC TIẾP |VÀO LÚC.*/gi, '').trim();
            if (clean && !seen.has(link.url) && !link.title.includes('KẾT THÚC')) {
                seen.add(link.url);
                matches.push({ source: 'socolive', title: clean, url: link.url });
            }
        }
    } catch (e) { console.error(`[Soco Error]: ${e.message.substring(0,50)}`); } 
    finally { await browser.close(); }
    return matches;
}

export async function discoverColaTV() {
    console.log("🔍 [ColaTV] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await setupDiscoveryPage(browser);
    const matches = [];
    try {
        const ok = await smartGoto(page, 'colatv');
        if (!ok) return [];
        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                const teams = a.querySelectorAll('.name');
                const title = (teams.length >= 2) ? `${teams[0].innerText} vs ${teams[1].innerText}` : a.innerText.trim();
                return { url: a.href, title };
            });
        });
        const seen = new Set();
        for (const link of links) {
            const clean = link.title.replace(/TRỰC TIẾP /gi, '').trim();
            if (clean && !seen.has(link.url) && !clean.includes('FT')) {
                seen.add(link.url);
                matches.push({ source: 'colatv', title: clean, url: link.url });
            }
        }
    } catch (e) { console.error(`[Cola Error]: ${e.message.substring(0,50)}`); } 
    finally { await browser.close(); }
    return matches;
}

export async function discoverXoilac() {
    console.log("🔍 [Xoilac] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await setupDiscoveryPage(browser);
    const matches = [];
    try {
        const ok = await smartGoto(page, 'xoilac');
        if (!ok) return [];
        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                const h = a.querySelector('.home-name, .name-1, .team-name');
                const aw = a.querySelector('.away-name, .name-2, .team-name:last-child');
                const title = (h && aw) ? `${h.innerText.trim()} vs ${aw.innerText.trim()}` : a.innerText.trim();
                return { url: a.href, title };
            });
        });
        const seen = new Set();
        for (const link of links) {
            if (!seen.has(link.url) && !link.url.includes('/link/')) {
                seen.add(link.url);
                matches.push({ source: 'xoilac', title: link.title.split('\n')[0].trim(), url: link.url });
            }
        }
    } catch (e) { console.error(`[Xoi Error]: ${e.message.substring(0,50)}`); } 
    finally { await browser.close(); }
    return matches;
}

export async function discoverFanzone() {
    console.log("🔍 [Fanzone] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await setupDiscoveryPage(browser);
    const matches = [];
    try {
        await page.setUserAgent(config.userAgent);
        await page.goto(config.sources.fanzone.homepage, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000); 

        const links = await page.$$eval('a', (anchors) => {
            return anchors
                .filter(a => a.href.includes('/match/') || a.href.includes('/live/') || a.href.includes('/truc-tiep/'))
                .map(a => {
                    const parts = a.innerText.trim().split('\n');
                    let title = parts.length >= 2 ? `${parts[0].trim()} vs ${parts[1].trim()}` : a.innerText.trim();
                    return { url: a.href, title: title };
                });
        });

        const seen = new Set();
        for (const link of links) {
            if (link.title && !seen.has(link.url)) {
                seen.add(link.url);
                matches.push({ source: 'fanzone', title: link.title.toUpperCase(), url: link.url });
            }
        }
    } catch (e) { console.error(`[Fanzone Error]: ${e.message.substring(0,50)}`); } 
    finally { await browser.close(); }
    return matches;
}