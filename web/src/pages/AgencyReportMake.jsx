/* ══════════════════════════════════════════════════════════════
   /report/agency — 「발주기관 정밀 분석」을 **여기서 만들고 내려받습니다** (2026-09-28)

   소장님: 「발주기관 분석도 좀 더 세세하게 할 수 없을까? 업체 자가 진단 처럼
            PDF 견본을 보여주고 신청하게 하는 거지」 · 「자가진단하고 같은 형태로 가자」

   ■ 업체 성적표(/report/make)와 같은 틀입니다.
       이용자  — 분석 › 발주기관 탭에서 견본 PDF 를 보고 사랑방에 신청
       소장님  — 여기서 기관을 고르면 종이가 나오고 PDF 로 내려받아 보내 드림
   ■ 숫자는 사이트 빌드 때 agency_deep.py 가 뽑아 둔 /data/agency_deep/{묶음}.json 입니다.
     이 화면은 «고르고 누르는 자리» 이고, 종이는 lib/기관보고서종이.js 가 그립니다.
   ⚠️ 이용자에게는 이 화면이 안 열립니다(운영자 브라우저만). 검색엔진에도 안 올립니다(noindex).
   ⚠️ 새 주소라 web/firebase.json 의 rewrites 에도 넣었습니다 (8절 16).
   ══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isOp, 나운영자 } from '../lib/운영자.js'
import { getJSON, getOverview, getBidIndex, indexRows } from '../lib/data.js'
import { AgencyPicker } from '../components.jsx'
import { 다음자리, P50_FALLBACK } from '../lib/성적표.js'
import { PDF만들기, 내려받기 } from '../lib/성적표종이.js'
import { 기관그리기 } from '../lib/기관보고서종이.js'

let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

const 날 = (s) => String(s || '').slice(0, 10)
const OP_LOCAL = '«브라우저가 적어 둔 번호»'

export default function AgencyReportMake() {
  const [uid, setUid] = useState(undefined)
  const [기관, set기관] = useState(null)          // { name, chunk }
  const [셈, set셈] = useState(null)              // agency_deep 의 한 곳
  const [meta, setMeta] = useState(null)
  const [쪽들, set쪽들] = useState(null)
  const [일, set일] = useState('')
  const [가릴까, set가릴까] = useState(false)
  const [기관도, set기관도] = useState(false)
  const [p50, setP50] = useState(P50_FALLBACK)
  const [마감전, set마감전] = useState([])
  const 종이칸 = useRef(null)

  useEffect(() => {
    document.title = '발주기관 보고서 만들기 · K-건설맵'
    let el = document.head.querySelector('meta[name="robots"]')
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'robots'); document.head.appendChild(el) }
    el.setAttribute('content', 'noindex, nofollow')
    return () => { if (el) el.remove() }
  }, [])

  useEffect(() => {
    /* 🐛 2026-09-28 — 파이어베이스가 «먼저» 실패하면(인터넷이 막힌 현장) uid 가 '' 로 굳고, 뒤늦게 온
       «브라우저에 적힌 운영자 번호» 가 무시돼 소장님 브라우저인데도 «운영자만» 으로 막혔습니다(시험에서 잡음).
       → 운영자 번호가 확인되면 순서와 상관없이 엽니다(진짜 운영자 uid 로 이미 열렸으면 그대로). */
    나운영자().then((v) => { if (v) setUid((p) => (p && p !== OP_LOCAL && isOp(p) ? p : OP_LOCAL)) }).catch(() => {})
    ;(async () => {
      try {
        const { ensureAnon } = await loadFb()
        const u = await ensureAnon()
        setUid((p) => (p === OP_LOCAL ? p : ((u && u.uid) || '')))
      } catch { setUid((p) => (p === OP_LOCAL ? p : '')) }
    })()
    getOverview().then((ov) => { const v = ov?.sjq?.p50; if (v) setP50(Number(v)) }).catch(() => {})
    getBidIndex().then((idx) => set마감전(indexRows(idx) || [])).catch(() => {})
    getJSON('/data/agency_deep/meta.json').then((m) => setMeta(m || null)).catch(() => setMeta(null))
  }, [])

  /* 그린 쪽을 화면에 답니다 — 이 그림이 그대로 PDF 가 됩니다 */
  useEffect(() => {
    const box = 종이칸.current
    if (!box) return
    box.replaceChildren()
    if (쪽들) for (const c of 쪽들) box.appendChild(c)
  }, [쪽들])

  const 그리기 = (name, d, 가, 기) => {
    /* 마감 전 공고의 권장 금액 — 업체 성적표와 «같은 셈»(lib/성적표.js 다음자리)을 씁니다 */
    /* 다음자리() 는 «그 업체가 넣던 금액대» 로 공고를 거릅니다. 기관 보고서는 금액대를 가리지 않으므로
       아주 작은 것 · 아주 큰 것 두 줄을 재료로 줘 금액 거르개를 사실상 끕니다. */
    const 재료 = [{ inst: name, base: 1 }, { inst: name, base: 5e10 }]
    const 지금 = 다음자리(재료, 마감전, p50, 30).filter((x) => x.inst === name)
    set쪽들(기관그리기(d, meta, { 이름: name, 가릴까: 가, 기관도: 기, 마감전: 지금 }))
  }

  const 만들기 = async (고른, 가 = 가릴까, 기 = 기관도) => {
    let a = 고른
    set일('자료 받는 중…'); set쪽들(null); set셈(null)
    try {
      if (a.chunk == null) throw new Error('기관 묶음 번호를 모릅니다 — 목록에서 다시 골라 주십시오')
      const dat = await getJSON(`/data/agency_deep/${a.chunk}.json`)
      /* ⚠️ «자료가 없는 상태» 를 «기록이 적은 기관» 으로 말하면 거짓말입니다 — 따로 말합니다 */
      if (!dat && !meta) {
        set일('⛔ 보고서 자료가 아직 사이트에 없습니다 — 사이트 자동 갱신(빌드)이 한 번 돌고 나면 생깁니다.')
        return
      }
      let d = dat && dat[a.name]
      /* 🏷 옛 이름(«전라남도 여수시») 을 고르셨으면 새 이름 보고서로 갑니다 — 두 이름의 기록을 묶어 둔 것입니다 */
      if (d && d['=']) {
        const 새 = { name: d['='], chunk: d.c }
        const dat2 = await getJSON(`/data/agency_deep/${새.chunk}.json`)
        d = dat2 && dat2[새.name]
        if (d) { a = 새; set기관(새) }
      }
      if (!d) {
        set일(`⛔ «${a.name}» 은(는) 3년치 낙찰이 ${meta?.min || 20}건이 안 되어 보고서를 만들지 않았습니다.`)
        return
      }
      set셈(d)
      set일('그리는 중…')
      await new Promise((r) => setTimeout(r, 20))
      그리기(a.name, d, 가, 기)
      set일('')
    } catch (err) {
      set일('⛔ ' + (err?.message || '만들지 못했습니다'))
    }
  }

  const 내려받기누름 = async () => {
    if (!쪽들 || !기관) return
    set일('PDF 로 묶는 중…')
    try {
      const bytes = await PDF만들기(쪽들, '발주기관 정밀 분석')
      const 오늘 = 날(new Date().toISOString())
      const 이름 = 가릴까
        ? `K-건설맵_발주기관분석_견본_${오늘}.pdf`
        : `${String(기관.name).replace(/[\\/:*?"<>|]/g, '')}_발주기관분석_${오늘}.pdf`
      내려받기(bytes, 이름)
      set일('')
    } catch (err) {
      set일('⛔ ' + (err?.message || 'PDF 를 만들지 못했습니다'))
    }
  }

  const 바꾸기 = (가, 기) => {
    set가릴까(가); set기관도(기)
    if (기관 && 셈) 그리기(기관.name, 셈, 가, 기)
  }

  if (uid === undefined) return <div className="card"><div className="muted">여는 중…</div></div>
  if (uid !== OP_LOCAL && !isOp(uid)) {
    return (
      <div className="card">
        <div className="sec-title" style={{ margin: 0 }}>🏛 발주기관 보고서 만들기</div>
        <p className="muted" style={{ marginTop: 8 }}>이 화면은 운영자 브라우저에서만 열립니다.</p>
        <div className="btn-row">
          <Link className="btn primary" to="/analysis">🔍 발주기관 분석으로</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card pdfwork">
        <Link className="pdfback" to="/admin">← 관리자</Link>
        <h1 className="pdfh1">🏛 발주기관 보고서 만들기</h1>
        <p className="pdflead">기관을 고르면 정밀 분석 종이가 나오고, PDF 로 내려받습니다.</p>
        <AgencyPicker value={기관?.name || ''} autoFocus
          onPick={(a) => { set기관(a); 만들기(a) }} />
        <p className="pdfsafe" style={{ marginTop: 10 }}>
          📎 {meta
            ? <>3년치 낙찰이 {meta.min}건 이상인 기관 <b>{Number(meta.n).toLocaleString()}곳</b> ·
                순위 기록 {날(meta.rd0)} ~ {날(meta.rd1)} 개찰 {Number(meta.rn).toLocaleString()}건
                · {meta.made} 빌드</>
            : '보고서 자료(/data/agency_deep)를 받는 중이거나 아직 빌드되지 않았습니다.'}
        </p>
      </div>

      {(일 || 쪽들) && (
        <div className="card">
          <div className="sec-title" style={{ margin: 0 }}>
            {셈 && 기관
              ? `${기관.name} — 낙찰 ${셈.w.n.toLocaleString()}건 · 순위 기록 ${(셈.r?.n || 0).toLocaleString()}건`
              : '발주기관 보고서'}
          </div>
          {일 && <div className="pdflog" style={{ marginTop: 8 }}>{일}</div>}
          {쪽들 && (
            <>
              <div className="btn-row" style={{ marginTop: 10 }}>
                <button className="btn primary pdfgo" onClick={내려받기누름}>⬇ PDF 내려받기 ({쪽들.length}쪽)</button>
                <button className="btn ghost" onClick={() => 바꾸기(!가릴까, 가릴까 ? false : 기관도)}>
                  {가릴까 ? '진짜 이름으로' : '견본으로 (업체·공고명 가리기)'}
                </button>
                {가릴까 && (
                  <button className="btn line" onClick={() => 바꾸기(true, !기관도)}>
                    {기관도 ? '기관 이름 보이기' : '기관 이름도 가리기'}
                  </button>
                )}
              </div>
              <p className="note sm" style={{ marginTop: 8 }}>
                아래 그림이 <b>그대로 PDF</b> 가 됩니다. 낙찰은 3년치,
                참가자·1·2위 차이는 <b>순위 기록</b>({날(셈?.r?.d0)} ~ {날(셈?.r?.d1)})에서,
                사정률은 기초금액이 실린 최근분에서 셉니다 — 종이에도 칸마다 적혀 있습니다.
              </p>
              <div className="repdoc" ref={종이칸} />
            </>
          )}
        </div>
      )}
    </>
  )
}
