/* ══════════════════════════════════════════════════════════════
   🏗 내 현장 · 내 일 — 마이컨맵(/my) 맨 위 (G539 · 2026-11-05)
   소장님 「마이컨맵을 새로게 리모델링 하고 싶어」 · 「자료를 줄때, 다시 방문하게 해야 해...알지?」 · 「페이지 전체를 리모델링 해주고, 설명글도 자세히」
   ■ 현장을 한 번 적으면 — 서식 공통 칸(서식 243가지가 먼저 채움) · 할 일 날짜(오늘 기준 D) · ✓ 했음 · 폰 달력(.ics · 이어 보기 주소)
   ■ 셈 · 저장은 lib/내현장.js 한 곳(시험 tools/시험_내현장.mjs) · 이 기기에만(서버로 안 감)
   ■ 숨은 누적: |마이|현장만듦 · 현장고침 · 현장바꿈 · 현장지움 · 할일열기 · 할일했음 · 할일전체 · 달력받기
   ══════════════════════════════════════════════════════════════ */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as H from '../lib/내현장.js'
import { 세기 } from '../lib/받은수.jsx'
import { 파일주기 } from '../lib/그림PDF.js'
import { 금액수, 금액말 } from '../lib/금액읽기.js'

const 원 = (n) => (n > 0 ? Math.round(n).toLocaleString('ko-KR') + '원' : '')
const 억글 = (n) => {
  if (!(n >= 1e8)) return ''
  const 억 = Math.floor(n / 1e8), 만 = Math.floor((n % 1e8) / 1e4)
  return `${억.toLocaleString('ko-KR')}억${만 ? ' ' + 만.toLocaleString('ko-KR') + '만' : ''} 원`
}

