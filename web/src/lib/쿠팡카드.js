/**
 * 🛒 G663 쿠팡 «카페형 상품 카드» 줄 — 고르는 규칙(쪽마다 주제 · 차례) · 자료 풀기 · 그림 크기 · 값 글 (2026-11-13)
 *   소장님 11-13: 「쿠팡을 쪽에 맞는 상품으로 하고, 최대한 상품 많이 보이게 해줘」 · 「카페는 이렇게 하잖아」(네이버 카페 «관심 있을만한 상품» 캡처 10장)
 *     · 「화질도 좋고」 · 「가격이 안보이는 거야?」 · 「상품 잘 골라줘」 · 「화질 좋고, 가격도 좋은 걸로」
 *     · 「과일만 쭉… 제철 과일… 옷 만 쭉… 이런 방식으로 하면 어때 각 카테고리 별로. 모두 건설맵에 넣는 거지」
 *     · 「쿠팡 카테고리 별 모든 상품 넣어 줘. 이용자가 클릭을 하게 해야지…」 · 「카테고리별 상품 쭉 만들고 캡쳐 먼저 보여 줘. 그리고 반영하게」
 *   ■ 자료: public/coupang/cards.json — 쿠팡 파트너스(소장님 계정)에서 주제마다 검색어 넷 → 별 4.5 · 평 100 넘는 것(수험서는 별 4.0 · 평 3) 중
 *     쿠팡 랭킹 앞 8개에서 할인이 큰 순(60% 넘으면 같게 보고 랭킹 순)으로 셋 → «상품 링크» 화면이 만든 link.coupang.com/a/… 를 하나씩 받음
 *     (누르면 수수료가 잡히는 정식 링크 · 받은 링크마다 «그 상품 · 그 값 · 그 그림» 으로 만들어졌는지 파트너스 응답과 맞춰 봄)
 *     가격은 만든 날 쿠팡 값 그대로(파트너스 API 키는 «최종 승인» 뒤에만 나옴 — 승인되면 날마다 실제 값으로 바꿀 것) → 줄 아래 «○월 ○일 쿠팡 기준 · 바뀔 수 있음»
 *   ■ 바꿀 때: docs/쿠팡카드_자료.md 차례 그대로(파트너스 로그인한 크롬 · 링크는 꼭 «상품 링크» 화면이 만든 것만 — 손으로 만들지 않음)
 *   ■ 자료가 깨졌거나 못 받으면: 맨 위 · 목록 줄은 예전 쿠팡 배너(쿠팡칸.jsx)로 돌아감 · 바닥 줄은 안 그림
 */

/** 쪽 → 앞에 올 주제(차례대로) — 맞는 쪽이 없으면 돌림만 */
export const 카드쪽주제 = [
  [/^\/cert(\/|$)/, ['cert', 'office', 'digital']],
  [/^\/(tools\/risk|safety)(\/|$)/, ['sitewinter', 'tools', 'outdoor']],
  [/^\/(tools|jeoksan|cad)(\/|$)/, ['tools', 'digital', 'sitewinter']],
  [/^\/(forms|naeyeok|change|guide|report)(\/|$)/, ['office', 'digital', 'food']],
  [/^\/(jobs|daily)(\/|$)/, ['sitewinter', 'winterwear', 'tools']],
  [/^\/qna(\/|$)/, ['fruit', 'food', 'interior']],
  [/^\/(|first|live|svc|goods|analysis|bunseok|corp|agency|pre|ext|gongdong|notice)(\/|$)/, ['sitewinter', 'fruit', 'winterwear']],
]

/** 나머지 쪽 · 뒤 줄에서 돌아가며 — 계절(11월) 먼저 */
export const 카드돌림 = ['fruit', 'winterwear', 'sitewinter', 'interior', 'food', 'digital', 'living', 'toys', 'car', 'outdoor', 'kitchen', 'baby', 'tools', 'office', 'beauty', 'pet', 'cert']

/** 자리 → 차례(같은 쪽에서 줄마다 다른 주제) — 위 0 · 바닥 1 · 목록 k → 1 + k */
export const 자리차례 = (자리, 차례 = 0) => (자리 === '위' ? 0 : 자리 === '바닥' ? 1 : 1 + Math.max(1, Number(차례) || 1))

/**
 * 이 쪽 · 이 차례의 주제 id
 * @param pathname 쪽 주소 · @param n 자리차례 · @param 씨앗 쪽에 들어올 때 정한 수 · @param 있는 cards.json 에 상품이 있는 주제 id 들
 */
export function 카드주제정하기(pathname = '/', n = 0, 씨앗 = 0, 있는 = 카드돌림) {
  const 맞음 = 카드쪽주제.find(([re]) => re.test(pathname))
  const 앞 = (맞음 ? 맞음[1] : []).filter((x) => 있는.includes(x))
  const 나머지 = 카드돌림.filter((x) => !앞.includes(x) && 있는.includes(x))
  const s = 나머지.length ? Math.abs(Math.floor(Number(씨앗) || 0)) % 나머지.length : 0
  const 줄 = [...앞, ...나머지.slice(s), ...나머지.slice(0, s)]
  return 줄.length ? 줄[n % 줄.length] : null
}

const 링크꼴 = /^https:\/\/link\.coupang\.com\/a\/[A-Za-z0-9]+$/
const 그림꼴 = /^https:\/\/[a-z0-9]+\.coupangcdn\.com\/thumbnails\/remote\/\d+x\d+ex\/image\/\S+$/

