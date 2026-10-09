/**
 * /tools/earthcheck — 📐 토공 검산 · 두 측량 땅 면 비교 (G224 · 2026-10-10)
 *
 * 소장님: 「오늘 3D작업 했잖아 그 방법을 이용해서 할 수 있는게 먹가 있지??」 → 「1번 부터 8번까지 설계해서 내일 아침에 알려줘.」
 *         → 「1번부터 8번까지 사이트에 있는 것 처럼 프로그램으로 만들어 놔. 바로 올릴 수 있게.」 (설계 docs/3D응용_설계_261010.md · 1번)
 *
 * ■ 원지반 측량(착공 전)과 나중 측량(현황 · 기성 · 준공) 두 땅 면을 같은 격자 칸에서 맞대어 깎인 양 · 쌓인 양을 셉니다.
 *   기성 검사 · 설계변경 토공 증감 · 사토 반출량(덤프 대수) 확인용.
 * ■ 넣는 것: 측량성과표(엑셀 · CSV · TXT — 점번호 · X · Y · Z) 또는 측량도면(DXF · DWG — 높이 든 점 · 등고선 · 3D 폴리선)
 *   · DXF 는 도면 3D 보기와 같은 일꾼(lib/dxf3d.worker.js)으로 읽어 같은 땅 면(r.활용.땅)을 씀 — 없으면 높이 든 선 꼭짓점.
 * ■ 셈은 lib/활용3d.js(땅만들기 · 격자만들기(틀) · 두면비교 · 블록합 · 토량환산) · 시험 tools/시험_3d활용.mjs ⑫
 * ■ 파일은 이 브라우저 밖으로 안 나감 · 서버 없음.
 * ■ 📊 숨은 누적: |토공검산|비교 · |토공검산|예시 · |토공검산|엑셀 · |토공검산|넘겨받음
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as U from '../lib/활용3d.js'
import { 성과표읽기 } from '../lib/성과표.js'
import { 세기 } from '../lib/받은수.jsx'

const 표끝 = /\.(csv|txt|xlsx|xls)$/i
const 쉼 = (n, d = 0) => (Number.isFinite(n) ? Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—')
const 칸들 = [0.5, 1, 2, 5, 10]

/* 화면을 옮겨 다녀와도 그대로(이 탭 메모리) */
const 기억 = { A: null, B: null, 설정: null }

