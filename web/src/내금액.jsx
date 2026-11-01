/**
 * 📝 넣은 금액 칸 — 바로투찰(넣기 전) · 1순위 카드(개찰 뒤) · 1순위 화면 위 «모아 보기» (G338 · 2026-10-20)
 *
 * 소장님 「바로입찰 업그레이드」 ④ — 담은 공고에 «넣은 금액» 을 적어 두면 개찰 뒤 몇 위였는지 · 1순위와 얼마 차이인지 · 누적 성적.
 * ■ 적는 것은 이 기기에만(lib/넣은금액.js) · 서버로 가지 않습니다.
 * ■ 바로투찰에서 적으면 ⭐ 담기도 같이 합니다 — 1순위가 나오면 이미 있는 담은 공고 알림(G97)이 갑니다.
 * ■ 숨은 누적: |내금액|적음 · |내금액|고침 · |내금액|지움 · |내금액|봄 · |내금액|모아봄 · |내금액|모아펼침
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 넣은of, 넣은적기, 넣은지우기, 넣은결과남기기, 내성적, 넣은모음, 넣은금액이름 } from './lib/넣은금액.js'
import { getResults, getOverview } from './lib/data.js'
import { 세기 } from './lib/받은수.jsx'
import { won } from './lib/fmt.js'
import { 복기, 성향 } from './lib/개찰복기.js'   /* 🧭 G499 개찰 복기 */
import { 기관사정률받기 } from './lib/기관사정률.js'
import { P50_FALLBACK } from './lib/bidmath.js'
import { Link } from 'react-router-dom'
import { 한벌주소 } from './lib/낙찰한벌.js'   /* 🏁 G499 낙찰 서류 한 벌 */

/* 전국 사정률 가운데값 — 바로투찰 분위와 같은 바탕(ov.sjq.p50) */
function useP50() {
  const [p50, setP50] = useState(P50_FALLBACK)
  useEffect(() => { let 살 = true; getOverview().then((ov) => { const v = ov?.sjq?.p50; if (살 && v) setP50(Number(v)) }).catch(() => {}); return () => { 살 = false } }, [])
  return p50
}

/** 🧭 G499 복기 칸 — 소장님 바로투찰 아이디어 ③ «왜 떨어졌나 · 다음엔» (숫자로 말할 수 있는 것만 · lib/개찰복기.js) */
export function 복기칸({ r, 성, 금액, p50 }) {
  const [기관, set기관] = useState(null)
  const [편다, set편다] = useState(true)
  useEffect(() => {
    let 살 = true
    if (r && r.inst) 기관사정률받기(r.inst).then((v) => { if (살) set기관(v || null) }).catch(() => {})
    return () => { 살 = false }
  }, [r && r.inst])   // eslint-disable-line react-hooks/exhaustive-deps
  const b = useMemo(() => { try { return 복기(성, r, 금액, p50, 기관) } catch (e) { return null } }, [성, r, 금액, p50, 기관])
  const 셌음 = useRef(false)
  useEffect(() => { if (b && !셌음.current) { 셌음.current = true; 세기('|내금액|복기') } }, [b])
  if (!b) return null
  const 머리 = { 사정률: '🎲', 자리: '📍', 참가: '👥', 배움: '💡' }
  return (
    <div className="ngm-bk">
      <button type="button" className="ngm-bk-h" onClick={() => set편다(!편다)} aria-expanded={편다}>🧭 복기 — 왜 이 자리였나 {편다 ? '▴' : '▾'}</button>
      {편다 && (
        <>
          <ul className="ngm-bk-l">{b.줄들.map((x) => <li key={x.k}><span className="ngm-bk-i">{머리[x.k]}</span>{x.글}</li>)}</ul>
          <div className="ngm-bk-bar" role="img" aria-label={`0~100분위 — 실격 · 1순위 자리 ${Math.round(b.자리.실격선)}~${Math.round(b.자리.일순끝)}분위 · 내 자리 ${Math.round(b.내분위)}분위`}>
            <i className="ngm-bk-dq" style={{ width: `${b.자리.실격선}%` }} />
            <i className="ngm-bk-win" style={{ left: `${b.자리.실격선}%`, width: `${Math.max(0.8, b.자리.일순끝 - b.자리.실격선)}%` }} />
            <b className="ngm-bk-me" style={{ left: `${Math.min(99, Math.max(1, b.내분위))}%` }} title={`내 자리 ${Math.round(b.내분위)}분위`} />
          </div>
          <div className="ngm-bk-key muted"><span><i className="k dq" />실격 자리</span><span><i className="k win" />1순위 자리</span><span><i className="k me" />내 금액</span><span>0 ← 분위 → 100</span></div>
        </>
      )}
    </div>
  )
}

