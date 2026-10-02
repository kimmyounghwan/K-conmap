import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  절들, 첨부기본, 형태들, 칸, 빈것, 읽기, 쓰기, 예시, 새번호, 수, 원, 붙여읽기, 실적모음, 기술모음, 부채비율, 오늘,
} from '../lib/jimyeong.js'
import { 한글금액 } from '../lib/gyeonjeok.js'
import { use인쇄 } from '../tools/공정인쇄.js'
import 도구설명 from '../tools/도구설명.jsx'
import 이어쓰기 from '../tools/이어쓰기.jsx'
import { 앞모습두기 } from '../lib/이어쓰기.js'

/**
 * 🏢 /tools/jimyeong — 공사지명원 만들기 (G112 · 2026-10-01)
 *
 * 소장님: 「예스폼에 또 뭐가 있지??? 새로 만들어야 할 서식은?」 → 예스폼 «공사지명원·회사소개»(39만, 우리 없음) → 「1부터 4까지 만들어 보자」 (②)
 * ■ 탭: ① 회사 ② 면허 · 연혁 ③ 기술인 · 장비 ④ 시공 실적 ⑤ 재무 · 첨부 ⑥ 미리보기 · 인쇄
 * ■ 표지 · 지명원 · 목차 · 절마다 표 → A4 세로 인쇄 + 📗 값만 엑셀. 저장은 이 브라우저(lib/jimyeong.js) + 🔗 코드 + 비밀번호로 서버에 잠가 두면 폰·PC 어디서든 이어 씀(tools/이어쓰기.jsx · G113).
 * ■ 창(alert · confirm)을 띄우지 않습니다 — 지우기는 한 번 더 누르기.
 */

const 탭들 = [['co', '① 회사'], ['lic', '② 면허 · 연혁'], ['ppl', '③ 기술인 · 장비'], ['rec', '④ 시공 실적'], ['fin', '⑤ 재무 · 첨부'], ['view', '⑥ 미리보기 · 인쇄']]
const 날글 = (s) => { const [y, m, d] = String(s || '').split('-'); return y && m ? `${y}. ${Number(m)}.${d ? ` ${Number(d)}.` : ''}` : (s || '') }
const 긴날 = (s) => { const [y, m, d] = String(s || '').split('-'); return y && m && d ? `${y}년 ${Number(m)}월 ${Number(d)}일` : '' }
const 숫자만 = (v) => String(v ?? '').replace(/[^\d]/g, '')
const 쉼 = (v) => { const s = 숫자만(v); return s ? Number(s).toLocaleString('ko-KR') : '' }
const 억글 = (n) => { const v = 수(n); if (!v) return ''; const 억 = Math.floor(v / 1e8), 만 = Math.round((v % 1e8) / 1e4); return (억 ? `${억.toLocaleString('ko-KR')}억` : '') + (만 ? ` ${만.toLocaleString('ko-KR')}만` : '') + '원' }
const 률글 = (x) => (Number.isFinite(x) ? (Math.round(x * 1000) / 10).toFixed(1) + '%' : '—')

/** 로고 — 긴 변 360px 로 줄여 data: 주소 (이 브라우저에 저장) */
function 그림줄이기(file) {
  return new Promise((ok, no) => {
    const fr = new FileReader()
    fr.onerror = () => no(new Error('읽기 실패'))
    fr.onload = () => {
      const img = new Image()
      img.onerror = () => no(new Error('그림이 아님'))
      img.onload = () => {
        const k = Math.min(1, 360 / Math.max(img.width, img.height))
        const cv = document.createElement('canvas')
        cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k))
        const g = cv.getContext('2d')
        g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height)
        g.drawImage(img, 0, 0, cv.width, cv.height)
        ok(cv.toDataURL('image/jpeg', 0.86))
      }
      img.src = fr.result
    }
    fr.readAsDataURL(file)
  })
}

