import { chromium } from 'playwright';

export async function captureNetworkStream(url, referer) {
    console.log("Launching browser for network capture...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        extraHTTPHeaders: { 'Referer': referer }
    });

    const page = await context.newPage();
    let detectedStream = null;

    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(async () => {
            await browser.close();
            reject(new Error("Network capture timed out after 30s"));
        }, 30000);

        page.on('response', async response => {
            const resUrl = response.url();
            const contentType = response.headers()['content-type'] || "";

            if (resUrl.includes(".m3u8") || contentType.includes("mpegurl")) {
                // Filter out common ads/analytics if necessary
                if (!resUrl.includes("ads") && !resUrl.includes("track")) {
                    detectedStream = resUrl;
                    clearTimeout(timeout);
                    await browser.close();
                    resolve({ url: detectedStream, type: 'HLS' });
                }
            }
        });

        try {
            await page.goto(url, { waitUntil: 'networkidle' });
            // Click play if a button is detected to trigger stream load
            const playButton = await page.$('button, .play-button, #player');
            if (playButton) await playButton.click();
        } catch (e) {
            await browser.close();
            reject(e);
        }
    });
}