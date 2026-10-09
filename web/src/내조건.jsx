/* 📍 내 조건 한 줄 — 1순위 · 공고 맨 위 (2026-10-01, G97)
 *   소장님: 「내 지역·면허를 한 번 정하면 1순위·공고가 그 조건으로 열리게 하고 … 자동으로 할 수 있어?」
 *   ■ 지역 알약 · «내 면허 맞춤» 을 누르면 그것이 곧 «내 조건» 입니다(브라우저가 기억 · 두 화면이 같이 씀 · lib/lic.js).
 *   ■ 이 줄은 내 조건이 있을 때만 보입니다: «📍 내 조건 — 전남 · 면허 2개  [전국 보기]  [🔔 새 공고 알림]»
 *     «전국 보기» 는 이 화면에서만 잠깐 넓혀 봅니다(내 조건은 그대로). 다시 «내 조건으로» 를 누르면 돌아옵니다.
 *   ■ 🔔 새 공고 알림 — 하루 두 번(8시 · 13시) 내 조건에 맞는 새 공고를 묶어 한 번 알립니다(lib/관심알림.js · 함수 freshNotify).
 *   ■ ✏️ 바꾸기 · ✕ 지우기 (G159 · 2026-10-06 소장님 「내 조건을 없게 하거나 변경 할 수도 있어야 하잖아」)
 *     바꾸기 = 아래 지역 알약 줄로 내려가 반짝(거기서 누르면 바로 바뀜 · 따로 저장 없음).
 *     지우기 = 지역 «전국» · 면허 맞춤 끔(브라우저 기억도) → «지웠습니다 · 되돌리기» 한 줄. 알림을 켜 두었으면 알림도 꺼짐(조건이 없으니).
 *     📊 |내조건|바꾸기 · |내조건|지움 · |내조건|되돌림
 *   ■ G222 (2026-10-09) 이 «🔔 새 공고 알림 받기» 신청은 그대로(하루 두 번 · 8시 · 13시) — 소장님 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번 알림 가게 하자.」
 *     신청을 «끄면» 신청 안 한 분께 가는 하루 한 번(오전 10시 · lib/저절로알림.js)도 안 가게 끔 표시를 같이 남깁니다(끈 분께 알림이 새로 생기지 않게).
 *     📊 숨은 누적 |알림|신청 · |알림|신청끔 (lib/관심알림.js)
 */
import { useEffect, useRef, useState } from 'react'
import { loadRegion, loadMine, licShort } from './lib/lic.js'
import { 조건알림, 조건알림켜짐 } from './lib/관심알림.js'
import { 알림끄기 } from './lib/저절로알림.js'
import { 세기 } from './lib/받은수.jsx'

