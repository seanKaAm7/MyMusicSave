// ── UTILS ──────────────────────────────
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}


function navigate(path) {
  location.href = path;
}


// detect which page we're on
const PAGE = (() => {
  const p = location.pathname;
  if (p.includes('genre.html')) return 'genre';
  if (p.includes('album.html')) return 'album';
  if (p.includes('year.html')) return 'year';
  if (p.includes('artist.html')) return 'artist';
  return 'index';
})();

// base path for cross-page links
function basePath() {
  const p = location.pathname;
  const dir = p.substring(0, p.lastIndexOf('/') + 1);
  return dir;
}

function albumUrl(id) { return `${basePath()}album.html?id=${id}`; }
function genreUrl(id) { return `${basePath()}genre.html?genre=${id}`; }
function yearUrl(year) { return `${basePath()}year.html?year=${year}`; }
function artistUrl(artistId) { return `${basePath()}artist.html?id=${artistId}`; }
function indexUrl() { return `${basePath()}index.html`; }

function getAlbumsByGenre(genreId) {
  return ALBUMS.filter(a => a.genre === genreId);
}
function getAlbumsByYear(year) {
  return ALBUMS.filter(a => a.year === parseInt(year, 10));
}
function getAlbumsByArtistName(artistName) {
  return ALBUMS.filter(a => a.artist === artistName);
}
function getAlbumById(id) {
  return ALBUMS.find(a => a.id === id);
}
function getGenreById(id) {
  return GENRES.find(g => g.id === id);
}
function getArtistById(id) {
  return ARTISTS.find(a => a.id === id);
}
function countByGenre(genreId) {
  return ALBUMS.filter(a => a.genre === genreId).length;
}

// 아티스트 이름 → slug 변환
function artistNameToId(name) {
  return name.toLowerCase()
    .replace(/[,\.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

// ── RENDER HELPERS ───q───────────────────
function renderHeader(opts = {}) {
  const header = document.getElementById('site-header');
  if (!header) return;
  const { showBack = false, backLabel = '홈으로', backHref = indexUrl() } = opts;

  header.innerHTML = ` 
    <a class="site-logo" href="${indexUrl()}">ARCHIVE<span>.</span></a>
    <nav class="site-nav">
      ${showBack ? `<button class="back-btn" onclick="navigate('${backHref}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        ${backLabel}
      </button>` : ''}
      <a onclick="navigate('${indexUrl()}')">장르</a>
    </nav>
  `;
}

// Spotify 캐시에서 커버 URL 읽기 (동기)
function getSpotifyCoverFromCache(album) {
  try {
    const key = 'archive_spotify_' + (album.spotifyAlbumId || album.id);
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.cachedAt < 86400000) return parsed.data.imageUrl || null;
    }
  } catch (_) {}
  return null;
}

// 앨범 카드 HTML 렌더 (공통)
function renderAlbumCard(a) {
  const artistId = artistNameToId(a.artist);
  const cachedCover = !a.coverImage ? getSpotifyCoverFromCache(a) : null;
  const imgSrc = a.coverImage || cachedCover;
  const needsLazyLoad = !imgSrc && (a.spotifyAlbumId || a.tracks.length === 0);
  return `
    <div class="album-card" data-card-id="${a.id}" onclick="navigate('${albumUrl(a.id)}')">
      <div class="album-card-art">
        <div class="album-card-art-inner" style="background:${a.coverGradient}">
          ${imgSrc
      ? `<img src="${imgSrc}" alt="${a.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`
      : `<span>${a.title.split(' ').slice(0, 2).join(' ')}</span>`
    }
          <div class="album-card-play">
            <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
      </div>
      <div class="album-card-meta">
        <div class="album-card-year" onclick="event.stopPropagation(); navigate('${yearUrl(a.year)}')">${a.year}</div>
        <div class="album-card-title">${a.title}</div>
        <div class="album-card-artist" onclick="event.stopPropagation(); navigate('${artistUrl(artistId)}')" style="cursor:pointer;border-bottom:1px solid transparent;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#888'" onmouseout="this.style.borderColor='transparent'">${a.artist}</div>
      </div>
    </div>`;
}

// 카드 목록에서 커버 없는 앨범 Spotify 커버 비동기 보강
async function enrichCardCovers(albums) {
  for (const a of albums) {
    if (a.coverImage) continue;
    const needsEnrich = a.spotifyAlbumId || a.tracks.length === 0;
    if (!needsEnrich) continue;

    const cached = getSpotifyCoverFromCache(a);
    if (cached) {
      _applyCardCover(a.id, cached);
      continue;
    }

    try {
      const albumId = a.spotifyAlbumId;
      const url = albumId
        ? `/.netlify/functions/spotify?id=${encodeURIComponent(albumId)}`
        : `/.netlify/functions/spotify?title=${encodeURIComponent(a.title)}&artist=${encodeURIComponent(a.artist)}&year=${a.year}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const result = await res.json();
      if (!result.ok || !result.album.imageUrl) continue;
      try {
        const cacheKey = 'archive_spotify_' + (albumId || a.id);
        localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), data: result.album }));
      } catch (_) {}
      _applyCardCover(a.id, result.album.imageUrl);
    } catch (_) {}
  }
}

