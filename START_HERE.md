# MyMusicSave — 새 세션 시작 가이드

새 대화를 시작했다면 이 파일을 가장 먼저 읽어라.
그 다음 `PROJECT_STRUCTURE.md`를 읽어라.
로그 흐름이 필요하면 `user_log.js` 상단 15줄을 읽어라.

---

## 프로젝트 개요

**MyMusicSave**는 Spotify 보관함을 자동으로 불러와 시각화하는 개인 음악 통계 서비스.
Netlify 배포 + Netlify Functions 백엔드 구조. 현재 로컬(netlify dev)에서 개발 중.

- 로컬: `http://localhost:8888` (`netlify dev` 실행)
- 배포: Netlify (현재 월 usage 초과로 로컬 운영 중)
- 사용자: seanka (Spotify ID 기반, Last.fm: SeanKa0216)
- 현재 버전: **v1.0**

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | Vanilla JS, HTML, CSS (프레임워크 없음) |
| 디자인 | 다크 테마, Bebas Neue + Space Mono 폰트, 포스터 감성 |
| 인증 | Spotify OAuth 2.0 (Authorization Code Flow) |
| 데이터베이스 | Supabase (PostgreSQL, REST API) |
| 서버 함수 | Netlify Functions (Node.js) |
| 배포 | Netlify (로컬은 `netlify dev`) |
| 장르 분류 | Last.fm artist.getTopTags API |
| 아티스트 바이오 | Wikipedia API (한국어 우선) + DeepL 번역 (영어→한국어) |
| 아티스트 출신/활동시작 | MusicBrainz API |

---

## Supabase 테이블 구조

### users
```
id            uuid  PK
spotify_id    text  Spotify 유저 고유 ID
display_name  text
created_at    timestamp
```

### albums
```
id               uuid  PK
user_id          uuid  FK → users.id
spotify_album_id text  Spotify 앨범 ID (unique per user)
title            text
artist           text
genre            text  (자동 분류 또는 수동 수정)
year             int
cover_url        text
added_at         timestamp  Spotify 보관함 추가 날짜
synced_at        timestamp
```

---

## 구현된 페이지

| 파일 | 설명 |
|------|------|
| index.html | Spotify OAuth 로그인 페이지 |
| callback.html | OAuth 콜백 처리, localStorage 저장 후 dashboard.html로 이동 |
| dashboard.html | 메인 대시보드 — 히어로, 장르 word-cloud(인라인 필터), 연도 차트(→year.html), 아티스트 TOP10(→artist.html), 앨범 그리드, footer |
| library.html | 전체 보관함 — 장르/검색/정렬 필터, 클라이언트 사이드 |
| album.html | 앨범 상세 포스터 — 트랙리스트, 장르 수정, 아티스트명 클릭→artist.html |
| genre.html | 장르별 앨범 목록 — 히어로, 정렬, 앨범 그리드 (?genre=) |
| year.html | 연도별 앨범 목록 — 히어로, PREV/NEXT, 장르 분포, 앨범 그리드 (?year=) |
| artist.html | 아티스트 페이지 — 사진, 상징색, 출신/활동시작, 한국어 바이오, 앨범그리드, Top Tracks, Similar Artists (?name=) |
| profile.html | 프로필 + 설정 — Spotify 사진, 통계, Last.fm/ListenBrainz 설정, 로그아웃 |
| map.html | 뮤직맵 — Leaflet 지도, MusicBrainz 출신국 데이터, MarkerCluster |
| recommend.html | 추천 — ALBUMS / ARTISTS / TRACKS 3탭 |

---

## Netlify Functions

| 파일 | 역할 |
|------|------|
| auth.js | Spotify OAuth 코드 → 토큰 교환, Supabase users upsert |
| sync.js | Spotify 보관함 전체 동기화 → Supabase albums upsert, 수동 장르 보존 |
| recommend.js | 추천 엔진 (Last.fm similar → Spotify top-tracks 폴백) |
| artist-info.js | 아티스트 정보 — Spotify(사진/장르) + MusicBrainz(출신/활동시작) + Wikipedia/DeepL(한국어 바이오) + Last.fm(스크로블/TopTracks/Similar) |
| geocode.js | MusicBrainz로 아티스트 출신국 조회, Supabase upsert |
| spotify.js | 앨범 트랙리스트 조회 (album.html에서 사용) |

---

## 추천 엔진 (recommend.js) 현재 구조

### 중요 제약
- **Spotify `/v1/recommendations` — Development Mode 완전 차단 (2024.11 정책 변경)**
- **Spotify `/v1/artists?ids=` 배치 엔드포인트 — 2026.02 삭제됨** → 개별 호출로 대체

### 실제 동작 파이프라인
1. Last.fm `user.getTopArtists` → 시드 아티스트 이름
2. Last.fm `artist.getSimilar` → 비슷한 아티스트 발견
3. Spotify search → 아티스트 ID 변환
4. Spotify `/v1/artists/{id}/top-tracks` → 인기곡 (개별 호출)
5. 트랙에서 앨범/아티스트/트랙 탭 분리, 다양성 제한 (아티스트당 앨범 1개, 트랙 2개)

---

## 중요 기술 사항 (새 세션 시작 시 반드시 확인)

1. **Supabase 키 형식**: Legacy 형식 키 사용. `sb_` 접두사 신형 키는 REST API 불호환.

2. **수동 장르 보존**: sync.js는 동기화 전 기존 장르 조회 → 수동 설정 장르 덮어쓰지 않음.

3. **토큰 자동 갱신**: sync.js, artist-info.js 모두 401 시 refresh_token으로 자동 갱신.

4. **아티스트 상징색**: artist.html에서 canvas로 사진 dominant color 추출 → 이름 색상 + 바이오 좌측 바에 적용.

5. **한국어 바이오**: Wikipedia 한국어(200자 이상) → 없으면 영어 Wikipedia → DeepL API로 한국어 번역.

6. **대시보드 장르 word-cloud**: 클릭 시 인라인 필터 (genre.html 이동 아님). footer/다른 링크는 genre.html로 이동.

7. **환경변수**: `.env` 파일에서 관리. `DEEPL_API_KEY` 추가됨 (DeepL Free, 50만자/월).

---

## 환경변수 목록

```
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
LASTFM_API_KEY
SUPABASE_URL
SUPABASE_SECRET_KEY
DEEPL_API_KEY
```

---

## 새 세션에서 읽어야 할 파일 순서

1. **START_HERE.md** (이 파일) — 전체 맥락
2. **PROJECT_STRUCTURE.md** — 파일 구조 및 각 파일 역할 상세
3. **user_log.js 상단 15줄** — 최근 작업 흐름
4. **PATCH_NOTES.js 상단** — 최근 버전 변경사항
5. 특정 기능 작업 시 해당 파일 직접 읽기
