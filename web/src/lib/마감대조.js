/**
 * 🎯 마감 — 도면에서 찾은 방 ↔ 계약 내역서 «바닥 마감» 대조 (G298 · 2026-10-16)
 *
 * 소장님: 「이제 골조물량하고 마감물량 업그레이드 하자」 → 넷 다(④ 마감도 내역 대조 · 🎯 한눈에) → 「이제까지 만든 도구 이용해서 최대한 차이 없게 만들어 봐」
 * ■ 마감표(방마다 바닥 · 벽 · 천장 재료)가 없어도 견줄 수 있는 것부터 — «바닥 넓이».
 *   내역서 바닥 마감 줄(타일 · 비닐계타일 · 카펫 · 석재 · 후로링 · 에폭시 …)의 합 = 그 건물 방 바닥 넓이 합(안목)에 가까워야 함.
 *   방 이름으로 무리를 나눠 더 자세히: 화장실 ↔ «화장실» 바닥 줄 · 홀 · 복도 ↔ «홀 · 복도» 줄 · 계단(참고 — 내역 «계단부» 는 디딤 · 챌판 펼친 넓이).
 * ■ 바탕 층(모르타르 · 방수 · 단열 · 방습 · 와이어메시 · 휘니셔)과 자재 줄(«(자재)» · 관급 자재)은 안 셈 — 같은 넓이를 두 번 세지 않게.
 *   외부(«외부») 바닥 · 철거 · 보양 · 재료분리대도 뺌. 같은 줄이 여러 시트(내역서 · 계약 내역)에 있으면 한 번만.
 * ■ 방 쪽: 샤프트(EPS · PS · 덕트) · 승강로 · 뚫린 곳(OPEN)은 뺌.
 * 시험: node tools/시험_마감대조.mjs
 */
import { 단위풀기 } from './내역대조.js'

const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
const 수 = (v) => { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : 0 }

/* 바닥 마감 재료(이 말이 있어야 마감 줄) */
const 마감재 = /타일|TILE|카펫|카페트|CARPET|비닐계|데코|장판|후로링|플로링|FLOORING|마루|원목|합판마루|석재|화강석|대리석|테라조|에폭시|EPOXY|우레탄(?!폼)|악세스|ACCESS|논슬립|고무|탄성|코르크|인조석|포세린|자기질|도기질|폴리싱|노출콘크리트.*마감/i
/* 그 자체로 바닥 재료(«바닥» 글이 없어도) */
const 바닥재 = /카펫|카페트|CARPET|비닐계|데코타일|장판|후로링|플로링|FLOORING|마루|악세스|ACCESS|에폭시|EPOXY/i
/* 바탕 · 다른 일(품명에 있으면 안 셈) — 규격의 «모르타르 40mm»(붙임 바탕)는 괜찮음 */
const 안셈 = /\(자재\)|자재비|관급|방수|단열|보온|방습|와이어|메시|메쉬|모르타르|몰탈|휘니셔|쇠흙손|흙손|익스팬션|재료분리대|분리대|철거|보양|배수판|보호|줄눈파기|가공비|마구리|모서리|모따기|논슬립홈|운반|양중|할증|코킹|코너|비드|걸레받이|두겁|창대/i
/* 바닥이 아닌 자리(품명 · 규격 어디든) */
const 딴자리 = /벽|천장|천정|수직|외부|옥외|옥상|지붕/

/** 내역 한 줄이 «바닥 마감» 인가 → 무리 '화장실' · '홀복도' · '계단' · '그밖' | null */
export function 바닥줄무리(x) {
  const 글 = 붙(x.품명) + ' ' + 붙(x.규격)
  const u = 단위풀기(x.단위 || '')
  if (!u || u.무리 !== 'm2') return null
  if (!마감재.test(글)) return null
  /* «계단부» 는 바닥 줄(벽 · 천장 말이 없어도) — 계단 무리 */
  const 계단 = /계단/.test(글)
  if (안셈.test(붙(x.품명)) || 딴자리.test(글)) return null
  if (!계단 && !/바닥|FLOOR/i.test(글) && !바닥재.test(글)) return null
  if (계단) return '계단'
  if (/화장실|변소|TOILET|욕실|샤워/i.test(글)) return '화장실'
  if (/홀|복도|로비|현관|라운지|HALL|LOBBY|CORR/i.test(글)) return '홀복도'
  return '그밖'
}

