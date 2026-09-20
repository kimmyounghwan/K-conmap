/* 🔑 열쇠 — 소장님이 «다른 기계»(휴대폰·태블릿)에서도 운영자 화면을 쓰시게 하는 길.
   2026-09-20 소장님: 「핸드폰으로 보니까 내가 보는 탭이 없다. 입찰성적표」

   ■ 왜 안 보였나
   운영자인지 가리는 기준(lib/운영자.js)은 «파이어베이스 uid» 하나뿐입니다.
   그 uid 는 소장님 «사무실 컴퓨터 브라우저»가 만든 것이라 휴대폰에는 없습니다.
   그래서 휴대폰에서는 성적표 줄도 안 보이고, 주소를 직접 쳐도
   「이 화면은 운영자 브라우저에서만 열립니다」 로 막혔습니다.

   ■ 🚨 저장소가 «공개»입니다
   비밀말을 코드에 그대로 적으면 누구나 읽습니다.
   그래서 **비밀말이 아니라 그 지문(SHA-256)만** 적어 둡니다.
   지문에서 비밀말을 거꾸로 알아낼 수는 없습니다.

   ■ 쓰는 법 — 그 기계에서 딱 한 번
        https://k-conmap.com/?op=<비밀말>
      표를 남기고(kcm_op=1) 주소에서 비밀말을 지웁니다.
      다음부터는 그냥 k-conmap.com 만 열어도 운영자로 봅니다.

   ■ 푸는 법 — 그 기계에서 운영자 표 지우기
        https://k-conmap.com/?op=off

   ⚠️ 이것도 «문 앞 이름표» 입니다(운영자.js 설명과 같습니다).
      진짜 자물쇠는 서버 규칙과 «자료»입니다 — 성적표는 소장님 컴퓨터의
      data/store/first.json 이 있어야 만들어집니다.
*/

const 지문 = '5bc7ed50786f50d53b4ff5c6d478f9bb6ee6b339cc395870bb9f1f71d3eefd86'

/** 주소에 op= 가 붙어 있나 — 붙어 있을 때만 열쇠 일을 합니다(보통 손님은 그냥 지나갑니다) */
export function 열쇠왔나() {
  try { return new URLSearchParams(window.location.search).has('op') } catch { return false }
}

async function 지문내기(말) {
  try {
    const 바이트 = new TextEncoder().encode(String(말))
    const 해시 = await crypto.subtle.digest('SHA-256', 바이트)
    return Array.from(new Uint8Array(해시)).map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch { return '' }   /* crypto.subtle 은 https 에서만 됩니다 */
}

/* 주소에서 op= 를 걷어냅니다 — 화면이 바뀌지 않게 조용히.
   ⚠️ 이걸 안 하면 비밀말이 주소창에 남고, 그 주소가 그대로 남에게 건너갑니다. */
function 주소지우기() {
  try {
    const u = new URL(window.location.href)
    u.searchParams.delete('op')
    const 남은 = u.searchParams.toString()
    window.history.replaceState(null, '', u.pathname + (남은 ? '?' + 남은 : '') + u.hash)
  } catch { /* 무시 */ }
}

/** 앱을 그리기 «전에» 한 번 부릅니다. 참이면 이 기계가 방금 운영자가 된 것입니다. */
export async function 열쇠받기() {
  let 말 = ''
  try { 말 = new URLSearchParams(window.location.search).get('op') || '' } catch { /* 무시 */ }
  if (!말) return false

  if (말 === 'off') {
    try { window.localStorage.removeItem('kcm_op') } catch { /* 무시 */ }
    주소지우기()
    return false
  }

  const h = await 지문내기(말)
  주소지우기()
  if (!h || h !== 지문) return false
  try { window.localStorage.setItem('kcm_op', '1') } catch { /* 무시 */ }
  return true
}
