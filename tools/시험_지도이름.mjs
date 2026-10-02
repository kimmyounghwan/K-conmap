/* 🗺 이용자 지도 — 애널리틱스 도시 이름 → 지도 자리 시험 (G114)  node tools/시험_지도이름.mjs */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 지도이름표, 지도자리찾기, 지도점들 } from '../web/src/lib/이용자지도.js'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const d = JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', '한국지도.json'), 'utf-8'))
const 표 = 지도이름표(d.곳, d.별)
let ok = 0, bad = 0
const eq = (got, want, what) => { if (got === want) { ok++ } else { bad++; console.log('  ✗', what, '— 나온 값', got, '· 바란 값', want) } }
eq(d.곳.length, 161, '시·군 161곳')
for (const p of d.곳) eq(지도자리찾기(표, p.e)?.k, p.k, `${p.n} 영어 줄기 ${p.e}`)
const 쌍 = [['Seoul', '서울특별시'], ['Gwangju', '광주광역시'], ['Gwangju-si', '광주시'], ['Anyang-si', '안양시'], ['Bucheon-si', '부천시'], ['Goyang-si', '고양시'],
  ['Gwangyang-si', '광양시'], ['Yeosu-si', '여수시'], ['Jeju-si', '제주시'], ['Jeju City', '제주시'], ['Sejong', '세종특별자치시'], ['Yanggu-gun', '양구군'],
  ['Goseong-gun', '고성군'], ['Gangnam-gu', '서울특별시'], ['Bundang-gu', '성남시'], ['Changwon-si', '창원시'], ['Cheongju-si', '청주시'], ['Gangneung-si', '강릉시']]
for (const [a, n] of 쌍) eq(지도자리찾기(표, a)?.n, n, a)
for (const a of ['Jung-gu', 'Gangseo-gu', 'Ashburn', 'Tokyo', '(not set)', '']) eq(지도자리찾기(표, a), null, `${a || '빈 이름'} → 안 찍음`)
const 지금 = Date.parse('2026-10-02T01:30:00Z')
const 점 = 지도점들({ at: 지금 - 5 * 60000, now: { Seoul: 3, 'Gwangyang-si': 1 }, day: { d: '2026-10-02', c: { Seoul: 1, Busan: 1 } } }, 표, 지금)
eq(점.map((x) => `${x.p.n}:${x.지금}`).join(','), '부산광역시:0,광양시:1,서울특별시:3', '점 — 오늘(옅게) 먼저 · 지금은 크기대로')
eq(지도점들({ at: 지금 - 50 * 60000, now: { Seoul: 3 }, day: { d: '2026-10-02', c: { Seoul: 1 } } }, 표, 지금).map((x) => x.지금).join(), '0', '45분 넘은 «지금» 은 옅은 점으로')
eq(지도점들({ at: 지금, now: {}, day: { d: '2026-10-01', c: { Seoul: 1 } } }, 표, 지금).length, 0, '어제 «오늘» 은 안 찍음')
console.log(`${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
