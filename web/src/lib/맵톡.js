/* ══════════════════════════════════════════════════════════════
   맵톡.js — 사랑방 → 🗺 맵톡 (G147 · 2026-10-05) 셈만 모은 곳 (화면 없음 · tools/시험_맵톡.mjs 가 시험)

   소장님: 「커뮤니티 사스 참고 해서 사랑방 페이지를 리모델링 … 평범하지 않아야 해. 누구나 글을 쓰고 싶게」
           「틀이 정해진 사랑방 말고 … 신기하게 움직이기도 하면서, 글을 쓰면, 글도 멋스럽게 움직이면서」
           이름 «맵톡» · 「동영상은 제외하고 사진만」 · 「글을 쓸때, 탭이 보이는게 아니라 … 글이 모이고 나서, 그쪽으로 옮기는 것」
           「방은 저절로」 · 「지도 크게 하고, 글쓰기도 커야」 · 「지역 선택이 필요해? … 알아서 꽂혀야」
           「지금 지도처럼 해야지 시도면 너무 넓어」 · 「질문, 현장, 건의 등 어떤 것이든」 · 「바꾸기 … 필요 없어지잖아」
   ■ 주제 — 글을 쓸 때 고르지 않습니다. 글 내용(낱말)으로 짐작합니다. 같은 주제가 30개(G226 — 전엔 10개) 모이면 «방» 이 저절로 생깁니다. 소식은 늘 방.
     운영자 글 · 옛 말머리 «K-건설맵» = K-건설맵 소식. 낱말이 안 걸리는 옛 «후기·건의» 글 = 후기·건의, 새 글 = 이야기.
     🩹 G211 — 방을 골라 둔 채 쓰거나(✏️ 고치기에서 방을 바꾸면) 글에 k(방 열쇠)가 남고, 그 방으로 갑니다.
        운영자는 글쓰기 칸에서 방을 고릅니다(처음엔 소식 · 방을 보고 있으면 그 방). 운영자가 [후기·건의] 로 둔 글 = 후기·건의.
   ■ 자리 — 글을 올릴 때 접속 주소로 시·군을 짐작합니다(지금 이용자 지도와 같은 단위 · 묻는 창 없음).
     get.geojs.io(무료 · 열쇠 없음) 의 도시 이름 → 이용자 지도와 같은 맞추기(lib/이용자지도.js) → 안 되면 위도 · 경도로 가장 가까운 시·군.
     ⚠️ 통신사에 따라 서울로 잡히기도 합니다(2026-10-05 소장님 PC 실측 «서울 용산구»). 글에는 곳 번호(k)만 남기고 접속 주소는 어디에도 안 남깁니다.
   ══════════════════════════════════════════════════════════════ */
import { 지도이름표, 지도자리찾기 } from './이용자지도.js'

/* 🩹 G226 (2026-10-10) 소장님 「30개가 모인면 방이 생기는 걸로 하자.」 — 10 → 30 · 소식(운영자 글)은 1개만 있어도 늘 방(운영자가 소식 방을 누르고 써야 소식이 되므로) */
export const 방기준 = 30
export const 늘방 = new Set(['kcm'])
/* 맵톡을 연 때(2026-10-05 22:00 KST) — 그 전 «후기·건의» 글 중 낱말이 안 걸리는 것은 후기·건의, 그 뒤 글은 이야기 */
export const 맵톡시작 = 1791205200000
/* 옛 말머리(9/29 전 [질문] [현장] …) 가 남은 글 */
const 옛주제 = { 구인구직: 'job', 공동도급: 'bid', 현장: 'work' }

/** 주제 — 색은 밝기도 서로 달라야(색만으로 가르지 않게) · 이름은 짧게 */
export const 주제들 = {
  kcm: { 이름: 'K-건설맵 소식', 색: '#0c1830' },
  bid: { 이름: '입찰', 색: '#1d4ed8' },
  ins: { 이름: '4대보험 · 노무', 색: '#0f766e' },
  work: { 이름: '공사 · 서류', 색: '#b45309' },
  safe: { 이름: '안전', 색: '#b91c1c' },
  equip: { 이름: '장비 · 자재', 색: '#6d28d9' },
  job: { 이름: '구인 · 구직', 색: '#0e7490' },
  fb: { 이름: '후기 · 건의', 색: '#4d7c0f' },
  talk: { 이름: '이야기', 색: '#be185d' },
}
export const 주제차례 = ['kcm', 'bid', 'ins', 'work', 'safe', 'equip', 'job', 'fb', 'talk']

