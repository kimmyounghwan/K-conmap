/**
 * 📈 예정공정표 «💰 금액형» (달마다 비율·금액 · 당초·변경 두 줄) — /tools/schedule 의 두 번째 양식 (2026-09-28)
 *    처음엔 따로 «변경 예정공정표» 도구(/tools/schedule-change)였다가 소장님 「공정표를 말하는 거야」 → «예정공정표 다른 형식» 으로 묶음(공정칸.jsx Schedule).
 *
 * 소장님: 「예정공정표 다른 형식이야. 이것도 올려줘. 도구 프로그램으로 올려서 이용자들이 사용할 수 있게 해줘」
 *   받은 엑셀 양식(설계변경 때 내는 «예정공정표 (변경)»)의 모양과 셈 방식만 옮겼습니다:
 *   · 공종마다 당초(빨강)·변경(검정) 두 줄 — 칸(월)마다 위에 그 달 비율(%), 막대, 아래에 그 달 금액
 *   · 왼쪽: 공종(◈ 대공종 · 1 공종 · 1.1 세부) · 수량 · 단위 · 도급금액 · 보할(%)
 *   · 아래: 순공사비계 · 제경비 · 도급액 · 공정률(누계) — 당초·변경 두 줄씩, S커브 두 줄(빨강·검정)과 오른쪽 0~100 눈금
 *   받은 파일의 공사명·회사·금액은 쓰지 않았습니다. 예시는 지어낸 공사입니다.
 *   «변경 두 줄» 을 끄면 한 줄짜리 금액형 예정공정표(착공 때 내는 것)로도 씁니다.
 *
 * ■ 칸: 예정공정표 도구 저장(localStorage 'kcm.calc.schedule') 안에 «금_» 을 붙인 이름 · 셈: lib/공정.js 변경공정셈 (시험: node tools/시험_공정.mjs)
 * ■ 그림: SVG 한 장(화면·인쇄 같음). 인쇄는 A3 가로(받은 양식과 같음) 또는 A4 가로 — 줄이 많으면 여러 쪽으로 나눔.
 */
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { use칸, Row, Out } from './calcs.jsx'
import { use인쇄 } from './공정인쇄.js'
import { 변경공정셈, 맞춰반올림, 내역공종, 공정셈, 자동배치, 점날, 번날, 날번 } from '../lib/공정.js'

const 쉼 = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '')
const 퍼2 = (v) => (Number.isFinite(v) ? (v * 100).toFixed(2) : '')
const 빈줄 = (깊이 = 1) => ({ 깊이, 이름: '', 수량: '1', 단위: '식', 금액: '', 시작: '', 끝: '', 변금액: '', 변시작: '', 변끝: '' })
const 숫자만 = (t) => String(t || '').replace(/[^0-9]/g, '')

