# MyMusicSave — 프로젝트 보고서

> 작성일: 2026년 3월 24일
> 작성자: seanka
> 버전: v0.6

---

## 목차

1. 프로젝트 개요
2. 개발 배경 및 동기
3. 기술 스택
4. 시스템 아키텍처
5. 구현 기능 상세
6. 개발 과정 및 주요 의사결정
7. 트러블슈팅 기록
8. 파일 구조
9. 외부 API 연동
10. 데이터베이스 설계
11. 배포 환경
12. 버전 히스토리
13. 향후 개선 방향

---

## 1. 프로젝트 개요

**MyMusicSave**는 Spotify에 저장된 개인 음악 보관함을 자동으로 불러와 시각화하는 개인 음악 통계 웹 서비스다.

Spotify 자체 앱은 보관함을 단순 리스트 형태로만 보여주며, 장르 분류·연도 분포·아티스트 통계·지역별 분포 같은 분석 기능을 제공하지 않는다. MyMusicSave는 이 공백을 채우는 것을 목표로 한다.

| 항목 | 내용 |
|------|------|
| 서비스 유형 | 개인 음악 통계 & 시각화 웹 애플리케이션 |
| 타겟 사용자 | Spotify 사용자 중 본인의 음악 취향을 시각화하고 탐색하고 싶은 사람 |
| 배포 플랫폼 | Netlify (정적 사이트 + Serverless Functions) |
| 데이터베이스 | Supabase (PostgreSQL 기반 클라우드 DB) |
| 개발 기간 | 2026년 3월 23일 ~ 현재 |
| GitHub | https://github.com/seanKaAm7/MyMusicSave |

---

## 2. 개발 배경 및 동기

이 프로젝트는 기존에 존재하던 **music-archive v1**을 전면 재설계하면서 시작됐다. v1은 모든 앨범 데이터를 `data.js`에 수동으로 직접 입력하는 방식이었고, 새 앨범을 추가할 때마다 파일을 직접 수정해야 하는 불편함이 있었다.

**전환 배경:**
- 수동 데이터 관리의 한계 → Spotify API 자동 동기화로 해결
- 하드코딩된 정적 데이터 → Supabase DB로 전환
- 단순 목록 표시 → 장르/연도/지역 시각화로 확장

**핵심 목표:**
1. Spotify 보관함을 버튼 하나로 자동 동기화
2. 장르·연도·아티스트 기준 통계 시각화
3. 아티스트 출신 지역을 세계지도에 표시
4. 개인 음악 취향을 포스터 감성의 UI로 표현

---

## 3. 기술 스택

### 프론트엔드

| 기술 | 용도 | 선택 이유 |
|------|------|----------|
| HTML5 / CSS3 | 마크업 및 스타일링 | 프레임워크 없이 경량으로 유지 |
| Vanilla JavaScript (ES2022) | 클라이언트 로직 | 번들러 없이 순수 JS로 구현 가능한 규모 |
| Bebas Neue (Google Fonts) | 제목/강조 폰트 | 포스터 감성의 핵심 서체 |
| Space Mono (Google Fonts) | 수치/메타 폰트 | 모노스페이스로 데이터 느낌 강조 |
| Chart.js | 연도 바 차트 | CDN으로 간단하게 사용 가능 |
| Leaflet.js | 세계지도 렌더링 | 오픈소스 지도 라이브러리 |
| Leaflet.markercluster | 마커 클러스터링 | 겹치는 마커 자동 그룹화 |

### 백엔드 (Serverless)

| 기술 | 용도 |
|------|------|
| Netlify Functions (Node.js 18) | API 서버 역할, 환경변수 보호 |

### 데이터베이스

| 기술 | 용도 |
|------|------|
| Supabase (PostgreSQL) | 유저/앨범/아티스트 데이터 저장 |
| Supabase REST API | 브라우저에서 직접 DB 조회 |

### 외부 API

