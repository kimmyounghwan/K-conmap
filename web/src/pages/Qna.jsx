import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
/* ⚠️ firebase 는 «정적으로» 끌어오지 않습니다. 이 화면을 열 때만 받습니다. (Jobs.jsx 와 같은 방식) */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}
import { Empty, Skeleton } from '../components.jsx'
import { pinHash } from '../lib/pin.js'
/* 🏷️ 별명은 **자동** 입니다 — 댓글과 같은 얼개(lib/nickname.js).
   소장님: 「글을 쓰면 별명이 붙게 해줘. 이름 별명을 쓰게 하지 말고.」
   댓글은 이미 그렇게 돌고 있었는데 묻고답하기만 손으로 적게 돼 있었습니다.
   ■ 왜 자동이 나은가
     · 이름칸을 비우면 «익명» 이 줄줄이 쌓여 누가 누구인지 안 보입니다.
     · 적으라고 하면 귀찮아서 안 씁니다.
     · uid 로 만드니 **같은 브라우저면 늘 같은 별명** 이고, 남이 흉내 낼 수 없습니다.
     · 그래서 **누가 자주 답해 주는지** 가 게시판에 그냥 보입니다 (기여도). */
import { nickOf } from '../lib/nickname.js'

/**
 * /qna — 「사랑방」 (2026-09-15, 2026-09-17 게시판 말투 + 이름)
 *
 * 소장님: 「건설맵 이용자가 이용할 수 있는 게시판도 있어야 하지 않아」 · 「묻고 답하기 형식으로」
 *         「답변은 누구나」 · 「이 주소를 저장해 두세요」 는 번거롭다 → 뺐습니다.
 *         「이미 하루 안에 답변을 단다고 했으니」 — 그 약속이 다시 오게 만듭니다.
 *
 * 왜 이 게시판이 필요한가
 *   답변이 곧 실력 증명입니다. 「낙찰하한율이 뭔가요」로 들어온 사람이 답을 읽고,
 *   옆에 있는 「내역서 작성해 드립니다」를 봅니다. 그게 이 화면의 일입니다.
 *
 * ⚠️ 연락처 «칸» 은 여전히 없습니다 — 칸이 있으면 다들 적고, 그 번호로 전화가 갑니다.
 *    다만 2026-09-17 부터 «적지 마세요» 라고 **말하지는 않습니다** (소장님: 「이것도 빼」).
 *    쓰는 자리에 금지어를 붙여 두면, 규칙을 읽히려고 글쓰기를 막는 꼴이 됩니다.
 *    연락처가 필요한 이야기는 /naeyeok 의 문의함(아무도 못 읽는 곳)으로 갑니다.
 * ⚠️ 「내가 쓴 글」은 브라우저가 알아서 기억합니다(구인구직과 같은 방식). 적을 것이 없습니다.
 */
const LIMIT = 300

/* ⚠️ 2026-09-17 — 여기에 «이런 글이 올라옵니다» 보기 일곱 줄이 있었습니다.
 *   (「낙찰됐는데 산출내역서를 언제까지…」 「오늘 개찰 들어갔다가 느낀 것」 …)
 *   소장님: 「**사랑방에도 문장들이 잇는데, 다 제거 해. 그냥 자유롭게 적도록...해줘**」
 *   빈 칸이 무서울까 봐 예시를 깔아 두었는데, 예시를 깔면 «저 중에 골라야 하나» 가 됩니다.
 *   골라 주는 것과 열어 두는 것은 다릅니다 — 열어 둡니다. */
const MINE_KEY = 'kcm_qna_mine'
const loadMine = () => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]') } catch { return [] } }
const addMine = (id) => { try { localStorage.setItem(MINE_KEY, JSON.stringify([...loadMine(), id].slice(-100))) } catch { /* noop */ } }

/* 🔑 2026-09-27 «내 글 되찾기» — 소장님: 「비번을 풀고, 간단히 수정하게 하면 … 그래서 다시 기억하게 한다면..어때?」
   가입이 없어서 «그 기기의 그 브라우저 번호(uid)» 가 글쓴이입니다. 기기를 바꾸거나 기록을 지우면 번호가 바뀝니다.
   → 글 쓸 때 정한 4자리를 맞히면, 규칙(database.rules.json qna_who)이 «지금 번호 → 옛 번호(r)» 를 이어 줍니다.
     이어진 기기는 옛 번호로 쓰고(별명이 같아짐) 옛 글을 고치고 지웁니다.
   ⚠️ 이어진 적이 없으면(대부분) 지금 번호 그대로입니다. 규칙을 못 읽어도 지금 번호 그대로 — 글쓰기는 막히지 않습니다. */
let _뿌리 = null
const 뿌리찾기 = async () => {
  const { ref, get, db, ensureAnon } = await loadFb()
  const u = await ensureAnon()
  if (_뿌리 && _뿌리.uid === u.uid) return _뿌리
  let r = u.uid
  try { const w = (await get(ref(db, `qna_who/${u.uid}`))).val(); if (w && w.r) r = String(w.r) } catch (e) { /* 규칙 전 · 막힘 */ }
  _뿌리 = { uid: u.uid, r }
  return _뿌리
}

/* 🎁 2026-09-27 보상(명예) — 소장님: 「글을 쓴 사람에게 보상은 없어?」 → 고르심: «명예만»
   · 👍 도움됐어요 — 글(qna_like/{글}/{나}) · 답글(qna_alike/{글}/{답}/{나}). 한 사람 한 번, 내 글엔 못 누름(규칙).
     «나» = 이어진 옛 번호(r)가 있으면 그것 — 기기 두 대로 두 번 못 누르게.
   · 활동 표시 — 글 1 · 답글 2 · 받은 👍 3 점 → 🌱 새내기(1) · 🔨 일꾼(10) · 🏅 반장(30). 운영자(K-건설맵)는 셈에서 뺌.
   · 👑 이달의 답변왕 — qna_king/{YYYY-MM} = {r, nick, at}, 운영자만 정함(규칙). 가장 최근 달의 왕에게 👑.
   ⚠️ 점수는 읽어 온 글(최근 300개) 안에서 셉니다 — 참고용입니다. 답변왕은 사람이 보고 정합니다. */
const 점수표 = [[30, '🏅', '반장'], [10, '🔨', '일꾼'], [1, '🌱', '새내기']]
export const 계급 = (p) => (점수표.find(([n]) => p >= n) || [0, '', ''])
const 셈하나 = (m, uid, n) => { if (uid && !isOp(uid)) m[uid] = (m[uid] || 0) + n }
/** 점수 — 글·답글·받은 👍. 달(YYYY-MM)을 주면 그 달에 쓴 것만(👍 는 그 달 글·답글이 받은 것) */
export function 점수셈(글들, 답들, 좋아요, 답좋아요, 달) {
  const m = {}
  const 그달 = (at) => !달 || (at && new Date(at + 9 * 3600e3).toISOString().slice(0, 7) === 달)   /* 한국 시각으로 달을 가름 */
  ;(글들 || []).forEach((r) => {
    if (r.구인구직 || !그달(r.at)) return
    셈하나(m, r.uid, 1)
    셈하나(m, r.uid, 3 * Object.keys((좋아요 || {})[r.id] || {}).length)
  })
  Object.entries(답들 || {}).forEach(([qid, 묶음]) => Object.entries(묶음 || {}).forEach(([aid, a]) => {
    if (!a || a.deleted || a.op || !그달(a.at)) return
    셈하나(m, a.uid, 2)
    셈하나(m, a.uid, 3 * Object.keys(((답좋아요 || {})[qid] || {})[aid] || {}).length)
  }))
  return m
}
/* 📖 공지 판 — 공지(활용 방법·보상)를 고치면 이 글자를 바꾸십시오. 처음 온 기기와 «바뀐 판» 에서만 한 번 펼쳐집니다(소장님 고르심). */
const 공지판 = '2026-09-27b'
const 공지열쇠 = 'kcm.qna.공지판'

/* 🔑 운영자 브라우저 — 답글에 「K-건설맵 답변」 표가 붙는 곳. (2026-09-17)
 *
 * 소장님: 「**답글에 비번이 왜 필요해.. 유료만 필요하지**」 — 맞는 말씀이었습니다.
 *         「**내가 다는 답변도 클로드가 다는 답변도 모두 K-건설맵 으로 하자**」
 *
 * ■ 전에는 어땠나 — 열쇠말을 «화면 안에서» 해시와 맞춰 봤습니다.
 *   그런데 DB 규칙은 op 가 «참/거짓이기만 하면» 통과였습니다.
 *   **개발자도구를 아는 사람은 열쇠말 없이 그냥 표를 달 수 있었습니다.**
 *   즉 그 비번은 소장님만 불편하게 했지, 실제로 막은 것이 없었습니다.
 *
 * ■ 이제 — 비번이 없습니다. **서버(database.rules.json)가 uid 를 봅니다.**
 *   여기 목록에 있는 브라우저면 답글에 표가 저절로 붙습니다. 칠 것이 없습니다.
 *   ⚠️ **database.rules.json 의 op 규칙과 반드시 같아야 합니다.** 한쪽만 고치면
 *      화면은 표를 붙이려 하는데 서버가 막아 「올리지 못했습니다」 가 납니다.
 *   ⚠️ uid 를 여기 적어도 안전합니다 — 익명 로그인은 «원하는 uid 로» 로그인할 수 없습니다.
 *   ⚠️ 브라우저 기록을 지우면 번호가 바뀝니다. 기기를 더하실 땐 아래 목록과 규칙 둘 다에
 *      번호를 넣고 `3_규칙올리기.bat` 을 한 번 돌리면 됩니다.
 *      그 브라우저의 번호는 「이 사랑방 쓰는 법」 맨 아래에 적혀 있습니다.
 *
 * ⚠️ **다른 분들이 글·답글 쓰는 것은 그대로입니다.** 가입도 로그인도 없습니다.
 *    바뀐 것은 «표가 붙느냐» 하나뿐입니다. */
