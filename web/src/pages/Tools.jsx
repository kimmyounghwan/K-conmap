/* ==========================================================
   🧰 도구 — 목록과 개별 도구 화면

   소장님: 「탭을 따로 만들고, 페이지별 주소 달아서 검색할 수 있게」 (2026-09-14)

   ■ 주소: /tools (목록) · /tools/{slug} (도구 한 개)
     prerender.py 가 이 주소마다 HTML 을 구워서 검색엔진이 내용을 읽습니다.
     ⚠️ 라우트와 prerender 와 sitemap 의 주소가 어긋나면 soft 404 가 됩니다
        (CLAUDE.md — NotFound 가 noindex 를 겁니다). 셋을 반드시 같이 고칩니다.

   ■ 내용(제목·설명·근거)은 web/src/data/tools.json 한 곳에만 있습니다.
     계산기 코드는 web/src/tools/calcs.jsx. 둘의 slug 가 짝이 맞아야 합니다.
   ========================================================== */
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/tools.json'
import { CALCS } from '../tools/calcs.jsx'
import NotFound from './NotFound.jsx'
import { ShareOneStrip } from './ShareOne.jsx'

const TOOLS = DATA.tools || []
const CATS = DATA.cats || []
/* 🧰 2026-09-20 소장님: 「우리가 만든 도구들은 한 곳에 다 모아 줘. 필요한 곳에 두더라도,
   한 곳에 모아야 이용자들이 알지… 최대한 쉽게 접근할 수 있도록」
   → 다른 화면에 흩어져 있는 도구들을 여기 목록에 «같이» 싣습니다.
     원래 자리는 그대로 둡니다 — 옮기는 것이 아니라 «길을 하나 더» 내는 것입니다.
   ⚠️ 목록은 web/src/data/tools.json 의 pages 한 곳에만 적습니다. */
const PAGES = DATA.pages || []
const 모두 = TOOLS.length + PAGES.reduce((n, g) => n + g.items.length, 0)
export const toolBySlug = (s) => TOOLS.find((t) => t.slug === s) || null

/* 🧰 2026-09-24 — 소장님: 「건설맵 도구는 한 자리로 모으자고 했는데, 안 된 것 같아」 · 「시작해」
   ■ 탭 「도구·서식」 이 이제 이 화면으로 옵니다(App.jsx). 서식은 맨 위 칸, 설계변경은 «내역서·설계변경» 칸 맨 앞.
   ■ 맨 위 칩을 누르면 그 칸으로 내려갑니다 — 길어도 한 번에 찾게.
   ■ 아래에 따로 있던 «내역서 · PDF · 캐드/K-적산(준비 중)» 카드 네 장은 뺐습니다.
     위 칸들과 같은 것을 두 번 보여 줬고, K-적산 «준비 중» 은 옛 글이었습니다. */
const 칸들 = [
  ['t-forms', '📄 서식'],
  ...PAGES.map((g) => [`t-${g.key}`, `${g.icon} ${g.name}`]),
  ['t-calc', '🧮 계산기'],
]
const 내림 = { scrollMarginTop: 76 }

