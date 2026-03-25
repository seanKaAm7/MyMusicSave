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
├── genre.html              # 장르별 앨범 목록 (?genre=)
├── year.html               # 연도별 앨범 목록 (?year=)
├── artist.html             # 아티스트 페이지 (?name=)
├── profile.html            # 프로필 + 설정
├── map.html                # 뮤직맵 (아티스트 출신국 지도)
├── recommend.html          # 음악 추천 (3탭)
│
├── styles.css              # 전역 CSS (다크 테마, Bebas Neue, Space Mono)
│
├── netlify/
│   └── functions/
│       ├── auth.js         # Spotify OAuth → Supabase 유저 생성
│       ├── sync.js         # Spotify 보관함 → Supabase 동기화
│       ├── artist-info.js  # 아티스트 상세 정보 (Spotify + MusicBrainz + Wikipedia + Last.fm)
│       ├── recommend.js    # 추천 엔진
│       ├── geocode.js      # MusicBrainz 지오코딩
│       └── spotify.js      # 앨범 트랙리스트 조회
│
├── img/                    # 로컬 앨범 커버 이미지 (구버전 잔재, 미사용)
│
├── netlify.toml            # Netlify 설정 (functions 경로, 타임아웃)
├── START_HERE.md           # 새 세션 시작 가이드 (핵심 문서)
├── PROJECT_STRUCTURE.md    # 이 파일
├── PATCH_NOTES.js          # 버전별 변경 이력
├── user_log.js             # 개발 작업 로그 (Append-only, 최신 상단)
├── HOW_IT_WORKS.md         # 기술 동작 원리 설명
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
- **장르 word-cloud**: 앨범 수 비례 폰트 크기, 클릭 시 인라인 필터 (같은 페이지에서 앨범 그리드 필터링)
- **연도 차트**: 미니멀 바 차트, 앨범 수 비례 opacity, 클릭 시 year.html로 이동
- **아티스트 TOP 10**: 포스터 트랙리스트 스타일, 번호 + 이름 + 앨범 수, 클릭 시 artist.html로 이동
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
- 아티스트명 클릭 시 artist.html로 이동

### genre.html
- URL 파라미터 `?genre=` 로 장르 수신
- 해당 장르 앨범 전체 그리드 표시
- 히어로 섹션, 앨범 수 표시, 발매연도순 정렬

### year.html
- URL 파라미터 `?year=` 로 연도 수신
- 해당 연도 앨범 전체 그리드 표시
- PREV/NEXT 네비게이션, 장르 분포 미니 차트

### artist.html
- URL 파라미터 `?name=` 로 아티스트명 수신
- `/.netlify/functions/artist-info` POST 호출
- 2컬럼 히어로: 사진(좌) + 이름/메타데이터(우)
- Canvas API로 사진에서 dominant color 추출 → 이름 색상 + 바이오 좌측 바에 적용
- 메타 그리드: 출신 / 활동 시작 / 장르 / 앨범 수 / 스크로블 / Spotify 링크
- 내 보관함 앨범 그리드 (Supabase 직접 조회)
- Last.fm Top Tracks (5곡)
- Similar Artists (6명, 원형 카드, Spotify 사진)

### profile.html
- Spotify 프로필 사진, 유저명, 가입일
- 통계: 총 앨범 수, 장르 수, 아티스트 수
- Last.fm 연동 설정 (username 입력/저장)
- ListenBrainz 설정
- 로그아웃 버튼

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
- 각 카드에 마우스 올리면 호버 미리보기 패널 표시
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

### artist-info.js
```
POST /.netlify/functions/artist-info
Body: { name, token, refresh_token, lastfm? }
흐름:
  1. Spotify search → 아티스트 ID, 사진, 장르
  2. 401 시 refresh_token으로 토큰 갱신 후 재시도
  3. MusicBrainz → 출신 지역(begin-area), 활동 시작 연도(life-span.begin)
  4. Wikipedia 한국어 (200자 이상) → 없으면 영어 Wikipedia → DeepL 한국어 번역
  5. Last.fm artist.getInfo → 스크로블 수 (userplaycount)
  6. Last.fm artist.getTopTracks → Top 5곡
  7. Last.fm artist.getSimilar → Similar 6명
  8. Similar 아티스트들 Spotify 사진 조회
반환: { spotify, musicbrainz, bio, playcount, topTracks, similar, new_token? }
```

### recommend.js
```
POST /.netlify/functions/recommend
Body: { access_token, spotify_id, lastfm_username }
흐름:
  1. Last.fm user.getTopArtists → 시드 아티스트
  2. Last.fm artist.getSimilar → 비슷한 아티스트 발견
  3. Spotify search → 아티스트 ID 변환
  4. Spotify /v1/artists/{id}/top-tracks → 인기곡 (개별 호출)
  5. 트랙에서 앨범/아티스트/트랙 탭 분리, 다양성 제한
반환: { ok: true, recommendations: [], artists: [], tracks: [] }
타임아웃: 26초
제약: Spotify /v1/recommendations — Development Mode 완전 차단 (2024.11)
      Spotify /v1/artists?ids= 배치 엔드포인트 — 2026.02 삭제됨 → 개별 호출로 대체
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

### spotify.js
```
GET /.netlify/functions/spotify?id={albumId}
Body: { access_token }
역할: 앨범 트랙리스트 조회 (album.html에서 사용)
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
[dashboard / library / album / genre / year]
    → Supabase REST API 직접 호출

[artist.html] → [artist-info.js] → Spotify (사진/장르)
                                 → MusicBrainz (출신/활동시작)
                                 → Wikipedia + DeepL (한국어 바이오)
                                 → Last.fm (스크로블/TopTracks/Similar)

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
DEEPL_API_KEY         # DeepL Free (키 끝이 :fx, 50만자/월)
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
| Spotify `/v1/artists?ids=` | 2026.02 배치 엔드포인트 삭제. 개별 `/v1/artists/{id}` 호출로 대체. |
| Supabase 키 형식 | 반드시 Legacy 키 사용. sb_ 접두사 신형 키는 REST API 불호환 |
| DeepL Free | 50만자/월 제한. 키 끝이 `:fx`인지 확인 필요. |
| MusicBrainz rate limit | 1req/sec. geocode.js는 20명씩 배치 처리, artist-info.js는 단건이라 문제 없음. |
