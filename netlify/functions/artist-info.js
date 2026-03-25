// artist-info — Netlify Function
// 아티스트 정보 조회: Spotify (사진, 장르, 팔로워) + Last.fm (바이오, 스크로블, Top Tracks, Similar)

const LASTFM_KEY = process.env.LASTFM_API_KEY;

// ── Spotify 토큰 갱신 ─────────────────────────────────────
async function refreshAccessToken(refresh_token) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + basic, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refresh_token)}`,
  });
  const data = await res.json();
  return data.access_token || null;
}

// ── Spotify 아티스트 검색 ────────────────────────────────
async function getSpotifyArtist(name, token) {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1&market=KR`,
      { headers: { 'Authorization': 'Bearer ' + token } }
    );
    if (!res.ok) return { status: res.status, data: null };
    const data = await res.json();
    const artist = data.artists?.items?.[0];
    if (!artist) return { status: 200, data: null };
    return {
      status: 200,
      data: {
        id: artist.id,
        photo: artist.images?.[0]?.url || null,
        genres: artist.genres || [],
        followers: artist.followers?.total || 0,
        popularity: artist.popularity || 0,
        spotify_url: artist.external_urls?.spotify || null,
      }
    };
  } catch { return { status: 500, data: null }; }
}

// ── Last.fm 아티스트 정보 ─────────────────────────────────
async function getLastFmArtistInfo(name, username) {
  try {
    const userParam = username ? `&username=${encodeURIComponent(username)}` : '';
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(name)}&api_key=${LASTFM_KEY}&autocorrect=1${userParam}&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.artist;
    if (!a) return null;
    const bioFull = a.bio?.content || '';
    const bio = bioFull.replace(/<a[^>]*>.*?<\/a>/gi, '').replace(/<[^>]+>/g, '').trim().slice(0, 400);
    return {
      bio: bio || null,
      playcount: parseInt(a.stats?.userplaycount || '0', 10),
      listeners: parseInt(a.stats?.listeners || '0', 10),
    };
  } catch { return null; }
}

// ── Last.fm Top Tracks ────────────────────────────────────
async function getLastFmTopTracks(name, username) {
  try {
    const userParam = username ? `&username=${encodeURIComponent(username)}` : '';
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTracks&artist=${encodeURIComponent(name)}&api_key=${LASTFM_KEY}&autocorrect=1&limit=5${userParam}&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.toptracks?.track || []).slice(0, 5).map(t => ({
      name: t.name,
      playcount: parseInt(t.playcount || '0', 10),
      url: t.url || null,
    }));
  } catch { return []; }
}

// ── Last.fm Similar Artists ───────────────────────────────
async function getLastFmSimilar(name) {
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${encodeURIComponent(name)}&api_key=${LASTFM_KEY}&autocorrect=1&limit=6&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.similarartists?.artist || []).slice(0, 6).map(a => a.name);
  } catch { return []; }
}

// ── Similar Artist 사진 조회 (Spotify) ───────────────────
async function getSimilarPhotos(names, token) {
  const results = await Promise.all(
    names.map(async (name) => {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1&market=KR`,
          { headers: { 'Authorization': 'Bearer ' + token } }
        );
        if (!res.ok) return { name, photo: null };
        const data = await res.json();
        const artist = data.artists?.items?.[0];
        return {
          name,
          photo: artist?.images?.[1]?.url || artist?.images?.[0]?.url || null,
        };
      } catch { return { name, photo: null }; }
    })
  );
  return results;
}

// ── 핸들러 ────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid body' }) };
  }

  const { name, token: accessToken, refresh_token, lastfm } = body;

  if (!name || !accessToken) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'name and token required' }) };
  }

  // Spotify 아티스트 조회 (토큰 만료 시 갱신 후 재시도)
  let token = accessToken;
  let newToken = null;
  let spotifyResult = await getSpotifyArtist(name, token);

  if (spotifyResult.status === 401 && refresh_token) {
    const refreshed = await refreshAccessToken(refresh_token);
    if (refreshed) {
      token = refreshed;
      newToken = refreshed;
      spotifyResult = await getSpotifyArtist(name, token);
    }
  }

  // Last.fm + Similar 병렬
  const [lfmInfo, lfmTracks, similarNames] = await Promise.all([
    getLastFmArtistInfo(name, lastfm || null),
    getLastFmTopTracks(name, lastfm || null),
    getLastFmSimilar(name),
  ]);

  // Similar 사진
  const similar = similarNames.length
    ? await getSimilarPhotos(similarNames, token)
    : [];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      spotify: spotifyResult.data || null,
      lastfm: lfmInfo || null,
      topTracks: lfmTracks,
      similar,
      new_token: newToken,
    }),
  };
};
