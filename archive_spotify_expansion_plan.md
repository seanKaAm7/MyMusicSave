# ARCHIVE Spotify 연동 확장 기획안
**문서 버전:** v2.0
**작성일:** 2026-03-20
**대상 프로젝트:** ARCHIVE (music-archiveweb.netlify.app)
**문서 성격:** 현재 코드베이스를 직접 분석하여 작성한 실무 구현 기획안

---

## 1. 기획 목적

`data.js`에 앨범을 하나 등록하려면 현재 최소 15개 필드를 수기로 작성해야 한다. 이 중 트랙 리스트, 발매일, 러닝타임, 커버 이미지는 Spotify API로 자동 조회 가능하다.

이번 기획의 핵심은 다음 한 문장이다.

> **기존 큐레이션 앨범은 그대로 두고, 새 앨범은 6개 필드만 입력해도 상세 페이지가 Spotify 데이터로 자동 보강되는 구조를 만든다.**

---

## 2. 현재 코드 구조 분석

### 2.1 실질적인 코드 위험 지점

신규 앨범을 최소 스키마로 등록할 경우, 현재 `app.js`에서 즉시 오류가 발생하는 지점이 있다.

**`app.js:432` — credits가 null이면 크래시**
```javascript
// 현재 코드 (크래시 발생)
{ title: '프로듀서', list: album.credits.producers },

// credits: null 이면 TypeError: Cannot read properties of null
```

**`app.js:321` — tracks가 비어 있으면 포스터 트랙 영역이 공백**
```javascript
const half = Math.ceil(album.tracks.length / 2); // 0 → 빈 배열, 오류 없음
```
이 경우는 크래시 없이 빈 영역으로 렌더링된다. Spotify 보강 후 채우면 된다.

**`app.js:163`, `app.js:207` — 장르/연도 페이지의 Tracks 통계**
```javascript
albums.reduce((s, a) => s + a.tracks.length, 0) // 신규 앨범의 경우 0으로 집계됨
```
크래시는 없지만 Tracks 카운트가 실제보다 낮게 표시된다. 허용 가능한 수준이다.

### 2.2 포스터 렌더링 구조

`initAlbum()`이 `#album-poster`에 주입하는 HTML의 핵심 구조는 다음과 같다.

```
#album-poster
  ├─ .poster-top
  │   ├─ .poster-year              ← yearUrl 링크
  │   └─ .poster-edition
  ├─ .poster-title-block
  ├─ .poster-body
  │   ├─ .poster-art-col
  │   │   └─ .poster-art-inner    ← 커버 이미지 위치
  │   └─ .poster-info-col
  │       ├─ .poster-tracks-grid  ← 트랙 리스트 위치
  │       └─ .poster-artist-block
  │           └─ .poster-release-block
  │               ├─ "Out Now" 값  ← 발매일 위치
  │               ├─ "Runtime" 값  ← 러닝타임 위치
  │               └─ "Released By" 값 ← 레이블 위치
  └─ .poster-bottom
      ├─ .poster-label-badge (레이블)
      ├─ .poster-duration-badge (러닝타임)
      └─ .poster-label-badge (트랙 수)
```

탭 패널은 `#tab-panels` 하위에 `#panel-tracks`, `#panel-credits`, `#panel-concept`, `#panel-era`로 이미 ID가 지정되어 있다.

---

## 3. 데이터 전략

### 3.1 신규 앨범 최소 스키마

기존 앨범 객체는 변경하지 않는다. 신규 앨범은 아래 6개 필수 필드만 입력한다.

```javascript
// data.js 신규 앨범 등록 예시 (최소 스키마)
{
  id: "the-college-dropout",           // 필수: 사이트 내 고유 slug
  genre: "hip-hop",                    // 필수: GENRES 배열의 id 값
  title: "The College Dropout",        // 필수
  artist: "Kanye West",                // 필수
  year: 2004,                          // 필수: 정수형
  spotifyAlbumId: "4fzsfWIIGdzfu2iQKkLNYL", // 필수: Spotify 앨범 URL의 마지막 세그먼트

  // 아래는 Spotify 보강 전까지 빈 값 유지
  releaseDate: "",
  label: "",
  duration: "",
  edition: "",
  coverImage: "",
  coverGradient: "linear-gradient(160deg,#111,#222,#333)",
  accentColor: "#ffffff",
  tracks: [],
  credits: null,
  concept: "",
  era: ""
}
```

