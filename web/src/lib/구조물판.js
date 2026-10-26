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
 *
 * 🏭 G294 더 (2026-10-15 소장님 「작은 구조물 도면 읽기 — 지금 해줘」 · 현장 5 · 6 우수 집수 · 맨홀 · 처리장 · 가스충전소 판)
 * ■ 높이가 «VAR»(곳마다 다름 — 우수 집수 · 맨홀): 단면 그림의 선으로 잼 — 평면 바깥 크기만큼 떨어진 두 세운 선(바깥 벽) · 그 안쪽 벽 두께 자리의 세운 선(안 벽)
 *     → 속 = 안 벽 길이 · 윗판 = 바깥 벽 위 − 안 벽 위(100 ~ 600) · 밑판 = 안 바닥 − 그 아래 가장 가까운 가로선(바깥 폭 80 % 넘게 덮음). 짐작으로 알림.
 * ■ 한 판에 크기가 다른 같은 구조물 둘(«오수 MANHOLE PLAN (도로내) -6EA» · «(부지내) -7EA»): 개수 글이 따로 붙은 평면이 다른 줄에 있으면 따로 셈 ·
 *     단면은 그 평면과 같은 줄(판 높이 15 % 안)의 것.
 * ■ 개수: 평면 이름 곁(글 높이 4 배 위아래 · 15 배 옆)의 «-6EA» «(10EA)» «( 보도내-8EA)» «(2EA)» · 없으면 판의 «(Q'TY:2EA)».
 * ■ 윗판 구멍: 평면에 «200 | 600 | 200» 처럼 합이 속 크기인 세 칸 줄이 있으면 가운데(600)를 맨홀 구멍으로 윗판 콘크리트에서 뺌.
 * ■ 🏭 G295 밑판 아래 버림(무근) «F-버림» — 판 글 «버림 … T=50» 두께(없으면 50) · 밑판보다 사방 100 넓게.
 * ■ 🔧 G426 (현장 P① · P② «오수 MANHOLE DETAILS» · «배수로 점검구 DETAIL-1 ~ 3» 이 «아직 못 셈»)
 *   - 상세 판(«… DETAILS» — 뚜껑 · 바닥 모양 · 손잡이)은 상자가 없음: 같은 이름 «… PLAN & SECTION» 판이 따로 있으면 «몸체는 그 판에서 셈» 으로(못 셈 아님).
 *   - 보수 상세(기존 배수로에 점검구 — 벽 깨기 · 복구 · 철판 덮개): 판 안 «PLATE COVER DETAIL» 그림의 바깥 치수(가로 · 세로) · 두께 글(«PLATE COVER -30t»)
 *     × 평면 이름 곁 개수(«-7EA») = 철판 덮개 무게(«기타-철판(PL-30t)» 보강 줄 · 철골 kg). 깨기 · 복구 콘크리트 · 앵글 · 철근은 단면마다 달라 ❓(아직 못 셈 · 알림).
 * ■ 속 높이 치수가 없는 낮은 판(가스충전소 · 처리장 바닥 — 턱 100 · 가장자리 두꺼움): 단면 레벨 글자(+100 · −100 · −350)로
 *     가장자리 두께(맨 위 − 맨 아래) · 가운데 두께(맨 위 − 둘째 아래)의 평균 × 평면 넓이 · 거푸집 = 둘레 × 가장자리 두께. 짐작으로 알림.
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
  /* 🏭 G294 «VAR» 는 값 NaN(높이가 곳마다 다름) */
  return out.map((z) => { const g = z.g.sort((a, b) => kx(a) - kx(b)); return { k: z.k, v: g.map((t) => (VAR말.test(t.u) ? NaN : +t.u)), p: g.map(kx) } })
}
const VAR말 = /^V?AR\.?$/       // «VAR» «VAR.» «AR.»(앞 글자가 잘린 것)

