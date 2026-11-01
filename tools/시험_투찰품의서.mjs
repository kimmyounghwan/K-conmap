/**
 * 시험 — 📄 투찰 품의서(web/src/lib/투찰품의서.js) · G499 (2026-11-01)
 *   node tools/시험_투찰품의서.mjs   (web/node_modules 의 pdf-lib 를 씀 — PC bat 시험 목록엔 넣지 않음)
 *   ① 칸이 A4 안 · 서로 안 겹침 ② 글이 칸에 들어감(잘림 … 없음 — 공사명 · 기관 줄 제외하고) ③ 한글 금액 ④ 진짜 PDF · 글자 뽑아 보기(pdftotext)
 *   OUT=폴더 면 PDF 를 그 폴더에(눈으로 보기)
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { 품의서쪽, 품의서PDF, 한글금액 } from '../web/src/lib/투찰품의서.js'
import { 글맞춤 } from '../web/src/lib/쪽문서.js'
import { 환경 } from '../web/src/lib/쪽pdf.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
환경.글꼴 = new Uint8Array(fs.readFileSync(path.join(여기, '../web/public/fonts/KCMGothic.ttf')))
let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✔', 이름) } else { 실패++; console.log('  ✘', 이름, typeof 더 === 'string' ? 더 : JSON.stringify(더).slice(0, 600)) } }

const 입력 = {
  공고: { no: 'R26BK00000001', name: '가상 ○○지구 배수로 정비공사', inst: '가상시 건설과', close: '202611021000', lic: ['토목공사업/0001', '상ㆍ하수도설비공사업/4996'],
    base: 244600000, est: 222363636, aval: 13940000, aKnown: true, llr: 89.745, lo: -3, hi: 3, pc: 210000000, enp: 14, enpWhy: '이 면허·이 금액대 개찰 68건의 중앙' },
  금액: 222498175, 투찰률: 91.067, 예정: 244323602, 사정률: 99.887, 범위: [219500000, 225600000],
  자리: { label: '권장', why: '사정률 100.40% 에서도 낙찰하한을 넘도록 잡은 금액 · A값이 확인돼 더 바짝 붙임', q: 75 },
  통과: 0.86, 버팀: 100.402, 일순율: 4.2, 성적: { n: 6477, 일순: 4.0, 실격: 12.8 }, 관심: 12, p50: 99.896,
  기관: { n: 8, med: 99.71, c: [['261020', 99.652, 89.912, 23, '가상 도로 보수공사'], ['261015', 100.211, 90.103, 41, '가상 배수관 정비'], ['261002', 99.31, 89.77, 17, '가상 하천 정비공사(1공구)']] },
  결재: ['담당', '검토', '대표'], 회사: '가상건설(주)', 작성: '김가상', 때: '2026-11-01 15:30',
}

console.log('① 칸')
const 쪽 = 품의서쪽(입력)
확인('A4 세로 210 × 297', 쪽.폭 === 210 && 쪽.높이 === 297)
const 밖 = 쪽.칸들.filter((k) => k.x < 0 || k.y < 0 || k.x + k.w > 210 + 0.01 || k.y + k.h > 297 + 0.01)
확인('모든 칸이 쪽 안', !밖.length, 밖)
const 겹침 = []
for (let i = 0; i < 쪽.칸들.length; i++) for (let j = i + 1; j < 쪽.칸들.length; j++) {
  const a = 쪽.칸들[i], b = 쪽.칸들[j]
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  if (ox > 0.05 && oy > 0.05) 겹침.push([a.글 || '(빈)', b.글 || '(빈)'])
}
확인('칸끼리 안 겹침', !겹침.length, 겹침.slice(0, 5))
확인('아래 여백 10mm 넘게 남음(맨 아래 줄 < 287)', Math.max(...쪽.칸들.map((k) => k.y + k.h)) <= 287.01, Math.max(...쪽.칸들.map((k) => k.y + k.h)))

console.log('② 글')
const 잘림 = 쪽.칸들.filter((k) => k.글).map((k) => ({ 글: k.글, m: 글맞춤(k.글, k.w, k.h, k.크기 || 9, !!k.굵게) })).filter((x) => x.m.줄들.some((줄) => 줄.endsWith('…')))
확인('글이 칸에 다 들어감(… 로 잘린 칸 없음)', !잘림.length, 잘림.map((x) => x.글))
const 글들 = 쪽.칸들.map((k) => k.글 || '').join(' | ')
for (const s of ['투 찰 품 의 서', '222,498,175원', '91.067%', '권장 (75분위)', '86.0%', '100.402%', '4.2%', '6,477건', '99.710%', '이 공고를 본 사람 12명', '결\n재', '대표', '참고용']) 확인(`«${s.replace('\n', '')}» 이 들어 있음`, 글들.includes(s), s)
확인('공사명 · 공고번호 · 발주기관', 글들.includes('가상 ○○지구 배수로 정비공사') && 글들.includes('R26BK00000001') && 글들.includes('가상시 건설과'))

console.log('③ 한글 금액')
확인('222,498,175 → 일금 이억이천이백사십구만팔천백칠십오원정', 한글금액(222498175) === '일금 이억이천이백사십구만팔천백칠십오원정', 한글금액(222498175))
확인('10,000 → 일금 일만원정 · 1,100 → 일금 천백원정', 한글금액(10000) === '일금 일만원정' && 한글금액(1100) === '일금 천백원정', [한글금액(10000), 한글금액(1100)])
확인('빈 값 → 빈 글', 한글금액(0) === '')

console.log('④ PDF')
const 바이트 = await 품의서PDF(입력)
확인('진짜 PDF(%PDF) · 한 쪽', Buffer.from(바이트.slice(0, 4)).toString() === '%PDF' && 바이트.length > 3000, 바이트.length)
const tmp = path.join(process.env.OUT || '/tmp', '품의서_시험.pdf')
fs.mkdirSync(path.dirname(tmp), { recursive: true })
fs.writeFileSync(tmp, 바이트)
let 뽑음 = ''
try { 뽑음 = execFileSync('pdftotext', ['-layout', tmp, '-']).toString() } catch (e) { 뽑음 = '' }
확인('PDF 글자 뽑기 — 제목 · 금액 · 공사명이 찾아짐(진짜 글자)', /투\s*찰\s*품\s*의\s*서/.test(뽑음) && 뽑음.includes('222,498,175원') && 뽑음.includes('배수로 정비공사'), 뽑음.slice(0, 300))
const 빈 = 품의서쪽({ 공고: { name: '가상 공사' }, 금액: 0 })
확인('값이 거의 없어도 깨지지 않음(— 로)', 빈.칸들.length > 20 && 빈.칸들.some((k) => k.글 === '—'))
if (process.env.OUT) console.log('   PDF:', tmp)
console.log(실패 ? `✘ ${실패} 틀림 · ${통과} 맞음` : `✔ 모두 맞음(${통과})`)
process.exit(실패 ? 1 : 0)
