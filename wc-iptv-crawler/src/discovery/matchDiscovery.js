import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';

chromium.use(stealth());

async function setupDiscoveryPage(browser) {
    const page = await browser.newPage();
    await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        // Allow scripts for Socolive as they render the match list
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
            console.log(`   ➤ Trying domain: ${url}`);
            // Use 'commit' instead of 'domcontentloaded' to bypass Socolive's redirect loops
            const res = await page.goto(url, { waitUntil: 'commit', timeout: 25000 });
            
            // Wait manually for the body to ensure we are past any redirect/challenge
            await page.waitForSelector('body', { timeout: 10000 });
            
            return url;
        } catch (e) {
            console.log(`   ⚠ Domain attempt failed: ${url}`);
        }
    }
    throw new Error(`All domains for ${sourceKey} are unreachable.`);
}

export async function discoverSocolive() {
    console.log("🔍 [Socolive] Scanning...");
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await setupDiscoveryPage(browser);
    const matches = [];

    try {
        await smartGoto(page, 'socolive');
        await page.waitForSelector('a[href*="/truc-tiep/"]', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(5000); 

        const links = await page.$$eval('a', (anchors) => {
            return anchors
                .filter(a => a.href.includes('/truc-tiep/'))
                .map(a => {
                    const t = a.querySelector('.name-match, .title, .team-name, h3, span');
                    return { url: a.href, title: t ? t.innerText.trim() : a.innerText.trim() };
                });
        });

        const seen = new Set();
        for (const link of links) {
            const cleanTitle = link.title.split('\n')[0].replace(/LINK TRỰC TIẾP /gi, '').trim();
            if (cleanTitle && !seen.has(link.url) && !link.title.toUpperCase().includes('KẾT THÚC')) {
                seen.add(link.url);
                matches.push({ source: 'socolive', title: cleanTitle, url: link.url });
            }
        }
    } catch (e) { console.error("[Socolive] Discovery Error:", e.message); }
    finally { await browser.close(); }
    console.log(`   ➤ Found ${matches.length} matches on Socolive.`);
    return matches;
}

export async function discoverColaTV() {
    console.log("🔍 [ColaTV] Scanning...");
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await setupDiscoveryPage(browser);
    const matches = [];

    try {
        await smartGoto(page, 'colatv');
        await page.waitForTimeout(5000);

        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                const teams = a.querySelectorAll('.name');
                const title = teams.length >= 2 ? `${teams[0].innerText} vs ${teams[1].innerText}` : a.innerText.trim();
                return { url: a.href, title: title };
            });
        });

        const seen = new Set();
        for (const link of links) {
            const cleanTitle = link.title.replace(/TRỰC TIẾP /gi, '').trim();
            if (cleanTitle && !seen.has(link.url) && !cleanTitle.includes('FT')) {
                seen.add(link.url);
                matches.push({ source: 'colatv', title: cleanTitle, url: link.url });
            }
        }
    } catch (e) { console.error("[ColaTV] Discovery Error:", e.message); }
    finally { await browser.close(); }
    console.log(`   ➤ Found ${matches.length} matches on ColaTV.`);
    return matches;
}

export async function discoverXoilac() {
    console.log("🔍 [Xoilac] Scanning...");
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await setupDiscoveryPage(browser);
    const matches = [];

    try {
        await smartGoto(page, 'xoilac');
        await page.waitForTimeout(5000);

        const links = await page.$$eval('a[href*="/truc-tiep/"]', (anchors) => {
            return anchors.map(a => {
                const h = a.querySelector('.home-name, .name-1');
                const aw = a.querySelector('.away-name, .name-2');
                return { url: a.href, title: h && aw ? `${h.innerText.trim()} vs ${aw.innerText.trim()}` : a.innerText.trim() };
            });
        });

        const seen = new Set();
        for (const link of links) {
            if (!seen.has(link.url) && !link.url.includes('/link/')) {
                seen.add(link.url);
                matches.push({ source: 'xoilac', title: link.title.split('\n')[0].trim(), url: link.url });
            }
        }
    } catch (e) { console.error("[Xoilac] Discovery Error:", e.message); }
    finally { await browser.close(); }
    console.log(`   ➤ Found ${matches.length} matches on Xoilac.`);
    return matches;
}