import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/forms.json'
import { ShareBtn } from './CorpPage.jsx'
import { Empty } from '../components.jsx'

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
/* 갈래는 «단계»가 아니라 «현장 조직» 기준입니다 — 공무/공사/안전/품질이 실제로
   현장이 나뉘는 방식이고, 서류를 찾는 사람도 그렇게 찾습니다. */
const GROUPS = ['일반', '계약·공사', '계약·임대구매', '계약·노무기타',
  '공무', '공사', '안전', '품질', '환경', '노무·장비']

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
                {Array.from({ length: Math.min(b.n, 4) }).map((_, j) => (
                  <tr key={j}>{b.cols.map((c) => <td key={c} />)}</tr>
                ))}
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
export default function Forms() {
  const groups = useMemo(() => {
    const m = new Map()
    for (const g of GROUPS) m.set(g, [])
    for (const f of FORMS) {
      if (!m.has(f.group)) m.set(f.group, [])
      m.get(f.group).push(f)
    }
    return [...m.entries()].filter(([, v]) => v.length)
  }, [])

  return (
    <>
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>건설 서식</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          현장에서 실제로 쓰는 서류 {FORMS.length}가지 · 엑셀로 바로 내려받기 · 회원가입 없음
          <div style={{ marginTop: 6 }}>일반 · <b>계약서</b> · 공무 · 공사 · 안전 · 품질 · 환경 · 노무·장비</div>
        </div>
      </div>

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
export function FormPage() {
  const { slug } = useParams()
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
        <div className="btn-row" style={{ marginTop: 12 }}>
          {/* 정적 파일이라 <a download> 하나면 됩니다 — 라이브러리도, 전송량도 없습니다 */}
          <a className="btn primary" href={xlsx} download={`${f.title}_양식.xlsx`}>⬇ 엑셀 내려받기</a>
          <button className="btn ghost" onClick={() => window.print()}>🖨 인쇄 · PDF</button>
        </div>
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>언제 내나</div>
        <div className="fwhen">{f.when}</div>
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>놓치기 쉬운 것</div>
        <ul className="flist">
          {f.notes.map((n, i) => <li key={i}>{n}</li>)}
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
