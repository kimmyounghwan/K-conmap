/* ══════════════════════════════════════════════════════════════
   마이컨맵.js — 🪪 마이컨맵 (G188 — 소장님 「건설 명함 페이지 — 이건 삭제, 마이컨맵으로 통일」 · 2026-10-07)

   소장님: 「마이컨맵을 만들게 하면 어때? 이용자마다 페이지 … 애드센스 이득이고 페이지마다 검색걸리게」
           「검색에 걸리게 해줘. 그리고, 만들기 단추를 주고, 만들기를 클릭하면, 자기가 원하는 것을 꾸미게 …
             다른 사이트 참고해서, 상큼하게」 → 「우선 만들어 줘. 컨맵에 띄우지는 말고」
   참고: 링크트리(테마 + 블록 쌓기 + 옆에 폰 미리보기) · 당근 비즈프로필 · 숨고 고수 프로필 · 노션(블록 옮기기)

   ■ 한 페이지 두 얼굴
       공개 면 /@{주소}  — 누구나 봄 · «검색 등록» 칸을 다 채우면 검색에 냄(mypages.py 가 굽고 사이트맵에 넣음)
       주인 면           — 이 브라우저가 주인일 때만 위에 뜸(자주 쓴 도구 · 서식, 하던 작업, 내 공고) · 서버에 안 감
   ■ 주인 확인 = 회원가입 없이 «주소 + 비밀번호» (장부 · 이어쓰기와 같은 문)
       mp_pins/{주소}        비밀번호 해시 — 아무도 못 읽음 · 한 번만 씀(주소 선점)
       mp_keys/{주소}/{uid}  이 브라우저가 맞힌 해시 — 규칙이 pins 와 견줌
       mp_pub/{주소}         공개 문서(누구나 읽음 · 주인만 씀 · 칸마다 길이 제한 — web/database.rules.json)
       mp_flag/{주소}/{uid}  🚩 신고(한 사람 한 번) — 3건이면 화면 · 굽기에서 숨김
   ■ 검색 등록 조건(아래 검색칸) — mypages.py 의 같은 이름 함수와 «글자까지 같은 규칙» 입니다. 바꿀 때 둘 다.
       ① 한 줄 소개 ② 소개 글 100자 이상 ③ 채운 블록 3개 이상  (빈 페이지를 대량으로 검색에 내면
       구글 스팸 정책 «scaled content» · 애드센스 «가치 낮은 콘텐츠» 에 걸립니다 — 기록 2026-10-07 13:46)
   ■ 📞 전화번호는 검색엔진이 읽는 글(구운 HTML)에 넣지 않습니다 — 화면에서 «누르면» 보입니다(광고 업자 긁기 막기).
   시험: node tools/시험_마이컨맵.mjs
   ══════════════════════════════════════════════════════════════ */
import { 비번해시 } from './tuipbi.js'

export const 판 = 1

/* 🎨 테마 — 밝은 화면 · 어두운 화면 둘 다 읽히는 색(styles.css .mc-th-*) */
export const 테마들 = [
  { k: 'mint', 이름: '민트', a: '#0f9f8f' },
  { k: 'sky', 이름: '하늘', a: '#2f7de1' },
  { k: 'lemon', 이름: '레몬', a: '#c99700' },
  { k: 'apricot', 이름: '살구', a: '#ea6a4b' },
  { k: 'lavender', 이름: '라벤더', a: '#7c5ce6' },
  { k: 'ink', 이름: '먹색', a: '#334155' },
]
export const 테마of = (k) => 테마들.find((t) => t.k === k) || 테마들[0]

