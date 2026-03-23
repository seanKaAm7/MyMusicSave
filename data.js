const GENRES = [
  { id: "hip-hop", name: "Hip-Hop", color: "#FF6B35", bg: "linear-gradient(135deg,#1a0a00,#3d1a00)" },
  { id: "rnb", name: "R&B", color: "#C77DFF", bg: "linear-gradient(135deg,#0d0020,#2d0060)" },
  { id: "pop", name: "Pop", color: "#FF4D6D", bg: "linear-gradient(135deg,#1a0010,#3d0025)" },
  { id: "rock", name: "Rock", color: "#4CC9F0", bg: "linear-gradient(135deg,#000a1a,#001a3d)" },
  { id: "jazz", name: "Jazz", color: "#FFD166", bg: "linear-gradient(135deg,#1a1400,#3d3000)" },
  { id: "electronic", name: "Electronic", color: "#06D6A0", bg: "linear-gradient(135deg,#001a10,#003d25)" },
  { id: "kpop", name: "K-Pop", color: "#FF99C8", bg: "linear-gradient(135deg,#1a0015,#3d003a)" },
  { id: "alternative", name: "Alternative", color: "#90E0EF", bg: "linear-gradient(135deg,#000d1a,#001f3d)" },
  { id: "soul", name: "Soul / Funk", color: "#F4A261", bg: "linear-gradient(135deg,#1a0800,#3d1e00)" },
  { id: "classical", name: "Classical", color: "#E9C46A", bg: "linear-gradient(135deg,#15120a,#3d3320)" }
];

