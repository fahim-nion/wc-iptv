import puppeteer, { getChromePath } from '../utils/puppeteerLoader.js';
import config from '../../config.js';
import fs from 'fs';
import { execSync } from 'child_process';
import { normalizeMatchTitle } from '../utils/titleNormalizer.js';

const CHROME_PATH = getChromePath();

function extractMatchFromUrlAndText(url, rawText) {
    let matchTitle = '';
    const slugMatch = url.match(/\/truc-tiep\/([^/?#]+)/);
    if (slugMatch) {
        let slug = slugMatch[1]
            .replace(/-luc-.*$/i, '')
            .replace(/-\d{1,2}-\d{1,2}-\d{4}.*$/i, '')
            .replace(/-\d{4}-\d{2}-\d{2}.*$/i, '')
            .replace(/-[a-z0-9]{15,}$/i, '')
            .replace(/^(cau-lac-bo-bong-da|clb|fc)-/i, '')
            .replace(/-vs-(cau-lac-bo-bong-da|clb|fc)-/i, '-vs-')
            .replace(/-balompie/i, '');
        const parts = slug.split('-vs-');
        if (parts.length === 2) {
            const t1 = parts[0].replace(/-/g, ' ').trim().toUpperCase();
            const t2 = parts[1].replace(/-/g, ' ').trim().toUpperCase();
            matchTitle = `${t1} VS ${t2}`;
        }
    }

    let commentator = (rawText || '')
        .split('\n')[0]
        .replace(/LINK TRỰC TIẾP |TRỰC TIẾP |HOT|LIVE|LIVE NOW|VÀO LÚC.*/gi, '')
        .replace(/^[0-9]{2}:[0-9]{2}/g, '')
        .trim();

    if (commentator.includes(' VS ') || commentator.length > 25) {
        if (!matchTitle) matchTitle = commentator;
        commentator = '';
    }

    if (!matchTitle) matchTitle = commentator || 'UNKNOWN MATCH';
    matchTitle = normalizeMatchTitle(matchTitle);

    return { matchTitle, commentator: commentator.toUpperCase() };
}

// --- Enhanced performDiscovery for Socolive and other sources ---
async function performDiscovery(sourceKey, selector) {
    const source = config.sources[sourceKey];
    if (!source || !source.enabled) return [];
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH || undefined,
        headless: true, 
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--block-new-web-contents',
            '--ignore-certificate-errors', 
            '--ignore-certificate-errors-spki-list'
        ] 
    });
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => { window.open = () => null; }).catch(() => {});
    const matches = [];
    const urls = [source.homepage, ...(source.mirrors || [])];
    try {
        for (const url of urls) {
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                await new Promise(r => setTimeout(r, 4000));
                const links = await page.$$eval(selector, (anchors) => {
                    return anchors.map(a => ({ url: a.href, text: a.innerText.trim() }));
                });
                
                const groups = new Map();
                const seenUrls = new Set();
                for (const link of links) {
                    if (seenUrls.has(link.url) || link.url.includes('/link/')) continue;
                    seenUrls.add(link.url);
                    const { matchTitle, commentator } = extractMatchFromUrlAndText(link.url, link.text);
                    if (!matchTitle || matchTitle.length <= 3 || matchTitle.includes('KẾT THÚC')) continue;

                    if (!groups.has(matchTitle)) groups.set(matchTitle, []);
                    groups.get(matchTitle).push({ url: link.url, commentator });
                }

                for (const [baseTitle, list] of groups.entries()) {
                    list.forEach((entry, idx) => {
                        const serverNum = idx + 1;
                        const tag = entry.commentator ? `[SERVER ${serverNum} - ${entry.commentator}]` : `[SERVER ${serverNum}]`;
                        matches.push({
                            source: sourceKey,
                            title: `${baseTitle} ${tag}`,
                            url: entry.url,
                            serverIndex: serverNum
                        });
                    });
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
    if (!source || !source.enabled) return [];
    console.log(`\n🔍 [COLATV] Running Deep Scan for Hot Matches...`);
    
    const browser = await puppeteer.launch({ 
        executablePath: CHROME_PATH || undefined,
        headless: true, 
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--block-new-web-contents',
            '--ignore-certificate-errors', 
            '--ignore-certificate-errors-spki-list'
        ] 
    });
    
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => { window.open = () => null; }).catch(() => {});
    const matches = [];
    
    const domains = [source.homepage, ...(source.mirrors || [])].filter(Boolean);
    try {
        let loaded = false;
        for (const dom of domains) {
            try {
                await page.goto(dom, { waitUntil: 'domcontentloaded', timeout: 25000 });
                loaded = true;
                break;
            } catch (err) {
                // Try next mirror
            }
        }
        if (!loaded) throw new Error("Could not load ColaTV homepage or mirrors");
        
        // 1. Scroll slightly to trigger lazy-loading matches
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 6000));

        // 2. Specialized selector for ColaTV match blocks
        const data = await page.evaluate(() => {
            const items = document.querySelectorAll('a[href*="/truc-tiep/"]');
            return Array.from(items).map(a => {
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

        const groups = new Map();
        const seenUrls = new Set();
        for (const item of data) {
            if (seenUrls.has(item.url) || item.url.includes('/link/')) continue;
            seenUrls.add(item.url);

            const { matchTitle, commentator } = extractMatchFromUrlAndText(item.url, item.rawText);
            if (!matchTitle || matchTitle.length <= 3 || matchTitle.includes('KẾT THÚC')) continue;

            if (!groups.has(matchTitle)) groups.set(matchTitle, []);
            groups.get(matchTitle).push({ url: item.url, commentator });
        }

        for (const [baseTitle, list] of groups.entries()) {
            list.forEach((entry, idx) => {
                const serverNum = idx + 1;
                const tag = entry.commentator ? `[SERVER ${serverNum} - ${entry.commentator}]` : `[SERVER ${serverNum}]`;
                matches.push({
                    source: 'colatv',
                    title: `${baseTitle} ${tag}`,
                    url: entry.url,
                    serverIndex: serverNum
                });
            });
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
    if (!source || !source.enabled) return [];

    console.log(`\n🔍 [XOILAC] Scanning homepage for matches...`);

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH || undefined,
        headless: true,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--block-new-web-contents',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list'
        ]
    });

    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => { window.open = () => null; }).catch(() => {});
    const matches = [];
    const urls = [source.homepage, ...(source.mirrors || [])];

    try {
        for (const url of urls) {
            try {
                console.log(`[XOILAC] Checking: ${url}`);
                await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 12000
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
                let resolvedUrl = stream.url;
                if (resolvedUrl.includes('?url=') || resolvedUrl.includes('&url=')) {
                    const rawParam = resolvedUrl.split(/[?&]url=/)[1]?.split('&')[0];
                    if (rawParam) {
                        try {
                            const decodedParam = decodeURIComponent(rawParam);
                            if (decodedParam.startsWith('http')) {
                                resolvedUrl = decodedParam;
                            } else {
                                const b64 = Buffer.from(decodedParam, 'base64').toString('utf-8');
                                if (b64.startsWith('http')) {
                                    resolvedUrl = b64;
                                }
                            }
                        } catch (e) {}
                    }
                }
                const quality = (stream.quality || '').trim().toUpperCase();
                const serverLabel = quality ? `[SERVER ${index + 1} - ${quality}]` : `[SERVER ${index + 1}]`;
                const title = `${baseName} ${serverLabel}`;

                matches.push({
                    source: 'livelive24',
                    title: title,
                    url: resolvedUrl,
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
export async function discoverXyzStreams() {
    const source = config.sources?.xyzstreams;
    if (source && source.enabled === false) return [];

    console.log(`\n🔍 [XYZSTREAMS] Scanning matches from xyzstreams.st...`);
    const matches = [];
    try {
        const homepage = source?.homepage || "https://xyzstreams.st";
        const res = await fetch(homepage, {
            headers: { 
                "User-Agent": config.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 
            },
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
            console.log(`   ✘ [XYZSTREAMS] Discovery failed: HTTP ${res.status}`);
            return [];
        }
        const text = await res.text();
        const marker = "const EVENTS_DATA = ";
        const idx = text.indexOf(marker);
        if (idx !== -1) {
            const startBracket = text.indexOf("[", idx);
            let depth = 0;
            let endBracket = -1;
            for (let i = startBracket; i < text.length; i++) {
                if (text[i] === "[") depth++;
                else if (text[i] === "]") {
                    depth--;
                    if (depth === 0) {
                        endBracket = i;
                        break;
                    }
                }
            }
            if (startBracket !== -1 && endBracket !== -1) {
                const jsonStr = text.slice(startBracket, endBracket + 1);
                let events = [];
                try {
                    events = JSON.parse(jsonStr);
                } catch (e) {
                    console.log(`[XYZSTREAMS] JSON parse notice: ${e.message}`);
                }
                
                for (const ev of events) {
                    const category = (ev.category || '').toLowerCase();
                    const isSoccer = category.includes('soccer') || (category.includes('football') && !category.includes('american'));
                    if (isSoccer && ev.title && ev.href) {
                        const href = ev.href.startsWith('http') 
                            ? ev.href 
                            : `https://xyzstreams.st/${ev.href.replace(/^\//, '')}`;
                        matches.push({
                            title: ev.title.trim().toUpperCase(),
                            url: href,
                            source: 'xyzstreams'
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.log(`   ✘ [XYZSTREAMS] Discovery failed: ${e.message}`);
    }
    console.log(`[XYZSTREAMS] Discovered ${matches.length} matches.`);
    return matches;
}

export async function discoverFutbolX() {
    const source = config.sources?.futbolx;
    if (!source || !source.enabled) return [];
    console.log(`\n🔍 [FUTBOLX] Scanning live streams from futbol-x.xyz...`);
    const matches = [];
    const categories = ['football', 'basketball'];

    for (const cat of categories) {
        try {
            const endpoint = `https://www.futbol-x.xyz/api/${cat}.json`;
            const res = await fetch(endpoint, {
                headers: { 'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                signal: AbortSignal.timeout(10000)
            });
            if (!res.ok) continue;
            const data = await res.json();

            for (const group of data.streams || []) {
                for (const match of group.streams || []) {
                    const streamsList = match.streams || [];
                    for (let i = 0; i < streamsList.length; i++) {
                        const s = streamsList[i];
                        if (!s.url || !s.url.startsWith('http')) continue;

                        let playableUrl = s.url;
                        try {
                            const parsed = new URL(s.url);
                            const tokenEndpoint = `https://www.futbol-x.xyz/api/token.js?path=${encodeURIComponent(parsed.pathname)}&sourceHost=${parsed.hostname}&expires=900`;
                            const tokenRes = await fetch(tokenEndpoint, {
                                headers: { 'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                                signal: AbortSignal.timeout(6000)
                            });
                            if (tokenRes.ok) {
                                const tokenData = await tokenRes.json();
                                if (tokenData.success && tokenData.url) {
                                    playableUrl = tokenData.url;
                                }
                            }
                        } catch (e) {}

                        const baseTitle = normalizeMatchTitle(match.name);
                        const serverSuffix = streamsList.length > 1 ? ` [SERVER ${i + 1} - HD]` : ` [SERVER 1 - HD]`;
                        matches.push({
                            title: `${baseTitle}${serverSuffix}`,
                            url: playableUrl,
                            source: 'futbolx'
                        });
                    }
                }
            }
        } catch (e) {
            console.log(`   ✘ [FUTBOLX] Discovery failed for ${cat}: ${e.message}`);
        }
    }

    console.log(`[FUTBOLX] Discovered ${matches.length} matches.`);
    return matches;
}

export async function discoverStreamcorner() {
    const source = config.sources?.streamcorner;
    if (!source || !source.enabled) return [];
    console.log(`\n🔍 [STREAMCORNER] Scanning matches from streamcorner.st...`);
    const matches = [];

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH || undefined,
        headless: true,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--block-new-web-contents',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', req => {
            const u = req.url();
            if (u.includes('disable-devtool') || u.includes('popa') || u.includes('rapidadexchange') || u.includes('google-analytics')) {
                return req.abort();
            }
            req.continue();
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
        await page.goto(source.homepage || 'https://streamcorner.st/', { waitUntil: 'domcontentloaded', timeout: 35000 });
        await new Promise(r => setTimeout(r, 4000));

        // Click ALL or LIVE button to reveal cards
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const soccerBtn = buttons.find(b => {
                const txt = b.innerText.trim().toUpperCase();
                return txt === 'SOCCER' || txt === 'FOOTBALL';
            });
            if (soccerBtn) {
                soccerBtn.click();
            } else {
                const liveBtn = buttons.find(b => {
                    const txt = b.innerText.trim().toUpperCase();
                    return txt === 'LIVE' || txt === 'ALL' || txt === 'TODAY';
                });
                if (liveBtn) liveBtn.click();
            }
        }).catch(() => {});

        await new Promise(r => setTimeout(r, 2000));
        await page.evaluate(() => window.scrollBy(0, 1200)).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));

        const cards = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .filter(a => a.href && a.href.includes('/stream/'))
                .map(a => {
                    const text = a.innerText.replace(/\n+/g, ' | ').trim();
                    return {
                        url: a.href,
                        text
                    };
                });
        });

        const seenUrls = new Set();
        for (const card of cards) {
            if (seenUrls.has(card.url)) continue;
            seenUrls.add(card.url);

            let title = card.text;
            if (title.includes(' | ')) {
                const parts = title.split(' | ');
                const vsPart = parts.find(p => p.toUpperCase().includes(' VS ') || p.toUpperCase().includes(' AT '));
                if (vsPart) {
                    title = vsPart;
                } else if (parts.length >= 2) {
                    title = parts.find(p => p.length > 5 && !p.match(/^[0-9:\/]+$/) && !['LIVE', 'SOCCER', 'FOOTBALL', 'HD'].includes(p.toUpperCase())) || title;
                }
            }

            title = title
                .replace(/^[0-9\/:,\sAMP]+(\s*\|\s*)?/g, '')
                .replace(/\b(LIVE|SOCCER|FOOTBALL|HD|NCAA|MLB|NFL)\b/gi, '')
                .replace(/\bat\b/gi, 'VS')
                .replace(/[|•·-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase();

            if (title && title.length > 3) {
                matches.push({
                    title: normalizeMatchTitle(title),
                    url: card.url,
                    source: 'streamcorner'
                });
            }
        }
    } catch (e) {
        console.log(`   ✘ [STREAMCORNER] Discovery failed: ${e.message}`);
    } finally {
        await browser.close();
    }

    console.log(`[STREAMCORNER] Discovered ${matches.length} matches.`);
    return matches;
}

export async function discoverAuraSports() {
    const source = config.sources.aurasports;
    if (!source || !source.enabled) return [];
    console.log(`\n🔍 [AURASPORTS] Fetching live sports schedule...`);
    const matches = [];
    try {
        const res = await fetch("https://aurasports.xyz/api/schedule", {
            headers: { 'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) return [];
        const data = await res.json();
        const soccerKeywords = ['soccer', 'football', 'premier', 'laliga', 'serie', 'bundesliga', 'ligue', 'champions', 'europa', 'cup', 'mls'];
        
        for (const cat of data) {
            const catName = (cat.category_name || '').toLowerCase();
            const isSoccerCat = soccerKeywords.some(k => catName.includes(k));
            if (!Array.isArray(cat.schedule)) continue;

            for (const item of cat.schedule) {
                const leagueName = (item.league_name || '').toLowerCase();
                const isSoccer = isSoccerCat || soccerKeywords.some(k => leagueName.includes(k));
                if (!isSoccer) continue;
                if (item.status !== 'live') continue;

                const streamTarget = item.watchUrl || item.iframeUrl;
                if (!streamTarget) continue;

                let title = (item.title || '').trim();
                title = title.replace(/\s+at\s+/i, ' VS ');
                if (!title.includes(' VS ') && item.teams) {
                    const t1 = item.teams.away?.name || item.teams.team1 || '';
                    const t2 = item.teams.home?.name || item.teams.team2 || '';
                    if (t1 && t2) title = `${t1} VS ${t2}`;
                }
                if (!title) continue;

                const finalTitle = normalizeMatchTitle(title);
                matches.push({
                    source: 'aurasports',
                    title: finalTitle,
                    url: streamTarget,
                    isLive: item.status === 'live'
                });
            }
        }
        console.log(`[AURASPORTS] Discovered ${matches.length} football matches.`);
    } catch (e) {
        console.error(`[AURASPORTS Discovery Error]: ${e.message}`);
    }
    return matches;
}

export async function discoverFalconStreams() {
    const source = config.sources.falconstreams;
    if (!source || !source.enabled) return [];
    console.log(`\n🔍 [FALCONSTREAMS] Scanning live football matches...`);
    const matches = [];
    try {
        const res = await fetch("https://falconstreams.st/home1", {
            headers: { 'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(12000)
        });
        if (!res.ok) return [];
        const html = await res.text();
        
        const pushRegex = /self\.__next_f\.push\(\[1,"(.*)"\]\)/g;
        let fullStr = "";
        let m;
        while ((m = pushRegex.exec(html)) !== null) {
            try {
                fullStr += JSON.parse(`"${m[1]}"`);
            } catch(e) {
                fullStr += m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }
        }

        const eventRegex = /\{"_id":"([a-f0-9]+)".*?"category":"([^"]*)".*?"details":\{"text1":"([^"]*)","text2":"([^"]*)","text3":"([^"]*)".*?\}.*?"directStreams":(\[.*?\])/g;
        let em;
        while ((em = eventRegex.exec(fullStr)) !== null) {
            const [_, id, category, sport, t1, t2, rawStreams] = em;
            const catLower = (category || '').toLowerCase();
            const sportLower = (sport || '').toLowerCase();
            const isAmerican = sportLower.includes('nfl') || catLower.includes('nfl') || sportLower.includes('american') || catLower.includes('american');
            if (isAmerican) continue;
            const isFootball = sportLower.includes('soccer') || sportLower.includes('football') || catLower.includes('league') || catLower.includes('cup');
            if (!isFootball) continue;

            let streams = [];
            try {
                streams = JSON.parse(rawStreams);
            } catch(e) {}
            if (!Array.isArray(streams) || streams.length === 0) continue;

            const baseTitle = `${t1.trim()} VS ${t2.trim()}`;
            const cleanTitle = normalizeMatchTitle(baseTitle);

            // Add top streams as servers
            streams.slice(0, 2).forEach((s, sIdx) => {
                if (!s.link) return;
                const serverTag = `[SERVER ${sIdx + 1}${s.streamer ? ' - ' + s.streamer.toUpperCase() : ''}]`;
                matches.push({
                    source: 'falconstreams',
                    title: `${cleanTitle} ${serverTag}`,
                    url: s.link
                });
            });
        }
        console.log(`[FALCONSTREAMS] Discovered ${matches.length} football server streams.`);
    } catch (e) {
        console.error(`[FALCONSTREAMS Discovery Error]: ${e.message}`);
    }
    return matches;
}

// --- 90MINUTES.PRO RESOLVER (Football Only) ---
export async function discover90Minutes() {
    const source = config.sources?.minutes90;
    if (source && source.enabled === false) return [];
    console.log(`\n🔍 [90MINUTES] Scanning football matches from 90minutes.pro...`);
    const matches = [];

    try {
        const res = await fetch("https://www.90minutes.pro/api/streams", {
            headers: {
                "User-Agent": config.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.90minutes.pro/"
            },
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
            console.log(`   ✘ [90MINUTES] API request failed: HTTP ${res.status}`);
            return [];
        }
        const data = await res.json();
        if (!data.success || !Array.isArray(data.streams)) return [];

        // Football ONLY filtering
        const allStreams = [];
        for (const group of data.streams) {
            const cat = (group.category || '').toLowerCase();
            if (cat !== 'football') continue;
            for (const s of group.streams || []) {
                allStreams.push(s);
            }
        }

        console.log(`   [90MINUTES] Found ${allStreams.length} football matches.`);

        // Extract stream URLs for live matches
        for (const match of allStreams) {
            const isLive = match.status === 'live' || match.always_live === 1;
            if (!isLive) continue;

            const baseTitle = normalizeMatchTitle(match.name);
            const matchId = match.id || match.uri_name;
            if (!matchId) continue;

            try {
                const extRes = await fetch(`https://www.90minutes.pro/papi/extract-url/${encodeURI(matchId)}`, {
                    headers: {
                        "User-Agent": config.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": "https://www.90minutes.pro/"
                    },
                    signal: AbortSignal.timeout(6000)
                });
                if (!extRes.ok) continue;
                const extData = await extRes.json();

                if (extData.success && extData.hlsUrl) {
                    matches.push({
                        title: `${baseTitle} [SERVER 1 - HD]`,
                        url: extData.hlsUrl,
                        source: '90minutes'
                    });
                }
                if (extData.success && extData.sdUrl && extData.sdUrl !== extData.hlsUrl) {
                    matches.push({
                        title: `${baseTitle} [SERVER 2 - SD]`,
                        url: extData.sdUrl,
                        source: '90minutes'
                    });
                }
            } catch (e) {}
        }
    } catch (err) {
        console.log(`   ✘ [90MINUTES] Error: ${err.message}`);
    }

    console.log(`[90MINUTES] Discovered ${matches.length} active football streams.`);
    return matches;
}

// --- BINTV.CC STREAM RESOLVER & DISCOVERY (Football Only) ---
export async function resolveBintvStream(streamUrl) {
    try {
        let targetUrl = streamUrl;
        if (streamUrl.includes('id=')) {
            const u = new URL(streamUrl);
            const enc = u.searchParams.get('id');
            if (enc) {
                targetUrl = Buffer.from(enc, 'base64').toString('utf-8');
            }
        }

        if (targetUrl.includes('.m3u8')) return targetUrl;

        const resp = await fetch(targetUrl, {
            headers: {
                "User-Agent": config.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://bintv-sources.pages.dev/"
            },
            signal: AbortSignal.timeout(6000)
        });
        if (!resp.ok) return null;
        const html = await resp.text();

        const scriptMatch = html.match(/var\s+([_a-zA-Z0-9]+)\s*=\s*\[([0-9,\s]+)\],\s*([_a-zA-Z0-9]+)\s*=\s*(\d+),\s*([_a-zA-Z0-9]+)\s*=\s*(\d+)/);
        if (!scriptMatch) return null;

        const arr = eval("[" + scriptMatch[2] + "]");
        const xorKey = parseInt(scriptMatch[4]);
        const offset = parseInt(scriptMatch[6]);
        let code = "";
        for (let i = 0; i < arr.length; i++) {
            code += String.fromCharCode(((arr[i] ^ xorKey) - offset + 256) % 256);
        }

        const tUrlMatch = code.match(/loadStreamUrl\(["']([^"']+)["']/);
        if (!tUrlMatch) return null;
        const tUrl = tUrlMatch[1];

        const tResp = await fetch(tUrl, {
            headers: {
                "User-Agent": config.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": targetUrl
            },
            signal: AbortSignal.timeout(6000)
        });
        if (!tResp.ok) return null;
        const buf = await tResp.arrayBuffer();
        const b = new Uint8Array(buf);
        const tk = tUrl.substring(tUrl.lastIndexOf('/') + 1);
        const s = b[0];
        let resolved = '';
        for (let i = 1; i < b.length; i++) {
            resolved += String.fromCharCode(b[i] ^ tk.charCodeAt((i - 1) % tk.length) ^ ((s + i - 1) & 255));
        }
        return resolved;
    } catch(e) {
        return null;
    }
}

export async function discoverBinTV() {
    const source = config.sources?.bintv;
    if (source && source.enabled === false) return [];
    console.log(`\n🔍 [BINTV] Scanning football matches from bintv.cc...`);
    const matches = [];

    try {
        const res = await fetch("https://bintvjson.lovable.app/api/public/bintvjson", {
            headers: {
                "User-Agent": config.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bintv.cc/"
            },
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
            console.log(`   ✘ [BINTV] API request failed: HTTP ${res.status}`);
            return [];
        }
        const data = await res.json();
        const liveEvents = data["Live Events"] || [];

        // Football ONLY filtering (Soccer or Football category)
        const soccerMatches = liveEvents.filter(m => {
            const cat = (m.category || '').toLowerCase();
            return cat === 'soccer' || cat === 'football';
        });

        console.log(`   [BINTV] Found ${soccerMatches.length} live soccer matches.`);

        for (const match of soccerMatches) {
            const baseTitle = normalizeMatchTitle(match.name);
            const streams = match.streams || [];

            for (let i = 0; i < streams.length; i++) {
                const s = streams[i];
                if (!s.url) continue;

                const resolved = await resolveBintvStream(s.url);
                if (resolved && resolved.startsWith('http')) {
                    const srvName = s.name ? ` [${s.name.toUpperCase()}]` : ` [SERVER ${i + 1} - HD]`;
                    matches.push({
                        title: `${baseTitle}${srvName}`,
                        url: resolved,
                        source: 'bintv'
                    });
                }
            }
        }
    } catch (err) {
        console.log(`   ✘ [BINTV] Error: ${err.message}`);
    }

    console.log(`[BINTV] Discovered ${matches.length} active football streams.`);
    return matches;
}


