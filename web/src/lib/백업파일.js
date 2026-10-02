/**
 * 💾 작업 백업 파일 — 사진 · 도면처럼 큰 것은 서버에 안 올리고 «파일» 로 옮깁니다 (2026-10-02 · G113)
 *
 * 소장님: 「이어서 쓸 수 있는 방법은 없어? 있어야 해」 → (고름) 사진대지 · 수량산출서는 «백업 파일 저장 · 불러오기»
 *   서버 비용 0원. 받은 파일을 다른 기기 · 다른 브라우저에서 «불러오기» 하면 이어서 합니다.
 *
 * ■ 모양: {"kcm":"작업백업","곳":"photobook","v":1,"at":"…","자료":[[열쇠, 값], …]}
 *     값 안의 바이트(Uint8Array · ArrayBuffer — 사진 · 엑셀)는 {"__b": base64, "t": "u8" | "ab"} 로 바꿔 둡니다.
 * ■ 큰 파일(사진 수백 장)도 한 글자 덩이로 만들지 않고 조각(Blob parts)으로 이어 붙입니다 — 폰에서 멈추지 않게.
 */
function b64(u8) {
  let s = ''
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000))
  return btoa(s)
}
function unb64(s) {
  const t = atob(s)
  const u8 = new Uint8Array(t.length)
  for (let i = 0; i < t.length; i++) u8[i] = t.charCodeAt(i)
  return u8
}
/** 바이트 → 글자로 바꿀 수 있는 모양 (JSON.stringify 의 replacer 로는 Uint8Array 가 먼저 객체가 되어 못 잡으므로 직접 훑음) */
export function 바이트싸기(v) {
  if (v instanceof Uint8Array) return { __b: b64(v), t: 'u8' }
  if (v instanceof ArrayBuffer) return { __b: b64(new Uint8Array(v)), t: 'ab' }
  if (ArrayBuffer.isView(v)) return { __b: b64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)), t: 'u8' }
  if (Array.isArray(v)) return v.map(바이트싸기)
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = 바이트싸기(x); return o }
  return v
}
export function 바이트풀기(v) {
  if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.__b === 'string' && (v.t === 'u8' || v.t === 'ab') && Object.keys(v).length === 2) {
    const u8 = unb64(v.__b)
    return v.t === 'ab' ? u8.buffer : u8
  }
  if (Array.isArray(v)) return v.map(바이트풀기)
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = 바이트풀기(x); return o }
  return v
}

/** [[열쇠, 값]…] → Blob (조각으로) */
export function 작업파일만들기(곳, 자료) {
  const 조각 = [`{"kcm":"작업백업","곳":${JSON.stringify(곳)},"v":1,"at":${JSON.stringify(new Date().toISOString())},"자료":[`]
  자료.forEach(([k, v], i) => { 조각.push((i ? ',' : '') + JSON.stringify([k, 바이트싸기(v)])) })
  조각.push(']}')
  return new Blob(조각, { type: 'application/json' })
}

/** 글 → {자료, at} | {오류} */
export function 작업파일풀기(곳, 글) {
  let x
  try { x = JSON.parse(글) } catch (e) { return { 오류: 'JSON 파일이 아닙니다.' } }
  if (!x || x.kcm !== '작업백업' || !Array.isArray(x.자료)) return { 오류: 'K-건설맵 작업 백업 파일이 아닙니다.' }
  if (x.곳 !== 곳) return { 오류: '다른 프로그램의 백업 파일입니다.' }
  try { return { 자료: x.자료.map(([k, v]) => [k, 바이트풀기(v)]), at: x.at } } catch (e) { return { 오류: '파일이 깨져 있습니다.' } }
}

export function 백업내려받기(이름, blob) {
  const u = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = u; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(u), 8000)
}
