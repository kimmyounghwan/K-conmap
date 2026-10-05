/* 🧾 원 내역서로 설계변경(lib/원가계산.js · 원내역변경.js · 시트붙이기.js) 시험 — 2026-10-05 (G131)
     node tools/시험_원내역변경.mjs
   ⚠️ 실제 현장 파일은 저장소에 넣지 않습니다. tools/시험자료/원내역_예시.xlsx 는 지어낸 것(tools/원내역_예시.py).
      실제 계약내역서 두 벌(국도 · 배수개선 — 클라우드 작업 공간에서만)로도 맞춰 봤습니다: 바꾸지 않으면 변경 = 당초(원 단위까지) ·
      바꾼 뒤 엑셀을 리브레오피스로 다시 셈한 값 = 우리 값(숫자 칸 5,558 · 12,781 · 15,120 칸 모두 같음). */
import { readFileSync } from 'fs'
import { unzipSync, strFromU8 } from '../web/node_modules/fflate/esm/index.mjs'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import * as G from '../web/src/lib/원가계산.js'
import * as R from '../web/src/lib/원내역변경.js'
import * as V from '../web/src/lib/변경내역.js'

let ok = 0, bad = 0
const eq = (got, want, what) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { ok++; console.log('  ✓', what) } else { bad++; console.log('  ✗', what, '— 나온 값', g, '· 바란 값', w) }
}
const 참 = (c, what, 더 = '') => eq(!!c, true, what + (더 ? ' (' + 더 + ')' : ''))
const 버림 = (v) => Math.floor(v + 1e-7)

console.log('1) 산출근거 식')
const 코 = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', 'A', 'B', 'C', 'D', 'E', 'F', 'K', 'J'])
const 값 = { 1: 0, 2: 100, 3: 0, A: 100, 4: 1000, 5: 146, B: 1146, 6: 50, K: 1100, J: 2200 }
const 셈 = (t) => G.식셈(G.식읽기(t, 코), (c) => (값[c] ?? 0), [...코])
eq(셈('B × 0.0356'), 1146 * 0.0356, 'B × 0.0356')
eq(셈('(A + 4 + 6) ×0.009'), 1150 * 0.009, '(A + 4 + 6) ×0.009 — 4 · 6 은 코드')
eq(셈('((A + 4) + K/1.1) × 0.0253 + 3,300,000'), (1100 + 1100 / 1.1) * 0.0253 + 3300000, '((A + 4) + K/1.1) × 0.0253 + 3,300,000 — 1.1 · 3,300,000 은 수')
eq(셈('(1 + 2 + 3 )'), 100, '(1 + 2 + 3 )')
eq(셈('(4:6)'), 1196, '(4:6) 범위')
eq(셈('B × 3.56%'), 1146 * 0.0356, '퍼센트 글자')
eq(G.식읽기('직접노무비 × 0.1', 코), null, '한글이 섞이면 못 읽음(그대로 둠)')
eq(G.식엑셀(G.식읽기('(A + 4) × 0.0197', 코), (c) => 'C' + c, [...코]), '((CA+C4)*0.0197)', '엑셀 식으로')

console.log('2) 지어낸 원 내역서 — 원가계산서 읽기 · 맞추기')
const 바이트 = new Uint8Array(readFileSync(new URL('./시험자료/원내역_예시.xlsx', import.meta.url)))
const 책 = readWorkbook(바이트)
const 원 = R.원읽기(책, '원내역_예시.xlsx')
eq([원.고른, 원.모형.품목수], ['내역서', 12], '내역서 시트 · 품목 12')
참(원.원가 && 원.원가.줄.length === 26, '원가계산서 줄 26', 원.원가 && 원.원가.줄.length)
const 꼴 = Object.fromEntries(원.맞춘.셈.map((s) => [s.코드, s.꼴]))
eq([꼴['1'], 꼴['4'], 꼴['6'], 꼴.J], ['나머지', '나머지', '나머지', '공종'], '직접재료비 · 직접노무비 · 산출경비 = 내역 갈래 합 · 관급자재 = 관급 공종')
eq(['5', '7', 'C', 'E', 'F', 'I', 'K'].map((k) => 꼴[k]), ['식', '식', '식', '식', '식', '식', '식'], '요율 · 소계 줄은 식으로 맞음')
eq(원.말.filter((m) => m.무게 === '확인').length, 0, '확인할 곳 없음')

