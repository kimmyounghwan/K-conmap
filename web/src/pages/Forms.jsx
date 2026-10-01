import { lazy, Suspense, useMemo, useState } from 'react'

import { askAfter } from '../AskComment'
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/forms.json'
/* ⬇ 2026-10-01 (G96) 서식마다 «받은 횟수» — 애널리틱스 시작값(9/15~) + 사이트가 센 것 (lib/받은수.jsx) */
import { 받은수 } from '../lib/받은수.jsx'
import ORIG_DATA from '../data/forms_orig.json'
import TAB from '../data/forms_tab.json'
import { ShareBtn } from './CorpPage.jsx'
import UserForms from '../UserForms.jsx'
import { Empty } from '../components.jsx'

/* ⚠️ 2026-09-29 위험성평가 서식(wih-*) — 미리보기는 서식과 같은 칸의 예문 종이 · 인쇄는 빈 서식 (tools/위험성미리.jsx, 늦게 불러옴) */
const 위험성미리 = lazy(() => import('../tools/위험성미리.jsx'))

/** 🧰 2026-09-29 «사이트에서 바로 쓰기» — forms.json / forms_orig.json 의 prog {to, t, d} (prerender.py 도 같은 칸을 굽습니다)
 *  소장님: 「좀 이상해 봐줘 … 되도록 사이트내에서 사용 할 수 있는 프로그램으로 만들어 줘」 */
function 프로그램카드({ p }) {
  if (!p || !p.to) return null
  return (
    <Link className="card fprog" to={p.to}>
      <div className="k">🧰 사이트에서 바로 쓰기</div>
      <div className="t">{p.t}</div>
      {p.d ? <div className="d">{p.d}</div> : null}
      <span className="go">열기 →</span>
    </Link>
  )
}

/**
 * /forms · /forms/{slug} — 「건설 서식」 (2026-09-05)
 *
 * 소장님: 「따로 탭을 만들어서 건설관련 서식을 제공할 수 있게. 서식마다 K-건설맵 로고가
 *         들어가고, 클릭하면 되게」
 *
 * 왜 만드나
 *   ① 현장에서 실제로 매일 찾는 것입니다. 「착공계 양식」·「기성 청구서 양식」은
 *      네이버·구글에서 꾸준히 검색되는 말입니다.
 *   ② 우리 자료(개찰·공고)와 달리 **변하지 않습니다.** 한 번 구워 두면 계속 일합니다.
 *   ③ 전송량이 거의 0 입니다 — 엑셀은 정적 파일이고, 화면은 이 파일 하나에서 그립니다.
 *
 * ⚠️ 서식의 «내용»은 src/data/forms.json 한 곳에만 있습니다.
 *    화면(여기)·엑셀(formsgen.py)·미리굽기(prerender.py)가 모두 그 파일을 읽습니다.
 *
 * ⚠️ 법적으로 조심한 것
 *    - 기관이 정한 서식이 있으면 그것을 쓰라고 **모든 장에 적습니다**.
 *    - 공정위·국토부 고시 표준계약서(하도급·건설기계임대차)는 **베끼지 않습니다.**
 *      길고, 조문을 잘못 옮기면 그대로 사고가 납니다. 원문 링크로 안내하는 편이 맞습니다.
 */

const FORMS = DATA.forms || []

/* 📂 2026-09-24 — 「현장 실무 서식」(원본 틀 그대로)
 * 소장님: 「건설 서식을 건설맵 사이트에 올려 줘. 각각 페이지 만들어서… 모두 엑셀로」
 *        「클로드 맘대로 서식 틀 수정하지 말고, 현재 서식틀을 유지」 · 「서식별로 분류를 잘해줘」
 *        「검색으로 찾을 수 있게」 · 「각각의 페이지가 있어서 검색에 용이하도록」
 * ■ 받은 서식(한글·엑셀·PPT·PDF 46개)을 «틀 그대로» 엑셀로 옮긴 것입니다. 우리가 만든 일반 양식(forms.json)과 섞지 않습니다.
 * ■ 내용은 src/data/forms_orig.json 한 곳에만 (파일은 public/forms/orig/{slug}.xlsx · 미리보기 {slug}-1.webp)
 * ■ 주소는 모두 /forms/o-… — 일반 양식 주소와 겹치지 않습니다. prerender·sitemap 도 같은 목록을 씁니다.
 * ■ K-건설맵 표시는 엑셀 «인쇄 머리글» 에 있습니다 — 보이지만 칸 복사에는 안 따라가고, 페이지 설정에서 지울 수 있습니다. */
