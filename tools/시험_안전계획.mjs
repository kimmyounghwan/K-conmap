// 🧪 안전관리계획서 한 벌(lib/안전계획.js) — G638 (2026-11-10)
//   node tools/시험_안전계획.mjs
//   소장님: 「목차 표지 말고 300백 페이지 이상 되는 거」 · 「견본대로 해」 · 「앞으로 조문은 3번씩 확인해」
//   ① 예시(가상 공사) 한 벌 — 300쪽 넘게 · 빈 글(준비 중 · undefined · NaN) 없음 · 목차 쪽 번호
//   ② 칸이 쪽 밖으로 나가거나 겹치지 않음(엑셀 · 한글 · 워드는 칸을 표로 바꿈 — 흐름도 화살표는 빼고 셈)
//   ③ 확인한 조문 값이 그대로 들어감 · 확인 못 한 값(80% · 30분 · 최상부 2단 · 흙막이 7일 · 제208조)은 없음
//   ④ 공종을 빼면 그 공종 세부계획이 «해당 사항 없음» · 서식 · 점검표도 빠짐
//   ⑤ 간이 검토 셈(크레인 사용률 · 줄 장력 · 접지압 · 와이어로프 안전계수)
//   ⑥ 같은 입력 → 같은 쪽 · 파일(PDF · 한글 · 워드 · 엑셀)이 만들어짐
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, strFromU8 } from '../web/node_modules/fflate/esm/index.mjs'
import * as A from '../web/src/lib/안전계획.js'
import { 안전계획예시 } from '../web/src/lib/안전계획예시.js'
import { 쪽들한글 } from '../web/src/lib/쪽한글.js'
import { 쪽들워드 } from '../web/src/lib/쪽워드.js'
import { 엑셀책, 쪽들시트 } from '../web/src/lib/쪽엑셀.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
let ok = 0, bad = 0
const 확인 = (무엇, 참, 더 = '') => { if (참) { ok++; console.log('  ✓', 무엇) } else { bad++; console.log('  ✗', 무엇, String(더).slice(0, 300)) } }
const 글모두 = (r) => r.쪽들.map((p) => p.칸들.map((c) => c.글 || '').join('\n')).join('\n')

