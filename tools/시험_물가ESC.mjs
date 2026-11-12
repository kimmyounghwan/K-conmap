/**
 * 📈 G657 물가변동 ESC 셈 · 엑셀 · 읽기 시험 — node tools/시험_물가ESC.mjs
 *   (지어낸 숫자만 — 소장님 견본 1회 ESC 로 1원까지 맞춘 시험은 비공개라 저장소 밖에서 돌림: 2,883칸 ✓)
 *   ① 끝수(엑셀 TRUNC · ROUNDDOWN · ROUNDUP · ROUND · INT 와 같게 · 소수 오차)
 *   ② 품목 등락 규칙(견본 4 시트 — B=0 · C>B>A · B≥C>A · 그 밖 · A=0 · 내림)
 *   ③ 원가 사슬(견본 6 시트) · 조정률(견본 조정율 시트 — 요율이 안 바뀌면 사슬과 같은 꼴) · 선금 공제(증가액에서만) · 경과일
 *   ④ 🧪 예시(가상 들말지구) 한 벌 — 금차분 = 계약 · 제외 · 조정률 5.54% · 적용금액 · 예시화면 파일이 지금 엔진과 같음
 *   ⑤ 엑셀 — 짓기 → 리브레오피스로 다시 셈(있을 때) → 수식 칸 모두 사이트 셈과 같음 · 다시 읽기(건설맵 꼴) → 같은 결과 · 빈 틀 읽기
 *   ⑥ 글 — 예시 · 화면에 실제 현장 이름 없음 · «무료» · «클로드» 없음
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 웹 = path.join(여기, '..', 'web', 'src')
const 불러 = (p) => import(pathToFileURL(path.join(웹, p)).href)
const E = await 불러('lib/물가ESC.js')
const X = await 불러('lib/물가ESC엑셀.js')
const L = await 불러('lib/물가ESC읽기.js')
const { 예시입력 } = await 불러('data/물가ESC_예시입력.js')
const { unzipSync, zipSync, strFromU8, strToU8 } = await import(pathToFileURL(path.join(여기, '..', 'web', 'node_modules', 'fflate', 'esm', 'index.mjs')).href)

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

console.log('■ ① 끝수')
ok('버림(0.0057, 4) = 0.0057 (×10000 = 56.99999… 를 57 로)', E.버림(0.0057, 4) === 0.0057, E.버림(0.0057, 4))
ok('버림(−0.06064, 4) = −0.0606 (0 쪽)', E.버림(-0.06064, 4) === -0.0606, E.버림(-0.06064, 4))
ok('버림(63745690.6, −3) = 63,745,000', E.버림(63745690.6, -3) === 63745000)
ok('버림(−1234.9) = −1234', E.버림(-1234.9) === -1234)
ok('올림(1961886.3, −3) = 1,962,000', E.올림(1961886.3, -3) === 1962000)
ok('올림(1962000, −3) = 1,962,000(딱 맞으면 그대로)', E.올림(1962000, -3) === 1962000)
ok('반올림(2.675, 2) = 2.68 (엑셀과 같게)', E.반올림(2.675, 2) === 2.68, E.반올림(2.675, 2))
ok('반올림(63875500, −3) = 63,876,000 · (−2.5) = −3', E.반올림(63875500, -3) === 63876000 && E.반올림(-2.5) === -3)
ok('반올림(224000000/1133840000, 4) = 0.1976', E.반올림(224000000 / 1133840000, 4) === 0.1976)
ok('아래(−0.5) = −1 · 아래(2.9999999999999996) = 3', E.아래(-0.5) === -1 && E.아래(2.9999999999999996) === 3)
ok('분율(14.6) = 0.146 · 분율(11.3485511) = 0.113485511', E.분율(14.6) === 0.146 && E.분율(11.3485511) === 0.113485511)

console.log('■ ② 품목 등락 규칙')
const 한 = (A, B, C, q = 10) => E.품목등락({ 수량: q, A: [A, 0, 0], B: [B, 0, 0], C: [C, 0, 0] })
let r = 한(742, 643, 787)                  /* 보통: B<A<C → TRUNC(B × ROUNDDOWN((C−A)/A,4)) */
ok('보통 — D = 0.0606 · E = TRUNC(643 × 0.0606) = 38 · F = 380 · 변경 681', r.D[0] === 0.0606 && r.E[0] === 38 && r.F[0] === 380 && r.변경[0] === 681, r)
r = 한(100, 110, 120)                      /* C > B > A → C − B */
ok('C > B > A → E = C − B = 10', r.E[0] === 10, r.E)
r = 한(100, 130, 120)                      /* B ≥ C > A → 0 */
ok('B ≥ C > A → E = 0', r.E[0] === 0, r.E)
r = 한(100, 120, 120)
ok('B = C > A → E = 0(같아도 0)', r.E[0] === 0, r.E)
r = 한(100, 0, 150)
ok('B = 0 → E = 0 · 변경 0 아님(INT(0+0)=0)', r.E[0] === 0 && r.변경[0] === 0, r)
r = 한(100, 90, 80)                        /* 내림: D = −0.2 → E = TRUNC(90 × −0.2) = −18 */
ok('내림 — D = −0.2 · E = −18 · F = −180 · 변경 72', r.D[0] === -0.2 && r.E[0] === -18 && r.F[0] === -180 && r.변경[0] === 72, r)
r = 한(0, 90, 0)                           /* A = 0 · C = 0 → 엑셀은 #VALUE! — 0 + 알림 */
ok('A = 0 이고 마지막 갈래 → E = 0 · 경고', r.E[0] === 0 && r.경고.length === 1, r)
r = 한(0, 90, 100)                         /* A = 0 · C > B > A → C − B */
ok('A = 0 · C > B > 0 → E = C − B = 10 (경고 없음)', r.E[0] === 10 && r.경고.length === 0, r)
r = E.품목등락({ 수량: 2.5, A: [1000, 2000, 300], B: [870, 1740, 261], C: [1068, 2140, 322] })
ok('셋 갈래 따로 · 수량 소수(2.5) · F = TRUNC(E × q)', JSON.stringify(r.F) === JSON.stringify(r.E.map((e) => Math.trunc(e * 2.5))) && r.합 === r.F[0] + r.F[1] + r.F[2], r)

