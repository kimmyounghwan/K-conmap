import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  읽기, 쓰기, 빈견적, 새번호, 셈, 산안표, 법정, 기본요율, 켜기본, 원, 한글금액, 날더하기, 예시, 예시나, 오늘,
} from '../lib/gyeonjeok.js'

/**
 * 🧾 /tools/gyeonjeok — 공사 견적서 · 원가계산서 만들기 (G105 · 2026-10-01)
 *
 * 소장님: 「인터넷 싹 다 뒤져서. 관련 기관 다 보고, 서식 검색량이 많은 것 사이트에 올리자. 프로그램화 해서」
 *   → 수요 1등 «공사견적서»(예스폼 누적 조회 177만) + «원가계산서»(49만) → 고르심 «공사견적서+원가계산서»
 *
 * ■ 내역(공종 · 품명 · 규격 · 단위 · 수량 · 재료비/노무비/경비 단가) → 셈 두 가지
 *   · 간단 견적(민간 · 하도급): 직접공사비 + 덧붙일 항목 + 일반관리비 + 이윤 + 부가세
 *   · 공공식 원가계산(조달청 비목): 간접노무비 · 법정 보험료 · 산안비 · 환경 · 기타경비 · 일반관리비 · 이윤 · 부가세
 *   → 견적서(A4 세로: 견적서 + 집계/원가계산서 · 다음 쪽 내역서) 인쇄. 요율 근거는 lib/gyeonjeok.js 머리말.
 * ■ 저장: 이 브라우저(localStorage)만 · 견적 여러 벌 저장 · 공급자(내 회사)는 다음 견적에도 그대로.
 * ■ 엑셀 받기 없음 · 인쇄만 — 소장님(2026-09-26) «프로그램은 프린트만». 엑셀로 쓰실 분은 서식 «공사원가계산서» · «공사 산출내역서».
 * ■ 화면에 «창»(alert · confirm · prompt)을 띄우지 않습니다 — 지우기는 한 번 더 누르는 방식.
 */

const 단위들 = ['1', '10', '100', '1000', '10000']
const 공공칸 = [
  ['간노', '간접노무비', '직접노무비 × 율'], ['산재', '산재보험료', '노무비 × 율'], ['고용', '고용보험료', '노무비 × 율'],
  ['건강', '국민건강보험료', '직접노무비 × 율'], ['연금', '국민연금보험료', '직접노무비 × 율'], ['요양', '노인장기요양보험료', '건강보험료 × 율'],
  ['퇴직', '퇴직공제부금', '직접노무비 × 율 (대상 공사)'], ['환경', '환경보전비', '(재료비 + 직접노무비 + 기계경비) × 율'],
  ['기타', '기타경비', '(재료비 + 노무비) × 율'], ['일관', '일반관리비', '순공사원가 × 율 (공공은 8% 이하)'],
  ['이윤', '이윤', '(노무비 + 경비 + 일반관리비) × 율 (공공은 15% 이하)'], ['부가', '부가가치세', '총원가 × 율'],
]
const 법정칸 = new Set(Object.keys(법정))
const 끌칸 = new Set(['간노', '산재', '고용', '건강', '연금', '요양', '퇴직', '환경', '기타'])
const 태그 = (k) => (법정칸.has(k) ? <span className="gj-tag law">2026 법정</span> : k === '부가' ? <span className="gj-tag law">법정 10%</span> : <span className="gj-tag ex">예시값 — 고쳐 씀</span>)
const 날글 = (s) => { const [y, m, d] = String(s || '').split('-'); return y ? `${y}년 ${Number(m)}월 ${Number(d)}일` : '' }

/** 엑셀에서 복사한 표 → 내역 줄 (탭으로 나뉜 칸: 공종 · 품명 · 규격 · 단위 · 수량 · 재료비 · 노무비 · 경비 · 비고) */
function 붙여읽기(text) {
  const 줄 = []
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim()) continue
    const c = line.split('\t').map((x) => x.trim())
    if (c.length < 2) continue
    const 숫자 = (x) => String(x || '').replace(/[^\d.-]/g, '')
    if (!/\d/.test(c[4] || '') && /수량|단위|품명/.test(line)) continue      // 머리 줄
    줄.push({ id: 새번호(), g: c[0] || '', n: c[1] || '', s: c[2] || '', u: c[3] || '', q: 숫자(c[4]), m: 숫자(c[5]), l: 숫자(c[6]), e: 숫자(c[7]), note: c[8] || '' })
  }
  return 줄
}