| API | 용도 |
|-----|------|
| Spotify Web API | OAuth 로그인, 보관함 앨범 조회 |
| Last.fm API | 아티스트 장르 태그 조회 |
| MusicBrainz API | 아티스트 출신 국가/지역 조회 |
| CartoDB (지도 타일) | 다크 테마 세계지도 타일 제공 |

### 배포 및 인프라

| 기술 | 용도 |
|------|------|
| Netlify | 정적 사이트 호스팅 + Functions 실행 |
| Git / GitHub | 버전 관리 및 소스 저장 |

---

## 4. 시스템 아키텍처

```
[브라우저]
    │
    ├── 정적 파일 요청 (HTML/CSS/JS)
    │        ↓
    │   [Netlify CDN]
    │
    ├── API 요청 (/.netlify/functions/*)
    │        ↓
    │   [Netlify Functions - Node.js]
    │        ├── auth.js      → Spotify OAuth 토큰 교환
    │        ├── sync.js      → Spotify 보관함 동기화 + Last.fm 장르 분류
    │        ├── spotify.js   → 앨범 상세 정보 (트랙리스트)
    │        └── geocode.js   → MusicBrainz 아티스트 위치 조회
    │
    └── DB 요청 (Supabase REST API)
             ↓
        [Supabase / PostgreSQL]
             ├── users 테이블
             ├── albums 테이블
             └── artists 테이블
```

**왜 Netlify Functions가 필요한가?**

Spotify API는 Client Secret이라는 비밀 키를 요구한다. 브라우저에서 직접 호출하면 소스 코드에 키가 노출되어 보안 문제가 생긴다. Netlify Functions는 서버 측에서 실행되므로 환경변수에 저장된 키가 브라우저에 절대 노출되지 않는다.

```
❌ 위험: 브라우저 → (Client Secret 포함) → Spotify API
✅ 안전: 브라우저 → Netlify Function → (Client Secret 포함) → Spotify API
```

---

## 5. 구현 기능 상세

### 5-1. Spotify OAuth 로그인 (index.html → callback.html → auth.js)

Spotify의 Authorization Code Flow를 구현했다.

**흐름:**
1. 사용자가 "Spotify로 로그인" 클릭
2. Spotify 인증 페이지로 리다이렉트 (`scope: user-library-read user-read-private user-read-email`)
3. 인증 완료 후 `callback.html`으로 리다이렉트 (URL에 `code` 파라미터 포함)
4. `callback.html`이 `auth.js` Netlify Function에 code 전달
5. `auth.js`가 code + Client Secret으로 Spotify에 토큰 요청
6. `access_token` + `refresh_token` 반환
7. 브라우저 `localStorage`에 저장 후 `dashboard.html`로 이동

**저장 항목 (localStorage):**
- `mms_access_token` — API 호출용 토큰 (1시간 유효)
- `mms_refresh_token` — 토큰 재발급용 (사실상 영구)
- `mms_user` — 유저 정보 JSON (spotify_id, display_name, email)

---

### 5-2. 보관함 동기화 (sync.js)

"동기화" 버튼을 누르면 Spotify 전체 보관함을 Supabase에 저장한다.

**처리 과정:**
1. Spotify `GET /v1/me/albums` — 50개씩 페이지네이션으로 전체 조회
2. 401 오류 발생 시 `refresh_token`으로 새 토큰 발급 후 자동 재시도
3. 아티스트 이름 목록 추출 → Last.fm `artist.getTopTags` API 병렬 호출 (`Promise.all`)
4. 태그 기반 장르 분류 (GENRE_MAP 키워드 매칭)
5. Supabase `albums` 테이블에 upsert (50개씩 청크)
6. 새 access_token이 발급됐으면 브라우저에 반환 → localStorage 갱신

**장르 분류 우선순위 (GENRE_MAP):**
```
kpop → hip-hop → rnb → rock → alternative → jazz
→ electronic → classical → soul → soundtrack → pop → other
```
kpop이 최우선인 이유: Last.fm 태그는 여러 개 달리는데 (예: 뉴진스 → "k-pop", "r&b", "pop"), 순서대로 첫 번째 매칭에서 멈추기 때문에 가장 구체적인 장르를 앞에 배치해야 올바르게 분류된다.

