/* 📍 내 조건 한 줄 — 1순위 · 공고 맨 위 (2026-10-01, G97)
 *   소장님: 「내 지역·면허를 한 번 정하면 1순위·공고가 그 조건으로 열리게 하고 … 자동으로 할 수 있어?」
 *   ■ 지역 알약 · «내 면허 맞춤» 을 누르면 그것이 곧 «내 조건» 입니다(브라우저가 기억 · 두 화면이 같이 씀 · lib/lic.js).
 *   ■ 이 줄은 내 조건이 있을 때만 보입니다: «📍 내 조건 — 전남 · 면허 2개  [전국 보기]  [🔔 새 공고 알림]»
 *     «전국 보기» 는 이 화면에서만 잠깐 넓혀 봅니다(내 조건은 그대로). 다시 «내 조건으로» 를 누르면 돌아옵니다.
 *   ■ 🔔 새 공고 알림 — 하루 두 번(8시 · 13시) 내 조건에 맞는 새 공고를 묶어 한 번 알립니다(lib/관심알림.js · 함수 freshNotify).
 */
import { useEffect, useRef, useState } from 'react'
import { loadRegion, loadMine, licShort } from './lib/lic.js'
import { 조건알림, 조건알림켜짐 } from './lib/관심알림.js'

export default function 내조건줄({ region, mine, lics, licNone, licOptions, 넓혀보기, 내조건으로 }) {
  const 저장지역 = loadRegion()
  const 저장맞춤 = loadMine()
  const 있음 = 저장지역 !== '전국' || (저장맞춤 && lics.length > 0)
  const [켜짐, set켜짐] = useState(조건알림켜짐)
  const [말, set말] = useState('')
  const [바쁨, set바쁨] = useState(false)

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

  if (!있음) return null
  const 이름 = (c) => { const o = (licOptions || []).find((x) => String(x[0]) === String(c)); return o ? licShort(o[1]) : c }
  const 면허글 = 저장맞춤 && lics.length ? (lics.length <= 2 ? lics.map(이름).join(' · ') : `${이름(lics[0])} 외 ${lics.length - 1}개`) : ''
  const 내조건중 = region === 저장지역 && (!!mine === !!저장맞춤)

  const 알림누름 = async () => {
    if (바쁨) return
    set바쁨(true)
    try {
      const m = await 조건알림(켜짐 ? null : 조건, !켜짐)
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
        <button className={'chip' + (켜짐 ? ' on' : '')} onClick={알림누름} disabled={바쁨}
          title="하루 두 번(아침 8시 · 낮 1시) 내 조건에 맞는 새 공고를 묶어 알려 드립니다">
          {켜짐 ? '🔔 새 공고 알림 받는 중' : '🔔 새 공고 알림 받기'}
        </button>
      </span>
      {말 && <span className="mycond-m">{말}</span>}
    </div>
  )
}
