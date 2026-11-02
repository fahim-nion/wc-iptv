import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { pushToGitHub } from './github/updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const PERMANENT_CONFIG_PATH = path.resolve(REPO_ROOT, 'src/config/permanentChannels.js');
const TV_JSON_PATH = path.resolve(REPO_ROOT, 'src/data/mahsunsports_tv.json');

// Helper to normalize names for comparison
function cleanChannelName(str = '') {
    return str
        .toLowerCase()
        .replace(/[\s\-_]/g, '')
        .replace(/sport[s]?/g, 'sport')
        .replace(/yildiz/g, 'yıldız')
        .replace(/idman/g, 'idman')
        .trim();
}

/**
 * Resolves the currently active working base URL from mahsunsports.xyz
 */
export async function getActiveMahsunBaseUrl() {
    const fallbackBases = [
        "https://andro.evrenesoglu233.click/checklist/",
        "https://andro.evrenesoglu227.click/checklist/",
        "https://andro.evrenesoglu229.click/checklist/",
        "https://andro.evrenesoglu217.click/checklist/"
    ];

    let baseUrls = [];
    try {
        const res = await fetch("https://mahsunsports.xyz/event.html", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
            const html = await res.text();
            const baseMatch = html.match(/this\.baseurls\s*=\s*\[([^\]]+)\]/);
            if (baseMatch) {
                const found = [...baseMatch[1].matchAll(/["'](https?:\/\/[^"']+)["']/g)].map(m => m[1]);
                if (found.length > 0) {
                    baseUrls = found;
                }
            }
        }
    } catch (e) {
        console.log(chalk.yellow(`[MahsunSports] Could not read event.html: ${e.message}. Using fallback base URLs.`));
    }

    if (baseUrls.length === 0) {
        baseUrls = fallbackBases;
    }

    // Ping test stream on each base to find the first working (HTTP 200) base
    for (const base of baseUrls) {
        try {
            const testUrl = base + "androstreamlivebs2.m3u8";
            const ping = await fetch(testUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": "https://mahsunsports.xyz/"
                },
                signal: AbortSignal.timeout(4000)
            });
            if (ping.status === 200) {
                return base;
            }
        } catch (e) {}
    }

    return baseUrls[0];
}

/**
 * Resolves the stream filename according to MahsunSports player logic
 */
function resolveStreamFileName(streamId) {
    if (!streamId) return null;
    if (streamId === "androstreamlivebs1") {
        return "batutest.m3u8";
    }
    if (streamId.startsWith("androstreamlive")) {
        return streamId + ".m3u8";
    }
    return streamId + ".m3u8";
}

/**
 * Validates whether a stream URL returns 200 OK.
 */
async function checkStreamHealth(url) {
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://mahsunsports.xyz/"
            },
            signal: AbortSignal.timeout(3500)
        });
        return { isValid: res.status === 200, status: res.status };
    } catch (e) {
        return { isValid: false, status: 0, error: e.message };
    }
}

/**
 * Crawls the "TV" section of mahsunsports.xyz, figures out channel links,
 * and updates permanentChannels.js for the website.
 */