/** 평면 한 방향(가로 또는 세로 치수 줄들) → {바깥, 벽, 돌출} | null */
function 평면방향(줄) {
  /* 🏭 G294 줄 끝에 붙은 20 mm 안 글(도면 번호 · 꼬리표 «2»)은 치수가 아님 — 가스충전소 «100 | 6850 | 100 | 2» */
  줄 = 줄.map((z) => { const v = z.v.slice(); while (v.length && v[v.length - 1] < 20) v.pop(); while (v.length && v[0] < 20) v.shift(); return { ...z, v } })
  const 대칭 = 줄.filter((z) => z.v.length >= 3 && z.v[0] === z.v[z.v.length - 1])
  const 후보 = []
  for (const z of 대칭) {
    const v = z.v, n = v.length, 합 = v.reduce((a, b) => a + b, 0)
    if (v[0] < 150 && n >= 5 && v[1] === v[n - 2] && v[1] >= 100 && v[1] <= 600) 후보.push({ 바깥: 합 - 2 * v[0], 벽: v[1], 돌출: v[0] })
    else if (v[0] >= 100 && v[0] <= 600) 후보.push({ 바깥: 합, 벽: v[0], 돌출: 0, 속: 합 - 2 * v[0], 셋: n === 3 ? v[1] : null })
  }
  if (!후보.length) return null
  /* 🏭 G294 겹친 줄 사슬 — 바깥 줄의 속 = 다음 줄의 바깥: «100 | 1400 | 100» ⊃ «200 | 1000 | 200» ⊃ «200 | 600 | 200»
     셋이면 밑판 돌출 · 벽 · 윗판 구멍(맨홀) / 둘이면 바깥 줄 폭이 안 줄보다 좁거나 150 안이면 돌출 · 벽(PIT «150 | 4600 | 150» ⊃ «300 | 4000 | 300»),
     아니면 벽 · 구멍 / 하나면 벽(한 줄 안의 «100 | 200 | … | 200 | 100» 돌출은 그대로) */
  const 큰차례 = 후보.slice().sort((a, b) => b.바깥 - a.바깥)
  const 사슬 = [큰차례[0]]
  while (사슬.length < 3) { const c = 사슬[사슬.length - 1]; const d = c.속 && 큰차례.find((e) => e !== c && e.바깥 === c.속); if (!d) break; 사슬.push(d) }
  let w, 돌 = 0, 구멍 = 0
  if (사슬.length >= 3) { 돌 = 사슬[0].벽; w = 사슬[1]; 구멍 = 사슬[2].셋 || 0 }
  else if (사슬.length === 2) {
    if (사슬[0].벽 < 사슬[1].벽 || 사슬[0].벽 <= 150) { 돌 = 사슬[0].벽; w = 사슬[1] } else { w = 사슬[0]; 구멍 = 사슬[1].셋 || 0 }
  } else w = 사슬[0]
  return { 바깥: w.바깥, 벽: w.벽, 돌출: w.돌출 || 돌, 구멍 }
}

/** 단면 세운 치수 줄들 → {밑판, 속, 윗판} | null */
function 단면높이(줄) {
  let best = null
  for (const z of 줄) {
    const v = z.v
    for (let i = 1; i < v.length; i++) {
      const h = v[i]
      if (!(h >= 500)) continue
      const 밑 = v[i - 1]
      if (밑 < 100 || 밑 > 1000) continue
      const 위 = i + 1 < v.length && v[i + 1] >= 100 && v[i + 1] <= 600 ? v[i + 1] : 0
      const 합 = 밑 + h + 위
      if (!best || 합 > best.합 || (합 === best.합 && 위 && !best.윗판)) best = { 밑판: 밑, 속: h, 윗판: 위, 합 }
    }
  }
  return best
}

