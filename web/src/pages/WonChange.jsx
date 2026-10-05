/**
 * /change/won — 🧾 원 내역서로 설계변경 한 벌 (2026-10-05, G131)
 *
 * 소장님(10/4): 「일반적으로 설계변경은 원 내역서를 가지고 하는데, 거기에 쉬트가 추가 되는 방식이거든…
 *   원내역서를 넣으면 증감대비표등 을 추가해 주는 프로그램」 → 「원내역서 넣으면 두 줄 변경부터 추가 시트 추가 해주는 틀을 사이트에서 가능하게」
 *   → 10/5 「시작해. 작업 완료 해줘」
 *
 * ■ 흐름: ① 원 내역서(.xlsx · .xls) → ② 차수 · 낙찰률 → ③ 줄마다 변경 수량 · 사유 → ④ 신규 비목(설계단가 × 낙찰률)
 *        → ⑤ 한눈에(순공사비 · 도급액 · 총공사비 당초 → 변경) → ⑥ 엑셀(원본 시트 그대로 + 뒤에 새 시트 9~11장) · 원클릭에 넣기
 * ■ 셈 · 시트는 lib/원내역변경.js · 원가계산서는 lib/원가계산.js · 원본에 붙이기는 lib/시트붙이기.js
 * ■ 고친 것은 이 기기(브라우저)에 파일마다 남습니다. 파일은 서버로 올라가지 않습니다.
 * ■ 받는 엑셀에는 «수식» 이 들어갑니다 — 이용자 자기 파일을 바꿔 주는 도구라서(소장님 2026-10-01 원칙)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { askAfter } from '../AskComment'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import 두줄색, { 두줄색상태 } from '../tools/두줄색.jsx'

const 원 = (n) => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '—')
const 증감글 = (n) => (typeof n === 'number' && Number.isFinite(n) ? (n > 0 ? '+' : '') + Math.round(n).toLocaleString('ko-KR') : '—')
const 수글 = (n) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 4 }))
const 꼴맞음 = /\.(xlsx|xlsm|xls)$/i
const 남김열쇠 = 'kcm.won.v1'
const 쪽수 = 60

function 남김읽기() { try { return JSON.parse(localStorage.getItem(남김열쇠) || '{}') || {} } catch { return {} } }
function 남김쓰기(지문, 편집) {
  try {
    const 모두 = 남김읽기()
    모두[지문] = { ...편집, _at: Date.now() }
    const 열쇠들 = Object.keys(모두).sort((a, b) => (모두[b]._at || 0) - (모두[a]._at || 0))
    for (const k of 열쇠들.slice(6)) delete 모두[k]
    localStorage.setItem(남김열쇠, JSON.stringify(모두))
  } catch { /* 가득 참 · 사생활 보호 */ }
}