/* 🔖 2026-09-18 — 번호 목록은 `lib/운영자.js` 로 옮겼습니다.
   운영자인지 보려는 화면(Admin·ReportMake·Report)이 여기서 가져가면
   **사랑방 화면을 통째로 끌고 갔기** 때문입니다.
   여기서 다시 내보내는 것은 옛 길(`from './Qna.jsx'`)을 깨뜨리지 않기 위함입니다. */
import { OPS, isOp } from '../lib/운영자.js'
export { OPS, isOp }

const when = (ms) => {
  if (!ms) return ''
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

import { 갈래들, 갈래빛, 갈래떼기, 갈래붙이기 } from '../lib/말머리.js'
import { use화면상태, use남김 } from '../lib/길기록.js'

/* 상대시간 — 「9.18 18:41」 보다 「3시간 전」 이 살아 있어 보입니다. 이틀이 지나면 날짜로. */
const 언제 = (ms) => {
  if (!ms) return ''
  const 초 = Math.floor((Date.now() - ms) / 1000)
  if (초 < 60) return '방금'
  if (초 < 3600) return `${Math.floor(초 / 60)}분 전`
  if (초 < 86400) return `${Math.floor(초 / 3600)}시간 전`
  if (초 < 172800) return '어제'
  return when(ms)
}

/* 🔴 «내 글에 새 답글» — 가입이 없으니 브라우저가 «본 답글 수» 를 기억하는 수밖에 없습니다. */
const SEEN_KEY = 'kcm_qna_seen'
const loadSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') } catch { return {} } }
const saveSeen = (v) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(v)) } catch { /* 사생활 모드 */ } }

