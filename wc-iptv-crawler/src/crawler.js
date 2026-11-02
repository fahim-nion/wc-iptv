import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk';
import crypto from 'crypto';

import { 
    discoverFutbolX,
    discoverLiveLive24,
    discoverPPVStreams,
    discoverXyzStreams,
    discover90Minutes,
    discoverBinTV,
    discoverHesGoal,
    discoverCamel1,
    discoverSocolive,
    discoverColaTV,
    discoverXoilac,
    discoverAuraSports,
    discoverFalconStreams,
    discoverStreamcorner
} from './discovery/matchDiscovery.js';
import { captureNetworkStream } from './extraction/networkCapture.js';
import { pushToGitHub } from './github/updater.js';
import { validateStream } from './validation/validateStream.js';
import { normalizePreservedChannel, normalizeMatchTitle, areMatchesEquivalent } from './utils/titleNormalizer.js';
import { updatePermanentChannels } from './updatePermanent.js';

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

// Master list of available individual crawlers
export const CRAWL_SOURCES = [
    { id: 'futbolx', name: 'FutbolX (Live Football Streams)', fn: discoverFutbolX },
    { id: 'livelive24', name: 'LiveLive24 (TopHD Multi-Server)', fn: discoverLiveLive24 },
    { id: 'ppvstreams', name: 'PPVStreams (English HD Commentary)', fn: discoverPPVStreams },
    { id: 'xyzstreams', name: 'XYZStreams (English HD Streams)', fn: discoverXyzStreams },
    { id: 'minutes90', name: '90Minutes (English / Global)', fn: discover90Minutes },
    { id: 'bintv', name: 'BinTV (English / UK & US Sports)', fn: discoverBinTV },
    { id: 'hesgoal', name: 'HesGoal (Football Matches)', fn: discoverHesGoal },
    { id: 'camel1', name: 'Camel1 (Arab & International)', fn: discoverCamel1 },
    { id: 'socolive', name: 'Socolive (Vietnamese Streams)', fn: discoverSocolive },
    { id: 'colatv', name: 'ColaTV (Vietnamese Streams)', fn: discoverColaTV },
    { id: 'xoilac', name: 'Xoilac (Vietnamese Streams)', fn: discoverXoilac },
    { id: 'aurasports', name: 'AuraSports (Sports Feeds)', fn: discoverAuraSports },
    { id: 'falconstreams', name: 'FalconStreams (Direct Feeds)', fn: discoverFalconStreams }
];

/**
 * Loads current channels from disk.
 */
function loadExistingChannels() {
    try {
        if (fs.existsSync(CHANNELS_PATH)) {
            const fileData = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf-8'));
            return fileData.channels || [];
        }
    } catch (e) {
        console.log(chalk.gray("[Crawler] No previous channels.json found or invalid JSON."));
    }
    return [];
}

/**
 * Saves channels to disk.
 */
function saveChannels(channels = []) {
    const output = {
        updatedAt: new Date().toISOString(),
        channels
    };
    const dataDir = path.dirname(CHANNELS_PATH);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(CHANNELS_PATH, JSON.stringify(output, null, 2), 'utf-8');
}

/**
 * Extracts and captures streams from a queue of discovered matches.
 */
async function extractStreams(matchQueue) {
    const results = [];
    const seenUrls = new Set();

    for (const match of matchQueue) {
        if (!match.url || seenUrls.has(match.url)) continue;
        seenUrls.add(match.url);

        // Fast Skip: If this fixture already has 3+ working servers, skip slow browser sessions
        const isHeavyBrowser = ['hesgoal', 'streamcorner'].includes((match.source || '').toLowerCase());
        const existingCount = results.filter(r => areMatchesEquivalent(r.title, match.title)).length;
        if (isHeavyBrowser && existingCount >= 3) continue;

        try {
            const stream = await captureNetworkStream(match.url, (match.source || 'LIVE').toUpperCase());
            if (stream && stream.url) {
                const finalTitle = normalizeMatchTitle(match.title);
                console.log(chalk.green(`   ✔ Captured: ${finalTitle}`));
                results.push({
                    id: `live-${crypto.createHash('md5').update(match.url + (match.title || '')).digest('hex').substring(0, 10)}`,
                    title: finalTitle,
                    status: "live",
                    source: match.source,
                    streamUrl: stream.url,
                    type: stream.type || match.type || 'HLS',
                    category: "Sports",
                    crawledAt: new Date().toISOString()
                });
            }
        } catch (e) {}
    }

    return results;
}

