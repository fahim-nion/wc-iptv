import fs from 'fs';
import { 
    discoverSocolive, 
    discoverColaTV, 
    discoverXoilac, 
    discoverLiveLive24, 
    discoverCamel1, 
    discoverHesGoal, 
    discoverXyzStreams,
    discoverAuraSports,
    discoverFalconStreams,
    discoverStreamcorner,
    discoverFutbolX
} from './discovery/matchDiscovery.js';
import { captureNetworkStream } from './extraction/networkCapture.js';
import { pushToGitHub } from './github/updater.js';
import { validateStream } from './validation/validateStream.js'; 
import { normalizePreservedChannel, normalizeMatchTitle } from './utils/titleNormalizer.js';
import chalk from 'chalk';
import crypto from 'crypto';

import path from 'path';
import { fileURLToPath } from 'url';

// Bulletproof unhandled rejection & uncaught exception handling for headless browser sessions
process.on('unhandledRejection', (reason) => {
    const msg = reason?.message || String(reason);
    if (
        msg.includes('Session closed') || 
        msg.includes('TargetCloseError') || 
        msg.includes('Protocol error') || 
        msg.includes('Requesting main frame') ||
        msg.includes('Target closed')
    ) {
        return;
    }
    console.error(chalk.yellow(`[Unhandled Rejection]: ${msg}`));
});

process.on('uncaughtException', (err) => {
    const msg = err?.message || String(err);
    if (
        msg.includes('Session closed') || 
        msg.includes('TargetCloseError') || 
        msg.includes('Protocol error') || 
        msg.includes('Requesting main frame') ||
        msg.includes('Target closed')
    ) {
        return;
    }
    console.error(chalk.red(`[Uncaught Exception]: ${msg}`));
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const CHANNELS_PATH = path.resolve(REPO_ROOT, 'src/data/channels.json');

let isCycleRunning = false;

async function runCycle() {
    if (isCycleRunning) {
        console.log(chalk.yellow("\n⚠️ A crawl cycle is already in progress. Skipping overlapping run."));
        return;
    }
    isCycleRunning = true;
    try {
        console.log(chalk.bold("\n" + "=".repeat(50)));
        console.log(chalk.bold("       FUSSBALLTV - PERSISTENT CRAWL      "));
        console.log(chalk.bold("=".repeat(50)));

        // 1. Load Existing Channels for Persistence (clean up skipped sources like PPV)
        let existingChannels = [];
        try {
            if (fs.existsSync(CHANNELS_PATH)) {
                const fileData = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf-8'));
                existingChannels = (fileData.channels || []).filter(c => 
                    c.source !== 'ppv' && 
                    !c.streamUrl?.includes('indianservers.st') && 
                    !c.streamUrl?.includes('taifood-blog.asia')
                );
            }
        } catch (e) { console.log("No existing data found."); }

        // 2. Discovery
        const futbolx = await discoverFutbolX().catch(() => []);
        const live24 = await discoverLiveLive24().catch(() => []);
        const hesgoal = await discoverHesGoal().catch(() => []);
        const aura = await discoverAuraSports().catch(() => []);
        const falcon = await discoverFalconStreams().catch(() => []);
        const streamcorner = await discoverStreamcorner().catch(() => []);
        const cam = await discoverCamel1().catch(() => []);
        const soco = await discoverSocolive().catch(() => []);
        const cola = await discoverColaTV().catch(() => []);
        const xoi = await discoverXoilac().catch(() => []);
        const xyz = await discoverXyzStreams().catch(() => []);
        
        const newResults = [];
        const seenUrls = new Set();

        // Queue: High quality reliable servers first, then secondary aggregators
        const queue = [
            ...futbolx,
            ...live24,
            ...hesgoal.slice(0, 8),
            ...aura,
            ...falcon.slice(0, 10),
            ...streamcorner.slice(0, 6),
            ...xyz,
            ...cam.slice(0, 5),
            ...soco.slice(0, 6), 
            ...cola.slice(0, 8), 
            ...xoi.slice(0, 4)
        ];

        // 3. Extraction of New Matches
        for (const match of queue) {
            if (seenUrls.has(match.url)) continue;
            seenUrls.add(match.url);

            // Fast Skip: If this match already has 2+ working servers from primary sources,
            // skip launching slow headless browser sessions for secondary aggregators
            const baseMatchName = normalizeMatchTitle(match.title).replace(/\s*\[SERVER\s*[^\]]+\]$/i, '').trim();
            const existingServerCount = newResults.filter(r => r.title.startsWith(baseMatchName)).length;
            const isHeavyBrowserSource = ['socolive', 'colatv', 'xoilac', 'streamcorner'].includes(match.source.toLowerCase());

            if (isHeavyBrowserSource && existingServerCount >= 2) {
                continue;
            }

            try {
                const stream = await captureNetworkStream(match.url, match.source.toUpperCase());

                if (stream && stream.url) {
                    const finalTitle = normalizeMatchTitle(match.title);
                    console.log(chalk.green(`   ✔ Captured: ${finalTitle}`));
                    newResults.push({
                        id: `live-${crypto.createHash('md5').update(match.url + (match.title || '')).digest('hex').substring(0, 10)}`,
                        title: finalTitle,
                        status: "live",
                        source: match.source,
                        streamUrl: stream.url,
                        type: stream.type || 'HLS',
                        category: "Sports"
                    });
                }
            } catch (e) { }
        }

        // 4. PERSISTENCE LOGIC (Parallel batch validation)
        console.log(chalk.blue("\n[Persistence] Verifying previous matches..."));
        const oldCandidates = existingChannels.filter(old => !newResults.find(n => n.title === old.title));
        const BATCH_SIZE = 15;
        for (let i = 0; i < oldCandidates.length; i += BATCH_SIZE) {
            const batch = oldCandidates.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(batch.map(async (old) => {
                const check = await validateStream(old.streamUrl, "", 2500);
                return { old, isValid: check.isValid };
            }));
            for (const res of results) {
                if (res.isValid) {
                    const normalizedTitle = normalizePreservedChannel(res.old);
                    if (normalizedTitle && normalizedTitle !== res.old.title) {
                        console.log(chalk.cyan(`   ↻ Preserving active match: ${res.old.title} -> ${normalizedTitle}`));
                        res.old.title = normalizedTitle;
                    } else {
                        console.log(chalk.cyan(`   ↻ Preserving active match: ${res.old.title}`));
                    }
                    newResults.push(res.old);
                }
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
    } finally {
        isCycleRunning = false;
    }
}

const isDaemon = process.argv.includes('--daemon') || process.argv.includes('--loop');
const TEN_MINUTES = 10 * 60 * 1000;

if (!isDaemon) {
    runCycle().then(() => {
        console.log(chalk.green.bold("\n✨ Crawl cycle finished successfully. Exiting."));
        process.exit(0);
    }).catch((err) => {
        console.error(chalk.red(`\n✘ Fatal error in crawler: ${err.message}`));
        process.exit(1);
    });
} else {
    console.log(chalk.cyan("Starting crawler in daemon mode (runs every 10 minutes sequentially)..."));
    (async () => {
        while (true) {
            await runCycle().catch(err => console.error(chalk.red(`Cycle error: ${err.message}`)));
            console.log(chalk.gray(`\nWaiting 10 minutes until next crawl cycle...`));
            await new Promise(r => setTimeout(r, TEN_MINUTES));
        }
    })();
}