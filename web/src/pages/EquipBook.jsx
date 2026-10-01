/**
 * /tools/equip — 🚜 장비 임대료·수금 장부 (2026-09-29)
 *
 * 소장님: 「(서식의 장비관리 프로그램 엑셀) 좀 이상해 봐줘 … 되도록 사이트내에서 사용 할 수 있는 프로그램으로 만들어 줘」
 *         → (고름) 장비 임대업자용 · 코드+비밀번호로 여러 기기(현장 투입비와 같은 방식)
 *
 * ■ 기사·장비(시간당·일대 단가)와 거래처(현장명)를 등록 → 날마다 사용 내역(수량 × 단가 · 유류대) →
 *   수금 → 거래처별 임대료·받은 돈·미수금 · 기사(장비)별 · 달마다 → 거래처별 청구서 인쇄(A4 세로)
 * ■ 장부를 만들면 «장부 코드(9자리) + 비밀번호» 가 생깁니다. 회원가입 없음. 폰·PC 어디서든 같은 장부.
 * ■ 사업자번호·계좌는 브라우저에서 비밀번호로 잠가 저장(lib/tplock.js) — 서버는 못 읽습니다.
 * ■ 📗 엑셀은 «값만»(G110 · 2026-10-01 소장님 「엑셀로 값만 주는 걸로 하자. 프로그램 원칙으로 하고」 · 「2차 가자」) — 청구서 탭 «📗 엑셀(값만)»:
 *   청구 요약 · 거래처마다 청구서(사용 내역 · 받은 돈 · 전기 미수 · 누계 미수 · 상호 · 입금 계좌) · 거래처 현황 · 기사(장비) 현황 · 달마다. 수식 없음 · 입력과 수정은 건설맵에서.
 * 셈: lib/장비장부.js (시험 node tools/시험_장비장부.mjs) · 저장: lib/장부.js (ns 'eq') · 규칙: web/database.rules.json «장비 장부»
 */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { use화면상태, 앞칸같은주소 } from '../lib/길기록.js'
import { use인쇄 } from '../tools/공정인쇄.js'
import { 새장부, 열기칸, 만들었음, 연장부목록, 잠금풀칸, 코드와휴지통 } from '../tools/장부문.jsx'
import { 장부, 목록읽기, 목록기억, 막힘, 휴지통날 } from '../lib/장부.js'
import { 코드정리, 코드보기 } from '../lib/tuipbi.js'
import { 잠그기, 풀기 } from '../lib/tplock.js'
import {
  단위들, 받는법, 원, 수, 오늘, 이번달, 달첫날, 달끝날, 줄금액, 청구액, 유류받음,
  거래처현황, 기사현황, 달마다, 청구서, 한글돈, 예시장부,
} from '../lib/장비장부.js'

const NS = 'eq'
const 자리들 = ['drivers', 'clients', 'rows', 'pay', 'cost']
const 장 = 장부(NS, 자리들)
const 빈자료 = { drivers: {}, clients: {}, rows: {}, pay: {}, cost: {} }
const 자리이름 = { drivers: '기사·장비', clients: '거래처', rows: '사용 내역', pay: '수금', cost: '경비' }
const 쉼표칸 = (s) => { const n = String(s ?? '').replace(/[^0-9]/g, ''); return n ? 원(Number(n)) : '' }
const 달목록 = (자료) => {
  const s = new Set([이번달()])
  for (const z of ['rows', 'pay', 'cost']) for (const v of Object.values(자료[z] || {})) if (v.d) s.add(v.d.slice(0, 7))
  return [...s].sort().reverse()
}
const 달글 = (ym) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`
const 새칸들 = [
  { k: 'name', 이름: '상호', 힌트: '청구서 맨 위에 나옵니다', 필수: true, 최대: 40, 보기: '예: ○○중기', 넓게: true },
  { k: 'ceo', 이름: '대표', 최대: 20 }, { k: 'tel', 이름: '전화', 최대: 20 },
]
/* 단추 글 — «금액을 적으십시오» · «거래처를 고르십시오» (받침 따라 을/를) */
const 을를 = (w) => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '을' : '를' }
const 틀림말 = (w) => (/십시오$/.test(w) ? w : `${w}${을를(w)} 적으십시오`)
const 배열 = (o) => Object.entries(o || {}).map(([id, v]) => ({ id, ...v }))

export default function EquipBook() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [화면, set화면] = use화면상태('화면', 'home')     // home | new | open | made | book
  const [코드, set코드] = useState('')
  const [정보, set정보] = useState(null)
  const [자료, set자료] = useState(빈자료)
  const [풀린, set풀린] = useState({})
  const [열쇠, set열쇠] = useState(null)
  const [휴지통, set휴지통] = useState({})
  const [예시, set예시] = useState(false)
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [알림, set알림] = useState('')
  const [저장됨, set저장됨] = useState('')
  const [목록, set목록] = useState(() => 목록읽기(NS))

  useEffect(() => {
    document.title = '장비 임대료·수금 장부 | K-건설맵'
    const c = 코드정리(params.get('c'))
    if (c.length === 9) { set코드(c); 열어보기(c, true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const 들이기 = async (c, r, 바꿈) => {
    set코드(c); set정보(r.정보); set자료({ ...빈자료, ...r.자료 }); set휴지통(r.휴지통 || {}); set열쇠(r.열쇠); set예시(false)
    set풀린(r.열쇠 && r.정보 && r.정보.x ? ((await 풀기(r.열쇠, r.정보.x)) || {}) : {})
    set목록(목록기억(NS, c, r.정보.name)); set알림(''); set오류('')
    set화면('book', { replace: 바꿈 != null ? !!바꿈 : true, search: '?c=' + c })
  }
  async function 열어보기(c, 바꿈) {
    set오류(''); set바쁨('장부를 여는 중입니다…')
    try { await 들이기(c, await 장.불러오기(c), 바꿈) }
    catch (e) { if (막힘(e)) { set코드(c); set화면('open') } else set오류('장부를 열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.') }
    finally { set바쁨('') }
  }
  async function 열기(c, pw) {
    set오류(''); set바쁨('비밀번호를 확인하는 중입니다…')
    try { await 들이기(c, await 장.열기(c, pw), true) }
    catch (e) { set오류(막힘(e) ? '장부 코드나 비밀번호가 맞지 않습니다.' : '열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.') }
    finally { set바쁨('') }
  }
  async function 만들기(v) {
    set오류(''); set바쁨('장부를 만드는 중입니다…')
    try {
      const 새 = { name: v.name.trim().slice(0, 40) }
      if (v.ceo.trim()) 새.ceo = v.ceo.trim().slice(0, 20)
      if (v.tel.trim()) 새.tel = v.tel.trim().slice(0, 20)
      const r = await 장.만들기(새, v.pw)
      set코드(r.코드); set정보(r.정보); set자료(빈자료); set열쇠(r.열쇠); set풀린({}); set휴지통({}); set예시(false)
      set목록(목록기억(NS, r.코드, 새.name))
      set화면('made', { replace: true, search: '?c=' + r.코드 })
    } catch (e) { set오류('장부를 만들지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.') }
    finally { set바쁨('') }
  }
  const 예시보기 = () => {
    const x = 예시장부()
    set예시(true); set코드('EXAMPLE00'); set정보(x.정보); set자료(x.자료); set풀린(x.풀린); set열쇠(null); set휴지통({}); set알림(''); set오류('')
    set화면('book')
  }
  const 나가기 = () => {
    set정보(null); set자료(빈자료); set풀린({}); set열쇠(null); set예시(false); set휴지통({}); set알림('')
    if (앞칸같은주소(window.location.pathname)) navigate(-1)
    else set화면('home', { replace: true, search: '' })
  }

  const 표시 = (글) => {
    const d = new Date()
    set저장됨(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`)
    set알림(typeof 글 === 'string' ? 글 : '')
  }
  const 실패 = (e, 글) => {
    set오류(막힘(e) ? '이 브라우저는 이 장부에 쓸 수 없습니다 — 나갔다가 코드와 비밀번호로 다시 열어 주십시오.' : (글 || '저장하지 못했습니다 — 인터넷을 확인해 주십시오.'))
    return false
  }

  /** 한 줄 저장 — 자리: drivers|clients|rows|pay|cost */
  async function 저장(자리, id, v) {
    const 값 = { ...v, at: v.at || Date.now() }
    try {
      const nid = 예시 ? (id || 'n' + Date.now()) : await 장.쓰기(코드, 자리, id, 값)
      set자료((a) => ({ ...a, [자리]: { ...a[자리], [nid]: 값 } }))
      set오류(''); 표시()
      return nid
    } catch (e) { 실패(e); return null }
  }
  async function 지우기(자리, id) {
    const 옛 = 자료[자리][id]
    if (!옛) return
    try {
      if (예시) set휴지통((h) => ({ ...h, ['ex' + Date.now()]: { p: 자리, k: id, v: 옛, at: Date.now() } }))
      else { const [t, x] = await 장.지우기(코드, 자리, id, 옛); set휴지통((h) => ({ ...h, [t]: x })) }
      set자료((a) => { const z = { ...a[자리] }; delete z[id]; return { ...a, [자리]: z } })
      set오류(''); 표시(`휴지통으로 옮겼습니다 — ${휴지통날}일 안에는 «장부 정보 › 🗑 휴지통» 에서 되살릴 수 있습니다`)
    } catch (e) { 실패(e, '지우지 못했습니다 — 인터넷을 확인해 주십시오. (지워지지 않았습니다)') }
  }
  async function 되살리기(t) {
    const x = 휴지통[t]
    if (!x || !자리들.includes(x.p)) return
    try {
      if (!예시) await 장.되살리기(코드, t, x)
      set휴지통((h) => { const q = { ...h }; delete q[t]; return q })
      set자료((a) => ({ ...a, [x.p]: { ...a[x.p], [x.k]: x.v } }))
      set오류(''); 표시('되살렸습니다')
    } catch (e) { 실패(e, '되살리지 못했습니다 — 인터넷을 확인해 주십시오.') }
  }
  /** 장부 정보 — 잠글 칸(사업자번호·계좌)은 x 한 칸에 */
  async function 정보고치기(v, 잠금) {
    const 새 = { ...v, upd: Date.now() }
    if (잠금 !== undefined) {
      const 빈 = !Object.values(잠금).some((s) => String(s || '').trim())
      if (빈) delete 새.x
      else if (예시) 새.x = 'ex'
      else if (!열쇠) { set오류('🔒 잠금이 풀려 있지 않아 사업자번호·계좌를 저장할 수 없습니다 — 나갔다가 비밀번호로 다시 열어 주십시오.'); return false }
      else 새.x = await 잠그기(열쇠, 잠금)
    }
    try {
      if (!예시) await 장.정보저장(코드, 새)
      set정보(새); if (잠금 !== undefined) set풀린(잠금)
      set목록(목록기억(NS, 코드, 새.name)); 표시(); return true
    } catch (e) { return 실패(e, '장부 정보를 저장하지 못했습니다.') }
  }
  async function 장부지우기() {
    if (예시) return
    try { const t = await 장.장부지우기(코드); set정보((s) => ({ ...s, del: t })) } catch (e) { 실패(e, '지우지 못했습니다.') }
  }
  async function 장부되살리기() {
    try { await 장.장부되살리기(코드); set정보((s) => { const q = { ...s }; delete q.del; return q }); 표시('장부를 되살렸습니다') }
    catch (e) { 실패(e, '되살리지 못했습니다.') }
  }
  async function 잠금풀기(pw) {
    const raw = await 장.잠금풀기(코드, pw)
    if (!raw) return false
    set열쇠(raw)
    set풀린(정보 && 정보.x ? ((await 풀기(raw, 정보.x)) || {}) : {})
    return true
  }
  async function 잊기() {
    if (!window.confirm('이 기기에서 이 장부를 잊을까요?\n다음에 열 때 장부 코드와 비밀번호를 다시 넣어야 합니다. (장부 자료는 그대로입니다)')) return
    await 장.이기기잊기(코드); set목록(목록읽기(NS)); 나가기()
  }

  if (바쁨) return <div className="card"><div className="muted">{바쁨}</div></div>
  if (화면 === 'book' && 정보) {
    return (
      <장부화면 코드={코드} 정보={정보} 자료={자료} 풀린={풀린} 예시={예시} 휴지통={휴지통}
        오류={오류} 알림={알림} 저장됨={저장됨} 열쇠있음={!!열쇠 || 예시}
        저장={저장} 지우기={지우기} 되살리기={되살리기} 정보고치기={정보고치기}
        장부지우기={장부지우기} 장부되살리기={장부되살리기} 잠금풀기={잠금풀기} 잊기={잊기} 나가기={나가기} />
    )
  }
  if (화면 === 'made' && 정보) return <만들었음 코드={코드} 이름={정보.name} 열기={() => set화면('book', { replace: true })} />
  if (화면 === 'new') return <새장부 제목="➕ 새 장비 장부" 칸들={새칸들} 오류={오류} 만들기={만들기} 뒤로={() => set화면('home', { replace: true })} />
  if (화면 === 'open') return <열기칸 코드0={코드} 오류={오류} 열기={열기} 뒤로={() => set화면('home', { replace: true })} />
  return (
    <처음 목록={목록} 오류={오류} 새로={() => { set오류(''); set화면('new') }} 열러={() => { set오류(''); set코드(''); set화면('open') }}
      고름={(c) => 열어보기(c, false)} 예시보기={예시보기} />
  )
}

