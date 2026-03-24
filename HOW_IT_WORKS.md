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
Spotify API  /  Supabase (DB)  /  Last.fm API  /  MusicBrainz API
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
| `dashboard.html` | 메인 대시보드 — 통계, 장르, 앨범 그리드, 차트 |
| `library.html` | 전체 앨범 브라우저 — 필터/검색/정렬 |
| `album.html` | 앨범 상세 포스터 — 트랙리스트, 장르 수정 |
| `map.html` | 뮤직맵 — 아티스트 출신 지역 세계지도 |

**Netlify Functions (서버):**

| 파일 | 역할 |
|------|------|
| `netlify/functions/auth.js` | Spotify 로그인 토큰 교환 |
| `netlify/functions/sync.js` | Spotify 보관함 → Supabase 동기화 |
| `netlify/functions/spotify.js` | 앨범 상세 정보 조회 (트랙리스트 등) |
| `netlify/functions/geocode.js` | 아티스트 위치 조회 (MusicBrainz) |

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

```js
// index.html — Spotify 로그인 버튼 클릭 시
window.location.href = `https://accounts.spotify.com/authorize?
  client_id=${CLIENT_ID}
  &redirect_uri=${REDIRECT_URI}    ← 인증 후 돌아올 주소
  &scope=user-library-read         ← 어떤 권한 요청할지
  &response_type=code`             ← code 방식으로 요청
```

---

## 3. Supabase는 그냥 DB야

복잡하게 생각할 필요 없어. 그냥 **엑셀 파일**인데 인터넷으로 접근할 수 있는 것.

```
users 테이블:
| id | spotify_id | display_name | email |
|----|------------|--------------|-------|
| 1  | abc123     | SEANKA       | ...   |

albums 테이블:
| id | user_id | title        | artist  | genre   | year | cover_url | added_at |
|----|---------|--------------|---------|---------|------|-----------|----------|
| 1  | 1       | Flower Boy   | Tyler   | hip-hop | 2017 | https://  | 2026-... |
| 2  | 1       | Igor         | Tyler   | hip-hop | 2019 | https://  | 2026-... |

artists 테이블:
| id | user_id | name  | country | continent | lat   | lng    | album_count |
|----|---------|-------|---------|-----------|-------|--------|-------------|
| 1  | 1       | Tyler | US      | americas  | 37.09 | -95.71 | 3           |
```

우리가 Supabase에 요청하는 방법:
```js
// "user_id가 나인 앨범 전부 가져와, 연도 최신순으로"
fetch(`${SUPABASE_URL}/rest/v1/albums?user_id=eq.${userId}&select=*&order=year.desc`)
```

이게 SQL로 하면 `SELECT * FROM albums WHERE user_id = ? ORDER BY year DESC` 이랑 똑같아.

URL 문법 익혀두면 편해:
- `?컬럼=eq.값` → WHERE 컬럼 = 값
- `&order=year.desc,added_at.desc` → ORDER BY year DESC, added_at DESC (복합 정렬)
- `&select=title,artist` → SELECT title, artist (특정 컬럼만)
- `method: 'PATCH'` + body → UPDATE (특정 행 수정)
- `Prefer: resolution=merge-duplicates` → upsert (있으면 업데이트, 없으면 삽입)

---

## 4. 동기화는 어떻게 동작해? (sync.js)

"동기화" 버튼 누르면 이게 일어나:

```
1. 브라우저 → sync.js 함수 호출
   (access_token, refresh_token, spotify_id 전달)

2. sync.js → Spotify API
   GET /v1/me/albums (50개씩 페이지네이션)
   총 664장이면 664/50 = 약 14번 요청

   ⚠️ 중간에 401 에러(토큰 만료) 나면?
   → refresh_token으로 Spotify에 새 access_token 요청
   → 새 토큰으로 요청 재시도
   → 완료 후 new_access_token을 브라우저에 돌려줌
   → 브라우저가 localStorage에 저장

3. 아티스트 목록 추출 → Last.fm API
   "Tyler The Creator의 장르가 뭐야?" → "Hip-Hop"
   모든 아티스트 동시에 요청 (Promise.all)

4. 장르 분류 (GENRE_MAP, 우선순위 순)
   kpop → hip-hop → rnb → rock → alternative → jazz
   → electronic → classical → soul → soundtrack → pop → other
   키워드 매칭: "k-pop", "korean pop" → "kpop"

5. Supabase에 upsert (50개씩)
   이미 있으면 업데이트, 없으면 삽입
```

