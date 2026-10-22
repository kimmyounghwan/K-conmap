/* 🧮 지분 짜기 — 공동도급 마당(G341 · 2026-10-20)
 *   구성원(우리 회사 + 4곳까지) · 지역 · 지분 · 시평액 → 검사(구성원 수 · 최소 지분 · 지역의무 지분 · 합 100%) ·
 *   각자 몫(투찰 금액 × 지분) · 시평액 합산(공동이행 = 구성원 모두 합산).
 *   셈은 lib/공동판.js 한 곳 · 기준은 계약예규 공동계약운용요령 제9조(머리말) — «공고서 기준이 우선».
 *   적은 것은 이 탭에만(sessionStorage · 공고마다) — 다른 화면에 갔다 와도 남고, 탭을 닫으면 지워집니다.
 * ■ 숨은 누적: |공동|지분짜기(처음 고칠 때 한 번)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 기본규칙, 지분검사, 몫나누기, 시평합, 억만 } from './lib/공동판.js'
import { REGIONS, won } from './lib/fmt.js'
import { 세기 } from './lib/받은수.jsx'

const 시도들 = REGIONS.filter((x) => x !== '전국')
const 억 = (v) => { const n = Number(String(v || '').replace(/[^0-9.]/g, '')); return n > 0 ? Math.round(n * 1e8) : 0 }

export default function 공동판짜기({ r, 권장금액 = 0, 명함 = {} }) {
  const 열쇠 = 'kcm.jv.split.' + String(r.no || '')
  const 규칙0 = useMemo(() => 기본규칙(r), [r])
  const 처음 = () => {
    try { const v = JSON.parse(sessionStorage.getItem(열쇠) || 'null'); if (v && Array.isArray(v.줄)) return v } catch (e) { /* 없음 */ }
    const 의무 = 규칙0.의무시도 || []
    const 우리 = { co: 명함.co || '우리 회사', rgn: 명함.rgn || '', share: '', sipy: 명함.sipy || '' }
    const 짝 = { co: '', rgn: 의무.length && !의무.includes(우리.rgn) ? 의무[0] : '', share: '', sipy: '' }
    if (규칙0.의무지분 > 0 && 짝.rgn) { 짝.share = String(규칙0.의무지분); 우리.share = String(100 - 규칙0.의무지분) }
    else { 우리.share = '51'; 짝.share = '49' }
    return { 줄: [우리, 짝], 최대: 규칙0.최대, 최소: 규칙0.최소, 의무지분: 규칙0.의무지분, 금액: '' }
  }
  const [s, setS] = useState(처음)
  const 셈 = useRef(false)
  useEffect(() => { try { sessionStorage.setItem(열쇠, JSON.stringify(s)) } catch (e) { /* 사생활 창 */ } }, [s, 열쇠])
  const 고침 = (f) => { setS(f); if (!셈.current) { 셈.current = true; 세기('|공동|지분짜기') } }
  const 줄고침 = (i, k, v) => 고침((o) => ({ ...o, 줄: o.줄.map((m, j) => (j === i ? { ...m, [k]: v } : m)) }))
  const 규칙 = { ...규칙0, 최대: Number(s.최대) || 규칙0.최대, 최소: Number(s.최소) >= 0 ? Number(s.최소) : 규칙0.최소, 의무지분: Number(s.의무지분) || 0 }
  const 검 = 지분검사(s.줄, 규칙)
  const 금액 = 억(s.금액) || Number(권장금액) || 0
  const 몫 = 몫나누기(금액, s.줄)
  const 시평 = 시평합(s.줄.map((m) => ({ ...m, sipy: 억(m.sipy) })))     /* 칸은 «억» · 셈은 원 */
  const 의무 = 규칙.의무시도 || []

  return (
    <div className="gd-split">
      <div className="gd-h">🧮 지분 짜기 <span className="muted">— 구성원 · 지분을 적으면 협정이 되는지 바로 봅니다</span></div>
      <div className="gd-rule">
        <label>구성원 <input className="inp" inputMode="numeric" value={s.최대} onChange={(e) => 고침((o) => ({ ...o, 최대: e.target.value.replace(/[^0-9]/g, '') }))} /> 곳 이하</label>
        <label>구성원마다 <input className="inp" inputMode="numeric" value={s.최소} onChange={(e) => 고침((o) => ({ ...o, 최소: e.target.value.replace(/[^0-9]/g, '') }))} /> % 이상</label>
        {의무.length > 0 && (
          <label>{의무.join('·')} 업체 합 <input className="inp" inputMode="numeric" value={s.의무지분} onChange={(e) => 고침((o) => ({ ...o, 의무지분: e.target.value.replace(/[^0-9]/g, '') }))} /> % 이상</label>
        )}
        <span className="muted sm">처음 값 = {규칙0.큰 ? '추정가격 1,000억 넘는 공사(10곳 · 5%)' : '보통 기준(5곳 · 10%)'}{규칙0.의무지분 ? ` · 공고의 지역의무 지분 ${규칙0.의무지분}%` : ''} — 공고서와 다르면 고치세요.</span>
      </div>
      <div className="gd-tbl" role="table" aria-label="구성원">
        <div className="gd-tr gd-th" role="row"><span>회사</span><span>지역</span><span>지분 %</span><span>시평액(억)</span><span>몫</span><span /></div>
        {s.줄.map((m, i) => (
          <div className="gd-tr" role="row" key={i}>
            <input className="inp" aria-label={`${i + 1}번째 회사`} value={m.co} maxLength={40} placeholder={i === 0 ? '대표사(우리 회사)' : '구성원'} onChange={(e) => 줄고침(i, 'co', e.target.value)} />
            <select className="inp" aria-label={`${i + 1}번째 지역`} value={m.rgn} onChange={(e) => 줄고침(i, 'rgn', e.target.value)}>
              <option value="">지역</option>
              {시도들.map((x) => <option key={x} value={x}>{x}{의무.includes(x) ? ' ★' : ''}</option>)}
            </select>
            {/* 📱 G368 폰 — 칸 이름(머리줄)이 숨어 지분 · 시평액이 무슨 칸인지 몰랐고, 시평액 칸이 22px 로 눌려 «35.5» 가 «5» 로 보였음 → 칸마다 작은 이름(폰에서만) */}
            <label className="gd-f"><i className="gd-fl">지분 %</i><input className="inp num" aria-label={`${i + 1}번째 지분`} inputMode="decimal" value={m.share} placeholder="0" onChange={(e) => 줄고침(i, 'share', e.target.value.replace(/[^0-9.]/g, '').slice(0, 5))} /></label>
            <label className="gd-f"><i className="gd-fl">시평액(억)</i><input className="inp num" aria-label={`${i + 1}번째 시평액`} inputMode="decimal" value={m.sipy} placeholder="—" onChange={(e) => 줄고침(i, 'sipy', e.target.value.replace(/[^0-9.]/g, '').slice(0, 8))} /></label>
            <span className="gd-mok" title={몫[i] > 0 ? won(몫[i]) : ''}>{몫[i] > 0 ? 억만(몫[i]) : '—'}</span>
            {s.줄.length > 2
              ? <button type="button" className="lnk" aria-label={`${i + 1}번째 빼기`} onClick={() => 고침((o) => ({ ...o, 줄: o.줄.filter((_, j) => j !== i) }))}>✕</button>
              : <span />}
          </div>
        ))}
      </div>
      <div className="gd-row">
        {s.줄.length < Math.max(2, 규칙.최대) && (
          <button type="button" className="btn ghost sm" onClick={() => 고침((o) => ({ ...o, 줄: [...o.줄, { co: '', rgn: '', share: '', sipy: '' }] }))}>＋ 구성원 더하기</button>
        )}
        <span className="muted sm">지분 합 <b className={Math.abs(검.합 - 100) < 0.001 ? 'ok' : 'bad'}>{검.합}%</b>
          {검.의무합 != null ? <> · {의무.join('·')} 업체 <b>{검.의무합}%</b></> : null}</span>
      </div>
      <div className={'gd-verdict ' + (검.ok ? 'ok' : 'bad')}>
        {검.ok ? '✅ 이 짜임이면 협정 기준에 맞습니다.' : <>⚠️ 이대로는 협정이 안 됩니다<ul>{검.문제.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
      </div>
      <div className="gd-kv">
        <div><span>몫을 나눌 금액</span>
          <b>{금액 > 0 ? won(금액) : '—'}</b>
          <input className="inp" inputMode="decimal" value={s.금액} placeholder={권장금액 > 0 ? '권장 금액 그대로 · 억 단위로 바꿔 넣기' : '억 단위로 넣기 (예: 6.1)'}
            onChange={(e) => 고침((o) => ({ ...o, 금액: e.target.value.replace(/[^0-9.]/g, '').slice(0, 8) }))} /></div>
        <div><span>시평액 합산(공동이행)</span><b>{시평.합 > 0 ? `${(시평.합 / 1e8).toFixed(1).replace(/\.0$/, '')}억` : '—'}</b>
          <em className="muted sm">{시평.빈 ? `시평액을 안 적은 구성원 ${시평.빈}곳` : '구성원 모두의 것을 합산합니다'}</em></div>
      </div>
      <ul className="gd-notes">{검.알림.map((x, i) => <li key={i}>{x}</li>)}
        <li>몫은 «금액 × 지분» 어림입니다. 실제 대가는 협정서 지분과 계약서로 정해집니다.</li>
      </ul>
    </div>
  )
}
