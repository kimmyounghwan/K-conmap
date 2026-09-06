/* K-건설맵 서비스 워커 — «앱으로 설치» 조건을 채우기 위한 최소한. (2026-09-06, v2)
 *
 * 🚨 v1 의 사고 — `fetch` 를 가로채고 있었습니다.
 *
 *      (v1) self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request)) })
 *
 *    「그냥 통과시키는 것」 이라고 생각했지만 아닙니다. respondWith 를 부르는 순간
 *    **그 요청의 책임이 서비스워커로 넘어옵니다.** 워커가 잠들었다 깨는 사이,
 *    또는 다시 만든 fetch 가 원래 요청의 모드를 그대로 못 살릴 때 **응답이 영영 안 옵니다.**
 *    오류도 안 납니다 — 그냥 멈춰 있습니다.
 *
 *    실측 (2026-09-06, 소장님 크롬 · 라이브):
 *      · /guide/quantile 로 화면 안에서 이동 → **빈 화면**. Guide 묶음(js)을 아예 안 받음.
 *      · 그 페이지에서 fetch('/assets/index-*.js') → 성공도 실패도 안 함(영원히 대기).
 *      · 서비스워커를 등록 해제하고 같은 자리를 누름 → **정상**(Guide-CMA8-uQU.js 받고 글이 그려짐).
 *    지연 로딩하는 화면이 전부 걸립니다 — 설계변경·서식·구인구직·댓글·입찰 알아보기.
 *
 * ✅ 고친 방식: **아무것도 가로채지 않습니다.** 듣기만 하고 respondWith 를 부르지 않으면
 *    브라우저가 평소대로 처리합니다. 설치 조건(fetch 처리기 존재)은 그대로 채워집니다.
 *
 * ⚠️ 여기에 캐시를 넣자는 제안은 하지 마세요. 목록·공고 자료는 30분마다 바뀌고
 *    캐시 규칙은 firebase.json 이 파일마다 정해 두었습니다. 여기서 또 캐시하면
 *    «옛날 자료가 안 바뀌는» 사고가 납니다.
 * ⚠️ firebase.json 이 /sw.js 를 no-cache 로 주고 있어야 이 파일이 바로 퍼집니다. 확인할 것.
 */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => { /* 가로채지 않습니다 — 위 설명을 꼭 읽으세요 */ })
