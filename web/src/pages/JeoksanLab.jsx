/**
 * /jeoksan/lab — 🔒 적산 실험실 (2026-09-16)
 *
 * 소장님: 「도면을 넣으면 내역서가 나와야 하고, 공내역서를 넣으면 단가가 채워져서 나와야 해.
 *          원가계산서부터 내역서까지 모조리 다. 사이트에 올려주되 사용은 하지 못하게 —
 *          내가 실험을 해야 하니까」
 *
 * ■ 두 갈래입니다
 *    ① 도면(.dxf) 또는 치수표(.csv)  +  재료표(.xlsx)   ->  수량산출서
 *    ② 공내역서(.xlsx)               +  단가표(.csv/.xlsx) ->  내역서 + 원가계산서
 *    ①의 집계를 ②에 그대로 물릴 수도 있습니다(「수량산출서로 이어서」).
 *
 * ■ 🔒 잠겨 있습니다 — lib/gate.js
 *    «보안이 아닙니다.» 지나가던 사람이 못 들어오게 하는 것뿐입니다(gate.js 주석 참고).
 *    어디에서도 링크하지 않고, sitemap·prerender 에도 넣지 않습니다.
 *
 * ■ 도면에서 «해석» 하지 않습니다
 *    사람이 캐드에서 찍어 둔 쪽지(XDATA `KQTO`)만 읽습니다. 안 찍은 도면에서는
 *    아무것도 안 나옵니다 — 선이 무엇을 뜻하는지는 도면마다 다르기 때문입니다.
 *
 * ■ 파일은 브라우저 안에서만 다룹니다. 도면도 내역서도 올라가지 않습니다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isOpen, tryOpen, close } from '../lib/gate.js'

function kb(n) { return new Intl.NumberFormat('ko-KR').format(Math.round(n / 1024)) }
function won(n) { return new Intl.NumberFormat('ko-KR').format(Math.round(n)) }

export default function JeoksanLab() {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [bad, setBad] = useState(false)
  useEffect(() => { setOpen(isOpen()) }, [])

  if (!open) {
    return (
      <div className="card" style={{ maxWidth: 460, margin: '40px auto' }}>
        <div className="sec-title">🔒 잠겨 있습니다</div>
        <p className="muted" style={{ marginTop: 0 }}>
          아직 시험 중인 화면입니다. 열쇠말이 있어야 들어옵니다.
        </p>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const ok = await tryOpen(word)
          setBad(!ok); setOpen(ok)
        }}>
          <input type="password" value={word} autoFocus
            onChange={(e) => { setWord(e.target.value); setBad(false) }}
            placeholder="열쇠말"
            style={{ width: '100%', padding: '10px 12px', fontSize: 15, marginBottom: 10 }} />
          <button className="btn primary" type="submit" style={{ width: '100%' }}>열기</button>
        </form>
        {bad && <div className="cwarn" style={{ marginTop: 10 }}>열쇠말이 다릅니다.</div>}
        <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          <Link to="/jeoksan">← K-적산으로</Link>
        </div>
      </div>
    )
  }
  return <Lab onLock={() => { close(); setOpen(false) }} />
}

function Lab({ onLock }) {
  const [lib, setLib] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  /* ① 수량 */
  const [book, setBook] = useState(null)      /* 재료표 */
  const [draw, setDraw] = useState(null)      /* 도면 또는 치수표 */
  const [qto, setQto] = useState(null)        /* 결과 */

  /* ② 내역서 */
  const [gong, setGong] = useState(null)      /* 공내역서 */
  const [price, setPrice] = useState(null)    /* 단가표 */
  const [nae, setNae] = useState(null)        /* 결과 */

  const refs = { book: useRef(null), draw: useRef(null), gong: useRef(null), price: useRef(null) }

  const load = useCallback(async () => {
    if (lib) return lib
    const [q, d, n] = await Promise.all([
      import('../lib/qto.js'), import('../lib/dxf.js'), import('../lib/naeyeok.js'),
    ])
    const m = { qto: q, dxf: d, nae: n }
    setLib(m)
    return m
  }, [lib])

  const koText = (buf) => {
    const u8 = new Uint8Array(buf)
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, '') }
    catch (e) {
      try { return new TextDecoder('euc-kr').decode(u8) } catch (e2) { /* 아래로 */ }
      return new TextDecoder('utf-8').decode(u8).replace(/^﻿/, '')
    }
  }

  /* ── 파일 받기 ── */
  const take = useCallback(async (kind, f) => {
    if (!f) return
    setErr('')
    /* ⚠️ 그 자리의 결과만 지웁니다. 예전에는 둘 다 지워서,
          ②에 단가표를 올리면 ①에서 만든 수량산출서가 사라졌습니다. */
    if (kind === 'book' || kind === 'draw') setQto(null)
    else setNae(null)
    setBusy('읽는 중입니다…')
    try {
      const m = await load()
      const buf = await f.arrayBuffer()
      if (kind === 'book') {
        const b = new m.qto.Book(buf, f.name)
        setBook({ name: f.name, size: f.size, buf, 부재: [...new Set(b.재료표.map((r) => r['부재']).filter(Boolean))] })
      } else if (kind === 'draw') {
        if (/\.dxf$/i.test(f.name)) {
          const units = m.dxf.readDxfUnits(m.dxf.decodeDxf(buf))
          if (!units.length) throw new Error('도면에서 «찍어 둔 것» 을 못 찾았습니다. 캐드에서 부재를 찍은 도면이어야 합니다(XDATA KQTO).')
          setDraw({ name: f.name, size: f.size, text: m.dxf.unitsToCsv(units), n: units.length, 꼴: '도면' })
        } else {
          const text = koText(buf)
          const units = m.qto.readUnits(text)
          setDraw({ name: f.name, size: f.size, text, n: units.length, 꼴: '치수표' })
        }
      } else if (kind === 'gong') {
        const g = m.nae.readGongNaeyeok(buf, f.name)
        setGong({ name: f.name, size: f.size, buf, n: g.rows.length, 시트말: g.시트말 })
      } else if (kind === 'price') {
        const input = /\.(csv|txt)$/i.test(f.name) ? koText(buf) : buf
        const pr = m.nae.readPrices(input, f.name)
        setPrice({ name: f.name, size: f.size, input, n: pr.n })
      }
    } catch (e) {
      setErr(e?.message || '읽지 못했습니다.')
      if (kind === 'book') setBook(null)
      if (kind === 'draw') setDraw(null)
      if (kind === 'gong') setGong(null)
      if (kind === 'price') setPrice(null)
    } finally { setBusy('') }
  }, [load])

  /* ── ① 수량산출서 ── */
  const runQto = async () => {
    if (!book || !draw) return
    setBusy('세는 중입니다…'); setErr('')
    if (qto?.url) { try { URL.revokeObjectURL(qto.url) } catch (e) { /* 지나갑니다 */ } }
    setQto(null)
    await new Promise((r) => setTimeout(r, 40))
    try {
      const m = await load()
      const res = m.qto.run(book.buf, book.name, draw.text, draw.name)
      const url = URL.createObjectURL(new Blob([res.bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }))
      /* 집계를 ②에 물릴 수 있게 «내역 줄» 로 바꿔 둡니다 */
      const 집계 = new Map()
      for (const r of res.rows) {
        if (r.err || r.val === null) continue
        const k = [r.rule['재료'], r.rule['규격'], r.rule['단위']].join('|')
        집계.set(k, (집계.get(k) || 0) + r.val)
      }
      setQto({
        url, rows: res.rows.length, units: res.units.length, serious: res.serious,
        checks: res.checks, warns: res.warns,
        집계: [...집계].map(([k, v]) => {
          const [공종, 규격, 단위] = k.split('|')
          return { 공종, 규격, 단위, 수량: Math.round(v * 1000) / 1000, 시트: '수량산출서' }
        }),
      })
    } catch (e) { setErr(e?.message || '세지 못했습니다.') } finally { setBusy('') }
  }

  /* ── ② 내역서 + 원가계산서 ── */
  const runNae = async (from) => {
    setBusy('단가를 채우는 중입니다…'); setErr('')
    if (nae?.url) { try { URL.revokeObjectURL(nae.url) } catch (e) { /* 지나갑니다 */ } }
    setNae(null)
    await new Promise((r) => setTimeout(r, 40))
    try {
      const m = await load()
      if (!price) throw new Error('단가표를 올려 주십시오.')
      const pr = m.nae.readPrices(price.input, price.name)
      let rows, src
      if (from === 'qto') {
        if (!qto) throw new Error('먼저 수량산출서를 만드십시오.')
        rows = qto.집계; src = '수량산출서(이 화면에서 만든 것)'
      } else {
        if (!gong) throw new Error('공내역서를 올려 주십시오.')
        const g = m.nae.readGongNaeyeok(gong.buf, gong.name)
        rows = g.rows; src = g.name
      }
      const f = m.nae.fillPrices(rows, pr.table)
      const bytes = m.nae.toNaeyeokXlsx({
        rows: f.rows, 찾음: f.찾음, 못찾음: f.못찾음, src, priceName: pr.name,
      })
      const url = URL.createObjectURL(new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }))
      const 합 = f.rows.reduce((a, r) => a + (r.단가 === null ? 0 : r.단가 * r.수량), 0)
      setNae({ url, ...f, 단가표수: pr.n, src, 합 })
    } catch (e) { setErr(e?.message || '만들지 못했습니다.') } finally { setBusy('') }
  }

  /* ⚠️ Drop 을 여기(Lab 안)에 두면 안 됩니다 — 화면이 다시 그려질 때마다
        «다른 컴포넌트» 가 되어 <input> 이 통째로 새로 만들어집니다.
        그래서 파일 칸 아래(바깥)에 두고 필요한 것만 넘깁니다. */

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🔒 적산 실험실</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>도면 → 수량 → 내역서 → 원가계산서</b> 를 끝까지 이어 봅니다. 시험 중인 화면입니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          파일은 <b>브라우저 안에서만</b> 다룹니다 — 도면도 내역서도 올라가지 않습니다.{' '}
          도면은 <b>캐드에서 찍어 둔 쪽지만</b> 읽습니다(해석하지 않습니다).{' '}
          <button className="navi" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }}
            onClick={onLock}>잠그기</button>
        </p>
      </div>

      {/* ── ① 수량 ── */}
      <div className="card">
        <div className="sec-title">① 도면 또는 치수표 → 수량산출서</div>
        <DropBox take={take} refs={refs} k="book" on={book} accept=".xlsx"
          title="재료표를 올리십시오"
          hint={(b) => `${kb(b.size)} KB · 부재 ${b.부재.join(' · ')}`} />
        <div style={{ height: 8 }} />
        <DropBox take={take} refs={refs} k="draw" on={draw} accept=".dxf,.csv,.txt"
          title="도면(.dxf) 또는 치수표(.csv)를 올리십시오"
          hint={(d) => `${kb(d.size)} KB · ${d.꼴} · ${d.n}줄`} />
        <div className="navrow" style={{ marginTop: 10 }}>
          <a className="navi" href="/jeoksan/재료표_토목.xlsx" download>⬇ 재료표 견본 — 토목</a>
          <a className="navi" href="/jeoksan/재료표_건축.xlsx" download>⬇ 재료표 견본 — 건축</a>
          <a className="navi" href="/jeoksan/치수표_견본.csv" download>⬇ 치수표 견본</a>
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn primary" disabled={!book || !draw || !!busy} onClick={runQto}>
            🧮 수량산출서 만들기
          </button>
        </div>
        {qto && (
          <div style={{ marginTop: 12 }}>
            <p style={{ margin: '0 0 8px' }}>
              {draw.꼴} <b>{qto.units}줄</b> → 산출서 <b>{qto.rows}줄</b> · 집계 <b>{qto.집계.length}가지</b>
              {qto.serious
                ? <b style={{ color: '#c00000' }}> · ✕ {qto.serious}가지 — 검산 시트를 보십시오</b>
                : <span> · ✕ 없음</span>}
            </p>
            <a className="btn primary" href={qto.url} download="수량산출서.xlsx">⬇ 수량산출서.xlsx</a>
          </div>
        )}
      </div>

      {/* ── ② 내역서 ── */}
      <div className="card">
        <div className="sec-title">② 단가를 채워 내역서 · 원가계산서</div>
        <p className="muted" style={{ marginTop: 0 }}>
          <b>단가표는 올려 주시는 것만 씁니다.</b> 사이트는 단가를 갖고 있지 않습니다 —
          표준품셈·물가정보·노임단가는 유료라 싣지 않습니다.
          <br /><span style={{ fontSize: 12 }}>
            「품명 · 규격 · 단위 · 단가」 칸이 있으면 무엇이든 됩니다.
            단가사전(<code>_단가사전.csv</code>)을 그대로 올리셔도 됩니다.
          </span>
        </p>
        <DropBox take={take} refs={refs} k="price" on={price} accept=".csv,.txt,.xlsx"
          title="단가표를 올리십시오"
          hint={(p) => `${kb(p.size)} KB · 단가 ${p.n}가지`} />
        <div style={{ height: 8 }} />
        <DropBox take={take} refs={refs} k="gong" on={gong} accept=".xlsx"
          title="공내역서를 올리십시오 (수량만 있고 단가가 빈 내역서)"
          hint={(g) => `${kb(g.size)} KB · ${g.n}줄 · ${g.시트말.slice(0, 3).join(' / ')}`} />
        <div className="navrow" style={{ marginTop: 10 }}>
          <button className="btn primary" disabled={!price || !gong || !!busy} onClick={() => runNae('gong')}>
            💰 공내역서에 단가 채우기
          </button>
          <button className="btn ghost" disabled={!price || !qto || !!busy} onClick={() => runNae('qto')}>
            ↩ 위 수량산출서로 이어서
          </button>
        </div>
        {nae && (
          <div style={{ marginTop: 12 }}>
            <p style={{ margin: '0 0 8px' }}>
              내역 <b>{nae.rows.length}줄</b> 가운데 단가를 <b>{nae.찾음}줄</b> 찾았습니다
              {nae.못찾음 > 0 && <b style={{ color: '#c00000' }}> · 못 찾음 {nae.못찾음}줄</b>}
              <br />
              <span className="muted">
                찾은 것만 더하면 <b>{won(nae.합)}원</b> — 못 찾은 줄이 있으면 이 값은 «덜 센 것» 입니다.
              </span>
            </p>
            <a className="btn primary" href={nae.url} download="내역서_원가계산서.xlsx">
              ⬇ 내역서_원가계산서.xlsx
            </a>
            <p className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.8 }}>
              시트 넷입니다 — <b>내역서</b>(수량×단가=금액, 살아 있는 수식) ·{' '}
              <b>원가계산서</b>(간접노무비부터 부가세까지, <b>요율은 노란 칸에서 고칩니다</b>) ·{' '}
              <b>못 찾은 단가</b> · <b>쓴표</b>.
              <br />
              ⚠️ <b>재료비·노무비·경비는 비워 두었습니다.</b> 단가 하나로는 가를 수 없습니다 —
              일위대가가 있으면 거기서 갈라 내역서 G·H·I 칸에 넣으시면 원가계산서가 받습니다.
              <br />
              ⚠️ <b>요율은 2026년 공고 한 건에서 옮긴 값입니다.</b> 해마다·공사 종류마다 다릅니다.
              반드시 공고 서류와 맞춰 보십시오.
            </p>
          </div>
        )}
      </div>

      {busy && <div className="card muted">{busy}</div>}
      {err && <div className="card cwarn">⚠️ {err}</div>}

      {/* ── 검산 ── */}
      {qto && (qto.checks.length || qto.warns.length) > 0 && (
        <div className="card">
          <div className="sec-title">검산 — 수량산출서</div>
          <Checks checks={qto.checks} warns={qto.warns} />
        </div>
      )}

      <div className="card">
        <div className="sec-title">아직 못 하는 것 — 적어 둡니다</div>
        <ul className="flist">
          <li><b>도면을 스스로 읽지 않습니다.</b> 캐드에서 찍어 둔 쪽지만 읽습니다.
            안 찍은 도면을 넣으면 «못 찾았습니다» 가 나옵니다 — 그게 맞는 동작입니다</li>
          <li><b>재료비·노무비·경비를 가르지 못합니다.</b> 단가 한 칸으로는 가를 수 없습니다.
            일위대가를 읽어 가르는 것이 다음 일입니다</li>
          <li><b>일위대가를 만들지 못합니다.</b> 지금은 «단가를 가져다 붙이는» 데까지입니다</li>
          <li><b>단가사전이 아직 얇습니다.</b> 한 달치로는 낼 수 있는 것이 346가지뿐입니다</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <Link className="btn ghost" to="/jeoksan">🧮 K-적산</Link>
          <Link className="btn ghost" to="/jeoksan/run">🧮 수량산출서 만들기(열린 화면)</Link>
        </div>
      </div>
    </>
  )
}

