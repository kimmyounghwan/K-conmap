/**
 * 👷 노무 자료 — 신고 정리 · 퇴직공제 · 보험료 계산기가 «같은 출역» 을 읽는 다리 (G116 · 2026-10-02)
 *
 *  · 기본: 👷 노무비 계산기 자료(이 브라우저 localStorage 'kcm_nomubi1') — 🔗 이어 쓰기 코드(ns 'nm')로 폰에서 적은 것도 받음
 *  · 🏗 현장 투입비에서 «신고 정리로 보내기» 를 누르면 그 현장 출역(sessionStorage 'kcm_singo_from')
 *  · 이 화면들은 출역을 고치지 않습니다(읽기만). 다른 창에서 노무비 계산기를 고치면 저절로 다시 읽음(storage 사건 · 창 돌아올 때).
 *  · 🔁 일의 연속성(소장님 「일의 연속성도 고려 해 주고..」 → A~D 모두):
 *    세 화면의 설정 · 기록은 노무비 자료 «안에» 둡니다 — sg(신고 정리: 지급월 · 반기 · ✓ 했음) · tj(퇴직공제: 공고일 · 계상 · 뺌 · 낸 금액) · bh(보험료: 입력 · 해마다 낸 것)
 *    → 노무비 «🔗 코드» 하나로 폰 · PC 어디서든 같이 이어집니다(서버 규칙 그대로).
 *    투입비에서 넘겨받은 현장은 이 브라우저에만(localStorage 'kcm_tp_{키}' · 현장 이름별).
 *    쓸 때는 «지금 저장된 것» 을 다시 읽어 그 칸만 바꿔 넣습니다 — 다른 창의 출역을 덮지 않게.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 현장목록, 현장목록쓰기, 현장목록열쇠, 현장연결자리, 현장이름, 읽기현장, 쓰기현장 } from '../lib/nomubi.js'   /* 🏗 G178 현장별 — 노무비 계산기에서 고른 현장 */
import { 넘김읽기, 넘김지우기 } from '../lib/신고정리.js'
import 이어쓰기 from './이어쓰기.jsx'

const 로컬열쇠 = (키) => `kcm_tp_${키}`
function 로컬읽기(키, 현장) { try { return ((JSON.parse(localStorage.getItem(로컬열쇠(키)) || '{}') || {})[현장 || '']) || null } catch (e) { return null } }
function 로컬쓰기(키, 현장, v) { try { const 모두 = JSON.parse(localStorage.getItem(로컬열쇠(키)) || '{}') || {}; 모두[현장 || ''] = v; localStorage.setItem(로컬열쇠(키), JSON.stringify(모두)) } catch (e) { /* 막힘 */ } }

export function use노무자료() {
  const [넘김, set넘김] = useState(() => 넘김읽기())
  /* 🏗 G178 — 현장(노무비 계산기에서 고른 현장)과 그 자료를 같이 들고 있음. 쓸 때도 이 현장에만(다른 창이 현장을 바꿔도 섞이지 않게) */
  const [현장, set현장] = useState(() => 현장목록().cur)
  const [st, setSt] = useState(() => 읽기현장(현장목록().cur))
  const [판, set판] = useState(0)
  const 현장r = useRef(현장)
  현장r.current = 현장
  /* 🔗 이어 쓰기가 받아 온 것은 «그 현장을 아직 보고 있을 때만» 화면에 — 현장을 바꾼 뒤 늦게 끝난 받기가 섞이지 않게 */
  const st받기 = (id) => (v) => { if (현장r.current === id) setSt(v) }
  useEffect(() => {
    const 다시 = () => { const c = 현장목록().cur; set현장(c); setSt(읽기현장(c)) }
    const 사건 = (e) => { if (!e.key || e.key === 현장목록열쇠 || e.key.startsWith('kcm_nomubi1')) 다시() }
    const 보임 = () => { if (document.visibilityState === 'visible') 다시() }
    window.addEventListener('storage', 사건)
    document.addEventListener('visibilitychange', 보임)
    return () => { window.removeEventListener('storage', 사건); document.removeEventListener('visibilitychange', 보임) }
  }, [])
  const 노무비로 = () => { 넘김지우기(); set넘김(null); const c = 현장목록().cur; set현장(c); setSt(읽기현장(c)) }
  const 현장고르기 = (id) => { const m = 현장목록(); if (!m.L.some((x) => x.id === id && !x.del)) return; 현장목록쓰기({ ...m, cur: id }); set현장(id); setSt(읽기현장(id)) }
  const 자료 = 넘김 || st
  /** 🔁 설정 · 기록 — 노무비 자료 안(sg · tj · bh) 또는 투입비 현장이면 이 브라우저 */
  const 기록 = (키) => (넘김 ? 로컬읽기(키, 넘김.site) : (st && st[키]) || null)
  const 기록쓰기 = (키, v) => {
    if (넘김) { 로컬쓰기(키, 넘김.site, v); set판((x) => x + 1); return }
    const 지금 = 읽기현장(현장)
    const 새 = { ...지금, [키]: v }
    쓰기현장(현장, 새)
    setSt(새)
  }
  return { 자료, 출처: 넘김 ? 'tp' : 'nm', 넘김, st, setSt, 노무비로, 기록, 기록쓰기, 판, 현장, 현장고르기, st받기 }
}

