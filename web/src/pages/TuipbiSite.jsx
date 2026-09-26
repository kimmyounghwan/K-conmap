/**
 * 🏗 현장 투입비 · 공사일보 — 현장 화면 (2026-09-26)
 *   탭: 📊 한눈에 · ✍️ 적기(날마다) · 🧾 달마다 청구서 · 👷 명부 · 📈 기성·공정률 · 📜 적은 것 · ❓ 쓰는 방법
 *   청구서·명부는 TuipbiBook.jsx, 데이터 읽기·쓰기는 Tuipbi.jsx 가 합니다.
 */
import { useMemo, useState } from 'react'
import { 구분, 구분이름, 기성, 원, 억만, 퍼센트, 공수글, 오늘, 요약, 날더하기, 요일, 자재단위, 단위들 } from '../lib/tuipbi.js'
import TuipbiBook from './TuipbiBook.jsx'

const 숫자만 = (s) => Number(String(s || '').replace(/[^0-9.-]/g, '')) || 0
const 쉼표칸 = (s) => { const n = String(s || '').replace(/[^0-9]/g, ''); return n ? 원(Number(n)) : '' }
const 공수차례 = [1, 0.5, 1.5, 0]                        // 누를 때마다

const 탭들 = [
  ['home', '📊 한눈에'], ['day', '✍️ 적기'], ['bill', '🧾 달마다 청구서'], ['book', '👷 명부'],
  ['gisung', '📈 기성·공정률'], ['list', '📜 적은 것'], ['help', '❓ 쓰는 방법'],
]

export default function TuipbiSite(P) {
  const { 현장, 줄들, 출역, 예시 } = P
  const [탭, set탭] = useState(() => { try { return sessionStorage.getItem('kcm-tp-tab') || 'home' } catch (e) { return 'home' } })
  const 가기 = (t) => { set탭(t); try { sessionStorage.setItem('kcm-tp-tab', t) } catch (e) { /* 없음 */ } window.scrollTo({ top: 0 }) }
  const S = useMemo(() => 요약(현장, 줄들, 오늘(), 출역), [현장, 줄들, 출역])
  return (
    <>
      {예시 && <div className="card tp-ex no-print">🧪 <b>예시 현장입니다</b> — 이름·금액·주민번호·계좌 모두 지어낸 것이고, 적거나 지워도 저장되지 않습니다. 탭을 눌러 둘러보십시오. <button type="button" className="chip" onClick={P.나가기}>처음으로</button></div>}
      <div className="card tp-sitehead">
        <div className="tp-head">
          <div>
            <h1 className="tp-sname">{현장.name}</h1>
            <div className="tp-sub">
              {!예시 && <>현장 코드 <b>{P.코드보기(P.코드)}</b> · </>}
              {현장.start && 현장.end ? <>공사기간 {현장.start} ~ {현장.end}{S.남은날 != null && S.남은날 >= 0 ? ` · 준공까지 ${S.남은날}일` : ''}</> : '공사기간 미입력'}
            </div>
          </div>
          <div className="tp-acts no-print">
            <button type="button" className="chip" onClick={() => window.print()} title="지금 보고 있는 탭을 인쇄합니다 (청구서는 청구서 탭의 인쇄 단추로)">🖨 인쇄</button>
            {!예시 && <button type="button" className="chip" onClick={P.새로고침}>↻ 새로고침</button>}
            <button type="button" className="chip" onClick={() => P.set정보(!P.정보)}>✏️ 현장 정보</button>
            <button type="button" className="chip" onClick={P.나가기}>나가기</button>
          </div>
        </div>
        <div className={'tp-saved no-print' + (P.저장됨 ? ' on' : '')} key={P.저장됨 || 'x'}>
          {예시
            ? <>🧪 예시 현장 — 눌러 보셔도 <b>저장되지 않습니다</b>{P.저장됨 ? ` (마지막으로 누른 때 ${P.저장됨})` : ''}</>
            : P.저장됨
              ? <>✅ <b>{P.저장됨} 저장됨</b> — 자동 저장입니다. 나중에 다시 열어 언제든 고칠 수 있습니다.</>
              : <>💾 <b>자동 저장</b> — 누르고 적는 순간 저장됩니다(저장 단추 없음). 나중에 다시 열어 언제든 고칠 수 있습니다.</>}
        </div>
        {P.정보 && P.정보칸}
        <div className="tp-tabs no-print" role="tablist">
          {탭들.map(([k, t]) => (
            <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'tp-tab' + (탭 === k ? ' on' : '')} onClick={() => 가기(k)}>{t}</button>
          ))}
        </div>
      </div>

      {탭 === 'home' && <Overview S={S} {...P} 가기={가기} />}
      {탭 === 'day' && <Daily S={S} {...P} 가기={가기} />}
      {(탭 === 'bill' || 탭 === 'book') && <TuipbiBook 보기={탭} {...P} 가기={가기} />}
      {탭 === 'gisung' && <Gisung S={S} {...P} />}
      {탭 === 'list' && <RowList {...P} />}
      {탭 === 'help' && <TuipbiGuide 현장안 />}
    </>
  )
}

