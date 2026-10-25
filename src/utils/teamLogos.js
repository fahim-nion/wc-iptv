// Comprehensive club and country logo directory using official ESPN & FlagCDN image repositories
const ESPN_CLUB_LOGOS = {
  // English Premier League & Championship
  'ARSENAL': 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
  'ASTON VILLA': 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png',
  'BOURNEMOUTH': 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png',
  'BRENTFORD': 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png',
  'BRIGHTON': 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
  'BRIGHTON & HOVE ALBION': 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
  'CHELSEA': 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
  'CRYSTAL PALACE': 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png',
  'EVERTON': 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png',
  'FULHAM': 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
  'IPSWICH': 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png',
  'IPSWICH TOWN': 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png',
  'LEICESTER': 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png',
  'LEICESTER CITY': 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png',
  'LIVERPOOL': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
  'MAN CITY': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'MANCHESTER CITY': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'MAN UTD': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'MANCHESTER UNITED': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'NEWCASTLE': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
  'NEWCASTLE UNITED': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
  'NOTTINGHAM FOREST': 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png',
  'SOUTHAMPTON': 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png',
  'TOTTENHAM': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
  'TOTTENHAM HOTSPUR': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
  'WEST HAM': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
  'WEST HAM UNITED': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
  'WOLVES': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
  'WOLVERHAMPTON': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
  'LEEDS': 'https://a.espncdn.com/i/teamlogos/soccer/500/357.png',
  'LEEDS UNITED': 'https://a.espncdn.com/i/teamlogos/soccer/500/357.png',
  'BURNLEY': 'https://a.espncdn.com/i/teamlogos/soccer/500/379.png',
  'SHEFFIELD UNITED': 'https://a.espncdn.com/i/teamlogos/soccer/500/398.png',
  'SUNDERLAND': 'https://a.espncdn.com/i/teamlogos/soccer/500/366.png',
  'HULL CITY': 'https://a.espncdn.com/i/teamlogos/soccer/500/306.png',

  // Spanish La Liga
  'REAL MADRID': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
  'BARCELONA': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  'ATLETICO MADRID': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
  'ATHLETIC BILBAO': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
  'ATHLETIC CLUB': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
  'REAL BETIS': 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png',
  'REAL SOCIEDAD': 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png',
  'VILLARREAL': 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png',
  'SEVILLA': 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png',
  'VALENCIA': 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png',
  'GIRONA': 'https://a.espncdn.com/i/teamlogos/soccer/500/9812.png',
  'CELTA VIGO': 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png',
  'CELTA': 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png',
  'MALLORCA': 'https://a.espncdn.com/i/teamlogos/soccer/500/84.png',
  'OSASUNA': 'https://a.espncdn.com/i/teamlogos/soccer/500/97.png',
  'GETAFE': 'https://a.espncdn.com/i/teamlogos/soccer/500/2922.png',
  'RAYO VALLECANO': 'https://a.espncdn.com/i/teamlogos/soccer/500/101.png',
  'LAS PALMAS': 'https://a.espncdn.com/i/teamlogos/soccer/500/98.png',
  'ALAVES': 'https://a.espncdn.com/i/teamlogos/soccer/500/96.png',
  'ESPANYOL': 'https://a.espncdn.com/i/teamlogos/soccer/500/88.png',
  'LEGANES': 'https://a.espncdn.com/i/teamlogos/soccer/500/2926.png',
  'VALLADOLID': 'https://a.espncdn.com/i/teamlogos/soccer/500/95.png',

  // Italian Serie A
  'INTER': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'INTER MILAN': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'JUVENTUS': 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
  'AC MILAN': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  'MILAN': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  'NAPOLI': 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png',
  'ATALANTA': 'https://a.espncdn.com/i/teamlogos/soccer/500/105.png',
  'ROMA': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  'AS ROMA': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  'LAZIO': 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png',
  'FIORENTINA': 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
  'BOLOGNA': 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png',
  'TORINO': 'https://a.espncdn.com/i/teamlogos/soccer/500/239.png',
  'GENOA': 'https://a.espncdn.com/i/teamlogos/soccer/500/3263.png',
  'MONZA': 'https://a.espncdn.com/i/teamlogos/soccer/500/2729.png',
  'UDINESE': 'https://a.espncdn.com/i/teamlogos/soccer/500/118.png',
  'PARMA': 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png',
  'CAGLIARI': 'https://a.espncdn.com/i/teamlogos/soccer/500/108.png',
  'EMPOLI': 'https://a.espncdn.com/i/teamlogos/soccer/500/121.png',
  'VERONA': 'https://a.espncdn.com/i/teamlogos/soccer/500/119.png',
  'HELLAS VERONA': 'https://a.espncdn.com/i/teamlogos/soccer/500/119.png',
  'LECCE': 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png',
  'VENEZIA': 'https://a.espncdn.com/i/teamlogos/soccer/500/2660.png',
  'COMO': 'https://a.espncdn.com/i/teamlogos/soccer/500/1255.png',
  'FROSINONE': 'https://a.espncdn.com/i/teamlogos/soccer/500/6905.png',

  // German Bundesliga
  'BAYERN MUNICH': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
  'BAYERN': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
  'BAYER LEVERKUSEN': 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
  'LEVERKUSEN': 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
  'BORUSSIA DORTMUND': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'DORTMUND': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'BVB': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'RB LEIPZIG': 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png',
  'LEIPZIG': 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png',
  'EINTRACHT FRANKFURT': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
  'FRANKFURT': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
  'STUTTGART': 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png',
  'VFB STUTTGART': 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png',
  'WOLFSBURG': 'https://a.espncdn.com/i/teamlogos/soccer/500/138.png',
  'BORUSSIA MONCHENGLADBACH': 'https://a.espncdn.com/i/teamlogos/soccer/500/268.png',
  'MONCHENGLADBACH': 'https://a.espncdn.com/i/teamlogos/soccer/500/268.png',
  'HOFFENHEIM': 'https://a.espncdn.com/i/teamlogos/soccer/500/7911.png',
  'TSG HOFFENHEIM': 'https://a.espncdn.com/i/teamlogos/soccer/500/7911.png',
  'FREIBURG': 'https://a.espncdn.com/i/teamlogos/soccer/500/126.png',
  'WERDER BREMEN': 'https://a.espncdn.com/i/teamlogos/soccer/500/137.png',
  'UNION BERLIN': 'https://a.espncdn.com/i/teamlogos/soccer/500/7611.png',
  'AUGSBURG': 'https://a.espncdn.com/i/teamlogos/soccer/500/3841.png',
  'MAINZ': 'https://a.espncdn.com/i/teamlogos/soccer/500/2965.png',

  // French Ligue 1
  'PARIS SAINT GERMAIN': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'PSG': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'MARSEILLE': 'https://a.espncdn.com/i/teamlogos/soccer/500/166.png',
  'MONACO': 'https://a.espncdn.com/i/teamlogos/soccer/500/174.png',
  'AS MONACO': 'https://a.espncdn.com/i/teamlogos/soccer/500/174.png',
  'LYON': 'https://a.espncdn.com/i/teamlogos/soccer/500/167.png',
  'OLYMPIQUE LYONNAIS': 'https://a.espncdn.com/i/teamlogos/soccer/500/167.png',
  'LILLE': 'https://a.espncdn.com/i/teamlogos/soccer/500/164.png',
  'LOSC': 'https://a.espncdn.com/i/teamlogos/soccer/500/164.png',
  'LENS': 'https://a.espncdn.com/i/teamlogos/soccer/500/172.png',
  'NICE': 'https://a.espncdn.com/i/teamlogos/soccer/500/2502.png',
  'RENNES': 'https://a.espncdn.com/i/teamlogos/soccer/500/169.png',
  'BREST': 'https://a.espncdn.com/i/teamlogos/soccer/500/2753.png',
  'STRASBOURG': 'https://a.espncdn.com/i/teamlogos/soccer/500/170.png',
  'NANTES': 'https://a.espncdn.com/i/teamlogos/soccer/500/165.png',
  'LE HAVRE': 'https://a.espncdn.com/i/teamlogos/soccer/500/2485.png',
  'AUXERRE': 'https://a.espncdn.com/i/teamlogos/soccer/500/161.png',
  'AJ AUXERRE': 'https://a.espncdn.com/i/teamlogos/soccer/500/161.png',
  'LE MANS': 'https://a.espncdn.com/i/teamlogos/soccer/500/2384.png',

  // Other Major European Clubs
  'AJAX': 'https://a.espncdn.com/i/teamlogos/soccer/500/141.png',
  'AJAX AMSTERDAM': 'https://a.espncdn.com/i/teamlogos/soccer/500/141.png',
  'SPARTA ROTTERDAM': 'https://a.espncdn.com/i/teamlogos/soccer/500/232.png',
  'PSV': 'https://a.espncdn.com/i/teamlogos/soccer/500/148.png',
  'PSV EINDHOVEN': 'https://a.espncdn.com/i/teamlogos/soccer/500/148.png',
  'FEYENOORD': 'https://a.espncdn.com/i/teamlogos/soccer/500/143.png',
  'BENFICA': 'https://a.espncdn.com/i/teamlogos/soccer/500/1929.png',
  'PORTO': 'https://a.espncdn.com/i/teamlogos/soccer/500/437.png',
  'FC PORTO': 'https://a.espncdn.com/i/teamlogos/soccer/500/437.png',
  'SPORTING CP': 'https://a.espncdn.com/i/teamlogos/soccer/500/508.png',
  'SPORTING LISBON': 'https://a.espncdn.com/i/teamlogos/soccer/500/508.png',
  'CELTIC': 'https://a.espncdn.com/i/teamlogos/soccer/500/296.png',
  'RANGERS': 'https://a.espncdn.com/i/teamlogos/soccer/500/304.png',
  'GALATASARAY': 'https://a.espncdn.com/i/teamlogos/soccer/500/446.png',
  'FENERBAHCE': 'https://a.espncdn.com/i/teamlogos/soccer/500/447.png',
  'BESIKTAS': 'https://a.espncdn.com/i/teamlogos/soccer/500/445.png',
  'CLUB BRUGGE': 'https://a.espncdn.com/i/teamlogos/soccer/500/1429.png',
  'AL NASSR': 'https://a.espncdn.com/i/teamlogos/soccer/500/7300.png',
  'AL HILAL': 'https://a.espncdn.com/i/teamlogos/soccer/500/7298.png',
  'INTER MIAMI': 'https://a.espncdn.com/i/teamlogos/soccer/500/19128.png',
};