console.log('■ ③ 원가 사슬 · 조정률 · 선금 · 경과일')
const 사 = E.원가사슬({ 직재: 1000000, 간재: 2000000, 직노: 5000000, 산출경비: 800000 })
ok('사슬 — 간노 = TRUNC(직노 × 14.6%) = 730,000', 사.간노 === 730000, 사.간노)
ok('사슬 — 산안비 = TRUNC((재료 + 직노) × 1.97% × 1.2) = 189,120', 사.산안비 === Math.trunc((3000000 + 5000000) * 0.0197 * 1.2), 사.산안비)
ok('사슬 — 노인 = TRUNC(건강 × 12.95%)', 사.노인 === Math.trunc(사.건강 * 0.1295), [사.건강, 사.노인])
ok('사슬 — 이윤 = TRUNC((순공사원가 + 일관 − 재료비) × 이윤율)', 사.이윤 === Math.trunc((사.순공사원가 + 사.일관 - 사.재료비) * 0.113485511), 사.이윤)
ok('사슬 — 도급액 천원 버림 · P/S 는 그대로', 사.도급액 % 1000 === 0 && E.원가사슬({ 직노: 1234567 }, undefined, '그대로').도급액 % 1000 !== 0)
/* 요율이 안 바뀌면(기준 = 비교) 조정율 시트의 보험료 등락 = 바탕 등락 × 요율 — 사슬과 같은 꼴 */
const 조 = E.조정률셈({ I: 사, 등락: { 재: 100000, 노: 200000, 경: 30000 }, 바탕: 사.도급액 })
ok('요율 그대로면 건강 등락 = TRUNC(직노 등락 × 3.545%)', 조.등락.건강 === Math.trunc(200000 * 3.545 / 100), 조.등락.건강)
ok('간노 등락 = TRUNC(직노 등락 × 14.6 ÷ 100) · 기계보증 = TRUNC(소계 × 0.4 ÷ 100)', 조.등락.간노 === 29200 && 조.등락.기계보증 === Math.trunc(330000 * 0.4 / 100), [조.등락.간노, 조.등락.기계보증])
ok('합계 천원 반올림 · 조정률 = 합계 ÷ 바탕 × 100 소수 둘째 자리 버림', 조.합계 % 1000 === 0 && 조.조정률 === Math.trunc(조.합계 / 사.도급액 * 10000) / 100, [조.합계, 조.조정률])
const 조2 = E.조정률셈({ I: 사, 등락: { 재: 100000, 노: 200000, 경: 30000 }, 바탕: 사.도급액, 요율: { 건강: { 기준: 3.545, 비교: 3.595 } } })
const rate = 3.545 * 3.595 / 3.545
ok('건강 요율이 오르면 등락 = 직노등락 × 변경율 + (변경율 − 계약율) × 직노 적용대가', 조2.등락.건강 === Math.trunc(200000 * 3.545 * 3.595 / 3.545 / 100 + (rate - 3.545) / 100 * 사.직노), [조2.등락.건강])
ok('요율이 오르면 등락 합계도 오름', 조2.합계 >= 조.합계, [조.합계, 조2.합계])
ok('선금 공제 — ROUNDUP(286,953,000 × 3.46% × 0.1976, −3) = 1,962,000', E.선금공제셈({ 금차계약: 1133840000, 금차제외: 846887000, 선금: 224000000, 조정률: 3.46 }).공제 === 1962000)
ok('선금 공제 — 감액(조정률 < 0)이면 0 (증가액에서만 · 시행령 제64조③ · 지방 제73조③)', E.선금공제셈({ 금차계약: 1e9, 금차제외: 0, 선금: 3e8, 조정률: -3.5 }).공제 === 0)
ok('선금 공제 — 선금 없으면 0 · 금차분 0 이면 선금률 0', E.선금공제셈({ 금차계약: 1e9, 금차제외: 0, 선금: 0, 조정률: 4 }).공제 === 0 && E.선금공제셈({ 금차계약: 0, 선금: 1e8, 조정률: 4 }).선금률 === 0)
ok('경과일(견본 꼴 −1) — 2024-07-22 → 2026-01-01 = 527', E.경과일('2024-07-22', '2026-01-01') === 527)
ok('경과일 — 날 없으면 null', E.경과일('', '2026-01-01') === null)

