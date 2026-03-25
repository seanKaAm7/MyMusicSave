# MyMusicSave — 이게 어떻게 동작하는 거야?

> 오늘 만든 것들을 직접 짤 수 있게, 왜 이렇게 작동하는지 설명하는 파일.
> 코드보다 개념을 먼저 이해하면 코드는 자연스럽게 따라온다.

---

## 큰 그림부터

```
너의 브라우저
    ↓ 클릭
Netlify (서버 역할)
    ↓ 요청
Spotify API  /  Supabase (DB)  /  Last.fm API  /  MusicBrainz API  /  Wikipedia  /  DeepL
```

MyMusicSave는 크게 세 덩어리야:

1. **HTML/CSS/JS 파일들** — 화면에 보이는 것 (브라우저에서 실행)
2. **Netlify Functions** — 서버 역할 (브라우저 밖에서 실행)
3. **Supabase** — 데이터 저장소 (DB)

**현재 있는 페이지들:**

| 파일 | 역할 |
|------|------|
| `index.html` | 로그인 화면 |
| `callback.html` | Spotify OAuth 콜백 처리 |
| `dashboard.html` | 메인 대시보드 — 통계, 장르 word-cloud, 연도 차트, 아티스트 TOP10, 앨범 그리드 |
| `library.html` | 전체 앨범 브라우저 — 필터/검색/정렬 |
| `album.html` | 앨범 상세 포스터 — 트랙리스트, 장르 수정 |
| `genre.html` | 장르별 앨범 목록 (?genre=) |
| `year.html` | 연도별 앨범 목록 (?year=), PREV/NEXT 네비게이션 |
| `artist.html` | 아티스트 페이지 — 사진, 상징색, 바이오, 앨범, Top Tracks, Similar |
| `profile.html` | 프로필 + 설정 (Last.fm 연동 등) |
| `map.html` | 뮤직맵 — 아티스트 출신 지역 세계지도 |
| `recommend.html` | 음악 추천 (ALBUMS / ARTISTS / TRACKS 3탭) |

**Netlify Functions (서버):**

| 파일 | 역할 |
|------|------|
| `netlify/functions/auth.js` | Spotify 로그인 토큰 교환 |
| `netlify/functions/sync.js` | Spotify 보관함 → Supabase 동기화 |
| `netlify/functions/artist-info.js` | 아티스트 상세 정보 (4개 외부 API 통합) |
| `netlify/functions/spotify.js` | 앨범 트랙리스트 조회 |
| `netlify/functions/geocode.js` | 아티스트 위치 조회 (MusicBrainz) |
| `netlify/functions/recommend.js` | Last.fm 기반 음악 추천 |

---

## 1. 왜 "서버"가 필요해?

브라우저에서 Spotify API를 직접 부르면 안 될까? 기술적으로는 돼. 근데 문제가 있어.

Spotify API를 쓰려면 **Client Secret** (비밀번호 같은 것)이 필요해.
브라우저에서 직접 쓰면, 소스 코드 열면 누구나 그 비밀번호를 볼 수 있어.

```
❌ 위험한 방식:
브라우저 JS → (Client Secret 포함) → Spotify API
누구나 소스 열면 Client Secret 훔칠 수 있음

✅ 안전한 방식:
브라우저 → Netlify Function → (Client Secret 포함) → Spotify API
Client Secret은 Netlify 서버 안에만 있음
```

그래서 **환경변수**가 있는 거야. `.env` 파일에 넣은 키들은 Netlify 서버에만 존재하고, 브라우저에는 절대 안 나와.

---

## 2. Spotify 로그인은 어떻게 동작해? (OAuth)

OAuth는 "내가 직접 비밀번호 안 받고, Spotify가 대신 인증해주는 방식"이야.

실생활 비유: 클럽 입장할 때 신분증을 클럽에 주는 게 아니라, 경찰서(Spotify)에서 "이 사람 성인입니다" 확인서를 받아오는 것.

