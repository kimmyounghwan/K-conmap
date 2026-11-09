/**
 * 📆 주휴수당 판단기(일용 · 알바) — /tools/juhyu (G509 · 2026-11-02)
 *   소장님: 「판단기 늘리기 부터 만들자. 사이트 확인해서 없는 것만 만들어」 — 셋째(G507 실업급여 · G508 산재 휴업급여)
 *   셈 lib/juhyu.js(근로기준법 · 시행령 · 별표 · 고용노동부 해석 — 그 파일 머리 참고) · 링크 lib/juhyuLink.js · 글 data/juhyu_guide.json(미리굽기와 같은 글)
 * ■ 일당(또는 시급) · 하루 시간 · 1주 날 · 개근 · 그만둔 주인지 → 받을 수 있나 · 1주 얼마 · 까닭(조문).
 * ■ 적은 것은 이 브라우저에만(kcm_juhyu) · 결과 링크(?c=) · 이름 같은 것은 받지 않음.
 * ■ 🖼 G607(11-08) PDF · 인쇄는 그림 — 화면(.wrap.jh)을 복제본에서 인쇄 CSS 로 펴서(적는 칸 · 설명 · 단추는 숨음 — 옛 인쇄와 같은 모양) 찍음.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 주휴판단, 원글, 시간글 } from '../lib/juhyu.js'
import { 링크만들기, 링크읽기 } from '../lib/juhyuLink.js'
import G from '../data/juhyu_guide.json'
import { 일당살핌, 시급살핌 } from '../lib/살핌.js'
import { 링크복사 } from '../lib/링크복사.js'
import { use그림인쇄 } from '../tools/그림인쇄훅.js'   /* 🖼 G607 PDF · 인쇄는 그림(글자 층 없음) */

const 열쇠 = 'kcm_juhyu'
const 쓴링크열쇠 = 'kcm_juhyu_link'
const 빈것 = () => ({ 형태: 'cont', 오인: true, 돈꼴: 'day', 일당: '', 시급: '', 시간: '8', 날: '5', 개근: true, 이어짐: true, 주수: '1', 다름: false, 넷합: '', 넷주: '4', 포함: false })
function 읽기() {
  try { const o = JSON.parse(localStorage.getItem(열쇠) || 'null'); if (o && typeof o === 'object') return { ...빈것(), ...o } } catch (e) { /* 막힘 */ }
  return 빈것()
}
function 쓰기(st) { try { localStorage.setItem(열쇠, JSON.stringify(st)); return true } catch (e) { return false } }
const 굵게 = (s) => String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
const 숫자 = (v, 길이 = 7) => String(v ?? '').replace(/[^\d]/g, '').slice(0, 길이)
const 소수 = (v, 길이 = 5) => String(v ?? '').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 길이)
const 문자 = (x) => (x === null || x === undefined ? '' : String(x))

function 두단추({ 값, 바꿈, 하나, 둘, 이름 }) {
  return (
    <span className="iy-seg" role="group" aria-label={이름}>
      <button type="button" className={값 ? 'on' : ''} aria-pressed={!!값} onClick={() => 바꿈(true)}>{하나}</button>
      <button type="button" className={!값 ? 'on' : ''} aria-pressed={!값} onClick={() => 바꿈(false)}>{둘}</button>
    </span>
  )
}

