/**
 * 도면물량.js — 도면(.dxf 쪽지)·치수표(.csv) + 재료표 → 물량 (2026-09-24)
 *
 * 소장님: 「그럼 캐드 파일은 지금 안되는 거야? 같이 드래그 해서 놓으면…」 · 「이어서 만들고, 사이트 반영해」
 *
 * ■ 브라우저 «안에서만» 셉니다. 도면과 재료표는 서버로 가지 않습니다.
 *   서버(단가 채우기)로 가는 것은 센 물량 — 재료·규격·단위·수량·산출근거 글 — 뿐입니다.
 * ■ 셈은 실험실(/jeoksan/lab)과 «같은 것» 을 씁니다 (lib/dxf.js · lib/qto.js = PC 의 kqto.py 와 같음).
 * ⚠️ 도면을 «해석» 하지 않습니다. 캐드에서 찍어 둔 쪽지(XDATA 앱이름 KQTO)만 읽습니다.
 *    쪽지가 없는 도면에서는 물량이 안 나옵니다 — 그때는 그렇다고 알립니다.
 */
import { decodeDxf, readDxfUnits, unitsToCsv } from './dxf.js'
import { run, readUnits } from './qto.js'

const 글 = (x) => String(x ?? '').trim()
const 짧게 = (v) => String(Math.round(v * 10000) / 10000)

/** .dxf 바이트 → {name, text(치수표 CSV), n(쪽지 수)} */
export function 도면풀기(name, bytes) {
  const units = readDxfUnits(decodeDxf(bytes))
  return { name, text: unitsToCsv(units), n: units.length, 꼴: '도면' }
}

/** 치수표(.csv) 글자 → {name, text, n} */
export function 치수표풀기(name, text) {
  let n = 0
  try { n = readUnits(text).length } catch (e) { n = 0 }
  return { name, text, n, 꼴: '치수표' }
}

/** 여러 도면 + 재료표 하나 → 모은 물량
 *  돌려주는 것: {항목:[{재료,규격,단위,수량,근거[],도면[],쪽지}], 경고:[[도면,갈래,어디,말]], 산출서:[{name,bytes,rows,serious}], 심각, 쪽지} */
export function 세기(도면들, 재료표) {
  const 모음 = new Map()
  const 경고 = [], 산출서 = []
  let 심각 = 0, 쪽지 = 0
  for (const d of 도면들) {
    if (!d.n) continue
    const r = run(재료표.buf, 재료표.name, d.text, d.name)
    산출서.push({ name: d.name, bytes: r.bytes, rows: r.rows.length, serious: r.serious })
    심각 += r.serious
    쪽지 += r.units.length
    for (const w of r.warns) 경고.push([d.name, ...w])
    for (const c of r.checks) if (String(c[0]).startsWith('✕')) 경고.push([d.name, ...c])
    for (const x of r.rows) {
      if (x.err || x.val === null || x.val === undefined || !Number.isFinite(x.val)) continue
      const 재 = 글(x.rule['재료']), 규 = 글(x.rule['규격']), 단 = 글(x.rule['단위'])
      if (!재) continue
      const k = [재, 규, 단].join('|')
      let h = 모음.get(k)
      if (!h) { h = { 재료: 재, 규격: 규, 단위: 단, 수량: 0, 근거: [], 도면: [], 쪽지: 0 }; 모음.set(k, h) }
      h.수량 += x.val
      h.쪽지 += 1
      if (!h.도면.includes(d.name)) h.도면.push(d.name)
      if (h.근거.length < 60) {
        h.근거.push(`${d.name} ${글(x.u['번호'])}번 ${글(x.u['부재'])} ${글(x.u['부호'])}: ${x.expr} = ${짧게(x.val)}`)
      }
    }
  }
  const 항목 = [...모음.values()].map((h) => ({ ...h, 수량: Math.round(h.수량 * 10000) / 10000 }))
  return { 항목, 경고, 산출서, 심각, 쪽지 }
}
