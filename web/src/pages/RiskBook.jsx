/**
 * /tools/risk — ⚠️ 위험성평가 (별지 1~5 한 프로그램) (2026-09-29)
 *
 * 소장님: 「위험성평가도 이상해. 되도록 사이트내에서 사용 할 수 있는 프로그램으로 만들어 줘」
 *         → (고름) 별지 1~5 전부 한 프로그램에 · 코드+비밀번호로 여러 기기(현장 투입비와 같은 방식)
 *
 * ■ 현장 하나 = 장부 하나(장부 코드 + 비밀번호). 그 안에 서류를 몇 장이든 씁니다.
 *     별지1 최초·정기 → 별지2 수시(4주·1주·1일)는 별지1 줄을 «가져오기» → 별지5 성과측정표는 중·상 줄을 가져와 날마다 ○·X
 *     별지3·4 회의·교육 결과는 일시·장소·내용·사진 2장·참석자
 * ■ 위험등급(빈도×강도)·관리기간·달성율은 저절로. 📚 위험요인 사전(우리가 쓴 일반 문장)에서 골라 넣고 고쳐 씁니다.
 * ■ 종이는 서식(wih-*)과 같은 칸 — tools/위험성종이.jsx. 인쇄만(엑셀 받기 없음 — 소장님 2026-09-26: 프로그램으로 만든 것은 인쇄만).
 * ■ 적으면 1초 남짓 뒤 저절로 저장됩니다(서류 한 장 = rk_docs 한 덩이). 사진은 rk_pics — 그 서류를 열 때만 받습니다.
 * 셈: lib/위험성.js (시험 node tools/시험_위험성.mjs) · 저장: lib/장부.js (ns 'rk') · 규칙: web/database.rules.json «위험성평가»
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { use화면상태, 앞칸같은주소 } from '../lib/길기록.js'
import { use인쇄 } from '../tools/공정인쇄.js'
import { 장부, 목록읽기, 목록기억, 막힘, 휴지통날 } from '../lib/장부.js'
import { 코드정리, 코드보기 } from '../lib/tuipbi.js'
import { 새장부, 열기칸, 만들었음, 연장부목록, 코드와휴지통 } from '../tools/장부문.jsx'
import { 종이 } from '../tools/위험성종이.jsx'
import {
  종류, 종류차례, 재해형태들, 다음표시, 등급, 점수, 오늘, 점날, 기간글, 날더하기, 반날들, 달성, 빈줄, 빈서류, 제목,
  가져올줄, 등급수, 풀기, 싸기, 사전, 사전공종, 예시책,
} from '../lib/위험성.js'

const NS = 'rk'
const 자리들 = ['docs']
const 장 = 장부(NS, 자리들)
const 빈자료 = { docs: {} }
const 새칸들 = [
  { k: 'name', 이름: '현장명', 힌트: '서류 머리에 나옵니다', 필수: true, 최대: 60, 보기: '예: ○○지구 배수로 정비공사', 넓게: true },
  { k: 'co', 이름: '회사(원도급사)', 최대: 40 }, { k: 'who', 이름: '작성자', 힌트: '새 서류에 미리 채움', 최대: 20 },
]

async function 사진줄이기(file, 최대 = 1280, q = 0.72) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url })
    const r = Math.min(1, 최대 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.naturalWidth * r)); c.height = Math.max(1, Math.round(img.naturalHeight * r))
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height)
    let s = c.toDataURL('image/jpeg', q)
    if (s.length > 1400000) s = c.toDataURL('image/jpeg', 0.5)
    return s.length > 1450000 ? null : s
  } finally { URL.revokeObjectURL(url) }
}

export default function RiskBook() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [화면, set화면] = use화면상태('화면', 'home')
  const [코드, set코드] = useState('')
  const [정보, set정보] = useState(null)
  const [자료, set자료] = useState(빈자료)
  const [휴지통, set휴지통] = useState({})
  const [예시, set예시] = useState(false)
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [알림, set알림] = useState('')
  const [목록, set목록] = useState(() => 목록읽기(NS))
  const 예시사진 = useRef({})

  useEffect(() => {
    document.title = '위험성평가 (별지 1~5) | K-건설맵'
    const c = 코드정리(params.get('c'))
    if (c.length === 9) { set코드(c); 열어보기(c, true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const 들이기 = (c, r) => {
    set코드(c); set정보(r.정보); set자료({ ...빈자료, ...r.자료 }); set휴지통(r.휴지통 || {}); set예시(false)
    set목록(목록기억(NS, c, r.정보.name)); set알림(''); set오류('')
    set화면('book', { replace: true, search: '?c=' + c })
  }
  async function 열어보기(c) {
    set오류(''); set바쁨('장부를 여는 중입니다…')
    try { 들이기(c, await 장.불러오기(c)) }
    catch (e) { if (막힘(e)) { set코드(c); set화면('open') } else set오류('장부를 열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.') }
    finally { set바쁨('') }
  }
  async function 열기(c, pw) {
    set오류(''); set바쁨('비밀번호를 확인하는 중입니다…')
    try { 들이기(c, await 장.열기(c, pw)) }
    catch (e) { set오류(막힘(e) ? '장부 코드나 비밀번호가 맞지 않습니다.' : '열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.') }
    finally { set바쁨('') }
  }
  async function 만들기(v) {
    set오류(''); set바쁨('장부를 만드는 중입니다…')
    try {
      const 새 = { name: v.name.trim().slice(0, 60) }
      if (v.co.trim()) 새.co = v.co.trim().slice(0, 40)
      if (v.who.trim()) 새.who = v.who.trim().slice(0, 20)
      const r = await 장.만들기(새, v.pw)
      set코드(r.코드); set정보(r.정보); set자료(빈자료); set휴지통({}); set예시(false)
      set목록(목록기억(NS, r.코드, 새.name))
      set화면('made', { replace: true, search: '?c=' + r.코드 })
    } catch (e) { set오류('장부를 만들지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.') }
    finally { set바쁨('') }
  }
  const 예시보기 = () => {
    const x = 예시책()
    예시사진.current = {}
    set예시(true); set코드('EXAMPLE00'); set정보(x.정보); set자료(x.자료); set휴지통({}); set알림(''); set오류('')
    set화면('book')
  }
  const 나가기 = () => {
    set정보(null); set자료(빈자료); set예시(false); set휴지통({}); set알림('')
    if (앞칸같은주소(window.location.pathname)) navigate(-1)
    else set화면('home', { replace: true, search: '' })
  }
  const 실패 = (e, 글) => {
    set오류(막힘(e) ? '이 브라우저는 이 장부에 쓸 수 없습니다 — 나갔다가 코드와 비밀번호로 다시 열어 주십시오.' : (글 || '저장하지 못했습니다 — 인터넷을 확인해 주십시오.'))
    return null
  }

  /** 서류 한 장 저장 — id 가 없으면 새로. 돌려주는 것: 번호(실패면 null) */
  async function 서류저장(id, k, j) {
    const 옛 = id ? 자료.docs[id] : null
    const 값 = { k, d: j.d || 오늘(), t: 제목(k, j).slice(0, 80), j: 싸기(j), at: (옛 && 옛.at) || Date.now(), upd: Date.now() }
    if (값.j.length > 150000) { set오류('서류 한 장이 너무 깁니다 — 줄을 나눠 두 장으로 써 주십시오.'); return null }
    try {
      const nid = 예시 ? (id || 'n' + Date.now()) : await 장.쓰기(코드, 'docs', id, 값)
      set자료((a) => ({ ...a, docs: { ...a.docs, [nid]: 값 } }))
      set오류('')
      return nid
    } catch (e) { return 실패(e) }
  }
  async function 서류지우기(id) {
    const 옛 = 자료.docs[id]
    if (!옛) return
    try {
      if (예시) set휴지통((h) => ({ ...h, ['ex' + Date.now()]: { p: 'docs', k: id, v: 옛, at: Date.now() } }))
      else { const [t, x] = await 장.지우기(코드, 'docs', id, 옛); set휴지통((h) => ({ ...h, [t]: x })) }
      set자료((a) => { const z = { ...a.docs }; delete z[id]; return { ...a, docs: z } })
      set오류(''); set알림(`휴지통으로 옮겼습니다 — ${휴지통날}일 안에는 «장부 정보 › 🗑 휴지통» 에서 되살릴 수 있습니다`)
    } catch (e) { 실패(e, '지우지 못했습니다 — 인터넷을 확인해 주십시오. (지워지지 않았습니다)') }
  }
  async function 되살리기(t) {
    const x = 휴지통[t]
    if (!x || x.p !== 'docs') return
    try {
      if (!예시) await 장.되살리기(코드, t, x)
      set휴지통((h) => { const q = { ...h }; delete q[t]; return q })
      set자료((a) => ({ ...a, docs: { ...a.docs, [x.k]: x.v } }))
      set오류(''); set알림('되살렸습니다')
    } catch (e) { 실패(e, '되살리지 못했습니다 — 인터넷을 확인해 주십시오.') }
  }
  async function 사진읽기(id) {
    if (예시) return 예시사진.current[id] || {}
    try { return (await 장.하나읽기(코드, 'pics', id)) || {} } catch (e) { return {} }
  }
  async function 사진저장(id, v) {
    const 값 = { ...v, at: Date.now() }
    for (const k of ['a', 'b']) if (!값[k]) delete 값[k]
    if (예시) { 예시사진.current[id] = 값; return true }
    try { await 장.쓰기(코드, 'pics', id, 값); return true } catch (e) { 실패(e, '사진을 저장하지 못했습니다 — 인터넷을 확인해 주십시오.'); return false }
  }
  async function 정보고치기(v) {
    const 새 = { ...v, upd: Date.now() }
    try {
      if (!예시) await 장.정보저장(코드, 새)
      set정보(새); set목록(목록기억(NS, 코드, 새.name)); set알림('장부 정보를 저장했습니다'); return true
    } catch (e) { 실패(e, '장부 정보를 저장하지 못했습니다.'); return false }
  }
  async function 장부지우기() {
    if (예시) return
    try { const t = await 장.장부지우기(코드); set정보((s) => ({ ...s, del: t })) } catch (e) { 실패(e, '지우지 못했습니다.') }
  }
  async function 장부되살리기() {
    try { await 장.장부되살리기(코드); set정보((s) => { const q = { ...s }; delete q.del; return q }); set알림('장부를 되살렸습니다') }
    catch (e) { 실패(e, '되살리지 못했습니다.') }
  }
  async function 잊기() {
    if (!window.confirm('이 기기에서 이 장부를 잊을까요?\n다음에 열 때 장부 코드와 비밀번호를 다시 넣어야 합니다. (서류는 그대로입니다)')) return
    await 장.이기기잊기(코드); set목록(목록읽기(NS)); 나가기()
  }

  if (바쁨) return <div className="card"><div className="muted">{바쁨}</div></div>
  if (화면 === 'book' && 정보) {
    return (
      <장부화면 코드={코드} 정보={정보} 자료={자료} 예시={예시} 휴지통={휴지통} 오류={오류} 알림={알림} set알림={set알림}
        서류저장={서류저장} 서류지우기={서류지우기} 되살리기={되살리기} 사진읽기={사진읽기} 사진저장={사진저장}
        정보고치기={정보고치기} 장부지우기={장부지우기} 장부되살리기={장부되살리기} 잊기={잊기} 나가기={나가기} />
    )
  }
  if (화면 === 'made' && 정보) return <만들었음 코드={코드} 이름={정보.name} 열기={() => set화면('book', { replace: true })} />
  if (화면 === 'new') return <새장부 제목="➕ 새 위험성평가 장부 (현장 하나)" 칸들={새칸들} 오류={오류} 만들기={만들기} 뒤로={() => set화면('home', { replace: true })} />
  if (화면 === 'open') return <열기칸 코드0={코드} 오류={오류} 열기={열기} 뒤로={() => set화면('home', { replace: true })} />
  return (
    <div className="eq rk">
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>⚠️ 위험성평가 — 별지 1~5</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>최초·정기 → 수시(4주·1주·1일) → 회의·교육 결과 → 성과측정표</b>를 한 곳에서 씁니다.
          위험등급(빈도×강도)·관리기간·달성율은 저절로, 수시·성과측정표는 앞 서류의 줄을 <b>가져와</b> 씁니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          종이는 발주처 서식과 <b>같은 칸</b>으로 나옵니다(A4 인쇄). 현장마다 <b>장부 코드와 비밀번호</b>가 생겨 휴대폰·사무실 PC 어디서든 같은 서류를 봅니다.
        </p>
      </div>
      {오류 && <div className="card err">{오류}</div>}
      <div className="card">
        <div className="btn-row">
          <button className="btn primary" onClick={() => { set오류(''); set화면('new') }}>➕ 새 장부(현장) 만들기</button>
          <button className="btn" onClick={() => { set오류(''); set코드(''); set화면('open') }}>🔑 장부 코드로 열기</button>
          <button className="btn ghost" onClick={예시보기}>👀 예시로 해 보기</button>
        </div>
        <연장부목록 목록={목록} 고름={(c) => 열어보기(c)} />
      </div>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>이렇게 씁니다</div>
        <ol className="flist">
          <li><b>별지1 최초·정기</b> — 공종마다 위험요인·재해형태·빈도·강도·예방대책. <b>📚 위험요인 사전</b>에서 골라 넣고 고쳐 씁니다.</li>
          <li><b>별지2 수시</b> — 4주(2주)·1주·1일 가운데 고르고, 별지1 줄을 <b>가져와</b> 작업위치·검토/추록·담당만 채웁니다. 1주는 요일별 ○·X 점검까지.</li>
          <li><b>별지3·4 회의·교육 결과</b> — 일시·장소·내용(기본 문장이 들어 있음)·사진 2장·참석자.</li>
          <li><b>별지5 성과측정표</b> — 중·상 등급 줄을 가져와 날마다 ○(이행)·X(미이행)를 누르면 달성율이 나옵니다.</li>
          <li>다 되면 <b>🖨 인쇄</b> — 결재·서명은 종이에 받습니다.</li>
        </ol>
        <p className="note sm" style={{ marginBottom: 0 }}>
          빈 서식이 필요하면 <Link to="/forms/wih-choego">📄 위험성평가 서식(엑셀)</Link>도 그대로 있습니다.
          사전의 문장은 흔한 예일 뿐입니다 — 현장 여건에 맞게 고쳐 쓰십시오.
        </p>
      </div>
    </div>
  )
}

