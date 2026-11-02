/**
 * 💼 일용직 퇴직금 판단기 — /tools/ilyong-toejikgeum (G515 · 2026-11-02)
 *   소장님: 「판단기 늘리기 부터 만들자. 사이트 확인해서 없는 것만 만들어」 — 넷째(G507 실업급여 · G508 산재 휴업급여 · G509 주휴수당)
 *   셈 lib/toejikgeum.js(퇴직급여법 · 근로기준법 · 판례 · 고용노동부 해석 — 그 파일 머리 참고) · 링크 lib/toejikgeumLink.js · 글 data/toejikgeum_guide.json(미리굽기와 같은 글)
 * ■ 첫 출근일 · 마지막 근무일 · 일당 · 하루 시간 · 한 달에 일한 날 → 받을 수 있나 · 얼마 · 까닭(조문 · 판례).
 * ■ 적은 것은 이 브라우저에만(kcm_toejikgeum) · 결과 링크(?c=) · 이름 · 회사 이름 같은 것은 받지 않음.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 퇴직금판단, 원글, 시간글, 긴날, IRP기준 } from '../lib/toejikgeum.js'
import { 링크만들기, 링크읽기 } from '../lib/toejikgeumLink.js'
import G from '../data/toejikgeum_guide.json'

const 열쇠 = 'kcm_toejikgeum'
const 쓴링크열쇠 = 'kcm_toejikgeum_link'
const 빈것 = () => ({ 처음: '', 끝: '', 일당: '', 시간: '8', 월날: '', 이어짐: true, 빈날: '', 석달날: '', 석달더: '', 오인: true, 공제: false, 포함: false })
function 읽기() {
  try { const o = JSON.parse(localStorage.getItem(열쇠) || 'null'); if (o && typeof o === 'object') return { ...빈것(), ...o } } catch (e) { /* 막힘 */ }
  return 빈것()
}
function 쓰기(st) { try { localStorage.setItem(열쇠, JSON.stringify(st)); return true } catch (e) { return false } }
const 굵게 = (s) => String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
const 숫자 = (v, 길이 = 7) => String(v ?? '').replace(/[^\d]/g, '').slice(0, 길이)
const 소수 = (v, 길이 = 5) => String(v ?? '').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 길이)
const 문자 = (x) => (x === null || x === undefined ? '' : String(x))
const 채움 = (o) => ({ ...빈것(), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v])) })

function 두단추({ 값, 바꿈, 하나, 둘, 이름 }) {
  return (
    <span className="iy-seg" role="group" aria-label={이름}>
      <button type="button" className={값 ? 'on' : ''} aria-pressed={!!값} onClick={() => 바꿈(true)}>{하나}</button>
      <button type="button" className={!값 ? 'on' : ''} aria-pressed={!값} onClick={() => 바꿈(false)}>{둘}</button>
    </span>
  )
}

