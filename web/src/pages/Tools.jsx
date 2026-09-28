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
import { CALCS as 셈CALCS, EXAMPLES as 셈EXAMPLES, 칸창고 } from '../tools/calcs.jsx'
import { 계약CALCS, 계약EXAMPLES } from '../tools/계약칸.jsx'
import NotFound from './NotFound.jsx'
import { use남김 } from '../lib/길기록.js'

const TOOLS = DATA.tools || []
/* 📑 2026-09-28 — 계약·공사 관리 도구 4가지(tools/계약칸.jsx)를 같은 판에 얹습니다. slug 는 tools.json 과 짝 */
const CALCS = { ...셈CALCS, ...계약CALCS }
const EXAMPLES = { ...셈EXAMPLES, ...계약EXAMPLES }
/* 설명 글의 **굵게** 를 진짜 굵은 글씨로 — 전에는 별표가 그대로 보였습니다(서식 화면 Forms.jsx 굵게 와 같음) */
function 굵게(s) {
  return String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
}
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
  /* 💻 2026-09-27 소장님 결정: 쉐어원은 사이트에서 돌 수 없는 PC 프로그램 — 그대로 두고 «PC 프로그램» 이라고만 표시 */
  pc: ['💻 PC 프로그램', 'down'],
  lock: ['🔒 시험 중', 'lock'],
}
/* 계산기 묶음 이름 — tools.json cats 의 key. «work» 는 2026-09-28 계약·공사 관리(하도급·낙찰 뒤·지체상금·하자) */
const 묶음이름 = { qty: ['🧮', '수량 계산기'], bid: ['🧮', '입찰·낙찰 계산기'], work: ['📑', '계약·공사 관리'] }
const 계산기묶음 = (key) => {
  const c = CATS.find((x) => x.key === key)
  if (!c) return null
  const items = TOOLS.filter((t) => t.cat === key)
    .map((t) => ({ to: `/tools/${t.slug}`, icon: t.icon, t: t.title, d: t.short, w: 'site', new: !!t.new }))
  if (!items.length) return null
  const [icon, name] = 묶음이름[key] || ['🧮', c.name]
  return { key: `calc-${key}`, icon, name, items }
}
const 묶음들 = (() => {
  const by = Object.fromEntries(PAGES.map((g) => [g.key, g]))
  const out = []
  for (const k of ['drawing', 'naeyeok', 'file']) if (by[k]) out.push(by[k])
  for (const c of ['work', 'qty', 'bid']) { const g = 계산기묶음(c); if (g) out.push(g) }
  for (const g of PAGES) if (!out.includes(g)) out.push(g)
  return out
})()
const 모두 = 묶음들.reduce((n, g) => n + g.items.length, 0)
const 사이트몫 = 묶음들.reduce((n, g) => n + g.items.filter((x) => x.w === 'site').length, 0)
const 내림 = { scrollMarginTop: 76 }

export default function ToolsIndex() {
  /* 🧭 2026-09-27 — 도구를 찾아 들어갔다가 뒤로 오면 찾던 말이 그대로 (이 탭을 닫을 때까지) */
  const [q, setQ] = use남김('kcm.tools.q', '', 'session')
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
          {' '}<span className="tlx-w down">⬇ 받아서 씀</span> 캐드에 올려 씁니다 ·
          {' '}<span className="tlx-w down">💻 PC 프로그램</span> 사무실 컴퓨터에 깔아 씁니다 ·
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
  const [판, set판] = useState({ n: 0, ex: null })   /* 🧪 «예시로 해 보기» — 판을 새로 깔아(key) 예시 값으로 채웁니다 */
  /* 없는 slug 는 soft 404 가 되지 않게 NotFound 로 — noindex 를 걸고 언마운트 때 지웁니다. */
  if (!t) return <NotFound />
  const Calc = CALCS[t.slug]

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1">{t.icon} {t.title}</h1>
        <div className="note">{굵게(t.lead)}</div>
      </div>

      <div className="card">
        {Calc && EXAMPLES[t.slug] && (
          <div className="tlx-ex">
            <button type="button" className="btn line sm" style={{ width: 'auto' }}
                    onClick={() => set판({ n: 판.n + 1, ex: EXAMPLES[t.slug].ex })}>🧪 예시로 해 보기</button>
            {판.ex
              ? <><span className="tlx-exd">예시: {EXAMPLES[t.slug].글}</span>
                  <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => { try { localStorage.removeItem('kcm.calc.' + t.slug) } catch (e) { /* 없음 */ } set판({ n: 판.n + 1, ex: null }) }}>지우기</button></>
              : <><span className="tlx-exd">눌러 보시면 칸이 채워지고 결과가 바로 나옵니다 · 적은 값은 이 기기에 남습니다</span>
                  <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => { try { localStorage.removeItem('kcm.calc.' + t.slug) } catch (e) { /* 없음 */ } set판({ n: 판.n + 1, ex: null }) }}>칸 비우기</button></>}
          </div>
        )}
        {/* 🧭 2026-09-27 — 적은 값은 이 기기에 남습니다(calcs.jsx use칸). 계산기마다 한 묶음 */}
        {Calc ? <칸창고.Provider value={{ 열쇠: 'kcm.calc.' + t.slug, ex: 판.ex || {} }}><Calc key={판.n} ex={판.ex || {}} /></칸창고.Provider> : <div className="note">준비 중입니다.</div>}
      </div>

      {(t.secs || []).map((s, i) => (
        <div className="card" key={i}>
          <div className="detail-h">{s.h}</div>
          {(s.p || []).map((x, j) => <p className="tl-p" key={j}>{굵게(x)}</p>)}
        </div>
      ))}

      <div className="card">
        <div className="detail-h">다른 도구</div>
        {/* 같은 갈래(예: 계약·공사 관리)의 도구를 먼저 — prerender.py tool_page 의 others 와 같은 차례 */}
        {[...TOOLS.filter((x) => x.cat === t.cat && x.slug !== t.slug), ...TOOLS.filter((x) => x.cat !== t.cat)].slice(0, 4).map((o) => (
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
