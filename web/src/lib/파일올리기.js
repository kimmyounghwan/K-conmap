/* 📎 G158 (2026-10-06) 맵톡 글에 파일 한 개 — 소장님 「이용자들이 파일을 올릴 수도 있잖아. 이런경우는?」 →
 *    「파일은 비용이 많이 늘어나?」 → 「제한과 예산알림은 나만 알아야 하고, 용량을 어느정도까지 … 압축을 해서 올려서 저장용량을 줄일 수 있는지」 → 「해」
 *
 * ■ 자리 · 규칙은 «📤 이용자가 올린 서식» 과 같습니다(Storage user_forms/{기기}/… · storage.rules 를 새로 안 올림):
 *     한글 · 엑셀 · 워드 · PDF · PPT(hwp hwpx xlsx xls docx doc pdf pptx) · 매크로(xlsm docm …) · exe · zip 은 안 됨
 *     원본 20MB 까지 받고 · 저장은 10MB 이하(규칙이 막음) · 한 번 올린 파일은 덮어쓰기 · 지우기 불가 · 받기는 누구나
 * ■ 압축: 브라우저가 gzip 으로 눌러 보고 10% 넘게 줄 때만 눌린 것을 올립니다(contentEncoding=gzip) —
 *     받을 때 브라우저가 알아서 풀어 원래 파일로 저장됩니다. hwp · xls 는 절반쯤, xlsx · docx · pdf 는 거의 안 줄어듭니다.
 * ■ 하루 한도: 이 브라우저에서 하루 «하루한도» 개. 숫자는 화면 어디에도 안 씁니다(소장님만 압니다) —
 *     넘으면 «잠시 뒤 다시 올려 주세요» 한 줄만. ⚠️ 브라우저 쪽 셈이라 마음먹고 우회하면 못 막습니다 —
 *     진짜 문지기는 크기 규칙(10MB) · 운영자 지우기 · 예산 알림(소장님 메일)입니다.
 *
 * 🗜 G196 (2026-10-08) 소장님 「압축파일이 왜 안돼?」 → 「압축파일 안된다는 건 바꿔줘」 — zip 도 받습니다. 대신 올리기 «전에»
 *     브라우저가 zip 의 목차(중앙 디렉터리)만 읽어 안을 봅니다(풀지 않음 · 몇 KB 만 읽음):
 *       · 안에 든 것이 모두 한글 · 엑셀 · 워드 · PDF · PPT · 사진(jpg · png)일 때만 통과
 *       · 실행 파일 · 매크로 · 스크립트 · zip 안의 zip(7z · rar · alz · egg …) · 암호 걸린 zip · 너무 많은(300개 넘는) 파일 ·
 *         풀면 너무 커지는(합 300MB 넘는) zip 은 막음 · 맥에서 묶을 때 끼는 __MACOSX · .DS_Store · Thumbs.db 는 셈에서 뺌
 *       · zip 은 이미 눌린 파일이라 더 안 줄어듭니다 → 저장 한도(10MB)가 곧 zip 한도 — 고를 때 바로 알림
 *     ⚠️ 목차 보기는 브라우저에서 합니다. 화면을 거치지 않고 일부러 올리는 사람은 규칙(형식 · 10MB)만 막습니다 → 운영자 지우기.
 */
export const 파일종류 = ['hwp', 'hwpx', 'xlsx', 'xls', 'docx', 'doc', 'pdf', 'pptx', 'zip']   /* 🗜 G196 zip 더함 */
export const 압축안종류 = ['hwp', 'hwpx', 'xlsx', 'xls', 'docx', 'doc', 'pdf', 'pptx', 'jpg', 'jpeg', 'png']
export const 압축안개수한도 = 300
export const 압축안크기한도 = 300 * 1024 * 1024
export const 받는꼴 = 파일종류.map((x) => '.' + x).join(',')
export const 원본한도 = 20 * 1024 * 1024
export const 저장한도 = 10 * 1024 * 1024
export const 하루한도 = 5
const 셈열쇠 = 'kcm.mt.파일셈'

export const 확장자 = (name) => { const m = /\.([A-Za-z0-9]{1,6})$/.exec(String(name || '')); return m ? m[1].toLowerCase() : '' }
export const 크기글 = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round((n || 0) / 1024)) + 'KB')

