/* 📣 곧 나올 공사로 가는 한 줄 — 공고판(/live) 맨 위 · 바로투찰 첫 화면 (2026-10-05 · G135)
   소장님이 고른 자리(클로드 추천 ①): 하단 탭을 늘리지 않고 공고 탭 안에 «한 줄» → /pre
   · 작은 파일(/data/pre/idx.json) 하나만 받습니다. 자료가 아직 없으면 아무것도 그리지 않습니다.
   · 지역을 골라 두었으면(kcm_region) 그 지역 건수를 먼저 적습니다.
   · ⭐ 담아 둔 공사가 공고로 나왔으면 그 줄이 먼저 — 누르면 바로투찰(그 공고).
   kind="got" — 바로투찰 첫 화면용: «나온 담은 것» 이 있을 때만 그립니다(없으면 아무것도 안 그림). */
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { num } from './lib/fmt.js'
import { loadRegion } from './lib/lic.js'
import { 받기목록, 담은것, 나온담은것, 기관것, 억 } from './lib/곧나올.js'

export default function 곧나올줄({ kind = 'live' }) {
  const [idx, setIdx] = useState(null)
  useEffect(() => {
    let 살아 = true
    받기목록().then((v) => { if (살아) setIdx(v || null) }).catch(() => {})
    return () => { 살아 = false }
  }, [])
  if (!idx || !idx.all) return null
  const 나온 = 나온담은것(담은것(), idx)
  const 지역 = loadRegion()
  const 내 = 지역 && 지역 !== '전국' && idx.n ? idx.n[지역] : null
  const 줄들 = []
  if (나온.length) {
    const x = 나온[0]
    줄들.push(
      <Link key="got" to={`/?no=${encodeURIComponent(x.no)}`} className="xlink pre-xgot">
        <span className="xl-i">⭐</span>
        <span className="xl-t"><b>담아 둔 공사 {num(나온.length)}건이 공고로 나왔습니다</b>
          <i>{x.nm}{나온.length > 1 ? ` 외 ${나온.length - 1}건` : ''}</i></span>
        <span className="xl-go">바로투찰 →</span>
      </Link>,
    )
  }
  if (kind === 'got') return 줄들.length ? <>{줄들}</> : null
  if (!(idx.all[0] > 0)) return 줄들.length ? <>{줄들}</> : null
  const [전체, 직전] = 내 || idx.all
  줄들.push(
    <Link key="pre" to="/pre" className="xlink">
      <span className="xl-i">📣</span>
      <span className="xl-t"><b>곧 나올 공사 {내 ? `${지역} ` : ''}{num(전체)}건</b>
        <i>공고 직전(사전규격) {num(직전)}건 · 발주계획 — 공고 뜨기 전에 미리</i></span>
      <span className="xl-go">보기 →</span>
    </Link>,
  )
  return <>{줄들}</>
}

/** 🏛 기관 화면 «이 기관이 낼 공사» — /data/pre/ag/{통}.json (몇 KB) · 없으면 아무것도 안 그림 */
export function 기관낼공사({ name }) {
  const [줄, set줄] = useState(null)
  useEffect(() => {
    let 살아 = true
    set줄(null)
    기관것(name).then((v) => { if (살아) set줄(v || []) }).catch(() => { if (살아) set줄([]) })
    return () => { 살아 = false }
  }, [name])
  if (!줄 || !줄.length) return null
  return (
    <div className="card pre-ag">
      <div className="detail-h">📣 이 기관이 낼 공사 <span className="xmut">· 발주계획 · 사전규격 {num(줄.length)}건</span></div>
      {줄.map(([id, nm, 때, 금, k, st, no]) => (
        <div key={id} className="pre-agr">
          <span className={'pre-k ' + (k === 's' ? 's' : 'p')}>{k === 's' ? '📝' : '📋'}</span>
          <span className="nm">{nm}</span>
          <span className="w">{k === 's' ? `의견 마감 ${String(때).slice(5).replace('-', '.')}` : 때 ? `${Number(String(때).slice(4, 6))}월 예정` : ''}</span>
          <b className="a">{억(금)}</b>
          {st === 'o' && no ? <Link to={`/?no=${encodeURIComponent(no)}`} className="go">✅ 바로투찰</Link> : null}
        </div>
      ))}
      <div className="note sm">계획은 시기 · 금액이 바뀌거나 취소될 수 있습니다. <Link to="/pre">곧 나올 공사 전체 →</Link></div>
    </div>
  )
}
