/**
 * 📎 업체 스스로 등록 — 공사일보(현장 투입비)의 «업체 링크» (2026-09-27)
 *
 * 소장님: 「장비, 자재, 기타 공사에서 투입된 비용을 장비업자, 자재공급업자, 기타 업자가 스스로 등록하게 하면 어때?
 *          등록하면 공사현장관계자가 바로 볼 수 있게 되고, 세금계산서 발행 여부도 확인하게 되면 좋게 해줘」
 *        「아직도 컴퓨터 사용이 서툰 사람이 많아서..ㅠㅠ … 이 도구를 활용하면서, 건설맵도 알리는 효과가 있는 걸로」
 *        → 고르심: 업체 링크로 등록·현장 확인 · 세금계산서 발행 확인 · 업자용 «내 납품 장부» (사진은 뺌)
 *
 * ■ 흐름
 *   ① 현장(📥 업체 입력 탭)에서 업체마다 «📎 링크 만들기» → 카톡으로 보냄
 *   ② 업체는 링크만 누르면 됩니다(가입·비밀번호 없음) — 그 현장에 «자기 줄만» 적고 봅니다
 *   ③ 현장이 «✅ 확인» 을 누르면 그때 투입비(자재비·장비비·기타)에 들어갑니다(cost_rows 에 한 줄 + ok = 그 줄 번호)
 *   ④ 세금계산서: 업체가 «🧾 발행함» → 현장이 «받음» — 초록
 *   ⑤ 업체 폰의 «📒 내 납품 장부»(/tools/tuipbi/v) — 이 기기가 연 링크들을 한 화면에(localStorage kcm_vlinks)
 *
 * ■ 저장 자리(규칙: web/database.rules.json «업체 링크»)
 *   cost_vlink/{현장}/{링크 20자}   {k: E|M|O, ref?: 장비·업체 번호, n: 업체명, sn: 현장명, off?: 끊음, at}
 *                                  읽기 = 현장 사람 전부 · 그 «링크 하나» 는 주소를 아는 사람(업체)
 *   cost_vin/{현장}/{링크}/{번호}    {d, t, s?, q, un?, u, amt, m?, tax?: {y, d?}, ok?: 투입비 줄 번호, okAt?, taxok?, by?, at}
 *                                  업체 = 확인 전 줄만 쓰고 지움 · ok·taxok 는 못 씀 · 확인 뒤엔 tax 만
 *   ⚠️ 링크 주소가 곧 열쇠입니다(20자 · 짐작 불가). 현장이 «끊기» 하면 업체는 더 못 씁니다.
 * ■ 매일 백업·30일 비우기(tools/공사일보백업.py)에 두 자리를 같이 넣었습니다.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { 원, 오늘, 단위들, 자재단위 } from '../lib/tuipbi.js'

let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}
const 숫자 = (s) => Number(String(s ?? '').replace(/[^0-9.]/g, '')) || 0
const 쉼표칸 = (s) => { const n = String(s || '').replace(/[^0-9]/g, ''); return n ? 원(Number(n)) : '' }
export const 업체갈래 = { M: '자재', E: '장비', O: '기타' }
const 링크글자 = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
export function 링크만들기() {
  const a = new Uint8Array(20); crypto.getRandomValues(a)
  return [...a].map((v) => 링크글자[v % 링크글자.length]).join('')
}
export const 업체주소 = (site, link) => `${window.location.origin}/tools/tuipbi/v/${site}/${link}`

/* 이 기기가 연 업체 링크들 — «📒 내 납품 장부» 가 씁니다 */
const 내링크키 = 'kcm_vlinks'
export const 내링크읽기 = () => { try { const v = JSON.parse(localStorage.getItem(내링크키) || '[]'); return Array.isArray(v) ? v : [] } catch (e) { return [] } }
const 내링크두기 = (x) => {
  try {
    const L = 내링크읽기().filter((y) => !(y.s === x.s && y.l === x.l))
    L.unshift(x); localStorage.setItem(내링크키, JSON.stringify(L.slice(0, 30)))
  } catch (e) { /* 사생활 창 */ }
}

