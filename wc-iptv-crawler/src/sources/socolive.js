import { discoverSocolive as getMatches } from '../discovery/matchDiscovery.js';
import { captureNetworkStream } from '../extraction/networkCapture.js';

export async function crawlSocolive() {
    const DEBUG = process.env.CRAWLER_DEBUG === 'true';
    const matches = await getMatches().catch(() => []);
    const results = [];

    const stats = { discovered: matches.length, playable: 0, failed: 0 };

    for (const match of matches) {
        let matchResult = {
            ...match,
            stream: { url: null, type: null, valid: false, lastCheckedAt: null },
            extractionStatus: "pending"
        };

        const stream = await captureNetworkStream(match.url, "Socolive");

        if (stream) {
            matchResult.stream = { 
                url: stream.url, 
                type: stream.type, 
                valid: true, 
                lastCheckedAt: new Date().toISOString() 
            };
            matchResult.extractionStatus = "success";
            stats.playable++;
        } else {
            matchResult.extractionStatus = "failed";
            stats.failed++;
        }

        results.push(matchResult);
    }

    return { results, stats };
}