/**
 * 📷 사진 → 캐드 일꾼 (G287 · 2026-10-14) — 무거운 셈은 모두 여기서(화면이 멈추지 않게) · 사진은 이 기기 밖으로 안 나감
 *
 *  받는 말                                   돌려주는 말
 *  { 일:'넣기', id, rgba, w, h, 꼴 }        → { id, 네모, 믿음 }                       (도면 · 손그림: 종이 모서리 자동)
 *                                           → { id, 건물:{ 미리, 너비, 높이 } | 실패 }   (건물: 소실점으로 펴기)
 *  { 일:'읽기', id, 꼴, 네모, 종이, 세기, 벽만 } → { id, 결과, 미리:{w,h,d(Uint8)} }   (진행: { id, 진행:{글,p} } · 벽만 true · false · 없으면 저절로)
 *  { 일:'건물네모', id, 네모, 가로, 세로 }   → { id, 결과, 미리 }                        (건물: 사람이 찍은 네모로 펴기)
 */
import { 밝기판, 줄이기, 펴기, 종이찾기 } from './사진캐드_펴기.js'
import { 도면펴기, 도면읽기, 건물펴기, 건물읽기 } from './사진캐드_흐름.js'
import { 네모로펴기, 거꾸로, 옮기, 곱 } from './사진캐드_펴기.js'
import { 무게넣기, 무게풀기, 무게있음 } from './사진캐드_숫자.js'
/* 일꾼은 한 덩어리(iife)로 구워지므로 동적 import 를 못 씀 — 무게도 함께 넣음(이 도구를 열 때만 받는 일꾼 파일 안) */
import 숫자무게 from './사진캐드_숫자무게.js'
import { 글읽기만들기 } from './사진캐드_글읽기.js'

/* ⑨ 글 읽기 — PaddleOCR(PP-OCRv4 · Apache-2.0) 을 onnxruntime-web(MIT)으로 이 기기 안에서.
   실행기 · 모델은 처음 한 번 jsDelivr(무료 CDN · npm 꾸러미 그대로)에서 받고 브라우저가 담아 둠 → 사이트 전송 비용 0 · 사진은 밖으로 안 나감.
   못 받으면(인터넷 · 막힘) 이 사이트가 배운 숫자망만으로 읽음(예전처럼). */
const ORT주소 = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/'
const 모델주소 = 'https://cdn.jsdelivr.net/npm/paddle-ocr-onnx-models@0.2.0/models/'
/* 손글씨 숫자 모델(이 사이트가 배움 · 약 0.75MB): 공개 CDN(jsDelivr · 깃허브 저장소 그대로)에서 먼저 → 안 되면 이 사이트에서(사이트 전송량을 줄이려고 · 10/15) */
const 손숫자주소들 = ['https://cdn.jsdelivr.net/gh/kimmyounghwan/K-conmap@main/web/public/tools/models/sonsutja-v1.onnx', '/tools/models/sonsutja-v1.onnx']
const 영문글자 = '0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~!"#$%&\'()*+,-./ '
let 글읽기 = null, 글읽기실패 = '', 글읽기준비중 = null, 손숫자있음 = false
async function 글준비(진행) {
  if (글읽기 || 글읽기실패) return 글읽기
  if (글읽기준비중) return 글읽기준비중
  글읽기준비중 = (async () => {
    try {
      진행('글 읽기 준비 — 처음 한 번만 받습니다(약 27MB · 공개 CDN)', 0.08)
      const 불러 = new Function('u', 'return import(u)')   // 묶음(iife) 밖 모듈을 그대로 부름
      const ort = await 불러(ORT주소 + 'ort.wasm.min.mjs')
      ort.env.wasm.wasmPaths = ORT주소
      ort.env.wasm.numThreads = 1
      const 받기 = (f) => fetch(모델주소 + f).then((x) => { if (!x.ok) throw new Error('모델 ' + x.status); return x.arrayBuffer() })
      const [d, r] = await Promise.all([받기('ch_PP-OCRv4_det_infer.onnx'), 받기('en_PP-OCRv4_rec.onnx')])
      const 찾기모델 = await ort.InferenceSession.create(new Uint8Array(d), { executionProviders: ['wasm'] })
      const 읽기모델 = await ort.InferenceSession.create(new Uint8Array(r), { executionProviders: ['wasm'] })
      // 손글씨 치수 숫자 전용(이 사이트가 배운 작은 모델 · 약 1.5MB · 이 사이트에서 받음) — 못 받으면 PaddleOCR 만으로
      let 손숫자모델 = null
      for (const 주소 of 손숫자주소들) {
        if (손숫자모델) break
        try {
          const 멈춤 = new AbortController(), 시계 = setTimeout(() => 멈춤.abort(), 8000)
          const x = await fetch(new URL(주소, self.location.origin).href, { signal: 멈춤.signal })
          clearTimeout(시계)
          if (!x.ok) continue
          const b = new Uint8Array(await x.arrayBuffer())
          if (b.length < 100000) continue   // 막힌 곳이 오류 쪽지를 200 으로 줄 때
          손숫자모델 = await ort.InferenceSession.create(b, { executionProviders: ['wasm'] })
        } catch (e) { 손숫자모델 = null }
      }
      손숫자있음 = !!손숫자모델
      글읽기 = 글읽기만들기(ort, { 찾기모델, 읽기모델, 사전: ['', ...영문글자], 손숫자모델 })
    } catch (e) { 글읽기실패 = String((e && e.message) || e) }
    return 글읽기
  })()
  return 글읽기준비중
}

