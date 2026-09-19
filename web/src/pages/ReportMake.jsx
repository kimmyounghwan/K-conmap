/* ══════════════════════════════════════════════════════════════
   /report/make — 「업체 입찰 성적표」를 **여기서 만들고 내려받습니다** (2026-09-18)

   소장님: 「분석에서 성적표 신청하기만 있고, 내가 업체검색해서 업체 성적표가
            나오게 해서 다운 받을 수 있어야 하는데, 그런게 없어.
            이용자는 사용을 막돼, 난 사용할 수 있어야 하잖아」
           「성적표 신청하기만 있잖아. 수정안했어..난 할 수 있게 해달라고 했잖아.
            다운 받을 수 있게도 해주고, 다른 이용자는 못하게 하고...」

   ■ 어떻게 «다른 이용자는 못 쓰나»
     ① 문 앞 이름표 — 운영자 브라우저(lib/운영자.js 의 OPS)에서만 열립니다.
     ② **진짜 자물쇠는 자료입니다.** 성적표는 개찰마다 «투찰업체 30곳» 이 다 들어 있는
        data/store/first.json 이 있어야 만들어집니다. 그 파일은 사이트에 올라가 있지
        않습니다 (사이트의 /data/first.json 은 최근 300건 요약본입니다).
        소장님 컴퓨터에 있는 그 파일을 **고르셔야** 성적표가 나옵니다.
        그러니 이 주소를 알아내도 남이 쓸 수 있는 것이 없습니다.
     ⚠️ 자료는 **서버로 올라가지 않습니다.** 브라우저 안에서만 읽습니다.

   ■ 셈은 web/src/lib/성적표.js, 종이는 web/src/lib/성적표종이.js 가 합니다.
      이 파일은 «고르고 누르는 자리» 입니다.
   ⚠️ 검색엔진에 올리지 않습니다 — noindex, sitemap 에도 안 넣습니다.
   ⚠️ 새 주소를 만들었으니 web/firebase.json 의 rewrites 에도 넣었습니다 (8절 16).
   ══════════════════════════════════════════════════════════════ */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isOp, 나운영자 } from '../lib/운영자.js'
import { getOverview, getBidIndex, indexRows, searchCorp, getCorp } from '../lib/data.js'
import { normCorp } from '../lib/fmt.js'
import { 성적표, 업체목록, 업체찾기, P50_FALLBACK } from '../lib/성적표.js'
import { 그리기, PDF만들기, 내려받기 } from '../lib/성적표종이.js'
import { 기억됨, 꺼내기, 넣기, 바로되나, 허락받기, 골라서기억 } from '../lib/파일기억.js'

let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

const 날 = (s) => String(s || '').slice(0, 10)

/* 브라우저가 적어 둔 번호로 먼저 통과시켰을 때 쓰는 표식입니다 */
const OP_LOCAL = '«브라우저가 적어 둔 번호»'