/* 🧱 블록 — ㉠ 첫 회차 여섯 가지(사진첩 · 실적 자동 · 소식은 다음 회차) */
export const 블록들 = {
  소개: { 아이콘: '📝', 이름: '소개' },
  면허: { 아이콘: '📜', 이름: '면허 · 자격' },
  지역: { 아이콘: '📍', 이름: '일하는 지역' },
  연락: { 아이콘: '📞', 이름: '연락하기' },
  구인: { 아이콘: '🤝', 이름: '구인 · 구직' },
  도구: { 아이콘: '🧰', 이름: '함께 쓰는 도구 · 서식' },
  /* 📊 G188 소장님 「모두 다 하자」 — 실적 자동(사업자번호 → K-건설맵 개찰 기록 · 확보 예가) · 📣 소식(짧은 글 10개) */
  실적: { 아이콘: '📊', 이름: 'K-건설맵 개찰 실적' },
  소식: { 아이콘: '📣', 이름: '소식' },
}
export const 블록차례 = ['소개', '면허', '지역', '연락', '실적', '소식', '구인', '도구']

/* 👤 나는 누구 — 고르면 그에 맞는 블록이 깔립니다 */
export const 종류들 = {
  업체: { 아이콘: '🏢', 이름: '건설업체', 설명: '종합 · 전문 건설업체', 블록: ['소개', '면허', '지역', '연락', '실적'], 보기: '예) 대유건설 — 철콘 · 토공 전문' },
  사람: { 아이콘: '👷', 이름: '현장 사람', 설명: '현장소장 · 기사 · 기능인', 블록: ['소개', '면허', '지역', '구인', '연락'], 보기: '예) 토목 현장소장 · 전남 동부권' },
  장비: { 아이콘: '🚜', 이름: '장비 · 자재', 설명: '장비 임대 · 자재 납품', 블록: ['소개', '지역', '연락'], 보기: '예) 굴삭기 06 · 03 임대 · 광양 순천' },
}

/* 📜 건설업 면허(2022 업역 개편 뒤 이름) + 전기 · 통신 · 소방 */
export const 면허목록 = [
  '토목', '건축', '토목건축', '산업·환경설비', '조경',
  '지반조성·포장', '실내건축', '금속창호·지붕건축물조립', '도장·습식·방수·석공', '조경식재·시설물', '철근·콘크리트',
  '구조물해체·비계', '상·하수도설비', '철도·궤도', '철강구조물', '수중·준설', '승강기·삭도', '기계가스설비', '가스난방',
  '전기', '정보통신', '소방시설',
]
export const 시도들 = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

/* ── 길이 제한(규칙 web/database.rules.json mp_pub 과 같은 숫자) ── */
export const 한도 = { 이름: 30, 한줄: 60, 소개: 1500, 소식: 300, 면허: 20, 자격: 10, 낱말: 30, 지역글: 80, 전화: 20, 톡: 120, 시간: 40, 구인: 500, 곳: 12, 주소글: 80, 블록: 12 }

const 글 = (v, n) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, n)
const 목록 = (v, n, 낱) => (Array.isArray(v) ? v : []).map((x) => 글(x, 낱)).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, n)

