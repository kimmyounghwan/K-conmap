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

  const 누르면 = async () => {
    if (도는중) return
    set도는중(true)
    try { sessionStorage.setItem(RELOAD_KEY, Date.now().toString(36)) } catch { /* 사생활 모드 */ }
    try { if (window.gtag) window.gtag('event', 'refresh_click') } catch { /* 광고차단기 */ }
    /* 옛 서비스워커가 담아 둔 것이 있으면 비웁니다 (없으면 그냥 지나갑니다).
       ⚠️ 여기서 «기다리기만» 하면 안 됩니다. caches / serviceWorker 는 워커가 자고 있으면
          답을 영영 안 주는 일이 있습니다(sw.js v1 사고가 정확히 그것이었습니다).
          그러면 단추가 도는 그림만 돌고 화면은 영원히 안 열립니다.
       → 1.5초까지만 기다리고, 그 뒤에는 비우든 말든 **무조건** 다시 엽니다. */
    const 비우기 = (async () => {
      if (window.caches) {
        const ks = await caches.keys()
        await Promise.all(ks.map((k) => caches.delete(k)))
      }
      if (navigator.serviceWorker) {
        const rs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(rs.map((r) => r.update()))
      }
    })().catch(() => { /* 안 되면 그냥 다시 엽니다 */ })
    const 시간초과 = new Promise((done) => setTimeout(done, 1500))
    await Promise.race([비우기, 시간초과])
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
