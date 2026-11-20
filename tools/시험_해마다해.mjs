/**
 * 🧪 G802 해가 바뀌면 저절로 — 시험_해마다해 (2026-11-20)
 *   소장님 「곧 27년 이잖아. 년도가 자동으로 바뀌게 해줘. 건설맵 전체 점검 후에」
 *   ① 미리 굽는 쪽(prerender.py)이 읽는 값(yearvals.py)과 화면(lib/해마다.js · gongje.js)이 쓰는 값이 같음
 *      — 날 다섯(2026-11-20 · 2026-12-31 · 2027-01-01 · 2027-01-02 · 2027-07-15) · 해 · 노무비율 · 산재 · 고용 · 임금채권 · 석면 · 4대보험 근로자 몫 · 장기요양 · 연금 상하한
 *   ② 해를 손으로 적었던 자리(제목 · 카드 · 요율 글)에 «2026» · «4.75%» 같은 값이 다시 들어오지 않음(고친 곳 목록)
 *   ③ 2027년 1월 1일부터 — 해 2027 · 연금 5% · 장기요양 13.9% · 최저임금 10,700원 / 2026년 12월 31일까지 — 4.75% · 13.14% · 10,320원
 *   ④ 표 꼴 — yearvals.py 가 읽는 표(해마다.js · gongje.js)를 다 읽음(꼴을 바꾸면 여기서 잡힘)
 *   ⑤ 미리 굽는 쪽(prerender.py) 넷 · 해마다 — 오늘 · 2027-01-02 흉내로 구워 «2027년 · 일용근로자 · 5% · 13.9%» 로 바뀜(옛 값 안 남음)
 *   돌리기: node tools/시험_해마다해.mjs   (파이썬 3 · 인터넷 안 씀)
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { 노무비율, 산재율, 고용율, 임금채권율, 석면율, 표해, 최저임금표, 해값 } from '../web/src/lib/해마다.js'
import { 요율, 요양비율, 연금상하한 } from '../web/src/lib/gongje.js'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3')   /* PC(윈도) 는 python */
let n = 0, bad = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }

/* 파이썬과 같은 글 꼴(yearvals.py 백 · 만원) */
const 백 = (x, 자리 = 3) => (x * 100).toFixed(자리).replace(/0+$/, '').replace(/\.$/, '') + '%'
const 만원 = (v) => String(+(v / 10000).toFixed(4)) + '만'