const 쉼표 = (v) => { const n = Number(String(v ?? '').replace(/[^0-9]/g, '')) || 0; return n > 0 ? n.toLocaleString('ko-KR') : '' }
const 숫자 = (v) => Number(String(v ?? '').replace(/[^0-9]/g, '')) || 0

/** 이 기기의 넣은 금액이 바뀌면 다시 읽음 */
function use넣은(no) {
  const [v, setV] = useState(() => 넣은of(no))
  useEffect(() => {
    setV(넣은of(no))
    const 다시 = () => setV(넣은of(no))
    window.addEventListener(넣은금액이름, 다시)
    window.addEventListener('storage', 다시)
    return () => { window.removeEventListener(넣은금액이름, 다시); window.removeEventListener('storage', 다시) }
  }, [no])
  return v
}

/** 결과 한 덩이 — 성(내성적 결과) */
export function 내결과({ 성, 금액 }) {
  if (!성) return null
  if (성.상태 === '모름') return <div className="ngm-res ngm-moreum">셀 수 없습니다 — {성.왜}</div>
  const 퍼p = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}%p`
  const 머리 = 성.상태 === '일순' ? <>🏆 이 금액이면 <b>1순위</b>였습니다 — 낙찰가보다 <b>{won(-성.차이)}</b> 낮음</>
    : 성.상태 === '같음' ? <>🤝 <b>1순위와 같은 금액</b>입니다 — 추첨으로 정해졌을 자리</>
    : 성.상태 === '통과' ? <>✅ 낙찰하한 통과 · <b>{성.순위말}</b> — 1순위보다 <b>{won(성.차이)}</b> 높음</>
    : <>⛔ <b>낙찰하한 아래(실격)</b> — 하한보다 <b>{won(성.모자람)}</b> 모자람</>
  return (
    <div className={'ngm-res ngm-' + 성.상태}>
      <div className="ngm-h">{머리}</div>
      <div className="ngm-d">
        내 금액 {won(금액)}{성.상태 !== '실격' && 성.상태 !== '같음' && Math.abs(성.차이율) >= 0.0005 ? <> · 투찰률로 {퍼p(성.차이율)}</> : null}
        {' '}· 예정가격 {won(성.예정)}{성.사정률 ? <> · 사정률 {성.사정률.toFixed(3)}%</> : null}
        {' '}· 낙찰하한 {성.하한모름 ? '알 수 없음(공고에 하한율이 없고 규모로 짐작한 값이 1순위보다 높음)' : <>{won(성.하한)}{성.하한추정 ? ' (하한율은 규모로 추정)' : ''}</>}{성.A모름 && !성.하한모름 ? ' · A값이 안 실려 와 0 으로 셈' : ''}
        {성.내버팀 ? <> · 내 금액은 사정률 {성.내버팀.toFixed(3)}%까지 하한 위</> : null}
      </div>
    </div>
  )
}

/**
 * 한 공고 칸 — props: no · 이름 · 금액(넣기 전 기본값 · 바로투찰 금액) · r(개찰 줄 · 있으면 결과) · corps(낮게 쓴 곳) · 적으면(담기 등)
 *   개찰 뒤 화면(r 있음)에서 적어 둔 금액이 없으면 «넣은 금액을 적으면 몇 위였는지» 칸을 보입니다.
 */
export default function 내금액({ no, 이름 = '', 금액 = 0, r = null, corps = null, 적으면 }) {
  const 적은 = use넣은(no)
  const [연다, set연다] = useState(false)
  const [칸, set칸] = useState('')
  const 셌음 = useRef('')
  const 성 = useMemo(() => (r && 적은 ? 내성적(r, 적은.a, corps) : null), [r, 적은, corps])
  const p50 = useP50()
  useEffect(() => {
    if (!성 || !no) return
    let 더 = null
    try { const b = 복기(성, r, 적은 && 적은.a, p50); if (b) 더 = b.요약 } catch (e) { /* 복기 없이 */ }
    넣은결과남기기(no, 성, 더)
    if (셌음.current !== String(no)) { 셌음.current = String(no); 세기('|내금액|봄') }
  }, [성, no, p50])   // eslint-disable-line react-hooks/exhaustive-deps
  if (!no) return null
  const 열기 = () => { set칸(쉼표(적은 ? 적은.a : 금액)); set연다(true) }
  const 적기 = () => {
    const a = 숫자(칸)
    if (!(a > 0)) return
    넣은적기(no, a, 이름)
    세기(적은 ? '|내금액|고침' : '|내금액|적음')
    set연다(false)
    if (적으면) 적으면(a)
  }
  const 지우기 = () => { 넣은지우기(no); 세기('|내금액|지움'); set연다(false) }
  const 입력 = (
    <div className="ngm-form">
      <input inputMode="numeric" value={칸} onChange={(e) => set칸(쉼표(e.target.value))} placeholder="나라장터에 넣은 금액(원)" aria-label="넣은 금액(원)"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); 적기() } }} />
      <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={적기} disabled={!(숫자(칸) > 0)}>{r ? '보기' : '적어 두기'}</button>
      <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set연다(false)}>닫기</button>
    </div>
  )
  return (
    <div className={'ngm' + (r ? ' ngm-after' : '')}>
      {적은 && !연다 ? (
        <>
          <div className="ngm-top">
            <span>📝 넣은 금액 <b>{won(적은.a)}</b> <small className="muted">({String(적은.t || '').slice(5)} 적음 · 이 기기에만)</small></span>
            <span className="ngm-acts">
              <button type="button" className="linkbtn" onClick={열기}>고치기</button>
              <button type="button" className="linkbtn" onClick={지우기}>지우기</button>
            </span>
          </div>
          {r ? <><내결과 성={성} 금액={적은.a} /><복기칸 r={r} 성={성} 금액={적은.a} p50={p50} />
              {성 && (성.상태 === '일순' || 성.상태 === '같음') && (
                <Link className="btn sm ngm-hanbeol" to={한벌주소({ no, 이름: 이름 || r.name, 발주: r.inst, 금액: 적은.a })} onClick={() => 세기('|내금액|한벌')}>🏁 낙찰 서류 한 벌 열기 — 공사명 · 발주 · 계약금액이 채워진 채로</Link>
              )}</>
            : <div className="ngm-note muted">개찰이 끝나면 «1순위» 탭에서 이 공고를 펼치면 몇 위였는지 · 1순위와 얼마 차이인지 바로 보입니다(⭐ 담아 두면 1순위가 나올 때 알림).</div>}
        </>
      ) : 연다 ? 입력 : (
        <button type="button" className="btn line sm ngm-open" style={{ width: 'auto' }} onClick={열기}>
          {r ? '📝 내가 넣은 금액이면 몇 위였을까 — 금액 적기' : '📝 넣은 금액 적어 두기 — 개찰 뒤 몇 위였는지 보기'}</button>
      )}
    </div>
  )
}

/* 개찰 결과 색인(최근 7일 · bidresult.json) 한 줄 → 객체 */
const 줄로 = (f, a) => { const o = {}; for (let i = 0; i < f.length; i++) o[f[i]] = a[i]; return o }

/** 1순위 화면 위 — 적어 둔 금액 모아 보기(적은 것이 있을 때만) */
export function 내금액모음() {
  const [모음, set모음] = useState(넣은모음)
  const [편다, set편다] = useState(false)
  const 셌음 = useRef(false)
  useEffect(() => {
    const 다시 = () => set모음(넣은모음())
    window.addEventListener(넣은금액이름, 다시)
    window.addEventListener('storage', 다시)
    return () => { window.removeEventListener(넣은금액이름, 다시); window.removeEventListener('storage', 다시) }
  }, [])
  /* 아직 셈 안 된 줄 — 최근 7일 개찰 색인에 있으면 거기서 셈(한 번만 받음) · 🧭 G499 복기 요약(분위)이 없는 줄도 */
  const 안본 = 모음.줄.filter((x) => !x.o || (x.o.s !== '모름' && typeof x.o.q !== 'number')).map((x) => x.no)
  const p50 = useP50()
  useEffect(() => {
    if (!안본.length) return
    let 살아 = true
    getResults().then((d) => {
      if (!살아 || !d || !Array.isArray(d.f) || !d.r) return
      for (const no of 안본) {
        const a = d.r[no]
        if (!Array.isArray(a)) continue
        const r = 줄로(d.f, a)
        const x = 넣은of(no)
        if (!x) continue
        const 성 = 내성적(r, x.a, r.amts)
        let 더 = null
        try { const b = 복기(성, r, x.a, p50); if (b) 더 = b.요약 } catch (e) { /* 복기 없이 */ }
        넣은결과남기기(no, 성, 더)
      }
    }).catch(() => { /* 못 받으면 그대로 */ })
    return () => { 살아 = false }
  }, [안본.join('|'), p50])   // eslint-disable-line react-hooks/exhaustive-deps
  const 내성향 = useMemo(() => 성향(모음.줄), [모음])
  useEffect(() => { if (모음.셈.적음 && !셌음.current) { 셌음.current = true; 세기('|내금액|모아봄') } }, [모음.셈.적음])
  const { 셈, 줄 } = 모음
  if (!셈.적음) return null
  const 말 = (o) => !o ? '개찰 전 · 아직 안 셈' : o.s === '모름' ? '❔ 셀 수 없음(하한율 모름)' : o.s === '일순' ? '🏆 1순위' : o.s === '같음' ? '🤝 1순위와 같음'
    : o.s === '실격' ? '⛔ 실격' : `✅ ${o.k2 && o.k2 !== o.k ? `${o.k}~${o.k2}위` : o.k ? `${o.k}위${o.k2 == null ? ' 넘게' : '쯤'}` : '통과'}`
  return (
    <div className="card ngm-sum">
      <div className="ngm-sum-h">
        <span>📝 내가 적어 둔 금액 <b>{셈.적음}건</b> — 개찰 확인 {셈.봄}건: 1순위 <b>{셈.일순}</b> · 하한 통과 <b>{셈.통과}</b> · 실격 <b>{셈.실격}</b>{셈.모름 ? <> · 셀 수 없음 {셈.모름}</> : null}</span>
        <button type="button" className="linkbtn" onClick={() => { set편다(!편다); if (!편다) 세기('|내금액|모아펼침') }}>{편다 ? '접기' : '하나씩 보기'}</button>
      </div>
      {내성향 && (   /* 🧭 G499 성향 — 분위를 아는 3건 이상 */
        <div className="ngm-trend">🧭 <b>내 성향</b> — 분위를 아는 {내성향.n}건 · 평균 <b>{Math.round(내성향.평균)}분위</b> · 실격 {내성향.실격} · 1순위 {내성향.일순} · 밀림 {내성향.밀림}<br /><span className="muted">{내성향.말}</span></div>
      )}
      {편다 && (
        <ul className="ngm-list">
          {줄.slice(0, 30).map((x) => (
            <li key={x.no}>
              <a href={`/notice/${encodeURIComponent(x.no)}`}>{x.n || x.no}</a>
              <span className="muted"> · {won(x.a)} · </span><b>{말(x.o)}</b>{x.o && typeof x.o.q === 'number' ? <span className="muted"> · {Math.round(x.o.q)}분위{typeof x.o.lo === 'number' ? ` (1순위 자리 ${Math.round(x.o.lo)}~${Math.round(x.o.hi)})` : ''}</span> : null}
              {x.o && typeof x.o.d === 'number' && x.o.s !== '실격' ? <span className="muted"> ({x.o.d < 0 ? '−' : '+'}{won(Math.abs(x.o.d))})</span> : null}
            </li>
          ))}
        </ul>
      )}
      <div className="ngm-note muted">이 기기에만 적혀 있습니다(서버로 가지 않음). 개찰 뒤 카드를 펼치거나 최근 7일 개찰이면 저절로 셉니다.</div>
    </div>
  )
}
