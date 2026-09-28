/**
 * 📈 예정공정표 · S커브 — 도구 화면 (2026-09-28)
 *
 * 소장님: 「1번부터 6번까지 한꺼번에 가자. 이미 있는데 수정을 하거나 보완하는 거니까」
 *   ① 공정표 — 받은 무료 공정표 프로그램(엑셀)의 «방식만»: 공종·도급액 → 보할, 기간 → 막대 공정표 + S커브,
 *      선후 관계(주공정), 월·순·주 간격. 그 프로그램의 코드·자료·이름은 쓰지 않았습니다.
 *   예전 말씀(2026-09-16): 「내역서를 넣으면 예정공정표를 만들어 주는」 · 「공사기간에 맞추어」 · 「커브곡선(S커브) 포함」
 *
 * ■ 칸(localStorage 'kcm.calc.schedule'): 공사명·착공·준공·간격·공종[{이름, 금액, 시작, 기간, 선행, 간격}]
 *   공사일보(/tools/tuipbi) «📝 공사일보» 의 계획 공정률이 같은 브라우저의 이 칸을 읽어 씁니다(lib/공정.js 계획률).
 * ■ 셈: lib/공정.js (시험: node tools/시험_공정.mjs) · 인쇄: A4 가로 한 장(#gp-인쇄)
 * ■ 날은 달력 날(공휴일 빼기 없음).
 * ■ 🔀 2026-09-28 양식 둘 — 소장님: 「예정공정표 다른 형식이야. 이것도 올려줘」 → 처음엔 따로 «변경 예정공정표» 도구로 만들었다가
 *    「공정표를 말하는 거야」 → 이름을 «예정공정표 다른 형식» 으로: 이 도구 안의 두 번째 양식 «💰 금액형(달마다 %·금액 · 당초·변경)» (tools/변경공정칸.jsx)
 *    금액형 칸은 같은 저장(kcm.calc.schedule) 안에 «금_» 을 붙여 둡니다(막대형 칸과 섞이지 않게). 공사일보는 막대형 칸만 읽습니다.
 */
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { use칸, Row, Out } from './calcs.jsx'
import { 공정셈, 자동배치, 내역공종, 예시공정, 예시변경공정, 점날, 번날 } from '../lib/공정.js'
import { use인쇄 } from './공정인쇄.js'
import { ScheduleChange } from './변경공정칸.jsx'

const 원 = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '')
const 퍼 = (v, d = 1) => (Number.isFinite(v) ? (v * 100).toFixed(d) : '')
const 억만 = (n) => {
  if (!(n > 0)) return ''
  const 억 = Math.floor(n / 1e8), 만 = Math.round((n % 1e8) / 1e4)
  return (억 ? 억 + '억 ' : '') + (만 ? 만.toLocaleString('ko-KR') + '만' : '') + '원'
}
const 빈줄 = () => ({ 이름: '', 금액: '', 시작: '', 기간: '', 선행: '', 간격: '' })


export function Schedule({ ex = {} }) {
  const [양식, set양식] = use칸('양식', '막대')
  return (
    <>
      <div className="gp-pick" role="tablist" aria-label="양식">
        <span className="gp-pick-l">양식</span>
        {[['막대', '📊 막대형', '공종·기간·선행 → 보할·주공정·S커브'], ['금액', '💰 금액형', '달마다 %·금액 · 당초·변경 두 줄']].map(([k, 이름, 설명]) => (
          <button key={k} type="button" role="tab" aria-selected={양식 === k} className={'gp-pick-b' + (양식 === k ? ' on' : '')} onClick={() => set양식(k)}>
            <b>{이름}</b><span>{설명}</span></button>
        ))}
      </div>
      {양식 === '금액' ? <ScheduleChange ex={ex} 앞="금_" /> : <막대형 ex={ex} />}
    </>
  )
}