/* 파일 한 칸 — 끌어 놓거나 눌러서 고릅니다 */
function DropBox({ take, refs, k, on, title, hint, accept }) {
  return (
    <div className={`tldrop${on ? ' on' : ''}`}
      onClick={() => refs[k].current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); take(k, e.dataTransfer?.files?.[0]) }}>
      <input ref={refs[k]} type="file" accept={accept} hidden
        onChange={(e) => take(k, e.target.files?.[0])} />
      {on ? <><b>{on.name}</b><span>{hint(on)}</span></>
        : <><b>＋ {title}</b><span>{accept}</span></>}
    </div>
  )
}

function Checks({ checks, warns }) {
  const SERIOUS = { 부재없음: 1, 재료표없음: 1, 셈못함: 1, 조건오류: 1, 번호겹침: 1 }
  const all = checks.concat(warns.map(([a, b, c]) => [(SERIOUS[a] ? '✕ ' : '△ ') + a, b, c]))
  if (!all.length) return <div className="muted">걸린 것이 없습니다.</div>
  all.sort((a, b) => (String(b[0]).startsWith('✕') ? 1 : 0) - (String(a[0]).startsWith('✕') ? 1 : 0))
  return (
    <div className="tlprev">
      <table className="tbl left">
        <thead><tr><th style={{ width: 96 }}>구분</th><th style={{ width: 130 }}>어디</th><th>무슨 일</th></tr></thead>
        <tbody>
          {all.slice(0, 40).map(([k, w, m], i) => (
            <tr key={i} style={String(k).startsWith('✕') ? { color: '#c00000' } : undefined}>
              <td>{k}</td><td>{w}</td><td>{m}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {all.length > 40 && <div className="muted" style={{ marginTop: 6 }}>…그리고 {all.length - 40}가지 더 (엑셀 「검산」 시트)</div>}
    </div>
  )
}