/* ── 📊 한눈에 ─────────────────────────────── */
function Overview({ S, 현장, 가기 }) {
  const 공정차 = Number.isFinite(S.공정률) && Number.isFinite(S.경과율) ? S.공정률 - S.경과율 : null
  const 투입차 = Number.isFinite(S.경과율) && Number.isFinite(S.투입률) ? S.투입률 - S.경과율 : null
  const 기준원가 = Number.isFinite(S.목표원가율) ? S.목표원가율 : 1
  return (
    <>
      <div className="card">
        <div className="tp-tiles">
          <div className="tp-tile"><span>총공사금액</span><b>{억만(현장.total)}</b><i>{원(현장.total)} 원</i></div>
          <div className="tp-tile main"><span>누적 투입비</span><b>{억만(S.누적)}</b><i>{원(S.누적)} 원 · 총액의 {퍼센트(S.투입률)}</i></div>
          <div className="tp-tile gs"><span>공정률 (기성)</span><b>{퍼센트(S.공정률)}</b><i>{S.기성건 ? `누적 기성 ${억만(S.누적기성)} · ${S.기성일}` : '기성을 적으면 나옵니다'}</i></div>
          <div className={'tp-tile' + (S.남은 < 0 ? ' bad' : '')}><span>남은 금액</span><b>{억만(S.남은)}</b><i>총공사금액 − 누적 투입비</i></div>
        </div>
        <div className="tp-bars">
          <Bar 이름="공정률" v={S.공정률} 글={S.기성건 ? 퍼센트(S.공정률) : '기성 없음'} cls="gs" />
          {Number.isFinite(S.경과율) && <Bar 이름="계획(공기)" v={S.경과율} 글={퍼센트(S.경과율)} cls="time" />}
          <Bar 이름="투입률" v={S.투입률} 글={퍼센트(S.투입률)} cls="in" />
          {현장.budget > 0 && <Bar 이름="실행 대비" v={S.실행률} 글={`${퍼센트(S.실행률)} · 남은 ${억만(S.실행남은)}`} cls="bud" />}
        </div>
        {공정차 !== null ? (
          <div className={'tp-say' + (공정차 < -0.05 ? ' warn' : '')}>
            {Math.abs(공정차) <= 0.05
              ? <>공기는 <b>{퍼센트(S.경과율)}</b> 지났고 공정률은 <b>{퍼센트(S.공정률)}</b> 입니다 — <b>계획대로</b> 가고 있습니다.</>
              : 공정차 < 0
                ? <>⚠️ 공정이 계획보다 <b>{(-공정차 * 100).toFixed(1)}%p 늦습니다</b> (공기 {퍼센트(S.경과율)} · 공정 {퍼센트(S.공정률)}, {S.기성일} 기성 기준).</>
                : <>공정이 계획보다 <b>{(공정차 * 100).toFixed(1)}%p 빠릅니다</b> (공기 {퍼센트(S.경과율)} · 공정 {퍼센트(S.공정률)}).</>}
          </div>
        ) : 투입차 !== null ? (
          <div className={'tp-say' + (투입차 > 0.05 ? ' warn' : '')}>
            공기는 <b>{퍼센트(S.경과율)}</b> 지났고 투입비는 총액의 <b>{퍼센트(S.투입률)}</b> 들었습니다.
            {' '}<button type="button" className="tp-x" onClick={() => 가기('gisung')}>기성을 적으면 공정률과 견줘 드립니다 →</button>
          </div>
        ) : null}
        {Number.isFinite(S.원가율) && (
          <div className={'tp-say' + (S.원가율 > 기준원가 + 0.03 ? ' warn' : ' ok')}>
            {S.원가율 > 기준원가 + 0.03
              ? <>⚠️ {S.기성일} 까지 투입비가 기성의 <b>{퍼센트(S.원가율)}</b> 입니다{Number.isFinite(S.목표원가율) ? <> — 실행예산 비율({퍼센트(S.목표원가율)})보다 많습니다</> : <> — 기성보다 돈이 더 나갔습니다</>}. 손해 쪽으로 가는지 보십시오.</>
              : <>💰 {S.기성일} 까지 기성 100원에 투입비 <b>{Math.round(S.원가율 * 100)}원</b>{Number.isFinite(S.목표원가율) ? <> (실행 기준 {Math.round(S.목표원가율 * 100)}원)</> : null} — 괜찮습니다.</>}
          </div>
        )}
        <div className="tp-mini">
          <span>이번 달 투입 <b>{억만(S.이번달)}</b></span>
          <span>오늘 <b>{억만(S.오늘치)}</b></span>
          <span>오늘 출역 <b>{S.오늘인원}명</b></span>
          <span>누계 연인원 <b>{공수글(S.연인원)}</b></span>
        </div>
      </div>

      <div className="card">
        <div className="detail-h">구분별 투입비</div>
        <div className="tp-stack">
          {구분.map((c) => S.누적 > 0 && S.구분합[c.k] > 0 && (
            <div key={c.k} style={{ width: (S.구분합[c.k] / S.누적) * 100 + '%', background: c.색 }} title={`${c.이름} ${퍼센트(S.구분합[c.k] / S.누적)}`} />
          ))}
        </div>
        <table className="tbl tp-kt">
          <tbody>
            {구분.map((c) => (
              <tr key={c.k}>
                <td><span className="tp-dot" style={{ background: c.색 }} />{c.이름}{c.k === 'L' && S.출역노무 > 0 ? <span className="muted"> (출역 {억만(S.출역노무)} 포함)</span> : null}</td>
                <td className="r">{원(S.구분합[c.k])} 원</td>
                <td className="r muted">{S.누적 > 0 ? 퍼센트(S.구분합[c.k] / S.누적) : '—'}</td>
                <td className="r muted">{현장.total > 0 ? '총액의 ' + 퍼센트(S.구분합[c.k] / 현장.total) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {S.월별.length > 0 && (
        <div className="card">
          <div className="detail-h">월별</div>
          <div className="tp-scroll">
            <table className="tbl tp-mt">
              <thead><tr><th>월</th>{구분.map((c) => <th key={c.k}>{c.이름}</th>)}<th>월 합계</th><th>누적 투입</th><th>투입률</th><th>기성</th><th>누적 기성</th><th>공정률</th></tr></thead>
              <tbody>
                {S.월별.map((m) => (
                  <tr key={m.ym}>
                    <td>{m.ym}</td>
                    {구분.map((c) => <td key={c.k} className="r">{m[c.k] ? 원(m[c.k]) : ''}</td>)}
                    <td className="r"><b>{원(m.합)}</b></td>
                    <td className="r">{원(m.누적)}</td>
                    <td className="r">{퍼센트(m.률)}</td>
                    <td className="r">{m.기성 ? 원(m.기성) : ''}</td>
                    <td className="r">{m.누적기성 ? 원(m.누적기성) : ''}</td>
                    <td className="r">{m.누적기성 ? 퍼센트(m.공정률) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function Bar({ 이름, v, 글, cls }) {
  const w = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0
  return (
    <div className="tp-bar">
      <span className="tp-bl">{이름}</span>
      <div className="tp-bt"><div className={'tp-bf ' + cls + (v > 1 ? ' over' : '')} style={{ width: w * 100 + '%' }} /></div>
      <span className="tp-bv">{글}</span>
    </div>
  )
}

/* ── ✍️ 적기 (날마다) ─────────────────────────── */
function Daily(P) {
  const { 줄들, 사람, 장비, 업체, 출역, 예시, 가기 } = P
  const [d, setD] = useState(오늘())
  const ym = d.slice(0, 7), dd = d.slice(8, 10)
  const 오늘줄 = useMemo(() => 줄들.filter((r) => r.d === d).sort((a, b) => (a.at || 0) - (b.at || 0)), [줄들, d])
  const 날합 = 오늘줄.filter((r) => r.k !== 기성).reduce((s, r) => s + (Number(r.amt) || 0), 0)
  const [고침, set고침] = useState(null)
  return (
    <>
      <div className="card tp-daybar no-print">
        <button type="button" className="chip" onClick={() => setD(날더하기(d, -1))} aria-label="전날">◀</button>
        <input type="date" value={d} onChange={(e) => e.target.value && setD(e.target.value)} />
        <b className="tp-dow">({요일(d)})</b>
        <button type="button" className="chip" onClick={() => setD(날더하기(d, 1))} aria-label="다음날">▶</button>
        {d !== 오늘() && <button type="button" className="chip" onClick={() => setD(오늘())}>오늘로</button>}
        <span className="muted" style={{ fontSize: 12.5 }}>날짜를 바꾸면 지난 날도 적고 고칩니다</span>
      </div>

      <Attendance d={d} ym={ym} dd={dd} 사람={사람} 출역={출역} 출역찍기={P.출역찍기} 출역여럿={P.출역여럿} 가기={가기} />
      <EquipIn d={d} 장비={장비} 줄저장={P.줄저장} 가기={가기} 예시={예시} />
      <MatIn d={d} 업체={업체} 줄들={줄들} 줄저장={P.줄저장} 가기={가기} 예시={예시} />
      <Entry key={(고침 ? 고침.id : 'new') + d} d0={d} 고침={고침} 예시={예시}
             onSave={async (row) => { const ok = await P.줄저장(row, 고침 && 고침.id); if (ok) set고침(null); return ok }}
             onCancel={() => set고침(null)} />

      <div className="card">
        <div className="tp-lh">
          <div className="detail-h" style={{ margin: 0 }}>{d} 에 적은 돈</div>
          <span className="muted" style={{ fontSize: 13 }}>{오늘줄.length}건 · <b>{원(날합)}</b> 원 (출역 노무비는 위 «출역» 에)</span>
        </div>
        {오늘줄.length === 0 ? <div className="muted" style={{ padding: '6px 0' }}>아직 없습니다.</div> : (
          <RowTable rows={오늘줄} 장비={장비} 업체={업체} 고치기={(r) => { set고침(r); window.scrollTo({ top: document.querySelector('.tp-entry')?.offsetTop || 0, behavior: 'smooth' }) }} 지우기={P.줄지우기} />
        )}
      </div>
    </>
  )
}

/** 👷 출역 — 명부의 사람을 누르면 1 → 0.5 → 1.5 → 빼기 */
function Attendance({ d, ym, dd, 사람, 출역, 출역찍기, 출역여럿, 가기 }) {
  const 이달 = (출역 && 출역[ym]) || {}
  const 공수 = (pid) => Number(이달[pid] && 이달[pid].d && 이달[pid].d[dd]) || 0
  const 목록 = Object.entries(사람 || {}).filter(([pid, p]) => !p.off || 공수(pid) > 0)
    .sort((a, b) => (a[1].j || '').localeCompare(b[1].j || '', 'ko') || a[1].n.localeCompare(b[1].n, 'ko'))
  const 직종들 = [...new Set(목록.map(([, p]) => p.j || '직종 없음'))]
  let 인원 = 0, 공합 = 0, 돈 = 0
  for (const [pid, p] of 목록) {
    const g = 공수(pid)
    if (g > 0) { 인원++; 공합 += g; 돈 += Math.round(g * (Number(이달[pid] && 이달[pid].w) || Number(p.w) || 0)) }
  }
  const [바쁨, set바쁨] = useState(false)
  const 누르기 = async (pid, p) => {
    const g = 공수(pid)
    const i = 공수차례.indexOf(g)
    const 다음 = 공수차례[(i + 1) % 공수차례.length]
    await 출역찍기(ym, pid, dd, g === 0 ? 1 : 다음, p)
  }
  /* 전날처럼 — 14일 안에서 가장 가까운 «출역이 있던 날» 을 그대로 */
  const 전날처럼 = async () => {
    for (let k = 1; k <= 14; k++) {
      const pd = 날더하기(d, -k), pym = pd.slice(0, 7), pdd = pd.slice(8, 10)
      const 그달 = (출역 && 출역[pym]) || {}
      const 찍힘 = Object.entries(그달).filter(([pid, a]) => a && a.d && Number(a.d[pdd]) > 0 && 사람[pid] && !사람[pid].off)
      if (찍힘.length) {
        const 바꿀 = 찍힘.filter(([pid]) => !(공수(pid) > 0)).map(([pid, a]) => ({ pid, g: Number(a.d[pdd]), p: 사람[pid] }))
        if (!바꿀.length) return
        set바쁨(true)
        await 출역여럿(ym, dd, 바꿀)
        set바쁨(false)
        return
      }
    }
    window.alert('지난 14일 안에 출역을 찍은 날이 없습니다.')
  }
  const 모두빼기 = async () => {
    const 뺄 = 목록.filter(([pid]) => 공수(pid) > 0).map(([pid]) => ({ pid, g: 0, p: 사람[pid] }))
    if (!뺄.length || !window.confirm(`${d} 출역 ${뺄.length}명을 모두 뺄까요?`)) return
    set바쁨(true); await 출역여럿(ym, dd, 뺄); set바쁨(false)
  }
  return (
    <div className="card no-print">
      <div className="tp-lh">
        <div className="detail-h" style={{ margin: 0 }}>👷 출역</div>
        <span className="tp-attsum">{인원}명 · 공수 {공수글(공합)} · 노무비 <b>{원(돈)}</b> 원</span>
      </div>
      {목록.length === 0 ? (
        <div className="tl-p">명부에 근로자가 없습니다. <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 가기('book')}>👷 명부에 근로자 올리기 →</button>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>인력사무소처럼 이름 없이 적으려면 아래 «그 밖의 지출» 에서 노무비로 «보통인부 5인 × 187,000» 처럼 적으셔도 됩니다.</div></div>
      ) : (
        <>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>이름을 누를 때마다 <b>1공수 → 0.5 → 1.5 → 빼기</b>. 누르는 순간 저장됩니다.</div>
          {직종들.map((j) => (
            <div key={j} className="tp-attg">
              <div className="tp-attj">{j}</div>
              <div className="tp-atts">
                {목록.filter(([, p]) => (p.j || '직종 없음') === j).map(([pid, p]) => {
                  const g = 공수(pid)
                  return (
                    <button key={pid} type="button" className={'tp-att' + (g > 0 ? ' on' : '') + (g > 0 && g !== 1 ? ' part' : '')} onClick={() => 누르기(pid, p)} disabled={바쁨}>
                      {p.n}{g > 0 && <em>{공수글(g)}</em>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="tp-start" style={{ marginTop: 10 }}>
            <button type="button" className="chip" onClick={전날처럼} disabled={바쁨}>↺ 전날처럼 찍기</button>
            <button type="button" className="chip" onClick={모두빼기} disabled={바쁨 || !인원}>이 날 모두 빼기</button>
            <button type="button" className="chip" onClick={() => 가기('book')}>＋ 근로자 올리기</button>
          </div>
        </>
      )}
    </div>
  )
}

/** 🚜 장비 — 명부의 장비를 골라 수량(일·시간·회)만 */
function EquipIn({ d, 장비, 줄저장, 가기, 예시 }) {
  const 목록 = Object.entries(장비 || {}).filter(([, e]) => !e.off).sort((a, b) => a[1].n.localeCompare(b[1].n, 'ko'))
  const [eq, setEq] = useState('')
  const [q, setQ] = useState('1')
  const [u, setU] = useState('')
  const [t, setT] = useState('')
  const [saving, setSaving] = useState(false)
  const e = eq && 장비[eq]
  const 단가 = u !== '' ? 숫자만(u) : e ? Number(e.u) || 0 : 0
  const 수량 = Number(String(q).replace(/[^0-9.]/g, '')) || 0
  const 금액 = Math.round(수량 * 단가)
  const 넣기 = async () => {
    if (!e || !(금액 > 0)) return
    setSaving(true)
    const row = { d, k: 'E', eq, t: (t.trim() || [e.n, e.s].filter(Boolean).join(' ')).slice(0, 100), q: 수량, u: 단가, un: e.un || '일', amt: 금액, at: Date.now() }
    const ok = await 줄저장(row)
    setSaving(false)
    if (ok) { setQ('1'); setU(''); setT('') }
  }
  return (
    <div className="card no-print">
      <div className="detail-h">🚜 장비{예시 && <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · 예시라 저장되지 않습니다</span>}</div>
      {목록.length === 0 ? (
        <div className="tl-p">명부에 장비가 없습니다. <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 가기('book')}>👷 명부에 장비 올리기 →</button></div>
      ) : (
        <div className="tp-erow">
          <label className="tp-t">장비 <select value={eq} onChange={(ev) => { setEq(ev.target.value); setU('') }}>
            <option value="">— 고르십시오 —</option>
            {목록.map(([id, x]) => <option key={id} value={id}>{x.n}{x.s ? ' ' + x.s : ''}{x.v ? ` · ${x.v}` : ''} ({원(x.u)}원/{x.un || '일'})</option>)}
          </select></label>
          <label className="tp-n">수량({(e && e.un) || '일'}) <input value={q} onChange={(ev) => setQ(ev.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" /></label>
          <label className="tp-n">단가 <input value={u !== '' ? u : e ? 원(e.u) : ''} onChange={(ev) => setU(쉼표칸(ev.target.value))} inputMode="numeric" /></label>
          <label className="tp-t">메모 (선택) <input value={t} onChange={(ev) => setT(ev.target.value)} maxLength={100} placeholder="예: 터파기" /></label>
          <span className="tp-sum">= <b>{원(금액)}</b> 원</span>
          <button type="button" className="btn" style={{ width: 'auto' }} disabled={!e || !(금액 > 0) || saving} onClick={넣기}>{saving ? '저장 중…' : '넣기'}</button>
        </div>
      )}
    </div>
  )
}

/** 🧱 자재 반입 — 업체 · 품명 · 규격 · 수량 · 단위 · 단가 */
function MatIn({ d, 업체, 줄들, 줄저장, 가기, 예시 }) {
  const 목록 = Object.entries(업체 || {}).filter(([, v]) => !v.off).sort((a, b) => a[1].n.localeCompare(b[1].n, 'ko'))
  const [vd, setVd] = useState('')
  const [t, setT] = useState('')
  const [sp, setSp] = useState('')
  const [q, setQ] = useState('')
  const [un, setUn] = useState('')
  const [u, setU] = useState('')
  const [saving, setSaving] = useState(false)
  /* 이 업체에서 전에 받은 품명 — 고르면 규격·단위·단가를 채움 */
  const 지난 = useMemo(() => {
    const m = new Map()
    for (const r of 줄들) if (r.k === 'M' && r.t && (!vd || r.vd === vd)) m.set(r.t + '|' + (r.sp || ''), r)
    return [...m.values()].slice(-40)
  }, [줄들, vd])
  const 품명고름 = (v) => {
    setT(v)
    const r = 지난.find((x) => x.t === v)
    if (r) { if (!sp) setSp(r.sp || ''); if (!un) setUn(r.un || ''); if (!u) setU(r.u != null ? 원(r.u) : '') }
  }
  const 수량 = Number(String(q).replace(/[^0-9.]/g, '')) || 0
  const 금액 = Math.round(수량 * 숫자만(u))
  const 넣기 = async () => {
    if (!t.trim() || !(금액 > 0)) return
    setSaving(true)
    const row = { d, k: 'M', t: t.trim().slice(0, 100), q: 수량, u: 숫자만(u), amt: 금액, at: Date.now() }
    if (vd) row.vd = vd
    if (sp.trim()) row.sp = sp.trim().slice(0, 40)
    if (un.trim()) row.un = un.trim().slice(0, 6)
    const ok = await 줄저장(row)
    setSaving(false)
    if (ok) { setT(''); setSp(''); setQ(''); setU('') }
  }
  return (
    <div className="card no-print">
      <div className="detail-h">🧱 자재 반입{예시 && <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · 예시라 저장되지 않습니다</span>}</div>
      <div className="tp-erow">
        <label className="tp-t">업체 <select value={vd} onChange={(e) => setVd(e.target.value)}>
          <option value="">업체 안 정함</option>
          {목록.map(([id, x]) => <option key={id} value={id}>{x.n}{x.g ? ` (${x.g})` : ''}</option>)}
        </select></label>
        <label className="tp-t">품명 <input value={t} onChange={(e) => 품명고름(e.target.value)} list="tp-mat-names" maxLength={100} placeholder="예: 레미콘" /></label>
        <datalist id="tp-mat-names">{지난.map((r) => <option key={r.t + r.sp} value={r.t} />)}</datalist>
        <label className="tp-n">규격 <input value={sp} onChange={(e) => setSp(e.target.value)} maxLength={40} placeholder="25-24-150" /></label>
      </div>
      <div className="tp-erow">
        <label className="tp-n">수량 <input value={q} onChange={(e) => setQ(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="30" /></label>
        <label className="tp-n">단위 <input value={un} onChange={(e) => setUn(e.target.value)} list="tp-mat-units" maxLength={6} placeholder="㎥" /></label>
        <datalist id="tp-mat-units">{자재단위.map((x) => <option key={x} value={x} />)}</datalist>
        <label className="tp-n">단가 <input value={u} onChange={(e) => setU(쉼표칸(e.target.value))} inputMode="numeric" placeholder="98,000" /></label>
        <span className="tp-sum">= <b>{원(금액)}</b> 원</span>
        <button type="button" className="btn" style={{ width: 'auto' }} disabled={!t.trim() || !(금액 > 0) || saving} onClick={넣기}>{saving ? '저장 중…' : '넣기'}</button>
      </div>
      {목록.length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>업체별 청구내역서를 뽑으려면 <button type="button" className="tp-x" onClick={() => 가기('book')}>명부에 자재 업체를 올리십시오 →</button></div>}
    </div>
  )
}

/* 그 밖의 지출 — 날짜(위에서 고른 날) · 구분 · 내용 · 금액(또는 수량 × 단가) */
function Entry({ d0, 고침, onSave, onCancel, 예시 }) {
  const 이름키 = 'kcm-tuipbi-by'
  const 읽기 = () => { try { return JSON.parse(localStorage.getItem(이름키)) || '' } catch (e) { return '' } }
  const [d, setD] = useState(고침 ? 고침.d : d0)
  const [k, setK] = useState(고침 ? 고침.k : 'S')
  const [t, setT] = useState(고침 ? 고침.t || '' : '')
  const [곱, set곱] = useState(!!(고침 && 고침.q != null))
  const [q, setQ] = useState(고침 && 고침.q != null ? String(고침.q) : '')
  const [u, setU] = useState(고침 && 고침.u != null ? 원(고침.u) : '')
  const [amt, setAmt] = useState(고침 ? 원(고침.amt) : '')
  const [by, setBy] = useState(() => (고침 ? 고침.by || '' : 읽기()))
  const [saving, setSaving] = useState(false)
  const 금액 = 곱 ? Math.round((Number(String(q).replace(/[^0-9.]/g, '')) || 0) * 숫자만(u)) : 숫자만(amt)
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(d) && 금액 !== 0 && Math.abs(금액) <= 1e11
  const 종류 = 고침 && 고침.k === 기성 ? [{ k: 기성, 이름: '기성', 색: '#0ea5e9' }] : 구분
  const 저장 = async () => {
    if (!ok || saving) return
    setSaving(true)
    const row = { d, k, amt: 금액, at: Date.now() }
    if (고침) for (const f of ['eq', 'vd', 'sp', 'un']) if (고침[f] != null) row[f] = 고침[f]
    if (t.trim()) row.t = t.trim().slice(0, 100)
    if (곱) { row.q = Number(String(q).replace(/[^0-9.]/g, '')) || 0; row.u = 숫자만(u) }
    if (by.trim()) { row.by = by.trim().slice(0, 20); try { localStorage.setItem(이름키, JSON.stringify(row.by)) } catch (e) { /* 없음 */ } }
    const done = await onSave(row)
    setSaving(false)
    if (done && !고침) { setT(''); setQ(''); setU(''); setAmt('') }
  }
  return (
    <div className="card no-print tp-entry">
      <div className="detail-h">{고침 ? '✏️ 고치기' : '💸 그 밖의 지출'}{예시 && <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · 예시라 저장되지 않습니다</span>}</div>
      {!고침 && <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>외주 기성·경비·기타, 그리고 명부 없이 적는 노무·자재·장비 — 금액만 적으면 됩니다.</div>}
      <div className="tp-kinds">
        {종류.map((c) => (
          <button type="button" key={c.k} className={'chip' + (k === c.k ? ' on' : '')} onClick={() => setK(c.k)}>
            <span className="tp-dot" style={{ background: c.색 }} />{c.이름}
          </button>
        ))}
      </div>
      <div className="tp-erow">
        {고침 && <label className="tp-d">날짜 <input type="date" value={d} onChange={(e) => setD(e.target.value)} /></label>}
        <label className="tp-t">내용 <input value={t} onChange={(e) => setT(e.target.value)} maxLength={100}
          placeholder={k === 'L' ? '예: 보통인부 5인 (인력사무소)' : k === 'M' ? '예: 레미콘 25-24-150 30㎥' : k === 'E' ? '예: 굴착기 0.7㎥ 1일' : k === 'S' ? '예: 방수공사 1회 기성' : k === 'X' ? '예: 안전용품' : '예: 민원 처리'} /></label>
      </div>
      <div className="tp-erow">
        <label className="tp-chk"><input type="checkbox" checked={곱} onChange={(e) => set곱(e.target.checked)} /> 수량 × 단가로 적기</label>
        {곱 ? (
          <>
            <label className="tp-n">수량 <input value={q} onChange={(e) => setQ(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="5" /></label>
            <label className="tp-n">단가 <input value={u} onChange={(e) => setU(쉼표칸(e.target.value))} inputMode="numeric" placeholder="187,000" /></label>
            <span className="tp-sum">= <b>{원(금액)}</b> 원</span>
          </>
        ) : (
          <label className="tp-a">금액 (원) <input value={amt} onChange={(e) => setAmt(쉼표칸(e.target.value))} inputMode="numeric" placeholder="예: 935,000"
            onKeyDown={(e) => { if (e.key === 'Enter') 저장() }} />{금액 > 0 && <span className="tp-hint">{억만(금액)} 원</span>}</label>
        )}
        <label className="tp-by">적은 사람 (선택) <input value={by} onChange={(e) => setBy(e.target.value)} maxLength={20} placeholder="예: 공무 김" /></label>
      </div>
      <div className="tp-start">
        <button type="button" className="btn" disabled={!ok || saving} onClick={저장}>{saving ? '저장 중…' : 고침 ? '고친 것 저장' : '적기'}</button>
        {고침 && <button type="button" className="btn ghost" onClick={onCancel}>그만두기</button>}
      </div>
    </div>
  )
}

function RowTable({ rows, 장비, 업체, 고치기, 지우기 }) {
  const 색 = (k) => (k === 기성 ? '#0ea5e9' : (구분.find((c) => c.k === k) || {}).색)
  return (
    <div className="tp-scroll">
      <table className="tbl tp-rt">
        <thead><tr><th>날짜</th><th>구분</th><th>내용</th><th>수량 × 단가</th><th>금액</th><th className="no-print" /></tr></thead>
        <tbody>
          {rows.map((r) => {
            const 곳 = r.eq && 장비 && 장비[r.eq] ? 장비[r.eq].v : r.vd && 업체 && 업체[r.vd] ? 업체[r.vd].n : ''
            return (
              <tr key={r.id}>
                <td className="nw c-d">{r.d}</td>
                <td className="nw c-k"><span className="tp-dot" style={{ background: 색(r.k) }} />{r.k === 기성 ? '기성' : 구분이름[r.k]}</td>
                <td className="c-t">{r.t}{r.sp ? <span className="muted"> {r.sp}</span> : null}{곳 ? <span className="muted"> · {곳}</span> : null}{r.by ? <span className="muted"> · {r.by}</span> : null}</td>
                <td className="r muted nw c-q">{r.q != null && r.u != null ? `${공수글(Number(r.q))}${r.un || ''} × ${원(r.u)}` : ''}</td>
                <td className="r nw c-a"><b>{원(r.amt)}</b></td>
                <td className="nw no-print c-x">
                  <button type="button" className="tp-x" onClick={() => 고치기(r)}>고치기</button>
                  <button type="button" className="tp-x" onClick={() => { if (window.confirm(`${r.d} ${r.k === 기성 ? '기성' : 구분이름[r.k]} ${원(r.amt)}원 줄을 지울까요?`)) 지우기(r.id) }}>지우기</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── 📈 기성·공정률 ─────────────────────────── */
function Gisung({ S, 현장, 줄들, 줄저장, 줄지우기, 예시 }) {
  const 목록 = useMemo(() => 줄들.filter((r) => r.k === 기성).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.at || 0) - (b.at || 0))), [줄들])
  const [고침, set고침] = useState(null)
  const [d, setD] = useState(오늘())
  const [t, setT] = useState('')
  const [amt, setAmt] = useState('')
  const [saving, setSaving] = useState(false)
  const 시작고침 = (r) => { set고침(r); setD(r.d); setT(r.t || ''); setAmt(원(r.amt)) }
  const 저장 = async () => {
    const 금액 = 숫자만(amt)
    if (!(금액 > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return
    setSaving(true)
    const row = { d, k: 기성, t: (t.trim() || `${목록.length + (고침 ? 0 : 1)}회 기성`).slice(0, 100), amt: 금액, at: Date.now() }
    const ok = await 줄저장(row, 고침 && 고침.id)
    setSaving(false)
    if (ok) { set고침(null); setT(''); setAmt('') }
  }
  let run = 0
  return (
    <>
      <div className="card">
        <div className="tp-tiles">
          <div className="tp-tile gs"><span>공정률</span><b>{퍼센트(S.공정률)}</b><i>누적 기성 ÷ 총공사금액</i></div>
          <div className="tp-tile"><span>누적 기성</span><b>{억만(S.누적기성)}</b><i>{원(S.누적기성)} 원 · {S.기성건}회</i></div>
          <div className="tp-tile"><span>계획 (공기 경과)</span><b>{퍼센트(S.경과율)}</b><i>{현장.start && 현장.end ? '오늘 기준 · 착공~준공 직선' : '현장 정보에 공사기간을 넣으십시오'}</i></div>
          <div className={'tp-tile' + (Number.isFinite(S.원가율) && S.원가율 > (Number.isFinite(S.목표원가율) ? S.목표원가율 : 1) + 0.03 ? ' bad' : '')}><span>기성 대비 투입비</span><b>{퍼센트(S.원가율)}</b><i>{S.기성일 ? `${S.기성일} 까지` : '—'}{Number.isFinite(S.목표원가율) ? ` · 실행 ${퍼센트(S.목표원가율)}` : ''}</i></div>
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.7 }}>
          공정률은 <b>금액 기준</b>입니다 — 발주처에 청구(또는 확정)한 기성금액의 누적 ÷ 총공사금액. 기성은 <b>총공사금액과 같은 기준</b>(부가세 포함이면 포함)으로 적으십시오.
          «기성 대비 투입비» 는 마지막 기성일까지 쓴 돈 ÷ 누적 기성 — 100% 를 넘으면 받은 것보다 많이 쓴 것입니다.
        </div>
      </div>
      <div className="card no-print">
        <div className="detail-h">{고침 ? '✏️ 기성 고치기' : '＋ 기성 적기'}{예시 && <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · 예시라 저장되지 않습니다</span>}</div>
        <div className="tp-erow">
          <label className="tp-d">날짜 (기성 기준일) <input type="date" value={d} onChange={(e) => setD(e.target.value)} /></label>
          <label className="tp-t">내용 <input value={t} onChange={(e) => setT(e.target.value)} maxLength={100} placeholder={`예: ${목록.length + 1}회 기성 (8월분)`} /></label>
          <label className="tp-a">기성금액 (원) <input value={amt} onChange={(e) => setAmt(쉼표칸(e.target.value))} inputMode="numeric" placeholder="예: 150,000,000" />
            {숫자만(amt) > 0 && <span className="tp-hint">{억만(숫자만(amt))} 원 · 총액의 {퍼센트(현장.total > 0 ? 숫자만(amt) / 현장.total : NaN)}</span>}</label>
          <button type="button" className="btn" style={{ width: 'auto' }} disabled={!(숫자만(amt) > 0) || saving} onClick={저장}>{saving ? '저장 중…' : 고침 ? '고친 것 저장' : '적기'}</button>
          {고침 && <button type="button" className="btn ghost" style={{ width: 'auto' }} onClick={() => { set고침(null); setT(''); setAmt('') }}>그만두기</button>}
        </div>
      </div>
      <div className="card">
        <div className="detail-h">기성 내역</div>
        {목록.length === 0 ? <div className="muted">아직 적은 기성이 없습니다. 위에 첫 기성을 적어 보십시오.</div> : (
          <div className="tp-scroll">
            <table className="tbl tp-mt">
              <thead><tr><th>회</th><th>날짜</th><th>내용</th><th>기성금액</th><th>누적 기성</th><th>공정률</th><th className="no-print" /></tr></thead>
              <tbody>
                {목록.map((r, i) => {
                  run += Number(r.amt) || 0
                  return (
                    <tr key={r.id}>
                      <td>{i + 1}</td><td>{r.d}</td><td style={{ whiteSpace: 'normal' }}>{r.t}</td>
                      <td className="r">{원(r.amt)}</td><td className="r">{원(run)}</td>
                      <td className="r"><b>{퍼센트(현장.total > 0 ? run / 현장.total : NaN)}</b></td>
                      <td className="no-print">
                        <button type="button" className="tp-x" onClick={() => 시작고침(r)}>고치기</button>
                        <button type="button" className="tp-x" onClick={() => { if (window.confirm(`${r.d} 기성 ${원(r.amt)}원을 지울까요?`)) 줄지우기(r.id) }}>지우기</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

/* ── 📜 적은 것 (돈 줄 전체) ─────────────────── */
function RowList({ 줄들, 장비, 업체, 줄저장, 줄지우기, 예시 }) {
  const [달, set달] = useState('')
  const [가름, set가름] = useState('')
  const [더, set더] = useState(80)
  const [고침, set고침] = useState(null)
  const 투입 = useMemo(() => 줄들.filter((r) => r.k !== 기성), [줄들])
  const 달들 = useMemo(() => [...new Set(투입.map((r) => (r.d || '').slice(0, 7)))].filter(Boolean).sort().reverse(), [투입])
  const 보일줄 = useMemo(() => [...투입]
    .filter((r) => (!달 || (r.d || '').startsWith(달)) && (!가름 || r.k === 가름))
    .sort((a, b) => (a.d === b.d ? (b.at || 0) - (a.at || 0) : a.d < b.d ? 1 : -1)), [투입, 달, 가름])
  const 거른합 = 보일줄.reduce((s, r) => s + (Number(r.amt) || 0), 0)
  return (
    <>
      {고침 && <Entry key={고침.id} d0={고침.d} 고침={고침} 예시={예시}
        onSave={async (row) => { const ok = await 줄저장(row, 고침.id); if (ok) set고침(null); return ok }} onCancel={() => set고침(null)} />}
      <div className="card">
        <div className="tp-lh">
          <div className="detail-h" style={{ margin: 0 }}>적은 것 (돈)</div>
          <select value={달} onChange={(e) => set달(e.target.value)} className="no-print">
            <option value="">모든 달</option>
            {달들.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={가름} onChange={(e) => set가름(e.target.value)} className="no-print">
            <option value="">모든 구분</option>
            {구분.map((c) => <option key={c.k} value={c.k}>{c.이름}</option>)}
          </select>
          <span className="muted" style={{ fontSize: 13 }}>{원(보일줄.length)}건 · <b>{원(거른합)}</b> 원</span>
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>출역으로 찍은 노무비는 «🧾 달마다 청구서 → 노무비» 에 사람별로 나옵니다. 기성은 «📈 기성·공정률» 에.</div>
        {보일줄.length === 0 ? <div className="muted" style={{ padding: '10px 0' }}>아직 적은 것이 없습니다.</div> : (
          <RowTable rows={보일줄.slice(0, 더)} 장비={장비} 업체={업체} 고치기={(r) => { set고침(r); window.scrollTo({ top: 0, behavior: 'smooth' }) }} 지우기={줄지우기} />
        )}
        {보일줄.length > 더 && <button type="button" className="chip no-print" style={{ marginTop: 8 }} onClick={() => set더(더 + 200)}>더 보기 ({원(보일줄.length - 더)}건 더)</button>}
      </div>
    </>
  )
}

/* ── ❓ 쓰는 방법 — 소장님: 「도구로 올릴때, 공사일보 쓰는 방법을 자세하게 알려 줘야 해」 · 「설명은 최대한 자세히 적어서 올려줘」 ──
 *   요율·기준은 2026-09-26 웹에서 다시 확인 (출처는 맨 아래 «근거» 에 그대로) */
function Sec({ 제목, 열림, children }) {
  return (
    <details className="tp-gsec" open={열림}>
      <summary>{제목}</summary>
      <div className="tp-gbody">{children}</div>
    </details>
  )
}

export function TuipbiGuide({ 현장안 }) {
  return (
    <div className="card tp-guide">
      <div className="detail-h">❓ 쓰는 방법 — 처음 쓰시는 분께 (제목을 누르면 펼쳐집니다)</div>
      <p className="tl-p" style={{ marginTop: 0 }}>
        <b>무엇을 하는 도구인가</b> — 현장에서 <b>날마다</b> 출역(누가 몇 공수)·장비·자재·그 밖의 지출을 누르고 적으면,
        <b> 총공사금액 대비 지금까지 든 돈(투입비)</b>, <b>공정률(기성)</b>, <b>남은 금액</b>이 저절로 나오고,
        <b> 달마다</b> 노무비(4대보험·소득세 공제 자동)·장비·자재 <b>청구내역서</b>를 화면에서 보고 인쇄합니다. 입력·수정은 모두 이 화면에서 합니다.
        회원가입 없이 <b>무료</b>이고, 폰·PC 어디서든 같은 현장을 같이 씁니다.
      </p>
      <p className="tl-p muted">가장 빨리 익히는 방법: {현장안 ? '처음 화면의' : '위의'} <b>🧪 예시 현장 보기</b> → 탭을 하나씩 눌러 보고, 이름·칸도 눌러 보십시오. 예시는 저장되지 않으니 마음껏 눌러도 됩니다.</p>

      <Sec 제목="0. 5분 따라하기 — 처음 한 번" 열림>
        <ol>
          <li><b>＋ 새 현장 만들기</b> — 현장명 · 회사명(청구서 머리에 들어감) · <b>총공사금액(도급액)</b> · 실행예산(있으면) · 착공일·준공일 · 비밀번호 6자 이상.</li>
          <li>화면에 나온 <b>현장 코드</b>(예: K7F-3Q9-2MX)와 비밀번호를 수첩·카톡 나에게 보내기 등에 <b>꼭 적어 두기</b>.</li>
          <li><b>👷 명부</b> 탭 → <b>근로자</b>를 올립니다 (이름 · 직종 · 일급). 장비·자재 업체도 있으면 같이.</li>
          <li><b>✍️ 적기</b> 탭 → 오늘 온 사람 이름을 누릅니다. 끝입니다 — <b>누르는 순간 자동 저장</b>됩니다(현장 이름 아래에 «✅ 시:분 저장됨» 이 뜹니다).</li>
          <li>말일에 <b>🧾 달마다 청구서</b> → 달을 고르고 <b>🖨 이 달 청구서 모두 인쇄</b>(노무·장비·자재).</li>
        </ol>
      </Sec>

      <Sec 제목="1. 현장 만들기 · 같이 쓰기 · 다시 열기">
        <ul>
          <li><b>현장 코드(9자리) + 비밀번호</b>가 열쇠입니다. 둘 다 아는 사람만 그 현장을 봅니다. 회원가입·이메일·전화번호는 받지 않습니다.</li>
          <li><b>같이 쓰기</b>: ✏️ 현장 정보 → <b>📋 코드·주소 복사</b> → 공무·반장에게 카톡으로 보내고, 비밀번호는 따로(말로) 알려 줍니다. 받은 사람은 링크를 누르고 비밀번호만 넣으면 됩니다.</li>
          <li><b>다음부터는</b>: 한 번 연 폰·PC 는 비밀번호 없이 바로 열립니다(처음 화면 «이 기기에서 열어 본 현장»). 폰 <b>홈 화면에 추가</b>해 두면 앱처럼 한 번에 열립니다.</li>
          <li><b>공용 PC</b>(현장 사무실 공용 등)에서는 다 쓴 뒤 <b>✏️ 현장 정보 → 이 기기에서 잊기</b>를 누르십시오.</li>
          <li><b>권한</b>: 코드와 비밀번호를 아는 사람은 모두 같은 권한(보기·적기·고치기·지우기·현장 지우기)입니다. «보기만» 권한은 아직 없습니다 — 비밀번호는 현장 관계자에게만.</li>
          <li><b>비밀번호를 잊으면</b> 저희도 찾아 드릴 수 없습니다(해시만 둡니다). 비밀번호 바꾸기는 아직 없습니다.</li>
          <li><b>설계변경</b>으로 도급액이 바뀌면 ✏️ 현장 정보에서 <b>총공사금액만</b> 고치십시오. 투입률·공정률이 새 금액으로 모두 다시 셈됩니다. 공기가 늘면 준공일도 고치십시오.</li>
        </ul>
      </Sec>

      <Sec 제목="2. 👷 명부 — 근로자 · 장비 · 자재 업체">
        <ul>
          <li><b>근로자</b>: 이름 · 직종(보통인부·형틀목공·철근공…) · <b>일급</b> · 연락처. 청구서에 넣을 <b>🔒 주민등록번호 · 은행 · 계좌번호 · 예금주</b>는 잠금 칸에.</li>
          <li><b>장비</b>: 장비명 · 규격(0.7㎥, 25t) · 업체 · <b>단가와 단위</b>(일·시간·회·대·월) · 🔒 사업자번호·계좌.</li>
          <li><b>자재 업체</b>: 업체명 · 품목 · 🔒 사업자번호·계좌. 품명·단가는 반입할 때 적습니다.</li>
          <li><b>일급이 오르면</b> 명부에서 고치십시오. 이번 달 이미 찍은 출역에도 새 일급을 쓸지 물어봅니다(지난달은 그대로).</li>
          <li><b>현장을 떠난 사람</b>은 지우지 말고 <b>«현장 떠남»</b>을 켜 두십시오 — 출역 화면에서만 빠지고 지난 청구서·누계는 그대로 남습니다.</li>
          <li><b>공제 빼기</b>(늘 빼는 것): 60세 이상이라 국민연금 대상이 아닌 분, 다른 곳에서 직장 건강보험을 내는 분, 65세 이후 새로 고용돼 고용보험(실업급여) 대상이 아닌 분 등은 명부에서 체크해 두면 매달 자동으로 빠집니다. 한 달만 다르면 청구서의 보험 단추(4번)로.</li>
          <li><b>인원 제한은 없습니다.</b> 사람이 많으면 떠난 사람을 바로바로 «현장 떠남» 으로 두는 것이 출역 화면을 짧게 하는 방법입니다.</li>
        </ul>
      </Sec>

      <Sec 제목="3. ✍️ 날마다 적기 (하루 5분)">
        <ul>
          <li>날짜는 오늘로 잡혀 있습니다. <b>◀ ▶</b> 나 날짜 칸으로 지난 날도 적고 고칩니다.</li>
          <li><b>👷 출역</b>: 온 사람 이름을 누릅니다. 누를 때마다 <b>1공수 → 0.5 → 1.5 → 빼기</b>(파란색 1, 주황색 0.5·1.5). 위에 «n명 · 공수 · 노무비» 가 바로 셈됩니다.
            <br />어제와 비슷하면 <b>↺ 전날처럼 찍기</b>(지난 14일 중 가장 가까운 출역 날을 그대로) → 안 온 사람만 빼면 됩니다. 잘못 찍었으면 <b>이 날 모두 빼기</b>.</li>
          <li><b>🚜 장비</b>: 명부의 장비를 고르고 수량(1일·4시간·1회) → <b>넣기</b>. 단가는 명부에서 채워지고, 그날만 다르면 고쳐 넣습니다.</li>
          <li><b>🧱 자재 반입</b>: 업체 · 품명 · 규격 · 수량 · 단위 · 단가 → <b>넣기</b>. 전에 받은 품명을 고르면 규격·단위·단가가 채워집니다.</li>
          <li><b>💸 그 밖의 지출</b>: 외주 기성·경비(식대·안전용품·임대료·전기수도)·기타. 명부 없이 적는 노무비(인력사무소 «보통인부 5인 × 187,000»)·자재·장비도 여기서 — 이것들은 투입비에는 들어가지만 사람별·업체별 청구서에는 나오지 않습니다.</li>
          <li>맨 아래 <b>«그날 적은 돈»</b> 목록에서 <b>고치기 · 지우기</b>.</li>
          <li><b>저장 단추가 따로 없습니다.</b> 누르고 넣는 순간 서버에 저장되고, 다른 사람이 방금 적은 것은 <b>↻ 새로고침</b>으로 봅니다.</li>
        </ul>
      </Sec>

      <Sec 제목="4. 🧾 달마다 청구서 — 노무비 · 장비 · 자재 · 달별 누계">
        <ul>
          <li>달을 고릅니다(◀ ▶). 지난달·석 달 전도 언제든 다시 뽑습니다.</li>
          <li><b>👷 노무비</b>
            <ul>
              <li>① <b>출역 대장</b>: 사람 × 1일~말일 공수 · 공수 합 · 일수 · 일급 · 보수총액. 칸을 눌러 바로 고칩니다(빠뜨린 날 채우기).</li>
              <li>맨 위 세 칸: <b>청구금액(보수총액)</b> − <b>공제 합계</b>(항목별 금액) = <b>실지급액(차인지급액)</b> — 근로자에게 실제로 줄 돈.</li>
              <li><b>4대보험 대상</b> 줄: «국민연금 n명 · 건강·요양 n명 · 고용 n명» 과 대상 아닌 사람·까닭.</li>
              <li>② <b>청구 내역서</b>: 성명 · 주민번호 · 연락처 · 직종 · 일수 · 청구금액 · <b>보험 단추</b> · 소득세 · 지방소득세 · 고용 · 연금 · 건강 · 요양 · 공제계 · <b>실지급액</b> · 은행 · 계좌 · 예금주 · 비고.</li>
              <li><b>보험 단추</b>(연금✓ 건강✓ 고용✓ / 대상 아니면 ✕): 초록이 대상, 회색이 대상 아님. 옆에 까닭(«21일 ≥ 8일», «7일 {'<'} 8일»)이 붙습니다.
                <b> 누르면 그 달만</b> 넣거나 빼고(✎ 표시), 한 번 더 누르면 자동으로 돌아갑니다. 공제 금액은 누르는 즉시 다시 셈됩니다.
                <br />예) 같은 회사 다른 현장까지 합쳐 8일이 넘는 사람 → 연금 «넣기» (국민연금은 2025년 7월부터 회사 기준 합산) · 다른 곳에서 이미 내는 사람 → «빼기».</li>
              <li><b>공제 금액 칸</b>을 누르면 금액을 직접 고쳐 씁니다(🟨 노란 칸). «자동» 을 누르면 되돌아갑니다. 비고 칸도 누르면 적습니다.</li>
            </ul>
          </li>
          <li><b>🚜 장비</b>: 장비(업체)별로 날짜 · 내용 · 수량 · 단위 · 단가 · 금액 · 소계, 업체 계좌.</li>
          <li><b>🧱 자재</b>: 업체별로 날짜 · 품명 · 규격 · 수량 · 단위 · 단가 · 금액 · 소계, 사업자번호·계좌.</li>
          <li><b>📊 달별 누계 (처음~이 달)</b>: 달마다 인원 · 보수총액 · 공제 항목별 · 공제 합계 · 실지급액 · 장비 · 자재 · 달 합계 · <b>합계 누계</b>, 그리고 사람별 누계(펼치기).</li>
          <li><b>🖨 인쇄</b>는 가로 A4 한 장(결재란 작성·검토·현장소장). 인쇄 창에서 «배경 그래픽» 을 켜면 머리칸 색도 나옵니다.</li>
          <li>주민번호는 가려서(900101-1******) 나옵니다. 제출용으로 다 보이려면 <b>주민번호 뒷자리 보이기</b>를 켠 뒤 인쇄.</li>
        </ul>
      </Sec>

      <Sec 제목="5. 🖨 보기 · 인쇄 (엑셀 받기는 없습니다)">
        <ul>
          <li>모든 내용은 <b>화면의 표</b>로 봅니다 — 엑셀처럼 줄·칸으로 나옵니다. <b>입력과 수정은 이 화면에서만</b> 합니다(엑셀 파일로 내려받기는 없습니다).</li>
          <li><b>🧾 달마다 청구서 → 🖨 이 달 청구서 모두 인쇄</b>: 노무비 · 장비 · 자재 청구서를 장마다 나누어 한 번에 인쇄합니다(가로 A4, 결재란).</li>
          <li><b>🖨 이 화면 인쇄</b>: 지금 보는 청구서 하나(노무비·장비·자재·달별 누계 중)만.</li>
          <li>현장 머리의 <b>🖨 인쇄</b>: 지금 보는 탭(📊 한눈에 — 총공사금액·투입비·공정률·구분별·월별, 📈 기성, 📜 적은 것 등)을 인쇄합니다.</li>
          <li>제출용 파일이 필요하면 인쇄 창에서 대상(프린터)을 <b>«PDF로 저장»</b> 으로 고르십시오.</li>
          <li>자료는 서버에 계속 쌓여 있어서, 지난달·석 달 전 청구서도 언제든 다시 보고 인쇄합니다(현장을 지우지 않는 한).</li>
        </ul>
      </Sec>

      <Sec 제목="6. 📈 기성 · 공정률 · 한눈에">
        <ul>
          <li><b>📈 기성·공정률</b> 탭 → 기성 기준일 · 내용(3회 기성) · 기성금액 → 적기. 기성금액은 <b>총공사금액과 같은 기준</b>(부가세 포함이면 포함)으로.</li>
          <li><b>공정률 = 누적 기성 ÷ 총공사금액</b> (금액 기준 공정률).</li>
          <li><b>계획(공기)</b> = 착공~준공 사이에서 오늘이 몇 % 지점인가(직선). 공정률이 계획보다 5%p 넘게 늦으면 ⚠️ 로 알려 드립니다.</li>
          <li><b>기성 대비 투입비</b> = 마지막 기성일까지 쓴 돈 ÷ 누적 기성. 100원 받을 때 몇 원 썼나. 실행예산을 넣었으면 «실행예산 ÷ 도급액» 과 견주어 3%p 넘게 많으면 ⚠️(손해 쪽 신호).</li>
          <li><b>📊 한눈에</b>: 총공사금액 · 누적 투입비 · 공정률 · 남은 금액 · 막대 4개(공정률·계획·투입률·실행 대비) · 구분별 · 월별(기성·누적 기성·공정률 포함) · 오늘 출역 · 누계 연인원.</li>
        </ul>
      </Sec>

      <Sec 제목="7. 공제는 이렇게 셉니다 (2026년 · 일용근로자)">
        <table className="tbl tp-gt">
          <thead><tr><th>항목</th><th>근로자 부담</th><th>언제 떼나</th></tr></thead>
          <tbody>
            <tr><td>소득세</td><td>(그날 일급 − 15만원) × 6% × (1 − 55%) = 15만원 넘는 부분의 <b>2.7%</b></td><td>날마다 셈해 한 달 합. 한 달 합이 1천원 미만이면 안 뗌(소액부징수 — 한꺼번에 줄 때는 합계로 판단)</td></tr>
            <tr><td>지방소득세</td><td>소득세의 <b>10%</b></td><td>소득세를 뗄 때</td></tr>
            <tr><td>고용보험</td><td>보수총액의 <b>0.9%</b></td><td>일용 모두 (65세 이후 새로 고용된 분 등은 빼기)</td></tr>
            <tr><td>국민연금</td><td>기준소득월액의 <b>4.75%</b> (2026.7~ 하한 41만·상한 659만, 천원 미만 버림)</td><td>이 현장에서 한 달 <b>8일 이상</b> 또는 <b>220만원 이상</b> (60세 이상 등은 빼기)</td></tr>
            <tr><td>건강보험</td><td>보수총액의 <b>3.595%</b></td><td>한 달 <b>8일 이상</b></td></tr>
            <tr><td>장기요양</td><td>건강보험료 × <b>13.14%</b> (= 0.9448% ÷ 7.19%)</td><td>건강보험을 뗄 때</td></tr>
          </tbody>
        </table>
        <ul>
          <li>보험료는 <b>10원 미만 버림</b>. 1.5공수인 날은 그날 일급 × 1.5 로 소득세를 셉니다.</li>
          <li><b>셈 보기</b> — 일급 187,000원 · 한 달 19일(보수 3,553,000원): 소득세 (37,000 × 2.7% = 999원) × 19일 = 18,980원 · 지방 1,890원 · 고용 31,970원 · 연금 168,760원 · 건강 127,730원 · 요양 16,780원 → 공제 합계 366,110원 · <b>실지급액 3,186,890원</b>.</li>
          <li><b>2027년</b>: 국민연금 5%(해마다 0.5%p씩 2033년 13%) · 건강보험 3.595%(동결 확정)는 넣어 두었고, 장기요양·고용보험은 아직 확정 전이라 2026년 값으로 셈하고 화면에 ⚠️ 로 알립니다. 확정되면 바꿔 드립니다.</li>
          <li>⚠️ 이 도구는 <b>이 현장에서 일한 날</b>만 압니다. 같은 회사 다른 현장 근무(국민연금은 회사 합산) · 나이 · 외국인 · 다른 직장 가입 등은 모릅니다 → 명부의 «공제 빼기» 나 청구서의 보험 단추로 맞추고, <b>신고·지급 전에 한 번 더 확인</b>하십시오. 산재보험은 사업주만 내므로 공제에 없습니다.</li>
        </ul>
      </Sec>

      <Sec 제목="8. 🔒 개인정보 · 잠금">
        <ul>
          <li>주민번호 · 은행 · 계좌 · 예금주 · 사업자번호는 <b>이 브라우저에서 현장 비밀번호로 잠근 뒤</b> 저장합니다(개인정보 보호법 제24조의2 ② — 주민등록번호는 암호화해 보관). 서버에는 알아볼 수 없는 글자만 있고, <b>저희도 볼 수 없습니다.</b></li>
          <li>다른 기기(비밀번호를 넣지 않고 기억으로 연 기기)에서는 🔒 로 보입니다 → 명부·청구서 위의 <b>비밀번호로 풀기</b>.</li>
          <li>비밀번호를 잊으면 잠근 칸은 되살릴 수 없습니다. 이름·일급·출역·금액은 잠그지 않으므로 그대로 남습니다.</li>
          <li>근로자에게 주민번호를 받을 때는 노무비 지급·신고 목적을 알려 주십시오.</li>
        </ul>
      </Sec>

      <Sec 제목="9. 말 풀이">
        <ul>
          <li><b>공수</b> — 하루 일한 양. 1공수 = 하루, 0.5 = 반나절, 1.5 = 하루 반(야간·연장).</li>
          <li><b>투입비 · 투입률</b> — 지금까지 쓴 돈(노무·자재·장비·외주·경비·기타) · 그것 ÷ 총공사금액.</li>
          <li><b>실행예산 · 실행 대비</b> — 회사가 잡은 원가 예산 · 투입비 ÷ 실행예산.</li>
          <li><b>기성 · 공정률</b> — 한 만큼 청구(확정)한 돈 · 누적 기성 ÷ 총공사금액.</li>
          <li><b>보수총액 · 공제 · 실지급액(차인지급액)</b> — 공수 × 일급의 합 · 세금·보험료 · 보수총액 − 공제.</li>
          <li><b>연인원</b> — 출역 공수를 모두 더한 것(10명 × 3일 = 30).</li>
        </ul>
      </Sec>

      <Sec 제목="10. 자주 묻는 것">
        <ul>
          <li><b>저장은 언제? 나중에 고칠 수 있나요?</b> — <b>자동 저장</b>입니다. 누르고 넣는 순간 서버에 저장되고(현장 이름 아래 «✅ 저장됨»), 저장 단추가 따로 없습니다. 오늘 적은 것은 내일·다음 달에도 그 날짜로 가서 고치고 지웁니다. 다른 사람이 방금 적은 것은 <b>↻ 새로고침</b>.</li>
          <li><b>몇 명까지?</b> — 정해진 한도는 없습니다. 50명이 1년 적어도 약 150KB 입니다.</li>
          <li><b>비용은?</b> — 무료입니다.</li>
          <li><b>폰으로도?</b> — 됩니다. 출역은 폰에서 누르기 좋게 만들었고, 청구서·인쇄는 PC 가 편합니다.</li>
          <li><b>지난달 출역을 빠뜨렸어요</b> — ✍️ 적기에서 날짜를 그날로 바꾸거나, 청구서의 출역 대장 칸을 누르십시오.</li>
          <li><b>같은 날 두 번 찍었어요</b> — 출역은 사람·날짜마다 한 칸이라 겹치지 않습니다. 다시 누르면 0.5 → 1.5 → 빼기로 바뀝니다.</li>
          <li><b>현장이 끝났어요</b> — 마지막 달 청구서와 누계를 인쇄(또는 인쇄 창에서 PDF로 저장)해 두십시오. 현장은 그대로 두셔도 되고, ✏️ 현장 정보 → 현장 지우기(되돌릴 수 없음)도 됩니다.</li>
          <li><b>인터넷이 끊겼어요</b> — «저장하지 못했습니다» 가 뜹니다. 연결된 뒤 다시 누르십시오.</li>
          <li><b>공사일보(날씨·작업 내용) 한 장은?</b> — 아직 없습니다(투입비·청구서 중심). 필요하시면 문의 주십시오.</li>
        </ul>
      </Sec>

      <Sec 제목="근거 (2026-09-26 확인)">
        <ul className="tp-src">
          <li>국세청 «일용근로소득» — [일급 − 15만원] × 6% × (1 − 55%)</li>
          <li>국세청 법인46013-343 — 일급을 일정 기간 한꺼번에 줄 때 소액부징수는 일별 세액 합계로 판단</li>
          <li>보건복지부 — 2026년 건강보험료율 7.19% · 2027년 7.19% 동결(2026-09-08) · 2026년 장기요양보험료율 0.9448%</li>
          <li>보건복지부 — 국민연금 보험료율 2026년 9.5%, 해마다 0.5%p씩 2033년 13%(2025-12-29)</li>
          <li>국민연금공단 — 기준소득월액 2026.7~2027.6 하한 41만원·상한 659만원(2026-02-13) · 건설 일용 사업장 가입 «월 8일 또는 220만원, 사업장 합산»(2025-06-11)</li>
          <li>고용보험 근로자 0.9% (고용노동부 2026-09-01 개편안: 1.0% 로 올릴 계획 — 확정되면 반영)</li>
          <li>개인정보 보호법 제24조의2 ② [시행 2026.9.11.] — 주민등록번호 암호화 보관</li>
        </ul>
      </Sec>
    </div>
  )
}
