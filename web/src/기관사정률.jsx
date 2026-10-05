/* 🏛 이 기관 최근 사정률 — 공고 카드(펼친 칸) · 공고 한 건 화면(/notice/번호)이 같이 씁니다 (2026-09-30)
   소장님: 입찰나라에서 가져올 것 «공고 화면에 이 기관 최근 사정률» · 「편리성, 기능성 유지하면서」 · 「핸드폰에서도 편리하게」

   ■ 보여 주는 것
     · 작은 그림 하나 — 최근 8건(왼쪽이 옛것) · 100% 점선 · 가운데값 선. 폰 폭(360px)에 맞춰 그립니다.
     · 한 줄 풀이 — 「예정가격이 기초금액보다 0.18% 높게 정해지는 편입니다」 (숫자로 말할 수 있는 것만)
     · «건별 보기» 를 누르면 날짜 · 사정률 · 1순위 투찰률 · 참가 · 공고명
   ■ 편리함을 지키려고
     · 펼친 뒤에야 받습니다(몇 KB). 목록을 넘기는 사람은 아무것도 더 받지 않습니다.
     · 자료가 없으면 한 줄로만 적고 끝냅니다 — 빈 그림을 그리지 않습니다.
     · ⏳ 2026-10-05 — 「이 기관 아직 개찰 안 된 공고 N건 · 가장 이른 개찰 M.D HH:MM」 한 줄(입찰나라에 있는 것).
       자료는 빌드 때 실어 두고, 화면이 «지금» 보다 뒤인 것만 셉니다. 바로투찰(공고를 고른 뒤)에도 이 상자가 뜹니다.
   ⚠️ 사정률 = 예정가격 ÷ 기초금액. 1순위 금액 ÷ 투찰률로 예정가격을 거꾸로 셈한 값입니다(build_json «사정률 역산»).
      입찰나라처럼 공고문 글에서 숫자를 뽑지 않습니다. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 기관사정률받기, 날짜짧게, 세로범위, 풀이, 미개찰 } from './lib/기관사정률.js'

const W = 320, H = 104, L = 32, R = 20, T = 16, B = 18   /* R — 맨 오른쪽 값 글자(99.24)가 잘리지 않게 */

/** ⏳ 한 줄 — 미개찰이 없으면 아무것도 안 그립니다 */
function 대기줄({ p }) {
  const m = 미개찰(p)
  if (!m) return null
  return (
    <div className="sjr-wait">
      ⏳ 이 기관 아직 개찰 안 된 공고 <b>{m.n}건{m.넘침 ? ' 넘게' : ''}</b>
      <span> · 가장 이른 개찰 {m.첫}</span>
    </div>
  )
}

export default function 기관사정률({ inst }) {
  const [d, setD] = useState(undefined)
  const [표, set표] = useState(false)
  useEffect(() => {
    let 살아 = true
    setD(undefined)
    기관사정률받기(inst).then((v) => { if (살아) setD(v) }).catch(() => { if (살아) setD(null) })
    return () => { 살아 = false }
  }, [inst])

  if (!inst) return null
  if (d === undefined) {
    return (
      <div className="sjr">
        <div className="sjr-h">🏛 이 기관 최근 사정률</div>
        <div className="skel" style={{ height: 70 }} />
      </div>
    )
  }
  if (!d || !Array.isArray(d.c) || !d.c.length) {
    return (
      <div className="sjr none">
        🏛 <b>이 기관 최근 사정률</b> — 아직 셀 수 있는 개찰이 없습니다
        <i> (기초금액이 실린 2026년 4월 이후 개찰만 셉니다)</i>{' '}
        <Link to={`/agency/${encodeURIComponent(inst)}`} onClick={(e) => e.stopPropagation()}>기관 분석 →</Link>
        {d && <대기줄 p={d.p} />}
      </div>
    )
  }

  const 옛것부터 = [...d.c].reverse()
  const vals = 옛것부터.map((x) => x[1])
  const [y0, y1] = 세로범위([...vals, d.med])
  const n = 옛것부터.length
  const xOf = (i) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1))
  const yOf = (v) => T + ((y1 - v) * (H - T - B)) / (y1 - y0)
  const 선 = 옛것부터.map((x, i) => `${xOf(i).toFixed(1)},${yOf(x[1]).toFixed(1)}`).join(' ')
  const 눈금 = [y0, 100, y1].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="sjr" onClick={(e) => e.stopPropagation()}>
      <div className="sjr-h">
        🏛 이 기관 최근 사정률
        <span>· 가운데 <b>{d.med.toFixed(2)}%</b> · 개찰 {d.n}건{d.n > n ? ` 중 최근 ${n}건` : ''}</span>
      </div>
      <svg className="sjr-g" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`최근 ${n}건 사정률 — 가운데 ${d.med.toFixed(2)}%`}>
        {눈금.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={yOf(v)} y2={yOf(v)}
              className={v === 100 ? 'b100' : 'grid'} />
            <text x={L - 4} y={yOf(v) + 3.5} className="ax">{v === 100 ? '100' : v.toFixed(1)}</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={yOf(d.med)} y2={yOf(d.med)} className="med" />
        {n > 1 && <polyline points={선} className="ln" />}
        {옛것부터.map((x, i) => (
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(x[1])} r="3.2" className={x[1] >= 100 ? 'up' : 'dn'} />
            <text x={xOf(i)} y={yOf(x[1]) - 6} className="vl">{x[1].toFixed(2)}</text>
            <text x={xOf(i)} y={H - 4} className="dt">{날짜짧게(x[0])}</text>
          </g>
        ))}
      </svg>
      <div className="sjr-t">{풀이(d.med)}</div>
      <대기줄 p={d.p} />
      <div className="sjr-foot">
        <button type="button" className="lnk" onClick={() => set표((v) => !v)}>
          {표 ? '건별 접기 ▲' : '건별 보기 ▼'}
        </button>
        <Link to={`/agency/${encodeURIComponent(inst)}`}>이 기관 전체 분석 →</Link>
      </div>
      {표 && (
        <div className="sjr-list">
          {d.c.map((x, i) => (
            <div key={i} className="sjr-row">
              <span className="d">{날짜짧게(x[0])}</span>
              <b className={x[1] >= 100 ? 'up' : 'dn'}>{x[1].toFixed(3)}%</b>
              <span className="r">{x[2] != null ? `1순위 ${x[2].toFixed(3)}%` : ''}{x[3] ? ` · ${x[3]}곳` : ''}</span>
              <span className="nm">{x[4]}</span>
            </div>
          ))}
          <div className="note sm">
            사정률 = 예정가격 ÷ 기초금액. 1순위 금액과 투찰률로 예정가격을 거꾸로 셈했습니다 —
            기초금액이 실린 2026년 4월 이후 개찰만, 95~105% 밖은 자료 오류로 뺐습니다.
          </div>
        </div>
      )}
    </div>
  )
}
