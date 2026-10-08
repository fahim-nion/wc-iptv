import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import config from '../../config.js';
import fs from 'fs';
import { execSync } from 'child_process';

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

export async function discoverLiveLive24() {
    const source = config.sources.livelive24;
    if (!source || !source.enabled) return [];

    console.log(`\n🔍 [LIVELIVE24] Scanning TopHD matches...`);
    const endpoint = "https://livelive24.com/test/processed_matches_prioritized.json";
    const matches = [];

    try {
        const res = await fetch(endpoint, {
            headers: { 
                'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
            },
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
            console.log(`[LIVELIVE24] HTTP Error: ${res.status}`);
            return [];
        }
        const data = await res.json();
        if (!Array.isArray(data)) return [];

        for (const match of data) {
            if (!match.has_stream || !Array.isArray(match.streams) || match.streams.length === 0) continue;

            const baseName = (match.name || 'UNKNOWN MATCH').trim().toUpperCase();

            match.streams.forEach((stream, index) => {
                if (!stream.url) return;
                const quality = (stream.quality || '').trim().toUpperCase();
                const serverLabel = quality ? `[SERVER ${index + 1} - ${quality}]` : `[SERVER ${index + 1}]`;
                const title = `${baseName} ${serverLabel}`;

                matches.push({
                    source: 'livelive24',
                    title: title,
                    url: stream.url,
                    quality: stream.quality,
                    serverIndex: index + 1
                });
            });
        }
        console.log(`[LIVELIVE24] Discovered ${matches.length} server streams across ${data.length} matches.`);
    } catch (e) {
        console.error(`[LIVELIVE24 Discovery Error]: ${e.message}`);
    }

    return matches;
}

export async function discoverCamel1() {
    const source = config.sources.camel1;
    if (!source || !source.enabled) return [];

    console.log(`\n🔍 [CAMEL1] Scanning matches...`);
    const urls = [source.homepage, ...(source.mirrors || [])];
    const matches = [];
    const seen = new Set();

    for (const baseUrl of urls) {
        try {
            const res = await fetch(baseUrl, {
                headers: { 'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                signal: AbortSignal.timeout(10000)
            });
            if (!res.ok) continue;
            const html = await res.text();
            
            const regex = /href=["'](\/football\/match-([^"'\/]+?)(?:\/live|\/animation)?\/([a-zA-Z0-9]+))["']/g;
            let m;
            const liveMatches = [];
            const otherMatches = [];

            while ((m = regex.exec(html)) !== null) {
                const path = m[1];
                const slug = m[2];
                const matchId = m[3];
                if (seen.has(matchId)) continue;
                seen.add(matchId);

                const title = slug
                    .replace(/-vs-/gi, ' VS ')
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());

                const origin = new URL(baseUrl).origin;
                const isLive = path.includes('/live/');
                const matchObj = {
                    source: 'camel1',
                    title: title.toUpperCase(),
                    url: `${origin}/football/match-${slug}/live/${matchId}`,
                    matchId
                };

                if (isLive) {
                    liveMatches.push(matchObj);
                } else {
                    otherMatches.push(matchObj);
                }
            }

            matches.push(...liveMatches, ...otherMatches);
            if (matches.length > 0) {
                console.log(`[CAMEL1] Discovered ${matches.length} matches (${liveMatches.length} live).`);
                return matches;
            }
        } catch (e) {
            console.log(`[CAMEL1] Quick scan notice: ${e.message}`);
        }
    }

    return matches;
}

// --- HESGOAL (hesgoalltv.net) DISCOVERY ---
async function safeFetchText(url, headers = {}) {
    try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
        if (res.ok) return await res.text();
    } catch (e) {}
    try {
        const headerArgs = Object.entries(headers).map(([k, v]) => `-H "${k}: ${v}"`).join(' ');
        return execSync(`curl -sL ${headerArgs} "${url}"`, { timeout: 10000, maxBuffer: 10 * 1024 * 1024 }).toString();
    } catch (e) {
        return null;
    }
}

export async function discoverHesGoal() {
    const source = config.sources.hesgoal;
    if (!source || !source.enabled) return [];

    console.log(`\n🔍 [HESGOAL] Scanning matches from hesgoalltv.net...`);
    const matches = [];

    try {
        const homepageUrl = source.homepage || "https://hesgoalltv.net/";
        const html = await safeFetchText(homepageUrl, {
            'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });

        if (!html) {
            console.log(`[HESGOAL] Could not load homepage`);
            return [];
        }

        const scriptMatch = html.match(/<script>([\s\S]*?kfDecode[\s\S]*?)<\/script>/);
        if (!scriptMatch) {
            console.log(`[HESGOAL] kfDecode decoder script not found on homepage`);
            return [];
        }

        const decoderFunc = new Function('window', `${scriptMatch[1]}; return window.kfDecode;`);
        const kfDecode = decoderFunc(globalThis);

        if (typeof kfDecode !== 'function') {
            console.log(`[HESGOAL] Failed to initialize kfDecode function`);
            return [];
        }

        const apiUrl = source.api || "https://cdn.kora-api.org/api/v1/matches?lang=en";
        const encData = await safeFetchText(apiUrl, {
            'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': homepageUrl,
            'Accept': 'application/json'
        });

        if (!encData) {
            console.log(`[HESGOAL] Failed to fetch encrypted matches API`);
            return [];
        }

        const data = await kfDecode(encData);
        const rawMatches = Array.isArray(data) ? data : (data?.matches || []);
        const liveDomain = data.en_live_domain || data.live_domain || "goalakor.space";

        const liveMatches = [];
        const otherMatches = [];

        for (const m of rawMatches) {
            if (parseInt(m.status) === 2) continue; // Finished
            if (Number(m.active) === 0 || Number(m.has_channels) === 0) continue;

            const home = m.home?.name || "";
            const away = m.away?.name || "";
            if (!home || !away) continue;

            const title = `${home} VS ${away}`.toUpperCase();
            const matchUrl = `https://${liveDomain}/kora.html?m=${m.id}`;
            const isLive = parseInt(m.status) === 1 || parseInt(m.status) === 3;

            const item = {
                source: 'hesgoal',
                title,
                url: matchUrl,
                matchId: m.id,
                liveDomain,
                isLive
            };

            if (isLive) {
                liveMatches.push(item);
            } else {
                otherMatches.push(item);
            }
        }

        matches.push(...liveMatches, ...otherMatches);
        console.log(`[HESGOAL] Discovered ${matches.length} matches (${liveMatches.length} live).`);
    } catch (e) {
        console.error(`[HESGOAL Discovery Error]: ${e.message}`);
    }

    return matches;
}