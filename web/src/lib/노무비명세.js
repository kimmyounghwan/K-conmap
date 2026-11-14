/**
 * 🧾 일용노무비 지급명세서 — 한 장 표 꼴 (G681 · 2026-11-14)
 *
 * 소장님: 블로그 «2026년 노무비지급명세서 엑셀» 캡처 → 「도구로 만들자」 → «건설맵 계산기 꼴은 현장에서 안 씀»
 *   → 「따로 만들어」 · 「도구로 해서 캡쳐랑 똑같이 만들어」
 *   · 「4대보험은 이미 만들어 놨으니 연결만 하면 되잖아」 → 공제는 lib/nomubi.js 달셈 그대로
 *     (= lib/gongje.js 공제셈 + lib/ilyong4.js 가입 판단 · 나이) — 같은 사람 · 같은 출역이면 노무비 계산기(/tools/nomubi)와 1원도 안 다름
 *   · 「출력할때 다 나와야 해 주민 폰 등」 → 종이에 주민번호 · 전화 · 주소 · 은행 · 계좌 모두 그대로
 *   · 「코드만 만들어. 이용자 편하게」 → 비밀번호를 묻지 않음: 주민번호 · 계좌는 «이 기기 열쇠»(꺼낼 수 없는 AES-GCM 열쇠 · IndexedDB)로
 *     저절로 잠가 저장(개인정보 보호법 제24조의2 ② 암호화 보관) — 이용자는 아무것도 안 함 · 서버로 안 보냄
 *
 * 저장 모양(v1) — lib/nomubi.js 와 같은 짜임(달셈 · 명단빼기 · 칸바꿈을 그대로 쓰려고) + 사람마다
 *   rf(주민번호 앞 7자리 «760906-1» — 나이 셈 · 열쇠를 잃었을 때 가린 글) · t(전화) · a(주소) · k(은행) · x(잠근 글: { r 주민번호, c 계좌 })
 *   { v: 1, co, site, ym, P: [{ id, n, j, w, nx, r, rf, t, a, k, x }], A: { 'YYYY-MM': { id: { d: { '01': 1 }, ap, ex } } } }
 *   ⚠️ 주민번호 전체 · 계좌는 잠근 글(x)로만 저장 — 맨 글은 화면 메모리에만
 */
import { 달셈, 칸바꿈, 달날수, 요일, 달더하기, 이번달 } from './nomubi.js'

export const 열쇠 = 'kcm_nomubi_ms1'
export const 한쪽사람 = 12                    // 종이 한 장에 사람 12명(캡처처럼 빈 줄까지 채움)
const 두자 = (n) => String(n).padStart(2, '0')

export function 빈것(ym = 이번달()) {
  return { v: 1, co: '', site: '', ym, P: [], A: {} }
}

/** 이 기기 저장 읽기 — 깨진 값 · 없음은 null */
export function 읽기() {
  try {
    const v = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (!v || !Array.isArray(v.P) || !v.A || typeof v.A !== 'object') return null
    return { ...빈것(), ...v, ym: /^\d{4}-\d{2}$/.test(v.ym || '') ? v.ym : 이번달() }
  } catch (e) { return null }
}
/** 이 기기 저장 — 막히면(사생활 보호 창 · 가득 참) false */
export function 쓰기(st) {
  try { localStorage.setItem(열쇠, JSON.stringify(st)); return true } catch (e) { return false }
}

/* ── 글 꼴 ─────────────────────────────────────────────── */
export const 숫자만 = (s) => String(s ?? '').replace(/[^\d]/g, '')
/** 주민번호 — 숫자 13자리까지 · 6자리 뒤에 «-» (치는 동안에도) */
export function 주민꼴(s) {
  const t = 숫자만(s).slice(0, 13)
  return t.length > 6 ? t.slice(0, 6) + '-' + t.slice(6) : t
}
/** 주민번호 앞 7자리 «760906-1» — 7자리가 안 되면 '' */
export function 주민앞(s) {
  const t = 숫자만(s)
  return t.length >= 7 ? t.slice(0, 6) + '-' + t[6] : ''
}
/** 생년월일 YYYYMMDD — 주민번호 앞 7자리(일곱째 자리로 1800 · 1900 · 2000년대) · 날짜가 아니면 '' */
export function 생일(rf) {
  const t = 숫자만(rf)
  if (t.length < 7) return ''
  const g = t[6]
  const 세기 = '1256'.includes(g) ? 1900 : '3478'.includes(g) ? 2000 : '90'.includes(g) ? 1800 : 0
  if (!세기) return ''
  const y = 세기 + Number(t.slice(0, 2)), m = Number(t.slice(2, 4)), d = Number(t.slice(4, 6))
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return ''
  return `${y}${두자(m)}${두자(d)}`
}
/** 전화 — 010-1234-5678 · 02-123-4567 꼴(치는 동안에도) */
export function 전화꼴(s) {
  const t = 숫자만(s).slice(0, 11)
  if (t.startsWith('02')) return t.length <= 2 ? t : t.length <= 5 ? `02-${t.slice(2)}` : t.length <= 9 ? `02-${t.slice(2, 5)}-${t.slice(5)}` : `02-${t.slice(2, 6)}-${t.slice(6, 10)}`
  if (t.length <= 3) return t
  if (t.length <= 7) return `${t.slice(0, 3)}-${t.slice(3)}`
  if (t.length <= 10) return `${t.slice(0, 3)}-${t.slice(3, 6)}-${t.slice(6)}`
  return `${t.slice(0, 3)}-${t.slice(3, 7)}-${t.slice(7)}`
}
/** 계좌 — 숫자와 «-» 만 */
export const 계좌꼴 = (s) => String(s ?? '').replace(/[^\d-]/g, '').slice(0, 24)
/** 돈 — 0 은 «-»(캡처처럼) */
export const 돈 = (n) => (Math.round(n || 0) ? Math.round(n).toLocaleString('ko-KR') : '-')
/** 공수 — 1 → «1.0» · 0.5 → «0.5» (캡처처럼 한 자리) · 0 은 빈칸 */
export const 공수꼴 = (g) => (g > 0 ? (Math.round(g * 10) / 10).toFixed(1) : '')
/** 날마다 합 — 정수면 «4» · 아니면 «4.5» · 0 은 «-» */
export const 합꼴 = (g) => (g > 0 ? String(Math.round(g * 10) / 10) : '-')

