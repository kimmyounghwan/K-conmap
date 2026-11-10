/**
 * 🖼 쪽 그림(SVG) — PDF 와 같은 칸 · 글 · 선 · 원을 화면에 그립니다 + 사진 줄이기 (G638 · 2026-11-10)
 *   시공계획서(SigongPlan.jsx) · 안전관리계획서(SafetyPlan.jsx)가 같이 씁니다 — 한 곳만 고치면 둘 다 고쳐집니다.
 */
import { useMemo } from 'react'
import { 글맞춤 } from './쪽문서.js'

/** 사진 · 그림 파일 → JPEG(긴 변 1800px) */
export async function 그림줄이기(f, 최대 = 1800) {
  const bmp = await createImageBitmap(f)
  const r = Math.min(1, 최대 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  const b = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.86))
  return { 바이트: new Uint8Array(await b.arrayBuffer()), w: c.width, h: c.height }
}

/* ══════════════ 쪽 그림(SVG) — PDF 와 같은 칸 · 글 · 선 ══════════════ */
const 그림주소표 = new WeakMap()
export function 그림주소(g) {
  if (!g) return ''
  let u = 그림주소표.get(g)
  if (!u) { u = URL.createObjectURL(new Blob([g.바이트], { type: 'image/jpeg' })); 그림주소표.set(g, u) }
  return u
}
export function 쪽그림({ 쪽, 폭px, 그림들 }) {
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
