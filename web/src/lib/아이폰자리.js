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
 *   ■ 🩹 G667 (11-13 16시) «글자판이 아직 올라와 있는 것처럼» 끼인 꼴 — 소장님 16:03 폰 캡처(홈 화면 앱 · 바로투찰 첫 화면) 「또 이런다..」 「탭이 같이 올라가」
 *     캡처: 아래 탭 바닥 568.7pt / 화면 874pt → 305pt 어긋남 · 머리줄 안 보임 · 내리면 탭이 글과 «같이 올라감».
 *     아이폰이 글자판을 닫은 뒤에도 «보이는 높이»(visualViewport.height)까지 글자판만큼 줄여 둔 채 남김 → 보이는 쪽이 바탕 안에서 미끄러지며
 *     기준점(offsetTop)이 0 → 305 로 움직이고 떠 있는 것이 글과 같이 올라감. G661 은 «높이가 줄어 있으면 = 글자판이 올라와 있음» 으로 보고 손대지 않았음(높이 85% 문).
 *     → 커서가 글칸에 없는데 높이만 줄어 있는 채 0.7초 넘게 이어지면 «끼임» 으로 보고 바로잡음 · 그동안은 기준점을 그대로 따라감(0 까지 — 내리고 올릴 때도 탭 · 머리줄 제자리).
 *     · 커서가 글칸에 있고 높이가 줄었으면(정말 글을 쓰는 중) 아이폰이 하는 대로 · 틀(iframe) 커서도 높이가 줄었으면 그대로(틀 안에서 쓰는 중일 수 있음)
 *     · 커서는 글칸에 남았는데 높이는 돌아온 채 1.5초 넘게(글자판은 내려갔는데 커서만 남음) → 바로잡음
 *     · 진단을 다시 짬 — G661c 진단 B 는 «쪽마다 처음 한 번» 이라 위로 튕김(음수 기준점)이 먼저 자리를 차지해 정작 어긋난 숫자가 안 남았음(11-13 dl/p 24개 중 22개가 튕김):
 *       A(높이 그대로 · 기준점 남음) · C(끼임 — 높이도 줄어 있음)는 바로잡을 때 한 번 · B(안 바로잡았는데 탭이 0.8초 넘게 40px 넘게 어긋남 · 위로 튕김 뺌)는 한 쪽에 셋까지 ·
 *       t 기준점 · h 보이는 높이 · m 가장 컸던 높이 · c 바탕 높이(clientHeight) · b 탭 바닥(바로잡기 전) · f 커서(I 글칸 · F 틀 · N 없음) · s 화면 높이 · 앱/웹
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

/** 보이는 높이가 «글자판이 올라와 있을 만큼» 줄었나 — 이 폭에서 가장 컸던 높이의 85% 밑 */
export const 높이줄음 = (vv, 최대높이) => 최대높이 > 0 && ((vv && vv.height) || 0) < 최대높이 * 0.85

/** 바로잡을 만큼(px) — 0 이면 그대로 둠
 *  @param 막음 글자판이 정말 올라와 있을 수 있음(커서 + 줄어든 높이 · 막 커서가 들어감 · 손가락 확대) — 아이폰이 하는 대로(입력칸을 가리지 않게)
 *  @param 이어감 이미 바로잡는 중 — 작은 값 · 0 까지 따라감(처음 잡을 때만 40px 넘어야: 작은 흔들림 · 끝에서 튕김은 안 건드림) */
export const 어긋남 = (vv, 막음, 이어감 = false) => {
  if (!vv || 막음) return 0
  if (Math.abs((vv.scale || 1) - 1) > 0.02) return 0             // 손가락으로 키운 화면 — 아이폰이 하는 대로
  const dy = Math.round(vv.offsetTop || 0)
  if (dy > 1500) return 0
  if (이어감) return dy > 0 ? dy : 0
  return dy >= 40 ? dy : 0
}

