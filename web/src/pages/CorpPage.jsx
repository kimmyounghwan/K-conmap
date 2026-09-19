import { useEffect, useState } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { getCorp, getOverview } from '../lib/data.js'
import { CorpReport } from './Analysis.jsx'
import { Skeleton, Empty } from '../components.jsx'
import { pct, num } from '../lib/fmt.js'
/* ⚠️ 2026-09-09 — 이 줄이 빠져 있어 /corp/… 가 «흰 화면» 이었습니다.
   ReferenceError: wasBaked is not defined. AgencyPage·NoticePage 에는 있었는데
   여기만 없었습니다. tools/checkimports.py 가 이제 이런 걸 잡습니다. */
import { wasBaked } from '../lib/baked.js'

/**
 * /corp/{업체키} — 업체 성적표. 분석 탭 안에 갇혀 있던 화면을 주소로 꺼낸 것입니다.
 *
 * 왜 만들었나 (2026-09-04)
 *   업체 자료가 5만 곳이 넘는데 전부 «분석 탭에서 검색해야만» 볼 수 있었습니다.
 *   주소가 없으면 검색엔진이 못 찾고, 카톡으로 보낼 수도 없습니다.
 *   「○○건설 낙찰 실적」 을 찾는 사람은 실제로 있습니다 — 경쟁사를 보는 사람,
 *   자기 회사를 쳐 보는 사람. 그 사람들이 들어올 문을 만드는 것입니다.
 *
 * ⚠️ 주소에는 «정규화된 이름»만 씁니다. 사업자번호로 갈라 놓은 키(«이름#번호»)는
 *    주소에 넣지 않습니다 — 남의 사업자번호가 URL 과 검색결과에 남습니다.
 *    그 갈래는 화면 안에서만 눌러 볼 수 있게 둡니다.
 */
