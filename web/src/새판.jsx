/* 🔄 새 판 알아채기 — 새로 올린 화면을 폰이 스스로 받게 (2026-09-30)
   소장님: 「폰에는 유형도 없고, 기관 사정률도 없고 또」
   → 사이트에는 다 올라가 있었습니다(G78 · G80). 폰이 «예전에 열어 둔 화면» 을 그대로 들고 있었습니다.
     홈 화면에 추가한 앱은 끌어내려 새로고침도 안 되고, 다시 켜도 전에 보던 화면이 그대로 뜹니다.

   ■ 어떻게
     · 빌드할 때 «판 번호»(web/src 글에서 만든 짧은 도장 · vite.config.js 판번호)를 화면 안(__CODE__)과
       /version.json(캐시 안 함 · firebase.json) 두 곳에 적습니다. 자료만 바뀐 회차에는 번호가 안 바뀝니다.
     · 앱을 다시 켜거나 다른 앱에 갔다가 3분 넘어 돌아오면 /version.json 을 한 번 봅니다(몇십 바이트).
       번호가 다르면 —
         ① 적는 칸이 없는 화면(1순위 · 공고 · 나라장터 밖 · 공고 한 건 · 분석 · 기관 · 업체 · 성적표 · 면허 경쟁도)
            → 바로 새로 엽니다. 고른 지역 · 면허 · 거르개는 브라우저가 기억해 그대로입니다.
         ② 그 밖(바로투찰 · 도구 · 서식 · 적산 · 사랑방 …) — 적던 것이 날아가지 않게 위에 한 줄만:
            «🔄 새로 고친 화면이 있습니다 · 새로 보기». 그 뒤 ①의 화면으로 옮겨 가면 그때 새로 엽니다.
     · 보고 있는 중에는 절대 저절로 새로 열지 않습니다(30분마다 보긴 하지만 한 줄 알림만).
     · 한 번 새로 열었는데도 번호가 그대로면(중간 캐시) 다시 열지 않고 한 줄 알림만 — 빙빙 돌지 않게.
   ⚠️ 새로 열 때 Refresh.jsx 와 같은 도장(RELOAD_KEY)을 찍어 자료 캐시도 한 번 비켜 갑니다. */
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RELOAD_KEY } from './lib/data.js'

const 지금판 = typeof __CODE__ === 'string' ? __CODE__ : ''
const 시도열쇠 = 'kcm_newver_tried'
/* 적는 칸이 없는 화면 — 새로 열어도 잃는 것이 없습니다 */
export const 안전한곳 = /^\/(first|live|ext|lic|analysis|daily|notice\/|agency\/|corp\/)/

export function 새로열기() {
  try { sessionStorage.setItem(RELOAD_KEY, Date.now().toString(36)) } catch { /* 사생활 모드 */ }
  window.location.reload()
}

export default function 새판() {
  const { pathname } = useLocation()
  const [새것, set새것] = useState('')
  const 숨은때 = useRef(0)
  const 본때 = useRef(0)
  const 앞주소 = useRef(pathname)

  const 바로열기 = (판) => {
    try {
      if (sessionStorage.getItem(시도열쇠) === 판) return false     // 이 판으로 이미 한 번 열었음 — 또 돌지 않게
      sessionStorage.setItem(시도열쇠, 판)
    } catch { return false }
    새로열기()
    return true
  }

  const 알아보기 = async () => {
    if (!지금판 || Date.now() - 본때.current < 60000) return ''
    본때.current = Date.now()
    try {
      const r = await fetch('/version.json?t=' + Date.now().toString(36), { cache: 'no-store' })
      if (!r.ok) return ''
      const v = await r.json()
      const 판 = v && typeof v.code === 'string' && v.code !== 지금판 ? v.code : ''
      if (판) set새것(판)
      return 판
    } catch { return '' }
  }

  useEffect(() => {
    if (!지금판) return undefined
    const 볼때 = async () => {
      if (document.visibilityState === 'hidden') { 숨은때.current = Date.now(); return }
      const 오래 = 숨은때.current && Date.now() - 숨은때.current > 3 * 60000
      숨은때.current = 0
      if (!오래) return
      const 판 = await 알아보기()
      if (판 && 안전한곳.test(window.location.pathname)) 바로열기(판)
    }
    document.addEventListener('visibilitychange', 볼때)
    window.addEventListener('pageshow', 볼때)                          // 뒤로가기 캐시에서 되살아날 때
    const t0 = setTimeout(알아보기, 20000)                              // 처음 열고 한 번(옛 HTML 을 받았을 수 있음)
    const t = setInterval(() => { if (document.visibilityState === 'visible') 알아보기() }, 30 * 60000)
    return () => {
      document.removeEventListener('visibilitychange', 볼때)
      window.removeEventListener('pageshow', 볼때)
      clearTimeout(t0); clearInterval(t)
    }
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 새 판이 있는 채로 «적는 칸 없는 화면» 으로 옮겨 가면 — 그 자리에서 새로 엽니다(보던 화면이 바뀌는 게 아니라 막 옮겨 온 화면) */
  useEffect(() => {
    const 옮김 = 앞주소.current !== pathname
    앞주소.current = pathname
    if (옮김 && 새것 && 안전한곳.test(pathname)) 바로열기(새것)
  }, [pathname])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!새것) return null
  return (
    <div className="newver" role="status">
      <span>🔄 새로 고친 화면이 있습니다</span>
      <button type="button" onClick={새로열기}>새로 보기</button>
    </div>
  )
}
