/**
 * 🏗 현장 투입비 · 공사일보 — 👷 명부 · 🧾 달마다 청구서 (2026-09-26)
 * 소장님: 「어차피 공사 관계자만 보는 거니까. 노무자 및 장비, 자재 청구내역서 작성해서 보여주는 걸로 하자. 매달...」
 *   · 공제는 «전부 자동 + 고쳐 쓰기» (lib/gongje.js) · 주민번호·계좌는 «현장 비번으로 잠가 저장» (lib/tplock.js)
 */
import { useEffect, useMemo, useState } from 'react'
import { 원, 억만, 공수글, 오늘, 노무달, 장비달, 자재달, 누계, 장비메모, 달더하기, 요일, 단위들 } from '../lib/tuipbi.js'
import { 요율 } from '../lib/gongje.js'
import { 공제칸 } from '../lib/gongje.js'
import { 주민가림 } from '../lib/tplock.js'

const 숫자만 = (s) => Number(String(s || '').replace(/[^0-9.-]/g, '')) || 0
const 쉼표칸 = (s) => { const n = String(s || '').replace(/[^0-9]/g, ''); return n ? 원(Number(n)) : '' }
const 공수차례 = [1, 0.5, 1.5, 0]
const 직종예 = ['보통인부', '특별인부', '형틀목공', '철근공', '콘크리트공', '조적공', '미장공', '방수공', '타일공', '도장공', '비계공', '용접공', '배관공', '전공', '신호수', '장비운전원', '작업반장']

/** 1,234,500 → 일백이십삼만사천오백 */
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

export default function TuipbiBook(P) {
  return (
    <>
      <LockBar {...P} />
      {P.보기 === 'bill' ? <Bills {...P} /> : <Roster {...P} />}
    </>
  )
}

/* 🔒 잠금 띠 */
function LockBar({ 예시, 잠김, 잠금풀기 }) {
  const [pw, setPw] = useState('')
  const [바쁨, set바쁨] = useState(false)
  const [틀림, set틀림] = useState('')
  if (예시) return <div className="card tp-lock ok no-print">🔓 예시 현장 — 주민번호·계좌는 지어낸 것입니다. 실제 현장에서는 현장 비밀번호로 잠가 저장합니다.</div>
  if (!잠김) return <div className="card tp-lock ok no-print">🔓 이 기기에서 주민번호·계좌가 풀려 있습니다 — 서버에는 현장 비밀번호로 잠근 글로만 저장됩니다.</div>
  const 풀기 = async () => {
    if (!pw) return
    set바쁨(true); set틀림('')
    const ok = await 잠금풀기(pw)
    set바쁨(false)
    if (!ok) set틀림('비밀번호가 맞지 않습니다.')
    else setPw('')
  }
  return (
    <div className="card tp-lock no-print">
      <div>🔒 <b>주민번호·계좌가 잠겨 있습니다.</b> 이 기기에서 보려면 현장 비밀번호를 넣으십시오.</div>
      <div className="tp-start" style={{ marginTop: 8 }}>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="현장 비밀번호" style={{ maxWidth: 220 }}
          onKeyDown={(e) => { if (e.key === 'Enter') 풀기() }} autoComplete="current-password" />
        <button type="button" className="btn" style={{ width: 'auto' }} disabled={!pw || 바쁨} onClick={풀기}>{바쁨 ? '확인 중…' : '풀기'}</button>
      </div>
      {틀림 && <div className="tp-warn">{틀림}</div>}
    </div>
  )
}

