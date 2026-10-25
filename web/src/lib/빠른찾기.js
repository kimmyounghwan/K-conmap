/**
 * 🔎 빠른 찾기 (G404 · 2026-10-25) — 사이트 어디서나 한 칸에서 도구 · 계산기 · 서식 · 설계변경 · 입찰 알아보기 · 캐드 명령 · 화면을 찾습니다
 *   소장님 「건설맵에 빠른 검색기능 넣을 수 있을까? 검색기능이 있는데,,,」 — 지금 검색(공고 · 기관 · 업체)은 화면마다 따로라 그 화면에 먼저 들어가야 함
 *   · 서버에 묻지 않음 — 목록은 사이트 안 자료(data/*.json)로 브라우저에서 만듦 · 글자 칠 때마다 바로
 *   · 띄어쓰기 · 대소문자 무시 · 낱말 여럿(«철근 무게») = 모두 든 것 · 초성(«ㄱㅍㅈ» → 거푸집)
 *   · 공고 번호 모양(R26BK01774496 · 20261024123-00)이면 그 공고로 바로 가는 줄
 *   · 기관 · 업체는 화면(빠른찾기.jsx)이 따로 붙임(이미 있는 searchAgency · searchCorp — 받는 양을 늘리지 않음)
 *   시험: node tools/시험_빠른찾기.mjs
 */

const 초성표 = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

/** 한글 낱자 → 초성(한글 아닌 글자는 그대로) */
export function 초성(s) {
  let o = ''
  for (const ch of String(s || '')) {
    const c = ch.charCodeAt(0)
    o += c >= 0xac00 && c <= 0xd7a3 ? 초성표[Math.floor((c - 0xac00) / 588)] : ch
  }
  return o
}

