/**
 * /jeoksan/run — 「수량산출서 만들기」 (2026-09-16)
 *
 * 소장님: 「아예, 건설맵 사이트에서 하게 하는 건 어때? 돌린 이용자가 엑셀로 다운로드 받게.
 *          그럼 우린 자료가 쌓여서 좋은 거고, 사이트 방문 이유도 생기는 거니까」
 *          그리고 「도면은 필요 없고」.
 *
 * 🔓 2026-09-26 — 소장님: 「적산 물량 산출도...우선은 무료로...개방」 · 「사이트 내에서 사용하도록」
 *    잠금(Locked·열쇠말)을 풀었습니다. 그리고 «받아서 고쳐 올리는» 길 말고 «이 화면에서 끝나는» 길을 냅니다:
 *      ① 재료표: 견본(토목·건축)을 «그대로 쓰기» 한 번 누르면 됩니다 — 받을 것 없음. 내 재료표를 올려도 됩니다
 *      ② 치수표: 화면의 표에 바로 적습니다(줄 더하기·지우기, 부재는 재료표에서 고름). CSV·엑셀을 올려도 됩니다
 *    ⚠️ 9/17 에 잠근 까닭(「이용자 들이 사용하게 하면 안돼」 · 값을 받을 물건)은 소장님이 9/26 에 «우선 무료» 로 바꾸셨습니다.
 *       다시 잠그려면 git 에서 이 파일의 9/25 판(Locked 로 감싼 것)을 보십시오.
 *
 * ■ 여기서 하는 일 / 안 하는 일
 *    하는 일   : 재료표(엑셀) + 치수표  ->  수량산출서 엑셀 다섯 장
 *    안 하는 일: 도면을 «해석» 하지 않습니다. 도면의 선이 무엇인지는 사람이 봐야 합니다.
 *
 * 📐 2026-09-27 — 소장님: 「기존 수량산출서도 이런 방식으로 해줘」 (골조 수량산출처럼 «잰 치수 빼기»)
 *    치수표의 칸을 누르고 도면(DXF·DWG)의 선·치수·글자·닫힌 선을 누르면 값이 들어갑니다(미터).
 *    L·W·H 등 → 길이 · A·A1·A2 → 면적 · 개소 → 개수 · 부호·태그·비고 → 글자. 칸 이름·차례는 그대로입니다.
 *    도면판은 ../도면판.jsx (골조·마감·도면 물량 자동과 같이 씀) · 누른 값 셈은 ../lib/찍기.js
 *
 * ■ 파일은 브라우저 안에서만 다룹니다. 한 조각도 올라가지 않습니다. (서버 비용 0)
 *
 * ⚠️ 셈은 lib/qto.js · lib/susik.js 가 합니다. PC 의 kqto.py · kq_susik.py 와
 *    «같은 수량» 을 내야 합니다 — 한쪽만 고치지 마십시오.
 *    맞는지는 tools/시험_적산.mjs 가 봅니다 (무작위 수식 4만8천 개 + 실제 산출단위 대조).
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'
import { use도면, 도면판, 도면상태줄 } from '../도면판.jsx'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 찍기, 두점더하기, 도움글 } from '../lib/찍기.js'
import * as 기억 from '../lib/기억자료.js'
import 작업백업칸 from '../tools/작업백업칸.jsx'
/* 📄 2026-09-27 — 결과를 화면에서 보고·고치고·인쇄 (엑셀 받기도 둠) */
const 엑셀화면 = lazy(() => import('../엑셀화면.jsx'))

/* 🧭 2026-09-27 — 「손님 맞을 준비 … 전수조사」: 치수표를 적다가 다른 화면에 갔다 오면 «다 사라졌습니다».
   → 적은 치수표(표·찍은 자리)는 이 기기(localStorage)에, 고른 재료표·올린 치수표는 브라우저 창고(IndexedDB)에 둡니다.
     서버로는 한 조각도 가지 않습니다. «비우기» 를 누르면 지워집니다. */
const 남김열쇠 = 'kcm.run.v1'
function 남김읽기() { try { return JSON.parse(localStorage.getItem(남김열쇠) || 'null') } catch (e) { return null } }
/* 💾 G113 — 작업 백업 파일: 적은 치수표(localStorage) + 고른 재료표 · 올린 치수표(IndexedDB) */
async function 런꺼내기() {
  const 자료 = []
  try { const v = localStorage.getItem(남김열쇠); if (v) 자료.push(['남김', v]) } catch (e) { /* 막힘 */ }
  for (const k of ['run.재료표', 'run.치수표']) { const v = await 기억.꺼내기(k); if (v) 자료.push([k, v]) }
  return 자료
}
async function 런넣기(자료) {
  const m = new Map(자료)
  if (m.has('남김')) localStorage.setItem(남김열쇠, String(m.get('남김'))); else localStorage.removeItem(남김열쇠)
  for (const k of ['run.재료표', 'run.치수표']) { if (m.has(k)) await 기억.넣기(k, m.get(k)); else await 기억.지우기(k) }
}

