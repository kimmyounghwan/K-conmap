import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  날씨들, 장비단위, 오늘, 날더하기, 요일, 수, 일빈, 빈것, 읽기, 쓰기, 그날, 적음, 싸기, 셈, 노무비인원, 달날들, 예시,
  보할들, 공정셈, 공정표공종, 새번호,
} from '../lib/ilbo.js'
import { 계획률, 공정셈 as 공정표셈 } from '../lib/공정.js'
import 일보종이 from '../tools/일보종이.jsx'
import { use인쇄 } from '../tools/공정인쇄.js'
import 도구설명 from '../tools/도구설명.jsx'
import 이어쓰기 from '../tools/이어쓰기.jsx'

/**
 * 📝 /tools/ilbo — 작업일보 만들기 (G112 · 2026-10-01)
 *
 * 소장님: 「예스폼에 또 뭐가 있지??? 새로 만들어야 할 서식은?」 → 예스폼 «작업일지»(68만) → 「1부터 4까지 만들어 보자」 (④ 작업일보 자동)
 * ■ 가입 · 현장 등록 없이 바로: 날마다 날씨 · 공정률 · 작업 내용 · 인원 · 장비 · 자재(금일만) → 전일까지 · 누계 저절로 → A4 한 장
 * ■ 같은 브라우저의 👷 노무비 계산기 출역 → 직종별 인원 «가져오기» · 📈 예정공정표 → 계획 공정률
 * ■ 여럿이 같이 · 청구서까지는 🏗 현장 투입비(같은 종이 — tools/일보종이.jsx). 저장은 이 브라우저(lib/ilbo.js) + 🔗 코드 + 비밀번호로 서버에 잠가 두면 폰·PC 어디서든 이어 씀(tools/이어쓰기.jsx · G113).
 */

