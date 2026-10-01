import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 판단, 신고할일, 달규칙, 달더하기, 짧은날, 달글, 한달되는날, 달, 전날 } from '../lib/ilyong4.js'
import { 공제셈 } from '../lib/gongje.js'
import G from '../data/ilyong_guide.json'

/**
 * 🛡 /tools/ilyong-boheom — 일용직 4대보험 가입 판단기 (G107 · 2026-10-01)
 *   📘 /tools/ilyong-guide — 가입 기준 설명 (같은 파일 IlyongGuide · 글은 data/ilyong_guide.json 한 곳 — prerender.py 도 같은 글을 굽습니다)
 *
 * 소장님: 「만들어 주고, 연결 대상이 있으면 연결해 주고, 예시도 만들어 주고, 설명페이지도 만들어 줘 검색에 걸리게
 *          모의 계산기 보다 설명도 자세히 해줘야 하고, 기능도 더 좋게 해줘」 · 「일용노무비랑 연결할 수 있어? 가능하면 해줘」
 *
 * ■ 판단 셈은 lib/ilyong4.js 하나(노무비 계산기 · 현장 투입비도 같은 셈) · 공제 금액은 lib/gongje.js(같은 요율 · 같은 끝전)
 * ■ 저장: 이 브라우저 localStorage `kcm_ilyong1` 만 · 이름 · 주민번호 안 받음 · 인쇄만(엑셀 받기 없음 — 소장님 9/26)
 * ■ 다른 화면에서 넘겨받기: sessionStorage `kcm_ilyong_from` = { 이름, 일당, 날, 달돈 } (노무비 계산기 «판단 자세히» · 설명 페이지 «이 사례로 계산»)
 */

const 열쇠 = 'kcm_ilyong1'
export const 넘김열쇠 = 'kcm_ilyong_from'
const 두자 = (n) => String(n).padStart(2, '0')
const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
const 숫자만 = (s) => String(s || '').replace(/[^\d]/g, '')
const 이번달 = () => { const t = new Date(); return `${t.getFullYear()}-${두자(t.getMonth() + 1)}` }
const 달날수 = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
const 첫요일 = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1).getDay()
export function 굵게(s) { return String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x)) }

const 빈것 = () => ({ 일당: '', 시작: 이번달(), 달수: 3, 날: [], 달돈: {}, 다른: {}, 옵션: {}, 이름: '' })
function 읽기() {
  try {
    const s = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (s && Array.isArray(s.날)) return { ...빈것(), ...s }
  } catch (e) { /* 막힌 브라우저 */ }
  return 빈것()
}
function 쓰기(s) { try { localStorage.setItem(열쇠, JSON.stringify(s)); return true } catch (e) { return false } }

/** 사례(설명 페이지 · 넘겨받은 출역) → 화면 상태 */
export function 상태로(c) {
  const 날 = [...(c.날 || [])].sort()
  const 시작 = 날.length ? 날[0].slice(0, 7) : 이번달()
  const 끝 = 날.length ? 날[날.length - 1].slice(0, 7) : 시작
  let 달수 = 1
  for (let m = 시작; m < 끝; m = 달더하기(m, 1)) 달수++
  const 일당 = Number(c.일당) || 0
  const 달돈 = {}
  for (const [ym, v] of Object.entries(c.달돈 || {})) {
    const n = 날.filter((d) => d.startsWith(ym)).length
    if (!일당 || Number(v) !== 일당 * n) 달돈[ym] = Number(v) || 0
  }
  /* 마지막 근로 달 다음 달까지 보여 줍니다(상실일이 그 달 1일인 경우가 많아서) */
  return { ...빈것(), 일당: 일당 || '', 시작, 달수: Math.min(12, Math.max(2, 달수 + 1)), 날, 달돈, 다른: c.다른 || {}, 옵션: c.옵션 || {}, 이름: c.이름 || '' }
}

