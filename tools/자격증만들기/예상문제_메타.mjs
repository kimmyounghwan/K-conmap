/**
 * 📝 예상문제 차림표(cert.json deep[종목].quiz) 만들기 — G645 (2026-11-10)
 *   node tools/자격증만들기/예상문제_메타.mjs   → tools/자격증만들기/예상문제_메타.json
 *   그다음 python tools/자격증만들기/깊은글_큐넷덧.py web/src/data/cert.json web/src/data/certq  (메타를 cert.json 에 넣고 «📝 예상문제» 칸을 붙임)
 * ■ 맛보기(예시) = 과목마다 그 과목 첫 틀 · 씨앗 20261110 + 과목 차례(토목기사 G628 과 같은 규칙) — lib/예상문제.js 가 만든 글 그대로
 * ■ cert.json 은 파이썬(만들기)만 씀 — 숫자 꼴(1.0 · 1)이 갈리지 않게. 시험: 시험_예상문제 ④ · 시험_자격증 ⑮
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const Q = await import(pathToFileURL(path.join(여기, '..', '..', 'web', 'src', 'lib', '예상문제.js')).href)
const 메타 = {}
for (const [종목, z] of Object.entries(Q.문제집)) {
  const 예시 = z.과목.map((과, i) => {
    const id = z.틀.find((t) => Q.틀of(t).과목 === 과)
    const q = Q.문제(id, 20261110 + i)
    return { id, 씨: q.씨, 과목: q.과목, 이름: q.이름, 문: q.문, 보기: q.보기, 답: q.답, 해설: q.해설, 근거: q.근거 }
  })
  메타[종목] = {
    h1: `📝 ${z.이름} 필기 예상문제`,
    title: `${z.이름} 필기 예상문제 — ${z.과목.length}과목 계산 문제 · 풀이 · 근거(풀 때마다 숫자 바뀜) | K-건설맵`,
    desc: `${z.이름} 필기 ${z.과목.length}과목(${z.과목.join(' · ')}) 계산 문제 ${z.틀.length}가지 — 바로 채점 · 풀이 · 근거 · 틀린 문제 다시 풀기.`,
    과목: z.과목,
    틀: z.틀.map((id) => ({ id, 과목: Q.틀of(id).과목, 이름: Q.틀of(id).이름 })),
    예시,
  }
}
fs.writeFileSync(path.join(여기, '예상문제_메타.json'), JSON.stringify(메타, null, 1) + '\n')
console.log('예상문제 메타', Object.keys(메타).map((k) => `${k} ${메타[k].틀.length}틀`).join(' · '))
