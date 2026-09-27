/**
 * 📄 엑셀 화면 — 엑셀을 «받지 않고» 화면에서 보고 · 칸을 고치고 · 인쇄합니다 (2026-09-27)
 *
 * 소장님: 「모든 도구 및 프로그램은 사이트에서 돌게 해주고, 수정도 사이트에서 가능하게 해줘」
 *         → 결정(11:40): 화면에서 고치고 인쇄 + 엑셀 받기도 둠.
 * 쓰는 곳: 공사서류 원클릭(서류 24가지) · 수량산출서 만들기.
 *
 * ■ 그리는 것: 열 너비 · 행 높이 · 병합 · 테두리 · 글꼴 · 채우기 · 맞춤 · 표시 형식 · 인쇄 영역 · 용지(가로/세로·한 쪽 맞춤)
 * ■ 셈: lib/엑셀수식.js (리브레오피스와 대조 — 원클릭 389식 · 수량산출서 118식 모두 같음)
 * ■ 고친 칸은 노란 점선으로 보입니다(인쇄에는 안 나옴). 고친 칸을 쓰는 다른 칸도 따라 바뀝니다.
 * ■ 인쇄: 고른 장만 A4 한 장씩(틀에 적힌 «한 쪽에 맞춤» 그대로). 사이트의 다른 것은 인쇄에 안 나옵니다.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { 칸이름 } from './lib/엑셀읽기.js'
import { 셈판, 형식글, 형식코드 } from './lib/엑셀수식.js'

const 선모양 = {
  thin: [1, 'solid'], medium: [2, 'solid'], thick: [3, 'solid'], hair: [1, 'solid'], dashed: [1, 'dashed'], dotted: [1, 'dotted'],
  double: [3, 'double'], mediumDashed: [2, 'dashed'], dashDot: [1, 'dashed'], mediumDashDot: [2, 'dashed'], dashDotDot: [1, 'dotted'],
  mediumDashDotDot: [2, 'dotted'], slantDashDot: [2, 'dashed'],
}
const 선 = (b) => (b ? `${선모양[b.모양]?.[0] || 1}px ${선모양[b.모양]?.[1] || 'solid'} ${b.색 || '#000'}` : undefined)
const 열px = (w) => Math.max(0, Math.floor(w * 7 + 0.5))
const 행px = (pt) => Math.round(pt * 4 / 3)

/** 시트 한 장의 틀(영역·열·행·병합) */
function 틀짜기(시) {
  const 영 = 시.인쇄영역 || { r1: 1, c1: 1, r2: Math.max(1, 시.끝행), c2: Math.max(1, 시.끝열) }
  const r2 = Math.min(영.r2, 영.r1 + 3000)
  const 열들 = []
  for (let c = 영.c1; c <= 영.c2; c++) {
    const d = 시.열.find((x) => c >= x.부터 && c <= x.까지)
    if (d && d.숨김) continue
    열들.push({ c, px: 열px(d ? d.너비 : 시.기본너비) })
  }
  const 행들 = []
  for (let r = 영.r1; r <= r2; r++) {
    const h = 시.행.get(r)
    if (h && h.숨김) continue
    행들.push({ r, px: 행px(h && h.높이 != null ? h.높이 : 시.기본높이) })
  }
  const 머리 = new Map(), 덮임 = new Set()
  for (const m of 시.병합) {
    if (m.r2 < 영.r1 || m.r1 > r2 || m.c2 < 영.c1 || m.c1 > 영.c2) continue
    const 보이는열 = 열들.filter((x) => x.c >= m.c1 && x.c <= m.c2).length
    const 보이는행 = 행들.filter((x) => x.r >= m.r1 && x.r <= m.r2).length
    머리.set(m.r1 + ',' + m.c1, { rs: Math.max(1, 보이는행), cs: Math.max(1, 보이는열), m })
    for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) if (r !== m.r1 || c !== m.c1) 덮임.add(r + ',' + c)
  }
  const 너비 = 열들.reduce((a, x) => a + x.px, 0)
  const 높이 = 행들.reduce((a, x) => a + x.px, 0)
  return { 영: { ...영, r2 }, 열들, 행들, 머리, 덮임, 너비, 높이 }
}

function 칸모양(책, s) {
  const xf = 책.스타일.xfs[s] || {}
  const 글 = 책.스타일.글꼴[xf.글꼴] || {}
  const 채 = 책.스타일.채움[xf.채움] || null
  const 테 = 책.스타일.테[xf.테] || {}
  const 맞 = xf.맞춤 || {}
  return { xf, 글, 채, 테, 맞, 형식: 형식코드(책, xf.형식번호 || 0) }
}