/* ── 셈 — 노무비 계산기와 같은 셈(달셈)에 생년월일만 주민번호 앞자리에서 넣음 ── */
export function 셈(st, ym = st.ym) {
  const P = (st.P || []).map((p) => ({ ...p, b: 생일(p.rf) || '' }))
  return 달셈({ ...st, P }, ym)
}

/** 종이 쪽 나누기 — 한쪽사람 명씩 · 사람이 없어도 한 쪽 */
export function 쪽나누기(줄, n = 한쪽사람) {
  const 쪽 = []
  for (let i = 0; i < 줄.length; i += n) 쪽.push(줄.slice(i, i + n))
  return 쪽.length ? 쪽 : [[]]
}

/** 날마다 공수 합(1일~31일 · 그 달 없는 날은 0) */
export function 날합(N) {
  const 합 = Array(31).fill(0)
  for (const r of N.줄) r.공수.forEach((g, i) => { if (g > 0) 합[i] += g })
  return 합.map((v) => Math.round(v * 100) / 100)
}

/** 기간 글 — «2026년 11월 01일» · 끝 «2026년 11월 30일» · 날수 */
export function 기간(ym) {
  const y = ym.slice(0, 4), m = ym.slice(5, 7), n = 달날수(ym)
  return { 처음: `${y}년 ${m}월 01일`, 끝: `${y}년 ${m}월 ${두자(n)}일`, 날수: n, 달: m }
}

/* ── 이 기기 열쇠 — 꺼낼 수 없는(extractable: false) AES-GCM 256 · IndexedDB 'kcm_nomubi_ms' ── */
const 디비 = 'kcm_nomubi_ms', 칸 = 'k', 이름 = 'v1'
function 디비열기() {
  return new Promise((ok, no) => {
    try {
      const q = indexedDB.open(디비, 1)
      q.onupgradeneeded = () => { try { q.result.createObjectStore(칸) } catch (e) { /* 이미 있음 */ } }
      q.onsuccess = () => ok(q.result)
      q.onerror = () => no(q.error || new Error('IndexedDB'))
      q.onblocked = () => no(new Error('IndexedDB 막힘'))
    } catch (e) { no(e) }
  })
}
const 일 = (db, 꼴, f) => new Promise((ok, no) => {
  try {
    const tx = db.transaction(칸, 꼴)
    const q = f(tx.objectStore(칸))
    tx.oncomplete = () => ok(q && q.result)
    tx.onerror = () => no(tx.error || new Error('IndexedDB'))
    tx.onabort = () => no(tx.error || new Error('IndexedDB'))
  } catch (e) { no(e) }
})
/** 이 기기 열쇠 — 없으면 만들어 둠 · 못 쓰는 곳(막힌 창)이면 null */
export async function 기기열쇠() {
  try {
    if (!globalThis.indexedDB || !globalThis.crypto || !crypto.subtle) return null
    const db = await 디비열기()
    try {
      const 있음 = await 일(db, 'readonly', (s) => s.get(이름))
      if (있음 && 있음.type === 'secret') return 있음
      const 새 = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
      await 일(db, 'readwrite', (s) => s.put(새, 이름))
      const 다시 = await 일(db, 'readonly', (s) => s.get(이름))   // 두 창이 같이 만들었으면 먼저 넣은 것 하나로
      return 다시 && 다시.type === 'secret' ? 다시 : 새
    } finally { try { db.close() } catch (e) { /* 이미 닫힘 */ } }
  } catch (e) { return null }
}

const 글로 = new TextEncoder(), 글에서 = new TextDecoder()
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s) }
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
/** 물건 → 잠근 글 'v1.iv.ct' */
export async function 잠그기(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, 글로.encode(JSON.stringify(obj)))
  return 'v1.' + b64(iv) + '.' + b64(new Uint8Array(ct))
}
/** 잠근 글 → 물건 · 열쇠가 다르면(다른 기기 · 지운 열쇠) null */
export async function 풀기(key, s) {
  try {
    const [v, iv, ct] = String(s || '').split('.')
    if (v !== 'v1' || !iv || !ct || !key) return null
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct))
    return JSON.parse(글에서.decode(pt))
  } catch (e) { return null }
}

