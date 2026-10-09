/**
 * 🧰 도면 3D 로 더 하기 — 8가지 (G224 · 2026-10-10) · /tools/dxf3d 화면 아래 카드 · 셈은 lib/활용3d.js
 *
 * 소장님: 「오늘 3D작업 했잖아 그 방법을 이용해서 할 수 있는게 먹가 있지??」 → 「1번 부터 8번까지 설계해서 내일 아침에 알려줘.」
 *         → 「1번부터 8번까지 사이트에 있는 것 처럼 프로그램으로 만들어 놔. 바로 올릴 수 있게.」 (설계 docs/3D응용_설계_261010.md)
 *
 * 1 📐 토공 검산(두 땅 면 — /tools/earthcheck 따로 화면) · 2 🔍 도면 검사 · 3 📍 측설표 · 4 🧱 구조물 물량 · 5 💧 물길
 * 6 🎨 기성 색칠(이 브라우저에 기록 · 파일로 옮김) · 7 📷 사진 위치 · 8 🦺 안전 그림
 * ■ 모두 이 브라우저 안에서만(도면 · 사진이 어디로도 안 감).
 * ■ 3D 위에 그리는 것(물길 · 표시 · 원 · 핀)은 «활용·» 이름의 덧그림 층 — Dxf3d.jsx 덧그림(키, 층) 이 화면에 얹음.
 * ■ 📊 숨은 누적(마디 둘까지 — 받은수.jsx 세기 규칙): |3D활용탭|토공 … · |3D활용엑셀|검사 … · |3D활용|CSV · |3D활용|물길 · |3D활용|기성기록 · |3D활용|기성파일 · |3D활용|사진 · |3D활용|그림 · |3D활용|내역맞대기 · |3D활용|토공넘김
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as U from '../lib/활용3d.js'
import { 높이찾개 } from '../lib/토공3d.js'
import { 세기 } from '../lib/받은수.jsx'

const 탭들 = [
  { k: '토공', 글: '📐 토공 검산' }, { k: '검사', 글: '🔍 도면 검사' }, { k: '측설', 글: '📍 측설표' }, { k: '구조', 글: '🧱 구조물 물량' },
  { k: '물길', 글: '💧 물길' }, { k: '기성', 글: '🎨 기성 색칠' }, { k: '사진', 글: '📷 사진 위치' }, { k: '안전', 글: '🦺 안전 그림' },
]
const 쉼 = (n, d = 0) => (Number.isFinite(n) ? Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—')
const 오늘 = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
/** 유량(㎥/s) 소수 자리 — 작은 물길(0.07)도 셋째 자리까지(둘째 자리면 여유 배수가 7% 넘게 어긋나 보임) */
const 유량자리 = (v) => (Math.abs(v) < 1 ? 3 : 2)

