export default {
    sources: {
        socolive: { 
            enabled: true, 
            priority: 1, 
            homepage: "https://socolive.live/",
            mirrors: ["https://socolive1.com/", "https://socoliveq.tv/"]
        },
        colatv: { 
            enabled: true, 
            priority: 2, 
            homepage: "https://cola.live/",
            mirrors: ["https://colalive.tv/", "https://cola-affcup2026.tv/"]
        },
        xoilac: { 
            enabled: true, 
            priority: 3, 
            homepage: "https://xoilac.live/",
            mirrors: ["https://xoilaczznnz.tv/", "https://xoilaczziiz.tv/"]
        }
    },
    polling: { upcomingMinutes: 10, liveMinutes: 2 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
};
