/* 🔔 사랑방 답글 알림 — 맨 위 막대의 종 · 본문 맨 위 띠 (2026-09-30, G73) · 셈은 lib/알림.js
 *   소장님: 「답글이 달렸다는 걸 알게 해줘 … 그래야 또 들어와서 확인하지」 · 「사이트 안, 폰 알림창도 뜨게 해줘」
 *   ■ 사랑방에 글 · 답글을 쓴 적이 있는 브라우저만 읽습니다(화면을 열 때 한 번 · 사랑방에 들어올 때 · 창으로 돌아올 때 5분에 한 번).
 *   ■ 안 본 답글이 있을 때만 종(🔔 N)이 보이고, 본문 맨 위에 한 줄 띠가 뜹니다. 누르면 그 글로 가고 «봤음».
 *   ■ 그 글(/qna/{글번호})을 열면 그 글의 알림은 저절로 «봤음».
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 켤까닭, 알림읽기, 봤음, 알림글 } from './lib/알림.js'
import { 알림꺼짐, 알림끄기 } from './lib/저절로알림.js'   /* 🔕 G222 */
import { 조건알림켜짐 } from './lib/관심알림.js'

/* ── 둘(종 · 띠)이 같이 쓰는 작은 저장소 ── */
const 곳 = { 목록: [], 읽음: 0 }
const 듣는이 = new Set()
const 알리기 = () => 듣는이.forEach((f) => f({ ...곳 }))
let 읽는중 = null
async function 새로읽기(늦어도 = 0) {
  if (!켤까닭()) return
  if (읽는중) return 읽는중
  if (Date.now() - 곳.읽음 < 늦어도) return
  읽는중 = (async () => {
    try { 곳.목록 = await 알림읽기() } catch (e) { /* 조용히 */ }
    곳.읽음 = Date.now()
    알리기()
  })().finally(() => { 읽는중 = null })
  return 읽는중
}
async function 봤다(항목들) {
  const 새 = 항목들.filter((x) => !x.seen)
  if (!새.length) return
  const 열쇠 = new Set(새.map((x) => x.r + '/' + x.id))
  곳.목록 = 곳.목록.map((x) => (열쇠.has(x.r + '/' + x.id) ? { ...x, seen: true } : x))
  알리기()
  await 봤음(새)
}

function use알림() {
  const [s, set] = useState({ ...곳 })
  const { pathname } = useLocation()
  useEffect(() => {
    듣는이.add(set)
    새로읽기()
    const 돌아옴 = () => { if (document.visibilityState === 'visible') 새로읽기(5 * 60 * 1000) }
    document.addEventListener('visibilitychange', 돌아옴)
    return () => { 듣는이.delete(set); document.removeEventListener('visibilitychange', 돌아옴) }
  }, [])
  /* 사랑방에 들어오면 한 번 더(1분에 한 번까지) · 그 글을 열면 그 글의 알림은 «봤음» */
  useEffect(() => {
    if (!pathname.startsWith('/qna')) return
    const m = pathname.match(/^\/qna\/([^/]+)/)
    ;(async () => {
      await 새로읽기(60 * 1000)
      if (m) await 봤다(곳.목록.filter((x) => x.q === decodeURIComponent(m[1])))
    })()
  }, [pathname])
  return s
}