```
1. 너가 "Spotify로 로그인" 클릭
       ↓
2. Spotify 로그인 페이지로 이동 (우리 사이트를 벗어남)
       ↓
3. Spotify에서 로그인 + 권한 허용
       ↓
4. Spotify가 callback.html로 돌아옴
   URL에 "code=abc123" 같은 코드를 붙여서 줌
       ↓
5. callback.html이 그 코드를 Netlify auth.js 함수로 전달
       ↓
6. auth.js가 그 코드 + Client Secret으로 Spotify에 요청
   → 실제 access_token + refresh_token을 받아옴
       ↓
7. 두 토큰 모두 브라우저 localStorage에 저장
```

**code** vs **access_token** vs **refresh_token** 차이:
- `code`: 1회용 쿠폰 (Spotify가 줌, 30초 안에 써야 함)
- `access_token`: 실제 입장권 (이걸로 API 호출, **1시간 유효**)
- `refresh_token`: 재발급 티켓 (access_token 만료되면 이걸로 새로 발급, **만료 없음**)

---

## 3. Supabase는 그냥 DB야

복잡하게 생각할 필요 없어. 그냥 **엑셀 파일**인데 인터넷으로 접근할 수 있는 것.

```
users 테이블:
| id | spotify_id | display_name |
|----|------------|--------------|
| 1  | abc123     | SEANKA       |

albums 테이블:
| id | user_id | title        | artist  | genre   | year | cover_url | added_at |
|----|---------|--------------|---------|---------|------|-----------|----------|
| 1  | 1       | Flower Boy   | Tyler   | hip-hop | 2017 | https://  | 2026-... |
```

우리가 Supabase에 요청하는 방법:
```js
// "user_id가 나인 앨범 전부 가져와, 연도 최신순으로"
fetch(`${SUPABASE_URL}/rest/v1/albums?user_id=eq.${userId}&select=*&order=year.desc`)
```

URL 문법:
- `?컬럼=eq.값` → WHERE 컬럼 = 값
- `&order=year.desc` → ORDER BY year DESC
- `method: 'PATCH'` + body → UPDATE
- `Prefer: resolution=merge-duplicates` → upsert

---

## 4. 동기화는 어떻게 동작해? (sync.js)

"동기화" 버튼 누르면 이게 일어나:

```
1. 브라우저 → sync.js 함수 호출
   (access_token, refresh_token, spotify_id 전달)

2. sync.js → Spotify API
   GET /v1/me/albums (50개씩 페이지네이션)

   ⚠️ 중간에 401 에러(토큰 만료) 나면?
   → refresh_token으로 Spotify에 새 access_token 요청
   → 새 토큰으로 요청 재시도

3. 아티스트 목록 추출 → Last.fm API
   "Tyler The Creator의 장르가 뭐야?" → "Hip-Hop"

4. 장르 분류 (GENRE_MAP, 우선순위 순)
   kpop → hip-hop → rnb → rock → alternative → jazz
   → electronic → classical → soul → soundtrack → pop → other

5. 기존 수동 설정 장르 보존 (덮어쓰지 않음)

6. Supabase에 upsert (50개씩)
```

---

## 5. 아티스트 페이지는 어떻게 동작해? (artist.html + artist-info.js)

아티스트 이름 하나로 4개 외부 API를 동시에 호출해.

```
artist.html → artist-info.js POST { name, token, refresh_token, lastfm }
                  ↓ (병렬 처리)
    ┌─────────────────────────────────────────────┐
    │ Spotify search     → 사진, 장르               │
    │ MusicBrainz        → 출신 지역, 활동 시작 연도  │
    │ Wikipedia (한국어)  → 200자 이상이면 사용       │
    │ Wikipedia (영어)   → DeepL로 한국어 번역       │
    │ Last.fm            → 스크로블 수, Top Tracks   │
    │ Last.fm getSimilar → Similar 아티스트 6명     │
    └─────────────────────────────────────────────┘
                  ↓
    Similar 아티스트들 Spotify 사진 조회 (별도 단계)
```

**한국어 바이오 우선순위:**
1. Wikipedia 한국어 (200자 이상인 경우만)
2. Wikipedia 영어 → DeepL Free API로 한국어 번역
3. 아무것도 없으면 바이오 섹션 숨김

