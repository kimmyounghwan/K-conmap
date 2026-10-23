/**
 * 📐 도면 넣기 → 골조 모델 (G389 · 2026-10-23) — 작업 화면(/jeoksan/model?ws=1)의 «📐 도면 넣기»
 *
 * 소장님: 「캐드 도면 넣으면, 평면도에, 단면도, 등 쪼개진 도면을 하나씩 채워가면서 물량을 채우면 되지 않아」 · 「좌표로 하는 거잖아」
 *   BIM 물량 화면(/jeoksan/bim)과 «같은 길» 로 읽음 — DWG → DXF · 도면 읽기(일꾼) · xref 끼우기 · 골조읽기(평면 · 일람 · 단면 · 골구도) · 높이 · 3D 세움 · 겹친 것 빼기
 *   → lib/도면모델.js 도면에서모델 로 통심 · 부재(좌표 그대로)를 골조 모델로 옮김. 못 옮긴 것은 까닭과 함께 돌려줌(작업 화면에서 손으로).
 * ■ 도면 셈(BIM 물량 화면과 같은 셈 — 견줌표용) · 골조 모델 셈을 같이 돌려줌.
 */
import { 도면읽어오기, 오류글 } from '../도면판.jsx'
export { 큰파일 } from '../도면판.jsx'
import { DWG바꾸기 } from './dwg바꾸기.js'
import { 단위배율 } from './골조도면.js'
import { 골조읽기 } from './골조자동.js'
import { 플랜트다듬기, 플랜트모델 } from './플랜트기초.js'
import { 셈방법입히기 } from './셈방법.js'
import { 셈 } from './골조.js'
import { 모델만들기, 층고바꾸기, 겹친것빼기 } from './BIM모델.js'
import { 참조끼우기 } from './골조끼움.js'
import { 도면에서모델 } from './도면모델.js'

/** 셈 줄 → {콘크리트, 거푸집, 철근, 데크} 합 · 부재 종류별 콘크리트 */
export function 셈합(줄) {
  const 합 = { 콘크리트: 0, 거푸집: 0, 철근: 0, 데크: 0 }, 종 = {}
  for (const x of 줄 || []) {
    const k = /거푸집/.test(x.항목) ? '거푸집' : x.항목
    if (k in 합) 합[k] += x.수량
    if (x.항목 === '콘크리트' && !/버림/.test(x.비고 || '')) 종[x.부재] = (종[x.부재] || 0) + x.수량
  }
  return { 합, 종 }
}

/**
 * @param {{이름: string, buf: ArrayBuffer}[]} 목록  DXF · DWG
 * @param {(글: string) => void} 알려  진행 글
 * @returns {Promise<{M, 못옮김, 틀림: string, 도면: {합, 종}, 경고: string[], 부재수: number, 이름: string}>}
 */
export async function 도면읽어모델(목록, 알려 = () => {}) {
  let 틀림 = ''
  const 바꾼 = []
  for (const { 이름: nm, buf } of 목록) {
    const 머리 = String.fromCharCode(...new Uint8Array(buf.slice(0, 6)))
    if (/^AC10\d\d/.test(머리)) {
      알려(nm + ' — DWG → DXF 바꾸는 중 (큰 도면은 30초~1분)')
      try { const r0 = await DWG바꾸기(buf, nm, (d) => 알려(nm + ' — DWG → DXF: ' + (d.msg || ''))); 바꾼.push({ 이름: nm, dxf: r0.dxf, 원본: (r0.info && r0.info.원본) || null }) }
      catch (e) { 틀림 += nm + ' — ' + 오류글(e && (e.kind === 'mem' || e.kind === 'readmem') ? e.kind : e && e.kind === 'timeout' ? 'stall' : 'fail', e && e.message) + ' ' }
    } else 바꾼.push({ 이름: nm, dxf: buf })
  }
  const 들 = []
  for (const { 이름: nm, dxf, 원본 } of 바꾼) {
    알려(nm + ' 읽는 중')
    try {
      const { 모델: M } = await 도면읽어오기(dxf, nm, (st) => 알려(nm + ' — ' + st.msg + (st.p ? ' ' + Math.round(st.p * 100) + '%' : '')), false)
      if (원본) M.원본 = 원본
      들.push({ 모델: M, 이름: nm, k: 단위배율(M.units, M.box, M.ox, M.oy).k || 1 })
    } catch (e) { 틀림 += nm + ' — ' + 오류글(e.kind || 'fail', e.message) + ' ' }
  }
  if (!들.length) throw new Error(틀림.trim() || '도면을 읽지 못했습니다')
  let 들2 = 들
  try { 들2 = 참조끼우기(들).들 } catch (e) { /* 끼우기 실패 — 따로 읽은 그대로 */ }
  알려('골조(평면 · 일람표 · 단면)를 읽는 중')
  await new Promise((r) => setTimeout(r, 30))
  const R = 플랜트다듬기(들2, 골조읽기(들2))
  if (!R || !R.있음) throw new Error((R && R.경고 && R.경고[0]) || '도면에서 골조(평면 · 일람표)를 찾지 못했습니다')
  알려('좌표대로 세우는 중')
  await new Promise((r) => setTimeout(r, 30))
  const 공사0 = 층고바꾸기(R.공사, {}, R.읽음 && R.읽음.높이)
  const 모델 = 플랜트모델(모델만들기(들2, R, { 높이: {} }), R)
  const 공사 = 셈방법입히기(겹친것빼기(공사0, 모델), '도면')
  let 도면 = { 합: {}, 종: {} }
  try { 도면 = 셈합(셈(공사).줄) } catch (e) { /* 견줌표만 빠짐 */ }
  const 이름 = 목록.length === 1 ? 목록[0].이름.replace(/\.(dxf|dwg)$/i, '') : 목록[0].이름.replace(/\.(dxf|dwg)$/i, '') + ' 외 ' + (목록.length - 1) + '장'
  const { M, 못옮김, 옮김 } = 도면에서모델(모델, { 공사 }, { 이름 })
  return { M, 못옮김, 틀림: 틀림.trim(), 도면, 경고: (R.경고 || []).slice(0, 30), 부재수: 옮김, 이름 }
}
