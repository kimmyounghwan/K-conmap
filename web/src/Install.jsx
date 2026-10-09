import { useEffect, useState } from 'react'
import { 세기 } from './lib/받은수.jsx'

/* ══════════════════════════════════════════════════════════════
   📲 홈 화면에 추가 (2026-09-06)
   소장님: 「사이트 화면에 이걸 만들어 줘. 클릭하면 홈 화면에 띄게. 아이폰이든 삼성폰이든 다 되게.
            이용자들이 잘 보이는 장소에, 페이지마다.」

   두 자리에 둡니다 (둘 다 모든 페이지에):
     · 위 막대 오른쪽 «📲 앱으로» 알약 — 늘 있음
     · 메뉴 아래 띠 «홈 화면에 추가하면 앱처럼 씁니다 [추가하기] ✕» — ✕ 는 이 탭 동안만 숨김(다시 들어오면 또 뜸 · 10-05). 설치했으면(앱으로 열린 적이 있거나 appinstalled) 둘 다 안 보임

   폰마다 되는 길이 다릅니다 — 정직하게 셋으로 나눕니다:
     · 안드로이드 크롬·삼성 인터넷·PC 크롬/엣지 → beforeinstallprompt. 버튼 한 번에 설치창. **진짜 원클릭.**
     · 아이폰(Safari) → 애플이 프로그램으로 설치창을 못 띄우게 막아 놨습니다. 어느 사이트도 못 합니다.
       「공유 → 홈 화면에 추가」 를 안내합니다. 두 번 누르면 됩니다.
     · 그 밖 → 브라우저 메뉴에서 «홈 화면에 추가» 를 찾도록 안내.
   이미 앱으로 열려 있으면(standalone) 아무것도 안 보입니다.

   ⚠️ beforeinstallprompt 는 한 번만 오고 prompt() 도 한 번만 부를 수 있습니다.
      알약과 띠가 각자 들고 있으면 한쪽이 쓴 뒤 다른 쪽이 죽은 것을 들고 있게 됩니다.
      그래서 모듈 하나가 들고, 두 자리가 같이 봅니다.
   ══════════════════════════════════════════════════════════════ */

/* 소장님(09-06): 「x 버튼을 누르면 하루 동안 안 보이게, 설치했다면 안 보이게」
   → 소장님(10-05): 「이건 항상 지금처럼 위에 뜨게 해줘」 「설치하면, 제거되게 해줘. x만 누르고 설치하지 않으면 계속 떠야해」
     ✕ 는 «이 창(탭)을 닫을 때까지만» 숨깁니다(sessionStorage) — 다시 들어오면 또 뜹니다. 설치하면 안 뜹니다. */
const DISMISS_KEY = 'kcm_install_hide2'    // 띠의 ✕ — 이 탭 동안만
const INSTALLED_KEY = 'kcm_installed'       // 설치 사실 — 이 브라우저에서는 영영 안 보임

/* «설치했다» 를 아는 길은 둘뿐이고, 둘 다 브라우저에 적어 둡니다:
     · appinstalled 이벤트 (안드로이드·PC 크롬)
     · 앱으로 열린 상태(standalone) 를 한 번이라도 봤다 (아이폰은 이벤트가 없어 이 길뿐)
   적어 두지 않으면 «설치한 뒤 브라우저로 다시 들어왔을 때» 또 설치하라고 조릅니다. */
