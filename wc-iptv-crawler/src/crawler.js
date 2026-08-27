import fs from 'fs';
import { discoverSocolive, discoverColaTV, discoverXoilac, discoverFanzone } from './discovery/matchDiscovery.js'; // Added Fanzone
import { captureNetworkStream } from './extraction/networkCapture.js';
import { pushToGitHub } from './github/updater.js';
import chalk from 'chalk';
import crypto from 'crypto';

async function runCycle() {
    console.log(chalk.bold("\n" + "=".repeat(50)));
    console.log(chalk.bold("       WORLD CUP IPTV - AUTOMATED CRAWL      "));
    console.log(chalk.bold("=".repeat(50)));

    const soco = await discoverSocolive().catch(() => []);
    const cola = await discoverColaTV().catch(() => []);
    const xoi = await discoverXoilac().catch(() => []);
    const fan = await discoverFanzone().catch(() => []); // New Source
    
    const allMatches = [...soco, ...cola, ...xoi, ...fan];
    const results = [];
    const seenUrls = new Set();

    // Prioritize 3 matches from every source to ensure variety
    const prioritized = [
        ...soco.slice(0,3), 
        ...cola.slice(0,3), 
        ...xoi.slice(0,3), 
        ...fan.slice(0,3)
    ];

    for (const match of prioritized) {
        if (seenUrls.has(match.url)) continue;
        seenUrls.add(match.url);

        try {
            const stream = await captureNetworkStream(match.url, match.source.toUpperCase());
            if (stream && stream.url) {
                const finalTitle = match.title.toUpperCase();
                console.log(chalk.green(`   ✔ Success: ${finalTitle}`));
                results.push({
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

    if (results.length > 0) {
        const output = {
            updatedAt: new Date().toISOString(),
            channels: results
        };
        if (!fs.existsSync('../src/data')) fs.mkdirSync('../src/data', { recursive: true });
        fs.writeFileSync('../src/data/channels.json', JSON.stringify(output, null, 2));
        console.log(chalk.green.bold(`\n✅ Saved ${results.length} channels.`));
        
        await pushToGitHub();
    } else {
        console.log(chalk.red("\n✘ No playable matches found this cycle. Keeping previous data."));
    }
}

// Polling interval
const TEN_MINUTES = 10 * 60 * 1000;
runCycle();
setInterval(runCycle, TEN_MINUTES);