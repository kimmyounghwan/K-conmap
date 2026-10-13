/**
 * 🧱 구조물 판 읽기 — «PLAN & SECTION» 한 판에 그린 상자 구조물(PIT · 정화조 · 맨홀 · 점검구 · 처리장 · 집수정 …) (🧭 G248 — 2026-10-12)
 *   소장님 「읽는 도구 먼저 만들라고 했는데」 · 「다 있는데, 클로드가 못 읽는 거라고」 · 「모르는 게 있으면 우선 검색하고 찾아봐」
 *   현장 C · 현장 D 토목: 압송PIT · 단독정화조 · 맨홀 · 점검구 · 처리장 판 18장이 «아직 못 셈» — 평면 + 단면 치수로 상자를 세움.
 *
 * ■ 판 고르기: 판 이름에 구조물 말(PIT · 정화조 · MANHOLE · 점검구 · 처리장 · 집수정 · 충전소 · DOWN SPOUT …)이 있고
 *   판 안에 평면 그림 이름(«PLAN» · «BOTTOM PLAN» · «평면도»)과 단면 그림 이름(«SECTION» · «S E C T I O N» · «단면도»)이 다 있는 판.
 * ■ 치수 글자는 바로 아래(가까운) 그림 이름의 그림 것(그림 이름은 그림 밑).
 * ■ 평면: 가로 · 세로 치수 줄(같은 높이에 늘어선 치수 글)에서 양 끝이 같은 줄 = 벽 두께 줄 — «300 | 4000 | 300» → 벽 300 · 바깥 4600.
 *     바깥에 또 «150 | 4600 | 150» 이 있으면 밑판이 사방 150 넓음(돌출). 한 줄에 «100 | 200 | 300 | 2250 | 300 | 200 | 100» 처럼
 *     맨 끝 쌍이 150 안이면 그것이 돌출 · 다음 쌍이 벽(속은 300 + 2250 + 300 = 2850).
 * ■ 단면: 세운 치수 줄(같은 x 에 위아래로 늘어선 치수)에서 «밑판 | 속 높이 | 윗판» — «400 | 2800 | 200».
 *     윗판이 없으면 뚜껑 없는 상자(0). 여러 줄이면 합이 가장 큰 줄.
 * ■ 개수: 판 글 «(Q'TY:2EA)» 이 있으면 그만큼.
 * ■ 물량(보강 줄 — 골조 산출서 «보강» 표의 산출식 그대로 · 엑셀에서 식이 보임):
 *     콘크리트 = 밑판 (가로+2돌출)(세로+2돌출)·밑판 + 벽 [가로·세로 − (가로−2벽)(세로−2벽)]·속 높이 + 윗판 가로·세로·윗판
 *     거푸집 = 바깥 벽 2(가로+세로)(속+윗판) + 밑판 옆 2(가로+세로+4돌출)·밑판 + 안 벽 2((가로−2벽)+(세로−2벽))·속 + 윗판 밑 (가로−2벽)(세로−2벽)
 *     철근 = 판의 철근 글(«HD16@200» · «HD13@200») — 가장 많이 나온 것 = 한 방향 · 다음 것 = 다른 방향(없으면 같은 것), 면마다 두 겹
 *            벽(가운데 선 둘레 × 속 높이) · 밑판 · 윗판 넓이 × 2 겹 ÷ 간격 = 길이(m)
 * ■ 못 읽으면(치수 줄이 없음 · 원형 맨홀 …) 셈하지 않고 «판 목록» 에 «아직 못 셈» 그대로.
 */

const 구조물이름 = /PIT|피트|정화조|MANHOLE|맨홀|HANDHOLE|핸드홀|점검구|집수정|처리장|충전소|DOWN\s*SPOUT|TRENCH|트렌치|암거|BOX\s*CULVERT/i
const 빼는이름 = /COVER|LADDER|HANDRAIL|SLEEVE|FENCE|철거/i
const 붙 = (s) => String(s ?? '').replace(/\s+/g, '').toUpperCase()