let 판 = null
let 건물편 = null

async function 무게준비() {
  if (무게있음()) return
  try { 무게넣기(무게풀기(숫자무게)) } catch (e) { /* 숫자 없이(사람이 넣음) */ }
}

/** 화면에 보일 미리보기(밝기 · 긴 변 1600 까지) */
function 미리(편) {
  const k = Math.max(1, Math.max(편.w, 편.h) / 1600)
  const 작 = k > 1 ? 줄이기({ w: 편.w, h: 편.h, d: 편.d.map((v) => (isNaN(v) ? 255 : v)) }, k) : { w: 편.w, h: 편.h, d: 편.d.map((v) => (isNaN(v) ? 255 : v)) }
  const d = new Uint8ClampedArray(작.w * 작.h)
  for (let i = 0; i < d.length; i++) d[i] = 작.d[i]
  return { w: 작.w, h: 작.h, d, 배: 편.w / 작.w }
}

self.onmessage = async (e) => {
  const m = e.data || {}
  const 답 = (x, 넘김) => self.postMessage({ id: m.id, ...x }, 넘김 || [])
  try {
    if (m.일 === '넣기') {
      판 = 밝기판(new Uint8ClampedArray(m.rgba), m.w, m.h)
      건물편 = null
      if (m.꼴 === '건물') {
        const r = 건물펴기(판)
        if (r.실패) return 답({ 실패: r.실패 })
        건물편 = r.편
        const 미 = 미리(r.편)
        return 답({ 건물: { 미리: 미, 너비: r.틀.너비, 높이: r.틀.높이 } }, [미.d.buffer])
      }
      const 찾 = 종이찾기(판)
      return 답({ 네모: 찾.네모, 믿음: 찾.믿음 })
    }
    if (m.일 === '읽기') {
      if (!판) return 답({ 오류: '사진이 없습니다' })
      const 진행 = (글, p) => self.postMessage({ id: m.id, 진행: { 글, p } })
      if (m.꼴 === '건물') {
        if (!건물편) return 답({ 오류: '먼저 펴기' })
        진행('선 찾는 중', 0.3)
        const 결과 = 건물읽기(건물편, { 세밀: m.세밀 })
        const 미 = 미리(건물편)
        return 답({ 결과, 미리: 미 }, [미.d.buffer])
      }
      진행('사진 펴는 중', 0.05)
      await 무게준비()
      const 펴 = 도면펴기(판, { 네모: m.네모, 종이: m.종이 })
      let 글목록 = []
      if (m.글읽기 !== false) {
        const 글 = await 글준비(진행)
        if (글) {
          try { 글목록 = await 글.찾고읽기(펴.편, { 진행: (p) => 진행('글 · 숫자 읽는 중', 0.1 + 0.12 * p) }) } catch (e) { 글목록 = [] }
        }
      }
      const 결과 = 도면읽기(펴.편, { 손그림: m.꼴 === '손그림', 세기: m.세기 || 1, 진행, 글목록, 벽만: m.벽만 })
      결과.글읽기 = 글목록.length ? '켬' : 글읽기실패 ? '못씀' : '끔'
      결과.손숫자 = 손숫자있음 ? '켬' : '끔'
      결과.글읽기까닭 = 글읽기실패 || ''
      const 미 = 미리(펴.편)
      return 답({ 결과, 미리: 미, 크기: [펴.편.w, 펴.편.h] }, [미.d.buffer])
    }
    if (m.일 === '건물네모') {
      if (!판) return 답({ 오류: '사진이 없습니다' })
      // 찍은 네모(창 · 문 · 벽)로 정면을 정하고, 사진 전체가 들어오게 판을 넓힘(네모의 4배 까지)
      const 틀 = 네모로펴기(m.네모, m.가로, m.세로, 판.w, 판.h, { 최대: 100000 })
      const Hi = 거꾸로(틀.H)
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (const [px, py] of [[0, 0], [판.w, 0], [판.w, 판.h], [0, 판.h]]) {
        const q = 옮기(Hi, px, py)
        if (!isFinite(q[0]) || !isFinite(q[1])) continue
        x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1])
      }
      const 한 = 4 * Math.max(틀.너비, 틀.높이)
      x0 = Math.max(x0, -한); y0 = Math.max(y0, -한); x1 = Math.min(x1, 틀.너비 + 한); y1 = Math.min(y1, 틀.높이 + 한)
      const s = Math.min(3, 2600 / Math.max(x1 - x0, y1 - y0))
      const W = Math.round((x1 - x0) * s), Hh = Math.round((y1 - y0) * s)
      const H2 = 곱(틀.H, [1 / s, 0, x0, 0, 1 / s, y0, 0, 0, 1])
      건물편 = 펴기(판, H2, W, Hh, NaN)
      const 결과 = 건물읽기(건물편, { 세밀: m.세밀 })
      const 미 = 미리(건물편)
      // 사람이 넣은 네모의 가로 길이(mm)를 알면 척(mm/픽셀)이 바로 정해짐
      return 답({ 결과, 미리: 미, 척: m.가로 ? m.가로 / (틀.너비 * s) : null }, [미.d.buffer])
    }
  } catch (err) {
    답({ 오류: String((err && err.message) || err) })
  }
}
