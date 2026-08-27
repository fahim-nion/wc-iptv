export default {
    sources: {
        socolive: { 
            enabled: true, 
            priority: 1, 
            homepage: "https://socoliveq.tv/",
            mirrors: ["https://socolive.live/", "https://socolive1.com/"]
        },
        colatv: { 
            enabled: true, 
            priority: 2, 
            homepage: "https://cola-affcup2026.tv/",
            mirrors: ["https://cafente.com/", "colatv.it.com"]
        },
        xoilac: { 
            enabled: true, 
            priority: 3, 
            homepage: "https://xoilaczznnz.tv/",
            mirrors: ["https://xoilac.live/", "https://xoilac.tv/"]
        },
        // ADDED FANZONE
        fanzone: {
            enabled: true,
            priority: 4,
            homepage: "https://fanzone-omega.vercel.app/"
        }
    },
    polling: { upcomingMinutes: 10, liveMinutes: 2 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
};