/** 치수표 칸마다 도면에서 무엇을 받나 */
function 치수칸종류(k) {
  const t = String(k || '').trim()
  if (!t || t === '번호' || t === '부재') return ''
  if (/^A\d*$/i.test(t)) return '면적'
  if (t === '개소') return '개수'
  if (/^[A-Za-z]{1,3}\d*$/.test(t)) return '길이'
  return '글자'
}

function kb(n) { return new Intl.NumberFormat('ko-KR').format(Math.round(n / 1024)) }

const 견본 = {
  토목: '/jeoksan/재료표_토목.xlsx',
  건축: '/jeoksan/재료표_건축.xlsx',
}
const 치수견본 = '/jeoksan/치수표_견본.csv'
const 기본칸 = ['번호', '부재', '부호', '태그1', '태그2', '태그3', '개소', 'A1', 'A2', 'L', 'W', 'H', 'A', '비고']

export default function JeoksanRun() {
  return <Run />
}

function Run() {
  const [lib, setLib] = useState(null)      /* 무겁습니다 — 처음 쓸 때 받아옵니다 */
  const [book, setBook] = useState(null)    /* {name, size, buf, 부재, 줄, 견본} 재료표 */
  const [unit, setUnit] = useState(null)    /* {name, size, text, n} 올린 치수표 */
  const [표, set표] = useState(() => (남김읽기() || {}).표 || null)         /* {칸:[…], 줄:[[…]]} 화면에서 적는 치수표 */
  const [치수길, set치수길] = useState(() => (남김읽기() || {}).치수길 || '표')   /* '표' = 화면에서 적기 · '파일' = 올리기 */
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [out, setOut] = useState(null)      /* {url, name, rows, checks, warns, serious} */
  const bRef = useRef(null)
  const uRef = useRef(null)
  /* 📐 도면에서 찍기 (2026-09-27) */
  const 도 = use도면('치수도면')
  const dRef = useRef(null)
  const [선택, set선택] = useState(null)      /* {i, k} 고른 칸 */
  const [찍음, set찍음] = useState(() => (남김읽기() || {}).찍음 || [])        /* 줄마다 {칸: [{e,v}]} — 어디서 찍었나 */
  const [결과책, set결과책] = useState(null)   /* 📄 결과 엑셀을 푼 것(화면 보기) */
  const [고침, set고침] = useState({})        /* 화면에서 고친 칸 — 다시 세면 지워집니다 */
  const [두점, set두점] = useState(null)
  const [알림, set알림] = useState({ 글: '', 좋음: false })
  const [보는중, set보는중] = useState(null)

  const loadLib = useCallback(async () => {
    if (lib) return lib
    const m = await import('../lib/qto.js')
    setLib(m)
    return m
  }, [lib])

  const 재료표읽기 = useCallback(async (buf, name, size, 견본이름 = '', 남길 = true) => {
    const m = await loadLib()
    const b = new m.Book(buf, name)          /* 여기서 한 번 읽어 봐야 «틀린 파일» 을 바로 잡습니다 */
    setBook({ name, size, buf, 부재: [...new Set(b.재료표.map((r) => r['부재']).filter(Boolean))], 줄: b.재료표.length, 견본: 견본이름 })
    if (남길) 기억.넣기('run.재료표', 견본이름 ? { 견본: 견본이름 } : { name, size, buf }).catch(() => {})
  }, [loadLib])

  /* 🧭 적은 치수표 남기기 */
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(남김열쇠, JSON.stringify({ 표, 찍음, 치수길 })) } catch (e) { /* 가득 참 */ } }, 300)
    return () => clearTimeout(t)
  }, [표, 찍음, 치수길])
  /* 🧭 다시 들어오면 재료표·올린 치수표 되살리기 */
  useEffect(() => {
    let 살 = true
    ;(async () => {
      try {
        const b = await 기억.꺼내기('run.재료표')
        if (살 && b) {
          if (b.견본 && 견본[b.견본]) {
            const r = await fetch(견본[b.견본])
            if (r.ok && 살) { const buf = await r.arrayBuffer(); await 재료표읽기(buf, `재료표_${b.견본}.xlsx`, buf.byteLength, b.견본, false) }
          } else if (b.buf) await 재료표읽기(b.buf, b.name, b.size, '', false)
        }
        const u = await 기억.꺼내기('run.치수표')
        if (살 && u && u.text) setUnit(u)
      } catch (e) { /* 창고를 못 쓰는 브라우저 — 처음부터 */ }
    })()
    return () => { 살 = false }
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  const takeBook = useCallback(async (f) => {
    if (!f) return
    setErr(''); setOut(null)
    if (!/\.xlsx$/i.test(f.name)) {
      setErr(/\.xls$/i.test(f.name)
        ? '구형 엑셀(.xls)은 못 읽습니다. 엑셀에서 «다른 이름으로 저장 → Excel 통합 문서(.xlsx)» 한 뒤 올려 주십시오.'
        : '재료표는 엑셀(.xlsx) 이어야 합니다.')
      return
    }
    setBusy('재료표를 읽는 중입니다…')
    try { await 재료표읽기(await f.arrayBuffer(), f.name, f.size) }
    catch (e) { setBook(null); setErr(e?.message || '재료표를 읽지 못했습니다.') }
    finally { setBusy('') }
  }, [재료표읽기])

  /* 견본 재료표를 «그대로 쓰기» — 받아서 고쳐 올릴 필요 없이 이 화면에서 바로 */
  const 견본쓰기 = useCallback(async (k) => {
    setErr(''); setOut(null)
    setBusy(`견본 재료표(${k})를 여는 중입니다…`)
    try {
      const r = await fetch(견본[k])
      if (!r.ok) throw new Error('견본을 받지 못했습니다. 잠시 뒤 다시 눌러 주십시오.')
      const buf = await r.arrayBuffer()
      await 재료표읽기(buf, `재료표_${k}.xlsx`, buf.byteLength, k)
    } catch (e) { setBook(null); setErr(e?.message || '견본을 열지 못했습니다.') }
    finally { setBusy('') }
  }, [재료표읽기])

  const takeUnit = useCallback(async (f) => {
    if (!f) return
    setErr(''); setOut(null)
    const 엑셀 = /\.xlsx$/i.test(f.name)
    if (!엑셀 && !/\.(csv|txt)$/i.test(f.name)) {
      setErr('치수표는 CSV 또는 엑셀(.xlsx) 이어야 합니다. 아니면 위 «화면에서 적기» 를 쓰십시오.')
      return
    }
    setBusy('치수표를 읽는 중입니다…')
    try {
      const m = await loadLib()
      const buf = await f.arrayBuffer()
      const text = 엑셀 ? 엑셀을글로((await import('../lib/qtoxlsx.js')).readWorkbook, buf) : decodeKo(buf)
      const us = m.readUnits(text)               /* 미리 읽어 «부재 칸이 없습니다» 를 바로 알립니다 */
      setUnit({ name: f.name, size: f.size, text, n: us.length })
      기억.넣기('run.치수표', { name: f.name, size: f.size, text, n: us.length }).catch(() => {})
    } catch (e) {
      setUnit(null)
      setErr(e?.message || '치수표를 읽지 못했습니다.')
    } finally { setBusy('') }
  }, [loadLib])

  /* 화면 표: 처음엔 빈 줄 세 개. «견본 줄 불러오기» 로 견본 12줄을 채울 수 있습니다. */
  const 표준비 = () => 표 || { 칸: 기본칸, 줄: [빈줄(기본칸, 1), 빈줄(기본칸, 2), 빈줄(기본칸, 3)] }
  const 표바꿈 = (i, j, v, 목록) => {
    const t = 표준비()
    const 줄 = t.줄.map((r) => r.slice())
    줄[i][j] = v
    set표({ ...t, 줄 }); setOut(null)
    const k = t.칸[j]
    set찍음((P) => { const a = P.slice(); const o = { ...(a[i] || {}) }; if (목록 && 목록.length) o[k] = 목록; else delete o[k]; a[i] = o; return a })
  }
  const 줄더하기 = () => { const t = 표준비(); set표({ ...t, 줄: [...t.줄, 빈줄(t.칸, t.줄.length + 1)] }) }
  const 줄지우기 = (i) => { const t = 표준비(); set표({ ...t, 줄: t.줄.filter((_, k) => k !== i) }); set찍음((P) => P.filter((_, k) => k !== i)); set선택(null); setOut(null) }
  const 견본줄 = async () => {
    setErr('')
    try {
      const m = await loadLib()
      const r = await fetch(치수견본)
      const text = decodeKo(await r.arrayBuffer())
      const us = m.readUnits(text)
      const 칸 = 기본칸.slice()
      for (const u of us) for (const k of Object.keys(u)) if (!칸.includes(k)) 칸.push(k)
      set표({ 칸, 줄: us.map((u) => 칸.map((k) => u[k] ?? '')) }); set찍음([]); set선택(null); setOut(null)
    } catch (e) { setErr(e?.message || '견본 줄을 불러오지 못했습니다.') }
  }
  const 표글 = useMemo(() => {
    const t = 표
    if (!t) return ''
    const 찬줄 = t.줄.filter((r) => r.some((c, j) => t.칸[j] !== '번호' && String(c).trim() !== ''))
    if (!찬줄.length) return ''
    return [t.칸, ...찬줄].map((r) => r.map(csv칸).join(',')).join('\n')
  }, [표])

  const 치수글 = 치수길 === '표' ? 표글 : (unit && unit.text)

  /* ── 📐 찍기 ── */
  const 선택종류 = 선택 ? 치수칸종류(선택.k) : ''
  const 선택찍음 = 선택 ? (((찍음[선택.i] || {})[선택.k]) || []) : []
  const 찍었다 = (e, x, y, 보기) => {
    if (!도.모델) return
    if (!선택) { set알림({ 글: '먼저 아래 치수표에서 채울 칸을 누르십시오.' }); return }
    const r = 찍기(도.모델, e, x, y, { kind: 선택종류, k: (도.단위 && 도.단위.k) || 1, 끈층: 도.끈층, 보기, 지금: 선택찍음 })
    if (r.목록 === null) { set알림({ 글: r.알림 }); return }
    const t = 표준비()
    표바꿈(선택.i, t.칸.indexOf(선택.k), r.값, r.목록)
    set알림({ 글: r.알림 || '', 좋음: !!r.알림좋음 })
  }
  const 두점찍었다 = (p) => {
    if (!선택 || 선택종류 !== '길이') { set알림({ 글: '길이 칸(L·W·H 등)을 먼저 누르십시오.' }); set두점(null); return }
    if (!두점 || !두점.length) { set두점([p]); set알림({ 글: '두 번째 점을 누르십시오.', 좋음: true }); return }
    const r = 두점더하기(선택찍음, 두점[0], p, (도.단위 && 도.단위.k) || 1)
    표바꿈(선택.i, 표준비().칸.indexOf(선택.k), r.값, r.목록)
    set두점(null)
    set알림({ 글: '두 점 사이 ' + r.d.toFixed(3) + ' m 를 더했습니다.', 좋음: true })
  }
  const 강조 = useMemo(() => {
    const o = []
    const ids = 선택찍음.map((it) => it.e).filter((e) => e >= 0)
    if (ids.length) o.push({ ids, color: '#facc15', w: 3.5 })
    if (보는중 !== null && 보는중 >= 0) o.push({ ids: [보는중], color: '#38bdf8', w: 2.5 })
    return o
  }, [선택찍음, 보는중])

  const run = async () => {
    if (!book || !치수글) return
    setBusy('세는 중입니다…'); setErr('')
    if (out?.url) { try { URL.revokeObjectURL(out.url) } catch { /* 지나갑니다 */ } }
    setOut(null)
    await new Promise((r) => setTimeout(r, 40))   /* 「세는 중」 을 먼저 그리게 한 박자 쉽니다 */
    try {
      const m = await loadLib()
      const res = m.run(book.buf, book.name, 치수글, 치수길 === '표' ? '화면에서 적은 치수표' : unit.name)
      const blob = new Blob([res.bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      set고침({})
      try { const R = await import('../lib/엑셀읽기.js'); set결과책({ 책: R.엑셀읽기(res.bytes), bytes: res.bytes }) } catch (e) { set결과책(null) }
      setOut({
        url: URL.createObjectURL(blob),
        name: '수량산출서.xlsx',
        rows: res.rows.length,
        units: res.units.length,
        checks: res.checks,
        warns: res.warns,
        serious: res.serious,
        미리: res.rows.slice(0, 8),
      })
      try { if (window.gtag) window.gtag('event', 'jeoksan_run', { rows: res.rows.length }) } catch { /* 광고차단기 */ }
      askAfter('jeoksan')
    } catch (e) {
      setErr(e?.message || '세지 못했습니다.')
    } finally { setBusy('') }
  }

  const 엑셀받기 = async () => {
    if (!out) return
    let url = out.url
    if (Object.keys(고침).length && 결과책) {
      const W = await import('../lib/엑셀쓰기.js')
      url = URL.createObjectURL(new Blob([W.고친엑셀(결과책.bytes, 결과책.책, 고침)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    }
    const a = document.createElement('a')
    a.href = url; a.download = out.name
    document.body.appendChild(a); a.click(); a.remove()
  }

  const ready = book && 치수글 && !busy
  const t = 표준비()
  const 부재들 = book ? book.부재 : []

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧮 수량산출서 만들기 <span className="count">· 무료</span></h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>재료표</b>를 고르고 <b>치수</b>를 적으면 <b>수량산출서 엑셀</b>이 나옵니다.
          산출근거가 <b>살아 있는 엑셀 수식</b>이라 감리가 칸을 눌러 봅니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          회원가입 없이 무료로 여기서 끝납니다. <b>넣으신 것은 이 브라우저 밖으로 나가지 않습니다</b> —
          셈은 쓰시는 컴퓨터(휴대폰) 안에서 합니다.
        </p>
        {/* 💾 G113 — 적은 치수표 · 고른 재료표 · 올린 치수표를 파일 하나로 옮겨 다른 기기에서 이어 합니다(서버로 안 감) */}
        <작업백업칸 곳="jeoksanrun" 파일="수량산출서" 무엇="치수표 · 재료표" 꺼내기={런꺼내기} 넣기={런넣기} />
      </div>

      {/* ── ① 재료표 ── */}
      <div className="card">
        <div className="sec-title">① 재료표 — 부재 하나가 무엇을 얼마나 먹는지</div>
        <p className="muted" style={{ marginTop: 0 }}>
          처음이시면 <b>견본을 그대로 쓰십시오.</b> 토목(땅깎기·흙쌓기·터파기·포장·관로·구조물)과
          건축 견본이 있습니다. 현장에 맞춘 재료표가 있으시면 올리셔도 됩니다.
        </p>
        <div className="btn-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button type="button" className={'btn ' + (book?.견본 === '토목' ? 'primary' : 'line')} style={{ width: 'auto' }}
                  onClick={() => 견본쓰기('토목')}>🏗 토목 견본 그대로 쓰기</button>
          <button type="button" className={'btn ' + (book?.견본 === '건축' ? 'primary' : 'line')} style={{ width: 'auto' }}
                  onClick={() => 견본쓰기('건축')}>🏢 건축 견본 그대로 쓰기</button>
          <button type="button" className={'btn ' + (book && !book.견본 ? 'primary' : 'ghost')} style={{ width: 'auto' }}
                  onClick={() => bRef.current?.click()}>📂 내 재료표 올리기</button>
        </div>
        <input ref={bRef} type="file" accept=".xlsx" hidden
               onChange={(e) => { takeBook(e.target.files?.[0]); e.target.value = '' }} />
        {/* 📥 화면 어디에 놓아도 — 도면은 찍기 판, 엑셀은 재료표, CSV 는 치수표 (치수표 상자에 놓으면 엑셀도 치수표로) */}
        <끌어놓기판 글="도면(DXF·DWG) → 찍기 판 · 엑셀 → 재료표 · CSV → 치수표"
          길들={[{ 꼴: /\.(dxf|dwg)$/i, 받기: (fs) => 도.파일받기(fs) }, { 꼴: /\.xlsx$/i, 받기: (fs) => takeBook(fs[0]) }, { 꼴: /\.(csv|txt)$/i, 받기: (fs) => { set치수길('파일'); takeUnit(fs[0]) } }]} />
        {book && (
          <div className="pdfgot" style={{ marginTop: 10 }}>
            📎 {book.견본 ? `견본 — ${book.견본}` : book.name} · 재료표 {book.줄}줄 · 부재 {book.부재.join(' · ')}
          </div>
        )}
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          견본을 고쳐 쓰고 싶으시면: <a href={견본.토목} download>토목 견본 엑셀</a> · <a href={견본.건축} download>건축 견본 엑셀</a>
        </div>
      </div>

      {/* ── ② 치수 ── */}
      <div className="card">
        <div className="sec-title">② 치수 — 부재 하나에 한 줄</div>
        <div className="btn-row" style={{ gap: 8, marginBottom: 10 }}>
          <button type="button" className={'chip' + (치수길 === '표' ? ' on' : '')} onClick={() => set치수길('표')}>✏️ 화면에서 적기</button>
          <button type="button" className={'chip' + (치수길 === '파일' ? ' on' : '')} onClick={() => set치수길('파일')}>📂 CSV·엑셀 올리기</button>
        </div>
        {치수길 === '표' ? (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              <b>단위는 미터</b>입니다(도면의 3000mm 는 3). <b>부재</b>는 재료표에 있는 이름을 고르고,
              나머지 칸(A1·A2·L·W·H·A)은 재료표 수량식이 쓰는 치수입니다. <b>개소</b>를 비우면 1 입니다.
            </p>
            <div className="jrx-draw">
              <button type="button" className={'btn sm ' + (도.모델 ? 'ghost' : 'line')} style={{ width: 'auto' }} onClick={() => dRef.current?.click()}>
                📐 {도.모델 ? '다른 도면 열기' : '도면에서 찍어 채우기 (DXF·DWG)'}</button>
              <span className="muted" style={{ fontSize: 12.5 }}>칸을 누르고 도면의 선·치수·글자·닫힌 선을 누르면 값(m)이 들어갑니다. 도면은 이 브라우저 밖으로 나가지 않습니다.</span>
              <input ref={dRef} type="file" accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1}
                     onChange={(e) => { 도.파일받기(e.target.files); e.target.value = '' }} />
            </div>
            <도면상태줄 상태={도.도면상태} />
            {도.모델 && (
              <도면판 도={도} 강조={강조} 찍었다={찍었다} 두점={두점} set두점={set두점} 두점찍었다={두점찍었다} set보는중={set보는중}
                알림={알림.글} 알림좋음={알림.좋음} 열기={() => dRef.current?.click()}
                안내={선택 ? (선택종류
                  ? <>👉 <b>{선택.i + 1}번 줄 «{선택.k}»</b> — {도움글[선택종류]}{두점 !== null ? ' 📏 두 점 재기: 점 두 개를 누르십시오.' : ''}</>
                  : <>«{선택.k}» 칸은 도면에서 받지 않습니다 — 직접 적거나 고르십시오.</>)
                  : <>아래 치수표에서 채울 칸을 누른 뒤, 도면을 누르십시오. <span className="muted">(끌면 옮기기 · 휠·두 손가락 = 확대)</span></>} />
            )}
            <div className="jrx-wrap">
              <table className="jrx">
                <thead><tr>{t.칸.map((k) => <th key={k} title={치수칸종류(k) && 도.모델 ? '도면에서 받음: ' + 치수칸종류(k) : ''}>{k}{치수칸종류(k) && 도.모델 ? <i className="gg-pk">●</i> : null}</th>)}<th /></tr></thead>
                <tbody>
                  {t.줄.map((r, i) => (
                    <tr key={i}>
                      {t.칸.map((k, j) => (
                        <td key={k} className={(선택 && 선택.i === i && 선택.k === k && 도.모델 ? 'jrx-on ' : '') + ((찍음[i] || {})[k] && (찍음[i] || {})[k].length ? 'jrx-pk' : '')}>
                          {k === '부재' && 부재들.length ? (
                            <select value={r[j]} onChange={(e) => 표바꿈(i, j, e.target.value)}>
                              <option value="">고르기</option>
                              {[...new Set([...부재들, r[j]].filter(Boolean))].map((b) => <option key={b}>{b}</option>)}
                            </select>
                          ) : (
                            <input value={r[j]} onChange={(e) => 표바꿈(i, j, e.target.value)}
                                   onFocus={() => { set선택({ i, k }); set두점(null); set알림({ 글: '' }) }}
                                   aria-label={(i + 1) + '번 줄 ' + k}
                                   inputMode={/^(개소|A1|A2|L|W|H|A)$/.test(k) ? 'decimal' : 'text'}
                                   className={k === '비고' || k === '부재' ? 'w' : ''} />
                          )}
                        </td>
                      ))}
                      <td><button type="button" className="jrx-x" onClick={() => 줄지우기(i)} aria-label="줄 지우기">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="btn-row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn ghost sm" onClick={줄더하기}>＋ 줄 더하기</button>
              <button type="button" className="btn ghost sm" onClick={견본줄}>견본 12줄 불러오기</button>
              <button type="button" className="btn ghost sm" onClick={() => { set표(null); set찍음([]); set선택(null); setOut(null); set결과책(null) }}>비우기</button>
            </div>
            {!book && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>재료표를 먼저 고르시면 «부재» 칸이 고르는 칸으로 바뀝니다.</div>}
          </>
        ) : (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              첫 줄이 칸 이름이고 <b>«부재» 칸</b>이 꼭 있어야 합니다. 엑셀(.xlsx)은 첫 시트를 읽습니다.
            </p>
            <div
              className={`tldrop${unit ? ' on' : ''}`}
              onClick={() => uRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); takeUnit(e.dataTransfer?.files?.[0]) }}
            >
              <input ref={uRef} type="file" accept=".csv,.txt,.xlsx" hidden
                     onChange={(e) => { takeUnit(e.target.files?.[0]); e.target.value = '' }} />
              {unit
                ? <><b>{unit.name}</b><span>{kb(unit.size)} KB · {unit.n}줄</span></>
                : <><b>＋ 치수표를 끌어 놓거나 누르십시오</b><span>.csv · .xlsx</span></>}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              칸 모양이 궁금하시면: <a href={치수견본} download>치수표 견본(CSV)</a>
            </div>
          </>
        )}
      </div>

      {busy && <div className="card muted">{busy}</div>}
      {err && <div className="card cwarn">⚠️ {err}</div>}

      {/* ── ③ 만들기 ── */}
      <div className="card">
        <div className="sec-title">③ 만들기</div>
        <button className="btn primary" disabled={!ready} onClick={run}>
          🧮 수량산출서 만들기
        </button>
        {!ready && !busy && (
          <div className="muted" style={{ marginTop: 8 }}>
            {!book ? '재료표를 고르시면' : '치수를 한 줄 이상 적으시면'} 켜집니다.
          </div>
        )}
      </div>

      {/* ── 결과 ── */}
      {out && (
        <div className="card">
          <div className="sec-title">
            {out.serious ? '나왔습니다 — 다만 «꼭 보셔야 할 것»이 있습니다' : '나왔습니다'}
          </div>
          <p style={{ marginTop: 0 }}>
            치수 <b>{out.units}줄</b> 에서 산출서 <b>{out.rows}줄</b> 이 나왔습니다.{' '}
            {out.serious
              ? <b style={{ color: '#c00000' }}>✕ 표시가 {out.serious}가지 있습니다. 아래를 보시고 고친 뒤 다시 돌리십시오.</b>
              : <span>✕ 표시는 없습니다.</span>}
          </p>
          <button type="button" className="btn primary" style={{ width: 'auto' }} onClick={엑셀받기}>⬇ 수량산출서.xlsx 받기{Object.keys(고침).length ? ` (고친 칸 ${Object.keys(고침).length}개 넣어서)` : ''}</button>
          <p className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.8 }}>
            시트 다섯 장입니다 — <b>산출서</b>(줄마다 산출근거와 수량) ·{' '}
            <b>집계</b>(재료별 합계) · <b>태그별</b>(공구·측점·공종별) ·{' '}
            <b>검산</b>(걸린 것) · <b>쓴표</b>(무엇을 보고 셌는지).
            수량 칸은 <b>=ROUND(산출근거,3)</b> 수식입니다. 치수를 고치면 엑셀에서 바로 다시 셉니다.
          </p>
          <ChecksTable checks={out.checks} warns={out.warns} />
        </div>
      )}
      {/* ── 📄 화면에서 보고 · 고치고 · 인쇄 (2026-09-27) ── */}
      {out && 결과책 && (
        <div className="card">
          <div className="sec-title">화면에서 보고 · 고치고 · 인쇄</div>
          <p className="muted" style={{ marginTop: 0, fontSize: 12.5 }}>엑셀을 받지 않아도 산출서·집계를 여기서 보고 인쇄합니다. 칸을 고치면 집계가 따라 바뀝니다.
            <b> 치수를 고쳐 다시 세면 화면에서 고친 칸은 지워집니다.</b></p>
          <Suspense fallback={<div className="note sm">화면을 준비하는 중…</div>}>
            <엑셀화면 책={결과책.책} 시트들={['산출서', '집계', '태그별', '검산']} 고침={고침} set고침={set고침}
              머리행들={{ 산출서: 1, 집계: 1, 태그별: 1, 검산: 1 }} 이름="수량산출서" />
          </Suspense>
        </div>
      )}

      {/* ── 알아 두실 것 ── */}
      <div className="card">
        <div className="sec-title">알아 두실 것</div>
        <ul className="flist">
          <li><b>단가는 내지 않습니다.</b> 수량과 산출근거까지입니다.
            표준품셈 · 물가정보 · 노임단가는 유료 자료라 싣지 않습니다</li>
          <li><b>무엇을 누를지는 사람이 정합니다.</b> 도면의 선이 무엇을 뜻하는지는 도면마다 달라서,
            프로그램은 «누른 선·치수·글자의 값» 만 정확히 옮깁니다. 도면에 적힌 표(철근 재료표·횡단면 면적 등)는
            <Link to="/jeoksan/auto">도면 물량 자동</Link>에서 누르지 않고 바로 뽑습니다</li>
          <li>견본 재료표의 환산·할증 값은 <b>쓰시는 기준으로 고쳐 쓰는 자리</b>입니다. 그대로 쓰시면 견본 값으로 셉니다</li>
          <li>철근 단위중량(<b>KS D 3504</b>)만 값표에 들어 있습니다. 표준 규격이라 그렇습니다</li>
          <li><b>검산 시트를 꼭 보십시오.</b> 밀리미터를 그대로 넣었거나, 번호가 겹쳤거나,
            공제가 본체보다 크면 거기 적힙니다. 수량은 «틀려도 숫자처럼 보입니다»</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <Link className="btn ghost" to="/jeoksan/golgo">🏗 골조 — 도면 넣으면 자동</Link>
          <Link className="btn ghost" to="/jeoksan/magam">🧱 마감 — 방마다 바닥·벽·천장</Link>
          <Link className="btn ghost" to="/jeoksan/auto">⚡ 도면 물량 자동</Link>
          <Link className="btn ghost" to="/jeoksan">🧮 K-적산이 무엇인지</Link>
          <Link className="btn ghost" to="/tools/dxf3d">📦 도면 3D 보기</Link>
          <Link className="btn ghost" to="/tools">🧰 다른 도구</Link>
        </div>
      </div>
    </>
  )
}

/* 검산·알림을 한 표로. ✕ 는 위로 올립니다 — 아래 있으면 아무도 안 봅니다. */
function ChecksTable({ checks, warns }) {
  const SERIOUS = { 부재없음: 1, 재료표없음: 1, 셈못함: 1, 조건오류: 1, 번호겹침: 1 }
  const all = checks
    .concat(warns.map(([a, b, c]) => [(SERIOUS[a] ? '✕ ' : '△ ') + a, b, c]))
    .filter(([k]) => !String(k).startsWith('○'))
  if (!all.length) return <div className="muted" style={{ marginTop: 8 }}>검산에서 걸린 것이 없습니다.</div>
  all.sort((a, b) => (String(b[0]).startsWith('✕') ? 1 : 0) - (String(a[0]).startsWith('✕') ? 1 : 0))
  return (
    <div className="tlprev" style={{ marginTop: 12 }}>
      <table className="tbl left">
        <thead><tr><th style={{ width: 96 }}>구분</th><th style={{ width: 130 }}>어디</th><th>무슨 일</th></tr></thead>
        <tbody>
          {all.slice(0, 60).map(([k, w, m], i) => (
            <tr key={i} style={String(k).startsWith('✕') ? { color: '#c00000' } : undefined}>
              <td>{k}</td><td>{w}</td><td>{m}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {all.length > 60 && (
        <div className="muted" style={{ marginTop: 6 }}>
          …그리고 {all.length - 60}가지 더. <b>전부 엑셀의 「검산」 시트에 있습니다.</b>
        </div>
      )}
    </div>
  )
}

/* 엑셀이 낸 CSV 는 아직도 cp949(euc-kr) 가 흔합니다. UTF-8 로 못 읽으면 그쪽으로 다시 읽습니다. */
function decodeKo(buf) {
  const u8 = new Uint8Array(buf)
  try {
    const s = new TextDecoder('utf-8', { fatal: true }).decode(u8)
    return s.replace(/^﻿/, '')
  } catch {
    try { return new TextDecoder('euc-kr').decode(u8) } catch { /* 아래로 */ }
    return new TextDecoder('utf-8').decode(u8).replace(/^﻿/, '')
  }
}

/* 화면 표 한 줄 — 번호만 채워 둡니다 */
function 빈줄(칸, n) { return 칸.map((k) => (k === '번호' ? String(n) : '')) }
/* CSV 한 칸 — 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감쌉니다 */
function csv칸(v) {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
/* 엑셀 치수표 → CSV 글 (첫 시트). qto.js 의 xlsx 읽기를 그대로 씁니다.
   ⚠️ 받는 이름을 readWorkbook 으로 두면 tools/checkimports.py 가 «import 안 하고 씀» 으로 봐서
      배포가 통째로 멈춥니다 (2026-09-26 G15·G16 두 번 멈춤). 그래서 «읽기» 로 받습니다. */
function 엑셀을글로(읽기, buf) {
  const 시트 = 읽기(buf)
  const 첫 = Object.values(시트)[0] || []
  return 첫.map((r) => (r || []).map(csv칸).join(',')).join('\n')
}