**`spotifyAlbumId` 확인 방법:** Spotify 앱에서 앨범 우클릭 → Share → Copy Spotify URI → `spotify:album:4fzsfWIIGdzfu2iQKkLNYL`에서 마지막 세그먼트 복사.

### 3.2 data.js의 역할 변화

| 기존 | 변경 후 |
|------|---------|
| 모든 앨범 상세 정보를 담는 단일 DB | 앨범 인덱스 + 큐레이션 앨범의 확장 데이터 저장소 |
| 등록 = 전체 정보 수기 작성 | 등록 = 최소 필드 입력 후 Spotify 보강 |

`concept`, `era`, `credits`는 Spotify가 제공하지 않는 큐레이션 데이터이므로 계속 수동 작성이다. 이것이 이 사이트의 핵심 가치이므로 의도적으로 자동화하지 않는다.

---

## 4. Spotify API 연동 방식

### 4.1 인증 방식

Spotify API는 클라이언트 비밀키가 필요하므로 프론트엔드(`app.js`)에서 직접 호출할 수 없다. Netlify Functions를 브릿지로 사용한다.

**인증 흐름 (Client Credentials Flow):**
```
app.js → /.netlify/functions/spotify?id={albumId}
              ↓
        netlify/functions/spotify.js
              ↓ (서버 측에서만 실행)
        POST https://accounts.spotify.com/api/token
        GET  https://api.spotify.com/v1/albums/{id}
              ↓
        { ok: true, album: { ... } } 반환
```

### 4.2 Netlify Function 파일 구조

```
music-archive/
├─ netlify/
│   └─ functions/
│       └─ spotify.js    ← 신규 생성
├─ netlify.toml           ← 신규 생성 (Functions 경로 지정)
```

**`netlify.toml` 내용:**
```toml
[functions]
  directory = "netlify/functions"
```

### 4.3 netlify/functions/spotify.js 구현 명세

**역할:** access token 발급 → 앨범 데이터 조회 → 프론트엔드용 JSON 반환

**입력 파라미터:**
- `?id={spotifyAlbumId}` — ID 기반 정확 조회 (우선)
- `?title={title}&artist={artist}&year={year}` — 검색 기반 fallback

**Spotify API 호출:**
```
// 토큰 발급
POST https://accounts.spotify.com/api/token
Headers: Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)
Body:     grant_type=client_credentials

// 앨범 조회 (ID 방식)
GET https://api.spotify.com/v1/albums/{id}
Headers: Authorization: Bearer {access_token}

// 앨범 검색 (fallback 방식)
GET https://api.spotify.com/v1/search?q=album:{title}+artist:{artist}&type=album&limit=5
Headers: Authorization: Bearer {access_token}
```

**함수 내 토큰 캐싱:**
Netlify Functions는 동일 인스턴스가 재사용될 수 있으므로, 모듈 스코프 변수로 토큰과 만료 시각을 캐싱한다 (토큰 유효기간: 3600초).

```javascript
// 모듈 스코프 (함수 인스턴스 재사용 시 유지됨)
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }
  // POST 발급 로직
  // cachedToken = 발급된 토큰
  // tokenExpiresAt = Date.now() + expires_in * 1000
}
```

**함수 응답 형식:**
```json
{
  "ok": true,
  "album": {
    "spotifyAlbumId": "4fzsfWIIGdzfu2iQKkLNYL",
    "title": "The College Dropout",
    "artist": "Kanye West",
    "imageUrl": "https://i.scdn.co/image/...",
    "releaseDate": "February 10, 2004",
    "spotifyUrl": "https://open.spotify.com/album/4fzsfWIIGdzfu2iQKkLNYL",
    "duration": "76:10",
    "label": "Roc-A-Fella / Def Jam",
    "totalTracks": 22,
    "tracks": [
      { "no": 1, "title": "We Don't Care", "duration": "3:26", "feat": [] },
      { "no": 2, "title": "Graduation Day", "duration": "1:48", "feat": [] }
    ]
  }
}
```

**실패 응답:**
```json
{ "ok": false, "error": "no_match" }
```

**`releaseDate` 변환:** Spotify는 `"2004-02-10"` 형식으로 반환한다. 사이트 표시 형식인 `"February 10, 2004"`로 변환하여 반환한다.

**`duration` 계산:** 트랙별 `duration_ms`를 합산하여 `"76:10"` 형식으로 변환한다.

