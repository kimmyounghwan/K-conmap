/**
 * 🚜 특고(노무제공자) 산재 · 고용보험료 계산기 — 건설기계 · 건설현장 화물차 — /tools/teukgo-boheom (G788 · 2026-11-19)
 *   소장님: 카페 물음(«건설기계 4일 일한 특고 산재보험료») → 「이것도 도구 가능해? 이용자 많이 있을까?」 → 「만들어. 특수형태종사자」
 *   셈 lib/teukgo.js(징수법 · 시행령 · 고시 — 그 파일 머리 참고) · 값 lib/해마다.js 특고산재표 · 특고고용표 · 글 data/teukgo_guide.json(미리굽기와 같은 글)
 * ■ 직종 · 몇 월분 · 한 달 내내 / 며칠 → 산재 · 고용보험료 본인 몫 · 회사 몫 · 셈식 · 까닭(조문).
 * ■ 적은 것은 이 브라우저에만(kcm_teukgo) · 이름 같은 것은 받지 않음 · PDF · 인쇄는 그림(G607 꼴 — 화면 .wrap.tg 를 복제본에서 인쇄 CSS 로 펴서)
 * ■ 숨은 셈: |특고|예시 · |특고|PDF · |특고|인쇄(그림인쇄훅)
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 특고셈, 직종들, 고를달들, 달글, 이번달, 처음달, 원 } from '../lib/teukgo.js'
import G from '../data/teukgo_guide.json'
import { 세기 } from '../lib/받은수.jsx'
import { use그림인쇄 } from '../tools/그림인쇄훅.js'   /* 🖼 PDF · 인쇄는 그림(글자 층 없음) */
import 애드핏칸 from '../애드핏칸.jsx'   /* 💰 애드핏 «가운데» 칸 — 소장님 「페이지 마다」 */
import 쿠팡카드줄 from '../쿠팡카드줄.jsx'   /* 🛒 쿠팡 «가운데» 줄 — 소장님 「페이지마다 다 넣어 쿠팡도 넣고」 */

const 열쇠 = 'kcm_teukgo'
/* 🩹 G789 극한 시험(11-19 소장님 「극한 테스트 해줘」) — 폰 시계가 2026년 7월 앞이면(틀린 시계) 고를 달에 이번 달이 없어 «7월분부터» 알림만 뜨고
   목록은 7월로 보여 다시 고를 수도 없었음 → 처음 달은 «이번 달과 2026년 7월 가운데 늦은 것» */
const 첫달 = () => { const d = 이번달(); return d < 처음달 ? 처음달 : d }
const 빈것 = () => ({ 직종: 'gigye', 달: 첫달(), 꼴: 'days', 날: '', 늦게: false, 명: '1' })
function 읽기() {
  try {
    const o = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (o && typeof o === 'object') {
      const v = { ...빈것(), ...o }
      if (!/^\d{4}-\d{2}$/.test(String(v.달)) || v.달 < 처음달) v.달 = 첫달()   /* 옛 달 · 망가진 값 → 이번 달(2026년 7월 앞이면 7월) */
      return v
    }
  } catch (e) { /* 막힘 */ }
  return 빈것()
}
function 쓰기(st) { try { localStorage.setItem(열쇠, JSON.stringify(st)); return true } catch (e) { return false } }
const 굵게 = (s) => String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
const 숫자 = (v, 길이 = 3) => String(v ?? '').replace(/[^\d]/g, '').slice(0, 길이)
const 문자 = (x) => (x === null || x === undefined ? '' : String(x))

function 두단추({ 값, 바꿈, 하나, 둘, 이름 }) {
  return (
    <span className="iy-seg" role="group" aria-label={이름}>
      <button type="button" className={값 ? 'on' : ''} aria-pressed={!!값} onClick={() => 바꿈(true)}>{하나}</button>
      <button type="button" className={!값 ? 'on' : ''} aria-pressed={!값} onClick={() => 바꿈(false)}>{둘}</button>
    </span>
  )
}

