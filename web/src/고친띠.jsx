/* 🆕 «업그레이드» 띠 · «UP» 표 (G757 · 2026-11-18) — 자료 · 셈은 lib/고친것.js (web/public/fixes.json 한 곳)
 *   ■ 띠: 고친 도구 · 서식 화면 맨 위 한 줄(길 줄 Crumbs 바로 아래 · 씀-앞 «밖» 이라 도구 «써 본 횟수» 로 안 셈)
 *         «🆕 업그레이드 · 11. 17. 무엇이 좋아졌나» + ✕ · 14일 · 로봇 · 인쇄(noti-band)엔 없음
 *   ■ 표: 목록 카드 · 단축키에 작은 «UP» — <업표 to="/tools/…" />
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { use고친것 } from './lib/고친것.js'
import { 이곳, 닫았나, 닫기 } from './lib/고친것셈.js'
import { 로봇 as 로봇글 } from './lib/인사.js'
import { 세기 } from './lib/받은수.jsx'

const 로봇 = () => { try { return 로봇글(navigator.userAgent || '') } catch (e) { return false } }
const 날짜 = (x) => { const m = String(x && x.d).match(/^\d{4}-(\d{2})-(\d{2})/); return m ? `${+m[1]}. ${+m[2]}.` : '' }
const 센것 = new Set()   // 이 탭에서 «보임» 은 줄마다 한 번만

export default function 고친띠() {
  const { pathname } = useLocation()
  const 요 = use고친것()
  const [, 다시] = useState(0)
  const 줄들 = 이곳(요, pathname)
  const 맨 = 줄들[0]
  const 보임 = !!맨 && !닫았나(줄들) && !로봇()
  const 열쇠 = 맨 ? `${맨.p}|${맨.d}` : ''
  useEffect(() => {
    if (!보임 || 센것.has(열쇠)) return
    센것.add(열쇠)
    세기('|업그레이드|보임')
  }, [보임, 열쇠])
  if (!보임) return null
  return (
    <div className="noti-band upg" role="status">
      <span className="upg-tag">🆕 업그레이드</span>
      <span className="upg-t">
        <b>{날짜(맨)}</b> {맨.m}
        {줄들.length > 1 && <em className="upg-more" title={줄들.slice(1).map((x) => `${날짜(x)} ${x.m}`).join('\n')}> · 그 전에도 {줄들.length - 1}번</em>}
      </span>
      <button type="button" className="noti-x" onClick={() => { 닫기(줄들); 세기('|업그레이드|닫음'); 다시((n) => n + 1) }} aria-label="업그레이드 알림 닫기">✕</button>
    </div>
  )
}

/** 작은 «UP» 표 — 14일 안에 좋아진 칸이면 · 목록 카드 · 단축키에 */
export function 업표({ to, className = '' }) {
  const 요 = use고친것()
  if (!to || !요.some((x) => x.p === to)) return null
  return <em className={'tlx-new up-b' + (className ? ' ' + className : '')} title="2주 안에 좋아졌어요">UP</em>
}