/** 같은 줄(가로: 같은 y · 세로: 같은 x)로 묶은 치수 글 → [{k, v: [값…]}] (줄 안은 위치 차례) */
function 줄들(글, 세로) {
  const ky = (g) => (세로 ? g.x : g.y), kx = (g) => (세로 ? g.y : g.x)
  const out = []
  for (const g of 글.slice().sort((a, b) => ky(a) - ky(b))) {
    const z = out[out.length - 1]
    if (z && Math.abs(ky(g) - z.k) <= 0.6 * g.h) z.g.push(g)
    else out.push({ k: ky(g), g: [g] })
  }
  return out.map((z) => ({ k: z.k, v: z.g.sort((a, b) => kx(a) - kx(b)).map((g) => +g.u) }))
}

/** 평면 한 방향(가로 또는 세로 치수 줄들) → {바깥, 벽, 돌출} | null */
function 평면방향(줄) {
  const 대칭 = 줄.filter((z) => z.v.length >= 3 && z.v[0] === z.v[z.v.length - 1])
  const 후보 = []
  for (const z of 대칭) {
    const v = z.v, n = v.length, 합 = v.reduce((a, b) => a + b, 0)
    if (v[0] < 150 && n >= 5 && v[1] === v[n - 2] && v[1] >= 100 && v[1] <= 600) 후보.push({ 바깥: 합 - 2 * v[0], 벽: v[1], 돌출: v[0] })
    else if (v[0] >= 100 && v[0] <= 600) 후보.push({ 바깥: 합, 벽: v[0], 돌출: 0, 속: 합 - 2 * v[0], 셋: n === 3 ? v[1] : null })
  }
  if (!후보.length) return null
  /* 돌출 줄 — «150 | 4600 | 150» 처럼 속 값이 다른 후보의 바깥과 같은 줄 */
  const 바깥들 = new Set(후보.map((c) => c.바깥))
  const 돌출줄 = 후보.filter((c) => c.셋 && 바깥들.has(c.셋) && c.벽 < 300)
  const 벽줄 = 후보.filter((c) => !돌출줄.includes(c)).sort((a, b) => b.바깥 - a.바깥)
  if (!벽줄.length) return null
  const w = 벽줄[0]
  const 돌 = w.돌출 || (돌출줄.find((c) => c.셋 === w.바깥) || {}).벽 || 0
  return { 바깥: w.바깥, 벽: w.벽, 돌출: 돌 }
}

/** 단면 세운 치수 줄들 → {밑판, 속, 윗판} | null */
function 단면높이(줄) {
  let best = null
  for (const z of 줄) {
    const v = z.v
    for (let i = 1; i < v.length; i++) {
      const h = v[i]
      if (h < 500) continue
      const 밑 = v[i - 1]
      if (밑 < 100 || 밑 > 1000) continue
      const 위 = i + 1 < v.length && v[i + 1] >= 100 && v[i + 1] <= 600 ? v[i + 1] : 0
      const 합 = 밑 + h + 위
      if (!best || 합 > best.합 || (합 === best.합 && 위 && !best.윗판)) best = { 밑판: 밑, 속: h, 윗판: 위, 합 }
    }
  }
  return best
}

const m = (mm) => String(Math.round(mm) / 1000)

/**
 * @param D 골조자동 준비(…) 한 파일
 * @param 판 판목록(D) — [{p, 번호, 이름, r}]
 * @returns {줄: [보강 줄], 읽음: [{p, 이름, 콘크리트(㎥), 글}], 못읽음: [{p, 이름, 까닭}]}
 */