export default function ReportMake() {
  const [uid, setUid] = useState(undefined)        // undefined=아직 · ''=못 물어봄
  const [자료, set자료] = useState(null)           // { rows, 목록, 처음, 끝 }
  const [읽는중, set읽는중] = useState('')
  const [q, setQ] = useState('')
  const [고른, set고른] = useState(null)
  const [쪽들, set쪽들] = useState(null)
  const [셈, set셈] = useState(null)
  const [가릴까, set가릴까] = useState(false)
  const [일, set일] = useState('')
  const [p50, setP50] = useState(P50_FALLBACK)
  const [마감전, set마감전] = useState([])
  const [손잡이, set손잡이] = useState(null)   // 기억해 둔 파일 — 단추 한 번이면 열립니다
  /* 🗓 2026-09-19 — 소장님: 「자가진단처럼 성적표도 3년치로 해줘」
     검색은 «3년치 업체 색인»(자가진단이 쓰는 것)으로 합니다. 두 달치 파일이 없어도 찾아집니다. */
  const [세목록, set세목록] = useState([])
  const [찾는중, set찾는중] = useState(false)
  const 타이머 = useRef(null)
  const 파일칸 = useRef(null)
  const 종이칸 = useRef(null)

  useEffect(() => {
    document.title = '업체 성적표 만들기 · K-건설맵'
    let el = document.head.querySelector('meta[name="robots"]')
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'robots'); document.head.appendChild(el) }
    el.setAttribute('content', 'noindex, nofollow')
    return () => { if (el) el.remove() }
  }, [])

  useEffect(() => {
    /* 🔖 2026-09-18 — 브라우저가 이미 적어 둔 번호를 먼저 봅니다.
       전에는 무조건 파이어베이스에 다시 물어봤습니다 — 현장에서 인터넷이
       느리거나 막히면 「여는 중…」에서 멈췄습니다. 성적표는 받아 둔 자료로
       혼자 만드는 화면이라 인터넷이 없어도 돌아가야 맞습니다.
       ⚠️ 자물쇠를 느슨하게 하는 것이 아닙니다 — 진짜 자물쇠는 **자료** 입니다.
          이 화면은 소장님 컴퓨터의 first.json 이 없으면 한 글자도 못 만듭니다. */
    나운영자().then((v) => { if (v) setUid((p) => (p === undefined ? OP_LOCAL : p)) }).catch(() => {})
    ;(async () => {
      try {
        const { ensureAnon } = await loadFb()
        const u = await ensureAnon()
        setUid((u && u.uid) || '')
      } catch { setUid((p) => (p === OP_LOCAL ? p : '')) }
    })()
    /* 사정률 중앙값은 사이트가 매번 다시 재 둡니다 — 손으로 적은 숫자를 쓰지 않습니다 */
    getOverview().then((ov) => { const v = ov?.sjq?.p50; if (v) setP50(Number(v)) }).catch(() => {})
    /* «다음에 넣을 자리» 는 지금 마감 전인 공고에서 고릅니다 (사이트가 이미 들고 있습니다) */
    getBidIndex().then((idx) => set마감전(indexRows(idx) || [])).catch(() => {})
  }, [])

  const 두달찾음 = useMemo(() => (자료 ? 업체찾기(자료.목록, q) : []), [자료, q])

  /* 3년치 색인에서 찾습니다 — 자가진단과 «같은 자료» 입니다 */
  useEffect(() => {
    clearTimeout(타이머.current)
    const s2 = normCorp(q)
    if (s2.length < 1) { set세목록([]); set찾는중(false); return undefined }
    set찾는중(true)
    타이머.current = setTimeout(() => {
      searchCorp(s2, false)
        .then((r) => searchCorp(s2, (r || []).length ? false : true).then((r2) => (r && r.length ? r : r2)))
        .then((r) => { set세목록(r || []); set찾는중(false) })
        .catch(() => { set세목록([]); set찾는중(false) })
    }, 300)
    return () => clearTimeout(타이머.current)
  }, [q])

  /* 두 자료를 «사업자번호» 로 겹칩니다 — 3년치가 먼저, 최근 두 달만 있는 곳은 뒤에 */
  const 찾음 = useMemo(() => {
    const 두 = new Map(두달찾음.map((x) => [String(x.bno), x]))
    const out = []
    const 쓴 = new Set()
    for (const c of 세목록) {
      const bno = String(c.biz || '')
      const t = bno ? 두.get(bno) : null
      if (bno) 쓴.add(bno)
      out.push({
        bno, 이름: c.nm || c.label || c.key, 키: c.key, chunk: c.chunk,
        대표: c.ceo || (t && t.대표) || '',
        세낙찰: c.n || 0, 건: t ? t.건 : 0, 낙찰: t ? t.낙찰 : 0, 마지막: t ? t.마지막 : '',
      })
    }
    for (const x of 두달찾음) {
      if (쓴.has(String(x.bno))) continue
      out.push({ bno: String(x.bno), 이름: x.이름, 키: '', chunk: null,
        대표: x.대표 || '',
        세낙찰: 0, 건: x.건, 낙찰: x.낙찰, 마지막: x.마지막 })
    }
    return out.slice(0, 60)
  }, [세목록, 두달찾음])

  /* 그린 쪽을 화면에 답니다 — 이 그림이 그대로 PDF 가 됩니다(어긋날 자리가 없습니다) */
  useEffect(() => {
    const box = 종이칸.current
    if (!box) return
    box.replaceChildren()
    if (쪽들) for (const c of 쪽들) box.appendChild(c)
  }, [쪽들])

  /* 🔖 2026-09-19 — 소장님: 「이걸 어떻게 내가 사용하라고」
     열 때마다 파일 창을 띄워 폴더를 헤집게 했더니 쓸 수 없는 도구였습니다.
     → 한 번 고르면 브라우저가 «어느 파일이었나» 를 기억합니다(lib/파일기억.js).
       다음부터는 아무것도 안 물어보고 스스로 엽니다.
     ⚠️ 파일 내용은 저장하지 않습니다. 자료는 여전히 이 컴퓨터에만 있습니다. */
  const 읽기 = async (f) => {
    if (!f) return
    set자료(null); set쪽들(null); set고른(null); set셈(null)
    set읽는중(`${f.name} 읽는 중… (${(f.size / 1048576).toFixed(1)}MB)`)
    try {
      const j = JSON.parse(await f.text())
      const rows = Object.values(j.con || {})
      if (!rows.length) { set읽는중('⛔ 개찰이 한 건도 없습니다. data/store/first.json 을 고르셨는지 보십시오.'); return }
      const dts = rows.map((r) => String(r.dt || '')).filter(Boolean).sort()
      set자료({ rows, 목록: 업체목록(rows), 처음: dts[0], 끝: dts[dts.length - 1] })
      set읽는중('')
    } catch (err) {
      set읽는중('⛔ 읽지 못했습니다 — ' + (err?.message || '알 수 없는 까닭'))
    }
  }

  const 파일받기 = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    await 읽기(f)
  }

  /* 🌐 2026-09-19 — 소장님: 「**내가 업체만 선택하면 나오게 해줘**」
   *
   * ■ 무엇이 잘못돼 있었나
   *   자료를 «안 연 채로도» 성적표가 만들어졌습니다. 그러면 3년치 낙찰만 들어간
   *   **3쪽짜리** 가 나옵니다 — 견본(7쪽)과 달라서 「왜 허접하냐」 가 됩니다.
   *   작은 글씨로 「개찰 자료를 여십시오」 라고 적어 둔 것은 아무 소용이 없었습니다.
   *
   * ■ 이제
   *   깃허브가 배포할 때 개찰 자료를 사이트에 같이 싣습니다(/data/first_full.json).
   *   이 화면은 열자마자 그것을 받아 옵니다. **고르실 것이 없습니다.**
   *   파일 고르기는 «손에 더 새 자료가 있을 때» 쓰는 뒷길로만 남겨 둡니다.
   *   그래도 자료가 없으면 **PDF 내려받기를 막습니다** — 허접한 종이가 나가지 않게. */
  useEffect(() => {
    let 살았나 = true
    ;(async () => {
      /* ① 먼저 기억해 둔 «내 컴퓨터 파일» — 사이트 것보다 새로울 수 있습니다 */
      if (기억됨()) {
        try {
          const h = await 꺼내기('first')
          if (h && 살았나) {
            set손잡이(h)
            if (await 바로되나(h)) { await 읽기(await h.getFile()); return }
          }
        } catch { /* 안 되면 ② 로 */ }
      }
      if (!살았나) return
      /* ② 사이트에 실린 개찰 자료 — 아무것도 안 하셔도 됩니다 */
      set읽는중('개찰 자료 받는 중…')
      try {
        const r = await fetch('/data/first_full.json', { cache: 'no-cache' })
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const j = await r.json()
        const rows = Object.values(j.con || {})
        if (!rows.length) throw new Error('개찰이 없습니다')
        if (!살았나) return
        const dts = rows.map((x) => String(x.dt || '')).filter(Boolean).sort()
        set자료({ rows, 목록: 업체목록(rows), 처음: dts[0], 끝: dts[dts.length - 1] })
        set읽는중('')
      } catch (e) {
        if (살았나) set읽는중('⛔ 사이트에서 개찰 자료를 받지 못했습니다 — 아래에서 직접 골라 주십시오.')
      }
    })()
    return () => { 살았나 = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const 자료열기 = async () => {
    try {
      let h = 손잡이
      if (h) {
        if (!(await 바로되나(h)) && !(await 허락받기(h))) h = null
      }
      if (!h) { h = await 골라서기억('first', '개찰 자료 (first.json)'); set손잡이(h) }
      await 넣기('first', h)
      await 읽기(await h.getFile())
    } catch (err) {
      if (err && err.name === 'AbortError') return          // 창을 닫으신 것 — 탈이 아닙니다
      set읽는중('⛔ 열지 못했습니다 — ' + (err?.message || '알 수 없는 까닭'))
    }
  }

  const 만들기 = async (업체, 가림) => {
    set일('세는 중…')
    set쪽들(null)
    try {
      /* 브라우저가 화면을 한 번 그리게 둡니다 — 안 그러면 「세는 중」 이 안 보입니다 */
      await new Promise((r) => setTimeout(r, 20))
      /* 🗓 3년치 낙찰 기록 — 사이트에서 받습니다(자가진단과 같은 자료).
         두 달치 파일이 아직 안 열렸어도 이것만으로 종이가 나옵니다. */
      let 세해 = null
      if (업체.키) {
        set일('3년치 기록을 받는 중…')
        try { 세해 = await getCorp(업체.키, 업체.chunk) } catch { 세해 = null }
      }
      const d = 성적표(업체.bno, (자료 && 자료.rows) || [], p50, 마감전, 세해, 업체.대표)
      if (!d) {
        set일(자료 ? '⛔ 그 업체의 기록이 없습니다'
                  : '⛔ 3년치 낙찰 기록이 없는 업체입니다 — 떨어진 것까지 보시려면 아래에서 개찰 자료를 여십시오.')
        return
      }
      set셈(d)
      set일('그리는 중…')
      await new Promise((r) => setTimeout(r, 20))
      set쪽들(그리기(d, { 가릴까: 가림 === undefined ? 가릴까 : 가림 }))
      set일('')
    } catch (err) {
      set일('⛔ ' + (err?.message || '만들지 못했습니다'))
    }
  }

  const 내려받기누름 = async () => {
    if (!쪽들 || !셈) return
    set일('PDF 로 묶는 중…')
    try {
      const bytes = await PDF만들기(쪽들)
      const 이름 = `${String(셈.업체.이름).replace(/[\\/:*?"<>|]/g, '')}_입찰성적표_${날(new Date().toISOString())}.pdf`
      내려받기(bytes, 가릴까 ? `K-건설맵_입찰성적표_견본_${날(new Date().toISOString())}.pdf` : 이름)
      set일('')
    } catch (err) {
      set일('⛔ ' + (err?.message || 'PDF 를 만들지 못했습니다'))
    }
  }

  if (uid === undefined) return <div className="card"><div className="muted">여는 중…</div></div>
  if (uid !== OP_LOCAL && !isOp(uid)) {
    return (
      <div className="card">
        <div className="sec-title" style={{ margin: 0 }}>📊 업체 성적표 만들기</div>
        <p className="muted" style={{ marginTop: 8 }}>
          이 화면은 운영자 브라우저에서만 열립니다.
        </p>
        <div className="btn-row">
          <Link className="btn primary" to="/">🏠 첫 화면으로</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 🔖 2026-09-19 — 소장님: 「자가진단처럼 검색으로 회사를 선택할 수 있게 하고
          자료가 나오면 내가 pdf로 다운 받을 수 있고」
          → 맨 위는 «업체 찾기» 입니다. 자료 고르는 일은 아래로 내렸습니다.
            자료는 대개 스스로 열리므로 그 칸은 눈에 안 띄어도 됩니다. */}
      <div className="card pdfwork">
        {/* 🗑 2026-09-19 — /report(이용자용 안내)는 내렸습니다. 돌아갈 곳은 관리자 화면입니다. */}
        <Link className="pdfback" to="/admin">← 관리자</Link>
        <h1 className="pdfh1">📊 업체 성적표 만들기</h1>
        <p className="pdflead">업체를 찾아 성적표를 만들고 PDF 로 내려받습니다.</p>

        <div className="field" style={{ marginTop: 10 }}>
          <label>업체 이름이나 사업자번호 <span className="hint">예: 삼원산림 · 2218146863</span></label>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="업체 이름 두 글자 이상 — 3년치에서 찾습니다"
                 autoFocus />
        </div>

        {자료 ? (
          <div className="pdfgot">
            📎 개찰 {자료.rows.length.toLocaleString()}건 · 업체 {자료.목록.length.toLocaleString()}곳
            · {날(자료.처음)} ~ {날(자료.끝)}
          </div>
        ) : (
          <div className="pdfdrop" style={{ padding: '14px 12px' }}>
            {읽는중 ? <div className="pdflog">{읽는중}</div> : (
              <>
                <button type="button" className="pdfpick"
                        onClick={() => (기억됨() ? 자료열기() : 파일칸.current?.click())}>
                  {손잡이 ? '개찰 자료 열기 (한 번만 누르시면 됩니다)' : '개찰 자료 고르기 (first.json)'}
                </button>
                <div className="pdfdrop-d">
                  {손잡이
                    ? '전에 고르신 파일을 기억하고 있습니다 — 폴더를 다시 헤집지 않습니다'
                    : '소장님 컴퓨터의 data/store/first.json — 한 번만 고르시면 다음부터 저절로 열립니다'}
                </div>
              </>
            )}
          </div>
        )}
        {읽는중 && 자료 && <div className="pdflog" style={{ marginTop: 8 }}>{읽는중}</div>}

        {자료 && 자료.rows.length < 1000 && (
          <p className="note sm" style={{ marginTop: 8 }}>
            ⚠️ 개찰이 {자료.rows.length}건뿐입니다 — 사이트에 실린 <b>요약본(최근 300건)</b>을 고르신 것 같습니다.
            성적표는 <b>data/store/first.json</b> 이라야 제대로 나옵니다.
          </p>
        )}

        {q && !찾는중 && !찾음.length && (
          <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>찾지 못했습니다.</div>
        )}
        {찾는중 && <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>찾는 중…</div>}
        {/* ⚠️ 이름이 같고 사업자번호가 다른 업체가 1,846가지 있습니다.
            그래서 목록에 사업자번호를 같이 보여 주고, 고르는 것은 사업자번호로 합니다. */}
        {찾음.length > 0 && (
          <table className="tbl left repmk" style={{ marginTop: 10 }}>
            <thead><tr><th>업체</th><th>대표</th><th>사업자번호</th><th>3년 낙찰</th><th>두 달 투찰</th><th></th></tr></thead>
            <tbody>
              {찾음.map((x, i) => (
                <tr key={(x.bno || x.키) + '_' + i} className={고른 && 고른.키 === x.키 && 고른.bno === x.bno ? 'on' : ''}>
                  <td><b>{x.이름}</b></td>
                  <td>{x.대표 || '—'}</td>
                  <td className="mono">{x.bno || '—'}</td>
                  <td className="r">{x.세낙찰 ? `${x.세낙찰}건` : '—'}</td>
                  <td className="r">{x.건 ? `${x.건}건` : (자료 ? '—' : '자료 안 엶')}</td>
                  <td className="r">
                    <button className="btn line sm" onClick={() => { set고른(x); 만들기(x) }}>성적표</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <input ref={파일칸} type="file" className="sr-only" tabIndex={-1}
               accept=".json,application/json" onChange={파일받기} />
        <p className="pdfsafe" style={{ marginTop: 12 }}>
          🔒 개찰 자료는 <b>이 브라우저 안에서만</b> 읽습니다 — 아무 데도 보내지 않습니다.
          자료는 사이트에 실린 것을 스스로 받아 옵니다(고르실 것 없습니다).
          {자료 && (
            <> · <button type="button" className="navi"
                        style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }}
                        onClick={() => (기억됨() ? 자료열기() : 파일칸.current?.click())}>다른 자료 고르기</button></>
          )}
        </p>
      </div>

      {(일 || 쪽들) && (
        <div className="card">
          <div className="sec-title" style={{ margin: 0 }}>
            {셈
              ? (셈.요약
                ? `${셈.업체.이름} — 투찰 ${셈.요약.투찰}건 · 낙찰 ${셈.요약.낙찰}건`
                : `${셈.업체.이름} — 3년치 낙찰 ${(셈.세해 && 셈.세해.낙찰) || 0}건 (최근 두 달 투찰 기록 없음)`)
              : '성적표'}
          </div>
          {일 && <div className="pdflog" style={{ marginTop: 8 }}>{일}</div>}
          {쪽들 && (
            <>
              <div className="btn-row" style={{ marginTop: 10 }}>
                <button className="btn primary pdfgo" onClick={내려받기누름} disabled={!자료}
                  title={자료 ? '' : '개찰 자료가 없어 3년치 낙찰만 담깁니다'}>
                  ⬇ PDF 내려받기 ({쪽들.length}쪽)
                </button>
                <button className="btn ghost" onClick={() => {
                  const v = !가릴까; set가릴까(v); if (고른) 만들기(고른, v)
                }}>
                  {가릴까 ? '진짜 이름으로' : '견본으로 (이름 가리기)'}
                </button>
              </div>
              <p className="note sm" style={{ marginTop: 8 }}>
                아래 그림이 <b>그대로 PDF</b> 가 됩니다.{' '}
                {자료
                  ? <>떨어진 것까지 담긴 자료는 {날(자료.처음)} ~ {날(자료.끝)} 개찰이고,
                     개찰마다 <b>낮은 금액 순 30곳</b>까지입니다. 그 앞은 <b>3년치 낙찰 기록</b>입니다.</>
                  : <span style={{ color: 'var(--bad)', fontWeight: 700 }}>
                      ⛔ 개찰 자료가 없어 <b>3년치 낙찰 기록</b>만 담겼습니다(3쪽).
                      이대로는 보내지 마십시오 — 위에서 <b>개찰 자료</b>를 열면 7쪽으로 나옵니다.
                    </span>}
              </p>
              <div className="repdoc" ref={종이칸} />
            </>
          )}
        </div>
      )}
    </>
  )
}
