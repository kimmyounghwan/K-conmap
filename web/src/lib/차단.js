/* 🙈 2026-10-01 (G101) 몰래 차단 — 소장님 고르심 «몰래 차단» · 「다시 풀어주고, 지금 방법으로 하자」
 *
 * ■ 앞서(G100) 만든 «이 기기에서는 이용할 수 없습니다» 화면은 없앴습니다 — 막힌 줄 알면 기록을 지우고 다시 오기 때문입니다.
 * ■ 이제 qna_block/{번호} 에 오른 기기는 사이트가 평소처럼 보이고, 사랑방에 글 · 답글도 «올라간 것처럼» 보입니다.
 *   다만 그 글에는 sb(몰래 차단) 표시가 붙어 **쓴 기기와 운영자에게만** 보이고, 다른 사람 화면 · 미리 구운 쪽 · 알림 · 메일에는 나오지 않습니다.
 * ■ 표시는 서버 규칙이 강제합니다(database.rules.json qna · qna_a .validate) — 막힌 기기가 sb 없이 쓰면 규칙이 받지 않습니다.
 * ■ 확인은 «올릴 때» 만 합니다(자기 칸 qna_block/{uid} 하나 읽기) — 읽기만 하는 방문자는 파이어베이스를 받지 않습니다.
 */
export async function 몰래표() {
  try {
    const [f, d] = await Promise.all([import('../firebase.js'), import('firebase/database')])
    const u = f.auth.currentUser
    if (!u) return {}
    return (await d.get(d.ref(f.db, `qna_block/${u.uid}`))).exists() ? { sb: true } : {}
  } catch (e) {
    return {}
  }
}
