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
import { fitBox, layerBox, layerSample } from '../lib/dxf3d.js'
import { LineView } from '../lib/gl3d.js'
import { 성과표읽기 } from '../lib/성과표.js'
import { 두점변환, 회전도 } from '../lib/자리맞춤.js'
import { 세기 } from '../lib/받은수.jsx'
import 활용판 from './Dxf3d활용.jsx'

import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { DWG바꾸기 } from '../lib/dwg바꾸기.js'
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
/* 📡 2026-10-05 측량성과표 — 소장님: 「좌표측량성과표하고, 평면도는 항상 필요하다는 걸 알려야 하지 않을까?」
   「평면도에도 좌표가 안입혀져 있어. 대부분 그래, 그래서 좌표가 있는 측량도면을 측량성과표 도면을 꼭 넣어달라고 해야 하지 않아.」 */
const 표끝 = /\.(csv|txt|xlsx|xls)$/i

const 쉼 = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const 높이글 = (z) => (Math.abs(z) >= 1000 ? 쉼(z) : (Math.round(z * 100) / 100).toString())
const 미터 = (mm) => (mm >= 0 ? '+' : '−') + (Math.abs(mm) / 1000).toFixed(2) + ' m'

/* 🧭 2026-09-27 — 「손님 맞을 준비 … 전수조사」: 도면을 세워 본 뒤 다른 화면에 갔다 오면 다시 넣어야 했습니다.
   → 마지막으로 세운 판(일꾼이 돌려준 것)과 켠 레이어·층·높이를 이 탭의 메모리에 둡니다. 뒤로 오면 다시 읽지 않고 그대로 세웁니다.
     (새로고침하면 처음부터 — 도면이 커서 창고에는 넣지 않습니다) */
let 남은 = null   // { r, dwg수, 파일이름, 예시글, 레켬, 층켬, 면, 높이배, 도면들, 못바꾼들, 성과 }
/* ➕ 2026-09-28 — 소장님: 「도면을 올릴때 마다 누적된 3d 화면이 보이게」 · 「도면 새로 올리기 버튼」 · 「올라가 있는 도면 삭제 후 새로운 도면 올리기」
   · 「도면을 한개 한개 올릴때 마다 3d 화면에 그에 따라서 변하게」
   → 올린 도면(DXF 로 바꾼 것)을 이 탭 메모리에 쌓아 두고, 한 장이라도 더하거나 빼면 «쌓인 도면 전부» 로 다시 세웁니다.
     건물 층·횡단·구조물·자리 잡기는 도면끼리 서로 보고 정하므로(dxf3d.worker.js) 늘 전부로 다시 세우는 것이 맞습니다.
   ⚠️ 쌓인 도면은 새로고침하면 사라집니다(도면이 커서 창고에 넣지 않음 — 위 «남은» 과 같은 까닭). */
