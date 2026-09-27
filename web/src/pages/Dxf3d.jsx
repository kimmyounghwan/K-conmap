/**
 * /tools/dxf3d — 📦 도면 3D 보기 (2026-09-25)
 *
 * 소장님: 「DXF 도면만 넣으면 3D 가 서는 도구 — 프로그램화 해서 도구로 넣자」 · 「3d 도구도 올려줘」
 *         「도구는 되도록 사이트 안에서」
 *
 * ■ 도면(.dxf)을 «이 브라우저 안에서만» 읽어 선을 도면에 적힌 높이(Z) 그대로 세웁니다.
 *   서버가 없습니다 → 파일이 어디로도 안 가고, 동시에 몇 명이 써도 서로 느려지지 않습니다.
 * ■ 읽기는 lib/dxf3d.js (일꾼 lib/dxf3d.worker.js), 그리기는 lib/gl3d.js (WebGL, three.js 없이).
 * ■ ⚠️ 도면을 해석하지 않습니다. 높이가 없는 평면도는 납작하게 나오고, 그렇다고 화면에 적습니다.
 *   못 그린 것(글자·해치·3DSOLID …)은 몇 개인지 세어 보여 줍니다 — 조용히 빼지 않습니다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fitBox } from '../lib/dxf3d.js'
import { LineView } from '../lib/gl3d.js'

import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
/* 🧪 2026-09-26 — 소장님: 「각각의 도구별로 예시가 하나씩 있어야 하지 않아. 그래야 사람들이 보고 해보지」
   예시 도면은 제가 새로 그린 «가상의 건물·언덕» 입니다(남의 공사 도면이 아닙니다). public/tools/files/ex-*.dxf */
const 예시들 = [
  { 이름: '🏢 가상 3층 건물 — 평면도 + 단면도', 파일: ['ex-building-plan.dxf', 'ex-building-section.dxf'],
    글: '지하 1층 · 지상 3층 · 옥상 평면도 한 장과, 층 높이(FL)가 적힌 단면도 한 장을 같이 놓은 모습입니다' },
  { 이름: '⛰ 가상 언덕 — 등고선 + 길', 파일: ['ex-terrain.dxf'],
    글: '높이를 가진 등고선(2m 간격)과 3D 폴리선 길 — 높이가 든 도면은 그대로 섭니다' },
]
const 큰파일 = 250 * 1024 * 1024
const 모두합 = 400 * 1024 * 1024

const 쉼 = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const 높이글 = (z) => (Math.abs(z) >= 1000 ? 쉼(z) : (Math.round(z * 100) / 100).toString())
const 미터 = (mm) => (mm >= 0 ? '+' : '−') + (Math.abs(mm) / 1000).toFixed(2) + ' m'

/* 🧭 2026-09-27 — 「손님 맞을 준비 … 전수조사」: 도면을 세워 본 뒤 다른 화면에 갔다 오면 다시 넣어야 했습니다.
   → 마지막으로 세운 판(일꾼이 돌려준 것)과 켠 레이어·층·높이를 이 탭의 메모리에 둡니다. 뒤로 오면 다시 읽지 않고 그대로 세웁니다.
     (새로고침하면 처음부터 — 도면이 커서 창고에는 넣지 않습니다) */
let 남은 = null   // { r, dwg수, 파일이름, 예시글, 레켬, 층켬, 면, 높이배 }