function _applyCardCover(albumId, imageUrl) {
  // 앨범 카드 (장르/연도/아티스트 페이지)
  const card = document.querySelector(`[data-card-id="${albumId}"] .album-card-art-inner`);
  if (card) {
    const span = card.querySelector('span');
    if (span) span.remove();
    if (!card.querySelector('img')) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
      card.insertBefore(img, card.firstChild);
    }
  }

  // 앨범 로우 (인덱스 페이지)
  const row = document.querySelector(`.album-row[onclick*="${albumId}"] .album-row-cover`);
  if (row && !row.querySelector('img')) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '';
    row.appendChild(img);
  }
}

// ── INDEX PAGE ──────────────────────────
let _activeGenreId = null;

function initIndex() {
  renderHeader();

  const grid = document.getElementById('genre-grid');
  const content = document.getElementById('index-content');
  if (!grid || !content) return;

  // 소개 카드 + 장르 카드
  const introCard = `
    <div class="genre-card index-intro-card" onclick="showArchiveIntro()">
      <div class="card-bg" style="background:linear-gradient(135deg,#0a0a0a,#1c1c1c)"></div>
      <div class="card-overlay">
        <span class="card-name" style="color:#666">ARCHIVE.</span>
        <span class="card-count">사이트 소개</span>
      </div>
    </div>`;

  grid.innerHTML = introCard + GENRES.map(g => {
    const count = countByGenre(g.id);
    return `
      <div class="genre-card" data-genre="${g.id}" onclick="selectGenre('${g.id}')" style="--card-color:${g.color}">
        <div class="card-bg" style="background:${g.bg}"></div>
        <div class="card-overlay">
          <span class="card-name" style="color:${g.color}">${g.name}</span>
          <span class="card-count">${count} albums</span>
        </div>
      </div>`;
  }).join('');

  // 첫 장르 기본 선택
  selectGenre(GENRES[0].id);
}

function showArchiveIntro() {
  qsa('[data-genre]').forEach(el => el.classList.remove('active'));
  qsa('.index-intro-card').forEach(el => el.classList.add('active'));

  document.documentElement.style.setProperty('--accent-dynamic', '#888');

  const content = document.getElementById('index-content');
  if (!content) return;

  const total = ALBUMS.length;
  const artistCount = [...new Set(ALBUMS.map(a => a.artist))].length;
  const genreCount = GENRES.length;

  content.innerHTML = `
    <div class="intro-panel">
      <div class="intro-header">
        <div class="intro-logo">ARCHIVE.</div>
        <div class="intro-tagline">음악을 기억하는 방식</div>
      </div>
      <p class="intro-desc">
        ARCHIVE는 앨범 단위로 음악을 기록하는 아카이브입니다.
        스트리밍 플랫폼의 알고리즘이 아닌, 장르와 시대의 맥락 속에서
        앨범을 탐색하고 이해하는 공간을 만들고자 했습니다.
      </p>
      <p class="intro-desc">
        각 앨범 페이지에는 트랙리스트, 참여진, 발매 배경, 시대적 의미가 담겨 있습니다.
        Hip-Hop부터 Classical까지, 장르의 경계를 넘나들며
        당신이 아직 만나지 못한 음악을 발견할 수 있습니다.
      </p>
      <div class="intro-stats">
        <div class="intro-stat">
          <div class="intro-stat-value">${total}</div>
          <div class="intro-stat-label">Albums</div>
        </div>
        <div class="intro-stat">
          <div class="intro-stat-value">${artistCount}</div>
          <div class="intro-stat-label">Artists</div>
        </div>
        <div class="intro-stat">
          <div class="intro-stat-value">${genreCount}</div>
          <div class="intro-stat-label">Genres</div>
        </div>
      </div>
      <div class="intro-note">
        Spotify API 연동으로 커버 이미지, 트랙리스트, 발매 정보가 자동으로 보강됩니다.
        앨범을 클릭하면 더 자세한 정보를 확인할 수 있습니다.
      </div>
    </div>`;
}

