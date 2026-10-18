/**
 * 🤝 /tools/hado-docs — 하도급 계약서류 한 벌 (G321 · 2026-10-18)
 *
 * 소장님: 「하도급계약서류 도구 만들어 줘. 이 형태로 … 하도급계약조건 일반적으로 … 서류만 넣으면 자동으로」
 *         「우선은 나만 할 수 있는 걸로」 「이용자는 이용 못하게」 「예시는 이용자들이 볼 수 있게 · 사이트에서」
 *         「확실하게 · 회사 자료 및 내역서 주면 만들어 주는 걸로 · 무슨 자료가 없으면 없다고」
 *         「올리고, 보기만 가능 내려받기 없이, 실수없게 만들어 줘. 상품으로 팔아야 하니까」
 * ■ 🔒 씀 = 소장님 브라우저(lib/운영자.js) · 열쇠말(lib/gate.js). 그 밖의 분은 🧪 예시(지어낸 회사 · 지어낸 내역서)를 화면에서 «보기만»
 *      — 받기 · 인쇄 · 칸 고치기 없음. 👁 화면 조회(모든 화면 위) · 🧪 예시 본 수 보임.
 *      예시는 미리 지어 «값만» 남긴 화면 자료(data/하도급서류_예시화면.js) — 이용자 브라우저에는 만드는 엔진 · 서류 틀 · 수식 · 엑셀 파일이 가지 않음.
 *      (만드는 엔진은 «씀» 일 때 자료 넣기에서만 불러옴 — 싣기)
 * ■ 흐름(소장님): ① 자료 넣기(내역서 엑셀 + 회사 자료 PDF · 사진) → ② 내역서(율 — 몇 %든 · 직접시공 줄) → ③ 빠진 자료 → ④ 기초입력 칸 → ⑤ 만들기 · 보기 · 칸 고치기 · 인쇄 · 엑셀 받기
 *   — 모두 사이트에서(소장님 「사이트에서 작업하게 해야 해」 · 「몇 퍼센트로 하든 가능하게」): 결과 화면에서 고친 칸은 인쇄 · 받는 엑셀에 그대로(원클릭과 같게)
 * ■ 셈: lib/하도급서류.js(엑셀 짓기) · lib/하도급서류칸.js(칸 · 제안 · 빠진 것 · 계약조건) · lib/하도급서류읽기.js(회사 자료 읽기) · lib/하도급내역.js(원자료 6장)
 * ■ 쓴 횟수(소장님만): |하도급서류|예시 · |하도급서류|넣기 · |하도급서류|만들기 · |하도급서류|받기 · |하도급서류|칸고침 · |하도급서류|고친채받기 · |하도급서류|잠금 · |하도급서류|열쇠
 * ■ 넣은 자료는 이 브라우저 안에서만 다루고 어디에도 남기지 않습니다(새로고침하면 지워짐 — 엑셀을 받아 두십시오).
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 칸들, 자료들 } from '../lib/하도급서류칸.js'
import { 하자표 } from '../lib/계약셈.js'

const 엑셀화면 = lazy(() => import('../엑셀화면.jsx'))
const 하자표줄 = 하자표.flatMap((g) => g.줄)
const fmt = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const 숨 = () => new Promise((r) => setTimeout(r, 30))
const 빈 = (v) => v === undefined || v === null || String(v).trim() === ''
let 번 = 0

/* 칸마다 고를 것 — 고르면 그 글이 들어감(고쳐 쓸 수 있음) */
const 고를것 = {
  연동: ['대상 — 주요 원재료 ○○(별지 하도급대금 연동표)', '대상 아님 — 하도급대금 1억 원 이하', '대상 아님 — 계약기간 90일 이내', '대상 아님 — 원사업자가 소기업',
    '대상 아님 — 하도급대금의 10% 이상인 주요 원재료 없음', '미연동 합의 (별지 미연동 합의서)'],
  산재고용: ['수급인 일괄 가입', '하수급인 개별 가입 (근로복지공단 하수급인 사업주 인정승인)'],
  고용부담: ['일괄', '개별'], 산재부담: ['일괄', '개별'], 퇴직부담: ['일괄', '개별'],
  연금부담: ['사후정산제', '일괄', '개별'], 건강부담: ['사후정산제', '일괄', '개별'], 노인부담: ['사후정산제', '일괄', '개별'],
  산안비: ['하도급금액에 포함 — 사용내역서 · 증빙으로 정산', '수급인 집행 — 하도급금액에 포함하지 않음'],
  대금지급방법: ['하도급지킴이(발주자 전자대금지급시스템)', '하수급인 명의 계좌로 현금 지급'],
  지급자재: ['관급자재 등 — 계약조건 제12조', '없음'],
  계약이행보증: ['계약금액의 100분의 10'],
  지체상금률: ['1일당 계약금액의 1,000분의 0.5'],
}