export default function Toejikgeum() {
  const [st, setSt] = useState(() => 읽기())
  const [알림, set알림] = useState('')
  const [되돌릴, set되돌릴] = useState(null)
  const [링크, set링크] = useState(null)
  const [저장됨, set저장됨] = useState(true)
  const [지움물음, set지움물음] = useState(false)

  useEffect(() => {
    try {
      const c = new URLSearchParams(window.location.search).get('c')
      if (c === null) return
      let 쓴 = ''
      try { 쓴 = sessionStorage.getItem(쓴링크열쇠) || '' } catch (e) { /* 막힘 */ }
      if (쓴 === c) return
      try { sessionStorage.setItem(쓴링크열쇠, c) } catch (e) { /* 막힘 */ }
      const r = 링크읽기(c)
      if (r) {
        const 전 = 읽기()
        if (전.일당 || 전.처음) set되돌릴(전)
        setSt(채움(r))
        set알림('🔗 받은 링크의 날짜 · 일당 · 일한 날로 채웠습니다.')
      } else set알림('🔗 링크를 읽지 못했습니다 — 주소가 잘렸을 수 있습니다. 적어 두신 것은 그대로입니다.')
    } catch (e) { /* 주소 읽기 실패 */ }
  }, [])
  useEffect(() => { set저장됨(쓰기(st)); set링크(null) }, [st])

  const R = useMemo(() => 퇴직금판단(st), [st])
  const 바꿈 = (k, v) => setSt((s) => ({ ...s, [k]: v }))
  const 사례 = (c) => {
    if (st.일당 || st.처음) set되돌릴(st)
    setSt(채움(c.i))
    set알림(`🧪 예시 «${c.t}» 로 채웠습니다.`)
  }
  const 링크보내기 = async () => {
    if (R.빈) return
    const url = `${window.location.origin}/tools/ilyong-toejikgeum?c=${링크만들기(st)}`
    const 글 = R.결론 === 'yes' ? `퇴직금 약 ${원글(R.퇴직금)}원` : R.결론 === 'check' ? '퇴직금 — 계속 일했나 확인 필요' : '퇴직금 없음'
    let 폰 = false
    try { 폰 = window.matchMedia('(pointer: coarse)').matches } catch (e) { /* 모름 */ }
    if (폰 && navigator.share) {
      try { await navigator.share({ title: 'K-건설맵 · 일용직 퇴직금', text: 글, url }); return } catch (e) { if (e && e.name === 'AbortError') return }
    }
    try { await navigator.clipboard.writeText(url); set링크({ url, 복사: true }) } catch (e) { set링크({ url, 복사: false }) }
  }
  const 적음 = !!(st.일당 || st.처음 || st.끝)

  return (
    <div className="wrap sl tjg">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>💼 일용직 퇴직금 판단기</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          첫 출근일 · 마지막 근무일 · 일당 · 한 달에 일한 날만 넣으면 <b>퇴직금을 받을 수 있는지 · 얼마</b>인지 바로 나옵니다. 일용이 계속 일한 것으로 보는지 · 겨울에 쉰 기간 · 퇴직공제와 다른 점 · «일당에 포함» 약정까지 판례 · 조문으로 따집니다.
        </p>
        <div className="iy-small">💾 이 브라우저에만 저장{저장됨 ? '' : <b className="nm-warn"> — 지금 저장이 막혀 있습니다</b>} · 퇴직급여법 · 근로기준법 · 판례 · 고용노동부 해석대로 셈 · 최종 판단은 고용노동관서</div>
        <details className="iy-exd">
          <summary>👀 예시로 해 보기 ({G.cases.length}가지)</summary>
          <div className="iy-ex sl-ex">
            {G.cases.map((c) => <button key={c.id} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 사례(c)} title={c.q}>{c.t}</button>)}
          </div>
        </details>
        <div className="iy-links">
          <a href="#eolma" onClick={() => { const d = document.getElementById('eolma'); if (d) d.open = true }}>📘 셈 자세히</a>
          <Link to="/tools/toejik">🏗 퇴직공제 집계</Link>
          <Link to="/tools/ilyong-silup">🧾 실업급여</Link>
          <Link to="/tools/juhyu">📆 주휴수당</Link>
          {!지움물음 && 적음 && <button type="button" className="tp-x" onClick={() => set지움물음(true)}>처음부터</button>}
          {지움물음 && <span className="nm-ask">적은 것을 지웁니다.
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setSt(빈것()); set지움물음(false); set알림(''); set되돌릴(null) }}>지우기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(false)}>그대로</button></span>}
        </div>
        {알림 && <div className="note sm" style={{ marginTop: 8 }} role="status">{알림}
          {되돌릴 && <> <button type="button" className="tp-x iy-undo" onClick={() => { setSt(되돌릴); set되돌릴(null); set알림('적어 두셨던 것으로 되돌렸습니다.') }}>↩ 내가 적어 둔 것으로 되돌리기</button></>}
        </div>}
      </div>

      <div className="card sl-in">
        <div className="detail-h" style={{ margin: 0 }}>🏗 같은 회사에서 일한 기간</div>
        <div className="sl-grid">
          <label>첫 출근일
            <input className="inp" type="date" value={st.처음} onChange={(e) => 바꿈('처음', e.target.value)} aria-label="첫 출근일" />
            <small>같은 회사(사업주) 일을 처음 한 날</small>
          </label>
          <label>마지막으로 일한 날
            <input className="inp" type="date" value={st.끝} onChange={(e) => 바꿈('끝', e.target.value)} aria-label="마지막으로 일한 날" />
            <small>그다음 날이 퇴직한 날</small>
          </label>
          <label>일당
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.일당 ? 원글(st.일당) : ''} onChange={(e) => 바꿈('일당', 숫자(e.target.value))} placeholder="예: 200,000" aria-label="일당" /><i>원</i></span>
            <small>하루 받는 돈(세금 떼기 전)</small>
          </label>
          <label>하루 일하는 시간
            <span className="sl-unit"><input className="inp" inputMode="decimal" value={st.시간} onChange={(e) => 바꿈('시간', 소수(e.target.value, 4))} placeholder="예: 8" aria-label="하루 일하는 시간" /><i>시간</i></span>
            <small>점심 · 쉬는 시간 뺌(07~17시 · 점심 1시간 → 9)</small>
          </label>
          <label>한 달에 보통 일한 날
            <span className="sl-unit"><input className="inp" inputMode="decimal" value={st.월날} onChange={(e) => 바꿈('월날', 소수(e.target.value, 4))} placeholder="예: 20" aria-label="한 달에 보통 일한 날" /><i>일</i></span>
            <small>1주 15시간 셈 · 3개월 일한 날을 안 넣으면 × 3</small>
          </label>
        </div>
        <div className="sl-row">
          <span className="sl-k">일한 모양</span>
          <두단추 값={st.이어짐 !== false} 바꿈={(v) => 바꿈('이어짐', v)} 하나="같은 회사가 계속 불러 일함" 둘="그때그때 · 띄엄띄엄" 이름="일한 모양" />
        </div>
        <details className="sl-more">
          <summary>더 — 겨울에 쉰 기간 · 3개월 일한 날 · 사업장 · 퇴직공제 · 일당에 포함</summary>
          <div className="sl-row">
            <label className="sl-inl">계약 없이 쉰 긴 기간
              <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.빈날} onChange={(e) => 바꿈('빈날', 숫자(e.target.value, 5))} placeholder="0" aria-label="계약 없이 쉰 긴 기간" style={{ width: 80 }} /><i>일</i></span></label>
            <small>겨울 · 장마철처럼 계약 없이 쉬다 다시 부른 기간 — 계속 일한 기간에서 뺌(근기 68207-404)</small>
          </div>
          <div className="sl-row">
            <label className="sl-inl">그만두기 전 3개월 동안 일한 날
              <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.석달날} onChange={(e) => 바꿈('석달날', 숫자(e.target.value, 3))} placeholder={st.월날 ? String(Math.round(Number(st.월날) * 3)) : '예: 60'} aria-label="그만두기 전 3개월 동안 일한 날" style={{ width: 80 }} /><i>일</i></span></label>
            <label className="sl-inl">그 3개월에 일당 말고 받은 돈
              <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.석달더 ? 원글(st.석달더) : ''} onChange={(e) => 바꿈('석달더', 숫자(e.target.value, 10))} placeholder="0" aria-label="그 3개월에 일당 말고 받은 돈" style={{ width: 120 }} /><i>원</i></span></label>
          </div>
          <div className="sl-row">
            <span className="sl-k">사업장</span>
            <두단추 값={st.오인 !== false} 바꿈={(v) => 바꿈('오인', v)} 하나="상시 5명 이상" 둘="4명 이하" 이름="사업장 규모" />
          </div>
          <div className="sl-row">
            <label className="sl-chk"><input type="checkbox" checked={!!st.공제} onChange={(e) => 바꿈('공제', e.target.checked)} /> 건설근로자 퇴직공제 현장이었음</label>
          </div>
          <div className="sl-row">
            <label className="sl-chk"><input type="checkbox" checked={!!st.포함} onChange={(e) => 바꿈('포함', e.target.checked)} /> «일당에 퇴직금이 포함돼 있다» 고 들음 · 계약서에 적힘</label>
          </div>
        </details>
      </div>

      {적음 && <div className="card sl-out" id="tj-result">
        {R.빈 ? <div className="sl-res need" role="status">📝 {R.까닭}</div> : <>
          <div className={'sl-res ' + (R.결론 === 'yes' ? 'yes' : R.결론 === 'check' ? 'check' : 'no')} role="status">{R.큰글}</div>
          <div className="sl-facts">
            <div><span>📅 계속 일한 기간</span><b>{원글(R.계속)}일{R.빈날 ? ` (${원글(R.재직)}일 − 쉰 ${원글(R.빈날)}일)` : ''}</b>
              <small>{긴날(st.처음)} ~ {긴날(st.끝)} · 1년 = {원글(R.일년)}일 · 퇴직한 날 {긴날(R.퇴직일)}</small></div>
            <div><span>⏱ 1주 평균 근무</span><b>{시간글(R.주시간)}시간</b>
              <small>한 달 {시간글(R.월날)}일 × {시간글(R.하루소정)}시간 × 12달 ÷ 52.14주{R.주정한 > R.주시간 ? ` = ${시간글(R.주정한)} → 40시간까지` : ''} · 15시간 이상이어야</small></div>
            <div><span>📊 평균임금(하루)</span><b>{원글(R.평균)}원</b>
              <small>{긴날(R.석달시작)} ~ {긴날(R.석달끝)} {R.석달일수}일 · 일당 {원글(R.일당)}원 × {R.석달날}일{R.석달더 ? ` + ${원글(R.석달더)}원` : ''} = {원글(R.석달총)}원 ÷ {R.석달일수}일</small></div>
            <div><span>⚖️ 통상임금(하루)</span><b>{원글(R.통상)}원</b>
              <small>시급 {원글(R.시급)}원(일당 ÷ {시간글(R.유급)}시간{R.연장 > 0 ? ` = 8 + ${시간글(R.연장)} × 1.5` : ''}) × {시간글(R.통상시간)}시간{R.주시간 < 40 ? `(1주 ${시간글(R.주시간)}시간 ÷ 5 — 주 40시간에 비례 · 근로기준정책과-1522)` : ''}</small></div>
            <div><span>💰 퇴직금</span><b>{R.셈글}</b>
              <small>{R.통상씀 ? '평균임금이 통상임금보다 적어 통상임금으로(근로기준법 제2조② · 근로기준정책과-579)' : '평균임금으로(통상임금보다 큼)'} · 1년에 30일분(퇴직급여법 제8조①) · 원 미만 버림{R.결론 === 'no' ? ' · 조건이 안 맞아 받지 않습니다 — 셈은 참고' : ''}</small></div>
          </div>
          {R.결론 !== 'no' && <div className="note sm" style={{ marginTop: 8 }}>
            🗓 그만둔 날부터 <b>14일 안</b>(합의하면 늦출 수 있음 — 퇴직급여법 제9조①) · {R.IRP ? <>{원글(IRP기준)}원이 넘어 <b>IRP(개인형퇴직연금) 계좌로 옮겨</b> 받는 것이 원칙 — 55세 이후 퇴직 등은 예외(제9조② · 시행령 제3조의2)</> : <>{원글(IRP기준)}원 이하라 IRP 로 옮기지 않고 받을 수 있음(시행령 제3조의2 · 고용노동부고시 제2026-65호)</>} · 받을 권리 3년(제10조)
          </div>}
          {R.알림.map((x) => <div key={x} className="note sm" style={{ marginTop: 8 }}>{x}</div>)}
          <div className="detail-h" style={{ margin: '14px 0 6px' }}>까닭</div>
          <ul className="sl-why">
            {R.요건.map((x) => <li key={x.글} className={x.ok === true ? 'ok' : x.ok === null ? 'chk' : 'bad'}><span className="sl-ic" aria-hidden>{x.ok === true ? '✅' : x.ok === null ? '⚠️' : '❌'}</span><div><p>{x.글}</p></div></li>)}
          </ul>
          <div className="sl-btns no-print">
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => window.print()}>🖨 인쇄</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={링크보내기}>🔗 링크 보내기</button>
          </div>
          {링크 && <div className="note sm no-print" role="status" style={{ marginTop: 8, wordBreak: 'break-all' }}>
            {링크.복사 ? '📋 링크를 복사했습니다 — 카톡 · 문자 · 카페에 붙여 넣으십시오. 받는 분이 누르면 같은 조건으로 열립니다.' : '아래 링크를 길게 눌러 복사하십시오.'}
            <div style={{ marginTop: 4 }}><a href={링크.url}>{링크.url}</a></div></div>}
        </>}
      </div>}

      <div className="card sl-guide">
        <h2 className="sec-title" style={{ margin: 0 }}>📘 {G.title}</h2>
        <p className="cp">{굵게(G.lead)}</p>
        {G.secs.map((sec) => <details key={sec.id} id={sec.id} className="sl-sec">
          <summary>{sec.h}</summary>
          {sec.p.map((x, k) => <p key={k} className="cp">{굵게(x)}</p>)}
        </details>)}
        <details className="sl-sec">
          <summary>자주 묻는 것</summary>
          {G.faq.map(([q, a]) => <div key={q} className="sl-faq"><b>Q. {q}</b><p className="cp">{a}</p></div>)}
        </details>
        <p className="cp" style={{ fontSize: 12.5 }}>근거(국가법령정보센터 · 고용노동부 · {문자(G.updated).replace(/^(\d{4})-0?(\d+)-0?(\d+)$/, '$1.$2.$3.')} 확인): {G.laws.map(([t, u], k) => <span key={u}>{k ? ' · ' : ''}<a href={u} target="_blank" rel="noopener noreferrer">{t}</a></span>)}</p>
      </div>
    </div>
  )
}