console.log('■ ④ 🧪 예시(가상 들말지구)')
const R = E.ESC셈(예시입력)
ok('예시 — 금차분 계약 = 계약 도급액(한 해 계약)', 예시입력.선금.금차계약 === R.금액.B, [예시입력.선금.금차계약, R.금액.B])
ok('예시 — 금차분 제외 = 제외 도급액', 예시입력.선금.금차제외 === R.금액.C, [예시입력.선금.금차제외, R.금액.C])
ok('예시 — 조정률 5.54% · 3% 넘음 · 90일 넘음', R.조정.조정률 === 5.54 && R.요건.률3 && R.요건.경과90, [R.조정.조정률, R.날.경과])
ok('예시 — G = TRUNC(A × D, −3) · 적용금액 = G − F − H', R.금액.G === E.버림(5.54 / 100 * R.금액.D, -3) && R.금액.적용금액 === R.금액.G - R.금액.F - R.금액.H, R.금액)
ok('예시 — 경고 없음 · 품목 22줄', R.경고.length === 0 && R.줄들.filter((x) => !x.머리).length === 22, R.경고)
ok('예시 — 적용대가(D) = 계약 − 제외 · 조정율 바탕 = 계약 − 빠른 − P/S', R.금액.D === R.비목.계약.도급액 - R.비목.제외.도급액 && R.조정.바탕 === R.비목.계약.도급액 - R.비목.빠른.도급액 - R.비목.PS.도급액)
try { execFileSync(process.execPath, [path.join(여기, 'build_물가ESC예시화면.mjs'), '--check'], { stdio: 'pipe' }); ok('예시화면 파일이 지금 엔진 · 예시와 같음(--check)', true) } catch (e) { ok('예시화면 파일이 지금 엔진 · 예시와 같음(--check)', false, String(e.stdout || e.message).slice(0, 200)) }
const 화 = (await 불러('data/물가ESC_예시화면.js')).예시화면
ok('예시화면 — 값만(수식 · 셈 글 없음)', !/TRUNC|ROUND|=SUM|원가사슬/.test(JSON.stringify(화)))
ok('예시화면 — 조정률 · 적용금액이 셈과 같음', 화.조정률 === R.조정.조정률 && 화.금액.적용금액 === R.금액.적용금액)