function 편집({ 처음, 새것, 끝, 지움 }) {
  const [h, setH] = useState(() => ({ ...처음, 계약금액: 처음.계약금액 ? 처음.계약금액.toLocaleString('ko-KR') : '', 하도급금액: 처음.하도급금액 ? 처음.하도급금액.toLocaleString('ko-KR') : '' }))
  const [틀림, set틀림] = useState('')
  const [지울까, set지울까] = useState(false)
  const 바꿈 = (k) => (e) => setH({ ...h, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const 저장 = () => {
    const x = H.현장정리(h)
    if (!x.현장) { set틀림('공사명을 적어 주세요'); return }
    if (!x.착공 || !x.준공) { set틀림('착공일 · 준공일을 넣어 주세요 — 할 일 날짜를 여기서 셉니다'); return }
    if (!H.현장맞나(x)) { set틀림('준공일이 착공일보다 앞섭니다'); return }
    if (String(h.계약금액 || '').trim() && !x.계약금액) { set틀림('도급금액을 읽지 못했습니다 — 숫자로 적어 주세요(예: 1,250,000,000 · 12억 5천만)'); return }
    const r = H.저장(x)
    if (r.틀림) { set틀림(r.틀림); return }
    세기(새것 ? '|마이|현장만듦' : '|마이|현장고침')
    끝(r)
  }
  const 칸 = (k, 이름, 꼴 = {}) => (
    <label className="mc-f">
      <span className="mc-fl">{이름}</span>
      <input className="inp" value={h[k] || ''} onChange={바꿈(k)} {...꼴} />
    </label>
  )
  /* 💰 G541 금액 칸 — «3억 8,500만» · «12억» 처럼 적어도 되고, 아래 줄에 어떻게 읽었는지 바로 보임(이용자 점검 11-05: 38,500원 · 12원으로 저장되던 것) */
  const 금액칸 = (k, 이름) => {
    const v = String(h[k] || '').trim(), n = 금액수(v)
    return (
      <label className="mc-f">
        <span className="mc-fl">{이름}</span>
        <input className="inp" value={h[k] || ''} onChange={바꿈(k)} inputMode="text" placeholder="예: 1,250,000,000 · 12억 5천만" />
        {v && <span className={'mc-amt' + (n ? '' : ' bad')}>{n ? `= ${금액말(n)} (${n.toLocaleString('ko-KR')}원)` : '⚠ 금액으로 읽지 못했습니다 — 숫자로 적어 주세요'}</span>}
      </label>
    )
  }
  return (
    <div className="card mc-ec mc-sited">
      <h3 className="mc-eh">{새것 ? '🏗 내 현장 적기' : '✏️ 현장 고치기'}</h3>
      <p className="mc-fh">공사명 · 착공일 · 준공일만 적어도 됩니다. 더 적을수록 할 일 날짜가 더 나옵니다. 적은 값은 서식에 먼저 들어갑니다.</p>
      <div className="mc-sgrid">
        {칸('현장', '공사명 *', { maxLength: 80, placeholder: '예: ○○지구 배수로 정비공사' })}
        {칸('발주', '발주기관', { maxLength: 40, placeholder: '예: ○○시' })}
        <label className="mc-f">
          <span className="mc-fl">발주 갈래</span>
          <select className="inp" value={h.갈래} onChange={바꿈('갈래')}>
            {H.갈래들.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </label>
        {금액칸('계약금액', '도급금액(원)')}
        {칸('착공', '착공일 *', { type: 'date' })}
        {칸('준공', '준공일 *', { type: 'date' })}
        {칸('회사', '우리 회사', { maxLength: 40 })}
        {칸('대리인', '현장대리인', { maxLength: 20 })}
        {칸('위치', '현장 위치', { maxLength: 80 })}
      </div>
      <details className="mc-more">
        <summary>날짜 더 적기 — 낙찰 · 계약 · 하도급</summary>
        <div className="mc-sgrid">
          {칸('낙찰일', '낙찰 통지일', { type: 'date' })}
          {칸('계약일', '계약일', { type: 'date' })}
          {칸('하도급일', '하도급 계약일', { type: 'date' })}
          {금액칸('하도급금액', '하도급금액(원)')}
        </div>
      </details>
      <div className="mc-site-ck">
        <span className="mc-fl">이 현장이 대상이면 고르세요 (고른 것만 날짜를 냅니다)</span>
        <label className="mc-check"><input type="checkbox" checked={!!h.유해} onChange={바꿈('유해')} /> 유해위험방지계획서 대상</label>
        <label className="mc-check"><input type="checkbox" checked={!!h.안전} onChange={바꿈('안전')} /> 안전관리계획서 대상</label>
        <label className="mc-check"><input type="checkbox" checked={!!h.대장} onChange={바꿈('대장')} /> 총공사금액 50억 원 이상(나눠 발주한 합계 — 공사안전보건대장)</label>
        <label className="mc-check"><input type="checkbox" checked={!!h.전기} onChange={바꿈('전기')} /> 전기공사</label>
        <label className="mc-check"><input type="checkbox" checked={!!h.전문} onChange={바꿈('전문')} /> 전문공사를 전문업종으로 받음(직접시공계획 통보 안 함)</label>
        <p className="mc-fh">대상인지 모르면 <Link to="/safety">안전관리계획서 · 유해위험방지계획서 — 대상인가</Link> 에서 먼저 보세요. 도급금액이 50억 원 이상이면 공사안전보건대장은 저절로 넣습니다.</p>
      </div>
      {틀림 && <div className="claudesay bad"><b>⚠</b><span>{틀림}</span></div>}
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={저장}>{새것 ? '＋ 이 현장 저장' : '저장'}</button>
        <button type="button" className="btn ghost" onClick={() => 끝(null)}>닫기</button>
        {!새것 && 지움 && (지울까
          ? <button type="button" className="btn ghost mc-danger" onClick={지움}>🗑 정말 지웁니다(할 일 ✓ 도 함께)</button>
          : <button type="button" className="btn ghost mc-danger" onClick={() => set지울까(true)}>🗑 이 현장 지우기</button>)}
      </div>
    </div>
  )
}

function 일줄({ x, 했음바꿈 }) {
  const 꼴 = H.D꼴(x.D, x.했음)
  return (
    <li className={'mc-todo' + (꼴 ? ' ' + { 지남: 'late', 곧: 'soon', 했음: 'done' }[꼴] : '')}>
      <span className="mc-d">{x.했음 ? '✓ 했음' : x.날 ? H.D글(x.D) : '늘'}</span>
      <div className="mc-todo-b">
        <b>{x.제목}</b>
        <span className="mc-todo-dt">{x.날 ? H.날보기(x.날) : '늘 지킬 것'}{x.미룬날 ? ` → 쉬는 날이라 기한은 다음 평일 ${H.날보기(x.미룬날)}` : ''}</span>
        <details className="mc-todo-more"><summary>무엇을 · 근거</summary><p>{x.글}</p>{x.근거 && <p className="mc-law">근거: {x.근거}</p>}</details>
      </div>
      <div className="mc-todo-a">
        {x.곳 && <Link className="btn sm line" to={x.곳} onClick={() => 세기('|마이|할일열기')}>{x.곳.startsWith('/forms/') ? '서식' : '열기'} →</Link>}
        {x.날 && <button type="button" className={'mc-ck' + (x.했음 ? ' on' : '')} aria-pressed={x.했음} aria-label={x.했음 ? '했음 되돌리기' : '했음'} title={x.했음 ? '했음 되돌리기' : '했음'} onClick={() => 했음바꿈(x)}>✓</button>}
      </div>
    </li>
  )
}

export default function 내현장칸() {
  const [d, setD] = useState(() => H.읽기())
  const [편집중, set편집중] = useState(null)     // null | '새' | '고침'
  const [전체, set전체] = useState(false)
  const [말, set말] = useState('')
  const 현장 = H.지금현장(d)
  const 오늘 = H.오늘날()
  const 일 = useMemo(() => H.할일(현장, 오늘), [현장, 오늘])
  const 맨위 = H.오늘할일(일, 5)
  const 날일 = 일.filter((x) => x.날)
  const 늘일 = 일.filter((x) => !x.날)
  const 공 = H.공기(현장, 오늘)
  const 다시읽기 = () => setD(H.읽기())
  /* 🧭 G541 저장 · 닫기 · 지움 뒤 «내 현장» 카드가 화면에 보이게(이용자 점검 11-05: 폰에서 저장하면 카드가 화면 위로 지나가 단축키만 보였음) */
  const 보이게 = () => setTimeout(() => { const el = document.querySelector('.mc-site'); if (!el) return; const t = el.getBoundingClientRect().top; if (t < 64 || t > window.innerHeight * 0.6) window.scrollTo({ top: Math.max(0, t + window.scrollY - 70), behavior: 'smooth' }) }, 30)
  const 끝 = (r) => { set편집중(null); 다시읽기(); if (r && r.현장) set말(`✓ «${r.현장.현장}» 저장 — 서식 ${r.칸}칸에 이 현장 값이 먼저 들어갑니다`); 보이게() }
  const 했음바꿈 = (x) => { H.했음바꿈(현장.id, x.열쇠, !x.했음); 세기('|마이|할일했음'); 다시읽기() }
  const 고르기 = (id) => { const r = H.고르기(id); 세기('|마이|현장바꿈'); 다시읽기(); if (r) set말(`«${r.현장.현장}» 으로 바꿈 — 서식도 이 현장 값으로 열립니다`) }
  const 달력받기 = () => {
    파일주기(new Blob([H.달력(현장, 일, 오늘)], { type: 'text/calendar;charset=utf-8' }), H.달력이름(현장))
    세기('|마이|달력받기')
    set말(`📲 받은 파일을 여시면 폰 달력에 앞으로 할 일 ${H.달력일(일, 오늘).length}가지가 들어갑니다(일마다 하루 전 알림 · 이어 보기 주소)`)
  }
  const 지움 = () => { if (!현장) return; H.지우기(현장.id); 세기('|마이|현장지움'); set편집중(null); 다시읽기(); set말('현장을 지웠습니다(이 기기에서)'); 보이게() }

  if (편집중) return <section className="mc-site" aria-label="내 현장"><편집 처음={편집중 === '새' ? H.공통에서() : 현장} 새것={편집중 === '새'} 끝={끝} 지움={지움} /></section>
  return (
    <section className="mc-site" aria-labelledby="mc-site-h">
      <div className="mc-keys-h">
        <h2 className="mc-dh" id="mc-site-h">🏗 내 현장 · 내 일 <small>열 때마다 오늘 기준으로 다시 셉니다 · 이 기기에만</small></h2>
        {d.목록.length > 0 && d.목록.length < H.현장최대 && <button type="button" className="btn sm line" style={{ width: 'auto' }} onClick={() => set편집중('새')}>＋ 현장</button>}
      </div>
      {d.목록.length > 1 && (
        <div className="mc-chips" role="tablist" aria-label="현장 고르기">
          {d.목록.map((x) => <button key={x.id} type="button" role="tab" aria-selected={x.id === d.지금} className={'chip' + (x.id === d.지금 ? ' on' : '')} onClick={() => 고르기(x.id)}>{x.현장}</button>)}
        </div>
      )}
      {!현장 ? (
        <div className="card mc-ec mc-site-0">
          <h3 className="mc-eh">🏗 지금 하는 현장을 적어 두세요</h3>
          <p className="mc-fh">공사명 · 착공일 · 준공일만 적으면 — ① 착공 전날 · 계약 뒤 30일 같은 <b>할 일 날짜</b>가 오늘 기준으로 나오고 ② 착공계 · 기성금 청구서 같은 <b>서식이 이 현장 값으로</b> 열립니다 ③ <b>폰 달력</b>에도 한 번에 넣습니다.</p>
          <button type="button" className="mc-cta mc-cta-site" onClick={() => set편집중('새')}>＋ 내 현장 적기</button>
          {H.공통에서().현장 && <p className="mc-fh">지난번 서식에 쓴 공사명(«{H.공통에서().현장}») · 회사 이름을 미리 채워 둡니다.</p>}
        </div>
      ) : (
        <div className="card mc-ec mc-site-c">
          <div className="mc-ebh">
            <h3 className="mc-eh mc-site-n">🏗 {현장.현장}</h3>
            <button type="button" className="btn sm line" style={{ width: 'auto' }} onClick={() => set편집중('고침')}>✏️ 고치기</button>
          </div>
          <p className="mc-site-l">{[현장.발주, 현장.계약금액 ? `${원(현장.계약금액)}${억글(현장.계약금액) ? ` (${억글(현장.계약금액)})` : ''}` : '', `${H.날보기(현장.착공, false)} ~ ${H.날보기(현장.준공, false)}`].filter(Boolean).join(' · ')}</p>
          {공 && (
            <div className="mc-bar" aria-label={`공기 ${공.퍼센트}%`}>
              <div className="mc-bar-t"><i style={{ width: `${공.퍼센트}%` }} /></div>
              <span>{공.상태 === '착공 전' ? `착공 전 — 착공까지 ${공.착공까지}일 · 공기 ${공.전체}일` : 공.상태 === '공사 중' ? `공사 중 ${공.퍼센트}% — ${공.경과}일째 · 준공까지 ${공.남은}일` : `준공 지남 — ${공.지난}일`}</span>
            </div>
          )}
          <h4 className="mc-todo-h">📅 {전체 ? '할 일 전체' : '오늘 할 일'} <small>{전체 ? `날짜 차례 ${날일.length}가지` : 맨위.length ? `가까운 ${맨위.length}가지` : ''}</small></h4>
          {전체
            ? <ul className="mc-todos">{날일.map((x) => <일줄 key={x.열쇠} x={x} 했음바꿈={했음바꿈} />)}</ul>
            : 맨위.length
              ? <ul className="mc-todos">{맨위.map((x) => <일줄 key={x.열쇠} x={x} 했음바꿈={했음바꿈} />)}</ul>
              : <p className="mc-fh">가까운 할 일이 없습니다{날일.some((x) => !x.했음 && x.D > 0) ? '' : ' — 날짜를 더 적으면(✏️ 고치기) 더 나옵니다'}.</p>}
          <div className="btn-row">
            <button type="button" className="btn sm ghost" style={{ width: 'auto' }} onClick={() => { set전체(!전체); if (!전체) 세기('|마이|할일전체') }}>{전체 ? '▲ 가까운 것만' : `📋 전체 보기(${날일.length + 늘일.length})`}</button>
            {H.달력일(날일, 오늘).length > 0 && <button type="button" className="btn sm ghost" style={{ width: 'auto' }} onClick={달력받기}>📲 폰 달력에 넣기</button>}
          </div>
          {전체 && (
            <>
              {늘일.length > 0 && <><h4 className="mc-todo-h">🔁 늘 지킬 것</h4><ul className="mc-todos">{늘일.map((x) => <일줄 key={x.열쇠} x={x} 했음바꿈={했음바꿈} />)}</ul></>}
              <p className="mc-fh">날짜는 «낙찰 뒤 할 일 달력» · «공사안전보건대장» 과 같은 셈입니다(일마다 근거 조문). 발주처 공고 · 계약 특수조건이 다르면 그것을 따르십시오.</p>
            </>
          )}
        </div>
      )}
      {말 && <div className="claudesay good"><b>✓</b><span>{말}</span></div>}
    </section>
  )
}
