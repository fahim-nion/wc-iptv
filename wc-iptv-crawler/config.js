export default {
    sources: {
        socolive: { 
            enabled: true, 
            priority: 1, 
            // Updated to the working domain from your log
            homepage: "https://socoliveq.tv/",
            mirrors: ["https://socolivea.tv/", "https://socolive.live/"]
        },
        colatv: { 
            enabled: true, 
            priority: 2, 
            // Updated to the working domain from your log
            homepage: "https://cola-affcup2026.tv/",
            mirrors: ["https://colatv.live/", "https://bit.ly/colalive"]
        },
        xoilac: { 
            enabled: true, 
            priority: 3, 
            homepage: "https://xoilaczznnz.tv/",
            mirrors: ["https://xoilaczziiz.tv/", "https://xoilac.tv/"]
        }
    },
    polling: { upcomingMinutes: 10, liveMinutes: 2 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
};