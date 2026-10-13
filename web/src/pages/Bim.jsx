/**
 * /jeoksan/bim — 🏗 BIM 물량 · 캐드 도면 넣으면 3D + 물량 (G225 · 2026-10-10)
 *
 * 소장님: 「난 프로그램 만들고, 거기에 캐드 도면 넣어서 물량 뽑고, 3D세우고 싶어..」
 *         「도면 수정을 하지 않게 해줘. 그러면서 물량 나오고, 3D보고…」 · 「새화면으로 해줘」 · 「최대한 잘 만들어 줘」
 *         「토목도면과 건물도면을 한꺼번에 넣으면 모두 되게 해줘」 · 「부재가 없으면 좌표로 읽어서 물량 뽑으면 되지않아?」
 *         「최대한 3d화면이 잘 나오게 해줘」 · 「물량도..」  (설계 docs/우리레빗_설계_261010.md)
 *
 * ■ 도면(DXF · DWG 여러 장)을 넣으면 스스로 두 갈래로 읽습니다 — 도면은 «읽기만»(고쳐 그리는 단계 · 도면 찍기 없음)
 *   ① 건축 골조: 골조 읽기(lib/골조자동.js) → 부재 모델(lib/BIM모델.js) → 물량(lib/골조.js 셈 · 산출서와 같은 값)
 *   ② 토목 · 구조물 · 땅: 도면 3D 일꾼(lib/dxf3d.worker.js — 도면 3D 보기와 같은 엔진)이 좌표로 읽은 노선 · 횡단 · 구조물 · 측량점
 *      → 덩어리 + 평균단면 물량(lib/BIM토목.js) · 부재 일람표가 없어도 단면 · 평면 «모양» 으로 셈
 *   - 3D(lib/bim3d.js): 골조 · 배수로 · 구조물은 꽉 찬 덩어리, 터파기 · 성토 · 땅은 비쳐 보이게, 도면 선은 옅게 · 높이 키우기
 *   - 부재(덩어리)를 누르면 크기 · 자리 · 물량 몫 · 근거(어느 도면), 물량 표를 누르면 3D 에서 파랗게
 *   - 건물과 토목을 같이 넣으면 같은 화면에(건물은 토목 옆 · 땅 높이에 — 자리 맞춤은 다음 단계)
 *   - 내보내기: 엑셀(골조 수량산출 양식 + 부재별 3D + 토목 집계 · 노선별 평균단면 식) · IFC(레빗 등) · 3D 사진
 * ■ 파일은 이 브라우저 밖으로 안 나감 · 서버 없음 · 비용 0원.
 * ■ 📊 숨은 누적: |BIM물량|도면 · |BIM물량|예시 · |BIM물량|엑셀 · |BIM물량|IFC · |BIM물량|사진 · |BIM물량|부재 · |BIM물량|토목
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 도면읽어오기, 큰파일, 오류글 } from '../도면판.jsx'
import 읽기점검칸 from '../읽기점검칸.jsx'
import 판목록칸 from '../판목록칸.jsx'
import { DWG바꾸기 } from '../lib/dwg바꾸기.js'
import { 단위배율 } from '../lib/골조도면.js'
import { 골조읽기 } from '../lib/골조자동.js'
import { 셈, 엑셀 as 골조엑셀 } from '../lib/골조.js'
import { 모델만들기, 부재물량, 검사, 크기글, 층고바꾸기, 높이글, 종류들, 종류색, 겹친것빼기 } from '../lib/BIM모델.js'
import { 토목모델, 토목종류, 토목색, 토목비침, 토목이름, 줄기 } from '../lib/BIM토목.js'
import { 부재보기 } from '../lib/bim3d.js'
import { 같은건물찾기 } from '../lib/건물겹치기.js'
import { 참조끼우기 } from '../lib/골조끼움.js'
import { 흙막이물량 } from '../lib/흙막이.js'
import { 측점글 as 측점글0 } from '../lib/활용3d.js'

/** 측점 글자 — 0 앞(−)은 «−7.00 m» 로 */
const 측점글 = (s, G) => {
  if (Number.isFinite(s) && s < -0.005) return '−' + (-s).toFixed(2) + ' m'
  /* 🛣 G236 도로(km 꼴 측점 «STA.0+136.8063») 노선은 «0+136.81» 로 */
  if (G === 1 && Number.isFinite(s)) { const k = Math.floor((s + 1e-6) / 1000), m = s - k * 1000; return `${k}+${m.toFixed(2).padStart(6, '0')}` }
  return 측점글0(s)
}
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { askAfter } from '../AskComment'
import { 세기 } from '../lib/받은수.jsx'
import { 일람표만들기, 일람표시트 } from '../lib/부재일람표.js'
import { 멈춤감시, 멈춤글 } from '../lib/파일한도.js'

const 예시 = [['/jeoksan/BIM_예시_3층.dxf', 'BIM_예시_3층.dxf']]
const 예시토목 = [
  ['/jeoksan/BIM예시_측량도면.dxf', 'BIM예시_측량도면.dxf'], ['/jeoksan/BIM예시_계획평면도.dxf', 'BIM예시_계획평면도.dxf'],
  ['/jeoksan/BIM예시_종횡단면도.dxf', 'BIM예시_종횡단면도.dxf'], ['/jeoksan/BIM예시_배수장일반도.dxf', 'BIM예시_배수장일반도.dxf'],
  ['/jeoksan/BIM예시_관리동평면도.dxf', 'BIM예시_관리동평면도.dxf'], ['/jeoksan/BIM_예시_3층.dxf', 'BIM_예시_3층.dxf'],
  ['/jeoksan/BIM예시_흙막이도.dxf', 'BIM예시_흙막이도.dxf'],      // 🧱 G229 가설 흙막이(평면 1단 · 2단 + 전개도)
]
const 쉼 = (n, d = 0) => (Number.isFinite(n) ? Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—')
const 층말 = (n) => (n === 'FT' ? '기초' : /^B\d+$/i.test(n) ? '지하' + n.slice(1) + '층' : n === 'R' ? '지붕' : n + '층')
const 색글 = (c) => 'rgb(' + c.map((v) => Math.round(v * 255)).join(',') + ')'
const 종이름 = { 기초: '기초', 기둥: '기둥', 벽: '벽', 보: '보', 슬라브: '슬래브', 계단: '계단' }
const 파일이름 = (s) => String(s || '현장').replace(/\.(dxf|dwg)$/i, '').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30)

const 토목ID = 1000000                       // 3D 고르기 번호 — 토목 덩어리는 이 위
/* 도면 선(바탕) 으로 보일 묶음 — 건물 평면은 BIM 건물과 자리가 달라 뺌
   🏭 G234 횡단 · 구조 단면(세워 놓은 단면도 선 — 눈금 막대 · 표 · 벽 세로선)과 종단 깃은 뺌: 3D 덩어리가 이미 그 모양이고, 세로 막대가 땅 위에 수백 개 섰음(소장님 현장 E) */
const 바탕꼴 = new Set(['측량', '평면', '종평', '노선', '땅면', '측량점'])
const 바탕뺄층 = /콘크리트$|땅 면$|계획 면$|측량점|종단 깃$/
/** 일꾼 결과 → 바탕 선(mm · 가운데 더한 «원래» 좌표 · 100만 줄까지) */
function 바탕선만들기(r) {
  const 켠 = new Set()
  /* 옆에 나란히 둔(현장 자리를 못 찾은) 도면은 뺌 — 현장 자리에 놓인 도면만 바탕으로 */
  for (const g of r.그룹 || []) if (g.켬 && 바탕꼴.has(g.종류) && !(g.자리 && g.자리.how === '옆')) for (const k of g.층들 || []) 켠.add(k)
  const 고른 = []
  let 총 = 0
  for (const l of r.layers || []) {
    if (l.off || !켠.has(l.floor) || 바탕뺄층.test(l.ly || '')) continue
    고른.push(l); 총 += l.pos.length / 6
  }
  const 걸음 = Math.max(1, Math.ceil(총 / 1000000))
  const c = r.center || [0, 0, 0]
  const out = new Float64Array(Math.ceil(총 / 걸음 + 1) * 6)
  let n = 0, k = 0
  for (const l of 고른) {
    const p = l.pos
    for (let i = 0; i + 5 < p.length; i += 6) {
      if (k++ % 걸음) continue
      out[n++] = p[i] + c[0]; out[n++] = p[i + 1] + c[1]; out[n++] = p[i + 2] + c[2]
      out[n++] = p[i + 3] + c[0]; out[n++] = p[i + 4] + c[1]; out[n++] = p[i + 5] + c[2]
    }
  }
  return out.subarray(0, n)
}