/* 🏭 G294 단면 그림 선으로 높이 재기(«VAR») — 상자 안 실선(중심선 · 치수 · 철근 · 숨은선 층 빼고) */
const 안쓸선층 = /CENTER|DIM|치수|TEXT|글|철근|REBAR|HATCH|해치|LEVEL|지시|점선|HIDDEN|HANDRAIL|BOLT|PIPE|배관|FENCE/i
export function 그림높이(D, 상자, 폭들, 벽, 치수글 = []) {
  const 층들 = D.layers || (D.모델 && D.모델.layers) || []
  const 세 = [], 가 = []
  for (let s = 0; s < D.sx0.length; s++) {
    const x0 = D.sx0[s], y0 = D.sy0[s], x1 = D.sx1[s], y1 = D.sy1[s]
    if (Math.min(x0, x1) < 상자[0] || Math.max(x0, x1) > 상자[2] || Math.min(y0, y1) < 상자[1] || Math.max(y0, y1) > 상자[3]) continue
    if (D.slt && D.slt[s]) continue
    if (안쓸선층.test(String((층들[D.sly[s]] || {}).name || ''))) continue
    if (Math.abs(x1 - x0) < 2 && Math.abs(y1 - y0) >= 300) 세.push({ x: (x0 + x1) / 2, a: Math.min(y0, y1), b: Math.max(y0, y1) })
    else if (Math.abs(y1 - y0) < 2 && Math.abs(x1 - x0) >= 200) 가.push({ y: (y0 + y1) / 2, a: Math.min(x0, x1), b: Math.max(x0, x1) })
  }
  if (세.length < 4) return null
  const xs = []
  for (const z of 세.sort((p, q) => p.x - q.x)) { const g = xs[xs.length - 1]; if (g && z.x - g.x <= 5) { g.줄.push(z); g.길 += z.b - z.a } else xs.push({ x: z.x, 길: z.b - z.a, 줄: [z] }) }
  /* 바깥 두 선 + 그 안쪽 벽 두께 자리 두 선 — 단면을 평면과 다른 축척으로 그린 판도 있어(현장 5 오수 맨홀: 바깥 1,250 을 1,087 로) 축척 s = 바깥 / 잰 폭 */
  let 고른 = null
  for (const L of 폭들) for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
    const d = xs[j].x - xs[i].x
    if (d < 300) continue
    const 같은축척 = Math.abs(d - L) <= Math.max(80, 0.08 * L)
    const s = 같은축척 ? 1 : L / d
    if (s < 0.5 || s > 2) continue
    const 틈 = Math.max(25, 0.35 * 벽) / s, 왼 = xs[i].x + 벽 / s, 오 = xs[j].x - 벽 / s
    const 안왼 = xs.filter((g) => g.x > xs[i].x && g.x < xs[j].x && Math.abs(g.x - 왼) <= 틈), 안오 = xs.filter((g) => g.x > xs[i].x && g.x < xs[j].x && Math.abs(g.x - 오) <= 틈)
    if (!안왼.length || !안오.length) { if (!같은축척) continue }
    const 안길 = [...안왼, ...안오].reduce((a, g) => a + g.길, 0)
    if (!같은축척 && 안길 < 0.5 * (xs[i].길 + xs[j].길)) continue
    const 점 = (xs[i].길 + xs[j].길 + 안길) * (같은축척 ? 2 : 1)
    if (!고른 || 점 > 고른.점) 고른 = { A: xs[i], B: xs[j], 안: [...안왼, ...안오], 왼: 안왼.flatMap((g) => g.줄), 오: 안오.flatMap((g) => g.줄), s, 점 }
  }
  if (!고른) return null
  const { A, B, s } = 고른
  const 안 = 고른.안.flatMap((g) => g.줄)
  if (!안.length) return null
  const 바깥 = [...A.줄, ...B.줄]
  const 위 = Math.max(...바깥.map((z) => z.b)), 밑 = Math.min(...바깥.map((z) => z.a))
  /* 안 벽 = 양쪽 안 선 가운데 가장 긴 것 둘 중 짧은 쪽(한쪽에만 있는 긴 선 — 관 · 덮개 틀 — 은 안 벽이 아님) — 바닥 = 그 밑 · 안위 = 그 위 */
  const 긴 = (a) => a.slice().sort((p, q) => (q.b - q.a) - (p.b - p.a))[0]
  const 왼긴 = 긴(고른.왼 || []), 오긴 = 긴(고른.오 || [])
  const 긴안 = 왼긴 && 오긴 ? (왼긴.b - 왼긴.a <= 오긴.b - 오긴.a ? 왼긴 : 오긴) : 긴(안)
  const 바닥 = 긴안.a, 안위 = 긴안.b
  const 속 = (안위 - 바닥) * s
  if (!(속 >= 300)) return null
  /* 치수 글이 있으면 치수 값(참값) — 글 가운데가 안위 바로 위(윗판) · 바닥 바로 아래(밑판) */
  const 세운수 = 치수글.filter((g) => Math.abs(Math.cos(g.a)) < 0.1 && /^\d{2,4}$/.test(g.u)).map((g) => ({ v: +g.u, y: g.y }))
  const 바로위 = 세운수.filter((g) => g.v >= 100 && g.v <= 600 && g.y > 안위 && g.y < 안위 + 0.65 * g.v / s + 30 / s).sort((p, q) => p.y - q.y)[0]
  const 바로밑 = 세운수.filter((g) => g.v >= 100 && g.v <= 1000 && g.y < 바닥 && g.y > 바닥 - 0.65 * g.v / s - 30 / s).sort((p, q) => q.y - p.y)[0]
  let 윗판 = (위 - 안위) * s
  if (!(윗판 >= 100 && 윗판 <= 600)) 윗판 = 0
  else if (바로위) 윗판 = 바로위.v
  /* 밑판 — 안 바닥 아래 가로선(같은 높이 토막을 이어 바깥 폭 80 % 넘게 덮음) 가운데 가장 높은 것 · 없으면 바닥 바로 아래 세운 치수(100 ~ 1,000) */
  const 높이별 = []
  for (const g of 가.slice().sort((p, q) => p.y - q.y)) { const z = 높이별[높이별.length - 1]; if (z && g.y - z.y <= 2) z.줄.push(g); else 높이별.push({ y: g.y, 줄: [g] }) }
  const 덮음 = (z) => { const 토 = z.줄.map((g) => [Math.max(g.a, A.x), Math.min(g.b, B.x)]).filter((t) => t[1] > t[0]).sort((p, q) => p[0] - q[0]); let 합 = 0, 끝 = -Infinity; for (const [a, b] of 토) { if (b <= 끝) continue; 합 += b - Math.max(a, 끝); 끝 = b } return 합 }
  const 밑선 = 높이별.filter((z) => z.y <= 바닥 - 100 / s && z.y >= 바닥 - 1000 / s && 덮음(z) >= 0.8 * (B.x - A.x)).sort((p, q) => q.y - p.y)
  let 밑판 = 바로밑 ? 바로밑.v : (밑선.length ? 바닥 - 밑선[0].y : 밑 < 바닥 - 100 / s ? 바닥 - 밑 : 0) * s
  if (!(밑판 >= 100 && 밑판 <= 1000)) return null
  return { 밑판: Math.round(밑판 / 10) * 10, 속: Math.round(속 / 10) * 10, 윗판: Math.round(윗판 / 10) * 10, 합: 밑판 + 속 + 윗판, 잰: true }
}
/** 단면 레벨 글자 → mm(FL 기준) · 아니면 null — «+100» «−350» «±0.000» «GL±0.000» */
function 레벨(u) {
  let t = String(u || '').replace(/%%P/g, '±').replace(/[−–]/g, '-').replace(/^(?:FL|GL|EL\.?)/, '')
  if (/^[±]0(?:\.0+)?$/.test(t)) return 0
  const k = /^([+-])(\d{1,4})(?:\.0+)?$/.exec(t)
  return k ? (k[1] === '-' ? -1 : 1) * +k[2] : null
}

