import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';

puppeteer.use(stealth());

const CHROME_PATH = '/data/data/com.termux/files/usr/bin/chromium-browser';;

async function setupPage(browser) {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'font', 'stylesheet', 'media'].includes(req.resourceType())) req.abort();
        else req.continue();
    });
    return page;
}

export async function discoverSocolive() {
    console.log("🔍 [Socolive] Scanning...");
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await setupPage(browser);
    const matches = [];
    try {
        await page.goto(config.sources.socolive.homepage, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(6000); 
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
    } catch (e) { console.error(e.message); } finally { await browser.close(); }
    return matches;
}

export async function discoverColaTV() {
    console.log("🔍 [ColaTV] Scanning...");
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH,
        headless: true, 
        args: ['--no-sandbox'] 
    });
    const page = await setupPage(browser);
    const matches = [];
    try {
        await page.goto(config.sources.colatv.homepage, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
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
    } catch (e) { console.error(e.message); } finally { await browser.close(); }
    return matches;
}

export async function discoverXoilac() {
    console.log("🔍 [Xoilac] Scanning...");
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH,
        headless: true, 
        args: ['--no-sandbox'] 
    });
    const page = await setupPage(browser);
    const matches = [];
    try {
        await page.goto(config.sources.xoilac.homepage, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
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
    } catch (e) { console.error(e.message); } finally { await browser.close(); }
    return matches;
}
