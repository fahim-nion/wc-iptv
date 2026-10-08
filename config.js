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
            homepage: "https://xoilaczzq.cc/",
            mirrors: ["https://xoilac.live/", "https://xoilac.tv/"]
        },
        livelive24: {
            enabled: true,
            priority: 4,
            homepage: "https://livelive24.com/",
            mirrors: []
        },
        camel1: {
            enabled: true,
            priority: 5,
            homepage: "https://www.camel1.tv/",
            mirrors: []
        },
        hesgoal: {
            enabled: true,
            priority: 6,
            homepage: "https://hesgoalltv.net/",
            api: "https://cdn.kora-api.org/api/v1/matches?lang=en",
            mirrors: []
        }
    },
    polling: { upcomingMinutes: 10, liveMinutes: 2 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
};