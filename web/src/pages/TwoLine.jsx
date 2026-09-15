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
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'

const LABELS = ['당초', '변경', '증감']

function fmt(n) { return new Intl.NumberFormat('ko-KR').format(n) }

export default function TwoLine() {
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
  const inputRef = useRef(null)

  const loadLib = useCallback(async () => {
    if (lib) return lib
    const m = await import('../lib/xlsx2line.js')
    setLib(m)
    return m
  }, [lib])

  const openFile = useCallback(async (f) => {
    if (!f) return
    setErr(''); setOut(null); setBook(null); setJobs([])
    if (!/\.(xlsx|xlsm)$/i.test(f.name)) {
      setErr(/\.xls$/i.test(f.name)
        ? '구형 엑셀(.xls)은 아직 못 읽습니다. 엑셀에서 «다른 이름으로 저장 → Excel 통합 문서(.xlsx)» 한 뒤 올려 주십시오.'
        : '엑셀 파일(.xlsx / .xlsm)만 됩니다.')
      return
    }
    setBusy('파일을 읽는 중입니다…')
    try {
      const m = await loadLib()
      const buf = await f.arrayBuffer()
      const b = m.analyze(buf)
      setFile({ name: f.name, size: f.size, buf })
      setBook(b)
      setJobs(b.sheets.map((s, i) => ({
        path: s.path, name: s.name, on: i === 0,
        startRow: s.guessStart, endRow: s.guessEnd,
        labelCol: m.suggestLabelCol(b.zip, s.path, s.guessStart, s.guessEnd, 16),
      })))
    } catch (e) {
      setErr(e?.message || '파일을 읽지 못했습니다.')
    } finally { setBusy('') }
  }, [loadLib])

  const onDrop = (e) => { e.preventDefault(); openFile(e.dataTransfer?.files?.[0]) }

  const setJob = (i, patch) => setJobs((js) => js.map((j, k) => (k === i ? { ...j, ...patch } : j)))

  const chosen = jobs.filter((j) => j.on)

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
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const base = file.name.replace(/\.(xlsx|xlsm)$/i, '')
      setOut({ url, name: `${base}_${lines}줄.xlsx`, report: res.report })
    } catch (e) {
      setErr(e?.message || '바꾸다가 멈췄습니다. 파일을 한 번 더 확인해 주십시오.')
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
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🔁 설계변경 2줄 자동변환</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          공사 내역서 엑셀을 올리면 <b>당초 · 변경</b> 두 줄로 벌려 드립니다.
          당초는 검정, 변경은 <b style={{ color: '#c00000' }}>적색</b>입니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          <b>파일은 이 브라우저 안에서만 다룹니다.</b> 서버로 올라가지 않습니다.
        </p>
      </div>

      {/* ── 우리만 하는 것 ── */}
      <div className="card">
        <div className="sec-title">다른 변환기와 다른 점</div>
        <ul className="flist">
          <li><b>합계를 갈라 줍니다.</b> 줄이 늘면 <code>SUM</code>이 당초와 변경을 <b>두 번 더합니다.</b>{' '}
            라벨 열을 두고 <code>SUMIF</code>로 바꿔 <b>당초 합계 · 변경 합계</b>를 따로 냅니다.</li>
          <li><b>증감 줄(3줄)</b> — 「변경 − 당초」 수식을 넣어 드립니다.</li>
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
            onChange={(e) => openFile(e.target.files?.[0])}
          />
          {file
            ? <><b>{file.name}</b><span>{fmt(Math.round(file.size / 1024))} KB · 다른 파일을 올리려면 누르십시오</span></>
            : <><b>＋ 엑셀 파일을 끌어 놓거나 누르십시오</b><span>.xlsx · .xlsm — 구형 .xls 는 xlsx 로 저장해서 올려 주십시오</span></>}
        </div>
        {busy && <div className="muted" style={{ marginTop: 8 }}>{busy}</div>}
        {err && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {err}</div>}
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
              <div className={`tlrow${j.on ? ' on' : ''}`} key={j.path}>
                <label className="tlchk">
                  <input type="checkbox" checked={j.on} onChange={(e) => setJob(i, { on: e.target.checked })} />
                  <b>{j.name}</b>
                </label>
                <span className="tlfields">
                  <label>시작 행 <input type="number" min="1" value={j.startRow}
                    onChange={(e) => setJob(i, { startRow: +e.target.value })} /></label>
                  <label>끝 행 <input type="number" min="1" value={j.endRow}
                    onChange={(e) => setJob(i, { endRow: +e.target.value })} /></label>
                  <label>라벨 열 <input type="text" size="2" maxLength="3" value={j.labelCol}
                    onChange={(e) => setJob(i, { labelCol: e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase() })} /></label>
                </span>
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
                    {r.cells.slice(0, 9).map((c, j) => <td key={j}>{String(c).slice(0, 18)}</td>)}
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
          <li><b>다른 시트에서 이 시트를 가리키는 수식</b>은 따라 옮기지 못합니다. 그런 수식이 있으면 확인해 주십시오.</li>
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