/* ── 장부 안 ─────────────────────────────────────────── */
function 장부화면(p) {
  const { 정보, 자료, 예시, 오류, 알림 } = p
  /* 탭·연 서류는 장부마다 따로 기억합니다 — 다른 장부(예시 → 내 장부)를 열 때 앞 장부의 탭이 따라오지 않게 */
  const [탭, set탭] = use화면상태('탭_' + p.코드, 'docs')
  const [열린, set열린] = use화면상태('문서_' + p.코드, '')
  const 문 = 열린 && 자료.docs[열린]
  const 새로 = async (k, j0) => {
    const j = j0 || 빈서류(k, 정보)
    const id = await p.서류저장(null, k, j)
    if (id) { p.set알림(''); set열린(id) }
  }
  return (
    <div className="eq rk">
      <div className="card eq-head">
        <div className="grow">
          <div className="eq-name">⚠️ {정보.name}{예시 && <span className="badge n" style={{ marginLeft: 6 }}>예시</span>}</div>
          <div className="d">{예시 ? '예시 장부 — 고쳐 봐도 저장되지 않습니다' : `위험성평가 장부 ${코드보기(p.코드)}`}{정보.co ? ` · ${정보.co}` : ''}</div>
        </div>
        <button className="btn ghost sm" onClick={p.나가기}>나가기</button>
      </div>
      {정보.del && (
        <div className="card err">🗑 지운 장부입니다({new Date(정보.del).toLocaleDateString()}). {휴지통날}일 안에는 되살릴 수 있습니다.
          {' '}<button className="btn sm" onClick={p.장부되살리기}>되살리기</button></div>
      )}
      {오류 && <div className="card err">{오류}</div>}
      {알림 && <div className="card eq-ok">{알림}</div>}
      {문 ? (
        <서류칸 key={열린} id={열린} 문={문} 정보={정보} 자료={자료} 예시={예시}
          서류저장={p.서류저장} 사진읽기={p.사진읽기} 사진저장={p.사진저장} 닫기={() => set열린('', { replace: false })} />
      ) : (
        <>
          <div className="eq-tabs">
            {[['docs', '📄 서류'], ['lib', '📚 위험요인 사전'], ['info', '⚙️ 장부 정보']].map(([k, t]) => <button key={k} className={탭 === k ? 'on' : ''} onClick={() => set탭(k)}>{t}</button>)}
          </div>
          {탭 === 'docs' && <서류목록 자료={자료} 새로={새로} 열기={(id) => { p.set알림(''); set열린(id) }} 지우기={p.서류지우기} />}
          {탭 === 'lib' && <사전보기 />}
          {탭 === 'info' && <정보칸 {...p} />}
        </>
      )}
    </div>
  )
}