export function 구조물읽기(D, 판) {
  const 줄 = [], 읽음 = [], 못읽음 = []
  for (const x of 판 || []) {
    const 이름 = String(x.이름 || '')
    if (!구조물이름.test(이름) || 빼는이름.test(이름)) continue
    /* 건축 판(이름 꼬리 «[미생물 처리장]» · 입면도 · 면적산출표 · 구조 평면도 · 주심도)은 뺌 — 구조물 상세 판만 */
    if (/[\[［【][^\]］】]+[\]］】]\s*$/.test(이름) || /입면|면적|창호|지붕|주심도|구조\s*평면도|골조/.test(이름)) continue
    if (/평면도/.test(이름) && !/단면|SECTION|상세|DETAIL/i.test(이름)) continue      // «PIT, 지하1층평면도» 같은 층 평면 판
    const 글 = D.글자.filter((g) => D.도곽번(g.x, g.y) === x.p)
    const 제목 = 글.filter((g) => g.u.length <= 24 && /(PLAN|평면도?|SECTION|단면도?)$/.test(g.u) && !/&/.test(g.s))
    const 평면들 = 제목.filter((g) => /(PLAN|평면도?)$/.test(g.u)), 단면들 = 제목.filter((g) => /(SECTION|단면도?)$/.test(g.u))
    if (!평면들.length || !단면들.length) { 못읽음.push({ p: x.p, 이름, 까닭: '평면 · 단면 그림 이름을 못 찾음' }); continue }
    /* 치수 글 → 바로 아래 그림 이름(없으면 가까운 것) */
    const 수 = 글.filter((g) => /^\d{2,5}$/.test(g.u) && (Math.abs(Math.sin(g.a)) < 0.1 || Math.abs(Math.cos(g.a)) < 0.1))
    const 그림번 = (g) => {
      let best = -1, bd = Infinity
      /* 가로 거리를 먼저(그림이 세로로 길어 이름표가 멀리 아래에 있기도 — 처리장 평면) */
      제목.forEach((t, k) => { const dy = g.y - t.y; if (dy >= 0 && Math.abs(g.x - t.x) + 0.3 * dy < bd) { bd = Math.abs(g.x - t.x) + 0.3 * dy; best = k } })
      if (best < 0) 제목.forEach((t, k) => { const d = Math.abs(g.x - t.x) + 3 * Math.abs(g.y - t.y); if (d < bd) { bd = d; best = k } })
      return best
    }
    const 몫 = 제목.map(() => [])
    for (const g of 수) { const k = 그림번(g); if (k >= 0) 몫[k].push(g) }
    const 가로 = (k) => 몫[k].filter((g) => Math.abs(Math.sin(g.a)) < 0.1), 세로 = (k) => 몫[k].filter((g) => Math.abs(Math.cos(g.a)) < 0.1)
    /* 평면: 밑판이 보이는 평면(BOTTOM PLAN · PLAN) 먼저 — 가로 · 세로 둘 다 읽히는 첫 평면 */
    let X = null, Y = null
    for (const t of 평면들.slice().sort((a, b) => (/TOP/.test(a.u) ? 1 : 0) - (/TOP/.test(b.u) ? 1 : 0))) {
      const k = 제목.indexOf(t)
      const x1 = 평면방향(줄들(가로(k), false)), y1 = 평면방향(줄들(세로(k), true))
      if (x1 && y1) { X = x1; Y = y1; break }
      if (x1 && !X) X = x1
      if (y1 && !Y) Y = y1
    }
    let H = null
    for (const t of 단면들) { const h = 단면높이(줄들(세로(제목.indexOf(t)), true)); if (h && (!H || h.합 > H.합)) H = h }
    if (!X || !Y || !H) { 못읽음.push({ p: x.p, 이름, 까닭: !X || !Y ? '평면 벽 두께 치수 줄(«300 | 4000 | 300»)을 못 찾음' : '단면 높이 치수 줄(«400 | 2800 | 200»)을 못 찾음' }); continue }
    const 개수m = 글.map((g) => /Q'?TY[:：]?(\d{1,3})EA/.exec(g.u)).find(Boolean)
    const n = 개수m ? +개수m[1] : 1
    const Lx = X.바깥, Ly = Y.바깥, wx = X.벽, wy = Y.벽, p = Math.max(X.돌출, Y.돌출), tb = H.밑판, h = H.속, tt = H.윗판
    if (Lx - 2 * wx <= 0 || Ly - 2 * wy <= 0) { 못읽음.push({ p: x.p, 이름, 까닭: '벽 두께가 바깥 크기와 안 맞음' }); continue }
    const qs = n > 1 ? '*' + n : ''
    const 동 = (x.번호 ? x.번호 + ' ' : '') + 이름
    const 자리 = [{ n: D.이름 || '', r: [x.r[0] / D.k, x.r[1] / D.k, x.r[2] / D.k, x.r[3] / D.k], 판: true }]
    const 넣 = (부재, 식) => 줄.push({ 동, 층: 'FT', 부재, 산출식: 식 + qs, _자리: 자리 })
    /* 콘크리트 */
    넣('F-콘크리트', '(' + m(Lx + 2 * p) + '*' + m(Ly + 2 * p) + ')*' + m(tb))
    넣('W-콘크리트', '(' + m(Lx) + '*' + m(Ly) + '-' + m(Lx - 2 * wx) + '*' + m(Ly - 2 * wy) + ')*' + m(h))
    if (tt) 넣('S-콘크리트', m(Lx) + '*' + m(Ly) + '*' + m(tt))
    /* 거푸집 */
    넣('W-거푸집', '2*(' + m(Lx) + '+' + m(Ly) + ')*' + m(h + tt) + '+2*(' + m(Lx - 2 * wx) + '+' + m(Ly - 2 * wy) + ')*' + m(h))
    넣('F-거푸집', '2*(' + m(Lx + 2 * p) + '+' + m(Ly + 2 * p) + ')*' + m(tb))
    if (tt) 넣('S-거푸집', m(Lx - 2 * wx) + '*' + m(Ly - 2 * wy))
    /* 철근 — 판의 간격 글 */
    const 셈 = new Map()
    for (const g of 글) { const mm = /^H?D(\d{2})@(\d{2,4})$/.exec(g.u); if (mm) { const k = mm[1] + '@' + mm[2]; 셈.set(k, (셈.get(k) || 0) + 1) } }
    const 차례 = [...셈].sort((a, b) => b[1] - a[1]).map(([k]) => k)
    const 철 = []
    if (차례.length) {
      const a = 차례[0], b = 차례[1] || 차례[0]
      const 면 = [['W', '2*(' + m(Lx - wx) + '+' + m(Ly - wy) + ')*' + m(h)], ['F', m(Lx + 2 * p) + '*' + m(Ly + 2 * p)], ...(tt ? [['S', m(Lx) + '*' + m(Ly)]] : [])]
      for (const [머리, 넓] of 면) for (const k of [a, b]) {
        const [d, s] = k.split('@')
        넣(머리 + '-D' + d, '(' + 넓 + ')*2/' + m(+s))
        철.push(k)
      }
    }
    const 콘 = ((Lx + 2 * p) * (Ly + 2 * p) * tb + (Lx * Ly - (Lx - 2 * wx) * (Ly - 2 * wy)) * h + Lx * Ly * tt) / 1e9 * n
    읽음.push({ p: x.p, 이름, 콘크리트: 콘, 글: `${Lx}×${Ly} 벽 ${wx}${wy !== wx ? '/' + wy : ''} · 밑판 ${tb}${p ? '(사방 ' + p + ' 넓음)' : ''} · 속 ${h} · 윗판 ${tt || '없음'}${n > 1 ? ' · ' + n + '개' : ''}${차례.length ? ' · 철근 ' + [...new Set(철)].map((k) => 'D' + k).join(' · ') : ' · 철근 글 없음'}` })
  }
  return { 줄, 읽음, 못읽음 }
}