/* ── 처음 ─────────────────────────────────────────── */
function 처음({ 목록, 오류, 새로, 열러, 고름, 예시보기 }) {
  return (
    <div className="eq">
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🚜 장비 임대료·수금 장부</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          기사·장비 단가를 한 번 등록하고, 날마다 <b>어느 거래처에 몇 시간</b> 썼는지만 적으면
          거래처별 <b>임대료 · 받은 돈 · 미수금</b>과 <b>청구서</b>가 저절로 나옵니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          장부를 만들면 <b>장부 코드와 비밀번호</b>가 생깁니다 — 휴대폰·사무실 PC 어디서든 같은 장부를 봅니다. 회원가입은 없습니다.
        </p>
      </div>
      {오류 && <div className="card err">{오류}</div>}
      <div className="card">
        <div className="btn-row">
          <button className="btn primary" onClick={새로}>➕ 새 장부 만들기</button>
          <button className="btn" onClick={열러}>🔑 장부 코드로 열기</button>
          <button className="btn ghost" onClick={예시보기}>👀 예시로 해 보기</button>
        </div>
        <연장부목록 목록={목록} 고름={고름} />
      </div>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>이렇게 씁니다</div>
        <ol className="flist">
          <li><b>등록</b> — 기사·장비(시간당·일대 단가)와 거래처(현장명)를 적습니다.</li>
          <li><b>사용 적기</b> — 날짜·기사·거래처·시간만 고르면 단가를 곱해 금액이 들어갑니다. 유류대도 같이 적습니다.</li>
          <li><b>수금</b> — 받은 날·거래처·금액을 적습니다.</li>
          <li><b>한눈에</b> — 거래처별 임대료·받은 돈·미수금, 기사(장비)별 가동·임대료, 달마다 흐름을 봅니다.</li>
          <li><b>청구서</b> — 거래처와 달을 고르면 A4 청구서가 나옵니다(전달까지 미수 · 이번 청구 · 누계 미수).</li>
        </ol>
        <p className="note sm" style={{ marginBottom: 0 }}>
          유류대는 두 가지로 적습니다 — <b>원청이 대 준 기름</b>(받은 돈으로 셈)과 <b>내가 넣고 청구하는 기름</b>(임대료에 더함).
          받을 돈이 밀리면 <Link to="/tools/unpaid">💸 미불금 받기</Link>(내용증명·지급명령)로 이어 가십시오.
        </p>
      </div>
    </div>
  )
}

/* ── 장부 안 ─────────────────────────────────────────── */
const 탭들 = [['home', '📊 한눈에'], ['rows', '✍️ 사용 적기'], ['pay', '💰 수금'], ['cost', '🔧 경비'], ['bill', '🧾 청구서'], ['reg', '📇 등록'], ['info', '⚙️ 장부 정보']]

