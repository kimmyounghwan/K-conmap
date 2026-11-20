import { Link } from 'react-router-dom'
import { 점검표, 밀린점검, 한국오늘, 긴날, 공휴일표, 퇴직공제일액표, 요일, 짧은날, 표해 } from '../lib/해마다.js'
import 도구설명 from '../tools/도구설명.jsx'
import { 달력, 이번달볼것, 이번월, 다음볼달 } from '../lib/요율달력.js'   /* 🗓 G790 요율 달력 — 값마다 바뀌는 달 */

/**
 * 🗓 /tools/haemada — 해마다 바뀌는 값 모아 보기 (G116 · 2026-10-02)
 *
 * 소장님: 「해마다 바뀌는 건 잊지 않게 더 세심하게 하고」
 * ■ 사이트 프로그램이 쓰는 요율 · 기준 금액 · 공휴일을 한 장에 — 지금 값 · 근거(원문 링크) · 원문을 연 날 · 다음에 다시 볼 때 · 쓰는 화면.
 * ■ «다음 확인» 이 지난 줄은 빨갛게(새 고시가 나올 무렵) — 관리자 화면에도 같은 것이 나옵니다. 값은 lib/해마다.js 한 곳.
 */
const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
const 화면주소 = (s) => { const m = String(s).match(/^(\/[a-z0-9\-/]+)/i); return m ? m[1] : null }
const 화면이름 = { '/tools/boheomryo': '고용·산재 보험료', '/tools/singo': '매달 신고 정리', '/tools/toejik': '퇴직공제 집계', '/tools/nomubi': '노무비 계산기', '/tools/nomubi-myeongse': '노무비 지급명세서',
  '/tools/ilyong-boheom': '4대보험 판단기', '/tools/ilyong-silup': '실업급여 판단기', '/tools/sanjae-hyueop': '산재 휴업급여', '/tools/juhyu': '주휴수당 판단기', '/tools/gyeonjeok': '견적서 · 원가계산서', '/tools/tuipbi': '현장 투입비', '/tools/sanan': '산안비 계상기', '/tools/teukgo-boheom': '특고 산재 · 고용보험료' }
const 쓰는글 = (s) => { const u = 화면주소(s); const 덧 = u ? String(s).slice(u.length).trim() : ''; return { u, 글: u ? `${화면이름[u] || u}${덧 ? ' ' + 덧 : ''}` : s } }

