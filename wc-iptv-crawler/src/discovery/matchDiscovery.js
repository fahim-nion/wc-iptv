import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';

puppeteer.use(stealth());

// FIXED: Exact path provided by user
const CHROME_PATH = '/data/data/com.termux/files/usr/bin/chromium-browser';

async function setupPage(browser) {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const type = req.resourceType();
        if (['image', 'font', 'stylesheet', 'media'].includes(type)) req.abort();
        else req.continue();
    });
    return page;
}

async function smartGoto(page, sourceKey) {
    const source = config.sources[sourceKey];
    const urls = [source.homepage, ...(source.mirrors || [])];
    
    for (const url of urls) {
        try {
            console.log(`   ➤ Trying domain: ${url}`);
            // FIXED: 'commit' is Playwright. Puppeteer uses 'domcontentloaded'
            const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            if (res && res.status() < 400) return url;
        } catch (e) { 
            console.log(`   ⚠ Failed: ${e.message.substring(0, 50)}`);
            continue; 
        }
    }
    throw new Error(`All domains for ${sourceKey} failed.`);
}

export async function discoverSocolive() {
    console.log("🔍 [Socolive] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await setupPage(browser);
    const matches = [];
    try {
        await smartGoto(page, 'socolive');
        // FIXED: sleep function logic
        await new Promise(r => setTimeout(r, 6000)); 
        
        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                const teamNodes = a.querySelectorAll('.name-match span, .name-team, .title span');
                let title = (teamNodes.length >= 2) 
                    ? `${teamNodes[0].innerText.trim()} vs ${teamNodes[1].innerText.trim()}`
                    : a.innerText.trim().split('\n')[0];
                return { url: a.href, title };
            });
        });
        const seen = new Set();
        for (const link of links) {
            const clean = link.title.replace(/LINK TRỰC TIẾP |VÀO LÚC.*/gi, '').trim();
            if (clean && !seen.has(link.url)) {
                seen.add(link.url);
                matches.push({ source: 'socolive', title: clean, url: link.url });
            }
        }
    } catch (e) { console.error(`[Socolive] Error: ${e.message}`); } 
    finally { await browser.close(); }
    return matches;
}

export async function discoverColaTV() {
    console.log("🔍 [ColaTV] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await setupPage(browser);
    const matches = [];
    try {
        await smartGoto(page, 'colatv');
        await new Promise(r => setTimeout(r, 5000));
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
            if (clean && !seen.has(link.url)) {
                seen.add(link.url);
                matches.push({ source: 'colatv', title: clean, url: link.url });
            }
        }
    } catch (e) { console.error(`[ColaTV] Error: ${e.message}`); } 
    finally { await browser.close(); }
    return matches;
}

export async function discoverXoilac() {
    console.log("🔍 [Xoilac] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await setupPage(browser);
    const matches = [];
    try {
        await smartGoto(page, 'xoilac');
        await new Promise(r => setTimeout(r, 5000));
        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                const h = a.querySelector('.home-name, .name-1');
                const aw = a.querySelector('.away-name, .name-2');
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
    } catch (e) { console.error(`[Xoilac] Error: ${e.message}`); } 
    finally { await browser.close(); }
    return matches;
}