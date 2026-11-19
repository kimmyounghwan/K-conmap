/* 🔤 G782 (2026-11-19) 도장 글꼴 — 소장님 「글자체를 바꿔봐」 → 아홉 가지 견본 → 고르신 것만 넣음
 *   ■ 글꼴은 이 사이트에 둠(public/fonts/stamp/<이름>/ — 공개 글꼴(OFL) · 원본 그대로 · LICENSE 같이) — 어느 폰 · PC 에서나 같은 모양
 *   ■ 글자 묶음(유니코드 구간)마다 쪼갠 woff2 — 브라우저가 «쓰는 글자가 든 묶음» 만 받음(이름 몇 자면 몇십 KB)
 *   ■ 그 글꼴을 고를 때만 받음(첫 화면 무게 그대로) · 이름 · 회사 이름은 이 기기 안에서만(글꼴 파일만 이 사이트에서 받음)
 */
export const 웹글꼴들 = [
  /* { k: '도현', 이름: '도현', family: '"Do Hyeon"', 굵기: '400', 덧: 0, css: '/fonts/stamp/do-hyeon/font.css' }, */
]
export const 웹글꼴 = Object.fromEntries(웹글꼴들.map((g) => [g.k, g]))

/** 글꼴 받기 — 꼴 파일(css)을 한 번만 붙이고, 이 글자들이 든 묶음을 받을 때까지 기다림(5초 넘으면 그냥 감) */
export async function 글꼴받기(g, 글 = '') {
  if (!g || typeof document === 'undefined') return false
  try {
    let 붙음 = document.querySelector(`link[data-stampfont="${g.k}"]`)
    if (!붙음) {
      붙음 = document.createElement('link')
      붙음.rel = 'stylesheet'; 붙음.href = g.css; 붙음.dataset.stampfont = g.k
      document.head.appendChild(붙음)
    }
    if (!붙음.sheet) await new Promise((된) => { 붙음.addEventListener('load', 된, { once: true }); 붙음.addEventListener('error', 된, { once: true }); setTimeout(된, 5000) })
    if (document.fonts && document.fonts.load) await Promise.race([document.fonts.load(`${g.굵기} 40px ${g.family}`, String(글 || '가')), new Promise((된) => setTimeout(된, 5000))])
    return true
  } catch (e) { return false }
}
