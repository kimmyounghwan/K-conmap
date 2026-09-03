/* 등급 대조 — web/src/lib/winodds.js 의 winGrade 를 그대로 찍어 냅니다.
   build_json.py 의 win_grade 가 이것과 한 글자라도 다르면
   «화면은 채점하는데 시뮬레이션은 안 하는» 어긋남이 조용히 생깁니다.
   그래서 selfcheck 가 매번 두 쪽을 맞대 봅니다. */
import fs from 'fs'
import { winGrade } from '../web/src/lib/winodds.js'
const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const out = rows.map((r) => {
  const g = winGrade({ base: r.base, est: r.est, lo: r.lo, hi: r.hi,
                       inst: r.inst, name: r.name })
  return { id: r.id, key: g ? g.key : null, score: g ? g.score : null }
})
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1))