export default function Juhyu() {
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
        if (전.일당 || 전.시급) set되돌릴(전)
        setSt({ ...빈것(), ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v])) })
        set알림('🔗 받은 링크의 일당 · 시간 · 날로 채웠습니다.')
      } else set알림('🔗 링크를 읽지 못했습니다 — 주소가 잘렸을 수 있습니다. 적어 두신 것은 그대로입니다.')
    } catch (e) { /* 주소 읽기 실패 */ }
  }, [])
  useEffect(() => { set저장됨(쓰기(st)); set링크(null) }, [st])

  const R = useMemo(() => 주휴판단(st), [st])
  const 바꿈 = (k, v) => setSt((s) => ({ ...s, [k]: v }))
  const 사례 = (c) => {
    if (st.일당 || st.시급) set되돌릴(st)
    setSt({ ...빈것(), ...Object.fromEntries(Object.entries(c.i).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v])) })
    set알림(`🧪 예시 «${c.t}» 로 채웠습니다.`)
  }
  const 링크보내기 = async () => {
    if (R.빈) return
    const url = `${window.location.origin}/tools/juhyu?c=${링크만들기(st)}`
    const 글 = R.결론 === 'yes' ? `주휴수당 1주 ${원글(R.한주)}원` : R.결론 === 'incl' ? `주휴수당 대상 — 일당에 포함 약정` : '주휴수당 없음'
    let 폰 = false
    try { 폰 = window.matchMedia('(pointer: coarse)').matches } catch (e) { /* 모름 */ }
    if (폰 && navigator.share) {
      try { await navigator.share({ title: 'K-건설맵 · 주휴수당', text: 글, url }); return } catch (e) { if (e && e.name === 'AbortError') return }
    }
    set링크({ url, 복사: await 링크복사(url) })   /* 🔗 G516 — 클립보드가 멈춰도 1.5초 뒤 링크는 보임 */
  }
  const 적음 = !!(st.일당 || st.시급)
  /* 🖼 G607 (2026-11-08) 소장님 «엑셀은 그대로 · PDF 는 모두 그림» — 옛 «🖨 인쇄»(window.print · 화면 그대로 글자 PDF) → 화면(.wrap.jh)을 복제본에서
     인쇄 CSS(@media print — .sl-in · .sl-guide · .iy-exd · .no-print 숨음)로 펴서 그림으로 · A4 세로 기본 쪽(186 × 271) · 몸표 없음(실업급여 G605 와 같은 꼴) ·
     이름은 날짜만(이 판단기는 이름 · 날짜를 받지 않음 — 이 브라우저의 오늘) */
  const 오늘글 = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const 그 = use그림인쇄(`주휴수당판단_${오늘글}`, { 셈: '주휴수당판단', 대상: '.wrap.jh', 몸표: [], 쪽: { 폭: 186, 높: 271 }, 여백: [12, 12], 칸줄: true })

  return (
    <>
    <div className="kcm-인쇄안내">🖨 주휴수당 판단은 화면의 <b>«📄 PDF»</b> 또는 <b>«🖨 인쇄»</b> 단추로 인쇄해 주세요.</div>
    <div className="wrap sl jh 그림만인쇄">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📆 주휴수당 판단기 — 일용 · 알바</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          일당(또는 시급) · 하루 시간 · 1주에 나오는 날만 넣으면 <b>주휴수당을 받을 수 있는지 · 1주 얼마</b>인지 바로 나옵니다. 일용직이 이어서 일한 경우 · 하루 9시간 일당 · 그만둔 주 · 4명 이하 사업장까지 따집니다.
        </p>
        <div className="iy-small">💾 이 브라우저에만 저장{저장됨 ? '' : <b className="nm-warn"> — 지금 저장이 막혀 있습니다</b>} · 근로기준법 · 고용노동부 해석대로 셈 · 최종 판단은 고용노동관서</div>
        <details className="iy-exd">
          <summary>👀 예시로 해 보기 ({G.cases.length}가지)</summary>
          <div className="iy-ex sl-ex">
            {G.cases.map((c) => <button key={c.id} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 사례(c)} title={c.q}>{c.t}</button>)}
          </div>
        </details>
        <div className="iy-links">
          <a href="#eolma" onClick={() => { const d = document.getElementById('eolma'); if (d) d.open = true }}>📘 셈 자세히</a>
          <Link to="/tools/ilyong-silup">🧾 실업급여 판단기</Link>
          <Link to="/tools/sanjae-hyueop">🩹 산재 휴업급여</Link>
          <Link to="/tools/ilyong-toejikgeum">💼 퇴직금</Link>
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
        <div className="detail-h" style={{ margin: 0 }}>📅 일하는 모양</div>
        <div className="sl-row">
          <span className="sl-k">임금</span>
          <두단추 값={st.돈꼴 === 'day'} 바꿈={(v) => 바꿈('돈꼴', v ? 'day' : 'hour')} 하나="일당" 둘="시급" 이름="임금 꼴" />
        </div>
        <div className="sl-grid">
          {st.돈꼴 === 'day' ? <label>일당
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.일당 ? 원글(st.일당) : ''} onChange={(e) => 바꿈('일당', 숫자(e.target.value))} placeholder="예: 200,000" aria-label="일당" /><i>원</i></span>
            <small>하루 받는 돈(주휴수당이 따로 없는 일당)</small>
            {일당살핌(st.일당) && <small className="nm-warn">⚠️ {일당살핌(st.일당)}</small>}
          </label> : <label>시급
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.시급 ? 원글(st.시급) : ''} onChange={(e) => 바꿈('시급', 숫자(e.target.value, 6))} placeholder="예: 10,320" aria-label="시급" /><i>원</i></span>
            <small>2026년 최저임금 10,320원</small>
            {시급살핌(st.시급) && <small className="nm-warn">⚠️ {시급살핌(st.시급)}</small>}
          </label>}
          <label>하루 일하는 시간
            <span className="sl-unit"><input className="inp" inputMode="decimal" value={st.시간} onChange={(e) => 바꿈('시간', 소수(e.target.value, 4))} placeholder="예: 8" aria-label="하루 일하는 시간" /><i>시간</i></span>
            <small>점심 · 쉬는 시간 뺌(07~17시 · 점심 1시간 → 9)</small>
          </label>
          {!st.다름 && <label>1주에 일하기로 정한 날
            <select className="inp sl-sel" value={st.날} onChange={(e) => 바꿈('날', e.target.value)} aria-label="1주에 일하기로 정한 날">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={String(n)}>{n}일</option>)}
            </select>
            <small>월~금이면 5일 · 월~토면 6일(일용은 취업규칙 — 없으면 상용직이 일하는 날)</small>
          </label>}
        </div>
        <div className="sl-row">
          <span className="sl-k">일하는 방식</span>
          <두단추 값={st.형태 !== 'once'} 바꿈={(v) => 바꿈('형태', v ? 'cont' : 'once')} 하나="같은 곳에서 이어서 일함" 둘="그날 하루로 끝나는 일용" 이름="일하는 방식" />
        </div>
        <div className="sl-row">
          <span className="sl-k">그 주</span>
          <두단추 값={st.개근 !== false} 바꿈={(v) => 바꿈('개근', v)} 하나="정한 날 다 나옴" 둘="빠진 날 있음(결근)" 이름="개근" />
        </div>
        <div className="sl-row">
          <span className="sl-k">근로관계</span>
          <두단추 값={st.이어짐 !== false} 바꿈={(v) => 바꿈('이어짐', v)} 하나="그 주 휴일까지 다님" 둘="휴일 전에 그만둠" 이름="근로관계" />
        </div>
        <div className="sl-row">
          <span className="sl-k">사업장</span>
          <두단추 값={st.오인 !== false} 바꿈={(v) => 바꿈('오인', v)} 하나="상시 5명 이상" 둘="4명 이하" 이름="사업장 규모" />
        </div>
        <details className="sl-more">
          <summary>더 — 여러 주 · 주마다 다름 · 일당에 포함</summary>
          <div className="sl-row">
            <label className="sl-inl">같은 조건으로 일한 주
              <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.주수} onChange={(e) => 바꿈('주수', 숫자(e.target.value, 3))} placeholder="1" aria-label="같은 조건으로 일한 주" style={{ width: 70 }} /><i>주</i></span></label>
          </div>
          <div className="sl-row">
            <label className="sl-chk"><input type="checkbox" checked={!!st.다름} onChange={(e) => 바꿈('다름', e.target.checked)} /> 주마다 일하는 시간이 다름 → 최근 4주(4주가 안 되면 일한 주) 정해진 시간 합으로 평균</label>
          </div>
          {st.다름 && <div className="sl-row">
            <label className="sl-inl">정해진 시간 합
              <span className="sl-unit"><input className="inp" inputMode="decimal" value={st.넷합} onChange={(e) => 바꿈('넷합', 소수(e.target.value, 5))} placeholder="예: 72" aria-label="정해진 시간 합" style={{ width: 80 }} /><i>시간</i></span></label>
            <label className="sl-inl">몇 주
              <select className="inp sl-sel" value={st.넷주} onChange={(e) => 바꿈('넷주', e.target.value)} aria-label="몇 주">
                {[1, 2, 3, 4].map((n) => <option key={n} value={String(n)}>{n}주</option>)}
              </select></label>
          </div>}
          {st.돈꼴 === 'day' && <div className="sl-row">
            <label className="sl-chk"><input type="checkbox" checked={!!st.포함} onChange={(e) => 바꿈('포함', e.target.checked)} /> 근로계약서에 «일당에 주휴수당 포함» 이라고 적혀 있음</label>
          </div>}
        </details>
      </div>

      {적음 && <div className="card sl-out" id="jh-result">
        {R.빈 ? <div className="sl-res need" role="status">📝 {R.까닭}</div> : <>
          <div className={'sl-res ' + (R.결론 === 'yes' ? 'yes' : R.결론 === 'incl' ? 'check' : 'no')} role="status">{R.큰글}</div>
          <div className="sl-facts">
            <div><span>⏱ 시급</span><b>{R.시급글}</b>
              <small>{R.돈꼴 === 'day' ? (R.오인 ? '시행령 제6조②2 · 8시간 넘는 시간은 연장(× 1.5 — 제56조①)' : '4명 이하 — 하루 8시간 한도 · 연장 가산 없음(시행령 별표 1) → 일한 시간 그대로 나눔') : '시급제'}</small></div>
            <div><span>📅 1주 정해진 근무</span><b>{시간글(R.주시간)}시간{st.다름 ? `(${st.넷주}주 평균${R.정한 > R.주시간 ? ` ${시간글(R.정한)} → 40시간까지` : ''})` : ` (${R.날}일 × ${시간글(R.하루소정)}시간${R.정한 > R.주시간 ? ` = ${시간글(R.정한)} → 40시간까지` : ''})`}</b>
              <small>15시간 이상이어야(제18조③) · 5명 이상은 40시간까지가 정해진 근무(제50조) · 넘게 정해도 주휴는 8시간분(근로기준정책과-5106)</small></div>
            <div><span>🛌 주휴시간</span><b>{시간글(R.주휴시간)}시간</b>
              <small>{R.주시간 >= 40 ? '1주 40시간 이상 → 8시간' : `1주 ${시간글(R.주시간)}시간 ÷ 40 × 8(시행령 별표 2)`}</small></div>
            <div><span>💰 1주 주휴수당</span><b>{R.셈글}</b>
              <small>{R.결론 === 'no' ? '조건이 안 맞아 이 주는 받지 않습니다 — 셈은 참고' : R.주수 > 1 && R.결론 === 'yes' ? `${R.주수}주 × ${원글(R.한주)}원 = ${원글(R.총)}원(주마다 조건을 다 채운 경우)` : '원 미만 버림'}</small></div>
          </div>
          {R.알림.map((x) => <div key={x} className="note sm" style={{ marginTop: 8 }}>{x}</div>)}
          {R.결론 === 'incl' && <div className="note sm jh-incl" style={{ marginTop: 8 }}>
            ℹ️ 같은 현장에서 일정 기간 일하기로 한 일당제 일용은 일당에 주휴수당을 넣기로 정할 수 있습니다(고용노동부 근로개선정책과-2617){R.포함시급 ? ` — 주휴수당을 넣었다고 보면 시급 약 ${원글(R.포함시급)}원` : ''}. 하루로 끝나는 일용은 넣을 수 없습니다.
          </div>}
          <div className="detail-h" style={{ margin: '14px 0 6px' }}>까닭</div>
          <ul className="sl-why">
            {R.요건.map((x) => <li key={x.글} className={x.ok ? 'ok' : 'bad'}><span className="sl-ic" aria-hidden>{x.ok ? '✅' : '❌'}</span><div><p>{x.글}</p></div></li>)}
          </ul>
          <div className="sl-btns no-print">
            <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!!그.찍기} onClick={() => 그.PDF()}>{그.찍기 === 'pdf' ? 'PDF 만드는 중…' : '📄 PDF'}</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!!그.찍기} onClick={() => 그.인쇄()}>{그.찍기 === '인쇄' ? '준비 중…' : '🖨 인쇄'}</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={링크보내기}>🔗 링크 보내기</button>
          </div>
          {그.말 && <div className="note sm no-print jh-찍말" style={{ marginTop: 8 }} role="status">{그.말}</div>}
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
    </>
  )
}
