/*
-----------------------------------------
[Log #6] [2026-03-23]
 * 사용자: 뮤직맵 구현 요청
 * 작업: (1) netlify/functions/geocode.js 작성 — MusicBrainz API 순차 조회(1.1초 간격), 55개국 country코드→위경도 매핑, 대륙 분류, Supabase artists 테이블 upsert. (2) netlify.toml에 geocode timeout=26 추가. (3) map.html 작성 — Leaflet.js + CartoDB Dark Matter 타일, MarkerCluster, 앨범수 비례 마커 크기, 우측 패널(대륙→국가→아티스트 트리), 배치 처리 진행률 바(20명씩). (4) Supabase SQL: artists 테이블 생성 필요 (continent 컬럼 포함).
-----------------------------------------
*/
/*
-----------------------------------------
[Log #5] [2026-03-23]
 * 사용자: 이름이 너무 커서 부담스럽고, 장르별로 앨범 볼 수 있게 해달라
 * 작업: (1) hero-username 폰트 크기 축소 — clamp(5rem,12vw,10rem) → clamp(2.8rem,5vw,4.5rem). (2) 장르 타이포그래피 클릭 시 해당 장르 앨범만 커버 그리드에 필터링, 재클릭 시 해제(최근 20장 복귀). (3) 앨범 섹션 상단에 현재 선택 장르명 + 장수 카운트 표시.
-----------------------------------------
*/
/*
-----------------------------------------
[Log #4] [2026-03-23]
 * 사용자: 대시보드 UI를 포스터 감성으로 개편
 * 작업: (1) dashboard.html 전면 재설계 — 히어로 섹션(대형 Bebas Neue 유저명 + Space Mono 통계), 장르 섹션(도넛 차트 제거, 앨범 수 비례 타이포그래피 word-cloud로 교체), 앨범 커버 그리드 섹션(최근 20장 10열, 호버 오버레이), 연도 차트(배경 제거/단순화), 아티스트 TOP 10(포스터 트랙리스트 스타일 2자리 넘버). (2) XSS 방지 escHtml 함수 추가. (3) 뮤직맵 링크 버튼 헤더에 추가.
-----------------------------------------
*/
/*
-----------------------------------------
[Log #3] [2026-03-23]
 * 사용자: 동기화 오류 해결 및 장르 분류 정상화
 * 작업: (1) Spotify /v1/artists 403 오류 확인 — 2024년 API 정책 변경으로 Basic 앱 차단. (2) Last.fm API로 아티스트 장르 조회 대체 — LASTFM_API_KEY 환경변수 추가. (3) Supabase Legacy service_role 키로 교체 — sb_secret_ 키가 REST API JWT 형식 아님. (4) upsert 409 오류 수정 — on_conflict=user_id,spotify_album_id 파라미터 추가. (5) 최종 결과: 664장 앨범, 404 아티스트, 장르 9개 정상 분류 및 차트 렌더링 완료.
-----------------------------------------
*/
/*
-----------------------------------------
[Log #2] [2026-03-23]
 * 사용자: 슈퍼베이스는 솔직히 뭔지 모른다. Supabase 프로젝트 생성 완료, API 키 발급, SQL로 users/albums 테이블 생성 완료. .env에 Supabase 키 추가.
 * 작업: (1) .env에 SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY 추가. (2) netlify/functions/auth.js 작성 — Spotify OAuth 코드→토큰 교환, Spotify 유저 프로필 조회, Supabase users 테이블 upsert, 토큰+유저 정보 반환. (3) callback.html 작성 — 토큰 localStorage 저장, 유저 정보 저장, dashboard.html로 리다이렉트, 에러 처리. (4) index.html 전면 교체 — 로그인 전 메인 페이지, Spotify 로그인 버튼, 기능 소개 3가지. (5) dashboard.html 기본 구조 작성 — 통계 카드(앨범/아티스트/장르), 장르 도넛 차트, 연도별 바 차트, 아티스트 TOP 10, 최근 저장 앨범, 동기화 버튼.
-----------------------------------------
*/
/*
-----------------------------------------
[Log #1] [2026-03-23]
 * 사용자: START_HERE.md 읽고 시작해줘. 그리고 너 이거 프롬프트 먼저 입력할게 기존 로그, 패치노트 파일은 지우고 새롭게 만들어.
 * 작업: START_HERE.md 및 mymusicsave_plan.md 열람 후 프로젝트 전체 맥락 파악 완료. MyMusicSave는 Spotify OAuth + Supabase + Netlify Functions 기반의 신규 서비스로 기존 music-archive v1 코드베이스에서 전환. 사용자 지시에 따라 user_log.js 및 PATCH_NOTES.js를 MyMusicSave 프로젝트 기준으로 초기화 완료. 프로젝트 시스템 지침(로그 형식, 패치노트 형식, 언어 규칙) 수신 및 적용.
-----------------------------------------
*/