const 날들 = ['2026-11-20', '2026-12-31', '2027-01-01', '2027-01-02', '2027-07-15']
const py = execFileSync(PY, ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(ROOT)})
import yearvals as Y
print(json.dumps({"글": {d: Y.해마다글(d) for d in ${JSON.stringify(날들)}}, "표": {k: sorted(v) for k, v in Y.해마다표().items()}, "공제": {k: (sorted(v) if isinstance(v, dict) else v) for k, v in Y.공제표().items()}}, ensure_ascii=False))
`], { cwd: ROOT, encoding: 'utf8' })
const P = JSON.parse(py)

console.log('① 미리 굽는 쪽(yearvals.py) = 화면(lib) — 날 다섯')
for (const d of 날들) {
  const y = d.slice(0, 4), ym = d.slice(0, 7), G = P.글[d]
  const 노 = 노무비율(y), 산 = 산재율(y), 고 = 고용율(y), 임 = 임금채권율(y), 석 = 석면율(y), R = 요율(ym), [lo, hi] = 연금상하한(ym)
  const 화면 = {
    해: 노.해, 공해: R.해, 노일반: 백(노.일반), 노하도급: 백(노.하도급), 산재합: 백(산.건설 + 산.출퇴근), 산재건설: 백(산.건설), 산재출퇴근: 백(산.출퇴근),
    실업: 백(고.실업), 고용사업주s: 백(고.실업 / 2 + 고.규모.s), 고용안정: 백(고.규모.s).replace('%', '') + '~' + 백(고.규모.l), 임금: 백(임.율), 석면: 백(석.율),
    연금: 백(R.np), 건강: 백(R.hi), 고용근로자: 백(R.ei), 요양: 백(요양비율(ym), 2), 연금하한: 만원(lo), 연금상한: 만원(hi),
  }
  const 다름 = Object.entries(화면).filter(([k, v]) => String(G[k]) !== String(v)).map(([k, v]) => `${k}: 쪽 ${G[k]} · 화면 ${v}`)
  ok(`${d} — 해 ${화면.해} · 공제 해 ${화면.공해} · 노무비율 ${화면.노일반}/${화면.노하도급} · 산재 ${화면.산재합} · 연금 ${화면.연금} · 요양 ${화면.요양} · 상하한 ${화면.연금하한}~${화면.연금상한}`, !다름.length, 다름)
}
ok('표해(«해마다 바뀌는 값» 표의 해) — 쪽 = 화면', P.글['2026-11-20'].표해 === 표해(), [P.글['2026-11-20'].표해, 표해()])

console.log('② 해를 손으로 적었던 자리에 다시 안 들어옴')
const 읽 = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8')
const 금지 = [
  ['web/src/data/tools.json', [/내역서 모음 — 20\d\d년/, /노무비율\(20\d\d 일반/, /해마다 바뀌는 값 — 20\d\d/, /공휴일 표\(20\d\d · 20\d\d년\)/]],
  ['web/src/pages/Naeyeok.jsx', [/모음 — 20\d\d년/, /품셈 기준 \(20\d\d년\)/]],
  ['web/src/pages/Juhyu.jsx', [/20\d\d년 최저임금 [\d,]+원/]],
  ['web/src/pages/NomubiMyeongse.jsx', [/· 20\d\d년 요율 ·/]],
  ['web/src/pages/TuipbiSite.jsx', [/셉니다 \(20\d\d년/, /<b>4\.75%<\/b>/, /<b>13\.14%<\/b>/, /<b>3\.595%<\/b>/, /실지급액 3,186,890원/]],
  ['web/src/pages/TuipbiBook.jsx', [/확정 전이라 20\d\d년 값으로/]],
  ['web/src/pages/Haemada.jsx', [/값 — 20\d\d 건설 노무/]],
  ['web/src/pages/Gyeonjeok.jsx', [/20\d\d 법정/, /20\d\d년 법정 요율/]],
  ['web/src/pages/Ilyong4.jsx', [/\(20\d\d 요율\)/, /20\d\d 건설업 [\d.]+%/]],
  ['web/src/pages/Change.jsx', [/20\d\d년 품셈·시장단가/]],
  ['web/src/pages/Jeoksan.jsx', [/단가 · 품셈 기준 \(20\d\d/]],
  ['prerender.py', [/값 — 20\d\d 건설 노무/, /셉니다 \(20\d\d년/, /4\.75%/, /13\.14%/, /노무비율\(20\d\d/]],
]
for (const [f, 들] of 금지) {
  const s = 읽(f)
  const 걸림 = 들.filter((re) => re.test(s)).map(String)
  ok(`${f} — 손으로 적은 해 · 요율 없음`, !걸림.length, 걸림)
}
ok('prerender.py — yearvals 표에서 읽음(YG · YH)', /import yearvals as YV/.test(읽('prerender.py')) && /YG\["연금"\]/.test(읽('prerender.py')) && /YH\["표해"\]|YH\[.표해.\]/.test(읽('prerender.py')))

console.log('③ 해가 바뀌는 날 — 12월 31일까지 2026 · 1월 1일부터 2027')
{
  const a = P.글['2026-12-31'], b = P.글['2027-01-01']
  ok('2026-12-31 — 연금 4.75% · 장기요양 13.14% · 공제 해 2026', a.연금 === '4.75%' && a.요양 === '13.14%' && a.공해 === 2026, [a.연금, a.요양, a.공해])
  ok('2027-01-01 — 연금 5% · 장기요양 13.9% · 공제 해 2027', b.연금 === '5%' && b.요양 === '13.9%' && b.공해 === 2027, [b.연금, b.요양, b.공해])
  const m6 = 해값(최저임금표, 2026), m7 = 해값(최저임금표, 2027)
  ok('최저임금 — 2026년 10,320원 · 2027년 10,700원(고용노동부 고시 2026.8.5.) · 잠정 아님', m6.시급 === 10320 && m7.시급 === 10700 && !m7.잠정 && m7.해 === 2027, [m6.시급, m7.시급, m7.잠정])
  const r7 = 요율('2027-01')
  ok('2027-01 공제 요율 — 연금 5% · 건강 3.595% · 잠정은 고용보험만(⚠️ 알림)', r7.np === 0.05 && r7.hi === 0.03595 && JSON.stringify(r7.잠정) === '["고용보험"]', r7)
}

console.log('④ 표 꼴 — yearvals.py 가 표를 다 읽음')
{
  const T = P.표
  ok('해마다.js 표 다섯(노무비율 · 산재 · 고용 · 임금채권 · 석면)을 읽음 — 해마다 한 줄 이상', ['노무비율', '산재', '고용', '임금채권', '석면'].every((k) => (T[k] || []).length >= 1), T)
  ok('노무비율 · 산재 표의 해 = 화면 표의 해', JSON.stringify(T.노무비율) === JSON.stringify(Object.keys((await import('../web/src/lib/해마다.js')).노무비율표).map(Number).sort()), T.노무비율)
  const C = P.공제
  ok('gongje.js 4대보험 요율표 · 장기요양 표 · 연금 상하한을 읽음', (C.율 || []).includes(2026) && (C.율 || []).includes(2027) && (C.요양 || []).includes(2027) && Array.isArray(C.상하한) && C.상하한.length >= 2, C)
}

console.log('⑤ 미리 굽는 쪽 — 오늘(2026-11-20) · 2027-01-02 흉내(prerender.py 쪽 함수 넷 · 해마다)')
{
  const 쪽 = JSON.parse(execFileSync(PY, ['-c', `