/** 시트 한 장 그리기 */
export function 시트판({ 책, 시, 셈, 고침 = {}, 고칠수 = false, 고른칸 = null, on칸 = null, 격자보임 = true, 머리행 = 0 }) {
  const 틀 = useMemo(() => 틀짜기(시), [시])
  const 모양기억 = useMemo(() => new Map(), [책])
  const 모양 = (s) => { if (!모양기억.has(s)) 모양기억.set(s, 칸모양(책, s)); return 모양기억.get(s) }
  const 줄 = (r) => {
    const tds = []
    for (const { c } of 틀.열들) {
      const key = r + ',' + c
      if (틀.덮임.has(key)) continue
      const 머 = 틀.머리.get(key)
      const 이름 = 칸이름(r, c)
      const x = 시.칸.get(이름)
      const 모 = 모양(x ? x.s : 0)
      const v = x || Object.prototype.hasOwnProperty.call(고침, 시.이름 + '!' + 이름) ? 셈.칸값(시.이름, r, c) : null
      const 표 = 형식글(v, 모.형식)
      const 고친 = Object.prototype.hasOwnProperty.call(고침, 시.이름 + '!' + 이름)
      // 병합 칸의 오른쪽·아래 테두리는 병합 끝 칸의 것
      let 오른 = 모.테.right, 아래 = 모.테.bottom
      if (머) {
        const 끝열 = 시.칸.get(칸이름(r, 머.m.c2)), 끝행 = 시.칸.get(칸이름(머.m.r2, c))
        if (끝열) 오른 = 모양(끝열.s).테.right || 오른
        if (끝행) 아래 = 모양(끝행.s).테.bottom || 아래
      }
      const 가로 = 모.맞.horizontal
      const 수냐 = typeof v === 'number'
      const st = {
        fontWeight: 모.글.굵게 ? 700 : undefined,
        fontStyle: 모.글.기울임 ? 'italic' : undefined,
        textDecoration: [모.글.밑줄 ? 'underline' : '', 모.글.취소선 ? 'line-through' : ''].join(' ').trim() || undefined,
        fontSize: (모.글.크기 || 11) + 'pt',
        color: 표.색 || 모.글.색 || undefined,
        background: 모.채 || undefined,
        borderLeft: 선(모.테.left), borderTop: 선(모.테.top), borderRight: 선(오른), borderBottom: 선(아래),
        textAlign: 가로 === 'center' || 가로 === 'centerContinuous' ? 'center' : 가로 === 'right' ? 'right' : 가로 === 'left' ? 'left'
          : 가로 === 'distributed' || 가로 === 'justify' ? 'justify' : (수냐 ? 'right' : typeof v === 'boolean' ? 'center' : 'left'),
        textAlignLast: 가로 === 'distributed' ? 'justify' : undefined,
        verticalAlign: 모.맞.vertical === 'center' ? 'middle' : 모.맞.vertical === 'top' ? 'top' : 'bottom',
        whiteSpace: 모.맞.wrapText === '1' || 모.맞.wrapText === 'true' ? 'pre-wrap' : 'pre',
        paddingLeft: 모.맞.indent ? (+모.맞.indent * 9 + 2) + 'px' : undefined,
      }
      const 누름 = 고칠수 && on칸 ? () => on칸({ 시트: 시.이름, r, c, 이름, 값: v, 글: 표.글, 식: x && x.f }) : undefined
      const 고름 = 고른칸 && 고른칸.시트 === 시.이름 && 고른칸.r === r && 고른칸.c === c
      tds.push(
        <td key={c} rowSpan={머 && 머.rs > 1 ? 머.rs : undefined} colSpan={머 && 머.cs > 1 ? 머.cs : undefined}
          style={st} className={(고친 ? 'xv-고친 ' : '') + (고름 ? 'xv-고른 ' : '') + (누름 ? 'xv-누름' : '')}
          onClick={누름} title={누름 ? 이름 + (x && x.f ? ' · 수식 칸' : '') : undefined}>{표.글}</td>,
      )
    }
    return tds
  }
  const 머리줄 = 머리행 ? 틀.행들.filter((h) => h.r <= 머리행) : []
  const 몸줄 = 머리행 ? 틀.행들.filter((h) => h.r > 머리행) : 틀.행들
  return (
    <table className={'xv-표' + (격자보임 && 시.격자 ? ' 격자' : '')} style={{ width: 틀.너비 }}>
      <colgroup>{틀.열들.map((x) => <col key={x.c} style={{ width: x.px }} />)}</colgroup>
      {머리줄.length > 0 && <thead>{머리줄.map((h) => <tr key={h.r} style={{ height: h.px }}>{줄(h.r)}</tr>)}</thead>}
      <tbody>{몸줄.map((h) => <tr key={h.r} style={{ height: h.px }}>{줄(h.r)}</tr>)}</tbody>
    </table>
  )
}

