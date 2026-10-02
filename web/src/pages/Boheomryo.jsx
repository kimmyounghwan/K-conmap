import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 보험료, 기한들, 분할, 기간어긋남, 원 } from '../lib/보험료셈.js'
import { 회사규모들, 노무비율표, 한국오늘, 남은날, 디데이, 요일, 짧은날 } from '../lib/해마다.js'
import { 달줄, 일한달들, 달글 } from '../lib/신고정리.js'
import { use노무자료 } from '../tools/노무자료.jsx'
import 해마다띠 from '../tools/해마다띠.jsx'
import 도구설명 from '../tools/도구설명.jsx'

/**
 * 🧾 /tools/boheomryo — 건설업 고용 · 산재 보험료 계산기 (G116 · 2026-10-02)
 *
 * 소장님: 「… 고용·산재 보험료 계산기 … 현재 사이트에 있는 것과 연계해서 사용 가능하게」 · 「해마다 바뀌는 건 잊지 않게 더 세심하게」
 * ■ 총공사금액 × 노무비율(고시) 또는 실제 보수총액(노무비 계산기 · 투입비 출역에서 그 해 합을 가져옴) → 고용 · 산재 · 임금채권 · 석면
 * ■ 개산 · 확정 기한 · 분할 납부(4기) · 전액 납부 3% 경감 · 확정 정산(이미 낸 개산과 견줌)
 * ■ 율은 lib/해마다.js — 보험연도마다 고르고, 그 해 고시가 아직 없으면 앞 해 값 + 노란 띠
 * ■ 🔁 일의 연속성(소장님 「일의 연속성도 고려 해 주고..」): 해마다 «개산 낸 것 · 확정 낸 것» 을 남김 → 다음 해 확정 정산 때 그 해 개산이 저절로 들어옴 ·
 *   입력 · 기록은 노무비 자료 안(st.bh)이라 노무비 «🔗 코드» 로 폰 · PC 같이 감(투입비 현장은 이 브라우저).
 */
const 숫자만 = (s) => { const v = Number(String(s ?? '').replace(/[^\d]/g, '')); return Number.isFinite(v) ? v : 0 }
const 백 = (x) => `${Number((x * 100).toFixed(4))}%`
const 억만 = (n) => {
  const v = Math.round(Math.abs(n || 0)); const 억 = Math.floor(v / 1e8), 만 = Math.round((v % 1e8) / 1e4)
  return 억 && 만 ? `${억.toLocaleString('ko-KR')}억 ${만.toLocaleString('ko-KR')}만` : 억 ? `${억.toLocaleString('ko-KR')}억` : 만 ? `${만.toLocaleString('ko-KR')}만` : ''
}
const 빈입력 = () => ({ 해: Number(한국오늘().slice(0, 4)), 방식: 'nomu', 금액: 0, 하도급: false, 보수: 0, 실업제외: 0, 규모: 's', 임금: true, 석면: true, 성립: '', 끝: '', 낸개산: 0 })
const 기록정리 = (v) => ({ 입: { ...빈입력(), ...((v && v.입) || {}) }, 낸: (v && v.낸 && typeof v.낸 === 'object') ? v.낸 : {} })

