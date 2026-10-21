/* ==========================================================
   📋 간접공사비(제비율) 요율 찾기 — /tools/jebiyul (G350 · 2026-10-21)
   셈 · 표는 lib/제비율.js (표 = data/jebiyul.json — 조달청 원문 엑셀에서 옮김)
   ■ 화면 둘
     · Jebiyul         — 도구 화면(공고일 · 종류 · 업종 · 직접공사비 · 추정가격 · 공사기간 → 넷 + 어느 칸 · 앞 판 비교 · 법정 요율)
     · 요율불러오기    — 견적서(공공식) · 낙찰금액 맞추기(원가계산서 없는 파일)에 붙는 작은 칸 → «이 요율로 채우기»
   ■ 쓴 횟수: |제비율|찾기 · |제비율|채우기 · |제비율|복사 (숫자는 소장님만 — lib/받은수.jsx 세기)
   ========================================================== */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Row, Out, use칸 } from './calcs.jsx'
import 표 from '../data/jebiyul.json'
import { 기준넣기, 종류들, 찾기, 법정, 요약, 오늘, 일수 } from '../lib/제비율.js'
기준넣기(표)
const 기준 = 표
import { 세기 } from '../lib/받은수.jsx'

const 숫 = (v) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0 }
const 콤마 = (v) => { const n = 숫(v); return n > 0 ? Math.round(n).toLocaleString('ko-KR') : '' }
const 억 = (n) => (n >= 1e8 ? (Math.round(n / 1e6) / 100).toLocaleString('ko-KR') + '억' : Math.round(n).toLocaleString('ko-KR') + '원')
const 퍼 = (v) => (v == null ? '—' : v + '%')
const 원문주소 = (sn) => `https://pps.go.kr/kor/bbs/view.do?bbsSn=${sn}&key=00038`