**`feat` 추출:** Spotify는 피쳐링을 트랙 `artists[]` 배열로 제공한다. 첫 번째 아티스트(메인 아티스트)를 제외한 나머지를 `feat` 배열로 정리한다.

### 4.4 매칭 규칙 (검색 fallback 시)

무조건 첫 결과를 사용하면 Deluxe Edition, Remaster 등 잘못된 버전이 매칭될 수 있다.
아래 조건을 모두 통과한 결과만 사용한다.

1. `album_type === "album"` (single, compilation 제외)
2. 제목 정규화 비교: 양쪽 모두 소문자 변환 + 특수문자 제거 후 일치 확인
3. 아티스트명 정규화 비교 (대소문자 무시)
4. 연도 차이 1년 이내
5. 제목에 `deluxe`, `remaster`, `live`, `anniversary`, `expanded` 포함 시 제외
6. 위 조건 통과 결과가 0개이면 `{ ok: false, error: "no_match" }` 반환

**원칙: 잘못된 앨범을 보여주는 것보다 로컬 데이터만 보여주는 편이 낫다.**

---

## 5. 프론트엔드 보강 설계

### 5.1 렌더링 순서

```
DOMContentLoaded
  → initAlbum() 로컬 데이터로 포스터 + 탭 전체 렌더링
  → album.spotifyAlbumId 또는 최소 스키마 앨범 여부 확인
  → 조건 충족 시 enrichFromSpotify(album) 비동기 실행
      → /.netlify/functions/spotify 호출
      → 응답 성공 시 patchAlbumUI(data) 실행
      → 실패 시 현재 화면 유지 (사용자에게 오류 표시 없음)
```

### 5.2 data-field 식별자

`initAlbum()`이 생성하는 HTML에 패치 대상 요소를 식별하기 위한 `data-field` 속성을 추가한다. 기존 스타일이나 동작에는 영향 없다.

| data-field 값 | 위치 | 패치 내용 |
|---|---|---|
| `cover-img` | `.poster-art-inner` 내부 `<img>` 또는 컨테이너 | Spotify 커버 이미지 URL로 교체 |
| `release-date` | "Out Now" 옆 `.poster-release-value` | 발매일 텍스트 교체 |
| `runtime` | "Runtime" 옆 `.poster-release-value` | 러닝타임 텍스트 교체 |
| `label` | "Released By" 옆 `.poster-release-value.link` | 레이블 텍스트 교체 |
| `tracks-grid` | `.poster-tracks-grid` | 포스터 트랙 리스트 재렌더링 |
| `track-count` | 하단 `.poster-label-badge` (트랙 수) | `"22 tracks"` 갱신 |
| `duration-badge` | `.poster-duration-badge` | 러닝타임 배지 갱신 |
| `spotify-link` | 포스터 하단 (신규 추가) | Spotify 링크 표시 |

### 5.3 patchAlbumUI 동작 명세

```
patchAlbumUI(spotifyData):
  coverImg = qs('[data-field="cover-img"]')
  if coverImg exists AND spotifyData.imageUrl:
    coverImg.src = spotifyData.imageUrl

  releaseDate = qs('[data-field="release-date"]')
  if releaseDate exists AND spotifyData.releaseDate:
    releaseDate.textContent = spotifyData.releaseDate

  runtime = qs('[data-field="runtime"]')
  if runtime exists AND spotifyData.duration:
    runtime.textContent = spotifyData.duration

  label = qs('[data-field="label"]')
  if label exists AND spotifyData.label:
    label.textContent = spotifyData.label

  tracksGrid = qs('[data-field="tracks-grid"]')
  if tracksGrid exists AND spotifyData.tracks.length > 0:
    tracksGrid.innerHTML = 재렌더링 (기존 trackHtml 함수 재사용)

  trackCount = qs('[data-field="track-count"]')
  if trackCount exists:
    trackCount.textContent = spotifyData.totalTracks + ' tracks'

  durationBadge = qs('[data-field="duration-badge"]')
  if durationBadge exists AND spotifyData.duration:
    durationBadge.textContent = spotifyData.duration

  // #panel-tracks 탭 패널도 함께 갱신 (tracks 있을 때만)
  if spotifyData.tracks.length > 0:
    tracksPanel = qs('#panel-tracks')
    tracksPanel.innerHTML = 트랙 테이블 재렌더링

  // Spotify 링크 추가
  if spotifyData.spotifyUrl:
    spotifyLinkEl = qs('[data-field="spotify-link"]')
    if spotifyLinkEl:
      spotifyLinkEl.href = spotifyData.spotifyUrl
      spotifyLinkEl.style.display = ''
```

