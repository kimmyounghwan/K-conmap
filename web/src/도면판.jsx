/**
 * 📐 도면판 — 도면(DXF·DWG)을 열어 그리고, 누른 자리의 도형을 알려 주는 판 (2026-09-27)
 *
 * 골조 수량산출(/jeoksan/golgo)에 있던 것을 한 곳으로 옮겼습니다. 같이 쓰는 곳:
 *   /jeoksan/golgo (골조) · /jeoksan/run (치수표 찍기) · /jeoksan/magam (마감) · /jeoksan/auto (도면 물량 자동)
 *
 * ■ 도면은 이 브라우저 안에서만 읽습니다(일꾼: lib/골조도면.worker.js · DWG 는 lib/dwgdxf.worker.js 로 먼저 바꿈).
 * ■ 판은 «누른 도형 번호와 도면 좌표» 만 알려 줍니다. 무엇을 할지는 쓰는 화면이 정합니다(찍었다).
 * ■ 네모 고르기(네모=true): 끌면 네모를 그리고, 놓으면 도면 좌표 네모를 돌려줍니다(네모찍었다).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { 찾기판, 가까운도형, 도형글자, 단위배율, 종류, 종류이름 } from './lib/골조도면.js'
import { 길만들기, 그리기, 전체보기, 조각표만들기, 가까운점 } from './lib/골조그림.js'
import { loadFont, FONT } from './lib/plotview.js'
import * as 기억 from './lib/기억자료.js'

export const 큰파일 = 200 * 1024 * 1024
const 쉼 = (n, d = 0) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n || 0)

export function 오류글(k, more) {
  if (k === 'bindxf') return '바이너리 DXF 입니다. 캐드에서 DXF 로 저장할 때 «ASCII» 를 골라 주십시오.'
  if (k === 'notdxf' || k === 'notdwg') return 'DXF·DWG 도면 파일이 아닌 것 같습니다.'
  if (k === 'empty') return '도면에 읽을 것이 없습니다 — 모델 공간이 비었거나 레이어가 모두 꺼져 있습니다.'
  if (k === 'big') return '파일이 너무 큽니다(200MB 까지).'
  if (k === 'mem') return '도면이 너무 커서 이 기기의 기억 공간이 모자랍니다. PC 에서 열어 주십시오.'
  return '도면을 읽지 못했습니다' + (more ? ' (' + more + ')' : '') + '. 캐드에서 DXF(ASCII)로 다시 저장해 보십시오.'
}

/**
 * 도면 한 장 읽기 (DWG 면 먼저 DXF 로) → 모델
 * @param {(s:{msg:string,p:number})=>void} [알려] 진행
 * @returns {Promise<{모델, dxf:ArrayBuffer|null}>}  dxf: 기억해 둘 사본(바꾼 DXF)
 */