/** 방 이름 → 무리 · 빼는 방 */
export function 방무리(r) {
  const n = 붙(r.실명)
  const b = r._방 || {}
  if (b.샤프트 || b.마감없음 || /^(EPS|PS|TPS|AD|DA|DS|DUCT|덕트|샤프트|SHAFT|AV)$/i.test(n) || /승강로|승강기|E\/?V홀?$|^EV$|PIT$|피트$/i.test(n)) return null
  if (/계단/.test(n)) return '계단'
  if (/화장실|변소|TOILET|WC|욕실|샤워|파우더/i.test(n)) return '화장실'
  if (/홀|복도|로비|현관|라운지|방풍|통로|전실|HALL|LOBBY|CORR/i.test(n) && !/다목적홀|강당/.test(n)) return '홀복도'
  return '그밖'
}

/* 🧱 G298 ③ 벽 · 천장 마감 줄(참고) — 바탕(모르타르 · 석고판 · 칸막이 · 정리) · 자재 · 외부는 뺌 */
const 벽재 = /페인트|도장|타일|흡음|패드|벽지|도배|무늬목|판넬|패널|석재|화강석|대리석|마무리/
const 벽아님 = /외부|외벽|천장|천정|바닥|철거|방수|단열|칸막이|석고판|모르타르|몰탈|바탕용|걸레받이|\(자재\)|관급|보양|코킹|후레싱|창호|유리/
export function 벽줄인가(x) {
  const u = 단위풀기(x.단위 || '')
  if (!u || u.무리 !== 'm2') return false
  const 글 = 붙(x.품명) + ' ' + 붙(x.규격)
  return /벽|내벽|내부/.test(글) && 벽재.test(글) && !벽아님.test(글)
}
/** 천장 줄 — 천장틀(TM-BAR · M-BAR · T-BAR · 천장틀이 품명에) 줄 하나가 천장 넓이 하나(판 · 텍스 · 도장은 같은 넓이라 안 셈) + 노출 천장 마무리 */
export function 천장줄인가(x) {
  const u = 단위풀기(x.단위 || '')
  if (!u || u.무리 !== 'm2') return false
  const 품 = 붙(x.품명), 글 = 품 + ' ' + 붙(x.규격)
  if (!/천장|천정/.test(글) || /외부|외천|내풍압|보강|몰딩|철거|\(자재\)/.test(글)) return false
  if (/TM-?BAR|M-?BAR|T-?BAR|천장틀|천정틀/i.test(품)) return true
  return /내천정|내천장/.test(글) && /마무리/.test(품)
}
/** 내역 창호 목록의 창 넓이 — «1.200 x 1.800 = 2.160» × 수량(SET) · 기호에 D(문) · ST(셔터) 가 든 것은 문 */
export function 내역창넓이(줄) {
  let 창 = 0, 문 = 0
  for (const x of 줄 || []) {
    const m = /([\d.]+)\s*[x×X*]\s*([\d.]+)\s*=\s*([\d.]+)/.exec(String(x.규격 || ''))
    if (!m || !/^(SET|조|개소|EA)$/i.test(붙(x.단위)) || !(x.수량 > 0)) continue
    const 기호 = (/^([A-Z]+)/.exec(붙(x.품명)) || [])[1] || ''
    const a = Number(m[3]) * x.수량
    if (!기호) continue
    if (/D|ST/.test(기호)) 문 += a; else 창 += a
  }
  return { 창, 문 }
}

/** 같은 줄(시트만 다른 것) 한 번만 */
function 하나만(줄) {
  const 본 = new Set()
  const out = []
  for (const x of 줄) {
    const k = 붙(x.품명) + '|' + 붙(x.규격) + '|' + 붙(x.단위) + '|' + x.수량
    if (본.has(k)) continue
    본.add(k); out.push(x)
  }
  return out
}

const 무리이름 = { 합: '바닥 합(계단 넓이 넣음)', 화장실: '화장실 바닥', 홀복도: '홀 · 복도 바닥', 그밖: '그 밖의 방 바닥', 계단: '계단(참고)' }

