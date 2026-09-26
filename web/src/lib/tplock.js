/**
 * 🔒 현장 투입비 — 주민번호·계좌 잠금 (2026-09-26)
 *
 * 개인정보 보호법 제24조의2 ② [시행 2026.9.11.] «주민등록번호가 유출등이 되지 아니하도록 암호화 조치를 통하여 안전하게 보관하여야 한다»
 * → 주민번호·은행·계좌·예금주·사업자번호는 «브라우저에서» 현장 비밀번호로 잠근 뒤 서버에 둡니다.
 *   서버(파이어베이스)에는 알아볼 수 없는 글자만 남고, 저희도 풀 수 없습니다.
 *   비밀번호를 아는 현장 사람만 풉니다. 비밀번호를 잊으면 잠근 칸은 되살릴 수 없습니다.
 *
 * ■ 열쇠: PBKDF2(SHA-256, 20만 번, 소금 = 'kcm-lock:' + 현장 코드) → AES-GCM 256
 * ■ 비밀번호를 넣은 기기는 열쇠를 이 브라우저(localStorage)에 둡니다 — 현장을 «이 기기에서 잊기» 하면 지웁니다.
 * ■ 잠근 글: 'v1.' + iv(base64) + '.' + 암호문(base64)
 */
const 글 = new TextEncoder()
const 읽 = new TextDecoder()
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s) }
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const 자리 = (c) => 'kcm-tuipbi-lk:' + c

export async function 열쇠만들기(code, pw) {
  const base = await crypto.subtle.importKey('raw', 글.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: 글.encode('kcm-lock:' + code), iterations: 200000 }, base, 256)
  return new Uint8Array(bits)
}
export function 열쇠두기(code, raw) { try { localStorage.setItem(자리(code), b64(raw)) } catch (e) { /* 개인 창 — 이번만 */ } }
export function 열쇠읽기(code) { try { const s = localStorage.getItem(자리(code)); return s ? unb64(s) : null } catch (e) { return null } }
export function 열쇠지우기(code) { try { localStorage.removeItem(자리(code)) } catch (e) { /* 없음 */ } }

const aes = (raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])

/** 물건(객체)을 잠근 글로 */
export async function 잠그기(raw, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aes(raw), 글.encode(JSON.stringify(obj)))
  return 'v1.' + b64(iv) + '.' + b64(new Uint8Array(ct))
}

/** 잠근 글을 물건으로 — 열쇠가 틀리면 null */
export async function 풀기(raw, s) {
  try {
    const [v, iv, ct] = String(s || '').split('.')
    if (v !== 'v1' || !iv || !ct) return null
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await aes(raw), unb64(ct))
    return JSON.parse(읽.decode(pt))
  } catch (e) { return null }
}

/** 주민번호 가리기 — 900101-1****** */
export const 주민가림 = (r, 다) => {
  const s = String(r || '').replace(/\s/g, '')
  const m = s.match(/^(\d{6})-?(\d)(\d{6})$/)
  if (!m) return s
  return 다 ? `${m[1]}-${m[2]}${m[3]}` : `${m[1]}-${m[2]}******`
}
