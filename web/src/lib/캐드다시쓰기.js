/**
 * 🛠 캐드 고치기 ② — 깨끗하게 다시 쓰기(판 바꾸기 · R12 ~ 2018 DXF) (2026-10-17)
 *
 * 소장님: 「크몽보다 좋아야 해. 반드시, 대충만들지마」 — 크몽 «버전다운» 은 사람이 AutoCAD 로 다시 저장해 줌.
 *
 * ■ 어떻게
 *   읽은 도면(lib/캐드고침.js 나누기)에서 층 · 선 종류 · 글꼴 · 치수 꼴 · 블록 · 도형을 하나씩 꺼내
 *   고른 판의 빈 틀(lib/dxf판틀.js — ezdxf 가 만든 «AutoCAD 가 여는 꼴»)에 그 판에 맞는 코드로만 다시 씁니다.
 *   · 손잡이(5) · 주인(330)은 새로 매김 — 원본의 사전 · 반응자(102) · 다른 프로그램 꼬리(XDATA)는 버림(치수 덮어쓰기 ACAD DSTYLE 만 남김)
 *   · 그 판에 없는 도형은 모양이 같게 바꿔 씀
 *       R12: 가벼운 폴리선 → 폴리선 · 타원 · 스플라인 → 잘게 나눈 폴리선 · 여러 줄 글 → 한 줄 글들 · 해치 → 선(무늬) · 채움(면) 블록 ·
 *            치수 · 표 → 같은 모양 블록 끼우기 · 지시선 → 폴리선 + 화살 · 무한선 → 아주 긴 선
 *       모든 판: 다중선(MLINE) → 폴리선 · 다중 지시선(MLEADER) → 선 + 글 + 화살 · 표(ACAD_TABLE) → 블록 끼우기
 *   · 못 옮기는 것(붙인 그림 · 가림막 · 입체(ACIS) · OLE · 다른 프로그램 전용 도형)은 세어서 알림
 *   · 배치(종이 공간)는 지금 열린 배치 하나(뷰포트 포함) — 나머지 배치는 알림
 * ■ 글: 2007 판부터 UTF-8 · 그 전은 CP949(ANSI_949) — CP949 에 없는 글자는 \U+XXXX
 * ■ 시험: node tools/시험_캐드고침.mjs (ezdxf 로 다시 읽어 audit · 그림 견주기)
 */
import { 판틀, ACI색 } from './dxf판틀.js'
import { 값, 수, 모두, 머리, 풀린글, 싸기, 글꼴판, 가족글꼴파일, 판목록, 윈도우글꼴, 기호인가 } from './캐드고침.js'
export { 판목록 }


/* ───────────────────────────── 작은 도움 */

const 수글 = (x) => {
  if (!Number.isFinite(x)) return '0.0'
  if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x)
  const s = String(x)
  return s
}
const 기본법선 = (n) => Math.abs(n[0]) < 1e-12 && Math.abs(n[1]) < 1e-12 && Math.abs(n[2] - 1) < 1e-12
const 점 = (e, c, 기 = 0) => [수(e, c, 기), 수(e, c + 10, 기), 수(e, c + 20, 0)]
const 있나 = (e, c) => { for (const p of e.g) if (p[0] === c) return true; return false }
/** 마커(100 …) 다음부터 다음 마커 · 1001 앞까지 */
function 마커뒤(e, 마커, 끝까지 = false) {
  const out = []
  let i = e.g.findIndex((p) => p[0] === 100 && p[1] === 마커)
  if (i < 0) return null
  for (i++; i < e.g.length; i++) {
    const [c] = e.g[i]
    if (c === 1001) break
    if (c === 100 && !끝까지) break
    out.push(e.g[i])
  }
  return out
}
/** XDATA(1001 부터) 묶음들 [{앱, 짝}] */
function 꼬리들(e) {
  const out = []
  let 지금 = null
  for (const p of e.g) {
    if (p[0] === 1001) { 지금 = { 앱: p[1], 짝: [] }; out.push(지금); continue }
    if (지금 && p[0] >= 1000) 지금.짝.push(p)
  }
  return out
}

/* OCS → WCS (임의 축 방법) */
function ocs축(n) {
  const ax = 단위(Math.abs(n[0]) < 1 / 64 && Math.abs(n[1]) < 1 / 64 ? 외적([0, 1, 0], n) : 외적([0, 0, 1], n))
  const ay = 단위(외적(n, ax))
  return [ax, ay, n]
}
const 외적 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const 단위 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
function ocs바꿈(n) {
  if (기본법선(n)) return (p) => p
  const [ax, ay, az] = ocs축(n)
  return (p) => [p[0] * ax[0] + p[1] * ay[0] + (p[2] || 0) * az[0], p[0] * ax[1] + p[1] * ay[1] + (p[2] || 0) * az[1], p[0] * ax[2] + p[1] * ay[2] + (p[2] || 0) * az[2]]
}

/* ACI — 참색(정수 RGB) → 가까운 색 번호 */
const aci표 = ACI색.map((h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)])
export function 가까운색(rgb) {
  const r = (rgb >> 16) & 255, g = (rgb >> 8) & 255, b = rgb & 255
  let 가장 = 7, 거리 = Infinity
  for (let i = 1; i < 256; i++) {
    const [R, G, B] = aci표[i]
    const d = (R - r) ** 2 * 0.3 + (G - g) ** 2 * 0.59 + (B - b) ** 2 * 0.11
    if (d < 거리) { 거리 = d; 가장 = i }
  }
  return 가장
}

/* 활 볼록(bulge) 사이 점들 */
function 볼록점들(p, q, b, 나눔 = 16) {
  if (!b || Math.abs(b) < 1e-9) return []
  const 각 = 4 * Math.atan(b)                                  // 끼인각(부호 = 방향 · + 는 반시계)
  const dx = q[0] - p[0], dy = q[1] - p[1]
  const 현 = Math.hypot(dx, dy)
  if (현 < 1e-12) return []
  const r = 현 / (2 * Math.abs(Math.sin(각 / 2)))
  const d = 현 / (2 * Math.tan(각 / 2))                        // 현 가운데에서 중심까지(왼쪽 +)
  const cx = (p[0] + q[0]) / 2 - dy / 현 * d, cy = (p[1] + q[1]) / 2 + dx / 현 * d
  const a0 = Math.atan2(p[1] - cy, p[0] - cx)
  const n = Math.max(2, Math.ceil(나눔 * Math.abs(각) / (Math.PI / 2)))
  const out = []
  for (let i = 1; i < n; i++) { const a = a0 + 각 * i / n; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) }
  return out
}

/* NURBS 점 (de Boor) */
function 스플라인점들(차수, 매듭, 조절, 무게, 몇 = 0) {
  const n = 조절.length
  if (n < 2) return 조절.slice()
  const p = Math.min(차수, n - 1)
  let U = 매듭
  if (!U || U.length !== n + p + 1) { U = []; for (let i = 0; i <= n + p; i++) U.push(i <= p ? 0 : i >= n ? n - p : i - p) }
  const W = 무게 && 무게.length === n ? 무게 : null
  const a = U[p], b = U[n]
  const 수 = 몇 || Math.min(2000, Math.max(24, n * 8))
  const out = []
  for (let k = 0; k <= 수; k++) {
    const t = k === 수 ? b : a + (b - a) * k / 수
    let s = p
    while (s < n - 1 && U[s + 1] <= t) s++
    const d = []
    for (let j = 0; j <= p; j++) {
      const P = 조절[s - p + j], w = W ? W[s - p + j] : 1
      d.push([P[0] * w, P[1] * w, (P[2] || 0) * w, w])
    }
    for (let r = 1; r <= p; r++) for (let j = p; j >= r; j--) {
      const i = s - p + j
      const den = U[i + p - r + 1] - U[i]
      const al = den === 0 ? 0 : (t - U[i]) / den
      for (let c = 0; c < 4; c++) d[j][c] = (1 - al) * d[j - 1][c] + al * d[j][c]
    }
    const q = d[p]
    out.push([q[0] / q[3], q[1] / q[3], q[2] / q[3]])
  }
  return out
}