console.log('3) 바꾸지 않으면 변경 = 당초')
const 편0 = R.새편집()
const 요0 = R.빠른요약(원, 편0, 1)
eq([요0.원가.도급액.변경, 요0.원가.총공사비.변경], [요0.원가.도급액.당초, 요0.원가.총공사비.당초], '도급액 · 총공사비 그대로')
eq(요0.원가.도급액.당초, 132764855, '당초 도급액 132,764,855')

console.log('4) 수량 바꾸고 신규 비목 — 원가를 처음부터 다시 셈한 값과 같나')
const 편 = R.새편집()
편.낙찰률 = 0.87745
const 줄 = 원.모형.줄
const 찾 = (이름) => 줄.findIndex((x) => x.꼴 === '품목' && x.이름 === 이름)
편.차수[0].수량[찾('터파기')] = '1400'; 편.차수[0].사유[찾('터파기')] = '암반 구간 늘어남'
편.차수[0].수량[찾('거푸집')] = '700'; 편.차수[0].사유[찾('거푸집')] = '물량 줄어듦'
편.차수[0].수량[찾('잔토처리')] = '0'; 편.차수[0].사유[찾('잔토처리')] = '현장 유용'
const 토공 = 줄.findIndex((x) => x.꼴 === '공종' && x.이름.replace(/\s/g, '') === '토공')
편.차수[0].신규.push({ id: 'n1', 뒤: 토공, 이름: '암 깨기', 규격: '브레이커', 단위: '㎥', 수량: '45', 설계: { 노무비: 30000, 재료비: 0, 경비: 52000 }, 근거: '표준시장단가', 기준: '신규', 사유: '암반 출현' })
const 요 = R.빠른요약(원, 편, 1)
/* 직접 셈: 바뀐 내역 합 */
const 셈줄 = (x, q) => ({ 노: 버림((x.값[0].g.노무비.단가 || 0) * q), 재: 버림((x.값[0].g.재료비.단가 || 0) * q), 경: 버림((x.값[0].g.경비.단가 || 0) * q) })
let 노 = 0, 재 = 0, 경 = 0, 관급 = 0, 관급중 = false
for (const x of 줄) {
  if (x.꼴 === '공종') { 관급중 = /관급/.test(x.이름.replace(/\s/g, '')); continue }
  const i = 줄.indexOf(x)
  const q = 편.차수[0].수량[i] !== undefined ? Number(편.차수[0].수량[i]) : x.값[0].수량
  const a = 셈줄(x, q)
  if (관급중) { 관급 += a.노 + a.재 + a.경; continue }
  노 += a.노; 재 += a.재; 경 += a.경
}
노 += 버림(30000 * 0.87745) * 45; 경 += 버림(52000 * 0.87745) * 45
const A = 재, n4 = 노, n5 = 버림(n4 * 0.146), B = n4 + n5, n6 = 경
const n7 = 버림(B * 0.0356), n8 = 버림(B * 0.0101), n9 = 버림(n4 * 0.03545), n10 = 버림(n4 * 0.045), n11 = 버림(n9 * 0.1295), n12 = 버림(n4 * 0.023)
const n13 = 버림((A + n4) * 0.0197), n14 = 버림((A + n4 + n6) * 0.008), n15 = 버림((A + B) * 0.0553)
const C = n6 + n7 + n8 + n9 + n10 + n11 + n12 + n13 + n14 + n15, D = A + B + C, E = 버림(D * 0.055), F = 버림((B + C + E) * 0.1135)
const Gg = D + E + F, H = 버림(Gg * 0.1), I = Gg + H, K = I + 관급
eq([요.원가.도급액.변경, 요.원가.총공사비.변경], [I, K], `변경 도급액 ${I.toLocaleString()} · 총공사비 ${K.toLocaleString()} — 처음부터 다시 셈한 것과 같음`)
eq(요.순[1], 노 + 재 + 경, '변경 순공사비')
eq(요.바뀜수, 4, '바뀐 품목 4(늘어남 · 줄어듦 · 없어짐 · 신규)')

console.log('5) 신규비목 단가 — 제65조③')
eq(R.신규단가({ 설계: { 노무비: 30000, 재료비: 0, 경비: 52000 }, 기준: '신규' }, 0.87745, ['합계', '노무비', '재료비', '경비']).단가, { 노무비: 26323, 재료비: 0, 경비: 45627 }, '③2 설계단가 × 낙찰률 · 원 미만 버림')
eq(R.신규단가({ 설계: { 노무비: 10000 }, 기준: '협의안됨' }, 0.8, ['노무비']).단가, { 노무비: 9000 }, '③3 협의 안 됨 = (단가 + 단가 × 낙찰률) × 50%')
eq(R.신규단가({ 설계: { 노무비: 10000 }, 기준: '협의', 협의율: 0.9337 }, 0.8, ['노무비']).단가, { 노무비: 9337 }, '③3 협의율')