/** 전화 — 숫자 · 붙임표만(010-1234-5678) */
export function 전화정리(s) {
  const d = String(s || '').replace(/[^0-9]/g, '').slice(0, 12)
  if (!d) return ''
  if (/^02/.test(d)) return d.length > 9 ? `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}` : d.length > 5 ? `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}` : d
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 12) return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`   /* 0507 안심번호 */
  return d
}
export const 전화맞나 = (s) => /^0\d{1,3}-\d{3,4}-\d{4}$/.test(String(s || ''))
/** 카톡 — 오픈채팅(open.kakao.com) · 카카오톡 채널(pf.kakao.com) 주소만 */
export function 톡정리(s) {
  let u = String(s || '').trim()
  if (!u) return ''
  if (!/^https?:\/\//.test(u)) u = 'https://' + u
  u = u.replace(/^http:\/\//, 'https://')
  return /^https:\/\/(open|pf)\.kakao\.com\/[A-Za-z0-9_\-/]{2,100}$/.test(u) ? u.slice(0, 한도.톡) : ''
}

/** 블록 하나 정리 — 모르는 블록은 버림 */
export function 블록정리(b) {
  if (!b || !블록들[b.t]) return null
  switch (b.t) {
    case '소개': return { t: '소개', 글: 글(b.글, 한도.소개) }
    case '면허': return { t: '면허', 면허: 목록(b.면허, 한도.면허, 한도.낱말), 자격: 목록(b.자격, 한도.자격, 한도.낱말) }
    case '지역': return { t: '지역', 시도: 목록(b.시도, 17, 4).filter((x) => 시도들.includes(x)), 글: 글(b.글, 한도.지역글) }
    case '연락': {
      const 전화 = 전화정리(b.전화)
      return { t: '연락', 전화: 전화맞나(전화) ? 전화 : '', 문자: !!b.문자, 톡: 톡정리(b.톡), 시간: 글(b.시간, 한도.시간) }
    }
    case '구인': return { t: '구인', 갈래: ['구함', '찾음'].includes(b.갈래) ? b.갈래 : '', 글: 글(b.글, 한도.구인) }
    case '도구': return { t: '도구', 곳: 목록(b.곳, 한도.곳, 한도.주소글).filter((p) => /^\/[a-z0-9/_-]+$/.test(p)) }
    case '실적': { const d = String(b.사업자 || '').replace(/[^0-9]/g, ''); return { t: '실적', 사업자: d.length === 10 ? d : '' } }
    case '소식': return { t: '소식', 글들: (Array.isArray(b.글들) ? b.글들 : []).map((x) => ({ d: /^\d{4}-\d{2}-\d{2}$/.test(String(x && x.d)) ? x.d : '', 글: 글(x && x.글, 한도.소식) }))
      .filter((x) => x.d && x.글).slice(0, 10) }
    default: return null
  }
}

/** 문서 정리 — 저장하기 전에 늘 거칩니다(규칙이 막기 전에 화면이 먼저 맞춤) */
/* 🌐 공개 범위 — 소장님 「공개, 비공개 선택할 수 있게 해줘....마이컨맵」 (G188 · 2026-10-07)
   공개: 누구나 · 칸을 다 채우면 검색 / 링크: 주소 아는 사람만(검색 · 사이트맵 · 모아보기 빼고 · noindex)
   나만: 내용은 mp_priv(열쇠 맞는 기기만 읽음) · mp_pub 에는 «나만» 표만 남김(남이 열면 «비공개 페이지») */
export const 공개들 = [
  { k: '공개', 아이콘: '🌐', 이름: '공개', 설명: '누구나 봅니다 · 칸을 다 채우면 검색에도 나옵니다' },
  { k: '링크', 아이콘: '🔗', 이름: '주소 아는 사람만', 설명: '검색에는 안 나옵니다 · 명함 QR · 링크로 연 사람만' },
  { k: '나만', 아이콘: '🔒', 이름: '나만 보기', 설명: '남이 열면 «비공개 페이지» · 내용은 서버에서도 남이 못 읽습니다' },
]
export const 공개of = (k) => 공개들.find((x) => x.k === k) || 공개들[0]
/** 검색에 내는가 — 칸을 다 채웠고 «공개» 일 때만 */
export const 검색됨 = (d) => !!d && 공개of(d.공개).k === '공개' && 검색칸(d).열림

export function 정리(d) {
  const x = d || {}
  const 블록 = (Array.isArray(x.블록) ? x.블록 : []).map(블록정리).filter(Boolean).slice(0, 한도.블록)
  return {
    v: 판,
    종류: 종류들[x.종류] ? x.종류 : '업체',
    이름: 글(x.이름, 한도.이름),
    한줄: 글(x.한줄, 한도.한줄),
    테마: 테마of(x.테마).k,
    블록,
    공개: 공개of(x.공개).k,
    at: Number(x.at) || 0,
    upd: Number(x.upd) || 0,
  }
}

/** 블록이 «채워졌나» — 검색 등록 · 공개 화면에서 빈 블록을 안 그림 */
export function 채움(b) {
  if (!b) return false
  switch (b.t) {
    case '소개': return String(b.글 || '').trim().length >= 20
    case '면허': return (b.면허 || []).length + (b.자격 || []).length > 0
    case '지역': return (b.시도 || []).length > 0 || !!String(b.글 || '').trim()
    case '연락': return !!(b.전화 || b.톡)
    case '구인': return !!String(b.글 || '').trim()
    case '도구': return (b.곳 || []).length > 0
    case '실적': return String(b.사업자 || '').length === 10
    case '소식': return (b.글들 || []).length > 0
    default: return false
  }
}

/** 🔎 검색 등록 칸 — mypages.py 검색칸() 과 같은 규칙 */
export const 소개글자 = 100
export const 채운블록수 = 3
export function 검색칸(d) {
  const x = d || {}
  const 소개 = (x.블록 || []).filter((b) => b && b.t === '소개').map((b) => String(b.글 || '').trim()).join('')
  const 채운 = (x.블록 || []).filter(채움).length
  const 칸 = [
    { k: '한줄', 이름: '한 줄 소개', 됨: String(x.한줄 || '').trim().length >= 5, 지금: String(x.한줄 || '').trim().length, 목표: 5 },
    { k: '소개', 이름: `소개 글 ${소개글자}자 이상`, 됨: 소개.length >= 소개글자, 지금: 소개.length, 목표: 소개글자 },
    { k: '블록', 이름: `채운 칸 ${채운블록수}개 이상`, 됨: 채운 >= 채운블록수, 지금: 채운, 목표: 채운블록수 },
  ]
  return { 칸, 남은: 칸.filter((c) => !c.됨).length, 열림: 칸.every((c) => c.됨) && !!String(x.이름 || '').trim() }
}

/* ── 주소(@뒤) ── 한글 · 영문 소문자 · 숫자 · 붙임표 · 밑줄, 2~20자 */
const 막는주소 = ['admin', 'my', 'new', 'edit', 'kconmap', 'k-conmap', 'conmap', '건설맵', '케이건설맵', '마이컨맵', '운영자', '관리자', '공지', 'k건설맵', 'test', 'www', 'qna', 'tools', 'forms']
export function 주소정리(s) {
  return String(s || '').trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase().replace(/[^0-9a-z가-힣_-]/g, '').slice(0, 20)
}
export function 주소검사(a) {
  const x = String(a || '')
  if (x.length < 2) return '주소는 2자 이상으로 정해 주십시오'
  if (x.length > 20) return '주소는 20자까지입니다'
  if (!/^[0-9a-z가-힣_-]+$/.test(x)) return '주소는 한글 · 영문 소문자 · 숫자 · 붙임표(-)만 쓸 수 있습니다'
  if (/^[-_]|[-_]$/.test(x)) return '주소는 붙임표로 시작하거나 끝날 수 없습니다'
  if (/[ㄱ-ㅎㅏ-ㅣ]/.test(x)) return '덜 쓴 글자(ㄱ · ㅏ 같은)가 있습니다'
  if (막는주소.includes(x)) return '쓸 수 없는 주소입니다 — 다른 주소로 정해 주십시오'
  return ''
}
export const 페이지주소 = (a) => `/@${a}`
export const 공개주소 = (a) => `https://k-conmap.com/@${encodeURIComponent(a)}`

