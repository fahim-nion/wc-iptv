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

export async function discoverXoilac() {
    const source = config.sources.xoilac;
    if (!source) return [];

    console.log(`\n🔍 [XOILAC] Scanning homepage for matches...`);

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH || undefined,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const page = await browser.newPage();
    const matches = [];
    const urls = [source.homepage, ...(source.mirrors || [])];

    try {
        for (const url of urls) {
            try {
                console.log(`[XOILAC] Checking: ${url}`);
                await page.goto(url, {
                    waitUntil: 'load',
                    timeout: 30000
                });

                // Scroll slightly to ensure lazy-loaded cards are populated
                await page.evaluate(() => window.scrollBy(0, 500));
                await new Promise(r => setTimeout(r, 4000));

                const extracted = await page.evaluate(() => {
                    const liveList = [];
                    const upcomingList = [];
                    const seen = new Set();

                    // 1. Primary extraction from match card containers
                    const cards = document.querySelectorAll('.grid-matches__item, .match-football-item, .grid-matches__item-match');
                    for (const card of cards) {
                        const linkEl = card.querySelector('a[href*="/truc-tiep/"]');
                        if (!linkEl) continue;

                        let mUrl = linkEl.href.split('#')[0];
                        if (mUrl.includes('/link/')) {
                            mUrl = mUrl.split('/link/')[0];
                        }
                        if (!mUrl.endsWith('/')) mUrl += '/';
                        if (seen.has(mUrl)) continue;

                        const cardText = card.innerText || '';
                        const status = card.getAttribute('data-status') || '';

                        // Skip finished matches
                        if (cardText.includes('KẾT THÚC') || status === '5' || status === '6') {
                            continue;
                        }

                        let title = '';
                        const homeEl = card.querySelector('.grid-match__team--home-name, .home-name, .team--home');
                        const awayEl = card.querySelector('.grid-match__team--away-name, .away-name, .team--away');

                        if (homeEl && awayEl && homeEl.innerText.trim() && awayEl.innerText.trim()) {
                            title = `${homeEl.innerText.trim()} VS ${awayEl.innerText.trim()}`;
                        } else {
                            const teamEls = card.querySelectorAll('.grid-match__team--name, .team-name');
                            if (teamEls.length >= 2 && teamEls[0].innerText.trim() && teamEls[1].innerText.trim()) {
                                title = `${teamEls[0].innerText.trim()} VS ${teamEls[1].innerText.trim()}`;
                            }
                        }

                        // Fallback to URL slug if team elements were missing
                        if (!title) {
                            const slugMatch = mUrl.match(/\/truc-tiep\/([^/]+)/);
                            if (slugMatch) {
                                const slug = slugMatch[1].split('-luc-')[0];
                                title = slug.replace(/-vs-/gi, ' VS ').replace(/-/g, ' ').trim();
                            }
                        }

                        if (!title || title.length <= 3) continue;
                        seen.add(mUrl);

                        // If card has a commentator, active HD broadcast is on link/1;
                        // Otherwise, match uses base URL (which serves signed quickscoreboardz streams)
                        const hasCommentator = !!card.querySelector('.commentator') || !!card.querySelector('a[href*="/link/"]');
                        const finalUrl = hasCommentator ? (mUrl + 'link/1') : mUrl;

                        const isLive = cardText.includes('Đang diễn ra') || cardText.includes('Hiệp') || cardText.includes('HT') || ['1', '2', '3', '4', '13', '51', '53'].includes(status);

                        const item = {
                            title: title.replace(/\s+/g, ' ').toUpperCase(),
                            url: finalUrl,
                            isLive
                        };

                        if (isLive) {
                            liveList.push(item);
                        } else {
                            upcomingList.push(item);
                        }
                    }

                    // 2. Secondary fallback: all remaining /truc-tiep/ links on page
                    const anchors = document.querySelectorAll('a[href*="/truc-tiep/"]');
                    for (const a of anchors) {
                        let mUrl = a.href.split('#')[0];
                        if (mUrl.includes('/link/')) {
                            mUrl = mUrl.split('/link/')[0];
                        }
                        if (!mUrl.endsWith('/')) mUrl += '/';
                        if (seen.has(mUrl)) continue;

                        let title = a.innerText.trim();
                        if (!title || title.length <= 3) {
                            const slugMatch = mUrl.match(/\/truc-tiep\/([^/]+)/);
                            if (slugMatch) {
                                const slug = slugMatch[1].split('-luc-')[0];
                                title = slug.replace(/-vs-/gi, ' VS ').replace(/-/g, ' ').trim();
                            }
                        }

                        if (title && title.length > 3 && !title.includes('KẾT THÚC')) {
                            seen.add(mUrl);
                            upcomingList.push({
                                title: title.replace(/\s+/g, ' ').toUpperCase(),
                                url: mUrl,
                                isLive: false
                            });
                        }
                    }

                    // Return live matches first so the crawler prioritizes currently active streams
                    return [...liveList, ...upcomingList];
                });

                if (extracted && extracted.length > 0) {
                    for (const item of extracted) {
                        matches.push({
                            source: 'xoilac',
                            title: item.title,
                            url: item.url
                        });
                    }
                    console.log(`[XOILAC] Found ${matches.length} matches from ${url}`);
                    break;
                }
            } catch (err) {
                console.log(`[XOILAC] Warning: ${url} error (${err.message})`);
            }
        }
    } catch (e) {
        console.error(`[XOILAC Discovery Error]: ${e.message}`);
    } finally {
        await browser.close();
    }

    console.log(`\n[XOILAC] Discovery complete: ${matches.length} matches`);
    return matches;
}