const ORIG = ORIG_DATA.forms || []
const OGROUPS = ORIG_DATA.groups || []
export const origBySlug = (slug) => ORIG.find((f) => f.slug === slug) || null

/* 검색 — 띄어쓰기·대소문자 무시, 제목·설명·다른 이름·갈래에서 */
const 접기 = (t) => String(t || '').replace(/\s+/g, '').toLowerCase()
function 맞나(f, q) {
  const k = 접기([f.title, f.sub, f.short, f.group, ...(f.also || [])].join('|'))
  return 접기(q).split(/[,·]/).filter(Boolean).every((w) => k.includes(w))
}
/* 갈래는 «단계»가 아니라 «현장 조직» 기준입니다 — 공무/공사/안전/품질이 실제로
   현장이 나뉘는 방식이고, 서류를 찾는 사람도 그렇게 찾습니다. */
const GROUPS = ['일반', '계약·공사', '계약·임대구매', '계약·노무기타',
  '공무', '공사', '안전', '품질', '환경', '노무·장비']

/* 서식 «놓치기 쉬운 것» 의 **굵게** 를 진짜 굵은 글씨로 (2026-09-26)
 * forms.json 143줄이 ** 를 쓰는데 화면에 별표가 그대로 나오고 있었습니다. */
function 굵게(s) {
  return String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
}

export function bySlug(slug) {
  return FORMS.find((f) => f.slug === slug) || null
}

