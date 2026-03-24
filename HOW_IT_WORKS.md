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
Spotify API  /  Supabase (DB)  /  Last.fm API
```

MyMusicSave는 크게 세 덩어리야:

1. **HTML/CSS/JS 파일들** — 화면에 보이는 것 (브라우저에서 실행)
2. **Netlify Functions** — 서버 역할 (브라우저 밖에서 실행)
3. **Supabase** — 데이터 저장소 (DB)

이 셋이 어떻게 대화하는지 이해하면 전부 이해한 거야.

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
   → 실제 access_token을 받아옴
       ↓
7. access_token을 브라우저 localStorage에 저장
```

**code** vs **access_token** 차이:
- `code`: 1회용 쿠폰 (Spotify가 줌, 30초 안에 써야 함)
- `access_token`: 실제 입장권 (이걸로 API 호출, 1시간 유효)

코드에서 이 부분이야:
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
| id | user_id | title        | artist  | genre   | year |
|----|---------|--------------|---------|---------|------|
| 1  | 1       | Flower Boy   | Tyler   | Hip-Hop | 2017 |
| 2  | 1       | Igor         | Tyler   | Hip-Hop | 2019 |
```

우리가 Supabase에 요청하는 방법:
```js
// "user_id가 나인 앨범 전부 가져와"
fetch(`${SUPABASE_URL}/rest/v1/albums?user_id=eq.${userId}&select=*`)
```

이게 SQL로 하면 `SELECT * FROM albums WHERE user_id = ?` 이랑 똑같아.

URL 문법 익혀두면 편해:
- `?컬럼=eq.값` → WHERE 컬럼 = 값
- `&order=added_at.desc` → ORDER BY added_at DESC
- `&select=title,artist` → SELECT title, artist (특정 컬럼만)

---

## 4. 동기화는 어떻게 동작해? (sync.js)

"동기화" 버튼 누르면 이게 일어나:

```
1. 브라우저 → sync.js 함수 호출
   (access_token, spotify_id 전달)

2. sync.js → Spotify API
   GET /v1/me/albums (50개씩 페이지네이션)
   총 664장이면 664/50 = 약 14번 요청

3. 아티스트 목록 추출 → Last.fm API
   "Tyler The Creator의 장르가 뭐야?" → "Hip-Hop"
   모든 아티스트 동시에 요청 (Promise.all)

4. 장르 분류 (GENRE_MAP)
   "hip hop", "rap" → "Hip-Hop"
   "k-pop", "korean pop" → "K-Pop"
   키워드 매칭으로 정규화

5. Supabase에 upsert
   이미 있으면 업데이트, 없으면 삽입
```

**페이지네이션**이 뭔지:
Spotify는 한 번에 최대 50개 앨범만 줘. 664개면:
```
1번 요청: offset=0, limit=50 → 1~50번
2번 요청: offset=50, limit=50 → 51~100번
...
14번 요청: offset=650, limit=50 → 651~664번
```

코드로는 이렇게:
```js
let albums = [];
let offset = 0;
while (true) {
  const res = await fetch(`/v1/me/albums?limit=50&offset=${offset}`);
  const data = await res.json();
  albums.push(...data.items);
  if (!data.next) break;  // 다음 페이지 없으면 종료
  offset += 50;
}
```

**Promise.all**이 뭔지:
```js
// 이렇게 하면 아티스트 100명 × 0.3초 = 30초
for (const artist of artists) {
  await fetchLastFm(artist);  // 한 명씩 순서대로
}

// 이렇게 하면 모두 동시에 시작 → 0.3초
await Promise.all(artists.map(artist => fetchLastFm(artist)));
```

---

## 5. 뮤직맵은 어떻게 동작해?

세 단계야:

**1단계: 지도 그리기 (Leaflet.js)**
```js
const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://.../dark_all/{z}/{x}/{y}.png').addTo(map);
```
Leaflet은 지도 라이브러리. 타일(지도 이미지 조각)을 CartoDB 서버에서 받아와서 화면에 붙여줘.
줌하면 더 자세한 타일을 요청하는 구조.

**2단계: 아티스트 위치 찾기 (MusicBrainz + geocode.js)**
```
"Tyler The Creator" → MusicBrainz API
  응답: { country: "US", begin-area: "Los Angeles" }
  → US → { lat: 37.09, lng: -95.71 }
  → Supabase artists 테이블에 저장
```

왜 12명씩 나눠서 처리해?
MusicBrainz는 초당 1개 요청만 허용 (rate limit). 12명 × 1.1초 = 13.2초. Netlify 타임아웃 30초 안에 들어오도록.

**3단계: 마커 표시**
```js
const r = 6 + (album_count / maxCount) * 14;  // 앨범 많을수록 큰 원
L.marker([lat, lng], { icon: 원형아이콘(r) }).addTo(map);
```

---

## 6. 브라우저 JS 패턴들

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

---

## 7. 이 프로젝트에서 배울 수 있는 것들

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
| DOM 조작 | innerHTML로 화면 그리기 |
| XSS 방어 | escHtml 함수 |
| 지도 라이브러리 | Leaflet.js |

---

## 다음에 뭔가 만들면 물어볼 것들

코드를 그냥 넘기지 말고, 이런 거 물어봐:

- "이 fetch 요청 URL에서 `eq.`가 뭐야?"
- "왜 여기서 async/await 쓴 거야?"
- "Promise.all 말고 for loop 쓰면 어떻게 달라져?"
- "이 환경변수 없으면 어떻게 돼?"
- "왜 여기서 localStorage에 저장한 거야?"

그 질문들이 실력이야.
