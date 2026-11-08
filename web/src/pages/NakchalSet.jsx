/**
 * /forms/hanbeol — 🏁 낙찰 서류 한 벌 (G499 · 2026-11-01)
 *
 * 소장님: 바로투찰 아이디어 ④ «낙찰 → 서류 한 벌 자동» — 1순위가 된 공고의 공사명 · 발주 · 계약금액으로 서식을 차례대로.
 * ■ 셈 · 차례 · 공통 칸: lib/낙찰한벌.js (시험 tools/시험_낙찰한벌.mjs) — 서식은 이미 있는 것(종이 · 사이트에서 작성)을 그대로 엽니다.
 * ■ 들어오는 길: 넣은 금액이 1순위였던 공고(내금액.jsx) · 개찰 카드(NoticeDetail) · 서식 탭 · 바로 열기(빈 칸).
 * ■ 숨은 누적: |한벌|열기 · |한벌|채움 · |한벌|서식:{slug}
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 세기 } from '../lib/받은수.jsx'
import { use잠깐말 } from '../lib/잠깐말.js'
import { 한벌차례, 한벌칸, 주소값, 공통넣기, 공통읽기, 한벌열쇠 } from '../lib/낙찰한벌.js'

const 쉼표 = (v) => { const n = Number(String(v ?? '').replace(/[^0-9]/g, '')) || 0; return n > 0 ? n.toLocaleString('ko-KR') : '' }
const 한글돈 = (v) => {
  let n = Number(String(v ?? '').replace(/[^0-9]/g, '')) || 0
  if (!(n > 0)) return ''
  const 억 = Math.floor(n / 1e8), 만 = Math.floor((n % 1e8) / 1e4)
  return [억 ? `${억.toLocaleString('ko-KR')}억` : '', 만 ? `${만.toLocaleString('ko-KR')}만` : ''].filter(Boolean).join(' ') + '원'
}

export default function NakchalSet() {
  const loc = useLocation()
  const 처음 = useMemo(() => {
    const 주 = 주소값(loc.search)
    const 옛 = 공통읽기()
    let 지난 = {}
    try { 지난 = JSON.parse(localStorage.getItem(한벌열쇠) || '{}') || {} } catch (e) { 지난 = {} }
    const 주소있음 = !!(주.현장 || 주.발주 || 주.계약금액)
    const v = {}
    for (const [k] of 한벌칸) v[k] = (주소있음 ? 주[k] : '') || (!주소있음 && 지난.v ? 지난.v[k] : '') || 옛[k] || ''
    if (주소있음) for (const k of ['현장', '발주', '계약금액']) v[k] = 주[k] || ''
    return { v, no: 주.no || (!주소있음 ? 지난.no || '' : ''), 주소있음 }
  }, [loc.search])
  const [v, setV] = useState(처음.v)
  const [말, set말] = use잠깐말(6000)   // 🩹 G588b 같은 알림을 그 시간 안에 또 띄워도 시간을 새로 셈(lib/잠깐말.js — 전엔 둘째 알림이 곧 사라짐)
  const [넣음, set넣음] = useState(false)
  useEffect(() => { setV(처음.v); set넣음(false) }, [처음])
  useEffect(() => { 세기('|한벌|열기') }, [])
  const 칸 = (k) => (e) => { const x = k === '계약금액' ? 쉼표(e.target.value) : e.target.value; setV((o) => ({ ...o, [k]: x })); set넣음(false) }
  const 모자람 = 한벌칸.filter(([k, , 꼭]) => 꼭 && !String(v[k] || '').trim()).map(([, n]) => n)
  const 채우기 = (조용히 = false) => {
    const n = 공통넣기(v)
    try { localStorage.setItem(한벌열쇠, JSON.stringify({ no: 처음.no, v, at: Date.now() })) } catch (e) { /* 개인 창 */ }
    set넣음(true)
    if (!조용히) { set말(`✅ ${n}칸을 서식 공통 칸에 넣었습니다 — 아래 서식을 열면 채워져 있습니다.`); 세기('|한벌|채움') }
    return n
  }
  const 열때 = (slug) => () => { 채우기(true); 세기(`|한벌|서식:${slug}`) }
  return (
    <div className="hb">
      <div className="card hb-head">
        <h1>🏁 낙찰 서류 한 벌 — 이 공사 서류를 차례대로</h1>
        <p>공사명 · 발주기관 · 계약금액을 한 번 넣으면 <b>아래 서식을 열 때마다 그 칸이 채워져</b> 있습니다(이 기기에만 · 서버로 안 감).
          계약 → 착공 → 안전 → 공사 중 → 돈 차례로 필요한 것만 여십시오.</p>
        {처음.no && <p className="muted sm" style={{ margin: 0 }}>공고번호 {처음.no}{처음.주소있음 ? ' — 1순위 화면에서 가져온 값' : ' — 지난번에 연 한 벌'}</p>}
      </div>

      <section className="card hb-form">
        <div className="hb-sh">① 공사 값 <span className="muted">— 공사명 · 발주기관 · 계약금액은 꼭 · 나머지는 아는 것만</span></div>
        <div className="hb-grid">
          {한벌칸.map(([k, n, 꼭]) => (
            <label key={k} className={'hb-f' + (꼭 ? ' must' : '')}>
              <span>{n}{꼭 ? ' *' : ''}</span>
              <input value={v[k] || ''} onChange={칸(k)} inputMode={k === '계약금액' ? 'numeric' : undefined}
                type={k === '착공' || k === '준공' ? 'date' : 'text'}
                placeholder={k === '현장' ? '○○지구 배수로 정비공사' : k === '발주' ? '○○시' : k === '계약금액' ? '낙찰금액(원) — 적격심사는 투찰금액 그대로' : ''} />
              {k === '계약금액' && v[k] ? <small className="muted">{한글돈(v[k])}</small> : null}
            </label>
          ))}
        </div>
        <div className="hb-row">
          <button type="button" className="btn" style={{ width: 'auto' }} onClick={() => 채우기(false)} disabled={모자람.length > 0}>✅ 이 값으로 서식에 채우기</button>
          {모자람.length > 0 && <span className="muted sm">빈 칸: {모자람.join(' · ')}</span>}
          {넣음 && !모자람.length && <span className="hb-ok">✔ 넣었습니다</span>}
        </div>
        {말 && <div className="cok">{말}</div>}
        <p className="muted sm" style={{ margin: '6px 0 0' }}>이미 쓰던 서식은 쓰던 값 그대로 열립니다 — 새 값으로 채우려면 그 서식에서 <b>«🧹 빈칸으로»</b> 를 누르십시오.
          계약금액은 적격심사 낙찰이면 보통 투찰금액 그대로입니다 — 계약서의 금액과 맞는지 확인하십시오.</p>
      </section>

      {한벌차례.map((단, i) => (
        <section key={단.k} className="card hb-step">
          <div className="hb-sh"><span className="hb-no">{i + 2}</span>{단.ic} {단.k}</div>
          <ul className="hb-list">
            {단.들.map((x) => (
              <li key={x.slug || x.to}>
                <Link to={x.slug ? `/forms/${x.slug}` : x.to} onClick={x.slug ? 열때(x.slug) : () => { 채우기(true); 세기(`|한벌|도구:${x.to}`) }}
                  className={'hb-it' + (x.도구 ? ' tool' : '')}>
                  <b>{x.도구 ? '🧰 ' : '📄 '}{x.t}</b>
                  <span>{x.d}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="muted sm" style={{ textAlign: 'center' }}>서식은 모두 «종이에 바로 쓰기 · 사이트에서 작성 → PDF» 입니다. 날짜(언제까지)는 «낙찰 뒤 할 일 달력», 산출내역서는 내역서 탭에서.</p>
    </div>
  )
}
