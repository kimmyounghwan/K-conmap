import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { 가림 } from '../lib/가림.js'
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
/* 🔔 2026-09-30(G73) 답글 알림 — 올리기를 누른 그 순간 브라우저 기본 «알림 허용» 창(우리 안내창 없음) · lib/알림.js */
import { 허락묻기, 폰알림켜기, 푸시되나 } from '../lib/알림.js'

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
    if (r.구인구직 || r.sb || !그달(r.at)) return
    셈하나(m, r.uid, 1)
    셈하나(m, r.uid, 3 * Object.keys((좋아요 || {})[r.id] || {}).length)
  })
  Object.entries(답들 || {}).forEach(([qid, 묶음]) => Object.entries(묶음 || {}).forEach(([aid, a]) => {
    if (!a || a.deleted || a.sb || a.op || !그달(a.at)) return
    셈하나(m, a.uid, 2)
    셈하나(m, a.uid, 3 * Object.keys(((답좋아요 || {})[qid] || {})[aid] || {}).length)
  }))
  return m
}
/* 📖 공지 판 — 공지(활용 방법·보상)를 고치면 이 글자를 바꾸십시오. 처음 온 기기와 «바뀐 판» 에서만 한 번 펼쳐집니다(소장님 고르심). */
const 공지판 = '2026-09-29'      /* 🧹 말머리를 «후기·건의 · K-건설맵» 둘로 줄인 판 — 한 번 다시 펼쳐 알립니다 */
const 공지열쇠 = 'kcm.qna.공지판'

/* 👁 2026-10-01 (G95) 조회수 — 소장님 「조회수 알 수 있지? 조회수도 넣어주고」
   ⚠️ 그 전까지는 글별 조회를 어디에도 적지 않았습니다 → 올린 날부터 0 에서 셉니다.
   세는 법: 글을 펼치거나(/qna 목록) 글 주소(/qna/{번호})로 들어오면 qna_v/{번호} 를 1 올림(runTransaction —
   규칙이 «1씩만» 받습니다). 같은 브라우저는 하루 한 번 · 운영자 · 글쓴이 본인 · 검색 로봇은 안 셉니다. */
const 조회열쇠 = 'kcm.qna.본날'
/* 📎 G158 — 우리 Storage(이용자 서식 자리) 주소인 파일만 보여 줍니다(규칙도 같은 것을 봄) */
const 파일앞 = 'https://firebasestorage.googleapis.com/v0/b/k-conmap.firebasestorage.app/o/user_forms%2F'
const 파일있음 = (r) => !!(r && r.f && typeof r.f.u === 'string' && r.f.u.startsWith(파일앞) && typeof r.f.n === 'string' && r.f.n)
const 오늘날 = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
const 봇같음 = () => {
  try { return !!navigator.webdriver || /bot|crawl|spider|slurp|yeti|daumoa|bingpreview|headless|lighthouse|facebookexternalhit|kakaotalk-scrap/i.test(navigator.userAgent || '') } catch (e) { return true }
}

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
import { 몰래표 } from '../lib/차단.js'
export { OPS, isOp }

const when = (ms) => {
  if (!ms) return ''
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

import { 갈래떼기, 갈래붙이기 } from '../lib/말머리.js'
import { use화면상태, use남김 } from '../lib/길기록.js'
/* 🗺 G114 사랑방 맨 위 지도는 G144(2026-10-05) 바로투찰 맨 위로 옮김 — 소장님 「사랑방에 있는 지도는 제거하고」 */
import 건설소식 from '../tools/건설소식.jsx'   /* 📰 G128 — 지도 아래 «오늘의 건설 소식» · 💬 이야기하기 → 글쓰기 칸 */
/* 🗺 G147 (2026-10-05) 사랑방 → 맵톡 — 큰 지도 위 글쓰기 · 글 = 핀(시·군) · 방은 저절로(같은 주제 10개) · 사진 한 장 */
import 맵톡지도 from '../tools/맵톡지도.jsx'
import { 주제들, 주제짐작, 넣을방, 고칠방들, 운영자글방, 방나누기, 글나누기, 자리짐작, 짧은이름, 곳찾기, 카드크기, 물음인가, 한마디인가, 사진줄이기, 사진크기한도, 방기준, 답나무, 첫줄, 누적셈, 시도차례, 시도별, 곳기억읽기, 곳기억하기 } from '../lib/맵톡.js'
import { 세기 } from '../lib/받은수.jsx'
import { 받는꼴, 파일검사, 압축검사, 확장자, 파일올리기, 크기글, 오늘올린수, 올린수더하기, 하루한도 } from '../lib/파일올리기.js'   /* 📎 G158 · 🗜 G196 압축검사 */

/* 🕰 G148 (2026-10-05) 소장님 「글을쓴 날짜 시간도 보이게 해주고」 — 카드 «10.05 22:47» · 글 창 «2026.10.05(월) 22:47 · 5분 전» · 답글 «10.05(월) 13:15».
   올해가 아니면 앞에 해(2025.12.30). 흐르는 띠 · 위 알림은 «5분 전» 그대로(살아 있게) */
const 요일 = ['일', '월', '화', '수', '목', '금', '토']
const 날시 = (ms, { 해 = false, 요 = false } = {}) => {
  if (!ms) return ''
  const d = new Date(ms)
  const p2 = (n) => String(n).padStart(2, '0')
  const 앞 = 해 || d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()}.` : ''
  return `${앞}${p2(d.getMonth() + 1)}.${p2(d.getDate())}${요 ? `(${요일[d.getDay()]})` : ''} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}

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

/* 💬 2026-09-29 — /qna/{글번호} : 글마다 한 장 (소장님 「사랑방 글도 페이지 넣어서 검색 되게」 → 「다 페이지 달아 줘」)
   prerender.py 가 글 · 답글을 구워 <script id="qdata"> 에 실어 둡니다(전화번호 · 메일은 가림, lib/가림.js 와 같은 규칙).
   ⚠️ 데이터베이스를 못 읽어도(크롤러 · 느린 망) 구운 글을 그대로 그립니다 — «못 받은 것» 을 «없는 글» 로 그리면
      구운 글이 빈 화면으로 덮여 검색에서 빠집니다(lib/baked.js 와 같은 교훈). «없는 글» 은 읽기에 성공했는데 없을 때만. */
function 구운글(번호) {
  try {
    const el = document.getElementById('qdata')
    const v = el ? JSON.parse(el.textContent || 'null') : null
    return v && v.id === 번호 ? v : null
  } catch (e) { return null }
}