/** 새 문서 — 고른 종류의 블록을 빈 채로 깜 */
export function 새문서(종류, 이름, 한줄, 테마) {
  const k = 종류들[종류] ? 종류 : '업체'
  return 정리({
    종류: k, 이름, 한줄, 테마,
    블록: 종류들[k].블록.map((t) => ({ t, 글: '', 면허: [], 자격: [], 시도: [], 곳: [], 사업자: '', 글들: [] })),
  })
}

/* ── 이 브라우저가 주인인 페이지 ── */
const 내열쇠 = 'kcm.my.주소들'
export function 내주소들() { try { const v = JSON.parse(localStorage.getItem(내열쇠)); return Array.isArray(v) ? v.filter((x) => x && x.a) : [] } catch (e) { return [] } }
export function 내주소기억(a, n) {
  const v = [{ a, n: 글(n, 한도.이름) }, ...내주소들().filter((x) => x.a !== a)].slice(0, 10)
  try { localStorage.setItem(내열쇠, JSON.stringify(v)) } catch (e) { /* 개인 창 */ }
  return v
}
export function 내주소잊기(a) {
  const v = 내주소들().filter((x) => x.a !== a)
  try { localStorage.setItem(내열쇠, JSON.stringify(v)) } catch (e) { /* 개인 창 */ }
  return v
}
export const 내것인가 = (a) => 내주소들().some((x) => x.a === a)

