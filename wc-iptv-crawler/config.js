export default {
    sources: {
        socolive: { 
            enabled: true, 
            priority: 1, 
            homepage: "https://socolive-football.pro/",
            mirrors: ["https://beardstyles.website/", "https://socoliveee.co/","https://socolivetv.dance/","https://socolivef.co/","https://socoliveu.tv/"]
        },
        colatv: { 
            enabled: true, 
            priority: 2, 
            homepage: "https://colatv65.live/",
            mirrors: ["https://colatv77.live/", "https://colalive.tv/"]
        },
        xoilac: { 
            enabled: true, 
            priority: 3, 
            homepage: "https://xoilaczznnz.tv/",
            mirrors: ["https://xoilaczzb.cc/", "https://xoilaczbl.tv/"]
        },
        fanzone: {
            enabled: true,
            priority: 4,
            homepage: "https://fanzone-omega.vercel.app/",
            mirrors: []
        },
        // ADDED CAMEL1
        camel1: {
            enabled: true,
            priority: 5,
            homepage: "https://www.camel1.tv/",
            mirrors: []
        }
    },
    polling: { upcomingMinutes: 10, liveMinutes: 2 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
};