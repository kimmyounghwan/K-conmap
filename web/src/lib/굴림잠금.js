/* 🔒 G791 (2026-11-20) 뒤 화면 굴림 막기 — 하나로 · 몸(body) 대신 html(문서 뿌리)에 겁니다
 *   소장님 06:40 「맵톡에서 클릭을 해도 글을 쓰는걸로 전환이 안돼」(폰 캡처 — 머리줄 · 아래 탭이 안 보이고 시계 줄 뒤가 뿌옇게) ·
 *          「맵톡에서 답글을 쓰려고 터치를 하면 답글쓰는 박스가 위쪽에서 열려. 이상해 고쳐 줘」
 *          → (맨 위로 올려 숨어 있던 공지창을 닫으니) 「됐다. 이상없다」
 *   ■ 까닭: 창(공지창 · 빠른 찾기 · 적산 작업 화면)이 열릴 때 document.body.style.overflow = 'hidden' 으로 뒤를 막았음.
 *     그런데 styles.css «html, body { overflow-x: clip }» 때문에 html 이 visible 이 아니어서 body 의 overflow 가 화면(뷰포트)으로 안 넘어가고
 *     body 가 «스크롤 상자» 가 됨 →
 *     ① 머리줄(sticky)이 body 에 붙어 화면을 내리면 같이 올라가 사라짐(lib/아이폰자리.js 진단 D — /qna 머리줄 바닥 −1152 · 빠른 찾기 글칸 커서(fI) 꼴 여럿)
 *     ② 아이폰(WebKit)은 떠 있는 것(position: fixed — 공지창 · 아래 탭 · 시계 줄 칸 · 맵톡 글 창)까지 body 를 따라 쪽 맨 위에 그림
 *        → 화면을 내린 채 공지창이 다시 뜨면(G786b 앱으로 돌아옴) 공지창은 안 보이는 맨 위에 열려 있고, 맵톡 카드를 눌러도 글 창이 맨 위에 열림
 *     ③ PC 는 body 를 막아도 바퀴로 뒤 화면이 그대로 굴렀음(막는 효과도 없었음).
 *   ■ 고침: html 에 overflow: hidden — 뿌리의 overflow 는 화면(뷰포트)에 걸려 body 가 스크롤 상자가 되지 않음(머리줄 · 떠 있는 것 제자리).
 *     PC 처럼 스크롤 막대가 자리를 차지하는 화면에서만 scrollbar-gutter: stable — 막대가 사라지며 화면이 옆으로 밀리지 않게(폰 · 맥은 막대가 떠 있어 안 씀).
 *     창이 겹쳐도(빠른 찾기 위에 공지창) 마지막 창이 닫힐 때만 풂(세기) — 옛 «열 때 값 기억 → 닫을 때 되돌림» 은 닫는 차례가 바뀌면 잠금이 남았음.
 *   ■ 재발 막기: tools/시험_굴림잠금.mjs — web/src 에 «body.style.overflow» 쓰기가 다시 나오면 잡음 ·
 *     styles.css «G791 body 막이»(!important)가 바깥 스크립트 등이 건 body 잠금도 힘을 못 쓰게 함 · tools/시험_굴림잠금화면.mjs(폰 흉내 · 공지창 · 맵톡 글 창 · 겹친 창)
 *   쓰는 법: useEffect(() => { const 풀기 = 굴림잠금(); return 풀기 }, []) — 풀기는 두 번 불러도 한 번만 셈
 */
let 수 = 0
let 옛 = null

export function 굴림잠금() {
  if (typeof document === 'undefined') return () => {}
  const h = document.documentElement
  if (수 === 0) {
    옛 = { o: h.style.overflow, g: h.style.scrollbarGutter }
    let 막대 = false
    try { 막대 = (window.innerWidth || 0) - (h.clientWidth || 0) > 0 } catch (e) { /* 없음 */ }
    h.style.overflow = 'hidden'
    if (막대) h.style.scrollbarGutter = 'stable'
  }
  수 += 1
  let 풀었음 = false
  return () => {
    if (풀었음) return
    풀었음 = true
    수 = Math.max(0, 수 - 1)
    if (수 === 0) {
      h.style.overflow = 옛 ? 옛.o : ''
      h.style.scrollbarGutter = 옛 ? 옛.g : ''
      옛 = null
    }
  }
}

/** 지금 걸린 잠금 수(시험용) */
export const 잠긴수 = () => 수