function selectGenre(genreId) {
  _activeGenreId = genreId;
  const genre = getGenreById(genreId);
  if (!genre) return;

  // 카드 활성 상태
  qsa('[data-genre]').forEach(el => {
    el.classList.toggle('active', el.dataset.genre === genreId);
  });

  document.documentElement.style.setProperty('--accent-dynamic', genre.color);

  const albums = getAlbumsByGenre(genreId);
  const content = document.getElementById('index-content');
  if (!content) return;

  content.innerHTML = `
    <div class="index-genre-header">
      <span class="index-genre-name" style="color:${genre.color}">${genre.name}</span>
      <span class="index-genre-total">${albums.length} albums</span>
    </div>
    <div class="album-list">
      ${albums.map(a => {
        const cachedCover = getSpotifyCoverFromCache(a);
        const imgSrc = a.coverImage || cachedCover;
        return `
          <div class="album-row" onclick="navigate('${albumUrl(a.id)}')">
            <div class="album-row-cover" style="background:${a.coverGradient}">
              ${imgSrc ? `<img src="${imgSrc}" alt="${a.title}">` : ''}
            </div>
            <div class="album-row-info">
              <div class="album-row-title">${a.title}</div>
              <div class="album-row-meta">${a.artist} · ${a.year}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  enrichCardCovers(albums);
}

// ── GENRE PAGE ──────────────────────────
function initGenre() {
  const genreId = getParam('genre');
  const genre = getGenreById(genreId);
  if (!genre) {
    document.body.innerHTML = '<div class="empty-state" style="padding-top:120px"><h2>장르를 찾을 수 없습니다</h2></div>';
    return;
  }

  document.documentElement.style.setProperty('--accent-dynamic', genre.color);
  renderHeader({ showBack: true, backLabel: '홈으로', backHref: indexUrl() });

  const albums = getAlbumsByGenre(genreId);

  const hero = document.getElementById('genre-hero');
  if (hero) {
    hero.innerHTML = `
      <div class="genre-hero-label">장르</div>
      <div class="genre-hero-title" style="color:${genre.color}">${genre.name}</div>
      <div class="genre-stats">
        <div class="genre-stat-item">
          <span class="genre-stat-value">${albums.length}</span>
          <span class="genre-stat-label">Albums</span>
        </div>
        <div class="genre-stat-item">
          <span class="genre-stat-value">${[...new Set(albums.map(a => a.artist))].length}</span>
          <span class="genre-stat-label">Artists</span>
        </div>
        <div class="genre-stat-item">
          <span class="genre-stat-value">${albums.reduce((s, a) => s + a.tracks.length, 0)}</span>
          <span class="genre-stat-label">Tracks</span>
        </div>
      </div>`;
  }

  const grid = document.getElementById('album-grid');
  if (!grid) return;

  if (albums.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h2>앨범 없음</h2><p>이 장르에 등록된 앨범이 없습니다.</p></div>';
    return;
  }

  grid.innerHTML = albums.map(a => renderAlbumCard(a)).join('');
  enrichCardCovers(albums);
}

