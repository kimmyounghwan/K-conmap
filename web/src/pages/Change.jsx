import { useEffect, useMemo, useRef, useState } from 'react'

import { askAfter } from '../AskComment'
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/change.json'
// forms.json(217KB)이 아니라 formsgen.py 가 구운 «작은 목록»(6KB)을 씁니다.
import FMIN from '../data/forms-min.json'
import { ShareBtn } from './CorpPage.jsx'
import { Empty, Skeleton } from '../components.jsx'
import { won, num } from '../lib/fmt.js'
import { calcRow, 붙여읽기 } from '../lib/설계변경셈.js'
import UserForms from '../UserForms.jsx'
import { getNaeyeok, getNaeyeokAll, naeyeokRows } from '../lib/data.js'

import { use남김 } from '../lib/길기록.js'
import { 받은수, 세기 } from '../lib/받은수.jsx'   /* 👁 2026-10-17 서식 · 도구마다 받기 · 조회 · 🧮 G371 세기 */
/**
 * /change · /change/{주제} · /change/calc — 「설계변경」 (2026-09-05)
 *
 * 소장님: 「설계변경 자료를 추가해 보자… 최대한 자세하게. 다른 사이트보다 좋아야 해.
 *          탭도 만들고 각각의 페이지도 넣고, 홍보 문구도 넣되 삭제 가능하게」
 *
 * 다른 곳과 다르게 만든 지점
 *   대부분의 사이트는 조문을 옮겨 적기만 합니다. 그건 읽어도 «내 공사에서 얼마»가 안 나옵니다.
 *   그래서 ① 계산기(증가·감소·신규비목을 규정대로 계산) ② 실무 함정 ③ 서식 연결 을 붙였습니다.
 *
 * ⚠️ 단가 기준은 확인하고 적었습니다(국가계약법 시행령 제65조 · 찾기쉬운 생활법령정보).
 *    - 증가 물량 → **계약단가**(계약단가가 예정가격단가보다 높으면 예정가격단가)
 *    - 신규 비목 → **설계변경 당시 단가 × 낙찰률**
 *    - 발주기관 요구 → 협의, 불성립 시 두 값의 중간(50%)
 *    «증가 물량에 낙찰률을 곱하는» 흔한 오해를 코드가 따라가지 않게 할 것.
 */

const TOPICS = DATA.topics || []
const FORMSETS = DATA.forms || []
const BOOK = DATA.mainbook || null
const KEY = 'kcm_chgcalc'
const P50 = 0

export function topicBySlug(s) { return TOPICS.find((t) => t.slug === s) || null }

