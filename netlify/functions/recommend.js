// 추천 — Netlify Function
// Last.fm 청취 기록 → 유사 아티스트 발견 → Spotify 인기곡 조회
// 참고: Spotify /v1/recommendations는 Development Mode 차단, 배치 아티스트 조회는 2026.02 삭제됨

const LASTFM_KEY = process.env.LASTFM_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

const GENRE_MAP = [
  [['k-pop', 'k pop', 'kpop', 'korean pop', 'korean idol'], 'K-POP'],
  [['rap', 'hip hop', 'hip-hop', 'trap', 'drill', 'k-rap', 'korean hip hop'], 'HIP-HOP'],
  [['r&b', 'rnb', 'soul', 'neo soul', 'rhythm and blues', 'k-r&b'], 'R&B'],
  [['rock', 'indie rock', 'alternative rock', 'punk', 'grunge', 'metal'], 'ROCK'],
  [['indie', 'alternative', 'folk', 'k-indie'], 'ALTERNATIVE'],
  [['jazz', 'bebop', 'fusion', 'bossa nova'], 'JAZZ'],
  [['electronic', 'edm', 'house', 'techno', 'ambient', 'synth', 'dance'], 'ELECTRONIC'],
  [['classical', 'orchestra', 'chamber'], 'CLASSICAL'],
  [['funk', 'disco', 'groove'], 'SOUL'],
  [['soundtrack', 'ost', 'score'], 'SOUNDTRACK'],
  [['pop'], 'POP'],
];

function classifyGenre(genres) {
  const joined = (genres || []).join(' ').toLowerCase();
  for (const [keywords, genre] of GENRE_MAP) {
    if (keywords.some(k => joined.includes(k))) return genre;
  }
  return null;
}

// ── 시드 아티스트 ────────────────────────────────────────

async function getLastFmTopArtists(username) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getTopArtists&user=${encodeURIComponent(username)}&api_key=${LASTFM_KEY}&format=json&limit=10&period=6month`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.topartists?.artist || []).map(a => a.name);
  } catch { return []; }
}

// ── Spotify 아티스트 이름 → ID 변환 ─────────────────────

async function resolveSpotifyArtistIds(artistNames, accessToken) {
  const results = await Promise.all(
    artistNames.slice(0, 15).map(async (name) => {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1&market=KR`,
          { headers: { 'Authorization': 'Bearer ' + accessToken } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.artists?.items?.[0]?.id || null;
      } catch { return null; }
    })
  );
  return results.filter(Boolean);
}

// ── Last.fm similar + Spotify 인기곡 ──────────────────────

async function getLastFmSimilarArtists(artistName) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json&limit=12&autocorrect=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.similarartists?.artist || []).map(a => a.name);
  } catch { return []; }
}

async function getArtistTopTracks(artistId, accessToken) {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=KR`,
      { headers: { 'Authorization': 'Bearer ' + accessToken } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.tracks || [];
  } catch { return []; }
}

async function getFallbackTracks(seedNames, accessToken) {
  // 시드 6개를 랜덤 선택해 다양성 확보
  const shuffled = [...seedNames].sort(() => Math.random() - 0.5).slice(0, 6);
  const similarLists = await Promise.all(shuffled.map(getLastFmSimilarArtists));
  const seedSet = new Set(seedNames.map(n => n.toLowerCase()));

  const candidates = [];
  const seen = new Set();
  for (const list of similarLists) {
    for (const name of list) {
      const key = name.toLowerCase();
      if (!seen.has(key) && !seedSet.has(key)) {
        seen.add(key);
        candidates.push(name);
      }
    }
  }
  candidates.sort(() => Math.random() - 0.5);

  // 후보 25명 → Spotify ID 변환 (최대 15명)
  const artistIds = await resolveSpotifyArtistIds(candidates.slice(0, 25), accessToken);

  // 최대 15명 인기곡 병렬 조회
  const trackLists = await Promise.all(
    artistIds.slice(0, 15).map(id => getArtistTopTracks(id, accessToken))
  );

  return trackLists.flat();
}

// ── 아티스트 정보 조회 (개별 호출 — 배치 엔드포인트 2026.02 삭제됨) ─

async function getArtistInfo(artistId, accessToken) {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      { headers: { 'Authorization': 'Bearer ' + accessToken } }
    );
    if (!res.ok) return null;
    const a = await res.json();
    return {
      image_url: a.images?.[0]?.url || null,
      genres: a.genres || [],
      spotify_url: a.external_urls?.spotify || null,
    };
  } catch { return null; }
}

async function getArtistsInfo(artistIds, accessToken) {
  if (!artistIds.length) return {};
  const uniqueIds = [...new Set(artistIds)].slice(0, 15);
  const results = await Promise.all(
    uniqueIds.map(async id => {
      const info = await getArtistInfo(id, accessToken);
      return [id, info];
    })
  );
  const map = {};
  results.forEach(([id, info]) => { if (info) map[id] = info; });
  return map;
}

// ── 보관함 앨범 ID ────────────────────────────────────────

async function getMyAlbumIds(userId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/albums?user_id=eq.${userId}&select=spotify_album_id`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) return new Set();
  const rows = await res.json();
  return new Set(rows.map(r => r.spotify_album_id));
}