/* 첫 번째로 걸리는 것 하나. 위에서부터 — 구인 · 구직을 먼저(«노무» 낱말이 겹침) */
const 낱말 = [
  ['job', /구인|구직|사람\s*구|모집|채용|일자리|일하실|구합니다|구해요|구성원/],
  ['ins', /보험|연금|건강보험|고용보험|산재|퇴직공제|4대|노임|노무비|일당|임금|체불|인건비|원천세|근로/],
  ['bid', /입찰|투찰|낙찰|개찰|사정률|적격|공고|하한율|기초금액|예가|공동도급|분담|PQ/i],
  ['safe', /안전|사고|추락|TBM|위험성|보호구|산안비|중대재해|재해/i],
  ['equip', /장비|굴착기|굴삭기|포크레인|크레인|덤프|지게차|레미콘|자재|철근값|단가표/],
  ['work', /거푸집|철근|콘크리트|타설|공정|설계변경|기성|양생|측량|실정|내역서|수량|적산|준공|착공|서류|도면|시방|감리|감독/],
  ['fb', /후기|건의|불편|개선|요청|고쳐|안\s*돼|안돼|오류|버그|감사|고맙|좋네|좋아요|잘\s*쓰|덕분/],
]

/* 고마움 · 칭찬 — 이 말이 있고 물음이 아니면 후기·건의 (G211) */
const 후기말 = /감사|고맙|고마워|도움이?\s*(돼|되|됐|많이)|큰\s*도움|유용|잘\s*(쓰|사용|만드|만들|봤|보고)|최고|존경|훌륭|대단|멋지|좋은\s*(사이트|자료|프로그램|도구|서식|정보)/

/**
 * 글 하나의 주제
 * @param {{t?:string, b?:string, c?:string, uid?:string, nick?:string}} r  c = 옛 말머리(후기·건의 · K-건설맵)
 * @param {(uid:string)=>boolean} 운영자인가
 */
export function 주제짐작(r, 운영자인가 = () => false) {
  if (!r) return 'talk'
  /* 🩹 G211 (2026-10-09) 소장님 「왜 내가 쓰는 글은 모두 건설맵 소식으로 가지? 분명 후기 건의 클릭해도」
     전에는 운영자 번호 · 별명 «K-건설맵» 이면 말머리가 [후기·건의] 여도 무조건 소식으로 갔습니다.
     → ① 고른 방(k)이 있으면 그 방(소식은 운영자 글만 — 별명 K-건설맵 은 규칙이 운영자 번호만 허락)
       ② 말머리 [K-건설맵] 이면 소식 ③ 운영자가 [후기·건의] 로 둔 글은 후기·건의 ④ 나머지는 글 내용으로 짐작 */
  if (r.k && 주제들[r.k] && (r.k !== 'kcm' || 운영자인가(r.uid) || r.nick === 'K-건설맵')) return r.k
  if (r.c === 'K-건설맵') return 'kcm'
  if (운영자인가(r.uid) || r.nick === 'K-건설맵') return 'fb'
  const 글 = `${r.t || ''}\n${r.b || ''}`
  /* 🩹 G211 — 고마움 · 칭찬 글은 도구 이름(내역서 · 공고 · 노무비…)이 들어 있어도 후기·건의(물음이 아니면).
     전에는 «내역서 공부에 큰 도움» 이 공사 · 서류 방으로, «공고 찾다가 처음 써 봤는데 대단» 이 입찰 방으로 갔습니다. 구인은 먼저 */
  if (낱말[0][1].test(글)) return 낱말[0][0]
  if (후기말.test(글) && !물음인가(글)) return 'fb'
  for (const [k, re] of 낱말) if (re.test(글)) return k
  if (r.옛 && 옛주제[r.옛]) return 옛주제[r.옛]
  return (r.at || 0) < 맵톡시작 ? 'fb' : 'talk'
}

