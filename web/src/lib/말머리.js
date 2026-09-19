/* 🏷️ 사랑방 말머리 — 2026-09-19, 소장님 「지금은 시작단계니까 한 곳으로 모아야」 (CLAUDE.md 8절 69)
 *
 * ⚠️ 말머리는 «제목 앞» 에 [질문] 처럼 붙여 둡니다. 자료에 칸을 새로 만들지 않았습니다 —
 *    database.rules.json 이 «적어 둔 칸만» 받기 때문입니다($other: false). 칸을 늘리면
 *    규칙을 «먼저» 올려야 하고(3_규칙올리기.bat), 그 전에 올라온 글은 전부 튕깁니다.
 *    제목 앞 표시는 규칙을 안 건드리고, 메일 알림에도 [질문] 이 같이 보여 되레 낫습니다.
 * ⚠️ 옛 글에는 말머리가 없습니다 — 「후기·건의」로 봅니다(거의 한 줄 인사였습니다).
 *
 * ⚠️ 이 파일은 **화면이 아니라 lib** 입니다 — 「한 줄 남겨 주세요」 창(AskComment)도 씁니다.
 *    Qna.jsx 에서 가져가면 창 하나 때문에 사랑방 화면을 통째로 끌고 갑니다(8절 67 과 같은 사고). */
export const 갈래들 = ['질문', '현장', '구인구직', '후기·건의', 'K-건설맵']

export const 갈래빛 = {
  '질문': ['var(--accent-soft)', 'var(--accent)', 'var(--accent-line)'],
  '현장': ['var(--good-soft)', 'var(--good)', 'var(--good)'],
  '구인구직': ['var(--warn-soft)', 'var(--warn)', 'var(--warn)'],
  '후기·건의': ['var(--surface-2)', 'var(--text-2)', 'var(--line)'],
  /* ⚠️ 꽉 찬 파랑은 «고른 칩» 과 똑같아 보입니다(2026-09-19 화면에서 실제로 그랬습니다).
     딱지도 칩도 옅은 파랑으로 두고, 고른 것만 꽉 찬 파랑입니다. */
  'K-건설맵': ['var(--accent-soft)', 'var(--accent)', 'var(--accent)'],
}

export function 갈래떼기(t) {
  const s = String(t || '')
  const m = /^\[([^\]]{1,8})\]\s*/.exec(s)
  if (m && 갈래들.includes(m[1])) return { c: m[1], t: s.slice(m[0].length) }
  return { c: '후기·건의', t: s }
}

/* 제목은 규칙상 80자까지입니다 — 말머리가 먹는 만큼 덜어 냅니다. */
export const 갈래붙이기 = (c, t) => `[${c}] ` + String(t).slice(0, 76 - c.length)
