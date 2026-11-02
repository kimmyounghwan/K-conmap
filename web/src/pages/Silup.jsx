/**
 * 🧾 일용직 실업급여 판단기 — /tools/ilyong-silup (G507 · 2026-11-02)
 *   소장님: 「판단기 늘리기 부터 만들자. 사이트 확인해서 없는 것만 만들어」
 *   셈 lib/silup.js(고용보험법 원문 — 그 파일 머리 참고) · 링크 lib/silupLink.js · 글 data/silup_guide.json(미리굽기 prerender.py 와 같은 글)
 * ■ 마지막으로 일한 날 · 두 달 출역 · 18개월 합만 넣으면 «받을 수 있나 · 언제부터(신청할 수 있는 날) · 하루 얼마 × 며칠».
 * ■ 적은 것은 이 브라우저에만(kcm_silup) · 결과 링크(?c=)로 보내면 받는 분도 같은 결과.
 * ■ 예시는 data 의 base(2026-11-02) 날로 셈 — 내 것을 고치면 오늘 날로.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 판단, 까닭들, 나이들, 가입들, 구간글, 날맞나 } from '../lib/silup.js'
import { 링크만들기, 링크읽기 } from '../lib/silupLink.js'
import { 한국오늘, 긴날, 짧은날, 달더하기 } from '../lib/해마다.js'
import G from '../data/silup_guide.json'

const 열쇠 = 'kcm_silup'
const 쓴링크열쇠 = 'kcm_silup_link'
const 빈것 = () => ({ 끝날: '', A: '', B: '', 합: '', 건설: true, 까닭: 'end', 정당: false, 딴: false, 일용: '', 나이: 'u50', 장애: false, 가입: '', 일당: '', 월일: '', 시간: 8, 기준: '' })
function 읽기() {
  try { const o = JSON.parse(localStorage.getItem(열쇠) || 'null'); if (o && typeof o === 'object') return { ...빈것(), ...o } } catch (e) { /* 막힘 */ }
  return 빈것()
}
function 쓰기(st) { try { localStorage.setItem(열쇠, JSON.stringify(st)); return true } catch (e) { return false } }
const 굵게 = (s) => String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
const 원 = (n) => Math.round(Number(n) || 0).toLocaleString('ko-KR')
const 숫자 = (v, 길이 = 7) => String(v ?? '').replace(/[^\d]/g, '').slice(0, 길이)
const 달이름 = (ym) => `${Number(ym.slice(5, 7))}월`
const 표시 = { yes: '✅', no: '❌', wait: '⏳', check: '⚠️', need: '📝' }

