/* 🖨 공정표 인쇄 — 몸에 표시(gp-인쇄중)를 달고 window.print() · 끝나면 뗌 (2026-09-28, 공정칸.jsx 에서 옮김 — 막대형·금액형이 같이 씀) */
import { useEffect, useState } from 'react'

export function use인쇄(제목) {
  const [인쇄중, set인쇄중] = useState(false)
  useEffect(() => {
    if (!인쇄중) return undefined
    const 옛 = document.title
    document.title = 제목 || 옛
    document.body.classList.add('gp-인쇄중'); document.documentElement.classList.add('gp-인쇄중')
    const 끝 = () => { document.body.classList.remove('gp-인쇄중'); document.documentElement.classList.remove('gp-인쇄중'); document.title = 옛; set인쇄중(false) }
    const t = setTimeout(() => {
      window.addEventListener('afterprint', 끝, { once: true })
      try { window.print() } catch (e) { 끝() }
      setTimeout(() => { if (document.body.classList.contains('gp-인쇄중')) 끝() }, 60000)
    }, 150)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', 끝) }
  }, [인쇄중])   // eslint-disable-line react-hooks/exhaustive-deps
  return [인쇄중, () => set인쇄중(true)]
}
