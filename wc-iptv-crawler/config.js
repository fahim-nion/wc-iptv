export default {
    sources: {
        socolive: { 
            enabled: true, 
            priority: 1, 
            homepage: "https://bit.ly/socolive-live",
            mirrors: ["https://socolive.live/", "https://socolive1.com/", "https://socoliveq.tv/"]
        },
        colatv: { 
            enabled: true, 
            priority: 2, 
            homepage: "https://bit.ly/colalive",
            mirrors: ["https://cola.live/", "https://colalive.tv/", "https://cola-affcup2026.tv/"]
        },
        xoilac: { 
            enabled: true, 
            priority: 3, 
            homepage: "https://bit.ly/xoilac-live",
            mirrors: ["https://xoilac.live/", "https://xoilaczznnz.tv/"]
        }
    },
    polling: { upcomingMinutes: 10, liveMinutes: 2 },
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
};