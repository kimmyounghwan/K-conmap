import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 공제칸, 요율 } from '../lib/gongje.js'
import { 읽기, 쓰기, 빈것, 새번호, 달셈, 칸바꿈, 줄채움, 달값, 예시, 공수차례, 달날수, 요일, 달더하기, 원, 공수글 } from '../lib/nomubi.js'

/**
 * 👷 /tools/nomubi — 일용 노무비 계산기 · 지급명세서 (G104 · 2026-10-01)
 *
 * 소장님: 「인터넷 싹 다 뒤져서. 관련 기관 다 보고, 서식 검색량이 많은 것 사이트에 올리자. 프로그램화 해서」
 *   → 수요 조사(예스폼 «일용노무비·급여(소득세·4대보험)» 누적 조회 103만 — 2등) → 고르심 «일용 노무비 계산·지급명세서»
 *
 * ■ 하는 일: 명단(이름 · 직종 · 일당) + 출역(날짜 칸을 누를 때마다 1 → 0.5 → 1.5 → 빈칸)
 *   → 소득세 · 지방소득세 · 고용 · 국민연금 · 건강 · 장기요양 공제와 실지급액 → 지급명세서(A4 가로 인쇄) · 신고용 집계.
 * ■ 공제 셈은 lib/gongje.js 하나(투입비 도구와 같음). 화면 모양도 투입비 청구서(tp-*)를 그대로 씁니다.
 * ■ 저장은 이 브라우저(localStorage)만 — 서버에 안 보냄 · 주민번호 · 계좌는 받지 않음.
 * ■ 엑셀 받기 없음 · 인쇄만 — 소장님(2026-09-26): 「프로그램으로 해서 만든 거는 … 다운 받을 수 없게 … 프린트만 가능하게 … 수정이나 입력은 건설맵에서」
 * ■ 신고 기한(원문 확인 2026-10-01 · 국가법령정보센터):
 *   · 근로내용 확인신고서 — 다음 달 15일까지 (고용보험법 시행령 제7조제1항 후단)
 *   · 이것을 내면 일용근로소득 지급명세서를 낸 것으로 봄 (소득세법 시행령 제213조제4항)
 *   · 따로 낼 때 지급명세서 — 지급일이 속하는 달의 다음 달 말일까지 (소득세법 제164조제1항 단서)
 */

function 한글금액(n) {
  const 숫 = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const 작 = ['', '십', '백', '천']
  const 큰 = ['', '만', '억', '조']
  let v = Math.round(Math.abs(n || 0))
  if (!v) return '영'
  const 조각 = []
  let i = 0
  while (v > 0) {
    const 네 = v % 10000
    if (네) {
      let s = ''
      String(네).padStart(4, '0').split('').forEach((c, j) => { const d = Number(c); if (d) s += 숫[d] + 작[3 - j] })
      조각.unshift(s + 큰[i])
    }
    v = Math.floor(v / 10000); i++
  }
  return (n < 0 ? '마이너스 ' : '') + 조각.join('')
}

