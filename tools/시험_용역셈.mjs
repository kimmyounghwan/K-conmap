// 💰 G194d 용역 · 물품 바로투찰 셈 시험 · node tools/시험_용역셈.mjs
//   ① «셀 수 있나» 규칙 — 화면(lib/용역셈.js 셈까닭)과 수집(svc.py calc_why)이 같은 사례에 같은 답
//   ② 셈 — 공사 lib/bidmath.js 와 같은 식(하한 = (예정가격 − A) × 하한율 + A) · 분위 · 내 금액 · 하한표
//   ③ 카드 단추 주소 ↔ 계산기 — 값이 그대로 오감
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { 셈까닭, 셈가능, 기준사정률, 재료, 참고금액, 분위금액, 내금액, 하한표, 계산주소, 주소공고, 실측최소 } from '../web/src/lib/용역셈.js'
import { limitAmount, recommend, sjSigma, P50_FALLBACK } from '../web/src/lib/bidmath.js'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름) } else { 실패++; console.log('  ✗', 이름, 더) } }

const 사례 = [
  { swin: '협상에의한계약-협상에 의한 낙찰자 결정', pmth: '복수예가', llr: 88, base: 100, lo: -2, hi: 2 },
  { swin: '수의시담-수의시담', pmth: '복수예가', llr: 88, base: 100, lo: -2, hi: 2 },
  { swin: '소액수의견적-소액수의견적', pmth: '단일예가', llr: 88, base: 100, lo: -2, hi: 2 },
  { swin: '소액수의견적-소액수의견적', pmth: '비예가', llr: 88, base: 100, lo: -2, hi: 2 },
  { swin: '규격가격동시입찰-제안적격자 중 예가 내 최저가', pmth: '복수예가', llr: null, base: 100, lo: -2, hi: 2 },
  { swin: '적격심사제-추정가격이 2억원 미만 1억원 이상인', pmth: '복수예가', llr: 87.745, base: 0, lo: -3, hi: 3 },
  { swin: '적격심사제', pmth: '복수예가', llr: 87.745, base: 100, lo: null, hi: 3 },
  { swin: '적격심사제', pmth: '복수예가', llr: 87.745, base: 100, lo: -3, hi: 3 },
  { swin: '소액수의견적-소액수의견적', pmth: '복수예가', llr: 88, base: 18000000, lo: -2, hi: 2 },
  { swin: '제한적최저가', pmth: '복수예가', llr: 86.245, base: 48500000, lo: -2, hi: 2 },
  { swin: '', pmth: '', llr: 88, base: 100, lo: -2, hi: 2 },
  { swin: '적격심사제', pmth: '복수예가', llr: 120, base: 100, lo: -2, hi: 2 },
]
const 기대 = ['협상', '시담', '예가', '예가', '하한율', '기초', '범위', '', '', '', '예가', '하한율']
const js = 사례.map(셈까닭)
확인('① 화면 규칙 — 사례 12가지 기대대로', JSON.stringify(js) === JSON.stringify(기대), JSON.stringify(js))
const py = JSON.parse(execFileSync('python3', ['-c', `
import json,sys; sys.path.insert(0, ${JSON.stringify(ROOT)}); import svc
print(json.dumps([svc.calc_why(r) for r in json.loads(sys.argv[1])], ensure_ascii=False))`, JSON.stringify(사례)], { encoding: 'utf8' }).trim().split('\n').pop())
확인('① 수집(svc.py calc_why)과 화면(셈까닭)이 같은 답', JSON.stringify(py) === JSON.stringify(js), JSON.stringify(py))

