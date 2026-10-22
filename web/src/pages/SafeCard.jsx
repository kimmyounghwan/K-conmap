/**
 * 🌏 /tools/safecard — 현장 다국어 안전카드 (2026-10-22)
 *
 * 소장님: 「현장 다국어 안전카드 … TBM, 안전수칙, 작업 지시를 중국어·베트남어·우즈벡어로 바로 바꿔 인쇄하게 … 이거 도구로 만들자.」
 *         「도구화 해서. 캡쳐 보여주고. 나에게 승인 받고 올려」
 * ■ 종이 셋: 🗣 TBM 카드(작업 전 안전점검회의 — 오늘 작업 · 위험 · 보호구 · 건강 · 비상 · 참석자 서명)
 *           📌 안전수칙(목록 한 장 · 또는 «표지» 한 장에 하나 — 산업안전보건법 제37조① 모국어 표지 옆에 붙이기)
 *           📋 작업 지시서(오늘 작업 · 장소 · 시간 · 주의할 것 · 확인 서명)
 * ■ 말: 한국어 + 중국어(간체) · 베트남어 · 우즈벡어 · 러시아어 · 영어 중 셋까지 한 장에.
 *   번역은 lib/안전카드.js 문장 사전(미리 번역 · 되번역 확인)만 — 직접 쓴 말은 번역하지 않고 «✍ 번역 안 됨» 을 종이에 적음.
 * ■ 저장: 이 브라우저(localStorage kcm.safecard.v1)만 · 서버로 보내는 것 없음.
 * ■ 셈(소장님 · 로봇 안 셈): |안전카드|인쇄TBM · 인쇄수칙 · 인쇄지시 · |안전카드|zh … (인쇄한 말) · |안전카드|예시 · |안전카드|추천.
 */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import * as S from '../lib/안전카드.js'
import { use인쇄 } from '../tools/공정인쇄.js'
import { 세기 } from '../lib/받은수.jsx'
import 도구설명 from '../tools/도구설명.jsx'

const 종류들 = [
  ['tbm', '🗣', 'TBM 카드', '작업 전 안전점검회의 — 오늘 작업 · 위험 · 보호구 · 건강 · 서명'],
  ['rule', '📌', '안전수칙', '현장에 붙이는 수칙 — 목록 한 장, 또는 한 장에 하나(표지 꼴)'],
  ['order', '📋', '작업 지시서', '오늘 작업 · 장소 · 시간 · 주의할 것 · 확인 서명'],
]
const 종류이름 = { tbm: 'TBM', rule: '수칙', order: '지시' }
/* 처음 고르기 좋은 묶음(«추천 넣기») — 종류마다 */
const 추천 = {
  tbm: ['t1', 't2', 't3', 't4', 't5', 'h1', 'h2', 'h3', 'p1', 'p2', 'p3', 'm2', 'm5'],
  rule: ['p1', 'p2', 'p3', 'f1', 'f2', 'f3', 'd1', 'e1', 'e3', 'c1', 'l1', 'r1', 'r4', 's1', 'n1', 'h3', 'm2'],
  order: ['o2', 'o3', 'o4', 'o5', 'o6', 'o8', 't4'],
}
const 칸들 = {
  tbm: [['date', '날짜', 'date'], ['time', '시간', 'time'], ['site', '현장', 'text'], ['leader', '진행자(관리감독자)', 'text'], ['boss', '관리자(비상 연락)', 'text'], ['phone', '관리자 전화', 'tel'], ['evac', '대피 장소', 'text']],
  rule: [['site', '현장(선택)', 'text'], ['date', '날짜(선택)', 'date']],
  order: [['date', '날짜', 'date'], ['site', '현장', 'text'], ['작업자', '작업자(이름 · 인원)', 'text'], ['시작', '시작', 'time'], ['끝', '끝', 'time'], ['issuer', '지시한 사람', 'text']],
}
const 보기말 = { date: '', time: '', site: '예: ○○ 근린생활시설 신축공사', leader: '예: 김반장', boss: '예: 이과장', phone: '010-', evac: '예: 정문 앞 공터', 작업자: '예: 형틀 4명', issuer: '예: 김반장' }
/* TBM 종이의 칸 — 문장 분류로 저절로 나눔 */
const 여는말 = new Set(['t1', 't2'])
const TBM칸 = (s) => (여는말.has(s.id) ? 'open' : s.c === 'health' ? 'health' : s.c === 'ppe' ? 'ppe' : s.c === 'tbm' ? 'remember' : s.c === 'emerg' ? 'emerg' : 'risk')
const 사전순 = Object.fromEntries(S.문장들.map((s, i) => [s.id, i]))
const 순서대로 = (ids) => [...(ids || [])].filter((id) => S.문장[id]).sort((a, b) => 사전순[a] - 사전순[b])