/**
 * cards.json → { 기준, 주제들:[{id,이름}], 상품:[{주제,이름,그림,원값,값,할인,별,평,짧은}] } · 꼴이 틀린 줄은 버림(잘못 바꾼 자료가 화면을 깨지 않게)
 * 쓸 상품이 하나도 없으면 null
 */
export function 카드자료풀기(j) {
  if (!j || !Array.isArray(j.상품) || !Array.isArray(j.주제들) || !Array.isArray(j.칸)) return null
  const 칸 = j.칸
  const k = (이름) => 칸.indexOf(이름)
  const [i주제, i이름, i그림, i원값, i값, i할인, i별, i평, i링크] = ['주제', '이름', '그림', '원값', '값', '할인', '별', '평', '링크'].map(k)
  if ([i주제, i이름, i그림, i값, i링크].some((x) => x < 0)) return null
  const 주제들 = j.주제들.filter((t) => Array.isArray(t) && typeof t[0] === 'string' && typeof t[1] === 'string').map(([id, 이름]) => ({ id, 이름 }))
  const 있는주제 = new Set(주제들.map((t) => t.id))
  const 본 = new Set()
  const 상품 = []
  for (const r of j.상품) {
    if (!Array.isArray(r)) continue
    const p = { 주제: r[i주제], 이름: String(r[i이름] || '').trim(), 그림: String(r[i그림] || ''), 원값: Number(r[i원값]) || 0, 값: Number(r[i값]) || 0, 할인: Number(r[i할인]) || 0, 별: Number(r[i별]) || 0, 평: Number(r[i평]) || 0, 짧은: String(r[i링크] || '') }
    if (!있는주제.has(p.주제) || !p.이름 || !(p.값 > 0) || !링크꼴.test(p.짧은) || !그림꼴.test(p.그림) || 본.has(p.짧은)) continue
    if (!(p.원값 >= p.값)) p.원값 = p.값
    if (!(p.할인 > 0 && p.할인 < 100)) p.할인 = 0
    본.add(p.짧은)
    상품.push(p)
  }
  if (!상품.length) return null
  return { 기준: String(j.기준 || ''), 주제들: 주제들.filter((t) => 상품.some((p) => p.주제 === t.id)), 상품 }
}

/** 쿠팡 그림 크기 바꾸기 — 212x212ex → 320(작은 카드) · 492(큰 카드) — 폰 3배 화면에서도 또렷(카드 104 · 156 CSS px) */
export const 그림크기 = (u, 크기 = 492) => String(u || '').replace(/\/\d+x\d+ex\//, `/${크기}x${크기}ex/`)

/**
 * ⚡ G665 (11-13) 그림 집 하나로 — 소장님 「광고가 늦게 떠」(폰 맨 위 줄 첫 그림이 빈 칸으로 남아 있던 캡처)
 *   쿠팡이 준 그림 주소는 집(thumbnail1 ~ 15 · t1a ~ t5c …)이 스물다섯 곳으로 흩어져 있어, 폰이 줄마다 집 서넛에 새로 연결(이름 찾기 · 보안 연결)하느라 늦었음.
 *   11-13 소장님 크롬에서 잼: 같은 길(…/thumbnails/remote/…/image/…)이면 어느 집에서나 같은 그림 — 212개 × 320 · 492 다 받아짐 · 다른 집 넷으로 바꿔도 48/48 ·
 *   thumbnail6 과 t3c 가 같은 캐시(«Hit from cloudfront» · 나이 같음). → 한 집(그림집)으로 모으고 index.html 에서 그 집에 미리 연결.
 *   그 집에서 못 받으면 원래 집 · 쿠팡이 준 주소 그대로 차례로(그림차례 · 쿠팡카드줄.jsx) — 그림이 빈 칸으로 남지 않게.
 *   🪶 그리고 가볍게(webp): 쿠팡 그림 212개 중 «.png» 상품 그림은 크기를 줄여도 PNG 그대로 와서 무거웠음(320 한 장 최대 211KB · 492 는 459KB · 320 의 40장이 100KB 넘음)
 *     → 주소 끝에 «.webp» 를 붙이면 쿠팡 그림 서버가 같은 그림을 webp 로 줌(11-13 크롬 잼: 212개 × 320 · 492 모두 image/webp · 320 = 그림 크기 320×320 그대로 ·
 *     합 320 10.7MB → 3.7MB · 492 22.0MB → 7.2MB · 한 장 최대 211 → 50KB · 459 → 105KB). webp 를 못 그리는 옛 브라우저는 그림차례 둘째(원래 꼴)로.
 */
export const 그림집 = 'thumbnail6.coupangcdn.com'
export const 그림주소 = (u, 크기 = 492) => 그림크기(u, 크기).replace(/^https:\/\/[a-z0-9]+\.coupangcdn\.com\//, `https://${그림집}/`) + '.webp'
/** 받을 차례: 그림집 webp → 그림집 원래 꼴 → 원래 집(같은 크기) → 쿠팡이 준 주소 그대로(212) — 같은 주소는 한 번만 */
export const 그림차례 = (u, 크기 = 492) => [...new Set([그림주소(u, 크기), 그림주소(u, 크기).replace(/\.webp$/, ''), 그림크기(u, 크기), String(u || '')])].filter(Boolean)

/** 12,900 꼴 */
export const 원 = (n) => (Number(n) || 0).toLocaleString('ko-KR')

/** 기준일 «11월 13일» */
export const 기준글 = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? `${Number(m[2])}월 ${Number(m[3])}일` : '' }