/** 파일 → 땅 {이름, 점수, 땅: {점, 삼}, 범위, 높이, 출처} */
async function 측량읽기(f, 알려) {
  if (표끝.test(f.name)) {
    const r = await 성과표읽기(f.name, await f.arrayBuffer())
    if (!r || !r.점.length) throw new Error('측량성과표에서 점번호 · X · Y 칸을 찾지 못했습니다 — 첫 줄에 «점명 · X · Y · Z(표고)» 머리가 있는 엑셀 · CSV 로 넣어 주십시오.')
    const 점 = r.점.filter((p) => p.Z != null && Number.isFinite(p.Z)).map((p) => [p.E * 1000, p.N * 1000, p.Z * 1000])
    if (점.length < 12) throw new Error(`표고(Z)가 든 점이 ${점.length}개뿐입니다 — 땅 면을 만들려면 12개 넘게 필요합니다.`)
    return { 점: U.점솎기(점), 출처: '측량성과표', 북동확실: !!r.북동확실 }
  }
  /* DXF · DWG — 도면 3D 보기와 같은 일꾼 */
  let 판 = f
  const 머리 = String.fromCharCode(...new Uint8Array(await f.slice(0, 6).arrayBuffer()))
  if (/^AC10\d\d/.test(머리)) {
    알려('DWG 를 DXF 로 바꾸는 중(큰 도면은 30초~1분)')
    const { DWG바꾸기 } = await import('../lib/dwg바꾸기.js')
    판 = new Blob([(await DWG바꾸기(await f.arrayBuffer(), f.name)).dxf])
  }
  알려('도면 읽는 중')
  const r = await new Promise((res, rej) => {
    const w = new Worker(new URL('../lib/dxf3d.worker.js', import.meta.url), { type: 'module' })
    w.onmessage = (ev) => {
      const m = ev.data
      if (m.type === 'prog') 알려(`도면 읽는 중 ${Math.round((m.p || 0) * 100)}%`)
      else if (m.type === 'err') { w.terminate(); rej(new Error(m.kind === 'bindxf' ? '바이너리 DXF 입니다 — 캐드에서 ASCII DXF 로 저장해 주십시오.' : '도면을 읽지 못했습니다 — 다른 판(2013 · 2018) DXF 로 저장해 다시 넣어 주십시오.')) }
      else if (m.type === 'done') { w.terminate(); res(m.r) }
    }
    w.onerror = (e) => { w.terminate(); rej(new Error(String(e.message || '도면을 읽다가 멈췄습니다'))) }
    w.postMessage({ files: [{ name: f.name.replace(/\.dwg$/i, '.dxf'), blob: 판 }], 성과: null })
  })
  /* ① 일꾼이 만든 측량 땅 면(높이 든 점) */
  const 땅 = r.활용 && r.활용.땅
  if (땅 && 땅.점.length / 3 >= 12) {
    const 점 = []
    for (let i = 0; i < 땅.점.length; i += 3) 점.push([땅.점[i], 땅.점[i + 1], 땅.점[i + 2]])
    return { 점: U.점솎기(점), 출처: '도면의 높이 든 점' }
  }
  /* ② 없으면 높이 든 선(등고선 · 3D 폴리선)의 꼭짓점 — 화면 좌표(가운데 뺀 값)에 가운데를 되돌림 */
  const C = r.center || [0, 0, 0], 점 = []
  for (const l of r.layers || []) for (const a of [l.pos, l.pts]) {
    if (!a) continue
    for (let i = 0; i < a.length; i += 3) { const z = a[i + 2] + C[2]; if (Math.abs(z) > 1 && Math.abs(z) < 3e6) 점.push([a[i] + C[0], a[i + 1] + C[1], z]) }
  }
  if (점.length < 12) throw new Error('이 도면에는 높이(Z)가 든 점 · 선이 없습니다 — 높이가 든 측량도면(현황 측량점 · 등고선 · 3D 폴리선)이나 측량성과표를 넣어 주십시오.')
  return { 점: U.점솎기(점, 120000, 500), 출처: '도면의 높이 든 선(등고선 · 3D 폴리선)' }
}

function 요약(점) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const [x, y, z] of 점) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
  return { 가로: (x1 - x0) / 1000, 세로: (y1 - y0) / 1000, 낮: z0 / 1000, 높: z1 / 1000 }
}