**토큰 자동 갱신:**
Spotify access_token은 1시간 후 만료된다. 기존에는 만료 시 에러 메시지만 표시했으나, v0.5에서 자동 갱신 로직을 추가했다.
```
401 에러 감지 → refresh_token으로 새 토큰 요청 → 실패한 요청 재시도 → 새 토큰 브라우저에 반환
```

---

### 5-3. 대시보드 (dashboard.html)

메인 화면. 동기화된 데이터를 4개 섹션으로 시각화한다.

**히어로 섹션:**
- MYMUSICSAVE 대형 로고 (Bebas Neue, clamp(3rem, 8vw, 5.5rem))
- 유저 이름 (Space Mono, 0.72rem — 의도적으로 가장 작게)
- 통계 3개: 총 앨범 수 · 아티스트 수 · 장르 수

**장르 섹션:**
- 앨범 수에 비례한 타이포그래피 word-cloud 형태
- 각 장르 클릭 시 해당 장르 앨범만 커버 그리드에 필터링
- 재클릭 시 필터 해제 (최근 20장 복귀)

**앨범 그리드 섹션:**
- 발매 연도 최신순으로 앨범 커버 표시 (10열 그리드)
- 호버 시 앨범명 + 아티스트명 오버레이
- 클릭 시 해당 앨범 상세 페이지(`album.html`)로 이동

**YEAR 차트:**
- Chart.js 바 차트
- 연도별 앨범 수 시각화
- 막대별 밝기 차등: 앨범 수에 비례한 opacity 값 적용 (`0.15 + ratio * 0.75`)

**ARTIST TOP 10:**
- 보관함에 가장 많은 앨범이 있는 아티스트 순위
- 포스터 트랙리스트 스타일 (2자리 넘버 + 아티스트명 + 앨범 수)

---

### 5-4. 라이브러리 (library.html)

전체 앨범을 한 번에 탐색할 수 있는 브라우저 페이지.

**특징:**
- Supabase에서 전체 앨범 한 번 로드 후 클라이언트 사이드에서 처리 (서버 재요청 없음)
- 장르 필터 버튼 (ALL + 보관함에 실제 존재하는 장르만 표시)
- 실시간 검색 (앨범명 / 아티스트명)
- 정렬 옵션 6가지: 최근 저장순 / 오래된 순 / 연도 최신순 / 연도 오래된순 / 제목순 / 아티스트순
- 각 앨범 카드: 커버 이미지, 제목, 아티스트, 연도, 장르 뱃지

**클라이언트 사이드 필터링을 선택한 이유:**
보관함이 수백~수천 장 수준이면 전체 데이터를 한 번에 가져와서 JS로 처리하는 것이 매 필터 변경마다 네트워크 요청을 보내는 것보다 훨씬 빠르다.

---

### 5-5. 앨범 상세 (album.html)

개별 앨범의 상세 정보를 포스터 형식으로 표시.

**데이터 소스 (2중):**
1. Supabase — 저장된 기본 정보 (장르, 저장일 등)
2. Spotify API (spotify.js 함수) — 트랙리스트, 레이블, 런타임, 발매일

**캐싱:**
Spotify API 응답을 `localStorage`에 24시간 캐싱. 같은 앨범을 다시 열면 API 호출 없이 즉시 표시.

**포스터 구성:**
- 앨범 커버 + 트랙리스트 2컬럼
- 아티스트명, 발매일, 런타임, 레이블
- 하단 메타 뱃지 (레이블 / 런타임 / 트랙 수 / Spotify 링크)

**장르 수동 수정:**
자동 분류가 부정확한 경우를 대비해 직접 수정 가능.
- 장르 텍스트 옆 연필 아이콘 클릭 → 12개 장르 선택 팝업
- 선택 즉시 Supabase PATCH 요청으로 저장
- 화면 즉시 반영

