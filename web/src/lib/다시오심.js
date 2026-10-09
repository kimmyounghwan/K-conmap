/* 🆕 다시 오신 분께 셈 (G222 · 2026-10-09) — 화면은 다시오심.jsx · 시험 node tools/시험_알림묶음.mjs
   재료 /data/newcount.json = {built, h: {YYYYMMDDHH: [공고, 1순위]}, s: {YYYYMMDDHH: {시도: 공고}}} (collect.py export_bidindex) */
/** 한국 시각 «YYYYMMDDHH» */
export const 시칸 = (ms) => new Date(ms + 9 * 3600e3).toISOString().replace(/[^0-9]/g, '').slice(0, 10)
/** 지난번 방문 «다음 시간» 부터 지금까지 — {공고, 일순위, 지역} (그 시간 안은 이미 보셨을 수 있어 뺌) */
export function 셈(nc, 부터ms, 지역) {
  const 부터 = 시칸(부터ms)
  let 공고 = 0, 일순위 = 0, 내 = 0
  for (const [k, v] of Object.entries((nc && nc.h) || {})) if (k > 부터 && Array.isArray(v)) { 공고 += Number(v[0]) || 0; 일순위 += Number(v[1]) || 0 }
  if (지역 && 지역 !== '전국') for (const [k, v] of Object.entries((nc && nc.s) || {})) if (k > 부터 && v) 내 += Number(v[지역]) || 0
  return { 공고, 일순위, 내 }
}
