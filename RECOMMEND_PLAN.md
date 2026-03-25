# MyMusicSave — 추천 알고리즘 계획

> 작성일: 2026-03-25
> 현재 버전: v0.8

---

## 현재 상태 요약

### 구조
```
Last.fm user.getTopArtists (SeanKa0216, 6개월)
    ↓ 시드 아티스트 이름 목록
Last.fm artist.getSimilar (시드당 12명)
    ↓ 유사 아티스트 이름 목록
Spotify /v1/search → 아티스트 ID 변환
    ↓
Spotify /v1/artists/{id}/top-tracks (인기곡 조회)
    ↓
결과 분리: ALBUMS / ARTISTS / TRACKS 탭
```

### 완료된 작업 (v0.8 버그 수정, 2026-03-25)
- [x] 트랙 탭 보관함 앨범 필터 추가 — 기존에 보관함 앨범 트랙이 그대로 나오던 버그
- [x] 배치 아티스트 API 교체 — `/v1/artists?ids=` 2026.02 삭제됨 → 개별 `/v1/artists/{id}` 호출로 변경
- [x] Spotify `/v1/recommendations` 경로 완전 제거 — Dev Mode 차단으로 항상 실패, 폴백을 메인으로 변경
- [x] 다양성 강제 — 아티스트당 앨범 1개, 트랙 2개 제한
- [x] 탐색 범위 확대 — 시드 6개, 후보 25→15명 변환, 인기곡 조회 15명

### 알려진 한계
- Last.fm similar artists는 **태그 기반 유사도** — 취향이 섬세할수록 정확도 낮음
- Spotify `/v1/recommendations` (진짜 알고리즘) — **Extended Quota 필요, 개인 프로젝트 신청 불가**
- Extended Quota 조건: 법인 등록 + 월간 활성 사용자 25만 명 이상

---

## 단계별 개선 계획

### 1단계 — ListenBrainz 협업 필터링 (진행 중, 블록됨)

**개요:** Last.fm similar artists 대신 ListenBrainz의 실제 CF 알고리즘 사용

**동작 원리:**
```
ListenBrainz CF API → "seanka와 비슷한 취향의 사람들이 들은 곡" 목록
    ↓ MusicBrainz Recording ID
MusicBrainz API → Spotify Track ID 변환
    ↓
Spotify /v1/tracks/{id} → 트랙 정보 + 앨범 정보
    ↓
기존 결과와 병합
```

**API:**
- `GET https://api.listenbrainz.org/1/cf/recommendation/user/{username}/recording`
- 인증 없이 public API로 사용 가능
- MusicBrainz Recording ID 반환 → Spotify ID로 변환 필요

**현재 블로커:**
- ListenBrainz 가입 완료, Last.fm import 시도 중 — 0트랙 문제 미해결
- import 완료 후 CF 데이터가 생성되기까지 추가 시간 필요
- 스크로블 수(1,579)가 적어 CF 품질이 높지 않을 수 있음

**구현 예상 복잡도:** 높음 (MusicBrainz → Spotify ID 변환 파이프라인 추가 필요)

---

### 2단계 — Spotify Audio Features 필터링

**개요:** 현재 추천 결과를 음향 특성 기준으로 추가 필터링

**동작 원리:**
```
현재 추천 트랙 목록
    ↓
Spotify /v1/audio-features?ids=... → danceability, energy, valence 등 조회
    ↓
보관함 앨범의 평균 오디오 특성 계산 → 사용자 취향 프로파일
    ↓
취향 프로파일과 가까운 트랙만 필터링
```

**Spotify audio-features 제공 값:**
| 특성 | 설명 |
|------|------|
| danceability | 댄스 친화도 (0~1) |
| energy | 에너지 수준 (0~1) |
| valence | 긍정/부정 분위기 (0~1) |
| acousticness | 어쿠스틱 정도 (0~1) |
| instrumentalness | 보컬 부재 확률 (0~1) |
| tempo | BPM |

**장점:** 취향 벡터 기반 필터링으로 전혀 다른 장르가 추천되는 문제 감소
**단점:** audio-features 조회가 추가 API 콜 증가, 타임아웃 위험

**구현 예상 복잡도:** 중간

**참고:** `/v1/audio-features?ids=` 배치 조회 가능 여부 2026.02 API 변경사항 재확인 필요

---

### 3단계 — 결과 품질 개선 (소규모)

- [ ] 최근 6개월이 아닌 전체 기간 Last.fm top artists로도 시드 다양성 확보
- [ ] 시드 아티스트와 추천 아티스트가 장르 편향 심할 때 보정 로직
- [ ] 앨범 추천에 발매연도 필터 옵션 (최신곡 위주 / 클래식 위주)

---

## 실현 불가능한 것

| 방법 | 이유 |
|------|------|
| Spotify `/v1/recommendations` | Development Mode 차단, Extended Quota = 법인+25만 MAU |
| Spotify 사용자 취향 학습 | seanka 본인이 Spotify를 안 씀, 청취 기록 없음 |
| Spotify 수준의 ML 추천 | 자체 ML 인프라 없이는 불가능 |

---

## 다음 액션

1. ListenBrainz import 문제 해결 대기
2. import 완료되면 1단계 구현
3. 그 전에 다른 기능 작업
