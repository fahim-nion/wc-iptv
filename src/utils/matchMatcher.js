// Unified Match Normalization & Sibling Server Matching Engine

export const VIETNAMESE_DICTIONARY = [
  [/\bCÂU LẠC BỘ BÓNG ĐÁ\b|\bCAU LAC BO BONG DA\b/gi, ''],
  [/\bCÂU LẠC BỘ\b|\bCAU LAC BO\b|\bCLB\b/gi, ''],
  [/\bTÂY BAN NHA\b|\bTAY BAN NHA\b/gi, 'SPAIN'],
  [/\bBỒ ĐÀO NHA\b|\bBO DAO NHA\b/gi, 'PORTUGAL'],
  [/\bHÀ LAN\b|\bHA LAN\b/gi, 'NETHERLANDS'],
  [/\bTHỤY SĨ\b|\bTHUY SI\b/gi, 'SWITZERLAND'],
  [/\bTHỤY ĐIỂN\b|\bTHUY DIEN\b/gi, 'SWEDEN'],
  [/\bĐAN MẠCH\b|\bDAN MACH\b/gi, 'DENMARK'],
  [/\bPHẦN LAN\b|\bPHAN LAN\b/gi, 'FINLAND'],
  [/\bBẮC MACEDONIA\b|\bBAC MACEDONIA\b/gi, 'NORTH MACEDONIA'],
  [/\bCH SÉC\b|\bCH SEC\b|\bCỘNG HÒA SÉC\b/gi, 'CZECH REPUBLIC'],
  [/\bXỨ WALES\b|\bXU WALES\b/gi, 'WALES'],
  [/\bNA UY\b/gi, 'NORWAY'],
  [/\bHY LẠP\b|\bHY LAP\b/gi, 'GREECE'],
  [/\bTHỔ NHĨ KỲ\b|\bTHO NHI KY\b/gi, 'TURKEY'],
  [/\bBA LAN\b/gi, 'POLAND'],
  [/\bNHẬT BẢN\b|\bNHAT BAN\b/gi, 'JAPAN'],
  [/\bHÀN QUỐC\b|\bHAN QUOC\b/gi, 'SOUTH KOREA'],
  [/\bANH\b/gi, 'ENGLAND'],
  [/\bPHÁP\b|\bPHAP\b/gi, 'FRANCE'],
  [/\bĐỨC\b|\bDUC\b/gi, 'GERMANY'],
  [/\bÝ\b/gi, 'ITALY'],
  [/\bBỈ\b|\bBI\b/gi, 'BELGIUM']
];

/**
 * Strips all server indicators, quality labels, and bracketed tags from titles.
 */
