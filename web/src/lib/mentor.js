/* ==========================================================
   🤖 클로드 한마디 — 공고·개찰 한 줄마다 «그래서 어떻다는 건지»

   소장님: 「각각의 공고나 1순위에 클로드가 멘트 하나씩 달아줘」 (2026-09-11)

   ■ 솔직하게 적어 둡니다 — 이건 공고마다 AI 를 부르는 것이 «아닙니다».
     공고가 1만 건이 넘고, 이 사이트는 정적 JSON 으로 돌아 과금이 0 입니다(CLAUDE.md 원칙).
     그래서 **제가 미리 써 둔 문장**을, 그 줄의 값에 맞춰 고르는 방식입니다.
     읽는 규칙은 제가 정했고, 고르는 일은 이 함수가 합니다.

   ■ 숫자를 새로 지어내지 않습니다.
     1순위율·건수는 화면이 이미 쓰는 것을 그대로 받습니다:
       odds  — bidmath.pickOdds(그 규모·참가 칸의 실측)
       grade — winodds.winGrade(등급과 그 등급의 실측 승률)
       AUTO_RULE — 참가 구간별 실측(권장으로 넣었을 때의 1순위율)
     받은 값이 없으면 **그 얘기를 아예 안 합니다.** 없는 숫자를 만들지 않습니다.

   ■ 한 줄만 답니다. 카드에 이미 뱃지·금액이 있어서, 여기서 또 늘어놓으면 아무도 안 읽습니다.
   ========================================================== */
import { AUTO_RULE } from './bidmath.js'

const num = (n) => Number(n || 0).toLocaleString('ko-KR')

/** 참가 구간별 «권장으로 넣었을 때» 실측 1순위율 — bidmath 의 표에서 가져옵니다(두 번 적지 않기). */
const recWinFor = (np) => {
  const r = AUTO_RULE.find((x) => np < x.maxNp)
  return r ? r.recWin : null
}

/** 마감 전 공고 한 줄 — 「넣을까 말까」에 바로 쓰이는 말만 합니다.
 *  ctx: { ready(금액이 나오나), grade(winGrade), odds(pickOdds), enp, enpn } */
export function noteLive(r, ctx = {}) {
  const { ready, grade, odds } = ctx
  const enp = Number(r?.enp || ctx.enp || 0)
  const lic = Array.isArray(r?.lic) ? r.lic : []

  if (!ready) {
    return { tone: 'info',
      text: '아직 기초금액 같은 값이 안 들어와 금액을 못 냅니다. 들어오면 자동으로 채워집니다.' }
  }
  if (lic.length && enp > 0 && enp < 10) {
    return { tone: 'good',
      text: `참가 자격이 «${String(lic[0]).split('/')[0]}»로 묶여 있습니다. 자격이 되신다면 경쟁이 적은 자리입니다(예상 ${num(enp)}곳).` }
  }
  if (enp > 0 && enp < 10) {
    const w = recWinFor(enp)
    return { tone: 'good',
      text: `예상 참가 ${num(enp)}곳 — 실측에서 1순위가 가장 잘 나오는 자리입니다${w ? ` (같은 구간 ${w}%)` : ''}.` }
  }
  if (enp >= 100) {
    return { tone: 'bad',
      text: `예상 ${num(enp)}곳이 몰립니다. 금액을 다듬어도 잘 안 바뀌는 구간이라, 다른 공고가 낫습니다.` }
  }
  if (odds && odds.win > 0 && odds.n > 0) {
    return { tone: odds.win >= 8 ? 'good' : odds.win >= 3 ? 'mid' : 'bad',
      text: `이런 자리(규모·참가)에서 1순위는 실측 ${odds.win}% 였습니다 (${num(odds.n)}건 기준).` }
  }
  if (grade && (grade.key === 'C' || grade.key === 'D')) {
    return { tone: 'bad', text: grade.say }
  }
  if (grade && grade.key === 'A') {
    return { tone: 'good', text: grade.say }
  }
  return { tone: 'mid', text: '특별히 유리하지도 불리하지도 않은 자리입니다. 면허와 현장 거리부터 보세요.' }
}

/** 개찰(1순위) 한 줄 — 「이 결과가 뭘 말해 주나」. 남 얘기가 아니라 다음 투찰에 쓰일 말만 합니다. */
export function noteFirst(r) {
  const np = Math.max(Number(r?.np || 0), Number(r?.nrank || 0))
  const lic = Array.isArray(r?.lic) ? r.lic : []

  if (np === 1) {
    return { tone: 'info',
      text: lic.length
        ? `투찰이 한 곳뿐이었습니다 — 참가 자격이 «${String(lic[0]).split('/')[0]}»로 묶여 있어서입니다. 경쟁이 없으면 하한까지 내릴 이유가 없어 투찰률이 높습니다.`
        : '투찰이 한 곳뿐이었습니다. 경쟁이 없으면 하한까지 내릴 이유가 없어 투찰률이 높게 나옵니다.' }
  }
  if (np >= 100) {
    return { tone: 'bad',
      text: `${num(np)}곳이 붙었습니다. 이런 자리는 1순위가 하한 바로 위에 붙어, 금액보다 «어느 공고에 넣느냐»가 갈랐습니다.` }
  }
  if (np >= 2 && np < 10) {
    const w = recWinFor(np)
    return { tone: 'good',
      text: `${num(np)}곳만 들어온 자리입니다${w ? ` — 실측에서 1순위가 가장 잘 나오는 구간(${w}%)입니다` : ''}. 이런 공고를 찾는 게 금액 다듬기보다 낫습니다.` }
  }
  if (np >= 10) {
    const w = recWinFor(np)
    return { tone: 'mid',
      text: `${num(np)}곳 경쟁이었습니다${w ? ` (같은 구간 실측 1순위율 ${w}%)` : ''}.` }
  }
  /* ⚠️ 2026-09-11 — 처음엔 여기서 null 을 돌려 «아무 말도 안 함» 이었습니다.
     실측(저장소 11,638건): 참가업체수가 있는 줄은 70.9% 인데,
     **최근 개찰은 날마다 100%** 입니다(8/21~9/3 전부). 즉 빈 줄은 전부 «옛날 것» 입니다.
     그런데 카드 몇 개만 멘트가 없으면 「왜 얘만 없지」가 됩니다. 모자라면 모자란다고 말합니다
     (CLAUDE.md — 「없는 자료를 «없는 채로» 그리면 안 된다」). */
  return { tone: 'info',
    text: '이 개찰은 참가업체수가 조달청 자료에 없어, 얼마나 몰렸는지는 말씀드릴 수 없습니다 (옛 개찰에 더러 있습니다).' }
}

export function noteFor(r, kind, ctx) {
  return kind === 'live' ? noteLive(r, ctx) : noteFirst(r)
}