/* 🔔 조달청 자료실 감시 결과(tools/기준감시.py → prerender 가 /data/jebi_watch.json 으로 구움) */
function use감시() {
  const [w, setW] = useState(null)
  useEffect(() => {
    let 끝 = false
    fetch('/data/jebi_watch.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (!끝) setW(j) }).catch(() => {})
    return () => { 끝 = true }
  }, [])
  return w
}

function 판줄({ r, 감시 }) {
  const p = r.판
  const 새것 = (감시 && Array.isArray(감시.새것)) ? 감시.새것 : []
  return (
    <div className="jb-pan">
      <div>📌 적용 기준: <b>조달청 {p.이름}</b>({p.적용}) · <a href={원문주소(p.글번호)} target="_blank" rel="noopener">원문 보기 ↗</a></div>
      <div className="muted sm">바뀐 것: {p.바뀐것}</div>
      <div className="muted sm">건설맵 확인 {기준.확인}{감시 && 감시.at ? ` · 조달청 자료실 마지막 확인 ${감시.at}` : ''}</div>
      {r.알림 && <div className="jb-warn">⚠️ {r.알림}</div>}
      {새것.length > 0 && (
        <div className="jb-new">
          📢 조달청 자료실에 <b>새 간접공사비 기준 글</b>이 올라왔습니다 — 건설맵에 아직 반영 전입니다.
          {새것.slice(0, 3).map((x) => (
            <div key={x.sn}>· {x.날 || ''} <a href={원문주소(x.sn)} target="_blank" rel="noopener">{x.제목 || '원문 보기'} ↗</a></div>
          ))}
          <div className="muted sm">그 글의 적용일 뒤 공고라면 원문 표로 확인해 주십시오. 확인되는 대로 새 판을 넣습니다.</div>
        </div>
      )}
    </div>
  )
}

/* 어느 칸에서 나왔는지 — 규모 × 기간 표(간접노무비 / 기타경비) */
function 칸표({ r, 무엇 }) {
  const T = r.표
  if (!T || !T.규모) return null
  const m = 무엇 === '간노' ? T.간노 : T.기타
  return (
    <div className="jb-tw">
      <table className="jb-t">
        <caption>{무엇 === '간노' ? '간접노무비 (직노) × 율' : '기타경비 (재 + 노) × 율'} — {r.종류이름}</caption>
        <thead><tr><th>직접공사비</th>{T.기간.map((x, j) => <th key={j} className={j === r.자리.기간 ? 'on' : ''}>{x[0].replace(/ \(.+\)/, '')}</th>)}</tr></thead>
        <tbody>
          {T.규모.map((g, i) => (
            <tr key={i} className={i === r.자리.규모 ? 'on' : ''}>
              <th>{g[0]}</th>
              {m[i].map((v, j) => <td key={j} className={i === r.자리.규모 && j === r.자리.기간 ? 'hit' : (i === r.자리.규모 || j === r.자리.기간 ? 'on' : '')}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 입력 칸 묶음 — 도구 화면과 작은 칸이 같이 씀 */
function 칸들({ v, set, 작게 }) {
  const 국가 = v.종류 === '국가유산'
  return (
    <>
      <Row label="공고일" hint="이 날 맞는 기준 판을 고릅니다">
        <input type="date" value={v.날} onChange={(e) => set('날', e.target.value)} />
      </Row>
      <Row label="공사 종류" hint="전기 · 통신 · 소방은 건축 또는 토목을 고르십시오(조달청 준용)">
        <select value={v.종류} onChange={(e) => set('종류', e.target.value)}>
          {종류들.map((x) => <option key={x.k} value={x.k}>{x.n}</option>)}
        </select>
      </Row>
      {!국가 && (
        <Row label="일반관리비 갈래" hint="원문 두 칸">
          <select value={v.업종} onChange={(e) => set('업종', e.target.value)}>
            <option value="종합">토목 · 조경 · 건축 · 산업설비(종합공사)</option>
            <option value="전문">전문 · 전기 · 통신 · 소방 · 기타</option>
          </select>
        </Row>
      )}
      <Row label="직접공사비" hint="원 · 재료비 + 직접노무비 + 경비 — 간접노무비 · 기타경비 규모">
        <input inputMode="numeric" value={콤마(v.직)} onChange={(e) => set('직', String(숫(e.target.value) || ''))} placeholder="850,000,000" />
      </Row>
      <Row label="추정가격" hint="원 · 부가세 뺀 공사비 — 일반관리비 · 이윤 규모">
        <input inputMode="numeric" value={콤마(v.추)} onChange={(e) => set('추', String(숫(e.target.value) || ''))} placeholder="1,200,000,000" />
      </Row>
      <Row label="공사기간" hint="일 · 착공부터 준공까지(첫날 · 끝날 포함)">
        <input inputMode="numeric" value={v.일 || ''} onChange={(e) => set('일', String(숫(e.target.value) || ''))} placeholder="240" />
      </Row>
      {!작게 && (
        <div className="jb-days">
          <span className="muted sm">날짜로 셈:</span>
          <input type="date" value={v.착 || ''} onChange={(e) => { set('착', e.target.value); const n = 일수(e.target.value, v.준); if (n) set('일', String(n)) }} aria-label="착공일" />
          <span className="muted sm">~</span>
          <input type="date" value={v.준 || ''} onChange={(e) => { set('준', e.target.value); const n = 일수(v.착, e.target.value); if (n) set('일', String(n)) }} aria-label="준공일" />
        </div>
      )}
    </>
  )
}

const 빈 = (ex = {}) => ({ 날: ex.날 || 오늘(), 종류: ex.종류 || '토목', 업종: ex.업종 || '종합', 직: ex.직 || '', 추: ex.추 || '', 일: ex.일 || '', 착: '', 준: '' })

export function Jebiyul({ ex = {} }) {
  const [v, setV] = use칸('v', () => (ex && ex.v ? { ...빈(), ...ex.v } : 빈()))
  const set = (k, x) => setV((o) => ({ ...(o || 빈()), [k]: x }))
  const w = v || 빈()
  const r = useMemo(() => 찾기({ 날: w.날, 종류: w.종류, 업종: w.업종, 직접공사비: 숫(w.직), 추정가격: 숫(w.추), 공사일수: 숫(w.일) }), [w.날, w.종류, w.업종, w.직, w.추, w.일])
  const 감시 = use감시()
  const 셌나 = useRef(false)
  useEffect(() => { if (!셌나.current && r.간노 != null && r.일관 != null) { 셌나.current = true; 세기('|제비율|찾기') } }, [r.간노, r.일관])
  const [복사됨, set복사됨] = useState(false)
  const 복사 = async () => {
    try { await navigator.clipboard.writeText(요약(r)); set복사됨(true); 세기('|제비율|복사'); setTimeout(() => set복사됨(false), 1800) } catch (e) { /* 막힘 */ }
  }
  const 차 = (a, b) => (a == null || b == null ? '' : (a - b >= 0 ? '+' : '') + (Math.round((a - b) * 10) / 10) + '%p')
  return (
    <div className="tool jb">
      <칸들 v={w} set={set} />
      <Out items={[
        { k: '간접노무비 — (직노) ×', v: 퍼(r.간노), big: true },
        { k: '기타경비 — (재 + 노) ×', v: 퍼(r.기타), big: true },
        { k: '일반관리비 — (재 + 노 + 경) ×', v: 퍼(r.일관), big: true },
        { k: '이윤 — (노 + 경 + 일) ×', v: 퍼(r.이윤), big: true },
      ]} />
      {r.빠짐.length > 0 && <div className="hint">넣을 것: <b>{r.빠짐.join(' · ')}</b> — 넣으면 나머지도 나옵니다.</div>}
      {r.간노 != null && (
        <div className="hint">
          {r.자리.규모 >= 0 && <>직접공사비 <b>{억(숫(w.직))}</b> → «{r.표.규모[r.자리.규모][0]}» · 공사기간 <b>{숫(w.일)}일</b> → «{r.표.기간[r.자리.기간][0]}»</>}
          {r.자리.일관규모 >= 0 && r.종류 !== '국가유산' && <> · 추정가격 <b>{억(숫(w.추))}</b> → «{기준.일관규모[r.자리.일관규모][0]}»</>}
          {r.앞 && r.앞.판 && <div>앞 판({r.앞.판.이름})으로는 간접노무비 {퍼(r.앞.간노)} · 기타경비 {퍼(r.앞.기타)} — 지금 판이 <b>{차(r.간노, r.앞.간노)} · {차(r.기타, r.앞.기타)}</b></div>}
        </div>
      )}
      {r.메모.map((x, i) => <div className="hint" key={i}>{x}</div>)}
      <div className="btn-row" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={복사} disabled={r.간노 == null}>{복사됨 ? '✓ 복사했습니다' : '📋 요율 한 줄 복사'}</button>
      </div>
      <판줄 r={r} 감시={감시} />
      <칸표 r={r} 무엇="간노" />
      <칸표 r={r} 무엇="기타" />
      <details className="jb-more">
        <summary>같은 판의 법정 요율 · 고용보험 등급 · 환경보전비</summary>
        <table className="jb-t sm">
          <tbody>
            {법정(r.판).map((x) => <tr key={x[0]}><th>{x[0]}</th><td>{x[1]} {x[2]}%</td><td className="muted sm">{x[3]}</td></tr>)}
          </tbody>
        </table>
        <table className="jb-t sm">
          <caption>고용보험료 (노) × 율 — 공사배정규모(추정금액) 등급</caption>
          <tbody>{기준.고용등급.map((x) => <tr key={x[0]}><th>{x[0]}</th><td>{x[1]}%</td></tr>)}</tbody>
        </table>
        <table className="jb-t sm">
          <caption>환경보전비 (직접공사비) × 율 — 전기 · 정보통신 · 소방 · 국가유산 수리는 빼고</caption>
          <tbody>{기준.환경.map((x) => <tr key={x[1]}><th>{x[0]}</th><td>{x[1]}</td><td>{x[2]}%</td></tr>)}</tbody>
        </table>
      </details>
      <div className="hint">{기준.근거말}</div>
    </div>
  )
}

/**
 * 📋 견적서 · 낙찰금액 맞추기에 붙는 작은 칸
 * @param 처음 { 직, 추, 일, 날, 종류 } — 아는 값(견적 셈 결과 등)
 * @param onApply (r) => void — r.간노 · r.기타 · r.일관 · r.이윤(%) · 요약
 */
export function 요율불러오기({ 처음 = {}, onApply, 글 = '이 요율로 채우기' }) {
  const [열림, set열림] = useState(false)
  const [v, setV] = useState(() => 빈({ ...처음 }))
  useEffect(() => { if (!열림) setV((o) => ({ ...o, 직: 처음.직 || o.직, 추: 처음.추 || o.추, 일: 처음.일 || o.일 })) }, [처음.직, 처음.추, 처음.일, 열림])   // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, x) => setV((o) => ({ ...o, [k]: x }))
  const r = useMemo(() => 찾기({ 날: v.날, 종류: v.종류, 업종: v.업종, 직접공사비: 숫(v.직), 추정가격: 숫(v.추), 공사일수: 숫(v.일) }), [v])
  const [됨, set됨] = useState('')
  if (!열림) {
    return (
      <div className="jb-mini">
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set열림(true)}>📋 조달청 기준 요율로 채우기</button>
        <span className="muted sm">간접노무비 · 기타경비 · 일반관리비 · 이윤 — 공사 종류 · 규모 · 기간 · 공고일로 (조달청 간접공사비 적용기준)</span>
        {됨 && <div className="jb-ok">✓ {됨}</div>}
      </div>
    )
  }
  const 다됨 = r.간노 != null && r.기타 != null && r.일관 != null && r.이윤 != null
  return (
    <div className="jb-mini open">
      <div className="jb-mini-h">📋 조달청 기준 요율 찾기 <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => set열림(false)}>닫기</button></div>
      <칸들 v={v} set={set} 작게 />
      <Out items={[
        { k: '간접노무비', v: 퍼(r.간노) }, { k: '기타경비', v: 퍼(r.기타) }, { k: '일반관리비', v: 퍼(r.일관) }, { k: '이윤', v: 퍼(r.이윤) },
      ]} />
      <div className="muted sm">{r.판.이름} · {r.종류이름}{r.빠짐.length ? ` · 넣을 것: ${r.빠짐.join(' · ')}` : ''}{r.메모.length ? ' · ' + r.메모[0] : ''}</div>
      <div className="btn-row" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!다됨}
                onClick={() => { onApply && onApply({ ...r, 요약: 요약(r) }); 세기('|제비율|채우기'); set됨(요약(r)); set열림(false) }}>{글}</button>
        <a className="btn ghost sm" style={{ width: 'auto' }} href="/tools/jebiyul" target="_blank" rel="noopener">표 전체 보기 ↗</a>
      </div>
    </div>
  )
}

export const 제비율EXAMPLES = {
  jebiyul: { 글: '토목 · 직접공사비 8억 5천만 · 추정가격 12억 · 240일 · 2026. 10. 21. 공고', ex: { v: { 날: '2026-10-21', 종류: '토목', 업종: '종합', 직: '850000000', 추: '1200000000', 일: '240', 착: '', 준: '' } } },
}
export const 제비율CALCS = { jebiyul: Jebiyul }