export default function Qna() {
  const [rows, setRows] = useState(null)
  const [ans, setAns] = useState({})        // { 질문id: [답변…] }
  const [del, setDel] = useState({})
  const [open, setOpen] = useState(null)    // 펼친 질문 id
  /* 🧭 2026-09-27 — 글쓰기 칸도 뒤로가기 한 칸 (lib/길기록.js) */
  const [write, setWrite, 글쓰기닫기] = use화면상태('글쓰기', false)
  const [mine, setMine] = useState(loadMine)
  /* 🛠 2026-09-17 — 소장님: 「관리자 페이지 어디에 있지?」
     주소는 /admin 인데 **어디에도 길이 없었습니다.** 외워서 치셔야 했습니다.
     → 운영자 브라우저일 때만 여기에 단추를 답니다. 사랑방이 «답글 달러 오는 자리» 라 제자리입니다.
     ⚠️ 이용자에게는 아무것도 안 보입니다. */
  const [나운영자, set나운영자] = useState(false)
  const [onlyMine, setOnlyMine] = useState(false)
  const [q, setQ] = use남김('kcm.qna.찾기', '', 'session')
  const [갈래, set갈래] = use남김('kcm.qna.갈래', '전체', 'session')
  /* 🤝 2026-09-27 — 공고 카드에서 «구성원 구하는 글 쓰기» · «이 공고 글 보기» 로 들어온 경우(주소 뒤 state).
     새글 = { c: 말머리, t: 제목, b: 본문 } — 한 번만 씁니다(글을 올리거나 닫으면 비웁니다). */
  const loc = useLocation()
  const 가기 = useNavigate()
  const [새글, set새글] = useState(() => (loc.state && loc.state.새글) || null)
  /* 🩹 2026-09-28 — 공고에서 «이 공고 구성원 글» 로 왔을 때: { no, 이름, 초안 } — 찾는 띠·빈 화면 글을 그 공고에 맞춥니다 */
  const [공고찾기, set공고찾기] = useState(null)
  const 찾기띠 = useRef(null)
  useEffect(() => {
    const st = loc.state || {}
    if (!st.찾기 && !st.새글) return
    if (st.찾기) {
      setQ(String(st.찾기)); set갈래('전체')
      set공고찾기({ no: String(st.찾기), 이름: String(st.찾기이름 || ''), 초안: st.초안 || null })
      set공지열림(false)            /* 공지가 펼쳐져 있으면 찾은 결과가 화면 아래로 묻힙니다 — 이번만 접습니다(읽음 표시는 안 함) */
    }
    if (st.새글) set새글(st.새글)
    /* 한 번 썼으면 기록에서 뗍니다 — 안 떼면 글쓰기를 닫을 때마다 다시 열립니다 */
    const { 찾기: _a, 새글: _b, 찾기이름: _c, 초안: _d, ...남은 } = st
    const 화면 = { ...(남은.화면 || {}) }
    if (st.새글) 화면.글쓰기 = true
    가기({ pathname: loc.pathname, search: loc.search, hash: loc.hash }, { replace: true, state: { ...남은, 화면 } })
  }, [loc.key])   // eslint-disable-line react-hooks/exhaustive-deps
  const [jobs, setJobs] = useState([])
  const [seen, setSeen] = useState(loadSeen)
  /* 📌 고정 글(qna_top) · 🔑 나(지금 번호·옛 번호) — 둘 다 «못 읽어도» 게시판은 그대로 뜹니다 */
  const [고정, set고정] = useState({})
  const [나, set나] = useState(null)
  const [다보기, set다보기] = useState(false)
  /* 🎁 👍 · 👑 — 못 읽어도 게시판은 그대로 */
  const [좋아요, set좋아요] = useState({})
  const [답좋아요, set답좋아요] = useState({})
  const [왕들, set왕들] = useState({})
  /* 📖 공지 — 처음 온 기기 · 바뀐 판에서만 펼친 채로 */
  const [공지열림, set공지열림] = useState(() => { try { return localStorage.getItem(공지열쇠) !== 공지판 } catch (e) { return true } })
  const [공지탭, set공지탭] = useState('활용')
  const 공지닫기 = () => { set공지열림(false); try { localStorage.setItem(공지열쇠, 공지판) } catch (e) { /* 사생활 창 */ } }

  const load = async () => {
    try {
      const { ref, get, query, orderByKey, limitToLast, db, ensureAnon } = await loadFb()
      await ensureAnon()
      const [a, b, c, j, jd] = await Promise.all([
        get(query(ref(db, 'qna'), orderByKey(), limitToLast(LIMIT))),
        get(ref(db, 'qna_del')),
        get(ref(db, 'qna_a')),
        /* 🤝 구인구직은 «옮기지 않습니다» — 있던 자리(jobs)에 그대로 두고 여기서 같이 읽습니다.
           자료를 옮기면 되돌릴 수 없고, 연락처 칸이 있는 구인구직 화면도 그대로 살아 있어야 합니다.
           그래서 목록에만 같이 보이고, 누르면 그 화면으로 보냅니다. */
        get(query(ref(db, 'jobs'), orderByKey(), limitToLast(60))),
        get(ref(db, 'job_del')),
      ])
      setDel(b.val() || {})
      setAns(c.val() || {})
      const v = a.val() || {}
      setRows(Object.entries(v).map(([id, x]) => ({ id, ...x })).reverse())
      const jdv = jd.val() || {}
      setJobs(Object.entries(j.val() || {})
        .filter(([id, x]) => x && !x.deleted && !jdv[id])
        .map(([id, x]) => ({
          id: 'job:' + id, 구인구직: true, c: '구인구직',
          t: String(x.title || ''), b: String(x.body || ''),
          nick: String(x.co || x.type || '구인'), at: Number(x.at) || 0,
          곁: [x.type, x.trade, x.region].filter(Boolean).join(' · '),
        })).reverse())
    } catch (e) {
      setRows([])
    }
    /* ⚠️ 따로 읽습니다 — 위 Promise.all 에 넣으면 규칙이 아직 없을 때 «게시판 전체» 가 빈 칸이 됩니다 */
    try {
      const { ref, get, db } = await loadFb()
      set고정((await get(ref(db, 'qna_top'))).val() || {})
    } catch (e) { /* 고정 없이 */ }
    try { set나(await 뿌리찾기()) } catch (e) { /* 모름 */ }
    await 좋아요읽기()
  }
  const 좋아요읽기 = async () => {
    try {
      const { ref, get, db } = await loadFb()
      const [a, b, c] = await Promise.all([get(ref(db, 'qna_like')), get(ref(db, 'qna_alike')), get(ref(db, 'qna_king'))])
      set좋아요(a.val() || {}); set답좋아요(b.val() || {}); set왕들(c.val() || {})
    } catch (e) { /* 👍 없이 */ }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    let 살아있음 = true
    ;(async () => {
      try {
        const { ensureAnon } = await loadFb()
        const u = await ensureAnon()
        if (살아있음) set나운영자(isOp(u && u.uid))
      } catch { /* 못 물어봐도 그냥 안 보입니다 */ }
    })()
    return () => { 살아있음 = false }
  }, [])

  /* 사랑방 글 + 구인구직 글을 한 웅덩이로. 지운 것만 먼저 걸러 둡니다(셈에도 쓰니까). */
  const 모두 = useMemo(() => {
    if (!rows) return null
    return [...rows.filter((r) => !r.deleted && !del[r.id])
      .map((r) => { const g = 갈래떼기(r.t); return { ...r, c: g.c, t: g.t } }), ...jobs]
      .sort((a, b) => (b.at || 0) - (a.at || 0))
  }, [rows, del, jobs])

  const 셈 = useMemo(() => {
    const m = { 전체: 0 }
    갈래들.forEach((c) => { m[c] = 0 })
    ;(모두 || []).forEach((r) => { m[r.c] = (m[r.c] || 0) + 1; m.전체 += 1 })
    return m
  }, [모두])

  /* 🔑 «내 글» = 이 브라우저가 적어 둔 목록 + 번호가 나(지금·옛)인 글. 되찾은 뒤엔 옛 글도 여기 들어옵니다. */
  const 내것 = useMemo(() => {
    const m = new Set(mine)
    if (나 && 모두) 모두.forEach((r) => { if (!r.구인구직 && r.uid && (r.uid === 나.uid || r.uid === 나.r)) m.add(r.id) })
    return m
  }, [mine, 나, 모두])

  /* 📌 도구 사용법 — 운영자가 꽂은 글. 먼저 꽂은 것이 위(공사일보 → 바로투찰 → …). */
  const 고정목록 = useMemo(() => (모두 || []).filter((r) => 고정[r.id])
    .sort((a, b) => Number(고정[a.id]) - Number(고정[b.id])), [모두, 고정])
  const 기본보기 = 갈래 === '전체' && !onlyMine && !q.trim()

  const list = useMemo(() => {
    if (!모두) return null
    const s = q.trim()
    return 모두.filter((r) => {
      if (기본보기 && 고정[r.id]) return false   /* 위 📌 칸에 이미 있습니다 */
      if (갈래 !== '전체' && r.c !== 갈래) return false
      if (onlyMine && !내것.has(r.id)) return false
      if (s && !((r.t || '') + (r.b || '')).includes(s)) return false
      return true
    })
  }, [모두, q, onlyMine, 내것, 갈래, 고정, 기본보기])

  /* 공고에서 왔고 아직 그 공고번호로 찾는 중인가 */
  const 이공고 = !!(공고찾기 && q.trim() === 공고찾기.no)
  useEffect(() => {
    if (이공고 && list && 찾기띠.current) { try { 찾기띠.current.scrollIntoView({ block: 'start', behavior: 'smooth' }) } catch (e) { /* 옛 브라우저 */ } }
  }, [이공고, list === null])   // eslint-disable-line react-hooks/exhaustive-deps

  const nAns = (id) => Object.values(ans[id] || {}).filter((x) => x && !x.deleted).length

  /* 🎁 활동 점수 · 👑 가장 최근 답변왕 */
  const 점수 = useMemo(() => 점수셈(모두, ans, 좋아요, 답좋아요), [모두, ans, 좋아요, 답좋아요])
  const 왕 = useMemo(() => {
    const 달 = Object.keys(왕들 || {}).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort().pop()
    return 달 ? { 달, ...왕들[달] } : null
  }, [왕들])
  const 배지 = (uid) => {
    if (!uid || isOp(uid)) return ''
    if (왕 && 왕.r === uid) return '👑 '
    const [, 표] = 계급(점수[uid] || 0)
    return 표 ? 표 + ' ' : ''
  }
  const n좋아요 = (id) => Object.keys(좋아요[id] || {}).length
  /* 👍 누르기·빼기 — 먼저 화면에 반영하고, 서버가 막으면 되돌립니다 */
  const 좋아요누름 = async (경로, 켬) => {
    if (!나) return false
    try {
      const { ref, set, db, ensureAnon } = await loadFb()
      await ensureAnon()
      await set(ref(db, `${경로}/${나.r}`), 켬 ? true : null)
      await 좋아요읽기()
      return true
    } catch (e) { return false }
  }

  /* 📌 오늘의 K-건설맵 — 씨앗글은 여기 모읍니다. 이용자 글을 덮지 않게. (8절 69) */
  const 오늘것 = useMemo(() => (모두 || [])
    .filter((r) => r.c === 'K-건설맵' && !고정[r.id] && (Date.now() - (r.at || 0)) < 3 * 86400000)
    .slice(0, 3), [모두, 고정])

  /* 🔴 내 글에 달린 «새» 답글 */
  const 새답 = useMemo(() => {
    let n = 0; let 첫 = null; let 이름 = ''
    내것.forEach((id) => {
      const 지금 = Object.values(ans[id] || {}).filter((x) => x && !x.deleted).length
      const 본것 = Number(seen[id] || 0)
      if (지금 > 본것) {
        n += 지금 - 본것
        if (!첫) { 첫 = id; const r = (모두 || []).find((x) => x.id === id); 이름 = (r && r.t) || '' }
      }
    })
    return { n, 첫, 이름 }
  }, [내것, ans, seen, 모두])

  /* 글을 펼치면 «봤다» 고 적어 둡니다 — 빨간 띠가 사라지는 자리입니다. */
  const 열기 = (id) => {
    setOpen((v) => (v === id ? null : id))
    if (내것.has(id)) {
      const v = { ...loadSeen(), [id]: nAns(id) }
      saveSeen(v); setSeen(v)
    }
  }

  /* 한 글 = 한 칸. 📌 칸과 아래 목록이 같이 씁니다. 작게 = 📌 칸(말머리 대신 📌, 본문 미리보기 없음) */
  const 글카드 = (r, 작게) => {
    const n = r.구인구직 ? 0 : nAns(r.id)
    const isOpen = open === r.id
    const [bg, fg, ln] = 갈래빛[r.c] || ['var(--surface-2)', 'var(--text-2)', 'var(--line)']
    const 딱지 = 작게 ? <span style={{ flex: 'none' }}>📌</span> : (
      <span style={{
        background: bg, color: fg, border: '1px solid ' + ln, borderRadius: 6,
        padding: '2px 8px', fontSize: 11.5, fontWeight: 700, flex: 'none',
      }}>{r.c}</span>
    )
    /* 구인구직 글은 여기서 펼치지 않습니다 — 연락처·지원이 있는 제 화면으로 보냅니다.
       목록만 한 곳에 모으고, 자료는 있던 자리 그대로 둡니다. */
    if (r.구인구직) {
      return (
        <Link className="card" key={r.id} to="/jobs"
          style={{ marginBottom: 8, display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {딱지}
            <b style={{ flex: '1 1 200px', fontSize: 15 }}>{r.t}</b>
            <span className="muted" style={{ fontSize: 12 }}>{r.곁 || r.nick} · {언제(r.at)}</span>
            <span className="caret">›</span>
          </div>
          {r.b && (
            <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
              {String(r.b).slice(0, 90)}{String(r.b).length > 90 ? '…' : ''}
            </div>
          )}
        </Link>
      )
    }
    return (
      <div className="card" key={r.id} style={{ marginBottom: 8 }}>
        <div onClick={() => 열기(r.id)} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {딱지}
            {/* 2026-09-17 — 예전엔 답글이 없으면 「답변대기」 라고 붙었습니다.
                물음이 아닌 글에도 붙어서 «아직 답을 못 받은 글» 처럼 보였습니다.
                답글이 있을 때만 셈을 보입니다. 없으면 아무 말도 안 붙입니다. */}
            {n > 0 && (
              <span className="chip ok" style={{
                fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: 'var(--accent-soft, rgba(26,86,219,.12))',
                color: 'var(--accent, #1a56db)',
              }}>답글 {n}</span>
            )}
            {n좋아요(r.id) > 0 && (
              <span className="chip" style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: 'var(--good-soft)', color: 'var(--good)' }}>👍 {n좋아요(r.id)}</span>
            )}
            <b style={{ flex: '1 1 200px', fontSize: 15 }}>{r.t}</b>
            <span className="muted" style={{ fontSize: 12 }}>
              {배지(r.uid)}{r.nick || '익명'} · {언제(r.at)}{r.e ? ' · 고침' : ''}
              {내것.has(r.id) && <b style={{ color: 'var(--accent, #1a56db)' }}> · 내 글</b>}
            </span>
            {/* 2026-09-17 — 소장님: 「답글을 클릭해서 쓸 버튼이 없어」 → 「어차피 글을 보려면
                클릭해야 하잖아.. 그대로 둬도 될 것 같은데」. 맞는 말씀이라 단추는 안 답니다.
                다만 «열린다» 는 것만 알려 줍니다 — 공고 카드가 쓰는 것과 같은 ▼ 하나.
                ⚠️ 카드를 누르면 글 전체와 «답글 칸» 이 같이 열립니다. 그게 안 보이면
                   답글을 못 답니다(소장님이 실제로 못 찾으셨습니다). */}
            <span className="caret">{isOpen ? '▲' : '▼'}</span>
          </div>
          {!isOpen && !작게 && r.b && (
            <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
              {String(r.b).slice(0, 90)}{String(r.b).length > 90 ? '…' : ''}
            </div>
          )}
        </div>
        {isOpen && (
          <Detail row={r} ans={ans[r.id] || {}} mine={내것.has(r.id)} 나운영자={나운영자}
            고정됨={!!고정[r.id]} 나={나} 배지={배지}
            좋아요={좋아요[r.id] || {}} 답좋아요={답좋아요[r.id] || {}} 좋아요누름={좋아요누름}
            onChange={() => { _뿌리 = null; load(); setMine(loadMine()) }} />
        )}
      </div>
    )
  }

  return (
    <div className="wrap">
      {/* 2026-09-17 — 꽉 찬 파랑(.hero) 을 테두리만 있는 칸(.card.outline)으로 바꿉니다.
          게시판은 «어서 눌러라» 가 아니라 «편히 들어오시라» 여야 합니다. */}
      <div className="card outline">
        <h1 style={{ margin: 0, fontSize: 20 }}>💬 사랑방</h1>
        <div className="muted" style={{ marginTop: 6, lineHeight: 1.75, fontSize: 13.5 }}>
          들러 오셔서 아무 말이나 하고 가세요 — 현장 일도, 건설맵에 하고 싶은 말도, 그냥 하소연도.
          <b style={{ color: 'var(--text)' }}> 가입도 이름도 없습니다.</b>
        </div>
      </div>

      {/* 📋 2026-09-27 새로 — 소장님: 「누구나 어떤 말이든지, 다 가능...답글은 누구라도 달아도 됨」 「광고들은 1주에 한번만」(글로만 안내)
           「사랑방이 활성화 된다면 추후 관련 전문가 방을 따로 만들도록 하겠습니다 — 변호사, 기술사, 등」
           «연락처는 내역서 문의로» 줄은 소장님 말씀으로 뺐습니다. */}
      {/* 📌 2026-09-27 — 소장님: 「게시판 제일 위에 위치되도록 해줘」 → 머리 바로 밑, 모든 글보다 위 */}
      {/* 📖🎁 2026-09-27 저녁 — 소장님: 「사랑방 클릭하면 활용방법하고, 보상에 관한 글을 읽어 보게 해줘」 → «처음 + 바뀔 때만» 펼침(고르심) */}
      <details className="qna-rule qna-notice" open={공지열림} style={{ marginBottom: 10, lineHeight: 1.85 }}
        onToggle={(e) => { if (!e.currentTarget.open && 공지열림) 공지닫기(); else if (e.currentTarget.open && !공지열림) set공지열림(true) }}>
        <summary style={{ cursor: 'pointer', fontWeight: 800 }}>📌 공지 · 활용 방법 · 🎁 보상 · ⭐ 운영진 모심 <span className="qna-notice-sub">— ⚠️ 꼭 한 번 읽어 주세요 (눌러서 보기)</span></summary>
        <div className="qna-tabs" role="tablist">
          <button role="tab" aria-selected={공지탭 === '활용'} className={'qna-tab' + (공지탭 === '활용' ? ' on' : '')} onClick={() => set공지탭('활용')}>📖 활용 방법</button>
          <button role="tab" aria-selected={공지탭 === '보상'} className={'qna-tab' + (공지탭 === '보상' ? ' on' : '')} onClick={() => set공지탭('보상')}>🎁 보상</button>
        </div>
        {공지탭 === '활용' && (<>
        {/* ⚠️ 2026-09-27 — 소장님: 「이용자가 알 수 있게...설명을 해줘야 하잖아 … 중요표시 많이 넣어서」
             가입이 없어서 «그 기기의 그 브라우저» 가 글쓴이를 기억합니다(9/21 익명 유지 결정). 그 한계를 먼저 크게 알립니다. */}
        <div className="qna-memo">
          <div className="qna-memo-h">⚠️ 꼭 알아 두세요 — 내 별명과 내 글은 <u>«이 기기의 이 브라우저»</u>가 기억합니다</div>
          <ul>
            <li>✅ <b>같은 폰(PC) · 같은 앱</b>으로 쓰시면 <b>계속 같은 별명</b>입니다.</li>
            <li>❗ <b>다른 폰·PC</b>, <b>다른 앱</b>(크롬 ↔ 삼성 인터넷 ↔ <b>카톡 안에서 연 링크</b>), <b>시크릿 창</b>에서는 <b>다른 사람</b>으로 보입니다.</li>
            <li>❗ 브라우저에서 <b>«인터넷 사용 기록 · 사이트 데이터 삭제»</b>를 하면 이 기기도 <b>나를 잊어버립니다.</b></li>
            <li>🔑 글 쓸 때 정한 <b>4자리 숫자는 꼭 적어 두세요</b> — 내 글을 <b>지우고 · 되찾는 열쇠</b>입니다. 잊으면 찾아 드릴 수 없습니다.</li>
            <li>🔁 <b>잊혀졌다면 — 내 글을 열고 «🔑 내 글 되찾기»</b>에 그 4자리를 넣으세요. <b>별명과 내 글(고치기·지우기)이 돌아옵니다.</b>
              <span className="muted"> (남이 맞혀 보지 못하게 <b>하루 5번</b>까지만 넣을 수 있습니다)</span></li>
            <li>💡 가장 확실한 방법: 폰에서 <b>«홈 화면에 추가»</b> 해 두고 <b>늘 그 아이콘으로</b> 여십시오.</li>
          </ul>
        </div>
        <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li><b>누구나, 어떤 이야기든 좋습니다.</b> 가입·이름 없이 바로 씁니다. 별명은 저절로 붙고, 같은 기기면 늘 같은 별명입니다.
            <div className="muted" style={{ fontSize: 12.5 }}>예) 오늘 현장 한 줄 · 이 서류 어떻게 쓰나요 · 이 단가 맞나요 · 좋은 장비·업체 추천 · 하소연 · 쓸 만한 자료 나눔</div></li>
          <li><b>답글은 누구나 답니다.</b> 아는 분이 먼저 답해 주세요 — 현장 경험 한 줄이 제일 큰 도움이 됩니다.
            K-건설맵도 하루 안에 답을 다는 것을 목표로 합니다. K-건설맵이 단 답에는 <b>「K-건설맵 답변」</b> 표가 붙습니다.
            표가 없는 답은 이용자 의견이니 <b>중요한 일은 발주처·전문가에게 한 번 더 확인</b>하십시오.</li>
          <li><b>물어볼 때는</b> 공사 규모 · 발주처 · 지금 어디까지 — 이 셋만 적어도 답이 훨씬 정확해집니다. 모르면 모르는 대로 적으셔도 됩니다.</li>
          <li><b>자료 나눔 환영합니다.</b> 다만 남의 공사명·업체명·사람 이름·전화번호·주민번호는 지우고 올려 주세요.</li>
          <li><b>홍보·광고는 1주에 한 번까지.</b> 같은 글을 되풀이하거나 도배하면 지웁니다.</li>
          <li><b>예고 없이 지우는 글:</b> 욕설·비방·특정인 공격 · 남의 개인정보 · 불법(담합·대리입찰 알선 등) · 음란·도박 · 도배</li>
          <li><b>내 글은</b> 펼치면 <b>✏️ 고치기</b>가 있고, 글 쓸 때 정한 <b>4자리 숫자</b>로 지웁니다. 다른 기기에서는 먼저 <b>«🔑 내 글 되찾기»</b>.</li>
          <li><b>도구가 안 되거나 고쳤으면 하는 점</b>은 위 <b>📌 도구 사용법</b> 글에 답글로, 또는 <b>후기·건의</b>에 남겨 주세요 — 바로 살펴 고치겠습니다. 🙏</li>
          <li><b>앞으로</b> 사랑방이 활성화되면 <b>변호사·기술사 등 관련 전문가 방</b>을 따로 열겠습니다.</li>
        </ol>
        </>)}
        {공지탭 === '보상' && (
          <div className="qna-reward">
            {/* ⭐ 2026-09-27 — 소장님: 「활동을 하는 사람에게 명예를 주고, 나중에 이 분들의 의견을 들어 건설맵 운영진으로 .....
                 만약 허락하신다는 전제하에......이 말도 언급해줘. 이 글을 강조 강조 강조 해줘」 */}
            <div className="qna-staff">
              <div className="qna-staff-h">⭐ 꾸준히 활동하시는 분을 <u>«K-건설맵 운영진»</u>으로 모시겠습니다 ⭐</div>
              <p>활동해 주시는 분께 <b>명예</b>를 드리고, 나중에 <b>이분들의 의견을 여쭈어</b> —
                <b> 허락해 주신다면</b> — <b className="qna-staff-em">건설맵 운영진으로 모시려 합니다.</b></p>
              <p className="muted" style={{ margin: 0 }}>사랑방을 함께 꾸려 갈 분을 찾습니다. 👑 답변왕 · 🏅 반장 분들께 먼저 여쭙겠습니다.</p>
            </div>
            <p style={{ margin: '4px 0 8px' }}>사랑방에 <b>도움 되는 글과 답글</b>을 남겨 주시는 분께 감사를 드립니다.</p>
            <ul>
              <li>👍 <b>도움됐어요</b> — 글·답글마다 누를 수 있습니다. <b>한 분 한 번</b>, 내 글에는 누를 수 없습니다.</li>
              <li><b>활동 표시</b> — 글 1점 · 답글 2점 · 받은 👍 3점이 쌓이면 별명 옆에 표시가 붙습니다.
                <div className="qna-lv"><span>🌱 새내기 <i>첫 글</i></span><span>🔨 일꾼 <i>10점</i></span><span>🏅 반장 <i>30점</i></span></div></li>
              <li>👑 <b>이달의 답변왕</b> — 매달 1일, 지난달 가장 도움이 된 분을 K-건설맵이 정해 <b>사랑방 맨 위</b>에 모십니다. 별명 옆에 <b>👑</b>가 한 달 동안 붙습니다.</li>
              <li>광고·도배·같은 사람이 묻고 답하기는 셈에서 뺍니다.</li>
              <li>기기를 바꾸셨다면 글 쓸 때 정한 <b>4자리로 «🔑 내 글 되찾기»</b>를 먼저 해 주세요 — 그래야 같은 분으로 셉니다.</li>
            </ul>
          </div>
        )}
        <button className="qna-read" onClick={공지닫기}>다 읽었습니다 ▲</button>
      </details>

      {/* ⭐ 운영진 모심 — 공지를 접어도 늘 보이는 한 줄. 누르면 공지의 «🎁 보상» 탭이 펼쳐집니다 */}
      {!공지열림 && (
        <button className="qna-staff-bar" onClick={() => { set공지탭('보상'); set공지열림(true) }}>
          ⭐ <b>꾸준히 활동하시는 분을 «K-건설맵 운영진»으로 모시겠습니다</b> <span>— 🎁 보상 · 운영진 안내 보기 ›</span>
        </button>
      )}

      {/* 👑 이달의 답변왕 — 가장 최근 달 */}
      {왕 && (
        <div className="qna-king">👑 <b>{Number(왕.달.slice(5))}월의 답변왕</b> — {왕.nick} <span className="muted">· 고맙습니다!</span></div>
      )}

      {/* 🔴 내 글에 새 답글 — 이것이 «다시 오게» 만듭니다. 가입도 메일도 없이. (8절 69) */}
      {새답.n > 0 && (
        <div onClick={() => { if (새답.첫) 열기(새답.첫) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
            background: 'var(--bad-soft)', border: '1px solid var(--bad)',
            borderRadius: 12, padding: '11px 14px', marginBottom: 10, fontSize: 13.5,
          }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--bad)', flex: 'none' }} />
          <b style={{ color: 'var(--bad)' }}>내 글에 새 답글 {새답.n}개</b>
          {새답.이름 && <span className="muted" style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>「{새답.이름}」</span>}
          <span className="muted" style={{ marginLeft: 'auto', fontSize: 12.5 }}>눌러서 보기 ▸</span>
        </div>
      )}

      {/* ── 단추부터. 규칙은 뒤로 ──────────────────────────────────
          2026-09-17 — 예전에는 여기에 «하세요·하지 마세요» 가 다섯 문단 있었습니다.
          글 한 줄 쓰기 전에 규칙부터 읽히면 대부분 그냥 나갑니다.
          규칙은 아래 «이 게시판 쓰는 법» 으로 접고, 정말 필요한 한 줄
          (전화번호 적지 마세요)만 글 쓰는 칸 옆에 둡니다. */}
      <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <button className="btn line" onClick={() => (write ? 글쓰기닫기(false) : setWrite(true))}>
          {write ? '닫기' : '✏️ 글쓰기'}
        </button>
        {내것.size > 0 && (
          /* 🩹 2026-09-27 소장님 「후기 건의 탭을 클릭해도 이제까지의 글이 안보여」 — 이 단추가 켜져도 꺼져도 똑같이 꽉 찬 파랑이라
             켜진 줄 모르고 말머리를 누르면 «내 글 중 그 말머리» 만 찾아 빈 화면이 됐습니다. 꺼짐 = 테두리, 켜짐 = 꽉 찬 파랑 + 글로 알림 */
          <button className={'btn' + (onlyMine ? '' : ' line')} aria-pressed={onlyMine} onClick={() => setOnlyMine((v) => !v)}>
            {onlyMine ? '✓ 내가 쓴 글만 보는 중 — 모두 보기' : '내가 쓴 글 ' + 내것.size}
          </button>
        )}
        {나운영자 && <Link className="btn line" to="/admin">🛠 관리자</Link>}
      </div>

      {write && (
        <WriteForm 첫갈래={새글 ? 새글.c : (갈래 === '전체' ? '' : 갈래)} 첫글={새글} 나운영자={나운영자}
          onDone={() => { set새글(null); 글쓰기닫기(false); load(); setMine(loadMine()) }} />
      )}

      {/* 🏷️ 말머리 — 글은 한 웅덩이, 문만 여럿. 숫자를 붙여 «빈 방» 으로 보이지 않게 합니다. */}
      <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
        {['전체', ...갈래들].map((c) => {
          const on = 갈래 === c
          const [bg, fg, ln] = 갈래빛[c] || ['var(--surface)', 'var(--text-2)', 'var(--line)']
          return (
            <button key={c} onClick={() => { set갈래(c); setOpen(null); setOnlyMine(false) }}
              style={{
                border: '1px solid ' + (on ? 'var(--accent)' : ln), borderRadius: 999,
                padding: '7px 13px', fontSize: 13, cursor: 'pointer',
                background: on ? 'var(--accent)' : (c === '전체' ? 'var(--surface)' : bg),
                color: on ? '#fff' : (c === '전체' ? 'var(--text-2)' : fg),
                fontWeight: on ? 700 : 500,
              }}>
              {c} {셈[c] || 0}
            </button>
          )
        })}
      </div>

      <input className="inp" placeholder="찾기 — 낱말" value={q} onChange={(e) => setQ(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10 }} />


      {/* 📌 2026-09-27 도구 사용법 — 소장님: 「도구설명서도 항상 위쪽에 배치 되도록 해주고」
           「도구 사용시 안되는 부분이나 개선사항 있으면 피드백 부탁한다는 말도 적어줘」
           운영자가 꽂은 글(qna_top)만. 여섯 개 넘으면 접어 두고 «모두 보기». 펼친 글은 접혀도 보입니다. */}
      {기본보기 && 고정목록.length > 0 && (
        <div className="qna-pinbox">
          <div className="qna-pinbox-h">📌 도구 사용법
            <span className="muted" style={{ marginLeft: 'auto', fontWeight: 500, fontSize: 12 }}>{고정목록.length}개</span>
          </div>
          <div className="qna-pinbox-fb">🙏 도구를 쓰시다 <b>안 되는 부분</b>이나 <b>고쳤으면 하는 점</b>이 있으면 그 글에 <b>답글</b>로 남겨 주세요 — 바로 살펴 고치겠습니다.</div>
          {고정목록.filter((r, i) => 다보기 || i < 6 || r.id === open).map((r) => 글카드(r, true))}
          {고정목록.length > 6 && (
            <button className="qna-pinbox-more" onClick={() => set다보기((v) => !v)}>
              {다보기 ? '접기 ▲' : `모두 보기 (${고정목록.length}) ▼`}
            </button>
          )}
        </div>
      )}

      {갈래 === '전체' && !onlyMine && !q.trim() && 오늘것.length > 0 && (
        <div className="card" style={{
          marginBottom: 10, background: 'var(--accent-soft)', borderColor: 'var(--accent-line)',
        }}>
          <div style={{
            fontWeight: 800, color: 'var(--accent)', fontSize: 14, marginBottom: 9,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            📌 오늘의 K-건설맵
            <span className="muted" style={{ marginLeft: 'auto', fontWeight: 500, fontSize: 12 }}>{오늘것.length}개</span>
          </div>
          {오늘것.map((r) => (
            <div key={r.id} onClick={() => 열기(r.id)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--accent-line)',
                borderRadius: 10, padding: '9px 12px', marginBottom: 7, cursor: 'pointer', fontSize: 13.5,
              }}>
              {r.t}
              <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                K-건설맵 · {언제(r.at)} · 답글 {nAns(r.id)}
              </div>
            </div>
          ))}
        </div>
      )}

      {list === null && <Skeleton n={4} />}
      {/* 🔎 무엇 때문에 줄었는지 늘 보이게 — 내 글만 · 찾기 낱말 (2026-09-27) */}
      {list && (onlyMine || q.trim()) && (
        <div className="qna-filter-note" ref={찾기띠} style={{ scrollMarginTop: 70 }}>
          {onlyMine && <span>✓ <b>내가 쓴 글</b>만 보는 중</span>}
          {q.trim() && (이공고
            ? <span>🤝 이 공고{공고찾기.이름 ? <> «<b>{공고찾기.이름.slice(0, 40)}</b>»</> : null} 로 올라온 사랑방 글</span>
            : <span>🔎 «<b>{q.trim()}</b>» 로 찾는 중</span>)}
          <button type="button" className="chip" onClick={() => { setOnlyMine(false); setQ(''); set공고찾기(null) }}>모두 보기</button>
        </div>
      )}
      {list && list.length === 0 && 이공고 && (
        <div className="card" style={{ textAlign: 'center', padding: '18px 14px' }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>이 공고로 올라온 구성원 구함 글이 <b>아직 없습니다.</b></div>
          {공고찾기.초안 && (
            <button className="btn" onClick={() => { set새글(공고찾기.초안); setWrite(true) }}>✏️ 이 공고로 첫 글 쓰기 (구성원 구함)</button>
          )}
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>초안이 채워진 글쓰기 칸이 열립니다 — 고쳐서 올리시면 됩니다.</div>
        </div>
      )}
      {list && list.length === 0 && !이공고 && (
        (onlyMine || q.trim())
          ? <Empty>{onlyMine ? '내가 쓴 글 중에는' : '찾는 낱말이 들어간 글 중에는'} {갈래 === '전체' ? '' : '«' + 갈래 + '» '}글이 없습니다. 위 <b>«모두 보기»</b> 를 누르면 다른 분 글까지 모두 보입니다.</Empty>
          : <Empty>아직 글이 없습니다. 아무 말이나 먼저 남겨 주세요 — 한 줄이어도 됩니다.</Empty>
      )}

      {list && list.map((r) => 글카드(r))}

      {/* 👑 운영자만 — 이달의 답변왕 정하기 */}
      {나운영자 && <왕정하기 모두={모두} ans={ans} 좋아요={좋아요} 답좋아요={답좋아요} 왕들={왕들} onDone={좋아요읽기} />}

      {/* ── 내역서로 이어지는 한 줄 ─────────────────────────── */}
      {/* ⏸ 2026-09-27 — 작성 대행을 지금 받지 않는데(Naeyeok.jsx 대행받음) 여기만 «대신 만들어 드립니다» 가 남아 있었습니다. */}
      <Link to="/naeyeok" className="naeyeok-strip" style={{ marginTop: 14 }}>
        <span className="ns-ic">📋</span>
        <span className="ns-txt"><b>산출내역서 · 설계변경</b> — 무엇을 언제 내야 하는지 한 장으로 정리해 두었습니다.</span>
        <span className="ns-go">내역서 →</span>
      </Link>
    </div>
  )
}

