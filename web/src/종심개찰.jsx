/**
 * 🏛 G813 (2026-11-21) 종심제 · 종합평가 «개찰 뒤» — 실제 균형가격(근사) · 내 금액의 가격점수 · 개찰 1순위 금액의 가격점수
 *   소장님 「종심제 오늘중 마무리 할 것」 — 계획 ② 「개찰 뒤 실제 균형가격」(공고 한 장 · 1순위 펼침 · 바로투찰 개찰 뒤).
 *   자료: /data/jongsim_open.json(종심예측.py 개찰표 — 공고번호 → [개찰일시, 갈래, 배점, 기초, 균형, 예정, 받은 수, 빼기 뒤 수]) — 이 공고가 없으면 아무것도 안 그림.
 *   점수 식: lib/종심셈.js 종심가격점수(바로투찰 «🏛 종심제 계산» 카드와 같은 식 · 예규 [별표 3] · 조달청 [별표 4]).
 *   ⚠️ 균형가격 · 예정가격은 «건설맵이 공개 금액으로 다시 셈한 근사값» — 화면에도 그렇게 적음 · 업체 이름은 이 자료에 없음.
 *   시험: tools/시험_종심개찰화면.mjs
 */
import { useEffect, useState } from 'react'
import { getJSON } from './lib/data.js'
import { won } from './lib/fmt.js'
import { 금액뿐 } from './lib/금액읽기.js'
import { 종심가격점수 } from './lib/종심셈.js'
import { 갈래글 } from './lib/종심고르기.js'
import { 세기 } from './lib/받은수.jsx'

const 퍼 = (v, n = 2) => `${Number(v).toFixed(n)}%`
const 점 = (v) => (v == null ? '—' : Number(v).toFixed(3))

/** 이 공고의 개찰 뒤 줄 → { dt, kind, pt, base, bal, yp, n0, n1 } | null */
export function 개찰줄(표, no) {
  const a = 표 && 표.공고 && 표.공고[String(no || '')]
  if (!Array.isArray(a) || !(a[3] > 0) || !(a[4] > 0)) return null
  return { dt: a[0], kind: a[1], pt: Number(a[2]) || 50, base: a[3], bal: a[4], yp: a[5] > 0 ? a[5] : null, n0: a[6] || 0, n1: a[7] || 0 }
}

export default function 종심개찰({ no, amt = 0, 곳 = '' }) {
  const [표, set표] = useState(undefined)
  const [내, set내] = useState('')
  useEffect(() => {
    let 살 = true
    getJSON('/data/jongsim_open.json').then((v) => { if (살) set표(v || null) }).catch(() => { if (살) set표(null) })
    return () => { 살 = false }
  }, [])
  const g = 개찰줄(표, no)
  useEffect(() => { if (g) 세기('|종심개찰|봄' + (곳 ? '-' + 곳 : '')) }, [!!g])   // eslint-disable-line react-hooks/exhaustive-deps
  if (!g) return null
  const 셈 = (T) => (g.yp && T > 0 ? 종심가격점수(T, g.bal, g.yp, g.pt) : null)
  const 내금 = 금액뿐(내) || 0
  const 내점 = 셈(내금)
  const 일점 = 셈(Number(amt) || 0)
  const 차 = 내금 > 0 ? 내금 - g.bal : 0
  return (
    <div className="card jsc jsc-open">
      <div className="detail-h">🏛 종심제 개찰 — 실제 균형가격 <span className="jsc-tag">{갈래글[g.kind] || g.kind} · 가격 {g.pt}점</span></div>
      <div className="kv2">
        <div><span>균형가격</span><b>{won(g.bal)} <small>(근사)</small></b></div>
        <div><span>기초 대비</span><b>{퍼((g.bal * 100) / g.base, 3)}</b></div>
        {g.yp && <div><span>예정 대비</span><b>{퍼((g.bal * 100) / g.yp, 3)}</b></div>}
        {g.n0 > 0 && <div><span>투찰 업체</span><b>{g.n0}곳{g.n1 > 0 && g.n1 !== g.n0 ? ` (빼기 뒤 ${g.n1}곳)` : ''}</b></div>}
      </div>
      {g.yp ? (
        <div className="jsc-box">
          <b>내 금액의 가격점수</b>
          <div className="jsc-inrow">
            <input className="inp" inputMode="numeric" value={내} onChange={(e) => set내(e.target.value)} placeholder={`예: ${Math.floor(g.bal / 1000) * 1000}`} aria-label="내 투찰 금액(개찰 뒤)" />
            <i>원</i>
          </div>
          {내금 > 0 && (
            <div className="jsc-me-row">
              기초금액의 <b>{퍼((내금 * 100) / g.base, 3)}</b> · 가격점수 <b>{점(내점)}</b>점 / {g.pt}점 · 균형가격보다 {won(Math.abs(차))} {차 > 0 ? '높음' : 차 < 0 ? '낮음' : '같음'}
            </div>
          )}
          {Number(amt) > 0 && <div className="note sm">개찰 1순위(가장 낮은 금액) {won(amt)} — 가격점수 {점(일점)}점 · 종심제는 가격점수와 공사수행능력 · 사회적책임 점수를 더해 낙찰자를 정합니다.</div>}
        </div>
      ) : null}
      <div className="note sm">균형가격 · 예정가격은 건설맵이 나라장터에 공개된 업체별 투찰 금액으로 다시 셈한 <b>근사값</b>입니다(내역서 불일치 · 99.7% · 노무비 80% 같은 빼기는 공개 자료로 알 수 없음 · 공개된 간이형 균형가격 55건과 대조해 54건 1원까지 같음 · 1건 1원 차이) · 가격점수 = √(1 − ((투찰 − 균형) ÷ (예정 − 균형))²) × 배점.</div>
    </div>
  )
}
