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
 *    안 하는 일: **도면을 읽지 않습니다.** 도면의 선이 무엇인지는 사람이 봐야 합니다.
 *
 * ■ 파일은 브라우저 안에서만 다룹니다. 한 조각도 올라가지 않습니다. (서버 비용 0)
 *
 * ⚠️ 셈은 lib/qto.js · lib/susik.js 가 합니다. PC 의 kqto.py · kq_susik.py 와
 *    «같은 수량» 을 내야 합니다 — 한쪽만 고치지 마십시오.
 *    맞는지는 tools/시험_적산.mjs 가 봅니다 (무작위 수식 4만8천 개 + 실제 산출단위 대조).
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'

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
  const [표, set표] = useState(null)         /* {칸:[…], 줄:[[…]]} 화면에서 적는 치수표 */
  const [치수길, set치수길] = useState('표')   /* '표' = 화면에서 적기 · '파일' = 올리기 */
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [out, setOut] = useState(null)      /* {url, name, rows, checks, warns, serious} */
  const bRef = useRef(null)
  const uRef = useRef(null)

  const loadLib = useCallback(async () => {
    if (lib) return lib
    const m = await import('../lib/qto.js')
    setLib(m)
    return m
  }, [lib])

  const 재료표읽기 = useCallback(async (buf, name, size, 견본이름 = '') => {
    const m = await loadLib()
    const b = new m.Book(buf, name)          /* 여기서 한 번 읽어 봐야 «틀린 파일» 을 바로 잡습니다 */
    setBook({ name, size, buf, 부재: [...new Set(b.재료표.map((r) => r['부재']).filter(Boolean))], 줄: b.재료표.length, 견본: 견본이름 })
  }, [loadLib])

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
    } catch (e) {
      setUnit(null)
      setErr(e?.message || '치수표를 읽지 못했습니다.')
    } finally { setBusy('') }
  }, [loadLib])

  /* 화면 표: 처음엔 빈 줄 세 개. «견본 줄 불러오기» 로 견본 12줄을 채울 수 있습니다. */
  const 표준비 = () => 표 || { 칸: 기본칸, 줄: [빈줄(기본칸, 1), 빈줄(기본칸, 2), 빈줄(기본칸, 3)] }
  const 표바꿈 = (i, j, v) => {
    const t = 표준비()
    const 줄 = t.줄.map((r) => r.slice())
    줄[i][j] = v
    set표({ ...t, 줄 }); setOut(null)
  }
  const 줄더하기 = () => { const t = 표준비(); set표({ ...t, 줄: [...t.줄, 빈줄(t.칸, t.줄.length + 1)] }) }
  const 줄지우기 = (i) => { const t = 표준비(); set표({ ...t, 줄: t.줄.filter((_, k) => k !== i) }); setOut(null) }
  const 견본줄 = async () => {
    setErr('')
    try {
      const m = await loadLib()
      const r = await fetch(치수견본)
      const text = decodeKo(await r.arrayBuffer())
      const us = m.readUnits(text)
      const 칸 = 기본칸.slice()
      for (const u of us) for (const k of Object.keys(u)) if (!칸.includes(k)) 칸.push(k)
      set표({ 칸, 줄: us.map((u) => 칸.map((k) => u[k] ?? '')) }); setOut(null)
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
            <div className="jrx-wrap">
              <table className="jrx">
                <thead><tr>{t.칸.map((k) => <th key={k}>{k}</th>)}<th /></tr></thead>
                <tbody>
                  {t.줄.map((r, i) => (
                    <tr key={i}>
                      {t.칸.map((k, j) => (
                        <td key={k}>
                          {k === '부재' && 부재들.length ? (
                            <select value={r[j]} onChange={(e) => 표바꿈(i, j, e.target.value)}>
                              <option value="">고르기</option>
                              {[...new Set([...부재들, r[j]].filter(Boolean))].map((b) => <option key={b}>{b}</option>)}
                            </select>
                          ) : (
                            <input value={r[j]} onChange={(e) => 표바꿈(i, j, e.target.value)}
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
              <button type="button" className="btn ghost sm" onClick={() => { set표(null); setOut(null) }}>비우기</button>
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
          <a className="btn primary" href={out.url} download={out.name}>⬇ 수량산출서.xlsx 받기</a>
          <p className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.8 }}>
            시트 다섯 장입니다 — <b>산출서</b>(줄마다 산출근거와 수량) ·{' '}
            <b>집계</b>(재료별 합계) · <b>태그별</b>(공구·측점·공종별) ·{' '}
            <b>검산</b>(걸린 것) · <b>쓴표</b>(무엇을 보고 셌는지).
            수량 칸은 <b>=ROUND(산출근거,3)</b> 수식입니다. 치수를 고치면 엑셀에서 바로 다시 셉니다.
          </p>
          <ChecksTable checks={out.checks} warns={out.warns} />
        </div>
      )}

      {/* ── 알아 두실 것 ── */}
      <div className="card">
        <div className="sec-title">알아 두실 것</div>
        <ul className="flist">
          <li><b>단가는 내지 않습니다.</b> 수량과 산출근거까지입니다.
            표준품셈 · 물가정보 · 노임단가는 유료 자료라 싣지 않습니다</li>
          <li><b>도면은 사람이 읽어야 합니다.</b> 도면의 선이 무엇을 뜻하는지는 도면마다 달라서,
            자동으로 하면 반드시 틀립니다. 여기는 «잰 치수를 받아 셈하는» 자리입니다</li>
          <li>견본 재료표의 환산·할증 값은 <b>쓰시는 기준으로 고쳐 쓰는 자리</b>입니다. 그대로 쓰시면 견본 값으로 셉니다</li>
          <li>철근 단위중량(<b>KS D 3504</b>)만 값표에 들어 있습니다. 표준 규격이라 그렇습니다</li>
          <li><b>검산 시트를 꼭 보십시오.</b> 밀리미터를 그대로 넣었거나, 번호가 겹쳤거나,
            공제가 본체보다 크면 거기 적힙니다. 수량은 «틀려도 숫자처럼 보입니다»</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
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