export async function 도면읽어오기(buf, name, 알려 = () => {}, 사본남김 = false) {
  const 머리 = String.fromCharCode(...new Uint8Array(buf.slice(0, 6)))
  let dxf = buf
  if (/^AC10\d\d/.test(머리)) {
    알려({ msg: 'DWG → DXF 바꾸는 중 (큰 도면은 30초~1분)', p: 0.1 })
    dxf = await new Promise((되면, 탈) => {
      const w = new Worker(new URL('./lib/dwgdxf.worker.js', import.meta.url), { type: 'module' })
      w.onmessage = (ev) => {
        const d = ev.data || {}
        if (d.type === 'prog') 알려({ msg: 'DWG → DXF: ' + (d.msg || ''), p: d.p || 0 })
        if (d.type === 'done') { w.terminate(); 되면(d.dxf) }
        if (d.type === 'err') { w.terminate(); 탈(Object.assign(new Error(d.msg || d.kind), { kind: d.kind === 'mem' ? 'mem' : 'fail' })) }
      }
      w.onerror = (e) => { w.terminate(); 탈(Object.assign(new Error(e.message || 'DWG 바꾸기 실패'), { kind: 'fail' })) }
      w.postMessage({ type: 'conv', buf, name }, [buf])
    })
  }
  const 사본 = 사본남김 ? dxf.slice(0) : null
  const 모델 = await new Promise((되면, 탈) => {
    const w = new Worker(new URL('./lib/골조도면.worker.js', import.meta.url), { type: 'module' })
    w.onmessage = (ev) => {
      const d = ev.data || {}
      if (d.type === 'prog') 알려({ msg: '도면 읽는 중', p: d.p })
      if (d.type === 'err') { w.terminate(); 탈(Object.assign(new Error(d.msg || d.kind), { kind: d.kind })) }
      if (d.type === 'done') {
        w.terminate()
        const M = d.model
        M.판 = 찾기판(M)
        M.조각표 = 조각표만들기(M)
        되면(M)
      }
    }
    w.onerror = (e) => { w.terminate(); 탈(Object.assign(new Error(e.message || '읽기 실패'), { kind: 'fail' })) }
    w.postMessage({ type: 'read', buf: dxf }, [dxf])
  })
  return { 모델, dxf: 사본 }
}

/** 처음 켜질 때 꺼 둘 레이어(꺼진 레이어·DEFPOINTS) */
export function 처음끈층(M) { return new Set(M.layers.map((L, i) => (L.hide ? i : -1)).filter((i) => i >= 0)) }

/**
 * 화면 하나가 도면 한 장을 쥐는 갈고리. 지난번 도면은 IndexedDB(열쇠)에서 다시 엽니다.
 */
