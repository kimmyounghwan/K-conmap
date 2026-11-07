/**
 * 🏔 토적컨맵 — 토적표 · 유토곡선 · 토공유동표 · 운반집계 · 집계표 · 차수 비교 (G571 · 2026-11-06)
 *
 * 소장님: 「만들어 줘, 정확도 높여서」 · 「이름은 토적컨맵으로 하자」 · 「사용설명서 자세히 기재할 것」
 *         「유토곡선을 다른 말로 … 원래 쓰는 용어라면 그대로 쓰고」(유토곡선 그대로 · 한 번 «누가토량 곡선» 으로 풂)
 *
 * ■ 칸(localStorage 'kcm.calc.tojeok' · 🔗 이어 쓰기 ns 'mc'): 차수[{이름, 설정, 칸, 줄}] · 지금 · 보기 · 견줌
 *   줄 {측, 거, 값{칸id: 단면적}, 끊, 거원?, 값원?} — 거원 · 값원 = 엑셀에서 가져온 «원래 수»(셈 찌꺼기까지 — 설계 엑셀과 끝수까지 같게)
 * ■ 셈: lib/토적.js(시험 node tools/시험_토적.mjs) · 받기: lib/토적받기.js(엑셀 · DXF) · 사용설명서: data/tools.json «tojeok» secs
 * ■ 표에 엑셀 덩이를 붙이면(칸에 붙여넣기) 그 칸부터 아래 · 오른쪽으로 채움 · 머리 줄이 있는 표는 «📋 엑셀 표 붙여넣기» 로 칸을 맞춰 넣음
 * ■ G574(2026-11-07): ⑤ 운반 띠 «한 운반 구간도 거리별로 나눔»(설정 띠나눔 '거리') — 유토곡선에 띠 거리선(주황 점선) · 운반집계 · 유동표는 마디마다 띠 몫 줄
 * ■ G575(2026-11-07): ⑤ 🚛 사토장 · 토취장(설정 사토장 · 토취장 [{이름, 측, 밖}]) — 요약 · 유동표 · 운반집계 · 집계표에 운반거리 · 유토곡선 맨 아래 ▲ 줄(진출입 측점)
 * ■ G577(2026-11-07): 📑 설계 양식 탭 — 설계사 토공집계표 · 토량운반계산서 꼴(머리 네 줄 · 칸 합침 · lib/토적양식.js) · 📑 설계 양식 엑셀(격자책 — 칸 합침 그대로) · 인쇄 두 쪽
 * ■ G576(2026-11-07): 🔀 탭 위 «토공유동도» — 측점 사이 남는 · 모자라는 흙 막대 + 운반 몫마다 깎는 곳 무게중심 → 쌓는 곳 무게중심 화살(길이 = 평균운반거리 · 굵기 = 토량) · 사토 ↓ · 순성토 ↑ · 인쇄 한 쪽
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { use칸, Row } from './calcs.jsx'
import { 토적셈, 기본칸, 기본설정, 빈줄, 예시토적, 예시변경토적, 표풀기, 자료시작, 칸알아보기, 가져오기, 차수비교, 끝수, 숫, 높이에서, 측점풀기, 띠글, 칸이름 } from '../lib/토적.js'
import { 유동줄, 장줄들, 동그라미 } from '../lib/토적받기.js'
import { 노선살피기, 횡단토적 } from '../lib/토적횡단.js'   /* 📐 G572 횡단면도(DXF · DWG)에서 단면적 바로 읽기 */
import { use인쇄 } from './공정인쇄.js'
import { 토공양식, 운반양식 } from '../lib/토적양식.js'   /* 📑 G577 설계 양식 */
import { 세기 } from '../lib/받은수.jsx'

const 새판 = (이름 = '당초') => ({ 이름, 설정: 기본설정(), 칸: 기본칸(), 줄: Array.from({ length: 10 }, 빈줄) })
const 새id = () => 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36)
const 쉼 = (v, d = 2) => (Number.isFinite(v) ? 끝수(v, d).toLocaleString('ko-KR', { maximumFractionDigits: d }) : '')
const 보기들 = [['토적', '📋 토적표'], ['곡선', '〽️ 유토곡선'], ['유동', '🔀 토공유동표'], ['운반', '🚚 운반집계'], ['집계', '🧾 집계표'], ['양식', '📑 설계 양식'], ['차수', '🔁 차수 비교']]
const 한쪽 = 200