**왜 kpop이 장르 순서 맨 앞이야?**
Last.fm 태그는 여러 개 달려. 예를 들어 뉴진스는 "k-pop", "r&b", "pop" 이렇게 다 달려있어.
GENRE_MAP은 위에서부터 먼저 매칭되면 거기서 멈춰. kpop이 뒤에 있으면 r&b가 먼저 걸려서 뉴진스가 R&B로 분류됨.
그래서 kpop을 맨 위에 놓는 거야.

**토큰 자동 갱신 흐름:**
```js
// sync.js 안에서
if (res.status === 401 && refresh_token) {
  const newToken = await refreshAccessToken(refresh_token);
  access_token = newToken;
  continue;  // while 루프 처음부터 다시 (같은 URL 재시도)
}
```

---

## 5. 장르 수동 수정은 어떻게 동작해? (album.html)

자동 분류가 완벽하지 않을 때 직접 바꿀 수 있어.

```
1. album.html에서 장르 텍스트 옆 연필 아이콘 클릭
       ↓
2. 팝업 오버레이 — 12개 장르 버튼 표시
   현재 장르는 흰 배경으로 강조
       ↓
3. 원하는 장르 클릭
       ↓
4. Supabase PATCH 요청
   albums 테이블에서 해당 앨범의 genre 컬럼만 업데이트
       ↓
5. 팝업 닫히고 화면 즉시 반영
```

```js
// Supabase에서 특정 행만 수정하는 방법 (PATCH)
fetch(`${SUPABASE_URL}/rest/v1/albums?user_id=eq.${userId}&spotify_album_id=eq.${spotifyId}`, {
  method: 'PATCH',
  body: JSON.stringify({ genre: 'hip-hop' })
})
// SQL로 하면: UPDATE albums SET genre = 'hip-hop' WHERE user_id = ? AND spotify_album_id = ?
```

---

## 6. library.html은 어떻게 동작해?

Supabase에서 내 앨범 전체를 가져와서 **브라우저 안에서** 필터링/정렬해.

```
1. 페이지 로드 → Supabase에서 전체 앨범 한 번에 가져옴 (allAlbums 배열)

2. 이후 검색/필터/정렬은 전부 JS로 처리 (서버 요청 없음)
   → 빠름
```

왜 이렇게 해?
서버에 매번 요청하면 필터 바꿀 때마다 네트워크 왕복이 생겨. 전체 데이터가 몇백 장 수준이면 한 번에 가져와서 JS로 처리하는 게 훨씬 빠르고 간단해.

```js
function getFiltered() {
  let list = [...allAlbums];           // 원본 건드리지 않게 복사

  if (activeGenre !== 'all')           // 장르 필터
    list = list.filter(a => a.genre === activeGenre);

  if (searchQuery)                     // 검색
    list = list.filter(a => a.title?.toLowerCase().includes(q));

  list.sort((a, b) => ...);            // 정렬

  return list;
}
```

---

## 7. 뮤직맵은 어떻게 동작해?

세 단계야:

**1단계: 지도 그리기 (Leaflet.js)**
```js
const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://.../dark_all/{z}/{x}/{y}.png').addTo(map);
```
Leaflet은 지도 라이브러리. 타일(지도 이미지 조각)을 CartoDB 서버에서 받아와서 화면에 붙여줘.
줌하면 더 자세한 타일을 요청하는 구조.

**2단계: 아티스트 위치 찾기 (geocode.js + MusicBrainz)**
```
"Tyler The Creator" → MusicBrainz API
  응답: { country: "US", begin-area: "Los Angeles" }
  → US → { lat: 37.09, lng: -95.71 }
  → Supabase artists 테이블에 저장
```

왜 12명씩 나눠서 처리해?
MusicBrainz는 초당 1개 요청만 허용 (rate limit). 12명 × 1.1초 = 13.2초. Netlify 타임아웃 26초 안에 들어오도록.
한 번 처리된 아티스트는 다음 번에 MusicBrainz 조회 안 하고 건너뜀 (중복 방지).

**3단계: 마커 표시**
```js
const r = 6 + (album_count / maxCount) * 14;  // 앨범 많을수록 큰 원
L.marker([lat, lng], { icon: 원형아이콘(r) }).addTo(map);
```

---

## 8. 토큰 만료가 뭔데? (access_token vs refresh_token)

Spotify access_token은 **1시간**이 지나면 자동으로 무효화돼. 그 이후로 API 호출하면 401 에러 남.

옛날엔 이게 나오면 그냥 "다시 로그인하세요" 메시지 보여줬어.

