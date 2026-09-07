import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAgency } from '../lib/data.js'
import AgencyReport from '../AgencyReport.jsx'
import { Skeleton, Empty } from '../components.jsx'
import { ShareBtn } from './CorpPage.jsx'
import { pct, num } from '../lib/fmt.js'
import { wasBaked } from '../lib/baked.js'

/**
 * /agency/{기관명} — 검색엔진에 색인되는 페이지.
 * 기관 수천 곳이 각각 독립 URL을 가지므로, 도구를 쓰는 것만으로
 * 검색 유입 재료(콘텐츠)가 자동으로 쌓인다.
 */
export default function AgencyPage() {
  const { name } = useParams()
  const decoded = decodeURIComponent(name || '')
  const [a, setA] = useState(undefined)

  useEffect(() => {
    let alive = true
    getAgency(decoded).then((v) => { if (alive) setA(v) })
    return () => { alive = false }
  }, [decoded])

  // 메타태그 — 페이지마다 다른 제목/설명이 있어야 색인이 붙는다
  const baked = wasBaked(`/agency/${decoded}`)

  useEffect(() => {
    if (a === undefined) return
    // ⚠️ 미리 구운 페이지인데 자료를 못 받았다면(크롤러가 /data/ 를 못 읽는 경우 등)
    //    이미 박혀 있는 제목·설명을 지우지 않고 noindex 도 걸지 않습니다.
    //    «못 받은 것» 과 «없는 것» 은 다릅니다.
    if (!a && baked) return
    const title = a
      ? `${decoded} 입찰 낙찰 분석 — 평균 투찰률 ${pct(a.s?.avg, 2)} | K-건설맵`
      : `${decoded} | K-건설맵`
    const desc = a
      ? `${decoded}의 최근 ${num(a.n)}건 낙찰 데이터 분석. 평균 투찰률 ${pct(a.s?.avg, 2)}, 최다 낙찰 구간과 주요 낙찰 업체를 확인하세요.`
      : '발주기관 낙찰 데이터 분석'
    document.title = title
    setMeta('description', desc)
    setProp('og:title', title)
    setProp('og:description', desc)
    setLink('canonical', `${location.origin}/agency/${encodeURIComponent(decoded)}`)
    // 데이터가 없는 기관 페이지는 색인에서 빼서 soft 404 를 막는다
    setMeta('robots', a ? null : 'noindex')
    return () => setMeta('robots', null)
  }, [a, decoded, baked])

  if (a === undefined) return <div style={{ paddingTop: 14 }}><Skeleton n={3} /></div>
  if (!a) {
    return (
      <Empty icon={baked ? '📡' : '🔍'}>
        {baked
          ? <>자료를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.<br /></>
          : <>«{decoded}» 의 분석 데이터가 없습니다.<br /></>}
        <Link to="/analysis" style={{ color: 'var(--accent)', fontWeight: 700 }}>분석 탭에서 검색해보세요 →</Link>
      </Empty>
    )
  }

  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}>
        <Link to="/analysis" className="btn ghost sm">← 다른 기관 찾기</Link>
        <ShareBtn />
      </div>
      <AgencyReport name={decoded} a={a} />
      <div className="btn-row" style={{ marginTop: 10 }}>
        <Link className="btn" to="/calc" style={{ flex: 1 }}>💰 바로투찰 열기 →</Link>
      </div>
    </>
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