/* ── 🧾 달마다 청구서 ─────────────────────────── */
function Bills(P) {
  const { 현장, 줄들, 사람, 장비, 업체, 출역, 풀린, 잠김, 예시 } = P
  const 달들 = useMemo(() => {
    const s = new Set(Object.keys(출역 || {}))
    for (const r of 줄들) if (r.d) s.add(r.d.slice(0, 7))
    s.add(오늘().slice(0, 7))
    return [...s].sort().reverse()
  }, [출역, 줄들])
  const [ym, setYm] = useState(() => 오늘().slice(0, 7))
  const [보기, set보기] = useState('L')
  const [뒷자리, set뒷자리] = useState(false)
  const N = useMemo(() => 노무달(ym, 출역, 사람), [ym, 출역, 사람])
  const E = useMemo(() => 장비달(ym, 줄들, 장비), [ym, 줄들, 장비])
  const M = useMemo(() => 자재달(ym, 줄들, 업체), [ym, 줄들, 업체])
  const [모두, set모두] = useState(false)               // 노무·장비·자재를 한 번에 인쇄
  useEffect(() => {
    const 끝 = () => { document.body.classList.remove('tp-print-bill'); set모두(false) }
    window.addEventListener('afterprint', 끝)
    return () => window.removeEventListener('afterprint', 끝)
  }, [])
  const 인쇄 = () => { document.body.classList.add('tp-print-bill'); setTimeout(() => window.print(), 50) }
  const 모두인쇄 = () => { set모두(true); document.body.classList.add('tp-print-bill'); setTimeout(() => window.print(), 300) }
  const C = useMemo(() => (보기 === 'C' ? 누계(ym, 출역, 사람, 줄들, 장비, 업체) : null), [보기, ym, 출역, 사람, 줄들, 장비, 업체])

  const [y, m] = ym.split('-')
  return (
    <>
      <div className="card no-print">
        <div className="tp-lh">
          <button type="button" className="chip" onClick={() => setYm(달더하기(ym, -1))} aria-label="전달">◀</button>
          <select value={ym} onChange={(e) => setYm(e.target.value)}>
            {[...new Set([ym, ...달들])].sort().reverse().map((x) => <option key={x} value={x}>{x.replace('-', '년 ')}월</option>)}
          </select>
          <button type="button" className="chip" onClick={() => setYm(달더하기(ym, 1))} aria-label="다음달">▶</button>
          <span className="muted" style={{ fontSize: 13 }}>노무 <b>{원(N.합계.보수)}</b> · 장비 <b>{원(E.합계)}</b> · 자재 <b>{원(M.합계)}</b></span>
        </div>
        <div className="tp-subtabs">
          {[['L', `👷 노무비 (${N.합계.인원}명)`], ['E', `🚜 장비 (${E.목록.length})`], ['M', `🧱 자재 (${M.목록.length})`], ['C', '📊 달별 누계 (처음~이 달)']].map(([k, t]) => (
            <button key={k} type="button" className={'chip' + (보기 === k ? ' on' : '')} onClick={() => set보기(k)}>{t}</button>
          ))}
        </div>
        <div className="tp-start" style={{ marginTop: 8 }}>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={모두인쇄}>🖨 이 달 청구서 모두 인쇄 (노무·장비·자재)</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 이 화면 인쇄</button>
          <label className="tp-chk" style={{ paddingBottom: 0 }}><input type="checkbox" checked={뒷자리} onChange={(e) => set뒷자리(e.target.checked)} disabled={잠김 && !예시} /> 주민번호 뒷자리 보이기</label>
        </div>
      </div>
      {모두 ? (
        <>
          <div className="card tp-bill"><LaborBill N={N} y={y} m={m} 현장={현장} 풀린={풀린} 잠김={잠김 && !예시} 뒷자리={뒷자리} {...P} /></div>
          <div className="card tp-bill tp-pb"><EquipBill E={E} y={y} m={m} 현장={현장} 풀린={풀린} 잠김={잠김 && !예시} ym={ym} /></div>
          <div className="card tp-bill tp-pb"><MatBill M={M} y={y} m={m} 현장={현장} 풀린={풀린} 잠김={잠김 && !예시} ym={ym} /></div>
        </>
      ) : (
        <div className="card tp-bill">
          {보기 === 'L' && <LaborBill N={N} y={y} m={m} 현장={현장} 풀린={풀린} 잠김={잠김 && !예시} 뒷자리={뒷자리} {...P} />}
          {보기 === 'E' && <EquipBill E={E} y={y} m={m} 현장={현장} 풀린={풀린} 잠김={잠김 && !예시} ym={ym} />}
          {보기 === 'M' && <MatBill M={M} y={y} m={m} 현장={현장} 풀린={풀린} 잠김={잠김 && !예시} ym={ym} />}
          {보기 === 'C' && C && <CumBill C={C} 현장={현장} />}
        </div>
      )}
    </>
  )
}

function BillHead({ 제목, 현장, ym, 날수, 금액, 금액이름 }) {
  return (
    <>
      <div className="tp-bill-hd">
        <h2 className="tp-bill-h">{제목}</h2>
        <Sign />
      </div>
      <table className="tbl tp-bill-top">
        <tbody>
          <tr><th>회사명</th><td>{현장.co || <span className="muted no-print">✏️ 현장 정보에서 회사명을 넣으십시오</span>}</td><th>현장명</th><td>{현장.name}</td><th>청구기간</th><td className="nw">{ym}-01 ~ {ym}-{String(날수).padStart(2, '0')}</td></tr>
          <tr><th>{금액이름}</th><td colSpan={5}><b>일금 {한글금액(금액)} 원정 (₩{원(금액)})</b></td></tr>
        </tbody>
      </table>
    </>
  )
}