let 도면번호 = 0

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
  const [도면들, set도면들] = useState([])      // [{ id, 이름, 크기, dxf: ArrayBuffer, dwg: bool }] — 쌓인 도면
  const 도면들Ref = useRef([])
  const [못바꾼들, set못바꾼들] = useState([])   // 못 읽은 DWG 이름(쌓인 채로 알림)
  const 못바꾼Ref = useRef([])
  /* 📍 기준점 찍기 — { g: 묶음 번호, 단계: 1|2, A: [x,y,z] } */
  const [맞춤, set맞춤] = useState(null)
  const [높이도, set높이도] = useState(false)
  const [맞춤글, set맞춤글] = useState('')
  const [같이, set같이] = useState(false)              // 두 점 찍기 — 같은 무리(글자로 붙은 도면)도 같이 옮기기
  const [성과, set성과] = useState(null)              // 📡 측량성과표 { 파일, 점:[{이름,N,E,Z}], 북동확실 }
  const 성과Ref = useRef(null)
  const [자세히, set자세히] = useState(null)           // 상태표에서 펼친 묶음 번호
  const [끈것보기, set끈것보기] = useState(false)
  /* 🧰 G224 3D 로 더 하기(Dxf3d활용.jsx) — 3D 위 덧그림 층(물길 · 표시 · 원 · 핀). 도면을 다시 세워도(setLayers) 다시 얹음 */
  const 덧Ref = useRef(new Map())
  const [옮긴수, set옮긴수] = useState(0)
  const 덧그림 = useCallback((키, 층) => {
    if (층) 덧Ref.current.set(키, 층); else 덧Ref.current.delete(키)
    if (viewRef.current) viewRef.current.set덧('활용·' + 키, 층)
  }, [])
  const 덧다시 = () => { const v = viewRef.current; if (v) for (const [k, l] of 덧Ref.current) v.set덧('활용·' + k, l) }
  const 원층 = useCallback(() => (남은 && 남은.r ? 남은.r.layers : []), [])
  const 보기판 = useCallback(() => viewRef.current, [])

  useEffect(() => {
    if (!남은 || !남은.r) return
    const 옛 = { ...남은 }
    set파일이름(옛.파일이름 || ''); set예시글(옛.예시글 || '')
    도면들Ref.current = 옛.도면들 || []; set도면들(도면들Ref.current)
    못바꾼Ref.current = 옛.못바꾼들 || []; set못바꾼들(못바꾼Ref.current)
    성과Ref.current = 옛.성과 || null; set성과(성과Ref.current)
    보이기(옛.r, 옛.dwg수, 옛)
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (남은) Object.assign(남은, { 레켬, 층켬, 면, 높이배, 파일이름, 예시글 }) }, [레켬, 층켬, 면, 높이배, 파일이름, 예시글])
  useEffect(() => () => {
    if (viewRef.current) viewRef.current.dispose()
    if (workRef.current) workRef.current.terminate()
  }, [])
  /* 🧯 2026-10-05 — 「어쩔때는 3d가 안되고」 점검: 그래픽 메모리가 모자라면 브라우저가 3D 화면을 말없이 꺼 버립니다(까만 화면).
     → 알아차려서 무엇을 하면 되는지 적습니다 */
  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return undefined
    const 꺼짐 = (e) => { e.preventDefault(); set상태({ k: 'err', msg: 'webgl-lost' }) }
    cv.addEventListener('webglcontextlost', 꺼짐)
    return () => cv.removeEventListener('webglcontextlost', 꺼짐)
  }, [])

  /* 버킷(층×레이어) 하나가 보이나 */
  const 보임 = useCallback((l, 레 = 레켬, 층 = 층켬) => !!레[l.ly] && (!l.floor || !!층[l.floor]), [레켬, 층켬])
  const 켬맵 = useMemo(() => {
    const m = {}
    if (결과) for (const l of 결과.layers) m[l.name] = 보임(l)
    return m
  }, [결과, 보임])

  /* ➕ 도면 더하기 — 새로 = true 면 쌓인 것을 비우고 이것만(예시·«모두 지우고 새로»). 같은 이름을 다시 올리면 바꿔 끼웁니다. */
  const 읽기 = async (list, 예시 = false) => {
    const 모두 = [...(list || [])]
    if (!모두.length) return
    /* 📡 측량성과표(엑셀·CSV·TXT) — 같은 칸에 놓아도 됩니다. 점번호·X·Y·Z 를 읽어 기준으로 씁니다 */
    const 표들 = 모두.filter((f) => 표끝.test(f.name))
    const fs = 모두.filter((f) => !표끝.test(f.name))
    if (표들.length) {
      let 됨 = null
      for (const f of 표들) {
        try { const r = await 성과표읽기(f.name, await f.arrayBuffer()); if (r && (!됨 || r.점.length > 됨.r.점.length)) 됨 = { f, r } } catch (e) { /* 아래 알림 */ }
      }
      if (!됨) {
        set상태({ k: 'err', msg: 'sur', more: 표들.map((f) => f.name).join(', ') })
        if (!fs.length) return
      } else {
        성과Ref.current = { 파일: 됨.f.name, 점: 됨.r.점, 북동확실: 됨.r.북동확실, 빠진줄: 됨.r.빠진줄 }
        set성과(성과Ref.current)
        세기('|도면3d|성과표')
        if (!fs.length) { 세우기(도면들Ref.current); return }
      }
    }
    if (!fs.length) return
    if (!예시) set예시글('')
    if (fs.some((f) => f.size > 큰파일)) { set상태({ k: 'err', msg: 'big' }); return }
    const 이름들 = new Set(fs.map((f) => f.name))
    const 남길 = 예시 ? [] : 도면들Ref.current.filter((x) => !이름들.has(x.이름))
    if (남길.reduce((n, x) => n + x.크기, 0) + fs.reduce((n, f) => n + f.size, 0) > 모두합) { set상태({ k: 'err', msg: 'big' }); return }
    set상태({ k: 'busy', p: 0, msg: '파일 여는 중' })
    /* 🔁 2026-09-27 — DWG 도 받습니다: 이 브라우저 안에서 DXF 로 바꾼 뒤 세웁니다(DWG → DXF 바꾸기와 같은 일꾼). */
    const 새것 = []
    const 못바꾼 = []
    for (const f of fs) {
      /* 🧠 2026-10-05 — 「어쩔때는 3d가 안되고」 점검: 전에는 도면을 통째로 메모리에 읽어 두고, 세울 때마다 «사본» 을 또 만들어
         일꾼에게 넘겨서(400MB 면 800MB 넘게) 메모리가 모자란 PC 에서 멈췄습니다.
         → 파일은 그대로(Blob) 들고 있다가, 일꾼이 한 장씩 꺼내 읽고 놓습니다. 머리 6바이트만 먼저 봅니다. */
      const 머리 = String.fromCharCode(...new Uint8Array(await f.slice(0, 6).arrayBuffer()))
      let 판 = f
      let dwg = false
      if (/^AC10\d\d/.test(머리)) {
        dwg = true
        set상태({ k: 'busy', p: 0.02, msg: `${f.name} — DWG 를 DXF 로 바꾸는 중 (큰 도면은 30초~1분)` })
        /* 🔁 2026-09-28 — 일꾼 하나를 돌려 씁니다(lib/dwg바꾸기.js). 파일마다 새로 띄우면 4장째에서 멈췄습니다. */
        try {
          const buf = (await DWG바꾸기(await f.arrayBuffer(), f.name, (d) => set상태({ k: 'busy', p: (d.p || 0) * 0.3, msg: `${f.name} — DWG → DXF: ${d.msg || ''}` }))).dxf
          판 = new Blob([buf])
        } catch (e) { 못바꾼.push(f.name); continue }
      }
      새것.push({ id: ++도면번호, 이름: f.name, 크기: f.size, dxf: 판, dwg })
    }
    /* 바꾸는 사이에 다른 도면이 더해졌을 수 있으니 «지금» 쌓인 것에 붙입니다 */
    const 바탕 = 예시 ? [] : 도면들Ref.current.filter((x) => !이름들.has(x.이름))
    const 합 = [...바탕, ...새것]
    도면들Ref.current = 합; set도면들(합)
    못바꾼Ref.current = [...(예시 ? [] : 못바꾼Ref.current.filter((n) => !이름들.has(n))), ...못바꾼]
    set못바꾼들(못바꾼Ref.current)
    if (!합.length && !성과Ref.current) { set상태({ k: 'err', msg: 'dwg' }); set결과(null); return }
    세우기(합)
  }

  /* 쌓인 도면 «전부» 로 다시 세웁니다 — 일꾼에게는 사본을 넘깁니다(원본은 다음에 또 씀) */
  const 세우기 = (목록) => {
    if (!목록.length && !성과Ref.current) return
    set파일이름(목록.map((x) => x.이름).join(' · '))
    set상태({ k: 'busy', p: 0.3, msg: `도면 ${목록.length}장${성과Ref.current ? ' + 측량성과표' : ''}으로 세우는 중` })
    if (workRef.current) workRef.current.terminate()
    const w = new Worker(new URL('../lib/dxf3d.worker.js', import.meta.url), { type: 'module' })
    workRef.current = w
    const files = 목록.map((x) => ({ name: x.이름.replace(/\.dwg$/i, '.dxf'), blob: x.dxf }))
    w.onmessage = (ev) => {
      const m = ev.data
      if (workRef.current !== w) return   // 그사이 더 새 세우기가 시작됨
      if (m.type === 'prog') set상태({ k: 'busy', p: m.p, msg: m.msg })
      else if (m.type === 'err') { set상태({ k: 'err', msg: m.kind, more: m.msg }); w.terminate() }
      else if (m.type === 'done') {
        w.terminate(); workRef.current = null
        보이기(m.r, 못바꾼Ref.current.length, null, 못바꾼Ref.current, 목록)
        세기('|도면3d|세움')
        /* 🛣 횡단·종단이 평면 노선을 따라 섰으면 한 번 더 셈(화면엔 안 보임 · 소장님 «누적 카운트») */
        if ((m.r.그룹 || []).some((g) => (g.종류 === '횡단' || g.종류 === '노선') && g.자리 && g.자리.how === '노선')) 세기('|도면3d|노선')
      }
    }
    w.onerror = (e) => set상태({ k: 'err', msg: 'fail', more: String(e.message || '') })
    w.postMessage({ files, 성과: 성과Ref.current })
  }

  /* ✕ 한 장 빼기 — 남은 도면으로 다시 세움 · 다 빠지면 처음 화면 */
  const 빼기 = (id) => {
    const 합 = 도면들Ref.current.filter((x) => x.id !== id)
    도면들Ref.current = 합; set도면들(합)
    if (합.length || 성과Ref.current) 세우기(합)
    else 비우기()
  }
  /* 🗑 모두 지우기 — 쌓인 도면·3D·못 읽은 목록을 비웁니다 */
  const 비우기 = () => {
    if (workRef.current) { workRef.current.terminate(); workRef.current = null }
    도면들Ref.current = []; set도면들([])
    못바꾼Ref.current = []; set못바꾼들([])
    남은 = null
    성과Ref.current = null; set성과(null)
    set결과(null); set파일이름(''); set예시글(''); set맞춤(null); set맞춤글('')
    set상태({ k: 'idle' })
  }
  const 새로올리기 = () => { 비우기(); setTimeout(() => 파일칸.current?.click(), 0) }

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

  const 보이기 = (r, dwg수, 되살림 = null, dwg이름 = (되살림 && 되살림.dwg이름) || [], 목록 = null) => {
    const 쌓인 = 목록 || (되살림 && 되살림.도면들) || 도면들Ref.current
    남은 = { r, dwg수, dwg이름, 파일이름: 되살림 ? 되살림.파일이름 : 쌓인.map((x) => x.이름).join(' · '), 예시글: 되살림 ? 되살림.예시글 : 예시글,
      도면들: 쌓인, 못바꾼들: 못바꾼Ref.current, 성과: 성과Ref.current }
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
      stats: r.stats, zr: r.zr, c: r.center, 건물: r.건물, 횡단: r.횡단 || null, 파일: r.파일, 못읽은: r.못읽은 || [], dwg수, dwg이름,
      구조: r.구조 || null, 그룹: r.그룹 || [], 필요: r.필요 || null, 측량점: r.측량점 || null, 노선: r.노선 || [], 땅면: r.땅면 || null,
      활용: r.활용 || null,
    })
    set맞춤(null); set맞춤글(''); set옮긴수(0)
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
        덧다시()
        viewRef.current.fit(자리(r.layers, on, r.그룹), 평평(r.layers, on) ? 'top' : 'tilt')
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
    viewRef.current.fit(자리(결과.layers, 켬맵, 결과.그룹), how)
  }
  const 높이 = (z) => { set높이배(z); if (viewRef.current) viewRef.current.setZ(z) }
  /* 🧩 묶음(도면 한 장·건물·횡단·구조물) 통째로 켜고 끄기 */
  const 묶음켜기 = (g, on) => { const n = { ...층켬 }; for (const k of g.층들) n[k] = on; set층켬(n); 다시켜기(레켬, n) }
  const 묶음만 = (g) => { const n = {}; for (const k of Object.keys(층켬)) n[k] = g.층들.includes(k); set층켬(n); 다시켜기(레켬, n); if (viewRef.current && 결과) { const on = {}; for (const l of 결과.layers) on[l.name] = 보임(l, 레켬, n); viewRef.current.fit(자리(결과.layers, on, 결과.그룹), 'tilt') } }
  /* 📍 두 점 찍기 (2026-10-05 · 전에는 한 점 옮기기만) — ① 옮길 도면의 첫 점 ② 그 점이 갈 자리 ③ 옮길 도면의 둘째 점 ④ 그 점이 갈 자리
     → 돌리고 옮깁니다(축척은 그대로). ②에서 «한 점만» 을 누르면 옮기기만. «같은 무리도 같이» 면 글자로 붙은 도면까지 함께. */
  const 맞추기시작 = (g) => { set맞춤({ g: g.번, 단계: 1 }); set맞춤글('') }
  const 맞춤대상 = (g번) => {
    const 묶 = 결과 && 결과.그룹.find((x) => x.번 === g번)
    if (!묶) return new Set()
    const 같은 = 같이 && 묶.무리 != null ? 결과.그룹.filter((x) => x.무리 === 묶.무리) : [묶]
    return new Set(같은.flatMap((x) => x.층들))
  }
  const 맞춤적용 = (m, B2 = null) => {
    if (!남은 || !viewRef.current) return
    const 층들 = 맞춤대상(m.g)
    const A1 = m.P1, B1 = m.P2, A2 = m.P3
    const T = A2 && B2 ? 두점변환(A1, A2, B1, B2) : { a: 1, b: 0, tx: B1[0] - A1[0], ty: B1[1] - A1[1] }
    const dz = 높이도 ? B1[2] - A1[2] : 0
    const c = T.a, sn = T.b
    for (const l of 남은.r.layers) {
      if (!층들.has(l.floor)) continue
      for (const a of [l.pos, l.pts, l.tri]) {
        if (!a) continue
        for (let i = 0; i < a.length; i += 3) { const x = a[i], y = a[i + 1]; a[i] = c * x - sn * y + T.tx; a[i + 1] = sn * x + c * y + T.ty; a[i + 2] += dz }
      }
      if (l.trn) for (let i = 0; i < l.trn.length; i += 3) { const x = l.trn[i], y = l.trn[i + 1]; l.trn[i] = c * x - sn * y; l.trn[i + 1] = sn * x + c * y }
      /* 자리·표본은 «같은 배열» 을 화면 쪽(결과)도 들고 있으므로 안에서 고쳐 넣습니다 */
      const nb = layerBox(l.pos, l.pts); if (l.box && nb) for (let k = 0; k < nb.length; k++) l.box[k] = nb[k]
      const ns = layerSample(l.pos, l.pts); if (l.smp && ns && ns.p.length === l.smp.p.length) l.smp.p.set(ns.p)
    }
    const on = {}
    for (const l of 남은.r.layers) on[l.name] = 보임(l)
    viewRef.current.setLayers(남은.r.layers.map((l) => ({ ...l, off: !on[l.name] })))
    덧다시()
    set맞춤(null); set옮긴수((n) => n + 1)
    세기('|도면3d|두점')
    const 길A = A2 ? Math.hypot(A2[0] - A1[0], A2[1] - A1[1]) : 0, 길B = A2 && B2 ? Math.hypot(B2[0] - B1[0], B2[1] - B1[1]) : 0
    const 차 = 길A > 0 ? Math.abs(길B / 길A - 1) * 100 : 0
    set맞춤글(`📍 ${A2 ? `돌림 ${회전도(T).toFixed(2)}° · ` : ''}옮김 가로 ${(T.tx / 1000).toFixed(2)} m · 세로 ${(T.ty / 1000).toFixed(2)} m${dz ? ` · 높이 ${(dz / 1000).toFixed(2)} m` : ''}` +
      (A2 && 차 > 2 ? ` — ⚠️ 두 점 사이 길이가 두 도면에서 ${차.toFixed(1)}% 다릅니다(축척이 다른 도면일 수 있음 · 축척은 바꾸지 않았습니다)` : A2 ? ` — 두 점 사이 길이 차이 ${차.toFixed(1)}%` : '') +
      ' · 다시 하려면 «📍 두 점 찍기» 를 한 번 더 누르십시오.')
  }
  useEffect(() => {
    const v = viewRef.current
    if (!v) return
    if (!맞춤 || !결과 || !남은) { v.onPick = null; return }
    const 층들 = 맞춤대상(맞춤.g)
    const 이름층 = new Map(결과.layers.map((l) => [l.name, l.floor]))
    v.onPick = (cx, cy) => {
      const 내것 = 맞춤.단계 % 2 === 1
      const P = v.점고르기(cx, cy, (nm) => (내것 ? 층들.has(이름층.get(nm)) : !층들.has(이름층.get(nm))))
      if (!P) { set맞춤글(내것 ? '그 자리에 선이 없습니다 — 옮길 도면의 선 끝(모서리)을 눌러 주십시오' : '그 자리에 선이 없습니다 — 맞출 도면(다른 묶음)의 선 끝을 눌러 주십시오'); return }
      if (맞춤.단계 < 4) { set맞춤({ ...맞춤, 단계: 맞춤.단계 + 1, ['P' + 맞춤.단계]: P }); set맞춤글(''); return }
      맞춤적용(맞춤, P)
    }
    return () => { if (v) v.onPick = null }
  }, [맞춤, 결과, 높이도, 같이, 보임])   // eslint-disable-line react-hooks/exhaustive-deps

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
          <b> 토목은 측량 자료 + 계획평면도를 기준으로</b> 한 파일 안의 박스(도곽)를 나눠 종류를 가리고, 평면 쪽은 «같은 글자»(지번 · 측점 · 기준점 이름 · 측량점 번호)로
          측량 좌표에 맞춰 붙입니다. <b>xref(측량 · 계획 그림)를 끼워 그린 도면은 그 xref 파일도 같이 놓으면</b> 캐드에서 끼운 자리 그대로 겹칩니다.
          횡단면도는 측점 · 지반고(또는 눈금자)로 높이를 맞춰 측점 순서대로 이어 세웁니다(땅 면·계획 면).
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
          <button type="button" className="pdfpick" onClick={() => 파일칸.current?.click()}>
            {도면들.length ? `➕ 도면 더 올리기 — 지금 ${도면들.length}장` : '📂 도면 고르기 (DXF·DWG · 측량성과표 엑셀·CSV · 여러 장 가능)'}
          </button>
          <div className="pdfdrop-d">
            {도면들.length
              ? <>한 장씩 더할 때마다 <b>지금까지 올린 도면 전부</b>로 3D 를 다시 세웁니다 · 같은 이름을 다시 올리면 바꿔 끼웁니다</>
              : <>또는 도면 파일들을 이곳에 끌어다 놓으세요 · 한 장씩 더해 가도 됩니다 · 한 장 250MB · 모두 400MB 까지</>}
          </div>
        </div>
        <꼭넣을자료 필요={결과 && 결과.필요} 성과={성과} 결과={결과} />
        <input ref={파일칸} type="file" accept=".dxf,.DXF,.dwg,.DWG,.csv,.CSV,.txt,.TXT,.xlsx,.XLSX,.xls,.XLS" multiple className="sr-only" tabIndex={-1}
               onChange={(e) => { 읽기(e.target.files); e.target.value = '' }} />
        <끌어놓기판 글="도면(DXF·DWG)·측량성과표(엑셀·CSV)를 놓으면 세웁니다 — 여러 장도 됩니다" 길들={[{ 꼴: /\.(dxf|dwg|csv|txt|xlsx|xls)$/i, 받기: (fs) => 읽기(fs), 여럿: true }]} />
        <div className="tlx-ex" style={{ marginTop: 10, marginBottom: 0 }}>
          <span className="tlx-exd"><b>🧪 예시로 해 보기</b> — 도면이 없으시면 눌러 보십시오:</span>
          {예시들.map((q) => (
            <button key={q.이름} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 예시로(q)}>{q.이름}</button>
          ))}
        </div>
        {/* ➕ 쌓인 도면 — 한 장씩 ✕ 로 빼면 남은 도면으로 다시 섭니다 */}
        {(도면들.length > 0 || 못바꾼들.length > 0 || 성과) && (
          <div className="dx3-files">
            <div className="dx3-files-h">
              <b>올린 도면 {도면들.length}장</b>{예시글 && <span className="muted"> — 예시: {예시글}</span>}
              <button type="button" className="chip" onClick={새로올리기}>🗑 모두 지우고 새로 올리기</button>
            </div>
            <div className="dx3-files-l">
              {도면들.map((x) => (
                <span key={x.id} className="dx3-file">
                  📎 {x.이름}<i>{x.크기 >= 1048576 ? (x.크기 / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(x.크기 / 1024)) + 'KB'}</i>
                  <button type="button" aria-label={x.이름 + ' 빼기'} title="이 도면 빼기 — 남은 도면으로 다시 세웁니다" onClick={() => 빼기(x.id)}>✕</button>
                </span>
              ))}
              {못바꾼들.map((n) => <span key={'x' + n} className="dx3-file bad" title="변환 엔진이 읽지 못한 DWG — 캐드에서 DXF 로 저장해 올려 주십시오">⚠️ {n}</span>)}
              {성과 && (
                <span className="dx3-file sur">
                  📡 {성과.파일}<i>측량점 {성과.점.length}개</i>
                  <button type="button" aria-label="측량성과표 빼기" title="측량성과표 빼기 — 남은 도면으로 다시 세웁니다" onClick={() => { 성과Ref.current = null; set성과(null); if (도면들Ref.current.length) 세우기(도면들Ref.current); else 비우기() }}>✕</button>
                </span>
              )}
            </div>
          </div>
        )}

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
              📍 <b>{{ 1: '① 옮길 도면에서 첫 점(모서리·선 끝)을 누르십시오', 2: '② 그 점이 가야 할 자리를 다른 도면에서 누르십시오',
                3: '③ 옮길 도면에서 둘째 점을 누르십시오 — 첫 점과 멀수록 정확합니다', 4: '④ 둘째 점이 가야 할 자리를 누르십시오' }[맞춤.단계]}</b>
              <span className="muted"> — «{(() => { const g = 그룹.find((x) => x.번 === 맞춤.g); return g ? (g.제목 || g.파일.join(' · ')) : '' })()}»</span>
              {맞춤.단계 === 3 && <button type="button" className="chip" onClick={() => 맞춤적용(맞춤)}>한 점만으로 옮기기(돌리지 않음)</button>}
              <label className="dx3-pick-z"><input type="checkbox" checked={높이도} onChange={(e) => set높이도(e.target.checked)} /> 높이도 맞추기</label>
              {(() => { const g = 그룹.find((x) => x.번 === 맞춤.g); return g && g.무리 != null && 그룹.filter((x) => x.무리 === g.무리).length > 1
                ? <label className="dx3-pick-z"><input type="checkbox" checked={같이} onChange={(e) => set같이(e.target.checked)} /> 같은 무리({그룹.filter((x) => x.무리 === g.무리).length}장)도 같이</label> : null })()}
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

        {그룹.length > 1 && (() => {
          /* 🗂 도면 상태표 (2026-10-05) — 박스(도곽)마다 무엇으로 보고 어디에 놓았는지. 자리를 맞춘 것 → 높이 자료 → 처음엔 꺼 둔 것 차례 */
          const 차례 = (g) => (g.기준 ? 0 : g.자리 && g.자리.how === '글자' ? 1 : g.자리 && g.자리.how === '끼움' ? 1.2 : g.자리 && g.자리.how === '모양' ? 1.5 : g.자리 && g.자리.how === '좌표' ? 2 : g.자리 && g.자리.how === '노선' ? 2.5 : g.종류 === '건물' || g.종류 === '횡단' || g.종류 === '구조' ? 3 : g.켬 ? 4 : 5)
          const 줄들 = [...그룹].sort((p, q) => 차례(p) - 차례(q) || p.번 - q.번)
          const 처음끔 = 줄들.filter((g) => 차례(g) === 5)
          const 보일 = 끈것보기 ? 줄들 : 줄들.filter((g) => 차례(g) < 5)
          const 박스수 = 그룹.filter((g) => g.박스).length
          return (
            <div className="dx3-bld">
              <div className="dx3-bh">🗂 <b>도면 {결과.파일.length}장{박스수 ? ` · 박스 ${박스수}장` : ''}을 {그룹.length}묶음으로 세웠습니다</b>
                <button type="button" className="chip" onClick={() => { const n = {}; for (const k of Object.keys(층켬)) n[k] = true; set층켬(n); 다시켜기(레켬, n) }}>모두 켜기</button>
              </div>
              <div className="dx3-bsub">
                한 파일 안의 <b>박스(도곽)</b>를 나눠 이름으로 종류를 가렸습니다. 평면 쪽은 <b>같은 글자</b>(지번 · 측점 · 기준점 이름 · 측량점 번호 · 표고)로
                기준에 맞췄고, 남은 오차를 적었습니다. 종단·횡단면도는 좌표로 맞추지 않고 <b>높이</b>만 가져와, 평면도의 <b>측점</b>(NO.) 자리에 노선을 따라 세웁니다.
                자리가 틀리면 <b>📍 두 점 찍기</b>로 맞추십시오.
              </div>
              <div className="dx3-btbl">
                <table className="tbl left">
                  <thead><tr><th>묶음</th><th style={{ minWidth: '9em' }}>도면 · 박스</th><th style={{ minWidth: '12em' }}>자리</th><th></th></tr></thead>
                  <tbody>
                    {보일.map((g) => {
                      const 켬 = 묶음켬상태(g)
                      const z = g.자리 || {}
                      const 펼 = 자세히 === g.번
                      return [
                        <tr key={g.번} className={켬 === false ? 'off' : ''}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <label><input type="checkbox" checked={켬 !== false} ref={(el) => { if (el) el.indeterminate = 켬 === null }} onChange={(e) => 묶음켜기(g, e.target.checked)} /> {종류글[g.종류] || g.종류}</label>
                            {' '}<button type="button" className="dx3-only" onClick={() => 묶음만(g)}>만</button>
                          </td>
                          <td style={{ fontSize: 12.5 }}>
                            {g.제목 ? <><b>{g.제목}</b><div className="muted" style={{ fontSize: 11.5 }}>{g.파일.join(' · ')}</div></> : g.파일.join(' · ')}
                            {g.기준 && <span className="dx3-tag ref">기준 자리</span>}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            <자리글 g={g} />
                            {z.짝 && z.짝.length > 0 && <button type="button" className="dx3-only" style={{ marginLeft: 6 }} onClick={() => set자세히(펼 ? null : g.번)}>{펼 ? '접기' : '짝 보기'}</button>}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}><button type="button" className={'chip' + (맞춤 && 맞춤.g === g.번 ? ' on' : '')} onClick={() => 맞추기시작(g)}>📍 두 점 찍기</button></td>
                        </tr>,
                        펼 && (
                          <tr key={g.번 + '짝'} className="dx3-pairs">
                            <td colSpan={4}>
                              <div className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>맞은 글자 짝(오차 큰 것부터 · 1 m 넘으면 ⚠️)</div>
                              {z.짝.map((p, i) => <span key={i} className={'dx3-pair' + (p.e > 1 ? ' far' : '')}>{p.e > 1 ? '⚠️ ' : ''}{p.s} <i>{p.종}</i> <b>{p.e.toFixed(2)} m</b></span>)}
                            </td>
                          </tr>
                        ),
                      ]
                    })}
                  </tbody>
                </table>
              </div>
              {처음끔.length > 0 && (
                <button type="button" className="dx3-only" style={{ marginTop: 6 }} onClick={() => set끈것보기(!끈것보기)}>
                  {끈것보기 ? '처음엔 꺼 둔 것 접기' : `처음엔 꺼 둔 것 ${처음끔.length}묶음 보기(종단 · 상세 · 표 · 도곽 밖 …)`}
                </button>
              )}
            </div>
          )
        })()}
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
        {횡단 && 횡단.노선.some((g) => g.토공 && g.토공.줄.length >= 2) && <토공카드 횡단={횡단} 땅면={결과.땅면} />}
        {결과 && 결과.활용 && <활용판 결과={결과} 보기={보기판} 원층={원층} 덧그림={덧그림} 옮긴수={옮긴수} />}
        {횡단 && (
          <div className="dx3-bld">
            <div className="dx3-bh">🛣 <b>횡단면도로 세웠습니다</b> — 노선 {횡단.노선.length}개 · 단면 {횡단.노선.reduce((n, g) => n + g.단면.length, 0)}개
              <button type="button" className="chip" onClick={층모두}>모든 단면</button>
            </div>
            <div className="dx3-bsub">
              측점(NO.·STA.) 표의 <b>지반고</b>(또는 눈금자)로 단면마다 높이를 맞췄습니다.
              {횡단.노선.some((g) => g.자리 && g.자리.how === '노선')
                ? <> 평면도에서 같은 이름의 노선을 찾아, 단면마다 그 <b>측점 자리</b>에 노선과 <b>직각</b>으로 세웠습니다(도면 오른쪽 = 측점이 커지는 쪽을 보고 오른쪽).</>
                : <> 평면 노선을 못 찾아 측점 순서대로 한 줄로 곧게 펴 놓았습니다 — 측점(NO.) 글자와 중심선이 있는 <b>계획평면도 · 종평면도</b>를 같이 넣으면 노선을 따라 섭니다.</>}
              {' '}이웃 단면의 지반선을 이어 <b>땅 면</b>(초록), 터파기·계획선을 이어 <b>계획 면</b>(파랑)을 만들었습니다. 높이 ×2·×5 로 보면 깎기·쌓기가 잘 보입니다.
            </div>
            {횡단.노선.map((g, gi) => (
              <div key={gi} className="dx3-btbl" style={{ marginTop: 8 }}>
                <div className="muted" style={{ fontSize: 12.5, margin: '2px 0 4px' }}>📎 {g.파일} · 측점 {g.시작.toFixed(1)} ~ {g.끝.toFixed(1)} m · 단면 폭 {g.폭m.toFixed(0)} m{g.어긋m ? ` · 옆으로 ${g.어긋m.toFixed(0)} m 비켜 놓음` : ''}</div>
                {g.자리 && g.자리.how === '노선' && (
                  <div className="dx3-st ok" style={{ display: 'block', fontSize: 12.5, margin: '0 0 4px' }}>
                    📍 평면 노선 «{g.자리.노선}» 따라 세움 — 측점 글자 {g.자리.n}개 · 간격 {g.자리.간격} m{g.자리.근거 === '측점 글자' ? ' · 중심선이 없어 측점 글자 자리를 이음(몇 m 어긋날 수 있음)' : Number.isFinite(g.자리.rms) ? ` · 측점 맞춤 오차 ${g.자리.rms.toFixed(2)} m` : ''}
                    {g.자리.이름다름 ? ' · 이름은 다르지만 측점 범위가 같아 이었음' : ''}
                    {g.자리.밖 > 0 ? ` · ⚠️ 단면 ${g.자리.밖}개는 평면 측점 범위 밖(끝 방향으로 곧게 늘임)` : ''}
                    {g.자리.종단확인 ? ` · 종단 표 지반고와 차이 ${g.자리.종단확인.가운데.toFixed(2)} m(${g.자리.종단확인.n}곳)` : ''}
                  </div>
                )}
                {g.자리 && g.자리.how === '곧게' && <div className="dx3-st no" style={{ display: 'block', fontSize: 12.5, margin: '0 0 4px' }}>⚠️ 곧게 펴 옆에 둠 — {g.자리.까닭}</div>}
                <table className="tbl left">
                  <thead><tr><th>측점</th><th>지반고</th><th>계획고</th><th>터파기</th><th>되메우기</th><th>구조물</th><th>높이 맞춘 곳</th></tr></thead>
                  <tbody>
                    {g.단면.map((f) => (
                      <tr key={f.층} className={층켬[f.층] ? '' : 'off'}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <label><input type="checkbox" checked={!!층켬[f.층]} onChange={(e) => 층켜기(f.층, e.target.checked)} /> {f.이름}</label>
                          {' '}<button type="button" className="dx3-only" onClick={() => 층만(f.층)}>만</button>
                        </td>
                        <td>{Number.isFinite(f.지반고) ? f.지반고.toFixed(2) + ' m' : '—'}</td>
                        <td>{Number.isFinite(f.계획고) ? f.계획고.toFixed(2) + ' m' : '—'}</td>
                        {f.면적 && Number.isFinite(f.면적.터파기)
                          ? <><td>{f.면적.터파기.toFixed(2)} ㎡</td><td>{f.면적.되메우기.toFixed(2)} ㎡</td><td>{f.면적.구조물.toFixed(2)} ㎡</td></>
                          : <td colSpan={3} className="muted" style={{ fontSize: 12 }}>{f.면적 && f.면적.이상 ? `면적 안 셈 — ${f.면적.이상}` : '—'}</td>}
                        <td className="muted" style={{ fontSize: 12 }}>중심({f.중심}) × {f.근거}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {g.빠짐.length > 0 && <div className="dx3-warn">⚠️ 세우지 못한 단면: {g.빠짐.join(' · ')}</div>}
              </div>
            ))}
            {횡단.안씀.length > 0 && <div className="dx3-skip">횡단면(측점 표)이 없어 이번에 쓰지 않은 도면: {횡단.안씀.join(' · ')}</div>}
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
            {결과.dwg수 > 0 && <>⚠️ DWG {결과.dwg수}장은 이 브라우저의 변환 엔진이 읽지 못해 뺐습니다{결과.dwg이름 && 결과.dwg이름.length ? <>: <b>{결과.dwg이름.join(' · ')}</b></> : null}.
              {' '}캐드에서 그 도면만 <b>«다른 이름으로 저장 → DXF»</b> 로 저장해 나머지와 <b>같이</b> 놓으시면 한 화면에 섭니다(DXF 는 섞어 넣어도 됩니다). </>}
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

const 종류글 = { 건물: '🏢 건물', 횡단: '🛣 횡단', 노선: '📈 종단 높이', 땅면: '🟫 측량 땅 면', 구조: '🏗 구조물', 측량: '📡 측량도면', 측량점: '📡 측량성과표', 평면: '🗺 평면도', 종평: '🗺 종평(평면 칸)',
  밖: '🗺 도곽 밖', 종단: '📈 종단', 횡단못: '🛣 횡단(못 읽음)', 상세: '🔍 상세·표준', 표: '📋 표', 기타: '📄 기타', 건축: '🏢 건축' }

/** 📐 토공 물량 — 평균단면법(측점 사이 (앞 + 뒤) ÷ 2 × 거리) · 측량 땅 면으로 잰 터파기(확인) · 엑셀 (G139 · 2026-10-05)
 *  소장님: 「이것까지 해야 프로그램이 완성되는거 아니야? 3d」 */
function 토공카드({ 횡단, 땅면 }) {
  const 노선 = 횡단.노선.filter((g) => g.토공 && g.토공.줄.length >= 2)
  const 합 = { 터파기: 0, 되메우기: 0, 구조물: 0, 성토: 0 }
  for (const g of 노선) for (const k of Object.keys(합)) 합[k] += g.토공.합[k] || 0
  const 쉼1 = (n) => (Number(n) || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
  const 빠진 = 노선.flatMap((g) => g.토공.빠진 || [])
  const 받기 = async () => {
    const { 값엑셀받기, 소수칸, 수칸, 굵은칸, 흐린칸 } = await import('../lib/값엑셀.js')
    const 시트 = [{
      name: '총괄',
      head: ['노선', '단면 수', '길이(m)', '터파기(㎥)', '되메우기(㎥)', '구조물(㎥)', '성토(㎥)', '측량 땅 면 터파기(㎥) · 덮음'],
      rows: [
        ...노선.map((g) => [굵은칸(g.파일), 수칸(g.토공.줄.length), 소수칸(g.토공.길이), 소수칸(g.토공.합.터파기), 소수칸(g.토공.합.되메우기), 소수칸(g.토공.합.구조물), 소수칸(g.토공.합.성토),
          흐린칸(g.토공.땅면 && g.토공.땅면.덮음 > 0.05 ? `${쉼1(g.토공.땅면.부피)} · 덮음 ${Math.round(g.토공.땅면.덮음 * 100)}%` : '측량점이 안 덮음')]),
        [굵은칸('합계'), '', '', 소수칸(합.터파기), 소수칸(합.되메우기), 소수칸(합.구조물), 소수칸(합.성토), ''],
      ],
      widths: [30, 8, 10, 12, 12, 12, 10, 24],
    }]
    for (const g of 노선) {
      시트.push({
        name: g.파일.slice(0, 28),
        head: ['측점', '측점(m)', '거리(m)', '터파기(㎡)', '되메우기(㎡)', '구조물(㎡)', '성토(㎡)', '터파기(㎥)', '되메우기(㎥)', '구조물(㎥)', '성토(㎥)', '터파기 누계(㎥)'],
        rows: [
          ...g.토공.줄.map((r) => [r.이름 ? String(r.이름).replace(/\s*\([^)]*m\)$/, '') : '', 소수칸(r.측), 소수칸(r.거리), 소수칸(r.면적.터파기), 소수칸(r.면적.되메우기), 소수칸(r.면적.구조물), 소수칸(r.면적.성토),
            소수칸(r.부피.터파기), 소수칸(r.부피.되메우기), 소수칸(r.부피.구조물), 소수칸(r.부피.성토), 소수칸(r.누계.터파기)]),
          [굵은칸('계'), '', 소수칸(g.토공.길이), '', '', '', '', 소수칸(g.토공.합.터파기), 소수칸(g.토공.합.되메우기), 소수칸(g.토공.합.구조물), 소수칸(g.토공.합.성토), ''],
        ],
        widths: [16, 9, 9, 10, 10, 10, 9, 11, 11, 11, 10, 13],
      })
    }
    값엑셀받기('토공물량_평균단면법', 시트, { 주소: '/tools/dxf3d', 글: '단면 면적은 횡단면도 선(지반선 아래 둘러싸인 곳)으로 잰 값입니다 — 다시 셀 때는 사이트에서' })
    세기('|도면3d|물량')
  }
  return (
    <div className="dx3-bld">
      <div className="dx3-bh">📐 <b>토공 물량 — 평균단면법</b> — 노선 {노선.length}개
        <button type="button" className="chip on" onClick={받기}>📗 엑셀로 받기</button>
      </div>
      <div className="dx3-bsub">
        횡단면도마다 <b>지반선 아래 선으로 둘러싸인 곳</b>을 터파기로, 닫힌 구조물 모양(물길 포함)을 구조물로 재고, 되메우기 = 터파기 − 구조물,
        지반선 위로 둘러싸인 곳은 성토로 쟀습니다(레이어 이름이 아니라 선 모양으로). 측점 사이는 <b>(앞 면적 + 뒤 면적) ÷ 2 × 거리</b>입니다.
        {땅면 && <> 측량점 {땅면.점}개로 만든 <b>측량 땅 면</b>으로 같은 자리 터파기를 다시 재 «확인» 칸에 적었습니다(땅 면이 덮은 곳만).</>}
      </div>
      <div className="dx3-btbl">
        <table className="tbl left">
          <thead><tr><th style={{ minWidth: '9em' }}>노선</th><th>길이</th><th>터파기</th><th>되메우기</th><th>구조물</th><th>성토</th><th style={{ minWidth: '16em' }}>확인(측량 땅 면)</th></tr></thead>
          <tbody>
            {노선.map((g, i) => (
              <tr key={i}>
                <td>{g.파일}{g.자리 && g.자리.how === '곧게' ? <span className="muted"> (곧게 편 노선)</span> : null}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{g.토공.길이.toFixed(0)} m</td>
                <td style={{ whiteSpace: 'nowrap' }}><b>{쉼1(g.토공.합.터파기)}</b> ㎥</td>
                <td style={{ whiteSpace: 'nowrap' }}>{쉼1(g.토공.합.되메우기)} ㎥</td>
                <td style={{ whiteSpace: 'nowrap' }}>{쉼1(g.토공.합.구조물)} ㎥</td>
                <td style={{ whiteSpace: 'nowrap' }}>{쉼1(g.토공.합.성토)} ㎥</td>
                <td className="muted" style={{ fontSize: 12 }}>{g.토공.땅면 && g.토공.땅면.덮음 > 0.05
                  ? `터파기 ${쉼1(g.토공.땅면.부피)} ㎥ — 같은 자리 도면 지반선으로는 ${쉼1(g.토공.땅면.같은곳도면)} ㎥(${g.토공.땅면.같은곳도면 > 0 ? ((g.토공.땅면.부피 / g.토공.땅면.같은곳도면 - 1) * 100).toFixed(0) : '—'}% · 땅 면이 덮은 곳 ${Math.round(g.토공.땅면.덮음 * 100)}%)`
                  : '측량점이 이 노선을 덮지 않음'}</td>
              </tr>
            ))}
            <tr><td><b>합계</b></td><td></td><td style={{ whiteSpace: 'nowrap' }}><b>{쉼1(합.터파기)}</b> ㎥</td><td style={{ whiteSpace: 'nowrap' }}><b>{쉼1(합.되메우기)}</b> ㎥</td><td style={{ whiteSpace: 'nowrap' }}>{쉼1(합.구조물)} ㎥</td><td style={{ whiteSpace: 'nowrap' }}>{쉼1(합.성토)} ㎥</td><td></td></tr>
          </tbody>
        </table>
      </div>
      {빠진.length > 0 && <div className="dx3-warn">⚠️ 면적을 세지 않은 단면 {빠진.length}개(앞뒤 단면으로 이어 셈): {빠진.slice(0, 4).join(' · ')}{빠진.length > 4 ? ' …' : ''}</div>}
      <div className="dx3-skip">⚠️ 도면에 그려진 선으로 잰 값입니다 — 설계 수량산출서의 터파기 기준(여유 폭 · 기울기)과 다르게 그린 도면이면 값이 다를 수 있으니, 제출 전에 산출서와 맞대어 보십시오.</div>
    </div>
  )
}

/** 상태표 «자리» 칸 */
function 자리글({ g }) {
  const z = g.자리 || {}
  /* 🔗 G212 측량 그림 밖으로 멀리 나간 부분(떼어 처음엔 꺼 둠) */
  if (z.기준밖) return <span className="dx3-st ok">✅ 같은 도면의 측량 그림 밖 부분(위치도 · 범례 · 다른 종이) — 처음엔 꺼 둠</span>
  if (z.how === '기준') {
    if (z.안이어짐) return <span className="dx3-st no">⭐ 측량 기준 — ⚠️ 같은 이름을 가진 도면이 없어 아직 안 이어짐</span>
    return <span className="dx3-st ok">⭐ 기준{z.둘째 ? ' (도면끼리)' : g.종류 === '측량' || g.종류 === '측량점' ? ' — 측량 좌표' : ' — 측량 자료 없음(실제 좌표 아님)'}</span>
  }
  if (z.how === '글자') return <span className={'dx3-st ' + (z.max > 1.5 ? 'warn' : 'ok')}>✅ 같은 글자 {z.n}쌍 · 평균 {z.rms.toFixed(2)} m · 최대 {z.max.toFixed(2)} m · 돌림 {z.회전.toFixed(2)}°{Math.abs(z.축척 - 1) > 0.01 ? ` · 축척 ×${z.축척.toFixed(3)}` : ''}</span>
  if (z.how === '좌표') return <span className="dx3-st ok">✅ 좌표 그대로(기준과 같은 자리){z.n ? ` · 같은 글자 ${z.n}쌍 확인` : ''}{z.같은좌표계 ? ' · 기준 범위 밖까지 뻗은 같은 측량 좌표' : ''}</span>
  /* 🔗 G212 — 캐드에서 xref 를 끼운 자리 그대로(lib/xref3d.js) */
  if (z.how === '끼움') return <span className="dx3-st ok" title={(z.길 || []).join(' → ')}>✅ 캐드에서 끼운 자리 그대로(xref){z.그림 ? ` · «${z.그림}» 안의 그림` : ''}{Math.abs(z.회전 || 0) > 0.01 ? ` · 돌림 ${z.회전.toFixed(2)}°` : ''}</span>
  /* 🧲 G209 — 건물 · 구조물 · 평면을 측량 도면에 그려진 같은 모양 자리에 겹침(lib/겹치기3d.js) */
  if (z.how === '모양') return <span className={'dx3-st ' + (z.몫 >= 0.65 ? 'ok' : 'warn')}>✅ 측량 도면의 같은 모양 자리에 겹침{z.그림 ? ` · «${z.그림}» 안의 그림` : ''} · 겹친 몫 {Math.round(z.몫 * 100)}% · 돌림 {z.회전.toFixed(2)}°{z.높이 ? ` · ${z.높이}` : ''}</span>
  if (z.how === '옆') return <span className="dx3-st no">⚠️ 옆에 둠 — {z.까닭 || '맞출 글자를 못 찾음'}</span>
  if (z.how === '노선') return <span className="dx3-st ok" title={z.노선}>✅ {z.노선수 > 1 ? `평면 노선 ${z.노선수}개` : `평면 노선 «${z.노선}»`} 따라 세움 · 측점 글자 {z.n}개{z.근거 === '측점 글자' ? ' · 중심선 없음(몇 m 어긋날 수 있음)' : ''}{z.줄 ? ` · 종단 표 ${z.줄}줄` : ''}{z.확인 ? ` · 횡단 지반고와 차이 ${z.확인.가운데.toFixed(2)} m` : ''}</span>
  if (z.how === '곧게') return <span className="dx3-st no">⚠️ 곧게 펴 옆에 둠 — {z.까닭}</span>
  if (z.how === '땅면') return <span className="dx3-st ok">✅ 측량점 {z.점}개를 삼각형 {z.삼각}개로 이음(점 사이 {Math.round(z.최대변)} m 넘는 곳은 안 이음)</span>
  return <span className="muted">{g.설명}</span>
}

/** 📌 꼭 넣을 자료 — 소장님: 「좌표측량성과표하고, 평면도는 항상 필요하다는 걸 알려야 하지 않을까?」
 *  「평면도에도 좌표가 안입혀져 있어. 대부분 그래, 그래서 좌표가 있는 측량도면을 측량성과표 도면을 꼭 넣어달라고 해야 하지 않아.」
 *  세우기 전에는 안내만, 세운 뒤에는 ✓ / ✗ 와 «없으면 무엇이 짐작인지» 를 적습니다. */
function 꼭넣을자료({ 필요, 성과, 결과 }) {
  const 측 = 필요 ? 필요.측량 : (성과 ? { 있음: true, 종류: '성과표', 이름: 성과.파일, 점: 성과.점.length } : null)
  const 평 = 필요 ? 필요.평면 : null
  return (
    <div className="dx3-need">
      <div className="h">📌 꼭 넣을 자료 <span className="muted">— 없으면 자리·높이가 «짐작» 이 됩니다</span></div>
      <ol>
        <li className={측 ? (측.있음 ? 'ok' : 'no') : ''}>
          <b>① 측량 자료</b> — <b>좌표측량성과표</b>(엑셀·CSV·TXT: 점번호·X·Y·Z) 또는 <b>좌표가 든 측량도면</b>(GPS·현황측량 DXF·DWG)
          <div className="d">실제 자리와 땅 높이의 기준입니다. 계획평면도는 대부분 좌표가 안 입혀져 있어, 측량 자료가 있어야 실제 자리에 섭니다.</div>
          {측 && (측.있음
            ? <div className="st">✓ {측.종류 === '성과표' ? `측량성과표 «${측.이름}» — 측량점 ${측.점}개` : `측량도면 «${측.이름}»`}{측.이어짐 === false ? ' · ⚠️ 도면과 같은 이름(점번호 · 기준점)을 못 찾아 아직 안 이어짐 — 📍 두 점 찍기로 맞추세요' : ''}</div>
            : <div className="st">✗ 없음 — 지금은 도면끼리만 맞춰 세웠습니다(<b>실제 좌표 아님</b>). 넣으면 실제 자리·높이로 바뀝니다.</div>)}
        </li>
        <li className={평 ? (평.있음 ? 'ok' : 'no') : ''}>
          <b>② 계획평면도</b> — 무엇을 어디에 짓는지
          <div className="d">종평면도 · 다른 평면 박스는 이 평면도(측점 · 지번 · 기준점 글자)에 붙여 자리를 잡고, 횡단 · 종단은 이 평면도의 <b>측점(NO.) · 중심선</b>을 따라 섭니다.</div>
          {평 && (평.있음
            ? <div className="st">✓ «{평.이름}»{평.자리 === '글자' ? ' — 같은 글자로 맞춤' : 평.자리 === '좌표' ? ' — 좌표가 기준과 같은 자리' : 평.자리 === '기준' ? ' — 자리의 기준' : 평.자리 === '옆' ? ' — ⚠️ 자리를 못 찾음(📍 두 점 찍기)' : ''}</div>
            : <div className="st">✗ 없음 — 자리를 맞출 평면이 없습니다.</div>)}
        </li>
      </ol>
      {더할것(결과).length > 0 ? (
        <div className="more add">
          <b>➕ 이것을 더 넣으면 더 잘 섭니다</b>
          <ul>{더할것(결과).map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      ) : (
        <div className="more">있으면 더 좋은 것: <b>종단면도 · 횡단면도</b>(높이) · <b>구조도</b>(구조물) · <b>건축 평면도 + 입면도</b>(건물)</div>
      )}
      {결과 && 결과.그룹 && 결과.그룹.some((g) => !g.켬) && (
        <div className="more">도면을 한꺼번에 넣으셔도 됩니다 — 3D 에 안 쓰는 박스(상세 · 표준 · 표 · 종단 표 · 꺼 둔 수치지도)는 알아서 꺼 두었고, 아래 표의 «처음엔 꺼 둔 것» 에서 켤 수 있습니다.</div>
      )}
    </div>
  )
}

/** 세운 결과를 보고 «무엇을 더 넣으면 서는지» — 소장님: 「3d가 서지 않으면 무슨 도면을 넣으라고 알려주면 더 좋고」 */
function 더할것(결과) {
  if (!결과) return []
  const 필 = 결과.필요 || {}, 그 = 결과.그룹 || []
  const 이름 = (g) => g.제목 || g.파일.join(' · ')
  const 줄 = []
  if (필.측량 && !필.측량.있음) 줄.push(<><b>측량성과표</b>(엑셀·CSV — 점번호·X·Y·Z) 또는 <b>GPS·현황 측량도면</b> → 실제 좌표·땅 높이로 섭니다</>)
  if (필.측량 && 필.측량.있음 && 필.측량.이어짐 === false) 줄.push(<>측량 자료와 도면을 이을 <b>같은 이름</b>(측량점 번호 · TBM · 도근점)이 적힌 평면도 — 없으면 평면도를 <b>📍 두 점 찍기</b>로 측량점에 맞추십시오</>)
  if (필.평면 && !필.평면.있음) 줄.push(<><b>계획평면도</b>(지번 · 측점 NO. · 기준점 글자가 있는 것) → 다른 박스들이 붙을 자리</>)
  if (필 && 필.높이 === false) 줄.push(<><b>횡단면도 · 종단면도</b>(측점 · 지반고 표가 있는 것) 또는 <b>표고가 든 측량성과표</b> → 땅 높이가 서고, 지금은 평평합니다</>)
  if (결과.건물 && 결과.건물.실패) 줄.push(결과.건물.평면수 < 2
    ? <>건물: <b>층별 평면도</b>(「지상 2층 평면도」 같은 제목이 둘 이상)</>
    : <>건물: 층 높이가 적힌 <b>입면도 · 단면도 · 골구도</b>(「지상 2층 · GL +5,200」 같은 글자)</>)
  const 횡못 = 그.filter((g) => g.종류 === '횡단못')
  if (횡못.length) 줄.push(<>횡단면도 {횡못.length}장(«{이름(횡못[0])}»{횡못.length > 1 ? ' 등' : ''})의 측점 표를 못 읽었습니다 — 표에 <b>측점(NO.) · 지반고</b> 글자가 있는 횡단면도면 섭니다</>)
  const 곧은 = ((결과.횡단 && 결과.횡단.노선) || []).filter((g) => g.자리 && g.자리.how === '곧게')
  if (곧은.length) 줄.push(<>횡단 노선 {곧은.length}개(«{곧은[0].파일}»{곧은.length > 1 ? ' 등' : ''})가 곧게 펴져 있습니다 — 같은 이름의 <b>계획평면도 · 종평면도</b>(측점 NO. 글자와 중심선이 있는 것)를 넣으면 노선을 따라 섭니다</>)
  /* 🔗 G212 — 자리를 못 찾은 도면이 끼워 쓴 xref 중 안 올린 것(같이 넣으면 캐드에서 끼운 자리 그대로) */
  if (필 && 필.xref && 필.xref.length) 줄.push(<>이 도면들이 끼워 쓴 xref <b>«{필.xref.slice(0, 3).join('» · «')}»</b>{필.xref.length > 3 ? ` 등 ${필.xref.length}개` : ''} — 그 파일도 같이 넣으면 <b>캐드에서 끼운 자리 그대로</b> 겹칩니다</>)
  const 옆 = 그.filter((g) => g.자리 && g.자리.how === '옆' && g.종류 !== '밖')   // 도곽 밖(꺼 둔 수치지도)은 빼고
  if (옆.length) 줄.push(<>자리를 못 찾은 도면 {옆.length}장(«{이름(옆[0])}»{옆.length > 1 ? ' 등' : ''}) — 같은 <b>지번 · 측점 · 기준점</b>이 적힌 계획평면도나, 그 건물 · 구조물이 <b>같은 모양으로 그려진</b> 측량도면 · 계획평면도를 넣거나, 표에서 <b>📍 두 점 찍기</b></>)
  return 줄
}

/* 켠 층들의 자리 — 점 수로 무게를 달아 1~99% (구석의 튀는 점 몇 개에 화면이 끌려가지 않게) */
function 자리(layers, 켬, 그룹 = null) { return fitBox(layers, 켬, 그룹) }
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
  if (k === 'webgl-lost') return <>그래픽 메모리가 모자라 3D 화면이 꺼졌습니다. 도면 몇 장을 <b>✕</b> 로 빼거나(꺼 둔 수치지도가 큰 도면부터), 다른 창·탭을 닫고 다시 올려 주십시오.</>
  if (k === 'sur') return <>측량성과표에서 <b>점번호 · X · Y</b> 칸을 찾지 못했습니다{more ? <span className="muted"> ({more})</span> : null}. 첫 줄에 «점명 · X · Y · Z(표고)» 머리가 있는 엑셀·CSV 로 넣어 주십시오.</>
  return <>도면을 읽다가 멈췄습니다. {more ? <span className="muted">({more})</span> : null} 다른 판(2013·2018)의 DXF 로 저장해 다시 놓아 주십시오.</>
}
