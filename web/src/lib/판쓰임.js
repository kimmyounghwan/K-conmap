/**
 * 📑 판마다 쓰임 · 물량 (🧭 G248 — 2026-10-12)
 *   소장님 「읽는 도구 먼저 만들라고 했는데」 · 「다 있는데, 클로드가 못 읽는 거라고」
 *   → 판(쪽)마다 «무엇을 읽어 썼고(기호 · 일람 · 단면 · 철근 글) · 물량이 얼마 나왔는지» 를 한 표로 — 못 읽은 판이 바로 보이게.
 *
 * ■ 물량 = 셈 줄(곳: {표, i}) × 그 줄 부재들이 놓인 자리(공사 줄 _자리: {n: 파일, r: 도면 단위 상자}) — 줄 물량을 자리 수로 나눠 자리가 든 판에.
 * ■ 판 = 골조읽기(…).읽음.판 — [{파일, k, 판: [{p, r(mm), 쓰임}]}] (r 는 도면 단위 × k)
 * ■ 판 상태(종류):
 *     '물량'  — 그 판에 부재 자리가 있어 물량이 나옴
 *     '정의'  — 일람표 · 단면 · 상세에서 크기 · 철근 · 두께를 읽어 다른 판 물량에 씀
 *     '못셈'  — 구조물 · 상세 판(철근 글 · 구조물 이름이 있음)인데 아직 물량에 안 들어감 ← 고칠 곳
 *     '밖'    — 배치 · 토공 · 포장 · 말뚝 · 표지 · 목록처럼 이 셈(철근콘크리트) 몫이 아닌 판
 */

/* 구조물 이름(철근 글이 없어도 «못 셈» 후보) — 그냥 «SECTION · DETAIL» 은 건축 마감 상세도 많아 안 넣음(철근 글이 있어야 못 셈) */
const 구조물말 = /PIT|피트|정화조|점검구|맨홀|MANHOLE|핸드홀|HANDHOLE|집수정|TRENCH|트렌치|철근콘크리트\s*구조물|DOWN\s*SPOUT|충전소|(처리장|PUMP|펌프).*(PLAN|SECTION|단면)/i
const 밖말 = /목록|목차|DRAWING\s*LIST|INDEX|배치|LAY\s*OUT|ARRANGEMENT|BORING|EXCAVATION|터파기|토공|PAVEMENT|포장|ROAD|도로|과속|PILE|파일|말뚝|CHAIR|SPACER|ANCHOR|표지|일반사항|NOTE|범례/i

/** 판마다 물량 Map('파일|p' → {콘크리트, 버림, 거푸집, 철근(kg)}) */
export function 판물량(판, 공사, S) {
  const out = new Map()
  const 주 = 공사 && 공사.동 && 공사.동[0] && 공사.동[0].주자료
  if (!판 || !주 || !S) return out
  const 파일 = new Map(판.filter((f) => f && f.판).map((f) => [f.파일, f]))
  const 판찾기 = (z) => {
    const f = z && 파일.get(z.n)
    if (!f || !Array.isArray(z.r)) return null
    const k = f.k || 1
    const cx = ((z.r[0] + z.r[2]) / 2) * k, cy = ((z.r[1] + z.r[3]) / 2) * k
    let best = null, A = Infinity
    for (const x of f.판) {
      const r = x.r
      if (cx >= r[0] && cx <= r[2] && cy >= r[1] && cy <= r[3]) { const a = (r[2] - r[0]) * (r[3] - r[1]); if (a < A) { A = a; best = x } }
    }
    return best ? f.파일 + '|' + best.p : null
  }
  const 몫 = new Map()            // 표|i → [[판 열쇠, 비율]]
  for (const [표, rows] of Object.entries(주)) {
    if (!Array.isArray(rows)) continue
    rows.forEach((r, i) => {
      const 자리 = (r && r._자리) || []
      if (!자리.length) return
      const c = new Map()
      for (const z of 자리) { const k = 판찾기(z); if (k) c.set(k, (c.get(k) || 0) + 1) }
      if (c.size) 몫.set(표 + '|' + i, [...c].map(([k, n]) => [k, n / 자리.length]))
    })
  }
  for (const x of S.줄 || []) {
    if (!Number.isFinite(x.수량) || !x.곳) continue
    const m = 몫.get(x.곳.표 + '|' + x.곳.i)
    if (!m) continue
    for (const [k, w] of m) {
      let o = out.get(k)
      if (!o) { o = { 콘크리트: 0, 버림: 0, 거푸집: 0, 철근: 0 }; out.set(k, o) }
      if (x.항목 === '콘크리트') { if (/^버림/.test(String(x.비고 || ''))) o.버림 += x.수량 * w; else o.콘크리트 += x.수량 * w }
      else if (x.항목 === '거푸집') o.거푸집 += x.수량 * w
      else if (x.항목 === '철근') o.철근 += x.수량 * w
    }
  }
  return out
}

/** 판 하나의 상태 · 읽은 것 글 */
export function 판상태(x, q) {
  const u = x.쓰임 || {}
  const 합 = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0)
  const 기호 = 합(u.기호), 정의 = 합(u.정의)
  const 읽은 = []
  if (기호) 읽은.push('부재 기호 ' + 기호)
  if (정의) 읽은.push('일람 ' + Object.entries(u.정의).map(([k, n]) => k + ' ' + n).join(' · '))
  if (u.바닥단면) 읽은.push('바닥 두께 ' + u.바닥단면)
  if (u.바닥철근) 읽은.push('바닥 철근 글 ' + u.바닥철근)
  if (u.구조물) 읽은.push('구조물 ' + u.구조물)
  if (u.구조물못) 읽은.push('구조물 못 읽음 — ' + u.구조물못)
  const 물 = q && (q.콘크리트 > 0.05 || q.철근 > 1)
  const 이름 = String(x.이름 || '')
  let 종류
  if (물) 종류 = '물량'
  else if (u.구조물못) 종류 = '못셈'
  else if (정의 || u.바닥단면 || u.바닥철근) 종류 = '정의'
  else if (밖말.test(이름) && !/FOUNDATION|FOOTING|기초|BEAM|COLUMN|SLAB|WALL/i.test(이름)) 종류 = '밖'
  else if ((u.철근글 || 0) > 0 || 구조물말.test(이름)) 종류 = '못셈'
  else 종류 = '밖'
  if (종류 === '못셈' && u.철근글) 읽은.push('철근 글 ' + u.철근글 + '(아직 안 셈)')
  return { 종류, 읽은: 읽은.join(' · ') }
}
