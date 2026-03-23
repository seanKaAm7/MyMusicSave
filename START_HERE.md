# MyMusicSave — 새 세션 시작 가이드

이 파일을 가장 먼저 읽어라. 이 폴더는 music-archive v1을 기반으로 완전히 새로운 서비스로 전환하는 작업 공간이다.

---

## 현재 상황 요약

- 이 폴더는 `/Users/seanka/기본 작업 파일/music-archive` 의 v1 백업을 기반으로 함
- 기존 music-archive 사이트(music-archiveweb.netlify.app)는 그대로 유지, 건드리지 않음
- 이 폴더에서 완전히 새로운 프로젝트 MyMusicSave를 구축함

---

## 프로젝트 개요

**MyMusicSave**는 Spotify 보관함을 자동으로 불러와 시각화해주는 개인 음악 통계 서비스다.

기존 music-archive의 문제점:
- 앨범 추가할 때마다 data.js 코드를 직접 수정해야 함
- 사람이 직접 입력하는 구조라 확장 불가능

MyMusicSave가 해결하는 것:
- Spotify 로그인 한 번이면 내 보관함 전체 자동 동기화
- 장르 비율, 연도 분포, 아티스트 순위 등 시각화 제공
- 보관함 공개/비공개 설정으로 타인과 공유 가능

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | Vanilla JS (기존 코드 재활용) |
| 디자인 | 기존 styles.css 감성 유지 (다크 테마, Bebas Neue) |
| 인증 | Spotify OAuth 2.0 (Authorization Code Flow) |
| 데이터베이스 | Supabase (PostgreSQL, 무료 플랜) |
| 서버 함수 | Netlify Functions (기존 netlify/functions/ 구조 유지) |
| 차트 | Chart.js (CDN으로 로드, 설치 불필요) |
| 배포 | Netlify (music-archiveweb과 별개의 새 사이트) |

---

## Supabase 테이블 설계

### users
```
id            uuid  PK (Supabase auth.users 연동)
spotify_id    text  Spotify 유저 고유 ID
display_name  text  화면에 표시할 이름 (Spotify 이름 기본값)
username      text  공개 URL용 슬러그 (예: seanka)
is_public     bool  공개 여부 (기본값: false)
created_at    timestamp
```

### albums
```
id               uuid  PK
user_id          uuid  FK → users.id
spotify_album_id text  Spotify 앨범 ID (중복 방지용)
title            text
artist           text
genre            text  자동 분류된 장르
year             int
cover_url        text  Spotify 커버 이미지 URL
added_at         timestamp  Spotify 보관함에 추가한 날짜
synced_at        timestamp  마지막 동기화 시각
```

---

## 화면 구성 (페이지별)

### index.html — 메인 (로그인 전)
- 사이트 이름 + 한 줄 소개
- "Spotify로 로그인" 버튼 (크게)
- 사이트 기능 소개 3가지 (시각화 / 탐색 / 공유)
- 기존 hero 디자인 활용 가능

### dashboard.html — 대시보드 (로그인 후 메인)
- 상단: 유저 이름 + 총 앨범 수 / 아티스트 수 / 총 재생시간
- 중앙 좌측: 장르 비율 도넛 차트
- 중앙 우측: 연도별 분포 바 차트
- 하단: 아티스트 순위 TOP 10
- 하단: 최근 저장한 앨범 5장

### library.html — 전체 보관함
- 기존 index.html의 장르 카드 + 우측 앨범 리스트 구조 그대로 활용
- 장르 필터, 연도 필터 추가
- 앨범 클릭 시 album.html로 이동

### album.html — 앨범 상세
- 기존 album.html 디자인 그대로 활용
- data.js 대신 Supabase에서 앨범 데이터 로드
- Spotify API로 트랙리스트 보강 (기존 enrichFromSpotify 로직 유지)

### profile.html — 공개 프로필 (/u/username)
- 로그인 없이 접근 가능
- 해당 유저의 대시보드를 읽기 전용으로 표시
- "나도 만들기" 버튼 → index.html 로그인으로 유도

### callback.html — Spotify OAuth 콜백
- 로그인 후 Spotify가 리다이렉트하는 페이지
- 코드 교환 → 토큰 발급 → dashboard.html로 이동

---

## Netlify Functions 구성

### 기존 유지
- `netlify/functions/spotify.js` — 앨범 ID로 트랙/커버 조회 (그대로 사용)

### 신규 추가
- `netlify/functions/auth.js` — Spotify OAuth 코드 → 토큰 교환
- `netlify/functions/sync.js` — Spotify 보관함 전체 가져와서 Supabase에 저장
- `netlify/functions/refresh.js` — 만료된 Spotify 토큰 갱신