const isStandalone = () =>
  (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
  window.navigator.standalone === true
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
/* 🖥 2026-10-05 — 소장님: 「설치해도 아이콘만 생기게 해주고, 설치안했을때처럼 보이게 해줘」 「너무 복잡해」 「자동으로 돼게 해줘」
   「건설맵 아이콘만 생기게 하자고, 바탕화면에」 → 결정: «설치 한 번» 으로 바탕화면·작업표시줄 아이콘을 만들고(브라우저가 해 줌),
   PC 에서 그 아이콘으로 열린 «앱 창» 은 첫 클릭에 브라우저 탭으로 옮깁니다(아래 AppWindowBar).
   ⚠️ 사이트가 혼자 바탕화면에 아이콘을 놓는 길은 없습니다 — 브라우저의 «설치» 만 됩니다. 그래서 manifest 는 앱 창(standalone) 그대로 둡니다. */
export const isPC = () => {
  const u = navigator.userAgent || ''
  return !(/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(u) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
}
const markInstalled = () => { try { localStorage.setItem(INSTALLED_KEY, '1') } catch { /* noop */ } }

/* 🩹 G213 (2026-10-09) 소장님 「다른 사람 컴에서 하니까 아이콘 설치가 안돼. 점검해줘」
   점검: 사이트(manifest · 서비스 워커 · 아이콘)는 설치 조건을 다 채움 — 새 크롬(141)에서 «아이콘 만들기» 를 누르면 설치 창이 바로 뜸(시험으로 확인).
   안 되는 것은 «그 컴퓨터의 브라우저 사정» 이었습니다:
     · 설치 창을 안 주는 브라우저(파이어폭스 · 웨일 · 카톡 안 브라우저 등) → 전에는 크롬 · 엣지 메뉴만 적은 안내가 떠 따라 할 수 없었음
     · 그 브라우저에 이미 설치했거나 예전에 «취소» → 설치 창이 안 옴(같은 안내)
     · 엣지는 설치해도 «바탕 화면 바로 가기» 를 체크하지 않으면 바탕화면에 아이콘이 안 생김
     · 설치 창을 닫으면 아무 말 없이 끝났음
   → 브라우저마다 맞는 길 + «어느 브라우저나 되는 길»(주소창 맨 왼쪽 표시를 바탕화면으로 끌어 놓기) · 설치 뒤 · 닫은 뒤에도 안내.
   📊 |앱설치창|pc·폰 (설치 창을 띄움) · |앱설치닫음|pc·폰 · |앱안내|pc·브라우저 (설치 창 없이 안내만) — 어느 브라우저에서 막히는지 알 수 있게 */
export const 브라우저 = () => {
  const u = navigator.userAgent || ''
  if (/KAKAOTALK|NAVER\(inapp|DaumApps|Line\/|FBAN|FBAV|Instagram|everytimeApp|BAND\//i.test(u)) return 'inapp'
  if (/Whale\//.test(u)) return 'whale'
  if (/Edg(e|A|iOS)?\//.test(u)) return 'edge'
  if (/SamsungBrowser/.test(u)) return 'samsung'
  if (/Firefox\/|FxiOS/.test(u)) return 'firefox'
  if (/OPR\/|Opera/.test(u)) return 'opera'
  if (/Chrome\/|CriOS/.test(u)) return 'chrome'
  if (/Safari\//.test(u)) return 'safari'
  return 'other'
}
const 기기말 = () => (isPC() ? 'pc' : '폰')

/* 📊 2026-10-05 — 소장님: 「현재 몇 명이 설치했는지 숫자를 알 수 있다면」 → 지금까지는 기록이 없어 모릅니다. 앞으로 셉니다.
   · app_open      — 아이콘(시작 주소 /?src=app)이나 앱 창으로 열었을 때, 탭마다 한 번 {how: window|tab, device: pc|phone}
   · app_installed — 설치했을 때(안드로이드·PC 크롬/엣지가 알려 줌)
   애널리틱스 «이벤트» 에서 사용자 수로 봅니다. 개인 정보는 넣지 않습니다.
   + 소장님 상시 지시(10-05) 「바탕화면에 아이콘 만드는 것 꼭 카운트해」 → 사이트 데이터베이스에도 «누적» 으로 셉니다(lib/받은수.jsx 세기 · 화면엔 안 보임 — 물으면 클로드가 dl/p.json 을 읽어 알려 드림):
     |앱설치|pc · |앱설치|폰 — 설치(아이콘 만들기)한 횟수
     |앱사람|pc · |앱사람|폰 — 아이콘(앱 창)으로 쓰는 브라우저 수(브라우저마다 한 번 — 예전에 설치한 사람도 아이콘으로 열면 셈)
     |앱열기|pc · |앱열기|폰 — 아이콘으로 연 횟수(탭마다 한 번) · |앱옮김|pc — 옛 앱 창에서 브라우저 탭으로 옮긴 횟수 */
const 셈 = (이름, 값) => {
  try { if (window.gtag) window.gtag('event', 이름, 값) } catch { /* 광고차단기 */ }
  const 기기 = 값 && 값.device === 'phone' ? '폰' : 'pc'
  const 열쇠 = { app_installed: '|앱설치|', app_open: '|앱열기|', app_moved: '|앱옮김|', app_person: '|앱사람|' }[이름]
  if (열쇠) 세기(열쇠 + 기기)
}
const installed = () => {
  if (isStandalone()) { markInstalled(); return true }
  try { return localStorage.getItem(INSTALLED_KEY) === '1' } catch { return false }
}
const hidden = () => {
  try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}
const hideFor = () => {
  try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* noop */ }
}

let deferred = null
const subs = new Set()
const notify = () => subs.forEach((f) => f())
if (typeof window !== 'undefined') {
  /* 브라우저가 «설치하시겠어요?» 를 준다 = 지금은 설치돼 있지 않다(지웠다) — 예전에 적어 둔 «설치함» 을 지우고 띠를 다시 띄웁니다 */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferred = e
    if (!isStandalone()) { try { localStorage.removeItem(INSTALLED_KEY) } catch { /* noop */ } }
    notify()
  })
  window.addEventListener('appinstalled', () => { deferred = null; markInstalled(); 셈('app_installed', { device: isPC() ? 'pc' : 'phone' }); notify() })
  /* 아이콘으로 열었나 — 세고 나서 주소의 ?src=app 은 떼어 냅니다(주소를 복사해 나눌 때 섞이지 않게) */
  try {
    const q = new URLSearchParams(location.search)
    const 아이콘 = q.get('src') === 'app' || q.get('src') === 'app-sc'   /* 🪪 G188 app-sc = 앱 아이콘을 길게 눌러 고른 단축 메뉴(manifest shortcuts) */
    if (q.get('src') === 'app-sc') 세기('|마이|앱단축')
    const 창 = isStandalone()
    if (아이콘 || 창) {
      let 첫 = true
      try { 첫 = !sessionStorage.getItem('kcm_app_open'); sessionStorage.setItem('kcm_app_open', '1') } catch { /* 사생활 보호 모드 */ }
      if (첫) 셈('app_open', { how: 창 ? 'window' : 'tab', device: isPC() ? 'pc' : 'phone' })
      /* 이 브라우저에서 처음 — 아이콘으로 쓰는 사람 하나 */
      let 처음 = false
      try { 처음 = !localStorage.getItem('kcm_app_person'); localStorage.setItem('kcm_app_person', '1') } catch { /* 사생활 보호 모드 */ }
      if (처음) 셈('app_person', { device: isPC() ? 'pc' : 'phone' })
    }
    if (아이콘) {
      q.delete('src')
      history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q.toString() : '') + location.hash)
    }
  } catch { /* 없음 */ }
}

function useInstall() {
  const [, tick] = useState(0)
  const [done, setDone] = useState(() => installed())
  const [guide, setGuide] = useState(false)
  useEffect(() => {
    const f = () => { tick((n) => n + 1); setDone(installed()) }
    subs.add(f)
    return () => subs.delete(f)
  }, [])
  const install = async () => {
    const e = deferred
    if (e) {
      deferred = null
      try {
        e.prompt()
        세기('|앱설치창|' + 기기말())
        const r = await e.userChoice
        if (r && r.outcome === 'accepted') {
          markInstalled(); setDone(true)
          /* PC — 엣지는 바탕화면 바로 가기를 체크해야 아이콘이 생김 · 크롬도 안 보이면 같은 길로 */
          if (isPC()) setGuide('설치')
        } else { 세기('|앱설치닫음|' + 기기말()); setGuide('닫음') }
        notify()
        return
      } catch { /* 이미 쓴 이벤트 — 아래 안내로 */ }
    }
    세기('|앱안내|' + 기기말() + '·' + 브라우저())
    setGuide(true)
  }
  return { done, guide, setGuide, install }
}

function Guide({ onClose, 때 = true }) {
  const ios = isIOS()
  const pc = isPC()
  const 브 = 브라우저()
  const 되는곳 = typeof window !== 'undefined' && 'onbeforeinstallprompt' in window     /* 크롬 · 엣지 · 웨일 · 삼성 — 설치 창을 줄 수 있는 브라우저 */
  /* 어느 브라우저나 되는 길(윈도 PC) — 주소창 맨 왼쪽 표시(🔒 · ⚙)를 끌어 바탕화면에 놓으면 바로가기 파일이 생김 */
  const 끌기 = <li>어느 브라우저나: 주소창 <b>맨 왼쪽 표시</b>(🔒 또는 ⚙)를 마우스로 <b>끌어서 바탕화면에 놓으면</b> K-건설맵 바로가기가 생깁니다</li>
  return (
    <div className="installguide" onClick={onClose}>
      <div className="box" onClick={(e) => e.stopPropagation()}>
        <div className="h">{때 === '설치' ? '✅ 설치했습니다' : pc ? '🖥 바탕화면에 K-건설맵 아이콘 만들기' : '📲 홈 화면에 추가'}</div>
        {때 === '설치' ? (
          <ol>
            <li>바탕화면에 아이콘이 <b>안 보이면</b> — 엣지는 방금 뜬 창에서 <b>«바탕 화면 바로 가기 만들기»</b>를 체크합니다</li>
            <li>그 창을 닫았으면: 시작 메뉴에서 <b>K-건설맵</b>을 찾아 오른쪽 클릭 → <b>작업 표시줄에 고정</b></li>
            {끌기}
          </ol>
        ) : pc ? (
          <>
            {때 === '닫음'
              ? <div className="note sm">설치 창을 닫으셨습니다. 다시 하시려면 아래 길로 하시면 됩니다.</div>
              : 되는곳 && <div className="note sm">이 브라우저가 지금은 설치 창을 주지 않습니다 — <b>이미 설치돼 있으면</b> 시작 메뉴에서 «K-건설맵» 을 찾아 보세요(예전에 «취소» 를 눌렀거나 회사 컴퓨터라 막혀 있을 수도 있습니다).</div>}
            <ol>
              {브 === 'edge' && <li>오른쪽 위 <b>⋯</b> → <b>앱</b> → <b>«이 사이트를 앱으로 설치»</b> → 다음 창에서 <b>«바탕 화면 바로 가기 만들기»</b> 체크</li>}
              {브 === 'chrome' && <li>오른쪽 위 <b>⋮</b> → <b>전송, 저장, 공유</b> → <b>«바로가기 만들기…»</b> → <b>만들기</b></li>}
              {끌기}
            </ol>
          </>
        ) : 브 === 'inapp' ? (
          <ol>
            <li>카카오톡 · 네이버 앱 <b>안</b>에서는 홈 화면에 못 넣습니다 — 오른쪽 위(또는 아래) <b>⋮ · 공유</b> → <b>«다른 브라우저로 열기»</b>(아이폰은 «Safari로 열기»)</li>
            <li>열린 브라우저에서 위 <b>«추가하기»</b> 를 다시 누릅니다</li>
          </ol>
        ) : ios ? (
          <ol>
            <li>화면 <b>아래 가운데</b>(아이패드는 위) <b>공유 버튼</b> <span className="ic">⎋</span> 을 누릅니다</li>
            <li>목록을 조금 내려 <b>「홈 화면에 추가」</b> 를 누릅니다</li>
            <li>오른쪽 위 <b>「추가」</b></li>
          </ol>
        ) : 브 === 'samsung' ? (
          <ol>
            <li>아래 <b>메뉴(≡)</b> 를 누릅니다</li>
            <li><b>「현재 페이지 추가」</b> → <b>「홈 화면」</b></li>
          </ol>
        ) : (
          <ol>
            <li>브라우저 오른쪽 위 <b>메뉴(⋮)</b> 를 누릅니다</li>
            <li><b>「홈 화면에 추가」</b> 또는 <b>「앱 설치」</b> 를 누릅니다</li>
            <li><b>「설치」</b> 또는 <b>「추가」</b></li>
          </ol>
        )}
        <div className="note sm">
          {pc ? '설치 파일은 없습니다. 아이콘으로 열면 처음 한 번 누를 때 브라우저 탭으로 옮겨 갑니다.' : '홈 화면에 K-건설맵 아이콘이 생기고, 열면 브라우저 테두리 없이 앱처럼 뜹니다. 설치 파일은 없습니다.'}
          {ios && 브 !== 'inapp' ? ' 아이폰은 Safari 에서만 됩니다.' : ''}
        </div>
        <button className="btn sm" onClick={onClose}>알겠습니다</button>
      </div>
    </div>
  )
}

/** 위 막대 오른쪽 알약 — 모든 페이지 */
export function InstallPill() {
  const { done, guide, setGuide, install } = useInstall()
  if (done) return guide === '설치' ? <Guide 때="설치" onClose={() => setGuide(false)} /> : null
  return (
    <>
      {/* 📱 2026-09-17 — 좁은 화면에서 글자를 접습니다 (styles.css .instlong).
          위 막대에 알약이 넷(보는 방법·새로고침·사라사·앱으로)이라 360px 에서 잘렸습니다. */}
      {isPC()
        ? <button className="installbtn" onClick={install} title="바탕화면·작업표시줄에 K-건설맵 아이콘을 만듭니다 — 한 번 누르면 됩니다">
          🖥<span className="instlong"> 아이콘</span></button>
        : <button className="installbtn" onClick={install} title="홈 화면에 아이콘을 만들어 앱처럼 씁니다">
          📲<span className="instlong"> 앱으로</span></button>}
      {guide && <Guide 때={guide} onClose={() => setGuide(false)} />}
    </>
  )
}

/** 메뉴 아래 띠 — 모든 페이지 맨 위, ✕ 는 이 탭 동안만 숨김 · 설치했으면 안 보임(지우면 다시 뜸) */
export function InstallBar() {
  const { done, guide, setGuide, install } = useInstall()
  const [closed, setClosed] = useState(() => hidden())
  if (done) return guide === '설치' ? <Guide 때="설치" onClose={() => setGuide(false)} /> : null
  if (closed) return null
  return (
    <>
      <div className="installbar">
        {isPC()
          ? <span className="t">🖥 <b>바탕화면·작업표시줄</b>에 K-건설맵 아이콘을 만들어 두세요 — 한 번 누르면 됩니다.</span>
          : <span className="t">📲 <b>홈 화면에 추가</b>하면 앱처럼 열립니다 — 설치 파일 없이, 아이콘 하나로.</span>}
        <button className="go" onClick={install}>{isPC() ? '아이콘 만들기' : '추가하기'}</button>
        <button className="x" aria-label="닫기" onClick={() => { hideFor(); setClosed(true) }}>✕</button>
      </div>
      {guide && <Guide 때={guide} onClose={() => setGuide(false)} />}
    </>
  )
}

/** 🖥 예전에 설치한 PC «앱 창» 으로 열렸을 때 — 처음 한 번 누르면 «자동으로» 같은 화면을 브라우저 탭으로 옮겨 열고 앱 창은 닫습니다.
 *  소장님: 「이미 설치한 사람들도, 수정돼서 보이게 해주고」 「자동으로 돼게 해줘」
 *  ⚠️ 누르기 전에 저절로 여는 것은 브라우저가 막습니다(팝업 차단) — 그래서 «첫 클릭» 에 붙입니다.
 *  ⚠️ 설치할 때 고른 «창으로 열기» 는 브라우저가 지켜서(크롬 문서: 사용자 선택이 늘 우선) 사이트 설정만으로는 안 바뀝니다.
 *  ⚠️ 꼭 <a target="_blank"> 를 누르게 합니다(window.open 은 앱 창이 또 뜸 · web.dev «Window management»).
 *  🩹 G143 (2026-10-05) 소장님 화면: 띠는 떴는데 «새로고침해도 안 바뀌고, 뒤로가기도 없는데»
 *     → 같은 주소(k-conmap.com · 앱 범위 안)를 target=_blank 로 열면 엣지가 탭이 아니라 «앱 창» 을 하나 더 띄우고 옛 창은 닫혀
 *       눈에는 아무것도 안 바뀐 것처럼 보였습니다. 이제 «같은 사이트의 다른 주소» k-conmap.web.app 을 엽니다 —
 *       앱 범위 밖이라 엣지가 «일반 탭» 으로 열고, 그 탭은 index.html 맨 위 규칙으로 곧바로 k-conmap.com 같은 화면으로 넘어갑니다.
 *     앱 창에는 뒤로 가기 단추가 없어 띠에 «Alt + ←» 를 적습니다. */
export function AppWindowBar() {
  const 켬 = typeof window !== 'undefined' && isStandalone() && isPC()
  const [옮김, set옮김] = useState(false)
  useEffect(() => {
    if (!켬) return undefined
    const 첫 = (e) => {
      window.removeEventListener('pointerdown', 첫, true)
      if (e.button != null && e.button !== 0) return
      e.preventDefault(); e.stopPropagation()
      const a = document.createElement('a')
      /* 🩹 G143 — 앱 범위 밖 주소로(위 설명). 시험 서버(127.0.0.1 등)에서는 그 자리 그대로 */
      const 밖 = location.hostname === 'k-conmap.com' ? 'https://k-conmap.web.app' : location.origin
      a.href = 밖 + location.pathname + location.search + location.hash
      a.target = '_blank'; a.rel = 'noopener'
      document.body.appendChild(a); a.click(); a.remove()
      /* 그다음 뒤따르는 click 을 한 번 막습니다 — 누른 단추·링크가 앱 창 안에서 따로 움직이지 않게.
         ⚠️ a.click() 보다 «뒤에» 거세요 — 먼저 걸면 위의 a.click() 까지 막혀 탭이 안 열렸습니다(시험으로 확인) */
      const 막기 = (c) => { c.preventDefault(); c.stopPropagation(); window.removeEventListener('click', 막기, true) }
      window.addEventListener('click', 막기, true)
      setTimeout(() => window.removeEventListener('click', 막기, true), 1500)
      셈('app_moved', { device: 'pc' })
      set옮김(true)
      setTimeout(() => { try { window.close() } catch { /* 못 닫으면 띠 글만 바뀜 */ } }, 400)
    }
    window.addEventListener('pointerdown', 첫, true)
    return () => window.removeEventListener('pointerdown', 첫, true)
  }, [켬])
  if (!켬) return null
  return (
    <div className="installbar appwin" role="status">
      <span className="t">{옮김
        ? <>🖥 <b>브라우저 탭</b>에서 열었습니다 — 이 창은 닫으셔도 됩니다.</>
        : <>🖥 K-건설맵은 이제 PC 에서 <b>브라우저 탭</b>으로 엽니다 — <b>아무 곳이나 한 번 누르면</b> 자동으로 옮겨 갑니다. <span className="appwin-k">(이 창에서 뒤로 가기: <b>Alt + ←</b>)</span></>}</span>
    </div>
  )
}
