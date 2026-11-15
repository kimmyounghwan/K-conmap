/**
 * /change/twoline — 「설계변경 2줄 자동변환」 (2026-09-15)
 *
 * 소장님: 「이것도 만들 수 있어? 더 좋게, 더 많은 기능이 들어 가게」
 *
 * ■ 왜 필요한가
 *    설계변경이 승인되면 당초와 변경을 한 부의 내역서에 나란히 적어 냅니다.
 *    품목마다 행을 하나 더 만들고 옮겨 적는 일인데, 수백 줄이면 손으로 못 합니다.
 *
 * ■ 남들과 다르게 만든 지점 — 여기가 핵심입니다
 *    ① **합계를 갈라 줍니다.** 줄이 늘면 SUM 이 당초+변경을 «두 번» 더합니다.
 *       라벨 열을 두고 SUMIF 로 바꿔 당초 합계·변경 합계를 따로 냅니다.
 *    ② **증감 줄(3줄)** — 변경−당초 수식을 넣습니다. 남의 것은 2줄에서 끝납니다.
 *    ③ **검산 목록** — 못 고친 수식을 숨기지 않고 보여 줍니다.
 *    ④ 서식을 라이브러리로 «다시 쓰지» 않고 xlsx 안에서 필요한 XML 만 고칩니다.
 *       그래서 인쇄영역·매크로·조건부서식·그림이 그대로 남습니다.
 *
 * ■ 파일은 브라우저 안에서만 다룹니다. 서버로 올라가지 않습니다.
 *
 * ■ G687 (2026-11-15) «2줄 → 1줄» 을 같은 화면에 — 소장님 「1줄로 되게 만들어 줘」 · 「한 줄로 해야 해. 2줄로 하는 데서 1줄로 하는 것도 둬」
 *    맨 위 두 단추(1줄 → 2줄 · 2줄 → 1줄 · 주소 ?m=1) · 1줄 → 2줄은 전 그대로(두줄판) · 2줄 → 1줄은 ../한줄로판.jsx
 *    · 1줄 → 2줄에 이미 2줄인 파일을 놓으면 «2줄 → 1줄로 이 파일 열기» 안내 · 두 쪽 다 🧪 예시 파일(지어낸 공사 · tools/build_2줄예시.py)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { askAfter } from '../AskComment'
import 한줄로판 from '../한줄로판.jsx'

import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 세기 } from '../lib/받은수.jsx'   /* 🔢 G377 쓴 횟수 — |2줄|2줄 · |2줄|3줄 · |2줄|xlsm · |2줄|멈춤 (받은 것은 받은수가 따로 셈) */
const LABELS = ['당초', '변경', '증감']
/* 🩹 G377 (2026-10-22) 매크로 든 내역서(.xlsm)를 «_2줄.xlsx» 로 내보내면 엑셀이 «파일 형식 또는 확장명이 잘못되었다» 며 안 엽니다
   (안의 통합 문서 종류는 그대로 «매크로 사용» 이라 이름과 안이 어긋남). 안을 보고 같은 확장자 · 종류로 내보냅니다.
   G378 — 80% 비율도 같은 꼴이라 lib/엑셀종류.js 한 곳으로 옮김 */
import { XLSX, XLSM, 매크로인가 } from '../lib/엑셀종류.js'

function fmt(n) { return new Intl.NumberFormat('ko-KR').format(n) }
const 예시1줄 = '/tools/files/ex-twoline-1line.xlsx'
const 예시1줄이름 = '가상_솔바람마을_내역서.xlsx'