/** 화면 상태 → 판단 입력(그 달 받은 돈: 적은 값이 있으면 그 값, 없으면 일당 × 일수) */
function 입력만들기(st) {
  const 일 = {}
  for (const d of st.날) 일[d.slice(0, 7)] = (일[d.slice(0, 7)] || 0) + 1
  const 달돈 = {}
  for (const ym of Object.keys(일)) {
    const 적음 = st.달돈[ym]
    달돈[ym] = 적음 !== undefined && 적음 !== '' ? Number(적음) || 0 : (Number(st.일당) || 0) * 일[ym]
  }
  const 다른 = {}
  for (const [ym, o] of Object.entries(st.다른 || {})) if (o && (Number(o.일) || Number(o.돈))) 다른[ym] = { 일: Number(o.일) || 0, 돈: Number(o.돈) || 0 }
  return { 날: st.날, 달돈, 다른, 일 }
}

export default function Ilyong4() {
  const [st, setSt] = useState(() => 읽기())
  const [저장됨, set저장됨] = useState(true)
  const [알림, set알림] = useState('')
  const [지움물음, set지움물음] = useState(false)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(넘김열쇠)
      if (raw) {
        sessionStorage.removeItem(넘김열쇠)
        const c = JSON.parse(raw)
        setSt(상태로(c))
        set알림(c.이름 ? `${c.이름} 님 출역을 노무비 계산기에서 가져왔습니다.` : (c.글 || '사례를 채웠습니다.'))
      }
    } catch (e) { /* 넘겨받기 없음 */ }
  }, [])
  useEffect(() => { set저장됨(쓰기(st)) }, [st])
  useEffect(() => {
    const 끝 = () => document.body.classList.remove('iy-print')
    window.addEventListener('afterprint', 끝)
    return () => { window.removeEventListener('afterprint', 끝); 끝() }
  }, [])
  const 바꿈 = (f) => setSt((s) => f(s))
  const 옵션 = st.옵션 || {}
  const 입력 = useMemo(() => 입력만들기(st), [st])
  const R = useMemo(() => 판단({ 날: 입력.날, 달돈: 입력.달돈, 다른: 입력.다른 }, 옵션), [입력, 옵션])
  const 신고 = useMemo(() => 신고할일(R, 옵션), [R, 옵션])
  const 달들 = useMemo(() => { const out = []; for (let i = 0; i < st.달수; i++) out.push(달더하기(st.시작, i)); return out }, [st.시작, st.달수])
  const 일한달들 = Object.keys(입력.일).sort()

  /* 달마다 공제 — 노무비 계산기와 같은 셈(gongje.js) · 연금 · 건강은 위 판단 결과로 */
  const 공제 = useMemo(() => 일한달들.map((ym) => {
    const n = 입력.일[ym], 돈 = 입력.달돈[ym]
    const 하루 = n ? Math.floor(돈 / n) : 0
    const 날돈 = Array.from({ length: n }, (_, i) => 하루 + (i === 0 ? 돈 - 하루 * n : 0))
    const r = 공제셈(ym, 날돈, 옵션.고용65 ? 'E' : '', {}, 달규칙(R, ym))
    return { ym, n, 돈, ...r, 합: r.it + r.lt + r.ei + r.np + r.hi + r.lc }
  }), [일한달들.join(','), 입력, R, 옵션.고용65])   // eslint-disable-line react-hooks/exhaustive-deps

  const 날누름 = (ds) => 바꿈((s) => ({ ...s, 날: s.날.includes(ds) ? s.날.filter((d) => d !== ds) : [...s.날, ds].sort() }))
  const 달채움 = (ym, 켬) => 바꿈((s) => {
    const n = 달날수(ym)
    const 남 = s.날.filter((d) => !d.startsWith(ym))
    if (!켬) return { ...s, 날: 남 }
    const 더 = []
    for (let i = 1; i <= n; i++) { const w = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, i).getDay(); if (w !== 0) 더.push(`${ym}-${두자(i)}`) }
    return { ...s, 날: [...남, ...더].sort() }
  })
  const 사례 = (c) => { setSt(상태로({ ...c.in, 일당: c.in.일당 })); set알림(`예시 «${c.t}» 를 채웠습니다 — ${c.q}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const 인쇄 = () => { document.body.classList.add('iy-print'); setTimeout(() => window.print(), 80) }

  const H = R.건강, P = R.연금
  const 부과달 = (o) => Object.keys(o).sort()
  const 상태칸 = (이름, 구간, 부과, 아님글, 추가) => (
    <div className={'iy-box ' + (구간.length ? 'on' : 'off')}>
      <div className="iy-box-h">{이름} <span className={'iy-chip ' + (구간.length ? 'y' : 'n')}>{구간.length ? '가입 대상' : '대상 아님'}</span></div>
      {구간.length ? (
        <>
          {구간.map((g, i) => <div key={i} className="iy-line"><b>{짧은날(g.취득)} 취득</b> → <b>{짧은날(g.상실)} 상실</b>{g.근거 === '회사 합산' ? <span className="iy-tag">회사 합산</span> : null}</div>)}
          <div className="iy-line">보험료 나오는 달: <b>{부과달(부과).length ? 부과달(부과).map(달글).join(' · ') : '없음'}</b></div>
          {추가}
        </>
      ) : <div className="iy-line muted">{아님글}</div>}
    </div>
  )
  const 첫 = R.묶음[0]
  const 아님H = !R.날들.length ? '일한 날을 누르면 나옵니다.' : 첫 && !첫.한달이상 ? `1개월 미만 — 첫 근로일 ${짧은날(첫.시작)} 부터 1개월 되는 날 ${짧은날(첫.E)} 까지 일하지 않았습니다.` : `첫 근로일부터 1개월(Ⓐ) ${첫 ? 첫.A일 : 0}일 · 그 뒤 달마다 8일 미만입니다.`
  const 아님P = 옵션.연금제외 ? '나이 등으로 뺐습니다.' : !R.날들.length ? '일한 날을 누르면 나옵니다.' : 첫 && !첫.한달이상 ? '1개월 미만입니다.' : '달마다 8일 · 220만원 미만입니다.'
  const 합계 = 공제.reduce((s, r) => ({ 돈: s.돈 + r.돈, 합: s.합 + r.합, it: s.it + r.it, lt: s.lt + r.lt, ei: s.ei + r.ei, np: s.np + r.np, hi: s.hi + r.hi, lc: s.lc + r.lc }), { 돈: 0, 합: 0, it: 0, lt: 0, ei: 0, np: 0, hi: 0, lc: 0 })

  return (
    <div className="wrap iy">
      <div className="card iy-in">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🛡 일용직 4대보험 가입 판단기</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          일한 날만 누르면 <b>국민연금 · 건강보험 가입 대상인지</b>, <b>취득일 · 상실일</b>, <b>보험료가 나오는 달</b>, 달마다 떼는 공제와
          <b> 신고 기한</b>까지 나옵니다. 건설 일용근로자 기준이고, 공단 실무안내의 규칙과 사례를 그대로 옮겼습니다 — <b>왜 그렇게 나왔는지 한 줄씩</b> 보여 드립니다.
        </p>
        <div className="nm-badges">
          <span>회원가입 없음 · 무료</span>
          <span>💾 이 브라우저에만 저장 {저장됨 ? '' : <b className="nm-warn">— 지금 저장이 막혀 있습니다</b>}</span>
          <span>✅ 공단 실무안내 사례 28가지와 같게 나옴</span>
        </div>
        <div className="iy-ex">
          <span className="muted">예시</span>
          {G.cases.map((c) => <button key={c.id} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 사례(c)}>{c.t}</button>)}
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Link className="btn ghost sm" style={{ width: 'auto' }} to="/tools/ilyong-guide">📘 가입 기준 자세히 (설명)</Link>
          <Link className="btn ghost sm" style={{ width: 'auto' }} to="/tools/nomubi">👷 여러 명 · 지급명세서는 노무비 계산기</Link>
          {!지움물음 && st.날.length > 0 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(true)}>처음부터</button>}
          {지움물음 && <span className="nm-ask">적은 것을 지웁니다.
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setSt({ ...빈것(), 시작: st.시작 }); set지움물음(false); set알림('') }}>지우기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(false)}>그대로</button></span>}
        </div>
        {알림 && <div className="note sm" style={{ marginTop: 8 }} role="status">{알림}</div>}
      </div>

      <div className="card iy-in">
        <div className="detail-h" style={{ margin: 0 }}>📅 일한 날 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 날짜를 누르면 일한 날(반나절도 하루) · 다시 누르면 지움</span></div>
        <div className="iy-top">
          <label>일당(원)<input className="inp" inputMode="numeric" value={st.일당 ? 원(st.일당) : ''} onChange={(e) => 바꿈((s) => ({ ...s, 일당: 숫자만(e.target.value) }))} placeholder="예: 200,000" /></label>
          <div className="iy-nav">
            <span className="muted">달</span>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((s) => ({ ...s, 시작: 달더하기(s.시작, -1) }))} aria-label="앞 달 보기">◀</button>
            <b>{달글(st.시작)}{st.시작.slice(0, 4) !== String(new Date().getFullYear()) ? ` (${st.시작.slice(0, 4)})` : ''} 부터 {st.달수}달</b>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((s) => ({ ...s, 시작: 달더하기(s.시작, 1) }))} aria-label="뒤 달 보기">▶</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={st.달수 <= 1} onClick={() => 바꿈((s) => ({ ...s, 달수: s.달수 - 1 }))}>－ 달</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={st.달수 >= 12} onClick={() => 바꿈((s) => ({ ...s, 달수: s.달수 + 1 }))}>＋ 달</button>
          </div>
        </div>
        <div className="iy-cals">
          {달들.map((ym) => {
            const n = 입력.일[ym] || 0
            const 비움 = 첫요일(ym)
            const 수 = 달날수(ym)
            return (
              <div key={ym} className="iy-cal">
                <div className="iy-cal-h"><b>{ym.slice(0, 4)}. {달글(ym)}</b> <span className={'iy-n ' + (n >= 8 ? 'y' : '')}>{n}일</span></div>
                <div className="iy-grid" role="group" aria-label={`${달글(ym)} 일한 날`}>
                  {'일월화수목금토'.split('').map((w) => <span key={w} className={'iy-w ' + (w === '일' ? 'sun' : w === '토' ? 'sat' : '')}>{w}</span>)}
                  {Array.from({ length: 비움 }, (_, i) => <span key={'b' + i} />)}
                  {Array.from({ length: 수 }, (_, i) => {
                    const ds = `${ym}-${두자(i + 1)}`
                    const on = st.날.includes(ds)
                    const 기준 = R.묶음.some((b) => b.E === ds)
                    return <button key={ds} type="button" className={'iy-d' + (on ? ' on' : '') + (기준 ? ' e' : '')} aria-pressed={on}
                      title={기준 ? '첫 근로일부터 1개월 되는 날' : ''} onClick={() => 날누름(ds)}>{i + 1}</button>
                  })}
                </div>
                <div className="iy-cal-f">
                  <label>받은 돈<input className="inp" inputMode="numeric" value={st.달돈[ym] !== undefined && st.달돈[ym] !== '' ? 원(st.달돈[ym]) : ''}
                    placeholder={n ? 원((Number(st.일당) || 0) * n) : '—'} aria-label={`${달글(ym)} 받은 돈`}
                    onChange={(e) => { const v = 숫자만(e.target.value); 바꿈((s) => { const 달돈 = { ...s.달돈 }; if (v === '') delete 달돈[ym]; else 달돈[ym] = Number(v); return { ...s, 달돈 } }) }} /></label>
                  <span className="iy-cal-b">
                    <button type="button" className="tp-x" onClick={() => 달채움(ym, true)}>일요일 빼고 모두</button>
                    <button type="button" className="tp-x" onClick={() => 달채움(ym, false)}>지움</button>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>«받은 돈» 을 비워 두면 일당 × 일한 날로 셉니다. 노란 테두리 날은 첫 근로일부터 «1개월 되는 날» 입니다.</div>
        <details className="iy-more">
          <summary>같은 회사 다른 현장에서도 일했으면 (국민연금 합산)</summary>
          <div className="muted" style={{ fontSize: 12.5, margin: '6px 0' }}>2025년 7월부터 국민연금은 이 현장에서 8일이 안 되면 같은 회사(건설사업장) 근로를 합쳐 봅니다. 건강보험은 이 현장만 봅니다.</div>
          <div className="iy-other">
            {달들.map((ym) => {
              const o = (st.다른 || {})[ym] || {}
              const 고침 = (k, v) => 바꿈((s) => ({ ...s, 다른: { ...(s.다른 || {}), [ym]: { ...((s.다른 || {})[ym] || {}), [k]: v === '' ? '' : Number(v) } } }))
              return (
                <div key={ym} className="iy-other-r"><b>{달글(ym)}</b>
                  <label>일수<input className="inp" inputMode="numeric" value={o.일 || ''} onChange={(e) => 고침('일', 숫자만(e.target.value))} placeholder="0" /></label>
                  <label>받은 돈<input className="inp" inputMode="numeric" value={o.돈 ? 원(o.돈) : ''} onChange={(e) => 고침('돈', 숫자만(e.target.value))} placeholder="0" /></label>
                </div>
              )
            })}
          </div>
        </details>
        <div className="iy-opts">
          {[['계약', '근로계약서가 1개월 이상 · 월 8일 이상으로 되어 있음 (건강보험은 실제 일한 날과 관계없이 가입)'],
            ['연금취득달', '국민연금 — 취득한 달 보험료도 내기 (가입자가 원할 때)'],
            ['연금제외', '국민연금 대상 아님 — 만 60세 이상 · 18세 미만 등'],
            ['고용65', '65세 이후 새로 고용 — 고용보험 근로자 몫(실업급여) 없음']].map(([k, 글]) => (
            <label key={k} className="iy-opt"><input type="checkbox" checked={!!옵션[k]} onChange={(e) => 바꿈((s) => ({ ...s, 옵션: { ...(s.옵션 || {}), [k]: e.target.checked } }))} /> {글}</label>
          ))}
        </div>
      </div>

      <div className="card iy-out">
        <div className="btn-row no-print" style={{ justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <div className="detail-h" style={{ margin: 0 }}>✅ 판단 결과{st.이름 ? ` — ${st.이름}` : ''}</div>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄} disabled={!R.날들.length}>🖨 결과 인쇄 (A4)</button>
        </div>
        <div className="iy-print-h">일용직 4대보험 가입 판단{st.이름 ? ` — ${st.이름}` : ''} · {R.날들.length ? `${짧은날(R.날들[0])} ~ ${짧은날(R.날들[R.날들.length - 1])} · ${R.날들.length}일` : ''}</div>
        <div className="iy-boxes">
          {상태칸('국민연금', P.구간, P.부과, 아님P)}
          {상태칸('건강보험 · 장기요양', H.구간, H.부과, 아님H)}
          <div className={'iy-box ' + (일한달들.length ? 'on' : 'off')}>
            <div className="iy-box-h">고용보험 <span className={'iy-chip ' + (일한달들.length ? 'y' : 'n')}>{일한달들.length ? '일한 달마다' : '—'}</span></div>
            <div className="iy-line">근로내용 확인신고: <b>{일한달들.length ? 일한달들.map(달글).join(' · ') : '없음'}</b></div>
            <div className="iy-line muted">{옵션.고용65 ? '65세 이후 새로 고용 — 근로자 몫 없음' : '근로자 0.9% (2026)'}</div>
          </div>
          <div className="iy-box off">
            <div className="iy-box-h">산재보험 <span className="iy-chip n">사업주 부담</span></div>
            <div className="iy-line muted">근로자에게서 떼지 않습니다. 근로내용 확인신고를 같이 냅니다.</div>
          </div>
        </div>

        {R.날들.length > 0 && (
          <>
            <div className="tp-bill-sub">달마다 한눈에</div>
            <div className="tp-scroll">
              <table className="tbl iy-band">
                <thead><tr><th>달</th>{R.달들.map((ym) => <th key={ym}>{달글(ym)}</th>)}</tr></thead>
                <tbody>
                  <tr><td className="nw">일한 날</td>{R.달들.map((ym) => <td key={ym} className="r">{입력.일[ym] || 0}일</td>)}</tr>
                  <tr><td className="nw">받은 돈</td>{R.달들.map((ym) => <td key={ym} className="r">{입력.달돈[ym] ? 원(입력.달돈[ym]) : '—'}</td>)}</tr>
                  {[['국민연금', P], ['건강보험', H]].map(([이름, X]) => (
                    <tr key={이름}><td className="nw">{이름}</td>{R.달들.map((ym) => {
                      const 가입 = X.구간.some((g) => 달(g.취득) <= ym && ym <= 달(전날(g.상실)))
                      return <td key={ym} className={'c ' + (X.부과[ym] ? 'iy-pay' : 가입 ? 'iy-in2' : '')}>{X.부과[ym] ? '보험료' : 가입 ? '가입' : (입력.일[ym] ? '—' : '')}</td>
                    })}</tr>
                  ))}
                  <tr><td className="nw">고용보험</td>{R.달들.map((ym) => <td key={ym} className={'c ' + (입력.일[ym] ? 'iy-pay' : '')}>{입력.일[ym] ? '신고 · 공제' : ''}</td>)}</tr>
                </tbody>
              </table>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>«가입» 은 자격은 있지만 그 달 보험료는 없는 달(취득한 달 등), «보험료» 는 노무비에서 떼는 달입니다.</div>

            <div className="tp-bill-sub">달마다 근로자 공제 (2026 요율 · 10원 미만 버림)</div>
            <div className="tp-scroll">
              <table className="tbl iy-ded">
                <thead><tr><th>달</th><th>일한 날</th><th>받은 돈</th><th>소득세</th><th>지방소득세</th><th>고용</th><th>국민연금</th><th>건강</th><th>장기요양</th><th>공제 합</th><th>실지급</th></tr></thead>
                <tbody>
                  {공제.map((r) => (
                    <tr key={r.ym}>
                      <td className="nw">{달글(r.ym)}</td><td className="r">{r.n}</td><td className="r">{원(r.돈)}</td>
                      <td className="r">{원(r.it)}</td><td className="r">{원(r.lt)}</td><td className="r">{원(r.ei)}</td>
                      <td className="r">{원(r.np)}</td><td className="r">{원(r.hi)}</td><td className="r">{원(r.lc)}</td>
                      <td className="r"><b>{원(r.합)}</b></td><td className="r"><b>{원(r.돈 - r.합)}</b></td>
                    </tr>
                  ))}
                  <tr className="sum"><td>합계</td><td className="r">{R.날들.length}</td><td className="r">{원(합계.돈)}</td><td className="r">{원(합계.it)}</td><td className="r">{원(합계.lt)}</td>
                    <td className="r">{원(합계.ei)}</td><td className="r">{원(합계.np)}</td><td className="r">{원(합계.hi)}</td><td className="r">{원(합계.lc)}</td><td className="r"><b>{원(합계.합)}</b></td><td className="r"><b>{원(합계.돈 - 합계.합)}</b></td></tr>
                </tbody>
              </table>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>소득세는 일용근로소득(일급 15만원 넘는 몫 × 2.7%, 한 달 합 1천원 미만은 안 뗌)으로 셉니다. 건설일용 보험료는 그 달 실제 보수로 매기므로 마지막에는 공단 고지액과 맞추십시오.</div>

            <div className="iy-why">
              <div>
                <div className="tp-bill-sub">건강보험은 이렇게 셌습니다</div>
                <ol>{H.과정.map((x, i) => <li key={i}>{x}</li>)}</ol>
                {첫 && <div className="muted" style={{ fontSize: 12 }}>첫 근로일 {짧은날(첫.시작)} → 1개월 되는 날 {짧은날(한달되는날(첫.시작))} (Ⓐ 기간)</div>}
              </div>
              <div>
                <div className="tp-bill-sub">국민연금은 이렇게 셌습니다</div>
                <ol>{P.과정.map((x, i) => <li key={i}>{x}</li>)}</ol>
              </div>
            </div>

            <div className="tp-bill-sub">신고할 일</div>
            <div className="tp-scroll">
              <table className="tbl iy-todo">
                <thead><tr><th>보험</th><th>무엇을</th><th>언제까지</th><th>근거</th></tr></thead>
                <tbody>{신고.map((x, i) => <tr key={i}><td className="nw">{x.보험}</td><td>{x.무엇}</td><td>{x.기한}</td><td className="muted">{x.근거}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
        {!R.날들.length && <div className="note sm" style={{ marginTop: 8 }}>위 달력에서 일한 날을 누르거나, 예시 단추를 눌러 보십시오.</div>}
      </div>

      <div className="card iy-in">
        <div className="detail-h" style={{ margin: 0 }}>📌 알아 두실 것</div>
        <ul className="flist" style={{ marginTop: 6 }}>
          <li><b>국민연금</b>은 달력 달(일 시작한 달은 시작일~말일)로, <b>건강보험</b>은 첫 근로일부터 1개월 되는 날까지로 셉니다. 그래서 같은 출역이라도 하나만 가입되는 일이 흔합니다.</li>
          <li><b>보험료는 취득한 달의 다음 달부터</b> 나옵니다(1일 취득이면 그 달부터). 국민건강보험법 제69조② · 국민연금법 제17조①.</li>
          <li>이 현장에서 일한 날로 셉니다. 국민연금은 같은 회사 다른 현장을 위 «다른 현장» 칸에 적으면 합쳐 봅니다.</li>
          <li>여러 사람의 한 달 지급명세서는 <Link to="/tools/nomubi">일용 노무비 계산기</Link>가 같은 판단으로 공제합니다. 서식은 <Link to="/forms/gy-ilyong">일용근로계약서</Link> · <Link to="/forms/nomubi">노무비 지급확인서</Link>.</li>
          <li>판단은 공단이 최종으로 합니다. 기준과 사례는 <Link to="/tools/ilyong-guide">가입 기준 설명</Link>에 원문 그대로 정리했습니다.</li>
        </ul>
      </div>
    </div>
  )
}

/* ── 📘 설명 페이지 ─────────────────────────────────────────── */
export function IlyongGuide() {
  const navigate = useNavigate()
  const 열기 = (c) => {
    try { sessionStorage.setItem(넘김열쇠, JSON.stringify({ ...c.in, 글: `예시 «${c.t}» 를 채웠습니다 — ${c.q}` })) } catch (e) { /* 저장 막힘 — 그냥 이동 */ }
    navigate('/tools/ilyong-boheom')
  }
  return (
    <div className="wrap iy iyg">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📘 {G.title}</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>{굵게(G.lead)}</p>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Link className="btn sm" style={{ width: 'auto' }} to="/tools/ilyong-boheom">🛡 가입 판단기로 바로 계산</Link>
          <Link className="btn ghost sm" style={{ width: 'auto' }} to="/tools/nomubi">👷 일용 노무비 계산기</Link>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{G.updated} 기준 · 공단 실무안내 · 법령 원문 확인</div>
      </div>
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>한눈에 — 보험마다 다른 점</div>
        <div className="tp-scroll">
          <table className="tbl iy-tbl">
            <thead><tr>{G.table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{G.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} className="nw">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
          </table>
        </div>
      </div>
      {G.secs.map((s, i) => (
        <div className="card" key={i}>
          <div className="detail-h" style={{ margin: 0 }}>{s.h}</div>
          {s.p.map((x, j) => <p className="tl-p" key={j}>{굵게(x)}</p>)}
        </div>
      ))}
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>사례로 보기 — 누르면 판단기에 그대로 채워집니다</div>
        {G.cases.map((c) => (
          <div className="iy-case" key={c.id}>
            <div className="iy-case-t">{c.t}</div>
            <div className="iy-case-q">{c.q}</div>
            <ul className="flist">{c.a.map((x, j) => <li key={j}>{굵게(x)}</li>)}</ul>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 열기(c)}>이 사례로 계산해 보기 →</button>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>자주 묻는 것</div>
        {G.faq.map(([q, a], i) => (
          <details className="iy-faq" key={i}><summary>{q}</summary><p className="tl-p">{a}</p></details>
        ))}
      </div>
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>근거</div>
        <ul className="flist">{G.refs.map(([a, b], i) => <li key={i}>{a} <span className="muted">— {b}</span></li>)}</ul>
        <div className="muted" style={{ fontSize: 12 }}>보험 가입 판단은 공단이 최종으로 합니다. 근로계약 · 다른 현장 근로 · 나이처럼 출역만으로 알 수 없는 것이 있으면 공단에 확인하십시오.</div>
      </div>
    </div>
  )
}