/**
 * 대조
 * @param 실 공사.실 (자동으로 찾은 방 줄 — 면적 · 개수 · _방)
 * @param 내역 내역읽기() 결과({줄})
 * @returns { 줄: [{무리, 이름, 도구, 내역, 차이율, 방: [이름], 내역줄: [{품명, 규격, 수량}]}], 바닥줄: n, 뺀방: [이름] }
 */
export function 마감대조(실, 내역, o = {}) {
  const 방 = { 화장실: [], 홀복도: [], 그밖: [], 계단: [] }
  const 뺀방 = []
  for (const r of 실 || []) {
    const A = 수(r.면적) * (수(r.개수) || 1)
    if (!(A > 0) || !String(r.실명 || '').trim()) continue
    const g = 방무리(r)
    if (!g) { 뺀방.push(r.실명); continue }
    const b = r._방 || {}
    const C = 수(b.중심면적 || b.면적선 || r.면적) * (수(r.개수) || 1)      /* 벽 중심(설계 «면적» 처럼) — 없으면 안목 */
    방[g].push({ 이름: r.실명, 층: r.층 || '', A, C, 디딤: 수(b.디딤) || 0, n: 수(r.개수) || 1 })
  }
  const 줄들 = { 화장실: [], 홀복도: [], 그밖: [], 계단: [] }
  for (const x of 하나만((내역 && 내역.줄) || [])) {
    if (!(x.수량 > 0)) continue
    const g = 바닥줄무리(x)
    if (g) 줄들[g].push({ 품명: x.품명, 규격: x.규격, 수량: x.수량 * (단위풀기(x.단위).배 || 1) })
  }
  const 합 = (l, k) => l.reduce((a, b) => a + b[k], 0)
  const 한줄 = (g, 방들, 내줄) => {
    const 도구 = 합(방들, 'A'), 중심 = 합(방들, 'C'), 내 = 합(내줄, '수량')
    const 율 = (v) => (내 > 0 ? ((v - 내) / 내) * 100 : null)
    return { 무리: g, 이름: 무리이름[g], 도구, 중심, 내역: 내, 차이율: 율(도구), 중심율: 율(중심), 방: 방들.map((x) => (x.층 ? x.층 + ' ' : '') + x.이름), 내역줄: 내줄 }
  }
  /* 합 — 계단실 평면 넓이는 넣고(계단참 · 앞 바닥은 바닥 줄) 내역 «계단부»(디딤 · 챌판)는 뺌 */
  const 모든방 = [...방.화장실, ...방.홀복도, ...방.그밖, ...방.계단]
  const 모든줄 = [...줄들.화장실, ...줄들.홀복도, ...줄들.그밖]
  const 줄 = [한줄('합', 모든방, 모든줄), 한줄('화장실', 방.화장실, 줄들.화장실), 한줄('홀복도', 방.홀복도, 줄들.홀복도)]
  /* 그 밖 = 합 − 화장실 − 홀복도 (내역의 무리 없는 줄 ↔ 그 밖의 방 + 계단실) */
  줄.push(한줄('그밖', [...방.그밖, ...방.계단], 줄들.그밖))
  /* 🪜 G299 ③ 계단 — 내역 «계단부» = 디딤 · 챌판 펼친 넓이. 평면 넓이(디딤 · 참)에 챌판(계단 폭 × 그 층에서 위층까지 높이 — 두 꺾임이 한 층 높이를 오름)을 더함.
       계단 폭 = 평면의 디딤판 선 길이(도면전부 _방.디딤) · 층 높이 = 단면도 레벨(«1FL +4,100» — 📐 단면도 넣기). 둘 중 하나라도 없으면 평면 넓이만(알림) */
  const 계단줄 = 한줄('계단', 방.계단, 줄들.계단)
  {
    const 레벨 = o.층높이 ? Object.entries(o.층높이).map(([k, v]) => [String(k), +v]).filter((x) => Number.isFinite(x[1])).sort((a, b) => a[1] - b[1]) : []
    const 층키 = (f) => { const t = String(f || '').toUpperCase().replace(/층$|F$/, ''); if (레벨.some((x) => x[0] === t)) return t; if (/^B1$/.test(t) && 레벨.some((x) => x[0] === 'PIT')) return 'PIT'; return t }
    const 위높이 = (f) => { const k = 층키(f); const i = 레벨.findIndex((x) => x[0] === k); return i >= 0 && i + 1 < 레벨.length ? 레벨[i + 1][1] - 레벨[i][1] : 0 }
    let 챌 = 0, 폭없음 = 0, 높없음 = 0
    for (const x of 방.계단) {
      const H = 위높이(x.층)
      if (!(x.디딤 > 0)) { 폭없음++; continue }
      if (!(H > 0)) { 높없음++; continue }
      챌 += x.디딤 * H * x.n
    }
    if (방.계단.length) {
      const 율 = (v) => (계단줄.내역 > 0 ? ((v - 계단줄.내역) / 계단줄.내역) * 100 : null)
      계단줄.덧 = { 평면: 계단줄.도구, 챌판: 챌, 폭없음, 높없음, 단면: 레벨.length > 0 }
      if (챌 > 0) { 계단줄.도구 += 챌; 계단줄.중심 += 챌; 계단줄.차이율 = 율(계단줄.도구); 계단줄.중심율 = 율(계단줄.중심) }
    }
  }
  줄.push({ ...계단줄, 참고: true })
  /* 🧱 벽 · 천장(참고) — 벽 = 둘레 × 천장고 − 문(실 줄 창호 칸 · 창호표 폭 × 높이) − 창(내역 창호 목록 넓이 · 도면엔 창 크기가 없어서)
     천장 = 방 바닥 넓이. 천장고가 빈 방은 기본 천장고(없으면 2.7 m) */
  const 유 = 하나만((내역 && 내역.줄) || [])
  const 기본H = 수(o.기본천장고) || 2.7
  const 창표 = new Map((o.창호 || []).map((w) => [String(w.기호 || '').toUpperCase(), w]))
  let 벽 = 0, 문 = 0, 천장 = 0, 기본씀 = 0, 벽방 = 0
  for (const r of 실 || []) {
    if (!방무리(r) || !String(r.실명 || '').trim()) continue
    const n = 수(r.개수) || 1, L = 수(r.둘레), A = 수(r.면적)
    천장 += A * n
    if (!(L > 0)) continue
    let H = 수(r.천장고)
    if (!(H > 0)) { H = 기본H; 기본씀++ }
    let d = 0
    for (const t of String(r.창호 || '').split(/[\s,]+/).filter(Boolean)) {
      const [k, c] = t.split(/[*×]/)
      const w = 창표.get(String(k).toUpperCase())
      if (w) d += 수(w.폭) * 수(w.높이) * (수(c) || 1)
    }
    벽 += (L * H - d) * n; 문 += d * n; 벽방++
  }
  const 창 = 내역창넓이(유).창
  const 벽줄 = 유.filter(벽줄인가).map((x) => ({ 품명: x.품명, 규격: x.규격, 수량: x.수량 }))
  const 천줄 = 유.filter(천장줄인가).map((x) => ({ 품명: x.품명, 규격: x.규격, 수량: x.수량 }))
  const 내벽 = 합(벽줄, '수량'), 내천 = 합(천줄, '수량')
  const 벽도구 = 벽 - 창
  줄.push({ 무리: '벽', 이름: '벽(참고)', 참고: true, 도구: 벽도구, 중심: null, 내역: 내벽, 차이율: 내벽 > 0 ? ((벽도구 - 내벽) / 내벽) * 100 : null, 중심율: null, 방: [], 내역줄: 벽줄,
    덧: { 둘레높이: 벽 + 문, 문, 창, 기본씀, 벽방, 기본H } })
  줄.push({ 무리: '천장', 이름: '천장(참고)', 참고: true, 도구: 천장, 중심: null, 내역: 내천, 차이율: 내천 > 0 ? ((천장 - 내천) / 내천) * 100 : null, 중심율: null, 방: [], 내역줄: 천줄 })
  return { 줄, 바닥줄: 모든줄.length + 줄들.계단.length, 뺀방 }
}