function 장부화면(p) {
  const { 정보, 자료, 예시, 오류, 알림, 저장됨 } = p
  const [탭, set탭] = use화면상태('탭_' + p.코드, 'home')     // 장부마다 따로(예시 → 내 장부로 옮겨 가도 탭이 따라오지 않게)
  const 달들 = useMemo(() => 달목록(자료), [자료])
  const 등록없음 = !Object.keys(자료.drivers).length || !Object.keys(자료.clients).length
  return (
    <div className="eq">
      <div className="card eq-head">
        <div className="grow">
          <div className="eq-name">🚜 {정보.name}{예시 && <span className="badge n" style={{ marginLeft: 6 }}>예시</span>}</div>
          <div className="d">{예시 ? '예시 장부 — 고쳐 봐도 저장되지 않습니다' : <>장부 {코드보기(p.코드)}{저장됨 ? ` · ✓ ${저장됨} 저장됨` : ' · 적으면 바로 저장됩니다'}</>}</div>
        </div>
        <button className="btn ghost sm" onClick={p.나가기}>나가기</button>
      </div>
      {정보.del && (
        <div className="card err">🗑 지운 장부입니다({new Date(정보.del).toLocaleDateString()}). {휴지통날}일 안에는 되살릴 수 있습니다.
          {' '}<button className="btn sm" onClick={p.장부되살리기}>되살리기</button></div>
      )}
      {오류 && <div className="card err">{오류}</div>}
      {알림 && <div className="card eq-ok">{알림}</div>}
      <div className="eq-tabs">
        {탭들.map(([k, t]) => <button key={k} className={탭 === k ? 'on' : ''} onClick={() => set탭(k)}>{t}</button>)}
      </div>
      {등록없음 && 탭 !== 'reg' && 탭 !== 'info' && (
        <div className="card note">먼저 <b>📇 등록</b>에서 기사·장비와 거래처를 적어 주십시오 — 사용 내역을 적을 때 골라 씁니다.
          {' '}<button className="btn sm" onClick={() => set탭('reg')}>등록하러 가기</button></div>
      )}
      {탭 === 'home' && <한눈에 자료={자료} 달들={달들} 탭가기={set탭} />}
      {탭 === 'rows' && <사용칸 자료={자료} 달들={달들} 저장={p.저장} 지우기={p.지우기} />}
      {탭 === 'pay' && <수금칸 자료={자료} 달들={달들} 저장={p.저장} 지우기={p.지우기} />}
      {탭 === 'cost' && <경비칸 자료={자료} 달들={달들} 저장={p.저장} 지우기={p.지우기} />}
      {탭 === 'bill' && <청구칸 자료={자료} 달들={달들} 정보={정보} 풀린={p.풀린} />}
      {탭 === 'reg' && <등록칸 자료={자료} 저장={p.저장} 지우기={p.지우기} />}
      {탭 === 'info' && <정보칸 {...p} />}
    </div>
  )
}