/* ── 👑 이달의 답변왕 정하기 — 운영자 브라우저에만 보입니다 ─────────────────
   점수(글 1 · 답글 2 · 받은 👍 3)는 «그 달에 쓴 것» 으로 셉니다. 참고만 하시고 사람이 보고 고릅니다
   (도배·광고·자문자답은 빼기 — 공지 «보상» 탭에 적은 대로). 규칙: qna_king 은 운영자 번호만 씀. */
function 왕정하기({ 모두, ans, 좋아요, 답좋아요, 왕들, onDone }) {
  const 지난달 = (() => { const d = new Date(Date.now() + 9 * 3600e3); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7) })()
  const [달, set달] = useState(지난달)
  const [msg, setMsg] = useState('')
  const 순위 = useMemo(() => {
    const m = 점수셈(모두, ans, 좋아요, 답좋아요, 달)
    const 별명 = {}
    ;(모두 || []).forEach((r) => { if (r.uid && r.nick) 별명[r.uid] = 별명[r.uid] || r.nick })
    Object.values(ans || {}).forEach((g) => Object.values(g || {}).forEach((a) => { if (a && a.uid && a.nick) 별명[a.uid] = 별명[a.uid] || a.nick }))
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([r, p]) => ({ r, p, nick: 별명[r] || '익명' }))
  }, [모두, ans, 좋아요, 답좋아요, 달])
  const 지금왕 = (왕들 || {})[달]
  const 정하기 = async (x) => {
    try {
      const { ref, set, db, ensureAnon, serverTimestamp } = await loadFb()
      await ensureAnon()
      await set(ref(db, `qna_king/${달}`), x ? { r: x.r, nick: String(x.nick).slice(0, 20), at: serverTimestamp() } : null)
      setMsg(x ? `👑 ${달} 답변왕 — ${x.nick}` : '뺐습니다'); onDone && onDone()
    } catch (e) { setMsg('정하지 못했습니다(운영자 브라우저만 됩니다).') }
  }
  return (
    <details className="card" style={{ marginTop: 14 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>🛠 👑 이달의 답변왕 정하기 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>(운영자만 보임)</span></summary>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
        <input className="inp" type="month" value={달} onChange={(e) => set달(e.target.value)} style={{ width: 170 }} />
        {지금왕 && <span className="muted" style={{ fontSize: 13 }}>지금: 👑 {지금왕.nick} <button className="linkbtn qna-reclaim" style={{ display: 'inline', marginTop: 0 }} onClick={() => 정하기(null)}>빼기</button></span>}
      </div>
      {순위.length === 0 && <div className="muted" style={{ fontSize: 13 }}>이 달에 쓴 글·답글이 없습니다.</div>}
      {순위.map((x, i) => (
        <div key={x.r} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--line)', fontSize: 13.5 }}>
          <b style={{ width: 22 }}>{i + 1}</b><span style={{ flex: 1 }}>{x.nick}</span><span className="muted">{x.p}점</span>
          <button className="btn line sm" style={{ width: 'auto' }} onClick={() => 정하기(x)}>👑 이 분으로</button>
        </div>
      ))}
      {msg && <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{msg}</div>}
    </details>
  )
}