const 시각 = (t) => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

/** 맨 위 «어느 자료로 셈하나» 한 줄 + (노무비 계산기면) 🔗 이어 쓰기 */
export function 노무자료줄({ 노 }) {
  const { 출처, 넘김, st, 노무비로, 현장, 현장고르기, st받기 } = 노
  const 목록 = 현장목록()
  const 산 = 목록.L.filter((x) => !x.del)
  if (출처 === 'tp') {
    return (
      <div className="hm-src">
        <div>🏗 <b>현장 투입비 «{넘김.site || '현장'}»</b> 출역으로 셉니다 <span className="muted">— {시각(넘김.at)}에 넘겨받음 · 출역을 고치려면 투입비에서 고친 뒤 다시 «보내기»</span></div>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={노무비로}>👷 노무비 계산기 자료로 바꾸기</button>
      </div>
    )
  }
  return (
    <div className="hm-src">
      <div>👷 <b>노무비 계산기</b>에 적은 명단 · 출역으로 셉니다{st.site ? <> — <b>{st.site}</b></> : null}
        {' '}<span className="muted">(이 화면에서는 고치지 않습니다 · 고칠 때는 <Link to="/tools/nomubi">노무비 계산기</Link>에서)</span></div>
      {산.length > 1 && (
        <div className="nm-sites-row" style={{ marginTop: 6 }}>
          <b className="nm-sites-h">🏗 현장</b>
          <select className="inp nm-site-sel" value={현장} onChange={(e) => 현장고르기(e.target.value)} aria-label="현장 고르기">
            {산.map((x) => <option key={x.id} value={x.id}>{현장이름(x, 목록.L.indexOf(x))}</option>)}
          </select>
          <span className="muted">노무비 계산기의 현장 목록과 같습니다</span>
        </div>
      )}
      <이어쓰기 key={현장} ns="nm" 자리={현장연결자리(현장)} 이름="일용 노무비" 파일="노무비" st={st} setSt={st받기(현장)}
        읽기={() => 읽기현장(현장)} 쓰기={(x) => 쓰기현장(현장, x)} />
    </div>
  )
}

/** 출역이 하나도 없을 때 */
export function 출역없음({ 무엇 }) {
  return (
    <div className="card">
      <div className="note">
        아직 셀 출역이 없습니다. {무엇}은(는) 따로 적지 않고 <b>👷 노무비 계산기</b>(또는 🏗 현장 투입비)에 적은 출역을 그대로 씁니다.
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Link className="btn sm" style={{ width: 'auto' }} to="/tools/nomubi">👷 노무비 계산기에서 출역 적기 (예시로 둘러보기도)</Link>
          <Link className="btn line sm" style={{ width: 'auto' }} to="/tools/tuipbi">🏗 현장 투입비</Link>
        </div>
        <div className="muted" style={{ marginTop: 8, fontSize: 12.5 }}>폰에서 적은 노무비가 있으면 위 «🔗 코드로 열기» 에 그 코드와 비밀번호를 넣으십시오.</div>
      </div>
    </div>
  )
}
