/**
 * 📝 G688 블로그에서 온 사람 세기 (2026-11-15 — 소장님 「블로그에서 온 사람도 함께 세」 · 「무조건 세」 · 「우린 숫자를 올려야 해 · 그래야 광고에서 유리해」)
 *
 * 건설맵 블로그(네이버 블로그 · 구글 블로그)의 글 끝 링크에는 «?b=n3»(네이버 3번째 글) · «?b=g2»(구글 2번째 글) 꼬리를 붙입니다.
 *   · 꼬리가 있으면 그것으로(출처 + 글 번호) · 없으면 들어온 곳(document.referrer)이 블로그 주소일 때 출처만
 *   · 숨은 누적 셈(dl/p — 사이트 어디에도 안 보임 · 물으시면 클로드가 읽어 알려 드림):
 *       |블로그|네이버 · |블로그|구글          — 블로그에서 온 사람(출처마다)
 *       |블로그글|n3 · |블로그글|g2            — 글마다(꼬리에 글 번호가 있을 때만)
 *   · 들어오자마자 셈(«무조건») — 5초 기다림 · 숨은 탭 따지지 않음. 빼는 것은 로봇 · 소장님 브라우저(세기 규칙 그대로) · 같은 탭에서 다시 읽기(한 번 온 것).
 *   · 셈 뒤 주소에서 b 꼬리를 뗌(공유한 주소로 또 «블로그에서 옴» 이 되지 않게 · 라우터가 깨끗한 주소로 시작) — main.jsx 가 그리기 전에 부름.
 *   🩹 G810 (11-21 바로투찰 점검) 용역 · 물품 바로투찰 주소는 b = 기초금액(lib/용역셈.js 계산주소 «/svc/calc?…&b=52800000»)인데
 *     예전엔 «틀린 꼴이어도 뗌» 이라 새로 고침 · 공유 링크 · 새 탭으로 열면 기초금액이 떨어져 «기초금액 공개 전입니다 — 셀 수 없습니다» 가 됐음
 *     (11-15 G688 부터 · 시험_마감채점화면 사 넷이 잡고 있었음). → 블로그 꼬리 꼴(n · g + 글 번호)일 때만 뗌 · 다른 b 는 그대로.
 *   · 방문자 숫자(lib/방문세기.js)는 이 셈과 따로 · 그대로 — 블로그로 온 사람도 다른 사람과 같은 규칙으로 방문자에 들어감(숫자 기준이 흔들리지 않게).
 * 재발 막기: tools/시험_블로그셈.mjs (꼴 · 들어온 곳 · 열쇠 꼴 · main.jsx 이음 · 쓴수판)
 */

/** 꼬리 b — 'n' · 'g' 다음에 글 번호(1 ~ 9999)는 있어도 없어도 됨. 대 · 소문자 상관없음. 그 밖은 null */
export function 꼬리풀기(b) {
  const m = /^([ng])([1-9]\d{0,3})?$/i.exec(String(b == null ? '' : b).trim())
  if (!m) return null
  const 갈 = m[1].toLowerCase()
  return { 출처: 갈 === 'n' ? '네이버' : '구글', 글: m[2] ? 갈 + m[2] : null }
}

/** 들어온 곳(referrer) — 네이버 블로그 · 구글 블로그(블로그스팟 · 블로거)만. 그 밖(검색 · 카페 · 같은 사이트)은 null */
export function 들어온곳풀기(ref) {
  let h = ''
  try { h = new URL(String(ref || '')).hostname.toLowerCase() } catch (e) { return null }
  if (h === 'blog.naver.com' || h === 'm.blog.naver.com') return '네이버'
  if (/(^|\.)blogspot\.com$/.test(h) || /(^|\.)blogspot\.[a-z.]{2,6}$/.test(h) || h === 'www.blogger.com' || h === 'blogger.com') return '구글'
  return null
}

/** 주소 꼬리(search) · 들어온 곳 → {출처, 글, 뗄} | null — 꼬리가 들어온 곳보다 앞섬 · 뗄 = 블로그 꼬리 꼴(n3 · g2)의 b 가 있음
 *  🩹 G810 꼴이 아닌 b(용역 · 물품 바로투찰의 기초금액 «b=52800000» 등)는 블로그 꼬리가 아님 — 안 뗌 · 안 셈 */
export function 블로그갈래(search, ref) {
  let q
  try { q = new URLSearchParams(String(search || '')) } catch (e) { q = new URLSearchParams('') }
  const 꼬 = q.has('b') ? 꼬리풀기(q.get('b')) : null
  if (꼬) return { ...꼬, 뗄: true }
  const 곳 = 들어온곳풀기(ref)
  if (곳) return { 출처: 곳, 글: null, 뗄: false }
  return null
}

/** 셀 열쇠들 — 세기 규칙(«|한 마디» 또는 «|두|마디») 그대로 */
export function 블로그열쇠(갈래) {
  if (!갈래 || !갈래.출처) return []
  const 열쇠 = ['|블로그|' + 갈래.출처]
  if (갈래.글) 열쇠.push('|블로그글|' + 갈래.글)
  return 열쇠
}

const 탭표 = 'kcm.blog.t'
/** 같은 탭(세션)에서 이미 센 열쇠는 뺌 — 다시 읽기는 한 번 · 다른 글에서 또 오면 그 글은 셈(출처는 한 번) */
export function 새열쇠(열쇠, 저장 = (() => { try { return sessionStorage } catch (e) { return null } })()) {
  let 셌 = []
  try { 셌 = JSON.parse((저장 && 저장.getItem(탭표)) || '[]'); if (!Array.isArray(셌)) 셌 = [] } catch (e) { 셌 = [] }
  const 새 = 열쇠.filter((k) => !셌.includes(k))
  try { if (저장 && 새.length) 저장.setItem(탭표, JSON.stringify([...셌, ...새].slice(-40))) } catch (e) { /* 사생활 보호 모드 — 그래도 셈 */ }
  return 새
}

/** 사이트를 열 때 한 번(main.jsx · 그리기 전) — 셈은 뒤에서(기다리지 않음) · 꼬리는 바로 뗌 */
export function 블로그세기() {
  try {
    if (typeof window === 'undefined') return null
    const 갈래 = 블로그갈래(location.search, document.referrer)
    if (!갈래) return null
    if (갈래.뗄) {
      const u = new URL(location.href)
      u.searchParams.delete('b')
      history.replaceState(history.state, '', u.pathname + u.search + u.hash)
    }
    const 열쇠 = 새열쇠(블로그열쇠(갈래))
    if (열쇠.length) import('./받은수.jsx').then(async (m) => { for (const k of 열쇠) await m.세기(k) }).catch(() => {})
    return { ...갈래, 셈: 열쇠 }
  } catch (e) { return null }   /* 세는 것 때문에 사이트가 멈추면 안 됩니다 */
}
