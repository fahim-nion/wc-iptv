import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { pushToGitHub } from './github/updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const PERMANENT_CONFIG_PATH = path.resolve(REPO_ROOT, 'src/config/permanentChannels.js');

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
                console.log(chalk.green(`✔ Active MahsunSports Base URL: ${base}`));
                return base;
            }
        } catch (e) {}
    }

    // Return the first base if none returned 200
    return baseUrls[0];
}

/**
 * Crawls mahsunsports.xyz and updates only the channels already listed on the website.
 */
export async function updatePermanentChannels({ push = true } = {}) {
    console.log(chalk.bold("\n" + "=".repeat(55)));
    console.log(chalk.bold("   MAHSUNSPORTS PERMANENT CHANNELS UPDATER   "));
    console.log(chalk.bold("=".repeat(55)));

    if (!fs.existsSync(PERMANENT_CONFIG_PATH)) {
        console.error(chalk.red(`✘ Cannot find permanentChannels.js at: ${PERMANENT_CONFIG_PATH}`));
        return false;
    }

    // 1. Resolve active base domain
    const activeBase = await getActiveMahsunBaseUrl();

    // 2. Fetch script4.js to discover channel mapping
    console.log(chalk.blue(`\n🔍 Fetching latest channel list from https://mahsunsports.xyz/script4.js...`));
    const mahsunChannels = [];
    try {
        const res = await fetch("https://mahsunsports.xyz/script4.js", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            signal: AbortSignal.timeout(8000)
        });
        if (res.ok) {
            const script = await res.text();
            const matches = [...script.matchAll(/\{\s*title:\s*["']([^"']+)["'],\s*url:\s*["']\/event\.html\?id=([^"']+)["']\s*\}/g)];
            for (const m of matches) {
                mahsunChannels.push({
                    title: m[1].trim(),
                    id: m[2].trim()
                });
            }
        }
    } catch (e) {
        console.error(chalk.red(`✘ Failed to fetch script4.js: ${e.message}`));
        return false;
    }

    console.log(chalk.cyan(`   Discovered ${mahsunChannels.length} channels on MahsunSports.`));

    // Build lookup map by cleaned title and by id suffix
    const mahsunMap = new Map();
    for (const mc of mahsunChannels) {
        const cleanT = cleanChannelName(mc.title);
        mahsunMap.set(cleanT, mc.id);

        // Map variations:
        if (cleanT === 'beinsport1') mahsunMap.set('beinsports1', mc.id);
        if (cleanT === 'beinsport2') mahsunMap.set('beinsports2', mc.id);
        if (cleanT === 'beinsport3') mahsunMap.set('beinsports3', mc.id);
        if (cleanT === 'beinsport4') mahsunMap.set('beinsports4', mc.id);
        if (cleanT === 'beinsport5') mahsunMap.set('beinsports5', mc.id);
        if (cleanT === 'beinsportmax1') mahsunMap.set('beinsportsmax1', mc.id);
        if (cleanT === 'beinsportmax2') mahsunMap.set('beinsportsmax2', mc.id);
        if (cleanT === 'ssport') mahsunMap.set('ssport1', mc.id);
        if (cleanT === 'smartsport1') mahsunMap.set('sportssmart1', mc.id);
        if (cleanT === 'smartsport2') mahsunMap.set('sportssmart2', mc.id);
        if (cleanT === 'eurosport1') mahsunMap.set('eurosports1', mc.id);
        if (cleanT === 'eurosport2') mahsunMap.set('eurosports2', mc.id);
        if (cleanT === 'idmantv') mahsunMap.set('idman', mc.id);
        if (cleanT === 'trtsporyıldız') mahsunMap.set('trtsportyildiz', mc.id);
    }

    // Direct stream path mapping helper
    function resolveStreamFileName(streamId) {
        if (!streamId) return null;
        if (streamId === "androstreamlivebs1") {
            // batutest.m3u8 is standard for beIN Sports 1 on mahsunsports player
            return "batutest.m3u8";
        }
        if (streamId.startsWith("androstreamlive")) {
            return streamId + ".m3u8";
        }
        return streamId + ".m3u8";
    }

    // 3. Read current permanentChannels.js
    const fileContent = fs.readFileSync(PERMANENT_CONFIG_PATH, 'utf-8');
    
    // Parse current PERMANENT_CHANNELS array
    let currentChannels = [];
    try {
        const jsonMatch = fileContent.match(/export const PERMANENT_CHANNELS = (\[[\s\S]*?\]);/);
        if (jsonMatch) {
            // Evaluate into memory
            currentChannels = eval(jsonMatch[1]);
        }
    } catch (e) {
        console.error(chalk.red(`✘ Failed to parse PERMANENT_CHANNELS: ${e.message}`));
        return false;
    }

    console.log(chalk.blue(`\nUpdating ${currentChannels.length} listed permanent channels...`));
    let updatedCount = 0;

    const updatedChannels = currentChannels.map(ch => {
        const cleanName = cleanChannelName(ch.name);
        let streamId = mahsunMap.get(cleanName);

        // Fallback title / alias matching
        if (!streamId) {
            if (cleanName.includes('bein') && cleanName.includes('1') && !cleanName.includes('max')) streamId = 'androstreamlivebs1';
            else if (cleanName.includes('bein') && cleanName.includes('2') && !cleanName.includes('max')) streamId = 'androstreamlivebs2';
            else if (cleanName.includes('bein') && cleanName.includes('3') && !cleanName.includes('max')) streamId = 'androstreamlivebs3';
            else if (cleanName.includes('bein') && cleanName.includes('4') && !cleanName.includes('max')) streamId = 'androstreamlivebs4';
            else if (cleanName.includes('bein') && cleanName.includes('5') && !cleanName.includes('max')) streamId = 'androstreamlivebs5';
            else if (cleanName.includes('bein') && cleanName.includes('max') && cleanName.includes('1')) streamId = 'androstreamlivebsm1';
            else if (cleanName.includes('bein') && cleanName.includes('max') && cleanName.includes('2')) streamId = 'androstreamlivebsm2';
            else if (cleanName.includes('ssport') && !cleanName.includes('2')) streamId = 'androstreamlivess1';
            else if (cleanName.includes('ssport') && cleanName.includes('2')) streamId = 'androstreamlivess2';
            else if (cleanName.includes('smart') && cleanName.includes('1')) streamId = 'androstreamlivesm1';
            else if (cleanName.includes('smart') && cleanName.includes('2')) streamId = 'androstreamlivesm2';
            else if (cleanName.includes('euro') && cleanName.includes('1')) streamId = 'androstreamlivees1';
            else if (cleanName.includes('euro') && cleanName.includes('2')) streamId = 'androstreamlivees2';
            else if (cleanName.includes('yildiz') || cleanName.includes('yıldız')) streamId = 'androstreamlivetrtsy';
            else if (cleanName.includes('trtspor') || cleanName.includes('trtsport')) streamId = 'androstreamlivetrts';
            else if (cleanName.includes('aspor') || cleanName.includes('asport')) streamId = 'androstreamliveas';
            else if (cleanName.includes('htspor') || cleanName.includes('htsport')) streamId = 'androstreamliveht';
            else if (cleanName.includes('fb') || cleanName.includes('fenerbah')) streamId = 'androstreamlivefb';
            else if (cleanName.includes('idman')) streamId = 'androstreamliveidm';
        }

        if (streamId) {
            const fileName = resolveStreamFileName(streamId);
            const newUrl = `${activeBase}${fileName}`;
            if (ch.url !== newUrl) {
                console.log(chalk.green(`   ✔ Updated [${ch.name}]:`));
                console.log(chalk.gray(`     Old: ${ch.url}`));
                console.log(chalk.white(`     New: ${newUrl}`));
                ch.url = newUrl;
                updatedCount++;
            } else {
                console.log(chalk.gray(`   - [${ch.name}] already up-to-date.`));
            }
        } else {
            // Keep untouched (e.g. T Sports Live, Star Sports 1 HD, etc.)
            console.log(chalk.yellow(`   • [${ch.name}] not in MahsunSports (kept original).`));
        }

        return ch;
    });

    // 4. Save back to permanentChannels.js
    const outputJs = `export const PERMANENT_CHANNELS = ${JSON.stringify(updatedChannels, null, 2)};\n\nexport const getPermanentChannels = () => {\n  return PERMANENT_CHANNELS;\n};\n`;
    fs.writeFileSync(PERMANENT_CONFIG_PATH, outputJs, 'utf-8');
    console.log(chalk.green.bold(`\n✅ Saved: ${updatedCount} permanent channel streams updated in permanentChannels.js.`));

    // 5. Push to GitHub if requested
    if (push && updatedCount > 0) {
        console.log(chalk.cyan(`\n📤 Pushing permanent channel updates to GitHub...`));
        await pushToGitHub();
    }

    return true;
}

// Standalone execution support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    updatePermanentChannels({ push: !process.argv.includes('--no-push') }).then(() => {
        console.log(chalk.green.bold("\n✨ Done."));
        process.exit(0);
    }).catch(err => {
        console.error(chalk.red(`Fatal: ${err.message}`));
        process.exit(1);
    });
}
