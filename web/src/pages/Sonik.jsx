import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  매출항목, 매입항목, 증빙들, 구분이름, 수, 원, 오늘, 새번호, 합계, 미결, 선급,
  셈, 달별, 거래처별, 분기세, 붙여읽기, 읽기, 쓰기, 빈장부, 예시,
} from '../lib/sonik.js'
import { use인쇄 } from '../tools/공정인쇄.js'
import 도구설명 from '../tools/도구설명.jsx'
import 이어쓰기 from '../tools/이어쓰기.jsx'

/**
 * 💰 /tools/sonik — 현장 손익 장부 (G112 · 2026-10-01)
 *
 * 소장님: 「예스폼에 또 뭐가 있지??? 새로 만들어야 할 서식은?」 → 예스폼 «현장 매입매출·손익»(40만, 우리 없음) → 「1부터 4까지 만들어 보자」 (①)
 * ■ 매출(청구) · 매입을 세금계산서 단위로 적으면 → 현장마다 손익 · 이익률 · 미수금 · 미지급금 · 달별 · 원가 구성 · 거래처별 · 분기 부가세(참고)
 * ■ 인쇄: 손익 보고서(A4 세로) · 매입매출장(A4 가로) + 📗 값만 엑셀. 저장은 이 브라우저 + 🔗 코드 + 비밀번호로 서버에 잠가 두면 폰·PC 어디서든 이어 씀(tools/이어쓰기.jsx · G113) — 셈은 lib/sonik.js.
 * ■ 창(alert · confirm)을 띄우지 않습니다 — 지우기는 한 번 더 누르기.
 */

const 률글 = (x) => (Number.isFinite(x) ? (Math.round(x * 1000) / 10).toFixed(1) + '%' : '—')
const 숫자만 = (v) => String(v ?? '').replace(/[^\d-]/g, '')
const 쉼 = (v) => { const s = 숫자만(v); return s && s !== '-' ? Number(s).toLocaleString('ko-KR') : s }
const 짧은날 = (s) => { const [y, m, d] = String(s || '').split('-'); return y && m && d ? `${y.slice(2)}.${m}.${d}` : '' }
const 빈줄 = (h = '', k = 'P') => ({ id: '', h, d: 오늘(), k, c: k === 'S' ? '기성금' : '자재비', v: '', t: '', sup: '', tax: '', ev: '세금계산서', pd: '', pa: '', 부가자동: true })

