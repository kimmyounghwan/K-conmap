/**
 * /tools/yuhae — 🦺 유해위험방지계획서 한 벌 (G639 · 2026-11-10)
 *
 * 소장님: 「안전관리계획서 한벌...유해위험방지계획서 한벌 말하는 거야」 · 「목차 표지 말고 300백 페이지 이상 되는 거」
 *         「만들고 예시만 보여주고 막아 놔」 · 「내 밥 줄이니까 잘 만들어 줘」 · 「견본대로 해」 · 「예시는 처음부터 끝까지 이용자가 볼 수 있게 해줘」
 *
 * ■ 셈 · 글: lib/안전계획.js(만들기 — 입.종류 '유해') · 유해계획.js(판정 · 제3장 차례 · 유해 표) · 유해계획틀.js(제1 · 2장 글 · 작업 글)
 *            · 안전계획자료3.js(별표 10 제2호 표 · 위험성평가 · 위험물질) → lib/쪽흐름.js → 쪽pdf · 쪽한글 · 쪽워드 · 쪽엑셀
 *   차례는 받은 견본(건설공사 유해위험방지계획서)의 장 차례 — 제1장 공사개요 · 제2장 안전보건경영계획 · 제3장 작업공사 종류별 —
 *   그 안에 「산업안전보건법 시행규칙」 별표 10 제1호 가 ~ 바 · 제2호가 다 들어 있습니다(앞쪽 «첨부서류 대조표»에 쪽 번호).
 *   견본(실제 계획서)의 공사명 · 상호 · 사람 · 번호 · 금액은 하나도 옮기지 않았습니다(🧪 예시는 모두 «가상»).
 * ■ 파일은 이 브라우저 밖으로 나가지 않습니다. 적은 것만 이 브라우저에 남습니다(kcm.yuhae.v1 — 쓸 수 있는 브라우저만).
 *
 * 🔒 잠금(SafetyPlan 과 같은 방식): 소장님 브라우저(lib/운영자.js 나운영자) 또는 열쇠말(lib/gate.js)이면 다 씀.
 *    그 밖의 분은 🧪 예시(가상 공사) 한 벌을 표지부터 마지막 서식까지 쪽마다 넘겨 보기만 — 적기 · 올리기 · 받기는 잠김.
 * 📊 세기(안 보임): |유해계획|예시 · |유해계획|PDF · |유해계획|한글 · |유해계획|워드 · |유해계획|엑셀 · |유해계획|그림 · |유해계획|잠금 · |유해계획|열쇠
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import 잠금문의 from '../잠금문의.jsx'   // 📄 G669 잠근 도구 «문의»
import { 쪽그림, 그림줄이기 } from '../lib/쪽그림.jsx'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'

const 남김열쇠 = 'kcm.yuhae.v1'
const 서류 = '유해위험방지계획서'
const 그림꼴 = /\.(jpe?g|png|webp|gif|bmp)$/i
const PDF꼴 = /\.pdf$/i
const 숨 = () => new Promise((r) => setTimeout(r, 20))
const 형식표 = {
  pdf: ['PDF', 'application/pdf', '.pdf'],
  hwpx: ['한글', 'application/hwp+zip', '.hwpx'],
  docx: ['워드', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  xlsx: ['엑셀', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
}
const 대상이름 = { 건축: '건축물 등(제1호)', 냉동: '냉동 · 냉장 창고 설비 · 단열(제2호)', 다리: '다리 — 최대 지간 50m 이상(제3호)', 터널: '터널(제4호)', 댐: '댐(제5호)', 굴착: '깊이 10m 이상 굴착(제6호)' }
const 오늘 = () => { const d = new Date(Date.now() + 9 * 3600e3); return `${d.getUTCFullYear()}. ${d.getUTCMonth() + 1}. ${d.getUTCDate()}.` }
const 빈입력 = () => ({
  종류: '유해',
  공사: { 공사명: '', 위치: '', 발주청: '', 건설사업관리: '', 시공자: '', 착공: '', 준공: '', 공사금액: '', 건축: true, 토목: false, 규모: '', 작성일: 오늘() },
  사람: { 현장대리인: '', 공사: '', 공무: '', 안전관리자: '', 보건관리자: '', 관리감독자: [], 협력: [], 연락처: {} },
  대상: { 가설구조물: [] },
  현장: { 주변현황: '', 지하수위: '', 병원: '', 병원연락처: '', 노동관서: '', 노동관서연락처: '', 집결지: '', 휴게위치: '', 매설물: [], 인접: [], 도로: [], 지반: [], 기관연락: [] },
  검토: { 비계: {}, 크레인: {}, 항타기: {}, 굴착: { 기울기: {} } },
  유해: {
    판정: { 높이: '', 연면적: '', 시설: '', 시설연면적: '', 냉동연면적: '', 지간: '', 터널: false, 댐: false, 굴착깊이: '' },
    대상: [], 끔: {}, 더: [],
    개요101: { 회사전화: '', 대표자: '', 본사: '', 발주자전화: '', 설계자: '', 설계자전화: '', 감리자전화: '', 구조물: [], 특수구조물: '', 주요공법: '', 마감재: '' },
    산안비: { 종류: 'build', 재료: '', 관급: '', 노무: '', 그밖: '', 금액: '' },
    작성자: { 성명: '', 경력: '' }, 검토자: { 성명: '', 자격: '', 경력: '', 소속: '', 연락처: '' },
    회의: { 일시: '', 장소: '현장 사무실', 참석: '', 총평: '' },
    근로자: { 총동원: '', 협력업체: '', 협력근로자: '' },
    작업: {}, 위험물질: {},
  },
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
const 줄글 = (줄들) => (줄들 || []).map((r) => r.map((c) => (c === undefined || c === null ? '' : String(c))).join(' | ')).join('\n')
const 줄풀기 = (글) => String(글 || '').split('\n').map((t) => t.trim()).filter(Boolean).map((t) => t.split('|').map((c) => c.trim()))
const 수칸 = (v) => (v === '' || v === undefined || v === null ? '' : v)
/* 저장된 입력과 빈 입력을 합침(새로 생긴 칸이 비지 않게) */
const 합치기 = (v) => { const b = 빈입력(); return { ...b, ...v, 공사: { ...b.공사, ...(v.공사 || {}) }, 사람: { ...b.사람, ...(v.사람 || {}) }, 현장: { ...b.현장, ...(v.현장 || {}) }, 유해: { ...b.유해, ...(v.유해 || {}) }, 종류: '유해' } }

