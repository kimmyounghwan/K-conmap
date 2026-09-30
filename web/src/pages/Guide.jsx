import { useParams, Link } from 'react-router-dom'
import DATA from '../data/guide.json'
import { ShareBtn } from './CorpPage.jsx'
import NotFound from './NotFound.jsx'

/**
 * /guide · /guide/{주제} — 「입찰 알아보기」 (2026-09-06)
 *
 * 소장님: 「애드센스 신청하면 어때?」 → 실측해 보니 구글 색인이 홈 1개뿐이었습니다.
 *   사이트맵은 정상이고(1,270주소 발견) 미리 굽기도 돌고 있어 시간이 해결하지만,
 *   그동안 **«이 사이트에만 있는 글»** 을 만들어 두는 것이 색인에도 심사에도 가장 큽니다.
 *
 * 무엇을 적었나 — 전부 **이 사이트가 직접 잰 숫자**입니다. 다른 곳에서 옮겨 온 것이 없습니다.
 *   · 투찰금액 식 두 개가 서로 다르다는 것 (A값 비율에 비례하는 오차로 확인)
 *   · 사정률 실측 중앙 99.896% · 예가범위별 σ
 *   · 분위를 내려도 1순위율이 안 움직인다는 것 (8,424건 전수 대입)
 *   · 참가업체수 묶음별 1순위율 11배 차이
 *   · 추첨번호와 낙찰은 무관하다는 것 (1,451건 · 637,884표)
 *
 * ⚠️ 하단 탭은 늘리지 않습니다(이미 7개). 푸터와 바로투찰 설명에서만 들어갑니다.
 * ⚠️ 본문은 web/src/data/guide.json 한 곳에만 있습니다 — prerender.py 가 같은 파일을 읽어
 *    크롤러용 HTML 을 굽습니다. 두 벌로 적으면 반드시 어긋납니다(CLAUDE.md).
 */

const TOPICS = DATA.topics || []
export function guideBySlug(s) { return TOPICS.find((t) => t.slug === s) || null }
/* ⚖️ 2026-09-30 — 글 묶음 두 가지: 실측(개찰 자료를 직접 잰 글) · 법·계약(법제처 원문을 확인해 현장에서 자주 틀리는 것).
   소장님: 「업체 실적페이지하고 law 5편 … 필요한 것 지금 작업해줘」. 묶음은 guide.json 의 g 칸(없으면 실측). */
export const GROUPS = [
  { g: '', h: '📊 입찰 셈 — 개찰 자료로 직접 잰 것', d: '투찰금액 · 사정률 · 분위 · 참가업체수 · 추첨번호' },
  { g: 'law', h: '⚖️ 법 · 계약 — 현장에서 자주 틀리는 것', d: '법제처 현행 법령 원문을 확인하고 조문 번호를 달았습니다' },
]
const 묶음 = (t) => (t.g === 'law' ? 'law' : '')     /* 모르는 g 는 «실측» 으로 — 목록에서 글이 빠지지 않게(selfcheck 가 봄) */

/* **굵게** 만 처리합니다 — 마크다운 라이브러리를 브라우저로 보내지 않습니다(Change.jsx 와 같은 규칙). */
function md(s) {
  const parts = String(s).split(/\*\*(.+?)\*\*/g)
  return parts.map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
}

