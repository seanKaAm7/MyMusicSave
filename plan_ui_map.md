# MyMusicSave — UI 개편 & 뮤직 맵 기획안

작성일: 2026-03-23

---

## 1. 대시보드 UI 포스터 감성 개편

### 현재 문제
- 일반 SaaS 대시보드처럼 생김 (카드 + 차트)
- 음악 아카이브 특유의 에디토리얼/포스터 감성 없음
- 정보 밀도가 낮고 시각적 임팩트 부족

### 목표
앨범 포스터처럼: 큰 타이포그래피, 선명한 구분선, 최소한의 색상, 정보가 레이아웃 자체로 말하게

### 레이아웃 재설계

#### 히어로 섹션 (상단)
```
┌─────────────────────────────────────────┐
│  MYMUSICSAVE          [동기화] [로그아웃] │
├─────────────────────────────────────────┤
│                                         │
│  SEANKA                                 │  ← Bebas Neue, 매우 크게
│  664 ALBUMS  ·  404 ARTISTS  ·  9 GENRES│  ← Space Mono, 작게
│                                         │
└─────────────────────────────────────────┘
```

#### 장르 섹션
- 도넛 차트 제거
- 장르 이름을 앨범 수 비례해서 크기 차등 텍스트로 표시
- 예: HIP-HOP (220) 크게, JAZZ (12) 작게
- Bebas Neue, 흰색/회색 혼합

```
┌─────────────────────────────────────────┐
│  GENRE                                  │
├─────────────────────────────────────────┤
│                                         │
│  HIP-HOP          POP      ROCK         │
│  220              87       54           │
│                                         │
│  R&B    ELECTRONIC    JAZZ    KPOP      │
│  43     31            28      22        │
│                                         │
└─────────────────────────────────────────┘
```

#### 앨범 커버 그리드 섹션
- 최근 저장한 앨범 커버 20장을 벽돌처럼 빽빽하게 배치
- 호버 시 앨범명/아티스트 오버레이
- 클릭 시 album.html 이동
- 포스터 하단 "작품 목록" 같은 느낌

#### 연도 섹션
- 기존 바 차트 유지하되 스타일 개선
- 배경 제거, 선만 남기기
- x축 레이블 Bebas Neue로

#### 아티스트 TOP 10
- 현재 텍스트 리스트 유지
- 번호를 크게, 이름을 옆에 (포스터 트랙리스트 스타일 그대로)

### 참고 CSS
기존 styles.css의 아래 클래스 재활용:
- `.poster-track-row` — 아티스트 목록에 적용
- `.poster-title` — 히어로 유저명에 적용
- `Space Mono` — 숫자 표기에 적용
- `--border` — 섹션 구분선

---

## 2. 뮤직 맵 (map.html)

### 개요
보관함에 있는 아티스트들의 출신 지역을 세계 지도에 핀으로 표시.
어떤 나라/도시 음악을 많이 듣는지 시각적으로 보여줌.

### 기술 스택

| 역할 | 기술 | 이유 |
|------|------|------|
| 지도 렌더링 | Leaflet.js (CDN) | 무료, 경량, 커스터마이징 쉬움 |
| 지도 타일 | CartoDB Dark Matter | 다크 테마, 무료, 상업 사용 가능 |
| 아티스트 위치 데이터 | MusicBrainz API | 무료, API키 불필요, 아티스트 출신지 DB |
| 저장 | Supabase artists 테이블 | 한 번 조회 후 저장, 재조회 방지 |

### Supabase 테이블 추가 — artists

```sql
CREATE TABLE artists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  country      text,
  city         text,
  lat          float,
  lng          float,
  album_count  int DEFAULT 1,
  mb_id        text,  -- MusicBrainz 아티스트 ID
  synced_at    timestamp DEFAULT now(),
  UNIQUE(user_id, name)
);
```

### MusicBrainz API 사용법

