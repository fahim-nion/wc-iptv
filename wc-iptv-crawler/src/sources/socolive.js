import fs from 'fs';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import config from '../../config.js';
import { validateStream } from '../validation/validateStream.js';
import { captureNetworkStream } from '../extraction/networkCapture.js';

export async function inspectSocolive(matchUrl) {
    console.log("Fetching Match Page...");
    const res = await fetch(matchUrl, { headers: { 'User-Agent': config.userAgent } });
    const html = await res.text();
    const $ = cheerio.load(html);

    const postId = 
        $('link[rel="shortlink"]').attr('href')?.split('=')?.pop() || 
        $('body').attr('class')?.match(/postid-(\d+)/)?.[1] ||
        html.match(/"postId":(\d+)/)?.[1] ||
        $('article').attr('id')?.split('-').pop();

    if (!postId) throw new Error("Could not detect Socolive Post ID");
    console.log(`Detected Post ID: ${postId}`);

    const apiEndpoint = `https://socolivea.tv/wp-json/soco/v1/tracker-ticket?post_id=${postId}`;
    const apiRes = await fetch(apiEndpoint, { headers: { 'User-Agent': config.userAgent } });
    const ticket = await apiRes.json();

    if (!ticket.src) throw new Error("No embed source found in tracker-ticket");
    console.log(`Found Embed: ${ticket.src}`);

    // --- STEP 1: Fetch and Save Embed for Debugging ---
    const embedRes = await fetch(ticket.src, {
        headers: {
            'User-Agent': config.userAgent,
            'Referer': 'https://socolivea.tv/'
        }
    });
    const embedHtml = await embedRes.text();
    fs.writeFileSync("debug-socolive-embed.html", embedHtml);

    let streamUrl = null;

    // --- STEP 2 & 3: Reproduce Real Player API Flow ---
    // Search for "profile" or "api.trackervsb.live" in the HTML
    const profileMatch = embedHtml.match(/profile["']?\s*:\s*["']([^"']+)["']/i) || 
                         embedHtml.match(/profile=([^"&' \n]+)/i);

    if (profileMatch) {
        const profile = profileMatch[1];
        console.log(`Detected Profile: ${profile.substring(0, 10)}...`);
        
        const ucApiUrl = `https://api.trackervsb.live/uc?profile=${profile}`;
        console.log("Calling Player Config API (UC)...");

        try {
            const ucRes = await fetch(ucApiUrl, {
                headers: {
                    'User-Agent': config.userAgent,
                    'Referer': ticket.src,
                    'Origin': 'https://tracker.sportbo.live'
                }
            });

            console.log("UC API STATUS:", ucRes.status);
            const ucText = await ucRes.text();
            
            // Try to find the m3u8 in the response (JSON or raw string)
            const m3u8Match = ucText.match(/["'](https?[^"']+\.m3u8[^"']*)["']/i);
            if (m3u8Match) {
                streamUrl = m3u8Match[1].replace(/\\/g, '');
                console.log("Stream discovered via UC API.");
            }
        } catch (e) {
            console.error("UC API Flow failed:", e.message);
        }
    }

    // --- STEP 4: Playwright Fallback ---
    if (!streamUrl) {
        console.log("HTTP Extraction failed. Attempting Browser Network Capture...");
        try {
            const captured = await captureNetworkStream(ticket.src, "https://socolivea.tv/");
            streamUrl = captured.url;
        } catch (e) {
            console.error("Browser capture failed:", e.message);
        }
    }

    // --- STEP 6 & 7: Validation ---
    if (streamUrl) {
        const urlObj = new URL(streamUrl);
        const validation = await validateStream(streamUrl);

        return {
            title: $('h1').first().text().trim() || "Socolive Match",
            streamUrl: streamUrl,
            type: 'HLS',
            host: urlObj.hostname,
            path: urlObj.pathname,
            valid: validation.isValid ? 'YES' : 'NO'
        };
    }

    throw new Error("Final stream extraction failed.");
}