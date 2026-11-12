/* 📱 G661 (2026-11-13) 아이폰 «아래 탭이 화면 가운데에 떠 있음» 바로잡기
 *   소장님 11-13 06:25 폰 캡처 + 「빨리 고쳐 줘」 「갑자기 왜 이런거지? 탭이」 「뭔지 알지 고쳐야 할거?」
 *   ■ 무엇: 아이폰(특히 홈 화면에 둔 건설맵 · iOS 26~27)에서 글자판(키보드)을 닫은 뒤에도 화면 기준점
 *     (visualViewport.offsetTop)이 키보드 높이(≈340px)만큼 어긋난 채 남는 아이폰 쪽 오류(WebKit 297779 · Apple 포럼 800125 —
 *     애플이 아직 못 고침). 떠 있는 것(position: fixed)과 붙는 것(sticky)이 그만큼 위로 밀림 →
 *     아래 탭(.tabbar) · «+» 단추가 키보드 위 자리(화면 가운데)에 떠 있고, 늘 보여야 할 맨 위 머리줄(.topbar)은 화면 위로 밀려 안 보임.
 *   ■ 어떻게: ① 글을 쓰는 중이 아니고(입력칸에 커서 없음) ② 손가락으로 키운 화면이 아니고 ③ 키보드가 다 내려갔는데(보이는 높이가 돌아옴)
 *     offsetTop 이 40px 이상 0.5초 넘게 남아 있으면 → <html class="vv-fix" style="--vv-dy:…px"> → styles.css «G661» 이 그만큼 내려 제자리에 둠.
 *     아이폰이 스스로 돌아오면(offsetTop 0) 바로 풂 · 키보드가 올라와 있는 동안은 아이폰이 하는 대로 둠(입력칸을 가리지 않게).
 *   ■ 아이폰 · 아이패드에서만 켜짐 — PC · 안드로이드는 아무것도 안 바뀜(시험_아이폰자리.mjs 가 지킴).
 *   ■ 숨은 셈 |아이폰자리|바로잡음 (이 탭에서 처음 바로잡을 때 한 번 · 소장님 브라우저 · 로봇은 안 셈 — 받은수.jsx 세기)
 *   ■ 🩺 G661c 진단(소장님 폰에서도 셈 — 받은수.jsx 진단세기 · 쪽을 열 때마다 꼴마다 한 번):
 *     |아이폰자리|진단-A-…  = 기준점(offsetTop)이 남아 바로잡음 (t 기준점 · h 보이는 높이 · i innerHeight · b 아래 탭 바닥 · s 화면 높이 · 앱/웹)
 *     |아이폰자리|진단-B-…  = 기준점은 0 인데 아래 탭 바닥이 보이는 바닥과 40px 넘게 어긋남(다른 꼴 — 이 꼴은 아직 못 바로잡음 → 숫자 보고 고침)
 *     둘 다 안 오르는데 소장님 폰에 또 뜨면 «값은 멀쩡한데 그림만 어긋나는 꼴» → 다른 길
 *   ■ 🩺 G661c 깨우기: 앱으로 돌아옴(visibilitychange) · 뒤로 가기(pageshow) · 키보드 닫힘(focusout) 때 떠 있는 것들을 두 그림(2 프레임) 동안
 *     will-change: opacity 로 새 판(레이어)에 다시 올림(html.vv-kick) — 아이폰이 옛 자리를 붙들고 있으면 다시 그리게 · 눈에는 안 보임
 */
import { 세기, 진단세기 } from './받은수.jsx'

const 아이폰인가 = () => {
  try {
    const ua = navigator.userAgent || ''
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1)
  } catch (e) { return false }
}

const 글칸아님 = /^(button|submit|reset|checkbox|radio|range|color|file|image|hidden)$/i
/** 글을 쓰는 중인가(키보드가 올라와 있을 수 있음)
 *  🩹 G661b — 다른 사이트 틀(iframe · 쿠팡 배너)은 «쓰는 중» 으로 보지 않음: 배너를 누르면 틀에 커서가 남아(쿠팡 다녀와도) 바로잡기가 막혔음.
 *     틀 안에서 정말 글을 쓰면 키보드가 올라와 보이는 높이가 줄어드니 «높이 85%» 가 대신 막아 줌 */
export const 글쓰는중 = (a) => {
  if (!a || a === document.body || a === document.documentElement) return false
  if (a.isContentEditable) return true
  const t = a.tagName
  if (t === 'TEXTAREA' || t === 'SELECT') return true
  if (t === 'INPUT') return !글칸아님.test(a.type || 'text')
  return false
}

/** 바로잡을 만큼(px) — 0 이면 그대로 둠 */
export const 어긋남 = (vv, 최대높이, 쓰는중) => {
  if (!vv || 쓰는중) return 0
  if (Math.abs((vv.scale || 1) - 1) > 0.02) return 0             // 손가락으로 키운 화면 — 아이폰이 하는 대로
  if (최대높이 > 0 && (vv.height || 0) < 최대높이 * 0.85) return 0  // 키보드가 아직 올라와 있음(또는 내려가는 중)
  const dy = Math.round(vv.offsetTop || 0)
  return dy >= 40 && dy <= 1500 ? dy : 0
}

