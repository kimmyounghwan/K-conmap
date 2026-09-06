/**
 * lib/lic.js — 면허 거르기. (2026-09-05)
 *
 * ⚠️ 왜 새로 만들었나 — 소장님: 「철콘만 했는데, 전기도 나오고 시설도 나오고」
 *
 * 전에는 공고명 낱말로 면허를 «추측» 했습니다
 * (철근·콘크리트 → «철콘, 구조물, 옹벽, 배수, 기초»).
 * 실제 공고 12,735건으로 재보니:
 *
 *      철근·콘크리트를 고르면 580건이 나오는데 진짜는  91건 (15.7%)
 *      반대로 진짜 514건 중                        423건 (82%) 을 놓쳤습니다
 *      낱말 「배수」 하나가 409건을 끌어오는데 그 중 진짜는 18%
 *      낱말 「철콘」 은 공고명에 1건밖에 없어 사실상 죽은 낱말이었습니다
 *
 * 조달청은 `lic` 로 면허를 **정확히 주고 있었습니다**
 * («철근ㆍ콘크리트공사업/4994»). 그걸 안 쓰고 이름을 추측한 것이 잘못이었습니다.
 * → 이제 조달청 코드로만 거릅니다. 낱말 추측은 하지 않습니다.
 *   (CLAUDE.md 1번 「조달청이 주는 값이 있으면 그대로 쓴다 — 손으로 만들지 않는다」)
 *
 * 면허 칩 목록도 손으로 적지 않습니다 — collect.py 가 자료에서 세어
 * board/{first,live}.json 의 meta.con.lics 에 [코드, 이름, 건수] 로 굽습니다.
 */

const LS_CODES = 'kcm_liccodes'
const LS_NONE = 'kcm_licnone'

export function loadLicCodes() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_CODES) || '[]')
    return Array.isArray(v) ? v.map(String) : []
  } catch { return [] }
}
export function saveLicCodes(v) {
  try { localStorage.setItem(LS_CODES, JSON.stringify(v)) } catch { /* 사생활 모드 */ }
}
/* 지역 — 2026-09-06. 면허와 같은 이유로 브라우저에만 저장합니다(서버 0, 로그인 없음).
   공고 탭과 바로투찰 첫 화면이 같은 값을 읽습니다. 한쪽에서 바꾸면 양쪽이 따라옵니다. */
const LS_REGION = 'kcm_region'
export function loadRegion() {
  try { return localStorage.getItem(LS_REGION) || '전국' } catch { return '전국' }
}
export function saveRegion(v) {
  try { localStorage.setItem(LS_REGION, v || '전국') } catch { /* 사생활 모드 */ }
}
/** 면허나 지역을 한 번이라도 골랐나 — 바로투찰 첫 화면이 «설정 안내» 와 «내 것» 을 가르는 기준 */
export function hasMine() {
  return loadLicCodes().length > 0 || loadRegion() !== '전국'
}

export function loadLicNone() {
  try { return localStorage.getItem(LS_NONE) === '1' } catch { return false }
}
export function saveLicNone(v) {
  try { localStorage.setItem(LS_NONE, v ? '1' : '0') } catch { /* 사생활 모드 */ }
}

/** meta 에서 면허 목록을 꺼냅니다. [[코드, 이름, 건수], …]
 *  ⚠️ useBoard 가 돌려주는 info 는 이미 meta[kind] 입니다 (meta 전체가 아닙니다).
 *     info.con.lics 로 읽으면 조용히 빈 배열이 되어 칩이 하나도 안 뜹니다 — 실제로 겪었습니다. */
export function licList(info) {
  const v = info?.lics
  return Array.isArray(v) ? v : []
}

/** 면허가 안 적힌 공고가 몇 건인지 (화면에 정직하게 적기 위해) */
export function licNoneCount(info) {
  const n = info?.nolic
  return typeof n === 'number' ? n : null
}

/**
 * 한 줄이 내 면허에 맞는가.
 * @param rowCodes  색인 줄의 lic (코드 배열). 없으면 «면허 미표기».
 * @param myCodes   내가 고른 코드
 * @param withNone  면허가 안 적힌 공고도 볼지
 */
export function licHit(rowLic, myCodes, withNone) {
  const list = Array.isArray(rowLic) ? rowLic : (rowLic ? [rowLic] : [])
  if (!list.length) return !!withNone          // 조달청이 면허를 안 준 공고
  const want = new Set(myCodes.map(String))
  // 색인은 코드만(«4994»), bidindex 는 통째로(«철근ㆍ콘크리트공사업/4994») 옵니다.
  // 둘 다 받습니다 — 한쪽만 받으면 자리 찾기 모드에서 조용히 안 걸립니다.
  return list.some((x) => {
    const t = String(x)
    return want.has(t) || want.has(t.slice(t.lastIndexOf('/') + 1))
  })
}

/** 「철근ㆍ콘크리트공사업」 → 「철근·콘크리트」 (칩에 넣을 짧은 이름) */
export function licShort(name) {
  return String(name || '')
    .replace(/ㆍ/g, '·')
    .replace(/공사업$/, '')
    .replace(/업$/, '')
    .trim() || String(name || '')
}
