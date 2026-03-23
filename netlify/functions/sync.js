// Spotify 보관함 전체 가져와서 Supabase에 저장
const GENRE_MAP = [
  [['rap', 'hip hop', 'hip-hop', 'trap', 'drill', 'k-rap', 'korean hip hop'], 'hip-hop'],
  [['r&b', 'soul', 'neo soul', 'rhythm and blues', 'k-r&b', 'korean r&b'], 'rnb'],
  [['k-pop', 'k pop', 'korean pop', 'korean idol'], 'kpop'],
  [['pop'], 'pop'],
  [['rock', 'indie rock', 'alternative rock', 'punk', 'grunge', 'metal'], 'rock'],
  [['indie', 'alternative', 'folk', 'k-indie', 'korean indie'], 'alternative'],
  [['jazz', 'bebop', 'fusion', 'bossa nova', 'swing'], 'jazz'],
  [['electronic', 'edm', 'house', 'techno', 'ambient', 'synth', 'dance'], 'electronic'],
  [['classical', 'piano', 'orchestra', 'chamber', 'baroque'], 'classical'],
  [['funk', 'disco', 'groove'], 'soul'],
];

function classifyGenre(tags) {
  const joined = tags.join(' ').toLowerCase();
  for (const [keywords, genre] of GENRE_MAP) {
    if (keywords.some(k => joined.includes(k))) return genre;
  }
  return 'other';
}

// Last.fm으로 아티스트 태그 조회
async function getArtistGenreMap(artistNames) {
  const genreMap = {};
  const unique = [...new Set(artistNames)].filter(Boolean);
  const apiKey = process.env.LASTFM_API_KEY;

  // 전부 동시에 병렬 요청
  await Promise.all(unique.map(async (name) => {
    try {
      const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(name)}&api_key=${apiKey}&format=json&autocorrect=1`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const tags = (data.toptags?.tag || []).slice(0, 5).map(t => t.name);
      genreMap[name] = tags;
    } catch (e) {
      console.log('[sync] Last.fm 예외:', name, e.message);
    }
  }));
  return genreMap;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '잘못된 요청입니다' }) };
  }

  const { access_token, spotify_id } = body;
  if (!access_token || !spotify_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'access_token과 spotify_id가 필요합니다' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  // 1. Supabase에서 user_id 가져오기
  const userRes = await fetch(
    `${supabaseUrl}/rest/v1/users?spotify_id=eq.${spotify_id}&select=id`,
    { headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey } }
  );
  const users = await userRes.json();
  if (!users.length) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: '유저를 찾을 수 없습니다' }) };
  }
  const userId = users[0].id;

  // 2. Spotify 보관함 전체 페이지네이션으로 가져오기
  const allItems = [];
  let url = 'https://api.spotify.com/v1/me/albums?limit=50';

  while (url) {
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    if (!res.ok) {
      const err = await res.json();
      return { statusCode: 400, headers, body: JSON.stringify({ error: err.error?.message || 'Spotify 조회 실패' }) };
    }
    const data = await res.json();
    allItems.push(...data.items);
    url = data.next || null;
  }

  // 3. 아티스트 이름으로 Last.fm 장르 조회
  const artistNames = allItems.map(item => item.album.artists?.[0]?.name).filter(Boolean);
  const genreMap = await getArtistGenreMap(artistNames);

  // 4. 저장용 배열 구성
  const toUpsert = allItems.map(item => {
    const album = item.album;
    const artistName = album.artists?.[0]?.name || '';
    const tags = genreMap[artistName] || [];
    return {
      user_id: userId,
      spotify_album_id: album.id,
      title: album.name,
      artist: artistName,
      genre: classifyGenre(tags),
      year: parseInt(album.release_date?.slice(0, 4)) || null,
      cover_url: album.images?.[0]?.url || null,
      added_at: item.added_at,
      synced_at: new Date().toISOString()
    };
  });

  // 5. Supabase에 upsert (50개씩)
  const chunkSize = 50;
  for (let i = 0; i < toUpsert.length; i += chunkSize) {
    const chunk = toUpsert.slice(i, i + chunkSize);
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/albums?on_conflict=user_id,spotify_album_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(chunk)
    });
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ count: toUpsert.length })
  };
};
