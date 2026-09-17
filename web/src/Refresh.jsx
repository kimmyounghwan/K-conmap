/* 🔄 «새로고침» — 화면 맨 위, 모든 페이지에. (2026-09-17)
 *
 * 소장님: 「건설맵 제일 위 쪽에 새로고침 만들어 줘」
 *
 * ■ 왜 필요한가
 *   자료는 GitHub 이 하루 여러 회차로 갱신합니다. 그런데 보는 쪽에는 캐시가 셋 있습니다.
 *     ① 이 화면이 한 번 받은 것을 들고 있는 메모리 (lib/data.js 의 cache)
 *     ② 브라우저 캐시 — /data/first.json 은 15분 동안 «묻지도 않고» 옛것을 내줍니다
 *     ③ 그 15분이 지나도 하루 안이면 옛것을 먼저 보여 주고 뒤에서 받습니다
 *          (firebase.json: max-age=900, stale-while-revalidate=86400)
 *   그래서 새 자료가 이미 올라와 있어도 **눌러도 그대로** 인 것처럼 보일 때가 있습니다.
 *   소장님이 「3시에 멈춰 있어」 하시는 그 순간, 진짜 멈춘 것인지 내 화면만 옛것인지
 *   **가려낼 방법이 없었습니다.** 이 단추가 그 하나를 가려 줍니다.
 *
 * ■ 무엇을 하나 — 딱 세 가지. 더 하지 않습니다
 *   1. 도장을 하나 찍습니다 (sessionStorage)
 *   2. 서비스워커가 혹시 뭔가 담아 뒀으면 비웁니다 (지금 sw.js 는 담지 않지만, 옛 워커가
 *      남아 있는 기기가 있습니다 — v1 이 실제로 사고를 냈습니다. sw.js 머리말 참조)
 *   3. 화면을 다시 엽니다 → lib/data.js 가 도장을 보고 «이번만» 캐시를 비켜 갑니다
 *
 * ⚠️ 여기서 자료를 직접 받지 않습니다. 화면마다 받는 것이 다르고(1순위·공고·업체·서식…),
 *    여기서 목록을 들고 있으면 화면을 하나 늘릴 때마다 여기도 고쳐야 합니다. 반드시 빠집니다.
 *    → 「도장 찍고 다시 열기」 한 가지만 합니다. 나머지는 각 화면이 평소 하던 대로 합니다.
 * ⚠️ 주소에 ?_r= 같은 것을 붙이지 않습니다 — 주소창이 지저분해지고, 그 주소가 그대로
 *    복사돼 돌아다닙니다. 도장은 sessionStorage 에만 있다가 다음 회차에 지워집니다.
 */
import { useState } from 'react'
import { RELOAD_KEY } from './lib/data.js'

export default function RefreshBtn() {
  const [도는중, set도는중] = useState(false)

  const 누르면 = () => {
    if (도는중) return
    set도는중(true)
    try { sessionStorage.setItem(RELOAD_KEY, Date.now().toString(36)) } catch { /* 사생활 모드 */ }
    try { if (window.gtag) window.gtag('event', 'refresh_click') } catch { /* 광고차단기 */ }
    /* 🐛 2026-09-17, 진짜 사이트에서 잡은 것 — **아무것도 기다리지 않습니다.**
       처음에는 캐시를 비우고 «1.5초까지만 기다렸다가» 열게 했습니다.
       그런데 k-conmap.com 에서 재 보니 `caches.keys()` 가 **영영 안 끝나고**,
       믿고 있던 그 1.5초 `setTimeout` 마저 **안 울렸습니다.**
       화면이 안 보이는 상태(document.visibilityState === 'hidden')였기 때문입니다 —
       크롬은 숨은 탭의 타이머를 재웁니다. 단추는 「받는 중」에서 멈춰 있었습니다.
       ⚠️ 「기다리다 안 되면 시간초과로 빠져나온다」 는 **시간초과 자체가 타이머** 라서
          타이머가 자는 곳에서는 아무 구실도 못 합니다. 이게 이번에 배운 것입니다.
       → 다시 열기를 **맨 앞**에 둡니다. 비우기는 보내만 놓고 기다리지 않습니다.
          어차피 sw.js 는 아무것도 담지 않고(파일 머리말 참조), 진짜 캐시는
          브라우저의 HTTP 캐시인데 그건 위의 «도장» 이 비켜 갑니다. */
    try {
      if (window.caches) {
        caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {})
      }
      if (navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.update())).catch(() => {})
      }
    } catch { /* 안 되면 그냥 다시 엽니다 */ }
    window.location.reload()
  }

  return (
    <button type="button" className={'rfbtn' + (도는중 ? ' on' : '')} onClick={누르면}
      title="자료를 다시 받아 옵니다 — 화면이 옛것을 들고 있을 때"
      aria-label="새로고침">
      <span className="rfic" aria-hidden="true">🔄</span>
      <span className="rflong">{도는중 ? '받는 중' : '새로고침'}</span>
    </button>
  )
}