function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    if (b.t === 'p') return <p className="cp" key={i}>{md(b.text)}</p>
    if (b.t === 'warn') return <div className="cwarn" key={i}>⚠️ {md(b.text)}</div>
    if (b.t === 'ul') return <ul className="flist" key={i}>{b.items.map((x, j) => <li key={j}>{md(x)}</li>)}</ul>
    if (b.t === 'steps') {
      return (
        <div className="csteps" key={i}>
          {b.items.map(([h, d], j) => <div className="cstep" key={j}><b>{h}</b><span>{md(d)}</span></div>)}
        </div>
      )
    }
    if (b.t === 'table') {
      return (
        <div className="fscroll" key={i}>
          <table className={'ctab' + (b.fit ? ' fit' : '')}>
            <thead><tr>{b.cols.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{md(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    }
    if (b.t === 'src') {
      /* 근거 조문 — 법제처 원문으로 바로 갑니다(바깥 주소라 새 창) */
      return (
        <div className="csrc" key={i}>
          <span className="csrc-h">근거 조문 (법제처)</span>
          {b.items.map(([nm, url], j) => (
            <a key={j} href={url} target="_blank" rel="noopener nofollow">{nm} ↗</a>
          ))}
        </div>
      )
    }
    if (b.t === 'links') {
      /* 사이트 안쪽 글로 잇습니다 — <Link> 라 새로 받지 않습니다. */
      return (
        <div className="clinks" key={i}>
          {b.items.map(([nm, url, note], j) => (
            <Link className="clink" key={j} to={url}>
              <span className="ct">{nm}</span><span className="cd">{note}</span><span className="go">→</span>
            </Link>
          ))}
        </div>
      )
    }
    return null
  })
}

export default function GuideIndex() {
  return (
    <>
      <div className="card">
        {/* 미리 구운 HTML(prerender.py)도 여기에 h1 을 넣습니다 — React 가 덮어쓴 뒤에도
            같은 자리에 h1 이 있어야 «렌더링 후» 를 보는 크롤러에게 제목이 사라지지 않습니다. */}
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📚 입찰 알아보기</h1>
        <p className="cp" style={{ marginTop: 8 }}>
          적격심사 공사에서 투찰금액이 어떻게 정해지는지, 그리고 «더 싸게 쓰면 더 딸까» 같은 질문의 답을
          <b> 실제 개찰 자료로 재서</b> 정리했습니다. 이 사이트가 모은 개찰 1만여 건을 직접 계산한 결과입니다.
          계약한 뒤의 일(하도급대금 · 물가변동 · 설계변경 · 지체상금)은 <b>법제처 원문</b>을 확인해 따로 묶었습니다.
        </p>
      </div>
      {GROUPS.map((gr) => {
        const ts = TOPICS.filter((t) => 묶음(t) === gr.g)
        if (!ts.length) return null
        return (
          <div key={gr.g || 'bid'}>
            <div className="sec-title" style={{ margin: '16px 0 6px' }}>{gr.h}
              <span className="count" style={{ marginLeft: 6 }}>{gr.d}</span></div>
            {ts.map((t) => (
              <Link className="row rowlink" to={`/guide/${t.slug}`} key={t.slug}>
                <span className="fic">{t.icon}</span>
                <div className="grow"><div className="t">{t.title}</div><div className="d">{t.short}</div></div>
                <span className="go">→</span>
              </Link>
            ))}
          </div>
        )
      })}
      <div className="note sm" style={{ marginTop: 10 }}>
        숫자는 조달청 나라장터 공개 자료를 K-건설맵이 집계한 것입니다. 투찰 전에는 반드시 공고서 원문을 확인하세요.
        법 · 계약 글은 글마다 적힌 날짜의 현행 법령 기준이며, 법률 자문이 아닙니다 — 실제 분쟁은 계약서 · 공문과 함께 전문가와 확인하십시오.
      </div>
    </>
  )
}

export function GuideTopic() {
  const { slug } = useParams()
  const t = guideBySlug(slug)
  // 없는 slug 는 «soft 404» 가 됩니다 — NotFound 가 noindex 를 걸고 언마운트할 때 지웁니다.
  // (CLAUDE.md: path="*" 를 홈으로 폴백시켜 없는 주소가 전부 색인된 사고)
  if (!t) return <NotFound />
  /* 같은 묶음 글을 먼저 — 법 글을 읽는 사람에게 사정률 글부터 권하지 않게 */
  const others = [...TOPICS.filter((x) => x.slug !== t.slug && 묶음(x) === 묶음(t)),
                  ...TOPICS.filter((x) => 묶음(x) !== 묶음(t))].slice(0, 4)
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <ShareBtn />
      </div>
      <div className="card">
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
          <span style={{ marginRight: 6 }}>{t.icon}</span>{t.title}
        </h1>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{t.sub}</div>
        <p className="cp" style={{ marginTop: 8 }}>{md(t.lead)}</p>
      </div>
      {t.secs.map((s, i) => (
        <div className="card" key={i}>
          <div className="sec-title" style={{ margin: '0 0 8px' }}>{s.h}</div>
          <Blocks blocks={s.blocks} />
        </div>
      ))}
      {묶음(t) === 'law' && (
        <div className="note sm" style={{ marginTop: 10 }}>
          이 글은 제목 아래 적힌 날짜의 현행 법령 기준이며, 법률 자문이 아닙니다. 법령은 바뀔 수 있으니
          위 «근거 조문» 으로 원문을 확인하시고, 실제 분쟁은 계약서 · 공문과 함께 전문가와 확인하십시오.
        </div>
      )}
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>이어서 볼 것</div>
        {others.map((o) => (
          <Link className="row rowlink" to={`/guide/${o.slug}`} key={o.slug}>
            <span className="fic">{o.icon}</span>
            <div className="grow"><div className="t">{o.title}</div></div>
            <span className="go">→</span>
          </Link>
        ))}
        <Link className="row rowlink" to="/">
          <span className="fic">💰</span>
          <div className="grow"><div className="t">바로투찰로 금액 계산하기</div>
            <div className="d">공고를 고르면 권장 투찰금액이 바로 나옵니다</div></div>
          <span className="go">→</span>
        </Link>
      </div>
    </>
  )
}
