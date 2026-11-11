/**
 * /tools/anjeon — 🦺 안전관리계획서 한 벌 (G638 · 2026-11-10)
 *
 * 소장님: 「안전관리계획서 한벌...유해위험방지계획서 한벌 말하는 거야」 · 「목차 표지 말고 300백 페이지 이상 되는 거」
 *         「만들고 예시만 보여주고 막아 놔」 · 「내 밥 줄이니까 잘 만들어 줘」 · 「견본대로 해」
 *
 * ■ 셈 · 글: lib/안전계획.js(만들기) · 안전계획틀.js(차례 · 문장) · 안전계획자료.js · 안전계획자료2.js(표 자료)
 *            → lib/쪽흐름.js(쪽 흘리기) → 쪽pdf · 쪽한글 · 쪽워드 · 쪽엑셀
 *   차례는 「건설기술 진흥법 시행규칙」 별표 7(안전관리계획의 수립기준) · 받은 견본의 차례 그대로입니다.
 *   견본(실제 승인본)의 공사명 · 상호 · 사람 · 번호 · 금액은 하나도 옮기지 않았습니다(🧪 예시는 모두 «가상»).
 * ■ 파일은 이 브라우저 밖으로 나가지 않습니다. 적은 것만 이 브라우저에 남습니다(kcm.anjeon.v1 — 쓸 수 있는 브라우저만).
 *
 * 🔒 잠금(SigongPlan 과 같은 방식): 소장님 브라우저(lib/운영자.js 나운영자) 또는 열쇠말(lib/gate.js)이면 다 씀.
 *    그 밖의 분은 🧪 예시(가상 공사)로 만든 한 벌을 쪽마다 넘겨 보기만 — 적기 · 올리기 · 받기는 잠김.
 *    ⚠️ 문 앞 잠금일 뿐입니다(gate.js 머리말).
 * 📊 세기(안 보임): |안전계획|예시 · |안전계획|PDF · |안전계획|한글 · |안전계획|워드 · |안전계획|엑셀 · |안전계획|그림 · |안전계획|잠금 · |안전계획|열쇠
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import { 쪽그림, 그림줄이기 } from '../lib/쪽그림.jsx'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'

const 남김열쇠 = 'kcm.anjeon.v1'
const 그림꼴 = /\.(jpe?g|png|webp|gif|bmp)$/i
const PDF꼴 = /\.pdf$/i
const 숨 = () => new Promise((r) => setTimeout(r, 20))
const 형식표 = {
  pdf: ['PDF', 'application/pdf', '.pdf'],
  hwpx: ['한글', 'application/hwp+zip', '.hwpx'],
  docx: ['워드', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  xlsx: ['엑셀', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
}
const 오늘 = () => { const d = new Date(Date.now() + 9 * 3600e3); return `${d.getUTCFullYear()}. ${d.getUTCMonth() + 1}. ${d.getUTCDate()}.` }
const 빈입력 = () => ({
  공사: { 공사명: '', 위치: '', 발주청: '', 건설사업관리: '', 시공자: '', 착공: '', 준공: '', 공사금액: '', 토목: true, 건축: false, 규모: '', 목적: '', 작성일: 오늘(), 시설종류: '' },
  사람: { 현장대리인: '', 공사: '', 공무: '', 안전관리자: '', 보건관리자: '', 담당: '', 분야: [], 관리감독자: [], 협력: [], 연락처: {} },
  대상: { 굴착깊이: '', 폭발물: false, 층수: '', 리모델링: false, 천공기: false, 항타기: false, 타워: false, 가설구조물: [], 발주자: false, 조례: false },
  공종: { 가설: { 비계: true, 가설도로: false, 크레인: false, 항타기: false, 전기: true }, 굴착: false, 콘크리트: false, 강구조물: false, 성토절토: false, 해체: false, 건축설비: false, 타워크레인: false },
  현장: { 주변현황: '', 지하수위: '', 병원: '', 병원연락처: '', 노동관서: '', 노동관서연락처: '', 집결지: '', 매설물: [], 인접: [], 도로: [], 지반: [], 기관연락: [] },
  검토: { 비계: {}, 크레인: {}, 항타기: {}, 굴착: { 기울기: {} } },
  안전관리비: '',
  특수공법: { 이름: '', 설명: '' },
})
function 읽(k, 기본) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? 기본 } catch { return 기본 } }
function 쓰(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 가득 참 · 사생활 보호 */ } }
function 저장하기(이름, 바이트, 타입) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(new Blob([바이트], { type: 타입 }))
  a.href = url; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
