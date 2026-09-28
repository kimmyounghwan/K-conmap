/**
 * 📋 도면의 «정착·이음 길이표» 읽기 (2026-09-28)
 *
 * 소장님: 「1번부터 6번까지 한꺼번에 가자」 — 받은 무료 프로그램 설명서의 «이음·정착표 자동 판독» 을 «방식만» 따름
 *   (그 프로그램의 코드·자료는 쓰지 않았습니다. 컴파일된 파일은 열지 않았습니다.)
 *
 * ■ 하는 일: 구조도 «일반구조사항» 의 정착·이음 길이표를 읽어 골조 기준값(정착·이음 mm)에 넣습니다.
 *   ① 표 찾기 — 지름 글자(D10·HD13·SHD22…)가 한 줄(가로) 또는 한 열(세로)로 셋 넘게 늘어선 곳 + 가까이 «정착»·«이음» 글자
 *   ② 표 모양 — 가로: 지름이 열 머리, 줄마다 이름(인장정착·인장이음…)·fck / 세로: 지름이 줄, 열 머리가 이름
 *      소표가 여러 단이면(지름 머리 줄이 또 나오면) 단마다 따로
 *   ③ 합친 칸(한 이름이 여러 줄에 걸친 칸) — 표의 가로·세로 선으로 칸 범위를 잡음(선이 없으면 가까운 줄)
 *   ④ 줄 이름 → 어느 칸인지 짐작(인장정착·상부정착·압축정착·인장이음·압축이음·갈고리정착). 모르면 비움 → 화면에서 고름
 *   ⑤ 값: mm(100~5000) · m(0.1~5 → ×1000) · «40d» (지름 × 40)
 * ■ 짐작은 늘 화면에 보이고, 넣기 전에 사람이 고릅니다(자동에서는 «이 기준 fck» 와 맞는 줄만 넣고 알려 드림).
 * ■ 시험: node tools/시험_정착표읽기.mjs
 */
import { 철근표 } from './골조.js'

const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
const 지름목록 = ['D10', 'D13', 'D16', 'D19', 'D22', 'D25', 'D29', 'D32', 'D35', 'D38', 'D41', 'D51']
const 지름차례 = new Map(지름목록.map((d, i) => [d, i]))

/** 「D10」「HD10」「SD13」「SHD22」「UHD16」「H10」 → 'D10' (지름만 있는 글자일 때만) */
export function 지름(s) {
  const t = 붙(s).toUpperCase().replace(/[()]/g, '')
  const m = t.match(/^(?:S?H?D|UHD|SD|H)(\d{2})$/)
  if (!m) return ''
  const d = 'D' + m[1]
  return 철근표[d] ? d : ''
}

/** 값 글자 → mm (못 읽으면 null). 「470」「1,090」「0.47」(m) 「40d」「40db」 */
export function 값읽기(s, d) {
  const t = 붙(s).replace(/,/g, '').toUpperCase()
  let m = t.match(/^(\d+(?:\.\d+)?)D(?:B)?$/)
  if (m && d && 철근표[d]) return Math.ceil(+m[1] * 철근표[d][0] / 10 - 1e-9) * 10
  m = t.match(/^(\d+(?:\.\d+)?)(?:MM)?$/)
  if (!m) return null
  const v = +m[1]
  if (v >= 100 && v <= 5000) return Math.round(v)
  if (v >= 0.1 && v < 5 && /\./.test(m[1])) return Math.round(v * 1000)
  return null
}

