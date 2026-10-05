/* 🗺 이용자 지도 — 애널리틱스 도시 이름 → 지도 자리 시험 (G114)  node tools/시험_지도이름.mjs */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 지도이름표, 지도자리찾기, 지도점들, 시도찾기, 지역줄들, 날째, 날글 } from '../web/src/lib/이용자지도.js'
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

// ── G144 시·도 · 누적 · 오늘 · 개설 며칠째
const 시도쌍 = [['Seoul', '서울'], ['Busan', '부산'], ['Incheon', '인천'], ['Daegu', '대구'], ['Daejeon', '대전'], ['Gwangju', '광주'], ['Ulsan', '울산'],
  ['Sejong-si', '세종'], ['Gyeonggi-do', '경기'], ['Gangwon-do', '강원'], ['Gangwon State', '강원'], ['Chungcheongbuk-do', '충북'], ['North Chungcheong', '충북'],
  ['Chungcheongnam-do', '충남'], ['Jeollabuk-do', '전북'], ['Jeonbuk State', '전북'], ['Jeollanam-do', '전남'], ['South Jeolla', '전남'], ['Gyeongsangbuk-do', '경북'],
  ['Gyeongsangnam-do', '경남'], ['Jeju-do', '제주'], ['Jeju', '제주'], ['서울특별시', '서울'], ['전라남도', '전남'], ['경상북도', '경북'], ['notset', null], ['California', null], ['', null]]
for (const [a, n] of 시도쌍) eq(시도찾기(a), n, `시도 ${a || '빈 이름'}`)
const 오늘ms = Date.parse('2026-10-05T09:00:00Z')        // 한국 18시
const 지 = 지역줄들({ at: 오늘ms, d: '2026-10-05', kr: { a: 170, t: 9 }, r: { Seoul: { a: 120, t: 7 }, 'Gyeonggi-do': { a: 30 }, 'Jeollanam-do': { a: 30, t: 2 }, notset: { a: 4 }, 'Busan': { t: 1 } } }, 오늘ms)
eq(지.줄.map((x) => `${x.n}:${x.a}/${x.t}`).join(','), '서울:120/7,전남:30/2,경기:30/0,부산:0/1,기타:4/0', '누적 많은 차례 · 같으면 오늘 많은 차례 · 기타는 끝')
eq(`${지.전국.a}/${지.전국.t}`, '170/9', '전국 누적 · 오늘')
const 어제 = 지역줄들({ at: 오늘ms, d: '2026-10-04', kr: { a: 170, t: 9 }, r: { Seoul: { a: 120, t: 7 } } }, 오늘ms)
eq(`${어제.줄[0].t}/${어제.전국.t}/${어제.오늘날}`, '0/0/false', '자료 날짜가 어제면 오늘은 0')
eq(지역줄들(null), null, '자료 없으면 null')
eq(날째(Date.parse('2026-08-30T00:00:00+09:00')), 1, '연 날 = 1일째')
eq(날째(Date.parse('2026-10-05T18:00:00+09:00')), 37, '10월 5일 = 37일째')
eq(날째(Date.parse('2026-10-05T23:59:00+09:00')), 37, '한국 밤 11시 59분도 37일째')
eq(날째(Date.parse('2026-10-06T00:01:00+09:00')), 38, '자정 넘으면 38일째')
eq(날글('2026-08-30'), '2026. 8. 30.', '날 글')
console.log(`${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
