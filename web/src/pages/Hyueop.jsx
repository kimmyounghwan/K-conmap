/**
 * 🩹 산재 휴업급여 계산기(일용) — /tools/sanjae-hyueop (G508 · 2026-11-02)
 *   소장님: 「판단기 늘리기 부터 만들자. 사이트 확인해서 없는 것만 만들어」 — 둘째(첫째 G507 실업급여)
 *   셈 lib/hyueop.js(산재보험법 · 시행령 · 고시 원문 — 그 파일 머리 참고) · 링크 lib/hyueopLink.js · 글 data/hyueop_guide.json(미리굽기와 같은 글)
 * ■ 일당 · 쉰 기간(· 생년월일)만 넣으면 «하루 얼마 × 며칠 = 얼마» · 61세 감액 · 3일 이내 · 저소득 보정을 날마다 셈.
 * ■ 적은 것은 이 브라우저에만(kcm_hyueop) · 결과 링크(?c=)에는 생년월일을 안 담음.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 휴업셈, 원글 } from '../lib/hyueop.js'
import { 링크만들기, 링크읽기 } from '../lib/hyueopLink.js'
import { 긴날, 짧은날 } from '../lib/해마다.js'
import G from '../data/hyueop_guide.json'

const 열쇠 = 'kcm_hyueop'
const 쓴링크열쇠 = 'kcm_hyueop_link'
const 빈것 = () => ({ 일당: '', 직접: false, 평균: '', 다친날: '', 처음: '', 끝: '', 생일: '' })
function 읽기() {
  try { const o = JSON.parse(localStorage.getItem(열쇠) || 'null'); if (o && typeof o === 'object') return { ...빈것(), ...o } } catch (e) { /* 막힘 */ }
  return 빈것()
}
function 쓰기(st) { try { localStorage.setItem(열쇠, JSON.stringify(st)); return true } catch (e) { return false } }
const 굵게 = (s) => String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
const 숫자 = (v, 길이 = 7) => String(v ?? '').replace(/[^\d]/g, '').slice(0, 길이)

