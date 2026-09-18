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
export const toolBySlug = (s) => TOOLS.find((t) => t.slug === s) || null

export default function ToolsIndex() {
  return (
    <div className="wrap">
      <div className="card">
        <div className="detail-h">🧰 건설 도구 <span className="count">· {TOOLS.length}가지</span></div>
        <div className="note sm">
          현장에서 자주 쓰는 계산을 한 자리에 모았습니다. 회원가입 없이 바로 쓰시고,
          숫자는 브라우저에서 계산하니 아무것도 저장되지 않습니다.
        </div>
        {/* 📄 2026-09-16 — 탭이 「서식·도구」 하나로 합쳐졌습니다. 서로 오갈 길을 둡니다. */}
        <div className="navrow" style={{ marginTop: 10 }}>
          <Link className="navi" to="/pdf">📄 PDF 도구</Link>
          <Link className="navi" to="/forms">📄 건설 서식</Link>
          <Link className="navi" to="/cad">📐 캐드 유틸</Link>
          <Link className="navi" to="/jeoksan">🧮 K-적산</Link>
          <Link className="navi" to="/shareone">🗂️ 쉐어원 공유폴더</Link>
        </div>
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

      {/* 📐 2026-09-15 — 캐드 유틸을 탭에서 빼고 여기로 넣었습니다(리습도 도구입니다).
          /cad 주소는 그대로입니다 — 검색으로 들어오던 길을 끊으면 안 됩니다. */}
      {/* 📄 2026-09-18 — PDF 도구. 사이트 안에서 그대로 하고, 파일은 안 올라갑니다. */}
      <div className="card">
        <div className="detail-h">📄 PDF <span className="count">· 17가지</span></div>
        <Link className="row rowlink" to="/pdf">
          <span className="fic">📄</span>
          <div className="grow">
            <div className="t">PDF 도구 — 합치기·쪽 빼기·도장·점검·비교·사진대지</div>
            <div className="d">사이트 안에서 그대로 합니다. 고르신 파일은 저희 쪽으로 올라가지 않습니다. 무료.</div>
          </div>
          <span className="go">→</span>
        </Link>
      </div>

      <div className="card">
        <div className="detail-h">📐 캐드 <span className="count">· 명령 7가지</span></div>
        <Link className="row rowlink" to="/cad">
          <span className="fic">📐</span>
          <div className="grow">
            <div className="t">캐드 유틸 — 길이·면적·수량·좌표</div>
            <div className="d">파일 하나를 캐드에 올리면 명령 한 줄로 끝납니다. 무료.</div>
          </div>
          <span className="go">→</span>
        </Link>
        {/* 🧮 2026-09-16 — 적산은 «준비 중» 입니다. 받는 단추를 달지 마십시오.
            무엇을 만들고 있는지만 보여 주는 화면입니다. */}
        <Link className="row rowlink" to="/jeoksan">
          <span className="fic">🧮</span>
          <div className="grow">
            <div className="t">K-적산 — 도면에서 물량 뽑기 <em>· 준비 중</em></div>
            <div className="d">캐드에서 찍고 PC 에서 셉니다. 산출식이 엑셀 표에 있어 토목·건축 둘 다. 값은 받습니다.</div>
          </div>
          <span className="go">→</span>
        </Link>
      </div>

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
        <Link className="btn ghost sm" to="/tools">← 건설 도구</Link>
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