/**
 * 🩹 G211 — 글쓰기 칸이 넣을 방(k). 방을 골라 둔 채 쓰면 그 방 · 아니면 '' (글 내용으로 짐작)
 * 소식(kcm)은 운영자만 — 이용자가 소식 방을 보며 쓰면 '' (내용으로)
 */
export function 넣을방(방고름, 나운영자 = false) {
  const k = String(방고름 || '')
  if (!주제들[k]) return ''
  if (k === 'kcm' && !나운영자) return ''
  return k
}
/**
 * 🩹 G226 (2026-10-10) 소장님 「올릴방이 필요가 없잖아. 그냥 쓰게 하면 그 방으로 가거나, 아님, 방이 만들어 지거나 … 방을 선택하는 것은 아래에도 있으니까」
 * 운영자 글의 방 — 아래 방 줄에서 방을 보고 있으면 그 방(소식 포함), 전체를 보고 있으면 이용자 글과 똑같이 «글 내용» 으로(소식은 안 됨)
 * @returns {string} 방 열쇠(늘 하나 — 운영자 글은 말머리가 [후기·건의] 라 k 없이 두면 모두 후기·건의로 가므로 정해서 넣음)
 */
export function 운영자글방(방, t = '', b = '') {
  if (방 && 주제들[방]) return 방
  return 주제짐작({ t, b, at: Date.now() })
}
/** 이 글이 고를 수 있는 방들 — 소식은 운영자만 */
export const 고를방들 = (나운영자 = false) => 주제차례.filter((k) => 나운영자 || k !== 'kcm')
/**
 * 🩹 G226 고를 수 있는 방 칩 — 아래 «방» 줄에 있는 방만(같은 차례 · 많은 차례) · 지금 고른 방(글의 방)은 늘 · 소식은 운영자만(운영자에겐 늘)
 * @param {boolean} 운영자 @param {string[]|null} 있는 아래 방 줄의 방 열쇠(null 이면 예전처럼 다) @param {string} 지금
 */
export function 고칠방들(운영자, 있는, 지금 = '') {
  const 다 = 고를방들(운영자)
  if (!있는) return 다
  const 둘 = [...있는.filter((k) => 다.includes(k))]
  if (운영자 && !둘.includes('kcm')) 둘.unshift('kcm')
  if (지금 && 다.includes(지금) && !둘.includes(지금)) 둘.push(지금)
  return 둘
}


/**
 * 방 · 모이는 중 — 주제마다 글 수. 30개(방기준) 이상이면 방, 아니면 모이는 중(많은 차례) · 소식(늘방)은 1개라도 방
 * @param {Array<{주제:string}>} 글들
 */
export function 방나누기(글들, 기준 = 방기준) {
  const 셈 = {}
  for (const r of 글들 || []) { const k = r && r.주제; if (k) 셈[k] = (셈[k] || 0) + 1 }
  const 방 = [], 모임 = []
  for (const k of 주제차례) {
    const n = 셈[k] || 0
    if (!n) continue
    ;(n >= 기준 || 늘방.has(k) ? 방 : 모임).push({ k, n, 이름: 주제들[k].이름, 색: 주제들[k].색, 남음: Math.max(0, 기준 - n) })
  }
  방.sort((a, b) => b.n - a.n)
  모임.sort((a, b) => b.n - a.n)
  return { 방, 모임, 셈 }
}

/**
 * 한 칸에 쓴 글 → 제목(t) · 본문(b)  — 규칙: t 2~80자 · b 2000자까지
 * 첫 줄(또는 첫 문장)이 제목, 나머지가 본문. 제목 앞에 말머리 «[후기·건의] » 가 붙어 80자 안이어야 하므로 제목은 70자까지 —
 * 넘으면 69자에서 자르고(…) 나머지는 본문으로.
 */
export function 글나누기(글) {
  const s = String(글 || '').replace(/\r/g, '').trim()
  if (!s) return { t: '', b: '' }
  const 줄 = s.indexOf('\n')
  let 머리 = 줄 >= 0 ? s.slice(0, 줄) : s
  const 끝 = 머리.search(/[.?!…](\s|$)/)
  if (끝 >= 0 && 끝 + 1 < 머리.length) 머리 = 머리.slice(0, 끝 + 1)
  머리 = 머리.trim()
  let t = 머리, 남 = s.slice(s.indexOf(머리) + 머리.length)
  if (t.length > 70) { 남 = t.slice(69) + 남; t = t.slice(0, 69).trimEnd() + '…' }
  return { t, b: 남.replace(/^\s+/, '').slice(0, 2000) }
}

