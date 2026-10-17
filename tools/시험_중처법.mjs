/* 🛡 중대재해 안전보건관리체계 한 벌 (lib/중처법.js · 2026-10-17) 시험
     node tools/시험_중처법.mjs          OUT=폴더 를 주면 예시 PDF · 한글 · 워드 · 엑셀을 그 폴더에 둡니다(눈으로 보기) */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, strFromU8 } from '../web/node_modules/fflate/esm/index.mjs'
import * as J from '../web/src/lib/중처법.js'
import { 글맞춤 } from '../web/src/lib/쪽문서.js'
import { 쪽들PDF, 환경 as pdf환경 } from '../web/src/lib/쪽pdf.js'
import { 쪽들한글 } from '../web/src/lib/쪽한글.js'
import { 쪽들워드 } from '../web/src/lib/쪽워드.js'
import { 엑셀책, 쪽들시트 } from '../web/src/lib/쪽엑셀.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
pdf환경.글꼴 = new Uint8Array(fs.readFileSync(path.join(여기, '../web/public/fonts/KCMGothic.ttf')))
let ok = 0, bad = 0
const 확인 = (무엇, 참, 더 = '') => { if (참) { ok++; console.log('  ✓', 무엇) } else { bad++; console.log('  ✗', 무엇, 더) } }

console.log('① 판정 — 적용 · 전담 조직 · 안전관리자(별표 3)')
{
  확인('상시 4명 → 적용 안 됨', J.적용판정({ 상시: '4' }).됨 === false)
  확인('상시 5명 → 적용', J.적용판정({ 상시: '5' }).됨 === true)
  확인('상시 빈칸 → 모름', J.적용판정({ 상시: '' }).됨 === null)
  const h = (금액, 더 = {}) => J.안관판정({ 금액: String(금액), ...더 })
  확인('49억 → 0명', h(49).명 === 0)
  확인('50억 → 1명 · 겸직 가능', h(50).명 === 1 && h(50).전담 === false)
  확인('관계수급인 80억 → 0명(100억 미만)', h(80, { 하도: true }).명 === 0)
  확인('관계수급인 100억 → 1명', h(100, { 하도: true }).명 === 1)
  확인('건축 120억 → 1명 · 전담', h(120).명 === 1 && h(120).전담 === true)
  확인('토목 130억 → 전담 아님(150억 미만)', h(130, { 토목: true }).전담 === false)
  확인('토목 150억 → 전담', h(150, { 토목: true }).전담 === true)
  확인('800억 → 2명 · 1,500억 → 3명 · 2,200억 → 4명 · 3,000억 → 5명 · 3,900억 → 6명', h(800).명 === 2 && h(1500).명 === 3 && h(2200).명 === 4 && h(3000).명 === 5 && h(3900).명 === 6)
  확인('4,900억 이상 → 원문 보라(셈 안 함)', h(5000).명 === null)
  const 큰 = [{ 금액: '900' }, { 금액: '200' }]       // 2 + 1 = 3명
  확인('전담: 500명 · 인력 3명 → 대상', J.전담판정({ 상시: '520', 업종: '종합' }, 큰).대상 === true)
  확인('전담: 200위 이내 종합 · 인력 3명 → 대상', J.전담판정({ 상시: '120', 업종: '종합', 순위: '180' }, 큰).대상 === true)
  확인('전담: 200위 이내지만 전문 → 아님', J.전담판정({ 상시: '120', 업종: '전문', 순위: '180' }, 큰).대상 === false)
  확인('전담: 500명이지만 인력 2명 → 아님(3명 미만)', J.전담판정({ 상시: '600', 업종: '종합' }, [{ 금액: '900' }]).대상 === false)
  확인('전담: 작은 회사 → 아님', J.전담판정({ 상시: '30', 업종: '종합' }, []).대상 === false)
}

console.log('② 반기 셈')
{
  const 기록 = { '2026-상': { 3: { 날: '2026-06-20' }, 5: { 날: '2026-06-21' } } }
  const s = J.반기셈(기록, '2026-상', '2026-07-02')
  확인('한 것 2 / 7 · 마감 6/30 · 지남', s.한 === 2 && s.모두 === 7 && s.마감 === '2026-06-30' && s.지남 === true)
  확인('하반기 마감 12/31 · 안 지남', J.반기셈(기록, '2026-하', '2026-07-02').마감 === '2026-12-31' && J.반기셈(기록, '2026-하', '2026-07-02').지남 === false)
}

