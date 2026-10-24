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
        futbolx: {
            enabled: true,
            priority: 4,
            homepage: "https://www.futbol-x.xyz/",
            api: "https://www.futbol-x.xyz/api/football.json",
            tokenApi: "https://www.futbol-x.xyz/api/token.js"
        },
        livelive24: {
            enabled: true,
            priority: 5,
            homepage: "https://livelive24.com/",
            mirrors: []
        },
        camel1: {
            enabled: true,
            priority: 6,
            homepage: "https://www.camel1.tv/",
            mirrors: []
        },
        hesgoal: {
            enabled: true,
            priority: 7,
            homepage: "https://hesgoalltv.net/",
            api: "https://cdn.kora-api.org/api/v1/matches?lang=en",
            mirrors: []
        },
        aurasports: {
            enabled: true,
            priority: 8,
            homepage: "https://aurasports.xyz",
            api: "https://aurasports.xyz/api/schedule"
        },
        falconstreams: {
            enabled: true,
            priority: 9,
            homepage: "https://falconstreams.st/home1"
        },
        streamcorner: {
            enabled: true,
            priority: 10,
            homepage: "https://streamcorner.st/",
            mirrors: []
        },
        tap4sport: {
            enabled: false,
            priority: 11,
            homepage: "https://tap4sport.st/?sport=Football"
        },
        xyzstreams: {
            enabled: true,
            priority: 12,
            homepage: "https://xyzstreams.st"
        }
    },
    polling: { upcomingMinutes: 10, liveMinutes: 2 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
};
