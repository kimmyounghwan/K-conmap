/**
 * 📄 그림 PDF — 쪽마다 JPEG 한 장(글자 층 없음) (G361 · 2026-10-21)
 *   소장님: 「pdf로 해도 엑셀로 전환 가능하지 않아?? 이게 불가능해야 하잖아??」 → 고르심 «그림 PDF»
 *   변환 프로그램이 읽을 글자가 없어 엑셀로 바로 바뀌지 않습니다(완전히 막을 수는 없음 — 다시 치기 · 사진 글자 읽기).
 *   라이브러리 없이 PDF 1.4 를 직접 씁니다(쪽 = 이미지 XObject 하나 · DCTDecode).
 */
const 글바이트 = (s) => new TextEncoder().encode(s)

function base64바이트(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * @param {{jpg: Uint8Array, px: [number, number], pt: [number, number]}[]} 쪽들  JPEG 바이트 · 픽셀 크기 · 종이 크기(pt)
 * @param {string} 제목
 * @returns {Blob}
 */
export function PDF만들기(쪽들, 제목 = '서식') {
  const 조각 = []
  let 길이 = 0
  const 자리 = []
  const 넣기 = (u) => { 조각.push(u); 길이 += u.length }
  const 물건 = (n, 몸) => { 자리[n] = 길이; 넣기(글바이트(`${n} 0 obj\n`)); for (const b of 몸) 넣기(typeof b === 'string' ? 글바이트(b) : b); 넣기(글바이트('\nendobj\n')) }
  넣기(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))   // %PDF-1.4 + 바이너리 표시
  const n = 쪽들.length
  // 1 카탈로그 · 2 쪽들 · 3 정보 · 그다음 쪽마다 [쪽, 내용, 그림]
  const 쪽번 = (i) => 4 + i * 3
  물건(1, ['<< /Type /Catalog /Pages 2 0 R >>'])
  물건(2, [`<< /Type /Pages /Count ${n} /Kids [${쪽들.map((_, i) => `${쪽번(i)} 0 R`).join(' ')}] >>`])
  const 제목16 = Array.from(제목).map((ch) => ch.charCodeAt(0).toString(16).padStart(4, '0')).join('')
  물건(3, [`<< /Title <FEFF${제목16}> /Producer (k-conmap.com) /Creator (K-conmap) >>`])
  쪽들.forEach((p, i) => {
    const [W, H] = p.pt
    const 내용 = `q ${W.toFixed(2)} 0 0 ${H.toFixed(2)} 0 0 cm /Im0 Do Q`
    물건(쪽번(i), [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Resources << /XObject << /Im0 ${쪽번(i) + 2} 0 R >> >> /Contents ${쪽번(i) + 1} 0 R >>`])
    물건(쪽번(i) + 1, [`<< /Length ${내용.length} >>\nstream\n${내용}\nendstream`])
    물건(쪽번(i) + 2, [`<< /Type /XObject /Subtype /Image /Width ${p.px[0]} /Height ${p.px[1]} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>\nstream\n`, p.jpg, '\nendstream'])
  })
  const 끝물건 = 4 + n * 3
  const xref = 길이
  let t = `xref\n0 ${끝물건}\n0000000000 65535 f \n`
  for (let i = 1; i < 끝물건; i++) t += String(자리[i]).padStart(10, '0') + ' 00000 n \n'
  t += `trailer\n<< /Size ${끝물건} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  넣기(글바이트(t))
  return new Blob(조각, { type: 'application/pdf' })
}

/** 캔버스 → JPEG 바이트 */
export function 캔버스JPEG(cv, q = 0.9) {
  const url = cv.toDataURL('image/jpeg', q)
  return base64바이트(url.slice(url.indexOf(',') + 1))
}

/** 내려받기(폰 · PC) */
export function 파일주기(blob, 이름) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 이름
  document.body.appendChild(a)
  a.__셈 = Date.now()       // 받은 수는 부르는 쪽에서 한 번만(lib/받은수.jsx 엿듣기 · a.click 덧씌움이 또 세지 않게)
  a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url) }, 4000)
}