export default function WonChange() {
  const 이동 = useNavigate()
  const [lib, setLib] = useState(null)
  const [파일, set파일] = useState(null)          /* {이름, 크기, 바이트, 책} */
  const [시트, set시트] = useState('')
  const [편집, set편집원] = useState(null)
  const [c, setC] = useState(1)
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [결과, set결과] = useState(null)
  const [거르기, set거르기] = useState({ 공종: '', 찾기: '', 바뀐것만: false })
  const [보일수, set보일수] = useState(쪽수)
  const [예정가격, set예정가격] = useState('')
  const [두색, set두색원] = 두줄색상태()          /* 두 줄 글자색 — 이 기기에 남고 작업대와 같이 씀 */
  const set두색 = (f) => { set두색원(f); set결과(null) }
  const 칸 = useRef(null)

  const 싣기 = async () => {
    if (lib) return lib
    const [q, w] = await Promise.all([import('../lib/qtoxlsx.js'), import('../lib/원내역변경.js')])
    const m = { readWorkbook: q.readWorkbook, ...w }
    setLib(m)
    return m
  }

  const 원읽은 = useMemo(() => {
    if (!lib || !파일) return null
    try { return lib.원읽기(파일.책, 파일.이름, 시트 || null) } catch (e) { return { 오류: e?.message || '읽지 못했습니다.' } }
  }, [lib, 파일, 시트])

  /* 파일(지문)마다 남긴 편집을 되살림 */
  useEffect(() => {
    if (!원읽은 || 원읽은.오류 || !lib) return
    const 남은 = 남김읽기()[원읽은.지문]
    set편집원(남은 ? { ...lib.새편집(), ...남은 } : lib.새편집())
    setC(남은 && 남은.차수 ? 남은.차수.length : 1)
    set결과(null)
  }, [원읽은, lib])   // eslint-disable-line react-hooks/exhaustive-deps

  const set편집 = (f) => {
    set편집원((old) => {
      const 새 = typeof f === 'function' ? f(old) : f
      if (원읽은 && !원읽은.오류) 남김쓰기(원읽은.지문, 새)
      return 새
    })
    set결과(null)
  }
  const 차 = 편집 && 편집.차수[c - 1]
  const 고치기차 = (바꿀) => set편집((e) => ({ ...e, 차수: e.차수.map((x, k) => (k === c - 1 ? 바꿀(x) : x)) }))

  const 열기 = async (fs) => {
    const f = [...(fs || [])].find((x) => 꼴맞음.test(x.name))
    if (!f) { set오류('엑셀 파일(.xlsx · .xls)만 됩니다.'); return }
    set오류(''); set결과(null); set바쁨('원 내역서를 읽는 중입니다…')
    await new Promise((r) => setTimeout(r, 30))
    try {
      const m = await 싣기()
      const 바이트 = new Uint8Array(await f.arrayBuffer())
      const 책 = m.readWorkbook(바이트)
      set시트('')
      set파일({ 이름: f.name, 크기: f.size, 바이트, 책 })
      set거르기({ 공종: '', 찾기: '', 바뀐것만: false }); set보일수(쪽수)
    } catch (e) {
      set오류(`${f.name} — ${e?.message || '읽지 못했습니다.'}`)
    } finally { set바쁨('') }
  }

  const 줄들 = useMemo(() => (lib && 원읽은 && !원읽은.오류 && 편집 ? lib.화면줄(원읽은, 편집, c) : []), [lib, 원읽은, 편집, c])
  const 요 = useMemo(() => {
    if (!lib || !원읽은 || 원읽은.오류 || !편집) return null
    try { return lib.빠른요약(원읽은, 편집, c) } catch (e) { return null }
  }, [lib, 원읽은, 편집, c])
  const 공종들 = useMemo(() => 줄들.filter((x) => x.공종), [줄들])
  const 보일 = useMemo(() => {
    const t = 거르기.찾기.trim().replace(/\s+/g, '').toLowerCase()
    let 안 = !거르기.공종
    let 깊 = -1
    const out = []
    for (const x of 줄들) {
      if (x.공종) {
        if (거르기.공종 !== '') {
          if (String(x.i) === String(거르기.공종)) { 안 = true; 깊 = x.깊이 } else if (안 && 깊 >= 0 && x.깊이 <= 깊) { 안 = false; 깊 = -1 }
        }
        continue
      }
      if (!안) continue
      if (t && !(x.이름 + x.규격).replace(/\s+/g, '').toLowerCase().includes(t)) continue
      if (거르기.바뀐것만 && (x.지금 === undefined || x.지금 === '')) continue
      out.push(x)
    }
    return out
  }, [줄들, 거르기])

  const 바꾼수 = 차 ? Object.values(차.수량).filter((v) => v !== '' && v !== undefined && v !== null).length : 0
  const 앞신규 = useMemo(() => {
    if (!편집) return []
    const out = []
    for (let k = 0; k < c - 1 && k < 편집.차수.length; k++) for (const n of 편집.차수[k].신규 || []) out.push({ n, 차수: k + 1 })
    return out
  }, [편집, c])

  /* ── 차수 ── */
  const 차수더하기 = () => {
    set편집((e) => ({ ...e, 차수: [...e.차수, { 이름: `${e.차수.length + 1}회`, 수량: {}, 사유: {}, 신규: [] }] }))
    setC(편집.차수.length + 1)
  }
  const 차수지우기 = () => {
    if (!편집 || 편집.차수.length < 2 || c !== 편집.차수.length) return
    set편집((e) => ({ ...e, 차수: e.차수.slice(0, -1) }))
    setC(c - 1)
  }

  /* ── 신규 비목 ── */
  /* 신규 비목 공종 처음 값 — ③ 에서 고른 공종, 없으면 품목이 바로 아래 있는 첫 공종(맨 위 공사 이름 말고) */
  const 첫공종 = () => {
    if (거르기.공종 !== '') return Number(거르기.공종)
    for (let k = 0; k < 줄들.length - 1; k++) if (줄들[k].공종 && !줄들[k].별도 && !줄들[k + 1].공종) return 줄들[k].i
    return 공종들[0] ? 공종들[0].i : null
  }
  const 빈신규 = () => ({ id: 'n' + Date.now().toString(36), 뒤: 첫공종(), 이름: '', 규격: '', 단위: '', 수량: '', 설계: {}, 근거: '', 기준: '신규', 협의율: '', 사유: '' })
  const [새것, set새것] = useState(null)
  const 신규넣기 = () => {
    if (!새것 || !String(새것.이름).trim()) return
    const n = { ...새것, 뒤: 새것.뒤 === '' || 새것.뒤 === null ? null : Number(새것.뒤), 협의율: 새것.협의율 ? Number(새것.협의율) / 100 : '' }
    고치기차((x) => ({ ...x, 신규: [...(x.신규 || []).filter((y) => y.id !== n.id), n] }))
    set새것(null)
  }
  const 갈래 = 원읽은 && !원읽은.오류 ? 원읽은.모형.갈래 : []
  const 단가칸 = ['재료비', '노무비', '경비'].filter((g) => 갈래.includes(g))
  const 설계칸 = 단가칸.length ? 단가칸 : ['합계']

  /* ── 엑셀 ── */
  const 만들기 = async () => {
    if (!원읽은 || 원읽은.오류 || !편집) return
    set바쁨('엑셀을 만드는 중입니다… (원본이 크면 몇 초 걸립니다)'); set오류('')
    if (결과?.url) { try { URL.revokeObjectURL(결과.url) } catch { /* 지나감 */ } }
    set결과(null)
    await new Promise((r) => setTimeout(r, 40))
    try {
      const m = await 싣기()
      const r = await m.엑셀만들기(파일.바이트, 원읽은, { ...편집, 색: 두색 }, c, Object.keys(파일.책))
      const base = 파일.이름.replace(/\.(xlsx|xlsm|xls)$/i, '')
      const 확장 = /\.xlsm$/i.test(파일.이름) && r.붙임 ? 'xlsm' : 'xlsx'
      const 형 = 확장 === 'xlsm' ? 'application/vnd.ms-excel.sheet.macroEnabled.12' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const blob = new Blob([r.바이트], { type: 형 })
      set결과({ url: URL.createObjectURL(blob), 이름: `${base}_설계변경${c}회.${확장}`, 크기: r.바이트.length, 시트: r.시트이름들, 붙임: r.붙임, 말: r.말, 요약: r.요약 })
    } catch (e) {
      set오류(e?.message || '만들다가 멈췄습니다.')
    } finally { set바쁨('') }
  }
  const 받기 = () => {
    if (!결과) return
    const a = document.createElement('a')
    a.href = 결과.url; a.download = 결과.이름
    document.body.appendChild(a); a.click(); a.remove()
    try { askAfter('change') } catch { /* 지나감 */ }
  }
  const 원클릭에 = () => {
    if (!요) return
    const 금 = 요.원가 && (요.원가.도급액 || 요.원가.총공사비)
    const 당 = 금 ? 금.당초 : 요.순[0], 변 = 금 ? 금.변경 : 요.순[1]
    try {
      const 키 = 'kcm.wonclick.v1'
      const v = JSON.parse(localStorage.getItem(키) || '{}') || {}
      const 쉼 = (n) => Math.round(n).toLocaleString('ko-KR')
      if (!v.계약금액) v.계약금액 = 쉼(당)
      v.정산금액 = 쉼(변)
      if (편집.변경기한) v.변경기한 = 편집.변경기한
      if (편집.공사명 && !v.공사명) v.공사명 = 편집.공사명
      localStorage.setItem(키, JSON.stringify(v))
    } catch { /* 지나감 */ }
    이동('/tools/wonclick')
  }

  const 낙찰률글 = 편집 && 편집.낙찰률 ? (편집.낙찰률 * 100).toFixed(3).replace(/\.?0+$/, '') : ''
  const 원가확인 = 원읽은 && !원읽은.오류 ? 원읽은.말.filter((m) => m.무게 === '확인').length : 0
  const 도급당초 = 요 && 요.원가 && (요.원가.도급액 || 요.원가.총공사비) ? (요.원가.도급액 || 요.원가.총공사비).당초 : null

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧾 원 내역서로 설계변경</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>원 내역서(계약내역서)</b>를 올리고, 바뀐 <b>수량 · 사유 · 신규 비목</b>만 적으면 —
          <b> 원본 시트는 그대로 두고 뒤에</b> 변경내역서(2줄) · <b>변경 원가계산서(원 요율 그대로)</b> · 공사비 증감대비표 · 물량대비표 ·
          총괄표 · 신규비목 단가산출서 · 단가 적용 근거표 · 설계변경 사유서 · 검산을 붙여 드립니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          <b>파일은 이 브라우저 안에서만 다룹니다.</b> 서버로 올라가지 않습니다. 적은 것은 이 기기에 파일마다 남습니다. 받은 엑셀에는 <b>살아 있는 수식</b>이 들어갑니다.
        </p>
      </div>

      {/* ── ① 원 내역서 ── */}
      <div className="card">
        <div className="sec-title">① 원 내역서 올리기</div>
        <div className="tldrop" onClick={() => 칸.current?.click()}
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => { e.preventDefault(); 열기(e.dataTransfer?.files) }}>
          <input ref={칸} type="file" accept=".xlsx,.xlsm,.xls" hidden onChange={(e) => { 열기(e.target.files); e.target.value = '' }} />
          <끌어놓기판 글="원 내역서(엑셀)를 놓으면 엽니다" 길들={[{ 꼴: 꼴맞음, 받기: (fs) => 열기(fs), 여럿: false }]} />
          <b>＋ 원 내역서 엑셀을 끌어 놓거나 누르십시오</b>
          <span>.xlsx · .xlsm · .xls — 원가계산서 시트가 함께 있으면 변경 원가계산서까지 만듭니다</span>
        </div>
        {바쁨 && <div className="muted" style={{ marginTop: 8 }}>{바쁨}</div>}
        {오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {오류}</div>}
        {원읽은 && 원읽은.오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {원읽은.오류}</div>}
        {원읽은 && !원읽은.오류 && (
          <div className="cw-file" style={{ marginTop: 10 }}>
            <div className="cw-fh"><b>{파일.이름}</b><span className="muted">{원(파일.크기 / 1024)} KB</span></div>
            <div className="cw-fr">
              <label>내역서 시트{' '}
                <select value={원읽은.고른} onChange={(e) => set시트(e.target.value)}>
                  {원읽은.시트들.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div className="cw-fs muted">
              품목 <b>{원(원읽은.모형.품목수)}</b> · 공종 {원(공종들.length)} · 순공사비 <b>{원(원읽은.합)}</b>원
              <br />
              {원읽은.원가
                ? <>원가계산서 «{원읽은.원가.시트}» — 줄 {원읽은.원가.줄.length}개 읽음{도급당초 ? <> · 당초 {(요.원가.도급액 ? '도급액' : '총공사비')} <b>{원(도급당초)}</b>원</> : null}</>
                : <>원가계산서 시트가 없습니다 — 변경 원가계산서는 빼고 만듭니다</>}
              {!/\.(xlsx|xlsm)$/i.test(파일.이름) && <><br />⚠️ <b>.xls</b> 는 원본 시트를 그대로 붙일 수 없어 <b>새 시트만</b>(맨 앞에 당초내역서) 만듭니다. 원본째 받으려면 엑셀에서 .xlsx 로 저장해 올리십시오.</>}
            </div>
            {원읽은.말.length > 0 && (
              <details className="wn-msg" open={원가확인 > 0}>
                <summary>{원가확인 ? <>🔎 원가계산서 · 내역서에서 <b>확인하실 곳 {원가확인}</b></> : <>ℹ️ 읽으며 알게 된 것 {원읽은.말.length}가지</>}</summary>
                <ul className="flist">{원읽은.말.slice(0, 12).map((m, k) => <li key={k}><b>{m.무게}</b> — {m.무엇}</li>)}</ul>
              </details>
            )}
          </div>
        )}
      </div>

      {원읽은 && !원읽은.오류 && 편집 && (
        <>
          {/* ── ② 차수 · 낙찰률 ── */}
          <div className="card">
            <div className="sec-title">② 차수 · 낙찰률 · 공사 정보</div>
            <div className="wn-chas" role="tablist" aria-label="변경 차수">
              {편집.차수.map((x, k) => (
                <button key={k} type="button" role="tab" aria-selected={c === k + 1} className={'chip' + (c === k + 1 ? ' on' : '')} onClick={() => setC(k + 1)}>
                  {k + 1}회 변경
                </button>
              ))}
              <button type="button" className="chip" onClick={차수더하기}>＋ {편집.차수.length + 1}회 변경 더하기</button>
              {편집.차수.length > 1 && c === 편집.차수.length && <button type="button" className="chip" onClick={차수지우기}>－ {c}회 빼기</button>}
            </div>
            {c > 1 && (
              <label className="wn-row">견줄 기준{' '}
                <select value={편집.기준} onChange={(e) => set편집((v) => ({ ...v, 기준: e.target.value }))}>
                  <option value="당초">당초(계약) ↔ {c}회 변경</option>
                  <option value="직전">{c - 1}회 변경 ↔ {c}회 변경</option>
                </select>
              </label>
            )}
            <div className="wn-grid">
              <label>낙찰률(%) <input inputMode="decimal" placeholder="예: 87.745" value={편집._낙찰률글 ?? 낙찰률글}
                onChange={(e) => { const t = e.target.value.replace(/[^\d.]/g, ''); set편집((v) => ({ ...v, _낙찰률글: t, 낙찰률: t ? Number(t) / 100 : null })) }} />
                <span className="muted">신규비목 단가 = 설계변경 당시 단가 × 낙찰률</span></label>
              {도급당초 ? (
                <label>예정가격으로 셈 <input inputMode="numeric" placeholder="예정가격(원)" value={예정가격}
                  onChange={(e) => set예정가격(e.target.value.replace(/[^\d]/g, ''))} />
                  <button type="button" className="btn sm ghost" disabled={!Number(예정가격)} onClick={() => {
                    const r = 도급당초 / Number(예정가격)
                    set편집((v) => ({ ...v, 낙찰률: r, _낙찰률글: (r * 100).toFixed(3) }))
                  }}>낙찰률 = 당초 {요.원가.도급액 ? '도급액' : '총공사비'} ÷ 예정가격</button></label>
              ) : null}
              <label>공사명 <input type="text" maxLength={80} value={편집.공사명} onChange={(e) => set편집((v) => ({ ...v, 공사명: e.target.value }))} placeholder="서류 머리에 들어갑니다" /></label>
              <label>변경 준공기한 <input type="date" value={편집.변경기한} onChange={(e) => set편집((v) => ({ ...v, 변경기한: e.target.value }))} /></label>
            </div>
            <label className="wn-row" style={{ display: 'block' }}>설계변경 사유(총괄)
              <textarea rows={2} value={편집.총괄사유} maxLength={600} onChange={(e) => set편집((v) => ({ ...v, 총괄사유: e.target.value }))}
                placeholder="예: 현장 여건(지장물 · 지반) 변경에 따른 물량 조정 및 신규 공종 반영" style={{ width: '100%', boxSizing: 'border-box' }} />
            </label>
            <두줄색 색={두색} set색={set두색} />
          </div>

          {/* ── ③ 수량 ── */}
          <div className="card">
            <div className="sec-title">③ {c}회 변경 — 바뀐 수량 · 사유 <em className="muted" style={{ fontStyle: 'normal', fontWeight: 400 }}>· 바꾼 줄 {바꾼수}</em></div>
            <div className="wn-filter">
              <select value={거르기.공종} onChange={(e) => { set거르기((v) => ({ ...v, 공종: e.target.value })); set보일수(쪽수) }} aria-label="공종">
                <option value="">공종 전체</option>
                {공종들.map((x) => <option key={x.i} value={x.i}>{'　'.repeat(Math.min(x.깊이, 4))}{x.번호 ? x.번호 + ' ' : ''}{x.이름}{x.별도 ? ' (별도)' : ''}</option>)}
              </select>
              <input type="search" placeholder="품명 · 규격 찾기" value={거르기.찾기} onChange={(e) => { set거르기((v) => ({ ...v, 찾기: e.target.value })); set보일수(쪽수) }} />
              <label className="wn-only"><input type="checkbox" checked={거르기.바뀐것만} onChange={(e) => set거르기((v) => ({ ...v, 바뀐것만: e.target.checked }))} /> 바꾼 줄만</label>
            </div>
            <div className="wn-list">
              {보일.slice(0, 보일수).map((x) => {
                const 지금 = x.지금 === undefined ? '' : x.지금
                const 바뀜 = 지금 !== '' && Number(지금) !== Number(x.전)
                const 증 = 지금 !== '' ? Number(지금) - Number(x.전 || 0) : null
                return (
                  <div key={x.i} className={'wn-item' + (바뀜 ? ' on' : '')}>
                    <div className="wn-path muted">{x.길}</div>
                    <div className="wn-name"><b>{x.이름}</b>{x.규격 && <span className="muted"> · {x.규격}</span>}</div>
                    <div className="wn-qty">
                      <span className="muted">{c > 1 ? `${c - 1}회` : '당초'} <b>{수글(x.전)}</b> {x.단위}</span>
                      <span aria-hidden="true">→</span>
                      <input inputMode="decimal" aria-label={`${x.이름} 변경 수량`} placeholder={수글(x.전)} value={지금}
                        onChange={(e) => { const t = e.target.value.replace(/[^\d.\-]/g, ''); 고치기차((y) => ({ ...y, 수량: { ...y.수량, [x.i]: t } })) }} />
                      {증 !== null && 증 !== 0 && <span className={증 > 0 ? 'cw-up' : 'cw-dn'}>{증 > 0 ? '+' : ''}{수글(증)}</span>}
                      <button type="button" className="btn sm ghost" title="이 품목을 없앰(변경 수량 0)" onClick={() => 고치기차((y) => ({ ...y, 수량: { ...y.수량, [x.i]: '0' } }))}>0</button>
                      {지금 !== '' && <button type="button" className="btn sm ghost" onClick={() => 고치기차((y) => { const q = { ...y.수량 }; delete q[x.i]; return { ...y, 수량: q } })}>되돌림</button>}
                    </div>
                    {(바뀜 || (차.사유[x.i])) && (
                      <input className="wn-why" type="text" maxLength={120} placeholder="변경 사유(사유서 · 증감조서에 들어감)" value={차.사유[x.i] || ''}
                        onChange={(e) => 고치기차((y) => ({ ...y, 사유: { ...y.사유, [x.i]: e.target.value } }))} />
                    )}
                    {x.특수 && <div className="muted wn-note">ℹ️ 수량 칸이 비율인 줄(공구손료 · 잡재료 등)입니다 — 바꾸면 «수량 × 단가» 로 다시 셉니다</div>}
                  </div>
                )
              })}
              {!보일.length && <div className="muted">맞는 품목이 없습니다.</div>}
            </div>
            {보일.length > 보일수 && <button type="button" className="btn line" style={{ width: '100%', marginTop: 8 }} onClick={() => set보일수((n) => n + 쪽수 * 2)}>더 보기 ({원(보일.length - 보일수)}줄 남음)</button>}

            {앞신규.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="wc-st">앞 차수에 넣은 신규 비목 — 이번 차수 수량</div>
                {앞신규.map(({ n, 차수 }) => {
                  const v = 차.수량['n:' + n.id] ?? ''
                  return (
                    <div key={n.id} className="wn-item">
                      <div className="wn-name"><b>{n.이름}</b>{n.규격 && <span className="muted"> · {n.규격}</span>} <span className="muted">({차수}회 신규)</span></div>
                      <div className="wn-qty">
                        <span className="muted">그때 <b>{수글(n.수량)}</b> {n.단위}</span><span aria-hidden="true">→</span>
                        <input inputMode="decimal" placeholder={수글(n.수량)} value={v}
                          onChange={(e) => { const t = e.target.value.replace(/[^\d.\-]/g, ''); 고치기차((y) => ({ ...y, 수량: { ...y.수량, ['n:' + n.id]: t } })) }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── ④ 신규 비목 ── */}
          <div className="card">
            <div className="sec-title">④ {c}회 신규 비목 <em className="muted" style={{ fontStyle: 'normal', fontWeight: 400 }}>· 계약단가가 없는 새 품목</em></div>
            {(차.신규 || []).map((n) => {
              const { 율, 단가 } = lib.신규단가(n, 편집.낙찰률, 갈래)
              const 합 = Object.values(단가).reduce((a, b) => a + b, 0)
              return (
                <div key={n.id} className="wn-item on">
                  <div className="wn-path muted">{(공종들.find((p) => p.i === n.뒤) || {}).이름 || '맨 끝'}</div>
                  <div className="wn-name"><b>{n.이름}</b>{n.규격 && <span className="muted"> · {n.규격}</span>} · {수글(n.수량)} {n.단위}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    적용 단가 <b>{원(합)}</b>원(× {(율 * 100).toFixed(3).replace(/\.?0+$/, '')}% · {n.기준 === '협의' ? '③3 협의' : n.기준 === '협의안됨' ? '③3 협의 안 됨' : '③2 신규'}) · 근거 {n.근거 || <b style={{ color: 'var(--bad, #c62828)' }}>비었음</b>}
                  </div>
                  <div className="btn-row" style={{ marginTop: 6 }}>
                    <button type="button" className="btn sm ghost" onClick={() => set새것({ ...n, 협의율: n.협의율 ? (n.협의율 * 100).toFixed(3) : '' })}>고치기</button>
                    <button type="button" className="btn sm ghost" onClick={() => 고치기차((y) => ({ ...y, 신규: y.신규.filter((z) => z.id !== n.id) }))}>빼기</button>
                  </div>
                </div>
              )
            })}
            {!새것 && <button type="button" className="btn line" onClick={() => set새것(빈신규())}>＋ 신규 비목 넣기</button>}
            {새것 && (
              <div className="wn-new">
                <div className="wn-grid">
                  <label>넣을 공종
                    <select value={새것.뒤 ?? ''} onChange={(e) => set새것((v) => ({ ...v, 뒤: e.target.value }))}>
                      {공종들.map((x) => <option key={x.i} value={x.i}>{'　'.repeat(Math.min(x.깊이, 4))}{x.번호 ? x.번호 + ' ' : ''}{x.이름}</option>)}
                      <option value="">맨 끝</option>
                    </select></label>
                  <label>품명 <input type="text" maxLength={60} value={새것.이름} onChange={(e) => set새것((v) => ({ ...v, 이름: e.target.value }))} /></label>
                  <label>규격 <input type="text" maxLength={60} value={새것.규격} onChange={(e) => set새것((v) => ({ ...v, 규격: e.target.value }))} /></label>
                  <label>단위 <input type="text" maxLength={10} value={새것.단위} onChange={(e) => set새것((v) => ({ ...v, 단위: e.target.value }))} /></label>
                  <label>수량 <input inputMode="decimal" value={새것.수량} onChange={(e) => set새것((v) => ({ ...v, 수량: e.target.value.replace(/[^\d.]/g, '') }))} /></label>
                  {설계칸.map((g) => (
                    <label key={g}>설계단가 · {g} <input inputMode="numeric" value={(새것.설계 || {})[g] ?? ''}
                      onChange={(e) => set새것((v) => ({ ...v, 설계: { ...(v.설계 || {}), [g]: e.target.value.replace(/[^\d.]/g, '') } }))} /></label>
                  ))}
                  <label>단가 기준
                    <select value={새것.기준} onChange={(e) => set새것((v) => ({ ...v, 기준: e.target.value }))}>
                      <option value="신규">③2 신규비목 — 설계단가 × 낙찰률</option>
                      <option value="협의">③3 정부 요구 — 협의율</option>
                      <option value="협의안됨">③3 정부 요구 — 협의 안 됨(50%)</option>
                    </select></label>
                  {새것.기준 === '협의' && <label>협의율(%) <input inputMode="decimal" placeholder="예: 93.37" value={새것.협의율} onChange={(e) => set새것((v) => ({ ...v, 협의율: e.target.value.replace(/[^\d.]/g, '') }))} /></label>}
                  <label>단가 근거 <input type="text" maxLength={80} placeholder="물가정보 2026.9 p.123 · 견적 · 일위대가 …" value={새것.근거} onChange={(e) => set새것((v) => ({ ...v, 근거: e.target.value }))} /></label>
                  <label>사유 <input type="text" maxLength={120} value={새것.사유} onChange={(e) => set새것((v) => ({ ...v, 사유: e.target.value }))} /></label>
                </div>
                {(() => {
                  const 미리 = lib.신규단가({ ...새것, 협의율: 새것.협의율 ? Number(새것.협의율) / 100 : '' }, 편집.낙찰률, 갈래)
                  return <div className="muted" style={{ fontSize: 12.5, margin: '6px 0' }}>적용 단가(원 미만 버림): {Object.entries(미리.단가).map(([g, u]) => `${g} ${원(u)}`).join(' · ')} · 율 {(미리.율 * 100).toFixed(3).replace(/\.?0+$/, '')}%{!편집.낙찰률 && 새것.기준 !== '협의' ? ' — ② 에서 낙찰률을 넣으십시오' : ''}</div>
                })()}
                <div className="btn-row">
                  <button type="button" className="btn primary" disabled={!String(새것.이름).trim()} onClick={신규넣기}>넣기</button>
                  <button type="button" className="btn ghost" onClick={() => set새것(null)}>닫기</button>
                </div>
              </div>
            )}
          </div>

          {/* ── ⑤ 한눈에 · 받기 ── */}
          <div className="card">
            <div className="sec-title">⑤ 한눈에 · 엑셀 받기</div>
            {요 && (
              <div className="cw-tiles">
                <div><span>바뀐 품목</span><b>{원(요.바뀜수)}</b></div>
                <div><span>순공사비 당초</span><b>{원(요.순[0])}</b></div>
                <div><span>순공사비 변경</span><b>{원(요.순[1])}</b></div>
                <div><span>순공사비 증감</span><b className={요.순[1] - 요.순[0] >= 0 ? 'cw-up' : 'cw-dn'}>{증감글(요.순[1] - 요.순[0])}</b></div>
                {요.원가 && ['도급액', '총공사비'].map((k) => 요.원가[k] && (
                  <div key={k}><span>{k} 당초 → 변경</span><b>{원(요.원가[k].변경)}</b><em className={요.원가[k].변경 - 요.원가[k].당초 >= 0 ? 'cw-up' : 'cw-dn'}>{증감글(요.원가[k].변경 - 요.원가[k].당초)}</em></div>
                ))}
              </div>
            )}
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className="btn primary" disabled={!!바쁨} onClick={만들기}>{바쁨 ? '만드는 중…' : `엑셀 만들기 (${c}회 변경)`}</button>
              {결과 && <button className="btn primary" onClick={받기}>⬇ {결과.이름} 받기</button>}
              <button className="btn ghost" disabled={!요} onClick={원클릭에} title="변경 금액 · 변경 준공기한을 공사서류 원클릭 칸에 넣고 넘어갑니다">⚡ 원클릭에 넣기</button>
            </div>
            {결과 && (
              <div style={{ marginTop: 8 }}>
                <p className="muted" style={{ margin: '0 0 6px' }}>
                  {원(결과.크기 / 1024)} KB · {결과.붙임 ? <>원본 시트 그대로 + <b>새 시트 {결과.시트.length}장</b></> : <>새 시트 {결과.시트.length}장</>}: {결과.시트.join(' · ')}
                </p>
                {(() => {
                  const 확 = 결과.말.filter((m) => m.무게 === '확인')
                  return 확.length ? (
                    <div className="cwarn">🔎 <b>내기 전에 확인하실 곳 {확.length}군데</b> (엑셀 «검산» 시트에도 있음)
                      <ul className="flist" style={{ margin: '6px 0 0' }}>{확.slice(0, 10).map((m, k) => <li key={k}>{m.이름 ? <b>{m.이름} — </b> : null}{m.무엇}</li>)}</ul>
                    </div>
                  ) : <div className="cok">✅ 바뀐 줄마다 사유 · 신규비목 근거가 다 들어 있습니다.</div>
                })()}
              </div>
            )}
          </div>
        </>
      )}

      <div className="card">
        <div className="sec-title">알아 두실 것</div>
        <ul className="flist">
          <li><b>단가</b> — 국가계약법 시행령 제65조③: 1호 늘거나 준 물량은 <b>계약단가</b>(산출내역서 단가) · 2호 계약단가가 없는 <b>신규비목은 설계변경 당시 단가 × 낙찰률</b> · 3호 정부가 요구한 변경(계약상대자 책임 없음)은 설계변경 당시 단가와 그 단가 × 낙찰률 사이에서 <b>협의</b>(협의가 안 되면 둘을 더한 것의 50%).</li>
          <li><b>원가계산서</b> — 원 내역서의 원가계산서 산출근거(「B × 0.0356」 · 「(A + 4 + 6) × 0.004」 …)를 읽어 당초 금액이 정말 그렇게 나오는지 먼저 맞춰 보고, 같은 요율로 변경을 셉니다(제65조⑥ — 증감분의 일반관리비 · 이윤은 산출내역서의 율). 안 맞는 줄은 «당초 그대로» 두고 검산에 적습니다.</li>
          <li><b>제비율제외공종 · 폐기물처리비 · 관급자재 · 사급자재</b>처럼 원가계산서에 따로 적힌 금액은, 같은 금액의 공종을 찾아 그 공종의 변경 합계로 잇습니다.</li>
          <li>셈 규칙 — 금액 = 수량 × 단가(<b>원 미만 버림</b>), 합계 = 노무비 + 재료비 + 경비. 신규비목 적용 단가도 갈래마다 원 미만 버림.</li>
          <li><b>2회 · 3회 변경</b>은 차수를 더해 이어 적으십시오. 견줄 기준을 «당초» 나 «직전 차수» 로 고를 수 있고, 2회부터 <b>차수별 대비표</b>가 붙습니다.</li>
          <li>도급액 천 원 맞춤(이윤 깎기 등)은 기관마다 달라 손으로 하십시오. 검산에 «조정값» 이 적힙니다.</li>
        </ul>
        <div className="btn-row">
          <Link className="btn ghost" to="/change">← 설계변경으로</Link>
          <Link className="btn ghost" to="/change/work">🧰 설계변경 작업대</Link>
          <Link className="btn ghost" to="/change/calc">🧮 증감 계산기</Link>
          <Link className="btn ghost" to="/qna">이상한 데가 있으면 한 줄</Link>
        </div>
      </div>
    </>
  )
}