export default function Silup() {
  const [st, setSt] = useState(() => 읽기())
  const [알림, set알림] = useState('')
  const [되돌릴, set되돌릴] = useState(null)
  const [링크, set링크] = useState(null)
  const [저장됨, set저장됨] = useState(true)
  const [지움물음, set지움물음] = useState(false)

  useEffect(() => {
    /* 🔗 받은 링크(?c=) — 같은 창에서 이미 채운 링크면 다시 덮지 않음(새로고침 · 뒤로가기) */
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
        if (전.끝날) set되돌릴(전)
        setSt({ ...빈것(), ...r })
        set알림('🔗 받은 링크의 날짜 · 날 수로 채웠습니다. 오늘 날짜로 셈합니다.')
      } else set알림('🔗 링크를 읽지 못했습니다 — 주소가 잘렸을 수 있습니다. 적어 두신 것은 그대로입니다.')
    } catch (e) { /* 주소 읽기 실패 — 그냥 지나감 */ }
  }, [])
  useEffect(() => { set저장됨(쓰기(st)); set링크(null) }, [st])

  const 오늘 = 날맞나(st.기준) ? st.기준 : 한국오늘()
  const 그날말 = 날맞나(st.기준) ? `${짧은날(st.기준)}에` : '오늘'
  const R = useMemo(() => 판단(st, 오늘, 그날말), [st, 오늘, 그날말])
  const 바꿈 = (k, v) => setSt((s) => ({ ...s, [k]: v, 기준: k === '끝날' ? '' : s.기준 }))
  const 끝맞음 = 날맞나(st.끝날)
  const 끝달 = 끝맞음 ? st.끝날.slice(0, 7) : null
  const 앞달 = 끝달 ? 달더하기(끝달, -1) : null

  const 사례 = (c) => {
    if (st.끝날) set되돌릴(st)
    setSt({ ...빈것(), ...c.i, 기준: G.base })
    set알림(`🧪 예시 «${c.t}» — ${긴날(G.base)} 기준으로 셈했습니다. 날짜를 고치면 오늘 기준으로 셈합니다.`)
  }
  const 링크보내기 = async () => {
    if (R.빈) return
    const url = `${window.location.origin}/tools/ilyong-silup?c=${링크만들기(st)}`
    const 글 = `일용직 실업급여 판단 — ${R.큰글.replace(/^\S+\s/, '')} · 하루 ${원(R.돈.일액)}원 × ${R.돈.일수}일`
    let 폰 = false
    try { 폰 = window.matchMedia('(pointer: coarse)').matches } catch (e) { /* 모름 */ }
    if (폰 && navigator.share) {
      try { await navigator.share({ title: 'K-건설맵 · 일용직 실업급여 판단', text: 글, url }); return } catch (e) { if (e && e.name === 'AbortError') return }
    }
    try { await navigator.clipboard.writeText(url); set링크({ url, 복사: true }) } catch (e) { set링크({ url, 복사: false }) }
  }
  const 신청 = G.secs.find((x) => x.id === 'sincheong')

  return (
    <div className="wrap sl">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🧾 일용직 실업급여 판단기</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          마지막으로 일한 날 · 두 달 출역 · 18개월 동안 일한 날만 넣으면 <b>받을 수 있는지</b>, <b>언제부터 신청하는지</b>, <b>하루 얼마 × 며칠</b>인지 바로 나옵니다. 건설일용 «14일» 셈까지.
        </p>
        <div className="iy-small">💾 이 브라우저에만 저장{저장됨 ? '' : <b className="nm-warn"> — 지금 저장이 막혀 있습니다</b>} · 고용보험법 조문대로 셈 · 최종 판단은 고용센터</div>
        <details className="iy-exd">
          <summary>👀 예시로 해 보기 ({G.cases.length}가지)</summary>
          <div className="iy-ex sl-ex">
            {G.cases.map((c) => <button key={c.id} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 사례(c)} title={c.q}>{c.t}</button>)}
          </div>
        </details>
        <div className="iy-links">
          <a href="#jogeon" onClick={() => { const d = document.getElementById('jogeon'); if (d) d.open = true }}>📘 받는 조건 자세히</a>
          <Link to="/tools/ilyong-boheom">🛡 4대보험 가입 판단기</Link>
          <Link to="/tools/sanjae-hyueop">🩹 산재 휴업급여</Link>
          <Link to="/tools/juhyu">📆 주휴수당</Link>
          {!지움물음 && st.끝날 && <button type="button" className="tp-x" onClick={() => set지움물음(true)}>처음부터</button>}
          {지움물음 && <span className="nm-ask">적은 것을 지웁니다.
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setSt(빈것()); set지움물음(false); set알림(''); set되돌릴(null) }}>지우기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(false)}>그대로</button></span>}
        </div>
        {알림 && <div className="note sm" style={{ marginTop: 8 }} role="status">{알림}
          {되돌릴 && <> <button type="button" className="tp-x iy-undo" onClick={() => { setSt(되돌릴); set되돌릴(null); set알림('적어 두셨던 것으로 되돌렸습니다.') }}>↩ 내가 적어 둔 것으로 되돌리기</button></>}
        </div>}
      </div>

      <div className="card sl-in">
        <div className="detail-h" style={{ margin: 0 }}>📅 일한 날</div>
        <div className="sl-grid">
          <label>마지막으로 일한 날
            <input className="inp" type="date" value={st.끝날} onChange={(e) => 바꿈('끝날', e.target.value)} aria-label="마지막으로 일한 날" />
            <small>그만둔 현장에서 마지막으로 출역한 날</small>
          </label>
          <label>{앞달 ? `${달이름(앞달)} 출역` : '앞 달 출역'}
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.A} onChange={(e) => 바꿈('A', 숫자(e.target.value, 2))} placeholder="예: 21" aria-label="앞 달 출역 일수" /><i>일</i></span>
            <small>{앞달 ? `${달이름(앞달)} 한 달 동안 일한 날(모든 현장)` : '마지막 날이 든 달의 앞 달'}</small>
          </label>
          <label>{끝달 ? `${달이름(끝달)} 출역` : '마지막 달 출역'}
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.B} onChange={(e) => 바꿈('B', 숫자(e.target.value, 2))} placeholder="예: 7" aria-label="마지막 달 출역 일수" /><i>일</i></span>
            <small>{끝맞음 ? `${짧은날(st.끝날)}까지 그 달에 일한 날` : '마지막 날이 든 달'}</small>
          </label>
          <label>18개월 동안 일한 날(모두)
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.합} onChange={(e) => 바꿈('합', 숫자(e.target.value, 3))} placeholder="예: 230" aria-label="18개월 동안 일한 날" /><i>일</i></span>
            <small>{R.기준처음 && 끝맞음 ? `${긴날(R.기준처음)} ~ ${긴날(st.끝날)} · 여러 현장 합쳐서` : '마지막 날 전 18개월 · 여러 현장 합쳐서'}</small>
          </label>
        </div>
        <div className="sl-row">
          <span className="sl-k">마지막 일</span>
          <span className="iy-seg">
            <button type="button" className={st.건설 ? 'on' : ''} aria-pressed={st.건설} onClick={() => 바꿈('건설', true)}>건설 현장 일용</button>
            <button type="button" className={!st.건설 ? 'on' : ''} aria-pressed={!st.건설} onClick={() => 바꿈('건설', false)}>건설 아닌 일용</button>
          </span>
        </div>
        <div className="sl-row">
          <label className="sl-k" htmlFor="sl-why">그만둔 까닭</label>
          <select id="sl-why" className="inp sl-sel" value={st.까닭} onChange={(e) => 바꿈('까닭', e.target.value)}>
            {까닭들.map((x) => <option key={x.k} value={x.k}>{x.글}</option>)}
          </select>
          {st.까닭 === 'self' && <label className="sl-chk"><input type="checkbox" checked={!!st.정당} onChange={(e) => 바꿈('정당', e.target.checked)} /> 임금 체불 · 통근 곤란 · 질병 같은 정당한 사유가 있음</label>}
        </div>
        <div className="sl-row">
          <span className="sl-k">그만둔 날 나이</span>
          <span className="iy-seg">
            {나이들.map((x) => <button key={x.k} type="button" className={st.나이 === x.k ? 'on' : ''} aria-pressed={st.나이 === x.k} onClick={() => 바꿈('나이', x.k)}>{x.글}</button>)}
          </span>
          <label className="sl-chk"><input type="checkbox" checked={!!st.장애} onChange={(e) => 바꿈('장애', e.target.checked)} /> 장애인</label>
        </div>
        <div className="sl-row">
          <label className="sl-k" htmlFor="sl-ins">고용보험 가입기간</label>
          <select id="sl-ins" className="inp sl-sel" value={st.가입} onChange={(e) => 바꿈('가입', e.target.value)}>
            <option value="">모름(가장 적은 120일로 셈)</option>
            {가입들.map((x) => <option key={x.k} value={x.k}>{x.글}</option>)}
          </select>
        </div>
        <div className="detail-h" style={{ margin: '14px 0 0' }}>💰 금액 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 비워 두면 하한액으로 셈(일용은 대부분 하한액)</span></div>
        <div className="sl-grid">
          <label>일당
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.일당 ? 원(st.일당) : ''} onChange={(e) => 바꿈('일당', 숫자(e.target.value, 7))} placeholder="예: 250,000" aria-label="일당" /><i>원</i></span>
          </label>
          <label>한 달에 보통 일한 날
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.월일} onChange={(e) => 바꿈('월일', 숫자(e.target.value, 2))} placeholder="예: 20" aria-label="한 달에 보통 일한 날" /><i>일</i></span>
            <small>{!R.빈 ? `${긴날(R.돈.석달처음)} ~ ${긴날(R.돈.석달끝)} 석 달 평균(마지막 1개월 뺌)` : '마지막 1개월을 뺀 그 앞 석 달 평균'}</small>
          </label>
        </div>
        <details className="sl-more">
          <summary>더 — 다른 곳을 스스로 그만둔 적 · 하루 근로시간</summary>
          <div className="sl-row">
            <label className="sl-chk"><input type="checkbox" checked={!!st.딴} onChange={(e) => 바꿈('딴', e.target.checked)} /> 18개월 안에 다른 회사를 (정당한 사유 없이) 스스로 그만둔 적이 있음</label>
            {st.딴 && <label className="sl-inl">그 18개월 동안 일용으로 일한 날
              <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.일용} onChange={(e) => 바꿈('일용', 숫자(e.target.value, 3))} placeholder="예: 120" aria-label="일용으로 일한 날" /><i>일</i></span></label>}
          </div>
          <div className="sl-row">
            <label className="sl-inl">하루 정해진 근로시간(소정근로시간)
              <select className="inp sl-sel" value={st.시간} onChange={(e) => 바꿈('시간', Number(e.target.value))}>
                {[8, 7, 6, 5, 4, 3, 2, 1].map((h) => <option key={h} value={h}>{h}시간{h === 8 ? '(보통)' : ''}</option>)}
              </select>
            </label>
            <small className="muted">하한액 = 최저임금 × 이 시간 × 80%</small>
          </div>
        </details>
      </div>

      {!R.빈 && <div className="card sl-out" id="sl-result">
        <div className={'sl-res ' + R.결론} role="status">{R.큰글}</div>
        {st.기준 && <div className="note sm" style={{ marginTop: 8 }}>🧪 예시는 {긴날(st.기준)} 기준입니다.
          <button type="button" className="tp-x" onClick={() => setSt((s) => ({ ...s, 기준: '' }))}>오늘 기준으로 보기</button></div>}
        <div className="sl-facts">
          <div><span>📅 신청할 수 있는 날</span><b>{R.날들.length ? R.날들.map(구간글).join(' · ') : '없음'}</b>
            {R.오늘됨 && <em className="sl-ok">{날맞나(st.기준) ? `${짧은날(st.기준)} 됨` : '오늘 됨'}</em>}</div>
          <div><span>💰 받는 돈</span><b>하루 {원(R.돈.일액)}원 × {R.돈.일수}일 = {원(R.돈.총)}원</b>
            <small>{R.돈.일액글} · 하한 {원(R.돈.한도.하한)}원 · 상한 {원(R.돈.한도.상한)}원({R.돈.한도.상한글})
              {R.돈.가입모름 ? ' · 가입기간을 모르면 가장 적은 120일로 셈' : ` · ${R.돈.위50 ? '50세 이상 · 장애인' : '50세 미만'} 표`}</small></div>
          <div><span>⏱ 첫 지급</span><b>{R.대기 ? '실업 신고 뒤 7일은 대기기간(안 줌)' : '건설일용 — 7일 대기 없이 신고한 날부터'}</b></div>
          <div><span>🗓 받는 기간</span><b>{긴날(R.받기.처음)} ~ {긴날(R.받기.끝)}</b><small>이 12개월 안에서만 받습니다 — 늦게 신청하면 남은 날만큼만</small></div>
        </div>
        {R.돈.한도.잠정 && <div className="note sm warn" style={{ marginTop: 8 }}>⚠️ {String(R.끝날).slice(0, 4)}년 최저임금은 아직 넣지 않아 {R.돈.한도.최저해}년 값으로 셈했습니다(잠정).</div>}
        <div className="detail-h" style={{ margin: '14px 0 6px' }}>까닭</div>
        <ul className="sl-why">
          {R.요건.map((x) => {
            const 아이 = x.됨 === true ? '✅' : x.됨 === false ? (x.k === '날' && R.결론 === 'wait' ? '⏳' : '❌') : '⚠️'
            return <li key={x.k} className={x.됨 === true ? 'ok' : x.됨 === false ? (x.k === '날' ? 'wait' : 'bad') : 'chk'}>
              <span className="sl-ic" aria-hidden>{아이}</span><div><b>{x.제목}</b><p>{굵게(x.글)}</p></div></li>
          })}
        </ul>
        <div className="sl-btns no-print">
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => window.print()}>🖨 인쇄</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={링크보내기}>🔗 링크 보내기</button>
        </div>
        {링크 && <div className="note sm no-print" role="status" style={{ marginTop: 8, wordBreak: 'break-all' }}>
          {링크.복사 ? '📋 링크를 복사했습니다 — 카톡 · 문자 · 카페에 붙여 넣으십시오. 받는 분이 누르면 같은 날짜 · 날 수로 열립니다.' : '아래 링크를 길게 눌러 복사하십시오.'}
          <div style={{ marginTop: 4 }}><a href={링크.url}>{링크.url}</a></div></div>}
      </div>}

      {!R.빈 && 신청 && <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>📝 할 일 — {신청.h}</div>
        {신청.p.map((x, k) => <p key={k} className="cp">{굵게(x)}</p>)}
      </div>}

      <div className="card sl-guide">
        <h2 className="sec-title" style={{ margin: 0 }}>📘 {G.title}</h2>
        <p className="cp">{굵게(G.lead)}</p>
        {G.secs.filter((x) => x.id !== 'sincheong').map((sec) => <details key={sec.id} id={sec.id} className="sl-sec">
          <summary>{sec.h}</summary>
          {sec.p.map((x, k) => <p key={k} className="cp">{굵게(x)}</p>)}
          {sec.id === 'myeochil' && <div className="tp-scroll"><table className="tbl sl-tbl"><thead><tr>{G.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{G.table.rows.map((r) => <tr key={r[0]}>{r.map((c, j) => (j === 0 ? <th key={j}>{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody></table></div>}
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