const 몇전 = (at) => {
  const m = Math.max(0, Math.round((Date.now() - (at || 0)) / 60000))
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.round(h / 24)}일 전`
}

/* 🔕 G222 — 신청하지 않은 분께 가는 «하루 한 번(오전 10시)» 끄기 · 다시 켜기. 조건을 안 고른 분도 끌 수 있게 종 안에 둡니다
   (소장님 「너무 알림이 많이 가면 짜증이 날 수도 있어. 알지??」 · 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번」)
   내 조건 알림을 신청한 분은 이 줄이 안 보입니다(신청은 내 조건 줄 «🔔 새 공고 알림 받는 중» 으로 끔 — 하던 대로) */
function 알림끄기줄() {
  const [꺼짐, set꺼짐] = useState(알림꺼짐)
  if (조건알림켜짐()) return null
  return (
    <div className="noti-ph" style={{ borderTop: '1px solid var(--line)', borderBottom: 0 }}>
      <span className="muted" style={{ fontSize: 12.5 }}>{꺼짐 ? '하루 한 번 공고 소식이 꺼져 있습니다' : '공고 소식 — 하루 한 번(오전 10시)'}</span>
      <button className="noti-all" data-no-ask="1" onClick={() => { const 끔 = !꺼짐; 알림끄기(끔).catch(() => {}); set꺼짐(끔) }}>
        {꺼짐 ? '🔔 다시 켜기' : '🔕 끄기'}
      </button>
    </div>
  )
}

/** 맨 위 막대의 종 — 안 본 답글이 있을 때만 보입니다 */
export function 알림종() {
  const s = use알림()
  const nav = useNavigate()
  const [열림, set열림] = useState(false)
  const 칸 = useRef(null)
  const 안본 = s.목록.filter((x) => !x.seen)
  useEffect(() => {
    if (!열림) return undefined
    const 밖 = (e) => { if (칸.current && !칸.current.contains(e.target)) set열림(false) }
    document.addEventListener('pointerdown', 밖)
    return () => document.removeEventListener('pointerdown', 밖)
  }, [열림])
  if (!안본.length && !열림) return null
  return (
    <div className="noti-bell" ref={칸}>
      <button className="notibtn" onClick={() => set열림((v) => !v)} aria-label={`새 알림 ${안본.length}개`} title="새 알림 — 맵톡 답글 · 담은 공고 1순위 · 내 조건 새 공고">
        🔔{안본.length > 0 && <span className="noti-n">{안본.length > 9 ? '9+' : 안본.length}</span>}
      </button>
      {열림 && (
        <div className="noti-pop" role="dialog" aria-label="새 알림">
          <div className="noti-ph"><b>🔔 알림</b>
            {안본.length > 0 && <button className="noti-all" onClick={() => 봤다(s.목록)}>모두 읽음</button>}
          </div>
          {s.목록.slice(0, 10).map((x) => (
            <button key={x.r + x.id} className={'noti-it' + (x.seen ? ' seen' : '')}
              onClick={() => { set열림(false); 봤다(s.목록.filter((y) => (x.q ? y.q === x.q : y.id === x.id))); nav(x.u || `/qna/${encodeURIComponent(x.q)}${x.to ? '#' + encodeURIComponent(x.id) : ''}`) }}>
              <span className="noti-t">{알림글(x)}</span>
              <span className="noti-w">{몇전(x.at)}</span>
            </button>
          ))}
          {!s.목록.length && <div className="noti-empty muted">새 알림이 없습니다.</div>}
          <알림끄기줄 />
        </div>
      )}
    </div>
  )
}

/** 본문 맨 위 한 줄 띠 — 안 본 답글이 있으면. ✕ 로 닫으면 이 창(탭)에서는 그 알림을 다시 안 띄웁니다 */
export function 알림띠() {
  const s = use알림()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [닫은, set닫은] = useState(() => { try { return sessionStorage.getItem('kcm_noti_band') || '' } catch (e) { return '' } })
  const 안본 = s.목록.filter((x) => !x.seen)
  if (!안본.length) return null
  const 첫 = 안본[0]
  if (닫은 === 첫.r + '/' + 첫.id) return null
  if (첫.q && pathname === `/qna/${encodeURIComponent(첫.q)}`) return null
  const 닫기 = () => { const k = 첫.r + '/' + 첫.id; set닫은(k); try { sessionStorage.setItem('kcm_noti_band', k) } catch (e) { /* 없음 */ } }
  return (
    <div className="noti-band" role="status">
      <span className="noti-dot" />
      <button className="noti-go" onClick={() => { 봤다(안본.filter((y) => (첫.q ? y.q === 첫.q : y.id === 첫.id))); nav(첫.u || `/qna/${encodeURIComponent(첫.q)}${첫.to ? '#' + encodeURIComponent(첫.id) : ''}`) }}>
        <b>🔔 {알림글(첫)}</b>{안본.length > 1 && <span className="muted"> · 외 {안본.length - 1}건</span>}
        <span className="noti-see">보기 ▸</span>
      </button>
      <button className="noti-x" onClick={닫기} aria-label="닫기">✕</button>
    </div>
  )
}
