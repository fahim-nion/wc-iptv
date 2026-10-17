export const VIETNAMESE_DICTIONARY = [
  [/(?<!\p{L})CÂU LẠC BỘ BÓNG ĐÁ\s+/gui, ''],
  [/(?<!\p{L})CAU LAC BO BONG DA\s+/gui, ''],
  [/(?<!\p{L})CÂU LẠC BỘ\s+/gui, ''],
  [/(?<!\p{L})CAU LAC BO\s+/gui, ''],
  [/(?<!\p{L})CLB\s+/gui, ''],
  [/(?<!\p{L})TÂY BAN NHA(?!\p{L})/gui, 'SPAIN'],
  [/(?<!\p{L})TAY BAN NHA(?!\p{L})/gui, 'SPAIN'],
  [/(?<!\p{L})BỒ ĐÀO NHA(?!\p{L})/gui, 'PORTUGAL'],
  [/(?<!\p{L})BO DAO NHA(?!\p{L})/gui, 'PORTUGAL'],
  [/(?<!\p{L})HÀ LAN(?!\p{L})/gui, 'NETHERLANDS'],
  [/(?<!\p{L})HA LAN(?!\p{L})/gui, 'NETHERLANDS'],
  [/(?<!\p{L})THỤY SĨ(?!\p{L})/gui, 'SWITZERLAND'],
  [/(?<!\p{L})THUY SI(?!\p{L})/gui, 'SWITZERLAND'],
  [/(?<!\p{L})THỤY ĐIỂN(?!\p{L})/gui, 'SWEDEN'],
  [/(?<!\p{L})THUY DIEN(?!\p{L})/gui, 'SWEDEN'],
  [/(?<!\p{L})ĐAN MẠCH(?!\p{L})/gui, 'DENMARK'],
  [/(?<!\p{L})DAN MACH(?!\p{L})/gui, 'DENMARK'],
  [/(?<!\p{L})PHẦN LAN(?!\p{L})/gui, 'FINLAND'],
  [/(?<!\p{L})PHAN LAN(?!\p{L})/gui, 'FINLAND'],
  [/(?<!\p{L})BẮC MACEDONIA(?!\p{L})/gui, 'NORTH MACEDONIA'],
  [/(?<!\p{L})BAC MACEDONIA(?!\p{L})/gui, 'NORTH MACEDONIA'],
  [/(?<!\p{L})BẮC IRELAND(?!\p{L})/gui, 'NORTHERN IRELAND'],
  [/(?<!\p{L})BAC IRELAND(?!\p{L})/gui, 'NORTHERN IRELAND'],
  [/(?<!\p{L})CH SÉC(?!\p{L})/gui, 'CZECH REPUBLIC'],
  [/(?<!\p{L})CH SEC(?!\p{L})/gui, 'CZECH REPUBLIC'],
  [/(?<!\p{L})CỘNG HÒA SÉC(?!\p{L})/gui, 'CZECH REPUBLIC'],
  [/(?<!\p{L})CONG HOA SEC(?!\p{L})/gui, 'CZECH REPUBLIC'],
  [/(?<!\p{L})XỨ WALES(?!\p{L})/gui, 'WALES'],
  [/(?<!\p{L})XU WALES(?!\p{L})/gui, 'WALES'],
  [/(?<!\p{L})NA UY(?!\p{L})/gui, 'NORWAY'],
  [/(?<!\p{L})HY LẠP(?!\p{L})/gui, 'GREECE'],
  [/(?<!\p{L})HY LAP(?!\p{L})/gui, 'GREECE'],
  [/(?<!\p{L})THỔ NHĨ KỲ(?!\p{L})/gui, 'TURKEY'],
  [/(?<!\p{L})THO NHI KY(?!\p{L})/gui, 'TURKEY'],
  [/(?<!\p{L})BA LAN(?!\p{L})/gui, 'POLAND'],
  [/(?<!\p{L})NHẬT BẢN(?!\p{L})/gui, 'JAPAN'],
  [/(?<!\p{L})NHAT BAN(?!\p{L})/gui, 'JAPAN'],
  [/(?<!\p{L})HÀN QUỐC(?!\p{L})/gui, 'SOUTH KOREA'],
  [/(?<!\p{L})HAN QUOC(?!\p{L})/gui, 'SOUTH KOREA'],
  [/(?<!\p{L})TRIỀU TIÊN(?!\p{L})/gui, 'NORTH KOREA'],
  [/(?<!\p{L})TRIEU TIEN(?!\p{L})/gui, 'NORTH KOREA'],
  [/(?<!\p{L})TRUNG QUỐC(?!\p{L})/gui, 'CHINA'],
  [/(?<!\p{L})TRUNG QUOC(?!\p{L})/gui, 'CHINA'],
  [/(?<!\p{L})Ả RẬP XÊ ÚT(?!\p{L})/gui, 'SAUDI ARABIA'],
  [/(?<!\p{L})A RAP XE UT(?!\p{L})/gui, 'SAUDI ARABIA'],
  [/(?<!\p{L})HOA KỲ(?!\p{L})/gui, 'USA'],
  [/(?<!\p{L})HOA KY(?!\p{L})/gui, 'USA'],
  [/(?<!\p{L})BALOMPI[EÉ](?!\p{L})/gui, ''],
  // Single-word Vietnamese country names with strict letter boundaries
  [/(?<!\p{L})ANH(?!\p{L})/gui, 'ENGLAND'],
  [/(?<!\p{L})PHÁP(?!\p{L})/gui, 'FRANCE'],
  [/(?<!\p{L})PHAP(?!\p{L})/gui, 'FRANCE'],
  [/(?<!\p{L})ĐỨC(?!\p{L})/gui, 'GERMANY'],
  [/(?<!\p{L})DUC(?!\p{L})/gui, 'GERMANY'],
  [/(?<!\p{L})Ý(?!\p{L})/gui, 'ITALY'],
  [/(?<!\p{L})BỈ(?!\p{L})/gui, 'BELGIUM'],
  [/(?<!\p{L})BI(?!\p{L})/gui, 'BELGIUM'],
  [/(?<!\p{L})ÁO(?!\p{L})/gui, 'AUSTRIA'],
  [/(?<!\p{L})NGA(?!\p{L})/gui, 'RUSSIA'],
  [/(?<!\p{L})ÚC(?!\p{L})/gui, 'AUSTRALIA'],
  [/(?<!\p{L})MỸ(?!\p{L})/gui, 'USA']
];

