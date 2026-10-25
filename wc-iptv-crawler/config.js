export default {
    sources: {
        socolive: { 
            enabled: true, // Expired / GoDaddy parked domain
            priority: 10, 
            homepage: "https://socolivezq.top/",
            mirrors: ["https://socolivear.tv/","https://socolive55v.top/","https://socolivet.cc/"]
        },
        colatv: { 
            enabled: true, // Shut down / website stopped
            priority: 11, 
            homepage: "https://colatv55.live/",
            mirrors: ["https://colatv.watch/"]
        },
        xoilac: { 
            enabled: true, // Heavy browser scraping; covered by faster primary sources
            priority: 12, 
            homepage: "https://xoilacz.ca/",
            mirrors: ["https://xoilaczcr.tv/","https://xoilacvba.tv/","https://xoilaczzzj.cc/"]
        },
        futbolx: {
            enabled: true,
            priority: 2,
            homepage: "https://www.futbol-x.xyz/",
            api: "https://www.futbol-x.xyz/api/football.json",
            tokenApi: "https://www.futbol-x.xyz/api/token.js"
        },
        livelive24: {
            enabled: true,
            priority: 1,
            homepage: "https://livelive24.com/",
            mirrors: []
        },
        xyzstreams: {
            enabled: true,
            priority: 3,
            homepage: "https://xyzstreams.st/",
            mirrors: []
        },
        camel1: {
            enabled: true,
            priority: 4,
            homepage: "https://www.camel1.tv/",
            mirrors: []
        },
        hesgoal: {
            enabled: true,
            priority: 5,
            homepage: "https://hesgoalltv.net/",
            api: "https://cdn.kora-api.org/api/v1/matches?lang=en",
            mirrors: []
        },
        aurasports: {
            enabled: true,
            priority: 6,
            homepage: "https://aurasports.xyz",
            api: "https://aurasports.xyz/api/schedule"
        },
        falconstreams: {
            enabled: true,
            priority: 7,
            homepage: "https://falconstreams.st/home1"
        },
        streamcorner: {
            enabled: false,
            priority: 13,
            homepage: "https://streamcorner.st/",
            mirrors: []
        },
        tap4sport: {
            enabled: false,
            priority: 11,
            homepage: "https://tap4sport.st/?sport=Football"
        },
        minutes90: {
            enabled: true,
            priority: 4,
            homepage: "https://www.90minutes.pro/",
            api: "https://www.90minutes.pro/api/streams"
        },
        bintv: {
            enabled: true,
            priority: 5,
            homepage: "https://www.bintv.cc/",
            api: "https://bintvjson.lovable.app/api/public/bintvjson"
        }
    },
    polling: { upcomingMinutes: 10, liveMinutes: 2 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
};