/* ── 📊 한눈에 ── */
function 한눈에({ 자료, 달들, 탭가기 }) {
  const [달, set달] = useState('')           // '' = 전체
  const 기간 = 달 ? { from: 달첫날(달), to: 달끝날(달) } : {}
  const 거 = 거래처현황(자료, 기간)
  const 기 = 기사현황(자료, 기간)
  const 전체 = 거래처현황(자료)
  const 달표 = 달마다(자료)
  return (
    <>
      <div className="card">
        <div className="eq-bar">
          <span className="muted">기간</span>
          <select value={달} onChange={(e) => set달(e.target.value)}>
            <option value="">처음부터 전부</option>
            {달들.map((m) => <option key={m} value={m}>{달글(m)}</option>)}
          </select>
        </div>
        <div className="tiles c4" style={{ marginTop: 10 }}>
          <div className="tile"><div className="k">임대료</div><div className="v sm">{원(거.합.임대)}</div></div>
          <div className="tile"><div className="k">받은 돈 <small>(수금+원청 유류)</small></div><div className="v sm">{원(거.합.받음)}</div></div>
          <div className="tile"><div className="k">{달 ? '이 달 남은 돈' : '미수금'}</div><div className={'v sm' + (거.합.미수 > 0 ? ' eq-red' : '')}>{원(거.합.미수)}</div></div>
          {달 ? <div className="tile"><div className="k">미수금 (전체 누계)</div><div className={'v sm' + (전체.합.미수 > 0 ? ' eq-red' : '')}>{원(전체.합.미수)}</div></div>
            : <div className="tile"><div className="k">받은 비율</div><div className="v sm">{거.합.임대 ? (거.합.받음 / 거.합.임대 * 100).toFixed(1) : 0}%</div></div>}
        </div>
      </div>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>🏢 거래처별 {달 ? `— ${달글(달)}` : '— 처음부터'}</div>
        <div className="eq-scroll">
          <table className="tbl eq-t">
            <thead><tr><th>거래처</th><th>임대료</th><th>수금</th><th>원청 유류</th><th>미수금</th><th>비율</th><th>받은 비율</th></tr></thead>
            <tbody>
              {거.줄.filter((e) => e.임대 || e.받음).map((e) => (
                <tr key={e.id}><td><b>{e.이름}</b>{e.현장 ? <div className="d">{e.현장}</div> : null}</td>
                  <td>{원(e.임대)}</td><td>{원(e.수금)}</td><td>{원(e.유류)}</td>
                  <td className={e.미수 > 0 ? 'eq-red' : ''}><b>{원(e.미수)}</b></td>
                  <td>{(e.비율 * 100).toFixed(1)}%</td><td>{(e.수금률 * 100).toFixed(1)}%</td></tr>
              ))}
              <tr className="eq-sum"><td>합계</td><td>{원(거.합.임대)}</td><td>{원(거.합.수금)}</td><td>{원(거.합.유류)}</td><td>{원(거.합.미수)}</td><td>100%</td>
                <td>{거.합.임대 ? (거.합.받음 / 거.합.임대 * 100).toFixed(1) : 0}%</td></tr>
            </tbody>
          </table>
        </div>
        {전체.합.미수 > 0 && (
          <p className="note sm" style={{ marginBottom: 0 }}>받을 돈이 밀린 거래처는 <button className="linklike" onClick={() => 탭가기('bill')}>🧾 청구서</button>를 보내고,
            그래도 안 주면 <Link to="/tools/demand-letter">✉️ 내용증명</Link> · <Link to="/tools/payment-order">⚖️ 지급명령 신청서</Link>로 이어 가십시오.</p>
        )}
      </div>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>👷 기사(장비)별</div>
        <div className="eq-scroll">
          <table className="tbl eq-t">
            <thead><tr><th>기사 · 장비</th><th>시간</th><th>일</th><th>임대료</th><th>그 기사로 받은 수금</th><th>경비</th></tr></thead>
            <tbody>
              {기.filter((e) => e.임대 || e.경비 || e.수금).map((e) => (
                <tr key={e.id}><td><b>{e.이름}</b>{e.장비 ? <div className="d">{e.장비}</div> : null}</td>
                  <td>{e.시간 ? e.시간.toLocaleString() : '-'}</td><td>{e.일 ? e.일.toLocaleString() : '-'}</td>
                  <td>{원(e.임대)}</td><td>{원(e.수금)}</td><td>{원(e.경비)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {달표.length > 0 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>📅 달마다</div>
          <div className="eq-scroll">
            <table className="tbl eq-t">
              <thead><tr><th>달</th><th>임대료</th><th>받은 돈</th><th>경비</th><th>임대료 − 경비</th></tr></thead>
              <tbody>
                {[...달표].reverse().map((e) => (
                  <tr key={e.ym}><td>{달글(e.ym)}</td><td>{원(e.임대)}</td><td>{원(e.받음)}</td><td>{원(e.경비)}</td><td>{원(e.남음)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

/* ── 달 고르기 (목록 위) ── */
function 달고르기({ 달들, 달, set달 }) {
  return (
    <select value={달} onChange={(e) => set달(e.target.value)}>
      {달들.map((m) => <option key={m} value={m}>{달글(m)}</option>)}
      <option value="">전부</option>
    </select>
  )
}

/* ── ✍️ 사용 적기 ── */
const 빈사용 = () => ({ d: 오늘(), dr: '', e: '', cl: '', s: '', q: '', un: '시간', u: '', amt: '', oil: '', ok: 'G', m: '' })
function 사용칸({ 자료, 달들, 저장, 지우기 }) {
  const [v, setV] = useState(빈사용)
  const [고침, set고침] = useState(null)
  const [금액손, set금액손] = useState(false)           // 금액을 손으로 고쳤나
  const [달, set달] = useState(이번달())
  const dr = 자료.drivers, cl = 자료.clients
  const 단가찾기 = (drid, un) => { const x = dr[drid]; if (!x) return ''; return String(un === '일' ? (x.ud || '') : (x.u || '')) }
  const 바꿈 = (k, val) => {
    const n = { ...v, [k]: val }
    if (k === 'dr') { const x = dr[val]; if (x) { n.e = x.e || n.e; n.u = 단가찾기(val, n.un) || n.u } }
    if (k === 'un') n.u = 단가찾기(n.dr, val) || n.u
    if (k === 'cl') { const x = cl[val]; if (x && x.s) n.s = x.s }
    if (!금액손 && ['dr', 'un', 'u', 'q'].includes(k)) n.amt = n.q && n.u ? String(줄금액(n.q, 수(n.u))) : ''
    setV(n)
  }
  const 금액 = 수(v.amt)
  const 틀림 = !v.d ? '날짜' : !v.cl ? '거래처를 고르십시오' : !(수(v.q) > 0) ? '수량' : !(금액 > 0) ? '금액' : ''
  const 올리기 = async () => {
    const x = dr[v.dr], c = cl[v.cl]
    const 값 = { d: v.d, cl: v.cl, cn: (c && c.n) || '', q: 수(v.q), un: v.un, u: 수(v.u), amt: 금액, ok: v.ok === 'C' ? 'C' : 'G' }
    if (v.dr) { 값.dr = v.dr; 값.dn = (x && x.n) || '' }
    if (v.e.trim()) 값.e = v.e.trim().slice(0, 30)
    if (v.s.trim()) 값.s = v.s.trim().slice(0, 60)
    if (수(v.oil) > 0) 값.oil = 수(v.oil)
    if (v.m.trim()) 값.m = v.m.trim().slice(0, 100)
    if (고침) 값.at = 자료.rows[고침] && 자료.rows[고침].at
    const ok = await 저장('rows', 고침, 값)
    if (ok) { setV({ ...빈사용(), d: v.d, dr: v.dr, e: v.e, cl: v.cl, s: v.s, un: v.un, u: v.u }); set고침(null); set금액손(false); set달(v.d.slice(0, 7)) }
  }
  const 고치기 = (r) => {
    set고침(r.id); set금액손(true)
    setV({ d: r.d, dr: r.dr || '', e: r.e || '', cl: r.cl || '', s: r.s || '', q: String(r.q ?? ''), un: r.un || '시간', u: String(r.u ?? ''),
      amt: String(r.amt ?? ''), oil: r.oil ? String(r.oil) : '', ok: r.ok || 'G', m: r.m || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const 목록 = 배열(자료.rows).filter((r) => !달 || (r.d || '').startsWith(달)).sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : (b.at || 0) - (a.at || 0)))
  const 달합 = 목록.reduce((s, r) => s + 청구액(r), 0)
  return (
    <>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>{고침 ? '✏️ 고치는 중' : '✍️ 사용 적기'}</div>
        <div className="eq-3">
          <div className="field"><label>날짜</label><input type="date" value={v.d} onChange={(e) => 바꿈('d', e.target.value)} /></div>
          <div className="field"><label>기사 · 장비</label>
            <select value={v.dr} onChange={(e) => 바꿈('dr', e.target.value)}>
              <option value="">(고르기)</option>
              {배열(dr).sort((a, b) => a.n.localeCompare(b.n)).map((x) => <option key={x.id} value={x.id}>{x.n} · {x.e}</option>)}
            </select></div>
          <div className="field"><label>장비명 <span className="hint">바꿔 써도 됩니다</span></label><input value={v.e} maxLength={30} onChange={(e) => 바꿈('e', e.target.value)} /></div>
        </div>
        <div className="eq-2">
          <div className="field"><label>거래처</label>
            <select value={v.cl} onChange={(e) => 바꿈('cl', e.target.value)}>
              <option value="">(고르기)</option>
              {배열(cl).sort((a, b) => a.n.localeCompare(b.n)).map((x) => <option key={x.id} value={x.id}>{x.n}</option>)}
            </select></div>
          <div className="field"><label>현장명</label><input value={v.s} maxLength={60} onChange={(e) => 바꿈('s', e.target.value)} /></div>
        </div>
        <div className="eq-4">
          <div className="field"><label>수량</label><input inputMode="decimal" value={v.q} onChange={(e) => 바꿈('q', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="8" /></div>
          <div className="field"><label>단위</label>
            <select value={v.un} onChange={(e) => 바꿈('un', e.target.value)}>{단위들.map((u) => <option key={u}>{u}</option>)}</select></div>
          <div className="field"><label>단가</label><input inputMode="numeric" value={쉼표칸(v.u)} onChange={(e) => 바꿈('u', e.target.value.replace(/[^0-9]/g, ''))} /></div>
          <div className="field"><label>금액 <span className="hint">수량×단가</span></label>
            <input inputMode="numeric" value={쉼표칸(v.amt)} onChange={(e) => { set금액손(true); setV({ ...v, amt: e.target.value.replace(/[^0-9]/g, '') }) }} /></div>
        </div>
        <div className="eq-2">
          <div className="field"><label>유류대</label><input inputMode="numeric" value={쉼표칸(v.oil)} onChange={(e) => setV({ ...v, oil: e.target.value.replace(/[^0-9]/g, '') })} placeholder="없으면 비움" /></div>
          <div className="field"><label>유류대는</label>
            <div className="eq-seg">
              <button className={v.ok !== 'C' ? 'on' : ''} onClick={() => setV({ ...v, ok: 'G' })}>원청이 대 줌 <small>(받은 돈)</small></button>
              <button className={v.ok === 'C' ? 'on' : ''} onClick={() => setV({ ...v, ok: 'C' })}>내가 청구 <small>(임대료에 더함)</small></button>
            </div></div>
        </div>
        <div className="field"><label>비고</label><input value={v.m} maxLength={100} onChange={(e) => setV({ ...v, m: e.target.value })} /></div>
        <div className="btn-row">
          <button className="btn primary" disabled={!!틀림} onClick={올리기}>{틀림 ? 틀림말(틀림) : 고침 ? '고친 것 저장' : '＋ 적기'}</button>
          {고침 && <button className="btn ghost" onClick={() => { set고침(null); set금액손(false); setV(빈사용()) }}>고치기 그만</button>}
        </div>
      </div>
      <div className="card">
        <div className="eq-bar">
          <span className="sec-title" style={{ margin: 0 }}>적은 것</span>
          <달고르기 달들={달들} 달={달} set달={set달} />
          <span className="muted">{목록.length}건 · {원(달합)}원</span>
        </div>
        <div className="eq-scroll">
          <table className="tbl eq-t eq-list">
            <thead><tr><th>날짜</th><th>기사 · 장비</th><th>거래처 · 현장</th><th>수량</th><th>단가</th><th>금액</th><th>유류</th><th></th></tr></thead>
            <tbody>
              {목록.map((r) => (
                <tr key={r.id}>
                  <td>{r.d.slice(5)}</td>
                  <td>{r.dn || '-'}<div className="d">{r.e || ''}</div></td>
                  <td>{(cl[r.cl] && cl[r.cl].n) || r.cn || '-'}<div className="d">{r.s || ''}{r.m ? ` · ${r.m}` : ''}</div></td>
                  <td>{r.q}{r.un}</td><td>{원(r.u)}</td><td><b>{원(r.amt)}</b></td>
                  <td>{r.oil ? <>{원(r.oil)}<div className="d">{r.ok === 'C' ? '청구' : '원청'}</div></> : '-'}</td>
                  <td className="eq-act"><button className="btn sm ghost" onClick={() => 고치기(r)}>고치기</button>
                    <button className="btn sm ghost" onClick={() => { if (window.confirm('이 줄을 지울까요? (휴지통으로 갑니다)')) 지우기('rows', r.id) }}>지우기</button></td>
                </tr>
              ))}
              {!목록.length && <tr><td colSpan={8} className="muted" style={{ textAlign: 'center' }}>이 달에 적은 것이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ── 💰 수금 ── */
const 빈수금 = () => ({ d: 오늘(), cl: '', amt: '', how: '계좌이체', dr: '', m: '' })
function 수금칸({ 자료, 달들, 저장, 지우기 }) {
  const [v, setV] = useState(빈수금)
  const [고침, set고침] = useState(null)
  const [달, set달] = useState(이번달())
  const cl = 자료.clients
  const 거 = 거래처현황(자료)
  const 미수 = v.cl ? (거.줄.find((e) => e.id === v.cl) || {}).미수 : null
  const 틀림 = !v.d ? '날짜' : !v.cl ? '거래처를 고르십시오' : !(수(v.amt) > 0) ? '금액' : ''
  const 올리기 = async () => {
    const c = cl[v.cl]
    const 값 = { d: v.d, cl: v.cl, cn: (c && c.n) || '', amt: 수(v.amt), how: v.how }
    if (v.dr) 값.dr = v.dr
    if (v.m.trim()) 값.m = v.m.trim().slice(0, 100)
    if (고침) 값.at = 자료.pay[고침] && 자료.pay[고침].at
    const ok = await 저장('pay', 고침, 값)
    if (ok) { setV({ ...빈수금(), d: v.d }); set고침(null); set달(v.d.slice(0, 7)) }
  }
  const 목록 = 배열(자료.pay).filter((r) => !달 || (r.d || '').startsWith(달)).sort((a, b) => (a.d < b.d ? 1 : -1))
  return (
    <>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>{고침 ? '✏️ 고치는 중' : '💰 받은 돈 적기'}</div>
        <div className="eq-3">
          <div className="field"><label>받은 날</label><input type="date" value={v.d} onChange={(e) => setV({ ...v, d: e.target.value })} /></div>
          <div className="field"><label>거래처</label>
            <select value={v.cl} onChange={(e) => setV({ ...v, cl: e.target.value })}>
              <option value="">(고르기)</option>
              {배열(cl).sort((a, b) => a.n.localeCompare(b.n)).map((x) => <option key={x.id} value={x.id}>{x.n}</option>)}
            </select></div>
          <div className="field"><label>금액</label><input inputMode="numeric" value={쉼표칸(v.amt)} onChange={(e) => setV({ ...v, amt: e.target.value.replace(/[^0-9]/g, '') })} /></div>
        </div>
        {미수 != null && <p className="note sm" style={{ margin: '0 0 8px' }}>이 거래처 미수금(지금까지): <b className={미수 > 0 ? 'eq-red' : ''}>{원(미수)}원</b>
          {미수 > 0 && <> · <button className="linklike" onClick={() => setV({ ...v, amt: String(미수) })}>다 받음으로 채우기</button></>}</p>}
        <div className="eq-3">
          <div className="field"><label>받은 방법</label><select value={v.how} onChange={(e) => setV({ ...v, how: e.target.value })}>{받는법.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>기사 <span className="hint">기사별로 볼 때</span></label>
            <select value={v.dr} onChange={(e) => setV({ ...v, dr: e.target.value })}>
              <option value="">(없음)</option>
              {배열(자료.drivers).map((x) => <option key={x.id} value={x.id}>{x.n} · {x.e}</option>)}
            </select></div>
          <div className="field"><label>내용</label><input value={v.m} maxLength={100} onChange={(e) => setV({ ...v, m: e.target.value })} placeholder="예: 8월분" /></div>
        </div>
        <div className="btn-row">
          <button className="btn primary" disabled={!!틀림} onClick={올리기}>{틀림 ? 틀림말(틀림) : 고침 ? '고친 것 저장' : '＋ 받은 돈 적기'}</button>
          {고침 && <button className="btn ghost" onClick={() => { set고침(null); setV(빈수금()) }}>고치기 그만</button>}
        </div>
      </div>
      <div className="card">
        <div className="eq-bar">
          <span className="sec-title" style={{ margin: 0 }}>받은 돈</span>
          <달고르기 달들={달들} 달={달} set달={set달} />
          <span className="muted">{목록.length}건 · {원(목록.reduce((s, r) => s + (r.amt || 0), 0))}원</span>
        </div>
        <div className="eq-scroll">
          <table className="tbl eq-t eq-list">
            <thead><tr><th>날짜</th><th>거래처</th><th>금액</th><th>방법 · 내용</th><th></th></tr></thead>
            <tbody>
              {목록.map((r) => (
                <tr key={r.id}><td>{r.d.slice(5)}</td><td>{(cl[r.cl] && cl[r.cl].n) || r.cn}</td><td><b>{원(r.amt)}</b></td>
                  <td>{r.how || ''}<div className="d">{r.m || ''}</div></td>
                  <td className="eq-act"><button className="btn sm ghost" onClick={() => { set고침(r.id); setV({ d: r.d, cl: r.cl, amt: String(r.amt), how: r.how || '계좌이체', dr: r.dr || '', m: r.m || '' }) }}>고치기</button>
                    <button className="btn sm ghost" onClick={() => { if (window.confirm('지울까요? (휴지통으로 갑니다)')) 지우기('pay', r.id) }}>지우기</button></td></tr>
              ))}
              {!목록.length && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center' }}>이 달에 받은 돈이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ── 🔧 경비 (정비·주유 등 내 돈 나간 것) ── */
const 빈경비 = () => ({ d: 오늘(), t: '', amt: '', dr: '', m: '' })
function 경비칸({ 자료, 달들, 저장, 지우기 }) {
  const [v, setV] = useState(빈경비)
  const [고침, set고침] = useState(null)
  const [달, set달] = useState(이번달())
  const 틀림 = !v.d ? '날짜' : !v.t.trim() ? '내용' : !(수(v.amt) > 0) ? '금액' : ''
  const 올리기 = async () => {
    const 값 = { d: v.d, t: v.t.trim().slice(0, 60), amt: 수(v.amt) }
    if (v.dr) 값.dr = v.dr
    if (v.m.trim()) 값.m = v.m.trim().slice(0, 100)
    if (고침) 값.at = 자료.cost[고침] && 자료.cost[고침].at
    const ok = await 저장('cost', 고침, 값)
    if (ok) { setV({ ...빈경비(), d: v.d, dr: v.dr }); set고침(null); set달(v.d.slice(0, 7)) }
  }
  const 목록 = 배열(자료.cost).filter((r) => !달 || (r.d || '').startsWith(달)).sort((a, b) => (a.d < b.d ? 1 : -1))
  return (
    <>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>{고침 ? '✏️ 고치는 중' : '🔧 경비 적기'} <span className="count">· 정비·주유·수리 등 나간 돈</span></div>
        <div className="eq-3">
          <div className="field"><label>날짜</label><input type="date" value={v.d} onChange={(e) => setV({ ...v, d: e.target.value })} /></div>
          <div className="field"><label>내용</label><input value={v.t} maxLength={60} onChange={(e) => setV({ ...v, t: e.target.value })} placeholder="예: 엔진오일 교환" /></div>
          <div className="field"><label>금액</label><input inputMode="numeric" value={쉼표칸(v.amt)} onChange={(e) => setV({ ...v, amt: e.target.value.replace(/[^0-9]/g, '') })} /></div>
        </div>
        <div className="eq-2">
          <div className="field"><label>기사 · 장비</label>
            <select value={v.dr} onChange={(e) => setV({ ...v, dr: e.target.value })}>
              <option value="">(없음)</option>
              {배열(자료.drivers).map((x) => <option key={x.id} value={x.id}>{x.n} · {x.e}</option>)}
            </select></div>
          <div className="field"><label>메모</label><input value={v.m} maxLength={100} onChange={(e) => setV({ ...v, m: e.target.value })} /></div>
        </div>
        <div className="btn-row">
          <button className="btn primary" disabled={!!틀림} onClick={올리기}>{틀림 ? 틀림말(틀림) : 고침 ? '고친 것 저장' : '＋ 경비 적기'}</button>
          {고침 && <button className="btn ghost" onClick={() => { set고침(null); setV(빈경비()) }}>고치기 그만</button>}
        </div>
      </div>
      <div className="card">
        <div className="eq-bar">
          <span className="sec-title" style={{ margin: 0 }}>나간 돈</span>
          <달고르기 달들={달들} 달={달} set달={set달} />
          <span className="muted">{목록.length}건 · {원(목록.reduce((s, r) => s + (r.amt || 0), 0))}원</span>
        </div>
        <div className="eq-scroll">
          <table className="tbl eq-t eq-list">
            <thead><tr><th>날짜</th><th>내용</th><th>기사 · 장비</th><th>금액</th><th></th></tr></thead>
            <tbody>
              {목록.map((r) => (
                <tr key={r.id}><td>{r.d.slice(5)}</td><td>{r.t}<div className="d">{r.m || ''}</div></td>
                  <td>{(자료.drivers[r.dr] && `${자료.drivers[r.dr].n} · ${자료.drivers[r.dr].e}`) || '-'}</td><td><b>{원(r.amt)}</b></td>
                  <td className="eq-act"><button className="btn sm ghost" onClick={() => { set고침(r.id); setV({ d: r.d, t: r.t, amt: String(r.amt), dr: r.dr || '', m: r.m || '' }) }}>고치기</button>
                    <button className="btn sm ghost" onClick={() => { if (window.confirm('지울까요? (휴지통으로 갑니다)')) 지우기('cost', r.id) }}>지우기</button></td></tr>
              ))}
              {!목록.length && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center' }}>이 달에 적은 경비가 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ── 🧾 청구서 ── */
function 청구칸({ 자료, 달들, 정보, 풀린 }) {
  const cls = 배열(자료.clients).sort((a, b) => a.n.localeCompare(b.n))
  const [cl, setCl] = useState(() => (cls[0] && cls[0].id) || '')
  const [달, set달] = useState(이번달())
  const [모두, set모두] = useState(false)
  const [인쇄중, 인쇄] = use인쇄(`청구서_${달}`)
  const from = 달 ? 달첫날(달) : '', to = 달 ? 달끝날(달) : ''
  const 대상 = 모두 ? cls.filter((c) => 청구서(자료, c.id, from, to).줄.length) : cls.filter((c) => c.id === cl)
  const 종이들 = 대상.map((c) => <청구종이 key={c.id} 자료={자료} 거래처={c} from={from} to={to} 정보={정보} 풀린={풀린} />)
  /* 📗 G110 값만 엑셀 — 고른 거래처(또는 이 달 거래처 모두)의 청구서 + 한눈에 표 셋 */
  const 엑셀받기 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸, 흐린칸 } = await import('../lib/값엑셀.js')
    const 기간글 = from ? `${from} ~ ${to}` : '처음부터'
    const 묶 = 대상.map((c) => ({ c, b: 청구서(자료, c.id, from, to) }))
    const 요약 = 묶.map(({ c, b }) => [c.n, c.s || '', 기간글, 수칸(b.전기미수), 수칸(b.이번청구), 수칸(b.이번유류), 수칸(b.이번수금), 수칸(b.누계미수), b.줄.length])
    const 합 = (k) => 묶.reduce((t, x) => t + (x.b[k] || 0), 0)
    if (묶.length > 1) 요약.push([굵은칸('합계'), '', '', 수칸(합('전기미수')), 수칸(합('이번청구')), 수칸(합('이번유류')), 수칸(합('이번수금')), 수칸(합('누계미수')), 묶.reduce((t, x) => t + x.b.줄.length, 0)])
    const 시트 = [{ name: '청구 요약', head: ['거래처', '현장', '기간', '전기 미수금', '이번 청구', '원청 유류(*)', '이번 기간 받은 돈', '청구금액(누계 미수)', '사용 건수'], rows: 요약, widths: [16, 18, 24, 13, 13, 12, 14, 16, 9] }]
    const 쓴이름 = new Set(['청구 요약', '거래처 현황', '기사 현황', '달마다'])
    for (const { c, b } of 묶) {
      let 이름 = `청구서 ${c.n}`.slice(0, 31)
      for (let i = 2; 쓴이름.has(이름); i++) 이름 = `청구서 ${c.n}`.slice(0, 27) + ` (${i})`
      쓴이름.add(이름)
      const 줄 = b.줄.map((r) => [r.d, r.e || '', r.dn || '', r.s || '', r.q || 0, r.un || '', 수칸(r.u), 수칸(r.amt), r.oil ? 수칸(r.oil) : '', r.oil ? (r.ok === 'C' ? '내가 청구' : '원청이 대 줌(*)') : '', r.m || ''])
      const 빈 = Array(11).fill('')
      const 칸 = (라벨, 값) => { const x = [...빈]; x[0] = 굵은칸(라벨); x[7] = 값; return x }
      줄.push([...빈])
      줄.push(칸('전기 미수금', 수칸(b.전기미수)))
      줄.push(칸('이번 청구', 수칸(b.이번청구)))
      for (const p of b.받은줄) { const x = [...빈]; x[0] = '받은 돈'; x[1] = p.d; x[2] = p.how || ''; x[7] = 수칸(p.amt); x[10] = p.m || ''; 줄.push(x) }
      줄.push(칸('이번 기간 받은 돈', 수칸(b.이번수금)))
      줄.push(칸('원청 유류(*)', 수칸(b.이번유류)))
      줄.push(칸('청구금액 (누계 미수)', 수칸(b.누계미수)))
      줄.push([...빈])
      const 나 = [['받는 곳', `${c.n} 귀하${c.s ? ' · 현장 ' + c.s : ''}`], ['기간', 기간글], ['상호', 정보.name || ''], ['대표', 정보.ceo || ''],
        ['사업자번호', 풀린.biz || ''], ['주소', 정보.addr || ''], ['전화', 정보.tel || ''],
        ['입금 계좌', [풀린.bank, 풀린.acct, 풀린.holder ? `(예금주 ${풀린.holder})` : ''].filter(Boolean).join(' ')]]
      for (const [k, v] of 나) if (v) { const x = [...빈]; x[0] = 굵은칸(k); x[1] = v; 줄.push(x) }
      줄.push([흐린칸('* 원청이 대 준 유류대는 받은 돈으로 셈했습니다.')])
      시트.push({ name: 이름, head: ['날짜', '장비명', '기사', '현장명', '수량', '단위', '단가', '금액', '유류대', '유류 구분', '비고'], rows: 줄, widths: [14, 14, 10, 16, 7, 6, 11, 13, 11, 14, 22] })
    }
    const 기간 = from ? { from, to } : {}
    const 거 = 거래처현황(자료, 기간)
    시트.push({ name: '거래처 현황', head: ['거래처', '현장', '임대료', '수금', '원청 유류', '받은 돈', '미수금', '건수'],
      rows: [...거.줄.filter((e) => e.임대 || e.받음).map((e) => [e.이름, e.현장 || '', 수칸(e.임대), 수칸(e.수금), 수칸(e.유류), 수칸(e.받음), 수칸(e.미수), e.건]),
        [굵은칸('합계'), '', 수칸(거.합.임대), 수칸(거.합.수금), 수칸(거.합.유류), 수칸(거.합.받음), 수칸(거.합.미수), 거.합.건]], widths: [16, 18, 13, 13, 12, 13, 13, 7] })
    시트.push({ name: '기사 현황', head: ['기사', '장비', '시간', '일', '임대료', '그 기사로 받은 수금', '경비'],
      rows: 기사현황(자료, 기간).filter((e) => e.임대 || e.수금 || e.경비).map((e) => [e.이름, e.장비 || '', e.시간 || 0, e.일 || 0, 수칸(e.임대), 수칸(e.수금), 수칸(e.경비)]), widths: [12, 16, 8, 6, 13, 16, 12] })
    시트.push({ name: '달마다', head: ['달', '임대료', '받은 돈', '경비', '임대료 − 경비'],
      rows: 달마다(자료).map((e) => [e.ym, 수칸(e.임대), 수칸(e.받음), 수칸(e.경비), 수칸(e.남음)]), widths: [10, 14, 14, 13, 15] })
    값엑셀받기(`장비청구서_${모두 ? '거래처모두' : (대상[0] && 대상[0].n) || ''}_${달 || '전부'}`, 시트, { 주소: '/tools/equip' })
  }
  return (
    <>
      <div className="card">
        <div className="eq-bar">
          <select value={cl} onChange={(e) => { setCl(e.target.value); set모두(false) }} disabled={모두}>
            {cls.map((c) => <option key={c.id} value={c.id}>{c.n}</option>)}
          </select>
          <select value={달} onChange={(e) => set달(e.target.value)}>
            {달들.map((m) => <option key={m} value={m}>{달글(m)}</option>)}
            <option value="">처음부터 전부</option>
          </select>
          <label className="eq-chk"><input type="checkbox" checked={모두} onChange={(e) => set모두(e.target.checked)} /> 이 달 거래처 모두</label>
          <button className="btn primary" disabled={!대상.length} onClick={인쇄}>🖨 인쇄 · PDF ({대상.length}장)</button>
          <button className="btn ghost" disabled={!대상.length} onClick={엑셀받기} title="청구서 · 거래처 현황 · 기사 현황 · 달마다 — 셈한 값만(수식 없음)">📗 엑셀(값만)</button>
        </div>
        <p className="note sm" style={{ margin: '8px 0 0' }}>A4 세로입니다. 아래 «장부 정보» 에 사업자번호·입금 계좌를 적어 두면 청구서 아래에 나옵니다.</p>
      </div>
      {!대상.length && <div className="card muted">이 달에 청구할 사용 내역이 없습니다.</div>}
      {종이들.map((x, i) => <div className="card eq-paperwrap" key={i}>{x}</div>)}
      {인쇄중 && createPortal(<div id="gp-인쇄">{종이들.map((x, i) => <div className="eq-쪽" key={i}>{x}</div>)}</div>, document.body)}
    </>
  )
}

function 청구종이({ 자료, 거래처, from, to, 정보, 풀린 }) {
  const b = 청구서(자료, 거래처.id, from, to)
  const 청구합 = b.이번청구
  const 받을 = b.누계미수
  const 기간글 = from ? `${from} ~ ${to}` : '처음부터'
  return (
    <div className="eq-paper">
      <div className="eq-p-title">청 구 서</div>
      <div className="eq-p-top">
        <div className="eq-p-to">
          <div className="eq-p-dt">{오늘().replace(/-/g, '. ')}.</div>
          <div className="eq-p-cl"><b>{거래처.n}</b> 귀하</div>
          {거래처.s ? <div className="eq-p-s">현장: {거래처.s}</div> : null}
          <div className="eq-p-amt">청구금액 <b>{원(받을)}원</b><span>(일금 {한글돈(받을)}원정)</span></div>
          <div className="eq-p-s">기간: {기간글}</div>
        </div>
        <table className="eq-p-me"><tbody>
          <tr><th>상 호</th><td>{정보.name}</td></tr>
          <tr><th>대 표</th><td>{정보.ceo || ''}<span className="eq-p-in">(인)</span></td></tr>
          {풀린.biz ? <tr><th>사업자번호</th><td>{풀린.biz}</td></tr> : null}
          {정보.addr ? <tr><th>주 소</th><td>{정보.addr}</td></tr> : null}
          {정보.tel ? <tr><th>전 화</th><td>{정보.tel}</td></tr> : null}
        </tbody></table>
      </div>
      <table className="eq-p-t">
        <thead><tr><th>날짜</th><th>장비명</th><th>기사</th><th>현장명</th><th>수량</th><th>단가</th><th>금액</th><th>유류대</th><th>비고</th></tr></thead>
        <tbody>
          {b.줄.map((r) => (
            <tr key={r.id}><td>{r.d.slice(2).replace(/-/g, '.')}</td><td>{r.e || ''}</td><td>{r.dn || ''}</td><td className="l">{r.s || ''}</td>
              <td>{r.q}{r.un}</td><td className="r">{원(r.u)}</td><td className="r">{원(r.amt)}</td>
              <td className="r">{r.oil ? `${원(r.oil)}${r.ok === 'C' ? '' : '*'}` : ''}</td><td className="l">{r.m || ''}</td></tr>
          ))}
          {!b.줄.length && <tr><td colSpan={9}>이 기간 사용 내역 없음</td></tr>}
        </tbody>
      </table>
      <table className="eq-p-sum"><tbody>
        <tr><th>전기 미수금</th><td>{원(b.전기미수)}</td><th>이번 청구</th><td>{원(청구합)}</td></tr>
        <tr><th>이번 기간 받은 돈</th><td>{원(b.이번수금)}</td><th>원청 유류(*)</th><td>{원(b.이번유류)}</td></tr>
        <tr className="tot"><th colSpan={3}>청구금액 (누계 미수)</th><td>{원(받을)}</td></tr>
      </tbody></table>
      <div className="eq-p-foot">
        {(풀린.bank || 풀린.acct) ? <div>입금 계좌: {[풀린.bank, 풀린.acct, 풀린.holder ? `(예금주 ${풀린.holder})` : ''].filter(Boolean).join(' ')}</div> : null}
        <div className="muted">* 표시 유류대는 원청이 대 준 것으로, 받은 돈으로 셈했습니다.</div>
        <div className="eq-p-kc">K-건설맵 장비 장부 · k-conmap.com</div>
      </div>
    </div>
  )
}

/* ── 📇 등록 ── */
function 등록칸({ 자료, 저장, 지우기 }) {
  return (
    <>
      <기사등록 자료={자료} 저장={저장} 지우기={지우기} />
      <거래처등록 자료={자료} 저장={저장} 지우기={지우기} />
    </>
  )
}
function 기사등록({ 자료, 저장, 지우기 }) {
  const 빈 = { n: '', e: '', no: '', u: '', ud: '', m: '' }
  const [v, setV] = useState(빈)
  const [고침, set고침] = useState(null)
  const 틀림 = !v.n.trim() ? '기사명' : !v.e.trim() ? '장비명' : ''
  const 올리기 = async () => {
    const 값 = { n: v.n.trim().slice(0, 20), e: v.e.trim().slice(0, 30), u: 수(v.u) }
    if (v.no.trim()) 값.no = v.no.trim().slice(0, 20)
    if (수(v.ud) > 0) 값.ud = 수(v.ud)
    if (v.m.trim()) 값.m = v.m.trim().slice(0, 60)
    if (고침) 값.at = 자료.drivers[고침] && 자료.drivers[고침].at
    if (await 저장('drivers', 고침, 값)) { setV(빈); set고침(null) }
  }
  return (
    <div className="card">
      <div className="sec-title" style={{ margin: '0 0 8px' }}>👷 기사 · 장비 {고침 ? '— 고치는 중' : ''}</div>
      <div className="eq-3">
        <div className="field"><label>기사명</label><input value={v.n} maxLength={20} onChange={(e) => setV({ ...v, n: e.target.value })} /></div>
        <div className="field"><label>장비명</label><input value={v.e} maxLength={30} onChange={(e) => setV({ ...v, e: e.target.value })} placeholder="굴삭기 06W" /></div>
        <div className="field"><label>차량(등록)번호</label><input value={v.no} maxLength={20} onChange={(e) => setV({ ...v, no: e.target.value })} /></div>
      </div>
      <div className="eq-3">
        <div className="field"><label>시간당 단가</label><input inputMode="numeric" value={쉼표칸(v.u)} onChange={(e) => setV({ ...v, u: e.target.value.replace(/[^0-9]/g, '') })} /></div>
        <div className="field"><label>일대 단가 <span className="hint">하루 단위로 받을 때</span></label><input inputMode="numeric" value={쉼표칸(v.ud)} onChange={(e) => setV({ ...v, ud: e.target.value.replace(/[^0-9]/g, '') })} /></div>
        <div className="field"><label>메모</label><input value={v.m} maxLength={60} onChange={(e) => setV({ ...v, m: e.target.value })} /></div>
      </div>
      <div className="btn-row">
        <button className="btn primary" disabled={!!틀림} onClick={올리기}>{틀림 ? 틀림말(틀림) : 고침 ? '고친 것 저장' : '＋ 등록'}</button>
        {고침 && <button className="btn ghost" onClick={() => { set고침(null); setV(빈) }}>고치기 그만</button>}
      </div>
      <div className="eq-scroll" style={{ marginTop: 10 }}>
        <table className="tbl eq-t eq-list">
          <thead><tr><th>기사</th><th>장비 · 번호</th><th>시간당</th><th>일대</th><th></th></tr></thead>
          <tbody>
            {배열(자료.drivers).sort((a, b) => a.n.localeCompare(b.n)).map((x) => (
              <tr key={x.id}><td><b>{x.n}</b><div className="d">{x.m || ''}</div></td><td>{x.e}<div className="d">{x.no || ''}</div></td>
                <td>{원(x.u)}</td><td>{x.ud ? 원(x.ud) : '-'}</td>
                <td className="eq-act"><button className="btn sm ghost" onClick={() => { set고침(x.id); setV({ n: x.n, e: x.e, no: x.no || '', u: String(x.u || ''), ud: String(x.ud || ''), m: x.m || '' }) }}>고치기</button>
                  <button className="btn sm ghost" onClick={() => { if (window.confirm('지울까요? 적어 둔 사용 내역은 그대로입니다. (휴지통으로 갑니다)')) 지우기('drivers', x.id) }}>지우기</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function 거래처등록({ 자료, 저장, 지우기 }) {
  const 빈 = { n: '', s: '', p: '', t: '', m: '' }
  const [v, setV] = useState(빈)
  const [고침, set고침] = useState(null)
  const 틀림 = !v.n.trim() ? '거래처' : ''
  const 올리기 = async () => {
    const 값 = { n: v.n.trim().slice(0, 40) }
    if (v.s.trim()) 값.s = v.s.trim().slice(0, 60)
    if (v.p.trim()) 값.p = v.p.trim().slice(0, 20)
    if (v.t.trim()) 값.t = v.t.trim().slice(0, 20)
    if (v.m.trim()) 값.m = v.m.trim().slice(0, 60)
    if (고침) 값.at = 자료.clients[고침] && 자료.clients[고침].at
    if (await 저장('clients', 고침, 값)) { setV(빈); set고침(null) }
  }
  return (
    <div className="card">
      <div className="sec-title" style={{ margin: '0 0 8px' }}>🏢 거래처 {고침 ? '— 고치는 중' : ''}</div>
      <div className="eq-2">
        <div className="field"><label>거래처(상호)</label><input value={v.n} maxLength={40} onChange={(e) => setV({ ...v, n: e.target.value })} /></div>
        <div className="field"><label>현장명</label><input value={v.s} maxLength={60} onChange={(e) => setV({ ...v, s: e.target.value })} /></div>
      </div>
      <div className="eq-3">
        <div className="field"><label>담당</label><input value={v.p} maxLength={20} onChange={(e) => setV({ ...v, p: e.target.value })} /></div>
        <div className="field"><label>전화</label><input value={v.t} maxLength={20} onChange={(e) => setV({ ...v, t: e.target.value })} /></div>
        <div className="field"><label>메모</label><input value={v.m} maxLength={60} onChange={(e) => setV({ ...v, m: e.target.value })} /></div>
      </div>
      <div className="btn-row">
        <button className="btn primary" disabled={!!틀림} onClick={올리기}>{틀림 ? 틀림말(틀림) : 고침 ? '고친 것 저장' : '＋ 등록'}</button>
        {고침 && <button className="btn ghost" onClick={() => { set고침(null); setV(빈) }}>고치기 그만</button>}
      </div>
      <div className="eq-scroll" style={{ marginTop: 10 }}>
        <table className="tbl eq-t eq-list">
          <thead><tr><th>거래처</th><th>현장</th><th>담당 · 전화</th><th></th></tr></thead>
          <tbody>
            {배열(자료.clients).sort((a, b) => a.n.localeCompare(b.n)).map((x) => (
              <tr key={x.id}><td><b>{x.n}</b><div className="d">{x.m || ''}</div></td><td>{x.s || '-'}</td><td>{x.p || ''}<div className="d">{x.t || ''}</div></td>
                <td className="eq-act"><button className="btn sm ghost" onClick={() => { set고침(x.id); setV({ n: x.n, s: x.s || '', p: x.p || '', t: x.t || '', m: x.m || '' }) }}>고치기</button>
                  <button className="btn sm ghost" onClick={() => { if (window.confirm('지울까요? 적어 둔 사용 내역·수금은 그대로입니다. (휴지통으로 갑니다)')) 지우기('clients', x.id) }}>지우기</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── ⚙️ 장부 정보 ── */
function 정보칸(p) {
  const { 정보, 풀린, 휴지통, 예시, 열쇠있음 } = p
  const [v, setV] = useState({ name: 정보.name || '', ceo: 정보.ceo || '', tel: 정보.tel || '', addr: 정보.addr || '' })
  const [잠, set잠] = useState({ biz: 풀린.biz || '', bank: 풀린.bank || '', acct: 풀린.acct || '', holder: 풀린.holder || '' })
  const 저장하기 = () => {
    const 새 = { ...정보, name: v.name.trim().slice(0, 40) || 정보.name }
    for (const k of ['ceo', 'tel']) { if (v[k].trim()) 새[k] = v[k].trim().slice(0, 20); else delete 새[k] }
    if (v.addr.trim()) 새.addr = v.addr.trim().slice(0, 80); else delete 새.addr
    const 잠값 = {}
    for (const k of Object.keys(잠)) if (String(잠[k]).trim()) 잠값[k] = String(잠[k]).trim().slice(0, 40)
    p.정보고치기(새, 열쇠있음 ? 잠값 : undefined)     // ⚠️ 잠금이 안 풀렸으면 잠근 칸(x)은 그대로 둡니다
  }
  useEffect(() => { set잠({ biz: 풀린.biz || '', bank: 풀린.bank || '', acct: 풀린.acct || '', holder: 풀린.holder || '' }) }, [풀린])
  return (
    <>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>⚙️ 장부 정보 <span className="count">· 청구서에 나옵니다</span></div>
        <div className="eq-2">
          <div className="field"><label>상호</label><input value={v.name} maxLength={40} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
          <div className="field"><label>대표</label><input value={v.ceo} maxLength={20} onChange={(e) => setV({ ...v, ceo: e.target.value })} /></div>
        </div>
        <div className="eq-2">
          <div className="field"><label>전화</label><input value={v.tel} maxLength={20} onChange={(e) => setV({ ...v, tel: e.target.value })} /></div>
          <div className="field"><label>주소</label><input value={v.addr} maxLength={80} onChange={(e) => setV({ ...v, addr: e.target.value })} /></div>
        </div>
        <div className="sec-title" style={{ margin: '10px 0 6px' }}>🔒 잠가서 저장 <span className="count">· 비밀번호로 잠급니다 — 서버는 못 읽습니다</span></div>
        {!열쇠있음 ? <잠금풀칸 풀기={p.잠금풀기} /> : (
          <>
            <div className="eq-2">
              <div className="field"><label>사업자번호</label><input value={잠.biz} maxLength={20} onChange={(e) => set잠({ ...잠, biz: e.target.value })} /></div>
              <div className="field"><label>은행</label><input value={잠.bank} maxLength={20} onChange={(e) => set잠({ ...잠, bank: e.target.value })} /></div>
            </div>
            <div className="eq-2">
              <div className="field"><label>계좌번호</label><input value={잠.acct} maxLength={30} onChange={(e) => set잠({ ...잠, acct: e.target.value })} /></div>
              <div className="field"><label>예금주</label><input value={잠.holder} maxLength={20} onChange={(e) => set잠({ ...잠, holder: e.target.value })} /></div>
            </div>
          </>
        )}
        <button className="btn primary" onClick={저장하기}>저장</button>
      </div>
      <코드와휴지통 코드={p.코드} 예시={예시} 정보={정보} 휴지통={휴지통} 휴지통날={휴지통날}
        이름보기={(x) => `${자리이름[x.p] || x.p} — ${(x.v && (x.v.n || x.v.t || x.v.cn || x.v.d)) || ''}${x.v && x.v.amt ? ` · ${원(x.v.amt)}원` : ''}`}
        되살리기={p.되살리기} 잊기={p.잊기} 장부지우기={p.장부지우기} />
    </>
  )
}
