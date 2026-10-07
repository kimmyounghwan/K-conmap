/* ══════════════════════════════════════════════════════════════
   현장나눔.js — 🏗 프로그램을 «현장별로 나눠 쓰기» (G179 · 2026-10-07)
   소장님: 「현장별로 나눠서 쓸 수 있게 해줘」(맵톡 이용자 건의 · 노무비 계산기 G178) → 「현장별로... 수정할 것 클로드가 봐서 고쳐줘」
   노무비 계산기(lib/nomubi.js)에 먼저 만든 것과 같은 모양을 여러 프로그램이 같이 씁니다(작업일보 · 공사서류 원클릭).

   ■ 현장 목록: localStorage 'kcm_sites_{ns}' = {cur 지금 현장, L: [{id, n 이름, at 만든 때, del? 뺀 때}]}
   ■ 현장 자료: 첫 현장(h1)은 그 프로그램의 예전 자리 그대로(옮기지 않음 · 지금 쓰던 자료가 곧 첫 현장) · 그 밖은 '{예전 열쇠}@{id}'
   ■ 🔗 이어 쓰기 연결도 현장마다: 첫 현장 'kcm-bk-{ns}' 그대로 · 그 밖 'kcm-bk-{ns}@{id}' (서버 자리 {ns}_doc/코드 는 그대로 — 코드가 다름)
   ■ 빼기는 목록에서만(자료는 남겨 되살림) · 하나 남은 현장은 못 뺌
   ■ 시험: tools/시험_현장나눔.mjs
   ══════════════════════════════════════════════════════════════ */
export const 첫현장 = 'h1'
const 번호꼴 = /^h[0-9a-z]{1,16}$/

export function 현장나눔(ns) {
  const 목록열쇠 = `kcm_sites_${ns}`
  /** 그 현장의 자료 자리 — k 는 그 프로그램의 예전 열쇠 */
  const 열쇠 = (k, id) => (!id || id === 첫현장 ? k : `${k}@${id}`)
  const 연결자리 = (id) => (!id || id === 첫현장 ? ns : `${ns}@${id}`)
  function 목록() {
    try {
      const m = JSON.parse(localStorage.getItem(목록열쇠) || 'null')
      if (m && Array.isArray(m.L) && m.L.some((x) => x && x.id === 첫현장)) {
        const L = m.L.filter((x) => x && typeof x.id === 'string' && 번호꼴.test(x.id))
        const 산 = L.filter((x) => !x.del)
        const cur = 산.some((x) => x.id === m.cur) ? m.cur : (산[0] || L[0]).id
        return { cur, L }
      }
    } catch (e) { /* 막힘 · 깨짐 — 첫 현장 하나로 */ }
    return { cur: 첫현장, L: [{ id: 첫현장, n: '', at: 0 }] }
  }
  function 목록쓰기(m) {
    try { localStorage.setItem(목록열쇠, JSON.stringify(m)); return true } catch (e) { return false }
  }
  const 지금 = () => 목록().cur
  const 새번호 = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
  /** 새 현장 → {m 새 목록(지금 현장으로), id} — 자료는 부르는 쪽이 씁니다 */
  function 더하기(m, 이름) {
    const id = 새번호()
    return { m: { cur: id, L: [...m.L, { id, n: String(이름 || '').trim().slice(0, 60), at: Date.now() }] }, id }
  }
  function 빼기(m, id) {
    const 산 = m.L.filter((x) => !x.del)
    if (산.length <= 1 || !산.some((x) => x.id === id)) return m
    const L = m.L.map((x) => (x.id === id ? { ...x, del: Date.now() } : x))
    return { cur: m.cur === id ? L.filter((x) => !x.del)[0].id : m.cur, L }
  }
  function 되살리기(m, id) {
    return { cur: id, L: m.L.map((x) => { if (x.id !== id) return x; const y = { ...x }; delete y.del; return y }) }
  }
  return { ns, 목록열쇠, 열쇠, 연결자리, 목록, 목록쓰기, 지금, 더하기, 빼기, 되살리기 }
}
