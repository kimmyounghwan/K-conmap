/* 🚫 2026-10-01 (G100) 사이트 기기 차단 — 소장님: 「사이트 자체를 못 쓰게 해줘」 · 「공고나 1순위 도구 서식 등...모든 것 사용 금지」
 *
 * ■ qna_block/{번호} 에 오른 기기(익명 번호)는 사이트 «모든 화면» 대신 «이 기기에서는 쓸 수 없습니다» 한 장만 봅니다.
 *   (사랑방 글 · 답글은 규칙이 따로 막습니다 — database.rules.json qna/qna_a 의 qna_block 검사, G99)
 * ■ 비용 원칙 그대로: 읽기만 하던 방문자(익명 번호가 없는 기기)는 파이어베이스를 아예 받지 않습니다.
 *   번호가 «되살아나는» 기기(사랑방에 쓴 적 · 알림 · 파이어베이스 로그인 흔적)만 자기 칸 하나를 읽어 봅니다.
 * ■ 한 번 막히면 브라우저에 표시(kcm_blk)를 남겨 다음부터는 열자마자 막힙니다. 표시가 있는 기기도 열 때마다 다시 확인해
 *   소장님이 풀어 주셨으면(qna_block 에서 지움) 표시를 지웁니다.
 * ⚠️ 기록을 모두 지우거나 다른 브라우저 · 기기 · 시크릿 창이면 새 번호라 못 막습니다. 엑셀 · PDF 파일 주소를 직접 치는 것도 못 막습니다.
 */
const 표 = 'kcm_blk'

export function 막혔나() {
  try { return localStorage.getItem(표) === '1' } catch (e) { return false }
}

async function 로그인흔적() {
  try {
    if (localStorage.getItem('kcm_noti') === '1') return true
    if (JSON.parse(localStorage.getItem('kcm_qna_mine') || '[]').length > 0) return true
  } catch (e) { /* 사생활 보호 모드 */ }
  try {
    if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
      const L = await indexedDB.databases()
      return (L || []).some((d) => d && d.name === 'firebaseLocalStorageDb')
    }
  } catch (e) { /* 옛 브라우저 */ }
  return false
}

/** 확인해서 바뀌면 바꿈(v) 을 부릅니다. 끊기거나 규칙 전이면 지금 표시를 그대로 둡니다. */
export async function 차단확인(바꿈) {
  const 지금 = 막혔나()
  if (!지금 && !(await 로그인흔적())) return 지금
  try {
    const [f, d] = await Promise.all([import('../firebase.js'), import('firebase/database')])
    try { if (f.auth.authStateReady) await f.auth.authStateReady() } catch (e) { /* 옛 SDK */ }
    const u = f.auth.currentUser
    if (!u) return 지금
    const 막 = (await d.get(d.ref(f.db, `qna_block/${u.uid}`))).exists()
    try { if (막) localStorage.setItem(표, '1'); else localStorage.removeItem(표) } catch (e) { /* 사생활 보호 모드 */ }
    if (막 !== 지금 && 바꿈) 바꿈(막)
    return 막
  } catch (e) {
    return 지금
  }
}
