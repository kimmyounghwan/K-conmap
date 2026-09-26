/**
 * /tools/tuipbi — 🏗 현장 투입비 · 공사일보 (2026-09-26)
 *
 * 소장님: 「공사일보를 시스템화 하는 거...이건 너무 확장판인듯 하고, 난 투입비만 나오면 돼.
 *          총공사금액 얼마. 현재 투입비 얼마...등...최대한 단순하면서 필요한 기능은 다 있는것...
 *          건설맵에서 등록해서 사용하게 하는 거지...」  → 첫 판(투입비) 2026-09-26 새벽
 * 소장님: 「공사금액으로 해서 공정률도 함께 나오게」 · 「노무자 및 장비, 자재 청구내역서 작성해서 보여주는 걸로 하자. 매달...」
 *          「도구로 올릴때, 공사일보 쓰는 방법을 자세하게 알려 줘야 해.」  → 둘째 판 2026-09-26 저녁
 *
 * ■ 현장을 만들면 «현장 코드(9자리) + 비밀번호» 가 생깁니다. 회원가입 없음.
 *   코드와 비밀번호를 아는 사람(현장 직원)은 폰·PC 어디서든 같이 적고 봅니다.
 * ■ 명부(근로자·장비·자재 업체) → 날마다 출역·장비·자재 반입·그 밖의 지출 → 달마다 청구내역서 3종 · 기성 → 공정률
 * ■ 주민번호·계좌는 브라우저에서 현장 비밀번호로 잠가 저장(lib/tplock.js) — 서버는 못 읽습니다.
 * ■ 비용: 파이어베이스 get() 만(실시간 구독 없음).
 * 화면: 이 파일(처음·만들기·열기·데이터) · TuipbiSite.jsx(탭) · TuipbiBook.jsx(명부·청구서)
 * ⚠️ 엑셀 받기는 없습니다 — 소장님: 「프로그램으로 해서 만든 거는 … 다운 받을 수 없게 … 프린트만 가능하게 … 수정이나 입력은 건설맵에서」(일반 서식만 엑셀로 받음)
 * 셈·예시는 lib/tuipbi.js · 공제는 lib/gongje.js · 규칙은 web/database.rules.json «현장 투입비»
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 원, 억만, 코드만들기, 코드보기, 코드정리, 비번해시, 예시현장 } from '../lib/tuipbi.js'
import { 열쇠만들기, 열쇠두기, 열쇠읽기, 열쇠지우기, 잠그기, 풀기 } from '../lib/tplock.js'
import TuipbiSite, { TuipbiGuide } from './TuipbiSite.jsx'

/* firebase 는 이 화면에서 «현장을 열 때만» 받습니다 (사랑방과 같은 방식) */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

const 목록키 = 'kcm-tuipbi-sites'
const 읽기 = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch (e) { return d } }
const 쓰기 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* 개인 창 등 — 없어도 됩니다 */ } }
const 숫자만 = (s) => Number(String(s || '').replace(/[^0-9.-]/g, '')) || 0
const 쉼표칸 = (s) => { const n = String(s || '').replace(/[^0-9]/g, ''); return n ? 원(Number(n)) : '' }
const 막힘 = (e) => /permission|PERMISSION/.test(String((e && (e.code || e.message)) || e))
const 명부자리 = { people: 'cost_people', equip: 'cost_equip', vendors: 'cost_vendors' }
const 빈데이터 = { 사람: {}, 장비: {}, 업체: {}, 출역: {} }

/** 잠근 칸(x)을 모두 풀어 {id: 물건} */
async function 모두풀기(raw, ...maps) {
  const out = {}
  if (!raw) return out
  for (const m of maps) for (const [id, v] of Object.entries(m || {})) if (v && v.x) { const o = await 풀기(raw, v.x); if (o) out[id] = o }
  return out
}