/** 고를 때 바로 거르기 — 문제없으면 '' */
export function 파일검사(f) {
  if (!f) return '파일을 고르세요.'
  const e = 확장자(f.name)
  if (!파일종류.includes(e)) return `이 형식은 받지 않습니다${e ? `(${e})` : ''} — 한글 · 엑셀 · 워드 · PDF · PPT · 압축(zip) 만 됩니다(매크로 파일은 안 됨).`
  if (e === 'zip' && f.size > 저장한도) return `압축 파일이 너무 큽니다(${크기글(f.size)}) — 압축(zip)은 10MB 까지 올릴 수 있습니다.`
  if (f.size > 원본한도) return `파일이 너무 큽니다(${크기글(f.size)}) — 20MB 까지 올릴 수 있습니다.`
  if (!f.size) return '빈 파일입니다.'
  return ''
}

/* 🗜 G196 zip 목차 읽기 — 끝의 «목차 끝(EOCD)» 을 찾아 중앙 디렉터리만 읽습니다(풀지 않음).
   돌려줌: { 목록: [{ 이름, 크기, 암호, 폴더 }], 오류: '' } — 오류가 있으면 목록은 비어 있을 수 있음 */
const 쓰레기 = (이름) => /(^|\/)__MACOSX\//.test(이름) || /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(이름) || /(^|\/)\._[^/]*$/.test(이름)
function 이름풀기(b, utf8) {
  try { if (utf8) return new TextDecoder('utf-8', { fatal: true }).decode(b) } catch (e) { /* 아래로 */ }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b) } catch (e) { /* 한국 윈도우 zip(cp949) */ }
  try { return new TextDecoder('euc-kr').decode(b) } catch (e) { return Array.from(b, (c) => String.fromCharCode(c)).join('') }
}
export async function 압축목차(f) {
  const 크기 = f.size
  if (크기 < 22) return { 목록: [], 오류: '압축 파일이 아니거나 깨진 파일입니다.' }
  const 꼬리길이 = Math.min(크기, 65557)
  const 꼬리 = new Uint8Array(await f.slice(크기 - 꼬리길이).arrayBuffer())
  let i = 꼬리.length - 22
  for (; i >= 0; i--) if (꼬리[i] === 0x50 && 꼬리[i + 1] === 0x4b && 꼬리[i + 2] === 0x05 && 꼬리[i + 3] === 0x06) break
  if (i < 0) return { 목록: [], 오류: '압축 파일이 아니거나 깨진 파일입니다.' }
  const dv = new DataView(꼬리.buffer, 꼬리.byteOffset + i, 22)
  const 개수 = dv.getUint16(10, true), 목차크기 = dv.getUint32(12, true), 목차자리 = dv.getUint32(16, true)
  if (개수 === 0xffff || 목차크기 === 0xffffffff || 목차자리 === 0xffffffff) return { 목록: [], 오류: '이 압축 파일 형식(ZIP64)은 받지 않습니다.' }
  if (목차자리 + 목차크기 > 크기) return { 목록: [], 오류: '압축 파일이 아니거나 깨진 파일입니다.' }
  const 목차 = new Uint8Array(await f.slice(목차자리, 목차자리 + 목차크기).arrayBuffer())
  const v = new DataView(목차.buffer, 목차.byteOffset, 목차.byteLength)
  const 목록 = []
  let p = 0
  for (let n = 0; n < 개수; n++) {
    if (p + 46 > 목차.length || v.getUint32(p, true) !== 0x02014b50) return { 목록, 오류: '압축 파일이 아니거나 깨진 파일입니다.' }
    const 깃발 = v.getUint16(p + 8, true), 푼크기 = v.getUint32(p + 24, true)
    const 이름길이 = v.getUint16(p + 28, true), 덧길이 = v.getUint16(p + 30, true), 말길이 = v.getUint16(p + 32, true)
    const 이름 = 이름풀기(목차.subarray(p + 46, p + 46 + 이름길이), !!(깃발 & 0x800))
    목록.push({ 이름, 크기: 푼크기, 암호: !!(깃발 & 1), 폴더: /\/$/.test(이름) })
    p += 46 + 이름길이 + 덧길이 + 말길이
  }
  return { 목록, 오류: '' }
}

