/**
 * 🗓 G466 골조 공정 — 칸(층 × 구간)마다 작업일 → 공정표(막대) · 3D 재생 · 달마다 물량(예정) · 이 날까지 끝난 칸 → 📆 기성 회차
 *   셈 = lib/골조공정.js 공정셈(칸 = 📆 기성과 같은 칸) · 작업일은 소장님이 넣는 값(비면 비운 채 — 짐작해서 채우지 않음)
 *   엑셀 = 모델 엑셀에 «골조공정표»(주마다 ■) · «월별예정» · «공정조건» 시트
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 구간색들 } from './lib/골조모델.js'
import { 공정셈, 공정고치기, 공정옮기기, 공정기성, 칸작업일, 날상태, 달마다, 예시공정, 칸이름, 날번, 번날, 요일글, 쉼판 } from './lib/골조공정.js'

const 수글 = (n, k = 3) => (Number.isFinite(n) ? n.toLocaleString('ko-KR', { minimumFractionDigits: k, maximumFractionDigits: k }) : '')
const 원글 = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '')
const 오늘 = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
const 점 = (t) => (t ? (+t.slice(5, 7)) + '.' + (+t.slice(8, 10)) + '(' + 요일글(t) + ')' : '')
/** 상태 → 색(3D · 막대 같은 색) */
export const 공정색들 = { 끝: [0.36, 0.52, 0.78], 중: [0.20, 0.70, 0.36], 전: [0.86, 0.87, 0.89] }
const css = (c, a = 1) => 'rgba(' + c.map((v) => Math.round(v * 255)).join(',') + ',' + a + ')'
const 상태글 = { 끝: '끝', 중: '하는 중', 전: '아직' }

