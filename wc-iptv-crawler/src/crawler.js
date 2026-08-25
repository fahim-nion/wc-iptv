import fs from 'fs';
import { discoverSocolive, discoverColaTV, discoverXoilac } from './discovery/matchDiscovery.js';
import { captureNetworkStream } from './extraction/networkCapture.js';
import chalk from 'chalk';
import crypto from 'crypto';

async function startCrawl() {
    console.log(chalk.bold("\n========================================"));
    console.log(chalk.bold("          WCUptv RESILIENT CRAWLER       "));
    console.log(chalk.bold("========================================\n"));

    const summary = {
        socolive: { discovered: 0, playable: 0 },
        colatv: { discovered: 0, playable: 0 },
        xoilac: { discovered: 0, playable: 0 }
    };

    const finalPlayableMatches = [];

    // --- 1. DISCOVERY PHASE ---
    const socoMatches = await discoverSocolive();
    const colaMatches = await discoverColaTV();
    const xoiMatches = await discoverXoilac();

    summary.socolive.discovered = socoMatches.length;
    summary.colatv.discovered = colaMatches.length;
    summary.xoilac.discovered = xoiMatches.length;

    // --- 2. EXTRACTION PHASE (Interleaved to ensure coverage) ---
    // Combine matches but keep source identity
    const queue = [
        ...socoMatches.slice(0, 4), 
        ...colaMatches.slice(0, 4), 
        ...xoiMatches.slice(0, 4)
    ];

    for (const m of queue) {
        const stream = await captureNetworkStream(m.url, m.source.toUpperCase());
        if (stream) {
            finalPlayableMatches.push({ ...m, streamUrl: stream.url });
            summary[m.source].playable++;
        }
    }

    console.log(chalk.bold("\n========================================"));
    console.log(chalk.bold("           SOURCE SUMMARY               "));
    console.log(chalk.bold("========================================\n"));

    Object.keys(summary).forEach(source => {
        console.log(`${chalk.yellow(source.toUpperCase())}: Discovered ${summary[source].discovered} | Playable ${summary[source].playable}`);
    });

    if (finalPlayableMatches.length === 0) {
        console.error(chalk.red.bold("\nALL SOURCES FAILED — PRESERVING EXISTING channels.json"));
        process.exitCode = 1;
    } else {
        const output = {
            updatedAt: new Date().toISOString(),
            channels: finalPlayableMatches.map(m => ({
                id: `live-${crypto.createHash('md5').update(m.streamUrl).digest('hex').substring(0, 10)}`,
                title: m.title.toUpperCase(),
                status: "live",
                source: m.source,
                streamUrl: m.streamUrl,
                category: "Sports"
            }))
        };
        fs.writeFileSync('../src/data/channels.json', JSON.stringify(output, null, 2));
        console.log(chalk.green.bold(`\n✅ DONE: ${finalPlayableMatches.length} channels saved.`));
    }
}

startCrawl();