/**
 * Crawls a single source, merges into existing channels, saves, and pushes to GitHub.
 */
export async function crawlSingleSource(sourceDef) {
    console.log(chalk.bold("\n" + "=".repeat(55)));
    console.log(chalk.bold(`   CRAWLING SOURCE: ${sourceDef.name.toUpperCase()}   `));
    console.log(chalk.bold("=".repeat(55)));

    const startTime = Date.now();
    let discoveredMatches = [];
    try {
        discoveredMatches = await sourceDef.fn();
    } catch (err) {
        console.error(chalk.red(`✘ Discovery error for ${sourceDef.name}: ${err.message}`));
        return false;
    }

    if (!discoveredMatches || discoveredMatches.length === 0) {
        console.log(chalk.yellow(`⚠️ No matches found for ${sourceDef.name}.`));
        return false;
    }

    console.log(chalk.blue(`\n[Extraction] Resolving playable streams for ${discoveredMatches.length} matches...`));
    const capturedStreams = await extractStreams(discoveredMatches);

    // Merge logic: keep newly crawled streams at the top (latest first), then existing channels
    const existing = loadExistingChannels();
    const otherSourcesChannels = existing.filter(c => c.source !== sourceDef.id);
    const finalChannels = [...capturedStreams, ...otherSourcesChannels];

    saveChannels(finalChannels);
    console.log(chalk.green.bold(`\n✅ Saved: Added/updated ${capturedStreams.length} channels from ${sourceDef.name}. Total active: ${finalChannels.length}`));

    // Push to GitHub
    console.log(chalk.cyan(`\n📤 Pushing updates to GitHub repository...`));
    await pushToGitHub(`chore: update ${sourceDef.name} matches (${capturedStreams.length} streams)`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(chalk.green.bold(`✨ Finished ${sourceDef.name} crawl in ${elapsed}s!\n`));
    return true;
}

/**
 * Runs a complete crawl cycle across all enabled sources with parallel persistence validation.
 */
export async function runFullCycle() {
    console.log(chalk.bold("\n" + "=".repeat(55)));
    console.log(chalk.bold("       FUSSBALLTV - FULL BATCH CRAWL CYCLE       "));
    console.log(chalk.bold("=".repeat(55)));

    const existingChannels = loadExistingChannels();
    const queue = [];

    // Run discovery for each source
    for (const src of CRAWL_SOURCES) {
        try {
            const matches = await src.fn();
            if (Array.isArray(matches)) {
                queue.push(...matches);
            }
        } catch (e) {
            console.log(chalk.yellow(`✘ Skipped ${src.name}: ${e.message}`));
        }
    }

    console.log(chalk.blue(`\n[Extraction] Extracting playable streams from ${queue.length} total queued matches...`));
    const newResults = await extractStreams(queue);

    // Persistence: preserve active matches from previous cycle
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

    if (newResults.length > 0) {
        saveChannels(newResults);
        console.log(chalk.green.bold(`\n✅ Final List: ${newResults.length} active channels.`));
        await pushToGitHub("chore: full auto-crawl live matches update");
    } else {
        console.log(chalk.red("\n✘ No playable matches found."));
    }
}

/**
 * Helper to prompt the user via readline.
 */
function promptUser(rl, query) {
    return new Promise(resolve => {
        if (!rl || rl.closed) return resolve('0');
        let answered = false;
        try {
            rl.question(query, answer => {
                if (!answered) {
                    answered = true;
                    resolve((answer || '').trim());
                }
            });
            rl.once('close', () => {
                if (!answered) {
                    answered = true;
                    resolve('0');
                }
            });
        } catch (e) {
            resolve('0');
        }
    });
}

/**
 * Displays the CLI menu.
 */
function printMenu() {
    console.log(chalk.bold("\n" + "=".repeat(60)));
    console.log(chalk.bold.cyan("               ⚽ FUSSBALLTV CRAWLER CLI MENU              "));
    console.log(chalk.bold("=".repeat(60)));
    console.log(chalk.bold.yellow("Match Streaming Sources:"));

    CRAWL_SOURCES.forEach((src, idx) => {
        const num = String(idx + 1).padStart(2, ' ');
        console.log(`  ${chalk.green.bold(`[${num}]`)} ${src.name}`);
    });

    const permNum = String(CRAWL_SOURCES.length + 1).padStart(2, ' ');
    const fullNum = String(CRAWL_SOURCES.length + 2).padStart(2, ' ');

    console.log(chalk.bold.yellow("\nPermanent Channels & Batch Operations:"));
    console.log(`  ${chalk.magenta.bold(`[${permNum}]`)} Permanent Channels (MahsunSports Updater)`);
    console.log(`  ${chalk.blue.bold(`[${fullNum}]`)} Full Crawl (All Enabled Sources)`);
    console.log(`  ${chalk.red.bold(`[ 0]`)} Exit`);
    console.log(chalk.bold("-".repeat(60)));
}

/**
 * Interactive menu loop.
 */
export async function startInteractiveMenu() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        while (true) {
            if (rl.closed) break;
            printMenu();
            const answer = await promptUser(rl, chalk.bold.cyan("\nEnter choice number to crawl (or 0 to exit): "));

            if (!answer || answer === '0' || answer.toLowerCase() === 'exit' || answer.toLowerCase() === 'q') {
                console.log(chalk.green.bold("\n👋 Exiting FussballTV Crawler CLI. Have a great day!\n"));
                break;
            }

            const choiceNum = parseInt(answer, 10);
            const permOptionNum = CRAWL_SOURCES.length + 1;
            const fullOptionNum = CRAWL_SOURCES.length + 2;

            if (choiceNum >= 1 && choiceNum <= CRAWL_SOURCES.length) {
                const selectedSource = CRAWL_SOURCES[choiceNum - 1];
                await crawlSingleSource(selectedSource);
            } else if (choiceNum === permOptionNum) {
                console.log(chalk.magenta.bold(`\nExecuting MahsunSports Permanent Channels Updater...`));
                await updatePermanentChannels({ push: true });
            } else if (choiceNum === fullOptionNum) {
                console.log(chalk.blue.bold(`\nExecuting Full Crawl Cycle across all sources...`));
                await runFullCycle();
            } else {
                console.log(chalk.red.bold(`\n⚠️ Invalid choice "${answer}". Please select a valid number from the menu.`));
            }

            console.log(chalk.gray("\n" + "—".repeat(60)));
        }
    } finally {
        try { rl.close(); } catch (e) {}
    }
}