/* 인쇄 쪽 크기(css px) — A4, 여백 12mm·10mm */
const mm = 96 / 25.4
const 쪽 = { 세로: { w: (210 - 20) * mm, h: (297 - 24) * mm }, 가로: { w: (297 - 24) * mm, h: (210 - 20) * mm } }
/** 용지 방향 — 틀에 정해져 있으면 그대로, 없으면(우리가 만든 산출서 등) 넓은 표는 가로 */
function 가로냐(시, 틀) { return 시.용지.정해짐 ? 시.용지.가로 : 틀.너비 > 쪽.세로.w * 1.1 }
function 인쇄배율(시, 틀) {
  const p = 가로냐(시, 틀) ? 쪽.가로 : 쪽.세로
  const 머리h = 시.머리 ? 16 : 0
  if (시.용지.맞춤) {
    const zw = 시.용지.너비쪽 ? p.w / 틀.너비 : 1
    const zh = 시.용지.높이쪽 ? (p.h - 머리h) / 틀.높이 : 1
    return Math.min(1, zw, zh)
  }
  return Math.min((시.용지.배율 || 100) / 100, p.w / 틀.너비)
}

/**
 * @param 책        엑셀읽기() 결과
 * @param 시트들    보일 시트 이름들(차례대로)
 * @param 고침 · set고침  { '시트!B5': 값 } — 부모가 쥡니다(남기기는 부모 몫)
 * @param 머리행들  { 시트이름: 줄 } — 인쇄할 때 쪽마다 되풀이할 머리 줄(없으면 틀의 인쇄 제목)
 * @param 이름      인쇄할 때 브라우저 제목(= PDF 파일 이름)
 */
