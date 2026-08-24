import fs from 'fs';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import config from '../../config.js';
import { validateStream } from '../validation/validateStream.js';

export async function inspectSocolive(matchUrl) {
    const commonHeaders = { 
        'User-Agent': config.userAgent,
        'Referer': 'https://socolivea.tv/',
        'Origin': 'https://socolivea.tv'
    };

    console.log("Fetching Match Page...");
    const res = await fetch(matchUrl, { headers: commonHeaders });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Detect Post ID
    const postId = $('link[rel="shortlink"]').attr('href')?.split('=')?.pop() || 
                   html.match(/"postId":(\d+)/)?.[1] ||
                   $('article').attr('id')?.split('-').pop();

    if (!postId) throw new Error("Could not detect Socolive Post ID");
    
    // 2. Get Embed URL
    const ticketRes = await fetch(`https://socolivea.tv/wp-json/soco/v1/tracker-ticket?post_id=${postId}`, { headers: commonHeaders });
    const ticket = await ticketRes.json();
    if (!ticket.src) throw new Error("No embed found");

    console.log(`Analyzing Embed: ${ticket.src}`);
    const embedRes = await fetch(ticket.src, { headers: { ...commonHeaders, 'Referer': matchUrl } });
    const embedHtml = await embedRes.text();
    fs.writeFileSync("debug-socolive-embed.html", embedHtml);

    // 3. HUNT FOR THE "PROFILE" OR STREAM URL
    let streamUrl = null;

    // A. Direct scan of the embed HTML for the uc?profile= pattern
    const profileMatch = embedHtml.match(/profile=([a-zA-Z0-9.\-_]+)/i) || 
                         embedHtml.match(/profile["']?\s*:\s*["']([^"']+)["']/i);

    if (profileMatch) {
        const profile = profileMatch[1];
        console.log("Detected Trackervsb Profile. Calling UC API...");
        
        const ucRes = await fetch(`https://api.trackervsb.live/uc?profile=${profile}`, {
            headers: { ...commonHeaders, 'Referer': ticket.src }
        });
        const ucData = await ucRes.text();
        const m3u8 = ucData.match(/["'](https?[^"']+\.m3u8[^"']*)["']/i);
        if (m3u8) streamUrl = m3u8[1].replace(/\\/g, '');
    }

    // B. Script Scan Fallback: Scan every .js file loaded by the embed
    if (!streamUrl) {
        console.log("Profile not in HTML. Scanning JavaScript files...");
        const e$ = cheerio.load(embedHtml);
        const scripts = e$('script[src]').map((i, el) => e$(el).attr('src')).get();

        for (let src of scripts) {
            try {
                const scriptUrl = src.startsWith('http') ? src : new URL(src, ticket.src).href;
                const scriptRes = await fetch(scriptUrl, { headers: commonHeaders });
                const scriptText = await scriptRes.text();
                
                const found = scriptText.match(/https?:\/\/[a-zA-Z0-9\-_.]+\.m3u8[a-zA-Z0-9\-_?=&]*/i);
                if (found) {
                    streamUrl = found[0];
                    break;
                }
            } catch (e) { continue; }
        }
    }

    // 4. Final Validation
    if (streamUrl) {
        const validation = await validateStream(streamUrl);
        const host = new URL(streamUrl).hostname;

        return {
            title: $('h1').first().text().trim() || "Socolive Match",
            streamUrl,
            type: 'HLS',
            host: host,
            valid: validation.isValid ? 'YES' : 'NO'
        };
    }

    throw new Error("HTTP/Script extraction failed. Environment requires Chromium for Playwright fallback.");
}