import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 일한달들, 달글, 원 } from '../lib/신고정리.js'
import { 달집계, 누계, 설정정리, 낸것바꿈 } from '../lib/퇴직공제.js'
import { 퇴직공제일액, 퇴직공제일액표, 달더하기, 한국오늘, 남은날, 디데이, 요일, 짧은날, 기한미루기, 긴날 } from '../lib/해마다.js'
import { use노무자료, 노무자료줄, 출역없음 } from '../tools/노무자료.jsx'
import 해마다띠 from '../tools/해마다띠.jsx'
import 도구설명 from '../tools/도구설명.jsx'

/**
 * 👷 /tools/toejik — 건설근로자 퇴직공제 집계 (G116 · 2026-10-02)
 *
 * 소장님: 「매달 신고 정리, 퇴직공제 집계, 고용·산재 보험료 계산기 … 현재 사이트에 있는 것과 연계해서」 · 「해마다 바뀌는 건 잊지 않게」
 * ■ 출역은 노무비 계산기(또는 현장 투입비)에 적은 것 그대로 — 이 화면은 «입찰공고일 · 계상액 · 뺄 사람 · 낸 금액» 만 받습니다.
 * ■ 🔁 일의 연속성(소장님 「일의 연속성도 고려 해 주고..」): 달마다 «낸 금액 · 낸 날» 을 남기고 누계로 셈한 부금 · 계상액과 견줌 · 안 낸 달 표시 ·
 *   설정 · 기록은 노무비 자료 안(st.tj)이라 노무비 «🔗 코드» 로 폰 · PC 같이 감(투입비 현장은 이 브라우저).
 * ■ 근로일수: 공수 1 이상(1.5 포함) = 1일 · 0.5 공수는 합쳐서 1일, 남는 것은 다음 달로(시행규칙 제15조⑤1 · 공제회 안내)
 * ■ 일액: 입찰공고일로 고름 — 2026.4.1. 이후 8,700원 · 2020.5.27.~2026.3.31. 6,500원 (lib/해마다.js)
 */
const 지난달 = () => 달더하기(한국오늘().slice(0, 7), -1)
const 숫자만 = (s) => { const v = Number(String(s ?? '').replace(/[^\d]/g, '')); return Number.isFinite(v) ? v : 0 }