/* ── 📄 서류 목록 ── */
function 복제(k, j) {
  const 새 = JSON.parse(JSON.stringify(j))
  const d = 오늘()
  새.d = d
  if (k === '2m' || k === '2w' || k === '2d') {
    const 길이 = j.p1 && j.p2 ? Math.round((new Date(j.p2) - new Date(j.p1)) / 86400000) : 0
    새.p1 = d; 새.p2 = 날더하기(d, 길이)
    새.rows = (새.rows || []).map((r) => ({ ...r, ...(k === '2w' ? { ck: ['', '', '', '', '', '', ''], res: '', ok: '' } : {}), ...(k === '2d' ? { rec: '', cont: '' } : {}) }))
  }
  if (k === '5') {
    const 반 = Number(d.slice(8, 10)) >= 17 ? 2 : 1
    새.ym = d.slice(0, 7); 새.half = 반
    새.rows = (새.rows || []).map((r) => ({ ...r, mk: {}, edu: '', note: '' }))
  }
  if (k === '3' || k === '4') { 새.t1 = ''; 새.t2 = '' }
  return 새
}

function 서류목록({ 자료, 새로, 열기, 지우기 }) {
  const 문들 = Object.entries(자료.docs || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : (b.upd || b.at || 0) - (a.upd || a.at || 0)))
  const [거름, set거름] = useState('')
  const 보일 = 거름 ? 문들.filter((x) => x.k === 거름) : 문들
  return (
    <>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>➕ 새 서류</div>
        <div className="rk-kinds">
          {종류차례.map((k) => (
            <button key={k} className="rk-kind" onClick={() => 새로(k)}>
              <span className="b">{종류[k].별지}</span><b>{종류[k].이름}</b><span className="d">{종류[k].설명}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="eq-bar">
          <span className="sec-title" style={{ margin: 0 }}>쓴 서류 {문들.length}장</span>
          <select value={거름} onChange={(e) => set거름(e.target.value)}>
            <option value="">모두</option>
            {종류차례.map((k) => <option key={k} value={k}>{종류[k].별지} {종류[k].짧게}</option>)}
          </select>
        </div>
        {!보일.length && <div className="muted" style={{ marginTop: 8 }}>아직 쓴 서류가 없습니다 — 위에서 고르십시오. 처음이면 <b>별지 1 최초·정기</b>부터.</div>}
        {보일.map((x) => {
          const 셈 = x.k === '1' || x.k.startsWith('2') ? 등급수(풀기(x.k, x.j).rows) : null
          return (
            <div className="row" key={x.id}>
              <button className="grow rk-open" onClick={() => 열기(x.id)}>
                <div className="t"><span className="badge n">{종류[x.k]?.별지} {종류[x.k]?.짧게}</span> {x.t || ''}</div>
                <div className="d">{점날(x.d)}{셈 ? ` · 상 ${셈.상} · 중 ${셈.중} · 하 ${셈.하}` : ''}</div>
              </button>
              <button className="btn sm ghost" title="같은 내용으로 새 서류(날짜는 오늘)" onClick={() => 새로(x.k, 복제(x.k, 풀기(x.k, x.j)))}>복사</button>
              <button className="btn sm ghost" onClick={() => { if (window.confirm('이 서류를 지울까요? (휴지통으로 갑니다)')) 지우기(x.id) }}>지우기</button>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ── 📚 사전 (읽기) ── */
function 사전보기() {
  const [g, setG] = useState(사전공종[0])
  return (
    <div className="card">
      <p className="muted" style={{ marginTop: 0 }}>흔한 위험요인과 예방대책입니다. 서류를 쓸 때 <b>📚 사전에서 고르기</b>로 넣고 현장에 맞게 고칩니다.</p>
      <div className="rk-chips">{사전공종.map((x) => <button key={x} className={g === x ? 'on' : ''} onClick={() => setG(x)}>{x}</button>)}</div>
      {사전.filter((x) => x.g === g).map((x, i) => (
        <div className="rk-lib" key={i}>
          <div className="t"><b>{x.w}</b> · {x.eq} · <span className={'rk-g g-' + 등급(x.f, x.s)}>{x.t} · {등급(x.f, x.s)}({x.f}×{x.s})</span></div>
          <div className="h">{x.h}</div>
          <div className="m">{x.m}</div>
        </div>
      ))}
    </div>
  )
}

/* ── ⚙️ 장부 정보 ── */
function 정보칸(p) {
  const { 정보, 예시, 휴지통 } = p
  const [v, setV] = useState({ name: 정보.name || '', co: 정보.co || '', who: 정보.who || '' })
  const 저장하기 = () => {
    const 새 = { ...정보, name: v.name.trim().slice(0, 60) || 정보.name }
    for (const [k, n] of [['co', 40], ['who', 20]]) { if (v[k].trim()) 새[k] = v[k].trim().slice(0, n); else delete 새[k] }
    p.정보고치기(새)
  }
  return (
    <>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>⚙️ 장부 정보</div>
        <div className="field"><label>현장명 <span className="hint">새 서류 머리에 미리 채웁니다</span></label><input value={v.name} maxLength={60} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
        <div className="eq-2">
          <div className="field"><label>회사(원도급사)</label><input value={v.co} maxLength={40} onChange={(e) => setV({ ...v, co: e.target.value })} /></div>
          <div className="field"><label>작성자</label><input value={v.who} maxLength={20} onChange={(e) => setV({ ...v, who: e.target.value })} /></div>
        </div>
        <button className="btn primary" onClick={저장하기}>저장</button>
      </div>
      <코드와휴지통 코드={p.코드} 예시={예시} 정보={정보} 휴지통={휴지통} 휴지통날={휴지통날}
        이름보기={(x) => `${(종류[x.v && x.v.k] || {}).별지 || ''} ${(종류[x.v && x.v.k] || {}).짧게 || '서류'} — ${(x.v && x.v.t) || ''} (${점날(x.v && x.v.d)})`}
        되살리기={p.되살리기} 잊기={p.잊기} 장부지우기={p.장부지우기} />
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   서류 한 장 — 고치면 1.2초 뒤 저절로 저장 · 아래에 종이 미리보기 · 🖨 인쇄
   ══════════════════════════════════════════════════════════════ */
function 서류칸({ id, 문, 정보, 자료, 예시, 서류저장, 사진읽기, 사진저장, 닫기 }) {
  const k = 문.k
  const K = 종류[k] || {}
  const [j, setJ] = useState(() => 풀기(k, 문.j, 정보))
  const [상태, set상태] = useState('')
  const [사진, set사진] = useState({})
  const [인쇄중, 인쇄] = use인쇄(`${K.별지}_${K.짧게}_${j.d || ''}`)
  const 남은 = useRef(null)
  const 첫 = useRef(true)

  useEffect(() => { if (k === '3' || k === '4') 사진읽기(id).then((v) => set사진(v || {})) }, [id])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (첫.current) { 첫.current = false; return undefined }
    남은.current = j
    set상태('고치는 중…')
    const t = setTimeout(async () => {
      set상태('저장 중…')
      const ok = await 서류저장(id, k, j)
      if (남은.current === j) 남은.current = null
      const d = new Date()
      set상태(ok ? `✓ ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} 저장됨` : '⚠ 저장하지 못했습니다')
    }, 1200)
    return () => clearTimeout(t)
  }, [j])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 닫을 때 못 다 한 저장 — 바로 */
  useEffect(() => () => { if (남은.current) 서류저장(id, k, 남은.current) }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  const 바꿈 = (v) => setJ((a) => ({ ...a, ...v }))
  const 다른서류 = Object.entries(자료.docs || {}).filter(([x, v]) => x !== id && (v.k === '1' || v.k.startsWith('2'))).map(([x, v]) => ({ id: x, ...v }))
    .sort((a, b) => (a.d < b.d ? 1 : -1))

  return (
    <>
      <div className="card rk-edit-head">
        <button className="btn ghost sm" onClick={닫기}>← 서류 목록</button>
        <div className="grow"><div className="eq-name" style={{ fontSize: 15 }}>{K.별지} · {K.이름}</div><div className="d">{상태 || '고치면 저절로 저장됩니다'}</div></div>
        <button className="btn sm" onClick={인쇄}>🖨 인쇄</button>
      </div>
      <div className="card">
        {k === '1' && (
          <div className="eq-3">
            <div className="field"><label>공 종 명</label><input value={j.gong || ''} maxLength={40} onChange={(e) => 바꿈({ gong: e.target.value })} placeholder="예: 토공사" /></div>
            <div className="field"><label>작 성 일</label><input type="date" value={j.d || ''} onChange={(e) => 바꿈({ d: e.target.value })} /></div>
            <div className="field"><label>작 성 자</label><input value={j.who || ''} maxLength={20} onChange={(e) => 바꿈({ who: e.target.value })} /></div>
          </div>
        )}
        {(k === '2m' || k === '2w' || k === '2d') && (
          <>
            <div className="eq-3">
              <div className="field"><label>현 장 명</label><input value={j.site || ''} maxLength={60} onChange={(e) => 바꿈({ site: e.target.value })} /></div>
              <div className="field"><label>작 성 일</label><input type="date" value={j.d || ''} onChange={(e) => 바꿈({ d: e.target.value })} /></div>
              <div className="field"><label>작 성 자</label><input value={j.who || ''} maxLength={20} onChange={(e) => 바꿈({ who: e.target.value })} /></div>
            </div>
            <div className="eq-bar" style={{ marginBottom: 6 }}>
              <span className="muted">관리기간</span>
              <input type="date" value={j.p1 || ''} onChange={(e) => 바꿈({ p1: e.target.value })} />
              <span>~</span>
              <input type="date" value={j.p2 || ''} onChange={(e) => 바꿈({ p2: e.target.value })} />
              {k === '2m' && <><button className="btn sm ghost" onClick={() => 바꿈({ p2: 날더하기(j.p1 || 오늘(), 27) })}>4주</button><button className="btn sm ghost" onClick={() => 바꿈({ p2: 날더하기(j.p1 || 오늘(), 13) })}>2주</button></>}
              {k === '2w' && <button className="btn sm ghost" onClick={() => 바꿈({ p2: 날더하기(j.p1 || 오늘(), 6) })}>1주</button>}
              {k === '2d' && <button className="btn sm ghost" onClick={() => 바꿈({ p2: j.p1 })}>하루</button>}
              <span className="muted">{기간글(j.p1, j.p2)}</span>
            </div>
          </>
        )}
        {k === '5' && (
          <>
            <div className="eq-3">
              <div className="field"><label>현 장 명</label><input value={j.site || ''} maxLength={60} onChange={(e) => 바꿈({ site: e.target.value })} /></div>
              <div className="field"><label>작 성 일</label><input type="date" value={j.d || ''} onChange={(e) => 바꿈({ d: e.target.value })} /></div>
              <div className="field"><label>작 성 자</label><input value={j.who || ''} maxLength={20} onChange={(e) => 바꿈({ who: e.target.value })} /></div>
            </div>
            <div className="eq-bar" style={{ marginBottom: 6 }}>
              <span className="muted">관리기간</span>
              <input type="month" value={j.ym || ''} onChange={(e) => 바꿈({ ym: e.target.value })} />
              <div className="eq-seg" style={{ minWidth: 220 }}>
                <button className={j.half !== 2 ? 'on' : ''} onClick={() => 바꿈({ half: 1 })}>1~16일</button>
                <button className={j.half === 2 ? 'on' : ''} onClick={() => 바꿈({ half: 2 })}>17일~말일</button>
              </div>
              <span className="muted sm">서식 한 장이 반 달(16칸)입니다</span>
            </div>
          </>
        )}
        {(k === '3' || k === '4') && <편집34 k={k} j={j} 바꿈={바꿈} 사진={사진} 사진바꿈={async (v) => { const 새 = { ...사진, ...v }; if (await 사진저장(id, 새)) set사진(새) }} />}
      </div>
      {(k === '1' || k.startsWith('2') || k === '5') && <줄들 k={k} j={j} 바꿈={바꿈} 다른서류={다른서류} />}
      <div className="card">
        <div className="eq-bar"><span className="sec-title" style={{ margin: 0 }}>🖨 종이 미리보기</span><span className="muted sm">{K.가로 ? 'A4 가로' : 'A4 세로'} · 결재·서명은 종이에</span>
          <button className="btn sm" onClick={인쇄}>🖨 인쇄 · PDF</button></div>
        <div className="rk-preview"><종이 k={k} j={j} 사진={사진} /></div>
      </div>
      {인쇄중 && createPortal(<div id="gp-인쇄"><div className={'rk-쪽 ' + (K.가로 ? 'land' : 'port')}><종이 k={k} j={j} 사진={사진} /></div></div>, document.body)}
    </>
  )
}

/* ── 별지3·4 ── */
function 편집34({ k, j, 바꿈, 사진, 사진바꿈 }) {
  const 무엇 = k === '3' ? '회의' : '교육'
  const [바쁨, set바쁨] = useState('')
  const 넣기 = async (칸, file) => {
    if (!file) return
    set바쁨('사진을 줄이는 중…')
    try { const s = await 사진줄이기(file); if (s) await 사진바꿈({ [칸]: s }); else window.alert('사진이 너무 큽니다 — 다른 사진으로 해 주십시오.') }
    catch (e) { window.alert('사진을 읽지 못했습니다.') }
    finally { set바쁨('') }
  }
  const items = j.items || []
  const people = j.people || []
  return (
    <>
      <div className="eq-4">
        <div className="field"><label>{무엇} 날짜</label><input type="date" value={j.d || ''} onChange={(e) => 바꿈({ d: e.target.value })} /></div>
        <div className="field"><label>시작</label><input type="time" value={j.t1 || ''} onChange={(e) => 바꿈({ t1: e.target.value })} /></div>
        <div className="field"><label>끝</label><input type="time" value={j.t2 || ''} onChange={(e) => 바꿈({ t2: e.target.value })} /></div>
        <div className="field"><label>작성자</label><input value={j.who || ''} maxLength={20} onChange={(e) => 바꿈({ who: e.target.value })} /></div>
      </div>
      <div className="field"><label>{무엇} 장소</label><input value={j.place || ''} maxLength={40} onChange={(e) => 바꿈({ place: e.target.value })} /></div>
      <div className="sec-title" style={{ margin: '8px 0 6px' }}>□ {무엇} 내용 <span className="count">· 기본 문장이 들어 있습니다 — 고치거나 더하십시오</span></div>
      {items.map((t, i) => (
        <div className="rk-line" key={i}>
          <span>●</span>
          <input value={t} maxLength={120} onChange={(e) => 바꿈({ items: items.map((x, q) => (q === i ? e.target.value : x)) })} />
          <button className="btn sm ghost" onClick={() => 바꿈({ items: items.filter((_, q) => q !== i) })}>✕</button>
        </div>
      ))}
      <button className="btn sm ghost" onClick={() => 바꿈({ items: [...items, ''] })} disabled={items.length >= 12}>＋ 내용 한 줄</button>
      <div className="sec-title" style={{ margin: '14px 0 6px' }}>📷 사진 <span className="count">· 두 장까지 · 줄여서 저장합니다</span></div>
      <div className="rk-pics">
        {['a', 'b'].map((칸) => (
          <div className="rk-pic" key={칸}>
            {사진[칸] ? <img src={사진[칸]} alt="" /> : <div className="muted sm">{무엇} 사진 또는 자료</div>}
            <div className="btn-row">
              <label className="btn sm">{사진[칸] ? '바꾸기' : '＋ 사진'}<input type="file" accept="image/*" hidden onChange={(e) => { 넣기(칸, e.target.files && e.target.files[0]); e.target.value = '' }} /></label>
              {사진[칸] && <button className="btn sm ghost" onClick={() => 사진바꿈({ [칸]: null })}>빼기</button>}
            </div>
          </div>
        ))}
      </div>
      {바쁨 && <div className="muted sm">{바쁨}</div>}
      <div className="sec-title" style={{ margin: '14px 0 6px' }}>□ 참석자 <span className="count">· 서명은 종이에 받습니다</span></div>
      {people.map((x, i) => (
        <div className="rk-line" key={i}>
          <input value={x.o || ''} maxLength={20} placeholder="소속/직책" onChange={(e) => 바꿈({ people: people.map((y, q) => (q === i ? { ...y, o: e.target.value } : y)) })} />
          <input value={x.n || ''} maxLength={12} placeholder="성명" onChange={(e) => 바꿈({ people: people.map((y, q) => (q === i ? { ...y, n: e.target.value } : y)) })} />
          <button className="btn sm ghost" onClick={() => 바꿈({ people: people.filter((_, q) => q !== i) })}>✕</button>
        </div>
      ))}
      <button className="btn sm ghost" onClick={() => 바꿈({ people: [...people, { o: '', n: '' }] })} disabled={people.length >= 60}>＋ 참석자</button>
    </>
  )
}

/* ── 줄들 (별지1 · 2 · 5) ── */
function 줄들({ k, j, 바꿈, 다른서류 }) {
  const rows = j.rows || []
  const [판, set판] = useState('')       // '' | 'lib' | 'imp'
  const 줄바꿈 = (i, v) => 바꿈({ rows: rows.map((r, q) => (q === i ? { ...r, ...v } : r)) })
  const 옮김 = (i, d) => { const n = [...rows]; const t = n[i]; n[i] = n[i + d]; n[i + d] = t; 바꿈({ rows: n }) }
  const 더함 = (새) => { 바꿈({ rows: [...rows.filter((r) => Object.entries(r).some(([key, v]) => key !== 'ck' && key !== 'mk' && String(v || '').trim())), ...새] }); set판('') }
  const 날들 = k === '5' && j.ym ? 반날들(j.ym, j.half === 2 ? 2 : 1) : []
  const 요일 = (d) => (j.ym ? '일월화수목금토'[new Date(Number(j.ym.slice(0, 4)), Number(j.ym.slice(5, 7)) - 1, d).getDay()] : '')
  return (
    <div className="card">
      <div className="eq-bar" style={{ marginBottom: 8 }}>
        <span className="sec-title" style={{ margin: 0 }}>{k === '5' ? '중점·특별관리 대상' : '위험요인'} {rows.length}줄</span>
        <button className="btn sm" onClick={() => 바꿈({ rows: [...rows, 빈줄(k)] })}>＋ 빈 줄</button>
        <button className={'btn sm ' + (판 === 'lib' ? '' : 'ghost')} onClick={() => set판(판 === 'lib' ? '' : 'lib')}>📚 사전에서 고르기</button>
        {k !== '1' && <button className={'btn sm ' + (판 === 'imp' ? '' : 'ghost')} onClick={() => set판(판 === 'imp' ? '' : 'imp')}>📥 다른 서류에서 가져오기</button>}
      </div>
      {판 === 'lib' && <사전고르기 k={k} 넣기={더함} />}
      {판 === 'imp' && <가져오기 k={k} 다른서류={다른서류} 넣기={더함} />}
      {rows.map((r, i) => {
        const g = 등급(r.f, r.s)
        return (
          <div className="rk-row" key={i}>
            <div className="rk-row-h">
              <b>{i + 1}</b>
              {k !== '5' && <span className={'rk-g g-' + (g || 'x')}>{g ? `${g} (${점수(r.f, r.s)}점)` : '등급 —'}</span>}
              {k === '5' && (() => { const x = 달성(r.mk, 날들); return <span className="rk-g">{x.율 != null ? `달성율 ${x.율}% (X ${x.지적}/${x.작업}일)` : '달성율 —'}</span> })()}
              <span className="grow" />
              <button className="btn sm ghost" disabled={i === 0} onClick={() => 옮김(i, -1)}>↑</button>
              <button className="btn sm ghost" disabled={i === rows.length - 1} onClick={() => 옮김(i, 1)}>↓</button>
              <button className="btn sm ghost" onClick={() => 바꿈({ rows: [...rows.slice(0, i + 1), JSON.parse(JSON.stringify(r)), ...rows.slice(i + 1)] })}>복사</button>
              <button className="btn sm ghost" onClick={() => 바꿈({ rows: rows.filter((_, q) => q !== i) })}>✕</button>
            </div>
            <div className={k === '1' ? 'eq-2' : 'eq-3'}>
              <div className="field"><label>세부작업(단위작업)</label><input value={r.w || ''} maxLength={40} placeholder={k === '1' && i > 0 ? '(비우면 위와 같음)' : ''} onChange={(e) => 줄바꿈(i, { w: e.target.value })} /></div>
              {k !== '1' && <div className="field"><label>작업위치</label><input value={r.loc || ''} maxLength={40} onChange={(e) => 줄바꿈(i, { loc: e.target.value })} /></div>}
              <div className="field"><label>사용장비/설비/인원</label><input value={r.eq || ''} maxLength={60} placeholder={k === '1' && i > 0 && !r.w ? '(위와 같음)' : '예: 굴삭기 1대 / 인부 4명'} onChange={(e) => 줄바꿈(i, { eq: e.target.value })} /></div>
            </div>
            {k !== '5' && (
              <>
                <div className="field"><label>위험요인</label><textarea rows={2} value={r.h || ''} maxLength={300} onChange={(e) => 줄바꿈(i, { h: e.target.value })} /></div>
                <div className="rk-fs">
                  <div className="field"><label>재해형태</label><input list="rk-t" value={r.t || ''} maxLength={10} onChange={(e) => 줄바꿈(i, { t: e.target.value })} /></div>
                  <div className="field"><label>빈도</label><div className="eq-seg">{[1, 2, 3].map((n) => <button key={n} className={Number(r.f) === n ? 'on' : ''} onClick={() => 줄바꿈(i, { f: n })}>{n}</button>)}</div></div>
                  <div className="field"><label>강도</label><div className="eq-seg">{[1, 2, 3].map((n) => <button key={n} className={Number(r.s) === n ? 'on' : ''} onClick={() => 줄바꿈(i, { s: n })}>{n}</button>)}</div></div>
                </div>
              </>
            )}
            <div className="field"><label>{k === '5' ? '예방대책 확정 내용' : '예방대책'}</label><textarea rows={3} value={r.m || ''} maxLength={600} onChange={(e) => 줄바꿈(i, { m: e.target.value })} /></div>
            {k === '1' && <div className="field"><label>원도급사 관리담당 부서(팀)</label><input value={r.o || ''} maxLength={30} onChange={(e) => 줄바꿈(i, { o: e.target.value })} /></div>}
            {k.startsWith('2') && (
              <>
                <div className="field"><label>검토/추록</label><textarea rows={2} value={r.r || ''} maxLength={300} onChange={(e) => 줄바꿈(i, { r: e.target.value })} /></div>
                <div className="eq-2">
                  <div className="field"><label>이행담당(하도급사)</label><input value={r.a || ''} maxLength={20} onChange={(e) => 줄바꿈(i, { a: e.target.value })} /></div>
                  <div className="field"><label>확인담당(원도급사)</label><input value={r.b || ''} maxLength={20} onChange={(e) => 줄바꿈(i, { b: e.target.value })} /></div>
                </div>
              </>
            )}
            {k === '2w' && (
              <>
                <div className="field"><label>주간 점검 (1~7일째) <span className="hint">누를 때마다 ○ → X → － → 비움</span></label>
                  <div className="rk-days">{[0, 1, 2, 3, 4, 5, 6].map((d) => { const v = (r.ck || [])[d] || ''; return <button key={d} className={'rk-day v' + (v === '○' ? 'o' : v === 'X' ? 'x' : v ? 'n' : '')} onClick={() => { const ck = [...(r.ck || ['', '', '', '', '', '', ''])]; ck[d] = 다음표시(v); 줄바꿈(i, { ck }) }}><small>{d + 1}</small>{v || '·'}</button> })}</div></div>
                <div className="eq-3">
                  <div className="field"><label>이행·점검 담당</label><input value={r.c || ''} maxLength={20} placeholder={r.a || ''} onChange={(e) => 줄바꿈(i, { c: e.target.value })} /></div>
                  <div className="field"><label>주간점검 결과</label><input value={r.res || ''} maxLength={120} placeholder="◦ 이행상태 적정" onChange={(e) => 줄바꿈(i, { res: e.target.value })} /></div>
                  <div className="field"><label>감독 확인</label><select value={r.ok || ''} onChange={(e) => 줄바꿈(i, { ok: e.target.value })}><option value="">—</option><option>양호</option><option>미흡</option></select></div>
                </div>
              </>
            )}
            {k === '2d' && (
              <div className="eq-2">
                <div className="field"><label>이행결과 점검확인 <span className="hint">작업일보에 포함</span></label><select value={r.rec || ''} onChange={(e) => 줄바꿈(i, { rec: e.target.value })}><option value="">—</option><option>기록</option><option>미기록</option></select></div>
                <div className="field"><label>지속여부</label><select value={r.cont || ''} onChange={(e) => 줄바꿈(i, { cont: e.target.value })}><option value="">—</option><option>지속</option><option>종료</option><option>익일 지속</option></select></div>
              </div>
            )}
            {k === '5' && (
              <>
                <div className="eq-2">
                  <div className="field"><label>전파 교육</label><div className="eq-seg">{['○', 'X', ''].map((v) => <button key={v || '-'} className={(r.edu || '') === v ? 'on' : ''} onClick={() => 줄바꿈(i, { edu: v })}>{v || '비움'}</button>)}</div></div>
                  <div className="field"><label>의견</label><input value={r.note || ''} maxLength={120} onChange={(e) => 줄바꿈(i, { note: e.target.value })} /></div>
                </div>
                <div className="field"><label>점검 결과 (날짜) <span className="hint">누를 때마다 ○ → X → － → 비움</span></label>
                  <div className="rk-days">{날들.map((d) => { const v = (r.mk || {})[d] || ''; return <button key={d} className={'rk-day v' + (v === '○' ? 'o' : v === 'X' ? 'x' : v ? 'n' : '')} onClick={() => { const mk = { ...(r.mk || {}) }; const n = 다음표시(v); if (n) mk[d] = n; else delete mk[d]; 줄바꿈(i, { mk }) }}><small>{d}{요일(d)}</small>{v || '·'}</button> })}</div></div>
              </>
            )}
          </div>
        )
      })}
      <datalist id="rk-t">{재해형태들.map((x) => <option key={x} value={x} />)}</datalist>
      {rows.length > 0 && <button className="btn sm" onClick={() => 바꿈({ rows: [...rows, 빈줄(k)] })}>＋ 빈 줄</button>}
    </div>
  )
}

function 사전고르기({ k, 넣기 }) {
  const [g, setG] = useState(사전공종[0])
  const [고른, set고른] = useState(() => new Set())
  const 보일 = 사전.map((x, i) => ({ ...x, i })).filter((x) => x.g === g)
  const 넣을 = () => {
    const 새 = [...고른].sort((a, b) => a - b).map((i) => {
      const x = 사전[i]
      if (k === '5') return { ...빈줄('5'), w: x.w, eq: x.eq, m: x.m }
      return { ...빈줄(k), w: x.w, eq: x.eq, h: x.h, t: x.t, f: x.f, s: x.s, m: x.m }
    })
    넣기(새)
  }
  return (
    <div className="rk-panel">
      <div className="rk-chips">{사전공종.map((x) => <button key={x} className={g === x ? 'on' : ''} onClick={() => setG(x)}>{x}</button>)}</div>
      {보일.map((x) => (
        <label className="rk-pick" key={x.i}>
          <input type="checkbox" checked={고른.has(x.i)} onChange={(e) => { const s = new Set(고른); if (e.target.checked) s.add(x.i); else s.delete(x.i); set고른(s) }} />
          <span><b>{x.w}</b> · {x.h} <span className={'rk-g g-' + 등급(x.f, x.s)}>{x.t} {등급(x.f, x.s)}</span></span>
        </label>
      ))}
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn sm" disabled={!고른.size} onClick={넣을}>고른 {고른.size}줄 넣기</button>
        <span className="muted sm">여러 공종에서 골라도 됩니다 · 넣은 뒤 현장에 맞게 고치십시오</span>
      </div>
    </div>
  )
}

function 가져오기({ k, 다른서류, 넣기 }) {
  const [src, setSrc] = useState(() => (다른서류.find((x) => x.k === '1') || 다른서류[0] || {}).id || '')
  const [중상, set중상] = useState(k === '5')
  const 서 = 다른서류.find((x) => x.id === src)
  const 줄 = useMemo(() => (서 ? 가져올줄(풀기(서.k, 서.j), k, { 중상만: 중상 }) : []), [서, k, 중상])
  if (!다른서류.length) return <div className="rk-panel muted">가져올 서류가 없습니다 — 먼저 <b>별지 1 최초·정기</b>를 쓰십시오.</div>
  return (
    <div className="rk-panel">
      <div className="eq-bar">
        <select value={src} onChange={(e) => setSrc(e.target.value)}>
          {다른서류.map((x) => <option key={x.id} value={x.id}>{종류[x.k].별지} {종류[x.k].짧게} · {점날(x.d)} · {x.t}</option>)}
        </select>
        <label className="eq-chk"><input type="checkbox" checked={중상} onChange={(e) => set중상(e.target.checked)} /> 중·상 등급만</label>
      </div>
      <div className="muted sm" style={{ margin: '6px 0' }}>{줄.length}줄 — {줄.slice(0, 4).map((r) => r.w).filter(Boolean).join(' · ')}{줄.length > 4 ? ' …' : ''}</div>
      <button className="btn sm" disabled={!줄.length} onClick={() => 넣기(줄)}>{줄.length}줄 가져오기</button>
    </div>
  )
}