console.log('③ 예시 한 벌 — 서류 22가지 · 쪽 · 넘침')
const c = J.예시회사()
const 쪽들 = J.한벌(c, undefined, { 반기: `${c.기준년}-상` })
{
  확인('서류 목록 22가지', J.서류목록.length === 22)
  for (const d of J.서류목록) {
    const 덩 = J.서류덩이(d.키, c, { 반기: `${c.기준년}-상` })
    if (!덩.length) 확인(`서류 «${d.이름}» 덩이 있음`, false)
  }
  확인('서류마다 덩이가 있음', J.서류목록.every((d) => J.서류덩이(d.키, c).length > 0))
  확인(`쪽 수 20 ~ 60 (지금 ${쪽들.length})`, 쪽들.length >= 20 && 쪽들.length <= 60)
  let 넘침 = 0, 밖 = 0
  for (const p of 쪽들) {
    for (const k of p.칸들) {
      if (k.x < -0.01 || k.y < -0.01 || k.x + k.w > p.폭 + 0.01 || k.y + k.h > p.높이 + 0.01) 밖++
      if (k.글) { const m = 글맞춤(k.글, k.w, k.h, k.크기 || 9, !!k.굵게); if (m.줄들.some((z) => z.endsWith('…'))) 넘침++ }
    }
  }
  확인('쪽 밖으로 나간 칸 0', 밖 === 0, 밖)
  확인('글이 잘린(…) 칸 0', 넘침 === 0, 넘침)
  const 모든글 = 쪽들.flatMap((p) => p.칸들.map((k) => k.글 || '')).join('\n')
  확인('회사 이름이 들어감', 모든글.includes('예시건설(주)'))
  확인('현장 이름이 들어감', 모든글.includes('다라동 근린생활시설 신축공사'))
  확인('반기 점검 기록이 보고서에 들어감', 모든글.includes('현장 3곳 정기 · 수시 위험성평가 41건'))
  확인('135억 건축 현장 → 전담 판정 글', 모든글.includes('135억원 — 안전관리자 1명 이상 · 전담'))
  확인('32억 → 선임 의무 없음', 모든글.includes('선임 의무 없음'))
  확인('«무료» 낱말 없음', !모든글.includes('무료'))
  확인('«클로드» 낱말 없음', !/클로드|Claude/i.test(모든글))
}

console.log('④ 빈 회사도 깨지지 않음')
{
  const e = J.빈회사()
  const p = J.한벌(e)
  확인('빈 회사 한 벌 쪽 있음', p.length > 15)
  확인('적용 판정 «모름»', J.적용판정(e.회사).됨 === null)
}

console.log('⑤ PDF · 한글 · 워드 · 엑셀')
{
  const 그림들 = new Map()
  const pdf = await 쪽들PDF(쪽들, 그림들, { 제목: '예시건설(주) 안전보건관리체계' })
  확인('PDF 머리 %PDF', strFromU8(pdf.slice(0, 5)) === '%PDF-')
  const hw = 쪽들한글(쪽들, 그림들, { 제목: '안전보건관리체계' })
  const hz = unzipSync(hw)
  확인('한글(hwpx) mimetype', strFromU8(hz.mimetype || new Uint8Array()) === 'application/hwp+zip')
  확인('한글 본문에 회사 이름', strFromU8(hz['Contents/section0.xml'] || new Uint8Array()).includes('예시건설(주)'))
  const wd = 쪽들워드(쪽들, 그림들, { 제목: '안전보건관리체계' })
  const wz = unzipSync(wd)
  확인('워드 document.xml 에 회사 이름', strFromU8(wz['word/document.xml'] || new Uint8Array()).includes('예시건설(주)'))
  const xl = 엑셀책([쪽들시트(쪽들, 그림들, '안전보건관리체계')], 그림들)
  const xz = unzipSync(xl)
  확인('엑셀 시트 있음', Object.keys(xz).some((k) => /xl\/worksheets\/sheet1\.xml/.test(k)))
  if (process.env.OUT) {
    fs.mkdirSync(process.env.OUT, { recursive: true })
    fs.writeFileSync(path.join(process.env.OUT, '예시_안전보건관리체계.pdf'), pdf)
    fs.writeFileSync(path.join(process.env.OUT, '예시_안전보건관리체계.hwpx'), hw)
    fs.writeFileSync(path.join(process.env.OUT, '예시_안전보건관리체계.docx'), wd)
    fs.writeFileSync(path.join(process.env.OUT, '예시_안전보건관리체계.xlsx'), xl)
    console.log('  → 파일 둠:', process.env.OUT)
  }
}

console.log(`\n중처법 시험: 맞음 ${ok} · 틀림 ${bad}`)
process.exit(bad ? 1 : 0)
