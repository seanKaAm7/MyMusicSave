# MyMusicSave — 프로젝트 구조

---

## 폴더 및 파일 구조

```
MyMusicSave/
│
├── index.html              # Spotify 로그인 페이지 (로그인 전 진입점)
├── callback.html           # Spotify OAuth 콜백 처리
├── dashboard.html          # 메인 대시보드 (로그인 후 진입점)
├── library.html            # 전체 보관함
├── album.html              # 앨범 상세 페이지
├── map.html                # 뮤직맵 (아티스트 출신국 지도)
├── recommend.html          # 음악 추천 (3탭)
│
├── styles.css              # 전역 CSS (다크 테마, Bebas Neue, Space Mono)
│
├── netlify/
│   └── functions/
│       ├── auth.js         # Spotify OAuth → Supabase 유저 생성
│       ├── sync.js         # Spotify 보관함 → Supabase 동기화
│       ├── recommend.js    # 추천 엔진
│       ├── geocode.js      # MusicBrainz 지오코딩
│       └── spotify.js      # 구버전 트랙 조회 (현재 미사용)
│
├── img/                    # 로컬 앨범 커버 이미지 (구버전 잔재, 미사용)
│
├── netlify.toml            # Netlify 설정 (functions 경로, 타임아웃)
├── START_HERE.md           # 새 세션 시작 가이드 (핵심 문서)
├── PROJECT_STRUCTURE.md    # 이 파일
├── PATCH_NOTES.js          # 버전별 변경 이력
├── user_log.js             # 개발 작업 로그 (Append-only, 최신 상단)
├── HOW_IT_WORKS.md         # 기술 동작 원리 설명
├── PROJECT_REPORT.md       # 프로젝트 상세 보고서
└── CLAUDE.md               # Claude Code 작업 지침
```

---

## 페이지별 상세

### index.html
- Spotify OAuth 로그인 버튼
- 클릭 시 Spotify 인증 페이지로 이동
- scope: `user-library-read user-read-private user-read-email user-top-read`
- 로그인 상태면 dashboard.html로 자동 이동

### callback.html
- Spotify가 code 파라미터와 함께 리다이렉트
- `/.netlify/functions/auth`에 POST → access_token, refresh_token, user 정보 수신
- localStorage에 저장: `mms_access_token`, `mms_refresh_token`, `mms_user`
- dashboard.html로 이동

### dashboard.html
주요 섹션:
- **헤더**: MYMUSICSAVE 로고, 보관함/추천/지도 링크, 동기화 버튼
- **히어로**: MYMUSICSAVE 대형 로고 (Bebas Neue clamp), 유저명 소형 (Space Mono)
- **장르 word-cloud**: 앨범 수 비례 폰트 크기, 클릭 시 library.html?genre= 이동
- **연도 차트**: 미니멀 바 차트, 앨범 수 비례 opacity
- **아티스트 TOP 10**: 포스터 트랙리스트 스타일, 번호 + 이름 + 앨범 수
- **앨범 그리드**: 최근 20장, 발매연도 최신순, 호버 오버레이
- **Bulk edit 모드**: 앨범 다중 선택 후 장르 일괄 변경 (EDIT MODE 버튼 토글)
- **Footer**: 5컬럼 (MYMUSICSAVE / GENRES / ACCOUNT / POWERED BY / FOLLOW)

데이터 흐름: Supabase REST API → 직접 fetch (Netlify Function 거치지 않음)

### library.html
- 전체 앨범 그리드 (auto-fill minmax)
- 클라이언트 사이드 필터: 장르 드롭다운, 검색창, 정렬 (발매연도/추가날짜)
- 앨범 클릭 → album.html?id={spotify_album_id}

### album.html
- Supabase에서 단일 앨범 데이터 조회
- 장르 수정 팝업: 12개 장르 선택 버튼 → Supabase PATCH 즉시 저장
- 커버, 제목, 아티스트, 연도, 장르 표시

### map.html
- Leaflet.js + CartoDB Dark Matter 타일
- MarkerCluster로 겹치는 마커 클러스터링
- `/.netlify/functions/geocode` 호출 → MusicBrainz로 출신국 조회
- 우측 패널: 대륙/국가 트리, 클릭 시 해당 아티스트 목록
- 배치 처리 20명씩, 진행률 바

### recommend.html
- **추천 받기** 버튼 클릭 → `/.netlify/functions/recommend` POST
- 결과 로드 후 탭 바 등장: ALBUMS / ARTISTS / TRACKS (각 탭에 결과 수 배지)
- 탭 전환은 클라이언트 사이드 (데이터 1번만 조회)
- 각 카드에 마우스 올리면 호버 미리보기 패널 표시 (제목/아티스트/장르/설명)
- 클릭 시 Spotify 앱으로 이동

---

