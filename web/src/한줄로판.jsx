/**
 * /change/twoline?m=1 — 「설계변경 2줄 → 1줄」 (G687 · 2026-11-15)
 *
 * 소장님: 「1줄로 되게 만들어 줘」 → 고르심 «원본 꼴 그대로 1줄»
 *        「2줄에서 1줄 작업 할 때 제대로 해 줘. 엉뚱한 걸 한 줄로 하지 말고..」
 *        「한 줄로 해야 해. 2줄로 하는 데서 1줄로 하는 것도 둬」
 *        「2줄에서 마지막 줄 만 한줄로 다시 하는 거 아냐?」 「설계박사도 그렇게 하는 거잖아??」
 *
 * ■ 하는 일 — 당초 · 변경(· 증감) 짝마다 «변경» 줄 하나만 남깁니다(마지막 줄 = 변경).
 *    서식 · 인쇄 영역 · 쪽 나눔 · 결재란 · 병합 · 메모 · 그림 · 매크로는 원본 그대로 · 수식은 남긴 줄끼리 다시 잇습니다(lib/xlsx1line.js).
 * ■ 엉뚱한 줄을 지우지 않게 — 짝이 확실한 시트만 켜 둠 · 의심 시트는 꺼 둠(⚠ 까닭) · 대비표 · 1줄 시트는 그대로 ·
 *    바꾸다가 짝이 엇갈린 수식이 많으면 멈춤(틀린 1줄보다 낫습니다).
 * ■ 파일은 이 브라우저 안에서만 다룹니다. 서버로 올라가지 않습니다.
 * 🔢 쓴 횟수 |2줄|1줄 · |2줄|1줄xlsm · |2줄|1줄당초 · |2줄|1줄멈춤 · |2줄|1줄예시
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from './AskComment'
import { 끌어놓기 as 끌어놓기판 } from './끌어놓기.jsx'
import { 세기 } from './lib/받은수.jsx'
import { XLSX, XLSM, 매크로인가 } from './lib/엑셀종류.js'

const 예시파일 = '/tools/files/ex-twoline-2line.xlsx'
const 예시이름 = '가상_솔바람마을_변경내역서.xlsx'
const 수 = (n) => new Intl.NumberFormat('ko-KR').format(n || 0)
const 짧게 = (t, n = 16) => { const s = String(t ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s }
const 줄이는꼴 = (s) => s.짝 > 0 && s.상태.length >= 2 && s.꼴 !== '대비표' && s.꼴 !== '없음' && s.꼴 !== '1줄'

/* 의심 까닭 — 사람 말로 */
function 의심까닭(s) {
  const 말 = []
  if (s.홀안 > 0) 말.push(`짝 없이 한 줄만 있는 품목이 ${수(s.홀안)}곳`)
  if (s.검사 && s.검사.다름 > Math.max(6, s.검사.같음 * 0.05)) 말.push(`수식 ${수(s.검사.다름)}곳이 다른 상태 줄을 가리킴`)
  if (s.짝 < 3) 말.push(`짝이 ${s.짝}개뿐`)
  if (s.숨은라벨 > 0) 말.push(`구분(당초 · 변경) 칸이 병합 아래 숨은 줄 ${수(s.숨은라벨)}곳`)
  return 말.join(' · ') || '짝 모양이 고르지 않습니다'
}