// ── YEAR PAGE ──────────────────────────
function initYear() {
  const year = getParam('year');
  if (!year) {
    document.body.innerHTML = '<div class="empty-state" style="padding-top:120px"><h2>연도를 찾을 수 없습니다</h2></div>';
    return;
  }

  renderHeader({ showBack: true, backLabel: '홈으로', backHref: indexUrl() });
  document.title = `${year}년 앨범 | ARCHIVE`;

  const albums = getAlbumsByYear(year);

  const hero = document.getElementById('year-hero');
  if (hero) {
    hero.innerHTML = `
      <div class="genre-hero-label">발매 연도</div>
      <div class="genre-hero-title" style="color:#fff">${year}</div>
      <div class="genre-stats">
        <div class="genre-stat-item">
          <span class="genre-stat-value">${albums.length}</span>
          <span class="genre-stat-label">Albums</span>
        </div>
        <div class="genre-stat-item">
          <span class="genre-stat-value">${[...new Set(albums.map(a => a.artist))].length}</span>
          <span class="genre-stat-label">Artists</span>
        </div>
        <div class="genre-stat-item">
          <span class="genre-stat-value">${albums.reduce((s, a) => s + a.tracks.length, 0)}</span>
          <span class="genre-stat-label">Tracks</span>
        </div>
      </div>`;
  }

  const grid = document.getElementById('album-grid');
  if (!grid) return;

  if (albums.length === 0) {
    grid.innerHTML = `<div class="empty-state"><h2>${year}년에 등록된 앨범이 없습니다</h2></div>`;
    return;
  }

  grid.innerHTML = albums.map(a => renderAlbumCard(a)).join('');
  enrichCardCovers(albums);
}

// ── ARTIST PAGE ──────────────────────────
function initArtist() {
  const artistId = getParam('id');
  const artist = getArtistById(artistId);

  if (!artist) {
    document.body.innerHTML = `<div class="empty-state" style="padding-top:120px">
      <h2>아티스트를 찾을 수 없습니다</h2>
      <p>올바른 아티스트 ID를 확인하세요.</p></div>`;
    return;
  }

  document.title = `${artist.name} | ARCHIVE`;
  document.documentElement.style.setProperty('--accent-dynamic', artist.accentColor);

  renderHeader({ showBack: true, backLabel: '홈으로', backHref: indexUrl() });

  const albums = getAlbumsByArtistName(artist.name);

  const hero = document.getElementById('artist-hero');
  if (hero) {
    hero.innerHTML = `
      <div class="artist-hero-inner">
        <div class="artist-photo-wrap">
          <img class="artist-photo" src="${artist.photo}" alt="${artist.name}" onerror="this.style.display='none'">
        </div>
        <div class="artist-info">
          <div class="genre-hero-label">아티스트</div>
          <h1 class="artist-name" style="color:${artist.accentColor}">${artist.name}</h1>
          <div class="artist-meta-row">
            <span class="artist-meta-item">
              <span class="artist-meta-label">출신</span>
              <span class="artist-meta-value">${artist.origin}</span>
            </span>
            <span class="artist-meta-item">
              <span class="artist-meta-label">활동 시작</span>
              <span class="artist-meta-value">${artist.activeFrom}</span>
            </span>
            <span class="artist-meta-item">
              <span class="artist-meta-label">장르</span>
              <span class="artist-meta-value">${artist.genres.map(g => {
      const genre = getGenreById(g);
      return genre ? `<a onclick="navigate('${genreUrl(g)}')" style="cursor:pointer;border-bottom:1px solid ${artist.accentColor}40;color:inherit;transition:border-color 0.2s;" onmouseover="this.style.borderColor='${artist.accentColor}'" onmouseout="this.style.borderColor='${artist.accentColor}40'">${genre.name}</a>` : g;
    }).join(', ')}</span>
            </span>
            <span class="artist-meta-item">
              <span class="artist-meta-label">앨범 수</span>
              <span class="artist-meta-value">${albums.length}</span>
            </span>
          </div>
          <p class="artist-bio">${artist.bio}</p>
        </div>
      </div>`;
  }

  const label = document.getElementById('artist-albums-label');
  if (label) {
    label.textContent = `${artist.name} — 등록 앨범`;
    label.style.display = albums.length > 0 ? '' : 'none';
  }

  const grid = document.getElementById('album-grid');
  if (!grid) return;

  if (albums.length === 0) {
    grid.innerHTML = `<div class="empty-state"><h2>등록된 앨범이 없습니다</h2></div>`;
    return;
  }

  grid.innerHTML = albums.map(a => renderAlbumCard(a)).join('');
  enrichCardCovers(albums);
}