---

### 5-6. 뮤직맵 (map.html + geocode.js)

보관함 아티스트들의 출신 지역을 세계지도에 시각화.

**지도:**
- Leaflet.js + CartoDB Dark Matter 타일 (다크 테마 지도)
- Leaflet.markercluster로 겹치는 마커 자동 클러스터링
- 마커 크기: 해당 국가/지역 아티스트 앨범 수에 비례

**위치 데이터 수집 (geocode.js):**
1. Supabase `artists` 테이블에서 위치 미확인 아티스트 목록 조회
2. MusicBrainz API로 아티스트 검색 → 출신 국가 코드 추출
3. 55개국 COUNTRY_COORDS 매핑으로 위경도 변환
4. Supabase `artists` 테이블에 upsert (country, continent, lat, lng)

**배치 처리 (12명씩):**
MusicBrainz API는 초당 1개 요청만 허용 (rate limit). 12명 × 1.1초 간격 = 13.2초로 Netlify 타임아웃(26초) 안에 처리.
이미 위치가 저장된 아티스트는 MusicBrainz 조회 건너뜀.

**우측 패널:**
- 대륙 → 국가 → 아티스트 계층 트리
- 클릭 시 해당 위치로 지도 이동

---

## 6. 개발 과정 및 주요 의사결정

### v0.1 — 프로젝트 전환 결정 (2026-03-23)
music-archive v1(수동 데이터 입력 방식)에서 Spotify API 연동 방식으로 전환. `data.js` 33KB의 하드코딩 데이터를 버리고 실시간 DB 방식으로 재설계.

### v0.2 — 핵심 인프라 구축 (2026-03-23)
OAuth 로그인, 보관함 동기화, Supabase 연동의 3개 핵심 기능 구현. Spotify API가 2024년 정책 변경으로 Basic 앱의 `/v1/artists` 엔드포인트를 차단했기 때문에 장르 데이터는 Last.fm API로 대체.

**중요 의사결정 — Supabase 키 선택:**
Supabase가 새로 도입한 `sb_` 형식 키가 REST API JWT 형식과 호환되지 않는 문제 발견. Legacy anon/service_role 키로 교체.

### v0.3 — UI 전면 개편 (2026-03-23)
통계 카드 기반 UI에서 포스터 감성 UI로 전면 재설계. 도넛 차트 제거, 타이포그래피 word-cloud 도입, 앨범 커버 그리드 10열 구성.

### v0.4 — 뮤직맵 구현 (2026-03-23)
지도 시각화라는 차별점 기능 추가. MusicBrainz rate limit과 Netlify 타임아웃의 충돌 문제를 배치 크기(20→12) 조정으로 해결.

### v0.5 — 라이브러리 & 장르 수정 & 토큰 갱신 (2026-03-24)
- `library.html` 신규 구현
- 장르 자동 분류의 한계를 인정, 수동 수정 기능으로 보완
- Spotify 토큰 만료 문제 자동 갱신으로 해결

**장르 분류 시행착오:**
kpop/rnb 중복 태그 문제, 밴드/힙합의 kpop 오분류 문제 등으로 복잡한 PARENT_GENRES/SUBGENRE_MAP 구조를 도입했으나 더 많은 오분류 발생. 결국 처음 단순 방식(GENRE_MAP 우선순위 배열)으로 완전 롤백. 교훈: 자동화로 완벽한 분류는 불가능, 수동 수정 기능이 더 실용적.

### v0.6 — 폴리싱 & 정리 (2026-03-24)
- 히어로 섹션 리디자인 (MYMUSICSAVE 로고 대형화, 이름 최소화)
- footer 5컬럼 구성 (Last.fm 참고)
- 구버전 파일 정리 (app.js, data.js 등 10개 파일 삭제)
- 문서 업데이트 (HOW_IT_WORKS.md 전면 개정)

---

## 7. 트러블슈팅 기록