export default function 내조건줄({ region, mine, lics, licNone, licOptions, 넓혀보기, 내조건으로, 지우기, 되살리기 }) {
  const 저장지역 = loadRegion()
  const 저장맞춤 = loadMine()
  const 있음 = 저장지역 !== '전국' || (저장맞춤 && lics.length > 0)
  const [켜짐, set켜짐] = useState(조건알림켜짐)
  const [말, set말] = useState('')
  const [바쁨, set바쁨] = useState(false)
  const [지운것, set지운것] = useState(null)   // { 지역, 맞춤, 알림 } — 되돌리기용

  /* G222 — 알림 안내 쪽지(알림안내.jsx)에서 신청하면 이 단추도 «받는 중» 으로 */
  useEffect(() => {
    const 켬 = () => set켜짐(true)
    window.addEventListener('kcm-cond-on', 켬)
    return () => window.removeEventListener('kcm-cond-on', 켬)
  }, [])

  /* 알림을 켠 채로 조건을 바꾸면 서버의 조건도 따라 바꿉니다(1.5초 모아서) */
  const 첫 = useRef(true)
  const 조건 = { rg: 저장지역, lic: 저장맞춤 ? lics : [], none: !!licNone }
  const 조건글 = JSON.stringify(조건)
  useEffect(() => {
    if (첫.current) { 첫.current = false; return undefined }
    if (!켜짐) return undefined
    const t = setTimeout(() => { 조건알림(있음 ? 조건 : null).catch(() => {}) ; if (!있음) set켜짐(false) }, 1500)
    return () => clearTimeout(t)
  }, [조건글])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!있음) {
    if (!지운것) return null
    return (
      <div className="mycond mycond-gone" role="status">
        <span className="mycond-t">📍 <b>내 조건을 지웠습니다</b> — 이제 전국 · 모든 면허로 열립니다{지운것.알림 ? ' (새 공고 알림도 껐습니다)' : ''}.</span>
        <span className="mycond-b">
          <button className="chip" onClick={() => { 되살리기 && 되살리기(지운것); set지운것(null); 세기('|내조건|되돌림') }}>↩ 되돌리기</button>
        </span>
        <span className="mycond-m">아래 지역 알약이나 «✨ 내 면허 맞춤» 을 누르면 다시 내 조건이 됩니다.</span>
      </div>
    )
  }
  const 이름 = (c) => { const o = (licOptions || []).find((x) => String(x[0]) === String(c)); return o ? licShort(o[1]) : c }
  const 면허글 = 저장맞춤 && lics.length ? (lics.length <= 2 ? lics.map(이름).join(' · ') : `${이름(lics[0])} 외 ${lics.length - 1}개`) : ''
  const 내조건중 = region === 저장지역 && (!!mine === !!저장맞춤)

  const 바꾸기 = () => {
    세기('|내조건|바꾸기')
    const el = document.querySelector('[data-cond]')
    set말('아래 지역 알약 · «✨ 내 면허 맞춤» · «🪪 면허 다시 고르기» 를 누르면 바로 바뀝니다(따로 저장할 것 없음).')
    if (!el) return
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch (e) { el.scrollIntoView() }
    el.classList.remove('cond-flash'); void el.offsetWidth; el.classList.add('cond-flash')
    setTimeout(() => el.classList.remove('cond-flash'), 1800)
  }
  const 지움 = () => {
    if (!지우기) return
    set지운것({ 지역: 저장지역, 맞춤: !!저장맞춤, 알림: 켜짐 }); set말('')
    지우기(); 세기('|내조건|지움')
  }

  const 알림누름 = async () => {
    if (바쁨) return
    set바쁨(true)
    try {
      const m = await 조건알림(켜짐 ? null : 조건, !켜짐)
      알림끄기(켜짐, true).catch(() => {})       /* G222 — 신청을 끄면 하루 한 번(오전 10시)도 끔 · 다시 켜면 그 끔도 풂(조용히 · 숨은 누적 안 셈) */
      set켜짐(!켜짐); set말(m)
    } finally { set바쁨(false) }
  }

  return (
    <div className="mycond" role="group" aria-label="내 조건">
      <span className="mycond-t">📍 <b>내 조건</b> — {[저장지역 !== '전국' ? 저장지역 : '전국', 면허글].filter(Boolean).join(' · ')}</span>
      <span className="mycond-b">
        {내조건중
          ? <button className="chip" onClick={넓혀보기}>전국 · 모든 면허 보기</button>
          : <button className="chip on" onClick={내조건으로}>내 조건으로 보기</button>}
        <button className={'chip' + (켜짐 ? ' on' : '')} onClick={알림누름} disabled={바쁨} data-no-ask="1"
          title="평일 하루 두 번(아침 8시 · 낮 1시) 내 조건에 맞는 새 공고를 묶어 알려 드립니다">
          {켜짐 ? '🔔 새 공고 알림 받는 중' : '🔔 새 공고 알림 받기'}
        </button>
        <button className="chip" onClick={바꾸기} title="아래 지역 · 면허를 눌러 바꿉니다">✏️ 바꾸기</button>
        {지우기 && <button className="chip" onClick={지움} title="지역 · 면허 조건을 없앱니다(되돌릴 수 있음)">✕ 지우기</button>}
      </span>
      {말 && <span className="mycond-m">{말}</span>}
    </div>
  )
}