// ── ALBUM PAGE ──────────────────────────
function initAlbum() {
  const id = getParam('id');
  const album = getAlbumById(id);

  if (!album) {
    document.body.innerHTML = `<div class="empty-state" style="padding-top:120px">
      <h2>앨범을 찾을 수 없습니다</h2>
      <p>올바른 앨범 ID를 확인하세요.</p></div>`;
    return;
  }

  document.title = `${album.title} — ${album.artist} | ARCHIVE`;
  document.documentElement.style.setProperty('--accent-dynamic', album.accentColor);

  const genre = getGenreById(album.genre);
  renderHeader({ showBack: true, backLabel: genre ? genre.name : '뒤로', backHref: genre ? genreUrl(genre.id) : indexUrl() });

  const artistId = artistNameToId(album.artist);

  // POSTER
  const poster = document.getElementById('album-poster');
  if (poster) {
    poster.style.setProperty('--poster-bg', '#111');

    const half = Math.ceil(album.tracks.length / 2);
    const col1 = album.tracks.slice(0, half);
    const col2 = album.tracks.slice(half);

    const trackHtml = (tracks) => tracks.map(t => `
      <div class="poster-track-row" onclick="event.stopPropagation()">
        <span class="poster-track-no">${t.no}.</span>
        <span class="poster-track-title">${t.title}${t.feat.length ? `<span class="poster-track-feat"> ft. ${t.feat.join(', ')}</span>` : ''}</span>
      </div>`).join('');

    poster.innerHTML = `
      <div class="album-poster-deco"></div>
      <div class="poster-top">
        <div class="poster-year" onclick="navigate('${yearUrl(album.year)}')">${album.year}</div>
        <div class="poster-edition">${album.edition}</div>
      </div>
      <div class="poster-title-block">
        <div class="poster-title">${album.title}</div>
      </div>
      <div class="poster-body">
        <div class="poster-art-col">
          <div class="poster-art">
            <div class="poster-art-inner" style="background:${album.coverGradient}">
              ${album.coverImage
        ? `<img data-field="cover-img" src="${album.coverImage}" alt="${album.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:4px;">`
        : `<img data-field="cover-img" src="" alt="${album.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:4px;display:none;"><span class="art-watermark">${album.title.split(' ')[0]}</span>`
      }
            </div>
          </div>
        </div>
        <div class="poster-info-col">
          <div>
            <div class="poster-tracks-header">Track Listing</div>
            <div class="poster-tracks-grid" data-field="tracks-grid">
              <div>${trackHtml(col1)}</div>
              <div>${trackHtml(col2)}</div>
            </div>
          </div>
          <div class="poster-artist-block">
            <div class="poster-artist-label">Artist</div>
            <div class="poster-artist-name" onclick="navigate('${artistUrl(artistId)}')" style="cursor:pointer;border-bottom:1px solid ${album.accentColor}60;display:inline-block;transition:border-color 0.2s;" onmouseover="this.style.borderColor='${album.accentColor}'" onmouseout="this.style.borderColor='${album.accentColor}60'">${album.artist}</div>
            <div class="poster-release-block">
              <div class="poster-release-item">
                <span class="poster-release-label">Out Now</span>
                <span class="poster-release-value" data-field="release-date">${album.releaseDate}</span>
              </div>
              <div class="poster-release-item">
                <span class="poster-release-label">Runtime</span>
                <span class="poster-release-value" data-field="runtime">${album.duration}</span>
              </div>
              <div class="poster-release-item">
                <span class="poster-release-label">Released By</span>
                <span class="poster-release-value link" data-field="label">${album.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="poster-bottom">
        <span class="poster-label-badge" data-field="label-badge">${album.label}</span>
        <span class="poster-duration-badge" data-field="duration-badge">${album.duration}</span>
        <span class="poster-label-badge" data-field="track-count">${album.tracks.length} tracks</span>
        <a data-field="spotify-link" href="" target="_blank" rel="noopener" style="display:none;color:inherit;border-bottom:1px solid #1DB954;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">Spotify</a>
      </div>`;
  }

  // TABS
  const tabNav = document.getElementById('tab-nav');
  const tabPanels = document.getElementById('tab-panels');

  const tabs = [
    { id: 'tracks', label: '트랙 목록' },
    { id: 'credits', label: '참여진' },
    { id: 'concept', label: '컨셉 & 아트' },
    { id: 'era', label: '시대배경' }
  ];

  if (tabNav) {
    tabNav.innerHTML = tabs.map((t, i) =>
      `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="${t.id}" onclick="switchTab(this)">${t.label}</button>`
    ).join('');
  }

  if (tabPanels) {
    const tracksHtml = `
      <div style="max-width:900px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid #2a2a2a">
              <th style="text-align:left;padding:8px 12px;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-weight:400;width:40px">#</th>
              <th style="text-align:left;padding:8px 12px;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-weight:400">제목</th>
              <th style="text-align:left;padding:8px 12px;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-weight:400">피쳐링</th>
              <th style="text-align:right;padding:8px 12px;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-weight:400">시간</th>
            </tr>
          </thead>
          <tbody>
            ${album.tracks.map(t => `
              <tr style="border-bottom:1px solid #1a1a1a;cursor:pointer;transition:background 0.2s"
                  onmouseover="this.style.background='rgba(255,255,255,0.03)'" 
                  onmouseout="this.style.background='transparent'">
                <td style="padding:12px;font-family:'Space Mono',monospace;font-size:0.7rem;color:#555">${t.no}</td>
                <td style="padding:12px;font-size:0.88rem;color:#f0f0f0">${t.title}</td>
                <td style="padding:12px;font-size:0.8rem;color:#888">${t.feat.map(f => `<span style="cursor:pointer;border-bottom:1px solid #333;transition:border-color 0.2s" onmouseover="this.style.borderColor='#888'" onmouseout="this.style.borderColor='#333'">${f}</span>`).join(', ')}</td>
                <td style="padding:12px;font-family:'Space Mono',monospace;font-size:0.72rem;color:#555;text-align:right">${t.duration}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    const cr = album.credits || {};
    const creditsHtml = album.credits
      ? `<div class="credits-grid">
        ${[
        { title: '프로듀서', list: cr.producers },
        { title: '피쳐링', list: cr.featuring },
        { title: '엔지니어', list: cr.engineers },
        { title: '아트 디렉션', list: cr.artDirection || [] },
        { title: '사진', list: cr.photography || [] }
      ].filter(g => g.list && g.list.length).map(g => `
          <div>
            <div class="credits-group-title">${g.title}</div>
            <ul class="credits-list">
              ${g.list.map(n => `<li>${n}</li>`).join('')}
            </ul>
          </div>`).join('')}
        </div>`
      : `<div class="text-content"><p style="color:#555">참여진 정보 준비 중입니다.</p></div>`;

    const conceptHtml = `
      <div class="text-content">
        <h3>컨셉 & 아트워크</h3>
        <p>${album.concept}</p>
      </div>`;

    const eraHtml = `
      <div class="text-content">
        <h3>시대배경</h3> 
        <p>${album.era}</p>
      </div>`;

    tabPanels.innerHTML = `
      <div id="panel-tracks" class="tab-panel active">${tracksHtml}</div>
      <div id="panel-credits" class="tab-panel">${creditsHtml}</div>
      <div id="panel-concept" class="tab-panel">${conceptHtml}</div>
      <div id="panel-era" class="tab-panel">${eraHtml}</div>`;
  }

  // Spotify 보강 (spotifyAlbumId 있거나, 최소 스키마 앨범인 경우 실행)
  const needsEnrich = album.spotifyAlbumId || album.tracks.length === 0;
  if (needsEnrich) enrichFromSpotify(album);
}

