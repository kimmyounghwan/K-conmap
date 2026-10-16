/* 📄 엑셀 서류 시트 → 한글(.hwpx) (lib/시트한글.js · G296) 시험
     node tools/시험_시트한글.mjs            OUT=폴더 를 주면 한글 · PDF(같은 쪽 모형)를 그 폴더에 둡니다(눈으로 보기)
   예시 원 내역서(지어낸 것)로 변경 서류 · 기성 서류를 만들어 한글로 — 쪽 · 표 · 머리 · 숫자 꼴 · 병합 · 머리 꼴 번호를 봅니다. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, strFromU8 } from '../web/node_modules/fflate/esm/index.mjs'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import * as R from '../web/src/lib/원내역변경.js'
import * as K from '../web/src/lib/기성.js'
import { 시트들한글, 시트쪽들, 칸모양 } from '../web/src/lib/시트한글.js'
import { 쪽들PDF, 환경 as pdf환경 } from '../web/src/lib/쪽pdf.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
pdf환경.글꼴 = new Uint8Array(fs.readFileSync(path.join(여기, '../web/public/fonts/KCMGothic.ttf')))
let ok = 0, bad = 0
const 확인 = (무엇, 참, 더 = '') => { if (참) { ok++; console.log('  ✓', 무엇) } else { bad++; console.log('  ✗', 무엇, 더) } }

console.log('① 칸 꼴 → 글')
확인('금 1,234,567', 칸모양({ v: 1234567.4, s: '금굵' }).글 === '1,234,567' && 칸모양({ v: 1234567.4, s: '금굵' }).굵게)
확인('율4 3.5450%', 칸모양({ v: 0.03545, s: '율4' }).글 === '3.5450%')
확인('율 11.35%', 칸모양({ v: 0.1135, s: '율' }).글 === '11.35%')
확인('수3 1.25', 칸모양({ v: 1.25, s: '수3' }).글 === '1.25')
확인('숫자는 오른쪽 · 머리는 가운데 · 바탕', 칸모양({ v: 1, s: '금' }).정렬 === '오' && 칸모양({ v: '비목', s: '머리' }).정렬 === '가' && 칸모양({ v: 'x', s: '머리' }).바탕 === '#DDE4EE')
확인('빨강 · 파랑 · 흐림 글자', 칸모양({ v: 1, s: '금빨_아래' }).색 === '#C00000' && 칸모양({ v: 1, s: '금파' }).색 === '#1F4E9E' && 칸모양({ v: 'a', s: '글흐림' }).색 === '#666666')
확인('빈 칸 — 테두리 없음', 칸모양('').테 === 0 && 칸모양({ v: '', s: '글' }).테 === 1)

console.log('② 변경 서류 → 한글')
const 바이트 = new Uint8Array(fs.readFileSync(path.join(여기, '시험자료/원내역_예시.xlsx')))
const 책 = readWorkbook(바이트)
const 원 = R.원읽기(책, '원내역_예시.xlsx')
const 편 = R.새편집()
const 찾 = (이름) => 원.모형.줄.findIndex((x) => x.꼴 === '품목' && x.이름 === 이름)
편.차수[0].수량[찾('터파기')] = '1400'; 편.차수[0].사유[찾('터파기')] = '암반 구간이 설계보다 길어 터파기 물량이 늘어남'
편.차수[0].수량[찾('거푸집')] = '700'
const r = R.서류만들기(원, 편, 1)
const 고른 = r.시트들.filter((s) => ['변경원가계산서', '조정계산서', '공사비증감대비표', '설계변경사유서'].includes(s.이름))
확인('고를 시트 4장', 고른.length === 4, 고른.map((s) => s.이름).join(','))
const 쪽들 = 고른.flatMap((t) => 시트쪽들(t, { 폭: 297, 높이: 210 }))
확인('쪽 — 시트마다 새 쪽(4쪽 이상)', 쪽들.length >= 4, 쪽들.length)
const 원가쪽 = 시트쪽들(고른[0], { 폭: 297, 높이: 210 })
const 글들 = 원가쪽.flatMap((p) => p.칸들.map((k) => k.글))
확인('원가 — 제목 · 머리 · 도급액 숫자', 글들.includes('원 가 계 산 서 (변 경)') && 글들.includes('비            목') && 글들.some((g) => /^1\d{2},\d{3},\d{3}$/.test(g)))
확인('원가 — 쪽이 넘으면 머리 줄을 다시', 원가쪽.length < 2 || 원가쪽[1].칸들.some((k) => k.글 === '비            목'))
확인('칸이 안 쪽 안에', 쪽들.every((p) => p.칸들.every((k) => k.x >= p.안.x - 0.01 && k.x + k.w <= p.안.x + p.안.w + 0.01 && k.y + k.h <= p.안.y + p.안.h + 0.01)), '')
const hwpx = 시트들한글(고른, { 제목: '설계변경 서류' })
const hz = unzipSync(hwpx)
const 첫이름 = new TextDecoder().decode(hwpx.slice(30, 30 + 8))
확인('한글: 맨 앞 mimetype · 압축 안 함', 첫이름 === 'mimetype' && hwpx[8] === 0 && strFromU8(hz.mimetype) === 'application/hwp+zip')
const 구역 = Object.keys(hz).filter((k) => /^Contents\/section\d+\.xml$/.test(k)).sort()
const 섹 = 구역.map((k) => strFromU8(hz[k])).join('')
const 한쪽들 = 고른.flatMap((t) => 시트쪽들(t, t.세로 ? { 폭: 210, 높이: 297 } : { 폭: 297, 높이: 210 }))
확인('한글: 표 = 쪽 수', (섹.match(/<hp:tbl /g) || []).length === 한쪽들.length, (섹.match(/<hp:tbl /g) || []).length + ' / ' + 한쪽들.length)
확인('한글: 원가계산서는 세로 · 조정계산서 · 대비표는 가로 → 구역 나눔', 구역.length >= 2 && /landscape="WIDELY"/.test(strFromU8(hz[구역[0]])) && /landscape="NARROWLY"/.test(strFromU8(hz[구역[1]])), 구역.join(','))
const hpf = strFromU8(hz['Contents/content.hpf'])
확인('한글: 구역마다 목록 · 차례(spine) · 머리 secCnt', 구역.every((k, i) => hpf.includes(`href="${k}"`) && hpf.includes(`idref="section${i}"`)) && new RegExp(`secCnt="${구역.length}"`).test(strFromU8(hz['Contents/header.xml'])))
확인('한글: 구역마다 첫 문단에 용지(secPr) 하나', 구역.every((k) => (strFromU8(hz[k]).match(/<hp:secPr /g) || []).length === 1))
const 머 = strFromU8(hz['Contents/header.xml'])
const 쓴테 = [...섹.matchAll(/borderFillIDRef="(\d+)"/g)].map((m) => +m[1]), 있는테 = new Set([...머.matchAll(/<hh:borderFill id="(\d+)"/g)].map((m) => +m[1]))
확인('한글: 쓴 테두리 번호가 머리에 다 있음', 쓴테.every((i) => 있는테.has(i)))
const 쓴글 = [...섹.matchAll(/charPrIDRef="(\d+)"/g)].map((m) => +m[1]), 있는글 = new Set([...머.matchAll(/<hh:charPr id="(\d+)"/g)].map((m) => +m[1]))
확인('한글: 쓴 글자 모양 번호가 머리에 다 있음', 쓴글.every((i) => 있는글.has(i)))
확인('한글: itemCnt = 실제 개수', [['borderFills', 'borderFill'], ['charProperties', 'charPr']].every(([a, b]) => { const m = new RegExp(`<hh:${a} itemCnt="(\\d+)"`).exec(머); return m && +m[1] === (머.match(new RegExp(`<hh:${b} `, 'g')) || []).length }))
확인('한글: 사유 글 · 증감 숫자 들어감', 섹.includes('암반 구간') && /<hp:t>[\d,]+<\/hp:t>/.test(섹))
/* 표마다 칸 주소가 행 · 열 수 안 */
const 표들 = [...섹.matchAll(/<hp:tbl [^>]*rowCnt="(\d+)" colCnt="(\d+)"[\s\S]*?<\/hp:tbl>/g)]
확인('한글: 표마다 칸 주소가 행 · 열 수 안', 표들.every((m) => [...m[0].matchAll(/colAddr="(\d+)" rowAddr="(\d+)"/g)].every((a) => +a[1] < +m[2] && +a[2] < +m[1])))