// National teams to ISO 2-letter country code for FlagCDN
const COUNTRY_FLAGS = {
  'SPAIN': 'es',
  'ENGLAND': 'gb-eng',
  'FRANCE': 'fr',
  'GERMANY': 'de',
  'ARGENTINA': 'ar',
  'BRAZIL': 'br',
  'ITALY': 'it',
  'PORTUGAL': 'pt',
  'NETHERLANDS': 'nl',
  'BELGIUM': 'be',
  'CROATIA': 'hr',
  'URUGUAY': 'uy',
  'COLOMBIA': 'co',
  'USA': 'us',
  'UNITED STATES': 'us',
  'MEXICO': 'mx',
  'JAPAN': 'jp',
  'SOUTH KOREA': 'kr',
  'KOREA': 'kr',
  'MOROCCO': 'ma',
  'SAUDI ARABIA': 'sa',
  'TURKEY': 'tr',
  'TURKIYE': 'tr',
  'SWITZERLAND': 'ch',
  'AUSTRIA': 'at',
  'DENMARK': 'dk',
  'SWEDEN': 'se',
  'NORWAY': 'no',
  'POLAND': 'pl',
  'CZECH REPUBLIC': 'cz',
  'SCOTLAND': 'gb-sct',
  'WALES': 'gb-wls',
  'IRELAND': 'ie',
  'UKRAINE': 'ua',
  'GREECE': 'gr',
  'FINLAND': 'fi',
  'BELARUS': 'by',
  'NORTH MACEDONIA': 'mk',
  'EGYPT': 'eg',
  'NIGERIA': 'ng',
  'SENEGAL': 'sn',
  'GHANA': 'gh',
  'AUSTRALIA': 'au',
  'CANADA': 'ca'
};