/* ─────────────────────────── 현장 쪽 ─────────────────────────── */

/** 현장 화면(TuipbiSite)이 한 번 부릅니다 — 탭 이름의 «대기 N» 과 한눈에 띠에도 씀 */
export function use업체입력(코드, 예시) {
  const [링크들, set링크들] = useState(null)
  const [들어온, set들어온] = useState({})
  const [오류, set오류] = useState('')
  const 읽기 = async () => {
    if (예시 || !코드) { set링크들({}); set들어온({}); return }
    try {
      const fb = await loadFb()
      const [a, b] = await Promise.all([fb.get(fb.ref(fb.db, `cost_vlink/${코드}`)), fb.get(fb.ref(fb.db, `cost_vin/${코드}`))])
      set링크들(a.val() || {}); set들어온(b.val() || {}); set오류('')
    } catch (e) { set링크들({}); set들어온({}); set오류('업체 입력을 읽지 못했습니다 — 잠시 뒤 ↻ 새로고침') }
  }
  useEffect(() => { 읽기() }, [코드, 예시]) // eslint-disable-line react-hooks/exhaustive-deps
  const 대기 = useMemo(() => {
    const out = []
    for (const [l, g] of Object.entries(들어온 || {})) for (const [id, x] of Object.entries(g || {})) if (x && !x.ok) out.push({ l, id, ...x })
    return out.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.at || 0) - (b.at || 0)))
  }, [들어온])
  return { 링크들, 들어온, 읽기, 대기, 오류 }
}