export default function HadoDocs() {
  const [씀, set씀] = useState(() => isOpen())
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  const [잠금말, set잠금말] = useState('')
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  const 잠김 = (무엇) => { set잠금말(`🔒 ${무엇} 지금은 K-건설맵이 직접 해 드리는 것으로만 씁니다 — 🧪 예시로 어떤 서류가 나오는지 보실 수 있습니다.`); 세기('|하도급서류|잠금') }

  const [libs, setLibs] = useState(null)
  const 싣기 = async () => {
    if (libs) return libs
    const [m, h, v, q, d, k, r, x] = await Promise.all([
      import('../lib/비율.js'), import('../lib/하도급내역.js'), import('../lib/변경내역.js'), import('../lib/qtoxlsx.js'),
      import('../lib/하도급서류.js'), import('../lib/하도급서류칸.js'), import('../lib/하도급서류읽기.js'), import('../lib/엑셀읽기.js'),
    ])
    const o = { m, h, v, q, d, k, r, x }
    setLibs(o)
    return o
  }
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')

  /* ── 🧪 예시(누구나 · 보기만) ── */
  const [예시, set예시] = useState(null)
  const 예시보기 = async () => {
    set오류(''); set바쁨('예시 한 벌을 불러오는 중입니다…'); await 숨()
    try {
      /* 미리 지어 «값만» 남긴 화면 자료(tools/build_하도급서류예시화면.mjs) — 만드는 엔진 · 서류 틀 · 수식 · 엑셀 파일은 이용자에게 가지 않음 */
      const { 예시화면 } = await import('../data/하도급서류_예시화면.js')
      const 날 = 예시화면()
      set예시({ 책: { 시트들: 날.시트들, 스타일: 날.스타일, 이름들: 날.이름들, 날짜1904: 날.날짜1904 }, 시트: 날.시트, 제출: 날.제출, 원자료: 날.원자료 })
      세기('|하도급서류|예시')
    } catch (e) { set오류((e && e.message) || '예시를 짓지 못했습니다') } finally { set바쁨('') }
  }

  /* ── ① 자료 ── */
  const 칸 = useRef(null)
  const [자료, set자료] = useState([])          /* [{ id, 이름, 종류, 누구, 글, 그림, 칸 }] */
  const [내역, set내역] = useState(null)         /* { 이름, buf, 책0 } */
  const [상태들, set상태들] = useState(null)
  const [상태번호, set상태번호] = useState(0)
  const [책, set책] = useState(null)
  const [온것, set온것] = useState(null)
  const [고른시트, set고른시트] = useState([])
  const [직접, set직접] = useState(() => new Set())
  const [율글, set율글] = useState('80')
  const [단수꼴, set단수꼴] = useState('버림')
  const [손, set손] = useState({})                /* 손으로 적은 칸 */
  const [공정손, set공정손] = useState(null)
  const [결과, set결과] = useState(null)
  /* ✏️ 결과 화면에서 고친 칸(소장님 「사이트에서 작업하게 해야 해」) — 인쇄 · 받는 엑셀에 그대로(원클릭과 같게) · 다시 만들어도 남음 */
  const [고침, set고침원] = useState({})
  const set고침 = (v) => { const 새 = v || {}; if (Object.keys(새).length > Object.keys(고침).length) 세기('|하도급서류|칸고침'); set고침원(새) }

  const 내역열기 = async (L, f) => {
    const buf = await f.arrayBuffer()
    const 책0 = L.q.readWorkbook(buf)
    const 알 = L.h.상태알기(책0, L.v)
    const 여럿 = 알.상태.length > 1
    const n = 여럿 ? 알.상태.length - 1 : 0
    set내역({ 이름: f.name, buf, 책0 }); set상태들(여럿 ? 알 : null); set상태번호(n); set공정손(null)
    펴기(L, 책0, 여럿, n, f.name)
    const 이름 = L.r.내역공사명(책0)
    if (이름) set손((s) => ({ ...s, ...(빈(s.공사명) ? { _공사명내역: 이름 } : {}) }))
  }
  const 펴기 = (L, 책0, 여럿, n, 이름) => {
    const 편 = 여럿 ? L.h.상태펴기(책0, L.v, n) : 책0
    const g = L.m.격자로읽기(편, 이름, { 원가품목: true })
    const 시트 = L.m.고를만한시트(g.시트들)
    set책(편); set온것(g); set고른시트(시트)
    const 읽 = 시트.length ? L.m.시트고르기(g, 시트) : null
    set직접(new Set(읽 ? L.h.직접후보(읽) : []))
  }
  const 받기 = async (fs) => {
    const 파일들 = [...(fs || [])]
    if (!파일들.length) return
    if (!씀) { 잠김('자료 넣기는'); return }
    set오류(''); set바쁨('자료를 읽는 중입니다…'); set결과(null); await 숨()
    try {
      const L = await 싣기()
      const 새 = []
      for (const f of 파일들) {
        if (/\.(xlsx|xlsm|xls)$/i.test(f.name)) { await 내역열기(L, f); continue }
        const id = ++번
        if (/\.pdf$/i.test(f.name)) {
          let 글 = ''
          try { const p = await import('../lib/pdfwork.js'); 글 = await p.글모두(f, 8) } catch (e) { 글 = '' }
          const 종류 = 글.trim() ? L.r.종류알기(글, f.name) : (L.r.종류알기('', f.name))
          새.push({ id, 이름: f.name, 종류, 누구: 종류 === '원계약서' ? '' : /수급인|원도급/.test(f.name) && !/하수급/.test(f.name) ? '수급인' : '하수급인', 글, 그림: 글.trim() ? null : URL.createObjectURL(f), 못읽음: !글.trim() })
        } else if (/\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)) {
          새.push({ id, 이름: f.name, 종류: L.r.종류알기('', f.name), 누구: '하수급인', 글: '', 그림: URL.createObjectURL(f), 못읽음: true })
        } else 새.push({ id, 이름: f.name, 종류: '모름', 누구: '하수급인', 글: '', 그림: null, 못읽음: true, 꼴틀림: true })
      }
      set자료((a) => [...a, ...새])
      세기('|하도급서류|넣기')
    } catch (e) { set오류((e && e.message) || '읽지 못했습니다') } finally { set바쁨('') }
  }
  const 자료고침 = (id, o) => { set자료((a) => a.map((x) => (x.id === id ? { ...x, ...o } : x))); set결과(null) }
  const 자료빼기 = (id) => { set자료((a) => a.filter((x) => x.id !== id)); set결과(null) }

  const 읽은 = useMemo(() => (온것 && libs && 고른시트.length ? libs.m.시트고르기(온것, 고른시트) : null), [온것, libs, 고른시트])
  const 율 = Number(String(율글).replace(/[^\d.]/g, '')) || 0
  const 옵션 = useMemo(() => ({ 율, 단수꼴, 관급그대로: true, 직접 }), [율, 단수꼴, 직접])
  const 준비 = useMemo(() => {
    if (!읽은 || !libs || !(율 > 0 && 율 <= 100)) return null
    try { return libs.d.서류준비(읽은, 책, 옵션) } catch (e) { return { 오류: e.message } }
  }, [읽은, libs, 책, 옵션, 율])

  /* 자료 → 칸 (먼저 넣은 자료가 앞) · 손으로 적은 것이 늘 이김 */
  const 모은 = useMemo(() => {
    const 값 = {}, 출처 = {}
    if (!libs) return { 값, 출처 }
    for (const a of 자료) {
      if (!a.글 || a.종류 === '모름') continue
      const 칸들2 = libs.r.칸으로(a.종류, libs.r.읽기(a.종류, a.글), a.누구 || '하수급인')
      for (const [k, [v, 말]] of Object.entries(칸들2)) if (!(k in 값)) { 값[k] = v; 출처[k] = 말 + ' (' + a.이름 + ')' }
    }
    if (손._공사명내역 && !('공사명' in 값)) { 값.공사명 = 손._공사명내역; 출처.공사명 = '내역서 위쪽 «공사명»' }
    for (const [k, v] of Object.entries(손)) if (!k.startsWith('_')) { if (빈(v)) { delete 값[k]; delete 출처[k] } else { 값[k] = v; 출처[k] = '직접 적음' } }
    return { 값, 출처 }
  }, [자료, 손, libs])
  const 채 = useMemo(() => {
    if (!libs || !준비 || 준비.오류) return null
    const 맥 = libs.d.맥락(준비, 모은.값)
    return { ...libs.k.제안채우기(모은.값, 맥), 맥 }
  }, [libs, 준비, 모은])
  const 빠짐 = useMemo(() => (채 && libs ? libs.k.빠진것(채.값) : []), [채, libs])
  const 받은 = useMemo(() => {
    const s = new Set()
    for (const a of 자료) {
      if (a.종류 === '사업자') s.add(a.누구 === '수급인' ? '원사업자' : '하사업자')
      if (a.종류 === '등록증') s.add('하등록증')
      if (a.종류 === '경력') s.add('경력')
      if (a.종류 === '통장') s.add('통장')
      if (a.종류 === '원계약서') s.add('원계약서')
    }
    return s
  }, [자료])
  useEffect(() => { set결과(null) }, [손, 율글, 단수꼴, 직접, 고른시트, 상태번호])

  const 만들기 = async () => {
    if (!씀) { 잠김('만들기는'); return }
    if (!libs || !읽은 || !준비 || 준비.오류 || !채) return
    set오류(''); set바쁨('서류 한 벌을 짓는 중입니다…'); await 숨()
    try {
      const 입 = { 읽은, 책, 옵션, 값: 채.값, 준비, 공정: 공정손 || undefined, 맥: { 제안: 채.제안, 근거: 채.근거, 출처: 모은.출처, 받은 } }
      /* 화면에는 «고치기 전» 한 벌을 그리고(고친 칸은 화면이 노란 점선으로 덧셈), 받을 때 고친 칸을 넣어 다시 지음 */
      const 결 = libs.d.서류한벌(입)
      set결과({ ...결, 책: libs.x.엑셀읽기(결.bytes), 입 })
      if (!공정손) set공정손(결.공정.map((p) => ({ 이름: p.이름, 시작: p.시작, 끝: p.끝, i: p.i, 순: p.순 })))
      세기('|하도급서류|만들기')
    } catch (e) { set오류((e && e.message) || '만들지 못했습니다') } finally { set바쁨('') }
  }
  const 받기누름 = () => {
    if (!결과 || !libs) return
    try {
      const 결 = libs.d.서류한벌({ ...결과.입, 고침 })
      const url = URL.createObjectURL(new Blob([결.bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a')
      a.href = url; a.download = 받을이름(); document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      세기('|하도급서류|받기')
      if (결.고친수) 세기('|하도급서류|고친채받기')
    } catch (e) { set오류((e && e.message) || '엑셀을 짓지 못했습니다') }
  }
  const 받을이름 = () => {
    const 공 = String((채 && 채.값.하도급공사명) || (채 && 채.값.공사명) || '하도급').replace(/[\\/:*?"<>|]/g, '').slice(0, 40)
    return 공 + '_하도급계약서류.xlsx'
  }

  const 칸값 = (k) => (채 ? 채.값[k] : '')
  const 칸바꿈 = (k, v) => set손((s) => ({ ...s, [k]: v }))
  const 딱지 = (x) => {
    const v = 칸값(x.k)
    if (빈(v) && x.필수) return <span className="hdx-딱 없음">❌ 없음 — {(자료들[x.어디] || {}).이름}</span>
    if (채 && 채.제안.has(x.k)) return <span className="hdx-딱 제안">🟡 제안 — {채.근거[x.k] || '확인'}</span>
    if (모은.출처[x.k]) return <span className="hdx-딱 읽음">✔ {모은.출처[x.k]}</span>
    return null
  }

  return (
    <div className="wrap">
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🤝 하도급 계약서류 한 벌</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>원도급 내역서</b>와 <b>회사 자료</b>(사업자등록증 · 건설업 등록증 · 현장대리인 경력증명서 · 원도급 계약서 · 하도급지킴이 통장)를 넣으면
          하도급 계약에 내는 서류가 <b>한 벌</b>로 나옵니다 — 건설공사의 하도급계약 통보서(별지 제23호서식 «개정 2020. 3. 2.») · 하도급계약서 · <b>하도급계약조건(일반)</b> ·
          하도급원가계산서 대비표 · 원·하도급 대비표 · 하도급원가계산서 · 원·하도급 내역서 · 착공계 · 현장대리인계 · 재직증명서 · 공사공정표 · 사용인감계 · 직접지급 합의서 · 제출서류 목록.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          모든 서류가 <b>기초입력 한 장</b>을 따릅니다 — 엑셀에서 하도급률 · 날짜 한 칸을 고치면 서류가 다 따라 바뀝니다.
          <b> 빠진 자료는 «무엇이 없어서 어느 서류의 어느 칸이 비는지»</b> 로 알려 드립니다. 넣은 자료는 이 브라우저 밖으로 나가지 않습니다.
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 지금은 K-건설맵이 직접 만들어 드립니다</b> — 이 화면에서 직접 넣고 받는 것은 열지 않았습니다.
            {' '}<button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시보기}>🧪 예시 한 벌 보기</button>로 어떤 서류가 나오는지 보실 수 있습니다(보기만).
            {' '}<예시본수 열쇠="|하도급서류|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set잠금말(''); 세기('|하도급서류|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
          </div>
        )}
        {잠금말 && <div className="cwarn" style={{ marginTop: 8 }}>{잠금말}</div>}
        {바쁨 && <div className="muted" style={{ marginTop: 8 }}>⏳ {바쁨}</div>}
        {오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {오류}</div>}
      </div>

      {/* ── 🧪 예시 (누구나 · 보기만) ── */}
      {예시 && (
        <div className="card">
          <div className="sec-title">🧪 예시 한 벌 — 지어낸 회사 · 지어낸 내역서 <span className="muted" style={{ fontWeight: 500 }}>(보기만 · 받기 · 인쇄 없음)</span></div>
          <p className="muted" style={{ margin: '0 0 8px', fontSize: 13 }}>
            제출 서류 {예시.제출.length}장 + 원자료 {예시.원자료.length}장. 위 단추로 장을 넘겨 보십시오.
            {씀 ? '' : ' 실제 회사 자료로 만들어 드리는 것은 K-건설맵에 문의해 주십시오.'}
          </p>
          <Suspense fallback={<div className="muted">화면을 불러오는 중…</div>}>
            <엑셀화면 책={예시.책} 시트들={예시.시트} 고칠수={false} 인쇄함={false} 이름="하도급 계약서류 예시"
              이름표={(n) => (예시.원자료.includes(n) ? '⚙ ' + n : n)} />
          </Suspense>
        </div>
      )}

      {/* ── ① 자료 넣기 ── */}
      <div className="card">
        <div className="sec-title">① 자료 넣기 <span className="muted" style={{ fontWeight: 500 }}>(여러 개 한꺼번에)</span></div>
        {씀 ? (
          <div className="tldrop" onClick={() => 칸.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 받기(e.dataTransfer?.files) }}>
            <input ref={칸} type="file" multiple accept=".xlsx,.xlsm,.xls,.pdf,.jpg,.jpeg,.png,.webp" hidden onChange={(e) => { 받기(e.target.files); e.target.value = '' }} />
            <끌어놓기판 글="내역서 · 회사 자료를 놓으면 읽습니다" 길들={[{ 꼴: /\.(xlsx|xlsm|xls|pdf|jpe?g|png|webp)$/i, 받기: (fs) => 받기(fs), 여럿: true }]} />
            <b>＋ 파일을 끌어 놓거나 누르십시오</b>
            <span>원도급 내역서(엑셀 · 원가계산서 포함) · 원도급 계약서 · 사업자등록증(두 회사) · 건설업 등록증 · 경력증명서 · 통장 사본(PDF · 사진)</span>
          </div>
        ) : (
          <div className="tldrop sg-locked" onClick={() => 잠김('자료 넣기는')} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 잠김('자료 넣기는') }}>
            <b>🔒 자료 넣기는 열지 않았습니다</b>
            <span>원도급 내역서 · 회사 자료를 넣으면 한 벌이 만들어집니다. 지금은 위 🧪 예시로 보십시오.</span>
          </div>
        )}
        <ul className="flist" style={{ marginTop: 10 }}>
          <li><b>원도급 내역서(엑셀)</b> — 원가계산서 · 내역(공종 · 품목). 하도급할 부분의 내역서와 원가계산서를 넣으십시오.</li>
          <li><b>글자가 든 PDF</b>(홈택스 · 협회 · 전자계약 발급본)는 칸을 읽어 채웁니다. <b>사진 · 스캔</b>은 지금은 글자를 읽지 않습니다 — 옆에 그림을 띄우니 칸에 적어 주십시오.</li>
        </ul>
        {내역 && (
          <div className="note" style={{ marginTop: 8 }}>📊 <b>{내역.이름}</b>
            {읽은 ? <> — 내역 {fmt(읽은.rows.length)}줄 · 합계 {fmt(읽은.합)}원{읽은.셋있나 ? ' · 노무 · 재료 · 경비가 갈려 있음' : ' · 갈래 없음(합계로만)'}</> : ' — 쓸 시트를 켜 주십시오'}
            {상태들 && (
              <div style={{ marginTop: 6 }}>📑 품목마다 {상태들.상태.length}줄({상태들.상태.join(' · ')}) — 하도급은{' '}
                {상태들.상태.map((t, i) => <button key={t + i} type="button" className={'chip' + (i === 상태번호 ? ' on' : '')} onClick={() => { set상태번호(i); 펴기(libs, 내역.책0, true, i, 내역.이름) }}>{t}</button>)} 금액으로</div>
            )}
          </div>
        )}
        {자료.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table className="tbl left">
              <thead><tr><th>자료</th><th>무엇</th><th>누구 것</th><th>읽은 칸</th><th></th></tr></thead>
              <tbody>{자료.map((a) => {
                const 읽 = a.글 && libs ? libs.r.칸으로(a.종류, libs.r.읽기(a.종류, a.글), a.누구 || '하수급인') : {}
                return (
                  <tr key={a.id}>
                    <td style={{ maxWidth: 220 }}>{a.이름}{a.그림 && <div><img src={a.그림} alt="" style={{ maxWidth: 200, maxHeight: 140, border: '1px solid var(--line)', marginTop: 4 }} /></div>}</td>
                    <td><select value={a.종류} onChange={(e) => 자료고침(a.id, { 종류: e.target.value })}>
                      {Object.entries(libs ? libs.r.종류들 : {}).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
                    </select></td>
                    <td>{['사업자', '등록증'].includes(a.종류) ? (
                      <select value={a.누구 || '하수급인'} onChange={(e) => 자료고침(a.id, { 누구: e.target.value })}><option value="하수급인">하수급인</option><option value="수급인">수급인(원도급)</option></select>
                    ) : <span className="muted">—</span>}</td>
                    <td>{a.못읽음 ? <span className="cwarn" style={{ padding: '2px 6px' }}>{a.꼴틀림 ? '받지 않는 꼴' : '그림이라 글자를 못 읽음 — 아래 칸에 적어 주십시오'}</span>
                      : Object.keys(읽).length ? <span>{Object.keys(읽).length}칸 — {Object.entries(읽).slice(0, 4).map(([k, [v]]) => (/^\d{5,}$/.test(String(v)) ? fmt(+v) + '원' : String(v).slice(0, 14))).join(' · ')}{Object.keys(읽).length > 4 ? ' …' : ''}</span>
                        : <span className="cwarn" style={{ padding: '2px 6px' }}>읽은 칸 없음 — 무엇인지 골라 주시거나 칸에 적어 주십시오</span>}</td>
                    <td><button type="button" className="btn ghost sm" onClick={() => 자료빼기(a.id)}>빼기</button></td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ② 내역서 — 율 · 직접시공 ── */}
      {씀 && 읽은 && (
        <div className="card">
          <div className="sec-title">② 하도급률 · 하도급에서 뺄 줄</div>
          <div className="tlopts">
            <div><b>하도급률</b><label><input type="text" inputMode="decimal" style={{ width: 78 }} value={율글} onChange={(e) => set율글(e.target.value.replace(/[^\d.]/g, ''))} /> %</label>
              <span className="hdx-율고름">{['75', '80', '82', '85', '90'].map((t) => <button key={t} type="button" className={'chip' + (율글 === t ? ' on' : '')} onClick={() => set율글(t)}>{t}%</button>)}</span>
              <div className="muted" style={{ fontSize: 12 }}>몇 %든 됩니다(82.5 처럼 소수도) — 바꾸고 «서류 한 벌 만들기» 를 다시 누르면 시트 이름까지 맞게 새로 나옵니다.</div></div>
            <div><b>단수</b><label><select value={단수꼴} onChange={(e) => set단수꼴(e.target.value)}><option value="버림">원 미만 버림</option><option value="반올림">원 미만 반올림</option></select></label></div>
          </div>
          {!(율 > 0 && 율 <= 100) && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ 하도급률을 1 ~ 100 사이로 넣어 주십시오.</div>}
          {직접.size > 0 && (
            <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>원도급 직접시공(하도급 0)으로 둔 줄 {직접.size}개 — {읽은.rows.filter((r) => 직접.has(libs.h.줄열쇠(r))).map((r) => String(r.공종).slice(0, 14)).join(' · ')}
              {' '}<button type="button" className="btn ghost sm" onClick={() => set직접(new Set())}>모두 하도급으로</button></div>
          )}
          {준비 && 준비.오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {준비.오류}</div>}
          {준비 && !준비.오류 && (
            <div className="note" style={{ marginTop: 8 }}>
              원가계산서 도급액 <b>{fmt(준비.원가도급)}</b>원 → 하도급 <b>{fmt(준비.원가하도급)}</b>원 ({율}%) · 내역 하도급 대상 {fmt(준비.대상)}원
              {준비.경고.length > 0 && <ul className="flist" style={{ marginTop: 6 }}>{준비.경고.map((w, i) => <li key={i}>⚠️ <b>{w[0]}</b> · {w[1]}</li>)}</ul>}
            </div>
          )}
        </div>
      )}

      {/* ── ③ 빠진 자료 ── */}
      {씀 && 채 && (
        <div className="card">
          <div className="sec-title">③ 빠진 자료 · 확인할 것</div>
          {빠짐.length === 0 ? <div className="note">✅ 서류에 들어갈 칸이 다 있습니다. 🟡 제안값만 확인하십시오.</div> : (
            <ul className="flist">{빠짐.map((g) => (
              <li key={g.어디}><b>❌ {g.자료}</b>{g.누구 ? <span className="muted"> ({g.누구})</span> : ''} — {g.칸들.map((x) => x.이름).join(' · ')}
                <div className="muted" style={{ fontSize: 12.5 }}>→ 비어서 찍히는 서류: {g.서류.join(' · ')}</div></li>
            ))}</ul>
          )}
          {채.제안.size > 0 && <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>🟡 제안값 {채.제안.size}칸 — 아래 칸에서 노란 표시를 보시고 원도급 계약조건과 다르면 고쳐 주십시오.</div>}
        </div>
      )}

      {/* ── ④ 기초입력 ── */}
      {씀 && 채 && (
        <div className="card">
          <div className="sec-title">④ 기초입력 — 모든 서류가 이 칸을 따릅니다</div>
          {묶음들().map((g) => (
            <details key={g.묶} open={g.칸.some((x) => (빈(칸값(x.k)) && x.필수) || (채 && 채.제안.has(x.k)))} className="hdx-묶">
              <summary><b>{g.묶.replace(/^■\s*/, '')}</b> <span className="muted">— {g.칸.filter((x) => !빈(칸값(x.k))).length}/{g.칸.length}칸</span></summary>
              <div className="hdx-칸들">
                {g.칸.map((x) => (
                  <div className="hdx-칸" key={x.k}>
                    <label>{x.이름.replace(/\s+/g, ' ')}{x.필수 ? '' : <span className="muted"> (있으면)</span>}</label>
                    {x.k === '특약' ? (
                      <textarea rows={3} value={칸값(x.k) || ''} onChange={(e) => 칸바꿈(x.k, e.target.value)} placeholder="한 줄에 하나씩 — 부당특약은 효력이 없습니다" />
                    ) : x.k === '하도급률' ? <span><b>{율}%</b> <span className="muted">(위 ②에서)</span></span> : (
                      <input value={칸값(x.k) ?? ''} onChange={(e) => 칸바꿈(x.k, x.꼴 === '돈' ? e.target.value.replace(/[^\d]/g, '') : e.target.value)}
                        onBlur={(e) => { if (x.꼴 === '날' && libs) { const t = libs.k.날글(e.target.value); if (t !== e.target.value) 칸바꿈(x.k, t) } }}
                        placeholder={x.꼴 === '날' ? '2026년 10월 16일' : x.꼴 === '돈' ? '원(숫자)' : ''} inputMode={x.꼴 === '돈' ? 'numeric' : undefined} />
                    )}
                    {x.꼴 === '돈' && !빈(칸값(x.k)) && <span className="muted" style={{ fontSize: 12 }}>{fmt(칸값(x.k))}원</span>}
                    {고를것[x.k] && <div className="hdx-고름">{고를것[x.k].map((t) => <button key={t} type="button" className={'chip' + (칸값(x.k) === t ? ' on' : '')} onClick={() => 칸바꿈(x.k, t)}>{t}</button>)}</div>}
                    {x.k === '하자기간' && <div className="hdx-고름"><select value="" onChange={(e) => e.target.value && 칸바꿈(x.k, e.target.value)}>
                      <option value="">건설산업기본법 시행령 [별표 4] 에서 고르기…</option>
                      {하자표줄.map((h) => <option key={h.k} value={h.년 + '년'}>{h.년}년 — {h.이름}</option>)}
                    </select></div>}
                    {딱지(x)}
                  </div>
                ))}
              </div>
            </details>
          ))}
          {공정손 && (
            <details className="hdx-묶" open>
              <summary><b>공사공정표</b> <span className="muted">— 시작월 · 종료월(제안값 · 고치면 막대가 따라감)</span></summary>
              <table className="tbl left" style={{ marginTop: 6 }}>
                <thead><tr><th>공정</th><th>시작월</th><th>종료월</th></tr></thead>
                <tbody>{공정손.map((p, i) => (
                  <tr key={i}>
                    <td><input value={p.이름} onChange={(e) => { set결과(null); set공정손((a) => a.map((y, j) => (j === i ? { ...y, 이름: e.target.value } : y))) }} /></td>
                    <td><input type="number" min={1} max={24} style={{ width: 70 }} value={p.시작} onChange={(e) => { set결과(null); set공정손((a) => a.map((y, j) => (j === i ? { ...y, 시작: +e.target.value } : y))) }} /></td>
                    <td><input type="number" min={1} max={24} style={{ width: 70 }} value={p.끝} onChange={(e) => { set결과(null); set공정손((a) => a.map((y, j) => (j === i ? { ...y, 끝: +e.target.value } : y))) }} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </details>
          )}
        </div>
      )}

      {/* ── ⑤ 만들기 · 보기 · 받기 ── */}
      {씀 && 채 && (
        <div className="card">
          <div className="sec-title">⑤ 만들기 · 보기 · 엑셀 받기</div>
          <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <button type="button" className="btn primary" disabled={!!바쁨} onClick={만들기}>📄 서류 한 벌 만들기</button>
            {결과 && <button type="button" className="btn primary" onClick={받기누름}>⬇ {받을이름()}</button>}
          </div>
          {빠짐.length > 0 && <div className="cwarn" style={{ marginTop: 8 }}>❌ 빠진 자료가 {빠짐.reduce((a, g) => a + g.칸들.length, 0)}칸 있습니다 — 만들 수는 있지만 그 칸은 서류에 빈칸으로 찍힙니다(제출서류목록 «노란칸 — 누가 채우나» 에 적힘).</div>}
          {결과 && (
            <>
              {결과.오류칸.length > 0 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ 셈이 안 되는 칸 {결과.오류칸.length}개 — {결과.오류칸.slice(0, 4).join(' · ')}</div>}
              {결과.경고.length > 0 && <ul className="flist" style={{ marginTop: 8 }}>{결과.경고.map((w, i) => <li key={i}>⚠️ <b>{w[0]}</b> · {w[1]}</li>)}</ul>}
              {Object.keys(고침).length > 0 && <div className="note sm" style={{ marginTop: 8 }}>✏️ 화면에서 고친 칸 {Object.keys(고침).length}개도 인쇄와 받는 엑셀에 그대로 들어갑니다(수식 칸은 적은 값으로 바뀜).</div>}
              <p className="muted" style={{ fontSize: 13 }}>하도급 계약금액 <b>{fmt(결과.금액.하계약금액)}</b>원 · 하도급 부분 도급액 {fmt(결과.금액.하도급부분도급액)}원 · 공정표 {결과.월수}개월 ·
                제출 서류 {결과.제출.length}장 + 원자료 {결과.원자료.length}장(⚙ 회색 탭 — 제출용 아님)</p>
              <Suspense fallback={<div className="muted">화면을 불러오는 중…</div>}>
                <엑셀화면 책={결과.책} 시트들={결과.시트} 고침={고침} set고침={set고침} 이름={받을이름().replace(/\.xlsx$/, '')}
                  이름표={(n) => (결과.원자료.includes(n) ? '⚙ ' + n : n)} />
              </Suspense>
            </>
          )}
          <details className="sg-more" style={{ marginTop: 10 }}>
            <summary className="muted">본보기(소장님 엑셀)와 달라진 곳</summary>
            <ul className="flist">
              <li><b>통보서</b> — 별지 제23호서식을 지금 판(«개정 2020. 3. 2.»)으로: 첨부서류 1번 «특수조건 포함» · 5번 «현장설명서» · «건설사업자» · «하도급(예정)금액 · 착공(예정)».</li>
              <li><b>통보서 사회보험료</b> — «직접노무비 또는 노무비» 칸에 보험료의 바탕(노무비 · 직접노무비 · 건강보험료의 하도급분), «반영 요율» 칸에 원가계산서 요율, «반영금액» 칸에 하도급분 보험료(본보기는 원도급 보험료 · 하도급률이었음).</li>
              <li><b>계약조건</b> — 제10조 설계변경을 하도급법 제16조대로(받은 내용과 비율 · 통지 15일 · 조정 30일 · 지급 15일), 제11조 연동 · 제15조 산안비 · 제16조 보험은 표지 칸에서 고름, 제9조 직접지급 미이행 시 수급인 최종 책임(2026-08 표준 합의서), 제15조 급박한 위험 작업중지, 이 현장 특약(100분의 90 · 소급)은 «특수조건» 칸으로.</li>
              <li><b>계약이행보증</b> 제안값 — 하도급법 제13조의2② 계약금액의 100분의 10(본보기 7.5%).</li>
              <li><b>제출서류목록</b> — 쪽 번호 대신 순번(발급 서류 쪽수는 발급본마다 달라서) · 작성 서류는 비고에 인쇄 쪽수 · 지급보증서는 직접지급 합의해도 교부(2026. 8. 11. 이후 계약).</li>
              <li><b>«251205 양식» 11장</b>(다른 꼴 원가계산서 · 직접시공계획서 첨부 내역서)은 다음 판에 넣습니다.</li>
              <li><b>원가계산서</b> — 본보기 방식 그대로: 직접비 = 하도급 내역서 합 · 요율 줄은 산출근거대로 · 총원가 = 원도급 총원가 × 하도급률 «만원 미만 정리» · 이윤으로 맞춤 · 부가가치세 · 도급액 = 총원가 + 부가가치세(산출근거를 못 읽는 줄만 «원도급 × 하도급률» — 위에 알림).</li>
            </ul>
          </details>
        </div>
      )}

      <div className="card">
        <div className="sec-title">어떻게 만드나 — 적어 둡니다</div>
        <ul className="flist">
          <li><b>기초입력 한 장</b>이 모든 서류의 바탕입니다. 서류 칸은 전부 기초입력을 가리키는 수식이라, 엑셀에서 한 칸을 고치면 통보서 · 계약서 · 착공계 · 합의서가 같이 바뀝니다.</li>
          <li><b>원가계산서 · 내역서</b>는 원도급 내역서에서 바로 셈합니다 — 단가에 하도급률을 곱한 하도급 내역서 합으로 원가계산서를 짓고, 총원가는 원도급 총원가 × 하도급률을 만원 미만 정리해 이윤으로 맞춥니다(합이 늘 맞음). 하도급률은 몇 %든 됩니다.</li>
          <li><b>계약조건</b>은 공정거래위원회 「건설업종 표준하도급계약서」 · 하도급법 · 건설산업기본법에 맞춘 일반 조건입니다. 연동 · 산업안전보건관리비 · 보험 · 특수조건만 고르면 됩니다.</li>
          <li><b>빠진 자료</b>는 칸마다 «어느 자료가 없어서» 와 «어느 서류가 비는지» 로 알려 드리고, 엑셀의 제출서류목록에도 «누가 채우나» 로 남깁니다.</li>
          <li>기한: 통보서 · 하도급대금 지급보증서 · 키스콘 하도급건설공사대장 통보 모두 <b>하도급 계약일부터 30일 이내</b>. 하도급률 82% 미만이면 발주자의 적정성 심사 대상입니다.</li>
        </ul>
        <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 12, flexWrap: 'wrap' }}>
          <Link className="btn ghost" to="/naeyeok/hado">🤝 하도급 내역서 만들기(6장)</Link>
          <Link className="btn ghost" to="/tools/subcontract-check">⚖️ 하도급 적정성 판정</Link>
          <Link className="btn ghost" to="/tools/defect-period">🛡 하자담보책임기간 찾기</Link>
        </div>
      </div>
    </div>
  )

  function 묶음들() {
    const out = []
    for (const x of 칸들) {
      if (x.묶) { out.push({ 묶: x.묶, 칸: [] }); continue }
      if (out.length) out[out.length - 1].칸.push(x)
    }
    return out
  }
}
