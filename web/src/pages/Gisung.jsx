/**
 * /change/gisung — 📆 기성 내역서 (G296 — 2026-10-16)
 *
 * 소장님: 「이거 만들자」 · 「우린 다르게 설계 해야 해 … 더 편하지만 정확성도 좋고… 도구로써 유용하게」 · 「공정률이 들어가고 사이트에 있는 거」
 *   · 「수식이 있으면 다운 받으면 사이트가 필요 없잖아」 → 엑셀은 «보고서»(이번 회 줄 금액 · 합만 식 · 원가 · 부분기성은 값) · 다음 회는 사이트에서
 *   · 「주소는 지울 수 있게」 → 엑셀 맨 아래 보통 칸 한 줄 · 「계속 찾게 만들어야 해」 → 기성 장부(이 브라우저) · 다음 회 1분
 * ■ 흐름: ① 계약 내역서(또는 지난 기성 파일) 넣기 → ② 회차 · 기성일 · 선금 → ③ 공종마다 누계 % (줄은 펼쳐서 수량) · 📈 예정공정표대로 채우기
 *         → ④ 🎯 한눈에(계약 · 전회 · 금회 · 누계 · 잔여 · 공정률 · 선금 공제 · 지급) → ⑤ 엑셀(원본 + 기성 시트) · 장부
 * ■ 셈 · 시트: lib/기성.js (시험 tools/시험_기성.mjs) · 파일은 이 브라우저 안에서만 — 서버로 올라가지 않습니다.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { askAfter } from '../AskComment'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 세기 } from '../lib/받은수.jsx'
import { 내역맡기기, 내역꺼내기 } from '../lib/내역한벌.js'
import { 현장나눔 } from '../lib/현장나눔.js'

const 원 = (n) => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '—')
const 퍼 = (v, d = 1) => (typeof v === 'number' && Number.isFinite(v) ? (v * 100).toFixed(d) + '%' : '—')
const 수글 = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 4 }))
const 꼴맞음 = /\.(xlsx|xlsm|xls)$/i
const 편집열쇠 = 'kcm.gisung.edit.v1'
const 장부열쇠 = 'kcm.gisung.book.v1'
const 오늘 = () => { const d = new Date(Date.now() + 9 * 3600e3); return d.toISOString().slice(0, 10) }
const 읽기 = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {} } catch { return {} } }
const 쓰기 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 가득 참 · 사생활 보호 */ } }
/* 🏗 공사서류 원클릭(/tools/wonclick)의 지금 현장 — 공사 정보를 한 번에 가져옴 */
const 원클릭읽기 = () => {
  try {
    const 나 = 현장나눔('wc')
    const v = JSON.parse(localStorage.getItem(나.열쇠('kcm.wonclick.v1', 나.지금())) || 'null')
    return v && (v.공사명 || v.상호) ? v : null
  } catch { return null }
}
const 정보칸 = [['공사명', '공 사 명'], ['계약번호', '계약번호'], ['발주기관', '발주기관'], ['받는사람', '받는 사람(귀하 앞)'], ['착공일', '착공일'], ['준공기한', '준공기한'],
  ['상호', '상    호'], ['대표자', '대 표 자'], ['대리인', '현장대리인'], ['은행', '은 행 명'], ['예금주', '예 금 주'], ['계좌', '계좌번호']]
const 공정표읽기 = () => { try { const m = JSON.parse(localStorage.getItem('kcm.calc.schedule') || 'null'); return m && Array.isArray(m.공종) && m.착공 ? m : null } catch { return null } }