export default function Gyeonjeok() {
  const [st, setSt] = useState(() => 읽기())
  const [저장됨, set저장됨] = useState(true)
  const [묻기, set묻기] = useState('')          // 지우기 한 번 더 누르기
  const [붙임, set붙임] = useState('')
  const [알림, set알림] = useState('')
  useEffect(() => { set저장됨(쓰기(st)) }, [st])
  useEffect(() => {
    const 끝 = () => document.body.classList.remove('gj-print')
    window.addEventListener('afterprint', 끝)
    return () => { window.removeEventListener('afterprint', 끝); 끝() }
  }, [])
  const 견 = st.cur
  const 나 = st.나
  const S = useMemo(() => 셈(견), [견])
  const 산안근 = S.산안 ? `(재료비 + 직접노무비) × ${S.산안.율}%${S.산안.기초 ? ` + 기초액 ${원(S.산안.기초)}원` : ''} — ${S.산안.구간}` : ''
  const 바꿈 = (f) => setSt((s) => ({ ...s, cur: f(s.cur) }))
  const 칸 = (k, v) => 바꿈((c) => ({ ...c, [k]: v }))
  const 나칸 = (k, v) => setSt((s) => ({ ...s, 나: { ...s.나, [k]: v } }))
  const 줄칸 = (id, k, v) => 바꿈((c) => ({ ...c, 줄: c.줄.map((r) => (r.id === id ? { ...r, [k]: v } : r)) }))
  const 줄더함 = (뒤에) => 바꿈((c) => {
    const 새 = { id: 새번호(), g: 뒤에 ? 뒤에.g : '', n: '', s: '', u: '', q: '', m: '', l: '', e: '', note: '' }
    if (!뒤에) return { ...c, 줄: [...c.줄, 새] }
    const i = c.줄.findIndex((r) => r.id === 뒤에.id)
    return { ...c, 줄: [...c.줄.slice(0, i + 1), 새, ...c.줄.slice(i + 1)] }
  })
  const 줄뺌 = (id) => 바꿈((c) => ({ ...c, 줄: c.줄.length > 1 ? c.줄.filter((r) => r.id !== id) : [{ ...c.줄[0], g: '', n: '', s: '', u: '', q: '', m: '', l: '', e: '', note: '' }] }))
  const 간단칸 = (k, v) => 바꿈((c) => ({ ...c, 간단: { ...c.간단, [k]: v } }))
  const 공공칸바꿈 = (k, v) => 바꿈((c) => ({ ...c, 공공: { ...c.공공, [k]: v } }))
  const 요율칸 = (k, v) => 바꿈((c) => ({ ...c, 공공: { ...c.공공, 요율: { ...c.공공.요율, [k]: v } } }))
  const 켜칸 = (k, v) => 바꿈((c) => ({ ...c, 공공: { ...c.공공, 켜: { ...c.공공.켜, [k]: v } } }))
  const 저장 = () => {
    const 이름 = (견.공사명 || '이름 없는 견적').slice(0, 40)
    setSt((s) => {
      const 모음 = [{ id: 견.id, 이름, at: Date.now(), data: 견 }, ...s.모음.filter((x) => x.id !== 견.id)].slice(0, 20)
      return { ...s, 모음 }
    })
    set알림(`«${이름}» 을(를) 이 브라우저에 저장했습니다.`)
  }
  const 불러옴 = (x) => { setSt((s) => ({ ...s, cur: { ...빈견적(), ...x.data } })); set알림(`«${x.이름}» 을(를) 불러왔습니다.`) }
  const 지움 = (x) => { setSt((s) => ({ ...s, 모음: s.모음.filter((y) => y.id !== x.id) })); set묻기('') }
  const 붙여넣기 = () => {
    const 줄 = 붙여읽기(붙임)
    if (!줄.length) { set알림('붙여 넣은 글에서 줄을 찾지 못했습니다 — 엑셀에서 칸째로 복사해 주십시오(공종 · 품명 · 규격 · 단위 · 수량 · 재료비 · 노무비 · 경비).'); return }
    바꿈((c) => ({ ...c, 줄: [...c.줄.filter((r) => String(r.n || '').trim() || String(r.q || '').trim()), ...줄] }))
    set붙임(''); set알림(`${줄.length}줄을 내역에 붙였습니다.`)
  }
  const 인쇄 = () => { document.body.classList.add('gj-print'); setTimeout(() => window.print(), 80) }
  const 유효날 = 날더하기(견.견적일, 견.유효)
  const 내역 = S.L

  return (
    <div className="wrap gj">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🧾 공사 견적서 · 원가계산서 만들기</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          내역(품명 · 규격 · 수량 · 재료비/노무비/경비 단가)을 적으면 <b>직접공사비 → 일반관리비 · 이윤 → 부가세 → 견적금액(한글)</b>이 저절로 나옵니다.
          민간 · 하도급은 <b>간단 견적</b>, 관급 설계처럼 산재 · 고용 · 4대보험 · 산안비까지 넣으려면 <b>공공식 원가계산</b>을 고르십시오.
          견적서를 <b>A4로 인쇄</b>합니다.
        </p>
        <div className="nm-badges">
          <span>회원가입 없음 · 무료</span>
          <span>💾 이 브라우저에만 저장 {저장됨 ? '' : <b className="nm-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
          <span>📋 엑셀 표를 복사해 붙여 넣을 수 있습니다</span>
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={저장}>💾 이 견적 저장</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setSt((s) => ({ ...s, cur: 빈견적() })); set알림('새 견적을 시작했습니다. 공급자(내 회사) 칸은 그대로 둡니다.') }}>＋ 새 견적</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setSt((s) => ({ ...s, cur: 예시('simple'), 나: s.나.상호 ? s.나 : 예시나() })); set알림('예시(간단 견적)를 채웠습니다 — 지어낸 공사 · 회사입니다.') }}>예시 — 간단 견적</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setSt((s) => ({ ...s, cur: 예시('public'), 나: s.나.상호 ? s.나 : 예시나() })); set알림('예시(공공식 원가계산)를 채웠습니다 — 지어낸 공사 · 회사입니다.') }}>예시 — 공공식 원가계산</button>
        </div>
        {알림 && <div className="note sm" role="status" style={{ marginTop: 8 }}>{알림}</div>}
        {st.모음.length > 0 && (
          <div className="gj-saved">
            <div className="fm-ctl-k" style={{ marginBottom: 4 }}>저장한 견적 {st.모음.length}</div>
            {st.모음.map((x) => (
              <div className="gj-saved-r" key={x.id}>
                <button type="button" className="tp-x" onClick={() => 불러옴(x)}>{x.이름}</button>
                <span className="muted">{new Date(x.at).toLocaleDateString('ko-KR')}</span>
                {묻기 === x.id
                  ? <><button type="button" className="tp-x nm-warn" onClick={() => 지움(x)}>정말 지우기</button><button type="button" className="tp-x" onClick={() => set묻기('')}>그대로</button></>
                  : <button type="button" className="tp-x" onClick={() => set묻기(x.id)}>지우기</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>📋 견적 정보</div>
        <div className="gj-form">
          <label>수신 (받는 분)<input className="inp" value={견.수신} maxLength={60} onChange={(e) => 칸('수신', e.target.value)} placeholder="예: ○○상가 관리단" /></label>
          <label>공사명<input className="inp" value={견.공사명} maxLength={80} onChange={(e) => 칸('공사명', e.target.value)} placeholder="예: ○○상가 화장실 개보수 공사" /></label>
          <label>공사 장소<input className="inp" value={견.장소} maxLength={80} onChange={(e) => 칸('장소', e.target.value)} /></label>
          <label>공사 기간<input className="inp" value={견.기간} maxLength={60} onChange={(e) => 칸('기간', e.target.value)} placeholder="예: 착공일부터 25일" /></label>
          <label>견적일<input className="inp" type="date" value={견.견적일} onChange={(e) => 칸('견적일', e.target.value || 오늘())} /></label>
          <label>유효 기간 (일)<input className="inp" inputMode="numeric" value={견.유효} onChange={(e) => 칸('유효', Number(String(e.target.value).replace(/[^\d]/g, '')) || 0)} /></label>
          <label>결제 조건<input className="inp" value={견.결제} maxLength={80} onChange={(e) => 칸('결제', e.target.value)} placeholder="예: 착공 30% · 준공 70%" /></label>
          <label>비고<input className="inp" value={견.비고} maxLength={120} onChange={(e) => 칸('비고', e.target.value)} placeholder="예: 설비 · 전기 제외" /></label>
        </div>
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>🏢 공급자 (내 회사) <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 다음 견적에도 그대로 남습니다</span></div>
        <div className="gj-form">
          <label>상호<input className="inp" value={나.상호} maxLength={40} onChange={(e) => 나칸('상호', e.target.value)} /></label>
          <label>대표자<input className="inp" value={나.대표} maxLength={20} onChange={(e) => 나칸('대표', e.target.value)} /></label>
          <label>사업자등록번호<input className="inp" value={나.사업자} maxLength={20} onChange={(e) => 나칸('사업자', e.target.value)} /></label>
          <label>전화<input className="inp" value={나.전화} maxLength={30} onChange={(e) => 나칸('전화', e.target.value)} /></label>
          <label className="gj-wide">주소<input className="inp" value={나.주소} maxLength={100} onChange={(e) => 나칸('주소', e.target.value)} /></label>
          <label>담당<input className="inp" value={나.담당} maxLength={30} onChange={(e) => 나칸('담당', e.target.value)} /></label>
        </div>
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>🧱 내역 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 단가는 재료비 · 노무비 · 경비로 나눠 적습니다 (한 칸만 적어도 됩니다)</span></div>
        <div className="tp-scroll">
          <table className="tbl gj-rows">
            <thead>
              <tr><th>No</th><th>공종</th><th>품명</th><th>규격</th><th>단위</th><th>수량</th><th>재료비 단가</th><th>노무비 단가</th><th>경비 단가</th><th>금액</th><th>비고</th><th /></tr>
            </thead>
            <tbody>
              {내역.줄들.map((r, i) => (
                <tr key={r.id}>
                  <td className="r">{i + 1}</td>
                  <td><input className="inp gj-in" value={r.g} maxLength={20} onChange={(e) => 줄칸(r.id, 'g', e.target.value)} aria-label={`${i + 1}번 공종`} /></td>
                  <td><input className="inp gj-in gj-w" value={r.n} maxLength={60} onChange={(e) => 줄칸(r.id, 'n', e.target.value)} aria-label={`${i + 1}번 품명`} /></td>
                  <td><input className="inp gj-in" value={r.s} maxLength={40} onChange={(e) => 줄칸(r.id, 's', e.target.value)} aria-label={`${i + 1}번 규격`} /></td>
                  <td><input className="inp gj-in gj-u" value={r.u} maxLength={8} onChange={(e) => 줄칸(r.id, 'u', e.target.value)} aria-label={`${i + 1}번 단위`} /></td>
                  {['q', 'm', 'l', 'e'].map((k) => (
                    <td key={k}><input className="inp gj-in gj-num" inputMode="decimal" value={r[k]} onChange={(e) => 줄칸(r.id, k, e.target.value.replace(/[^\d.]/g, ''))}
                      aria-label={`${i + 1}번 ${{ q: '수량', m: '재료비 단가', l: '노무비 단가', e: '경비 단가' }[k]}`} /></td>
                  ))}
                  <td className="r nw"><b>{r.합금 ? 원(r.합금) : ''}</b></td>
                  <td><input className="inp gj-in" value={r.note} maxLength={40} onChange={(e) => 줄칸(r.id, 'note', e.target.value)} aria-label={`${i + 1}번 비고`} /></td>
                  <td className="nw"><button type="button" className="tp-x" onClick={() => 줄더함(r)} aria-label={`${i + 1}번 아래에 줄 더하기`}>＋</button><button type="button" className="tp-x" onClick={() => 줄뺌(r.id)} aria-label={`${i + 1}번 줄 지우기`}>✕</button></td>
                </tr>
              ))}
              <tr className="sum"><td /><td colSpan={4}>합계</td><td /><td className="r">{원(내역.재)}</td><td className="r">{원(내역.노)}</td><td className="r">{원(내역.경)}</td><td className="r"><b>{원(내역.직접)}</b></td><td colSpan={2} /></tr>
            </tbody>
          </table>
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄더함(null)}>＋ 줄 더하기</button>
        </div>
        <details className="gj-paste">
          <summary>📋 엑셀 표 붙여 넣기</summary>
          <div className="note sm" style={{ margin: '6px 0' }}>엑셀에서 <b>공종 · 품명 · 규격 · 단위 · 수량 · 재료비 · 노무비 · 경비 · 비고</b> 차례의 칸을 골라 복사(Ctrl+C)한 뒤 아래 칸에 붙여 넣고 «내역에 붙이기» 를 누르십시오. 지금 내역 뒤에 이어 붙습니다.</div>
          <textarea className="inp" rows={4} value={붙임} onChange={(e) => set붙임(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} placeholder="여기에 붙여 넣기" />
          <button type="button" className="btn sm" style={{ width: 'auto', marginTop: 6 }} onClick={붙여넣기} disabled={!붙임.trim()}>내역에 붙이기</button>
        </details>
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>🧮 셈 방식</div>
        <div className="fm-ctl-row" role="group" aria-label="셈 방식" style={{ marginTop: 8 }}>
          <button type="button" className={'fm-chip' + (견.방식 !== 'public' ? ' on' : '')} aria-pressed={견.방식 !== 'public'} onClick={() => 칸('방식', 'simple')}>간단 견적 (민간 · 하도급)</button>
          <button type="button" className={'fm-chip' + (견.방식 === 'public' ? ' on' : '')} aria-pressed={견.방식 === 'public'} onClick={() => 칸('방식', 'public')}>공공식 원가계산 (조달청 비목)</button>
        </div>
        {견.방식 !== 'public' ? (
          <div className="gj-rates">
            <label>일반관리비 (%)<input className="inp gj-num" inputMode="decimal" value={견.간단.일관} onChange={(e) => 간단칸('일관', e.target.value.replace(/[^\d.]/g, ''))} /></label>
            <label>이윤 (%)<input className="inp gj-num" inputMode="decimal" value={견.간단.이윤} onChange={(e) => 간단칸('이윤', e.target.value.replace(/[^\d.]/g, ''))} /></label>
            <label>끝전 버림<select className="inp" value={String(견.간단.절사)} onChange={(e) => 간단칸('절사', Number(e.target.value))}>{단위들.map((u) => <option key={u} value={u}>{u === '1' ? '안 버림' : `${Number(u).toLocaleString()}원 아래`}</option>)}</select></label>
            <label className="gj-check"><input type="checkbox" checked={!!견.간단.부가} onChange={(e) => 간단칸('부가', e.target.checked)} /> 부가가치세 10% 더하기</label>
            <div className="gj-add">
              <div className="fm-ctl-k">덧붙일 항목 <span className="muted" style={{ fontWeight: 400 }}>(운반비 · 폐기물 · 현장경비 · 안전관리비 같은 것)</span></div>
              {(견.간단.덧 || []).map((d, i) => (
                <div className="gj-add-r" key={i}>
                  <input className="inp" value={d.n} maxLength={30} placeholder="항목 이름" onChange={(e) => 간단칸('덧', 견.간단.덧.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)))} aria-label={`덧붙일 항목 ${i + 1} 이름`} />
                  <input className="inp gj-num" inputMode="decimal" value={d.v} placeholder={d.pct ? '%' : '원'} onChange={(e) => 간단칸('덧', 견.간단.덧.map((x, j) => (j === i ? { ...x, v: e.target.value.replace(/[^\d.]/g, '') } : x)))} aria-label={`덧붙일 항목 ${i + 1} 값`} />
                  <button type="button" className={'fm-chip' + (d.pct ? ' on' : '')} onClick={() => 간단칸('덧', 견.간단.덧.map((x, j) => (j === i ? { ...x, pct: !x.pct } : x)))}>{d.pct ? '직접공사비의 %' : '정액(원)'}</button>
                  <button type="button" className="tp-x" onClick={() => 간단칸('덧', 견.간단.덧.filter((_, j) => j !== i))}>지우기</button>
                </div>
              ))}
              <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 4 }} onClick={() => 간단칸('덧', [...(견.간단.덧 || []), { n: '', v: '', pct: false }])}>＋ 항목 더하기</button>
            </div>
          </div>
        ) : (
          <div className="gj-rates">
            <label>산업안전보건관리비 — 공사 종류<select className="inp" value={견.공공.산안종류} onChange={(e) => 공공칸바꿈('산안종류', e.target.value)}>{산안표.map((t) => <option key={t.k} value={t.k}>{t.이름}</option>)}</select></label>
            <label>끝전 버림<select className="inp" value={String(견.공공.절사)} onChange={(e) => 공공칸바꿈('절사', Number(e.target.value))}>{단위들.map((u) => <option key={u} value={u}>{u === '1' ? '안 버림' : `${Number(u).toLocaleString()}원 아래`}</option>)}</select></label>
            <div className="tp-scroll gj-wide">
              <table className="tbl gj-rt">
                <thead><tr><th>넣기</th><th>비목</th><th>요율 (%)</th><th className="gj-d">산출</th><th className="gj-d">구분</th></tr></thead>
                <tbody>
                  {공공칸.map(([k, 이름, 근]) => (
                    <tr key={k}>
                      <td className="c">{끌칸.has(k) ? <input type="checkbox" checked={견.공공.켜[k] !== false} onChange={(e) => 켜칸(k, e.target.checked)} aria-label={`${이름} 넣기`} /> : '—'}</td>
                      <td className="gj-name"><span className="nw">{이름}</span><div className="gj-m gj-small">{근} {태그(k)}</div></td>
                      <td><input className="inp gj-in gj-num" inputMode="decimal" value={견.공공.요율[k] ?? ''} onChange={(e) => 요율칸(k, e.target.value.replace(/[^\d.]/g, ''))} aria-label={`${이름} 요율`} /></td>
                      <td className="gj-small gj-d">{근}</td>
                      <td className="nw gj-d">{태그(k)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="c"><input type="checkbox" checked={견.공공.켜.산안 !== false} onChange={(e) => 켜칸('산안', e.target.checked)} aria-label="산업안전보건관리비 넣기" /></td>
                    <td className="gj-name"><span className="nw">산업안전보건관리비</span><div className="gj-m gj-small">{산안근} <span className="gj-tag law">고시 별표 1</span></div></td>
                    <td className="nw r">{S.산안 ? `${S.산안.율}%` : ''}</td>
                    <td className="gj-small gj-d">{산안근}</td>
                    <td className="nw gj-d"><span className="gj-tag law">고시 별표 1</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((c) => ({ ...c, 공공: { ...c.공공, 요율: { ...기본요율 }, 켜: { ...켜기본 } } }))}>요율을 처음 값으로</button>
            {S.경고 && S.경고.length > 0 && <div className="note sm nm-warn gj-wide" role="status">{S.경고.join(' ')}</div>}
            <div className="note sm gj-wide">
              <b>2026 법정</b> — 산재 3.56%(건설업 35/1,000 + 출퇴근 0.6/1,000) · 고용 1.15%(실업급여 사업주 0.9% + 고용안정·직업능력개발 0.25%, 상시 150명 미만 — 150명 이상이면 고쳐 씀) ·
              건강 3.595% · 연금 4.75% · 장기요양 = 건강보험료 × 13.14%. <b>예시값</b>(간접노무비 · 퇴직공제 · 환경보전비 · 기타경비 · 일반관리비)은 발주기관 설계서 · 조달청 기준(공사 종류 · 규모 · 기간)으로 고쳐 쓰십시오.
            </div>
          </div>
        )}
      </div>

      <div className="card gj-paper">
        <div className="btn-row no-print" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 견적서 인쇄 (A4)</button>
          <span className="muted" style={{ fontSize: 12.5, alignSelf: 'center' }}>아래가 인쇄되는 모양입니다 — 견적서{견.방식 === 'public' ? ' · 원가계산서' : ''} 다음 쪽에 내역서.</span>
        </div>
        <h2 className="gj-title">견 적 서</h2>
        <div className="gj-head">
          <table className="tbl gj-left">
            <tbody>
              <tr><th>견적일</th><td>{날글(견.견적일)}</td></tr>
              <tr><th>수 신</th><td><b>{견.수신 || <span className="muted no-print">수신을 적으십시오</span>}</b> 귀하</td></tr>
              <tr><th>공사명</th><td>{견.공사명}</td></tr>
              <tr><th>공사 장소</th><td>{견.장소}</td></tr>
              <tr><th>공사 기간</th><td>{견.기간}</td></tr>
              <tr><th>유효 기간</th><td>{견.유효 ? `${날글(유효날)}까지 (견적일부터 ${견.유효}일)` : ''}</td></tr>
              <tr><th>결제 조건</th><td>{견.결제}</td></tr>
            </tbody>
          </table>
          <table className="tbl gj-right">
            <tbody>
              <tr><th rowSpan={6} className="gj-vert">공<br />급<br />자</th><th>상호</th><td><b>{나.상호}</b></td></tr>
              <tr><th>대표자</th><td>{나.대표} <span className="gj-seal">(인)</span></td></tr>
              <tr><th>사업자번호</th><td>{나.사업자}</td></tr>
              <tr><th>주소</th><td>{나.주소}</td></tr>
              <tr><th>전화</th><td>{나.전화}</td></tr>
              <tr><th>담당</th><td>{나.담당}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="gj-say">아래와 같이 견적합니다.</p>
        <div className="gj-amt">
          <span>견적 금액</span>
          <b>일금 {한글금액(S.견적금액)} 원정</b>
          <span className="gj-amt-n">(₩{원(S.견적금액)})</span>
          <span className="gj-amt-v">{S.부가포함 ? '부가가치세 포함' : '부가가치세 별도'}</span>
        </div>
        {S.절사분 > 0 && <div className="gj-cut">끝전 {원(S.절사분)}원을 버렸습니다 (합계 {원(S.합계)}원).</div>}

        {견.방식 === 'public' ? (
          <>
            <div className="tp-bill-sub">공 사 원 가 계 산 서</div>
            <div className="tp-scroll">
              <table className="tbl gj-cost">
                <thead><tr><th>구분</th><th>비목</th><th>금액 (원)</th><th className="gj-d">산출 근거</th><th>요율</th></tr></thead>
                <tbody>
                  {S.줄.map((r, i) => (
                    <tr key={i} className={(r.계 ? 'sum ' : '') + (r.끔 ? 'gj-off' : '')}>
                      <td className="nw">{r.대 && (i === 0 || S.줄[i - 1].대 !== r.대) ? r.대 : ''}</td>
                      <td className="gj-name"><span className="nw">{r.k}</span>{(r.끔 || r.근) && <div className="gj-m gj-small">{r.끔 ? '넣지 않음' : r.근}</div>}</td>
                      <td className="r">{r.끔 ? '—' : 원(r.금)}</td>
                      <td className="gj-small gj-d">{r.끔 ? '넣지 않음' : r.근 || ''}</td>
                      <td className="r nw">{r.끔 ? '' : r.율 || ''}</td>
                    </tr>
                  ))}
                  <tr className="sum"><td /><td className="gj-name">견적 금액</td><td className="r"><b>{원(S.견적금액)}</b></td><td className="gj-small gj-d">{S.절사분 > 0 ? `합계에서 끝전 ${원(S.절사분)}원 버림` : ''}</td><td /></tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="tp-bill-sub">공 사 비 집 계</div>
            <div className="tp-scroll">
              <table className="tbl gj-cost">
                <thead><tr><th>항목</th><th>금액 (원)</th><th>산출 근거</th></tr></thead>
                <tbody>
                  {S.줄.map((r, i) => (
                    <tr key={i} className={r.계 ? 'sum' : ''}><td className="nw">{r.k}</td><td className="r">{원(r.금)}</td><td className="gj-small">{r.근 || ''}</td></tr>
                  ))}
                  <tr className="sum"><td>견적 금액</td><td className="r"><b>{원(S.견적금액)}</b></td><td className="gj-small">{S.절사분 > 0 ? `합계에서 끝전 ${원(S.절사분)}원 버림` : ''}</td></tr>
                </tbody>
              </table>
            </div>
          </>
        )}
        {내역.공종.length > 1 && (
          <>
            <div className="tp-bill-sub">공종별 직접공사비</div>
            <div className="tp-scroll">
              <table className="tbl gj-cost">
                <thead><tr><th>공종</th><th>재료비</th><th>노무비</th><th>경비</th><th>계</th></tr></thead>
                <tbody>
                  {내역.공종.map((g) => <tr key={g.이름}><td className="nw">{g.이름}</td><td className="r">{원(g.재)}</td><td className="r">{원(g.노)}</td><td className="r">{원(g.경)}</td><td className="r"><b>{원(g.재 + g.노 + g.경)}</b></td></tr>)}
                </tbody>
              </table>
            </div>
          </>
        )}
        {견.비고 && <div className="gj-note"><b>비고</b> — {견.비고}</div>}

        <div className="gj-pb" />
        <div className="tp-bill-sub">내 역 서 <span className="muted" style={{ fontWeight: 400 }}>— {견.공사명}</span></div>
        <div className="tp-scroll">
          <table className="tbl gj-detail">
            <thead>
              <tr><th rowSpan={2}>No</th><th rowSpan={2}>공종</th><th rowSpan={2}>품명</th><th rowSpan={2}>규격</th><th rowSpan={2}>단위</th><th rowSpan={2}>수량</th>
                <th colSpan={2}>재료비</th><th colSpan={2}>노무비</th><th colSpan={2}>경비</th><th colSpan={2}>합계</th><th rowSpan={2}>비고</th></tr>
              <tr><th>단가</th><th>금액</th><th>단가</th><th>금액</th><th>단가</th><th>금액</th><th>단가</th><th>금액</th></tr>
            </thead>
            <tbody>
              {내역.줄들.filter((r) => !r.빈줄).map((r, i) => (
                <tr key={r.id}>
                  <td className="r">{i + 1}</td><td className="nw">{r.g}</td><td>{r.n}</td><td>{r.s}</td><td className="nw">{r.u}</td>
                  <td className="r">{r.수량 ? r.수량.toLocaleString('ko-KR') : ''}</td>
                  <td className="r">{r.m ? 원(r.m) : ''}</td><td className="r">{r.재금 ? 원(r.재금) : ''}</td>
                  <td className="r">{r.l ? 원(r.l) : ''}</td><td className="r">{r.노금 ? 원(r.노금) : ''}</td>
                  <td className="r">{r.e ? 원(r.e) : ''}</td><td className="r">{r.경금 ? 원(r.경금) : ''}</td>
                  <td className="r">{r.합단가 ? 원(r.합단가) : ''}</td><td className="r"><b>{원(r.합금)}</b></td><td>{r.note}</td>
                </tr>
              ))}
              <tr className="sum"><td /><td colSpan={5}>합 계</td><td /><td className="r">{원(내역.재)}</td><td /><td className="r">{원(내역.노)}</td><td /><td className="r">{원(내역.경)}</td><td /><td className="r"><b>{원(내역.직접)}</b></td><td /></tr>
            </tbody>
          </table>
        </div>
        <div className="tp-note">금액 = 수량 × 단가(원 미만 버림). {견.방식 === 'public' ? '원가계산의 각 비목도 원 미만 버림입니다.' : ''}</div>
      </div>

      <details className="card js-more">
        <summary className="sec-title">쓰는 방법 · 알아 두실 것</summary>
        <ul className="flist" style={{ marginBottom: 0 }}>
          <li><b>간단 견적</b> — 민간 공사 · 하도급 견적. 직접공사비(내역 합)에 덧붙일 항목(운반 · 폐기물 · 현장경비 등)을 더하고, 일반관리비 = 공사비 × %, 이윤 = (공사비 + 일반관리비) × %, 그다음 부가세 10%.</li>
          <li><b>공공식 원가계산</b> — 관급 설계 원가계산서와 같은 비목입니다(조달청식). 산재 · 고용 · 건강 · 연금 · 장기요양은 2026년 법정 요율, 산업안전보건관리비는 고용노동부고시 제2025-11호 별표 1(공사 종류 · 대상액 구간)로 셉니다.
            간접노무비 · 퇴직공제부금 · 환경보전비 · 기타경비 · 일반관리비는 공사 종류 · 규모 · 기간에 따라 다르니 <b>설계서 값으로 고쳐 쓰십시오</b>(체크를 끄면 넣지 않습니다).</li>
          <li>공공 원가계산의 일반관리비는 <b>8% 이하</b>, 이윤은 <b>15% 이하</b>입니다(국가계약법 시행규칙 제8조 — 공사). 넘으면 화면이 알려 드립니다. 민간 견적은 정해진 한도가 없습니다.</li>
          <li>엑셀에서 내역을 복사해 «📋 엑셀 표 붙여 넣기» 로 한 번에 넣을 수 있습니다.</li>
          <li>적은 것은 <b>이 브라우저에만</b> 남습니다. «💾 이 견적 저장» 으로 여러 벌(최대 20)을 두고 다시 불러옵니다.</li>
          <li>엑셀 서식이 필요하면 <Link to="/forms/wonga">공사원가계산서</Link> · <Link to="/forms/sanchul-naeyeok">공사 산출내역서</Link> 서식이 있고, 하도급 비율 맞추기는 <Link to="/naeyeok/ratio">내역서 비율 맞추기</Link>입니다.</li>
        </ul>
      </details>
    </div>
  )
}
