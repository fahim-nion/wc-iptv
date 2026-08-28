import fs from 'fs';
import { discoverSocolive, discoverColaTV, discoverXoilac, discoverFanzone, discoverCamel1 } from './discovery/matchDiscovery.js';
import { captureNetworkStream } from './extraction/networkCapture.js';
import { pushToGitHub } from './github/updater.js';
import { validateStream } from './validation/validateStream.js'; 
import chalk from 'chalk';
import crypto from 'crypto';

const CHANNELS_PATH = '../src/data/channels.json';

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

    // 2. Discovery (Including Camel1)
    const soco = await discoverSocolive().catch(() => []);
    const cola = await discoverColaTV().catch(() => []);
    const xoi = await discoverXoilac().catch(() => []);
    const fan = await discoverFanzone().catch(() => []);
    const cam = await discoverCamel1().catch(() => []);
    
    const allMatches = [...soco, ...cola, ...xoi, ...fan, ...cam];
    const newResults = [];
    const seenUrls = new Set();

    // queue 3 from each for variety
    const queue = [...soco.slice(0,3), ...cola.slice(0,3), ...xoi.slice(0,3), ...fan.slice(0,3), ...cam.slice(0,3)];

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
                    id: `live-${crypto.createHash('md5').update(match.url).digest('hex').substring(0, 10)}`,
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
        if (!fs.existsSync('../src/data')) fs.mkdirSync('../src/data', { recursive: true });
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