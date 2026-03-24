const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

// 국가 코드 → 위경도 + 국가명 (MusicBrainz 기준)
const COUNTRY_COORDS = {
  US: { lat: 37.09,  lng: -95.71,  name: 'United States' },
  GB: { lat: 51.51,  lng: -0.13,   name: 'United Kingdom' },
  XE: { lat: 51.51,  lng: -0.13,   name: 'England' },        // MusicBrainz England 코드
  XW: { lat: 51.48,  lng: -3.17,   name: 'Wales' },
  XS: { lat: 55.86,  lng: -4.25,   name: 'Scotland' },
  KR: { lat: 37.57,  lng: 126.98,  name: 'South Korea' },
  JP: { lat: 35.69,  lng: 139.69,  name: 'Japan' },
  CA: { lat: 45.42,  lng: -75.69,  name: 'Canada' },
  AU: { lat: -33.87, lng: 151.21,  name: 'Australia' },
  FR: { lat: 48.86,  lng: 2.35,    name: 'France' },
  DE: { lat: 52.52,  lng: 13.40,   name: 'Germany' },
  SE: { lat: 59.33,  lng: 18.07,   name: 'Sweden' },
  NO: { lat: 59.91,  lng: 10.75,   name: 'Norway' },
  DK: { lat: 55.68,  lng: 12.57,   name: 'Denmark' },
  NL: { lat: 52.37,  lng: 4.90,    name: 'Netherlands' },
  IT: { lat: 41.90,  lng: 12.50,   name: 'Italy' },
  ES: { lat: 40.42,  lng: -3.70,   name: 'Spain' },
  BR: { lat: -15.78, lng: -47.93,  name: 'Brazil' },
  MX: { lat: 19.43,  lng: -99.13,  name: 'Mexico' },
  AR: { lat: -34.60, lng: -58.38,  name: 'Argentina' },
  CL: { lat: -33.46, lng: -70.65,  name: 'Chile' },
  CO: { lat: 4.71,   lng: -74.07,  name: 'Colombia' },
  VE: { lat: 10.49,  lng: -66.88,  name: 'Venezuela' },
  PE: { lat: -12.05, lng: -77.04,  name: 'Peru' },
  NG: { lat: 6.45,   lng: 3.40,    name: 'Nigeria' },
  GH: { lat: 5.56,   lng: -0.20,   name: 'Ghana' },
  ZA: { lat: -26.20, lng: 28.04,   name: 'South Africa' },
  ET: { lat: 9.03,   lng: 38.74,   name: 'Ethiopia' },
  SN: { lat: 14.69,  lng: -17.45,  name: 'Senegal' },
  CI: { lat: 5.35,   lng: -4.00,   name: 'Ivory Coast' },
  CM: { lat: 3.87,   lng: 11.52,   name: 'Cameroon' },
  IN: { lat: 28.61,  lng: 77.21,   name: 'India' },
  CN: { lat: 39.91,  lng: 116.39,  name: 'China' },
  TW: { lat: 25.04,  lng: 121.56,  name: 'Taiwan' },
  HK: { lat: 22.30,  lng: 114.18,  name: 'Hong Kong' },
  SG: { lat: 1.35,   lng: 103.82,  name: 'Singapore' },
  MY: { lat: 3.15,   lng: 101.69,  name: 'Malaysia' },
  PH: { lat: 14.60,  lng: 120.98,  name: 'Philippines' },
  ID: { lat: -6.21,  lng: 106.85,  name: 'Indonesia' },
  TH: { lat: 13.75,  lng: 100.52,  name: 'Thailand' },
  VN: { lat: 21.03,  lng: 105.85,  name: 'Vietnam' },
  NZ: { lat: -36.87, lng: 174.77,  name: 'New Zealand' },
  IE: { lat: 53.33,  lng: -6.25,   name: 'Ireland' },
  PT: { lat: 38.72,  lng: -9.14,   name: 'Portugal' },
  RU: { lat: 55.75,  lng: 37.62,   name: 'Russia' },
  PL: { lat: 52.23,  lng: 21.01,   name: 'Poland' },
  CZ: { lat: 50.09,  lng: 14.42,   name: 'Czech Republic' },
  AT: { lat: 48.21,  lng: 16.37,   name: 'Austria' },
  CH: { lat: 47.38,  lng: 8.54,    name: 'Switzerland' },
  BE: { lat: 50.85,  lng: 4.35,    name: 'Belgium' },
  FI: { lat: 60.17,  lng: 24.94,   name: 'Finland' },
  IS: { lat: 64.14,  lng: -21.89,  name: 'Iceland' },
  UA: { lat: 50.45,  lng: 30.52,   name: 'Ukraine' },
  GR: { lat: 37.98,  lng: 23.73,   name: 'Greece' },
  HU: { lat: 47.50,  lng: 19.04,   name: 'Hungary' },
  RO: { lat: 44.43,  lng: 26.10,   name: 'Romania' },
  HR: { lat: 45.81,  lng: 15.98,   name: 'Croatia' },
  SK: { lat: 48.15,  lng: 17.11,   name: 'Slovakia' },
  RS: { lat: 44.80,  lng: 20.46,   name: 'Serbia' },
  TR: { lat: 39.93,  lng: 32.86,   name: 'Turkey' },
  IL: { lat: 31.77,  lng: 35.22,   name: 'Israel' },
  LB: { lat: 33.89,  lng: 35.50,   name: 'Lebanon' },
  JM: { lat: 17.99,  lng: -76.79,  name: 'Jamaica' },
  TT: { lat: 10.65,  lng: -61.52,  name: 'Trinidad and Tobago' },
  PR: { lat: 18.47,  lng: -66.11,  name: 'Puerto Rico' },
  CU: { lat: 23.13,  lng: -82.38,  name: 'Cuba' },
};

