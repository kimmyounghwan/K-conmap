import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 달줄, 일한달들, 할일목록, 달글, 원, 신고설정정리, 했음, 했음바꿈, 밀린목록 } from '../lib/신고정리.js'
import { 달집계, 설정정리 as 퇴직설정정리 } from '../lib/퇴직공제.js'
import { 달더하기, 한국오늘, 남은날, 디데이, 요일, 짧은날 } from '../lib/해마다.js'
import { 요율 } from '../lib/gongje.js'
import { use노무자료, 노무자료줄, 출역없음 } from '../tools/노무자료.jsx'
import 해마다띠 from '../tools/해마다띠.jsx'
import 도구설명 from '../tools/도구설명.jsx'

/**
 * 📮 /tools/singo — 매달 신고 정리 (G116 · 2026-10-02)
 *
 * 소장님: 「경리 일 중에서 프로그램으로 할 수 있는 것」 → 「해마다 바뀌는 건 잊지 않게 더 세심하게 하고, 매달 신고 정리, 퇴직공제 집계,
 *          고용·산재 보험료 계산기 … 현재 사이트에 있는 것과 연계해서 사용 가능하게 해줘」
 * ■ 한 달 출역(노무비 계산기 · 현장 투입비)으로 «어디에 · 무엇을 · 언제까지 · 어떤 숫자» 를 한 장에 — 원천세 · 지방소득세 · 근로내용 확인신고 ·
 *   지급명세서 · 퇴직공제 · 4대보험 취득/상실. 기한은 쉬는 날이면 다음 날(lib/해마다.js 공휴일표).
 * ■ 셈은 lib/신고정리.js(노무비 계산기와 같은 공제 셈) · 이 화면은 출역을 고치지 않습니다.
 * ■ 🔁 일의 연속성(소장님 「일의 연속성도 고려 해 주고..」): 할 일마다 «✓ 했음»(한 날 남김) · 다음 달에 열면 지난 달들에서 못 한 것을 맨 위에 «밀린 신고» 로 ·
 *   지급월 · 반기 · 기록은 노무비 자료 안(st.sg)이라 노무비 «🔗 코드» 로 폰 · PC 같이 감. 퇴직공제 «낸 금액» 을 적은 달은 저절로 ✓.
 */
const 지난달 = () => 달더하기(한국오늘().slice(0, 7), -1)

