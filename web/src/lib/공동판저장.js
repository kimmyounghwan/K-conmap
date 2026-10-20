/* 🤝 공동도급 마당 — 글 읽기 · 올리기 · 지우기 · 신고 (G341 · 2026-10-20)
 *   데이터베이스 jv(글 · 명부) · jv_pins(삭제 비밀번호 해시) · jv_del(비밀번호로 지운 표) · jv_flag(신고)
 *   규칙은 web/database.rules.json «jv» — 구인구직(jobs)과 같은 문입니다(익명 로그인 · 칸마다 모양 · $other 막음).
 * ■ 읽기는 열쇠 없이 REST 한 번씩(실시간 구독 없음 — 요금 방어 · firebase.js 머리말) ·
 *   전체 목록은 «아직 안 끝난 것» 만(orderBy end · startAt 지금 · 300개) · 공고 하나는 orderBy no · equalTo.
 * ■ 쓰기만 익명 로그인(firebase.js ensureAnon · 누를 때만 받음) → 그 열쇠(idToken)로 REST PUT.
 * ■ 끝난 글(협정 · 입찰 마감 · 명부 90일)은 화면에서 바로 빠지고, 7일 뒤 tools/이용자지도.py 공동정리()가 지웁니다.
 */
import { 보일글, 글만들기, 새키, 내글더하기, 내글읽기, 답글열쇠, 답글만들기, 내답글더하기 } from './공동판.js'
import { pinHash } from './pin.js'

export const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
const 따옴 = (s) => encodeURIComponent(JSON.stringify(s))

async function 받기(경로, 묻기 = '') {
  const r = await fetch(`${DB}/${경로}.json${묻기 ? '?' + 묻기 : ''}`, { cache: 'no-store' })
  if (!r.ok) throw new Error('읽기 ' + r.status)
  return r.json()
}

/** 보일 글 [] — no 를 주면 그 공고 글만(명부 빼고) */
export async function 글받기({ no = '', 지금 = Date.now() } = {}) {
  const 글 = no
    ? 받기('jv', `orderBy=${따옴('no')}&equalTo=${따옴(String(no))}`)
    : 받기('jv', `orderBy=${따옴('end')}&startAt=${지금}&limitToFirst=300`)
  const [raw, 지운, 신고] = await Promise.all([
    글,
    받기('jv_del', `orderBy=${따옴('$key')}&limitToLast=500`).catch(() => ({})),
    받기('jv_flag', `orderBy=${따옴('$key')}&limitToLast=500`).catch(() => ({})),
  ])
  return 보일글(raw, 지운 || {}, 신고 || {}, 지금)
}

async function 열쇠() {
  const { ensureAnon } = await import('../firebase.js')
  const u = await ensureAnon()
  return { uid: u.uid, t: await u.getIdToken() }
}
async function 넣기(경로, 값, t, 방법 = 'PUT') {
  const r = await fetch(`${DB}/${경로}.json?auth=${encodeURIComponent(t)}`, {
    method: 방법, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(값),
  })
  if (!r.ok) throw new Error('쓰기 ' + r.status)
  return r.json()
}

/** 글 올리기 — f(글 칸) · 끝(ms) · pin(4자리) → { id, 글 } · 틀리면 { 틀림 } */
export async function 글올리기(f, 끝, pin = '') {
  /* 삭제 숫자는 고를 때만(다른 기기에서 지울 때 씀) — 같은 브라우저는 숫자 없이 지워짐 */
  if (pin && !/^[0-9]{4}$/.test(String(pin))) return { 틀림: '삭제 숫자는 4자리 숫자로 적어 주세요(안 적어도 됩니다).' }
  const 미리 = 글만들기(f, 'x', Date.now(), 끝)
  if (미리.틀림) return 미리
  const { uid, t } = await 열쇠()
  const id = 새키()
  const { 글, 틀림 } = 글만들기(f, uid, Date.now(), 끝)
  if (틀림) return { 틀림 }
  if (pin) await 넣기(`jv_pins/${id}`, await pinHash(id, pin), t)      // 비밀번호 해시 먼저(규칙: 한 번만)
  await 넣기(`jv/${id}`, 글, t)
  내글더하기(id)
  return { id, 글 }
}

/** 지우기 — 이 브라우저가 쓴 글이면 그대로, 아니면 비밀번호로 */
export async function 글지우기(id, pin = '') {
  const { t } = await 열쇠()
  if (!pin && 내글읽기().includes(id)) {
    await 넣기(`jv/${id}`, { deleted: true }, t, 'PATCH')
    return true
  }
  if (!/^[0-9]{4}$/.test(String(pin || ''))) throw new Error('비밀번호')
  await 넣기(`jv_del/${id}`, await pinHash(id, pin), t)
  return true
}

/** 신고 — 한 브라우저 한 번 · 세 곳이 신고하면 화면에서 숨김 */
export async function 신고하기(id) {
  const { uid, t } = await 열쇠()
  await 넣기(`jv_flag/${id}/${uid}`, true, t)
  return true
}

/* ── 💬 답글(대화) — 소장님 「서로 대화로 공동으로 입찰할 수 있는 판을 깔아 주는 거지?」 ──
   글마다 답글: 데이터베이스 comments/jv-{글 키}/{답글 키} — 공고 댓글(comments)과 같은 칸 · 같은 규칙(이미 있음 · 새로 안 엶).
   끝난 글이 지워질 때 답글도 같이 지움(tools/이용자지도.py 공동정리). */
/** 답글들 — 옛것부터 [{id, by, body, at, uid}] (지운 것 뺌) */
export async function 답글받기(글키) {
  const k = 답글열쇠(글키)
  const [raw, 지운] = await Promise.all([
    받기(`comments/${k}`, `orderBy=${따옴('$key')}&limitToLast=100`),
    받기(`comment_del/${k}`).catch(() => ({})),
  ])
  return Object.entries(raw || {}).map(([id, v]) => ({ id, ...(v || {}) }))
    .filter((x) => x && x.body && !x.deleted && !((지운 || {})[x.id]))
    .sort((a, b) => (a.at || 0) - (b.at || 0))
}
/** 답글 수 — 글 키들 → {글 키: 수}(지운 것도 셈 · 가벼운 읽기 shallow) */
export async function 답글수(글키들) {
  const 답 = {}
  await Promise.all((글키들 || []).slice(0, 40).map(async (g) => {
    try { const v = await 받기(`comments/${답글열쇠(g)}`, 'shallow=true'); 답[g] = v && typeof v === 'object' ? Object.keys(v).length : 0 } catch (e) { /* 못 읽음 — 없는 셈 */ }
  }))
  return 답
}
/** 답글 쓰기 → {id, 답} · 틀리면 {틀림} */
export async function 답글쓰기(글키, by, body) {
  const 미리 = 답글만들기(by, body, 'x')
  if (미리.틀림) return 미리
  const { uid, t } = await 열쇠()
  const id = 새키()
  const { 답 } = 답글만들기(by, body, uid)
  await 넣기(`comments/${답글열쇠(글키)}/${id}`, 답, t)
  내답글더하기(id)
  return { id, 답 }
}
/** 내 답글 지우기(같은 브라우저) */
export async function 답글지우기(글키, id) {
  const { t } = await 열쇠()
  await 넣기(`comments/${답글열쇠(글키)}/${id}`, { deleted: true }, t, 'PATCH')
  return true
}
