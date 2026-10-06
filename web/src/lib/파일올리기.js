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
 */
export const 파일종류 = ['hwp', 'hwpx', 'xlsx', 'xls', 'docx', 'doc', 'pdf', 'pptx']
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
  if (!파일종류.includes(e)) return `이 형식은 받지 않습니다${e ? `(${e})` : ''} — 한글 · 엑셀 · 워드 · PDF · PPT 만 됩니다(매크로 파일 · 압축 파일은 안 됨).`
  if (f.size > 원본한도) return `파일이 너무 큽니다(${크기글(f.size)}) — 20MB 까지 올릴 수 있습니다.`
  if (!f.size) return '빈 파일입니다.'
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
    contentType: file.type || 'application/octet-stream',
    ...(gz ? { contentEncoding: 'gzip' } : {}),
    contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
  })
  const u = await getDownloadURL(r)
  return { u, n: String(file.name).slice(0, 120), s: file.size, z: blob.size }
}
