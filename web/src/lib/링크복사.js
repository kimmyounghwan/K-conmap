/**
 * 🔗 결과 링크 복사 — 판단기 다섯(퇴직금 · 주휴 · 실업 · 휴업 · 4대보험)의 «🔗 링크 보내기» (G516 · 2026-11-02)
 *   G515 사이트 점검에서 찾음: 브라우저에 따라 navigator.clipboard.writeText 가 끝나지도 · 실패하지도 않고 멈춰 있으면
 *   화면에 링크가 끝내 안 나왔음(«링크 보내기» 를 눌러도 아무 일 없음). → 1.5초 안에 안 끝나면 «못 복사함» 으로 보고
 *   링크를 화면에 보여 줌(«길게 눌러 복사»). 복사가 늦게 끝나도 해는 없음.
 */
export async function 링크복사(글, 기다림 = 1500) {
  try {
    const c = typeof navigator !== 'undefined' && navigator.clipboard
    if (!c || typeof c.writeText !== 'function') return false
    let 끝 = null
    const 때 = new Promise((res) => { 끝 = setTimeout(() => res(false), 기다림) })
    const 됨 = await Promise.race([Promise.resolve().then(() => c.writeText(String(글))).then(() => true, () => false), 때])
    clearTimeout(끝)
    return 됨 === true
  } catch (e) {
    return false
  }
}