export function ScheduleChange({ ex = {}, 앞 = '' }) {
  const 칸 = (이름, 처음) => use칸(앞 + 이름, ex[앞 + 이름] ?? 처음)   // eslint-disable-line react-hooks/rules-of-hooks
  const [공사명, set공사명] = 칸('공사명', '')
  const [제목말, set제목말] = 칸('제목말', '')
  const [착공, set착공] = 칸('착공', '')
  const [준공, set준공] = 칸('준공', '')
  const [변준공, set변준공] = 칸('변준공', '')
  const [간격, set간격] = 칸('간격', '월')
  const [단위, set단위] = 칸('단위', '천원')
  const [도급, set도급] = 칸('도급', '')
  const [변도급, set변도급] = 칸('변도급', '')
  const [변경, set변경] = 칸('변경', true)
  const [상호, set상호] = 칸('상호', '')
  const [용지, set용지] = 칸('용지', 'A3')
  const [공종, set공종] = 칸('공종', [빈줄(0), 빈줄(1), 빈줄(1)])
  const [알림, set알림] = useState('')
  const [맞춤, set맞춤] = useState(false)          // 화면: 실제 크기(가로로 밀어 봄) ↔ 화면 너비에 맞춤
  const 파일 = useRef(null)
  const P = { 착공, 준공, 변준공, 간격, 도급, 변도급, 변경, 공종 }
  const R = useMemo(() => 변경공정셈(P), [착공, 준공, 변준공, 간격, 도급, 변도급, 변경, 공종])   // eslint-disable-line react-hooks/exhaustive-deps
  const [인쇄중, 인쇄] = use인쇄('예정공정표' + (공사명 ? ' — ' + 공사명 : ''))

  const 고침 = (i, key, v) => set공종((L) => L.map((r, j) => (j === i ? { ...r, [key]: v } : r)))
  const 더하기 = (깊이) => set공종((L) => [...L, 빈줄(깊이)])
  const 빼기 = (i) => set공종((L) => L.filter((_, j) => j !== i))
  const 올리기 = (i) => { if (i <= 0) return; set공종((L) => { const a = [...L]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a }) }
  const 끼우기 = (i) => set공종((L) => [...L.slice(0, i + 1), 빈줄(Math.max(1, (L[i] && L[i].깊이) || 1)), ...L.slice(i + 1)])

  const 내역받기 = async (f) => {
    if (!f) return
    try {
      const r = 내역공종(await f.arrayBuffer(), f.name)
      set공종([{ ...빈줄(0), 이름: '공사' }, ...r.공종.map((x) => ({ ...빈줄(1), 이름: x.이름, 금액: x.금액 > 0 ? String(단위 === '천원' ? Math.round(x.금액 / 1000) : x.금액) : '' }))])
      set알림('📥 «' + r.시트 + '» 시트에서 공종 ' + r.공종.length + '가지를 가져왔습니다' + (단위 === '천원' ? ' (금액은 천원으로 바꿈)' : '') + (r.금있음 ? '' : ' — 금액이 비어 있어 직접 적어 주십시오') + '. 착공·준공을 적고 🪄 당초 기간 자동 배치를 누르십시오.')
    } catch (e) { set알림('⚠️ ' + e.message) }
  }
  /* 📈 같은 브라우저의 «예정공정표 · S커브» 도구에 적어 둔 것 → 당초 */
  const 공정표받기 = () => {
    let m = null
    try { m = JSON.parse(localStorage.getItem('kcm.calc.schedule') || 'null') } catch (e) { m = null }
    if (!m || !Array.isArray(m.공종) || !m.공종.some((x) => x && x.이름)) { set알림('📊 막대형에 적어 둔 공종이 없습니다 — 위에서 막대형을 골라 먼저 적거나, 여기서 바로 적으십시오.'); return }
    const S = 공정셈({ 착공: m.착공, 준공: m.준공, 간격: '월', 공종: m.공종 })
    const 줄 = S.줄.filter((z) => z.이름 || z.금액 > 0).map((z) => ({ ...빈줄(1), 이름: z.이름, 금액: z.금액 > 0 ? String(단위 === '천원' ? Math.round(z.금액 / 1000) : z.금액) : '', 시작: z.시작글, 끝: z.끝글 }))
    set공종([{ ...빈줄(0), 이름: '공사' }, ...줄])
    if (m.공사명 && !공사명) set공사명(m.공사명)
    if (m.착공) set착공(m.착공)
    if (m.준공) set준공(m.준공)
    set알림('📊 막대형에 적어 둔 공종 ' + 줄.length + '가지를 당초로 가져왔습니다' + (단위 === '천원' ? ' (금액은 천원으로 바꿈)' : '') + '. 바뀐 것만 변경 칸에 적으십시오.')
  }
  const 자동 = () => {
    if (!착공 || !준공) { set알림('착공일과 당초 준공일을 먼저 적어 주십시오.'); return }
    /* 1 공종은 착공~준공에 계단처럼, 그 아래 1.1 세부는 부모 기간 안에서 다시 계단처럼 (◈ 대공종은 아래 합이라 비워 둠) */
    const a = 공종.map((r) => ({ ...r }))
    const 놓기 = (목록, s, e) => {
      const 놓음 = 자동배치(목록.map((i) => ({ 이름: a[i].이름, 금액: a[i].금액 })), s, e)
      목록.forEach((i, k) => { const t = 날번(놓음[k].시작), d = +놓음[k].기간; if (t !== null && d > 0) { a[i].시작 = 놓음[k].시작; a[i].끝 = 번날(t + d - 1) } })
    }
    const 일들 = a.map((r, i) => i).filter((i) => a[i].깊이 === 1)
    if (!일들.length) { set알림('«1 공종» 줄이 없습니다 — 단계를 «1 공종» 으로 고른 줄을 놓습니다.'); return }
    놓기(일들, 착공, 준공)
    for (const p of 일들) {
      const 아이 = []
      for (let j = p + 1; j < a.length && a[j].깊이 > 1; j++) 아이.push(j)
      if (아이.length) 놓기(아이, a[p].시작, a[p].끝)
    }
    for (const r of a) if (r.깊이 === 0) { r.시작 = ''; r.끝 = '' }
    set공종(a)
    set알림('🪄 당초 기간을 적은 차례대로 계단처럼 놓았습니다(세부는 공종 기간 안에서) — 짐작일 뿐이니 공종마다 고쳐 쓰십시오.')
  }

  const 합 = R.합
  const 표 = (쪽) => <변경공정그림 R={R} 공사명={공사명} 제목말={제목말} 착공={착공} 준공={준공} 변준공={변준공} 단위={단위} 상호={상호} 쪽={쪽} />
  const 쪽들 = useMemo(() => 쪽나누기(R, 용지), [R, 용지])
  const 아이있음 = (i) => { const d = 공종[i].깊이; const 다음 = 공종[i + 1]; return 다음 && 다음.깊이 > d }
  const 셈줄 = (i) => R.줄.find((z) => z.i === i)

  return (
    <>
      <div className="kt-h">① 공사 · 기간</div>
      <div className="tl-grid">
        <Row label="공사명"><input value={공사명} onChange={(e) => set공사명(e.target.value)} placeholder="예: ○○지구 배수개선사업" /></Row>
        <Row label="제목 뒤 글" hint=" 예: 총괄 (변경) · 3차분 (변경)"><input value={제목말} onChange={(e) => set제목말(e.target.value)} placeholder={변경 ? '(변경)' : '비워도 됨'} /></Row>
        <Row label="착공일"><input type="date" value={착공} onChange={(e) => set착공(e.target.value)} /></Row>
        <Row label={변경 ? '당초 준공일' : '준공일'}><input type="date" value={준공} onChange={(e) => set준공(e.target.value)} /></Row>
        {변경 && <Row label="변경 준공일" hint=" 공기가 늘면"><input type="date" value={변준공} onChange={(e) => set변준공(e.target.value)} /></Row>}
        <Row label="간격">
          <select value={간격} onChange={(e) => set간격(e.target.value)}>
            <option value="월">월</option><option value="순">순 (상·중·하순)</option><option value="주">주 (착공일부터 7일)</option>
          </select>
        </Row>
        <Row label="금액 단위">
          <select value={단위} onChange={(e) => set단위(e.target.value)}><option value="천원">천원</option><option value="원">원</option></select>
        </Row>
        <Row label={변경 ? '당초 도급액' : '도급액'} hint=" 제경비 포함 · 비우면 제경비 0"><input inputMode="numeric" value={도급} onChange={(e) => set도급(숫자만(e.target.value))} placeholder={합 && 합.당 ? 쉼(합.당.순) : ''} /></Row>
        {변경 && <Row label="변경 도급액" hint=" 비우면 당초와 같음"><input inputMode="numeric" value={변도급} onChange={(e) => set변도급(숫자만(e.target.value))} placeholder={도급 ? 쉼(+도급) : ''} /></Row>}
        <Row label="상호 (선택)" hint=" 오른쪽 위에 찍힘"><input value={상호} onChange={(e) => set상호(e.target.value)} placeholder="비워도 됨" /></Row>
      </div>
      <label className="gp-chk"><input type="checkbox" checked={변경 !== false} onChange={(e) => set변경(e.target.checked)} /> <b>당초·변경 두 줄</b> <span className="muted">(끄면 한 줄짜리 금액형 예정공정표 — 착공 때 내는 것)</span></label>

      <div className="kt-h">② 공종 — ◈ 대공종 · 1 공종 · 1.1 세부 (적은 차례가 공정표의 차례)</div>
      <div className="kt-btns">
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 파일.current?.click()}>📥 내역서(엑셀)에서 공종·금액</button>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={공정표받기}>📊 막대형에 적은 것 가져오기</button>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={자동}>🪄 당초 기간 자동 배치</button>
        <input ref={파일} type="file" accept=".xlsx" className="sr-only" tabIndex={-1} onChange={(e) => { 내역받기(e.target.files && e.target.files[0]); e.target.value = '' }} />
      </div>
      {알림 && <div className="gp-say">{알림}</div>}
      <div className="gp-wrap">
        <table className="gp-edit gc-edit">
          <thead>
            <tr><th rowSpan={2}>#</th><th rowSpan={2}>단계</th><th rowSpan={2}>공종</th><th rowSpan={2}>수량</th><th rowSpan={2}>단위</th>
              <th colSpan={3} className="gc-당">{변경 ? '당초' : '금액 · 기간'}</th>{변경 && <th colSpan={3} className="gc-변">변경 <small>(비우면 당초와 같음)</small></th>}<th rowSpan={2} /></tr>
            <tr><th className="gc-당">금액({단위})</th><th className="gc-당">시작</th><th className="gc-당">끝</th>
              {변경 && <><th className="gc-변">금액</th><th className="gc-변">시작</th><th className="gc-변">끝</th></>}</tr>
          </thead>
          <tbody>
            {공종.map((r, i) => {
              const z = 셈줄(i)
              const 모음 = 아이있음(i)
              return (
                <tr key={i} className={'gc-d' + r.깊이 + (z && z.바뀜 ? ' 바뀜' : '')}>
                  <td className="n">{z ? z.번호 : ''}{i > 0 && <button type="button" className="gp-up" title="한 칸 위로" onClick={() => 올리기(i)}>▲</button>}</td>
                  <td><select value={r.깊이} onChange={(e) => 고침(i, '깊이', +e.target.value)} aria-label="단계">
                    <option value={0}>◈ 대공종</option><option value={1}>1 공종</option><option value={2}>1.1 세부</option></select></td>
                  <td><input value={r.이름} onChange={(e) => 고침(i, '이름', e.target.value)} placeholder={r.깊이 === 0 ? '예: 토목공사' : '예: 배수장공사'} /></td>
                  <td><input value={r.수량} onChange={(e) => 고침(i, '수량', e.target.value)} /></td>
                  <td><input value={r.단위} onChange={(e) => 고침(i, '단위', e.target.value)} /></td>
                  <td><input inputMode="numeric" value={r.금액} onChange={(e) => 고침(i, '금액', 숫자만(e.target.value))} placeholder={모음 ? '아래 합' : '0'} />{z && z.당 && z.당.금액 > 0 && <i className="gp-won">{쉼(z.당.금액)}{!r.금액 && 모음 ? ' (합)' : ''} · {퍼2(z.당.보할)}%</i>}</td>
                  <td><input type="date" value={r.시작} onChange={(e) => 고침(i, '시작', e.target.value)} title={모음 ? '비우면 아래 줄들의 기간' : ''} /></td>
                  <td><input type="date" value={r.끝} onChange={(e) => 고침(i, '끝', e.target.value)} /></td>
                  {변경 && <>
                    <td><input inputMode="numeric" value={r.변금액} onChange={(e) => 고침(i, '변금액', 숫자만(e.target.value))} placeholder={r.금액 ? 쉼(+r.금액) : 모음 ? '아래 합' : ''} />{z && z.변 && z.변.금액 > 0 && <i className="gp-won">{쉼(z.변.금액)} · {퍼2(z.변.보할)}%</i>}</td>
                    <td><input type="date" value={r.변시작} onChange={(e) => 고침(i, '변시작', e.target.value)} /></td>
                    <td><input type="date" value={r.변끝} onChange={(e) => 고침(i, '변끝', e.target.value)} /></td>
                  </>}
                  <td className="gc-act"><button type="button" className="gp-x gc-add" title="아래에 한 줄 끼우기" onClick={() => 끼우기(i)}>＋</button><button type="button" className="gp-x" title="이 줄 지우기" onClick={() => 빼기(i)}>✕</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="kt-btns">
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 더하기(1)}>＋ 공종</button>
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 더하기(2)}>＋ 세부</button>
        <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => 더하기(0)}>＋ ◈ 대공종</button>
      </div>
      <p className="tl-p muted gp-hint">
        아래 단계 줄을 거느린 줄(◈ 대공종 등)은 <b>금액을 비우면 아래 줄의 합</b>, <b>날을 비우면 아래 줄들의 기간</b>으로 그립니다.
        순공사비는 맨 위 단계 줄들의 합이고, <b>제경비 = 도급액 − 순공사비</b>를 달마다 순공사비와 같은 비율로 나눕니다.
        {변경 && <> 변경 칸은 <b>바뀐 것만</b> 적으십시오 — 비우면 당초와 같습니다(금액 0 = 변경에서 빠짐). 바뀐 줄은 노랗게 보입니다.</>}
      </p>

      {R.경고.length > 0 && <ul className="gp-warn">{R.경고.map((w, k) => <li key={k}>⚠️ {w}</li>)}</ul>}
      {합 && 합.당 && (
        <Out items={[
          { k: (변경 ? '당초 ' : '') + '순공사비 · 제경비 · 도급액', v: 쉼(합.당.순) + ' · ' + 쉼(합.당.제) + ' · ' + 쉼(합.당.도) + ' ' + 단위 },
          ...(합.변 ? [{ k: '변경 순공사비 · 제경비 · 도급액', v: 쉼(합.변.순) + ' · ' + 쉼(합.변.제) + ' · ' + 쉼(합.변.도) + ' ' + 단위 }] : []),
          ...(합.변 ? [{ k: '도급액 증감', v: (합.변.도 - 합.당.도 >= 0 ? '+' : '−') + 쉼(Math.abs(합.변.도 - 합.당.도)) + ' ' + 단위 + (합.당.도 > 0 ? ' (' + ((합.변.도 / 합.당.도 - 1) * 100).toFixed(2) + '%)' : '') }] : []),
        ]} />
      )}

      <div className="kt-h">③ 예정공정표{변경 ? ' (당초·변경)' : ''}</div>
      {R.칸.length && R.줄.length ? (
        <>
          <div className="kt-btns">
            <select value={용지} onChange={(e) => set용지(e.target.value)} aria-label="용지" style={{ width: 'auto' }}>
              <option value="A3">A3 가로</option><option value="A4">A4 가로</option>
            </select>
            <button type="button" className="btn" style={{ width: 'auto' }} onClick={인쇄}>🖨 인쇄 ({용지} 가로{쪽들.length > 1 ? ' · ' + 쪽들.length + '쪽' : ''})</button>
            <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => set맞춤((v) => !v)}>{맞춤 ? '🔍 실제 크기로' : '↔ 화면 너비에 맞춤'}</button>
          </div>
          <div className={'gp-sheetwrap gc-screen' + (맞춤 ? ' gc-fit' : '')}>{표(null)}</div>
          {인쇄중 && createPortal(<div id="gp-인쇄">{쪽들.map((쪽, k) => <div key={k} className={'gp-쪽 gc-쪽 ' + (용지 === 'A3' ? 'gc-a3' : 'gc-a4')}>{표(쪽)}</div>)}</div>, document.body)}
        </>
      ) : <p className="muted">착공·준공과 공종(이름·금액·기간)을 적으면 여기에 공정표가 그려집니다. 🧪 예시로 해 보기를 눌러 보십시오.</p>}
    </>
  )
}

