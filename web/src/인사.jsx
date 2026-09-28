/* 👋🙏 방문 인사 — 잠깐 떴다 사라지는 쪽지 (2026-09-29) · 셈은 lib/인사.js
 *   소장님: 「첫 방문자에게 반갑습니다 … 재방문자에게는 다시 찾아줘서 고맙다」
 *   ■ 자리를 차지하지 않습니다(떠 있는 쪽지) — 글을 밀어내지 않고, 5초 뒤 스스로 사라집니다. ✕ 로 바로 닫힘.
 *   ■ 폰에서는 아래 탭 막대 바로 위, 넓은 화면에서는 아래 가운데.
 *   ■ 인쇄에는 안 나옵니다. 검색 로봇에게는 안 띄웁니다.
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 방문, 로봇, 글, 열쇠, 탭열쇠 } from './lib/인사.js'

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

export default function 인사() {
  const { pathname } = useLocation()
  const [보일, set보일] = useState(null)       // null | '처음' | '다시'
  const [닫는중, set닫는중] = useState(false)
  const [바닥, set바닥] = useState(16)
  const 셌나 = useRef(false)

  /* 첫 한 번 — 방문 세기 */
  useEffect(() => {
    if (셌나.current) return
    셌나.current = true
    if (전에온흔적 === null || 로봇(navigator.userAgent || '')) return
    let 탭중 = false
    try { 탭중 = sessionStorage.getItem(탭열쇠) === '1'; sessionStorage.setItem(탭열쇠, '1') } catch (e) { 탭중 = true }
    const r = 방문(읽기(), Date.now(), { 탭중, 전에옴: 전에온흔적 })
    if (!쓰기(r.새) || !r.인사) return
    const t = setTimeout(() => {
      const tb = document.querySelector('.tabbar')
      const h = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().height : 0
      set바닥(Math.round(h) + 14)
      set보일(r.인사)
    }, 900)
    return () => clearTimeout(t)
  }, [])

  /* 화면을 옮길 때마다 «마지막으로 본 때» 를 적습니다 — 오래 보고 계신 분을 «30분 쉬었다 온 분» 으로 세지 않게 */
  useEffect(() => {
    const v = 읽기()
    if (v && v.n) 쓰기({ ...v, last: Date.now() })
  }, [pathname])

  /* 5초 뒤 스스로 */
  useEffect(() => {
    if (!보일) return undefined
    const a = setTimeout(() => set닫는중(true), 5000)
    const b = setTimeout(() => set보일(null), 5500)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [보일])

  if (!보일) return null
  const g = 글[보일]
  return (
    <div className={'insa' + (닫는중 ? ' out' : '') + (보일 === '처음' ? ' first' : '')} role="status" aria-live="polite" style={{ bottom: 바닥 }}>
      <div className="insa-t">
        <b>{g.큰}</b>
        <span>{g.작은}</span>
      </div>
      <button className="insa-x" onClick={() => set보일(null)} aria-label="닫기">✕</button>
    </div>
  )
}