const m = (mm) => String(Math.round(mm) / 1000)

/** 🔧 G426 «… DETAILS» 상세 판(상자 없음) — 같은 파일에 같은 이름 «… PLAN & SECTION» 판이 있으면 몸체는 그 판에서 셈 → 상세 목록에 넣고 true */
function 상세판(x, 이름, 판, 상세) {
  if (!/DETAILS?\s*$/i.test(이름.trim()) && !/상세도?\s*$/.test(이름.trim())) return false
  const 몸 = 붙(이름).replace(/(DETAILS?|상세도?)$/, '')
  if (몸.length < 2) return false
  const 짝 = (판 || []).find((y) => y !== x && 붙(y.이름).startsWith(몸) && /PLAN|SECTION|평면|단면/i.test(String(y.이름 || '').slice(몸.length - 1)))
  if (!짝) return false
  상세.push({ p: x.p, 이름, 까닭: '상세 판(뚜껑 · 바닥 모양 · 손잡이 — 상자 없음) — 몸체는 «' + 짝.이름 + '» 판에서 셈' })
  return true
}
/** 🔧 G426 보수 상세 판의 철판 덮개 — «PLATE COVER DETAIL» 그림 이름 위 치수(가로 줄 · 세로 줄의 가장 큰 바깥 값) · 두께 «-30t» · 평면 이름(«배수로 점검구-A») 곁 «-7EA» */
function 보수상세(D, x, 글) {
  const 그림 = 글.find((g) => /PLATECOVERDETAIL$/.test(g.u))
  if (!그림) return null
  const 판높이 = Math.abs((x.r[3] - x.r[1]) || 1), 판폭 = Math.abs((x.r[2] - x.r[0]) || 1)
  /* 그림 이름 바로 위(판 높이 30 % · 가로 판 폭 15 % 안)의 치수 글 */
  const 수 = 글.filter((g) => /^\d{2,5}$/.test(g.u) && g.y > 그림.y && g.y - 그림.y < 0.3 * 판높이 && Math.abs(g.x - 그림.x) < 0.15 * 판폭)
  const 가로 = 수.filter((g) => Math.abs(Math.sin(g.a)) < 0.1), 세로 = 수.filter((g) => Math.abs(Math.cos(g.a)) < 0.1)
  /* 줄마다 합 · 가운데 — 그림 이름에서 그 줄 크기의 3 배 안(그림에 붙은 치수)만 · 그중 가장 큰 바깥 값(«1590» 또는 «500 | 590 | 500» 의 합) */
  const 바깥 = (a, 세) => {
    if (!a.length) return 0
    let best = 0
    for (const z of 줄들(a, 세)) {
      const 합 = z.v.reduce((s2, v) => s2 + (v > 0 ? v : 0), 0), 큰 = Math.max(...z.v.filter((v) => v > 0))
      const gs = a.filter((g) => Math.abs((세 ? g.x : g.y) - z.k) <= 0.6 * g.h)
      const cx = gs.reduce((s2, g) => s2 + g.x, 0) / (gs.length || 1), cy = gs.reduce((s2, g) => s2 + g.y, 0) / (gs.length || 1)
      if (Math.hypot(cx - 그림.x, cy - 그림.y) > 3 * Math.max(합, 500)) continue
      best = Math.max(best, 합, 큰)
    }
    return best
  }
  const 가 = 바깥(가로, false), 세 = 바깥(세로, true)
  if (!(가 >= 200 && 가 <= 6000 && 세 >= 200 && 세 <= 6000)) return null
  /* 두께 — 그림 곁 «PLATE COVER» 글 바로 밑 «-30t» (가장 가까운 것) */
  let t = 0, bd = Infinity
  for (const g of 글) {
    const k = /^-?(\d{1,2})T$/.exec(g.u)
    if (!k) continue
    const 곁 = 글.find((p) => /^PLATECOVER$/.test(p.u) && Math.abs(p.x - g.x) < 6 * p.h && p.y > g.y && p.y - g.y < 3 * p.h)
    if (!곁) continue
    const d = Math.hypot(g.x - 그림.x, g.y - 그림.y)
    if (d < bd) { bd = d; t = +k[1] }
  }
  if (!(t >= 3 && t <= 60)) return null
  /* 개수 — 판 안 구조물 이름 글(«배수로 점검구-A») 곁 «-7EA» */
  let n = 0, n글 = '', 이름 = ''
  for (const g of 글) {
    if (!구조물이름.test(g.s) || g.u.length > 30 || /DETAIL/.test(g.u)) continue
    for (const q of 글) {
      if (q === g || Math.abs(q.y - g.y) > 4 * g.h || Math.abs(q.x - g.x) > 15 * g.h) continue
      const k = /^-?\(?(\d{1,3})EA\)?$/.exec(q.u)
      if (k && +k[1] > 0) { n = +k[1]; n글 = q.s.trim(); 이름 = g.s.trim(); break }
    }
    if (n) break
  }
  if (!n) return null
  return { 가, 세, t, n, n글, 이름 }
}