export default function Gisung() {
  const 이동 = useNavigate()
  const [lib, setLib] = useState(null)
  const [파일, set파일] = useState(null)          /* {이름, 크기, 바이트, 책} */
  const [고를, set고를] = useState(null)          /* 내역 시트 이름들 · null = 저절로 */
  const [편집, set편집원] = useState(null)
  const [펼침, set펼침] = useState(() => new Set())
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [받음, set받음] = useState(null)
  const [장부, set장부] = useState(() => 읽기(장부열쇠))
  const [정보열림, set정보열림] = useState(false)
  const 칸 = useRef(null)
  useEffect(() => { 세기('|기성|열기') }, [])

  const 싣기 = async () => {
    if (lib) return lib
    const [q, k, g] = await Promise.all([import('../lib/qtoxlsx.js'), import('../lib/기성.js'), import('../lib/공정.js')])
    const m = { readWorkbook: q.readWorkbook, ...k, 공정: g }
    setLib(m)
    return m
  }

  const 읽은 = useMemo(() => {
    if (!lib || !파일) return null
    try { return lib.기성읽기(파일.책, 파일.이름, 고를) } catch (e) { return { 오류: e?.message || '읽지 못했습니다.' } }
  }, [lib, 파일, 고를])
  const 지문 = 읽은 && !읽은.오류 ? 읽은.원읽은.지문.split('|').slice(1).join('|') : ''

  /* 파일(지문 · 회차)마다 적은 것을 되살림 */
  useEffect(() => {
    if (!읽은 || 읽은.오류 || !lib) return
    const 새 = lib.새기성(읽은)
    const 남은 = 읽기(편집열쇠)[지문 + '#' + 새.회차]
    set편집원(남은 ? { ...새, ...남은, 회차: 새.회차 } : { ...새, 날짜: 오늘() })
    set받음(null)
  }, [읽은, lib])   // eslint-disable-line react-hooks/exhaustive-deps

  const set편집 = (f) => {
    set편집원((old) => {
      const 새 = typeof f === 'function' ? f(old) : f
      if (지문) { const 모두 = 읽기(편집열쇠); 모두[지문 + '#' + 새.회차] = { ...새, 계획: null, _at: Date.now() }; const ks = Object.keys(모두).sort((a, b) => (모두[b]._at || 0) - (모두[a]._at || 0)); for (const k of ks.slice(8)) delete 모두[k]; 쓰기(편집열쇠, 모두) }
      return 새
    })
    set받음(null)
  }

  /* 🧾 설계변경에서 넘겨 온 내역서(다시 올리지 않게 · G296) */
  useEffect(() => {
    const f = 내역꺼내기()
    if (f) 열기([{ name: f.이름, size: f.크기, arrayBuffer: async () => f.바이트 }])
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  const 열기 = async (fs) => {
    const f = [...(fs || [])].find((x) => 꼴맞음.test(x.name))
    if (!f) { set오류('엑셀 파일(.xlsx · .xls)만 됩니다.'); return }
    set오류(''); set받음(null); set바쁨('내역서를 읽는 중입니다…')
    await new Promise((r) => setTimeout(r, 30))
    try {
      const m = await 싣기()
      const 바이트 = new Uint8Array(await f.arrayBuffer())
      const 책 = m.readWorkbook(바이트)
      set고를(null); set펼침(new Set())
      set파일({ 이름: f.name, 크기: f.size, 바이트, 책 })
      세기('|기성|파일')
    } catch (e) {
      set오류(`${f.name} — ${e?.message || '읽지 못했습니다.'}`)
    } finally { set바쁨('') }
  }

  /* 예정공정표(이 브라우저) — 기성일의 계획 공정률 */
  const 공정표 = useMemo(() => 공정표읽기(), [파일])  // eslint-disable-line react-hooks/exhaustive-deps
  const 계획 = useMemo(() => {
    if (!lib || !공정표 || !편집 || !편집.날짜 || !읽은 || 읽은.오류) return null
    try { return lib.예정공정률(공정표, 편집.날짜, 읽은.공종들, lib.공정) } catch { return null }
  }, [lib, 공정표, 편집, 읽은])
  const 결과 = useMemo(() => {
    if (!lib || !읽은 || 읽은.오류 || !편집) return null
    try { return lib.기성셈(읽은, { ...편집, 계획: 계획 ? 계획.전체 : null }) } catch (e) { return { 오류: e?.message || '셈하다 멈췄습니다.' } }
  }, [lib, 읽은, 편집, 계획])
  const 공정표채우기 = () => {
    if (!계획) return
    set편집((e) => ({ ...e, 공종률: { ...계획.공종 }, 전체: 계획.맞은 ? e.전체 : Math.round((계획.전체 || 0) * 10000) / 100 }))
    세기('|기성|공정표채움')
  }

  /* 공종 표 — 깊이 · 바로 아래 품목 */
  const 기준 = 읽은 && !읽은.오류 ? (읽은.원읽은.모형.갈래.includes('합계') ? '합계' : 읽은.원읽은.모형.갈래[0]) : '합계'
  const 바로아래 = useMemo(() => {
    const m = new Map()
    if (!읽은 || 읽은.오류) return m
    const 줄 = 읽은.원읽은.모형.줄
    const 쌓 = []
    줄.forEach((x, i) => {
      if (x.꼴 === '공종') { while (쌓.length && 쌓[쌓.length - 1].깊이 >= (x.깊이 || 0)) 쌓.pop(); 쌓.push({ i, 깊이: x.깊이 || 0 }); m.set(i, []); return }
      if (x.꼴 === '품목' && 쌓.length) m.get(쌓[쌓.length - 1].i).push(i)
    })
    return m
  }, [읽은])
  const 결줄 = useMemo(() => new Map(결과 && !결과.오류 ? 결과.줄.map((r) => [r.i, r]) : []), [결과])
  const 펼치기 = (i) => set펼침((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })

  const 받기 = async () => {
    if (!결과 || 결과.오류) return
    set바쁨('엑셀을 만드는 중입니다…')
    await new Promise((r) => setTimeout(r, 30))
    try {
      const 날 = 오늘()
      const r = await lib.기성엑셀(파일.바이트, 읽은, 결과, { ...편집, 계획: 계획 ? 계획.전체 : null }, 날)
      const 이름 = 파일.이름.replace(/(_기성\d+회)?\.(xlsx|xlsm|xls)$/i, '') + `_기성${편집.회차}회.xlsx`
      const url = URL.createObjectURL(new Blob([r.바이트], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a'); a.href = url; a.download = 이름; document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      set받음({ 이름, 시트: r.시트이름들, 붙임: r.붙임 })
      /* 기성 장부(이 브라우저) */
      const 요 = 결과.요약
      const 책 = 읽기(장부열쇠)
      const 이 = 책[지문] || { 이름: 파일.이름.replace(/(_기성\d+회)?\.(xlsx|xlsm|xls)$/i, ''), 회차들: [] }
      이.회차들 = [...이.회차들.filter((x) => x.회차 !== 편집.회차), { 회차: 편집.회차, 날짜: 편집.날짜 || 날, 금회: 요.금회, 누계: 요.누계, 계약: 요.계약, 공정률: 요.공정률, 계획: 요.계획률, at: Date.now() }].sort((a, b) => a.회차 - b.회차)
      책[지문] = 이
      쓰기(장부열쇠, 책); set장부(책)
      세기('|기성|받기'); if (읽은.지난) 세기('|기성|이어가기')
      askAfter('change')
    } catch (e) { set오류('엑셀을 만들지 못했습니다 — ' + (e?.message || '')) } finally { set바쁨('') }
  }

  /* 📄 한글(.hwpx) — 기성검사원 · 기성대가 청구서 · 공사부분기성내역서 · 공사기성부분 원가계산서 (G296) */
  const 한글받기 = async () => {
    if (!결과 || 결과.오류) return
    set바쁨('한글 문서를 만드는 중입니다…')
    await new Promise((r) => setTimeout(r, 30))
    try {
      const h = await import('../lib/시트한글.js')
      const 바 = h.시트들한글(lib.기성한글시트들(읽은, 결과, { ...편집, 계획: 계획 ? 계획.전체 : null }), { 제목: `기성 ${편집.회차}회 서류` })
      const 이름 = 파일.이름.replace(/(_기성\d+회)?\.(xlsx|xlsm|xls)$/i, '') + `_기성${편집.회차}회.hwpx`
      const url = URL.createObjectURL(new Blob([바], { type: 'application/hwp+zip' }))
      const a = document.createElement('a'); a.href = url; a.download = 이름; document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      세기('|기성|한글받기')
    } catch (e) { set오류('한글 문서를 만들지 못했습니다 — ' + (e?.message || '')) } finally { set바쁨('') }
  }

  const 요 = 결과 && !결과.오류 ? 결과.요약 : null
  const 장부목록 = Object.entries(장부).sort((a, b) => Math.max(...b[1].회차들.map((x) => x.at || 0)) - Math.max(...a[1].회차들.map((x) => x.at || 0)))
  const 확인말 = 결과 && !결과.오류 ? [...읽은.말, ...결과.말].filter((m) => m.무게 === '확인') : []

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>📆 기성 내역서</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>계약 내역서</b>를 넣고 공종마다 <b>몇 %</b> 했는지만 적으면 — <b>기성내역서</b>(계약 · 전회 · 금회 · 누계 · 잔여) ·
          <b> 공사기성부분 원가계산서</b>(계약 원가계산서의 식 그대로) · <b>공사부분기성내역서</b> · 검산을 원본 시트 뒤에 붙여 드립니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          <b>다음 회는 받은 기성 파일만 다시 넣으면</b> 전회가 저절로 이어집니다. 파일은 이 브라우저 안에서만 다루고 서버로 올라가지 않습니다.
        </p>
      </div>

      {/* ── ① 내역서 ── */}
      <div className="card">
        <div className="sec-title">① 계약 내역서 넣기 <span className="count">또는 지난번 받은 기성 파일</span></div>
        <div className="tldrop" onClick={() => 칸.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 열기(e.dataTransfer?.files) }}>
          <input ref={칸} type="file" accept=".xlsx,.xlsm,.xls" hidden onChange={(e) => { 열기(e.target.files); e.target.value = '' }} />
          <끌어놓기판 글="내역서(엑셀)를 놓으면 엽니다" 길들={[{ 꼴: 꼴맞음, 받기: (fs) => 열기(fs), 여럿: false }]} />
          <b>＋ 엑셀을 끌어 놓거나 누르십시오</b>
          <span>.xlsx · .xls — 원가계산서 시트가 같이 있으면 원가 기성까지 셉니다</span>
        </div>
        {바쁨 && <div className="muted" style={{ marginTop: 8 }}>{바쁨}</div>}
        {오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {오류}</div>}
        {읽은 && 읽은.오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {읽은.오류}</div>}
        {읽은 && !읽은.오류 && (
          <div className="cw-file" style={{ marginTop: 10 }}>
            <div className="cw-fh"><b>{파일.이름}</b><span className="muted">{원(파일.크기 / 1024)} KB</span>
              <button type="button" className="btn line sm" style={{ width: 'auto', marginLeft: 'auto' }} onClick={() => { 내역맡기기(파일); 세기('|기성|설계변경으로'); 이동('/change/won') }} title="같은 내역서로 설계변경을 — 다시 올리지 않아도 됩니다">🧾 이 내역서로 설계변경 →</button>
            </div>
            {읽은.시트후보.length > 1 && (
              <div className="gs-sheets">
                <span className="muted">내역 시트</span>
                {읽은.시트후보.map((t) => (
                  <button key={t.시트} type="button" className={'chip' + (읽은.원읽은.고른들.includes(t.시트) ? ' on' : '')}
                    onClick={() => { const 지금 = 읽은.원읽은.고른들; const 새 = 지금.includes(t.시트) ? 지금.filter((n) => n !== t.시트) : [...지금, t.시트]; set고를(새.length ? 새 : null) }}>
                    {읽은.원읽은.고른들.includes(t.시트) ? '✓ ' : ''}{t.시트} <span className="gg-n">{t.품목수}줄</span>
                  </button>
                ))}
              </div>
            )}
            <div className="cw-fs muted">
              품목 <b>{원(읽은.원읽은.모형.품목수)}</b> · 공종 {원(읽은.공종들.length)} · 순공사비 <b>{원(읽은.원읽은.합)}</b>원 ·{' '}
              {읽은.원가쓸 ? <>원가계산서 «{읽은.원읽은.원가.시트}» 읽음</> : 읽은.원읽은.원가 ? <>원가계산서가 이 시트와 안 맞아 순공사비로 셉니다</> : <>원가계산서 없음 — 순공사비로 셉니다</>}
              {읽은.지난 && <><br />🔁 <b>지난 기성 {읽은.지난.회차}회</b>{읽은.지난.날짜 ? ` (${읽은.지난.날짜})` : ''}에서 이어 갑니다 — 이번은 <b>{읽은.지난.회차 + 1}회</b></>}
            </div>
          </div>
        )}
      </div>

      {읽은 && !읽은.오류 && 편집 && 결과 && !결과.오류 && (
        <>
          {/* ── ② 회차 ── */}
          <div className="card">
            <div className="sec-title">② 이번 기성</div>
            <div className="gs-row">
              <label>회차 <input className="ja-in ja-num" inputMode="numeric" value={편집.회차} onChange={(e) => set편집((x) => ({ ...x, 회차: Math.max(1, +e.target.value.replace(/[^\d]/g, '') || 1) }))} />회</label>
              <label>기성일 <input className="ja-in" type="date" value={편집.날짜 || ''} onChange={(e) => set편집((x) => ({ ...x, 날짜: e.target.value }))} /></label>
              <label>차수 <input className="ja-in" placeholder="예: 1차분" value={편집.차수} onChange={(e) => set편집((x) => ({ ...x, 차수: e.target.value }))} /></label>
              <label>선금 <input className="ja-in" inputMode="numeric" placeholder="받은 선금(없으면 비움)" value={편집.선금} onChange={(e) => set편집((x) => ({ ...x, 선금: e.target.value.replace(/[^\d,]/g, '') }))} />원</label>
            </div>
          </div>

          {/* ── 공사 정보(서류에 들어감) ── */}
          <div className="card">
            <div className="sec-title" style={{ cursor: 'pointer' }} onClick={() => set정보열림((v) => !v)}>
              {정보열림 ? '▾' : '▸'} 🏗 공사 정보 <span className="count">기성검사원 · 기성대가 청구서에 들어감 — {편집.정보 && 편집.정보.공사명 ? 편집.정보.공사명 : '비워도 됨'}</span>
            </div>
            {정보열림 && (
              <>
                {(() => { const w = 원클릭읽기(); return w ? <button type="button" className="btn line sm" style={{ width: 'auto', marginBottom: 8 }} onClick={() => { set편집((x) => ({ ...x, 정보: { ...Object.fromEntries(정보칸.map(([k]) => [k, String(w[k] ?? '')])), ...Object.fromEntries(Object.entries(x.정보 || {}).filter(([, v]) => v)) } })); 세기('|기성|원클릭가져옴') }}>🏗 공사서류 원클릭에서 가져오기 <span className="muted">({w.공사명 || w.상호})</span></button> : <p className="muted" style={{ margin: '0 0 8px', fontSize: 12.5 }}><Link to="/tools/wonclick">⚡ 공사서류 원클릭</Link>에 적어 둔 현장이 있으면 한 번에 가져옵니다.</p> })()}
                <div className="gs-info">
                  {정보칸.map(([k, 이름]) => (
                    <label key={k}><span>{이름}</span><input className="ja-in" type={/일$|기한$/.test(k) ? 'date' : 'text'} value={(편집.정보 || {})[k] || ''}
                      onChange={(e) => { const v = e.target.value; set편집((x) => ({ ...x, 정보: { ...(x.정보 || {}), [k]: v } })) }} /></label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── ③ 금회 ── */}
          <div className="card">
            <div className="sec-title">③ 얼마나 했나 <span className="count">공종마다 «누계 %» — 줄은 ▸ 를 눌러 수량으로</span></div>
            <div className="gs-row">
              <label>전체 한 번에 누계 <input className="ja-in ja-num" inputMode="decimal" value={편집.전체 ?? ''} placeholder="%" onChange={(e) => set편집((x) => ({ ...x, 전체: e.target.value === '' ? null : e.target.value.replace(/[^\d.]/g, '') }))} />%</label>
              {계획 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={공정표채우기}>📈 예정공정표대로 채우기 <span className="muted">(계획 {퍼(계획.전체)}{계획.맞은 ? ` · 공종 ${계획.맞은}개` : ''})</span></button>}
              {!공정표 && <Link className="muted" style={{ fontSize: 12.5 }} to="/tools/schedule">📈 예정공정표가 있으면 계획 공정률과 견줍니다</Link>}
              {(Object.keys(편집.공종률).length > 0 || Object.keys(편집.수량).length > 0 || 편집.전체) && <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => set편집((x) => ({ ...x, 전체: null, 공종률: {}, 수량: {} }))}>모두 지우기</button>}
            </div>
            <div className="gg-wrap"><table className="gg-r gs-t">
              <thead><tr><th>공종 · 품명</th><th className="r">계약</th><th className="r">전회까지</th><th className="r">누계 %</th><th className="r">금회</th><th className="r">누계</th><th className="r">공정률</th></tr></thead>
              <tbody>
                {읽은.공종들.map((p) => {
                  const h = 결과.모인.공종합.get(p.i)
                  const 계 = h[0][기준] || 0, 전 = h[1][기준] || 0, 금 = h[2][기준] || 0, 누 = h[3][기준] || 0
                  const 아래 = 바로아래.get(p.i) || []
                  const 열림 = 펼침.has(p.i)
                  const 넘 = p.품목들.some((j) => (결줄.get(j) || {}).넘음)
                  return [
                    <tr key={'g' + p.i} className={'gs-g d' + Math.min(p.깊이, 3) + (넘 ? ' gs-over' : '')}>
                      <td>{아래.length ? <button type="button" className="gs-tg" onClick={() => 펼치기(p.i)} aria-label={p.이름 + ' 줄 펼치기'}>{열림 ? '▾' : '▸'}</button> : <span className="gs-tg" />}
                        <span style={{ paddingLeft: Math.min(p.깊이, 4) * 12 }}>{p.번호 ? p.번호 + ' ' : ''}{p.이름}</span>{p.별도 && <span className="muted" style={{ fontSize: 11 }}> (순공사비 밖)</span>}</td>
                      <td className="r">{원(계)}</td><td className="r">{원(전)}<div className="note2">{계 ? 퍼(전 / 계) : ''}</div></td>
                      <td className="r"><input className="ja-in ja-num gs-pct" inputMode="decimal" value={편집.공종률[p.i] ?? ''} placeholder={계 ? (누 / 계 * 100).toFixed(1) : ''}
                        onChange={(e) => { const v = e.target.value.replace(/[^\d.]/g, ''); set편집((x) => { const g = { ...x.공종률 }; if (v === '') delete g[p.i]; else g[p.i] = v; return { ...x, 공종률: g } }) }} aria-label={p.이름 + ' 누계 %'} /></td>
                      <td className="r gs-now">{원(금)}</td><td className="r">{원(누)}</td><td className="r">{계 ? 퍼(누 / 계) : ''}</td>
                    </tr>,
                    ...(열림 ? 아래.map((j) => {
                      const x = 읽은.원읽은.모형.줄[j], r = 결줄.get(j)
                      if (!r) return null
                      const 고친 = Object.prototype.hasOwnProperty.call(편집.수량, r.열쇠)
                      return (
                        <tr key={'i' + j} className={'gs-i' + (r.넘음 ? ' gs-over' : '')}>
                          <td><span className="gs-tg" /><span style={{ paddingLeft: Math.min(p.깊이 + 1, 5) * 12 }}>{x.이름}{x.규격 ? <span className="muted"> · {x.규격}</span> : null}</span></td>
                          <td className="r">{수글(r.계)} <span className="muted">{x.단위}</span><div className="note2">{원(r.금액.계약.합계)}</div></td>
                          <td className="r">{수글(r.전)}<div className="note2">{원(r.금액.전회.합계)}</div></td>
                          <td className="r"><input className={'ja-in ja-num gs-q' + (고친 ? ' on' : '')} inputMode="decimal" value={고친 ? 편집.수량[r.열쇠] : ''} placeholder={수글(r.금)}
                            onChange={(e) => { const v = e.target.value.replace(/[^\d.-]/g, ''); set편집((y) => { const q = { ...y.수량 }; if (v === '') delete q[r.열쇠]; else q[r.열쇠] = v; return { ...y, 수량: q } }) }} aria-label={x.이름 + ' 금회 수량'} />
                            <div className="note2">금회 수량</div></td>
                          <td className="r gs-now">{원(r.금액.금회.합계)}</td><td className="r">{수글(r.누)}<div className="note2">{원(r.금액.누계.합계)}</div></td>
                          <td className="r">{r.계 ? 퍼(r.누 / r.계) : ''}{r.넘음 && <div className="note2" style={{ color: 'var(--bad)' }}>계약 넘음</div>}</td>
                        </tr>
                      )
                    }) : []),
                  ]
                })}
              </tbody>
            </table></div>
          </div>

          {/* ── ④ 한눈에 ── */}
          <div className="card">
            <div className="sec-title">🎯 한눈에 <span className="count">{요.무엇.replace(/\s+/g, '')} 기준</span></div>
            <div className="gg-tiles">
              <div><span>계약</span><b>{원(요.계약)}</b></div>
              <div><span>전회까지</span><b>{원(요.전회)}</b></div>
              <div className="new"><span>금회 기성</span><b>{원(요.금회)}</b> {퍼(요.금회율)}</div>
              <div className="good"><span>누계</span><b>{원(요.누계)}</b></div>
              <div><span>잔여</span><b>{원(요.잔여)}</b></div>
            </div>
            <div className="gs-sum">
              <span>실적 공정률 <b>{퍼(요.공정률, 2)}</b></span>
              {요.계획률 !== null && <span>계획(예정공정표) <b>{퍼(요.계획률, 2)}</b> <span className={요.공정률 >= 요.계획률 ? 'gs-ok' : 'gs-late'}>{요.공정률 >= 요.계획률 ? '앞섬' : '늦음'} {Math.abs((요.공정률 - 요.계획률) * 100).toFixed(1)}%p</span></span>}
              {요.선금 && <span>선금 공제 <b>{원(요.선금.금회)}</b> · 금회 지급 <b>{원(요.지급)}</b></span>}
              <span>이 중 노무비 <b>{원(요.노무비)}</b> <span className="muted">(노무비 구분 지급)</span></span>
            </div>
            {확인말.length > 0 && <div className="cwarn" style={{ marginTop: 8 }}>{확인말.map((m, k) => <div key={k}>⚠️ {m.무엇}</div>)}</div>}
          </div>

          {/* ── ⑤ 받기 ── */}
          <div className="card">
            <div className="sec-title">⑤ 엑셀 · 한글 받기</div>
            <div className="btn-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn primary" style={{ width: 'auto' }} disabled={!!바쁨} onClick={받기}>⬇ 기성 {편집.회차}회 엑셀 받기</button>
              <button type="button" className="btn line" style={{ width: 'auto' }} disabled={!!바쁨} onClick={한글받기} title="기성검사원 · 기성대가 청구서 · 부분기성내역서 · 기성부분 원가계산서를 한글 문서 하나로">📄 한글(.hwpx)</button>
              <label className="muted gs-chk" style={{ fontSize: 13 }}><input type="checkbox" checked={편집.서류 !== false} onChange={(e) => set편집((x) => ({ ...x, 서류: e.target.checked }))} /> 기성검사원 · 기성대가 청구서도</label>
              <label className="muted gs-chk" style={{ fontSize: 13 }}><input type="checkbox" checked={편집.주소 !== false} onChange={(e) => set편집((x) => ({ ...x, 주소: e.target.checked }))} /> 맨 아래 K-건설맵 한 줄(지워도 됨)</label>
            </div>
            <p className="muted" style={{ margin: '8px 0 0', fontSize: 12.5 }}>
              {/\.(xlsx|xlsm)$/i.test(파일.이름) ? '받은 내역서 시트는 그대로 두고 뒤에' : '.xls 는 원본을 붙일 수 없어 계약내역서와 함께'} 기성내역 · 기성원가 · 부분기성 · 기성검사원 · 기성대가 청구서 · 검산 시트를 붙입니다.
              기성내역서는 금회 수량을 고치면 금액 · 누계 · 잔여가 따라 바뀝니다. 원가계산서 · 부분기성은 이 화면에서 셈한 값입니다 — 고칠 때는 여기서 고쳐 다시 받으십시오.
            </p>
            {받음 && <p className="muted" style={{ margin: '6px 0 0' }}>✅ <b>{받음.이름}</b> — {받음.시트.filter((n) => !n.startsWith('_')).join(' · ')}. <b>다음 회엔 이 파일을 그대로 넣으십시오.</b></p>}
          </div>
        </>
      )}
      {결과 && 결과.오류 && <div className="card cwarn">⚠️ {결과.오류}</div>}

      {/* ── 기성 장부 (이 브라우저) ── */}
      {장부목록.length > 0 && (
        <div className="card">
          <div className="sec-title">📒 기성 장부 <span className="count">이 브라우저에 남은 것</span></div>
          {장부목록.slice(0, 5).map(([k, b]) => (
            <div key={k} className="gs-book">
              <b>{b.이름}</b>
              <div className="gg-wrap"><table className="gg-r">
                <thead><tr><th>회차</th><th>기성일</th><th className="r">금회</th><th className="r">누계</th><th className="r">공정률</th><th className="r">계획</th></tr></thead>
                <tbody>{b.회차들.map((x) => <tr key={x.회차}><td>{x.회차}회</td><td>{x.날짜}</td><td className="r">{원(x.금회)}</td><td className="r">{원(x.누계)}</td><td className="r">{퍼(x.공정률)}</td><td className="r">{x.계획 === null || x.계획 === undefined ? '' : 퍼(x.계획)}</td></tr>)}</tbody>
              </table></div>
            </div>
          ))}
        </div>
      )}

      <div className="card no-print">
        <div className="detail-h">알아 두실 것</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.85 }}>
          <li><b>금액</b> = 수량 × 재료 · 노무 · 경비 단가(원 미만 버림)의 합 — 계약단가 그대로. <b>누계</b> = 전회 + 금회. 마지막 회(누계 = 계약)는 끝전까지 계약과 같게 맞춥니다.</li>
          <li><b>원가</b> = 계약 원가계산서의 산출근거 식을 누계 기성 직접비로 다시 셈 → 금회 = 누계 − 전회. 산출근거가 없거나 이름으로 적힌 줄은 금액으로 식을 찾아 쓰고(당초와 원 단위까지 같은 식만), 나열형(건축 · 토목 · 기계 …)은 분야마다 셈해 더합니다.</li>
          <li><b>고정 금액</b> 보험료 · 산업안전보건관리비는 계약 × 대상액 기성 비율(직접노무비 등), 그 밖의 고정 금액 줄은 계약 × 기성률.</li>
          <li><b>선금 공제</b> = 선금 × (기성 금액 ÷ 계약금액) · 누계로 셈해 끝전이 쌓이지 않게.</li>
          <li>건강 · 연금 · 노인장기요양보험료는 준공 때 사후정산, 산업안전보건관리비는 사용 내역으로 정산하는 항목입니다 — 기성에서는 계약 요율대로 셉니다.</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <Link className="btn ghost sm" to="/change/won">🧾 원 내역서로 설계변경</Link>
          <Link className="btn ghost sm" to="/change/work">🧰 설계변경 작업대</Link>
          <Link className="btn ghost sm" to="/jeoksan/auto">⚡ 도면 물량 자동</Link>
        </div>
      </div>
    </>
  )
}
