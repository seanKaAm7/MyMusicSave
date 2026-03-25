# MyMusicSave — 새 세션 시작 가이드

새 대화를 시작했다면 이 파일을 가장 먼저 읽어라.
그 다음 `PROJECT_STRUCTURE.md`를 읽어라.
로그 흐름이 필요하면 `user_log.js` 상단 10개를 읽어라.

---

## 프로젝트 개요

**MyMusicSave**는 Spotify 보관함을 자동으로 불러와 시각화하는 개인 음악 통계 서비스.
Netlify에 배포된 순수 정적 사이트 + Netlify Functions 백엔드 구조.

- 배포 URL: mymusicsave.netlify.app (또는 유사)
- 사용자: seanka (Spotify ID 기반, Last.fm 계정: SeanKa0216)
- 현재 버전: v0.8

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | Vanilla JS, HTML, CSS (프레임워크 없음) |
| 디자인 | 다크 테마, Bebas Neue + Space Mono 폰트, 포스터 감성 |
| 인증 | Spotify OAuth 2.0 (Authorization Code Flow) |
| 데이터베이스 | Supabase (PostgreSQL, REST API) |
| 서버 함수 | Netlify Functions (Node.js) |
| 지도 | Leaflet.js + CartoDB Dark Matter + MarkerCluster |
| 배포 | Netlify |
| 장르 분류 | Last.fm artist.getTopTags API (Spotify 장르 API 차단으로 대체) |

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
| dashboard.html | 메인 대시보드 — 히어로, 장르 word-cloud, 연도 차트, 아티스트 TOP10, 앨범 그리드, 5컬럼 footer |
| library.html | 전체 보관함 — 장르/검색/정렬 필터, 클라이언트 사이드 |
| album.html | 앨범 상세 — 장르 수동 수정 팝업 (Supabase PATCH) |
| map.html | 뮤직맵 — Leaflet 지도, MusicBrainz 출신국 데이터, MarkerCluster |
| recommend.html | 추천 — ALBUMS / ARTISTS / TRACKS 3탭, 호버 미리보기 패널 |

---

## Netlify Functions

| 파일 | 역할 |
|------|------|
| auth.js | Spotify OAuth 코드 → 토큰 교환, Supabase users upsert |
| sync.js | Spotify 보관함 전체 동기화 → Supabase albums upsert, 수동 장르 보존 |
| recommend.js | 추천 엔진 (아래 별도 설명) |
| geocode.js | MusicBrainz로 아티스트 출신국 조회, Supabase upsert |
| spotify.js | 구버전 트랙 조회 함수 (현재 거의 미사용) |

---

## 추천 엔진 구조 (recommend.js) — 반드시 숙지

### 중요 제약사항
- **Spotify `/v1/recommendations` — Development Mode에서 완전 차단됨 (2024년 11월 정책 변경)**
- 절대 이 엔드포인트를 메인 로직으로 사용하지 말 것. 시도해도 항상 빈 배열 반환.

### 현재 파이프라인 (2가지 경로)

**경로 1 (시도):** Spotify `/v1/recommendations`
- Last.fm `user.getTopArtists` (SeanKa0216, 6개월) → 아티스트 이름
- Spotify search로 아티스트 ID 변환
- Spotify `/v1/recommendations?seed_artists=...` 호출
- **실질적으로 항상 실패. 경로 2로 폴백.**

**경로 2 (폴백, 실제 동작):** Last.fm similar + Spotify top-tracks
- Last.fm `artist.getSimilar` → 비슷한 아티스트 이름 발견
- Spotify search로 아티스트 ID 변환
- Spotify `/v1/artists/{id}/top-tracks` → 인기곡 조회
- 트랙 목록에서 앨범/아티스트/트랙 탭 분리
- Spotify `/v1/artists?ids=...` 배치 조회 → 아티스트 이미지 + 장르

### 현재 상태
- **추천이 안 뜨고 있음 — 폴백 파이프라인 디버깅 필요**
- 원인 미확정: 폴백 코드 버그 또는 배포 미반영 가능성

---

## 중요 기술적 사실 (새 세션 시작 시 반드시 확인)

1. **Spotify 장르 API 차단**: `/v1/artists`의 genres 필드를 사용하려면 Basic 앱에서 불가. 장르 분류는 Last.fm `artist.getTopTags`로 대체.

2. **Supabase 키 형식**: 반드시 Legacy 형식 키 사용. `sb_` 접두사가 붙은 신형 키는 REST API에서 JWT 형식 불일치로 동작 안 함.

3. **수동 장르 보존**: sync.js는 동기화 전 기존 장르를 먼저 조회해서, 수동으로 설정된 장르가 있으면 덮어쓰지 않음.

4. **토큰 자동 갱신**: sync.js에서 Spotify 401 응답 시 refresh_token으로 자동 갱신 후 재시도.

5. **대시보드 bulk edit**: 앨범 카드 다중 선택 후 장르 일괄 변경 기능이 dashboard.html에 구현됨.

6. **OAuth scope**: `user-library-read user-read-private user-read-email user-top-read`

7. **Last.fm 사용자**: SeanKa0216 (추천 시드로 사용, 하드코딩 + localStorage 재정의 가능)

---

## 새 세션에서 읽어야 할 파일 순서

1. **START_HERE.md** (지금 이 파일) — 전체 맥락
2. **PROJECT_STRUCTURE.md** — 파일 구조 및 각 파일 역할 상세
3. **user_log.js 상단 15줄** — 최근 작업 흐름
4. **PATCH_NOTES.js 상단** — 최근 버전 변경사항
5. 특정 기능 작업 시 해당 파일 직접 읽기