/* ── 그리기 ────────────────────────────────────────── */
const 왼칸 = [['번호', 30], ['공종', 150], ['수량', 42], ['단위', 34], ['도급금액', 96], ['보할', 56]]
const 왼폭 = 왼칸.reduce((s, [, w]) => s + w, 0)
const 줄높이 = 30, 머리높이 = 104, 표머리 = 40, 오른축 = 34, 발높이 = 44
const 빨강 = '#d2141e', 검정 = '#111827'
function 칸폭(n) { return Math.max(46, Math.min(96, Math.round(1300 / Math.max(1, n)))) }

/** 인쇄 쪽 나누기 — 공종 덩이를 용지 비율에 맞춰 끊고, 마지막 쪽에 합계 줄 */
function 쪽나누기(R, 용지) {
  if (!R.칸.length) return []
  const cw = 칸폭(R.칸.length)
  const W = 왼폭 + R.칸.length * cw + 오른축
  const 쪽높이 = W * (210 / 297) * 0.97        // A3·A4 가로는 같은 비율(1:√2)
  const 덩 = (R.두줄 ? 2 : 1) * 줄높이
  const 합줄 = (R.두줄 ? 2 : 1) * 줄높이 * 3 + (R.두줄 ? 2 : 1) * 줄높이
  const 틀 = 머리높이 + 표머리 + 발높이
  const out = []
  let 지금 = [], h = 틀
  R.줄.forEach((z, k) => {
    if (h + 덩 > 쪽높이 && 지금.length) { out.push({ 줄: 지금, 합: false }); 지금 = []; h = 틀 }
    지금.push(k); h += 덩
  })
  if (h + 합줄 > 쪽높이 && 지금.length) { out.push({ 줄: 지금, 합: false }); 지금 = [] }
  out.push({ 줄: 지금, 합: true })
  return out.map((p, i) => ({ ...p, 번: i + 1, 모두: out.length }))
}

