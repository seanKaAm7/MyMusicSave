/*
---------
[2026년 03월 24일 — v0.6]
 * 대시보드 footer — Last.fm 스타일 5컬럼 (MYMUSICSAVE / GENRES / ACCOUNT / POWERED BY / FOLLOW)
 * GENRES 컬럼 — Hip-Hop, R&B, K-Pop, Rock, Electronic, Jazz 장르별 라이브러리 바로가기
 * POWERED BY 컬럼 — Spotify, Last.fm, MusicBrainz, Supabase 외부 링크
 * 히어로 MYMUSICSAVE 로고 대형화 — clamp(3rem,8vw,5.5rem), 이름은 Space Mono 0.72rem으로 제일 작게
 * 앨범 그리드 정렬 — 발매 연도 최신순(year.desc)으로 변경
 * 구버전 파일 정리 — app.js, data.js, genre/year/artist.html, 기획문서 5개, scripts/node_modules 삭제
---------
*/
/*
---------
[2026년 03월 24일 — v0.5]
 * 수동 장르 수정 (album.html) — 팝업 오버레이, 12개 장르 선택, Supabase PATCH 즉시 저장
 * library.html 신규 — 전체 앨범 그리드, 장르/검색/정렬 필터
 * Spotify 토큰 자동 갱신 (sync.js) — 401 시 refresh_token으로 갱신 후 재시도
 * 연도 차트 밝기 차등 — 앨범 수 비례 opacity
 * 대시보드 히어로 섹션 리디자인 — 중앙 정렬, MYMUSICSAVE 로고 배지, 이름 작게
---------
*/
/*
---------
[2026년 03월 23일 — v0.4]
 * 뮤직맵 (map.html) 구현
 * netlify/functions/geocode.js — MusicBrainz API + 55개국 위경도 매핑 + Supabase upsert
 * Leaflet.js + CartoDB Dark Matter 다크 지도 타일
 * MarkerCluster — 겹치는 마커 자동 클러스터링
 * 마커 크기 앨범 수 비례
 * 우측 패널 — 대륙/국가 트리, 클릭 시 아티스트 목록
 * 배치 처리 (20명씩) + 하단 진행률 바
 * 이미 처리된 아티스트 자동 제외 (중복 조회 방지)
---------
*/
/*
---------
[2026년 03월 23일 — v0.3]
 * dashboard.html 포스터 감성 UI 전면 개편
 * 히어로 섹션 — 대형 유저명(Bebas Neue) + Space Mono 통계 한 줄
 * 장르 — 도넛 차트 제거, 앨범 수 비례 타이포그래피 word-cloud
 * 최근 앨범 — 10열 커버 그리드 20장, 호버 오버레이 (앨범명/아티스트)
 * 연도 차트 — 배경/테두리 제거, Bebas Neue 레이블, 미니멀 스타일
 * 아티스트 TOP 10 — 포스터 트랙리스트 2자리 넘버 스타일
 * 헤더에 뮤직맵 링크 버튼 추가
---------
*/
/*
---------
[2026년 03월 23일 — v0.2]
 * Spotify OAuth 로그인 구현 (index.html → callback.html → dashboard.html)
 * netlify/functions/auth.js — Spotify 토큰 교환 + Supabase 유저 저장
 * netlify/functions/sync.js — 보관함 동기화 + Last.fm 장르 분류
 * dashboard.html — 통계 카드, 장르 도넛 차트, 연도 바 차트, 아티스트 TOP 10, 최근 앨범
 * Supabase Legacy anon/service_role 키로 교체 (신규 sb_ 키 REST API 비호환)
 * upsert on_conflict 파라미터 추가로 장르 업데이트 정상화
 * Last.fm API로 Spotify 아티스트 장르 조회 대체 (Spotify 403 정책 변경 대응)
---------
*/
/*
---------
[2026년 03월 23일 — v0.1 MyMusicSave 프로젝트 초기화]
 * music-archive v1 코드베이스를 기반으로 MyMusicSave 프로젝트 전환 시작
 * START_HERE.md, mymusicsave_plan.md 기획 문서 작성 완료
 * user_log.js, PATCH_NOTES.js 신규 초기화
---------
*/