export default function Singo() {
  const 노 = use노무자료()
  const 자료 = 노.자료
  const 달들 = useMemo(() => 일한달들(자료), [자료])
  const [고른, set고른] = useState(null)
  const ym = 고른 && 달들.includes(고른) ? 고른 : (달들.includes(지난달()) ? 지난달() : 달들[달들.length - 1])
  const 설정 = 신고설정정리(노.기록('sg'))
  const set설정 = (f) => 노.기록쓰기('sg', f(설정))
  const 지급월 = (ym && 설정.pm[ym]) || (ym ? 달더하기(ym, 1) : '')
  const N = useMemo(() => (ym ? 달줄(자료, ym) : null), [자료, ym])
  const 퇴설 = 퇴직설정정리(노.기록('tj'))
  const 퇴직Of = (m) => { if (!퇴설.on) return null; const h = 달집계(자료, 퇴설, m).합; return { 대상: true, 인원: h.인원, 일수: h.일수, 부금: h.부금 } }
  const 퇴 = ym && 퇴설.on ? 달집계(자료, 퇴설, ym) : null
  const 목록 = N ? 할일목록(N, { 지급월, 반기: 설정.half, 퇴직: 퇴 ? { 대상: true, 인원: 퇴.합.인원, 일수: 퇴.합.일수, 부금: 퇴.합.부금 } : null }) : []
  const 오늘 = 한국오늘()
  /* 🔁 한 것 — ✓ 했음(한 날) · 퇴직공제는 «낸 금액» 을 적은 달이면 저절로 */
  const 한날 = (m, x) => 했음(설정, m, x.키) || (x.키 === 'toejik' && 퇴설.paid[m] ? (퇴설.paid[m].d || '기록') : '')
  const 누름 = (m, x) => set설정((s) => 했음바꿈(s, m, x.키, 한날(m, x) && 했음(s, m, x.키) ? '' : 오늘))
  const 밀린 = ym ? 밀린목록(자료, 설정, ym, 오늘, 퇴직Of).filter((x) => !한날(x.ym, x)) : []
  const 남은수 = 목록.filter((x) => !한날(ym, x)).length
  const R = ym ? 요율(ym) : null
  useEffect(() => {
    const 끝 = () => document.body.classList.remove('hm-print')
    window.addEventListener('afterprint', 끝)
    return () => { window.removeEventListener('afterprint', 끝); 끝() }
  }, [])
  const 인쇄 = () => { document.body.classList.add('hm-print'); setTimeout(() => window.print(), 80) }
  const 엑셀 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸 } = await import('../lib/값엑셀.js')
    const 일 = 목록.map((x, i) => [i + 1, x.기한, x.기관, x.무엇, x.숫자.map(([a, b]) => `${a} ${b}`).join(' · '), 한날(ym, x) || '', x.어디서, x.근거])
    const 사람 = N.줄.map((r, i) => [i + 1, r.p.n, r.p.b || '', r.p.j, r.날들.join(', '), r.일수, 수칸(r.보수), 수칸(r.보수), 수칸(r.최종.it), 수칸(r.최종.lt)])
    사람.push(['', 굵은칸('합계'), '', `${N.합계.인원}명`, '', N.합계.일수, 수칸(N.합계.보수), 수칸(N.합계.보수), 수칸(N.합계.it), 수칸(N.합계.lt)])
    값엑셀받기(`신고정리_${자료.site || '현장'}_${ym}`, [
      { name: `할 일 ${달글(ym)}`, head: ['No', '기한', '기관', '무엇', '넣을 숫자', '한 날', '어디서', '근거'], rows: 일, widths: [5, 12, 22, 50, 50, 12, 50, 34] },
      { name: '사람별(근로내용·지급명세서)', head: ['No', '성명', '생년월일', '직종', `근로일(${Number(ym.slice(5, 7))}월)`, '근로일수', '보수총액(과세)', '임금총액', '소득세', '지방소득세'], rows: 사람,
        widths: [5, 10, 10, 10, 40, 8, 14, 14, 10, 10] },
    ], { 주소: '/tools/singo' })
  }

  return (
    <div className="wrap hm sg">
      <div className="card hm-in">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📮 매달 신고 정리 — 원천세 · 근로내용 확인신고 · 퇴직공제 · 4대보험</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          노무비 계산기(또는 현장 투입비)에 적은 <b>한 달 출역</b>으로 <b>어디에 · 무엇을 · 언제까지 · 어떤 숫자</b>를 넣는지 한 장에 모읍니다.
          기한이 토 · 일 · 공휴일이면 다음 날로 미루고, D-day 로 보여 줍니다. 회원가입 없음 · 무료.
        </p>
        <노무자료줄 노={노} />
      </div>
      {!ym ? <출역없음 무엇="신고 정리" /> : (
        <>
          <div className="card hm-in">
            <해마다띠 키들={['ilyongse', 'saboheom', 'hyuil', ...(퇴 ? ['toejik'] : [])]} 해={Number(ym.slice(0, 4))}
              잠정={R && (R.없음 ? `${ym.slice(0, 4)}년 4대보험 요율은 아직 넣지 않아 ${R.해}년 요율로 셈했습니다.` : R.잠정 && R.잠정.length ? `${R.잠정.join(' · ')} 요율은 아직 확정 전이라 앞해 값으로 셈했습니다.` : '')} />
            <div className="hm-row">
              <label>귀속 달 (일한 달)
                <select className="inp" value={ym} onChange={(e) => set고른(e.target.value)}>
                  {[...달들].reverse().map((m) => <option key={m} value={m}>{달글(m)}{m === 지난달() ? ' (지난달)' : ''}</option>)}
                </select>
              </label>
              <label>노무비 준 달 (지급월)
                <select className="inp" value={지급월} onChange={(e) => set설정((s) => ({ ...s, pm: { ...s.pm, [ym]: e.target.value } }))}>
                  {[0, 1, 2].map((n) => { const m = 달더하기(ym, n); return <option key={m} value={m}>{달글(m)}{n === 0 ? ' — 같은 달' : n === 1 ? ' — 다음 달' : ''}</option> })}
                </select>
              </label>
              <label className="gj-check"><input type="checkbox" checked={설정.half} onChange={(e) => set설정((s) => ({ ...s, half: e.target.checked }))} /> 원천세 반기납부 승인 사업자</label>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
              원천세 · 지급명세서는 <b>준 달</b> 기준, 근로내용 확인신고 · 퇴직공제는 <b>일한 달</b> 기준입니다. 일한 달 노무비를 다음 달에 주면 «다음 달» 로 두십시오.
            </div>
          </div>

          <div className="card hm-out">
            <div className="hm-print-h">📮 {자료.co ? `${자료.co} · ` : ''}{자료.site || '현장'} — {달글(ym)} 귀속 신고 정리 <span>(K-건설맵 · {오늘} 뽑음)</span></div>
            <div className="btn-row no-print" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 인쇄 (A4)</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={엑셀}>📗 값만 엑셀 받기</button>
            </div>
            <div className="hm-sum">
              <div><span>인원</span><b>{N.합계.인원}명</b></div>
              <div><span>근로일수</span><b>{N.합계.일수}일</b></div>
              <div><span>총지급액(보수)</span><b>{원(N.합계.보수)}</b></div>
              <div><span>소득세 · 지방소득세</span><b>{원(N.합계.it)} · {원(N.합계.lt)}</b></div>
              <div><span>4대보험 대상</span><b>연금 {N.합계.대상수.P} · 건강 {N.합계.대상수.H} · 고용 {N.합계.대상수.E}</b></div>
              {퇴 && <div><span>퇴직공제 부금</span><b>{원(퇴.합.부금)}</b></div>}
            </div>

            {밀린.length > 0 && (
              <div className="hm-late no-print">
                <div className="detail-h" style={{ margin: '0 0 6px' }}>⏰ 지난 달들에서 아직 안 한 것 {밀린.length}건</div>
                <ol className="hm-todo">
                  {밀린.map((x) => {
                    const n = 남은날(x.기한, 오늘)
                    return (
                      <li key={x.ym + x.키} className={n < 0 ? 'late' : 'soon'}>
                        <div className="hm-todo-d"><b>{x.기한.slice(0, 4) !== 오늘.slice(0, 4) ? `${x.기한.slice(0, 4)}.` : ''}{짧은날(x.기한)}({요일(x.기한)})</b><span>{디데이(n)}</span></div>
                        <div className="hm-todo-b"><div className="hm-todo-t"><span className="hm-org">{달글(x.ym)}분</span> {x.무엇}</div>
                          <div className="hm-todo-m">{x.어디서}</div></div>
                        <button type="button" className="hm-done" onClick={() => 누름(x.ym, x)}>✓ 했음</button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}
            <div className="detail-h" style={{ margin: '14px 0 6px' }}>🗓 할 일 — 기한 차례 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>{남은수 ? `남은 것 ${남은수}건` : '✅ 이 달 것은 모두 했습니다'}</span></div>
            {!설정.from && <div className="note sm no-print" style={{ marginBottom: 8 }}>신고를 마칠 때마다 <b>«✓ 했음»</b> 을 누르십시오 — 한 날이 남고, 다음 달에 열면 지난달 못 한 것을 맨 위에 모아 드립니다(노무비 «🔗 코드» 로 폰 · PC 같이).</div>}
            <ol className="hm-todo">
              {목록.map((x) => {
                const n = 남은날(x.기한, 오늘)
                const 한 = 한날(ym, x)
                return (
                  <li key={x.키 + x.기한} className={한 ? 'done' : n < 0 ? 'late' : n <= 5 ? 'soon' : ''}>
                    <div className="hm-todo-d"><b>{x.기한.slice(0, 4) !== 오늘.slice(0, 4) ? `${x.기한.slice(0, 4)}.` : ''}{짧은날(x.기한)}({요일(x.기한)})</b><span>{디데이(n)}</span></div>
                    <div className="hm-todo-b">
                      <div className="hm-todo-t"><span className="hm-org">{x.기관}</span> {x.무엇}</div>
                      {x.숫자.length > 0 && <div className="hm-chips">{x.숫자.map(([a, b]) => <span key={a}>{a} <b>{b}</b></span>)}</div>}
                      <div className="hm-todo-m">{x.어디서} · <span className="muted">{x.근거}</span>
                        {x.밀림 && <span className="hm-moved"> · 원래 {짧은날(x.원래기한)}({요일(x.원래기한)})이 쉬는 날이라 다음 날</span>}
                        {x.공휴일모름 && <span className="hm-moved"> · {x.원래기한.slice(0, 4)}년 공휴일 표가 아직 없어 토 · 일만 셈</span>}</div>
                    </div>
                    <button type="button" className={'hm-done' + (한 ? ' on' : '')} aria-pressed={!!한} onClick={() => 누름(ym, x)}
                      title={한 ? (x.키 === 'toejik' && !했음(설정, ym, x.키) ? '퇴직공제 집계에 낸 금액을 적은 달입니다' : '누르면 «안 함» 으로 되돌립니다') : '신고 · 납부를 마쳤으면 누르십시오 — 오늘 날짜가 남습니다'}>
                      {한 ? `✓ ${/^\d{4}-/.test(한) ? 짧은날(한) : ''} 함` : '✓ 했음'}</button>
                  </li>
                )
              })}
            </ol>
            {!퇴 && (
              <div className="note sm no-print" style={{ marginTop: 8 }}>
                퇴직공제 가입 현장(공공 1억 원 · 민간 50억 원 이상 등)이면 <Link to="/tools/toejik">👷 퇴직공제 집계</Link>에서 입찰공고일을 넣으십시오 — 이 목록에 근로일수 신고 · 부금이 같이 나옵니다.
              </div>
            )}

            <div className="detail-h" style={{ margin: '16px 0 6px' }}>👥 사람별 — 근로내용 확인신고 · 일용근로소득 지급명세서에 옮겨 적을 것</div>
            <div className="tp-scroll">
              <table className="tbl hm-t">
                <thead><tr><th>No</th><th>성명</th><th>생년월일</th><th>직종</th><th>근로일 ({Number(ym.slice(5, 7))}월)</th><th>근로일수</th><th>보수총액(과세)</th><th>소득세</th><th>지방소득세</th><th className="no-print">4대보험</th></tr></thead>
                <tbody>
                  {N.줄.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td><td className="nw"><b>{r.p.n}</b></td><td className="nw">{r.p.b || ''}</td><td className="nw">{r.p.j}</td>
                      <td className="hm-days">{r.날들.join(', ')}</td><td className="r">{r.일수}</td><td className="r">{원(r.보수)}</td>
                      <td className="r">{원(r.최종.it)}</td><td className="r">{원(r.최종.lt)}</td>
                      <td className="nw no-print hm-ins">{[['P', '연금'], ['H', '건강'], ['E', '고용']].map(([c, n]) => <span key={c} className={r.대상[c].대상 ? 'y' : 'n'} title={r.대상[c].이유}>{n}{r.대상[c].대상 ? '✓' : '✕'}</span>)}</td>
                    </tr>
                  ))}
                  <tr className="sum"><td /><td>합계</td><td /><td>{N.합계.인원}명</td><td /><td className="r">{N.합계.일수}</td><td className="r">{원(N.합계.보수)}</td><td className="r">{원(N.합계.it)}</td><td className="r">{원(N.합계.lt)}</td><td className="no-print" /></tr>
                </tbody>
              </table>
            </div>
            <ul className="tp-note hm-notes">
              <li>주민등록번호 뒷자리 · 직종 부호 · 1일 평균 근로시간은 신고 화면에서 넣으십시오 — 이 화면은 그 숫자를 옮겨 적기 위한 정리입니다(주민번호는 받지 않습니다).</li>
              <li>공제(소득세 · 4대보험)는 <Link to="/tools/nomubi">노무비 계산기</Link>와 같은 셈이고, 그 화면에서 손으로 고친 금액도 그대로 씁니다. 대상 판단 까닭은 <Link to="/tools/ilyong-boheom">4대보험 가입 판단기</Link>.</li>
              <li>고용 · 산재 보험료(개산 · 확정 · 분할 납부)는 <Link to="/tools/boheomryo">🧾 고용·산재 보험료 계산기</Link>입니다.</li>
            </ul>
          </div>
        </>
      )}
      <div className="hm-in"><도구설명 k="singo" /></div>
    </div>
  )
}