/* ── 자리 ─────────────────────────────────────────────── */
/* 위도 · 경도 → 지도 좌표(viewBox 603×570). 시 · 군청 11곳으로 맞춘 1차식(어긋남 7 단위 안) */
export function 경위도자리(위도, 경도) {
  const la = Number(위도), lo = Number(경도)
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null
  return { x: 79.72233 * lo + 0.324989 * la - 9934.168, y: -2.192915 * lo - 99.35250 * la + 4126.373 }
}
/** 가장 가까운 곳 — 바다 한가운데 · 나라 밖이면(30 단위 넘게 떨어짐) 없음 */
export function 가까운곳(곳, x, y, 한계 = 30) {
  let 최 = null, 거 = Infinity
  for (const p of 곳 || []) { const d = Math.hypot(p.x - x, p.y - y); if (d < 거) { 거 = d; 최 = p } }
  return 거 <= 한계 ? 최 : null
}
/* geojs 가 도시를 모를 때 내주는 «나라 한가운데» 자리 — 이것이면 짐작하지 않습니다 */
const 나라기본 = [[37.5112, 126.9741], [37.0, 127.5], [36.5, 127.75], [37.5, 127.0]]

/**
 * geojs 응답 → 곳 번호(k) · 이름. 못 정하면 null
 * @param {{city?:string, region?:string, country_code?:string, latitude?:string|number, longitude?:string|number}} j
 * @param {{곳:any[], 별:object}} 바탕  data/한국지도.json
 */
export function 자리고르기(j, 바탕) {
  if (!j || !바탕 || String(j.country_code || '').toUpperCase() !== 'KR') return null
  const 표 = 지도이름표(바탕.곳, 바탕.별)
  const 이름 = 지도자리찾기(표, j.city)
  if (이름) return { k: 이름.k, n: 이름.n, 어떻게: '이름' }
  const la = Number(j.latitude), lo = Number(j.longitude)
  if (나라기본.some(([a, b]) => Math.abs(a - la) < 0.002 && Math.abs(b - lo) < 0.002)) return null
  const xy = 경위도자리(la, lo)
  const p = xy && 가까운곳(바탕.곳, xy.x, xy.y)
  return p ? { k: p.k, n: p.n, 어떻게: '경위도' } : null
}

/** 접속 주소로 시·군 짐작(브라우저) — 4초 안에 못 받으면 null. 글 올리기를 막지 않습니다 */
export async function 자리짐작(바탕, 받기 = typeof fetch === 'function' ? fetch : null) {
  if (!받기 || !바탕) return null
  try {
    const c = typeof AbortController === 'function' ? new AbortController() : null
    const t = c ? setTimeout(() => c.abort(), 4000) : null
    const r = await 받기('https://get.geojs.io/v1/ip/geo.json', c ? { signal: c.signal } : undefined)
    if (t) clearTimeout(t)
    if (!r || !r.ok) return null
    return 자리고르기(await r.json(), 바탕)
  } catch (e) { return null }
}

/** 곳 번호 → 곳 (없으면 null) */
export function 곳찾기(바탕, k) {
  if (!바탕 || !k) return null
  for (const p of 바탕.곳 || []) if (p.k === k) return p
  return null
}
/** 화면에 쓰는 짧은 이름 — 서울특별시 → 서울, 고성군 그대로 */
export const 짧은이름 = (n) => String(n || '').replace(/(특별자치시|특별자치도|특별시|광역시)$/, '')

/* ── 카드 크기 — 공감 · 답글 많은 글 크게, 사진 글은 세로로 길게 ── */
export function 카드크기(r, 점수순위) {
  if (r && r.p) return 'tall'
  if (점수순위 !== undefined && 점수순위 < 2) return 'big'
  return ''
}

/** 물음 글인가 — 카드에 «답하기» */
export const 물음인가 = (t) => /\?|？|까요|나요|인가요|있나요|되나요|맞나요|아시는|궁금/.test(String(t || ''))