/** fck 글자 — 「24」「fck=24」「24MPa」「C24」「f'ck 27」 → 24 · 아니면 null */
export function fck읽기(s) {
  const t = 붙(s).toUpperCase().replace(/[’'`]/g, '')
  const m = t.match(/^(?:F?CK=?|C)?(\d{2})(?:MPA)?$/)
  if (!m) return null
  const v = +m[1]
  return v >= 15 && v <= 80 ? v : null
}

/**
 * 줄·열 이름 → 기준값 칸 짐작
 * @returns '인장정착'|'상부정착'|'압축정착'|'인장이음'|'압축이음'|'갈고리정착'|''
 */
export function 칸짐작(이름) {
  const u = 붙(이름).toUpperCase()
  if (!u) return ''
  if (/갈고리|HOOK|후크|훅|L_?DH/.test(u)) return '갈고리정착'
  const 이음 = /이음|겹침|LAP|SPLICE/.test(u)
  const 정착 = /정착|DEVELOP|L_?D\b|LD/.test(u)
  if (/압축|COMP/.test(u)) return 이음 ? '압축이음' : 정착 ? '압축정착' : ''
  if (이음) {
    if (/상부|TOP/.test(u)) return ''          // 상부 이음은 칸이 없음 — 화면에서 고름
    if (/A급|CLASSA/.test(u) && !/B급|CLASSB/.test(u)) return ''   // A급만이면 B급(기본)과 다름 — 화면에서 고름
    return '인장이음'
  }
  if (정착) return /상부|TOP/.test(u) ? '상부정착' : '인장정착'
  return ''
}
export const 칸이름 = { 인장정착: '인장 정착', 상부정착: '상부 정착', 압축정착: '압축 정착', 인장이음: '인장 이음', 압축이음: '압축 이음', 갈고리정착: '갈고리 정착' }
export const 칸들 = Object.keys(칸이름)

/* ───────────────────────────── 도면 → 글자·선 (mm) */

/**
 * @param 모델 lib/골조도면.js 도면읽기() 결과
 * @param k 도면 단위 → mm 배율
 * @param 상자 [x0,y0,x1,y1] 도면 단위 (null 이면 전체)
 * @param 끈층 Set(레이어 번호) — 꺼 둔 레이어는 뺌
 */
export function 글자모음(모델, k = 1, 상자 = null, 끈층 = null) {
  const { T, E } = 모델
  const out = []
  for (let i = 0; i < T.s.length; i++) {
    const s = String(T.s[i] ?? '').trim()
    if (!s) continue
    if (끈층 && 끈층.has(E.ly[T.e[i]])) continue
    const a = T.a[i] || 0
    if (Math.abs(Math.sin(a)) > 0.2) continue            // 세운 글자는 표 글자로 안 봄
    const h = T.h[i] * k
    let w = 0
    for (const ch of s) w += /[ㄱ-힝]/.test(ch) ? 1.0 : (ch === ' ' ? 0.5 : 0.75)
    w *= h
    const x = T.x[i] * k + w / 2, y = T.y[i] * k + h / 2
    if (상자 && !(x >= 상자[0] * k && x <= 상자[2] * k && y >= 상자[1] * k && y <= 상자[3] * k)) continue
    out.push({ i, s, x, y, h, w })
  }
  return out
}

/** 가로·세로 선분 (mm) — 표의 칸 경계 */
export function 선모음(모델, k = 1, 상자 = null, 끈층 = null) {
  const { E, Q, P } = 모델
  const 가로 = [], 세로 = []
  const X0 = 상자 ? 상자[0] * k : -Infinity, Y0 = 상자 ? 상자[1] * k : -Infinity, X1 = 상자 ? 상자[2] * k : Infinity, Y1 = 상자 ? 상자[3] * k : Infinity
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q], t = E.t[e]
    if (!(t === 1 || t === 2 || t === 3)) continue        // 선·폴리선·닫힌 폴리선
    if (끈층 && 끈층.has(E.ly[e])) continue
    const s = Q.p0[q], n = Q.pn[q]
    const 끝 = t === 3 ? n : n - 1
    for (let j = 0; j < 끝; j++) {
      const a = s + j, b = s + ((j + 1) % n)
      const x0 = P[a * 2] * k, y0 = P[a * 2 + 1] * k, x1 = P[b * 2] * k, y1 = P[b * 2 + 1] * k
      const L = Math.hypot(x1 - x0, y1 - y0)
      if (L < 1e-6) continue
      if (Math.max(x0, x1) < X0 || Math.min(x0, x1) > X1 || Math.max(y0, y1) < Y0 || Math.min(y0, y1) > Y1) continue
      if (Math.abs(y1 - y0) <= L * 0.01) 가로.push({ y: (y0 + y1) / 2, x0: Math.min(x0, x1), x1: Math.max(x0, x1) })
      else if (Math.abs(x1 - x0) <= L * 0.01) 세로.push({ x: (x0 + x1) / 2, y0: Math.min(y0, y1), y1: Math.max(y0, y1) })
    }
  }
  return { 가로, 세로 }
}

