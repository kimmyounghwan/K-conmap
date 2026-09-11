/* ==========================================================
   별명 — 글쓴이가 이름을 적지 않아도 «누구» 인지 보이게 (2026-09-11)

   소장님: 「글을 쓰면 별명이 붙게 해줘. 이름 별명을 쓰게 하지 말고.」

   ■ 왜 자동인가
     이름칸을 비우면 «익명» 이 줄줄이 쌓여 누가 누구인지 안 보입니다.
     그렇다고 적으라고 하면 귀찮아서 안 씁니다. 그래서 **우리가 지어 줍니다.**

   ■ 어떻게 같은 사람인 줄 아나
     익명 로그인 uid 로 만듭니다. 같은 브라우저면 uid 가 같으니 **별명도 늘 같습니다.**
     uid 는 사람을 특정하지 못하는 값이고, 별명에도 uid 가 그대로 드러나지 않습니다.

   ■ 규칙 제약: database.rules.json 의 by 는 **20자 이하**. 가장 긴 조합도 여기 아래 검사로 막습니다.
   ========================================================== */

/* 현장에서 쓰는 말로 고릅니다. 비하·정치·지역 색이 없는 말만 씁니다. */
const ADJ = [
  '성실한', '부지런한', '꼼꼼한', '든든한', '침착한', '노련한', '빠른', '정확한',
  '조용한', '기운찬', '단단한', '너그러운', '슬기로운', '묵직한', '반듯한', '깔끔한',
]
const NOUN = [
  '굴착기', '덤프', '타워크레인', '지게차', '롤러', '불도저', '크레인', '펌프카',
  '측량사', '반장', '소장', '기사', '목수', '철근공', '미장공', '설비공',
]

/** 문자열 → 32비트 정수 (FNV-1a). 같은 입력이면 늘 같은 값. */
export function hash32(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < String(s).length; i++) {
    h ^= String(s).charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** uid 로 별명을 만듭니다. 같은 uid → 언제나 같은 별명. */
export function nickOf(uid) {
  if (!uid) return '익명'
  const h = hash32(uid)
  const a = ADJ[h % ADJ.length]
  const n = NOUN[Math.floor(h / ADJ.length) % NOUN.length]
  /* 뒤 숫자는 «세 자리» 입니다 — 두 자리(25,600조합)면 5만 명에서 같은 별명이 9명까지 겹쳤습니다.
     세 자리면 256,000조합이라 훨씬 덜 겹칩니다. 가장 긴 별명도 13자라 규칙(20자)에 넉넉합니다. */
  const num = Math.floor(h / (ADJ.length * NOUN.length)) % 1000
  return `${a} ${n}${String(num).padStart(3, '0')}`
}

/** 규칙(by ≤ 20자)을 넘는 조합이 하나도 없는지 — 검사에서 씁니다. */
export const NICK_MAX = 20
export function longestNick() {
  let worst = ''
  for (const a of ADJ) for (const n of NOUN) {
    const s = `${a} ${n}999`
    if (s.length > worst.length) worst = s
  }
  return worst
}
export const NICK_COMBOS = ADJ.length * NOUN.length * 1000