const ALBUMS = [
  {
    id: "flower-boy",
    genre: "hip-hop",
    title: "FLOWER BOY",
    artist: "Tyler, the Creator",
    year: 2017,
    releaseDate: "July 21, 2017",
    label: "Columbia",
    duration: "46:33",
    edition: "The Fourth Studio Album",
    coverImage: "img/cover_flower_boy.png",
    coverGradient: "linear-gradient(160deg,#E8A830 0%,#CC5500 45%,#2D5A1B 100%)",
    accentColor: "#E8A830",
    tracks: [
      { no: 1, title: "Foreword", duration: "1:09", feat: [] },
      { no: 2, title: "Where This Flower Blooms", duration: "3:16", feat: ["Frank Ocean"] },
      { no: 3, title: "Sometimes...", duration: "2:37", feat: ["Rex Orange County"] },
      { no: 4, title: "See You Again", duration: "4:09", feat: ["Kali Uchis"] },
      { no: 5, title: "Who Dat Boy", duration: "3:23", feat: ["A$AP Rocky"] },
      { no: 6, title: "Pothole", duration: "2:43", feat: ["Jaden"] },
      { no: 7, title: "Garden Shed", duration: "4:00", feat: ["Estelle"] },
      { no: 8, title: "Boredom", duration: "3:58", feat: ["Rex Orange County", "Anna of the North"] },
      { no: 9, title: "I Ain't Got Time!", duration: "2:51", feat: [] },
      { no: 10, title: "911 / Mr. Lonely", duration: "5:08", feat: ["Steve Lacy", "Anna of the North", "Frank Ocean"] },
      { no: 11, title: "Droppin' Seeds", duration: "1:52", feat: ["Lil Wayne"] },
      { no: 12, title: "November", duration: "4:09", feat: [] },
      { no: 13, title: "Glitter", duration: "3:51", feat: [] },
      { no: 14, title: "Enjoy Right Now, Today", duration: "3:25", feat: [] }
    ],
    credits: {
      producers: ["Tyler, the Creator", "Rex Kudo", "Romil Hemnani"],
      featuring: ["Frank Ocean", "A$AP Rocky", "Kali Uchis", "Rex Orange County", "Jaden", "Steve Lacy", "Estelle", "Lil Wayne"],
      engineers: ["Christian Mochizuki", "Ian Morales"],
      artDirection: ["Wyatt Navarro"],
      photography: ["Wolf Haley"]
    },
    concept: "Tyler, the Creator가 자신의 정체성과 고독, 사랑을 탐구한 앨범. 꽃과 꿀벌의 이미지를 통해 성장과 자아 발견의 여정을 표현한다. 앨범 전반에 걸쳐 Tyler는 이전 작품에서 드러내지 않았던 취약한 면을 담아냈으며, 자신이 원하는 삶과 현실 사이의 괴리를 솔직하게 노래했다. 커버 아트는 해바라기밭 위를 거니는 Tyler의 뒷모습과 거대한 꿀벌들이 인상적이다.",
    era: "2010년대 중반, 얼터너티브 힙합이 주류 문화권으로 편입되던 시기. Odd Future 해체 이후 멤버들이 각자의 솔로 경력을 쌓아가던 전환점. Frank Ocean의 「Blonde」(2016)가 보여준 내성적이고 실험적인 R&B/힙합이 큰 영향을 미쳤으며, Tyler는 이 흐름을 받아 자신의 음악적 팔레트를 대폭 확장했다."
  },
  {
    id: "damn",
    genre: "hip-hop",
    title: "DAMN.",
    artist: "Kendrick Lamar",
    year: 2017,
    releaseDate: "April 14, 2017",
    label: "Top Dawg / Aftermath / Interscope",
    duration: "54:54",
    edition: "The Fourth Studio Album",
    coverImage: "img/cover_damn.png",
    coverGradient: "linear-gradient(160deg,#8B0000 0%,#CC0000 50%,#1a0000 100%)",
    accentColor: "#CC0000",
    tracks: [
      { no: 1, title: "BLOOD.", duration: "1:57", feat: [] },
      { no: 2, title: "DNA.", duration: "3:05", feat: [] },
      { no: 3, title: "YAH.", duration: "2:39", feat: [] },
      { no: 4, title: "ELEMENT.", duration: "3:27", feat: [] },
      { no: 5, title: "FEEL.", duration: "3:35", feat: [] },
      { no: 6, title: "LOYALTY.", duration: "3:47", feat: ["Rihanna"] },
      { no: 7, title: "PRIDE.", duration: "4:36", feat: [] },
      { no: 8, title: "HUMBLE.", duration: "2:57", feat: [] },
      { no: 9, title: "LUST.", duration: "5:07", feat: [] },
      { no: 10, title: "LOVE.", duration: "3:33", feat: ["Zacari"] },
      { no: 11, title: "XXX.", duration: "4:52", feat: ["U2"] },
      { no: 12, title: "FEAR.", duration: "7:42", feat: [] },
      { no: 13, title: "GOD.", duration: "4:00", feat: [] },
      { no: 14, title: "DUCKWORTH.", duration: "4:36", feat: [] }
    ],
    credits: {
      producers: ["Kendrick Lamar", "DJ Dahi", "Mike WiLL Made-It", "Sounwave", "The Alchemist", "9th Wonder", "James Blake"],
      featuring: ["Rihanna", "Zacari", "U2"],
      engineers: ["Derek 'MixedByAli' Ali", "Greg Mondress"],
      artDirection: ["Vlad Sepetov"]
    },
    concept: "죄와 구원, 약함과 강함이라는 이분법적 주제를 14곡의 단어(제목) 하나로 응축한 앨범. Kendrick Lamar의 삶과 미국 흑인 사회에 대한 성찰이 성경적 메타포와 결합한다. 역순 재생 시 또 다른 서사가 펼쳐지는 이중 구조를 지닌다.",
    era: "트럼프 행정부 출범 초기 미국 사회의 분열과 긴장이 절정에 달하던 2017년. BLM 운동이 지속되며 흑인 정체성과 경찰 폭력에 대한 담론이 뜨거웠다. Kendrick은 이 앨범으로 퓰리처 음악상을 수상, 힙합 최초의 퓰리처 수상작이 되었다."
  },
  {
    id: "to-pimp-a-butterfly",
    genre: "hip-hop",
    title: "TO PIMP A BUTTERFLY",
    artist: "Kendrick Lamar",
    year: 2015,
    releaseDate: "March 15, 2015",
    label: "Top Dawg / Aftermath / Interscope",
    duration: "79:26",
    edition: "The Third Studio Album",
    coverImage: "img/cover_tpab.png",
    coverGradient: "linear-gradient(160deg,#1a3a0a 0%,#f5c100 60%,#1a1a1a 100%)",
    accentColor: "#7d7d7dff",
    tracks: [
      { no: 1, title: "Wesley's Theory", duration: "4:46", feat: ["George Clinton", "Thundercat"] },
      { no: 2, title: "For Free? (Interlude)", duration: "2:10", feat: [] },
      { no: 3, title: "King Kunta", duration: "3:54", feat: [] },
      { no: 4, title: "Institutionalized", duration: "4:31", feat: ["Bilal", "Anna Wise", "Snoop Dogg"] },
      { no: 5, title: "These Walls", duration: "5:00", feat: ["Bilal", "Anna Wise", "Thundercat"] },
      { no: 6, title: "u", duration: "4:28", feat: [] },
      { no: 7, title: "Alright", duration: "3:39", feat: [] },
      { no: 8, title: "For Sale? (Interlude)", duration: "4:51", feat: [] },
      { no: 9, title: "Momma", duration: "4:43", feat: [] },
      { no: 10, title: "Hood Politics", duration: "4:52", feat: [] },
      { no: 11, title: "How Much a Dollar Cost", duration: "4:21", feat: ["James Fauntleroy", "Ronald Isley"] },
      { no: 12, title: "Complexion (A Zulu Love)", duration: "4:24", feat: ["Rapsody"] },
      { no: 13, title: "The Blacker the Berry", duration: "5:28", feat: [] },
      { no: 14, title: "You Ain't Gotta Lie", duration: "3:41", feat: [] },
      { no: 15, title: "i", duration: "5:36", feat: [] },
      { no: 16, title: "Mortal Man", duration: "12:07", feat: [] }
    ],
    credits: {
      producers: ["Thundercat", "Flying Lotus", "Pharrell Williams", "Sounwave", "Terrace Martin"],
      featuring: ["George Clinton", "Thundercat", "Bilal", "Anna Wise", "Snoop Dogg", "Rapsody", "James Fauntleroy"],
      engineers: ["Derek 'MixedByAli' Ali"],
      artDirection: ["the brothers Johnson"]
    },
    concept: "흑인 문화, 정체성, 억압을 재즈·펑크·소울과 접목한 서사시적 앨범. 나비(butterfly)는 성장한 흑인 예술가를 상징하고, 애벌레(caterpillar)는 착취당하는 흑인의 현실을 은유한다.",
    era: "퍼거슨 사태(2014) 이후 BLM 운동이 전국으로 확산되던 시기. 오바마 행정부 말기, 미국 흑인 사회의 희망과 분노가 교차하던 때. 재즈의 재부흥(Thundercat, Flying Lotus)이 힙합과 결합하던 창조적 전환점이었다."
  },
  {
    id: "blonde",
    genre: "rnb",
    title: "BLONDE",
    artist: "Frank Ocean",
    year: 2016,
    releaseDate: "August 20, 2016",
    label: "Boys Don't Cry",
    duration: "60:04",
    edition: "Second Studio Album",
    coverImage: "img/cover_blonde.png",
    coverGradient: "linear-gradient(160deg,#ffd700 0%,#ff8c00 50%,#1a1200 100%)",
    accentColor: "#ffd700",
    tracks: [
      { no: 1, title: "Nikes", duration: "5:14", feat: [] },
      { no: 2, title: "Ivy", duration: "4:10", feat: [] },
      { no: 3, title: "Pink + White", duration: "3:05", feat: ["Beyoncé"] },
      { no: 4, title: "Be Yourself", duration: "1:50", feat: [] },
      { no: 5, title: "Solo", duration: "4:24", feat: [] },
      { no: 6, title: "Skyline To", duration: "3:18", feat: ["Kendrick Lamar"] },
      { no: 7, title: "Self Control", duration: "4:10", feat: ["Austin Feinstein"] },
      { no: 8, title: "Good Guy", duration: "1:43", feat: [] },
      { no: 9, title: "Nights", duration: "5:07", feat: [] },
      { no: 10, title: "Solo (Reprise)", duration: "1:45", feat: ["André 3000"] },
      { no: 11, title: "Pretty Sweet", duration: "2:34", feat: [] },
      { no: 12, title: "Facebook Story", duration: "1:41", feat: [] },
      { no: 13, title: "Close to You", duration: "1:06", feat: [] },
      { no: 14, title: "White Ferrari", duration: "4:10", feat: [] },
      { no: 15, title: "Seigfried", duration: "4:53", feat: [] },
      { no: 16, title: "Godspeed", duration: "2:47", feat: [] },
      { no: 17, title: "Futura Free", duration: "9:14", feat: [] }
    ],
    credits: {
      producers: ["Frank Ocean", "om'mas keith", "Buddy Ross", "James Blake", "Pharrell Williams"],
      featuring: ["Beyoncé", "Kendrick Lamar", "André 3000"],
      engineers: ["Frank Ocean"],
      artDirection: ["Frank Ocean"]
    },
    concept: "4년간의 공백 끝에 발표한 자전적 앨범. 사랑, 상실, 정체성, 그리고 어린 시절의 기억을 비선형적으로 엮어낸다. 장르의 경계를 허물며 실험적 텍스처와 무드를 자유롭게 사용했다.",
    era: "소셜 미디어 시대의 개인정보 과잉 공유에 대한 반작용으로 은밀함이 문화적 자본이 되던 2016년. Frank Ocean의 4년 침묵은 역설적으로 가장 큰 마케팅이 되었으며, 발매 직후 스트리밍 기록을 경신했다."
  },
  {
    id: "sos",
    genre: "rnb",
    title: "SOS",
    artist: "SZA",
    year: 2022,
    releaseDate: "December 9, 2022",
    label: "Top Dawg / RCA",
    duration: "69:00",
    edition: "Second Studio Album",
    coverImage: "img/cover_sos.png",
    coverGradient: "linear-gradient(160deg,#001f3f 0%,#0077b6 50%,#00b4d8 100%)",
    accentColor: "#00b4d8",
    tracks: [
      { no: 1, title: "SOS", duration: "1:32", feat: [] },
      { no: 2, title: "Seek & Destroy", duration: "4:16", feat: [] },
      { no: 3, title: "Low", duration: "3:27", feat: ["Thundercat"] },
      { no: 4, title: "Love Language", duration: "2:58", feat: [] },
      { no: 5, title: "30 for 30", duration: "3:28", feat: [] },
      { no: 6, title: "Gone Girl", duration: "3:34", feat: ["Travis Scott"] },
      { no: 7, title: "Used", duration: "2:58", feat: ["Don Toliver"] },
      { no: 8, title: "Smoking on My Ex Pack", duration: "1:27", feat: [] },
      { no: 9, title: "Blind", duration: "3:00", feat: [] },
      { no: 10, title: "Snooze", duration: "3:21", feat: [] },
      { no: 11, title: "Kill Bill", duration: "2:34", feat: [] },
      { no: 12, title: "Conceited", duration: "2:20", feat: [] },
      { no: 13, title: "Special", duration: "3:05", feat: [] },
      { no: 14, title: "Too Late", duration: "3:23", feat: [] },
      { no: 15, title: "Forgiveless", duration: "3:28", feat: ["Ol' Dirty Bastard"] },
      { no: 16, title: "Far", duration: "2:41", feat: [] },
      { no: 17, title: "Nobody Gets Me", duration: "3:18", feat: [] },
      { no: 18, title: "F2F", duration: "2:49", feat: [] },
      { no: 19, title: "Crown", duration: "3:28", feat: [] },
      { no: 20, title: "Open Arms", duration: "3:46", feat: ["Travis Scott"] },
      { no: 21, title: "Ghost in the Machine", duration: "3:45", feat: ["Phoebe Bridgers"] },
      { no: 22, title: "Shirt", duration: "4:00", feat: [] },
      { no: 23, title: "Notice Me", duration: "2:22", feat: [] }
    ],
    credits: {
      producers: ["SZA", "Rodney Jerkins", "Benny Blanco", "Cirkut", "Max Martin"],
      featuring: ["Travis Scott", "Thundercat", "Don Toliver", "Phoebe Bridgers"],
      engineers: ["Serban Ghenea", "John Hanes"]
    },
    concept: "구조 신호(SOS)처럼, 고통 속에서도 목소리를 내는 여성의 이야기. 연애의 복잡함, 자기혐오와 자기애의 공존, 사회적 압박을 솔직한 가사로 담아낸다.",
    era: "팬데믹 이후 자아 성찰의 시대. 여성 R&B 아티스트들이 차트를 주도하며 취약함을 솔직히 드러내는 것이 새로운 강인함으로 받아들여지던 시기."
  },
  {
    id: "get-up",
    genre: "kpop",
    title: "GET UP",
    artist: "NewJeans",
    year: 2023,
    releaseDate: "July 21, 2023",
    label: "ADOR / HYBE",
    duration: "20:53",
    edition: "Second Mini Album",
    coverImage: "img/cover_getup.png",
    coverGradient: "linear-gradient(160deg,#ffecd2 0%,#fcb69f 50%,#ff9a9e 100%)",
    accentColor: "#9ee8ffff",
    tracks: [
      { no: 1, title: "New Jeans", duration: "3:05", feat: [] },
      { no: 2, title: "Super Shy", duration: "2:49", feat: [] },
      { no: 3, title: "ETA", duration: "3:02", feat: [] },
      { no: 4, title: "Cool With You", duration: "3:31", feat: [] },
      { no: 5, title: "Get Up", duration: "2:47", feat: [] },
      { no: 6, title: "ASAP", duration: "3:15", feat: [] },
      { no: 7, title: "Cool With You (her version)", duration: "2:25", feat: [] }
    ],
    credits: {
      producers: ["250", "Nive", "Danielle Young", "BooM"],
      featuring: [],
      engineers: ["Mr. Swit", "Yoon Seokjun"],
      artDirection: ["Hanni Pham (concept direction)", "Lim Hyunsik (art direction)"]
    },
    concept: "Y2K 감성과 현대적인 미니멀리즘을 결합. 10대 소녀들의 일상적 감정과 설렘을 가볍고 경쾌하게 표현한다. 과잉된 퍼포먼스보다 자연스러운 무드를 우선시한 '뉴트로 팝' 미학.",
    era: "2023년 K-Pop 4세대의 전성기. 하이브의 새 레이블 ADOR가 기존 K-Pop 공식을 의도적으로 해체하며 등장. SNS 알고리즘과 숏폼 콘텐츠가 음악 소비 방식을 바꾼 시대."
  },
  {
    id: "ok-computer",
    genre: "alternative",
    title: "OK COMPUTER",
    artist: "Radiohead",
    year: 1997,
    releaseDate: "May 21, 1997",
    label: "Parlophone / Capitol",
    duration: "53:21",
    edition: "Third Studio Album",
    coverImage: "img/cover_ok_computer.png",
    coverGradient: "linear-gradient(160deg,#0a0a2e 0%,#1a1a6e 50%,#4a90d9 100%)",
    accentColor: "#4a90d9",
    tracks: [
      { no: 1, title: "Airbag", duration: "4:44", feat: [] },
      { no: 2, title: "Paranoid Android", duration: "6:23", feat: [] },
      { no: 3, title: "Subterranean Homesick Alien", duration: "4:27", feat: [] },
      { no: 4, title: "Exit Music (For a Film)", duration: "4:24", feat: [] },
      { no: 5, title: "Let Down", duration: "4:59", feat: [] },
      { no: 6, title: "Karma Police", duration: "4:21", feat: [] },
      { no: 7, title: "Fitter Happier", duration: "1:57", feat: [] },
      { no: 8, title: "Electioneering", duration: "3:50", feat: [] },
      { no: 9, title: "Climbing Up the Walls", duration: "4:45", feat: [] },
      { no: 10, title: "No Surprises", duration: "3:48", feat: [] },
      { no: 11, title: "Lucky", duration: "4:19", feat: [] },
      { no: 12, title: "The Tourist", duration: "5:24", feat: [] }
    ],
    credits: {
      producers: ["Nigel Godrich", "Radiohead"],
      featuring: [],
      engineers: ["Nigel Godrich"],
      artDirection: ["Stanley Donwood", "Thom Yorke"]
    },
    concept: "기술 문명과 소외, 현대 사회의 공허함을 표현한 개념 앨범. 컴퓨터와 기계에 잠식되어 가는 인간성을 은유한다. 스탠리 큐브릭, 노암 촘스키의 영향이 크게 작용했다.",
    era: "밀레니엄을 3년 앞둔 1997년. Y2K 공포와 인터넷의 폭발적 보급, 세계화의 가속으로 기술과 인간의 관계에 대한 불안이 팽배하던 시기. 브릿팝의 전성기와 겹치며 영국 록의 절정을 기록했다."
  },
  {
    id: "random-access-memories",
    genre: "electronic",
    title: "RANDOM ACCESS MEMORIES",
    artist: "Daft Punk",
    year: 2013,
    releaseDate: "May 17, 2013",
    label: "Columbia",
    duration: "74:24",
    edition: "Fourth Studio Album",
    coverImage: "img/cover_ram.png",
    coverGradient: "linear-gradient(160deg,#1a0a00 0%,#7a4000 50%,#ffb347 100%)",
    accentColor: "#ffb347",
    tracks: [
      { no: 1, title: "Give Life Back to Music", duration: "4:34", feat: ["Nile Rodgers"] },
      { no: 2, title: "The Game of Love", duration: "4:18", feat: [] },
      { no: 3, title: "Giorgio by Moroder", duration: "9:04", feat: ["Giorgio Moroder"] },
      { no: 4, title: "Within", duration: "3:47", feat: ["Chilly Gonzales"] },
      { no: 5, title: "Instant Crush", duration: "5:37", feat: ["Julian Casablancas"] },
      { no: 6, title: "Lose Yourself to Dance", duration: "5:53", feat: ["Pharrell Williams", "Nile Rodgers"] },
      { no: 7, title: "Touch", duration: "8:18", feat: ["Paul Williams"] },
      { no: 8, title: "Get Lucky", duration: "6:07", feat: ["Pharrell Williams", "Nile Rodgers"] },
      { no: 9, title: "Beyond", duration: "4:50", feat: [] },
      { no: 10, title: "Motherboard", duration: "5:42", feat: [] },
      { no: 11, title: "Fragments of Time", duration: "4:39", feat: ["Todd Edwards"] },
      { no: 12, title: "Doin' It Right", duration: "4:11", feat: ["Panda Bear"] },
      { no: 13, title: "Contact", duration: "6:21", feat: ["DJ Falcon"] }
    ],
    credits: {
      producers: ["Daft Punk", "Pharrell Williams", "Nile Rodgers"],
      featuring: ["Pharrell Williams", "Nile Rodgers", "Giorgio Moroder", "Julian Casablancas", "Paul Williams", "Todd Edwards"],
      engineers: ["Mick Guzauski"],
      artDirection: ["Emmanuel de Buretel"]
    },
    concept: "70~80년대 디스코와 펑크의 황금기를 현대로 소환한 앨범. 디지털이 아닌 아날로그 인스트루먼트와 실제 뮤지션 협업을 고집한 역설적인 전자음악 앨범.",
    era: "스트리밍이 다운로드를 처음 추월하기 직전인 2013년. EDM 붐과 프로듀서 셀레브리티 문화가 절정이던 시기에, Daft Punk는 반대로 아날로그와 인간적 연주로 방향을 틀어 화제가 되었다."
  },
  {
    id: "kind-of-blue",
    genre: "jazz",
    title: "KIND OF BLUE",
    artist: "Miles Davis",
    year: 1959,
    releaseDate: "August 17, 1959",
    label: "Columbia",
    duration: "45:44",
    edition: "Studio Album",
    coverImage: "img/cover_kind_of_blue.png",
    coverGradient: "linear-gradient(160deg,#0a0a0a 0%,#001a3d 50%,#003080 100%)",
    accentColor: "#4a7fcb",
    tracks: [
      { no: 1, title: "So What", duration: "9:22", feat: [] },
      { no: 2, title: "Freddie Freeloader", duration: "9:34", feat: [] },
      { no: 3, title: "Blue in Green", duration: "5:37", feat: [] },
      { no: 4, title: "All Blues", duration: "11:33", feat: [] },
      { no: 5, title: "Flamenco Sketches", duration: "9:26", feat: [] }
    ],
    credits: {
      producers: ["Teo Macero", "Irving Townsend"],
      featuring: ["John Coltrane", "Cannonball Adderley", "Bill Evans", "Wynton Kelly", "Paul Chambers", "Jimmy Cobb"],
      engineers: ["Fred Plaut"]
    },
    concept: "모달 재즈(modal jazz)를 대중화한 역사적 앨범. 코드 진행 대신 스케일(모드)을 기반으로 즉흥 연주하는 새로운 언어를 제시했다. 단 이틀의 레코딩 세션으로 완성되었다.",
    era: "비밥(bebop)이 자유 재즈(free jazz)로 진화하던 전환기. 냉전의 긴장감 속 미국에서 흑인 음악이 예술적 정당성을 인정받기 시작하던 1950년대 말. 이후 60년대 록의 어법에도 지대한 영향을 미친다."
  },
  {
    id: "whats-going-on",
    genre: "soul",
    title: "WHAT'S GOING ON",
    artist: "Marvin Gaye",
    year: 1971,
    releaseDate: "May 21, 1971",
    label: "Tamla / Motown",
    duration: "35:31",
    edition: "Eleventh Studio Album",
    coverImage: "img/cover_whats_going_on.png",
    coverGradient: "linear-gradient(160deg,#1a0800 0%,#5a2d00 50%,#c06000 100%)",
    accentColor: "#c06000",
    tracks: [
      { no: 1, title: "What's Going On", duration: "3:53", feat: [] },
      { no: 2, title: "What's Happening Brother", duration: "2:43", feat: [] },
      { no: 3, title: "Flyin' High (In the Friendly Sky)", duration: "3:51", feat: [] },
      { no: 4, title: "Save the Children", duration: "4:02", feat: [] },
      { no: 5, title: "God Is Love", duration: "1:41", feat: [] },
      { no: 6, title: "Mercy Mercy Me (The Ecology)", duration: "3:16", feat: [] },
      { no: 7, title: "Right On", duration: "7:18", feat: [] },
      { no: 8, title: "Wholy Holy", duration: "3:09", feat: [] },
      { no: 9, title: "Inner City Blues (Make Me Wanna Holler)", duration: "5:22", feat: [] }
    ],
    credits: {
      producers: ["Marvin Gaye"],
      featuring: [],
      engineers: ["Lawrence Miles", "Ken Sands"],
      artDirection: ["Curtis McNair"]
    },
    concept: "베트남 전쟁, 인종차별, 환경오염, 도시 빈곤을 소울 음악으로 녹여낸 개념 앨범. Motown이 정치적 발언을 꺼리던 시기에 Marvin Gaye가 레이블의 반대를 무릅쓰고 발표했다.",
    era: "베트남 반전 운동과 시민권 운동의 절정기. 우드스톡(1969) 이후 록과 소울이 사회적 발언의 매개가 되던 시기. Motown의 댄스 팝 공식에 균열을 낸 최초의 본격적인 '메시지 앨범'이었다."
  },
  {
    id: "when-we-all-fall-asleep",
    genre: "pop",
    title: "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?",
    artist: "Billie Eilish",
    year: 2019,
    releaseDate: "March 29, 2019",
    label: "Darkroom / Interscope",
    duration: "42:02",
    edition: "Debut Studio Album",
    coverImage: "img/cover_when_we_all_fall_asleep.png",
    coverGradient: "linear-gradient(160deg,#000000 0%,#1a1a2e 50%,#16213e 100%)",
    accentColor: "#39ff14",
    tracks: [
      { no: 1, title: "!!!!!!!", duration: "0:14", feat: [] },
      { no: 2, title: "bad guy", duration: "3:14", feat: [] },
      { no: 3, title: "xanny", duration: "4:04", feat: [] },
      { no: 4, title: "you should see me in a crown", duration: "3:04", feat: [] },
      { no: 5, title: "all the good girls go to hell", duration: "2:49", feat: [] },
      { no: 6, title: "wish you were gay", duration: "3:43", feat: [] },
      { no: 7, title: "when the party's over", duration: "3:16", feat: [] },
      { no: 8, title: "8", duration: "2:55", feat: [] },
      { no: 9, title: "my strange addiction", duration: "3:01", feat: [] },
      { no: 10, title: "bury a friend", duration: "3:13", feat: [] },
      { no: 11, title: "ilomilo", duration: "2:23", feat: [] },
      { no: 12, title: "listen before i go", duration: "3:47", feat: [] },
      { no: 13, title: "i love you", duration: "5:01", feat: [] },
      { no: 14, title: "goodbye", duration: "1:10", feat: [] }
    ],
    credits: {
      producers: ["FINNEAS"],
      featuring: [],
      engineers: ["FINNEAS", "Rob Kinelski"],
      artDirection: ["Billie Eilish", "Samantha Burkhart"]
    },
    concept: "침실 팝(bedroom pop)의 미학을 공포·어둠과 결합한 데뷔 앨범. 의식과 무의식, 꿈과 죽음의 경계를 탐구하며 10대의 불안을 새로운 감각으로 표현했다.",
    era: "유튜브와 사운드클라우드 세대가 메인스트림을 침공하기 시작한 2019년. 오빠 FINNEAS와 단 둘이 침실에서 녹음한 앨범이 그래미를 휩쓸며 '업계 공식' 해체를 선언한 해."
  },

  // ── 신규 추가 앨범 (최소 스키마 — Spotify 자동 보강) ──────

  // Hip-Hop
  {
    id: "graduation",
    genre: "hip-hop",
    title: "Graduation",
    artist: "Kanye West",
    year: 2007,
    spotifyAlbumId: "4SZko61aMnmgvNhfhgTuD3",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#0a0015,#2a0060,#6600cc)",
    accentColor: "#a855f7", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "mbdtf",
    genre: "hip-hop",
    title: "My Beautiful Dark Twisted Fantasy",
    artist: "Kanye West",
    year: 2010,
    spotifyAlbumId: "20r762YmB5HeofjMCiPMLv",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#1a0000,#4a0010,#8b0000)",
    accentColor: "#cc2200", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "good-kid-maad-city",
    genre: "hip-hop",
    title: "good kid, m.A.A.d city",
    artist: "Kendrick Lamar",
    year: 2012,
    spotifyAlbumId: "0Oq3mWfexhsjUh0aNNBB5u",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#0a0a00,#2a2000,#5a4000)",
    accentColor: "#d4a017", tracks: [], credits: null, concept: "", era: ""
  },

  // R&B
  {
    id: "channel-orange",
    genre: "rnb",
    title: "channel ORANGE",
    artist: "Frank Ocean",
    year: 2012,
    spotifyAlbumId: "392p3shh2jkxUxY2VHvlH8",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#1a0800,#7a3000,#ff6600)",
    accentColor: "#ff6600", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "ctrl",
    genre: "rnb",
    title: "Ctrl",
    artist: "SZA",
    year: 2017,
    spotifyAlbumId: "76290XdXVF9rPzGdNRWdCh",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#0a0a0a,#1a1010,#3a2020)",
    accentColor: "#c8a882", tracks: [], credits: null, concept: "", era: ""
  },

  // Pop
  {
    id: "1989",
    genre: "pop",
    title: "1989",
    artist: "Taylor Swift",
    year: 2014,
    spotifyAlbumId: "5fy0X0JmZRZnVa2UEicIOl",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#0a1520,#1a3a5a,#5a8ab0)",
    accentColor: "#7fb3d3", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "future-nostalgia",
    genre: "pop",
    title: "Future Nostalgia",
    artist: "Dua Lipa",
    year: 2020,
    spotifyAlbumId: "7fJJK56U9fHixgO0HQkhtI",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#150015,#3a0040,#7a0080)",
    accentColor: "#cc44ff", tracks: [], credits: null, concept: "", era: ""
  },

  // Rock
  {
    id: "abbey-road",
    genre: "rock",
    title: "Abbey Road",
    artist: "The Beatles",
    year: 1969,
    spotifyAlbumId: "0ETFjACtuP2ADo6LFhL6HN",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#0a0a0a,#1a1a10,#3a3a20)",
    accentColor: "#d4c87a", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "nevermind",
    genre: "rock",
    title: "Nevermind",
    artist: "Nirvana",
    year: 1991,
    spotifyAlbumId: "2UJcKiJxNryhL050F5Z1Fk",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#000a1a,#001a3a,#003060)",
    accentColor: "#4a90d9", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "dark-side-of-the-moon",
    genre: "rock",
    title: "The Dark Side of the Moon",
    artist: "Pink Floyd",
    year: 1973,
    spotifyAlbumId: "4LH4d3cOWNNsVw41Gqt2kv",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#000000,#0a0010,#1a0030)",
    accentColor: "#9b59b6", tracks: [], credits: null, concept: "", era: ""
  },

  // Jazz
  {
    id: "a-love-supreme",
    genre: "jazz",
    title: "A Love Supreme",
    artist: "John Coltrane",
    year: 1965,
    spotifyAlbumId: "7Eoz7hJvaX1eFkbpQxC5PA",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#0a0800,#1a1400,#3a2a00)",
    accentColor: "#c8a820", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "time-out",
    genre: "jazz",
    title: "Time Out",
    artist: "The Dave Brubeck Quartet",
    year: 1959,
    spotifyAlbumId: "0nTTEAhCZsbbeplyDMIFuA",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#100a00,#2a1800,#5a3500)",
    accentColor: "#d4883a", tracks: [], credits: null, concept: "", era: ""
  },

  // Electronic
  {
    id: "discovery",
    genre: "electronic",
    title: "Discovery",
    artist: "Daft Punk",
    year: 2001,
    spotifyAlbumId: "2noRn2Aes5aoNVsU6iWThc",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#001510,#003a28,#006644)",
    accentColor: "#00cc88", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "in-colour",
    genre: "electronic",
    title: "In Colour",
    artist: "Jamie xx",
    year: 2015,
    spotifyAlbumId: "4gaNWHu5Caj3ItkYZ5i6uh",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#000a15,#001a30,#003a5a)",
    accentColor: "#00aaff", tracks: [], credits: null, concept: "", era: ""
  },

  // K-Pop — NewJeans 전체 디스코그래피
  {
    id: "newjeans-ep",
    genre: "kpop",
    title: "New Jeans",
    artist: "NewJeans",
    year: 2022,
    spotifyAlbumId: "1HMLpmZAnNyl9pxvOnTovV",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#0a1020,#1a2a40,#2a4060)",
    accentColor: "#90caf9", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "omg",
    genre: "kpop",
    title: "OMG",
    artist: "NewJeans",
    year: 2023,
    spotifyAlbumId: "45ozep8uHHnj5CCittuyXj",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#100a1a,#2a1a3a,#4a2a6a)",
    accentColor: "#ce93d8", tracks: [], credits: null, concept: "", era: ""
  },
  // get-up (2023) 은 기존 DB에 등록되어 있음
  {
    id: "how-sweet",
    genre: "kpop",
    title: "How Sweet",
    artist: "NewJeans",
    year: 2024,
    spotifyAlbumId: "0EhZEM4RRz0yioTgucDhJq",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#1a1000,#3a2800,#6a4a00)",
    accentColor: "#ffcc70", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "supernatural-newjeans",
    genre: "kpop",
    title: "Supernatural",
    artist: "NewJeans",
    year: 2024,
    spotifyAlbumId: "0IxlipeDanNHiHDs9tYjpm",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#001a10,#003a28,#006644)",
    accentColor: "#80cbc4", tracks: [], credits: null, concept: "", era: ""
  },

  // Alternative
  {
    id: "in-rainbows",
    genre: "alternative",
    title: "In Rainbows",
    artist: "Radiohead",
    year: 2007,
    spotifyAlbumId: "5vkqYmiPBYLaalcmjujWxK",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#1a0000,#3a0808,#6a1010)",
    accentColor: "#cc3333", tracks: [], credits: null, concept: "", era: ""
  },
  {
    id: "currents",
    genre: "alternative",
    title: "Currents",
    artist: "Tame Impala",
    year: 2015,
    spotifyAlbumId: "79dL7FLiJFOO0EoehUHQBv",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#000a15,#001530,#003060)",
    accentColor: "#3399ff", tracks: [], credits: null, concept: "", era: ""
  },

  // Soul
  {
    id: "songs-in-the-key-of-life",
    genre: "soul",
    title: "Songs in the Key of Life",
    artist: "Stevie Wonder",
    year: 1976,
    spotifyAlbumId: "6YUCc2RiXcEKS9ibuZxjt0",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#1a0800,#4a2000,#8a4400)",
    accentColor: "#e87820", tracks: [], credits: null, concept: "", era: ""
  },

  // Classical
  {
    id: "goldberg-variations",
    genre: "classical",
    title: "Goldberg Variations",
    artist: "Glenn Gould",
    year: 1981,
    spotifyAlbumId: "1aCpHSQE5ghxibsQ5gkBe0",
    releaseDate: "", label: "", duration: "", edition: "",
    coverImage: "", coverGradient: "linear-gradient(160deg,#100e08,#2a2618,#4a4430)",
    accentColor: "#d4c070", tracks: [], credits: null, concept: "", era: ""
  }
];

