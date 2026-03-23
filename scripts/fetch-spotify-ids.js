// Spotify Album ID 일괄 조회 스크립트
// 실행: node scripts/fetch-spotify-ids.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const ALBUMS_TO_FIND = [
  { id: 'mbdtf',                  title: 'My Beautiful Dark Twisted Fantasy', artist: 'Kanye West',              year: 2010 },
  { id: 'good-kid-maad-city',     title: 'good kid, m.A.A.d city',            artist: 'Kendrick Lamar',          year: 2012 },
  { id: 'channel-orange',         title: 'channel ORANGE',                    artist: 'Frank Ocean',             year: 2012 },
  { id: 'ctrl',                   title: 'Ctrl',                              artist: 'SZA',                     year: 2017 },
  { id: '1989',                   title: '1989',                              artist: 'Taylor Swift',            year: 2014 },
  { id: 'future-nostalgia',       title: 'Future Nostalgia',                  artist: 'Dua Lipa',                year: 2020 },
  { id: 'abbey-road',             title: 'Abbey Road',                        artist: 'The Beatles',             year: 1969 },
  { id: 'nevermind',              title: 'Nevermind',                         artist: 'Nirvana',                 year: 1991 },
  { id: 'dark-side-of-the-moon',  title: 'The Dark Side of the Moon',         artist: 'Pink Floyd',              year: 1973 },
  { id: 'a-love-supreme',         title: 'A Love Supreme',                    artist: 'John Coltrane',           year: 1965 },
  { id: 'time-out',               title: 'Time Out',                          artist: 'The Dave Brubeck Quartet',year: 1959 },
  { id: 'discovery',              title: 'Discovery',                         artist: 'Daft Punk',               year: 2001 },
  { id: 'in-colour',              title: 'In Colour',                         artist: 'Jamie xx',                year: 2015 },
  { id: 'newjeans-ep',            title: 'New Jeans',                         artist: 'NewJeans',                year: 2022 },
  { id: 'omg',                    title: 'OMG',                               artist: 'NewJeans',                year: 2023 },
  { id: 'how-sweet',              title: 'How Sweet',                         artist: 'NewJeans',                year: 2024 },
  { id: 'supernatural-newjeans',  title: 'Supernatural',                      artist: 'NewJeans',                year: 2024 },
  { id: 'in-rainbows',            title: 'In Rainbows',                       artist: 'Radiohead',               year: 2007 },
  { id: 'currents',               title: 'Currents',                          artist: 'Tame Impala',             year: 2015 },
  { id: 'songs-in-the-key-of-life', title: 'Songs in the Key of Life',        artist: 'Stevie Wonder',           year: 1976 },
  { id: 'goldberg-variations',    title: 'Goldberg Variations',               artist: 'Glenn Gould',             year: 1981 },
];

async function getToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function searchAlbum(token, album) {
  const q = encodeURIComponent(`${album.title} ${album.artist}`);
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=album&limit=10`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const data = await res.json();
  const items = data.albums?.items || [];

  const AVOID = ['deluxe', 'remaster', 'remastered', 'live', 'anniversary', 'expanded'];

  for (const item of items) {
    if (item.album_type !== 'album') continue;

    const titleLower = item.name.toLowerCase();
    if (AVOID.some(k => titleLower.includes(k))) continue;

    const normItem = normalize(item.name);
    const normTarget = normalize(album.title);
    const titleMatch = normItem.includes(normTarget) || normTarget.includes(normItem);
    if (!titleMatch) continue;

    const normArtist = normalize(item.artists[0]?.name || '');
    const normTargetArtist = normalize(album.artist);
    const artistMatch = normArtist.includes(normTargetArtist) || normTargetArtist.includes(normArtist);
    if (!artistMatch) continue;

    const itemYear = parseInt(item.release_date?.split('-')[0], 10);
    if (Math.abs(itemYear - album.year) > 2) continue;

    return item.id;
  }
  return null;
}

async function main() {
  const token = await getToken();
  console.log('토큰 발급 완료\n');

  const results = {};

  for (const album of ALBUMS_TO_FIND) {
    const id = await searchAlbum(token, album);
    if (id) {
      results[album.id] = id;
      console.log(`✓ ${album.title} → ${id}`);
    } else {
      results[album.id] = null;
      console.log(`✗ ${album.title} → 미발견`);
    }
    await new Promise(r => setTimeout(r, 200)); // rate limit 방지
  }

  console.log('\n\n=== data.js에 붙여넣을 결과 ===\n');
  for (const [albumId, spotifyId] of Object.entries(results)) {
    if (spotifyId) {
      console.log(`  "${albumId}": "${spotifyId}",`);
    }
  }
}

main().catch(console.error);