export default function Jimyeong() {
  const [st, setSt] = useState(() => 읽기())
  const [저장, set저장] = useState(true)
  const [탭, set탭] = useState(() => { try { return localStorage.getItem('kcm_jimyeong_tab') || 'co' } catch (e) { return 'co' } })
  const [알림, set알림] = useState('')
  const [묻기, set묻기] = useState('')
  useEffect(() => { set저장(쓰기(st)) }, [st])
  useEffect(() => { document.title = '공사지명원 만들기 | K-건설맵' }, [])
  useEffect(() => { try { localStorage.setItem('kcm_jimyeong_tab', 탭) } catch (e) { /* */ } }, [탭])
  const 회 = st.회사
  const 회칸 = (k, v) => setSt((s) => ({ ...s, 회사: { ...s.회사, [k]: v } }))
  const 칸바꿈 = (k, v) => setSt((s) => ({ ...s, [k]: v }))
  const 실 = useMemo(() => 실적모음(st.실적), [st.실적])
  const 분야 = useMemo(() => 기술모음(st.기술), [st.기술])
  const [인쇄중, 인쇄] = use인쇄(`공사지명원_${회.상호 || ''}`)
  const 로고넣기 = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    try { const url = await 그림줄이기(f); 칸바꿈('로고', url); set알림('로고를 넣었습니다(긴 변 360px 로 줄임).') } catch (er) { set알림('그림을 읽지 못했습니다 — PNG · JPG 로 다시 골라 주십시오.') }
  }

  const 엑셀받기 = async () => {
    const { 값엑셀받기, 수칸 } = await import('../lib/값엑셀.js')
    const 개요 = [['상호', 회.상호], ['영문 상호', 회.영문], ['대표자', 회.대표], ['사업자등록번호', 회.사업자], ['법인등록번호', 회.법인], ['설립일', 날글(회.설립)], ['자본금(원)', 수칸(수(회.자본금))],
      ['주소', 회.주소], ['전화', 회.전화], ['팩스', 회.팩스], ['전자우편', 회.메일], ['누리집', 회.누리집], ['상시 직원', 회.직원 ? 회.직원 + '명' : ''], ['신용평가등급', 회.신용], ['회사 소개', 회.소개],
      ['수신', st.수신], ['건명', st.건명], ['제출일', 날글(st.제출일)]]
    const 표 = (k, rows) => rows.map((r) => 칸[k].map(([kk, , , 꼴]) => (꼴 === 'num' ? 수칸(수(r[kk])) : 꼴 === 'date' ? 날글(r[kk]) : r[kk] || '')))
    const 머리 = (k) => 칸[k].map((x) => x[1])
    const 폭 = (k) => 칸[k].map((x) => x[2])
    const 시트 = [{ name: '회사 개요', head: ['항목', '내용'], rows: 개요, widths: [16, 60] }]
    if (st.면허.length) 시트.push({ name: '면허', head: 머리('면허'), rows: 표('면허', st.면허), widths: 폭('면허') })
    if (st.연혁.length) 시트.push({ name: '연혁', head: 머리('연혁'), rows: 표('연혁', [...st.연혁].sort((a, b) => String(a.d).localeCompare(String(b.d)))), widths: 폭('연혁') })
    if (st.기술.length) 시트.push({ name: '기술인', head: ['번호', ...머리('기술')], rows: 표('기술', st.기술).map((r, i) => [i + 1, ...r]), widths: [6, ...폭('기술')] })
    if (st.장비.length) 시트.push({ name: '장비', head: 머리('장비'), rows: 표('장비', st.장비), widths: 폭('장비') })
    if (실.완료.length) 시트.push({ name: '시공 실적', head: ['번호', ...머리('실적')], rows: [...표('실적', 실.완료).map((r, i) => [i + 1, ...r]), ['', '합계', '', 수칸(실.완료합)]], widths: [6, ...폭('실적')] })
    if (실.중.length) 시트.push({ name: '시공 중', head: ['번호', ...머리('실적')], rows: [...표('실적', 실.중).map((r, i) => [i + 1, ...r]), ['', '합계', '', 수칸(실.중합)]], widths: [6, ...폭('실적')] })
    if (st.재무.length) 시트.push({ name: '재무', head: [...머리('재무'), '부채비율'], rows: 표('재무', st.재무).map((r, i) => [...r, 률글(부채비율(st.재무[i]))]), widths: [...폭('재무'), 10] })
    const 첨 = [...첨부기본.filter((k) => st.첨부[k]), ...st.첨부더.filter(Boolean)]
    if (첨.length) 시트.push({ name: '첨부 서류', head: ['번호', '서류'], rows: 첨.map((x, i) => [i + 1, x]), widths: [6, 40] })
    값엑셀받기(`공사지명원_${회.상호 || '회사'}`, 시트, { 주소: '/tools/jimyeong' })
  }

  return (
    <div className="wrap gj jm">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🏢 공사지명원 만들기 — 회사 소개 · 면허 · 기술인 · 실적</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          회사 정보 · 면허 · 연혁 · 기술인 · 장비 · <b>시공 실적</b> · 재무를 한 번 적어 두면 <b>표지 · 공사지명원 · 목차 · 절마다 표</b>가 A4로 나옵니다.
          다음 지명원은 <b>수신 · 날짜만 바꿔</b> 다시 뽑습니다. 실적 · 기술인은 엑셀 표를 그대로 붙여 넣을 수 있습니다.
        </p>
        <div className="nm-badges">
          <span>회원가입 없음 · 무료</span>
          <span>💾 이 브라우저에 저장 · 🔗 코드로 폰·PC 이어 쓰기 {저장 === true ? '' : 저장 === 'logo' ? <b className="nm-warn">— 로고가 커서 로고 없이 저장했습니다</b> : <b className="nm-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
          <span>📋 엑셀 표 붙여 넣기</span>
        </div>
        <이어쓰기 ns="jm" 이름="공사지명원" 파일="지명원" st={st} setSt={setSt} 읽기={읽기} 쓰기={쓰기} />
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { 앞모습두기('jm', st); setSt(예시()); set알림('예시를 채웠습니다 — 지어낸 회사입니다. «모두 비우기» 로 지우고 시작하십시오. 전에 적던 것은 «🔗 이어 쓰기 → 💾 백업 · 더 보기 → ↩ 되돌리기» 로 살립니다.') }}>🧪 예시로 해 보기</button>
          {묻기 === 'all'
            ? <><button type="button" className="btn line sm nm-warn" style={{ width: 'auto' }} onClick={() => { setSt(빈것()); set묻기(''); set알림('모두 비웠습니다.') }}>정말 모두 비우기</button><button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('')}>그대로</button></>
            : <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('all')}>🗑 모두 비우기</button>}
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => set탭('view')}>⑥ 미리보기 · 인쇄 →</button>
        </div>
        {알림 && <div className="note sm" role="status" style={{ marginTop: 8 }}>{알림}</div>}
      </div>

      <div className="eq-tabs" role="tablist">
        {탭들.map(([k, t]) => <button key={k} type="button" role="tab" aria-selected={탭 === k} className={탭 === k ? 'on' : ''} onClick={() => set탭(k)}>{t}</button>)}
      </div>

      {탭 === 'co' && (
        <>
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>① 회사</div>
            <div className="gj-form">
              {[['상호', '상호'], ['영문', '영문 상호 (선택)'], ['대표', '대표자'], ['사업자', '사업자등록번호'], ['법인', '법인등록번호'], ['전화', '전화'], ['팩스', '팩스'], ['메일', '전자우편'], ['누리집', '누리집 (선택)'], ['신용', '신용평가등급 (선택)']].map(([k, t]) => (
                <label key={k}>{t}<input className="inp" value={회[k]} maxLength={60} onChange={(e) => 회칸(k, e.target.value)} /></label>
              ))}
              <label>설립일<input className="inp" type="date" value={회.설립} onChange={(e) => 회칸('설립', e.target.value)} /></label>
              <label>자본금 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(회.자본금)} onChange={(e) => 회칸('자본금', 숫자만(e.target.value))} /></label>
              <label>상시 직원 (명)<input className="inp gj-num" inputMode="numeric" value={회.직원} onChange={(e) => 회칸('직원', 숫자만(e.target.value))} /></label>
              <label className="gj-wide">주소<input className="inp" value={회.주소} maxLength={100} onChange={(e) => 회칸('주소', e.target.value)} /></label>
              <label className="gj-wide">회사 소개 (회사 개요 쪽에 들어갑니다)<textarea className="inp" rows={3} value={회.소개} maxLength={800} onChange={(e) => 회칸('소개', e.target.value)} placeholder="주로 해 온 공사 · 강점 · 장비 · 기술인을 두세 줄로" /></label>
            </div>
            <div className="jm-logo">
              <span className="fm-ctl-k">로고 (표지에 들어감 · 선택)</span>
              {st.로고 ? <img src={st.로고} alt="로고" /> : <span className="muted" style={{ fontSize: 12.5 }}>없음</span>}
              <label className="btn line sm" style={{ width: 'auto' }}>그림 고르기<input type="file" accept="image/*" onChange={로고넣기} hidden /></label>
              {st.로고 && <button type="button" className="tp-x" onClick={() => 칸바꿈('로고', '')}>로고 빼기</button>}
            </div>
          </div>
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>📮 이번에 내는 곳</div>
            <div className="gj-form">
              <label>수신 (받는 곳)<input className="inp" value={st.수신} maxLength={60} onChange={(e) => 칸바꿈('수신', e.target.value)} placeholder="예: ○○시장 · ○○건설(주) 대표이사" /></label>
              <label>건명 (선택)<input className="inp" value={st.건명} maxLength={80} onChange={(e) => 칸바꿈('건명', e.target.value)} placeholder="예: ○○공사 지명경쟁입찰 참가" /></label>
              <label>제출일<input className="inp" type="date" value={st.제출일} onChange={(e) => 칸바꿈('제출일', e.target.value || 오늘())} /></label>
            </div>
          </div>
        </>
      )}

      {탭 === 'lic' && (
        <>
          <표칸 종류="면허" 제목="건설업 등록(면허) 현황" rows={st.면허} set={(v) => 칸바꿈('면허', v)} 도움="시공능력평가액은 협회 확인서의 금액(원)을 그대로 적습니다." set알림={set알림} />
          <표칸 종류="연혁" 제목="회사 연혁" rows={st.연혁} set={(v) => 칸바꿈('연혁', v)} 도움="연월은 2009-04 처럼 적으면 차례대로 정리됩니다." set알림={set알림} />
        </>
      )}
      {탭 === 'ppl' && (
        <>
          <표칸 종류="기술" 제목="기술인 보유 현황" rows={st.기술} set={(v) => 칸바꿈('기술', v)} 도움={분야.length ? '분야별 — ' + 분야.map((x) => `${x.분야} ${x.n}명`).join(' · ') : '건설기술인 경력증명서의 분야 · 등급을 적습니다.'} set알림={set알림} />
          <표칸 종류="장비" 제목="장비 보유 현황" rows={st.장비} set={(v) => 칸바꿈('장비', v)} 도움="보유 형태: 자가 · 리스 · 임차 등" set알림={set알림} />
        </>
      )}
      {탭 === 'rec' && (
        <표칸 종류="실적" 제목="시공 실적" rows={st.실적} set={(v) => 칸바꿈('실적', v)} 상태
          도움={`완료 ${실.완료.length}건 ${억글(실.완료합)} · 시공 중 ${실.중.length}건 ${억글(실.중합)} — 준공이 늦은 것부터 인쇄됩니다. 도급 형태: ${형태들.join(' · ')}`} set알림={set알림} />
      )}
      {탭 === 'fin' && (
        <>
          <표칸 종류="재무" 제목="재무 현황" rows={st.재무} set={(v) => 칸바꿈('재무', v)} 도움="최근 3년 재무제표 금액(원). 부채비율(부채 ÷ 자본)은 저절로 셉니다." set알림={set알림} />
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>📎 첨부 서류</div>
            <div className="jm-att">
              {첨부기본.map((k) => <label key={k} className="gj-check"><input type="checkbox" checked={!!st.첨부[k]} onChange={(e) => 칸바꿈('첨부', { ...st.첨부, [k]: e.target.checked })} /> {k}</label>)}
            </div>
            <div className="fm-ctl-k" style={{ marginTop: 8 }}>더 넣을 서류</div>
            {st.첨부더.map((x, i) => (
              <div key={i} className="gj-add-r"><input className="inp" value={x} maxLength={60} onChange={(e) => 칸바꿈('첨부더', st.첨부더.map((y, j) => (j === i ? e.target.value : y)))} /><button type="button" className="tp-x" onClick={() => 칸바꿈('첨부더', st.첨부더.filter((_, j) => j !== i))}>지우기</button></div>
            ))}
            <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 6 }} onClick={() => 칸바꿈('첨부더', [...st.첨부더, ''])}>＋ 서류 더하기</button>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>발주처 · 원도급사가 공고 · 요청서에 적은 서류가 따로 있으면 그것을 따르십시오.</div>
          </div>
        </>
      )}

      {탭 === 'view' && (
        <>
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>⑥ 넣을 쪽 고르기</div>
            <div className="jm-att">
              {절들.map(([k, t]) => <label key={k} className="gj-check"><input type="checkbox" checked={!!st.쪽[k]} onChange={(e) => 칸바꿈('쪽', { ...st.쪽, [k]: e.target.checked })} /> {t}</label>)}
            </div>
            <label className="gj-check" style={{ marginTop: 6 }}><input type="checkbox" checked={!!st.새쪽} onChange={(e) => 칸바꿈('새쪽', e.target.checked)} /> 절마다 새 쪽에서 시작</label>
            <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 공사지명원 인쇄 (A4)</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={엑셀받기}>📗 값만 엑셀</button>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>인쇄 창에서 «PDF로 저장» 을 고르면 PDF 로도 냅니다. 사업자등록증 같은 첨부 서류는 따로 떼어 뒤에 붙이십시오. 실적 사진은 <Link to="/tools/photo">사진대지</Link>로 만들 수 있습니다.</div>
          </div>
          <div className="jm-preview"><지명원종이 st={st} 실={실} 분야={분야} /></div>
        </>
      )}

      <도구설명 k="jimyeong" />
      {인쇄중 && createPortal(<div id="gp-인쇄"><div className="jm-쪽"><지명원종이 st={st} 실={실} 분야={분야} /></div></div>, document.body)}
    </div>
  )
}