let 켜짐 = false
export function 켜기() {
  if (켜짐 || typeof window === 'undefined' || !window.visualViewport || !아이폰인가()) return
  켜짐 = true
  const vv = window.visualViewport
  const 최대 = {}          // 화면 폭(세로 · 가로)마다 «키보드 없을 때» 보이는 높이
  let 지금 = 0, 셌음 = false, 줄 = 0, 후보 = null
  const 진단함 = {}
  const 진단 = (꼴, vt, vh, b) => {
    if (진단함[꼴]) return
    진단함[꼴] = true
    try { 진단세기(`|아이폰자리|진단-${꼴}-t${vt}-h${vh}-i${Math.round(window.innerHeight || 0)}-b${b}-s${Math.round((window.screen && window.screen.height) || 0)}-${navigator.standalone ? '앱' : '웹'}`) } catch (e) { /* 없음 */ }
  }
  /* 아래 탭 바닥(그려진 자리 — 바로잡은 만큼 뺀 «원래» 자리) · 탭이 안 보이는 넓은 화면은 -1 */
  const 탭바닥 = () => {
    try { const t = document.querySelector('.tabbar'); if (!t || getComputedStyle(t).display === 'none') return -1; return Math.round(t.getBoundingClientRect().bottom) } catch (e) { return -1 }
  }
  const 살핌 = (쓰는중, 최대높이) => {
    if (쓰는중 || (최대높이 > 0 && (vv.height || 0) < 최대높이 * 0.85) || Math.abs((vv.scale || 1) - 1) > 0.02) return
    const vt = Math.round(vv.offsetTop || 0), vh = Math.round(vv.height || 0), b = 탭바닥()
    if (지금) { 진단('A', vt, vh, b); return }
    if (vt < 40 && b >= 0 && Math.abs(b - (vt + vh)) >= 40) 진단('B', vt, vh, b)   // 기준점 탓이 아닌 어긋남만
  }
  let 깨우는중 = false
  const 깨우기 = () => {
    if (깨우는중) return
    깨우는중 = true
    const r = document.documentElement
    r.classList.add('vv-kick')
    requestAnimationFrame(() => requestAnimationFrame(() => { r.classList.remove('vv-kick'); 깨우는중 = false }))
  }
  const 바꾸기 = (dy) => {
    지금 = dy
    const r = document.documentElement
    if (dy) {
      r.style.setProperty('--vv-dy', dy + 'px')
      r.classList.add('vv-fix')
      if (!셌음) { 셌음 = true; 세기('|아이폰자리|바로잡음') }
    } else {
      r.classList.remove('vv-fix')
      r.style.removeProperty('--vv-dy')
    }
  }
  const 맞추기 = () => {
    줄 = 0
    const 쓰는중 = 글쓰는중(document.activeElement)
    const 열쇠 = Math.round(window.innerWidth || 0)
    if (!쓰는중 && Math.abs((vv.scale || 1) - 1) <= 0.02) 최대[열쇠] = Math.max(최대[열쇠] || 0, vv.height || 0)
    const dy = 어긋남(vv, 최대[열쇠] || 0, 쓰는중)
    살핌(쓰는중, 최대[열쇠] || 0)
    if (!dy) { 후보 = null; if (지금) 바꾸기(0); return }                 // 돌아오면 바로 풂
    if (지금) { if (Math.abs(dy - 지금) > 2) 바꾸기(dy); return }        // 바로잡는 중 — 값만 따라감
    /* 처음 바로잡기는 0.5초 그대로일 때만 — 끝에서 튕김 · 키보드가 내려가는 한순간에는 안 움직임 */
    const t = Date.now()
    if (후보 && Math.abs(후보.dy - dy) <= 2) {
      if (t - 후보.t >= 500) { 후보 = null; 바꾸기(dy) } else setTimeout(맞추기, 520 - (t - 후보.t))
      return
    }
    후보 = { dy, t }
    setTimeout(맞추기, 550)
  }
  const 곧 = () => { if (!줄) 줄 = requestAnimationFrame(맞추기) }
  const 조금뒤 = () => { [120, 400, 900].forEach((ms) => setTimeout(맞추기, ms)); setTimeout(깨우기, 450) }
  vv.addEventListener('resize', 곧)
  vv.addEventListener('scroll', 곧)
  window.addEventListener('scroll', 곧, { passive: true })
  window.addEventListener('resize', 곧)
  document.addEventListener('focusin', 곧)
  document.addEventListener('focusout', 조금뒤)
  window.addEventListener('pageshow', 조금뒤)
  window.addEventListener('orientationchange', 조금뒤)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) 조금뒤() })
  /* 아이폰이 알림(이벤트) 없이 어긋난 채 두는 때도 있어 1초마다 한 번 더 봄(값 몇 개 읽기 — 가벼움) */
  setInterval(() => { if (!document.hidden) 맞추기() }, 1000)
  맞추기()
}
