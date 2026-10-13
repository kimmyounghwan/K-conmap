/**
 * 📏 끝까지 읽기 — 점이 아주 많은 통합본은 «구조 판» 만 모양을 다시 읽음 (🧭 G246 — 2026-10-12)
 *
 * 소장님 「남은것 시작해」 — 남은 것 1: 큰 통합본(현장 C 건축 · 현장 D 건축)은 점 600만 개에서 모양을 더 못 담아,
 *   뒤쪽 판은 글자 · 테두리만 있고 물량에 못 썼음.
 *   모양을 다 담으면 현장 D 건축은 점 5천만 개 넘어 기억이 모자람 → 물량에 쓰는 판(구조 판)만 골라 그 판의 모양을 담고,
 *   나머지 판(마감표 · 투시도 · 창호 상세 …)은 글자 · 테두리만(판 목록 · 점검 표).
 *
 * ■ 구조 판 = 판 이름에 구조 말(구조 · 기초 · 배근 · 골조 · 주심 · 보/기둥/벽체 일람 · STRUCT · FOUNDATION · BEAM · COLUMN · SLAB · FOOTING · PILE …)
 *   이 있거나, 판 안에 부재 기호 글(C1 · G1 · B1 · F1 · W1 · S1 …)이 8개 넘는 판(건축 평면에 기둥 기호를 적은 판도).
 *   마감 · 창호 · 방수 · 단열 · 면적 · 설비 판은 빼고(마감 기호 W1 · F1 이 부재 기호처럼 보임 — 이름에 «구조 · 골조 · 주심 · 기초 · 배근» 이 같이 있으면 넣음).
 * ■ 첫 읽기에 점이 안 찼으면 그대로(작은 도면은 한 자리도 안 바뀜).
 */
import { 도면읽기 } from './골조도면.js'
import { _준비, 평면기호 } from './골조자동.js'
import { 판목록 } from './판펼치기.js'

const 구조말 = /구조|기초|배근|골조|골구|주심|(보|기둥|슬래브|슬라브|벽체|옹벽|부재|RC|SRC|철골)\s*일람|STRUCT|FRAM|FOUND|FOOT|BEAM|COLUMN|SLAB|WALL\s*LIST|PILE|REBAR/i
/* 구조 판이 아닌 건축 · 설비 판(부재 기호처럼 보이는 마감 기호 W1 · F1 · C1 이 많음) */
const 딴말 = /마감|창호|방수|단열|면적|조경|위생|전기|기계|설비|소방|조명|가구|사인|간판|투시|조감|범례|목록|목차/

/** 첫 읽기 모델 → 다시 읽을 판 테두리(도면 좌표 · 가운데 빼기 전) */
export function 구조판범위(M) {
  const D = _준비(M, 1, 0)
  const 판 = 판목록(D)
  if (!판.length) return { 범위: [], 이름: [] }
  const 기호수 = 판.map(() => 0)
  for (const g of (D.글자 || []).concat(D.뒤글자 || [])) {
    const p = D.도곽번(g.x, g.y)
    if (p >= 0 && 평면기호(g.s)) 기호수[p]++
  }
  const 고른 = 판.filter((x, i) => { const 이 = (x.이름 || '').replace(/\s+/g, ''); if (딴말.test(이) && !/구조|골조|주심|기초|배근/.test(이)) return false; return 구조말.test(이) || 기호수[i] >= 8 })
  const ox = M.ox || 0, oy = M.oy || 0
  const 범위 = 고른.map((x) => { const w = x.r[2] - x.r[0], h = x.r[3] - x.r[1], d = 0.005 * Math.max(w, h); return [x.r[0] + ox - d, x.r[1] + oy - d, x.r[2] + ox + d, x.r[3] + oy + d] })
  return { 범위, 이름: 고른.map((x) => (x.번호 ? x.번호 + ' ' : '') + (x.이름 || '')) }
}

/**
 * 골조 읽개 — 점이 다 차면 구조 판만 다시 읽음
 * @returns 도면읽기 모델(다시 읽었으면 stats.판만 = 다시 읽은 판 이름들 · stats.첫읽기 = 첫 읽기 점 · 못그림)
 */
export function 도면읽기끝까지(text, onProgress) {
  const M = 도면읽기(text, onProgress)
  if (!M.stats || !M.stats.capped) return M
  let 고름
  try { 고름 = 구조판범위(M) } catch (e) { return M }
  if (!고름.범위.length) return M
  const M2 = 도면읽기(text, null, { 범위: 고름.범위 })
  M2.stats.판만 = 고름.이름
  M2.stats.첫읽기 = { verts: M.stats.verts, 못그림: M.stats.못그림 }
  return M2
}
