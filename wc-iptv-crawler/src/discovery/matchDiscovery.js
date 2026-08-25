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

async function smartGoto(page, url) {
    await page.setUserAgent(config.userAgent);
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    
    console.log(`   ➤ Accessing: ${url}`);
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    
    // 1. Wait specifically for a match link to appear in the HTML
    // This handles the "Found 0 matches" issue
    try {
        await page.waitForSelector('a[href*="/truc-tiep/"]', { timeout: 15000 });
        console.log("   ✔ Match list rendered.");
    } catch (e) {
        console.log("   ⚠ Content timeout: Match list didn't appear.");
    }

    // 2. Scroll a bit to trigger lazy-loading of more matches
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 2000));
}

export async function discoverSocolive() {
    console.log("🔍 [Socolive] Scanning...");
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH, headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    const page = await browser.newPage();
    const matches = [];

    try {
        await smartGoto(page, config.sources.socolive.homepage);
        
        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                // Find team names inside the card
                const teamNodes = a.querySelectorAll('.name-match span, .name-team, .title span, .name');
                let title = (teamNodes.length >= 2) 
                    ? `${teamNodes[0].innerText.trim()} vs ${teamNodes[1].innerText.trim()}`
                    : a.innerText.trim().split('\n')[0];
                return { url: a.href, title };
            });
        });

        const seen = new Set();
        for (const link of links) {
            const clean = link.title.replace(/LINK TRỰC TIẾP |VÀO LÚC.*/gi, '').trim();
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
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const matches = [];

    try {
        await smartGoto(page, config.sources.colatv.homepage);
        
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
    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const matches = [];

    try {
        await smartGoto(page, config.sources.xoilac.homepage);
        
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