/* ── 서버(RTDB) — 이 화면을 열 때만 파이어베이스를 받습니다 ── */
let _fb = null
async function fb() {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}
export const 막힘 = (e) => /permission|PERMISSION/.test(String((e && (e.code || e.message)) || e))
const 해시 = (a, pw) => 비번해시('mp:' + a, pw)

/** 공개 문서 읽기 — 없으면 null */
export async function 불러오기(a) {
  const f = await fb()
  const s = await f.get(f.ref(f.db, `mp_pub/${a}`))
  if (!s.exists()) return null
  const v = s.val() || {}
  if (v.나만 === true) {                                  /* 🔒 나만 보기 — 열쇠가 있는 기기만 속을 읽음 */
    try {
      await f.ensureAnon()
      const p = await f.get(f.ref(f.db, `mp_priv/${a}`))
      if (p.exists()) return 정리(p.val())
    } catch (e) { /* 열쇠 없음 → 비공개 표 */ }
    return { 나만: true }
  }
  return 정리(v)
}
/** 문서를 공개 범위에 맞는 자리에 씀 — 나만: priv 에 속 · pub 에 표 / 공개 · 링크: pub 에 속 · priv 비움 */
async function 자리에쓰기(f, a, d) {
  if (d.공개 === '나만') {
    await f.set(f.ref(f.db, `mp_priv/${a}`), d)
    await f.set(f.ref(f.db, `mp_pub/${a}`), { v: 판, 나만: true, at: d.at, upd: d.upd })
  } else {
    await f.set(f.ref(f.db, `mp_pub/${a}`), d)
    try { await f.remove(f.ref(f.db, `mp_priv/${a}`)) } catch (e) { /* 없던 것 */ }
  }
}
/** 🚩 신고 수 */
export async function 신고수(a) {
  try {
    const f = await fb()
    const s = await f.get(f.ref(f.db, `mp_flag/${a}`))
    return s.exists() ? Object.keys(s.val() || {}).length : 0
  } catch (e) { return 0 }
}
export async function 신고(a) {
  const f = await fb()
  const u = await f.ensureAnon()
  await f.set(f.ref(f.db, `mp_flag/${a}/${u.uid}`), true)
}

/** 만들기 — 주소 선점(pins) → 이 브라우저 열쇠(keys) → 공개 문서(pub). 주소가 이미 있으면 '있음' */
export async function 만들기(a, pw, 문서) {
  const f = await fb()
  const u = await f.ensureAnon()
  const h = await 해시(a, pw)
  try { await f.set(f.ref(f.db, `mp_pins/${a}`), h) } catch (e) { if (막힘(e)) throw Object.assign(new Error('이미 누가 쓰는 주소입니다'), { code: '있음' }); throw e }
  await f.set(f.ref(f.db, `mp_keys/${a}/${u.uid}`), h)
  const 지금 = Date.now()
  const d = { ...정리(문서), at: 지금, upd: 지금 }
  await 자리에쓰기(f, a, d)
  내주소기억(a, d.이름)
  return d
}
/** 다른 기기에서 내 페이지 열기 — 비밀번호가 틀리면 규칙이 막음 → '틀림' */
export async function 열기(a, pw) {
  const f = await fb()
  const u = await f.ensureAnon()
  const h = await 해시(a, pw)
  try { await f.set(f.ref(f.db, `mp_keys/${a}/${u.uid}`), h) } catch (e) { if (막힘(e)) throw Object.assign(new Error('주소나 비밀번호가 다릅니다'), { code: '틀림' }); throw e }
  const d = await 불러오기(a)
  if (!d || d.나만 === true && !d.이름) throw Object.assign(new Error('그 주소의 페이지가 없습니다'), { code: '없음' })
  내주소기억(a, d.이름)
  return d
}
/** 저장 — 열쇠가 없거나 다르면 규칙이 막음 → '열쇠' (화면이 비밀번호를 다시 물음) */
export async function 저장(a, 문서) {
  const f = await fb()
  await f.ensureAnon()
  const d = { ...정리(문서), upd: Date.now() }
  if (!d.at) d.at = d.upd
  try { await 자리에쓰기(f, a, d) } catch (e) { if (막힘(e)) throw Object.assign(new Error('이 기기에서 고칠 열쇠가 없습니다'), { code: '열쇠' }); throw e }
  내주소기억(a, d.이름)
  return d
}

