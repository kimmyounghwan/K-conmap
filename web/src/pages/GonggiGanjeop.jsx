import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import * as K from '../lib/공기간접비.js'
import * as H from '../lib/내현장.js'
import { use그림인쇄 } from '../tools/그림인쇄훅.js'
import 도구설명 from '../tools/도구설명.jsx'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'
import 잠금문의 from '../잠금문의.jsx'
import { 열림띠, 손님보기켬 } from '../예시한도.jsx'

/**
 * ⏳ G785 (2026-11-19) 공기연장 간접비 산정(/tools/gonggi-ganjeopbi) — 늘어난 기간의 실비를 산정서 한 벌로
 *   소장님 「하나로 연결시켜서 도구화 가능해」 → 공무 올인원 차례 ② (우리가 할 수 있는 것만 · 못 한다는 글 없이)
 *   ■ 셈은 lib/공기간접비.js 한 곳(시험 tools/시험_공기간접비.mjs · 화면 tools/시험_공기간접비화면.mjs)
 *   ■ 실비 산정: 간접노무비(직종 × 인원 × 월 임금 × 투입 개월 — 달력대로) · 경비(직접계상 · 장비 유휴) · 승률 비목(산출내역서 율) · 일반관리비 · 이윤 · 부가세
 *   ■ 요율 방식: 지방 공사만(지방 집행기준 제1장 제8절 2.자 — 실비 산정이 안 될 때 협의)
 *   ■ 내역서(원가계산서)에서 율 · 금액 읽기(선택) · 내 현장 값 넣기 · 📄 그림 PDF · 🖨 인쇄 · 이 기기에만 저장(kcm.공기간접비)
 *   ■ 숨은 셈: |공기간접비|예시 · 내역읽기 · 현장넣기 (PDF · 인쇄는 훅이 |공기간접비|PDF · 인쇄)
 * 🔒 (11-19) 소장님 «이 도구도 잠글까요?» → 「잠가」 — 잠근 도구 12번째(G690 · G784b 꼴 그대로 · 예시한도.jsx)
 *   ■ 씀 = 소장님 기기(lib/운영자.js 나운영자) · 열쇠말(lib/gate.js) — 그 밖의 분은 🔒 문의 상자 + 🧪 예시 산정서(지어낸 현장 · 보기만)
 *   ■ 손님: 입력 칸 · 내역서 읽기 · 내 현장 값 · 저장 없음 · PDF · 인쇄 단추 대신 문의(받기대신문의) · «🔒 예시는 보기만» 알림(kcm-예시끝)
 *   ■ 숨은 셈 더함: |공기간접비|열쇠 · |잠금문의|공기간접비
 */

const 숫자만 = (v) => String(v ?? '').replace(/[^\d]/g, '')
const 쉼 = (v) => { const s = 숫자만(v); return s ? Number(s).toLocaleString('ko-KR') : '' }
const 소수만 = (v) => { const t = String(v ?? '').replace(/[^\d.]/g, ''); const i = t.indexOf('.'); return i < 0 ? t : t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '') }
const 오늘 = () => H.오늘날()
const 퍼센트 = (v) => (v === null || v === undefined ? '' : String(Math.round(v * 1e4) / 1e4))

