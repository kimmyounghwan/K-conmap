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
import { getResults } from './lib/data.js'
import { 세기 } from './lib/받은수.jsx'
import { won } from './lib/fmt.js'

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
  useEffect(() => {
    if (!성 || !no) return
    넣은결과남기기(no, 성)
    if (셌음.current !== String(no)) { 셌음.current = String(no); 세기('|내금액|봄') }
  }, [성, no])
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
          {r ? <내결과 성={성} 금액={적은.a} />
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
  /* 아직 셈 안 된 줄 — 최근 7일 개찰 색인에 있으면 거기서 셈(한 번만 받음) */
  const 안본 = 모음.줄.filter((x) => !x.o).map((x) => x.no)
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
        if (x) 넣은결과남기기(no, 내성적(r, x.a, r.amts))
      }
    }).catch(() => { /* 못 받으면 그대로 */ })
    return () => { 살아 = false }
  }, [안본.join('|')])   // eslint-disable-line react-hooks/exhaustive-deps
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
      {편다 && (
        <ul className="ngm-list">
          {줄.slice(0, 30).map((x) => (
            <li key={x.no}>
              <a href={`/notice/${encodeURIComponent(x.no)}`}>{x.n || x.no}</a>
              <span className="muted"> · {won(x.a)} · </span><b>{말(x.o)}</b>
              {x.o && typeof x.o.d === 'number' && x.o.s !== '실격' ? <span className="muted"> ({x.o.d < 0 ? '−' : '+'}{won(Math.abs(x.o.d))})</span> : null}
            </li>
          ))}
        </ul>
      )}
      <div className="ngm-note muted">이 기기에만 적혀 있습니다(서버로 가지 않음). 개찰 뒤 카드를 펼치거나 최근 7일 개찰이면 저절로 셉니다.</div>
    </div>
  )
}