---

## 기존 파일 처리 방향

### 삭제할 파일
- `data.js` — Supabase로 대체되므로 불필요
- `genre.html` — library.html로 통합
- `year.html` — library.html 필터로 통합
- `artist.html` — library.html 필터로 통합
- `archive_spotify_expansion_plan.md` — 구버전 기획안
- `scripts/fetch-spotify-ids.js` — 더 이상 필요 없음

### 유지할 파일
- `styles.css` — 디자인 감성 유지, 신규 컴포넌트 추가
- `album.html` — 구조 유지, 데이터 소스만 변경
- `netlify/functions/spotify.js` — 트랙 조회 로직 재활용
- `netlify.toml` — 그대로 유지
- `img/` — 기존 이미지 유지 가능

### 전면 수정할 파일
- `index.html` — 로그인 페이지로 완전히 교체
- `app.js` — 라우팅/렌더 로직 전면 재작성 (data.js 의존성 제거)
- `CLAUDE.md` — 새 프로젝트 가이드로 재작성

### 신규 생성할 파일
- `dashboard.html`
- `library.html`
- `profile.html`
- `callback.html`
- `netlify/functions/auth.js`
- `netlify/functions/sync.js`
- `netlify/functions/refresh.js`
- `.env` (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SUPABASE_URL, SUPABASE_KEY)

---

## 구현 단계 (순서대로)

### 1단계 — 환경 세팅
1. Supabase 계정 생성 및 프로젝트 생성
2. Supabase에서 users, albums 테이블 생성
3. Spotify 개발자 대시보드에서 Redirect URI 추가 (callback.html URL)
4. .env에 키 4개 입력
   - SPOTIFY_CLIENT_ID
   - SPOTIFY_CLIENT_SECRET
   - SUPABASE_URL
   - SUPABASE_KEY

### 2단계 — 인증 구현
1. `netlify/functions/auth.js` 작성 (코드 → 토큰 교환)
2. `callback.html` 작성 (토큰 받아서 Supabase 유저 생성/로그인)
3. `index.html` 로그인 버튼 구현
4. 로그인 상태 localStorage 관리

### 3단계 — 보관함 동기화
1. `netlify/functions/sync.js` 작성
   - Spotify /v1/me/albums 페이지네이션 처리 (50개씩)
   - 장르 자동 분류 로직
   - Supabase albums 테이블에 upsert
2. 동기화 버튼 + 진행 상태 표시

### 4단계 — 대시보드 시각화
1. `dashboard.html` + Chart.js 연동
2. Supabase에서 내 앨범 데이터 조회
3. 장르 비율 도넛 차트
4. 연도별 분포 바 차트
5. 아티스트 순위, 최근 추가 앨범

### 5단계 — 보관함 탐색
1. `library.html` 구현 (기존 index.html 구조 재활용)
2. 장르/연도 필터링

### 6단계 — 앨범 상세
1. `album.html` 데이터 소스를 Supabase로 변경
2. 기존 enrichFromSpotify 로직 유지

### 7단계 — 공개 프로필
1. `profile.html` 구현
2. Supabase에서 공개 유저 데이터 조회
3. 공유 링크 생성

### 8단계 — 배포
1. Netlify에 새 사이트 생성 (mymusicsave)
2. 환경변수 Netlify 대시보드에 등록
3. GitHub 새 레포 생성 및 연동

---

## 장르 자동 분류 로직 (초안)

Spotify 아티스트 장르 태그를 기반으로 분류한다.

```
"rap", "hip hop", "trap" → hip-hop
"r&b", "soul", "neo soul" → rnb
"pop" → pop
"rock", "indie rock", "alternative rock" → rock
"jazz", "bebop", "fusion" → jazz
"electronic", "edm", "house", "techno" → electronic
"k-pop", "korean" → kpop
"classical", "piano", "orchestra" → classical
"folk", "indie folk" → alternative
"funk", "soul" → soul
분류 불가 → other
```

---

## 참고 사항

- Spotify 액세스 토큰은 1시간마다 만료됨 → refresh_token으로 자동 갱신 처리 필요
- Spotify 보관함은 최대 50개씩 페이지네이션으로 가져옴 → 전체 가져오려면 반복 호출 필요
- Supabase 무료 플랜: DB 500MB, 월 50만 API 요청 → 소규모 서비스에 충분
- Chart.js는 CDN으로 로드 (`<script src="https://cdn.jsdelivr.net/npm/chart.js">`)