/* ── 주인 면: 하던 작업 — 이 브라우저에 남은 도구 작업(읽기만) ──
   [열쇠, 이름, 아이콘, 주소, 요약(값) → 글] — 요약을 못 하면 «저장된 작업» */
const 개수 = (v) => (Array.isArray(v) ? v.length : Array.isArray(v && v.L) ? v.L.filter((x) => x && !x.del).length : 0)
export const 작업목록 = [
  ['kcm_nomubi_sites', '노무비 계산기', '👷', '/tools/nomubi', (v) => (개수(v) ? `현장 ${개수(v)}곳` : '')],
  ['kcm_nomubi1', '노무비 계산기', '👷', '/tools/nomubi', () => ''],
  ['kcm-tuipbi-sites', '현장 투입비 · 공사일보', '🏗', '/tools/tuipbi', (v) => (개수(v) ? `현장 ${개수(v)}곳` : '')],
  ['kcm-eq-books', '장비 임대료 · 수금 장부', '🚜', '/tools/equip', (v) => (개수(v) ? `장부 ${개수(v)}개` : '')],
  ['kcm-rk-books', '위험성평가', '⚠️', '/tools/risk', (v) => (개수(v) ? `장부 ${개수(v)}개` : '')],
  ['kcm_sonik1', '공사 손익 장부', '📒', '/tools/sonik', () => ''],
  ['kcm_ilbo1', '작업일보', '🗒', '/tools/ilbo', () => ''],
  ['kcm_gyeonjeok1', '견적서', '🧾', '/tools/gyeonjeok', () => ''],
  ['kcm_jimyeong1', '공사지명원', '📇', '/tools/jimyeong', () => ''],
  ['kcm_sanan1', '산업안전보건관리비', '🦺', '/tools/sanan', () => ''],
  ['kcm_bjs1', '보험료 정산 청구서', '🧮', '/tools/boheom-jeongsan', () => ''],
  ['kcm_ilyong1', '일용직 4대보험', '🛡', '/tools/ilyong-boheom', () => ''],
  ['kcm.wonclick.v1', '공사서류 원클릭', '⚡', '/tools/wonclick', () => ''],
  ['kcm.calc.schedule', '예정공정표 · S커브', '📈', '/tools/schedule', () => ''],
  ['kcm.golgo.v1', '골조 수량산출', '🏗', '/jeoksan/golgo', () => ''],
  ['kcm.magam.v1', '마감 수량산출', '🧱', '/jeoksan/magam', () => ''],
  ['kcm.run.v1', '수량산출서 만들기', '🧮', '/jeoksan/run', () => ''],
]
const 비었나 = (s) => s == null || s === '' || s === '{}' || s === '[]' || s === 'null'
export function 하던작업() {
  const 본 = new Set()
  const 나 = []
  for (const [k, 이름, 아이콘, 곳, 요약] of 작업목록) {
    if (본.has(곳)) continue
    let s = null
    try { s = localStorage.getItem(k) } catch (e) { s = null }
    if (비었나(s)) continue
    let v = null
    try { v = JSON.parse(s) } catch (e) { v = null }
    let 줄 = ''
    try { 줄 = 요약(v) || '' } catch (e) { 줄 = '' }
    본.add(곳)
    나.push({ 이름, 아이콘, 곳, 줄: 줄 || '저장된 작업이 있습니다' })
  }
  return 나
}
