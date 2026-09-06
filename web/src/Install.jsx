import { useEffect, useState } from 'react'

/* ══════════════════════════════════════════════════════════════
   📲 홈 화면에 추가 (2026-09-06)
   소장님: 「사이트 화면에 이걸 만들어 줘. 클릭하면 홈 화면에 띄게. 아이폰이든 삼성폰이든 다 되게.
            이용자들이 잘 보이는 장소에, 페이지마다.」

   두 자리에 둡니다 (둘 다 모든 페이지에):
     · 위 막대 오른쪽 «📲 앱으로» 알약 — 늘 있음
     · 메뉴 아래 띠 «홈 화면에 추가하면 앱처럼 씁니다 [추가하기] ✕» — ✕ 로 닫으면 하루 뒤에 다시. 설치했으면(앱으로 열린 적이 있거나 appinstalled) 둘 다 안 보임

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

/* 소장님(09-06): 「x 버튼을 누르면 하루 동안 안 보이게, 설치했다면 안 보이게」 */
const DISMISS_KEY = 'kcm_install_hide'     // 띠의 ✕ — 하루 뒤에 다시
const DISMISS_DAYS = 1
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
const markInstalled = () => { try { localStorage.setItem(INSTALLED_KEY, '1') } catch { /* noop */ } }
const installed = () => {
  if (isStandalone()) { markInstalled(); return true }
  try { return localStorage.getItem(INSTALLED_KEY) === '1' } catch { return false }
}
const hidden = () => {
  try { return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now() } catch { return false }
}
const hideFor = () => {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 864e5)) } catch { /* noop */ }
}

let deferred = null
const subs = new Set()
const notify = () => subs.forEach((f) => f())
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify() })
  window.addEventListener('appinstalled', () => { deferred = null; markInstalled(); notify() })
}

function useInstall() {
  const [, tick] = useState(0)
  const [done, setDone] = useState(() => installed())
  const [guide, setGuide] = useState(false)
  useEffect(() => {
    const f = () => { tick((n) => n + 1); if (installed()) setDone(true) }
    subs.add(f)
    return () => subs.delete(f)
  }, [])
  const install = async () => {
    const e = deferred
    if (e) {
      deferred = null
      try {
        e.prompt()
        const r = await e.userChoice
        if (r && r.outcome === 'accepted') { markInstalled(); setDone(true) }
        notify()
        return
      } catch { /* 이미 쓴 이벤트 — 아래 안내로 */ }
    }
    setGuide(true)
  }
  return { done, guide, setGuide, install }
}

function Guide({ onClose }) {
  const ios = isIOS()
  return (
    <div className="installguide" onClick={onClose}>
      <div className="box" onClick={(e) => e.stopPropagation()}>
        <div className="h">📲 홈 화면에 추가</div>
        {ios ? (
          <ol>
            <li>화면 <b>아래 가운데</b>(아이패드는 위) <b>공유 버튼</b> <span className="ic">⎋</span> 을 누릅니다</li>
            <li>목록을 조금 내려 <b>「홈 화면에 추가」</b> 를 누릅니다</li>
            <li>오른쪽 위 <b>「추가」</b></li>
          </ol>
        ) : (
          <ol>
            <li>브라우저 오른쪽 위 <b>메뉴(⋮)</b> 를 누릅니다</li>
            <li><b>「홈 화면에 추가」</b> 또는 <b>「앱 설치」</b> 를 누릅니다</li>
            <li><b>「설치」</b> 또는 <b>「추가」</b></li>
          </ol>
        )}
        <div className="note sm">
          홈 화면에 K-건설맵 아이콘이 생기고, 열면 브라우저 테두리 없이 앱처럼 뜹니다. 설치 파일은 없습니다.
          {ios ? ' 아이폰은 Safari 에서만 됩니다 — 카카오톡·네이버 앱 안에서 열었으면 Safari 로 여세요.' : ''}
        </div>
        <button className="btn sm" onClick={onClose}>알겠습니다</button>
      </div>
    </div>
  )
}

/** 위 막대 오른쪽 알약 — 모든 페이지 */
export function InstallPill() {
  const { done, guide, setGuide, install } = useInstall()
  if (done) return null
  return (
    <>
      <button className="installbtn" onClick={install} title="홈 화면에 아이콘을 만들어 앱처럼 씁니다">📲 앱으로</button>
      {guide && <Guide onClose={() => setGuide(false)} />}
    </>
  )
}

/** 메뉴 아래 띠 — 모든 페이지, ✕ 로 닫으면 하루 뒤에 다시 · 설치했으면 안 보임 */
export function InstallBar() {
  const { done, guide, setGuide, install } = useInstall()
  const [closed, setClosed] = useState(() => hidden())
  if (done || closed) return null
  return (
    <>
      <div className="installbar">
        <span className="t">📲 <b>홈 화면에 추가</b>하면 앱처럼 열립니다 — 설치 파일 없이, 아이콘 하나로.</span>
        <button className="go" onClick={install}>추가하기</button>
        <button className="x" aria-label="닫기" onClick={() => { hideFor(); setClosed(true) }}>✕</button>
      </div>
      {guide && <Guide onClose={() => setGuide(false)} />}
    </>
  )
}