**아티스트 상징색 추출 (Canvas API):**
```
1. 사진을 canvas에 80×80으로 그림
2. 모든 픽셀을 RGB → HSL 변환
3. 채도 낮은 픽셀 (s < 25%) 제외 → 무채색 스킵
4. 너무 어둡거나 밝은 픽셀도 제외
5. 남은 픽셀들을 15° 단위 hue 버킷으로 분류
6. 가장 많이 나온 hue → hsl(hue, 80%, 68%) 반환
```

이 색이 아티스트 이름 색상과 바이오 좌측 컬러 바에 적용돼.

---

## 6. 장르 수동 수정은 어떻게 동작해? (album.html)

```
1. album.html에서 장르 텍스트 옆 연필 아이콘 클릭
       ↓
2. 팝업 오버레이 — 12개 장르 버튼 표시
       ↓
3. 원하는 장르 클릭
       ↓
4. Supabase PATCH 요청
       ↓
5. 팝업 닫히고 화면 즉시 반영
```

sync.js는 다음 동기화 때 이 수동 장르를 덮어쓰지 않아. 동기화 전에 기존 장르를 먼저 조회하고, 수동으로 설정된 것은 건너뜀.

---

## 7. library.html은 어떻게 동작해?

Supabase에서 내 앨범 전체를 가져와서 **브라우저 안에서** 필터링/정렬해.

```
1. 페이지 로드 → Supabase에서 전체 앨범 한 번에 가져옴 (allAlbums 배열)

2. 이후 검색/필터/정렬은 전부 JS로 처리 (서버 요청 없음)
   → 빠름
```

---

## 8. 뮤직맵은 어떻게 동작해?

**1단계: 지도 그리기 (Leaflet.js)**
Leaflet은 지도 라이브러리. 타일(지도 이미지 조각)을 CartoDB 서버에서 받아와서 화면에 붙여줘.

**2단계: 아티스트 위치 찾기 (geocode.js + MusicBrainz)**
```
"Tyler The Creator" → MusicBrainz API
  응답: { country: "US", begin-area: "Los Angeles" }
  → Supabase artist_locations 테이블에 저장
```

MusicBrainz는 1req/sec rate limit. 20명씩 나눠서 처리. 한 번 처리된 아티스트는 다음 번에 건너뜀.

**3단계: 마커 표시**
앨범 많을수록 큰 원형 마커. MarkerCluster로 겹치는 마커 묶음 처리.

---

## 9. 토큰 만료가 뭔데?

Spotify access_token은 **1시간**이 지나면 자동으로 무효화. 401 에러 반환.

자동 갱신 흐름:
```
401 에러 발생
    ↓
refresh_token으로 Spotify에 새 access_token 요청
    ↓
새 토큰으로 실패했던 요청 재시도
    ↓
새 토큰을 브라우저에 돌려줌 → localStorage에 저장
```

sync.js, artist-info.js 모두 이 흐름을 구현하고 있어.

---

## 10. 이 프로젝트에서 배울 수 있는 것들

| 개념 | 어디서 쓰임 |
|------|------------|
| OAuth 2.0 | Spotify 로그인 |
| REST API | Supabase, Spotify, Last.fm, MusicBrainz, Wikipedia, DeepL |
| 환경변수 | .env, Netlify 서버 비밀키 |
| async/await | 모든 fetch 호출 |
| Promise.all | artist-info.js 병렬 조회 |
| 페이지네이션 | Spotify 앨범 50개씩 |
| Rate Limiting | MusicBrainz 1req/sec |
| localStorage | 토큰/유저 정보 저장 |
| Canvas API | 이미지에서 dominant color 추출 |
| DOM 조작 | innerHTML로 화면 그리기 |
| XSS 방어 | escHtml 함수 |
| 지도 라이브러리 | Leaflet.js |
| 토큰 자동 갱신 | sync.js, artist-info.js |
| 클라이언트 사이드 필터 | library.html, dashboard.html 장르 word-cloud |
| Supabase PATCH | album.html 장르 수동 수정 |
| 번역 API | DeepL Free (아티스트 바이오 한국어 번역) |
