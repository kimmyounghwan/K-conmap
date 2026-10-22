/* 🧷 G378 (2026-10-22) — 올린 엑셀을 «그대로» 고쳐 내려줄 때 확장자 · 종류를 «안의 꼴» 에 맞춥니다
 *   매크로 사용 통합 문서(.xlsm — [Content_Types].xml 에 macroEnabled.main+xml)를 «.xlsx» 이름으로 내보내면
 *   엑셀이 «파일 형식 또는 파일 확장명이 잘못되어» 라며 열지 않습니다.
 *   G377 2줄 자동변환에서 실제 내역서로 찾았고 · G378 80% 비율(원본 고치기 · 틀 그대로)도 같은 꼴 → 여기 한 곳에서 씁니다.
 *   새로 짓는 엑셀(새 엑셀 한 벌 등)은 늘 .xlsx 라 이것을 안 씁니다. */
import { unzipSync } from 'fflate'

export const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const XLSM = 'application/vnd.ms-excel.sheet.macroEnabled.12'

/** zip(풀어 둔 것) · 바이트(ArrayBuffer · Uint8Array) 어느 것이든 — 안이 매크로 사용 꼴인가. 못 읽으면 이름(.xlsm)으로 */
export function 매크로인가(zip, 이름 = '') {
  try {
    let z = zip
    if (z && (z instanceof ArrayBuffer || ArrayBuffer.isView(z))) {
      const u8 = z instanceof ArrayBuffer ? new Uint8Array(z) : new Uint8Array(z.buffer, z.byteOffset, z.byteLength)
      z = unzipSync(u8, { filter: (f) => f.name === '[Content_Types].xml' })
    }
    const ct = z && z['[Content_Types].xml'] ? new TextDecoder().decode(z['[Content_Types].xml']) : ''
    if (ct) return /macroEnabled\.main\+xml/i.test(ct)
  } catch { /* 이름으로 */ }
  return /\.xlsm$/i.test(이름)
}

/** { 끝: 'xlsm' | 'xlsx', type } — 내려받을 이름 끝 · Blob 종류 */
export function 엑셀종류(zip, 이름 = '') {
  const m = 매크로인가(zip, 이름)
  return { 끝: m ? 'xlsm' : 'xlsx', type: m ? XLSM : XLSX }
}