export default function Qna() {
  const [rows, setRows] = useState(null)
  const [ans원, setAns] = useState({})        // { 질문id: [답변…] } — 화면은 아래 ans(몰래 차단 거른 것)를 씁니다
  const [del, setDel] = useState({})
  /* 🗺 G147 — 글은 옆 창(폰은 아래 창)으로 엽니다. 뒤로 가기 한 번이면 닫힘(화면 기록 '맵톡글') */
  const [열린, set열린, 열린닫기] = use화면상태('맵톡글', null)
  /* 💬 /qna/{글번호} — 이 글 하나를 창으로 열어 둡니다 */
  const { id: 글번호 } = useParams()
  const open = 열린 || 글번호 || null
  const [새글번호, set새글번호] = useState(null)   /* 방금 올린 글 — 핀이 떨어지고 카드가 써지듯 나타남 */
  const [새방, set새방] = useState(null)           /* 방금 생긴 방 — 첫 화면에 한 번 */
  const 방감시 = useRef(false)
  const [지도바탕, set지도바탕] = useState(null)   /* 시·군 이름(곳) — data/한국지도.json */
  useEffect(() => { import('../data/한국지도.json').then((m) => set지도바탕(m.default || m)).catch(() => {}) }, [])
  const [따로글, set따로글] = useState(null)   // 목록(최근 300)에 없는 글 · 구운 글
  const [없는글, set없는글] = useState(false)
  /* 🧭 2026-09-27 — 글쓰기 칸도 뒤로가기 한 칸 (lib/길기록.js) */
  const [write, setWrite, 글쓰기닫기] = use화면상태('글쓰기', false)
  const [mine, setMine] = useState(loadMine)
  /* 🔔 G73 — 글을 쓴 적이 있고, 폰 알림을 아직 «허용/차단» 하지 않은 기기에만 단추 하나 */
  const [폰켤단추, set폰켤단추] = useState(() => { try { return 푸시되나() && Notification.permission === 'default' && loadMine().length > 0 } catch (e) { return false } })
  const [폰말, set폰말] = useState('')
  /* 🛠 2026-09-17 — 소장님: 「관리자 페이지 어디에 있지?」
     주소는 /admin 인데 **어디에도 길이 없었습니다.** 외워서 치셔야 했습니다.
     → 운영자 브라우저일 때만 여기에 단추를 답니다. 사랑방이 «답글 달러 오는 자리» 라 제자리입니다.
     ⚠️ 이용자에게는 아무것도 안 보입니다. */
  const [나운영자, set나운영자] = useState(false)
  const [onlyMine, setOnlyMine] = useState(false)
  const [q, setQ] = use남김('kcm.qna.찾기', '', 'session')
  /* 🗺 G147 — 말머리 칩 대신 «방»(저절로 생김). 'all' · 주제 열쇠(kcm·bid…) · '답기다림'(운영자) */
  const [방고름, set방고름] = use남김('kcm.qna.방', 'all', 'session')
  /* 🤝 2026-09-27 — 공고 카드에서 «구성원 구하는 글 쓰기» · «이 공고 글 보기» 로 들어온 경우(주소 뒤 state).
     새글 = { c: 말머리, t: 제목, b: 본문 } — 한 번만 씁니다(글을 올리거나 닫으면 비웁니다). */
  const loc = useLocation()
  const 가기 = useNavigate()
  const [새글, set새글] = useState(() => (loc.state && loc.state.새글) || null)
  /* 🩹 2026-09-28 — 공고에서 «이 공고 구성원 글» 로 왔을 때: { no, 이름, 초안 } — 찾는 띠·빈 화면 글을 그 공고에 맞춥니다 */
  const [공고찾기, set공고찾기] = useState(null)
  const 찾기띠 = useRef(null)
  /* 🩹 G155 (2026-10-06) 소장님 「맵톡에서 내가 쓰는 글 보기 클릭해도 안나오는 것 같아」 — «내 글» 을 누르면 목록이 바뀌는 곳이
     지도 · 글쓰기 아래라 폰에서는 화면이 그대로인 것처럼 보였습니다 → 누르면 «내가 쓴 글만 보는 중» 줄로 내려 갑니다 */
  const 내글보러 = useRef(false)
  useEffect(() => {
    const st = loc.state || {}
    if (!st.찾기 && !st.새글) return
    if (st.찾기) {
      setQ(String(st.찾기)); set방고름('all')
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
  const [seen, setSeen] = useState(loadSeen)
  /* 📌 고정 글(qna_top) · 🔑 나(지금 번호·옛 번호) — 둘 다 «못 읽어도» 게시판은 그대로 뜹니다 */
  const [고정, set고정] = useState({})
  const [나, set나] = useState(null)
  /* 🙈 2026-10-01 (G101) 몰래 차단 — sb 표시가 붙은 글 · 답글은 쓴 기기(번호가 나)와 운영자에게만 보입니다(lib/차단.js) */
  const 보임 = (x) => !x || !x.sb || 나운영자 || (!!나 && !!x.uid && (x.uid === 나.uid || x.uid === 나.r))
  const ans = useMemo(() => {
    const o = {}
    for (const [k, m] of Object.entries(ans원 || {})) {
      const g = {}
      for (const [id, x] of Object.entries(m || {})) if (보임(x)) g[id] = x
      o[k] = g
    }
    return o
  }, [ans원, 나, 나운영자])   // eslint-disable-line react-hooks/exhaustive-deps
  const [다보기, set다보기] = useState(false)
  /* 🎁 👍 · 👑 — 못 읽어도 게시판은 그대로 */
  const [좋아요, set좋아요] = useState({})
  const [조회, set조회] = useState({})   /* 👁 {글번호: 수} (G95) */
  const [답좋아요, set답좋아요] = useState({})
  const [왕들, set왕들] = useState({})
  /* 📖 공지 — 처음 온 기기 · 바뀐 판에서만 펼친 채로 */
  const [공지열림, set공지열림] = useState(() => { try { return localStorage.getItem(공지열쇠) !== 공지판 } catch (e) { return true } })
  const [공지탭, set공지탭] = useState('활용')
  const 공지닫기 = () => { set공지열림(false); try { localStorage.setItem(공지열쇠, 공지판) } catch (e) { /* 사생활 창 */ } }

  const load = async () => {
    /* ⚡ G155 (2026-10-06) 소장님 「이제 3개 글이 다 보여, 반응이 느린 것 같아. 바로 반응오게 고쳐줘」
       전엔 글 → 📌 고정 → 🔑 나(내 번호) → 👍 공감 → 👁 조회수를 «하나씩 차례로» 기다렸습니다. 그래서 글은 떴는데
       «내 글» 이 한참 뒤에야 찼습니다(폰: «내 글 1» → 조금 뒤 «내 글 3»). 이제 다섯 가지를 «한꺼번에» 묻고,
       글 · 고정 · 나는 «같이» 그립니다 — 글이 뜨는 그 순간 «내 글» 숫자도 맞습니다.
       고정 · 나 · 공감 · 조회수는 따로 .catch — 규칙이 없거나 막혀도 게시판은 그대로 뜹니다(옛 주의 그대로). */
    const 없어도 = (pr) => Promise.resolve(pr).catch(() => null)
    const 붙음 = loadFb().then(async (fb) => { await fb.ensureAnon(); return fb })
    /* 🧹 2026-09-29 — 구인구직(jobs) 글을 여기 같이 띄우던 것을 뺐습니다(소장님: 사랑방은 «후기·건의 · K-건설맵» 둘만).
       구인구직 화면(/jobs)과 그 자료는 그대로입니다. 사랑방에서 구인·구직 이야기는 후기·건의에 씁니다. */
    const 글읽기 = 붙음.then(({ ref, get, query, orderByKey, limitToLast, db }) => Promise.all([
      get(query(ref(db, 'qna'), orderByKey(), limitToLast(LIMIT))),
      get(ref(db, 'qna_del')),
      get(ref(db, 'qna_a')),
    ]))
    const 고정읽기 = 없어도(붙음.then(({ ref, get, db }) => get(ref(db, 'qna_top'))).then((x) => (x ? x.val() || {} : null)))
    const 나읽기 = 없어도(붙음.then(() => 뿌리찾기()))
    const 곁 = 없어도(붙음.then(() => 좋아요읽기()))
    const 조회읽기 = 없어도(붙음.then(({ ref, get, db }) => get(ref(db, 'qna_v'))).then((x) => (x ? x.val() || {} : null)))
    let 글 = null
    try { 글 = await 글읽기 } catch (e) { 글 = null }
    /* 한 번에 그립니다(React 18 이 묶음) — 고정 글이 피드에 잠깐 떴다가 옆 칸으로 튀는 일도 없습니다.
       다만 고정 · 나가 글보다 «0.4초 넘게» 늦으면 글부터 그리고, 온 뒤에 채웁니다(글을 붙잡아 두지 않게). */
    const 늦어도 = (pr) => Promise.race([pr, new Promise((r) => setTimeout(() => r(undefined), 400))])
    const [g, me] = await Promise.all([늦어도(고정읽기), 늦어도(나읽기)])
    if (g) set고정(g); else if (g === undefined) 고정읽기.then((x) => { if (x) set고정(x) })
    if (me) set나(me); else if (me === undefined) 나읽기.then((x) => { if (x) set나(x) })
    if (글) {
      const [a, b, c] = 글
      setDel(b.val() || {})
      setAns(c.val() || {})
      const v = a.val() || {}
      setRows(Object.entries(v).map(([id, x]) => ({ id, ...x })).reverse())
    } else setRows([])
    await 곁
    const v = await 조회읽기
    if (v) set조회((m) => { const n = { ...v }; Object.keys(m).forEach((k) => { if ((m[k] || 0) > (n[k] || 0)) n[k] = m[k] }); return n })
  }
  const 좋아요읽기 = async () => {
    try {
      const { ref, get, db } = await loadFb()
      const [a, b, c] = await Promise.all([get(ref(db, 'qna_like')), get(ref(db, 'qna_alike')), get(ref(db, 'qna_king'))])
      set좋아요(a.val() || {}); set답좋아요(b.val() || {}); set왕들(c.val() || {})
    } catch (e) { /* 👍 없이 */ }
  }
  useEffect(() => { load() }, [])
  /* 💬 구운 글이 있으면 먼저 그립니다(데이터베이스를 읽으면 그것으로 바뀝니다) */
  useEffect(() => {
    set따로글(null); set없는글(false)
    if (!글번호) return
    const v = 구운글(글번호)
    if (v) {
      const y = { id: v.id, t: v.t, b: v.b, nick: v.nick, at: v.at, e: v.e || 0, c: v.c, 옛: v.옛 || '', k: v.k || '' }
      y.주제 = 주제짐작(y, isOp)   /* 🩹 G211 구운 글도 방을 알게 */
      set따로글(y)
      setAns((a) => (a[v.id] ? a : { ...a, [v.id]: Object.fromEntries((v.ans || []).map((x) => [x.id, x])) }))
    }
    try { window.scrollTo(0, 0) } catch (e) { /* 옛 브라우저 */ }
  }, [글번호])
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

  /* 사랑방 글 — 지운 것만 먼저 걸러 둡니다(셈에도 쓰니까). 옛 말머리(질문·공동도급…)는 r.옛 으로 남습니다 */
  const 모두 = useMemo(() => {
    if (!rows) return null
    return rows.filter((r) => !r.deleted && !del[r.id] && 보임(r))
      .map((r) => { const g = 갈래떼기(r.t); const x = { ...r, c: g.c, t: g.t, 옛: g.옛 || '' }; x.주제 = 주제짐작(x, isOp); return x })
      .sort((a, b) => (b.at || 0) - (a.at || 0))
  }, [rows, del, 나, 나운영자])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 💬 /qna/{글번호} — 목록(최근 300)에 있으면 그것, 없으면 한 편만 따로 읽습니다 */
  const 이글 = useMemo(() => {
    const r = 글번호 ? ((모두 || []).find((x) => x.id === 글번호) || 따로글) : null
    return r && 보임(r) ? r : null
  }, [글번호, 모두, 따로글, 나, 나운영자])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!글번호 || rows === null || (모두 || []).some((r) => r.id === 글번호)) return undefined
    let 살 = true
    ;(async () => {
      try {
        const { ref, get, db, ensureAnon } = await loadFb()
        await ensureAnon()
        const [a, d, c] = await Promise.all([get(ref(db, `qna/${글번호}`)), get(ref(db, `qna_del/${글번호}`)), get(ref(db, `qna_a/${글번호}`))])
        if (!살) return
        const x = a.val()
        if (!x || x.deleted || d.exists()) { set따로글(null); set없는글(true); return }
        const g = 갈래떼기(x.t)
        const y = { id: 글번호, ...x, c: g.c, t: g.t, 옛: g.옛 || '' }
        y.주제 = 주제짐작(y, isOp)
        set따로글(y)
        setAns((m) => ({ ...m, [글번호]: c.val() || {} }))
      } catch (e) { /* 못 읽음 — 구운 글이 있으면 그대로 둡니다(없는 글로 그리지 않습니다) */ }
    })()
    return () => { 살 = false }
  }, [글번호, rows, 모두])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 지웠거나 없는 글 — 검색엔진이 빈 주소를 담지 않게 noindex (읽기에 성공했을 때만) */
  useEffect(() => {
    if (!없는글) return undefined
    const el = document.createElement('meta')
    el.setAttribute('name', 'robots'); el.setAttribute('content', 'noindex')
    document.head.appendChild(el)
    return () => { el.remove() }
  }, [없는글])

  /* ✅ 2026-09-29 (클로드 제안) — 후기·건의가 «들렸는지» 보이게: K-건설맵이 답한 글에는 «✅ K-건설맵 답변» 딱지.
     운영자 브라우저에는 «⏳ 답 기다리는 글» 칸 — K-건설맵 답이 아직 없는 후기·건의만(하루 안에 답한다는 약속을 지키는 목록). */
  const op답 = (id) => Object.values(ans[id] || {}).some((x) => x && !x.deleted && x.op)
  const 셈 = useMemo(() => {
    const m = { 전체: (모두 || []).length }
    m.답기다림 = (모두 || []).filter((r) => r.c === '후기·건의' && !고정[r.id] && !op답(r.id) && !isOp(r.uid)   /* 💬 G130 운영자 글은 공지가 아니어도 답 기다림에서 뺌(사례 · 카페 답 옮긴 글) */).length
    return m
  }, [모두, ans, 고정])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 🔑 «내 글» = 이 브라우저가 적어 둔 목록 + 번호가 나(지금·옛)인 글. 되찾은 뒤엔 옛 글도 여기 들어옵니다. */
  const 내것 = useMemo(() => {
    const m = new Set(mine)
    if (나 && 모두) 모두.forEach((r) => { if (!r.구인구직 && r.uid && (r.uid === 나.uid || r.uid === 나.r)) m.add(r.id) })
    return m
  }, [mine, 나, 모두])

  /* 📌 도구 사용법 — 운영자가 꽂은 글. 먼저 꽂은 것이 위(공사일보 → 바로투찰 → …). */
  const 고정목록 = useMemo(() => (모두 || []).filter((r) => 고정[r.id] && r.id !== 글번호)
    .sort((a, b) => Number(고정[a.id]) - Number(고정[b.id])), [모두, 고정, 글번호])
  const 기본보기 = 방고름 === 'all' && !onlyMine && !q.trim()

  const list = useMemo(() => {
    if (!모두) return null
    const s = q.trim()
    return 모두.filter((r) => {
      if (기본보기 && 고정[r.id]) return false   /* 옆 📌 도구 사용법 칸에 이미 있습니다 */
      if (방고름 === '답기다림') { if (r.c !== '후기·건의' || op답(r.id) || 고정[r.id] || isOp(r.uid)) return false }
      else if (방고름 !== 'all' && r.주제 !== 방고름) return false
      if (onlyMine && !내것.has(r.id)) return false
      if (s && !((r.t || '') + (r.b || '')).includes(s)) return false
      return true
    })
  }, [모두, q, onlyMine, 내것, 방고름, 고정, 기본보기, ans])   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onlyMine || !내글보러.current) return
    내글보러.current = false
    const t = setTimeout(() => { const el = 찾기띠.current; if (el) { try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }) } catch (e) { el.scrollIntoView() } } }, 60)
    return () => clearTimeout(t)
  }, [onlyMine])
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

  /* 📌 «오늘의 K-건설맵» 칸은 G147 맵톡에서 «K-건설맵 소식» 방으로 갈음했습니다 */

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

  /* 👁 조회 세기 (G95) — 펼친 글이 바뀔 때 한 번. 목록을 받은 뒤라야 글쓴이를 압니다 */
  const 받음 = rows !== null
  useEffect(() => {
    if (!open || !받음 || 봇같음()) return
    const id = open
    let 본 = {}
    try { 본 = JSON.parse(localStorage.getItem(조회열쇠) || '{}') || {} } catch (e) { 본 = {} }
    const 오늘 = 오늘날()
    if (본[id] === 오늘) return
    ;(async () => {
      try {
        const { ref, get, runTransaction, db, ensureAnon } = await loadFb()
        const u = await ensureAnon()
        if (!u || isOp(u.uid)) return                       /* 운영자는 안 셈 */
        const 뿌리 = await 뿌리찾기()
        const r = (모두 || []).find((x) => x.id === id) || (따로글 && 따로글.id === id ? 따로글 : null)
        const 쓴이 = r ? r.uid : (await get(ref(db, `qna/${id}/uid`))).val()
        if (!쓴이 || 쓴이 === 뿌리.uid || 쓴이 === 뿌리.r || 내것.has(id)) return   /* 글쓴이 본인 · 없는 글 */
        /* 먼저 적어 둡니다 — 빨리 접었다 펴도 두 번 세지 않게 */
        본[id] = 오늘
        const 키 = Object.keys(본); if (키.length > 400) 키.slice(0, 키.length - 400).forEach((k) => { delete 본[k] })
        try { localStorage.setItem(조회열쇠, JSON.stringify(본)) } catch (e) { /* 사생활 창 — 그래도 셉니다 */ }
        const t = await runTransaction(ref(db, `qna_v/${id}`), (v) => (Number(v) || 0) + 1)
        if (t.committed) { const n = Number(t.snapshot.val()) || 0; set조회((m) => ({ ...m, [id]: Math.max(n, m[id] || 0) })) }
      } catch (e) { /* 규칙 전 · 막힘 — 조회수 없이 */ }
    })()
  }, [open, 받음])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 글을 펼치면 «봤다» 고 적어 둡니다 — 빨간 띠가 사라지는 자리입니다.
     🗺 G147 맵톡 — 펼치기 대신 옆 창(폰은 아래 창)으로 엽니다. 뒤로 가기 한 번이면 닫힙니다(lib/길기록.js) */
  const 예약 = useRef(0)          // ⬆ G148 내 글 맨 위로 — 늦게 여는 창. 그 사이 다른 것을 열거나 닫으면 안 엽니다
  const 열기 = (id, 어디) => {
    예약.current++
    set열린(id)
    if (어디 === '핀') 세기('|맵톡|핀')
    if (내것.has(id)) {
      const v = { ...loadSeen(), [id]: nAns(id) }
      saveSeen(v); setSeen(v)
    }
  }
  const 닫기 = () => {
    예약.current++
    if (열린) 열린닫기(null)
    else if (글번호) 가기('/qna')
  }

  /* ⬆ G148 내 글 맨 위로 — 소장님 「자기가 쓴글을 터치 하면 그 글이 있는 카드가 제일 위쪽으로」 → 고르심 «내 화면에서만»
     내 글 카드(또는 지도의 내 핀)를 누르면 그 카드가 맨 앞 칸으로 날아가고(나머지는 한 칸씩 밀림 · FLIP) 빛난 뒤 글 창이 열립니다.
     남의 화면 순서는 그대로 · 새로고침하면 원래 자리 · 📊 |맵톡|내글올림 */
  const [올림, set올림] = useState(null)
  const [빛, set빛] = useState(null)
  const 앞자리 = useRef(null)
  /* 💬 G161 (2026-10-06) 소장님 「배치가 너무 단조로워」 → 고르심 ①높이 자동 ②인사 글 묶음 ④방 색 (③⑤⑥⑦은 글이 쌓이면)
     ② 짧은 인사 · 응원 · 수다(lib/맵톡.js 한마디인가)는 카드 대신 맨 위 «💬 고마워요 · 한마디» 띠에 말풍선으로.
     «전체» 보기에서만 · 셋 이상일 때만 · 내 글은 내 화면에선 카드 그대로(방금 쓴 글이 안 보이는 일 없게). 누르면 똑같이 열립니다. */
  const 한마디들 = useMemo(() => {
    if (!list || !기본보기) return []
    const x = list.filter((r) => !내것.has(r.id) && 한마디인가(r))
    return x.length >= 3 ? x : []
  }, [list, 기본보기, 내것])
  const 카드바탕 = useMemo(() => {
    if (!list || !한마디들.length) return list
    const 뺄 = new Set(한마디들.map((r) => r.id))
    return list.filter((r) => !뺄.has(r.id))
  }, [list, 한마디들])
  const [한마디다, set한마디다] = useState(false)
  const 보이는목록 = useMemo(() => {
    if (!카드바탕 || !올림) return 카드바탕
    const i = 카드바탕.findIndex((r) => r.id === 올림)
    return i <= 0 ? 카드바탕 : [카드바탕[i], ...카드바탕.slice(0, i), ...카드바탕.slice(i + 1)]
  }, [카드바탕, 올림])

  /* 🧱 G161 ① 높이 자동(벽돌 쌓기) — 칸 높이 2px · 카드마다 제 높이만큼 칸을 차지(--rs). 짧은 글은 낮게 · 긴 글은 길게.
     폰(한 줄)은 그대로. 카드 높이가 바뀌면(사진이 늦게 뜸 · 창 너비) ResizeObserver 가 다시 잽니다. */
  const 판 = useRef(null)
  const 벽돌됨 = typeof ResizeObserver !== 'undefined'
  useLayoutEffect(() => {
    const g = 판.current
    if (!g || !벽돌됨) return undefined
    const 재기 = (el) => { const n = Math.max(1, Math.ceil((el.offsetHeight + 14) / 2)); if (el.style.getPropertyValue('--rs') !== String(n)) el.style.setProperty('--rs', String(n)) }
    const ro = new ResizeObserver((es) => es.forEach((e) => 재기(e.target)))
    g.querySelectorAll('.mt-card').forEach((el) => { 재기(el); ro.observe(el) })
    return () => ro.disconnect()
  }, [보이는목록])   // eslint-disable-line react-hooks/exhaustive-deps
  const 자리재기 = () => {
    const m = {}
    document.querySelectorAll('.mt-feed .mt-card[data-id]').forEach((el) => { m[el.dataset.id] = el.getBoundingClientRect() })
    return m
  }
  useLayoutEffect(() => {
    const 앞 = 앞자리.current
    앞자리.current = null
    if (!앞) return
    let 줄임 = false
    try { 줄임 = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) { /* 옛 브라우저 */ }
    if (줄임) return
    const 움직인 = []
    document.querySelectorAll('.mt-feed .mt-card[data-id]').forEach((el) => {
      const a = 앞[el.dataset.id]
      if (!a) return
      const b = el.getBoundingClientRect()
      const dx = a.left - b.left, dy = a.top - b.top
      if (!dx && !dy) return
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
      el.style.zIndex = el.dataset.id === 올림 ? '3' : ''
      움직인.push(el)
    })
    if (!움직인.length) return
    void document.body.offsetHeight
    requestAnimationFrame(() => {
      움직인.forEach((el) => { el.style.transition = 'transform .7s cubic-bezier(.2,.85,.25,1)'; el.style.transform = '' })
      setTimeout(() => 움직인.forEach((el) => { el.style.transition = ''; el.style.zIndex = '' }), 760)
    })
  }, [보이는목록])   // eslint-disable-line react-hooks/exhaustive-deps
  const 내글올리기 = (id, 어디) => {
    const 목록 = 보이는목록 || []
    const i = 목록.findIndex((r) => r.id === id)
    if (i < 0) { 열기(id, 어디); return }
    세기('|맵톡|내글올림')
    if (i > 0) 앞자리.current = 자리재기()
    set올림(id); set빛(null)
    requestAnimationFrame(() => set빛(id))
    setTimeout(() => set빛((v) => (v === id ? null : v)), 2200)
    setTimeout(() => {
      const f = document.querySelector('.mt-feed')
      if (f) { try { window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }) } catch (e) { /* 옛 브라우저 */ } }
    }, 40)
    const 내차례 = ++예약.current
    setTimeout(() => { if (예약.current === 내차례) 열기(id, 어디) }, i > 0 ? 1500 : 900)
  }
  const 누르기 = (id, 어디) => (내것.has(id) ? 내글올리기(id, 어디) : 열기(id, 어디))
  useEffect(() => {
    const 멈춤 = () => { 예약.current++ }
    const 키 = (e) => { if (e.key === 'Escape') 예약.current++ }
    window.addEventListener('popstate', 멈춤)
    window.addEventListener('keydown', 키)
    return () => { window.removeEventListener('popstate', 멈춤); window.removeEventListener('keydown', 키); 예약.current++ }
  }, [])
  useEffect(() => {
    if (!open) return undefined
    const k = (e) => { if (e.key === 'Escape') 닫기() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, 열린, 글번호])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 🗺 방 — 같은 주제가 30개(G226 · 전엔 10) 모이면 저절로(lib/맵톡.js). 글을 올린 뒤 새로 생긴 방이 있으면 첫 화면에 한 번 알립니다 */
  const 방들 = useMemo(() => 방나누기(모두 || []), [모두])
  /* 🩹 G226 (2026-10-10) 소장님 「지금 현재 올릴 방하고, 아래쪽 방이 다르잖아」 — 글쓰기 · 고치기의 방 칩도 아래 «방» 줄과 같은 방(10개 넘게 모인 방)만, 같은 차례로 */
  const 있는방 = useMemo(() => 방들.방.map((x) => x.k), [방들])
  const 옛방 = useRef(null)
  useEffect(() => {
    if (!모두) return undefined
    const 지금 = new Set(방들.방.map((x) => x.k))
    const 앞 = 옛방.current
    옛방.current = 지금
    if (!앞 || !방감시.current) return undefined
    방감시.current = false
    const 새 = 방들.방.find((x) => !앞.has(x.k))
    if (!새) return undefined
    set새방({ k: 새.k, 이름: 새.이름, 색: 새.색 })
    세기('|맵톡|방생김')
    const t = setTimeout(() => set새방(null), 4300)
    return () => clearTimeout(t)
  }, [방들])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 📊 G148 지금까지(누구나 봄) — 글 · 답글 · 공감 · 사진, 실제 자료로 */
  const 누적 = useMemo(() => 누적셈(모두 || [], ans, 좋아요, 답좋아요), [모두, ans, 좋아요, 답좋아요])

  /* 공감 · 답글 많은 글 둘은 크게(카드 두 칸) — 공감 둘 · 공감+답 하나쯤은 넘어야(감사 한 줄이 크게 뜨지 않게) */
  const 큰글 = useMemo(() => {
    const 점 = (r) => 3 * n좋아요(r.id) + 2 * nAns(r.id) + Math.min(10, Math.floor((조회[r.id] || 0) / 10))
    return new Set((카드바탕 || []).filter((r) => !r.p).map((r) => [r.id, 점(r)]).filter(([, s]) => s >= 5)
      .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id))
  }, [카드바탕, 좋아요, ans, 조회])   // eslint-disable-line react-hooks/exhaustive-deps

  /* ♥ G157 (2026-10-06) 소장님 「다른 사이트 처럼,,,하트가 안으로 들어가고」 「하트도 보여야 하고, 글쓰기가 안으로 들어가야 하지 않아?」
     카드에서 바로 누르던 ♥ 공감을 뺐습니다 — 카드는 숫자(♥ 공감 · 💬 답글 · 👁 조회), 누르기 · 쓰기는 글을 열고 안에서.
     단 답 없는 질문의 «답하기» 는 남김(답을 부르는 단추) — 누르면 답글 칸이 열린 채로 엽니다(답하러). */
  const [답하러, set답하러] = useState(null)
  /* ♥ G164 (2026-10-06) 소장님 「난 왜 하트 클릭이 안돼. 맵톡에서」 「내가 쓴 글이 아닌데도 안돼」 → 「해」
     G157 때 카드 ♥ 는 «누르면 글이 열리는 숫자» 로만 두어, 카드에서 누르면 공감이 안 되는 것처럼 보였음.
     이제 카드 ♥ 를 누르면 글을 열지 않고 그 자리에서 공감 · 한 번 더 누르면 뺌(먼저 화면에 · 서버가 막으면 되돌림).
     내 글이면 «내 글은 다른 분이 공감합니다» 말풍선만. 📊 |맵톡|카드공감 */
  const [하트임시, set하트임시] = useState({})     // { 글번호: true(누름) | false(뺌) } — 서버 답 오기 전
  const [하트말, set하트말] = useState(null)
  const 내글인가 = (r) => 내것.has(r.id) || (!!나 && !!r.uid && (r.uid === 나.uid || r.uid === 나.r))
  const 하트눌림 = (id) => (id in 하트임시 ? 하트임시[id] : !!(나 && (좋아요[id] || {})[나.r]))
  const 하트수 = (id) => { const 원 = n좋아요(id), 원눌림 = !!(나 && (좋아요[id] || {})[나.r]); return id in 하트임시 ? 원 + (하트임시[id] === 원눌림 ? 0 : (하트임시[id] ? 1 : -1)) : 원 }
  const 카드하트 = async (r) => {
    if (내글인가(r)) { set하트말(r.id); setTimeout(() => set하트말((v) => (v === r.id ? null : v)), 1800); return }
    if (!나) { 열기(r.id); return }
    if (r.id in 하트임시) return              /* 누르는 중 */
    const 켬 = !하트눌림(r.id)
    set하트임시((m) => ({ ...m, [r.id]: 켬 }))
    const ok = await 좋아요누름(`qna_like/${r.id}`, 켬)
    set하트임시((m) => { const x = { ...m }; delete x[r.id]; return x })
    if (ok && 켬) 세기('|맵톡|카드공감')
    if (!ok) { set하트말('못함:' + r.id); setTimeout(() => set하트말((v) => (v === '못함:' + r.id ? null : v)), 2200) }
  }
  const 카드 = (r) => {
    const t = 주제들[r.주제] || 주제들.talk
    const n = nAns(r.id)
    const 곳 = r.g ? 곳찾기(지도바탕, r.g) : null
    const 크기 = 카드크기(r, 큰글.has(r.id) ? 0 : undefined)
    const 제목 = 가림(r.t)
    const 본문 = 가림(r.b || '')
    return (
      <article key={r.id} data-id={r.id} style={{ '--rc': t.색 }} className={'mt-card' + (크기 ? ' ' + 크기 : '') + (r.id === 새글번호 ? ' fresh' : '') + (고정[r.id] ? ' pinned' : '') + (빛 === r.id ? ' lifted' : '')}>
        <div className="mt-meta">
          {/* 🎨 G161 ④ 방 색 — 카드 위 색 띠 · 아주 옅은 바탕 · 방 이름 글씨(색은 styles.css 가 --rc 로 · 어두운 화면은 밝게) */}
          <span className="mt-tag"><i />{t.이름}</span>
          {곳 && <span className="mt-where">{짧은이름(곳.n)}</span>}
          <span className="mt-date" title={언제(r.at)}>· {날시(r.at)}</span>
          {고정[r.id] && <span title="도구 사용법">📌</span>}
          {r.sb && 나운영자 && <b>🙈</b>}
        </div>
        <button type="button" className="mt-open" onClick={() => 누르기(r.id)}>
          {r.p && <img className="mt-photo" src={r.p} alt="" loading="lazy" />}
          <span className="mt-say">{제목}</span>
          {본문 && <span className="mt-rest">{본문.slice(0, 160)}</span>}
          {파일있음(r) && <span className="mt-fileline">📎 {r.f.n}</span>}
        </button>
        <div className="mt-foot">
          {/* 숫자만 — 누르면 글이 열리고, 공감 · 답글은 그 안에서 */}
          <button type="button" className={'mt-act mt-cnt mt-heart' + (하트눌림(r.id) ? ' on' : '')} onClick={() => 카드하트(r)} aria-pressed={하트눌림(r.id)}
            aria-label={`공감 ${하트수(r.id)}${내글인가(r) ? ' · 내 글' : 하트눌림(r.id) ? ' · 누르면 공감 빼기' : ' · 누르면 공감'}`}
            title={내글인가(r) ? '내 글 — 공감은 다른 분이 누릅니다' : 하트눌림(r.id) ? '공감했습니다 — 한 번 더 누르면 뺍니다' : '누르면 공감'}>♥ {하트수(r.id)}
            {하트말 === r.id && <span className="mt-heart-tip" role="status">내 글은 다른 분이 공감합니다</span>}
            {하트말 === '못함:' + r.id && <span className="mt-heart-tip" role="status">공감을 누르지 못했습니다 — 잠시 뒤 다시</span>}
          </button>
          <button type="button" className="mt-act mt-cnt" onClick={() => 열기(r.id)} aria-label={`답글 ${n} · 글 열기`} title="답글 — 글을 열어 씁니다">💬 {n}</button>
          {/* 👁 G156 (2026-10-06) 소장님 「맵톡에 왜 조회가 없지? 이거 꼭 있어야 해....」 — 세기는 G95 그대로(같은 기기 하루 한 번 ·
              글쓴이 본인 · 운영자 · 검색 로봇은 안 셈). 전엔 글을 펼쳐야만 · 1 이상일 때만 보였습니다 → 카드마다 늘 보이게. */}
          <span className="mt-act mt-view" title="조회 — 같은 기기는 하루 한 번만 셉니다(글쓴이 · 운영자는 안 셈)" aria-label={`조회 ${조회[r.id] || 0}`}>👁 {Number(조회[r.id] || 0).toLocaleString('ko-KR')}</span>
          {op답(r.id) && r.c !== 'K-건설맵' && !isOp(r.uid) && <span className="mt-ok">✅ K-건설맵</span>}
          {/* 💬 «답하기» 는 남김(소장님 고르심 2026-10-06 「남겨두는 쪽으로 해줘」) — 답 없는 질문에만 · 누르면 글이 열리고 답글 칸이 열린 채로 */}
          {!n && 물음인가(r.t + ' ' + (r.b || '')) && <button type="button" className="mt-ask" onClick={() => { set답하러(r.id); 열기(r.id); 세기('|맵톡|답하기') }}>답하기</button>}
          <span className="mt-nick">{배지(r.uid)}{r.nick || '익명'}{내것.has(r.id) ? ' · 내 글' : ''}</span>
        </div>
      </article>
    )
  }

  /* 옆 창(폰은 아래 창)에 띄울 글 */
  const 창글 = open ? ((모두 || []).find((x) => x.id === open) || (이글 && 이글.id === open ? 이글 : null)) : null
  const 창곳 = 창글 && 창글.g ? 곳찾기(지도바탕, 창글.g) : null

  return (
    <div className="mt-page">
      <맵톡지도 글들={모두 || []} 새글번호={새글번호} 열기={누르기} 새방={새방} 누적={누적}>
        <맵톡글쓰기 key={새글 ? '초안:' + (새글.t || '') : '빈칸'} 첫글={새글} 나운영자={나운영자} 방고름={방고름} 있는방={있는방}
          onDone={(id) => {
            set새글(null); 방감시.current = true; set새글번호(id)
            setTimeout(() => set새글번호((v) => (v === id ? null : v)), 3200)
            load(); setMine(loadMine())
          }} />
      </맵톡지도>

      {/* 방금 올라온 글 — 흐르는 띠(최근 글 여덟 · 같은 줄을 두 번 이어 끊김 없이) */}
      {모두 && 모두.length > 0 && (
        <div className="mt-ticker" aria-label="방금 올라온 글">
          <div className="mt-run">
            {[0, 1].map((회) => 모두.slice(0, 8).map((r) => {
              const 곳 = r.g ? 곳찾기(지도바탕, r.g) : null
              return <button type="button" key={회 + r.id} className="mt-tk" onClick={() => 열기(r.id)} tabIndex={회 ? -1 : 0}>
                <em>{곳 ? 짧은이름(곳.n) : (주제들[r.주제] || 주제들.talk).이름}</em><b>{가림(r.t).slice(0, 40)}</b>
              </button>
            }))}
          </div>
        </div>
      )}

      <div className="wrap mt-main">
        {/* 🔴 내 글에 새 답글 — 이것이 «다시 오게» 만듭니다. 가입도 메일도 없이. (8절 69) */}
        {새답.n > 0 && (
          <button type="button" className="mt-newans" onClick={() => { if (새답.첫) 열기(새답.첫) }}>
            <span className="dot" /><b>내 글에 새 답글 {새답.n}개</b>
            {새답.이름 && <span className="muted nm">「{가림(새답.이름)}」</span>}
            <span className="muted go">눌러서 보기 ▸</span>
          </button>
        )}
        {폰켤단추 && !나운영자 && (
          <div className="noti-on">
            <button className="btn sm line" onClick={async () => {
              const 허락 = 허락묻기()
              const { r } = await 뿌리찾기()
              const 결과 = await 폰알림켜기(r, 허락)
              set폰켤단추(false)
              set폰말(결과 === 'granted' ? '✅ 켰습니다 — 내 글에 답글이 달리면 폰 알림창에 뜹니다.' : 결과 === 'denied' ? '알림을 막아 두셨습니다 — 사이트 안 🔔 로 알려 드립니다.' : '이 기기는 폰 알림이 안 됩니다 — 사이트 안 🔔 로 알려 드립니다.')
            }}>🔔 폰 알림 켜기</button>
            <span className="muted">내 글에 답글이 달리면 폰 알림창에도</span>
          </div>
        )}
        {폰말 && <div className="muted" style={{ fontSize: 12.5, margin: '-2px 0 10px' }}>{폰말}</div>}
        {왕 && <div className="qna-king">👑 <b>{Number(왕.달.slice(5))}월의 답변왕</b> — {왕.nick} <span className="muted">· 고맙습니다!</span></div>}

        {/* 🗺 방 — 고르지 않고 쓴 글이 30개씩(G226 · 전엔 10) 모이면 저절로 생깁니다. 글 수는 지금 보이는 글(최근 300) 기준 */}
        {/* 🩹 G155 (2026-10-06) 소장님 「내 글 세개인데, 하나만 뜨는데, 클릭하면」 — 방(예: 후기·건의)을 골라 둔 채 «내 글» 을 누르면
            «그 방에 든 내 글» 만 남아 숫자(3)와 목록(1)이 달랐습니다. 이제 «내 글» 과 방은 하나만 켜집니다 — 내 글을 누르면 방은 «전체» 로,
            방을 누르면 «내 글» 은 꺼집니다. 그래서 «내 글 N» 이면 늘 N 장이 보입니다. */}
        <nav className="mt-rooms" aria-label="방">
          <span className="mt-lab">방</span>
          <button type="button" className={'mt-room' + (방고름 === 'all' && !onlyMine ? ' on' : '')} aria-pressed={방고름 === 'all'}
            onClick={() => { set방고름('all'); setOnlyMine(false) }}>전체 <em>{(모두 || []).length}</em></button>
          {방들.방.map((x) => (
            <button key={x.k} type="button" className={'mt-room' + (방고름 === x.k ? ' on' : '') + (새방 && 새방.k === x.k ? ' fresh' : '')} aria-pressed={방고름 === x.k}
              onClick={() => { set방고름(x.k); setOnlyMine(false); 세기('|맵톡|방') }}><i style={{ background: x.색 }} />{x.이름} <em>{x.n}</em></button>
          ))}
          {내것.size > 0 && (
            <button type="button" className={'mt-room' + (onlyMine ? ' on' : '')} aria-pressed={onlyMine} onClick={() => { const 켬 = !onlyMine; setOnlyMine(켬); if (켬) { set방고름('all'); 내글보러.current = true; 세기('|맵톡|내글보기') } }}>
              {onlyMine ? '✓ 내 글만' : '내 글'} <em>{내것.size}</em></button>
          )}
          {나운영자 && <button type="button" className={'mt-room' + (방고름 === '답기다림' ? ' on' : '')} onClick={() => { set방고름('답기다림'); setOnlyMine(false) }}>⏳ 답 기다림 <em>{셈.답기다림 || 0}</em></button>}
          {나운영자 && <Link className="mt-room" to="/admin">🛠 관리자</Link>}
          <input className="inp mt-find" placeholder="찾기 — 낱말" value={q} onChange={(e) => setQ(e.target.value)} aria-label="맵톡 글 찾기" />
        </nav>

        {/* 📌 공지 · 활용 방법 · 보상 — 처음 온 기기와 바뀐 판에서만 펼친 채로 */}
        <details className="qna-rule qna-notice" open={공지열림} style={{ marginBottom: 12, lineHeight: 1.85 }}
          onToggle={(e) => { if (!e.currentTarget.open && 공지열림) 공지닫기(); else if (e.currentTarget.open && !공지열림) set공지열림(true) }}>
          <summary style={{ cursor: 'pointer', fontWeight: 800 }}>📌 공지 · 활용 방법 · 🎁 보상 · ⭐ 운영진 모심 <span className="qna-notice-sub">— 눌러서 보기</span></summary>
          <div className="qna-tabs" role="tablist">
            <button role="tab" aria-selected={공지탭 === '활용'} className={'qna-tab' + (공지탭 === '활용' ? ' on' : '')} onClick={() => set공지탭('활용')}>📖 활용 방법</button>
            <button role="tab" aria-selected={공지탭 === '보상'} className={'qna-tab' + (공지탭 === '보상' ? ' on' : '')} onClick={() => set공지탭('보상')}>🎁 보상</button>
          </div>
          {공지탭 === '활용' && (<>
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
              <li><b>🗺 맵톡 — 고를 것 없이 그냥 쓰세요.</b> 질문 · 현장 이야기 · 공동도급 구성원 구하기 · 구인·구직 · 건의 · 후기, 무엇이든 한 칸에 씁니다.
                글을 올리면 <b>내 시·군에 핀</b>이 꽂히고(접속한 곳으로 짐작 — 통신사에 따라 다른 곳으로 잡힐 수 있습니다), 같은 이야기가 <b>{방기준}개 모이면 «방»</b>이 저절로 생깁니다.</li>
              <li><b>📷 사진도 올릴 수 있습니다</b>(한 장 · 크게 찍은 사진은 줄여서 올립니다). 남의 얼굴 · 이름 · 전화번호가 보이는 사진은 올리지 마세요.</li>
              {/* 🩹 G196 소장님 「이상한 파일 이면...이런 거 말고, 그냥, 파일 올릴 수 있다. 이렇게 해줘」 — 막는 것 · 주의 글은 뺌(고를 때 안 되는 것은 그 자리에서 알림) */}
              <li><b>📎 파일도 올릴 수 있습니다</b> — 한글 · 엑셀 · 워드 · PDF · PPT · 압축(zip).</li>
              <li><b>누구나, 어떤 이야기든 좋습니다.</b> 가입·이름 없이 바로 씁니다. 별명은 저절로 붙고, 같은 기기면 늘 같은 별명입니다.</li>
              <li><b>답글은 누구나 답니다.</b> 아는 분이 먼저 답해 주세요 — 현장 경험 한 줄이 제일 큰 도움이 됩니다.
                K-건설맵도 하루 안에 답을 다는 것을 목표로 합니다. K-건설맵이 단 답에는 <b>「K-건설맵」</b> 표가 붙습니다.
                표가 없는 답은 이용자 의견이니 <b>중요한 일은 발주처·전문가에게 한 번 더 확인</b>하십시오.</li>
              <li><b>자료 나눔 환영합니다.</b> 다만 남의 공사명·업체명·사람 이름·전화번호·주민번호는 지우고 올려 주세요.</li>
              <li><b>홍보·광고 글은 1주에 한 번까지.</b> 다만 <b>댓글(답글)은 언제든 다셔도 됩니다.</b> 같은 글을 되풀이하거나 도배하면 지웁니다.</li>
              <li><b>예고 없이 지우는 글:</b> 욕설·비방·특정인 공격 · 남의 개인정보 · 불법(담합·대리입찰 알선 등) · 음란·도박 · 도배</li>
              <li><b>내 글은</b> 열면 <b>✏️ 고치기</b>가 있고(핀이 엉뚱한 곳에 꽂혔으면 거기서 바꿉니다), 글 쓸 때 정한 <b>4자리 숫자</b>로 지웁니다. 다른 기기에서는 먼저 <b>«🔑 내 글 되찾기»</b>.</li>
              <li><b>도구가 안 되거나 고쳤으면 하는 점</b>은 <b>📌 도구 사용법</b> 글에 답글로, 또는 맵톡에 그냥 남겨 주세요 — 바로 살펴 고치겠습니다. 🙏</li>
            </ol>
          </>)}
          {공지탭 === '보상' && (
            <div className="qna-reward">
              <div className="qna-staff">
                <div className="qna-staff-h">⭐ 꾸준히 활동하시는 분을 <u>«K-건설맵 운영진»</u>으로 모시겠습니다 ⭐</div>
                <p>활동해 주시는 분께 <b>명예</b>를 드리고, 나중에 <b>이분들의 의견을 여쭈어</b> —
                  <b> 허락해 주신다면</b> — <b className="qna-staff-em">건설맵 운영진으로 모시려 합니다.</b></p>
                <p className="muted" style={{ margin: 0 }}>맵톡을 함께 꾸려 갈 분을 찾습니다. 👑 답변왕 · 🏅 반장 분들께 먼저 여쭙겠습니다.</p>
              </div>
              <p style={{ margin: '4px 0 8px' }}>맵톡에 <b>도움 되는 글과 답글</b>을 남겨 주시는 분께 감사를 드립니다.</p>
              <ul>
                <li>♥ <b>공감</b> — 글을 열면 글·답글마다 누를 수 있습니다. <b>한 분 한 번</b>, 내 글에는 누를 수 없습니다.</li>
                <li><b>활동 표시</b> — 글 1점 · 답글 2점 · 받은 공감 3점이 쌓이면 별명 옆에 표시가 붙습니다.
                  <div className="qna-lv"><span>🌱 새내기 <i>첫 글</i></span><span>🔨 일꾼 <i>10점</i></span><span>🏅 반장 <i>30점</i></span></div></li>
                <li>👑 <b>이달의 답변왕</b> — 매달 1일, 지난달 가장 도움이 된 분을 K-건설맵이 정해 <b>맵톡 맨 위</b>에 모십니다. 별명 옆에 <b>👑</b>가 한 달 동안 붙습니다.</li>
                <li>광고·도배·같은 사람이 묻고 답하기는 셈에서 뺍니다.</li>
                <li>기기를 바꾸셨다면 글 쓸 때 정한 <b>4자리로 «🔑 내 글 되찾기»</b>를 먼저 해 주세요 — 그래야 같은 분으로 셉니다.</li>
              </ul>
            </div>
          )}
          <button className="qna-read" onClick={공지닫기}>다 읽었습니다 ▲</button>
        </details>

        {/* ⭐ 운영진 모심 — 공지를 접어도 늘 보이는 한 줄(2026-09-27 소장님 「강조 강조 강조」). 누르면 공지의 «🎁 보상» 탭 */}
        {!공지열림 && (
          <button className="qna-staff-bar" onClick={() => { set공지탭('보상'); set공지열림(true) }}>
            ⭐ <b>꾸준히 활동하시는 분을 «K-건설맵 운영진»으로 모시겠습니다</b> <span>— 🎁 보상 · 운영진 안내 보기 ›</span>
          </button>
        )}

        {list && (onlyMine || q.trim()) && (
          <div className="qna-filter-note" ref={찾기띠} style={{ scrollMarginTop: 70 }}>
            {onlyMine && <span>✓ <b>내가 쓴 글</b>만 보는 중</span>}
            {q.trim() && (이공고
              ? <span>🤝 이 공고{공고찾기.이름 ? <> «<b>{공고찾기.이름.slice(0, 40)}</b>»</> : null} 로 올라온 맵톡 글</span>
              : <span>🔎 «<b>{q.trim()}</b>» 로 찾는 중</span>)}
            <button type="button" className="chip" onClick={() => { setOnlyMine(false); setQ(''); set공고찾기(null) }}>모두 보기</button>
          </div>
        )}

        <div className="mt-body">
          <div className="mt-feedcol">
            {list === null && <Skeleton n={4} />}
            {list && list.length === 0 && 이공고 && (
              <div className="card" style={{ textAlign: 'center', padding: '18px 14px' }}>
                <div style={{ fontSize: 14, marginBottom: 10 }}>이 공고로 올라온 구성원 구함 글이 <b>아직 없습니다.</b></div>
                {공고찾기.초안 && (
                  <button className="btn" onClick={() => { set새글(공고찾기.초안); try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e) { /* 옛 브라우저 */ } }}>✏️ 이 공고로 첫 글 쓰기 (구성원 구함)</button>
                )}
                <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>맨 위 글쓰기 칸에 초안이 들어갑니다 — 고쳐서 올리시면 됩니다.</div>
              </div>
            )}
            {list && list.length === 0 && !이공고 && (
              (onlyMine || q.trim())
                ? <Empty>{onlyMine ? '내가 쓴 글 중에는' : '찾는 낱말이 들어간 글 중에는'} 글이 없습니다. 위 <b>«모두 보기»</b> 를 누르면 다른 분 글까지 모두 보입니다.</Empty>
                : 방고름 === '답기다림'
                  ? <Empty>답을 기다리는 글이 없습니다 — 다 답하셨습니다. 👍</Empty>
                  : <Empty>아직 글이 없습니다. 맨 위 칸에 아무 말이나 먼저 남겨 주세요 — 한 줄이어도 됩니다.</Empty>
            )}
            {한마디들.length > 0 && (
              <section className="mt-hanmadi" aria-label="고마워요 · 한마디">
                <div className="mt-hm-h"><b>💬 고마워요 · 한마디</b><em>{한마디들.length}</em><span>인사 · 응원 · 수다 — 누르면 글이 열립니다</span></div>
                <div className="mt-hm-list">
                  {(한마디다 ? 한마디들 : 한마디들.slice(0, 8)).map((r) => {
                    const 곳 = r.g ? 곳찾기(지도바탕, r.g) : null
                    const n = nAns(r.id), h = n좋아요(r.id)
                    return (
                      <button type="button" key={r.id} className="mt-hm" style={{ '--rc': (주제들[r.주제] || 주제들.talk).색 }} onClick={() => { 세기('|맵톡|한마디'); 누르기(r.id) }}>
                        <span className="mt-hm-t">{가림(r.t)}{r.b ? <small> {가림(r.b)}</small> : null}</span>
                        <span className="mt-hm-m">{r.nick || '익명'}{곳 ? ' · ' + 짧은이름(곳.n) : ''} · {날시(r.at)}{h > 0 ? ` · ♥ ${h}` : ''}{n > 0 ? ` · 💬 ${n}` : ''}</span>
                      </button>
                    )
                  })}
                  {한마디들.length > 8 && (
                    <button type="button" className="mt-hm-more" onClick={() => { if (!한마디다) 세기('|맵톡|한마디더'); set한마디다((v) => !v) }}>
                      {한마디다 ? '접기 ▴' : `+${한마디들.length - 8} 더 보기 ▾`}</button>
                  )}
                </div>
              </section>
            )}
            {보이는목록 && 보이는목록.length > 0 && <div ref={판} className={'mt-feed' + (벽돌됨 ? ' mason' : '')}>{보이는목록.map((r) => 카드(r))}</div>}
          </div>

          <aside className="mt-side">
            {방들.모임.length > 0 && (
              <div className="mt-panel">
                <h3>모이는 중</h3>
                <p className="sub">글 내용으로 주제를 짐작해 모읍니다. 같은 이야기가 {방기준}개 모이면 위에 방이 생깁니다.</p>
                {방들.모임.map((x) => (
                  <div key={x.k} className="mt-g">
                    <span className="dot" style={{ background: x.색 }} />
                    <b>{x.이름}</b>
                    <small>{x.n}/{방기준} · 방까지 {x.남음}개</small>
                    <div className="bar"><i style={{ width: Math.min(100, x.n / 방기준 * 100) + '%', background: x.색 }} /></div>
                  </div>
                ))}
              </div>
            )}
            {고정목록.length > 0 && (
              <div className="mt-panel">
                <h3>📌 도구 사용법 <small className="muted">{고정목록.length}</small></h3>
                <p className="sub">도구가 안 되거나 고쳤으면 하는 점은 그 글에 답글로 — 바로 살펴 고치겠습니다.</p>
                <ul className="mt-pins">
                  {고정목록.filter((r, i) => 다보기 || i < 6).map((r) => (
                    <li key={r.id}><button type="button" onClick={() => 열기(r.id)}>{가림(r.t)}</button></li>
                  ))}
                </ul>
                {고정목록.length > 6 && <button type="button" className="mt-more" onClick={() => set다보기((v) => !v)}>{다보기 ? '접기 ▲' : `모두 보기 (${고정목록.length}) ▼`}</button>}
              </div>
            )}
            <건설소식 on이야기={(x) => {
              set새글({ c: '후기·건의', t: x.t.slice(0, 80), b: `📰 ${x.s} 기사\n${x.u}\n\n` })
              try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e) { /* 옛 브라우저 */ }
            }} />
          </aside>
        </div>

        {/* 👑 운영자만 — 이달의 답변왕 정하기 */}
        {나운영자 && <왕정하기 모두={모두} ans={ans} 좋아요={좋아요} 답좋아요={답좋아요} 왕들={왕들} onDone={좋아요읽기} />}

        <Link to="/naeyeok" className="naeyeok-strip" style={{ marginTop: 14 }}>
          <span className="ns-ic">📋</span>
          <span className="ns-txt"><b>산출내역서 · 설계변경</b> — 무엇을 언제 내야 하는지 한 장으로 정리해 두었습니다.</span>
          <span className="ns-go">내역서 →</span>
        </Link>
      </div>

      {/* 글 — 옆 창(PC) · 아래 창(폰). /qna/{글번호} 로 들어와도 이 창으로 열립니다 */}
      {open && (
        <>
          <button type="button" className="mt-back" onClick={닫기} aria-label="닫기" />
          <div className="mt-sheet" role="dialog" aria-label="맵톡 글">
            <span className="mt-grab" />
            <button type="button" className="mt-x" onClick={닫기} aria-label="닫기">✕</button>
            {창글 ? (
              <>
                <div className="mt-meta">
                  <span className="mt-tag" style={{ color: (주제들[창글.주제] || 주제들.talk).색 }}><i style={{ background: (주제들[창글.주제] || 주제들.talk).색 }} />{(주제들[창글.주제] || 주제들.talk).이름}</span>
                  {창곳 && <span className="mt-where">{짧은이름(창곳.n)}</span>}
                  <span className="mt-date">· {날시(창글.at, { 해: true, 요: true })} · {언제(창글.at)}{창글.e ? ' · 고침' : ''}</span>
                </div>
                <h2 className="mt-full">{가림(창글.t)}</h2>
                <div className="mt-who">{배지(창글.uid)}{창글.nick || '익명'}{내것.has(창글.id) ? ' · 내 글' : ''}{창글.sb && 나운영자 ? ' · 🙈 몰래 차단' : ''}</div>
                {창글.p && <a href={창글.p} target="_blank" rel="noopener noreferrer"><img className="mt-bigphoto" src={창글.p} alt="올린 사진" /></a>}
                <Detail row={창글} ans={ans[창글.id] || {}} mine={내것.has(창글.id)} 나운영자={나운영자} 있는방={있는방}
                  고정됨={!!고정[창글.id]} 나={나} 배지={배지} 조회수={조회[창글.id] || 0} 지도바탕={지도바탕}
                  좋아요={좋아요[창글.id] || {}} 답좋아요={답좋아요[창글.id] || {}} 좋아요누름={좋아요누름}
                  바로답={답하러 === 창글.id} 바로답끝={() => set답하러(null)}
                  onChange={() => { _뿌리 = null; load(); setMine(loadMine()) }} />
              </>
            ) : (없는글 || (따로글 && !보임(따로글)))
              ? <Empty>이 글은 지워졌거나 없는 글입니다.</Empty>
              : <Skeleton n={1} />}
          </div>
        </>
      )}
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
function Detail({ row, ans, mine, onChange, 나운영자, 있는방 = null, 고정됨, 나, 배지 = () => '', 좋아요 = {}, 답좋아요 = {}, 좋아요누름, 조회수 = 0, 지도바탕 = null, 바로답 = false, 바로답끝 = () => {} }) {
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
      /* 🩹 G211 — 방을 바꿨으면 k 로 남깁니다. 운영자 글은 말머리도 같이(소식 = [K-건설맵] · 다른 방 = [후기·건의]) */
      const 방바뀜 = !!고침.k && 고침.k !== row.주제
      const 새갈래 = 나운영자 && 방바뀜 ? (고침.k === 'kcm' ? 'K-건설맵' : '후기·건의') : row.c
      const 고칠 = { t: 갈래붙이기(새갈래, t), b: (고침.b || '').trim().slice(0, 2000), e: serverTimestamp() }
      if (방바뀜) 고칠.k = 고침.k
      /* 🗺 G147 — 핀이 엉뚱한 시·군에 꽂혔으면 «고치기» 에서만 바꿉니다(소장님 「바꾸기 … 필요 없어지잖아」 — 글쓰기 칸엔 없음) */
      if ((고침.g || '') !== (row.g || '')) 고칠.g = 고침.g ? String(고침.g) : null
      /* 🏷 G93 — 운영자가 말머리를 바꾸면 별명도 같이: K-건설맵 글은 «K-건설맵», 후기·건의로 내리면 그 번호의 별명 */
      /* 📢 G117 — 운영자 글 제목에 «📢 공지» 가 있으면 후기·건의에 두어도 «K-건설맵» */
      /* 💬 G130 — 운영자가 쓴 글(운영자 번호)은 말머리를 바꿔도 · 그냥 고쳐도 «K-건설맵» (후기·건의로 옮긴 옛 글도 고치면 맞춰짐) */
      const 운영글 = 나운영자 && isOp(row.uid)
      if (새갈래 !== row.c || 운영글) 고칠.nick = ((새갈래 === 'K-건설맵' || 운영글) ? 'K-건설맵' : nickOf(row.uid)).slice(0, 20)
      /* 방(k) 규칙이 아직 안 올라간 때에도 고친 글은 올라가게 — k 를 빼고 한 번 더 */
      try { await update(ref(db, `qna/${row.id}`), 고칠) } catch (e) {
        if (!고칠.k) throw e
        delete 고칠.k
        await update(ref(db, `qna/${row.id}`), 고칠)
      }
      if (방바뀜) 세기('|맵톡|방옮김')
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
    if (!ok) setMsg('♥ 공감을 누르지 못했습니다. 잠시 뒤 다시 해 주세요.')
    else if (켬) 세기(경로.startsWith('qna_alike/') ? '|맵톡|답공감' : '|맵톡|공감')   /* 📊 카드에서 세던 것을 글 안으로 옮김 */
  }
  /* ↩ G148 누구에게 답글 — 줄기(원글에게 쓴 답) 아래 한 단계 들여 «↳ ○○ 님에게» */
  const 나무 = useMemo(() => 답나무(Object.entries(ans).map(([id, x]) => ({ id, ...x }))), [ans])
  const 답이름 = (a) => (a ? (a.op ? 'K-건설맵' : (a.nick || '익명')) : '')
  const 글쓴이 = row.c === 'K-건설맵' || isOp(row.uid) ? 'K-건설맵' : (row.nick || '익명')
  const [답할, set답할] = useState(null)          // 답글쓰기를 누른 답글 번호(null = 맨 아래 칸 · 원글에게)
  /* 🗑 G163 (2026-10-06) 소장님 「답글 지워줘」 「왜 지우기가 없지」 — 내 답글(이 기기 번호 · 되찾은 번호)은 그 자리에서 지움.
     규칙(qna_a)이 원래 «쓴 번호만 고침» 이라 deleted 만 참으로 — 숫자 없이 · 한 번 더 물음(창 대신 그 자리) · 지운 답글 아래 답은 살아 있는 줄기에 붙음(답나무) */
  const [답지울, set답지울] = useState(null)
  /* ✏️ G187 (2026-10-07) 소장님 「맵톡에서 댓글쓸때, 수정버튼이 없어. 지우기만 있고」 → 「고치기만…올려줘」(㉠ — «고침» 표시 없이)
     규칙(qna_a)이 원래 «쓴 번호(이 기기 · 되찾은 번호)만 고침» 이라 글(b)만 바꿔 씁니다 — 규칙은 그대로. 2~2000자(규칙과 같음). */
  const [답고칠, set답고칠] = useState(null)
  const [고칠글, set고칠글] = useState('')
  const [고치는중, set고치는중] = useState(false)
  const 답고치기 = async (a) => {
    const t = 고칠글.replace(/\r/g, '').trim()
    if (t.length < 2) { setMsg('두 글자 이상 적어 주세요.'); return }
    if (t === String(a.b || '').trim()) { set답고칠(null); return }
    set고치는중(true)
    try {
      const { ref, set, db, ensureAnon } = await loadFb()
      await ensureAnon()
      await set(ref(db, `qna_a/${row.id}/${a.id}/b`), t.slice(0, 2000))
      set답고칠(null); 세기('|맵톡|답고침'); onChange()
    } catch (e) { setMsg('이 기기에서 쓴 답글만 고칠 수 있습니다. 다른 기기에서 쓰셨다면 먼저 «🔑 내 글 되찾기».') }
    finally { set고치는중(false) }
  }
  const 답지우기 = async (a) => {
    try {
      const { ref, set, db, ensureAnon } = await loadFb()
      await ensureAnon()
      await set(ref(db, `qna_a/${row.id}/${a.id}/deleted`), true)
      set답지울(null); 세기('|맵톡|답지움'); onChange()
    } catch (e) { set답지울(null); setMsg('이 기기에서 쓴 답글만 지울 수 있습니다. 다른 기기에서 쓰셨다면 먼저 «🔑 내 글 되찾기».') }
  }
  const [반짝, set반짝] = useState(null)
  const 상자들 = useRef({})
  const 아래칸 = useRef(null)
  const 가서반짝 = (id) => {
    const el = 상자들.current[id]
    if (!el) return
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch (e) { el.scrollIntoView() }
    set반짝(id); setTimeout(() => set반짝((v) => (v === id ? null : v)), 1600)
  }
  /* 🔔 알림에서 들어오면(/qna/{글}#{답글}) 그 답글로 가서 반짝 */
  useEffect(() => {
    const h = decodeURIComponent((window.location.hash || '').slice(1))
    if (h && ans[h]) setTimeout(() => 가서반짝(h), 450)
  }, [row.id, Object.keys(ans).length])   // eslint-disable-line react-hooks/exhaustive-deps
  const 원글에게 = () => {
    set답할(null)
    const el = 아래칸.current
    if (!el) return
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch (e) { el.scrollIntoView() }
    const t = el.querySelector('textarea'); if (t) setTimeout(() => { try { t.focus({ preventScroll: true }) } catch (e) { t.focus() } }, 350)
  }
  /* 💬 카드 «답하기» 로 열었으면 — 창이 미끄러져 들어온 뒤 맨 아래 답글 칸으로 내려가 글자 칸에 커서 */
  useEffect(() => {
    if (!바로답) return undefined
    const t = setTimeout(() => { 원글에게(); 바로답끝() }, 450)
    return () => clearTimeout(t)
  }, [바로답, row.id])   // eslint-disable-line react-hooks/exhaustive-deps
  const 답상자 = (a, 가지) => {
    const 받는 = a.to && ans[a.to] ? ans[a.to] : null
    const n = 나무.받은수[a.id] || 0
    return (
      <div key={a.id} ref={(el) => { 상자들.current[a.id] = el }} className={'mt-ans' + (가지 ? ' sub' : '') + (a.op ? ' op' : '') + (반짝 === a.id ? ' flash' : '')} id={'a-' + a.id}>
        <div className="mt-ans-h">
          {a.op
            ? <b style={{ color: 'var(--accent, #1a56db)' }}>K-건설맵</b>
            : <b>{배지(a.uid)}{a.nick || '익명'}{a.sb && 나운영자 ? ' · 🙈 몰래 차단' : ''}</b>}
          <span className="muted"> · {날시(a.at, { 요: true })}</span>
        </div>
        {받는 && (
          <button type="button" className="mt-to" onClick={() => 가서반짝(a.to)} title="누구에게 쓴 답글인지 — 누르면 그 말로 갑니다">
            ↳ <b>{답이름(받는)}</b> 님에게{!받는.deleted && <span className="mt-to-q"> «{첫줄(가림(받는.b), 26)}»</span>}
          </button>
        )}
        {답고칠 === a.id
          ? (
            <div className="mt-aedit">
              <textarea className="inp" rows={4} maxLength={2000} value={고칠글} onChange={(e) => set고칠글(e.target.value)} aria-label="답글 고치기" autoFocus />
              <div className="mt-aedit-b">
                <button type="button" className="mt-adel-no" onClick={() => set답고칠(null)} disabled={고치는중}>그만</button>
                <button type="button" className="mt-aedit-ok" onClick={() => 답고치기(a)} disabled={고치는중}>{고치는중 ? '고치는 중…' : '고친 대로 올리기'}</button>
              </div>
            </div>
          )
          : <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 13.5 }}>{가림(a.b)}</div>}
        <div className="mt-ans-f">
          {내번호(a.uid)
            ? <span className="qna-like sm muted" title="내 답글 — 공감은 다른 분이 누릅니다">♥ {Object.keys(답좋아요[a.id] || {}).length}</span>
            : <button className={'qna-like sm' + (눌렀나(답좋아요[a.id]) ? ' on' : '')} disabled={좋바쁨}
                onClick={() => 좋(`qna_alike/${row.id}/${a.id}`, !눌렀나(답좋아요[a.id]))}>♥ {Object.keys(답좋아요[a.id] || {}).length}</button>}
          <button type="button" className={'mt-reply' + (답할 === a.id ? ' on' : '')} onClick={() => set답할((v) => (v === a.id ? null : a.id))}
            aria-label={`${답이름(a)} 님에게 답글쓰기 · 받은 답글 ${n}`}>↩ 답글쓰기{n > 0 && <em> · {n}</em>}</button>
          {내번호(a.uid) && 답고칠 !== a.id && 답지울 !== a.id && (
            <button type="button" className="mt-aed" onClick={() => { set답지울(null); set고칠글(String(a.b || '')); set답고칠(a.id) }} aria-label="내 답글 고치기">✏️ 고치기</button>
          )}
          {내번호(a.uid) && 답고칠 !== a.id && (답지울 === a.id
            ? <span className="mt-adel-ask">이 답글을 지울까요?
                <button type="button" className="mt-adel-yes" onClick={() => 답지우기(a)}>지우기</button>
                <button type="button" className="mt-adel-no" onClick={() => set답지울(null)}>그대로</button></span>
            : <button type="button" className="mt-adel" onClick={() => set답지울(a.id)} aria-label="내 답글 지우기">🗑 지우기</button>)}
        </div>
        {답할 === a.id && (
          <AnswerForm qid={row.id} to={a.id} 받는이={답이름(a)} 인용={첫줄(가림(a.b), 40)} 열림
            onCancel={() => set답할(null)} onDone={() => { set답할(null); onChange() }} />
        )}
      </div>
    )
  }

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
          {/* 🩹 G211 방 옮기기 — 글 내용으로 짐작한 방이 틀렸으면 여기서 바꿉니다(소식은 운영자만) */}
          <div className="mt-toroom" role="group" aria-label="이 글의 방">
            <span className="mt-toroom-l">📂 방</span>
            {고칠방들(나운영자, 있는방, 고침.k || row.주제).map((k) => {
              const on = (고침.k || row.주제) === k
              return (
                <button type="button" key={k} className={'mt-toroom-c' + (on ? ' on' : '')} style={{ '--rc': 주제들[k].색 }}
                  aria-pressed={on} onClick={() => set고침((v) => ({ ...v, k }))}><i />{주제들[k].이름}</button>
              )
            })}
          </div>
          <input className="inp" value={고침.t} maxLength={70} onChange={(e) => set고침((v) => ({ ...v, t: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 6 }} />
          <textarea className="inp" value={고침.b} maxLength={2000} onChange={(e) => set고침((v) => ({ ...v, b: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 110 }} />
          {지도바탕 && (
            <label className="mt-gedit">📍 지도 핀 자리
              <select className="inp" value={고침.g || ''} onChange={(e) => set고침((v) => ({ ...v, g: e.target.value }))}>
                <option value="">핀 없음</option>
                {(지도바탕.곳 || []).map((p) => <option key={p.k} value={p.k}>{p.d === 짧은이름(p.n) ? p.n : `${p.d} ${p.n}`}</option>)}
              </select>
            </label>
          )}
          <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 6 }}>
            <button className="btn primary" onClick={고쳐올리기} disabled={바쁨}>{바쁨 ? '고치는 중…' : '고친 것 올리기'}</button>
            <button className="btn" onClick={() => set고침(null)}>그만두기</button>
          </div>
        </div>
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 14 }}>{가림(row.b)}</div>
      )}
      {/* 📎 G158 붙인 파일 — 누르면 받기(눌러 올린 것은 브라우저가 풀어서 원래 파일로) · 📊 |맵톡|파일받기 */}
      {파일있음(row) && (
        <a className="mt-filebox" href={row.f.u} target="_blank" rel="noopener noreferrer nofollow" download={row.f.n} onClick={() => 세기('|맵톡|파일받기')}>
          <span className="mt-filebox-i" aria-hidden="true">📎</span>
          <span className="mt-filebox-n">{row.f.n}</span>
          <span className="muted">{크기글(row.f.s)}</span>
          <b className="mt-filebox-go">받기 ↓</b>
        </a>
      )}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {내번호(row.uid)
          ? <span className="qna-like muted" title="내 글 — 공감은 다른 분이 누릅니다">♥ 공감 {Object.keys(좋아요).length}</span>
          : <button className={'qna-like' + (눌렀나(좋아요) ? ' on' : '')} disabled={좋바쁨}
              onClick={() => 좋(`qna_like/${row.id}`, !눌렀나(좋아요))} aria-pressed={눌렀나(좋아요)}>♥ 공감 {Object.keys(좋아요).length}</button>}
        {/* 💬 2026-09-29 — 이 글만 여는 주소(검색 · 카톡으로 보내기). 그 주소로 가면 이 글이 맨 위에 펼쳐집니다 */}
        <Link className="qna-permalink" to={`/qna/${row.id}`}>🔗 이 글 주소</Link>
        <span className="muted" style={{ fontSize: 12.5 }} title="같은 기기는 하루 한 번만 셉니다(글쓴이 · 운영자는 안 셈)">👁 조회 {Number(조회수 || 0).toLocaleString('ko-KR')}</span>
        <button type="button" className="mt-reply" onClick={원글에게} aria-label={`글쓴이 ${글쓴이} 님에게 답글쓰기 · 받은 답글 ${나무.원글받은수}`}>
          ↩ 답글쓰기{나무.원글받은수 > 0 && <em> · {나무.원글받은수}</em>}
        </button>
      </div>

      {나무.줄기.map(({ a, 가지 }) => (
        <div key={a.id} className="mt-thread">
          {답상자(a, false)}
          {가지.length > 0 && <div className="mt-subs">{가지.map((x) => 답상자(x, true))}</div>}
        </div>
      ))}

      <div ref={아래칸}>
        <AnswerForm qid={row.id} onDone={onChange} 받는이={글쓴이} 원글 />
      </div>

      {mine && !고침 && (
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn line" onClick={() => set고침({ t: row.t || '', b: row.b || '', c: row.c, g: row.g || '', k: '' })}>✏️ 고치기</button>
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
/* ↩ G148 — to(받는 답글 번호)가 있으면 «↳ ○○ 님에게» 칸 · 없으면 원글(글쓴이)에게. 받은 사람에게 알림은 함수(qnaReplyNotify)가 보냅니다 */
function AnswerForm({ qid, onDone, to = null, 받는이 = '', 인용 = '', 열림 = false, onCancel = null, 원글 = false }) {
  const [b, setB] = useState('')
  const 칸 = useRef(null)
  useEffect(() => { if (열림 && 칸.current) { try { 칸.current.focus({ preventScroll: false }) } catch (e) { 칸.current.focus() } } }, [열림])
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
    /* 🔔 누른 그 순간 묻습니다(아이폰 · 파이어폭스는 기다렸다 물으면 거절) — 이미 정했으면 묻지 않음
       ⚠️ 소장님(운영자) 브라우저에서는 묻지 않습니다 — 소장님: 「그냥, 내가 답글을 쓰면 알림이 가게 해달라고」(허용 창 없이) */
    const 허락 = 나운영자 ? Promise.resolve('skip') : 허락묻기()
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
        ...(to ? { to } : {}),   /* ↩ G148 — 누구에게(규칙: 이 글에 있는 답글 번호만) */
        ...(await 몰래표()),     /* 🙈 몰래 차단 기기면 sb — 규칙이 강제합니다 */
      })
      setB('')
      세기('|맵톡|답글'); if (to) 세기('|맵톡|누구에게')
      /* 🔔 이 글에 다음 답글이 달리면 나에게도 알림(G73) — 허락한 기기는 폰 알림창까지 */
      폰알림켜기(r, 허락)
      onDone()
    } catch (e) {
      setMsg('올리지 못했습니다. 잠시 뒤 다시 해 주세요.')
    } finally { setBusy(false) }
  }

  return (
    <div className={'mt-af' + (to ? ' to' : '')} style={{ marginTop: 12 }}>
      {받는이 && (
        <div className="mt-af-h">
          <span>↳ {원글 ? '글쓴이 ' : ''}<b>{받는이}</b> 님에게 답글</span>
          {onCancel && <button type="button" className="mt-af-x" onClick={onCancel} aria-label="답글쓰기 닫기">✕</button>}
          {인용 && <span className="mt-af-q">«{인용}»</span>}
        </div>
      )}
      <textarea ref={칸} className="inp" value={b} onChange={(e) => setB(e.target.value)}
        placeholder={받는이 ? `${받는이} 님에게 — 아무 말이나` : '답글 — 아무 말이나'}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 72 }} maxLength={2000} />
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? '올리는 중…' : (받는이 && !원글 ? `${받는이} 님에게 답글 올리기` : '답글 올리기')}
        </button>
        {/* 🔑 운영자 브라우저일 때만 — 「이 답에는 표가 붙습니다」 를 미리 알려 줍니다.
            ⚠️ 이용자에게는 아무것도 안 보입니다. 비번 칸이 있던 자리입니다. */}
        {나운영자 && (
          <span className="muted" style={{ fontSize: 12 }}>
            이 답글에는 <b style={{ color: 'var(--accent, #1a56db)' }}>「K-건설맵」</b> 표가 붙습니다
          </span>
        )}
        {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
      </div>
    </div>
  )
}

