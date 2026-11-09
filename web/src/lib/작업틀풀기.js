/**
 * 🖼 G613 (2026-11-09) 작업 화면 틀 풀기 — 그림 PDF · 인쇄(tools/그림인쇄훅.js 더CSS)를 찍는 복제본에서만 씀.
 *   골조 · 마감의 «🖥 작업 화면»(.gg.gg-ws)은 화면을 꽉 채운 붙박이 틀(왼쪽 도면 · 오른쪽 표 · 결과)이라
 *   결과 카드를 그대로 찍으면 오른쪽 칸 폭 · 틀 안 스크롤에 갇힘 → 복제본에서만 보통 흐름으로 풀어 결과 카드가 쪽 폭을 다 쓰게. 보는 화면은 그대로.
 */
export const 작업틀풀기 = `.gg.gg-ws { position: static !important; inset: auto !important; display: block !important; overflow: visible !important; height: auto !important; max-height: none !important; }
.gg.gg-ws > .gg-ws-body { display: block !important; padding: 0 !important; }
.gg.gg-ws .gg-ws-l { display: none !important; }
.gg.gg-ws .gg-ws-r { display: block !important; overflow: visible !important; }`