console.log('6) 엑셀 — 원본 시트 그대로 + 새 시트')
const r = await R.엑셀만들기(바이트, 원, 편, 1, Object.keys(책))
eq(r.붙임, true, '.xlsx 는 원본에 붙임')
eq(r.시트이름들, ['변경내역서', '변경원가계산서', '공사비증감대비표', '공사비물량대비표', '내역서총괄표', '신규비목단가산출서', '단가적용근거표', '설계변경사유서', '검산'], '새 시트 9장')
const z = unzipSync(r.바이트)
const wb = strFromU8(z['xl/workbook.xml'])
const 이름들 = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m) => m[1])
eq(이름들.slice(0, 2), ['원가계산서', '내역서'], '원본 시트 두 장이 앞에 그대로')
eq(이름들.length, 11, '모두 11장')
참(/fullCalcOnLoad="1"/.test(wb), '열 때 다시 셈')
eq((wb.match(/<definedNames[\s>/]/g) || []).length, 1, 'definedNames 한 덩이(빈 <definedNames/> 를 채움 — 두 개면 엑셀이 못 엶)')
참([...wb.matchAll(/<sheet [^>]*kcmr:id="[^"]+"[^>]*>/g)].every((m) => /xmlns:kcmr="/.test(m[0])), '새 <sheet> 마다 관계 이름표를 스스로 밝힘(원본이 시트마다 밝힌 파일도)')
const st = strFromU8(z['xl/styles.xml'])
const xf수 = (st.match(/<cellXfs count="(\d+)"/) || [])[1]
const xf실 = (st.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/)[1].match(/<xf[\s>/]/g) || []).length
eq(Number(xf수), xf실, '칸 꼴 개수 = 적힌 개수')
let 최대 = 0
for (const k of Object.keys(z)) if (/kcmchg\d+\.xml$/.test(k)) for (const m of strFromU8(z[k]).matchAll(/<c [^>]*s="(\d+)"/g)) 최대 = Math.max(최대, Number(m[1]))
참(최대 < xf실, '새 시트의 꼴 번호가 모두 있는 꼴', `${최대} < ${xf실}`)
const ct = strFromU8(z['[Content_Types].xml'])
eq((ct.match(/kcmchg\d+\.xml/g) || []).length, 9, '새 시트 9장 모두 등록')
const 원가xml = strFromU8(z[Object.keys(z).find((k) => /kcmchg2\.xml$/.test(k))])
참(/'변경내역서'!\$/.test(원가xml), '변경 원가계산서가 변경내역서 칸을 가리킴')
/* 원본 시트 바이트가 그대로인가 */
const 원z = unzipSync(바이트)
const 같음 = Object.keys(원z).filter((k) => /worksheets\/sheet\d+\.xml$/.test(k)).every((k) => strFromU8(원z[k]) === strFromU8(z[k]))
참(같음, '원본 시트 XML 한 글자도 안 바뀜')

console.log('7) 2회 변경 — 차수별 대비표 · 직전 차수와 견줌')
편.차수.push({ 이름: '2회', 수량: { [찾('되메우기')]: '1000', 'n:n1': '60' }, 사유: { [찾('되메우기')]: '2회 늘어남' }, 신규: [] })
const r2 = await R.엑셀만들기(바이트, 원, 편, 2, Object.keys(책))
참(r2.시트이름들.includes('차수별대비표'), '2회부터 차수별 대비표')
const 요2 = R.빠른요약(원, { ...편, 기준: '직전' }, 2)
const 요1 = R.빠른요약(원, 편, 1)
eq(요2.순[0], 요1.순[1], '직전 기준이면 2회의 «당초» = 1회 변경')
eq(요2.바뀜수, 2, '2회에서 바뀐 것 2(되메우기 · 신규 수량)')

