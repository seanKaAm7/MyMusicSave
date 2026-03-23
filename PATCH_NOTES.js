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