console.log('① 예시 한 벌')
const r = A.안전계획만들기(안전계획예시)
const 전부 = 글모두(r)
확인('300쪽 넘게', r.쪽들.length >= 300, r.쪽들.length)
확인('수립 대상 판정 — 제2호 · 제3호 · 제5호 나목 · 다목 · 제5호의2', r.판정.대상 && ['제2호', '제3호', '제5호 나목', '제5호 다목', '제5호의2'].every((h) => r.판정.해당.some((x) => x.호 === h)), r.판정.해당.map((x) => x.호).join(','))
for (const [이름, re] of [['준비 중', /준비 중/], ['undefined', /undefined/], ['NaN', /NaN/], ['[object', /\[object/], ['null', /\bnull\b/], ['«표 … 준비»', /\(표 «/]]) 확인(`«${이름}» 글이 없음`, !re.test(전부), (전부.match(new RegExp('.{0,30}' + re.source + '.{0,30}')) || [''])[0])
확인('목차 — 모든 줄에 쪽 번호', r.목차.length > 80 && r.목차.every((m) => m.쪽), r.목차.filter((m) => !m.쪽).map((m) => m.글).slice(0, 3).join(' | '))
확인('목차 — 쪽 번호가 앞에서 뒤로 커짐', r.목차.every((m, i) => i === 0 || m.쪽 >= r.목차[i - 1].쪽))
확인('목차 첫 줄은 제1장 · 1쪽(간지)', r.목차[0].글.startsWith('제1장') && r.목차[0].쪽 === 1, JSON.stringify(r.목차[0]))
for (const 제목 of ['가. 건설공사의 개요', '나. 현장 특성 분석', '다. 현장운영계획', '라. 비상시 긴급조치계획', '제2장', '별첨']) 확인(`차례 «${제목}»`, r.목차.some((m) => m.글.replace(/\s+/g, ' ').startsWith(제목)))
확인('공종 여덟 가지 세부계획(가. ~ 아.)', ['가설공사', '굴착공사', '콘크리트공사', '강구조물공사', '성토', '해체공사', '건축설비공사', '타워크레인'].every((t) => r.목차.some((m) => m.단 === 2 && m.글.includes(t))))
확인('가로 쪽(31일 일일 점검표)', r.쪽들.filter((p) => p.폭 > p.높이).length >= 8, r.쪽들.filter((p) => p.폭 > p.높이).length)
확인('쪽 번호 — 표지 · 확인 · 목차 빼고 1부터 차례로', (() => { const 번 = r.쪽들.map((p) => p.번호).filter(Boolean); return 번[0] === 1 && 번.every((n, i) => i === 0 || n === 번[i - 1] + 1) })())
확인('그림 · 도면 · 사진 자리 목록', r.자리들.length >= 60 && r.자리들.every((x) => x.이름 && x.쪽 >= 0), r.자리들.length)
확인('가상 이름만(«가상»)', /가상 김현장/.test(전부) && /\(주\)가상건설/.test(전부))

console.log('② 칸 — 쪽 밖 · 겹침')
let 밖 = 0, 겹 = 0
r.쪽들.forEach((p) => {
  for (const c of p.칸들) if (c.x < -0.1 || c.y < -0.1 || c.x + c.w > p.폭 + 0.1 || c.y + c.h > p.높이 + 0.1) 밖++
  const k = p.칸들.filter((c) => c.글 !== '▼' && c.w > 0.5 && c.h > 0.5)
  for (let a = 0; a < k.length; a++) for (let b = a + 1; b < k.length; b++) {
    const ox = Math.min(k[a].x + k[a].w, k[b].x + k[b].w) - Math.max(k[a].x, k[b].x), oy = Math.min(k[a].y + k[a].h, k[b].y + k[b].h) - Math.max(k[a].y, k[b].y)
    if (ox > 0.3 && oy > 0.3) 겹++
  }
})
확인('쪽 밖으로 나간 칸 0', 밖 === 0, 밖)
확인('겹친 칸 0(흐름도 화살표 빼고)', 겹 === 0, 겹)

console.log('③ 조문 값(law.go.kr 세 번 확인한 것)')
for (const [무엇, 글] of [
  ['비계기둥 띠장 방향 1.85m(규칙 제60조)', '1.85m 이하'], ['장선 방향 1.5m', '1.5m 이하'], ['띠장 간격 2.0m', '2.0m 이하'], ['적재하중 400kg', '400kg 이하'],
  ['안전난간 90cm · 10cm(제13조)', '90cm 이상'], ['발끝막이판 10cm', '10cm 이상'], ['낙하물방지망 20~30°(제14조)', '20° 이상 30° 이하'],
  ['추락방호망 12%(제42조)', '12% 이상'], ['충전전로 300cm(제322조)', '300cm 이상'], ['누전차단기 30mA · 0.03초(제304조)', '30mA'],
  ['발파 도통 30m(제348조)', '30m 이상 떨어진'], ['발파 5분 · 15분', '5분 이상'], ['타워크레인 10 · 15m/s(제37조)', '15m/s'], ['철골 10m/s · 1mm · 1cm(제383조)', '1cm/h'],
  ['와이어로프 안전계수 5(제211조)', '안전계수 5'], ['드럼 2회(제212조)', '2회 감기고'], ['순회점검 2일에 1회(시행규칙 제80조)', '2일에 1회'], ['협의체 매월 1회(시행규칙 제79조)', '매월 1회'],
  ['굴착면 기울기 모래 1:1.8(별표 11)', '1 : 1.8'], ['적정공기 18%(제618조)', '18%'],
]) 확인(무엇, 전부.includes(글), 글)
for (const [무엇, re] of [['정격하중의 80%', /80\s*%/], ['30분(불씨 확인)', /30분/], ['최상부 2단', /최상부\s*2단/], ['흙막이 7일', /7일마다|7일 이내 점검/], ['삭제된 제208조', /제208조/], ['«건설맵» 이 서류 안에', /건설맵/], ['«프로그램»', /프로그램/]])
  확인(`없음 — ${무엇}`, !re.test(전부), (전부.match(new RegExp('.{0,30}' + re.source + '.{0,30}')) || [''])[0])

console.log('④ 공종 빼기')
const 넷 = A.안전계획만들기({ 공사: { 공사명: '시험', 착공: '2027-03-02', 준공: '2027-12-30' }, 공종: { 가설: { 비계: true }, 콘크리트: true } })
const 넷글 = 글모두(넷)
확인('없는 공종은 «해당 사항 없음»', (넷글.match(/해당 사항 없음/g) || []).length >= 6, (넷글.match(/해당 사항 없음/g) || []).length)
확인('없는 공종 작업계획서 없음(굴착 · 해체)', !/작업계획서 — 굴착작업/.test(넷글) && !/구축물등의 해체작업/.test(넷글))
확인('있는 공종 작업계획서(굴착작업 · 구축물등의 해체작업 · 중량물 · 타워크레인)', ['굴착작업', '구축물등의 해체작업', '중량물의 취급 작업', '타워크레인을 설치 · 조립 · 해체하는 작업'].every((t) => 전부.includes('작업계획서 — ' + t)))
확인('있는 공종 31일 점검표(가설 · 콘크리트)', /비계 일일 안전점검표/.test(넷글) && /일일 안전점검표/.test(넷글))
확인('크레인을 안 고르면 크레인 간이 검토 없음', !/이동식 크레인 인양 하중 검토/.test(넷글))
확인('그래도 빈 글 없음', !/준비 중|undefined|NaN/.test(넷글))

console.log('⑤ 간이 검토 셈')
확인('크레인 사용률 4.8 ÷ 9.8 = 49%', /4\.8 ÷ 9\.8 × 100 = 49 %/.test(전부))
확인('줄 1가닥 장력 4.2 ÷ (2 × cos30°) = 2.42t', /= 2\.42 t/.test(전부))
확인('접지압 294.3 ÷ 1.44 = 204.4 kN/㎡', /294\.3 ÷ 1\.44 = 204\.4/.test(전부))
확인('와이어로프 안전계수 42 ÷ 7.5 = 5.6', /42 ÷ 7\.5 = 5\.6/.test(전부))
const 나쁨 = A.안전계획만들기({ ...안전계획예시, 검토: { ...안전계획예시.검토, 크레인: { ...안전계획예시.검토.크레인, 인양물: 12 } } })
확인('정격 넘으면 «정격 초과»', /정격 초과/.test(글모두(나쁨)))

console.log('⑥ 같은 입력 → 같은 결과 · 파일')
const 또 = A.안전계획만들기(안전계획예시)
확인('두 번 만들어도 같음', JSON.stringify(또.쪽들) === JSON.stringify(r.쪽들))
const 그림들 = new Map()
/* PDF 는 pdf-lib 가 있을 때만(리허설 · Windows 흉내 자리에는 fflate 만 있음 — 그때는 건너뜀) */
let pdf = null
try {
  const { 쪽들PDF, 환경 } = await import('../web/src/lib/쪽pdf.js')
  환경.글꼴 = new Uint8Array(fs.readFileSync(path.join(여기, '../web/public/fonts/KCMGothic.ttf')))
  pdf = await 쪽들PDF(r.쪽들, 그림들, { 제목: '안전관리계획서' })
} catch (e) { if (!/pdf-lib|fontkit|ERR_MODULE_NOT_FOUND|Cannot find/.test(String(e?.message || e) + (e?.code || ''))) throw e; console.log('  · PDF 건너뜀(pdf-lib 없음)') }
if (pdf) 확인('PDF', strFromU8(pdf.slice(0, 5)) === '%PDF-' && pdf.length > 300000, pdf.length)
const hw = unzipSync(쪽들한글(r.쪽들, 그림들, { 제목: '안전관리계획서' }))
확인('한글 — 구역 여러 개(세로 · 가로)', Object.keys(hw).filter((k) => /Contents\/section\d+\.xml/.test(k)).length >= 3)
const 워 = unzipSync(쪽들워드(r.쪽들, 그림들, { 제목: '안전관리계획서' }))
확인('워드 — 가로 구역 포함', /w:orient="landscape"/.test(strFromU8(워['word/document.xml'])))
const 무리 = []
for (const p of r.쪽들) { const 가 = p.폭 > p.높이; if (!무리.length || 무리[무리.length - 1].가 !== 가) 무리.push({ 가, 쪽들: [] }); 무리[무리.length - 1].쪽들.push(p) }
const 엑 = unzipSync(엑셀책(무리.map((g, i) => 쪽들시트(g.쪽들, 그림들, `${i + 1} ${g.가 ? '점검표(가로)' : '계획서'}`.slice(0, 30))), 그림들))
확인('엑셀 — 용지 바뀔 때마다 시트', Object.keys(엑).filter((k) => /xl\/worksheets\/sheet\d+\.xml/.test(k)).length === 무리.length, 무리.length)
if (process.env.OUT && pdf) { fs.mkdirSync(process.env.OUT, { recursive: true }); fs.writeFileSync(path.join(process.env.OUT, '안전관리계획서_예시.pdf'), pdf); console.log('  → ', process.env.OUT) }

console.log(`\n${bad ? '✗' : '✓'} 통과 ${ok} · 실패 ${bad}`)
process.exit(bad ? 1 : 0)
