/**
 * 🛡 /tools/jungcheo — 중대재해 안전보건관리체계 한 벌 (2026-10-17)
 *
 * 소장님: 「중처법 …」 「대충 만들지 말고, 사이트에서 가능하게」 「크몽보다 좋아야 해. 반드시, 대충만들지마.」
 *         「오늘 만든 도구 및 서류는 나만 이용하게 해줘 … 예시만 보게 해줘. 이용자는」
 *         「올리는 모든 것은 이용자가 예시를 보면 조회수가 나오게 해줘야 내가 상품성이 있는지 알지」 「조회수는 보이게 해줘」
 * ■ 탭 넷: ① 우리 회사(회사 · 현장 · 협력업체 — 한 번만) ② 진단(호마다 했나 → 빠진 것 · 전담 조직 · 안전관리자 판정)
 *          ③ 서류 한 벌(22가지 · 쪽마다 넘겨 보기 · PDF · 한글 · 워드 · 엑셀) ④ 반기 점검(달력 · 기록 → 반기 보고서)
 * ■ 🔒 씀 = 소장님 브라우저(lib/운영자.js) · 열쇠말(lib/gate.js) — 시공계획서(G300)와 같은 방식.
 *      그 밖의 분은 🧪 예시(지어낸 회사)로 화면 · 서류를 넘겨 볼 수 있고, 적기 · 받기는 잠김.
 * ■ 셈: 🧪 예시 본 수(|중처법|예시 — 화면에 보임 · 소장님 «조회수는 보이게») · 예시 끝 쪽까지 봄(|중처법|예시끝) ·
 *       잠긴 단추 누름(|중처법|잠금) · 받기(|중처법|PDF · 한글 · 워드 · 엑셀) · 열쇠(|중처법|열쇠) — 소장님 · 로봇은 안 셈.
 * ■ 근거 · 판정은 lib/중처법.js 머리말(원문 두 곳 확인). 파일은 이 브라우저 밖으로 나가지 않습니다.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'
import { Row } from '../tools/calcs.jsx'
import 쪽넘기기 from '../tools/쪽그림.jsx'
import * as J from '../lib/중처법.js'

const 탭들 = [['co', '① 우리 회사'], ['dx', '② 진단'], ['doc', '③ 서류 한 벌'], ['half', '④ 반기 점검']]
const 형식표 = {
  pdf: ['PDF', 'application/pdf', '.pdf'],
  hwpx: ['한글', 'application/hwp+zip', '.hwpx'],
  docx: ['워드', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  xlsx: ['엑셀', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
}
const 숨 = () => new Promise((r) => setTimeout(r, 20))
function 저장하기(이름, 바이트, 타입) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(new Blob([바이트], { type: 타입 }))
  a.href = url; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
const 날짧 = (s) => { const [y, m, d] = String(s || '').split('-'); return y && m && d ? `${y.slice(2)}.${m}.${d}` : '' }

export default function Jungcheo() {
  /* 🔒 씀 */
  const [씀, set씀] = useState(() => isOpen())
  const [예시봄, set예시봄] = useState(false)
  const [잠금말, set잠금말] = useState('')
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  useEffect(() => { document.title = '중대재해 안전보건관리체계 한 벌 — 경영방침 · 위험성평가 · 반기 점검 · 보고서 | K-건설맵' }, [])

  const [내것, set내것] = useState(() => J.읽기())
  const [예시것] = useState(() => J.예시회사())
  const [빈것] = useState(() => J.빈회사())
  /* 잠김이면 🧪 예시를 누르기 전에는 빈 칸(누른 수가 «예시 본 수» 가 되게) */
  const c = 씀 && !예시봄 ? 내것 : 예시봄 ? 예시것 : 빈것
  const 바꿈 = (f) => { if (!씀) { 잠김('적기는'); return } set예시봄(false); set내것((x) => f(x)) }
  useEffect(() => { if (씀) J.쓰기(내것) }, [씀, 내것])

  const [탭, set탭] = useState(() => { try { return localStorage.getItem('kcm_jungcheo_tab') || 'co' } catch (e) { return 'co' } })
  useEffect(() => { try { localStorage.setItem('kcm_jungcheo_tab', 탭) } catch (e) { /* */ } }, [탭])
  const [고른, set고른] = useState(() => J.서류목록.map((d) => d.키))
  const 반기목록 = J.반기들(c.기준년)
  const 지금반기 = `${c.기준년}-${Number(J.오늘날().slice(5, 7)) <= 6 ? '상' : '하'}`
  const [반기, set반기] = useState(지금반기)
  useEffect(() => { if (!반기목록.some((h) => h.키 === 반기)) set반기(반기목록[0].키) }, [c.기준년])   // eslint-disable-line react-hooks/exhaustive-deps
  const [쪽번, set쪽번] = useState(0)
  const [내림중, set내림중] = useState('')
  const [오류, set오류] = useState('')

  const 잠김 = (무엇) => { set잠금말(`🔒 ${무엇} 지금 준비 중입니다 — 🧪 예시로 어떻게 나오는지 보실 수 있습니다.`); 세기('|중처법|잠금') }
  /* 🧪 예시 — 기록이 든 상반기를 보여 줌(반기 보고서가 채워진 모습) */
  const 예시 = () => { set예시봄(true); set잠금말(''); set쪽번(0); set반기(`${예시것.기준년}-상`); 세기('|중처법|예시') }

  const 쪽들 = useMemo(() => {
    try { return J.한벌(c, 고른, { 반기 }) } catch (e) { return [] }
  }, [c, 고른, 반기])
  const 적 = J.적용판정(c.회사)
  const 전 = J.전담판정(c.회사, c.현장들)
  const 답 = c.진단 || {}
  const 됨수 = J.묻기들.filter((q) => 답[q.키] === true).length
  const 반 = J.반기셈(c.기록, 반기)

  const 회칸 = (k) => (e) => 바꿈((x) => ({ ...x, 회사: { ...x.회사, [k]: e.target.value } }))
  const 총칸 = (k) => (e) => 바꿈((x) => ({ ...x, 총괄: { ...x.총괄, [k]: e.target.value } }))
  const 줄칸 = (무리, id, k, v) => 바꿈((x) => ({ ...x, [무리]: x[무리].map((r) => (r.id === id ? { ...r, [k]: v } : r)) }))
  const 줄더 = (무리, 빈) => 바꿈((x) => ({ ...x, [무리]: [...(x[무리] || []), { id: J.새번호(), ...빈 }] }))
  const 줄뺌 = (무리, id) => 바꿈((x) => ({ ...x, [무리]: x[무리].filter((r) => r.id !== id) }))
  const 기록칸 = (h, 키, k, v) => 바꿈((x) => ({ ...x, 기록: { ...x.기록, [h]: { ...(x.기록?.[h] || {}), [키]: { ...(x.기록?.[h]?.[키] || {}), [k]: v } } } }))

  const 내려받기 = async (형식) => {
    if (!씀 || 예시봄) { 잠김(형식표[형식][0] + ' 받기는'); return }
    if (!쪽들.length) return
    const [이름, 타입, 끝] = 형식표[형식]
    set내림중(이름); set오류(''); await 숨()
    try {
      const 그림들 = new Map()
      let 바이트
      if (형식 === 'pdf') { const m = await import('../lib/쪽pdf.js'); 바이트 = await m.쪽들PDF(쪽들, 그림들, { 제목: (c.회사.상호 || '') + ' 안전보건관리체계' }) }
      else if (형식 === 'hwpx') { const m = await import('../lib/쪽한글.js'); 바이트 = m.쪽들한글(쪽들, 그림들, { 제목: '안전보건관리체계' }) }
      else if (형식 === 'docx') { const m = await import('../lib/쪽워드.js'); 바이트 = m.쪽들워드(쪽들, 그림들, { 제목: '안전보건관리체계' }) }
      else { const m = await import('../lib/쪽엑셀.js'); 바이트 = m.엑셀책([m.쪽들시트(쪽들, 그림들, '안전보건관리체계')], 그림들) }
      const 파일이름 = String((c.회사.상호 || '회사') + `_안전보건관리체계_${c.기준년}`).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, '_').slice(0, 60) + 끝
      저장하기(파일이름, 바이트, 타입)
      세기('|중처법|' + 이름)
    } catch (e) { set오류(`${이름} 만들기 실패 — ${e?.message || e}`) } finally { set내림중('') }
  }

  /* 서류로 가기 — 그 서류 첫 쪽 */
  const 서류쪽 = useMemo(() => {
    const m = {}
    쪽들.forEach((p, i) => { if (p.제목 && !(p.제목 in m)) m[p.제목] = i })
    return m
  }, [쪽들])

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🛡 중대재해 안전보건관리체계 한 벌</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          회사 · 현장 · 협력업체를 <b>한 번만</b> 적으면 중대재해처벌법 시행령 <b>제4조 1 ~ 9호 · 제5조</b> 서류 22가지가 <b>우리 회사 이름으로 채워져</b> 나옵니다 —
          경영방침 · 목표 · 조직도 · 위험성평가 절차 · 예산 · 권한 부여 · 평가표 · 안전관리자 배치(공사금액별 판정) · 의견 청취 · 비상 매뉴얼 · 연락망 · 훈련 · 협력업체 평가 · 관리비용 · 공사기간 기준 · 법령 의무 점검 · 교육 점검 · <b>반기 보고서</b>.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          가입 없음 · <b>적은 것은 이 브라우저 밖으로 나가지 않습니다.</b> 받는 꼴: <b>PDF</b> · 한글(.hwpx) · 워드 · 엑셀. 진단 · 판정은 법 원문(국가법령정보센터)과 고용노동부 · 안전보건공단 안내서를 두 곳 넘게 확인해 넣었습니다.
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 지금은 준비 중입니다</b> — 우리 회사로 적고 받는 것은 곧 엽니다.
            지금은 <button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시}>🧪 예시 회사</button>로 어떻게 나오는지 미리 보실 수 있습니다.
            {' '}<예시본수 열쇠="|중처법|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set예시봄(false); set잠금말(''); 세기('|중처법|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
          </div>
        )}
        {씀 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { set예시봄((v) => !v); set쪽번(0) }}>{예시봄 ? '↩ 우리 회사로 돌아가기' : '🧪 예시 회사로 보기'}</button>
            <span className="muted" style={{ alignSelf: 'center' }}>{예시봄 ? '🧪 예시(지어낸 회사)를 보고 있습니다 — 고치려면 우리 회사로 돌아가십시오.' : '💾 적은 것은 이 브라우저에 저절로 남습니다.'}</span>
          </div>
        )}
        {잠금말 && <div className="cwarn" style={{ marginTop: 8 }}>{잠금말}</div>}
      </div>

      {/* 한눈에 */}
      <div className="card">
        <div className="jc-sum">
          <div><span>적용</span><b className={적.됨 === false ? 'g' : 적.됨 ? 'r' : ''}>{적.됨 === null ? '—' : 적.됨 ? '대상' : '아님'}</b></div>
          <div><span>전담 조직</span><b className={전.대상 ? 'r' : 'g'}>{전.대상 ? '두어야 함' : '의무 아님'}</b></div>
          <div><span>진단 갖춤</span><b>{됨수} / {J.묻기들.length}</b></div>
          <div><span>{반기목록.find((h) => h.키 === 반기)?.이름 || ''} 점검</span><b className={반.지남 ? 'r' : ''}>{반.한} / {반.모두}</b></div>
        </div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12.5 }}>{적.글}</p>
      </div>

      <div className="eq-tabs" role="tablist">
        {탭들.map(([k, t]) => <button key={k} type="button" role="tab" aria-selected={탭 === k} className={탭 === k ? 'on' : ''} onClick={() => set탭(k)}>{t}</button>)}
      </div>

      {!씀 && !예시봄 && 탭 !== 'doc' && (
        <div className="card jc-tease">
          <b>🧪 예시 회사로 채워 보기</b> — 지어낸 회사(현장 셋 · 협력업체 셋)로 이 칸들이 어떻게 채워지고 서류가 어떻게 나오는지 보십시오.
          <button type="button" className="btn" style={{ width: 'auto', marginLeft: 8 }} onClick={예시}>🧪 예시 보기</button>
        </div>
      )}
      <fieldset disabled={!씀 || 예시봄} className="sg-fs">
      {탭 === 'co' && (
        <>
          <div className="card">
            <div className="sec-title">회사</div>
            <div className="tl-grid">
              <Row label="상호"><input value={c.회사.상호} onChange={회칸('상호')} placeholder="예: ○○건설(주)" /></Row>
              <Row label="경영책임자(대표)"><input value={c.회사.대표} onChange={회칸('대표')} placeholder="성명" /></Row>
              <Row label="직책"><input value={c.회사.직책} onChange={회칸('직책')} placeholder="대표이사" /></Row>
              <Row label="업종"><select value={c.회사.업종} onChange={회칸('업종')}><option value="종합">종합건설업</option><option value="전문">전문건설업</option><option value="기타">그 밖의 업종</option></select></Row>
              <Row label="상시근로자 수" hint="본사 + 현장(협력업체 빼고)"><input inputMode="numeric" value={c.회사.상시} onChange={회칸('상시')} placeholder="예: 86" /></Row>
              <Row label="토목건축 시공능력 순위" hint="종합 · 200위 안이면"><input inputMode="numeric" value={c.회사.순위} onChange={회칸('순위')} placeholder="모르면 비움" /></Row>
              <Row label="본사 주소"><input value={c.회사.주소} onChange={회칸('주소')} /></Row>
              <Row label="작성일"><input type="date" value={c.회사.작성일} onChange={회칸('작성일')} /></Row>
              <Row label="기준 해"><input inputMode="numeric" value={c.기준년} onChange={(e) => 바꿈((x) => ({ ...x, 기준년: Number(String(e.target.value).replace(/\D/g, '').slice(0, 4)) || x.기준년 }))} /></Row>
            </div>
          </div>
          <div className="card">
            <div className="sec-title">안전 · 보건 총괄 <span className="muted" style={{ fontWeight: 500 }}>— 경영책임자를 도와 체계를 돌리는 사람</span></div>
            <div className="tl-grid">
              <Row label="성명"><input value={c.총괄.이름} onChange={총칸('이름')} /></Row>
              <Row label="직책"><input value={c.총괄.직책} onChange={총칸('직책')} placeholder="예: 안전보건팀장" /></Row>
              <Row label="연락처"><input value={c.총괄.연락} onChange={총칸('연락')} /></Row>
              <Row label="전담 조직"><select value={c.전담?.둠 ? '1' : ''} onChange={(e) => 바꿈((x) => ({ ...x, 전담: { ...x.전담, 둠: !!e.target.value } }))}><option value="">두지 않음</option><option value="1">둠</option></select></Row>
            </div>
            <p className={전.대상 ? 'cwarn' : 'muted'} style={{ margin: '8px 0 0', fontSize: 12.5 }}>{전.글}</p>
          </div>
          <div className="card">
            <div className="sec-title">현장 <span className="muted" style={{ fontWeight: 500 }}>— 공사금액으로 안전관리자 인원을 봅니다(산업안전보건법 시행령 별표 3)</span></div>
            <div className="jc-rows">
              {(c.현장들 || []).map((h) => {
                const p = J.안관판정(h)
                return (
                  <div className="jc-row" key={h.id}>
                    <input className="w2" value={h.이름} onChange={(e) => 줄칸('현장들', h.id, '이름', e.target.value)} placeholder="현장(공사) 이름" />
                    <label className="jc-mini">금액(억)<input inputMode="decimal" value={h.금액} onChange={(e) => 줄칸('현장들', h.id, '금액', e.target.value)} /></label>
                    <label className="jc-chk"><input type="checkbox" checked={!!h.토목} onChange={(e) => 줄칸('현장들', h.id, '토목', e.target.checked)} />토목공사업</label>
                    <label className="jc-chk"><input type="checkbox" checked={!!h.하도} onChange={(e) => 줄칸('현장들', h.id, '하도', e.target.checked)} />관계수급인</label>
                    <label className="jc-mini">착공<input type="date" value={h.착공 || ''} onChange={(e) => 줄칸('현장들', h.id, '착공', e.target.value)} /></label>
                    <label className="jc-mini">준공<input type="date" value={h.준공 || ''} onChange={(e) => 줄칸('현장들', h.id, '준공', e.target.value)} /></label>
                    <label className="jc-mini">소장<input value={h.소장 || ''} onChange={(e) => 줄칸('현장들', h.id, '소장', e.target.value)} /></label>
                    <label className="jc-mini">안전관리자<input value={h.안관 || ''} onChange={(e) => 줄칸('현장들', h.id, '안관', e.target.value)} /></label>
                    <label className="jc-mini">관리감독자<input value={h.감독자 || ''} onChange={(e) => 줄칸('현장들', h.id, '감독자', e.target.value)} /></label>
                    <span className={'jc-judge' + (p.명 && !h.안관 ? ' warn' : '')}>{p.글}{p.명 && !h.안관 ? ' · ⚠ 안전관리자를 적으십시오' : ''}</span>
                    <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄뺌('현장들', h.id)}>빼기</button>
                  </div>
                )
              })}
            </div>
            <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 8 }} onClick={() => 줄더('현장들', { 이름: '', 금액: '', 토목: false, 하도: false })}>＋ 현장 더하기</button>
          </div>
          <div className="card">
            <div className="sec-title">협력업체 <span className="muted" style={{ fontWeight: 500 }}>— 9호 평가표 · 관리비용 · 반기 점검에 들어갑니다</span></div>
            <div className="jc-rows">
              {(c.협력들 || []).map((p) => (
                <div className="jc-row" key={p.id}>
                  <input className="w2" value={p.상호} onChange={(e) => 줄칸('협력들', p.id, '상호', e.target.value)} placeholder="상호" />
                  <label className="jc-mini">공종<input value={p.공종 || ''} onChange={(e) => 줄칸('협력들', p.id, '공종', e.target.value)} /></label>
                  <label className="jc-mini">계약금액<input value={p.금액 || ''} onChange={(e) => 줄칸('협력들', p.id, '금액', e.target.value)} placeholder="예: 12억" /></label>
                  <label className="jc-mini">평가 점수<input inputMode="numeric" value={p.점수 || ''} onChange={(e) => 줄칸('협력들', p.id, '점수', e.target.value)} placeholder="100점" /></label>
                  <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄뺌('협력들', p.id)}>빼기</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 8 }} onClick={() => 줄더('협력들', { 상호: '' })}>＋ 협력업체 더하기</button>
          </div>
          <div className="card">
            <div className="sec-title">경영방침 · 목표 · 예산 <span className="muted" style={{ fontWeight: 500 }}>— 기본 문장이 들어 있습니다 · 회사에 맞게 고치십시오</span></div>
            <details open>
              <summary><b>경영방침</b> ({(c.방침 || []).length}줄)</summary>
              {(c.방침 || []).map((t, i) => (
                <div className="jc-row" key={i}>
                  <span className="muted">{i + 1}.</span>
                  <input className="w3" value={t} onChange={(e) => 바꿈((x) => ({ ...x, 방침: x.방침.map((s, j) => (j === i ? e.target.value : s)) }))} />
                  <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((x) => ({ ...x, 방침: x.방침.filter((_, j) => j !== i) }))}>빼기</button>
                </div>
              ))}
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((x) => ({ ...x, 방침: [...(x.방침 || []), ''] }))}>＋ 한 줄</button>
            </details>
            <details>
              <summary><b>목표 · 추진계획</b> ({(c.목표들 || []).length}가지)</summary>
              {(c.목표들 || []).map((m) => (
                <div className="jc-row" key={m.id}>
                  <input className="w2" value={m.목표} onChange={(e) => 줄칸('목표들', m.id, '목표', e.target.value)} placeholder="목표" />
                  <input className="w3" value={m.지표} onChange={(e) => 줄칸('목표들', m.id, '지표', e.target.value)} placeholder="세부 추진과제 · 성과지표" />
                  <label className="jc-mini">담당<input value={m.담당} onChange={(e) => 줄칸('목표들', m.id, '담당', e.target.value)} /></label>
                  <label className="jc-mini">일정<input value={m.일정} onChange={(e) => 줄칸('목표들', m.id, '일정', e.target.value)} /></label>
                  <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄뺌('목표들', m.id)}>빼기</button>
                </div>
              ))}
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄더('목표들', { 목표: '', 지표: '', 담당: '', 일정: '' })}>＋ 목표</button>
            </details>
            <details>
              <summary><b>안전 · 보건 예산</b> — 편성 {J.쉼((c.예산들 || []).reduce((s, r) => s + (Number(r.금액) || 0), 0))}원</summary>
              {(c.예산들 || []).map((r) => (
                <div className="jc-row" key={r.id}>
                  <input className="w3" value={r.항목} onChange={(e) => 줄칸('예산들', r.id, '항목', e.target.value)} />
                  <label className="jc-mini">편성(원)<input inputMode="numeric" value={r.금액} onChange={(e) => 줄칸('예산들', r.id, '금액', e.target.value.replace(/[^\d]/g, ''))} /></label>
                  <label className="jc-mini">집행(원)<input inputMode="numeric" value={r.집행} onChange={(e) => 줄칸('예산들', r.id, '집행', e.target.value.replace(/[^\d]/g, ''))} /></label>
                </div>
              ))}
              <p className="muted" style={{ fontSize: 12 }}>현장 산업안전보건관리비(발주자 계상)는 <Link to="/tools/sanan">산안비 계상기 · 사용내역서</Link>에서 따로 셉니다.</p>
            </details>
            <details>
              <summary><b>비상연락처</b></summary>
              <div className="tl-grid">
                {[['노동청', '고용노동부 관할 지방관서'], ['병원', '가까운 응급실']].map(([k, t]) => (
                  <Row key={k} label={t}><input value={c.연락?.[k] || ''} onChange={(e) => 바꿈((x) => ({ ...x, 연락: { ...x.연락, [k]: e.target.value } }))} /></Row>
                ))}
              </div>
            </details>
          </div>
        </>
      )}

      {탭 === 'dx' && (
        <div className="card">
          <div className="sec-title">② 진단(자율점검) — {됨수} / {J.묻기들.length} 갖춤</div>
          <p className="muted" style={{ marginTop: 0 }}>호마다 «했다 · 안 했다» 를 고르면 빠진 것과 그것을 채울 서류가 나옵니다. 답은 서류 한 벌의 «진단 요약» 에 들어갑니다.</p>
          {[...J.호들, { 키: '5조', 제목: '안전 · 보건 관계 법령 의무 · 교육(제5조)', 원문: J.오조들.map((x) => x.원문).join(' / ') }].map((h) => {
            const qs = J.묻기들.filter((q) => (h.키 === '5조' ? q.키.startsWith('5조') : q.호 === h.키))
            return (
              <div className="jc-ho" key={h.키}>
                <div className="jc-ho-h"><b>{h.키 === '5조' ? '제5조' : `${h.키}호`}</b> {h.제목} {h.반기 && <span className="chipmini">반기 점검</span>}</div>
                <div className="muted jc-law">{h.원문}</div>
                {qs.map((q) => (
                  <div className="jc-q" key={q.키}>
                    <span>{q.글}</span>
                    <span className="jc-yn">
                      <button type="button" className={답[q.키] === true ? 'on y' : ''} onClick={() => 바꿈((x) => ({ ...x, 진단: { ...x.진단, [q.키]: true } }))}>했다</button>
                      <button type="button" className={답[q.키] === false ? 'on n' : ''} onClick={() => 바꿈((x) => ({ ...x, 진단: { ...x.진단, [q.키]: false } }))}>안 했다</button>
                    </span>
                    {답[q.키] === false && <span className="jc-fix">→ «{J.서류목록.find((d) => d.키 === q.서류)?.이름}» 을(를) 만들어 쓰십시오</span>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {탭 === 'half' && (
        <div className="card">
          <div className="sec-title">④ 반기 점검 — 반기 1회 이상 하고 대표가 보고받는 것</div>
          <div className="eq-tabs" role="tablist" style={{ marginTop: 4 }}>
            {반기목록.map((h) => <button key={h.키} type="button" className={반기 === h.키 ? 'on' : ''} onClick={() => set반기(h.키)}>{h.이름}</button>)}
          </div>
          <p className={반.지남 ? 'cwarn' : 'muted'} style={{ margin: '6px 0 10px' }}>마감 {날짧(반.마감)} · {반.한} / {반.모두} 함{반.남.length ? ` · 남은 것 ${반.남.length}` : ' · 모두 함'}{반.지남 ? ' — 마감이 지났습니다' : ''}</p>
          {J.반기점검.map((p) => {
            const r = (c.기록?.[반기] || {})[p.키] || {}
            return (
              <div className="jc-ho" key={p.키}>
                <div className="jc-ho-h"><b>{r.날 ? '✅' : '⬜'}</b> {p.글} <span className="muted" style={{ fontSize: 12 }}>· {p.근거}</span></div>
                <div className="jc-row">
                  <label className="jc-mini">점검일<input type="date" value={r.날 || ''} onChange={(e) => 기록칸(반기, p.키, '날', e.target.value)} /></label>
                  <input className="w3" value={r.결과 || ''} onChange={(e) => 기록칸(반기, p.키, '결과', e.target.value)} placeholder="결과(무엇을 보았나 · 몇 건)" />
                  <input className="w3" value={r.조치 || ''} onChange={(e) => 기록칸(반기, p.키, '조치', e.target.value)} placeholder="필요한 조치(누가 · 언제까지)" />
                </div>
              </div>
            )
          })}
          <p className="muted" style={{ marginTop: 8 }}>적은 것은 ③ 서류 한 벌의 각 점검표와 <b>반기 이행 점검 결과 보고서</b>에 들어갑니다. 위험성평가 기록은 <Link to="/tools/risk">위험성평가 대장</Link>으로 만들 수 있습니다.</p>
        </div>
      )}
      </fieldset>

      {탭 === 'doc' && (
        <div className="card">
          <div className="sec-title">③ 서류 한 벌 {쪽들.length > 0 && <span className="muted" style={{ fontWeight: 500 }}>— {고른.length}가지 · {쪽들.length}쪽</span>}</div>
          {!씀 && !예시봄 ? (
            <>
              <p className="muted" style={{ marginTop: 0 }}>🧪 예시 회사(지어낸 회사 · 현장 셋 · 협력업체 셋)로 22가지 서류를 쪽마다 넘겨 보실 수 있습니다.</p>
              <button type="button" className="btn" style={{ width: 'auto' }} onClick={예시}>🧪 예시로 미리 보기</button>
            </>
          ) : (
            <>
              <details>
                <summary className="muted">넣을 서류 고르기 ({고른.length} / {J.서류목록.length})</summary>
                <div className="jc-pick">
                  {J.서류목록.map((d) => (
                    <label key={d.키} className="jc-chk">
                      <input type="checkbox" disabled={!씀 || 예시봄} checked={고른.includes(d.키)} onChange={(e) => set고른((g) => (e.target.checked ? J.서류목록.map((x) => x.키).filter((k) => k === d.키 || g.includes(k)) : g.filter((k) => k !== d.키)))} />
                      <span className="muted">{d.호 === '-' ? '' : d.호 === '반기' ? '반기' : d.호 === '5조' ? '제5조' : d.호 + '호'}</span> {d.이름}
                    </label>
                  ))}
                </div>
              </details>
              <div className="jc-row" style={{ marginTop: 6 }}>
                <label className="jc-mini">반기 서류<select value={반기} onChange={(e) => set반기(e.target.value)}>{반기목록.map((h) => <option key={h.키} value={h.키}>{h.이름}</option>)}</select></label>
                <label className="jc-mini">서류로 가기<select value="" onChange={(e) => { if (e.target.value !== '') set쪽번(+e.target.value) }}>
                  <option value="">고르기</option>
                  {Object.entries(서류쪽).map(([t, i]) => <option key={t} value={i}>{t}</option>)}
                </select></label>
              </div>
              <div className="sg-dl" style={{ marginTop: 8 }}>
                {Object.entries(형식표).map(([k, [이름]]) => (
                  <button key={k} type="button" className={씀 && !예시봄 ? (k === 'pdf' ? 'btn' : 'btn line') : 'btn line sg-lockbtn'} style={{ width: 'auto' }} disabled={씀 && !예시봄 && (!쪽들.length || !!내림중)} onClick={() => 내려받기(k)}>
                    {내림중 === 이름 ? '⏳ 만드는 중…' : `${씀 && !예시봄 ? '⬇' : '🔒'} ${이름}`}
                  </button>
                ))}
              </div>
              {(!씀 || 예시봄) && <p className="muted" style={{ margin: '6px 0 0' }}>🧪 예시(지어낸 회사)입니다. {씀 ? '받으려면 «우리 회사로 돌아가기» 를 누르십시오.' : '받기는 준비 중 — 화면에서 쪽마다 넘겨 보십시오.'}</p>}
              {잠금말 && <div className="cwarn" style={{ marginTop: 6 }}>{잠금말}</div>}
              {오류 && <div className="cwarn" style={{ marginTop: 6 }}>⚠️ {오류}</div>}
              <쪽넘기기 쪽들={쪽들} 쪽번={쪽번} set쪽번={set쪽번} on끝={() => { if (!씀) 세기('|중처법|예시끝') }} />
            </>
          )}
          <p className="muted" style={{ marginTop: 8 }}>
            ※ 서류를 갖추는 것만으로 의무를 다한 것은 아닙니다 — 실제로 하고 기록하는 것이 안전보건관리체계입니다. 법률 판단은 관할 지방고용노동관서 · 안전보건공단 · 노무사 · 변호사에게 물으십시오.
            현장 서류는 <Link to="/safety">안전관리계획서 · 유해위험방지계획서</Link> · <Link to="/tools/risk">위험성평가</Link> · <Link to="/tools/sanan">산안비</Link>를 함께 쓰십시오.
          </p>
        </div>
      )}
    </>
  )
}