/* ── 질문 펼침 — 본문 + 답변들 + 답변 쓰기 ──────────────────────── */
function Detail({ row, ans, mine, onChange, 나운영자, 고정됨, 나, 배지 = () => '', 좋아요 = {}, 답좋아요 = {}, 좋아요누름 }) {
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState('')
  /* ✏️ 고치기 · 🔑 되찾기 — 2026-09-27 */
  const [고침, set고침] = useState(null)       // { t, b } 고치는 중
  const [찾기, set찾기] = useState(false)       // 되찾기 칸 열림
  const [찾기숫자, set찾기숫자] = useState('')
  const [바쁨, set바쁨] = useState(false)

  const 고쳐올리기 = async () => {
    const t = (고침.t || '').trim()
    if (t.length < 2) return setMsg('제목을 2자 이상 적어 주세요.')
    set바쁨(true); setMsg('')
    try {
      const { ref, update, db, ensureAnon, serverTimestamp } = await loadFb()
      await ensureAnon()
      await update(ref(db, `qna/${row.id}`), {
        t: 갈래붙이기(row.c, t), b: (고침.b || '').trim().slice(0, 2000), e: serverTimestamp(),
      })
      set고침(null); onChange()
    } catch (e) { setMsg('고치지 못했습니다 — 이 기기에서 쓴(또는 되찾은) 글만 고칠 수 있습니다.') } finally { set바쁨(false) }
  }

  /* 🔑 되찾기 — ① 빈 «시도 칸»(0~4) 하나에 넣어 본 숫자의 해시를 적고 ② «이어 주기» 를 부탁합니다.
     규칙이 ②에서 «그 칸의 해시 = 이 글의 4자리 해시» 인지 봅니다. 틀리면 ②가 튕기고 칸 하나만 씁니다.
     칸은 하루가 지나야 다시 비므로 «하루 5번» 입니다. 화면은 숫자를 맞춰 보지 않습니다(해시도 못 읽음). */
  const 되찾기 = async () => {
    if (찾기숫자.length !== 4) return setMsg('글 쓸 때 정한 4자리를 넣어 주세요.')
    set바쁨(true); setMsg('')
    try {
      const { ref, get, set, db, ensureAnon, serverTimestamp } = await loadFb()
      const u = await ensureAnon()
      const h = await pinHash(row.id, 찾기숫자)
      let 칸 = -1
      for (let n = 0; n < 5 && 칸 < 0; n++) {
        try { await set(ref(db, `qna_try/${row.id}/${n}`), { h, u: u.uid, at: serverTimestamp() }); 칸 = n } catch (e) { /* 찬 칸 */ }
      }
      if (칸 < 0) { setMsg('🔒 이 글은 오늘 더 넣어 볼 수 없습니다(하루 5번). 내일 다시 해 주세요.'); return }
      let r = String(row.uid || '')
      try { const w = (await get(ref(db, `qna_who/${r}`))).val(); if (w && w.r) r = String(w.r) } catch (e) { /* 그대로 */ }
      try {
        await set(ref(db, `qna_who/${u.uid}`), { r, q: row.id, n: String(칸) })
      } catch (e) {
        setMsg(`❌ 숫자가 맞지 않습니다.${칸 < 4 ? ` 오늘 ${4 - 칸}번 더 넣어 볼 수 있습니다.` : ' 오늘은 더 넣어 볼 수 없습니다.'}`)
        return
      }
      set찾기(false); set찾기숫자('')
      setMsg(`✅ 되찾았습니다 — 이 기기에서도 «${nickOf(r)}» 입니다. 내 글을 고치고 지울 수 있습니다.`)
      onChange()
    } catch (e) { setMsg('되찾지 못했습니다. 잠시 뒤 다시 해 주세요.') } finally { set바쁨(false) }
  }

  /* 📌 운영자만 — 도구 사용법 칸에 꽂기/빼기 (규칙이 운영자 번호만 받음) */
  const 고정바꾸기 = async () => {
    try {
      const { ref, set, db, ensureAnon, serverTimestamp } = await loadFb()
      await ensureAnon()
      await set(ref(db, `qna_top/${row.id}`), 고정됨 ? null : serverTimestamp())
      onChange()
    } catch (e) { setMsg('고정을 바꾸지 못했습니다.') }
  }
  /* 되찾기 단추는 «남의 글처럼 보이는» 이용자 글에만. 운영자 글·K-건설맵 글·운영자 브라우저에는 없습니다. */
  const 되찾기됨 = !mine && !나운영자 && row.c !== 'K-건설맵' && !isOp(row.uid) && !!row.uid
  /* 👍 — 내 것(지금 번호·옛 번호)이면 셈만 보이고 못 누릅니다(규칙도 막음) */
  const 내번호 = (uid) => !!나 && !!uid && (uid === 나.uid || uid === 나.r)
  const 눌렀나 = (m) => !!나 && !!(m || {})[나.r]
  const [좋바쁨, set좋바쁨] = useState(false)
  const 좋 = async (경로, 켬) => {
    if (!좋아요누름 || 좋바쁨) return
    set좋바쁨(true)
    const ok = await 좋아요누름(경로, 켬)
    set좋바쁨(false)
    if (!ok) setMsg('👍 를 누르지 못했습니다. 잠시 뒤 다시 해 주세요.')
  }
  const list = Object.entries(ans).map(([id, x]) => ({ id, ...x }))
    .filter((x) => !x.deleted).sort((a, b) => (a.at || 0) - (b.at || 0))

  /* 🛠 운영자 브라우저가 숫자 없이 올린 글 — 이 브라우저(같은 uid)가 직접 지웁니다(규칙이 uid 를 봄) */
  const 운영지우기 = async () => {
    if (!window.confirm('이 글을 지울까요?')) return
    try {
      const { ref, set, db, ensureAnon } = await loadFb()
      await ensureAnon()
      await set(ref(db, `qna/${row.id}/deleted`), true)
      onChange()
    } catch (e) { setMsg('이 브라우저에서 올린 글만 지울 수 있습니다.') }
  }
  const remove = async () => {
    if (pin.length !== 4) return setMsg('지울 때 쓰신 4자리를 넣어 주세요.')
    try {
      const { ref, set, db, ensureAnon } = await loadFb()
      await ensureAnon()
      await set(ref(db, `qna_del/${row.id}`), await pinHash(row.id, pin))
      onChange()
    } catch (e) { setMsg('숫자가 맞지 않습니다.') }
  }

  return (
    <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
      {고침 ? (
        <div style={{ marginBottom: 8 }}>
          <input className="inp" value={고침.t} maxLength={70} onChange={(e) => set고침((v) => ({ ...v, t: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 6 }} />
          <textarea className="inp" value={고침.b} maxLength={2000} onChange={(e) => set고침((v) => ({ ...v, b: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 110 }} />
          <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 6 }}>
            <button className="btn primary" onClick={고쳐올리기} disabled={바쁨}>{바쁨 ? '고치는 중…' : '고친 것 올리기'}</button>
            <button className="btn" onClick={() => set고침(null)}>그만두기</button>
          </div>
        </div>
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 14 }}>{row.b}</div>
      )}
      <div style={{ marginTop: 8 }}>
        {내번호(row.uid)
          ? <span className="qna-like muted">👍 도움됐어요 {Object.keys(좋아요).length}</span>
          : <button className={'qna-like' + (눌렀나(좋아요) ? ' on' : '')} disabled={좋바쁨}
              onClick={() => 좋(`qna_like/${row.id}`, !눌렀나(좋아요))}>👍 도움됐어요 {Object.keys(좋아요).length}</button>}
      </div>

      {list.map((a) => (
        <div key={a.id} style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 9,
          background: a.op ? 'var(--accent-soft, rgba(26,86,219,.08))' : 'var(--bg-soft, rgba(0,0,0,.03))',
          border: '1px solid var(--line)',
        }}>
          <div style={{ fontSize: 12, marginBottom: 5 }}>
            {a.op
              ? <b style={{ color: 'var(--accent, #1a56db)' }}>K-건설맵 답변</b>
              : <b>{배지(a.uid)}{a.nick || '익명'}</b>}
            <span className="muted"> · {when(a.at)}</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 13.5 }}>{a.b}</div>
          <div style={{ marginTop: 4 }}>
            {내번호(a.uid)
              ? <span className="qna-like sm muted">👍 {Object.keys(답좋아요[a.id] || {}).length}</span>
              : <button className={'qna-like sm' + (눌렀나(답좋아요[a.id]) ? ' on' : '')} disabled={좋바쁨}
                  onClick={() => 좋(`qna_alike/${row.id}/${a.id}`, !눌렀나(답좋아요[a.id]))}>👍 {Object.keys(답좋아요[a.id] || {}).length}</button>}
          </div>
        </div>
      ))}

      <AnswerForm qid={row.id} onDone={onChange} />

      {mine && !고침 && (
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn line" onClick={() => set고침({ t: row.t || '', b: row.b || '' })}>✏️ 고치기</button>
          {!나운영자 && <input className="inp" inputMode="numeric" maxLength={4} placeholder="4자리"
            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            style={{ width: 90 }} />}
          {!나운영자 && <button className="btn" onClick={remove}>내 글 지우기</button>}
          {나운영자 && <button className="btn line" onClick={운영지우기}>🛠 운영자 — 숫자 없이 지우기</button>}
        </div>
      )}

      {나운영자 && (
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8 }}>
          <button className="btn line" onClick={고정바꾸기}>{고정됨 ? '📌 도구 사용법에서 빼기' : '📌 도구 사용법에 고정'}</button>
        </div>
      )}

      {되찾기됨 && (
        찾기 ? (
          <div className="qna-pinnote" style={{ marginTop: 10 }}>
            <div style={{ marginBottom: 6 }}>🔑 <b>내가 쓴 글인가요?</b> 글 쓸 때 정한 <b>4자리</b>를 넣으면 이 기기에서도 <b>같은 별명</b>이 되고 <b>고치기·지우기</b>가 됩니다. <span className="muted">(하루 5번까지)</span></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="inp" inputMode="numeric" maxLength={4} placeholder="4자리"
                value={찾기숫자} onChange={(e) => set찾기숫자(e.target.value.replace(/\D/g, ''))} style={{ width: 90, flex: 'none' }} />
              <button className="btn primary" onClick={되찾기} disabled={바쁨} style={{ flex: '1 1 auto', width: 'auto' }}>{바쁨 ? '확인 중…' : '🔑 되찾기'}</button>
              <button className="qna-reclaim" onClick={() => { set찾기(false); setMsg('') }} style={{ marginTop: 0, flex: 'none' }}>닫기</button>
            </div>
          </div>
        ) : (
          <button className="linkbtn qna-reclaim" onClick={() => set찾기(true)}>🔑 내 글인데 다른 기기에서 보고 계신가요? — 내 글 되찾기</button>
        )
      )}
      {msg && <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{msg}</div>}
    </div>
  )
}

