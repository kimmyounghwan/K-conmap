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
import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/tools.json'
import { CALCS } from '../tools/calcs.jsx'
import NotFound from './NotFound.jsx'

const TOOLS = DATA.tools || []
const CATS = DATA.cats || []
/* 🧰 2026-09-20 소장님: 「우리가 만든 도구들은 한 곳에 다 모아 줘. 필요한 곳에 두더라도,
   한 곳에 모아야 이용자들이 알지… 최대한 쉽게 접근할 수 있도록」
   → 다른 화면에 흩어져 있는 도구들을 여기 목록에 «같이» 싣습니다.
     원래 자리는 그대로 둡니다 — 옮기는 것이 아니라 «길을 하나 더» 내는 것입니다.
   ⚠️ 목록은 web/src/data/tools.json 의 pages 한 곳에만 적습니다 (prerender.py 도 같은 것을 굽습니다). */
const PAGES = DATA.pages || []
export const toolBySlug = (s) => TOOLS.find((t) => t.slug === s) || null

/* 🧰 2026-09-25 — 소장님: 「도구가 지금도 흩어져 있는 것 같아. 한 페이지에 몰아서 쉽게 알 수 있게」 ·
   「도구는 되도록 사이트 내에서 사용하도록」 · 「탭을 도구와 서식을 … 분리」
   ■ 계산기 12가지도 따로 아래에 두지 않고 같은 꼴의 칸으로 한 판에 놓습니다 — 한눈에 다 보이게.
   ■ 칸마다 «어디서 쓰나» 를 붙입니다: 🌐 사이트에서 바로 · ⬇ 받아서 · 🔒 시험 중.
   ■ 맨 위 «찾기» 한 칸으로 이름·설명을 거릅니다.
   ■ 서식은 다시 제 탭(/forms)으로 갔습니다. 여기엔 가는 길 한 줄만 둡니다. */
const 어디 = {
  site: ['🌐 사이트에서 바로', 'site'],
  down: ['⬇ 받아서 씀', 'down'],
  lock: ['🔒 시험 중', 'lock'],
}
const 계산기묶음 = (key) => {
  const c = CATS.find((x) => x.key === key)
  if (!c) return null
  const items = TOOLS.filter((t) => t.cat === key)
    .map((t) => ({ to: `/tools/${t.slug}`, icon: t.icon, t: t.title, d: t.short, w: 'site' }))
  return { key: `calc-${key}`, icon: '🧮', name: key === 'qty' ? '수량 계산기' : '입찰·낙찰 계산기', items }
}
const 묶음들 = (() => {
  const by = Object.fromEntries(PAGES.map((g) => [g.key, g]))
  const out = []
  for (const k of ['drawing', 'naeyeok', 'file']) if (by[k]) out.push(by[k])
  for (const c of ['qty', 'bid']) { const g = 계산기묶음(c); if (g) out.push(g) }
  for (const g of PAGES) if (!out.includes(g)) out.push(g)
  return out
})()
const 모두 = 묶음들.reduce((n, g) => n + g.items.length, 0)
const 사이트몫 = 묶음들.reduce((n, g) => n + g.items.filter((x) => x.w === 'site').length, 0)
const 내림 = { scrollMarginTop: 76 }

export default function ToolsIndex() {
  const [q, setQ] = useState('')
  const 찾은 = useMemo(() => {
    const w = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!w.length) return 묶음들
    return 묶음들.map((g) => ({ ...g, items: g.items.filter((x) => {
      const s = `${x.t} ${x.d} ${g.name}`.toLowerCase()
      return w.every((k) => s.includes(k))
    }) })).filter((g) => g.items.length)
  }, [q])
  const 찾은수 = 찾은.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🧰 건설 도구 <span className="count">· {모두}가지 · 전부 무료</span></h1>
        <div className="note sm">
          <b>K-건설맵이 만든 도구를 여기 한 곳에 다 모았습니다.</b> 회원가입 없이 바로 쓰십시오.
          {' '}<b>{모두}가지 가운데 {사이트몫}가지는 이 사이트 안에서 바로 됩니다</b> — 깔 것이 없고, 넣으신 파일은 밖으로 나가지 않습니다.
        </div>
        <div className="searchwrap" style={{ marginTop: 10 }}>
          <span className="ico">🔎</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="도구 찾기 — 예: 철근, 설계변경, PDF, 3D, 투찰"
            aria-label="도구 찾기" />
          {q && <button className="x" onClick={() => setQ('')} aria-label="지우기">×</button>}
        </div>
        {!q && (
          <div className="navrow" style={{ marginTop: 10 }}>
            {묶음들.map((g) => <a className="navi" href={`#t-${g.key}`} key={g.key}>{g.icon} {g.name}</a>)}
          </div>
        )}
        <div className="tlx-legend">
          <span className="tlx-w site">🌐 사이트에서 바로</span> 이 화면에서 끝납니다 ·
          {' '}<span className="tlx-w down">⬇ 받아서 씀</span> 캐드·PC 에 깔아 씁니다 ·
          {' '}<span className="tlx-w lock">🔒 시험 중</span> 아직 여는 중
        </div>
      </div>

      {q && !찾은수 && (
        <div className="card"><div className="note">「{q}」 에 맞는 도구가 없습니다. 다른 말로 찾아 보시거나, 사랑방에 «이런 도구가 있으면» 한 줄 남겨 주십시오.</div></div>
      )}

      {찾은.map((g) => (
        <div className="card" key={g.key} id={`t-${g.key}`} style={내림}>
          <div className="detail-h">{g.icon} {g.name} <span className="count">· {g.items.length}가지</span></div>
          <div className="tlx-grid">
            {g.items.map((x) => {
              const 곳 = 어디[x.w] || 어디.site
              return (
                <Link className="tlx-card" to={x.to} key={x.to}>
                  <span className="tlx-ic">{x.icon}</span>
                  <span className="tlx-body">
                    <span className="tlx-t">{x.t}{x.new && <em className="tlx-new">새로</em>}</span>
                    <span className="tlx-d">{x.d}</span>
                    <span className={'tlx-w ' + 곳[1]}>{곳[0]}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      <Link className="card fbook" to="/forms">
        <span className="fic">📄</span>
        <div className="grow">
          <div className="t">서식은 «서식» 탭에 <em>· 착공부터 준공까지</em></div>
          <div className="d">계약·공무·공사·안전·품질·환경·노무·장비 서류를 엑셀로 바로 받습니다.</div>
        </div>
        <span className="go">→</span>
      </Link>

      <div className="card">
        <div className="note sm">
          ⚠️ 표준품셈·물가정보 단가·노임단가는 유료 자료라 싣지 않습니다.
          계산기는 <b>수량과 금액 구조만</b> 내고, 단가는 직접 넣으시면 됩니다.
          <br />«이런 도구가 있으면 좋겠다» 는 <Link to="/qna">사랑방</Link>에 한 줄 남겨 주십시오.
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
        <Link className="btn ghost sm" to="/tools">← 도구</Link>
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
