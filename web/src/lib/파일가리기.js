/**
 * 파일가리기.js — 떨어뜨린 파일이 «무엇인지» 알아냅니다 (2026-09-21)
 *
 * 소장님: 「도면과 공내역서 드래그 해서 올리면 다 되게 해줘」
 *   → 어느 칸에 넣을지 사람이 고르지 않게 합니다. 파일을 «열어 보고» 가립니다.
 *
 * 돌려주는 갈래 : '도면' | '치수표' | '단가표' | '재료표' | '공내역서' | '모름'
 * ⚠️ 확장자만 보고 정하지 않습니다 — .xlsx 하나에 네 가지가 다 있을 수 있습니다.
 */
import { readWorkbook } from './qtoxlsx.js'

const 다듬 = (x) => String(x ?? '').replace(/\s+/g, '')
const 숫자 = (x) => {
  const t = String(x ?? '').replace(/,/g, '').trim()
  if (!t) return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}
const H_품명 = /^(품명|공종|공종명|명칭|품목|자재명|공사명|규격및품명|품명및규격|산출명|호표명|일위대가명)$/
const H_수량 = /^(수량|물량|단위수량)$/
/* 「단가(최저)」 「중앙단가」 처럼 앞뒤에 말이 붙습니다 — 품고만 있으면 됩니다 */
const H_단가 = /단가|^합계$|^재료비$/

/** 표(2차원)에서 머리글 줄을 찾습니다 */
function 머리찾기(grid, 있어야) {
  for (let i = 0; i < Math.min(grid.length, 30); i++) {
    const c = (grid[i] || []).map(다듬)
    if (있어야.every((re) => c.some((x) => re.test(x)))) return { i, c }
  }
  return null
}

/** csv/txt 글자 -> 갈래 */
export function 글자가리기(text) {
  const 첫줄 = (text || '').split(/\r\n|\r|\n/).slice(0, 15)
  for (const l of 첫줄) {
    const c = l.split(',').map((x) => 다듬(x.replace(/^"|"$/g, '')))
    const 품 = c.some((x) => H_품명.test(x))
    const 단 = c.some((x) => H_단가.test(x))
    if (품 && 단) return '단가표'
  }
  return '치수표'
}

/** .xlsx 바이트 -> {갈래, 까닭} */
export function 책가리기(bytes) {
  let wb
  try { wb = readWorkbook(bytes) } catch (e) { return { 갈래: '모름', 까닭: e?.message || '엑셀을 열지 못했습니다.' } }
  const 시트 = Object.entries(wb)
  /* ① 재료표 — 「부재」 칸이 있는 표 */
  for (const [, grid] of 시트) {
    const h = 머리찾기(grid, [/^부재$/])
    if (h) return { 갈래: '재료표', 까닭: '「부재」 칸이 있습니다' }
  }
  /* ② 공내역서 / 단가표 — 「품명·수량」 이 있으면 내역, 「품명·단가」 만 있으면 단가표
     ⚠️ 시트 «하나만» 보면 안 됩니다. 공내역서의 첫 시트는 총집계표라 30줄밖에 안 됩니다. */
  let 줄 = 0, 찬칸 = 0, 단가표 = null
  for (const [, grid] of 시트) {
    const a = 머리찾기(grid, [H_품명, H_수량])
    if (a) {
      const iQ = a.c.findIndex((x) => H_수량.test(x))
      /* 「단가」 는 머리글 «다음 줄» 에 있습니다 (재료비/노무비/경비 밑) — 세 줄까지 봅니다 */
      const 단칸 = []
      for (let i = a.i; i < Math.min(grid.length, a.i + 3); i++) {
        const c2 = (grid[i] || []).map(다듬)
        for (let k = 0; k < c2.length; k++) if (/^단가$/.test(c2[k]) && k > iQ && !단칸.includes(k)) 단칸.push(k)
      }
      for (let r = a.i + 1; r < grid.length; r++) {
        const row = grid[r] || []
        if (숫자(row[iQ]) === null) continue
        줄++
        for (const k of 단칸) if ((숫자(row[k]) || 0) > 0) { 찬칸++; break }
      }
      continue
    }
    const b = 머리찾기(grid, [H_품명, H_단가])
    if (b && !단가표) 단가표 = { grid, ...b }
  }
  if (줄 >= 5) {
    const 참 = Math.round((찬칸 / 줄) * 100)
    return {
      갈래: '공내역서',
      까닭: 참 < 50 ? `수량 ${줄}줄 · 단가가 ${참}% 만 차 있습니다`
        : `수량 ${줄}줄 · 단가가 이미 ${참}% 차 있습니다 (그대로 덮어씁니다)`,
    }
  }
  if (단가표) return { 갈래: '단가표', 까닭: '「품명 · 단가」 표입니다' }
  return { 갈래: '모름', 까닭: '「품명·수량」 표도 「품명·단가」 표도 못 찾았습니다.' }
}

/** 파일 하나를 가립니다. buf 는 ArrayBuffer, text 는 (csv 일 때) 글자 */
export function 가리기(name, buf, text) {
  if (/\.dxf$/i.test(name)) return { 갈래: '도면', 까닭: '캐드 도면(.dxf)' }
  if (/\.dwg$/i.test(name)) return { 갈래: '못읽는도면', 까닭: '.dwg 는 못 읽습니다 — 캐드에서 .dxf 로 저장해 주십시오.' }
  if (/\.(csv|txt)$/i.test(name)) return { 갈래: 글자가리기(text), 까닭: '글자표' }
  if (/\.xlsx$/i.test(name)) return 책가리기(buf)
  return { 갈래: '모름', 까닭: '다룰 수 있는 것은 .xlsx · .csv · .dxf 입니다.' }
}