/* ── 답변 쓰기 — 누구나 ────────────────────────────────────────── */
function AnswerForm({ qid, onDone }) {
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [나운영자, set나운영자] = useState(false)

  /* 이 브라우저가 운영자인지 미리 알아 둡니다 — 올리기 «전에» 화면에 알려 주려고.
     쓰기 전에 「이 답에는 표가 붙습니다」 를 보여 줘야 무게를 알고 씁니다. */
  useEffect(() => {
    let 살아있음 = true
    ;(async () => {
      try {
        const { ensureAnon } = await loadFb()
        const u = await ensureAnon()
        if (살아있음) set나운영자(isOp(u && u.uid))
      } catch { /* 못 물어봐도 그냥 보통 답글입니다 */ }
    })()
    return () => { 살아있음 = false }
  }, [])

  const submit = async () => {
    if (b.trim().length < 2) return setMsg('답글을 적어 주세요.')
    setBusy(true); setMsg('')
    try {
      const { ref, set, push, db, ensureAnon } = await loadFb()
      const user = await ensureAnon()
      /* ⚠️ 여기서 다시 봅니다 — 위의 나운영자는 «보여 주기» 용입니다.
         실제로 올릴 때 쓰는 값은 그때 받은 uid 로 정합니다. */
      const op = isOp(user.uid)
      /* 🔑 되찾은 기기면 옛 번호(r)로 — 별명이 같아집니다 */
      const { r } = await 뿌리찾기()
      const slot = push(ref(db, `qna_a/${qid}`))
      await set(slot, {
        b: b.trim().slice(0, 2000),
        nick: (op ? 'K-건설맵' : nickOf(r)).slice(0, 20),
        op,
        uid: r,
        at: Date.now(),
      })
      setB('')
      onDone()
    } catch (e) {
      setMsg('올리지 못했습니다. 잠시 뒤 다시 해 주세요.')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <textarea className="inp" value={b} onChange={(e) => setB(e.target.value)}
        placeholder="답글 — 아무 말이나"
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 72 }} maxLength={2000} />
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? '올리는 중…' : '답글 올리기'}
        </button>
        {/* 🔑 운영자 브라우저일 때만 — 「이 답에는 표가 붙습니다」 를 미리 알려 줍니다.
            ⚠️ 이용자에게는 아무것도 안 보입니다. 비번 칸이 있던 자리입니다. */}
        {나운영자 && (
          <span className="muted" style={{ fontSize: 12 }}>
            이 답글에는 <b style={{ color: 'var(--accent, #1a56db)' }}>「K-건설맵 답변」</b> 표가 붙습니다
          </span>
        )}
        {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
      </div>
    </div>
  )
}