export function VendorInbox(P) {
  const { 코드, 예시, 현장, 장비 = {}, 업체 = {}, 새로고침, 줄지우기, V } = P
  const { 링크들, 들어온, 읽기, 대기, 오류 } = V
  const [msg, setMsg] = useState('')
  const [바쁨, set바쁨] = useState(false)
  const [새, set새] = useState({ k: 'M', ref: '', n: '' })
  const [보임, set보임] = useState('')
  const [다보기, set다보기] = useState(false)

  const 고를것 = 새.k === 'M' ? Object.entries(업체).filter(([, x]) => x && !x.off).map(([id, x]) => [id, x.n + (x.g ? ` (${x.g})` : '')])
    : 새.k === 'E' ? Object.entries(장비).filter(([, x]) => x && !x.off).map(([id, x]) => [id, [x.v, x.n, x.s].filter(Boolean).join(' · ')])
      : []
  const 이름 = (새.n || '').trim() || (새.ref && (고를것.find(([id]) => id === 새.ref) || [])[1]) || ''

  const 만들기 = async () => {
    if (!이름) return setMsg('업체 이름을 고르거나 적어 주십시오.')
    set바쁨(true); setMsg('')
    try {
      const fb = await loadFb(); await fb.ensureAnon()
      const l = 링크만들기()
      const v = { k: 새.k, n: 이름.slice(0, 40), sn: String((현장 && 현장.name) || '현장').slice(0, 60), at: Date.now() }
      if (새.ref) v.ref = 새.ref
      await fb.set(fb.ref(fb.db, `cost_vlink/${코드}/${l}`), v)
      await 읽기(); set보임(l); set새({ k: 새.k, ref: '', n: '' })
    } catch (e) { setMsg('링크를 만들지 못했습니다 — 잠시 뒤 다시 해 주십시오.') } finally { set바쁨(false) }
  }
  const 끊기 = async (l, 끊음) => {
    try { const fb = await loadFb(); await fb.set(fb.ref(fb.db, `cost_vlink/${코드}/${l}/off`), 끊음 ? true : null); await 읽기() } catch (e) { setMsg('바꾸지 못했습니다.') }
  }
  const 복사 = async (l) => {
    const u = 업체주소(코드, l)
    try { await navigator.clipboard.writeText(u); setMsg('📋 주소를 복사했습니다 — 카톡에 붙여 넣어 보내십시오.') } catch (e) { setMsg(u) }
  }
  const 보내기 = async (l, n) => {
    const u = 업체주소(코드, l)
    if (navigator.share) { try { await navigator.share({ title: 'K-건설맵 납품 장부', text: `${n} 사장님 — ${현장 && 현장.name} 납품·투입을 여기에 적어 주세요(가입 없음).`, url: u }) } catch (e) { /* 닫음 */ } } else 복사(l)
  }
  const 확인 = async (x) => {
    const L = (링크들 || {})[x.l]; if (!L) return
    set바쁨(true); setMsg('')
    try {
      const fb = await loadFb()
      const rid = fb.push(fb.ref(fb.db, `cost_rows/${코드}`)).key
      const row = { d: x.d, k: L.k === 'E' ? 'E' : L.k === 'M' ? 'M' : 'O', t: String(x.t || '').slice(0, 100), q: Number(x.q) || 0, u: Number(x.u) || 0, amt: Math.round(Number(x.amt) || 0), at: Date.now(), by: ('업체 ' + L.n).slice(0, 20) }
      if (x.un) row.un = String(x.un).slice(0, 6)
      if (x.s) row.sp = String(x.s).slice(0, 40)
      if (L.ref && L.k === 'E') row.eq = L.ref
      if (L.ref && L.k === 'M') row.vd = L.ref
      /* 한 번에(update) — 투입비 줄과 «확인됨» 표시가 같이 들어가거나 같이 안 들어갑니다 */
      await fb.update(fb.ref(fb.db), { [`cost_rows/${코드}/${rid}`]: row, [`cost_vin/${코드}/${x.l}/${x.id}/ok`]: rid, [`cost_vin/${코드}/${x.l}/${x.id}/okAt`]: Date.now() })
      await 읽기(); 새로고침 && 새로고침()
      setMsg(`✅ 확인했습니다 — ${업체갈래[L.k]}비에 ${원(row.amt)}원이 들어갔습니다.`)
    } catch (e) { setMsg('확인하지 못했습니다 — 잠시 뒤 다시 해 주십시오.') } finally { set바쁨(false) }
  }
  const 확인취소 = async (x) => {
    if (!window.confirm('확인을 거둘까요? 투입비에 들어간 줄은 🗑 휴지통으로 갑니다(30일 되살리기).')) return
    set바쁨(true)
    try {
      if (x.ok && 줄지우기) await 줄지우기(x.ok)
      const fb = await loadFb()
      await fb.update(fb.ref(fb.db), { [`cost_vin/${코드}/${x.l}/${x.id}/ok`]: null, [`cost_vin/${코드}/${x.l}/${x.id}/okAt`]: null })
      await 읽기()
    } catch (e) { setMsg('거두지 못했습니다.') } finally { set바쁨(false) }
  }
  const 세금받음 = async (x, 받음) => {
    try { const fb = await loadFb(); await fb.set(fb.ref(fb.db, `cost_vin/${코드}/${x.l}/${x.id}/taxok`), 받음 ? true : null); await 읽기() } catch (e) { setMsg('바꾸지 못했습니다.') }
  }

  if (예시) {
    return (
      <div className="card">
        <div className="detail-h">📥 업체 입력 — 업체가 스스로 적는 납품·투입</div>
        <p className="tl-p">장비·자재 업체에 <b>링크</b>를 보내면, 업체가 가입 없이 <b>자기 납품만</b> 적습니다. 현장이 <b>✅ 확인</b>을 누르면 그때 투입비에 들어가고, 세금계산서 «발행함 → 받음» 도 여기서 봅니다.</p>
        <p className="muted" style={{ margin: 0 }}>🧪 예시 현장에서는 링크를 만들 수 없습니다 — 내 현장을 만들어 써 보십시오.</p>
      </div>
    )
  }
  const 모든줄 = []
  for (const [l, g] of Object.entries(들어온 || {})) for (const [id, x] of Object.entries(g || {})) if (x) 모든줄.push({ l, id, ...x })
  모든줄.sort((a, b) => (a.d > b.d ? -1 : a.d < b.d ? 1 : (b.at || 0) - (a.at || 0)))
  const 줄칸 = (x) => {
    const L = (링크들 || {})[x.l] || {}
    return (
      <div key={x.l + x.id} className={'tp-vrow' + (x.ok ? ' ok' : '')}>
        <div className="tp-vrow-h">
          <b>{x.d}</b> · <span className="tp-vtag">{업체갈래[L.k] || ''}</span> {L.n || '업체'}
          {x.ok ? <span className="tp-vok">✅ 확인됨</span> : <span className="tp-vwait">확인 대기</span>}
        </div>
        <div>{x.t}{x.s ? ` ${x.s}` : ''} · {x.q}{x.un || ''} × {원(x.u)} = <b>{원(x.amt)}원</b>{x.m ? <span className="muted"> · {x.m}</span> : null}</div>
        <div className="tp-vrow-a">
          {x.tax && x.tax.y
            ? (x.taxok
              ? <span className="tp-vok">🧾 세금계산서 받음</span>
              : <><span className="tp-vwait">🧾 업체 발행함{x.tax.d ? ` (${x.tax.d})` : ''}</span> <button type="button" className="chip" onClick={() => 세금받음(x, true)}>받음</button></>)
            : <span className="muted">🧾 세금계산서 아직</span>}
          {x.taxok && <button type="button" className="tp-x" onClick={() => 세금받음(x, false)}>받음 거두기</button>}
          {!x.ok && <button type="button" className="btn" style={{ width: 'auto' }} disabled={바쁨} onClick={() => 확인(x)}>✅ 확인 — 투입비에 넣기</button>}
          {x.ok && <button type="button" className="tp-x" disabled={바쁨} onClick={() => 확인취소(x)}>확인 거두기</button>}
        </div>
      </div>
    )
  }
  const 링크목록 = Object.entries(링크들 || {}).sort((a, b) => (b[1].at || 0) - (a[1].at || 0))
  return (
    <>
      <div className="card">
        <div className="detail-h">📥 업체가 올린 것 — 확인 대기 {대기.length}</div>
        {오류 && <div className="cwarn">⚠️ {오류}</div>}
        {링크들 === null && <div className="muted">읽는 중…</div>}
        {링크들 !== null && 대기.length === 0 && <div className="muted">확인할 것이 없습니다. 아래에서 업체에 링크를 보내면 업체가 여기로 올립니다.</div>}
        {대기.map(줄칸)}
        {msg && <div className="tp-vmsg">{msg}</div>}
      </div>

      <div className="card">
        <div className="detail-h">📎 업체 링크 — 업체가 가입 없이 직접 적게</div>
        <p className="tl-p" style={{ marginTop: 0 }}>
          업체마다 링크를 하나 만들어 <b>카톡으로 보내십시오.</b> 업체는 그 링크에서 <b>자기 납품·투입만</b> 적고 봅니다(다른 자료는 못 봅니다).
          <b> ✅ 확인</b>을 눌러야 투입비에 들어갑니다. 필요 없어지면 <b>끊기</b>.
        </p>
        <div className="tp-erow">
          <label className="tp-t">갈래 <select value={새.k} onChange={(e) => set새({ k: e.target.value, ref: '', n: '' })}>
            <option value="M">🧱 자재 업체</option><option value="E">🚜 장비</option><option value="O">📦 기타(외주·경비)</option>
          </select></label>
          {고를것.length > 0 && (
            <label className="tp-t">명부에서 <select value={새.ref} onChange={(e) => set새({ ...새, ref: e.target.value, n: '' })}>
              <option value="">고르기 (없으면 아래에 적기)</option>
              {고를것.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select></label>
          )}
          <label className="tp-t">업체 이름 <input value={새.n} maxLength={40} onChange={(e) => set새({ ...새, n: e.target.value })} placeholder={새.ref ? '명부 이름 그대로' : '예: ○○레미콘'} /></label>
          <button type="button" className="btn" style={{ width: 'auto' }} disabled={바쁨} onClick={만들기}>📎 링크 만들기</button>
        </div>
        {링크목록.length === 0 && <div className="muted" style={{ fontSize: 13 }}>아직 만든 링크가 없습니다.</div>}
        {링크목록.map(([l, L]) => {
          const g = Object.values((들어온 || {})[l] || {})
          const 대기수 = g.filter((x) => x && !x.ok).length
          return (
            <div key={l} className={'tp-vlink' + (L.off ? ' off' : '') + (보임 === l ? ' new' : '')}>
              <div><span className="tp-vtag">{업체갈래[L.k]}</span> <b>{L.n}</b> <span className="muted">· 올린 줄 {g.length}{대기수 ? ` · 대기 ${대기수}` : ''}{L.off ? ' · 끊음' : ''}</span></div>
              {보임 === l && <div className="tp-vurl">{업체주소(코드, l)}</div>}
              <div className="tp-vrow-a">
                {!L.off && <button type="button" className="chip" onClick={() => 보내기(l, L.n)}>📤 카톡 등으로 보내기</button>}
                {!L.off && <button type="button" className="chip" onClick={() => 복사(l)}>📋 주소 복사</button>}
                <button type="button" className="tp-x" onClick={() => 끊기(l, !L.off)}>{L.off ? '다시 잇기' : '끊기'}</button>
              </div>
            </div>
          )
        })}
      </div>

      {모든줄.length > 0 && (
        <div className="card">
          <div className="detail-h">📜 업체가 올린 것 모두 {모든줄.length}</div>
          {(다보기 ? 모든줄 : 모든줄.slice(0, 20)).map(줄칸)}
          {모든줄.length > 20 && <button type="button" className="chip" onClick={() => set다보기(!다보기)}>{다보기 ? '접기' : `모두 보기 (${모든줄.length})`}</button>}
        </div>
      )}
    </>
  )
}

/* ─────────────────────────── 업체 쪽 ─────────────────────────── */

const 이번달 = () => 오늘().slice(0, 7)

export default function TuipbiVendor() {
  const { site, link } = useParams()
  useEffect(() => {
    document.title = '납품 장부 · K-건설맵'
    let el = document.head.querySelector('meta[name="robots"]')
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'robots'); document.head.appendChild(el) }
    el.setAttribute('content', 'noindex, nofollow')
    return () => { if (el) el.remove() }
  }, [])
  if (!site || !link) return <MyLedger />
  return <VendorPage site={site} link={link} />
}

