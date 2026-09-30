/* 🏷 공고 유형 태그 판정 — 화면(유형칸.jsx)과 시험(tools/시험_공고유형.mjs)이 같이 씁니다 (2026-09-30)
   무리 = data/공고유형.json 의 «무리» (collect.py tag_of 와 같은 파일)
   고른 = [비트 …] — 음수는 «빼기» (지금은 «취소공고 빼기» 하나)
   · 같은 무리 안은 «또는», 무리끼리는 «그리고», 합이 'and' 인 무리(조건)는 무리 안에서도 «그리고» */
export function 유형맞나(tg, 고른, 무리) {
  if (!고른 || !고른.length) return true
  const t = Number(tg) || 0
  for (const b of 고른) if (b < 0 && (t & -b)) return false
  for (const g of 무리 || []) {
    const on = g.태그.map((x) => x.b).filter((b) => 고른.includes(b))
    if (!on.length) continue
    if (g.합 === 'and') { if (!on.every((b) => t & b)) return false }
    else if (!on.some((b) => t & b)) return false
  }
  return true
}

export function 유형글(고른, 무리) {
  if (!고른 || !고른.length) return ''
  const 이름 = new Map((무리 || []).flatMap((g) => g.태그.map((t) => [t.b, t.n])))
  const 글 = 고른.map((b) => (b < 0 ? `${이름.get(-b)} 빼기` : 이름.get(b))).filter(Boolean)
  return 글.length <= 2 ? 글.join(' · ') : `${글.slice(0, 2).join(' · ')} 외 ${글.length - 2}`
}
