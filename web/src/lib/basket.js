/**
 * lib/basket.js — ⭐ 담은 공고. (2026-09-14)
 *
 * 소장님: 「한 건이라도 돼야 소문이 나지.」
 * 한 공고의 1순위율은 몇 %뿐입니다. 그런데 여러 건에 넣으면 «적어도 한 건» 확률이 올라갑니다
 * (실측: 참가 2~9곳 공고 5건이면 63%, 10건이면 87% — 300곳 넘는 공고 10건이면 11%).
 * 그걸 보여주려면 «내가 넣을 생각인 공고»를 어딘가에 적어 둬야 합니다.
 *
 * 회원가입도 서버도 없습니다 — 이 브라우저에만 적습니다(면허·지역과 같은 방식).
 * 담는 것은 공고번호뿐입니다. 나머지는 bidindex 에서 다시 찾습니다.
 */

const LS = 'kcm_basket'
const MAX = 60          // 이보다 많이 담으면 뜻이 없습니다. 오래 담은 것부터 밀어냅니다.

export function loadBasket() {
  try {
    const v = JSON.parse(localStorage.getItem(LS) || '[]')
    return Array.isArray(v) ? v.map(String).filter(Boolean) : []
  } catch { return [] }
}
export function saveBasket(v) {
  try { localStorage.setItem(LS, JSON.stringify((v || []).slice(-MAX))) } catch { /* 사생활 모드 */ }
}
export function inBasket(no) {
  return loadBasket().includes(String(no))
}
/** 담기/빼기 — 바뀐 목록을 돌려줍니다 */
export function toggleBasket(no) {
  const k = String(no || '')
  if (!k) return loadBasket()
  const v = loadBasket()
  const out = v.includes(k) ? v.filter((x) => x !== k) : [...v, k]
  saveBasket(out)
  return out.slice(-MAX)
}
export function clearBasket() { saveBasket([]) }
export const BASKET_MAX = MAX
