/* K-건설맵 서비스 워커 — «앱으로 설치» 조건을 채우기 위한 최소한. (2026-09-06)
   ⚠️ 아무것도 캐시하지 않습니다. 목록·공고 자료는 30분마다 바뀌고, Firebase 캐시 규칙이
      이미 파일마다 정해져 있습니다. 여기서 캐시하면 «옛날 자료가 안 바뀌는» 사고가 납니다
      (내역서 «바로 받기» 에서 캐시로 하루를 잃은 적이 있습니다). 요청은 그대로 통과시킵니다. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request)) })