export default function Tuipbi() {
  const [params, setParams] = useSearchParams()
  const [화면, set화면] = useState('home')             // home | new | open | made | site
  const [코드, set코드] = useState('')
  const [현장, set현장] = useState(null)
  const [줄들, set줄들] = useState([])
  const [명부, set명부] = useState(빈데이터)           // {사람, 장비, 업체, 출역}
  const [열쇠, set열쇠] = useState(null)
  const [풀린, set풀린] = useState({})
  const [예시, set예시] = useState(false)
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [정보, set정보] = useState(false)
  const [목록, set목록] = useState(() => 읽기(목록키, []))
  const [저장됨, set저장됨] = useState('')             // 소장님: 「자동저장된다는 것도 알려 줘....이용자가 알게..그래야 나중에 수정을 할 수 있다는 것도」

  useEffect(() => {
    const c = 코드정리(params.get('c'))
    if (c.length === 9) { set코드(c); 열어보기(c) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const 기억 = (c, n) => {
    const v = [{ c, n }, ...목록.filter((x) => x.c !== c)].slice(0, 20)
    set목록(v); 쓰기(목록키, v)
  }
  const 잊기 = (c) => { const v = 목록.filter((x) => x.c !== c); set목록(v); 쓰기(목록키, v) }

  /* 이 브라우저가 이미 열어 본 현장이면 비밀번호 없이 바로 */
  async function 열어보기(c) {
    set오류(''); set바쁨('현장을 여는 중입니다…')
    try {
      const fb = await loadFb()
      await fb.ensureAnon()
      await 불러오기(c)
    } catch (e) {
      if (막힘(e)) { set코드(c); set화면('open') } else set오류('현장을 열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }
  async function 불러오기(c) {
    const fb = await loadFb()
    const 곳 = ['cost_sites', 'cost_rows', 'cost_people', 'cost_equip', 'cost_vendors', 'cost_att']
    const [s, r, p, e, v, a] = await Promise.all(곳.map((x) => fb.get(fb.ref(fb.db, `${x}/${c}`))))
    if (!s.exists()) throw Object.assign(new Error('없음'), { code: 'PERMISSION_DENIED' })
    const rows = []
    r.forEach((x) => { rows.push({ id: x.key, ...x.val() }) })
    const 새명부 = { 사람: p.val() || {}, 장비: e.val() || {}, 업체: v.val() || {}, 출역: a.val() || {} }
    const raw = 열쇠읽기(c)
    set예시(false); set코드(c); set현장(s.val()); set줄들(rows); set명부(새명부); set화면('site'); set정보(false)
    set열쇠(raw)
    set풀린(await 모두풀기(raw, 새명부.사람, 새명부.장비, 새명부.업체))
    기억(c, s.val().name)
    if (params.get('c') !== c) setParams({ c }, { replace: true })
  }
  async function 열기(c, pw) {
    set오류(''); set바쁨('비밀번호를 확인하는 중입니다…')
    try {
      const fb = await loadFb()
      const u = await fb.ensureAnon()
      const h = await 비번해시(c, pw)
      await fb.set(fb.ref(fb.db, `cost_keys/${c}/${u.uid}`), h)
      열쇠두기(c, await 열쇠만들기(c, pw))
      await 불러오기(c)
    } catch (e) {
      set오류(막힘(e) ? '현장 코드나 비밀번호가 맞지 않습니다.' : '열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }
  async function 만들기(v) {
    set오류(''); set바쁨('현장을 만드는 중입니다…')
    try {
      const fb = await loadFb()
      const u = await fb.ensureAnon()
      let c = '', h = ''
      for (let i = 0; i < 4 && !c; i++) {
        const t = 코드만들기()
        const th = await 비번해시(t, v.pw)
        try { await fb.set(fb.ref(fb.db, `cost_pins/${t}`), th); c = t; h = th } catch (e) { if (!막힘(e)) throw e }
      }
      if (!c) throw new Error('코드')
      await fb.set(fb.ref(fb.db, `cost_keys/${c}/${u.uid}`), h)
      const site = { name: v.name.trim(), total: 숫자만(v.total), at: Date.now() }
      if (숫자만(v.budget) > 0) site.budget = 숫자만(v.budget)
      if (v.start) site.start = v.start
      if (v.end) site.end = v.end
      if (v.co && v.co.trim()) site.co = v.co.trim().slice(0, 40)
      await fb.set(fb.ref(fb.db, `cost_sites/${c}`), site)
      const raw = await 열쇠만들기(c, v.pw)
      열쇠두기(c, raw)
      set코드(c); set현장(site); set줄들([]); set명부(빈데이터); set열쇠(raw); set풀린({}); set예시(false); set화면('made')
      기억(c, site.name)
      setParams({ c }, { replace: true })
    } catch (e) {
      set오류('현장을 만들지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }
  const 예시보기 = () => {
    const x = 예시현장()
    set예시(true); set코드('EXAMPLE00'); set현장(x.site); set줄들(x.rows)
    set명부({ 사람: x.people, 장비: x.equip, 업체: x.vendors, 출역: x.att }); set풀린(x.풀린); set열쇠(null)
    set화면('site'); set오류(''); set정보(false)
  }
  const 나가기 = () => { set현장(null); set줄들([]); set명부(빈데이터); set풀린({}); set열쇠(null); set예시(false); set화면('home'); set정보(false); setParams({}, { replace: true }) }

  /* ── 쓰기 — 예시면 화면에만 ─────────────── */
  const 표시 = () => { const d = new Date(); set저장됨(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`) }
  const 실패 = (e, 글) => { set오류(막힘(e) ? '이 브라우저는 이 현장에 쓸 수 없습니다 — 나갔다가 코드와 비밀번호로 다시 열어 주십시오.' : 글 || '저장하지 못했습니다 — 인터넷을 확인해 주십시오.'); return false }

  async function 줄저장(row, id) {
    if (예시) {
      if (id) set줄들((v) => v.map((x) => (x.id === id ? { ...row, id } : x)))
      else set줄들((v) => [...v, { ...row, id: 'n' + Date.now() }])
      표시(); return true
    }
    try {
      const fb = await loadFb()
      if (id) { await fb.set(fb.ref(fb.db, `cost_rows/${코드}/${id}`), row); set줄들((v) => v.map((x) => (x.id === id ? { ...row, id } : x))) }
      else { const r = fb.push(fb.ref(fb.db, `cost_rows/${코드}`)); await fb.set(r, row); set줄들((v) => [...v, { ...row, id: r.key }]) }
      set오류(''); 표시()
      return true
    } catch (e) { return 실패(e) }
  }
  async function 줄지우기(id) {
    if (예시) { set줄들((v) => v.filter((x) => x.id !== id)); 표시(); return }
    try { const fb = await loadFb(); await fb.remove(fb.ref(fb.db, `cost_rows/${코드}/${id}`)); set줄들((v) => v.filter((x) => x.id !== id)); 표시() }
    catch (e) { 실패(e, '지우지 못했습니다 — 인터넷을 확인해 주십시오.') }
  }
  async function 현장저장(site) {
    if (예시) { set현장(site); 표시(); return true }
    try { const fb = await loadFb(); await fb.set(fb.ref(fb.db, `cost_sites/${코드}`), site); set현장(site); 기억(코드, site.name); 표시(); return true }
    catch (e) { return 실패(e, '현장 정보를 저장하지 못했습니다.') }
  }
  async function 현장지우기() {
    try {
      const fb = await loadFb()
      for (const x of ['cost_rows', 'cost_att', 'cost_people', 'cost_equip', 'cost_vendors', 'cost_sites']) await fb.remove(fb.ref(fb.db, `${x}/${코드}`))
      열쇠지우기(코드); 잊기(코드); 나가기()
    } catch (e) { 실패(e, '지우지 못했습니다.') }
  }
  async function 이기기잊기() {
    if (!window.confirm('이 기기에서 이 현장을 잊을까요?\n다음에 열 때 현장 코드와 비밀번호를 다시 넣어야 합니다. (현장 자료는 그대로입니다)')) return
    try { const fb = await loadFb(); const u = await fb.ensureAnon(); await fb.remove(fb.ref(fb.db, `cost_keys/${코드}/${u.uid}`)) } catch (e) { /* 그래도 잊음 */ }
    열쇠지우기(코드); 잊기(코드); 나가기()
  }

  /** 명부 저장 — 잠금(undefined 면 전에 잠근 x 를 그대로) */
  async function 명부저장(종류, id, obj, 잠금) {
    const 키 = { people: '사람', equip: '장비', vendors: '업체' }[종류]
    const 옛 = id ? 명부[키][id] : null
    const 새 = { ...obj }
    let 풀림 = null
    if (잠금 === undefined) { if (옛 && 옛.x) 새.x = 옛.x }
    else if (Object.keys(잠금).length) {
      풀림 = 잠금
      if (!예시) {
        if (!열쇠) { set오류('🔒 잠금이 풀려 있지 않아 주민번호·계좌를 저장할 수 없습니다.'); return false }
        새.x = await 잠그기(열쇠, 잠금)
      } else 새.x = 'ex'
    }
    if (예시) {
      const nid = id || 'n' + Date.now()
      set명부((m) => ({ ...m, [키]: { ...m[키], [nid]: 새 } }))
      set풀린((p) => { const q = { ...p }; if (풀림) q[nid] = 풀림; else if (잠금 !== undefined) delete q[nid]; return q })
      표시(); return true
    }
    try {
      const fb = await loadFb()
      let nid = id
      if (!nid) { const r = fb.push(fb.ref(fb.db, `${명부자리[종류]}/${코드}`)); nid = r.key }
      await fb.set(fb.ref(fb.db, `${명부자리[종류]}/${코드}/${nid}`), 새)
      set명부((m) => ({ ...m, [키]: { ...m[키], [nid]: 새 } }))
      set풀린((p) => { const q = { ...p }; if (풀림) q[nid] = 풀림; else if (잠금 !== undefined) delete q[nid]; return q })
      set오류(''); 표시()
      return true
    } catch (e) { return 실패(e) }
  }
  async function 명부지우기(종류, id) {
    const 키 = { people: '사람', equip: '장비', vendors: '업체' }[종류]
    if (!예시) {
      try { const fb = await loadFb(); await fb.remove(fb.ref(fb.db, `${명부자리[종류]}/${코드}/${id}`)) } catch (e) { return 실패(e, '지우지 못했습니다.') }
    }
    set명부((m) => { const x = { ...m[키] }; delete x[id]; return { ...m, [키]: x } })
    표시(); return true
  }

  /* 출역 — 화면 상태를 먼저 바꾸고(바로 보이게) 서버에 씁니다. 실패하면 되돌림 */
  const 출역바꾸기 = (m, ym, 바꿀) => {
    const 달 = { ...(m.출역[ym] || {}) }
    for (const { pid, dd, g, w } of 바꿀) {
      const a = { ...(달[pid] || { w }), d: { ...((달[pid] && 달[pid].d) || {}) } }
      if (a.w == null) a.w = w
      if (g > 0) a.d[dd] = g; else delete a.d[dd]
      달[pid] = a
    }
    return { ...m, 출역: { ...m.출역, [ym]: 달 } }
  }
  async function 출역여럿(ym, dd, 목록0) {
    const 바꿀 = 목록0.map(({ pid, g, p }) => {
      const 있던 = 명부.출역[ym] && 명부.출역[ym][pid]
      return { pid, dd, g, w: 있던 && 있던.w != null ? 있던.w : Number(p && p.w) || 0 }
    })
    const 전 = 명부
    set명부((m) => 출역바꾸기(m, ym, 바꿀))
    if (예시) { 표시(); return true }
    try {
      const fb = await loadFb()
      const 고칠 = {}
      for (const { pid, g, w } of 바꿀) {
        고칠[`${ym}/${pid}/w`] = w
        고칠[`${ym}/${pid}/d/${dd}`] = g > 0 ? g : null
      }
      await fb.update(fb.ref(fb.db, `cost_att/${코드}`), 고칠)
      표시(); return true
    } catch (e) { set명부(전); return 실패(e, '출역을 저장하지 못했습니다 — 인터넷을 확인해 주십시오.') }
  }
  const 출역찍기 = (ym, pid, dd, g, p) => 출역여럿(ym, dd, [{ pid, g, p }])
  async function 출역칸(ym, pid, 칸, 값) {             // 칸: 'o/np' · 'm' · 'w'
    const 전 = 명부
    set명부((m) => {
      const 달 = { ...(m.출역[ym] || {}) }
      const a = { ...(달[pid] || {}), o: { ...((달[pid] && 달[pid].o) || {}) } }
      if (칸.startsWith('o/')) { const k = 칸.slice(2); if (값 == null) delete a.o[k]; else a.o[k] = 값 }
      else if (값 == null || 값 === '') delete a[칸]; else a[칸] = 값
      if (!Object.keys(a.o).length) delete a.o
      달[pid] = a
      return { ...m, 출역: { ...m.출역, [ym]: 달 } }
    })
    if (예시) { 표시(); return true }
    try {
      const fb = await loadFb()
      const r = fb.ref(fb.db, `cost_att/${코드}/${ym}/${pid}/${칸}`)
      if (값 == null || 값 === '') await fb.remove(r); else await fb.set(r, 값)
      표시(); return true
    } catch (e) { set명부(전); return 실패(e) }
  }
  const 공제고치기 = (ym, pid, k, v) => 출역칸(ym, pid, 'o/' + k, v)
  const 비고고치기 = (ym, pid, m) => 출역칸(ym, pid, 'm', m)
  const 그달일급 = (ym, pid, w) => 출역칸(ym, pid, 'w', w)
  const 대상고치기 = async (ym, pid, ap, ex) => { await 출역칸(ym, pid, 'ap', ap || null); await 출역칸(ym, pid, 'ex', ex || null) }

  /** 🔒 풀기 — 비밀번호가 맞는지는 «이 브라우저가 맞힌 해시(cost_keys)» 와 견줍니다 */
  async function 잠금풀기(pw) {
    try {
      const fb = await loadFb()
      const u = await fb.ensureAnon()
      const mine = await fb.get(fb.ref(fb.db, `cost_keys/${코드}/${u.uid}`))
      if (mine.val() !== await 비번해시(코드, pw)) return false
      const raw = await 열쇠만들기(코드, pw)
      열쇠두기(코드, raw)
      set열쇠(raw)
      set풀린(await 모두풀기(raw, 명부.사람, 명부.장비, 명부.업체))
      return true
    } catch (e) { return false }
  }

  const 새로고침 = async () => { if (예시) return; set바쁨('다시 불러오는 중…'); try { await 불러오기(코드) } catch (e) { set오류('불러오지 못했습니다.') } finally { set바쁨('') } }
  const 잠김 = !예시 && !열쇠 && [명부.사람, 명부.장비, 명부.업체].some((m) => Object.values(m || {}).some((v) => v && v.x))
  const 잠김칸 = !예시 && !열쇠

  return (
    <div className="wrap tp">
      {화면 !== 'site' && (
        <div className="card">
          <h1 className="tl-h1" style={{ marginTop: 0 }}>🏗 현장 투입비 · 공사일보 <span className="count">· 청구내역서까지</span></h1>
          <div className="note sm">
            <b>총공사금액 대비 지금까지 얼마 들었나 · 공정률은 몇 % 인가</b> — 날마다 출역·장비·자재만 누르고 적으면
            누적 투입비 · 공정률 · 남은 금액이 저절로 나오고, 달마다 <b>노무비·장비·자재 청구내역서</b>(공제 자동)를 뽑습니다.
          </div>
          <div className="pdfsafe">
            🔑 회원가입 없음 · 무료. 현장을 만들면 <b>현장 코드 + 비밀번호</b>가 생기고, 그걸 아는 현장 사람만 봅니다.
            주민번호·계좌는 <b>현장 비밀번호로 잠가</b> 저장합니다(저희도 못 봅니다).
          </div>
          <div className="tp-autosave">💾 <b>자동 저장</b> — 누르고 적는 순간 서버에 저장됩니다. 저장 단추가 없습니다. 오늘 적은 것은 <b>내일도, 다음 달에도 다시 열어 고칠 수 있습니다</b>(폰·PC 어디서든 같은 현장 코드로).</div>
        </div>
      )}
      {바쁨 && <div className="card tp-busy">⏳ {바쁨}</div>}
      {오류 && <div className="card dx3-err">{오류} <button type="button" className="tp-x" onClick={() => set오류('')}>닫기</button></div>}

      {화면 === 'home' && (
        <>
          <div className="card">
            <div className="tp-start">
              <button type="button" className="btn" onClick={() => { set오류(''); set화면('new') }}>＋ 새 현장 만들기</button>
              <button type="button" className="btn ghost" onClick={() => { set오류(''); set코드(''); set화면('open') }}>🔑 현장 열기 (코드 + 비밀번호)</button>
            </div>
            <div className="tlx-ex" style={{ marginTop: 10, marginBottom: 0 }}>
              <span className="tlx-exd"><b>🧪 예시로 해 보기</b> — 가상 현장(총공사금액 12억 5천)에 7개월치 출역·장비·자재·기성을 넣어 둔 모습입니다. 청구서까지 눌러 보십시오. 저장되지 않습니다.</span>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={예시보기}>예시 현장 보기</button>
            </div>
          </div>
          {목록.length > 0 && (
            <div className="card">
              <div className="detail-h">이 기기에서 열어 본 현장</div>
              <div className="tp-mine">
                {목록.map((x) => (
                  <div key={x.c} className="tp-mrow">
                    <button type="button" className="tp-mopen" onClick={() => 열어보기(x.c)}><b>{x.n}</b><span>{코드보기(x.c)}</span></button>
                    <button type="button" className="chip" onClick={() => 잊기(x.c)} title="이 목록에서만 뺍니다 (현장은 그대로)">목록에서 빼기</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <TuipbiGuide />
        </>
      )}
      {화면 === 'new' && <NewSite onDone={만들기} onBack={() => set화면('home')} busy={!!바쁨} />}
      {화면 === 'open' && <OpenSite code0={코드} onOpen={열기} onBack={() => set화면('home')} busy={!!바쁨} />}
      {화면 === 'made' && (
        <div className="card tp-made">
          <div className="detail-h">✅ 현장을 만들었습니다</div>
          <div className="tp-code">{코드보기(코드)}</div>
          <p className="tl-p">이 <b>현장 코드</b>와 정하신 <b>비밀번호</b>를 꼭 적어 두십시오. 현장 사람에게 알려 주면 같이 적을 수 있습니다.
            <br /><span className="muted">비밀번호는 저희도 모릅니다(해시만 둡니다) — 잊으시면 찾아 드릴 수 없고, 🔒 잠근 주민번호·계좌도 되살릴 수 없습니다. 이 기기에서는 다시 묻지 않습니다.</span></p>
          <ShareLink code={코드} />
          <div className="tp-autosave">💾 <b>여기부터는 자동 저장입니다.</b> 누르고 적는 순간 저장되고, 나중에 다시 열어 언제든 고칠 수 있습니다.</div>
          <p className="tl-p"><b>다음 차례:</b> 👷 명부에 근로자·장비·자재 업체를 올린 뒤, ✍️ 적기에서 날마다 출역을 누르십시오.</p>
          <button type="button" className="btn" onClick={() => set화면('site')}>현장으로 가기 →</button>
        </div>
      )}
      {화면 === 'site' && 현장 && (
        <TuipbiSite 코드={코드} 코드보기={코드보기} 현장={현장} 줄들={줄들} 사람={명부.사람} 장비={명부.장비} 업체={명부.업체} 출역={명부.출역}
          풀린={풀린} 잠김={잠김칸} 잠김있음={잠김} 예시={예시} 저장됨={저장됨}
          줄저장={줄저장} 줄지우기={줄지우기} 명부저장={명부저장} 명부지우기={명부지우기}
          출역찍기={출역찍기} 출역여럿={출역여럿} 공제고치기={공제고치기} 비고고치기={비고고치기} 그달일급={그달일급} 대상고치기={대상고치기} 잠금풀기={잠금풀기}
          새로고침={새로고침} 나가기={나가기} 정보={정보} set정보={set정보}
          정보칸={<SiteInfo 현장={현장} 코드={코드} 예시={예시} onSave={async (s) => { if (await 현장저장(s)) set정보(false) }} onDelete={현장지우기} onForget={이기기잊기} />} />
      )}

      <div className="card no-print">
        <div className="navrow">
          <Link className="navi" to="/tools">🧰 다른 도구</Link>
          <Link className="navi" to="/forms">📄 건설 서식</Link>
          <Link className="navi" to="/safety">🦺 안전 서류</Link>
        </div>
      </div>
    </div>
  )
}

function ShareLink({ code }) {
  const [복사, set복사] = useState(false)
  const url = `https://k-conmap.com/tools/tuipbi?c=${code}`
  const 복사하기 = async () => { try { await navigator.clipboard.writeText(`K-건설맵 현장 투입비 · 공사일보\n현장 코드 ${코드보기(code)}\n${url}\n(비밀번호는 따로 알려 드립니다)`); set복사(true); setTimeout(() => set복사(false), 2000) } catch (e) { /* 막힌 브라우저 */ } }
  return (
    <div className="tp-share">
      <code>{url}</code>
      <button type="button" className="chip" onClick={복사하기}>{복사 ? '✅ 복사했습니다' : '📋 코드·주소 복사'}</button>
    </div>
  )
}

function NewSite({ onDone, onBack, busy }) {
  const [v, setV] = useState({ name: '', co: '', total: '', budget: '', start: '', end: '', pw: '', pw2: '' })
  const f = (k) => (e) => setV({ ...v, [k]: k === 'total' || k === 'budget' ? 쉼표칸(e.target.value) : e.target.value })
  const 틀림 = !v.name.trim() ? '현장명을 적어 주십시오'
    : !(숫자만(v.total) > 0) ? '총공사금액을 적어 주십시오'
      : v.pw.length < 6 ? '비밀번호는 6자 이상'
        : v.pw !== v.pw2 ? '비밀번호가 서로 다릅니다'
          : v.start && v.end && v.end <= v.start ? '준공일이 착공일보다 뒤여야 합니다' : ''
  return (
    <div className="card">
      <div className="detail-h">＋ 새 현장 만들기</div>
      <div className="tp-form">
        <label>현장명 <input value={v.name} onChange={f('name')} maxLength={60} placeholder="예: ○○지구 배수개선공사" /></label>
        <label>회사명 (선택 — 청구내역서 머리에 들어감) <input value={v.co} onChange={f('co')} maxLength={40} placeholder="예: ○○건설(주)" /></label>
        <label>총공사금액 (도급액, 원) <input value={v.total} onChange={f('total')} inputMode="numeric" placeholder="예: 1,250,000,000" />
          {숫자만(v.total) > 0 && <span className="tp-hint">{억만(숫자만(v.total))} 원</span>}</label>
        <label>실행예산 (선택) <input value={v.budget} onChange={f('budget')} inputMode="numeric" placeholder="있으면 — 실행 대비 투입률·기성 대비 원가도 봅니다" />
          {숫자만(v.budget) > 0 && <span className="tp-hint">{억만(숫자만(v.budget))} 원</span>}</label>
        <div className="tp-two">
          <label>착공일 (선택) <input type="date" value={v.start} onChange={f('start')} /></label>
          <label>준공일 (선택) <input type="date" value={v.end} onChange={f('end')} /></label>
        </div>
        <div className="tp-two">
          <label>비밀번호 (6자 이상) <input type="password" value={v.pw} onChange={f('pw')} autoComplete="new-password" /></label>
          <label>비밀번호 한 번 더 <input type="password" value={v.pw2} onChange={f('pw2')} autoComplete="new-password" /></label>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>공사기간을 넣으면 «공기는 몇 % 지났는데 공정은 몇 %» 를 견줘 드립니다. 비밀번호는 주민번호·계좌 잠금 열쇠도 됩니다 — 잊으면 되살릴 수 없습니다.</div>
      </div>
      {틀림 && (v.name || v.total || v.pw) && <div className="tp-warn">{틀림}</div>}
      <div className="tp-start" style={{ marginTop: 12 }}>
        <button type="button" className="btn" disabled={!!틀림 || busy} onClick={() => onDone(v)}>현장 만들기</button>
        <button type="button" className="btn ghost" onClick={onBack}>← 돌아가기</button>
      </div>
    </div>
  )
}

function OpenSite({ code0, onOpen, onBack, busy }) {
  const [c, setC] = useState(code0 ? 코드보기(code0) : '')
  const [pw, setPw] = useState('')
  const cc = 코드정리(c)
  return (
    <div className="card">
      <div className="detail-h">🔑 현장 열기</div>
      <div className="tp-form">
        <label>현장 코드 (9자리) <input value={c} onChange={(e) => setC(e.target.value.toUpperCase())} placeholder="예: K7F-3Q9-2MX" maxLength={11} autoCapitalize="characters" /></label>
        <label>비밀번호 <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && cc.length === 9 && pw) onOpen(cc, pw) }} /></label>
      </div>
      <div className="tp-start" style={{ marginTop: 12 }}>
        <button type="button" className="btn" disabled={cc.length !== 9 || !pw || busy} onClick={() => onOpen(cc, pw)}>열기</button>
        <button type="button" className="btn ghost" onClick={onBack}>← 돌아가기</button>
      </div>
    </div>
  )
}

function SiteInfo({ 현장, 코드, 예시, onSave, onDelete, onForget }) {
  const [v, setV] = useState({ name: 현장.name, co: 현장.co || '', total: 원(현장.total), budget: 현장.budget ? 원(현장.budget) : '', start: 현장.start || '', end: 현장.end || '' })
  const [지움, set지움] = useState('')
  const f = (k) => (e) => setV({ ...v, [k]: k === 'total' || k === 'budget' ? 쉼표칸(e.target.value) : e.target.value })
  const 저장 = () => {
    const s = { name: v.name.trim() || 현장.name, total: 숫자만(v.total), at: 현장.at || Date.now(), upd: Date.now() }
    if (숫자만(v.budget) > 0) s.budget = 숫자만(v.budget)
    if (v.start) s.start = v.start
    if (v.end) s.end = v.end
    if (v.co.trim()) s.co = v.co.trim().slice(0, 40)
    onSave(s)
  }
  return (
    <div className="tp-info no-print">
      <div className="tp-form">
        <div className="tp-two">
          <label>현장명 <input value={v.name} onChange={f('name')} maxLength={60} /></label>
          <label>회사명 (청구내역서 머리) <input value={v.co} onChange={f('co')} maxLength={40} /></label>
        </div>
        <div className="tp-two">
          <label>총공사금액 (원) <input value={v.total} onChange={f('total')} inputMode="numeric" /></label>
          <label>실행예산 (선택) <input value={v.budget} onChange={f('budget')} inputMode="numeric" /></label>
        </div>
        <div className="tp-two">
          <label>착공일 <input type="date" value={v.start} onChange={f('start')} /></label>
          <label>준공일 <input type="date" value={v.end} onChange={f('end')} /></label>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>설계변경으로 도급액이 바뀌면 총공사금액만 고치십시오 — 투입률·공정률이 새 금액으로 다시 셈됩니다.</div>
      </div>
      <div className="tp-start" style={{ marginTop: 8 }}>
        <button type="button" className="btn" style={{ width: 'auto' }} disabled={!(숫자만(v.total) > 0)} onClick={저장}>저장</button>
        {!예시 && <button type="button" className="btn ghost" style={{ width: 'auto' }} onClick={onForget}>이 기기에서 잊기</button>}
      </div>
      {!예시 && (
        <>
          <ShareLink code={코드} />
          <details className="tp-del">
            <summary>현장 지우기</summary>
            <div className="tl-p">적은 것 · 명부 · 출역까지 <b>모두 지워지고 되돌릴 수 없습니다</b>. 지우시려면 현장명 «{현장.name}» 을 그대로 적어 주십시오.</div>
            <input value={지움} onChange={(e) => set지움(e.target.value)} placeholder={현장.name} />
            <button type="button" className="btn ghost" disabled={지움 !== 현장.name} onClick={onDelete}>영영 지우기</button>
          </details>
        </>
      )}
    </div>
  )
}