export default function Hyueop() {
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
        if (전.처음 || 전.일당) set되돌릴(전)
        setSt({ ...빈것(), ...r })
        set알림('🔗 받은 링크의 일당 · 날짜로 채웠습니다. 생년월일은 링크에 담기지 않습니다(61세 넘으면 넣으세요).')
      } else set알림('🔗 링크를 읽지 못했습니다 — 주소가 잘렸을 수 있습니다. 적어 두신 것은 그대로입니다.')
    } catch (e) { /* 주소 읽기 실패 */ }
  }, [])
  useEffect(() => { set저장됨(쓰기(st)); set링크(null) }, [st])

  const R = useMemo(() => 휴업셈(st), [st])
  const 바꿈 = (k, v) => setSt((s) => ({ ...s, [k]: v }))
  const 사례 = (c) => {
    if (st.처음 || st.일당) set되돌릴(st)
    setSt({ ...빈것(), ...c.i })
    set알림(`🧪 예시 «${c.t}» 로 채웠습니다.`)
  }
  const 링크보내기 = async () => {
    if (R.빈) return
    const url = `${window.location.origin}/tools/sanjae-hyueop?c=${링크만들기(st)}`
    const 하나 = R.구간.length === 1 ? R.구간[0] : null
    const 글 = R.셋날 ? `산재 휴업급여 — ${R.일수}일(3일 이내)이라 없음` : `산재 휴업급여 — ${하나 ? `하루 ${원글(하나.액)}원 × ${R.일수}일` : `${R.일수}일`} = ${원글(R.총)}원`
    let 폰 = false
    try { 폰 = window.matchMedia('(pointer: coarse)').matches } catch (e) { /* 모름 */ }
    if (폰 && navigator.share) {
      try { await navigator.share({ title: 'K-건설맵 · 산재 휴업급여', text: 글, url }); return } catch (e) { if (e && e.name === 'AbortError') return }
    }
    try { await navigator.clipboard.writeText(url); set링크({ url, 복사: true }) } catch (e) { set링크({ url, 복사: false }) }
  }
  const 낮은꼴 = !R.빈 && R.구간.some((x) => x.꼴 === '최저임금' || x.꼴 === '80')

  return (
    <div className="wrap sl hy">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🩹 산재 휴업급여 계산기</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          일당 · 쉰 기간만 넣으면 <b>하루 얼마 × 며칠 = 얼마</b>인지 바로 나옵니다. 건설 일용은 평균임금 = 일당 × 73/100. 61세 감액 · 3일 이내 · 최고 금액까지 날마다 셈합니다.
        </p>
        <div className="iy-small">💾 이 브라우저에만 저장{저장됨 ? '' : <b className="nm-warn"> — 지금 저장이 막혀 있습니다</b>} · 산재보험법 · 고시대로 셈 · 최종 금액은 근로복지공단</div>
        <details className="iy-exd">
          <summary>👀 예시로 해 보기 ({G.cases.length}가지)</summary>
          <div className="iy-ex sl-ex">
            {G.cases.map((c) => <button key={c.id} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 사례(c)} title={c.q}>{c.t}</button>)}
          </div>
        </details>
        <div className="iy-links">
          <a href="#eolma" onClick={() => { const d = document.getElementById('eolma'); if (d) d.open = true }}>📘 셈 자세히</a>
          <Link to="/tools/ilyong-silup">🧾 실업급여 판단기</Link>
          <Link to="/tools/ilyong-boheom">🛡 4대보험 가입 판단기</Link>
          {!지움물음 && (st.처음 || st.일당) && <button type="button" className="tp-x" onClick={() => set지움물음(true)}>처음부터</button>}
          {지움물음 && <span className="nm-ask">적은 것을 지웁니다.
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setSt(빈것()); set지움물음(false); set알림(''); set되돌릴(null) }}>지우기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(false)}>그대로</button></span>}
        </div>
        {알림 && <div className="note sm" style={{ marginTop: 8 }} role="status">{알림}
          {되돌릴 && <> <button type="button" className="tp-x iy-undo" onClick={() => { setSt(되돌릴); set되돌릴(null); set알림('적어 두셨던 것으로 되돌렸습니다.') }}>↩ 내가 적어 둔 것으로 되돌리기</button></>}
        </div>}
      </div>

      <div className="card sl-in">
        <div className="detail-h" style={{ margin: 0 }}>🩹 다친 사람 · 쉰 기간</div>
        <div className="sl-grid">
          {!st.직접 && <label>일당
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.일당 ? 원글(st.일당) : ''} onChange={(e) => 바꿈('일당', 숫자(e.target.value))} placeholder="예: 200,000" aria-label="일당" /><i>원</i></span>
            <small>다친 날 받던 하루 임금</small>
          </label>}
          {st.직접 && <label>평균임금(1일)
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.평균 ? 원글(st.평균) : ''} onChange={(e) => 바꿈('평균', 숫자(e.target.value))} placeholder="예: 150,000" aria-label="평균임금" /><i>원</i></span>
            <small>다친 날 전 3개월 임금 ÷ 그 기간 날 수</small>
          </label>}
          <label>쉰 첫날(요양 시작)
            <input className="inp" type="date" value={st.처음} onChange={(e) => 바꿈('처음', e.target.value)} aria-label="쉰 첫날" />
          </label>
          <label>쉰 끝날
            <input className="inp" type="date" value={st.끝} onChange={(e) => 바꿈('끝', e.target.value)} aria-label="쉰 끝날" />
            <small>아직 요양 중이면 오늘이나 예정일</small>
          </label>
          <label>생년월일 <small className="muted">(앞 6자리 · 선택)</small>
            <input className="inp" inputMode="numeric" maxLength={10} value={st.생일} onChange={(e) => 바꿈('생일', e.target.value.replace(/[^\d.\-/ ]/g, ''))} placeholder="예: 650315" aria-label="생년월일" />
            <small>61세가 넘으면 감액 셈에 씀 · 링크에는 안 담음</small>
          </label>
        </div>
        <div className="sl-row">
          <label className="sl-chk"><input type="checkbox" checked={!!st.직접} onChange={(e) => 바꿈('직접', e.target.checked)} /> 같은 사업에서 3개월 넘게 계속 일함 · 상용처럼 일함 → 평균임금 직접 넣기</label>
        </div>
        <details className="sl-more">
          <summary>더 — 다친 날이 쉰 첫날과 다르면</summary>
          <div className="sl-row">
            <label className="sl-inl">다친 날
              <input className="inp" type="date" value={st.다친날} onChange={(e) => 바꿈('다친날', e.target.value)} aria-label="다친 날" style={{ width: 'auto' }} />
            </label>
            <small className="muted">61세 이후에 다쳤는지 · 그해 통상근로계수를 볼 때 씀(비우면 쉰 첫날)</small>
          </div>
        </details>
      </div>

      {(st.처음 || st.끝 || st.일당 || st.평균) && <div className="card sl-out" id="hy-result">
        {R.빈 ? <div className="sl-res need" role="status">📝 {R.까닭}</div> : <>
          <div className={'sl-res ' + (R.셋날 ? 'no' : 'yes')} role="status">
            {R.셋날 ? `❌ 쉰 날이 ${R.일수}일(3일 이내)이라 산재 휴업급여는 없습니다 — 사업주가 휴업보상(평균임금의 60%)을 합니다`
              : `💰 ${R.구간.length === 1 ? `하루 ${원글(R.구간[0].액)}원 × ${R.일수}일` : `${R.일수}일`} = ${원글(R.총)}원`}
          </div>
          <div className="sl-facts">
            <div><span>📐 평균임금</span><b>{R.직접 ? `${원글(R.평균)}원(직접 넣음)` : `일당 ${원글(st.일당)}원 × ${Math.round(R.계수 * 100)}/100 = ${원글(R.평균)}원`}</b>
              <small>{R.직접 ? '근로기준법 평균임금 — 3개월 넘게 계속 일했거나 상용처럼 일한 경우(시행령 제23조1)' : '일용근로자 평균임금 = 일당 × 통상근로계수(시행령 제24조①1 · 고시 제2025-90호)'}</small></div>
            <div><span>📅 쉰 기간</span><b>{긴날(st.처음)} ~ {긴날(st.끝)} · {R.일수}일</b><small>{R.셋날 ? '3일 이내는 산재 휴업급여 없음(제52조 단서)' : '4일 이상이라 첫날부터 · 주말 · 휴일도 요양 중이면 셈'}{R.나이글 ? ` · ${R.나이글}` : ''}</small></div>
            {R.구간.length > 1 && <div><span>🧮 날마다</span><b className="hy-segs">{R.구간.map((x) => <span key={x.부터}>{짧은날(x.부터)}~{짧은날(x.까지)} {x.일}일 × {원글(x.액)}원</span>)}</b></div>}
          </div>
          {R.잠정 && <div className="note sm" style={{ marginTop: 8 }}>⚠️ 아직 고시가 안 나온 해가 들어 있어 2026년 값(최고 · 최저 보상기준 · 최저임금)으로 셈했습니다(잠정).</div>}
          {낮은꼴 && <div className="note sm" style={{ marginTop: 8 }}>⚠️ 평균임금이 낮아 «저소득 보정»(제54조)으로 셈했습니다 — 법 조문대로 셈한 숫자이니 근로복지공단 결정 통지로 꼭 확인하세요.</div>}
          {R.증감 && <div className="note sm hy-long" style={{ marginTop: 8 }}>⚠️ 다친 날부터 1년이 지난 뒤({긴날(R.증감)} 무렵부터)는 평균임금을 해마다 증감합니다 — 전체 근로자 임금 평균액 증감률, 60세 이후는 소비자물가변동률(제36조③). 이 계산기는 증감 전 평균임금으로 셈하니 그 뒤 금액은 공단 결정으로 확인하세요.</div>}
          {R.상병 && <div className="note sm hy-long" style={{ marginTop: 8 }}>⚠️ 요양을 시작한 지 2년이 지난 뒤({긴날(R.상병)} 무렵부터)에도 낫지 않고 중증요양상태등급에 해당하며 일을 못 하면 휴업급여 대신 상병보상연금을 받습니다(제66조).</div>}
          <div className="detail-h" style={{ margin: '14px 0 6px' }}>까닭</div>
          <ul className="sl-why">
            {R.구간.map((x) => <li key={x.부터} className="ok"><span className="sl-ic" aria-hidden>🧾</span><div><b>{R.구간.length > 1 ? `${짧은날(x.부터)} ~ ${짧은날(x.까지)} · ` : ''}하루 {원글(x.액)}원</b><p>{x.줄.join(' → ')}</p></div></li>)}
          </ul>
          <div className="sl-btns no-print">
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => window.print()}>🖨 인쇄</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={링크보내기}>🔗 링크 보내기</button>
          </div>
          {링크 && <div className="note sm no-print" role="status" style={{ marginTop: 8, wordBreak: 'break-all' }}>
            {링크.복사 ? '📋 링크를 복사했습니다 — 카톡 · 문자 · 카페에 붙여 넣으십시오. 받는 분이 누르면 같은 일당 · 날짜로 열립니다.' : '아래 링크를 길게 눌러 복사하십시오.'}
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
        <p className="cp" style={{ fontSize: 12.5 }}>근거(국가법령정보센터 · {긴날(G.updated)} 확인): {G.laws.map(([t, u], k) => <span key={u}>{k ? ' · ' : ''}<a href={u} target="_blank" rel="noopener noreferrer">{t}</a></span>)}</p>
      </div>
    </div>
  )
}