export default function 한줄로판({ 처음파일 = null, 바꿈 }) {
  const [lib, setLib] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [file, setFile] = useState(null)        /* {name, size, buf, 예시} */
  const [살핀, set살핀] = useState(null)        /* 살펴보기 결과 {sheets, 상태들, 책} */
  const [켬, set켬] = useState({})              /* path → true/false */
  const [남길, set남길] = useState('변경')
  const [잇기, set잇기] = useState(false)       /* 당초 줄만 보던 다른 시트 다시 잇기 */
  const [미리시트, set미리시트] = useState('')
  const [out, setOut] = useState(null)          /* {url, name, report} */
  const inputRef = useRef(null)

  const loadLib = useCallback(async () => {
    if (lib) return lib
    const m = await import('./lib/xlsx1line.js')
    setLib(m)
    return m
  }, [lib])

  const 열기 = useCallback(async (이름, 크기, buf, 예시 = false) => {
    setErr(''); setOut(null); set살핀(null); set켬({})
    setBusy('파일을 살펴보는 중입니다…')
    await new Promise((r) => setTimeout(r, 30))
    try {
      const m = await loadLib()
      const 결과 = m.살펴보기(buf)
      setFile({ name: 이름, size: 크기, buf, 예시 })
      set살핀(결과)
      const 처음 = {}
      for (const s of 결과.sheets) if (줄이는꼴(s)) 처음[s.path] = !!s.확실
      set켬(처음)
      const 첫 = 결과.sheets.find((s) => 처음[s.path]) || 결과.sheets.find(줄이는꼴)
      set미리시트(첫 ? 첫.path : '')
      set남길(결과.상태들.includes('변경') ? '변경' : (결과.상태들.filter((x) => x !== '증감').slice(-1)[0] || '변경'))
    } catch (e) {
      setErr(e?.message || '파일을 읽지 못했습니다.')
    } finally { setBusy('') }
  }, [loadLib])

  const openFile = useCallback(async (f) => {
    if (!f) return
    if (!/\.(xlsx|xlsm)$/i.test(f.name)) {
      setErr(/\.xls$/i.test(f.name)
        ? '구형 엑셀(.xls)은 아직 못 읽습니다. 엑셀에서 «다른 이름으로 저장 → Excel 통합 문서(.xlsx)» 한 뒤 올려 주십시오.'
        : '엑셀 파일(.xlsx / .xlsm)만 됩니다.')
      return
    }
    열기(f.name, f.size, await f.arrayBuffer())
  }, [열기])

  /* 1줄 → 2줄 화면에서 «이 파일은 이미 2줄» 로 넘어온 파일 */
  useEffect(() => {
    if (처음파일 && 처음파일.buf) 열기(처음파일.name, 처음파일.size, 처음파일.buf, !!처음파일.예시)
  }, [처음파일]) // eslint-disable-line react-hooks/exhaustive-deps

  const 예시 = async () => {
    setErr('')
    setBusy('예시 파일을 받는 중입니다…')
    try {
      const r = await fetch(예시파일, { cache: 'no-store' })
      if (!r.ok) throw new Error('예시 파일을 받지 못했습니다. 잠시 뒤 다시 눌러 주십시오.')
      const buf = await r.arrayBuffer()
      세기('|2줄|1줄예시')
      await 열기(예시이름, buf.byteLength, buf, true)
    } catch (e) { setErr(e?.message || '예시 파일을 받지 못했습니다.'); setBusy('') }
  }

  const onDrop = (e) => { e.preventDefault(); openFile(e.dataTransfer?.files?.[0]) }

  const 줄일시트 = 살핀 ? 살핀.sheets.filter(줄이는꼴) : []
  const 고른 = 줄일시트.filter((s) => 켬[s.path])
  const 남길후보 = 살핀 ? 살핀.상태들.filter((x) => x !== '증감') : []
  const 미리 = useMemo(() => {
    if (!lib || !살핀 || !미리시트) return []
    try { return lib.미리줄(살핀, 미리시트, 남길, 3) } catch (e) { return [] }
  }, [lib, 살핀, 미리시트, 남길])
  const 미리칸수 = useMemo(() => {
    /* 빈 칸만 이어지는 오른쪽은 잘라 보임 */
    let n = 0
    for (const d of 미리) {
      for (const z of d.줄) z.cells.forEach((t, i) => { if (String(t).trim()) n = Math.max(n, i + 1) })
      d.결과.forEach((t, i) => { if (String(t).trim()) n = Math.max(n, i + 1) })
    }
    return Math.max(4, n)
  }, [미리])

  const run = async () => {
    if (!file || !고른.length) return
    setBusy('1줄로 바꾸는 중입니다…'); setErr('')
    if (out?.url) { try { URL.revokeObjectURL(out.url) } catch { /* 지나갑니다 */ } }
    setOut(null)
    await new Promise((r) => setTimeout(r, 40))
    try {
      const m = await loadLib()
      const res = m.한줄로(file.buf, { sheets: 고른.map((s) => s.path), 남길, 딴시트: 잇기 ? '잇기' : '값' })
      const 매크로 = 매크로인가(살핀 && 살핀.책 && 살핀.책.zip, file.name)
      const blob = new Blob([res.data], { type: 매크로 ? XLSM : XLSX })
      const url = URL.createObjectURL(blob)
      const base = file.name.replace(/\.(xlsx|xlsm)$/i, '').replace(/_2줄$|_3줄$/, '')
      setOut({ url, name: `${base}_1줄.${매크로 ? 'xlsm' : 'xlsx'}`, report: res.report })
      세기('|2줄|1줄')
      if (매크로) 세기('|2줄|1줄xlsm')
      if (남길 !== '변경') 세기('|2줄|1줄당초')
    } catch (e) {
      setErr(e?.message || '바꾸다가 멈췄습니다. 파일을 한 번 더 확인해 주십시오.')
      세기('|2줄|1줄멈춤')
    } finally { setBusy('') }
  }

  const download = () => {
    if (!out) return
    const a = document.createElement('a')
    a.href = out.url; a.download = out.name
    document.body.appendChild(a); a.click(); a.remove()
    try { askAfter('change') } catch { /* 사생활 보호 모드 */ }
  }

  const 이름of = (path) => (살핀 && 살핀.sheets.find((s) => s.path === path)?.name) || ''
  const rep = out && out.report
  const 굳힘묶음 = useMemo(() => {
    if (!rep || !rep.굳힘) return []
    const by = new Map()
    for (const g of rep.굳힘) { const k = g.path; if (!by.has(k)) by.set(k, []); by.get(k).push(g) }
    return [...by.entries()].map(([path, xs]) => ({ path, n: xs.length, 예: xs.slice(0, 3) }))
  }, [rep])
  const 굳힘수 = rep ? (rep.셈?.고정 || 0) : 0

  return (
    <>
      <div className="card">
        <div className="sec-title">2줄 → 1줄은 이렇게 합니다</div>
        <ul className="flist">
          <li><b>짝마다 «변경» 줄 하나만 남깁니다</b> — 당초 · 변경(· 증감) 줄 가운데 마지막(변경) 줄을 남기고 나머지를 지웁니다.
            품명 · 규격 · 단위처럼 당초 줄에만 적힌 글은 남긴 줄로 옮깁니다.</li>
          <li><b>서식이 그대로</b> — 글꼴 · 테두리 · 병합 · 인쇄 영역 · 쪽 나눔 · 결재란 · 메모 · 그림 · 매크로가 남습니다. 색은 «보통 글씨» 줄 것으로 맞춥니다.</li>
          <li><b>수식을 다시 잇습니다</b> — 합계(SUMIF «변경» 같은 것)는 보통 합으로, 변경 줄이 당초 줄을 보던 수식(단가 = 당초 단가)은 그 수식을 끌어와 잇습니다.</li>
          <li><b>엉뚱한 줄을 지우지 않습니다</b> — 짝이 확실한 시트만 켜 두고, 이상하면 ⚠ 로 까닭을 보이고, 바꾸다가 짝이 엇갈리면 멈춥니다.</li>
          <li><b>다른 시트(대비표 · 갑지)는 숫자 그대로</b> — 지운 당초 줄을 보던 칸은 그때 값으로 둡니다.</li>
        </ul>
      </div>

      {/* ── ① 파일 ── */}
      <div className="card">
        <div className="sec-title">① 2줄 엑셀 파일 올리기</div>
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
          <끌어놓기판 글="2줄 변경내역서(엑셀)를 놓으면 엽니다" 길들={[{ 꼴: /\.(xlsx|xlsm)$/i, 받기: (fs) => openFile(fs[0]) }]} />
          {file
            ? <><b>{file.name}</b><span>{수(Math.round(file.size / 1024))} KB{file.예시 ? ' · 🧪 예시(지어낸 공사)' : ''} · 다른 파일을 올리려면 누르십시오</span></>
            : <><b>＋ 2줄(당초 · 변경) 엑셀 파일을 끌어 놓거나 누르십시오</b><span>.xlsx · .xlsm — 구형 .xls 는 xlsx 로 저장해서 올려 주십시오</span></>}
        </div>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn ghost sm tl1-ex" onClick={예시} disabled={!!busy}>🧪 예시 변경내역서로 해 보기</button>
        </div>
        {busy && <div className="muted" style={{ marginTop: 8 }}>{busy}</div>}
        {err && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {err}</div>}
      </div>

      {/* ── 짝 줄이 없는 파일 ── */}
      {살핀 && !줄일시트.length && (
        <div className="card">
          <div className="cwarn">⚠️ 당초 · 변경 짝 줄이 있는 시트를 못 찾았습니다 — 바꿀 것이 없습니다.</div>
          <p className="muted" style={{ marginBottom: 6 }}>
            1줄 내역서라면 «1줄 → 2줄» 에서 당초 · 변경으로 벌릴 수 있습니다.
            2줄인데 못 찾았다면 맵톡으로 한 줄 알려 주십시오(파일은 올리지 마시고 시트 모양만).
          </p>
          {바꿈 && file && <button type="button" className="btn ghost" onClick={() => 바꿈('2', file)}>1줄 → 2줄로 이 파일 열기 ▸</button>}
        </div>
      )}

      {/* ── ② 시트 ── */}
      {살핀 && 줄일시트.length > 0 && (
        <div className="card">
          <div className="sec-title">② 1줄로 줄일 시트</div>
          <p className="muted" style={{ marginTop: 0 }}>
            짝이 확실한 시트를 켜 두었습니다. <b>⚠ 표시 시트는 미리보기로 보신 뒤</b> 켜 주십시오.
          </p>
          <div className="tlsheets">
            {살핀.sheets.map((s) => {
              const 줄 = 줄이는꼴(s)
              const on = 줄 && !!켬[s.path]
              return (
                <div className={`tlrow tl1row${on ? ' on' : ''}`} key={s.path}>
                  {줄 ? (
                    <label className="tlchk">
                      <input type="checkbox" checked={on} onChange={(e) => { set켬((k) => ({ ...k, [s.path]: e.target.checked })); if (e.target.checked) set미리시트(s.path) }} />
                      <b>{s.name}</b>
                    </label>
                  ) : <span className="tlchk tl1off"><b>{s.name}</b></span>}
                  {줄 ? (
                    <span className="tl1info">
                      <span className="tl1tag">{s.꼴 === 'N상태' ? `${s.상태.length}줄` : s.꼴}</span>
                      짝 {수(s.짝)}개 · 지울 줄 {수(s.지울줄)}줄
                      {s.확실 ? <span className="tl1ok">✓ 짝 확실</span> : <span className="tl1warn">⚠ {의심까닭(s)}</span>}
                      <button type="button" className="lnk tl1see" onClick={() => set미리시트(s.path)}>미리보기</button>
                    </span>
                  ) : (
                    <span className="muted tl1info">{s.꼴 === '대비표' ? '대비표(당초 · 변경이 옆 칸) — 그대로 둡니다' : '1줄 — 그대로 둡니다'}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ③ 남길 줄 ── */}
      {살핀 && 줄일시트.length > 0 && (
        <div className="card">
          <div className="sec-title">③ 남길 줄</div>
          <div className="tlopts tl1opts">
            <div>
              <b>짝마다 남길 줄</b>
              {남길후보.map((x) => (
                <label key={x}><input type="radio" checked={남길 === x} onChange={() => set남길(x)} /> {x}{x === '변경' ? ' (추천 — 마지막 줄)' : ''}</label>
              ))}
            </div>
            <div>
              <b>다른 시트</b>
              <label><input type="checkbox" checked={잇기} onChange={(e) => set잇기(e.target.checked)} /> 당초 줄만 보던 다른 시트도 남긴 줄을 보게 잇기</label>
              <span className="muted tl1note">끄면(추천) 다른 시트 숫자는 그대로 둡니다. 켜면 그 시트가 {남길} 금액을 보게 됩니다(대비표는 언제나 그대로).</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 미리보기 ── */}
      {살핀 && 미리.length > 0 && (
        <div className="card">
          <div className="sec-title">미리보기 — «{이름of(미리시트)}» 앞의 짝 {미리.length}개가 이렇게 한 줄이 됩니다</div>
          <div className="tlprev tl1prev">
            <table className="tbl left">
              <tbody>
                {미리.map((d, i) => (
                  [
                    ...d.줄.map((z) => (
                      <tr key={i + '-' + z.r} className={z.남김 ? 'tl1keep' : 'tl1gone'}>
                        <th>{z.상태 || '·'}</th>
                        {z.cells.slice(0, 미리칸수).map((t, j) => <td key={j} title={String(t).length > 16 ? String(t) : undefined}>{짧게(t)}</td>)}
                      </tr>
                    )),
                    <tr key={i + '-out'} className="tl1out">
                      <th>→ 1줄</th>
                      {d.결과.slice(0, 미리칸수).map((t, j) => <td key={j} title={String(t).length > 16 ? String(t) : undefined}>{짧게(t)}</td>)}
                    </tr>,
                  ]
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            흐린 줄은 지우고 굵은 줄(→ 1줄)만 남습니다. 글은 남긴 줄에 없으면 당초 줄에서 가져옵니다. 앞의 몇 짝만 보여 드립니다.
          </p>
        </div>
      )}

      {/* ── ④ 바꾸기 ── */}
      {살핀 && 줄일시트.length > 0 && (
        <div className="card">
          <div className="sec-title">④ 1줄로 바꿔서 내려받기</div>
          <div className="btn-row">
            <button className="btn primary" disabled={!고른.length || !!busy} onClick={run}>
              {busy && /바꾸는/.test(busy) ? '바꾸는 중…' : '1줄로 바꾸기'}
            </button>
            {out && <button className="btn primary" onClick={download}>⬇ {out.name} 내려받기</button>}
          </div>
          {!고른.length && <p className="muted">줄일 시트를 하나 이상 고르십시오.</p>}

          {rep && (
            <div style={{ marginTop: 12 }}>
              <div className="sec-title" style={{ marginTop: 0 }}>검산</div>
              <ul className="flist">
                {rep.sheets.map((s, i) => (
                  <li key={i}>
                    <b>{s.name}</b> — 짝 {수(s.짝)}개를 한 줄씩으로: <b>{수(s.줄전)}줄 → {수(s.줄후)}줄</b>(지운 줄 {수(s.지운줄)})
                    {s.고정 > 0 && <> · 그때 값으로 둔 칸 {수(s.고정)}</>}
                  </li>
                ))}
              </ul>
              {(rep.셈?.이음 || 0) > 0 && (
                <p className="muted tl1rep">
                  🔗 지운 줄만 보던 칸 {수(rep.셈.이음)}곳(머리 «금 ○○원» · 끝수 맞춤 칸 같은 것)은 남긴 줄을 보게 이었습니다
                  {rep.이음 && rep.이음.length > 0 && <> — 예: {rep.이음.slice(0, 3).map((x) => `${이름of(x.path)} ${x.ref}`).join(' · ')}</>}.
                </p>
              )}
              {굳힘수 > 0 && (
                <div className="tl1rep">
                  <p className="muted" style={{ margin: '6px 0 2px' }}>
                    📌 지운 줄을 보던 칸 {수(굳힘수)}곳은 <b>그때 값</b>(숫자 그대로)으로 두었습니다 — 값은 바뀌지 않습니다.
                  </p>
                  <ul className="flist sm">
                    {굳힘묶음.slice(0, 6).map((g) => (
                      <li key={g.path}><b>{이름of(g.path)}</b> {수(g.n)}{g.n >= 300 ? '+' : ''}곳 — 예: {g.예.map((x) => `${x.ref} ← ${x.원}`).join(' · ')}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(rep.다시이음 && Object.keys(rep.다시이음).length > 0) && (
                <p className="muted tl1rep">🔗 남긴 줄을 보게 다시 이은 시트: {Object.entries(rep.다시이음).map(([k, n]) => `${k} ${수(n)}곳`).join(' · ')}</p>
              )}
              {(rep.셈?.엇갈림수 || 0) > 0 && (
                <div className="cwarn" style={{ marginTop: 8 }}>
                  ⚠️ 짝이 엇갈린 수식 {수(rep.셈.엇갈림수)}곳 — 남긴 줄의 수식이 다른 품목의 지운 줄을 가리켜 그때 값으로 두었습니다(예: {rep.셈.엇갈림.slice(0, 4).join(' · ')}). 이 칸을 한 번 보십시오.
                </div>
              )}
              {rep.warns.length > 0 ? (
                <>
                  <div className="cwarn" style={{ marginTop: 8 }}>⚠️ 손으로 확인하실 곳이 {rep.warns.length}군데 있습니다.</div>
                  <ul className="flist">
                    {rep.warns.slice(0, 40).map((w, i) => (
                      <li key={i}><b>{이름of(w.path)} {w.ref}</b> — {w.msg}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="muted">고치지 못한 수식은 없습니다. 그래도 <b>합계와 인쇄 영역은 한 번 확인</b>해 주십시오.</p>
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
          <li><b>원가계산서 · 총괄표도 2줄이면 같이 고르십시오.</b> 같이 줄여야 내역서 변경 합계를 그대로 봅니다.</li>
          <li>대비표(당초 · 변경 · 증감이 옆 칸에 있는 표)는 줄이지 않습니다 — 1줄 내역서에는 필요 없으면 시트를 지우시면 됩니다.</li>
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