export default function Sonik() {
  const [st, setSt] = useState(() => 읽기())
  const [저장됨, set저장됨] = useState(true)
  const [고른, set고른] = useState('')               // '' = 전체 현장
  const [폼, set폼] = useState(() => 빈줄())
  const [알림, set알림] = useState('')
  const [묻기, set묻기] = useState('')
  const [거름, set거름] = useState({ k: '', ym: '', 미결: false, q: '' })
  const [새현장, set새현장] = useState(null)
  const [붙임, set붙임] = useState('')
  useEffect(() => { set저장됨(쓰기(st)) }, [st])
  useEffect(() => { document.title = '현장 손익 장부 | K-건설맵' }, [])
  useEffect(() => { if (고른 && !st.현장.some((h) => h.id === 고른)) set고른('') }, [st.현장, 고른])

  const 현장이름 = useMemo(() => Object.fromEntries(st.현장.map((h) => [h.id, h.n])), [st.현장])
  const 현장 = st.현장.find((h) => h.id === 고른) || null
  const 줄들 = useMemo(() => st.R.filter((r) => !고른 || r.h === 고른), [st.R, 고른])
  const S = useMemo(() => 셈(줄들, 현장), [줄들, 현장])
  const 달 = useMemo(() => 달별(줄들), [줄들])
  const 거래 = useMemo(() => 거래처별(줄들), [줄들])
  const 세 = useMemo(() => 분기세(줄들), [줄들])
  const 현장셈 = useMemo(() => st.현장.map((h) => ({ h, S: 셈(st.R.filter((r) => r.h === h.id), h) })), [st.현장, st.R])
  const 달들 = useMemo(() => [...new Set(줄들.map((r) => String(r.d || '').slice(0, 7)).filter(Boolean))].sort().reverse(), [줄들])
  const 보이는 = useMemo(() => 줄들.filter((r) => (!거름.k || r.k === 거름.k) && (!거름.ym || String(r.d || '').startsWith(거름.ym)) && (!거름.미결 || (!선급(r) && 미결(r) !== 0))
    && (!거름.q || [r.v, r.t, r.c].some((x) => String(x || '').includes(거름.q)))).sort((a, b) => String(b.d).localeCompare(String(a.d))), [줄들, 거름])
  const 거래처목록 = useMemo(() => [...new Set(st.R.map((r) => r.v).filter(Boolean))].slice(0, 80), [st.R])

  /* 줄 적기 · 고치기 */
  const 폼칸 = (k, v) => set폼((f) => {
    const n = { ...f, [k]: v }
    if (k === 'sup' && f.부가자동) n.tax = n.c === '노무비' || n.c === '선급금' ? '' : String(Math.round(수(v) / 10) || '')
    if (k === 'k') { n.c = v === 'S' ? '기성금' : '자재비' }
    if (k === 'c' && f.부가자동 && (v === '노무비' || v === '선급금')) { n.tax = ''; n.ev = '없음' }
    return n
  })
  const 다결제 = () => set폼((f) => ({ ...f, pa: String(수(f.sup) + 수(f.tax)), pd: f.pd || f.d }))
  const 적기 = () => {
    if (!폼.h) { set알림('현장을 먼저 고르십시오 — 없으면 «＋ 현장 더하기».'); return }
    if (!수(폼.sup) && !수(폼.tax)) { set알림('공급가액을 적으십시오.'); return }
    const r = { id: 폼.id || 새번호(), h: 폼.h, d: 폼.d || 오늘(), k: 폼.k, c: 폼.c, v: 폼.v.trim(), t: 폼.t.trim(), sup: 수(폼.sup), tax: 수(폼.tax), ev: 폼.ev, pd: 수(폼.pa) ? (폼.pd || 폼.d) : 폼.pd, pa: 수(폼.pa) }
    setSt((s) => ({ ...s, R: 폼.id ? s.R.map((x) => (x.id === 폼.id ? r : x)) : [r, ...s.R] }))
    set알림(폼.id ? '고쳤습니다.' : `${구분이름[r.k]} ${원(합계(r))}원을 적었습니다.`)
    set폼((f) => ({ ...빈줄(f.h, f.k), d: f.d, c: f.c, ev: f.ev }))
  }
  const 고치기 = (r) => { set폼({ ...r, sup: String(r.sup || ''), tax: String(r.tax || ''), pa: String(r.pa || ''), 부가자동: false }); set알림('아래 칸에서 고친 뒤 «고친 것 저장» 을 누르십시오.'); document.getElementById('sk-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const 지우기 = (id) => { setSt((s) => ({ ...s, R: s.R.filter((x) => x.id !== id) })); set묻기('') }
  const 현장저장 = () => {
    const x = 새현장
    if (!x || !String(x.n || '').trim()) { set알림('현장 이름을 적으십시오.'); return }
    const h = { id: x.id || 'h' + 새번호(), n: x.n.trim().slice(0, 60), o: String(x.o || '').trim().slice(0, 40), amt: 수(x.amt), s: x.s || '', e: x.e || '' }
    setSt((s) => ({ ...s, 현장: x.id ? s.현장.map((y) => (y.id === x.id ? h : y)) : [...s.현장, h] }))
    set고른(h.id); set폼((f) => ({ ...f, h: h.id })); set새현장(null)
    set알림(x.id ? '현장을 고쳤습니다.' : `«${h.n}» 현장을 더했습니다.`)
  }
  const 현장지우기 = (id) => {
    setSt((s) => ({ ...s, 현장: s.현장.filter((h) => h.id !== id), R: s.R.filter((r) => r.h !== id) }))
    set고른(''); set묻기(''); set새현장(null); set알림('현장과 그 현장의 줄을 지웠습니다.')
  }
  const 붙이기 = () => {
    const h = 고른 || 폼.h
    if (!h) { set알림('붙일 현장을 먼저 고르십시오.'); return }
    const rs = 붙여읽기(붙임, h)
    if (!rs.length) { set알림('붙여 넣은 글에서 줄을 찾지 못했습니다 — 날짜 · 구분(매출/매입) · 항목 · 거래처 · 적요 · 공급가액 · 부가세 · 결제일 · 결제액 차례로 복사해 주십시오.'); return }
    setSt((s) => ({ ...s, R: [...rs, ...s.R] })); set붙임(''); set알림(`${rs.length}줄을 «${현장이름[h]}» 에 붙였습니다.`)
  }

  /* 인쇄 · 엑셀 */
  const 제목 = 현장 ? 현장.n : '전체 현장'
  const [보고인쇄중, 보고인쇄] = use인쇄(`손익보고서_${제목}`)
  const [장인쇄중, 장인쇄] = use인쇄(`매입매출장_${제목}`)
  const 엑셀받기 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸 } = await import('../lib/값엑셀.js')
    const 요약 = [['장부', st.co || ''], ['범위', 제목], ['매출(공급가액)', 수칸(S.매출.공급)], ['매출 부가세', 수칸(S.매출.세)], ['받은 돈(선급금 포함)', 수칸(S.매출.결제)], ['선급금 받은 것', 수칸(S.매출.선급)], [굵은칸('미수금'), 수칸(S.매출.미)],
      ['매입(공급가액)', 수칸(S.매입.공급)], ['매입 부가세', 수칸(S.매입.세)], ['준 돈', 수칸(S.매입.결제)], [굵은칸('미지급금'), 수칸(S.매입.미)], [굵은칸('손익(공급가액 기준)'), 수칸(S.손익)], ['이익률', 률글(S.이익률)]]
    if (현장) 요약.push(['도급액(공급가액)', 수칸(S.도급)], ['진행률(매출 ÷ 도급액)', 률글(S.진행)], ['남은 도급액', 수칸(S.남은도급)], ['이대로 가면 — 예상 손익(참고)', Number.isFinite(S.예상손익) ? 수칸(S.예상손익) : ''])
    const 시트 = [{ name: '손익 요약', head: ['항목', '값'], rows: 요약, widths: [30, 22] }]
    if (!현장 && 현장셈.length) 시트.push({ name: '현장별', head: ['현장', '발주처', '도급액', '매출', '매입', '손익', '이익률', '진행률', '미수금', '미지급금'],
      rows: 현장셈.map(({ h, S: x }) => [h.n, h.o || '', 수칸(x.도급), 수칸(x.매출.공급), 수칸(x.매입.공급), 수칸(x.손익), 률글(x.이익률), 률글(x.진행), 수칸(x.매출.미), 수칸(x.매입.미)]), widths: [28, 14, 14, 14, 14, 14, 9, 9, 14, 14] })
    시트.push({ name: '매입매출장', head: ['날짜', '현장', '구분', '항목', '거래처', '적요', '공급가액', '부가세', '합계', '증빙', '결제일', '결제액', '미결'],
      rows: [...줄들].sort((a, b) => String(a.d).localeCompare(String(b.d))).map((r) => [r.d, 현장이름[r.h] || '', 구분이름[r.k], r.c, r.v, r.t, 수칸(r.sup), 수칸(r.tax), 수칸(합계(r)), r.ev || '', r.pd || '', 수칸(r.pa), 선급(r) ? '' : 수칸(미결(r))]),
      widths: [11, 22, 6, 9, 16, 28, 13, 11, 13, 10, 11, 13, 12] })
    시트.push({ name: '달별', head: ['달', '매출', '매입', '손익', '누계 손익', '들어온 돈', '나간 돈', '돈 흐름 누계'], rows: 달.map((x) => [x.ym, 수칸(x.매출), 수칸(x.매입), 수칸(x.손익), 수칸(x.누계), 수칸(x.들어옴), 수칸(x.나감), 수칸(x.돈누계)]), widths: [9, 14, 14, 14, 14, 14, 14, 14] })
    시트.push({ name: '원가 구성', head: ['항목', '매입(공급가액)', '비율'], rows: S.항목매입.map((x) => [x.이름, 수칸(x.금), 률글(S.매입.공급 ? x.금 / S.매입.공급 : NaN)]), widths: [14, 16, 9] })
    시트.push({ name: '거래처별', head: ['구분', '거래처', '건수', '합계', '결제', '미수 · 미지급', '마지막 날짜'], rows: 거래.map((x) => [구분이름[x.k], x.v, x.건, 수칸(x.합), 수칸(x.결제), 수칸(x.미), x.마지막]), widths: [6, 22, 6, 14, 14, 14, 11] })
    if (세.length) 시트.push({ name: '분기 부가세(참고)', head: ['분기', '매출세액', '매입세액', '차이'], rows: 세.map((x) => [x.q, 수칸(x.매출세), 수칸(x.매입세), 수칸(x.차)]), widths: [14, 14, 14, 14] })
    값엑셀받기(`손익장부_${제목}`, 시트, { 주소: '/tools/sonik' })
  }

  const 보고서 = <손익종이 st={st} 현장={현장} S={S} 달={달} 거래={거래} 현장셈={현장셈} />
  const 장부종이 = <매입매출장종이 st={st} 제목={제목} 줄들={[...줄들].sort((a, b) => String(a.d).localeCompare(String(b.d)))} 현장이름={현장이름} S={S} />

  return (
    <div className="wrap gj sk">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>💰 현장 손익 장부 — 매출 · 매입 · 미수금 · 손익</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          현장마다 <b>기성 청구(매출)</b>와 <b>자재 · 장비 · 노무 · 외주(매입)</b>를 세금계산서 단위로 적으면, <b>손익 · 이익률 · 미수금 · 미지급금</b>과 달별 흐름 · 원가 구성 · 거래처별 잔액이 저절로 나옵니다.
          도급액을 넣으면 진행률과 «이대로 가면» 예상 손익(참고)까지 봅니다. 손익 보고서 · 매입매출장을 <b>A4로 인쇄</b>합니다.
        </p>
        <div className="nm-badges">
          <span>회원가입 없음 · 무료</span>
          <span>💾 이 브라우저에 저장 · 🔗 코드로 폰·PC 이어 쓰기 {저장됨 ? '' : <b className="nm-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
          <span>📋 엑셀 표 붙여 넣기</span>
        </div>
        <이어쓰기 ns="sk" 이름="현장 손익 장부" 파일="손익장부" st={st} setSt={setSt} 읽기={읽기} 쓰기={쓰기} />
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {st.현장.length === 0 && <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { const e = 예시(); setSt(e); set고른(''); set폼(빈줄(e.현장[0].id)); set알림('예시를 채웠습니다 — 지어낸 회사 · 현장 · 거래처입니다. «장부 비우기» 로 지우고 시작하십시오.') }}>🧪 예시로 해 보기</button>}
          <label className="sk-co">장부 이름(회사)<input className="inp" value={st.co} maxLength={40} onChange={(e) => setSt((s) => ({ ...s, co: e.target.value }))} placeholder="예: ○○건설(주)" /></label>
          {st.현장.length > 0 && (묻기 === 'all'
            ? <><button type="button" className="btn line sm nm-warn" style={{ width: 'auto' }} onClick={() => { setSt(빈장부()); set고른(''); set폼(빈줄()); set묻기(''); set알림('장부를 비웠습니다.') }}>정말 비우기 (모든 현장 · 줄)</button><button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('')}>그대로</button></>
            : <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('all')}>🗑 장부 비우기</button>)}
        </div>
        {알림 && <div className="note sm" role="status" style={{ marginTop: 8 }}>{알림}</div>}
      </div>

      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>🏗 현장</div>
        <div className="fm-ctl-row" role="group" aria-label="현장 고르기" style={{ marginTop: 8 }}>
          <button type="button" className={'fm-chip' + (!고른 ? ' on' : '')} onClick={() => set고른('')}>전체 <span className="n">{st.현장.length}</span></button>
          {현장셈.map(({ h, S: x }) => (
            <button key={h.id} type="button" className={'fm-chip' + (고른 === h.id ? ' on' : '')} onClick={() => { set고른(h.id); set폼((f) => ({ ...f, h: h.id })) }}>
              {h.n} <span className={'n' + (x.손익 < 0 ? ' sk-neg' : '')}>{x.매출.공급 || x.매입.공급 ? 률글(x.이익률) : ''}</span>
            </button>
          ))}
          <button type="button" className="fm-chip" onClick={() => set새현장({ n: '', o: '', amt: '', s: '', e: '' })}>＋ 현장 더하기</button>
          {현장 && <button type="button" className="fm-chip" onClick={() => set새현장({ ...현장, amt: String(현장.amt || '') })}>✏️ 이 현장 고치기</button>}
        </div>
        {새현장 && (
          <div className="gj-form sk-newsite">
            <label>현장(공사) 이름<input className="inp" value={새현장.n} maxLength={60} onChange={(e) => set새현장((x) => ({ ...x, n: e.target.value }))} placeholder="예: ○○지구 배수로 정비공사" /></label>
            <label>발주처(원도급사)<input className="inp" value={새현장.o} maxLength={40} onChange={(e) => set새현장((x) => ({ ...x, o: e.target.value }))} /></label>
            <label>도급액 — 공급가액(부가세 빼고)<input className="inp gj-num" inputMode="numeric" value={쉼(새현장.amt)} onChange={(e) => set새현장((x) => ({ ...x, amt: 숫자만(e.target.value) }))} placeholder="진행률 · 예상 손익에 씀" /></label>
            <label>착공<input className="inp" type="date" value={새현장.s} onChange={(e) => set새현장((x) => ({ ...x, s: e.target.value }))} /></label>
            <label>준공<input className="inp" type="date" value={새현장.e} onChange={(e) => set새현장((x) => ({ ...x, e: e.target.value }))} /></label>
            <div className="btn-row gj-wide" style={{ justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={현장저장}>{새현장.id ? '고친 것 저장' : '현장 더하기'}</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set새현장(null)}>닫기</button>
              {새현장.id && (묻기 === 'h' + 새현장.id
                ? <><button type="button" className="btn line sm nm-warn" style={{ width: 'auto' }} onClick={() => 현장지우기(새현장.id)}>정말 지우기 (이 현장의 줄 {st.R.filter((r) => r.h === 새현장.id).length}개도)</button><button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('')}>그대로</button></>
                : <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('h' + 새현장.id)}>이 현장 지우기</button>)}
            </div>
          </div>
        )}
      </div>

      {(st.R.length > 0) && (
        <div className="card sk-sum">
          <div className="detail-h" style={{ margin: 0 }}>📊 {제목}{현장 && 현장.o ? <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}> — {현장.o}</span> : null}</div>
          <div className="sk-tiles">
            <div className="sk-tile"><span>매출 (공급가액)</span><b>{원(S.매출.공급)}</b><em>받은 돈 {원(S.매출.결제)}{S.매출.선급 ? ` (선급금 ${원(S.매출.선급)} 포함)` : ''}</em></div>
            <div className="sk-tile"><span>매입 (공급가액)</span><b>{원(S.매입.공급)}</b><em>준 돈 {원(S.매입.결제)}</em></div>
            <div className={'sk-tile big' + (S.손익 < 0 ? ' neg' : '')}><span>손익</span><b>{S.손익 > 0 ? '+' : ''}{원(S.손익)}</b><em>이익률 {률글(S.이익률)}</em></div>
            <div className={'sk-tile' + (S.매출.미 > 0 ? ' warn' : '')}><span>미수금 (받을 돈)</span><b>{원(S.매출.미)}</b><em>부가세 포함</em></div>
            <div className={'sk-tile' + (S.매입.미 > 0 ? ' warn' : '')}><span>미지급금 (줄 돈)</span><b>{원(S.매입.미)}</b><em>부가세 포함</em></div>
          </div>
          {현장 && S.도급 > 0 && (
            <div className="sk-prog">
              <div className="sk-bar"><i style={{ width: Math.min(100, (S.진행 || 0) * 100) + '%' }} /></div>
              <div className="sk-prog-t">도급액 {원(S.도급)} · 진행률(매출 ÷ 도급액) <b>{률글(S.진행)}</b> · 남은 도급액 {원(S.남은도급)}
                {Number.isFinite(S.예상손익) && <> · 이대로 가면 예상 손익 <b className={S.예상손익 < 0 ? 'nm-warn' : ''}>{S.예상손익 > 0 ? '+' : ''}{원(S.예상손익)}</b> <span className="muted">(매입 ÷ 진행률로 본 참고값)</span></>}</div>
            </div>
          )}
          {!현장 && 현장셈.length > 1 && (
            <div className="tp-scroll" style={{ marginTop: 10 }}>
              <table className="tbl sk-t">
                <thead><tr><th>현장</th><th>매출</th><th>매입</th><th>손익</th><th>이익률</th><th className="gj-d">진행률</th><th>미수금</th><th className="gj-d">미지급금</th></tr></thead>
                <tbody>{현장셈.map(({ h, S: x }) => (
                  <tr key={h.id} onClick={() => set고른(h.id)} className="sk-click"><td>{h.n}</td><td className="r">{원(x.매출.공급)}</td><td className="r">{원(x.매입.공급)}</td><td className={'r' + (x.손익 < 0 ? ' nm-warn' : '')}>{원(x.손익)}</td><td className="r">{률글(x.이익률)}</td><td className="r gj-d">{률글(x.진행)}</td><td className="r">{원(x.매출.미)}</td><td className="r gj-d">{원(x.매입.미)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={보고인쇄}>🖨 손익 보고서 (A4)</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={장인쇄}>🖨 매입매출장 (A4 가로)</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={엑셀받기}>📗 값만 엑셀</button>
          </div>
        </div>
      )}

      <div className="card" id="sk-form">
        <div className="detail-h" style={{ margin: 0 }}>{폼.id ? '✏️ 줄 고치기' : '✍️ 적기'}</div>
        {st.현장.length === 0 ? (
          <div className="muted" style={{ marginTop: 8 }}>먼저 위 «＋ 현장 더하기» 로 현장을 만드십시오(또는 예시로 해 보기).</div>
        ) : (
          <>
            <div className="fm-ctl-row" role="group" aria-label="매출 매입" style={{ marginTop: 10 }}>
              <button type="button" className={'fm-chip sk-s' + (폼.k === 'S' ? ' on' : '')} onClick={() => 폼칸('k', 'S')}>매출 — 청구 · 받을 돈</button>
              <button type="button" className={'fm-chip sk-p' + (폼.k === 'P' ? ' on' : '')} onClick={() => 폼칸('k', 'P')}>매입 — 쓴 돈 · 줄 돈</button>
            </div>
            <datalist id="sk-v">{거래처목록.map((v) => <option key={v} value={v} />)}</datalist>
            <div className="gj-form">
              <label>현장<select className="inp" value={폼.h} onChange={(e) => 폼칸('h', e.target.value)}><option value="">— 고르기 —</option>{st.현장.map((h) => <option key={h.id} value={h.id}>{h.n}</option>)}</select></label>
              <label>날짜 (세금계산서 · 청구일)<input className="inp" type="date" value={폼.d} onChange={(e) => 폼칸('d', e.target.value)} /></label>
              <label>항목<select className="inp" value={폼.c} onChange={(e) => 폼칸('c', e.target.value)}>{(폼.k === 'S' ? 매출항목 : 매입항목).map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>거래처<input className="inp" list="sk-v" value={폼.v} maxLength={40} onChange={(e) => 폼칸('v', e.target.value)} placeholder={폼.k === 'S' ? '발주처 · 원도급사' : '자재상 · 장비 · 외주 업체'} /></label>
              <label className="gj-wide">적요<input className="inp" value={폼.t} maxLength={80} onChange={(e) => 폼칸('t', e.target.value)} placeholder={폼.k === 'S' ? '예: 3회 기성' : '예: 레미콘 25-21-150 · 9월분'} /></label>
              <label>공급가액 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(폼.sup)} onChange={(e) => 폼칸('sup', 숫자만(e.target.value))} /></label>
              <label>부가세 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(폼.tax)} onChange={(e) => set폼((f) => ({ ...f, tax: 숫자만(e.target.value), 부가자동: false }))} />
                <span className="sk-mini"><input type="checkbox" checked={!!폼.부가자동} onChange={(e) => set폼((f) => ({ ...f, 부가자동: e.target.checked, tax: e.target.checked && f.c !== '노무비' && f.c !== '선급금' ? String(Math.round(수(f.sup) / 10) || '') : f.tax }))} /> 10% 저절로</span></label>
              <label>증빙<select className="inp" value={폼.ev} onChange={(e) => 폼칸('ev', e.target.value)}>{증빙들.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>{폼.k === 'S' ? '받은 날' : '준 날'}<input className="inp" type="date" value={폼.pd} onChange={(e) => 폼칸('pd', e.target.value)} /></label>
              <label>{폼.k === 'S' ? '받은 돈' : '준 돈'} (원)<input className="inp gj-num" inputMode="numeric" value={쉼(폼.pa)} onChange={(e) => 폼칸('pa', 숫자만(e.target.value))} placeholder="아직이면 비움" />
                <button type="button" className="tp-x sk-mini" onClick={다결제}>합계 {원(수(폼.sup) + 수(폼.tax))} 다 {폼.k === 'S' ? '받음' : '줌'}</button></label>
            </div>
            {폼.c === '선급금' && <div className="note sm" style={{ marginTop: 6 }}>선급금은 <b>받은 돈</b>에만 들어가고 매출(손익 · 진행률)에는 안 들어갑니다. 기성을 받을 때 정산분을 빼고 받았으면 기성 줄의 «받은 돈» 에 실제 들어온 금액을 적으십시오 — 미수금이 저절로 맞습니다.</div>}
            <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={적기}>{폼.id ? '고친 것 저장' : `${구분이름[폼.k]} 적기`}</button>
              {폼.id && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { set폼((f) => 빈줄(f.h, f.k)); set알림('') }}>고치기 그만</button>}
            </div>
            <details className="gj-paste">
              <summary>📋 엑셀 표 붙여 넣기 (여러 줄 한꺼번에)</summary>
              <div className="note sm" style={{ margin: '6px 0' }}>엑셀에서 <b>날짜 · 구분(매출/매입) · 항목 · 거래처 · 적요 · 공급가액 · 부가세 · 결제일 · 결제액</b> 차례의 칸을 골라 복사한 뒤 붙여 넣으십시오. {고른 || 폼.h ? <>«<b>{현장이름[고른 || 폼.h]}</b>» 현장에 붙습니다.</> : '먼저 현장을 고르십시오.'}</div>
              <textarea className="inp" rows={4} value={붙임} onChange={(e) => set붙임(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} placeholder="여기에 붙여 넣기" />
              <button type="button" className="btn sm" style={{ width: 'auto', marginTop: 6 }} onClick={붙이기} disabled={!붙임.trim()}>장부에 붙이기</button>
            </details>
          </>
        )}
      </div>

      {줄들.length > 0 && (
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>📒 매입매출장 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— {보이는.length}줄</span></div>
          <div className="sk-filter">
            <select className="inp" value={거름.k} onChange={(e) => set거름((x) => ({ ...x, k: e.target.value }))} aria-label="구분"><option value="">매출 · 매입</option><option value="S">매출만</option><option value="P">매입만</option></select>
            <select className="inp" value={거름.ym} onChange={(e) => set거름((x) => ({ ...x, ym: e.target.value }))} aria-label="달"><option value="">모든 달</option>{달들.map((m) => <option key={m} value={m}>{m}</option>)}</select>
            <input className="inp" value={거름.q} onChange={(e) => set거름((x) => ({ ...x, q: e.target.value }))} placeholder="거래처 · 적요 찾기" aria-label="찾기" />
            <label className="gj-check"><input type="checkbox" checked={거름.미결} onChange={(e) => set거름((x) => ({ ...x, 미결: e.target.checked }))} /> 덜 받은 · 덜 준 것만</label>
          </div>
          <div className="tp-scroll">
            <table className="tbl sk-t sk-led">
              <thead><tr><th>날짜</th>{!고른 && <th className="gj-d">현장</th>}<th>구분</th><th>항목</th><th>거래처</th><th className="gj-d">적요</th><th>합계</th><th className="gj-d">결제</th><th>미결</th><th /></tr></thead>
              <tbody>
                {보이는.slice(0, 300).map((r) => (
                  <tr key={r.id} className={r.k === 'S' ? 'sk-rs' : ''}>
                    <td className="nw">{짧은날(r.d)}</td>{!고른 && <td className="gj-d sk-cut">{현장이름[r.h] || ''}</td>}
                    <td className="nw"><span className={'sk-tag ' + r.k}>{구분이름[r.k]}</span></td><td className="nw">{r.c}</td><td className="sk-cut">{r.v}</td><td className="gj-d sk-cut">{r.t}</td>
                    <td className="r nw">{원(합계(r))}<div className="gj-small">{r.tax ? `공급 ${원(r.sup)} + 세 ${원(r.tax)}` : ''}</div></td>
                    <td className="r nw gj-d">{r.pa ? 원(r.pa) : ''}<div className="gj-small">{짧은날(r.pd)}</div></td>
                    <td className={'r nw' + (!선급(r) && 미결(r) > 0 ? ' nm-warn' : '')}>{선급(r) ? <span className="gj-small">선급금</span> : 미결(r) ? 원(미결(r)) : '✓'}</td>
                    <td className="nw">
                      <button type="button" className="tp-x" onClick={() => 고치기(r)}>고치기</button>
                      {묻기 === r.id
                        ? <><button type="button" className="tp-x nm-warn" onClick={() => 지우기(r.id)}>정말</button><button type="button" className="tp-x" onClick={() => set묻기('')}>그대로</button></>
                        : <button type="button" className="tp-x" onClick={() => set묻기(r.id)} aria-label="지우기">✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {보이는.length > 300 && <div className="muted" style={{ fontSize: 12.5 }}>앞의 300줄만 보입니다 — 달 · 구분으로 거르십시오(엑셀 · 인쇄에는 다 들어갑니다).</div>}
        </div>
      )}

      {줄들.length > 0 && (
        <div className="sk-two">
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>📅 달별</div>
            <div className="tp-scroll">
              <table className="tbl sk-t">
                <thead><tr><th>달</th><th>매출</th><th>매입</th><th>손익</th><th className="gj-d">누계</th><th className="gj-d">돈 흐름</th></tr></thead>
                <tbody>{달.map((x) => <tr key={x.ym}><td className="nw">{x.ym}</td><td className="r">{원(x.매출)}</td><td className="r">{원(x.매입)}</td><td className={'r' + (x.손익 < 0 ? ' nm-warn' : '')}>{원(x.손익)}</td><td className="r gj-d">{원(x.누계)}</td><td className={'r gj-d' + (x.돈 < 0 ? ' nm-warn' : '')}>{원(x.돈)}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>매출 · 매입은 날짜(청구일) 기준, 돈 흐름은 받은 날 · 준 날 기준(들어온 돈 − 나간 돈)입니다.</div>
          </div>
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>🧱 원가 구성 (매입)</div>
            <div className="sk-bars">
              {S.항목매입.map((x) => (
                <div key={x.이름} className="sk-brow"><span>{x.이름}</span><div className="sk-bar"><i style={{ width: (S.매입.공급 ? x.금 / S.매입.공급 * 100 : 0) + '%' }} /></div><b>{원(x.금)}</b><em>{률글(S.매입.공급 ? x.금 / S.매입.공급 : NaN)}</em></div>
              ))}
            </div>
            {S.매출.공급 > 0 && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>매출 대비 원가율 {률글(S.매입.공급 / S.매출.공급)}</div>}
          </div>
        </div>
      )}

      {거래.length > 0 && (
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>🤝 거래처별 — 받을 돈 · 줄 돈</div>
          <div className="tp-scroll">
            <table className="tbl sk-t">
              <thead><tr><th>구분</th><th>거래처</th><th className="gj-d">건수</th><th>합계</th><th className="gj-d">결제</th><th>미수 · 미지급</th><th className="gj-d">마지막</th></tr></thead>
              <tbody>{거래.map((x) => <tr key={x.k + x.v}><td><span className={'sk-tag ' + x.k}>{구분이름[x.k]}</span></td><td>{x.v}</td><td className="r gj-d">{x.건}</td><td className="r">{원(x.합)}</td><td className="r gj-d">{원(x.결제)}</td><td className={'r' + (x.미 > 0 ? ' nm-warn' : '')}>{원(x.미)}</td><td className="gj-d nw">{짧은날(x.마지막)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>못 받은 돈이 오래되었으면 <Link to="/tools/unpaid">미불금 받는 순서</Link> · <Link to="/tools/demand-letter">내용증명 쓰기</Link>로 이어집니다.</div>
        </div>
      )}

      {세.length > 0 && (
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>🧾 분기별 부가세 (참고)</div>
          <div className="tp-scroll">
            <table className="tbl sk-t">
              <thead><tr><th>분기</th><th>매출세액</th><th>매입세액</th><th>차이</th></tr></thead>
              <tbody>{세.map((x) => <tr key={x.q}><td>{x.q}</td><td className="r">{원(x.매출세)}</td><td className="r">{원(x.매입세)}</td><td className="r"><b>{원(x.차)}</b></td></tr>)}</tbody>
            </table>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>적은 부가세를 날짜 분기로 모은 참고값입니다. 매입세액 공제 여부 · 신고 기한은 증빙과 사업자 형태에 따라 다르니 세무 대리인에게 확인하십시오.</div>
        </div>
      )}

      <div className="card">
        <p className="cp" style={{ margin: 0, fontSize: 13 }}>
          현장에서 날마다 출역 · 장비 · 자재를 적고 달마다 청구내역서까지 뽑으려면 <Link to="/tools/tuipbi">현장 투입비 · 공사일보</Link>,
          장비 임대료 수금은 <Link to="/tools/equip">장비 임대료 · 수금 장부</Link>, 일용 노무비는 <Link to="/tools/nomubi">노무비 계산기</Link>입니다.
        </p>
      </div>

      <도구설명 k="sonik" />
      {보고인쇄중 && createPortal(<div id="gp-인쇄"><div className="sk-쪽">{보고서}</div></div>, document.body)}
      {장인쇄중 && createPortal(<div id="gp-인쇄"><div className="sk-쪽 land">{장부종이}</div></div>, document.body)}
    </div>
  )
}

/* ── 인쇄 종이 ─────────────────── */
function 손익종이({ st, 현장, S, 달, 거래, 현장셈 }) {
  const t = new Date()
  return (
    <div className="il-paper sk-paper">
      <div className="il-title" style={{ textAlign: 'center' }}>현 장 손 익 보 고 서</div>
      <table className="il-t il-info"><tbody>
        <tr><th>장 부</th><td>{st.co}</td><th>작성일</th><td>{t.getFullYear()}. {t.getMonth() + 1}. {t.getDate()}.</td></tr>
        <tr><th>현 장</th><td colSpan={3}>{현장 ? `${현장.n}${현장.o ? ' (' + 현장.o + ')' : ''}` : `전체 현장 ${현장셈.length}곳`}</td></tr>
        {현장 && <tr><th>도급액</th><td>{원(S.도급)}원 (공급가액)</td><th>공사기간</th><td>{현장.s} ~ {현장.e}</td></tr>}
      </tbody></table>
      <div className="il-h">1. 손익 요약 (공급가액 기준 · 원)</div>
      <table className="il-t"><tbody>
        <tr><th>매출</th><td className="r">{원(S.매출.공급)}</td><th>매입</th><td className="r">{원(S.매입.공급)}</td></tr>
        <tr><th>손익</th><td className="r"><b>{원(S.손익)}</b></td><th>이익률</th><td className="r">{률글(S.이익률)}</td></tr>
        <tr><th>받은 돈</th><td className="r">{원(S.매출.결제)}{S.매출.선급 ? ` (선급금 ${원(S.매출.선급)})` : ''}</td><th>준 돈</th><td className="r">{원(S.매입.결제)}</td></tr>
        <tr><th>미수금</th><td className="r"><b>{원(S.매출.미)}</b></td><th>미지급금</th><td className="r"><b>{원(S.매입.미)}</b></td></tr>
        {현장 && S.도급 > 0 && <tr><th>진행률</th><td className="r">{률글(S.진행)}</td><th>예상 손익(참고)</th><td className="r">{Number.isFinite(S.예상손익) ? 원(S.예상손익) : '—'}</td></tr>}
      </tbody></table>
      {!현장 && 현장셈.length > 0 && <>
        <div className="il-h">2. 현장별</div>
        <table className="il-t"><thead><tr><th>현장</th><th>매출</th><th>매입</th><th>손익</th><th>이익률</th><th>미수금</th></tr></thead>
          <tbody>{현장셈.map(({ h, S: x }) => <tr key={h.id}><td className="l">{h.n}</td><td className="r">{원(x.매출.공급)}</td><td className="r">{원(x.매입.공급)}</td><td className="r">{원(x.손익)}</td><td className="r">{률글(x.이익률)}</td><td className="r">{원(x.매출.미)}</td></tr>)}</tbody></table>
      </>}
      <div className="il-h">{현장 ? 2 : 3}. 달별</div>
      <table className="il-t"><thead><tr><th>달</th><th>매출</th><th>매입</th><th>손익</th><th>누계 손익</th></tr></thead>
        <tbody>{달.map((x) => <tr key={x.ym}><td>{x.ym}</td><td className="r">{원(x.매출)}</td><td className="r">{원(x.매입)}</td><td className="r">{원(x.손익)}</td><td className="r">{원(x.누계)}</td></tr>)}</tbody></table>
      <div className="il-two">
        <div>
          <div className="il-h">{현장 ? 3 : 4}. 원가 구성</div>
          <table className="il-t"><thead><tr><th>항목</th><th>금액</th><th>비율</th></tr></thead>
            <tbody>{S.항목매입.map((x) => <tr key={x.이름}><td>{x.이름}</td><td className="r">{원(x.금)}</td><td className="r">{률글(S.매입.공급 ? x.금 / S.매입.공급 : NaN)}</td></tr>)}</tbody></table>
        </div>
        <div>
          <div className="il-h">{현장 ? 4 : 5}. 미수 · 미지급 (거래처)</div>
          <table className="il-t"><thead><tr><th>구분</th><th>거래처</th><th>잔액</th></tr></thead>
            <tbody>{거래.filter((x) => x.미 > 0).slice(0, 14).map((x) => <tr key={x.k + x.v}><td>{구분이름[x.k]}</td><td className="l">{x.v}</td><td className="r">{원(x.미)}</td></tr>)}</tbody></table>
        </div>
      </div>
      <div className="il-foot">K-건설맵 현장 손익 장부 — 적은 값으로 셈한 관리용 자료(회계 · 세무 판단 아님)</div>
    </div>
  )
}

function 매입매출장종이({ st, 제목, 줄들, 현장이름, S }) {
  return (
    <div className="il-paper sk-paper sk-ledp">
      <div className="il-title" style={{ textAlign: 'center' }}>매 입 매 출 장</div>
      <div className="sk-ledh"><span>{st.co}</span><span>{제목}</span></div>
      <table className="il-t">
        <thead><tr><th>날짜</th><th>현장</th><th>구분</th><th>항목</th><th>거래처</th><th>적요</th><th>공급가액</th><th>부가세</th><th>합계</th><th>증빙</th><th>결제일</th><th>결제액</th><th>미결</th></tr></thead>
        <tbody>
          {줄들.map((r) => <tr key={r.id}><td className="nw">{r.d}</td><td className="l">{현장이름[r.h] || ''}</td><td>{구분이름[r.k]}</td><td>{r.c}</td><td className="l">{r.v}</td><td className="l">{r.t}</td><td className="r">{원(r.sup)}</td><td className="r">{r.tax ? 원(r.tax) : ''}</td><td className="r">{원(합계(r))}</td><td>{r.ev}</td><td className="nw">{r.pd}</td><td className="r">{r.pa ? 원(r.pa) : ''}</td><td className="r">{선급(r) ? '' : 미결(r) ? 원(미결(r)) : ''}</td></tr>)}
          <tr className="il-sum"><td colSpan={6}>매출 합계</td><td className="r">{원(S.매출.공급)}</td><td className="r">{원(S.매출.세)}</td><td className="r">{원(S.매출.합)}</td><td /><td /><td className="r">{원(S.매출.결제)}</td><td className="r">{원(S.매출.미)}</td></tr>
          <tr className="il-sum"><td colSpan={6}>매입 합계</td><td className="r">{원(S.매입.공급)}</td><td className="r">{원(S.매입.세)}</td><td className="r">{원(S.매입.합)}</td><td /><td /><td className="r">{원(S.매입.결제)}</td><td className="r">{원(S.매입.미)}</td></tr>
        </tbody>
      </table>
      <div className="il-foot">K-건설맵 현장 손익 장부</div>
    </div>
  )
}
