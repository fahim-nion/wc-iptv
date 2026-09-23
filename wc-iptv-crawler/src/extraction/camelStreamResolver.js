// Camel1 pure JS LayoutManager decryptor
const setupDecryptor = (e, t) => {
    "use strict";
    function n(e,t){e-=417;let r=c(),o=r[e];if(void 0===n.kWymTa){var i=function(e){let t="",n="";for(let n=0,r,o,i=0;o=e.charAt(i++);~o&&(r=n%4?64*r+o:o,n++%4)&&(t+=String.fromCharCode(255&r>>(-2*n&6))))o="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=".indexOf(o);for(let e=0,r=t.length;e<r;e++)n+="%"+("00"+t.charCodeAt(e).toString(16)).slice(-2);return decodeURIComponent(n)};n.TfoGIg=function(e,t){let n,r=[],o=0,l,c="";for(n=0,e=i(e);n<256;n++)r[n]=n;for(n=0;n<256;n++)o=(o+r[n]+t.charCodeAt(n%t.length))%256,l=r[n],r[n]=r[o],r[o]=l;n=0,o=0;for(let t=0;t<e.length;t++)o=(o+r[n=(n+1)%256])%256,l=r[n],r[n]=r[o],r[o]=l,c+=String.fromCharCode(e.charCodeAt(t)^r[(r[n]+r[o])%256]);return c},n.CpShso={},n.kWymTa=!0}let l=e+r[0],a=n.CpShso[l];return a?o=a:(void 0===n.OpHQKU&&(n.OpHQKU=!0),o=n.TfoGIg(o,t),n.CpShso[l]=o),o}function r(e,t){e-=417;let n=c(),o=n[e];void 0===r.NPIUIv&&(r.pomiVv=function(e){let t="",n="";for(let n=0,r,o,i=0;o=e.charAt(i++);~o&&(r=n%4?64*r+o:o,n++%4)&&(t+=String.fromCharCode(255&r>>(-2*n&6))))o="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=".indexOf(o);for(let e=0,r=t.length;e<r;e++)n+="%"+("00"+t.charCodeAt(e).toString(16)).slice(-2);return decodeURIComponent(n)},r.yrkvHO={},r.NPIUIv=!0);let i=e+n[0],l=r.yrkvHO[i];return l?o=l:(o=r.pomiVv(o),r.yrkvHO[i]=o),o}!function(e){let t=e();for(;;)try{if(-parseInt(n(498,"!AFh"))/1+parseInt(n(469,"]di8"))/2*(-parseInt(r(511))/3)+parseInt(n(424,"cjWf"))/4*(-parseInt(n(458,"1b@1"))/5)+parseInt(n(513,"DXJZ"))/6+parseInt(r(518))/7+-parseInt(r(417))/8+-parseInt(n(459,"pSvB"))/9*(-parseInt(n(471,"d8!d"))/10)===597502)break;t.push(t.shift())}catch(e){t.push(t.shift())}}(c),Object[n(438,"hdAI")+n(497,"#goL")](t,n(457,"FxBL"),{value:!0}),t[r(475)+r(470)]=void 0;let o=r(502)+r(440)+r(515)+n(484,"aMqr")+n(478,"xu9u");function i(e){let t={gcvdd:function(e,t){return e(t)},NAZAL:function(e,t){return e<t}},o=t[n(460,"Fj&P")](atob,e),i=o[n(501,"mf@$")],l=new Uint8Array(i);for(let e=0;t[r(429)](e,i);e++)l[e]=o[r(473)](e);return l}class l{static async [n(514,"p$Y9")](){let e={LwZoT:function(e,t){return e(t)},CACmp:n(454,"o(ae"),xWYgS:n(504,"3rm7"),noQKs:n(421,"QC]d"),YzsPb:n(444,"&I*1")},t=e[n(476,"*ns&")](i,o);return await globalThis[r(486)][n(464,"%CPS")][r(481)](e[r(493)],t,{name:e[r(418)]},!1,[e[r(420)],e[n(447,"cbD7")]])}static async [r(495)+r(450)](e){let t={YsXfH:r(453)},o=await this[r(487)](),i=globalThis[n(451,"LdXu")][r(503)+n(466,"A5mz")](new Uint8Array(12)),l=new TextEncoder()[r(423)](e);return{ciphertext:new Uint8Array(await globalThis[r(486)][n(456,"3rm7")][r(452)]({name:t[r(490)],iv:i},o,l)),iv:i}}static async [r(455)+"t"](e,t){let o={SLMJX:n(433,"pSvB"),arHdS:r(463)+n(434,"Wadm")},i=await this[n(449,"FxBL")]();try{let l=await globalThis[n(472,"p$Y9")][r(491)][n(419,"]di8")]({name:o[r(507)],iv:t},i,e);return new TextDecoder()[n(480,"a[GR")](l)}catch(e){throw Error(o[r(436)])}}static async [n(492,"^zEC")+r(510)](e){let t="IREt",o={vdxtF:function(e,t){return e<t},MOHLm:function(e,t){return e(t)},RfWOo:function(e,t){return e!==t},sVsmq:r(430),ILjVo:r(517),KTsnD:n(516,"*ns&")+r(494)+n(465,t)+r(437)+r(509)+r(443)+n(428,"%CPS")+r(445)+".",ZYfVy:function(e,t){return e(t)},UllGh:function(e,t){return e(t)}},l=e[n(427,t)]();if(o[r(521)](l[r(426)],16))if(o[n(483,"02aM")](o[r(485)],o[n(448,"A5mz")]))throw Error(o[n(425,t)]);else{let e="",t=_0x426c9d[r(489)];for(let i=0;o[n(479,"*ns&")](i,t);i++)e+=_0x389b4a[r(520)+"de"](_0x2d6bd2[i]);return o[r(435)](_0x32191b,e)}let c=l[n(439,"Mqu[")](0,16),a=l[n(431,"($Z4")](16),u=o[n(474,"qTv[")](i,c),s=o[n(519,"^nl!")](i,a);return o[n(508,"o(ae")](u[r(426)],12),await this[n(441,"3%kP")+"t"](s,u)}}function c(){let e=["mJa4ndG1wxbwt2Xp","W7xcLSk9WRnSWQKhpIejram","z2vY","W5BdMNVdLbiBW64qW7a","WRRdKCoUW6G1ya","y2HHCKnVzgvbDa","W68eWQvhla","tgf5B3v0twfUyq","CWmHWPddMG","WORdQKmZtW","W5PJemoU","sradWOVdIa","lSokhwiXW5m","Aw1WB3j0s2v5","WONcKSkqgmofhrNcMmoPWP0","W4j+WQlcUeG","uSo/WOxdRdrRxSkuW5hcOq","C1zZBxe","y3j5ChrV","z2v0s2v5","r1riA1G","yNL0zuXLBMD0Aa","wxnyzKG","C3vIDgXL","wIacdmoAkKNcUSkpW7u","q0fdBxa","BMCGAxmGDg9Via","y2fSy3vSyxrLra","ruTQsNK","WOTznCoT","W7FcVdPXh2tcNSknWPZdRmo5","mtCYnJaZohfsyMHltW","s0vlrw8","W6qhnMu8eG","DfzjvLnHzZziDW","z2v0uMfUzg9TvG","WPnUb8kfW715W5m","W6FcN2BcGCkrwSkkkehdIW","q3LjwuC","u0XnsLG","WQ0NWReGW6u","yxqGBgvHC3qGsq","B3v0","oxvOB0zWAW","ndGZmZzOv2LpuLu","ACo4xLPrWPhdS0FdIqDHeYu","WR7dHSoJW5mKDG","B1zhDJjwAfiVmG","DHOlWORdUSoCW5VdO8oMW7W","qMXfD2O","nJmXodCZmLPvEvb3qG","avenW7Tz","zNjVBunOyxjdBW","DMr4Dey","odC0ntKYmgrJD1nxyq","EfDzz1m","WQxdHCoSW7eLW68h","BM9rs3m","W5tdGmkYW6BdTvSG","CKfnA0K","zw5JB2rL","W7BdGYtdP8k6xh5Ub8k4qmkW","WQ8FEKZdKa","BgvUz3rO","WPa5ye8","hmkjdmkpcYWdW7tdIsO","tKfAquW","ugjYq3C","dNtdMSo8hSkcW6rDwa","W7FcSJTYgtRcVCk9WPBdLCoADa","W682ACo+ASkWva","W7tdVtbAj8kjWPW","tu9itg0","yxjizfm","DcbJB250ywLUia","WOVcHCkzhmoOecJcMmofWOi","umo1W5ldImkUW67cKCkkWPm","qMeYAxHKAuPOEq","W613W7JdOSkiW4Kog0/cMG","W4PmW4qQuCk2W5/cHSof","vIaOmtiGyNL0zq","FXFcNCokomoKxG","zty0ignOyxjZkq","exugkSogcw3cPa","W5ZcNghcTmk/","WOSlW4/dGXW","zZ3cL8kvWQxcIG","Aw1LBNnPB25Z","FSowWPTgW5X6","zw5JCNLWDa","quvtluDdtq","WO0GWPe","CMvZzxrmyxLVDq","WQfEnSoCW5zF","xWFcHSkTWO3cNmkZiKhdNq","qcLXWRzRW4ldQa8","WPXdaSoNfCogqmoaW7CGW5j5","y8oTWOpcGmka","mtq2mtC2ALf3uerb","W5GyCmkSymkYWQpcRuRdU0JcG8k2","rgvJCNLWDgLVBG","hmoCu8oBvN8","WPCJzLddOchdRCkXWOCl","WQmRW5ddSaa","B05gy2e"];return(c=function(){return e})()}t[r(475)+r(470)]=l
};