export default function 골조공정판({ M, S, setM, 세기, 엑셀받기, IFC받기, 받는중, 재생, 기성으로 }) {
  const R = useMemo(() => (S && !S.오류 ? 공정셈(M, S) : null), [M, S])
  const [기준, set기준] = useState('')
  const [알, set알] = useState('')
  const [더날, set더날] = useState('')
  if (!M.부재.length) return <div className="card"><p>아직 세운 부재가 없습니다 — 세우기 · 3D 에서 세우거나 «🧪 예시» 로 해 보십시오.</p></div>
  if (!S || S.오류 || !R) return <div className="card"><p className="gmd-warn">셈을 하지 못했습니다 — {S && S.오류}</p></div>
  const P = R.P
  const 처음 = !M.공정
  const 고 = (고칠) => { setM((p) => 공정고치기(p, 고칠)); if (처음) 세기('|골조모델|공정'); set알('') }
  const 예시 = /가상 예시/.test(M.이름 || '')
  const 구간있음 = (M.구간 || []).length > 0
  /* 기준일 — 고른 날 · 없으면 오늘(공기 안이면) · 지났으면 끝 날 · 앞이면 시작 날 */
  const 기준일 = 기준 || (R.다됨 ? (오늘() < R.시작 ? R.시작 : 오늘() > R.끝 ? R.끝 : 오늘()) : '')
  const 상 = R.다됨 && 기준일 ? 날상태(R, 기준일) : null
  const 달 = R.다됨 ? 달마다(R, (M.기성 && M.기성.단가) || {}, (M.기성 && M.기성.갈래) || ['콘크리트', '거푸집', '철근']) : []
  const 금 = 달.some((o) => o.금액 > 0)
  const 이달 = 오늘().slice(0, 7)
  const 다음달 = (() => { const [y, m] = 이달.split('-').map(Number); const t = new Date(y, m, 1); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') })()
  const 기성할 = R.다됨 && 기준일 ? 공정기성(M, R, 기준일) : { 새: [] }
  const 기성넣기 = () => {
    const r = 공정기성(M, R, 기준일)
    if (!r.새.length) { set알(기준일 + ' 까지 끝난 칸 가운데 기성에 아직 안 든 칸이 없습니다.'); return }
    setM(r.M); 세기('|골조모델|공정기성')
    set알('📆 기성 ' + r.회 + '회(' + 기준일 + ')를 만들고 끝난 칸 ' + r.새.length + '곳을 넣었습니다 — ' + r.새.map((k) => 칸이름(R.줄.find((c) => c.열쇠 === k))).join(' · '))
  }
  const 비우기 = () => { if (!window.confirm('공정(시작 날 · 작업일 · 차례)을 비울까요? (되돌리기로 돌아올 수 있습니다)')) return; setM((p) => { const N = { ...p }; delete N.공정; return N }); set기준(''); set알('') }
  const 일수넣기 = (k, v) => { const n = Number(String(v).replace(/[^\d]/g, '')); const 새 = { ...P.일수 }; if (n > 0) 새[k] = n; else delete 새[k]; 고({ 일수: 새 }) }
  return (
    <div className="card gmd-gs gmd-gj" aria-label="공정">
      <div className="gmd-row"><b>🗓 골조 공정 — 칸(층 × 구간)마다 작업일을 넣으면 공정표 · 3D 재생 · 달마다 물량</b></div>
      <p className="muted gmd-p">칸은 📆 기성과 같은 칸입니다{구간있음 ? '(층 × 구간)' : '(구간을 긋지 않아 층마다 한 칸 — 세우기 · 3D 의 ▭ 구간으로 팀별 · 공구별 칸을 나눌 수 있음)'}. 작업일은 넣는 값이고(비면 날짜를 셈하지 않음), 날짜는 쉬는 날을 빼고 작업일로 셉니다.</p>
      {예시 && 처음 && <div className="gmd-note">🧪 가상 예시 모델입니다. <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setM((p) => 공정고치기(p, 예시공정())); 세기('|골조모델|공정예시'); set기준('') }}>🧪 예시 값 넣기(칸마다 6일 · 팀 따로)</button> — 실제 현장 값이 아닙니다.</div>}

      <div className="gmd-gs-kinds gmd-gj-set" aria-label="공정 조건">
        <label className="gmd-kv">시작 날 <input type="date" className="gmd-in" value={P.시작} onChange={(e) => 고({ 시작: e.target.value })} aria-label="공정 시작 날" /></label>
        <span className="gmd-gs-kind" role="radiogroup" aria-label="작업일 정하기">
          <label className="gmd-kv"><input type="radio" name="gj-way" checked={P.방법 !== '거푸집'} onChange={() => 고({ 방법: '같은날' })} /> 칸마다</label>
          <input className="gmd-in gmd-gj-num" inputMode="numeric" placeholder="일" aria-label="칸마다 작업일" value={P.기본 ? String(P.기본) : ''} onChange={(e) => 고({ 방법: '같은날', 기본: e.target.value.replace(/[^\d]/g, '') })} />일
        </span>
        <span className="gmd-gs-kind">
          <label className="gmd-kv"><input type="radio" name="gj-way" checked={P.방법 === '거푸집'} onChange={() => 고({ 방법: '거푸집' })} /> 팀 하루 거푸집</label>
          <input className="gmd-in gmd-gj-num" inputMode="decimal" placeholder="㎡" aria-label="팀 하루 거푸집(㎡)" value={P.하루 ? String(P.하루) : ''} onChange={(e) => 고({ 방법: '거푸집', 하루: e.target.value.replace(/[^\d.]/g, '') })} />㎡
        </span>
        {구간있음 && <label className="gmd-kv" title="같은 구간끼리 층을 이어 감(A팀 1층 → A팀 2층) · 구간끼리는 함께"><input type="checkbox" checked={!!P.팀} onChange={(e) => 고({ 팀: e.target.checked })} /> 구간마다 팀 따로</label>}
      </div>
      <div className="gmd-gs-kinds gmd-gj-rest" aria-label="쉬는 날">
        <span className="muted">쉬는 날</span>
        <label className="gmd-kv"><input type="checkbox" checked={!!P.일쉼} onChange={(e) => 고({ 일쉼: e.target.checked })} /> 일요일</label>
        <label className="gmd-kv"><input type="checkbox" checked={!!P.공휴쉼} onChange={(e) => 고({ 공휴쉼: e.target.checked })} /> 공휴일</label>
        <label className="gmd-kv"><input type="checkbox" checked={!!P.토쉼} onChange={(e) => 고({ 토쉼: e.target.checked })} /> 토요일</label>
        <span className="gmd-gs-kind"><input type="date" className="gmd-in" value={더날} onChange={(e) => set더날(e.target.value)} aria-label="그 밖에 쉬는 날" /><button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!더날} onClick={() => { 고({ 더쉼: [...P.더쉼, 더날] }); set더날('') }}>＋ 쉬는 날</button></span>
        {P.더쉼.map((d) => <button key={d} type="button" className="gmd-gs-chip" onClick={() => 고({ 더쉼: P.더쉼.filter((x) => x !== d) })} aria-label={d + ' 쉬는 날 빼기'}>{점(d)} ✕</button>)}
      </div>

      {!R.다됨 && <p className="gmd-note" role="status">{R.까닭 === '시작 날 없음' ? '시작 날을 넣으십시오.' : R.까닭 === '칸 없음' ? '칸이 없습니다.' : '작업일이 없는 칸 ' + R.모자람.length + '곳 — 위에서 «칸마다 n일» · «팀 하루 거푸집 ㎡» 를 넣거나 아래 표에서 칸마다 넣으십시오.' + (P.방법 === '거푸집' && P.하루 ? ' (거푸집이 없는 칸은 표에서 넣어야 함)' : '')}</p>}
      {R.다됨 && <div className="gmd-cv-sum" aria-label="공기">
        <span className="gmd-cv-chip ok">🗓 {R.시작} ~ {R.끝}</span>
        <span className="gmd-cv-chip">작업일 {R.작업일}일 · 달력 {R.달력일}일</span>
        <span className="gmd-cv-chip">칸 {R.줄.length}곳{P.팀 ? ' · 팀 ' + new Set(R.줄.map((c) => c.사슬)).size : ''}</span>
        {R.공휴없음.length > 0 && <span className="gmd-cv-chip mid">⚠ {R.공휴없음.join(' · ')}년 공휴일 표 없음 — 그 해는 공휴일을 빼지 않음</span>}
      </div>}
      {알 && <p className="gmd-note" role="status">{알}</p>}

      {R.다됨 && <>
        <h2 className="gmd-h">공정표 <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>막대 = 칸 작업 기간 · 옅은 세로 줄 = 쉬는 날 · 빨간 줄 = 기준일</span></h2>
        <공정막대 R={R} 기준일={기준일} 구간={M.구간 || []} />
        <div className="gmd-gs-kinds gmd-gj-now" aria-label="기준일">
          <label className="gmd-kv">기준일 <input type="date" className="gmd-in" value={기준일} min={R.시작} onChange={(e) => set기준(e.target.value)} aria-label="기준일" /></label>
          {상 && <span className="gmd-gj-state"><span style={{ color: css(공정색들.끝) }}>■ 끝 {상.끝.length}</span> · <span style={{ color: css(공정색들.중) }}>■ 하는 중 {상.중.length}</span> · <span className="muted">■ 아직 {상.전.length}</span></span>}
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { 재생 && 재생(기준일 && 기준일 > R.시작 && 기준일 < R.끝 ? 기준일 : R.시작); 세기('|골조모델|공정재생') }}>🧊 3D 로 재생 ▶</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={기성넣기} disabled={!기성할.새.length} title="기준일까지 끝난 칸(앞 기성 회차에 안 든 것)으로 📆 기성 새 회차">📆 {기준일 ? 점(기준일) : ''}까지 끝난 칸 {기성할.새.length}곳 → 기성 새 회차</button>
          {M.기성 && M.기성.회차.length > 0 && 기성으로 && <button type="button" className="gmd-link" onClick={기성으로}>📆 기성 →</button>}
        </div>
      </>}

      <h2 className="gmd-h">칸 공정 <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>작업일을 칸마다 고칠 수 있음(비우면 위 값) · ▲▼ 로 차례</span></h2>
      <div className="gmd-tablewrap"><table className="gmd-table gmd-gs-table gmd-gj-table">
        <thead><tr><th>차례</th><th>칸</th><th>작업일</th><th>시작</th><th>끝</th><th>콘크리트(㎥)</th><th>거푸집(㎡)</th><th>{기준일 ? 점(기준일) : '상태'}</th></tr></thead>
        <tbody>
          {R.줄.map((c, i) => {
            const 기 = 칸작업일({ ...P, 일수: {} }, R.Q.칸.get(c.열쇠))
            const st = R.다됨 && 기준일 ? 상.끝.includes(c.열쇠) ? '끝' : 상.중.includes(c.열쇠) ? '중' : '전' : null
            return (
              <tr key={c.열쇠} className={'gj-' + (st || 'x')}>
                <td className="gmd-gj-ord"><span>{c.차례}</span>
                  <button type="button" className="gmd-gj-mv" aria-label={칸이름(c) + ' 위로'} disabled={i === 0} onClick={() => setM((p) => 공정옮기기(p, R.Q, c.열쇠, -1))}>▲</button>
                  <button type="button" className="gmd-gj-mv" aria-label={칸이름(c) + ' 아래로'} disabled={i === R.줄.length - 1} onClick={() => setM((p) => 공정옮기기(p, R.Q, c.열쇠, 1))}>▼</button></td>
                <td>{칸이름(c)}</td>
                <td><input className={'gmd-in gmd-gj-num' + (P.일수[c.열쇠] ? ' on' : '')} inputMode="numeric" aria-label={칸이름(c) + ' 작업일'} placeholder={기.일수 ? String(기.일수) : '일'} value={P.일수[c.열쇠] ? String(P.일수[c.열쇠]) : ''} onChange={(e) => 일수넣기(c.열쇠, e.target.value)} title={c.근거 === '거푸집' ? '거푸집 ' + 수글(c.합.거푸집, 1) + ' ㎡ ÷ 하루 ' + P.하루 + ' ㎡ = ' + c.일수 + '일(올림)' : c.근거 === '고침' ? '칸마다 고친 값' : c.일수 ? '위 «칸마다 n일»' : '작업일 없음'} />{!c.일수 && <span className="gmd-warn" style={{ marginLeft: 4 }}>없음</span>}</td>
                <td>{c.시작 ? 점(c.시작) : ''}</td>
                <td>{c.끝 ? 점(c.끝) : ''}</td>
                <td className="num">{수글(c.합.콘크리트, 2)}</td>
                <td className="num">{수글(c.합.거푸집, 2)}</td>
                <td>{st ? <span className={'gmd-gj-st ' + st}>{상태글[st]}</span> : ''}</td>
              </tr>)
          })}
        </tbody>
      </table></div>

      {R.다됨 && <>
        <h2 className="gmd-h">달마다 — 예정 물량 <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>칸 물량을 그 칸 작업일에 고르게 나눠 그 달에 든 날만큼{금 ? ' · 금액 = 📆 기성 단가' : ''}</span></h2>
        <div className="gmd-tablewrap"><table className="gmd-table gmd-gs-table gmd-gj-month">
          <thead><tr><th>달</th><th>작업일</th><th>하는 칸(그 달 날 수)</th><th>콘크리트(㎥)</th><th>거푸집(㎡)</th><th>철근(ton)</th>{금 && <><th>예정 금액</th><th>누계 금액</th></>}</tr></thead>
          <tbody>
            {달.map((o) => <tr key={o.달} className={o.달 === 다음달 ? 'next' : o.달 === 이달 ? 'now' : ''}>
              <td>{o.달}{o.달 === 다음달 ? <span className="gmd-cv-chip mid gmd-gj-tag">다음 달</span> : o.달 === 이달 ? <span className="gmd-cv-chip gmd-gj-tag">이번 달</span> : ''}</td>
              <td className="num">{o.작업일}</td>
              <td className="gmd-gj-cells">{o.칸.map((c) => 칸이름(c) + ' ' + c.일 + '일').join(' · ')}</td>
              <td className="num">{수글(o.양.콘크리트, 2)}</td><td className="num">{수글(o.양.거푸집, 2)}</td><td className="num">{수글(o.양.철근 / 1000, 3)}</td>
              {금 && <><td className="num">{원글(o.금액)}</td><td className="num">{원글(o.누계금액)}</td></>}
            </tr>)}
            <tr className="sum"><td>합계</td><td className="num">{달.reduce((a, o) => a + o.작업일, 0)}</td><td></td>
              <td className="num">{수글(R.Q.칸합.콘크리트, 2)}</td><td className="num">{수글(R.Q.칸합.거푸집, 2)}</td><td className="num">{수글(R.Q.칸합.철근 / 1000, 3)}</td>
              {금 && <><td className="num">{원글(달.reduce((a, o) => a + o.금액, 0))}</td><td></td></>}</tr>
          </tbody>
        </table></div>
        {(R.Q.없음.콘크리트 > 1e-6 || R.Q.없음.거푸집 > 1e-6) && <p className="muted gmd-p">자리 없는 물량(도면 덧줄 · 부재에 안 붙은 산출 줄)은 칸이 없어 공정에 들지 않습니다 — 콘크리트 {수글(R.Q.없음.콘크리트, 2)} ㎥ · 거푸집 {수글(R.Q.없음.거푸집, 2)} ㎡.</p>}
      </>}
      <div className="gmd-top">
        <button type="button" className="btn" style={{ width: 'auto' }} onClick={엑셀받기} disabled={!!받는중 || !R.다됨}>{받는중 ? '만드는 중…' : '📊 엑셀(공정 시트 함께)'}</button>
        {IFC받기 && <button type="button" className="btn line gmd-ifcbtn" style={{ width: 'auto' }} onClick={IFC받기} disabled={!!받는중 || !R.다됨} title="나비스웍스 TimeLiner 등 4D 프로그램이 읽는 공정(칸마다 과제 · 날짜)이 든 IFC4">🧊 IFC(공정 담김)</button>}
        <span className="muted gmd-p">모델 엑셀에 «골조공정표»(주마다 ■) · «월별예정» · «공정조건» 시트가 들어갑니다 — 받기 전에 한 번 더 셈해 보고 받습니다. 🧊 IFC 에는 칸마다 과제(작업일 · 시작 · 끝)와 그 칸 부재가 묶여 들어갑니다.</span>
        {!처음 && <button type="button" className="btn line sm" style={{ width: 'auto', marginLeft: 'auto' }} onClick={비우기}>공정 비우기</button>}
      </div>
    </div>
  )
}

