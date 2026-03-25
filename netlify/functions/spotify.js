// Spotify API 브릿지 — Netlify Function
// 호출: /.netlify/functions/spotify?id={albumId}
//       /.netlify/functions/spotify?title={title}&artist={artist}&year={year}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// 토큰 모듈 스코프 캐싱 (인스턴스 재사용 시 유효)
let cachedToken = null;
let tokenExpiresAt = 0;

// ── 토큰 발급 ──────────────────────────────────────────
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) throw new Error(`토큰 발급 실패: ${res.status}`);

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

// ── 응답 데이터 정규화 ──────────────────────────────────
function formatReleaseDate(dateStr) {
  // "2004-02-10" → "February 10, 2004"
  // "2004-02" 또는 "2004" 형식도 대응
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (parts.length === 2) {
    const d = new Date(`${dateStr}-01T00:00:00`);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
  return parts[0]; // 연도만 있는 경우
}

function formatDuration(totalMs) {
  // 밀리초 → "74:24"
  const totalSec = Math.floor(totalMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatTrackDuration(ms) {
  // 트랙 단위 밀리초 → "3:26"
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function normalizeName(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildAlbumResponse(raw) {
  const mainArtist = raw.artists[0]?.name || '';
  let totalMs = 0;

  const tracks = (raw.tracks?.items || []).map(t => {
    totalMs += t.duration_ms;
    const feat = t.artists
      .filter(a => a.name !== mainArtist)
      .map(a => a.name);
    return {
      no: t.track_number,
      title: t.name,
      duration: formatTrackDuration(t.duration_ms),
      feat,
      spotify_url: t.external_urls?.spotify || null
    };
  });

  return {
    spotifyAlbumId: raw.id,
    title: raw.name,
    artist: mainArtist,
    imageUrl: raw.images?.[0]?.url || null,
    releaseDate: formatReleaseDate(raw.release_date),
    spotifyUrl: raw.external_urls?.spotify || null,
    duration: formatDuration(totalMs),
    label: raw.label || '',
    totalTracks: raw.total_tracks,
    tracks
  };
}

// ── ID 기반 조회 ────────────────────────────────────────
async function fetchById(albumId, token) {
  const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return null;
  return buildAlbumResponse(await res.json());
}

// ── 검색 기반 조회 (fallback) ───────────────────────────
async function fetchBySearch(title, artist, year, token) {
  const query = encodeURIComponent(`album:${title} artist:${artist}`);
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=album&limit=10`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const items = data.albums?.items || [];

  // 매칭 규칙 적용
  const AVOID_KEYWORDS = ['deluxe', 'remaster', 'remastered', 'live', 'anniversary', 'expanded', 'edition'];

  for (const item of items) {
    if (item.album_type !== 'album') continue;

    const itemTitle = normalizeName(item.name);
    const targetTitle = normalizeName(title);
    if (!itemTitle.includes(targetTitle) && !targetTitle.includes(itemTitle)) continue;

    const itemArtist = normalizeName(item.artists[0]?.name || '');
    const targetArtist = normalizeName(artist);
    if (!itemArtist.includes(targetArtist) && !targetArtist.includes(itemArtist)) continue;

    const itemYear = parseInt(item.release_date?.split('-')[0], 10);
    if (year && Math.abs(itemYear - parseInt(year, 10)) > 1) continue;

    const titleLower = item.name.toLowerCase();
    if (AVOID_KEYWORDS.some(kw => titleLower.includes(kw))) continue;

    // 조건 통과 — 풀 데이터 조회
    const full = await fetchById(item.id, token);
    return full;
  }

  return null;
}

// ── 핸들러 ─────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'env_not_set' })
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const token = await getAccessToken();
    let album = null;

    if (params.id) {
      album = await fetchById(params.id, token);
    } else if (params.title && params.artist) {
      album = await fetchBySearch(params.title, params.artist, params.year, token);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: 'missing_params' })
      };
    }

    if (!album) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: false, error: 'no_match' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, album })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
