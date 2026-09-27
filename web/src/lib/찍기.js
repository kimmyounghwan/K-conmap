/**
 * 👆 도면에서 누른 것 → 칸에 들어갈 값 (2026-09-27)
 *
 * 치수표(/jeoksan/run)·마감(/jeoksan/magam)이 같이 씁니다. 값은 «미터» 로 돌려줍니다.
 * (골조는 mm 로 적는 양식이라 Golgo.jsx 안에 따로 있습니다 — 규칙은 같습니다)
 *
 *   길이: 선·호·폴리선 → 길이 · 치수선 → 보이는 치수 값 · 숫자 글자 → 그 숫자 · 여러 번 누르면 더함(다시 누르면 뺌)
 *   면적: 닫힌 선(폴리선·원·해치)의 안이나 테두리 → 면적(m²) · 여러 번 누르면 더함
 *   개수: 글자 → «화면 안» 같은 글자 수 · 선 → 누른 개수
 *   글자: 글자 → 그 글자
 */
import { 품은도형, 도형글자, 종류, 종류이름 } from './골조도면.js'

export const 도움글 = {
  길이: '선·호·폴리선을 누르면 길이(m), 치수선을 누르면 그 치수 값(m)이 들어갑니다. 여러 번 누르면 더합니다(다시 누르면 뺌).',
  면적: '닫힌 선(폴리선·해치·원)의 안쪽이나 테두리를 누르면 면적(m²)이 들어갑니다. 여러 번 누르면 더합니다.',
  개수: '글자(예: WD1)를 누르면 «지금 화면에 보이는» 같은 글자 수를 셉니다. 선을 누르면 누른 개수를 셉니다.',
  글자: '도면의 글자를 누르면 그 글자가 들어갑니다.',
}

/** 숫자를 칸 글로 — 자리까지 반올림하고 뒤 0 은 뗌 */
export function 수글(v, 자리 = 3) {
  if (!Number.isFinite(v)) return ''
  const r = Math.round(v * 10 ** 자리) / 10 ** 자리
  return String(Object.is(r, -0) ? 0 : r)
}

/** 도형의 길이(m) — 치수는 보이는 값, 숫자 글자는 그 숫자 */
export function 길이m(모델, e, k) {
  const E = 모델.E
  if (E.t[e] === 종류.치수) {
    let v = E.val[e]
    if (!Number.isFinite(v)) return { v: NaN }
    if (k !== 1 && v < 200) v *= k                      // m 로 그린 도면의 치수가 m 로 적혔으면
    return { v: v / 1000, 글: '치수 ' + E.val[e] }
  }
  if (E.t[e] === 종류.글자) {
    const t = 도형글자(모델, e)
    const n = parseFloat(t.replace(/,/g, ''))
    if (!/^\s*-?[\d,.]+\s*$/.test(t) || !Number.isFinite(n)) return { v: NaN, 글자: t }
    // 글자 숫자: mm 도면에서 100 이상이면 mm 로 적은 것(예: 3000) · 아니면 m 로 적은 것(예: 2.50)
    if (k === 1 && Math.abs(n) >= 100) return { v: n / 1000, 글: '글자 ' + t + ' (mm 로 봄)' }
    return { v: n, 글: '글자 ' + t + ' (m 로 봄)' }
  }
  const L = E.len[e]
  return { v: L * k / 1000 }
}

/**
 * @param o {kind, k(도면 단위→mm), 끈층, 보기:[x0,y0,x1,y1], 지금:[{e,v}]}
 * @returns {{목록, 값, 알림?}} 목록=null 이면 값을 바꾸지 않음(알림만)
 */