export default function CorpPage() {
  const { name } = useParams()
  const loc = useLocation()
  const decoded = decodeURIComponent(name || '')
  /* 같은 이름의 법인이 여럿일 때 «이 법인만 보기» 로 좁혀 보는 갈래.
     주소에는 넣지 않습니다(사업자번호 노출). 분석 탭에서 넘어올 때는 라우터 state 로 옵니다.

     🚨 2026-09-18 — 전에는 이걸 화면 안 상태(useState)로만 들고 있었습니다. 그래서
        «이 법인만 보기» 를 눌러도 **브라우저 «뒤로» 가 안 먹었습니다** — 기록이 안 남으니까요.
        소장님: 「업체를 선택하면 뒤로가기가 되어야 하는데, 없어」
        → 이제 라우터 기록(state)에 남깁니다. 주소는 그대로라 사업자번호는 여전히 안 보이고,
          뒤로 누르면 «같은 이름 전체» 로 돌아옵니다. */
  const navigate = useNavigate()
  const firm = loc.state?.firm || null
  const key = firm || decoded
  const [c, setC] = useState(undefined)
  const [ov, setOv] = useState(null)

  useEffect(() => { getOverview().then(setOv).catch(() => {}) }, [])
  const 법인고르기 = (k) => navigate(loc.pathname + loc.search, { state: { firm: k } })
  const 전체보기 = () => navigate(loc.pathname + loc.search, { state: {} })

  useEffect(() => {
    let alive = true
    setC(undefined)
    getCorp(key).then((v) => { if (alive) setC(v) }).catch(() => { if (alive) setC(null) })
    return () => { alive = false }
  }, [key])

  /* 메타태그 — 주소마다 제목·설명이 달라야 색인이 붙습니다.
     빌드할 때 prerender.py 가 같은 문구를 정적 HTML 에도 박아 둡니다
     (네이버·카톡은 자바스크립트를 안 돌리므로 그쪽이 본체입니다). */
  const baked = wasBaked(`/corp/${decoded}`)

  useEffect(() => {
    if (c === undefined) return
    // ⚠️ AgencyPage 와 같은 이유 — 구운 페이지면 «못 받았을 뿐» 일 수 있습니다.
    if (!c && baked) return
    const nm = c?.name || decoded
    const title = c
      ? `${nm} 낙찰 실적 — 3년간 ${num(c.n)}건 · 평균 투찰률 ${pct(c.s?.avg, 2)} | K-건설맵`
      : `${nm} | K-건설맵`
    const reg = c ? Object.keys(c.reg || {})[0] : null
    const desc = c
      ? `${nm}의 조달청 개찰 기록 ${num(c.n)}건. 평균 투찰률 ${pct(c.s?.avg, 2)}`
        + (reg ? `, 주력 지역 ${reg}` : '') + '. 지역·기관별 낙찰 분포와 최근 낙찰 내역을 무료로 봅니다.'
      : '업체 낙찰 실적 분석'
    document.title = title
    setMeta('description', desc)
    setProp('og:title', title)
    setProp('og:description', desc)
    setLink('canonical', `${location.origin}/corp/${encodeURIComponent(decoded)}`)
    // 자료 없는 업체 페이지는 색인에서 뺍니다 (soft 404 방지)
    setMeta('robots', c ? null : 'noindex')
    return () => setMeta('robots', null)
  }, [c, decoded, baked])

  if (c === undefined) return <div style={{ paddingTop: 14 }}><Skeleton n={3} /></div>
  if (!c) {
    return (
      <Empty icon={baked ? '📡' : '🏢'}>
        {baked
          ? <>자료를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.<br /></>
          : <>«{decoded}» 의 낙찰 기록이 없습니다.<br /></>}
        3년치 개찰에서 <b>1순위(낙찰)</b> 기록만 모으므로, 투찰만 하고 떨어진 업체는 나오지 않습니다.<br />
        {/* 🚨 2026-09-18 — 여기까지 온 사람이 성적표가 가장 필요한 사람입니다.
            「없습니다」 로 끝내지 않습니다. */}
        <b>넣으신 것까지 보시려면 성적표를 신청하십시오 — 낙찰이 한 건도 없어도 나옵니다.</b><br />
        {'   '}
        <Link to="/analysis?m=corp" style={{ color: 'var(--accent)', fontWeight: 700 }}>분석 탭에서 다시 찾아보기 →</Link>
      </Empty>
    )
  }

  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <Link to="/analysis?m=corp" className="btn ghost sm">← 다른 업체 찾기</Link>
        <ShareBtn />
      </div>
      {/* 🚨 2026-09-18 — «어느 법인» 인지 여기에 적습니다. 같은 이름이 네 곳이면
          「이 법인 하나만 보고 있습니다」 만으로는 어느 곳인지 알 수 없습니다. */}
      {firm && (
        <div className="note" style={{ marginBottom: 10 }}>
          <b>{c.name}</b>{c.ceo ? ` · 대표 ${c.ceo}` : ''}
          {c.biz ? ` · ${c.biz.slice(0, 3)}-${c.biz.slice(3, 5)}-•••` : ''}
          {' '}— 이 법인 하나만 보고 있습니다 ·{' '}
          <a onClick={전체보기} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>
            같은 이름 전체 보기 →
          </a>
        </div>
      )}
      <CorpReport c={c} ov={ov} onPickFirm={법인고르기} onAll={전체보기} base={decoded} />
      {/* 📊 성적표 — 자기 회사 숫자를 «막 본 직후» 가 가장 뜨거운 자리입니다 (2026-09-15).
          이 화면은 업체마다 미리 구워져 있어 검색으로 바로 들어옵니다. */}
      <div className="btn-row" style={{ marginTop: 10 }}>
        <Link className="btn" to="/calc" style={{ flex: 1 }}>💰 바로투찰 열기 →</Link>
      </div>
      <div className="note" style={{ marginTop: 10 }}>
        공공데이터포털 나라장터 입찰정보를 가공해 보여드립니다. 3년치 개찰의 «1순위» 기록만 담겨 있어,
        투찰했지만 떨어진 건은 집계되지 않습니다.
      </div>
    </>
  )
}

/* 「주소 복사」 — 이 화면을 카톡으로 보낼 수 있게 하는 버튼.
   주소가 페이지마다 다르므로 받는 사람이 바로 그 업체 화면을 봅니다. */
export function ShareBtn() {
  const [done, setDone] = useState(false)
  return (
    <button className="btn ghost sm"
      onClick={() => {
        const u = decodeURIComponent(location.href)
        navigator.clipboard?.writeText(u).then(() => { setDone(true); setTimeout(() => setDone(false), 1600) })
          .catch(() => { setDone(false) })
      }}>
      {done ? '✓ 복사했습니다' : '🔗 주소 복사'}
    </button>
  )
}

function setMeta(nameAttr, content) {
  let el = document.head.querySelector(`meta[name="${nameAttr}"]`)
  if (content === null) { if (el && nameAttr === 'robots') el.remove(); return }
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', nameAttr); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function setProp(prop, content) {
  let el = document.head.querySelector(`meta[property="${prop}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el) }
  el.setAttribute('href', href)
}
