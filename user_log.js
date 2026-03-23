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