지금은 자동으로 처리해:
```
동기화 도중 401 에러 발생
    ↓
refresh_token으로 Spotify에 새 access_token 요청
    ↓
새 토큰으로 실패했던 요청 재시도
    ↓
완료 후 새 토큰을 브라우저에 돌려줌
    ↓
브라우저가 localStorage에 저장 (다음 동기화 때 쓸 수 있게)
```

refresh_token은 만료 기간이 없어서 (거의) 영구적으로 쓸 수 있어.
단, Spotify 앱 권한을 해제하거나 오랫동안 안 쓰면 무효화될 수 있어.

---

## 9. 브라우저 JS 패턴들

**async/await 가 뭔지:**
```js
// 나쁜 예 — fetch는 시간이 걸리는데 바로 다음 줄 실행됨
const res = fetch('/api/data');
console.log(res);  // 아직 안 왔는데 출력하려 함 → undefined

// 좋은 예 — await: "이거 올 때까지 기다려"
const res = await fetch('/api/data');
const data = await res.json();
console.log(data);  // 제대로 옴
```

`async function`을 쓰면 그 함수 안에서 `await`를 쓸 수 있어.

**localStorage 가 뭔지:**
```js
// 브라우저에 데이터 저장 (창 닫아도 유지)
localStorage.setItem('mms_access_token', 'eyJ...');

// 꺼내기
const token = localStorage.getItem('mms_access_token');

// 지우기
localStorage.clear();
```

로그아웃할 때 `localStorage.clear()` 하는 이유 — 거기에 토큰이 저장돼 있으니까.

**innerHTML vs textContent:**
```js
// textContent — 텍스트만 (XSS 안전)
el.textContent = '안녕 <b>세상</b>';  // 화면에 그대로 "<b>세상</b>" 출력

// innerHTML — HTML 해석 (XSS 주의)
el.innerHTML = '안녕 <b>세상</b>';    // "안녕 세상" (굵게) 출력
```

외부 데이터(앨범 이름 등)를 innerHTML에 넣을 때 `escHtml()` 함수 쓰는 이유:
앨범 이름이 `<script>나쁜코드()</script>` 면 그게 실행될 수 있어. escHtml이 `<`를 `&lt;`로 바꿔서 막아줘.

**캐시(Cache)가 뭔지:**
album.html에서 Spotify 앨범 상세 정보를 매번 새로 요청하면 느려. 그래서 첫 번째 요청 결과를 localStorage에 저장해두고, 24시간 안에 같은 앨범 열면 저장된 거 바로 씀.

```js
const cacheKey = `mms_spotify_${spotifyId}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  const { data, ts } = JSON.parse(cached);
  if (Date.now() - ts < 86400000) return data;  // 24시간 = 86400000ms
}
// 캐시 없으면 새로 요청
```

---

## 10. 이 프로젝트에서 배울 수 있는 것들

| 개념 | 어디서 쓰임 |
|------|------------|
| OAuth 2.0 | Spotify 로그인 |
| REST API | Supabase, Spotify, Last.fm, MusicBrainz |
| 환경변수 | .env, Netlify 서버 비밀키 |
| async/await | 모든 fetch 호출 |
| Promise.all | sync.js 아티스트 병렬 조회 |
| 페이지네이션 | Spotify 앨범 50개씩 |
| Rate Limiting | MusicBrainz 1req/sec |
| localStorage | 토큰/유저 정보 저장 |
| 캐싱 | album.html Spotify 응답 24시간 저장 |
| DOM 조작 | innerHTML로 화면 그리기 |
| XSS 방어 | escHtml 함수 |
| 지도 라이브러리 | Leaflet.js |
| 토큰 자동 갱신 | sync.js refresh_token 처리 |
| 클라이언트 사이드 필터 | library.html 전체 데이터 캐싱 후 JS로 처리 |
| Supabase PATCH | album.html 장르 수동 수정 |

---

## 다음에 뭔가 만들면 물어볼 것들

코드를 그냥 넘기지 말고, 이런 거 물어봐:

- "이 fetch 요청 URL에서 `eq.`가 뭐야?"
- "왜 여기서 async/await 쓴 거야?"
- "Promise.all 말고 for loop 쓰면 어떻게 달라져?"
- "이 환경변수 없으면 어떻게 돼?"
- "왜 여기서 localStorage에 저장한 거야?"
- "캐시 없으면 어떻게 달라져?"
- "왜 장르 분류가 완벽하지 않아?"
- "refresh_token이 만료되면 어떻게 돼?"

그 질문들이 실력이야.