export default function SafeCard() {
  const [판, set판] = useState(() => S.읽기())
  const [분류, set분류] = useState('all')
  const [찾기, set찾기] = useState('')
  const [말알림, set말알림] = useState('')
  useEffect(() => { S.쓰기(판) }, [판])
  useEffect(() => { document.title = '현장 다국어 안전카드 — TBM · 안전수칙 · 작업 지시를 중국어 · 베트남어 · 우즈벡어로 | K-건설맵' }, [])
  const 종 = 판.종류
  const 고른 = 판.문장[종] || []
  const 직접 = 판.직접[종] || []
  const 바꿈 = (f) => set판((p) => ({ ...p, ...f(p) }))
  const 칸바꿈 = (k, v) => 바꿈((p) => ({ 칸: { ...p.칸, [k]: v } }))
  const 장소바꿈 = (k, v) => 바꿈((p) => ({ 장소: { ...p.장소, [k]: v } }))
  const 문장켬 = (id) => 바꿈((p) => {
    const a = p.문장[종] || []
    return { 문장: { ...p.문장, [종]: a.includes(id) ? a.filter((x) => x !== id) : [...a, id] } }
  })
  const 작업켬 = (id) => 바꿈((p) => ({ 작업: p.작업.includes(id) ? p.작업.filter((x) => x !== id) : [...p.작업, id] }))
  const 말켬 = (k) => {
    set말알림('')
    바꿈((p) => {
      if (p.말.includes(k)) return p.말.length > 1 ? { 말: p.말.filter((x) => x !== k) } : {}
      if (p.말.length >= 3) { set말알림('한 장에는 세 가지 말까지 넣습니다 — 하나를 먼저 빼십시오.'); return {} }
      return { 말: [...p.말, k] }
    })
  }
  const 직접더 = () => 바꿈((p) => ({ 직접: { ...p.직접, [종]: [...(p.직접[종] || []), { ko: '', 번: {} }].slice(0, 12) } }))
  const 직접고침 = (i, f) => 바꿈((p) => ({ 직접: { ...p.직접, [종]: (p.직접[종] || []).map((r, j) => (j === i ? f(r) : r)) } }))
  const 직접빼기 = (i) => 바꿈((p) => ({ 직접: { ...p.직접, [종]: (p.직접[종] || []).filter((_, j) => j !== i) } }))
  /* 👍 추천 = 종류마다 기본 묶음 + (TBM · 작업 지시서) 고른 작업의 위험 문장 */
  const 추천들 = (p) => [...추천[p.종류], ...(p.종류 === 'rule' ? [] : p.작업.flatMap((a) => S.작업문장[a] || []))]
  const 추천넣기 = () => { 세기('|안전카드|추천'); 바꿈((p) => ({ 문장: { ...p.문장, [종]: [...new Set([...(p.문장[종] || []), ...추천들(p)])] } })) }
  const 예시보기 = () => { 세기('|안전카드|예시'); set판((p) => ({ ...S.예시판(), 종류: p.종류 })) }
  const 처음부터 = () => set판((p) => ({ ...S.빈판(), 종류: p.종류, 말: p.말, 문장: { ...S.빈판().문장, tbm: [], rule: [], order: [] } }))

  const 보이는문장 = useMemo(() => {
    const q = 찾기.trim()
    return S.문장들.filter((s) => (분류 === 'all' || s.c === 분류 || (분류 === 'picked' && 고른.includes(s.id)))
      && (!q || s.ko.includes(q) || 판.말.some((k) => String(s[k]).toLowerCase().includes(q.toLowerCase()))))
  }, [분류, 찾기, 고른, 판.말])
  const 분류수 = useMemo(() => Object.fromEntries(S.분류들.map(([c]) => [c, S.문장들.filter((s) => s.c === c && 고른.includes(s.id)).length])), [고른])

  const [인쇄중, 인쇄] = use인쇄(`다국어안전카드_${종류이름[종]}_${판.칸.date || S.예시날()}`)
  const 인쇄하기 = () => {
    세기(`|안전카드|인쇄${종류이름[종]}`)
    for (const k of 판.말) 세기(`|안전카드|${k}`)
    인쇄()
  }
  const 빈종이 = 고른.length === 0 && 직접.every((r) => !r.ko.trim()) && (종 !== 'tbm' && 종 !== 'order' ? true : 판.작업.length === 0)

  return (
    <div className="container sc-wrap">
      <div className="card">
        <h1 className="sec-title" style={{ fontSize: 20, margin: '0 0 6px' }}>🌏 현장 다국어 안전카드</h1>
        <p className="muted" style={{ margin: 0 }}>
          <b>TBM · 안전수칙 · 작업 지시</b>를 문장으로 고르면 <b>중국어 · 베트남어 · 우즈벡어 · 러시아어 · 영어</b>가 한국어와 나란히 놓인 A4 종이로 바로 인쇄됩니다.
          외국인 건설근로자는 7명 중 1명(2024년 약 22만 5천 명)입니다.
        </p>
        <div className="sc-top">
          <button type="button" className="btn sm ghost" onClick={예시보기}>🧪 예시 채우기</button>
          <button type="button" className="btn sm ghost" onClick={처음부터}>처음부터</button>
          <span className="muted sm">적은 것은 이 브라우저에만 남습니다.</span>
        </div>
      </div>

      {/* ① 종이 */}
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>① 어떤 종이를 만들까요</div>
        <div className="gp-pick">
          {종류들.map(([k, ic, t, d]) => (
            <button key={k} type="button" className={'gp-pick-b' + (종 === k ? ' on' : '')} onClick={() => 바꿈(() => ({ 종류: k }))} aria-pressed={종 === k}>
              <b>{ic} {t}</b><span>{d}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ② 말 */}
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>② 어느 말로 (한국어 + 셋까지)</div>
        <div className="sc-chips" role="group" aria-label="말 고르기">
          {S.말들.map((k) => (
            <button key={k} type="button" className={'chip' + (판.말.includes(k) ? ' on' : '')} aria-pressed={판.말.includes(k)} onClick={() => 말켬(k)}>
              {S.말이름[k].한} <span lang={S.말이름[k].lang} className="sc-chipsub">{S.말이름[k].제}</span>
            </button>
          ))}
        </div>
        {말알림 && <div className="note fwarn" style={{ marginTop: 8 }}>{말알림}</div>}
        <p className="note sm" style={{ margin: '8px 0 0' }}>
          한국계 중국인(동포)이 가장 많아 중국어(간체)가 먼저입니다. 우즈베키스탄 · 카자흐스탄 고려인 동포는 러시아어를 더 잘 읽는 분이 많습니다.
        </p>
      </div>

      {/* ③ 칸 */}
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>③ 위에 적을 것 <span className="muted sm">(적은 칸만 종이에 나옵니다 · 번역 안 됨)</span></div>
        <div className="sc-fields">
          {칸들[종].map(([k, t, ty]) => (
            <div className="field" key={k}>
              <label htmlFor={'sc-' + k}>{t}</label>
              <input id={'sc-' + k} type={ty} value={판.칸[k] || ''} maxLength={60} placeholder={보기말[k] || ''} onChange={(e) => 칸바꿈(k, e.target.value)} />
            </div>
          ))}
        </div>
        {종 !== 'rule' && (
          <>
            <div className="sc-sub">작업 장소 — 숫자 · 글자만 넣으면 말마다 바꿔 적습니다</div>
            <div className="sc-place">
              <label>동 <input value={판.장소.동} maxLength={6} inputMode="text" aria-label="동" placeholder="101" onChange={(e) => 장소바꿈('동', e.target.value)} /></label>
              <label><input type="checkbox" checked={!!판.장소.지하} onChange={(e) => 장소바꿈('지하', e.target.checked)} /> 지하</label>
              <label>층 <input value={판.장소.층} maxLength={4} inputMode="numeric" aria-label="층" placeholder="3" onChange={(e) => 장소바꿈('층', e.target.value.replace(/[^0-9]/g, ''))} /></label>
              <label>구역 <input value={판.장소.구} maxLength={6} aria-label="구역" placeholder="A" onChange={(e) => 장소바꿈('구', e.target.value)} /></label>
              {S.장소글(판.장소, 'ko') && <span className="sc-placeout">→ {S.장소글(판.장소, 'ko')} · <span lang={S.말이름[판.말[0]].lang}>{S.장소글(판.장소, 판.말[0])}</span></span>}
            </div>
          </>
        )}
        {종 !== 'rule' && (
          <>
            <div className="sc-sub">오늘 할 작업 <span className="muted sm">({판.작업.length}개 고름 · 고른 작업의 위험 문장은 ④ «👍 추천 넣기» 가 같이 넣습니다)</span></div>
            <div className="sc-chips sc-works" role="group" aria-label="오늘 할 작업">
              {S.작업들.map((a) => (
                <button key={a.id} type="button" className={'chip' + (판.작업.includes(a.id) ? ' on' : '')} aria-pressed={판.작업.includes(a.id)} onClick={() => 작업켬(a.id)}>{a.g} {a.ko}</button>
              ))}
            </div>
          </>
        )}
        {종 === 'tbm' && (
          <div className="sc-opt">
            <label>참석자 서명 줄 <select value={판.서명줄} onChange={(e) => 바꿈(() => ({ 서명줄: +e.target.value }))}>{[0, 8, 12, 16, 20].map((n) => <option key={n} value={n}>{n ? `${n}줄` : '없음'}</option>)}</select></label>
          </div>
        )}
        {종 === 'rule' && (
          <div className="sc-opt">
            <span className="muted">꼴</span>
            <label><input type="radio" name="sc-kkol" checked={판.꼴 === '목록'} onChange={() => 바꿈(() => ({ 꼴: '목록' }))} /> 목록 — 한 장에 여러 줄</label>
            <label><input type="radio" name="sc-kkol" checked={판.꼴 === '표지'} onChange={() => 바꿈(() => ({ 꼴: '표지' }))} /> 표지 — 한 장에 하나(크게)</label>
          </div>
        )}
      </div>

      {/* ④ 문장 */}
      <div className="card">
        <div className="sc-head">
          <div className="sec-title" style={{ margin: 0 }}>④ 문장 고르기 <span className="muted sm">({고른.length}개 고름)</span></div>
          <div className="sc-headb">
            <button type="button" className="btn sm ghost" onClick={추천넣기}>👍 추천 넣기</button>
            <button type="button" className="btn sm ghost" disabled={!고른.length} onClick={() => 바꿈((p) => ({ 문장: { ...p.문장, [종]: [] } }))}>모두 빼기</button>
          </div>
        </div>
        <div className="sc-chips sc-cats" role="tablist" aria-label="분류">
          <button type="button" role="tab" aria-selected={분류 === 'all'} className={'chip' + (분류 === 'all' ? ' on' : '')} onClick={() => set분류('all')}>전체 {S.문장들.length}</button>
          <button type="button" role="tab" aria-selected={분류 === 'picked'} className={'chip' + (분류 === 'picked' ? ' on' : '')} onClick={() => set분류('picked')}>✔ 고른 것 {고른.length}</button>
          {S.분류들.map(([c, ic, t]) => (
            <button key={c} type="button" role="tab" aria-selected={분류 === c} className={'chip' + (분류 === c ? ' on' : '')} onClick={() => set분류(c)}>
              {ic} {t}{분류수[c] ? <b className="sc-n"> {분류수[c]}</b> : null}
            </button>
          ))}
        </div>
        <input className="sc-find" type="search" value={찾기} onChange={(e) => set찾기(e.target.value)} placeholder="찾기 — 예: 안전대, 크레인, 용접" aria-label="문장 찾기" />
        <ul className="sc-list">
          {보이는문장.map((s) => {
            const on = 고른.includes(s.id)
            return (
              <li key={s.id} className={on ? 'on' : ''}>
                <label>
                  <input type="checkbox" checked={on} onChange={() => 문장켬(s.id)} />
                  <span className="sc-li-g" aria-hidden="true">{s.g}</span>
                  <span className="sc-li-t">
                    <span className="sc-li-ko">{s.ko}</span>
                    <span className="sc-li-tr" lang={S.말이름[판.말[0]].lang}>{s[판.말[0]]}</span>
                  </span>
                  <span className={'sc-kkol k-' + s.f}>{S.꼴이름[s.f]}</span>
                </label>
              </li>
            )
          })}
          {!보이는문장.length && <li className="muted" style={{ padding: 10 }}>찾는 문장이 없습니다 — 아래 «직접 쓰기» 로 적으십시오.</li>}
        </ul>

        <div className="sc-sub" style={{ marginTop: 12 }}>✍ 직접 쓰기 <span className="muted sm">— 번역되지 않습니다. 통역하는 분이 외국어 칸에 적으면 그대로 나옵니다.</span></div>
        {직접.map((r, i) => (
          <div className="sc-self" key={i}>
            <div className="sc-self-r">
              <input value={r.ko} maxLength={200} placeholder="한국어로 — 예: 오후 2시부터 레미콘 차량이 들어옵니다." aria-label={`직접 쓴 말 ${i + 1}`} onChange={(e) => 직접고침(i, (x) => ({ ...x, ko: e.target.value }))} />
              <button type="button" className="btn sm ghost" onClick={() => 직접빼기(i)} aria-label={`직접 쓴 말 ${i + 1} 빼기`}>✕</button>
            </div>
            {판.말.map((k) => (
              <input key={k} className="sc-self-tr" lang={S.말이름[k].lang} value={(r.번 || {})[k] || ''} maxLength={300}
                placeholder={`${S.말이름[k].한}로(아는 분이 적으면) — 비우면 «번역 안 됨»`} aria-label={`직접 쓴 말 ${i + 1} ${S.말이름[k].한}`}
                onChange={(e) => 직접고침(i, (x) => ({ ...x, 번: { ...(x.번 || {}), [k]: e.target.value } }))} />
            ))}
          </div>
        ))}
        <button type="button" className="btn sm line" disabled={직접.length >= 12} onClick={직접더}>＋ 직접 쓴 줄 더하기</button>
      </div>

      {/* ⑤ 종이 */}
      <div className="card">
        <div className="sc-head">
          <div className="sec-title" style={{ margin: 0 }}>⑤ 종이 (A4 세로)</div>
          <div className="sc-headb">
            <label className="sc-brand"><input type="checkbox" checked={판.건설맵} onChange={(e) => 바꿈(() => ({ 건설맵: e.target.checked }))} /> 아래에 건설맵 주소</label>
            <button type="button" className="btn sm" disabled={빈종이} onClick={인쇄하기}>🖨 인쇄 · PDF</button>
          </div>
        </div>
        {빈종이
          ? <div className="note sm">문장을 하나 이상 고르면 종이가 나옵니다. 처음이면 <b>👍 추천 넣기</b> 나 <b>🧪 예시 채우기</b> 를 누르십시오.</div>
          : <div className="sc-preview"><종이들 판={판} /></div>}
        <p className="note sm" style={{ margin: '10px 0 0' }}>
          번역은 건설맵이 미리 번역하고 되번역으로 확인한 문장입니다. 현장 말투 · 지역 말과 다를 수 있으니, 처음 쓸 때는 그 나라 근로자에게 한 번 읽혀 보십시오.
          {종 === 'rule' && 판.꼴 === '표지' && <> «표지» 꼴은 법정 안전보건표지(산업안전보건법 시행규칙 제38조 · 별표 6 · 7)를 대신하지 않습니다 — 표지 옆에 모국어 안내로 붙이십시오.</>}
        </p>
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>같이 쓰는 도구</div>
        <p className="muted" style={{ margin: 0 }}>
          위험성평가 기록은 <Link to="/tools/risk">⚠️ 위험성평가</Link>(TBM 기록 · 수시평가), 회사 체계는 <Link to="/tools/jungcheo">🛡 중대재해 안전보건관리체계</Link>,
          안전관리비는 <Link to="/tools/sanan">🦺 산안비 계상기</Link>입니다.
        </p>
      </div>
      <도구설명 k="safecard" />

      {인쇄중 && createPortal(<div id="gp-인쇄"><종이들 판={판} 인쇄 /></div>, document.body)}
    </div>
  )
}

/* ══════════════ 종이 ══════════════ */
const 여러말 = (o, 말) => ['ko', ...말].map((k) => o && o[k]).filter(Boolean)

function 머리글({ k, 말, 큼 }) {
  const o = S.머리[k]
  if (!o) return null
  return (
    <span className={'sc-hd' + (큼 ? ' big' : '')}>
      <span className="sc-hd-ko">{o.ko}</span>
      {말.map((m) => <span key={m} className="sc-hd-tr" lang={S.말이름[m].lang}>{o[m]}</span>)}
    </span>
  )
}

function 줄({ s, 말, 네모 }) {
  return (
    <div className={'sc-row k-' + (s.f || 'info')}>
      <span className="sc-row-g" aria-hidden="true">{s.g}</span>
      <div className="sc-row-t">
        <div className="sc-row-ko">{s.ko}</div>
        {말.map((k) => <div key={k} className="sc-row-tr" lang={S.말이름[k].lang}>{s[k]}</div>)}
      </div>
      {네모 && <span className="sc-box" aria-hidden="true">☐</span>}
    </div>
  )
}

function 직접줄({ r, 말 }) {
  if (!r.ko.trim()) return null
  const 빈 = 말.filter((k) => !String((r.번 || {})[k] || '').trim())
  return (
    <div className="sc-row k-self">
      <span className="sc-row-g" aria-hidden="true">✍</span>
      <div className="sc-row-t">
        <div className="sc-row-ko">{r.ko}</div>
        {말.map((k) => (String((r.번 || {})[k] || '').trim()
          ? <div key={k} className="sc-row-tr" lang={S.말이름[k].lang}>{r.번[k]}</div>
          : null))}
        {빈.length > 0 && <div className="sc-row-self">{빈.map((k) => <span key={k} lang={S.말이름[k].lang}>{S.머리.self[k]}</span>)}</div>}
      </div>
    </div>
  )
}

function 칸표({ 줄들, 말 }) {
  const 있는 = 줄들.filter(([, v]) => String(v || '').trim())
  if (!있는.length) return null
  return (
    <table className="sc-info">
      <tbody>
        {있는.map(([k, v, 번]) => (
          <tr key={k}>
            <th><머리글 k={k} 말={말} /></th>
            <td>
              <div>{v}</div>
              {번 && 말.map((m) => (번[m] ? <div key={m} className="sc-info-tr" lang={S.말이름[m].lang}>{번[m]}</div> : null))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function 꼬리({ 판 }) {
  return (
    <div className="sc-foot">
      {판.건설맵 && <span>K-건설맵 · k-conmap.com 현장 다국어 안전카드</span>}
      <span>✍ 표시는 직접 쓴 말입니다(번역 안 됨)</span>
    </div>
  )
}

function 종이들({ 판, 인쇄 }) {
  const 종 = 판.종류
  const 말 = 판.말
  const 고른 = 순서대로(판.문장[종])
  const 직접 = (판.직접[종] || []).filter((r) => r.ko.trim())
  const 장소번 = Object.fromEntries(['ko', ...말].map((k) => [k, S.장소글(판.장소, k)]))
  const 장소 = 장소번.ko
  const 작업 = 판.작업.map((id) => S.작업[id]).filter(Boolean)
  const cls = 'sc-paper' + (인쇄 ? ' sc-쪽' : '')

  if (종 === 'rule' && 판.꼴 === '표지') {
    const 모두 = [...고른.map((id) => ({ s: S.문장[id] })), ...직접.map((r) => ({ r }))]
    return (
      <>
        {모두.map((x, i) => (
          <div key={i} className={cls + ' sc-sign k-' + (x.s ? x.s.f : 'self')}>
            <div className="sc-sign-band">
              {x.s ? 여러말(S.머리[x.s.f + '_f'], 말).join('  ·  ') : '✍'}
            </div>
            <div className="sc-sign-pic" aria-hidden="true"><표지모양 f={x.s ? x.s.f : 'info'} g={x.s ? x.s.g : '✍'} /></div>
            <div className="sc-sign-ko">{x.s ? x.s.ko : x.r.ko}</div>
            {말.map((k) => {
              const t = x.s ? x.s[k] : String((x.r.번 || {})[k] || '').trim()
              return t ? <div key={k} className="sc-sign-tr" lang={S.말이름[k].lang}>{t}</div> : null
            })}
            {x.r && 말.some((k) => !String((x.r.번 || {})[k] || '').trim()) && <div className="sc-row-self">{말.filter((k) => !String((x.r.번 || {})[k] || '').trim()).map((k) => <span key={k} lang={S.말이름[k].lang}>{S.머리.self[k]}</span>)}</div>}
            {(판.칸.site || 판.건설맵) && <div className="sc-sign-foot">{판.칸.site}{판.칸.site && 판.건설맵 ? ' · ' : ''}{판.건설맵 ? 'K-건설맵 · k-conmap.com' : ''}</div>}
          </div>
        ))}
      </>
    )
  }

  if (종 === 'rule') {
    return (
      <div className={cls}>
        <div className="sc-title"><머리글 k="rule" 말={말} 큼 /></div>
        <칸표 말={말} 줄들={[['site', 판.칸.site], ['date', 판.칸.date]]} />
        <div className="sc-sec">
          {고른.map((id) => <줄 key={id} s={S.문장[id]} 말={말} />)}
          {직접.map((r, i) => <직접줄 key={'d' + i} r={r} 말={말} />)}
        </div>
        <꼬리 판={판} />
      </div>
    )
  }

  if (종 === 'order') {
    return (
      <div className={cls}>
        <div className="sc-title"><머리글 k="order" 말={말} 큼 /></div>
        <칸표 말={말} 줄들={[
          ['date', 판.칸.date], ['site', 판.칸.site], ['worker', 판.칸.작업자],
          ['place', 장소, 장소 ? 장소번 : null],
          ['time', [판.칸.시작, 판.칸.끝].filter(Boolean).join(' ~ ')], ['issuer', 판.칸.issuer],
        ]} />
        {작업.length > 0 && (
          <div className="sc-sec">
            <div className="sc-sec-h"><머리글 k="work" 말={말} /></div>
            <div className="sc-works-p">
              {작업.map((a) => (
                <div key={a.id} className="sc-work">
                  <span className="sc-row-g" aria-hidden="true">{a.g}</span>
                  <div><div className="sc-row-ko">{a.ko}</div>{말.map((k) => <div key={k} className="sc-row-tr" lang={S.말이름[k].lang}>{a[k]}</div>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {(고른.length > 0 || 직접.length > 0) && (
          <div className="sc-sec">
            <div className="sc-sec-h"><머리글 k="caution" 말={말} /></div>
            {고른.map((id) => <줄 key={id} s={S.문장[id]} 말={말} />)}
            {직접.map((r, i) => <직접줄 key={'d' + i} r={r} 말={말} />)}
          </div>
        )}
        <div className="sc-sec sc-signs">
          <div className="sc-ok">{여러말(S.머리.ok, 말).map((t, i) => <div key={i} lang={i ? S.말이름[말[i - 1]].lang : 'ko'}>{t}</div>)}</div>
          <table className="sc-sign-t">
            <thead><tr><th style={{ width: '50%' }}><머리글 k="issuer" 말={말} /></th><th><머리글 k="confirm" 말={말} /></th></tr></thead>
            <tbody><tr><td className="sc-sigcell">{판.칸.issuer}</td><td className="sc-sigcell" /></tr></tbody>
          </table>
        </div>
        <꼬리 판={판} />
      </div>
    )
  }

  /* 🗣 TBM */
  const 칸별 = { open: [], risk: [], ppe: [], health: [], remember: [], emerg: [] }
  for (const id of 고른) 칸별[TBM칸(S.문장[id])].push(id)
  /* 순서 — 여는 말 → 오늘 작업 → 위험 · 대책 → 보호구 → 건강 → 꼭 기억 → 비상 → 서명 (KOSHA TBM 흐름) */
  const 칸순 = [['risk', false], ['ppe', true], ['health', true], ['remember', false], ['emerg', false]]
  return (
    <div className={cls}>
      <div className="sc-title"><머리글 k="tbm" 말={말} 큼 /></div>
      <칸표 말={말} 줄들={[
        ['date', [판.칸.date, 판.칸.time].filter(Boolean).join(' ')], ['site', 판.칸.site],
        ['place', 장소, 장소 ? 장소번 : null], ['leader', 판.칸.leader],
      ]} />
      {칸별.open.length > 0 && <div className="sc-sec sc-open">{칸별.open.map((id) => <줄 key={id} s={S.문장[id]} 말={말} />)}</div>}
      {작업.length > 0 && (
        <div className="sc-sec">
          <div className="sc-sec-h"><머리글 k="work" 말={말} /></div>
          <div className="sc-works-p">
            {작업.map((a) => (
              <div key={a.id} className="sc-work">
                <span className="sc-row-g" aria-hidden="true">{a.g}</span>
                <div><div className="sc-row-ko">{a.ko}</div>{말.map((k) => <div key={k} className="sc-row-tr" lang={S.말이름[k].lang}>{a[k]}</div>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {칸순.map(([k, 네모]) => {
        const ids = 칸별[k]
        const 비상칸 = k === 'emerg' && (판.칸.boss || 판.칸.phone || 판.칸.evac)
        const 직접여기 = k === 'risk' ? 직접 : []
        if (!ids.length && !비상칸 && !직접여기.length) return null
        return (
          <div className="sc-sec" key={k}>
            <div className="sc-sec-h"><머리글 k={k} 말={말} /></div>
            {ids.map((id) => <줄 key={id} s={S.문장[id]} 말={말} 네모={네모} />)}
            {직접여기.map((r, i) => <직접줄 key={'d' + i} r={r} 말={말} />)}
            {k === 'emerg' && 비상칸 && <칸표 말={말} 줄들={[['boss', 판.칸.boss], ['phone', 판.칸.phone], ['evac', 판.칸.evac]]} />}
          </div>
        )
      })}
      {판.서명줄 > 0 && (
        <div className="sc-sec sc-signs">
          <div className="sc-sec-h"><머리글 k="sign" 말={말} /></div>
          <div className="sc-ok">{여러말(S.머리.ok, 말).map((t, i) => <div key={i} lang={i ? S.말이름[말[i - 1]].lang : 'ko'}>{t}</div>)}</div>
          <table className="sc-sign-t">
            <thead><tr><th style={{ width: '9%' }}><머리글 k="no" 말={[]} /></th><th style={{ width: '31%' }}><머리글 k="name" 말={말} /></th><th style={{ width: '28%' }}><머리글 k="nat" 말={말} /></th><th><머리글 k="sig" 말={말} /></th></tr></thead>
            <tbody>{Array.from({ length: 판.서명줄 }, (_, i) => <tr key={i}><td>{i + 1}</td><td /><td /><td /></tr>)}</tbody>
          </table>
        </div>
      )}
      <꼬리 판={판} />
    </div>
  )
}

/* 표지 모양 — KS 안전보건표지의 «모양 · 색» 만 본뜸(그림은 문장 그림) */
function 표지모양({ f, g }) {
  const 글 = <text x="60" y="62" textAnchor="middle" dominantBaseline="middle" fontSize="44">{g}</text>
  if (f === 'no') return <svg viewBox="0 0 120 120" width="150" height="150"><circle cx="60" cy="60" r="52" fill="#fff" stroke="#d32f2f" strokeWidth="12" />{글}<line x1="24" y1="24" x2="96" y2="96" stroke="#d32f2f" strokeWidth="11" opacity=".85" /></svg>
  if (f === 'warn') return <svg viewBox="0 0 120 120" width="150" height="150"><polygon points="60,8 114,108 6,108" fill="#ffd600" stroke="#111" strokeWidth="7" strokeLinejoin="round" /><text x="60" y="78" textAnchor="middle" dominantBaseline="middle" fontSize="40">{g}</text></svg>
  if (f === 'do') return <svg viewBox="0 0 120 120" width="150" height="150"><circle cx="60" cy="60" r="56" fill="#1565c0" /><circle cx="60" cy="60" r="38" fill="#fff" />{글}</svg>
  return <svg viewBox="0 0 120 120" width="150" height="150"><rect x="6" y="6" width="108" height="108" rx="10" fill="#2e7d32" /><rect x="22" y="22" width="76" height="76" rx="6" fill="#fff" />{글}</svg>
}