export default function TwoLine() {
  const [sp, setSp] = useSearchParams()
  const 모드 = sp.get('m') === '1' ? '1' : '2'
  const [넘김, set넘김] = useState(null)       /* 다른 쪽으로 넘길 파일 {name, size, buf, 예시} */
  const 바꿈 = useCallback((m, 파일 = null) => {
    set넘김(파일 && 파일.buf ? { ...파일, t: Date.now() } : null)
    const n = new URLSearchParams(sp)
    if (m === '1') n.set('m', '1'); else n.delete('m')
    setSp(n)
  }, [sp, setSp])
  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🔁 설계변경 2줄 · 1줄 자동변환</h1>
        <div className="tlmode" role="tablist" aria-label="바꾸는 쪽">
          <button type="button" role="tab" aria-selected={모드 === '2'} className={모드 === '2' ? 'on' : ''} onClick={() => 모드 !== '2' && 바꿈('2')}>
            <b>1줄 → 2줄</b><span>당초 · 변경 벌리기</span>
          </button>
          <button type="button" role="tab" aria-selected={모드 === '1'} className={모드 === '1' ? 'on' : ''} onClick={() => 모드 !== '1' && 바꿈('1')}>
            <b>2줄 → 1줄</b><span>변경 줄만 남기기</span>
          </button>
        </div>
        {모드 === '1' ? (
          <p className="why2" style={{ marginBottom: 6 }}>
            당초 · 변경 <b>2줄 변경내역서</b>를 올리면 짝마다 <b>변경 줄 하나</b>만 남긴 1줄 내역서로 줄여 드립니다.
            서식 · 인쇄 · 결재란은 원본 그대로입니다.
          </p>
        ) : (
          <p className="why2" style={{ marginBottom: 6 }}>
            공사 내역서 엑셀을 올리면 <b>당초 · 변경</b> 두 줄로 벌려 드립니다.
            당초는 검정, 변경은 <b className="tlred">적색</b>입니다.
          </p>
        )}
        <p className="muted" style={{ margin: 0 }}>
          <b>파일은 이 브라우저 안에서만 다룹니다.</b> 서버로 올라가지 않습니다.
        </p>
      </div>
      {모드 === '1'
        ? <한줄로판 key="1" 처음파일={넘김} 바꿈={바꿈} />
        : <두줄판 key="2" 처음파일={넘김} 바꿈={바꿈} />}
    </>
  )
}