/* 미리보기 — 엑셀과 «같은 blocks» 를 그립니다. 두 벌로 적지 않기 위해서입니다. */
function Preview({ sheet }) {
  return (
    <div className="fpaper">
      {/* 엑셀의 «1행» 과 같은 줄입니다. 파일과 화면이 달라 보이면 안 됩니다.
          그림이 아니라 글자로 넣습니다 — 엑셀에서 그림은 행을 지워도 남습니다. */}
      <div className="fmark">
        <b>K-건설맵 | k-conmap.com</b>
        <span>← 이 1행을 지우고 쓰셔도 됩니다</span>
      </div>
      <h3>{sheet.heading}</h3>
      {sheet.blocks.map((b, i) => {
        if (b.t === 'kv') {
          return (
            <table className="fkv" key={i}>
              <tbody>
                {b.rows.map(([label], j) => (
                  <tr key={j}><th>{label}</th><td /></tr>
                ))}
              </tbody>
            </table>
          )
        }
        if (b.t === 'text') return <p className="ftext" key={i}>{b.text}</p>
        if (b.t === 'table') {
          return (
            <table className="fgrid" key={i}>
              <thead><tr>{b.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {/* 항목이 미리 적힌 표(검측 체크리스트)면 그 줄을, 아니면 빈 줄을 */}
                {(b.rows && b.rows.length
                  ? b.rows.slice(0, 4).map((r, j) => (
                    <tr key={j}>{b.cols.map((c, k) => <td key={c}>{r[k] || ''}</td>)}</tr>
                  ))
                  : Array.from({ length: Math.min(b.n, 4) }).map((_, j) => (
                    <tr key={j}>{b.cols.map((c) => <td key={c} />)}</tr>
                  )))}
              </tbody>
            </table>
          )
        }
        if (b.t === 'cl') {
          return (
            <div key={i}>
              {b.items.map(([head, body], j) => (
                <div className="fcl" key={j}>
                  <b>{head}</b>{body && <p>{body}</p>}
                </div>
              ))}
            </div>
          )
        }
        if (b.t === 'sign') {
          return (
            <div className="fsign" key={i}>
              <div className="fdate">년        월        일</div>
              {b.who.map((w) => (
                <div key={w}><b>{w}</b><span>(서명 또는 인)</span></div>
              ))}
              {b.note && <div className="fnote">{b.note}</div>}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

/* ── /forms — 서식 목록 ─────────────────────────── */
function OrigRow({ f }) {
  return (
    <Link className="row rowlink" to={`/forms/${f.slug}`}>
      <span className="fic">{f.icon}</span>
      <div className="grow">
        <div className="t">{f.title} <em className="obadge">원본 틀</em></div>
        <div className="d">{f.short} <받은수 파일={[f.file]} /></div>
      </div>
      <span className="go">→</span>
    </Link>
  )
}

/* 📄🧰 2026-09-29 — 소장님: 「적산란 처럼 서식란도 수정해 줘. 전체적으로...」 (앞서 고르신 것: «A로 C로 같이 하자»)
   ■ A — 공사 차례별 한 벌: «지금 무엇을 하십니까?» 아홉 칸(계약 → 착공 → 계획서 → 공사 중 → 검측·품질 → 안전·환경 → 노무·장비 → 기성·변경 → 준공).
     칸마다 «사이트에서 바로» 프로그램을 먼저, 그다음 서식(엑셀)을 놓습니다.
   ■ C — 서류 꾸러미: 착공 · 하도급 · 기성 · 설계변경 · 준공 때 한 번에 내는 서류를 차례대로.
   ■ 짜임(어느 서식이 어느 칸에)은 src/data/forms_tab.json 한 곳 — prerender.py forms_index 도 같은 파일을 읽습니다.
     ⚠️ 서식을 더하면 forms_tab.json stages 의 slugs 에도 넣으십시오(tools/forms2 · 191가지가 빠짐없이 한 번씩 들어갔는지 검사).
   ■ 긴 설명(갈래별 전부 · 계약서 주의)은 적산 탭처럼 접어 둡니다. 찾기 칸은 맨 위 그대로. */
const BY = new Map([...FORMS, ...ORIG].map((f) => [f.slug, f]))
const ORIGSET = new Set(ORIG.map((f) => f.slug))
const STAGES0 = TAB.stages || []
const 놓인 = new Set(STAGES0.flatMap((s) => s.slugs))
const 남은 = [...ORIG, ...FORMS].filter((f) => !놓인.has(f.slug))   /* 짜임에 아직 안 넣은 서식 — «그 밖의 서식» 칸으로(prerender 도 같게) */
const STAGES = 남은.length
  ? [...STAGES0, { k: 'etc', n: '', ic: '📁', h: '그 밖의 서식', 짧게: '', 언제: '', progs: [], slugs: 남은.map((f) => f.slug) }]
  : STAGES0
const PACKS = TAB.packs || []
/** 이 서식의 파일들 — 원본 틀은 /forms/orig/…xlsx 하나, 일반 양식은 엑셀 + 인쇄용 PDF */
const 서식파일 = (f) => (ORIGSET.has(f.slug) ? [f.file] : [`/forms/${f.slug}.xlsx`, f.pdf])
const 새로 = [...FORMS, ...ORIG].filter((f) => f.gen === 'forms2' || f.re).length

function 서식칸({ f }) {
  const 예시 = f.gen === 'forms2' || f.re
  return (
    <Link className="tlx-card fm-card" to={`/forms/${f.slug}`}>
      <span className="tlx-ic">{f.icon}</span>
      <span className="tlx-body">
        <span className="tlx-t">{f.title}
          {f.prog && <em className="tlx-new fm-pg">🧰 바로 쓰기</em>}
          {예시 ? <em className="tlx-new fm-ex">✍ 작성 예시</em> : ORIGSET.has(f.slug) ? <em className="tlx-new fm-orig">원본 틀</em> : null}
        </span>
        <span className="tlx-d">{f.short}</span>
        <받은수 파일={서식파일(f)} className="dlcount tlx-dl" />
      </span>
    </Link>
  )
}

function 프로그램칸({ p }) {
  return (
    <Link className="tlx-card fm-prog" to={p.to}>
      <span className="tlx-ic">{p.ic}</span>
      <span className="tlx-body">
        <span className="fm-prog-k">🧰 사이트에서 바로</span>
        <span className="tlx-t">{p.t}</span>
        <span className="tlx-d">{p.d}</span>
      </span>
    </Link>
  )
}

function 꾸러미({ p }) {
  return (
    <div className="fm-pack" id={'fp-' + p.k}>
      <h3>{p.ic} {p.h}</h3>
      <div className="d">{p.d}</div>
      <ol className="fm-plist">
        {p.items.map((it, i) => {
          const f = it.s ? BY.get(it.s) : null
          return (
            <li key={i}>
              {f ? <Link to={`/forms/${f.slug}`}>{f.title}</Link> : <span className="fm-out">{it.t}</span>}
              {it.d && <span className="n"> — {it.d}</span>}
            </li>
          )
        })}
      </ol>
      {p.prog && <Link className="go" to={p.prog.to}>{p.prog.ic} {p.prog.t} ›</Link>}
    </div>
  )
}

export default function Forms() {
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const m = new Map()
    for (const g of GROUPS) m.set(g, [])
    for (const f of FORMS) {
      if (!m.has(f.group)) m.set(f.group, [])
      m.get(f.group).push(f)
    }
    return [...m.entries()].filter(([, v]) => v.length)
  }, [])
  const ogroups = useMemo(() => OGROUPS.map((g) => [g, ORIG.filter((f) => f.group === g)]).filter(([, v]) => v.length), [])
  const 찾음 = useMemo(() => {
    if (!q.trim()) return null
    return { o: ORIG.filter((f) => 맞나(f, q)), n: FORMS.filter((f) => 맞나(f, q)) }
  }, [q])

  return (
    <>
      <div className="card lead-card" style={{ marginTop: 14 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>📄 건설 서식 — 공사가 어디쯤인지 고르시면 낼 서류가 나옵니다</h1>
        <p className="why2" style={{ marginBottom: 0 }}>
          서식 <b>{FORMS.length + ORIG.length}가지</b>, 모두 엑셀 · <b>무료</b> · 회원가입 없음.{' '}
          {새로}가지는 현장에서 쓰던 틀(칸·차례·결재란)을 그대로 두고 <b>수식과 작성 예시</b>를 넣어 새로 만들었습니다.{' '}
          <b>사이트에서 바로 쓰는 프로그램</b>이 있는 일은 그것부터 보여 드립니다.
        </p>
        {/* 🔎 서식이 많아져서 — 이름·다른 이름·설명으로 찾습니다 (띄어쓰기 무시) */}
        <div className="searchwrap" style={{ marginTop: 10 }}>
          <span className="ico">🔎</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="서식 찾기 — 예: 착공계, 점검표, 시공계획서"
            aria-label="서식 찾기" />
          {q && <button className="x" onClick={() => setQ('')} aria-label="지우기">×</button>}
        </div>
      </div>

      {찾음 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>
            «{q.trim()}» 찾은 서식 {찾음.o.length + 찾음.n.length}가지
          </div>
          <div className="tlx-grid fm-grid">
            {[...찾음.o, ...찾음.n].map((f) => <서식칸 f={f} key={f.slug} />)}
          </div>
          {찾음.o.length + 찾음.n.length === 0 && (
            <div className="note sm">찾는 서식이 없습니다. 다른 말로 찾아 보시거나, 아래에서 공사 차례로 골라 주세요.</div>
          )}
        </div>
      )}

      <div className="card ny-pick">
        <div className="sec-title" style={{ marginTop: 0 }}>지금 무엇을 하십니까?</div>
        <div className="ny-pick-row">
          {STAGES.map((s) => (
            <a className="ny-pick-b" href={'#fm-' + s.k} key={s.k}>
              <span className="ny-pick-t"><span className="ny-n">{s.n}</span> {s.ic} {s.h}</span>
              <span className="ny-pick-d">{s.짧게 ? s.짧게 + ' · ' : ''}{s.slugs.length}가지</span>
            </a>
          ))}
        </div>
        <div className="sec-title fm-pick2">📦 한 번에 내는 서류 — 꾸러미</div>
        <div className="ny-pick-row fm-packrow">
          {PACKS.map((p) => (
            <a className="ny-pick-b" href={'#fp-' + p.k} key={p.k}>
              <span className="ny-pick-t">{p.ic} {p.h}</span>
              <span className="ny-pick-d">서류 {p.items.length}가지 차례대로</span>
            </a>
          ))}
        </div>
      </div>

      {STAGES.map((s) => (
        <div className="card ny-sit" id={'fm-' + s.k} key={s.k}>
          <div className="ny-sit-h"><span className="ny-n">{s.n}</span> {s.ic} {s.h}</div>
          <div className="ny-sit-w">{s.언제}</div>
          {s.progs.length > 0 && (
            <div className="tlx-grid">
              {s.progs.map((p) => <프로그램칸 p={p} key={p.to} />)}
            </div>
          )}
          <div className="fm-sub">서식 {s.slugs.length}가지 — 엑셀</div>
          <div className="tlx-grid fm-grid">
            {s.slugs.map((k) => BY.get(k)).filter(Boolean).map((f) => <서식칸 f={f} key={f.slug} />)}
          </div>
        </div>
      ))}

      <div className="card" id="fm-packs">
        <div className="sec-title" style={{ marginTop: 0 }}>📦 서류 꾸러미 — 이때 이것들을 한 번에</div>
        <p className="muted" style={{ marginTop: 0 }}>
          흔히 함께 내는 차례입니다. <b>발주기관 · 계약 특수조건이 정한 목록이 우선</b>이니, 받은 목록과 한 번 맞춰 보십시오.
        </p>
        <div className="fm-packs">
          {PACKS.map((p) => <꾸러미 p={p} key={p.k} />)}
        </div>
      </div>

      <div className="card">
        <div className="sec-title" style={{ marginTop: 0 }}>서식은 어떻게 만들었나</div>
        <ul className="flist" style={{ marginBottom: 0 }}>
          <li><b>틀은 현장 원본 그대로</b> — 칸 · 차례 · 결재란을 바꾸지 않았습니다. 받은 서식의 사람·회사 이름, 공사명, 전화번호는 모두 지웠습니다.</li>
          <li><b>수식</b> — 합계 · 금액 한글 표기 · 날짜·일수 · 비율이 저절로 나옵니다. <span className="fm-key y">노란 칸</span> 은 요율·기준값(발주기관 기준으로 고쳐 씀),{' '}
            <span className="fm-key b">옅은 하늘색 칸</span> 은 자동 계산입니다.</li>
          <li><b>작성 예시</b> — 엑셀 뒤 시트에 가상의 현장으로 다 채운 모습이 들어 있습니다. 서식 화면의 미리보기에서도 볼 수 있습니다.</li>
          <li>맨 윗줄의 K-건설맵 표시는 1행을 지우면 없어집니다. <b>발주기관이 정한 서식이 있으면 그 서식이 우선</b>입니다.</li>
        </ul>
      </div>

      <details className="card js-more">
        <summary className="sec-title">갈래별로 전부 보기 — {FORMS.length + ORIG.length}가지</summary>
        {ogroups.map(([g, list]) => (
          <div key={'o' + g} id={`og-${g}`} style={{ scrollMarginTop: 76 }}>
            <div className="fm-sub">{g} <span className="count">· {list.length}</span></div>
            {list.map((f) => <OrigRow f={f} key={f.slug} />)}
          </div>
        ))}
        {groups.map(([g, list]) => (
          <div key={g}>
            <div className="fm-sub">{g} <span className="count">· {list.length}</span></div>
            {list.map((f) => (
              <Link className="row rowlink" to={`/forms/${f.slug}`} key={f.slug}>
                <span className="fic">{f.icon}</span>
                <div className="grow">
                  <div className="t">{f.title}{f.sub && <em> · {f.sub}</em>}</div>
                  <div className="d">{f.short}</div>
                </div>
                <span className="go">→</span>
              </Link>
            ))}
          </div>
        ))}
      </details>

      <details className="card js-more">
        <summary className="sec-title">계약서를 쓰실 때</summary>
        <p style={{ margin: 0, lineHeight: 1.75 }}>
          계약서는 K-건설맵이 만든 <b>일반 양식</b>입니다. 정부가 고시한 표준계약서가 있는
          계약(하도급·건설기계 임대차·근로계약)은 그 <b>원문을 쓰시는 편이 안전합니다</b> —
          여기 있는 것은 조건을 미리 맞춰 보고 빠진 항목을 확인하는 용도로 쓰세요.
          실제 체결 전에는 반드시 검토를 받으시기 바랍니다.
        </p>
      </details>

      {/* 📤 이용자가 올린 서식 — 승인 없이 바로 공개(소장님 결정). 열 때만 Firebase 를 받습니다 */}
      <UserForms />

      <div className="card fwarn">
        <b>⚠️ 먼저 확인하세요</b>
        <div>
          발주기관이 정한 서식이 있으면 <b>그 서식을 씁니다.</b> 여기 있는 것은
          정해진 서식이 없을 때 쓰는 양식입니다. 계약서 특수조건과 과업지시서를 먼저 보세요.
        </div>
      </div>

      <div className="navrow" style={{ marginTop: 10 }}>
        <Link className="navi" to="/tools">🧰 건설 도구</Link>
        <Link className="navi" to="/jeoksan">🧮 K-적산</Link>
        <Link className="navi" to="/naeyeok">📋 내역서</Link>
        <Link className="navi" to="/cad">📐 캐드 유틸</Link>
      </div>
    </>
  )
}

/* ── /forms/{slug} — 서식 한 장 ────────────────── */
/* ── /forms/o-{slug} — 현장 실무 서식(원본 틀) 한 장 ────────────────── */
const 출처말 = {
  한글: '한글(HWP) 원본을 칸·선·글자 자리 그대로 엑셀로 옮겼습니다. 칸이 잘게 나뉘어 있지만, 글은 합쳐진 칸 안에 그대로 쓰시면 됩니다.',
  PPT: 'PPT 원본을 옮겨 슬라이드 한 장이 인쇄 한 쪽입니다. 글은 도형을 눌러 그 안에서 고칩니다.',
  PDF: 'PDF 원본을 칸·선·그림 자리 그대로 엑셀로 옮겼습니다. 글은 칸 안에서 고쳐 쓰시면 됩니다.',
  엑셀: '엑셀 원본 그대로입니다 (시트·수식·서식 유지). 남의 파일을 가리키던 외부 연결만 걷어냈습니다.',
}

/* ✍️ 2026-09-29 서식 다시 만들기(tools/forms2) — 원본 틀(칸·차례·결재란)은 두고 내용·수식을 새로 넣은 것(forms_orig.json re:true)
 *    ⚠️ prerender.py orig_form_page 와 같은 글이어야 합니다(크롤러와 사람이 보는 글이 같게). */
export const 새틀말 = [
  '현장에서 쓰던 원본의 틀(칸·차례·결재란)은 그대로 두고, K-건설맵이 내용과 수식을 새로 넣어 다시 만들었습니다.',
  '엑셀 뒤 시트에 «작성 예시» 가 들어 있습니다 — 가상의 현장으로 다 채운 모습입니다. 노란 칸은 요율·기준값(발주기관 기준으로 고쳐 씀), 옅은 하늘색 칸은 자동 계산입니다.',
]
export const 첫줄말 = '맨 윗줄의 K-건설맵 표시는 1행을 지우면 없어집니다 (마우스 오른쪽 → 행 삭제). 그림이 아니라 글자라서 흔적이 남지 않습니다.'

/* 미리보기 그림 + 그림 설명(prevcap) */
function 그림들({ f }) {
  return (
    <div className="oprev">
      {f.prev.map((p, i) => {
        const cap = (f.prevcap || [])[i]
        return (
          <figure key={p}>
            <img src={p} alt={`${f.title} ${cap || `${i + 1}쪽`} 미리보기`} loading="lazy" />
            {cap && <figcaption>{cap}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}

function OrigFormPage({ f }) {
  const same = ORIG.filter((o) => o.group === f.group && o.slug !== f.slug)
  const 또 = (f.also || []).filter((a) => a && a !== f.title)
  const 크기 = f.kb >= 1024 ? `${(f.kb / 1024).toFixed(1)}MB` : `${f.kb}KB`
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <ShareBtn />
      </div>

      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          <span style={{ marginRight: 6 }}>{f.icon}</span>{f.title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{f.short}</div>
        {/* ⚠️ 미리 굽는 쪽(prerender.py orig_form_page)과 같은 줄 — 크롤러와 사람이 보는 글이 같아야 합니다 */}
        {또.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>이렇게도 부릅니다 — {또.join(' · ')}</div>
        )}
        <div className="ometa">
          <span>📂 {f.group}</span>
          {f.re ? <span>원본 틀 · 새로 만듦</span> : <span>원본 틀 그대로</span>}
          {f.re ? <span>수식 · 작성 예시</span> : <span>{f.from} 원본 → 엑셀</span>}
          {f.pages ? <span>인쇄 {f.pages}쪽</span> : null}
          {f.sheets ? <span>시트 {f.sheets}장</span> : null}
          <span>{크기}</span>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <a className="btn primary" href={f.file} download={`${f.title}.xlsx`}
            onClick={() => askAfter('forms')}>⬇ 엑셀 내려받기</a>
          <받은수 파일={[f.file]} 앞="지금까지 " 글="번 받았습니다" className="dlcount big" />
        </div>
      </div>

      <프로그램카드 p={f.prog} />

      {f.prev && f.prev.length > 0 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 8px' }}>미리보기</div>
          <그림들 f={f} />
          <div className="note sm" style={{ marginTop: 8 }}>
            {f.re ? '내려받은 엑셀을 인쇄하면 이 모양으로 나옵니다. 작성 예시는 엑셀 뒤 시트에 들어 있습니다.'
              : `내려받은 엑셀을 인쇄하면 이 모양으로 나옵니다 (앞 ${f.prev.length}쪽).`}
          </div>
        </div>
      )}

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>알아 두실 것</div>
        {f.re ? (
          <ul className="flist">
            {새틀말.map((t) => <li key={t}>{t}</li>)}
            {f.note && <li>{f.note}</li>}
            <li>{첫줄말}</li>
          </ul>
        ) : (
        <ul className="flist">
          <li>{출처말[f.from] || 출처말.엑셀}</li>
          <li>받은 서식에 있던 사람·회사 이름, 공사명, 전화번호 같은 것은 ○○○로 지웠습니다. 나머지 칸·차례·결재란은 원본 그대로입니다.</li>
          {f.note && <li>{f.note}</li>}
          <li>
            <b>K-건설맵 표시</b>는 인쇄할 때 머리글 오른쪽에 작게 나옵니다. 칸에 들어 있지 않아서 복사해도 따라가지 않습니다.
            지우려면 엑셀에서 <b>페이지 레이아웃 → 페이지 설정 → 머리글/바닥글</b> 에서 머리글을 «(없음)» 으로 고르세요.
          </li>
        </ul>
        )}
      </div>

      {same.length > 0 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>{f.group} — 다른 서식</div>
          {same.map((o) => <OrigRow f={o} key={o.slug} />)}
        </div>
      )}

      <div className="card fwarn">
        <b>⚠️ 발주기관 서식이 우선입니다</b>
        <div>
          발주기관·감리단이 정한 서식이 있으면 그것을 쓰세요. 이 서식은 현장에서 쓰던 것을 참고용으로 옮긴 것입니다.
        </div>
      </div>
    </>
  )
}

/* 📝 2026-09-30 서식 설명 본문 — «이 서식은» · «칸별 작성법» · «근거 법령»
   소장님: 「구글은 파일만 있는 페이지를 위로 안 올립니다. 이 서식이 뭔지, 어느 칸을 어떻게 쓰는지, 근거 법령이 뭔지 500~800자」
   ⚠️ 미리 굽는 쪽(prerender.py _guide_html)과 «같은 글» — 글은 forms.json 의 guide 한 곳에만 있습니다.
   ⚠️ 법령은 국가법령정보센터 원문으로 확인한 조문만(guide.at = 확인한 날). 조문 이름은 원문 링크. */
function 안내글({ g }) {
  if (!g) return null
  return (
    <>
      <div className="card fguide">
        <h2 className="sec-title" style={{ margin: '0 0 6px' }}>이 서식은</h2>
        <p className="gwhat">{굵게(g.what)}</p>
      </div>
      {Array.isArray(g.how) && g.how.length > 0 && (
        <div className="card fguide">
          <h2 className="sec-title" style={{ margin: '0 0 6px' }}>칸별 작성법</h2>
          <dl className="ghow">
            {g.how.map(([a, b], i) => (
              <div key={i}><dt>{a}</dt><dd>{굵게(b)}</dd></div>
            ))}
          </dl>
        </div>
      )}
      {Array.isArray(g.law) && g.law.length > 0 && (
        <div className="card fguide">
          <h2 className="sec-title" style={{ margin: '0 0 6px' }}>근거 법령</h2>
          <ul className="flist glaw">
            {g.law.map(([nm, txt, url], i) => (
              <li key={i}>
                <b>{url ? <a href={url} target="_blank" rel="noopener">{nm}</a> : nm}</b> — {txt}
              </li>
            ))}
          </ul>
          <div className="note sm" style={{ marginTop: 6 }}>
            국가법령정보센터 원문 기준{g.at ? `(${g.at})` : ''}입니다. 법령은 바뀔 수 있으니 계약·제출 전에 조문 링크로 원문을 확인하세요.
          </div>
        </div>
      )}
    </>
  )
}

export function FormPage() {
  const { slug } = useParams()
  const o = origBySlug(slug)
  if (o) return <OrigFormPage f={o} />
  const f = bySlug(slug)
  if (!f) {
    return (
      <Empty icon="📄">
        «{slug}» 서식을 찾지 못했습니다.<br />
        <Link to="/forms" style={{ color: 'var(--accent)', fontWeight: 700 }}>
          서식 목록에서 고르기 →
        </Link>
      </Empty>
    )
  }
  const xlsx = `/forms/${f.slug}.xlsx`
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <ShareBtn />
      </div>

      <div className="card">
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          <span style={{ marginRight: 6 }}>{f.icon}</span>{f.title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{f.short}</div>
        {/* 🔎 2026-09-19 — 서치콘솔 실측: 사람들이 치는 말과 우리 서식 이름이 조금씩 다릅니다
            (「일용직 근로계약서」 ↔ 우리는 «일용근로계약서»). 같은 말을 적어 둡니다.
            ⚠️ 미리 굽는 쪽(prerender.py form_page)과 «같은 줄» 이어야 합니다 —
               크롤러가 보는 글과 사람이 보는 글이 다르면 안 됩니다. */}
        {Array.isArray(f.also) && f.also.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            이렇게도 부릅니다 — {f.also.join(' · ')}
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 12 }}>
          {/* 정적 파일이라 <a download> 하나면 됩니다 — 라이브러리도, 전송량도 없습니다 */}
          <a className="btn primary" href={xlsx} download={`${f.title}_양식.xlsx`}
            onClick={() => askAfter('forms')}>⬇ 엑셀 내려받기</a>
          {/* 🐛 2026-09-29 wih-* 는 화면 인쇄 대신 아래 미리보기 카드의 «빈 서식 인쇄» (화면을 찍으면 설명 글까지 나왔습니다) */}
          {/* ✍️ 2026-09-29 다시 만든 서식(gen:forms2)은 빈 서식 PDF 를 엽니다 — 화면 인쇄는 옛 미리보기 표가 나옵니다 */}
          {f.gen !== 'wihgen' && (f.pdf
            ? <a className="btn ghost" href={f.pdf} target="_blank" rel="noopener">🖨 인쇄용 PDF</a>
            : <button className="btn ghost" onClick={() => window.print()}>🖨 인쇄 · PDF</button>)}
          <받은수 파일={[xlsx, f.pdf]} 앞="지금까지 " 글="번 받았습니다" className="dlcount big" />
        </div>
      </div>

      <프로그램카드 p={f.prog} />

      <안내글 g={f.guide} />

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>언제 내나</div>
        <div className="fwhen">{굵게(f.when)}</div>
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>놓치기 쉬운 것</div>
        <ul className="flist">
          {f.notes.map((n, i) => <li key={i}>{굵게(n)}</li>)}
        </ul>
      </div>

      {f.attach && f.attach.length > 0 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>함께 내는 서류</div>
          <ul className="flist tight">
            {f.attach.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {f.gen === 'wihgen' ? (
        <Suspense fallback={<div className="card muted">미리보기를 불러오는 중…</div>}><위험성미리 slug={f.slug} /></Suspense>
      ) : Array.isArray(f.prev) && f.prev.length > 0 ? (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 8px' }}>미리보기</div>
          <그림들 f={f} />
          <ul className="flist" style={{ marginTop: 8 }}>
            <li>{새틀말[1]}</li>
            <li>{첫줄말}</li>
          </ul>
        </div>
      ) : (
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>미리보기</div>
        <div className="fscroll"><Preview sheet={f.sheet} /></div>
        <div className="note sm" style={{ marginTop: 8 }}>
          내려받은 엑셀에는 표 칸이 더 많고, A4 한 장에 맞게 인쇄 설정이 되어 있습니다.
          맨 윗줄의 K-건설맵 표시는 <b>1행을 지우면 없어집니다</b> (마우스 오른쪽 → 행 삭제).
          그림이 아니라 글자라서 흔적이 남지 않습니다.
        </div>
      </div>
      )}

      <div className="card fwarn">
        <b>⚠️ 발주기관 서식이 우선입니다</b>
        <div>
          이 서식은 K-건설맵이 만든 일반 양식입니다. 계약서·과업지시서에 정해진 서식이
          있으면 그것을 쓰세요. 법령 해석이 필요한 일은 전문가와 상의하시기 바랍니다.
        </div>
      </div>
    </>
  )
}