export function stripServerAndQualityTags(title = '') {
  return (title || '')
    // Remove all bracketed tags: [SERVER ...], [HD | ...], [LIVE24], [TRÀ ĐÁ], etc.
    .replace(/\[[^\]]*\]/g, ' ')
    // Remove parenthesized server/quality tags: (SERVER 1), (HD), (Live)
    .replace(/\([^)]*(?:server|srv|hd|sd|live|stream|blv)[^)]*\)/gi, ' ')
    // Remove trailing or inline server patterns: - SERVER 1, SERVER 1, SRV 2, SERVER #1
    .replace(/(?:[-–—:]\s*)?\b(?:SERVER|SRV)\s*#?\d+\b/gi, ' ')
    // Remove trailing quality labels
    .replace(/\b(?:FHD|HD|SD|4K|1080P|720P|UHD)\b/gi, ' ')
    // Remove common broadcast/crawler keywords
    .replace(/\b(?:LIVE|CANLI|TRỰC TIẾP|DIRECTO|EN VIVO)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes individual team names for robust cross-site matching.
 */
export function cleanTeamName(name = '') {
  if (!name) return '';
  let t = name;

  for (const [pattern, replacement] of VIETNAMESE_DICTIONARY) {
    t = t.replace(pattern, replacement);
  }

  return t
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\b(FOOTBALL CLUB|SPORTS CLUB|SPORT CLUB|CLB|FC|CF|AC|RC|SC|ESTAC|UD|CD|CA|FK|SK|AS|SSC|RCD|KV)\b/gi, '')
    .replace(/\b(1899|1907|1904|1900|VFB|TSG|BSC|FSV|SSV|SV|AFC)\b/gi, '')
    .replace(/\bBALOMPI[EÉ]\b/gi, '')
    .replace(/\bDE FUTBOL\b|\bCALCIO\b|\bDA MADEIRA\b/gi, '')
    .replace(/& HOVE ALBION|AND HOVE ALBION/gi, '')
    .replace(/\bMANCHESTER UNITED\b|\bMANCHESTER UTD\b/gi, 'MAN UTD')
    .replace(/\bMANCHESTER CITY\b/gi, 'MAN CITY')
    .replace(/\bNEWCASTLE UNITED\b/gi, 'NEWCASTLE')
    .replace(/\bWOLVERHAMPTON WANDERERS\b|\bWOLVERHAMPTON\b/gi, 'WOLVES')
    .replace(/\bTOTTENHAM HOTSPUR\b|\bTOTTENHAM\b/gi, 'SPURS')
    .replace(/\bNOTTINGHAM FOREST\b/gi, 'NOTTINGHAM')
    .replace(/\bWEST HAM UNITED\b/gi, 'WEST HAM')
    .replace(/\bPARIS SAINT[- ]GERMAIN\b|\bPARIS SG\b|\bPSG\b/gi, 'PSG')
    .replace(/\bBAYERN MUNCHEN\b|\bFC BAYERN\b/gi, 'BAYERN MUNICH')
    .replace(/\bBAYER 04 LEVERKUSEN\b|\bBAYER LEVERKUSEN\b/gi, 'LEVERKUSEN')
    .replace(/\bBORUSSIA DORTMUND\b|\bBVB\b/gi, 'DORTMUND')
    .replace(/\bBORUSSIA MONCHENGLADBACH\b|\bM GLADBACH\b/gi, 'MONCHENGLADBACH')
    .replace(/\bEINTRACHT FRANKFURT\b/gi, 'FRANKFURT')
    .replace(/\bRB LEIPZIG\b/gi, 'LEIPZIG')
    .replace(/\bINTER MILAN\b|\bINTERNAZIONALE\b/gi, 'INTER')
    .replace(/\bATHLETIC CLUB\b/gi, 'ATHLETIC BILBAO')
    .replace(/\bCELTA DE VIGO\b|\bCELTA VIGO\b/gi, 'CELTA VIGO')
    .replace(/\bREAL BETIS BALOMPIE\b/gi, 'REAL BETIS')
    .replace(/\bREAL SOCIEDAD DE FUTBOL\b/gi, 'REAL SOCIEDAD')
    .replace(/\bSPORTING LISBON\b|\bSPORTING CLUBE DE PORTUGAL\b/gi, 'SPORTING CP')
    .replace(/\bTWENTE ENSCHEDE\b|\bFC TWENTE\b/gi, 'TWENTE')
    .replace(/\bAZ ALKMAAR\b/gi, 'AZ')
    .replace(/\bSPORTING BRAGA\b/gi, 'BRAGA')
    .replace(/\bUNION SAINT GILLOISE\b|\bROYALE UNION SAINT GILLOISE\b/gi, 'UNION SG')
    .replace(/\(WOMEN\)|\bWOMEN\b|\bFEMININ\b|\bFEMENINO\b/gi, '(W)')
    .replace(/[-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/**
 * Parses Team 1 and Team 2 from raw titles across all crawler patterns.
 */
export function getMatchTeams(rawTitle = '') {
  const clean = stripServerAndQualityTags(rawTitle);
  let t1 = '', t2 = '';

  // 1. Check for standard VS variations: " VS ", " vs ", " VS. ", " vs. ", " V. ", " v "
  if (/\s+(?:VS|vs)\.?\s+/i.test(clean)) {
    const parts = clean.split(/\s+(?:VS|vs)\.?\s+/i);
    t1 = cleanTeamName(parts[0]);
    t2 = cleanTeamName(parts.slice(1).join(' '));
  } 
  // 2. Check for @ (Home @ Away -> swap)
  else if (clean.includes(' @ ')) {
    const parts = clean.split(' @ ');
    t1 = cleanTeamName(parts[1]);
    t2 = cleanTeamName(parts[0]);
  } 
  // 3. Check for hyphens or colons: "TEAM 1 - TEAM 2", "TEAM 1 – TEAM 2", "TEAM 1 : TEAM 2"
  else if (/\s+[-–—:]\s+/.test(clean)) {
    const parts = clean.split(/\s+[-–—:]\s+/);
    t1 = cleanTeamName(parts[0]);
    t2 = cleanTeamName(parts.slice(1).join(' '));
  } 
  else {
    t1 = cleanTeamName(clean);
  }

  return { t1: t1.trim(), t2: t2.trim() };
}

/**
 * Computes a symmetrical canonical key: sorted teams joined by __VS__
 */
export function getCanonicalMatchKey(rawTitle = '') {
  const { t1, t2 } = getMatchTeams(rawTitle);
  if (!t2) return t1;
  return [t1, t2].sort().join(' __VS__ ');
}

export const GENERIC_TEAM_WORDS = new Set([
  'CITY', 'UNITED', 'UTD', 'TOWN', 'REAL', 'SPORTING', 'INTER', 'CLUB', 
  'DEPORTIVO', 'RACING', 'ATHLETIC', 'RED', 'BLUE', 'STAR', 'NEW', 
  'SAN', 'SAINT', 'ST', 'DE', 'LA', 'FC', 'CF', 'AC', 'SC', 'BK', 'FK', 
  'FF', 'IF', 'SK', 'MADRID', 'CALI', 'YOUTH', 'U21', 'U20', 'U19', 
  'WOMEN', 'W', 'BOYS', 'BOIS'
]);

/**
 * Checks if two individual team names match, ignoring generic suffixes and stopwords.
 */
export function isTeamMatch(x, y) {
  if (!x || !y) return false;
  if (x === y) return true;

  const sigX = x.split(' ').filter(w => !GENERIC_TEAM_WORDS.has(w) && w.length >= 3);
  const sigY = y.split(' ').filter(w => !GENERIC_TEAM_WORDS.has(w) && w.length >= 3);

  if (sigX.length === 0 || sigY.length === 0) {
    return x === y;
  }

  // Exact substring check if both have significant tokens
  if (x.includes(y) || y.includes(x)) {
    const shorter = x.length < y.length ? x : y;
    const longer = x.length < y.length ? y : x;
    const shorterSig = shorter.split(' ').filter(w => !GENERIC_TEAM_WORDS.has(w) && w.length >= 3);
    if (shorterSig.length > 0) {
      const conflictWords = ['ATLETICO', 'REAL', 'INTER', 'MILAN', 'CITY', 'UNITED', 'KNICKS', 'MAGIC'];
      const conflict = conflictWords.some(c => (longer.includes(c) && !shorter.includes(c)));
      if (!conflict) return true;
    }
  }

  const common = sigX.filter(w => sigY.includes(w) || sigY.some(sy => (sy.length > 4 && w.length > 4 && (sy.includes(w) || w.includes(sy)))));
  if (common.length > 0) {
    const conflictWords = ['ATLETICO', 'REAL', 'INTER', 'MILAN', 'CITY', 'UNITED', 'KNICKS', 'MAGIC'];
    const conflict = conflictWords.some(c => (x.includes(c) && !y.includes(c)) || (y.includes(c) && !x.includes(c)));
    if (!conflict) return true;
  }
  return false;
}

/**
 * Checks if two match titles refer to the same fixture across any crawling source.
 */
export function areMatchesSameFixture(titleA = '', titleB = '') {
  if (!titleA || !titleB) return false;
  const keyA = getCanonicalMatchKey(titleA);
  const keyB = getCanonicalMatchKey(titleB);
  if (keyA && keyB && keyA === keyB) return true;

  // Fuzzy team-level overlap check
  const { t1: a1, t2: a2 } = getMatchTeams(titleA);
  const { t1: b1, t2: b2 } = getMatchTeams(titleB);
  if (!a2 || !b2) return false;

  const direct = isTeamMatch(a1, b1) && isTeamMatch(a2, b2);
  const reverse = isTeamMatch(a1, b2) && isTeamMatch(a2, b1);
  return Boolean(direct || reverse);
}

/**
 * Extracts all sibling servers for a given channel across all sources in a deterministic, stable order.
 * Uses fixture grouping to ensure no server vanishes or changes position when switching servers.
 */
export function findSiblingServers(currentChannel, allChannels = []) {
  if (!currentChannel?.name && !currentChannel?.title) return [];
  if (currentChannel.isPermanent) return [currentChannel];

  const currentTitle = currentChannel.name || currentChannel.title || '';
  const fixtures = groupChannelsIntoFixtures(allChannels);

  // 1. Primary match: Fixture containing the current channel URL and title
  let matchFixture = fixtures.find(f => 
    f.servers.some(s => s.url === currentChannel.url) &&
    areMatchesSameFixture(currentTitle, f.baseTitle || f.primaryChannel?.name)
  );

  // 2. Fallback by URL
  if (!matchFixture) {
    matchFixture = fixtures.find(f => f.servers.some(s => s.url === currentChannel.url));
  }

  // 3. Fallback by Title
  if (!matchFixture) {
    matchFixture = fixtures.find(f => areMatchesSameFixture(currentTitle, f.baseTitle || f.primaryChannel?.name));
  }

  if (matchFixture && Array.isArray(matchFixture.servers) && matchFixture.servers.length > 0) {
    return matchFixture.servers;
  }

  return [currentChannel];
}

let lastChannelsRef = null;
let cachedFixtures = null;

/**
 * Groups all live channels into consolidated fixtures for AvailableMatches.
 * Retains the order of newly crawled matches (latest first).
 */
export function groupChannelsIntoFixtures(channels = []) {
  if (channels === lastChannelsRef && cachedFixtures) {
    return cachedFixtures;
  }

  const fixturesMap = new Map();

  for (let idx = 0; idx < channels.length; idx++) {
    const ch = channels[idx];
    if (ch.isPermanent) continue;
    const rawTitle = ch.name || ch.title || '';
    if (!rawTitle) continue;

    const key = getCanonicalMatchKey(rawTitle);
    if (!key) continue;

    // Check if an existing fixture in map is equivalent via fuzzy matching
    let targetKey = key;
    if (!fixturesMap.has(targetKey)) {
      for (const existingKey of fixturesMap.keys()) {
        const existingFixture = fixturesMap.get(existingKey);
        if (areMatchesSameFixture(rawTitle, existingFixture.primaryChannel.name || existingFixture.baseTitle)) {
          targetKey = existingKey;
          break;
        }
      }
    }

    if (!fixturesMap.has(targetKey)) {
      const { t1, t2 } = getMatchTeams(rawTitle);
      const displayTitle = t2 ? `${t1} VS ${t2}` : t1;

      fixturesMap.set(targetKey, {
        id: `fixture-${targetKey.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        canonicalKey: targetKey,
        baseTitle: displayTitle,
        team1: t1,
        team2: t2,
        group: ch.group || 'Live Football',
        servers: [ch],
        primaryChannel: ch,
        sources: new Set([ch.source || 'IPTV']),
        firstSeenIndex: idx,
        crawledAt: ch.crawledAt || null
      });
    } else {
      const fixture = fixturesMap.get(targetKey);
      // Deduplicate by URL
      if (!fixture.servers.some(s => s.url === ch.url)) {
        fixture.servers.push(ch);
      }
      if (ch.source) fixture.sources.add(ch.source);
      if (ch.crawledAt && (!fixture.crawledAt || ch.crawledAt > fixture.crawledAt)) {
        fixture.crawledAt = ch.crawledAt;
      }
    }
  }

  const result = Array.from(fixturesMap.values());
  lastChannelsRef = channels;
  cachedFixtures = result;
  return result;
}