function 막대형({ ex = {} }) {
  const [공사명, set공사명] = use칸('공사명', ex.공사명 ?? '')
  const [착공, set착공] = use칸('착공', ex.착공 ?? '')
  const [준공, set준공] = use칸('준공', ex.준공 ?? '')
  const [간격, set간격] = use칸('간격', ex.간격 ?? '월')
  const [공종, set공종] = use칸('공종', ex.공종 ?? [빈줄(), 빈줄(), 빈줄()])
  const [알림, set알림] = useState('')
  const 파일 = useRef(null)
  const R = useMemo(() => 공정셈({ 착공, 준공, 간격, 공종 }), [착공, 준공, 간격, 공종])
  const [인쇄중, 인쇄] = use인쇄('예정공정표' + (공사명 ? ' — ' + 공사명 : ''))

  const 고침 = (i, key, v) => set공종((L) => L.map((r, j) => (j === i ? { ...r, [key]: v } : r)))
  const 더하기 = () => set공종((L) => [...L, 빈줄()])
  const 빼기 = (i) => set공종((L) => L.filter((_, j) => j !== i).map((r) => ({ ...r, 선행: 선행고침(r.선행, i) })))
  const 올리기 = (i) => { if (i <= 0) return; set공종((L) => { const a = [...L]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a.map((r) => ({ ...r, 선행: 선행바꿈(r.선행, i, i + 1) })) }) }
  const 자동 = () => {
    if (!착공 || !준공) { set알림('착공일과 준공일을 먼저 적어 주십시오.'); return }
    set공종((L) => 자동배치(L, 착공, 준공))
    set알림('🪄 적은 차례대로 계단처럼 놓았습니다 — 짐작일 뿐이니 공종마다 시작일·기간·선행을 고쳐 쓰십시오.')
  }
  const 내역받기 = async (f) => {
    if (!f) return
    try {
      const r = 내역공종(await f.arrayBuffer(), f.name)
      set공종(r.공종.map((x) => ({ ...빈줄(), 이름: x.이름, 금액: x.금액 > 0 ? String(x.금액) : '' })))
      set알림('📥 «' + r.시트 + '» 시트에서 공종 ' + r.공종.length + '가지를 가져왔습니다' + (r.금있음 ? '' : ' — 금액이 비어 있는 공내역서라 금액은 직접 적어 주십시오') + '. 이제 착공·준공을 적고 🪄 자동 배치를 누르십시오.')
    } catch (e) { set알림('⚠️ ' + e.message) }
  }

  const 쓸줄 = R.줄.filter((z) => z.이름 || z.금액 > 0)
  const CP들 = 쓸줄.filter((z) => z.CP).map((z) => z.이름 || (z.i + 1) + '번')
  const 표 = <공정표종이 R={R} 공사명={공사명} 착공={착공} 준공={준공} 간격={간격} />
  return (
    <>
      <div className="kt-h">① 공사 · 기간</div>
      <div className="tl-grid">
        <Row label="공사명"><input value={공사명} onChange={(e) => set공사명(e.target.value)} placeholder="예: ○○지구 배수로 정비공사" /></Row>
        <Row label="착공일"><input type="date" value={착공} onChange={(e) => set착공(e.target.value)} /></Row>
        <Row label="준공일" hint={R.칸.length ? ' 공기 ' + (착공 && 준공 ? (Math.round((new Date(준공) - new Date(착공)) / 86400000) + 1) + '일' : '') : ''}><input type="date" value={준공} onChange={(e) => set준공(e.target.value)} /></Row>
        <Row label="간격">
          <select value={간격} onChange={(e) => set간격(e.target.value)}>
            <option value="월">월</option><option value="순">순 (상·중·하순)</option><option value="주">주 (착공일부터 7일)</option>
          </select>
        </Row>
      </div>

      <div className="kt-h">② 공종 — 적은 차례가 공정표의 차례</div>
      <div className="kt-btns">
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 파일.current?.click()}>📥 내역서(엑셀)에서 공종·금액 가져오기</button>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={자동}>🪄 자동 배치</button>
        <input ref={파일} type="file" accept=".xlsx" className="sr-only" tabIndex={-1} onChange={(e) => { 내역받기(e.target.files && e.target.files[0]); e.target.value = '' }} />
      </div>
      {알림 && <div className="gp-say">{알림}</div>}
      <div className="gp-wrap">
        <table className="gp-edit">
          <thead><tr><th>#</th><th>공종</th><th>금액(원)</th><th>보할</th><th>시작일</th><th>기간(일)</th><th title="앞 공종 번호 — 그 공종이 끝난 다음 날 시작">선행</th><th title="선행 끝 다음 날부터 더 띄울 날(음수면 겹침)">간격</th><th>끝</th><th /></tr></thead>
          <tbody>
            {공종.map((r, i) => {
              const z = R.줄[i] || {}
              const 선행씀 = z.선행 && z.선행.length > 0
              return (
                <tr key={i} className={z.CP ? 'cp' : ''}>
                  <td className="n">{i + 1}{i > 0 && <button type="button" className="gp-up" title="한 칸 위로" onClick={() => 올리기(i)}>▲</button>}</td>
                  <td><input value={r.이름} onChange={(e) => 고침(i, '이름', e.target.value)} placeholder="예: 토공" /></td>
                  <td><input inputMode="numeric" value={r.금액} onChange={(e) => 고침(i, '금액', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />{Number(r.금액) > 0 && <i className="gp-won">{억만(Number(r.금액))}</i>}</td>
                  <td className="n">{z.금액 > 0 ? 퍼(z.보할) + '%' : ''}</td>
                  <td>{선행씀 ? <span className="gp-auto" title="선행 공종으로 정해짐">{점날(z.시작글)}</span> : <input type="date" value={r.시작} onChange={(e) => 고침(i, '시작', e.target.value)} />}</td>
                  <td><input inputMode="numeric" value={r.기간} onChange={(e) => 고침(i, '기간', e.target.value.replace(/[^0-9]/g, ''))} placeholder="30" /></td>
                  <td><input value={r.선행} onChange={(e) => 고침(i, '선행', e.target.value)} placeholder="예: 2" /></td>
                  <td><input inputMode="numeric" value={r.간격} onChange={(e) => 고침(i, '간격', e.target.value.replace(/[^0-9-]/g, ''))} placeholder="0" disabled={!String(r.선행 || '').trim()} /></td>
                  <td className="n">{z.끝글 ? 점날(z.끝글) : ''}</td>
                  <td><button type="button" className="gp-x" title="이 공종 지우기" onClick={() => 빼기(i)}>✕</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="kt-btns"><button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={더하기}>＋ 공종</button></div>
      <p className="tl-p muted gp-hint">
        <b>선행</b>에 앞 공종 번호(예: 「2」, 여럿은 「3,4」)를 적으면 그 공종이 끝난 <b>다음 날</b> 시작합니다. <b>간격</b>은 더 띄울 날(음수 = 겹쳐 시작, 예: −10 은 선행이 끝나기 10일 전).
        선행이 이어진 공종 가운데 <b>여유가 없는 줄(빨강)</b>이 <b>주공정</b>입니다 — 늦어지면 준공이 늦어집니다. 날은 달력 날(공휴일 빼기 없음).
      </p>

      {R.경고.length > 0 && <ul className="gp-warn">{R.경고.map((w, k) => <li key={k}>⚠️ {w}</li>)}</ul>}
      <Out items={[
        { k: '총 금액', v: R.합계 > 0 ? 원(R.합계) + '원' : '—' },
        { k: '공기', v: R.공기 ? R.공기 + '일' + (R.시작 !== null ? ' (' + 점날(번날(R.시작)) + ' ~ ' + 점날(번날(R.끝)) + ')' : '') : '—' },
        { k: '주공정', v: CP들.length ? CP들.join(' → ') : (R.선행있음 ? '—' : '선행을 이으면 나옵니다') },
      ]} />

      <div className="kt-h">③ 예정공정표 · S커브</div>
      {R.칸.length && 쓸줄.length ? (
        <>
          <div className="kt-btns">
            <button type="button" className="btn" style={{ width: 'auto' }} onClick={인쇄}>🖨 인쇄 (A4 가로)</button>
          </div>
          <div className="gp-sheetwrap">{표}</div>
          {인쇄중 && createPortal(<div id="gp-인쇄"><div className="gp-쪽">{표}</div></div>, document.body)}
        </>
      ) : <p className="muted">착공·준공과 공종(이름·기간)을 적으면 여기에 공정표가 그려집니다. 🧪 예시로 해 보기를 눌러 보십시오.</p>}
    </>
  )
}

/** 선행 글에서 지운 번호(0부터 i) 빼고, 뒤 번호는 하나씩 당김 */
function 선행고침(t, i) {
  const 나 = i + 1
  return String(t || '').split(/[,\s·/]+/).map((x) => parseInt(x, 10)).filter((v) => Number.isInteger(v) && v !== 나).map((v) => (v > 나 ? v - 1 : v)).join(',')
}
/** 두 번호(1부터 a·b)를 서로 바꿈 */
function 선행바꿈(t, a, b) {
  return String(t || '').split(/[,\s·/]+/).map((x) => parseInt(x, 10)).filter((v) => Number.isInteger(v)).map((v) => (v === a ? b : v === b ? a : v)).join(',')
}

/* ── 공정표 한 장 (화면·인쇄 같음) ───────────────────────────── */
function 공정표종이({ R, 공사명, 착공, 준공, 간격 }) {
  const 칸 = R.칸
  const t0 = 칸[0].a, t1 = 칸[칸.length - 1].b
  const 전체 = t1 - t0 + 1
  const x = (d) => ((d - t0) / 전체) * 100                   // 날 → %
  const 줄 = R.줄.filter((z) => z.이름 || z.금액 > 0)
  const 윗무리 = []
  for (const c of 칸) { const 끝 = 윗무리[윗무리.length - 1]; if (끝 && 끝.이름 === c.윗이름) 끝.b = c.b; else 윗무리.push({ 이름: c.윗이름, a: c.a, b: c.b }) }
  const 점들 = [[0, 0]].concat(칸.map((c, k) => [x(c.b + 1), R.계획[k].누계율 * 100]))
  const 금있음 = R.합계 > 0
  const 좁음 = 칸.length > 16
  return (
    <div className="gp-sheet">
      <div className="gp-title">예 정 공 정 표</div>
      <div className="gp-meta">
        <span>공사명: <b>{공사명 || '—'}</b></span>
        <span>공사기간: <b>{착공 ? 점날(착공) : '—'} ~ {준공 ? 점날(준공) : '—'}</b></span>
        {금있음 && <span>공사금액: <b>{원(R.합계)}원</b></span>}
        <span>간격: {간격 === '순' ? '순(상·중·하)' : 간격 === '주' ? '주' : '월'}</span>
      </div>
      <table className={'gp-t' + (좁음 ? ' 좁음' : '')}>
        <colgroup><col className="gp-c1" /><col className="gp-c2" /><col className="gp-c3" /><col /></colgroup>
        <thead>
          <tr><th rowSpan={2}>공 종</th><th rowSpan={2}>금 액</th><th rowSpan={2}>보할<br />(%)</th>
            <th className="gp-tl"><div className="gp-lane">{윗무리.map((g, k) => <span key={k} className="gp-up2" style={{ left: x(g.a) + '%', width: (x(g.b + 1) - x(g.a)) + '%' }}>{g.이름}</span>)}</div></th></tr>
          <tr><th className="gp-tl"><div className="gp-lane">{칸.map((c, k) => <span key={k} className="gp-cell" style={{ left: x(c.a) + '%', width: (x(c.b + 1) - x(c.a)) + '%' }}>{c.이름}</span>)}</div></th></tr>
        </thead>
        <tbody>
          {줄.map((z) => (
            <tr key={z.i}>
              <td className="gp-nm">{z.이름 || (z.i + 1) + '번'}</td>
              <td className="r">{z.금액 > 0 ? 원(z.금액) : ''}</td>
              <td className="r">{z.금액 > 0 ? 퍼(z.보할) : ''}</td>
              <td className="gp-tl">
                <div className="gp-lane">
                  {칸.map((c, k) => <i key={k} className="gp-grid" style={{ left: x(c.a) + '%' }} />)}
                  {z.시작 !== null && <b className={'gp-bar' + (z.CP ? ' cp' : '')} style={{ left: x(z.시작) + '%', width: Math.max(0.4, x(z.끝 + 1) - x(z.시작)) + '%' }} title={z.시작글 + ' ~ ' + z.끝글 + ' (' + z.기간 + '일)'} />}
                  {금있음 && 칸.map((c, k) => (z.칸값[k] > 0 ? <span key={'v' + k} className="gp-v" style={{ left: x(c.a) + '%', width: (x(c.b + 1) - x(c.a)) + '%' }}>{퍼(z.칸값[k] / R.합계)}</span> : null))}
                </div>
              </td>
            </tr>
          ))}
          {금있음 && (
            <>
              <tr className="gp-sum">
                <td colSpan={3}>계획 공정률 (%)</td>
                <td className="gp-tl"><div className="gp-lane">{칸.map((c, k) => <span key={k} className="gp-cell" style={{ left: x(c.a) + '%', width: (x(c.b + 1) - x(c.a)) + '%' }}>{퍼(R.계획[k].율)}</span>)}</div></td>
              </tr>
              <tr className="gp-sum">
                <td colSpan={3}>누계 (%)</td>
                <td className="gp-tl"><div className="gp-lane">{칸.map((c, k) => <span key={k} className="gp-cell" style={{ left: x(c.a) + '%', width: (x(c.b + 1) - x(c.a)) + '%' }}><b>{퍼(R.계획[k].누계율)}</b></span>)}</div></td>
              </tr>
              <tr className="gp-curve">
                <td colSpan={3} className="gp-curvelab">S 커 브<br /><small>계획 누계 공정률</small><br /><small className="gp-lg"><i className="gp-lg1" /> 막대 · <i className="gp-lg2" /> 주공정</small></td>
                <td className="gp-tl">
                  <div className="gp-lane gp-svgbox">
                    {칸.map((c, k) => <i key={k} className="gp-grid" style={{ left: x(c.a) + '%' }} />)}
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="S커브">
                      {[25, 50, 75].map((v) => <line key={v} x1="0" x2="100" y1={100 - v} y2={100 - v} className="gp-h" vectorEffect="non-scaling-stroke" />)}
                      <polyline points={점들.map(([a, b]) => a + ',' + (100 - b)).join(' ')} className="gp-s" vectorEffect="non-scaling-stroke" />
                    </svg>
                    {칸.map((c, k) => <span key={k} className="gp-dot" style={{ left: x(c.b + 1) + '%', bottom: R.계획[k].누계율 * 100 + '%' }} />)}
                    <span className="gp-yl" style={{ bottom: '50%' }}>50%</span><span className="gp-yl top">100%</span>
                  </div>
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
      <div className="gp-foot">막대 안 숫자 = 그 칸에 들어가는 공종의 보할(%) · 공종 금액은 공종 기간에 날마다 고르게 들어간다고 보고 나눴습니다 · 빨간 막대 = 주공정 · 달력 날 기준</div>
    </div>
  )
}

/* 🧪 예시 — 막대형 칸 + 금액형 칸(금_) 을 한 번에(양식을 바꿔도 예시가 보이게) */
const 금예시 = Object.fromEntries(Object.entries(예시변경공정()).map(([k, v]) => ['금_' + k, v]))
export const 공정CALCS = { schedule: Schedule }
export const 공정EXAMPLES = { schedule: { ex: { ...예시공정(), ...금예시 }, 글: '막대형 = 가상 배수로 정비공사(6공종 · 선행) · 금액형 = 가상 배수개선사업(당초·변경) — 실제 공사 아님' } }