/* 여러 줄 글(MTEXT) 서식 → 줄들(맨 글) */
export function 엠텍스트줄(s) {
  if (!s) return ['']
  let t = 풀린글(s)
  t = t.replace(/\\\\/g, '\u0001').replace(/\\\{/g, '\u0002').replace(/\\\}/g, '\u0003')
  t = t.replace(/\\P/g, '\n').replace(/\\~/g, ' ').replace(/\^I/g, '    ').replace(/\^J/g, '\n')
  t = t.replace(/\\S([^;]*?)[\^\/#]([^;]*?);/g, (_, a, b) => `${a}/${b}`)
  t = t.replace(/\\[ACFHQTWfcpaHq][^;\\]*;/g, '')
  t = t.replace(/\\[LlOoKkNX]/g, '')
  t = t.replace(/[{}]/g, '')
  t = t.replace(/\u0001/g, '\\').replace(/\u0002/g, '{').replace(/\u0003/g, '}')
  return t.split('\n')
}

/* 폭에 맞춰 줄 나누기(R12 한 줄 글) — 글자 폭 어림: 한글 · 한자 1.0h · 영문 0.62h · 빈칸 0.4h */
function 글폭(ch, h) { const c = ch.codePointAt(0); return c === 32 ? h * 0.4 : c > 0x2e7f ? h * 1.0 : h * 0.62 }
export function 줄나눔(줄들, 폭, h) {
  if (!폭 || 폭 <= 0) return 줄들
  const out = []
  for (const 줄 of 줄들) {
    let 지금 = '', w = 0, 끊 = -1
    for (const ch of 줄) {
      const cw = 글폭(ch, h)
      if (w + cw > 폭 * 1.02 && 지금) {
        if (끊 > 0 && ch !== ' ') { out.push(지금.slice(0, 끊).trimEnd()); 지금 = 지금.slice(끊).trimStart() } else { out.push(지금.trimEnd()); 지금 = '' }
        w = 0; for (const c2 of 지금) w += 글폭(c2, h)
        끊 = -1
        if (ch === ' ' && !지금) continue
      }
      지금 += ch; w += cw
      if (ch === ' ') 끊 = 지금.length
    }
    out.push(지금)
  }
  return out
}

/* 이름 다듬기 */
const 금지2000 = /[<>/\\":;?*|=`]/g
function 이름가게(R12) {
  const 씀 = new Map()   // 대문자 원래 이름 → 새 이름
  const 있음 = new Set()
  return (원래) => {
    const 키 = String(원래).toUpperCase()
    if (씀.has(키)) return 씀.get(키)
    let n = String(원래)
    if (R12) {
      n = n.replace(/[^0-9A-Za-z$\-_ㄱ-ㆎ가-힣一-鿿*]/g, '_')
      if (n.length > 31) n = n.slice(0, 27)
    } else n = n.startsWith('*') ? '*' + n.slice(1).replace(/\|/g, '$0$').replace(금지2000, '_') : n.replace(/\|/g, '$0$').replace(금지2000, '_')
    if (!n) n = '_'
    let 새 = n, k = 1
    while (있음.has(새.toUpperCase())) 새 = (R12 ? n.slice(0, 27) : n) + '_' + (k++)
    있음.add(새.toUpperCase())
    씀.set(키, 새)
    return 새
  }
}

/* ───────────────────────────── 다시쓰기 */

/**
 * @param 풀린  캐드고침.풀기() 결과(판 · 코드페이지 · 인코딩)
 * @param D     캐드고침.나누기() 결과
 * @param o     { 판: 'AC1009' ~ 'AC1032', 글꼴: {스타일대문자: 글꼴판키|{파일,큰}}, 모두: 글꼴판키, 글안: '그대로'|'지움'|'바꿈', 글안이름, 빈글꼴: true(이름 없는 TTF 를 가족 이름으로 채움) }
 * @returns { 글, 바이트, 인코딩, 판, 알림: [{글, 수}], 셈: { 모델, 종이, 블록, 층, 바꿈: {}, 뺌: {} } }
 */
export function 다시쓰기(풀린, D, o = {}) {
  const 판 = o.판 || 'AC1024'
  const 틀 = 판틀[판]
  if (!틀) throw new Error('모르는 판 ' + 판)
  const R12 = 판 === 'AC1009'
  const 넘 = (v) => 판 >= v
  const 정보 = 틀.정보
  let 손 = 정보.큰손잡이 + 1
  const 새손 = () => (손++).toString(16).toUpperCase()
  const 바꿈셈 = {}, 뺌셈 = {}
  const 바꿈 = (t) => { 바꿈셈[t] = (바꿈셈[t] || 0) + 1 }
  const 뺌 = (t) => { 뺌셈[t] = (뺌셈[t] || 0) + 1 }
  const 알림 = []
  let 선한도 = 400000            // R12 해치 무늬 선 · 채움 조각 모두 합친 한도
  let 해치넘침 = 0

  /* 원본 표 · 손잡이 → 이름 */
  const 표 = D.표 || {}
  const 손이름 = { STYLE: new Map(), LTYPE: new Map(), BLOCK_RECORD: new Map(), LAYER: new Map() }
  for (const k of Object.keys(손이름)) for (const r of 표[k] || []) { const h = 값(r, 5); if (h) 손이름[k].set(h.toUpperCase(), 값(r, 2)) }
  const 의존 = (r) => (수(r, 70) & 16) !== 0
  const 원층 = new Map(), 원선 = new Map(), 원글꼴 = new Map(), 원치수꼴 = new Map()
  for (const r of 표.LAYER || []) if (!의존(r) && 값(r, 2) !== '') 원층.set(값(r, 2).toUpperCase(), r)
  for (const r of 표.LTYPE || []) if (!의존(r) && 값(r, 2) !== '') 원선.set(값(r, 2).toUpperCase(), r)
  for (const r of 표.STYLE || []) if (!의존(r)) 원글꼴.set(값(r, 2).toUpperCase(), r)
  for (const r of 표.DIMSTYLE || []) if (!의존(r) && 값(r, 2) !== '') 원치수꼴.set(값(r, 2).toUpperCase(), r)
  const 원BR = new Map()
  for (const r of 표.BLOCK_RECORD || []) 원BR.set(값(r, 2).toUpperCase(), r)

  /* 이름 가게 */
  const 층이름 = 이름가게(R12), 선이름 = 이름가게(R12), 글꼴이름 = 이름가게(R12), 치수꼴이름 = 이름가게(R12), 블록이름 = 이름가게(R12)
  const 쓴층 = new Map(), 쓴선 = new Map(), 쓴글꼴 = new Map(), 쓴치수꼴 = new Map()   // 새 이름 → 원래 이름
  ;['0', 'Defpoints'].forEach((n) => { const 새 = 층이름(n); 쓴층.set(새, n) })
  ;['ByBlock', 'ByLayer', 'Continuous'].forEach((n) => 선이름(n))
  글꼴이름('Standard'); 치수꼴이름('Standard')

  const 층 = (n) => {
    if (n === undefined || n === null || n === '') n = '0'
    const 새 = 층이름(n)
    if (!쓴층.has(새)) 쓴층.set(새, n)
    return 새
  }
  const 선 = (n) => {
    const u = String(n).toUpperCase()
    if (u === 'BYLAYER') return 'ByLayer'
    if (u === 'BYBLOCK') return 'ByBlock'
    if (u === 'CONTINUOUS') return 'Continuous'
    if (!원선.has(u)) return null
    const 새 = 선이름(n)
    if (!쓴선.has(새)) 쓴선.set(새, n)
    return 새
  }
  const 글꼴 = (n) => {
    const u = String(n || 'Standard').toUpperCase()
    if (u === 'STANDARD' || !원글꼴.has(u)) return 'Standard'
    const 새 = 글꼴이름(n)
    if (!쓴글꼴.has(새)) 쓴글꼴.set(새, n)
    return 새
  }
  const 치수꼴 = (n) => {
    const u = String(n || 'Standard').toUpperCase()
    if (u === 'STANDARD' || !원치수꼴.has(u)) return 'Standard'
    const 새 = 치수꼴이름(n)
    if (!쓴치수꼴.has(새)) 쓴치수꼴.set(새, n)
    return 새
  }

  /* 블록 고르기 — 모델 · 배치 블록 · 외부 참조에 딸린 블록은 뺌 */
  const 블록들 = []
  const 블록표 = new Map()   // 대문자 원래 이름 → { b, 이름, 기록, 시작, 끝 }
  let 종이블록 = null, 다른배치 = 0
  let 이름없는수 = 1
  for (const b of D.블록 || []) {
    const n = 값(b, 2)
    if (/^\*model_space/i.test(n)) continue
    if (/^\*paper_space$/i.test(n)) { 종이블록 = b; continue }
    if (/^\*paper_space/i.test(n)) { if ((b.도형 || []).length) 다른배치++; continue }
    if (의존(b) || n.includes('|')) { 뺌('외부 참조에 딸린 블록'); continue }
    if (블록표.has(n.toUpperCase())) { 뺌('이름이 겹친 블록(앞의 것만 씀)'); continue }
    let 새 = n
    if (n.startsWith('*')) {
      if (R12) 새 = '*U' + (이름없는수++)
      else 새 = n
    }
    const 들 = { b, 원래: n, 이름: R12 && n.startsWith('*') ? 새 : 블록이름(새), 기록: R12 ? '' : 새손(), 시작: 새손(), 끝: 새손() }
    if (R12 && n.startsWith('*')) 블록이름(새)
    블록들.push(들)
    블록표.set(n.toUpperCase(), 들)
  }
  const 블록 = (n) => 블록표.get(String(n).toUpperCase()) || null

  /* 레이아웃(배치) — 지금 열린 배치의 이름 · 종이 설정 */
  const 종이BR = 원BR.get('*PAPER_SPACE')
  const 종이BR손 = 종이BR ? 값(종이BR, 5).toUpperCase() : ''
  const 배치들 = (D.사전 || []).filter((x) => x.t === 'LAYOUT')
  const 열린배치 = 배치들.find((x) => 모두(x, 330).some((h) => h.toUpperCase() === 종이BR손)) || 배치들.find((x) => 수(x, 71) === 1)
  const 배치수 = 배치들.filter((x) => 값(x, 1, '') !== 'Model' && !모두(x, 1).includes('Model')).length

  /* ── 쓰개 */
  const 쓰개 = () => {
    const 줄 = []
    const P = (c, v) => { 줄.push(c < 10 ? '  ' + c : c < 100 ? ' ' + c : String(c), typeof v === 'number' ? 수글(v) : String(v ?? '')) }
    return { 줄, P }
  }
  const 문자 = (v) => {
    let s = String(v ?? '')
    if (넘('AC1021') && s.indexOf('\\U+') >= 0) s = 풀린글(s)
    return s
  }
  const P점 = (W, c, p, z = true) => { W.P(c, p[0]); W.P(c + 10, p[1]); if (z) W.P(c + 20, p[2] || 0) }

  /* 범위(모델) */
  const 범 = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  const 넓힘 = (x, y) => { if (Math.abs(x) < 1e13 && Math.abs(y) < 1e13) { if (x < 범.x0) 범.x0 = x; if (x > 범.x1) 범.x1 = x; if (y < 범.y0) 범.y0 = y; if (y > 범.y1) 범.y1 = y } }

  /* R12 배율 선 종류 */
  const 파생 = new Map()     // 키 → { 이름, 밑, 배 }
  function 파생선(밑, 배) {
    const 키 = 밑.toUpperCase() + '@' + 배
    if (파생.has(키)) return 파생.get(키).이름
    const 이름 = 선이름(`${밑}_S${String(+배.toFixed(4)).replace('.', '_').replace('-', 'M')}`)
    파생.set(키, { 이름, 밑, 배 })
    return 이름
  }

  /* ── 공통 머리 */
  function 머리쓰기(W, e, t, ctx, 덧 = {}) {
    const h = 덧.손 || 새손()
    W.P(0, t)
    W.P(5, h)
    if (!R12 && 덧.사전) { W.P(102, '{ACAD_XDICTIONARY'); W.P(360, 덧.사전); W.P(102, '}') }
    if (!R12) { W.P(330, ctx.주인); W.P(100, 'AcDbEntity') }
    if (ctx.종이) W.P(67, 1)
    const 원층이름 = 덧.층 ?? 값(e, 8, '0')
    W.P(8, 층(원층이름))
    let lt = 덧.선 !== undefined ? 덧.선 : (있나(e, 6) ? 선(값(e, 6)) : null)
    /* R12 에는 도형마다의 선 종류 배율(48)이 없음 → 배율을 곱한 선 종류를 따로 만들어 씀(안 하면 점선이 실선처럼 보임) */
    if (R12 && 덧.선 === undefined && 있나(e, 48)) {
      const sc = 수(e, 48, 1)
      if (sc > 0 && Math.abs(sc - 1) > 1e-9) {
        let 밑 = 있나(e, 6) ? 값(e, 6) : ''
        if (!밑 || /^bylayer$/i.test(밑)) { const L = 원층.get(String(원층이름).toUpperCase()); 밑 = L ? 값(L, 6, 'Continuous') : 'Continuous' }
        if (밑 && !/^(byblock|continuous)$/i.test(밑) && 원선.has(밑.toUpperCase())) lt = 파생선(밑, sc)
      }
    }
    if (lt) W.P(6, lt)
    let 색 = 덧.색 !== undefined ? 덧.색 : (있나(e, 62) ? 수(e, 62) : null)
    const 참 = 덧.참 !== undefined ? 덧.참 : (있나(e, 420) ? 수(e, 420) : null)
    if (색 !== null && (색 < 0 || 색 > 257)) 색 = Math.abs(색) % 257
    if (참 !== null && !넘('AC1018') && 색 === null) 색 = 가까운색(참)
    if (색 !== null && 색 !== 256) W.P(62, 색)
    if (!R12) {
      if (넘('AC1018') && 참 !== null) W.P(420, 참)
      if (있나(e, 370) && 덧.굵기 !== false) W.P(370, 수(e, 370))
      if (있나(e, 48)) W.P(48, 수(e, 48))
      if (있나(e, 60) && 수(e, 60) === 1) W.P(60, 1)
      if (넘('AC1018') && 있나(e, 440)) W.P(440, 수(e, 440))
    }
    if (R12 && 덧.두께 !== false && 있나(e, 39) && 수(e, 39) !== 0) W.P(39, 수(e, 39))
    return h
  }
  const 두께2000 = (W, e) => { if (!R12 && 있나(e, 39) && 수(e, 39) !== 0) W.P(39, 수(e, 39)) }
  const 법선쓰기 = (W, e) => { const n = 점(e, 210, 0); if (있나(e, 210) && !기본법선([n[0], n[1], n[2] || (있나(e, 230) ? 수(e, 230) : 1)])) { W.P(210, n[0]); W.P(220, n[1]); W.P(230, 있나(e, 230) ? 수(e, 230) : 1) } }
  const 법선 = (e) => (있나(e, 210) || 있나(e, 230)) ? [수(e, 210), 수(e, 220), 있나(e, 230) ? 수(e, 230) : 1] : [0, 0, 1]

  /* 폴리선(옛 꼴) 쓰기 — 점들 [{x,y,z,s,e,b}] */
  function 폴리선쓰기(W, e, ctx, 점들, o2) {
    const h = 머리쓰기(W, e, 'POLYLINE', ctx, o2.덧 || {})
    const 삼차 = !!o2.삼차
    if (!R12) W.P(100, 삼차 ? 'AcDb3dPolyline' : 'AcDb2dPolyline')
    W.P(66, 1)
    W.P(10, 0); W.P(20, 0); W.P(30, o2.높이 || 0)
    W.P(70, (o2.닫힘 ? 1 : 0) | (삼차 ? 8 : 0) | (o2.선생성 ? 128 : 0))
    if (!삼차 && o2.폭) { W.P(40, o2.폭); W.P(41, o2.폭) }
    if (!R12) 두께2000(W, e)
    if (!삼차 && o2.법선) { const n = o2.법선; if (!기본법선(n)) { W.P(210, n[0]); W.P(220, n[1]); W.P(230, n[2]) } }
    const 층v = 층(o2.덧 && o2.덧.층 !== undefined ? o2.덧.층 : 값(e, 8, '0'))
    for (const p of 점들) {
      W.P(0, 'VERTEX'); W.P(5, 새손())
      if (!R12) { W.P(330, h); W.P(100, 'AcDbEntity') }
      if (ctx.종이) W.P(67, 1)
      W.P(8, 층v)
      if (!R12) { W.P(100, 'AcDbVertex'); W.P(100, 삼차 ? 'AcDb3dPolylineVertex' : 'AcDb2dVertex') }
      W.P(10, p.x); W.P(20, p.y); W.P(30, 삼차 ? (p.z || 0) : (o2.높이 || 0))
      if (!삼차) { if (p.s) W.P(40, p.s); if (p.e) W.P(41, p.e); if (p.b) W.P(42, p.b) }
      W.P(70, 삼차 ? 32 : 0)
    }
    W.P(0, 'SEQEND'); W.P(5, 새손())
    if (!R12) { W.P(330, h); W.P(100, 'AcDbEntity') }
    if (ctx.종이) W.P(67, 1)
    W.P(8, 층v)
  }
  /* 점 묶음을 WCS 폴리선으로(평면이면 2D) */
  function 점선(W, e, ctx, 점들, 닫힘, 덧) {
    if (점들.length < 2) return
    const 평 = 점들.every((p) => Math.abs((p[2] || 0) - (점들[0][2] || 0)) < 1e-9)
    if (평) 폴리선쓰기(W, e, ctx, 점들.map((p) => ({ x: p[0], y: p[1] })), { 닫힘, 높이: 점들[0][2] || 0, 덧 })
    else 폴리선쓰기(W, e, ctx, 점들.map((p) => ({ x: p[0], y: p[1], z: p[2] || 0 })), { 닫힘, 삼차: true, 덧 })
  }
  function 선쓰기(W, e, ctx, a, b, 덧) {
    머리쓰기(W, e, 'LINE', ctx, 덧)
    if (!R12) W.P(100, 'AcDbLine')
    P점(W, 10, a); P점(W, 11, b)
  }
  function 면쓰기(W, e, ctx, a, b, c, d, 덧, n) {
    머리쓰기(W, e, 'SOLID', ctx, 덧)
    if (!R12) W.P(100, 'AcDbTrace')
    P점(W, 10, a); P점(W, 11, b); P점(W, 12, c); P점(W, 13, d)
    if (n && !기본법선(n)) { W.P(210, n[0]); W.P(220, n[1]); W.P(230, n[2]) }
  }
  function 글쓰기(W, e, ctx, 글, p, 높이, 회전, 맞춤, 글꼴명, 덧) {
    머리쓰기(W, e, 'TEXT', ctx, 덧)
    if (!R12) W.P(100, 'AcDbText')
    P점(W, 10, p)
    W.P(40, 높이 || 1)
    W.P(1, 문자(글))
    if (회전) W.P(50, 회전)
    W.P(7, 글꼴(글꼴명))
    if (맞춤 && 맞춤.h) { W.P(72, 맞춤.h) }
    if (맞춤 && (맞춤.h || 맞춤.v)) P점(W, 11, p)
    if (!R12) W.P(100, 'AcDbText')
    if (맞춤 && 맞춤.v) W.P(73, 맞춤.v)
  }

  /* ── 글(TEXT · ATTRIB · ATTDEF) 공통 몸 */
  function 글몸(W, e, 종류) {
    if (!R12) { W.P(100, 'AcDbText') }
    if (!R12) 두께2000(W, e)
    P점(W, 10, 점(e, 10))
    W.P(40, 수(e, 40, 1) || 1)
    W.P(1, 문자(값(e, 1)))
    if (수(e, 50)) W.P(50, 수(e, 50))
    if (있나(e, 41) && 수(e, 41) !== 1) W.P(41, 수(e, 41))
    if (수(e, 51)) W.P(51, 수(e, 51))
    W.P(7, 글꼴(값(e, 7, 'Standard')))
    if (수(e, 71)) W.P(71, 수(e, 71))
    if (수(e, 72)) W.P(72, 수(e, 72))
    if (있나(e, 11)) P점(W, 11, 점(e, 11))
    else if (수(e, 72) || 수(e, 73) || 수(e, 74)) P점(W, 11, 점(e, 10))
    법선쓰기(W, e)
    if (종류 === 'TEXT') {
      if (!R12) W.P(100, 'AcDbText')
      if (수(e, 73)) W.P(73, 수(e, 73))
    } else {
      if (!R12) W.P(100, 종류 === 'ATTRIB' ? 'AcDbAttribute' : 'AcDbAttributeDefinition')
      if (종류 === 'ATTDEF') W.P(3, 문자(값(e, 3)))
      W.P(2, 문자(값(e, 2)))
      W.P(70, 수(e, 70) & 15)
      if (수(e, 73)) W.P(73, 수(e, 73))
      if (수(e, 74)) W.P(74, 수(e, 74))
    }
  }

  /* ── 도형 하나 */
  function 도형(W, e, ctx) {
    const t = e.t
    switch (t) {
      case 'LINE': {
        머리쓰기(W, e, t, ctx)
        if (!R12) { W.P(100, 'AcDbLine'); 두께2000(W, e) }
        P점(W, 10, 점(e, 10)); P점(W, 11, 점(e, 11)); 법선쓰기(W, e)
        if (ctx.모델) { 넓힘(수(e, 10), 수(e, 20)); 넓힘(수(e, 11), 수(e, 21)) }
        return
      }
      case 'POINT': {
        머리쓰기(W, e, t, ctx)
        if (!R12) { W.P(100, 'AcDbPoint') }
        P점(W, 10, 점(e, 10)); if (!R12) 두께2000(W, e); 법선쓰기(W, e)
        if (수(e, 50)) W.P(50, 수(e, 50))
        if (ctx.모델) 넓힘(수(e, 10), 수(e, 20))
        return
      }
      case 'CIRCLE': case 'ARC': {
        머리쓰기(W, e, t, ctx)
        if (!R12) { W.P(100, 'AcDbCircle'); 두께2000(W, e) }
        P점(W, 10, 점(e, 10)); W.P(40, 수(e, 40)); 법선쓰기(W, e)
        if (t === 'ARC') { if (!R12) W.P(100, 'AcDbArc'); W.P(50, 수(e, 50)); W.P(51, 수(e, 51)) }
        if (ctx.모델) { const r = 수(e, 40); 넓힘(수(e, 10) - r, 수(e, 20) - r); 넓힘(수(e, 10) + r, 수(e, 20) + r) }
        return
      }
      case 'ELLIPSE': {
        if (!R12) {
          머리쓰기(W, e, t, ctx)
          W.P(100, 'AcDbEllipse'); P점(W, 10, 점(e, 10)); P점(W, 11, 점(e, 11)); 법선쓰기(W, e)
          W.P(40, 수(e, 40, 1)); W.P(41, 수(e, 41, 0)); W.P(42, 수(e, 42, Math.PI * 2))
        } else {
          const c = 점(e, 10), m = 점(e, 11), n = 법선(e), r = 수(e, 40, 1)
          const mi = 외적(n, m).map((v) => v * r)
          let s = 수(e, 41, 0), f = 수(e, 42, Math.PI * 2)
          if (f <= s) f += Math.PI * 2
          const 몇 = Math.max(8, Math.ceil(72 * (f - s) / (Math.PI * 2)))
          const 점들 = []
          for (let i = 0; i <= 몇; i++) { const u = s + (f - s) * i / 몇; 점들.push([c[0] + m[0] * Math.cos(u) + mi[0] * Math.sin(u), c[1] + m[1] * Math.cos(u) + mi[1] * Math.sin(u), c[2] + m[2] * Math.cos(u) + mi[2] * Math.sin(u)]) }
          const 닫힘 = Math.abs(f - s - Math.PI * 2) < 1e-6
          if (닫힘) 점들.pop()
          점선(W, e, ctx, 점들, 닫힘); 바꿈('타원 → 폴리선')
        }
        if (ctx.모델) { const c = 점(e, 10), m = 점(e, 11), L = Math.hypot(m[0], m[1]); 넓힘(c[0] - L, c[1] - L); 넓힘(c[0] + L, c[1] + L) }
        return
      }
      case 'LWPOLYLINE': {
        const 점들 = []
        let cur = null
        for (const [c, v] of e.g) {
          if (c === 10) { cur = { x: Number(v), y: 0, s: 0, e: 0, b: 0 }; 점들.push(cur) } else if (!cur) continue
          else if (c === 20) cur.y = Number(v); else if (c === 40) cur.s = Number(v); else if (c === 41) cur.e = Number(v); else if (c === 42) cur.b = Number(v)
        }
        if (!점들.length) { 뺌('빈 폴리선'); return }
        const 닫힘 = (수(e, 70) & 1) !== 0, 폭 = 수(e, 43), 높이 = 수(e, 38)
        if (R12) {
          if (폭) for (const p of 점들) { if (!p.s) p.s = 폭; if (!p.e) p.e = 폭 }
          폴리선쓰기(W, e, ctx, 점들, { 닫힘, 높이, 폭, 법선: 법선(e), 선생성: (수(e, 70) & 128) !== 0 })
          바꿈('가벼운 폴리선 → 폴리선')
        } else {
          머리쓰기(W, e, t, ctx)
          W.P(100, 'AcDbPolyline'); W.P(90, 점들.length); W.P(70, 수(e, 70) & 129)
          if (있나(e, 43)) W.P(43, 폭)
          if (높이) W.P(38, 높이)
          두께2000(W, e)
          for (const p of 점들) { W.P(10, p.x); W.P(20, p.y); if (p.s || p.e) { W.P(40, p.s); W.P(41, p.e) } if (p.b) W.P(42, p.b) }
          법선쓰기(W, e)
        }
        if (ctx.모델 && 기본법선(법선(e))) for (const p of 점들) 넓힘(p.x, p.y)
        return
      }
      case 'POLYLINE': {
        const f = 수(e, 70)
        const 정점 = e.딸 || []
        const h = 머리쓰기(W, e, t, ctx)
        const 종류 = f & 64 ? 'AcDbPolyFaceMesh' : f & 16 ? 'AcDbPolygonMesh' : f & 8 ? 'AcDb3dPolyline' : 'AcDb2dPolyline'
        if (!R12) W.P(100, 종류)
        W.P(66, 1); W.P(10, 0); W.P(20, 0); W.P(30, 수(e, 30)); W.P(70, f)
        if (수(e, 40)) W.P(40, 수(e, 40)); if (수(e, 41)) W.P(41, 수(e, 41))
        for (const c of [71, 72, 73, 74, 75]) if (있나(e, c)) W.P(c, 수(e, c))
        if (!R12) 두께2000(W, e)
        법선쓰기(W, e)
        for (const v of 정점) {
          const vf = 수(v, 70)
          W.P(0, 'VERTEX'); W.P(5, 새손())
          if (!R12) { W.P(330, h); W.P(100, 'AcDbEntity') }
          if (ctx.종이) W.P(67, 1)
          W.P(8, 층(값(v, 8, 값(e, 8, '0'))))
          if (있나(v, 62)) W.P(62, 수(v, 62))
          if (!R12) {
            if (f & 64 && !(vf & 64)) W.P(100, 'AcDbFaceRecord')
            else {
              W.P(100, 'AcDbVertex')
              W.P(100, f & 64 ? 'AcDbPolyFaceMeshVertex' : f & 16 ? 'AcDbPolygonMeshVertex' : f & 8 ? 'AcDb3dPolylineVertex' : 'AcDb2dVertex')
            }
          }
          P점(W, 10, 점(v, 10))
          if (수(v, 40)) W.P(40, 수(v, 40)); if (수(v, 41)) W.P(41, 수(v, 41)); if (수(v, 42)) W.P(42, 수(v, 42))
          W.P(70, vf)
          if (있나(v, 50)) W.P(50, 수(v, 50))
          for (const c of [71, 72, 73, 74]) if (있나(v, c)) W.P(c, 수(v, c))
          if (ctx.모델 && !(f & 64 && !(vf & 64))) 넓힘(수(v, 10), 수(v, 20))
        }
        W.P(0, 'SEQEND'); W.P(5, 새손())
        if (!R12) { W.P(330, h); W.P(100, 'AcDbEntity') }
        if (ctx.종이) W.P(67, 1)
        W.P(8, 층(값(e, 8, '0')))
        return
      }
      case 'SPLINE': {
        const 매듭 = 모두(e, 40).map(Number), 무게 = 모두(e, 41).map(Number)
        const 조절 = [], 맞춤 = []
        for (let i = 0; i < e.g.length; i++) {
          const [c, v] = e.g[i]
          if (c === 10) 조절.push([Number(v), 0, 0]); else if (c === 20 && 조절.length) 조절[조절.length - 1][1] = Number(v); else if (c === 30 && 조절.length) 조절[조절.length - 1][2] = Number(v)
          else if (c === 11) 맞춤.push([Number(v), 0, 0]); else if (c === 21 && 맞춤.length) 맞춤[맞춤.length - 1][1] = Number(v); else if (c === 31 && 맞춤.length) 맞춤[맞춤.length - 1][2] = Number(v)
        }
        if (ctx.모델) for (const p of 조절.length ? 조절 : 맞춤) 넓힘(p[0], p[1])
        if (!R12) {
          머리쓰기(W, e, t, ctx)
          W.P(100, 'AcDbSpline')
          법선쓰기(W, e)
          const 유리 = (수(e, 70) & 4) !== 0 && 무게.length === 조절.length && 조절.length > 0
          W.P(70, 유리 ? 수(e, 70) : 수(e, 70) & ~4); W.P(71, 수(e, 71, 3)); W.P(72, 매듭.length); W.P(73, 조절.length); W.P(74, 맞춤.length)
          if (매듭.length) W.P(42, 수(e, 42, 1e-10)); if (조절.length) W.P(43, 수(e, 43, 1e-10)); if (맞춤.length) W.P(44, 수(e, 44, 1e-10))
          if (맞춤.length && 있나(e, 12)) P점(W, 12, 점(e, 12)); if (맞춤.length && 있나(e, 13)) P점(W, 13, 점(e, 13))
          for (const k of 매듭) W.P(40, k)
          if (유리) for (const w of 무게) W.P(41, w)   /* AutoCAD: 유리(70 & 4)면 무게 수 = 조절점 수 — 안 맞으면 «도면이 취소됨» */
          for (const p of 조절) P점(W, 10, p)
          for (const p of 맞춤) P점(W, 11, p)
        } else {
          const 점들 = 조절.length >= 2 ? 스플라인점들(수(e, 71, 3), 매듭, 조절, 무게) : 맞춤
          점선(W, e, ctx, 점들, (수(e, 70) & 1) !== 0 && 조절.length < 2); 바꿈('스플라인 → 폴리선')
        }
        return
      }
      case 'TEXT': {
        머리쓰기(W, e, t, ctx, { 두께: false })
        if (R12 && 있나(e, 39) && 수(e, 39)) W.P(39, 수(e, 39))
        글몸(W, e, 'TEXT')
        if (ctx.모델) 넓힘(수(e, 10), 수(e, 20))
        return
      }
      case 'ATTDEF': {
        머리쓰기(W, e, t, ctx, { 두께: false })
        글몸(W, e, 'ATTDEF')
        return
      }
      case 'MTEXT': {
        let 글 = ''
        for (const [c, v] of e.g) if (c === 3 || c === 1) 글 += v
        if (o.글안 === '지움') 글 = 글.replace(/\\[fF][^;\\]*;/g, '')
        else if (o.글안 === '바꿈') 글 = 글.replace(/\\([fF])[^|;\\]*([|;])/g, (_, f, z) => `\\${f}${o.글안이름 || 'Malgun Gothic'}${z}`)
        const p = 점(e, 10), h = 수(e, 40, 1) || 1
        let 회전 = 0
        if (있나(e, 11)) 회전 = Math.atan2(수(e, 21), 수(e, 11)) * 180 / Math.PI
        else if (있나(e, 50)) 회전 = 수(e, 50)
        if (ctx.모델) 넓힘(p[0], p[1])
        if (!R12) {
          머리쓰기(W, e, t, ctx)
          W.P(100, 'AcDbMText'); P점(W, 10, p); W.P(40, h)
          W.P(41, 수(e, 41)); W.P(71, 수(e, 71, 1) || 1); W.P(72, 수(e, 72, 1) || 1)
          const 글들 = []
          let s = 문자(글)
          const 조각 = 250
          while (s.length > 조각) { let k = 조각; const cc = s.charCodeAt(k - 1); if (cc >= 0xd800 && cc <= 0xdbff) k--; 글들.push(s.slice(0, k)); s = s.slice(k) }
          for (const g of 글들) W.P(3, g)
          W.P(1, s)
          W.P(7, 글꼴(값(e, 7, 'Standard')))
          법선쓰기(W, e)
          if (있나(e, 11)) P점(W, 11, 점(e, 11)); else if (회전) W.P(50, 회전)
          if (있나(e, 73)) W.P(73, 수(e, 73)); if (있나(e, 44)) W.P(44, 수(e, 44))
          if (넘('AC1021') && 있나(e, 90) && 수(e, 90)) {
            W.P(90, 수(e, 90)); if (있나(e, 63)) W.P(63, 수(e, 63)); if (있나(e, 421)) W.P(421, 수(e, 421)); W.P(45, 수(e, 45, 1.5))
            if (있나(e, 441)) W.P(441, 수(e, 441))
          }
        } else {
          const 줄들 = 줄나눔(엠텍스트줄(글), 수(e, 41), h)
          const n = 줄들.length, ls = h * 5 / 3 * (수(e, 44, 1) || 1)
          const att = 수(e, 71, 1) || 1
          const 세로 = Math.floor((att - 1) / 3), 가로 = (att - 1) % 3     // 세로 0 위 1 가운데 2 아래
          const 전체 = h + (n - 1) * ls
          const r = 회전 * Math.PI / 180, cr = Math.cos(r), sr = Math.sin(r)
          줄들.forEach((줄, i) => {
            if (!줄.trim()) return
            const 꼴 = [...줄].some(기호인가) ? 기호글꼴(값(e, 7, 'Standard')) : 값(e, 7, 'Standard')
            const dy = 세로 === 0 ? -h - i * ls : 세로 === 1 ? 전체 / 2 - h - i * ls : 전체 - h - i * ls
            const q = [p[0] - sr * dy, p[1] + cr * dy, p[2]]
            const 맞 = 가로 === 0 ? null : { h: 가로, v: 0 }
            글쓰기(W, e, ctx, 줄, q, h, 회전, 맞, 꼴)
          })
          바꿈('여러 줄 글 → 한 줄 글')
        }
        return
      }
      case 'INSERT': {
        const bl = 블록(값(e, 2))
        if (!bl) { 뺌('없는 블록을 끼운 것'); return }
        const 딸 = (e.딸 || []).filter((x) => x.t === 'ATTRIB')
        const 클 = 클립(e)
        if (클 && R12) 뺌('잘라 보이기(XCLIP — R12 에 없음 · 블록 전체가 보임)')
        const 덧i = {}
        if (클 && !R12) { 덧i.손 = 새손(); 덧i.사전 = 새손() }
        const h = 머리쓰기(W, e, t, ctx, 덧i)
        if (클 && !R12) 클립쓰기(h, 덧i.사전, 클)
        const 여럿 = (수(e, 70) > 1 || 수(e, 71) > 1)
        if (!R12) W.P(100, 여럿 ? 'AcDbMInsertBlock' : 'AcDbBlockReference')
        if (딸.length) W.P(66, 1)
        W.P(2, bl.이름)
        P점(W, 10, 점(e, 10))
        for (const c of [41, 42, 43]) if (있나(e, c) && 수(e, c, 1) !== 1) W.P(c, 수(e, c, 1))
        if (수(e, 50)) W.P(50, 수(e, 50))
        if (여럿) { W.P(70, Math.max(1, 수(e, 70, 1))); W.P(71, Math.max(1, 수(e, 71, 1))); W.P(44, 수(e, 44)); W.P(45, 수(e, 45)) }
        법선쓰기(W, e)
        if (딸.length) {
          for (const a of 딸) { 머리쓰기(W, a, 'ATTRIB', { ...ctx, 주인: h }, { 두께: false }); 글몸(W, a, 'ATTRIB') }
          W.P(0, 'SEQEND'); W.P(5, 새손())
          if (!R12) { W.P(330, h); W.P(100, 'AcDbEntity') }
          if (ctx.종이) W.P(67, 1)
          W.P(8, 층(값(e, 8, '0')))
        }
        if (ctx.모델) 넓힘(수(e, 10), 수(e, 20))
        return
      }
      case 'SOLID': case 'TRACE': case '3DFACE': {
        머리쓰기(W, e, t, ctx)
        if (!R12) { W.P(100, t === '3DFACE' ? 'AcDbFace' : 'AcDbTrace'); if (t !== '3DFACE') 두께2000(W, e) }
        P점(W, 10, 점(e, 10)); P점(W, 11, 점(e, 11)); P점(W, 12, 점(e, 12)); P점(W, 13, 있나(e, 13) ? 점(e, 13) : 점(e, 12))
        if (t === '3DFACE') { if (수(e, 70)) W.P(70, 수(e, 70)) } else 법선쓰기(W, e)
        if (ctx.모델) { 넓힘(수(e, 10), 수(e, 20)); 넓힘(수(e, 12), 수(e, 22)) }
        return
      }
      case 'SHAPE': {
        머리쓰기(W, e, t, ctx)
        if (!R12) { W.P(100, 'AcDbShape'); 두께2000(W, e) }
        P점(W, 10, 점(e, 10)); W.P(40, 수(e, 40, 1)); W.P(2, 값(e, 2))
        for (const c of [50, 41, 51]) if (있나(e, c)) W.P(c, 수(e, c))
        법선쓰기(W, e)
        return
      }
      case 'XLINE': case 'RAY': {
        const p = 점(e, 10), d = 단위(점(e, 11))
        if (!R12) {
          머리쓰기(W, e, t, ctx)
          W.P(100, t === 'XLINE' ? 'AcDbXline' : 'AcDbRay'); P점(W, 10, p); P점(W, 11, d)
        } else {
          const L = 1e7
          const a = t === 'XLINE' ? [p[0] - d[0] * L, p[1] - d[1] * L, p[2] - d[2] * L] : p
          선쓰기(W, e, ctx, a, [p[0] + d[0] * L, p[1] + d[1] * L, p[2] + d[2] * L]); 바꿈(t === 'XLINE' ? '무한선 → 긴 선' : '반무한선 → 긴 선')
        }
        return
      }
      case 'HATCH': {
        if (!R12) return 해치2000(W, e, ctx)
        return 해치R12(W, e, ctx)
      }
      case 'DIMENSION': case 'ARC_DIMENSION': case 'LARGE_RADIAL_DIMENSION': {
        const bl = 블록(값(e, 2))
        if (R12 || t !== 'DIMENSION') {
          if (!bl) { 뺌('모양 블록 없는 치수'); return }
          머리쓰기(W, e, 'INSERT', ctx)
          if (!R12) W.P(100, 'AcDbBlockReference')
          W.P(2, bl.이름); W.P(10, 0); W.P(20, 0); W.P(30, 0)
          바꿈(t === 'DIMENSION' ? '치수 → 블록(모양 그대로)' : '호 · 큰 반지름 치수 → 블록(모양 그대로)')
          return
        }
        return 치수2000(W, e, ctx, bl)
      }
      case 'LEADER': {
        if (!R12) {
          머리쓰기(W, e, t, ctx)
          W.P(100, 'AcDbLeader')
          W.P(3, 치수꼴(값(e, 3)))
          for (const [c, v] of 마커뒤(e, 'AcDbLeader') || e.g) {
            if (c === 3 || c === 340 || c === 330 || c === 102 || c >= 1000) continue
            if (c === 10 || c === 20 || c === 30 || c === 210 || c === 220 || c === 230 || (c >= 211 && c <= 233) || (c >= 40 && c <= 41) || (c >= 71 && c <= 77)) W.P(c, v)
          }
          치수꼬리(W, e)
        } else {
          const 점들 = []
          for (const [c, v] of e.g) { if (c === 10) 점들.push([Number(v), 0, 0]); else if (c === 20 && 점들.length) 점들[점들.length - 1][1] = Number(v); else if (c === 30 && 점들.length) 점들[점들.length - 1][2] = Number(v) }
          if (점들.length >= 2) {
            점선(W, e, ctx, 점들, false)
            if (수(e, 71, 1) !== 0) 화살(W, e, ctx, 점들[0], 점들[1], 화살크기(값(e, 3)))
          }
          바꿈('지시선 → 폴리선 + 화살')
        }
        if (ctx.모델) 넓힘(수(e, 10), 수(e, 20))
        return
      }
      case 'MULTILEADER': case 'MLEADER': return 다중지시선(W, e, ctx)
      case 'ACAD_TABLE': {
        const 이름 = (마커뒤(e, 'AcDbBlockReference') || e.g).find((p) => p[0] === 2)
        const bl = 이름 ? 블록(이름[1]) : null
        if (!bl) { 뺌('표(블록 없음)'); return }
        머리쓰기(W, e, 'INSERT', ctx)
        if (!R12) W.P(100, 'AcDbBlockReference')
        W.P(2, bl.이름)
        const p = 점(e, 10)
        P점(W, 10, p)
        if (ctx.모델) 넓힘(p[0], p[1])
        바꿈('표 → 블록(모양 그대로)')
        return
      }
      case 'MLINE': return 다중선(W, e, ctx)
      case 'VIEWPORT': return ctx.종이 ? 뷰포트(W, e, ctx) : undefined
      case 'TOLERANCE': {
        if (R12) { 뺌('공차 기호(R12 에 없음)'); return }
        머리쓰기(W, e, t, ctx)
        W.P(100, 'AcDbFcf'); W.P(3, 치수꼴(값(e, 3))); P점(W, 10, 점(e, 10)); W.P(1, 문자(값(e, 1))); 법선쓰기(W, e); if (있나(e, 11)) P점(W, 11, 점(e, 11))
        return
      }
      case 'SEQEND': case 'VERTEX': case 'ATTRIB': case 'ENDBLK': case 'BLOCK': return
      case 'IMAGE': 뺌('붙인 그림(IMAGE)'); return
      case 'WIPEOUT': 뺌('가림막(WIPEOUT)'); return
      case 'OLE2FRAME': case 'OLEFRAME': 뺌('OLE(엑셀 · 한글 붙임)'); return
      case '3DSOLID': case 'REGION': case 'BODY': case 'SURFACE': case 'PLANESURFACE': case 'EXTRUDEDSURFACE': case 'LOFTEDSURFACE': case 'REVOLVEDSURFACE': case 'SWEPTSURFACE': case 'NURBSURFACE': case 'MESH':
        뺌('입체 · 면(ACIS)'); return
      case 'ACAD_PROXY_ENTITY': 뺌('다른 프로그램 전용 도형'); return
      default: 뺌(t); return
    }
  }

  /* 치수 꼴 화살 크기(지시선 R12) */
  function 화살크기(이름) {
    const r = 원치수꼴.get(String(이름 || 'Standard').toUpperCase())
    const 크기 = r ? 수(r, 41, 2.5) : 2.5, 배 = r ? 수(r, 40, 1) || 1 : 1
    return 크기 * 배
  }
  function 화살(W, e, ctx, 끝, 다음, 크기) {
    const dx = 다음[0] - 끝[0], dy = 다음[1] - 끝[1], L = Math.hypot(dx, dy) || 1
    const ux = dx / L, uy = dy / L, 폭 = 크기 / 6
    const b = [끝[0] + ux * 크기, 끝[1] + uy * 크기, 끝[2] || 0]
    면쓰기(W, e, ctx, 끝, 끝, [b[0] - uy * 폭, b[1] + ux * 폭, b[2]], [b[0] + uy * 폭, b[1] - ux * 폭, b[2]])
  }

  /* ── 치수(2000 이상) */
  function 치수2000(W, e, ctx, bl) {
    머리쓰기(W, e, 'DIMENSION', ctx)
    W.P(100, 'AcDbDimension')
    if (넘('AC1024')) W.P(280, 0)
    if (bl) W.P(2, bl.이름)
    P점(W, 10, 점(e, 10)); P점(W, 11, 점(e, 11))
    if (있나(e, 12)) P점(W, 12, 점(e, 12))
    const f = 수(e, 70)
    W.P(70, f)
    if (있나(e, 71)) W.P(71, 수(e, 71))
    if (있나(e, 72)) W.P(72, 수(e, 72))
    if (있나(e, 41)) W.P(41, 수(e, 41))
    if (있나(e, 42)) W.P(42, 수(e, 42))
    W.P(1, 문자(값(e, 1)))
    if (있나(e, 53)) W.P(53, 수(e, 53))
    if (있나(e, 51)) W.P(51, 수(e, 51))
    법선쓰기(W, e)
    W.P(3, 치수꼴(값(e, 3)))
    const 종류 = f & 7
    const 점4 = (cs) => { for (const c of cs) if (있나(e, c)) P점(W, c, 점(e, c)) }
    if (종류 === 0 || 종류 === 1) {
      W.P(100, 'AcDbAlignedDimension'); 점4([13, 14])
      if (종류 === 0) { if (수(e, 50)) W.P(50, 수(e, 50)); else W.P(50, 0) }
      if (수(e, 52)) W.P(52, 수(e, 52))
      if (종류 === 0) W.P(100, 'AcDbRotatedDimension')
    } else if (종류 === 2) { W.P(100, 'AcDb2LineAngularDimension'); 점4([13, 14, 15, 16]) }
    else if (종류 === 5) { W.P(100, 'AcDb3PointAngularDimension'); 점4([13, 14, 15]) }
    else if (종류 === 3 || 종류 === 4) { W.P(100, 종류 === 3 ? 'AcDbDiametricDimension' : 'AcDbRadialDimension'); 점4([15]); W.P(40, 수(e, 40)) }
    else if (종류 === 6) { W.P(100, 'AcDbOrdinateDimension'); 점4([13, 14]) }
    치수꼬리(W, e)
    if (ctx.모델) { 넓힘(수(e, 10), 수(e, 20)); if (있나(e, 13)) 넓힘(수(e, 13), 수(e, 23)) }
  }
  /* 치수 덮어쓰기(ACAD DSTYLE) — 손잡이 값(1005)과 그 판에 없는 값은 뺌 */
  const 판2007만 = new Set([49, 69, 50, 90, 290, 294, 345, 346, 347, 70, 297, 298])
  function 치수꼬리(W, e) {
    const ac = 꼬리들(e).find((x) => x.앱 === 'ACAD')
    if (!ac) return
    const 짝 = ac.짝
    const i = 짝.findIndex((p) => p[0] === 1000 && p[1] === 'DSTYLE')
    if (i < 0) return
    const 고른 = []
    for (let j = i + 2; j + 1 < 짝.length; j += 2) {
      if (짝[j][0] === 1002) break
      const 코드 = Number(짝[j][1]), 다음 = 짝[j + 1]
      if (짝[j][0] !== 1070 || 다음[0] === 1005) continue
      if (!넘('AC1021') && 판2007만.has(코드)) continue
      if (코드 === 340 || 코드 === 341 || 코드 === 342 || 코드 === 343 || 코드 === 344) continue
      고른.push([1070, 코드], 다음)
    }
    if (!고른.length) return
    W.P(1001, 'ACAD'); W.P(1000, 'DSTYLE'); W.P(1002, '{')
    for (const [c, v] of 고른) W.P(c, v)
    W.P(1002, '}')
  }

  /* ── 해치(2000 이상) — 몸은 그대로, 원본 경계 손잡이 · 연관 · 판에 없는 값만 뺌 */
  function 해치2000(W, e, ctx) {
    const 몸 = 마커뒤(e, 'AcDbHatch')
    if (!몸) { 뺌('깨진 해치'); return }
    const 그라 = 몸.some((p) => p[0] === 450 && Number(p[1]) === 1)
    const 단색으로 = 그라 && !넘('AC1018')
    /* 경계(91 ~ 경로 끝)는 차례대로 읽어 다시 씀 — 스플라인 모서리의 맞춤점(97)과 경로 끝 «원래 경계 도형 수»(97)가
       같은 코드라서 그냥 베끼면 2000 판에서 «그룹 코드 72 가 예상됨» 으로 AutoCAD 가 도면을 버림(2026-10-17 AutoCAD 2023 시험) */
    const out = []
    let i = 0
    const P = (c, v) => out.push([c, v])
    const 봄 = () => 몸[i] || [-1, '']
    const 다음 = () => 몸[i++] || [-1, '']
    const 읽 = (c) => { const p = 봄(); if (p[0] === c) { i++; return p[1] } return null }
    /* 머리 — 91 앞까지 */
    while (i < 몸.length && 봄()[0] !== 91) {
      const [c, v] = 다음()
      if (c === 71) { P(71, 0); continue }
      if (단색으로 && c === 70) { P(70, 1); continue }
      if (단색으로 && c === 2) { P(2, 'SOLID'); continue }
      if (c === 330 || c === 102 || c === 360) continue
      P(c, v)
    }
    if (봄()[0] !== 91) { 뺌('깨진 해치'); return }
    const 몇 = Number(다음()[1])
    P(91, 몇)
    for (let k = 0; k < 몇; k++) {
      while (i < 몸.length && 봄()[0] !== 92) i++
      if (i >= 몸.length) { 뺌('깨진 해치'); return }
      const 꼴 = Number(다음()[1])
      P(92, 꼴)
      if (꼴 & 2) {
        const 볼 = 읽(72), 닫 = 읽(73)
        P(72, 볼 ?? 0); P(73, 닫 ?? 1)
        const n = Number(읽(93) ?? 0); P(93, n)
        for (let m = 0; m < n; m++) {
          P(10, 읽(10) ?? 0); P(20, 읽(20) ?? 0)
          if (Number(볼)) P(42, 읽(42) ?? 0)
        }
      } else {
        const n = Number(읽(93) ?? 0); P(93, n)
        for (let m = 0; m < n; m++) {
          while (i < 몸.length && 봄()[0] !== 72) i++
          const 종 = Number(다음()[1]); P(72, 종)
          const 칸 = 종 === 1 ? [10, 20, 11, 21] : 종 === 2 ? [10, 20, 40, 50, 51, 73] : 종 === 3 ? [10, 20, 11, 21, 40, 50, 51, 73] : null
          if (칸) { for (const c of 칸) P(c, 읽(c) ?? 0); continue }
          if (종 === 4) {
            const 차 = 읽(94), 유 = 읽(73), 주 = 읽(74), nk = Number(읽(95) ?? 0), nc = Number(읽(96) ?? 0)
            P(94, 차 ?? 3); P(73, 유 ?? 0); P(74, 주 ?? 0); P(95, nk); P(96, nc)
            for (let q = 0; q < nk; q++) P(40, 읽(40) ?? 0)
            for (let q = 0; q < nc; q++) { P(10, 읽(10) ?? 0); P(20, 읽(20) ?? 0); if (Number(유)) P(42, 읽(42) ?? 1) }
            /* 맞춤점(2010 판부터): 97 n · 11/21 × n · 12/22 · 13/23 */
            if (봄()[0] === 97 && 몸[i + 1] && (몸[i + 1][0] === 11 || 몸[i + 1][0] === 12 || Number(봄()[1]) === 0) && !(몸[i + 1] && 몸[i + 1][0] === 330)) {
              const nf = Number(다음()[1])
              const 맞 = []
              for (let q = 0; q < nf; q++) 맞.push([읽(11) ?? 0, 읽(21) ?? 0])
              const t1 = [읽(12), 읽(22)], t2 = [읽(13), 읽(23)]
              if (넘('AC1024') && nf > 0) {
                P(97, nf); for (const [x, y] of 맞) { P(11, x); P(21, y) }
                P(12, t1[0] ?? 0); P(22, t1[1] ?? 0); P(13, t2[0] ?? 0); P(23, t2[1] ?? 0)
              } else if (넘('AC1024')) P(97, 0)
            } else if (넘('AC1024')) P(97, 0)
            continue
          }
          뺌('모르는 해치 모서리'); return
        }
      }
      /* 경로 끝 — 원래 경계 도형 수 97 + 330 들 → 0 */
      if (봄()[0] === 97) { const n = Number(다음()[1]); for (let q = 0; q < n && 봄()[0] === 330; q++) i++ }
      while (봄()[0] === 330) i++
      P(97, 0)
    }
    /* 나머지 — 75 꼴 · 76 · 무늬 · 씨앗점 · 그러데이션 */
    while (i < 몸.length) {
      const [c, v] = 다음()
      if (c === 330 || c === 102 || c === 360) continue
      if (c === 97) { continue }
      if (단색으로 && ((c >= 450 && c <= 470) || c === 421 || c === 63)) continue
      if (!넘('AC1018') && ((c >= 450 && c <= 470) || c === 421)) continue
      P(c, v)
    }
    머리쓰기(W, e, 'HATCH', ctx)
    W.P(100, 'AcDbHatch')
    for (const [c, v] of out) W.P(c, v)
    const bg = 꼬리들(e).find((x) => x.앱 === 'HATCHBACKGROUNDCOLOR')
    if (bg && 넘('AC1018')) { W.P(1001, 'HATCHBACKGROUNDCOLOR'); for (const [c, v] of bg.짝) W.P(c, v) }
    if (단색으로) 바꿈('그러데이션 해치 → 단색(2000 판에 없음)')
  }

  /* ── 해치 경계 → 고리들(OCS 2D) */
  function 해치고리(e) {
    const 몸 = 마커뒤(e, 'AcDbHatch') || e.g
    const 고리 = []
    let i = 몸.findIndex((p) => p[0] === 91)
    if (i < 0) return 고리
    const 몇 = Number(몸[i][1]); i++
    const 다음 = () => 몸[i++] || [0, '0']
    const 봄 = () => 몸[i] || [0, '0']
    for (let k = 0; k < 몇 && i < 몸.length; k++) {
      while (i < 몸.length && 봄()[0] !== 92) i++
      const 꼴 = Number(다음()[1])
      /* 사슬 — 이어진 점들. 모서리 경로는 모서리마다 따로(차례 · 방향이 뒤섞여 있어도 앞뒤를 잇지 않음 —
         이으면 엉뚱한 대각선이 생겨 채움이 세모로 번짐: 2026-10-17 AutoCAD 2023 에서 실제 현장 평면도 R12 로 봄) */
      const 사슬들 = []
      let 점들 = []
      const 새사슬 = () => { 점들 = []; 사슬들.push(점들); return 점들 }
      if (꼴 & 2) {
        새사슬()
        let 볼 = 0, 닫 = 1
        if (봄()[0] === 72) 볼 = Number(다음()[1])
        if (봄()[0] === 73) 닫 = Number(다음()[1])
        void 닫
        while (i < 몸.length && 봄()[0] !== 93) i++
        const n = Number(다음()[1])
        const ps = []
        for (let m = 0; m < n; m++) {
          const x = Number(다음()[1]), y = Number(다음()[1])
          let b = 0
          if (볼 && 봄()[0] === 42) b = Number(다음()[1])
          ps.push([x, y, b])
        }
        for (let m = 0; m < ps.length; m++) {
          const p = ps[m], q = ps[(m + 1) % ps.length]
          점들.push([p[0], p[1]])
          if (p[2]) 점들.push(...볼록점들(p, q, p[2]))
        }
        if (ps.length) 점들.push([ps[0][0], ps[0][1]])
      } else {
        while (i < 몸.length && 봄()[0] !== 93) i++
        const n = Number(다음()[1])
        for (let m = 0; m < n; m++) {
          while (i < 몸.length && 봄()[0] !== 72) i++
          const 종 = Number(다음()[1])
          새사슬()
          const 읽 = (c) => { while (i < 몸.length && 봄()[0] !== c && 봄()[0] !== 72 && 봄()[0] !== 97) i++; return 봄()[0] === c ? Number(다음()[1]) : 0 }
          if (종 === 1) {
            const x1 = 읽(10), y1 = 읽(20), x2 = 읽(11), y2 = 읽(21)
            점들.push([x1, y1], [x2, y2])
          } else if (종 === 2) {
            const cx = 읽(10), cy = 읽(20), r = 읽(40), s = 읽(50), f = 읽(51), ccw = 읽(73)
            let a0 = s * Math.PI / 180, a1 = f * Math.PI / 180
            if (!ccw) { a0 = -a0; a1 = -a1 }
            let 쓸 = a1 - a0
            if (ccw) { while (쓸 <= 0) 쓸 += Math.PI * 2 } else { while (쓸 >= 0) 쓸 -= Math.PI * 2 }
            if (Math.abs(Math.abs(f - s) - 360) < 1e-9) 쓸 = ccw ? Math.PI * 2 : -Math.PI * 2
            const nn = Math.max(4, Math.ceil(48 * Math.abs(쓸) / (Math.PI * 2)))
            for (let q = 0; q <= nn; q++) { const a = a0 + 쓸 * q / nn; 점들.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) }
          } else if (종 === 3) {
            const cx = 읽(10), cy = 읽(20), mx = 읽(11), my = 읽(21), rt = 읽(40), s = 읽(50), f = 읽(51), ccw = 읽(73)
            let a0 = s * Math.PI / 180, a1 = f * Math.PI / 180
            if (!ccw) { a0 = -a0; a1 = -a1 }
            let 쓸 = a1 - a0
            if (ccw) { while (쓸 <= 0) 쓸 += Math.PI * 2 } else { while (쓸 >= 0) 쓸 -= Math.PI * 2 }
            const nx = -my * rt, ny = mx * rt
            const nn = Math.max(8, Math.ceil(64 * Math.abs(쓸) / (Math.PI * 2)))
            for (let q = 0; q <= nn; q++) { const a = a0 + 쓸 * q / nn; 점들.push([cx + mx * Math.cos(a) + nx * Math.sin(a), cy + my * Math.cos(a) + ny * Math.sin(a)]) }
          } else if (종 === 4) {
            const 차 = 읽(94); 읽(73); 읽(74)
            const nk = 읽(95), nc = 읽(96)
            const 매 = [], 조 = [], 무 = []
            for (let q = 0; q < nk; q++) 매.push(읽(40))
            for (let q = 0; q < nc; q++) { const x = 읽(10), y = 읽(20); 조.push([x, y, 0]); if (봄()[0] === 42) 무.push(Number(다음()[1])) }
            for (const p of 스플라인점들(차, 매, 조, 무.length === nc ? 무 : null, Math.max(16, nc * 6))) 점들.push([p[0], p[1]])
            /* 맞춤점 · 접선은 건너뜀 */
            while (i < 몸.length && ![72, 92, 97].includes(봄()[0])) i++
          }
        }
      }
      while (i < 몸.length && 봄()[0] !== 97 && 봄()[0] !== 92 && 봄()[0] !== 75) i++
      const 쓸사슬 = 사슬들.filter((c) => c.length >= 2)
      if (쓸사슬.length && 쓸사슬.reduce((a, c) => a + c.length, 0) >= 3) 고리.push(쓸사슬)
    }
    return 고리      /* [고리[사슬[점]]] */
  }

  /* ── 해치(R12) → *X 블록(무늬 선 · 채움 조각) + 끼우기 */
  const 더블록 = []
  let x수 = 1
  function 해치R12(W, e, ctx) {
    const 고리 = 해치고리(e)
    if (!고리.length) { 뺌('경계를 못 읽은 해치'); return }
    const n = 법선(e), z = 수(e, 30)
    const 바 = ocs바꿈(n)
    const B = 쓰개()
    const 안ctx = { 주인: '', 종이: false, 모델: false }
    const 덧 = { 층: '0', 색: 0, 선: 'ByBlock', 참: null }
    const 칠 = 수(e, 70) === 1 || /^SOLID$/i.test(값(e, 2))
    let 조각 = 0
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const g of 고리) for (const c of g) for (const [x, y] of c) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    /* 모서리들 */
    const 모 = []
    for (const g of 고리) for (const c of g) for (let k = 0; k + 1 < c.length; k++) { const p = c[k], q = c[k + 1]; if (p[0] !== q[0] || p[1] !== q[1]) 모.push([p[0], p[1], q[0], q[1]]) }
    if (칠) {
      const ys = [...new Set(고리.flat(2).map((p) => p[1]))].sort((a, b) => a - b)
      for (let k = 0; k + 1 < ys.length && 선한도 > 0; k++) {
        const ya = ys[k], yb = ys[k + 1]
        if (yb - ya < 1e-12) continue
        const ym = (ya + yb) / 2
        const 걸 = []
        for (const [ax, ay, bx, by] of 모) {
          if ((ay <= ya && by >= yb) || (by <= ya && ay >= yb)) {
            const xa = ax + (bx - ax) * (ya - ay) / (by - ay), xb = ax + (bx - ax) * (yb - ay) / (by - ay), xm = ax + (bx - ax) * (ym - ay) / (by - ay)
            걸.push([xm, xa, xb])
          }
        }
        걸.sort((a, b) => a[0] - b[0])
        for (let m = 0; m + 1 < 걸.length; m += 2) {
          const L = 걸[m], R = 걸[m + 1]
          면쓰기(B, e, 안ctx, [L[1], ya, z], [R[1], ya, z], [L[2], yb, z], [R[2], yb, z], 덧, n)
          조각++; 선한도--
        }
      }
    } else {
      /* 무늬 선 */
      const 몸 = 마커뒤(e, 'AcDbHatch') || e.g
      const 줄 = []
      let i = 몸.findIndex((p) => p[0] === 78)
      const 줄수 = i >= 0 ? Number(몸[i][1]) : 0
      for (let k = 0; k < 줄수 && i >= 0; k++) {
        while (i < 몸.length && 몸[i][0] !== 53) i++
        if (i >= 몸.length) break
        const 각 = Number(몸[i][1]) * Math.PI / 180
        const 가 = (c) => { while (i < 몸.length && 몸[i][0] !== c) i++; return i < 몸.length ? Number(몸[i++][1]) : 0 }
        i++
        const bx = 가(43), by = 가(44), ox = 가(45), oy = 가(46), nd = 가(79)
        const 대시 = []
        for (let m = 0; m < nd; m++) 대시.push(가(49))
        줄.push({ 각, bx, by, ox, oy, 대시 })
      }
      for (const L of 줄) {
        const d = [Math.cos(L.각), Math.sin(L.각)], nn = [-d[1], d[0]]
        const 간 = L.ox * nn[0] + L.oy * nn[1], 밀 = L.ox * d[0] + L.oy * d[1]
        if (Math.abs(간) < 1e-9) continue
        const 꼭 = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => (x - L.bx) * nn[0] + (y - L.by) * nn[1])
        let k0 = Math.ceil(Math.min(...꼭) / 간), k1 = Math.floor(Math.max(...꼭) / 간)
        if (k0 > k1) [k0, k1] = [k1, k0]
        if ((k1 - k0) * 모.length > 4e7 || k1 - k0 > 20000) { 해치넘침++; 조각 = -1; break }
        const 합 = L.대시.reduce((s, v) => s + Math.abs(v), 0)
        const 모투 = 모.map(([ax, ay, bx2, by2]) => [(ax - L.bx) * nn[0] + (ay - L.by) * nn[1], (bx2 - L.bx) * nn[0] + (by2 - L.by) * nn[1], (ax - L.bx) * d[0] + (ay - L.by) * d[1], (bx2 - L.bx) * d[0] + (by2 - L.by) * d[1]])
        for (let k = k0; k <= k1 && 선한도 > 0; k++) {
          const off = k * 간, sh = k * 밀
          const ts = []
          for (const [pa, pb, ta, tb] of 모투) {
            const sa = pa - off, sb = pb - off
            if ((sa > 0) !== (sb > 0)) ts.push(ta + (tb - ta) * sa / (sa - sb) - sh)
          }
          if (ts.length < 2) continue
          ts.sort((a, b) => a - b)
          const 원점 = [L.bx + nn[0] * off + d[0] * sh, L.by + nn[1] * off + d[1] * sh]
          const 점P = (t) => 바([원점[0] + d[0] * t, 원점[1] + d[1] * t, z])
          for (let m = 0; m + 1 < ts.length; m += 2) {
            const ta = ts[m], tb = ts[m + 1]
            if (!L.대시.length || 합 < 1e-12) { 선쓰기(B, e, 안ctx, 점P(ta), 점P(tb), 덧); 조각++; 선한도--; continue }
            let t = Math.floor(ta / 합) * 합, q = 0
            while (t < tb && 선한도 > 0) {
              const dl = L.대시[q % L.대시.length], len = Math.abs(dl)
              const s = Math.max(t, ta), f = Math.min(t + len, tb)
              if (dl > 0 && f > s) { 선쓰기(B, e, 안ctx, 점P(s), 점P(f), 덧); 조각++; 선한도-- }
              else if (dl === 0 && t >= ta && t <= tb) { 머리쓰기(B, e, 'POINT', 안ctx, 덧); P점(B, 10, 점P(t)); 조각++; 선한도-- }
              t += len || 0; q++
              if (len === 0 && L.대시.every((v) => v === 0)) break
            }
          }
        }
        if (조각 < 0) break
      }
    }
    if (조각 === 0) { 뺌('너무 작아 무늬가 안 든 해치'); return }
    if (조각 < 0 || 선한도 <= 0) {
      /* 너무 촘촘하거나 못 그림 → 경계선만 */
      const B2 = 쓰개()
      for (const g of 고리) for (const c of g) 폴리선쓰기(B2, e, 안ctx, c.map(([x, y]) => ({ x, y })), { 닫힘: false, 높이: z, 법선: n, 덧 })
      B.줄.length = 0; B.줄.push(...B2.줄)
      바꿈('해치 → 경계선만(무늬가 너무 촘촘함)')
    } else 바꿈(칠 ? '해치(채움) → 채움 조각 블록' : '해치(무늬) → 선 블록')
    const 이름 = '*X' + (x수++)
    더블록.push({ 이름, 시작: 새손(), 끝: 새손(), 줄: B.줄, 종이: ctx.종이 })
    머리쓰기(W, e, 'INSERT', ctx)
    W.P(2, 이름); W.P(10, 0); W.P(20, 0); W.P(30, 0)
    if (ctx.모델) { 넓힘(바([x0, y0, z])[0], 바([x0, y0, z])[1]); 넓힘(바([x1, y1, z])[0], 바([x1, y1, z])[1]) }
  }

  /* ── 잘라 보이기(XCLIP) — INSERT 확장 사전 → ACAD_FILTER → SPATIAL → SPATIAL_FILTER */
  let 물체손 = null
  const OW = 쓰개()
  let 클립수 = 0
  function 클립(e) {
    let 사전h = null
    for (let i = 0; i < e.g.length; i++) if (e.g[i][0] === 102 && e.g[i][1] === '{ACAD_XDICTIONARY' && e.g[i + 1] && e.g[i + 1][0] === 360) { 사전h = e.g[i + 1][1]; break }
    if (!사전h) return null
    if (!물체손) { 물체손 = new Map(); for (const x of D.사전 || []) { const h = 값(x, 5); if (h) 물체손.set(h.toUpperCase(), x) } }
    const 항목 = (d, 이름) => { if (!d) return null; for (let i = 0; i < d.g.length; i++) if (d.g[i][0] === 3 && d.g[i][1] === 이름 && d.g[i + 1]) return 물체손.get(String(d.g[i + 1][1]).toUpperCase()) || null; return null }
    const sp = 항목(항목(물체손.get(사전h.toUpperCase()), 'ACAD_FILTER'), 'SPATIAL')
    return sp && sp.t === 'SPATIAL_FILTER' ? sp : null
  }
  function 클립쓰기(삽입h, 사전h, sp) {
    const 몸 = 마커뒤(sp, 'AcDbSpatialFilter')
    if (!몸 || !몸.length) return
    const f = 새손(), s2 = 새손()
    OW.P(0, 'DICTIONARY'); OW.P(5, 사전h); OW.P(330, 삽입h); OW.P(100, 'AcDbDictionary'); OW.P(280, 1); OW.P(281, 1); OW.P(3, 'ACAD_FILTER'); OW.P(360, f)
    OW.P(0, 'DICTIONARY'); OW.P(5, f); OW.P(102, '{ACAD_REACTORS'); OW.P(330, 사전h); OW.P(102, '}'); OW.P(330, 사전h); OW.P(100, 'AcDbDictionary'); OW.P(280, 1); OW.P(281, 1); OW.P(3, 'SPATIAL'); OW.P(360, s2)
    OW.P(0, 'SPATIAL_FILTER'); OW.P(5, s2); OW.P(102, '{ACAD_REACTORS'); OW.P(330, f); OW.P(102, '}'); OW.P(330, f); OW.P(100, 'AcDbFilter'); OW.P(100, 'AcDbSpatialFilter')
    for (const [c, v] of 몸) if (c !== 330 && c !== 102 && c !== 360 && c < 1000) OW.P(c, v)
    클립수++
  }

  /* ── 다중선(MLINE) → 폴리선들 */
  function 다중선(W, e, ctx) {
    const 꼭 = []
    let cur = null, el = -1
    for (let i = 0; i < e.g.length; i++) {
      const [c, v] = e.g[i]
      if (c === 11) { cur = { p: [Number(v), 0, 0], d: [1, 0, 0], m: [0, 1, 0], 요: [] }; 꼭.push(cur); el = -1 } else if (!cur) continue
      else if (c === 21) cur.p[1] = Number(v); else if (c === 31) cur.p[2] = Number(v)
      else if (c === 12) cur.d[0] = Number(v); else if (c === 22) cur.d[1] = Number(v); else if (c === 32) cur.d[2] = Number(v)
      else if (c === 13) cur.m[0] = Number(v); else if (c === 23) cur.m[1] = Number(v); else if (c === 33) cur.m[2] = Number(v)
      else if (c === 74) { el++; cur.요[el] = [] } else if (c === 41 && el >= 0) cur.요[el].push(Number(v))
    }
    if (꼭.length < 2) { 뺌('빈 다중선'); return }
    const 몇 = Math.max(...꼭.map((k) => k.요.length))
    const 닫힘 = (수(e, 71) & 2) !== 0
    for (let j = 0; j < 몇; j++) {
      const 점들 = 꼭.map((k) => { const s = (k.요[j] && k.요[j][0]) || 0; return [k.p[0] + k.m[0] * s, k.p[1] + k.m[1] * s, k.p[2] + k.m[2] * s] })
      점선(W, e, ctx, 점들, 닫힘)
    }
    if (ctx.모델) for (const k of 꼭) 넓힘(k.p[0], k.p[1])
    바꿈('다중선 → 폴리선')
  }

  /* ── 다중 지시선(MLEADER) → 선 + 글 + 화살
     CONTEXT_DATA{ … 41 글 높이 · 140 화살 크기 · 304 글 · 12 글 자리 … 302 LEADER{ 10 연결점 · 11 꺾임 방향 · 40 꺾임 길이 · 304 LEADER_LINE{ 10 … 305 } 303 } 301 } */
  function 다중지시선(W, e, ctx) {
    const g = e.g
    let 글 = '', 글점 = null, 높이 = 0, 화 = 0, 안 = false
    const 지시 = []
    let 지금 = null, 선 = null
    const 점읽 = (i) => [Number(g[i][1]), Number((g[i + 1] || [0, 0])[1]), Number((g[i + 2] || [0, 0])[1])]
    for (let i = 0; i < g.length; i++) {
      const [c, v] = g[i]
      if (c === 300 && /CONTEXT_DATA\{/.test(v)) { 안 = true; continue }
      if (c === 301) { 안 = false; continue }
      if (!안) continue
      if (c === 302 && /LEADER\{/.test(v)) { 지금 = { 연결: null, 방향: null, 길이: 0, 선들: [] }; 지시.push(지금); continue }
      if (c === 303) { 지금 = null; continue }
      if (c === 304 && /LEADER_LINE\{/.test(v)) { 선 = []; if (지금) 지금.선들.push(선); continue }
      if (c === 305) { 선 = null; continue }
      if (선) { if (c === 10) 선.push(점읽(i)); continue }
      if (지금) {
        if (c === 10 && !지금.연결) 지금.연결 = 점읽(i)
        else if (c === 11 && !지금.방향) 지금.방향 = 점읽(i)
        else if (c === 40) 지금.길이 = Number(v)
        continue
      }
      if (c === 304 && !글) 글 = v
      else if (c === 12 && !글점) 글점 = 점읽(i)
      else if (c === 41 && !높이) 높이 = Number(v)
      else if (c === 140 && !화) 화 = Number(v)
    }
    if (!화) 화 = 수(e, 42, 2.5) || 2.5
    let 그림 = 0
    for (const L of 지시) {
      const 끝 = []
      if (L.연결) { 끝.push(L.연결); if (L.방향 && L.길이) 끝.push([L.연결[0] + L.방향[0] * L.길이, L.연결[1] + L.방향[1] * L.길이, L.연결[2]]) }
      for (const 꼭 of L.선들.length ? L.선들 : [[]]) {
        const 점들 = [...꼭, ...끝]
        if (점들.length >= 2) { 점선(W, e, ctx, 점들, false); if (수(e, 171, 1) !== 0) 화살(W, e, ctx, 점들[0], 점들[1], 화); 그림++ }
      }
    }
    if (글 && 글점) {
      const 줄들 = 엠텍스트줄(글)
      const h = 높이 || 2.5
      줄들.forEach((줄, k) => { if (줄.trim()) 글쓰기(W, e, ctx, 줄, [글점[0], 글점[1] - h - k * h * 5 / 3, 글점[2]], h, 0, null, 'Standard') })
      그림++
    }
    if (!그림) { 뺌('다중 지시선(읽지 못함)'); return }
    if (ctx.모델 && 글점) 넓힘(글점[0], 글점[1])
    바꿈('다중 지시선 → 선 + 글 + 화살')
  }

  /* ── 뷰포트(종이) */
  const 뷰포트코드2000 = new Set([10, 20, 30, 40, 41, 68, 69, 12, 22, 13, 23, 14, 24, 15, 25, 16, 26, 36, 17, 27, 37, 42, 43, 44, 45, 50, 51, 72, 90, 1, 281, 71, 74, 110, 120, 130, 111, 121, 131, 112, 122, 132, 79, 146])
  const 뷰포트코드2007 = new Set([170, 61, 292, 282, 141, 142, 63, 421])
  function 뷰포트(W, e, ctx) {
    if (R12) {
      머리쓰기(W, e, 'VIEWPORT', ctx)
      P점(W, 10, 점(e, 10)); W.P(40, 수(e, 40)); W.P(41, 수(e, 41)); W.P(68, 수(e, 68, 1)); W.P(69, 수(e, 69, 1))
      const 방 = 있나(e, 16) ? 점(e, 16) : [0, 0, 1]
      W.P(1001, 'ACAD'); W.P(1000, 'MVIEW'); W.P(1002, '{'); W.P(1070, 16)
      W.P(1010, 수(e, 17)); W.P(1020, 수(e, 27)); W.P(1030, 수(e, 37))
      W.P(1010, 방[0]); W.P(1020, 방[1]); W.P(1030, 방[2] || 1)
      W.P(1040, 수(e, 51)); W.P(1040, 수(e, 45, 1)); W.P(1040, 수(e, 12)); W.P(1040, 수(e, 22)); W.P(1040, 수(e, 42, 50)); W.P(1040, 수(e, 43)); W.P(1040, 수(e, 44))
      W.P(1070, 0); W.P(1070, 100); W.P(1070, 1); W.P(1070, 3); W.P(1070, 0); W.P(1070, 0); W.P(1070, 0); W.P(1070, 0)
      W.P(1040, 0); W.P(1040, 0); W.P(1040, 0); W.P(1040, 0); W.P(1040, 0); W.P(1040, 0); W.P(1040, 0); W.P(1070, 0)
      W.P(1002, '{'); W.P(1002, '}'); W.P(1002, '}')
      return
    }
    const 몸 = 마커뒤(e, 'AcDbViewport')
    if (!몸) { 뺌('뷰포트(읽지 못함)'); return }
    머리쓰기(W, e, 'VIEWPORT', ctx)
    W.P(100, 'AcDbViewport')
    for (const [c, v] of 몸) {
      if (c === 331) { const n = 손이름.LAYER.get(String(v).toUpperCase()); if (n && 층핸들.has(층이름(n))) W.P(331, 층핸들.get(층이름(n))); continue }
      if (뷰포트코드2000.has(c) || (넘('AC1021') && 뷰포트코드2007.has(c))) W.P(c, v)
    }
  }
  const 층핸들 = new Map()

  /* ───── 쓰기: 블록 · 모델 · 종이 */
  const BW = 쓰개(), EW = 쓰개()
  /* 층 손잡이는 뷰포트 얼림(331)에 필요 → 먼저 원래 층 모두 매김 */
  for (const [, r] of 원층) { const 새 = 층(값(r, 2)); 층핸들.set(새, 새손()) }

  for (const 들 of 블록들) {
    const b = 들.b
    const f = 수(b, 70)
    const 외부 = (f & 4) !== 0
    const 종이 = 수(b, 67) === 1
    BW.P(0, 'BLOCK'); BW.P(5, 들.시작)
    if (!R12) { BW.P(330, 들.기록); BW.P(100, 'AcDbEntity') }
    if (종이) BW.P(67, 1)
    BW.P(8, 층(값(b, 8, '0')))
    if (!R12) BW.P(100, 'AcDbBlockBegin')
    BW.P(2, 들.이름); BW.P(70, f & (1 | 2 | 4 | 8))
    P점(BW, 10, 점(b, 10))
    BW.P(3, 들.이름)
    BW.P(1, 외부 ? 값(b, 1) : '')
    if (!외부) {
      const ctx = { 주인: 들.기록, 종이: false, 모델: false }
      for (const e of b.도형 || []) 도형(BW, e, ctx)
    }
    BW.P(0, 'ENDBLK'); BW.P(5, 들.끝)
    if (!R12) { BW.P(330, 들.기록); BW.P(100, 'AcDbEntity') }
    if (종이) BW.P(67, 1)
    BW.P(8, 층(값(b, 8, '0')))
    if (!R12) BW.P(100, 'AcDbBlockEnd')
  }
  const 모델ctx = { 주인: R12 ? '' : 정보.모델, 종이: false, 모델: true }
  const 종이ctx = { 주인: R12 ? '' : 정보.종이, 종이: true, 모델: false }
  let 모델수 = 0, 종이수 = 0
  const 종이것 = []
  for (const e of D.도형 || []) {
    if (수(e, 67) === 1) { 종이것.push(e); continue }
    도형(EW, e, 모델ctx); 모델수++
  }
  if (!종이것.length && 종이블록) 종이것.push(...(종이블록.도형 || []))
  for (const e of 종이것) { 도형(EW, e, 종이ctx); 종이수++ }
  /* R12 해치 블록 */
  for (const x of 더블록) {
    BW.P(0, 'BLOCK'); BW.P(5, x.시작)
    if (x.종이) BW.P(67, 1)
    BW.P(8, '0'); BW.P(2, x.이름); BW.P(70, 1); BW.P(10, 0); BW.P(20, 0); BW.P(30, 0); BW.P(3, x.이름); BW.P(1, '')
    for (let k = 0; k < x.줄.length; k++) BW.줄.push(x.줄[k])
    BW.P(0, 'ENDBLK'); BW.P(5, x.끝)
    if (x.종이) BW.P(67, 1)
    BW.P(8, '0')
  }

  /* ───── 표 */
  /* 선 종류 — 층 · 치수 꼴이 쓰는 것까지 */
  for (const [, r] of 원층) { const lt = 값(r, 6); if (lt) 선(lt) }
  if (!R12) for (const [, r] of 원치수꼴) for (const c of [345, 346, 347]) { const h = 값(r, c); if (h && 손이름.LTYPE.has(h.toUpperCase())) 선(손이름.LTYPE.get(h.toUpperCase())) }
  /* 글꼴 — 원래 글꼴은 모두(몇 개 안 됨) */
  for (const [u, r] of 원글꼴) if (u !== 'STANDARD' && !(수(r, 70) & 1)) 글꼴(값(r, 2))
  /* 모양 파일(SHX shape) 기록 — 이름은 비워야 함(AutoCAD: «쉐이프 파일에 대한 문자 스타일 이름이 유효하지 않음») */
  const 모양손 = new Map()     // 원래 손잡이 → { 새 손잡이, 파일 }
  for (const r of 표.STYLE || []) if ((수(r, 70) & 1) && !의존(r) && 값(r, 3)) { const h = 값(r, 5); if (h) 모양손.set(h.toUpperCase(), { 손: R12 ? '' : 새손(), 파일: 값(r, 3), r }) }
  for (const [, r] of 원치수꼴) 치수꼴(값(r, 2))

  const 선손 = new Map(), 글꼴손 = new Map()
  const 틀선 = [...틀.틀.matchAll(/  0\nLTYPE\n  5\n([0-9A-F]+)\n(?:(?!  0\n)[\s\S])*?  2\n(ByBlock|ByLayer|Continuous)\n/g)]
  for (const m of 틀선) 선손.set(m[2], m[1])
  if (!R12) 글꼴손.set('Standard', 정보.STANDARD)
  for (const [새] of 쓴선) 선손.set(새, 새손())
  for (const [새] of 쓴글꼴) 글꼴손.set(새, 새손())

  const 표W = { LTYPE: 쓰개(), LAYER: 쓰개(), STYLE: 쓰개(), DIMSTYLE: 쓰개(), BLOCK_RECORD: 쓰개() }
  const 기록머리 = (W, 종류, h, 표손, 하위) => {
    W.P(0, 종류); W.P(종류 === 'DIMSTYLE' ? 105 : 5, h)
    if (!R12) { W.P(330, 표손); W.P(100, 'AcDbSymbolTableRecord'); W.P(100, 하위) }
  }
  /* LTYPE */
  for (const [새, 원] of 쓴선) {
    const r = 원선.get(String(원).toUpperCase())
    const W = 표W.LTYPE
    기록머리(W, 'LTYPE', 선손.get(새), 정보.LTYPE, 'AcDbLinetypeTableRecord')
    W.P(2, 새); W.P(70, 0); W.P(3, 문자(값(r, 3)).slice(0, 47)); W.P(72, 65)
    /* 요소: 49 길이 · 74 꼴 · 75 모양 번호 · 340 글꼴 · 46 배율 · 50 회전 · 44/45 밀림 · 9 글 */
    const 요 = []
    let cur = null
    for (const [c, v] of r.g) {
      if (c === 49) { cur = { 길: Number(v), 꼴: 0, 덧: [] }; 요.push(cur) } else if (!cur) continue
      else if (c === 74) cur.꼴 = Number(v)
      else if ([75, 340, 46, 50, 44, 45, 9].includes(c)) cur.덧.push([c, v])
    }
    W.P(73, 요.length); W.P(40, 수(r, 40) || 요.reduce((s, x) => s + Math.abs(x.길), 0))
    let 단순화 = false
    for (const x of 요) {
      W.P(49, x.길)
      if (R12) continue
      let 꼴 = x.꼴
      if (꼴) {
        const 글h = String((x.덧.find((p) => p[0] === 340) || [])[1] || '').toUpperCase()
        let 새h = null
        if (꼴 & 4) { const m = 모양손.get(글h); if (m) 새h = m.손 }        /* 모양 — 모양 파일 기록 */
        else { const 글이름 = 글h ? 손이름.STYLE.get(글h) : null; const 새글 = 글이름 ? 글꼴(글이름) : null; if (새글 && 글꼴손.has(새글)) 새h = 글꼴손.get(새글) }
        if (!새h) { 꼴 = 0; 단순화 = true }
        else {
          W.P(74, 꼴)
          for (const [c, v] of x.덧) W.P(c, c === 340 ? 새h : v)
          continue
        }
      }
      W.P(74, 0)
    }
    if (단순화 || (R12 && 요.some((x) => x.꼴))) 바꿈('글 · 모양이 든 선 종류 → 단순 선(점선)')
  }
  for (const [, x] of 파생) {
    const r = 원선.get(x.밑.toUpperCase())
    const W = 표W.LTYPE
    기록머리(W, 'LTYPE', 새손(), 정보.LTYPE, 'AcDbLinetypeTableRecord')
    W.P(2, x.이름); W.P(70, 0); W.P(3, 문자(값(r, 3)).slice(0, 40) + ` x${+x.배.toFixed(4)}`); W.P(72, 65)
    const 길이들 = 모두(r, 49).map(Number)
    W.P(73, 길이들.length); W.P(40, 길이들.reduce((a, v) => a + Math.abs(v), 0) * x.배)
    for (const v of 길이들) W.P(49, v * x.배)
  }
  if (파생.size) 바꿈셈['도형마다의 선 종류 배율 → 배율 넣은 선 종류(R12)'] = 파생.size
  /* LAYER */
  {
    const W = 표W.LAYER
    const 순 = [...쓴층.keys()].sort((a, b) => (a === '0' ? -1 : b === '0' ? 1 : 0))
    for (const 새 of 순) {
      const 원 = 쓴층.get(새)
      const r = 원층.get(String(원).toUpperCase())
      const h = 층핸들.get(새) || 새손()
      층핸들.set(새, h)
      기록머리(W, 'LAYER', h, 정보.LAYER, 'AcDbLayerTableRecord')
      W.P(2, 새)
      W.P(70, r ? 수(r, 70) & 7 : 0)
      let 색 = r ? 수(r, 62, 7) : 7
      if (!색) 색 = 7
      const 참 = r && 있나(r, 420) ? 수(r, 420) : null
      if (참 !== null && !넘('AC1018') && Math.abs(색) === 7) 색 = (색 < 0 ? -1 : 1) * 가까운색(참)
      W.P(62, 색)
      if (참 !== null && 넘('AC1018')) W.P(420, 참)
      const lt = r ? 선(값(r, 6, 'Continuous')) : 'Continuous'
      W.P(6, lt || 'Continuous')
      if (!R12) {
        if ((r && 있나(r, 290) && 수(r, 290) === 0) || /^defpoints$/i.test(새)) W.P(290, 0)
        W.P(370, r && 있나(r, 370) ? 수(r, 370) : -3)
        for (const [c, v] of 정보.층꼬리) W.P(Number(c), v)
      }
    }
  }
  /* STYLE */
  for (const [새, 원] of 쓴글꼴) {
    const r = 원글꼴.get(String(원).toUpperCase())
    const W = 표W.STYLE
    기록머리(W, 'STYLE', 글꼴손.get(새), 정보.STYLE, 'AcDbTextStyleTableRecord')
    const f = 글꼴정함(새, r, true)
    W.P(2, 새); W.P(70, 수(r, 70) & 7)
    W.P(40, 수(r, 40)); W.P(41, 수(r, 41, 1) || 1); W.P(50, 수(r, 50)); W.P(71, 수(r, 71)); W.P(42, 수(r, 42, 2.5) || 2.5)
    W.P(3, f.파일); W.P(4, f.큰)
    if (!R12 && f.가족) { W.P(1001, 'ACAD'); W.P(1000, f.가족); W.P(1071, f.꼴 || 34) }
  }
  for (const [, m] of 모양손) {
    const W = 표W.STYLE
    기록머리(W, 'STYLE', m.손 || 새손(), 정보.STYLE, 'AcDbTextStyleTableRecord')
    W.P(2, ''); W.P(70, 1); W.P(40, 0); W.P(41, 수(m.r, 41, 1) || 1); W.P(50, 0); W.P(71, 0); W.P(42, 수(m.r, 42, 1) || 1); W.P(3, m.파일); W.P(4, '')
  }
  /* Standard 글꼴 */
  const 표준 = 글꼴정함('Standard', 원글꼴.get('STANDARD') || null, true)
  /* DIMSTYLE */
  const 치수공통 = new Set([3, 4, 40, 41, 42, 43, 44, 45, 46, 47, 48, 140, 141, 142, 143, 144, 145, 146, 147, 148, 71, 72, 73, 74, 75, 76, 77, 78, 79, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 371, 372])
  const 치수R12 = new Set([3, 4, 5, 6, 7, 40, 41, 42, 43, 44, 45, 46, 47, 48, 140, 141, 142, 143, 144, 145, 146, 147, 71, 72, 73, 74, 75, 76, 77, 78, 170, 171, 172, 173, 174, 175, 176, 177, 178])
  const R12치수기본 = [[3, ''], [4, ''], [5, ''], [6, ''], [7, ''], [40, 1], [41, 2.5], [42, 0.625], [43, 3.75], [44, 1.25], [45, 0], [46, 0], [47, 0], [48, 0],
    [140, 2.5], [141, 2.5], [142, 0], [143, 0.03937007874], [144, 1], [145, 0], [146, 1], [147, 0.625], [71, 0], [72, 0], [73, 0], [74, 0], [75, 0], [76, 0], [77, 1], [78, 8],
    [170, 0], [171, 3], [172, 1], [173, 0], [174, 0], [175, 0], [176, 0], [177, 0], [178, 0]]
  for (const [새, 원] of 쓴치수꼴) {
    const r = 원치수꼴.get(String(원).toUpperCase())
    const W = 표W.DIMSTYLE
    if (R12) {
      /* R12: 3 · 4 · 5 · 6 · 7 부터 정한 차례로 모두(빠지면 «생략된 그룹 3» 으로 도면이 취소됨) */
      W.P(0, 'DIMSTYLE'); W.P(105, 새손()); W.P(2, 새); W.P(70, 0)
      const 몸 = 마커뒤(r, 'AcDbDimStyleTableRecord') || r.g
      const 값들 = new Map()
      for (const [c, v] of 몸) if (치수R12.has(c) && !값들.has(c)) 값들.set(c, v)
      const 블이름 = (c) => { const h = 값(r, c); const n = h ? 손이름.BLOCK_RECORD.get(String(h).toUpperCase()) : null; const bl = n ? 블록(n) : null; return bl ? bl.이름 : '' }
      if (!값들.has(5)) 값들.set(5, 블이름(342)); if (!값들.has(6)) 값들.set(6, 블이름(343)); if (!값들.has(7)) 값들.set(7, 블이름(344))
      for (const [c, d] of R12치수기본) W.P(c, 값들.has(c) ? 값들.get(c) : d)
      continue
    }
    기록머리(W, 'DIMSTYLE', 새손(), 정보.DIMSTYLE, 'AcDbDimStyleTableRecord')
    W.P(2, 새)
    let 처음70 = true
    const 몸 = 마커뒤(r, 'AcDbDimStyleTableRecord') || r.g
    W.P(70, 0)
    for (const [c, v] of 몸) {
      if (c === 2 || c === 5 || c === 105 || c === 330 || c === 102 || c === 100) continue
      if (c === 70) { if (처음70) { 처음70 = false; continue } if (넘('AC1021')) W.P(70, v); continue }
      if (R12) { if (치수R12.has(c)) W.P(c, v); continue }
      if (c === 340) { const n = 손이름.STYLE.get(String(v).toUpperCase()); const 새글 = n ? 글꼴(n) : null; if (새글 && 글꼴손.has(새글)) W.P(340, 글꼴손.get(새글)); continue }
      if (c >= 341 && c <= 344) { const n = 손이름.BLOCK_RECORD.get(String(v).toUpperCase()); const bl = n ? 블록(n) : null; if (bl) W.P(c, bl.기록); continue }
      if (c >= 345 && c <= 347) { if (!넘('AC1021')) continue; const n = 손이름.LTYPE.get(String(v).toUpperCase()); const 새선 = n ? 선(n) : null; if (새선 && 선손.has(새선)) W.P(c, 선손.get(새선)); continue }
      if (치수공통.has(c) || (넘('AC1021') && 판2007만.has(c))) W.P(c, v)
    }
  }
  /* BLOCK_RECORD */
  if (!R12) {
    const W = 표W.BLOCK_RECORD
    for (const 들 of 블록들) {
      기록머리(W, 'BLOCK_RECORD', 들.기록, 정보.BLOCK_RECORD, 'AcDbBlockTableRecord')
      W.P(2, 들.이름); W.P(340, 0)
      if (넘('AC1021')) {
        const r = 원BR.get(들.원래.toUpperCase())
        W.P(70, r ? 수(r, 70) : 0); W.P(280, r && 있나(r, 280) ? 수(r, 280) : 1); W.P(281, r ? 수(r, 281) : 0)
      }
    }
  }

  /* ───── 틀 채우기 */
  {
    const 머리점 = (이름) => { const i = (D.머리 || []).findIndex((p) => p[0] === 9 && p[1] === 이름); return i < 0 ? null : [Number(D.머리[i + 1][1]), Number(D.머리[i + 2][1])] }
    const a = 머리점('$EXTMIN'), b = 머리점('$EXTMAX')
    const 좋 = a && b && a.every((v) => Number.isFinite(v) && Math.abs(v) < 1e15) && b.every((v) => Number.isFinite(v) && Math.abs(v) < 1e15) && b[0] > a[0] && b[1] > a[1]
    if (좋 && (!Number.isFinite(범.x0) || (a[0] <= 범.x1 && b[0] >= 범.x0 && a[1] <= 범.y1 && b[1] >= 범.y0))) {
      범.x0 = Math.min(a[0], Number.isFinite(범.x0) ? 범.x0 : a[0]); 범.y0 = Math.min(a[1], Number.isFinite(범.y0) ? 범.y0 : a[1])
      범.x1 = Math.max(b[0], Number.isFinite(범.x1) ? 범.x1 : b[0]); 범.y1 = Math.max(b[1], Number.isFinite(범.y1) ? 범.y1 : b[1])
    }
  }
  if (!Number.isFinite(범.x0)) { 범.x0 = 0; 범.y0 = 0; 범.x1 = 420; 범.y1 = 297 }
  const w = Math.max(범.x1 - 범.x0, 1e-6), hgt = Math.max(범.y1 - 범.y0, 1e-6)
  const 채움 = {
    HANDSEED: () => 손.toString(16).toUpperCase(),
    EXMINX: () => 수글(범.x0), EXMINY: () => 수글(범.y0), EXMAXX: () => 수글(범.x1), EXMAXY: () => 수글(범.y1),
    LIMMAXX: () => 수글(Math.max(범.x1, 420)), LIMMAXY: () => 수글(Math.max(범.y1, 297)),
    LTSCALE: () => 수글(Number(머리(D, '$LTSCALE', 40)) || 1),
    DWGCODEPAGE: () => 'ANSI_949',
    INSUNITS: () => String(Number(머리(D, '$INSUNITS', 70)) || 0),
    MEASUREMENT: () => String(머리(D, '$MEASUREMENT', 70) === '' ? 1 : Number(머리(D, '$MEASUREMENT', 70))),
    VPCX: () => 수글((범.x0 + 범.x1) / 2), VPCY: () => 수글((범.y0 + 범.y1) / 2),
    VPH: () => 수글(Math.max(hgt, w / 1.6) * 1.08), VPA: () => '1.6',
    LTYPEN: () => String(3 + 쓴선.size + 파생.size), LTYPES: () => 줄글(표W.LTYPE),
    LAYERN: () => String(쓴층.size), LAYERS: () => 줄글(표W.LAYER),
    STYLEN: () => String(1 + 쓴글꼴.size + 모양손.size), STYLES: () => 줄글(표W.STYLE),
    STDFONT: () => 표준.파일, STDBIG: () => 표준.큰,
    DIMSTYLEN: () => String(1 + 쓴치수꼴.size), DIMSTYLES: () => 줄글(표W.DIMSTYLE),
    BLOCK_RECORDN: () => String(2 + 블록들.length), BLOCK_RECORDS: () => 줄글(표W.BLOCK_RECORD),
    BLOCKS: () => 줄글(BW), ENTITIES: () => 줄글(EW),
    LAYOUTNAME: () => { const n = 열린배치 ? (모두(열린배치, 1).filter(Boolean).pop() || 'Layout1') : 'Layout1'; return 이름가게(false)(n === 'Model' ? 'Layout1' : n) },
    PLOTSET: () => 종이설정(),
    OBJECTS: () => 줄글(OW),
    CLASSES: () => {
      if (!클립수 || (정보.클래스 || []).includes('SPATIAL_FILTER')) return ''
      const c = ['  0', 'CLASS', '  1', 'SPATIAL_FILTER', '  2', 'AcDbSpatialFilter', '  3', 'ObjectDBX Classes', ' 90', '0']
      if (넘('AC1018')) c.push(' 91', String(클립수))
      c.push('280', '0', '281', '0')
      return c.join('\n') + '\n'
    },
  }
  function 줄글(W) { return W.줄.length ? W.줄.join('\n') + '\n' : '' }
  function 종이설정() {
    if (!열린배치) return 정보.종이설정
    const 몸 = 마커뒤(열린배치, 'AcDbPlotSettings')
    if (!몸 || !몸.length) return 정보.종이설정
    const 줄 = []
    const 받 = new Set([1, 2, 4, 6, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 140, 141, 142, 143, 70, 72, 73, 74, 7, 75, 76, 77, 78, 147, 148, 149])
    for (const [c, v] of 몸) if (받.has(c)) 줄.push(c < 10 ? '  ' + c : c < 100 ? ' ' + c : String(c), 문자(v))
    return 줄.join('\n') + '\n'
  }
  let 글 = 틀.틀.replace(/@@([A-Z_]+)@@/g, (m, k) => (채움[k] ? 채움[k]() : m))
  글 = 글.replace(/\n/g, '\r\n')

  /* 알림 */
  if (다른배치) 알림.push({ 급: '중', 글: `배치(종이 공간) ${다른배치 + 1}개 중 지금 열린 «${채움.LAYOUTNAME()}» 하나만 옮겼습니다 — 다른 배치가 필요하면 «그대로 고치기» 를 쓰세요` })
  if (클립수) 알림.push({ 급: '안내', 글: `잘라 보이기(XCLIP) ${클립수}개 그대로 옮김` })
  if (해치넘침) 알림.push({ 급: '낮', 글: `무늬가 너무 촘촘한 해치 ${해치넘침}개는 경계선만 남겼습니다` })
  for (const [k, n] of Object.entries(뺌셈)) 알림.push({ 급: /그림|입체|OLE|가림막|전용|공차/.test(k) ? '중' : '낮', 글: `빠짐: ${k} ${n}개` })
  for (const [k, n] of Object.entries(바꿈셈)) 알림.push({ 급: '안내', 글: `바꿔 씀: ${k} ${n}개` })

  const 인코딩 = 넘('AC1021') ? 'utf-8' : 'euc-kr'
  return {
    글, 인코딩, 판,
    바이트: () => 싸기(글, 인코딩),
    알림,
    셈: { 모델: 모델수, 종이: 종이수, 블록: 블록들.length + 더블록.length, 층: 쓴층.size, 선: 쓴선.size, 글꼴: 쓴글꼴.size + 1, 바꿈: 바꿈셈, 뺌: 뺌셈, 범: { ...범 } },
  }

  /* 글꼴 정하기 — 고른 글꼴 · 이름 없는 TTF 채우기 */
  /* R12 는 TTF 를 파일 이름으로만 찾음(가족 이름 꼬리가 없음) — 2026-10-17 AutoCAD 2023 시험:
       gulim.ttc(굴림 · 돋움 묶음) · Dotum.ttf · Gulim.ttf(없는 파일 이름) · 이 PC 에 없는 TTF 는 글꼴 기록이 비고(이름 · 파일 «»)
       글은 simplex 로 바뀌어 한글이 «?» → R12 에서는 맑은 고딕(malgun.ttf — 윈도우에 늘 있는 낱 파일)으로 */
  function R12못씀(파일) {
    const f = String(파일 || '').trim()
    if (!/\.tt[fc]$/i.test(f)) return false
    if (/\.ttc$/i.test(f) || /^(gulim|gulimche|dotum|dotumche|batang|batangche|gungsuh|gungsuhche)\.ttf$/i.test(f)) return true
    return !윈도우글꼴.test(f) && !/^(h2\w*|hy\w*|hmk\w*|hans\w*)\.ttf$/i.test(f)     // 윈도우 글꼴 · 한글 프로그램 글꼴(HY · H2)은 둠
  }
  /* R12: 여러 줄 글 → 한 줄 글로 바꿀 때 줄에 기호(· ※ « » …)가 있고 글꼴이 SHX 면 «?» 로 보임(AutoCAD 2023 시험 —
     여러 줄 글은 캐드가 다른 글꼴로 메워 주지만 한 줄 글은 안 메움) → 그 줄만 맑은 고딕 글꼴(«기호_맑은고딕»)로 */
  function 기호글꼴(n) {
    const u = String(n || 'Standard').toUpperCase()
    const f = 글꼴정함(u === 'STANDARD' ? 'Standard' : n, 원글꼴.get(u) || null)
    if (/\.tt[fc]$/i.test(f.파일)) return n
    const 이름 = '기호_맑은고딕'
    if (!원글꼴.has(이름)) 원글꼴.set(이름, { t: 'STYLE', g: [[2, 이름], [70, 0], [40, 0], [41, 1], [50, 0], [71, 0], [42, 2.5], [3, 'malgun.ttf'], [4, '']] })
    바꿈('여러 줄 글의 기호(SHX 에 없음 — · ※ « » …) 든 줄 → 맑은 고딕')
    return 이름
  }
  function 글꼴정함(새이름, r, 셈함 = false) {
    const f = 글꼴정함0(새이름, r, 셈함)
    if (R12 && R12못씀(f.파일)) {
      if (셈함) 바꿈('R12 에서 못 읽는 TTF(굴림 · 돋움 · 바탕 · 궁서 묶음 글꼴 · 흔치 않은 글꼴) → 맑은 고딕')
      return { 파일: 'malgun.ttf', 큰: '', 가족: '', 꼴: f.꼴 }
    }
    if (셈함 && f.고른 && (f.원파일.toLowerCase() !== f.파일.toLowerCase() || f.원큰.toLowerCase() !== f.큰.toLowerCase())) 바꿈(`글꼴 → ${f.고른.이름.replace(/\s*\(.*$/, '')}`)
    return f
  }
  function 글꼴정함0(새이름, r, 셈함) {
    const 원파일 = r ? 값(r, 3) : 'txt', 원큰 = r ? 값(r, 4) : ''
    const ac = r ? 꼬리들(r).find((x) => x.앱 === 'ACAD') : null
    let 가족 = ac ? ((ac.짝.find((p) => p[0] === 1000) || [])[1] || '') : ''
    const 꼴 = ac ? Number((ac.짝.find((p) => p[0] === 1071) || [])[1] || 0) : 0
    const 키 = String(r ? 값(r, 2) : 새이름).toUpperCase()
    const 고름 = (o.글꼴 && o.글꼴[키]) || o.모두
    const 고른 = typeof 고름 === 'string' ? 글꼴판[고름] : 고름
    if (고른 && 고른.파일 !== undefined && !(r && 수(r, 70) & 1)) {
      const 새가족 = /\.tt[fc]$/i.test(고른.파일) ? (고른.가족 || 고른.이름.replace(/\s*\(.*$/, '')) : ''
      return { 파일: 고른.파일, 큰: 고른.큰 || '', 가족: R12 ? '' : 새가족, 꼴: 34, 고른, 원파일: String(원파일 || ''), 원큰: String(원큰 || '') }
    }
    let 파일 = 원파일 || ''
    if (!파일 && 가족 && o.빈글꼴 !== false) { const f = 가족글꼴파일(가족); if (f) { 파일 = f; if (셈함 && !(R12 && R12못씀(f))) 바꿈('이름 없는 TTF 글꼴 → 파일 이름 채움') } }
    if (!파일 && !가족) 파일 = 'txt'
    if (R12) 가족 = ''
    return { 파일, 큰: 원큰 || '', 가족, 꼴 }
  }
}