console.log('③ 기성 서류 → 한글(검사원 · 청구서 — 병합 칸)')
const 읽 = K.기성읽기(책, '원내역_예시.xlsx')
const 편k = { ...K.새기성(읽), 전체: 37, 정보: { 공사명: '가상 마을안길 정비공사', 발주기관: '○○군', 상호: '○○건설' } }
const 결 = K.기성셈(읽, 편k)
const 서 = K.서류시트들(읽, 결, 편k)
const 검쪽 = 시트쪽들(서[0], { 폭: 210, 높이: 297 })
const 공사칸 = 검쪽[0].칸들.find((k) => k.글 === '가상 마을안길 정비공사')
확인('검사원 — 공사명 칸이 B:E 병합(넓게)', 공사칸 && 공사칸.w > 120, 공사칸 && 공사칸.w)
const 청 = 시트쪽들(서[1], { 폭: 210, 높이: 297 }).flatMap((p) => p.칸들.map((k) => k.글))
확인('청구서 — «일금 … 원정» 금액 글', 청.some((g) => /^일금 .+원정/.test(g)))
const hk = 시트들한글(서, { 제목: '기성 서류' })
확인('기성 한글 — 세로 A4', /landscape="WIDELY"/.test(strFromU8(unzipSync(hk)['Contents/section0.xml'])))
const 한시 = K.기성한글시트들(읽, 결, 편k)
확인('기성 한글 시트 — 검사원 · 청구서 · 부분기성 · 기성원가', 한시.map((t) => t.이름.replace(/\(\d+회\)/, '')).join(',') === '기성검사원,기성청구서,부분기성,기성원가', 한시.map((t) => t.이름).join(','))

if (process.env.OUT) {
  fs.mkdirSync(process.env.OUT, { recursive: true })
  fs.writeFileSync(path.join(process.env.OUT, '변경서류.hwpx'), hwpx)
  fs.writeFileSync(path.join(process.env.OUT, '변경서류.pdf'), await 쪽들PDF(한쪽들, new Map(), { 제목: '설계변경 서류' }))
  fs.writeFileSync(path.join(process.env.OUT, '기성서류.hwpx'), 시트들한글(한시, { 제목: '기성 서류' }))
  fs.writeFileSync(path.join(process.env.OUT, '기성서류.pdf'), await 쪽들PDF(한시.flatMap((t) => 시트쪽들(t, t.세로 ? { 폭: 210, 높이: 297 } : { 폭: 297, 높이: 210 })), new Map(), { 제목: '기성 서류' }))
  console.log('  → ' + process.env.OUT)
}
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