/* ───────────────────────────── 작은 도구 */

/** 값들을 tol 안에서 무리 짓기 → [[...], ...] (값 차례대로) */
function 무리(목록, key, tol) {
  const a = [...목록].sort((p, q) => key(p) - key(q))
  const out = []
  for (const it of a) {
    const g = out[out.length - 1]
    if (g && Math.abs(key(it) - key(g[g.length - 1])) <= tol(it)) g.push(it)
    else out.push([it])
  }
  return out
}
/** 글자가 든 칸의 세로 범위 [아래, 위] — 글자 위·아래로 가장 가까운 가로선(글자 x 를 지나는 것) */
function 칸세로(g, 선) {
  let 위 = Infinity, 아래 = -Infinity
  for (const L of 선.가로) {
    if (L.x0 > g.x + 0.1 * g.h || L.x1 < g.x - 0.1 * g.h) continue
    if (L.y > g.y && L.y < 위) 위 = L.y
    if (L.y < g.y && L.y > 아래) 아래 = L.y
  }
  return [아래, 위]
}
/** 글자가 든 칸의 가로 범위 [왼, 오른] — 글자 좌우로 가장 가까운 세로선(글자 y 를 지나는 것) */
function 칸가로(g, 선) {
  let 왼 = -Infinity, 오른 = Infinity
  for (const L of 선.세로) {
    if (L.y0 > g.y + 0.1 * g.h || L.y1 < g.y - 0.1 * g.h) continue
    if (L.x < g.x && L.x > 왼) 왼 = L.x
    if (L.x > g.x && L.x < 오른) 오른 = L.x
  }
  return [왼, 오른]
}
/** 같은 높이에서 맞닿은 가로선 잇기 — 칸마다 네모로 그린 표도 줄 하나로 봄 */
function 이은가로(선들, tol) {
  const 무리들 = 무리(선들, (L) => L.y, () => tol)
  const out = []
  for (const g of 무리들) {
    const a = [...g].sort((p, q) => p.x0 - q.x0)
    let cur = { ...a[0] }
    for (const L of a.slice(1)) {
      if (L.x0 <= cur.x1 + tol) cur.x1 = Math.max(cur.x1, L.x1)
      else { out.push(cur); cur = { ...L } }
    }
    out.push(cur)
  }
  return out
}
/** 표 제목 같은 글(「정착 및 이음 길이표」) — 줄·열 이름에 섞지 않음 */
const 제목같음 = (s) => { const u = 붙(s); return /표$|TABLE|일반구조|구조일반|■/.test(u) || (/정착/.test(u) && /이음/.test(u)) }
/** 제목으로 짐작 — 「정착 및 이음」 처럼 둘 다 있으면 모름 */
const 제목짐작 = (t) => { const u = 붙(t); return /정착/.test(u) && /이음/.test(u) ? '' : 칸짐작(t) }
/** 제목·머리 글 안의 fck — 「(fck=24MPa)」「f'ck 27」 */
export function 글속fck(t) { const m = 붙(t).toUpperCase().replace(/[’'`]/g, '').match(/FCK[=:]?(\d{2})/); return m ? +m[1] : null }
const 이름글 = (목록) => 목록.map((g) => g.s.trim()).filter(Boolean).join(' ')

/* ───────────────────────────── 표 읽기 */

/**
 * 한 표(또는 네모로 고른 곳)의 글자·선에서 정착·이음 줄을 읽습니다
 * @param 글자들 글자모음() 결과 · @param 선 선모음() 결과 · @param 제목 표 위 제목 글(줄 이름이 없을 때 씀)
 * @returns {방향:'가로'|'세로'|'', 줄:[{이름, fck, 값:{D10:mm…}, 칸, 곳:[x0,y0,x1,y1](mm)}], 지름들, 경고:[글]}
 */
export function 표읽기(글자들, 선 = { 가로: [], 세로: [] }, 제목 = '') {
  const 경고 = []
  const 지름글 = 글자들.filter((g) => 지름(g.s)).map((g) => ({ ...g, d: 지름(g.s) }))
  if (지름글.length < 3) return { 방향: '', 줄: [], 지름들: [], 경고: ['지름 글자(D10·D13…)를 셋 넘게 찾지 못했습니다 — 표 전체를 감싸 주십시오'] }
  const 가로머리 = 무리(지름글, (g) => g.y, (g) => g.h * 0.6)
    .map((줄) => 줄.sort((a, b) => a.x - b.x)).filter((줄) => 오름(줄))
  const 세로머리 = 무리(지름글, (g) => g.x, (g) => Math.max(g.h * 1.2, g.w * 0.6))
    .map((열) => 열.sort((a, b) => b.y - a.y)).filter((열) => 오름(열))
  const 가 = 가로머리.length ? 가로읽기(글자들, 선, 가로머리, 제목) : null
  const 세 = 세로머리.length ? 세로읽기(글자들, 선, 세로머리, 제목) : null
  const 셈 = (r) => (r ? r.줄.reduce((s, z) => s + Object.keys(z.값).length, 0) : 0)
  const 고른 = 셈(세) > 셈(가) ? 세 : 가
  if (!고른 || !고른.줄.length) return { 방향: '', 줄: [], 지름들: [], 경고: ['지름 머리 아래(옆)에서 길이 숫자를 찾지 못했습니다'] }
  const 지름들 = 지름목록.filter((d) => 고른.줄.some((z) => z.값[d] != null))
  for (const z of 고른.줄) z.그럴듯 = 그럴듯(z.값)
  return { ...고른, 지름들, 경고: 경고.concat(고른.경고 || []) }
}
/** 지름이 셋 넘게 · 겹치지 않고 커지는 차례(한 칸 빠져도 됨) */
function 오름(목록) {
  const ds = 목록.map((g) => g.d)
  if (new Set(ds).size < 3 || new Set(ds).size !== ds.length) return false
  for (let i = 1; i < ds.length; i++) if (지름차례.get(ds[i]) <= 지름차례.get(ds[i - 1])) return false
  return true
}

/** 가로 — 지름이 열 머리. 머리 줄마다(소표) 그 아래 다음 머리 줄 전까지가 그 소표 */
function 가로읽기(글자들, 선, 머리들, 제목) {
  const 줄 = []
  const 차례 = [...머리들].sort((a, b) => b[0].y - a[0].y)      // 위에서 아래로
  차례.forEach((머리, hi) => {
    const 열 = 머리.map((g) => ({ d: g.d, x: g.x, h: g.h }))
    const 간격 = Math.min(...열.slice(1).map((c, i) => c.x - 열[i].x))
    const 반 = 간격 / 2
    const 위 = 머리[0].y - 머리[0].h * 0.6
    const 다음 = 차례[hi + 1]
    const 아래 = 다음 ? 다음[0].y + 다음[0].h * 0.6 : -Infinity
    const 왼끝 = 열[0].x - 반, 오끝 = 열[열.length - 1].x + 반
    const 안 = 글자들.filter((g) => g.y < 위 && g.y > 아래)
    // 소표 머리 줄 왼쪽의 fck(「fck=24」「24」) · 없으면 제목 속 fck
    const 머리왼 = 글자들.filter((g) => g.x < 왼끝 && Math.abs(g.y - 머리[0].y) <= 머리[0].h * 0.8)
    let 머리fck = null
    for (const g of 머리왼) { const f = fck읽기(g.s) ?? 글속fck(g.s); if (f !== null) { 머리fck = f; break } }
    if (머리fck === null) 머리fck = 글속fck(제목)
    // 값 글자 → 열
    const 값글 = []
    for (const g of 안) {
      if (g.x < 왼끝 || g.x > 오끝) continue
      let best = null
      for (const c of 열) if (Math.abs(g.x - c.x) <= 반 && (!best || Math.abs(g.x - c.x) < Math.abs(g.x - best.x))) best = c
      if (!best) continue
      const v = 값읽기(g.s, best.d)
      if (v == null) continue
      값글.push({ ...g, d: best.d, v })
    }
    if (!값글.length) return
    // 값 줄
    const 값줄들 = 무리(값글, (g) => g.y, (g) => g.h * 0.6).sort((a, b) => b[0].y - a[0].y)
    // 왼쪽 이름표 글자(머리 줄 높이 위의 «구분» 같은 머리글은 뺌)
    //   이웃한 다른 표의 글자가 섞이지 않게: 표의 가로선(지름 열까지 이어진 선)이 있으면 그 선이 지나는 글자만,
    //   표에 가로선이 없으면 첫 지름 열에서 25글자 높이 안만. 철근 글(D10@200·4-D22)은 이름이 아님
    const 첫x = 열[0].x
    const 표선 = 이은가로(선.가로.filter((L) => L.y < 위 + 머리[0].h * 2 && L.y > 아래), 머리[0].h * 0.3).filter((L) => L.x0 < 첫x && L.x1 > 첫x)
    const 표안글 = (g) => (표선.length ? 표선.some((L) => L.x0 <= g.x - g.w / 2 + g.h * 0.5) : 첫x - g.x <= 25 * g.h)
    const 왼글 = 안.filter((g) => g.x < 왼끝 && 표안글(g) && !/@|\d-?[A-Z]*D\d{2}|^[A-Z]*D\d{2}[+,]/i.test(붙(g.s)))
    const 끝 = 값줄들.length ? 값줄들[값줄들.length - 1][0].y - 값줄들[값줄들.length - 1][0].h * 2 : 아래
    // 한 이름표 글자의 칸 세로 범위 — 선이 있으면 선, 없으면 가까운 값 줄
    const 붙임 = 왼글.filter((g) => g.y >= 끝 && !제목같음(g.s)).map((g) => {
      const [a0, a1] = 칸세로(g, 선)
      return { g, a0: Number.isFinite(a0) ? a0 : null, a1: Number.isFinite(a1) ? a1 : null }
    })
    // 안쪽 가로선이 없는 표(바깥 테두리만) — 같은 이름 열의 글자들이 같은 칸 범위를 가지면 선으로 못 가른 것 → 가까운 줄로
    for (const b of 붙임) {
      if (b.a0 === null) continue
      const 같은 = 붙임.filter((o) => o !== b && o.a0 !== null && Math.abs(o.a0 - b.a0) < 1e-6 && Math.abs(o.a1 - b.a1) < 1e-6 && Math.abs(o.g.x - b.g.x) < b.g.h * 3)
      if (같은.length) { b.없앰 = true; for (const o of 같은) o.없앰 = true }
    }
    for (const b of 붙임) if (b.없앰) { b.a0 = null; b.a1 = null }
    for (const vz of 값줄들) {
      const y = vz.reduce((s, g) => s + g.y, 0) / vz.length
      const h = vz[0].h
      let 붙은 = 붙임.filter((b) => b.a0 !== null && b.a1 !== null && y > b.a0 && y < b.a1 && b.a1 - b.a0 < 20 * h)
      if (!붙은.length) 붙은 = 붙임.filter((b) => Math.abs(b.g.y - y) <= h * 0.6)
      // 선이 없고 합친 칸이면 — 같은 «이름 열» 에서 가장 가까운 이름(위쪽 먼저)
      const 열별 = new Map()
      for (const b of 붙임) {
        if (붙은.includes(b)) continue
        if (b.a0 !== null && b.a1 !== null) continue
        const key = Math.round(b.g.x / (b.g.h * 3))
        const 지금 = 열별.get(key)
        const d = Math.abs(b.g.y - y)
        if (!지금 || d < 지금.d) 열별.set(key, { b, d })
      }
      for (const [, { b, d }] of 열별) if (d <= h * 4 && !붙은.some((x) => Math.round(x.g.x / (x.g.h * 3)) === Math.round(b.g.x / (b.g.h * 3)))) 붙은 = 붙은.concat([b])
      붙은.sort((a, b) => a.g.x - b.g.x)
      const 글들 = 붙은.map((b) => b.g)
      let fck = null
      const 이름조각 = []
      for (const g of 글들) { const f = fck읽기(g.s); if (f !== null && fck === null) fck = f; else 이름조각.push(g) }
      let 이름 = 이름글(이름조각)
      if (!칸짐작(이름) && 제목 && 제목짐작(제목)) 이름 = (이름 ? 이름 + ' ' : '') + '(' + 제목 + ')'
      if (fck === null) fck = 머리fck
      const 값 = {}
      for (const g of vz) if (값[g.d] == null) 값[g.d] = g.v
      const xs = vz.map((g) => g.x), ys = vz.map((g) => g.y)
      줄.push({ 이름, fck, 값, 칸: 칸짐작(이름), 곳: [Math.min(...xs, ...글들.map((g) => g.x)) - h, Math.min(...ys) - h, Math.max(...xs) + h, Math.max(...ys) + h] })
    }
  })
  return { 방향: '가로', 줄 }
}

/** 세로 — 지름이 줄, 열 머리(여러 단일 수 있음)가 이름 */
function 세로읽기(글자들, 선, 열들, 제목) {
  const 줄 = []
  for (const 지열 of 열들) {
    const 첫 = 지열[0], 끝 = 지열[지열.length - 1]
    const h = 첫.h
    const 간격 = Math.min(...지열.slice(1).map((g, i) => 지열[i].y - g.y))
    const 반 = 간격 / 2
    const 위 = 첫.y + 반, 아래 = 끝.y - 반
    const 오른글 = 글자들.filter((g) => g.x > 첫.x + 첫.w / 2 && g.y <= 위 && g.y >= 아래)
    const 값글 = []
    for (const g of 오른글) {
      let best = null
      for (const c of 지열) if (Math.abs(g.y - c.y) <= 반 && (!best || Math.abs(g.y - c.y) < Math.abs(g.y - best.y))) best = c
      if (!best) continue
      const v = 값읽기(g.s, best.d)
      if (v == null) continue
      값글.push({ ...g, d: best.d, v })
    }
    if (!값글.length) continue
    const 값열들 = 무리(값글, (g) => g.x, (g) => Math.max(g.h * 1.5, g.w * 0.6)).sort((a, b) => a[0].x - b[0].x)
    // 다른 지름 열이 오른쪽에 또 있으면(옆으로 붙은 소표) 그 앞까지만
    const 옆 = 열들.filter((o) => o !== 지열 && o[0].x > 첫.x && Math.abs(o[0].y - 첫.y) < 간격 * 2).map((o) => o[0].x)
    const 한계 = 옆.length ? Math.min(...옆) : Infinity
    // 머리글 — 표의 세로선(지름 줄까지 내려오는 선)이 있으면 그 선 가까이의 글자만(위에 붙은 다른 표 글자를 빼려고)
    const 표세로 = 선.세로.filter((L) => L.y0 <= 끝.y && L.y1 >= 첫.y)
    const 머리안 = (g) => (표세로.length ? 표세로.some((L) => L.y1 >= g.y - g.h * 0.5 && Math.abs(L.x - g.x) <= Math.max(g.w, 30 * g.h)) : true)
    const 머리글 = 글자들.filter((g) => g.y > 첫.y + h * 0.6 && g.y < 첫.y + 간격 * 6 + h * 8 && g.x < 한계 && !제목같음(g.s) && 머리안(g))
    for (const vc of 값열들) {
      const x = vc.reduce((s, g) => s + g.x, 0) / vc.length
      if (x >= 한계) continue
      const hh = vc[0].h
      // 이 열을 덮는 머리글: 선이 있으면 칸 가로 범위, 없으면 x 가 가까운 것(위 단은 넓게)
      const 덮는 = 머리글.filter((g) => {
        const [l, r] = 칸가로(g, 선)
        if (Number.isFinite(l) && Number.isFinite(r) && r - l < 40 * hh) return x > l && x < r
        return Math.abs(g.x - x) <= Math.max(g.w / 2, hh * 2.5)
      }).sort((a, b) => b.y - a.y)
      let fck = null
      const 이름조각 = []
      for (const g of 덮는) { const f = fck읽기(g.s); if (f !== null && fck === null) fck = f; else if (!지름(g.s)) 이름조각.push(g) }
      let 이름 = 이름글(이름조각)
      if (!칸짐작(이름) && 제목 && 제목짐작(제목)) 이름 = (이름 ? 이름 + ' ' : '') + '(' + 제목 + ')'
      if (fck === null) fck = 글속fck(제목)
      const 값 = {}
      for (const g of vc) if (값[g.d] == null) 값[g.d] = g.v
      const xs = vc.map((g) => g.x), ys = vc.map((g) => g.y)
      줄.push({ 이름, fck, 값, 칸: 칸짐작(이름), 곳: [Math.min(...xs) - hh * 2, Math.min(...ys) - hh, Math.max(...xs) + hh * 2, Math.max(...ys) + hh] })
    }
  }
  return { 방향: '세로', 줄 }
}

/**
 * 정착·이음 길이다운가 — 지름이 굵을수록 길거나 같고(줄지 않음), 길이 ÷ 지름이 5~150 배 안.
 *   (철근 재료표의 «길이»·«개수» 열처럼 다른 숫자를 정착·이음으로 잘못 넣지 않으려고)
 */
export function 그럴듯(값) {
  const ds = 지름목록.filter((d) => 값[d] != null)
  if (ds.length < 2) return false
  let 앞 = -Infinity
  for (const d of ds) {
    const v = 값[d]
    const 배 = v / 철근표[d][0]
    if (!(배 >= 5 && 배 <= 150)) return false
    if (v < 앞) return false
    앞 = v
  }
  return true
}

/* ───────────────────────────── 도면 전체에서 표 찾기 */

const 표낱말 = /정착|이음|겹침|LAP|SPLICE|DEVELOPMENT/i

/**
 * 도면 전체에서 정착·이음표 같은 곳을 찾습니다
 * @returns [{상자:[x0,y0,x1,y1](도면 단위), 제목, 표:표읽기 결과}] — 값을 가장 많이 읽은 차례
 */
export function 표찾기(모델, k = 1, 끈층 = null) {
  const 모두 = 글자모음(모델, k, null, 끈층)
  const 지름글 = 모두.filter((g) => 지름(g.s)).map((g) => ({ ...g, d: 지름(g.s) }))
  if (지름글.length < 3) return []
  const 낱말 = 모두.filter((g) => 표낱말.test(붙(g.s)))
  if (!낱말.length) return []
  const 머리들 = []
  for (const 줄 of 무리(지름글, (g) => g.y, (g) => g.h * 0.6)) {
    // 한 줄에 여러 표가 나란히 있을 수 있어 x 간격으로 다시 나눔
    for (const 덩 of 무리(줄, (g) => g.x, (g) => g.h * 12)) if (오름([...덩].sort((a, b) => a.x - b.x))) 머리들.push({ 방: '가로', 글: 덩 })
  }
  for (const 열 of 무리(지름글, (g) => g.x, (g) => Math.max(g.h * 1.2, g.w * 0.6))) {
    for (const 덩 of 무리(열, (g) => g.y, (g) => g.h * 6)) if (오름([...덩].sort((a, b) => b.y - a.y))) 머리들.push({ 방: '세로', 글: 덩 })
  }
  const 후보 = []
  for (const 머 of 머리들) {
    const xs = 머.글.map((g) => g.x), ys = 머.글.map((g) => g.y)
    const h = 머.글[0].h
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    // 가까운 «정착·이음» 낱말(표 제목·줄 이름)
    const 가까운 = 낱말.filter((g) => g.x > x0 - 60 * h && g.x < x1 + 60 * h && g.y > y0 - 60 * h && g.y < y1 + 25 * h)
    if (!가까운.length) continue
    if (머.방 === '가로') { x0 -= 40 * h; x1 += 3 * h; y1 += 12 * h; y0 -= 45 * h }
    else { x0 -= 6 * h; x1 += 70 * h; y1 += 18 * h; y0 -= 3 * h }
    const 제목글 = 가까운.filter((g) => g.y > Math.max(...ys)).sort((a, b) => b.y - a.y)[0]
    const 상자mm = [x0, y0, x1, y1]
    const 안글 = 모두.filter((g) => g.x >= x0 && g.x <= x1 && g.y >= y0 && g.y <= y1)
    const 선 = 선모음(모델, k, [x0 / k, y0 / k, x1 / k, y1 / k], 끈층)
    const 표 = 표읽기(안글, 선, 제목글 ? 제목글.s : '')
    if (!표.줄.length) continue
    // 줄 곳들과 지름 머리로 상자 좁히기
    const 곳 = 표.줄.map((z) => z.곳)
    const b = [Math.min(Math.min(...xs) - 2 * h, ...곳.map((c) => c[0])) - h, Math.min(...곳.map((c) => c[1])) - 2 * h, Math.max(Math.max(...xs) + 2 * h, ...곳.map((c) => c[2])), Math.max(Math.max(...ys) + 2 * h, ...곳.map((c) => c[3])) + h]
    후보.push({ 상자: b.map((v) => v / k), 제목: 제목글 ? 제목글.s : '', 표, 셈: 표.줄.reduce((s, z) => s + Object.keys(z.값).length, 0) })
  }
  // 겹치는 후보는 값을 많이 읽은 것 하나만
  후보.sort((a, b) => b.셈 - a.셈)
  const out = []
  for (const c of 후보) {
    if (out.some((o) => 겹침(o.상자, c.상자) > 0.5)) continue
    out.push(c)
  }
  return out
}
function 겹침(a, b) {
  const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1])
  if (w <= 0 || h <= 0) return 0
  const s = Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))
  return (w * h) / s
}