/* ── 💬 G161 (2026-10-06) 짧은 인사 · 응원 · 수다 = «한마디» — 소장님 「배치가 너무 단조로워」 → 고르심 ①②④
   카드 대신 맨 위 «💬 고마워요 · 한마디» 띠에 말풍선으로 모읍니다(글은 그대로 · 누르면 똑같이 열림).
   ■ 이야기 · 후기·건의 주제만 · 제목+본문 45자 이하 · 사진 · 파일 · 물음 · 불편/오류 글은 카드 그대로
   ■ 인사 낱말(감사 · 고맙 · 잘 만들 · 수고 · 반갑 · 출근 · 요일 · ㅎㅎ …)이 하나는 있어야 — 짧다고 다 모으지 않습니다 */
export const 한마디길이 = 45
const 한마디낱말 = /감사|고맙|고마워|잘\s*만들|잘\s*쓰|잘\s*보|잘\s*봤|수고|화이팅|파이팅|힘내|응원|반갑|방가|안녕|좋은\s*(하루|아침|저녁|밤|주말)|퇴근|출근|주말|월요일|화요일|수요일|목요일|금요일|토요일|일요일|홀리데이|연휴|휴가|무사히|좋네|좋아요|최고|대박|멋져|멋지|ㅎㅎ|ㅋㅋ|ㅠㅠ|ㅜㅜ|\^\^|~~/
const 한마디아님 = /안\s*돼|안\s*되|오류|버그|불편|고쳐|요청|건의|문의|신고|에러|느려/
export function 한마디인가(r) {
  if (!r || r.p || r.f || r.구인구직) return false
  if (r.주제 && r.주제 !== 'talk' && r.주제 !== 'fb') return false
  const 글 = `${r.t || ''} ${r.b || ''}`.replace(/\s+/g, ' ').trim()
  if (!글 || 글.length > 한마디길이) return false
  if (물음인가(글) || 한마디아님.test(글)) return false
  return 한마디낱말.test(글)
}

/* ── 사진 — 긴 변 1600px · JPEG 0.82 로 줄여 올립니다(요금 · 폰 데이터) ── */
export const 사진최대 = 1600
export const 사진크기한도 = 3 * 1024 * 1024
export function 줄인크기(w, h, 최대 = 사진최대) {
  if (!(w > 0 && h > 0)) return { w: 0, h: 0 }
  const s = Math.min(1, 최대 / Math.max(w, h))
  return { w: Math.round(w * s), h: Math.round(h * s) }
}
export async function 사진줄이기(파일) {
  const bmp = await createImageBitmap(파일)
  const { w, h } = 줄인크기(bmp.width, bmp.height)
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  cv.getContext('2d').drawImage(bmp, 0, 0, w, h)
  if (bmp.close) bmp.close()
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('사진을 줄이지 못했습니다'))), 'image/jpeg', 0.82))
}

/* ── ↩ 누구에게 답글 (G148 · 2026-10-05) ──────────────────────────────────────
   소장님: 「여러사람인데, 누구에게 댓글을 쓰는 건지 알게 해줘. 글을 쓴 사람 박스 아래 답글쓰기가 있으면 …」
   ■ 답글(qna_a/{글}/{답}) 에 to = 받는 답글 번호(없으면 원글에게). 규칙이 «그 글에 있는 답글 번호» 만 받습니다.
   ■ 화면은 한 단계만 들여 씁니다(폰이 좁음) — 답글의 답글도 맨 위 줄기 아래에 붙고, «↳ ○○ 님에게» 딱지로 누구에게인지 보입니다.
   ■ 받은수 = 상자마다 «↩ 답글쓰기 · 3» (지운 답글은 안 셈) */
