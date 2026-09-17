/**
 * /jeoksan/run — 「수량산출서 만들기」 (2026-09-16)
 *
 * 소장님: 「아예, 건설맵 사이트에서 하게 하는 건 어때? 돌린 이용자가 엑셀로 다운로드 받게.
 *          그럼 우린 자료가 쌓여서 좋은 거고, 사이트 방문 이유도 생기는 거니까」
 *          그리고 「도면은 필요 없고」.
 *
 * ■ 여기서 하는 일 / 안 하는 일 — 이 선이 값을 가릅니다
 *    하는 일   : 재료표(엑셀) + 치수표(CSV)  ->  수량산출서 엑셀 다섯 장
 *    안 하는 일: **도면을 읽지 않습니다.** 도면에서 찍는 것은 PC 프로그램 몫입니다.
 *    그래서 도면 파일은 «받지도 않습니다». 남의 설계도면을 남의 서버에 올리게 하면 안 됩니다.
 *
 * ■ 파일은 브라우저 안에서만 다룹니다. 한 조각도 올라가지 않습니다.
 *    (2줄 변환과 같은 방침입니다. 사람들이 이걸 가장 먼저 걱정합니다)
 *
 * ⚠️ 셈은 lib/qto.js · lib/susik.js 가 합니다. PC 의 kqto.py · kq_susik.py 와
 *    «같은 수량» 을 내야 합니다 — 한쪽만 고치지 마십시오.
 *    맞는지는 tools/시험_적산.mjs 가 봅니다 (무작위 수식 4만8천 개 + 실제 산출단위 대조).
 */
import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'
import Locked from '../Locked.jsx'

function kb(n) { return new Intl.NumberFormat('ko-KR').format(Math.round(n / 1024)) }

/* 🔒 2026-09-17 — 소장님: 「이용자 들이 사용하게 하면 안돼」
   실험실(/jeoksan/lab)만 잠가 두고 이 화면은 열어 두었던 것이 제 잘못입니다.
   같은 열쇠말로 잠급니다. 사이트맵·굽기에서도 뺐습니다. */
export default function JeoksanRun() {
  return <Locked>{() => <Run />}</Locked>
}

