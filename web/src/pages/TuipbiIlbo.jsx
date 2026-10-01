/**
 * 📝 공사일보 한 장 — 현장 화면의 탭 (2026-09-28)
 *
 * 소장님: 「1번부터 6번까지 한꺼번에 가자. 이미 있는데 수정을 하거나 보완하는 거니까」
 *   ② 받은 무료 «공사일보» 프로그램(HTML)의 «방식만»: 날씨·기온 · 공정률(계획/실시/대비) · 공종별 작업 내용 ·
 *      인원·장비·자재 금일/누계 · 특기사항 · 전날 복사 · A4 인쇄. 그 프로그램의 코드·글·이름은 쓰지 않았습니다.
 *   그 프로그램은 자료를 PC 의 엑셀 파일로 저장·불러오기(안 누르면 사라짐) — 여기는 현장 저장(자동)·휴지통·매일 백업을 그대로 씁니다.
 * ■ 인원·장비·자재는 ✍️ 적기에서 이미 적은 출역·장비·자재 반입으로 저절로 셉니다(다시 적지 않음) — lib/tuipbi.js 일보셈
 * ■ 적는 칸(날씨·기온·공정률·작업 내용·특기사항·내일 계획)만 cost_day/{현장}/{날짜} 에 저장(자동, 0.9초 뒤)
 * ■ 계획 공정률: 같은 브라우저의 📈 예정공정표(/tools/schedule, localStorage 'kcm.calc.schedule')에서 그날 누계를 가져옴
 * ■ 인쇄: A4 세로 한 장(#il-인쇄)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { 오늘, 날더하기, 요일, 날씨들, 일보풀기, 일보싸기, 일보셈 } from '../lib/tuipbi.js'
import { 계획률 } from '../lib/공정.js'
import 일보종이 from '../tools/일보종이.jsx'   /* 2026-10-01 (G112) 종이는 따로 — /tools/ilbo(작업일보 만들기)와 같이 씀 */

const 점날 = (t) => { const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[1] + '. ' + (+m[2]) + '. ' + (+m[3]) + '.' : '' }
const 수글 = (v) => (Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '')
const 공정표읽기 = () => { try { const m = JSON.parse(localStorage.getItem('kcm.calc.schedule') || 'null'); return m && Array.isArray(m.공종) && m.착공 ? m : null } catch (e) { return null } }