/** 한눈에 한 줄 글 — «바닥 합 1,294 ㎡ ↔ 내역 1,348 ㎡ (−4.0 %)» */
export function 대조말(d) {
  const a = d.줄[0]
  if (!a || !(a.내역 > 0)) return '내역서에서 바닥 마감 줄을 못 찾았습니다'
  const f = (v) => Math.round(v).toLocaleString('ko-KR')
  const p = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + ' %'
  return '바닥 합 안목 ' + f(a.도구) + ' ㎡(' + p(a.차이율) + ') · 벽 중심 ' + f(a.중심) + ' ㎡(' + p(a.중심율) + ') ↔ 내역 ' + f(a.내역) + ' ㎡'
}

/* ───────────────────────────── 📐 단면도 → 방마다 천장고 (G298 ③) */

/**
 * 단면도의 «CH=2700» 글 → 곁(위 0.4 ~ 1.6 m · 옆 3.6 m 안)의 실 이름에 그 천장고
 *   한 방이 여러 단면에 나오면 가장 많이 나온 값(같으면 큰 값). 이름은 실키(띄어쓰기 · 끝 번호 · 괄호 뗌)로.
 * @param 모델 도면읽기 결과 · @param 실이름인가 (s) => bool · @param 실키 (s) => 열쇠
 * @returns Map(열쇠 → {m: 천장고(m), 이름, 수: 나온 번수, 값들})
 */