| 문제 | 원인 | 해결 |
|------|------|------|
| Spotify `/v1/artists` 403 오류 | 2024년 Basic 앱 API 정책 변경 | Last.fm API로 장르 조회 대체 |
| Supabase upsert 409 오류 | `on_conflict` 파라미터 누락 | `?on_conflict=user_id,spotify_album_id` 추가 |
| Supabase 인증 오류 | 신규 `sb_` 키가 REST API와 비호환 | Legacy anon/service_role 키로 교체 |
| 뮤직맵 완료 0/494 | `require('node-fetch')` 사용 (Node 18 내장 fetch 있음) | `require` 제거, 내장 fetch 사용 |
| geocode 30초 타임아웃 | 배치 크기 20 + 함수 내 albumCounts DB 조회 | 배치 12명으로 축소 + albumCounts를 프론트에서 전달 |
| `continent` 컬럼 없음 오류 | Supabase 테이블에 컬럼 미생성 | `ALTER TABLE artists ADD COLUMN continent text` 실행 |
| 뉴진스가 R&B로 분류 | GENRE_MAP에서 rnb가 kpop보다 앞에 위치 | kpop을 GENRE_MAP 최상단으로 이동 |
| Spotify 토큰 만료 오류 | access_token 1시간 유효기간 | refresh_token 자동 갱신 로직 추가 |
| AbortSignal.timeout Safari 미지원 | Safari 구버전 API 비호환 | AbortController로 교체 |

---

## 8. 파일 구조

```
MyMusicSave/
│
├── index.html          # 로그인 페이지 (Spotify OAuth 시작)
├── callback.html       # OAuth 콜백 처리
├── dashboard.html      # 메인 대시보드
├── library.html        # 전체 앨범 브라우저
├── album.html          # 앨범 상세 포스터
├── map.html            # 뮤직맵 (세계지도 시각화)
│
├── styles.css          # 전역 스타일 (CSS 변수, 리셋, 공통 컴포넌트)
│
├── netlify/
│   └── functions/
│       ├── auth.js     # Spotify 토큰 교환
│       ├── sync.js     # 보관함 동기화 + Last.fm 장르 분류
│       ├── spotify.js  # 앨범 상세 정보 조회
│       └── geocode.js  # MusicBrainz 아티스트 위치 조회
│
├── img/                # 이미지 리소스
├── netlify.toml        # Netlify 배포 설정 (Functions timeout)
├── .env                # 환경변수 (로컬 개발용, git 제외)
│
├── CLAUDE.md           # AI 협업 가이드라인
├── HOW_IT_WORKS.md     # 기술 동작 원리 설명서
├── PATCH_NOTES.js      # 버전별 변경사항
├── user_log.js         # 개발 세션 로그
└── PROJECT_REPORT.md   # 이 파일
```

---

## 9. 외부 API 연동

### Spotify Web API

| 엔드포인트 | 용도 | 사용 위치 |
|-----------|------|----------|
| `POST /api/token` | 토큰 교환 및 갱신 | auth.js |
| `GET /v1/me` | 유저 프로필 조회 | auth.js |
| `GET /v1/me/albums` | 보관함 앨범 전체 조회 (50개씩 페이지네이션) | sync.js |
| `GET /v1/albums/{id}` | 앨범 상세 + 트랙리스트 | spotify.js |

**인증 방식:** Authorization Code Flow
**필요 권한(scope):** `user-library-read`, `user-read-private`, `user-read-email`

### Last.fm API

| 메서드 | 용도 | 사용 위치 |
|--------|------|----------|
| `artist.getTopTags` | 아티스트 장르 태그 조회 | sync.js |

**특이사항:** Spotify API가 Basic 앱의 아티스트 장르 조회를 차단(403)하면서 Last.fm으로 대체. 아티스트별 상위 5개 태그를 가져와 GENRE_MAP으로 분류.

### MusicBrainz API

| 엔드포인트 | 용도 | 사용 위치 |
|-----------|------|----------|
| `GET /ws/2/artist?query=` | 아티스트 출신 국가 조회 | geocode.js |