export default function Toejik() {
  const 노 = use노무자료()
  const 자료 = 노.자료
  const 달들 = useMemo(() => 일한달들(자료), [자료])
  const [고른, set고른] = useState(null)
  const ym = 고른 && 달들.includes(고른) ? 고른 : (달들.includes(지난달()) ? 지난달() : 달들[달들.length - 1])
  const 설정 = 설정정리(노.기록('tj'))
  const set설정 = (f) => 노.기록쓰기('tj', { ...f(설정), on: true })
  const [낸칸, set낸칸] = useState({ a: '', d: '' })
  const 액 = 퇴직공제일액(설정.d)
  const T = ym ? 달집계(자료, 설정, ym) : null
  const C = ym ? 누계(자료, 설정, ym) : null
  const 오늘 = 한국오늘()
  const 이달낸 = ym ? 설정.paid[ym] : null
  const 낸기록 = () => { set설정((s) => 낸것바꿈(s, ym, { a: 낸칸.a === '' ? T.합.부금 : 숫자만(낸칸.a), d: 낸칸.d || 오늘 })); set낸칸({ a: '', d: '' }) }
  const 기한 = T ? 기한미루기(T.기한) : null
  useEffect(() => {
    const 끝 = () => document.body.classList.remove('hm-print')
    window.addEventListener('afterprint', 끝)
    return () => { window.removeEventListener('afterprint', 끝); 끝() }
  }, [])
  const 인쇄 = () => { document.body.classList.add('hm-print'); setTimeout(() => window.print(), 80) }
  const 엑셀 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸 } = await import('../lib/값엑셀.js')
    const 줄 = T.줄.map((r, i) => [i + 1, r.p.n, r.p.b || '', r.p.j, r.온, r.짧은 || '', r.넘어옴 || '', r.뺌 ? 0 : r.일수, r.남음 || '', 수칸(r.부금), r.뺌 ? '뺌(피공제자 아님)' : ''])
    줄.push(['', 굵은칸('합계'), '', `${T.합.인원}명`, '', '', '', T.합.일수, '', 수칸(T.합.부금), ''])
    const 달 = C.달별.map((m) => [달글(m.ym), m.일수, 수칸(m.부금), m.누계일수, 수칸(m.누계부금), m.낸 ? 수칸(m.낸.a) : '', m.낸 ? m.낸.d : ''])
    값엑셀받기(`퇴직공제_${자료.site || '현장'}_${ym}`, [
      { name: `근로일수 ${달글(ym)}`, head: ['No', '성명', '생년월일', '직종', '1공수 이상 날', '0.5공수 합', '앞 달에서 넘어옴', '근로일수', '다음 달로', `공제부금(일액 ${원(액.일액)}원)`, '비고'], rows: 줄,
        widths: [5, 10, 10, 10, 10, 10, 12, 9, 9, 16, 18] },
      { name: '달별 누계', head: ['달', '근로일수', '공제부금', '누계 일수', '누계 부금', '낸 금액', '낸 날'], rows: [...달, [], ['계상액(퇴직공제부금비)', '', 수칸(C.계상), '', C.계상 ? `남은 ${원(C.남은)}(${C.기준})` : '']], widths: [14, 10, 14, 10, 16, 14, 12] },
    ], { 주소: '/tools/toejik' })
  }

  return (
    <div className="wrap hm tj">
      <div className="card hm-in">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>👷 건설근로자 퇴직공제 집계 — 근로일수 · 공제부금</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          노무비 계산기(또는 현장 투입비)에 적은 출역으로 <b>사람마다 근로일수</b>와 <b>공제부금</b>을 셉니다. 0.5 공수는 합쳐서 하루로, 남는 것은 다음 달로 넘깁니다.
          입찰공고일을 넣으면 <b>일액(8,700원 · 6,500원)</b>을 저절로 고르고, 도급내역의 퇴직공제부금비와 견줘 남은 금액도 봅니다. 무료.
        </p>
        <노무자료줄 노={노} />
      </div>
      {!ym ? <출역없음 무엇="퇴직공제 집계" /> : (
        <>
          <div className="card hm-in">
            <해마다띠 키들={['toejik', 'hyuil']} 글={<><b>퇴직공제부금 일액</b>은 공사의 <b>입찰공고일</b>로 고릅니다</>} />
            <div className="hm-row">
              <label>입찰공고일 (민간은 계약일)
                <input type="date" className="inp" value={설정.d} onChange={(e) => set설정((s) => ({ ...s, d: e.target.value }))} />
              </label>
              <label>도급내역의 퇴직공제부금비 (원 · 넣으면 남은 금액)
                <input className="inp" inputMode="numeric" value={설정.c ? 원(설정.c) : ''} placeholder="예: 3,450,000" onChange={(e) => set설정((s) => ({ ...s, c: 숫자만(e.target.value) }))} />
              </label>
              <label>달
                <select className="inp" value={ym} onChange={(e) => set고른(e.target.value)}>
                  {[...달들].reverse().map((m) => <option key={m} value={m}>{달글(m)}{m === 지난달() ? ' (지난달)' : ''}</option>)}
                </select>
              </label>
            </div>
            <div className={'hm-rate' + (액.모름 ? ' warn' : '')}>
              일액 <b>{원(액.일액)}원</b>{액.적립 ? <> (퇴직공제금 {원(액.적립)} + 부가금 {원(액.부가)})</> : null} — {액.글}
              {액.모름 && <> · <b>입찰공고일을 넣으십시오</b> — 넣기 전에는 가장 최근 일액({원(액.일액)}원)으로 셉니다. 2026.3.31. 이전 공고 공사는 6,500원입니다.</>}
            </div>
          </div>

          <div className="card hm-out">
            <div className="hm-print-h">👷 {자료.co ? `${자료.co} · ` : ''}{자료.site || '현장'} — {달글(ym)} 퇴직공제 근로일수 · 공제부금 <span>(일액 {원(액.일액)}원 · K-건설맵 · {오늘} 뽑음)</span></div>
            <div className="btn-row no-print" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 인쇄 (A4)</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={엑셀}>📗 값만 엑셀 받기</button>
            </div>
            <div className="hm-sum">
              <div><span>피공제자</span><b>{T.합.인원}명</b>{T.합.뺀인원 > 0 && <i>뺀 사람 {T.합.뺀인원}명</i>}</div>
              <div><span>근로일수</span><b>{T.합.일수}일</b></div>
              <div><span>공제부금</span><b>{원(T.합.부금)}</b></div>
              <div><span>신고 · 납부 기한</span><b>{기한.날.slice(0, 4) !== 오늘.slice(0, 4) ? `${기한.날.slice(0, 4)}.` : ''}{짧은날(기한.날)}({요일(기한.날)})</b><i>{디데이(남은날(기한.날, 오늘))}{기한.밀림 ? ` · 원래 ${짧은날(기한.원래)}이 쉬는 날` : ''}</i></div>
            </div>
            <div className="tp-scroll">
              <table className="tbl hm-t">
                <thead><tr><th>No</th><th>성명</th><th>직종</th><th>1공수 이상 날</th><th>0.5공수 합</th><th>앞 달에서</th><th>근로일수</th><th>다음 달로</th><th>공제부금</th><th className="no-print">피공제자</th></tr></thead>
                <tbody>
                  {T.줄.map((r, i) => (
                    <tr key={r.id} className={r.뺌 ? 'off' : ''}>
                      <td>{i + 1}</td><td className="nw"><b>{r.p.n}</b></td><td className="nw">{r.p.j}</td>
                      <td className="r">{r.온}</td><td className="r">{r.짧은 || ''}</td><td className="r">{r.넘어옴 || ''}</td>
                      <td className="r"><b>{r.뺌 ? '—' : r.일수}</b></td><td className="r">{r.남음 || ''}</td><td className="r">{원(r.부금)}</td>
                      <td className="nw no-print">
                        <button type="button" className={'tp-ins ' + (r.뺌 ? 'n' : 'y')} aria-pressed={!r.뺌}
                          title={r.뺌 ? '뺌 — 누르면 다시 셈' : '셈함 — 상용직 · 대표 · 하루 4시간 미만이고 주 15시간 미만이면 누르십시오'}
                          onClick={() => set설정((s) => { const x = { ...s.x }; if (x[r.id]) delete x[r.id]; else x[r.id] = 1; return { ...s, x } })}>{r.뺌 ? '뺌 ✕' : '셈 ✓'}</button>
                      </td>
                    </tr>
                  ))}
                  <tr className="sum"><td /><td>합계</td><td>{T.합.인원}명</td><td /><td /><td /><td className="r"><b>{T.합.일수}</b></td><td /><td className="r"><b>{원(T.합.부금)}</b></td><td className="no-print" /></tr>
                </tbody>
              </table>
            </div>

            <div className="hm-paid no-print">
              {이달낸 ? (
                <div>✅ <b>{달글(ym)}분 냈음</b> — {원(이달낸.a)}원{이달낸.d ? ` · ${이달낸.d}` : ''}{이달낸.a !== T.합.부금 && <b className="bad"> · 셈한 부금 {원(T.합.부금)}원과 {원(Math.abs(이달낸.a - T.합.부금))}원 다름</b>}
                  {' '}<button type="button" className="tp-x" onClick={() => set설정((s) => 낸것바꿈(s, ym, null))}>지우기</button></div>
              ) : (
                <div className="hm-row" style={{ marginTop: 0 }}>
                  <label>{달글(ym)}분 낸 금액 (원)
                    <input className="inp" inputMode="numeric" value={낸칸.a === '' ? '' : 원(숫자만(낸칸.a))} placeholder={`${원(T.합.부금)} (셈한 부금)`} onChange={(e) => set낸칸((v) => ({ ...v, a: e.target.value }))} />
                  </label>
                  <label>낸 날
                    <input type="date" className="inp" value={낸칸.d || 오늘} onChange={(e) => set낸칸((v) => ({ ...v, d: e.target.value }))} />
                  </label>
                  <button type="button" className="btn sm" style={{ width: 'auto', alignSelf: 'end' }} onClick={낸기록}>✓ 냈음 기록</button>
                </div>
              )}
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>낸 것을 남기면 누계 · 계상액을 «실제로 낸 금액» 으로 견주고, 📮 신고 정리에서 그 달 퇴직공제가 저절로 ✓ 됩니다.</div>
            </div>

            <div className="detail-h" style={{ margin: '16px 0 6px' }}>📈 처음부터 {달글(ym)}까지 — 계상액과 견줌</div>
            <div className="tp-scroll">
              <table className="tbl hm-t">
                <thead><tr><th>달</th><th>근로일수</th><th>공제부금</th><th>누계 일수</th><th>누계 부금</th><th>낸 금액</th><th>낸 날</th></tr></thead>
                <tbody>
                  {C.달별.map((m) => (
                    <tr key={m.ym} className={(m.ym === ym ? 'on' : '') + (m.부금 > 0 && !m.낸 ? ' due' : '')}>
                      <td className="nw">{달글(m.ym)}</td><td className="r">{m.일수}</td><td className="r">{원(m.부금)}</td><td className="r">{m.누계일수}</td><td className="r">{원(m.누계부금)}</td>
                      <td className="r">{m.낸 ? <>{원(m.낸.a)}{m.낸.a !== m.부금 && <b className="bad"> *</b>}</> : (m.부금 > 0 ? <span className="bad">안 냄</span> : '')}</td><td className="nw">{m.낸 ? m.낸.d : ''}</td>
                    </tr>
                  ))}
                  {C.낸 > 0 && <tr className="sum"><td>합계</td><td className="r">{C.일수}</td><td className="r">{원(C.부금)}</td><td /><td /><td className="r"><b>{원(C.낸)}</b></td><td /></tr>}
                </tbody>
              </table>
            </div>
            {C.계상 > 0 ? (
              <div className="hm-gauge">
                <div className="hm-gauge-bar"><i style={{ width: `${Math.min(100, Math.round((C.비율 || 0) * 1000) / 10)}%` }} className={C.비율 > 1 ? 'over' : ''} /></div>
                <div>계상액 <b>{원(C.계상)}</b> 중 누계 <b>{원(C.낸 || C.부금)}</b>({C.기준}) ({Math.round((C.비율 || 0) * 1000) / 10}%) · {C.남은 >= 0 ? <>남은 <b>{원(C.남은)}</b></> : <b className="bad">계상액보다 {원(-C.남은)} 더 냄</b>}</div>
              </div>
            ) : <div className="note sm no-print" style={{ marginTop: 8 }}>도급내역서의 «퇴직공제부금비» 를 위에 넣으면 지금까지 낸 부금과 견줘 남은 금액을 봅니다.</div>}
            {C.안낸달.length > 0 && C.낸 > 0 && <div className="note sm hm-warnline" style={{ marginTop: 8 }}>⏰ 낸 기록이 없는 달: {C.안낸달.map(달글).join(' · ')}</div>}
            <ul className="tp-note hm-notes">
              <li>신고 · 납부: 일한 달의 <b>다음 달 15일까지</b> 건설근로자공제회에 근로일수를 신고하고 부금을 냅니다(시행규칙 제15조③). 전자카드 의무 현장은 전자카드 기록으로 신고합니다.</li>
              <li>피공제자가 아닌 사람 — 1일 소정근로시간 4시간 미만이고 1주 15시간 미만(시행규칙 제14조), 상용직 등 — 은 «셈 ✓» 를 눌러 빼십시오.</li>
              <li>원수급인이 가입자입니다(건설근로자법 제10조①). 하수급인이 부금을 내기로 서면 계약하고 공제회 승인을 받았으면 하수급인이 냅니다.</li>
              <li>이 달 다른 신고(원천세 · 근로내용 확인신고 · 4대보험)는 <Link to="/tools/singo">📮 매달 신고 정리</Link>에 퇴직공제와 함께 나옵니다.</li>
            </ul>
          </div>

          <details className="card hm-in js-more">
            <summary className="sec-title">일액이 바뀐 차례 (입찰공고일 기준)</summary>
            <table className="tbl hm-t" style={{ marginTop: 8 }}>
              <thead><tr><th>입찰공고일</th><th>일액</th><th>퇴직공제금 + 부가금</th><th>근거</th></tr></thead>
              <tbody>{[...퇴직공제일액표].reverse().map((x) => <tr key={x.부터}><td className="nw">{x.글}</td><td className="r"><b>{원(x.일액)}원</b></td><td className="nw">{x.적립 ? `${원(x.적립)} + ${원(x.부가)}` : ''}</td><td>{x.주소 ? <a href={x.주소} target="_blank" rel="noopener">{x.근거}</a> : x.근거}</td></tr>)}</tbody>
            </table>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>건설근로자법 시행령 제12조② — 1일 5천 원 ~ 1만 원 범위에서 공제회가 고용노동부장관 승인으로 정합니다. 원문 확인 {긴날('2026-10-02')}.</div>
          </details>
        </>
      )}
      <div className="hm-in"><도구설명 k="toejik" /></div>
    </div>
  )
}