export async function updatePermanentChannels({ push = true } = {}) {
    console.log(chalk.bold("\n" + "=".repeat(65)));
    console.log(chalk.bold.cyan("   MAHSUNSPORTS 'TV' SECTION PERMANENT CHANNELS UPDATER   "));
    console.log(chalk.bold("=".repeat(65)));

    if (!fs.existsSync(PERMANENT_CONFIG_PATH)) {
        console.error(chalk.red(`✘ Cannot find permanentChannels.js at: ${PERMANENT_CONFIG_PATH}`));
        return false;
    }

    // 1. Resolve active base URL (e.g. https://andro.evrenesoglu233.click/checklist/)
    const activeBase = await getActiveMahsunBaseUrl();
    console.log(chalk.green.bold(`\n✔ Active MahsunSports Base URL: ${activeBase}`));

    // 2. Head to the "TV" section on https://mahsunsports.xyz/
    console.log(chalk.blue(`\n🔍 Crawling "TV" section from https://mahsunsports.xyz/...`));
    let rawTvChannels = [];

    try {
        // Fetch script4.js where channels array is defined
        const scriptRes = await fetch("https://mahsunsports.xyz/script4.js", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            signal: AbortSignal.timeout(8000)
        });
        if (scriptRes.ok) {
            const script = await scriptRes.text();
            const matches = [...script.matchAll(/\{\s*title:\s*["']([^"']+)["'],\s*url:\s*["']\/event\.html\?id=([^"']+)["']\s*\}/g)];
            for (const m of matches) {
                rawTvChannels.push({
                    title: m[1].trim(),
                    id: m[2].trim()
                });
            }
        }
    } catch (e) {
        console.error(chalk.red(`✘ Error fetching script4.js: ${e.message}`));
    }

    console.log(chalk.cyan(`   Discovered ${rawTvChannels.length} channels in the "TV" section.`));

    // 3. Figure out working links for each channel in the "TV" section
    console.log(chalk.yellow(`\nResolving direct .m3u8 links for "TV" section channels:`));
    const tvChannelsWithLinks = [];
    const mahsunMap = new Map();

    for (const ch of rawTvChannels) {
        const streamFile = resolveStreamFileName(ch.id);
        const streamUrl = `${activeBase}${streamFile}`;
        tvChannelsWithLinks.push({
            name: ch.title,
            id: ch.id,
            streamFile,
            url: streamUrl
        });

        // Map by clean name
        const cleanT = cleanChannelName(ch.title);
        mahsunMap.set(cleanT, streamUrl);

        // Aliases
        if (cleanT === 'beinsport1') mahsunMap.set('beinsports1', streamUrl);
        if (cleanT === 'beinsport2') mahsunMap.set('beinsports2', streamUrl);
        if (cleanT === 'beinsport3') mahsunMap.set('beinsports3', streamUrl);
        if (cleanT === 'beinsport4') mahsunMap.set('beinsports4', streamUrl);
        if (cleanT === 'beinsport5') mahsunMap.set('beinsports5', streamUrl);
        if (cleanT === 'beinsportmax1') mahsunMap.set('beinsportsmax1', streamUrl);
        if (cleanT === 'beinsportmax2') mahsunMap.set('beinsportsmax2', streamUrl);
        if (cleanT === 'ssport') mahsunMap.set('ssport1', streamUrl);
        if (cleanT === 'smartsport1') mahsunMap.set('sportssmart1', streamUrl);
        if (cleanT === 'smartsport2') mahsunMap.set('sportssmart2', streamUrl);
        if (cleanT === 'eurosport1') mahsunMap.set('eurosports1', streamUrl);
        if (cleanT === 'eurosport2') mahsunMap.set('eurosports2', streamUrl);
        if (cleanT === 'idmantv') mahsunMap.set('idman', streamUrl);
        if (cleanT === 'trtsporyıldız') mahsunMap.set('trtsportyildiz', streamUrl);
        if (cleanT === 'fbtv') mahsunMap.set('fbsport', streamUrl);
    }

    // Display sample discovered TV links
    tvChannelsWithLinks.slice(0, 10).forEach(c => {
        console.log(`   ${chalk.green('✔')} [${c.name}] -> ${chalk.white(c.url)}`);
    });
    if (tvChannelsWithLinks.length > 10) {
        console.log(chalk.gray(`   ... and ${tvChannelsWithLinks.length - 10} more channels in "TV" section.`));
    }

    // Save full TV channels list to src/data/mahsunsports_tv.json
    try {
        const dataDir = path.dirname(TV_JSON_PATH);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(TV_JSON_PATH, JSON.stringify(tvChannelsWithLinks, null, 2), 'utf-8');
        console.log(chalk.gray(`\nSaved full ${tvChannelsWithLinks.length} TV channels to: src/data/mahsunsports_tv.json`));
    } catch (e) {}

    // 4. Update the listed permanent channels on the website (src/config/permanentChannels.js)
    console.log(chalk.blue(`\nVerifying and updating listed website permanent channels...`));
    const fileContent = fs.readFileSync(PERMANENT_CONFIG_PATH, 'utf-8');
    let currentChannels = [];
    try {
        const jsonMatch = fileContent.match(/export const PERMANENT_CHANNELS = (\[[\s\S]*?\]);/);
        if (jsonMatch) currentChannels = eval(jsonMatch[1]);
    } catch (e) {
        console.error(chalk.red(`✘ Failed to parse PERMANENT_CHANNELS: ${e.message}`));
        return false;
    }

    let updatedCount = 0;
    const finalChannels = [];

    for (let i = 0; i < currentChannels.length; i++) {
        const ch = { ...currentChannels[i] };
        const cleanName = cleanChannelName(ch.name);
        let targetUrl = mahsunMap.get(cleanName);

        // Fallback title / alias matching
        if (!targetUrl) {
            if (cleanName.includes('bein') && cleanName.includes('1') && !cleanName.includes('max')) targetUrl = `${activeBase}batutest.m3u8`;
            else if (cleanName.includes('bein') && cleanName.includes('2') && !cleanName.includes('max')) targetUrl = `${activeBase}androstreamlivebs2.m3u8`;
            else if (cleanName.includes('bein') && cleanName.includes('3') && !cleanName.includes('max')) targetUrl = `${activeBase}androstreamlivebs3.m3u8`;
            else if (cleanName.includes('bein') && cleanName.includes('4') && !cleanName.includes('max')) targetUrl = `${activeBase}androstreamlivebs4.m3u8`;
            else if (cleanName.includes('bein') && cleanName.includes('5') && !cleanName.includes('max')) targetUrl = `${activeBase}androstreamlivebs5.m3u8`;
            else if (cleanName.includes('bein') && cleanName.includes('max') && cleanName.includes('1')) targetUrl = `${activeBase}androstreamlivebsm1.m3u8`;
            else if (cleanName.includes('bein') && cleanName.includes('max') && cleanName.includes('2')) targetUrl = `${activeBase}androstreamlivebsm2.m3u8`;
            else if (cleanName.includes('ssport') && !cleanName.includes('2')) targetUrl = `${activeBase}androstreamlivess1.m3u8`;
            else if (cleanName.includes('ssport') && cleanName.includes('2')) targetUrl = `${activeBase}androstreamlivess2.m3u8`;
            else if (cleanName.includes('smart') && cleanName.includes('1')) targetUrl = `${activeBase}androstreamlivesm1.m3u8`;
            else if (cleanName.includes('smart') && cleanName.includes('2')) targetUrl = `${activeBase}androstreamlivesm2.m3u8`;
            else if (cleanName.includes('euro') && cleanName.includes('1')) targetUrl = `${activeBase}androstreamlivees1.m3u8`;
            else if (cleanName.includes('euro') && cleanName.includes('2')) targetUrl = `${activeBase}androstreamlivees2.m3u8`;
            else if (cleanName.includes('yildiz') || cleanName.includes('yıldız')) targetUrl = `${activeBase}androstreamlivetrtsy.m3u8`;
            else if (cleanName.includes('trtspor') || cleanName.includes('trtsport')) targetUrl = `${activeBase}androstreamlivetrts.m3u8`;
            else if (cleanName.includes('aspor') || cleanName.includes('asport')) targetUrl = `${activeBase}androstreamliveas.m3u8`;
            else if (cleanName.includes('htspor') || cleanName.includes('htsport')) targetUrl = `${activeBase}androstreamliveht.m3u8`;
            else if (cleanName.includes('fb') || cleanName.includes('fenerbah')) targetUrl = `${activeBase}androstreamlivefb.m3u8`;
            else if (cleanName.includes('idman')) targetUrl = `${activeBase}androstreamliveidm.m3u8`;
        }

        // Automatic domain upgrade for any channel using an andro.evrenesoglu domain (e.g. Sport TV 3, CITY SPORT)
        if (!targetUrl && ch.url && ch.url.includes('andro.evrenesoglu')) {
            const fileMatch = ch.url.match(/checklist\/([^/?#]+)/);
            if (fileMatch) {
                targetUrl = `${activeBase}${fileMatch[1]}`;
            }
        }

        const oldUrl = ch.url;
        if (targetUrl) {
            ch.url = targetUrl;
            if (targetUrl !== oldUrl) {
                updatedCount++;
            }
        }

        // Health check stream
        const health = await checkStreamHealth(ch.url);
        const statusLabel = health.isValid 
            ? chalk.green(`[200 OK]`) 
            : chalk.yellow(`[HTTP ${health.status || 'ERR'}]`);

        console.log(`  ${chalk.green.bold('✔')} [${i + 1}/${currentChannels.length}] ${chalk.bold(ch.name)} -> ${chalk.white(ch.url)} ${statusLabel}`);
        finalChannels.push(ch);
    }

    // 5. Save back to permanentChannels.js
    if (updatedCount > 0) {
        const outputJs = `export const PERMANENT_CHANNELS = ${JSON.stringify(finalChannels, null, 2)};\n\nexport const getPermanentChannels = () => {\n  return PERMANENT_CHANNELS;\n};\n`;
        fs.writeFileSync(PERMANENT_CONFIG_PATH, outputJs, 'utf-8');
        console.log(chalk.green.bold(`\n✅ Saved: Updated ${updatedCount} permanent channels in permanentChannels.js.`));
    } else {
        console.log(chalk.green.bold(`\n✅ Verified: All ${finalChannels.length} listed permanent channels are already up-to-date with active ${activeBase} base.`));
    }

    // 6. Push to GitHub
    if (push) {
        console.log(chalk.cyan(`\n📤 Pushing permanent channel updates to GitHub repository...`));
        await pushToGitHub("chore: update permanent channels with latest working MahsunSports streams");
    }

    return true;
}

// Standalone execution support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    updatePermanentChannels({ push: !process.argv.includes('--no-push') }).then(() => {
        console.log(chalk.green.bold("\n✨ Permanent channels update completed successfully."));
        process.exit(0);
    }).catch(err => {
        console.error(chalk.red(`Fatal: ${err.message}`));
        process.exit(1);
    });
}