export default function Dxf3d() {
  const cvRef = useRef(null)
  const viewRef = useRef(null)
  const [끌옮, set끌옮] = useState(false)
  const workRef = useRef(null)
  const 파일칸 = useRef(null)
  const [끌림, set끌림] = useState(false)
  const [상태, set상태] = useState({ k: 'idle' })       // idle | busy | done | err
  const [결과, set결과] = useState(null)
  const [레켬, set레켬] = useState({})                  // 레이어 이름 → 켬
  const [층켬, set층켬] = useState({})                  // 🏢 건물 층 → 켬
  const [면, set면] = useState(true)
  const [높이배, set높이배] = useState(1)
  const [층찾기, set층찾기] = useState('')
  const [파일이름, set파일이름] = useState('')
  const [예시글, set예시글] = useState('')
  /* 📍 기준점 찍기 — { g: 묶음 번호, 단계: 1|2, A: [x,y,z] } */
  const [맞춤, set맞춤] = useState(null)
  const [높이도, set높이도] = useState(false)
  const [맞춤글, set맞춤글] = useState('')

  useEffect(() => {
    if (!남은 || !남은.r) return
    const 옛 = { ...남은 }
    set파일이름(옛.파일이름 || ''); set예시글(옛.예시글 || '')
    보이기(옛.r, 옛.dwg수, 옛)
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (남은) Object.assign(남은, { 레켬, 층켬, 면, 높이배, 파일이름, 예시글 }) }, [레켬, 층켬, 면, 높이배, 파일이름, 예시글])
  useEffect(() => () => {
    if (viewRef.current) viewRef.current.dispose()
    if (workRef.current) workRef.current.terminate()
  }, [])

  /* 버킷(층×레이어) 하나가 보이나 */
  const 보임 = useCallback((l, 레 = 레켬, 층 = 층켬) => !!레[l.ly] && (!l.floor || !!층[l.floor]), [레켬, 층켬])
  const 켬맵 = useMemo(() => {
    const m = {}
    if (결과) for (const l of 결과.layers) m[l.name] = 보임(l)
    return m
  }, [결과, 보임])

  const 읽기 = async (list, 예시 = false) => {
    const fs = [...(list || [])]
    if (!fs.length) return
    if (!예시) set예시글('')
    set파일이름(fs.map((f) => f.name).join(' · '))
    set결과(null)
    /* 🔁 2026-09-27 — DWG 도 받습니다: 이 브라우저 안에서 DXF 로 바꾼 뒤 세웁니다(DWG → DXF 바꾸기와 같은 일꾼).
       전에는 「DWG 는 못 읽어서 뺐습니다」 였습니다. */
    if (fs.some((f) => f.size > 큰파일) || fs.reduce((n, f) => n + f.size, 0) > 모두합) { set상태({ k: 'err', msg: 'big' }); return }
    set상태({ k: 'busy', p: 0, msg: '파일 여는 중' })
    const files = []
    let 못바꾼 = 0
    for (const f of fs) {
      let buf = await f.arrayBuffer()
      const 머리 = String.fromCharCode(...new Uint8Array(buf.slice(0, 6)))
      if (/^AC10\d\d/.test(머리)) {
        set상태({ k: 'busy', p: 0.02, msg: `${f.name} — DWG 를 DXF 로 바꾸는 중 (큰 도면은 30초~1분)` })
        try {
          buf = await new Promise((되면, 탈) => {
            const w = new Worker(new URL('../lib/dwgdxf.worker.js', import.meta.url), { type: 'module' })
            w.onmessage = (ev) => {
              const d = ev.data || {}
              if (d.type === 'prog') set상태({ k: 'busy', p: (d.p || 0) * 0.3, msg: `${f.name} — DWG → DXF: ${d.msg || ''}` })
              if (d.type === 'done') { w.terminate(); 되면(d.dxf) }
              if (d.type === 'err') { w.terminate(); 탈(new Error(d.msg || d.kind)) }
            }
            w.onerror = (e) => { w.terminate(); 탈(new Error(e.message || 'DWG')) }
            w.postMessage({ type: 'conv', buf, name: f.name }, [buf])
          })
        } catch (e) { 못바꾼++; continue }
      }
      files.push({ name: f.name.replace(/\.dwg$/i, '.dxf'), buf })
    }
    if (!files.length) { set상태({ k: 'err', msg: 'dwg' }); return }
    if (workRef.current) workRef.current.terminate()
    const w = new Worker(new URL('../lib/dxf3d.worker.js', import.meta.url), { type: 'module' })
    workRef.current = w
    const dwg수 = 못바꾼
    w.onmessage = (ev) => {
      const m = ev.data
      if (m.type === 'prog') set상태({ k: 'busy', p: m.p, msg: m.msg })
      else if (m.type === 'err') { set상태({ k: 'err', msg: m.kind, more: m.msg }); w.terminate() }
      else if (m.type === 'done') {
        w.terminate(); workRef.current = null
        보이기(m.r, dwg수)
      }
    }
    w.onerror = (e) => set상태({ k: 'err', msg: 'fail', more: String(e.message || '') })
    w.postMessage({ files }, files.map((f) => f.buf))
  }

  const 예시로 = async (q) => {
    set예시글(q.글)
    set상태({ k: 'busy', p: 0, msg: '예시 도면 받는 중' })
    try {
      const fs = []
      for (const f of q.파일) {
        const res = await fetch('/tools/files/' + f)
        if (!res.ok) throw new Error(f)
        fs.push(new File([await res.blob()], f))
      }
      await 읽기(fs, true)
    } catch (e) { set상태({ k: 'err', msg: 'fail', more: '예시 도면을 받지 못했습니다 — 잠시 뒤 다시 눌러 주십시오' }) }
  }

  const 보이기 = (r, dwg수, 되살림 = null) => {
    남은 = { r, dwg수, 파일이름: 되살림 ? 되살림.파일이름 : 파일이름, 예시글: 되살림 ? 되살림.예시글 : 예시글 }
    const 레 = {}
    for (const l of r.layers) 레[l.ly] = (레[l.ly] ?? false) || !l.off
    if (!Object.values(레).some(Boolean)) for (const k of Object.keys(레)) 레[k] = true
    const 층 = {}
    const 묶음켬 = {}
    for (const g of r.그룹 || []) for (const k of g.층들) 묶음켬[k] = g.켬
    for (const l of r.layers) if (l.floor) 층[l.floor] = 묶음켬[l.floor] ?? true
    if (되살림) { Object.assign(레, 되살림.레켬 || {}); Object.assign(층, 되살림.층켬 || {}) }
    set레켬(레); set층켬(층); set면(되살림 ? 되살림.면 !== false : true)
    set높이배(되살림 ? 되살림.높이배 || 1 : 1)
    set결과({
      layers: r.layers.map((l) => ({ name: l.name, floor: l.floor, ly: l.ly, rgb: l.rgb, off: l.off, segs: l.segs,
        pts: l.pts.length / 3, box: l.box, smp: l.smp, tri: l.tri ? l.tri.length / 9 : 0 })),
      stats: r.stats, zr: r.zr, c: r.center, 건물: r.건물, 횡단: r.횡단 || null, 파일: r.파일, 못읽은: r.못읽은 || [], dwg수,
      구조: r.구조 || null, 그룹: r.그룹 || [],
    })
    set맞춤(null); set맞춤글('')
    set상태({ k: 'done' })
    const on = {}
    for (const l of r.layers) on[l.name] = 보임(l, 레, 층)
    requestAnimationFrame(() => {
      try {
        if (!viewRef.current) viewRef.current = new LineView(cvRef.current)
        viewRef.current.끌어옮기기 = 끌옮
        viewRef.current.setZ(되살림 ? 되살림.높이배 || 1 : 1)
        viewRef.current.set면(되살림 && 되살림.면 === false ? 0 : 0.55)
        viewRef.current.setLayers(r.layers.map((l) => ({ ...l, off: !on[l.name] })))
        viewRef.current.fit(자리(r.layers, on), 평평(r.layers, on) ? 'top' : 'tilt')
      } catch (e) {
        set상태({ k: 'err', msg: 'webgl' })
      }
    })
  }

  const 다시켜기 = (레, 층) => {
    if (!결과 || !viewRef.current) return
    viewRef.current.setAll((nm) => { const l = 결과.layers.find((x) => x.name === nm); return l ? 보임(l, 레, 층) : false })
  }
  const 레이어켜기 = (ly, on) => { const n = { ...레켬, [ly]: on }; set레켬(n); 다시켜기(n, 층켬) }
  const 층켜기 = (fl, on) => { const n = { ...층켬, [fl]: on }; set층켬(n); 다시켜기(레켬, n) }
  const 층만 = (fl) => { const n = {}; for (const k of Object.keys(층켬)) n[k] = k === fl; set층켬(n); 다시켜기(레켬, n) }
  const 층모두 = () => { const n = {}; for (const k of Object.keys(층켬)) n[k] = true; set층켬(n); 다시켜기(레켬, n) }
  const 모두 = (how) => {
    if (!결과) return
    const n = {}
    for (const l of 결과.layers) n[l.ly] = how === 'all' ? true : how === 'none' ? false : (n[l.ly] || !l.off)
    set레켬(n); 다시켜기(n, 층켬)
  }
  const 면바꾸기 = (v) => { set면(v); if (viewRef.current) viewRef.current.set면(v ? 0.55 : 0) }
  const 보기 = (how) => {
    if (!결과 || !viewRef.current) return
    viewRef.current.fit(자리(결과.layers, 켬맵), how)
  }
  const 높이 = (z) => { set높이배(z); if (viewRef.current) viewRef.current.setZ(z) }
  /* 🧩 묶음(도면 한 장·건물·횡단·구조물) 통째로 켜고 끄기 */
  const 묶음켜기 = (g, on) => { const n = { ...층켬 }; for (const k of g.층들) n[k] = on; set층켬(n); 다시켜기(레켬, n) }
  const 묶음만 = (g) => { const n = {}; for (const k of Object.keys(층켬)) n[k] = g.층들.includes(k); set층켬(n); 다시켜기(레켬, n); if (viewRef.current && 결과) { const on = {}; for (const l of 결과.layers) on[l.name] = 보임(l, 레켬, n); viewRef.current.fit(자리(결과.layers, on), 'tilt') } }
  /* 📍 기준점 찍기 — ① 옮길 묶음에서 한 점 ② 그 점이 갈 자리(다른 도면)를 누르면 그만큼 옮깁니다 */
  const 맞추기시작 = (g) => { set맞춤({ g: g.번, 단계: 1 }); set맞춤글('') }
  useEffect(() => {
    const v = viewRef.current
    if (!v) return
    if (!맞춤 || !결과 || !남은) { v.onPick = null; return }
    const 묶 = 결과.그룹.find((x) => x.번 === 맞춤.g)
    const 층들 = new Set(묶 ? 묶.층들 : [])
    const 이름층 = new Map(결과.layers.map((l) => [l.name, l.floor]))
    v.onPick = (cx, cy) => {
      if (맞춤.단계 === 1) {
        const A = v.점고르기(cx, cy, (nm) => 층들.has(이름층.get(nm)))
        if (!A) { set맞춤글('그 자리에 선이 없습니다 — 옮길 도면의 선 끝(모서리)을 눌러 주십시오'); return }
        set맞춤({ ...맞춤, 단계: 2, A }); set맞춤글('')
      } else {
        const B = v.점고르기(cx, cy, (nm) => !층들.has(이름층.get(nm)))
        if (!B) { set맞춤글('그 자리에 선이 없습니다 — 맞출 도면(다른 묶음)의 선 끝을 눌러 주십시오'); return }
        const d = [B[0] - 맞춤.A[0], B[1] - 맞춤.A[1], 높이도 ? B[2] - 맞춤.A[2] : 0]
        for (const l of 남은.r.layers) {
          if (!층들.has(l.floor)) continue
          for (const a of [l.pos, l.pts, l.tri]) { if (!a) continue; for (let i = 0; i < a.length; i += 3) { a[i] += d[0]; a[i + 1] += d[1]; a[i + 2] += d[2] } }
          if (l.box) { l.box[0] += d[0]; l.box[3] += d[0]; l.box[1] += d[1]; l.box[4] += d[1]; for (const k of [2, 5, 6, 7]) l.box[k] += d[2] }
          if (l.smp) for (let i = 0; i < l.smp.p.length; i += 3) { l.smp.p[i] += d[0]; l.smp.p[i + 1] += d[1]; l.smp.p[i + 2] += d[2] }
        }
        const on = {}
        for (const l of 남은.r.layers) on[l.name] = 보임(l)
        v.setLayers(남은.r.layers.map((l) => ({ ...l, off: !on[l.name] })))
        set맞춤(null)
        set맞춤글(`📍 옮겼습니다 — 가로 ${(d[0] / 1000).toFixed(2)} m · 세로 ${(d[1] / 1000).toFixed(2)} m${d[2] ? ` · 높이 ${(d[2] / 1000).toFixed(2)} m` : ''}. 다시 하려면 «자리 맞추기» 를 한 번 더 누르십시오.`)
      }
    }
    return () => { if (v) v.onPick = null }
  }, [맞춤, 결과, 높이도, 보임])   // eslint-disable-line react-hooks/exhaustive-deps

  const 그림받기 = () => {
    if (!viewRef.current) return
    const a = document.createElement('a')
    a.href = viewRef.current.png()
    a.download = ((결과 && 결과.파일 && 결과.파일[0]) || '도면').replace(/\.dxf$/i, '') + '_3D.png'
    a.click()
  }

  /* 레이어 목록 — 건물이면 층마다 같은 레이어가 있으니 이름으로 묶습니다 */
  const 레이어들 = useMemo(() => {
    if (!결과) return []
    const m = new Map()
    for (const l of 결과.layers) {
      const x = m.get(l.ly) || { ly: l.ly, rgb: l.rgb, off: l.off, n: 0, z: false, tri: 0 }
      x.n += l.segs + l.pts; x.tri += l.tri
      if (l.box && l.box[7] - l.box[6] > 1e-6) x.z = true
      m.set(l.ly, x)
    }
    const q = 층찾기.trim().toLowerCase()
    return [...m.values()].filter((x) => !q || x.ly.toLowerCase().includes(q)).sort((a, b) => b.n - a.n)
  }, [결과, 층찾기])

  const 높이범위 = useMemo(() => {
    if (!결과) return null
    let lo = Infinity, hi = -Infinity
    for (const l of 결과.layers) if (켬맵[l.name] && l.box) { lo = Math.min(lo, l.box[6]); hi = Math.max(hi, l.box[7]) }
    return Number.isFinite(lo) ? [lo + 결과.c[2], hi + 결과.c[2]] : null   // 가운데를 뺀 값이라 되돌립니다
  }, [결과, 켬맵])
  const 납작 = 높이범위 && 높이범위[1] - 높이범위[0] < 1e-6

  const st = 결과 && 결과.stats
  const 안그림 = st ? Object.entries(st.skipped).filter(([, n]) => n > 0) : []
  const 모름 = st ? Object.entries(st.unknown) : []
  const 건물 = 결과 && 결과.건물 && !결과.건물.실패 ? 결과.건물 : null
  const 건물실패 = 결과 && 결과.건물 && 결과.건물.실패 ? 결과.건물 : null
  const 횡단 = 결과 && 결과.횡단 ? 결과.횡단 : null
  const 구조 = 결과 && 결과.구조 ? 결과.구조 : null
  const 그룹 = 결과 && 결과.그룹 ? 결과.그룹 : []
  const 입체 = !!(건물 || 횡단 || 구조)
  const 묶음켬상태 = (g) => { const n = g.층들.filter((k) => 층켬[k]).length; return n === 0 ? false : n === g.층들.length ? true : null }
  const 선수 = 결과 ? 결과.layers.reduce((n, l) => n + l.segs, 0) : 0

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📦 도면 3D 보기 <span className="count">· DXF · DWG</span></h1>
        <div className="note sm">
          캐드 도면(<b>.dxf · .dwg</b>)을 놓으면 입체로 세워 돌려 봅니다.
          <b> 건물은 평면도와 입면도·단면도·골구도를 같이 놓으면</b> 도면 글자에서 층 높이를 스스로 찾아 층을 쌓고 벽·기둥을 세웁니다.
          <b> 토목은 횡단면도를 놓으면</b> 측점 표의 지반고로 단면마다 높이를 맞춰 측점 순서대로 이어 세웁니다(땅 면·계획 면).
          등고선·3D 폴리선·3DFACE 처럼 높이가 든 도면은 그 높이 그대로 섭니다.
        </div>
        <div className="pdfsafe">
          🔒 <b>파일은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 그립니다 —
          그래서 여러 분이 한꺼번에 써도 서로 느려지지 않습니다. 회원가입 없음 · 무료.
        </div>
      </div>

      <div className="card">
        <div className={'pdfdrop' + (끌림 ? ' on' : '')}
             onDragOver={(e) => { e.preventDefault(); set끌림(true) }}
             onDragLeave={() => set끌림(false)}
             onDrop={(e) => { e.preventDefault(); set끌림(false); 읽기(e.dataTransfer.files) }}>
          <button type="button" className="pdfpick" onClick={() => 파일칸.current?.click()}>📂 도면 고르기 (DXF·DWG · 여러 장 가능)</button>
          <div className="pdfdrop-d">또는 도면 파일들을 이곳에 끌어다 놓으세요 · 한 장 250MB · 모두 400MB 까지</div>
        </div>
        <input ref={파일칸} type="file" accept=".dxf,.DXF,.dwg,.DWG" multiple className="sr-only" tabIndex={-1}
               onChange={(e) => { 읽기(e.target.files); e.target.value = '' }} />
        <끌어놓기판 글="도면(DXF·DWG)을 놓으면 세웁니다 — 여러 장도 됩니다" 길들={[{ 꼴: /\.(dxf|dwg)$/i, 받기: (fs) => 읽기(fs), 여럿: true }]} />
        <div className="tlx-ex" style={{ marginTop: 10, marginBottom: 0 }}>
          <span className="tlx-exd"><b>🧪 예시로 해 보기</b> — 도면이 없으시면 눌러 보십시오:</span>
          {예시들.map((q) => (
            <button key={q.이름} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 예시로(q)}>{q.이름}</button>
          ))}
        </div>
        {파일이름 && <div className="pdfgot">📎 {파일이름}{예시글 && <span className="muted"> — 예시: {예시글}</span>}</div>}

        {상태.k === 'busy' && (
          <div className="dx3-bar" aria-live="polite">
            <div className="dx3-bar-in" style={{ width: Math.round((상태.p || 0) * 100) + '%' }} />
            <span>{상태.msg} … {Math.round((상태.p || 0) * 100)}%</span>
          </div>
        )}
        {상태.k === 'err' && <div className="dx3-err">{오류글(상태.msg, 상태.more)}</div>}
      </div>

      <div className="card dx3-card" style={{ display: 상태.k === 'done' ? 'block' : 'none' }}>
        <div className="dx3-tools">
          <button type="button" className="chip" onClick={() => 보기('tilt')}>↗ 비스듬히</button>
          <button type="button" className="chip" onClick={() => 보기('top')}>⬇ 위에서</button>
          <button type="button" className="chip" onClick={() => 보기('side')}>➡ 옆에서</button>
          <span className="dx3-sep" />
          <span className="dx3-lab">높이</span>
          {[1, 2, 5, 10].map((z) => (
            <button type="button" key={z} className={'chip' + (높이배 === z ? ' on' : '')} onClick={() => 높이(z)}>×{z}</button>
          ))}
          {(건물 || 횡단) && (<>
            <span className="dx3-sep" />
            <button type="button" className={'chip' + (면 ? ' on' : '')} onClick={() => 면바꾸기(!면)}>{횡단 && !건물 ? '🟫 땅·계획 면' : 건물 && !횡단 ? '🧱 벽 면' : '🧱 벽·땅 면'}</button>
          </>)}
          <span className="dx3-sep" />
          {/* ✋ 2026-09-27 소장님 「도면을 드래그 해서 옮길 수 있게 해줘」 — 왼쪽 끌기를 «옮기기» 로 바꾸는 단추 */}
          <button type="button" className={'chip' + (끌옮 ? ' on' : '')} onClick={() => { const v = !끌옮; set끌옮(v); if (viewRef.current) viewRef.current.끌어옮기기 = v }}>{끌옮 ? '✋ 끌면 옮기기' : '🔄 끌면 돌리기'}</button>
          <button type="button" className="chip" onClick={그림받기}>🖼 그림 저장</button>
        </div>
        {(맞춤 || 맞춤글) && (
          <div className={'dx3-pick' + (맞춤 ? ' on' : '')}>
            {맞춤 ? (<>
              📍 <b>{맞춤.단계 === 1 ? '① 옮길 도면에서 기준이 될 점(모서리·선 끝)을 누르십시오' : '② 그 점이 가야 할 자리를 다른 도면에서 누르십시오'}</b>
              <span className="muted"> — «{(그룹.find((x) => x.번 === 맞춤.g) || { 파일: [''] }).파일.join(' · ')}»</span>
              <label className="dx3-pick-z"><input type="checkbox" checked={높이도} onChange={(e) => set높이도(e.target.checked)} /> 높이도 맞추기</label>
              <button type="button" className="chip" onClick={() => { set맞춤(null); set맞춤글('') }}>그만두기</button>
              {맞춤글 && <div className="dx3-warn" style={{ marginTop: 6 }}>{맞춤글}</div>}
            </>) : <>{맞춤글}</>}
          </div>
        )}
        <div className="dx3-stage">
          <canvas ref={cvRef} className="dx3-cv" />
          <div className="dx3-hint">{끌옮 ? '끌기 = 옮기기 · 오른쪽 끌기(Shift+끌기) = 돌리기' : '끌기 = 돌리기 · 오른쪽 끌기(Shift+끌기, 두 손가락) = 옮기기'} · 휠(벌리기) = 확대</div>
        </div>
        {결과 && (
          <div className="dx3-info">
            {결과.파일 && 결과.파일.length > 1 && <>도면 <b>{결과.파일.length}</b>장 · </>}
            선 <b>{쉼(선수)}</b>개 · 레이어 <b>{레이어들.length}</b>개
            {st.pts > 0 && <> · 점 <b>{쉼(st.pts)}</b>개</>}
            {높이범위 && !입체 && <> · 켠 층 높이 <b>{높이글(높이범위[0])} ~ {높이글(높이범위[1])}</b></>}
            {높이범위 && 입체 && <> · 높이 <b>{(높이범위[0] / 1000).toFixed(2)} ~ {(높이범위[1] / 1000).toFixed(2)} m</b></>}
            {st.ver && <> · {st.ver}</>}
          </div>
        )}

        {그룹.length > 1 && (
          <div className="dx3-bld">
            <div className="dx3-bh">🧩 <b>도면 {결과.파일.length}장을 {그룹.length}묶음으로 세웠습니다</b>
              <button type="button" className="chip" onClick={() => { const n = {}; for (const k of Object.keys(층켬)) n[k] = true; set층켬(n); 다시켜기(레켬, n) }}>모두 켜기</button>
            </div>
            <div className="dx3-bsub">
              도면마다 맞는 방식으로 세웠습니다 — 🏢 건물(평면도 + 레벨) · 🛣 횡단(측점·지반고) · 🏗 구조물(평면도 + 단면 EL) · 🗺 평면(그대로).
              실제 좌표로 그린 평면도는 제자리에 겹치고, 나머지는 그 옆에 나란히 두었습니다. 자리를 맞추려면 <b>📍 자리 맞추기</b> → 옮길 도면의 한 점 → 갈 자리의 한 점을 누르십시오.
            </div>
            <div className="dx3-btbl">
              <table className="tbl left">
                <thead><tr><th>묶음</th><th>도면</th><th>무엇을</th><th></th></tr></thead>
                <tbody>
                  {그룹.map((g) => {
                    const 켬 = 묶음켬상태(g)
                    return (
                      <tr key={g.번} className={켬 === false ? 'off' : ''}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <label><input type="checkbox" checked={켬 !== false} ref={(el) => { if (el) el.indeterminate = 켬 === null }} onChange={(e) => 묶음켜기(g, e.target.checked)} /> {{ 건물: '🏢 건물', 횡단: '🛣 횡단', 구조: '🏗 구조물', 평면: '🗺 평면' }[g.종류]}</label>
                          {' '}<button type="button" className="dx3-only" onClick={() => 묶음만(g)}>만</button>
                        </td>
                        <td style={{ fontSize: 12.5 }}>{g.파일.join(' · ')}{g.기준 && <span className="dx3-tag">기준 자리</span>}</td>
                        <td className="muted" style={{ fontSize: 12 }}>{g.설명}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{그룹.length > 1 && <button type="button" className={'chip' + (맞춤 && 맞춤.g === g.번 ? ' on' : '')} onClick={() => 맞추기시작(g)}>📍 자리 맞추기</button>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {구조 && 구조.map((q, qi) => (
          <div key={'s' + qi} className="dx3-bld">
            <div className="dx3-bh">🏗 <b>구조물로 세웠습니다</b> — «{q.파일}» · 평면도 + 단면 {q.단면.length - 1}장</div>
            <div className="dx3-bsub">
              평면도를 <b>G.L {q.평면EL.toFixed(2)} m</b> 에 눕히고, 단면마다 <b>EL 글자</b>로 도면 높이를 표고(m)로 맞춘 뒤
              평면도의 <b>자르는 선(A ─ A)</b>에 세워 꽂았습니다(울타리처럼). 옆 자리는 단면 속 벽과 평면의 벽이 가장 많이 겹치게 맞췄습니다.
            </div>
            <div className="dx3-btbl">
              <table className="tbl left">
                <thead><tr><th>평면·단면</th><th>높이(EL)</th><th>어디에 세웠나</th><th>맞춤</th></tr></thead>
                <tbody>
                  {q.단면.map((f) => (
                    <tr key={f.층} className={층켬[f.층] ? '' : 'off'}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <label><input type="checkbox" checked={!!층켬[f.층]} onChange={(e) => 층켜기(f.층, e.target.checked)} /> {f.이름}</label>
                        {' '}<button type="button" className="dx3-only" onClick={() => 층만(f.층)}>만</button>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{f.EL[0] === f.EL[1] ? `${f.EL[0].toFixed(2)} m` : `${f.EL[0].toFixed(2)} ~ ${f.EL[1].toFixed(2)} m`}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{f.놓임}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{f.맞춤}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {q.빠짐.length > 0 && <div className="dx3-warn">⚠️ 세우지 못한 단면: {q.빠짐.join(' · ')}</div>}
          </div>
        ))}
        {건물 && (
          <div className="dx3-bld">
            <div className="dx3-bh">🏢 <b>건물로 세웠습니다</b> — 층 {건물.층들.length}개 · 벽·기둥 {쉼(건물.세운벽)}장
              <button type="button" className="chip" onClick={층모두}>모든 층</button>
            </div>
            <div className="dx3-bsub">
              높이는 <b>도면 글자</b>에서 찾았습니다{건물.참고.length ? <> ({건물.참고.join(' · ')})</> : null} ·
              층 선은 «{건물.평면}» 의 평면도 제목으로 나눴습니다. 층을 누르면 켜고 끄고, «만» 을 누르면 그 층만 봅니다.
            </div>
            <div className="dx3-btbl">
              <table className="tbl left">
                <thead><tr><th>층</th><th>바닥 높이</th><th>층고</th><th>어디서 찾았나</th><th>맞춤</th></tr></thead>
                <tbody>
                  {[...건물.층들].sort((a, b) => b.높이 - a.높이).map((f) => {
                    const g = 건물.근거.find((x) => x.층 === f.층)
                    return (
                      <tr key={f.층} className={층켬[f.층] ? '' : 'off'}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <label><input type="checkbox" checked={!!층켬[f.층]} onChange={(e) => 층켜기(f.층, e.target.checked)} /> {f.이름}</label>
                          {' '}<button type="button" className="dx3-only" onClick={() => 층만(f.층)}>만</button>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}><b>{미터(f.높이)}</b></td>
                        <td style={{ whiteSpace: 'nowrap' }}>{f.층고 ? (f.층고 / 1000).toFixed(2) + ' m' : '—'}</td>
                        <td className="muted" style={{ fontSize: 12 }}>
                          {g ? <>{g.글}{g.번 > 1 ? ` · ${g.번}번 나옴` : ''}{g.다른값 ? <> · <span title="같은 층에 다른 값도 있었습니다">다른 값 {g.다른값}</span></> : null}</> : '—'}
                        </td>
                        <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{f.맞춤}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {건물.빠진.length > 0 && (
              <div className="dx3-warn">⚠️ 높이를 못 찾아 세우지 않은 층: <b>{건물.빠진.join(' · ')}</b> — 그 층 높이가 적힌 입면도·단면도·골구도를 같이 놓아 주십시오.</div>
            )}
            <div className="dx3-skip">치수·글자·해치·도곽·가구 레이어는 3D 에서 가려서 뺐습니다. 벽·기둥은 레이어 이름(WALL·COL·벽·기둥)으로 알아보고 다음 층 높이까지 세웠습니다.</div>
          </div>
        )}
        {횡단 && (
          <div className="dx3-bld">
            <div className="dx3-bh">🛣 <b>횡단면도로 세웠습니다</b> — 노선 {횡단.노선.length}개 · 단면 {횡단.노선.reduce((n, g) => n + g.단면.length, 0)}개
              <button type="button" className="chip" onClick={층모두}>모든 단면</button>
            </div>
            <div className="dx3-bsub">
              측점(NO.·STA.) 표의 <b>지반고</b>로 단면마다 높이를 맞추고, 측점 순서대로 한 줄로 늘어놓았습니다(곧은 축 — 평면 곡선은 아직 따르지 않음).
              이웃 단면의 지반선을 이어 <b>땅 면</b>(초록), 터파기·계획선을 이어 <b>계획 면</b>(파랑)을 만들었습니다. 높이 ×2·×5 로 보면 깎기·쌓기가 잘 보입니다.
            </div>
            {횡단.노선.map((g, gi) => (
              <div key={gi} className="dx3-btbl" style={{ marginTop: 8 }}>
                <div className="muted" style={{ fontSize: 12.5, margin: '2px 0 4px' }}>📎 {g.파일} · 측점 {g.시작.toFixed(1)} ~ {g.끝.toFixed(1)} m · 단면 폭 {g.폭m.toFixed(0)} m{g.어긋m ? ` · 옆으로 ${g.어긋m.toFixed(0)} m 비켜 놓음` : ''}</div>
                <table className="tbl left">
                  <thead><tr><th>측점</th><th>지반고</th><th>계획고</th><th>높이 맞춘 곳</th></tr></thead>
                  <tbody>
                    {g.단면.map((f) => (
                      <tr key={f.층} className={층켬[f.층] ? '' : 'off'}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <label><input type="checkbox" checked={!!층켬[f.층]} onChange={(e) => 층켜기(f.층, e.target.checked)} /> {f.이름}</label>
                          {' '}<button type="button" className="dx3-only" onClick={() => 층만(f.층)}>만</button>
                        </td>
                        <td>{Number.isFinite(f.지반고) ? f.지반고.toFixed(2) + ' m' : '—'}</td>
                        <td>{Number.isFinite(f.계획고) ? f.계획고.toFixed(2) + ' m' : '—'}</td>
                        <td className="muted" style={{ fontSize: 12 }}>중심({f.중심}) × {f.근거}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {g.빠짐.length > 0 && <div className="dx3-warn">⚠️ 세우지 못한 단면: {g.빠짐.join(' · ')}</div>}
              </div>
            ))}
            {횡단.안씀.length > 0 && <div className="dx3-skip">횡단면(측점 표)이 없어 이번에 쓰지 않은 도면: {횡단.안씀.join(' · ')} — 평면도는 다음 차례에 노선 곡선을 따르게 쓰겠습니다.</div>}
          </div>
        )}
        {건물실패 && (
          <div className="dx3-warn">
            🏢 건물로 세우지 못했습니다 — 평면도 제목 {건물실패.평면수}개 · 층 높이 {건물실패.높이수}개를 찾았습니다.
            {건물실패.평면수 < 2 && <> 「지상 2층 평면도」 같은 <b>층별 평면도 제목</b>이 둘 이상 있는 평면도를 같이 놓아 주십시오.</>}
            {건물실패.평면수 >= 2 && 건물실패.높이수 < 2 && <> 「지상 2층 · GL +5,200」 처럼 <b>층 이름과 높이가 적힌</b> 입면도·단면도·골구도를 같이 놓아 주십시오.</>}
            {' '}지금은 도면에 적힌 높이 그대로 그렸습니다.
          </div>
        )}
        {결과 && (결과.dwg수 > 0 || 결과.못읽은.length > 0) && (
          <div className="dx3-skip">
            {결과.dwg수 > 0 && <>DWG {결과.dwg수}장은 DXF 로 바꾸지 못해 뺐습니다(<Link to="/tools/dwgdxf">DWG → DXF 바꾸기</Link> 에서 이유를 볼 수 있습니다). </>}
            {결과.못읽은.length > 0 && <>못 읽은 파일: {결과.못읽은.map((x) => x.이름).join(', ')}</>}
          </div>
        )}
        {납작 && !입체 && (
          <div className="dx3-warn">
            ⚠️ 켠 층의 높이가 <b>모두 같습니다</b> — 이 도면은 평면으로만 그려져 있어 납작하게 보입니다.
            건물이면 <b>평면도와 입면도(또는 단면도·골구도)를 같이</b>, 토목이면 <b>횡단면도(측점·지반고 표가 있는 것)</b>를 놓아 보십시오.
            등고선·3D 폴리선·3DFACE 처럼 높이(Z)가 든 도면은 그대로 섭니다.
          </div>
        )}
        {st && st.capped && (
          <div className="dx3-warn">
            ⚠️ 선이 너무 많아 <b>앞 {쉼(st.segs)}개까지만</b> 그렸습니다. 캐드에서 필요 없는 층을 지우고 다시 저장하시면 다 보입니다.
          </div>
        )}
        {(안그림.length > 0 || 모름.length > 0 || (st && st.depthCut > 0)) && (
          <div className="dx3-skip">
            그리지 않은 것: {안그림.map(([k, n]) => `${k} ${쉼(n)}`).join(' · ')}
            {모름.length > 0 && <>{안그림.length ? ' · ' : ''}모르는 도형 {모름.map(([k, n]) => `${k} ${쉼(n)}`).join(' · ')}</>}
            {st && st.depthCut > 0 && <> · 너무 깊이 겹친 블록 {쉼(st.depthCut)}</>}
            {(st.skipped['입체(3DSOLID)'] || 0) > 0 && (
              <div style={{ marginTop: 4 }}>입체(3DSOLID)는 속이 암호로 되어 있어 못 읽습니다 — 캐드에서 메쉬(MESHSMOOTH)로 바꿔 저장하시면 보입니다.</div>
            )}
          </div>
        )}
        {결과 && (
          <div className="dx3-layers">
            <div className="dx3-lh">
              <b>레이어</b> <span className="count">· 켜고 끄기</span>
              <button type="button" className="chip" onClick={() => 모두('draw')}>도면대로</button>
              <button type="button" className="chip" onClick={() => 모두('all')}>모두 켜기</button>
              <button type="button" className="chip" onClick={() => 모두('none')}>모두 끄기</button>
              {레이어들.length > 12 && (
                <input className="dx3-find" value={층찾기} onChange={(e) => set층찾기(e.target.value)} placeholder="레이어 이름 찾기" />
              )}
            </div>
            <div className="dx3-list">
              {레이어들.map((l) => (
                <label key={l.ly} className={'dx3-row' + (레켬[l.ly] ? '' : ' off')}>
                  <input type="checkbox" checked={!!레켬[l.ly]} onChange={(e) => 레이어켜기(l.ly, e.target.checked)} />
                  <span className="dx3-sw" style={{ background: `rgb(${l.rgb.join(',')})` }} />
                  <span className="dx3-nm" title={l.ly}>{l.ly}</span>
                  {l.off && <span className="dx3-tag">도면에서 꺼짐</span>}
                  {l.tri > 0 ? <span className="dx3-tag z">세움</span> : (!건물 && l.z && <span className="dx3-tag z">높이 있음</span>)}
                  <span className="dx3-n">{쉼(l.n)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="detail-h">무엇이 서나</div>
        <p className="tl-p">
          <b>🏢 건물 — 평면도 + 입면도·단면도·골구도를 같이 놓으면:</b> 평면도의 「지상 2층 평면도」 같은 제목으로 층을 나누고,
          다른 도면의 「지상 2층 · GL +5,200」 같은 글자에서 층 높이를 찾아 <b>지하층은 땅 밑으로, 지상층은 위로</b> 쌓습니다.
          층마다 도면 자리가 달라도 <b>통심선(그리드)이 겹치게</b> 맞추고, 벽·기둥 레이어는 다음 층 높이까지 세웁니다.
          무엇을 어느 도면에서 찾았는지 표로 보여 드리고, 못 찾은 층은 못 찾았다고 적습니다.
        </p>
        <p className="tl-p">
          <b>높이가 든 도면:</b> 수치지도의 <b>등고선</b>(높이를 가진 폴리선)을 켜면 땅 모양이 서고,
          측량 성과의 <b>3D 폴리선·점</b>, 캐드에서 만든 <b>3DFACE·메쉬</b>도 제 높이에 섭니다.
          블록(INSERT)은 크기·회전·배열까지 풀어서 그립니다.
        </p>
        <p className="tl-p">
          ⚠️ 층 높이는 <b>도면에 적힌 글자</b>에서만 찾습니다 — 짐작으로 지어내지 않습니다. 도면마다 쓰는 말이 달라
          못 알아보는 도면도 있습니다. 그럴 땐 도면에 적힌 높이 그대로 그립니다.
        </p>
      </div>

      <div className="card">
        <div className="detail-h">못 읽는 것</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li><b>DWG</b> — <Link to="/tools/dwgdxf">DWG → DXF 바꾸기</Link> 에서 DXF 로 바꿔 놓아 주십시오 (캐드의 «다른 이름으로 저장 → DXF» 도 됩니다)</li>
          <li><b>바이너리 DXF</b> — 저장할 때 «ASCII» 로</li>
          <li><b>3DSOLID·면(REGION)</b> — 속이 암호라 못 읽습니다. 메쉬로 바꾸면 보입니다</li>
          <li><b>글자·해치(채우기)·그림</b> — 3D 에서는 오히려 가려서 뺍니다. 몇 개를 뺐는지는 위에 적습니다</li>
        </ul>
      </div>

      <div className="card">
        <div className="navrow">
          <Link className="navi" to="/tools">🧰 다른 도구</Link>
          <Link className="navi" to="/cad">📐 캐드 유틸</Link>
          <Link className="navi" to="/pdf">📄 PDF 도구</Link>
        </div>
      </div>
    </div>
  )
}

/* 켠 층들의 자리 — 점 수로 무게를 달아 1~99% (구석의 튀는 점 몇 개에 화면이 끌려가지 않게) */
function 자리(layers, 켬) { return fitBox(layers, 켬) }
function 평평(layers, 켬) {
  let lo = Infinity, hi = -Infinity
  for (const l of layers) if (켬[l.name] && l.box) { lo = Math.min(lo, l.box[6]); hi = Math.max(hi, l.box[7]) }
  return !(hi - lo > 1e-6)
}

function 오류글(k, more) {
  if (k === 'dwg') return <>DWG 를 DXF 로 바꾸지 못했습니다. <Link to="/tools/dwgdxf"><b>DWG → DXF 바꾸기</b></Link> 에서 이유를 볼 수 있습니다(아주 옛 판·깨진 파일).</>
  if (k === 'bindxf') return <>바이너리 DXF 입니다. 캐드에서 DXF 로 저장할 때 <b>ASCII</b> 를 골라 주십시오.</>
  if (k === 'notdxf') return <>DXF 도면이 아닌 것 같습니다. 확장자가 .dxf 인 캐드 도면을 놓아 주십시오.</>
  if (k === 'big') return <>파일이 250MB 를 넘습니다. 캐드에서 필요 없는 층을 지우고(PURGE) 다시 저장해 주십시오.</>
  if (k === 'webgl') return <>이 브라우저에서 3D(WebGL)를 켤 수 없습니다. 크롬·엣지·사파리 최신판에서 열어 주십시오.</>
  return <>도면을 읽다가 멈췄습니다. {more ? <span className="muted">({more})</span> : null} 다른 판(2013·2018)의 DXF 로 저장해 다시 놓아 주십시오.</>
}
