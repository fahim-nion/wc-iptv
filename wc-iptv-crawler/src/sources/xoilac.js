import fetch from 'node-fetch';
import config from '../../config.js';

export async function inspectXoilac(matchUrl) {
    const res = await fetch(matchUrl, { headers: { 'User-Agent': config.userAgent } });
    const html = await res.text();

    // Xoilac uses an internal API call usually found in the window.REDUX_STATE or a specific script
    // We search for the stream initialization pattern
    const streamDataMatch = html.match(/source":"([^"]+)"/);
    let streamUrl = streamDataMatch ? streamDataMatch[1].replace(/\\/g, '') : null;

    // Handle the wsSecret/wsABSTime dynamic params
    // Usually these are appended by the site's local JS. 
    // If not in HTML, they are in a secondary API call to /api/room/live
    return {
        title: "Xoilac Match",
        streamUrl: streamUrl,
        type: streamUrl?.includes('.flv') ? 'HTTP-FLV' : 'HLS'
    };
}