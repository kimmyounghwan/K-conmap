/**
 * 🦺 G538 (2026-11-04) 서식 «공사안전보건대장»(고시 별지 제3호서식) — 인터넷 · 빌드 · playwright 없이(PC 올리기 시험에도)
 *   node tools/시험_공사안전보건대장.mjs
 *   소장님 «도구화 후보» ② · 「원본 그대로」 · 「계속 사이트 찾게 해야 해」
 *   ① 서식 목록(forms.json): 근거 4 · 다음에 쓸 서류 링크(설계안전보건대장 · 유해위험방지계획서) · «무료» · «클로드» 없음 · 미리보기 6 · PDF
 *   ② 격자(/forms/g): 시트 12 · 원본 그대로 □(U+25A1) · ■ — ☐ · ☑ 없음 · «예 · 아니오» 고르는 칸 · 첨부 서식 머리 «□»
 *   ③ 사진 칸: 격자작성.jsx 와 같은 규칙으로 셈 → 이 서식 «3.» 네 칸만 · 머리글마다 장비 그림(사진예시.js) · 다른 서식 사진 칸은 그대로(규칙을 넓혀도 안 늘어남)
 *   ④ 공통 칸: 착공일 · 준공일 · 공사명 · 현장주소 · 발주자 · 회사명 · 대표자 · 전화번호는 공통 · «공사기간표시» 는 공통 아님(판정 장 셈이 안 끊기게)
 *   ⑤ 서식 탭 ② 착공 · «착공할 때» 꾸러미 · 찾기(forms-min · 더말) · 안전 화면 ④ 링크 · 빈 틀 엑셀 · PDF · 예시 그림 파일
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 판짜기 } from '../web/src/lib/격자그림.js'
import { 자리글 } from '../web/src/lib/엑셀셈.js'
import { 그림종류 } from '../web/src/lib/사진예시.js'
import { 목록만들기, 찾기 } from '../web/src/lib/빠른찾기.js'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 읽 = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const 있 = (p) => fs.existsSync(path.join(ROOT, p))
let 통과 = 0, 실패 = 0
const 봐 = (c, 무엇, 더 = '') => { if (c) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더 ? '— ' + String(더).slice(0, 300) : '') } }
const SLUG = 'gongsa-anjeon-daejang'

console.log('① 서식 목록(forms.json)')
const F = JSON.parse(읽('web/src/data/forms.json')).forms
const f = F.find((x) => x.slug === SLUG)
봐(!!f && f.title === '공사안전보건대장' && f.gen === 'forms2' && f.group === '안전', '서식 «공사안전보건대장» · forms2 · 안전', f && [f.title, f.gen, f.group])
const 글 = JSON.stringify(f || {})
봐(!/무료/.test(글) && !/클로드/.test(글), '«무료» · «클로드» 안 씀')
봐(f && f.guide && f.guide.law.length === 4 && /제67조/.test(f.guide.law[0][0]) && /제2024-35호/.test(f.guide.law[3][0]) && f.guide.law.every((x) => /^https:\/\/www\.law\.go\.kr\//.test(x[2])), '근거 4(법 제67조 · 시행령 · 시행규칙 제86조 · 고시 제2024-35호) — 국가법령정보센터 주소')
봐(/착공 전날/.test(f.when) && /50억 원 이상/.test(f.when) && /3개월/.test(f.when), '«언제 내나» — 50억 원 이상 · 착공 전날 · 3개월마다 확인')
봐(f.notes.some((n) => n.includes('[설계안전보건대장](/forms/seolgye-anjeon-daejang)')) && f.notes.some((n) => n.includes('[유해위험방지계획서](/forms/yuhae-gyehoek)')), '«놓치기 쉬운 것» — 설계안전보건대장 · 유해위험방지계획서 링크')
const 설 = F.find((x) => x.slug === 'seolgye-anjeon-daejang')
봐(설 && 설.notes.some((n) => n.includes('[공사안전보건대장](/forms/gongsa-anjeon-daejang)')), '설계안전보건대장 → 공사안전보건대장 링크(되돌아오는 길)')
봐(f.prev && f.prev.length === 6 && f.prev.every((p) => 있('web/public' + p)) && f.pdf && 있('web/public' + f.pdf), '미리보기 6장 · 인쇄용 PDF 파일 있음', f.prev)
봐(f.guide.at === '2026-11-04', '확인한 날 2026-11-04')

console.log('② 격자 — 원본 그대로 □ · ■')
const DOC = JSON.parse(읽(`web/public/forms/g/${SLUG}.json`))
const 이름들 = DOC.sheets.map((s) => s.name)
봐(JSON.stringify(이름들) === JSON.stringify(['판정', '사업개요', '거푸집동바리', '가설흙막이', '비계', '기타장비', '장비확인자', '작성방법', '첨부1', '첨부2', '첨부3', '확인']), '시트 12(판정 · 대장 7쪽 · 첨부 서식 1 ~ 3 · 확인)', 이름들)
const 격글 = JSON.stringify(DOC)
봐(!/[☐☑]/.test(격글), '☐ · ☑ 없음(원본은 □ · ■)')
const 칸 = (시트, 열쇠) => { const si = 이름들.indexOf(시트), s = DOC.sheets[si]; const a = Object.keys(s.keys).find((k) => s.keys[k] === 열쇠 && !k.includes(':')); if (!a) return null; const m = /^([A-Z]+)(\d+)$/.exec(a); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return s.cells.find((x) => x[0] === +m[2] && x[1] === c) }
for (const k of ['위방대상', '기술지도']) {
  const x = 칸('사업개요', k)
  봐(!!x && x[5] === 1 && x[6] === '□ 예          □ 아니오' && Array.isArray(x[9]) && JSON.stringify(x[9]) === JSON.stringify(['■ 예          □ 아니오', '□ 예          ■ 아니오']), `«${k}» — 빈칸 «□ 예 □ 아니오» · 고르면 ■`, x)
}
for (const t of ['□ 안전보건대장 적정성 확인 결과', '□ 건설현장 지도·점검별 지적사항 및 조치사항', '□ 수급인별 사고사망만인율 확인서', '[별지 제3호 서식]', '(2) 설계도서 및 구조검토 결과', '(1) 유해ㆍ위험요인 및 위험성 감소방안'])
  봐(격글.includes(t), `원본 글 «${t}»`)
봐(/"1!C8":"■ 예          □ 아니오"/.test(격글) && /"1!G8":"□ 예          ■ 아니오"/.test(격글), '예시 값 — 유해위험방지계획서 ■ 예 · 기술지도계약 ■ 아니오')

console.log('③ 사진 칸 — 격자작성.jsx 규칙 그대로')
const 화면 = 읽('web/src/tools/격자작성.jsx')
const 꼴글 = (화면.match(/if \(머리 && \/(.+?)\/\.test\(머리\)\) out\.set\(x, 머리\)/) || [])[1]
봐(꼴글 === '사진|배치 위치 및 (작업구간|이동 경로)', '사진 칸 머리글 꼴 «사진 | 배치 위치 및 (작업구간 | 이동 경로)»', 꼴글)
const 꼴 = new RegExp(꼴글 || 'x^')
function 사진칸들(doc, re) {
  const out = []
  doc.sheets.forEach((sh, si) => {
    const 판 = 판짜기(sh), 덮 = new Map()
    for (const x of sh.cells) for (let i = x[0]; i < x[0] + x[2]; i++) for (let j = x[1]; j < x[1] + x[3]; j++) 덮.set(i * 16384 + j, x)
    for (const x of sh.cells) {
      if (x[5] !== 1 || x[1] > sh.pc || Array.isArray(x[9]) || (x[6] !== null && x[6] !== undefined && x[6] !== '' && !자리글({ v: x[6], nf: x[8] }))) continue
      if (판.Y[x[0] + x[2] - 1] - 판.Y[x[0] - 1] < 25) continue
      let 머리 = null
      for (let r = x[0] - 1; r >= 1; r--) { const y = 덮.get(r * 16384 + x[1]); if (!y || y === x) continue; if (y[5] === 1 || y[5] === 3) continue; const t = String(y[6] ?? '').trim(); if (t) { 머리 = t; break } }
      if (머리 && re.test(머리)) out.push([si, x[0], x[1], 머리])
    }
  })
  return out
}
const 이것 = 사진칸들(DOC, 꼴)
const 머리들 = 이것.map((q) => q[3])
봐(JSON.stringify(머리들) === JSON.stringify(['1) 타워크레인 배치 위치 및 작업구간', '2) 콘크리트 펌프카 배치 위치 및 이동 경로', '3) 이동식크레인 배치 위치 및 이동 경로', '4) 항타·항발기 배치 위치 및 이동 경로']),
  '사진 칸 4 — «3.» 타워크레인 · 펌프카 · 이동식크레인 · 항타·항발기', 머리들)
봐(이것.every((q) => 이름들[q[0]] === (q[3].startsWith('1)') || q[3].startsWith('2)') ? '기타장비' : '장비확인자')), '사진 칸 자리 — 기타장비 장 둘 · 장비확인자 장 둘')
const 종류 = 머리들.map(그림종류)
봐(JSON.stringify(종류) === JSON.stringify(['장비 배치 · 타워크레인', '장비 배치 · 콘크리트 펌프카', '장비 배치 · 이동식크레인', '장비 배치 · 항타·항발기']), '«예시 채우기» 그림 — 칸마다 그 장비 배치도(현장 사진 아님)', 종류)
const 그림글 = 읽('web/src/lib/사진예시.js')
봐(종류.every((t) => t && 그림글.includes(`'${t}': { w: 2160, h: 880`)), '네 그림 모두 사진예시.js 에 있음(2160 × 880)')
봐(그림종류('타워크레인 사진') === null && 그림종류('공사장 위치도') === '공사장 위치도' && 그림종류('방음 · 방진시설 배치 도면') === '방음 · 방진시설 배치', '다른 머리글 그림은 그대로(«타워크레인 사진» 은 현장 사진)')
let 다른늘어남 = []
for (const 이름 of fs.readdirSync(path.join(ROOT, 'web/public/forms/g'))) {
  if (!이름.endsWith('.json') || 이름 === SLUG + '.json') continue
  const d = JSON.parse(읽('web/public/forms/g/' + 이름))
  if (!d.sheets) continue
  const a = 사진칸들(d, 꼴).length, b = 사진칸들(d, /사진/).length
  if (a !== b) 다른늘어남.push([이름, b, a])
}
봐(!다른늘어남.length, '다른 서식 사진 칸 수 그대로(넓힌 꼴이 이 서식에만 걸림)', JSON.stringify(다른늘어남))
봐(['tower', 'pump', 'mobile', 'pile'].every((n) => 있(`tools/forms2/img/${SLUG}/${n}.png`) && fs.statSync(path.join(ROOT, `tools/forms2/img/${SLUG}/${n}.png`)).size < 80000), '종이 작성 예시 그림 4(엑셀 · PDF 예시 장 — 80 KB 아래)')

console.log('④ 공통 칸 — 다른 서식에 한 번 쓴 값')
const 공통꼴 = [...화면.matchAll(/\['([^']+)', \/(\^\([^/]+\)\$)\/\]/g)].map((m) => [m[1], new RegExp(m[2])])
const 공통 = (k) => { const x = 공통꼴.find(([, re]) => re.test(k)); return x ? x[0] : null }
봐(공통꼴.length >= 10, `격자작성.jsx 공통칸 표 ${공통꼴.length}줄`)
for (const [시트, k, 갈] of [['판정', '착공일', '착공'], ['판정', '준공일', '준공'], ['사업개요', '공사명', '현장'], ['사업개요', '현장주소', '위치'], ['사업개요', '발주자', '발주'], ['사업개요', '회사명', '회사'], ['사업개요', '대표자', '대표'], ['사업개요', '전화번호', '연락처']])
  봐(!!칸(시트, k) && 공통(k) === 갈, `${시트} «${k}» → 공통 «${갈}»`)
봐(!!칸('사업개요', '공사기간표시') && 칸('사업개요', '공사기간표시')[5] === 3 && 공통('공사기간표시') === null && !칸('사업개요', '공사기간'), '«공사기간표시» 는 공통 아님 — ① 판정 장 착공 · 준공에서 셈(덮어쓰지 않음)')
봐(['설회사', '발전화', '시주소'].every((k) => !!칸('사업개요', k) && 공통(k) === null), '설계자 회사 · 발주자 전화 · 시공자 주소는 공통 아님(남의 값이 섞이지 않게)')

console.log('⑤ 서식 탭 · 찾기 · 안전 화면 · 파일')
const 탭 = JSON.parse(읽('web/src/data/forms_tab.json'))
const 착 = 탭.stages.find((s) => s.k === 'start')
봐(착 && 착.slugs.indexOf(SLUG) === 착.slugs.indexOf('seolgye-anjeon-daejang') + 1, '서식 탭 ② 착공 — 설계안전보건대장 다음')
봐(탭.stages.filter((s) => s.slugs.includes(SLUG)).length === 1, '서식 탭 한 곳에만')
const 꾸 = 탭.packs.find((x) => x.k === 'start')
봐(꾸 && 꾸.items.some((it) => it.s === SLUG && it.d === '공사안전보건대장 — 총공사금액 50억 원 이상 · 착공 전날까지'), '«착공할 때» 꾸러미에 — 50억 원 이상 · 착공 전날까지')
const 탭원 = 읽('tools/forms2/tab.py')
봐(탭원.includes(' seolgye-anjeon-daejang gongsa-anjeon-daejang ') && 탭원.includes("('gongsa-anjeon-daejang', '공사안전보건대장 — 총공사금액 50억 원 이상 · 착공 전날까지')"), 'tab.py 에도 같게(다음에 다시 만들어도 안 빠짐)')
const 작 = JSON.parse(읽('web/src/data/forms-min.json'))
봐(작[SLUG] && 작[SLUG][0] === '공사안전보건대장' && 작[SLUG][3] === '안전', 'forms-min(맨 위 찾기 · 설계변경 · 내역서 탭) 에 있음')
const 목록 = 목록만들기({ forms: 작, tools: JSON.parse(읽('web/src/data/tools.json')), change: JSON.parse(읽('web/src/data/change.json')), guide: JSON.parse(읽('web/src/data/guide.json')) })
for (const q of ['공사안전보건대장', '안전보건대장', '타워크레인 배치', '이행 확인', '별지 제3호'])
  봐(찾기(목록, q).slice(0, 3).some((x) => x.to === '/forms/' + SLUG), `맨 위 찾기 «${q}» → 공사안전보건대장`)
봐(/to="\/forms\/gongsa-anjeon-daejang">🦺 공사안전보건대장/.test(읽('web/src/pages/Safety.jsx')), '안전 화면 ④ 안전보건대장 칸 → 이 서식 링크')
const 엑 = fs.readFileSync(path.join(ROOT, `web/public/forms/${SLUG}.xlsx`))
봐(엑[0] === 0x50 && 엑[1] === 0x4b && (엑.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 12, '빈 틀 엑셀(zip · 시트 12)', 엑.length)
봐(/공사안전보건대장/.test(읽('tools/formscheck.py')), 'formscheck 목록에도')

console.log(`\n${실패 ? '✗' : '✓'} 시험_공사안전보건대장 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