// 국가 코드 → 대륙
const CONTINENT_MAP = {
  US: 'N.AMERICA', CA: 'N.AMERICA', MX: 'N.AMERICA', CU: 'N.AMERICA', JM: 'N.AMERICA', TT: 'N.AMERICA', PR: 'N.AMERICA',
  BR: 'S.AMERICA', AR: 'S.AMERICA', CL: 'S.AMERICA', CO: 'S.AMERICA', VE: 'S.AMERICA', PE: 'S.AMERICA',
  GB: 'EUROPE', XE: 'EUROPE', XW: 'EUROPE', XS: 'EUROPE',
  FR: 'EUROPE', DE: 'EUROPE', SE: 'EUROPE', NO: 'EUROPE', DK: 'EUROPE', NL: 'EUROPE',
  IT: 'EUROPE', ES: 'EUROPE', IE: 'EUROPE', PT: 'EUROPE', RU: 'EUROPE', PL: 'EUROPE',
  CZ: 'EUROPE', AT: 'EUROPE', CH: 'EUROPE', BE: 'EUROPE', FI: 'EUROPE', IS: 'EUROPE',
  UA: 'EUROPE', GR: 'EUROPE', HU: 'EUROPE', RO: 'EUROPE', HR: 'EUROPE', SK: 'EUROPE', RS: 'EUROPE',
  TR: 'EUROPE', IL: 'ASIA', LB: 'ASIA',
  KR: 'ASIA', JP: 'ASIA', CN: 'ASIA', TW: 'ASIA', HK: 'ASIA', SG: 'ASIA',
  MY: 'ASIA', PH: 'ASIA', ID: 'ASIA', TH: 'ASIA', VN: 'ASIA', IN: 'ASIA',
  NG: 'AFRICA', GH: 'AFRICA', ZA: 'AFRICA', ET: 'AFRICA', SN: 'AFRICA', CI: 'AFRICA', CM: 'AFRICA',
  AU: 'OCEANIA', NZ: 'OCEANIA',
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchMusicBrainz(artistName) {
  const encoded = encodeURIComponent(artistName);
  const url = `https://musicbrainz.org/ws/2/artist/?query=${encoded}&fmt=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MyMusicSave/0.3 (contact: mymusicsave@example.com)' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const artist = data.artists?.[0];
    if (!artist) return null;
    return {
      mb_id: artist.id,
      country: artist.country || null,
      area: artist.area?.name || null,
      begin_area: artist['begin-area']?.name || null,
    };
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // album_counts는 프론트에서 미리 계산해서 넘겨줌 (함수 내 DB 조회 최소화)
  const { spotify_id, artist_names, album_counts = {} } = body;
  if (!spotify_id || !Array.isArray(artist_names)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing spotify_id or artist_names' }) };
  }

  // 유저 ID 조회
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?spotify_id=eq.${spotify_id}&select=id`,
    { headers: { 'apikey': SUPABASE_SECRET_KEY, 'Authorization': 'Bearer ' + SUPABASE_SECRET_KEY } }
  );
  const users = await userRes.json();
  if (!users.length) {
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  }
  const userId = users[0].id;

  let synced = 0, failed = 0;
  const rows = [];

  // MusicBrainz 순차 조회 (rate limit: 1req/sec)
  for (const name of artist_names) {
    const mb = await fetchMusicBrainz(name);
    await sleep(1100);

    if (!mb || !mb.country) { failed++; continue; }
    const coords = COUNTRY_COORDS[mb.country];
    if (!coords) { failed++; continue; }

    rows.push({
      user_id: userId,
      name,
      country: mb.country,
      country_name: coords.name,
      continent: CONTINENT_MAP[mb.country] || 'OTHER',
      city: mb.begin_area || mb.area || null,
      lat: coords.lat,
      lng: coords.lng,
      album_count: album_counts[name] || 1,
      mb_id: mb.mb_id,
    });
    synced++;
  }

  // Supabase artists 테이블 upsert
  if (rows.length) {
    const upsertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/artists?on_conflict=user_id,name`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SECRET_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SECRET_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(rows),
      }
    );
    if (!upsertRes.ok) {
      const errText = await upsertRes.text();
      console.error('Supabase upsert error:', upsertRes.status, errText);
    }
  }

  console.log(`geocode: synced=${synced} failed=${failed} total=${artist_names.length}`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ synced, failed, total: artist_names.length }),
  };
};