console.log('■ ⑤ 엑셀')
const 바 = X.ESC엑셀(예시입력, R)
const 장 = Object.keys(unzipSync(바)).filter((k) => /worksheets\/sheet\d+\.xml$/.test(k)).length
ok('엑셀 7장(입력 · 2 조정금액 · 조정율 · 4 품목 · 5 적용대가 · 6 공정 · 12_4 선금)', 장 === 7, 장)
const 읽은 = L.ESC읽기(바)
const R2 = E.ESC셈(읽은.입력)
ok('다시 읽기(건설맵 꼴) → 같은 결과', 읽은.꼴 === '건설맵' && R2.조정.조정률 === R.조정.조정률 && R2.금액.적용금액 === R.금액.적용금액 && R2.금액.D === R.금액.D && R2.줄들.length === R.줄들.length && 읽은.경고.length === 0, { 꼴: 읽은.꼴, 경고: 읽은.경고, a: R2.금액 })
const 빈입 = { 이름: '', 품목: [] }
const 빈 = L.ESC읽기(X.ESC엑셀(빈입, E.ESC셈(빈입), { 빈줄: 60 }))
ok('빈 틀(60줄) 다시 읽기 → 품목 0 · 셈 됨', 빈.입력.품목.length === 0 && E.ESC셈(빈.입력).금액.적용금액 === 0, 빈.입력.품목.length)
let 리브레 = ''
try { 리브레 = execFileSync('sh', ['-c', 'command -v soffice || command -v libreoffice'], { encoding: 'utf8' }).trim() } catch { 리브레 = '' }
if (!리브레) console.log('  · 리브레오피스 없음 — 엑셀 다시 셈 견주기 건너뜀')
else {
  const 곳 = fs.mkdtempSync(path.join(os.tmpdir(), 'esc-'))
  const z = unzipSync(바)
  for (const k of Object.keys(z)) if (/worksheets\/sheet\d+\.xml$/.test(k)) z[k] = strToU8(strFromU8(z[k]).replace(/(<\/f>)<v>[^<]*<\/v>/g, '$1'))
  fs.writeFileSync(path.join(곳, 'esc.xlsx'), zipSync(z))
  fs.mkdirSync(path.join(곳, 'lo'))
  execFileSync(리브레, ['--headless', '--calc', '--convert-to', 'xlsx', '--outdir', path.join(곳, 'lo'), path.join(곳, 'esc.xlsx')], { stdio: 'pipe', timeout: 180000 })
  /* 리브레가 다시 셈한 값(캐시)을 읽어 — 우리가 넣은 캐시(사이트 셈)와 칸마다 견줌 */
  const 셈칸 = (u8) => {
    const zz = unzipSync(u8), 공 = []
    const ss = zz['xl/sharedStrings.xml'] ? [...strFromU8(zz['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => [...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join('')) : []
    const 시 = Object.keys(zz).filter((k) => /worksheets\/sheet\d+\.xml$/.test(k)).sort()
    for (const k of 시) {
      const 칸 = {}
      for (const m of strFromU8(zz[k]).matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const 안 = m[3] || '', t = (/ t="([^"]+)"/.exec(m[2]) || [])[1]
        const f = /<f[\s>/]/.test(안), v = (/<v>([^<]*)<\/v>/.exec(안) || [])[1]      /* 리브레는 <f aca="false"> 꼴 */
        if (!f) continue
        칸[m[1]] = v === undefined ? null : t === 's' ? ss[+v] : t === 'str' ? v : Number(v)
      }
      공.push(칸)
    }
    return 공
  }
  const 우리 = 셈칸(바), 그쪽 = 셈칸(fs.readFileSync(path.join(곳, 'lo', 'esc.xlsx')))
  let 같 = 0, 다 = 0
  const 다름 = []
  우리.forEach((칸, i) => {
    for (const [ref, v] of Object.entries(칸)) {
      if (v === null) continue
      const w = 그쪽[i] ? 그쪽[i][ref] : undefined
      if (typeof v === 'number' && typeof w === 'number' && Math.abs(v - w) <= 1e-9 * Math.max(1, Math.abs(v))) 같++
      else { 다++; if (다름.length < 5) 다름.push([i, ref, v, w]) }
    }
  })
  ok(`리브레오피스가 다시 셈한 수식 칸 ${같.toLocaleString()}곳 모두 사이트 셈과 같음`, 다 === 0 && 같 > 1000, { 같, 다, 다름 })
  fs.rmSync(곳, { recursive: true, force: true })
}

console.log('■ ⑥ 글')
/* 실제 현장 · 상호 · 사람 이름 24개는 저장소(공개)에 글로 두지 않고 SHA-256 앞 16자리로만 둠 — 글의 2~5글자 조각을 모두 같은 셈으로 견줌 */
const 금지 = new Set(['43c3e16fcde948b1', 'aeaa539cae04b4c8', '358b83168abc3caf', '5872e2232b0f17e6', '80855052295e2add', '60020fffcd3cd383', '0b8fd8dd92264c3d', '7546a87fe866b919',
  '56375ec727f7926a', '0bd5dff465009a58', '6779ffc75828fe32', 'cad0e0048b3eb2a2', 'd9dc24696a111a38', 'c3ca4814f78dc958', '8166777485d1c07c', '3ffd12c46732a8df',
  '2779ac3429a6dc0e', '6da8fb63e10d8df5', '50a007ab89ba5e25', '29f8dbff131e231b', '5ff6a24b46c5e3c2', '57f10c0061ee4d6a', 'fb0b1b6daef18bb1', '49f8aa0f20d12bb4'])
const { createHash } = await import('node:crypto')
const 실제 = { test: (t) => { for (const L of [2, 3, 4, 5]) for (let i = 0; i + L <= t.length; i++) if (금지.has(createHash('sha256').update(t.slice(i, i + L)).digest('hex').slice(0, 16))) return true; return false } }
const 글들 = ['data/물가ESC_예시입력.js', 'data/물가ESC_예시화면.js', 'pages/Esc.jsx', 'lib/물가ESC.js', 'lib/물가ESC엑셀.js', 'lib/물가ESC읽기.js'].map((p) => [p, fs.readFileSync(path.join(웹, p), 'utf8')])
for (const [p, t] of 글들) ok(`${p} — 실제 현장 · 사람 이름 없음`, !실제.test(t))
ok('이름 견주기가 걸러 내는지(지어낸 글에 넣어 봄)', 실제.test('가상 ' + String.fromCharCode(0xC1A1, 0xAE08) + '지구') && !실제.test('가상 들말지구 배수개선사업'))
const 화면글 = fs.readFileSync(path.join(웹, 'pages/Esc.jsx'), 'utf8')
ok('화면 — «무료» · «클로드» 없음', !/무료|클로드/.test(화면글))

console.log(`\n${bad ? '❌' : '✅'} 시험_물가ESC ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