export default function Haemada() {
  const 오늘 = 한국오늘()
  const 밀린 = 밀린점검(오늘)
  return (
    <div className="wrap hm hd">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🗓 해마다 바뀌는 값 — {표해()} 건설 노무 · 보험 요율표</h1>   {/* 🗓 G802 해는 표에서(12월 말 고시를 넣으면 저절로) */}
        <p className="cp" style={{ margin: '6px 0 0' }}>
          K-건설맵 프로그램이 쓰는 <b>노무비율 · 산재 · 고용 · 임금채권 · 석면 · 퇴직공제부금 · 4대보험 · 원천세 · 공휴일</b>을 한 장에 모았습니다.
          값마다 <b>근거 고시 · 원문 링크 · 원문을 열어 본 날 · 다음에 다시 볼 때</b>를 적어 두고, 새 고시가 나오면 이 표 하나를 고쳐 모든 화면이 같이 바뀝니다.
        </p>
        <div className={'hm-band' + (밀린.length ? ' warn' : '')} style={{ marginTop: 10 }}>
          {밀린.length
            ? <>⏰ <b>{밀린.length}가지</b>가 다시 확인할 때입니다 — {밀린.map((x) => x.무엇).join(' · ')}. 원문으로 확인해 바뀌면 바로 고칩니다.</>
            : <>✅ 지금은 모두 확인한 값입니다 ({긴날(오늘)} 기준).</>}
        </div>
      </div>

      {/* 🗓 G790 (11-19) 소장님 「자동 업데이트 했어??」 → «요율 달력» — 값마다 «바뀌는 달» · 이번 달 볼 것(밀린 것은 ⏰ 주황 · 누르면 원문) · 열두 달 */}
      {(() => {
        const 월 = 이번월(오늘), 볼 = 이번달볼것(오늘), 다음 = 다음볼달(오늘)
        return (
          <div className="card rc">
            <div className="detail-h" style={{ margin: 0 }}>🗓 요율 달력 — 값이 바뀌는 달</div>
            <div className="muted" style={{ fontSize: 12.5, margin: '4px 0 8px', lineHeight: 1.6 }}>
              값마다 새 고시 · 결정이 나오는 달입니다. 그 달에 K-건설맵이 원문(법제처 고시 · 공단 공지)을 확인해 새 값을 넣고, 새 값은 시행일부터 모든 계산기에 저절로 쓰입니다.
            </div>
            <div className="rc-now"><b>{월}월에 볼 것</b>{' '}
              {볼.length
                ? 볼.map((x) => (x.주소
                  ? <a key={x.k} href={x.주소} target="_blank" rel="noopener" className={'rc-chip' + (x.밀림 ? ' due' : '')} title={x.무엇 + ' — 원문 열기'}>{x.밀림 ? '⏰ ' : ''}{x.짧게}</a>
                  : <span key={x.k} className={'rc-chip' + (x.밀림 ? ' due' : '')} title={x.무엇}>{x.밀림 ? '⏰ ' : ''}{x.짧게}</span>))
                : <span className="muted">없음{다음 ? ` — 다음은 ${다음.월}월(${다음.항목.map((x) => x.짧게).join(' · ')})` : ''}</span>}
            </div>
            <div className="rc-grid">
              {달력().map((m) => (
                <div key={m.월} className={'rc-m' + (m.월 === 월 ? ' now' : '')}>
                  <b>{m.월}월</b>
                  <span className="rc-cs">{m.항목.length ? m.항목.map((x) => <span key={x.k} className="rc-chip" title={`${x.무엇} — 시행 ${x.시행}`}>{x.짧게}</span>) : <small className="muted">—</small>}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="card">
        <div className="tp-scroll">
          <table className="tbl hm-t hd-t">
            <thead><tr><th>무엇</th><th>지금 값</th><th>근거</th><th>원문 확인</th><th>다음 확인</th><th>쓰는 화면</th></tr></thead>
            <tbody>
              {점검표.map((x) => {
                const 지남 = x.다음 <= 오늘
                return (
                  <tr key={x.k} className={지남 ? 'due' : ''}>
                    <td className="nw" data-h="무엇"><b>{x.무엇}</b></td>
                    <td data-h="지금 값">{x.값()}</td>
                    <td className="hm-src-t" data-h="근거">{x.주소 ? <a href={x.주소} target="_blank" rel="noopener">{x.근거}</a> : x.근거}</td>
                    <td className="nw" data-h="원문 확인">{긴날(x.확인)}</td>
                    <td className="nw" data-h="다음 확인">{지남 ? <b className="bad">⏰ {긴날(x.다음)}</b> : 긴날(x.다음)}<br /><small className="muted">{x.언제}</small></td>
                    <td className="hd-use" data-h="쓰는 화면">{x.쓰는곳.map((s) => { const { u, 글 } = 쓰는글(s); return <span key={s}>{u ? <Link to={u}>{글}</Link> : 글}</span> })}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>👷 퇴직공제부금 일액 — 공사의 입찰공고일로</div>
        <table className="tbl hm-t" style={{ marginTop: 8 }}>
          <thead><tr><th>입찰공고일</th><th>일액</th><th>퇴직공제금 + 부가금</th></tr></thead>
          <tbody>{[...퇴직공제일액표].reverse().map((x) => <tr key={x.부터}><td>{x.글}</td><td className="r"><b>{원(x.일액)}원</b></td><td>{x.적립 ? `${원(x.적립)} + ${원(x.부가)}` : ''}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>📅 공휴일 — 신고 · 납부 기한이 걸리면 다음 날</div>
        <div className="muted" style={{ fontSize: 12.5, margin: '4px 0 8px' }}>국세기본법 제5조① · 민법 제161조 — 기한이 토 · 일 · 공휴일 · 대체공휴일(노동절 포함)이면 그 다음 날. 노동절 · 제헌절은 2026년부터 공휴일입니다.</div>
        {Object.entries(공휴일표).map(([y, 날들]) => (
          <div key={y} className="hd-hol"><b>{y}년</b> {날들.filter((d) => !['토', '일'].includes(요일(d))).map((d) => `${짧은날(d)}(${요일(d)})`).join(' · ')} <small className="muted">— 평일에 걸리는 날만</small></div>
        ))}
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>🧰 이 값을 쓰는 프로그램</div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/singo">📮 매달 신고 정리</Link>
          <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/toejik">👷 퇴직공제 집계</Link>
          <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/boheomryo">🧾 고용·산재 보험료</Link>
          <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/nomubi">👷 일용 노무비 계산기</Link>
          <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/ilyong-boheom">🛡 4대보험 가입 판단기</Link>
          <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/gyeonjeok">🧾 견적서 · 원가계산서</Link>
          <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/sanan">🦺 산안비 계상기</Link>
        </div>
      </div>
      <도구설명 k="haemada" />
    </div>
  )
}
