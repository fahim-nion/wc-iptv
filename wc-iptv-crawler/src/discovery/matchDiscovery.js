import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';
import fs from 'fs';

puppeteer.use(stealth());

const getChromePath = () => {
    const paths = [
        '/data/data/com.termux/files/usr/bin/chromium-browser',
        '/data/data/com.termux/files/usr/bin/chromium'
    ];
    for (const p of paths) { if (fs.existsSync(p)) return p; }
    return paths[0]; 
};
const CHROME_PATH = getChromePath();

async function smartGoto(page, sourceKey) {
    const source = config.sources[sourceKey];
    const urls = [source.homepage, ...(source.mirrors || [])];
    
    for (const url of urls) {
        try {
            console.log(`   ➤ Trying: ${url}`);
            // Use 'domcontentloaded' to avoid waiting for heavy ads
            const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            
            // Wait for ANY match link to appear (maximum 10s)
            await page.waitForSelector('a[href*="/truc-tiep/"]', { timeout: 10000 });
            return true;
        } catch (e) {
            console.log(`   ⚠ Domain failed or timed out: ${new URL(url).hostname}`);
            continue;
        }
    }
    return false;
}

export async function discoverSocolive() {
    console.log("🔍 [Socolive] Scanning...");
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH, headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] 
    });
    const page = await browser.newPage();
    const matches = [];

    try {
        const success = await smartGoto(page, 'socolive');
        if (!success) throw new Error("No Socolive mirrors reachable.");

        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                const t = a.querySelector('.name-match, .title, .name-team, h3, span');
                return { url: a.href, title: t ? t.innerText.trim() : a.innerText.trim() };
            });
        });

        const seen = new Set();
        for (const link of links) {
            const clean = link.title.split('\n')[0].replace(/LINK TRỰC TIẾP /gi, '').trim();
            if (clean && !seen.has(link.url) && !link.title.includes('KẾT THÚC')) {
                seen.add(link.url);
                matches.push({ source: 'socolive', title: clean, url: link.url });
            }
        }
    } catch (e) { console.error(`[Soco Error]: ${e.message}`); } 
    finally { await browser.close(); }
    console.log(`   Found ${matches.length} matches.`);
    return matches;
}

export async function discoverColaTV() {
    console.log("🔍 [ColaTV] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
    const page = await browser.newPage();
    const matches = [];

    try {
        const success = await smartGoto(page, 'colatv');
        if (!success) throw new Error("No ColaTV mirrors reachable.");
        
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
    } catch (e) { console.error(`[Cola Error]: ${e.message}`); } 
    finally { await browser.close(); }
    console.log(`   Found ${matches.length} matches.`);
    return matches;
}

export async function discoverXoilac() {
    console.log("🔍 [Xoilac] Scanning...");
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
    const page = await browser.newPage();
    const matches = [];

    try {
        const success = await smartGoto(page, 'xoilac');
        if (!success) throw new Error("No Xoilac mirrors reachable.");
        
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
    } catch (e) { console.error(`[Xoi Error]: ${e.message}`); } 
    finally { await browser.close(); }
    console.log(`   Found ${matches.length} matches.`);
    return matches;
}