/** 공정 막대 — 칸마다 한 줄 · 달 칸 · 쉬는 날 옅은 줄 · 기준일 빨간 줄 */
function 공정막대({ R, 기준일, 구간 }) {
  const 쉼 = useMemo(() => 쉼판(R.P), [R.P])
  const 날수 = R.b - R.a + 1
  const px = Math.max(3, Math.min(22, 640 / 날수))
  const 왼 = 92, 줄높 = 20, 위 = 24
  const W = Math.ceil(왼 + 날수 * px + 8), H = 위 + R.줄.length * 줄높 + 6
  const x = (n) => 왼 + (n - R.a) * px
  const 달들 = []
  for (let n = R.a; n <= R.b + 1; n++) { const t = 번날(n); if (n === R.a || t.endsWith('-01')) 달들.push(n) }
  const 쉼들 = []
  if (px >= 4) for (let n = R.a; n <= R.b; n++) if (쉼(n)) 쉼들.push(n)
  const 구번 = new Map(구간.map((z, i) => [z.id, i]))
  const 색 = (c) => { const i = 구번.get(c.구간); return i === undefined ? [0.55, 0.58, 0.64] : 구간색들[i % 구간색들.length] }
  const 기 = 날번(기준일)
  return (
    <div className="gmd-tablewrap gmd-gj-chart">
      <svg width={W} height={H} viewBox={'0 0 ' + W + ' ' + H} role="img" aria-label={'골조 공정표 ' + R.시작 + ' ~ ' + R.끝} style={{ display: 'block', fontSize: 11 }}>
        {쉼들.map((n) => <rect key={'r' + n} x={x(n)} y={위} width={px} height={H - 위 - 6} fill="rgba(120,130,150,.12)" />)}
        {달들.map((n, i) => <g key={'m' + n}>
          <line x1={x(n)} y1={4} x2={x(n)} y2={H - 6} stroke="rgba(120,130,150,.45)" strokeWidth={1} />
          {(i === 달들.length - 1 ? R.b + 1 : 달들[i + 1]) - n >= Math.max(3, 34 / px) && <text x={x(n) + 3} y={16} fill="currentColor">{(+번날(n).slice(5, 7)) + '월' + (i === 0 || 번날(n).slice(5, 7) === '01' ? ' ' + 번날(n).slice(0, 4) : '')}</text>}
        </g>)}
        {R.줄.map((c, i) => {
          const y = 위 + i * 줄높
          const w = (c.b - c.a + 1) * px
          return <g key={c.열쇠}>
            <text x={4} y={y + 14} fill="currentColor">{칸이름(c)}</text>
            <rect x={x(c.a)} y={y + 3} width={Math.max(w, 2)} height={줄높 - 6} rx={3} fill={css(색(c), 0.85)}><title>{칸이름(c) + ' — ' + c.시작 + ' ~ ' + c.끝 + ' · 작업일 ' + c.일수 + '일'}</title></rect>
            {w >= 26 && <text x={x(c.a) + 4} y={y + 14} fill="#111" style={{ fontSize: 10 }}>{c.일수}일</text>}
          </g>
        })}
        {기 !== null && 기 >= R.a && 기 <= R.b && <line x1={x(기) + px / 2} y1={위 - 4} x2={x(기) + px / 2} y2={H - 4} stroke="#e03131" strokeWidth={2} />}
      </svg>
    </div>
  )
}

