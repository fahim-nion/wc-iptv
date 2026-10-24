import fs from 'fs';
import path from 'path';
import os from 'os';

let puppeteerModule = null;

try {
    const mod = await import('puppeteer-core');
    puppeteerModule = mod.default || mod;
} catch (e1) {
    try {
        const mod = await import('puppeteer');
        puppeteerModule = mod.default || mod;
    } catch (e2) {
        try {
            const mod = await import('puppeteer-extra');
            puppeteerModule = mod.default || mod;
        } catch (e3) {
            console.error('No puppeteer package found. Please install puppeteer-core or puppeteer.');
        }
    }
}

export function getChromePath() {
    const staticPaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/data/data/com.termux/files/usr/bin/chromium-browser',
        '/data/data/com.termux/files/usr/bin/chromium'
    ];
    for (const p of staticPaths) {
        if (fs.existsSync(p)) return p;
    }
    const home = os.homedir();
    const cacheDir = path.join(home, '.cache/puppeteer/chrome');
    if (fs.existsSync(cacheDir)) {
        try {
            const entries = fs.readdirSync(cacheDir, { recursive: true });
            for (const e of entries) {
                if (e.endsWith('/chrome') || e === 'chrome') {
                    const full = path.join(cacheDir, e);
                    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
                }
            }
        } catch (e) {}
    }
    return null;
}

export default puppeteerModule;
