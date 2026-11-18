/* 🆕 업그레이드 알리기 — 고친 도구 · 서식을 쓰는 분이 알게 (G757 · 2026-11-18)
 *
 *   소장님: 「우리가 고치잖아. 도구나 서식을 그럼. 업그레이드했다라고 알려야 하잖아. 도구이용자가 알 수 있게 해야 하는데…아이디어 줘」
 *           → 다섯 가지 중 권함 ① + ② + ④ → 「해줘」 · 고르심 «업그레이드 알리기»
 *
 *   ■ 자료는 한 곳 — web/public/fixes.json (꼴 · 셈은 lib/고친것셈.js)
 *     ① 그 화면 맨 위 «🆕 업그레이드» 띠(고친띠.jsx) — 14일 · ✕ 는 그때 있던 줄만 닫음(새로 고치면 다시 뜸)
 *     ② 도구 목록 · 서식 목록 · 마이컨맵 단축키에 «UP» 표 — 14일(고친띠.jsx 업표)
 *     ④ 하루 한 번 10시 폰 알림 «🛠 쓰시던 화면을 고쳤습니다»(G222 · functions/alertpack.js — 지난번 알림 «뒤» d 만)
 *   ■ 서버로 보내는 것 없음 · 닫음은 이 브라우저(localStorage)에만 · 📊 |업그레이드|보임 · |업그레이드|닫음 (숫자만 · 화면엔 안 보임)
 *   ■ 자료는 한 번만 받고(getJSON) 모든 띠 · 표가 나눠 씀. 지난번 받은 것(이 기기)을 먼저 써서 띠가 늦게 떠 화면이 밀리는 일을 줄임
 */
import { useEffect, useState } from 'react'
import { getJSON } from './data.js'
import { 요즘, 자료주소 } from './고친것셈.js'
/* ⚠️ 셈(이곳 · 닫기 등)은 쓰는 곳이 lib/고친것셈.js 에서 바로 부름 — 여기서 다시 내보내기(중괄호 꼴)를 하면
   tools/checkimports.py 가 «닫기 · 때» 같은 흔한 이름을 이 파일 것으로 알고 다른 화면 50곳을 잘못 잡음(11-18 리허설) */

const 남김열쇠 = 'kcm.upg.표'
/* 🩹 G767 판(빌드 도장 — lib/data.js 와 같은 곳)을 붙여 받음 → 올리면 바로 새 띠 · UP(전엔 브라우저 1시간 기억 때문에 최대 1시간 늦음) */
const 판 = (() => { try { return typeof window !== 'undefined' && typeof window.__KCM_BUILD__ === 'string' ? window.__KCM_BUILD__ : '' } catch (e) { return '' } })()
let 자료 = (() => { try { const v = JSON.parse(localStorage.getItem(남김열쇠) || 'null'); return v && Array.isArray(v.r) ? { r: v.r } : null } catch (e) { return null } })()
let 받음 = false
const 듣는이 = new Set()
function 받기() {
  if (받음) return
  받음 = true
  getJSON(자료주소(판)).then((j) => {
    if (!j || !Array.isArray(j.r)) return
    자료 = { r: j.r.slice(0, 60) }
    try { localStorage.setItem(남김열쇠, JSON.stringify(자료)) } catch (e) { /* 개인 창 · 가득 참 */ }
    for (const f of 듣는이) f()
  }).catch(() => {})
}
/** 요즘(14일 안) 고친 줄 — 새것부터 · 자료가 오면 다시 그림 */
export function use고친것() {
  const [, 다시] = useState(0)
  useEffect(() => {
    const f = () => 다시((n) => n + 1)
    듣는이.add(f)
    받기()
    return () => { 듣는이.delete(f) }
  }, [])
  return 요즘(자료)
}