export default function Teukgo() {
  const [st, setSt] = useState(() => 읽기())
  const [알림, set알림] = useState('')
  const [되돌릴, set되돌릴] = useState(null)
  const [저장됨, set저장됨] = useState(true)
  const [지움물음, set지움물음] = useState(false)
  useEffect(() => { document.title = '특고(노무제공자) 산재 · 고용보험료 계산기 — 건설기계 · 건설현장 화물차 | K-건설맵' }, [])
  useEffect(() => { set저장됨(쓰기(st)) }, [st])

  const 달들 = useMemo(() => { const a = 고를달들(); return a.includes(st.달) || st.달 < a[0] ? a : [...a, st.달].sort() }, [st.달])
  const R = useMemo(() => 특고셈(st), [st])
  const 바꿈 = (k, v) => setSt((s) => ({ ...s, [k]: v }))
  const 직 = 직종들.find((x) => x.k === st.직종) || 직종들[0]
  const 사례 = (c) => {
    if (st.날 || st.꼴 === 'month' || st.직종 !== 'gigye') set되돌릴(st)
    setSt({ ...빈것(), 달: st.달, ...Object.fromEntries(Object.entries(c.i).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v])) })
    set알림(`🧪 예시 «${c.t}» 로 채웠습니다.`)
    세기('|특고|예시')
  }
  const 적음 = st.꼴 === 'month' || !!st.날
  /* 🖼 PDF · 인쇄는 그림 — 화면(.wrap.tg)을 복제본에서 인쇄 CSS(@media print — .sl-in · .sl-guide · .iy-exd · .no-print 숨음)로 펴서 · A4 세로 */
  const 오늘글 = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const 그 = use그림인쇄(`특고보험료_${오늘글}`, { 셈: '특고', 대상: '.wrap.tg', 몸표: [], 쪽: { 폭: 186, 높: 271 }, 여백: [12, 12], 칸줄: true })

  return (
    <>
    <div className="kcm-인쇄안내">🖨 보험료 셈은 화면의 <b>«📄 PDF»</b> 또는 <b>«🖨 인쇄»</b> 단추로 인쇄해 주세요.</div>
    <div className="wrap sl tg 그림만인쇄">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🚜 특고 산재 · 고용보험료 계산기 — 건설기계 · 건설현장 화물차</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          장비 기사(노무제공자 · 옛 특고)가 <b>몇 월에 며칠</b> 일했는지만 넣으면 산재 · 고용보험료를 <b>본인 몫 · 회사 몫</b>으로 바로 셈합니다.
          실제 받은 돈이 아니라 고용노동부가 정한 기준보수(월 2,813,000원)로 셈하고, 셈식 · 조문까지 보여 드립니다.
        </p>
        <div className="iy-small">💾 이 브라우저에만 저장{저장됨 ? '' : <b className="nm-warn"> — 지금 저장이 막혀 있습니다</b>} · 고용노동부 고시 · 징수법대로 셈 · 고지 · 신고는 근로복지공단</div>
        <details className="iy-exd">
          <summary>👀 예시로 해 보기 ({G.cases.length}가지)</summary>
          <div className="iy-ex sl-ex">
            {G.cases.map((c) => <button key={c.id} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 사례(c)} title={c.q}>{c.t}</button>)}
          </div>
        </details>
        <div className="iy-links no-print">
          <a href="#eolma" onClick={() => { const d = document.getElementById('eolma'); if (d) d.open = true }}>📘 셈 자세히</a>
          <Link to="/tools/boheomryo">🧾 건설업 보험료 계산기</Link>
          <Link to="/tools/equip">🚜 장비 임대료 장부</Link>
          <Link to="/tools/haemada">🗓 해마다 바뀌는 값</Link>
          {!지움물음 && 적음 && <button type="button" className="tp-x" onClick={() => set지움물음(true)}>처음부터</button>}
          {지움물음 && <span className="nm-ask">적은 것을 지웁니다.
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setSt(빈것()); set지움물음(false); set알림(''); set되돌릴(null) }}>지우기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(false)}>그대로</button></span>}
        </div>
        {알림 && <div className="note sm no-print" style={{ marginTop: 8 }} role="status">{알림}
          {되돌릴 && <> <button type="button" className="tp-x iy-undo" onClick={() => { setSt(되돌릴); set되돌릴(null); set알림('적어 두셨던 것으로 되돌렸습니다.') }}>↩ 내가 적어 둔 것으로 되돌리기</button></>}
        </div>}
      </div>

      <div className="card sl-in">
        <div className="detail-h" style={{ margin: 0 }}>🚜 누가 · 언제</div>
        <div className="sl-row">
          <span className="sl-k">직종</span>
          <두단추 값={st.직종 !== 'hwamul'} 바꿈={(v) => 바꿈('직종', v ? 'gigye' : 'hwamul')} 하나="🚜 건설기계 조종사" 둘="🚚 건설현장 화물차" 이름="직종" />
        </div>
        <div className="iy-small" style={{ marginTop: 2 }}>{직.설명}{직.고용 ? ' — 산재 · 고용보험' : ' — 산재보험만'}</div>
        <div className="sl-grid">
          <label>몇 월분
            <select className="inp sl-sel" value={st.달} onChange={(e) => 바꿈('달', e.target.value)} aria-label="몇 월분">
              {달들.map((d) => <option key={d} value={d}>{달글(d)}</option>)}
            </select>
            <small>보험료를 셈할 달(2026년 7월분부터)</small>
          </label>
        </div>
        <div className="sl-row">
          <span className="sl-k">일한 기간</span>
          <두단추 값={st.꼴 !== 'month'} 바꿈={(v) => 바꿈('꼴', v ? 'days' : 'month')} 하나="며칠만(한 달이 안 되는 계약)" 둘="한 달 내내" 이름="일한 기간" />
        </div>
        {st.꼴 !== 'month' && <div className="sl-grid">
          <label>일한 날
            <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.날} onChange={(e) => 바꿈('날', 숫자(e.target.value, 2))} placeholder="예: 4" aria-label="일한 날" /><i>일</i></span>
            <small>그 달에 장비를 몰고 일한 날(1~30일)</small>
          </label>
        </div>}
        {st.직종 !== 'hwamul' && <div className="sl-row">
          <label className="sl-chk"><input type="checkbox" checked={!!st.늦게} onChange={(e) => 바꿈('늦게', e.target.checked)} /> 만 65세가 넘어서 새로 계약함(고용보험 없음)</label>
        </div>}
        <details className="sl-more">
          <summary>더 — 같은 조건 여러 명</summary>
          <div className="sl-row">
            <label className="sl-inl">같은 조건 사람 수
              <span className="sl-unit"><input className="inp" inputMode="numeric" value={st.명} onChange={(e) => 바꿈('명', 숫자(e.target.value, 3))} placeholder="1" aria-label="같은 조건 사람 수" style={{ width: 70 }} /><i>명</i></span></label>
          </div>
        </details>
      </div>

      {적음 && <div className="card sl-out" id="tg-result">
        {R.빈 ? <div className="sl-res need" role="status">📝 {R.까닭}</div> : <>
          <div className="tg-sum">{R.직.아이콘} {R.직.이름} · {달글(R.달)} · {R.꼴 === 'month' ? '한 달 내내' : `${R.날}일(한 달이 안 되는 계약)`}{R.명 > 1 ? ` · ${R.명}명` : ''}</div>
          <div className="sl-res yes" role="status">본인 몫 {원(R.본인)}원 · 회사 몫 {원(R.회사)}원 <small style={{ fontWeight: 600 }}>(합 {원(R.합)}원)</small></div>
          <div className="sl-facts">
            <div><span>💵 보수액(셈 바탕)</span><b>{R.산재.식}</b>
              <small>{R.꼴 === 'month' ? '기준보수 한 달 — 실제 받은 돈이 아님(징수법 제48조의6③ 단서)' : '일한 날 × 하루 몫(월 보수액 ÷ 30)'}</small></div>
            <div><span>🩹 산재보험 {R.산재.율글}</span><b>본인 {원(R.산재.본인)}원 · 회사 {원(R.산재.회사)}원</b>
              <small>{R.산재.몫식} — 직종 {R.산재.직종글} + 출퇴근 {R.산재.출퇴근글}, 반씩 · 10원 미만 버림</small></div>
            {R.고용.대상
              ? <div><span>🧾 고용보험 {R.고용.율글}</span><b>본인 {원(R.고용.본인)}원 · 회사 {원(R.고용.회사)}원</b>
                <small>{R.고용.몫식} — 반씩 · 10원 미만 버림{R.고용.단기 ? ' · 단기노무제공자' : ''}</small></div>
              : <div><span>🧾 고용보험</span><b>없음</b><small>{R.고용.까닭}</small></div>}
            {R.명 > 1 && <div><span>👥 {R.명}명</span><b>본인 {원(R.본인)}원 · 회사 {원(R.회사)}원</b>
              <small>한 사람 몫(본인 {원(R.본인 / R.명)}원 · 회사 {원(R.회사 / R.명)}원) × {R.명}명</small></div>}
          </div>
          {R.알림.map((x) => <div key={x} className="note sm" style={{ marginTop: 8 }}>{x}</div>)}
          <div className="note sm" style={{ marginTop: 8 }}>ℹ️ 회사가 본인 몫까지 둘 다 내고, 본인 몫은 보수에서 공제한 뒤 공제계산서를 줍니다(징수법 제48조의6⑩⑪). 건설업은 개산 · 확정보험료로 냅니다.
            {R.꼴 === 'days' && ' 매달 고지받는 사업은 월 중간에 시작한 달을 그다음 달부터 매깁니다(징수법 제16조의4 — 2027년부터는 시작한 날부터).'}</div>
          <div className="detail-h" style={{ margin: '14px 0 6px' }}>까닭</div>
          <ul className="sl-why">
            {R.요건.map((x) => <li key={x.글} className={x.ok ? 'ok' : 'bad'}><span className="sl-ic" aria-hidden>{x.ok ? '✅' : '➖'}</span><div><p>{x.글}</p></div></li>)}
          </ul>
          <div className="sl-btns no-print">
            <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!!그.찍기} onClick={() => 그.PDF()}>{그.찍기 === 'pdf' ? 'PDF 만드는 중…' : '📄 PDF'}</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!!그.찍기} onClick={() => 그.인쇄()}>{그.찍기 === '인쇄' ? '준비 중…' : '🖨 인쇄'}</button>
          </div>
          {그.말 && <div className="note sm no-print tg-찍말" style={{ marginTop: 8 }} role="status">{그.말}</div>}
        </>}
      </div>}

      {/* 💰 애드핏 «가운데» — 도구를 다 쓴 뒤 · 설명 앞 */}
      <애드핏칸 key="mid-teukgo" 자리="중" />
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
        <p className="cp" style={{ fontSize: 12.5 }}>근거(국가법령정보센터 · 근로복지공단 · {문자(G.updated).replace(/^(\d{4})-0?(\d+)-0?(\d+)$/, '$1.$2.$3.')} 확인): {G.laws.map(([t, u], k) => <span key={u}>{k ? ' · ' : ''}<a href={u} target="_blank" rel="noopener noreferrer">{t}</a></span>)}</p>
      </div>
      {/* 🛒 쿠팡 «가운데» 줄 — 설명 다음 */}
      <쿠팡카드줄 key="cmid-teukgo" 자리="중" />
    </div>
    </>
  )
}