/* ── 질문 쓰기 ─────────────────────────────────────────────────── */
const 초안열쇠 = 'kcm.qna.초안'
function WriteForm({ onDone, 첫갈래, 첫글, 나운영자 }) {
  /* 🧭 2026-09-27 — 쓰다가 다른 화면에 갔다 와도 적은 글이 남게(이 탭을 닫을 때까지). 지울 때 쓸 숫자는 남기지 않습니다.
     🤝 공고 카드에서 넘어온 초안(첫글)이 있으면 그것부터 — 소장님이 고쳐 쓰실 수 있게 칸에만 넣습니다(바로 올리지 않음). */
  const [f, setF] = useState(() => {
    if (첫글 && (첫글.t || 첫글.b)) return { t: String(첫글.t || '').slice(0, 80), b: String(첫글.b || '').slice(0, 2000), pin: '' }
    try { const d = JSON.parse(sessionStorage.getItem(초안열쇠) || 'null'); if (d) return { t: d.t || '', b: d.b || '', pin: '' } } catch (e) { /* 없음 */ }
    return { t: '', b: '', pin: '' }
  })
  const [c, setC] = useState(첫갈래 || '')
  useEffect(() => { try { sessionStorage.setItem(초안열쇠, JSON.stringify({ t: f.t, b: f.b })) } catch (e) { /* 없음 */ } }, [f.t, f.b])
  /* 🤝 공고에서 초안을 들고 왔으면 글쓰기 칸으로 내려 줍니다 — 공지가 펼쳐져 있으면 화면 아래에 묻힙니다 */
  const 칸 = useRef(null)
  useEffect(() => { if (첫글 && 칸.current) { try { 칸.current.scrollIntoView({ block: 'start', behavior: 'smooth' }) } catch (e) { /* 옛 브라우저 */ } } }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [고정할, set고정할] = useState(false)
  const set_ = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))

  const submit = async () => {
    if (!c) return setMsg('어디에 쓸지 먼저 골라 주세요.')
    if (f.t.trim().length < 2) return setMsg('제목을 2자 이상 적어 주세요.')
    /* 🛠 2026-09-27 — 운영자 브라우저는 «지울 4자리» 없이 올립니다(관리자 화면에서 어떤 글이든 지움).
       소장님: 「사랑방에 각각의 도구 사용 방법을 … 게시 해줘」 — 클로드가 대신 올릴 때 비밀번호류를 넣지 않으려고 */
    if (!나운영자 && f.pin.length !== 4) return setMsg('지울 때 쓸 4자리 숫자를 정해 주세요.')
    setBusy(true); setMsg('')
    try {
      const { ref, set, push, db, ensureAnon, serverTimestamp } = await loadFb()
      await ensureAnon()
      /* 🔑 되찾은 기기면 옛 번호(r)로 씁니다 — 규칙이 «내 번호 · 이어진 옛 번호» 만 받습니다 */
      const { r } = await 뿌리찾기()
      const slot = push(ref(db, 'qna'))
      const id = slot.key
      if (f.pin.length === 4) await set(ref(db, `qna_pins/${id}`), await pinHash(id, f.pin))
      await set(slot, {
        /* 🏷️ 말머리는 제목 앞에 붙습니다 — 자료 칸을 늘리지 않으려고(규칙 $other:false). */
        t: 갈래붙이기(c, f.t.trim()),
        b: f.b.trim().slice(0, 2000),
        nick: (c === 'K-건설맵' ? 'K-건설맵' : nickOf(r)).slice(0, 20),
        uid: r,
        at: Date.now(),
      })
      addMine(id)
      /* 📌 운영자가 «도구 사용법에 고정» 을 골랐으면 — 실패해도 글은 이미 올라갔습니다 */
      if (나운영자 && 고정할) { try { await set(ref(db, `qna_top/${id}`), serverTimestamp()) } catch (e) { /* 글 안에서 다시 꽂으면 됨 */ } }
      try { sessionStorage.removeItem(초안열쇠) } catch (e) { /* 없음 */ }
      onDone()
    } catch (e) {
      setMsg('올리지 못했습니다. 잠시 뒤 다시 해 주세요.')
    } finally { setBusy(false) }
  }

  return (
    <div className="card" ref={칸} style={{ marginBottom: 10, scrollMarginTop: 70 }}>
      <div className="sec-title" style={{ margin: '0 0 10px' }}>글쓰기</div>

      {/* 어디에 쓸지부터. 「전체」에서 들어오셨으면 고르셔야 글이 갈 곳이 생깁니다. */}
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>어디에 쓸까요?</div>
      <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
        {갈래들.filter((x) => x !== 'K-건설맵' || 나운영자).map((x) => {
          const on = c === x
          const [bg, fg, ln] = 갈래빛[x]
          return (
            <button key={x} onClick={() => setC(x)}
              style={{
                border: '1px solid ' + (on ? 'var(--accent)' : ln), borderRadius: 999,
                padding: '7px 13px', fontSize: 13, cursor: 'pointer', fontWeight: on ? 700 : 500,
                background: on ? 'var(--accent)' : bg, color: on ? '#fff' : fg,
              }}>{x}</button>
          )
        })}
      </div>

      {/* 구인구직만 연락처 칸이 필요합니다 — 그 화면으로 보냅니다. 글은 거기 그대로 쌓입니다. */}
      {c === '구인구직' && (
        <div className="note" style={{ marginBottom: 10, fontSize: 13, lineHeight: 1.7 }}>
          구인·구직 글은 <b>연락처 칸</b>이 있는 화면에서 씁니다.{' '}
          <Link to="/jobs" style={{ fontWeight: 700 }}>구인구직에서 쓰기 →</Link>
        </div>
      )}
      {/* ⚠️ 2026-09-17 — 두 칸 다 «예) …» 로 보기를 깔아 두었습니다. 뺐습니다.
          남은 한 줄(전화번호)은 취향이 아니라 안전입니다 — 그것만 둡니다. */}
      <input className="inp" value={f.t} onChange={set_('t')} maxLength={80}
        placeholder="한 줄로 — 무슨 이야기든"
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
      <textarea className="inp" value={f.b} onChange={set_('b')} maxLength={2000}
        placeholder="더 적고 싶으시면 여기에 (안 적으셔도 됩니다)"
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 110, marginBottom: 8 }} />
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        {나운영자
          ? <>
            <span className="muted" style={{ fontSize: 12 }}>🛠 운영자 — 숫자 없이 올립니다(이 브라우저에서 «숫자 없이 지우기» 로 지움)</span>
            <label style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={고정할} onChange={(e) => set고정할(e.target.checked)} /> 📌 도구 사용법에 고정
            </label>
          </>
          : <input className="inp" inputMode="numeric" maxLength={4} value={f.pin}
            onChange={(e) => setF((v) => ({ ...v, pin: e.target.value.replace(/\D/g, '') }))}
            placeholder="지울 4자리" style={{ width: 118 }} title="🔑 꼭 적어 두세요 — 내 글을 지우고 되찾는 열쇠입니다" />}
        <button className="btn primary" onClick={submit} disabled={busy || c === '구인구직'}>
          {busy ? '올리는 중…' : (c ? c + '에 올리기' : '올리기')}
        </button>
        {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
      </div>
      {!나운영자 && <div className="qna-pinnote">🔑 <b>4자리 숫자는 꼭 적어 두세요</b> — 내 글을 <b>지우고 · 되찾는 열쇠</b>입니다. ❗ 다른 기기·다른 앱·기록 삭제 뒤에는 다른 사람으로 보이지만, 이 4자리로 <b>«내 글 되찾기»</b>를 하면 돌아옵니다.</div>}
    </div>
  )
}

/* ⚠️ 2026-09-17 — 여기에 «이 브라우저 번호» 를 한 줄 달았다가 **뺐습니다.**
   소장님: 「이게 왜 있는 거지?」 — 맞는 말씀이었습니다.
   그 번호가 필요한 사람은 **소장님 한 분** 입니다(다른 기기를 운영자로 등록할 때).
   그건 «운영자 사정» 이지, 사랑방에 들르는 분들이 알 바가 아닙니다.
   하루 종일 사랑방에서 «부담되는 말» 을 걷어내 놓고 정작 제가 기계 번호를 끼워 넣었습니다.

   ⚠️ 그리고 **이미 있을 자리에 있습니다** — 운영자가 아닌 브라우저로 /admin 을 열면
      「이 브라우저 번호 · …」 가 그대로 나옵니다(Admin.jsx).
      폰으로 k-conmap.com/admin 한 번 열면 끝입니다. 두 곳에 둘 이유가 없었습니다.
   📌 «나한테 필요한 것» 을 «모두가 보는 자리» 에 두지 않습니다. */