function Run() {
  const [lib, setLib] = useState(null)      /* 무겁습니다 — 파일을 올릴 때 받아옵니다 */
  const [book, setBook] = useState(null)    /* {name, size, buf} 재료표 */
  const [unit, setUnit] = useState(null)    /* {name, size, text} 치수표 */
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
    try {
      const m = await loadLib()
      const buf = await f.arrayBuffer()
      const b = new m.Book(buf, f.name)          /* 여기서 한 번 읽어 봐야 «틀린 파일» 을 바로 잡습니다 */
      setBook({ name: f.name, size: f.size, buf, 부재: [...new Set(b.재료표.map((r) => r['부재']).filter(Boolean))], 줄: b.재료표.length })
    } catch (e) {
      setBook(null)
      setErr(e?.message || '재료표를 읽지 못했습니다.')
    } finally { setBusy('') }
  }, [loadLib])

  const takeUnit = useCallback(async (f) => {
    if (!f) return
    setErr(''); setOut(null)
    if (!/\.(csv|txt)$/i.test(f.name)) {
      setErr('치수표는 CSV 파일이어야 합니다. 엑셀에서 «다른 이름으로 저장 → CSV UTF-8» 로 저장해 주십시오.')
      return
    }
    setBusy('치수표를 읽는 중입니다…')
    try {
      const m = await loadLib()
      const buf = await f.arrayBuffer()
      const text = decodeKo(buf)
      const us = m.readUnits(text)               /* 미리 읽어 «부재 칸이 없습니다» 를 바로 알립니다 */
      setUnit({ name: f.name, size: f.size, text, n: us.length })
    } catch (e) {
      setUnit(null)
      setErr(e?.message || '치수표를 읽지 못했습니다.')
    } finally { setBusy('') }
  }, [loadLib])

  const run = async () => {
    if (!book || !unit) return
    setBusy('세는 중입니다…'); setErr('')
    if (out?.url) { try { URL.revokeObjectURL(out.url) } catch { /* 지나갑니다 */ } }
    setOut(null)
    await new Promise((r) => setTimeout(r, 40))   /* 「세는 중」 을 먼저 그리게 한 박자 쉽니다 */
    try {
      const m = await loadLib()
      const res = m.run(book.buf, book.name, unit.text, unit.name)
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
      })
      try { if (window.gtag) window.gtag('event', 'jeoksan_run', { rows: res.rows.length }) } catch { /* 광고차단기 */ }
      askAfter('jeoksan')
    } catch (e) {
      setErr(e?.message || '세지 못했습니다.')
    } finally { setBusy('') }
  }

  const ready = book && unit && !busy

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧮 수량산출서 만들기</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>재료표</b>와 <b>치수표</b> 두 장을 올리면 <b>수량산출서 엑셀</b>이 나옵니다.
          산출근거가 <b>살아 있는 엑셀 수식</b>이라 감리가 칸을 눌러 봅니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          <b>파일은 이 브라우저 밖으로 나가지 않습니다.</b> 셈은 소장님 컴퓨터 안에서 합니다 —
          올라가는 것이 없으니 올린 파일이 남을 자리도 없습니다.{' '}
          <b>도면(.dxf)은 아예 받지 않습니다.</b>
        </p>
      </div>

      {/* ── ① 재료표 ── */}
      <div className="card">
        <div className="sec-title">① 재료표 (엑셀)</div>
        <p className="muted" style={{ marginTop: 0 }}>
          부재 하나가 <b>어떤 재료를 얼마나 먹는지</b> 적어 둔 표입니다. 이 물건의 머리입니다.
          처음이시면 <b>견본을 받아</b> 현장에 맞게 고쳐 쓰십시오.
        </p>
        <div
          className={`tldrop${book ? ' on' : ''}`}
          onClick={() => bRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); takeBook(e.dataTransfer?.files?.[0]) }}
        >
          <input ref={bRef} type="file" accept=".xlsx" hidden
                 onChange={(e) => takeBook(e.target.files?.[0])} />
          {book
            ? <><b>{book.name}</b><span>{kb(book.size)} KB · 재료표 {book.줄}줄 · 부재 {book.부재.join(' · ')}</span></>
            : <><b>＋ 재료표를 끌어 놓거나 누르십시오</b><span>.xlsx — 「설정 · 재료표 · 일람표 · 값표」 시트가 있어야 합니다</span></>}
        </div>
        <div className="navrow" style={{ marginTop: 10 }}>
          <a className="navi" href="/jeoksan/재료표_토목.xlsx" download>⬇ 재료표 견본 — 토목</a>
          <a className="navi" href="/jeoksan/재료표_건축.xlsx" download>⬇ 재료표 견본 — 건축</a>
        </div>
      </div>

      {/* ── ② 치수표 ── */}
      <div className="card">
        <div className="sec-title">② 치수표 (CSV)</div>
        <p className="muted" style={{ marginTop: 0 }}>
          <b>부재 하나에 한 줄씩</b>, 도면에서 잰 치수를 적은 표입니다.
          엑셀로 적으신 뒤 <b>「다른 이름으로 저장 → CSV UTF-8」</b> 하시면 됩니다.
        </p>
        <div
          className={`tldrop${unit ? ' on' : ''}`}
          onClick={() => uRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); takeUnit(e.dataTransfer?.files?.[0]) }}
        >
          <input ref={uRef} type="file" accept=".csv,.txt" hidden
                 onChange={(e) => takeUnit(e.target.files?.[0])} />
          {unit
            ? <><b>{unit.name}</b><span>{kb(unit.size)} KB · {unit.n}줄</span></>
            : <><b>＋ 치수표를 끌어 놓거나 누르십시오</b><span>.csv — 첫 줄이 칸 이름이고 «부재» 칸이 꼭 있어야 합니다</span></>}
        </div>
        <div className="navrow" style={{ marginTop: 10 }}>
          <a className="navi" href="/jeoksan/치수표_견본.csv" download>⬇ 치수표 견본 받기</a>
        </div>
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
            재료표와 치수표를 <b>둘 다</b> 올리시면 켜집니다.
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
            치수표 <b>{out.units}줄</b> 에서 산출서 <b>{out.rows}줄</b> 이 나왔습니다.{' '}
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
          <li>철근 단위중량(<b>KS D 3504</b>)만 값표에 들어 있습니다. 표준 규격이라 그렇습니다</li>
          <li><b>검산 시트를 꼭 보십시오.</b> 밀리미터를 그대로 넣었거나, 번호가 겹쳤거나,
            공제가 본체보다 크면 거기 적힙니다. 수량은 «틀려도 숫자처럼 보입니다»</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <Link className="btn ghost" to="/jeoksan">🧮 K-적산이 무엇인지</Link>
          <Link className="btn ghost" to="/cad">📐 캐드 유틸 — 길이·면적 재기</Link>
          <Link className="btn ghost" to="/change/twoline">🔁 설계변경 2줄 변환</Link>
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