## Netlify Functions 상세

### auth.js
```
POST /.netlify/functions/auth
Body: { code: string }
흐름:
  1. Spotify /api/token으로 코드 교환 → access_token, refresh_token
  2. Spotify /v1/me로 유저 정보 조회
  3. Supabase users 테이블에 upsert
반환: { access_token, refresh_token, user: { spotify_id, display_name } }
```

### sync.js
```
POST /.netlify/functions/sync
Body: { access_token, refresh_token, spotify_id }
흐름:
  1. Supabase에서 user_id 조회
  2. Spotify /v1/me/albums 전체 페이지네이션 (50개씩)
  3. 401 시 refresh_token으로 토큰 갱신 후 재시도
  4. 기존 저장된 장르 조회 (수동 편집 보존용)
  5. Last.fm artist.getTopTags로 장르 분류
  6. Supabase albums upsert (50개씩 청크)
반환: { count: number, new_access_token?: string }
타임아웃: 26초
```

### recommend.js
```
POST /.netlify/functions/recommend
Body: { access_token, spotify_id, lastfm_username }
흐름:
  경로 1 (항상 실패): Spotify /v1/recommendations → Development Mode 차단
  경로 2 (실제 동작):
    1. Last.fm user.getTopArtists (SeanKa0216, 6개월)
    2. Last.fm artist.getSimilar → 비슷한 아티스트 발견
    3. Spotify search → 아티스트 ID 변환
    4. Spotify /v1/artists/{id}/top-tracks → 인기곡 조회
    5. Spotify /v1/artists?ids=... 배치 → 이미지 + 장르
    6. 트랙에서 앨범/아티스트/트랙 분리
반환: { ok: true, recommendations: [], artists: [], tracks: [] }
타임아웃: 26초
현재 상태: 추천이 뜨지 않음 — 디버깅 필요
```

### geocode.js
```
POST /.netlify/functions/geocode
Body: { artists: [{ name, spotify_artist_id }], user_id }
흐름:
  1. MusicBrainz API로 아티스트 출신국 조회
  2. 55개국 위경도 매핑 → 좌표 변환
  3. Supabase artist_locations 테이블 upsert
반환: { processed: number }
타임아웃: 26초
```

---

## 데이터 흐름 요약

```
[사용자]
    |
    | Spotify 로그인
    v
[index.html] → [callback.html] → [auth.js] → Supabase users
                                           → localStorage 저장
    |
    | 보관함 동기화 (수동 버튼)
    v
[dashboard.html] → [sync.js] → Spotify /v1/me/albums
                             → Last.fm artist.getTopTags (장르)
                             → Supabase albums upsert
    |
    | 데이터 조회 (직접 fetch)
    v
[dashboard.html / library.html / album.html]
    → Supabase REST API 직접 호출

[recommend.html] → [recommend.js] → Last.fm (시드)
                                  → Spotify (콘텐츠)

[map.html] → [geocode.js] → MusicBrainz → Supabase
```

---

## 환경변수 목록 (.env / Netlify 대시보드)

```
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
LASTFM_API_KEY
SUPABASE_URL
SUPABASE_SECRET_KEY   # Legacy 형식 키 (sb_ 접두사 없는 것)
```

---

## 장르 분류 체계

Last.fm 태그 → 앱 내 장르 변환:

| 앱 내 장르 | Last.fm 태그 키워드 |
|-----------|-------------------|
| K-POP | k-pop, kpop, korean pop, korean idol |
| HIP-HOP | rap, hip hop, trap, drill, k-rap |
| R&B | r&b, rnb, soul, neo soul |
| ROCK | rock, indie rock, alternative rock, punk, metal |
| ALTERNATIVE | indie, alternative, folk, k-indie |
| JAZZ | jazz, bebop, fusion, bossa nova |
| ELECTRONIC | electronic, edm, house, techno, ambient |
| CLASSICAL | classical, orchestra, chamber |
| SOUL | funk, disco, groove |
| SOUNDTRACK | soundtrack, ost, score |
| POP | pop |

---

## 알려진 제약 및 이슈

| 항목 | 내용 |
|------|------|
| Spotify `/v1/recommendations` | Development Mode에서 차단 (2024.11 정책 변경). Extended Access 신청 필요. |
| Spotify 아티스트 장르 API | Basic 앱에서 genres 필드 차단 → Last.fm으로 대체 중 |
| Supabase 키 형식 | 반드시 Legacy 키 사용. sb_ 접두사 신형 키는 REST API 불호환 |
| 추천 기능 | 현재 결과가 뜨지 않음. recommend.js 폴백 파이프라인 디버깅 필요 |
| Spotify 스트리밍 기록 | 사용자(seanka)에게 없음. 추천 시드는 Last.fm SeanKa0216 기록으로 대체 |