export default function HazardPlan() {
  const [lib, setLib] = useState(null)
  const [입, set입] = useState(() => { const v = 읽(남김열쇠, null); return v && v.공사 ? 합치기(v) : 빈입력() })
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
  const 잠김 = (무엇) => { set잠금말(`🔒 ${무엇} K-건설맵에 문의해 주세요(위 «📄 작성대행 · 견적 문의») — 🧪 예시로 어떻게 나오는지 보실 수 있습니다.`); 세기('|유해계획|잠금') }

  useEffect(() => { if (씀) 쓰(남김열쇠, 입) }, [씀, 입])
  useEffect(() => {
    let 살 = true
    Promise.all([import('../lib/안전계획.js'), import('../lib/유해계획예시.js'), import('../lib/안전계획자료3.js')])
      .then(([m, e, d]) => { if (살) setLib({ ...m, 예시: e.유해계획예시, 유해시설목록: d.유해시설목록, 위험물질표: d.위험물질표 }) })
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

  const 예시보기 = () => { set예시봄(true); set잠금말(''); set쪽번(0); 세기('|유해계획|예시') }
  const 예시채우기 = () => {
    if (!lib) return
    set입(합치기(JSON.parse(JSON.stringify(lib.예시))))
    set예시채움(true); set쪽번(0); 세기('|유해계획|예시')
  }
  const 새로 = () => { set입(빈입력()); set예시채움(false); set잠금말(''); set그림들(new Map()); set그림자리({}); set쪽번(0) }

  const 내려받기 = async (형식) => {
    if (!씀) { 잠김(형식표[형식][0] + ' 받기는'); return }
    if (예시채움) { set잠금말(`🧪 예시(가상 공사)로 채운 것은 보기만 됩니다 — ${형식표[형식][0]} 받기는 «↺ 비우기» 를 누르고 내 공사로 적은 뒤에 됩니다.`); 세기('|유해계획|예시잠금'); return }
    if (!쪽들.length) return
    const [이름, 타입, 끝] = 형식표[형식]
    set내림중(이름); await 숨()
    try {
      let 바이트
      const 제목 = `${입.공사.공사명 || ''} ${서류}`.trim()
      if (형식 === 'pdf') { const m = await import('../lib/쪽pdf.js'); 바이트 = await m.쪽들PDF(쪽들, 그림들, { 제목 }) }
      else if (형식 === 'hwpx') { const m = await import('../lib/쪽한글.js'); 바이트 = m.쪽들한글(쪽들, 그림들, { 제목: 서류 }) }
      else if (형식 === 'docx') { const m = await import('../lib/쪽워드.js'); 바이트 = m.쪽들워드(쪽들, 그림들, { 제목: 서류 }) }
      else {
        const m = await import('../lib/쪽엑셀.js')
        const 무리 = []
        for (const p of 쪽들) { const 가 = p.폭 > p.높이; if (!무리.length || 무리[무리.length - 1].가 !== 가) 무리.push({ 가, 쪽들: [] }); 무리[무리.length - 1].쪽들.push(p) }
        바이트 = m.엑셀책(무리.map((g, i) => m.쪽들시트(g.쪽들, 그림들, `${i + 1} ${g.가 ? '점검표(가로)' : '계획서'}`.slice(0, 30))), 그림들)
      }
      const 파일이름 = String((입.공사.공사명 || '공사') + '_' + 서류).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, '_').slice(0, 60) + 끝
      저장하기(파일이름, 바이트, 타입)
      세기('|유해계획|' + 이름)
    } catch (e) { set오류(`${이름} 만들기 실패 — ${e?.message || e}`) } finally { set내림중('') }
  }

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
      세기('|유해계획|그림')
    } catch (e) { set말(`⚠️ ${f.name} — ${e?.message || '읽지 못했습니다'}`) } finally { set바쁨('') }
  }
  const 빼기 = (자리) => {
    set그림들((old) => { const n = new Map(old); n.delete(자리); return n })
    set그림자리((old) => { const n = { ...old }; delete n[자리]; return n })
  }
  const 쪽으로 = (i) => { if (i === undefined || i === null) return; set쪽번(i); setTimeout(() => 폭틀.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60) }

  /* 칸 고치기 도우미 */
  const 바꿈 = (묶, k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; set입((p) => ({ ...p, [묶]: { ...p[묶], [k]: v } })) }
  const 유바꿈 = (갈, k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; set입((p) => ({ ...p, 유해: { ...p.유해, [갈]: { ...(p.유해?.[갈] || {}), [k]: v } } })) }
  const 검토바꿈 = (갈, k) => (e) => { const v = e.target.value; set입((p) => ({ ...p, 검토: { ...p.검토, [갈]: { ...(p.검토?.[갈] || {}), [k]: v === '' ? '' : (isFinite(+v) ? +v : v) } } })) }
  const 줄칸 = (묶, k, 안내) => (
    <label className="sp-wide">{안내}
      <textarea rows={3} value={줄글(입[묶]?.[k])} onChange={(e) => { const v = 줄풀기(e.target.value); set입((p) => ({ ...p, [묶]: { ...p[묶], [k]: v } })) }} />
    </label>
  )
  const 유줄칸 = (갈, k, 안내) => (
    <label className="sp-wide">{안내}
      <textarea rows={3} value={줄글(k ? 입.유해?.[갈]?.[k] : 입.유해?.[갈])} onChange={(e) => { const v = 줄풀기(e.target.value); set입((p) => ({ ...p, 유해: { ...p.유해, ...(k ? { [갈]: { ...(p.유해?.[갈] || {}), [k]: v } } : { [갈]: v }) } })) }} />
    </label>
  )
  const 가설구조물바꿈 = (키) => (e) => set입((p) => {
    const s = new Set(p.대상?.가설구조물 || [])
    if (e.target.checked) s.add(키); else s.delete(키)
    return { ...p, 대상: { ...p.대상, 가설구조물: [...s] } }
  })
  /* 판정(값으로) · 고른 대상(직접 고르면 그것) */
  const 판정 = useMemo(() => (lib ? lib.유해대상판정(입.유해?.판정 || {}) : null), [lib, 입.유해?.판정])
  const 고른대상 = (입.유해?.대상 && 입.유해.대상.length) ? 입.유해.대상 : (판정?.대상들 || [])
  const 대상바꿈 = (k) => (e) => set입((p) => {
    const 지금 = (p.유해?.대상 && p.유해.대상.length) ? p.유해.대상 : (판정?.대상들 || [])
    const s = new Set(지금)
    if (e.target.checked) s.add(k); else s.delete(k)
    return { ...p, 유해: { ...p.유해, 대상: ['건축', '냉동', '다리', '터널', '댐', '굴착'].filter((x) => s.has(x)) } }
  })
  const 목록 = useMemo(() => (lib ? lib.유해목록(고른대상, {}, []) : []), [lib, 고른대상.join(',')])   // eslint-disable-line react-hooks/exhaustive-deps
  const 끔바꿈 = (키) => (e) => set입((p) => ({ ...p, 유해: { ...p.유해, 끔: { ...(p.유해?.끔 || {}), [키]: !e.target.checked } } }))
  const 작업바꿈 = (키, k) => (e) => { const v = e.target.value; set입((p) => ({ ...p, 유해: { ...p.유해, 작업: { ...(p.유해?.작업 || {}), [키]: { ...(p.유해?.작업?.[키] || {}), [k]: v } } } })) }
  const 자리들 = 결과?.자리들 || []
  const 유 = 입.유해 || {}

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🦺 유해위험방지계획서 한 벌</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          「산업안전보건법」 제42조 · 시행규칙 제42조제3항 · <b>별표 10(유해위험방지계획서 첨부서류)</b>대로 —
          <b> 제1장 공사개요</b>(변경이력 · 공사개요서 별지 제101호 · 주변 현황 도면 · 전체 공정표),
          <b> 제2장 안전보건경영계획</b>(경영방침 · 조직 · 회의 · 점검 · 교육 · 복지 · 건강 · 산업안전보건관리비 별지 제102호 · 연락 및 대피 · 위험성평가),
          <b> 제3장 작업공사 종류별 유해위험방지계획</b>(별표 10 제2호 — 이 공사 대상의 주요 작성대상마다),
          그리고 <b>현장 운영 서식</b>까지 한 벌로 만듭니다. 앞쪽에 별지 제17호서식 · 검토자 자격 · 작성 회의 · <b>첨부서류 대조표(쪽 번호)</b>가 붙습니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          제출 대상 판정(시행령 제42조제3항) · 작업 순서별 위험성평가 · 핵심 유해 · 위험 도출표 · 질식 · 화재 · 폭발 예방계획 · 위험물질 계획 · 산업안전보건관리비 계상이 저절로 들어갑니다.
          도면 · 사진 · 서류 사본은 그 자리에 올려 넣습니다. 가입 없음 · <b>파일은 이 브라우저 밖으로 나가지 않습니다.</b>
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 문의해 주세요</b> — 내 공사로 유해위험방지계획서를 만들어 받는 것은 K-건설맵이 직접 작성해 드립니다(견본 먼저 · 최저가). <잠금문의 도구="유해위험방지계획서" 갈래="유해위험방지계획서" 셈="유해계획" />
            지금은 <button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시보기}>🧪 예시(가상 공사)</button>로 표지부터 마지막 서식까지 쪽마다 넘겨 보실 수 있습니다.
            {' '}<예시본수 열쇠="|유해계획|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set잠금말(''); 세기('|유해계획|열쇠') }
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
            {[['공사명', '공사명'], ['위치', '현장 소재지'], ['발주청', '발주처(발주자)'], ['건설사업관리', '감리자(건설사업관리)'], ['시공자', '회사명(시공자)'], ['작성일', '작성일']].map(([k, 이름]) => (
              <label key={k}>{이름}<input value={입.공사[k] || ''} onChange={바꿈('공사', k)} /></label>
            ))}
            <label>공사착공 예정일<input type="date" value={입.공사.착공 || ''} onChange={바꿈('공사', '착공')} /></label>
            <label>공사준공 예정일<input type="date" value={입.공사.준공 || ''} onChange={바꿈('공사', '준공')} /></label>
            <label>공사도급금액(원)<input type="number" value={수칸(입.공사.공사금액)} onChange={바꿈('공사', '공사금액')} /></label>
            <label className="sp-wide">공사개요(규모)<input value={입.공사.규모 || ''} onChange={바꿈('공사', '규모')} /></label>
            {[['현장대리인', '현장소장(안전보건관리책임자)'], ['공사', '공사 담당(관리감독자)'], ['공무', '공무'], ['안전관리자', '안전관리자'], ['보건관리자', '보건관리자(선임 대상이면)']].map(([k, 이름]) => (
              <label key={k}>{이름}<input value={입.사람[k] || ''} onChange={바꿈('사람', k)} /></label>
            ))}
            {줄칸('사람', '관리감독자', '관리감독자 — 한 줄에 하나: 공종 | 이름')}
            {줄칸('사람', '협력', '협력업체(관계수급인) — 한 줄에 하나: 업체 | 공종 | 대표 | 연락처')}
          </div>

          <div className="sec-title" style={{ marginTop: 14 }}>② 제출 대상 판정(「산업안전보건법 시행령」 제42조제3항)</div>
          <div className="sp-grid">
            <label>지상높이(m)<input type="number" step="0.1" value={수칸(유.판정?.높이)} onChange={유바꿈('판정', '높이')} /></label>
            <label>연면적(㎡)<input type="number" value={수칸(유.판정?.연면적)} onChange={유바꿈('판정', '연면적')} /></label>
            <label>시설 종류(제1호 다목)
              <select value={유.판정?.시설 || ''} onChange={유바꿈('판정', '시설')}>
                <option value="">(해당 없음)</option>
                {(lib?.유해시설목록 || []).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>그 시설 연면적(㎡)<input type="number" value={수칸(유.판정?.시설연면적)} onChange={유바꿈('판정', '시설연면적')} /></label>
            <label>냉동 · 냉장 창고 설비 · 단열공사 연면적(㎡)<input type="number" value={수칸(유.판정?.냉동연면적)} onChange={유바꿈('판정', '냉동연면적')} /></label>
            <label>다리 최대 지간길이(m)<input type="number" step="0.1" value={수칸(유.판정?.지간)} onChange={유바꿈('판정', '지간')} /></label>
            <label>굴착 깊이(m)<input type="number" step="0.1" value={수칸(유.판정?.굴착깊이)} onChange={유바꿈('판정', '굴착깊이')} /></label>
            <label className="sp-chk"><input type="checkbox" checked={!!유.판정?.터널} onChange={유바꿈('판정', '터널')} /> 터널의 건설 · 개조 · 해체 공사</label>
            <label className="sp-chk"><input type="checkbox" checked={!!유.판정?.댐} onChange={유바꿈('판정', '댐')} /> 다목적댐 · 발전용댐 · 저수용량 2천만톤 이상 용수 전용 댐 · 지방상수도 전용 댐</label>
          </div>
          {판정 && <p className={판정.해당.length ? 'okline' : 'muted'} style={{ margin: '8px 0 0' }}>{판정.해당.length ? `✅ 제출 대상 — ${판정.해당.map((r) => r.호).join(' · ')}` : '위 값으로는 제출 대상이 아닙니다(아래에서 대상을 직접 고를 수도 있습니다).'}</p>}
          <div className="muted" style={{ fontSize: 12.5, margin: '10px 0 4px' }}>제3장에 넣을 대상(값으로 저절로 고름 — 직접 고치면 그것으로)</div>
          <div className="sp-grid">
            {Object.entries(대상이름).map(([k, 이름]) => (
              <label key={k} className="sp-chk"><input type="checkbox" checked={고른대상.includes(k)} onChange={대상바꿈(k)} /> {이름}</label>
            ))}
          </div>

          <div className="sec-title" style={{ marginTop: 14 }}>③ 작업공사 종류별 작성대상(별표 10 제2호) — 이 공사에 없는 것은 끄십시오</div>
          {목록.length === 0 && <p className="muted">대상을 고르면 작업공사 종류와 주요 작성대상이 나옵니다.</p>}
          {목록.map((g) => (
            <div key={g.공사} className="sp-gong" style={{ marginBottom: 8 }}>
              <b>{g.공사}</b>
              <div className="sp-sub">
                {g.항들.map((h) => {
                  const 켬 = !유.끔?.[h.키]
                  return (
                    <div key={h.키}>
                      <label className="sp-chk"><input type="checkbox" checked={켬} onChange={끔바꿈(h.키)} /> {h.제목}{h.기타 ? <span className="muted"> (주요 작성대상 외 — 비고)</span> : null}</label>
                      {켬 && (
                        <div className="sp-grid" style={{ margin: '4px 0 6px 22px' }}>
                          <label>작업 위치 · 범위<input value={유.작업?.[h.키]?.위치 || ''} onChange={작업바꿈(h.키, '위치')} /></label>
                          <label>예정 인원<input value={유.작업?.[h.키]?.인원 || ''} onChange={작업바꿈(h.키, '인원')} /></label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="sp-grid">{유줄칸('더', null, '더 적을 작업(주요 작성대상에 없는 작업 — 별표 10 제2호 비고) — 한 줄에 하나: 작업공사 | 작업 이름')}</div>

          <details className="sg-more" style={{ marginTop: 12 }}>
            <summary><b>④ 제출서 · 공사개요서 · 검토자 · 작성 회의</b> <span className="muted">— 별지 제17호 · 제101호서식 칸</span></summary>
            <div className="sp-grid">
              {[['대표자', '대표자'], ['본사', '본사소재지'], ['회사전화', '회사 전화번호'], ['발주자전화', '발주자 전화번호'], ['설계자', '설계자'], ['설계자전화', '설계자 전화번호'], ['감리자전화', '감리자 전화번호']].map(([k, 이름]) => (
                <label key={k}>{이름}<input value={유.개요101?.[k] || ''} onChange={유바꿈('개요101', k)} /></label>
              ))}
              {유줄칸('개요101', '구조물', '공사개요 — 한 줄에 하나: 대상구조물 | 구조 | 개소 | 층수(지하/지상) | 굴착깊이(m) | 최고높이(m) | 비고')}
              {[['특수구조물', '그 밖의 특수구조물 개요'], ['주요공법', '주요공법'], ['마감재', '폴리우레탄폼 및 주요마감재 사용현황']].map(([k, 이름]) => (
                <label key={k} className="sp-wide">{이름}<input value={유.개요101?.[k] || ''} onChange={유바꿈('개요101', k)} /></label>
              ))}
              {[['총동원', '예정 총동원 근로자 수(명)'], ['협력업체', '참여 예정 협력업체 수'], ['협력근로자', '참여 예정 협력업체 근로자 수(명)']].map(([k, 이름]) => (
                <label key={k}>{이름}<input type="number" value={수칸(유.근로자?.[k])} onChange={유바꿈('근로자', k)} /></label>
              ))}
              <label>계획서 작성자 성명<input value={유.작성자?.성명 || ''} onChange={유바꿈('작성자', '성명')} /></label>
              <label>작성자 주요경력<input value={유.작성자?.경력 || ''} onChange={유바꿈('작성자', '경력')} /></label>
              {[['성명', '검토자 성명'], ['자격', '검토자 자격(시행규칙 제43조)'], ['경력', '검토자 주요경력'], ['소속', '검토자 소속'], ['연락처', '검토자 연락처']].map(([k, 이름]) => (
                <label key={k}>{이름}<input value={유.검토자?.[k] || ''} onChange={유바꿈('검토자', k)} /></label>
              ))}
              {[['일시', '작성 회의 일시'], ['장소', '회의 장소'], ['참석', '참석자']].map(([k, 이름]) => (
                <label key={k}>{이름}<input value={유.회의?.[k] || ''} onChange={유바꿈('회의', k)} /></label>
              ))}
              <label className="sp-wide">검토 결과 총평<textarea rows={3} value={유.회의?.총평 || ''} onChange={유바꿈('회의', '총평')} /></label>
            </div>
          </details>

          <details className="sg-more" style={{ marginTop: 10 }}>
            <summary><b>⑤ 산업안전보건관리비(별지 제102호서식)</b> <span className="muted">— 재료비 · 직접노무비를 넣으면 계상액 · 항목별 실행계획을 셈합니다</span></summary>
            <div className="sp-grid">
              <label>공사 종류(고시 별표 1)
                <select value={유.산안비?.종류 || 'build'} onChange={유바꿈('산안비', '종류')}>
                  <option value="build">건축공사</option><option value="civil">토목공사</option><option value="heavy">중건설공사</option><option value="special">특수건설공사</option>
                </select>
              </label>
              {[['재료', '① 재료비(관급 별도 · 원)'], ['관급', '② 관급재료비(원)'], ['노무', '③ 직접노무비(원)'], ['금액', '도급 계상액(원 — 알면)']].map(([k, 이름]) => (
                <label key={k}>{이름}<input type="number" value={수칸(유.산안비?.[k])} onChange={유바꿈('산안비', k)} /></label>
              ))}
              <label className="sp-wide">④ 그 밖의 사항<input value={유.산안비?.그밖 || ''} onChange={유바꿈('산안비', '그밖')} /></label>
            </div>
            <div className="sg-help">재료비 · 직접노무비를 비우면 공사금액의 10분의 7을 대상액으로 봅니다(고시 제4조). 셈은 <Link to="/tools/sanan">산안비 계상기</Link>와 같습니다.</div>
          </details>

          <details className="sg-more" style={{ marginTop: 10 }}>
            <summary><b>⑥ 현장 여건 · 위험물질</b> <span className="muted">— 주변 · 매설물 · 지반 · 병원 · 집결지 · 휴게시설 · 위험물질 사용량</span></summary>
            <div className="sp-grid">
              <label className="sp-wide">공사현장 주변 현황<textarea rows={3} value={입.현장.주변현황 || ''} onChange={바꿈('현장', '주변현황')} /></label>
              {[['지하수위', '지하수위(GL-  m)'], ['병원', '가까운 병원'], ['병원연락처', '병원 연락처'], ['노동관서', '관할 노동관서'], ['노동관서연락처', '노동관서 연락처'], ['집결지', '비상 집결지'], ['휴게위치', '휴게시설 위치']].map(([k, 이름]) => (
                <label key={k}>{이름}<input value={입.현장[k] || ''} onChange={바꿈('현장', k)} /></label>
              ))}
              {줄칸('현장', '매설물', '지하매설물 — 종류 | 관리기관 | 규격 | 깊이(m) | 위치 | 보호 방법')}
              {줄칸('현장', '인접', '인접 구조물 — 시설물 | 구조 | 거리(m) | 예상 영향 | 대책')}
              {줄칸('현장', '지반', '지반 조건 — 지층 | 두께(m) | N치 | 상태 | 비고')}
              {(lib?.위험물질표 || []).map((r) => (
                <label key={r[0]}>{r[0]} — 예상 사용량<input value={유.위험물질?.[r[0]] || ''} onChange={(e) => { const v = e.target.value; set입((p) => ({ ...p, 유해: { ...p.유해, 위험물질: { ...(p.유해?.위험물질 || {}), [r[0]]: v } } })) }} /></label>
              ))}
            </div>
          </details>

          <details className="sg-more" style={{ marginTop: 10 }}>
            <summary><b>⑦ 간이 검토 값 · 관계전문가 확인 가설구조물</b> <span className="muted">— 크레인 인양 · 줄걸이 · 접지압 · 비계 기준 셈 · 계산서 목록</span></summary>
            <div className="sg-help">제원표(정격하중표) · 슬링 사용하중 · 지반 지지력은 제조사 자료와 지반조사 값을 넣으십시오. 관계전문가 계산서를 대신하지 않습니다.</div>
            <div className="sp-grid">
              {[['크레인', '정격', '정격하중(t, 그 반경)'], ['크레인', '인양물', '인양물 무게(t)'], ['크레인', '훅', '훅 무게(t)'], ['크레인', '줄걸이무게', '줄걸이 용구 무게(t)'], ['크레인', '줄수', '줄 수'], ['크레인', '각도', '줄걸이 각도(°)'], ['크레인', '사용하중', '슬링 사용하중(t, 1가닥)'], ['크레인', '반력', '아웃트리거 최대 반력(t)'], ['크레인', '받침면적', '받침판 면적(㎡)'], ['크레인', '지지력', '지반 허용지지력(kN/㎡)'],
                ['비계', '띠장방향', '비계기둥 간격 — 띠장 방향(m)'], ['비계', '장선방향', '비계기둥 간격 — 장선 방향(m)'], ['비계', '띠장간격', '띠장 간격(m)'], ['비계', '높이', '비계 높이(m)'], ['비계', '적재', '기둥 사이 적재하중(kg)'], ['비계', '벽이음수직', '벽이음 수직(m)'], ['비계', '벽이음수평', '벽이음 수평(m)'], ['비계', '발판폭', '작업발판 폭(cm)'],
                ['항타기', '절단하중', '권상 와이어로프 절단하중(t)'], ['항타기', '사용하중', '최대 사용하중(t)']].map(([갈, k, 이름]) => (
                <label key={갈 + k}>{이름}<input type="number" step="any" value={수칸(입.검토?.[갈]?.[k])} onChange={검토바꿈(갈, k)} /></label>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 12.5, margin: '8px 0 4px' }}>관계전문가 확인 가설구조물(「건설기술 진흥법 시행령」 제101조의2) — 쓰는 것을 고르면 계산서 목록에 들어갑니다</div>
            <div className="sp-grid">
              {(lib?.가설구조물목록 || []).map(([키, 호, 이름]) => (
                <label key={키} className="sp-chk"><input type="checkbox" checked={(입.대상?.가설구조물 || []).includes(키)} onChange={가설구조물바꿈(키)} /> {이름} <span className="muted">({호})</span></label>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* ── 미리보기 · 받기 */}
      {lib && !씀 && !예시봄 && (
        <div className="card">
          <div className="sec-title">미리보기</div>
          <p className="muted" style={{ marginTop: 0 }}>🧪 예시(가상 공사)를 열면 표지 · 제출서 · 첨부서류 대조표 · 목차부터 작업공사 종류별 계획 · 현장 운영 서식까지 한 벌을 처음부터 끝까지 쪽마다 넘겨 보실 수 있습니다.</p>
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
          {!씀 && <p className="muted" style={{ margin: '6px 0 0' }}>🧪 예시(지어낸 공사 · 이름 · 번호)입니다. 받기는 K-건설맵에 문의해 주세요 — 화면에서 처음부터 끝까지 쪽마다 넘겨 보십시오.</p>}
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
            ※ 차례 · 문장은 「산업안전보건법」 · 시행령 · 시행규칙(별표 10 · 별지 제17 · 101 · 102호서식)과 「산업안전보건기준에 관한 규칙」 등 현행 법령을 읽어 맞췄습니다(조문 확인일 2026. 11. 10.).
            계획서는 건설안전 분야 자격자(시행규칙 제43조)의 의견을 들어 작성하고, 구조계산서 · 지반조사 보고서 등은 따로 붙이십시오.
            대상인지 · 언제 내는지는 <Link to="/safety">안전관리계획서 · 유해·위험방지계획서 안내</Link>에 있습니다.
          </p>
        </div>
      )}
    </>
  )
}