const ARTISTS = [
  {
    id: "tyler-the-creator",
    name: "Tyler, the Creator",
    photo: "img/artist/artist_tyler-the-creator.jpg",
    origin: "Los Angeles, CA, USA",
    activeFrom: 2007,
    genres: ["hip-hop", "alternative"],
    accentColor: "#E8A830",
    bio: "Tyler Gregory Okonma는 LA 출신의 래퍼·프로듀서·감독이다. Odd Future 결성을 시작으로 독보적인 비주얼 아이덴티티와 프로덕션 스타일을 구축했으며, 앨범마다 전혀 다른 페르소나와 음악 세계를 선보이고 있다. 고독과 자아 탐구를 중심 주제로 삼으며 Grammy를 비롯한 수많은 수상 경력을 보유하고 있다."
  },
  {
    id: "kendrick-lamar",
    name: "Kendrick Lamar",
    photo: "img/artist/artist_kendrick-lamar.jpg",
    origin: "Compton, CA, USA",
    activeFrom: 2003,
    genres: ["hip-hop"],
    accentColor: "#CC0000",
    bio: "Kendrick Lamar Duckworth는 Compton 출신의 래퍼이자 작가다. 복잡한 서사 구조와 정치·사회적 메시지를 담은 음악으로 힙합 최초의 퓰리처 음악상 수상자가 되었다. 다섯 장의 정규 앨범 모두 비평과 상업적으로 성공을 거두었으며, 세대를 정의하는 목소리로 꼽힌다."
  },
  {
    id: "frank-ocean",
    name: "Frank Ocean",
    photo: "img/artist/artist_frank-ocean.jpg",
    origin: "New Orleans, LA, USA",
    activeFrom: 2011,
    genres: ["rnb"],
    accentColor: "#ffd700",
    bio: "Christopher Edwin Breaux는 뉴올리언스 출신의 싱어송라이터다. Channel ORANGE와 Blonde 두 장의 정규 앨범으로 현대 R&B의 방향성을 바꾸었다는 평가를 받는다. 디지털과 아날로그 텍스처를 자유롭게 혼합하며 사랑·정체성·상실을 시적으로 표현한다."
  },
  {
    id: "sza",
    name: "SZA",
    photo: "img/artist/artist_sza.jpg",
    origin: "Maplewood, NJ, USA",
    activeFrom: 2012,
    genres: ["rnb"],
    accentColor: "#00b4d8",
    bio: "Solána Imani Rowe는 뉴저지 출신의 싱어송라이터다. Top Dawg Entertainment 소속으로 Ctrl과 SOS를 통해 차세대 R&B를 대표하는 목소리가 되었다. 취약함과 자기 모순을 솔직하게 노래하며 2020년대 여성 R&B 부흥을 이끌고 있다."
  },
  {
    id: "newjeans",
    name: "NewJeans",
    photo: "img/artist/artist_newjeans.jpg",
    origin: "Seoul, South Korea",
    activeFrom: 2022,
    genres: ["kpop"],
    accentColor: "#ff9a9e",
    bio: "ADOR 레이블 소속의 5인조 K-Pop 그룹이다. 과잉된 퍼포먼스보다 자연스러운 무드와 Y2K 감성의 미니멀리즘을 앞세워 데뷔와 동시에 세계적 주목을 받았다. Hanni, Minji, Danielle, Haerin, Hyein으로 구성되어 있다."
  },
  {
    id: "radiohead",
    name: "Radiohead",
    photo: "img/artist/artist_radiohead.jpg",
    origin: "Abingdon, Oxfordshire, UK",
    activeFrom: 1985,
    genres: ["alternative", "rock"],
    accentColor: "#4a90d9",
    bio: "Thom Yorke, Jonny Greenwood를 주축으로 한 영국의 록 밴드다. Pablo Honey부터 A Moon Shaped Pool까지 장르의 경계를 넘나들며 실험적인 음악을 발표해 왔다. OK Computer로 록의 미래를 재정의했으며, 이후 Kid A로 전자음악과 록의 경계를 지웠다."
  },
  {
    id: "daft-punk",
    name: "Daft Punk",
    photo: "img/artist/artist_daft-punk.jpg",
    origin: "Paris, France",
    activeFrom: 1993,
    genres: ["electronic"],
    accentColor: "#ffb347",
    bio: "Thomas Bangalter와 Guy-Manuel de Homem-Christo로 구성된 프랑스의 전자음악 듀오다. 헬멧을 쓴 로봇 페르소나로 유명하며, Homework부터 Random Access Memories까지 전자음악의 역사를 새로 썼다. 2021년 해체를 선언했다."
  },
  {
    id: "miles-davis",
    name: "Miles Davis",
    photo: "img/artist/artist_miles-davis.jpg",
    origin: "Alton, IL, USA",
    activeFrom: 1944,
    genres: ["jazz"],
    accentColor: "#4a7fcb",
    bio: "Miles Dewey Davis III는 미국 재즈의 역사를 수차례 다시 쓴 트럼페터이자 작곡가다. 비밥, 쿨 재즈, 모달 재즈, 재즈 퓨전의 탄생 모두에 핵심적으로 관여했다. Kind of Blue는 역사상 가장 많이 팔린 재즈 앨범으로 기록되어 있다."
  },
  {
    id: "marvin-gaye",
    name: "Marvin Gaye",
    photo: "img/artist/artist_marvin-gaye.jpg",
    origin: "Washington, D.C., USA",
    activeFrom: 1957,
    genres: ["soul"],
    accentColor: "#c06000",
    bio: "Marvin Pentz Gaye Jr.는 Motown의 황금기를 대표하는 소울·R&B 아티스트다. What's Going On으로 흑인 음악에 정치적 메시지를 담는 새로운 장을 열었으며, Let's Get It On으로 성적 자유를 상징하는 목소리가 되었다. 1984년 비극적으로 세상을 떠났다."
  },
  {
    id: "billie-eilish",
    name: "Billie Eilish",
    photo: "img/artist/artist_billie-eilish.jpg",
    origin: "Los Angeles, CA, USA",
    activeFrom: 2015,
    genres: ["pop"],
    accentColor: "#39ff14",
    bio: "Billie Eilish Pirate Baird O'Connell은 오빠 FINNEAS와 함께 침실에서 음악을 만들기 시작한 LA 출신의 팝 아티스트다. 데뷔 앨범으로 Grammy 주요 4개 부문을 석권하며 10대 아티스트 최초 기록을 세웠다. 어둠과 취약함을 미학으로 삼는 독보적인 세계관을 지닌다."
  }
];
