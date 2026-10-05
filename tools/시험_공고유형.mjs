// 🏷 공고 유형 태그 · 🏛 기관 최근 사정률 시험 — node tools/시험_공고유형.mjs  (2026-09-30)
// 화면 쪽(lib/유형.js · lib/기관사정률.js)과 만드는 쪽(collect.py tag_of · build_json.py sjr_bucket)이 같은 답을 내는지 봅니다.
import { readFileSync, mkdtempSync, cpSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { 유형맞나, 유형글 } from '../web/src/lib/유형.js'
import { 통번호, 통수, 날짜짧게, 세로범위, 풀이 } from '../web/src/lib/기관사정률.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 표 = JSON.parse(readFileSync(path.join(ROOT, 'web/src/data/공고유형.json'), 'utf-8'))
const 무리 = 표.무리
let ok = 0, bad = 0
const 봄 = (이름, 참) => { if (참) ok++; else { bad++; console.log('✗', 이름) } }

// ── 표 자체 — 비트가 겹치지 않고 2의 거듭제곱 ──
const 비트 = 무리.flatMap((g) => g.태그.map((t) => t.b))
봄('비트 겹침 없음', new Set(비트).size === 비트.length)
봄('비트는 2의 거듭제곱', 비트.every((b) => b > 0 && (b & (b - 1)) === 0))
봄('규칙 이름 겹침 없음', new Set(무리.flatMap((g) => g.태그.map((t) => t.k))).size === 비트.length)

// ── collect.py tag_of — 조달청 칸 그대로 ──
const 줄들 = [
  { name: 'A', kind: '재공고', mthd: '제한경쟁', swin: '적격심사제-추정가격이 10억원 미만', ayn: 'Y', rgnb: '법인등기부상 본점소재지', pmth: '복수예가' },
  { name: '○○ 긴급 보수공사', kind: '등록공고', mthd: '수의계약', swin: '소액수의견적-소액수의견적(2인 이상 견적 제출)', ayn: '', pmth: '단일예가' },
  { name: 'C', kind: '취소공고', mthd: '일반경쟁', swin: '제한적최저가(낙찰하한율)-제한적최저가(낙찰하한율)', aval: 1200000 },
  { name: 'D', kind: '변경공고', mthd: '지명경쟁', swin: '수의시담-수의시담' },
  { name: 'E' },
]
const py = JSON.parse(execFileSync('python3', ['-c', `
import sys, json; sys.path.insert(0, ${JSON.stringify(ROOT)})
import os; os.environ.setdefault("G2B_API_KEY", "x")
import collect as C, build_json as BJ
rows = json.loads(sys.stdin.read())
print(json.dumps({"bits": C._TAG_BIT,
                  "tg": [C.tag_of(r) for r in rows],
                  "b": [BJ.sjr_bucket(n) for n in ["충청북도 청주시", "조달청", "전남광주통합특별시 광양시", "(사)여수YMCA", "한국농어촌공사 경남지역본부 창녕지사"]],
                  "n": BJ.SJR_BUCKETS}))
`], { input: JSON.stringify(줄들), cwd: ROOT }).toString().trim().split('\n').pop())
// 파이썬 비트(_TAG_BIT) = 화면 JSON 비트 — 한쪽만 고치면 거르개가 엉뚱한 공고를 냅니다
const js비트 = Object.fromEntries(무리.flatMap((g) => g.태그.map((t) => [t.k, t.b])))
봄('파이썬 비트 = 화면 JSON 비트', JSON.stringify(Object.entries(py.bits).sort()) === JSON.stringify(Object.entries(js비트).sort()))
const B = Object.fromEntries(무리.flatMap((g) => g.태그.map((t) => [t.n, t.b])))
봄('재공고+제한+적격+지역+A값', py.tg[0] === (B['재공고'] | B['제한경쟁'] | B['적격심사'] | B['지역제한'] | B['A값 있음']))
봄('긴급+수의+견적+단일예가', py.tg[1] === (B['긴급'] | B['수의계약'] | B['수의시담 · 견적'] | B['단일예가']))
봄('취소+일반+최저가+A값(금액만)', py.tg[2] === (B['취소공고'] | B['일반경쟁'] | B['최저가 · 하한율'] | B['A값 있음']))
봄('변경+지명+시담', py.tg[3] === (B['변경공고'] | B['지명경쟁'] | B['수의시담 · 견적']))
봄('빈 줄 → 0', py.tg[4] === 0)

// ── 화면 판정 ──
const t0 = py.tg[0], t1 = py.tg[1]
봄('안 고르면 다 통과', 유형맞나(0, [], 무리) && 유형맞나(t0, null, 무리))
봄('무리 안은 또는', 유형맞나(t1, [B['수의계약'], B['제한경쟁']], 무리) && 유형맞나(t0, [B['수의계약'], B['제한경쟁']], 무리))
봄('무리끼리는 그리고', 유형맞나(t0, [B['제한경쟁'], B['적격심사']], 무리) && !유형맞나(t1, [B['수의계약'], B['적격심사']], 무리))
봄('조건 무리는 모두', 유형맞나(t0, [B['지역제한'], B['A값 있음']], 무리) && !유형맞나(t0, [B['지역제한'], B['단일예가']], 무리))
봄('취소 빼기', !유형맞나(py.tg[2], [-B['취소공고']], 무리) && 유형맞나(t0, [-B['취소공고']], 무리))
봄('취소만', 유형맞나(py.tg[2], [B['취소공고']], 무리) && !유형맞나(t0, [B['취소공고']], 무리))
봄('tg 없는 줄(옛 색인) — 고르면 빠짐 · 안 고르면 남음', !유형맞나(undefined, [B['수의계약']], 무리) && 유형맞나(undefined, [], 무리))
봄('글 두 개', 유형글([B['수의계약'], B['적격심사']], 무리) === '수의계약 · 적격심사')
봄('글 셋 이상', 유형글([B['수의계약'], B['적격심사'], B['A값 있음']], 무리) === '수의계약 · 적격심사 외 1')
봄('글 빼기', 유형글([-B['취소공고']], 무리) === '취소공고 빼기')

// ── 기관 사정률 통 — 파이썬과 같은 번호 ──
const 이름들 = ['충청북도 청주시', '조달청', '전남광주통합특별시 광양시', '(사)여수YMCA', '한국농어촌공사 경남지역본부 창녕지사']
봄('통 개수 같음', py.n === 통수)
봄('통 번호 같음', 이름들.every((n, i) => 통번호(n) === py.b[i]))
봄('날짜', 날짜짧게('260929') === '9.29' && 날짜짧게('261005') === '10.5' && 날짜짧게('') === '')
const [a, b] = 세로범위([100.973, 99.276])
봄('세로범위는 점을 다 담고 100 을 넣음', a <= 99.076 && b >= 101.173 && a < 100 && b > 100)
const [c, d] = 세로범위([100.01])
봄('한 점이어도 폭이 있음', c <= 99.4 && d >= 100.6)
봄('풀이 높게', 풀이(100.183) === '예정가격이 기초금액보다 0.18% 높게 정해지는 편입니다')
봄('풀이 낮게', 풀이(99.7) === '예정가격이 기초금액보다 0.30% 낮게 정해지는 편입니다')
봄('풀이 같게', /거의 같게/.test(풀이(100.02)))

// ── 🚨 빠른 길(fast.yml)은 필요한 파일만 받습니다 — 그 파일들만으로 import 되는지 (2026-09-30 사고) ──
{
  const yml = readFileSync(path.join(ROOT, '.github/workflows/fast.yml'), 'utf-8').replace(/\r\n/g, '\n')
  const m = /sparse-checkout: \|\n([\s\S]*?)\n\s*sparse-checkout-cone-mode/.exec(yml)
  const 받는것 = m ? m[1].split('\n').map((x) => x.trim()).filter(Boolean) : []
  봄('fast.yml 받는 파일 목록 읽음', 받는것.includes('collect.py') && 받는것.includes('fast.py'))
  const tmp = mkdtempSync(path.join(tmpdir(), 'fast-'))
  for (const f of 받는것) {
    const src = path.join(ROOT, f)
    if (!existsSync(src)) continue
    cpSync(src, path.join(tmp, f), { recursive: true })
  }
  let 됨 = false, 글 = ''
  try {
    글 = execFileSync('python3', ['-c', 'import os; os.environ.setdefault("G2B_API_KEY","x"); import fast, collect; print("OK", collect.tag_of({"kind":"재공고"}))'],
      { cwd: tmp, env: { ...process.env, G2B_API_KEY: 'x', PYTHONDONTWRITEBYTECODE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] }).toString()
    됨 = /OK 1/.test(글)
  } catch (e) { 글 = String(e.stderr || e.message).split('\n').slice(-3).join(' ') }
  봄('빠른 길 파일만으로 fast · collect import (' + 받는것.join(', ') + ')' + (됨 ? '' : ' — ' + 글), 됨)
  rmSync(tmp, { recursive: true, force: true })
}

// ── 실제로 구운 통이 있으면 모양 확인 ──
try {
  const dir = path.join(ROOT, 'web/public/data/agency/sjr')
  let 곳 = 0, 틀 = 0
  for (let i = 0; i < 통수; i++) {
    const t = JSON.parse(readFileSync(path.join(dir, `${i}.json`), 'utf-8'))
    for (const [nm, v] of Object.entries(t)) {
      곳++
      if (통번호(nm) !== i) 틀++
      /* ⏳ 2026-10-05 — 사정률을 아직 모르는 기관도 미개찰(p)만 있으면 실립니다: c 는 빈 칸, p 는 'yymmddHHMM' 30개까지 */
      const 사정률모양 = v.c.length <= 8 && v.n >= v.c.length && v.c.every((x) => x[1] >= 95 && x[1] <= 105)
      const 대기모양 = v.p == null || (Array.isArray(v.p) && v.p.length >= 1 && v.p.length <= 30 && v.p.every((x) => /^\d{10}$/.test(x)))
      if (!(사정률모양 && 대기모양 && (v.c.length >= 1 || (v.p && v.p.length)))) 틀++
    }
  }
  봄(`구운 통 ${곳}곳 — 번호 · 모양 맞음`, 곳 > 0 && 틀 === 0)
} catch { console.log('(구운 통 없음 — 건너뜀)') }

console.log(`\n공고 유형 · 기관 사정률 시험: ${ok}가지 맞음${bad ? ` · ${bad}가지 틀림` : ''}`)
process.exit(bad ? 1 : 0)