// ── SPOTIFY 보강 ─────────────────────────────────────────
function patchAlbumUI(data) {
  // 커버 이미지
  const coverImg = qs('[data-field="cover-img"]');
  if (coverImg && data.imageUrl) {
    coverImg.src = data.imageUrl;
    coverImg.style.display = '';
    const watermark = coverImg.parentElement.querySelector('.art-watermark');
    if (watermark) watermark.style.display = 'none';
  }

  // 발매일
  const releaseDate = qs('[data-field="release-date"]');
  if (releaseDate && data.releaseDate) releaseDate.textContent = data.releaseDate;

  // 러닝타임
  const runtime = qs('[data-field="runtime"]');
  if (runtime && data.duration) runtime.textContent = data.duration;

  // 레이블
  const label = qs('[data-field="label"]');
  if (label && data.label) label.textContent = data.label;

  const labelBadge = qs('[data-field="label-badge"]');
  if (labelBadge && data.label) labelBadge.textContent = data.label;

  // 러닝타임 배지
  const durationBadge = qs('[data-field="duration-badge"]');
  if (durationBadge && data.duration) durationBadge.textContent = data.duration;

  // 트랙 수 배지
  const trackCount = qs('[data-field="track-count"]');
  if (trackCount && data.totalTracks) trackCount.textContent = data.totalTracks + ' tracks';

  // Spotify 링크
  const spotifyLink = qs('[data-field="spotify-link"]');
  if (spotifyLink && data.spotifyUrl) {
    spotifyLink.href = data.spotifyUrl;
    spotifyLink.style.display = '';
  }

  // 포스터 트랙 그리드 + 트랙 탭 패널 갱신
  if (data.tracks && data.tracks.length > 0) {
    const half = Math.ceil(data.tracks.length / 2);
    const col1 = data.tracks.slice(0, half);
    const col2 = data.tracks.slice(half);

    const trackRowHtml = (tracks) => tracks.map(t => `
      <div class="poster-track-row" onclick="event.stopPropagation()">
        <span class="poster-track-no">${t.no}.</span>
        <span class="poster-track-title">${t.title}${t.feat.length ? `<span class="poster-track-feat"> ft. ${t.feat.join(', ')}</span>` : ''}</span>
      </div>`).join('');

    const tracksGrid = qs('[data-field="tracks-grid"]');
    if (tracksGrid) {
      tracksGrid.innerHTML = `<div>${trackRowHtml(col1)}</div><div>${trackRowHtml(col2)}</div>`;
    }

    const tracksPanel = qs('#panel-tracks');
    if (tracksPanel) {
      tracksPanel.innerHTML = `
        <div style="max-width:900px">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid #2a2a2a">
                <th style="text-align:left;padding:8px 12px;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-weight:400;width:40px">#</th>
                <th style="text-align:left;padding:8px 12px;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-weight:400">제목</th>
                <th style="text-align:left;padding:8px 12px;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-weight:400">피쳐링</th>
                <th style="text-align:right;padding:8px 12px;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-weight:400">시간</th>
              </tr>
            </thead>
            <tbody>
              ${data.tracks.map(t => `
                <tr style="border-bottom:1px solid #1a1a1a;cursor:pointer;transition:background 0.2s"
                    onmouseover="this.style.background='rgba(255,255,255,0.03)'"
                    onmouseout="this.style.background='transparent'">
                  <td style="padding:12px;font-family:'Space Mono',monospace;font-size:0.7rem;color:#555">${t.no}</td>
                  <td style="padding:12px;font-size:0.88rem;color:#f0f0f0">${t.title}</td>
                  <td style="padding:12px;font-size:0.8rem;color:#888">${t.feat.map(f => `<span style="cursor:pointer;border-bottom:1px solid #333;transition:border-color 0.2s" onmouseover="this.style.borderColor='#888'" onmouseout="this.style.borderColor='#333'">${f}</span>`).join(', ')}</td>
                  <td style="padding:12px;font-family:'Space Mono',monospace;font-size:0.72rem;color:#555;text-align:right">${t.duration}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }
  }
}

