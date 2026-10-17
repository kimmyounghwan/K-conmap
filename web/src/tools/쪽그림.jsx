/**
 * 📄 쪽 그림(SVG) — lib/쪽흐름.js 가 만든 A4 쪽을 화면에 그대로 (PDF 와 같은 칸 · 글 · 선)
 *   SigongPlan.jsx 의 쪽그림과 같은 그림 — 새 서류 도구(중처법 한 벌 · 2026-10-17)가 같이 씁니다.
 *   (SigongPlan.jsx 는 자기 것을 그대로 둡니다 — 올라가 있는 화면을 건드리지 않으려고)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 글맞춤 } from '../lib/쪽문서.js'

const 그림주소표 = new WeakMap()
function 그림주소(g) {
  if (!g) return ''
  let u = 그림주소표.get(g)
  if (!u) { u = URL.createObjectURL(new Blob([g.바이트], { type: 'image/jpeg' })); 그림주소표.set(g, u) }
  return u
}

export function 쪽그림({ 쪽, 폭px, 그림들 = new Map() }) {
  const 맞춤들 = useMemo(() => 쪽.칸들.map((k) => (k.글 ? 글맞춤(k.글, k.w, k.h, k.크기 || 9, !!k.굵게) : null)), [쪽])
  const 높px = (쪽.높이 / 쪽.폭) * 폭px
  return (
    <svg className="sg-page" width={폭px} height={높px} viewBox={`0 0 ${쪽.폭} ${쪽.높이}`} role="img" aria-label="미리보기 쪽">
      <rect x="0" y="0" width={쪽.폭} height={쪽.높이} fill="#fff" />
      {쪽.칸들.map((k, i) => k.바탕 ? <rect key={'b' + i} x={k.x} y={k.y} width={k.w} height={k.h} fill={k.바탕} /> : null)}
      {쪽.칸들.map((k, i) => {
        if (!k.그림) return null
        const g = 그림들.get(k.그림)
        if (!g) return null
        return <image key={'g' + i} href={그림주소(g)} x={k.x + 1} y={k.y + 1} width={k.w - 2} height={k.h - 2} preserveAspectRatio="xMidYMid meet" />
      })}
      {쪽.칸들.map((k, i) => {
        const m = 맞춤들[i]
        if (!m || !m.줄들.length) return null
        const 크 = m.크기 * 0.3528, 줄높 = 크 * 1.22
        const 위 = k.y + (k.h - 줄높 * m.줄들.length) / 2
        const x = k.정렬 === '왼' ? k.x + 0.8 : k.정렬 === '오' ? k.x + k.w - 0.8 : k.x + k.w / 2
        const 앵커 = k.정렬 === '왼' ? 'start' : k.정렬 === '오' ? 'end' : 'middle'
        return (
          <text key={'t' + i} fontSize={크} fontWeight={k.굵게 ? 700 : 400} fill={k.색 || '#111'} textAnchor={앵커}>
            {m.줄들.map((줄, j) => <tspan key={j} x={x} y={위 + (j + 0.5) * 줄높 + 크 * 0.34}>{줄}</tspan>)}
          </text>
        )
      })}
      {쪽.칸들.map((k, i) => k.테 ? <rect key={'r' + i} x={k.x} y={k.y} width={k.w} height={k.h} fill="none" stroke={k.선색 || '#333'} strokeWidth={k.굵은테 ? 0.38 : 0.18} /> : null)}
      {(쪽.선들 || []).map((s, i) => (
        <polyline key={'s' + i} points={(s.점들 || []).map((p) => p.join(',')).join(' ')} fill="none" stroke={s.색 || '#333'} strokeWidth={(s.굵기 || 0.6) * 0.3528} strokeDasharray={s.점선 ? '0.8 0.6' : undefined} />
      ))}
      {(쪽.원들 || []).map((o, i) => <circle key={'c' + i} cx={o.x} cy={o.y} r={o.r} fill={o.바탕 || 'none'} stroke={o.색 || '#333'} strokeWidth={(o.굵기 || 0.6) * 0.3528} />)}
    </svg>
  )
}

/** 쪽 넘기기 + 그림 — 끝 쪽까지 넘기면 한 번 on끝() */
export default function 쪽넘기기({ 쪽들, 그림들, on끝, 쪽번: 밖쪽번, set쪽번: 밖set }) {
  const [안쪽번, 안set] = useState(0)
  const 쪽번 = 밖쪽번 ?? 안쪽번
  const set쪽번 = 밖set || 안set
  const 틀 = useRef(null)
  const [폭, set폭] = useState(640)
  const 끝봄 = useRef(false)
  useEffect(() => {
    const el = 틀.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => set폭(Math.max(260, Math.min(900, el.clientWidth - 20))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => { if (쪽번 >= 쪽들.length) set쪽번(Math.max(0, 쪽들.length - 1)) }, [쪽들.length])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (쪽들.length > 1 && 쪽번 === 쪽들.length - 1 && !끝봄.current) { 끝봄.current = true; on끝 && on끝() } }, [쪽번, 쪽들.length])   // eslint-disable-line react-hooks/exhaustive-deps
  const 쪽 = 쪽들[쪽번]
  if (!쪽) return null
  return (
    <>
      <div className="sg-pager">
        <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={쪽번 === 0} onClick={() => set쪽번(쪽번 - 1)}>◀</button>
        <select value={쪽번} onChange={(e) => set쪽번(+e.target.value)}>
          {쪽들.map((p, i) => <option key={i} value={i}>{i + 1} / {쪽들.length}쪽{p.번호 ? ` (- ${p.번호} -)` : ''}{p.제목 ? ' · ' + p.제목 : ''}</option>)}
        </select>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={쪽번 >= 쪽들.length - 1} onClick={() => set쪽번(쪽번 + 1)}>▶</button>
      </div>
      <div ref={틀} className="sg-view">
        <쪽그림 쪽={쪽} 폭px={쪽.폭 > 쪽.높이 ? 폭 : Math.min(폭, 640)} 그림들={그림들 || new Map()} />
      </div>
    </>
  )
}