/* ── 질문 쓰기 ─────────────────────────────────────────────────── */
/* ── 🗺 맵톡 글쓰기 — 지도 위에 떠 있는 큰 칸 하나 (G147 · 2026-10-05) ──────────────────────────
   소장님: 「글을 쓸때, 탭이 보이는게 아니라 …」 「질문, 현장, 건의, 등 어떤 것이든.. 이런 방식으로 해줘 예시말고」
           「📍 전남에 꽂혀요 · 바꾸기 — 그럼 이것도 필요 없어지잖아 … 자동으로 꽂히니까」 「사진만」
   ■ 한 칸에 씁니다 → 첫 줄(첫 문장)이 제목, 나머지가 본문(lib/맵톡.js 글나누기). 말머리는 예전처럼 «[후기·건의]» 를 제목 앞에
     붙여 둡니다(메일 · 글 페이지 · 옛 화면이 그대로 읽게) — 주제와 방은 글 내용으로 짐작합니다.
   ■ 자리(g): 📍 G150 (2026-10-05) 소장님 「지역을 선택하게 해야 할 것 같아. 내가 해보니까 서울로 가」 → 고르심 «바꾸기 줄 + 기억»
     칸 아래 «📍 서울에 꽂혀요(짐작) · 바꾸기» — 처음엔 접속 주소로 짐작(칸이 열릴 때 · 4초 안), 누르면 시·도 → 시·군.
     한 번 고르면 이 기기는 다음부터 그곳(lib/맵톡.js 곳기억 · localStorage) — 짐작 안 함. 짐작도 못 하고 안 고르면 핀 없이.
   ■ 사진(p): 한 장 · 긴 변 1600px JPEG 로 줄여 Storage qna_pics/{기기 번호}/{글번호}.jpg 에 올리고 주소만 글에.
     사진이 실패해도 글은 올라갑니다(«사진은 못 올렸습니다» 한 줄).
   ■ 4자리(지우고 되찾는 열쇠)는 예전 그대로 — 운영자 브라우저는 없이.
   ■ 올리기를 누르면 종이비행기가 날아가고, 새 글 핀이 지도에 떨어집니다(맵톡지도 새글번호).
   ■ 📎 G158 (2026-10-06) 파일 한 개(lib/파일올리기.js) — 한글 · 엑셀 · 워드 · PDF · PPT · 원본 20MB · 저장 10MB · 브라우저가 눌러(gzip) 올림.
     자리는 «이용자가 올린 서식» 과 같은 Storage user_forms/{기기}/… · 글에는 f{u 주소, n 이름, s 원본 크기, z 저장 크기}(규칙이 주소 · 크기를 봄).
     파일이 크거나(눌러도 10MB 넘음) 하루 한도를 넘으면 글을 올리지 않고 칸에서 알려 드림(한도 숫자는 안 보임).
     파일만 못 올라가면(인터넷 등) 글은 올라가고 «파일은 못 올렸습니다» 한 줄.
   ■ 📊 세기: |맵톡|글 · |맵톡|사진 · |맵톡|자리 · |맵톡|파일 (숫자는 어디에도 안 보임) */