// ── 트랙 목록 → 앨범/아티스트/트랙 분리 ─────────────────

function extractResults(tracks, myAlbumIds, artistInfoMap) {
  const seenAlbumIds = new Set();
  const seenArtistIds = new Set();
  const seenTrackIds = new Set();
  const recommendations = [];
  const artistRecs = [];
  const trackRecs = [];
  const artistAlbumCount = {};
  const artistTrackCount = {};

  for (const track of tracks) {
    const albumId = track.album?.id;
    const artistId = track.artists?.[0]?.id;
    const artistName = track.artists?.[0]?.name || '';
    const artistInfo = artistInfoMap[artistId] || {};
    const genre = classifyGenre(artistInfo.genres);

    // 앨범: 보관함 제외 + 아티스트당 1개 제한
    if (albumId && !seenAlbumIds.has(albumId) && !myAlbumIds.has(albumId) && recommendations.length < 20) {
      if (!artistAlbumCount[artistId]) {
        seenAlbumIds.add(albumId);
        artistAlbumCount[artistId] = 1;
        recommendations.push({
          spotify_album_id: albumId,
          title: track.album.name,
          artist: artistName,
          cover_url: track.album.images?.[0]?.url || null,
          year: parseInt(track.album.release_date?.slice(0, 4)) || null,
          spotify_url: track.album.external_urls?.spotify || null,
          genre,
          description: null,
        });
      }
    }

    // 아티스트: 중복 제외
    if (artistId && !seenArtistIds.has(artistId) && artistRecs.length < 20) {
      seenArtistIds.add(artistId);
      artistRecs.push({
        spotify_artist_id: artistId,
        name: artistName,
        image_url: artistInfo.image_url || null,
        spotify_url: artistInfo.spotify_url || null,
        genre,
      });
    }

    // 트랙: 보관함 앨범 제외 + 아티스트당 2개 제한
    if (!seenTrackIds.has(track.id) && !myAlbumIds.has(albumId) && trackRecs.length < 20) {
      if ((artistTrackCount[artistId] || 0) < 2) {
        seenTrackIds.add(track.id);
        artistTrackCount[artistId] = (artistTrackCount[artistId] || 0) + 1;
        trackRecs.push({
          spotify_track_id: track.id,
          title: track.name,
          artist: artistName,
          cover_url: track.album?.images?.[0]?.url || null,
          album: track.album?.name || null,
          duration_ms: track.duration_ms || 0,
          spotify_url: track.external_urls?.spotify || null,
        });
      }
    }

    if (recommendations.length >= 20 && artistRecs.length >= 20 && trackRecs.length >= 20) break;
  }

  return { recommendations, artistRecs, trackRecs };
}

// ── 핸들러 ───────────────────────────────────────────────

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

  const { access_token, spotify_id, lastfm_username } = body;
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

    // 시드 아티스트: Last.fm → 보관함 폴백
    let seedNames = lastfm_username ? await getLastFmTopArtists(lastfm_username) : [];

    if (!seedNames.length) {
      const libRes = await fetch(
        `${SUPABASE_URL}/rest/v1/albums?user_id=eq.${userId}&select=artist`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
      );
      const libAlbums = await libRes.json();
      const counts = {};
      libAlbums.forEach(a => { if (a.artist) counts[a.artist] = (counts[a.artist] || 0) + 1; });
      seedNames = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);
    }

    if (!seedNames.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, recommendations: [], artists: [], tracks: [] }) };
    }

    // 보관함 앨범 ID + 트랙 수집 병렬
    const [myAlbumIds, recTracks] = await Promise.all([
      getMyAlbumIds(userId),
      getFallbackTracks(seedNames, access_token)
    ]);

    if (!recTracks.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, recommendations: [], artists: [], tracks: [] }) };
    }

    // 아티스트 정보 (개별 조회 — 배치 API 삭제됨)
    const artistIds = [...new Set(recTracks.map(t => t.artists?.[0]?.id).filter(Boolean))];
    const artistInfoMap = await getArtistsInfo(artistIds, access_token);

    const { recommendations, artistRecs, trackRecs } = extractResults(recTracks, myAlbumIds, artistInfoMap);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, recommendations, artists: artistRecs, tracks: trackRecs })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
