/* node 에는 Path2D·DOMMatrix 가 없습니다. pdf.js 를 «불러오기 전에» 끼워 넣어야 합니다
   — 모듈은 맨 위 import 가 먼저 다 돌기 때문에, 이 파일을 pdf.js 보다 먼저 import 합니다. */
import * as 캔 from '@napi-rs/canvas'
for (const 름 of ['Path2D', 'DOMMatrix', 'ImageData', 'DOMPoint', 'DOMRect']) {
  if (!globalThis[름] && 캔[름]) globalThis[름] = 캔[름]
}
//  node 에는 한글 글꼴이 없어 캔버스에 한글이 «안 찍힙니다».
//  브라우저(윈도우)에는 맑은 고딕이 있으니, 시험에서만 노토를 대신 끼웁니다.
try {
  for (const 길 of ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
                    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc']) {
    try { 캔.GlobalFonts.registerFromPath(길, 'Malgun Gothic') } catch { /* 없으면 넘어갑니다 */ }
  }
} catch { /* 없으면 넘어갑니다 */ }

export const 준비됨 = true
