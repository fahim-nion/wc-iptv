import { chromium as baseChromium } from 'playwright-core';
import { addExtra } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';

// Manual patch for Termux/Playwright-Core compatibility
const chromium = addExtra(baseChromium);
chromium.use(stealth());

async function setupDiscoveryPage(browser) {
    const page = await browser.newPage();
    await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (['image', 'font', 'media'].includes(type)) return route.abort();
        route.continue();
    });
    return page;
}

async function smartGoto(page, sourceKey) {
    const source = config.sources[sourceKey];
    const urls = [source.homepage, ...(source.mirrors || [])];
    for (const url of urls) {
        try {
            const res = await page.goto(url, { waitUntil: 'commit', timeout: 20000 });
            await page.waitForSelector('body', { timeout: 10000 });
            return url;
        } catch (e) { continue; }
    }
    throw new Error(`All domains for ${sourceKey} failed.`);
}

export async function discoverSocolive() {
    console.log("🔍 [Socolive] Scanning...");
    const browser = await chromium.launch({ 
        executablePath: '/data/data/com.termux/files/usr/bin/chromium',
        headless: true, 
        args: ['--no-sandbox'] 
    });
    const page = await setupDiscoveryPage(browser);
    const matches = [];
    try {
        await smartGoto(page, 'socolive');
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
    const browser = await chromium.launch({ 
        executablePath: '/data/data/com.termux/files/usr/bin/chromium',
        headless: true, 
        args: ['--no-sandbox'] 
    });
    const page = await setupDiscoveryPage(browser);
    const matches = [];
    try {
        await smartGoto(page, 'colatv');
        await page.waitForTimeout(5000);
        const links = await page.$$eval('.list-match a[href*="/truc-tiep/"]', (anchors) => {
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
    const browser = await chromium.launch({ 
        executablePath: '/data/data/com.termux/files/usr/bin/chromium',
        headless: true, 
        args: ['--no-sandbox'] 
    });
    const page = await setupDiscoveryPage(browser);
    const matches = [];
    try {
        await smartGoto(page, 'xoilac');
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