export const discoverSocolive = () => performDiscovery('socolive', 'a[href*="/truc-tiep/"]');
export const discoverFanzone = () => performDiscovery('fanzone', 'a[href*="/match/"], a[href*="/live/"]');
export async function discoverCamel1() {
    const source = config.sources.camel1;
    if (!source || !source.enabled) return [];

    console.log(`\n🔍 [CAMEL1] Scanning...`);

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH || undefined,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const page = await browser.newPage();
    const urls = [source.homepage, ...(source.mirrors || [])];
    const matches = [];

    try {
        for (const url of urls) {
            try {
                await page.goto(url, { waitUntil: 'load', timeout: 30000 });
                await new Promise(r => setTimeout(r, 5000));

                const links = await page.$$eval('a[href*="/football/match-"]', anchors => {
                    return anchors.map(a => {
                        const href = a.href;
                        const match = href.match(/\/football\/match-(.+?)(?:\/live|\/animation)?\/([^/]+)\/?$/);
                        if (!match) return null;

                        const slug = match[1];
                        const matchId = match[2];

                        let title = a.innerText.trim().replace(/\s+/g, ' ');
                        if (!title || title.length <= 3) {
                            title = slug
                                .replace(/-vs-/gi, ' VS ')
                                .replace(/-/g, ' ')
                                .replace(/\b\w/g, c => c.toUpperCase());
                        }

                        // Always route to /live/ page for stream capture
                        const isLive = href.includes('/live/');
                        const liveUrl = `${new URL(href).origin}/football/match-${slug}/live/${matchId}`;

                        return {
                            title,
                            url: liveUrl,
                            matchId,
                            isLive
                        };
                    }).filter(Boolean);
                });

                const seen = new Set();
                const liveList = [];
                const upcomingList = [];

                for (const item of links) {
                    if (seen.has(item.matchId)) continue;
                    seen.add(item.matchId);
                    const matchObj = {
                        source: 'camel1',
                        title: item.title.toUpperCase(),
                        url: item.url,
                        matchId: item.matchId
                    };
                    if (item.isLive) {
                        liveList.push(matchObj);
                    } else {
                        upcomingList.push(matchObj);
                    }
                }

                matches.push(...liveList, ...upcomingList);

                if (matches.length > 0) {
                    console.log(`[CAMEL1] Found ${matches.length} matches from ${url}`);
                    break;
                }
            } catch (err) {
                console.log(`[CAMEL1] Warning: ${url} error (${err.message})`);
            }
        }
    } catch (e) {
        console.error(`[CAMEL1 Error]: ${e.message}`);
    } finally {
        await browser.close();
    }

    return matches;
}