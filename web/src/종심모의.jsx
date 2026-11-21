/**
 * 🎲 G817 (2026-11-21) 종심제 «모의 개찰» — 종심 카드 ② 내 금액 아래 «🎲 모의 개찰» 을 누를 때만(이 조각 · /data/jongsim_bids.json 받음)
 *   소장님 11-21 「만들 수 있는 건 다 만들어」(아이디어 ① 모의 개찰 — 내 금액을 지난 비슷한 공고의 실제 업체 금액들 속에 넣어 «몇 등 · 가격점수 몇 점»)
 *   셈: lib/종심모의.js 모의개찰(같은 갈래 · 새것부터 30건 · 내 금액을 넣으면 균형가격도 다시 셈 · 예정가격 넘으면 무효 · 같은 점수 같은 등수)
 *   ⚠️ 가격점수만으로 줄 세움 — 화면에 그렇게 적음 · 업체 이름 없음 · «낙찰 보장» 같은 말 안 씀
 *   ⚠️ 5건이 안 되면 «모으는 중(지금 N건)» · 5 ~ 9건이면 «아직 N건뿐 — 참고만» 한 줄(몇 건으로 평균 · 등수를 말하면 틀리기 쉬움)
 *   시험: tools/시험_종심모의.mjs(셈) · tools/시험_종심모의화면.mjs(화면)
 */
import { useEffect, useMemo, useState } from 'react'
import { getJSON } from './lib/data.js'
import { 모의개찰 } from './lib/종심모의.js'
import { 세기 } from './lib/받은수.jsx'

const 퍼 = (v, n = 3) => (v == null || !Number.isFinite(Number(v)) ? '-' : `${Number(v).toFixed(n)}%`)
const 점1 = (v) => (v == null || !Number.isFinite(Number(v)) ? '-' : Number(v).toFixed(1))
const 점3 = (v) => (v == null || !Number.isFinite(Number(v)) ? '-' : Number(v).toFixed(3))
const 날짧게 = (d) => String(d || '').slice(5, 10).replace('-', '.')

export const 모의최소 = 5, 모의넉넉 = 10

export default function 종심모의({ 거름, 율, 갈이름 = '', 묶음글 = '' }) {
  const [표, set표] = useState(undefined)
  const [다, set다] = useState(false)
  useEffect(() => {
    let 살 = true
    세기('|종심카드|모의개찰')
    getJSON('/data/jongsim_bids.json').then((v) => { if (살) set표(v || null) }).catch(() => { if (살) set표(null) })
    return () => { 살 = false }
  }, [])
  const 모 = useMemo(() => (표 ? 모의개찰(표, 거름, 율) : null), [표, 거름, 율])
  if (표 === undefined) return <div className="note sm">지난 개찰 업체 금액을 불러오는 중…</div>
  if (!모 || 모.n < 모의최소) return <div className="note sm">모의 개찰 자료(지난 {갈이름} 개찰의 업체 금액)를 모으는 중입니다{모 && 모.n ? ` — 지금 ${모.n}건(${모의최소}건부터 보여 드립니다)` : ''} · 모이면 저절로 뜹니다.</div>
  const 보일 = 다 ? 모.결과 : 모.결과.slice(0, 8)
  return (
    <div className="jsm">
      <div className="jsm-h">지난 {모.넓힘 || !묶음글 ? 갈이름 : 묶음글} 개찰 <b>{모.n}건</b>{모.넓힘 && 묶음글 ? `(${묶음글} 은 자료가 모자라 ${갈이름} 전체)` : ''}에 내 금액(기초의 <b>{퍼(율)}</b>)을 넣어 보면</div>
      {모.n < 모의넉넉 && <div className="note sm jsm-thin">⚠️ 아직 {모.n}건뿐이라 참고만 하세요 — 자료가 모이면 저절로 늘어납니다.</div>}
      <div className="kv2 jsm-sum">
        <div><span>내 가격점수 평균</span><b>{점1(모.평균)}점</b></div>
        <div><span>그 공고들 1등 평균</span><b>{점1(모.일평균)}점</b></div>
        <div><span>가격점수 1등</span><b>{모.일등}번</b></div>
        <div><span>3등 안</span><b>{모.삼등}번</b></div>
        <div><span>상위 10% 안</span><b>{모.십분}번</b></div>
        {모.영 > 0 && <div><span>0점</span><b>{모.영}번</b></div>}
        {모.무효 > 0 && <div><span>예정가격 넘음(무효)</span><b>{모.무효}번</b></div>}
      </div>
      <div className="jsm-rows" role="list">
        {보일.map((x) => (
          <div key={x.no} className="jsm-row" role="listitem">
            <span className="d">{날짧게(x.dt)}</span>
            <span className="n">참여 {x.n}곳</span>
            <span className={'s' + (x.내 == null ? ' out' : x.등 === 1 ? ' top' : '')}>{x.내 == null ? '예정가격 넘음(무효)' : `${x.등}등 · ${점3(x.내)}점`}</span>
            <span className="t">1등 {점3(x.일)}점</span>
          </div>
        ))}
      </div>
      {!다 && 모.결과.length > 8 && <button type="button" className="btn ghost jsm-more" onClick={() => set다(true)}>더 보기 ({모.결과.length}건)</button>}
      <div className="note sm">가격점수만으로 줄 세운 것입니다 — 실제 낙찰은 공사수행능력 · 사회적책임 점수를 더하고, 같으면 계약예규 제13조②로 정합니다.
        «지난 비슷한 개찰» = 위 ① 예상과 같은 묶음의 최근 개찰(30건까지) · 내 금액을 넣으면 그 공고의 균형가격도 다시 셈합니다 · 같은 점수는 같은 등수 · 업체 금액은 나라장터에 공개된 금액(내역서 불일치 · 99.7% · 노무비 80% 같은 빼기는 알 수 없어 균형가격 · 예정가격은 근사값).</div>
    </div>
  )
}