export default function GonggiGanjeop() {
  const [씀원, set씀] = useState(() => isOpen())
  const 손님보기 = 손님보기켬()   // 👀 G690 소장님 기기에서 «손님 화면으로 보기»(이 탭만)
  const 씀 = 씀원 && !손님보기
  const [예시보임, set예시보임] = useState(false)
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  const [st, setSt] = useState(() => K.읽기())
  const [저장됨, set저장됨] = useState(true)
  const [말, set말] = useState('')
  const [묻기, set묻기] = useState('')
  const [읽는중, set읽는중] = useState('')
  const 미리 = useRef(null)
  const [폭, set폭] = useState(0)
  const [크게, set크게] = useState(false)
  useEffect(() => { document.title = '공기연장 간접비 산정 — 늘어난 기간의 실비 | K-건설맵' }, [])
  useEffect(() => { let 살 = true; 나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {}); return () => { 살 = false } }, [])
  useEffect(() => { if (씀) set저장됨(K.쓰기(st)) }, [st, 씀])   /* 🔒 손님은 저장하지 않음(예시는 보기만) */
  useEffect(() => {
    const el = 미리.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => set폭(el.clientWidth))
    ro.observe(el); set폭(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  /* 🏗 처음 열 때 — 아무것도 안 적었고 마이컨맵 «내 현장» 이 있으면 그 현장 값으로 */
  const 현장 = H.지금현장(H.읽기())
  const 현장값 = (h) => ({ 공사명: h.현장, 발주: h.발주, 회사: h.회사 || '', 계약금액: h.계약금액 ? String(h.계약금액) : '', 착공: h.착공, 당초: h.준공, 갈래: h.갈래 === '지자체' ? '지방' : '국가' })
  useEffect(() => {
    if (!씀 || !현장 || st.공사명 || st.착공 || st.당초 || st.변경) return
    setSt((s) => ({ ...s, ...현장값(현장) }))
    set말(`🏗 마이컨맵 «내 현장» «${현장.현장}» 값(공사명 · 발주 · 금액 · 착공 · 준공)을 넣었습니다 — 변경 준공일을 넣으세요.`)
  }, [씀])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 🔒 손님은 예시(지어낸 현장)만 — 셈 · 산정서도 예시로 */
  const 예시st = useMemo(() => K.예시(), [])
  const S = 씀 ? st : 예시st
  const 지방 = S.갈래 === '지방'
  const 요율 = 지방 && S.방식 === '요율'
  const R = useMemo(() => (요율 ? K.요율셈(S) : K.실비셈(S)), [S, 요율])
  const 연 = R.연장
  const 개월 = 연.일수 ? K.달력개월(연.시작, 연.끝) : 0

  const 칸 = (k, v) => setSt((s) => ({ ...s, [k]: v }))
  const 줄칸 = (무엇, id, k, v) => setSt((s) => ({ ...s, [무엇]: s[무엇].map((r) => (r.id === id ? { ...r, [k]: v } : r)) }))
  const 줄더 = (무엇, r) => setSt((s) => ({ ...s, [무엇]: [...s[무엇], r] }))
  const 줄뺌 = (무엇, id) => setSt((s) => ({ ...s, [무엇]: s[무엇].filter((r) => r.id !== id) }))
  const 요칸 = (k, v) => setSt((s) => ({ ...s, 요율: { ...s.요율, [k]: v } }))
  const 법정칸 = (id, k, v) => setSt((s) => ({ ...s, 요율: { ...s.요율, 법정: s.요율.법정.map((r) => (r.id === id ? { ...r, [k]: v } : r)) } }))
  const 갈래바꿈 = (k) => setSt((s) => ({ ...s, 갈래: k, 방식: k === '지방' ? s.방식 : '실비' }))

  const 예시 = () => { setSt(K.예시()); set묻기(''); 세기('|공기간접비|예시'); set말('🧪 예시를 채웠습니다 — 지어낸 현장 · 회사(○○)와 가상 금액입니다. 칸을 바꾸면 바로 다시 셈합니다.') }
  const 손님예시 = () => { set예시보임(true); 세기('|공기간접비|예시') }
  const 새로 = () => { setSt(K.빈것()); set묻기(''); set말('새로 시작합니다.') }
  const 현장넣기 = () => { if (!현장) return; setSt((s) => ({ ...s, ...현장값(현장) })); 세기('|공기간접비|현장넣기'); set말(`🏗 «${현장.현장}» 값을 넣었습니다.`) }

  /* 📥 내역서(원가계산서)에서 율 · 금액 읽기 — 대상: '산출'(계약 내역서) · '예정'(설계 · 예정가격) */
  const 내역읽기 = async (file, 대상 = '산출') => {
    if (!file) return
    set읽는중(대상); set말('')
    try {
      const [엑셀, 원가계산] = await Promise.all([import('../lib/qtoxlsx.js'), import('../lib/원가계산.js')])   /* 쓸 때만 부름(첫 화면 가볍게) */
      const 책 = 엑셀.readWorkbook(await file.arrayBuffer())
      const 원가 = 원가계산.원가시트찾기(책)
      const v = K.원가에서(원가)
      if (!원가 || !원가.줄 || !원가.줄.length) { set말('원가계산서 시트를 찾지 못했습니다 — 율은 원가계산서를 보고 직접 넣어 주세요.'); return }
      const 율줄 = [['산재보험료', v.산재], ['고용보험료', v.고용], ['기타경비', v.기타]]
      const 읽은 = []
      if (대상 === '예정') {
        if (v.간접노무비) 읽은.push(`예정가격 상 간접노무비 ${K.원(v.간접노무비)}원`)
        if (v.경비) 읽은.push(`경비 ${K.원(v.경비)}원`)
      } else {
        for (const [이름, 율] of 율줄) if (율 !== null) 읽은.push(`${이름} ${퍼센트(율)}%`)
        if (v.일반 !== null) 읽은.push(`일반관리비 ${퍼센트(v.일반)}%`)
        if (v.이윤 !== null) 읽은.push(`이윤 ${퍼센트(v.이윤)}%`)
        if (요율 && v.간접노무비) 읽은.push(`산출내역서 상 간접노무비 ${K.원(v.간접노무비)}원`)
        if (요율 && v.경비) 읽은.push(`경비 ${K.원(v.경비)}원`)
      }
      setSt((s) => {
        if (대상 === '예정') return { ...s, 요율: { ...s.요율, ...(v.간접노무비 ? { 예간노: String(v.간접노무비) } : {}), ...(v.경비 ? { 예경비: String(v.경비) } : {}) } }
        let 승률 = [...s.승률]
        for (const [이름, 율] of 율줄) {
          if (율 === null) continue
          const k = 승률.findIndex((r) => String(r.이름).replace(/\s+/g, '') === 이름)
          if (k >= 0) 승률[k] = { ...승률[k], 율: 퍼센트(율) }
          else 승률 = [...승률, K.빈승률({ 이름, 율: 퍼센트(율) })]
        }
        return {
          ...s, 승률,
          ...(v.일반 !== null ? { 일반: 퍼센트(v.일반) } : {}),
          ...(v.이윤 !== null ? { 이윤: 퍼센트(v.이윤) } : {}),
          요율: { ...s.요율, ...(v.간접노무비 ? { 산간노: String(v.간접노무비) } : {}), ...(v.경비 ? { 산경비: String(v.경비) } : {}) },
        }
      })
      세기('|공기간접비|내역읽기')
      set말(읽은.length ? `📥 «${원가.시트}» 에서 읽었습니다 — ${읽은.join(' · ')}. ${대상 === '예정' ? '설계내역서(예정가격)의 금액' : '계약 내역서의 율'}인지 한 번 보세요.` : `«${원가.시트}» 에 율 · 금액이 적혀 있지 않습니다 — 직접 넣어 주세요.`)
    } catch (e) {
      set말('내역서를 읽지 못했습니다 — 엑셀(.xlsx · .xls) 파일인지 보세요.')
    } finally { set읽는중('') }
  }

  const 그 = use그림인쇄(['공기연장_간접비_산정서', String(S.공사명 || '').trim()].filter(Boolean).join('_'), { 셈: '공기간접비', 쪽: { 폭: 186, 높: 273 }, 여백: [12, 12], 종이: [210, 297], 판쪽: 'rk세로', 칸줄: true })
  const 좁음 = 폭 > 0 && 폭 - 22 < 780
  const 맞춤 = 좁음 && !크게 ? Math.max(0.3, (폭 - 22) / 780) : 1
  const 노무근거 = 지방
    ? '노무량 × 시행규칙 제7조 해당 직종 단가 — 실제 지급 임금수준을 넘지 못함 · 직종 단가가 없으면 급여 · 연말정산서류 · 임금지급대장으로 확인된 사유 발생 전 최근 3개월 평균(지방 집행기준 제1장 제8절 2.가)'
    : '노무량 × 급여 연말정산서 · 임금지급대장 · 현장확인복명서로 지급이 확인된 임금 — 정상 공사기간 중 실제 지급 임금수준을 넘지 못함(정부 입찰ㆍ계약 집행기준 제73조①)'

  return (
    <>
    <div className="kcm-인쇄안내">{씀 ? <>🖨 공기연장 간접비 산정서는 화면의 <b>«📄 산정서 PDF 저장»</b> 또는 <b>«🖨 인쇄»</b> 단추로 인쇄해 주세요.</> : <>🔒 공기연장 간접비 산정서는 K-건설맵에 문의해 주세요.</>}</div>
    <div className="wrap ggj 그림만인쇄">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>⏳ 공기연장 간접비 산정 — 늘어난 기간의 실비를 산정서 한 벌로</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          책임 없는 사유로 공사기간이 늘면 늘어난 기간의 <b>간접노무비 · 경비 · 보증수수료 · 장비 유휴비</b>와 그에 붙는 <b>일반관리비 · 이윤</b>을 실비 범위에서 청구합니다.
          준공일 두 개와 현장 인원 · 월 임금 · 영수증 금액을 넣으면 달력대로 개월을 나눠 셈하고, 산정서를 PDF 로 냅니다.
        </p>
        <div className="ggj-badges">
          <span>근거: {지방 ? '지방자치단체 입찰 및 계약집행기준 제1장 제8절' : '정부 입찰ㆍ계약 집행기준 제72조 · 제73조 · 공사계약일반조건 제23조'}</span>
          {씀 && <span>💾 이 기기에만 저장 {저장됨 ? '' : <b className="ggj-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>}
        </div>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 문의해 주세요</b> — 공기연장 간접비 산정서는 K-건설맵이 직접 작성해 드립니다(견본 먼저 · 최저가). <잠금문의 도구="공기연장 간접비 산정" 셈="공기간접비" />
            {' '}<button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={손님예시}>🧪 예시 산정서 보기</button>로 어떤 산정서가 나오는지 보실 수 있습니다(보기만).
            {' '}<예시본수 열쇠="|공기간접비|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set예시보임(false); 세기('|공기간접비|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
          </div>
        )}
        {씀 && <div className="ggj-btns">
          <button type="button" className="btn line sm" onClick={예시}>🧪 예시로 해 보기</button>
          {현장 && <button type="button" className="btn line sm" onClick={현장넣기}>🏗 내 현장 «{현장.현장.slice(0, 16)}» 값 넣기</button>}
          {묻기 === 'new'
            ? <><button type="button" className="btn line sm ggj-warn" onClick={새로}>정말 새로 시작</button><button type="button" className="btn line sm" onClick={() => set묻기('')}>그대로</button></>
            : <button type="button" className="btn line sm" onClick={() => set묻기('new')}>＋ 새로</button>}
        </div>}
        {씀 && 말 && <div className="note sm" role="status">{말}</div>}
      </div>
      <열림띠 열림={씀원} 손님보기={손님보기} />

      {씀 && <>

      {/* ① 공사 · 기간 */}
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>① 공사 · 늘어난 기간</div>
        <div className="fm-ctl-row ggj-chips" role="group" aria-label="발주 갈래">
          {K.갈래들.map((g) => <button key={g.k} type="button" className={'fm-chip' + (st.갈래 === g.k ? ' on' : '')} aria-pressed={st.갈래 === g.k} onClick={() => 갈래바꿈(g.k)}>{g.이름}</button>)}
        </div>
        <div className="ggj-form">
          <label className="w2">공사명<input className="inp" value={st.공사명} onChange={(e) => 칸('공사명', e.target.value)} placeholder="계약서의 공사명" /></label>
          <label>계약상대자(상호)<input className="inp" value={st.회사} onChange={(e) => 칸('회사', e.target.value)} placeholder="예: ○○건설(주)" /></label>
          <label>대표자<input className="inp" value={st.대표} onChange={(e) => 칸('대표', e.target.value)} /></label>
          <label>발주기관<input className="inp" value={st.발주} onChange={(e) => 칸('발주', e.target.value)} /></label>
          <label>계약금액(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(st.계약금액)} onChange={(e) => 칸('계약금액', 숫자만(e.target.value))} /></label>
          <label>착공일<input className="inp" type="date" value={st.착공} onChange={(e) => 칸('착공', e.target.value)} /></label>
          <label>당초 준공일<input className="inp" type="date" value={st.당초} onChange={(e) => 칸('당초', e.target.value)} /></label>
          <label>변경 준공일<input className="inp" type="date" value={st.변경} onChange={(e) => 칸('변경', e.target.value)} /></label>
          <label>작성일<span className="ggj-inline"><input className="inp" type="date" value={st.작성} onChange={(e) => 칸('작성', e.target.value)} />{!st.작성 && <button type="button" className="tp-x" onClick={() => 칸('작성', 오늘())}>오늘</button>}</span></label>
          <label className="w2">연장 사유<input className="inp" value={st.사유} onChange={(e) => 칸('사유', e.target.value)} placeholder="예: 발주기관 사정으로 용지보상 지연" /></label>
        </div>
        <div className={'ggj-period' + (연.틀림 ? ' bad' : '')} role="status">
          {연.틀림 ? `⚠️ ${연.틀림}` : 연.일수 ? <>늘어난 기간 <b>{K.점날(연.시작)} ~ {K.점날(연.끝)}</b> · <b>{연.일수}일</b> · 달력으로 <b>{개월}개월</b></> : '당초 · 변경 준공일을 넣으면 늘어난 기간이 나옵니다.'}
        </div>
        {지방 && (
          <>
            <div className="fm-ctl-k" style={{ marginTop: 12 }}>산정 방식</div>
            <div className="fm-ctl-row ggj-chips" role="group" aria-label="산정 방식">
              {K.방식들.map((m) => <button key={m.k} type="button" className={'fm-chip' + (st.방식 === m.k ? ' on' : '')} aria-pressed={st.방식 === m.k} onClick={() => 칸('방식', m.k)}>{m.이름}</button>)}
            </div>
            {요율 && <div className="note sm">요율 방식은 노무비 · 경비 등의 산정이 이루어지지 않을 때 계약당사자 협의로 쓰는 방식입니다(지방 집행기준 제1장 제8절 2.자).</div>}
          </>
        )}
      </div>

      {!요율 && <>
        {/* ② 간접노무비 */}
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>② 간접노무비 — 현장 유지 · 관리 인력</div>
          <div className="note sm">{노무근거}</div>
          <datalist id="ggj-직종">{K.직종보기.map((x) => <option key={x} value={x} />)}</datalist>
          <div className="ggj-rows">
            {R.사람.map((x, i) => (
              <div className="ggj-row" key={x.r.id}>
                <div className="ggj-row-h"><b className="ggj-no">{i + 1}</b><span className="ggj-sum">{x.금액 ? <><b>{K.원(x.금액)}</b>원</> : <span className="muted">인원 · 월 임금을 넣으세요</span>}</span><button type="button" className="tp-x" aria-label={`${i + 1}번 직종 지우기`} onClick={() => 줄뺌('사람', x.r.id)}>✕</button></div>
                <div className="ggj-f">
                  <label>직종<input className="inp" list="ggj-직종" value={x.r.직종} onChange={(e) => 줄칸('사람', x.r.id, '직종', e.target.value)} placeholder="예: 현장대리인" /></label>
                  <label>인원<input className="inp ggj-num" inputMode="numeric" value={x.r.인원} onChange={(e) => 줄칸('사람', x.r.id, '인원', 숫자만(e.target.value))} /></label>
                  <label>월 임금(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(x.r.월임금)} onChange={(e) => 줄칸('사람', x.r.id, '월임금', 숫자만(e.target.value))} placeholder="임금지급대장 금액" /></label>
                  <label>투입 개월<input className="inp ggj-num" inputMode="decimal" value={x.r.개월} onChange={(e) => 줄칸('사람', x.r.id, '개월', 소수만(e.target.value))} placeholder={개월 ? `${개월} (늘어난 기간)` : '개월'} /></label>
                  <label className="w2">비고<input className="inp" value={x.r.비고} onChange={(e) => 줄칸('사람', x.r.id, '비고', e.target.value)} placeholder="예: 하도급(○○) · 증빙" /></label>
                </div>
              </div>
            ))}
          </div>
          <div className="ggj-btns"><button type="button" className="btn sm" onClick={() => 줄더('사람', K.빈사람())}>＋ 직종 더하기</button></div>
          <div className="ggj-sub">간접노무비 계 <b>{K.원(R.간접노무비)}</b>원 <span className="muted">— 투입 개월을 비우면 늘어난 기간({개월}개월)으로 셉니다.</span></div>
        </div>

        {/* ③ 경비 */}
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>③ 경비 — 영수증 · 계약서로 확인한 금액</div>
          <div className="note sm">지급임차료 · 보관비 · 가설비 · 보증수수료 등은 계약서 · 요금고지서 · 영수증으로 확인한 금액을 «단가 × 수량»으로 넣습니다(월 임차료 × 개월 등). 하도급업체가 쓴 비용도 넣을 수 있습니다.</div>
          <datalist id="ggj-비목">{K.경비보기.map((x) => <option key={x} value={x} />)}</datalist>
          <div className="ggj-rows">
            {R.경비.map((x, i) => (
              <div className="ggj-row" key={x.r.id}>
                <div className="ggj-row-h"><b className="ggj-no">{i + 1}</b><span className="ggj-sum">{x.금액 ? <><b>{K.원(x.금액)}</b>원</> : <span className="muted">단가를 넣으세요</span>}</span><button type="button" className="tp-x" aria-label={`${i + 1}번 경비 지우기`} onClick={() => 줄뺌('경비', x.r.id)}>✕</button></div>
                <div className="ggj-f">
                  <label>비목<input className="inp" list="ggj-비목" value={x.r.비목} onChange={(e) => 줄칸('경비', x.r.id, '비목', e.target.value)} placeholder="예: 지급임차료" /></label>
                  <label className="w2">산출 내용<input className="inp" value={x.r.내용} onChange={(e) => 줄칸('경비', x.r.id, '내용', e.target.value)} placeholder="예: 현장사무실 임차(월)" /></label>
                  <label>단가(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(x.r.단가)} onChange={(e) => 줄칸('경비', x.r.id, '단가', 숫자만(e.target.value))} /></label>
                  <label>수량<input className="inp ggj-num" inputMode="decimal" value={x.r.수량} onChange={(e) => 줄칸('경비', x.r.id, '수량', 소수만(e.target.value))} placeholder="1" /></label>
                  <label className="w2">증빙<input className="inp" value={x.r.증빙} onChange={(e) => 줄칸('경비', x.r.id, '증빙', e.target.value)} placeholder="예: 임대차계약서 · 영수증" /></label>
                </div>
              </div>
            ))}
          </div>
          <div className="ggj-btns">
            <button type="button" className="btn sm" onClick={() => 줄더('경비', K.빈경비({ 수량: 개월 ? String(개월) : '' }))}>＋ 경비 줄{개월 ? ` (수량 ${개월}개월)` : ''}</button>
            <button type="button" className="btn line sm" onClick={() => 줄더('장비', K.빈장비())}>＋ 장비 유휴</button>
          </div>
          {R.장비.length > 0 && (
            <div className="ggj-rows ggj-eq">
              <div className="fm-ctl-k">장비 유휴비 — 장비가 놀게 되면 바로 계약담당{지방 ? '자' : '공무원'}과 공사감독관에게 알립니다</div>
              {R.장비.map((x, i) => (
                <div className="ggj-row" key={x.r.id}>
                  <div className="ggj-row-h"><b className="ggj-no">{i + 1}</b>
                    <div className="fm-ctl-row" role="group" aria-label="장비 구분">
                      {['보유', '임대'].map((k) => <button key={k} type="button" className={'fm-chip' + (x.r.꼴 === k ? ' on' : '')} aria-pressed={x.r.꼴 === k} onClick={() => 줄칸('장비', x.r.id, '꼴', k)}>{k}장비</button>)}
                    </div>
                    <span className="ggj-sum">{x.금액 ? <><b>{K.원(x.금액)}</b>원</> : ''}</span><button type="button" className="tp-x" aria-label={`${i + 1}번 장비 지우기`} onClick={() => 줄뺌('장비', x.r.id)}>✕</button></div>
                  <div className="ggj-f">
                    <label className="w2">장비<input className="inp" value={x.r.이름} onChange={(e) => 줄칸('장비', x.r.id, '이름', e.target.value)} placeholder="예: 굴착기 0.6㎥" /></label>
                    {x.r.꼴 === '임대'
                      ? <label>실제 부담한 임대료(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(x.r.임대료)} onChange={(e) => 줄칸('장비', x.r.id, '임대료', 숫자만(e.target.value))} /></label>
                      : <>
                        <label>장비가격(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(x.r.가격)} onChange={(e) => 줄칸('장비', x.r.id, '가격', 숫자만(e.target.value))} /></label>
                        <label>시간당 손료계수<input className="inp ggj-num" inputMode="decimal" value={x.r.계수} onChange={(e) => 줄칸('장비', x.r.id, '계수', 소수만(e.target.value))} placeholder="×10⁻⁷ 값 또는 소수" />{K.계수읽기(x.r.계수) > 0 && <span className="ggj-to">= {K.계수읽기(x.r.계수).toPrecision(4)}</span>}</label>
                        <label>연간표준가동{지방 ? '시간' : '기간'}(시간)<input className="inp ggj-num" inputMode="numeric" value={x.r.연간} onChange={(e) => 줄칸('장비', x.r.id, '연간', 숫자만(e.target.value))} /></label>
                        <label>유휴일수<input className="inp ggj-num" inputMode="numeric" value={x.r.유휴일} onChange={(e) => 줄칸('장비', x.r.id, '유휴일', 숫자만(e.target.value))} /></label>
                      </>}
                  </div>
                  <div className="ggj-to">{x.식}</div>
                </div>
              ))}
            </div>
          )}
          <div className="ggj-sub">경비(직접계상) 계 <b>{K.원(R.직접경비 + R.장비합)}</b>원</div>
        </div>
      </>}

      {요율 && (
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>② 요율 방식 — 늘어난 기간 ÷ 전체 계약기간</div>
          <div className="ggj-form">
            <label>전체 계약기간(일)<input className="inp ggj-num" inputMode="numeric" value={st.요율.전체} onChange={(e) => 요칸('전체', 숫자만(e.target.value))} placeholder={K.기간일수(st.착공, st.당초) ? `${K.기간일수(st.착공, st.당초)} (착공일 ~ 당초 준공일)` : '일'} /></label>
            <label>늘어난 기간(일)<input className="inp ggj-num" value={연.일수 || ''} readOnly aria-readonly="true" /></label>
          </div>
          <div className="fm-ctl-row ggj-chips" role="group" aria-label="예정가격 작성">
            <button type="button" className={'fm-chip' + (st.요율.예정 !== false ? ' on' : '')} aria-pressed={st.요율.예정 !== false} onClick={() => 요칸('예정', true)}>예정가격을 작성한 공사</button>
            <button type="button" className={'fm-chip' + (st.요율.예정 === false ? ' on' : '')} aria-pressed={st.요율.예정 === false} onClick={() => 요칸('예정', false)}>예정가격을 작성하지 않은 공사</button>
          </div>
          {st.요율.예정 !== false
            ? <div className="ggj-form">
              <label>예정가격 상 간접노무비(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(st.요율.예간노)} onChange={(e) => 요칸('예간노', 숫자만(e.target.value))} /></label>
              <label>예정가격 상 경비(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(st.요율.예경비)} onChange={(e) => 요칸('예경비', 숫자만(e.target.value))} /></label>
              <label>낙찰률(%)<input className="inp ggj-num" inputMode="decimal" value={st.요율.낙찰률} onChange={(e) => 요칸('낙찰률', 소수만(e.target.value))} placeholder="예: 87.745" /></label>
              <label className="ggj-file">📥 설계내역서(예정가격)에서 읽기<input type="file" accept=".xlsx,.xls" onChange={(e) => { 내역읽기(e.target.files[0], '예정'); e.target.value = '' }} disabled={!!읽는중} /></label>
            </div>
            : <div className="ggj-form">
              <label>산출내역서 상 간접노무비(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(st.요율.산간노)} onChange={(e) => 요칸('산간노', 숫자만(e.target.value))} /></label>
              <label>산출내역서 상 경비(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(st.요율.산경비)} onChange={(e) => 요칸('산경비', 숫자만(e.target.value))} /></label>
            </div>}
          <div className="ggj-sub">간접노무비 <b>{K.원(R.간접노무비)}</b>원 · 기타경비 <b>{K.원(R.기타경비)}</b>원</div>
          <div className="fm-ctl-k" style={{ marginTop: 12 }}>법정경비 · 보험료 · 보증수수료 등 — 계약서 · 고지서 · 영수증 실비</div>
          <div className="ggj-rows">
            {R.법정.map((x, i) => (
              <div className="ggj-row" key={x.r.id}>
                <div className="ggj-row-h"><b className="ggj-no">{i + 1}</b><span className="ggj-sum">{x.금액 ? <><b>{K.원(x.금액)}</b>원</> : ''}</span><button type="button" className="tp-x" aria-label={`${i + 1}번 줄 지우기`} onClick={() => setSt((s) => ({ ...s, 요율: { ...s.요율, 법정: s.요율.법정.filter((r) => r.id !== x.r.id) } }))}>✕</button></div>
                <div className="ggj-f">
                  <label className="w2">비목 · 내용<input className="inp" value={x.r.이름} onChange={(e) => 법정칸(x.r.id, '이름', e.target.value)} placeholder="예: 공사이행보증서 기간 연장 수수료" /></label>
                  <label>금액(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(x.r.금액)} onChange={(e) => 법정칸(x.r.id, '금액', 숫자만(e.target.value))} /></label>
                  <label className="w2">증빙<input className="inp" value={x.r.증빙} onChange={(e) => 법정칸(x.r.id, '증빙', e.target.value)} placeholder="예: 보증수수료 영수증" /></label>
                </div>
              </div>
            ))}
          </div>
          <div className="ggj-btns"><button type="button" className="btn sm" onClick={() => setSt((s) => ({ ...s, 요율: { ...s.요율, 법정: [...s.요율.법정, K.빈법정()] } }))}>＋ 실비 줄</button></div>
        </div>
      )}

      {/* ④ 율 */}
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>{요율 ? '③' : '④'} 산출내역서의 율 — {요율 ? '일반관리비 · 이윤' : '승률 비목 · 일반관리비 · 이윤'}</div>
        <div className="note sm">
          {요율 ? '일반관리비 · 이윤은 산출내역서 상 승률비율로 셉니다.' : '산재보험료 · 고용보험료 · 기타경비 같은 승률 비목은 «늘어난 간접노무비 × 산출내역서의 율»(기준 금액을 직접 넣을 수도 있음), 일반관리비 · 이윤도 산출내역서의 율로 셉니다.'}
          {' '}계약 내역서(엑셀)를 넣으면 원가계산서에서 율을 읽어 채웁니다.
        </div>
        <label className="ggj-file">📥 계약 내역서(산출내역서)에서 율 읽기{읽는중 === '산출' ? ' — 읽는 중…' : ''}<input type="file" accept=".xlsx,.xls" onChange={(e) => { 내역읽기(e.target.files[0], '산출'); e.target.value = '' }} disabled={!!읽는중} /></label>
        {!요율 && (
          <div className="ggj-rows">
            {R.승률.map((x, i) => (
              <div className="ggj-row" key={x.r.id}>
                <div className="ggj-row-h"><b className="ggj-no">{i + 1}</b><span className="ggj-sum">{x.금액 ? <><b>{K.원(x.금액)}</b>원</> : ''}</span><button type="button" className="tp-x" aria-label={`${i + 1}번 승률 지우기`} onClick={() => 줄뺌('승률', x.r.id)}>✕</button></div>
                <div className="ggj-f">
                  <label>비목<input className="inp" value={x.r.이름} onChange={(e) => 줄칸('승률', x.r.id, '이름', e.target.value)} placeholder="예: 산재보험료" /></label>
                  <label>율(%)<input className="inp ggj-num" inputMode="decimal" value={x.r.율} onChange={(e) => 줄칸('승률', x.r.id, '율', 소수만(e.target.value))} placeholder="예: 3.56" /></label>
                  <label>기준 금액
                    <select className="inp" value={x.r.기준 === '직접' ? '직접' : '간접노무비'} onChange={(e) => 줄칸('승률', x.r.id, '기준', e.target.value)}>
                      <option value="간접노무비">늘어난 간접노무비</option>
                      <option value="직접">직접 넣기</option>
                    </select>
                  </label>
                  {x.r.기준 === '직접' && <label>기준 금액(원)<input className="inp ggj-num" inputMode="numeric" value={쉼(x.r.기준금액)} onChange={(e) => 줄칸('승률', x.r.id, '기준금액', 숫자만(e.target.value))} /></label>}
                </div>
              </div>
            ))}
            <div className="ggj-btns"><button type="button" className="btn line sm" onClick={() => 줄더('승률', K.빈승률())}>＋ 승률 비목</button></div>
          </div>
        )}
        <div className="ggj-form">
          <label>일반관리비율(%)<input className="inp ggj-num" inputMode="decimal" value={st.일반} onChange={(e) => 칸('일반', 소수만(e.target.value))} placeholder="산출내역서의 율" /></label>
          <label>이윤율(%)<input className="inp ggj-num" inputMode="decimal" value={st.이윤} onChange={(e) => 칸('이윤', 소수만(e.target.value))} placeholder="산출내역서의 율" /></label>
        </div>
      </div>

      </>}

      {/* ⑤ 결과 — 🔒 손님은 🧪 예시 산정서(지어낸 현장)만 · PDF · 인쇄 단추 대신 문의 */}
      {(씀 || 예시보임) && (
      <div className="card ggj-res">
        {!씀 && (
          <div className="kcm-예시끝 cwarn" role="note">
            🔒 예시는 <b>보기만</b> 됩니다(지어낸 현장 · 회사 ○○) — 내 현장 산정서는 K-건설맵이 직접 작성해 드립니다(견본 먼저 · 최저가).{' '}
            <잠금문의 도구="공기연장 간접비 산정" 셈="공기간접비" />
          </div>
        )}
        <div className="ggj-amt"><span>청구할 금액(부가가치세 포함)</span><b>{K.원(R.합계)}원</b><span className="muted">공급가액 {K.원(R.공급가액)} · 부가가치세 {K.원(R.부가세)}</span></div>
        <ul className="ggj-lines">
          <li><span>간접노무비</span><b>{K.원(R.간접노무비)}</b></li>
          {요율
            ? <><li><span>기타경비</span><b>{K.원(R.기타경비)}</b></li><li><span>법정경비 · 보험료 등</span><b>{K.원(R.법정합)}</b></li></>
            : <><li><span>경비 — 직접계상 · 장비 유휴</span><b>{K.원(R.직접경비 + R.장비합)}</b></li><li><span>경비 — 승률 비목</span><b>{K.원(R.승률합)}</b></li></>}
          <li><span>일반관리비 ({R.일율 || 0}%)</span><b>{K.원(R.일반관리비)}</b></li>
          <li><span>이윤 ({R.이율 || 0}%)</span><b>{K.원(R.이윤)}</b></li>
        </ul>
        {R.알림.length > 0 && <ul className="ggj-al">{R.알림.map((a, i) => <li key={i}>⚠️ {a}</li>)}</ul>}
        {씀 && <div className="ggj-btns">
          <button type="button" className="btn sm" disabled={!!그.찍기} onClick={() => 그.PDF()}>{그.찍기 === 'pdf' ? 'PDF 만드는 중…' : '📄 산정서 PDF 저장 (A4)'}</button>
          <button type="button" className="btn line sm" disabled={!!그.찍기} onClick={() => 그.인쇄()}>{그.찍기 === '인쇄' ? '준비 중…' : '🖨 인쇄'}</button>
        </div>}
        {씀 && 그.말 && <div className="note sm" role="status">{그.말}</div>}
        {좁음 && <button type="button" className="tp-x" style={{ marginTop: 8 }} onClick={() => set크게((v) => !v)}>{크게 ? '🔎 한눈에 보기' : '🔍 크게 보기 (옆으로 밀어 보기)'}</button>}
        <div className="rk-preview ggj-preview" ref={미리}><div style={맞춤 < 1 ? { zoom: 맞춤 } : undefined}><산정종이 st={S} R={R} 요율={요율} /></div></div>
      </div>
      )}

      {/* ⑥ 챙길 것 */}
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>📋 청구 때 챙길 것</div>
        <ul className="ggj-check">
          <li><b>언제까지</b> — 준공대가(장기계속공사는 차수별 준공대가)를 받기 전까지 계약금액 조정을 신청합니다{지방 ? '' : '(공사계약일반조건 제23조⑤ · 제20조⑩)'}.</li>
          <li><b>인력투입계획</b> — 공사기간 변경 사유가 생기면 현장 유지 · 관리 인력투입계획을 냅니다{지방 ? '(제1장 제8절 2.나)' : '(집행기준 제73조②)'}.</li>
          <li><b>자료</b> — 임금지급대장 · 급여 연말정산서류 · 현장확인복명서 · 경비 계약서 · 요금고지서 · 영수증 · 보증수수료 영수증.</li>
          {지방 && <li><b>확인</b> — 사업부서 담당자는 최초 연장일부터 최소 30일 이내에 한 번씩 노무량 · 경비 이행을 확인할 수 있습니다(제1장 제8절 2.아).</li>}
          <li>연장 청구 · 보증서 · 신고 기한은 <Link to="/tools/time-extension">공기연장 때 할 일</Link>, 빈 표로 쓰려면 서식 <Link to="/forms/chg-ganjeopbi">공기연장 간접비 산출서</Link>.</li>
        </ul>
      </div>

      <도구설명 k="gonggi-ganjeop" />
      {씀 && 그.판 && createPortal(<div id="gp-인쇄"><div className="rk-쪽 port"><산정종이 st={S} R={R} 요율={요율} /></div></div>, document.body)}
    </div>
    </>
  )
}

/* ── 산정서 종이(A4 세로) — 화면 미리보기 · 그림 PDF · 인쇄 ── */
const 폭들 = [6, 16, 8, 14, 10, 14, 32]
const 열 = () => { const 합 = 폭들.reduce((a, b) => a + b, 0); return <colgroup>{폭들.map((w, i) => <col key={i} style={{ width: (w / 합 * 100).toFixed(3) + '%' }} />)}</colgroup> }
const C = ({ cs = 1, rs = 1, cl = '', children }) => <td className={'rk-c ' + cl} colSpan={cs} rowSpan={rs}>{children}</td>
const 날짜 = (s) => K.점날(s) || '　　.　.　.'
const 긴날 = (s) => { const t = K.날값(s); if (t == null) return '　　　　년　　월　　일'; const d = new Date(t); return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일` }

export function 산정종이({ st, R, 요율 }) {
  const 연 = R.연장
  const 개월 = 연.일수 ? K.달력개월(연.시작, 연.끝) : 0
  const 지방 = st.갈래 === '지방'
  const 승률글 = (R.승률 || []).filter((x) => x.율).map((x) => `${x.r.이름 || '승률'} ${x.율}%`).join(' · ')
  return (
    <div className="rk-paper port ggj-paper">
      <div className="rk-bigttl">공기연장 간접비 산정서</div>
      <table className="rk-t">
        {열()}
        <tbody>
          <tr><C cs={2} cl="hd">공 사 명</C><C cs={5} cl="l">{st.공사명}</C></tr>
          <tr><C cs={2} cl="hd">계약상대자</C><C cs={2} cl="l">{st.회사}</C><C cl="hd">발주기관</C><C cs={2} cl="l">{st.발주}</C></tr>
          <tr><C cs={2} cl="hd">계약금액</C><C cs={2} cl="r">{st.계약금액 ? `${K.원(K.수(st.계약금액))} 원` : ''}</C><C cl="hd">당초 계약기간</C><C cs={2}>{st.착공 || st.당초 ? `${날짜(st.착공)} ~ ${날짜(st.당초)}` : ''}</C></tr>
          <tr><C cs={2} cl="hd">변경 준공일</C><C cs={2}>{K.점날(st.변경)}</C><C cl="hd">늘어난 기간</C><C cs={2}>{연.일수 ? `${K.점날(연.시작)} ~ ${K.점날(연.끝)}\n${연.일수}일 · ${개월}개월` : ''}</C></tr>
          <tr><C cs={2} cl="hd">연장 사유</C><C cs={5} cl="l">{st.사유}</C></tr>
        </tbody>
      </table>

      <div className="rk-sec">1. 총괄</div>
      <table className="rk-t">
        {열()}
        <tbody>
          <tr><C cs={3} cl="hd">비 목</C><C cs={2} cl="hd">금액 (원)</C><C cs={2} cl="hd">산출 근거</C></tr>
          <tr><C cs={3} cl="l">간접노무비</C><C cs={2} cl="r">{K.원(R.간접노무비)}</C><C cs={2} cl="l sm">{요율 ? R.간식 : '인원 × 월 임금 × 투입 개월 (2. 명세)'}</C></tr>
          {요율
            ? <>
              <tr><C cs={3} cl="l">기타경비</C><C cs={2} cl="r">{K.원(R.기타경비)}</C><C cs={2} cl="l sm">{R.경식}</C></tr>
              <tr><C cs={3} cl="l">법정경비 · 보험료 등</C><C cs={2} cl="r">{K.원(R.법정합)}</C><C cs={2} cl="l sm">계약서 · 고지서 · 영수증 실비 (3. 명세)</C></tr>
            </>
            : <>
              <tr><C cs={3} cl="l">경비 — 직접계상</C><C cs={2} cl="r">{K.원(R.직접경비)}</C><C cs={2} cl="l sm">단가 × 수량 (3. 명세)</C></tr>
              {R.장비.length > 0 && <tr><C cs={3} cl="l">경비 — 장비 유휴비</C><C cs={2} cl="r">{K.원(R.장비합)}</C><C cs={2} cl="l sm">4. 명세</C></tr>}
              <tr><C cs={3} cl="l">경비 — 승률 비목</C><C cs={2} cl="r">{K.원(R.승률합)}</C><C cs={2} cl="l sm">{승률글 ? `${승률글} (5. 명세)` : ''}</C></tr>
            </>}
          <tr><C cs={3} cl="l">일반관리비</C><C cs={2} cl="r">{K.원(R.일반관리비)}</C><C cs={2} cl="l sm">{`(간접노무비 + 경비) × ${R.일율 || 0}%`}</C></tr>
          <tr><C cs={3} cl="l">이 윤</C><C cs={2} cl="r">{K.원(R.이윤)}</C><C cs={2} cl="l sm">{`(간접노무비 + 경비 + 일반관리비) × ${R.이율 || 0}%`}</C></tr>
          <tr><C cs={3} cl="hd">공 급 가 액</C><C cs={2} cl="r b">{K.원(R.공급가액)}</C><C cs={2} /></tr>
          <tr><C cs={3} cl="l">부가가치세</C><C cs={2} cl="r">{K.원(R.부가세)}</C><C cs={2} cl="l sm">공급가액 × 10%</C></tr>
          <tr><C cs={3} cl="hd">합　　계</C><C cs={2} cl="r b">{K.원(R.합계)}</C><C cs={2} /></tr>
        </tbody>
      </table>

      {요율
        ? <>
          <div className="rk-sec">2. 요율 산정</div>
          <table className="rk-t">
            {열()}
            <tbody>
              <tr><C cs={3} cl="hd">전체 계약기간</C><C cs={4} cl="l">{R.전체 ? `${R.전체}일` : ''}</C></tr>
              <tr><C cs={3} cl="hd">늘어난 기간</C><C cs={4} cl="l">{연.일수 ? `${연.일수}일 (${K.점날(연.시작)} ~ ${K.점날(연.끝)})` : ''}</C></tr>
              <tr><C cs={3} cl="hd">예정가격 작성</C><C cs={4} cl="l">{st.요율.예정 !== false ? `작성한 공사 · 낙찰률 ${Math.round((R.낙찰률 || 0) * 1e6) / 1e4}%` : '작성하지 않은 공사'}</C></tr>
              {st.요율.예정 !== false
                ? <><tr><C cs={3} cl="hd">예정가격 상 간접노무비</C><C cs={4} cl="r">{K.원(K.수(st.요율.예간노))}</C></tr><tr><C cs={3} cl="hd">예정가격 상 경비</C><C cs={4} cl="r">{K.원(K.수(st.요율.예경비))}</C></tr></>
                : <><tr><C cs={3} cl="hd">산출내역서 상 간접노무비</C><C cs={4} cl="r">{K.원(K.수(st.요율.산간노))}</C></tr><tr><C cs={3} cl="hd">산출내역서 상 경비</C><C cs={4} cl="r">{K.원(K.수(st.요율.산경비))}</C></tr></>}
            </tbody>
          </table>
          <div className="rk-sec">3. 법정경비 · 보험료 등 명세</div>
          <table className="rk-t">
            {열()}
            <tbody>
              <tr><C cl="hd">번호</C><C cs={3} cl="hd">비목 · 내용</C><C cl="hd">금액 (원)</C><C cs={2} cl="hd">증빙</C></tr>
              {R.법정.length === 0 && <tr><C cs={7}>(적은 줄이 없습니다)</C></tr>}
              {R.법정.map((x, i) => <tr key={x.r.id}><C>{i + 1}</C><C cs={3} cl="l">{x.r.이름}</C><C cl="r">{K.원(x.금액)}</C><C cs={2} cl="l sm">{x.r.증빙}</C></tr>)}
              <tr><C cs={4} cl="hd">계</C><C cl="r b">{K.원(R.법정합)}</C><C cs={2} /></tr>
            </tbody>
          </table>
        </>
        : <>
          <div className="rk-sec">2. 간접노무비 명세</div>
          <table className="rk-t">
            {열()}
            <tbody>
              <tr><C cl="hd">번호</C><C cl="hd">직 종</C><C cl="hd">인원</C><C cl="hd">월 임금 (원)</C><C cl="hd">투입 개월</C><C cl="hd">금액 (원)</C><C cl="hd">비 고</C></tr>
              {R.사람.length === 0 && <tr><C cs={7}>(적은 줄이 없습니다)</C></tr>}
              {R.사람.map((x, i) => <tr key={x.r.id}><C>{i + 1}</C><C cl="l">{x.r.직종}</C><C cl="r">{x.인원 || ''}</C><C cl="r">{K.원(x.월임금)}</C><C cl="r">{x.개월 || ''}</C><C cl="r">{K.원(x.금액)}</C><C cl="l sm">{x.r.비고}</C></tr>)}
              <tr><C cs={5} cl="hd">계</C><C cl="r b">{K.원(R.간접노무비)}</C><C /></tr>
            </tbody>
          </table>
          <div className="rk-sec">3. 경비 명세 (직접계상)</div>
          <table className="rk-t">
            {열()}
            <tbody>
              <tr><C cl="hd">번호</C><C cl="hd">비 목</C><C cs={2} cl="hd">산출 내용</C><C cl="hd">단가 × 수량</C><C cl="hd">금액 (원)</C><C cl="hd">증 빙</C></tr>
              {R.경비.length === 0 && <tr><C cs={7}>(적은 줄이 없습니다)</C></tr>}
              {R.경비.map((x, i) => <tr key={x.r.id}><C>{i + 1}</C><C cl="l">{x.r.비목}</C><C cs={2} cl="l">{x.r.내용}</C><C cl="r sm">{`${K.원(x.단가)}\n× ${x.수량}`}</C><C cl="r">{K.원(x.금액)}</C><C cl="l sm">{x.r.증빙}</C></tr>)}
              <tr><C cs={5} cl="hd">계</C><C cl="r b">{K.원(R.직접경비)}</C><C /></tr>
            </tbody>
          </table>
          {R.장비.length > 0 && <>
            <div className="rk-sec">4. 장비 유휴비</div>
            <table className="rk-t">
              {열()}
              <tbody>
                <tr><C cl="hd">번호</C><C cl="hd">장 비</C><C cl="hd">구분</C><C cs={2} cl="hd">산 식</C><C cl="hd">금액 (원)</C><C cl="hd">비 고</C></tr>
                {R.장비.map((x, i) => <tr key={x.r.id}><C>{i + 1}</C><C cl="l">{x.r.이름}</C><C>{x.r.꼴 === '임대' ? '임대' : '보유'}</C><C cs={2} cl="l xs">{x.식}</C><C cl="r">{K.원(x.금액)}</C><C cl="l xs">{x.r.꼴 === '임대' ? '' : `연간표준가동${지방 ? '시간' : '기간'} · 시간당 장비손료계수`}</C></tr>)}
                <tr><C cs={5} cl="hd">계</C><C cl="r b">{K.원(R.장비합)}</C><C /></tr>
              </tbody>
            </table>
          </>}
          <div className="rk-sec">{R.장비.length > 0 ? '5' : '4'}. 승률 비목</div>
          <table className="rk-t">
            {열()}
            <tbody>
              <tr><C cl="hd">번호</C><C cs={2} cl="hd">비 목</C><C cs={2} cl="hd">기준 금액 (원)</C><C cl="hd">율 (%)</C><C cl="hd">금액 (원)</C></tr>
              {R.승률.length === 0 && <tr><C cs={7}>(적은 줄이 없습니다)</C></tr>}
              {R.승률.map((x, i) => <tr key={x.r.id}><C>{i + 1}</C><C cs={2} cl="l">{x.r.이름}</C><C cs={2} cl="r">{K.원(x.기준금액)}{x.r.기준 === '직접' ? '' : '\n(늘어난 간접노무비)'}</C><C cl="r">{x.율 || ''}</C><C cl="r">{K.원(x.금액)}</C></tr>)}
              <tr><C cs={6} cl="hd">계</C><C cl="r b">{K.원(R.승률합)}</C></tr>
            </tbody>
          </table>
        </>}

      <div className="rk-box ggj-box">
        <div>■ 산정 기준{지방 ? ' — 지방자치단체 입찰 및 계약집행기준 제1장 제8절' : ' — 국가계약법 시행령 제66조 · 공사계약일반조건 제23조 · 정부 입찰ㆍ계약 집행기준 제72조 · 제73조'}</div>
        {요율
          ? <>
            <div>· 노무비 · 경비 등의 산정이 이루어지지 않아 계약당사자 협의로 요율 방식 적용(2.자): 예정가격 작성 공사 {'{'}(연장기간 ÷ 전체계약기간) × 예정가격 상 금액 + (연장기간 ÷ 전체계약기간) × 예정가격 상 금액 × 낙찰률{'}'} ÷ 2 · 미작성 (연장기간 ÷ 전체계약기간) × 산출내역서 상 금액</div>
            <div>· 법정경비 및 보험료 등은 계약서 · 고지서 · 영수증 등 실비 확인 · 일반관리비 및 이윤은 산출내역서 상 승률비율</div>
          </>
          : <>
            <div>· 간접노무비: {지방 ? '노무량 × 시행규칙 제7조 해당 직종 단가(실제 지급 임금수준 이내 · 단가가 없으면 사유 발생 전 최근 3개월 평균)' : '노무량 × 급여 연말정산서 · 임금지급대장 · 현장확인복명서로 지급이 확인된 임금(정상 공사기간 실제 지급 임금수준 이내)'} · 투입 개월은 늘어난 기간을 달마다 «그 달에 든 날 ÷ 그 달 날 수» 로 나눔</div>
            <div>· 경비: 계약서 · 요금고지서 · 영수증 등으로 확인한 금액 · 보증기간 연장 비용은 보증수수료 영수증 · 장비 유휴비는 임대 = 실제 부담한 임대료, 보유 = (장비가격 × 시간당 장비손료계수) × (연간표준가동{지방 ? '시간' : '기간'} ÷ 365일) × 유휴일수 × 1/2</div>
            <div>· 승률 비목 · 일반관리비 · 이윤: 산출내역서상 율 · 원 미만 버림</div>
          </>}
      </div>
      <div className="ggj-say">위와 같이 공기연장에 따른 간접비를 산정합니다.</div>
      <div className="ggj-date">{긴날(st.작성)}</div>
      <div className="ggj-sign">계약상대자　　상호 {st.회사 || '　　　　　　　　'}　　대표자 {st.대표 || '　　　　　　'}　　(인)</div>
      <div className="rk-foot"><span /><span className="rk-kc">K-건설맵 k-conmap.com/tools/gonggi-ganjeopbi</span></div>
    </div>
  )
}