const 숫자만 = (s) => { const v = Number(String(s ?? '').replace(/[^\d]/g, '')); return Number.isFinite(v) ? v : 0 }
const 빼기들 = [['P', '연금'], ['H', '건강'], ['E', '고용'], ['T', '소득세']]
const 두자 = (n) => String(n).padStart(2, '0')
const 달글 = (ym) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`

export default function Nomubi() {
  const [st, setSt] = useState(() => 읽기())
  const [저장됨, set저장됨] = useState(true)
  const [편집, set편집] = useState(null)        // { id, k } 공제 칸 고치기
  const [알림, set알림] = useState('')
  const [지움물음, set지움물음] = useState(false)
  useEffect(() => { set저장됨(쓰기(st)) }, [st])
  useEffect(() => {
    const 끝 = () => document.body.classList.remove('tp-print-bill')
    window.addEventListener('afterprint', 끝)
    return () => { window.removeEventListener('afterprint', 끝); 끝() }
  }, [])
  const ym = st.ym
  const N = useMemo(() => 달셈(st, ym), [st, ym])
  const R = 요율(ym)
  const 날수 = 달날수(ym)
  const 날들 = Array.from({ length: 날수 }, (_, i) => i + 1)
  const 바꿈 = (f) => setSt((s) => f(s))
  const 사람고침 = (id, k, v) => 바꿈((s) => ({ ...s, P: s.P.map((p) => (p.id === id ? { ...p, [k]: v } : p)) }))
  const 사람더함 = () => 바꿈((s) => ({ ...s, P: [...s.P, { id: 새번호(), n: '', j: '', w: 0, nx: '' }] }))
  const 사람뺌 = (id) => 바꿈((s) => ({ ...s, P: s.P.filter((p) => p.id !== id) }))
  const 칸누름 = (id, i) => {
    const g = (N.줄.find((r) => r.id === id) || { 공수: [] }).공수[i] || 0
    const 다음 = g === 0 ? 1 : 공수차례[(공수차례.indexOf(g) + 1) % 공수차례.length]
    바꿈((s) => 칸바꿈(s, ym, id, 두자(i + 1), 다음))
  }
  const 공수표 = (id) => {
    const r = N.줄.find((x) => x.id === id)
    if (r) return r.공수
    const d = ((st.A[ym] || {})[id] || {}).d || {}
    return 날들.map((i) => Number(d[두자(i)]) || 0)
  }
  const 대상누름 = (r, c) => {
    const d = r.대상[c]
    if (d.이유 === '명부에서 뺌') { set알림(`${r.p.n || '이 사람'} 은(는) 명부에서 이 공제를 늘 빼 두었습니다 — 위 명부의 «늘 빼기» 를 끄십시오.`); return }
    set알림('')
    let ap = r.ap.replace(c, ''), ex = r.ex.replace(c, '')
    if (!d.손) { if (d.대상) ex += c; else ap += c }
    바꿈((s) => 달값(s, ym, r.id, { ap, ex }))
  }
  const 공제저장 = (id, k, s) => {
    set편집(null)
    const r = N.줄.find((x) => x.id === id)
    const o = { ...((r && r.고침) || {}) }
    if (s === null) delete o[k]
    else o[k] = 숫자만(s)
    바꿈((x) => 달값(x, ym, id, { o }))
  }
  const 인쇄 = () => { document.body.classList.add('tp-print-bill'); setTimeout(() => window.print(), 80) }
  const 안됨 = N.줄.filter((r) => !r.대상.P.대상 || !r.대상.H.대상)

  return (
    <div className="wrap tp nm">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>👷 일용 노무비 계산기 · 지급명세서</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          이름 · 직종 · 일당을 적고 <b>일한 날을 누르면</b> 소득세 · 지방소득세 · 고용보험 · 국민연금 · 건강보험 · 장기요양 공제와
          <b> 실지급액</b>이 저절로 나옵니다. 지급명세서를 <b>A4 가로로 인쇄</b>하고, 근로내용 확인신고에 옮겨 적을 집계도 함께 나옵니다.
        </p>
        <div className="nm-badges">
          <span>회원가입 없음 · 무료</span>
          <span>💾 이 브라우저에만 저장 {저장됨 ? '' : <b className="nm-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
          <span>🔒 주민번호 · 계좌는 받지 않습니다</span>
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {st.P.length === 0 && <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => setSt(예시(ym))}>예시로 채워 보기</button>}
          {st.P.length > 0 && !지움물음 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(true)}>처음부터 (모두 지우기)</button>}
          {지움물음 && (
            <span className="nm-ask">명단과 모든 달의 출역을 지웁니다.
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setSt({ ...빈것(), ym }); set지움물음(false) }}>지우기</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(false)}>그대로 두기</button>
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <div className="nm-month">
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((s) => ({ ...s, ym: 달더하기(s.ym, -1) }))} aria-label="지난달">◀</button>
          <b>{달글(ym)}</b> <span className="muted">귀속</span>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((s) => ({ ...s, ym: 달더하기(s.ym, 1) }))} aria-label="다음 달">▶</button>
        </div>
        <div className="nm-two">
          <label>회사명<input className="inp" value={st.co} maxLength={40} onChange={(e) => 바꿈((s) => ({ ...s, co: e.target.value }))} placeholder="예: ○○건설(주)" /></label>
          <label>현장명<input className="inp" value={st.site} maxLength={60} onChange={(e) => 바꿈((s) => ({ ...s, site: e.target.value }))} placeholder="예: ○○지구 배수로 정비공사" /></label>
        </div>
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>👥 명단 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 달이 바뀌어도 그대로 이어 씁니다</span></div>
        <div className="tp-scroll">
          <table className="tbl nm-roster">
            <thead><tr><th>No</th><th>이름</th><th>직종</th><th>일당(원)</th><th>늘 빼기 <small className="muted">(그 사람은 늘 안 뗌)</small></th><th /></tr></thead>
            <tbody>
              {st.P.map((p, i) => (
                <tr key={p.id}>
                  <td className="r">{i + 1}</td>
                  <td><input className="inp nm-in" value={p.n} maxLength={20} onChange={(e) => 사람고침(p.id, 'n', e.target.value)} placeholder="이름" aria-label={`${i + 1}번 이름`} /></td>
                  <td><input className="inp nm-in" value={p.j} maxLength={20} onChange={(e) => 사람고침(p.id, 'j', e.target.value)} placeholder="직종" aria-label={`${i + 1}번 직종`} /></td>
                  <td><input className="inp nm-in nm-num" value={p.w ? 원(p.w) : ''} inputMode="numeric" onChange={(e) => 사람고침(p.id, 'w', 숫자만(e.target.value))} placeholder="0" aria-label={`${i + 1}번 일당`} /></td>
                  <td className="nw">
                    {빼기들.map(([c, 이름]) => {
                      const on = (p.nx || '').includes(c)
                      return (
                        <button key={c} type="button" className={'tp-ins ' + (on ? 'n' : 'y')} aria-pressed={on}
                          title={on ? `${이름} — 늘 뺌 (누르면 다시 셈)` : `${이름} — 셈함 (누르면 늘 뺌)`}
                          onClick={() => 사람고침(p.id, 'nx', on ? (p.nx || '').replace(c, '') : (p.nx || '') + c)}>{이름}{on ? '✕' : '✓'}</button>
                      )
                    })}
                  </td>
                  <td><button type="button" className="tp-x" onClick={() => 사람뺌(p.id)} aria-label={`${p.n || i + 1 + '번'} 지우기`}>지우기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 8 }} onClick={사람더함}>＋ 사람 더하기</button>
        {st.P.length === 0 && <div className="note sm" style={{ marginTop: 8 }}>«＋ 사람 더하기» 로 이름 · 직종 · 일당을 적거나, 위의 «예시로 채워 보기» 로 먼저 둘러보십시오.</div>}
      </div>

      {st.P.length > 0 && (
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>📅 {달글(ym)} 출역 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 칸을 누를 때마다 1 → 0.5 → 1.5 → 빈칸</span></div>
          <div className="tp-scroll">
            <table className="tbl tp-grid">
              <thead>
                <tr>
                  <th className="stk">이름</th>
                  {날들.map((i) => { const w = 요일(ym, i); return <th key={i} className={w === '일' ? 'sun' : w === '토' ? 'sat' : ''}>{i}<br /><small>{w}</small></th> })}
                  <th>공수</th><th>일수</th><th className="nw">한 번에</th>
                </tr>
              </thead>
              <tbody>
                {st.P.map((p) => {
                  const g = 공수표(p.id)
                  const 합 = g.reduce((s, x) => s + x, 0)
                  return (
                    <tr key={p.id}>
                      <td className="stk nw"><b>{p.n || '(이름)'}</b> <small className="muted">{p.j}</small></td>
                      {g.map((x, i) => (
                        <td key={i} className={'tp-gc' + (x > 0 ? ' on' : '') + (x > 0 && x !== 1 ? ' part' : '')} onClick={() => 칸누름(p.id, i)}
                          role="button" aria-label={`${p.n} ${i + 1}일 ${x > 0 ? 공수글(x) + '공수' : '빈칸'}`}>{x > 0 ? 공수글(x) : ''}</td>
                      ))}
                      <td className="r">{공수글(합)}</td><td className="r">{g.filter((x) => x > 0).length}</td>
                      <td className="nw">
                        <button type="button" className="tp-x" onClick={() => 바꿈((s) => 줄채움(s, ym, p.id, true))}>일요일 빼고 모두</button>
                        <button type="button" className="tp-x" onClick={() => 바꿈((s) => 줄채움(s, ym, p.id, false))}>지움</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {st.P.some((p) => !p.w) && <div className="note sm" style={{ marginTop: 6 }}>⚠️ 일당이 0원인 사람이 있습니다 — 명단에서 일당을 적어야 금액과 공제가 나옵니다.</div>}
        </div>
      )}

      {N.줄.length > 0 && (
        <div className="card tp-bill">
          <div className="btn-row no-print" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 지급명세서 인쇄 (A4 가로)</button>
            <span className="muted" style={{ fontSize: 12.5, alignSelf: 'center' }}>인쇄하면 출역 대장 · 지급 명세 · 신고용 집계가 함께 나옵니다.</span>
          </div>
          <div className="tp-bill-hd">
            <h2 className="tp-bill-h">일용노무비 지급명세서 ({달글(ym)})</h2>
            <table className="tbl tp-sign"><tbody><tr><th>작성</th><th>검토</th><th>현장소장</th></tr><tr><td /><td /><td /></tr></tbody></table>
          </div>
          <table className="tbl tp-bill-top">
            <tbody>
              <tr><th>회사명</th><td>{st.co || <span className="muted no-print">위에 회사명을 넣으십시오</span>}</td><th>현장명</th><td>{st.site}</td>
                <th>귀속 기간</th><td className="nw">{ym}-01 ~ {ym}-{두자(날수)}</td></tr>
              <tr><th>지급 총액</th><td colSpan={5}><b>일금 {한글금액(N.합계.차인)} 원정 (₩{원(N.합계.차인)})</b> <span className="muted">— 노무비 {원(N.합계.보수)}원에서 공제 {원(N.합계.합)}원을 뺀 실지급액</span></td></tr>
            </tbody>
          </table>

          <div className="nm-printonly">
            <div className="tp-bill-sub">① 출역 대장</div>
            <table className="tbl tp-grid">
              <thead>
                <tr><th className="stk">성명</th>{날들.map((i) => <th key={i}>{i}</th>)}<th>공수</th><th>일수</th></tr>
              </thead>
              <tbody>
                {N.줄.map((r) => (
                  <tr key={r.id}><td className="stk nw">{r.p.n}</td>{r.공수.map((g, i) => <td key={i}>{g > 0 ? 공수글(g) : ''}</td>)}
                    <td className="r">{공수글(r.공수합)}</td><td className="r">{r.일수}</td></tr>
                ))}
                <tr className="sum"><td className="stk">합계 {N.합계.인원}명</td>{N.날합.map((n, i) => <td key={i}>{n || ''}</td>)}
                  <td className="r">{공수글(N.합계.공수)}</td><td className="r">{N.합계.일수}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="tp-bill-sub"><span className="nm-printonly-inline">② </span>지급 명세 <span className="muted no-print">— 보험 단추를 누르면 이 달만 넣고 빼며, 공제 칸을 누르면 금액을 고쳐 씁니다 (🟨 = 손으로 고친 칸)</span></div>
          <div className="tp-billsum">
            <div><span>노무비 (보수 총액)</span><b>{원(N.합계.보수)}</b></div>
            <div className="minus"><span>공제 합계</span><b>− {원(N.합계.합)}</b><i>{공제칸.map((c) => `${c.이름} ${원(N.합계[c.k])}`).join(' · ')}</i></div>
            <div className="pay"><span>실지급액 (차인지급액)</span><b>{원(N.합계.차인)}</b><i>공제를 뺀, 근로자에게 줄 돈</i></div>
          </div>
          <div className="tp-inssum">
            <b>4대보험 대상</b> — 국민연금 <b>{N.합계.대상수.P}명</b> · 건강·요양 <b>{N.합계.대상수.H}명</b> · 고용 <b>{N.합계.대상수.E}명</b> / 전체 {N.합계.인원}명
            {안됨.length > 0 && <> · <span className="muted">대상 아님: {안됨.map((r) => `${r.p.n}(${[!r.대상.P.대상 && '연금', !r.대상.H.대상 && '건강'].filter(Boolean).join('·')} — ${r.대상.P.대상 ? r.대상.H.이유 : r.대상.P.이유})`).join(', ')}</span></>}
          </div>
          {알림 && <div className="note sm no-print" role="status">{알림}</div>}
          <div className="tp-scroll">
            <table className="tbl tp-lb">
              <thead>
                <tr>
                  <th>No</th><th>성명</th><th>직종</th><th>일수</th><th>공수</th><th>일당</th><th>노무비</th><th>4대보험 대상</th>
                  {공제칸.map((c) => <th key={c.k}>{c.이름}</th>)}
                  <th>공제계</th><th>실지급액<br /><small>(차인지급액)</small></th><th className="nm-sigh">영수 (서명)</th>
                </tr>
              </thead>
              <tbody>
                {N.줄.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td className="nw"><b>{r.p.n}</b></td>
                    <td className="nw">{r.p.j}</td>
                    <td className="r">{r.일수}</td>
                    <td className="r">{공수글(r.공수합)}</td>
                    <td className="r">{원(r.w)}</td>
                    <td className="r"><b>{원(r.보수)}</b></td>
                    <td className="nw tp-insc">
                      {[['P', '연금'], ['H', '건강'], ['E', '고용']].map(([c, 이름]) => {
                        const d = r.대상[c]
                        return (
                          <button key={c} type="button" className={'tp-ins ' + (d.대상 ? 'y' : 'n') + (d.손 ? ' hand' : '')}
                            title={`${이름}: ${d.대상 ? '대상' : '대상 아님'} — ${d.이유}${d.이유 === '명부에서 뺌' ? '' : d.손 ? ' (누르면 자동으로)' : d.대상 ? ' (누르면 이 달만 빼기)' : ' (누르면 이 달만 넣기)'}`}
                            onClick={() => 대상누름(r, c)}>{이름}{d.대상 ? '✓' : '✕'}{d.손 ? '✎' : ''}</button>
                        )
                      })}
                      <small className="tp-insr">{r.대상.P.대상 && r.대상.H.대상 ? r.대상.P.이유 : !r.대상.P.대상 && !r.대상.H.대상 ? r.대상.P.이유 : `연금 ${r.대상.P.이유} · 건강 ${r.대상.H.이유}`}</small>
                    </td>
                    {공제칸.map((c) => {
                      const 고침 = r.고침[c.k] != null
                      if (편집 && 편집.id === r.id && 편집.k === c.k) {
                        return (
                          <td key={c.k} className="r tp-ded">
                            <input className="tp-dedin" autoFocus defaultValue={원(r.최종[c.k])} inputMode="numeric" aria-label={`${r.p.n} ${c.이름}`}
                              onKeyDown={(e) => { if (e.key === 'Enter') 공제저장(r.id, c.k, e.currentTarget.value); if (e.key === 'Escape') set편집(null) }}
                              onBlur={(e) => 공제저장(r.id, c.k, e.currentTarget.value)} />
                            {고침 && <button type="button" className="tp-x" onMouseDown={(e) => { e.preventDefault(); 공제저장(r.id, c.k, null) }}>자동</button>}
                          </td>
                        )
                      }
                      return (
                        <td key={c.k} className={'r tp-ded' + (고침 ? ' fix' : '')} title={고침 ? `자동 값 ${원(r.자동[c.k])}` : '누르면 고쳐 씁니다'}
                          onClick={() => set편집({ id: r.id, k: c.k })}>{원(r.최종[c.k])}</td>
                      )
                    })}
                    <td className="r">{원(r.최종.합)}</td>
                    <td className="r"><b>{원(r.최종.차인)}</b></td>
                    <td className="nm-sig" />
                  </tr>
                ))}
                <tr className="sum">
                  <td /><td>합계</td><td>{N.합계.인원}명</td><td className="r">{N.합계.일수}</td><td className="r">{공수글(N.합계.공수)}</td><td />
                  <td className="r"><b>{원(N.합계.보수)}</b></td>
                  <td className="nw">연금 {N.합계.대상수.P} · 건강 {N.합계.대상수.H} · 고용 {N.합계.대상수.E}</td>
                  {공제칸.map((c) => <td key={c.k} className="r">{원(N.합계[c.k])}</td>)}
                  <td className="r">{원(N.합계.합)}</td><td className="r"><b>{원(N.합계.차인)}</b></td><td />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="tp-note">
            공제 — {R.해}년 요율: 소득세 (일급 − 15만원) × 2.7%(한 달 합 1천원 미만 안 뗌) · 지방소득세 10% · 고용 {(R.ei * 100).toFixed(1)}% ·
            국민연금 {(R.np * 100).toFixed(2).replace(/0$/, '')}%(이 현장 한 달 8일↑ 또는 220만원↑) · 건강 {(R.hi * 100).toFixed(3)}% ·
            장기요양 건강보험료 × {(R.lc * 100).toFixed(2)}%(8일↑) · 10원 미만 버림.
            {N.잠정 && N.잠정.length > 0 && <b> ⚠️ {N.잠정.join('·')} 요율은 아직 확정 전이라 앞해 값으로 셈했습니다.</b>}
            {N.요율없음 && <b> ⚠️ 이 해의 요율은 아직 없어 {N.요율해}년 요율로 셈했습니다.</b>}
            {' '}다른 현장 근무(국민연금은 회사 합산) · 나이 등은 모르니 보험 단추로 넣고 빼고, 신고 전 한 번 더 확인하십시오.
          </div>

          <div className="tp-pb" />
          <div className="tp-bill-sub"><span className="nm-printonly-inline">③ </span>신고용 집계 — 근로내용 확인신고 · 일용근로소득 지급명세서</div>
          <div className="tp-scroll">
            <table className="tbl nm-rep">
              <thead>
                <tr><th>No</th><th>성명</th><th>직종</th><th>근로일 ({Number(ym.slice(5, 7))}월)</th><th>근로일수</th><th>지급액(보수 총액)</th><th>소득세</th><th>지방소득세</th></tr>
              </thead>
              <tbody>
                {N.줄.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td><td className="nw">{r.p.n}</td><td className="nw">{r.p.j}</td>
                    <td className="nm-days">{r.날들.join(', ')}</td>
                    <td className="r">{r.일수}</td><td className="r">{원(r.보수)}</td><td className="r">{원(r.최종.it)}</td><td className="r">{원(r.최종.lt)}</td>
                  </tr>
                ))}
                <tr className="sum"><td /><td>합계</td><td>{N.합계.인원}명</td><td /><td className="r">{N.합계.일수}</td>
                  <td className="r">{원(N.합계.보수)}</td><td className="r">{원(N.합계.it)}</td><td className="r">{원(N.합계.lt)}</td></tr>
              </tbody>
            </table>
          </div>
          <ul className="tp-note nm-due">
            <li><b>근로내용 확인신고서</b>(근로복지공단 · 고용·산재 토탈서비스) — 일한 달의 <b>다음 달 15일까지</b> (고용보험법 시행령 제7조제1항 후단).
              {' '}<span className="nm-due-d">{달글(ym)} 분 → {달글(달더하기(ym, 1))} 15일까지</span></li>
            <li>근로내용 확인신고서에 국세청 칸(지급액 · 소득세 · 지방소득세)까지 적어 내면 <b>일용근로소득 지급명세서를 낸 것으로 봅니다</b> (소득세법 시행령 제213조제4항).</li>
            <li>지급명세서를 따로 낼 때는 <b>지급한 달의 다음 달 말일까지</b> (소득세법 제164조제1항 단서) — 홈택스.</li>
            <li>주민등록번호 · 직종 부호 · 근로시간 같은 칸은 신고 화면에서 넣으십시오. 이 화면은 그 숫자를 옮겨 적기 위한 집계입니다.</li>
          </ul>
        </div>
      )}

      <details className="card js-more">
        <summary className="sec-title">쓰는 방법 · 알아 두실 것</summary>
        <ul className="flist" style={{ marginBottom: 0 }}>
          <li><b>명단</b>에 이름 · 직종 · 일당을 적습니다. 다음 달에도 명단은 그대로 이어집니다.</li>
          <li><b>출역</b> 칸을 누를 때마다 <b>1공수 → 0.5 → 1.5 → 빈칸</b>. 날마다 같이 나오면 «일요일 빼고 모두» 를 누른 뒤 안 나온 날만 지우십시오.</li>
          <li><b>소득세</b>는 날마다 따로 셉니다 — 그날 받은 돈에서 15만원을 빼고 6% 의 45%(근로소득세액공제 55% 뺌), 한 달 합이 1천원 미만이면 떼지 않습니다(소액부징수).
            하루 15만원 이하면 소득세가 없습니다.</li>
          <li><b>국민연금</b>은 한 달 8일 이상 또는 220만원 이상, <b>건강보험 · 장기요양</b>은 한 달 8일 이상일 때 셉니다. 다른 현장에서 일한 날을 합쳐야 하는 경우 ·
            나이(연금 60세 이상 등) · 외국인처럼 이 화면이 모르는 것은 «4대보험 대상» 단추로 그 달만 넣고 빼거나, 명단의 «늘 빼기» 를 켜십시오.</li>
          <li>공제 칸을 누르면 금액을 고쳐 쓸 수 있습니다(🟨). «자동» 을 누르면 다시 셈한 값으로 돌아갑니다.</li>
          <li>적은 것은 <b>이 브라우저에만</b> 남습니다. 다른 기기에서 같이 보려면 현장 단위로 서버에 저장하는 <Link to="/tools/tuipbi">현장 투입비 · 공사일보</Link>(노무비 청구내역서 포함)를 쓰십시오.</li>
          <li>엑셀로 쓰실 분은 서식 <Link to="/forms/nomubi">노무비 지급확인서</Link> · <Link to="/forms/imgeum-daejang">임금대장</Link> 이 있습니다.</li>
        </ul>
      </details>
    </div>
  )
}
