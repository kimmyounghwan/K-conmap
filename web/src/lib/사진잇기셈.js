/* 📡 실시간 사진대지 — 순수 셈(인터넷 · 파이어베이스 · node_modules 없이 — PC 올리기 bat 시험 tools/시험_사진잇기.mjs 가 이 파일만 읽음) · G493 (2026-11-01)
 *   서버 · 창고 · 올리기는 lib/사진잇기.js. 화면은 pages/PhotoLive.jsx.
 */
export const 사진잇기들 = ['pb']            // pb = 실시간 사진대지(/tools/photo-live) — 서식 사진 칸 · 사진대지 도구는 그대로(소장님 「이미 만든 건 두고 … 따로 따로」)
export const 최대상태글 = 2900000       // 규칙 s ≤ 3,000,000
export const 최대사진글 = 1450000       // 규칙 pic s ≤ 1,500,000 (JPEG 긴 쪽 1600 · 0.8 ≈ 250 KB → base64 340 K → 잠그면 460 K)
export const 사진긴쪽 = 1600

export const 기기이름 = () => (/Mobi|Android|iPhone|iPad/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '') ? '폰' : 'PC')

/** 사진 id — «때(36진 ms)-기기 차례 난수» · 앞 토막이 때라 매일 정리(tools/공사일보백업.py)가 사진을 내려받지 않고도 7일 지난 것을 알아봄 */
let _번 = 0
export const 새사진id = () => `${Date.now().toString(36)}-${기기이름() === '폰' ? 'm' : 'p'}${(++_번).toString(36)}${Math.random().toString(36).slice(2, 5)}`
export const 사진id때 = (id) => { const m = /^([0-9a-z]+)-/.exec(String(id || '')); const t = m ? parseInt(m[1], 36) : NaN; return Number.isFinite(t) ? t : null }
export const 사진둘날 = 7

/* ══════════ 합치기(순수 — 인터넷 없이 시험 tools/시험_사진잇기.mjs) ══════════ */
/**
 * 실시간 사진대지(pb) 상태 = { 설정, 차례, 설정때, 목록: [{id, 이름, 파일때, 때, 기종, 너비, 높이, 선명, 밝기, 지문, 값, 새쪽, 값때, 그림때}], 지움: {id: 때} }
 *   · 사진 바이트는 여기 없음({ns}_pic/{코드}/{id} 따로) — 목록의 그림때가 이 기기 것보다 늦으면(돌림) 다시 받음
 *   · 목록 = 서버 차례 그대로 + 이 기기에만 있는 사진은 뒤에(이 기기 차례로)
 *   · 지움(묘비) = 양쪽 합 — 어느 기기가 지운 사진은 다른 기기 목록에 남아 있어도 되살아나지 않음(묘비는 묘비둘날 뒤 정리)
 *   · 사진마다 값(설명 · 위치 …)은 값때가 늦은 쪽 · 그림(너비 · 높이 · 그림때)은 그림때가 늦은 쪽 · 설정 · 차례는 설정때가 늦은 쪽
 */
export const 묘비둘날 = 30
export function 합치기pb(서버, 내것, 지금 = Date.now()) {
  const S = 서버 || {}, M = 내것 || {}
  const 지움 = {}
  for (const [id, t] of [...Object.entries(S.지움 || {}), ...Object.entries(M.지움 || {})]) if (지금 - (t || 0) < 묘비둘날 * 86400000) 지움[id] = Math.max(지움[id] || 0, t || 0)
  const 서목 = (S.목록 || []).filter((p) => p && p.id && !지움[p.id])
  const 내표 = new Map((M.목록 || []).filter((p) => p && p.id).map((p) => [p.id, p]))
  const out = []
  const 든 = new Set()
  for (const p of 서목) {
    const m = 내표.get(p.id)
    든.add(p.id)
    if (!m) { out.push(p); continue }
    const 값쪽 = (m.값때 || 0) > (p.값때 || 0) ? m : p
    const 그림쪽 = (m.그림때 || 0) > (p.그림때 || 0) ? m : p
    out.push({ ...p, 값: 값쪽.값 || {}, 값때: 값쪽.값때 || 0, 새쪽: !!값쪽.새쪽, 너비: 그림쪽.너비, 높이: 그림쪽.높이, 그림때: 그림쪽.그림때 || 0 })
  }
  for (const p of M.목록 || []) if (p && p.id && !든.has(p.id) && !지움[p.id]) out.push(p)
  const 설정쪽 = (M.설정때 || 0) > (S.설정때 || 0) ? M : S
  return { 설정: 설정쪽.설정 || S.설정 || M.설정 || {}, 차례: 설정쪽.차례 || S.차례 || M.차례 || '때', 설정때: Math.max(S.설정때 || 0, M.설정때 || 0), 목록: out, 지움 }
}
/** 서버 판 · 이 기기 판 · 안 올린 고침 → 할 일(이어쓰기.js 와 같음 — 다만 «충돌» 은 사람에게 묻지 않고 합침) */
export function 할일(서버판, 내판, 고침) {
  if (서버판 == null) return '없음'
  if (서버판 === 내판) return 고침 ? '올림' : '같음'
  return 고침 ? '합침' : '받음'
}
/** 목록에서 이 기기에 그림이 없거나(없음) 낡은(그림때) 사진 id 들 → 받아야 할 것 */
export function 받을사진(목록, 있는것) {
  return (목록 || []).filter((p) => { const g = 있는것 && 있는것.get ? 있는것.get(p.id) : null; return !g || (p.그림때 || 0) > (g.그림때 || 0) }).map((p) => p.id)
}