/** 🧊 3D 재생 줄 — 세우기 · 3D 에 붙음(날 · ▶ · 끌개 · 끄기) */
export function 공정재생줄({ R, 날, set날, 끄기, 공정으로 }) {
  const [돎, set돎] = useState(false)
  /* 끝 날에는 끝 칸이 아직 «하는 중» — 맨 끝에 «골조 끝난 뒤»(끝 다음 날) 한 칸을 더함 */
  const 날들 = useMemo(() => (R && R.다됨 ? [...R.날들, R.b + 1] : []), [R])
  const n = 날번(날)
  let i = 날들.findIndex((d) => d >= n)
  if (i < 0) i = 날들.length - 1
  const iRef = useRef(i)
  iRef.current = i
  /* 폰에서는 3D 가 아래에 있어 — 재생 줄이 안 보이면 맨 위로 올려 보여 줌 */
  const 판Ref = useRef(null)
  useEffect(() => {
    const el = 판Ref.current
    if (!el || typeof el.getBoundingClientRect !== 'function') return
    const q = el.getBoundingClientRect()
    if (q.top < 0 || q.bottom > window.innerHeight) el.scrollIntoView({ block: 'start' })
  }, [])
  useEffect(() => {
    if (!돎 || !날들.length) return undefined
    const t = Math.max(80, Math.min(600, 12000 / 날들.length))
    const h = setInterval(() => {
      const j = iRef.current + 1
      if (j >= 날들.length) { set돎(false); return }
      set날(번날(날들[j]))
    }, t)
    return () => clearInterval(h)
  }, [돎, 날들, set날])
  if (!R || !R.다됨) return <div className="gmd-note gmd-gs-3dnote gmd-gj-play" role="status">🗓 공정이 다 정해지지 않았습니다(시작 날 · 작업일). <button type="button" className="gmd-link" onClick={끄기}>끄기</button>{공정으로 && <button type="button" className="gmd-link" onClick={공정으로}>🗓 공정 →</button>}</div>
  const 상 = 날상태(R, 날)
  const 하는 = R.줄.filter((c) => 상.중.includes(c.열쇠)).map(칸이름)
  const 날글 = 날들.length ? 번날(날들[i]) : 날
  return (
    <div className="gmd-note gmd-gs-3dnote gmd-gj-play" role="group" aria-label="공정 3D 재생" ref={판Ref}>
      <div className="gmd-gj-playtop">🗓 <b>{날글}({요일글(날글)})</b> <span className="muted">{i < R.날들.length ? (i + 1) + '/' + R.날들.length + '일째' : '골조 끝난 뒤'}</span> · {하는.length ? '하는 중 ' + 하는.slice(0, 3).join(' · ') + (하는.length > 3 ? ' 외 ' + (하는.length - 3) : '') : 상.전.length ? '쉬는 날 · 다음 칸 기다림' : '다 끝'} · 끝 {상.끝.length}/{R.줄.length}칸</div>
      <div className="gmd-gj-playbar">
        <button type="button" className="btn line sm" style={{ width: 'auto' }} aria-label="처음으로" onClick={() => { set돎(false); set날(R.시작) }}>⏮</button>
        <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { if (!돎 && i >= 날들.length - 1) set날(R.시작); set돎(!돎) }}>{돎 ? '⏸ 멈춤' : '▶ 재생'}</button>
        <input type="range" min={0} max={Math.max(0, 날들.length - 1)} value={i} aria-label="공정 날" onChange={(e) => { set돎(false); set날(번날(날들[+e.target.value])) }} />
        <button type="button" className="btn line sm" style={{ width: 'auto' }} aria-label="끝으로" onClick={() => { set돎(false); set날(번날(R.b + 1)) }}>⏭</button>
      </div>
      <div><b style={{ color: css(공정색들.끝) }}>■ 끝</b> · <b style={{ color: css(공정색들.중) }}>■ 하는 중</b> · <b style={{ color: 'rgb(170,172,178)' }}>□ 아직(비침)</b> <button type="button" className="gmd-link" onClick={() => { set돎(false); 끄기() }}>끄기</button>{공정으로 && <button type="button" className="gmd-link" onClick={공정으로}>🗓 공정 →</button>}</div>
    </div>
  )
}