function 변경공정그림({ R, 공사명, 제목말, 착공, 준공, 변준공, 단위, 상호, 쪽 }) {
  const 칸 = R.칸, n = 칸.length
  const cw = 칸폭(n)
  const W = 왼폭 + n * cw + 오른축
  const 두 = R.두줄
  const 쪽줄 = 쪽 ? 쪽.줄.map((k) => R.줄[k]) : R.줄
  const 합보임 = !쪽 || 쪽.합
  const 한덩 = (두 ? 2 : 1) * 줄높이
  const 본위 = 머리높이 + 표머리
  const 합줄수 = 합보임 ? 4 : 0
  const 본높이 = 쪽줄.length * 한덩 + 합줄수 * 한덩
  const H = 본위 + 본높이 + 발높이
  const fs = Math.max(6.5, Math.min(9, (cw - 4) / 5.2))
  const 칸x = (k) => 왼폭 + k * cw
  const 날x = (d) => {
    if (d <= 칸[0].a) return 칸x(0)
    for (let k = 0; k < n; k++) { const c = 칸[k]; if (d <= c.b + 1) return 칸x(k) + cw * (d - c.a) / (c.b - c.a + 1) }
    return 칸x(n)
  }
  const 왼x = []; { let x = 0; for (const [, w] of 왼칸) { 왼x.push(x); x += w } }
  const els = []
  const T = (x, y, s, o = {}) => els.push(<text key={els.length} x={x} y={y} fontSize={o.fs || fs} textAnchor={o.a || 'middle'} fill={o.c || 검정} fontWeight={o.b ? 700 : 400} letterSpacing={o.ls || 0}>{s}</text>)
  const L = (x1, y1, x2, y2, o = {}) => els.push(<line key={els.length} x1={x1} y1={y1} x2={x2} y2={y2} stroke={o.c || '#9ca3af'} strokeWidth={o.w || 0.6} />)
  const Rc = (x, y, w, h, fill) => els.push(<rect key={els.length} x={x} y={y} width={w} height={h} fill={fill} />)

  // ── 머리
  T(W / 2, 34, '예 정 공 정 표 ' + (제목말 || (두 ? '(변경)' : '')), { fs: 22, b: true, ls: 3 })
  T(0, 66, '공 사 명 : ' + (공사명 || '—'), { fs: 11, a: 'start' })
  const 기간글 = (착공 ? 점날(착공) : '—') + ' ~ ' + (준공 ? 점날(준공) : '—') + (두 && 변준공 && 변준공 !== 준공 ? '  →  변경 ~ ' + 점날(변준공) : '')
  T(0, 84, '공사기간 : ' + 기간글, { fs: 11, a: 'start' })
  if (상호) T(W - 오른축, 66, '상 호 : ' + 상호, { fs: 11, a: 'end' })
  T(W - 오른축, 84, '(금액 단위 : ' + 단위 + ')' + (쪽 && 쪽.모두 > 1 ? '   ' + 쪽.번 + ' / ' + 쪽.모두 : ''), { fs: 10, a: 'end' })

  // ── 표 머리 (연도 · 칸)
  const y0 = 머리높이
  Rc(0, y0, 왼폭 + n * cw, 표머리, '#eef2f7')
  const 연 = []
  for (let k = 0; k < n; k++) { const e = 연[연.length - 1]; if (e && e.이름 === 칸[k].윗이름) e.b = k; else 연.push({ 이름: 칸[k].윗이름, a: k, b: k }) }
  연.forEach((g, j) => { Rc(칸x(g.a), y0, (g.b - g.a + 1) * cw, 표머리 / 2, j % 2 ? '#fde9dc' : '#dde7f5'); T((칸x(g.a) + 칸x(g.b + 1)) / 2, y0 + 14, /^\d{4}$/.test(g.이름) ? g.이름 + '년' : g.이름, { fs: 9.5, b: true }); L(칸x(g.a), y0, 칸x(g.a), y0 + 표머리) })
  칸.forEach((c, k) => T(칸x(k) + cw / 2, y0 + 34, c.이름, { fs: 9 }))
  L(왼폭, y0 + 표머리 / 2, 왼폭 + n * cw, y0 + 표머리 / 2)
  const 머리글 = ['', '공    종', '수 량', '단위', '도급금액', '보할(%)']
  왼칸.forEach(([, w], j) => { if (j === 0) return; T(j === 1 ? 왼x[2] / 2 : 왼x[j] + w / 2, y0 + 24, 머리글[j], { fs: 9.5, b: true }) })

  // ── 본문 줄
  const 쪽들 = (z) => (두 ? [['당', z.당, 빨강], ['변', z.변, 검정]] : [['당', z.당, 검정]])
  let y = 본위
  const 금칸 = (S, 합순) => {
    const 둥 = 맞춰반올림(S.칸값)
    return { 둥, 율: S.칸값.map((v) => (합순 > 0 ? v / 합순 : 0)) }
  }
  쪽줄.forEach((z) => {
    const 배경 = z.깊이 === 0 ? '#eaf4e3' : z.바뀜 && 두 ? '#fffbeb' : null
    if (배경) Rc(0, y, 왼폭 + n * cw, 한덩, 배경)
    // 이름 칸 (두 줄 걸침)
    T(왼칸[0][1] / 2, y + 한덩 / 2 + 3, z.번호, { fs: 9.5, b: z.깊이 === 0 })
    const 이름x = 왼x[1] + (z.깊이 === 2 ? 14 : 6)
    T(이름x, y + 한덩 / 2 + 3, z.이름 || '', { fs: z.깊이 === 2 ? 9 : 10, a: 'start', b: z.깊이 === 0 })
    쪽들(z).forEach(([키, S, 색], j) => {
      const yy = y + j * 줄높이
      const 합순 = 키 === '당' ? R.합.당.순 : R.합.변.순
      T(왼x[2] + 왼칸[2][1] / 2, yy + 19, String(z.수량 ?? ''), { c: 색, fs: 9 })
      T(왼x[3] + 왼칸[3][1] / 2, yy + 19, String(z.단위 ?? ''), { c: 색, fs: 9 })
      T(왼x[4] + 왼칸[4][1] - 4, yy + 19, S && S.금액 > 0 ? 쉼(S.금액) : (S && S.금액 === 0 && 키 === '변' && z.당.금액 > 0 ? '0' : ''), { c: 색, a: 'end', fs: 9.5 })
      T(왼x[5] + 왼칸[5][1] - 4, yy + 19, S && S.금액 > 0 ? 퍼2(S.보할) + '%' : '', { c: 색, a: 'end', fs: 9 })
      if (!S || !(S.금액 > 0)) return
      const { 둥, 율 } = 금칸(S, 합순)
      if (S.시작 !== null && S.끝 !== null) {
        const x1 = 날x(S.시작), x2 = 날x(S.끝 + 1)
        els.push(<rect key={els.length} x={x1} y={yy + 12} width={Math.max(1.5, x2 - x1)} height={4.6} fill={색} rx={1} />)
      }
      칸.forEach((c, k) => {
        if (!(둥[k] > 0) && !(S.칸값[k] > 0.5)) return
        T(칸x(k + 1) - 3, yy + 9.5, 퍼2(율[k]) + '%', { c: 색, a: 'end', fs: fs * 0.95 })
        T(칸x(k + 1) - 3, yy + 26, 쉼(둥[k]), { c: 색, a: 'end', fs: fs * 0.95 })
      })
    })
    if (두) L(왼x[2], y + 줄높이, 왼폭 + n * cw, y + 줄높이, { c: '#e5e7eb', w: 0.5 })
    L(0, y + 한덩, 왼폭 + n * cw, y + 한덩)
    y += 한덩
  })
  const 품목끝 = y

  // ── 합계 줄: 순공사비계 · 제경비 · 도급액 · 공정률(누계)
  if (합보임) {
    const 합들 = [['순공사비계', 'sun', '#e7edf6'], ['제경비', 'je', '#e7edf6'], ['도급액', 'do', '#fbe7da'], ['공정률 (누계)', 'nu', '#fff4d6']]
    합들.forEach(([이름, 종, 색배경]) => {
      Rc(0, y, 왼폭 + n * cw, 한덩, 색배경)
      T(왼칸[0][1] / 2, y + 한덩 / 2 + 3, 종 === 'nu' ? '' : '◈', { fs: 9.5 })
      T(왼x[1] + 왼칸[1][1] / 2, y + 한덩 / 2 + 3, 이름, { fs: 10, b: true })
      const 목록 = 두 ? [['당', R.합.당, 빨강], ['변', R.합.변, 검정]] : [['당', R.합.당, 검정]]
      목록.forEach(([, S, 색], j) => {
        const yy = y + j * 줄높이
        if (종 === 'nu') {
          T(왼x[4] + 왼칸[4][1] - 4, yy + 19, '100%', { c: 색, a: 'end', fs: 9 })
          칸.forEach((c, k) => {
            if (!(S.율칸[k] > 1e-9)) return
            T(칸x(k + 1) - 3, yy + 10, 퍼2(S.율칸[k]) + '%', { c: 색, a: 'end', fs: fs * 0.95 })
            T(칸x(k + 1) - 3, yy + 25, 퍼2(S.누계칸[k]) + '%', { c: 색, a: 'end', fs: fs * 0.95, b: true })
          })
          return
        }
        const 금 = 종 === 'sun' ? S.순 : 종 === 'je' ? S.제 : S.도
        const 보 = 종 === 'sun' ? S.순율 : 종 === 'je' ? S.제율 : 1
        const 칸값 = 종 === 'sun' ? S.순칸 : 종 === 'je' ? S.제칸 : S.도칸
        T(왼x[2] + 왼칸[2][1] / 2, yy + 19, '1', { c: 색, fs: 9 }); T(왼x[3] + 왼칸[3][1] / 2, yy + 19, '식', { c: 색, fs: 9 })
        T(왼x[4] + 왼칸[4][1] - 4, yy + 19, 쉼(금), { c: 색, a: 'end', fs: 9.5, b: 종 === 'do' })
        T(왼x[5] + 왼칸[5][1] - 4, yy + 19, 퍼2(보) + '%', { c: 색, a: 'end', fs: 9 })
        const 둥 = 맞춰반올림(칸값)
        칸.forEach((c, k) => {
          if (!(칸값[k] > 0.5)) return
          T(칸x(k + 1) - 3, yy + 10, 퍼2(S.율칸[k]) + '%', { c: 색, a: 'end', fs: fs * 0.95 })
          T(칸x(k + 1) - 3, yy + 25, 쉼(둥[k]), { c: 색, a: 'end', fs: fs * 0.95, b: 종 === 'do' })
        })
      })
      if (두) L(왼x[2], y + 줄높이, 왼폭 + n * cw, y + 줄높이, { c: '#d1d5db', w: 0.5 })
      L(0, y + 한덩, 왼폭 + n * cw, y + 한덩)
      y += 한덩
    })
  }
  const 표끝 = y

  // ── 세로선 · 테두리
  칸.forEach((c, k) => { if (k > 0) L(칸x(k), 본위 - 표머리 / 2, 칸x(k), 표끝, { c: '#cbd5e1', w: 0.5 }) })
  왼x.forEach((x, j) => { if (j > 1) L(x, 머리높이, x, 표끝) })
  L(왼칸[0][1], 본위, 왼칸[0][1], 표끝)
  L(왼폭, 머리높이, 왼폭, 표끝, { c: '#374151', w: 0.9 })
  L(0, 본위, 왼폭 + n * cw, 본위, { c: '#374151', w: 0.9 })
  els.push(<rect key={els.length} x={0} y={머리높이} width={왼폭 + n * cw} height={표끝 - 머리높이} fill="none" stroke="#111827" strokeWidth={1.1} />)

  // ── S커브 (본문 전체에 겹쳐) + 오른쪽 눈금
  const 곡위 = 본위 + 4, 곡아래 = 표끝 - 4
  if (곡아래 - 곡위 > 40 && R.합.당.순 > 0) {
    const yv = (v) => 곡아래 - v * (곡아래 - 곡위)
    const 선 = (S, 색) => {
      const 점 = [[칸x(0), yv(0)], ...칸.map((c, k) => [칸x(k + 1), yv(S.누계칸[k])])]
      els.push(<polyline key={els.length} points={점.map(([a, b]) => a.toFixed(1) + ',' + b.toFixed(1)).join(' ')} fill="none" stroke={색} strokeWidth={2.4} strokeLinejoin="round" opacity={0.92} />)
      점.slice(1).forEach(([a, b]) => els.push(<circle key={els.length} cx={a} cy={b} r={1.8} fill={색} />))
    }
    if (두) { 선(R.합.당, 빨강); 선(R.합.변, 검정) } else 선(R.합.당, '#1d4ed8')
    const ax = 왼폭 + n * cw + 5
    L(ax, 곡위, ax, 곡아래, { c: '#1e3a8a', w: 1.2 })
    for (let v = 0; v <= 100; v += 10) { const yy = yv(v / 100); L(ax, yy, ax + 4, yy, { c: '#1e3a8a', w: 0.8 }); T(ax + 7, yy + 3, String(v), { fs: 7.5, a: 'start', c: '#1e3a8a' }) }
    T(ax + 14, 곡위 - 5, '%', { fs: 7.5, c: '#1e3a8a' })
  }

  // ── 범례 · 주
  const fy = 표끝 + 16
  if (두) {
    L(0, fy - 3, 26, fy - 3, { c: 빨강, w: 3 }); T(30, fy, '당 초', { fs: 9.5, a: 'start', c: 빨강, b: true })
    L(80, fy - 3, 106, fy - 3, { c: 검정, w: 3 }); T(110, fy, '변 경', { fs: 9.5, a: 'start', b: true })
  }
  T(두 ? 160 : 0, fy, '막대 위 = 그 달 비율(순공사비 대비 %) · 막대 아래 = 그 달 금액 · 공종 금액은 기간에 날마다 고르게 나눔 · 제경비는 달마다 순공사비와 같은 비율 · 공정률 줄 아래 = 누계', { fs: 8.5, a: 'start', c: '#4b5563' })

  return (
    <svg className="gc-svg" viewBox={'-6 0 ' + (W + 12) + ' ' + H} width={W + 12} height={H} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="예정공정표">
      <rect x={-6} y={0} width={W + 12} height={H} fill="#fff" />
      {els}
    </svg>
  )
}