```
GET https://musicbrainz.org/ws/2/artist/?query={아티스트명}&fmt=json&limit=1
```

응답에서 필요한 필드:
- `artists[0].id` → MusicBrainz ID
- `artists[0].country` → 국가 코드 (예: US, KR, GB)
- `artists[0].area.name` → 출신 도시/지역명
- `artists[0]["begin-area"].name` → 출생 도시 (더 정확)

국가 코드 → 위경도 변환은 미리 만든 매핑 테이블 사용 (주요 100개국).

**Rate limit:** 초당 1요청 → 아티스트 404명 기준 약 7분 소요.
동기화 버튼 따로 두거나 백그라운드 처리.

### Netlify Functions 추가 — geocode.js

```
POST /.netlify/functions/geocode
body: { spotify_id, artist_names: [...] }
```

동작:
1. artist_names 배열 받음
2. MusicBrainz에 순차 조회 (1초 간격)
3. 국가/도시/위경도 추출
4. Supabase artists 테이블에 upsert
5. 완료 카운트 반환

### 화면 구성 (map.html)

```
┌────────────────────────────────────────────────────┐
│  MYMUSICSAVE  /  MUSIC MAP          [대시보드로]    │
├──────────────────────────────────┬─────────────────┤
│                                  │  ASIA      184  │
│                                  │  ├ Korea    54  │
│       [세계 지도 — 다크]          │  ├ Japan    12  │
│                                  │  └ ...          │
│   ● ●    ●                       │                 │
│       ●●●   ●                    │  N.AMERICA  55  │
│  ●                    ● ●        │  EUROPE     32  │
│                                  │  ...            │
│                                  ├─────────────────┤
│                                  │  [클릭 시]      │
│                                  │  LOS ANGELES    │
│                                  │  Kendrick Lamar │
│                                  │  Tyler, The...  │
└──────────────────────────────────┴─────────────────┘
```

- 지도: 전체 높이, 다크 타일
- 마커: 흰색 원, 앨범 수에 비례해서 크기 조절
- 우측 패널: 대륙 → 국가 → 도시 트리 (접기/펼치기)
- 마커 클릭 or 도시 클릭 → 해당 아티스트 목록 표시

### 현실적인 제약 및 대응

| 문제 | 대응 |
|------|------|
| MusicBrainz 매칭 실패 (한글 이름 등) | 매칭 실패 아티스트는 지도에서 제외, 별도 "미분류" 목록 |
| 초당 1요청 rate limit | 순차 처리 + 진행률 표시 바 |
| 같은 도시 아티스트 여럿 | 마커 클러스터링 (Leaflet.markercluster 플러그인) |
| 신인/소규모 아티스트 데이터 없음 | 없으면 조용히 제외 |

---

## 구현 순서

### 1단계 — 대시보드 UI 개편 (1~2시간)
- dashboard.html 레이아웃 재설계
- styles.css에 신규 컴포넌트 스타일 추가
- 기존 chart.js 일부 제거, 타이포 기반 장르 표시로 교체

### 2단계 — artists 테이블 추가 (30분)
- Supabase SQL Editor에서 artists 테이블 생성
- sync.js에서 동기화 시 아티스트 목록도 저장하도록 수정

### 3단계 — geocode.js 함수 (2~3시간)
- MusicBrainz API 순차 조회
- 국가코드 → 위경도 매핑 테이블
- Supabase artists 테이블 업데이트

### 4단계 — map.html 구현 (2~3시간)
- Leaflet.js 지도 렌더링
- 마커 표시 및 클러스터링
- 우측 트리 패널
- 클릭 인터랙션

---

## 미결정 사항

- 뮤직 맵 데이터 수집: 동기화 버튼 한 번에 처리 vs 별도 "지도 업데이트" 버튼
- 마커 색상: 장르별로 다른 색 vs 단일 흰색
- 모바일 대응 여부 (지도는 모바일에서 UX가 어려움)