export function normalizeMatchTitle(rawTitle) {
  if (!rawTitle) return '';
  let title = rawTitle.trim();

  // Extract server suffix if present (e.g. [SERVER 1 - SD] or [SERVER 1])
  const serverSuffixMatch = title.match(/(\s*\[SERVER\s*[^\]]+\])$/i);
  let serverSuffix = '';
  if (serverSuffixMatch) {
    serverSuffix = serverSuffixMatch[1];
    title = title.substring(0, serverSuffixMatch.index).trim();
  }

  // Apply Vietnamese dictionary translations
  for (const [pattern, replacement] of VIETNAMESE_DICTIONARY) {
    title = title.replace(pattern, replacement);
  }

  // Clean redundant whitespace
  title = title.replace(/\s+/g, ' ').trim().toUpperCase();

  return (title + serverSuffix).trim().toUpperCase();
}

export function normalizePreservedChannel(channel) {
  let title = channel.title || '';
  if (!title.includes(' VS ') && channel.streamUrl && channel.streamUrl.includes('/truc-tiep/')) {
    const slugMatch = channel.streamUrl.match(/\/truc-tiep\/([^/?#]+)/);
    if (slugMatch) {
      let slug = slugMatch[1]
        .replace(/-luc-.*$/i, '')
        .replace(/-\d{1,2}-\d{1,2}-\d{4}.*$/i, '')
        .replace(/-\d{4}-\d{2}-\d{2}.*$/i, '')
        .replace(/-[a-z0-9]{15,}$/i, '')
        .replace(/^(cau-lac-bo-bong-da|clb|fc)-/i, '')
        .replace(/-vs-(cau-lac-bo-bong-da|clb|fc)-/i, '-vs-')
        .replace(/-balompie/i, '');
      const parts = slug.split('-vs-');
      if (parts.length === 2) {
        const t1 = parts[0].replace(/-/g, ' ').trim().toUpperCase();
        const t2 = parts[1].replace(/-/g, ' ').trim().toUpperCase();
        title = `${t1} VS ${t2} [SERVER 1 - ${channel.title}]`;
      }
    }
  }
  return normalizeMatchTitle(title);
}