/** 덧그림 층 — 선(가운데 빼기 전 mm · [x1,y1,z1,x2,y2,z2 …]) · 굵기(mm) > 0 이면 옆으로 네 줄 더(WebGL 선은 1px 라 넓은 현장에선 안 보임) */
function 선층(이름, segs, rgb, C, 굵기 = 0) {
  const n = segs.length - (segs.length % 6), 겹 = 굵기 > 0 ? [0, 0.5, -0.5, 1, -1] : [0]
  const pos = new Float32Array(n * 겹.length), col = new Uint8Array(n * 겹.length)
  let o = 0
  for (let i = 0; i < n; i += 6) {
    const c = typeof rgb === 'function' ? rgb(i / 6) : rgb
    let dx = segs[i + 3] - segs[i], dy = segs[i + 4] - segs[i + 1]
    const l = Math.hypot(dx, dy)
    if (l < 1e-6) { dx = 1; dy = 0 } else { const t = dx; dx = -dy / l; dy = t / l }   // 옆(수직) 방향 · 세로 막대면 x 쪽
    for (const k of 겹) {
      const ox = dx * k * 굵기 / 2, oy = dy * k * 굵기 / 2
      for (const j of [0, 3]) {
        pos[o] = segs[i + j] - C[0] + ox; pos[o + 1] = segs[i + j + 1] - C[1] + oy; pos[o + 2] = segs[i + j + 2] - C[2]
        col[o] = c[0]; col[o + 1] = c[1]; col[o + 2] = c[2]; o += 3
      }
    }
  }
  return { name: '활용·' + 이름, ly: '활용·' + 이름, floor: '', pos, col, pts: new Float32Array(0), pcol: new Uint8Array(0), off: false }
}
/** 표시 크기(mm) — 현장 크기의 1%(0.6 ~ 15 m) · 넓은 현장에서도 표시가 보이게 */
function 표시크기(활) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  const 넣 = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  for (const L of 활.노선 || []) for (let i = 0; i < L.줄.length; i += 5) 넣(L.줄[i + 1], L.줄[i + 2])
  if (활.땅) for (let i = 0; i < 활.땅.점.length; i += 3) 넣(활.땅.점[i], 활.땅.점[i + 1])
  const 넓 = Number.isFinite(x0) ? Math.max(x1 - x0, y1 - y0) : 100000
  return Math.min(15000, Math.max(600, 넓 / 100))
}
/** 세로 막대(표시) — 점(mm) 마다 높이 z0 ~ z1(mm) */
const 막대들 = (점들, 반 = 600) => {
  const s = []
  for (const [x, y, z0, z1] of 점들) { s.push(x, y, z0, x, y, z1); s.push(x - 반, y, z1, x + 반, y, z1, x, y - 반, z1, x, y + 반, z1) }
  return s
}
/** CSV · JSON 받기(값엑셀 바이트받기는 .xlsx 로만) — <a download> 라 받은수가 저절로 셈 */
const 파일받기 = (이름, 글, 꼴 = 'text/csv') => {
  const url = URL.createObjectURL(new Blob([글], { type: 꼴 + ';charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
/** 3D 에서 한 번 찍기 — 다른 찍기(📍 두 점 찍기)를 지우지 않게 내 것일 때만 거둠 */
const 찍기걸기 = (v, f) => { v.onPick = f; return () => { if (v.onPick === f) v.onPick = null } }
const 좌표칸 = (m, v) => (Number.isFinite(v) ? { v: Math.round(v * 1000) / 1000, st: m.ST.PLAIN } : '')
const 받기엑셀 = async (이름, 시트, 꼬리 = '') => {
  const m0 = await import('../lib/값엑셀.js')
  /* 소수 칸은 넷째 자리에서 반올림해 넣음(0.40000000000000036 같은 셈 찌꺼기가 칸에 남지 않게 · 보이는 꼴은 둘째 자리) */
  const m = { ...m0, 소수칸: (v) => m0.소수칸(v === '' || v == null ? v : Math.round(Number(v) * 1e4) / 1e4) }
  m.값엑셀받기(이름, 시트(m), { 주소: '/tools/dxf3d', 글: 꼬리 || '도면 3D 활용 — 다시 셀 때는 사이트에서' })
}

export default function 활용판({ 결과, 보기, 원층, 덧그림, 옮긴수 = 0 }) {
  const [탭, set탭] = useState('')
  /* 측량점이 없고 등고선 · 3D 폴리선처럼 «높이 든 선» 만 있는 도면(건물 · 횡단 · 구조물 아님) → 그 선 꼭짓점으로 땅 면(탭을 처음 열 때 한 번) */
  const 펼침 = 탭 !== ''
  const 활 = useMemo(() => {
    const 활0 = 결과 && 결과.활용
    if (!활0 || 활0.땅 || !펼침 || 결과.건물 || 결과.횡단 || 결과.구조) return 활0
    /* 등고선(수평인 선 · 높이 든 점)만 먼저 — 높이가 바뀌는 3D 폴리선은 길 · 계획선일 수 있어(언덕을 가르는 길 → 가짜 웅덩이) 등고선이 모자랄 때만 씀 */
    const C = 결과.c, 등 = [], 모두 = []
    const 넣 = (to, a, i) => { const z = a[i + 2] + C[2]; if (Math.abs(z) > 1 && Math.abs(z) < 3e6) to.push([a[i] + C[0], a[i + 1] + C[1], z]) }
    for (const l of 원층() || []) {
      if (l.pts) for (let i = 0; i < l.pts.length; i += 3) { 넣(등, l.pts, i); 넣(모두, l.pts, i) }
      if (l.pos) for (let i = 0; i + 5 < l.pos.length; i += 6) {
        const 수평 = Math.abs(l.pos[i + 2] - l.pos[i + 5]) < 1
        if (수평) { 넣(등, l.pos, i); 넣(등, l.pos, i + 3) }
        넣(모두, l.pos, i); 넣(모두, l.pos, i + 3)
      }
    }
    const 점 = 등.length >= 200 ? 등 : 모두
    if (점.length < 12) return 활0
    const 땅 = U.땅만들기(U.점솎기(점, 60000, 500))
    return 땅 ? { ...활0, 땅: { 점: 땅.점, 삼: 땅.삼 }, 땅출처: '높이 든 선' } : 활0
  }, [결과, 원층, 펼침])
  const 크기 = useMemo(() => (활 ? 표시크기(활) : 1000), [활])
  if (!활) return null
  const 고름 = (k) => { set탭(탭 === k ? '' : k); if (탭 !== k) 세기('|3D활용탭|' + k) }
  const 공 = { 활, C: 결과.c, 보기, 원층, 덧그림, 결과, 크기 }
  return (
    <div className="dx3-bld ux3">
      <div className="dx3-bh">🧰 <b>3D 로 더 하기</b> <span className="muted" style={{ fontSize: 12 }}>— 세운 도면으로 바로</span></div>
      <div className="ux3-tabs" role="tablist">
        {탭들.map((t) => <button key={t.k} type="button" role="tab" aria-selected={탭 === t.k} className={'chip' + (탭 === t.k ? ' on' : '')} onClick={() => 고름(t.k)}>{t.글}</button>)}
      </div>
      {옮긴수 > 0 && 탭 && <div className="dx3-warn">⚠️ 📍 두 점 찍기로 옮긴 도면은 여기 셈에 안 들어갑니다 — 처음 세운 자리로 셉니다(맞는 자리로 하려면 같은 이름 · 측량 자료로 다시 세우기).</div>}
      {!탭 && <div className="dx3-bsub">위 단추를 누르면 펼쳐집니다. 측량 자료(측량성과표 · 측량도면)와 계획평면도 · 종단 · 횡단을 같이 넣을수록 많이 됩니다.</div>}
      {탭 === '토공' && <토공탭 {...공} />}
      {탭 === '검사' && <검사탭 {...공} />}
      {탭 === '측설' && <측설탭 {...공} />}
      {탭 === '구조' && <구조탭 {...공} />}
      {탭 === '물길' && <물길탭 {...공} />}
      {탭 === '기성' && <기성탭 {...공} />}
      {탭 === '사진' && <사진탭 {...공} />}
      {탭 === '안전' && <안전탭 {...공} />}
    </div>
  )
}

/* 공통 — 땅 높이(m) 찾개 · 3D 로 날아가기 */
function use땅높이(활) {
  return useMemo(() => {
    if (!활.땅) return null
    const P = [], T = []
    for (let i = 0; i < 활.땅.점.length; i += 3) P.push([활.땅.점[i], 활.땅.점[i + 1], 활.땅.점[i + 2]])
    for (let i = 0; i < 활.땅.삼.length; i += 3) T.push([활.땅.삼[i], 활.땅.삼[i + 1], 활.땅.삼[i + 2]])
    const f = 높이찾개(P, T)
    return (x, y) => { const z = f(x, y); return Number.isFinite(z) ? z / 1000 : NaN }
  }, [활])
}
const 날아가기 = (보기, C, x, y, z, 반 = 25000) => {
  const v = 보기(); if (!v) return
  const cx = x - C[0], cy = y - C[1], cz = z - C[2]
  v.fit([cx - 반, cy - 반, cz - 5000, cx + 반, cy + 반, cz + 5000], 'tilt')
  try { document.querySelector('.dx3-stage').scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch (e) { /* 옛 브라우저 */ }
}
/** 노선 위 측점의 높이(mm) — 종단 계획고 · 지반고 · 땅 면 차례 */
const 측점높이 = (활, L, s, 땅높이, p) => {
  const 종 = (활.종단 || []).find((z) => z.노선 === L.이름)
  let z = 종 ? U.종단높이(종.줄, s, '지반고') : NaN
  if (!Number.isFinite(z) && 종) z = U.종단높이(종.줄, s, '계획고')
  if (!Number.isFinite(z) && 땅높이 && p) z = 땅높이(p.x, p.y)
  return Number.isFinite(z) ? z * 1000 : 0
}
const 없음 = (글) => <div className="dx3-warn" style={{ marginTop: 8 }}>{글}</div>

/* ── 1 📐 토공 검산 ─────────────────────────────── */
function 토공탭({ 활 }) {
  const nav = useNavigate()
  const 넘기기 = () => {
    /* 같은 탭 안 화면 옮김이라 메모리로 넘김(크기 제한 없음) · 새로고침에 대비해 창고에도(5MB 넘으면 못 넣음 — 그래도 메모리로 감) */
    window.__kcm_earth_A = { 점: 활.땅.점, 삼: 활.땅.삼, 이름: '도면 3D 의 측량 땅 면', at: Date.now() }
    try {
      const 점 = []
      for (let i = 0; i < 활.땅.점.length; i += 3) 점.push([Math.round(활.땅.점[i]), Math.round(활.땅.점[i + 1]), Math.round(활.땅.점[i + 2])])
      sessionStorage.setItem('kcm_earth_A', JSON.stringify({ 점, 삼: Array.from(활.땅.삼), 이름: '도면 3D 의 측량 땅 면', at: Date.now() }))
    } catch (e) { /* 너무 큼 — 메모리로만 */ }
    세기('|3D활용|토공넘김'); nav('/tools/earthcheck')
  }
  return (
    <div className="ux3-in">
      <p className="dx3-bsub">
        <b>원지반 측량(착공 전)</b>과 <b>나중 측량(현황 · 기성 · 준공)</b> 두 땅 면을 겹쳐 깎인 양(절토) · 쌓인 양(성토)을 칸마다 잽니다.
        기성 검사 · 설계변경 토공 증감 · 사토 반출량(덤프 대수) 확인에 씁니다. 두 측량을 따로 넣어야 해서 <b>따로 화면</b>에서 합니다.
      </p>
      <div className="ux3-row">
        <Link className="btn sm" to="/tools/earthcheck">📐 토공 검산 화면 열기</Link>
        {활.땅 && <button type="button" className="btn sm ghost" onClick={넘기기}>이 화면의 측량 땅 면을 «전» 으로 넘겨 열기</button>}
      </div>
      <p className="dx3-skip">이 화면의 «📐 토공 물량 — 평균단면법» 표(횡단면도로 잰 값)와 나란히 보면 검산이 됩니다.</p>
    </div>
  )
}

/* ── 2 🔍 도면 검사 ─────────────────────────────── */
function 검사탭({ 활, C, 보기, 덧그림, 크기 }) {
  const 땅높이 = use땅높이(활)
  const [허, set허] = useState(0.05)
  const r = useMemo(() => U.도면검사(활, { 높이: 허 }, 땅높이), [활, 허, 땅높이])
  const 자리 = (q) => {
    const L = (활.노선 || []).find((x) => x.이름 === q.노선)
    if (!L) return null
    const p = U.노선자리(L, q.측)
    return p ? { ...p, z: 측점높이(활, L, q.측, 땅높이, p) } : null
  }
  useEffect(() => {
    const 점 = r.곳.map(자리).filter(Boolean).map((p) => [p.x, p.y, p.z - 크기 * 2, p.z + 크기 * 5])
    덧그림('검사', 점.length ? 선층('검사', 막대들(점, 크기), [235, 60, 60], C, 크기 / 5) : null)
    return () => 덧그림('검사', null)
  }, [r, 활, C])   // eslint-disable-line react-hooks/exhaustive-deps
  const 엑셀 = () => { 받기엑셀('도면검사_확인할곳', (m) => [{ name: '확인할 곳', head: ['등급', '노선', '측점', '측점(m)', '무엇', 'A 값', 'B 값', '차이'],
    rows: r.곳.map((q) => [q.등급, q.노선, q.글 || '', m.소수칸(q.측), q.무엇, Number.isFinite(q.A) ? m.소수칸(q.A) : '', Number.isFinite(q.B) ? m.소수칸(q.B) : '', Number.isFinite(q.차) ? m.소수칸(q.차) : '']), widths: [6, 18, 12, 9, 40, 10, 10, 9] }]); 세기('|3D활용엑셀|검사') }
  const 본 = r.본것
  return (
    <div className="ux3-in">
      <p className="dx3-bsub">같은 노선의 <b>평면 · 종단 · 횡단</b>(+ 측량 땅 면)을 측점마다 맞대어 <b>«확인할 곳»</b>을 찾습니다(틀렸다고 단정하지 않음 · 반올림 차이는 허용차로 거름).
        줄을 누르면 3D 가 그 자리로 갑니다(빨간 막대).</p>
      <div className="ux3-row">
        <label>높이 허용차 <select value={허} onChange={(e) => set허(Number(e.target.value))}>{[0.02, 0.05, 0.1, 0.2].map((v) => <option key={v} value={v}>{v * 100} cm</option>)}</select></label>
        <span className="muted" style={{ fontSize: 12 }}>맞대 본 곳 — 지반고 {본.지반} · 계획고 {본.계획} · 측량 땅 면 {본.땅} · 측점 {본.빠짐} · 면적 {본.튐} · 노선 길이 {본.길이}</span>
        {r.곳.length > 0 && <button type="button" className="chip on" onClick={엑셀}>📗 엑셀</button>}
      </div>
      {r.곳.length === 0
        ? <div className="dx3-st ok" style={{ display: 'block', marginTop: 8 }}>✅ 허용차 안에서 서로 맞습니다(맞대 본 곳 {본.지반 + 본.계획 + 본.땅 + 본.빠짐 + 본.튐 + 본.길이}곳).</div>
        : (
          <div className="ux3-tbl">
            <table className="tbl left">
              <thead><tr><th>⚠️</th><th>노선 · 측점</th><th>무엇</th><th>A</th><th>B</th><th>차이</th></tr></thead>
              <tbody>
                {r.곳.slice(0, 200).map((q, i) => (
                  <tr key={i} className="ux3-click" onClick={() => { const p = 자리(q); if (p) 날아가기(보기, C, p.x, p.y, p.z) }}>
                    <td>{q.등급 === '큼' ? '🔴' : '🟡'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{q.노선}<div className="muted" style={{ fontSize: 11.5 }}>{q.글 || ''} · {쉼(q.측, 2)} m</div></td>
                    <td>{q.무엇}</td>
                    <td>{Number.isFinite(q.A) ? 쉼(q.A, 2) : '—'}</td><td>{Number.isFinite(q.B) ? 쉼(q.B, 2) : '—'}</td>
                    <td><b>{Number.isFinite(q.차) ? (q.차 > 0 ? '+' : '') + 쉼(q.차, 2) : '—'}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {r.못본것.length > 0 && <div className="dx3-skip">못 본 것: {r.못본것.join(' · ')}</div>}
    </div>
  )
}

/* ── 3 📍 측설표 ─────────────────────────────── */
function 구조모서리(활, 원층) {
  const out = []
  const 층들 = 원층() || []
  for (const q of 활.구조 || []) {
    const 점 = []
    let z최소 = Infinity
    for (const l of 층들) {
      if (l.floor !== q.층 || l.ly !== '콘크리트' || !l.pos) continue
      for (let i = 0; i < l.pos.length; i += 3) z최소 = Math.min(z최소, l.pos[i + 2])
    }
    for (const l of 층들) {
      if (l.floor !== q.층 || l.ly !== '콘크리트' || !l.pos) continue
      for (let i = 0; i < l.pos.length; i += 3) if (Math.abs(l.pos[i + 2] - z최소) < 50) 점.push([l.pos[i], l.pos[i + 1]])
    }
    if (점.length < 4) continue
    const r = U.네모서리(점)
    if (r) out.push({ 이름: q.이름, 점: r.점, z: q.아래, 가로: r.가로, 세로: r.세로 })
  }
  return out
}
function 측설탭({ 활, C, 원층, 덧그림, 크기, 결과 }) {
  const [간격, set간격] = useState(20)
  const [폭, set폭] = useState(true)
  const [구, set구] = useState(true)
  /* 구조물 모서리 — 화면 층(가운데 뺀 값)에서 뽑아 가운데를 되돌림 */
  const 모서리 = useMemo(() => 구조모서리(활, 원층).map((q) => ({ ...q, 점: q.점.map(([x, y]) => [x + C[0], y + C[1]]) })), [활, 원층, C])
  const t = useMemo(() => U.측설표(활, { 간격, 폭, 구조: 구 }, 모서리), [활, 간격, 폭, 구, 모서리])
  useEffect(() => {
    const s = []
    let 앞z = 0
    for (const r of t.줄) {
      const p = U.도면좌표(r.X, r.Y, 활.바꿈), z = Number.isFinite(r.Z) ? r.Z * 1000 : 앞z, k = 크기 * 0.8
      앞z = z
      s.push(p.x - k, p.y, z, p.x + k, p.y, z, p.x, p.y - k, z, p.x, p.y + k, z, p.x, p.y, z, p.x, p.y, z + 크기 * 3)
    }
    덧그림('측설', s.length ? 선층('측설', s, [255, 214, 64], C, 크기 / 6) : null)
    return () => 덧그림('측설', null)
  }, [t, 활, C])   // eslint-disable-line react-hooks/exhaustive-deps
  if (!(활.노선 || []).length && !모서리.length) return 없음('측점(NO.) 글자와 중심선이 있는 계획평면도 · 종평면도를 넣어야 노선(측점 자리)이 생깁니다. 구조물은 구조물 일반도(평면 + 단면 EL)가 측량 도면에 겹쳐져야 모서리가 나옵니다.')
  const 엑셀 = () => { 받기엑셀('측설표', (m) => [{ name: '측설표', head: ['점번호', '코드', '노선 · 구조물', '측점', '측점(m)', '옆(m · 오른쪽 +)', 'X(북)', 'Y(동)', '높이 Z', '무엇'],
    rows: t.줄.map((r) => [r.번, r.코드, r.노선, r.측글, Number.isFinite(r.측) ? m.소수칸(r.측) : '', Number.isFinite(r.옆) ? m.소수칸(r.옆) : '', 좌표칸(m, r.X), 좌표칸(m, r.Y), 좌표칸(m, r.Z), r.무엇]),
    widths: [9, 6, 18, 12, 9, 10, 14, 14, 9, 18] }], t.실좌표 ? '측설 전 측량 기사 확인 — 다시 셀 때는 사이트에서' : '⚠️ 측량 자료 없이 세운 도면 — 실제 좌표 아님 · 측설에 쓰지 말 것'); 세기('|3D활용엑셀|측설') }
  const csv = () => { 파일받기('측설점_장비용.csv', U.측설CSV(t.줄)); 세기('|3D활용|CSV') }
  return (
    <div className="ux3-in">
      <p className="dx3-bsub">노선 <b>중심선 측점</b>마다 좌표 · 계획고, 가까운 횡단의 <b>터파기 끝 · 구조물 바깥(좌 · 우)</b>, 구조물 <b>바깥 네 모서리</b>를 뽑습니다.
        X = 북 · Y = 동(측량 꼴). 3D 위 노란 점이 뽑은 점입니다.</p>
      {!t.실좌표 && <div className="dx3-warn">⚠️ 측량 자료(측량성과표 · 측량도면) 없이 세운 도면입니다 — <b>실제 좌표가 아닙니다. 측설에 쓰지 마십시오.</b> 측량 자료를 같이 넣으면 실제 좌표가 됩니다.</div>}
      {t.실좌표 && (() => {
        /* 노선 · 구조물 자리는 평면도를 측량에 «같은 글자» 로 맞춘 것 — 그 오차만큼 좌표도 어긋남 */
        const 맞춘 = (결과.그룹 || []).filter((g) => (g.종류 === '평면' || g.종류 === '종평' || g.종류 === '구조' || g.종류 === '건물') && g.자리 && (g.자리.how === '글자' || g.자리.how === '모양'))
        if (!맞춘.length) return null
        return <div className="dx3-skip" style={{ marginTop: 4 }}>📏 자리 맞춤 — {맞춘.slice(0, 3).map((g) => `«${(g.제목 || g.파일[0] || '').slice(0, 24)}» ${g.자리.how === '글자' ? `같은 글자 ${g.자리.n}쌍 · 평균 ${g.자리.rms.toFixed(2)} m · 최대 ${g.자리.max.toFixed(2)} m` : `같은 모양 겹친 몫 ${Math.round(g.자리.몫 * 100)}%`}`).join(' · ')} — 측설 좌표도 이만큼 어긋날 수 있습니다.</div>
      })()}
      <div className="ux3-row">
        <label>중심선 간격 <select value={간격} onChange={(e) => set간격(Number(e.target.value))}>{[5, 10, 20, 25, 50].map((v) => <option key={v} value={v}>{v} m</option>)}</select></label>
        <label><input type="checkbox" checked={폭} onChange={(e) => set폭(e.target.checked)} /> 터파기 끝 · 구조물 바깥</label>
        <label><input type="checkbox" checked={구} onChange={(e) => set구(e.target.checked)} /> 구조물 모서리{모서리.length ? ` ${모서리.length}곳` : ''}</label>
        <button type="button" className="chip on" onClick={엑셀}>📗 엑셀</button>
        <button type="button" className="chip on" onClick={csv}>📄 CSV(장비용)</button>
      </div>
      <div className="ux3-tbl">
        <table className="tbl left">
          <thead><tr><th>점번호</th><th>노선 · 측점</th><th>옆</th><th>X(북)</th><th>Y(동)</th><th>Z</th><th>무엇</th></tr></thead>
          <tbody>
            {t.줄.slice(0, 60).map((r) => (
              <tr key={r.번}><td>{r.번}</td><td style={{ whiteSpace: 'nowrap' }}>{r.노선}<div className="muted" style={{ fontSize: 11.5 }}>{r.측글}</div></td>
                <td>{Number.isFinite(r.옆) && r.옆 !== 0 ? (r.옆 > 0 ? '오른쪽 ' : '왼쪽 ') + 쉼(Math.abs(r.옆), 2) + ' m' : ''}</td>
                <td>{쉼(r.X, 3)}</td><td>{쉼(r.Y, 3)}</td><td>{Number.isFinite(r.Z) ? 쉼(r.Z, 3) : '—'}</td><td>{r.무엇}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dx3-skip">모두 {t.줄.length}점{t.줄.length > 60 ? ' (화면엔 앞 60점 — 엑셀 · CSV 에 다)' : ''} · 터파기 끝은 횡단면도 선으로 잰 자리 · 구조물 모서리는 20 cm 칸으로 잰 바깥(±0.2 m) · <b>측설 전 측량 기사 확인</b></div>
    </div>
  )
}

/* ── 4 🧱 구조물 물량 ─────────────────────────────── */
function 구조탭({ 활 }) {
  const [두께, set두께] = useState({ 벽: 0.3, 바닥: 0.3, 덮개: 0 })
  const r = useMemo(() => U.구조물량(활, 두께), [활, 두께])
  const [내역, set내역] = useState(null)
  const 합 = { 콘크리트: r.줄로.reduce((s, x) => s + x.콘크리트, 0) + r.홀로.reduce((s, x) => s + x.콘크리트, 0), 거푸집: r.줄로.reduce((s, x) => s + x.거푸집, 0) + r.홀로.reduce((s, x) => s + x.거푸집, 0) }
  const 내역읽기 = async (f) => {
    if (!f) return
    try {
      const { readWorkbook } = await import('../lib/qtoxlsx.js')
      const 줄 = U.내역품목(readWorkbook(new Uint8Array(await f.arrayBuffer())))
      set내역({ 파일: f.name, 줄, 맞대 : U.내역맞대기(줄, 합) })
      세기('|3D활용|내역맞대기')
    } catch (e) { set내역({ 파일: f.name, 오류: '엑셀(.xlsx) 내역서를 읽지 못했습니다 — «품명 · 규격 · 단위 · 수량» 머리가 있는 시트가 필요합니다' }) }
  }
  useEffect(() => { if (내역 && 내역.줄) set내역((x) => ({ ...x, 맞대: U.내역맞대기(x.줄, 합) })) }, [합.콘크리트, 합.거푸집])   // eslint-disable-line react-hooks/exhaustive-deps
  const 엑셀 = () => { 받기엑셀('구조물_물량', (m) => [
    { name: '줄 구조물', head: ['노선', '단면 수', '길이(m)', '콘크리트(㎥)', '거푸집(㎡)'], rows: r.줄로.map((x) => [x.노선, m.수칸(x.단면수), m.소수칸(x.길이), m.소수칸(x.콘크리트), m.소수칸(x.거푸집)]), widths: [24, 8, 10, 12, 12] },
    { name: '홀로 선 구조물', head: ['구조물', '바닥 넓이(㎡)', '바깥 벽 길이(m)', '높이(m)', '벽 두께', '바닥 두께', '덮개 두께', '콘크리트(㎥ · 개략)', '거푸집(㎡ · 개략)'],
      rows: r.홀로.map((x) => [x.이름, m.소수칸(x.넓이), m.소수칸(x.둘레), m.소수칸(x.높이), m.소수칸(두께.벽), m.소수칸(두께.바닥), m.소수칸(두께.덮개), m.소수칸(x.콘크리트), m.소수칸(x.거푸집)]), widths: [24, 12, 12, 9, 8, 8, 8, 14, 14] },
    ...(내역 && 내역.맞대 ? [{ name: '내역 맞대기', head: ['무엇', '내역 수량', '도면 수량', '차이(도면 − 내역)', '내역 줄 수'], rows: 내역.맞대.map((x) => [x.무엇, m.소수칸(x.내역), m.소수칸(x.도면), m.소수칸(x.차), m.수칸(x.줄)]), widths: [14, 12, 12, 16, 10] }] : []),
  ], '도면 선으로 잰 검산용 값(헌치 · 이음 · 작은 구멍 · 철근 빠짐) — 다시 셀 때는 사이트에서'); 세기('|3D활용엑셀|구조') }
  if (!r.줄로.length && !r.홀로.length) return 없음('콘크리트를 잴 구조물이 없습니다 — 구조물이 닫힌 모양으로 그려진 횡단면도(배수로 · 측구 · 옹벽)나 구조물 일반도(평면 + 단면 EL)를 넣어 주십시오.')
  return (
    <div className="ux3-in">
      <p className="dx3-bsub"><b>줄로 긴 구조물</b>은 횡단면도의 구조물 모양(물길은 뺌)으로 단면마다 콘크리트 · 거푸집(옆면 + 아랫면 · 흙 닿은 바닥 · 윗면 뺌)을 재 평균단면법으로,
        <b> 홀로 선 구조물</b>은 바닥 넓이 · 바깥 벽 길이 · 높이에 <b>넣은 두께</b>를 곱한 개략 값입니다.</p>
      <div className="ux3-tbl">
        <table className="tbl left">
          <thead><tr><th>줄 구조물(노선)</th><th>길이</th><th>콘크리트</th><th>거푸집</th></tr></thead>
          <tbody>
            {r.줄로.map((x, i) => <tr key={i}><td>{x.노선} <span className="muted">({x.단면수}단면)</span></td><td>{쉼(x.길이, 1)} m</td><td><b>{쉼(x.콘크리트, 2)}</b> ㎥</td><td><b>{쉼(x.거푸집, 1)}</b> ㎡</td></tr>)}
            {!r.줄로.length && <tr><td colSpan={4} className="muted">횡단면도에 구조물 모양이 없음</td></tr>}
          </tbody>
        </table>
      </div>
      {r.홀로.length > 0 && (<>
        <div className="ux3-row" style={{ marginTop: 8 }}>
          {[['벽', '벽 두께'], ['바닥', '바닥 두께'], ['덮개', '덮개(슬래브) 두께']].map(([k, 글]) => (
            <label key={k}>{글} <input type="number" step="0.05" min="0" value={두께[k]} onChange={(e) => set두께({ ...두께, [k]: Math.max(0, Number(e.target.value) || 0) })} style={{ width: 70 }} /> m</label>
          ))}
        </div>
        <div className="ux3-tbl">
          <table className="tbl left">
            <thead><tr><th>홀로 선 구조물</th><th>바닥 넓이</th><th>바깥 벽</th><th>높이</th><th>콘크리트(개략)</th><th>거푸집(개략)</th></tr></thead>
            <tbody>{r.홀로.map((x, i) => <tr key={i}><td>{x.이름}</td><td>{쉼(x.넓이, 1)} ㎡</td><td>{쉼(x.둘레, 1)} m</td><td>{쉼(x.높이, 2)} m</td><td><b>{쉼(x.콘크리트, 1)}</b> ㎥</td><td><b>{쉼(x.거푸집, 1)}</b> ㎡</td></tr>)}</tbody>
          </table>
        </div>
      </>)}
      <div className="ux3-row" style={{ marginTop: 8 }}>
        <label className="btn sm ghost" style={{ cursor: 'pointer' }}>📂 내역서(엑셀)와 맞대기<input type="file" accept=".xlsx" className="sr-only" onChange={(e) => { 내역읽기(e.target.files && e.target.files[0]); e.target.value = '' }} /></label>
        <button type="button" className="chip on" onClick={엑셀}>📗 엑셀</button>
      </div>
      {내역 && (내역.오류 ? 없음(내역.오류) : (
        <div className="ux3-tbl">
          <table className="tbl left">
            <thead><tr><th>«{내역.파일}»</th><th>내역</th><th>도면</th><th>차이</th></tr></thead>
            <tbody>{내역.맞대.map((x) => <tr key={x.무엇}><td>{x.무엇} <span className="muted">({x.근거 ? x.근거 + ' ' : ''}{x.줄}개)</span></td><td>{쉼(x.내역, 2)}</td><td>{쉼(x.도면, 2)}</td><td><b>{(x.차 > 0 ? '+' : '') + 쉼(x.차, 2)}</b></td></tr>)}</tbody>
          </table>
        </div>
      ))}
      <div className="dx3-skip">⚠️ 도면 선으로 잰 <b>검산용</b> 값입니다(±10% 안팎) — 헌치 · 이음 · 작은 구멍 · 철근은 못 셉니다. 비스듬한 면은 칸 모서리로 재 조금 길게 나옵니다.</div>
    </div>
  )
}

/* ── 5 💧 물길 ─────────────────────────────── */
function 물길탭({ 활, C, 덧그림, 크기 }) {
  const [칸m, set칸m] = useState(0)
  const [결, set결] = useState(null)
  const [바쁨, set바쁨] = useState(false)
  const [식, set식] = useState({ C: 0.6, I: 80, n: 0.015 })
  const [단면, set단면] = useState({})        /* 노선 이름 → {B, H} */
  useEffect(() => { set결(null) }, [활])        /* 도면을 더하거나 빼 다시 세우면 다시 찾기 */
  const 찾기 = () => {
    if (!활.땅) return
    set바쁨(true)
    setTimeout(() => {
      try {
        let 칸 = 칸m
        if (!칸) { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (let i = 0; i < 활.땅.점.length; i += 3) { x0 = Math.min(x0, 활.땅.점[i]); x1 = Math.max(x1, 활.땅.점[i]); y0 = Math.min(y0, 활.땅.점[i + 1]); y1 = Math.max(y1, 활.땅.점[i + 1]) } 칸 = Math.max(1, Math.ceil(Math.sqrt((x1 - x0) * (y1 - y0) / 1e6 / 4e5))) }
        const G = U.격자만들기(활.땅.점, 활.땅.삼, 칸, 1.2e6)
        const 물 = U.물길찾기(G)
        set결({ G, 물 })
        세기('|3D활용|물길')
      } finally { set바쁨(false) }
    }, 30)
  }
  useEffect(() => {
    if (!결) return undefined
    let 큰 = 2
    for (const q of 결.물.물길) if (q[6] > 큰) 큰 = q[6]
    const s = [], 색 = []
    for (const q of 결.물.물길) { s.push(q[0], q[1], q[2] + 150, q[3], q[4], q[5] + 150); const t = Math.min(1, Math.log(q[6]) / Math.log(큰)); 색.push([40 + 40 * (1 - t), 120 + 60 * (1 - t), 255]) }
    덧그림('물길', s.length ? 선층('물길', s, (i) => 색[i], C, 크기 / 4) : null)
    const g = []
    for (const p of 결.물.고임.slice(0, 40)) {
      const r = Math.sqrt(p.넓이 / Math.PI)
      const z = (결.G.z[Math.floor((p.y - 결.G.y0) / 결.G.칸) * 결.G.nx + Math.floor((p.x - 결.G.x0) / 결.G.칸)] || 0) * 1000 + 200
      g.push(...U.원선(p.x, p.y, z, Math.max(1, r), 48))
    }
    덧그림('고임', g.length ? 선층('고임', g, [0, 220, 230], C, 크기 / 4) : null)
    return () => { 덧그림('물길', null); 덧그림('고임', null) }
  }, [결, C])   // eslint-disable-line react-hooks/exhaustive-deps
  const 여유 = useMemo(() => {
    if (!결) return []
    return (활.노선 || []).map((L) => {
      const 종 = (활.종단 || []).find((z) => z.노선 === L.이름)
      const t = (활.횡단 || []).find((x) => x.노선 === L.이름)
      const 쓴 = t ? t.단면.filter((s) => s.구조폭 && s.구조높) : []
      const 기본B = 쓴.length ? Math.max(0.2, 쓴[0].구조폭[1] - 쓴[0].구조폭[0] - 0.4) : 1
      const 기본H = 쓴.length ? Math.max(0.2, 쓴[0].구조높[1] - 쓴[0].구조높[0] - 0.2) : 1
      const d = 단면[L.이름] || { B: Number(기본B.toFixed(2)), H: Number(기본H.toFixed(2)) }
      let 경사 = NaN
      if (종 && 종.줄.length >= 2) { const a = 종.줄.filter((r) => Number.isFinite(r.계획고)); if (a.length >= 2) 경사 = Math.abs(a[a.length - 1].계획고 - a[0].계획고) / Math.max(1, a[a.length - 1].m - a[0].m) }
      const 유역 = U.유역넓이(결.G, 결.물, L, Math.max(1, d.B / 2 + 0.5))
      const q = U.배수여유({ 물넓이: d.B * d.H, 젖은둘레: d.B + 2 * d.H }, 경사, 유역, 식.C, 식.I, 식.n)
      return { L, d, 경사, 유역, ...q, 단면있음: 쓴.length > 0 }
    })
  }, [결, 활, 단면, 식])
  if (!활.땅) return 없음('측량 땅 면이 없습니다 — 높이 든 측량점(측량성과표 · 측량도면의 측량점)을 넣으면 땅 면이 서고 물길을 찾을 수 있습니다.')
  const 엑셀 = () => { 받기엑셀('물길_고인곳_배수여유', (m) => [
    { name: '고인 곳', head: ['차례', 'X(북)', 'Y(동)', '넓이(㎡)', '깊이(m)'], rows: 결.물.고임.slice(0, 200).map((p, i) => { const c = U.측량좌표(p.x, p.y, 활.바꿈); return [m.수칸(i + 1), 좌표칸(m, c.X), 좌표칸(m, c.Y), m.소수칸(p.넓이), m.소수칸(p.깊이)] }), widths: [6, 14, 14, 10, 9] },
    { name: '배수 여유(참고)', head: ['노선', '안 폭 B(m)', '안 높이 H(m)', '경사', '모이는 넓이(㎡)', '통수능(㎥/s · 매닝)', '홍수량(㎥/s · 합리식)', '여유(배)'],
      rows: 여유.map((x) => [x.L.이름, m.소수칸(x.d.B), m.소수칸(x.d.H), Number.isFinite(x.경사) ? { v: x.경사, st: m.ST.PLAIN } : '', m.소수칸(x.유역), Number.isFinite(x.통수) ? { v: Math.round(x.통수 * 1e4) / 1e4, st: m.ST.PLAIN } : '', { v: Math.round(x.홍수 * 1e4) / 1e4, st: m.ST.PLAIN }, Number.isFinite(x.여유) ? m.소수칸(x.여유) : '']), widths: [22, 10, 10, 9, 14, 16, 16, 9] },
  ], `참고용 — 수리계산서를 대신하지 않음 · C ${식.C} · I ${식.I} mm/h · n ${식.n}`); 세기('|3D활용엑셀|물길') }
  return (
    <div className="ux3-in">
      <p className="dx3-bsub">측량 땅 면을 격자로 바꿔 물이 흐르는 방향(8방향 · 가장 가파른 아래)과 <b>모이는 양</b>을 셉니다 — 파란 선 = 물길(진할수록 많이 모임) · 하늘색 원 = <b>고인 곳</b>.
        배수로 노선이 있으면 그 노선으로 모이는 넓이로 <b>합리식 홍수량 ↔ 매닝 통수능</b>을 참고로 맞대 봅니다.
        {활.땅출처 && <> 측량점이 없어 <b>등고선(높이 든 선) 꼭짓점</b>으로 땅 면을 만들었습니다.</>}</p>
      <div className="ux3-row">
        <label>격자 칸 <select value={칸m} onChange={(e) => set칸m(Number(e.target.value))}><option value={0}>알아서</option>{[1, 2, 5, 10].map((v) => <option key={v} value={v}>{v} m</option>)}</select></label>
        <button type="button" className="btn sm" onClick={찾기} disabled={바쁨}>{바쁨 ? '찾는 중…' : 결 ? '💧 다시 찾기' : '💧 물길 찾기'}</button>
        {결 && <button type="button" className="chip on" onClick={엑셀}>📗 엑셀</button>}
      </div>
      {결 && (<>
        <div className="dx3-st ok" style={{ display: 'block', margin: '6px 0' }}>격자 {결.G.nx} × {결.G.ny}칸({쉼(결.G.칸 / 1000, 1)} m) · 물길 선 {쉼(결.물.물길.length)}개(모이는 칸 {결.물.문턱}칸 넘는 곳) · 고인 곳 {결.물.고임.length}곳</div>
        {결.물.고임.length > 0 && (
          <div className="ux3-tbl">
            <table className="tbl left">
              <thead><tr><th>고인 곳</th><th>X(북)</th><th>Y(동)</th><th>넓이</th><th>깊이</th></tr></thead>
              <tbody>{결.물.고임.slice(0, 12).map((p, i) => { const c = U.측량좌표(p.x, p.y, 활.바꿈); return <tr key={i}><td>{i + 1}</td><td>{쉼(c.X, 1)}</td><td>{쉼(c.Y, 1)}</td><td>{쉼(p.넓이, 0)} ㎡</td><td>{쉼(p.깊이, 2)} m</td></tr> })}</tbody>
            </table>
          </div>
        )}
        {여유.length > 0 && (<>
          <div className="ux3-row" style={{ marginTop: 8 }}>
            <b style={{ fontSize: 13 }}>배수 여유(참고)</b>
            <label>유출계수 C <input type="number" step="0.05" min="0.1" max="1" value={식.C} onChange={(e) => set식({ ...식, C: Number(e.target.value) || 0.6 })} style={{ width: 64 }} /></label>
            <label>강우강도 I <input type="number" step="5" min="10" value={식.I} onChange={(e) => set식({ ...식, I: Number(e.target.value) || 80 })} style={{ width: 64 }} /> mm/h</label>
            <label>조도계수 n <input type="number" step="0.001" min="0.009" value={식.n} onChange={(e) => set식({ ...식, n: Number(e.target.value) || 0.015 })} style={{ width: 70 }} /></label>
          </div>
          <div className="ux3-tbl">
            <table className="tbl left">
              <thead><tr><th>노선</th><th>안 폭 B · 높이 H(m)</th><th>경사</th><th>모이는 넓이</th><th>통수능</th><th>홍수량</th><th>여유</th></tr></thead>
              <tbody>{여유.map((x) => (
                <tr key={x.L.이름}>
                  <td>{x.L.이름}{!x.단면있음 && <div className="muted" style={{ fontSize: 11 }}>단면 없음 — B · H 를 넣으세요</div>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <input type="number" step="0.1" min="0.1" value={x.d.B} onChange={(e) => set단면({ ...단면, [x.L.이름]: { ...x.d, B: Number(e.target.value) || 0.1 } })} style={{ width: 58 }} /> ×{' '}
                    <input type="number" step="0.1" min="0.1" value={x.d.H} onChange={(e) => set단면({ ...단면, [x.L.이름]: { ...x.d, H: Number(e.target.value) || 0.1 } })} style={{ width: 58 }} />
                  </td>
                  <td>{Number.isFinite(x.경사) ? (x.경사 * 100).toFixed(2) + '%' : '종단 없음'}</td>
                  <td>{쉼(x.유역 / 10000, 2)} ha</td>
                  <td>{Number.isFinite(x.통수) ? 쉼(x.통수, 유량자리(x.통수)) + ' ㎥/s' : '—'}</td>
                  <td>{쉼(x.홍수, 유량자리(x.홍수))} ㎥/s</td>
                  <td>{Number.isFinite(x.여유) ? <b style={{ color: x.여유 >= 1.2 ? 'var(--good, #1a7f37)' : x.여유 >= 1 ? '#b7791f' : 'var(--bad)' }}>{x.여유.toFixed(2)}배</b> : '—'}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </>)}
      </>)}
      <div className="dx3-skip">⚠️ <b>참고용</b> — 땅속 관로 · 암거 · 측량 점 간격에 따라 달라집니다. 수리계산서를 대신하지 않습니다.</div>
    </div>
  )
}

/* ── 6 🎨 기성 색칠 ─────────────────────────────── */
const 기성열쇠 = 'kcm_3d_gisung_v1'
const 기성읽기 = () => { try { return JSON.parse(localStorage.getItem(기성열쇠) || '{}') || {} } catch (e) { return {} } }
const 기성쓰기 = (v) => { try { localStorage.setItem(기성열쇠, JSON.stringify(v)) } catch (e) { /* 개인 창 */ } }
function 기성탭({ 활, C, 보기, 덧그림, 결과, 크기 }) {
  const 노선들 = 활.노선 || []
  const 땅높이 = use땅높이(활)
  const 현장기본 = (결과.파일 && 결과.파일[0] ? 결과.파일[0].replace(/\.(dxf|dwg)$/i, '').slice(0, 30) : '현장')
  const [현장, set현장] = useState(() => { const v = 기성읽기(); const k = Object.keys(v); return k.includes(현장기본) || !k.length ? 현장기본 : k[0] })
  const [모두, set모두] = useState(기성읽기)
  const 기록 = 모두[현장] || []
  const [새, set새] = useState({ 노선: 노선들[0] ? 노선들[0].이름 : '', 시작: '', 끝: '', 공종: '터파기', 날: 오늘(), 메모: '' })
  const [보는날, set보는날] = useState(오늘())
  const [찍기, set찍기] = useState(0)
  const 파일칸 = useRef(null)
  const 저장 = (목록) => { const n = { ...모두, [현장]: 목록 }; set모두(n); 기성쓰기(n) }
  const 더하기 = () => {
    const a = Number(새.시작), b = Number(새.끝)
    if (!새.노선 || !Number.isFinite(a) || !Number.isFinite(b) || a === b) return
    저장([...기록, { ...새, 시작: a, 끝: b, id: Date.now() }]); 세기('|3D활용|기성기록')
    set새({ ...새, 시작: b, 끝: '' })
  }
  /* 3D 에서 두 번 찍어 구간 */
  useEffect(() => {
    const v = 보기()
    if (!v || !찍기) return undefined
    const L = 노선들.find((x) => x.이름 === 새.노선)
    return 찍기걸기(v, (cx, cy) => {
      const P = v.땅고르기(cx, cy)
      if (!P || !L) return
      const q = U.측점찾기(L, P[0] + C[0], P[1] + C[1])
      if (!q) return
      const s = Math.round(q.s * 10) / 10
      if (찍기 === 1) { set새((x) => ({ ...x, 시작: s })); set찍기(2) } else { set새((x) => ({ ...x, 끝: s })); set찍기(0) }
    })
  }, [찍기, 새.노선, 활, C])   // eslint-disable-line react-hooks/exhaustive-deps
  const 결 = useMemo(() => U.기성셈(기록, 활, 보는날), [기록, 활, 보는날])
  useEffect(() => {
    const 칸 = new Map(U.공종들.map((g, i) => [g.k, i]))
    const s = [], 색 = []
    for (const r of 기록) {
      if (String(r.날) > String(보는날)) continue
      const L = 노선들.find((x) => x.이름 === r.노선); if (!L) continue
      const i = 칸.get(r.공종) ?? 5, 옆 = (i - 2.5) * Math.max(1.1, 크기 / 1000 * 0.9), a = Math.min(r.시작, r.끝), b = Math.max(r.시작, r.끝)
      let 앞 = null
      for (let t = a; t <= b + 1e-6; t += Math.max(0.5, (b - a) / 200)) {
        const p = U.노선자리(L, Math.min(t, b)); if (!p) continue
        const x = p.x + p.ty * 옆 * 1000, y = p.y - p.tx * 옆 * 1000, z = 측점높이(활, L, t, 땅높이, p) + 400
        if (앞) { s.push(앞[0], 앞[1], 앞[2], x, y, z); 색.push(U.공종들[i].색) }
        앞 = [x, y, z]
      }
    }
    덧그림('기성', s.length ? 선층('기성', s, (k) => 색[k], C, 크기 * 0.6) : null)
    return () => 덧그림('기성', null)
  }, [기록, 보는날, 활, C])   // eslint-disable-line react-hooks/exhaustive-deps
  const 내보내기 = () => { 파일받기(`기성기록_${현장.replace(/[\\/:*?"<>|]/g, '_')}.json`, JSON.stringify({ 현장, 기록, at: Date.now(), 꼴: 'kcm-3d-gisung-1' }, null, 1), 'application/json'); 세기('|3D활용|기성파일') }
  const 들여오기 = async (f) => {
    if (!f) return
    try { const v = JSON.parse(await f.text()); if (v && Array.isArray(v.기록)) { const n = { ...모두, [v.현장 || 현장]: v.기록 }; set모두(n); 기성쓰기(n); set현장(v.현장 || 현장) } } catch (e) { /* 다른 파일 */ }
  }
  const 엑셀 = () => { 받기엑셀(`기성_${현장}`, (m) => [
    { name: '공종별 기성', head: ['노선', '공종', '한 길이(m)', '전체(m)', '몫(%)', '한 부피(㎥)', '전체 부피(㎥)', '부피를 잰 구간(횡단)'], rows: 결.map((x) => [x.노선, x.공종, m.소수칸(x.한), m.소수칸(x.전체), m.소수칸(x.몫 * 100), Number.isFinite(x.부피) ? m.소수칸(x.부피) : '', Number.isFinite(x.부피전체) ? m.소수칸(x.부피전체) : '', x.부피범위 ? `${x.부피범위[0]} ~ ${x.부피범위[1]} m` : '']), widths: [22, 10, 10, 10, 8, 12, 12, 16] },
    { name: '기록', head: ['날', '노선', '공종', '시작(m)', '끝(m)', '메모'], rows: 기록.map((r) => [r.날, r.노선, r.공종, m.소수칸(r.시작), m.소수칸(r.끝), r.메모 || '']), widths: [11, 22, 10, 9, 9, 30] },
  ], `${보는날} 까지 기록 — 다시 셀 때는 사이트에서`); 세기('|3D활용엑셀|기성') }
  if (!노선들.length) return 없음('측점(NO.) 이 있는 노선이 없습니다 — 계획평면도 · 종평면도(측점 글자 + 중심선)를 넣으면 노선 구간으로 기록할 수 있습니다.')
  return (
    <div className="ux3-in">
      <p className="dx3-bsub">한 일을 <b>노선 · 측점 구간 · 공종 · 날</b>로 적으면 3D 노선 옆에 공종 색으로 칠하고, 공종별 <b>기성률(길이 · 부피)</b>을 셉니다.
        기록은 <b>이 브라우저</b>에 남고(서버 없음), «기록 파일» 로 다른 컴퓨터에 옮길 수 있습니다. 도면을 바꿔 올려도 노선 이름 + 측점으로 다시 붙습니다.</p>
      <div className="ux3-row">
        <label>현장 <input value={현장} onChange={(e) => set현장(e.target.value.slice(0, 30) || '현장')} style={{ width: 150 }} /></label>
        <label>보는 날 <input type="date" value={보는날} onChange={(e) => set보는날(e.target.value || 오늘())} /></label>
        <button type="button" className="chip" onClick={내보내기}>💾 기록 파일</button>
        <button type="button" className="chip" onClick={() => 파일칸.current && 파일칸.current.click()}>📂 기록 불러오기</button>
        <input ref={파일칸} type="file" accept=".json" className="sr-only" onChange={(e) => { 들여오기(e.target.files && e.target.files[0]); e.target.value = '' }} />
        {결.length > 0 && <button type="button" className="chip on" onClick={엑셀}>📗 엑셀</button>}
      </div>
      <div className="ux3-row ux3-form">
        <select value={새.노선} onChange={(e) => set새({ ...새, 노선: e.target.value })}>{노선들.map((L) => <option key={L.이름} value={L.이름}>{L.이름}</option>)}</select>
        <input type="number" step="0.1" placeholder="시작 m" value={새.시작} onChange={(e) => set새({ ...새, 시작: e.target.value })} style={{ width: 84 }} />
        <span>~</span>
        <input type="number" step="0.1" placeholder="끝 m" value={새.끝} onChange={(e) => set새({ ...새, 끝: e.target.value })} style={{ width: 84 }} />
        <button type="button" className={'chip' + (찍기 ? ' on' : '')} onClick={() => set찍기(찍기 ? 0 : 1)}>{찍기 === 1 ? '① 3D 에서 시작 점을 누르세요' : 찍기 === 2 ? '② 끝 점을 누르세요' : '📍 3D 에서 찍기'}</button>
        <select value={새.공종} onChange={(e) => set새({ ...새, 공종: e.target.value })}>{U.공종들.map((g) => <option key={g.k} value={g.k}>{g.k}</option>)}</select>
        <input type="date" value={새.날} onChange={(e) => set새({ ...새, 날: e.target.value || 오늘() })} />
        <input placeholder="메모" value={새.메모} onChange={(e) => set새({ ...새, 메모: e.target.value.slice(0, 60) })} style={{ width: 120 }} />
        <button type="button" className="btn sm" onClick={더하기}>➕ 적기</button>
      </div>
      <div className="ux3-legend">{U.공종들.map((g) => <span key={g.k}><i style={{ background: `rgb(${g.색.join(',')})` }} />{g.k}</span>)}</div>
      {결.length > 0 && (
        <div className="ux3-tbl">
          <table className="tbl left">
            <thead><tr><th>노선 · 공종</th><th>한 길이</th><th>기성률</th><th>부피</th></tr></thead>
            <tbody>{결.map((x, i) => <tr key={i}><td>{x.노선} · <b>{x.공종}</b></td><td>{쉼(x.한, 1)} / {쉼(x.전체, 1)} m</td><td><b>{(x.몫 * 100).toFixed(1)}%</b></td><td>{Number.isFinite(x.부피) ? <>{`${쉼(x.부피, 1)} / ${쉼(x.부피전체, 1)} ㎥`}{x.부피범위 && (x.부피범위[0] > (노선들.find((L) => L.이름 === x.노선) || { 범위: [0] }).범위[0] + 0.5 || x.부피범위[1] < (노선들.find((L) => L.이름 === x.노선) || { 범위: [0, 0] }).범위[1] - 0.5) ? <div className="muted" style={{ fontSize: 11 }}>횡단이 있는 {쉼(x.부피범위[0], 0)} ~ {쉼(x.부피범위[1], 0)} m 만</div> : null}</> : '—'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {기록.length > 0 && (
        <div className="ux3-tbl">
          <table className="tbl left">
            <thead><tr><th>날</th><th>노선 · 구간</th><th>공종</th><th>메모</th><th></th></tr></thead>
            <tbody>{[...기록].sort((a, b) => String(b.날).localeCompare(String(a.날))).map((r) => (
              <tr key={r.id || r.날 + r.시작} className={String(r.날) > 보는날 ? 'off' : ''}><td>{r.날}</td><td>{r.노선}<div className="muted" style={{ fontSize: 11.5 }}>{쉼(r.시작, 1)} ~ {쉼(r.끝, 1)} m</div></td><td>{r.공종}</td><td>{r.메모}</td>
                <td><button type="button" className="dx3-only" aria-label="이 기록 지우기" onClick={() => 저장(기록.filter((x) => x !== r))}>✕</button></td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── 7 📷 사진 위치 ─────────────────────────────── */
function 사진탭({ 활, C, 보기, 덧그림, 크기 }) {
  const [사진, set사진] = useState([])          // [{이름, url, 날, 위도, 경도, x, y, 원, 노선, s, 옆, d, 손}]
  const [찍을, set찍을] = useState(-1)
  const 땅높이 = use땅높이(활)
  const 범위 = useMemo(() => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    const 넣 = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    for (const L of 활.노선 || []) for (let i = 0; i < L.줄.length; i += 5) 넣(L.줄[i + 1], L.줄[i + 2])
    if (활.땅) for (let i = 0; i < 활.땅.점.length; i += 3) 넣(활.땅.점[i], 활.땅.점[i + 1])
    if (!Number.isFinite(x0)) return null
    const a = U.측량좌표(x0, y0, 활.바꿈), b = U.측량좌표(x1, y1, 활.바꿈)
    return [Math.min(a.X, b.X), Math.min(a.Y, b.Y), Math.max(a.X, b.X), Math.max(a.Y, b.Y)]
  }, [활])
  const 자리매김 = (p, x, y, 손 = false) => {
    let best = null
    for (const L of 활.노선 || []) { const q = U.측점찾기(L, x, y); if (q && (!best || q.d < best.q.d)) best = { L, q } }
    /* 폰 GPS 는 5 ~ 10 m 어긋나므로 측점 · 옆은 0.1 m 로(cm 는 거짓 정밀) */
    const 반 = (v) => Math.round(v * 10) / 10
    return { ...p, x, y, 손, 노선: best ? best.L.이름 : '', s: best ? 반(best.q.s) : NaN, 옆: best ? 반(best.q.옆) : NaN, d: best ? best.q.d : NaN, 간격: best ? best.L.간격 : 20 }
  }
  const 넣기 = async (fs) => {
    const 새 = []
    for (const f of [...(fs || [])].slice(0, 80)) {
      if (!/\.(jpe?g)$/i.test(f.name) && !/jpeg/.test(f.type)) continue
      const g = U.사진GPS(new Uint8Array(await f.slice(0, 256 * 1024).arrayBuffer()))
      let p = { 이름: f.name, url: URL.createObjectURL(f), 날: g.날 ? g.날.slice(0, 16).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3') : '', 위도: g.위도, 경도: g.경도 }
      if (Number.isFinite(g.위도) && 활.실좌표 && 범위) {
        const o = U.원점고르기(g.위도, g.경도, 범위)
        if (o) { const d = U.도면좌표(o.p.X, o.p.Y, 활.바꿈); p = 자리매김({ ...p, 원: o.원.이름 }, d.x, d.y) }
        else p.밖 = true
      }
      새.push(p)
    }
    set사진((a) => [...a, ...새]); if (새.length) 세기('|3D활용|사진')
  }
  useEffect(() => {
    const v = 보기()
    if (!v || 찍을 < 0) return undefined
    return 찍기걸기(v, (cx, cy) => {
      const P = v.땅고르기(cx, cy)
      if (!P) return
      set사진((a) => a.map((p, i) => (i === 찍을 ? 자리매김(p, P[0] + C[0], P[1] + C[1], true) : p)))
      set찍을(-1)
    })
  }, [찍을, 활, C])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const 점 = 사진.filter((p) => Number.isFinite(p.x)).map((p) => { const z = 땅높이 ? 땅높이(p.x, p.y) : NaN; const zz = Number.isFinite(z) ? z * 1000 : 0; return [p.x, p.y, zz, zz + 크기 * 5] })
    덧그림('사진', 점.length ? 선층('사진', 막대들(점, 크기), [230, 80, 220], C, 크기 / 5) : null)
    return () => 덧그림('사진', null)
  }, [사진, 활, C])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { for (const p of 사진) try { URL.revokeObjectURL(p.url) } catch (e) { /* 없음 */ } }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 도면을 더하거나 빼 다시 세우면 측점을 다시 잼(자리 x · y 는 그대로) */
  const 처음 = useRef(true)
  useEffect(() => { if (처음.current) { 처음.current = false; return } set사진((a) => a.map((p) => (Number.isFinite(p.x) ? 자리매김(p, p.x, p.y, p.손) : p))) }, [활])   // eslint-disable-line react-hooks/exhaustive-deps
  const 위치글 = (p) => (Number.isFinite(p.s) ? `${p.노선} ${U.측점글(p.s, p.간격)}${Math.abs(p.옆) >= 0.5 ? ` ${p.옆 > 0 ? '오른쪽' : '왼쪽'} ${Math.abs(p.옆).toFixed(1)} m` : ''}` : '')
  const 엑셀 = () => { 받기엑셀('사진_위치표', (m) => [{ name: '사진 위치', head: ['사진', '찍은 때', '위도', '경도', 'X(북)', 'Y(동)', '노선', '측점', '옆(m · 오른쪽 +)', '노선에서(m)', '어떻게'],
    rows: 사진.map((p) => { const c = Number.isFinite(p.x) ? U.측량좌표(p.x, p.y, 활.바꿈) : null; return [p.이름, p.날 || '', Number.isFinite(p.위도) ? { v: p.위도, st: m.ST.PLAIN } : '', Number.isFinite(p.경도) ? { v: p.경도, st: m.ST.PLAIN } : '', c ? 좌표칸(m, c.X) : '', c ? 좌표칸(m, c.Y) : '', p.노선 || '', Number.isFinite(p.s) ? U.측점글(p.s, p.간격) : '', Number.isFinite(p.옆) ? m.소수칸(p.옆) : '', Number.isFinite(p.d) ? m.소수칸(p.d) : '', p.손 ? '3D 에서 찍음' : Number.isFinite(p.위도) ? `사진 GPS(${p.원 || ''})` : 'GPS 없음'] }),
    widths: [24, 16, 11, 11, 13, 13, 18, 12, 10, 10, 18] }], '폰 GPS 는 5~10 m 어긋날 수 있음 — 다시 셀 때는 사이트에서'); 세기('|3D활용엑셀|사진') }
  return (
    <div className="ux3-in">
      <p className="dx3-bsub">폰으로 찍은 <b>원본 사진(JPG)</b>을 넣으면 사진 안의 GPS 로 3D 위에 📍(분홍 막대)을 꽂고 <b>«NO.3+15 오른쪽 5 m»</b> 같은 위치를 적습니다.
        GPS 가 없는 사진은 «📍 찍기» 로 3D 에서 자리를 누르면 됩니다. 사진은 이 브라우저 안에서만 읽습니다.</p>
      {!활.실좌표 && <div className="dx3-warn">⚠️ 측량 자료 없이 세운 도면이라 사진 GPS 로 자리를 못 잡습니다 — «📍 찍기» 로만 됩니다(측량성과표 · 측량도면을 같이 넣으면 GPS 로).</div>}
      <div className="ux3-row">
        <label className="btn sm" style={{ cursor: 'pointer' }}>📷 사진 넣기(JPG · 여러 장)<input type="file" accept=".jpg,.jpeg,image/jpeg" multiple className="sr-only" onChange={(e) => { 넣기(e.target.files); e.target.value = '' }} /></label>
        {사진.length > 0 && <button type="button" className="chip on" onClick={엑셀}>📗 위치표 엑셀</button>}
        {사진.length > 0 && <button type="button" className="chip" onClick={() => set사진([])}>모두 빼기</button>}
      </div>
      {사진.length > 0 && (
        <div className="ux3-tbl">
          <table className="tbl left">
            <thead><tr><th>사진</th><th>찍은 때</th><th>위치</th><th></th></tr></thead>
            <tbody>{사진.map((p, i) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap' }}><img src={p.url} alt="" style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 4, verticalAlign: 'middle', marginRight: 6 }} />{p.이름.slice(0, 24)}</td>
                <td>{p.날 || '—'}</td>
                <td>{위치글(p) ? <><b>{위치글(p)}</b><div className="muted" style={{ fontSize: 11.5 }}>{p.손 ? '3D 에서 찍음' : `사진 GPS · ${p.원 || ''}`}{Number.isFinite(p.d) && p.d > 30 ? ` · 노선에서 ${p.d.toFixed(0)} m` : ''}</div></>
                  : p.밖 ? <span className="muted">GPS 가 현장 범위 밖 — «📍 찍기»</span> : Number.isFinite(p.위도) ? <span className="muted">GPS 있음 · 자리 못 잡음 — «📍 찍기»</span> : <span className="muted">GPS 없음(카톡 · 편집한 사진) — «📍 찍기»</span>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className={'chip' + (찍을 === i ? ' on' : '')} onClick={() => set찍을(찍을 === i ? -1 : i)}>{찍을 === i ? '3D 에서 누르세요' : '📍 찍기'}</button>
                  {위치글(p) && <button type="button" className="dx3-only" onClick={() => { try { navigator.clipboard.writeText(위치글(p)) } catch (e) { /* 없음 */ } }}>복사</button>}
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      <div className="dx3-skip">폰 GPS 는 5~10 m 어긋날 수 있습니다. 카톡 · 편집 앱을 거친 사진은 GPS 가 지워져 있어 원본 파일이 필요합니다. 위치 글은 <Link to="/tools/photo">📷 사진대지</Link> 칸에 붙여 쓰시면 됩니다.</div>
    </div>
  )
}

/* ── 8 🦺 안전 그림 ─────────────────────────────── */
function 안전탭({ 활, C, 보기, 덧그림, 크기 }) {
  const [흙, set흙] = useState(1)
  const n = U.굴착기울기[흙].n
  const 줄 = useMemo(() => U.굴착검토(활, n), [활, n])
  const [장비, set장비] = useState([])          // [{이름, 반, x, y, z}]
  const [새, set새] = useState({ 이름: '크레인', 반: 20 })
  const [찍기, set찍기] = useState(false)
  useEffect(() => {
    const v = 보기()
    if (!v || !찍기) return undefined
    return 찍기걸기(v, (cx, cy) => {
      const P = v.땅고르기(cx, cy)
      if (!P) return
      set장비((a) => [...a, { ...새, x: P[0] + C[0], y: P[1] + C[1], z: P[2] + C[2] }]); set찍기(false)
    })
  }, [찍기, C])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const s = [], 점 = []
    for (const q of 장비) { s.push(...U.원선(q.x, q.y, q.z + 300, q.반, 96)); 점.push([q.x, q.y, q.z, q.z + 크기 * 5]) }
    덧그림('장비', s.length ? 선층('장비', [...s, ...막대들(점, 크기)], [255, 140, 0], C, 크기 / 5) : null)
    return () => 덧그림('장비', null)
  }, [장비, C, 크기])   // eslint-disable-line react-hooks/exhaustive-deps
  const 그림 = () => {
    const v = 보기(); if (!v) return
    const a = document.createElement('a'); a.href = v.png(); a.download = '안전그림_3D.png'; a.click(); 세기('|3D활용|그림')
  }
  const 엑셀 = () => { 받기엑셀('안전_굴착검토', (m) => [
    { name: '굴착 검토', head: ['노선', '측점', '굴착 깊이(m)', '바닥 폭(m)', `필요 윗폭(m · 1:${n})`, '도면 윗폭(m)', '모자람(m · + 이면 도면이 좁음)', '흙막이 살필 곳(1.5 m 이상)'],
      rows: 줄.map((x) => [x.노선, x.이름, m.소수칸(x.깊이), m.소수칸(x.바닥폭), m.소수칸(x.윗폭), Number.isFinite(x.도면윗폭) ? m.소수칸(x.도면윗폭) : '', Number.isFinite(x.모자람) ? m.소수칸(x.모자람) : '', x.흙막이 ? '예' : '']), widths: [20, 18, 11, 10, 14, 11, 16, 14] },
    { name: '장비 작업 반경', head: ['장비', '반경(m)', 'X(북)', 'Y(동)'], rows: 장비.map((q) => { const c = U.측량좌표(q.x, q.y, 활.바꿈); return [q.이름, m.소수칸(q.반), 좌표칸(m, c.X), 좌표칸(m, c.Y)] }), widths: [16, 9, 14, 14] },
  ], `흙: ${U.굴착기울기[흙].흙}(1:${n}) — 산업안전보건기준에 관한 규칙 별표 11 · 참고 그림(안전 검토는 담당자 확인)`); 세기('|3D활용엑셀|안전') }
  const 깊은 = 줄.filter((x) => x.흙막이).length, 좁은 = 줄.filter((x) => x.모자람 > 0.05).length
  return (
    <div className="ux3-in">
      <p className="dx3-bsub">횡단면도마다 <b>굴착 깊이</b>를 재고, 흙 종류의 <b>굴착면 기울기 기준</b>(산업안전보건기준에 관한 규칙 별표 11)으로 필요한 윗폭을 도면 윗폭과 맞댑니다.
        1.5 m 이상 파는 곳은 <b>흙막이 · 기울기를 살필 곳</b>(건축법 시행규칙 제26조)으로 표시합니다. 크레인 · 굴착기 작업 반경은 3D 에서 자리를 찍어 주황 원으로 그립니다.</p>
      <div className="ux3-row">
        <label>흙 <select value={흙} onChange={(e) => set흙(Number(e.target.value))}>{U.굴착기울기.map((g, i) => <option key={g.흙} value={i}>{g.흙} — 1 : {g.n}</option>)}</select></label>
        {줄.length > 0 && <span className="muted" style={{ fontSize: 12 }}>단면 {줄.length}곳 · 1.5 m 이상 {깊은}곳 · 도면 윗폭이 모자란 곳 {좁은}곳</span>}
        <button type="button" className="chip on" onClick={엑셀}>📗 엑셀</button>
        <button type="button" className="chip" onClick={그림}>🖼 지금 3D 그림 저장</button>
      </div>
      {줄.length > 0 ? (
        <div className="ux3-tbl">
          <table className="tbl left">
            <thead><tr><th>노선 · 측점</th><th>깊이</th><th>바닥 폭</th><th>필요 윗폭</th><th>도면 윗폭</th><th>살필 것</th></tr></thead>
            <tbody>{줄.slice(0, 80).map((x, i) => (
              <tr key={i}><td>{x.노선}<div className="muted" style={{ fontSize: 11.5 }}>{x.이름}</div></td><td><b>{x.깊이.toFixed(2)} m</b></td><td>{x.바닥폭.toFixed(2)} m</td><td>{x.윗폭.toFixed(2)} m</td>
                <td>{Number.isFinite(x.도면윗폭) ? x.도면윗폭.toFixed(2) + ' m' : '—'}</td>
                <td>{x.흙막이 ? '🟠 1.5 m 이상 — 흙막이 · 기울기 ' : ''}{x.모자람 > 0.05 ? `🔴 도면 윗폭 ${x.모자람.toFixed(2)} m 좁음` : ''}{!x.흙막이 && !(x.모자람 > 0.05) ? '✅' : ''}</td></tr>))}</tbody>
          </table>
        </div>
      ) : 없음('굴착 깊이를 잴 횡단면도가 없습니다 — 지반선 · 터파기선이 있는 횡단면도를 넣어 주십시오.')}
      <div className="ux3-row" style={{ marginTop: 8 }}>
        <b style={{ fontSize: 13 }}>작업 반경</b>
        <input value={새.이름} onChange={(e) => set새({ ...새, 이름: e.target.value.slice(0, 20) })} style={{ width: 110 }} placeholder="장비 이름" />
        <label>반경 <input type="number" min="1" step="1" value={새.반} onChange={(e) => set새({ ...새, 반: Math.max(1, Number(e.target.value) || 1) })} style={{ width: 64 }} /> m</label>
        <button type="button" className={'chip' + (찍기 ? ' on' : '')} onClick={() => set찍기(!찍기)}>{찍기 ? '3D 에서 장비 자리를 누르세요' : '📍 3D 에서 자리 찍기'}</button>
        {장비.length > 0 && <button type="button" className="chip" onClick={() => set장비([])}>원 모두 지우기</button>}
      </div>
      {장비.length > 0 && <div className="muted" style={{ fontSize: 12.5 }}>{장비.map((q, i) => `${q.이름} 반경 ${q.반} m`).join(' · ')} — 반경은 장비 제원표(붐 길이 · 인양 하중)로 넣으십시오.</div>}
      <div className="dx3-skip">⚠️ 참고 그림입니다 — 굴착 · 인양 계획과 안전 검토는 담당자가 확인하십시오. 기울기: 모래 1:1.8 · 그 밖의 흙 1:1.2 · 연암 및 풍화암 1:1.0 · 경암 1:0.5(별표 11).</div>
    </div>
  )
}
