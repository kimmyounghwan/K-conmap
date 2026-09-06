import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/change.json'
// forms.json(217KB)이 아니라 formsgen.py 가 구운 «작은 목록»(6KB)을 씁니다.
import FMIN from '../data/forms-min.json'
import { ShareBtn } from './CorpPage.jsx'
import { Empty, Skeleton } from '../components.jsx'
import { won, num } from '../lib/fmt.js'
import UserForms from '../UserForms.jsx'
import { getNaeyeok, getNaeyeokAll, naeyeokRows } from '../lib/data.js'

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
          <table className="ctab">
            <thead><tr>{b.cols.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
            <tbody>
              {b.rows.map((r, j) => (
                <tr key={j}>{r.map((c, k) => <td key={k}>{md(c)}</td>)}</tr>
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
           download={`${BOOK.title}.xlsx`}>⬇ 엑셀 내려받기 (시트 11장)</a>
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
          {FORMSETS.reduce((n, g) => n + g.slugs.length, 0)}가지 · 엑셀 · 무료
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
                  {!compact && <div className="d">{short}</div>}
                </div>
                <a className="fdl" href={`/forms/${slug}.xlsx`}
                   download={`${title}_양식.xlsx`}>⬇ 엑셀</a>
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
        <Link className="btn ghost sm" to="/change">← 설계변경</Link>
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
              </div>
              <a className="fdl" href={`/forms/${slug}.xlsx`} download={`${title}_양식.xlsx`}>⬇ 엑셀</a>
            </div>
          )
        })}
        <div style={{ marginTop: 10 }}>
          <Link className="btn ghost sm" to="/forms">건설 서식 105가지 전부 보기 →</Link>
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
  const [q, setQ] = useState('')
  const [here, setHere] = useState(false)      // 바로 받을 수 있는 것만
  const [page, setPage] = useState(1)
  const [ad, setAd] = useState(() => {
    try { return localStorage.getItem(ADKEY) !== '0' } catch { return true }
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => { getNaeyeok().then(setPriced).catch(() => setPriced(false)) }, [])
  useEffect(() => { try { localStorage.setItem(ADKEY, ad ? '1' : '0') } catch { /* 사생활 모드 */ } }, [ad])
  useEffect(() => { setPage(1) }, [kind, q, here])
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
        <Link className="btn ghost sm" to="/change">← 설계변경</Link>
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
            ? '이 갈래에는 단가가 들어 있습니다. 받아 둔 파일은 실제로 열어 «단가 열에 숫자가 있는지» 확인했습니다.'
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
            {view.map((r, i) => (
              <div className="frow nyrow" key={i}>
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
                </div>
              </div>
            ))}
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
          발주기관에서 <b>내려 달라</b>고 알려 주시면 바로 지웁니다(착공현장 탭 「구인·구직 글」의 문의 창구).
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
          <a className="btn ghost" href="#seosik">📄 서식 19가지</a>
        </div>
      </div>

      <MainBook />

      <Link className="card fbook" to="/change/naeyeok">
        <span className="fic">📑</span>
        <div className="grow">
          <div className="t">공사 내역서 모음 <em>· 2026년 · 조달청 공개</em></div>
          <div className="d">
            발주처가 공고에 붙인 <b>설계내역서·공내역서</b>를 갈래별로 모았습니다.
            설계내역서에는 <b>설계 단가</b>가 들어 있고, 미리 받아 둔 것은
            <b>나라장터 로그인 없이 바로</b> 받습니다.
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
        <Link className="btn ghost sm" to="/change">← 설계변경</Link>
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

/* ── 계산 — 화면과 검사가 같이 쓰는 «한 벌» ──────
   ⚠️ 규정을 코드로 옮긴 자리입니다. 바꾸려면 근거부터 다시 확인할 것.
      증가 물량 = 계약단가(계약단가 > 예정가격단가면 예정가격단가)
      신규 비목 = 설계변경 당시 단가 × 낙찰률
      발주기관 요구 = 협의, 불성립 시 두 값의 중간 */
export function calcRow(r, rate) {
  const n = (v) => Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0
  const q0 = n(r.q0), q1 = n(r.q1)
  const uc = n(r.upCtr), ue = n(r.upEst), un = n(r.upNow)
  const owner = r.by === 'owner'
  const mid = un * (1 + rate) / 2
  if (r.kind === 'dec') {
    const q = q1 - q0
    return { qty: q, unit: uc, amt: q * uc, why: '감소분은 계약단가로 감액합니다.' }
  }
  if (r.kind === 'inc') {
    const q = q1 - q0
    if (owner) return { qty: q, unit: mid, amt: q * mid, owner: true,
      why: '발주기관이 요구한 증가분 → 협의 대상입니다. 협의가 안 될 때의 기준(설계변경 당시 단가와 낙찰률 적용 단가의 중간)으로 계산했습니다.' }
    const useEst = ue > 0 && uc > ue
    const u = useEst ? ue : uc
    return { qty: q, unit: u, amt: q * u,
      why: useEst ? '계약단가가 예정가격단가보다 높아 예정가격단가를 적용했습니다.'
                  : '증가분은 계약단가를 적용합니다. (낙찰률을 곱하지 않습니다)' }
  }
  const q = q1
  if (owner) return { qty: q, unit: mid, amt: q * mid, owner: true,
    why: '발주기관이 요구한 신규비목 → 협의 대상입니다. 협의 불성립 기준(중간값)으로 계산했습니다.' }
  const u = un * rate
  return { qty: q, unit: u, amt: q * u,
    why: '신규비목은 «설계변경 당시 단가 × 낙찰률»입니다.' }
}

const BLANK = { name: '', kind: 'inc', unit: '', q0: '', q1: '',
                upCtr: '', upEst: '', upNow: '', by: 'me' }
const KINDS = [['inc', '증가'], ['dec', '감소'], ['new', '신규비목']]

/* ── /change/calc — 증감 계산기 ────────────────── */
export function ChangeCalc() {
  const [ctr, setCtr] = useState('')
  const [est, setEst] = useState('')
  const [rows, setRows] = useState([{ ...BLANK }])
  const [ad, setAd] = useState(true)          // 홍보 문구 — 끌 수 있습니다
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (v && Array.isArray(v.rows)) { setCtr(v.ctr || ''); setEst(v.est || ''); setRows(v.rows) }
    } catch { /* 저장된 게 없거나 못 읽어도 그냥 빈 화면으로 시작합니다 */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ctr, est, rows })) } catch { /* 무시 */ }
  }, [ctr, est, rows])

  const nn = (v) => Number(String(v ?? '').replace(/[^0-9.]/g, '')) || 0
  const rate = nn(est) > 0 ? nn(ctr) / nn(est) : 0
  const out = useMemo(() => rows.map((r) => calcRow(r, rate)), [rows, rate])
  const sum = out.reduce((a, b) => a + (b.amt || 0), 0)
  const hasOwner = out.some((x) => x.owner)

  const set = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const add = () => setRows([...rows, { ...BLANK }])
  const del = (i) => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : [{ ...BLANK }])

  const text = () => {
    const L = ['설계변경 계약금액 조정 계산',
      `계약금액 ${won(nn(ctr))} · 예정가격 ${won(nn(est))} · 낙찰률 ${(rate * 100).toFixed(3)}%`, '']
    rows.forEach((r, i) => {
      const o = out[i]
      if (!o.amt && !r.name) return
      L.push(`${r.name || '(이름 없음)'} [${KINDS.find((k) => k[0] === r.kind)[1]}]`
        + ` 수량 ${num(o.qty)}${r.unit || ''} × 단가 ${won(Math.round(o.unit))}`
        + ` = ${won(Math.round(o.amt))}`)
    })
    L.push('', `조정 합계 ${won(Math.round(sum))}`)
    if (ad) L.push('', 'K-건설맵 설계변경 계산기 · k-conmap.com')
    return L.join('\n')
  }
  const copy = () => {
    try { navigator.clipboard?.writeText(text()) } catch { /* 무시 */ }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <Link className="btn ghost sm" to="/change">← 설계변경</Link>
        <ShareBtn />
      </div>

      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800 }}>🧮 설계변경 증감 계산기</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          증가·감소·신규비목을 규정대로 나누어 계산합니다
        </div>
        <div className="kv" style={{ marginTop: 10 }}>
          <div><span>계약금액</span>
            <input className="cin" inputMode="numeric" value={ctr} placeholder="예: 870000000"
              onChange={(e) => setCtr(e.target.value)} /></div>
          <div><span>예정가격</span>
            <input className="cin" inputMode="numeric" value={est} placeholder="예: 1000000000"
              onChange={(e) => setEst(e.target.value)} /></div>
          <div><span>낙찰률</span>
            <b className="hi">{rate > 0 ? `${(rate * 100).toFixed(3)}%` : '—'}</b></div>
        </div>
        <div className="note sm" style={{ marginTop: 6 }}>
          낙찰률 = 계약금액 ÷ 예정가격. <b>신규비목</b>에만 곱합니다.
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
                    onChange={(e) => set(i, 'q0', e.target.value)} /></label>
              )}
              <label><span>{r.kind === 'new' ? '수량' : '변경 수량'}</span>
                <input className="cin" inputMode="decimal" value={r.q1}
                  onChange={(e) => set(i, 'q1', e.target.value)} /></label>
              {r.kind !== 'new' && (
                <label><span>계약단가</span>
                  <input className="cin" inputMode="numeric" value={r.upCtr}
                    onChange={(e) => set(i, 'upCtr', e.target.value)} /></label>
              )}
              {r.kind === 'inc' && r.by !== 'owner' && (
                <label><span>예정가격단가</span>
                  <input className="cin" inputMode="numeric" value={r.upEst}
                    onChange={(e) => set(i, 'upEst', e.target.value)} /></label>
              )}
              {(r.kind === 'new' || r.by === 'owner') && (
                <label><span>변경 당시 단가</span>
                  <input className="cin" inputMode="numeric" value={r.upNow}
                    onChange={(e) => set(i, 'upNow', e.target.value)} /></label>
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
        {nn(ctr) > 0 && (
          <div><span>변경 후 계약금액(예상)</span><b>{won(Math.round(nn(ctr) + sum))}</b></div>
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

      {hasOwner && (
        <div className="card fwarn">
          <b>⚠️ 「발주기관 요구」로 표시한 항목이 있습니다</b>
          <div>
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
