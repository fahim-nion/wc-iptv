export default {
    sources: {
        socolive: {
            enabled: true,
            priority: 1,
            homepage: "https://socolivea.tv/"
        },
        colatv: {
            enabled: true,
            priority: 2,
            homepage: "https://colatv.live/"
        },
        xoilac: {
            enabled: true,
            priority: 3,
            homepage: "https://xoilaczziiz.tv/"
        }
    },
    polling: {
        upcomingMinutes: 10,
        liveMinutes: 2
    },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};