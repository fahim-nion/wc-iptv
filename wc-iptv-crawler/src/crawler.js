import fs from 'fs';
import { discoverSocolive, discoverColaTV, discoverXoilac, discoverLiveLive24, discoverCamel1 } from './discovery/matchDiscovery.js';
import { captureNetworkStream } from './extraction/networkCapture.js';
import { pushToGitHub } from './github/updater.js';
import { validateStream } from './validation/validateStream.js'; 
import chalk from 'chalk';
import crypto from 'crypto';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const CHANNELS_PATH = path.resolve(REPO_ROOT, 'src/data/channels.json');

async function runCycle() {
    console.log(chalk.bold("\n" + "=".repeat(50)));
    console.log(chalk.bold("       WORLD CUP IPTV - PERSISTENT CRAWL      "));
    console.log(chalk.bold("=".repeat(50)));

    // 1. Load Existing Channels for Persistence
    let existingChannels = [];
    try {
        if (fs.existsSync(CHANNELS_PATH)) {
            const fileData = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf-8'));
            existingChannels = fileData.channels || [];
        }
    } catch (e) { console.log("No existing data found."); }

    // 2. Discovery (Including Camel1 and LiveLive24)
    const live24 = await discoverLiveLive24().catch(() => []);
    const cam = await discoverCamel1().catch(() => []);
    const soco = await discoverSocolive().catch(() => []);
    const cola = await discoverColaTV().catch(() => []);
    const xoi = await discoverXoilac().catch(() => []);
    
    const allMatches = [...live24, ...cam, ...soco, ...cola, ...xoi];
    const newResults = [];
    const seenUrls = new Set();

    // Queue: All servers from LiveLive24 TopHD, top Camel1 matches, then Socolive/ColaTV/Xoilac
    const queue = [
        ...live24,
        ...cam.slice(0, 5),
        ...soco.slice(0, 3), 
        ...cola.slice(0, 3), 
        ...xoi.slice(0, 3)
    ];

    // 3. Extraction of New Matches
    for (const match of queue) {
        if (seenUrls.has(match.url)) continue;
        seenUrls.add(match.url);
        try {
            const stream = await captureNetworkStream(match.url, match.source.toUpperCase());
            if (stream && stream.url) {
                const finalTitle = match.title.toUpperCase();
                console.log(chalk.green(`   ✔ Captured: ${finalTitle}`));
                newResults.push({
                    id: `live-${crypto.createHash('md5').update(match.url + (match.title || '')).digest('hex').substring(0, 10)}`,
                    title: finalTitle,
                    status: "live",
                    source: match.source,
                    streamUrl: stream.url,
                    category: "Sports"
                });
            }
        } catch (e) { }
    }

    // 4. PERSISTENCE LOGIC
    console.log(chalk.blue("\n[Persistence] Verifying previous matches..."));
    for (const old of existingChannels) {
        if (newResults.find(n => n.title === old.title)) continue;

        const check = await validateStream(old.streamUrl);
        if (check.isValid) {
            console.log(chalk.cyan(`   ↻ Preserving active match: ${old.title}`));
            newResults.push(old);
        }
    }

    // 5. Save & Push
    if (newResults.length > 0) {
        const output = {
            updatedAt: new Date().toISOString(),
            channels: newResults
        };
        const dataDir = path.dirname(CHANNELS_PATH);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(CHANNELS_PATH, JSON.stringify(output, null, 2));
        console.log(chalk.green.bold(`\n✅ Final List: ${newResults.length} active channels.`));
        await pushToGitHub();
    } else {
        console.log(chalk.red("\n✘ No playable matches found."));
    }
}

const TEN_MINUTES = 10 * 60 * 1000;
runCycle();
setInterval(runCycle, TEN_MINUTES);