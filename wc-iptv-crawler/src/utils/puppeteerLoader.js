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

export default puppeteerModule;