export function Tojeok({ ex = {} }) {
  const [차수, set차수] = use칸('차수', () => ex.차수 ?? [새판()])
  const [지금칸, set지금] = use칸('지금', ex.지금 ?? 0)
  const [보기, set보기] = use칸('보기', '토적')
  const [견줌칸, set견줌] = use칸('견줌', 0)
  const [알림, set알림] = useState('')
  const [창, set창] = useState(null)              /* 가져오기 창 {rows | 시트들} */
  const [붙글, set붙글] = useState(null)          /* 📋 붙여넣기 글 상자 */
  const [되돌릴, set되돌릴] = useState(null)      /* 가져오기 전 판 하나 */
  const [보일, set보일] = useState(한쪽)
  const [지움확인, set지움확인] = useState(false)
  const [이름고침, set이름고침] = useState(false)
  const 파일 = useRef(null)
  const 도면파일 = useRef(null)
  const [횡, set횡] = useState(null)              /* 📐 횡단면도 읽기 {바쁨} | {노선, 고른, 출처, 파일} */
  const 표틀 = useRef(null)
  const 지금 = Math.min(Math.max(0, 지금칸 | 0), Math.max(0, 차수.length - 1))
  const V = 차수[지금] || 새판()
  const setV = (f) => set차수((L) => L.map((v, i) => (i === 지금 ? (typeof f === 'function' ? f(v) : f) : v)))
  const V늦 = useDeferredValue(V)              /* 측점이 많으면(1,000줄 넘게) 셈이 수십 ms — 적는 칸은 바로, 결과는 뒤따라 */
  const R = useMemo(() => 토적셈(V늦), [V늦])
  const S = { ...기본설정(), ...(V.설정 || {}) }
  const 칸 = V.칸 || []
  const 견i = 견줌칸 === 지금 ? (지금 > 0 ? 0 : Math.min(1, 차수.length - 1)) : Math.min(Math.max(0, 견줌칸 | 0), 차수.length - 1)
  const R견 = useMemo(() => (차수.length > 1 && 견i !== 지금 ? 토적셈(차수[견i]) : null), [차수, 견i, 지금])
  const [인쇄중, 인쇄] = use인쇄(((S.공사명 || '토적') + ' 토적컨맵').trim())

  const 설 = (k, v) => setV((o) => ({ ...o, 설정: { ...기본설정(), ...(o.설정 || {}), [k]: v } }))
  const 장고침 = (k, i, f, v) => setV((o) => { const 옛 = { ...기본설정(), ...(o.설정 || {}) }; return { ...o, 설정: { ...옛, [k]: (옛[k] || []).map((u, j) => (j === i ? { ...u, [f]: v } : u)) } } })
  const 칸고침 = (i, k, v) => setV((o) => ({ ...o, 칸: o.칸.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }))
  const 칸더 = (종) => setV((o) => ({ ...o, 칸: [...o.칸, 종 === '성' ? { id: 새id(), 이름: '성토', 종: '성' } : { id: 새id(), 이름: '절토', 종: '절', C: '', 씀: true }] }))
  const 칸빼 = (i) => setV((o) => {
    const id = o.칸[i].id
    return { ...o, 칸: o.칸.filter((_, j) => j !== i), 줄: o.줄.map((r) => { const 값 = { ...(r.값 || {}) }; delete 값[id]; const n = { ...r, 값 }; if (r.값원) { const w = { ...r.값원 }; delete w[id]; n.값원 = w } return n }) }
  })
  const 줄고침 = (i, k, v) => setV((o) => ({ ...o, 줄: o.줄.map((r, j) => {
    if (j !== i) return r
    if (k === '측' || k === '끊') return { ...r, [k]: v }
    if (k === '거') { const n = { ...r, 거: v }; delete n.거원; return n }
    const n = { ...r, 값: { ...(r.값 || {}), [k]: v } }
    if (r.값원 && k in r.값원) { const w = { ...r.값원 }; delete w[k]; n.값원 = w }
    return n
  }) }))
  const 줄끼움 = (i) => setV((o) => ({ ...o, 줄: [...o.줄.slice(0, i + 1), 빈줄(), ...o.줄.slice(i + 1)] }))
  const 줄빼 = (i) => setV((o) => ({ ...o, 줄: o.줄.length > 1 ? o.줄.filter((_, j) => j !== i) : [빈줄()] }))
  const 줄더 = (n = 10) => setV((o) => ({ ...o, 줄: [...o.줄, ...Array.from({ length: n }, 빈줄)] }))
  const 빈줄빼 = () => setV((o) => {
    const 남 = o.줄.filter((r) => String(r.측 || '').trim() || String(r.거 || '').trim() || Object.values(r.값 || {}).some((v) => String(v || '').trim()))
    return { ...o, 줄: 남.length ? 남 : [빈줄()] }
  })

  /* 표 칸에 엑셀 덩이 붙이기 — 그 칸부터 오른쪽 · 아래로 */
  const 열들 = ['측', '거', ...칸.map((c) => c.id)]
  const 칸붙이기 = (e, i, 열) => {
    const t = e.clipboardData ? e.clipboardData.getData('text/plain') : ''
    if (!/[\t\n]/.test(t.replace(/\n$/, ''))) return
    e.preventDefault()
    const 덩 = 표풀기(t)
    const 시작열 = 열들.indexOf(열)
    setV((o) => {
      const 줄 = o.줄.slice()
      덩.forEach((행, a) => {
        const k = i + a
        while (줄.length <= k) 줄.push(빈줄())
        let r = { ...줄[k], 값: { ...(줄[k].값 || {}) } }
        행.forEach((v, b) => {
          const 열이름 = 열들[시작열 + b]
          if (!열이름) return
          const 글 = String(v ?? '').trim()
          if (열이름 === '측') r.측 = 글
          else if (열이름 === '거') { r.거 = 글; delete r.거원 }
          else { r.값[열이름] = 글; if (r.값원) { r.값원 = { ...r.값원 }; delete r.값원[열이름] } }
        })
        줄[k] = r
      })
      return { ...o, 줄 }
    })
    set알림(`📋 ${덩.length}줄 × ${Math.min(덩[0]?.length || 0, 열들.length - 시작열)}칸을 붙였습니다. 머리(측점 · 절토 …)가 같이 붙었으면 그 줄은 지우십시오.`)
  }
  /* Enter = 아래 칸 */
  const 아래로 = (e, i, 열) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const 다음 = 표틀.current && 표틀.current.querySelector(`[data-r="${i + 1}"][data-c="${열}"]`)
    if (다음) 다음.focus()
    else { 줄더(1); setTimeout(() => { const n = 표틀.current && 표틀.current.querySelector(`[data-r="${i + 1}"][data-c="${열}"]`); if (n) n.focus() }, 30) }
  }

  /* 📥 엑셀 파일 */
  const 파일받음 = async (f) => {
    if (!f) return
    try {
      const { readWorkbook } = await import('../lib/qtoxlsx.js')
      const 책 = readWorkbook(new Uint8Array(await f.arrayBuffer()))
      const 시트들 = Object.entries(책).map(([이름, rows]) => ({ 이름, rows: (rows || []).filter((r) => r && r.some((v) => String(v ?? '').trim() !== '')) })).filter((s) => s.rows.length)
      if (!시트들.length) { set알림('⚠️ 읽을 시트가 없습니다.'); return }
      set창({ 시트들, 파일: f.name })
      세기('|토적|엑셀열기')
    } catch (e) { set알림('⚠️ 엑셀을 읽지 못했습니다 — ' + (e?.message || e)) }
  }
  const 넣기 = (G) => {
    set되돌릴(V)
    setV((o) => ({ ...o, 칸: G.칸.length ? G.칸 : o.칸, 줄: G.줄.length ? G.줄 : o.줄, 설정: { ...기본설정(), ...(o.설정 || {}), ...(G.간격 ? { 간격: String(G.간격) } : {}), ...(G.꼴 ? { 꼴: G.꼴 } : {}) } }))
    set창(null); set붙글(null); set보일(한쪽)
    set알림(`📥 측점 ${G.줄.length}줄 · 흙 칸 ${G.칸.length}개(${G.칸.map((c) => c.이름).join(' · ')})를 넣었습니다.${G.알림.length ? ' ' + G.알림.join(' · ') + '.' : ''} 절토 칸의 C(토량환산계수)를 꼭 넣어 주십시오.`)
    세기('|토적|가져오기')
  }

  /* 📐 횡단면도(DXF · DWG) — DWG 는 DXF 로 바꾼 뒤 일꾼이 읽음(도면 3D 보기와 같은 읽개) */
  const 횡단받음 = async (files) => {
    const 들 = [...(files || [])]
    if (!들.length) return
    const 모든 = []
    try {
      for (const f of 들) {
        let buf = await f.arrayBuffer()
        if (/\.dwg$/i.test(f.name)) {
          set횡({ 바쁨: `${f.name} — DWG 를 DXF 로 바꾸는 중…` })
          const { DWG바꾸기 } = await import('../lib/dwg바꾸기.js')
          try { buf = (await DWG바꾸기(buf, f.name, (d) => set횡({ 바쁨: `${f.name} — DWG 바꾸는 중${d && d.msg ? ' · ' + d.msg : ''}` }))).dxf }
          catch (e) { if (!(e && e.kind === 'isdxf')) throw e }
        }
        set횡({ 바쁨: `${f.name} — 횡단면도 읽는 중…` })
        const r = await 횡단일꾼(buf, f.name.replace(/\.(dxf|dwg)$/i, ''), (pp) => set횡({ 바쁨: `${f.name} — 읽는 중 ${Math.round(pp * 100)}%` }))
        모든.push(...r.노선)
      }
    } catch (e) { set횡(null); set알림('⚠️ 도면을 읽지 못했습니다 — ' + ((e && (e.message || e.kind)) || e)); return }
    if (!모든.length) { set횡(null); set알림('⚠️ 횡단면도의 측점 표(NO. · 지반고)를 찾지 못했습니다. 횡단면도가 든 DXF · DWG 인지 확인해 주십시오(종평면도만 있는 파일은 단면적이 없습니다).'); return }
    모든.sort((a, b) => String(a.이름).localeCompare(String(b.이름), 'ko', { numeric: true }))
    const 첫 = 노선살피기(모든[0])
    set횡({ 노선: 모든, 고른: 0, 출처: 첫.표수 ? '표' : '선', 파일: 들.map((f) => f.name).join(' · ') })
    세기('|토적|횡단읽기')
  }
  const 횡단넣기 = (G) => { 넣기(G); set횡(null) }
  const 노선짧게 = (이름) => String(이름 || '').replace(/\s*(횡단면도|횡단도)\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20)
  const 횡단모두 = (Gs) => {
    const 비었나 = (v) => !(v.줄 || []).some((r) => String(r.측 || '').trim() || Object.values(r.값 || {}).some((x) => String(x || '').trim()))
    const 바꿈 = 차수.length === 1 && 비었나(차수[0])
    const 처음 = 바꿈 ? 0 : 차수.length
    const 새것 = Gs.map(({ G, 이름 }) => ({ 이름: 노선짧게(이름), 설정: { ...기본설정(), ...(V.설정 || {}), ...(G.간격 ? { 간격: String(G.간격) } : {}) }, 칸: G.칸, 줄: G.줄 }))
    set차수((L) => (바꿈 ? 새것 : [...L, ...새것]))
    set지금(처음); set되돌릴(null); set횡(null); set보일(한쪽)
    set알림(`📥 노선 ${Gs.length}개를 한 장씩 넣었습니다(위 «차수 · 노선» 칸) — ${Gs.map((g) => 노선짧게(g.이름) + ' ' + g.G.줄.length + '측점').join(' · ')}. 노선마다 절토 C 를 넣어 주십시오.`)
    세기('|토적|횡단모두')
  }

  /* 차수 */
  const 차수더 = () => {
    const 이름 = (차수.length === 1 ? '1회 변경' : 차수.length + '회 변경')
    set차수((L) => [...L, { ...JSON.parse(JSON.stringify(V)), 이름 }])
    set지금(차수.length); set견줌(지금)
    set알림(`🔁 «${V.이름 || '당초'}» 를 베껴 «${이름}» 을 만들었습니다 — 바뀐 단면만 고치면 «🔁 차수 비교» 에서 증감이 나옵니다.`)
  }
  const 차수빼 = () => {
    if (차수.length <= 1) return
    if (!지움확인) { set지움확인(true); return }
    set차수((L) => L.filter((_, i) => i !== 지금)); set지금(Math.max(0, 지금 - 1)); set지움확인(false)
  }

  /* 받기 */
  const [바쁨, set바쁨] = useState('')
  const 엑셀 = async () => {
    set바쁨('엑셀')
    try {
      const { 토적엑셀 } = await import('../lib/토적받기.js')
      const 견 = !R견 ? null : 견i < 지금 ? { a: 차수[견i].이름 || '앞 차수', b: V.이름 || '지금', 표: 차수비교(R견, R) } : { a: V.이름 || '지금', b: 차수[견i].이름 || '뒤 차수', 표: 차수비교(R, R견) }
      await 토적엑셀(R, V, 차수, 견)
      세기('|토적|엑셀')
    } catch (e) { set알림('⚠️ 엑셀 만들기 실패 — ' + (e?.message || e)) } finally { set바쁨('') }
  }
  const 양식엑셀 = async () => {
    set바쁨('양식')
    try {
      const { 양식엑셀바이트 } = await import('../lib/토적양식.js')
      const { 바이트받기 } = await import('../lib/값엑셀.js')
      바이트받기('토공집계표_' + (S.공사명 || '토적') + (차수.length > 1 ? '_' + (V.이름 || '') : ''), await 양식엑셀바이트(R, V))
      세기('|토적|설계양식')
    } catch (e) { set알림('⚠️ 설계 양식 엑셀 만들기 실패 — ' + (e?.message || e)) } finally { set바쁨('') }
  }
  const DXF = async () => {
    set바쁨('DXF')
    try {
      const { 토적DXF, 글받기 } = await import('../lib/토적받기.js')
      글받기('유토곡선도_' + (S.공사명 || '토적') + (차수.length > 1 ? '_' + (V.이름 || '') : '') + '.dxf', 토적DXF(R, V))
      세기('|토적|DXF')
    } catch (e) { set알림('⚠️ DXF 만들기 실패 — ' + (e?.message || e)) } finally { set바쁨('') }
  }

  const 줄으로 = useMemo(() => new Map(R.줄.map((z) => [z.i, z])), [R])
  const 측있음 = R.줄.length >= 2
  const 보이는줄 = (V.줄 || []).slice(0, 보일)

  return (
    <>
      {/* ── 차수 ── */}
      <div className="tj-bar" role="tablist" aria-label="차수">
        <span className="tj-bar-l">차수 · 노선</span>
        {차수.map((v, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === 지금} className={'tj-chip' + (i === 지금 ? ' on' : '')} onClick={() => { set지금(i); set지움확인(false); set이름고침(false) }}>{v.이름 || (i ? i + '회 변경' : '당초')}</button>
        ))}
        <button type="button" className="tj-chip add" onClick={차수더} title="지금 차수를 베껴 새 차수(설계변경)">＋ 새 차수</button>
        <button type="button" className="tj-chip ghost" onClick={() => set이름고침(!이름고침)}>✏ 이름</button>
        {차수.length > 1 && <button type="button" className={'tj-chip ghost' + (지움확인 ? ' bad' : '')} onClick={차수빼}>{지움확인 ? '정말 지울까요? 한 번 더' : '🗑 이 차수 지우기'}</button>}
      </div>
      {이름고침 && <div className="tl-grid"><Row label="차수 이름"><input value={V.이름 || ''} onChange={(e) => setV((o) => ({ ...o, 이름: e.target.value.slice(0, 20) }))} placeholder="예: 2회 변경(2027.3)" /></Row></div>}

      {/* ── ① 셈 방법 ── */}
      <div className="kt-h">① 공사 · 셈 방법</div>
      <div className="tl-grid">
        <Row label="공사명" hint="엑셀 · 도면 제목"><input value={S.공사명} onChange={(e) => 설('공사명', e.target.value.slice(0, 60))} placeholder="예: ○○ 도로 개설공사" /></Row>
        <Row label="측점 간격" hint="m · NO. 하나"><input inputMode="decimal" value={S.간격} onChange={(e) => 설('간격', e.target.value)} placeholder="20" /></Row>
        <Row label="측점 꼴">
          <select value={S.꼴} onChange={(e) => 설('꼴', e.target.value)}>
            <option value="자동">알아서(NO.12+5 · 0+120)</option>
            <option value="번호">NO.번호 + 더함</option>
            <option value="km">km + m (STA 1+020)</option>
            <option value="m">누가거리 m 그대로</option>
          </select>
        </Row>
        <Row label="토량 셈">
          <select value={S.방법} onChange={(e) => 설('방법', e.target.value)}>
            <option value="평균단면">평균단면법 (앞+뒤)÷2×거리</option>
            <option value="지배거리">지배거리법 단면×평균거리</option>
          </select>
        </Row>
        <Row label="끝수" hint="줄마다 반올림">
          <select value={String(S.끝)} onChange={(e) => 설('끝', e.target.value)}>
            <option value="2">소수 둘째 자리</option><option value="3">소수 셋째 자리</option><option value="1">소수 첫째 자리</option><option value="0">정수</option><option value="-1">안 버림</option>
          </select>
        </Row>
        <Row label="평형선">
          <select value={S.평형} onChange={(e) => 설('평형', e.target.value)}>
            <option value="시점">시점 높이(구간 처음)</option>
            <option value="최소">운반이 가장 적은 높이</option>
            <option value="직접">직접 넣기</option>
          </select>
        </Row>
      </div>
      <label className="tj-check"><input type="checkbox" checked={!!S.변이점} disabled={S.방법 !== '평균단면'} onChange={(e) => 설('변이점', e.target.checked)} /> 변이점(0점) 나눔 — 절토만 있는 측점과 성토만 있는 측점 사이를 0점에서 나눠 셈 {S.방법 !== '평균단면' && <i>(평균단면법에서만)</i>}</label>
      {S.평형 === '직접' && R.구간.length > 0 && (
        <div className="tl-grid">
          {R.구간.map((g, k) => (
            <Row key={k} label={'구간 ' + (k + 1) + ' 평형선'} hint={R.자리(g.xs) + ' ~ ' + R.자리(g.xe)}>
              <input inputMode="decimal" value={(S.평형높이 || [])[k] ?? ''} placeholder={'시점 ' + 쉼(g.시높, 1)} onChange={(e) => { const a = [...(S.평형높이 || [])]; a[k] = e.target.value; 설('평형높이', a) }} />
            </Row>
          ))}
        </div>
      )}

      {/* ── ② 흙 칸 ── */}
      <div className="kt-h">② 흙 칸 — 절토는 토질마다(C · 성토에 쓰는지) · 성토</div>
      <div className="tj-wrap">
        <table className="tj-cols">
          <thead><tr><th>이름</th><th>종류</th><th title="토량환산계수 C = 다짐 ÷ 자연 — 설계서 · 토질시험 값">C</th><th title="끄면 그 흙은 성토에 쓰지 않고 바로 사토(뻘 · 표토 등)">성토에 씀</th><th /></tr></thead>
          <tbody>
            {칸.map((c, i) => (
              <tr key={c.id}>
                <td><input value={c.이름} onChange={(e) => 칸고침(i, '이름', e.target.value.slice(0, 24))} /></td>
                <td>
                  <select value={c.종 === '성' ? '성' : '절'} onChange={(e) => 칸고침(i, '종', e.target.value)}>
                    <option value="절">절토(깎기)</option><option value="성">성토(쌓기)</option>
                  </select>
                </td>
                <td>{c.종 === '성' ? <span className="muted">—</span> : <input inputMode="decimal" className={!(숫(c.C) > 0) && c.씀 !== false ? 'tj-need' : ''} value={c.C ?? ''} onChange={(e) => 칸고침(i, 'C', e.target.value)} placeholder="예: 0.9" />}</td>
                <td>{c.종 === '성' ? '' : <input type="checkbox" checked={c.씀 !== false} onChange={(e) => 칸고침(i, '씀', e.target.checked)} aria-label="성토에 씀" />}</td>
                <td><button type="button" className="gp-x" title="이 칸 지우기" onClick={() => 칸빼(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="kt-btns">
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 칸더('절')}>＋ 절토 칸</button>
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 칸더('성')}>＋ 성토 칸</button>
      </div>

      {/* ── ③ 측점 · 단면적 ── */}
      <div className="kt-h">③ 측점 · 단면적(㎡)</div>
      <div className="kt-btns">
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set붙글(붙글 === null ? '' : null)}>📋 엑셀 표 붙여넣기(머리 줄째)</button>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 파일.current?.click()}>📥 엑셀 파일 열기</button>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!!(횡 && 횡.바쁨)} onClick={() => 도면파일.current?.click()}>📐 횡단면도(DXF · DWG) 읽기</button>
        <input ref={파일} type="file" accept=".xlsx,.xls" className="sr-only" tabIndex={-1} onChange={(e) => { 파일받음(e.target.files && e.target.files[0]); e.target.value = '' }} />
        <input ref={도면파일} type="file" accept=".dxf,.dwg" multiple className="sr-only" tabIndex={-1} onChange={(e) => { 횡단받음(e.target.files); e.target.value = '' }} />
        {되돌릴 && <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => { setV(되돌릴); set되돌릴(null); set알림('↩ 가져오기 전으로 되돌렸습니다.') }}>↩ 가져오기 전으로</button>}
      </div>
      {붙글 !== null && !창 && (
        <div className="tj-box">
          <p className="tl-p muted">엑셀에서 <b>머리 줄(측점 · 거리 · 절토 …)부터 마지막 측점까지</b> 끌어 복사(Ctrl+C)한 뒤 아래 칸에 붙이십시오(Ctrl+V). 칸을 맞추는 창이 열립니다.</p>
          <textarea className="tj-paste" rows={4} value={붙글} placeholder="여기에 붙여넣기" onChange={(e) => set붙글(e.target.value)}
                    onPaste={(e) => { const t = e.clipboardData.getData('text/plain'); if (t) { e.preventDefault(); const rows = 표풀기(t); if (rows.length) set창({ rows }); else set알림('⚠️ 붙인 글에서 표를 찾지 못했습니다.') } }} />
          <div className="kt-btns">
            <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!붙글.trim()} onClick={() => { const rows = 표풀기(붙글); if (rows.length) set창({ rows }); else set알림('⚠️ 붙인 글에서 표를 찾지 못했습니다.') }}>칸 맞추기 →</button>
            <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => set붙글(null)}>닫기</button>
          </div>
        </div>
      )}
      {창 && <가져오기창 창={창} 이전칸={칸} 닫기={() => set창(null)} 넣기={넣기} />}
      {횡 && 횡.바쁨 && <div className="gp-say">⏳ {횡.바쁨}</div>}
      {횡 && 횡.노선 && <횡단창 횡={횡} set횡={set횡} 이전칸={칸} 넣기={횡단넣기} 모두={횡단모두} />}
      {알림 && <div className="gp-say">{알림}</div>}

      <div className="tj-wrap" ref={표틀}>
        <table className="tj-in">
          <thead>
            <tr><th>#</th><th>측점</th><th title="앞 측점에서 이 측점까지(비우면 측점으로 셈)">거리(m)</th>
              {칸.map((c) => <th key={c.id} className={c.종 === '성' ? 'tj-f' : 'tj-c'}>{c.이름}</th>)}
              <th title="누가거리(측점 · 거리로 셈)">누가(m)</th><th title="교량 · 터널처럼 흙을 옮길 수 없는 곳 — 이 측점에서 유토곡선 구간을 끊음">운반<br />끊음</th><th /></tr>
          </thead>
          <tbody>
            {보이는줄.map((r, i) => {
              const z = 줄으로.get(i)
              return (
                <tr key={i} className={r.끊 ? 'tj-cut' : ''}>
                  <td className="n">{i + 1}</td>
                  <td><input data-r={i} data-c="측" value={r.측 || ''} onChange={(e) => 줄고침(i, '측', e.target.value)} onPaste={(e) => 칸붙이기(e, i, '측')} onKeyDown={(e) => 아래로(e, i, '측')} placeholder={i === 0 ? 'NO.0' : ''} /></td>
                  <td><input data-r={i} data-c="거" inputMode="decimal" value={r.거 || ''} onChange={(e) => 줄고침(i, '거', e.target.value)} onPaste={(e) => 칸붙이기(e, i, '거')} onKeyDown={(e) => 아래로(e, i, '거')} placeholder={z && i > 0 && !String(r.거 || '').trim() ? 쉼(z.d, 3) : ''} /></td>
                  {칸.map((c) => (
                    <td key={c.id}><input data-r={i} data-c={c.id} inputMode="decimal" value={(r.값 || {})[c.id] ?? ''} onChange={(e) => 줄고침(i, c.id, e.target.value)} onPaste={(e) => 칸붙이기(e, i, c.id)} onKeyDown={(e) => 아래로(e, i, c.id)} /></td>
                  ))}
                  <td className="n muted">{z ? 쉼(z.x, 3) : ''}</td>
                  <td className="c"><input type="checkbox" checked={!!r.끊} disabled={i === 0} onChange={(e) => 줄고침(i, '끊', e.target.checked)} aria-label="운반 끊음" /></td>
                  <td className="tj-rb"><button type="button" className="gp-x" title="아래에 한 줄 끼우기" onClick={() => 줄끼움(i)}>＋</button><button type="button" className="gp-x" title="이 줄 지우기" onClick={() => 줄빼(i)}>✕</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="kt-btns">
        {(V.줄 || []).length > 보일 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set보일(보일 + 한쪽)}>더 보기 (남은 {(V.줄 || []).length - 보일}줄)</button>}
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 줄더(10)}>＋ 줄 10개</button>
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={빈줄빼}>🧹 빈 줄 지우기</button>
      </div>
      <p className="tl-p muted gp-hint">칸에서 <b>Enter</b> = 아래 칸 · 엑셀에서 여러 칸을 복사해 <b>칸에 바로 붙이면</b> 그 칸부터 오른쪽 · 아래로 채웁니다(측점 · 거리 · 흙 칸 차례). 거리를 비우면 측점으로 셉니다(회색 글).</p>

      {/* ── ④ 알림 · 결과 ── */}
      {(R.오류.length > 0 || R.경고.length > 0) && (
        <ul className="tj-warn">
          {R.오류.map((w, k) => <li key={'e' + k} className="bad">⛔ {w}</li>)}
          {R.경고.map((w, k) => <li key={'w' + k}>{w}</li>)}
        </ul>
      )}
      <div className="kt-h">④ 결과 {측있음 && <span className={'tj-ok' + (R.검산.맞음 ? '' : ' bad')}>{R.검산.맞음 ? '✓ 검산 맞음' : '⛔ 검산 안 맞음'}</span>}</div>
      {측있음 ? (
        <>
          <div className="tj-sum">
            <div><span>절토(자연)</span><b>{쉼(R.합.칸.reduce((a, v, j) => a + (칸[j] && 칸[j].종 !== '성' ? v : 0), 0))} ㎥</b></div>
            <div><span>성토</span><b>{쉼(R.합.성)} ㎥</b></div>
            <div><span>횡방향 유용</span><b>{쉼(R.합.횡)} ㎥</b></div>
            <div><span>종방향 유용(운반)</span><b>{쉼(R.합.종)} ㎥</b></div>
            <div><span>평균운반거리</span><b>{쉼(R.합.L)} m</b></div>
            <div><span>사토</span><b>{쉼(R.합.사토 + 0)} ㎥{R.합.직접 > 0 ? ' + 바로 ' + 쉼(R.합.직접) : ''}</b></div>
            <div><span>순성토(토취)</span><b>{쉼(R.합.순성토)} ㎥</b></div>
            {R.띠.filter((t) => t.V > 1e-9).length > 1 && R.띠.filter((t) => t.V > 1e-9).map((t, k) => <div key={'t' + k}><span>🚜 {띠글(t)}</span><b>{쉼(t.V)} ㎥ · {쉼(t.VL / t.V)} m</b></div>)}
            {(R.합.사토L !== null || R.합.직접L !== null) && <div><span>🚛 사토장까지 평균</span><b>{[R.합.사토L !== null ? 쉼(R.합.사토L) + ' m' : '', R.합.직접L !== null ? '바로 사토 ' + 쉼(R.합.직접L) + ' m' : ''].filter(Boolean).join(' · ')}</b></div>}
            {R.합.순성토L !== null && <div><span>🚛 토취장에서 평균</span><b>{쉼(R.합.순성토L)} m</b></div>}
          </div>
          <div className="tj-tabs" role="tablist">
            {보기들.map(([k, 이름]) => <button key={k} type="button" role="tab" aria-selected={보기 === k} className={'tj-tab' + (보기 === k ? ' on' : '')} onClick={() => set보기(k)}>{이름}</button>)}
          </div>
          <div className="kt-btns">
            <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!!바쁨} onClick={엑셀}>{바쁨 === '엑셀' ? '만드는 중…' : '📗 엑셀로 받기'}</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!!바쁨} onClick={DXF}>{바쁨 === 'DXF' ? '만드는 중…' : '📐 유토곡선도 DXF'}</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!!바쁨} onClick={양식엑셀}>{바쁨 === '양식' ? '만드는 중…' : '📑 설계 양식 엑셀'}</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { 인쇄(); 세기('|토적|인쇄') }}>🖨 인쇄(A4 가로)</button>
          </div>
          {/* ⚖ G583 소장님 「지울 수 있게도 해 줘. 단, 다시 방문하게 해야 해」 — 받은 엑셀로 다시 이어서 */}
          <p className="tl-p muted gp-hint">📗 · 📑 받은 엑셀을 고쳐 셀 때는 위 <b>«📥 엑셀 파일 열기»</b>로 다시 불러오면 측점 · 거리 · 단면적이 그대로 들어와 이어서 셉니다. 엑셀 맨 아래 «K-건설맵» 줄은 지워도 됩니다.</p>
          {보기 === '토적' && <토적표 R={R} />}
          {보기 === '곡선' && <><유토그림 R={R} /><마디표 R={R} /></>}
          {보기 === '유동' && <><유동도 R={R} /><유동표 R={R} /></>}
          {보기 === '운반' && <운반표 R={R} />}
          {보기 === '집계' && <집계표 R={R} />}
          {보기 === '양식' && <><양식표 g={토공양식(R, V)} 끝={R.끝} /><양식표 g={운반양식(R, V)} 끝={2} /></>}
          {보기 === '차수' && (
            차수.length < 2 ? <p className="muted">차수가 하나뿐입니다. 위 <b>＋ 새 차수</b> 를 누르면 지금 것을 베낀 변경 차수가 생기고, 고친 뒤 여기서 증감을 봅니다.</p> : (
              <>
                <div className="tl-grid">
                  <Row label="견줄 차수">
                    <select value={견i} onChange={(e) => set견줌(Number(e.target.value))}>
                      {차수.map((v, i) => (i === 지금 ? null : <option key={i} value={i}>{v.이름 || (i ? i + '회 변경' : '당초')}</option>))}
                    </select>
                  </Row>
                </div>
                {R견 && (견i < 지금
                  ? <차수표 a={차수[견i].이름 || '앞 차수'} b={V.이름 || '지금'} T={차수비교(R견, R)} />
                  : <차수표 a={V.이름 || '지금'} b={차수[견i].이름 || '뒤 차수'} T={차수비교(R, R견)} />)}
              </>
            )
          )}
          {인쇄중 && createPortal(<div id="gp-인쇄"><인쇄판 R={R} 판={V} /></div>, document.body)}
        </>
      ) : <p className="muted">측점을 둘 이상 적으면 토적표 · 유토곡선 · 토공유동표 · 운반집계가 바로 나옵니다. 위 <b>🧪 예시로 해 보기</b> 를 눌러 보십시오.</p>}

      {/* ── ⑤ 운반 띠 · 토취 ── */}
      <details className="tj-more">
        <summary>⑤ 운반 거리 나눔(장비) · 사토장 · 토취장 · 토취 흙 C</summary>
        <p className="tl-p muted">운반집계를 거리로 나눕니다(예: 불도저 60 m 까지 · 그 밖 덤프트럭). 거리는 설계서 · 시방 기준대로 넣으십시오. 마지막 띠의 «까지» 를 비우면 그보다 먼 운반을 모두 담습니다.</p>
        <div className="tj-wrap">
          <table className="tj-cols">
            <thead><tr><th>이름(장비)</th><th>까지(m)</th><th /></tr></thead>
            <tbody>
              {(S.띠 || []).map((t, k) => (
                <tr key={k}>
                  <td><input value={t.이름 || ''} onChange={(e) => { const a = (S.띠 || []).map((u, j) => (j === k ? { ...u, 이름: e.target.value.slice(0, 16) } : u)); 설('띠', a) }} placeholder="예: 불도저" /></td>
                  <td><input inputMode="decimal" value={t.까지 ?? ''} onChange={(e) => { const a = (S.띠 || []).map((u, j) => (j === k ? { ...u, 까지: e.target.value } : u)); 설('띠', a) }} placeholder="비우면 그 밖 모두" /></td>
                  <td><button type="button" className="gp-x" onClick={() => 설('띠', (S.띠 || []).filter((_, j) => j !== k))}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="kt-btns"><button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 설('띠', [...(S.띠 || []), { 이름: '', 까지: '' }])}>＋ 띠</button></div>
        <div className="tj-radio" role="radiogroup" aria-label="한 운반 구간을 나누는 법">
          <label className="tj-check"><input type="radio" name="tj-띠나눔" checked={S.띠나눔 !== '거리'} onChange={() => 설('띠나눔', '구간')} /> <span>한 운반 구간 = 한 장비 <i>— 구간(①②…)마다 평균운반거리로 띠 하나</i></span></label>
          <label className="tj-check"><input type="radio" name="tj-띠나눔" checked={S.띠나눔 === '거리'} onChange={() => 설('띠나눔', '거리')} /> <span>한 운반 구간도 거리별로 나눔 <i>— 유토곡선에 띠 거리 길이의 가로선(주황 점선)을 그어 그 위(짧은 운반)는 짧은 장비, 아래(긴 운반)는 긴 장비</i></span></label>
        </div>
        {S.띠나눔 === '거리' && R.띠.length < 2 && <p className="tl-p muted">띠를 둘 이상(예: 불도저 60 · 덤프트럭 비움) 넣어야 나눕니다.</p>}
        <div className="tl-sub">🚛 사토장 · 토취장</div>
        <p className="tl-p muted">남는 흙(사토 · 바로 사토)이 가는 곳, 모자라는 흙(순성토)이 오는 곳을 넣으면 흙마다 <b>길 따라 진출입 측점까지 평균 거리 + 밖 거리</b>가 가장 짧은 곳으로 운반거리를 셉니다. 진출입 측점을 비우면 밖 거리만 씁니다(설계서에 운반거리 한 값만 있을 때).</p>
        {['사토장', '토취장'].map((k) => ((S[k] || []).length > 0 && (
          <div key={k} className="tj-wrap">
            <table className="tj-cols tj-jangt">
              <thead><tr><th>{k}</th><th title="길에서 그 곳으로 나가는 측점 — 비우면 밖 거리만">진출입 측점</th><th title="진출입 측점에서 그 곳까지 길 밖 운반거리">밖 거리(m)</th><th /></tr></thead>
              <tbody>
                {(S[k] || []).map((s, i) => (
                  <tr key={i}>
                    <td><input value={s.이름 || ''} onChange={(e) => 장고침(k, i, '이름', e.target.value.slice(0, 16))} placeholder={k + ' ' + (i + 1)} /></td>
                    <td><input value={s.측 || ''} onChange={(e) => 장고침(k, i, '측', e.target.value)} placeholder="예: NO.5 · 비우면 밖만" /></td>
                    <td><input inputMode="decimal" value={s.밖 ?? ''} onChange={(e) => 장고침(k, i, '밖', e.target.value)} placeholder="예: 1200" /></td>
                    <td><button type="button" className="gp-x" title="지우기" onClick={() => 설(k, (S[k] || []).filter((_, j) => j !== i))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )))}
        <div className="kt-btns">
          <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 설('사토장', [...(S.사토장 || []), { 이름: '', 측: '', 밖: '' }])}>＋ 사토장</button>
          <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 설('토취장', [...(S.토취장 || []), { 이름: '', 측: '', 밖: '' }])}>＋ 토취장</button>
        </div>
        <div className="tl-grid"><Row label="토취 흙 C" hint="순성토를 자연 상태로"><input inputMode="decimal" value={S.토취C || ''} onChange={(e) => 설('토취C', e.target.value)} placeholder="비우면 다짐 기준만" /></Row></div>
      </details>
    </>
  )
}

/* ── 가져오기 창 — 머리 줄 · 칸마다 할 일 ───────────────────────────── */
/* ── 📐 횡단면도에서 읽은 노선 고르기 ─────────────────────────────── */
function 횡단일꾼(buf, name, 알려) {
  return new Promise((res, rej) => {
    const w = new Worker(new URL('../lib/토적횡단.worker.js', import.meta.url), { type: 'module' })
    w.onmessage = (ev) => {
      const d = ev.data || {}
      if (d.type === 'prog') { if (알려) 알려(d.p); return }
      w.terminate()
      if (d.type === 'done') res({ 노선: d.노선 || [], 까닭: d.까닭 }); else rej(new Error(d.msg || '읽기 실패'))
    }
    w.onerror = (e) => { w.terminate(); rej(new Error((e && e.message) || '읽기 실패')) }
    w.postMessage({ buf, name }, [buf])
  })
}
function 횡단창({ 횡, set횡, 이전칸, 넣기, 모두 }) {
  const L = 횡.노선[횡.고른] || 횡.노선[0]
  const 살 = 노선살피기(L)
  const 출처 = 횡.출처 === '표' && !살.표수 ? '선' : 횡.출처
  const G = useMemo(() => 횡단토적(L, 출처, 이전칸), [L, 출처, 이전칸])
  const 쉼1 = (v) => (Number.isFinite(v) ? 끝수(v, 2).toLocaleString('ko-KR') : '')
  return (
    <div className="tj-box">
      <div className="tj-box-h">📐 횡단면도에서 읽은 노선 {횡.노선.length}개{횡.파일 ? ' — ' + 횡.파일 : ''}</div>
      <div className="tj-wrap">
        <table className="tj-map">
          <thead><tr><th /><th>노선</th><th>측점</th><th>표 값</th><th>선 값</th><th>측점 간격</th></tr></thead>
          <tbody>
            {횡.노선.map((x, i) => {
              const a = 노선살피기(x)
              const g = 횡단토적(x, a.표수 ? '표' : '선', [])
              /* 길이는 측점 글 + 읽은 간격으로(3D 보기의 짐작 간격이 아니라) */
              const 앞m = g.줄.length ? (측점풀기(g.줄[0].측, g.간격 || 20) || {}).m : NaN, 뒤m = g.줄.length ? (측점풀기(g.줄[g.줄.length - 1].측, g.간격 || 20) || {}).m : NaN
              return (
                <tr key={i} className={i === 횡.고른 ? '' : 'off'}>
                  <td className="c"><input type="radio" name="tj-hd" checked={i === 횡.고른} onChange={() => set횡({ ...횡, 고른: i, 출처: a.표수 ? '표' : '선' })} aria-label={x.이름} /></td>
                  <td className="tj-mh">{x.이름}</td>
                  <td className="r">{a.n}곳 · {쉼1(앞m)} ~ {쉼1(뒤m)} m</td>
                  <td className="r">{a.표수 ? a.표수 + '곳' : '없음'}</td>
                  <td className="r">{a.선수 ? a.선수 + '곳' : '없음'}</td>
                  <td className="r">{g.간격 ? g.간격 + ' m' + (g.간근거 === '짐작' ? ' 📌짐작' : ' (종평면도)') : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="tj-src">
        <label><input type="radio" name="tj-src" checked={출처 === '표'} disabled={!살.표수} onChange={() => set횡({ ...횡, 출처: '표' })} /><span>📋 <b>표 값</b> — 측점 표에 설계자가 적은 면적{살.세부.절토.length ? '(흙깎기 토질별 ' + 살.세부.절토.join(' · ') + ')' : ''} · 설계 토적표와 같음{!살.표수 && <i> — 이 노선엔 없음</i>}</span></label>
        <label><input type="radio" name="tj-src" checked={출처 === '선'} disabled={!살.선수} onChange={() => set횡({ ...횡, 출처: '선' })} /><span>📏 <b>선으로 잰 면적</b> — 지반선 · 계획선 사이를 잰 어림(표 값이 없는 도면)</span></label>
      </div>
      <p className="tl-p">넣을 것: 측점 <b>{G.줄.length}</b>곳 · 흙 칸 <b>{G.칸.length}</b>개({G.칸.map((c) => c.이름 + (c.종 === '성' && !/성토/.test(c.이름) ? '(성토)' : '')).join(' · ') || '—'}){G.간격 ? ' · 측점 간격 ' + G.간격 + ' m' : ''}{G.줄[0] ? ' · 첫 측점 ' + G.줄[0].측 : ''}</p>
      {G.알림.length > 0 && <ul className="tj-warn">{G.알림.map((a, k) => <li key={k}>{a}</li>)}</ul>}
      <div className="kt-btns">
        <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!G.줄.length || !G.칸.length} onClick={() => 넣기(G)}>이 노선 넣기 (지금 표를 바꿈)</button>
        {횡.노선.length > 1 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 모두(횡.노선.map((x) => { const a = 노선살피기(x); return { 이름: x.이름, G: 횡단토적(x, a.표수 ? '표' : '선', 이전칸) } }))}>노선 {횡.노선.length}개 모두 — 노선마다 한 장</button>}
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => set횡(null)}>그만</button>
      </div>
    </div>
  )
}

const 할들 = [['무시', '안 씀'], ['측', '측점'], ['더', '측점 더함(+)'], ['거', '점간 거리'], ['누', '누가거리'], ['절', '절토 단면적'], ['성', '성토 단면적'], ['끊', '운반 끊음']]   /* ⚖ G583 끊음 칸 */
function 가져오기창({ 창, 이전칸, 닫기, 넣기 }) {
  const 처음시트 = () => {
    if (!창.시트들) return ''
    /* 측점 칸 + 단면적 칸이 있는 시트 — «삭제 · 백업 · 이전» 이름은 뒤로 */
    const 맞는 = 창.시트들.filter((s) => { const k = 칸알아보기(s.rows, 자료시작(s.rows)); return k.some((x) => x.할 === '측' || x.할 === '누') && k.some((x) => x.할 === '절' || x.할 === '성') })
    const 고른 = 맞는.find((s) => !/삭제|백업|이전|old|사본/i.test(s.이름)) || 맞는[0]
    return (고른 || 창.시트들[0]).이름
  }
  const [시트, set시트] = useState(처음시트)
  const rows = 창.시트들 ? ((창.시트들.find((s) => s.이름 === 시트) || 창.시트들[0]).rows) : 창.rows
  const [머리수, set머리수] = useState(() => 자료시작(rows))
  const [고침, set고침] = useState({})
  useEffect(() => { set머리수(자료시작(rows)); set고침({}) }, [시트])   // eslint-disable-line react-hooks/exhaustive-deps
  const 칸들 = useMemo(() => 칸알아보기(rows, 머리수), [rows, 머리수])
  const 맞춤 = 칸들.map((k) => ({ ...k, ...(고침[k.c] || {}) }))
  const 보일칸 = 맞춤.filter((k) => k.머리 || k.보기.some(Boolean))
  const 됨 = 맞춤.some((m) => m.할 === '측' || m.할 === '누') && 맞춤.some((m) => m.할 === '절' || m.할 === '성')
  const 미리 = useMemo(() => (됨 ? 가져오기(rows, 머리수, 맞춤.filter((m) => m.할 !== '무시'), 이전칸) : null), [됨, rows, 머리수, JSON.stringify(고침), 칸들])   // eslint-disable-line react-hooks/exhaustive-deps
  /* ⚖ G583 «흙 칸 이름» 빈칸에 보이는 글 = 실제로 넣을 이름(지금 표 칸 이름을 이어 받으면 그 이름) */
  const 미리이름 = {}
  if (미리) 맞춤.filter((m) => m.할 === '절' || m.할 === '성').forEach((m, i) => { if (미리.칸[i]) 미리이름[m.c] = 미리.칸[i].이름 })
  return (
    <div className="tj-box">
      <div className="tj-box-h">📥 칸 맞추기{창.파일 ? ' — ' + 창.파일 : ''}</div>
      <div className="tl-grid">
        {창.시트들 && (
          <Row label="시트">
            <select value={시트} onChange={(e) => set시트(e.target.value)}>{창.시트들.map((s) => <option key={s.이름} value={s.이름}>{s.이름} ({s.rows.length}줄)</option>)}</select>
          </Row>
        )}
        <Row label="머리 줄 수" hint="자료 앞 줄"><input inputMode="numeric" value={머리수} onChange={(e) => set머리수(Math.max(0, Math.min(40, parseInt(e.target.value || '0', 10) || 0)))} /></Row>
      </div>
      <div className="tj-wrap">
        <table className="tj-map">
          <thead><tr><th>엑셀 칸</th><th>머리</th><th>처음 값</th><th>할 일</th><th>흙 칸 이름</th></tr></thead>
          <tbody>
            {보일칸.map((k) => (
              <tr key={k.c} className={k.할 === '무시' ? 'off' : ''}>
                <td className="n">{열글(k.c)}</td>
                <td className="tj-mh">{k.머리 || <span className="muted">(없음)</span>}</td>
                <td className="tj-mv">{k.보기.filter(Boolean).slice(0, 3).join(' · ')}</td>
                <td><select value={k.할} onChange={(e) => set고침((o) => ({ ...o, [k.c]: { ...(o[k.c] || {}), 할: e.target.value } }))}>{할들.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></td>
                <td>{(k.할 === '절' || k.할 === '성') ? <input value={k.이름 ?? ''} placeholder={미리이름[k.c] || 칸이름(k.머리)} onChange={(e) => set고침((o) => ({ ...o, [k.c]: { ...(o[k.c] || {}), 이름: e.target.value.slice(0, 24) } }))} /> : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tl-p muted gp-hint">«부피(㎥)» 칸은 넣지 않습니다(토적컨맵이 다시 셈) · «계» 줄은 빼고 넣습니다 · 측점이 «번호 | 더함» 두 칸이면 둘 다 고르십시오.</p>
      {미리 && <p className="tl-p">넣을 것: 측점 <b>{미리.줄.length}</b>줄 · 흙 칸 <b>{미리.칸.length}</b>개({미리.칸.map((c) => c.이름 + (c.종 === '성' && !/성토/.test(c.이름) ? '(성토)' : '')).join(' · ')}){미리.줄[0] ? ' · 첫 측점 ' + 미리.줄[0].측 : ''}{미리.간격 ? ' · 측점 간격 ' + 미리.간격 + ' m' : ''}</p>}
      <div className="kt-btns">
        <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!미리 || !미리.줄.length} onClick={() => 넣기(미리)}>이대로 넣기 (지금 표를 바꿈)</button>
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={닫기}>그만</button>
      </div>
      {!됨 && <p className="tl-p muted">«측점»(또는 누가거리) 칸 하나와 단면적 칸을 하나 이상 골라 주십시오.</p>}
    </div>
  )
}
const 열글 = (c) => { let s = '', n = c + 1; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) } return s }

/* ── 결과 표들 ─────────────────────────────────────────────────── */
function 토적표({ R }) {
  const 칸 = R.칸, 씀칸 = 칸.filter((c) => c.종 !== '성' && c.씀 !== false)
  const 지배 = R.방법 === '지배거리'
  const d = R.끝 < 0 ? 3 : R.끝
  return (
    <div className="tj-wrap">
      <table className="tj-t">
        <thead>
          <tr><th rowSpan={2}>측점</th><th rowSpan={2}>누가(m)</th><th rowSpan={2}>거리(m)</th>{지배 && <th rowSpan={2}>평균거리</th>}
            <th colSpan={칸.length}>단면적(㎡)</th><th colSpan={칸.length}>토량(㎥){지배 ? ' 단면×평균거리' : ' 평균단면'}</th>
            <th rowSpan={2}>보정 절토<br /><small>Σ절토×C</small></th><th rowSpan={2}>성토</th><th rowSpan={2}>횡방향<br />유용</th><th rowSpan={2}>차인</th><th rowSpan={2}>누가토량</th></tr>
          <tr>{칸.map((c) => <th key={'a' + c.id} className="s">{c.이름}</th>)}{칸.map((c) => <th key={'v' + c.id} className="s">{c.이름}</th>)}</tr>
        </thead>
        <tbody>
          {R.줄.map((z, k) => (
            <tr key={k} className={z.끊 ? 'tj-cut' : ''}>
              <td className="l">{z.측}{z.변 ? ' 〰' : ''}</td><td>{쉼(z.x, 3)}</td><td>{k ? 쉼(z.d, 3) : ''}</td>{지배 && <td>{쉼(z.평, 3)}</td>}
              {z.A.map((v, j) => <td key={'a' + j} className="g">{v ? 쉼(v, 3) : ''}</td>)}
              {z.V.map((v, j) => <td key={'v' + j}>{v ? 쉼(v, d) : ''}</td>)}
              <td>{z.U ? 쉼(z.U, d) : ''}</td><td>{z.F ? 쉼(z.F, d) : ''}</td><td>{z.횡 ? 쉼(z.횡, d) : ''}</td><td className={z.차 < 0 ? 'neg' : ''}>{z.차 ? 쉼(z.차, d) : ''}</td><td className="b">{쉼(z.M, d)}</td>
            </tr>
          ))}
          <tr className="sum">
            <td className="l">계</td><td /><td>{쉼(R.합.길이, 3)}</td>{지배 && <td />}
            {칸.map((c) => <td key={'a' + c.id} />)}
            {R.합.칸.map((v, j) => <td key={'v' + j}>{쉼(v, d)}</td>)}
            <td>{쉼(R.합.유용, d)}</td><td>{쉼(R.합.성, d)}</td><td>{쉼(R.합.횡, d)}</td><td>{쉼(R.합.유용 - R.합.성, d)}</td><td />
          </tr>
        </tbody>
      </table>
      <p className="tl-p muted gp-hint">보정 절토 = 성토에 쓰는 절토 칸마다 토량 × C({씀칸.map((c) => c.이름 + ' ' + (숫(c.C) > 0 ? c.C : '1')).join(' · ')}) · 차인 = 보정 절토 − 성토 · 누가토량 = 차인을 처음부터 더한 값(유토곡선의 높이){지배 ? ' · 지배거리법은 측점 사이 가운데까지 더한 값' : ''} · 〰 = 변이점으로 나눈 구간</p>
    </div>
  )
}

function 유토그림({ R }) {
  const 점 = R.점
  if (점.length < 2) return null
  const xs = 점[0].x, xe = 점[점.length - 1].x, 길 = Math.max(1e-9, xe - xs)
  /* ▲ 사토장 · 토취장 진출입 측점(그림 안에 드는 것만) — 그림 맨 아래 따로 한 줄(측점 글 아래 · 마디 번호와 안 겹침) */
  const 장표 = [...(R.장 ? R.장.사 : []).map((s) => ({ s, 꼴: '사' })), ...(R.장 ? R.장.순 : []).map((s) => ({ s, 꼴: '순' }))].filter(({ s }) => Number.isFinite(s.x) && s.x >= xs - 1e-9 && s.x <= xe + 1e-9)
  const 장줄 = 장표.length ? 26 : 0
  const W = 1000, H = 470 + 장줄, 왼 = 78, 오 = 18, 위 = 58, 아래 = 78 + 장줄
  let mn = Math.min(0, ...점.map((p) => p.m), ...R.구간.map((g) => g.b)), mx = Math.max(0, ...점.map((p) => p.m), ...R.구간.map((g) => g.b))
  if (!(mx > mn)) mx = mn + 1
  const 여 = (mx - mn) * 0.08; mn -= 여; mx += 여
  const X = (x) => 왼 + ((x - xs) / 길) * (W - 왼 - 오)
  const Y = (m) => 위 + ((mx - m) / (mx - mn)) * (H - 위 - 아래)
  const 간 = 좋은간((mx - mn) / 6)
  const 눈 = []
  for (let v = Math.ceil(mn / 간) * 간; v <= mx; v += 간) 눈.push(v)
  const 측라벨 = []
  let 앞 = -Infinity
  for (const z of R.줄) { if (!z.측) continue; const px = X(z.x); if (px - 앞 >= 30) { 측라벨.push(z); 앞 = px } }
  const 띠있음 = (R.띠선 || []).length > 0, 장있음 = 장표.length > 0
  const 다각 = []
  for (const g of R.구간) for (const q of g.마디) {
    if (q.꼴 === '평' || !(q.V > 1e-9 || q.사 > 1e-9 || q.순 > 1e-9)) continue
    const 안 = g.점.filter((p) => p.x > q.xa && p.x < q.xb)
    const 줄 = [[q.xa, g.b], [q.xa, 높이에서(g.점, q.xa)], ...안.map((p) => [p.x, p.m]), [q.xb, 높이에서(g.점, q.xb)], [q.xb, g.b]]
    다각.push({ q, g, d: 줄.map(([x, m]) => X(x).toFixed(1) + ',' + Y(m).toFixed(1)).join(' ') })
  }
  return (
    <div className="tj-paper">
      <svg viewBox={`0 0 ${W} ${H}`} className="tj-svg" role="img" aria-label="유토곡선">
        {눈.map((v) => <g key={v}><line x1={왼} x2={W - 오} y1={Y(v)} y2={Y(v)} className={Math.abs(v) < 간 * 1e-6 ? 'tj-z' : 'tj-g'} /><text x={왼 - 6} y={Y(v) + 4} className="tj-yl">{쉼(v, 0)}</text></g>)}
        {R.줄.filter((z) => z.측).map((z, k) => <line key={k} x1={X(z.x)} x2={X(z.x)} y1={H - 아래} y2={H - 아래 + 5} className="tj-tk" />)}
        {측라벨.map((z, k) => <text key={k} x={X(z.x)} y={H - 아래 + 9} className="tj-xl" transform={`rotate(-45 ${X(z.x)} ${H - 아래 + 9})`}>{z.측}</text>)}
        {다각.map((p, k) => <polygon key={k} points={p.d} className={p.q.꼴 === '위' ? 'tj-hill' : 'tj-valley'} />)}
        {R.구간.map((g) => (
          <g key={g.번}>
            <line x1={X(g.xs)} x2={X(g.xe)} y1={Y(g.b)} y2={Y(g.b)} className="tj-bal" />
            {g.번 > 0 && <><line x1={X(g.xs)} x2={X(g.xs)} y1={위} y2={H - 아래} className="tj-brk" /><text x={X(g.xs) + 4} y={위 + 12} className="tj-bl">운반 끊음</text></>}
          </g>
        ))}
        {(R.띠선 || []).map((s, k) => {
          /* 글은 마디 안쪽(언덕은 선 아래 · 골짜기는 선 위) — 평형선에 붙은 선이면 반대쪽에 */
          const g = R.구간[s.구간], 붙음 = !!g && Math.abs(Y(s.m) - Y(g.b)) < 16
          const 아래글 = (s.꼴 === '아래') === 붙음
          return (
            <g key={'d' + k}>
              <line x1={X(s.xa)} x2={X(s.xb)} y1={Y(s.m)} y2={Y(s.m)} className="tj-dl" />
              <text x={(X(s.xa) + X(s.xb)) / 2} y={Y(s.m) + (아래글 ? 13 : -5)} className="tj-dlt">{(s.이름 ? s.이름 + ' ' : '') + 쉼(s.까지) + ' m'}</text>
            </g>
          )
        })}
        <polyline points={점.map((p) => X(p.x).toFixed(1) + ',' + Y(p.m).toFixed(1)).join(' ')} className="tj-curve" />
        {장표.map(({ s, 꼴 }, k) => {
          const x = X(s.x), 오른 = x > W - 170
          return (
            <g key={'j' + k}>
              <path d={`M ${x.toFixed(1)} ${H - 장줄 + 3} l -6 11 h 12 z`} className={꼴 === '사' ? 'tj-site-s' : 'tj-site-b'} />
              <text x={오른 ? x - 9 : x + 9} y={H - 장줄 + 13} className="tj-sitet" style={{ textAnchor: 오른 ? 'end' : 'start' }}>{s.이름}{s.밖 > 0 ? ' · 밖 ' + 쉼(s.밖, 0) + ' m' : ''}</text>
            </g>
          )
        })}
        {R.마디.map((q) => {
          const g = R.구간[q.구간]
          const 안 = g.점.filter((p) => p.x >= q.xa && p.x <= q.xb)
          const 끝 = 안.length ? 안.reduce((a, p) => (Math.abs(p.m - g.b) > Math.abs(a.m - g.b) ? p : a), 안[0]) : { x: (q.xa + q.xb) / 2, m: g.b }
          const 위로 = q.꼴 !== '아래'
          const cy = Math.max(위 - 6, Math.min(H - 아래 - 16, Y(끝.m) + (위로 ? -16 : 16)))
          const cx = X(끝.x), 오른 = cx > W - 190
          return (
            <g key={q.번}>
              {(q.사묶음 || []).map((m, k) => <line key={'s' + k} x1={X(m.xa)} x2={X(m.xb)} y1={H - 아래 - 4} y2={H - 아래 - 4} className="tj-spoil" />)}
              {(q.순묶음 || []).map((m, k) => <line key={'b' + k} x1={X(m.xa)} x2={X(m.xb)} y1={H - 아래 - 10} y2={H - 아래 - 10} className="tj-borrow" />)}
              <circle cx={cx} cy={cy} r="9" className="tj-num" /><text x={cx} y={cy + 4} className="tj-numt">{q.번}</text>
              {q.V > 1e-9 && <text x={오른 ? cx - 13 : cx + 13} y={cy + 4} className="tj-ql" style={{ textAnchor: 오른 ? 'end' : 'start' }}>{q.방향} {쉼(q.V, 0)}㎥ · {쉼(q.L, 1)}m</text>}
            </g>
          )
        })}
        <text x={14} y={위 - 22} className="tj-ax">누가토량(㎥ · 다짐 기준)</text>
        <g transform={`translate(${W - 오 - 470 - (띠있음 ? 92 : 0) - (장있음 ? 112 : 0)}, 16)`} className="tj-lg">
          <line x1="0" x2="20" y1="0" y2="0" className="tj-curve" /><text x="25" y="4">유토곡선</text>
          <line x1="90" x2="110" y1="0" y2="0" className="tj-bal" /><text x="115" y="4">평형선</text>
          <rect x="170" y="-6" width="16" height="12" className="tj-hill" /><text x="190" y="4">→ 순방향</text>
          <rect x="255" y="-6" width="16" height="12" className="tj-valley" /><text x="275" y="4">← 역방향</text>
          <line x1="340" x2="360" y1="0" y2="0" className="tj-spoil" /><text x="364" y="4">사토</text>
          <line x1="400" x2="420" y1="0" y2="0" className="tj-borrow" /><text x="424" y="4">순성토</text>
          {띠있음 && <><line x1="472" x2="492" y1="0" y2="0" className="tj-dl" /><text x="496" y="4">띠 거리선</text></>}
          {장있음 && <><path d={`M ${476 + (띠있음 ? 92 : 0)} 5 l 6 -10 l 6 10 z`} className="tj-site-s" /><text x={496 + (띠있음 ? 92 : 0)} y="4">사토장 · 토취장</text></>}
        </g>
      </svg>
    </div>
  )
}
const 좋은간 = (v) => { if (!(v > 0)) return 1; const p = 10 ** Math.floor(Math.log10(v)); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p }

/* ── 📑 설계 양식 표 — lib/토적양식.js 격자를 그대로(칸 합침 · 머리 줄 th) · 제목 · 꼬리 줄은 표 밖 ─────────── */
function 양식표({ g, 끝 }) {
  const 제목들 = g.줄들.filter((z) => z.칸.length === 1 && (z.칸[0].k === '제목' || z.칸[0].k === '작은글'))
  const 몸 = g.줄들.filter((z) => !제목들.includes(z))
  const 자리 = 끝 < 0 ? 6 : 끝
  const 글 = (k) => (typeof k.v === 'number' ? (k.k === '일반수' ? k.v.toLocaleString('ko-KR', { maximumFractionDigits: 6 }) : 끝수(k.v, 자리).toLocaleString('ko-KR', { maximumFractionDigits: 자리 })) : k.v)
  const 꼬리 = 제목들.filter((z) => g.줄들.indexOf(z) > 2)
  return (
    <div className="tj-yang-box">
      {제목들.filter((z) => !꼬리.includes(z)).map((z, i) => (z.칸[0].k === '제목' ? <div key={i} className="tj-yang-ttl">{z.칸[0].v}</div> : <p key={i} className="tl-p muted gp-hint">{z.칸[0].v}</p>))}
      <div className="tj-wrap">
        <table className="tj-t tj-yang">
          <tbody>
            {몸.map((z, i) => (
              <tr key={i} className={z.칸.some((k) => k.k === '굵은수' || k.k === '굵은글') ? 'sum' : ''}>
                {z.칸.map((k) => (k.k === '머리'
                  ? <th key={k.c} colSpan={k.n} rowSpan={k.r}>{k.v}</th>
                  : <td key={k.c} colSpan={k.n} rowSpan={k.r} className={typeof k.v === 'number' ? (k.k.startsWith('굵은') ? 'b' : '') : 'l'}>{글(k)}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {꼬리.map((z, i) => <p key={'k' + i} className="tl-p muted gp-hint">{z.칸[0].v}</p>)}
    </div>
  )
}

/* ── 🔀 토공유동도 — 막대(측점 사이 m 당 남는 + · 모자라는 −) + 화살(깎는 곳 무게중심 → 쌓는 곳 무게중심) ─────────── */
function 유동도({ R }) {
  const 줄 = R.줄
  if (줄.length < 2) return null
  const xs = 줄[0].x, xe = 줄[줄.length - 1].x, 길 = Math.max(1e-9, xe - xs)
  const W = 1000, 왼 = 34, 오 = 34
  const X = (x) => 왼 + ((x - xs) / 길) * (W - 왼 - 오)
  /* 운반 몫(띠별 — 거리별로 나누면 장비마다) · 화살 높이는 길이에 비례(모두 같은 꼴 · 안쪽 짧은 운반 · 바깥 긴 운반) */
  const 활 = []
  for (const q of R.마디) if (q.V > 1e-9) for (const p of q.띠별 || []) if (Number.isFinite(p.절c) && Number.isFinite(p.성c) && p.V > 1e-9) 활.push({ q, p })
  const 최대V = Math.max(1e-9, ...활.map((a) => a.p.V))
  const 솟 = (a) => Math.min(150, Math.max(16, 0.35 * Math.abs(X(a.p.성c) - X(a.p.절c))))
  const 최대솟 = Math.max(36, ...활.map(솟))
  const 위 = 34, y0 = 위 + 최대솟 + 30, 막대 = 32
  /* 막대 — 측점 줄마다 차인(보정 절토 − 성토)을 그 줄이 맡은 길이로 나눔 */
  const 칸 = []
  for (let k = 0; k < 줄.length; k++) {
    const z = 줄[k]
    let a, b
    if (R.방법 === '평균단면') { if (k === 0) continue; a = 줄[k - 1].x; b = z.x }
    else { a = z.x - (z.d || 0) / 2; b = z.x + (k + 1 < 줄.length ? 줄[k + 1].d : 0) / 2 }
    if (!(b - a > 1e-9) || !z.차) continue
    칸.push({ a, b, v: z.차 / (b - a) })
  }
  const 최대v = Math.max(1e-9, ...칸.map((c) => Math.abs(c.v)))
  const 사들 = R.마디.flatMap((q) => (q.사묶음 || []).filter((m) => m.V > 1e-9).map((m) => ({ q, m, 꼴: '사' })))
  const 순들 = R.마디.flatMap((q) => (q.순묶음 || []).filter((m) => m.V > 1e-9).map((m) => ({ q, m, 꼴: '순' })))
  const 아래들 = [...사들, ...순들].sort((p, q) => p.m.c - q.m.c)
  const 측y = y0 + 막대 + 8, 글y = 측y + 62, H = 글y + (아래들.length ? 40 : 4)
  const 측라벨 = []
  let 앞 = -Infinity
  for (const z of 줄) { if (!z.측) continue; const px = X(z.x); if (px - 앞 >= 30) { 측라벨.push(z); 앞 = px } }
  const 끝맞춤 = (x) => (x > W - 150 ? 'end' : x < 150 ? 'start' : 'middle')
  return (
    <div className="tj-paper">
      <svg viewBox={`0 0 ${W} ${H}`} className="tj-svg" role="img" aria-label="토공유동도">
        <defs>
          <marker id="tj-mk" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="tj-mkh" /></marker>
          <marker id="tj-mks" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="tj-mks" /></marker>
          <marker id="tj-mkb" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="tj-mkb" /></marker>
        </defs>
        <text x={14} y={18} className="tj-ax">토공유동도 <tspan className="tj-fsub">{'횡방향 유용 ' + 쉼(R.합.횡, 0) + '㎥(같은 측점)' + (R.합.직접 > 0 ? ' · 바로 사토 ' + 쉼(R.합.직접, 0) + '㎥(자연)' : '')}</tspan></text>
        {칸.map((c, k) => {
          const h = (Math.abs(c.v) / 최대v) * 막대
          return <rect key={k} x={X(c.a)} width={Math.max(0.5, X(c.b) - X(c.a))} y={c.v > 0 ? y0 - h : y0} height={h} className={c.v > 0 ? 'tj-fbar-c' : 'tj-fbar-f'} />
        })}
        {R.구간.filter((g) => g.번 > 0).map((g) => <line key={'g' + g.번} x1={X(g.xs)} x2={X(g.xs)} y1={위} y2={y0 + 막대} className="tj-brk" />)}
        <line x1={X(xs)} x2={X(xe)} y1={y0} y2={y0} className="tj-z" />
        {줄.filter((z) => z.측).map((z, k) => <line key={'t' + k} x1={X(z.x)} x2={X(z.x)} y1={y0 + 막대 + 1} y2={y0 + 막대 + 5} className="tj-tk" />)}
        {측라벨.map((z, k) => <text key={'l' + k} x={X(z.x)} y={측y} className="tj-xl" transform={`rotate(-45 ${X(z.x)} ${측y})`}>{z.측}</text>)}
        {활.map(({ q, p }, k) => {
          const x1 = X(p.절c), x2 = X(p.성c), s = 솟({ p }), xm = (x1 + x2) / 2
          return (
            <g key={'a' + k}>
              <path d={`M ${x1.toFixed(1)} ${y0} Q ${xm.toFixed(1)} ${(y0 - 2 * s).toFixed(1)} ${x2.toFixed(1)} ${y0}`} className="tj-flow" style={{ strokeWidth: 1.4 + 3.2 * (p.V / 최대V) }} markerEnd="url(#tj-mk)" />
              <text x={xm} y={y0 - s - 5} className="tj-fl">{동그라미(q.번)} {쉼(p.V, 0)}㎥ · {쉼(p.L, 1)}m{p.이름 && (q.띠별 || []).length > 1 ? ' · ' + p.이름 : ''}</text>
            </g>
          )
        })}
        {아래들.map(({ m, 꼴 }, k) => {
          const x = X(m.c), y글 = 글y + (k % 2) * 17
          const 말 = 꼴 === '사' ? '사토 ' + 쉼(m.V, 0) + '㎥' + (m.장이름 ? ' → ' + m.장이름 + ' ' + 쉼(m.L, 0) + 'm' : '') : '순성토 ' + 쉼(m.V, 0) + '㎥' + (m.장이름 ? ' ← ' + m.장이름 + ' ' + 쉼(m.L, 0) + 'm' : '')
          return (
            <g key={'s' + k}>
              {꼴 === '사'
                ? <line x1={x} x2={x} y1={y0 + 2} y2={y글 - 13} className="tj-fs" markerEnd="url(#tj-mks)" />
                : <line x1={x} x2={x} y1={y글 - 13} y2={y0 + 2} className="tj-fb" markerEnd="url(#tj-mkb)" />}
              <text x={x} y={y글} className={꼴 === '사' ? 'tj-fst' : 'tj-fbt'} style={{ textAnchor: 끝맞춤(x) }}>{말}</text>
            </g>
          )
        })}
        <g transform={`translate(${W - 오 - 430}, 14)`} className="tj-lg">
          <path d="M0 4 Q 11 -8 22 4" className="tj-flow" style={{ strokeWidth: 2.4 }} /><text x="27" y="4">종방향 유용(굵기 = 토량)</text>
          <rect x="168" y="-6" width="14" height="10" className="tj-fbar-c" /><text x="186" y="4">남는 흙</text>
          <rect x="236" y="-6" width="14" height="10" className="tj-fbar-f" /><text x="254" y="4">모자라는 흙</text>
          <line x1="330" x2="330" y1="-7" y2="5" className="tj-fs" /><text x="336" y="4">사토</text>
          <line x1="372" x2="372" y1="-7" y2="5" className="tj-fb" /><text x="378" y="4">순성토</text>
        </g>
      </svg>
      <p className="tl-p muted gp-hint">화살 = 운반 몫마다 깎는 곳 흙 무게중심 → 쌓는 곳 흙 무게중심(화살 길이 = 평균운반거리) · 막대 = 측점 사이 1 m 당 남는(위) · 모자라는(아래) 흙(보정 절토 − 성토) · 사토 · 순성토는 나오는 · 들어가는 자리 무게중심.</p>
    </div>
  )
}

function 마디표({ R }) {
  const 씀칸 = R.칸.filter((c) => c.종 !== '성' && c.씀 !== false)
  if (!R.마디.length) return <p className="muted">운반 · 사토 · 순성토가 없습니다(절토와 성토가 측점마다 맞음).</p>
  return (
    <div className="tj-wrap">
      <table className="tj-t">
        <thead><tr><th>구간</th><th>방향</th><th>평형선과 만나는 곳</th><th>운반토량(㎥)</th>{씀칸.length > 1 && 씀칸.map((c) => <th key={c.id} className="s">{c.이름}</th>)}<th>평균운반거리(m)</th><th title="손으로 긋는 방식 — 마디 높이의 ½ 에서 그은 가로선 길이(참고)">참고 ½ 높이 폭</th><th>사토(㎥)</th><th>순성토(㎥)</th><th>장비(띠)</th></tr></thead>
        <tbody>
          {R.마디.map((q) => (
            <tr key={q.번}>
              <td className="c">{동그라미(q.번)}</td><td className="c">{q.방향}</td><td className="l">{R.자리(q.xa)} ~ {R.자리(q.xb)}</td>
              <td>{q.V > 1e-9 ? 쉼(q.V) : ''}</td>{씀칸.length > 1 && 씀칸.map((c) => <td key={c.id}>{q.토V[c.id] ? 쉼(q.토V[c.id]) : ''}</td>)}
              <td className="b">{q.V > 1e-9 ? 쉼(q.L) : ''}</td><td className="g">{q.반폭 ? 쉼(q.반폭) : ''}</td><td>{q.사 > 1e-9 ? 쉼(q.사) : ''}</td><td>{q.순 > 1e-9 ? 쉼(q.순) : ''}</td><td className="c">{q.띠 || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tl-p muted gp-hint">평균운반거리 = 유토곡선과 평형선 사이 넓이 ÷ 운반토량(측점 사이도 곧게 이어 정확히 셈). «½ 높이 폭» 은 손으로 그을 때 쓰는 어림 — 마디가 좌우로 기울면 실제와 다릅니다.</p>
    </div>
  )
}

function 유동표({ R }) {
  const 줄 = 유동줄(R)
  const 씀칸 = R.칸.filter((c) => c.종 !== '성' && c.씀 !== false)
  return (
    <div className="tj-wrap">
      <table className="tj-t">
        <thead><tr><th>번</th><th>구분</th><th>흙 나오는 곳</th><th>가는 곳</th><th>방향</th><th>토량(㎥)</th>{씀칸.length > 1 && 씀칸.map((c) => <th key={c.id} className="s">{c.이름}</th>)}<th>평균운반거리(m)</th><th>장비(띠)</th></tr></thead>
        <tbody>
          {줄.map((u, k) => (
            <tr key={k} className={/사토/.test(u.구분) ? 'tj-sp' : /순성토/.test(u.구분) ? 'tj-bo' : ''}>
              <td className="c">{u.번}</td><td className="l">{u.구분}</td><td className="l">{u.나옴}</td><td className="l">{u.감}</td><td className="c">{u.방향}</td>
              <td className="b">{쉼(u.V)}{u.자연 ? ' (자연)' : ''}</td>{씀칸.length > 1 && 씀칸.map((c, i) => <td key={c.id}>{u.토 && u.토[i] ? 쉼(u.토[i]) : ''}</td>)}
              <td>{u.L !== null && u.L !== undefined ? 쉼(u.L) : ''}</td><td className="c">{u.띠 || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={'tj-chk' + (R.검산.맞음 ? '' : ' bad')}>
        <b>{R.검산.맞음 ? '✓ 검산 맞음' : '⛔ 검산 안 맞음'}</b>
        <span>보정 절토(유용) {쉼(R.합.유용)} = 횡방향 {쉼(R.합.횡)} + 종방향 {쉼(R.합.종)} + 사토 {쉼(R.합.사토 + 0)}</span>
        <span>성토 {쉼(R.합.성)} = 횡방향 {쉼(R.합.횡)} + 종방향 {쉼(R.합.종)} + 순성토 {쉼(R.합.순성토)}</span>
      </div>
      <p className="tl-p muted gp-hint">단위: 다짐 기준 ㎥(절토 × C) · «바로 사토» 는 자연 상태 · 흙 나오는 곳 · 가는 곳은 평형선 높이 띠마다 실제로 짝지은 자리의 처음 ~ 끝.</p>
    </div>
  )
}

function 운반표({ R }) {
  const 씀칸 = R.칸.filter((c) => c.종 !== '성' && c.씀 !== false)
  const 운 = R.마디.filter((q) => q.V > 1e-9)
  if (!운.length) return <p className="muted">종방향 운반이 없습니다.</p>
  const 셋 = (v, vl) => [v > 0 ? 쉼(vl / v) : '', v > 0 ? 쉼(v) : '', v > 0 ? 쉼(vl) : '']
  /* 거리별로 나눈 구간은 띠 몫마다 한 줄(① 불도저 · ① 덤프트럭) */
  const 줄들 = 운.flatMap((q) => ((q.띠별 || []).length > 1 ? q.띠별.map((p) => ({ q, p, 키: q.번 + '-' + p.t })) : [{ q, p: null, 키: String(q.번) }]))
  return (
    <div className="tj-wrap">
      <table className="tj-t">
        <thead>
          <tr><th rowSpan={2}>구간</th><th rowSpan={2}>방향</th>{씀칸.map((c) => <th key={c.id} colSpan={3}>{c.이름}</th>)}<th colSpan={3}>계</th><th rowSpan={2}>장비(띠)</th></tr>
          <tr>{[...씀칸, { id: '계' }].flatMap((c) => [<th key={c.id + 'L'} className="s">L(m)</th>, <th key={c.id + 'V'} className="s">V(㎥)</th>, <th key={c.id + 'X'} className="s">V×L</th>])}</tr>
        </thead>
        <tbody>
          {줄들.map(({ q, p, 키 }) => {
            const o = p || q
            return (
              <tr key={키}>
                <td className="c">{동그라미(q.번)}</td><td className="c">{q.방향}</td>
                {씀칸.flatMap((c) => 셋(o.토V[c.id] || 0, o.토VL[c.id] || 0).map((t, i) => <td key={c.id + i}>{t}</td>))}
                {셋(o.V, o.VL).map((t, i) => <td key={'s' + i} className={i === 0 ? 'b' : ''}>{t}</td>)}
                <td className="c">{p ? 띠글(p) : q.띠 || ''}</td>
              </tr>
            )
          })}
          <tr className="sum">
            <td className="l" colSpan={2}>계</td>
            {씀칸.flatMap((c) => 셋(R.합.토V[c.id] || 0, R.합.토VL[c.id] || 0).map((t, i) => <td key={c.id + i}>{t}</td>))}
            {셋(R.합.종, R.합.종VL).map((t, i) => <td key={'s' + i}>{t}</td>)}<td />
          </tr>
          {R.띠.filter((t) => t.V > 0).map((t, k) => (
            <tr key={'t' + k} className="sub">
              <td className="l" colSpan={2}>{t.이름 || '운반'}{Number.isFinite(t.까지) ? ' ≤ ' + t.까지 + ' m' : ''}</td>
              {씀칸.flatMap((c) => ['', '', ''].map((x, i) => <td key={c.id + i} />))}
              {셋(t.V, t.VL).map((x, i) => <td key={'s' + i}>{x}</td>)}<td className="c">{t.마디.map(동그라미).join(' ')}</td>
            </tr>
          ))}
          {장줄들(R).map((u, k) => (
            <tr key={'j' + k} className="sub tj-jang">
              <td className="l" colSpan={2}>{u.글}</td>
              {씀칸.flatMap((c) => (u.토V ? 셋(u.토V[c.id] || 0, u.토VL[c.id] || 0) : ['', '', '']).map((x, i) => <td key={c.id + i}>{x}</td>))}
              {셋(u.V, u.VL).map((x, i) => <td key={'s' + i} className={i === 0 ? 'b' : ''}>{x}</td>)}<td className="c">{u.띠}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tl-p muted gp-hint">다짐 기준 · L = V×L ÷ V · 토질별로 나눈 것은 그 측점 보정 절토 비례(운반 흙은 늘 절토가 남는 구간에서 나옴) · 장비 띠 · 🚛 사토장 · 토취장은 아래 ⑤ 에서 정함(🚛 줄 = 길 따라 진출입 측점까지 평균 + 밖 거리 · 바로 사토는 자연 상태){R.띠나눔 === '거리' ? ' — 지금은 «한 운반 구간도 거리별로 나눔»(높이 띠마다 실제 운반거리로 나눠 셈 · 유토곡선의 주황 점선 위는 짧은 장비)' : ''}.</p>
    </div>
  )
}

function 집계표({ R }) {
  const 칸 = R.칸
  const 사자연 = Object.values(R.합.사토자연).reduce((a, v) => a + v, 0)
  return (
    <div className="tj-wrap">
      <table className="tj-t">
        <thead><tr><th>구분</th><th>항목</th><th>토량(㎥)</th><th>상태</th><th>비고</th></tr></thead>
        <tbody>
          {칸.map((c, j) => (
            <tr key={c.id}><td className="c">{c.종 === '성' ? '성토' : '절토'}</td><td className="l">{c.이름}</td><td className="b">{쉼(R.합.칸[j])}</td><td className="c">{c.종 === '성' ? '다짐' : '자연'}</td>
              <td className="l">{c.종 === '성' ? '' : c.씀 === false ? '유용 안 함 → 바로 사토' : 'C ' + (숫(c.C) > 0 ? c.C : '1(비어 있음)') + ' → 보정 ' + 쉼(R.합.보정[j])}</td></tr>
          ))}
          <tr className="sub"><td className="c">유용</td><td className="l">보정 절토(성토에 씀)</td><td className="b">{쉼(R.합.유용)}</td><td className="c">다짐</td><td /></tr>
          <tr><td className="c">유용</td><td className="l">횡방향 유용</td><td className="b">{쉼(R.합.횡)}</td><td className="c">다짐</td><td className="l">같은 측점 안에서 깎아 쌓음</td></tr>
          <tr><td className="c">유용</td><td className="l">종방향 유용(운반토량)</td><td className="b">{쉼(R.합.종)}</td><td className="c">다짐</td><td className="l">평균운반거리 {쉼(R.합.L)} m</td></tr>
          <tr><td className="c">사토</td><td className="l">남는 흙(유토곡선)</td><td className="b">{쉼(R.합.사토 + 0)}</td><td className="c">다짐</td><td className="l">{[사자연 > 0 ? '자연 상태로 ' + 쉼(사자연) + ' ㎥(÷ 토질별 C)' : '', R.합.사토L !== null ? '사토장까지 평균 ' + 쉼(R.합.사토L) + ' m' : ''].filter(Boolean).join(' · ')}</td></tr>
          {R.합.직접 > 0 && <tr><td className="c">사토</td><td className="l">바로 사토(유용 안 함)</td><td className="b">{쉼(R.합.직접)}</td><td className="c">자연</td><td className="l">{R.합.직접칸.filter((k) => k.V > 0).map((k) => k.이름).join(' · ')}{R.합.직접L !== null ? ' · 사토장까지 평균 ' + 쉼(R.합.직접L) + ' m' : ''}</td></tr>}
          <tr><td className="c">순성토</td><td className="l">모자라는 흙(토취)</td><td className="b">{쉼(R.합.순성토)}</td><td className="c">다짐</td><td className="l">{[R.합.순성토자연 !== null ? '토취 흙 C 로 자연 ' + 쉼(R.합.순성토자연) + ' ㎥' : '토취 흙 C 를 넣으면 자연 상태로도', R.합.순성토L !== null ? '토취장에서 평균 ' + 쉼(R.합.순성토L) + ' m' : ''].filter(Boolean).join(' · ')}</td></tr>
        </tbody>
      </table>
      <div className={'tj-chk' + (R.검산.맞음 ? '' : ' bad')}><b>{R.검산.맞음 ? '✓ 검산 맞음' : '⛔ 검산 안 맞음'}</b><span>절토 차 {끝수(R.검산.절, 4)} · 성토 차 {끝수(R.검산.성, 4)}</span></div>
    </div>
  )
}

function 차수표({ a, b, T }) {
  return (
    <div className="tj-wrap">
      <table className="tj-t">
        <thead><tr><th>항목</th><th>{a}</th><th>{b}</th><th>증감</th></tr></thead>
        <tbody>
          {T.줄.map((z, k) => <tr key={k}><td className="l">{z.항목}</td><td>{쉼(z.a)}</td><td>{쉼(z.b)}</td><td className={'b' + (z.증 < -1e-9 ? ' neg' : '')}>{Math.abs(z.증) < 0.005 ? '—' : (z.증 > 0 ? '+' : '') + 쉼(z.증)}</td></tr>)}
        </tbody>
      </table>
      {T.단면.length > 0 && (
        <>
          <div className="tl-sub">단면이 바뀐 측점 <i>{T.단면.length}곳</i></div>
          <table className="tj-t">
            <thead><tr><th>측점</th><th>절토 단면(㎡)</th><th>성토 단면(㎡)</th></tr></thead>
            <tbody>{T.단면.map((s, k) => <tr key={k}><td className="l">{s.측}</td><td>{쉼(s.절a, 3)} → <b>{쉼(s.절b, 3)}</b></td><td>{쉼(s.성a, 3)} → <b>{쉼(s.성b, 3)}</b></td></tr>)}</tbody>
          </table>
        </>
      )}
      {(T.새.length > 0 || T.뺌.length > 0) && <p className="tl-p">{T.새.length > 0 && <>새 측점: <b>{T.새.join(' · ')}</b> </>}{T.뺌.length > 0 && <>없어진 측점: <b>{T.뺌.join(' · ')}</b></>}</p>}
    </div>
  )
}

/* ── 🖨 인쇄 — A4 가로(유토곡선 · 집계 · 유동 · 운반 · 토적표) ───────────────── */
function 인쇄판({ R, 판 }) {
  const 제목 = (판.설정 && 판.설정.공사명) || ''
  const 머리 = (t) => <div className="tj-ph"><b>{t}</b><span>{제목}{판.이름 ? ' · ' + 판.이름 : ''}</span></div>
  return (
    <>
      <div className="gp-쪽 tj-쪽">{머리('유토곡선')}<유토그림 R={R} /><마디표 R={R} /></div>
      <div className="gp-쪽 tj-쪽">{머리('토공유동도')}<유동도 R={R} /></div>
      <div className="gp-쪽 tj-쪽">{머리('집계표 · 토공유동표')}<집계표 R={R} /><유동표 R={R} /></div>
      <div className="gp-쪽 tj-쪽">{머리('운반집계')}<운반표 R={R} /></div>
      <div className="gp-쪽 tj-쪽">{머리('토적표')}<토적표 R={R} /></div>
      <div className="gp-쪽 tj-쪽">{머리('토공집계표(설계 양식)')}<양식표 g={토공양식(R, 판)} 끝={R.끝} /></div>
      <div className="gp-쪽 tj-쪽">{머리('토량운반계산서(설계 양식)')}<양식표 g={운반양식(R, 판)} 끝={2} /></div>
    </>
  )
}

/* 🧪 예시 — 가상 도로(당초 · 1회 변경) */
export const 토적CALCS = { tojeok: Tojeok }
export const 토적EXAMPLES = { tojeok: { ex: { 차수: [{ 이름: '당초', ...예시토적() }, { 이름: '1회 변경', ...예시변경토적() }], 지금: 0 }, 글: '가상 ○○ 도로 440 m(토사 · 리핑암 · 성토 · NO.12 교량에서 운반 끊음 · 당초와 1회 변경) — 실제 공사 아님' } }