모든 패치는 해당 요소가 DOM에 존재하고 데이터가 유효한 경우에만 실행한다. 하나가 실패해도 나머지는 계속 진행한다.

### 5.4 credits null 안전 처리 (버그 수정 필수)

현재 `app.js:432`에서 `album.credits.producers`를 직접 참조하므로, `credits: null`인 신규 앨범이 상세 페이지에 진입하면 크래시가 발생한다. 이 수정은 Spotify 연동 이전에 반드시 선행되어야 한다.

```javascript
// app.js 수정 (initAlbum 내 creditsHtml 생성 부분)
// 변경 전
const creditsHtml = `
  <div class="credits-grid">
    ${[
      { title: '프로듀서', list: album.credits.producers },
      ...

// 변경 후
const credits = album.credits || {};
const creditsHtml = album.credits
  ? `<div class="credits-grid">
      ${[
        { title: '프로듀서', list: credits.producers },
        ...
      ].filter(g => g.list && g.list.length).map(...).join('')}
    </div>`
  : `<div class="text-content"><p>참여진 정보 준비 중입니다.</p></div>`;
```

---

## 6. 캐싱 전략

Netlify Functions 호출은 매 페이지 방문마다 발생하지 않도록 클라이언트 측 캐싱을 적용한다.

**방식:** `localStorage` + TTL (24시간)

**키 구조:** `archive_spotify_{spotifyAlbumId}`

**저장 형식:**
```json
{
  "cachedAt": 1742480000000,
  "data": { ...patchAlbumUI에 전달하는 spotifyData 객체... }
}
```

**enrichFromSpotify 내 캐시 확인 로직:**
```
enrichFromSpotify(album):
  cacheKey = "archive_spotify_" + album.spotifyAlbumId
  cached = localStorage.getItem(cacheKey)

  if cached:
    parsed = JSON.parse(cached)
    if Date.now() - parsed.cachedAt < 86400000 (24시간):
      patchAlbumUI(parsed.data)
      return  // API 호출 없이 종료

  // 캐시 없거나 만료 → API 호출
  response = await fetch("/.netlify/functions/spotify?id=" + album.spotifyAlbumId, {
    signal: AbortSignal.timeout(5000)  // 5초 타임아웃
  })

  if response.ok:
    result = await response.json()
    if result.ok:
      localStorage.setItem(cacheKey, JSON.stringify({
        cachedAt: Date.now(),
        data: result.album
      }))
      patchAlbumUI(result.album)
  // 실패 시 아무 것도 하지 않음 (현재 화면 유지)
```

---

## 7. 환경변수 설정

**Netlify 대시보드:** Site settings → Environment variables에 아래 두 항목 추가.

| 변수명 | 값 |
|--------|-----|
| `SPOTIFY_CLIENT_ID` | Spotify 개발자 대시보드의 Client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify 개발자 대시보드의 Client Secret |

`netlify/functions/spotify.js` 내에서:
```javascript
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
```

---

## 8. 로컬 개발 환경

Netlify Functions는 일반 `python -m http.server`로는 실행되지 않는다. Netlify CLI를 사용한다.

```bash
# 최초 1회 설치
npm install -g netlify-cli

# 프로젝트 루트에서 실행 (Functions 포함 전체 로컬 서버)
netlify dev
# → http://localhost:8888 에서 /.netlify/functions/spotify 포함하여 테스트 가능
```

로컬 실행 시 환경변수는 프로젝트 루트의 `.env` 파일에서 자동으로 읽는다.
```
# .env (git에 커밋하지 않음)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

`.gitignore`에 `.env` 추가 필수.

---

## 9. 파일별 변경 요약

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `data.js` | 수정 | 신규 앨범에 `spotifyAlbumId` 필드 추가. 최소 스키마 허용 |
| `app.js` | 수정 | `initAlbum()`에 `data-field` 속성 추가, credits null 처리, `enrichFromSpotify()` 호출 추가 |
| `netlify/functions/spotify.js` | 신규 | Spotify API 브릿지 |
| `netlify.toml` | 신규 | Functions 디렉토리 경로 지정 |
| `.env` | 신규 | 로컬 환경변수 (git 제외) |
| `styles.css` | 수정 (최소) | Spotify 링크 스타일 추가 |
| `album.html` | 변경 없음 | 현재 컨테이너 구조로 충분 |

---

## 10. 신규 앨범 등록 절차 (구현 완료 후)

```
1. Spotify 앱에서 앨범 우클릭 → Share → Copy Spotify URI
   예: spotify:album:4fzsfWIIGdzfu2iQKkLNYL

2. data.js ALBUMS 배열에 최소 스키마 객체 추가:
   id, genre, title, artist, year, spotifyAlbumId 6개 필드 입력

3. 로컬에서 netlify dev 실행 후 album.html?id={id} 접속

4. 포스터에서 커버, 트랙리스트, 발매일, 러닝타임 자동 보강 확인

5. 큐레이션 텍스트(concept, era)와 credits는 별도로 추가
```

---

## 11. 구현 단계

### 1단계: 사전 안전 작업 (선행 필수)
- `app.js:432` credits null 크래시 수정
- `tracks: []`인 앨범의 포스터 렌더링 검증
- `data.js`에 `spotifyAlbumId` 필드 추가 (기존 앨범에는 optional)

### 2단계: Netlify Functions 구현
- `netlify.toml` 생성
- `netlify/functions/spotify.js` 구현
  - 토큰 발급 + 모듈 스코프 캐싱
  - ID 기반 조회
  - 검색 기반 fallback + 매칭 규칙 적용
  - 응답 형식 정규화 (날짜 변환, duration 계산, feat 추출)
- Netlify 환경변수 설정
- `netlify dev`로 로컬 테스트

### 3단계: 프론트엔드 보강 연결
- `initAlbum()` HTML 생성 시 `data-field` 속성 추가
- `enrichFromSpotify()` 함수 작성 (캐시 확인 포함)
- `patchAlbumUI()` 함수 작성
- 기존 큐레이션 앨범에서 기존 렌더링 깨지지 않는지 확인

### 4단계: 검증 및 배포
- TC-01~TC-07 테스트 항목 전체 통과 확인
- 신규 앨범 3개 이상 최소 스키마로 등록하여 실용성 검증
- Netlify 배포 후 운영 환경에서 재확인

---

## 12. 테스트 항목

| TC | 내용 | 통과 기준 |
|----|------|----------|
| TC-01 | 기존 큐레이션 앨범 렌더링 | 포스터, 4개 탭 모두 기존과 동일하게 표시됨 |
| TC-02 | `spotifyAlbumId` 있는 신규 앨범 | 최소 스키마로 등록 후 커버/트랙/날짜 자동 보강 확인 |
| TC-03 | `spotifyAlbumId` 없는 앨범 | 검색 fallback 작동, 올바른 앨범 매칭 |
| TC-04 | 오매칭 방어 | Deluxe/Remaster 검색 결과 있을 때 fallback 처리 |
| TC-05 | Spotify 응답 실패 | 5초 타임아웃 시 페이지 정상 유지, 콘솔 오류만 출력 |
| TC-06 | 캐시 동작 | 두 번째 방문 시 API 호출 없이 localStorage에서 즉시 보강 |
| TC-07 | 장르/연도/아티스트 페이지 | 신규 앨범 포함 시 카드 렌더링, 통계 표시 정상 |
| TC-08 | credits: null 처리 | 상세 페이지 진입 시 크래시 없이 "준비 중" 메시지 표시 |

---

## 13. 완료 기준

아래 조건을 모두 만족하면 1차 구현 성공으로 본다.

- 기존 큐레이션 앨범 11개가 기존과 동일하게 렌더링된다.
- 신규 앨범을 6개 필드만 입력해도 상세 페이지가 열린다.
- Spotify에서 커버, 발매일, 러닝타임, 트랙리스트가 자동 보강된다.
- Spotify 실패 시 로컬 UI가 유지되며 페이지가 깨지지 않는다.
- 두 번째 방문부터는 localStorage 캐시로 즉시 보강된다.
- 장르/연도/아티스트 페이지가 신규 앨범 포함 시에도 정상 동작한다.
- 앨범 1개 등록에 소요되는 시간이 기존 대비 실질적으로 줄어든다.

---

## 14. 비목표 (이번 구현 범위 외)

아래는 이번 1차 구현에서 다루지 않는다.

- Spotify 미리듣기 / 재생 기능
- 사용자 로그인
- 앨범 자동 검색 UI (제목 입력 → 자동 등록)
- credits, concept, era 자동 생성
- 기존 큐레이션 앨범 일괄 Spotify 전환
- 검색 기능 (별도 기획 필요)