export default function ToolsIndex() {
  return (
    <div className="wrap">
      <div className="card">
        <div className="detail-h">🧰 건설 도구·서식 <span className="count">· 도구 {모두}가지 + 서식</span></div>
        <div className="note sm">
          <b>K-건설맵이 만든 도구와 서식을 여기 다 모았습니다.</b> 내역서·설계변경·적산·입찰·문서·서식까지
          한 자리에서 찾으십시오. 회원가입 없이 바로 쓰시고, <b>전부 무료</b>입니다.
        </div>
        <div className="navrow" style={{ marginTop: 10 }}>
          {칸들.map(([id, t]) => <a className="navi" href={`#${id}`} key={id}>{t}</a>)}
        </div>
      </div>

      {/* 📄 서식 — 탭 이름에 «서식» 이 있으니 맨 위에 둡니다 */}
      <div className="card" id="t-forms" style={내림}>
        <div className="detail-h">📄 건설 서식</div>
        <Link className="row rowlink" to="/forms">
          <span className="fic">📄</span>
          <div className="grow">
            <div className="t">현장 서식 모음 — 착공부터 준공까지</div>
            <div className="d">계약·공무·공사·안전·품질·환경·노무·장비 서류를 엑셀로 바로 받습니다. 회원가입 없음.</div>
          </div>
          <span className="go">→</span>
        </Link>
      </div>

      {/* ── 다른 화면에 있는 도구들 — 여기서도 바로 갑니다 ── */}
      {PAGES.map((g) => (
        <div className="card" key={g.key} id={`t-${g.key}`} style={내림}>
          <div className="detail-h">{g.icon} {g.name} <span className="count">· {g.items.length}가지</span></div>
          {g.items.map((x) => (
            <Link className="row rowlink" to={x.to} key={x.to}>
              <span className="fic">{x.icon}</span>
              <div className="grow"><div className="t">{x.t}</div><div className="d">{x.d}</div></div>
              <span className="go">→</span>
            </Link>
          ))}
        </div>
      ))}

      <div className="sec-title" id="t-calc" style={{ marginTop: 14, ...내림 }}>
        🧮 바로 셈하는 계산기 <span className="count">· {TOOLS.length}가지 · 이 화면 안에서 바로</span>
      </div>
      {CATS.map((c) => {
        const list = TOOLS.filter((t) => t.cat === c.key)
        if (!list.length) return null
        return (
          <div className="card" key={c.key}>
            <div className="detail-h">{c.icon} {c.name} <span className="count">· {list.length}가지</span></div>
            {list.map((t) => (
              <Link className="row rowlink" to={`/tools/${t.slug}`} key={t.slug}>
                <span className="fic">{t.icon}</span>
                <div className="grow"><div className="t">{t.title}</div><div className="d">{t.short}</div></div>
                <span className="go">→</span>
              </Link>
            ))}
          </div>
        )
      })}

      {/* 🗂️ 2026-09-16 — 소장님: 「도구에 공유폴더 만든 거 다운받을 수 있게」
          띄 문구는 ShareOne.jsx 한 곳에만 있습니다. */}
      <ShareOneStrip />

      <div className="card">
        <div className="note sm">
          ⚠️ 표준품셈·물가정보 단가·노임단가는 유료 자료라 싣지 않습니다.
          도구는 <b>수량과 금액 구조만</b> 내고, 단가는 직접 넣으시면 됩니다.
        </div>
      </div>
    </div>
  )
}

export function ToolPage() {
  const { slug } = useParams()
  const t = toolBySlug(slug)
  /* 없는 slug 는 soft 404 가 되지 않게 NotFound 로 — noindex 를 걸고 언마운트 때 지웁니다. */
  if (!t) return <NotFound />
  const Calc = CALCS[t.slug]

  return (
    <div className="wrap">
      <div className="card">
        <Link className="btn ghost sm" to="/tools">← 도구·서식</Link>
        <h1 className="tl-h1">{t.icon} {t.title}</h1>
        <div className="note">{t.lead}</div>
      </div>

      <div className="card">
        {Calc ? <Calc /> : <div className="note">준비 중입니다.</div>}
      </div>

      {(t.secs || []).map((s, i) => (
        <div className="card" key={i}>
          <div className="detail-h">{s.h}</div>
          {(s.p || []).map((x, j) => <p className="tl-p" key={j}>{x}</p>)}
        </div>
      ))}

      <div className="card">
        <div className="detail-h">다른 도구</div>
        {TOOLS.filter((x) => x.slug !== t.slug).slice(0, 4).map((o) => (
          <Link className="row rowlink" to={`/tools/${o.slug}`} key={o.slug}>
            <span className="fic">{o.icon}</span>
            <div className="grow"><div className="t">{o.title}</div><div className="d">{o.short}</div></div>
            <span className="go">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