export function use도면(열쇠) {
  const [모델, set모델] = useState(null)
  const [도면이름, set도면이름] = useState('')
  const [도면상태, set도면상태] = useState({ k: 'idle' })
  const [끈층, set끈층] = useState(() => new Set())
  const [단위, set단위] = useState(null)
  const 차례 = useRef(0)

  const 도면열기 = useCallback(async (buf, name, 기억할 = true) => {
    const 나 = ++차례.current
    set도면상태({ k: 'busy', msg: '도면 읽는 중', p: 0 })
    try {
      const { 모델: M, dxf } = await 도면읽어오기(buf, name, (s) => { if (나 === 차례.current) set도면상태({ k: 'busy', ...s }) }, 기억할 && !!열쇠)
      if (나 !== 차례.current) return null
      set모델(M)
      set도면이름(name)
      set단위(단위배율(M.units, M.box))
      set끈층(처음끈층(M))
      set도면상태({ k: 'ok' })
      if (dxf && 열쇠) 기억.넣기(열쇠, { name, buf: dxf }).catch(() => {})
      return M
    } catch (e) {
      if (나 === 차례.current) set도면상태({ k: 'err', 글: 오류글(e.kind || 'fail', e.message) })
      return null
    }
  }, [열쇠])

  const 파일받기 = useCallback(async (files) => {
    const f = files && files[0]
    if (!f) return null
    if (f.size > 큰파일) { set도면상태({ k: 'err', 글: 오류글('big') }); return null }
    return 도면열기(await f.arrayBuffer(), f.name)
  }, [도면열기])

  useEffect(() => {
    if (!열쇠) return undefined
    let 끝 = false
    기억.꺼내기(열쇠).then((d) => { if (!끝 && d && d.buf) 도면열기(d.buf, d.name, false) }).catch(() => {})
    return () => { 끝 = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { 모델, 도면이름, 도면상태, set도면상태, 끈층, set끈층, 단위, set단위, 도면열기, 파일받기 }
}

/** 진행 막대 · 오류 */
/* 📥 끌어다 놓기는 가벼운 파일(끌어놓기.jsx)에 있습니다 — 엑셀 화면들도 같이 씁니다 */

export function 도면상태줄({ 상태 }) {
  if (!상태) return null
  if (상태.k === 'busy') return <div className="dx3-bar" aria-live="polite"><div className="dx3-bar-in" style={{ width: Math.round((상태.p || 0) * 100) + '%' }} /><span>{상태.msg} …</span></div>
  if (상태.k === 'err') return <div className="dx3-err">{상태.글}</div>
  return null
}

/**
 * @param 도 use도면() 이 돌려준 것
 * @param 찍었다 (e, x, y, 보이는범위) — 누른 도형 번호(없으면 -1)와 도면 좌표
 * @param 강조 [{ids, color, w}]
 * @param 두점 null | [] | [[x,y]] · set두점 · 두점찍었다(p)
 * @param 네모 true 면 끌어서 네모 고르기 · 네모찍었다([x0,y0,x1,y1])
 * @param 네모들 [{r:[x0,y0,x1,y1], color, dash, 글}] 도면 위에 덧그릴 네모
 * @param 가볼곳 {r:[x0,y0,x1,y1], n} — n 이 바뀌면 그 네모로 화면을 옮김
 * @param 알림 아래 한 줄(노란 경고) · 알림좋음=true 면 경고 색 없이
 * @param 붙음 false 면 화면 위에 붙어 따라오지 않음(찍을 표가 없는 화면)
 * @param 안내 아래 한 줄(알림이 없을 때)
 * @param 두점단추 📏 두 점 단추를 보일지
 * @param 덧단추 도구줄에 더 넣을 것
 */
export function 도면판({ 도, 찍었다, 강조 = [], 두점 = null, set두점, 두점찍었다, set보는중, 알림, 알림좋음 = false, 붙음 = true, 안내, 열기, 네모 = false, 네모찍었다, 네모들, 가볼곳, 두점단추 = true, 덧단추, 빈글 }) {
  const { 모델, 도면이름: 이름, 끈층, set끈층, 단위, set단위 } = 도
  const boxRef = useRef(null)
  const cvRef = useRef(null)
  const view = useRef(null)
  const [크기, set크기] = useState({ w: 800, h: 480 })
  const [글꼴, set글꼴] = useState(false)
  const 길들 = useMemo(() => (모델 ? 길만들기(모델) : null), [모델])
  const 틀 = useRef(0)
  const 누름 = useRef(null)
  const 손가락 = useRef(new Map())
  const [표시, set표시] = useState('')
  const [접힘, set접힘] = useState(false)
  const [층보기, set층보기] = useState(false)
  const [끌네모, set끌네모] = useState(null)   // 화면 px [x0,y0,x1,y1]
  const 손댐 = useRef(false)                     // 옮기거나 확대했으면 크기가 바뀌어도 화면을 그대로 둠

  useEffect(() => { loadFont().then(set글꼴) }, [])
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const f = () => { const w = el.clientWidth - (el.clientWidth < 600 ? 16 : 20); const 폰 = w < 600; set크기({ w: Math.max(200, w), h: Math.max(200, Math.min(Math.round(window.innerHeight * (폰 ? 0.3 : 0.42)), 폰 ? 300 : 460)) }) }
    f()
    const ro = new ResizeObserver(f)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => { 손댐.current = false }, [모델])
  // 도면이 바뀌었거나, 아직 손대지 않았는데 판 크기가 바뀌면(처음 그려질 때 등) 전체가 보이게
  useEffect(() => { if (모델 && !손댐.current) view.current = 전체보기(모델, 크기.w, 크기.h) }, [모델, 크기.w, 크기.h])  // eslint-disable-line react-hooks/exhaustive-deps

  const 다시 = useCallback(() => {
    cancelAnimationFrame(틀.current)
    틀.current = requestAnimationFrame(() => {
      const cv = cvRef.current
      if (!cv) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (cv.width !== Math.round(크기.w * dpr) || cv.height !== Math.round(크기.h * dpr)) { cv.width = Math.round(크기.w * dpr); cv.height = Math.round(크기.h * dpr) }
      const ctx = cv.getContext('2d')
      if (모델 && !view.current) view.current = 전체보기(모델, 크기.w, 크기.h)
      const v = view.current || { s: 1, cx: 0, cy: 0 }
      그리기(ctx, 크기.w, 크기.h, dpr, 모델, 길들 || new Map(), v, 끈층, 강조, 모델 && 모델.조각표, 글꼴 ? FONT : null)
      const sx = (x) => 크기.w / 2 + (x - v.cx) * v.s, sy = (y) => 크기.h / 2 - (y - v.cy) * v.s
      if (네모들 && 네모들.length && 모델) {
        ctx.save()
        ctx.font = '12px sans-serif'
        for (const k of 네모들) {
          const [x0, y0, x1, y1] = k.r
          ctx.strokeStyle = k.color || '#22c55e'
          ctx.lineWidth = k.w || 2
          ctx.setLineDash(k.dash ? [6, 4] : [])
          ctx.strokeRect(sx(x0), sy(y1), (x1 - x0) * v.s, (y1 - y0) * v.s)
          if (k.글) { ctx.fillStyle = k.color || '#22c55e'; ctx.fillText(k.글, sx(x0) + 2, sy(y1) - 4) }
        }
        ctx.restore()
      }
      if (두점 && 두점.length && view.current) {
        const [x, y] = 두점[0]
        ctx.fillStyle = '#f472b6'
        ctx.beginPath(); ctx.arc(sx(x), sy(y), 5, 0, Math.PI * 2); ctx.fill()
      }
      if (끌네모) {
        const [a, b, c, d] = 끌네모
        ctx.save(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.fillStyle = 'rgba(56,189,248,.10)'
        ctx.fillRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b)); ctx.strokeRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b))
        ctx.restore()
      }
    })
  }, [모델, 길들, 크기, 끈층, 강조, 글꼴, 두점, 네모들, 끌네모])
  useEffect(() => { 다시() }, [다시])
  useEffect(() => {
    if (!가볼곳 || !모델) return
    const [x0, y0, x1, y1] = 가볼곳.r
    const w = Math.max(x1 - x0, 1e-9), h = Math.max(y1 - y0, 1e-9)
    const s = Math.min(크기.w / w, 크기.h / h) * 0.85
    view.current = { s, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
    손댐.current = true
    다시()
  }, [가볼곳 && 가볼곳.n])  // eslint-disable-line react-hooks/exhaustive-deps

  const 화면점 = (ev) => { const r = cvRef.current.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top] }
  const 도면좌표 = (sx, sy) => { const v = view.current; return [v.cx + (sx - 크기.w / 2) / v.s, v.cy - (sy - 크기.h / 2) / v.s] }
  const 도면점 = (ev) => { const [sx, sy] = 화면점(ev); const [x, y] = 도면좌표(sx, sy); return [x, y, sx, sy] }
  const 보이는범위 = () => { const v = view.current; return [v.cx - 크기.w / 2 / v.s, v.cy - 크기.h / 2 / v.s, v.cx + 크기.w / 2 / v.s, v.cy + 크기.h / 2 / v.s] }
  const 확대 = (f, sx = 크기.w / 2, sy = 크기.h / 2) => {
    const v = view.current
    if (!v) return
    const wx = v.cx + (sx - 크기.w / 2) / v.s, wy = v.cy - (sy - 크기.h / 2) / v.s
    const s2 = Math.max(1e-7, Math.min(1e5, v.s * f))
    view.current = { s: s2, cx: wx - (sx - 크기.w / 2) / s2, cy: wy + (sy - 크기.h / 2) / s2 }
    손댐.current = true
    다시()
  }
  const 누른것 = (ev) => {
    if (!모델 || !view.current || !찍었다) return
    const [x, y] = 도면점(ev)
    const tol = 7 / view.current.s
    if (두점 !== null && 두점찍었다) { 두점찍었다(가까운점(모델, 모델.판, x, y, tol * 1.5)); return }
    const e = 가까운도형(모델, 모델.판, x, y, tol, 끈층)
    찍었다(e, x, y, 보이는범위())
  }
  const 올림 = (ev) => {
    if (!모델 || !view.current || 누름.current) return
    const [x, y] = 도면점(ev)
    const e = 가까운도형(모델, 모델.판, x, y, 7 / view.current.s, 끈층)
    if (set보는중) set보는중(e)
    if (e < 0) { set표시(''); return }
    const E = 모델.E, k = (단위 && 단위.k) || 1
    const t = E.t[e]
    let s = 종류이름[t]
    if (t === 종류.치수) s += ' ' + 쉼(E.val[e], 1)
    else if (t === 종류.글자) s += ' «' + 도형글자(모델, e) + '»'
    else if (E.len[e] > 0) s += ' 길이 ' + 쉼(E.len[e] * k, 1) + ' mm'
    if (E.area[e] > 0) s += ' · 면적 ' + 쉼(E.area[e] * k * k / 1e6, 3) + ' m²'
    s += ' · 레이어 ' + 모델.layers[E.ly[e]]?.name
    const I = E.ins[e]
    if (I >= 0 && 모델.I[I]) s += ' · 블록 ' + 모델.I[I].name
    set표시(s)
  }
  const 내림 = (ev) => {
    if (!모델) return
    cvRef.current.setPointerCapture?.(ev.pointerId)
    손가락.current.set(ev.pointerId, [ev.clientX, ev.clientY])
    const [sx, sy] = 화면점(ev)
    누름.current = { x: ev.clientX, y: ev.clientY, sx, sy, v: { ...view.current }, 움직임: false, 두손: 손가락.current.size >= 2 }
  }
  const 움직임 = (ev) => {
    if (!누름.current) { 올림(ev); return }
    const 이전 = 손가락.current.get(ev.pointerId)
    손가락.current.set(ev.pointerId, [ev.clientX, ev.clientY])
    if (손가락.current.size >= 2 && 이전) {
      const pts = [...손가락.current.values()]
      const d1 = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1])
      const other = [...손가락.current.entries()].find(([id]) => id !== ev.pointerId)
      if (other) {
        const d0 = Math.hypot(이전[0] - other[1][0], 이전[1] - other[1][1])
        if (d0 > 0) {
          const r = cvRef.current.getBoundingClientRect()
          확대(d1 / d0, (pts[0][0] + pts[1][0]) / 2 - r.left, (pts[0][1] + pts[1][1]) / 2 - r.top)
        }
      }
      누름.current.움직임 = true
      set끌네모(null)
      return
    }
    const dx = ev.clientX - 누름.current.x, dy = ev.clientY - 누름.current.y
    if (!누름.current.움직임 && Math.hypot(dx, dy) < 5) return
    누름.current.움직임 = true
    if (네모 && !누름.current.두손) {
      const [sx, sy] = 화면점(ev)
      set끌네모([누름.current.sx, 누름.current.sy, sx, sy])
      return
    }
    const v0 = 누름.current.v
    view.current = { ...view.current, cx: v0.cx - dx / v0.s, cy: v0.cy + dy / v0.s }
    손댐.current = true
    다시()
  }
  const 뗌 = (ev) => {
    const n = 누름.current
    손가락.current.delete(ev.pointerId)
    if (손가락.current.size) return
    누름.current = null
    if (네모 && 끌네모 && n && !n.두손) {
      const [a, b, c, d] = 끌네모
      set끌네모(null)
      if (Math.abs(c - a) > 6 && Math.abs(d - b) > 6 && 네모찍었다) {
        const [x0, y0] = 도면좌표(Math.min(a, c), Math.max(b, d))
        const [x1, y1] = 도면좌표(Math.max(a, c), Math.min(b, d))
        네모찍었다([x0, y0, x1, y1])
      }
      return
    }
    if (n && !n.움직임 && !n.두손) 누른것(ev)
  }
  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return undefined
    const w = (ev) => {
      if (!모델) return
      ev.preventDefault()
      const r = cv.getBoundingClientRect()
      확대(Math.exp(-ev.deltaY * 0.0015), ev.clientX - r.left, ev.clientY - r.top)
    }
    cv.addEventListener('wheel', w, { passive: false })
    return () => cv.removeEventListener('wheel', w)
  })

  const 층목록 = 모델 ? 모델.layers.map((L, i) => ({ ...L, i })) : []
  return (
    <div className={'card gg-draw no-print' + (접힘 ? ' folded' : '') + (붙음 ? '' : ' nosticky')} ref={boxRef}>
      <div className="gg-bar">
        <span className="gg-file">{모델 ? '📐 ' + 이름 : '도면을 여시면 여기에 보입니다'}</span>
        <button type="button" className="chip" onClick={() => set접힘(!접힘)}>{접힘 ? '도면 펴기 ▾' : '도면 접기 ▴'}</button>
        {모델 && !접힘 && (
          <>
            <button type="button" className="chip" onClick={() => { view.current = 전체보기(모델, 크기.w, 크기.h); 손댐.current = false; 다시() }}>전체</button>
            <button type="button" className="chip" onClick={() => 확대(1.6)}>＋</button>
            <button type="button" className="chip" onClick={() => 확대(1 / 1.6)}>－</button>
            {두점단추 && set두점 && <button type="button" className={'chip' + (두점 !== null ? ' on' : '')} onClick={() => set두점(두점 === null ? [] : null)}>📏 두 점</button>}
            {덧단추}
            <button type="button" className={'chip' + (층보기 ? ' on' : '')} onClick={() => set층보기(!층보기)}>레이어 {층목록.length - 끈층.size}/{층목록.length}</button>
            <label className="gg-unit">단위
              <select value={단위 ? 단위.k : 1} onChange={(e) => set단위({ k: +e.target.value, 글: e.target.selectedOptions[0].text })}>
                <option value={1}>mm</option><option value={10}>cm</option><option value={1000}>m</option>
              </select>
            </label>
          </>
        )}
      </div>
      {층보기 && 모델 && (
        <div className="gg-layers">
          {층목록.map((L) => (
            <label key={L.i}><input type="checkbox" checked={!끈층.has(L.i)} onChange={() => { const s = new Set(끈층); if (s.has(L.i)) s.delete(L.i); else s.add(L.i); set끈층(s) }} />
              <i style={{ background: 'rgb(' + L.rgb.join(',') + ')' }} />{L.name}</label>
          ))}
          <button type="button" className="chip" onClick={() => set끈층(new Set())}>모두 켜기</button>
        </div>
      )}
      <div className="gg-cv" style={{ height: 접힘 ? 0 : 크기.h }}>
        <canvas ref={cvRef} style={{ width: 크기.w, height: 크기.h, touchAction: 'none', cursor: 네모 ? 'cell' : undefined }}
          onPointerDown={내림} onPointerMove={움직임} onPointerUp={뗌} onPointerCancel={뗌} onPointerLeave={() => { if (set보는중) set보는중(null); set표시('') }} />
        {!모델 && (
          <div className="gg-empty-draw">
            {열기 && <button type="button" className="btn sm" onClick={열기}>📂 도면 열기 (DXF·DWG)</button>}
            <div className="muted">{빈글 || '도면을 여세요. 도면 없이 표에 직접 적어도 됩니다.'}</div>
          </div>
        )}
        {표시 && <div className="gg-tip">{표시}</div>}
      </div>
      <div className={'gg-say' + (알림 && !알림좋음 ? ' warn' : '')}>{알림 || 안내}</div>
    </div>
  )
}