const 점날 = (t) => { const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[1]}. ${+m[2]}. ${+m[3]}.` : '' }
const 수글 = (v) => (Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '')
const 공정표읽기 = () => { try { const m = JSON.parse(localStorage.getItem('kcm.calc.schedule') || 'null'); return m && Array.isArray(m.공종) && m.착공 ? m : null } catch (e) { return null } }

export default function Ilbo() {
  const [st, setSt] = useState(() => 읽기())
  const [저장됨, set저장됨] = useState(true)
  const [d, setD] = useState(() => 오늘())
  const [알림, set알림] = useState('')
  const [묻기, set묻기] = useState(false)
  useEffect(() => { set저장됨(쓰기(st)) }, [st])
  useEffect(() => { document.title = '작업일보 만들기 | K-건설맵' }, [])
  useEffect(() => { set알림(''); set묻기(false) }, [d])
  const 폼 = useMemo(() => 그날(st, d), [st, d])
  const 바꿈 = (f) => setSt((s) => ({ ...s, 일: { ...s.일, [d]: f({ ...그날(s, d) }) } }))
  const 칸 = (k) => (e) => { const v = e.target.value; 바꿈((o) => ({ ...o, [k]: v })) }
  const 줄 = (key, i, k, v) => 바꿈((o) => ({ ...o, [key]: o[key].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }))
  const 줄더 = (key, 빈) => 바꿈((o) => ({ ...o, [key]: [...o[key], 빈] }))
  const 줄빼 = (key, i) => 바꿈((o) => ({ ...o, [key]: o[key].length > 1 ? o[key].filter((_, j) => j !== i) : [일빈()[key][0]] }))
  const 현장칸 = (k, v) => setSt((s) => ({ ...s, 현장: { ...s.현장, [k]: v } }))

  const S = useMemo(() => 셈(st, d), [st, d])
  const 공정표 = useMemo(() => 공정표읽기(), [])
  const 계획값 = 공정표 ? 계획률(공정표, d) : null
  /* 📊 보할 공정률 — 소장님 「작업일보는 공정율도 나와야 해. 보할로 해야」 */
  const 공 = useMemo(() => 공정셈(st, d), [st, d])
  const 보 = useMemo(() => 보할들(st.공종), [st.공종])
  const 표공종 = useMemo(() => 공정표공종(공정표셈), [])
  const [공종열림, set공종열림] = useState(false)
  const [바꿀묻기, set바꿀묻기] = useState(false)
  const 계획표시 = 공.있음 && 공.계획 !== null ? String(공.계획) : 폼.pp
  const 실시표시 = 공.있음 ? String(공.실시) : 폼.ap
  const 계획칸 = parseFloat(계획표시), 실시칸 = parseFloat(실시표시)
  const 대비 = Number.isFinite(계획칸) && Number.isFinite(실시칸) ? 실시칸 - 계획칸 : null
  const 공종칸 = (id, k, v) => setSt((s) => ({ ...s, 공종: s.공종.map((g) => (g.id === id ? { ...g, [k]: v } : g)) }))
  const 공종더 = () => setSt((s) => ({ ...s, 공종: [...(s.공종 || []), { id: 새번호(), n: '', amt: '', w: '', q: '', u: '', b: '', s: '', dur: '' }] }))
  const 공종빼 = (id) => setSt((s) => ({ ...s, 공종: s.공종.filter((g) => g.id !== id) }))
  const 표가져오기 = () => {
    if (!표공종) return
    setSt((s) => ({ ...s, 공종: 표공종.map((g) => ({ ...g, b: '' })) })); set바꿀묻기(false); set공종열림(true)
    set알림(`📈 예정공정표에서 공종 ${표공종.length}개(금액 · 시작 · 기간)를 가져왔습니다 — 보할은 금액 비율, 계획 공정률은 그 일정으로 셉니다.`)
  }
  const 진칸 = (id, v) => 바꿈((o) => ({ ...o, 진: { ...(o.진 || {}), [id]: v } }))
  const 노무 = useMemo(() => 노무비인원(d), [d])
  const ym = d.slice(0, 7)
  const 적은날 = useMemo(() => 달날들(st, ym), [st, ym])
  const 공종들 = useMemo(() => { const s = new Set(); for (const v of Object.values(st.일 || {})) for (const r of v.wk || []) if (r.g) s.add(r.g); return [...s].slice(0, 40) }, [st.일])
  const 직종들 = useMemo(() => { const s = new Set(['보통인부', '특별인부', '형틀목공', '철근공', '콘크리트공', '조적공', '미장공', '용접공', '비계공', '배관공', '전공']); for (const v of Object.values(st.일 || {})) for (const r of v.인 || []) if (r.j) s.add(r.j); return [...s].slice(0, 60) }, [st.일])
  const 장비들 = useMemo(() => { const s = new Set(); for (const v of Object.values(st.일 || {})) for (const r of v.장 || []) if (r.n) s.add(r.n); return [...s].slice(0, 40) }, [st.일])
  const 자재들 = useMemo(() => { const s = new Set(); for (const v of Object.values(st.일 || {})) for (const r of v.자 || []) if (r.n) s.add(r.n); return [...s].slice(0, 40) }, [st.일])

  const 전날 = () => {
    for (let k = 1; k <= 14; k++) {
      const pd = 날더하기(d, -k)
      if (적음((st.일 || {})[pd])) {
        const o = 그날(st, pd)
        바꿈((x) => ({ ...x, wk: o.wk.map((r) => ({ ...r })), 인: o.인.map((r) => ({ ...r })), 장: o.장.map((r) => ({ ...r })), nt: x.nt, nx: x.nx || '' }))
        set알림(`↺ ${점날(pd)} 의 작업 내용 · 인원 · 장비를 가져왔습니다 — 오늘에 맞게 고쳐 쓰십시오(자재 · 날씨 · 특기사항은 안 가져옴).`)
        return
      }
    }
    set알림('지난 14일 안에 적은 작업일보가 없습니다.')
  }
  const 노무가져오기 = () => {
    if (!노무 || !노무.인.length) return
    바꿈((o) => ({ ...o, 인: 노무.인.map((r) => ({ ...r })) }))
    if (!st.현장.name && 노무.현장) 현장칸('name', 노무.현장)
    if (!st.현장.co && 노무.회사) 현장칸('co', 노무.회사)
    set알림(`👷 노무비 계산기의 ${점날(d)} 출역 ${노무.인.reduce((s, r) => s + 수(r.n), 0)}명을 직종별로 가져왔습니다.`)
  }

  const [인쇄중, 인쇄] = use인쇄(`작업일보_${d}${st.현장.name ? '_' + st.현장.name : ''}`)
  const 현장 = { name: st.현장.name, co: st.현장.co }
  const 종이 = <일보종이 현장={현장} d={d} 폼={{ ...싸기(폼), pp: 계획표시 ?? '', ap: 실시표시 ?? '' }} 셈={S} 대비={대비} 제목="작 업 일 보" 공정={공} />

  const 엑셀 = async (달로) => {
    const { 값엑셀받기, 수칸, 소수칸 } = await import('../lib/값엑셀.js')
    const 하루 = (ds) => {
      const o = 싸기(그날(st, ds)); const x = 셈(st, ds); const g = 공정셈(st, ds)
      const 계 = g.있음 && g.계획 !== null ? g.계획 : o.pp, 실 = g.있음 ? g.실시 : o.ap
      const 기온 = (o.lo !== '' || o.hi !== '') ? `${o.lo ?? ''} ~ ${o.hi ?? ''} ℃` : ''
      const rows = [['현장명', st.현장.name], ['일자', `${점날(ds)} (${요일(ds)})`], ['날씨', [o.w, 기온].filter(Boolean).join('  ')], ['공정률', `계획 ${계 === '' || 계 === undefined ? '—' : 계}% · 실시 ${실 === '' || 실 === undefined ? '—' : 실}%${g.있음 ? ' (보할 기준)' : ''}`], [],
        ...(g.있음 ? [['공정 현황(보할)', '공종', '보할(%)', '전일까지 · 금일 · 누계(%)', '공정률(%)'], ...g.줄.map((r) => ['', r.이름, 소수칸(r.보할), `${r.전.toFixed(1)} · ${r.금 ? r.금.toFixed(1) : '0'} · ${r.누.toFixed(1)}${r.계획 !== null ? ` (계획 ${r.계획.toFixed(1)})` : ''}`, 소수칸(r.기여)]), ['', '합계', 소수칸(100), `${g.전일} · ${g.금일} · ${g.실시}`, 소수칸(g.실시)], []] : []),
        ['1. 작업 내용', '공종', '업체', '작업 내용', '인원'], ...o.wk.map((r) => ['', r.g, r.v, r.t, r.n ? 수칸(수(r.n)) : '']), [],
        ['2. 출역 인원(명)', '직종', '전일까지', '금일', '누계'], ...x.인원.map((r) => ['', r.이름, 수칸(r.전), 수칸(r.금), 수칸(r.누)]), ['', '합계', 수칸(x.인원합.전), 수칸(x.인원합.금), 수칸(x.인원합.누)], [],
        ['3. 장비', '장비', '단위', '금일', '누계'], ...x.장비.map((r) => ['', r.이름, r.단위, 소수칸(r.금), 소수칸(r.누)]), [],
        ['4. 자재 반입', '품명', '규격 · 단위', '금일', '누계'], ...x.자재.map((r) => ['', r.이름, [r.규격, r.단위].filter(Boolean).join(' · '), 소수칸(r.금), 소수칸(r.누)]), [],
        ['5. 특기사항', o.nt || ''], ['6. 내일 작업 계획', o.nx || '']]
      return { name: `${ds.slice(5)} 일보`, head: ['구분', '내용', '', '', ''], rows, widths: [16, 22, 16, 44, 10] }
    }
    if (!달로) { 값엑셀받기(`작업일보_${d}_${st.현장.name || '현장'}`, [하루(d)], { 주소: '/tools/ilbo' }); return }
    const 날들 = 적은날
    if (!날들.length) { set알림(`${ym} 에 적은 작업일보가 없습니다.`); return }
    const 요약 = 날들.map((ds) => { const o = 싸기(그날(st, ds)); const x = 셈(st, ds); const g = 공정셈(st, ds); return [ds, 요일(ds), o.w || '', o.lo !== '' || o.hi !== '' ? `${o.lo ?? ''}~${o.hi ?? ''}` : '', g.있음 && g.계획 !== null ? 소수칸(g.계획) : (o.pp || ''), g.있음 ? 소수칸(g.실시) : (o.ap || ''), 수칸(x.인원합.금), o.wk.map((r) => [r.g, r.t].filter(Boolean).join(' ')).join(' / '), o.nt || ''] })
    const 직 = new Map()
    for (const ds of 날들) for (const r of 싸기(그날(st, ds)).인) 직.set(r.j, (직.get(r.j) || 0) + 수(r.n))
    값엑셀받기(`작업일보_${ym}_${st.현장.name || '현장'}`, [
      { name: `${ym} 요약`, head: ['일자', '요일', '날씨', '기온(℃)', '계획(%)', '실시(%)', '인원(명)', '작업 내용', '특기사항'], rows: 요약, widths: [11, 5, 7, 9, 8, 8, 8, 50, 40] },
      { name: '직종별 인원', head: ['직종', `${ym} 연인원(명)`], rows: [...직.entries()].sort((a, b) => b[1] - a[1]).map(([j, n]) => [j, 수칸(n)]), widths: [16, 16] },
      ...날들.slice(0, 31).map(하루),
    ], { 주소: '/tools/ilbo' })
  }

  return (
    <div className="wrap gj ib">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📝 작업일보 만들기 — 인원 · 장비 · 자재 누계 저절로</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          날마다 <b>날씨 · 작업 내용 · 금일 인원 · 장비 · 자재</b>만 적으면 <b>전일까지 · 누계</b>가 저절로 셈되어 A4 한 장 작업일보(공사일보)로 나옵니다.
          같은 브라우저의 <Link to="/tools/nomubi">노무비 계산기</Link> 출역을 직종별 인원으로 가져오고, <Link to="/tools/schedule">예정공정표</Link>가 있으면 계획 공정률도 가져옵니다.
        </p>
        <div className="nm-badges">
          <span>회원가입 · 현장 등록 없음 · 무료</span>
          <span>💾 이 브라우저에 저장 · 🔗 코드로 폰·PC 이어 쓰기 {저장됨 ? '' : <b className="nm-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
          <span>🏗 여럿이 같이 적고 청구서까지 → <Link to="/tools/tuipbi">현장 투입비</Link></span>
        </div>
        <이어쓰기 ns="ib" 이름="작업일보" 파일="작업일보" st={st} setSt={setSt} 읽기={읽기} 쓰기={쓰기} />
        <div className="gj-form">
          <label>현장명<input className="inp" value={st.현장.name} maxLength={60} onChange={(e) => 현장칸('name', e.target.value)} placeholder="예: ○○지구 배수로 정비공사" /></label>
          <label>회사<input className="inp" value={st.현장.co} maxLength={40} onChange={(e) => 현장칸('co', e.target.value)} /></label>
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {Object.keys(st.일 || {}).length === 0 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { const e = 예시(); setSt(e); setD(Object.keys(e.일).sort().pop()); set알림('예시를 채웠습니다 — 지어낸 현장의 사흘치입니다.') }}>🧪 예시로 해 보기</button>}
          {Object.keys(st.일 || {}).length > 0 && (묻기 === 'all'
            ? <><button type="button" className="btn line sm nm-warn" style={{ width: 'auto' }} onClick={() => { setSt(빈것()); setD(오늘()); set묻기(false); set알림('모두 비웠습니다.') }}>정말 모두 비우기 (적은 날 모두)</button><button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기(false)}>그대로</button></>
            : <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('all')}>🗑 모두 비우기</button>)}
        </div>
      </div>

      <div className="card tp-daybar">
        <button type="button" className="chip" onClick={() => setD(날더하기(d, -1))} aria-label="전날">◀</button>
        <input type="date" value={d} onChange={(e) => e.target.value && setD(e.target.value)} />
        <b className="tp-dow">({요일(d)})</b>
        <button type="button" className="chip" onClick={() => setD(날더하기(d, 1))} aria-label="다음날">▶</button>
        {d !== 오늘() && <button type="button" className="chip" onClick={() => setD(오늘())}>오늘로</button>}
        <span className="muted" style={{ fontSize: 12.5 }}>{적음((st.일 || {})[d]) ? '✅ 이 날 적은 것이 있습니다' : '이 날은 아직 안 적었습니다'} · 적는 순간 저장</span>
        {적은날.length > 0 && <div className="ib-days">{ym.slice(5)}월 적은 날: {적은날.map((x) => <button key={x} type="button" className={'chip' + (x === d ? ' on' : '')} onClick={() => setD(x)}>{+x.slice(8)}</button>)}</div>}
      </div>

      <div className="card il-form">
        <div className="detail-h">📝 {점날(d)} ({요일(d)}) 작업일보</div>
        <div className="il-row">
          <span className="il-lab">날씨</span>
          <div className="il-chips">{날씨들.map((w) => <button key={w} type="button" className={'chip' + (폼.w === w ? ' on' : '')} onClick={() => 바꿈((o) => ({ ...o, w: o.w === w ? '' : w }))}>{w}</button>)}</div>
        </div>
        <div className="il-row">
          <span className="il-lab">기온(℃)</span>
          <label className="il-n">최저 <input inputMode="decimal" value={폼.lo} onChange={칸('lo')} placeholder="12" /></label>
          <label className="il-n">최고 <input inputMode="decimal" value={폼.hi} onChange={칸('hi')} placeholder="24" /></label>
          <a className="lnk" href="https://www.weather.go.kr/w/index.do" target="_blank" rel="noopener noreferrer">☁️ 기상청</a>
        </div>
        <div className="il-row">
          <span className="il-lab">공정률(%)</span>
          {공.있음 && 공.계획 !== null
            ? <span className="ib-auto">계획 <b>{공.계획.toFixed(2)}</b><em>보할 · 일정</em></span>
            : <label className="il-n">계획 <input inputMode="decimal" value={폼.pp} onChange={칸('pp')} placeholder="0.00" /></label>}
          {공.있음
            ? <span className="ib-auto">실시 <b>{공.실시.toFixed(2)}</b><em>보할로 저절로</em></span>
            : <label className="il-n">실시 <input inputMode="decimal" value={폼.ap} onChange={칸('ap')} placeholder="0.00" /></label>}
          {대비 !== null && <span className={'il-diff' + (대비 < 0 ? ' bad' : '')}>대비 {(대비 > 0 ? '+' : '') + 수글(대비)}%p</span>}
          {!(공.있음 && 공.계획 !== null) && (계획값 !== null
            ? <button type="button" className="chip" onClick={() => 바꿈((o) => ({ ...o, pp: 수글(계획값 * 100) }))}>📈 공정표에서 계획 {수글(계획값 * 100)}%</button>
            : <Link className="chip" to="/tools/schedule">📈 예정공정표 만들기 → 계획이 저절로</Link>)}
        </div>

        <div className="il-sub">📊 공정 — 보할 기준 {공.있음 && <span className="muted" style={{ fontWeight: 600, fontSize: 12.5 }}>— 금일 {공.금일.toFixed(2)}%p · 누계 {공.실시.toFixed(2)}%</span>}</div>
        {공.있음 ? (
          <div className="tp-scroll">
            <table className="tbl ib-gj">
              <thead><tr><th>공종</th><th>보할(%)</th>{공.계획 !== null && <th className="gj-d">계획(%)</th>}<th className="gj-d">전일까지(%)</th><th>금일</th><th>누계(%)</th><th>공정률(%)</th></tr></thead>
              <tbody>
                {공.줄.map((x) => (
                  <tr key={x.id}>
                    <td>{x.이름}{x.설계 > 0 && <div className="gj-small">설계 {x.설계.toLocaleString('ko-KR')}{x.단위} · 누계 {x.누값.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}{x.단위}</div>}</td>
                    <td className="r">{x.보할.toFixed(2)}</td>{공.계획 !== null && <td className="r gj-d">{x.계획 !== null ? x.계획.toFixed(1) : ''}</td>}
                    <td className="r gj-d">{x.전.toFixed(1)}</td>
                    <td><span className="ib-jin"><input inputMode="decimal" value={(폼.진 || {})[x.id] ?? ''} onChange={(e) => 진칸(x.id, e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" aria-label={`${x.이름} 금일`} /><em>{x.설계 > 0 ? x.단위 || '수량' : '%p'}</em></span></td>
                    <td className="r"><b>{x.누.toFixed(1)}</b></td><td className="r">{x.기여.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="sum"><td>합계</td><td className="r">100.00</td>{공.계획 !== null && <td className="r gj-d">{공.계획.toFixed(2)}</td>}<td className="r gj-d">{공.전일.toFixed(2)}</td><td className="r">{공.금일.toFixed(2)}</td><td className="r"><b>{공.실시.toFixed(2)}</b></td><td className="r"><b>{공.실시.toFixed(2)}</b></td></tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 12.5 }}>공종과 보할(또는 공종 금액)을 정해 두면, 날마다 공종의 <b>금일 진척</b>만 적어도 실시 공정률이 <b>보할로 저절로</b> 셈됩니다.</div>
        )}
        <div className="tp-start">
          <button type="button" className={'chip' + (공종열림 ? ' on' : '')} onClick={() => set공종열림((x) => !x)}>⚙ 공종 · 보할 {(st.공종 || []).length ? '고치기' : '정하기'}</button>
          {표공종 && (!(st.공종 || []).length
            ? <button type="button" className="chip" onClick={표가져오기}>📈 예정공정표에서 가져오기 ({표공종.length}공종)</button>
            : 바꿀묻기
              ? <><button type="button" className="chip nm-warn" onClick={표가져오기}>정말 바꾸기 (지금 공종을 예정공정표 것으로)</button><button type="button" className="chip" onClick={() => set바꿀묻기(false)}>그대로</button></>
              : <button type="button" className="chip" onClick={() => set바꿀묻기(true)}>📈 예정공정표 것으로 바꾸기</button>)}
        </div>
        {공종열림 && (
          <div className="ib-gset">
            <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>
              <b>보할</b> = 공종 금액 ÷ 금액 합계(금액을 하나라도 적으면 금액으로) · 금액이 없으면 적은 보할(%)을 합 100 으로 맞춥니다.
              설계수량을 적은 공종은 날마다 <b>금일 수량</b>으로, 안 적은 공종은 <b>금일 진척(%p)</b>으로 적습니다. «쓰기 전 누계» 는 이 작업일보를 쓰기 전까지 해 둔 진척입니다.
              시작 · 기간을 적으면 그 기간에 고르게 하는 것으로 보고 <b>계획 공정률</b>을 셉니다.
            </div>
            <div className="tp-scroll">
              <table className="tbl gj-rows ib-gset-t">
                <thead><tr><th>공종</th><th>금액(원)</th><th>보할(%)</th><th>설계수량</th><th>단위</th><th>쓰기 전 누계</th><th>시작</th><th>기간(일)</th><th>→ 보할</th><th /></tr></thead>
                <tbody>
                  {(st.공종 || []).map((g) => {
                    const z = 보.줄.find((y) => y.id === g.id)
                    return (
                      <tr key={g.id}>
                        <td><input className="inp gj-in" value={g.n} maxLength={40} onChange={(e) => 공종칸(g.id, 'n', e.target.value)} placeholder="예: 토공" aria-label="공종" /></td>
                        <td><input className="inp gj-in gj-num" inputMode="numeric" value={g.amt ? Number(String(g.amt).replace(/[^0-9]/g, '')).toLocaleString('ko-KR') : ''} onChange={(e) => 공종칸(g.id, 'amt', e.target.value.replace(/[^0-9]/g, ''))} aria-label="금액" /></td>
                        <td><input className="inp gj-in gj-num ib-s" inputMode="decimal" value={g.w} onChange={(e) => 공종칸(g.id, 'w', e.target.value.replace(/[^0-9.]/g, ''))} aria-label="보할" disabled={보.기준 === '금액'} /></td>
                        <td><input className="inp gj-in gj-num ib-s" inputMode="decimal" value={g.q} onChange={(e) => 공종칸(g.id, 'q', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="선택" aria-label="설계수량" /></td>
                        <td><input className="inp gj-in ib-u2" value={g.u} maxLength={6} onChange={(e) => 공종칸(g.id, 'u', e.target.value)} placeholder="m" aria-label="단위" /></td>
                        <td><input className="inp gj-in gj-num ib-s" inputMode="decimal" value={g.b || ''} onChange={(e) => 공종칸(g.id, 'b', e.target.value.replace(/[^0-9.]/g, ''))} placeholder={수(g.q) > 0 ? '수량' : '%'} aria-label="쓰기 전 누계" /></td>
                        <td><input className="inp gj-in" type="date" value={g.s || ''} onChange={(e) => 공종칸(g.id, 's', e.target.value)} aria-label="시작" /></td>
                        <td><input className="inp gj-in gj-num ib-s" inputMode="numeric" value={g.dur || ''} onChange={(e) => 공종칸(g.id, 'dur', e.target.value.replace(/[^0-9]/g, ''))} aria-label="기간" /></td>
                        <td className="r nw"><b>{z ? z.보할.toFixed(2) : ''}</b></td>
                        <td><button type="button" className="gp-x" title="이 공종 지우기" onClick={() => 공종빼(g.id)}>✕</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="tp-start">
              <button type="button" className="chip" onClick={공종더}>＋ 공종</button>
              {보.기준 && <span className="muted" style={{ fontSize: 12.5 }}>{보.기준 === '금액' ? `금액 합계 ${보.금합.toLocaleString('ko-KR')}원으로 보할을 셉니다` : `적은 보할 합 ${Math.round(보.율합 * 100) / 100}% → 100 으로 맞춤`}</span>}
            </div>
          </div>
        )}

        <div className="il-sub">1. 작업 내용 (공종별)</div>
        <datalist id="ib-g">{공종들.map((g) => <option key={g} value={g} />)}</datalist>
        <div className="il-wk">
          {폼.wk.map((r, i) => (
            <div key={i} className="il-wkrow">
              <input className="g" list="ib-g" value={r.g} onChange={(e) => 줄('wk', i, 'g', e.target.value)} placeholder="공종 (예: 토공)" maxLength={40} />
              <input className="v" value={r.v} onChange={(e) => 줄('wk', i, 'v', e.target.value)} placeholder="업체" maxLength={40} />
              <input className="t" value={r.t} onChange={(e) => 줄('wk', i, 't', e.target.value)} placeholder="작업 내용 (예: 2구간 터파기)" maxLength={300} />
              <input className="n" inputMode="numeric" value={r.n} onChange={(e) => 줄('wk', i, 'n', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="인원" maxLength={6} />
              <button type="button" className="gp-x" title="이 줄 지우기" onClick={() => 줄빼('wk', i)}>✕</button>
            </div>
          ))}
        </div>
        <div className="tp-start">
          <button type="button" className="chip" onClick={() => 줄더('wk', { g: '', v: '', t: '', n: '' })}>＋ 작업 줄</button>
          <button type="button" className="chip" onClick={전날}>↺ 전날 내용 가져오기</button>
        </div>

        <div className="il-sub">2. 출역 인원 — 금일 (명)</div>
        <datalist id="ib-j">{직종들.map((g) => <option key={g} value={g} />)}</datalist>
        <div className="ib-rows">
          {폼.인.map((r, i) => (
            <div key={i} className="ib-row">
              <input list="ib-j" value={r.j} onChange={(e) => 줄('인', i, 'j', e.target.value)} placeholder="직종 (예: 보통인부)" maxLength={30} />
              <input className="ib-n" inputMode="numeric" value={r.n} onChange={(e) => 줄('인', i, 'n', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="명" maxLength={5} />
              <button type="button" className="gp-x" title="이 줄 지우기" onClick={() => 줄빼('인', i)}>✕</button>
            </div>
          ))}
        </div>
        <div className="tp-start">
          <button type="button" className="chip" onClick={() => 줄더('인', { j: '', n: '' })}>＋ 직종</button>
          {노무 && 노무.인.length > 0 && <button type="button" className="chip on" onClick={노무가져오기}>👷 노무비 계산기에서 가져오기 ({노무.인.reduce((s, r) => s + 수(r.n), 0)}명)</button>}
          {노무 && 노무.인.length === 0 && <span className="muted" style={{ fontSize: 12 }}>노무비 계산기에 이 날 출역이 없습니다</span>}
        </div>

        <div className="il-sub">3. 장비 — 금일</div>
        <datalist id="ib-e">{장비들.map((g) => <option key={g} value={g} />)}</datalist>
        <div className="ib-rows">
          {폼.장.map((r, i) => (
            <div key={i} className="ib-row">
              <input list="ib-e" value={r.n} onChange={(e) => 줄('장', i, 'n', e.target.value)} placeholder="장비 (예: 굴착기 0.6㎥)" maxLength={40} />
              <select value={r.u || '대'} onChange={(e) => 줄('장', i, 'u', e.target.value)} aria-label="단위">{장비단위.map((u) => <option key={u}>{u}</option>)}</select>
              <input className="ib-n" inputMode="decimal" value={r.q} onChange={(e) => 줄('장', i, 'q', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="수" maxLength={6} />
              <button type="button" className="gp-x" title="이 줄 지우기" onClick={() => 줄빼('장', i)}>✕</button>
            </div>
          ))}
        </div>
        <div className="tp-start"><button type="button" className="chip" onClick={() => 줄더('장', { n: '', u: '대', q: '' })}>＋ 장비</button></div>

        <div className="il-sub">4. 자재 반입 — 금일</div>
        <datalist id="ib-m">{자재들.map((g) => <option key={g} value={g} />)}</datalist>
        <div className="ib-rows">
          {폼.자.map((r, i) => (
            <div key={i} className="ib-row ib-row4">
              <input list="ib-m" value={r.n} onChange={(e) => 줄('자', i, 'n', e.target.value)} placeholder="품명 (예: 레미콘)" maxLength={40} />
              <input value={r.s} onChange={(e) => 줄('자', i, 's', e.target.value)} placeholder="규격" maxLength={30} />
              <input className="ib-u" value={r.u} onChange={(e) => 줄('자', i, 'u', e.target.value)} placeholder="단위" maxLength={6} />
              <input className="ib-n" inputMode="decimal" value={r.q} onChange={(e) => 줄('자', i, 'q', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="수량" maxLength={8} />
              <button type="button" className="gp-x" title="이 줄 지우기" onClick={() => 줄빼('자', i)}>✕</button>
            </div>
          ))}
        </div>
        <div className="tp-start"><button type="button" className="chip" onClick={() => 줄더('자', { n: '', s: '', u: '', q: '' })}>＋ 자재</button></div>

        <div className="il-sub">5. 특기사항 (안전 · 지시 · 검측 · 민원 등)</div>
        <textarea className="il-ta" rows={3} value={폼.nt} onChange={칸('nt')} maxLength={2000} placeholder="예: 08:00 TBM — 굴착부 추락 주의. 오후 철근 배근 검측(감독관 입회)." />
        <div className="il-sub">6. 내일 작업 계획</div>
        <textarea className="il-ta" rows={2} value={폼.nx} onChange={칸('nx')} maxLength={1000} placeholder="예: 1구간 측구 콘크리트 타설(펌프카 1대)" />
        {알림 && <div className="note sm" role="status" style={{ marginTop: 8 }}>{알림}</div>}
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 }}>
          <button type="button" className="btn" style={{ width: 'auto' }} onClick={인쇄}>🖨 이 날 작업일보 인쇄 (A4)</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 엑셀(false)}>📗 이 날 엑셀(값만)</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 엑셀(true)}>📗 {+ym.slice(5)}월 모아 엑셀(값만)</button>
          {적음((st.일 || {})[d]) && (묻기 === 'day'
            ? <><button type="button" className="btn line sm nm-warn" style={{ width: 'auto' }} onClick={() => { setSt((s) => { const 일 = { ...s.일 }; delete 일[d]; return { ...s, 일 } }); set묻기(false); set알림('이 날 것을 지웠습니다.') }}>정말 이 날 지우기</button><button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기(false)}>그대로</button></>
            : <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('day')}>🗑 이 날 지우기</button>)}
        </div>
      </div>

      <div className="card il-paperwrap">{종이}</div>
      <div className="card">
        <p className="cp" style={{ margin: 0, fontSize: 13 }}>
          엑셀 빈 서식은 <Link to="/forms/jakeop-ilbo">작업일보</Link> · <Link to="/forms/chulyeok-ilbo">출역일보</Link> · <Link to="/forms/janggi-gadong">장비 가동일보</Link>입니다.
          사진은 <Link to="/tools/photo">사진대지</Link>, 출역 노무비 · 4대보험 공제는 <Link to="/tools/nomubi">노무비 계산기</Link>로.
        </p>
      </div>
      <도구설명 k="ilbo" />
      {인쇄중 && createPortal(<div id="gp-인쇄"><div className="il-쪽">{종이}</div></div>, document.body)}
    </div>
  )
}