function LaborBill({ N, y, m, 현장, 풀린, 잠김, 뒷자리, 출역찍기, 공제고치기, 비고고치기, 대상고치기, 사람, 가기 }) {
  const [편집, set편집] = useState(null)       // {pid, k}
  const ym = `${y}-${m}`
  const 날들 = Array.from({ length: N.날수 }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`)
  const 칸누름 = (r, i) => {
    const g = r.공수[i]
    const 다음 = g === 0 ? 1 : 공수차례[(공수차례.indexOf(g) + 1) % 공수차례.length]
    출역찍기(ym, r.pid, String(i + 1).padStart(2, '0'), 다음, 사람[r.pid] || r.p)
  }
  const 저장 = async (pid, k, s) => {
    set편집(null)
    if (s === null) return 공제고치기(ym, pid, k, null)
    const v = 숫자만(s)
    if (v >= 0) await 공제고치기(ym, pid, k, v)
  }
  /* 4대보험 대상 단추 — 자동이면 반대로(이 달만 넣기/빼기), 손으로 바꾼 것이면 자동으로 되돌림 */
  const 대상누름 = (r, c) => {
    const d = r.대상[c]
    if (d.이유 === '명부에서 뺌') { window.alert(`${r.p.n} 은(는) 명부에서 이 공제를 늘 빼 두었습니다.\n👷 명부 → ${r.p.n} 고치기 → «공제 빼기» 를 끄십시오.`); return }
    let ap = r.ap.replace(c, ''), ex = r.ex.replace(c, '')
    if (!d.손) { if (d.대상) ex += c; else ap += c }
    대상고치기(ym, r.pid, ap, ex)
  }
  const 안됨 = N.줄.filter((r) => !r.대상.P.대상 || !r.대상.H.대상)
  if (!N.줄.length) {
    return (
      <>
        <BillHead 제목={`일용직 노무비 청구 내역서 (${y}년 ${m}월)`} 현장={현장} ym={ym} 날수={N.날수} 금액={0} 금액이름="청구금액" />
        <div className="muted" style={{ padding: '14px 0' }}>이 달 출역이 없습니다. <button type="button" className="tp-x" onClick={() => 가기('day')}>✍️ 적기 탭에서 출역을 찍으십시오 →</button></div>
      </>
    )
  }
  return (
    <>
      <BillHead 제목={`일용직 노무비 청구 내역서 (${y}년 ${m}월)`} 현장={현장} ym={ym} 날수={N.날수} 금액={N.합계.보수} 금액이름="청구금액" />

      <div className="tp-bill-sub">① 출역 대장 <span className="muted no-print">— 칸을 누르면 1 → 0.5 → 1.5 → 빼기</span></div>
      <div className="tp-scroll">
        <table className="tbl tp-grid">
          <thead>
            <tr>
              <th className="stk">성명</th>
              {날들.map((d, i) => { const w = 요일(d); return <th key={d} className={w === '일' ? 'sun' : w === '토' ? 'sat' : ''}>{i + 1}<br /><small>{w}</small></th> })}
              <th>공수</th><th>일수</th><th>일급</th><th>보수총액</th>
            </tr>
          </thead>
          <tbody>
            {N.줄.map((r) => (
              <tr key={r.pid}>
                <td className="stk nw"><b>{r.p.n}</b> <small className="muted">{r.p.j}</small></td>
                {r.공수.map((g, i) => (
                  <td key={i} className={'tp-gc' + (g > 0 ? ' on' : '') + (g > 0 && g !== 1 ? ' part' : '')} onClick={() => 칸누름(r, i)}>{g > 0 ? 공수글(g) : ''}</td>
                ))}
                <td className="r">{공수글(r.공수합)}</td><td className="r">{r.일수}</td><td className="r">{원(r.w)}</td><td className="r"><b>{원(r.보수)}</b></td>
              </tr>
            ))}
            <tr className="sum">
              <td className="stk">합계 {N.합계.인원}명</td>
              {N.날합.map((n, i) => <td key={i} className="r">{n || ''}</td>)}
              <td className="r">{공수글(N.합계.공수)}</td><td className="r">{N.합계.일수}</td><td /><td className="r"><b>{원(N.합계.보수)}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="tp-bill-sub">② 청구 내역서 <span className="muted no-print">— 보험 단추를 누르면 이 달만 넣고 빼며, 공제 칸을 누르면 금액을 고쳐 씁니다 (🟨 = 손으로 고친 칸)</span></div>
      <div className="tp-billsum">
        <div><span>청구금액 (보수총액)</span><b>{원(N.합계.보수)}</b></div>
        <div className="minus"><span>공제 합계</span><b>− {원(N.합계.합)}</b>
          <i>{공제칸.map((c) => `${c.이름} ${원(N.합계[c.k])}`).join(' · ')}</i></div>
        <div className="pay"><span>실지급액 (차인지급액)</span><b>{원(N.합계.차인)}</b><i>공제를 뺀, 근로자에게 줄 돈</i></div>
      </div>
      <div className="tp-inssum">
        <b>4대보험 대상</b> — 국민연금 <b>{N.합계.대상수.P}명</b> · 건강·요양 <b>{N.합계.대상수.H}명</b> · 고용 <b>{N.합계.대상수.E}명</b> / 전체 {N.합계.인원}명
        {안됨.length > 0 && <> · <span className="muted">대상 아님: {안됨.map((r) => `${r.p.n}(${[!r.대상.P.대상 && '연금', !r.대상.H.대상 && '건강'].filter(Boolean).join('·')} — ${r.대상.P.대상 ? r.대상.H.이유 : r.대상.P.이유})`).join(', ')}</span></>}
      </div>
      <div className="tp-scroll">
        <table className="tbl tp-lb">
          <thead>
            <tr>
              <th>No</th><th>성명</th><th>주민등록번호</th><th>연락처</th><th>직종</th><th>일수</th><th>청구금액</th><th>4대보험 대상</th>
              {공제칸.map((c) => <th key={c.k}>{c.이름}</th>)}
              <th>공제계</th><th>실지급액<br /><small>(차인지급액)</small></th><th>은행</th><th>계좌번호</th><th>예금주</th><th>비고</th>
            </tr>
          </thead>
          <tbody>
            {N.줄.map((r, i) => {
              const x = (풀린 && 풀린[r.pid]) || {}
              return (
                <tr key={r.pid}>
                  <td>{i + 1}</td>
                  <td className="nw"><b>{r.p.n}</b></td>
                  <td className="nw">{잠김 ? '🔒' : x.r ? 주민가림(x.r, 뒷자리) : ''}</td>
                  <td className="nw">{r.p.tel || ''}</td>
                  <td className="nw">{r.p.j || ''}</td>
                  <td className="r">{r.일수}</td>
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
                    if (편집 && 편집.pid === r.pid && 편집.k === c.k) {
                      return (
                        <td key={c.k} className="r tp-ded">
                          <input className="tp-dedin" autoFocus defaultValue={원(r.최종[c.k])} inputMode="numeric"
                            onKeyDown={(e) => { if (e.key === 'Enter') 저장(r.pid, c.k, e.currentTarget.value); if (e.key === 'Escape') set편집(null) }}
                            onBlur={(e) => 저장(r.pid, c.k, e.currentTarget.value)} />
                          {고침 && <button type="button" className="tp-x" onMouseDown={(e) => { e.preventDefault(); 저장(r.pid, c.k, null) }}>자동</button>}
                        </td>
                      )
                    }
                    return (
                      <td key={c.k} className={'r tp-ded' + (고침 ? ' fix' : '')} title={고침 ? `자동 값 ${원(r.자동[c.k])}` : '누르면 고쳐 씁니다'} onClick={() => set편집({ pid: r.pid, k: c.k })}>
                        {원(r.최종[c.k])}
                      </td>
                    )
                  })}
                  <td className="r">{원(r.최종.합)}</td>
                  <td className="r"><b>{원(r.최종.차인)}</b></td>
                  <td className="nw">{잠김 ? '🔒' : x.b || ''}</td>
                  <td className="nw">{잠김 ? '🔒' : x.a || ''}</td>
                  <td className="nw">{잠김 ? '🔒' : x.h || ''}</td>
                  <td className="tp-memo" onClick={() => { const v = window.prompt(`${r.p.n} 비고`, r.비고 || ''); if (v !== null) 비고고치기(ym, r.pid, v.trim().slice(0, 100)) }}>{r.비고 || <span className="muted no-print">＋</span>}</td>
                </tr>
              )
            })}
            <tr className="sum">
              <td /><td>합계</td><td /><td /><td>{N.합계.인원}명</td><td className="r">{N.합계.일수}</td><td className="r"><b>{원(N.합계.보수)}</b></td>
              <td className="nw">연금 {N.합계.대상수.P} · 건강 {N.합계.대상수.H} · 고용 {N.합계.대상수.E}</td>
              {공제칸.map((c) => <td key={c.k} className="r">{원(N.합계[c.k])}</td>)}
              <td className="r">{원(N.합계.합)}</td><td className="r"><b>{원(N.합계.차인)}</b></td><td colSpan={4} />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="tp-note">
        {(() => { const R = 요율(ym); return <>공제 — {R.해}년 요율: 소득세 (일급−15만원)×2.7%(한 달 합 1천원 미만 안 뗌) · 지방소득세 10% · 고용 {(R.ei * 100).toFixed(1)}% · 국민연금 {(R.np * 100).toFixed(2).replace(/0$/, '')}%(이 현장 한 달 8일↑ 또는 220만원↑) · 건강 {(R.hi * 100).toFixed(3)}% · 장기요양 건강보험료×{(R.lc * 100).toFixed(2)}%(8일↑) · 10원 미만 버림.</> })()}
        {N.잠정 && N.잠정.length > 0 && <b> ⚠️ {N.잠정.join('·')} 요율은 아직 확정 전이라 2026년 값으로 셈했습니다.</b>}
        {N.요율없음 && <b> ⚠️ 이 해의 요율은 아직 없어 {N.요율해}년 요율로 셈했습니다.</b>}
        {' '}다른 현장 근무(국민연금은 회사 합산)·나이 등은 모르니 보험 단추로 넣고 빼고, 신고 전 한 번 더 확인하십시오.
      </div>
    </>
  )
}

/* 📊 달별 누계 — 소장님: 「달별로 누적해서도 되게 해줘」 · 「공제금은 얼마인지도..」 · 「공제금 제외 후 지급해야 할 금액은 얼마인지도」 */
function CumBill({ C, 현장 }) {
  const [사람보기, set사람보기] = useState(false)
  return (
    <>
      <div className="tp-bill-hd">
        <h2 className="tp-bill-h">달별 누계 ({C.처음.replace('-', '년 ')}월 ~ {C.끝.replace('-', '년 ')}월)</h2>
        <Sign />
      </div>
      <table className="tbl tp-bill-top">
        <tbody>
          <tr><th>회사명</th><td>{현장.co || ''}</td><th>현장명</th><td>{현장.name}</td><th>기간</th><td className="nw">{C.처음} ~ {C.끝} ({C.달.length}개월)</td></tr>
        </tbody>
      </table>
      <div className="tp-billsum">
        <div><span>노무 보수총액 누계</span><b>{원(C.합계.보수)}</b></div>
        <div className="minus"><span>공제 누계</span><b>− {원(C.합계.공제합)}</b><i>{공제칸.map((c) => `${c.이름} ${원(C.합계.공제[c.k])}`).join(' · ')}</i></div>
        <div className="pay"><span>실지급액 누계</span><b>{원(C.합계.차인)}</b><i>공제를 뺀, 근로자에게 준(줄) 돈</i></div>
        <div><span>장비 + 자재 누계</span><b>{원(C.합계.장비 + C.합계.자재)}</b><i>장비 {원(C.합계.장비)} · 자재 {원(C.합계.자재)}</i></div>
      </div>
      <div className="tp-bill-sub">① 달별</div>
      <div className="tp-scroll">
        <table className="tbl tp-eb tp-cum">
          <thead><tr><th>월</th><th>인원</th><th>보수총액</th>{공제칸.map((c) => <th key={c.k}>{c.이름}</th>)}<th>공제 합계</th><th>실지급액</th><th>장비</th><th>자재</th><th>달 합계</th><th>합계 누계</th></tr></thead>
          <tbody>
            {C.달.map((d) => (
              <tr key={d.ym}>
                <td className="nw">{d.ym}</td><td className="r">{d.인원}</td><td className="r">{원(d.보수)}</td>
                {공제칸.map((c) => <td key={c.k} className="r">{원(d.공제[c.k])}</td>)}
                <td className="r">{원(d.공제합)}</td><td className="r"><b>{원(d.차인)}</b></td>
                <td className="r">{원(d.장비)}</td><td className="r">{원(d.자재)}</td><td className="r">{원(d.합)}</td><td className="r"><b>{원(d.누계)}</b></td>
              </tr>
            ))}
            <tr className="sum">
              <td>합계</td><td /><td className="r">{원(C.합계.보수)}</td>
              {공제칸.map((c) => <td key={c.k} className="r">{원(C.합계.공제[c.k])}</td>)}
              <td className="r">{원(C.합계.공제합)}</td><td className="r">{원(C.합계.차인)}</td>
              <td className="r">{원(C.합계.장비)}</td><td className="r">{원(C.합계.자재)}</td><td className="r">{원(C.합계.합)}</td><td />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="tp-bill-sub">② 사람별 누계 <button type="button" className="tp-x no-print" onClick={() => set사람보기(!사람보기)}>{사람보기 ? '접기' : `펼치기 (${C.사람들.length}명)`}</button></div>
      {사람보기 && (
        <div className="tp-scroll">
          <table className="tbl tp-eb">
            <thead><tr><th>성명</th><th>직종</th><th>공수</th><th>일수</th><th>보수총액</th>{공제칸.map((c) => <th key={c.k}>{c.이름}</th>)}<th>공제 합계</th><th>실지급액</th></tr></thead>
            <tbody>
              {C.사람들.map((x) => (
                <tr key={x.pid}>
                  <td className="nw"><b>{x.p.n}</b></td><td className="nw">{x.p.j || ''}</td><td className="r">{공수글(x.합계.공수)}</td><td className="r">{x.합계.일수}</td>
                  <td className="r">{원(x.합계.보수)}</td>{공제칸.map((c) => <td key={c.k} className="r">{원(x.합계[c.k])}</td>)}
                  <td className="r">{원(x.합계.합)}</td><td className="r"><b>{원(x.합계.차인)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="tp-note">외주·경비·기타·기성은 «📊 한눈에» 와 «📈 기성·공정률» 에 있습니다. 사람별 누계는 «펼치기» 를 누른 뒤 인쇄하면 같이 나옵니다.</div>
    </>
  )
}

function AcctLine({ x, 잠김 }) {
  if (잠김) return <span className="muted">🔒 계좌 잠김</span>
  if (!x) return null
  const s = [x.biz ? `사업자 ${x.biz}` : '', [x.b, x.a].filter(Boolean).join(' '), x.h ? `예금주 ${x.h}` : ''].filter(Boolean).join(' · ')
  return s ? <span>{s}</span> : null
}

function EquipBill({ E, y, m, 현장, 풀린, 잠김, ym }) {
  return (
    <>
      <BillHead 제목={`장비 사용 청구 내역서 (${y}년 ${m}월)`} 현장={현장} ym={ym} 날수={new Date(Number(y), Number(m), 0).getDate()} 금액={E.합계} 금액이름="청구금액" />
      {!E.목록.length ? <div className="muted" style={{ padding: '14px 0' }}>이 달 장비 사용이 없습니다.</div> : (
        <div className="tp-scroll">
          <table className="tbl tp-eb">
            <thead><tr><th>날짜</th><th>내용</th><th>수량</th><th>단위</th><th>단가</th><th>금액</th></tr></thead>
            {E.목록.map((g) => (
              <tbody key={g.key}>
                <tr className="grp"><td colSpan={6}><b>{g.장비}{g.규격 ? ' ' + g.규격 : ''}</b>{g.업체 ? ` · ${g.업체}` : ''}{g.단가 ? ` · ${원(g.단가)}원/${g.단위 || '일'}` : ''} <span className="tp-acct"><AcctLine x={풀린 && 풀린[g.id]} 잠김={잠김 && !!g.id} /></span></td></tr>
                {g.줄.map((r) => (
                  <tr key={r.id}><td className="nw">{r.d} ({요일(r.d)})</td><td>{장비메모(r, g)}</td><td className="r">{공수글(Number(r.q) || 0)}</td><td>{r.un || g.단위}</td><td className="r">{원(r.u)}</td><td className="r">{원(r.amt)}</td></tr>
                ))}
                <tr className="sub"><td colSpan={2}>소계</td><td className="r">{공수글(g.수량)}</td><td>{g.단위}</td><td /><td className="r"><b>{원(g.금액)}</b></td></tr>
              </tbody>
            ))}
            <tbody><tr className="sum"><td colSpan={5}>합계</td><td className="r"><b>{원(E.합계)}</b></td></tr></tbody>
          </table>
        </div>
      )}
    </>
  )
}

function MatBill({ M, y, m, 현장, 풀린, 잠김, ym }) {
  return (
    <>
      <BillHead 제목={`자재 반입 청구 내역서 (${y}년 ${m}월)`} 현장={현장} ym={ym} 날수={new Date(Number(y), Number(m), 0).getDate()} 금액={M.합계} 금액이름="청구금액" />
      {!M.목록.length ? <div className="muted" style={{ padding: '14px 0' }}>이 달 자재 반입이 없습니다.</div> : (
        <div className="tp-scroll">
          <table className="tbl tp-eb">
            <thead><tr><th>날짜</th><th>품명</th><th>규격</th><th>수량</th><th>단위</th><th>단가</th><th>금액</th></tr></thead>
            {M.목록.map((g) => (
              <tbody key={g.key}>
                <tr className="grp"><td colSpan={7}><b>{g.업체}</b> <span className="tp-acct"><AcctLine x={풀린 && 풀린[g.id]} 잠김={잠김 && !!g.id} /></span></td></tr>
                {g.줄.map((r) => (
                  <tr key={r.id}><td className="nw">{r.d} ({요일(r.d)})</td><td>{r.t}</td><td>{r.sp || ''}</td><td className="r">{공수글(Number(r.q) || 0)}</td><td>{r.un || ''}</td><td className="r">{r.u != null ? 원(r.u) : ''}</td><td className="r">{원(r.amt)}</td></tr>
                ))}
                <tr className="sub"><td colSpan={6}>소계 ({g.줄.length}건)</td><td className="r"><b>{원(g.금액)}</b></td></tr>
              </tbody>
            ))}
            <tbody><tr className="sum"><td colSpan={6}>합계</td><td className="r"><b>{원(M.합계)}</b></td></tr></tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Sign() {
  return (
    <table className="tbl tp-sign">
      <tbody>
        <tr><th>작성</th><th>검토</th><th>현장소장</th></tr>
        <tr><td /><td /><td /></tr>
      </tbody>
    </table>
  )
}

/* ── 👷 명부 ─────────────────────────────────── */
const 종류들 = [
  { k: 'people', 이름: '근로자', 아이콘: '👷' },
  { k: 'equip', 이름: '장비', 아이콘: '🚜' },
  { k: 'vendors', 이름: '자재 업체', 아이콘: '🧱' },
]

function Roster(P) {
  const { 사람, 장비, 업체, 풀린, 잠김, 예시 } = P
  const [종류, set종류] = useState('people')
  const [폼, set폼] = useState(null)             // {id|null}
  const [떠난것, set떠난것] = useState(false)
  const 자료 = 종류 === 'people' ? 사람 : 종류 === 'equip' ? 장비 : 업체
  const 목록 = Object.entries(자료 || {}).filter(([, v]) => 떠난것 || !v.off)
    .sort((a, b) => (a[1].off ? 1 : 0) - (b[1].off ? 1 : 0) || (a[1].j || a[1].v || '').localeCompare(b[1].j || b[1].v || '', 'ko') || a[1].n.localeCompare(b[1].n, 'ko'))
  const 떠난수 = Object.values(자료 || {}).filter((v) => v.off).length
  const 잠 = 잠김 && !예시
  return (
    <>
      <div className="card no-print">
        <div className="tp-subtabs">
          {종류들.map((x) => (
            <button key={x.k} type="button" className={'chip' + (종류 === x.k ? ' on' : '')} onClick={() => { set종류(x.k); set폼(null) }}>
              {x.아이콘} {x.이름} ({Object.values((x.k === 'people' ? 사람 : x.k === 'equip' ? 장비 : 업체) || {}).filter((v) => !v.off).length})
            </button>
          ))}
        </div>
        <div className="tp-start" style={{ marginTop: 10 }}>
          <button type="button" className="btn" style={{ width: 'auto' }} onClick={() => set폼({ id: null })}>＋ {종류들.find((x) => x.k === 종류).이름} 올리기</button>
          {떠난수 > 0 && <label className="tp-chk" style={{ paddingBottom: 0 }}><input type="checkbox" checked={떠난것} onChange={(e) => set떠난것(e.target.checked)} /> 떠난 것도 보기 ({떠난수})</label>}
        </div>
      </div>
      {폼 && <RosterForm key={종류 + (폼.id || 'new')} 종류={종류} id={폼.id} 원본={폼.id ? 자료[폼.id] : null} 풀린={폼.id ? (풀린 || {})[폼.id] : null} 잠={잠} {...P} 닫기={() => set폼(null)} />}
      <div className="card">
        {목록.length === 0 ? (
          <div className="muted">아직 없습니다. 위 «＋ 올리기» 로 {종류 === 'people' ? '근로자' : 종류 === 'equip' ? '장비' : '자재 업체'}를 올리십시오.</div>
        ) : (
          <div className="tp-scroll">
            <table className="tbl tp-rost">
              <thead>
                {종류 === 'people' && <tr><th>이름</th><th>직종</th><th>일급</th><th>연락처</th><th>🔒 주민번호</th><th>🔒 계좌</th><th>공제 빼기</th><th /></tr>}
                {종류 === 'equip' && <tr><th>장비</th><th>규격</th><th>업체</th><th>단가</th><th>🔒 계좌</th><th /></tr>}
                {종류 === 'vendors' && <tr><th>업체</th><th>품목</th><th>🔒 사업자번호</th><th>🔒 계좌</th><th /></tr>}
              </thead>
              <tbody>
                {목록.map(([id, v]) => {
                  const x = (풀린 || {})[id] || {}
                  const 계 = 잠 && v.x ? '🔒' : [x.b, x.a, x.h ? `(${x.h})` : ''].filter(Boolean).join(' ')
                  return (
                    <tr key={id} className={v.off ? 'off' : ''}>
                      <td className="nw"><b>{v.n}</b>{v.off && <span className="muted"> · 떠남</span>}</td>
                      {종류 === 'people' && <>
                        <td className="nw">{v.j}</td><td className="r">{원(v.w)}</td><td className="nw">{v.tel || ''}</td>
                        <td className="nw">{잠 && v.x ? '🔒' : x.r ? 주민가림(x.r, false) : ''}</td><td>{계}</td>
                        <td className="nw muted">{(v.nx || '').split('').map((c) => ({ P: '연금', H: '건강', E: '고용', T: '소득세' }[c])).filter(Boolean).join('·')}</td>
                      </>}
                      {종류 === 'equip' && <>
                        <td className="nw">{v.s || ''}</td><td className="nw">{v.v || ''}</td><td className="r nw">{원(v.u)}원/{v.un || '일'}</td><td>{계}</td>
                      </>}
                      {종류 === 'vendors' && <>
                        <td>{v.g || ''}</td><td className="nw">{잠 && v.x ? '🔒' : x.biz || ''}</td><td>{계}</td>
                      </>}
                      <td className="nw no-print"><button type="button" className="tp-x" onClick={() => { set폼({ id }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>고치기</button></td>
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

function RosterForm({ 종류, id, 원본, 풀린, 잠, 예시, 명부저장, 명부지우기, 출역, 그달일급, 닫기 }) {
  const o = 원본 || {}
  const x0 = 풀린 || {}
  const [v, setV] = useState({
    n: o.n || '', j: o.j || '', w: o.w ? 원(o.w) : '', tel: o.tel || '', s: o.s || '', vv: o.v || '', u: o.u ? 원(o.u) : '', un: o.un || '일', g: o.g || '',
    nx: o.nx || '', off: !!o.off,
    r: x0.r || '', b: x0.b || '', a: x0.a || '', h: x0.h || '', biz: x0.biz || '',
  })
  const [이번달도, set이번달도] = useState(true)
  const [바쁨, set바쁨] = useState(false)
  const [오류, set오류] = useState('')
  const f = (k, 돈) => (e) => setV({ ...v, [k]: 돈 ? 쉼표칸(e.target.value) : e.target.value })
  const 빼기토글 = (c) => setV({ ...v, nx: v.nx.includes(c) ? v.nx.replace(c, '') : v.nx + c })
  const ym = 오늘().slice(0, 7)
  const 일급바뀜 = 종류 === 'people' && id && 숫자만(v.w) !== Number(o.w || 0) && 출역 && 출역[ym] && 출역[ym][id]
  const 틀림 = !v.n.trim() ? '이름을 적어 주십시오'
    : 종류 === 'people' && !(숫자만(v.w) > 0) ? '일급을 적어 주십시오'
      : 종류 === 'equip' && !(숫자만(v.u) > 0) ? '단가를 적어 주십시오'
        : 종류 === 'people' && v.r && !/^\d{6}-?\d{7}$/.test(v.r.replace(/\s/g, '')) ? '주민등록번호는 13자리(900101-1234567)로 적어 주십시오' : ''
  const 저장 = async () => {
    if (틀림) return
    set바쁨(true); set오류('')
    let obj
    if (종류 === 'people') {
      obj = { n: v.n.trim().slice(0, 20), w: 숫자만(v.w), at: o.at || Date.now() }
      if (v.j.trim()) obj.j = v.j.trim().slice(0, 20)
      if (v.tel.trim()) obj.tel = v.tel.trim().slice(0, 20)
      const nx = ['P', 'H', 'E', 'T'].filter((c) => v.nx.includes(c)).join('')
      if (nx) obj.nx = nx
    } else if (종류 === 'equip') {
      obj = { n: v.n.trim().slice(0, 40), u: 숫자만(v.u), un: v.un || '일', at: o.at || Date.now() }
      if (v.s.trim()) obj.s = v.s.trim().slice(0, 40)
      if (v.vv.trim()) obj.v = v.vv.trim().slice(0, 40)
    } else {
      obj = { n: v.n.trim().slice(0, 40), at: o.at || Date.now() }
      if (v.g.trim()) obj.g = v.g.trim().slice(0, 60)
    }
    if (v.off) obj.off = true
    let 잠금 = undefined                                   // undefined = 전에 잠근 것 그대로
    if (!잠) {
      잠금 = {}
      const 넣기 = (k, val) => { if (String(val || '').trim()) 잠금[k] = String(val).trim().slice(0, 60) }
      if (종류 === 'people') 넣기('r', v.r.replace(/\s/g, '').replace(/^(\d{6})(\d{7})$/, '$1-$2'))
      else 넣기('biz', v.biz)
      넣기('b', v.b); 넣기('a', v.a); 넣기('h', v.h)
    }
    const ok = await 명부저장(종류, id, obj, 잠금)
    if (ok && 일급바뀜 && 이번달도) await 그달일급(ym, id, obj.w)
    set바쁨(false)
    if (ok) 닫기()
    else set오류('저장하지 못했습니다 — 인터넷을 확인해 주십시오.')
  }
  const 지우기 = async () => {
    if (!window.confirm(`«${o.n}» 을 명부에서 지울까요?\n지난 출역·반입 기록은 남지만 이름이 «지운 사람» 으로 보입니다.\n보통은 «현장 떠남» 을 켜시는 것이 낫습니다.`)) return
    set바쁨(true)
    await 명부지우기(종류, id)
    set바쁨(false)
    닫기()
  }
  const 이름 = 종류 === 'people' ? '근로자' : 종류 === 'equip' ? '장비' : '자재 업체'
  const 잠칸 = { disabled: 잠, placeholder: 잠 ? '🔒 잠김 — 위에서 비밀번호로 풀면 넣고 봅니다' : '' }
  return (
    <div className="card no-print tp-rform">
      <div className="detail-h">{id ? `✏️ ${이름} 고치기` : `＋ ${이름} 올리기`}{예시 && <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · 예시라 저장되지 않습니다</span>}</div>
      <div className="tp-form">
        {종류 === 'people' && <>
          <div className="tp-two">
            <label>이름 <input value={v.n} onChange={f('n')} maxLength={20} placeholder="홍길동" /></label>
            <label>직종 <input value={v.j} onChange={f('j')} maxLength={20} list="tp-jobs" placeholder="형틀목공" /></label>
          </div>
          <datalist id="tp-jobs">{직종예.map((j) => <option key={j} value={j} />)}</datalist>
          <div className="tp-two">
            <label>일급 (원) <input value={v.w} onChange={f('w', 1)} inputMode="numeric" placeholder="187,000" /></label>
            <label>연락처 (선택) <input value={v.tel} onChange={f('tel')} maxLength={20} inputMode="tel" placeholder="010-0000-0000" /></label>
          </div>
          {일급바뀜 && <label className="tp-chk"><input type="checkbox" checked={이번달도} onChange={(e) => set이번달도(e.target.checked)} /> 이번 달({ym}) 이미 찍은 출역의 일급도 새 일급으로</label>}
          <label>🔒 주민등록번호 <input value={v.r} onChange={f('r')} maxLength={14} inputMode="numeric" autoComplete="off" {...잠칸} placeholder={잠칸.placeholder || '900101-1234567'} /></label>
        </>}
        {종류 === 'equip' && <>
          <div className="tp-two">
            <label>장비명 <input value={v.n} onChange={f('n')} maxLength={40} placeholder="굴착기" /></label>
            <label>규격 <input value={v.s} onChange={f('s')} maxLength={40} placeholder="0.7㎥" /></label>
          </div>
          <div className="tp-two">
            <label>업체 <input value={v.vv} onChange={f('vv')} maxLength={40} placeholder="○○중기" /></label>
            <label>단가 (원) · 단위 <span style={{ display: 'flex', gap: 6 }}>
              <input value={v.u} onChange={f('u', 1)} inputMode="numeric" placeholder="950,000" />
              <select value={v.un} onChange={f('un')} style={{ width: 90 }}>{단위들.map((x) => <option key={x} value={x}>/{x}</option>)}</select>
            </span></label>
          </div>
          <label>🔒 사업자등록번호 (선택) <input value={v.biz} onChange={f('biz')} maxLength={20} autoComplete="off" {...잠칸} placeholder={잠칸.placeholder || '000-00-00000'} /></label>
        </>}
        {종류 === 'vendors' && <>
          <div className="tp-two">
            <label>업체명 <input value={v.n} onChange={f('n')} maxLength={40} placeholder="○○레미콘(주)" /></label>
            <label>품목 (선택) <input value={v.g} onChange={f('g')} maxLength={60} placeholder="레미콘" /></label>
          </div>
          <label>🔒 사업자등록번호 (선택) <input value={v.biz} onChange={f('biz')} maxLength={20} autoComplete="off" {...잠칸} placeholder={잠칸.placeholder || '000-00-00000'} /></label>
        </>}
        <div className="tp-three">
          <label>🔒 은행 <input value={v.b} onChange={f('b')} maxLength={20} autoComplete="off" {...잠칸} placeholder={잠칸.placeholder || '○○은행'} /></label>
          <label>🔒 계좌번호 <input value={v.a} onChange={f('a')} maxLength={30} autoComplete="off" {...잠칸} placeholder={잠 ? '🔒' : '000-0000-0000'} /></label>
          <label>🔒 예금주 <input value={v.h} onChange={f('h')} maxLength={20} autoComplete="off" {...잠칸} placeholder={잠 ? '🔒' : '홍길동'} /></label>
        </div>
        {종류 === 'people' && (
          <div className="tp-nx">
            <span>공제 빼기 (해당할 때만):</span>
            {[['P', '국민연금 (60세 이상·다른 곳 가입 등)'], ['H', '건강·요양 (다른 곳 직장가입 등)'], ['E', '고용보험 (65세 이후 새로 고용 등)'], ['T', '소득세·지방세']].map(([c, t]) => (
              <label key={c} className="tp-chk"><input type="checkbox" checked={v.nx.includes(c)} onChange={() => 빼기토글(c)} /> {t}</label>
            ))}
          </div>
        )}
        <label className="tp-chk"><input type="checkbox" checked={v.off} onChange={(e) => setV({ ...v, off: e.target.checked })} /> 현장 떠남 (목록·출역에서 숨김 — 지난 기록은 그대로)</label>
        <div className="muted" style={{ fontSize: 12 }}>🔒 칸은 이 기기에서 현장 비밀번호로 잠근 뒤 저장합니다 — 서버·저희는 볼 수 없습니다.</div>
      </div>
      {틀림 && (v.n || v.w || v.u) && <div className="tp-warn">{틀림}</div>}
      {오류 && <div className="tp-warn">{오류}</div>}
      <div className="tp-start" style={{ marginTop: 12 }}>
        <button type="button" className="btn" style={{ width: 'auto' }} disabled={!!틀림 || 바쁨} onClick={저장}>{바쁨 ? '저장 중…' : '저장'}</button>
        <button type="button" className="btn ghost" style={{ width: 'auto' }} onClick={닫기}>그만두기</button>
        {id && <button type="button" className="btn ghost" style={{ width: 'auto', marginLeft: 'auto', color: '#dc2626' }} onClick={지우기} disabled={바쁨}>명부에서 지우기</button>}
      </div>
    </div>
  )
}