export function 답나무(답들) {
  const 모두 = {}
  for (const a of 답들 || []) if (a && a.id) 모두[a.id] = a
  const 산 = Object.values(모두).filter((a) => !a.deleted)
  const 받은수 = {}
  let 원글받은수 = 0
  const 받는곳 = (a) => (a.to && 모두[a.to] && a.to !== a.id ? a.to : null)
  for (const a of 산) {
    const k = 받는곳(a)
    if (k) 받은수[k] = (받은수[k] || 0) + 1
    else 원글받은수++
  }
  /* 맨 위 줄기 찾기 — to 를 따라 올라갑니다(돌고 도는 사슬은 20번에서 끊음). 지운 줄기면 그 아래 답은 «살아 있는 맨 위» 에 붙습니다 */
  const 줄기찾기 = (a) => {
    let x = a, n = 0, 살아있는 = a
    while (받는곳(x) && n < 20) { x = 모두[받는곳(x)]; n++; if (!x.deleted) 살아있는 = x }
    return 받는곳(x) ? 살아있는 : (x.deleted ? 살아있는 : x)
  }
  const 차례 = (p, q) => (p.at || 0) - (q.at || 0) || String(p.id).localeCompare(String(q.id))
  const 줄기들 = {}
  const 가지들 = {}
  for (const a of 산) {
    const top = 줄기찾기(a)
    if (top.id === a.id) 줄기들[a.id] = a
    else (가지들[top.id] = 가지들[top.id] || []).push(a)
  }
  const 줄기 = Object.values(줄기들).sort(차례).map((a) => ({ a, 가지: (가지들[a.id] || []).sort(차례) }))
  return { 줄기, 받은수, 원글받은수 }
}

/** 첫 줄(인용) — «↳ ○○ 님에게» 아래 회색 한 줄 */
export const 첫줄 = (s, n = 40) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}

/* ── 📊 맵톡 지금까지(누구나 봄 · G148) — 소장님 「누적 카운트가 보이게 해줘」 → 고르심 «맵톡 화면에 전체 누적»
   실제 자료로 셉니다(옛 사랑방 글 포함): 글 = 보이는 글 · 답글 = 지우지 않은 답글 · 공감 = 글 👍 + 답글 👍 · 사진 = 사진 붙은 글 */
export function 누적셈(글들, 답들, 좋아요, 답좋아요) {
  const 보이는 = (글들 || []).filter((r) => r && !r.deleted)
  const ids = new Set(보이는.map((r) => r.id))
  let 답글 = 0, 공감 = 0
  for (const [q, m] of Object.entries(답들 || {})) {
    if (!ids.has(q)) continue
    for (const a of Object.values(m || {})) if (a && !a.deleted) 답글++
  }
  for (const [q, m] of Object.entries(좋아요 || {})) if (ids.has(q)) 공감 += Object.keys(m || {}).length
  for (const [q, m] of Object.entries(답좋아요 || {})) {
    if (!ids.has(q)) continue
    for (const v of Object.values(m || {})) 공감 += Object.keys(v || {}).length
  }
  return { 글: 보이는.length, 답글, 공감, 사진: 보이는.filter((r) => r.p).length }
}

/* ── 📍 지역 고르기 (G150 · 2026-10-05) ───────────────────────────────────────
   소장님: 「지역을 선택하게 해야 할 것 같아. 내가 해보니까 서울로 가」 → 고르심 «바꾸기 줄 + 기억»
   ■ 글쓰기 칸에 «📍 서울에 꽂혀요(짐작) · 바꾸기» — 처음엔 접속 주소로 짐작, 누르면 시·도 → 시·군.
   ■ 한 번 고르면 그 기기(브라우저)는 다음부터 그곳이 기본(localStorage 'kcm.mt.곳') — 짐작하지 않음. */
export const 시도차례 = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
export function 시도별(바탕) {
  const m = {}
  for (const p of (바탕 && 바탕.곳) || []) (m[p.d] = m[p.d] || []).push(p)
  for (const d of Object.keys(m)) m[d].sort((a, b) => String(a.n).localeCompare(String(b.n), 'ko'))
  return m
}
export const 곳기억열쇠 = 'kcm.mt.곳'
export function 곳기억읽기(바탕, 저장 = typeof localStorage !== 'undefined' ? localStorage : null) {
  try { const k = 저장 && 저장.getItem(곳기억열쇠); return k ? 곳찾기(바탕, k) : null } catch (e) { return null }
}
export function 곳기억하기(k, 저장 = typeof localStorage !== 'undefined' ? localStorage : null) {
  try { if (저장) { if (k) 저장.setItem(곳기억열쇠, String(k)); else 저장.removeItem(곳기억열쇠) } return true } catch (e) { return false }
}
