/** 삭제용 4자리 비밀번호 — 절대 그대로 저장하지 않습니다. 글(파일) 아이디를 소금으로 섞어 해시만 남깁니다.
 *  구인·구직 글 · 이용자 서식 · 댓글이 같은 함수를 씁니다 (두 번 적지 않습니다). */
export async function pinHash(id, pin) {
  const buf = new TextEncoder().encode(`${id}:${pin}`)
  const d = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