/** 견주기 꼴 — 소문자 · 띄어쓰기 · 꾸밈 글자(· — / ( ) « » 등) 뺌 */
export const 고른말 = (s) => String(s || '').toLowerCase().replace(/[\s·・—\-–_/\\()[\]{}«»"'“”‘’.,:;!?~|+&]+/g, '')

const 초성만 = (s) => /^[ㄱ-ㅎ]+$/.test(s)

/* 주소마다 더 붙이는 찾는 말(제목 · 설명에 없는데 사람들이 치는 말) */
const 더말 = {
  '/jeoksan/model': '적산컨맵 골조 모델 토목 내역 대조 설계변경 거푸집 철근 콘크리트 물량 3d',
  '/jeoksan/bim': 'bim 물량 3d 도면 거푸집 철근 콘크리트 토공 흙막이 ifc',
  '/jeoksan/golgo': '골조 수량산출 철근 콘크리트 거푸집 일람표',
  '/jeoksan/magam': '마감 수량 방 미장 타일 도장 천장',
  '/naeyeok/ratio': '하도급 80% 비율 내역서',
  '/change/work': '설계변경 2줄 1줄 작업대',
  '/change/gisung': '기성 기성금 기성내역서 청구',
  '/tools/nomubi': '노무비 일용 인건비 지급명세서 원천세',
  '/tools/tuipbi': '투입비 공사일보 청구',
  '/': '투찰 입찰 금액 계산 사정률 바로투찰',
  '/first': '1순위 개찰 결과',
  '/live': '입찰 공고 나라장터',
  '/qna': '맵톡 사랑방 묻고답하기 질문',
  '/my': '마이컨맵 내정보',
  '/how': '사용법 이용방법 도움말',
}

/* 자료(data/*.json)에 없는 화면 — 이름은 Crumbs.jsx NAME · LEAF 와 같게(관리자 · 소장님만 보는 화면은 넣지 않음) */
const 더화면 = [
  ['/', '바로투찰', '투찰금액 계산 · 사정률 · 낙찰하한', '🎯'],
  ['/first', '오늘의 1순위', '개찰 결과 1순위 · 투찰률', '🥇'],
  ['/live', '입찰 공고', '나라장터 공사 입찰 공고 · 마감 순', '📢'],
  ['/svc/live', '용역 공고', '용역 입찰 공고', '📐'],
  ['/goods/live', '물품 공고', '물품 입찰 공고', '📦'],
  ['/pre', '곧 나올 공사', '사전규격 · 발주계획', '🔜'],
  ['/gongdong', '공동도급 마당', '공동도급 짝 찾기', '🤝'],
  ['/analysis', '낙찰 분석', '발주기관 · 업체 분석', '🔍'],
  ['/jobs', '구인구직', '현장 사람 구하기 · 일자리', '💼'],
  ['/tools', '도구', '건설맵 도구 모음', '🧰'],
  ['/forms', '건설 서식', '서식 목록 · 바로 쓰기 · 받기', '📄'],
  ['/naeyeok', '내역서', '내역서 · 안전 서류', '📋'],
  ['/naeyeok/hado', '하도급 내역서 만들기', '원 내역서로 하도급 내역서 · 비율', '🤝'],
  ['/jeoksan', 'K-적산', '적산 · 수량산출 · 적산컨맵', '🧮'],
  ['/jeoksan/fill', '공내역서 단가 채우기', '공내역서에 단가 넣기', '🧾'],
  ['/change/gisung', '기성 내역서', '기성금 청구 · 기성률 · 설계내역서로 기성', '💰'],
  ['/guide', '입찰 알아보기', '투찰금액 · 사정률 · 참가업체수 — 개찰 실측', '📚'],
  ['/how', '보는 방법', '건설맵 처음이시면 — 어디서 뭘 하는지', '📖'],
  ['/qna', '맵톡', '묻고 답하기 · 사랑방', '🗺'],
  ['/my', '마이컨맵', '내 작업대 · 내 정보', '🪪'],
  ['/corp', '업체 찾기', '건설업체 낙찰 실적 · 공동도급', '🏢'],
]

/* 같은 뜻 다른 말(낱말 하나를 이 말들로도 찾음) */
const 같은뜻 = {
  무게: ['중량'], 중량: ['무게'], 넓이: ['면적'], 면적: ['넓이'], 부피: ['체적', '물량'], 체적: ['부피'],
  인건비: ['노무비'], 노무비: ['인건비'], 견적: ['원가계산'], 공문: ['서식'], 레미콘: ['콘크리트'], 콘크리트: ['레미콘'],
  흙: ['토공'], 토공: ['흙'], 캐드: ['cad', 'dxf', 'dwg'], 도면: ['캐드', 'dxf'], 안전: ['위험성'], 일보: ['작업일보', '공사일보'],
}

/* 갈래 이름 · 차례(같은 점수면 이 차례) */
export const 갈래들 = { 화면: 0, 도구: 1, 계산기: 2, 서식: 3, 설계변경: 4, '입찰 알아보기': 5, '캐드 명령': 6, 공고: -1 }

/**
 * 자료 → 찾기 목록 [{ 갈래, t(제목), d(설명), to(주소), ic, 키(견주기), 초(초성 견주기), 더(더 붙인 말) }]
 * @param {{ 탭?, tools?, forms?, change?, guide?, cad? }} 자료 — 탭 [{to, ic, label}] · data/tools.json · forms-min.json · change.json · guide.json · cad.json
 */
export function 목록만들기(자료 = {}) {
  const 목 = []
  const 본 = new Set()
  const 넣 = (갈래, t, d, to, ic) => {
    if (!t || !to || 본.has(to)) return
    본.add(to)
    const 더 = 더말[to] || ''
    목.push({ 갈래, t: String(t), d: String(d || ''), to, ic: ic || '', 키: 고른말(t), 초: 고른말(초성(t)), 설: 고른말(d), 더: 고른말(더) })
  }
  for (const x of 자료.탭 || []) 넣('화면', x.label, (더화면.find((y) => y[0] === x.to) || [])[2] || '', x.to, x.ic)
  for (const [to, t, d, ic] of 더화면) 넣('화면', t, d, to, ic)
  const T = 자료.tools || {}
  for (const c of T.pages || []) for (const it of c.items || []) {
    const [제, ...뒤] = String(it.t || '').split(' — ')
    넣('도구', 제, 뒤.join(' — ') + (it.d ? ' · ' + it.d : ''), it.to, it.icon)
  }
  for (const x of T.tools || []) 넣('계산기', x.title, x.short, '/tools/' + x.slug, x.icon)
  const F = 자료.forms || {}
  for (const [slug, v] of Object.entries(F)) if (Array.isArray(v)) 넣('서식', v[0], `${v[3] || ''} · ${v[2] || ''}`, '/forms/' + slug, v[1])
  const C = 자료.change || {}
  for (const x of C.topics || []) 넣('설계변경', x.title, [x.sub, x.short].filter(Boolean).join(' · '), '/change/' + x.slug, x.icon)
  const G = 자료.guide || {}
  for (const x of G.topics || []) 넣('입찰 알아보기', x.title, [x.sub, x.short].filter(Boolean).join(' · '), '/guide/' + x.slug, x.icon)
  const K = 자료.cad || {}
  for (const x of K.cmds || []) 넣('캐드 명령', `${x.name} (${x.cmd})`, [x.what, x.when].filter(Boolean).join(' · '), '/cad/' + x.slug, '📏')
  return 목
}

/** 공고 번호 모양 → 그 번호(아니면 null) — 나라장터 R26BK01774496 · 20261024123-00 */
export function 공고번호(q) {
  const s = String(q || '').trim().toUpperCase().replace(/\s+/g, '')
  if (/^R\d{2}[A-Z]{2}\d{8}(-\d{1,3})?$/.test(s)) return s.replace(/-\d+$/, '')          // 주소는 차수 없이(/notice/R26BK01693749)
  if (/^20\d{9}(-\d{2,3})?$/.test(s)) return s
  return null
}

/**
 * 찾기 — 낱말마다 점수(제목 같음 100 · 제목 앞 60 · 제목 안 40 · 제목 초성 30 · 더 붙인 말 25 · 설명 10), 낱말 하나라도 못 찾으면 뺌
 * @returns [{ ...항목, 점 }] (점 큰 차례 · 같으면 갈래 차례 · 제목 짧은 차례)
 */
export function 찾기(목, q, 몇 = 30) {
  const 낱 = String(q || '').trim().split(/\s+/).map(고른말).filter(Boolean)
  if (!낱.length) return []
  const 줄 = []
  const 한낱 = (x, w) => {
    if (초성만(w)) return x.초.includes(w) ? (x.초.startsWith(w) ? 45 : 30) : 0
    let p = x.키 === w ? 100 : x.키.startsWith(w) ? 60 : x.키.includes(w) ? 40 : x.더.includes(w) ? 25 : x.설.includes(w) ? 10 : 0
    if (p >= 40 && x.더.includes(w)) p += 15                       // 제목에도 있고 더 붙인 말(그 화면의 뜻)에도 있음
    return p
  }
  for (const x of 목 || []) {
    let 점 = 0
    let 됨 = true
    for (const w of 낱) {
      let p = 한낱(x, w)
      for (const v of 같은뜻[w] || []) p = Math.max(p, Math.round(한낱(x, 고른말(v)) * 0.8))
      if (!p) { 됨 = false; break }
      점 += p
    }
    if (됨) 줄.push({ ...x, 점: 점 + (x.갈래 === '화면' ? 10 : x.갈래 === '도구' ? 8 : x.갈래 === '계산기' ? 5 : 0) })
  }
  줄.sort((a, b) => b.점 - a.점 || (갈래들[a.갈래] ?? 9) - (갈래들[b.갈래] ?? 9) || a.t.length - b.t.length)
  const 번 = 공고번호(q)
  const 결과 = 줄.slice(0, 몇)
  if (번) 결과.unshift({ 갈래: '공고', t: `공고 ${번} 열기`, d: '공고 번호로 바로 갑니다', to: '/notice/' + encodeURIComponent(번), ic: '📄', 점: 999 })
  return 결과
}
