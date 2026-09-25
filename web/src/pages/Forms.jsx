import { useMemo, useState } from 'react'

import { askAfter } from '../AskComment'
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/forms.json'
import ORIG_DATA from '../data/forms_orig.json'
import { ShareBtn } from './CorpPage.jsx'
import UserForms from '../UserForms.jsx'
import { Empty } from '../components.jsx'
import { SafetyStrip } from './Safety.jsx'

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
        <div className="d">{f.short}</div>
      </div>
      <span className="go">→</span>
    </Link>
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
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>건설 서식</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          현장 실무 서식 {ORIG.length}가지 + 일반 양식 {FORMS.length}가지 · 엑셀로 바로 내려받기 · 회원가입 없음
        </div>
        {/* 🔎 서식이 많아져서 — 이름·다른 이름·설명으로 찾습니다 (띄어쓰기 무시) */}
        <div className="searchwrap" style={{ marginTop: 10 }}>
          <span className="ico">🔎</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="서식 찾기 — 예: 착공계, 점검표, 시공계획서"
            aria-label="서식 찾기" />
          {q && <button className="x" onClick={() => setQ('')} aria-label="지우기">×</button>}
        </div>
        <div className="navrow" style={{ marginTop: 10 }}>
          {ogroups.map(([g]) => <a className="navi" href={`#og-${g}`} key={g}>{g}</a>)}
          <a className="navi" href="#fg-일반">일반 양식</a>
        </div>
        {/* 🧰 2026-09-16 — 탭에서 「도구」를 「서식·도구」로 합쳤습니다.
            도구가 묻히지 않게 여기 맨 위에서 바로 가게 둡니다.
            ⚠️ /tools · /cad 주소는 그대로입니다 — 검색으로 들어오던 길입니다. */}
        <div className="navrow" style={{ marginTop: 8 }}>
          <Link className="navi" to="/tools">🧰 건설 도구</Link>
          <Link className="navi" to="/cad">📐 캐드 유틸</Link>
          <Link className="navi" to="/jeoksan">🧮 K-적산</Link>
        </div>
      </div>

      {/* ⚡ 2026-09-24 — 서류를 하나씩 받기 전에: 한 번 입력으로 24가지 */}
      <Link className="card fbook" to="/tools/wonclick">
        <span className="fic">⚡</span>
        <div className="grow">
          <div className="t">공사서류 원클릭 <em>· 서류 24가지 한 번에</em></div>
          <div className="d">
            공사명·금액·날짜를 <b>한 번만</b> 넣으면 착공계·현장대리인계·기성·준공·하자 서류가
            채워진 엑셀이 나옵니다. 매크로 없음 · 관급·민간 모두.
          </div>
        </div>
        <span className="go">→</span>
      </Link>

      {찾음 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>
            «{q.trim()}» 찾은 서식 {찾음.o.length + 찾음.n.length}가지
          </div>
          {찾음.o.map((f) => <OrigRow f={f} key={f.slug} />)}
          {찾음.n.map((f) => (
            <Link className="row rowlink" to={`/forms/${f.slug}`} key={f.slug}>
              <span className="fic">{f.icon}</span>
              <div className="grow">
                <div className="t">{f.title}{f.sub && <em> · {f.sub}</em>}</div>
                <div className="d">{f.short}</div>
              </div>
              <span className="go">→</span>
            </Link>
          ))}
          {찾음.o.length + 찾음.n.length === 0 && (
            <div className="note sm">찾는 서식이 없습니다. 다른 말로 찾아 보시거나, 아래 갈래에서 골라 주세요.</div>
          )}
        </div>
      )}

      {/* 📂 현장 실무 서식 — 원본 틀 그대로 */}
      <div className="card ohead">
        <div className="detail-h">📂 현장 실무 서식 <span className="count">· {ORIG.length}가지 · 원본 틀 그대로</span></div>
        <div className="note sm">
          현장에서 실제로 쓰던 한글·엑셀·PPT 서식을 <b>칸과 선, 글자 자리까지 그대로</b> 엑셀로 옮겼습니다.
          사람·회사 이름과 공사명은 ○○○로 지웠습니다. 인쇄하면 머리글에 작은 <b>K-건설맵</b> 표시가 나오는데,
          칸 복사에는 따라가지 않고 페이지 설정에서 지울 수 있습니다.
        </div>
      </div>
      {ogroups.map(([g, list]) => (
        <div className="card" key={g} id={`og-${g}`} style={{ scrollMarginTop: 76 }}>
          <div className="sec-title" style={{ margin: '0 0 6px' }}>{g} <span className="count">· {list.length}</span></div>
          {list.map((f) => <OrigRow f={f} key={f.slug} />)}
        </div>
      ))}

      <div className="card ohead" id="fg-일반" style={{ scrollMarginTop: 76 }}>
        <div className="detail-h">📄 일반 양식 <span className="count">· {FORMS.length}가지 · K-건설맵이 만든 것</span></div>
        <div className="note sm">정해진 서식이 없을 때 쓰는 기본 양식입니다. 착공부터 준공까지 갈래별로 모았습니다.</div>
      </div>

      <Link className="card fbook" to="/change/excel">
        <span className="fic">📊</span>
        <div className="grow">
          <div className="t">설계변경 자동계산 엑셀 <em>· 시트 11장</em></div>
          <div className="d">
            빈 표가 아니라 <b>계산기</b>입니다. 단가 하나를 고치면 내역 · 증감대비표 ·
            원가계산서까지 다시 계산됩니다.
          </div>
        </div>
        <span className="go">→</span>
      </Link>

      {/* 🦺 2026-09-16 — 착공 서류를 찾으러 오는 자리입니다.
          안전관리계획서·유해위험방지계획서는 착공 전에 내는 것이라
          여기서 «우리 현장이 대상인가» 를 바로 볼 수 있어야 합니다.
          띄는 Safety.jsx 한 곳에만 있습니다 — 문구를 두 번 적지 않습니다. */}
      <SafetyStrip />

      <div className="card fwarn">
        <b>⚠️ 먼저 확인하세요</b>
        <div>
          발주기관이 정한 서식이 있으면 <b>그 서식을 씁니다.</b> 여기 있는 것은
          정해진 서식이 없을 때 쓰는 일반 양식입니다. 계약서 특수조건과 과업지시서를
          먼저 보세요.
        </div>
      </div>

      {groups.map(([g, list]) => (
        <div className="card" key={g}>
          <div className="sec-title" style={{ margin: '0 0 6px' }}>{g}</div>
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

      {/* 📤 이용자가 올린 서식 — 승인 없이 바로 공개(소장님 결정). 열 때만 Firebase 를 받습니다 */}
      <UserForms />

      <div className="note" style={{ marginTop: 10 }}>
        계약서는 K-건설맵이 만든 <b>일반 양식</b>입니다. 정부가 고시한 표준계약서가 있는
        계약(하도급·건설기계 임대차·근로계약)은 그 <b>원문을 쓰시는 편이 안전합니다</b> —
        여기 있는 것은 조건을 미리 맞춰 보고 빠진 항목을 확인하는 용도로 쓰세요.
        실제 체결 전에는 반드시 검토를 받으시기 바랍니다.
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

function OrigFormPage({ f }) {
  const same = ORIG.filter((o) => o.group === f.group && o.slug !== f.slug)
  const 또 = (f.also || []).filter((a) => a && a !== f.title)
  const 크기 = f.kb >= 1024 ? `${(f.kb / 1024).toFixed(1)}MB` : `${f.kb}KB`
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <Link className="btn ghost sm" to="/forms">← 서식 목록</Link>
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
          <span>원본 틀 그대로</span>
          <span>{f.from} 원본 → 엑셀</span>
          {f.pages ? <span>인쇄 {f.pages}쪽</span> : null}
          {f.sheets ? <span>시트 {f.sheets}장</span> : null}
          <span>{크기}</span>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <a className="btn primary" href={f.file} download={`${f.title}.xlsx`}
            onClick={() => askAfter('forms')}>⬇ 엑셀 내려받기</a>
        </div>
      </div>

      {f.prev && f.prev.length > 0 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 8px' }}>미리보기</div>
          <div className="oprev">
            {f.prev.map((p, i) => (
              <img key={p} src={p} alt={`${f.title} ${i + 1}쪽 미리보기`} loading="lazy" />
            ))}
          </div>
          <div className="note sm" style={{ marginTop: 8 }}>내려받은 엑셀을 인쇄하면 이 모양으로 나옵니다 (앞 {f.prev.length}쪽).</div>
        </div>
      )}

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>알아 두실 것</div>
        <ul className="flist">
          <li>{출처말[f.from] || 출처말.엑셀}</li>
          <li>받은 서식에 있던 사람·회사 이름, 공사명, 전화번호 같은 것은 ○○○로 지웠습니다. 나머지 칸·차례·결재란은 원본 그대로입니다.</li>
          {f.note && <li>{f.note}</li>}
          <li>
            <b>K-건설맵 표시</b>는 인쇄할 때 머리글 오른쪽에 작게 나옵니다. 칸에 들어 있지 않아서 복사해도 따라가지 않습니다.
            지우려면 엑셀에서 <b>페이지 레이아웃 → 페이지 설정 → 머리글/바닥글</b> 에서 머리글을 «(없음)» 으로 고르세요.
          </li>
        </ul>
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
        <Link className="btn ghost sm" to="/forms">← 서식 목록</Link>
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
          <button className="btn ghost" onClick={() => window.print()}>🖨 인쇄 · PDF</button>
        </div>
      </div>

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

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>미리보기</div>
        <div className="fscroll"><Preview sheet={f.sheet} /></div>
        <div className="note sm" style={{ marginTop: 8 }}>
          내려받은 엑셀에는 표 칸이 더 많고, A4 한 장에 맞게 인쇄 설정이 되어 있습니다.
          맨 윗줄의 K-건설맵 표시는 <b>1행을 지우면 없어집니다</b> (마우스 오른쪽 → 행 삭제).
          그림이 아니라 글자라서 흔적이 남지 않습니다.
        </div>
      </div>

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
