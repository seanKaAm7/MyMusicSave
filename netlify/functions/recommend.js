// 추천 앨범 — Netlify Function
// 흐름: Spotify Top Artists → Last.fm 비슷한 아티스트 → Spotify 검색 → 보관함 필터링

const LASTFM_KEY = process.env.LASTFM_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

// ── 1. Spotify Top Artists 조회 ─────────────────────────
async function getTopArtists(accessToken) {
  const res = await fetch(
    'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term',
    { headers: { 'Authorization': 'Bearer ' + accessToken } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map(a => a.name);
}

// ── 2. Last.fm 비슷한 아티스트 조회 ────────────────────
async function getSimilarArtists(artistName) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json&limit=6&autocorrect=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.similarartists?.artist || []).map(a => a.name);
  } catch {
    return [];
  }
}

// ── 3. Spotify 아티스트 앨범 검색 ──────────────────────
async function searchArtistAlbum(artistName, accessToken) {
  try {
    const q = encodeURIComponent(`artist:${artistName}`);
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=album&limit=10&market=KR`,
      { headers: { 'Authorization': 'Bearer ' + accessToken } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.albums?.items || [];

    // 정규 앨범만, 가장 최근 것 선택 (이름 포함 여부로 완화 매칭)
    const nameLower = artistName.toLowerCase();
    const albums = items
      .filter(a => {
        if (a.album_type !== 'album') return false;
        const an = (a.artists[0]?.name || '').toLowerCase();
        return an === nameLower || an.includes(nameLower) || nameLower.includes(an);
      })
      .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));

    if (!albums.length) return null;
    const pick = albums[0];
    return {
      spotify_album_id: pick.id,
      title: pick.name,
      artist: pick.artists[0]?.name || artistName,
      cover_url: pick.images?.[0]?.url || null,
      year: parseInt(pick.release_date?.slice(0, 4)) || null,
      spotify_url: pick.external_urls?.spotify || null,
    };
  } catch {
    return null;
  }
}

// ── 4. 내 보관함 앨범 ID 목록 조회 ─────────────────────
async function getMyAlbumIds(userId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/albums?user_id=eq.${userId}&select=spotify_album_id`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return new Set();
  const rows = await res.json();
  return new Set(rows.map(r => r.spotify_album_id));
}

// ── 핸들러 ─────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '잘못된 요청' }) };
  }

  const { access_token, spotify_id } = body;
  if (!access_token || !spotify_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'access_token, spotify_id 필요' }) };
  }

  try {
    // 유저 ID 조회
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?spotify_id=eq.${spotify_id}&select=id`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    const users = await userRes.json();
    if (!users.length) return { statusCode: 404, headers, body: JSON.stringify({ error: '유저 없음' }) };
    const userId = users[0].id;

    // 1. Top Artists (Spotify 스트리밍 기록 기반)
    let topArtists = await getTopArtists(access_token);

    // 폴백: 스트리밍 기록 없으면 보관함에서 가장 많은 아티스트 사용
    if (!topArtists.length) {
      const libRes = await fetch(
        `${SUPABASE_URL}/rest/v1/albums?user_id=eq.${userId}&select=artist`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
      );
      const libAlbums = await libRes.json();
      const counts = {};
      libAlbums.forEach(a => { if (a.artist) counts[a.artist] = (counts[a.artist] || 0) + 1; });
      topArtists = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);
    }

    if (!topArtists.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, recommendations: [] }) };
    }

    // 2. 비슷한 아티스트 수집 (상위 5명만 Last.fm 조회)
    const similarSets = await Promise.all(topArtists.slice(0, 5).map(getSimilarArtists));
    const topSet = new Set(topArtists.map(n => n.toLowerCase()));

    // 중복 제거 + 이미 Top Artists인 건 제외
    const candidates = [];
    const seen = new Set();
    for (const list of similarSets) {
      for (const name of list) {
        const key = name.toLowerCase();
        if (!seen.has(key) && !topSet.has(key)) {
          seen.add(key);
          candidates.push(name);
        }
      }
    }

    // 3. 내 보관함 ID 목록
    const myAlbumIds = await getMyAlbumIds(userId);

    // 4. 후보 아티스트 앨범 검색 (최대 30명, 병렬)
    const results = await Promise.all(
      candidates.slice(0, 30).map(name => searchArtistAlbum(name, access_token))
    );

    // 5. null 제거 + 보관함에 없는 것만 + 최대 20개
    const recommendations = results
      .filter(r => r && !myAlbumIds.has(r.spotify_album_id))
      .slice(0, 20);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, recommendations, basedOn: topArtists.slice(0, 5) })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