const 초안열쇠 = 'kcm.qna.초안'
function 맵톡글쓰기({ onDone, 첫글, 나운영자, 방고름 = 'all', 있는방 = null }) {
  const [글, set글] = useState(() => {
    if (첫글 && (첫글.t || 첫글.b)) return [String(첫글.t || ''), String(첫글.b || '')].filter(Boolean).join('\n').slice(0, 2070)
    try { const d = JSON.parse(sessionStorage.getItem(초안열쇠) || 'null'); if (d) return typeof d.글 === 'string' ? d.글 : [d.t, d.b].filter(Boolean).join('\n') } catch (e) { /* 없음 */ }
    return ''
  })
  const [pin, setPin] = useState('')
  const [사진, set사진] = useState(null)        // { 파일, 미리(blob 주소) }
  const [첨부, set첨부] = useState(null)        // 📎 G158 File
  const [busy, setBusy] = useState(false)
  const [날기, set날기] = useState(false)
  const [흔들, set흔들] = useState(0)
  const [msg, setMsg] = useState('')
  const [고정할, set고정할] = useState(false)
  /* 🩹 G211 (2026-10-09) 소장님 「왜 내가 쓰는 글은 모두 건설맵 소식으로 가지? 분명 후기 건의 클릭해도」
     넣을 방(k) — 아래 «방» 줄에서 방을 골라 둔 채 쓰면 그 방. 이용자는 방을 안 골랐으면 '' (글 내용으로 짐작 · 예전 그대로).
     운영자는 칸 안에서 방을 고릅니다(방을 안 보고 있으면 처음엔 소식). 방을 바꿔 보면 칸도 따라 바뀝니다. */
  /* 🩹 G226 (2026-10-10) «📂 올릴 방» 칩 없앰 — 소장님 「올릴방이 필요가 없잖아 … 방을 선택하는 것은 아래에도 있으니까」
     운영자도 이용자와 같게: 아래 방 줄에서 방을 보고 있으면 그 방, 전체면 글 내용으로(운영자는 소식 방을 보고 쓰면 소식) */
  /* 🩹 G226 소장님 「방을 클릭하면 그쪽으로 가고, 그 방으로 갔는데, 다른 내용이면,,,그 내용들만 추려서 다시 방을 자동으로 만드는 거야?」 → 「자동으로 방이 생기게 해줘」
     → 어느 방을 보고 있든 글 «내용» 으로 방을 정함(내용이 다르면 다른 주제로 모여 30개면 새 방) · 소식만 운영자가 소식 방을 보고 쓸 때 */
  const 처음방 = () => (나운영자 && 넣을방(방고름, true) === 'kcm' ? 'kcm' : '')
  const [방, set방] = useState(처음방)
  useEffect(() => { set방(처음방()) }, [방고름, 나운영자])   // eslint-disable-line react-hooks/exhaustive-deps
  void 있는방
  const 칸 = useRef(null)
  const 핀칸 = useRef(null)
  /* 📍 G150 지역 — { 곳, 어떻게: '찾는중' | '짐작' | '고름' | '모름' } · 고르기: null | '시도' | 시·도 이름 */
  const [바탕, set바탕] = useState(null)
  const [자리, set자리] = useState({ 곳: null, 어떻게: '찾는중' })
  const [고르기, set고르기] = useState(null)
  const 짐작중 = useRef(null)
  useEffect(() => {
    let 살 = true
    짐작중.current = import('../data/한국지도.json').then(async (m) => {
      const b = m.default || m
      if (살) set바탕(b)
      const 기억 = 곳기억읽기(b)
      if (기억) { if (살) set자리((v) => (v.어떻게 === '고름' ? v : { 곳: 기억, 어떻게: '고름' })); return 기억 }
      const 곳 = await 자리짐작(b)
      if (살) set자리((v) => (v.어떻게 === '고름' ? v : { 곳, 어떻게: 곳 ? '짐작' : '모름' }))
      return 곳
    }).catch(() => { if (살) set자리((v) => (v.어떻게 === '고름' ? v : { 곳: null, 어떻게: '모름' })); return null })
    return () => { 살 = false }
  }, [])
  const 곳고름 = (p) => {
    set자리({ 곳: p, 어떻게: '고름' }); set고르기(null)
    곳기억하기(p.k)
    세기('|맵톡|지역고름')
  }
  const 시도들 = useMemo(() => (바탕 ? 시도별(바탕) : {}), [바탕])
  useEffect(() => { try { sessionStorage.setItem(초안열쇠, JSON.stringify({ 글 })) } catch (e) { /* 없음 */ } }, [글])
  /* 🤝 공고 · 건설 소식에서 초안을 들고 왔으면 칸에 바로 — 고쳐 쓰시게(바로 올리지 않음) */
  useEffect(() => { if (첫글 && 칸.current) { try { 칸.current.focus({ preventScroll: true }) } catch (e) { /* 옛 브라우저 */ } } }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (사진 && 사진.미리) URL.revokeObjectURL(사진.미리) }, [사진])
  const 막기 = (m) => { setMsg(m); set흔들((n) => n + 1) }

  const 사진고름 = (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\//.test(f.type || '')) return 막기('사진(그림 파일)만 올릴 수 있습니다.')
    if (f.size > 25 * 1024 * 1024) return 막기('사진이 너무 큽니다(25MB 넘음).')
    set사진({ 파일: f, 미리: URL.createObjectURL(f) })
    setMsg('')
  }

  const 파일고름 = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    const 말 = 파일검사(f)
    if (말) return 막기(말)
    /* 🗜 G196 zip — 올리기 전에 목차만 읽어 안을 봄(풀지 않음) · 막히면 📊 |맵톡|압축막음 */
    if (확장자(f.name) === 'zip') {
      const 안말 = await 압축검사(f)
      if (안말) { 세기('|맵톡|압축막음'); return 막기(안말) }
    }
    set첨부(f); setMsg('')
  }

  const submit = async () => {
    if (busy) return
    const { t, b } = 글나누기(글)
    if (t.length < 2) return 막기('두 글자 이상 적어 주세요.')
    if (!나운영자 && pin.length !== 4) { 막기('🔑 지우고 되찾을 때 쓸 4자리 숫자를 정해 주세요.'); try { 핀칸.current && 핀칸.current.focus() } catch (e) { /* 없음 */ } return }
    /* 📎 하루 한도 — 숫자는 안 알려 드림(소장님만 앎) */
    if (첨부 && !나운영자 && 오늘올린수() >= 하루한도) return 막기('📎 지금은 파일을 더 올릴 수 없습니다. 잠시 뒤 다시 올려 주세요. (글만 올리시려면 파일을 빼 주세요)')
    /* 🔔 누른 그 순간 브라우저 기본 «알림 허용» 창 — 답글이 달리면 폰 알림창에(G73) · 소장님 브라우저는 묻지 않음 */
    const 허락 = 나운영자 ? Promise.resolve('skip') : 허락묻기()
    setBusy(true); setMsg(''); set날기(true)
    /* 📍 자리 — 칸에 보이는 그곳(고른 곳 · 짐작). 아직 찾는 중이면 그 짐작을 기다립니다(4초 안) */
    const 자리약속 = 자리.어떻게 === '찾는중' && 짐작중.current ? 짐작중.current.catch(() => null) : Promise.resolve(자리.곳)
    set고르기(null)
    try {
      const { ref, set, push, db, ensureAnon, serverTimestamp } = await loadFb()
      const u = await ensureAnon()
      const { r } = await 뿌리찾기()
      const slot = push(ref(db, 'qna'))
      const id = slot.key
      /* 📎 파일 — 눌러도 10MB 넘으면 글을 올리지 않습니다(칸은 그대로 · 핀 열쇠보다 먼저 올려 봅니다) */
      let f = null, 파일말 = ''
      if (첨부) {
        try { f = await 파일올리기(첨부, u.uid) } catch (e) {
          if (e && e.message === '큼') { setBusy(false); set날기(false); return 막기(`📎 눌러도 ${크기글(e.저장)} 입니다 — 10MB 넘는 파일은 올릴 수 없습니다. 나눠서 올려 주세요.`) }
          파일말 = ' · 파일은 못 올렸습니다(글만 올라갔습니다)'
        }
      }
      if (pin.length === 4) await set(ref(db, `qna_pins/${id}`), await pinHash(id, pin))
      let p = '', 사진말 = ''
      if (사진) {
        try {
          const 덩이 = await 사진줄이기(사진.파일)
          if (덩이.size > 사진크기한도) throw new Error('큼')
          const { getStorage, ref: sref, uploadBytes, getDownloadURL } = await import('firebase/storage')
          const 자리 = sref(getStorage(), `qna_pics/${u.uid}/${id}.jpg`)
          await uploadBytes(자리, 덩이, { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' })
          p = await getDownloadURL(자리)
        } catch (e) { 사진말 = ' · 사진은 못 올렸습니다(글만 올라갔습니다)' }
      }
      const 곳 = await 자리약속
      const 넣방 = 나운영자 ? 운영자글방(방, t, b) : ''      /* 🩹 G226 늘 글 내용으로 — 운영자는 소식 방을 보고 쓸 때만 소식(나머지는 내용으로 정해 넣음) · 이용자는 k 없이(보일 때 내용으로) */
      const 간방 = 넣방 || 주제짐작({ t, b, at: Date.now() })
      const 글값 = {
        /* 운영자 글은 소식이면 [K-건설맵] · 다른 방이면 [후기·건의] — 메일 · 글 페이지가 그대로 읽게 (G211) */
        t: 갈래붙이기(나운영자 && 넣방 === 'kcm' ? 'K-건설맵' : '후기·건의', t),
        b,
        nick: (나운영자 ? 'K-건설맵' : nickOf(r)).slice(0, 20),   /* 💬 G130 운영자 글은 «K-건설맵»(규칙도 운영자 번호만 허락) */
        uid: r,
        at: Date.now(),
        ...(넣방 ? { k: 넣방 } : {}),   /* 🩹 G211 고른 방 */
        ...(곳 ? { g: String(곳.k) } : {}),
        ...(p ? { p } : {}),
        ...(f ? { f } : {}),
        ...(await 몰래표()),     /* 🙈 몰래 차단 기기면 sb — 규칙이 강제합니다 */
      }
      /* 🩹 G211 — 방(k) 규칙이 아직 안 올라간 때(사이트가 먼저 바뀐 몇 분)에도 글은 올라가게: k 를 빼고 한 번 더 */
      try { await set(slot, 글값) } catch (e) {
        if (!글값.k) throw e
        const { k, ...k없이 } = 글값   // eslint-disable-line no-unused-vars
        await set(slot, k없이)
      }
      if (넣방 && 넣방 !== 'kcm') 세기('|맵톡|방골라씀')
      addMine(id)
      폰알림켜기(r, 허락)
      세기('|맵톡|글'); if (p) 세기('|맵톡|사진'); if (곳) 세기('|맵톡|자리'); if (f) { 세기('|맵톡|파일'); if (확장자(f.n) === 'zip') 세기('|맵톡|압축파일'); 올린수더하기() }
      if (나운영자 && 고정할) { try { await set(ref(db, `qna_top/${id}`), serverTimestamp()) } catch (e) { /* 글 안에서 다시 꽂으면 됨 */ } }
      try { sessionStorage.removeItem(초안열쇠) } catch (e) { /* 없음 */ }
      set글(''); setPin(''); set사진(null); set첨부(null)
      /* 🩹 G226 보고 있던 방과 다른 주제면 어디로 갔는지 알림 */
      const 다른방 = 방고름 && 방고름 !== 'all' && 주제들[방고름] && 간방 !== 방고름 && 주제들[간방] ? ` · 글 내용으로 «${주제들[간방].이름}» 에 모였어요` : ''
      setMsg(`✅ 올렸습니다${곳 ? ` — ${짧은이름(곳.n)}에 핀이 꽂혔어요` : ''}${다른방}${사진말}${파일말}`)
      onDone(id)
    } catch (e) {
      setMsg('올리지 못했습니다. 잠시 뒤 다시 해 주세요.')
    } finally { setBusy(false); setTimeout(() => set날기(false), 800) }
  }

  return (
    <div className={'mt-compose' + (흔들 ? (흔들 % 2 ? ' shkA' : ' shkB') : '')}>
      <label className="sr-only" htmlFor="mt-say">맵톡에 글쓰기</label>
      <textarea id="mt-say" ref={칸} value={글} onChange={(e) => set글(e.target.value)} maxLength={2070} rows={3}
        placeholder="질문, 현장 이야기, 건의 등 어떤 것이든 좋아요" />
      {사진 && (
        <div className="mt-att"><img src={사진.미리} alt="" />사진 1장<button type="button" onClick={() => set사진(null)}>빼기</button></div>
      )}
      {첨부 && (
        <div className="mt-att mt-att-f">
          <span className="mt-att-i" aria-hidden="true">📎</span>
          <span className="mt-att-n">{첨부.name}</span><span className="muted">{크기글(첨부.size)}</span>
          <button type="button" onClick={() => set첨부(null)}>빼기</button>
          <span className="mt-att-warn">남의 공사명 · 업체명 · 사람 이름 · 전화번호는 지우고 올려 주세요</span>
        </div>
      )}
      {/* 🩹 G211 · G226 방 줄은 운영자가 소식 방을 보고 있을 때만(«내용 따라» 누르면 글 내용으로) — 나머지는 늘 내용으로 */}
      {방 ? (
        <div className="mt-toroom">
          <span>📂 <b style={{ color: (주제들[방] || 주제들.talk).색 }}>{(주제들[방] || 주제들.talk).이름}</b> 방에 올라가요</span>
          <button type="button" className="mt-place-b" onClick={() => set방('')} title="방을 고르지 않으면 글 내용으로 방을 짐작합니다">내용 따라</button>
        </div>
      ) : null}
      {/* 📍 G150 어디에 꽂히는지 · 바꾸기 */}
      <div className="mt-place">
        {자리.어떻게 === '찾는중'
          ? <span className="muted">📍 지역 찾는 중…</span>
          : 자리.곳
            ? <span>📍 <b>{짧은이름(자리.곳.n)}</b>에 꽂혀요{자리.어떻게 === '짐작' && <em> (짐작)</em>}</span>
            : <span className="muted">📍 지역을 골라 주세요</span>}
        <button type="button" className={'mt-place-b' + (고르기 ? ' on' : '')} onClick={() => set고르기((v) => (v ? null : '시도'))} aria-expanded={!!고르기}>
          {자리.곳 ? '바꾸기' : '고르기'}
        </button>
      </div>
      {고르기 && (
        <div className="mt-pick" role="group" aria-label="지역 고르기">
          {고르기 === '시도' ? (
            <>
              <div className="mt-pick-h">시·도를 고르세요</div>
              <div className="mt-pick-g">
                {시도차례.filter((d) => (시도들[d] || []).length).map((d) => (
                  <button type="button" key={d} className={'mt-pick-c' + (자리.곳 && 자리.곳.d === d ? ' on' : '')}
                    onClick={() => (시도들[d].length === 1 ? 곳고름(시도들[d][0]) : set고르기(d))}>{d}</button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mt-pick-h">
                <button type="button" className="mt-pick-back" onClick={() => set고르기('시도')}>‹ 시·도</button>
                <b>{고르기}</b> — 시·군을 고르세요
              </div>
              <div className="mt-pick-g">
                {(시도들[고르기] || []).map((p) => (
                  <button type="button" key={p.k} className={'mt-pick-c' + (자리.곳 && 자리.곳.k === p.k ? ' on' : '')} onClick={() => 곳고름(p)}>{p.n}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div className="mt-crow">
        <label className={'mt-chip' + (사진 ? ' on' : '')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
          <span className="mt-chip-t">사진도 올릴 수 있어요</span>
          <input type="file" accept="image/*" onChange={사진고름} className="sr-only" />
        </label>
        {/* 📎 G158 파일 한 개 — 한글 · 엑셀 · 워드 · PDF · PPT */}
        <label className={'mt-chip mt-file' + (첨부 ? ' on' : '')} title="한글 · 엑셀 · 워드 · PDF · PPT (20MB 까지) · 압축 zip (10MB 까지)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.3 3.3 0 0 1 4.7 4.7L10.2 17.7a1.7 1.7 0 0 1-2.4-2.4L15.5 7.6" /></svg>
          <span className="mt-chip-t">파일도 올려요</span>
          <input type="file" accept={받는꼴} onChange={파일고름} className="sr-only" aria-label="파일 올리기 — 한글 · 엑셀 · 워드 · PDF · PPT · 압축(zip)" />
        </label>
        {나운영자
          ? <label className="mt-opfix" title="📌 도구 사용법에 고정"><input type="checkbox" checked={고정할} onChange={(e) => set고정할(e.target.checked)} /><span className="mt-opfix-t">📌 도구 사용법에 고정</span></label>
          : <input ref={핀칸} className="mt-pin4" inputMode="numeric" maxLength={4} value={pin} aria-label="지우고 되찾을 때 쓸 4자리 숫자"
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="🔑 4자리" title="🔑 꼭 적어 두세요 — 내 글을 지우고 되찾는 열쇠입니다" />}
        <button type="button" className="mt-send" onClick={submit} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 3 3 10.5l7 2.5 2.5 7z" /><path d="M21 3 10 13" /></svg>
          {busy ? '올리는 중…' : '올리기'}
          {날기 && <span className="mt-plane" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 3 10.5l7 2.5 2.5 7z" /><path d="M21 3 10 13" /></svg></span>}
        </button>
      </div>
      <p className="mt-hint" role="status">{msg || (나운영자
        ? '🛠 운영자 — 숫자 없이 올립니다 · 글쓴이는 «K-건설맵» · 방은 글 내용으로 저절로(소식은 아래 «K-건설맵 소식» 방을 누르고)'
        : '질문 · 현장 · 건의 · 사는 이야기 무엇이든 · 🔑 4자리는 내 글을 지우고 되찾는 열쇠')}</p>
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
