/* 📨 도구끼리 도면 넘기기 (2026-09-26)
 * DWG→DXF 에서 바꾼 도면을 «도면 PDF 만들기» 로 바로 보냅니다.
 * 같은 탭 안의 화면 이동(SPA)에서만 씁니다 — 어디에도 저장하지 않고, 한 번 꺼내면 비웁니다.
 * (새로고침하면 사라지는 것이 맞습니다: 파일은 이 브라우저 메모리에만 있었으니까요) */
let 칸 = null

/** @param {{ 이름: string, 바이트: Uint8Array }} 도면 */
export function 도면넘기기(도면) { 칸 = 도면 }

/** 받은 도면이 있으면 꺼내고 비웁니다 */
export function 도면받기() { const d = 칸; 칸 = null; return d }

/* 📑 내역서 넘기기 (2026-09-28) — «도면 물량 자동» 에서 물량을 넣은 내역서를 «단가 채우기» 로 바로 보냅니다.
   같은 탭 안의 화면 이동에서만 · 저장하지 않음 · 한 번 꺼내면 비움 */
let 내역칸 = null
/** @param {{ 이름: string, 바이트: Uint8Array }} 내역 */
export function 내역넘기기(내역) { 내역칸 = 내역 }
export function 내역받기() { const d = 내역칸; 내역칸 = null; return d }
