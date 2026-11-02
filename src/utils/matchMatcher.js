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

export function getMatchTeams(rawTitle = '') {
  let clean = (rawTitle || '')
    .replace(/\[SERVER\s*[^\]]*\]/gi, '')
    .replace(/\[(HD|SD|FHD|720P|1080P|4K)\]/gi, '')
    .replace(/\[[^\]]+\]/g, '')
    .trim();

  let t1 = '', t2 = '';
  if (clean.includes(' VS ') || clean.includes(' vs ') || clean.includes(' VS. ') || clean.includes(' vs. ')) {
    const parts = clean.split(/\s+(?:VS|vs)\.?\s+/i);
    t1 = cleanTeamName(parts[0]);
    t2 = cleanTeamName(parts[1]);
  } else if (clean.includes(' @ ')) {
    const parts = clean.split(' @ ');
    t1 = cleanTeamName(parts[1]);
    t2 = cleanTeamName(parts[0]);
  } else {
    t1 = cleanTeamName(clean);
  }
  return { t1, t2 };
}

export function getCanonicalMatchKey(rawTitle = '') {
  const { t1, t2 } = getMatchTeams(rawTitle);
  if (!t2) return t1;
  return [t1, t2].sort().join(' __VS__ ');
}

export function areMatchesSameFixture(titleA = '', titleB = '') {
  if (!titleA || !titleB) return false;
  const keyA = getCanonicalMatchKey(titleA);
  const keyB = getCanonicalMatchKey(titleB);
  if (keyA && keyB && keyA === keyB) return true;

  // Fuzzy team-level overlap check
  const { t1: a1, t2: a2 } = getMatchTeams(titleA);
  const { t1: b1, t2: b2 } = getMatchTeams(titleB);
  if (!a2 || !b2) return false;

  const isTeamMatch = (x, y) => {
    if (!x || !y) return false;
    if (x === y) return true;
    if (x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x))) return true;
    const wordsX = x.split(' ').filter(w => w.length > 2);
    const wordsY = y.split(' ').filter(w => w.length > 2);
    return wordsX.some(wx => wordsY.includes(wx));
  };

  const direct = isTeamMatch(a1, b1) && isTeamMatch(a2, b2);
  const reverse = isTeamMatch(a1, b2) && isTeamMatch(a2, b1);
  return Boolean(direct || reverse);
}

// Extract all sibling servers for the given channel across all sources
export function findSiblingServers(currentChannel, allChannels = []) {
  if (!currentChannel?.name) return [];
  const currentTitle = currentChannel.name;
  const canonicalKey = getCanonicalMatchKey(currentTitle);

  const matched = [];
  const seenUrls = new Set();

  // Always include the current channel first
  if (currentChannel.url) {
    matched.push(currentChannel);
    seenUrls.add(currentChannel.url);
  }

  for (const ch of allChannels) {
    if (ch.isPermanent) continue;
    if (!ch.url || seenUrls.has(ch.url)) continue;

    const chTitle = ch.name || ch.title || '';
    if (!chTitle) continue;

    const chKey = getCanonicalMatchKey(chTitle);
    if ((canonicalKey && chKey && canonicalKey === chKey) || areMatchesSameFixture(currentTitle, chTitle)) {
      seenUrls.add(ch.url);
      matched.push(ch);
    }
  }

  return matched;
}

// Group all live channels into consolidated fixtures for AvailableMatches
export function groupChannelsIntoFixtures(channels = []) {
  const fixturesMap = new Map();

  for (const ch of channels) {
    if (ch.isPermanent) continue; // Exclude permanent channels from fixture grid
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
        sources: new Set([ch.source || 'IPTV'])
      });
    } else {
      const fixture = fixturesMap.get(targetKey);
      // Deduplicate by URL
      if (!fixture.servers.some(s => s.url === ch.url)) {
        fixture.servers.push(ch);
      }
      if (ch.source) fixture.sources.add(ch.source);
    }
  }

  return Array.from(fixturesMap.values());
}

