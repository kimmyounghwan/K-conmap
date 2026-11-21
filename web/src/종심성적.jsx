/**
 * 📊 G816 (2026-11-21) 종심제 균형가격 예상 — 성적표(종심 카드 ① 아래 «📊 성적표» 를 열 때만 받음 · 따로 한 장)
 *   소장님 11-21 「만들 수 있는 건 다 만들어」(아이디어 ③ 종심 성적표 공개 — 믿을 수 있는지 직접 보게) ·
 *   「타사이트와 구별되지만 정확하면서 설명도 논리적이어야 해」
 *   자료: /data/jongsim_score.json(종심예측.py 성적판) — 지난 3개월 종심 개찰마다 «그날 앞 자료로만» 셈한 예상 범위 · 실제 균형가격(근사)
 *   ① 갈래마다 범위 적중(그 갈래가 쓰는 구간 — 짧은 · 고른) · 평균 폭 · 예상 열림
 *   ② 갈래마다 «기준» 금액 점수 맞춰 보기 — lib/종심고르기.js 점수맞춰보기(카드와 같은 셈 · 그 개찰 하나만 빼고 나머지 어긋남으로)
 *   ③ 개찰마다 한 줄(새것부터 12줄 · «더 보기») — 날 · 갈래 · 예상 범위 · 실제 · 들었나 · 작은 띠
 *   ⚠️ 공고번호 · 공사명 · 업체 이름은 화면에 안 씀(날 · 갈래 · 비율뿐) · «낙찰 보장» 같은 말 안 씀
 *   시험: tools/시험_종심성적화면.mjs
 */
import { useEffect, useMemo, useState } from 'react'
import { getJSON } from './lib/data.js'
import { 갈래글, 점수맞춰보기 } from './lib/종심고르기.js'
import { 세기 } from './lib/받은수.jsx'

const 퍼 = (v, n = 2) => (v == null || !Number.isFinite(Number(v)) ? '-' : `${Number(v).toFixed(n)}%`)
const 날짧게 = (d) => String(d || '').slice(5, 10).replace('-', '.')

/** 개찰 한 줄의 예상 범위 — 그 갈래가 쓰는 구간(짧은 → sa ~ sb · 고른 → lo ~ hi) · 들었나 */
function 줄범위(a, 구간) {
  return 구간 === '짧은' && a[9] != null && a[10] != null ? { 아래: a[9], 위: a[10], 든: !!a[11] } : { 아래: a[3], 위: a[5], 든: !!a[7] }
}

function 작은띠({ 아래, 위, 실제, 든 }) {
  const lo = Math.min(아래, 실제) - 1.5, hi = Math.max(위, 실제) + 1.5
  const x = (p) => `${Math.max(0, Math.min(100, ((p - lo) * 100) / (hi - lo)))}%`
  return (
    <div className="jss-bar" aria-hidden="true">
      <i style={{ left: x(아래), width: `calc(${x(위)} - ${x(아래)})` }} />
      <b className={든 ? '' : 'out'} style={{ left: x(실제) }} />
    </div>
  )
}

export default function 종심성적({ 갈 = '' }) {
  const [판, set판] = useState(undefined)
  const [다, set다] = useState(false)
  useEffect(() => {
    let 살 = true
    세기('|종심카드|성적표')
    getJSON('/data/jongsim_score.json').then((v) => { if (살) set판(v || null) }).catch(() => { if (살) set판(null) })
    return () => { 살 = false }
  }, [])
  const 점 = useMemo(() => (판 && Array.isArray(판.줄) ? 점수맞춰보기(판.줄) : {}), [판])
  if (판 === undefined) return <div className="note sm">성적표를 불러오는 중…</div>
  if (!판 || !판.n || !Array.isArray(판.줄)) return <div className="note sm">성적표 자료를 모으는 중입니다 — 지난 개찰이 모이면 저절로 뜹니다.</div>
  const 갈들 = Object.entries(판.갈래 || {}).sort((a, b) => (b[0] === 갈) - (a[0] === 갈) || b[1].n - a[1].n)
  const 보임 = new Set(판.갈래보임 || [])
  const 첫 = 판.줄.length ? 판.줄[0][1] : '', 끝 = 판.줄.length ? 판.줄[판.줄.length - 1][1] : ''
  const 줄 = [...판.줄].reverse()
  const 보일줄 = 다 ? 줄 : 줄.slice(0, 12)
  return (
    <div className="jss">
      <div className="note sm">건설맵이 지난 3개월({첫} ~ {끝}) 종심 개찰 <b>{판.n}건</b>을 개찰날마다 <b>그날 앞 자료로만</b> 예상해 실제 균형가격과 맞춰 본 기록입니다.</div>
      {갈들.map(([k, g]) => {
        const s = 점[k]
        const 짧 = g.구간 === '짧은'
        return (
          <div key={k} className={'jss-g' + (k === 갈 ? ' on' : '')}>
            <div className="jss-h"><b>{갈래글[k] || k}</b> <span className={'jss-tag' + (보임.has(k) ? ' open' : '')}>{보임.has(k) ? '예상 열림' : '예상 닫힘(참고만)'}</span></div>
            <div className="jss-l">범위({짧 ? '80%가 든 가장 좁은 범위' : '위 · 아래 5%씩 뺀 범위'}) — <b>{g.n}건 중 {g.적중}건</b> 들어맞음({g.율}%) · 평균 폭 {Number(g.폭).toFixed(2)}%p</div>
            {s && s.n > 0 && (
              <div className="jss-l">기준 금액 가격점수 — 기대 평균 <b>{s.기대.toFixed(1)}점</b> · 실제 평균 <b>{s.실제.toFixed(1)}점</b>
                {' '}· 0점 위험 셈 {Math.round(s.영셈 * 100)}% · 실제 0점 {s.영실}/{s.n}건{s.아n > 0 ? ` · 열에 아홉 맞음 ${s.아맞}/${s.아n}건` : ''}</div>
            )}
          </div>
        )
      })}
      <div className="jss-rows" role="list">
        {보일줄.map((a, i) => {
          const 구간 = ((판.갈래 || {})[a[2]] || {}).구간
          const r = 줄범위(a, 구간)
          return (
            <div key={i} className="jss-row" role="listitem">
              <span className="d">{날짧게(a[1])}</span>
              <span className="k">{갈래글[a[2]] || a[2]}</span>
              <span className="r">예상 {퍼(r.아래, 1)} ~ {퍼(r.위, 1)}</span>
              <span className={'a' + (r.든 ? '' : ' out')}>실제 {퍼(a[6])} {r.든 ? '✓' : '✗'}</span>
              <작은띠 아래={r.아래} 위={r.위} 실제={a[6]} 든={r.든} />
            </div>
          )
        })}
      </div>
      {!다 && 줄.length > 12 && <button type="button" className="btn ghost jss-more" onClick={() => set다(true)}>더 보기 ({줄.length}건)</button>}
      <div className="note sm">· 범위 = 개찰날 앞 개찰로만 셈한 예상(그날 · 뒷날 자료는 안 섞음) · 점수 = 그 개찰 하나만 빼고 나머지 어긋남으로 카드와 같은 셈 ·
        균형가격 · 예정가격은 나라장터에 공개된 업체별 금액으로 다시 셈한 근사값(공개된 간이형 균형가격 55건과 대조해 54건 1원까지 같음 · 1건 1원 차이) · 갈래마다 맞춰 본 개찰 15건 이상 · 75% 넘으면 «예상» 을 열고 70% 밑으로 떨어지면 닫습니다.</div>
    </div>
  )
}
