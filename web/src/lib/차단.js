/* 🙈 2026-10-01 (G101) 몰래 차단 — 소장님 고르심 «몰래 차단» · 「다시 풀어주고, 지금 방법으로 하자」
 *
 * ■ 앞서(G100) 만든 «이 기기에서는 이용할 수 없습니다» 화면은 없앴습니다 — 막힌 줄 알면 기록을 지우고 다시 오기 때문입니다.
 * ■ 이제 qna_block/{번호} 에 오른 기기는 사이트가 평소처럼 보이고, 사랑방에 글 · 답글도 «올라간 것처럼» 보입니다.
 *   다만 그 글에는 sb(몰래 차단) 표시가 붙어 **쓴 기기와 운영자에게만** 보이고, 다른 사람 화면 · 미리 구운 쪽 · 알림 · 메일에는 나오지 않습니다.
 * ■ 표시는 서버 규칙이 강제합니다(database.rules.json qna · qna_a .validate) — 막힌 기기가 sb 없이 쓰면 규칙이 받지 않습니다.
 * ■ 확인은 «올릴 때» 만 합니다(자기 칸 qna_block/{uid} 하나 읽기) — 읽기만 하는 방문자는 파이어베이스를 받지 않습니다.
 */
/* ⏱ G357 (2026-10-21) 소장님 「글을 올릴때 너무 느리게 올라가」 — 올릴 때마다 서버를 한 번 더 다녀오던 것을 10분 기억합니다.
   글 칸을 누를 때 미리 읽어 두므로(맵톡 미리데우기) «올리기» 를 누른 뒤에는 기다리지 않습니다.
   ⚠️ 그 10분 사이에 막힌 기기는 규칙이 sb 없는 글을 받지 않으므로 «올리지 못했습니다» — 몰래표잊기() 뒤 다시 하면 sb 가 붙습니다. */
let _몰래 = null
export function 몰래표잊기() { _몰래 = null }
export async function 몰래표() {
  try {
    const [f, d] = await Promise.all([import('../firebase.js'), import('firebase/database')])
    const u = f.auth.currentUser
    if (!u) return {}
    if (_몰래 && _몰래.uid === u.uid && Date.now() - _몰래.t < 600000) return _몰래.v
    const v = (await d.get(d.ref(f.db, `qna_block/${u.uid}`))).exists() ? { sb: true } : {}
    _몰래 = { uid: u.uid, v, t: Date.now() }
    return v
  } catch (e) {
    return {}
  }
}