export default function Boheomryo() {
  const 노 = use노무자료()
  const 보 = 기록정리(노.기록('bh'))
  const 입 = 보.입
  const set입 = (f) => 노.기록쓰기('bh', { ...보, 입: f(입) })
  const 고침 = (k, v) => set입((s) => ({ ...s, [k]: v }))
  const 낸해 = 보.낸[입.해] || {}
  const 낸적기 = (무엇, v) => 노.기록쓰기('bh', { ...보, 낸: { ...보.낸, [입.해]: { ...낸해, [무엇]: v } } })
  const [낸칸, set낸칸] = useState('')
  const 해들 = [...new Set([...Object.keys(노무비율표).map(Number), Number(한국오늘().slice(0, 4)), Number(한국오늘().slice(0, 4)) + 1, Number(입.해)])].sort()
  const R = useMemo(() => 보험료(입), [입])
  const 기 = useMemo(() => 기한들({ 성립: 입.성립, 끝: 입.끝, 해: 입.해 }), [입.성립, 입.끝, 입.해])
  const 개산기한 = (기.find((x) => x.무엇.includes('개산')) || {}).기한
  const 분 = useMemo(() => 분할({ 개산: R.합, 성립: 입.성립, 끝: 입.끝, 해: 입.해, 첫기한: 개산기한 }), [R.합, 입.성립, 입.끝, 입.해, 개산기한])
  const 오늘 = 한국오늘()
  /* 👷 노무비 계산기(또는 투입비) 출역에서 그 해 보수 합 — 65세 이후 새로 고용 몫(실업급여 없음)도 따로 */
  const 가져올 = useMemo(() => {
    const 달들 = 일한달들(노.자료).filter((m) => m.startsWith(String(입.해)))
    let 보수 = 0, 제외 = 0, 사람 = new Set()
    for (const m of 달들) {
      const N = 달줄(노.자료, m)
      for (const r of N.줄) {
        보수 += r.보수; 사람.add(r.id)
        const e = r.판 && r.판.고용 && r.판.고용.실업 ? r.판.고용.실업[m] : null
        if (e != null) 제외 += Math.max(0, r.보수 - e)
      }
    }
    return { 달들, 보수, 제외, 인원: 사람.size }
  }, [노.자료, 입.해])
  const 가져오기 = () => set입((s) => ({ ...s, 방식: 'bosu', 보수: 가져올.보수, 실업제외: 가져올.제외 }))
  const 낸개산 = 입.낸개산 > 0 ? 입.낸개산 : (낸해.개산 ? 낸해.개산.a : 0)
  const 정산 = 낸개산 > 0 ? R.합 - 낸개산 : null
  useEffect(() => {
    const 끝 = () => document.body.classList.remove('hm-print')
    window.addEventListener('afterprint', 끝)
    return () => { window.removeEventListener('afterprint', 끝); 끝() }
  }, [])
  const 인쇄 = () => { document.body.classList.add('hm-print'); setTimeout(() => window.print(), 80) }
  const 엑셀 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸 } = await import('../lib/값엑셀.js')
    const 줄 = [
      ['보수총액', R.방식 === 'nomu' ? `총공사금액 ${원(입.금액)} × 노무비율 ${백(R.노율)}` : '실제 보수총액', 수칸(R.보수)],
      ['고용 — 실업급여', `${백(R.고용.실업율)} (근로자 몫 ${원(R.고용.근로자몫)} 포함)`, 수칸(R.고용.실업)],
      ['고용 — 고용안정 · 직업능력개발', 백(R.고용.안정율), 수칸(R.고용.안정)],
      ['산재보험료', `${백(R.산재.율)} (건설업 ${백(R.산재.건설)} + 출퇴근 ${백(R.산재.출퇴근)})`, 수칸(R.산재.합)],
      ['임금채권부담금', 입.임금 ? 백(R.임금.율) : '내지 않음', 수칸(R.임금.합)],
      ['석면피해구제분담금', 입.석면 ? 백(R.석면.율) : '내지 않음', 수칸(R.석면.합)],
      [굵은칸('합계'), '', 수칸(R.합)],
      ['사업주 실제 부담', '합계 − 근로자 몫(실업급여 절반, 노무비에서 공제)', 수칸(R.사업주부담)],
    ]
    const 기줄 = 기.map((x) => [x.무엇, x.기한, x.근거, x.메모 || ''])
    const 분줄 = 분.됨 ? 분.줄.map((g) => [`${g.기}기`, `${g.부터} ~ ${g.까지}`, 수칸(g.금액), g.기한]) : [['분할 안 됨', 분.까닭, '', '']]
    값엑셀받기(`고용산재보험료_${입.해}`, [
      { name: `${입.해}년 보험료`, head: ['항목', '셈', '금액'], rows: 줄, widths: [26, 60, 16] },
      { name: '기한', head: ['무엇', '기한', '근거', '메모'], rows: 기줄, widths: [36, 12, 26, 40] },
      { name: '분할 납부', head: ['기', '기간', '금액', '납부 기한'], rows: 분줄, widths: [10, 26, 16, 12] },
    ], { 주소: '/tools/boheomryo' })
  }

  return (
    <div className="wrap hm bh">
      <div className="card hm-in">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🧾 건설업 고용 · 산재 보험료 계산기 — 개산 · 확정 · 분할 납부</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          총공사금액(부가세 뺌) × <b>노무비율</b>(고시) 또는 <b>실제 보수총액</b>으로 고용보험료 · 산재보험료 · 임금채권부담금 · 석면분담금을 셉니다.
          노무비 계산기(또는 현장 투입비)에 적은 출역에서 그 해 보수를 가져올 수 있고, 신고 기한 · 분할 납부 · 전액 납부 경감도 나옵니다. 무료.
        </p>
      </div>
      <div className="card hm-in">
        <해마다띠 키들={['nomu', 'sanjae', 'goyong', 'imgeum', 'seokmyeon', 'hyuil']} 해={R.해} 잠정={R.잠정} />
        <div className="hm-row">
          <label>보험연도
            <select className="inp" value={입.해} onChange={(e) => 고침('해', Number(e.target.value))}>{해들.map((y) => <option key={y} value={y}>{y}년{노무비율표[y] ? '' : ' (고시 전 — 잠정)'}</option>)}</select>
          </label>
          <label>보수총액 정하는 법
            <select className="inp" value={입.방식} onChange={(e) => 고침('방식', e.target.value)}>
              <option value="nomu">총공사금액 × 노무비율 (고시)</option>
              <option value="bosu">실제 보수총액 (지급한 노무비)</option>
            </select>
          </label>
          <label>회사 규모 (고용안정 · 직업능력개발)
            <select className="inp" value={입.규모} onChange={(e) => 고침('규모', e.target.value)}>{회사규모들.map((x) => <option key={x.k} value={x.k}>{x.이름}</option>)}</select>
          </label>
        </div>
        {입.방식 === 'nomu' ? (
          <div className="hm-row">
            <label>총공사금액 (부가세 뺌 · 원)
              <input className="inp" inputMode="numeric" value={입.금액 ? 원(입.금액) : ''} placeholder="예: 1,250,000,000" onChange={(e) => 고침('금액', 숫자만(e.target.value))} />
              {입.금액 > 0 && <small className="muted">{억만(입.금액)}원</small>}
            </label>
            <label>누가 내나
              <select className="inp" value={입.하도급 ? 'h' : 'w'} onChange={(e) => 고침('하도급', e.target.value === 'h')}>
                <option value="w">원수급인 — 총공사금액 × {백(R.해 && 노무비율표[R.해] ? 노무비율표[R.해].일반 : 0.27)}</option>
                <option value="h">하수급인(공단 승인) — 하도급 금액 × {백(R.해 && 노무비율표[R.해] ? 노무비율표[R.해].하도급 : 0.29)}</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="hm-row">
            <label>보수총액 (원 · 그 해 지급한 노무비)
              <input className="inp" inputMode="numeric" value={입.보수 ? 원(입.보수) : ''} placeholder="0" onChange={(e) => 고침('보수', 숫자만(e.target.value))} />
            </label>
            <label>그중 실업급여 몫이 없는 보수 (65세 이후 새로 고용 등)
              <input className="inp" inputMode="numeric" value={입.실업제외 ? 원(입.실업제외) : ''} placeholder="0" onChange={(e) => 고침('실업제외', 숫자만(e.target.value))} />
            </label>
          </div>
        )}
        <div className="hm-pull">
          {가져올.달들.length > 0
            ? <>👷 {노.출처 === 'tp' ? `현장 투입비 «${노.넘김.site || ''}»` : '노무비 계산기'}에 {입.해}년 출역 <b>{가져올.달들.length}달 · {가져올.인원}명 · 보수 {원(가져올.보수)}원</b>{가져올.제외 > 0 ? ` (실업급여 몫 없는 보수 ${원(가져올.제외)}원)` : ''}
                <button type="button" className="btn line sm" style={{ width: 'auto', marginLeft: 8 }} onClick={가져오기}>실제 보수총액으로 가져오기</button></>
            : <span className="muted">👷 <Link to="/tools/nomubi">노무비 계산기</Link>(또는 현장 투입비)에 {입.해}년 출역이 있으면 그 보수를 실제 보수총액으로 가져옵니다.</span>}
        </div>
        <div className="hm-row">
          <label>공사 시작일 (보험관계 성립 · 착공)
            <input type="date" className="inp" value={입.성립} onChange={(e) => 고침('성립', e.target.value)} />
          </label>
          <label>공사 끝나는 날 (준공 · 예정)
            <input type="date" className="inp" value={입.끝} onChange={(e) => 고침('끝', e.target.value)} />
          </label>
          <label>이미 낸 개산보험료 (확정 정산용 · 원)
            <input className="inp" inputMode="numeric" value={입.낸개산 ? 원(입.낸개산) : ''} placeholder={낸해.개산 ? `${원(낸해.개산.a)} (${입.해}년 기록)` : '0'} onChange={(e) => 고침('낸개산', 숫자만(e.target.value))} />
          </label>
        </div>
        <div className="hm-row">
          <label className="gj-check"><input type="checkbox" checked={입.임금} onChange={(e) => 고침('임금', e.target.checked)} /> 임금채권부담금 냄 (국가 · 지자체 직영 등은 빠짐)</label>
          <label className="gj-check"><input type="checkbox" checked={입.석면} onChange={(e) => 고침('석면', e.target.checked)} /> 석면분담금 냄 (일괄적용을 받지 않는 건설공사는 면제)</label>
        </div>
      </div>

      <div className="card hm-out">
        <div className="hm-print-h">🧾 {입.해}년 고용 · 산재 보험료 <span>(K-건설맵 · {오늘} 뽑음)</span></div>
        <div className="btn-row no-print" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 인쇄 (A4)</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={엑셀}>📗 값만 엑셀 받기</button>
        </div>
        <div className="hm-sum">
          <div><span>보수총액</span><b>{원(R.보수)}</b><i>{R.방식 === 'nomu' ? `총공사금액 × ${백(R.노율)}` : '실제 보수'}</i></div>
          <div><span>보험료 합계</span><b>{원(R.합)}</b><i>고용 + 산재 + 임금채권 + 석면</i></div>
          <div><span>사업주 실제 부담</span><b>{원(R.사업주부담)}</b><i>근로자 몫(실업급여 절반 {원(R.고용.근로자몫)})은 노무비에서 공제</i></div>
          {정산 != null && <div><span>확정 정산</span><b className={정산 > 0 ? 'bad' : ''}>{정산 > 0 ? `더 낼 돈 ${원(정산)}` : 정산 < 0 ? `돌려받을 돈 ${원(-정산)}` : '같음'}</b><i>이미 낸 개산 {원(낸개산)}{!(입.낸개산 > 0) && 낸해.개산 ? ' (기록에서)' : ''}</i></div>}
        </div>
        <div className="tp-scroll">
          <table className="tbl hm-t">
            <thead><tr><th>항목</th><th>율</th><th>금액</th><th className="no-print">근거</th></tr></thead>
            <tbody>
              <tr><td>고용 — 실업급여 <small className="muted">(근로자 · 사업주 반씩)</small></td><td className="r">{백(R.고용.실업율)}</td><td className="r">{원(R.고용.실업)}</td><td className="no-print hm-src-t" rowSpan={2}>{R.근거.고용}</td></tr>
              <tr><td>고용 — 고용안정 · 직업능력개발 <small className="muted">(사업주)</small></td><td className="r">{백(R.고용.안정율)}</td><td className="r">{원(R.고용.안정)}</td></tr>
              <tr><td>산재보험료 <small className="muted">(건설업 {백(R.산재.건설)} + 출퇴근 {백(R.산재.출퇴근)})</small></td><td className="r">{백(R.산재.율)}</td><td className="r">{원(R.산재.합)}</td><td className="no-print hm-src-t">{R.근거.산재}</td></tr>
              <tr className={입.임금 ? '' : 'off'}><td>임금채권부담금</td><td className="r">{백(R.임금.율)}</td><td className="r">{원(R.임금.합)}</td><td className="no-print hm-src-t">{R.근거.임금}</td></tr>
              <tr className={입.석면 ? '' : 'off'}><td>석면피해구제분담금</td><td className="r">{백(R.석면.율)}</td><td className="r">{원(R.석면.합)}</td><td className="no-print hm-src-t">{R.근거.석면}</td></tr>
              <tr className="sum"><td>합계</td><td /><td className="r"><b>{원(R.합)}</b></td><td className="no-print" /></tr>
            </tbody>
          </table>
        </div>
        {R.방식 === 'nomu' && <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>노무비율 {백(R.노율)} — {R.근거.노무비율}. 보수총액을 정하기 어려울 때 씁니다(징수법 제13조⑥). 실제 지급한 노무비를 알면 «실제 보수총액» 이 맞습니다.</div>}

        <div className="detail-h" style={{ margin: '16px 0 6px' }}>🗓 신고 · 납부 기한</div>
        <ol className="hm-todo">
          {기.map((x) => {
            const n = 남은날(x.기한, 오늘)
            return (
              <li key={x.무엇} className={n < 0 ? 'past' : n <= 10 ? 'soon' : ''}>
                <div className="hm-todo-d"><b>{x.기한.slice(0, 4)}.{짧은날(x.기한)}({요일(x.기한)})</b><span>{디데이(n)}</span></div>
                <div className="hm-todo-b"><div className="hm-todo-t">{x.무엇}</div>
                  <div className="hm-todo-m"><span className="muted">{x.근거}</span>{x.메모 ? ` · ${x.메모}` : ''}{x.밀림 ? ` · 원래 ${짧은날(x.원래기한)}이 쉬는 날이라 다음 날` : ''}</div></div>
              </li>
            )
          })}
        </ol>
        {기간어긋남(입) && <div className="note sm hm-warnline" role="status">⚠️ {기간어긋남(입)}</div>}
        {!입.성립 && <div className="note sm no-print">공사 시작일 · 끝나는 날을 넣으면 성립신고 · 개산(70일) · 확정(끝난 뒤 30일) 기한을 그 공사에 맞춰 셉니다.</div>}

        <div className="detail-h" style={{ margin: '16px 0 6px' }}>📒 해마다 낸 것 — 다음 해 확정 정산에 이어짐</div>
        <div className="hm-paid">
          {['개산', '확정'].map((무엇) => {
            const v = 낸해[무엇]
            return (
              <div key={무엇} className="hm-paid-r">
                <b>{입.해}년 {무엇}보험료</b>
                {v ? <>✅ {원(v.a)}원 · {v.d} <button type="button" className="tp-x no-print" onClick={() => 낸적기(무엇, null)}>지우기</button></>
                  : <span className="no-print">
                      <input className="inp hm-paid-in" inputMode="numeric" value={낸칸 && 낸칸.k === 무엇 ? 원(숫자만(낸칸.v)) : ''} placeholder={`${원(R.합)} (셈한 금액)`}
                        onChange={(e) => set낸칸({ k: 무엇, v: e.target.value })} aria-label={`${입.해}년 ${무엇} 낸 금액`} />
                      <button type="button" className="btn line sm" style={{ width: 'auto' }}
                        onClick={() => { 낸적기(무엇, { a: 낸칸 && 낸칸.k === 무엇 && 낸칸.v !== '' ? 숫자만(낸칸.v) : R.합, d: 한국오늘() }); set낸칸('') }}>✓ 냈음 기록</button>
                    </span>}
              </div>
            )
          })}
          {Object.keys(보.낸).filter((y) => Number(y) !== Number(입.해)).length > 0 && (
            <div className="muted" style={{ fontSize: 12.5 }}>다른 해 기록: {Object.entries(보.낸).filter(([y]) => Number(y) !== Number(입.해)).map(([y, v]) => `${y}년 ${v.개산 ? `개산 ${원(v.개산.a)}` : ''}${v.확정 ? ` · 확정 ${원(v.확정.a)}` : ''}`).join(' / ')}</div>
          )}
          <div className="muted" style={{ fontSize: 12.5 }}>개산을 낸 금액을 남겨 두면, 다음 해 3월(또는 공사가 끝난 뒤) 확정 정산 때 «이미 낸 개산» 에 저절로 들어갑니다. 기록은 노무비 «🔗 코드» 로 폰 · PC 같이 갑니다.</div>
        </div>

        <div className="detail-h" style={{ margin: '16px 0 6px' }}>💳 개산보험료 분할 납부</div>
        {분.됨 ? (
          <>
            <div className="tp-scroll">
              <table className="tbl hm-t">
                <thead><tr><th>기</th><th>기간</th><th>금액</th><th>납부 기한</th></tr></thead>
                <tbody>{분.줄.map((g) => <tr key={g.기}><td>{g.기}기</td><td className="nw">{g.부터} ~ {g.까지}</td><td className="r">{원(g.금액)}</td><td className="nw">{g.기한}{g.밀림 ? ' (쉬는 날이라 다음 날)' : ''}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>분할 납부는 공단에 신청합니다(시행령 제22조⑥). 기한 안에 <b>전액</b>을 내면 3% — 약 <b>{원(분.경감)}원</b> — 를 덜 냅니다(법 제17조④ · 시행규칙 제18조의2).</div>
          </>
        ) : <div className="note sm">{분.까닭}</div>}
        <ul className="tp-note hm-notes">
          <li>건설업은 원수급인이 공사 전체의 보험료를 냅니다. 하수급인이 공단 승인을 받으면 하수급인이 그 하도급 금액으로 냅니다(징수법 제9조).</li>
          <li>항목마다 원 미만을 버렸습니다. 공단 신고 화면 · 고지서와 끝전이 다를 수 있으니 신고는 <b>고용·산재보험 토탈서비스</b> 화면 숫자를 따르십시오.</li>
          <li>근로자 몫(실업급여 0.9%)은 <Link to="/tools/nomubi">노무비 계산기</Link>가 노무비에서 공제합니다. 사람별 사업주 몫은 <Link to="/tools/ilyong-boheom">4대보험 가입 판단기</Link> «사업주 몫», 원가계산서의 산재 · 고용 요율은 <Link to="/tools/gyeonjeok">견적서 · 원가계산서</Link>와 같은 값입니다.</li>
        </ul>
      </div>
      <div className="hm-in"><도구설명 k="boheomryo" /></div>
    </div>
  )
}