/**
 * Returns a high-res logo or country flag for any football team / country.
 * Returns null if no match found (caller displays stylized monogram).
 */
export function getTeamLogo(teamName) {
  if (!teamName) return null;
  const clean = teamName
    .replace(/\(W\)/gi, '') // Women's tag
    .replace(/\b(FC|CF|AC|SC|AS|CD|UD|FK|SK)\b/gi, '')
    .trim()
    .toUpperCase();

  // 1. Direct club lookup
  if (ESPN_CLUB_LOGOS[clean]) return ESPN_CLUB_LOGOS[clean];
  if (ESPN_CLUB_LOGOS[teamName.toUpperCase().trim()]) return ESPN_CLUB_LOGOS[teamName.toUpperCase().trim()];

  // 2. Fuzzy club name match
  for (const [club, url] of Object.entries(ESPN_CLUB_LOGOS)) {
    if (clean.includes(club) || club.includes(clean)) {
      return url;
    }
  }

  // 3. Country flag lookup
  const flagCode = COUNTRY_FLAGS[clean] || COUNTRY_FLAGS[teamName.toUpperCase().trim()];
  if (flagCode) {
    return `https://flagcdn.com/w80/${flagCode}.png`;
  }

  // Check country partial match
  for (const [country, code] of Object.entries(COUNTRY_FLAGS)) {
    if (clean.includes(country) || country.includes(clean)) {
      return `https://flagcdn.com/w80/${code}.png`;
    }
  }

  return null;
}
