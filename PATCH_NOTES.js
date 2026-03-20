/*
---------
[2026년 03월 20일 — v0.3]

[신규 파일]
 * CLAUDE.md — Claude Code 전용 프로젝트 가이드 (아키텍처, 실행법, 운영 규칙 정리)
 * archive_spotify_expansion_plan.md (v2.0) — Spotify 연동 실무 기획안 전면 재작성
   - 기존 v1.0 대비: Netlify Functions 경로 수정, credits null 버그 명시,
     data-field 식별자 설계, localStorage 캐싱 전략, netlify dev 로컬 환경 안내 추가
 * netlify.toml — Netlify Functions 디렉토리 경로 설정 (functions = "netlify/functions")
 * netlify/functions/spotify.js — Spotify API 서버리스 브릿지 (신규)
 * .gitignore — .env, node_modules/, .netlify 제외
 * .env — 로컬 환경변수 파일 (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)

[app.js 수정]
 * credits null 크래시 버그 수정 (line:432)
   - album.credits가 null인 신규 앨범 상세 페이지 진입 시 TypeError 발생하던 문제 해결
   - credits 없는 앨범은 "참여진 정보 준비 중" 메시지로 graceful 처리
 * 포스터 HTML에 data-field 식별자 8종 추가
   - cover-img, release-date, runtime, label, label-badge, duration-badge,
     track-count, spotify-link
   - Spotify 보강 시 전체 재렌더링 없이 해당 요소만 개별 패치 가능
 * coverImage 없는 앨범에도 data-field="cover-img" img 태그 추가 (display:none 상태로)
   - Spotify 커버 도착 시 display:block 전환하여 표시
 * poster-bottom에 Spotify 링크 요소 추가 (기본 숨김, 보강 시 표시)
 * patchAlbumUI() 함수 신규 추가
   - 커버 이미지 URL 교체 및 art-watermark 숨김 처리
   - 발매일, 러닝타임, 레이블 텍스트 패치
   - 포스터 트랙 그리드 재렌더링
   - 트랙 탭 패널(#panel-tracks) 재렌더링
   - 트랙 수, 러닝타임, 레이블 하단 배지 갱신
   - Spotify 외부 링크 표시
   - 각 패치는 독립적으로 실행 — 일부 실패해도 나머지 계속 진행
 * enrichFromSpotify() 함수 신규 추가
   - localStorage 24시간 TTL 캐싱 — 동일 앨범 재방문 시 API 호출 없이 즉시 보강
   - spotifyAlbumId 있으면 ID 기반 정확 조회, 없으면 title+artist+year 검색 fallback
   - AbortSignal.timeout(5000) — 5초 타임아웃, 실패 시 무음 처리 (현재 화면 유지)
   - 캐시 저장 실패(localStorage 용량 초과 등)도 try-catch로 무음 처리
 * initAlbum() 끝에 enrichFromSpotify 자동 호출 추가
   - 호출 조건: spotifyAlbumId 있거나 tracks 배열이 비어있는 앨범에 한정

[netlify/functions/spotify.js 구현 내용]
 * Spotify Client Credentials Flow 토큰 발급
 * 모듈 스코프 토큰 캐싱 — 만료 60초 전 재발급, 인스턴스 재사용 시 API 호출 최소화
 * ID 기반 조회: GET /v1/albums/{id}
 * 검색 기반 조회: GET /v1/search?q=album:{title}+artist:{artist}&type=album&limit=10
 * 오매칭 방어 규칙:
   - album_type === "album" 만 허용 (single, compilation 제외)
   - 제목 정규화 비교 (소문자 + 특수문자 제거)
   - 아티스트명 정규화 비교
   - 연도 차이 1년 이내
   - deluxe, remaster, remastered, live, anniversary, expanded, edition 포함 제목 제외
   - 조건 통과 결과 없으면 { ok: false, error: "no_match" } 반환
 * 응답 정규화:
   - releaseDate: "YYYY-MM-DD" → "Month DD, YYYY" 변환 (연/월만 있는 경우도 대응)
   - duration: 트랙 전체 duration_ms 합산 → "74:24" 형식 변환
   - tracks: track_number, name, duration_ms → { no, title, duration, feat[] } 형식
   - feat: 트랙 artists[] 중 메인 아티스트 제외한 나머지 추출
 * CORS 헤더 포함 (Access-Control-Allow-Origin: *)
 * 환경변수 미설정 시 500 에러 반환

[data.js 수정]
 * 신규 앨범 20종 추가 (최소 스키마 — Spotify 자동 보강 방식)
   Hip-Hop: Graduation, MBDTF (Kanye West), good kid m.A.A.d city (Kendrick Lamar)
   R&B: channel ORANGE (Frank Ocean), Ctrl (SZA)
   Pop: 1989 (Taylor Swift), Future Nostalgia (Dua Lipa)
   Rock: Abbey Road (The Beatles), Nevermind (Nirvana), The Dark Side of the Moon (Pink Floyd)
   Jazz: A Love Supreme (John Coltrane), Time Out (Dave Brubeck Quartet)
   Electronic: Discovery (Daft Punk), In Colour (Jamie xx)
   K-Pop: New Jeans EP, OMG, How Sweet, Supernatural (NewJeans 전체 디스코그래피)
   Alternative: In Rainbows (Radiohead), Currents (Tame Impala)
   Soul: Songs in the Key of Life (Stevie Wonder)
   Classical: Goldberg Variations (Glenn Gould)
 * 신규 앨범 최소 스키마: id, genre, title, artist, year, (spotifyAlbumId optional)만 필수
   나머지(releaseDate, label, duration, tracks, credits, concept, era)는 빈 값 허용
 * spotifyAlbumId 없는 앨범은 title+artist+year 검색 fallback으로 자동 보강

[Netlify CLI]
 * netlify-cli v24.3.0 전역 설치
 * netlify dev 로컬 테스트 환경 구성 완료
   - .env 파일에서 SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET 자동 주입 확인
   - Loaded function spotify 정상 확인
   - http://localhost:8888 에서 Spotify 보강 동작 검증 완료
---------
*/
/*
---------
[2026년 03월 17일 — v0.2]
 * 앨범 커버 10장 실제 이미지로 교체 (Wikimedia Commons에서 다운로드)
 * 아티스트 사진 10장 추가 (img/artist/ 폴더, Wikimedia Commons)
 * year.html 신규 추가 — 연도별 앨범 목록 페이지
 * artist.html 신규 추가 — 아티스트 정보 + 앨범 목록 페이지
 * data.js: ARTISTS 배열 추가 (10명, bio/origin/genres 포함)
 * app.js: yearUrl/artistUrl 라우팅, initYear/initArtist 구현
 * app.js: 장르 페이지 연도·아티스트 클릭 링크 활성화
 * app.js: 앨범 상세 포스터 섹션에 실제 커버 이미지 표시
 * styles.css: 아티스트 히어로 섹션 스타일 추가
---------
*/
/*
---------
[2026년 03월 17일]
 * 프로젝트 최초 생성
 * 3단계 탐색 구조 구현: 메인(장르) → 장르 페이지(앨범 목록) → 앨범 상세
 * 10개 장르, 10개 샘플 앨범 데이터 수록
 * 앨범 상세 페이지: Flower Boy 포스터 스타일 레이아웃 + 트랙/참여진/컨셉아트/시대배경 탭
 * 프리미엄 다크 테마, Bebas Neue + Inter + Space Mono 폰트
---------
*/