console.log('8) 두 줄 글자색(위 · 아래 검정/빨강) · 긴 글은 칸 안에서 줄바꿈')
const 줄찾기 = (시트, 글) => 시트.줄.findIndex((r) => Array.isArray(r) && r.some((c) => c && typeof c === 'object' && String(c.v ?? '').trim() === 글))
const 꼴들 = (r) => r.map((c) => (c && typeof c === 'object' ? c.s || '' : ''))
const 서 = (색, 더 = {}) => R.서류만들기(원, { ...편, ...더, 색 }, 1, { 원이름들: Object.keys(책) }).시트들
{
  const 기 = 서(undefined).find((t) => t.이름 === '변경내역서')
  const i = 줄찾기(기, '터파기')
  const 위 = 꼴들(기.줄[i]), 아래 = 꼴들(기.줄[i + 1])
  참(!위.some((x) => x.includes('빨')) && 아래.filter((x) => x.includes('빨')).length >= 3, '처음 값 = 위 검정 · 아래 빨강(전과 같음)')
  const 바 = 서({ 위: '빨', 아래: '검' })
  const 내 = 바.find((t) => t.이름 === '변경내역서')
  const 위2 = 꼴들(내.줄[i]), 아래2 = 꼴들(내.줄[i + 1])
  참(위2.includes('글빨_위') && 위2.some((x) => /^수\d빨_위$/.test(x)) && 위2.includes('금빨_위'), '위 빨강 → 품명 · 수량 · 금액까지 줄 전체 빨강', 위2.join(','))
  참(!아래2.some((x) => x.includes('빨')), '아래 검정 → 빨강 없음', 아래2.join(','))
  const 공 = 줄찾기(내, '토 공') >= 0 ? 줄찾기(내, '토 공') : 내.줄.findIndex((r) => Array.isArray(r) && r.some((c) => c && /토\s*공/.test(String(c.v ?? ''))))
  참(꼴들(내.줄[공]).includes('글굵빨_위'), '공종 줄 이름도 위 색을 따름')
  const 가 = 바.find((t) => t.이름 === '변경원가계산서')
  const j = 가.줄.findIndex((r) => r[0] && /도\s*급\s*액/.test(String(r[0].v ?? '')))
  참(꼴들(가.줄[j]).includes('금굵빨_위') || 꼴들(가.줄[j]).includes('금빨_위'), '변경 원가계산서 — 당초 줄 빨강', 꼴들(가.줄[j]).join(','))
  참(!꼴들(가.줄[j + 1]).some((x) => /^금.*빨/.test(x)), '변경 원가계산서 — 변경 줄 검정', 꼴들(가.줄[j + 1]).join(','))
  const 총 = 바.find((t) => t.이름 === '내역서총괄표')
  const t = 줄찾기(총, '순 공 사 비')
  참(꼴들(총.줄[t]).some((x) => /^금굵빨_위$/.test(x)) && !꼴들(총.줄[t + 1]).some((x) => x.includes('빨')), '총괄표도 같은 색')
  const 한 = V.내역시트(원.모형, [0], { 색: { 위: '빨', 아래: '빨' } })
  참(!한.줄.some((r) => 꼴들(r).some((x) => x.includes('빨'))), '1줄 내역서는 색을 골라도 늘 검정')
  /* 긴 사유 · 총괄 사유 */
  const 긴 = '현장 여건 변경으로 암반 구간이 설계보다 길게 나타나 터파기 물량이 늘었고, 감독관 입회 확인 뒤 장비 조합을 바꾸어 시공함(사진 · 확인서 붙임)'
  const 편긴 = { ...편, 총괄사유: 긴 + ' ' + 긴, 차수: 편.차수.map((d, k) => (k === 0 ? { ...d, 사유: { ...d.사유, [찾('터파기')]: 긴 } } : d)) }
  const 사 = R.서류만들기(원, 편긴, 1, { 원이름들: Object.keys(책) }).시트들.find((x) => x.이름 === '설계변경사유서')
  const k = 사.줄.findIndex((r) => Array.isArray(r) && r.some((c) => c && c.v === 긴))
  참(k >= 0 && 사.줄[k][7].s === '글감' && 사.줄[k].높이 >= 33, '긴 사유 → 칸 안 줄바꿈 · 줄 높이 늘림', k >= 0 && 사.줄[k].높이)
  const 총줄 = 사.줄.find((r) => Array.isArray(r) && r[1] && r[1].v === 긴 + ' ' + 긴)
  참(총줄 && 총줄.높이 >= 33, '긴 총괄 사유(합친 칸)도 높이 늘림', 총줄 && 총줄.높이)
  const r = await R.엑셀만들기(바이트, 원, 편긴, 1, Object.keys(책))
  const 스 = strFromU8(unzipSync(r.바이트)['xl/styles.xml'])
  참(/wrapText="1"/.test(스) && /indent="1"/.test(스), '꼴에 줄바꿈 · 들여쓰기 들어감')
  const zz = unzipSync(r.바이트)
  const 사xml = strFromU8(zz[Object.keys(zz).find((x) => /kcmchg\d+\.xml$/.test(x) && strFromU8(zz[x]).includes('설 계 변 경 사 유 서'))])
  참(/<row r="\d+" ht="\d+" customHeight="1">/.test(사xml), '사유서 시트에 줄 높이 적힘')
}

console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
