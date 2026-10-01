/* 📝 공사일보 한 장(종이) — 현장 투입비의 공사일보 탭(pages/TuipbiIlbo.jsx)과 작업일보 만들기(pages/Ilbo.jsx)가 같이 씀
 *   (2026-09-28 TuipbiIlbo.jsx 에 있던 것을 2026-10-01 G112 에 옮김 — 모양은 그대로)
 *   셈: {인원:[{이름, 전, 금, 누}], 인원합:{전, 금, 누}, 장비:[{이름, 단위, 금, 누}], 자재:[{이름, 규격, 단위, 금, 누}]}
 */
const 점날 = (t) => { const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[1] + '. ' + (+m[2]) + '. ' + (+m[3]) + '.' : '' }
const 요일 = (t) => { const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? '일월화수목금토'[new Date(+m[1], +m[2] - 1, +m[3]).getDay()] : '' }
const 수글 = (v) => (Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '')
const 공수글 = (g) => (g === 1 ? '1' : String(Math.round(g * 100) / 100))

const 소 = (x, n = 1) => (Number.isFinite(x) ? x.toFixed(n) : '')
/** 공정 — (G112 작업일보) lib/ilbo.js 공정셈() 결과 · 있으면 «공정 현황 — 보할 기준» 표를 넣음(투입비 공사일보는 안 넘김) */
export default function 일보종이({ 현장, d, 폼, 셈, 대비, 제목 = '공 사 일 보', 공정 = null }) {
  const wk = (폼.wk || []).filter((r) => r.g || r.v || r.t || r.n)
  const 칸수 = (a, n) => (a.length ? a : Array.from({ length: n }, () => null))
  return (
    <div className="il-paper">
      <div className="il-top">
        <div className="il-title">{제목}</div>
        <table className="il-sign"><tbody><tr><th>작 성</th><th>확 인</th></tr><tr><td /><td /></tr></tbody></table>
      </div>
      <table className="il-t il-info">
        <tbody>
          <tr><th>현 장 명</th><td colSpan={3}>{(현장 && 현장.name) || ''}</td></tr>
          <tr><th>일 자</th><td>{점날(d)} ({요일(d)})</td><th>날 씨</th><td>{폼.w || ''}{(폼.lo !== '' || 폼.hi !== '') ? '  ' + (폼.lo !== '' ? 폼.lo : '') + ' ~ ' + (폼.hi !== '' ? 폼.hi : '') + ' ℃' : ''}</td></tr>
          <tr><th>공 정 률</th><td colSpan={3}>계획 {폼.pp !== '' ? 폼.pp + '%' : '—'}  ·  실시 {폼.ap !== '' ? 폼.ap + '%' : '—'}{대비 !== null ? '  ·  대비 ' + (대비 > 0 ? '+' : '') + 수글(대비) + '%p' : ''}</td></tr>
        </tbody>
      </table>

      {공정 && 공정.있음 && (
        <>
          <div className="il-h">공정 현황 — 보할 기준 (%)</div>
          <table className="il-t il-gj">
            <thead><tr><th>공 종</th><th>보 할</th>{공정.계획 !== null && <th>계 획</th>}<th>전일까지</th><th>금 일</th><th>누 계</th><th>공정률</th></tr></thead>
            <tbody>
              {공정.줄.map((x) => (
                <tr key={x.id}>
                  <td>{x.이름}{x.설계 > 0 ? <span className="il-gj-q"> · {(x.누값).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}/{x.설계.toLocaleString('ko-KR')}{x.단위}</span> : null}</td>
                  <td className="r">{소(x.보할, 2)}</td>{공정.계획 !== null && <td className="r">{x.계획 !== null ? 소(x.계획) : ''}</td>}
                  <td className="r">{소(x.전)}</td><td className="r">{x.금 ? 소(x.금) : ''}</td><td className="r">{소(x.누)}</td><td className="r">{소(x.기여, 2)}</td>
                </tr>
              ))}
              <tr className="il-sum"><td>합 계 (공정률)</td><td className="r">100.00</td>{공정.계획 !== null && <td className="r">{소(공정.계획, 2)}</td>}<td className="r">{소(공정.전일, 2)}</td><td className="r">{공정.금일 ? 소(공정.금일, 2) : ''}</td><td className="r">{소(공정.실시, 2)}</td><td className="r">{소(공정.실시, 2)}</td></tr>
            </tbody>
          </table>
        </>
      )}
      <div className="il-h">1. 작업 내용</div>
      <table className="il-t">
        <thead><tr><th style={{ width: '20%' }}>공 종</th><th style={{ width: '18%' }}>업 체</th><th>작 업 내 용</th><th style={{ width: '9%' }}>인원</th></tr></thead>
        <tbody>{칸수(wk, 3).map((r, i) => <tr key={i}><td>{r ? r.g : ''}</td><td>{r ? r.v : ''}</td><td className="l">{r ? r.t : ''}</td><td className="c">{r ? r.n : ''}</td></tr>)}</tbody>
      </table>

      <div className="il-two">
        <div>
          <div className="il-h">2. 출역 인원 (명)</div>
          <table className="il-t">
            <thead><tr><th>직 종</th><th>전일까지</th><th>금 일</th><th>누 계</th></tr></thead>
            <tbody>
              {칸수(셈.인원, 2).map((x, i) => <tr key={i}><td>{x ? x.이름 : ''}</td><td className="r">{x ? x.전 : ''}</td><td className="r">{x ? x.금 || '' : ''}</td><td className="r">{x ? x.누 : ''}</td></tr>)}
              <tr className="il-sum"><td>합 계</td><td className="r">{셈.인원합.전}</td><td className="r">{셈.인원합.금}</td><td className="r">{셈.인원합.누}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className="il-h">3. 장비</div>
          <table className="il-t">
            <thead><tr><th>장 비</th><th>단위</th><th>금 일</th><th>누 계</th></tr></thead>
            <tbody>{칸수(셈.장비, 2).map((x, i) => <tr key={i}><td>{x ? x.이름 : ''}</td><td className="c">{x ? x.단위 : ''}</td><td className="r">{x ? (x.금 ? 공수글(x.금) : '') : ''}</td><td className="r">{x ? 공수글(x.누) : ''}</td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <div className="il-h">4. 자재 반입</div>
      <table className="il-t">
        <thead><tr><th>품 명</th><th>규 격</th><th>단위</th><th>금 일</th><th>누 계</th></tr></thead>
        <tbody>{칸수(셈.자재, 2).map((x, i) => <tr key={i}><td>{x ? x.이름 : ''}</td><td>{x ? x.규격 : ''}</td><td className="c">{x ? x.단위 : ''}</td><td className="r">{x ? (x.금 ? 공수글(x.금) : '') : ''}</td><td className="r">{x ? 공수글(x.누) : ''}</td></tr>)}</tbody>
      </table>

      <div className="il-h">5. 특기사항</div>
      <div className="il-box">{폼.nt || ''}</div>
      <div className="il-h">6. 내일 작업 계획</div>
      <div className="il-box small">{폼.nx || ''}</div>
      <div className="il-foot">{(현장 && 현장.co) ? 현장.co + ' · ' : ''}K-건설맵 {String(제목).replace(/\s/g, '')}</div>
    </div>
  )
}