/* ── 1줄 → 2줄 (전 화면 그대로 · G687 에서 함수만 나눔) ── */
function 두줄판({ 처음파일 = null, 바꿈 }) {
  const [lib, setLib] = useState(null)        /* 무겁습니다 — 파일을 올릴 때 받아옵니다 */
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [file, setFile] = useState(null)      /* {name, size, buf} */
  const [book, setBook] = useState(null)      /* {sheets, zip} */
  const [jobs, setJobs] = useState([])        /* [{path,name,on,startRow,endRow,labelCol}] */
  const [lines, setLines] = useState(2)
  const [color, setColor] = useState('blackred')
  const [diff, setDiff] = useState(true)
  const [out, setOut] = useState(null)        /* {url,name,report} */
  const [두줄임, set두줄임] = useState(null)   /* G687 이미 2줄인 파일 — {시트: '내역서 · 원가계산서', 짝} */
  const inputRef = useRef(null)

  const loadLib = useCallback(async () => {
    if (lib) return lib
    const m = await import('../lib/xlsx2line.js')
    setLib(m)
    return m
  }, [lib])

  const openFile = useCallback(async (f) => {
    if (!f) return
    setErr(''); setOut(null); setBook(null); setJobs([]); set두줄임(null)
    if (!/\.(xlsx|xlsm)$/i.test(f.name)) {
      setErr(/\.xls$/i.test(f.name)
        ? '구형 엑셀(.xls)은 아직 못 읽습니다. 엑셀에서 «다른 이름으로 저장 → Excel 통합 문서(.xlsx)» 한 뒤 올려 주십시오.'
        : '엑셀 파일(.xlsx / .xlsm)만 됩니다.')
      return
    }
    setBusy('파일을 읽는 중입니다…')
    try {
      const m = await loadLib()
      const buf = f.buf || await f.arrayBuffer()
      const b = m.analyze(buf)
      setFile({ name: f.name, size: f.size, buf, 예시: !!f.예시 })
      setBook(b)
      /* G687 — 이미 당초 · 변경 2줄인 파일이면 «2줄 → 1줄» 을 알려 드림(벌리면 네 줄이 됩니다) */
      import('../lib/xlsx1line.js').then((l) => {
        try {
          const 살 = l.살펴보기(buf)
          const 확 = 살.sheets.filter((s) => s.확실)
          if (확.length) set두줄임({ 시트: 확.map((s) => s.name).slice(0, 3).join(' · '), 짝: 확.reduce((n, s) => n + s.짝, 0) })
        } catch (e) { /* 안내만 — 못 살펴도 그대로 */ }
      }).catch(() => {})
      /* 실제 내역서 파일은 «원가계산서 · 내역서 · 일위대가 · 단가산출» 처럼 여러 장입니다.
         2줄로 벌릴 것은 보통 «내역» 이 들어간 시트라, 그것부터 켜 둡니다.
         (없으면 첫 시트) — 물론 손으로 다시 고르실 수 있습니다. */
      const wanted = b.sheets.map((s) => /내\s*역|산출내역|공내역/.test(s.name))
      const anyWanted = wanted.some(Boolean)
      setJobs(b.sheets.map((s, i) => ({
        path: s.path, name: s.name,
        /* ⚠️ «자기 합계 열쇠»(SUMIF)를 쓰는 시트는 줄을 벌릴 수 없습니다.
              벌리면 합계가 두 번 세어져 총액이 틀립니다 — 켜지지 않게 막습니다.
              2026-09-16: 실제로 총액이 1,034,244원 -> 0원이 된 적이 있습니다. */
        keySum: s.keySum || 0,
        on: s.keySum ? false : (anyWanted ? wanted[i] : i === 0),
        startRow: s.guessStart, endRow: s.guessEnd,
        labelCol: m.suggestLabelCol(b.zip, s.path, s.guessStart, s.guessEnd, 16),
      })))
    } catch (e) {
      setErr(e?.message || '파일을 읽지 못했습니다.')
    } finally { setBusy('') }
  }, [loadLib])

  const onDrop = (e) => { e.preventDefault(); openFile(e.dataTransfer?.files?.[0]) }

  /* «2줄 → 1줄» 에서 «1줄 → 2줄로 이 파일 열기» 로 넘어온 파일 */
  useEffect(() => {
    if (처음파일 && 처음파일.buf) openFile({ name: 처음파일.name, size: 처음파일.size, buf: 처음파일.buf, 예시: 처음파일.예시 })
  }, [처음파일]) // eslint-disable-line react-hooks/exhaustive-deps

  const 예시 = async () => {
    setErr('')
    setBusy('예시 파일을 받는 중입니다…')
    try {
      const r = await fetch(예시1줄, { cache: 'no-store' })
      if (!r.ok) throw new Error('예시 파일을 받지 못했습니다. 잠시 뒤 다시 눌러 주십시오.')
      const buf = await r.arrayBuffer()
      세기('|2줄|예시')
      setBusy('')
      await openFile({ name: 예시1줄이름, size: buf.byteLength, buf, 예시: true })
    } catch (e) { setErr(e?.message || '예시 파일을 받지 못했습니다.'); setBusy('') }
  }

  const setJob = (i, patch) => setJobs((js) => js.map((j, k) => (k === i ? { ...j, ...patch } : j)))

  const chosen = jobs.filter((j) => j.on && !j.keySum)

  /* ── 미리보기 — 실제로 바꾸기 전에 «이렇게 됩니다» 를 보여 줍니다 ── */
  const preview = useMemo(() => {
    if (!lib || !book || !chosen.length) return null
    const j = chosen[0]
    const g = lib.readGrid(book.zip, j.path, Math.max(1, j.startRow - 1), Math.min(j.endRow, j.startRow + 3), 10)
    const labCol = j.labelCol ? lib.colToNum(j.labelCol) : 0
    const rows = []
    for (const r of g.rows) {
      const inRange = r.r >= j.startRow && r.r <= j.endRow
      const filled = r.cells.some((c) => String(c).trim())
      if (!inRange || !filled) { rows.push({ k: -1, cells: r.cells }); continue }
      for (let k = 0; k < lines; k++) {
        const cells = r.cells.slice()
        if (k === 2) for (let i = 0; i < cells.length; i++) {
          cells[i] = r.nums?.[i] ? '= 변경 − 당초' : ''
        }
        if (labCol) cells[labCol - 1] = LABELS[k]
        rows.push({ k, cells })
      }
    }
    return rows.slice(0, 12)
  }, [lib, book, chosen, lines])

  const run = async () => {
    if (!file || !chosen.length) return
    setBusy('바꾸는 중입니다…'); setErr('')
    if (out?.url) { try { URL.revokeObjectURL(out.url) } catch { /* 지나갑니다 */ } }
    setOut(null)
    /* 큰 파일은 셈하는 동안 화면이 멈춥니다 — «바꾸는 중» 을 먼저 그리게 한 박자 쉽니다 */
    await new Promise((r) => setTimeout(r, 40))
    try {
      const m = await loadLib()
      const res = m.convert(file.buf, {
        sheets: chosen.map((j) => ({
          path: j.path,
          startRow: Math.max(1, +j.startRow || 1),
          endRow: Math.max(0, +j.endRow || 0),
          labelCol: (j.labelCol || '').toUpperCase(),
        })),
        lines, color, diffFormula: diff, labels: LABELS,
      })
      const 매크로 = 매크로인가(book && book.zip, file.name)
      const blob = new Blob([res.data], { type: 매크로 ? XLSM : XLSX })
      const url = URL.createObjectURL(blob)
      const base = file.name.replace(/\.(xlsx|xlsm)$/i, '')
      setOut({ url, name: `${base}_${lines}줄.${매크로 ? 'xlsm' : 'xlsx'}`, report: res.report })
      세기('|2줄|' + lines + '줄')
      if (매크로) 세기('|2줄|xlsm')
    } catch (e) {
      setErr(e?.message || '바꾸다가 멈췄습니다. 파일을 한 번 더 확인해 주십시오.')
      세기('|2줄|멈춤')
    } finally { setBusy('') }
  }

  const download = () => {
    if (!out) return
    const a = document.createElement('a')
    a.href = out.url; a.download = out.name
    document.body.appendChild(a); a.click(); a.remove()
    try { askAfter('change') } catch { /* 사생활 보호 모드 */ }
  }

  return (
    <>
      {/* ── 우리만 하는 것 ── */}
      <div className="card">
        <div className="sec-title">다른 변환기와 다른 점</div>
        <ul className="flist">
          <li><b>합계를 갈라 줍니다.</b> 줄이 늘면 <code>SUM</code>이 당초와 변경을 <b>두 번 더합니다.</b>{' '}
            라벨 열을 두고 <code>SUMIF</code>로 바꿔 <b>당초 합계 · 변경 합계</b>를 따로 냅니다.</li>
          <li><b>증감 줄(3줄)</b> — 「변경 − 당초」 수식을 넣어 드립니다.</li>
          <li><b>시트끼리 줄을 짝지어 줍니다.</b> 원가계산서가 <code>=내역서!G9</code>로 합계를 끌어올 때,
            <b>두 시트를 같이 고르면</b> 당초 줄은 내역서의 당초 합계를, 변경 줄은 변경 합계를 보게 고칩니다.
            고르지 않은 시트는 «당초» 줄을 보게만 옮깁니다(값은 원본 그대로).
            식 안에 든 합(조달수수료 · 공구손료 같은 %줄)도 줄별로 갈라 «두 번 셈» 이 없습니다.</li>
          <li><b>검산 목록</b> — 못 고친 수식을 <b>숨기지 않고</b> 알려 드립니다.</li>
          <li><b>서식이 그대로</b> — 파일을 다시 쓰지 않고 필요한 부분만 고칩니다.
            인쇄영역 · 병합셀 · 조건부서식 · 그림 · 매크로가 남습니다.</li>
        </ul>
      </div>

      {/* ── ① 파일 ── */}
      <div className="card">
        <div className="sec-title">① 엑셀 파일 올리기</div>
        <div
          className={`tldrop${file ? ' on' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <input
            ref={inputRef} type="file" accept=".xlsx,.xlsm" hidden
            onChange={(e) => { openFile(e.target.files?.[0]); e.target.value = '' }}
          />
          <끌어놓기판 글="내역서(엑셀)를 놓으면 엽니다" 길들={[{ 꼴: /\.(xlsx|xlsm)$/i, 받기: (fs) => openFile(fs[0]) }]} />
          {file
            ? <><b>{file.name}</b><span>{fmt(Math.round(file.size / 1024))} KB{file.예시 ? ' · 🧪 예시(지어낸 공사)' : ''} · 다른 파일을 올리려면 누르십시오</span></>
            : <><b>＋ 엑셀 파일을 끌어 놓거나 누르십시오</b><span>.xlsx · .xlsm — 구형 .xls 는 xlsx 로 저장해서 올려 주십시오</span></>}
        </div>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn ghost sm tl2-ex" onClick={예시} disabled={!!busy}>🧪 예시 내역서로 해 보기</button>
        </div>
        {busy && <div className="muted" style={{ marginTop: 8 }}>{busy}</div>}
        {err && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {err}</div>}
        {두줄임 && (
          <div className="cwarn tl2-already" style={{ marginTop: 8 }}>
            ⚠️ 이 파일은 이미 <b>당초 · 변경 2줄</b>입니다(«{두줄임.시트}» 짝 {fmt(두줄임.짝)}개) — 여기서 벌리면 줄이 또 늘어납니다.
            1줄로 줄이시려면{' '}
            {바꿈 && file
              ? <button type="button" className="btn ghost sm" onClick={() => 바꿈('1', file)}>2줄 → 1줄로 이 파일 열기 ▸</button>
              : '«2줄 → 1줄» 을 쓰십시오.'}
          </div>
        )}
      </div>

      {/* ── ② 시트와 구간 ── */}
      {book && (
        <div className="card">
          <div className="sec-title">② 바꿀 시트와 자료 구간</div>
          <p className="muted" style={{ marginTop: 0 }}>
            <b>합계 행까지 구간에 넣으십시오.</b> 그래야 합계도 당초 · 변경으로 갈라집니다.
          </p>
          <div className="tlsheets">
            {jobs.map((j, i) => (
              <div className={`tlrow${j.on && !j.keySum ? ' on' : ''}`} key={j.path}>
                <label className="tlchk">
                  <input type="checkbox" checked={j.on && !j.keySum} disabled={!!j.keySum}
                         onChange={(e) => setJob(i, { on: e.target.checked })} />
                  <b style={j.keySum ? { color: '#c00000' } : undefined}>{j.name}</b>
                </label>
                {j.keySum ? (
                  <span className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
                    <b style={{ color: '#c00000' }}>이 시트는 못 바꿉니다.</b>{' '}
                    합계를 <b>자기 열쇠 칸</b>으로 찾아 더하고 있습니다(SUMIF {j.keySum}곳).
                    줄을 벌리면 같은 열쇠가 두 벌이 되어 <b>합계가 두 번 세어집니다</b> —
                    파일은 멀쩡히 열리는데 <b>총액만 틀립니다.</b>{' '}
                    적산 프로그램이 만든 내역서에 흔한 모양입니다.
                  </span>
                ) : (
                <span className="tlfields">
                  <label>시작 행 <input type="number" min="1" value={j.startRow}
                    onChange={(e) => setJob(i, { startRow: +e.target.value })} /></label>
                  <label>끝 행 <input type="number" min="1" value={j.endRow}
                    onChange={(e) => setJob(i, { endRow: +e.target.value })} /></label>
                  <label>라벨 열 <input type="text" size="2" maxLength="3" value={j.labelCol}
                    onChange={(e) => setJob(i, { labelCol: e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase() })} /></label>
                </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ③ 방식 ── */}
      {book && (
        <div className="card">
          <div className="sec-title">③ 어떻게 벌릴까요</div>
          <div className="tlopts">
            <div>
              <b>줄 수</b>
              <label><input type="radio" checked={lines === 2} onChange={() => setLines(2)} /> 2줄 — 당초 · 변경</label>
              <label><input type="radio" checked={lines === 3} onChange={() => setLines(3)} /> 3줄 — 당초 · 변경 · <b>증감</b></label>
            </div>
            <div>
              <b>색</b>
              <label><input type="radio" checked={color === 'blackred'} onChange={() => setColor('blackred')} /> 당초 검정 · 변경 적색</label>
              <label><input type="radio" checked={color === 'none'} onChange={() => setColor('none')} /> 색 없이 (원본 그대로)</label>
            </div>
            {lines === 3 && (
              <div>
                <b>증감</b>
                <label><input type="checkbox" checked={diff} onChange={(e) => setDiff(e.target.checked)} /> 「변경 − 당초」 수식 넣기</label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 미리보기 ── */}
      {preview && preview.length > 0 && (
        <div className="card">
          <div className="sec-title">미리보기 — 이렇게 됩니다</div>
          <div className="tlprev">
            <table className="tbl left">
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className={r.k === 1 ? 'tlchg' : r.k === 2 ? 'tldif' : ''}>
                    {/* 🩹 G377 긴 수식은 «…» 로 — 전엔 18자에서 그냥 잘려 «=ROUNDDOWN(E5*F5,0» 처럼 괄호가 빠진 «깨진 수식» 으로 보였음 */}
                    {r.cells.slice(0, 9).map((c, j) => { const t = String(c); return <td key={j} title={t.length > 18 ? t : undefined}>{t.length > 18 ? t.slice(0, 17) + '…' : t}</td> })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            첫 시트의 앞부분만 보여 드립니다. 실제 파일에는 고른 시트 전부가 바뀝니다.
          </p>
        </div>
      )}

      {/* ── ④ 바꾸기 ── */}
      {book && (
        <div className="card">
          <div className="sec-title">④ 바꿔서 내려받기</div>
          <div className="btn-row">
            <button className="btn primary" disabled={!chosen.length || !!busy} onClick={run}>
              {busy ? '바꾸는 중…' : `${lines}줄로 바꾸기`}
            </button>
            {out && <button className="btn primary" onClick={download}>⬇ {out.name} 내려받기</button>}
          </div>
          {!chosen.length && <p className="muted">바꿀 시트를 하나 이상 고르십시오.</p>}

          {out && (
            <div style={{ marginTop: 12 }}>
              <div className="sec-title" style={{ marginTop: 0 }}>검산</div>
              <ul className="flist">
                {out.report.sheets.map((s, i) => (
                  <li key={i}>
                    <b>{jobs.find((j) => j.path === s.path)?.name || s.path}</b> —
                    자료 {fmt(s.rows)}행을 {lines}줄로 벌려 <b>{fmt(s.made)}행</b>이 되었습니다.
                  </li>
                ))}
              </ul>
              {out.report.warns.length > 0 ? (
                <>
                  <div className="cwarn">⚠️ 손으로 확인하실 곳이 {out.report.warns.length}군데 있습니다.</div>
                  <ul className="flist">
                    {out.report.warns.slice(0, 40).map((w, i) => (
                      <li key={i}><b>{jobs.find((j) => j.path === w.path)?.name || ''} {w.ref}</b> — {w.msg}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="muted">고치지 못한 수식은 없습니다. 그래도 <b>합계와 인쇄영역은 한 번 확인</b>해 주십시오.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 알아 두실 것 ── */}
      <div className="card">
        <div className="sec-title">알아 두실 것</div>
        <ul className="flist">
          <li><b>구형 .xls(97-2003)는 아직 못 읽습니다.</b> 엑셀에서 xlsx 로 저장한 뒤 올려 주십시오.</li>
          <li><b>원가계산서가 내역서 합계를 끌어온다면 두 시트를 «같이» 고르십시오.</b>{' '}
            내역서만 고르면 원가계산서는 «당초» 금액을 보게 옮겨 드립니다 — 변경 · 증감 금액은 원가계산서도 같이 골라야 나옵니다.</li>
          <li>차트가 가리키는 범위는 손대지 않습니다.</li>
          <li>바꾼 파일은 <b>엑셀에서 열 때 한 번 다시 셈합니다.</b> 합계가 잠깐 늦게 뜰 수 있습니다.</li>
        </ul>
        <div className="btn-row">
          <Link className="btn ghost" to="/change">← 설계변경으로</Link>
          <Link className="btn ghost" to="/change/excel">설계변경 통합 엑셀</Link>
          <Link className="btn ghost" to="/qna">이상한 데가 있으면 한 줄</Link>
        </div>
      </div>
    </>
  )
}
