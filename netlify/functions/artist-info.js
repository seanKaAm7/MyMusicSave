// artist-info — Netlify Function
// Spotify (사진, 장르) + MusicBrainz (출신, 활동 시작) + Wikipedia (한국어 바이오) + Last.fm (스크로블, Top Tracks, Similar)

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
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=5&market=KR`,
      { headers: { 'Authorization': 'Bearer ' + token } }
    );
    if (!res.ok) return { status: res.status, data: null };
    const data = await res.json();
    const items = data.artists?.items || [];
    const nameLower = name.toLowerCase();
    const artist = items.find(a => a.name.toLowerCase() === nameLower) || items[0];
    if (!artist) return { status: 200, data: null };
    return {
      status: 200,
      data: {
        id: artist.id,
        photo: artist.images?.[0]?.url || null,
        genres: artist.genres || [],
        spotify_url: artist.external_urls?.spotify || null,
      }
    };
  } catch { return { status: 500, data: null }; }
}

// ── MusicBrainz: 출신 + 활동 시작 ───────────────────────
async function getMusicBrainzInfo(name) {
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(name)}&limit=3&fmt=json`,
      { headers: { 'User-Agent': 'MyMusicSave/1.0 (mymusicsave@noreply.com)' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const artists = data.artists || [];
    // 이름이 정확히 일치하는 아티스트 우선
    const nameLower = name.toLowerCase();
    const artist = artists.find(a => a.name?.toLowerCase() === nameLower) || artists[0];
    if (!artist) return null;
    const beginYear = artist['life-span']?.begin
      ? artist['life-span'].begin.slice(0, 4)
      : null;
    // 출신: begin-area (시작 지역) 또는 area (활동 지역)
    const origin = artist['begin-area']?.name || artist.area?.name || null;
    return { origin, activeFrom: beginYear };
  } catch { return null; }
}

// ── DeepL 번역 ───────────────────────────────────────────
async function translateToKorean(text) {
  const key = process.env.DEEPL_API_KEY;
  if (!key || !text) return null;
  try {
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `DeepL-Auth-Key ${key}` },
      body: JSON.stringify({ text: [text], target_lang: 'KO', source_lang: 'EN' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.translations?.[0]?.text || null;
  } catch { return null; }
}

// ── Wikipedia 바이오 (한국어 우선, 없으면 영어→DeepL 번역) ─
async function getWikipediaBio(name) {
  try {
    // 1. 영어 Wikipedia에서 한국어 링크 찾기
    const wikiSearchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=langlinks&lllang=ko&format=json&origin=*`
    );
    if (wikiSearchRes.ok) {
      const wikiData = await wikiSearchRes.json();
      const pages = Object.values(wikiData.query?.pages || {});
      const koTitle = pages[0]?.langlinks?.[0]?.['*'];
      if (koTitle) {
        const koRes = await fetch(
          `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(koTitle)}`
        );
        if (koRes.ok) {
          const koData = await koRes.json();
          const extract = (koData.extract || '').trim();
          if (extract.length > 200) return extract.slice(0, 800);
        }
      }
    }
    // 2. 영어 Wikipedia → DeepL 번역
    const enRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    );
    if (!enRes.ok) return null;
    const enData = await enRes.json();
    const enText = (enData.extract || '').trim();
    if (enText.length < 50) return null;

    const translated = await translateToKorean(enText.slice(0, 800));
    return translated || enText.slice(0, 800);
  } catch { return null; }
}

// ── Last.fm 스크로블 수 ───────────────────────────────────
async function getLastFmPlaycount(name, username) {
  if (!username) return null;
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(name)}&api_key=${LASTFM_KEY}&autocorrect=1&username=${encodeURIComponent(username)}&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const count = parseInt(data.artist?.stats?.userplaycount || '0', 10);
    return count > 0 ? count : null;
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

  // Spotify 토큰 갱신 처리
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

  // 나머지 병렬 처리
  const [mbInfo, wikiBio, lfmPlaycount, lfmTracks, similarNames] = await Promise.all([
    getMusicBrainzInfo(name),
    getWikipediaBio(name),
    getLastFmPlaycount(name, lastfm || null),
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
      musicbrainz: mbInfo || null,
      bio: wikiBio || null,
      playcount: lfmPlaycount,
      topTracks: lfmTracks,
      similar,
      new_token: newToken,
    }),
  };
};
