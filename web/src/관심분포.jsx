/**
 * 👥 개찰 뒤 — «건설맵 이용자들이 고른 자리 vs 이번 1순위 자리» (G499 · 2026-11-01 · lib/관심도.js 머리말)
 *   마감 전에 남긴 분위(화면에선 못 읽음)를 깃허브 30분 작업이 마감 뒤 묶어 fresh/bcq 로 공개한 것만 보입니다.
 *   3명 미만이면 자리는 안 보이고 «본 사람 수» 만(한 사람의 자리가 드러나지 않게).
 */
import { useEffect, useMemo, useState } from 'react'
import { 자리묶음읽기, 자리나눔 } from './lib/관심도.js'
import { 개찰자리 } from './lib/개찰복기.js'
import { 세기 } from './lib/받은수.jsx'

export default function 관심분포({ r, p50 }) {
  const [묶, set묶] = useState(undefined)
  useEffect(() => {
    let 살 = true
    set묶(undefined)
    if (r && r.no) 자리묶음읽기(r.no).then((v) => { if (살) set묶(v) }).catch(() => { if (살) set묶(null) })
    return () => { 살 = false }
  }, [r && r.no])   // eslint-disable-line react-hooks/exhaustive-deps
  const 자리 = useMemo(() => { try { return 개찰자리(r, p50) } catch (e) { return null } }, [r, p50])
  const 나 = useMemo(() => (묶 ? 자리나눔(묶, 자리) : null), [묶, 자리])
  useEffect(() => { if (나 && 나.n >= 3) 세기('|관심도|개찰뒤') }, [나 && 나.n])   // eslint-disable-line react-hooks/exhaustive-deps
  if (!묶 || !나) return null
  const np = Number(r && r.np) || 0
  if (나.n < 3) {
    if (!(Number(묶.p) > 0)) return null
    return <div className="bcd bcd-small">👥 건설맵에서 이 공고 금액을 본 사람 <b>{Number(묶.p).toLocaleString('ko-KR')}명</b>{np ? <> · 실제 참가 {np.toLocaleString('ko-KR')}곳</> : null}</div>
  }
  const 큰 = Math.max(1, ...나.막대)
  return (
    <div className="bcd">
      <div className="bcd-h">👥 건설맵 이용자 <b>{나.n.toLocaleString('ko-KR')}명</b>이 고른 자리 <span className="muted">— 마감 전에 고른 금액의 분위(마감 뒤 공개)</span></div>
      <div className="bcd-bars" role="img" aria-label={`분위 막대 20칸 — 실격 ${나.실격}명 · 1순위 자리 ${나.일순}명 · 밀림 ${나.밀림}명`}>
        {나.막대.map((m, i) => {
          const 가운데 = i * 5 + 2.5
          const 쪽 = !자리 ? '' : 가운데 < 자리.실격선 ? ' dq' : 가운데 <= 자리.일순끝 + 2.5 && i * 5 + 5 > 자리.실격선 ? ' win' : ' up'
          return <i key={i} className={'bcd-b' + 쪽} style={{ height: `${m ? Math.max(8, (m / 큰) * 100) : 0}%` }} title={`${i * 5}~${i * 5 + 5}분위 ${m}명`} />
        })}
        {자리 && <b className="bcd-line" style={{ left: `${자리.실격선}%` }} title={`실격선 ${Math.round(자리.실격선)}분위`} />}
      </div>
      <div className="bcd-axis muted"><span>0분위</span><span>50</span><span>100분위</span></div>
      {자리 ? (
        <div className="bcd-sum">이번 실격선 <b>{Math.round(자리.실격선)}분위</b> · 1순위 자리 {자리.폭 < 0.05 ? '실격선 바로 위' : `${Math.round(자리.실격선)}~${Math.round(자리.일순끝)}분위`} —
          {' '}실격 <b>{나.실격}</b> · 1순위 자리 <b>{나.일순}</b> · 밀림 <b>{나.밀림}</b>명{Number(묶.p) > 나.n ? <span className="muted"> (본 사람 {Number(묶.p).toLocaleString('ko-KR')}명)</span> : null}{np ? <span className="muted"> · 실제 참가 {np.toLocaleString('ko-KR')}곳</span> : null}</div>
      ) : <div className="bcd-sum muted">이 개찰은 하한율 · 기초금액을 몰라 실격선을 그리지 못했습니다.</div>}
    </div>
  )
}