/** 🗜 G196 zip 안 보기 — 문제없으면 '' · 아니면 알릴 말 */
export async function 압축검사(f) {
  let r
  try { r = await 압축목차(f) } catch (e) { return '압축 파일을 읽지 못했습니다 — 다시 묶어서 올려 주세요.' }
  if (r.오류) return '🗜 ' + r.오류
  const 파일들 = r.목록.filter((x) => !x.폴더 && !쓰레기(x.이름))
  if (!파일들.length) return '🗜 압축 파일 안에 든 파일이 없습니다.'
  if (r.목록.some((x) => x.암호)) return '🗜 암호가 걸린 압축 파일은 받지 않습니다 — 암호 없이 묶어 올려 주세요.'
  if (파일들.length > 압축안개수한도) return `🗜 압축 파일 안에 파일이 너무 많습니다(${파일들.length}개) — ${압축안개수한도}개까지 됩니다.`
  const 안됨 = 파일들.filter((x) => !압축안종류.includes(확장자(x.이름)))
  if (안됨.length) {
    const 보기 = 안됨.slice(0, 3).map((x) => x.이름.split('/').pop()).join(' · ')
    return `🗜 압축 파일 안에 받지 않는 파일이 있습니다(${보기}${안됨.length > 3 ? ` 외 ${안됨.length - 3}개` : ''}) — 안에는 한글 · 엑셀 · 워드 · PDF · PPT · 사진(jpg · png)만 됩니다(실행 파일 · 매크로 · 압축 안의 압축은 안 됨).`
  }
  const 합 = 파일들.reduce((a, x) => a + x.크기, 0)
  if (합 > 압축안크기한도) return '🗜 풀면 너무 커지는 압축 파일입니다 — 나눠서 올려 주세요.'
  return ''
}

const 오늘 = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
export function 오늘올린수(저장 = (() => { try { return localStorage } catch (e) { return null } })()) {
  try { const v = JSON.parse(저장.getItem(셈열쇠) || 'null'); return v && v.d === 오늘() ? Number(v.n) || 0 : 0 } catch (e) { return 0 }
}
export function 올린수더하기(저장 = (() => { try { return localStorage } catch (e) { return null } })()) {
  try { 저장.setItem(셈열쇠, JSON.stringify({ d: 오늘(), n: 오늘올린수(저장) + 1 })) } catch (e) { /* 사생활 창 */ }
}

/** gzip 으로 눌러 봅니다. 10% 넘게 줄 때만 — 아니면 원본 그대로 */
export async function 눌러보기(file) {
  if (typeof CompressionStream === 'undefined') return { blob: file, gz: false }
  try {
    const cs = new CompressionStream('gzip')
    const gzBlob = await new Response(file.stream().pipeThrough(cs)).blob()
    if (gzBlob.size < file.size * 0.9) return { blob: gzBlob, gz: true }
  } catch (e) { /* 지원 안 하면 원본 */ }
  return { blob: file, gz: false }
}

/** Storage 이름 — 규칙: ^[^/]{1,120}\.(소문자 확장자)$ · 앞에 시각(겹치지 않게) */
export function 저장이름(name, 지금 = Date.now()) {
  const e = 확장자(name)
  const 몸 = String(name || '파일').replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|#%\u0000-\u001f]/g, '_').trim().slice(-90) || '파일'
  return `${지금.toString(36)}_${몸}.${e}`
}

/**
 * 올리기 — { u(받는 주소), n(원래 이름), s(원본 크기), z(저장 크기) }
 * 저장 크기가 10MB 를 넘으면 '큼' 오류(올리지 않음)
 */
export async function 파일올리기(file, uid) {
  const { blob, gz } = await 눌러보기(file)
  if (blob.size > 저장한도) { const er = new Error('큼'); er.저장 = blob.size; throw er }
  const { getStorage, ref: sref, uploadBytes, getDownloadURL } = await import('firebase/storage')
  const r = sref(getStorage(), `user_forms/${uid}/${저장이름(file.name)}`)
  await uploadBytes(r, blob, {
    contentType: (확장자(file.name) === 'zip' ? 'application/zip' : file.type) || 'application/octet-stream',
    ...(gz ? { contentEncoding: 'gzip' } : {}),
    contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
  })
  const u = await getDownloadURL(r)
  return { u, n: String(file.name).slice(0, 120), s: file.size, z: blob.size }
}