export function 단면천장고(모델, 실이름인가, 실키, k = 1) {
  const T = 모델.T
  const 글들 = []
  for (let i = 0; i < T.s.length; i++) 글들.push({ s: String(T.s[i] || '').trim(), x: T.x[i], y: T.y[i], h: T.h[i] || 0 })
  for (const q of 모델.숨은글 || []) 글들.push({ s: String(q.s || '').trim(), x: q.x, y: q.y, h: q.h || 0 })
  const CH = []
  for (const g of 글들) {
    const m = /^(?:CH|C\.H|천장고|천정고|반자높이)\s*[=:]?\s*([\d,.]+)\s*(mm|m)?$/i.exec(g.s.replace(/\s+/g, ' '))
    if (!m) continue
    let v = Number(m[1].replace(/,/g, ''))
    if (!(v > 0)) continue
    if (v > 100) v /= 1000                       /* 2700 → 2.7 m */
    if (v < 2 || v > 12) continue
    CH.push({ ...g, v })
  }
  const 이름 = 글들.filter((g) => 실이름인가(g.s) && !/^공용$/.test(g.s.replace(/\s+/g, '')))
  const 표 = new Map()
  for (const c of CH) {
    const 배 = (c.h > 0 ? c.h / 250 : 1) / (k || 1) * (k || 1)     /* 글 크기에 맞춰 거리 늘림(1/100 · 1/50) */
    const 후보 = 이름.filter((n) => { const dy = n.y - c.y, dx = Math.abs(n.x - c.x); return dy >= 400 * 배 && dy <= 1600 * 배 && dx <= 3600 * 배 })
    if (!후보.length) continue
    const 가까 = Math.min(...후보.map((n) => Math.abs(n.x - c.x)))
    for (const n of 후보.filter((n) => Math.abs(n.x - c.x) <= 가까 + 400 * 배)) {
      const 키 = 실키(n.s)
      const a = 표.get(키) || { 이름: n.s.replace(/\s+/g, ''), 값들: [] }
      a.값들.push(c.v); 표.set(키, a)
    }
  }
  for (const a of 표.values()) {
    const 수 = new Map()
    for (const v of a.값들) 수.set(v, (수.get(v) || 0) + 1)
    const [best] = [...수].sort((p, q) => q[1] - p[1] || q[0] - p[0])
    a.m = best[0]; a.수 = a.값들.length
  }
  return 표
}

/** 표(단면천장고)에서 방 이름 하나의 천장고 — 같은 열쇠 · 없으면 끝이 같은 이름(«화장실(추정)» ↔ «장애인화장실») */
export function 천장고찾기(표, 실명, 실키) {
  const 이름 = String(실명 || '').split('·')[0]
  const 키 = 실키(이름)
  if (!키) return null
  if (표.has(키)) return 표.get(키)
  let best = null
  for (const [k, a] of 표) if (k.length >= 2 && (k.endsWith(키) || 키.endsWith(k)) && (!best || a.수 > best.수)) best = a
  return best
}