export default function TuipbiIlbo({ 현장, 줄들, 사람, 장비, 업체, 출역, 일보 = {}, 일보저장, 일보막힘, 예시 }) {
  const 처음날 = () => {
    if (예시) { const ds = Object.keys(일보).sort(); if (ds.length) return ds[ds.length - 1] }
    return 오늘()
  }
  const [d, setD] = useState(처음날)
  const [폼, set폼] = useState(() => 일보풀기(일보[d]))
  const 고친 = useRef(false)
  const 지금 = useRef({ d, 폼 })              // 날짜를 바꾸거나 탭을 떠날 때 못 한 저장을 마저 하려고
  지금.current = { d: 지금.current.d, 폼 }
  const [알림, set알림] = useState('')
  const 마저 = () => { if (고친.current) { 고친.current = false; 일보저장(지금.current.d, 일보싸기(지금.current.폼)) } }
  // 날짜를 바꾸면 — 앞 날의 못 한 저장을 마저 하고, 그날 것을 불러옴
  useEffect(() => { 마저(); 지금.current = { d, 폼: 일보풀기(일보[d]) }; set폼(일보풀기(일보[d])); set알림('') }, [d])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => 마저(), [])   // eslint-disable-line react-hooks/exhaustive-deps
  // 자동 저장 — 고친 뒤 0.9초
  useEffect(() => {
    if (!고친.current) return undefined
    const t = setTimeout(마저, 900)
    return () => clearTimeout(t)
  }, [폼])   // eslint-disable-line react-hooks/exhaustive-deps
  const 바꿈 = (f) => { 고친.current = true; set폼((o) => f({ ...o })) }
  const 칸 = (key) => (e) => { const v = e.target.value; 바꿈((o) => { o[key] = v; return o }) }
  const 줄고침 = (i, key, v) => 바꿈((o) => { o.wk = o.wk.map((r, j) => (j === i ? { ...r, [key]: v } : r)); return o })
  const 줄더 = () => 바꿈((o) => { o.wk = [...o.wk, { g: '', v: '', t: '', n: '' }]; return o })
  const 줄빼 = (i) => 바꿈((o) => { o.wk = o.wk.filter((_, j) => j !== i); return o })

  const 셈 = useMemo(() => 일보셈(d, 현장, 줄들, 사람, 장비, 출역), [d, 현장, 줄들, 사람, 장비, 출역])
  const 공정표 = useMemo(() => 공정표읽기(), [])
  const 계획값 = 공정표 ? 계획률(공정표, d) : null
  const 계획칸 = parseFloat(폼.pp), 실시칸 = parseFloat(폼.ap)
  const 대비 = Number.isFinite(계획칸) && Number.isFinite(실시칸) ? 실시칸 - 계획칸 : null

  /* 전날(14일 안) 작업 내용·내일 계획 가져오기 */
  const 전날 = () => {
    for (let k = 1; k <= 14; k++) {
      const pd = 날더하기(d, -k)
      if (일보[pd]) {
        const o = 일보풀기(일보[pd])
        바꿈((x) => { x.wk = o.wk.map((r) => ({ ...r })); if (!x.nt && o.nt) x.nt = o.nt; return x })   // 날씨·기온·공정률은 그날 것이라 안 가져옴
        set알림('↺ ' + 점날(pd) + ' 작업 내용을 가져왔습니다 — 오늘에 맞게 고쳐 쓰십시오.')
        return
      }
    }
    set알림('지난 14일 안에 적은 공사일보가 없습니다.')
  }
  const 공종들 = useMemo(() => { const s = new Set(); for (const v of Object.values(일보)) for (const r of 일보풀기(v).wk) if (r.g) s.add(r.g); return [...s].slice(0, 40) }, [일보])
  const 업체들 = useMemo(() => Object.values(업체 || {}).filter((x) => !x.off).map((x) => x.n), [업체])

  const [인쇄중, set인쇄중] = useState(false)
  useEffect(() => {
    if (!인쇄중) return undefined
    const 옛 = document.title
    document.title = '공사일보 ' + d + (현장 && 현장.name ? ' — ' + 현장.name : '')
    document.body.classList.add('il-인쇄중'); document.documentElement.classList.add('il-인쇄중')
    const 끝 = () => { document.body.classList.remove('il-인쇄중'); document.documentElement.classList.remove('il-인쇄중'); document.title = 옛; set인쇄중(false) }
    const t = setTimeout(() => {
      window.addEventListener('afterprint', 끝, { once: true })
      try { window.print() } catch (e) { 끝() }
      setTimeout(() => { if (document.body.classList.contains('il-인쇄중')) 끝() }, 60000)
    }, 150)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', 끝) }
  }, [인쇄중])   // eslint-disable-line react-hooks/exhaustive-deps

  const 종이 = <일보종이 현장={현장} d={d} 폼={폼} 셈={셈} 대비={대비} />
  const 저장됨 = !!일보[d]
  return (
    <>
      <div className="card tp-daybar no-print">
        <button type="button" className="chip" onClick={() => setD(날더하기(d, -1))} aria-label="전날">◀</button>
        <input type="date" value={d} onChange={(e) => e.target.value && setD(e.target.value)} />
        <b className="tp-dow">({요일(d)})</b>
        <button type="button" className="chip" onClick={() => setD(날더하기(d, 1))} aria-label="다음날">▶</button>
        {d !== 오늘() && <button type="button" className="chip" onClick={() => setD(오늘())}>오늘로</button>}
        <span className="muted" style={{ fontSize: 12.5 }}>{저장됨 ? '✅ 이 날 공사일보가 있습니다' : '이 날은 아직 안 적었습니다'} · 적는 순간 자동 저장</span>
      </div>
      {일보막힘 && !예시 && <div className="card note no-print">⚠️ 공사일보 저장 칸을 아직 열지 못했습니다 — 조금 뒤 ↻ 새로고침 해 주십시오. (인원·장비·자재는 그대로 보입니다)</div>}

      <div className="card no-print il-form">
        <div className="detail-h">📝 {점날(d)} ({요일(d)}) 공사일보</div>
        <div className="il-row">
          <span className="il-lab">날씨</span>
          <div className="il-chips">{날씨들.map((w) => <button key={w} type="button" className={'chip' + (폼.w === w ? ' on' : '')} onClick={() => 바꿈((o) => { o.w = o.w === w ? '' : w; return o })}>{w}</button>)}</div>
        </div>
        <div className="il-row">
          <span className="il-lab">기온(℃)</span>
          <label className="il-n">최저 <input inputMode="decimal" value={폼.lo} onChange={칸('lo')} placeholder="12" /></label>
          <label className="il-n">최고 <input inputMode="decimal" value={폼.hi} onChange={칸('hi')} placeholder="24" /></label>
          <a className="lnk" href="https://www.weather.go.kr/w/index.do" target="_blank" rel="noopener noreferrer">☁️ 기상청</a>
        </div>
        <div className="il-row">
          <span className="il-lab">공정률(%)</span>
          <label className="il-n">계획 <input inputMode="decimal" value={폼.pp} onChange={칸('pp')} placeholder="0.00" /></label>
          <label className="il-n">실시 <input inputMode="decimal" value={폼.ap} onChange={칸('ap')} placeholder="0.00" /></label>
          {대비 !== null && <span className={'il-diff' + (대비 < 0 ? ' bad' : '')}>대비 {(대비 > 0 ? '+' : '') + 수글(대비)}%p{계획칸 > 0 ? ' · 달성 ' + 수글(실시칸 / 계획칸 * 100) + '%' : ''}</span>}
        </div>
        <div className="il-row il-help">
          {계획값 !== null
            ? <button type="button" className="chip" onClick={() => 바꿈((o) => { o.pp = 수글(계획값 * 100); return o })}>📈 공정표에서 계획 {수글(계획값 * 100)}%</button>
            : <Link className="chip" to="/tools/schedule">📈 예정공정표 만들기 → 계획이 저절로</Link>}
          {셈.실시 !== null && <button type="button" className="chip" onClick={() => 바꿈((o) => { o.ap = 수글(셈.실시 * 100); return o })}>📊 기성 공정률 {수글(셈.실시 * 100)}%</button>}
        </div>

        <div className="il-sub">작업 내용 (공종별)</div>
        <datalist id="il-g">{공종들.map((g) => <option key={g} value={g} />)}</datalist>
        <datalist id="il-v">{업체들.map((v) => <option key={v} value={v} />)}</datalist>
        <div className="il-wk">
          {폼.wk.map((r, i) => (
            <div key={i} className="il-wkrow">
              <input className="g" list="il-g" value={r.g} onChange={(e) => 줄고침(i, 'g', e.target.value)} placeholder="공종 (예: 철근콘크리트)" maxLength={40} />
              <input className="v" list="il-v" value={r.v} onChange={(e) => 줄고침(i, 'v', e.target.value)} placeholder="업체" maxLength={40} />
              <input className="t" value={r.t} onChange={(e) => 줄고침(i, 't', e.target.value)} placeholder="작업 내용 (예: 3층 기둥 거푸집 조립)" maxLength={300} />
              <input className="n" inputMode="numeric" value={r.n} onChange={(e) => 줄고침(i, 'n', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="인원" maxLength={6} />
              <button type="button" className="gp-x" title="이 줄 지우기" onClick={() => 줄빼(i)}>✕</button>
            </div>
          ))}
        </div>
        <div className="tp-start">
          <button type="button" className="chip" onClick={줄더}>＋ 작업 줄</button>
          <button type="button" className="chip" onClick={전날}>↺ 전날 내용 가져오기</button>
        </div>
        {알림 && <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{알림}</div>}

        <div className="il-sub">특기사항 (안전·지시·검측·민원 등)</div>
        <textarea className="il-ta" rows={3} value={폼.nt} onChange={칸('nt')} maxLength={2000} placeholder="예: 09:00 TBM — 개구부 덮개 점검. 오후 3층 슬래브 배근 검측(감리 입회)." />
        <div className="il-sub">내일 작업 계획</div>
        <textarea className="il-ta" rows={2} value={폼.nx} onChange={칸('nx')} maxLength={1000} placeholder="예: 3층 슬래브 콘크리트 타설(펌프카 1대)" />
        <p className="muted" style={{ fontSize: 12.5, margin: '8px 0 0' }}>👷 인원 · 🚜 장비 · 🧱 자재는 <b>✍️ 적기</b>에 적은 출역·장비·자재 반입으로 <b>저절로</b> 들어갑니다(아래 한 장에 금일·누계).</p>
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn" style={{ width: 'auto' }} onClick={() => set인쇄중(true)}>🖨 이 날 공사일보 인쇄 (A4)</button>
        </div>
      </div>

      <div className="card il-paperwrap no-print">{종이}</div>
      {인쇄중 && createPortal(<div id="il-인쇄"><div className="il-쪽">{종이}</div></div>, document.body)}
    </>
  )
}
