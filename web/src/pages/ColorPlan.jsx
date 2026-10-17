/**
 * 🎨 /tools/colorplan — 컬러 평면도 · 🚪 피난 안내도 (2026-10-17)
 *
 * 소장님: 「컬러 평면도 …」 「크몽보다 좋아야 해. 반드시, 대충만들지마」 「모든 도구는 사이트 내에서 사용가능하게」
 *         「오늘 만든 도구 및 서류는 나만 이용하게 해줘 … 예시만 보게 해줘. 이용자는」
 *         「현제 조회수는 그대로 유지 해. 새로운 도구나 소식들도 같은 방식으로 조회수 넣어주고」 → 시공계획서 · 중처법과 같은 셈:
 *         🧪 예시 본 수(|컬러평면|예시 — 잠금 상자에 보임) · 잠긴 단추(|컬러평면|잠금) · 받기(|컬러평면|PDF · PNG · DXF) · 열쇠 · 내 도면(|컬러평면|도면) — 소장님 · 로봇은 안 셈.
 *         화면 조회수(👁)는 다른 화면처럼 위 줄(애널리틱스).
 * ■ 도면(DXF · DWG)을 넣으면 방을 저절로 찾아(lib/컬러평면.js) 칠하고(lib/컬러평면장면.js), 비상구까지 길을 찾아 구획된 실마다 피난안내도 한 장씩.
 *   화면 · PNG = 캔버스(lib/장면그림.js) · PDF = 같은 도형(벡터 · 진짜 글자) · DXF = 같은 좌표에 색 층(lib/컬러평면dxf.js).
 * ■ 🔒 씀 = 소장님 브라우저(lib/운영자.js) · 열쇠말(lib/gate.js) — 시공계획서 · 중처법과 같은 방식.
 *   그 밖의 분은 🧪 예시 도면 둘(가상 84㎡형 집 · 가상 3층 학원)로 화면을 넘겨 보고 색 · 길을 바꿔 볼 수 있고, 내 도면 넣기 · 받기는 잠김.
 * ■ 도면은 이 브라우저 안에서만 읽습니다(일꾼 — 도면판.jsx 도면읽어오기).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'
import { Row } from '../tools/calcs.jsx'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import { 도면읽어오기, 오류글, 큰파일 } from '../도면판.jsx'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 단위배율 } from '../lib/골조도면.js'
import * as C from '../lib/컬러평면.js'
import { 컬러장면, 피난장면, 기준점검, 모델점, 종이들, 평 } from '../lib/컬러평면장면.js'
import { 장면캔버스 } from '../lib/장면그림.js'

const 예시들 = {
  apt: { 이름: '🏠 84㎡형 집(가상)', 파일: '/tools/files/ex-colorplan-apt.dxf', 탭: 'color', 업소: '예시 집', 층: '' },
  academy: { 이름: '🏫 3층 학원(가상 · 480㎡)', 파일: '/tools/files/ex-colorplan-academy.dxf', 탭: 'evac', 업소: '예시학원', 층: '3층' },
}
const 장비단추 = [['소화기', '🧯 소화기'], ['소화전', '🚒 옥내소화전'], ['발신기', '🔔 발신기'], ['완강기', '🪢 완강기']]
const 쪽기본용도 = new Set(['영업', '업무', '거실', '침실', '주방'])
const 숨 = () => new Promise((r) => setTimeout(r, 30))
const 오늘 = () => { const d = new Date(); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.` }
function 저장하기(이름, 바이트, 타입) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(바이트 instanceof Blob ? 바이트 : new Blob([바이트], { type: 타입 }))
  a.href = url; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
const 파일말 = (s) => String(s || '평면도').replace(/[\\/:*?"<>|]+/g, ' ').trim().replace(/\s+/g, '_').slice(0, 50) || '평면도'
const 읽은설정 = () => { try { return JSON.parse(localStorage.getItem('kcm.colorplan.v1') || '{}') || {} } catch (e) { return {} } }

/* ───────────────────────────── 미리보기(캔버스 · 확대 · 끌어 옮기기 · 누르기) */
function 미리보기({ 장면, 고른방, on누름, 누름말 }) {
  const 틀 = useRef(null), 판 = useRef(null)
  const [폭, set폭] = useState(800)
  const [보기, set보기] = useState({ z: 1, tx: 0, ty: 0 })
  const [글꼴, set글꼴] = useState(0)
  const 끌기 = useRef(null)
  useEffect(() => { import('../lib/plotview.js').then((m) => m.loadFont()).then(() => set글꼴((x) => x + 1)).catch(() => {}) }, [])
  useEffect(() => {
    const el = 틀.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => set폭(Math.max(280, el.clientWidth)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => { set보기({ z: 1, tx: 0, ty: 0 }) }, [장면 && 장면.폭, 장면 && 장면.높이])   // eslint-disable-line react-hooks/exhaustive-deps
  const 높 = 장면 ? Math.round((폭 * 장면.높이) / 장면.폭) : 300
  const 맞배 = 장면 ? 폭 / 장면.폭 : 1
  useEffect(() => {
    const cv = 판.current
    if (!cv || !장면) return
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    cv.width = Math.round(폭 * dpr); cv.height = Math.round(높 * dpr)
    const ctx = cv.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#eef0f3'; ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.setTransform(dpr, 0, 0, dpr, 보기.tx * dpr, 보기.ty * dpr)
    장면캔버스(ctx, 장면, 맞배 * 보기.z)
    if (고른방 !== null && 고른방 !== undefined) {
      const g = 장면.그림들.find((x) => x.t === '면' && x.방 === 고른방)
      if (g) {
        const b = 맞배 * 보기.z
        ctx.beginPath()
        for (const r of g.고리들) { ctx.moveTo(r[0][0] * b, r[0][1] * b); for (let i = 1; i < r.length; i++) ctx.lineTo(r[i][0] * b, r[i][1] * b); ctx.closePath() }
        ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([])
      }
    }
  }, [장면, 폭, 높, 보기, 고른방, 맞배, 글꼴])
  const 확대 = (f, cx = 폭 / 2, cy = 높 / 2) => set보기((v) => {
    const z = Math.max(1, Math.min(12, v.z * f))
    const k = z / v.z
    return z === 1 ? { z: 1, tx: 0, ty: 0 } : { z, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k }
  })
  useEffect(() => {
    const cv = 판.current
    if (!cv) return undefined
    const 휠 = (e) => { if (!e.ctrlKey && 보기.z === 1 && e.deltaY > 0) return; e.preventDefault(); const r = cv.getBoundingClientRect(); 확대(e.deltaY < 0 ? 1.25 : 0.8, e.clientX - r.left, e.clientY - r.top) }
    cv.addEventListener('wheel', 휠, { passive: false })
    return () => cv.removeEventListener('wheel', 휠)
  })
  const 아래 = (e) => { const r = 판.current.getBoundingClientRect(); 끌기.current = { x: e.clientX, y: e.clientY, tx: 보기.tx, ty: 보기.ty, 움: false, r } ; try { 판.current.setPointerCapture(e.pointerId) } catch (er) { /* */ } }
  const 움직 = (e) => {
    const d = 끌기.current
    if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (!d.움 && Math.hypot(dx, dy) > 5) d.움 = true
    if (d.움 && 보기.z > 1) set보기((v) => ({ ...v, tx: d.tx + dx, ty: d.ty + dy }))
  }
  const 위 = (e) => {
    const d = 끌기.current
    끌기.current = null
    if (!d || d.움 || !장면 || !on누름) return
    const px = (e.clientX - d.r.left - 보기.tx) / (맞배 * 보기.z), py = (e.clientY - d.r.top - 보기.ty) / (맞배 * 보기.z)
    on누름(px, py)
  }
  return (
    <div ref={틀} className="cpl-view">
      <div className="cpl-zoom">
        <button type="button" onClick={() => 확대(1.4)} aria-label="크게">＋</button>
        <button type="button" onClick={() => 확대(1 / 1.4)} aria-label="작게">－</button>
        <button type="button" onClick={() => set보기({ z: 1, tx: 0, ty: 0 })} aria-label="한 장 다 보기">⤢</button>
      </div>
      {누름말 && <div className="cpl-hint">{누름말}</div>}
      <canvas ref={판} style={{ width: 폭, height: 높, cursor: 누름말 ? 'crosshair' : 보기.z > 1 ? 'grab' : 'pointer', touchAction: 보기.z > 1 ? 'none' : 'pan-y' }}
        onPointerDown={아래} onPointerMove={움직} onPointerUp={위} onPointerCancel={() => { 끌기.current = null }} />
    </div>
  )
}

export default function ColorPlan() {
  /* 🔒 씀 */
  const [씀, set씀] = useState(() => isOpen())
  const [잠금말, set잠금말] = useState('')
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  useEffect(() => { document.title = '컬러 평면도 · 피난 안내도 — 도면을 넣으면 방 색 · 면적 · 비상구 길까지 | K-건설맵' }, [])
  const 잠김 = (무엇) => { set잠금말(`🔒 ${무엇} 지금 준비 중입니다 — 🧪 예시 도면으로 어떻게 나오는지 보실 수 있습니다.`); 세기('|컬러평면|잠금') }

  /* 도면 */
  const [도면, set도면] = useState(null)          /* { 모델, k, 판들, 이름, 예시 } */
  const [판번호, set판번호] = useState(0)
  const [진행, set진행] = useState('')
  const [오류, set오류] = useState('')
  const 파일칸 = useRef(null)
  const 열기 = useCallback(async (buf, 이름, 예시 = null) => {
    set오류(''); set진행('도면 읽는 중…'); await 숨()
    try {
      const { 모델 } = await 도면읽어오기(buf, 이름, (s) => set진행(`${s.msg} ${s.p ? Math.round(s.p * 100) + '%' : ''}`))
      const k = 단위배율(모델.units, 모델.box, 모델.ox, 모델.oy).k
      set진행('방 찾는 중…'); await 숨()
      const 판들 = C.판들찾기(모델, k)
      if (!판들.length) throw new Error('실 이름(거실 · 침실 · 사무실 · 강의실 …) 글자를 찾지 못했습니다 — 실 이름이 적힌 평면도를 넣어 주십시오')
      set도면({ 모델, k, 판들, 이름, 예시 })
      set판번호(0)
    } catch (e) {
      set오류(e && e.kind ? 오류글(e.kind, e.message) : (e && e.message) || String(e))
    } finally { set진행('') }
  }, [])
  const 예시열기 = async (키) => {
    const x = 예시들[키]
    set잠금말('')
    if (!씀) 세기('|컬러평면|예시')
    try {
      set진행('예시 도면 받는 중…')
      const r = await fetch(x.파일)
      if (!r.ok) throw new Error('예시 도면을 받지 못했습니다')
      const buf = await r.arrayBuffer()
      set탭(x.탭)
      set피({ ...피, 업소: x.업소, 층: x.층, 연락처: 피.연락처 || '' })
      await 열기(buf, x.파일.split('/').pop(), 키)
    } catch (e) { set오류(e.message || String(e)); set진행('') }
  }
  const 파일받기 = async (files) => {
    const f = files && files[0]
    if (!f) return
    if (!씀) { 잠김('내 도면 넣기는'); return }
    if (f.size > 큰파일) { set오류(오류글('big')); return }
    await 열기(await f.arrayBuffer(), f.name, null)
    세기('|컬러평면|도면')
  }

  /* 판 읽기 */
  const [D, setD] = useState(null)
  useEffect(() => {
    if (!도면) { setD(null); return undefined }
    let 살 = true
    set진행('방 찾는 중…')
    const t = setTimeout(() => {
      try { const d = C.판읽기(도면.모델, 도면.k, 도면.판들[판번호] || 도면.판들[0]); if (살) setD(d) } catch (e) { if (살) set오류('방을 찾다 멈췄습니다 — ' + (e.message || e)) } finally { if (살) set진행('') }
    }, 30)
    return () => { 살 = false; clearTimeout(t) }
  }, [도면, 판번호])

  /* 설정 */
  const 저장된 = useMemo(읽은설정, [])
  const [탭, set탭] = useState('color')
  const [색, set색] = useState({ 색판: 저장된.색판 || '부드럽게', 무늬: true, 면적: '㎡평', 이름: true, 가구: true, 기타선: true, 벽채움: true, 종이: 'A3', 방향: '가로', 제목: '', 부제: '', 방위: 0, 축척: 0, 면적기준: '안목', 표: true, 범례: true })
  const [방바꿈, set방바꿈] = useState({})
  const [고른방, set고른방] = useState(null)
  const [피, set피] = useState({ 업소: 저장된.업소 || '', 층: '', 연락처: 저장된.연락처 || '', 작성일: 오늘(), 종이: '자동', 모든길: true, 다른길: true, 가구: false, 방위: 0 })
  useEffect(() => { try { localStorage.setItem('kcm.colorplan.v1', JSON.stringify({ 색판: 색.색판, 업소: 도면 && 도면.예시 ? 저장된.업소 : 피.업소, 연락처: 피.연락처 })) } catch (e) { /* */ } }, [색.색판, 피.업소, 피.연락처])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { set방바꿈({}); set고른방(null); set출구켬({}); set더출구([]); set장비뺌(new Set()); set더장비([]); set손쪽([]); set쪽고름(null); set쪽번(0) }, [D])

  /* 피난 — 출구 · 설비 · 길 */
  const [출구켬, set출구켬] = useState({})
  const [더출구, set더출구] = useState([])
  const [장비뺌, set장비뺌] = useState(() => new Set())
  const [더장비, set더장비] = useState([])
  const [누름, set누름] = useState('')
  const 출구들 = useMemo(() => (D ? [...D.출구들.map((x, i) => ({ ...x, 켬: 출구켬[i] ?? x.켬, _i: i })), ...더출구] : []), [D, 출구켬, 더출구])
  const 장비들 = useMemo(() => (D ? [...D.장비들.filter((_, i) => !장비뺌.has(i)).map((e) => e), ...더장비] : []), [D, 장비뺌, 더장비])
  const G = useMemo(() => (D && 탭 === 'evac' && 도면 ? C.피난준비(도면.모델, 도면.k, D) : null), [D, 탭, 도면])
  const 장캐시 = useMemo(() => new Map(), [G])
  const 길 = useMemo(() => {
    if (!G || !D) return null
    try { return C.피난길들(G, D, 출구들, D.방들.map((R) => R.번호), 장캐시) } catch (e) { return null }
  }, [G, D, 출구들, 장캐시])

  /* 피난 쪽들 — 전체 + 구획된 실마다 + 손으로 찍은 현위치 */
  const [쪽고름, set쪽고름] = useState(null)        /* Set(방번호) | null(기본) */
  const [손쪽, set손쪽] = useState([])               /* [{ 이름, 점 }] */
  const 기본쪽 = useMemo(() => {
    if (!D) return new Set()
    const s = new Set(D.방들.filter((R) => !R.이름없음 && 쪽기본용도.has(R.용도)).map((R) => R.번호))
    if (!s.size) D.방들.filter((R) => !R.이름없음 && R.용도 !== '코어').forEach((R) => s.add(R.번호))
    return s
  }, [D])
  const 쪽방 = 쪽고름 || 기본쪽
  const [전체쪽, set전체쪽] = useState(true)
  const 쪽목록 = useMemo(() => {
    if (!D) return []
    const l = []
    if (전체쪽) l.push({ 이름: '전체 피난 경로', 현위치방: null })
    for (const R of D.방들) if (쪽방.has(R.번호)) l.push({ 이름: R.이름, 현위치방: R.번호 })
    for (const p of 손쪽) l.push({ 이름: p.이름, 현위치방: null, 현위치점: p.점, 손: true })
    return l
  }, [D, 쪽방, 손쪽, 전체쪽])
  const [쪽번, set쪽번] = useState(0)
  useEffect(() => { if (쪽번 >= 쪽목록.length) set쪽번(Math.max(0, 쪽목록.length - 1)) }, [쪽목록.length])   // eslint-disable-line react-hooks/exhaustive-deps

  const 색설정 = useMemo(() => ({ ...색, 방바꿈, 날짜: 오늘() }), [색, 방바꿈])
  const 피설정 = useMemo(() => ({ ...피, 장비들, 출구들, 방바꿈 }), [피, 장비들, 출구들, 방바꿈])
  const 쪽장면 = useCallback((쪽) => {
    if (!D) return null
    const 내길 = 쪽.현위치점 && 길 ? 길.점길(쪽.현위치점[0], 쪽.현위치점[1]) : null
    return 피난장면(D, 길, { ...쪽, 내길 }, 피설정)
  }, [D, 길, 피설정])
  const 장면 = useMemo(() => {
    if (!D) return null
    try {
      if (탭 === 'color') return 컬러장면(D, 색설정)
      const 쪽 = 쪽목록[쪽번] || 쪽목록[0] || { 현위치방: null }
      return 쪽장면(쪽)
    } catch (e) { console.error(e); return null }
  }, [D, 탭, 색설정, 쪽목록, 쪽번, 쪽장면])
  const 점검 = useMemo(() => (D && 탭 === 'evac' ? 기준점검(D, 길, 피설정) : []), [D, 탭, 길, 피설정])

  /* 누르기 */
  const 누름말 = 누름 === '출구' ? '비상구 · 출입구 자리를 누르십시오' : 누름 === '현위치' ? '안내도를 붙일 자리(현위치)를 누르십시오' : 누름 === '지우기' ? '지울 설비 · 출구를 누르십시오' : 누름 ? `${C.장비이름[누름]} 자리를 누르십시오` : ''
  const 눌렀다 = (px, py) => {
    if (!장면 || !D) return
    const [x, y] = 모델점(장면.변환, px, py)
    if (!누름) {
      const R = D.방들.find((r) => x >= r.상자[0] && x <= r.상자[2] && y >= r.상자[1] && y <= r.상자[3] && C.고리들안(r.고리들, x, y))
      set고른방(R ? R.번호 : null)
      if (R) setTimeout(() => { const el = document.getElementById('cpl-room-' + R.번호); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, 30)
      return
    }
    if (!씀 && !(도면 && 도면.예시)) return
    const 곁 = 1200 / D.k
    if (누름 === '출구') set더출구((l) => [...l, { 종류: '손', 이름: '비상구', x, y, 켬: true }])
    else if (누름 === '현위치') set손쪽((l) => [...l, { 이름: `현위치 ${l.length + 1}`, 점: [x, y] }])
    else if (누름 === '지우기') {
      /* 누른 곳에서 가장 가까운 것 하나(설비 · 찍은 출구 · 찾은 출구 · 찍은 현위치) */
      const 후보 = []
      D.장비들.forEach((e, n) => { if (!장비뺌.has(n)) 후보.push([Math.hypot(e.x - x, e.y - y), () => set장비뺌((s) => new Set([...s, n]))]) })
      더장비.forEach((e, n) => 후보.push([Math.hypot(e.x - x, e.y - y), () => set더장비((l) => l.filter((_, m) => m !== n))]))
      더출구.forEach((e, n) => 후보.push([Math.hypot(e.x - x, e.y - y), () => set더출구((l) => l.filter((_, m) => m !== n))]))
      D.출구들.forEach((e, n) => { if ((출구켬[n] ?? e.켬) !== false) 후보.push([Math.hypot(e.x - x, e.y - y), () => set출구켬((m) => ({ ...m, [n]: false }))]) })
      손쪽.forEach((e, n) => 후보.push([Math.hypot(e.점[0] - x, e.점[1] - y), () => set손쪽((l) => l.filter((_, m) => m !== n))]))
      후보.sort((a2, b2) => a2[0] - b2[0])
      if (후보.length && 후보[0][0] < 곁) 후보[0][1]()
    } else set더장비((l) => [...l, { 종류: 누름, x, y }])
  }

  /* 받기 */
  const [내림, set내림] = useState('')
  const 받기 = async (꼴) => {
    if (!씀) { 잠김(`${꼴} 받기는`); return }
    if (!장면 || !D) return
    set내림(꼴); set오류(''); await 숨()
    try {
      const 이름 = 파일말((탭 === 'color' ? (색.제목 || D.제목 || '평면도') + '_컬러' : (피.업소 || D.제목 || '피난안내도') + '_피난안내도'))
      if (꼴 === 'PDF') {
        const { 장면들PDF } = await import('../lib/장면그림.js')
        const 들 = 탭 === 'color' ? [장면] : 쪽목록.map((쪽) => 쪽장면(쪽)).filter(Boolean)
        저장하기(이름 + '.pdf', await 장면들PDF(들, { 제목: 이름 }), 'application/pdf')
      } else if (꼴 === 'PNG') {
        const { 장면PNG } = await import('../lib/장면그림.js')
        const r = await 장면PNG(장면, 300)
        저장하기(이름 + (탭 === 'evac' && 쪽목록[쪽번] ? '_' + 파일말(쪽목록[쪽번].이름) : '') + '.png', r.blob, 'image/png')
      } else {
        const { DXF만들기 } = await import('../lib/컬러평면dxf.js')
        let 피난 = null
        if (탭 === 'evac' && 길) {
          const 쪽 = 쪽목록[쪽번] || { 현위치방: null }
          const 내길 = 쪽.현위치점 ? 길.점길(쪽.현위치점[0], 쪽.현위치점[1]) : 쪽.현위치방 !== null ? 길.길들.get(쪽.현위치방) : null
          피난 = { 나무: 피.모든길 !== false ? 길.나무(쪽.현위치방 ?? -1, 내길 && 내길.첫 ? 내길.첫.칸들 : null) : [], 첫: 내길 && 내길.첫, 둘: 피.다른길 !== false && 내길 ? 내길.둘 : null,
            출구들, 장비들, 현위치: 쪽.현위치점 || (쪽.현위치방 !== null ? D.방들[쪽.현위치방].라벨 : null) }
        }
        const t = DXF만들기(D, 도면.모델, { ...(탭 === 'color' ? 색설정 : { 벽채움: true, 무늬: false, 이름: true, 면적: '', 방바꿈 }), 축척: 장면.축척, 피난, 색판: 탭 === 'color' ? 색.색판 : '부드럽게' })
        저장하기(이름 + '.dxf', new TextEncoder().encode(t), 'application/dxf')
      }
      세기('|컬러평면|' + 꼴)
    } catch (e) { set오류(`${꼴} 만들기 실패 — ${e?.message || e}`) } finally { set내림('') }
  }

  const 방줄 = D ? D.방들.filter((R) => !R.이름없음 || (방바꿈[R.번호] && 방바꿈[R.번호].이름)) : []
  const 바꾸기 = (번, k, v) => set방바꿈((m) => ({ ...m, [번]: { ...(m[번] || {}), [k]: v } }))
  const 판색 = C.색판들[색.색판] || C.색판들.부드럽게
  const 안합 = D ? D.방들.filter((R) => !R.이름없음 && R.용도 !== '발코니').reduce((s, R) => s + R.면적, 0) : 0
  const 예시중 = !!(도면 && 도면.예시)

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🎨 컬러 평면도 · 🚪 피난 안내도</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          평면도(<b>DXF · DWG</b>)를 넣으면 <b>방을 저절로 찾아</b> 용도별 색 · 바닥 무늬 · 실 이름 · 면적(㎡ · 평)을 칠하고,
          <b> 비상구까지 가는 길을 저절로 찾아</b> 구획된 실마다 피난안내도를 한 장씩 만듭니다 — 현위치 · 가까운 출구 · 다른 대피 경로 · 소화기 · 옥내소화전 · 사용법 · 대처방법(한글 + 영어).
        </p>
        <p className="muted" style={{ margin: 0 }}>
          받는 꼴: <b>PDF</b>(벡터 · 글자 그대로) · <b>PNG</b>(300 dpi) · <b>DXF</b>(원래 도면과 같은 자리에 색 층 — 캐드에서 고쳐 쓰기). 도면은 이 브라우저 안에서만 읽습니다 — 어디에도 올라가지 않습니다.
          피난안내도는 「다중이용업소의 안전관리에 관한 특별법 시행규칙」 [별표 2의2] 를 맞춰 봅니다.
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 지금은 준비 중입니다</b> — 내 도면 넣기 · 받기는 곧 엽니다. 지금은 🧪 예시 도면으로 어떻게 나오는지 보실 수 있습니다(색 · 무늬 · 현위치 · 길도 바꿔 보기).
            {' '}<예시본수 열쇠="|컬러평면|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set잠금말(''); 세기('|컬러평면|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
          </div>
        )}
        <div className="cpl-open">
          {Object.entries(예시들).map(([키, x]) => (
            <button key={키} type="button" className={'btn line sm' + (도면 && 도면.예시 === 키 ? ' on' : '')} style={{ width: 'auto' }} onClick={() => 예시열기(키)}>🧪 {x.이름}</button>
          ))}
          <button type="button" className={'btn sm' + (씀 ? '' : ' sg-lockbtn')} style={{ width: 'auto' }} onClick={() => (씀 ? 파일칸.current && 파일칸.current.click() : 잠김('내 도면 넣기는'))}>
            {씀 ? '📂 내 평면도 넣기 (DXF · DWG)' : '🔒 내 평면도 넣기'}
          </button>
          <input ref={파일칸} type="file" accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1} onChange={(e) => { 파일받기(e.target.files); e.target.value = '' }} />
        </div>
        {씀 && <끌어놓기판 글="평면도(DXF · DWG)를 놓으면 열립니다" 받기={(fs) => 파일받기(fs)} />}
        {잠금말 && <div className="cwarn" style={{ marginTop: 8 }}>{잠금말}</div>}
        {진행 && <div className="muted" style={{ marginTop: 8 }}>⏳ {진행}</div>}
        {오류 && <div className="cwarn" style={{ marginTop: 8 }}>{오류}</div>}
      </div>

      {!도면 && !진행 && (
        <div className="card cpl-empty">
          <b>🧪 예시부터 보십시오</b> — 위 «84㎡형 집» 은 컬러 평면도, «3층 학원» 은 피난 안내도(실마다 한 장)로 열립니다. 두 도면 모두 K-건설맵이 그린 <b>가상 도면</b>입니다.
          <ul className="flist" style={{ marginTop: 8 }}>
            <li>방은 벽 · 창 · 문 선으로 둘러싼 곳을 찾고, 그 안의 실 이름 글로 용도를 압니다(트인 거실 · 주방은 면적선으로 나눔).</li>
            <li>길은 문을 열고 벽에서 띄워 복도 가운데로 — 계단실 · 바깥으로 난 문 · 손으로 찍은 비상구까지 가장 가까운 길과 다른 길.</li>
            <li>소화기 · 옥내소화전 · 발신기 · 완강기는 도면 블록 이름으로 찾고, 없으면 눌러서 넣습니다.</li>
          </ul>
        </div>
      )}

      {도면 && D && (
        <>
          {도면.판들.length > 1 && (
            <div className="card" style={{ paddingTop: 10, paddingBottom: 10 }}>
              <Row label="평면 고르기" hint={`이 도면에 ${도면.판들.length}장`}>
                <select value={판번호} onChange={(e) => set판번호(+e.target.value)}>
                  {도면.판들.map((p, i) => <option key={i} value={i}>{p.제목} — 실 {p.이름들.length}</option>)}
                </select>
              </Row>
            </div>
          )}
          {!D.방들.length && (
            <div className="card cwarn" style={{ fontSize: 13.5 }}>
              방을 찾지 못했습니다 — 벽 · 창 · 문을 그린 층 이름(WALL · 벽 · WIN · 창 · DOOR · 문 …)이 다르거나 구조 · 설비 도면일 수 있습니다.
              {도면.판들.length > 1 ? ' 위에서 다른 평면을 골라 보십시오.' : ' 건축 평면도(실 이름이 적힌 것)를 넣어 주십시오.'}
            </div>
          )}
          <div className="cpl-sum">
            <div><span>찾은 실</span><b>{D.방들.filter((R) => !R.이름없음).length}</b></div>
            <div><span>실내 합계(안목)</span><b>{안합.toFixed(2)}㎡</b></div>
            <div><span>바닥(벽 포함)</span><b>{Math.round(D.발넓이)}㎡</b></div>
            <div><span>출구 · 설비</span><b>{출구들.filter((x) => x.켬 !== false).length} · {장비들.length}</b></div>
          </div>
          <div className="eq-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={탭 === 'color'} className={탭 === 'color' ? 'on' : ''} onClick={() => { set탭('color'); set누름('') }}>🎨 컬러 평면도</button>
            <button type="button" role="tab" aria-selected={탭 === 'evac'} className={탭 === 'evac' ? 'on' : ''} onClick={() => set탭('evac')}>🚪 피난 안내도</button>
          </div>

          <div className="cpl-grid">
            <div className="cpl-main">
              {탭 === 'evac' && 쪽목록.length > 0 && (
                <div className="sg-pager">
                  <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={쪽번 === 0} onClick={() => set쪽번(쪽번 - 1)}>◀</button>
                  <select value={쪽번} onChange={(e) => set쪽번(+e.target.value)}>
                    {쪽목록.map((p, i) => <option key={i} value={i}>{i + 1} / {쪽목록.length} · {p.이름}</option>)}
                  </select>
                  <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={쪽번 >= 쪽목록.length - 1} onClick={() => set쪽번(쪽번 + 1)}>▶</button>
                </div>
              )}
              {장면 ? <미리보기 장면={장면} 고른방={탭 === 'color' ? 고른방 : null} on누름={눌렀다} 누름말={누름말} /> : <div className="muted">그리는 중…</div>}
              <div className="cpl-dl">
                <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!!내림} onClick={() => 받기('PDF')}>{씀 ? '📄' : '🔒'} PDF{탭 === 'evac' ? ` (${쪽목록.length}장)` : ''}</button>
                <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!!내림} onClick={() => 받기('PNG')}>{씀 ? '🖼' : '🔒'} PNG 300dpi</button>
                <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!!내림} onClick={() => 받기('DXF')}>{씀 ? '📐' : '🔒'} DXF (캐드)</button>
                {내림 && <span className="muted">⏳ {내림} 만드는 중…</span>}
                <span className="muted" style={{ marginLeft: 'auto' }}>{장면 ? `${장면.종이} · 축척 1/${장면.축척}` : ''}</span>
              </div>
            </div>

            <div className="cpl-side">
              {탭 === 'color' && (
                <>
                  <div className="card">
                    <div className="sec-title">꾸미기</div>
                    <div className="tl-grid">
                      <Row label="색"><select value={색.색판} onChange={(e) => set색({ ...색, 색판: e.target.value })}>{Object.entries(C.색판들).map(([k, v]) => <option key={k} value={k}>{v.이름}</option>)}</select></Row>
                      <Row label="면적"><select value={색.면적} onChange={(e) => set색({ ...색, 면적: e.target.value })}><option value="㎡평">㎡ + 평</option><option value="㎡">㎡</option><option value="평">평</option><option value="">안 적음</option></select></Row>
                      <Row label="면적 기준"><select value={색.면적기준} onChange={(e) => set색({ ...색, 면적기준: e.target.value })}><option value="안목">벽 안쪽(안목) — 잰 값</option><option value="면적선">면적선(벽 가운데) — 있으면</option><option value="도면">도면에 적힌 값 — 있으면</option></select></Row>
                      <Row label="종이"><select value={색.종이 + '|' + 색.방향} onChange={(e) => { const [a, b] = e.target.value.split('|'); set색({ ...색, 종이: a, 방향: b }) }}>
                        {Object.keys(종이들).flatMap((p) => ['가로', '세로'].map((d) => <option key={p + d} value={p + '|' + d}>{p} {d}</option>))}
                      </select></Row>
                      <Row label="제목"><input value={색.제목} onChange={(e) => set색({ ...색, 제목: e.target.value })} placeholder={((D.제목 || '').replace(/평면도/, '') + ' 컬러 평면도').trim()} /></Row>
                      <Row label="부제" hint="단지 · 주소 · 업체"><input value={색.부제} onChange={(e) => set색({ ...색, 부제: e.target.value })} /></Row>
                      <Row label="북쪽(각도)"><input inputMode="numeric" value={색.방위 ?? ''} onChange={(e) => set색({ ...색, 방위: e.target.value === '' ? null : Number(e.target.value) || 0 })} placeholder="비우면 안 그림" /></Row>
                    </div>
                    <div className="cpl-checks">
                      {[['무늬', '바닥 무늬'], ['이름', '실 이름'], ['가구', '가구 · 위생기구'], ['기타선', '그 밖 선'], ['벽채움', '벽 채움'], ['표', '면적표'], ['범례', '범례']].map(([k, t]) => (
                        <label key={k}><input type="checkbox" checked={색[k] !== false} onChange={(e) => set색({ ...색, [k]: e.target.checked })} /> {t}</label>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <div className="sec-title">실 <span className="muted" style={{ fontWeight: 500 }}>— 평면을 누르면 그 실로 · 이름 · 용도 · 색 · 무늬 바꾸기</span></div>
                    <div className="cpl-rooms">
                      {방줄.map((R) => {
                        const 바 = 방바꿈[R.번호] || {}
                        const 용 = 바.용도 || R.용도
                        const 색값 = 바.색 || 판색.색[용] || 판색.색.기타
                        return (
                          <div key={R.번호} id={'cpl-room-' + R.번호} className={'cpl-room' + (고른방 === R.번호 ? ' on' : '')} onClick={() => set고른방(R.번호)}>
                            <input className="nm" value={바.이름 ?? R.이름} onChange={(e) => 바꾸기(R.번호, '이름', e.target.value)} />
                            <select value={용} onChange={(e) => 바꾸기(R.번호, '용도', e.target.value)}>{C.용도들.map((u) => <option key={u.키} value={u.키}>{u.이름}</option>)}</select>
                            <input type="color" value={색값} onChange={(e) => 바꾸기(R.번호, '색', e.target.value)} title="색" />
                            <select value={바.무늬 !== undefined ? 바.무늬 : C.용도무늬[용] || ''} onChange={(e) => 바꾸기(R.번호, '무늬', e.target.value)} title="바닥 무늬">{Object.entries(C.무늬들).map(([k, v]) => <option key={k} value={k}>{v.이름}</option>)}</select>
                            <span className="ar">{R.면적.toFixed(2)}㎡ · {평(R.면적).toFixed(1)}평{R.도면면적 ? ` (도면 ${R.도면면적})` : ''}</span>
                            <label className="hide"><input type="checkbox" checked={!!바.숨김} onChange={(e) => 바꾸기(R.번호, '숨김', e.target.checked)} /> 숨김</label>
                          </div>
                        )
                      })}
                    </div>
                    {D.방들.some((R) => R.이름없음) && <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>이름 없는 공간 {D.방들.filter((R) => R.이름없음).length}곳은 연한 회색으로 칠합니다.</p>}
                  </div>
                </>
              )}
              {탭 === 'evac' && (
                <>
                  <div className="card">
                    <div className="sec-title">안내도에 적을 것</div>
                    <div className="tl-grid">
                      <Row label="업소 · 건물 이름"><input value={피.업소} onChange={(e) => set피({ ...피, 업소: e.target.value })} placeholder="예: ○○학원" /></Row>
                      <Row label="층"><input value={피.층} onChange={(e) => set피({ ...피, 층: e.target.value })} placeholder="예: 3층" /></Row>
                      <Row label="관리자 연락처"><input value={피.연락처} onChange={(e) => set피({ ...피, 연락처: e.target.value })} placeholder="예: 02-000-0000" /></Row>
                      <Row label="작성일"><input value={피.작성일} onChange={(e) => set피({ ...피, 작성일: e.target.value })} /></Row>
                      <Row label="종이" hint="400㎡ 이상 A3"><select value={피.종이} onChange={(e) => set피({ ...피, 종이: e.target.value })}><option value="자동">자동 (바닥면적으로)</option><option value="B4">B4 가로</option><option value="A3">A3 가로</option></select></Row>
                    </div>
                    <div className="cpl-checks">
                      {[['모든길', '다른 실의 길도'], ['다른길', '다른 대피 경로(두 방향)'], ['가구', '가구 · 위생기구']].map(([k, t]) => (
                        <label key={k}><input type="checkbox" checked={피[k] !== false} onChange={(e) => set피({ ...피, [k]: e.target.checked })} /> {t}</label>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <div className="sec-title">출구 · 설비 <span className="muted" style={{ fontWeight: 500 }}>— 단추를 누르고 평면을 누르면 넣음</span></div>
                    <div className="cpl-btns">
                      <button type="button" className={'btn line sm' + (누름 === '출구' ? ' on' : '')} onClick={() => set누름(누름 === '출구' ? '' : '출구')}>🟩 비상구</button>
                      {장비단추.map(([k, t]) => <button key={k} type="button" className={'btn line sm' + (누름 === k ? ' on' : '')} onClick={() => set누름(누름 === k ? '' : k)}>{t}</button>)}
                      <button type="button" className={'btn line sm' + (누름 === '현위치' ? ' on' : '')} onClick={() => set누름(누름 === '현위치' ? '' : '현위치')}>📍 현위치 찍기</button>
                      <button type="button" className={'btn line sm' + (누름 === '지우기' ? ' on' : '')} onClick={() => set누름(누름 === '지우기' ? '' : '지우기')}>✕ 지우기</button>
                    </div>
                    <ul className="cpl-exits">
                      {출구들.map((x, i) => (
                        <li key={i}>
                          <label><input type="checkbox" checked={x.켬 !== false} onChange={(e) => (x._i !== undefined ? set출구켬((m) => ({ ...m, [x._i]: e.target.checked })) : set더출구((l) => l.map((o) => (o === x ? { ...o, 켬: e.target.checked } : o))))} />
                            {' '}{x.종류 === '계단' ? '🪜' : x.종류 === '출입구' ? '🚪' : '🟩'} {x.이름}{x._i === undefined ? ' (찍음)' : ''}</label>
                        </li>
                      ))}
                      {!출구들.length && <li className="cwarn">출구를 찾지 못했습니다 — «🟩 비상구» 를 누르고 평면의 비상구 · 출입구 자리를 누르십시오.</li>}
                    </ul>
                    <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
                      설비: {장비단추.map(([k, t]) => `${t.split(' ')[1]} ${장비들.filter((e) => e.종류 === k).length}`).join(' · ')}
                      {D.장비들.length ? ' (도면 블록 이름으로 찾음)' : ' — 도면에서 못 찾았으면 눌러서 넣으십시오'}
                    </p>
                  </div>
                  <div className="card">
                    <div className="sec-title">안내도 장(현위치) <span className="muted" style={{ fontWeight: 500 }}>— 붙일 곳마다 한 장</span></div>
                    <div className="cpl-checks">
                      <label><input type="checkbox" checked={전체쪽} onChange={(e) => set전체쪽(e.target.checked)} /> 전체 피난 경로(현위치 없이)</label>
                      {D.방들.filter((R) => !R.이름없음 && !출구들.some((x) => x.방 === R.번호 && x.켬 !== false)).map((R) => (
                        <label key={R.번호}><input type="checkbox" checked={쪽방.has(R.번호)} onChange={(e) => { const s = new Set(쪽방); if (e.target.checked) s.add(R.번호); else s.delete(R.번호); set쪽고름(s) }} /> {R.이름}{길 && 길.길들.get(R.번호)?.첫 ? ` · ${길.길들.get(R.번호).첫.길이.toFixed(1)}m` : 길 ? ' · 길 없음' : ''}</label>
                      ))}
                      {손쪽.map((p, i) => <label key={'s' + i}><input type="checkbox" checked onChange={() => set손쪽((l) => l.filter((_, n) => n !== i))} /> 📍 {p.이름}</label>)}
                    </div>
                  </div>
                  <div className="card">
                    <div className="sec-title">기준 맞춤 <span className="muted" style={{ fontWeight: 500 }}>— 다중이용업소법 시행규칙 [별표 2의2]</span></div>
                    <ul className="cpl-check">
                      {점검.map((c, i) => <li key={i} className={c.됨 === true ? 'g' : c.됨 === false ? 'r' : ''}><span>{c.됨 === true ? '✔' : c.됨 === false ? '✖' : 'ℹ'}</span> {c.글} <i>{c.근거}</i></li>)}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
      <div className="card">
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          방 면적 · 물량이 필요하면 <Link to="/jeoksan/magam">마감 수량산출</Link>, 도면을 세워 보려면 <Link to="/tools/dxf3d">도면 3D 보기</Link>, DWG 를 DXF 로만 바꾸려면 <Link to="/tools/dwgdxf">DWG 바꾸기</Link>입니다.
          피난안내도는 출력 뒤 코팅한 종이 · 아크릴 · 강판처럼 쉽게 훼손되지 않는 재질로, 영업장 주 출입구 곁과 구획된 실마다 붙입니다(별표 2의2 제3호 · 제6호). 소방 관련 최종 판단은 관할 소방서 안내를 따르십시오.
        </p>
      </div>
    </>
  )
}
