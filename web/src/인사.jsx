/* 👋🙏 방문 인사 — 잠깐 떴다 사라지는 쪽지 (2026-09-29 · 9/30 하루 세 번) · 셈은 lib/인사.js
 *   소장님: 「첫 방문자에게 반갑습니다 … 재방문자에게는 다시 찾아줘서 고맙다」
 *   소장님(9/30): 「데스크탑에서는 안뜨는 거 같아 … 인사말은 오전, 오후, 저녁으로 해줘. 하루 3번」
 *   ■ 자리를 차지하지 않습니다(떠 있는 쪽지) — 글을 밀어내지 않고, 폰 5초 · 넓은 화면 8초 뒤 스스로 사라집니다. ✕ 로 바로 닫힘.
 *   ■ 폰에서는 아래 탭 막대 바로 위, 넓은 화면에서는 아래 가운데(조금 크게 — 넓은 화면에서 작게 떠 눈에 안 띄던 것).
 *   ■ 탭을 켜 둔 채 때가 바뀌면(오전 → 오후) 다음에 화면을 옮길 때 한 번 뜹니다.
 *   ■ 인쇄에는 안 나옵니다. 검색 로봇에게는 안 띄웁니다.
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 방문, 옮김, 로봇, 인사글, 열쇠, 탭열쇠 } from './lib/인사.js'

/* ⚠️ 사이트가 뜨기 «전» 에 세 둡니다 — 뜨고 나면 사이트가 지나온 길·로그인 같은 것을 스스로 적어서
      «이 기능 전부터 다녀가신 분» 인지 가릴 수 없게 됩니다. */
const 전에온흔적 = (() => {
  try {
    if (localStorage.getItem(열쇠)) return false
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k !== 'mockdb') return true }
    return false
  } catch (e) { return null }        // 못 읽으면(개인 창 막힘 등) 인사하지 않음
})()

const 읽기 = () => { try { return JSON.parse(localStorage.getItem(열쇠) || 'null') } catch (e) { return null } }
const 쓰기 = (v) => { try { localStorage.setItem(열쇠, JSON.stringify(v)); return true } catch (e) { return false } }
const 넓은화면 = () => { try { return window.matchMedia('(min-width: 900px)').matches } catch (e) { return false } }

export default function 인사() {
  const { pathname } = useLocation()
  const [보일, set보일] = useState(null)       // null | {종류:'처음'|'다시', 때: ms}
  const [닫는중, set닫는중] = useState(false)
  const [바닥, set바닥] = useState(16)
  const 셌나 = useRef(false)
  const 첫길 = useRef(true)

  const 띄우기 = (종류, 늦게 = 900) => setTimeout(() => {
    const tb = document.querySelector('.tabbar')
    const h = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().height : 0
    set바닥(Math.round(h) + 14)
    set닫는중(false)
    set보일({ 종류, 때: Date.now() })
  }, 늦게)

  /* 첫 한 번 — 방문 세기 */
  useEffect(() => {
    if (셌나.current) return undefined
    셌나.current = true
    if (전에온흔적 === null || 로봇(navigator.userAgent || '')) return undefined
    let 탭중 = false
    try { 탭중 = sessionStorage.getItem(탭열쇠) === '1'; sessionStorage.setItem(탭열쇠, '1') } catch (e) { 탭중 = true }
    const r = 방문(읽기(), Date.now(), { 탭중, 전에옴: 전에온흔적 })
    if (!쓰기(r.새) || !r.인사) return undefined
    const t = 띄우기(r.인사)
    return () => clearTimeout(t)
  }, [])

  /* 화면을 옮길 때마다 «마지막으로 본 때» 를 적고, 켜 둔 채 때가 바뀌었으면(오전 → 오후) 한 번 인사 */
  useEffect(() => {
    if (첫길.current) { 첫길.current = false; return undefined }
    if (전에온흔적 === null || 로봇(navigator.userAgent || '')) return undefined
    const r = 옮김(읽기(), Date.now())
    if (!r.새 || !쓰기(r.새) || !r.인사) return undefined
    const t = 띄우기(r.인사, 600)
    return () => clearTimeout(t)
  }, [pathname])

  /* 폰 5초 · 넓은 화면 8초 뒤 스스로 */
  useEffect(() => {
    if (!보일) return undefined
    const 길이 = 넓은화면() ? 8000 : 5000
    const a = setTimeout(() => set닫는중(true), 길이)
    const b = setTimeout(() => set보일(null), 길이 + 500)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [보일])

  if (!보일) return null
  const g = 인사글(보일.종류, 보일.때)
  return (
    <div className={'insa' + (닫는중 ? ' out' : '') + (보일.종류 === '처음' ? ' first' : '')} role="status" aria-live="polite" style={{ bottom: 바닥 }}>
      <div className="insa-t">
        <b>{g.큰}</b>
        <span>{g.작은}</span>
      </div>
      <button className="insa-x" onClick={() => set보일(null)} aria-label="닫기">✕</button>
    </div>
  )
}