// ② 셈
const 공고 = { swin: '적격심사제-추정가격이 고시금액 미만인 물품 제조', pmth: '복수예가', llr: 86.245, base: 48500000, lo: -2, hi: 2, ptot: 15, pdrw: 4 }
const 기 = 기준사정률(null, 99.88)
확인('② 실측 없으면 공사 p50 을 빌림', 기.p50 === 99.88 && 기.출처 === '공사')
확인('② 실측 29건이면 아직 공사 · 30건이면 실측', 기준사정률({ n: 29, p50: 100.2 }, 99.88).출처 === '공사' && 기준사정률({ n: 실측최소, p50: 100.2 }, 99.88).p50 === 100.2)
확인('② 공사 p50 도 없으면 대체값', 기준사정률(null, null).p50 === P50_FALLBACK)
const m = 재료(공고, 99.88)
확인('② 재료 — σ 는 공사와 같은 식(sjSigma)', m && Math.abs(m.sd - sjSigma(-2, 2, 15, 4)) < 1e-12)
확인('② A값이 공고에 없으면 0 · «모름»(95분위로 넉넉히)', m.aVal === 0 && m.aKnown === false)
const 참 = 참고금액(m)
const rec = recommend({ base: m.base, llRate: m.llRate, aVal: 0, aKnown: false, p50: 99.88, sd: m.sd })
확인('② 참고 금액 = 공사 바로투찰 recommend 와 같음', 참.amt === rec.amt && 참.pctile === 95, `${참.amt} vs ${rec.amt}`)
확인('② 참고(95분위) 넘길 확률 ≈ 95%', Math.abs(참.통과 - 0.95) < 0.01, 참.통과)
const q50 = 분위금액(m, 50)
확인('② 50분위 금액 = 하한(사정률 p50) 올림', q50.amt === Math.ceil(limitAmount(m.base, 99.88, 86.245, 0)) && Math.abs(q50.통과 - 0.5) < 1e-6)
const 차례 = [50, 60, 70, 80, 90, 95].map((q) => 분위금액(m, q).amt)
확인('② 분위가 높을수록 금액이 올라감', 차례.every((v, i) => !i || v > 차례[i - 1]), 차례.join(','))
const 내 = 내금액(m, q50.amt)
확인('② 내 금액 = 50분위 금액이면 넘길 확률 ≈ 50%', Math.abs(내.통과 - 0.5) < 0.01 && Math.abs(내.sj - 99.88) < 0.01, JSON.stringify(내))
const 표 = 하한표(m)
확인('② 하한표 10줄 · 사정률 · 하한이 함께 올라감', 표.length === 10 && 표.every((x, i) => !i || (x.sj > 표[i - 1].sj && x.low >= 표[i - 1].low)))
const 에이 = 재료({ ...공고, aval: 3000000, ayn: 'Y' }, 99.88)
확인('② A값이 있으면 하한 = (예정가격 − A) × 하한율 + A', 분위금액(에이, 50).amt === Math.ceil((48500000 * 0.9988 - 3000000) * 0.86245 + 3000000) && 에이.aKnown)
확인('② 셀 수 없는 공고(협상)는 재료 없음', 재료({ ...공고, swin: '협상에의한계약' }, 99.88) === null && 참고금액(null) === null)

// ③ 주소
const r = { no: 'R26BK01705661', ord: '000', name: '식품로봇 연계 AI 레시피 & 플랫폼 구축 용역', inst: '경북협회', base: 181818181, llr: 87.745, lo: -2, hi: 2, ptot: 15, pdrw: 4, close: '2026-10-16 10:00', pmth: '복수예가', swin: '적격심사제', url: 'https://www.g2b.go.kr/x?a=1&b=2' }
const u = 계산주소('svc', r)
확인('③ 단추 주소는 /svc/calc?…', u.startsWith('/svc/calc?no=R26BK01705661'))
const back = 주소공고(u.split('?')[1])
확인('③ 주소 → 공고 값 그대로(이름 · & · 주소 · 숫자)', back.name === r.name && back.base === r.base && back.llr === r.llr && back.lo === -2 && back.url === r.url && back.close === r.close && 셈가능(back))
확인('③ 값 없는 주소면 null(직접 넣기 화면)', 주소공고('') === null)

console.log(`\n${통과} 통과 · ${실패} 실패`)
process.exit(실패 ? 1 : 0)