let 켜짐 = false
export function 켜기() {
  if (켜짐 || typeof window === 'undefined' || !window.visualViewport || !아이폰인가()) return
  켜짐 = true
  const vv = window.visualViewport
  const 최대 = {}          // 화면 폭(세로 · 가로)마다 «키보드 없을 때» 보이는 높이
  let 켬 = false, 지금 = 0, 셌음 = false, 줄 = 0, 후보 = null, 기다림 = 0
  let 끼임때 = 0          // «커서 없이 높이만 줄어 있음» 이 처음 보인 때(이어지는 동안 그대로)
  let 쓰기때 = 0          // 글칸에 커서가 처음 들어간 때(이어지는 동안 그대로)
  let 어긋때 = 0          // 진단 B — 안 바로잡았는데 탭이 어긋나 보인 때
  const 진단함 = {}
  let B수 = 0
  /* 아래 탭 바닥(그려진 자리) · 탭이 안 보이는 넓은 화면은 -1 */
  const 탭바닥 = () => {
    try { const t = document.querySelector('.tabbar'); if (!t || getComputedStyle(t).display === 'none') return -1; return Math.round(t.getBoundingClientRect().bottom) } catch (e) { return -1 }
  }
  const 진단 = (꼴, d) => {
    const 열쇠 = 꼴 === 'B' ? `B${Math.round(d.t / 20)}_${Math.round(d.b / 20)}` : 꼴
    if (진단함[열쇠] || (꼴 === 'B' && B수 >= 3)) return
    진단함[열쇠] = true
    if (꼴 === 'B') B수++
    try { 진단세기(`|아이폰자리|진단-${꼴}-t${d.t}-h${d.h}-m${d.m}-c${d.c}-b${d.b}-f${d.f}-s${Math.round((window.screen && window.screen.height) || 0)}-${navigator.standalone ? '앱' : '웹'}`) } catch (e) { /* 없음 */ }
  }
  let 깨우는중 = false
  const 깨우기 = () => {
    if (깨우는중) return
    깨우는중 = true
    const r = document.documentElement
    r.classList.add('vv-kick')
    requestAnimationFrame(() => requestAnimationFrame(() => { r.classList.remove('vv-kick'); 깨우는중 = false }))
  }
  const 맞춤 = (dy) => {
    const r = document.documentElement
    if (!켬) {
      켬 = true
      r.classList.add('vv-fix')
      if (!셌음) { 셌음 = true; 세기('|아이폰자리|바로잡음') }
    }
    if (dy !== 지금 || !r.style.getPropertyValue('--vv-dy')) { 지금 = dy; r.style.setProperty('--vv-dy', dy + 'px') }
  }
  const 풀기 = () => {
    후보 = null
    if (!켬) return
    켬 = false
    지금 = 0
    const r = document.documentElement
    r.classList.remove('vv-fix')
    r.style.removeProperty('--vv-dy')
  }
  const 다시봄 = (ms) => { if (기다림) return; 기다림 = setTimeout(() => { 기다림 = 0; 맞추기() }, Math.max(20, ms)) }
  const 맞추기 = () => {
    줄 = 0
    const t0 = Date.now()
    const a = document.activeElement
    const 쓰는중 = 글쓰는중(a)
    const 틀 = !!a && a.tagName === 'IFRAME'
    const 확대 = Math.abs((vv.scale || 1) - 1) > 0.02
    const 열쇠 = Math.round(window.innerWidth || 0)
    if (!쓰는중 && !확대) 최대[열쇠] = Math.max(최대[열쇠] || 0, vv.height || 0)
    const m = 최대[열쇠] || 0
    const 줄음 = 높이줄음(vv, m)
    if (쓰는중) { if (!쓰기때) 쓰기때 = t0 } else 쓰기때 = 0
    const 막커서 = 쓰는중 && !줄음 && t0 - 쓰기때 < 1500                     // 막 커서가 들어감 — 글자판이 올라오는 중일 수 있음
    const 막음 = 확대 || (쓰는중 && 줄음) || 막커서 || (틀 && 줄음)          // 글자판이 정말 올라와 있을 수 있음 — 아이폰이 하는 대로
    const 끼임 = 줄음 && !막음                                                // 🩹 G667 커서 없이 높이만 줄어 있음(글자판은 닫힘)
    if (끼임) { if (!끼임때) 끼임때 = t0 } else 끼임때 = 0
    const vt = Math.round(vv.offsetTop || 0)
    const 값 = () => {
      const tb = 탭바닥()
      return { t: vt, h: Math.round(vv.height || 0), m: Math.round(m), c: Math.round(document.documentElement.clientHeight || 0), b: tb < 0 ? -1 : tb - (켬 ? 지금 : 0), f: 쓰는중 ? 'I' : 틀 ? 'F' : 'N' }
    }
    if (켬) {
      어긋때 = 0
      if (막음) { 풀기(); return }                                           // 글자판이 올라옴 · 손가락 확대 — 아이폰이 하는 대로
      const dy = 어긋남(vv, false, true)
      if (!끼임 && dy <= 2) { 풀기(); return }                               // 다 돌아옴 — 바로 풂
      맞춤(dy)                                                                // 바로잡는 중 — 기준점을 그대로 따라감(끼인 동안은 0 까지)
      return
    }
    /* 🩺 진단 B — 안 바로잡았는데 아래 탭 바닥이 보이는 바닥과 40px 넘게 0.8초 넘게 어긋남(위로 튕김 · 글자판 · 확대는 뺌) */
    if (!막음 && vt >= 0) {
      const tb = 탭바닥()
      if (tb >= 0 && Math.abs(tb - Math.round(vv.height || 0)) >= 40) {
        if (!어긋때) 어긋때 = t0
        if (t0 - 어긋때 >= 800) 진단('B', 값()); else 다시봄(820 - (t0 - 어긋때))
      } else 어긋때 = 0
    } else 어긋때 = 0
    if (막커서) 다시봄(1520 - (t0 - 쓰기때))                                 // 커서만 남은 채 1.5초가 지나면 다시 봄
    const dy = 어긋남(vv, 막음)
    if (!dy) { 후보 = null; return }
    if (끼임) {
      /* 🩹 G667 끼임 — 0.7초 넘게 이어졌으면 바로(기준점이 움직이는 중이어도 · 내리는 중이어도) · 그 전엔 글자판이 내려가는 중일 수 있어 기다림 */
      if (t0 - 끼임때 >= 700) { const d = 값(); 후보 = null; 맞춤(dy); 진단('C', d) } else 다시봄(720 - (t0 - 끼임때))
      return
    }
    /* 처음 바로잡기는 0.5초 그대로일 때만 — 끝에서 튕김 · 키보드가 내려가는 한순간에는 안 움직임 */
    if (후보 && Math.abs(후보.dy - dy) <= 2) {
      if (t0 - 후보.t >= 500) { const d = 값(); 후보 = null; 맞춤(dy); 진단('A', d) } else 다시봄(520 - (t0 - 후보.t))
      return
    }
    후보 = { dy, t: t0 }
    다시봄(550)
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