/** 표 칸: 한 줄에 하나, «|» 로 나눔 */
const 줄글 = (줄들) => (줄들 || []).map((r) => r.map((c) => (c === undefined || c === null ? '' : String(c))).join(' | ')).join('\n')
const 줄풀기 = (글) => String(글 || '').split('\n').map((t) => t.trim()).filter(Boolean).map((t) => t.split('|').map((c) => c.trim()))
const 수칸 = (v) => (v === '' || v === undefined || v === null ? '' : v)

export default function SafetyPlan() {
  const [lib, setLib] = useState(null)
  const [입, set입] = useState(() => { const v = 읽(남김열쇠, null); return v && v.공사 ? { ...빈입력(), ...v } : 빈입력() })
  const [그림들, set그림들] = useState(() => new Map())
  const [그림자리, set그림자리] = useState({})
  const [쪽번, set쪽번] = useState(0)
  const [내림중, set내림중] = useState('')
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [말, set말] = useState('')
  const [고른자리, set고른자리] = useState('')
  const 폭틀 = useRef(null)
  const [폭, set폭] = useState(560)
  /* 🔒 씀 = 소장님 브라우저 · 열쇠말을 넣은 브라우저 */
  const [씀, set씀] = useState(() => isOpen())
  const [예시봄, set예시봄] = useState(false)
  /* 🧪 G650(11-11) 소장님 「막아 놓은 건 예시도 받지 못하게 막고 볼 수만 있게 해」 — 열쇠말 · 소장님 브라우저에서도
     «🧪 예시(가상 공사)로 채우기» 한 것은 보기만(받기 넷 막음) · «↺ 비우기» 에서 풂 · 새로고침해도 그대로 */
  const [예시채움, set예시채움] = useState(() => { try { return localStorage.getItem(남김열쇠 + '.ex') === '1' } catch (e) { return false } })
  useEffect(() => { try { if (예시채움) localStorage.setItem(남김열쇠 + '.ex', '1'); else localStorage.removeItem(남김열쇠 + '.ex') } catch (e) { /* 저장소 막힘 */ } }, [예시채움])
  const [잠금말, set잠금말] = useState('')
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  const 잠김 = (무엇) => { set잠금말(`🔒 ${무엇} 지금 준비 중입니다 — 🧪 예시로 어떻게 나오는지 보실 수 있습니다.`); 세기('|안전계획|잠금') }

  useEffect(() => { if (씀) 쓰(남김열쇠, 입) }, [씀, 입])
  useEffect(() => {
    let 살 = true
    Promise.all([import('../lib/안전계획.js'), import('../lib/안전계획예시.js')])
      .then(([m, e]) => { if (살) setLib({ ...m, 예시: e.안전계획예시 }) })
      .catch((e) => set오류('불러오지 못했습니다 — ' + (e?.message || e)))
    return () => { 살 = false }
  }, [])
  useEffect(() => {
    const el = 폭틀.current
    if (!el) return undefined
    const 재기 = () => set폭(Math.max(260, Math.min(820, el.clientWidth - 4)))
    재기()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(재기) : null
    if (ro) ro.observe(el); else window.addEventListener('resize', 재기)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', 재기) }
  }, [lib, 예시봄, 씀])

  /* 만들기 — 잠긴 브라우저는 예시만, 쓸 수 있는 브라우저는 적은 것으로(적는 동안 잠깐 기다림) */
  const 입력 = useMemo(() => ({ ...입, 그림자리 }), [입, 그림자리])
  const [늦은입력, set늦은입력] = useState(입력)
  useEffect(() => { const t = setTimeout(() => set늦은입력(입력), 450); return () => clearTimeout(t) }, [입력])
  const 결과 = useMemo(() => {
    if (!lib) return null
    if (!씀 && !예시봄) return null
    try { return lib.안전계획만들기(씀 ? 늦은입력 : lib.예시) } catch (e) { return { 오류: e?.message || String(e) } }
  }, [lib, 씀, 예시봄, 늦은입력])
  const 쪽들 = 결과?.쪽들 || []
  useEffect(() => { if (쪽번 >= 쪽들.length) set쪽번(Math.max(0, 쪽들.length - 1)) }, [쪽들.length])   // eslint-disable-line react-hooks/exhaustive-deps
  const 쪽 = 쪽들[쪽번]

  const 예시보기 = () => { set예시봄(true); set잠금말(''); set쪽번(0); 세기('|안전계획|예시') }
  const 예시채우기 = () => {
    if (!lib) return
    set입(JSON.parse(JSON.stringify(lib.예시)))
    set예시채움(true); set쪽번(0); 세기('|안전계획|예시')
  }
  const 새로 = () => { set입(빈입력()); set예시채움(false); set잠금말(''); set그림들(new Map()); set그림자리({}); set쪽번(0) }

  const 내려받기 = async (형식) => {
    if (!씀) { 잠김(형식표[형식][0] + ' 받기는'); return }
    if (예시채움) { set잠금말(`🧪 예시(가상 공사)로 채운 것은 보기만 됩니다 — ${형식표[형식][0]} 받기는 «↺ 비우기» 를 누르고 내 공사로 적은 뒤에 됩니다.`); 세기('|안전계획|예시잠금'); return }
    if (!쪽들.length) return
    const [이름, 타입, 끝] = 형식표[형식]
    set내림중(이름); await 숨()
    try {
      let 바이트
      const 제목 = (입.공사.공사명 || '') + ' 안전관리계획서'
      if (형식 === 'pdf') { const m = await import('../lib/쪽pdf.js'); 바이트 = await m.쪽들PDF(쪽들, 그림들, { 제목 }) }
      else if (형식 === 'hwpx') { const m = await import('../lib/쪽한글.js'); 바이트 = m.쪽들한글(쪽들, 그림들, { 제목: '안전관리계획서' }) }
      else if (형식 === 'docx') { const m = await import('../lib/쪽워드.js'); 바이트 = m.쪽들워드(쪽들, 그림들, { 제목: '안전관리계획서' }) }
      else {
        /* 엑셀은 용지(세로 · 가로)가 바뀌는 곳마다 시트를 나눔 */
        const m = await import('../lib/쪽엑셀.js')
        const 무리 = []
        for (const p of 쪽들) { const 가 = p.폭 > p.높이; if (!무리.length || 무리[무리.length - 1].가 !== 가) 무리.push({ 가, 쪽들: [] }); 무리[무리.length - 1].쪽들.push(p) }
        바이트 = m.엑셀책(무리.map((g, i) => m.쪽들시트(g.쪽들, 그림들, `${i + 1} ${g.가 ? '점검표(가로)' : '계획서'}`.slice(0, 30))), 그림들)
      }
      const 파일이름 = String((입.공사.공사명 || '공사') + '_안전관리계획서').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, '_').slice(0, 60) + 끝
      저장하기(파일이름, 바이트, 타입)
      세기('|안전계획|' + 이름)
    } catch (e) { set오류(`${이름} 만들기 실패 — ${e?.message || e}`) } finally { set내림중('') }
  }

  /* 도면 · 사진 · 서류 사본 올리기 — 고른 자리에 넣음(PDF 는 첫 쪽) */
  const 올리기 = async (파일들) => {
    if (!씀) { 잠김('도면 · 사진 올리기는'); return }
    const 자리 = 고른자리
    if (!자리) { set말('먼저 «넣을 자리» 를 고르십시오.'); return }
    const f = 파일들 && 파일들[0]
    if (!f) return
    set바쁨(`${f.name} — 읽는 중…`); await 숨()
    try {
      let g
      if (PDF꼴.test(f.name)) { const p = await import('../lib/pdfwork.js'); g = await p.첫쪽JPEG(f) }
      else if (그림꼴.test(f.name)) g = await 그림줄이기(f)
      else { set말('⚠️ PDF · 그림(JPG · PNG)만 받습니다.'); return }
      set그림들((old) => new Map(old).set(자리, { ...g, 이름: f.name }))
      set그림자리((old) => ({ ...old, [자리]: 자리 }))
      set말(`🖼 ${f.name} → «${(결과?.자리들 || []).find((x) => x.열쇠 === 자리)?.이름 || 자리}» 에 넣었습니다.`)
      세기('|안전계획|그림')
    } catch (e) { set말(`⚠️ ${f.name} — ${e?.message || '읽지 못했습니다'}`) } finally { set바쁨('') }
  }
  const 빼기 = (자리) => {
    set그림들((old) => { const n = new Map(old); n.delete(자리); return n })
    set그림자리((old) => { const n = { ...old }; delete n[자리]; return n })
  }
  const 쪽으로 = (i) => { if (i === undefined || i === null) return; set쪽번(i); setTimeout(() => 폭틀.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60) }

  /* 칸 고치기 도우미 */
  const 바꿈 = (묶, k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; set입((p) => ({ ...p, [묶]: { ...p[묶], [k]: v } })) }
  const 검토바꿈 = (갈, k) => (e) => { const v = e.target.value; set입((p) => ({ ...p, 검토: { ...p.검토, [갈]: { ...(p.검토?.[갈] || {}), [k]: v === '' ? '' : (isFinite(+v) ? +v : v) } } })) }
  const 공종바꿈 = (k, 세부) => (e) => {
    const on = e.target.checked
    set입((p) => {
      const 공 = { ...p.공종 }
      if (!세부) {
        if (k === '가설' || k === '굴착') 공[k] = on ? { ...(typeof 공[k] === 'object' && 공[k] ? 공[k] : {}), 있음: true } : false
        else 공[k] = on
      } else {
        const 옛 = typeof 공[k] === 'object' && 공[k] ? 공[k] : {}
        공[k] = { ...옛, 있음: true, [세부]: on }
      }
      return { ...p, 공종: 공 }
    })
  }
  const 가설구조물바꿈 = (키) => (e) => set입((p) => {
    const s = new Set(p.대상?.가설구조물 || [])
    if (e.target.checked) s.add(키); else s.delete(키)
    return { ...p, 대상: { ...p.대상, 가설구조물: [...s] } }
  })
  const 줄칸 = (묶, k, 안내) => (
    <label className="sp-wide">{안내}
      <textarea rows={3} value={줄글(입[묶]?.[k])} onChange={(e) => { const v = 줄풀기(e.target.value); set입((p) => ({ ...p, [묶]: { ...p[묶], [k]: v } })) }} />
    </label>
  )
  const 판정 = 결과?.판정
  const 자리들 = 결과?.자리들 || []
  const 공종 = 입.공종 || {}
  const 켜짐 = (k) => { const v = 공종[k]; return v === true || (!!v && typeof v === 'object' && v.있음 !== false && (v.있음 === true || Object.values(v).some(Boolean))) }

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🦺 안전관리계획서 한 벌</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          「건설기술 진흥법」 제62조 · 시행령 제98조 · 시행규칙 <b>별표 7(안전관리계획의 수립기준)</b> 차례대로 —
          <b> 제1장 총괄 안전관리계획</b>(공사개요 · 현장 특성 분석 · 현장운영계획 · 비상시 긴급조치계획)과
          <b> 제2장 공종별 세부 안전관리계획</b>(가설 · 굴착 · 콘크리트 · 강구조물 · 성토 · 절토 · 해체 · 건축설비 · 타워크레인 — 이 공사에 있는 것만),
          그리고 <b>현장 운영 서식</b>(작업허가서 · 일일 점검표 · 교육 일지 · 작업계획서 …)까지 한 벌로 만듭니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          대상 판정 · 정기안전점검 회차(지침 별표 1) · 공종별 작업 순서 위험성평가 · 31일 일일 점검표 · 간이 검토(크레인 인양 · 줄걸이 · 접지압 · 비계 · 굴착 기울기)가 저절로 들어갑니다.
          도면 · 사진 · 선임 서류 사본은 그 자리에 올려 넣습니다. 가입 없음 · <b>파일은 이 브라우저 밖으로 나가지 않습니다.</b>
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 지금은 준비 중입니다</b> — 내 공사로 적어 만들고 받는 것은 곧 엽니다.
            지금은 <button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시보기}>🧪 예시(가상 공사)</button>로 어떻게 나오는지 쪽마다 넘겨 보실 수 있습니다.
            {' '}<예시본수 열쇠="|안전계획|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set잠금말(''); 세기('|안전계획|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
          </div>
        )}
      </div>

      {씀 && (
        <div className="card">
          <div className="sec-title">① 공사 · 사람</div>
          <div className="sp-btns">
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={예시채우기}>🧪 예시(가상 공사)로 채우기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={새로}>↺ 비우기</button>
          </div>
          <div className="sp-grid">
            {[['공사명', '공사명'], ['위치', '공사 위치'], ['발주청', '발주청(발주자)'], ['건설사업관리', '건설사업관리(감리)'], ['시공자', '시공자(회사)'], ['작성일', '작성일']].map(([k, 이름]) => (
              <label key={k}>{이름}<input value={입.공사[k] || ''} onChange={바꿈('공사', k)} /></label>
            ))}
            <label>착공<input type="date" value={입.공사.착공 || ''} onChange={바꿈('공사', '착공')} /></label>
            <label>준공<input type="date" value={입.공사.준공 || ''} onChange={바꿈('공사', '준공')} /></label>
            <label>공사금액(원)<input type="number" value={수칸(입.공사.공사금액)} onChange={바꿈('공사', '공사금액')} /></label>
            <label>안전관리비(원)<input type="number" value={수칸(입.안전관리비)} onChange={(e) => set입((p) => ({ ...p, 안전관리비: e.target.value }))} /></label>
            <label>건설공사 종류(지침 별표 1)
              <select value={입.공사.시설종류 || ''} onChange={바꿈('공사', '시설종류')}>
                <option value="">(고르지 않음 — 시공자가 정함)</option>
                {(lib?.시설종류목록 || []).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="sp-chk"><input type="checkbox" checked={!!입.공사.토목} onChange={바꿈('공사', '토목')} /> 토목공사업(위원회 · 노사협의체 기준 150억)</label>
            <label className="sp-chk"><input type="checkbox" checked={!!입.공사.건축} onChange={바꿈('공사', '건축')} /> 건축공사(화재 대피 훈련 대상)</label>
            <label className="sp-wide">공사 규모<input value={입.공사.규모 || ''} onChange={바꿈('공사', '규모')} /></label>
            {[['현장대리인', '현장대리인(안전총괄책임자)'], ['공사', '공사 담당(분야별 책임자)'], ['공무', '공무'], ['안전관리자', '안전관리자'], ['보건관리자', '보건관리자'], ['담당', '안전관리담당자']].map(([k, 이름]) => (
              <label key={k}>{이름}<input value={입.사람[k] || ''} onChange={바꿈('사람', k)} /></label>
            ))}
            {줄칸('사람', '관리감독자', '관리감독자 — 한 줄에 하나: 공종 | 이름')}
            {줄칸('사람', '협력', '협력업체 — 한 줄에 하나: 업체 | 공종 | 대표 | 연락처')}
          </div>

          <div className="sec-title" style={{ marginTop: 14 }}>② 수립 대상 판정(시행령 제98조제1항)</div>
          <div className="sp-grid">
            <label>지하 굴착 깊이(m)<input type="number" step="0.1" value={수칸(입.대상.굴착깊이)} onChange={바꿈('대상', '굴착깊이')} /></label>
            <label>건축물 층수<input type="number" value={수칸(입.대상.층수)} onChange={바꿈('대상', '층수')} /></label>
            <label>1 · 2종 시설물
              <select value={입.대상.시설물 || ''} onChange={바꿈('대상', '시설물')}><option value="">아님</option><option value="1종">1종</option><option value="2종">2종</option></select>
            </label>
            {[['폭발물', '폭발물 사용(20m 안 시설물 · 100m 안 가축)'], ['항타기', '항타 및 항발기'], ['천공기', '천공기(높이 10m 이상)'], ['타워', '타워크레인'], ['리모델링', '10층 이상 리모델링 · 해체'], ['발주자', '발주자가 특히 필요하다고 인정'], ['조례', '지자체 조례(인허가기관 인정)']].map(([k, 이름]) => (
              <label key={k} className="sp-chk"><input type="checkbox" checked={!!입.대상[k]} onChange={바꿈('대상', k)} /> {이름}</label>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 12.5, margin: '8px 0 4px' }}>가설구조물(시행령 제101조의2) — 쓰는 것을 고르십시오</div>
          <div className="sp-grid">
            {(lib?.가설구조물목록 || []).map(([키, 호, 이름]) => (
              <label key={키} className="sp-chk"><input type="checkbox" checked={(입.대상.가설구조물 || []).includes(키)} onChange={가설구조물바꿈(키)} /> {이름} <span className="muted">({호})</span></label>
            ))}
          </div>
          {판정 && <p className={판정.대상 ? 'okline' : 'muted'} style={{ margin: '8px 0 0' }}>{판정.대상 ? `✅ 수립 대상 — ${판정.해당.map((r) => r.호).join(' · ')}` : '해당 호가 없습니다(대상이 아니면 자율 계획).'}</p>}

          <div className="sec-title" style={{ marginTop: 14 }}>③ 공종(이 공사에 있는 것)</div>
          <div className="sp-grid">
            {(lib?.공종차례 || []).map((k) => (
              <div key={k} className="sp-gong">
                <label className="sp-chk"><input type="checkbox" checked={켜짐(k)} onChange={공종바꿈(k)} /> <b>{lib.공종이름[k]}</b></label>
                {(lib.세부목록?.[k] || []).length > 0 && 켜짐(k) && (
                  <div className="sp-sub">
                    {lib.세부목록[k].map(([세, 이름]) => (
                      <label key={세} className="sp-chk"><input type="checkbox" checked={!!(공종[k] && 공종[k][세])} onChange={공종바꿈(k, 세)} /> {이름}</label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <details className="sg-more" style={{ marginTop: 12 }}>
            <summary><b>④ 현장 여건</b> <span className="muted">— 주변 · 매설물 · 지반 · 병원 · 집결지(비워 두면 빈 칸 표로 나옵니다)</span></summary>
            <div className="sp-grid">
              <label className="sp-wide">공사현장 주변 현황<textarea rows={3} value={입.현장.주변현황 || ''} onChange={바꿈('현장', '주변현황')} /></label>
              {[['지하수위', '지하수위(GL-  m)'], ['병원', '가까운 병원'], ['병원연락처', '병원 연락처'], ['노동관서', '관할 노동관서'], ['노동관서연락처', '노동관서 연락처'], ['집결지', '비상 집결지']].map(([k, 이름]) => (
                <label key={k}>{이름}<input value={입.현장[k] || ''} onChange={바꿈('현장', k)} /></label>
              ))}
              {줄칸('현장', '매설물', '지하매설물 — 종류 | 관리기관 | 규격 | 깊이(m) | 위치 | 보호 방법')}
              {줄칸('현장', '인접', '인접 구조물 — 시설물 | 구조 | 거리(m) | 예상 영향 | 대책')}
              {줄칸('현장', '지반', '지반 조건 — 지층 | 두께(m) | N치 | 상태 | 비고')}
              {줄칸('현장', '기관연락', '매설물 관리기관 연락처 — 구분 | 관리기관 | 연락처 | 비고')}
            </div>
          </details>

          <details className="sg-more" style={{ marginTop: 10 }}>
            <summary><b>⑤ 간이 검토 값</b> <span className="muted">— 넣으면 크레인 인양 · 줄걸이 장력 · 접지압 · 비계 기준을 셈해 판정합니다</span></summary>
            <div className="sg-help">제원표(정격하중표) · 슬링 사용하중 · 지반 지지력은 제조사 자료와 지반조사 값을 넣으십시오. 관계전문가 계산서를 대신하지 않습니다.</div>
            <div className="sp-grid">
              {[['크레인', '정격', '정격하중(t, 그 반경)'], ['크레인', '인양물', '인양물 무게(t)'], ['크레인', '훅', '훅 무게(t)'], ['크레인', '줄걸이무게', '줄걸이 용구 무게(t)'], ['크레인', '줄수', '줄 수'], ['크레인', '각도', '줄걸이 각도(°)'], ['크레인', '사용하중', '슬링 사용하중(t, 1가닥)'], ['크레인', '반력', '아웃트리거 최대 반력(t)'], ['크레인', '받침면적', '받침판 면적(㎡)'], ['크레인', '지지력', '지반 허용지지력(kN/㎡)'],
                ['비계', '띠장방향', '비계기둥 간격 — 띠장 방향(m)'], ['비계', '장선방향', '비계기둥 간격 — 장선 방향(m)'], ['비계', '띠장간격', '띠장 간격(m)'], ['비계', '높이', '비계 높이(m)'], ['비계', '적재', '기둥 사이 적재하중(kg)'], ['비계', '벽이음수직', '벽이음 수직(m)'], ['비계', '벽이음수평', '벽이음 수평(m)'], ['비계', '발판폭', '작업발판 폭(cm)'],
                ['항타기', '절단하중', '권상 와이어로프 절단하중(t)'], ['항타기', '사용하중', '최대 사용하중(t)']].map(([갈, k, 이름]) => (
                <label key={갈 + k}>{이름}<input type="number" step="any" value={수칸(입.검토?.[갈]?.[k])} onChange={검토바꿈(갈, k)} /></label>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* ── 미리보기 · 받기 */}
      {lib && !씀 && !예시봄 && (
        <div className="card">
          <div className="sec-title">미리보기</div>
          <p className="muted" style={{ marginTop: 0 }}>🧪 예시(가상 공사)를 열면 표지 · 목차부터 공종별 세부계획 · 현장 운영 서식까지 한 벌을 쪽마다 넘겨 보실 수 있습니다.</p>
          <button type="button" className="btn" style={{ width: 'auto' }} onClick={예시보기}>🧪 예시로 미리 보기</button>
        </div>
      )}
      {lib && (씀 || 예시봄) && (
        <div className="card">
          <div className="sec-title">미리보기 · 받기 {쪽들.length > 0 && <span className="muted" style={{ fontWeight: 500 }}>— {쪽들.length}쪽</span>}</div>
          {결과?.오류 && <div className="cwarn">⚠️ {결과.오류}</div>}
          {오류 && <div className="cwarn">⚠️ {오류}</div>}
          <div className="sg-dl">
            {Object.entries(형식표).map(([k, [이름]]) => (
              <button key={k} type="button" className={씀 && !예시채움 ? (k === 'pdf' ? 'btn' : 'btn line') : 'btn line sg-lockbtn'} style={{ width: 'auto' }} disabled={씀 && !예시채움 && (!쪽들.length || !!내림중)} onClick={() => 내려받기(k)}>
                {내림중 === 이름 ? '⏳ 만드는 중…' : `${씀 && !예시채움 ? '⬇' : '🔒'} ${이름}`}
              </button>
            ))}
          </div>
          {!씀 && <p className="muted" style={{ margin: '6px 0 0' }}>🧪 예시(지어낸 공사 · 이름 · 번호)입니다. 받기는 준비 중 — 화면에서 쪽마다 넘겨 보십시오.</p>}
          {씀 && 예시채움 && <p className="cwarn" style={{ margin: '6px 0 0' }}>🧪 지금은 <b>예시(가상 공사)</b>로 채운 것입니다 — 보기만 됩니다. 받기(PDF · 한글 · 워드 · 엑셀)는 <b>«↺ 비우기»</b> 를 누르고 내 공사로 적은 뒤에 됩니다.</p>}
          {잠금말 && (!씀 || 예시채움) && <div className="cwarn" style={{ marginTop: 6 }}>{잠금말}</div>}
          {결과?.목차?.length > 0 && (
            <div className="sp-toc">
              <select value="" onChange={(e) => { if (e.target.value !== '') 쪽으로(+e.target.value) }}>
                <option value="">📑 차례로 가기…</option>
                {결과.목차.filter((m) => m.쪽).map((m, i) => {
                  const 실제 = 쪽들.findIndex((p) => p.번호 === m.쪽)
                  return <option key={i} value={실제 < 0 ? '' : 실제}>{'　'.repeat(Math.max(0, m.단 - 1))}{m.글.replace(/\s+/g, ' ')} · {m.쪽}쪽</option>
                })}
              </select>
            </div>
          )}
          {쪽 && (
            <>
              <div className="sg-pager">
                <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={쪽번 === 0} onClick={() => set쪽번(쪽번 - 1)}>◀</button>
                <select value={쪽번} onChange={(e) => set쪽번(+e.target.value)}>
                  {쪽들.map((p, i) => <option key={i} value={i}>{i + 1} / {쪽들.length}쪽{p.번호 ? ` (- ${p.번호} -)` : ''}</option>)}
                </select>
                <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={쪽번 >= 쪽들.length - 1} onClick={() => set쪽번(쪽번 + 1)}>▶</button>
              </div>
              <div ref={폭틀} className="sg-view">
                <쪽그림 쪽={쪽} 폭px={쪽.폭 > 쪽.높이 ? 폭 : Math.min(폭, 640)} 그림들={그림들} />
              </div>
            </>
          )}

          {씀 && 자리들.length > 0 && (
            <details className="sg-more" style={{ marginTop: 12 }}>
              <summary><b>🖼 도면 · 사진 · 서류 사본 넣기</b> <span className="muted">— {자리들.length}자리 중 {자리들.filter((x) => 그림자리[x.열쇠]).length}곳 넣음</span></summary>
              <div className="sp-up">
                <select value={고른자리} onChange={(e) => set고른자리(e.target.value)}>
                  <option value="">넣을 자리 고르기…</option>
                  {자리들.map((x) => <option key={x.열쇠} value={x.열쇠}>{그림자리[x.열쇠] ? '✅ ' : ''}{x.이름}</option>)}
                </select>
                <label className="btn line sm" style={{ width: 'auto', cursor: 'pointer' }}>📎 파일(PDF 첫 쪽 · JPG · PNG)
                  <input type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={(e) => { 올리기(e.target.files); e.target.value = '' }} />
                </label>
                {고른자리 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 쪽으로(자리들.find((x) => x.열쇠 === 고른자리)?.쪽)}>👁 그 쪽 보기</button>}
              </div>
              {바쁨 && <p className="muted">{바쁨}</p>}
              {말 && <p className="muted">{말}</p>}
              {[...그림들.keys()].length > 0 && (
                <ul className="sp-list">
                  {자리들.filter((x) => 그림자리[x.열쇠]).map((x) => (
                    <li key={x.열쇠}>{x.이름} — {그림들.get(x.열쇠)?.이름 || ''} <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 쪽으로(x.쪽)}>👁</button> <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 빼기(x.열쇠)}>빼기</button></li>
                  ))}
                </ul>
              )}
            </details>
          )}
          <p className="muted" style={{ marginTop: 8 }}>
            ※ 차례 · 문장은 「건설기술 진흥법 시행규칙」 별표 7과 「산업안전보건기준에 관한 규칙」 등 현행 법령을 읽어 맞췄습니다(조문 확인일 2026. 11. 10.).
            구조계산서 · 시공상세도면은 관계전문가가 확인한 것을 따로 붙이고, 계획서는 건설사업관리기술인 검토 · 발주청 확인을 받으십시오.
            대상인지 · 무엇을 언제 내는지는 <Link to="/safety">안전관리계획서 · 유해·위험방지계획서 안내</Link>에 있습니다.
            산업안전보건법 계획서는 <Link to="/tools/yuhae">유해위험방지계획서 한 벌</Link>에서 만듭니다.
          </p>
        </div>
      )}
    </>
  )
}