/* ───────────────────────────── 기준값에 넣기 */

/**
 * 읽은 줄 → 기준값 정착표에 넣을 것
 * @param 줄 표읽기().줄 (화면에서 칸·고름을 고친 것) — {칸, fck, 값, 고름?}
 * @param fck 지금 기준 fck — 줄의 fck 가 있고 다르면 뺌(고름이 true 면 넣음)
 * @returns {정착:{D10:{인장정착:…}}, 넣은:[{칸, d, v}], 뺀:[글]}
 */
export function 넣을것(줄, fck, 옛정착 = {}) {
  const 정착 = JSON.parse(JSON.stringify(옛정착 || {}))
  const 넣은 = [], 뺀 = []
  const 이미 = new Set()
  for (const z of 줄) {
    if (!z.칸) continue
    const 고름 = z.고름 !== undefined ? z.고름 : (z.그럴듯 !== false && (z.fck == null || +z.fck === +fck))
    if (!고름) { 뺀.push((z.이름 || z.칸) + (z.fck != null ? ' (fck ' + z.fck + ')' : '')); continue }
    for (const [d, v] of Object.entries(z.값)) {
      const key = z.칸 + '|' + d
      if (이미.has(key)) continue
      이미.add(key)
      정착[d] = { ...(정착[d] || {}), [z.칸]: v }
      넣은.push({ 칸: z.칸, d, v })
    }
  }
  return { 정착, 넣은, 뺀 }
}