/**
 * @param D 골조자동 준비(…) 한 파일
 * @param 판 판목록(D) — [{p, 번호, 이름, r}]
 * @returns {줄: [보강 줄], 읽음: [{p, 이름, 콘크리트(㎥), 글}], 못읽음: [{p, 이름, 까닭}]}
 */
export function 구조물읽기(D, 판) {
  const 줄 = [], 읽음 = [], 못읽음 = [], 상세 = []
  for (const x of 판 || []) {
    const 이름 = String(x.이름 || '')
    if (!구조물이름.test(이름) || 빼는이름.test(이름)) continue
    /* 건축 판(이름 꼬리 «[미생물 처리장]» · 입면도 · 면적산출표 · 구조 평면도 · 주심도)은 뺌 — 구조물 상세 판만 */
    if (/[\[［【][^\]］】]+[\]］】]\s*$/.test(이름) || /입면|면적|창호|지붕|주심도|구조\s*평면도|골조/.test(이름)) continue
    if (/평면도/.test(이름) && !/단면|SECTION|상세|DETAIL/i.test(이름)) continue      // «PIT, 지하1층평면도» 같은 층 평면 판
    /* 🏭 G294 «HANDHOLE PLAN» 처럼 이름이 «… PLAN» 뿐인 판은 놓을 자리를 그린 배치 판 — 상세 판(DETAILS · SECTION)이 따로 있음 */
    if (/PLAN$/i.test(이름.trim()) && !/SECTION|DETAIL|단면|상세/i.test(이름)) continue
    const 글 = D.글자.filter((g) => D.도곽번(g.x, g.y) === x.p)
    const 제목 = 글.filter((g) => g.u.length <= 24 && /(PLAN|평면도?|SECTION|단면도?)$/.test(g.u) && !/&/.test(g.s))
    const 평면들 = 제목.filter((g) => /(PLAN|평면도?)$/.test(g.u)), 단면들 = 제목.filter((g) => /(SECTION|단면도?)$/.test(g.u))
    /* 🔧 G426 보수 상세(«배수로 점검구 DETAIL-1») — 철판 덮개 그림(«PLATE COVER DETAIL») 치수 · 두께 × 개수 */
    const 덮개 = 보수상세(D, x, 글)
    if (덮개) {
      const 자리 = [{ n: D.이름 || '', r: [x.r[0] / D.k, x.r[1] / D.k, x.r[2] / D.k, x.r[3] / D.k], 판: true }]
      const 동 = (x.번호 ? x.번호 + ' ' : '') + 이름
      줄.push({ 동, 층: 'FT', 부재: '기타-철판(PL-' + 덮개.t + 't)', 산출식: m(덮개.가) + '*' + m(덮개.세) + '*' + m(덮개.t) + (덮개.n > 1 ? '*' + 덮개.n : ''), _자리: 자리 })
      const kg = 덮개.가 * 덮개.세 * 덮개.t / 1e9 * 7850 * 덮개.n
      읽음.push({ p: x.p, 이름, 콘크리트: 0, 철판kg: kg, 보수: true, 글: `${덮개.이름} 철판 덮개 ${덮개.가}×${덮개.세}×${덮개.t}t × ${덮개.n}개(${덮개.n글}) = ${Math.round(kg).toLocaleString('en-US')} kg — 깨기 · 복구 콘크리트 · 앵글 · 철근은 ❓ 아직 못 셈` })
      continue
    }
    if (!평면들.length || !단면들.length) { if (!상세판(x, 이름, 판, 상세)) 못읽음.push({ p: x.p, 이름, 까닭: '평면 · 단면 그림 이름을 못 찾음' }); continue }
    /* 치수 글 → 바로 아래(가까운) 그림 이름 · «VAR» 도 같이(세운 글) */
    const 수 = 글.filter((g) => (/^\d{2,5}$/.test(g.u) || VAR말.test(g.u)) && (Math.abs(Math.sin(g.a)) < 0.1 || Math.abs(Math.cos(g.a)) < 0.1))
    const 그림번 = (g) => {
      let best = -1, bd = Infinity
      /* 가로 거리를 먼저(그림이 세로로 길어 이름표가 멀리 아래에 있기도 — 처리장 평면) */
      제목.forEach((t, k) => { const dy = g.y - t.y; if (dy >= 0 && Math.abs(g.x - t.x) + 0.3 * dy < bd) { bd = Math.abs(g.x - t.x) + 0.3 * dy; best = k } })
      if (best < 0) 제목.forEach((t, k) => { const d = Math.abs(g.x - t.x) + 3 * Math.abs(g.y - t.y); if (d < bd) { bd = d; best = k } })
      return best
    }
    const 몫 = 제목.map(() => [])
    for (const g of 수) { const k = 그림번(g); if (k >= 0) 몫[k].push(g) }
    const 가로 = (k) => 몫[k].filter((g) => Math.abs(Math.sin(g.a)) < 0.1 && !VAR말.test(g.u)), 세로 = (k) => 몫[k].filter((g) => Math.abs(Math.cos(g.a)) < 0.1)
    /* 🏭 G294 개수 — 평면 이름 곁 «-6EA» «(10EA)» «( 보도내-8EA)» · 없으면 판의 «(Q'TY:2EA)» */
    const 개수곁 = (t) => { for (const g of 글) { if (g === t || Math.abs(g.y - t.y) > 4 * t.h || Math.abs(g.x - t.x) > 15 * t.h) continue; const k = /(\d{1,3})EA\)?$/.exec(g.u); if (k && +k[1] > 0) return +k[1] } return null }
    const 판개수m = 글.map((g) => /Q'?TY[:：]?(\d{1,3})EA/.exec(g.u)).find(Boolean)
    const 판높이 = Math.abs((x.r[3] - x.r[1]) || 1)
    /* 🏭 G294 한 판에 크기가 다른 같은 구조물 — 개수 글이 따로 붙은 평면이 서로 다른 줄(판 높이 15 % 넘게 떨어짐)이면 따로 셈 */
    const 셀평면 = 평면들.map((t) => ({ t, n: 개수곁(t) })).filter((z) => z.n)
    const 따로 = 셀평면.length >= 2 && 셀평면.some((a) => 셀평면.some((b) => Math.abs(a.t.y - b.t.y) > 0.15 * 판높이))
    const 무리 = 따로
      ? 셀평면.map((z) => ({ 평면: [z.t], 단면: (() => { const 곁 = 단면들.filter((u) => Math.abs(u.y - z.t.y) <= 0.15 * 판높이); return 곁.length ? 곁 : 단면들 })(), n: z.n }))
      : [{ 평면: 평면들, 단면: 단면들, n: (셀평면[0] && 셀평면[0].n) || (판개수m ? +판개수m[1] : 1) }]
    const 읽은무리 = []
    let 까닭 = ''
    for (const 무 of 무리) {
      /* 평면: 밑판이 보이는 평면(BOTTOM PLAN · PLAN) 먼저 — 가로 · 세로 둘 다 읽히는 첫 평면 */
      let X = null, Y = null
      for (const t of 무.평면.slice().sort((a, b) => (/TOP/.test(a.u) ? 1 : 0) - (/TOP/.test(b.u) ? 1 : 0))) {
        const k = 제목.indexOf(t)
        const x1 = 평면방향(줄들(가로(k), false)), y1 = 평면방향(줄들(세로(k).filter((g) => !VAR말.test(g.u)), true))
        if (x1 && y1) { X = x1; Y = y1; break }
        if (x1 && !X) X = x1
        if (y1 && !Y) Y = y1
      }
      if (!X || !Y) { 까닭 = '평면 벽 두께 치수 줄(«300 | 4000 | 300»)을 못 찾음'; continue }
      let H = null, 짐 = ''
      /* 평면 «벽» 이 100 안이면 벽이 아니라 바닥판 가장자리(가스충전소 «100 | 6850 | 100» — 울타리 선에서 판 끝까지) → 낮은 판으로 */
      const 판만 = Math.min(X.벽, Y.벽) <= 100
      if (!판만) for (const t of 무.단면) { const h = 단면높이(줄들(세로(제목.indexOf(t)), true)); if (h && (!H || h.합 > H.합)) H = h }
      /* «VAR» — 단면 그림 선으로 잼 */
      if (!H && !판만) {
        for (const t of 무.단면) {
          const k = 제목.indexOf(t)
          if (!몫[k].some((g) => VAR말.test(g.u))) continue
          const 글들 = [t, ...몫[k]]
          /* 그림 이름은 그림 밑 가운데 — 치수 글이 한쪽에만 있어도 그림 이름 양쪽으로 같은 폭 */
          const 반폭 = Math.max(...글들.map((g) => Math.abs(g.x - t.x))) + 300
          const 상자 = [t.x - 반폭, Math.min(...글들.map((g) => g.y)) - 300, t.x + 반폭, Math.max(...글들.map((g) => g.y)) + 300]
          const h = 그림높이(D, 상자, [X.바깥, Y.바깥], Math.min(X.벽, Y.벽), 몫[k])
          if (h && (!H || h.합 > H.합)) H = h
        }
        if (H) 짐 = '높이 VAR — 단면 그림에서 잰 속 ' + H.속
      }
      /* 낮은 판(속 높이 치수 · VAR 없음) — 단면 레벨 글자로 가장자리 · 가운데 두께 */
      let 판꼴 = null
      if (!H) {
        const 레벨들 = [...new Set(글.filter((g) => 무.단면.some((t) => Math.abs(g.x - t.x) < 0.45 * Math.abs(x.r[2] - x.r[0]) && g.y > t.y && g.y - t.y < 0.45 * 판높이)).map((g) => 레벨(g.u)).filter((v) => v !== null))].sort((a, b) => a - b)
        if (레벨들.length >= 2) {
          const 위 = 레벨들[레벨들.length - 1], 가 = 위 - 레벨들[0], 안 = 레벨들.length >= 3 ? 위 - 레벨들[1] : 가
          if (가 >= 100 && 가 <= 1500 && 안 >= 100) 판꼴 = { 가, 안 }
        }
        if (!판꼴) { 까닭 = 몫.some((a) => a.some((g) => VAR말.test(g.u))) ? '높이 «VAR» 를 단면 그림에서 못 잼' : '단면 높이 치수 줄(«400 | 2800 | 200»)을 못 찾음'; continue }
      }
      읽은무리.push({ 무, X, Y, H, 판꼴, 짐 })
    }
    if (!읽은무리.length) { if (!상세판(x, 이름, 판, 상세)) 못읽음.push({ p: x.p, 이름, 까닭: 까닭 || '평면 벽 두께 치수 줄(«300 | 4000 | 300»)을 못 찾음' }); continue }
    /* 철근 — 판의 간격 글(가장 많이 나온 것 = 한 방향 · 다음 것 = 다른 방향) */
    const 셈 = new Map()
    for (const g of 글) { const mm = /^H?D(\d{2})@(\d{2,4})$/.exec(g.u); if (mm) { const k = mm[1] + '@' + mm[2]; 셈.set(k, (셈.get(k) || 0) + 1) } }
    const 차례 = [...셈].sort((a, b) => b[1] - a[1]).map(([k]) => k)
    const 자리 = [{ n: D.이름 || '', r: [x.r[0] / D.k, x.r[1] / D.k, x.r[2] / D.k, x.r[3] / D.k], 판: true }]
    /* 🏭 G295 밑판 아래 버림 — 판 글 «버림콘크리트 T=50» · «버림 T=60» 이 있으면 그 두께 · 없으면 50 · 밑판보다 사방 100 넓게(현장 5 맨홀 단면) */
    const 버림글 = 글.map((g) => /버림[^T]*T=?(\d{2,3})/.exec(g.u)).find(Boolean)
    const 버림t = 버림글 ? +버림글[1] : 50
    let 콘합 = 0
    const 글들 = []
    for (const [w, z] of 읽은무리.entries()) {
      const { X, Y, H, 판꼴 } = z, n = z.무.n
      const qs = n > 1 ? '*' + n : ''
      const 동 = (x.번호 ? x.번호 + ' ' : '') + 이름 + (읽은무리.length > 1 ? ' (' + (w + 1) + ')' : '')
      const 넣 = (부재, 식) => 줄.push({ 동, 층: 'FT', 부재, 산출식: 식 + qs, _자리: 자리 })
      const Lx = X.바깥, Ly = Y.바깥, wx = X.벽, wy = Y.벽, p = Math.max(X.돌출, Y.돌출)
      const 철 = []
      const 철넣 = (면) => {
        if (!차례.length) return
        const a = 차례[0], b = 차례[1] || 차례[0]
        for (const [머리, 넓] of 면) for (const k of [a, b]) { const [d, s2] = k.split('@'); 넣(머리 + '-D' + d, '(' + 넓 + ')*2/' + m(+s2)); 철.push(k) }
      }
      let 콘 = 0, 글 = ''
      if (판꼴) {
        /* 낮은 판 — 넓이 × 평균 두께 · 거푸집 = 둘레 × 가장자리 두께 */
        const t2 = (판꼴.가 + 판꼴.안) / 2
        넣('F-콘크리트', m(Lx) + '*' + m(Ly) + '*' + m(t2))
        if (버림t) 넣('F-버림', m(Lx + 200) + '*' + m(Ly + 200) + '*' + m(버림t))
        넣('F-거푸집', '2*(' + m(Lx) + '+' + m(Ly) + ')*' + m(판꼴.가))
        철넣([['F', m(Lx) + '*' + m(Ly)]])
        콘 = Lx * Ly * t2 / 1e9 * n
        글 = `${Lx}×${Ly} 바닥판 두께 가장자리 ${판꼴.가} · 가운데 ${판꼴.안}(레벨 글자 · 짐작)`
      } else {
        const tb = H.밑판, h = H.속, tt = H.윗판
        if (Lx - 2 * wx <= 0 || Ly - 2 * wy <= 0) continue
        const 구0 = X.구멍 || Y.구멍 || 0
        const 구 = tt && 구0 ? [X.구멍 || 구0, Y.구멍 || 구0] : null
        넣('F-콘크리트', '(' + m(Lx + 2 * p) + '*' + m(Ly + 2 * p) + ')*' + m(tb))
        if (버림t) 넣('F-버림', m(Lx + 2 * p + 200) + '*' + m(Ly + 2 * p + 200) + '*' + m(버림t))
        넣('W-콘크리트', '(' + m(Lx) + '*' + m(Ly) + '-' + m(Lx - 2 * wx) + '*' + m(Ly - 2 * wy) + ')*' + m(h))
        if (tt) 넣('S-콘크리트', (구 ? '(' + m(Lx) + '*' + m(Ly) + '-' + m(구[0]) + '*' + m(구[1]) + ')' : m(Lx) + '*' + m(Ly)) + '*' + m(tt))
        넣('W-거푸집', '2*(' + m(Lx) + '+' + m(Ly) + ')*' + m(h + tt) + '+2*(' + m(Lx - 2 * wx) + '+' + m(Ly - 2 * wy) + ')*' + m(h))
        넣('F-거푸집', '2*(' + m(Lx + 2 * p) + '+' + m(Ly + 2 * p) + ')*' + m(tb))
        if (tt) 넣('S-거푸집', m(Lx - 2 * wx) + '*' + m(Ly - 2 * wy) + (구 ? '-' + m(구[0]) + '*' + m(구[1]) : ''))
        철넣([['W', '2*(' + m(Lx - wx) + '+' + m(Ly - wy) + ')*' + m(h)], ['F', m(Lx + 2 * p) + '*' + m(Ly + 2 * p)], ...(tt ? [['S', m(Lx) + '*' + m(Ly)]] : [])])
        콘 = ((Lx + 2 * p) * (Ly + 2 * p) * tb + (Lx * Ly - (Lx - 2 * wx) * (Ly - 2 * wy)) * h + (Lx * Ly - (구 ? 구[0] * 구[1] : 0)) * tt) / 1e9 * n
        글 = `${Lx}×${Ly} 벽 ${wx}${wy !== wx ? '/' + wy : ''} · 밑판 ${tb}${p ? '(사방 ' + p + ' 넓음)' : ''} · 속 ${h}${H.잰 ? '(VAR — 그림에서 잼)' : ''} · 윗판 ${tt || '없음'}${구 ? '(구멍 ' + 구[0] + ')' : ''}`
      }
      글 += (n > 1 ? ' · ' + n + '개' : '') + (차례.length ? ' · 철근 ' + [...new Set(철)].map((k) => 'D' + k).join(' · ') : ' · 철근 글 없음')
      콘합 += 콘
      글들.push(글)
    }
    if (!글들.length) { 못읽음.push({ p: x.p, 이름, 까닭: '벽 두께가 바깥 크기와 안 맞음' }); continue }
    읽음.push({ p: x.p, 이름, 콘크리트: 콘합, 글: 글들.join(' / '), 짐작: 읽은무리.some((z) => z.판꼴 || (z.H && z.H.잰)) })
  }
  return { 줄, 읽음, 못읽음, 상세 }
}