import sys, re, json
sys.path.insert(0, ${JSON.stringify(ROOT)})
import prerender as P
shell = open(${JSON.stringify(path.join(ROOT, 'web/index.html'))}, encoding='utf-8').read()
def 글(h):
    h = re.sub(r'<script[\\s\\S]*?</script>', ' ', h); h = re.sub(r'<style[\\s\\S]*?</style>', ' ', h)
    return re.sub(r'\\s+', ' ', re.sub(r'<[^>]+>', ' ', h))
def 뽑기():
    return {k: 글(f(shell)) for k, f in [('tuipbi', P.tuipbi_page), ('nomubi', P.nomubi_page), ('myeongse', P.nomubi_myeongse_page), ('gyeonjeok', P.gyeonjeok_page), ('haemada', P.haemada_page)]}
out = {}
P.YG = P.YV.해마다글('2026-11-20'); P.YH = P.YV.해마다글(f"{P.YV.표해()}-12-31"); out['26'] = 뽑기()
P.YG = P.YV.해마다글('2027-01-02'); out['27'] = 뽑기()
print(json.dumps(out, ensure_ascii=False))
`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
  for (const k of ['tuipbi', 'nomubi', 'myeongse']) {
    ok(`${k} 2026-11-20 — «2026년 · 일용근로자» · 연금 4.75% · 요양 13.14%`, ['2026년 · 일용근로자', '4.75%', '13.14%'].every((x) => 쪽['26'][k].includes(x)))
    ok(`${k} 2027-01-02 — «2027년 · 일용근로자» · 연금 5% · 요양 13.9% · 옛 값 없음`, ['2027년 · 일용근로자', '13.9%'].every((x) => 쪽['27'][k].includes(x)) && !['4.75%', '13.14%', '2026년 · 일용근로자'].some((x) => 쪽['27'][k].includes(x)))
  }
  ok('gyeonjeok 2027-01-02 — 요양 13.9% · 옛 13.14% 없음', 쪽['27'].gyeonjeok.includes('13.9%') && !쪽['27'].gyeonjeok.includes('13.14%'))
  ok('haemada — 제목 해 = 표에 든 가장 늦은 해(지금 2026 · 12월 말 2027 고시를 넣으면 2027)', 쪽['26'].haemada.includes(`${표해()} 건설 노무`), 표해())
}

console.log(`\n${bad ? '✗' : '✓'} 시험_해마다해 ${n - bad}/${n}`)
if (bad) process.exit(1)