/* ── 표 하나 편집 (면허 · 연혁 · 기술인 · 장비 · 실적 · 재무) ─────────────────── */
function 표칸({ 종류, 제목, rows, set, 도움, 상태, set알림 }) {
  const 정의 = 칸[종류]
  const [붙임, set붙임] = useState('')
  const [묻기, set묻기] = useState('')
  const 고침 = (id, k, v) => set(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)))
  const 더 = () => set([...rows, { id: 새번호(), ...(종류 === '실적' ? { k: '원도급', st: '완료' } : {}) }])
  const 위 = (i) => { if (i <= 0) return; const a = [...rows]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; set(a) }
  const 붙이기 = () => {
    const rs = 붙여읽기(종류, 붙임)
    if (!rs.length) { set알림(`붙여 넣은 글에서 줄을 찾지 못했습니다 — ${정의.map((x) => x[1]).join(' · ')} 차례로 복사해 주십시오.`); return }
    set([...rows, ...rs]); set붙임(''); set알림(`${제목}에 ${rs.length}줄을 붙였습니다.`)
  }
  return (
    <div className="card">
      <div className="detail-h" style={{ margin: 0 }}>{제목} <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— {rows.length}줄</span></div>
      {도움 && <div className="muted" style={{ fontSize: 12.5, margin: '4px 0 8px' }}>{도움}</div>}
      <div className="tp-scroll">
        <table className="tbl gj-rows jm-in">
          <thead><tr><th>No</th>{정의.map(([k, t]) => <th key={k}>{t}</th>)}{상태 && <th>상태</th>}<th /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="r">{i + 1}</td>
                {정의.map(([k, t, , 꼴]) => (
                  <td key={k}>
                    {k === 'k' && 종류 === '실적'
                      ? <select className="inp gj-in" value={r.k || '원도급'} onChange={(e) => 고침(r.id, 'k', e.target.value)} aria-label={t}>{형태들.map((x) => <option key={x}>{x}</option>)}</select>
                      : 꼴 === 'date'
                        ? <input className="inp gj-in" type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(r[k] || '') ? r[k] : ''} onChange={(e) => 고침(r.id, k, e.target.value)} aria-label={t} />
                        : 꼴 === 'num'
                          ? <input className="inp gj-in gj-num" inputMode="numeric" value={쉼(r[k])} onChange={(e) => 고침(r.id, k, 숫자만(e.target.value))} aria-label={t} />
                          : <input className={'inp gj-in' + (k === 'n' && 종류 === '실적' ? ' gj-w' : '') + (k === 't' ? ' jm-wide' : '')} value={r[k] || ''} maxLength={k === 't' ? 120 : 60} onChange={(e) => 고침(r.id, k, e.target.value)} aria-label={t} />}
                  </td>
                ))}
                {상태 && <td><select className="inp gj-in" value={r.st || '완료'} onChange={(e) => 고침(r.id, 'st', e.target.value)} aria-label="상태"><option>완료</option><option>시공중</option></select></td>}
                <td className="nw">
                  <button type="button" className="tp-x" onClick={() => 위(i)} aria-label="위로" disabled={i === 0}>↑</button>
                  {묻기 === r.id
                    ? <><button type="button" className="tp-x nm-warn" onClick={() => { set(rows.filter((x) => x.id !== r.id)); set묻기('') }}>정말</button><button type="button" className="tp-x" onClick={() => set묻기('')}>그대로</button></>
                    : <button type="button" className="tp-x" onClick={() => set묻기(r.id)} aria-label="지우기">✕</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={더}>＋ 줄 더하기</button>
      </div>
      <details className="gj-paste">
        <summary>📋 엑셀 표 붙여 넣기</summary>
        <div className="note sm" style={{ margin: '6px 0' }}>엑셀에서 <b>{정의.map((x) => x[1]).join(' · ')}</b> 차례의 칸을 골라 복사(Ctrl+C)한 뒤 붙여 넣으십시오. 지금 줄 뒤에 이어 붙습니다.</div>
        <textarea className="inp" rows={4} value={붙임} onChange={(e) => set붙임(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} placeholder="여기에 붙여 넣기" />
        <button type="button" className="btn sm" style={{ width: 'auto', marginTop: 6 }} onClick={붙이기} disabled={!붙임.trim()}>붙이기</button>
      </details>
    </div>
  )
}