**Rate Limit:** 초당 1개 요청 (엄격하게 적용됨)
**대응:** 1.1초 간격 순차 처리, 12명씩 배치 분할

### CartoDB (지도 타일)

Leaflet.js에서 다크 테마 지도 타일 제공. 별도 API 키 불필요.

---

## 10. 데이터베이스 설계

### users 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | Primary Key (Supabase 자동 생성) |
| spotify_id | text | Spotify 유저 고유 ID |
| display_name | text | Spotify 표시 이름 |
| email | text | 이메일 |
| created_at | timestamp | 최초 로그인 시각 |

### albums 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | Primary Key |
| user_id | uuid | users 테이블 외래키 |
| spotify_album_id | text | Spotify 앨범 고유 ID |
| title | text | 앨범 제목 |
| artist | text | 아티스트명 |
| genre | text | 분류된 장르 (hip-hop, kpop 등) |
| year | integer | 발매 연도 |
| cover_url | text | 앨범 커버 이미지 URL |
| added_at | timestamp | Spotify 보관함 저장 시각 |
| synced_at | timestamp | 마지막 동기화 시각 |

**Unique 제약:** `(user_id, spotify_album_id)` — 같은 유저의 같은 앨범 중복 방지

### artists 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | Primary Key |
| user_id | uuid | users 테이블 외래키 |
| name | text | 아티스트명 |
| country | text | 국가 코드 (US, KR 등) |
| continent | text | 대륙 분류 (americas, asia 등) |
| lat | float | 위도 |
| lng | float | 경도 |
| album_count | integer | 보관함 내 앨범 수 |

---

## 11. 배포 환경

**플랫폼:** Netlify

**환경변수 (Netlify 대시보드에 설정):**

| 변수명 | 용도 |
|--------|------|
| `SPOTIFY_CLIENT_ID` | Spotify 앱 클라이언트 ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify 앱 클라이언트 Secret |
| `LASTFM_API_KEY` | Last.fm API 키 |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SECRET_KEY` | Supabase service_role 키 |

**netlify.toml 설정:**
```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[functions.geocode]
  timeout = 26
```
geocode 함수만 타임아웃을 26초로 별도 설정 (MusicBrainz 배치 처리 시간 확보).

---

## 12. 버전 히스토리

| 버전 | 날짜 | 주요 변경사항 |
|------|------|--------------|
| v0.1 | 2026-03-23 | 프로젝트 초기화, music-archive v1에서 전환 |
| v0.2 | 2026-03-23 | Spotify OAuth 로그인, 보관함 동기화, Supabase 연동 |
| v0.3 | 2026-03-23 | 대시보드 UI 전면 개편 (포스터 감성) |
| v0.4 | 2026-03-23 | 뮤직맵 구현 (Leaflet.js + MusicBrainz) |
| v0.5 | 2026-03-24 | library.html, 장르 수동 수정, 토큰 자동 갱신, 연도 차트 밝기 차등 |
| v0.6 | 2026-03-24 | 히어로 리디자인, footer 5컬럼, 앨범 연도순 정렬, 구버전 파일 정리 |

---

## 13. 향후 개선 방향

### 단기 (기능 완성도)
- [ ] 로그인 페이지 "공유" 기능 실제 구현 또는 문구 제거
- [ ] 첫 방문자 온보딩 UX 개선 (동기화 안내 화면)
- [ ] 에러 메시지 사용자 친화적으로 개선
- [ ] 모바일 반응형 완성도 점검

### 중기 (기능 확장)
- [ ] 보관함 공유 기능 (공개 URL 생성)
- [ ] 앨범 메모/별점 기능
- [ ] 연도별/장르별 통계 상세 페이지
- [ ] 친구와 취향 비교 기능

### 장기 (인프라)
- [ ] 다중 사용자 지원 완성
- [ ] 자동 주기적 동기화 (Cron)
- [ ] PWA(Progressive Web App) 전환

---

*이 보고서는 2026년 3월 24일 기준으로 작성되었습니다.*