export function 찍기(모델, e, x, y, o) {
  const { kind, 끈층 } = o
  const k = o.k || 1
  const E = 모델.E
  const 지금 = (o.지금 || []).filter((it) => it && typeof it === 'object')
  if (!kind) return { 목록: null, 알림: '이 칸은 도면에서 받지 않습니다 — 직접 적어 주십시오.' }
  if (e < 0 && kind !== '면적') return { 목록: null, 알림: '그 자리에는 누를 것이 없습니다 — 선·치수·글자 위를 누르십시오.' }
  if (kind === '글자') {
    const t = 도형글자(모델, e)
    if (!t) return { 목록: null, 알림: '글자를 눌러 주십시오 (누른 것: ' + 종류이름[E.t[e]] + ')' }
    return { 목록: [{ e, v: t }], 값: t }
  }
  if (kind === '면적') {
    let id = e
    if (id < 0 || !(E.area[id] > 0)) id = 품은도형(모델, x, y, 끈층)
    if (id < 0) return { 목록: null, 알림: '닫힌 선(폴리선·해치·원)의 안쪽을 눌러 주십시오.' }
    const 있음 = 지금.findIndex((it) => it.e === id)
    const 새 = 있음 >= 0 ? 지금.filter((_, j) => j !== 있음) : 지금.filter((it) => typeof it.v === 'number').concat([{ e: id, v: E.area[id] * k * k / 1e6 }])
    const 합 = 새.reduce((s, it) => s + it.v, 0)
    return { 목록: 새, 값: 새.length ? 수글(합, 4) : '' }
  }
  if (kind === '개수') {
    if (E.t[e] === 종류.글자) {
      const t = 도형글자(모델, e)
      const T = 모델.T
      const [vx0, vy0, vx1, vy1] = o.보기
      let n = 0
      for (let i = 0; i < T.s.length; i++) {
        if (T.s[i] !== t) continue
        if (끈층 && 끈층.has(E.ly[T.e[i]])) continue
        if (T.x[i] < vx0 || T.x[i] > vx1 || T.y[i] < vy0 || T.y[i] > vy1) continue
        n++
      }
      return { 목록: [{ e, v: n, 글: t }], 값: String(n), 알림: '화면 안의 «' + t + '» 글자 ' + n + '개를 셌습니다. (화면을 옮기고 다시 누르면 다시 셉니다)', 알림좋음: true }
    }
    const 있음 = 지금.findIndex((it) => it.e === e)
    const 새 = 있음 >= 0 ? 지금.filter((_, j) => j !== 있음) : 지금.filter((it) => !it.글).concat([{ e, v: 1 }])
    return { 목록: 새, 값: 새.length ? String(새.length) : '' }
  }
  // 길이
  const r = 길이m(모델, e, k)
  if (!Number.isFinite(r.v)) {
    if (r.글자 !== undefined) return { 목록: null, 알림: '숫자 글자나 선·치수를 눌러 주십시오 (누른 글자: «' + r.글자 + '»)' }
    return { 목록: null, 알림: '그 도형은 길이를 잴 수 없습니다 (' + 종류이름[E.t[e]] + ')' }
  }
  const 있음 = 지금.findIndex((it) => it.e === e)
  const 새 = 있음 >= 0 ? 지금.filter((_, j) => j !== 있음) : 지금.filter((it) => typeof it.v === 'number').concat([{ e, v: r.v }])
  const 합 = 새.reduce((s, it) => s + it.v, 0)
  return { 목록: 새, 값: 새.length ? 수글(합, 3) : '', 알림: r.글 && 있음 < 0 ? r.글 + ' → ' + 수글(r.v, 3) + ' m' : '', 알림좋음: true }
}

/** 두 점 거리(m) 더하기 */
export function 두점더하기(지금, a, p, k) {
  const d = Math.hypot(p[0] - a[0], p[1] - a[1]) * (k || 1) / 1000
  const 새 = (지금 || []).filter((it) => it && typeof it.v === 'number').concat([{ e: -1, v: d, 점: [a, p] }])
  return { 목록: 새, 값: 수글(새.reduce((s, it) => s + it.v, 0), 3), d }
}
