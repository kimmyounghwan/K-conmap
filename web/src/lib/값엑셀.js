/**
 * 📗 값만 엑셀 — 프로그램이 셈한 결과를 «숫자 · 글자만» 엑셀로 (G109 · 2026-10-01)
 *
 * 소장님: 「그럼, 엑셀로 값만 주는 걸로 하자. 프로그램 원칙으로 하고」 · 「제출용은 다 인쇄해서 주니까」
 *   → 셈 · 판단은 사이트(프로그램)에서, 엑셀은 보관 · 기록용 «결과 값» 만. 수식 · 계산 장치는 넣지 않습니다.
 *     (이용자 자기 파일을 고쳐 주는 것 — 2줄 변환 · 작업대 · 비율 · 적산 산출서 · 서식 · 설계변경 엑셀 — 은 수식 그대로)
 *
 * ■ 쓰기는 lib/qtoxlsx.js writeWorkbook(빈 종이에 새로 쓰기)을 그대로 씁니다 — 칸에는 값만 넣습니다.
 * ■ 첫 시트 맨 아래에 «다시 셀 때는 사이트에서» 한 줄을 남깁니다(다시 찾아오게).
 * ■ 받기는 <a download> 를 눌러 — lib/받은수.jsx 가 저절로 셉니다(blob: 주소는 화면 열쇠로).
 */
import { writeWorkbook, ST } from './qtoxlsx.js'

export { ST }
const 금지 = /[\\/:*?"<>|]/g
export const 시트이름 = (s) => String(s || '시트').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)
export const 파일이름 = (s) => String(s || '').replace(금지, '_').replace(/\s+/g, '_').slice(0, 60)

/** 값 칸 — 숫자면 #,##0, 글자면 테두리만 */
export const 수칸 = (n) => (n === null || n === undefined || n === '' ? '' : { v: Math.round(Number(n) || 0), st: ST.INT })
export const 소수칸 = (n) => (n === null || n === undefined || n === '' ? '' : { v: Number(n) || 0, st: ST.DEC2 })
export const 굵은칸 = (s) => ({ v: String(s ?? ''), st: ST.BOX })
export const 흐린칸 = (s) => ({ v: String(s ?? ''), st: ST.GRAY })

/**
 * @param {string} 이름  파일 이름(확장자 없이)
 * @param {Array<{name:string, head:string[], rows:any[][], widths?:number[]}>} 시트들
 * @param {{주소?:string, 글?:string}} 꼬리  첫 시트 맨 아래 한 줄
 */
export function 값엑셀받기(이름, 시트들, 꼬리 = {}) {
  const 붙임 = 꼬리.주소 ? `K-건설맵에서 셈한 값입니다(수식 없음). 다시 셀 때는 k-conmap.com${꼬리.주소} 에서 — 적은 내용이 그 브라우저에 남아 있습니다.` : ''
  const 시 = 시트들.map((s, i) => ({
    name: 시트이름(s.name),
    head: s.head,
    rows: i === 0 && (붙임 || 꼬리.글) ? [...s.rows, [], [흐린칸(꼬리.글 || 붙임)]] : s.rows,
    widths: s.widths,
    freeze: s.freeze,
  }))
  return 바이트받기(이름, writeWorkbook(시))
}

/** 이미 만든 .xlsx 바이트를 받기 (lib/tuipbi.js 월엑셀 · 누계엑셀 · 엑셀, lib/격자엑셀.js) — <a download> 라 받은수가 저절로 셈 */
export function 바이트받기(이름, 바이트) {
  const url = URL.createObjectURL(new Blob([바이트], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 파일이름(이름) + '.xlsx'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
  return a.download
}