const moduleExports = {};
setupDecryptor(null, moduleExports);
const LayoutManager = moduleExports.LayoutManager;

export async function decryptTxSecret(encryptedTxSecret) {
    if (!encryptedTxSecret) return null;
    return await LayoutManager.requestLayout(encryptedTxSecret);
}

export async function getCamel1Stream(matchId) {
    try {
        const streamApiUrl = `https://api.cameltv.live/camel-service/ee/sports_live/loadAnchorsByMatchId?matchId=${matchId}&sportType=football`;
        const res = await fetch(streamApiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const json = await res.json();
        const streams = json?.detail?.streams || [];
        if (!streams.length) return null;

        const rawStream = streams[0];
        const rawUrl = rawStream.streamUrlM3u8 || rawStream.streamUrl;
        if (!rawUrl) return null;

        const streamNameMatch = rawUrl.match(/\/live\/([^/?]+)\.m3u8/);
        const streamName = streamNameMatch ? streamNameMatch[1] : null;
        if (!streamName) return null;

        const tokenApiUrl = `https://api.cameltv.live/camel-service/ee/sports_live/token?streamName=${encodeURIComponent(streamName)}`;
        const tokenRes = await fetch(tokenApiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const tokenJson = await tokenRes.json();
        const tokenData = tokenJson?.data;
        if (!tokenData || !tokenData.txSecret || !tokenData.txTime) return null;

        const decryptedSecret = await decryptTxSecret(tokenData.txSecret);
        if (!decryptedSecret) return null;

        // Base authenticated stream URL (master manifest)
        const fullStreamUrl = `${rawUrl}?txSecret=${decryptedSecret}&txTime=${tokenData.txTime}&lat=9000`;

        // Fetch master playlist to get the signed variant URL containing auth token
        const masterRes = await fetch(fullStreamUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.camel1.tv/'
            }
        }).catch(() => null);

        if (masterRes && masterRes.status === 200) {
            const body = await masterRes.text();
            const variantMatch = body.match(/https?:\/\/[^\s\r\n]+\.m3u8[^\s\r\n]*/);
            if (variantMatch) {
                return {
                    url: variantMatch[0],
                    type: 'HLS'
                };
            }
        }

        return {
            url: fullStreamUrl,
            type: 'HLS'
        };
    } catch (e) {
        console.error(`[CAMEL1 Resolver Error]: ${e.message}`);
        return null;
    }
}