function VendorPage({ site, link }) {
  const [L, setL] = useState(undefined)          // 링크 정보 · null = 없음
  const [줄들, set줄들] = useState({})
  const [msg, setMsg] = useState('')
  const [바쁨, set바쁨] = useState(false)
  const 빈칸 = { d: 오늘(), t: '', s: '', q: '', un: '', u: '', m: '' }
  const [f, setF] = useState(빈칸)
  const [고침, set고침] = useState('')
  const 읽기 = async () => {
    try {
      const fb = await loadFb(); await fb.ensureAnon()
      const a = await fb.get(fb.ref(fb.db, `cost_vlink/${site}/${link}`))
      const v = a.val()
      if (!v) { setL(null); return }
      setL(v)
      내링크두기({ s: site, l: link, n: v.n, sn: v.sn, k: v.k })
      const b = await fb.get(fb.ref(fb.db, `cost_vin/${site}/${link}`))
      set줄들(b.val() || {})
    } catch (e) { setL(null) }
  }
  useEffect(() => { 읽기() }, [site, link]) // eslint-disable-line react-hooks/exhaustive-deps
  const 목록 = useMemo(() => Object.entries(줄들 || {}).map(([id, x]) => ({ id, ...x })).sort((a, b) => (a.d > b.d ? -1 : a.d < b.d ? 1 : (b.at || 0) - (a.at || 0))), [줄들])
  const 품명들 = useMemo(() => [...new Set(목록.map((x) => x.t).filter(Boolean))].slice(0, 30), [목록])
  const 수량 = 숫자(f.q), 단가 = 숫자(f.u), 금액 = Math.round(수량 * 단가)
  const set_ = (k) => (e) => setF((v) => ({ ...v, [k]: k === 'u' ? 쉼표칸(e.target.value) : k === 'q' ? e.target.value.replace(/[^0-9.]/g, '') : e.target.value }))
  const 어제처럼 = () => { const x = 목록[0]; if (x) setF({ d: 오늘(), t: x.t || '', s: x.s || '', q: String(x.q ?? ''), un: x.un || '', u: 원(x.u), m: '' }) }
  const 올리기 = async () => {
    if (!f.t.trim()) return setMsg('품명(장비명)을 적어 주세요.')
    if (!(금액 > 0)) return setMsg('수량과 단가를 적어 주세요.')
    set바쁨(true); setMsg('')
    try {
      const fb = await loadFb(); const u = await fb.ensureAnon()
      const x = { d: f.d || 오늘(), t: f.t.trim().slice(0, 100), q: 수량, u: 단가, amt: 금액, at: Date.now(), by: u.uid }
      if (f.s.trim()) x.s = f.s.trim().slice(0, 40)
      if (f.un.trim()) x.un = f.un.trim().slice(0, 6)
      if (f.m.trim()) x.m = f.m.trim().slice(0, 200)
      if (고침) {
        const 옛 = 줄들[고침] || {}
        if (옛.tax) x.tax = 옛.tax
        await fb.set(fb.ref(fb.db, `cost_vin/${site}/${link}/${고침}`), x)
      } else {
        await fb.set(fb.push(fb.ref(fb.db, `cost_vin/${site}/${link}`)), x)
      }
      setF({ ...빈칸, d: f.d }); set고침(''); await 읽기()
      setMsg('✅ 올렸습니다 — 현장이 확인하면 «✅ 현장 확인» 으로 바뀝니다.')
    } catch (e) {
      setMsg(L && L.off ? '현장이 이 링크를 끊었습니다 — 현장에 물어봐 주세요.' : '올리지 못했습니다 — 이미 현장이 확인한 줄은 못 고칩니다. 잠시 뒤 다시 해 주세요.')
    } finally { set바쁨(false) }
  }
  const 고치기 = (x) => { set고침(x.id); setF({ d: x.d, t: x.t || '', s: x.s || '', q: String(x.q ?? ''), un: x.un || '', u: 원(x.u), m: x.m || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const 지우기 = async (x) => {
    if (!window.confirm('이 줄을 지울까요?')) return
    try { const fb = await loadFb(); await fb.set(fb.ref(fb.db, `cost_vin/${site}/${link}/${x.id}`), null); await 읽기() } catch (e) { setMsg('지우지 못했습니다 — 현장이 확인한 줄은 못 지웁니다.') }
  }
  const 발행 = async (x, 함) => {
    try {
      const fb = await loadFb()
      await fb.set(fb.ref(fb.db, `cost_vin/${site}/${link}/${x.id}/tax`), 함 ? { y: true, d: 오늘() } : { y: false })
      await 읽기()
    } catch (e) { setMsg('바꾸지 못했습니다.') }
  }

  if (L === undefined) return <div className="wrap"><div className="card muted">여는 중…</div></div>
  if (L === null) {
    return (
      <div className="wrap">
        <div className="card">
          <div className="detail-h">📒 납품 장부</div>
          <p className="tl-p">링크가 잘못되었거나 없어졌습니다. 현장에 링크를 다시 받아 주세요.</p>
          <Link className="navi" to="/tools/tuipbi/v">📒 내 납품 장부 (이 기기에서 연 현장들)</Link>
        </div>
      </div>
    )
  }
  const 단위목록 = L.k === 'E' ? 단위들 : 자재단위
  const 달 = 이번달()
  const 이번 = 목록.filter((x) => String(x.d).slice(0, 7) === 달)
  const 합 = (a) => a.reduce((s, x) => s + (Number(x.amt) || 0), 0)
  return (
    <div className="wrap tp-vd">
      <div className="card tp-vhead">
        <div className="tp-vbrand">📒 K-건설맵 무료 납품 장부</div>
        <h1>{L.n}</h1>
        <div className="tp-vsite">🏗 {L.sn} <span className="tp-vtag">{업체갈래[L.k]}</span></div>
        {L.off && <div className="cwarn">⚠️ 현장이 이 링크를 끊었습니다 — 새로 적을 수 없습니다. 적은 것은 볼 수 있습니다.</div>}
        <div className="tp-vsum">
          <span>이번 달 <b>{원(합(이번))}원</b></span>
          <span>현장 확인 <b>{원(합(이번.filter((x) => x.ok)))}원</b></span>
          <span>확인 대기 <b>{이번.filter((x) => !x.ok).length}줄</b></span>
        </div>
      </div>

      {!L.off && (
        <div className="card">
          <div className="detail-h">{고침 ? '✏️ 고치기' : '✍️ 오늘 넣은 것 적기'}</div>
          <div className="tp-vform">
            <label>날짜 <input type="date" value={f.d} onChange={set_('d')} /></label>
            <label>{L.k === 'E' ? '장비명' : '품명'} <input value={f.t} onChange={set_('t')} list="tp-v-names" maxLength={100} placeholder={L.k === 'E' ? '예: 굴삭기 0.7㎥' : '예: 레미콘'} /></label>
            <datalist id="tp-v-names">{품명들.map((x) => <option key={x} value={x} />)}</datalist>
            <label>규격 <input value={f.s} onChange={set_('s')} maxLength={40} placeholder={L.k === 'E' ? '예: 0.7㎥' : '예: 25-24-150'} /></label>
            <label>수량 <input value={f.q} onChange={set_('q')} inputMode="decimal" placeholder="예: 1" /></label>
            <label>단위 <input value={f.un} onChange={set_('un')} list="tp-v-units" maxLength={6} placeholder={L.k === 'E' ? '일' : '㎥'} /></label>
            <datalist id="tp-v-units">{단위목록.map((x) => <option key={x} value={x} />)}</datalist>
            <label>단가 <input value={f.u} onChange={set_('u')} inputMode="numeric" placeholder="예: 650,000" /></label>
            <label className="wide">메모 <input value={f.m} onChange={set_('m')} maxLength={200} placeholder="(안 적어도 됩니다)" /></label>
          </div>
          <div className="tp-vtotal">= <b>{원(금액)}</b> 원</div>
          <div className="tp-vrow-a">
            <button type="button" className="btn" style={{ width: 'auto' }} disabled={바쁨} onClick={올리기}>{바쁨 ? '올리는 중…' : 고침 ? '고친 것 올리기' : '올리기'}</button>
            {!고침 && 목록.length > 0 && <button type="button" className="chip" onClick={어제처럼}>↺ 어제처럼</button>}
            {고침 && <button type="button" className="chip" onClick={() => { set고침(''); setF(빈칸) }}>그만두기</button>}
          </div>
          {msg && <div className="tp-vmsg">{msg}</div>}
        </div>
      )}

      <div className="card">
        <div className="detail-h">📜 내가 올린 것 {목록.length}</div>
        {목록.length === 0 && <div className="muted">아직 없습니다. 위에서 적어 올려 주세요.</div>}
        {목록.map((x) => (
          <div key={x.id} className={'tp-vrow' + (x.ok ? ' ok' : '')}>
            <div className="tp-vrow-h"><b>{x.d}</b> {x.ok ? <span className="tp-vok">✅ 현장 확인</span> : <span className="tp-vwait">확인 대기</span>}</div>
            <div>{x.t}{x.s ? ` ${x.s}` : ''} · {x.q}{x.un || ''} × {원(x.u)} = <b>{원(x.amt)}원</b>{x.m ? <span className="muted"> · {x.m}</span> : null}</div>
            <div className="tp-vrow-a">
              {x.taxok
                ? <span className="tp-vok">🧾 세금계산서 — 현장 받음</span>
                : x.tax && x.tax.y
                  ? <><span className="tp-vwait">🧾 발행함{x.tax.d ? ` (${x.tax.d})` : ''}</span> <button type="button" className="tp-x" onClick={() => 발행(x, false)}>거두기</button></>
                  : <button type="button" className="chip" onClick={() => 발행(x, true)}>🧾 세금계산서 발행함</button>}
              {!x.ok && !L.off && <button type="button" className="tp-x" onClick={() => 고치기(x)}>고치기</button>}
              {!x.ok && !L.off && <button type="button" className="tp-x" onClick={() => 지우기(x)}>지우기</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="card tp-vfoot">
        <div>💡 폰에서 <b>«홈 화면에 추가»</b> 해 두면 다음부터 한 번에 열립니다.</div>
        <div className="navrow" style={{ marginTop: 8 }}>
          <Link className="navi" to="/tools/tuipbi/v">📒 내 납품 장부 — 현장 모아 보기</Link>
          <Link className="navi" to="/tools/tuipbi">🏗 내 현장도 공사일보로 — 출역·장비·자재·청구서 무료</Link>
          <Link className="navi" to="/">💰 바로투찰 — 투찰금액 계산</Link>
        </div>
      </div>
    </div>
  )
}

/** 📒 내 납품 장부 — 이 기기가 연 링크들을 한 화면에 */
function MyLedger() {
  const [링크들] = useState(내링크읽기)
  const [자료, set자료] = useState({})     // {s/l: {L, 줄들} | null}
  useEffect(() => {
    let 살 = true
    ;(async () => {
      try {
        const fb = await loadFb(); await fb.ensureAnon()
        const out = {}
        await Promise.all(링크들.map(async (x) => {
          try {
            const [a, b] = await Promise.all([fb.get(fb.ref(fb.db, `cost_vlink/${x.s}/${x.l}`)), fb.get(fb.ref(fb.db, `cost_vin/${x.s}/${x.l}`))])
            out[x.s + '/' + x.l] = a.val() ? { L: a.val(), 줄들: Object.values(b.val() || {}) } : null
          } catch (e) { out[x.s + '/' + x.l] = null }
        }))
        if (살) set자료(out)
      } catch (e) { /* 모름 */ }
    })()
    return () => { 살 = false }
  }, [링크들])
  const 달 = 이번달()
  const 합 = (a) => a.reduce((s, x) => s + (Number(x.amt) || 0), 0)
  return (
    <div className="wrap tp-vd">
      <div className="card tp-vhead">
        <div className="tp-vbrand">📒 K-건설맵 무료 납품 장부</div>
        <h1>내 납품 장부</h1>
        <div className="muted">이 폰(브라우저)에서 연 현장 링크들을 모아 봅니다. 현장에서 받은 링크를 한 번 열면 여기 저절로 들어옵니다.</div>
      </div>
      {링크들.length === 0 && <div className="card muted">아직 연 현장이 없습니다. 현장 담당자에게 «업체 링크»를 받아 한 번 열어 주세요.</div>}
      {링크들.map((x) => {
        const d = 자료[x.s + '/' + x.l]
        const 줄들 = (d && d.줄들) || []
        const 이번 = 줄들.filter((y) => String(y.d).slice(0, 7) === 달)
        return (
          <Link key={x.s + x.l} className="card tp-vlink" to={`/tools/tuipbi/v/${x.s}/${x.l}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div><span className="tp-vtag">{업체갈래[x.k] || ''}</span> <b>{x.sn}</b> <span className="muted">· {x.n}</span> {d === null && <span className="tp-vwait">링크 끊김</span>}</div>
            {d && (
              <div className="tp-vsum">
                <span>이번 달 <b>{원(합(이번))}원</b></span>
                <span>확인 대기 <b>{줄들.filter((y) => !y.ok).length}줄</b></span>
                <span>세금계산서 받음 <b>{줄들.filter((y) => y.taxok).length}</b> / 발행 <b>{줄들.filter((y) => y.tax && y.tax.y).length}</b></span>
              </div>
            )}
          </Link>
        )
      })}
      <div className="card tp-vfoot">
        <div className="navrow">
          <Link className="navi" to="/tools/tuipbi">🏗 내 현장도 공사일보로 — 무료</Link>
          <Link className="navi" to="/">💰 바로투찰</Link>
        </div>
      </div>
    </div>
  )
}
