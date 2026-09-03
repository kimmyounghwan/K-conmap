/* 브라우저 없이 «화면이 쓰는 계산»을 그대로 불러 숫자를 뽑습니다.
   ⚠️ 여기서는 계산만 합니다. 맞는지 판단은 파이썬(tools/bidmath.py)이 합니다.
      두 구현이 같은 답을 내야 «맞다» 고 말할 수 있습니다.
   ⚠️ node 만 있으면 됩니다. 설치할 것이 없습니다. */
import fs from 'fs'

/* ⚠️ 2026-09-03 — 여기서 한 번 크게 틀렸습니다.
   예전 코드는 `new URL(import.meta.url).pathname` 을 «파일 경로»로 썼습니다.
   그런데 .pathname 은 **이미 퍼센트 인코딩된 문자열**입니다.
   폴더 이름이 「나노_건설맵 코드 등」 이면 그게 %EB%82%98... 로 들어 있고,
   거기에 pathToFileURL 을 또 걸어서 %25EB%2582%2598... 로 두 번 인코딩됐습니다.
   → 소장님 PC 에서 ERR_MODULE_NOT_FOUND.
   영어·공백 없는 폴더에서만 돌려봐서 못 잡았습니다.

   고친 방법: 경로를 «만들지» 않습니다. 그냥 상대 import 를 씁니다.
   node 가 알아서 importer 기준으로 풀어 주고, 인코딩도 한 번만 합니다.
   (경로를 손으로 조립하지 않는다 — CLAUDE.md 1번 원칙과 같은 이야기입니다) */
import * as M from '../web/src/lib/bidmath.js'

const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const out = cases.map((c) => {
  const sd = M.sjSigma(c.lo, c.hi, c.ptot, c.pdrw)
  const ro = M.recommend({ base: c.base, llRate: c.llr, aVal: c.a,
                           aKnown: c.aKnown, p50: c.p50, sd })
  const r = { no: c.no, sd, ready: M.isReady(c.row || {}), missing: M.missingOf(c.row || {}) }
  if (ro) {
    r.sj = ro.sj; r.pctile = ro.pctile; r.recAmt = ro.amt
    const yejeMid = c.base * (c.p50 / 100)
    r.rate = M.c3(ro.amt / yejeMid * 100)
    r.shownAmt = M.bidAmount(c.base, c.p50, r.rate)
    r.limitAtMid = M.limitAmount(c.base, c.p50, c.llr, c.a)
  }
  /* ★ 원클릭(공고 카드) 금액 — quickBid 가 같은 답을 내는지.
     카드는 «공고 한 줄»만 받으므로 입력을 그 모양으로 만들어 넣습니다. */
  if (c.row && c.row.base > 0) {
    const q = M.quickBid({ ...c.row, llr: c.llr, aval: c.a, ayn: c.aKnown && !(c.a > 0) ? 'N' : (c.a > 0 ? 'Y' : ''),
                           lo: c.lo, hi: c.hi, ptot: c.ptot, pdrw: c.pdrw }, c.p50)
    r.quick = q ? q.amt : null
  }
  if (c.score) {                                  // 채점
    const yeje = Math.round(c.score.win / (c.score.rate / 100))
    const L = Math.ceil((yeje - c.a) * (c.llr / 100) + c.a)
    r.score = { yeje, limit: L, our: ro ? ro.amt : 0,
                dq: ro ? ro.amt < L : null,
                beat: ro ? (ro.amt >= L && ro.amt < c.score.win) : null }
    if (c.score.ladder) {
      const sc = M.buildScen({ base: c.base, llRate: c.llr, aVal: c.a,
                               p50: c.p50, sd, myAmt: ro.amt })
      r.score.passN = sc ? sc.passN : null
    }
  }
  return r
})
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1))
console.log(`계산 ${out.length}건 (브라우저 없이)`)