/** 엑셀 시트 이름(31자 · 금지 글자 뺌 · 겹치지 않게) */
const 시트이름 = (s, 쓴) => {
  let b = String(s).replace(/[\[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || '시트'
  let n = b, k = 2
  while (쓴.has(n)) { const t = ' ' + k++; n = b.slice(0, 31 - t.length) + t }
  쓴.add(n)
  return n
}
const 열 = (i) => String.fromCharCode(65 + i)
/** 📋 G234 토공을 도면 표 값으로 셌으면 그 말 + 선으로 잰 값(맞춰 보기) */
function 표글(n) {
  if (!n.선합 || !n.표씀) return ''
  const 쓴 = ['터파기', '되메우기', '성토', '절토'].filter((k) => n.표씀[k]).map((k) => (k === '절토' ? '흙깎기' : k))
  if (!쓴.length) return ''
  const r = (v) => Math.round(v).toLocaleString('ko-KR')
  return ` · 토공(${쓴.join(' · ')}) = 도면 측점 표 값 — 선으로 잰 값: 판 곳(터파기 + 흙깎기) ${r(n.선합.터파기)} · 되메우기 ${r(n.선합.되메우기)} · 성토 ${r(n.선합.성토)} ㎥`
}

/** 토목 엑셀 — 집계 · 노선마다 평균단면(식 그대로) · 구조물(개략 · 식) */
function 토목시트(토, ST, 참고 = '') {
  const 쓴 = new Set(['토목 집계', '구조물(개략)', '건물(평면 개략)'])
  const 반 = (v, d = 3) => +(+v || 0).toFixed(d)
  const 시트 = []
  const 집 = []
  토.노선들.forEach((n) => 집.push(['배수로 · 수로', n.이름, { v: 반(n.길이, 2), st: ST.QTY }, n.단면수, { v: 반(n.합.콘크리트), st: ST.QTY }, { v: 반(n.합.거푸집), st: ST.QTY }, { v: 반(n.합.터파기), st: ST.QTY }, { v: 반(n.합.절토), st: ST.QTY }, { v: 반(n.합.되메우기), st: ST.QTY }, { v: 반(n.합.성토), st: ST.QTY }, String(n.파일 || '') + (n.세움 ? '' : ' (3D 못 세움 — 노선 없음)') + 표글(n)]))
  토.구조물들.forEach((q) => 집.push(['구조물(개략)', q.이름, '', '', { v: 반(q.합.콘크리트), st: ST.QTY }, { v: 반(q.합.거푸집), st: ST.QTY }, '', '', '', '', q.파일 + ' · 바닥판 ' + q.바닥두께 + ' mm' + (q.기본두께 ? '(짐작)' : '')]))
  ;(토.건물들 || []).forEach((b) => {
    if (b.이름 === 참고) 집.push(['건물(평면 · 참고)', b.이름, '', b.층.length, '', '', '', '', '', '', '골조와 같은 건물이라 합에 안 넣음(참고 — 콘크리트 ' + 반(b.합.콘크리트, 1) + ' ㎥ · 연면적 ' + 반(b.연면적, 1) + ' ㎡) · ' + b.파일])
    else 집.push(['건물(평면 · 개략)', b.이름, '', b.층.length, { v: 반(b.합.콘크리트), st: ST.QTY }, { v: 반(b.합.거푸집), st: ST.QTY }, '', '', '', '', b.파일 + ' · 연면적 ' + 반(b.연면적, 1) + ' ㎡ · 바닥판 ' + b.바닥두께 + ' mm' + (b.기본두께 ? '(짐작)' : '') + (b.옆 ? ' · 자리 못 찾음(토목 옆)' : '')])
  })
  const n = 집.length
  집.push(['합계', '', '', '', ...['E', 'F', 'G', 'H', 'I', 'J'].map((c) => ({ f: 'SUM(' + c + '2:' + c + (n + 1) + ')', st: ST.QTY })), ''])
  시트.push({ name: '토목 집계', head: ['갈래', '이름', '연장(m)', '단면 수', '콘크리트(㎥)', '거푸집(㎡)', '터파기(㎥)', '흙깎기(㎥)', '되메우기(㎥)', '성토(㎥)', '근거'], rows: 집, widths: [14, 28, 10, 8, 13, 12, 12, 12, 12, 11, 48], freeze: 1 })
  for (const 노 of 토.노선들) {
    const rows = 노.줄.map((r, i) => {
      const R = i + 2
      const 칸 = (면열, 값) => (i === 0 ? 0 : { f: '(' + 열(면열) + (R - 1) + '+' + 열(면열) + R + ')/2*C' + R, st: ST.QTY })
      void 칸
      const 면 = r.면적 || {}
      const 체 = (c) => (i === 0 ? { v: 0, st: ST.QTY } : { f: '(' + c + (R - 1) + '+' + c + R + ')/2*C' + R, st: ST.QTY })
      return [측점글(r.측, 노.간격), { v: 반(r.측, 2) }, i === 0 ? { v: 0 } : { f: 'B' + R + '-B' + (R - 1) },
        { v: 반(면.콘크리트, 4) }, 체('D'), { v: 반(면.거푸집, 3) }, 체('F'), { v: 반(면.터파기, 4) }, 체('H'), { v: 반(면.되메우기, 4) }, 체('J'), { v: 반(면.성토, 4) }, 체('L'), { v: 반(면.절토, 4) }, 체('N'),
        ...(노.선줄 ? [{ v: 반(노.선줄[i] && 노.선줄[i].면적.터파기, 4) }, { v: 반(노.선줄[i] && 노.선줄[i].면적.되메우기, 4) }, { v: 반(노.선줄[i] && 노.선줄[i].면적.성토, 4) }] : [])]
    })
    const m = rows.length
    rows.push(['합계', '', { f: 'SUM(C2:C' + (m + 1) + ')' }, '', { f: 'SUM(E2:E' + (m + 1) + ')', st: ST.QTY }, '', { f: 'SUM(G2:G' + (m + 1) + ')', st: ST.QTY }, '', { f: 'SUM(I2:I' + (m + 1) + ')', st: ST.QTY }, '', { f: 'SUM(K2:K' + (m + 1) + ')', st: ST.QTY }, '', { f: 'SUM(M2:M' + (m + 1) + ')', st: ST.QTY }, '', { f: 'SUM(O2:O' + (m + 1) + ')', st: ST.QTY }])
    const 표머리 = 노.선줄 ? ['선으로 잰 판 곳(터파기 + 흙깎기 ㎡ · 맞춰 보기)', '선으로 잰 되메우기(㎡)', '선으로 잰 성토(㎡)'] : []
    const 표말 = (k) => (노.표씀 && 노.표씀[k] ? ' — 도면 표' : '')
    시트.push({ name: 시트이름('평균단면 ' + 노.이름, 쓴), head: ['측점', '누가거리(m)', '거리(m)', '콘크리트 면적(㎡)', '콘크리트(㎥)', '거푸집 길이(m)', '거푸집(㎡)', '터파기 면적(㎡)' + 표말('터파기'), '터파기(㎥)', '되메우기 면적(㎡)' + 표말('되메우기'), '되메우기(㎥)', '성토 면적(㎡)' + 표말('성토'), '성토(㎥)', '흙깎기 면적(㎡)' + 표말('절토'), '흙깎기(㎥)', ...표머리], rows, widths: [16, 11, 9, 13, 12, 12, 11, 15, 11, 15, 11, 14, 10, 15, 11, ...표머리.map(() => 18)], freeze: 1 })
  }
  if (토.구조물들.length) {
    const rows = 토.구조물들.map((q, i) => {
      const R = i + 2
      return [q.이름, { v: 반(q.넓이.바닥, 2) }, { v: 반(q.둘레.바닥, 2) }, { v: q.바닥두께 }, { v: 반(q.넓이.벽, 2) }, { v: 반(q.둘레.벽, 2) }, { v: 반(q.벽높, 3) }, { v: 반(q.두께, 2) },
        { f: 'B' + R + '*D' + R + '/1000+E' + R + '*G' + R, st: ST.QTY }, { f: 'C' + R + '*D' + R + '/1000+F' + R + '*G' + R, st: ST.QTY }, { v: 반(q.아래, 3) }, { v: 반(q.위, 3) }, q.파일]
    })
    시트.push({ name: '구조물(개략)', head: ['이름', '바닥 넓이(㎡)', '바닥 둘레(m)', '바닥판 두께(mm)', '벽 넓이(㎡ · 평면)', '벽 둘레(m · 양쪽 면)', '벽 높이(m)', '평균 벽 두께(m · 짐작)', '콘크리트(㎥)', '거푸집(㎡)', 'EL 아래(m)', 'EL 위(m)', '도면'], rows, widths: [22, 12, 12, 13, 15, 16, 10, 16, 12, 12, 10, 10, 30], freeze: 1 })
  }
  if ((토.건물들 || []).length) {
    /* 🏢 G228 건물(평면) — 층마다 한 줄 · 콘크리트 = 바닥 넓이 × 두께 + 벽 넓이 × 벽 높이 · 거푸집 = 바닥 + 바닥 둘레 × 두께 + 벽 둘레 × 벽 높이 (식 그대로) */
    const rows = []
    for (const b of 토.건물들) {
      for (const f of b.층) {
        const R = rows.length + 2
        rows.push([b.이름 + (b.이름 === 참고 ? ' (참고)' : ''), f.이름 + (f.지붕 && !/지붕/.test(f.이름) ? ' (지붕)' : ''), { v: 반(f.z0, 3) }, { v: 반(f.z1, 3) }, { v: 반(f.바닥, 2) }, { v: 반(f.바닥둘레, 2) }, { v: b.바닥두께 }, { v: 반(f.벽, 2) }, { v: 반(f.벽둘레, 2) }, { v: 반(f.벽높, 3) },
          { f: 'E' + R + '*G' + R + '/1000+H' + R + '*J' + R, st: ST.QTY }, { f: 'E' + R + '+F' + R + '*G' + R + '/1000+I' + R + '*J' + R, st: ST.QTY }, f.뺀벽 || (f.짐작 ? '지붕 평면이 없어 위층 모양 그대로(짐작)' : '')])
      }
    }
    const m = rows.length
    rows.push(['합계', '', '', '', { v: 반(토.건물들.reduce((a, x) => a + x.연면적, 0), 2) }, '', '', { f: 'SUM(H2:H' + (m + 1) + ')' }, '', '', { f: 'SUM(K2:K' + (m + 1) + ')', st: ST.QTY }, { f: 'SUM(L2:L' + (m + 1) + ')', st: ST.QTY }, '바닥 넓이 칸 = 연면적(지붕 뺀 층 바닥 넓이 합)'])
    시트.push({ name: '건물(평면 개략)', head: ['건물', '층', '층 바닥 FL(m)', '윗층 FL(m)', '바닥 넓이(㎡)', '바닥 둘레(m)', '바닥판 두께(mm)', '벽 넓이(㎡ · 평면)', '벽 둘레(m · 양쪽 면)', '벽 높이(m)', '콘크리트(㎥)', '거푸집(㎡)', '비고'], rows, widths: [20, 16, 11, 10, 12, 12, 13, 15, 16, 10, 12, 12, 40], freeze: 1 })
  }
  return 시트
}

/** 🧱 G229 흙막이 · 가설 엑셀 — 강재(길이 × 단위무게 × (1 + 할증) ÷ 1000 · 식 그대로) + 토류판 · 건물 터파기(넓이 × 깊이) */
function 흙막이시트(흙들, 할증, ST) {
  const 반 = (v, d = 3) => +(+v || 0).toFixed(d)
  const rows = []
  흙들.forEach((h, hi) => {
    const q = 흙막이물량(h, { 할증: 할증 / 100 })
    if (흙들.length > 1) rows.push([{ v: '🧱 ' + String(h.파일 || '흙막이 ' + (hi + 1)).replace(/\.(dxf|dwg)$/i, ''), st: ST.HEAD }, '', '', '', '', '', '', '', ''])
    const 첫 = rows.length + 2
    for (const x of q.줄) {
      const r = rows.length + 2
      rows.push([x.공종, x.규격 || '(규격 못 읽음)', x.수량 != null ? { v: x.수량, st: ST.INT } : '', { v: 반(x.길이, 2) }, { v: 반(x.kg, 1) }, { v: 할증, st: ST.FILLIN },
        { f: 'D' + r + '*E' + r + '*(1+F' + r + '/100)/1000', st: ST.QTY }, x.짐작 || ''])
    }
    const 끝 = rows.length + 1
    rows.push(['강재 합계', '', '', { f: 'SUM(D' + 첫 + ':D' + 끝 + ')' }, '', '', { f: 'SUM(G' + 첫 + ':G' + 끝 + ')', st: ST.QTY }, '할증 칸(노란 칸)을 바꾸면 중량이 다시 셈됩니다'])
    rows.push(['', '', '', '', '', '', '', ''])
    rows.push([{ v: '판 · 흙', st: ST.HEAD }, { v: '', st: ST.HEAD }, { v: '', st: ST.HEAD }, { v: '길이 · 넓이', st: ST.HEAD }, { v: '깊이(m)', st: ST.HEAD }, { v: '', st: ST.HEAD }, { v: '수량', st: ST.HEAD }, { v: '근거', st: ST.HEAD }])
    if (q.토류판) { const r = rows.length + 2; rows.push(['토류판(흙막이판)', '㎡', '', { v: 반(q.토류판.길이, 2) }, { v: 반(q.토류판.깊이, 3) }, '', { f: 'D' + r + '*E' + r, st: ST.QTY }, h.토류판.근거 === '전개도' ? '전개도 원지반선 ~ 굴착선 사이 — 펼친 길이(m) × 평균 깊이' : '둘레(m) × 굴착 깊이 가운데(글자)']) }
    if (q.터파기) { const r = rows.length + 2; rows.push(['건물 터파기(흙막이 안)', '㎥', '', { v: 반(q.터파기.넓이, 2) }, { v: 반(q.터파기.깊이, 3) }, '', { f: 'D' + r + '*E' + r, st: ST.QTY }, '흙막이 안 넓이(㎡ · 토류판 줄로 둘러싼 곳) × 평균 굴착 깊이']) }
    for (const g of h.근거 || []) rows.push(['근거', '', '', '', '', '', '', g])
    rows.push(['', '', '', '', '', '', '', ''])
  })
  return { name: '흙막이 · 가설', head: ['공종', '규격', '수량(본)', '길이(m)', '단위무게(kg/m)', '할증(%)', '중량(ton)', '비고'], rows, widths: [24, 20, 9, 12, 14, 9, 12, 60], freeze: 1 }
}

const 어두움 = () => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch (e) { return false } }

/* 화면을 옮겨 다녀와도 그대로(이 탭 메모리 — 새로고침하면 처음부터) */
const 기억 = { 도면들: null, R: null, 이름: '', 높이: {}, 예시: false, 토목: null, 두께: {}, 건물두께: {}, 흙할증: '10' }

export default function Bim() {
  const [도면들, set도면들] = useState(기억.도면들)
  const [R, setR] = useState(기억.R)
  const [이름, set이름] = useState(기억.이름)
  const [높이, set높이] = useState(기억.높이)
  const [토목, set토목] = useState(기억.토목)          // { 활용, center, 바탕 } — 도면 3D 일꾼 결과 중 쓰는 것만
  const [두께, set두께] = useState(기억.두께)          // 구조물 이름 → 바닥판 두께(mm 글자)
  const [건물두께, set건물두께] = useState(기억.건물두께)  // 🏢 G228 건물(평면) 이름 → 바닥판 두께(mm 글자)
  const [흙할증, set흙할증] = useState(기억.흙할증)      // 🧱 G229 흙막이 강재 할증(% 글자 · 도면 재료표 «Add 10%»)
  const [토목상태, set토목상태] = useState({ k: 기억.토목 ? 'ok' : 'idle' })
  const [상태, set상태] = useState({ k: 'idle' })
  const [선택, set선택] = useState(null)          // 부재 id (토목은 토목ID 위)
  const [묶음, set묶음] = useState(null)          // {글, ids:Set}
  const [끔, set끔] = useState(() => new Set())  // 끈 종류
  const [층만, set층만] = useState('')            // '' = 모두
  const [투명, set투명] = useState(false)
  const [도면선, set도면선] = useState(true)
  const [높이배, set높이배] = useState(1)
  const [받는중, set받는중] = useState('')
  const 판Ref = useRef(null)
  const 보기Ref = useRef(null)
  const 칸Ref = useRef(null)
  const 일꾼Ref = useRef(null)
  const 처음맞춤 = useRef(false)
  const 토목맞춤 = useRef(false)
  const [glErr, setGlErr] = useState('')

  useEffect(() => { Object.assign(기억, { 도면들, R, 이름, 높이, 토목, 두께, 건물두께, 흙할증 }) }, [도면들, R, 이름, 높이, 토목, 두께, 건물두께, 흙할증])
  useEffect(() => () => { if (일꾼Ref.current) { 일꾼Ref.current.terminate(); 일꾼Ref.current = null } }, [])

  /* ── 토목 · 구조물 · 땅 — 도면 3D 일꾼으로(좌표로 읽기) ── */
  const 토목읽기 = (목록) => {
    if (일꾼Ref.current) 일꾼Ref.current.terminate()
    if (!목록.length) { set토목상태({ k: 'idle' }); return }
    let w
    try { w = new Worker(new URL('../lib/dxf3d.worker.js', import.meta.url), { type: 'module' }) } catch (e) { set토목상태({ k: 'err', 글: '토목 읽기를 시작하지 못했습니다' }); return }
    일꾼Ref.current = w
    set토목상태({ k: 'busy', p: 0, 글: '토목 · 구조물 · 땅을 좌표로 읽는 중' })
    /* 🧭 G243 일꾼이 5분 넘게 말이 없으면 끝내고 알림(골조 · 물량은 그대로 보임) */
    const 감시 = 멈춤감시(() => { if (일꾼Ref.current === w) { w.terminate(); 일꾼Ref.current = null; set토목상태({ k: 'err', 글: '토목 · 땅 · 건물 3D — ' + 멈춤글 }) } })
    w.onmessage = (ev) => {
      const m = ev.data || {}
      if (일꾼Ref.current !== w) { 감시.끝(); return }
      감시.깨움()
      if (m.type === 'prog') set토목상태({ k: 'busy', p: m.p || 0, 글: m.msg || '' })
      else if (m.type === 'err') { 감시.끝(); w.terminate(); 일꾼Ref.current = null; set토목상태({ k: 'err', 글: '토목 · 땅은 읽지 못했습니다 (' + (m.kind === 'mem' ? '이 기기의 기억이 모자랍니다 — 다른 창 · 탭을 닫고 다시 넣거나 PC 에서' : (m.msg || m.kind || '')) + ')' }) }
      else if (m.type === 'done') {
        감시.끝()
        w.terminate(); 일꾼Ref.current = null
        const r = m.r || {}
        const 활 = r.활용 || null
        const 있 = !!(활 && ((활.횡단 || []).some((t) => (t.단면 || []).some((x) => x.면적)) || (활.구조 || []).length || (활.건물 || []).length || (활.흙막이 || []).length || 활.땅))
        set토목(있 ? { 활용: 활, center: r.center || [0, 0, 0], 바탕: 바탕선만들기(r) } : null)
        토목맞춤.current = false
        set끔((s0) => new Set([...s0, '터파기', '성토']))     // 흙은 처음엔 꺼 둠(덩어리가 깔끔히 보이게) — 칩으로 켬
        set토목상태({ k: 'ok' })
        if (있) 세기('|BIM물량|토목')
      }
    }
    w.onerror = (e) => { 감시.끝(); if (일꾼Ref.current === w) { w.terminate(); 일꾼Ref.current = null; set토목상태({ k: 'err', 글: '토목 · 땅은 읽지 못했습니다 (' + (e.message || '') + ')' }) } }
    w.postMessage({ files: 목록.map((x) => ({ name: x.이름.replace(/\.dwg$/i, '.dxf'), blob: new Blob([x.dxf]) })) })
  }

  /* ── 읽기 ── */
  /* 🧭 G241 순서 0 «큰 통합본은 한 번 읽어 3D · 골조가 같이 씀» — DWG → DXF 를 먼저 다 바꾸고, 3D 일꾼(토목 · 건물 · 땅)을 곧바로 띄워
       골조 읽기와 «같이» 돌림(전엔 골조를 다 읽은 뒤에 3D 일꾼을 띄워 두 번 기다렸음 — 현장 C · D 식당 7분) */
  const 읽기 = async (목록, 예시로 = false, 앞틀림 = '') => {
    const 들 = []
    let 틀림 = 앞틀림
    const 쓴이름 = new Set()
    if (일꾼Ref.current) { 일꾼Ref.current.terminate(); 일꾼Ref.current = null }
    set토목(null); set끔(new Set())
    const 바꾼 = []
    for (const { 이름: nm0, buf } of 목록) {
      let nm = nm0
      for (let k = 2; 쓴이름.has(nm); k++) nm = nm0.replace(/(\.\w+)?$/, ' (' + k + ')$1')
      쓴이름.add(nm)
      const 머리 = String.fromCharCode(...new Uint8Array(buf.slice(0, 6)))
      if (/^AC10\d\d/.test(머리)) {
        set상태({ k: 'busy', 글: nm + ' — DWG → DXF 바꾸는 중 (큰 도면은 30초~1분)' })
        try { const r0 = await DWG바꾸기(buf, nm, (d) => set상태({ k: 'busy', 글: nm + ' — DWG → DXF: ' + (d.msg || '') })); 바꾼.push({ 이름: nm, dxf: r0.dxf, 원본: (r0.info && r0.info.원본) || null }) }
        catch (e) { 틀림 += nm + ' — ' + 오류글(e && (e.kind === 'mem' || e.kind === 'readmem') ? e.kind : e && e.kind === 'timeout' ? 'stall' : 'fail', e && e.message) + ' ' }
      } else 바꾼.push({ 이름: nm, dxf: buf })
    }
    /* 3D 일꾼은 바로(골조와 같이) — 일꾼에는 사본을 넘김(골조 읽기는 원본을 넘겨 씀) */
    토목읽기(바꾼.map((x) => ({ 이름: x.이름, dxf: x.dxf.slice(0) })))
    for (const { 이름: nm, dxf, 원본 } of 바꾼) {
      set상태({ k: 'busy', 글: nm + ' 읽는 중' })
      try {
        const { 모델: M } = await 도면읽어오기(dxf, nm, (st) => set상태({ k: 'busy', 글: nm + ' — ' + st.msg + (st.p ? ' ' + Math.round(st.p * 100) + '%' : '') }), false)
        if (원본) M.원본 = 원본
        들.push({ 모델: M, 이름: nm, k: 단위배율(M.units, M.box, M.ox, M.oy).k || 1 })
      } catch (e) { 틀림 += nm + ' — ' + 오류글(e.kind || 'fail', e.message) + ' ' }
    }
    if (!들.length) { set상태({ k: 'err', 글: 틀림.trim() || '도면을 읽지 못했습니다' }); return }
    /* 🔗 G237 xref 끼워 읽기(겹치는 순서 0) — 구조평면도에 끼운 XREF_S-PLAN 처럼 같이 올린 xref 는 그 자리에 넣어 한 장으로 · 끼워 쓴 xref 파일은 골조를 따로 안 읽음 */
    try { const r0 = 참조끼우기(들); 들.splice(0, 들.length, ...r0.들) } catch (e) { /* 끼우기 실패 — 따로 읽은 그대로 */ }
    set상태({ k: 'busy', 글: '골조를 읽어 3D 로 세우는 중' })
    await new Promise((r) => setTimeout(r, 30))
    let r
    try { r = 골조읽기(들) } catch (e) { r = { 있음: false, 경고: ['도면에서 골조를 읽다 멈췄습니다 (' + e.message + ')'] } }
    처음맞춤.current = false
    set도면들(들); setR(r); set높이({}); set선택(null); set묶음(null); set층만(''); set두께({}); set건물두께({}); set높이배(1)
    set이름(목록.length === 1 ? 목록[0].이름 : 목록[0].이름 + ' 외 ' + (목록.length - 1) + '장')
    set상태(틀림 ? { k: 'err', 글: '읽지 못한 도면: ' + 틀림.trim() } : { k: 'ok' })
    세기(예시로 ? '|BIM물량|예시' : '|BIM물량|도면')
  }
  const 파일받기 = async (files) => {
    const list = [...(files || [])].filter((f) => /\.(dxf|dwg)$/i.test(f.name))
    if (!list.length) { set상태({ k: 'err', 글: 'DXF · DWG 도면 파일을 넣어 주십시오.' }); return }
    /* 🧭 G243 한도(PC 2 GB · 폰 200 MB)를 넘는 파일만 빼고 나머지는 다 읽음 — 전엔 한 장 때문에 모두 안 읽었음 */
    const 큰 = list.filter((f) => f.size > 큰파일), 쓸 = list.filter((f) => f.size <= 큰파일)
    const 큰글 = 큰.length ? 큰.map((f) => f.name).join(', ') + ' — ' + 오류글('big') + ' ' : ''
    if (!쓸.length) { set상태({ k: 'err', 글: 큰글.trim() }); return }
    set상태({ k: 'busy', 글: '파일 여는 중' })
    읽기(await Promise.all(쓸.map(async (f) => ({ 이름: f.name, buf: await f.arrayBuffer() }))), false, 큰글)
  }
  const 예시열기 = async (q = 예시) => {
    try {
      set상태({ k: 'busy', 글: '예시 도면 받는 중' })
      const 목록 = []
      for (const [주소, nm] of q) {
        const r = await fetch(주소)
        if (!r.ok) throw new Error(r.status)
        목록.push({ 이름: nm, buf: await r.arrayBuffer() })
      }
      await 읽기(목록, true)
    } catch (e) { set상태({ k: 'err', 글: '예시 도면을 받지 못했습니다 (' + e.message + ')' }) }
  }

  /* ── 셈 — 골조 ── */
  const 있음 = !!(R && R.있음)
  const 공사0 = useMemo(() => (있음 ? 층고바꾸기(R.공사, 높이, R.읽음 && R.읽음.높이) : null), [R, 높이, 있음])
  const 모델0 = useMemo(() => { if (!있음 || !도면들) return null; try { return 모델만들기(도면들, R, { 높이 }) } catch (e) { return { 부재: [], 층: [], 바닥들: [], 맞춤: [], 짐작: [], 경고: ['3D 로 세우다 멈췄습니다: ' + e.message] } } }, [도면들, R, 높이, 있음])
  /* 🏭 G234 토목 도면(횡단 · 구조물)을 넣었는데 골조로 읽은 부재가 몇 개뿐(기둥 없이 5개 미만)이면 — 토목 도면의 표 · 글자를 골조로 잘못 읽은 것
       (소장님 현장 E: 배수펌프장 도면에서 «보 1개» 가 현장 밖 허공에 떠 있었음) → 골조는 안 세우고 알림 */
  const 토목재료 = !!(토목 && 토목.활용 && ((토목.활용.횡단 || []).length || (토목.활용.구조 || []).length))
  const 골조뺌 = !!(모델0 && 모델0.부재.length > 0 && 모델0.부재.length < 5 && !모델0.부재.some((o) => o.종류 === '기둥') && 토목재료)
  const 모델1 = 골조뺌 ? null : 모델0
  /* 🔎 G280 검수 — 확인함 · 뺌(부재 열쇠 = 표|줄|자리 번호 · 파일 이름마다 이 브라우저에 기억) · 뺀 부재는 3D · 산출서 · 엑셀에서 빠짐(겹친 것과 같은 길) */
  const [검수, set검수] = useState(() => ({ 이름: '', 확인: new Set(), 뺌: new Set() }))
  const 검키 = (o) => o.표 + '|' + o.i + '|' + o.kk
  useEffect(() => {
    let 확 = [], 뺌 = []
    try { const s = JSON.parse(localStorage.getItem('k-bim-검수|' + 이름) || 'null'); if (s) { 확 = s.확인 || []; 뺌 = s.뺌 || [] } } catch (e) { /* 기억 없음 */ }
    set검수({ 이름, 확인: new Set(확), 뺌: new Set(뺌) })
  }, [이름])
  const 검수바꾸기 = (칸, 키, 켬) => set검수((s) => {
    const n = new Set(s[칸]); if (켬) n.add(키); else n.delete(키)
    const 새 = { ...s, [칸]: n }
    try { localStorage.setItem('k-bim-검수|' + s.이름, JSON.stringify({ 확인: [...새.확인], 뺌: [...새.뺌] })) } catch (e) { /* 저장 못 함 */ }
    return 새
  })
  const 모델 = useMemo(() => {
    if (!모델1 || !검수.뺌.size) return 모델1
    const 뺄 = new Set(모델1.부재.filter((o) => 검수.뺌.has(검키(o))))
    if (!뺄.size) return 모델1
    return { ...모델1, 부재: 모델1.부재.filter((o) => !뺄.has(o)), 뺀: [...(모델1.뺀 || []), ...[...뺄].map((o) => ({ ...o, 겹침: '검수에서 뺌' }))] }
  }, [모델1, 검수.뺌])  // eslint-disable-line react-hooks/exhaustive-deps
  /* 🏢 G228 겹친 것(같은 층을 한 번 더 그린 평면 · 같은 자리 같은 부재)은 산출서 · 엑셀에서도 한 번만 */
  const 공사 = useMemo(() => (공사0 && 모델 ? 겹친것빼기(공사0, 모델) : 공사0), [공사0, 모델])
  const S = useMemo(() => { if (!공사) return null; try { return 셈(공사) } catch (e) { return { 줄: [], 경고: [{ 글: '셈하다 멈췄습니다: ' + e.message }], 집계: { 합: [] } } } }, [공사])
  const Q = useMemo(() => (모델 && S ? 부재물량(모델, S, 공사) : null), [모델, S, 공사])
  const 검 = useMemo(() => (모델 && Q ? 검사(모델, Q) : []), [모델, Q])
  const 부재표 = useMemo(() => new Map((모델 ? 모델.부재 : []).map((o) => [o.id, o])), [모델])
  const 골조수 = 모델 ? 모델.부재.length : 0

  /* ── 셈 — 토목 ── */
  const 수로 = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, parseInt(String(v).replace(/[^\d]/g, ''), 10)]).filter(([, v]) => v > 0))
  const 두께수 = useMemo(() => 수로(두께), [두께])
  const 건물두께수 = useMemo(() => 수로(건물두께), [건물두께])
  /* 🏢 G228 같은 도면을 골조(부재 일람표)로 20개 넘게 세웠으면 — 일꾼의 평면 덩어리는 빼서 겹치지 않게 */
  const 골조파일 = useMemo(() => (모델 && 도면들 && 모델.부재.length >= 20 ? [...new Set(모델.부재.map((o) => 도면들[o.번] && 도면들[o.번].이름).filter(Boolean))].sort() : []), [모델, 도면들])
  const 골조파일글 = 골조파일.join('|')
  const 토 = useMemo(() => { if (!토목) return null; try { return 토목모델(토목.활용, 토목.center, { 바닥두께: 두께수, 건물바닥: 건물두께수, 뺄건물: 골조파일 }) } catch (e) { return { 부재: [], 노선들: [], 구조물들: [], 건물들: [], 합: { 콘크리트: 0, 거푸집: 0, 터파기: 0, 되메우기: 0, 성토: 0 }, 경고: ['토목을 세우다 멈췄습니다: ' + e.message], 짐작: [], 틀: null, 땅높이: NaN, 원점: [0, 0] } } }, [토목, 두께수, 건물두께수, 골조파일글])  // eslint-disable-line react-hooks/exhaustive-deps
  const 건물들 = 토 ? 토.건물들 || [] : []
  /* 🏢 G228 같은 건물은 하나만 — 소장님(현장 A 도면 시험: 왼쪽 건축 평면 덩어리 · 오른쪽 골조로 같은 건물이 두 번 · 콘크리트 두 배) 「같은 건물은 하나만」
     골조(20개 넘게)와 건축 평면 덩어리의 같은 층 발자국이 겹치면(lib/건물겹치기.js · 겹친 몫 0.55 넘음 — 층마다 견줘 가장 잘 겹친 층)
     → 덩어리는 «참고»(처음엔 꺼 둠 · 합 · IFC 에서 뺌) · 골조는 그 덩어리 자리로(돌림 · 옮김 · 그 층 바닥 높이) */
  const 같은건물 = useMemo(() => 같은건물찾기(모델, 건물들), [모델, 건물들])
  const 참고건물 = 같은건물 && 같은건물.같음 ? 건물들[같은건물.번].이름 : ''
  const 셀건물 = 건물들.filter((b) => b.이름 !== 참고건물)
  const 건물합 = 셀건물.reduce((a, b) => ({ 콘크리트: a.콘크리트 + b.합.콘크리트, 거푸집: a.거푸집 + b.합.거푸집, 연면적: a.연면적 + b.연면적 }), { 콘크리트: 0, 거푸집: 0, 연면적: 0 })
  const 참고끔 = useRef('')
  useEffect(() => { if (참고건물 && 참고끔.current !== 참고건물) { 참고끔.current = 참고건물; set끔((s0) => new Set([...s0, '건물'])) } }, [참고건물])
  const 토목만 = !!(토 && (토.노선들.length || 토.구조물들.length || 토.부재.some((o) => o.종류 === '지형')))
  const 토목물 = !!(토 && (토.노선들.length || 토.구조물들.length))     // 콘크리트 · 토공이 있는 토목(땅만 있으면 요약에 «토목 0» 안 띄움)
  /* 🧱 G229 흙막이 · 가설 — 강재(ton) · 토류판(㎡) · 건물 터파기(㎥) · 할증은 칸에서(기본 10% — 도면 재료표 «Add 10%») */
  const 흙들 = 토 ? 토.흙막이 || [] : []
  const 할증수 = Math.max(0, Math.min(100, parseFloat(String(흙할증).replace(/[^\d.]/g, '')) || 0))
  const 흙물 = useMemo(() => 흙들.map((h) => 흙막이물량(h, { 할증: 할증수 / 100 })), [흙들, 할증수])
  const 흙합 = 흙물.reduce((a, q) => ({ 강재: a.강재 + q.강재, 토류판: a.토류판 + (q.토류판 ? q.토류판.넓이 : 0), 터파기: a.터파기 + (q.터파기 ? q.터파기.부피 : 0), 말뚝: a.말뚝 + q.줄.filter((x) => /측면말뚝/.test(x.공종)).reduce((n, x) => n + (x.수량 || 0), 0) }), { 강재: 0, 토류판: 0, 터파기: 0, 말뚝: 0 })
  const 토목있음 = !!(토 && (토.노선들.length || 토.구조물들.length || 토.부재.length || 흙들.length))
  const 토목표 = useMemo(() => new Map((토 ? 토.부재 : []).map((o) => [토목ID + o.id, o])), [토])
  const 토목덩이 = 토 ? 토.부재.filter((o) => o.종류 !== '지형' && !(참고건물 && o.건물 === 참고건물)).length : 0
  const 콘덩이 = 토 ? 토.부재.filter((o) => !['지형', '흙막이', '터파기', '성토'].includes(o.종류)).length : 0
  const 덩어리있음 = 골조수 + 콘덩이 > 0 || !흙들.length       // 🧱 흙막이 도면만 넣으면 «콘크리트 0 · 거푸집 0» 줄은 안 띄움
  const 그림있음 = 골조수 > 0 || !!(토 && 토.부재.length)          // 3D 로 세운 것(흙막이만이면 3D 칸 대신 알림)
  /* 3D 칸이 빠지면(흙막이만) 그 캔버스에 묶인 보기도 버림 — 다음에 3D 가 생기면 새 캔버스로 다시 만듦 */
  useEffect(() => { if (!그림있음 && 보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null; 처음맞춤.current = false } }, [그림있음])
  /* 바탕 선 — 토목 원점 기준(Float32) · 🏢 G228 높이 없는 평면 선(z 0)은 땅 높이(가운데값)에 깔아 건물 · 구조물 발밑과 겹쳐 보이게(전엔 땅 아래 EL 0 에 떠 비뚤어 보임) */
  const 바탕 = useMemo(() => {
    if (!토목 || !토목.바탕 || !토목.바탕.length || !토) return null
    const a = 토목.바탕, o = 토.원점 || [0, 0], f = new Float32Array(a.length)
    const 깔 = Number.isFinite(토.땅높이) ? 토.땅높이 : 0
    for (let i = 0; i < a.length; i += 3) { f[i] = a[i] - o[0]; f[i + 1] = a[i + 1] - o[1]; f[i + 2] = Math.abs(a[i + 2]) < 1 ? 깔 : a[i + 2] }
    return f
  }, [토목, 토])
  /* 건물과 토목을 같이 넣으면 — 같은 건물(위)이면 그 자리로 · 아니면 건물은 토목 오른쪽 20 m · 땅 높이에
     [dx, dy, dz, θ] — 골조 점 p → R(θ)·p + (dx, dy) · 높이 + dz */
  const 건물옮김 = useMemo(() => {
    if (같은건물 && 같은건물.같음) return [Math.round(같은건물.tx), Math.round(같은건물.ty), 같은건물.dz, 같은건물.θ]
    if (!토목있음 || !모델 || !모델.부재.length || !토.틀) return [0, 0, 0, 0]
    let x0 = Infinity, y0 = Infinity
    for (const o of 모델.부재) for (const q of o.판 || []) { if (q[0] < x0) x0 = q[0]; if (q[1] < y0) y0 = q[1] }
    if (!Number.isFinite(x0)) return [0, 0, 0, 0]
    return [Math.round(토.틀[3] + 20000 - x0), Math.round(토.틀[1] - y0), Number.isFinite(토.땅높이) ? Math.round(토.땅높이) : 0, 0]
  }, [토목있음, 모델, 토, 같은건물])

  /* ── 3D ── */
  const [못맞춘도, set못맞춘도] = useState(false)    // 평면 자리를 못 맞춘 부재(짐작)도 3D 에 그릴지
  const 못맞춘수 = 모델 ? 모델.부재.filter((o) => o.자리짐작).length : 0
  const 보이는 = useMemo(() => (모델 ? 모델.부재.filter((o) => !끔.has(o.종류) && (!층만 || o.층 === 층만) && (못맞춘도 || !o.자리짐작)) : []), [모델, 끔, 층만, 못맞춘도])
  const 보이는토목 = useMemo(() => (토 && !층만 ? 토.부재.filter((o) => !끔.has(o.종류)) : []), [토, 끔, 층만])
  const 그릴것 = 골조수 > 0 || 토목있음
  useEffect(() => {
    if (!판Ref.current || !그릴것) return
    if (!보기Ref.current) {
      try { 보기Ref.current = new 부재보기(판Ref.current) } catch (e) { setGlErr('이 브라우저는 3D(WebGL)를 그리지 못합니다 — 물량 표와 엑셀은 그대로 쓸 수 있습니다.'); return }
      if (어두움()) { const v0 = 보기Ref.current; v0.bg = [0.086, 0.102, 0.129]; v0.bgT = [0.15, 0.17, 0.21]; v0.bgB = [0.06, 0.07, 0.09]; v0.선색 = [0.03, 0.04, 0.05]; v0.선알 = 0.6 }
    }
    const v = 보기Ref.current
    const [dx, dy, dz, θ] = 건물옮김
    const ca = Math.cos(θ || 0), sa = Math.sin(θ || 0)
    const 옮판 = (판) => (dx || dy || θ ? 판.map((q) => [ca * q[0] - sa * q[1] + dx, sa * q[0] + ca * q[1] + dy]) : 판)
    /* 보 · 기둥 · 벽 윗면은 슬래브 윗면과 같은 높이라 겹친 면이 줄무늬로 깜빡임 → 그림에서만 3 mm 낮춤(물량 · 엑셀 · IFC 는 그대로) */
    v.set부재([
      ...보이는.map((o) => ({ id: o.id, 판: 옮판(o.판), z0: o.z0 + dz, z1: (o.종류 === '슬라브' || o.종류 === '기초' ? o.z1 : o.z1 - 3) + dz, 색: 종류색[o.종류] })),
      ...보이는토목.map((o) => ({ id: 토목ID + o.id, 면: o.면, 선: o.선, 색: o.색 || 토목색[o.종류], 비침: 토목비침[o.종류] || 0 })),
    ], { 바닥: !토목있음, 바닥색: 어두움() ? [0.16, 0.18, 0.22] : [0.86, 0.88, 0.90] })
    v.set배경(도면선 && 바탕 ? 바탕 : null, 어두움() ? [0.62, 0.66, 0.72] : [0.36, 0.40, 0.46], 어두움() ? 0.18 : 0.16)     /* 🎨 G232 도면 선은 흐리게 — 덩어리가 먼저 보이게 */
    v.set높이배(높이배)
    if (!처음맞춤.current || (토목있음 && !토목맞춤.current)) {
      // 첫 그림은 전체가 보이게(층만 · 끈 종류와 관계없이) · 토목이 늦게 오면 한 번 더
      v.fit('tilt')
      처음맞춤.current = true
      if (토목있음) 토목맞춤.current = true
    }
    v.set고름(선택 !== null ? [선택] : 묶음 ? [...묶음.ids] : [])
    v.onPick = (id) => {
      if (id >= 0) { set선택(id); set묶음(null); 세기('|BIM물량|부재') } else set선택(null)
    }
  }, [모델, 보이는, 보이는토목, 건물옮김, 도면선, 바탕, 그릴것])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (보기Ref.current) 보기Ref.current.set고름(선택 !== null ? [선택] : 묶음 ? [...묶음.ids] : []) }, [선택, 묶음])
  useEffect(() => { if (보기Ref.current) 보기Ref.current.set투명(투명) }, [투명])
  useEffect(() => { if (보기Ref.current) { 보기Ref.current.set높이배(높이배); 보기Ref.current.fit('tilt') } }, [높이배])
  useEffect(() => () => { if (보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null } }, [])
  const 보기 = (v) => { if (보기Ref.current) 보기Ref.current.fit(v) }

  /* ── 물량 표 ── */
  const 층들 = 모델 ? 모델.층.map((f) => f.이름) : []
  const 칸 = (층, 종) => (Q ? Q.층종.get(층 + '|' + 종) : null)
  const 합 = useMemo(() => {
    if (!S) return { 콘: 0, 틀: 0, 철: 0 }
    /* 집계.합 의 단위: 콘크리트 m³ · 거푸집 m² · 철근 ton (줄의 철근은 kg) */
    const h = (k) => (S.집계.합 || []).filter((x) => x.항목 === k).reduce((s, x) => s + x.산출, 0)
    return { 콘: h('콘크리트'), 틀: h('거푸집'), 철: h('철근') }
  }, [S])
  const 규격합 = useMemo(() => (S ? (S.집계.합 || []).filter((x) => x.항목 === '철근') : []), [S])
  const 묶음고르기 = (글, 거르개) => {
    const ids = new Set((모델 ? 모델.부재 : []).filter(거르개).map((o) => o.id))
    set선택(null); set묶음(ids.size ? { 글, ids } : null)
    if (보기Ref.current && ids.size) 보기Ref.current.보기로([...ids])
  }
  const 토목묶음 = (글, ids) => {
    const 들 = new Set((ids || []).map((i) => 토목ID + i).filter((i) => 토목표.has(i) && !끔.has(토목표.get(i).종류)))
    set선택(null); set묶음(들.size ? { 글, ids: 들 } : null)
    if (보기Ref.current && 들.size) 보기Ref.current.보기로([...들])
  }
  const 있는종류 = 종류들.filter((k) => 모델 && 모델.부재.some((o) => o.종류 === k))
  const 있는토목 = 토목종류.filter((k) => 토 && 토.부재.some((o) => o.종류 === k))
  /* 🏢🏞 G230 건축 · 토목 켜고 끄기 — 소장님 「토목을 끄면, 건축만 나오고, 건축을 끄면 토목만 나오게 만들어야지」
     건축 = 골조(기초 · 기둥 · 벽 · 보 · 슬래브) + 건물(평면) · 토목 = 배수로 · 구조물 · 흙막이 · 터파기 · 성토 · 땅 · 요약 숫자도 켠 쪽만 */
  const 건축칩 = [...있는종류, ...(있는토목.includes('건물') ? ['건물'] : [])]
  const 토목칩 = 있는토목.filter((k) => k !== '건물')
  const 둘다 = 건축칩.length > 0 && 토목칩.length > 0
  const 건축켬 = !둘다 || 건축칩.some((k) => !끔.has(k))
  const 토목켬 = !둘다 || 토목칩.some((k) => !끔.has(k))
  const 묶끔기억 = useRef({})
  const 묶음켜끄기 = (이름, 칩들, 켬) => {
    set끔((s0) => {
      const n = new Set(s0)
      if (켬) { 묶끔기억.current[이름] = 칩들.filter((k) => !s0.has(k)); for (const k of 칩들) n.add(k) }
      else { const 되 = 묶끔기억.current[이름]; for (const k of (되 && 되.length ? 되 : 칩들.filter((k) => k !== '터파기' && k !== '성토'))) n.delete(k) }
      return n
    })
    set선택(null); set묶음(null)
    세기('|BIM물량|' + (이름 === '건축' ? '건축켜끔' : '토목켜끔'))
  }

  /* ── 내보내기 ── */
  const 받기 = (blob, 파일) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 파일
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 60000)
  }
  const 엑셀받기 = async () => {
    if (!(S && 모델) && !토목있음) return
    set받는중('엑셀')
    try {
      const { writeWorkbook, ST } = await import('../lib/qtoxlsx.js')
      const sheets = S && 모델 && 골조수 ? 골조엑셀(공사, S, (s) => s, ST) : []
      if (골조수 && 일람표.length) sheets.push(일람표시트(일람표, ST))          // 📋 G282 부재 일람표 시트
      if (모델 && 골조수) {
        const 줄 = 모델.부재.map((o, i) => {
          const q = Q.부재.get(o.id) || {}
          return [i + 1, 층말(o.층), 종이름[o.종류], o.몸 || o.기호, 크기글(o), +(o.자리[0] / 1000).toFixed(3), +(o.자리[1] / 1000).toFixed(3), +(o.z0 / 1000).toFixed(3), +(o.z1 / 1000).toFixed(3),
            { v: +o.부피.toFixed(4), st: ST.QTY }, { v: +(q.콘크리트 || 0).toFixed(4), st: ST.QTY }, { v: +(q.거푸집 || 0).toFixed(3), st: ST.QTY }, { v: +(q.철근 || 0).toFixed(2), st: ST.QTY }, o.근거 && o.근거.n ? o.근거.n : '', o.짐작.join(' · ')]
        })
        sheets.push({
          name: '부재별 3D',
          head: ['번호', '층', '부재', '기호', '크기(mm)', '가운데 X(m)', '가운데 Y(m)', '아래(m)', '위(m)', '3D 부피(㎥)', '산출서 콘크리트(㎥)', '산출서 거푸집(㎡)', '산출서 철근(kg)', '읽은 도면', '짐작'],
          rows: 줄, widths: [6, 7, 7, 8, 28, 10, 10, 8, 8, 11, 13, 12, 12, 22, 40], freeze: 1,
        })
      }
      if (토목있음 && (토.노선들.length || 토.구조물들.length || 토.부재.length)) for (const sh of 토목시트(토, ST, 참고건물)) sheets.push(sh)
      if (흙들.length) sheets.push(흙막이시트(흙들, 할증수, ST))
      sheets.push({
        name: '맞춤 · 검사',
        head: ['구분', '내용'],
        rows: [
          ...(모델 && 골조수 ? [['원점', 모델.원점 ? 모델.원점.글 : ''], ...모델.맞춤.map((m) => ['층 맞춤 · ' + 층말(m.층), m.글]), ...검.map((z) => [z.정보 ? '부피' : z.좋음 ? '검사 ✓' : '검사 ⚠', z.글]), ...모델.짐작.map((w) => ['짐작', w])] : []),
          ...(R && R.경고 ? R.경고 : []).map((w) => ['읽기 경고', w]),
          ...(토목있음 ? [...토.짐작.map((w) => ['토목 짐작', w]), ...토.경고.map((w) => ['토목 경고', w]), ['토목 물량', '평균단면법 — 단면 둘 사이 = (앞 면적 + 뒤 면적) ÷ 2 × 거리 · 구조물 · 건물(평면)은 벽 넓이 × 높이 + 바닥 넓이 × 두께(개략)']] : []),
          ...(참고건물 ? [['같은 건물', '골조를 건축 평면 «' + 참고건물 + '» 의 ' + 층말(같은건물.층) + (같은건물.방법 === '통심' ? ' 자리에 통심(' + 같은건물.통심.글들.slice(0, 6).join(' · ') + ' — ' + 같은건물.통심.줄수 + '줄 · 남는 차 ' + 같은건물.통심.최대 + ' mm)으로 겹쳐 놓음' : ' 발자국에 겹쳐 놓음') + '(겹친 몫 ' + Math.round(같은건물.몫 * 100) + '% · 돌림 ' + (같은건물.θ * 180 / Math.PI).toFixed(1) + '°) — 건축 평면 덩어리는 참고(합 · IFC 에서 뺌)']]
            : 토목있음 && 골조수 ? [['같은 화면', '골조(부재 일람표로 세운 건물)는 토목 오른쪽 20 m · 땅 높이에 놓음' + (같은건물 ? (같은건물.층맞음 ? '(건축 평면 덩어리와 발자국이 ' + Math.round(같은건물.몫 * 100) + '% 만 겹쳐 다른 건물로 봄)' : '(건축 평면 덩어리와 층 수가 달라 다른 건물로 봄)') : '')]] : []),
          ...건물들.map((b) => ['건물(평면)', b.이름 + ' — ' + (b.옆 ? '배치도에서 자리를 못 찾아 토목 오른쪽 20 m' : b.자리 === '모양' ? '배치도의 같은 모양 자리' + (b.방이름 ? '(같은 방 이름)' : '') : '이 도면이 자리의 기준') + (b.땅 != null ? ' · 땅 EL ' + b.땅.toFixed(2) + ' m' : '')]),
          ['도면', '원본 그대로 읽기만 함(고치지 않음) · K-건설맵 BIM 물량(k-conmap.com/jeoksan/bim)']],
        widths: [16, 120],
      })
      const bytes = writeWorkbook(sheets)
      받기(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'BIM물량_' + 파일이름(이름) + '.xlsx')
      세기('|BIM물량|엑셀'); askAfter('jeoksan')
    } finally { set받는중('') }
  }
  const IFC받기 = async () => {
    if (!모델 && !토목있음) return
    set받는중('IFC')
    try {
      const { IFC쓰기 } = await import('../lib/IFC쓰기.js')
      const t = IFC쓰기(모델 && 골조수 ? 모델 : { 부재: [], 층: [] }, Q, { 이름: 파일이름(이름), 파일: 'BIM물량_' + 파일이름(이름) + '.ifc', 씨: 이름, 토목: 토목있음 ? (참고건물 ? { ...토, 부재: 토.부재.filter((o) => o.건물 !== 참고건물) } : 토) : null, 건물옮김 })
      받기(new Blob([t], { type: 'application/x-step' }), 'BIM물량_' + 파일이름(이름) + '.ifc')
      세기('|BIM물량|IFC')
    } finally { set받는중('') }
  }
  const 사진받기 = () => {
    if (!보기Ref.current) return
    const url = 보기Ref.current.png()
    const a = document.createElement('a'); a.href = url; a.download = 'BIM물량_' + 파일이름(이름) + '_3D.png'
    document.body.appendChild(a); a.click(); a.remove()
    세기('|BIM물량|사진')
  }

  const 고른 = 선택 !== null && 선택 < 토목ID ? 부재표.get(선택) : null
  /* 🔎 G280 검수 목록 — 클로드가 짐작한 것(3D 💭) · 만든 일람 값(🤖 배근표 «만든 값»)이 든 부재 */
  const [크게, set크게] = useState(false)
  const [검종, set검종] = useState('')
  const 검목록 = useMemo(() => {
    if (!모델1 || !공사0) return []
    const 배 = 공사0.배근 || {}
    const 찾 = (표, 기호) => (배[표 === '옹벽' ? '벽' : 표] || []).find((b) => String(b.기호 || '').trim() === String(기호 || '').trim())
    return 모델1.부재.map((o) => {
      const b = 찾(o.표, o.기호)
      const 까닭 = [...(b && b.만든 ? ['🤖 ' + String(b.만든).replace(/^클로드:\s*/, '')] : []), ...(o.짐작 || []).map((w) => '💭 ' + w)]
      return { o, 키: 검키(o), 까닭 }
    }).filter((x) => x.까닭.length)
  }, [모델1, 공사0])  // eslint-disable-line react-hooks/exhaustive-deps
  /* 차례 = 층(아래 → 위) · 종류 · 기호 — 표와 «다음 확인할 것» 이 같은 차례 */
  const 검순 = useMemo(() => {
    const 층순 = new Map(((모델1 && 모델1.층) || []).map((f, i) => [f.이름, i]))
    return [...검목록].sort((a, b) => (층순.has(a.o.층) ? 층순.get(a.o.층) : 99) - (층순.has(b.o.층) ? 층순.get(b.o.층) : 99) || 종류들.indexOf(a.o.종류) - 종류들.indexOf(b.o.종류) || String(a.o.몸 || a.o.기호).localeCompare(String(b.o.몸 || b.o.기호)))
  }, [검목록, 모델1])
  /* 📋 G282 부재 일람표 — 배근표를 도면 일람표 꼴로(📄 도면 · 🤖 만든) · 3D 에 쓰인 수 · 줄 누르면 그 기호 부재들 파랗게 */
  const [일람종, set일람종] = useState('')
  const 일람표 = useMemo(() => (공사0 && 공사0.배근 && 모델1 ? 일람표만들기(공사0.배근, 모델1.부재) : []), [공사0, 모델1])
  const 검남 = (x) => !검수.확인.has(x.키) && !검수.뺌.has(x.키)
  const 검다음 = (지금) => {
    const 줄 = 검순.filter((x) => (!검종 || x.o.종류 === 검종) && 검남(x) && x.키 !== 지금)
    return 줄[0] || null
  }
  const 검고르기 = (x) => {
    if (!x) return
    set크게(true)
    /* 그 층만 · 비쳐 보기(고른 부재는 또렷하게)로 벽 · 슬래브 뒤에 숨지 않게 · 둘레가 보이게 14 m 밖에서 */
    if (!검수.뺌.has(x.키)) { set선택(x.o.id); set묶음(null); set투명(true); set층만(x.o.층); setTimeout(() => { if (보기Ref.current) 보기Ref.current.보기로([x.o.id], 14) }, 60) }
    const el = document.querySelector('.bim-view'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const 고른검 = 고른 ? 검목록.find((x) => x.o === 고른) : null
  const 고른물량 = 고른 && Q ? Q.부재.get(고른.id) : null
  const 고른토 = 선택 !== null && 선택 >= 토목ID ? 토목표.get(선택) : null
  const 토목합 = 토 ? 토.합 : { 콘크리트: 0, 거푸집: 0, 터파기: 0, 되메우기: 0, 성토: 0, 절토: 0 }
  const 절있음 = (토목합.절토 || 0) > 0.0005
  const 표쓴노선 = 토 ? 토.노선들.filter((n) => n.선합 && n.표씀 && Object.values(n.표씀).some(Boolean)) : []
  const 보임 = 그릴것 && (골조수 > 0 ? !!모델 : true)
  const 몫글 = (o) => {
    if (!o || !o.몫) return []
    const 줄 = []
    if (o.몫.콘크리트 !== undefined) 줄.push(['콘크리트', 쉼(o.몫.콘크리트, 3) + ' ㎥'])
    if (o.몫.거푸집 !== undefined) 줄.push(['거푸집', 쉼(o.몫.거푸집, 2) + ' ㎡'])
    if (o.몫.터파기 !== undefined) 줄.push(['터파기', 쉼(o.몫.터파기, 2) + ' ㎥'])
    if (o.몫.되메우기 !== undefined) 줄.push(['되메우기', 쉼(o.몫.되메우기, 2) + ' ㎥'])
    if (o.몫.성토 !== undefined) 줄.push(['성토', 쉼(o.몫.성토, 2) + ' ㎥'])
    if (o.몫.강재 !== undefined) 줄.push(['강재(할증 전)', 쉼(o.몫.강재, 3) + ' ton'])
    if (o.몫.길이 !== undefined) 줄.push(['길이', 쉼(o.몫.길이, 2) + ' m'])
    if (o.몫.토류판 !== undefined) 줄.push(['토류판', 쉼(o.몫.토류판, 1) + ' ㎡'])
    return 줄
  }

  return (
    <div className="wrap bim">
      <끌어놓기판 글="도면(DXF·DWG)을 놓으면 3D 로 세우고 물량을 냅니다 — 건축(구조평면도 · 일람표 · 층 평면도) · 토목(평면 · 종횡단 · 구조물 일반도 · 측량) 여러 장을 한꺼번에" 여럿 받기={(fs) => 파일받기(fs)} />
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🏗 BIM 물량 <span className="count">· 캐드 도면 넣으면 3D + 물량</span></h1>
        <div className="note sm">
          지금 쓰시는 <b>2D 캐드 도면(DXF · DWG)</b> 그대로 — <b>건축</b>(구조평면도 · 부재 일람표)은 기둥 · 보 · 슬래브 · 벽 · 기초를(일람표가 없는 <b>층 평면도</b>만 있어도 벽 · 바닥 덩어리로),
          <b> 토목</b>(평면 · 종횡단면도 · 구조물 일반도 · 측량)은 배수로 · 구조물 · 터파기 · 성토 · 땅을, <b>가설 흙막이</b>는 H-PILE · 버팀보 강재 무게를 <b>좌표로 읽어</b> 스스로
          <b> 3D 로 세우고</b>, 같은 모델로 <b>물량</b>을 냅니다. 건축 · 토목 도면을 <b>한꺼번에</b> 넣으셔도 됩니다. 3D 에서 누르면 그 덩어리의 물량이 나옵니다.
          <b> 도면은 고치지 않습니다</b> — 읽기만 합니다.
        </div>
        <div className="pdfsafe">🔒 <b>파일은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 셉니다 · 회원가입 없음 · 무료.</div>
        <div className="bim-put">
          <button type="button" className="btn" onClick={() => 칸Ref.current && 칸Ref.current.click()} disabled={상태.k === 'busy'}>📂 도면 넣기 (여러 장)</button>
          <input ref={칸Ref} type="file" multiple accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1} onChange={(e) => { 파일받기(e.target.files); e.target.value = '' }} />
          <span className="tlx-exd"><b>🧪 도면이 없으시면</b></span>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 예시열기(예시)} disabled={상태.k === 'busy'}>🏢 가상 3층 건물로 해 보기</button>
          {예시토목 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 예시열기(예시토목)} disabled={상태.k === 'busy'}>🏞 가상 배수로 · 배수장 + 관리동 · 건물 · 흙막이 한꺼번에</button>}
        </div>
        {상태.k === 'busy' && <div className="bim-st">⏳ {상태.글}…</div>}
        {상태.k === 'err' && <div className="dx3-warn">⚠️ {상태.글}</div>}
        {토목상태.k === 'busy' && <div className="bim-st">🏞 {토목상태.글 || '토목 · 구조물 · 땅을 좌표로 읽는 중'} {토목상태.p ? Math.round(토목상태.p * 100) + '%' : ''}…{골조수 > 0 ? ' (골조는 먼저 보여 드립니다)' : ''}</div>}
        {토목상태.k === 'err' && <div className="dx3-warn">⚠️ {토목상태.글}</div>}
        {도면들 && 도면들.length > 0 && 상태.k !== 'busy' && <읽기점검칸 들={도면들} />}
        {R && R.읽음 && R.읽음.판 && 상태.k !== 'busy' && <판목록칸 판={R.읽음.판} 공사={공사} S={S} />}
        <details className="bim-how">
          <summary>📘 어떤 도면을 넣으면 되나요</summary>
          <ul>
            <li><b>건축 골조</b> — 구조평면도(부재 기호 C1 · G1 · S1 · W1 · F1) + <b>부재 일람표</b>(400X700 · 4-HD22 · THK150) + 층 높이 글자(FL+3,600 · 없으면 3,300 짐작 · 아래 칸에서 바꿈)</li>
            <li><b>배수로 · 수로 · 박스</b> — <b>평면도</b>(노선 · 측점 NO.) + <b>종단면도</b> + <b>횡단면도</b>(단면마다 지반선 · 계획선 · 구조물 선 · STA 글자) → 단면 모양을 노선 따라 세우고 평균단면법으로 콘크리트 · 거푸집 · 터파기 · 되메우기 · 성토</li>
            <li><b>구조물(배수장 · 집수정)</b> — <b>일반도</b>(평면 + 단면 A-A · EL 글자) → 평면 겹선 사이를 벽으로, 단면 EL 로 높이 · 바닥판 두께는 짐작(칸에서 바꿈)</li>
            <li><b>건물(일람표 없이)</b> — 층 평면도(「지상 1층 평면도」 같은 제목) + 층 높이 글자(입면 · 단면도) → 층마다 겹선을 벽으로, 테두리를 바닥판으로 세운 개략 · 배치도 · 계획평면도를 같이 넣으면 같은 모양(같은 방 이름) 자리에 놓습니다</li>
            <li><b>땅</b> — 측량 도면(높이 든 측량점) → 비쳐 보이는 땅 면</li>
            <li><b>가설 흙막이</b> — 흙막이 평면도(1단 · 2단) + 전개도 + 규격 글자(H-298x201x9/14 · C.T.C 1,800 · 굴착 깊이) → H-PILE · 중간말뚝 · 띠장 · 버팀보 · 사보강 강재 무게(ton) · 토류판 넓이 · 건물 터파기(흙막이 안 넓이 × 깊이)</li>
            <li>한 파일에 여러 평면 · 단면이 있어도, 따로 된 파일이어도 됩니다 — 통심 기호 · 기둥 · 측점 · 같은 모양으로 자리를 맞춥니다</li>
          </ul>
        </details>
      </div>

      {R && !있음 && !토목있음 && 토목상태.k !== 'busy' && (
        <div className="card">
          <div className="dx3-warn" style={{ marginTop: 0 }}>⚠️ 넣은 도면에서 골조 부재도, 건물 층 평면도, 토목(횡단 · 구조물 · 측량점)도 찾지 못했습니다. 건축은 부재 기호(C1 · G1 …)가 적힌 <b>구조평면도</b>와 <b>부재 일람표</b>(또는 층 평면도 + 층 높이 글자)를, 토목은 <b>평면도 + 횡단면도</b>를 같이 넣어 주십시오.</div>
          {(R.경고 || []).slice(0, 8).map((w, i) => <div key={i} className="muted" style={{ fontSize: 12.5 }}>· {w}</div>)}
          <div style={{ marginTop: 8 }}><Link className="btn line sm" to="/jeoksan/golgo">골조 수량산출에서 직접 적기 →</Link> <Link className="btn line sm" to="/tools/dxf3d">도면 3D 보기 →</Link></div>
        </div>
      )}

      {보임 && (
        <>
          {(() => {
            if (!있음 || 토목있음) return null
            const 없는기호 = (R.경고 || []).filter((w) => /일람표\(배근표\)에 없는 기호/.test(w))
            const 철골 = (R.경고 || []).some((w) => /철골 부재/.test(w))
            if (골조수 >= 20 || (!없는기호.length && !철골)) return null
            return (
              <div className="card">
                <div className="dx3-warn" style={{ marginTop: 0 }}>
                  ℹ️ 넣은 도면에서 철근콘크리트 골조로 읽은 부재가 <b>{골조수}개</b>뿐입니다.
                  {없는기호.length > 0 && <> 평면에 부재 기호(W1 · S1 …)는 있지만 <b>부재 일람표(크기 표)</b>가 없어 크기를 모릅니다 — 토목 구조물이면 <b>평면도 + 단면도(EL 글자)</b>가 든 일반도를 같이 넣어 주시면 좌표로 셉니다.</>}
                  {철골 && <> 철골 부재는 아직 철근콘크리트처럼 세지 않습니다.</>}
                </div>
              </div>
            )
          })()}
          <div className="card">
            <div className="bim-sum">
              {(() => {
                const 건덩 = 토 ? 토.부재.filter((o) => o.종류 === '건물' && !(참고건물 && o.건물 === 참고건물)).length : 0
                const 수 = (건축켬 ? 골조수 + 건덩 : 0) + (토목켬 ? 토목덩이 - 건덩 : 0)
                const 글 = [...(건축켬 ? 있는종류.map((k) => 종이름[k] + ' ' + 모델.부재.filter((o) => o.종류 === k).length) : []),
                  ...있는토목.filter((k) => k !== '지형' && !(k === '건물' && 참고건물 && !셀건물.length) && (k === '건물' ? 건축켬 : 토목켬)).map((k) => 토목이름[k] + ' ' + 토.부재.filter((o) => o.종류 === k && !(참고건물 && o.건물 === 참고건물)).length)]
                return <div>부재 · 덩어리<b>{쉼(수)}</b><span className="muted">{글.join(' · ')}{참고건물 && 건축켬 ? ' · 건축 평면 덩어리는 참고' : ''}</span></div>
              })()}
              {덩어리있음 && ((건축켬 ? 합.콘 + 건물합.콘크리트 : 0) + (토목켬 ? 토목합.콘크리트 : 0) > 0 || !흙들.length) && <div>콘크리트<b>{쉼((건축켬 ? 합.콘 + 건물합.콘크리트 : 0) + (토목켬 ? 토목합.콘크리트 : 0), 2)} ㎥</b><span className="muted">{[골조수 && 건축켬 ? '골조 ' + 쉼(합.콘, 1) : '', 토목물 && 토목켬 ? '토목 ' + 쉼(토목합.콘크리트, 1) : '', 셀건물.length && 건축켬 ? '건물(평면 · 개략) ' + 쉼(건물합.콘크리트, 1) : ''].filter(Boolean).join(' · ')}</span></div>}
              {덩어리있음 && ((건축켬 ? 합.틀 + 건물합.거푸집 : 0) + (토목켬 ? 토목합.거푸집 : 0) > 0 || !흙들.length) && <div>거푸집<b>{쉼((건축켬 ? 합.틀 + 건물합.거푸집 : 0) + (토목켬 ? 토목합.거푸집 : 0), 2)} ㎡</b><span className="muted">{[골조수 && 건축켬 ? '골조 ' + 쉼(합.틀, 1) : '', 토목물 && 토목켬 ? '토목 ' + 쉼(토목합.거푸집, 1) : '', 셀건물.length && 건축켬 ? '건물 ' + 쉼(건물합.거푸집, 1) : ''].filter(Boolean).join(' · ')}</span></div>}
              {골조수 > 0 && 건축켬 && <div>철근<b>{쉼(합.철, 3)} ton</b><span className="muted">{규격합.map((x) => x.규격 + ' ' + 쉼(x.산출, 2)).join(' · ')}{토목있음 ? ' · 토목 · 건물(평면)은 아직' : ''}</span></div>}
              {(토목물 || 흙합.터파기 > 0) && 토목켬 && <div>토공<b>{쉼(토목합.터파기 + (토목합.절토 || 0) + 흙합.터파기, 1)} ㎥</b><span className="muted">{[토목물 ? '터파기 ' + 쉼(토목합.터파기, 1) + (절있음 ? ' · 흙깎기 ' + 쉼(토목합.절토, 1) : '') + ' · 되메우기 ' + 쉼(토목합.되메우기, 1) + ' · 성토 ' + 쉼(토목합.성토, 1) + ' ㎥' : '', 흙합.터파기 > 0 ? '건물 터파기(흙막이 안) ' + 쉼(흙합.터파기, 1) + ' ㎥' : '', 표쓴노선.length ? '📋 도면 표 값' : ''].filter(Boolean).join(' · ')}</span></div>}
              {흙들.length > 0 && 토목켬 && <div>흙막이 강재<b>{쉼(흙합.강재, 2)} ton</b><span className="muted">H-PILE {쉼(흙합.말뚝)}본 · 토류판 {쉼(흙합.토류판, 1)} ㎡ · 할증 {쉼(할증수, 1)}%</span></div>}
              {건물들.length > 0 && 건축켬 && <div>연면적<b>{쉼(건물들.reduce((a, b) => a + b.연면적, 0), 1)} ㎡</b><span className="muted">건물(평면) {건물들.length}동 · {건물들.reduce((n, b) => n + b.층.filter((f) => !f.지붕).length, 0)}개 층{참고건물 ? ' · 건축 평면으로 잰 값' : ''}</span></div>}
            </div>
            {둘다 && !(건축켬 && 토목켬) && <div className="muted" style={{ fontSize: 12.5, margin: '-4px 0 8px' }}>{건축켬 ? '🏢 건축만 보는 중 — 요약에서 토목은 뺐습니다' : '🏞 토목만 보는 중 — 요약에서 건축은 뺐습니다'} · 엑셀 · IFC 는 모두 들어갑니다</div>}
            {그림있음 ? (<>
            {둘다 && (
              <div className="bim-big" role="group" aria-label="건축 · 토목 켜고 끄기">
                <button type="button" className={'bim-bigbtn' + (건축켬 ? ' on' : '')} aria-pressed={건축켬} onClick={() => 묶음켜끄기('건축', 건축칩, 건축켬)}>🏢 건축 {건축켬 ? '켬' : '끔'}</button>
                <button type="button" className={'bim-bigbtn' + (토목켬 ? ' on' : '')} aria-pressed={토목켬} onClick={() => 묶음켜끄기('토목', 토목칩, 토목켬)}>🏞 토목 {토목켬 ? '켬' : '끔'}</button>
              </div>
            )}
            <div className="bim-tool">
              <span className="bim-chips">
                {있는종류.map((k) => (
                  <button key={k} type="button" className={'bim-chip' + (끔.has(k) ? ' off' : '')} onClick={() => set끔((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })}>
                    <i style={{ background: 색글(종류색[k]) }} />{종이름[k]}
                  </button>
                ))}
                {있는토목.map((k) => (
                  <button key={k} type="button" className={'bim-chip' + (끔.has(k) ? ' off' : '')} onClick={() => set끔((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })}>
                    <i style={{ background: 색글(토목색[k]), opacity: 토목비침[k] ? 0.6 : 1 }} />{토목이름[k]}{k === '건물' && 참고건물 ? ' · 참고' : ''}
                  </button>
                ))}
                {바탕 && <button type="button" className={'bim-chip' + (도면선 ? '' : ' off')} onClick={() => set도면선((v) => !v)}><i style={{ background: 'transparent', borderStyle: 'dashed' }} />도면 선</button>}
              </span>
              {층들.length > 0 && (
                <select value={층만} onChange={(e) => set층만(e.target.value)} aria-label="층 고르기">
                  <option value="">모든 층{토목있음 ? ' · 토목' : ''}</option>
                  {층들.map((n) => <option key={n} value={n}>{층말(n)}만</option>)}
                </select>
              )}
              {토목만 && (
                <select value={높이배} onChange={(e) => set높이배(+e.target.value)} aria-label="높이 키우기" title="넓은 토목 현장에서 높낮이가 잘 보이게 — 물량은 그대로">
                  {[1, 2, 3, 5, 10].map((k) => <option key={k} value={k}>{k === 1 ? '높이 그대로' : '높이 ×' + k}</option>)}
                </select>
              )}
              <span className="bim-views">
                <button type="button" className="btn line sm" onClick={() => 보기('tilt')}>↗ 기울여</button>
                <button type="button" className="btn line sm" onClick={() => 보기('top')}>⬇ 위</button>
                <button type="button" className="btn line sm" onClick={() => 보기('front')}>▭ 앞</button>
                <button type="button" className="btn line sm" onClick={() => 보기('side')}>▯ 옆</button>
                <label className="bim-chk"><input type="checkbox" checked={투명} onChange={(e) => set투명(e.target.checked)} /> 비쳐 보기</label>
                <button type="button" className={'btn line sm' + (크게 ? ' on' : '')} aria-pressed={크게} onClick={() => set크게((v) => !v)}>{크게 ? '⊟ 3D 작게' : '⛶ 3D 크게'}</button>
                {못맞춘수 > 0 && <label className="bim-chk" title="층 평면 자리를 통심 기호 · 기둥으로 맞추지 못해 짐작한 부재 — 물량에는 들어 있습니다"><input type="checkbox" checked={못맞춘도} onChange={(e) => set못맞춘도(e.target.checked)} /> 자리 못 맞춘 {못맞춘수}개도</label>}
              </span>
            </div>
            <div className={'bim-view' + (크게 ? ' big' : '')}>
              <div className="bim-canvas">
                {glErr ? <div className="dx3-warn" style={{ margin: 12 }}>{glErr}</div> : <canvas ref={판Ref} />}
                <div className="bim-hint">끌기 = 돌리기 · 오른쪽 끌기(두 손가락) = 옮기기 · 휠(벌리기) = 확대 · <b>누르기 = 물량</b></div>
                {/* 📱 폰은 옆 칸이 3D 아래로 내려가 안 보이니, 고른 것의 요약을 3D 위에 */}
                {(고른 || 고른토 || 묶음) && (
                  <button type="button" className="bim-float" onClick={() => { const el = document.querySelector('.bim-side'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                    {고른
                      ? <><b>{층말(고른.층)} {종이름[고른.종류]} {고른.몸 || 고른.기호}</b> · 콘크리트 {쉼(고른물량 ? 고른물량.콘크리트 : 0, 3)}㎥ · 철근 {쉼(고른물량 ? 고른물량.철근 : 0, 1)}kg <u>자세히 ▼</u></>
                      : 고른토
                        ? <><b>{고른토.이름}</b> · {몫글(고른토).slice(0, 2).map((x) => x[0] + ' ' + x[1]).join(' · ')} <u>자세히 ▼</u></>
                        : <><b>🔵 {묶음.글}</b> {묶음.ids.size}개 <u>자세히 ▼</u></>}
                  </button>
                )}
              </div>
              <div className="bim-side">
                {고른 ? (
                  <div>
                    <div className="bim-title"><i style={{ background: 색글(종류색[고른.종류]) }} />{층말(고른.층)} {종이름[고른.종류]} <b>{고른.몸 || 고른.기호}</b></div>
                    <table className="bim-kv"><tbody>
                      <tr><th>크기(mm)</th><td>{크기글(고른)}</td></tr>
                      <tr><th>자리</th><td>X {쉼(고른.자리[0] / 1000, 2)} m · Y {쉼(고른.자리[1] / 1000, 2)} m <span className="muted">({모델.원점 ? 모델.원점.글 : ''} 기준)</span></td></tr>
                      <tr><th>높이</th><td>{높이글(고른.z0)} ~ {높이글(고른.z1)} mm</td></tr>
                      <tr><th>3D 부피</th><td>{쉼(고른.부피, 3)} ㎥</td></tr>
                    </tbody></table>
                    {고른물량 && (
                      <>
                        <div className="bim-sub">산출서 물량 (이 부재 몫)</div>
                        <table className="bim-kv"><tbody>
                          <tr><th>콘크리트</th><td><b>{쉼(고른물량.콘크리트, 3)}</b> ㎥</td></tr>
                          <tr><th>거푸집</th><td><b>{쉼(고른물량.거푸집, 2)}</b> ㎡</td></tr>
                          <tr><th>철근</th><td><b>{쉼(고른물량.철근, 1)}</b> kg <span className="muted">{Object.entries(고른물량.규격).map(([g, v]) => g + ' ' + 쉼(v, 1)).join(' · ')}</span></td></tr>
                        </tbody></table>
                      </>
                    )}
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>📄 읽은 도면: {고른.근거 && 고른.근거.n}</div>
                    {고른.짐작.map((w, i) => <div key={i} className="bim-guess">💭 {w}</div>)}
                    {고른검 && 고른검.까닭.filter((w) => w.startsWith('🤖')).map((w, i) => <div key={'m' + i} className="bim-guess">{w}</div>)}
                    {고른검 && (
                      <div className="bim-btns bim-rv-btns">
                        <button type="button" className={'btn sm' + (검수.확인.has(고른검.키) ? '' : ' line')} onClick={() => { 검수바꾸기('확인', 고른검.키, !검수.확인.has(고른검.키)); 세기('|BIM물량|검수') }}>{검수.확인.has(고른검.키) ? '✓ 확인함' : '확인함'}</button>
                        <button type="button" className="btn line sm" onClick={() => { 검수바꾸기('뺌', 고른검.키, true); 세기('|BIM물량|검수'); set선택(null); 검고르기(검다음(고른검.키)) }}>빼기</button>
                        <button type="button" className="btn line sm" onClick={() => { if (!검수.확인.has(고른검.키)) { 검수바꾸기('확인', 고른검.키, true); 세기('|BIM물량|검수') } 검고르기(검다음(고른검.키)) }}>확인하고 다음 ▶</button>
                      </div>
                    )}
                    <div className="bim-btns">
                      <button type="button" className="btn line sm" onClick={() => 묶음고르기('같은 기호 ' + (고른.몸 || 고른.기호), (o) => o.종류 === 고른.종류 && (o.몸 || o.기호) === (고른.몸 || 고른.기호))}>같은 기호 모두</button>
                      <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.보기로([고른.id])}>🔍 다가가기</button>
                      <button type="button" className="btn line sm" onClick={() => set선택(null)}>✕</button>
                    </div>
                  </div>
                ) : 고른토 ? (
                  <div>
                    <div className="bim-title"><i style={{ background: 색글(고른토.색 || 토목색[고른토.종류]) }} />{토목이름[고른토.종류]} <b>{고른토.노선 ? 고른토.측글 : 고른토.건물 ? (고른토.층 === '지붕' ? '' : 고른토.층 + ' ') + (고른토.부분 === '벽' ? '벽' : /지붕/.test(고른토.이름) ? '지붕판' : '바닥판') : 고른토.흙막이 ? (고른토.부분 === '말뚝' ? 'H-PILE' : 고른토.부분) + (고른토.단 ? ' ' + 고른토.단 + '단' : '') : 고른토.부분 || ''}</b></div>
                    <table className="bim-kv"><tbody>
                      {고른토.노선 && <tr><th>노선</th><td>{고른토.노선}</td></tr>}
                      {고른토.노선 && <tr><th>맡은 구간</th><td>{측점글(고른토.범위[0], (토.노선들[고른토.노선번] || {}).간격)} ~ {측점글(고른토.범위[1], (토.노선들[고른토.노선번] || {}).간격)} <span className="muted">({쉼(고른토.범위[1] - 고른토.범위[0], 1)} m — 앞뒤 단면 사이 반씩)</span></td></tr>}
                      {고른토.구조물 && <tr><th>구조물</th><td>{고른토.구조물}</td></tr>}
                      {고른토.건물 && <tr><th>건물</th><td>{고른토.건물}</td></tr>}
                      {고른토.흙막이 && <tr><th>흙막이</th><td>{고른토.흙막이}</td></tr>}
                      {고른토.크기 && <tr><th>크기</th><td>{고른토.크기}</td></tr>}
                      {고른토.면적 && <tr><th>단면 면적</th><td>콘크리트 {쉼(고른토.면적.콘크리트 || 0, 3)} ㎡ · 터파기 {쉼(고른토.면적.터파기 || 0, 2)} ㎡{고른토.면적.성토 > 0.005 ? ' · 성토 ' + 쉼(고른토.면적.성토, 2) + ' ㎡' : ''}</td></tr>}
                      {고른토.부피 > 0 && <tr><th>3D 부피</th><td>{쉼(고른토.부피, 2)} ㎥</td></tr>}
                    </tbody></table>
                    {몫글(고른토).length > 0 && (
                      <>
                        <div className="bim-sub">물량 (이 덩어리 몫{고른토.노선 ? ' · 평균단면법' : 고른토.건물 ? ' · 건축 평면으로 짐작한 개략' : 고른토.흙막이 ? ' · 길이 × KS 단위무게' : ' · 개략'})</div>
                        <table className="bim-kv"><tbody>{몫글(고른토).map(([k, v]) => <tr key={k}><th>{k}</th><td><b>{v}</b></td></tr>)}</tbody></table>
                      </>
                    )}
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>📄 읽은 도면: {고른토.파일}</div>
                    <div className="bim-btns">
                      {고른토.노선 && <button type="button" className="btn line sm" onClick={() => { const n = 토.노선들[고른토.노선번]; if (n) 토목묶음(n.이름, n.ids) }}>이 노선 모두</button>}
                      {고른토.건물 && <button type="button" className="btn line sm" onClick={() => { const b = 건물들.find((x) => x.이름 === 고른토.건물); if (b) 토목묶음(b.이름, b.ids) }}>이 건물 모두</button>}
                      {고른토.흙막이 && <button type="button" className="btn line sm" onClick={() => { const h = 흙들.find((x) => String(x.파일 || '').startsWith(고른토.흙막이.slice(0, 30)) || x.ids.includes(고른토.id)); if (h) 토목묶음('흙막이 · 가설', h.ids) }}>이 흙막이 모두</button>}
                      <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.보기로([선택])}>🔍 다가가기</button>
                      <button type="button" className="btn line sm" onClick={() => set선택(null)}>✕</button>
                    </div>
                  </div>
                ) : 묶음 ? (
                  <div>
                    <div className="bim-title">🔵 {묶음.글}</div>
                    {(() => {
                      const 줄 = [...묶음.ids].filter((id) => id < 토목ID).map((id) => ({ o: 부재표.get(id), q: (Q && Q.부재.get(id)) || {} })).filter((x) => x.o)
                      const 토줄 = [...묶음.ids].filter((id) => id >= 토목ID).map((id) => 토목표.get(id)).filter(Boolean)
                      const t = 줄.reduce((s, x) => ({ 콘: s.콘 + (x.q.콘크리트 || 0), 틀: s.틀 + (x.q.거푸집 || 0), 철: s.철 + (x.q.철근 || 0) }), { 콘: 0, 틀: 0, 철: 0 })
                      const u = 토줄.reduce((s, o) => { for (const [k, v] of Object.entries(o.몫 || {})) s[k] = (s[k] || 0) + v; return s }, {})
                      return (
                        <table className="bim-kv"><tbody>
                          <tr><th>개수</th><td><b>{줄.length + 토줄.length}</b> 개</td></tr>
                          {(t.콘 + (u.콘크리트 || 0) > 0 || !(u.강재 > 0)) && <tr><th>콘크리트</th><td><b>{쉼(t.콘 + (u.콘크리트 || 0), 3)}</b> ㎥</td></tr>}
                          {(t.틀 + (u.거푸집 || 0) > 0 || !(u.강재 > 0)) && <tr><th>거푸집</th><td><b>{쉼(t.틀 + (u.거푸집 || 0), 2)}</b> ㎡</td></tr>}
                          {줄.length > 0 && <tr><th>철근</th><td><b>{쉼(t.철 / 1000, 3)}</b> ton</td></tr>}
                          {u.터파기 > 0 && <tr><th>터파기</th><td><b>{쉼(u.터파기, 1)}</b> ㎥ · 되메우기 {쉼(u.되메우기 || 0, 1)} ㎥</td></tr>}
                          {u.성토 > 0.05 && <tr><th>성토</th><td><b>{쉼(u.성토, 1)}</b> ㎥</td></tr>}
                          {u.강재 > 0 && <tr><th>강재(할증 전)</th><td><b>{쉼(u.강재, 2)}</b> ton · 길이 {쉼(u.길이 || 0, 1)} m</td></tr>}
                        </tbody></table>
                      )
                    })()}
                    <div className="bim-btns"><button type="button" className="btn line sm" onClick={() => set묶음(null)}>✕ 풀기</button></div>
                  </div>
                ) : (
                  <div className="muted" style={{ fontSize: 13 }}>
                    👆 3D 에서 <b>부재 · 덩어리를 누르면</b> 크기 · 자리 · 물량이 여기에 나옵니다.<br />아래 <b>물량 표</b>의 칸을 누르면 그 부재들이 파랗게 칠해집니다.
                    {참고건물 ? <><br /><br />🏢 골조를 건축 평면도의 같은 건물 자리에 겹쳐 놓았습니다({같은건물.방법 === '통심' ? `통심 ${같은건물.통심.글들.slice(0, 4).join(' · ')} 맞춤 · ` : ''}{층말(같은건물.층)} 발자국 {Math.round(같은건물.몫 * 100)}% 겹침). 건축 평면 덩어리는 «참고»로 꺼 두고 합에서 뺐습니다(칩으로 켜 볼 수 있음).</>
                      : 토목있음 && 골조수 > 0 && <><br /><br />🏢 골조(부재 일람표로 세운 건물)는 토목 오른쪽 20 m · 땅 높이에 놓았습니다.</>}
                    {건물들.some((b) => b.자리 === '모양') && <><br /><br />🏢 건축 평면 건물은 배치도의 같은 모양 자리에 놓았습니다.</>}
                  </div>
                )}
              </div>
            </div>
            </>) : <div className="muted" style={{ fontSize: 13, margin: '10px 0' }}>3D 로 세울 덩어리를 못 찾았습니다 — 물량은 아래 표와 엑셀로 보십시오.</div>}
            <div className="bim-out">
              <button type="button" className="btn" onClick={엑셀받기} disabled={!!받는중}>{받는중 === '엑셀' ? '만드는 중…' : '⬇ 엑셀 수량산출서'}</button>
              <button type="button" className="btn line" onClick={IFC받기} disabled={!!받는중 || !그림있음}>{받는중 === 'IFC' ? '만드는 중…' : '⬇ IFC (레빗 · BIM 프로그램)'}</button>
              <button type="button" className="btn line" onClick={사진받기} disabled={!!glErr || !그림있음}>📷 3D 사진</button>
            </div>
          </div>

          {골조수 > 0 && 검목록.length > 0 && (() => {
            const 끝 = 검목록.filter((x) => !검남(x)).length, 뺀수 = 검목록.filter((x) => 검수.뺌.has(x.키)).length
            const 몫 = Math.round(끝 / 검목록.length * 100)
            const 종들 = 종류들.filter((k) => 검목록.some((x) => x.o.종류 === k))
            const 줄 = 검순.filter((x) => !검종 || x.o.종류 === 검종).sort((a, b) => (검남(b) ? 1 : 0) - (검남(a) ? 1 : 0))
            const 다음 = 검다음(null)
            return (
              <div className="card bim-review">
                <h2 className="bim-h2">🔎 검수 <span className="muted">— 클로드가 짐작하거나 만든 값이 든 부재 {쉼(검목록.length)}개 · 확인 {쉼(끝 - 뺀수)} · 뺌 {쉼(뺀수)} ({몫}%)</span></h2>
                <div className="bim-rv-bar" aria-label={'검수 ' + 몫 + '%'}><i style={{ width: 몫 + '%' }} /></div>
                <div className="bim-rv-top">
                  <span className="bim-chips">
                    <button type="button" className={'bim-chip' + (!검종 ? ' on' : '')} onClick={() => set검종('')}>모두 {쉼(검목록.filter(검남).length)}</button>
                    {종들.map((k) => <button key={k} type="button" className={'bim-chip' + (검종 === k ? ' on' : '')} onClick={() => set검종(k)}><i style={{ background: 색글(종류색[k]) }} />{종이름[k]} {쉼(검목록.filter((x) => x.o.종류 === k && 검남(x)).length)}/{쉼(검목록.filter((x) => x.o.종류 === k).length)}</button>)}
                  </span>
                  {다음 ? <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => 검고르기(다음)}>▶ 다음 확인할 것 — {층말(다음.o.층)} {종이름[다음.o.종류]} {다음.o.몸 || 다음.o.기호}</button> : <span className="bim-rv-done">✓ 다 봤습니다</span>}
                </div>
                <div className="bim-tblwrap">
                  <table className="bim-tbl bim-rv-tbl">
                    <thead><tr><th>층</th><th>부재</th><th>크기(mm)</th><th>확인할 까닭</th><th>콘크리트</th><th></th></tr></thead>
                    <tbody>
                      {줄.slice(0, 300).map((x) => {
                        const 뺐 = 검수.뺌.has(x.키), 확 = 검수.확인.has(x.키), q = Q && Q.부재.get(x.o.id)
                        return (
                          <tr key={x.키} className={(뺐 ? 'rv-out' : 확 ? 'rv-ok' : '') + (고른 === x.o ? ' rv-sel' : '')} onClick={() => 검고르기(x)}>
                            <td>{층말(x.o.층)}</td>
                            <td><i style={{ background: 색글(종류색[x.o.종류]) }} />{종이름[x.o.종류]} <b>{x.o.몸 || x.o.기호}</b></td>
                            <td>{크기글(x.o)}</td>
                            <td className="rv-why">{x.까닭.slice(0, 2).map((w, i) => <div key={i}>{w}</div>)}{x.까닭.length > 2 && <div className="muted">… {x.까닭.length - 2}가지 더</div>}</td>
                            <td>{뺐 ? '—' : q ? 쉼(q.콘크리트, 2) + ' ㎥' : ''}</td>
                            <td className="rv-btns" onClick={(e) => e.stopPropagation()}>
                              {!뺐 && <button type="button" className={'btn sm' + (확 ? '' : ' line')} onClick={() => { 검수바꾸기('확인', x.키, !확); 세기('|BIM물량|검수') }}>{확 ? '✓ 확인함' : '확인'}</button>}
                              <button type="button" className="btn line sm" onClick={() => { 검수바꾸기('뺌', x.키, !뺐); 세기('|BIM물량|검수'); if (!뺐 && 고른 === x.o) set선택(null) }}>{뺐 ? '되돌리기' : '빼기'}</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {줄.length > 300 && <div className="muted" style={{ fontSize: 12.5 }}>… {쉼(줄.length - 300)}개 더 — 위 종류 단추로 나눠 보십시오</div>}
                <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>줄을 누르면 3D 가 크게 그 부재로 갑니다 · <b>빼기</b> 한 부재는 3D · 물량 · 엑셀에서 빠집니다(되돌리기 가능) · 확인 · 뺌은 이 브라우저에 파일 이름마다 기억합니다.</div>
              </div>
            )
          })()}

          {골조수 > 0 && 일람표.length > 0 && (() => {
            const 지금 = 일람표.find((t) => t.종류 === 일람종) || 일람표[0]
            const 만든수 = (t) => t.줄.filter((z) => z.만든).length
            const 모든줄 = 일람표.reduce((n, t) => n + t.줄.length, 0), 모든만든 = 일람표.reduce((n, t) => n + 만든수(t), 0)
            return (
              <div className="card bim-ilam">
                <h2 className="bim-h2">📋 부재 일람표 <span className="muted">— 도면에서 읽어 만든 일람 {쉼(모든줄)}줄 · 📄 도면 {쉼(모든줄 - 모든만든)} · 🤖 클로드가 만든 값 {쉼(모든만든)}</span></h2>
                <div className="bim-rv-top">
                  <span className="bim-chips">
                    {일람표.map((t) => <button key={t.종류} type="button" className={'bim-chip' + (지금 === t ? ' on' : '')} onClick={() => { set일람종(t.종류); 세기('|BIM물량|일람') }}>{t.이름} {쉼(t.줄.length)}{만든수(t) ? ' · 🤖 ' + 쉼(만든수(t)) : ''}</button>)}
                  </span>
                </div>
                <div className="bim-tblwrap">
                  <table className="bim-tbl bim-il-tbl">
                    <thead><tr>{지금.머리.map((h) => <th key={h}>{h}</th>)}<th>3D</th><th>근거</th></tr></thead>
                    <tbody>
                      {지금.줄.map((z) => (
                        <tr key={z.기호} className={(z.만든 ? 'il-made' : '') + (z.쓰임 ? ' il-use' : '')} onClick={() => { if (z.쓰임) 묶음고르기(지금.이름 + ' ' + z.기호, (o) => (o.표 === '옹벽' ? '벽' : o.표) === 지금.종류 && String(o.기호 || '').trim() === z.기호) }}>
                          <th>{z.기호}</th>
                          {z.칸.map((v, i) => <td key={i}>{v || <span className="muted">—</span>}</td>)}
                          <td>{z.쓰임 ? 쉼(z.쓰임) : <span className="muted">—</span>}</td>
                          <td className="il-why">{z.만든 ? <>🤖 {z.만든}</> : <span className="muted">📄 도면</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>🤖 = 도면 일람표에 없거나 빈 칸이라 클로드가 채운 값(어디서 가져왔는지 «근거» 에) · 3D = 이 기호로 세운 부재 수(— 는 일람표에만 있음) · 줄을 누르면 그 부재들이 3D 에서 파랗게 · 엑셀 수량산출서 «부재 일람표» 시트에도 들어갑니다.</div>
              </div>
            )
          })()}

          {골조수 > 0 && (
            <div className="card">
              <h2 className="bim-h2">📊 골조 물량 표 <span className="muted">— 칸을 누르면 3D 에서 그 부재들이 파랗게</span></h2>
              <div className="bim-tblwrap">
                <table className="bim-tbl">
                  <thead><tr><th>층</th>{있는종류.map((k) => <th key={k}><i style={{ background: 색글(종류색[k]) }} />{종이름[k]}</th>)}<th>층 합</th></tr></thead>
                  <tbody>
                    {층들.map((n) => {
                      let 층합 = 0
                      return (
                        <tr key={n}>
                          <th>{층말(n)}</th>
                          {있는종류.map((k) => {
                            const c = 칸(n, k)
                            if (!c) return <td key={k} className="muted">—</td>
                            층합 += c.콘크리트
                            return (
                              <td key={k} className="bim-cell" onClick={() => 묶음고르기(층말(n) + ' ' + 종이름[k], (o) => o.층 === n && o.종류 === k)}>
                                <b>{쉼(c.콘크리트, 2)}</b> ㎥<span>{c.개수}개 · 거푸집 {쉼(c.거푸집, 1)}㎡ · 철근 {쉼(c.철근 / 1000, 2)}t</span>
                              </td>
                            )
                          })}
                          <td><b>{쉼(층합, 2)}</b> ㎥</td>
                        </tr>
                      )
                    })}
                    <tr className="bim-total">
                      <th>합계</th>
                      {있는종류.map((k) => {
                        const t = 층들.reduce((s, n) => s + ((칸(n, k) || {}).콘크리트 || 0), 0)
                        return <td key={k} className="bim-cell" onClick={() => 묶음고르기('모든 ' + 종이름[k], (o) => o.종류 === k)}><b>{쉼(t, 2)}</b> ㎥</td>
                      })}
                      <td><b>{쉼(합.콘, 2)}</b> ㎥</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {Q && Q.기타 && (Q.기타.콘크리트 > 0.0005 || Q.기타.거푸집 > 0.0005) && <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>그 밖(자리 없는 줄 — 슬래브 마구리 등): 콘크리트 {쉼(Q.기타.콘크리트, 2)} ㎥ · 거푸집 {쉼(Q.기타.거푸집, 2)} ㎡ · 철근 {쉼(Q.기타.철근, 1)} kg</div>}
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>물량은 <Link to="/jeoksan/golgo">골조 수량산출</Link>과 같은 셈(겹치는 곳 공제 · 철근 정착 · 이음)입니다 — 엑셀에 산출근거 식이 그대로 들어갑니다.</div>
            </div>
          )}

          {토목물 && (
            <div className="card">
              <h2 className="bim-h2">🏞 토목 물량 표 <span className="muted">— 평균단면법 · 줄을 누르면 3D 에서 파랗게</span></h2>
              <div className="bim-tblwrap">
                <table className="bim-tbl">
                  <thead><tr><th>노선 · 구조물</th><th>연장</th><th><i style={{ background: 색글(토목색.수로) }} />콘크리트</th><th>거푸집</th><th><i style={{ background: 색글(토목색.터파기) }} />터파기</th>{절있음 && <th>흙깎기</th>}<th>되메우기</th><th><i style={{ background: 색글(토목색.성토) }} />성토</th></tr></thead>
                  <tbody>
                    {토.노선들.map((n) => (
                      <tr key={'n' + n.번} className="bim-cell" onClick={() => 토목묶음(n.이름, n.ids)}>
                        <th>{n.이름}<span className="muted" style={{ display: 'block', fontWeight: 400, fontSize: 11 }}>단면 {n.단면수}개 · {측점글(n.시작, n.간격)} ~ {측점글(n.끝, n.간격)}{n.세움 ? '' : ' · 3D 못 세움(노선 없음)'}</span>
                          {표쓴노선.includes(n) && <span className="bim-pyo" title={'선으로 잰 값(맞춰 보기): 판 곳(터파기 + 흙깎기) ' + 쉼(n.선합.터파기, 1) + ' · 되메우기 ' + 쉼(n.선합.되메우기, 1) + ' · 성토 ' + 쉼(n.선합.성토, 1) + ' ㎥ — 도면 표: 터파기 + 흙깎기 ' + 쉼(n.합.터파기 + (n.합.절토 || 0), 1) + ' ㎥'}>📋 토공 = 도면 표 값 <em>· 선으로 잰 판 곳 {쉼(n.선합.터파기, 0)} ㎥(표 {쉼(n.합.터파기 + (n.합.절토 || 0), 0)})</em></span>}</th>
                        <td>{쉼(n.길이, 1)} m</td>
                        <td><b>{쉼(n.합.콘크리트, 2)}</b> ㎥</td>
                        <td>{쉼(n.합.거푸집, 1)} ㎡</td>
                        <td>{쉼(n.합.터파기, 1)} ㎥</td>
                        {절있음 && <td>{쉼(n.합.절토 || 0, 1)} ㎥</td>}
                        <td>{쉼(n.합.되메우기, 1)} ㎥</td>
                        <td>{쉼(n.합.성토, 1)} ㎥</td>
                      </tr>
                    ))}
                    {토.구조물들.map((q, qi) => (
                      <tr key={'s' + qi} className="bim-cell" onClick={() => 토목묶음(q.이름, q.ids)}>
                        <th>🏭 {q.이름}<span className="muted" style={{ display: 'block', fontWeight: 400, fontSize: 11 }}>개략 · 벽 {쉼(q.넓이.벽, 1)} ㎡ × {쉼(q.벽높, 2)} m + 바닥 {쉼(q.넓이.바닥, 1)} ㎡ × {q.바닥두께} mm</span></th>
                        <td className="muted">—</td>
                        <td><b>{쉼(q.합.콘크리트, 2)}</b> ㎥</td>
                        <td>{쉼(q.합.거푸집, 1)} ㎡</td>
                        <td className="muted">—</td>{절있음 && <td className="muted">—</td>}<td className="muted">—</td><td className="muted">—</td>
                      </tr>
                    ))}
                    <tr className="bim-total">
                      <th>합계</th><td />
                      <td><b>{쉼(토목합.콘크리트, 2)}</b> ㎥</td><td>{쉼(토목합.거푸집, 1)} ㎡</td><td>{쉼(토목합.터파기, 1)} ㎥</td>{절있음 && <td>{쉼(토목합.절토, 1)} ㎥</td>}<td>{쉼(토목합.되메우기, 1)} ㎥</td><td>{쉼(토목합.성토, 1)} ㎥</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {토.구조물들.length > 0 && (
                <div className="bim-floors" style={{ marginTop: 10 }}>
                  {토.구조물들.map((q, qi) => (
                    <label key={'t' + qi} className={q.기본두께 ? 'guess' : ''}>
                      <span>🏭 {q.이름} 바닥판 두께</span>
                      <input className="inp" inputMode="numeric" value={두께[q.이름] !== undefined ? 두께[q.이름] : String(q.바닥두께)}
                             onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, ''); set두께((h) => ({ ...h, [q.이름]: v })) }} />
                      <em>mm{q.기본두께 ? ' · 짐작' : ''}</em>
                    </label>
                  ))}
                  {Object.keys(두께).length > 0 && <button type="button" className="btn line sm" onClick={() => set두께({})}>↩ 짐작 값으로</button>}
                </div>
              )}
              {토.노선들.map((n) => (
                <details key={'d' + n.번} className="bim-how">
                  <summary>📐 {n.이름} — 평균단면 {n.줄.length}줄</summary>
                  <div className="bim-tblwrap">
                    <table className="bim-tbl" style={{ minWidth: 640 }}>
                      <thead><tr><th>측점</th><th>거리(m)</th><th>콘크리트 ㎡</th><th>콘크리트 ㎥</th><th>터파기 ㎡{n.표씀 && n.표씀.터파기 ? ' (표)' : ''}</th>{n.선줄 && <th className="muted">선으로 잰 판 곳 ㎡</th>}<th>터파기 ㎥</th>{절있음 && <th>흙깎기 ㎥</th>}<th>되메우기 ㎥</th><th>성토 ㎥</th></tr></thead>
                      <tbody>
                        {n.줄.map((r, i) => (
                          <tr key={i} className="bim-cell" title="누르면 이 단면의 덩어리를 3D 에서 파랗게 · 다가감"
                              onClick={() => 토목묶음(n.이름 + ' ' + 측점글(r.측, n.간격), 토.부재.filter((o) => o.노선번 === n.번 && Math.abs(o.측 - r.측) < 1e-6).map((o) => o.id))}>
                            <th>{측점글(r.측, n.간격)}</th><td>{쉼(r.거리, 2)}</td><td>{쉼(r.면적.콘크리트, 3)}</td><td>{쉼(r.부피.콘크리트, 2)}</td><td>{쉼(r.면적.터파기, 2)}</td>{n.선줄 && <td className="muted">{쉼(n.선줄[i] ? n.선줄[i].면적.터파기 : NaN, 2)}</td>}<td>{쉼(r.부피.터파기, 1)}</td>{절있음 && <td>{쉼(r.부피.절토 || 0, 1)}</td>}<td>{쉼(r.부피.되메우기, 1)}</td><td>{쉼(r.부피.성토, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                단면 둘 사이 = (앞 면적 + 뒤 면적) ÷ 2 × 거리 — <Link to="/tools/dxf3d">도면 3D 보기</Link> · 토공 화면과 같은 셈이고, 엑셀에 식이 그대로 들어갑니다.
                {표쓴노선.length > 0 && ' 📋 횡단면도 측점 표에 터파기 · 되메우기 · 흙쌓기 · 흙깎기 면적이 적혀 있으면 그 값(설계자 값)으로 셉니다 — 선으로 잰 값은 맞춰 보기용으로 옆에 둡니다.'}
                3D 덩어리 하나는 단면 하나가 앞뒤 반 칸씩 맡은 몫입니다(몫을 다 더하면 노선 합계와 같음).
              </div>
            </div>
          )}

          {건물들.length > 0 && (
            <div className="card">
              <h2 className="bim-h2">🏢 건물(건축 평면) 물량 표 <span className="muted">— 부재 일람표 없이 평면 겹선으로 세운 개략 · 줄을 누르면 3D 에서 파랗게</span></h2>
              {참고건물 && <div className="dx3-warn" style={{ marginTop: 0 }}>ℹ️ «{참고건물}» 은 골조(구조평면도 · 일람표)와 같은 건물이라 <b>참고</b>로만 둡니다 — 위 요약 · 엑셀 합계 · IFC 에 안 넣었습니다. 물량은 골조 물량 표를 보십시오.</div>}
              {건물들.map((b, bi) => {
                const 층몫 = (f) => 토.부재.filter((o) => o.건물 === b.이름 && o.층 === f.이름).reduce((a, o) => ({ 콘: a.콘 + (o.몫 ? o.몫.콘크리트 || 0 : 0), 틀: a.틀 + (o.몫 ? o.몫.거푸집 || 0 : 0), ids: [...a.ids, o.id] }), { 콘: 0, 틀: 0, ids: [] })
                return (
                  <div key={'b' + bi} className="bim-tblwrap" style={{ marginBottom: 10 }}>
                    <table className="bim-tbl">
                      <thead><tr><th>{b.이름}{b.옆 ? <span className="muted" style={{ fontWeight: 400 }}> · 토목 옆</span> : b.자리 === '모양' ? <span className="muted" style={{ fontWeight: 400 }}> · 배치도 자리</span> : null}</th><th>높이(m)</th><th><i style={{ background: 색글(토목색.건물바닥) }} />바닥 넓이</th><th><i style={{ background: 색글(토목색.건물) }} />벽(평면)</th><th>벽 높이</th><th>콘크리트</th><th>거푸집</th></tr></thead>
                      <tbody>
                        {b.층.map((f, fi) => {
                          const m = 층몫(f)
                          return (
                            <tr key={fi} className="bim-cell" onClick={() => 토목묶음(b.이름 + ' ' + f.이름, m.ids)}>
                              <th>{f.이름}{f.지붕 && !/지붕/.test(f.이름) ? ' (지붕)' : ''}{f.뺀벽 ? <span className="muted" style={{ display: 'block', fontWeight: 400, fontSize: 11 }}>벽 안 세움 — 두께 {쉼(f.두께, 2)} m 로 읽힘</span> : null}</th>
                              <td>{쉼(f.z0, 2)}{f.지붕 ? '' : ' ~ ' + 쉼(f.z1, 2)}</td>
                              <td>{쉼(f.바닥, 1)} ㎡</td>
                              <td>{f.벽 ? 쉼(f.벽, 1) + ' ㎡' : '—'}</td>
                              <td>{f.벽높 ? 쉼(f.벽높, 2) + ' m' : '—'}</td>
                              <td><b>{쉼(m.콘, 2)}</b> ㎥</td>
                              <td>{쉼(m.틀, 1)} ㎡</td>
                            </tr>
                          )
                        })}
                        <tr className="bim-total bim-cell" onClick={() => 토목묶음(b.이름, b.ids)}>
                          <th>합계 · 연면적 {쉼(b.연면적, 1)} ㎡</th><td /><td /><td /><td />
                          <td><b>{쉼(b.합.콘크리트, 2)}</b> ㎥</td><td>{쉼(b.합.거푸집, 1)} ㎡</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })}
              <div className="bim-floors" style={{ marginTop: 4 }}>
                {건물들.map((b, bi) => (
                  <label key={'bt' + bi} className={b.기본두께 ? 'guess' : ''}>
                    <span>🏢 {b.이름} 바닥판 두께</span>
                    <input className="inp" inputMode="numeric" value={건물두께[b.이름] !== undefined ? 건물두께[b.이름] : String(b.바닥두께)}
                           onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, ''); set건물두께((h) => ({ ...h, [b.이름]: v })) }} />
                    <em>mm{b.기본두께 ? ' · 짐작' : ''}</em>
                  </label>
                ))}
                {Object.keys(건물두께).length > 0 && <button type="button" className="btn line sm" onClick={() => set건물두께({})}>↩ 짐작 값으로</button>}
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                층마다 평면의 겹선(두 줄 사이)을 벽으로, 바깥 테두리를 바닥판으로 읽었습니다. 벽은 층 바닥에서 윗층 바닥판 아래까지 세우고, 창 · 문 구멍과 기둥은 빼지 않은 <b>개략</b>입니다.
                부재 일람표(크기 표)가 든 구조 도면을 같이 넣으시면 골조로 정확히 셉니다.
              </div>
            </div>
          )}

          {흙들.length > 0 && (
            <div className="card">
              <h2 className="bim-h2">🧱 흙막이 · 가설 물량 표 <span className="muted">— 흙막이 평면도 · 전개도 · 도면 글자(규격 · 간격 · 굴착 깊이)에서 읽음</span></h2>
              {흙들.map((h, hi) => {
                const q = 흙물[hi]
                if (!q) return null
                const 짧 = String(h.파일 || '흙막이').replace(/\.(dxf|dwg)$/i, '')
                return (
                  <div key={'h' + hi} className="bim-tblwrap" style={{ marginBottom: 10 }}>
                    <table className="bim-tbl bim-tbl-h">
                      <thead><tr><th>{흙들.length > 1 ? 짧 : '공종'}</th><th className="bim-d">규격</th><th>수량</th><th>길이</th><th className="bim-d">단위무게</th><th>중량</th></tr></thead>
                      <tbody>
                        {q.줄.map((x, i) => (
                          <tr key={i} className="bim-cell" title="누르면 3D 에서 파랗게" onClick={() => 토목묶음(x.공종, (h.ids || []).filter((id) => { const o = 토목표.get(토목ID + id); return o && o.부분 === x.부분 && (!x.단 || (o.단 || 1) === x.단) }))}>
                            <th>{x.공종}<span className="bim-m muted">{x.규격 || '규격 못 읽음'}{x.kg ? ' · ' + 쉼(x.kg, 1) + ' kg/m' : ''}</span>{x.짐작 ? <span className="muted" style={{ display: 'block', fontWeight: 400, fontSize: 11 }}>{x.짐작}</span> : null}</th>
                            <td className="bim-d bim-nw">{x.규격 || '—'}</td>
                            <td className="bim-nw">{x.수량 != null ? 쉼(x.수량) + ' 본' : '—'}</td>
                            <td className="bim-nw">{쉼(x.길이, 1)} m</td>
                            <td className="bim-d bim-nw">{x.kg ? 쉼(x.kg, 1) + ' kg/m' : '—'}</td>
                            <td><b>{쉼(x.중량, 2)}</b> ton</td>
                          </tr>
                        ))}
                        <tr className="bim-total">
                          <th>강재 합계 <span className="muted" style={{ fontWeight: 400 }}>(할증 {쉼(할증수, 1)}% 넣음)</span></th><td className="bim-d" /><td /><td className="bim-nw">{쉼(q.줄.reduce((n, x) => n + x.길이, 0), 1)} m</td><td className="bim-d" />
                          <td className="bim-nw"><b>{쉼(q.강재, 2)}</b> ton</td>
                        </tr>
                        {q.토류판 && <tr className="bim-cell" onClick={() => 토목묶음('토류판', (h.ids || []).filter((id) => { const o = 토목표.get(토목ID + id); return o && o.부분 === '토류판' }))}><th>토류판(흙막이판)<span className="bim-m muted">{h.토류판.근거 === '전개도' ? '전개도' : '글자 깊이'}</span></th><td className="bim-d muted">{h.토류판.근거 === '전개도' ? '전개도' : '글자 깊이'}</td><td /><td>{쉼(q.토류판.길이, 1)} m × {쉼(q.토류판.깊이, 2)} m</td><td className="bim-d" /><td className="bim-nw"><b>{쉼(q.토류판.넓이, 1)}</b> ㎡</td></tr>}
                        {q.터파기 && <tr className="bim-cell" onClick={() => { const ids = (h.ids || []).filter((id) => { const o = 토목표.get(토목ID + id); return o && o.종류 === '터파기' }).map((id) => 토목ID + id); set끔((s0) => { const n = new Set(s0); n.delete('터파기'); return n }); set선택(null); set묶음(ids.length ? { 글: '건물 터파기(흙막이 안)', ids: new Set(ids) } : null); setTimeout(() => { if (보기Ref.current && ids.length) 보기Ref.current.보기로(ids) }, 50) }}><th>건물 터파기<span className="bim-m muted">흙막이 안</span><span className="bim-d" style={{ display: 'inline' }}>(흙막이 안)</span></th><td className="bim-d" /><td /><td>{쉼(q.터파기.넓이, 1)} ㎡ × {쉼(q.터파기.깊이, 2)} m</td><td className="bim-d" /><td className="bim-nw"><b>{쉼(q.터파기.부피, 1)}</b> ㎥</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )
              })}
              <div className="bim-floors" style={{ marginTop: 4 }}>
                <label>
                  <span>🧱 강재 할증</span>
                  <input className="inp" inputMode="decimal" value={흙할증} onChange={(e) => set흙할증(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))} />
                  <em>% · 도면 재료표 «Add 10%»</em>
                </label>
                {흙할증 !== '10' && <button type="button" className="btn line sm" onClick={() => set흙할증('10')}>↩ 10%</button>}
              </div>
              <details className="bim-how">
                <summary>📐 어떻게 셌나요</summary>
                <ul>
                  {흙들.flatMap((h, hi) => (h.근거 || []).map((g, i) => <li key={hi + '-' + i}>{g}</li>))}
                  <li><b>말뚝 개수</b> = 평면의 H 모양 수 — 1단 · 2단 · 공법 평면에 같은 말뚝을 또 그린 것은 한 번만(가장 많이 그린 한 장)</li>
                  <li><b>띠장 · 버팀보 · 사보강 · 보강재</b> = 단(1단 · 2단) 평면마다 선 길이 — 두세 줄로 그린 H 형강 · 겹쳐 그린 선은 한 줄로</li>
                  <li><b>단위무게</b> = 도면 글자의 H 형강 규격(«H-298x201x9/14» 등)으로 KS 넓이 × 7.85 t/㎥ · <b>중량</b> = 길이 × 단위무게 × (1 + 할증)</li>
                </ul>
              </details>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                줄을 누르면 3D 에서 그 부재들이 파랗게 칠해집니다. 엑셀 «흙막이 · 가설» 시트에 식이 그대로 들어갑니다(노란 할증 칸을 바꾸면 다시 셈). 높이는 흙막이 단면도의 E.L 글자로 읽습니다(단면도가 없으면 짐작). 이음판 · 볼트 · 잭 · 복공(주형보 · 복공판)은 아직 안 셉니다.
              </div>
            </div>
          )}

          {골조수 > 0 && (
            <div className="card">
              <h2 className="bim-h2">📏 층 높이 <span className="muted">— 도면 글자에서 읽은 값 · 짐작한 층만 바꾸시면 됩니다(도면은 그대로)</span></h2>
              <div className="bim-floors">
                {(모델.바닥들 || []).map((f) => (
                  <label key={f.이름} className={f.짐작 ? 'guess' : ''}>
                    <span>{층말(f.이름)} 바닥</span>
                    <input className="inp" inputMode="numeric" value={높이[f.이름] !== undefined ? 높이[f.이름] : String(Math.round(f.높이))}
                           onChange={(e) => { const v = e.target.value.replace(/[^\d\-]/g, ''); set높이((h) => ({ ...h, [f.이름]: v })) }} />
                    <em>mm{f.읽음 ? ' · 도면' : f.짐작 ? ' · 짐작' : ''}</em>
                  </label>
                ))}
                {Object.keys(높이).length > 0 && <button type="button" className="btn line sm" onClick={() => set높이({})}>↩ 도면 값으로</button>}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="bim-h2">🔍 스스로 검사 · 짐작</h2>
            <ul className="bim-check">
              {R && (R.읽음 && R.읽음.평면 || []).length > 0 && <li className="info">📄 읽은 평면 {R.읽음.평면.length}장: {R.읽음.평면.map((p) => p.제목 + ' → ' + p.층.map(층말).join('·')).join(' · ')}</li>}
              {모델 && 모델.원점 && <li className="ok">📍 원점(0, 0): {모델.원점.글}</li>}
              {(모델 ? 모델.맞춤 : []).map((m, i) => <li key={'m' + i} className={m.방법 === '테두리' ? 'warn' : 'ok'}>🧭 {층말(m.층)} 평면{m.종류 ? '(' + m.종류.replace('슬라브', '슬래브') + ' ' + m.수 + '개)' : ''} — {m.글}</li>)}
              {검.map((z, i) => <li key={'c' + i} className={z.정보 ? 'info' : z.좋음 ? 'ok' : 'warn'}>{z.정보 ? '📦' : z.좋음 ? '✓' : '⚠️'} {z.글}</li>)}
              {골조뺌 && <li className="warn">🧱 골조로 읽은 부재가 {모델0.부재.length}개({[...new Set(모델0.부재.map((o) => 종이름[o.종류] || o.종류))].join(' · ')})뿐이라 토목 도면의 표 · 글자를 잘못 읽은 것으로 보고 세우지 않았습니다 — 건물 골조는 구조평면도 · 부재 일람표를 넣어 주십시오.</li>}
              {토목있음 && 토.노선들.map((n) => <li key={'tn' + n.번} className={n.세움 ? 'ok' : 'warn'}>🛣 {n.이름} — 단면 {n.단면수}개 {n.세움 ? '· 평면 노선을 따라 세움' : '· 평면 노선을 못 찾아 물량만'}</li>)}
              {토목있음 && 토.구조물들.map((q, qi) => <li key={'tq' + qi} className="ok">🏭 {q.이름} — 평면 겹선으로 벽 {쉼(q.넓이.벽, 1)} ㎡(평균 두께 약 {쉼(q.두께, 2)} m) · 바닥 {쉼(q.넓이.바닥, 1)} ㎡ · EL {쉼(q.아래, 2)} ~ {쉼(q.위, 2)} m</li>)}
              {같은건물 && <li className={같은건물.같음 ? 'ok' : 'info'}>🏢 골조 ↔ 건축 평면 «{건물들[같은건물.번].이름}» — {같은건물.방법 === '통심' ? `통심 ${같은건물.통심.글들.slice(0, 6).join(' · ')}(${같은건물.통심.줄수}줄 · 남는 차 ${같은건물.통심.최대} mm) · ` : ''}{층말(같은건물.층)} 발자국 {Math.round(같은건물.몫 * 100)}% 겹침 · 돌림 {(같은건물.θ * 180 / Math.PI).toFixed(1)}° {같은건물.같음 ? '→ 같은 건물: 골조를 그 자리에 놓고 건축 평면 덩어리는 참고' : !같은건물.층맞음 ? `→ 층 수가 달라(골조 ${같은건물.층수[0]}개 · 건축 평면 ${같은건물.층수[1]}개) 다른 건물로 봄` : '→ 55% 못 미쳐 다른 건물로 봄'}</li>}
              {흙들.map((h, hi) => { const 전 = (h.제목들 || []).filter((t) => /전\s*개/.test(t)).length; const 단 = (h.제목들 || []).filter((t) => /단\s*면/.test(t)).length; const 규 = Object.values(h.규격 || {}).filter(Boolean).length; return <li key={'th' + hi} className={h.말뚝.개수 && 규 ? 'ok' : 'warn'}>🧱 가설 흙막이 — 평면 {(h.제목들 || []).length - 전 - 단}장 · 전개도 {전}장 · 단면도 {단}장{h.단면 ? '(높이 읽음)' : ''} · H-PILE {h.말뚝.개수}본{h.간격 ? ' · 간격 ' + 쉼(h.간격) + ' mm' : ''}{h.깊이 ? ' · 굴착 깊이 ' + 쉼(h.깊이.작, 2) + ' ~ ' + 쉼(h.깊이.큰, 2) + ' m' : ''} · 규격 {규 ? 규 + '종 읽음' : '못 읽음(H-300x300x10/15 같은 글자가 없음)'}</li> })}
              {건물들.map((b, bi) => <li key={'tb' + bi} className={b.옆 ? 'warn' : 'ok'}>🏢 {b.이름}{b.이름 === 참고건물 ? '(참고)' : ''} — 건축 평면 {b.층.length}개 층 · 연면적 {쉼(b.연면적, 1)} ㎡ · {b.옆 ? '배치도에서 자리를 못 찾아 토목 오른쪽 20 m 에 놓음(배치도 · 계획평면도를 같이 넣어 주시면 자리를 찾습니다)' : b.자리 === '모양' ? '배치도의 같은 모양 자리에 놓음' + (b.방이름 ? '(같은 방 이름이 적힌 곳)' : '') : '이 도면이 자리의 기준'}{b.땅 != null ? ' · 땅 EL ' + 쉼(b.땅, 2) + ' m' : ''}</li>)}
              {(모델 ? 모델.짐작 : []).map((w, i) => <li key={'g' + i} className="guess">💭 {w}</li>)}
              {토목있음 && 토.짐작.map((w, i) => <li key={'tg' + i} className="guess">💭 {w}</li>)}
              {토목있음 && 토.경고.map((w, i) => <li key={'tw' + i} className="warn">⚠️ {w}</li>)}
              {R && (R.경고 || []).slice(0, 8).map((w, i) => <li key={'w' + i} className="warn">⚠️ {w}</li>)}
              {R && (R.경고 || []).length > 8 && (
                <li className="warn"><details><summary>⚠️ 읽기 경고 {R.경고.length - 8}개 더 보기</summary>{R.경고.slice(8).map((w, i) => <div key={i}>· {w}</div>)}</details></li>
              )}
              {S && (S.경고 || []).slice(0, 10).map((w, i) => <li key={'s' + i} className="warn">⚠️ 셈: {w.글}</li>)}
            </ul>
            {골조수 > 0 && <div className="muted" style={{ fontSize: 12.5 }}>3D 부피는 부재를 도면 크기 그대로 세운 값(겹침 공제 전)이고, 산출서 콘크리트는 겹치는 곳을 뺀 값이라 보 · 기둥은 조금 작게 나옵니다.</div>}
            {토목물 && <div className="muted" style={{ fontSize: 12.5 }}>토목 3D 부피는 단면을 앞뒤 반 칸씩 그대로 세운 값이고, 물량은 평균단면법 값이라 단면이 바뀌는 곳에서 조금 다릅니다.</div>}
          </div>
        </>
      )}

      <div className="card">
        <div className="muted" style={{ fontSize: 13 }}>
          같이 쓰면 좋은 것: <Link to="/jeoksan/golgo">골조 수량산출(고쳐 쓰기)</Link> · <Link to="/jeoksan/auto">도면 물량 자동</Link> · <Link to="/jeoksan/magam">마감 수량산출</Link> · <Link to="/tools/dxf3d">도면 3D 보기(토목 · 건물 선)</Link> · <Link to="/tools/dwgdxf">DWG → DXF</Link>
        </div>
      </div>
    </div>
  )
}