/* ── 종이 (A4 세로) ─────────────────── */
function 지명원종이({ st, 실, 분야 }) {
  const 회 = st.회사
  const 쪽 = st.쪽
  const 면허대표 = st.면허[0]
  const 평가합 = st.면허.reduce((s, r) => s + 수(r.평가액), 0)
  const 목차 = 절들.filter(([k]) => 쪽[k] && !['표지', '목차'].includes(k) && (k === '지명원' || k === '개요' || 있음(k, st, 실)))
  const 절 = (k) => 쪽[k] && (k === '개요' || 있음(k, st, 실))
  let n = 0
  const 번호 = () => ++n
  const 새 = st.새쪽 ? ' jm-pb' : ''
  return (
    <div className="jm-paper">
      {쪽.표지 && (
        <section className="jm-cover">
          <div className="jm-cover-t">공 사 지 명 원</div>
          {st.건명 && <div className="jm-cover-s">{st.건명}</div>}
          <div className="jm-cover-m">
            {st.로고 && <img src={st.로고} alt="" />}
            <div className="jm-cover-co">{회.상호}</div>
            {회.영문 && <div className="jm-cover-en">{회.영문}</div>}
          </div>
          <div className="jm-cover-d">{긴날(st.제출일)}</div>
          {st.수신 && <div className="jm-cover-to">{st.수신} 귀하</div>}
        </section>
      )}
      {쪽.지명원 && (
        <section className={'jm-sec' + (쪽.표지 ? ' jm-pb' : '')}>
          <div className="jm-h1">공 사 지 명 원</div>
          <table className="jm-t jm-kv"><tbody>
            <tr><th>상 호</th><td colSpan={3}>{회.상호}</td></tr>
            <tr><th>대 표 자</th><td>{회.대표}</td><th>설 립 일</th><td>{날글(회.설립)}</td></tr>
            <tr><th>사업자등록번호</th><td>{회.사업자}</td><th>법인등록번호</th><td>{회.법인}</td></tr>
            <tr><th>소 재 지</th><td colSpan={3}>{회.주소}</td></tr>
            <tr><th>전 화</th><td>{회.전화}</td><th>팩 스</th><td>{회.팩스}</td></tr>
            <tr><th>자 본 금</th><td>{수(회.자본금) ? `${원(회.자본금)}원` : ''}</td><th>상시 직원</th><td>{회.직원 ? `${회.직원}명` : ''}</td></tr>
            <tr><th>등록 업종</th><td colSpan={3}>{st.면허.map((r) => r.업종).filter(Boolean).join(' · ')}</td></tr>
            <tr><th>시공능력평가액</th><td colSpan={3}>{st.면허.filter((r) => 수(r.평가액)).map((r) => `${r.업종} ${원(r.평가액)}원`).join(' · ')}{st.면허.filter((r) => 수(r.평가액)).length > 1 ? ` (합 ${원(평가합)}원)` : ''}{면허대표 && 면허대표.연도 ? ` — ${면허대표.연도}년` : ''}</td></tr>
            <tr><th>주요 실적</th><td colSpan={3}>{실.완료.length ? `완료 ${실.완료.length}건 · ${원(실.완료합)}원` : ''}{실.중.length ? ` / 시공 중 ${실.중.length}건` : ''}</td></tr>
          </tbody></table>
          <p className="jm-say">위 회사는 귀 {st.수신 && /시장|군수|구청장|도지사|청장|원장|공사|공단|기관/.test(st.수신) ? '기관' : '사'}에서 발주하는 공사에 참여하고자 회사 현황과 관계 서류를 갖추어 공사지명원을 제출하오니 지명하여 주시기 바랍니다.{st.건명 ? ` (건명: ${st.건명})` : ''}</p>
          <div className="jm-date">{긴날(st.제출일)}</div>
          <div className="jm-sign">
            <div><span>상 호</span><b>{회.상호}</b></div>
            <div><span>대 표 자</span><b>{회.대표}</b><em>(인)</em></div>
          </div>
          <div className="jm-to">{st.수신 ? `${st.수신} 귀하` : '　　　　　　　 귀하'}</div>
        </section>
      )}
      {쪽.목차 && 목차.length > 0 && (
        <section className={'jm-sec jm-pb'}>
          <div className="jm-h1">목 차</div>
          <ol className="jm-toc">{목차.map(([k, t]) => <li key={k}>{t}</li>)}</ol>
        </section>
      )}
      {절('개요') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 회사 개요</div>
          <table className="jm-t jm-kv"><tbody>
            <tr><th>상 호</th><td>{회.상호}{회.영문 ? ` (${회.영문})` : ''}</td><th>대 표 자</th><td>{회.대표}</td></tr>
            <tr><th>설 립 일</th><td>{날글(회.설립)}</td><th>자 본 금</th><td>{수(회.자본금) ? 억글(회.자본금) : ''}</td></tr>
            <tr><th>소 재 지</th><td colSpan={3}>{회.주소}</td></tr>
            <tr><th>전화 · 팩스</th><td>{[회.전화, 회.팩스].filter(Boolean).join(' / ')}</td><th>전자우편</th><td>{회.메일}</td></tr>
            <tr><th>상시 직원</th><td>{회.직원 ? `${회.직원}명` : ''}</td><th>신용평가등급</th><td>{회.신용}</td></tr>
            {회.누리집 && <tr><th>누 리 집</th><td colSpan={3}>{회.누리집}</td></tr>}
          </tbody></table>
          {회.소개 && <div className="jm-intro">{회.소개}</div>}
        </section>
      )}
      {절('연혁') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 회사 연혁</div>
          <table className="jm-t"><thead><tr><th style={{ width: '18%' }}>연 월</th><th>내 용</th></tr></thead>
            <tbody>{[...st.연혁].sort((a, b) => String(a.d).localeCompare(String(b.d))).map((r) => <tr key={r.id}><td className="c">{날글(r.d)}</td><td className="l">{r.t}</td></tr>)}</tbody></table>
        </section>
      )}
      {절('면허') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 건설업 등록(면허) 현황</div>
          <table className="jm-t"><thead><tr><th>No</th><th>업종</th><th>등록번호</th><th>등록일</th><th>시공능력평가액(원)</th><th>평가 연도</th></tr></thead>
            <tbody>{st.면허.map((r, i) => <tr key={r.id}><td className="c">{i + 1}</td><td>{r.업종}</td><td className="c">{r.번호}</td><td className="c">{날글(r.등록일)}</td><td className="r">{수(r.평가액) ? 원(r.평가액) : ''}</td><td className="c">{r.연도}</td></tr>)}
              {st.면허.length > 1 && 평가합 > 0 && <tr className="jm-sum"><td colSpan={4}>합 계</td><td className="r">{원(평가합)}</td><td /></tr>}</tbody></table>
        </section>
      )}
      {절('기술') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 기술인 보유 현황 <span className="jm-small">— 모두 {st.기술.length}명{분야.length ? ` (${분야.map((x) => `${x.분야} ${x.n}`).join(' · ')})` : ''}</span></div>
          <table className="jm-t"><thead><tr><th>No</th><th>성명</th><th>직무 분야</th><th>자격 · 학력</th><th>등급</th><th>입사일</th><th>비고</th></tr></thead>
            <tbody>{st.기술.map((r, i) => <tr key={r.id}><td className="c">{i + 1}</td><td className="c">{r.n}</td><td className="c">{r.분야}</td><td>{r.자격}</td><td className="c">{r.등급}</td><td className="c">{날글(r.입사)}</td><td>{r.note}</td></tr>)}</tbody></table>
        </section>
      )}
      {절('장비') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 장비 보유 현황</div>
          <table className="jm-t"><thead><tr><th>No</th><th>장비명</th><th>규격</th><th>대수</th><th>보유 형태</th><th>비고</th></tr></thead>
            <tbody>{st.장비.map((r, i) => <tr key={r.id}><td className="c">{i + 1}</td><td>{r.n}</td><td className="c">{r.s}</td><td className="c">{r.q}</td><td className="c">{r.o}</td><td>{r.note}</td></tr>)}
              <tr className="jm-sum"><td colSpan={3}>합 계</td><td className="c">{st.장비.reduce((s, r) => s + 수(r.q), 0)}</td><td colSpan={2} /></tr></tbody></table>
        </section>
      )}
      {절('실적') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 주요 시공 실적 <span className="jm-small">— {실.완료.length}건 · {원(실.완료합)}원</span></div>
          <실적표 rows={실.완료} 합={실.완료합} />
        </section>
      )}
      {절('시공중') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 시공 중인 공사 <span className="jm-small">— {실.중.length}건 · {원(실.중합)}원</span></div>
          <실적표 rows={실.중} 합={실.중합} />
        </section>
      )}
      {절('재무') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 재무 현황 <span className="jm-small">(단위: 원)</span></div>
          <table className="jm-t"><thead><tr><th>연도</th><th>매출액</th><th>자산 총계</th><th>부채 총계</th><th>자본 총계</th><th>부채비율</th></tr></thead>
            <tbody>{[...st.재무].sort((a, b) => String(a.y).localeCompare(String(b.y))).map((r) => <tr key={r.id}><td className="c">{r.y}</td><td className="r">{원(r.매출)}</td><td className="r">{원(r.자산)}</td><td className="r">{원(r.부채)}</td><td className="r">{원(r.자본)}</td><td className="r">{률글(부채비율(r))}</td></tr>)}</tbody></table>
        </section>
      )}
      {절('첨부') && (
        <section className={'jm-sec' + 새}>
          <div className="jm-h2">{번호()}. 첨부 서류</div>
          <ol className="jm-att-l">{[...첨부기본.filter((k) => st.첨부[k]), ...st.첨부더.filter(Boolean)].map((x, i) => <li key={i}>{x}</li>)}</ol>
        </section>
      )}
      <div className="jm-foot">{회.상호}{st.제출일 ? ` · ${날글(st.제출일)}` : ''}</div>
    </div>
  )
}
function 있음(k, st, 실) {
  if (k === '연혁') return st.연혁.length > 0
  if (k === '면허') return st.면허.length > 0
  if (k === '기술') return st.기술.length > 0
  if (k === '장비') return st.장비.length > 0
  if (k === '실적') return 실.완료.length > 0
  if (k === '시공중') return 실.중.length > 0
  if (k === '재무') return st.재무.length > 0
  if (k === '첨부') return 첨부기본.some((x) => st.첨부[x]) || st.첨부더.some(Boolean)
  return true
}
function 실적표({ rows, 합 }) {
  return (
    <table className="jm-t jm-rec">
      <thead><tr><th>No</th><th>공 사 명</th><th>발 주 처</th><th>계약금액(원)</th><th>공사 기간</th><th>도급 형태</th><th>비고</th></tr></thead>
      <tbody>
        {rows.map((r, i) => <tr key={r.id}><td className="c">{i + 1}</td><td>{r.n}</td><td>{r.o}</td><td className="r">{수(r.amt) ? 원(r.amt) : ''}</td><td className="c">{날글(r.s)} ~ {날글(r.e)}</td><td className="c">{r.k}</td><td>{r.note}</td></tr>)}
        <tr className="jm-sum"><td colSpan={3}>합 계 ({rows.length}건)</td><td className="r">{원(합)}</td><td colSpan={3} className="l jm-small">{합 ? `일금 ${한글금액(합)}원` : ''}</td></tr>
      </tbody>
    </table>
  )
}