// Entrypoint execution logic
const isDaemon = process.argv.includes('--daemon') || process.argv.includes('--loop');
const isFullAll = process.argv.includes('--all') || process.argv.includes('--full');
const isNonInteractive = !process.stdin.isTTY && !process.argv.includes('--interactive');
const TEN_MINUTES = 10 * 60 * 1000;

if (isDaemon) {
    console.log(chalk.cyan("Starting crawler in daemon mode (runs every 10 minutes sequentially)..."));
    (async () => {
        while (true) {
            await runFullCycle().catch(err => console.error(chalk.red(`Cycle error: ${err.message}`)));
            console.log(chalk.gray(`\nWaiting 10 minutes until next crawl cycle...`));
            await new Promise(r => setTimeout(r, TEN_MINUTES));
        }
    })();
} else if (isFullAll || isNonInteractive) {
    runFullCycle().then(() => {
        console.log(chalk.green.bold("\n✨ Crawl cycle finished successfully. Exiting."));
        process.exit(0);
    }).catch((err) => {
        console.error(chalk.red(`\n✘ Fatal error in crawler: ${err.message}`));
        process.exit(1);
    });
} else {
    // Default interactive mode
    startInteractiveMenu().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error(chalk.red(`Fatal error: ${err.message}`));
        process.exit(1);
    });
}