/** 종이에 찍을 주민번호 — 연 값(전체) · 못 열면 앞 7자리 + ****** */
export const 주민찍기 = (p, 열린) => (열린 && 열린.r) || (p && p.rf ? p.rf + '******' : '')

export const 직종들 = ['보통인부', '특별인부', '형틀목공', '철근공', '콘크리트공', '비계공', '용접공', '미장공', '조적공', '방수공', '타일공',
  '도장공', '도배공', '내장공', '석공', '배관공', '전기공', '건축목공', '할석공', '착암공', '포장공', '조경공', '기계설비공', '신호수', '작업반장']
export const 은행들 = ['농협', '국민', '신한', '우리', '하나', '기업', 'SC제일', '새마을금고', '신협', '우체국', '수협', '카카오뱅크', '토스뱅크', '케이뱅크',
  '부산', '경남', '광주', '전북', '제주', 'iM뱅크', '산업']

/**
 * 처음 쓰는 분을 위한 예시 — 지어낸 회사 · 현장 · 사람(이름 · 주소 · 전화 · 계좌 모두 가상 · 주민번호 뒷자리는 *)
 * 지난달부터 일한 사람(국민연금 · 건강보험이 이 달에 붙음) · 이 달 처음 온 사람 · 만 65세 넘은 사람(연금 · 고용 저절로 ✕)이 섞임
 */
export function 예시(ym = 이번달()) {
  const 앞 = 달더하기(ym, -1)
  const P = [
    { id: 'm1', n: '김가람', j: '형틀목공', w: 260000, rf: '760906-1', t: '010-0000-1101', a: '가나시 다라동 (예시)', k: '농협', r: [[앞, null]] },
    { id: 'm2', n: '이나래', j: '철근공', w: 250000, rf: '820430-1', t: '010-0000-1102', a: '가나시 마바동 (예시)', k: '국민', r: [[앞, null]] },
    { id: 'm3', n: '박다온', j: '콘크리트공', w: 240000, rf: '881016-1', t: '010-0000-1103', a: '사아군 자차면 (예시)', k: '신한', r: [[ym, null]] },
    { id: 'm4', n: '최라온', j: '보통인부', w: 170000, rf: '590505-1', t: '010-0000-1104', a: '가나시 카타동 (예시)', k: '수협', r: [[ym, null]] },
    { id: 'm5', n: '정마루', j: '미장공', w: 250000, rf: '731005-2', t: '010-0000-1105', a: '사아군 파하읍 (예시)', k: '우체국', r: [[ym, null]] },
    { id: 'm6', n: '한바다', j: '타일공', w: 260000, rf: '900211-1', t: '010-0000-1106', a: '가나시 하늘동 (예시)', k: '하나', r: [[ym, null]] },
  ].map((p) => ({ ...p, nx: '' }))
  let st = { ...빈것(ym), co: '예시건설(주)', site: '가나지구 배수로 정비공사 (예시)', P }
  const 평일 = (m, i) => 요일(m, i) !== '일' && 요일(m, i) !== '토'
  /* 지난달 — 김가람 · 이나래만(이 달 국민연금 · 건강보험이 붙는 모습) */
  const n앞 = 달날수(앞)
  for (let i = 1; i <= n앞; i++) {
    if (!평일(앞, i)) continue
    if (i >= 3) st = 칸바꿈(st, 앞, 'm1', 두자(i), 1)
    if (i >= 10) st = 칸바꿈(st, 앞, 'm2', 두자(i), 1)
  }
  const n = 달날수(ym)
  for (let i = 1; i <= n; i++) {
    if (!평일(ym, i)) continue
    st = 칸바꿈(st, ym, 'm1', 두자(i), 1)
    if (i <= 20) st = 칸바꿈(st, ym, 'm2', 두자(i), i % 7 === 0 ? 0.5 : 1)
    if (i >= 4 && i <= 12) st = 칸바꿈(st, ym, 'm3', 두자(i), 1)
    if (i % 3 === 0) st = 칸바꿈(st, ym, 'm4', 두자(i), 1)
    if (i >= 15 && i <= 21) st = 칸바꿈(st, ym, 'm5', 두자(i), 1)
    if (i >= 24) st = 칸바꿈(st, ym, 'm6', 두자(i), 1)
  }
  return st
}
/** 예시 사람의 잠글 값(가상 — 주민번호 뒷자리는 * · 계좌도 *) */
export const 예시비밀 = {
  m1: { r: '760906-1******', c: '***-****-****-01' }, m2: { r: '820430-1******', c: '***-******-**-102' },
  m3: { r: '881016-1******', c: '***-***-******' }, m4: { r: '590505-1******', c: '****-**-******-1' },
  m5: { r: '731005-2******', c: '***-****-****-05' }, m6: { r: '900211-1******', c: '***-******-*****' },
}
