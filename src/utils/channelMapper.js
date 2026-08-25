export const mapJsonToChannels = (jsonChannels) => {
  if (!jsonChannels || !Array.isArray(jsonChannels)) return [];
  
  return jsonChannels.map(ch => ({
    id: ch.id,
    name: ch.title || `${ch.home} vs ${ch.away}`,
    logo: ch.logo || null,
    group: ch.category || 'General',
    url: ch.streamUrl,
    status: ch.status || 'live', // Default to live if not specified
    source: ch.source || 'internal',
    startTime: ch.startTime || null
  }));
};