/* ── 본문 블록 — prerender.py 와 «같은 종류»를 그립니다 ── */
function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    if (b.t === 'p') return <p className="cp" key={i}>{md(b.text)}</p>
    if (b.t === 'warn') return <div className="cwarn" key={i}>⚠️ {md(b.text)}</div>
    if (b.t === 'links') {
      /* 공식 자료는 «링크»로만 연결합니다 — 파일을 우리가 퍼오지 않습니다. */
      return (
        <div className="clinks" key={i}>
          {b.items.map(([nm, url, note], j) => (
            <a className="clink" key={j} href={url} target="_blank" rel="noopener nofollow">
              <span className="ct">{nm}</span>
              <span className="cd">{note}</span>
              <span className="go">↗</span>
            </a>
          ))}
        </div>
      )
    }
    if (b.t === 'ul') {
      return <ul className="flist" key={i}>{b.items.map((x, j) => <li key={j}>{md(x)}</li>)}</ul>
    }
    if (b.t === 'steps') {
      return (
        <div className="csteps" key={i}>
          {b.items.map(([h, d], j) => (
            <div className="cstep" key={j}><b>{h}</b><span>{md(d)}</span></div>
          ))}
        </div>
      )
    }
    if (b.t === 'table') {
      return (
        <div className="fscroll" key={i}>
          {/* fit: 열이 적은 표는 접어 보임 · stk: 폰에서 줄마다 카드로 쌓음(머리 이름을 칸 위에) — prerender.py 와 같게(G331) */}
          <table className={'ctab' + (b.fit ? ' fit' : '') + (b.stk ? ' stk' : '')}>
            <thead><tr>{b.cols.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
            <tbody>
              {b.rows.map((r, j) => (
                <tr key={j}>{r.map((c, k) => <td key={k} data-l={b.cols[k] || ''}>{md(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    return null
  })
}

/* **굵게** 만 처리합니다 — 마크다운 라이브러리를 브라우저로 보내지 않기 위해서입니다. */
function md(s) {
  const parts = String(s).split(/\*\*(.+?)\*\*/g)
  return parts.map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
}



/* ── 설계변경 자동계산 통합 엑셀 — 이 탭의 «본체» ──
   빈 표 105가지와 성격이 다릅니다. 이건 수식이 연결된 계산기입니다. */
export function MainBook({ inPage }) {
  if (!BOOK) return null
  return (
    <div className="card mbook">
      <div className="mb-top">
        <span className="mb-ic">📊</span>
        <div className="grow">
          <div className="mb-t">{BOOK.title}</div>
          <div className="mb-s">{BOOK.sub}</div>
        </div>
      </div>
      {/* 전용 페이지(/change/excel)에서는 위에 이미 같은 문장이 있어 빼줍니다 */}
      {!inPage && <p className="cp" style={{ marginTop: 8 }}>{md(BOOK.lead)}</p>}

      <div className="btn-row" style={{ marginTop: 10, marginBottom: 4 }}>
        <a className="btn primary" href={`/forms/${BOOK.file}.xlsx`}
           download={`${BOOK.title}.xlsx`}
           onClick={() => askAfter('change')}>⬇ 엑셀 내려받기 (시트 11장)</a>
        {!inPage && <Link className="btn ghost" to="/change/excel">쓰는 법 · 자주 묻는 것</Link>}
      </div>

      <div className="mb-grid">
        {BOOK.sheets.map(([n, d], i) => (
          <div className="mb-cell" key={n}>
            <b><span className="mb-no">{i + 1}</span>{n}</b>
            <span>{d}</span>
          </div>
        ))}
      </div>

      <div className="mb-rule">
        <b>이 파일이 쓰는 단가 기준 (국가계약법 시행령 제65조)</b>
        <ul>{BOOK.rules.map((r, i) => <li key={i}>{md(r)}</li>)}</ul>
      </div>

      <div className="mb-ok">✔ {md(BOOK.checked)}</div>
    </div>
  )
}

/* ── 설계변경 서식 — 설명만 있고 서식이 없으면 아무 소용이 없습니다 ──
   소장님: 「설명만 있을뿐 정작 필요한 서식은 하나도 없어.」
   그래서 이 자리에서 **바로 내려받게** 합니다. 서식 탭으로 보내지 않습니다. */
export function ChangeForms({ compact }) {
  return (
    <div className="card">
      <div className="sec-title" style={{ margin: '0 0 2px' }}>
        📄 설계변경 서식 <span className="count">
          {FORMSETS.reduce((n, g) => n + g.slugs.filter((x) => FMIN[x]).length, 0)}가지 · 엑셀 · 바로 이용 가능
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px' }}>
        내려받아 바로 쓰는 엑셀입니다. 회원가입 없습니다. 1행의 표시는 지우고 쓰셔도 됩니다.
      </div>
      {FORMSETS.map((g) => (
        <div className="fset" key={g.h}>
          <div className="fset-h"><b>{g.h}</b><em>{g.why}</em></div>
          {g.slugs.map((slug) => {
            const m = FMIN[slug]
            if (!m) return null
            const [title, icon, short] = m
            return (
              <div className="frow" key={slug}>
                <span className="fic">{icon || '📄'}</span>
                <div className="grow">
                  <Link className="ft" to={`/forms/${slug}`}>{title}</Link>
                  {/* 🩹 2026-10-21 도구 점검 — ⬇ · 👁 숫자가 설명 한 줄 끝(«…» 자름)에 붙어 폰에서 안 보였음 → 제 줄로 */}
                  {!compact && <div className="d">{short}</div>}
                  <받은수 파일={[`/forms/${slug}.xlsx`]} 봄={`/forms/${slug}`} className="dlcount fcnt" />
                </div>
                <a className="fdl" href={`/forms/${slug}.xlsx`}
                   download={`${title}_양식.xlsx`} onClick={() => askAfter('forms')}>⬇ 엑셀</a>
              </div>
            )
          })}
        </div>
      ))}
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
        발주기관이 공고 붙임으로 준 서식이 있으면 <b>그 서식을 쓰세요.</b> 이건 없을 때 쓰는 것입니다.
      </div>
    </div>
  )
}


/* ── /change/excel — 통합 엑셀 «전용 페이지» (2026-09-05) ──
   왜 따로 두나: 「설계변경 내역서 엑셀」·「공사원가계산서 양식」 은 실제로 검색되는 말인데,
   그 파일이 설계변경 탭 «안»에만 있으면 검색에서 찾아올 주소가 없습니다.
   미리 굽는 HTML 이 있으므로 네이버(자바스크립트를 안 돌림)도 이 글자를 읽습니다. */
export function ChangeBook() {
  if (!BOOK) return <Empty icon="📊">자료를 찾지 못했습니다.</Empty>
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <ShareBtn />
      </div>

      <div className="card">
        <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>{BOOK.h1}</h1>
        <p className="cp" style={{ marginTop: 8 }}>{md(BOOK.lead)}</p>
      </div>

      <MainBook inPage />

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>이럴 때 씁니다</div>
        {(BOOK.use || []).map(([h, d], i) => (
          <div className="frow" key={i}>
            <span className="fic">▸</span>
            <div className="grow">
              <div className="t" style={{ fontWeight: 700, fontSize: 13.5 }}>{h}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.6 }}>{md(d)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>자주 묻는 것</div>
        {(BOOK.faq || []).map(([q, a], i) => (
          <details className="cfaq" key={i}>
            <summary>{q}</summary>
            <div>{md(a)}</div>
          </details>
        ))}
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>
          함께 쓰는 서식 <span className="count">· 낱장으로도 받을 수 있습니다</span>
        </div>
        {(BOOK.related || []).map((slug) => {
          const m = FMIN[slug]
          if (!m) return null
          const [title, icon, short] = m
          return (
            <div className="frow" key={slug}>
              <span className="fic">{icon || '📄'}</span>
              <div className="grow">
                <Link className="ft" to={`/forms/${slug}`}>{title}</Link>
                <div className="d">{short}</div>
                <받은수 파일={[`/forms/${slug}.xlsx`]} 봄={`/forms/${slug}`} className="dlcount fcnt" />
              </div>
              <a className="fdl" href={`/forms/${slug}.xlsx`} download={`${title}_양식.xlsx`} onClick={() => askAfter('forms')}>⬇ 엑셀</a>
            </div>
          )
        })}
        <div style={{ marginTop: 10 }}>
          <Link className="btn ghost sm" to="/forms">건설 서식 전부 보기 →</Link>
        </div>
      </div>

      <div className="card fwarn">
        <b>⚠️ 참고 자료입니다</b>
        <div>
          국가계약법 시행령 등을 바탕으로 만들었지만 계약서의 특수조건과 발주기관의 판단이
          우선합니다. 금액이 큰 건은 전문가 검토를 받으세요.
        </div>
      </div>
    </>
  )
}


/* ── /change/naeyeok — 내역서 모음 (2026-09-05) ──
   소장님: 「모든 내역서는 참고할 수 있게 설계변경쪽에 분류해서 정리해서 다운받을 수 있게」
   그리고 「파일은 퍼 와도 돼, 사이트에서 사용자가 다운 받을수 있게 해줘. 그래야 홍보 문구를 넣지」

   ⚠️ 두 가지가 섞여 있습니다. 화면에서 반드시 갈라 보여야 합니다.
      · local 이 있는 것 — K-건설맵이 실제로 받아 둔 파일. 바로 내려받습니다.
      · local 이 없는 것 — 조달청이 준 주소로 «연결»만 합니다.
      주소는 언제나 조달청이 준 것을 그대로 씁니다 (CLAUDE.md 1번).

   ⚠️ 「단가 있음」 은 이름으로 짐작하지 않습니다.
      priced  1 = 파일을 열어 단가 열에 숫자가 있는 것을 확인함
              0 = 열어 봤더니 비어 있었음
             -1 = 아직 안 열어 봄 (갈래 이름으로만 말합니다) */
const NPAGE = 25
const PRICED = ['설계내역서', '단가산출서']
const ADKEY = 'kcm_nyad'

/* 단가 뱃지 — 「확인함」 과 「짐작」 을 절대 같은 말로 적지 않습니다 */

/* ── 💰 단가판 — 뽑아 둔 줄을 그 자리에서 펼쳐 봅니다 (2026-09-20) ──────
   소장님: 「내역서 자동화… 일정량이 되면 오래된 순으로 삭제하고」

   ■ 왜 원본이 아니라 «뽑은 줄» 인가
     원본 엑셀은 한 부에 평균 595KB 라 보관함(50MB)에 90부밖에 안 들어갑니다.
     뽑은 줄은 한 부에 수십 KB — 같은 자리에 스무 배 넘게 들어갑니다.
     **원본이 상한에 밀려 빠져도 단가는 남습니다.** 원본은 조달청 링크로 받습니다.

   ■ 누를 때만 받습니다
     목록에는 «줄 수»만 싣고, 실제 줄은 /naeyeok-rows/{열쇠}.json 에서
     그 줄을 누를 때만 받아옵니다. 전송량이 곧 요금이라 그렇게 했습니다. */
function 단가판({ rk, 닫기 }) {
  const [줄, set줄] = useState(null)      // null 받는 중 · false 실패
  const [q, setQ] = useState('')

  useEffect(() => {
    if (줄 !== null) return
    let 살았나 = true
    fetch('/naeyeok-rows/' + rk + '.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((v) => { if (살았나) set줄(Array.isArray(v) ? v : false) })
      .catch(() => { if (살았나) set줄(false) })
    return () => { 살았나 = false }
  }, [rk, 줄])

  const 보임 = useMemo(() => {
    if (!Array.isArray(줄)) return []
    const t = q.trim()
    const v = t ? 줄.filter((a) => (a[0] || '').includes(t) || (a[1] || '').includes(t)) : 줄
    return v.slice(0, 300)
  }, [줄, q])

  return (
    <div className="nyprice">
      <div className="btn-row" style={{ marginBottom: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="품명 · 규격으로 찾기" style={{ flex: 1, minWidth: 0 }} />
        <button className="btn ghost sm" onClick={닫기}>닫기</button>
      </div>
      {줄 === null ? <Skeleton n={3} />
        : 줄 === false ? <div className="note">단가를 불러오지 못했습니다.</div>
        : (
          <>
            <div className="nyscroll">
              <table className="tbl left">
                <thead><tr><th>품명</th><th>규격</th><th>단위</th><th style={{ textAlign: 'right' }}>단가</th></tr></thead>
                <tbody>
                  {보임.map((a, i) => (
                    <tr key={i}>
                      <td>{a[0]}</td><td>{a[1]}</td><td>{a[2]}</td>
                      <td style={{ textAlign: 'right' }}>{won(a[3])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="note" style={{ marginTop: 8 }}>
              {보임.length < 줄.length
                ? <>{num(줄.length)}줄 가운데 {num(보임.length)}줄만 보입니다 — 찾기 칸에 품명을 적어 보십시오.</>
                : <>{num(줄.length)}줄 전부입니다.</>}{' '}
              <b>그 공고 시점의 단가</b>입니다. 원본 엑셀은 위 링크에서 받으십시오.
            </div>
          </>
        )}
    </div>
  )
}

/* 내역서 한 줄. 단가판은 단추와 «같은 칸» 에 두면 안 됩니다 —
   좁은 화면(390px)에서 단추들과 한 줄에 나란히 서느라 표가 오른쪽으로 잘립니다(실측).
   그래서 단추만 .nybtn 에 두고, 표는 줄 맨 끝에 한 줄 통째로 폅니다. */
function 내역서줄({ r }) {
  const [열림, set열림] = useState(false)
  return (
    <div className="frow nyrow">
      <span className="fic">{r.priced === 0 ? '📑' : PRICED.includes(r.kind) ? '💰' : '📑'}</span>
      <div className="grow">
        <div className="ft">{r.file} <PriceTag r={r} /></div>
        <div className="d">{r.name}</div>
        <div className="nymeta">
          {r.inst}{r.dt ? ` · ${r.dt}` : ''}{r.no ? ` · 공고 ${r.no}` : ''}
        </div>
      </div>
      <div className="nybtn">
        {r.local
          ? <a className="fdl" href={r.local} download>⬇ 바로 받기</a>
          : <a className="fdl" href={r.url} target="_blank" rel="noopener nofollow">⬇ 나라장터에서 받기</a>}
        {r.purl && <a className="fdl ghost" href={r.purl} target="_blank" rel="noopener nofollow">공고 →</a>}
        {r.rk
          ? <button className="fdl ghost" onClick={() => set열림((v) => !v)}>
              💰 단가 {num(r.nrow)}줄 {열림 ? '닫기' : '보기'}
            </button>
          : null}
      </div>
      {열림 && r.rk ? <단가판 rk={r.rk} 닫기={() => set열림(false)} /> : null}
    </div>
  )
}

function PriceTag({ r }) {
  if (r.priced === 1) return <em className="dtag ok">단가 확인됨</em>
  if (r.priced === 0) return <em className="dtag no">열어 보니 단가 없음</em>
  return null
}

export function ChangeNaeyeok() {
  /* /change/naeyeok/{갈래} 로 들어오면 그 갈래를 펴 놓습니다.
     ⚠️ 미리 구운 HTML 과 «같은 것» 을 보여줘야 합니다 — 검색으로 들어온 사람이
        글자가 바뀌는 걸 보면 안 됩니다. */
  const { kind: kindParam } = useParams()
  const [priced, setPriced] = useState(null)   // 단가가 든 갈래
  const [all, setAll] = useState(null)         // 나머지 (누를 때만 받습니다)
  const [kind, setKind] = useState(kindParam ? decodeURIComponent(kindParam) : '설계내역서')
  /* 🧭 2026-09-27 — 내역서를 받으러 나갔다가 뒤로 와도 찾던 말·쪽 그대로 (이 탭을 닫을 때까지) */
  const [q, setQ] = use남김('kcm.chgnae.q', '', 'session')
  const [here, setHere] = use남김('kcm.chgnae.here', false, 'session')      // 바로 받을 수 있는 것만
  const [page, setPage] = use남김('kcm.chgnae.page', 1, 'session')
  const [ad, setAd] = useState(() => {
    try { return localStorage.getItem(ADKEY) !== '0' } catch { return true }
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => { getNaeyeok().then(setPriced).catch(() => setPriced(false)) }, [])
  useEffect(() => { try { localStorage.setItem(ADKEY, ad ? '1' : '0') } catch { /* 사생활 모드 */ } }, [ad])
  const 첫쪽 = useRef(true)   /* 처음 그릴 때는 남긴 쪽을 지우지 않습니다 */
  useEffect(() => { if (첫쪽.current) { 첫쪽.current = false; return } setPage(1) }, [kind, q, here])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 단가가 없는 갈래를 처음 누를 때만 큰 파일을 받습니다 — 안 보는 것은 안 받습니다 */
  useEffect(() => {
    if (PRICED.includes(kind) || all !== null) return
    getNaeyeokAll().then(setAll).catch(() => setAll(false))
  }, [kind, all])

  const meta = priced || null
  const kinds = useMemo(() => {
    const c = (meta && meta.kinds) || {}
    const order = ['설계내역서', '단가산출서', '공내역서', '물량내역서', '수량산출서', '그 밖의 내역서']
    return order.filter((k) => c[k]).map((k) => [k, c[k]])
  }, [meta])

  const src = PRICED.includes(kind) ? priced : all
  const rows = useMemo(() => {
    if (!src) return null
    const s = q.trim()
    const v = naeyeokRows(src).filter((r) => r.kind === kind
      && (!here || r.local)
      && (!s || (r.file || '').includes(s) || (r.name || '').includes(s) || (r.inst || '').includes(s)))
    /* 앞으로 오는 차례: ① 받아 뒀고 단가 확인됨 ② 받아 둔 나머지 ③ 링크만
       ⚠️ 「받아 둔 것」만으로 정렬하면 «열어 보니 단가 없음» 이 맨 위로 올라옵니다.
          설계내역서 갈래를 열었는데 첫 줄이 «단가 없음» 이면 갈래 자체를 못 믿게 됩니다. */
    const rank = (r) => (r.priced === 1 ? 2 : r.local ? 1 : 0)
    return v.sort((a, b) => rank(b) - rank(a))
  }, [src, kind, q, here])

  /* 이 갈래에 «바로 받을 수 있는 것» 이 몇 개인가 — 토글에 숫자를 적기 위해 */
  const nLocal = useMemo(() => {
    if (!src) return 0
    return naeyeokRows(src).filter((r) => r.kind === kind && r.local).length
  }, [src, kind])

  const total = rows ? rows.length : 0
  const pages = Math.max(1, Math.ceil(total / NPAGE))
  const view = rows ? rows.slice((page - 1) * NPAGE, page * NPAGE) : []

  const copyList = () => {
    const base = typeof location !== 'undefined' ? location.origin : 'https://k-conmap.com'
    const txt = view.map((r) => `${r.file}\n  ${r.inst} · ${r.dt}\n  ${r.local ? base + r.local : r.url}`).join('\n\n')
    const tail = ad ? '\n\n— K-건설맵 내역서 모음 · k-conmap.com/change/naeyeok' : ''
    navigator.clipboard?.writeText(txt + tail).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1600)
    })
  }

  if (priced === false) return <Empty icon="📑">내역서 목록을 불러오지 못했습니다.</Empty>

  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <ShareBtn />
      </div>

      <div className="card">
        <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>공사 내역서 모음 — 2026년</h1>
        <p className="cp" style={{ marginTop: 8 }}>
          조달청이 공고에 붙여 공개한 <b>내역서</b>를 갈래별로 모았습니다.
          {meta ? <> 지금 <b>{num(meta.n)}개</b>.</> : null}{' '}
          <b>설계내역서</b>에는 발주처가 잡은 <b>설계 단가</b>가 들어 있어 설계변경 단가를 세울 때 견줄 수 있습니다.
        </p>
        <div className="cwarn" style={{ marginTop: 8 }}>
          <b>⬇ 바로 받기</b>가 붙은 것은 K-건설맵이 미리 받아 둔 파일입니다 —
          나라장터 로그인 없이 바로 열립니다. 붙어 있지 않은 것은 <b>나라장터 원문</b>으로 연결되고,
          공고가 내려가면 그 파일도 함께 사라집니다.
        </div>
      </div>

      <div className="card">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="파일명 · 공사명 · 발주기관 검색" style={{ marginBottom: 10 }} />
        <div className="chips">
          {kinds.map(([k, n]) => (
            <button key={k} className={'chip' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>
              {k}<em className="licn"> {num(n)}</em>
            </button>
          ))}
        </div>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className={'btn sm' + (here ? ' primary' : ' ghost')} onClick={() => setHere((v) => !v)}>
            ⬇ 바로 받을 수 있는 것만{nLocal ? ` (${num(nLocal)})` : ''}
          </button>
        </div>
        <div className="note" style={{ marginTop: 8 }}>
          {PRICED.includes(kind)
            ? '이 갈래에는 단가가 들어 있습니다. 받아 둔 파일 가운데 열어 본 것은 «단가 확인됨» · «열어 보니 단가 없음» 으로 적었습니다(표시가 없는 것은 아직 안 열어 봄).'
            : '이 갈래는 단가가 비어 있습니다 — 수량과 공종만 봅니다(낙찰자가 단가를 채우는 서식).'}
        </div>
      </div>

      <div className="sec-title">
        {kind} <span className="count">· {rows ? `${num(total)}개` : '불러오는 중…'}</span>
      </div>

      {!rows ? <Skeleton /> : total === 0 ? (
        <Empty icon="🔍">
          {here ? <>이 갈래에는 아직 받아 둔 파일이 없습니다.<br />토글을 끄면 나라장터 원문 링크로 볼 수 있습니다.</>
            : <>조건에 맞는 내역서가 없습니다.<br />검색어를 지우거나 다른 갈래를 눌러보세요.</>}
        </Empty>
      ) : (
        <>
          <div className="card">
            {view.map((r, i) => <내역서줄 r={r} key={i} />)}
          </div>

          <div className="pager">
            <button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>이전</button>
            <span>{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((v) => v + 1)}>다음</button>
          </div>

          <div className="card">
            <div className="btn-row">
              <button className="btn" onClick={copyList}>{copied ? '✓ 복사했습니다' : '📋 이 쪽 목록 복사'}</button>
            </div>
            <label className="licnone">
              <input type="checkbox" checked={ad} onChange={(e) => setAd(e.target.checked)} />
              <span>복사할 때 «K-건설맵 · k-conmap.com» 한 줄 넣기</span>
            </label>
          </div>
        </>
      )}

      <div className="card fwarn">
        <b>ℹ️ 출처</b>
        <div>
          모두 <b>발주기관이 나라장터 공고에 붙여 공개한 문서</b>이고, 줄마다 발주기관과 공고번호를 함께 적었습니다.
          단가는 <b>그 공고 시점의 값</b>이니, 지금 쓰실 때는{' '}
          <Link to="/change/unit" style={{ color: 'var(--accent)', fontWeight: 700 }}>2026년 품셈·시장단가</Link>로
          한 번 더 확인하시는 편이 안전합니다.
          발주기관에서 <b>내려 달라</b>고 <a href="/contact" style={{ color: 'var(--accent)', fontWeight: 700 }}>문의</a>로 알려 주시면 바로 지웁니다.
        </div>
      </div>
    </>
  )
}

/* ── /change — 허브 ─────────────────────────── */
export default function Change() {
  return (
    <>
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>설계변경</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          절차 · 단가 기준 · 물가변동 · 공기연장 · 서식까지 한자리에
        </div>
        <p className="cp" style={{ marginTop: 8 }}>
          설계변경은 «공사를 바꾸는 일»이 아니라 <b>계약을 바꾸는 일</b>입니다.
          순서를 놓치면 시공을 다 해 놓고도 정산이 막힙니다.
          여기에 절차와 단가 기준을 정리하고, <b>실제로 얼마가 되는지 계산기</b>를 붙였습니다.
        </p>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <Link className="btn primary" to="/change/calc">🧮 증감 계산기 열기</Link>
          <a className="btn ghost" href="#seosik">📄 서식 {FORMSETS.reduce((n, g) => n + g.slugs.filter((x) => FMIN[x]).length, 0)}가지</a>
        </div>
      </div>

      {/* 📆 기성 내역서 — 2026-10-16(G296). 계약 내역서 + 공종마다 % → 기성내역서 · 기성 원가계산서 · 부분기성 · 다음 회 이어 가기 */}
      <Link className="card fbook" to="/change/gisung">
        <span className="fic">📆</span>
        <div className="grow">
          <div className="t">기성 내역서 <em>· 공종마다 % 만 · 다음 회는 파일만 다시</em></div>
          <div className="d">
            계약 내역서를 넣고 공종마다 <b>누계 몇 %</b> 했는지 적으면 <b>기성내역서</b>(계약 · 전회 · 금회 · 누계 · 잔여) · <b>공사기성부분 원가계산서</b>(계약 식 그대로) ·
            <b>공사부분기성내역서</b> · 선금 공제 · 예정공정표 대비 공정률까지. 다음 회는 받은 파일만 다시 넣으면 전회가 이어집니다.
            <받은수 쪽="/change/gisung" 봄="/change/gisung" className="dlcount tlx-dl" />
          </div>
        </div>
        <span className="go">›</span>
      </Link>

      {/* 🧾 원 내역서로 설계변경 — 2026-10-05(G131). 원본 시트 그대로 + 변경 시트 한 벌 */}
      <Link className="card fbook" to="/change/won">
        <span className="fic">🧾</span>
        <div className="grow">
          <div className="t">원 내역서로 설계변경 <em>· 원본 그대로 + 변경 시트 한 벌</em></div>
          <div className="d">
            원 내역서(계약내역서)를 올리고 바뀐 <b>수량 · 사유 · 신규 비목</b>만 적으면, 원본 시트 뒤에 <b>변경내역서(2줄) · 변경 원가계산서(원 요율)</b> ·
            증감 · 물량 대비표 · 신규비목 단가산출서(× 낙찰률) · 단가 근거표 · 사유서 · 검산을 붙여 드립니다. 2회 · 3회 차수도.
            <받은수 쪽="/change/won" 봄="/change/won" className="dlcount tlx-dl" />
          </div>
        </div>
        <span className="go">›</span>
      </Link>

      {/* 🧰 설계변경 작업대 — 2026-09-30(G72). 2줄→1줄 · 당초/변경 짝짓기 · 대비표 · 차수별 · 검산 */}
      <Link className="card fbook" to="/change/work">
        <span className="fic">🧰</span>
        <div className="grow">
          <div className="t">설계변경 작업대 <em>· 2줄→1줄 · 짝짓기 · 대비표 · 검산</em></div>
          <div className="d">
            변경내역서(.xlsx · .xls)를 올리면 <b>1줄 내역서</b>로, 당초 · 변경 두 파일을 올리면 <b>품목을 짝지어 2줄 변경내역서</b>로.
            <b>공사비증감대비표 · 물량대비표 · 총괄표 · 차수별 대비표</b>와 <b>검산</b>까지 한 번에. 파일은 서버로 올라가지 않습니다.
            <받은수 쪽="/change/work" 봄="/change/work" className="dlcount tlx-dl" />
          </div>
        </div>
        <span className="go">›</span>
      </Link>

      {/* 🔁 2줄 자동변환 — 2026-09-15. 손으로 행을 나누던 일을 파일 단위로 끝냅니다. */}
      <Link className="card fbook" to="/change/twoline">
        <span className="fic">🔁</span>
        <div className="grow">
          <div className="t">설계변경 2줄 자동변환 <em>· 엑셀 · 브라우저에서만</em></div>
          <div className="d">
            공사 내역서 엑셀을 올리면 <b>당초 · 변경</b> 두 줄로 벌려 드립니다.
            <b>합계를 SUMIF 로 갈라</b> 당초 합계와 변경 합계를 따로 내고,
            <b>증감 줄</b>까지 넣을 수 있습니다. 파일은 서버로 올라가지 않습니다.
            <받은수 쪽="/change/twoline" 봄="/change/twoline" className="dlcount tlx-dl" />
          </div>
        </div>
        <span className="go">›</span>
      </Link>

      <MainBook />

      <Link className="card fbook" to="/change/naeyeok">
        <span className="fic">📑</span>
        <div className="grow">
          <div className="t">공사 내역서 모음 <em>· 2026년 · 조달청 공개</em></div>
          <div className="d">
            발주처가 공고에 붙인 <b>설계내역서·공내역서</b>를 갈래별로 모았습니다.
            설계내역서에는 <b>설계 단가</b>가 들어 있고, 미리 받아 둔 것은{' '}
            <b>나라장터 로그인 없이 바로</b> 받습니다.
            <받은수 쪽="/change/naeyeok" 봄="/change/naeyeok" className="dlcount tlx-dl" />
          </div>
        </div>
        <span className="go">→</span>
      </Link>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>무엇부터 보면 되나</div>
        {TOPICS.map((t) => (
          <Link className="row rowlink" to={`/change/${t.slug}`} key={t.slug}>
            <span className="fic">{t.icon}</span>
            <div className="grow">
              <div className="t">{t.title}{t.sub && <em> · {t.sub}</em>}</div>
              <div className="d">{t.short}</div>
            </div>
            <span className="go">→</span>
          </Link>
        ))}
      </div>

      <div id="seosik"><ChangeForms /></div>

      {/* 📤 이용자가 올린 설계변경 서식 (2026-09-06) */}
      <UserForms cat="설계변경" />

      <div className="card fwarn">
        <b>⚠️ 참고 자료입니다</b>
        <div>
          국가계약법 시행령 등 관계 법령을 바탕으로 정리했지만, 계약서의 특수조건과
          발주기관의 판단이 우선입니다. 금액이 큰 건은 전문가 검토를 받으세요.
        </div>
      </div>
    </>
  )
}

/* ── /change/{주제} ─────────────────────────── */
export function ChangeTopic() {
  const { slug } = useParams()
  const t = topicBySlug(slug)
  if (!t) {
    return (
      <Empty icon="🧭">
        «{slug}» 자료를 찾지 못했습니다.<br />
        <Link to="/change" style={{ color: 'var(--accent)', fontWeight: 700 }}>설계변경 목록 →</Link>
      </Empty>
    )
  }
  const others = TOPICS.filter((x) => x.slug !== t.slug).slice(0, 4)
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <ShareBtn />
      </div>
      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          <span style={{ marginRight: 6 }}>{t.icon}</span>{t.title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{t.sub}</div>
        <p className="cp" style={{ marginTop: 8 }}>{md(t.lead)}</p>
      </div>

      {t.secs.map((s, i) => (
        <div className="card" key={i}>
          <div className="sec-title" style={{ margin: '0 0 8px' }}>{s.h}</div>
          <Blocks blocks={s.blocks} />
        </div>
      ))}

      {/* 「서류 묶음」 주제에서는 이름만 늘어놓지 않고 그 자리에서 받게 합니다 */}
      {t.slug === 'docs' && <MainBook />}
      {t.slug === 'docs' && <ChangeForms />}

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>이어서 볼 것</div>
        {others.map((o) => (
          <Link className="row rowlink" to={`/change/${o.slug}`} key={o.slug}>
            <span className="fic">{o.icon}</span>
            <div className="grow"><div className="t">{o.title}</div></div>
            <span className="go">→</span>
          </Link>
        ))}
        <Link className="row rowlink" to="/change/calc">
          <span className="fic">🧮</span>
          <div className="grow"><div className="t">증감 계산기</div>
            <div className="d">내 공사에서 얼마가 되는지 계산합니다</div></div>
          <span className="go">→</span>
        </Link>
      </div>
    </>
  )
}

/* 계산(calcRow)은 lib/설계변경셈.js — 화면과 시험이 같이 씁니다(G328) */

const BLANK = { name: '', kind: 'inc', unit: '', q0: '', q1: '',
                upCtr: '', upEst: '', upNow: '', by: 'me' }
const KINDS = [['inc', '증가'], ['dec', '감소'], ['new', '신규비목']]

/* ── /change/calc — 증감 계산기 ────────────────── */
/* 🧮 G371 (2026-10-22) 소장님 「설계변경 잘 해줘.. 점검 철저히 해서… 편리하게」
   · 돈 칸은 치는 대로 쉼표(870,000,000) · 낙찰률을 바로 넣기(예정가격을 모를 때)
   · 제경비 · 부가세 «승율» 을 넣으면 총 증감(어림)과 변경 후 계약금액 · 86% 알림도 그 값으로
     (승율 = 총공사비 ÷ 직접공사비 − 1 — 원가계산서 두 숫자를 넣으면 셈)
   · 엑셀에서 줄을 복사해 붙여넣기(구분은 수량으로 저절로 · 증가 / 감소 / 신규) · 예시 채우기 · 값만 엑셀 받기
   숨은 누적: |설계변경|예시 · |설계변경|붙여넣기 · |설계변경|엑셀 · |설계변경|낙찰률바로 · |설계변경|승율 */
const 쉼 = (v) => { const d = String(v ?? '').replace(/[^0-9]/g, ''); return d ? Number(d).toLocaleString('ko-KR') : '' }
const 숫자만 = (v) => String(v ?? '').replace(/[^0-9]/g, '')
const 소수만 = (v) => { const s = String(v ?? '').replace(/[^0-9.]/g, ''); const i = s.indexOf('.'); return i < 0 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '') }
export const 계산예시 = {
  ctr: '870000000', est: '1000000000', 승율: '',
  rows: [
    { name: '가상 L형측구', kind: 'inc', unit: 'm', q0: '120', q1: '150', upCtr: '45000', upEst: '47500', upNow: '', by: 'me' },
    { name: '가상 보도블록 철거', kind: 'dec', unit: '㎡', q0: '80', q1: '60', upCtr: '23456', upEst: '', upNow: '', by: 'me' },
    { name: '가상 배수판', kind: 'new', unit: '㎡', q0: '', q1: '12.5', upCtr: '', upEst: '', upNow: '15000', by: 'me' },
  ],
}
export function ChangeCalc() {
  const [ctr, setCtr] = useState('')
  const [est, setEst] = useState('')
  const [바로, set바로] = useState(false)       // 🧮 G371 낙찰률을 바로 넣기
  const [율글, set율글] = useState('')          // 낙찰률 % (바로 넣을 때)
  const [승율, set승율] = useState('')          // 제경비 · 부가세 승율 %
  const [승셈, set승셈] = useState(null)        // {총, 직} 원가계산서 두 숫자로 승율 셈
  const [rows, setRows] = useState([{ ...BLANK }])
  const [ad, setAd] = useState(true)          // 홍보 문구 — 끌 수 있습니다
  const [copied, setCopied] = useState(false)
  const [붙임, set붙임] = useState(null)        // 붙여넣기 칸 글
  const [말, set말] = useState('')

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (v && Array.isArray(v.rows)) {
        setCtr(숫자만(v.ctr)); setEst(숫자만(v.est)); setRows(v.rows)
        if (v.바로) set바로(true)
        if (v.율글) set율글(v.율글)
        if (v.승율) set승율(v.승율)
      }
    } catch { /* 저장된 게 없거나 못 읽어도 그냥 빈 화면으로 시작합니다 */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ctr, est, rows, 바로, 율글, 승율 })) } catch { /* 무시 */ }
  }, [ctr, est, rows, 바로, 율글, 승율])

  const nn = (v) => Number(String(v ?? '').replace(/[^0-9.]/g, '')) || 0
  const rate = 바로 ? (nn(율글) > 0 && nn(율글) <= 100 ? nn(율글) / 100 : 0) : (nn(est) > 0 ? nn(ctr) / nn(est) : 0)
  const out = useMemo(() => rows.map((r) => calcRow(r, rate)), [rows, rate])
  const sum = out.reduce((a, b) => a + (b.amt || 0), 0)
  const hasOwner = out.some((x) => x.owner)
  const 승 = nn(승율) > 0 && nn(승율) < 300 ? nn(승율) / 100 : 0
  const 총증감 = 승 ? Math.floor(Math.round(Math.abs(sum) * (1 + 승) * 1e4) / 1e4) * Math.sign(sum) : sum   /* 원 미만 버림 · 1.4286 같은 소수 곱의 오차(…25.99999)를 먼저 바로잡음 */
  const 율표 = rate > 0 ? `${(rate * 100).toFixed(3)}%` : '—'

  const set = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const add = () => setRows([...rows, { ...BLANK }])
  const del = (i) => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : [{ ...BLANK }])
  const 빈화면 = rows.length === 1 && !rows[0].name && !rows[0].q1 && !ctr && !est && !율글
  const 예시 = () => { setCtr(계산예시.ctr); setEst(계산예시.est); set바로(false); set율글(''); set승율(''); setRows(계산예시.rows.map((r) => ({ ...r }))); set말('✍ 가상의 예시를 채웠습니다 — 숫자를 고쳐 보시거나 «처음부터» 를 누르세요'); 세기('|설계변경|예시') }
  const 처음부터 = () => { setCtr(''); setEst(''); set율글(''); set승율(''); setRows([{ ...BLANK }]); set말('') }
  const 붙여넣기 = () => {
    const { rows: 새, 뺀 } = 붙여읽기(붙임 || '')
    if (!새.length) { set말('읽은 줄이 없습니다 — 엑셀에서 «품명 · 단위 · 당초수량 · 변경수량 · 계약단가 · 예정가격단가 · 변경당시단가» 칸 차례로 복사해 붙여 주세요.'); return }
    const 빈줄 = rows.length === 1 && !rows[0].name && !rows[0].q1
    setRows([...(빈줄 ? [] : rows), ...새])
    const 셈 = (k) => 새.filter((r) => r.kind === k).length
    set말(`📋 ${새.length}줄을 넣었습니다 — 증가 ${셈('inc')} · 감소 ${셈('dec')} · 신규 ${셈('new')}${뺀.length ? ` · 증감이 없거나 수량이 없어 뺀 줄 ${뺀.length}(${뺀.slice(0, 3).join(', ')}${뺀.length > 3 ? ' …' : ''})` : ''}. 구분이 다르면 칩을 눌러 고치세요.`)
    set붙임(null); 세기('|설계변경|붙여넣기')
  }
  const 엑셀받기 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸 } = await import('../lib/값엑셀.js')
    const 이름 = (k) => (KINDS.find((x) => x[0] === k) || ['', ''])[1]
    const 줄 = rows.map((r, i) => { const o = out[i]; return [i + 1, 이름(r.kind) + (r.by === 'owner' ? '(발주기관 요구)' : ''), r.name, r.unit, r.kind === 'new' ? '' : nn(r.q0), nn(r.q1), o.qty, 수칸(o.unit), 수칸(o.amt), o.why] })
    줄.push(['', 굵은칸('조정 합계(직접공사비)'), '', '', '', '', '', '', 수칸(sum), ''])
    if (승) 줄.push(['', 굵은칸(`총 증감 어림(제경비 · 부가세 ${nn(승율)}%)`), '', '', '', '', '', '', 수칸(총증감), ''])
    if (nn(ctr) > 0) 줄.push(['', 굵은칸('변경 후 계약금액(어림)'), '', '', '', '', '', '', 수칸(nn(ctr) + 총증감), ''])
    값엑셀받기('설계변경_증감계산', [{ name: '증감 계산', head: ['No', '구분', '품명 · 규격', '단위', '당초 수량', '변경 수량', '증감 수량', '적용 단가', '조정액', '단가 근거(국가계약법 시행령 제65조)'], rows: 줄, widths: [5, 16, 26, 7, 10, 10, 10, 12, 14, 60] },
      { name: '조건', head: ['항목', '값'], rows: [['계약금액', 수칸(nn(ctr))], ['예정가격', 바로 ? '(낙찰률을 바로 넣음)' : 수칸(nn(est))], ['낙찰률', 율표], ['제경비 · 부가세 승율', 승 ? `${nn(승율)}%` : '(안 넣음 — 직접공사비만)']], widths: [24, 30] }],
    { 주소: '/change/calc', 글: '설계변경 증감 계산 — K-건설맵 계산기에서 셈한 값입니다(수식 없음). 다시 셀 때는 k-conmap.com/change/calc' })
    세기('|설계변경|엑셀')
  }

  const text = () => {
    const L = ['설계변경 계약금액 조정 계산',
      (바로 ? `계약금액 ${won(nn(ctr))} · 낙찰률 ${율표}(바로 넣음)` : `계약금액 ${won(nn(ctr))} · 예정가격 ${won(nn(est))} · 낙찰률 ${율표}`), '']
    rows.forEach((r, i) => {
      const o = out[i]
      if (!o.amt && !r.name) return
      L.push(`${r.name || '(이름 없음)'} [${KINDS.find((k) => k[0] === r.kind)[1]}]`
        + ` 수량 ${num(o.qty)}${r.unit || ''} × 단가 ${won(Math.round(o.unit))}`
        + ` = ${won(Math.round(o.amt))}`)
    })
    L.push('', `조정 합계 ${won(Math.round(sum))} (직접공사비 증감 — 간접노무비 · 보험료 등 승율비용 · 일반관리비 · 이윤은 산출내역서 율로 더하고 부가세 별도 · 국가계약법 시행령 제65조⑥)`)
    if (승) L.push(`총 증감 어림 ${won(총증감)} (제경비 · 부가세 승율 ${nn(승율)}%)`)
    if (ad) L.push('', 'K-건설맵 설계변경 계산기 · k-conmap.com')
    return L.join('\n')
  }
  const copy = () => {
    try { navigator.clipboard?.writeText(text()) } catch { /* 무시 */ }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  const 증액비 = nn(ctr) > 0 ? 총증감 / nn(ctr) : 0

  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <ShareBtn />
      </div>

      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800 }}>🧮 설계변경 증감 계산기</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          증가·감소·신규비목을 규정대로 나누어 계산합니다
        </div>
        <div className="btn-row chg-quick" style={{ marginTop: 10 }}>
          {빈화면
            ? <button type="button" className="btn ghost sm" onClick={예시}>✍ 예시 채우기</button>
            : <button type="button" className="btn ghost sm" onClick={처음부터}>🧹 처음부터</button>}
          <button type="button" className={'btn ghost sm' + (붙임 !== null ? ' on' : '')} onClick={() => set붙임(붙임 === null ? '' : null)}>📋 엑셀에서 붙여넣기</button>
          <button type="button" className="btn ghost sm" onClick={엑셀받기} disabled={!out.some((o) => o.amt)}>📗 값만 엑셀 받기</button>
        </div>
        {붙임 !== null && (
          <div className="chg-paste">
            <div className="note sm" style={{ margin: '6px 0' }}>
              엑셀에서 <b>품명 · 단위 · 당초수량 · 변경수량 · 계약단가 · 예정가격단가 · 변경당시단가 · 발주기관요구(O)</b> 칸을 이 차례로 골라 복사(Ctrl+C) 한 뒤 아래에 붙이세요.
              구분은 수량으로 저절로 나눕니다 — 당초 수량이 없으면 <b>신규</b> · 줄면 <b>감소</b> · 늘면 <b>증가</b>.
            </div>
            <textarea className="cin" rows={5} value={붙임} onChange={(e) => set붙임(e.target.value)} placeholder={'가상 L형측구\tm\t120\t150\t45,000\t47,500\n가상 배수판\t㎡\t\t12.5\t\t\t15,000'} aria-label="엑셀에서 복사한 줄" style={{ width: '100%', fontFamily: 'inherit' }} />
            <div className="btn-row" style={{ marginTop: 6 }}>
              <button type="button" className="btn primary sm" onClick={붙여넣기}>이 줄들 넣기</button>
              <button type="button" className="btn ghost sm" onClick={() => set붙임(null)}>그만두기</button>
            </div>
          </div>
        )}
        {말 && <div className="note sm" role="status" style={{ marginTop: 8 }}>{말}</div>}
        <div className="kv kv3" style={{ marginTop: 10 }}>
          <div><span>계약금액</span>
            <input className="cin" inputMode="numeric" value={쉼(ctr)} placeholder="예: 870,000,000" aria-label="계약금액"
              onChange={(e) => setCtr(숫자만(e.target.value))} /></div>
          {바로 ? (
            <div><span>낙찰률(%)</span>
              <input className="cin" inputMode="decimal" value={율글} placeholder="예: 87.745" aria-label="낙찰률"
                onChange={(e) => set율글(소수만(e.target.value).slice(0, 10))} /></div>
          ) : (
            <div><span>예정가격</span>
              <input className="cin" inputMode="numeric" value={쉼(est)} placeholder="예: 1,000,000,000" aria-label="예정가격"
                onChange={(e) => setEst(숫자만(e.target.value))} /></div>
          )}
          <div><span>낙찰률</span>
            <b className="hi">{율표}</b></div>
        </div>
        <div className="note sm" style={{ marginTop: 6 }}>
          낙찰률 = 계약금액 ÷ 예정가격. <b>신규비목</b>에만 곱합니다.{' '}
          <button type="button" className="lnk" onClick={() => { set바로(!바로); if (!바로) 세기('|설계변경|낙찰률바로') }}>
            {바로 ? '예정가격으로 셈하기' : '예정가격을 모르면 — 낙찰률을 바로 넣기'}
          </button>
        </div>
      </div>

      {rows.map((r, i) => {
        const o = out[i]
        return (
          <div className="card" key={i}>
            <div className="crow-top">
              <input className="cin grow" value={r.name} placeholder={`항목 ${i + 1} · 품명·규격`}
                onChange={(e) => set(i, 'name', e.target.value)} />
              <button className="btn ghost sm" onClick={() => del(i)}>×</button>
            </div>
            <div className="chips" style={{ marginTop: 8 }}>
              {KINDS.map(([k, label]) => (
                <button key={k} className={'chip' + (r.kind === k ? ' on' : '')}
                  onClick={() => set(i, 'kind', k)}>{label}</button>
              ))}
              <button className={'chip' + (r.by === 'owner' ? ' on' : '')}
                onClick={() => set(i, 'by', r.by === 'owner' ? 'me' : 'owner')}>
                발주기관 요구
              </button>
            </div>
            <div className="cgrid">
              <label><span>단위</span>
                <input className="cin" value={r.unit} onChange={(e) => set(i, 'unit', e.target.value)} /></label>
              {r.kind !== 'new' && (
                <label><span>당초 수량</span>
                  <input className="cin" inputMode="decimal" value={r.q0}
                    onChange={(e) => set(i, 'q0', 소수만(e.target.value))} /></label>
              )}
              <label><span>{r.kind === 'new' ? '수량' : '변경 수량'}</span>
                <input className="cin" inputMode="decimal" value={r.q1}
                  onChange={(e) => set(i, 'q1', 소수만(e.target.value))} /></label>
              {r.kind !== 'new' && (
                <label><span>계약단가</span>
                  <input className="cin" inputMode="numeric" value={쉼(r.upCtr)}
                    onChange={(e) => set(i, 'upCtr', 숫자만(e.target.value))} /></label>
              )}
              {r.kind === 'inc' && r.by !== 'owner' && (
                <label><span>예정가격단가</span>
                  <input className="cin" inputMode="numeric" value={쉼(r.upEst)}
                    onChange={(e) => set(i, 'upEst', 숫자만(e.target.value))} /></label>
              )}
              {(r.kind === 'new' || r.by === 'owner') && (
                <label><span>변경 당시 단가</span>
                  <input className="cin" inputMode="numeric" value={쉼(r.upNow)}
                    onChange={(e) => set(i, 'upNow', 숫자만(e.target.value))} /></label>
              )}
            </div>
            <div className={'cres' + (o.amt < 0 ? ' minus' : '')}>
              <div><span>적용 단가</span><b>{o.unit ? won(Math.round(o.unit)) : '—'}</b></div>
              <div><span>수량</span><b>{num(o.qty)}{r.unit}</b></div>
              <div><span>조정액</span><b className="big">{o.amt ? won(Math.round(o.amt)) : '—'}</b></div>
            </div>
            <div className="note sm" style={{ marginTop: 6 }}>{o.why}</div>
          </div>
        )
      })}

      <div className="btn-row" style={{ marginBottom: 10 }}>
        <button className="btn ghost" onClick={add}>+ 항목 추가</button>
      </div>

      <div className="card ctotal">
        <div><span>조정 합계</span><b>{won(Math.round(sum))}</b></div>
        <div className="chg-seung">
          <label><span>제경비 · 부가세 승율(%)</span>
            <input className="cin" inputMode="decimal" value={승율} placeholder="예: 42.86 (안 넣어도 됨)" aria-label="제경비 부가세 승율"
              onChange={(e) => set승율(소수만(e.target.value).slice(0, 7))} onBlur={() => { if (nn(승율) > 0) 세기('|설계변경|승율') }} /></label>
          <button type="button" className="lnk" onClick={() => set승셈(승셈 ? null : { 총: '', 직: '' })}>{승셈 ? '닫기' : '원가계산서 두 숫자로 셈하기'}</button>
          {승셈 && (
            <div className="chg-seung-calc">
              <label><span>총공사비(부가세 포함)</span><input className="cin" inputMode="numeric" value={쉼(승셈.총)} aria-label="총공사비" onChange={(e) => set승셈({ ...승셈, 총: 숫자만(e.target.value) })} /></label>
              <label><span>직접공사비(재료비 + 직접노무비 + 경비)</span><input className="cin" inputMode="numeric" value={쉼(승셈.직)} aria-label="직접공사비" onChange={(e) => set승셈({ ...승셈, 직: 숫자만(e.target.value) })} /></label>
              {nn(승셈.총) > nn(승셈.직) && nn(승셈.직) > 0 && (
                <button type="button" className="btn ghost sm" onClick={() => { set승율(((nn(승셈.총) / nn(승셈.직) - 1) * 100).toFixed(2)); set승셈(null) }}>
                  승율 {((nn(승셈.총) / nn(승셈.직) - 1) * 100).toFixed(2)}% 넣기
                </button>
              )}
            </div>
          )}
        </div>
        {승 > 0 && <div><span>총 증감 어림(제경비 · 부가세 포함)</span><b>{won(총증감)}</b></div>}
        {nn(ctr) > 0 && (
          <div><span>변경 후 계약금액(어림)</span><b>{won(Math.round(nn(ctr) + 총증감))}</b></div>
        )}
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={copy}>
            {copied ? '✓ 복사했습니다' : '📋 계산 결과 복사'}
          </button>
          <label className="adtoggle">
            <input type="checkbox" checked={ad} onChange={(e) => setAd(e.target.checked)} />
            <span>복사할 때 K-건설맵 표시 넣기</span>
          </label>
        </div>
      </div>

      <div className="note sm" style={{ margin: '-4px 4px 12px', lineHeight: 1.7 }}>
        조정 합계는 <b>직접공사비(재료비 · 노무비 · 경비) 증감</b>입니다. 실제 계약금액 조정은 여기에
        간접노무비 · 산재 · 고용보험료 같은 <b>승율비용과 일반관리비 · 이윤을 산출내역서의 율로</b> 더하고(국가계약법 시행령 제65조⑥)
        부가가치세를 붙입니다 — {승 > 0 ? <>위 «총 증감» 은 넣으신 승율 {nn(승율)}% 를 한 번에 곱한 <b>어림</b>입니다(비목마다 율이 달라 실제와 조금 다를 수 있음).</> : <>위 «변경 후 계약금액» 은 직접공사비만 더한 어림입니다 — 원가계산서의 승율을 넣으면 제경비 · 부가세까지 더해 봅니다.</>} 단가 · 조정액은 원 미만 버림입니다.
      </div>

      {/* ⚖ G371 (2026-10-22) 낙찰률 86% 미만 공사의 증액 — 국가 제65조② · 지방 제74조③ (원문 확인 · 시행 2026.6.3)
         주제 «계약금액 조정 단가 기준» 에만 있던 알림을 계산기에도 — 승율을 넣으면 총 증감으로, 아니면 직접공사비만으로 % */}
      {rate > 0 && rate < 0.86 && sum > 0 && nn(ctr) > 0 && (
        <div className="card fwarn" data-k="86">
          <b>⚠️ 낙찰률 {(rate * 100).toFixed(3)}% — 예정가격의 86% 미만으로 낙찰된 공사의 증액입니다</b>
          <div>
            증액 조정금액(2차부터는 앞선 감액 · 증액을 모두 합친 금액)이 <b>당초 계약금액의 10% 이상</b>이면
            심의를 거쳐 <b>승인</b>을 받아야 합니다 — 국가 공사는 소속 중앙관서의 장(국가계약법 시행령 제65조②),
            지방 공사는 지방자치단체의 장(지방계약법 시행령 제74조③). 승인에 시간이 걸리니 미리 알려 두세요.
            지금 {승 > 0 ? <b>총 증감 어림(승율 {nn(승율)}%)이 당초 계약금액의 {(증액비 * 100).toFixed(2)}%</b> : <><b>직접공사비 증액만 당초 계약금액의 {(sum / nn(ctr) * 100).toFixed(2)}%</b>입니다 — 제경비 · 부가세를 더하면 더 커집니다</>}{승 > 0 ? (증액비 >= 0.1 ? ' — 10% 이상입니다.' : ' — 아직 10% 아래입니다(앞선 차수 증감도 합쳐 보세요).') : '.'}
          </div>
        </div>
      )}

      {hasOwner && (
        <div className="card fwarn">
          <b>⚠️ 「발주기관 요구」로 표시한 항목이 있습니다</b>
          <div>
            정부(발주기관)가 설계변경을 요구한 경우 — 계약상대자에게 책임이 없는 사유로 바뀐 경우도 포함합니다(제65조③ 3호).
            이 경우 단가는 <b>협의로 정하는 것이 원칙</b>입니다. 여기 숫자는 협의가 안 될 때의
            기준(설계변경 당시 단가와 낙찰률 적용 단가의 중간)으로 계산한 값이라,
            협의 결과에 따라 달라집니다. 협의단가 산정서를 함께 내세요.
          </div>
        </div>
      )}

      <div className="card fwarn">
        <b>⚠️ 참고용 계산입니다</b>
        <div>
          국가계약법 시행령 제65조의 단가 기준으로 계산했습니다. 계약서의 특수조건,
          지방계약·민간공사 여부, 발주기관 판단에 따라 달라질 수 있습니다.
          금액이 큰 건은 전문가 검토를 받으세요.
        </div>
      </div>
    </>
  )
}