export default function 엑셀화면({ 책, 시트들, 고침, set고침, 머리행들 = {}, 이름 = 'K-건설맵', 고칠수 = true, 이름표 = null }) {
  const 셈 = useMemo(() => 셈판(책, 고침 || {}), [책, 고침])
  const 보일 = useMemo(() => 책.시트들.filter((s) => 시트들.includes(s.이름)).sort((a, b) => 시트들.indexOf(a.이름) - 시트들.indexOf(b.이름)), [책, 시트들])
  const [지금, set지금] = useState(0)
  const 시 = 보일[Math.min(지금, 보일.length - 1)]
  const [고른, set고른] = useState(null)
  const [글, set글] = useState('')
  const [크게, set크게] = useState(false)
  const 틀 = useMemo(() => (시 ? 틀짜기(시) : null), [시])
  const 판 = useRef(null)
  const [폭, set폭] = useState(0)
  const [인쇄할, set인쇄할] = useState(null)

  useLayoutEffect(() => {
    const el = 판.current
    if (!el) return undefined
    const 재기 = () => set폭(el.clientWidth)
    재기()
    let ro = null
    try { ro = new ResizeObserver(재기); ro.observe(el) } catch (e) { window.addEventListener('resize', 재기) }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', 재기) }
  }, [])
  useEffect(() => { set고른(null) }, [지금])

  /* 인쇄 — 고른 장만 몸 바로 밑에 따로 그려 인쇄하고 치웁니다 */
  useEffect(() => {
    if (!인쇄할) return undefined
    const 옛제목 = document.title
    document.title = 이름
    document.body.classList.add('xv-인쇄중'); document.documentElement.classList.add('xv-인쇄중')
    const 끝 = () => { document.body.classList.remove('xv-인쇄중'); document.documentElement.classList.remove('xv-인쇄중'); document.title = 옛제목; set인쇄할(null) }
    const t = setTimeout(() => {
      window.addEventListener('afterprint', 끝, { once: true })
      try { window.print() } catch (e) { 끝() }
      // 사파리 등 afterprint 가 안 오는 곳 대비
      setTimeout(() => { if (document.body.classList.contains('xv-인쇄중')) 끝() }, 60000)
    }, 120)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', 끝) }
  }, [인쇄할])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!시) return <div className="note">보일 장이 없습니다.</div>
  const 배율 = 크게 || !틀 || !폭 ? 1 : Math.min(1, (폭 - 4) / (틀.너비 + 24))   /* 종이 여백 12px×2 까지 */
  const 고친수 = Object.keys(고침 || {}).length

  const 칸누름 = (x) => {
    set고른(x)
    const k = x.시트 + '!' + x.이름
    set글(Object.prototype.hasOwnProperty.call(고침 || {}, k) ? String(고침[k] ?? '') : x.글)
  }
  const 넣기 = () => {
    if (!고른) return
    const k = 고른.시트 + '!' + 고른.이름
    const t = 글
    const 숫 = t.trim().replace(/[,\s원₩]/g, '')
    const 원래수 = typeof 셈판(책, {}).칸값(고른.시트, 고른.r, 고른.c) === 'number'
    const v = t.trim() === '' ? '' : (원래수 && /^-?\d+(\.\d+)?$/.test(숫) ? Number(숫) : t)
    set고침({ ...(고침 || {}), [k]: v })
    set고른(null)
  }
  const 되돌리기 = () => {
    if (!고른) return
    const k = 고른.시트 + '!' + 고른.이름
    const n = { ...(고침 || {}) }
    delete n[k]
    set고침(n); set고른(null)
  }
  const 모두되돌리기 = () => { set고침({}); set고른(null) }

  return (
    <div className="xv">
      {보일.length > 1 && (
        <div className="xv-장들 no-print" role="tablist" aria-label="장 고르기">
          {보일.map((s, i) => (
            <button key={s.이름} type="button" role="tab" aria-selected={i === 지금} className={'chip' + (i === 지금 ? ' on' : '')} onClick={() => set지금(i)}>
              {이름표 ? 이름표(s.이름) : s.이름}
            </button>
          ))}
        </div>
      )}
      <div className="xv-띠 no-print">
        <button type="button" className="btn sm" onClick={() => set인쇄할([시.이름])}>🖨 이 장 인쇄</button>
        {보일.length > 1 && <button type="button" className="btn ghost sm" onClick={() => set인쇄할(보일.map((s) => s.이름))}>🖨 {보일.length}장 모두 인쇄</button>}
        <button type="button" className="btn ghost sm" onClick={() => set크게((v) => !v)}>{크게 ? '🔍 화면에 맞추기' : '🔍 크게 보기'}</button>
        {고친수 > 0 && <button type="button" className="btn ghost sm" onClick={모두되돌리기}>↩ 고친 칸 {고친수}개 되돌리기</button>}
      </div>
      {고칠수 && <div className="xv-알림 no-print">✏️ 칸을 누르면 고칠 수 있습니다. 고친 칸은 <span className="xv-고친견본">노란 점선</span>으로 보이고, 인쇄·엑셀에는 고친 값이 들어갑니다.</div>}
      <div className="xv-판 no-print" ref={판} style={{ overflowX: 크게 ? 'auto' : 'hidden' }}>
        <div className="xv-종이" style={{ zoom: 배율, width: 틀 ? 틀.너비 + 24 : undefined }}>
          <시트판 책={책} 시={시} 셈={셈} 고침={고침 || {}} 고칠수={고칠수} 고른칸={고른} on칸={칸누름} 머리행={머리행들[시.이름] || 0} />
        </div>
      </div>

      {고른 && (
        <div className="xv-고침판 no-print" role="dialog" aria-label="칸 고치기">
          <div className="xv-고침머리">
            <b>{고른.이름}</b> 칸 고치기 {고른.식 && <span className="muted">· 수식 칸 — 적으면 적은 값이 들어갑니다</span>}
          </div>
          <textarea value={글} onChange={(e) => set글(e.target.value)} rows={2} autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); 넣기() } if (e.key === 'Escape') set고른(null) }} />
          <div className="xv-고침단추">
            <button type="button" className="btn sm" onClick={넣기}>바꾸기</button>
            {Object.prototype.hasOwnProperty.call(고침 || {}, 고른.시트 + '!' + 고른.이름) && <button type="button" className="btn ghost sm" onClick={되돌리기}>원래대로</button>}
            <button type="button" className="btn ghost sm" onClick={() => set고른(null)}>닫기</button>
          </div>
        </div>
      )}

      {인쇄할 && createPortal(
        <div id="xv-인쇄">
          {보일.filter((s) => 인쇄할.includes(s.이름)).map((s) => {
            const t = 틀짜기(s)
            const z = 인쇄배율(s, t)
            return (
              <section key={s.이름} className={'xv-쪽' + (가로냐(s, t) ? ' 가로' : '')}>
                <div style={{ zoom: z, width: t.너비, margin: s.용지.가운데 ? '0 auto' : 0 }}>
                  {s.머리 && <div className="xv-머리">{s.머리}</div>}
                  <시트판 책={책} 시={s} 셈={셈} 고침={고침 || {}} 격자보임={false} 머리행={머리행들[s.이름] || 0} />
                </div>
              </section>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}