export default function EarthCheck() {
  const [A, setA] = useState(기억.A)          // {이름, 점, 출처, 땅}
  const [B, setB] = useState(기억.B)
  const [바쁨, set바쁨] = useState({ A: '', B: '' })
  const [오류, set오류] = useState({ A: '', B: '' })
  const [설정, set설정] = useState(기억.설정 || { 칸: 0, 문턱: 0, L: 1.25, C: 0.9, 덤프: 10, 블록: 20 })
  const [고른, set고른] = useState(null)       // 지도에서 누른 칸
  const cvRef = useRef(null)
  const 그림자리 = useRef([0, 0, 1])          /* 지도 안 격자 자리 [ox, oy, k] — 누른 칸 찾기 */
  const 파일A = useRef(null), 파일B = useRef(null)
  useEffect(() => { 기억.A = A; 기억.B = B; 기억.설정 = 설정 }, [A, B, 설정])

  /* 도면 3D 보기 «이 화면의 측량 땅 면을 «전» 으로 넘겨 열기» */
  useEffect(() => {
    try {
      const w = window.__kcm_earth_A
      if (w && w.점 && w.점.length >= 36 && Date.now() - (w.at || 0) < 3600e3) {
        window.__kcm_earth_A = null
        try { sessionStorage.removeItem('kcm_earth_A') } catch (e) { /* 없음 */ }
        const 점 = []
        for (let i = 0; i < w.점.length; i += 3) 점.push([w.점[i], w.점[i + 1], w.점[i + 2]])
        setA({ 이름: w.이름 || '도면 3D 의 측량 땅 면', 점, 출처: '도면 3D 보기에서 넘겨받음', 땅: w.삼 && w.삼.length ? { 점: Float64Array.from(w.점), 삼: Int32Array.from(w.삼) } : U.땅만들기(점) })
        세기('|토공검산|넘겨받음')
        return
      }
      const v = JSON.parse(sessionStorage.getItem('kcm_earth_A') || 'null')
      if (v && Array.isArray(v.점) && v.점.length >= 12 && Date.now() - (v.at || 0) < 3600e3) {
        sessionStorage.removeItem('kcm_earth_A')
        const 땅 = v.삼 && v.삼.length ? { 점: Float64Array.from(v.점.flat()), 삼: Int32Array.from(v.삼) } : U.땅만들기(v.점)
        setA({ 이름: v.이름 || '도면 3D 의 측량 땅 면', 점: v.점, 출처: '도면 3D 보기에서 넘겨받음', 땅 })
        세기('|토공검산|넘겨받음')
      }
    } catch (e) { /* 없음 */ }
  }, [])

  const 넣기 = async (쪽, f) => {
    if (!f) return
    const set = 쪽 === 'A' ? setA : setB
    set오류((o) => ({ ...o, [쪽]: '' })); set고른(null)
    set바쁨((b) => ({ ...b, [쪽]: '읽는 중' }))
    try {
      const r = await 측량읽기(f, (m) => set바쁨((b) => ({ ...b, [쪽]: m })))
      set바쁨((b) => ({ ...b, [쪽]: '땅 면 만드는 중' }))
      await new Promise((ok) => setTimeout(ok, 20))
      const 땅 = U.땅만들기(r.점)
      if (!땅) throw new Error('점을 삼각형으로 잇지 못했습니다(점이 한 줄로만 있음)')
      set({ 이름: f.name, 점: r.점, 출처: r.출처, 땅 })
    } catch (e) {
      set오류((o) => ({ ...o, [쪽]: String(e.message || e) }))
    } finally { set바쁨((b) => ({ ...b, [쪽]: '' })) }
  }
  const 예시 = () => {
    const a = U.가상측량(false), b = U.가상측량(true)
    setA({ 이름: '🧪 예시 — 가상 언덕 원지반 측량(점 651개)', 점: a, 출처: '예시(지어낸 땅)', 땅: U.땅만들기(a) })
    setB({ 이름: '🧪 예시 — 가운데를 EL 55.0 m 로 깎고 메운 뒤 측량', 점: b, 출처: '예시(지어낸 땅)', 땅: U.땅만들기(b) })
    set고른(null); 세기('|토공검산|예시')
  }

  /* 비교 — 같은 틀 격자 */
  const 결 = useMemo(() => {
    if (!A || !B || !A.땅 || !B.땅) return null
    const 겹 = U.겹침보기(A.점, B.점)
    if (겹 === '안겹침') return { 안겹침: true }
    let B땅 = B.땅
    if (겹 === '바꿈') { const p = Float64Array.from(B.땅.점); for (let i = 0; i < p.length; i += 3) { const t = p[i]; p[i] = p[i + 1]; p[i + 1] = t } B땅 = { 점: p, 삼: B.땅.삼 } }
    const s = 요약(A.점)
    const 칸 = 설정.칸 || 칸들.find((k) => (s.가로 / k) * (s.세로 / k) <= 6e5) || 10
    const GA = U.격자만들기(A.땅.점, A.땅.삼, 칸, 1.5e6)
    const GB = U.격자만들기(B땅.점, B땅.삼, 칸, 1.5e6, GA)
    const r = U.두면비교(GA, GB)
    /* 문턱(±cm 안 차이는 뺌) — 두 측량의 점 자리 차이 · 반올림 */
    const 문 = 설정.문턱 / 100, 칸넓이 = (GA.칸 / 1000) ** 2
    let 절토 = 0, 성토 = 0, 넓이 = 0, 깎넓 = 0, 쌓넓 = 0, 큰 = 0
    const 절대 = []
    for (let k = 0; k < r.차.length; k++) {
      const d = r.차[k]
      if (!Number.isFinite(d)) continue
      넓이 += 칸넓이
      절대.push(Math.abs(d))
      if (Math.abs(d) <= 문) continue
      /* 넓이는 1 cm(또는 «작은 차이») 넘게 바뀐 칸만 — 두 측량 점 자리 차이로 생긴 mm 차이까지 넓이에 넣으면 거의 다 «깎이고 쌓인 곳» 이 됨 */
      if (d < 0) { 절토 += -d * 칸넓이; if (-d > Math.max(문, 0.01)) 깎넓 += 칸넓이 } else { 성토 += d * 칸넓이; if (d > Math.max(문, 0.01)) 쌓넓 += 칸넓이 }
    }
    if (문 > 0) for (let k = 0; k < r.차.length; k++) if (Math.abs(r.차[k]) <= 문) r.차[k] = 0
    절대.sort((p, q) => p - q)
    큰 = Math.max(0.1, 절대.length ? 절대[Math.floor(절대.length * 0.97)] : 1)
    const A넓 = GA.z.reduce((n, v) => n + (Number.isFinite(v) ? 1 : 0), 0) * 칸넓이
    return { GA, GB, r: { ...r, 절토, 성토 }, 넓이, A넓, 깎넓, 쌓넓, 큰, 바꿈: 겹 === '바꿈', 칸: GA.칸 / 1000 }
  }, [A, B, 설정.칸, 설정.문턱])
  useEffect(() => { if (결 && !결.안겹침) 세기('|토공검산|비교') }, [결])

  /* 흙 셈 — 성토에 든 본바닥 = 성토 ÷ C · 남는 흙(본바닥) = 절토 − 그것 → × L = 실어 낼 양 */
  const 흙 = useMemo(() => {
    if (!결 || 결.안겹침) return null
    const 성본 = 결.r.성토 / Math.max(0.01, 설정.C)
    const 남 = 결.r.절토 - 성본
    const t = U.토량환산(Math.abs(남), 설정.L, 설정.C, 설정.덤프)
    return { 성본, 남, 흐트러진: t.흐트러진, 대수: t.대수 }
  }, [결, 설정.C, 설정.L, 설정.덤프])

  /* 지도 그리기 — 빨강 = 깎임 · 파랑 = 쌓임 · 위 = 북 */
  useEffect(() => {
    const cv = cvRef.current
    if (!cv || !결 || 결.안겹침) return
    const { GA, r, 큰 } = 결
    const W = 760, H = Math.round(Math.min(760, Math.max(240, W * GA.ny / GA.nx)))
    cv.width = W; cv.height = H
    const g = cv.getContext('2d')
    g.fillStyle = '#f8fafc'; g.fillRect(0, 0, W, H)
    const 판 = document.createElement('canvas'); 판.width = GA.nx; 판.height = GA.ny
    const pg = 판.getContext('2d'), img = pg.createImageData(GA.nx, GA.ny)
    for (let j = 0; j < GA.ny; j++) for (let i = 0; i < GA.nx; i++) {
      const d = r.차[j * GA.nx + i], o = ((GA.ny - 1 - j) * GA.nx + i) * 4
      if (!Number.isFinite(d)) { img.data[o + 3] = 0; continue }
      const t = Math.min(1, Math.abs(d) / 큰)
      const [R, G, Bc] = d < 0 ? [248 - 63 * t, 250 - 222 * t, 252 - 224 * t] : [248 - 219 * t, 250 - 172 * t, 252 - 36 * t]
      img.data[o] = R; img.data[o + 1] = G; img.data[o + 2] = Bc; img.data[o + 3] = 255
    }
    pg.putImageData(img, 0, 0)
    const k = Math.min(W / GA.nx, H / GA.ny), w = GA.nx * k, h = GA.ny * k, ox = (W - w) / 2, oy = (H - h) / 2
    g.imageSmoothingEnabled = GA.nx < W / 2
    g.drawImage(판, ox, oy, w, h)
    /* 축척 막대 · 북 */
    const 길m = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((m) => (m / 결.칸) * k > 70) || 1000
    const 길px = (길m / 결.칸) * k
    g.fillStyle = '#334155'; g.fillRect(14, H - 18, 길px, 4); g.font = '12px sans-serif'; g.fillText(`${길m} m`, 14, H - 24)
    g.fillText('▲ 북', W - 44, 18)
    if (고른) { g.strokeStyle = '#111827'; g.lineWidth = 2; g.strokeRect(ox + 고른.i * k - 4, oy + (GA.ny - 1 - 고른.j) * k - 4, k + 8, k + 8) }
    그림자리.current = [ox, oy, k]
  }, [결, 고른])

  const 누름 = (e) => {
    if (!결 || 결.안겹침) return
    const cv = cvRef.current, rc = cv.getBoundingClientRect()
    const [ox, oy, k] = 그림자리.current
    const px = (e.clientX - rc.left) * (cv.width / rc.width), py = (e.clientY - rc.top) * (cv.height / rc.height)
    const i = Math.floor((px - ox) / k), j = 결.GA.ny - 1 - Math.floor((py - oy) / k)
    if (i < 0 || j < 0 || i >= 결.GA.nx || j >= 결.GA.ny) return
    const n = j * 결.GA.nx + i
    const c = U.측량좌표(결.GA.x0 + (i + 0.5) * 결.GA.칸, 결.GA.y0 + (j + 0.5) * 결.GA.칸)
    set고른({ i, j, X: c.X, Y: c.Y, 전: 결.GA.z[n], 후: 결.GB.z[n], 차: 결.r.차[n] })
  }

  const 엑셀 = async () => {
    if (!결 || 결.안겹침) return
    const m = await import('../lib/값엑셀.js')
    const 블 = U.블록합({ 차: 결.r.차 }, 결.GA, 설정.블록)
    const 좌 = (v) => ({ v: Math.round(v * 1000) / 1000, st: m.ST.PLAIN })
    m.값엑셀받기('토공검산_두측량비교', [
      { name: '총괄', head: ['무엇', '값', '단위', '설명'], rows: [
        ['전(원지반) 측량', A.이름, '', A.출처], ['후(현황 · 기성) 측량', B.이름, '', B.출처],
        ['격자 칸', m.소수칸(결.칸), 'm', '두 측량을 같은 칸 자리에서 맞댐'],
        ['겹친 넓이', m.소수칸(결.넓이), '㎡', `전 측량 넓이 ${쉼(결.A넓)} ㎡ 중`],
        ['작은 차이 빼기', m.소수칸(설정.문턱), 'cm', '이 안의 차이는 셈에서 뺌'],
        [m.굵은칸('깎인 양(절토)'), m.소수칸(결.r.절토), '㎥', `본바닥 · ${Math.max(1, 설정.문턱)} cm 넘게 깎인 곳 ${쉼(결.깎넓)} ㎡`],
        [m.굵은칸('쌓인 양(성토)'), m.소수칸(결.r.성토), '㎥', `다짐 상태 · ${Math.max(1, 설정.문턱)} cm 넘게 쌓인 곳 ${쉼(결.쌓넓)} ㎡`],
        ['성토에 든 본바닥 흙', m.소수칸(흙.성본), '㎥', `쌓인 양 ÷ C(${설정.C})`],
        [m.굵은칸(흙.남 >= 0 ? '남는 흙(본바닥)' : '모자란 흙(본바닥)'), m.소수칸(Math.abs(흙.남)), '㎥', 흙.남 >= 0 ? '사토(밖으로)' : '반입(밖에서)'],
        [흙.남 >= 0 ? '실어 낼 양(흐트러진)' : '들여올 양(흐트러진)', m.소수칸(흙.흐트러진), '㎥', `× L(${설정.L})`],
        ['덤프', m.수칸(흙.대수), '대', `한 대 ${설정.덤프} ㎥`],
      ], widths: [22, 18, 6, 40] },
      { name: `블록별(${설정.블록}m)`, head: ['블록 가운데 X(북)', 'Y(동)', '겹친 넓이(㎡)', '깎인 양(㎥)', '쌓인 양(㎥)', '차(㎥ · 쌓임 +)'],
        rows: 블.map((b) => [좌(b.X), 좌(b.Y), m.소수칸(b.넓이), m.소수칸(b.절토), m.소수칸(b.성토), m.소수칸(b.성토 - b.절토)]), widths: [16, 14, 12, 12, 12, 14] },
    ], { 주소: '/tools/earthcheck', 글: '두 측량 땅 면(삼각형)을 같은 격자 칸에서 맞댄 값 — 다시 셀 때는 사이트에서' })
    세기('|토공검산|엑셀')
  }

  const 상자 = (쪽, 값, 바, 오, 칸Ref) => {
    const s = 값 ? 요약(값.점) : null
    return (
      <div className={'ec-box' + (값 ? ' on' : '')}>
        <b>{쪽 === 'A' ? '① 전 — 원지반 측량(착공 전)' : '② 후 — 현황 · 기성 · 준공 측량'}</b>
        {값 ? (
          <div style={{ marginTop: 4 }}>
            📎 {값.이름}
            <div className="muted" style={{ fontSize: 12 }}>{값.출처} · 점 {쉼(값.점.length)}개 · 삼각형 {쉼(값.땅 ? 값.땅.삼.length / 3 : 0)}개 · 넓이 {쉼(s.가로)} × {쉼(s.세로)} m · 높이 {쉼(s.낮, 2)} ~ {쉼(s.높, 2)} m</div>
          </div>
        ) : <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>측량성과표(엑셀 · CSV · TXT — 점번호 · X · Y · Z) 또는 측량도면(DXF · DWG — 높이 든 점 · 등고선)</div>}
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn sm" onClick={() => 칸Ref.current && 칸Ref.current.click()} disabled={!!바}>{값 ? '📂 다른 파일' : '📂 파일 고르기'}</button>
          {바 && <span className="muted" style={{ fontSize: 12.5 }}>⏳ {바}…</span>}
        </div>
        <input ref={칸Ref} type="file" className="sr-only" tabIndex={-1} accept=".csv,.txt,.xlsx,.xls,.dxf,.dwg,.CSV,.TXT,.XLSX,.XLS,.DXF,.DWG"
               onChange={(e) => { 넣기(쪽, e.target.files && e.target.files[0]); e.target.value = '' }} />
        {오 && <div className="dx3-warn">⚠️ {오}</div>}
      </div>
    )
  }

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📐 토공 검산 <span className="count">· 두 측량 땅 면 비교</span></h1>
        <div className="note sm">
          <b>원지반 측량(착공 전)</b>과 <b>나중 측량(현황 · 기성 · 준공)</b>을 넣으면 두 땅 면을 같은 격자 칸에서 맞대어
          <b> 깎인 양(절토) · 쌓인 양(성토)</b>을 칸마다 재고, 어디가 깎이고 쌓였는지 색 지도로 보여 줍니다.
          기성 검사 · 설계변경 토공 증감 · 사토 반출량(덤프 대수) 확인에 씁니다.
        </div>
        <div className="pdfsafe">🔒 <b>파일은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 셉니다 · 회원가입 없음 · 무료.</div>
        <div className="tlx-ex" style={{ marginTop: 10, marginBottom: 0 }}>
          <span className="tlx-exd"><b>🧪 예시로 해 보기</b> — 측량 파일이 없으시면:</span>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={예시}>⛰ 가상 언덕 — 깎고 메운 터</button>
        </div>
      </div>

      <div className="card">
        <div className="ec-two">
          {상자('A', A, 바쁨.A, 오류.A, 파일A)}
          {상자('B', B, 바쁨.B, 오류.B, 파일B)}
        </div>
        <div className="ec-row">
          <label>격자 칸 <select value={설정.칸} onChange={(e) => set설정({ ...설정, 칸: Number(e.target.value) })}><option value={0}>알아서</option>{칸들.map((k) => <option key={k} value={k}>{k} m</option>)}</select></label>
          <label>작은 차이 빼기 <select value={설정.문턱} onChange={(e) => set설정({ ...설정, 문턱: Number(e.target.value) })}>{[0, 2, 5, 10].map((v) => <option key={v} value={v}>{v ? `±${v} cm 안` : '안 뺌'}</option>)}</select></label>
          <span className="muted">두 측량이 <b>겹친 곳만</b> 셉니다</span>
        </div>
      </div>

      {결 && 결.안겹침 && (
        <div className="card"><div className="dx3-warn" style={{ marginTop: 0 }}>⚠️ 두 측량의 자리가 겹치지 않습니다 — 둘 다 <b>같은 측량 좌표</b>(같은 원점 · 세계측지계)인지 확인해 주십시오. 한쪽이 옛 좌표(베셀)거나 현장 임의 좌표면 맞대지 못합니다.</div></div>
      )}

      {결 && !결.안겹침 && (
        <div className="card">
          {결.바꿈 && <div className="dx3-warn" style={{ marginTop: 0 }}>ℹ️ ② 측량의 X · Y 를 바꿔 읽었습니다(한쪽은 측량 꼴 X = 북, 다른 쪽은 캐드 꼴 x = 동으로 보여서) — 그래야 두 측량이 겹칩니다.</div>}
          <div className="ec-sum">
            <div>깎인 양(절토 · 본바닥)<b style={{ color: '#b91c1c' }}>{쉼(결.r.절토, 1)} ㎥</b><span className="muted">{Math.max(1, 설정.문턱)} cm 넘게 깎인 곳 {쉼(결.깎넓)} ㎡</span></div>
            <div>쌓인 양(성토 · 다짐)<b style={{ color: '#1d4ed8' }}>{쉼(결.r.성토, 1)} ㎥</b><span className="muted">{Math.max(1, 설정.문턱)} cm 넘게 쌓인 곳 {쉼(결.쌓넓)} ㎡</span></div>
            <div>{흙.남 >= 0 ? '남는 흙(본바닥)' : '모자란 흙(본바닥)'}<b>{쉼(Math.abs(흙.남), 1)} ㎥</b><span className="muted">{흙.남 >= 0 ? '사토 — 밖으로' : '반입 — 밖에서'}</span></div>
            <div>{흙.남 >= 0 ? '실어 낼 양' : '들여올 양'}(흐트러진)<b>{쉼(흙.흐트러진, 1)} ㎥</b><span className="muted">덤프 {쉼(흙.대수)}대</span></div>
            <div>겹친 넓이<b>{쉼(결.넓이)} ㎡</b><span className="muted">칸 {결.칸} m · 전 측량의 {결.A넓 > 0 ? Math.round(결.넓이 / 결.A넓 * 100) : 0}%</span></div>
          </div>
          <div className="ec-row">
            <label>흐트러진 L <input type="number" step="0.05" min="1" max="2" value={설정.L} onChange={(e) => set설정({ ...설정, L: Number(e.target.value) || 1.25 })} style={{ width: 64 }} /></label>
            <label>다짐 C <input type="number" step="0.05" min="0.5" max="1.2" value={설정.C} onChange={(e) => set설정({ ...설정, C: Number(e.target.value) || 0.9 })} style={{ width: 64 }} /></label>
            <label>덤프 한 대 <input type="number" step="0.5" min="1" value={설정.덤프} onChange={(e) => set설정({ ...설정, 덤프: Math.max(1, Number(e.target.value) || 10) })} style={{ width: 64 }} /> ㎥(흐트러진)</label>
            <span className="muted">L · C 는 흙 종류마다 다릅니다 — 설계서 · 표준품셈 토량환산계수 값으로 바꾸십시오</span>
          </div>
          <canvas ref={cvRef} className="ec-map" onClick={누름} aria-label="깎이고 쌓인 곳 지도 — 빨강 깎임 · 파랑 쌓임" />
          <div className="ec-leg"><span>깎임 −{쉼(결.큰, 2)} m</span><b /><span>쌓임 +{쉼(결.큰, 2)} m</span></div>
          {고른 ? (
            <div className="dx3-st ok" style={{ display: 'block', textAlign: 'center', marginTop: 6, fontSize: 13 }}>
              📍 X(북) {쉼(고른.X, 2)} · Y(동) {쉼(고른.Y, 2)} — 전 {Number.isFinite(고른.전) ? 쉼(고른.전, 2) + ' m' : '없음'} · 후 {Number.isFinite(고른.후) ? 쉼(고른.후, 2) + ' m' : '없음'}
              {Number.isFinite(고른.차) && <> · <b>{고른.차 < 0 ? '깎임 ' : '쌓임 '}{쉼(Math.abs(고른.차), 2)} m</b></>}
            </div>
          ) : <div className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 6 }}>지도를 누르면 그 자리의 전 · 후 높이를 봅니다 · 위 = 북</div>}
          <div className="ec-row" style={{ justifyContent: 'center' }}>
            <label>엑셀 블록 <select value={설정.블록} onChange={(e) => set설정({ ...설정, 블록: Number(e.target.value) })}>{[10, 20, 50].map((v) => <option key={v} value={v}>{v} m</option>)}</select></label>
            <button type="button" className="btn sm" onClick={엑셀}>📗 엑셀로 받기(총괄 · 블록별)</button>
          </div>
          <div className="dx3-skip">
            ⚠️ 두 측량의 <b>점 자리가 달라</b> 땅을 안 건드린 곳도 조금씩(보통 1 cm 안팎) 깎이고 쌓인 것으로 잡힙니다 — «작은 차이 빼기» 로 거를 수 있습니다.
            측량 점이 성긴 곳(비탈 어깨 · 끝)은 삼각형으로 이어 잰 값이라 실제와 다를 수 있습니다. 제출 전에 측량 성과 · 설계 수량과 맞대어 보십시오.
          </div>
        </div>
      )}

      <div className="card">
        <div className="detail-h">어떻게 재나</div>
        <ol className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li>두 측량의 높이 든 점을 각각 <b>삼각형으로 이어</b> 땅 면을 만듭니다(점이 없는 빈 곳은 잇지 않음).</li>
          <li>전 측량 범위에 <b>격자 칸</b>(넓이에 맞춰 0.5 ~ 10 m)을 깔고, 칸 가운데에서 두 땅 면의 높이를 잽니다.</li>
          <li>칸마다 <b>(후 − 전) × 칸 넓이</b> — 빼기면 깎인 양, 더하기면 쌓인 양으로 모읍니다(두 측량이 겹친 칸만).</li>
          <li>성토에 든 본바닥 흙 = 쌓인 양 ÷ C · 남는 흙 = 깎인 양 − 그것 · 실어 낼 양 = 남는 흙 × L · 덤프 대수 = 실어 낼 양 ÷ 한 대.</li>
        </ol>
        <p className="tl-p" style={{ marginTop: 8 }}>
          도면 3D 보기에 측량 자료를 넣고 세웠다면, 그 화면 아래 <b>«🧰 3D 로 더 하기 → 📐 토공 검산»</b>에서 그 땅 면을 «전» 으로 바로 넘길 수 있습니다.
          횡단면도로 잰 평균단면법 물량과 나란히 보면 검산이 됩니다.
        </p>
      </div>

      <div className="card">
        <div className="navrow">
          <Link className="navi" to="/tools/dxf3d">📦 도면 3D 보기</Link>
          <Link className="navi" to="/tools">🧰 다른 도구</Link>
          <Link className="navi" to="/jeoksan">📐 적산</Link>
        </div>
      </div>
    </div>
  )
}
