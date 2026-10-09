/* 🆕 다시 오신 분께 — «지난번 오신 뒤 새 공고 N건 · 1순위 N건 · 내 지역 N건» 한 줄 띠 (G222 · 2026-10-09)
 *   소장님: 「방문했던 이용자 모두에게 알림 가게 해야 해…」 → 고르심 «다시 오면 «지난 방문 뒤 새 공고»»
 *           「너무 알림이 많이 가면 짜증이 날 수도 있어. 알지??」
 *   ■ 폰 알림을 허용하지 않은 분도 사이트에 다시 들어오면 보입니다(폰 알림 아님 · 사이트 안에서만).
 *   ■ 지난번 방문 뒤 3시간이 지났을 때만 · 이 창(탭)에서 한 번만 · ✕ 로 닫힘 · 새 것이 0이면 안 뜸.
 *   ■ 숫자 = /data/newcount.json(collect.py 가 회차마다 · 시간마다 공고 · 1순위 수 · 몇 KB) — 서버에 아무것도 안 보냄.
 *   ■ 📊 숨은 누적: |다시오심|보임 · |다시오심|누름
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJSON } from './lib/data.js'
import { loadRegion } from './lib/lic.js'
import { num } from './lib/fmt.js'
import { 세기 } from './lib/받은수.jsx'
import { 셈 } from './lib/다시오심.js'

/* ⚠️ 사이트가 뜨기 «전» 에 읽어 둡니다 — 방문 인사(인사.jsx)가 뜬 뒤 kcm_visit.last 를 «지금» 으로 고칩니다 */
const 지난방문 = (() => {
  try { const v = JSON.parse(localStorage.getItem('kcm_visit') || 'null'); return v && Number(v.last) > 0 ? Number(v.last) : 0 } catch (e) { return 0 }
})()
const 세시간 = 3 * 3600e3
const 탭열쇠 = 'kcm_since_shown'

const 언제 = (ms) => {
  const d = new Date(ms), 오늘 = new Date()
  const 하루 = Math.round((new Date(오늘.toDateString()) - new Date(d.toDateString())) / 86400e3)
  const h = d.getHours(), 때 = h < 12 ? '오전' : h < 18 ? '오후' : '저녁'
  return (하루 === 0 ? '오늘 ' : 하루 === 1 ? '어제 ' : `${d.getMonth() + 1}/${d.getDate()} `) + 때
}

export default function 다시오심띠() {
  const nav = useNavigate()
  const [보일, set보일] = useState(null)
  useEffect(() => {
    if (!지난방문 || Date.now() - 지난방문 < 세시간) return undefined
    try { if (sessionStorage.getItem(탭열쇠)) return undefined } catch (e) { return undefined }
    let 살아 = true
    getJSON('/data/newcount.json').then((nc) => {
      if (!살아 || !nc) return
      const 지역 = loadRegion()
      const r = 셈(nc, 지난방문, 지역)
      if (!r.공고 && !r.일순위) return
      try { sessionStorage.setItem(탭열쇠, '1') } catch (e) { /* 없음 */ }
      set보일({ ...r, 지역 })
      세기('|다시오심|보임')
    }).catch(() => {})
    return () => { 살아 = false }
  }, [])
  if (!보일) return null
  const 조각 = [보일.공고 ? `새 공고 ${num(보일.공고)}건` : '', 보일.일순위 ? `1순위 ${num(보일.일순위)}건` : '',
    보일.내 ? `내 지역(${보일.지역}) ${num(보일.내)}건` : ''].filter(Boolean).join(' · ')
  return (
    <div className="noti-band since" role="status">
      <span className="noti-dot" />
      <button className="noti-go" onClick={() => { 세기('|다시오심|누름'); set보일(null); nav('/live') }}>
        <b>🆕 지난번({언제(지난방문)}) 오신 뒤 {조각}</b>
        <span className="noti-see">공고 보기 ▸</span>
      </button>
      <button className="noti-x" onClick={() => set보일(null)} aria-label="닫기">✕</button>
    </div>
  )
}