async function enrichFromSpotify(album) {
  const albumId = album.spotifyAlbumId;
  const cacheKey = 'archive_spotify_' + (albumId || album.id);

  // 캐시 확인 (24시간 TTL)
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.cachedAt < 86400000) {
        patchAlbumUI(parsed.data);
        return;
      }
    }
  } catch (_) {}

  // API 호출
  try {
    let url;
    if (albumId) {
      url = `/.netlify/functions/spotify?id=${encodeURIComponent(albumId)}`;
    } else {
      url = `/.netlify/functions/spotify?title=${encodeURIComponent(album.title)}&artist=${encodeURIComponent(album.artist)}&year=${album.year}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return;

    const result = await res.json();
    if (!result.ok) return;

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), data: result.album }));
    } catch (_) {}

    patchAlbumUI(result.album);
  } catch (err) {
    console.error('[Spotify 보강 실패]', err);
  }
}

function switchTab(btn) {
  qsa('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  qsa('.tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + btn.dataset.tab);
  if (panel) panel.classList.add('active');
}

// ── BOOT ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (PAGE === 'index') initIndex();
  else if (PAGE === 'genre') initGenre();
  else if (PAGE === 'album') initAlbum();
  else if (PAGE === 'year') initYear();
  else if (PAGE === 'artist') initArtist();
});

