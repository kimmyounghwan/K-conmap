/* 📦 도면 3D — 읽기 일꾼 (2026-09-25 · 2026-09-26 여러 장 · 건물 세우기 · 2026-10-05 박스 나누기 · 측량 기준 자리 맞춤)
   🧭 제일 먼저 — «겹치는 순서»(lib/겹치는순서.js · CLAUDE.md 맨 앞): 측량도면을 기준으로 세우고, 나머지를 하나씩 겹칩니다.
      기준 = 측량도면 → 배치도·계획평면도 → 평면도 · 입면·단면·상세는 기준이 될 수 없음 · 단면·입면·종단·횡단은 높이만
   100MB 도면을 화면 줄기에서 읽으면 몇 초 동안 화면이 굳습니다. 그래서 따로 읽습니다.
   파일은 이 브라우저 안에서만 읽습니다 — 어디로도 보내지 않습니다.

   ■ 여러 장을 한꺼번에 받습니다 (평면도 + 입면도·단면도·골구도 · 종평면도 · 횡단면도 · 측량도면 · 측량성과표).
     ① 🏢 건물 — 평면도 묶음(「지상 2층 평면도」 같은 제목이 둘 이상) + 층 높이 글자 → 층마다 쌓고 벽·기둥을 세움 (lib/building3d.js)
     ② 🗂 나머지 도면은 «박스(도곽)» 로 나눠 박스마다 종류를 가립니다 (lib/도곽3d.js)
        소장님: 「캐드 안에 박스별로 여러 캐드 파일이 있잖아. 그걸 이용해서 3d로 전환시켜 줘야 하는거 아니야?」
     ③ 🛣 횡단면도 박스는 같은 노선끼리 모아 세우고(lib/횡단3d.js) · 🏗 구조도는 구조물로(lib/구조3d.js)
     ④ 📍 평면 쪽(측량도면 · 평면도 · 종평면도의 평면 칸)은 «같은 글자» 로 기준에 맞춥니다 (lib/자리맞춤.js)
        기준 = 측량성과표 → 측량도면 → 계획평면도 → 가장 큰 평면도 차례 (lib/겹치는순서.js 기준차례)
        소장님: 「평면도에도 좌표가 안입혀져 있어. 대부분 그래, 그래서 좌표가 있는 측량도면을 측량성과표 도면을 꼭 넣어달라고 해야 하지 않아.」
        「횡단면도, 종단면도는 좌표로 찾기 힘들잖아. 이건 깊이 높이만 찾아 와야 하고」 → 종단·횡단은 좌표로 맞추지 않습니다
     ⑤ 🛣 (G138) 자리를 맞춘 평면도의 측점 글자 + 중심선으로 노선을 만들고, 같은 이름의 횡단면도를 측점마다 노선과 직각으로 세웁니다.
        종단면도 표(측점 · 누가거리 · 지반고 · 계획고)는 노선 위 지반선 · 계획선으로 (lib/노선3d.js) */
import { parseDxf, decodeBytes, sniff, finish, F64, U8, 알맹이상자, 무더기상자 } from './dxf3d.js'
import { 층높이찾기, 지붕채우기, 지하채우기, 레벨줄채우기, 평면제목, 쌓기, 층이름 } from './building3d.js'
import { 기준차례, 현황이름 } from './겹치는순서.js'
import { 통심기호, 통심겹치기 } from './통심.js'
import { 횡단세우기, 단면찾기, 횡단묶기 } from './횡단3d.js'
import { 구조세우기 } from './구조3d.js'
import { 도곽찾기3d, 박스제목, 박스제목들, 도면종류, 네모로나누기, 도면합치기, 평면칸, 묶음이름, 도면단위배, 측량다움, 테두리빼기 } from './도곽3d.js'
import { 글짝들, 글열쇠, 짝맞추기, 변환하기, 회전도, 축척 } from './자리맞춤.js'
import { 노선열쇠, 노선이름, 노선같음, 노선들찾기, 종단표읽기, 노선에얹기, 종단선, 측점m로, 중심꼴, 꼭맞음거르기, 노선이름글, 노선글같음 } from './노선3d.js'
import { 평균단면, 삼각망, 높이찾개, 땅면부피, 가시떼기, 튀는점 } from './토공3d.js'
import { 누운선, 바닥높이, 바탕만들기, 모양맞추기, 콘크리트면, 치수선빼기, 일셈 } from './겹치기3d.js'
import { 구조물면 } from './구조물면.js'
import { 흙막이읽기, 흙층, 흙막이도면, 흙단면읽기 } from './흙막이.js'
import { 그림나누기, 그림떼기, 그림이름, 표같음 } from './그림나누기3d.js'
import { 끼움관계, 잇기, 꼴안, 도면이름, 틀이름, 닮음 } from './xref3d.js'

const 새버킷 = () => ({ pos: new F64(), col: new U8(), pts: new F64(64), pcol: new U8(64) })
/** 버킷 모음 합치기 (같은 이름이면 이어 붙임) */
function 합치기(모음, 새것) {
  for (const [key, b] of 새것) {
    const has = 모음.get(key)
    if (!has) { 모음.set(key, b); continue }
    for (const [src, dst] of [[b.pos, has.pos], [b.pts, has.pts]]) for (let i = 0; i < src.n; i += 3) dst.push3(src.a[i], src.a[i + 1], src.a[i + 2])
    for (const [src, dst] of [[b.col, has.col], [b.pcol, has.pcol]]) for (let i = 0; i < src.n; i += 3) dst.push3(src.a[i], src.a[i + 1], src.a[i + 2])
    if (b.tri) {
      if (!has.tri) { has.tri = b.tri; has.trc = b.trc } else {
        for (let i = 0; i < b.tri.n; i += 3) has.tri.push3(b.tri.a[i], b.tri.a[i + 1], b.tri.a[i + 2])
        for (let i = 0; i < b.trc.n; i += 3) has.trc.push3(b.trc.a[i], b.trc.a[i + 1], b.trc.a[i + 2])
      }
    }
  }
}
/** 버킷 모음을 변환 — 배(단위) 곱한 뒤 T(돌리고 옮기기 · 축척). 높이는 축척만 */
/* 🏢 G228 방 이름 — 띄어 쓴 «전 기 실» 도 붙여서 · 숫자 · 치수 · 긴 문장은 뺌 */
const 방꼴 = /(실|창고|홀|로비|복도|계단|현관|라운지|샤워장|탈의장)$/
const 붙글 = (s) => String(s || '').replace(/\\[A-Za-z][^;]*;|[{}]/g, '').replace(/[\s·.,()\[\]-]/g, '')
/** 맨 아래층 평면도 제목 둘레 글자만(같은 파일의 배치도 · 다른 층 · 범례 글자는 뺌) — 제목 사이 거리의 60% 안 · 가장 가까운 제목이 그 층 */
function 아래층글(texts, 제목, 높이) {
  if (!제목.length) return []
  const 낮 = 제목.reduce((a, t) => (높이[t.층] < 높이[a.층] ? t : a), 제목[0])
  let 사이 = Infinity
  if (제목.length >= 2) {
    const d = 제목.map((t) => Math.min(...제목.filter((q) => q !== t).map((q) => Math.hypot(q.x - t.x, q.y - t.y)))).sort((p, q) => p - q)
    사이 = d[d.length >> 1]
  }
  return (texts || []).filter((t) => {
    let k = null, kd = Infinity
    for (const q of 제목) { const dd = Math.hypot(q.x - t.x, q.y - t.y); if (dd < kd) { kd = dd; k = q } }
    return k === 낮 && kd <= 0.6 * 사이
  })
}
function 방이름들(texts) {
  const out = new Set()
  for (const t of texts || []) {
    const s = 붙글(t.s)
    if (s.length < 2 || s.length > 8 || !/^[가-힣]+$/.test(s) || !방꼴.test(s) || /평면도|단면도|입면도|상세도|배치도/.test(s)) continue
    out.add(s)
  }
  return out
}
/** 배치도(바탕 무리 도면)에서 건물 방 이름이 서로 다른 것 둘 넘게 모인 곳 → 그 둘레 네모들(mm) */
function 방자리(방글, 바탕그룹, 틀선) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i < 틀선.length; i += 2) { const x = 틀선[i], y = 틀선[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const R = Math.max(30000, Math.hypot(x1 - x0, y1 - y0) / 2 + 15000)
  const 점 = []
  for (const g of 바탕그룹) {
    const how = g.자리 && g.자리.how
    if (!g.글자 || !(how === '기준' || how === '좌표' || (how === '글자' && g.T))) continue
    for (const t of g.글자) {
      const s = 붙글(t.s)
      if (!방글.has(s)) continue
      const [x, y] = how === '글자' ? [g.T.a * t.x - g.T.b * t.y + g.T.tx, g.T.b * t.x + g.T.a * t.y + g.T.ty] : [t.x, t.y]
      점.push({ x, y, s })
    }
  }
  if (점.length < 2) return { 네모: [], 점들: [] }
  const 쓴 = new Set(), 네모 = [], 든점 = []
  for (let i = 0; i < 점.length; i++) {
    if (쓴.has(i)) continue
    const 무 = [], 이름 = new Set()
    for (let j = 0; j < 점.length; j++) if (Math.hypot(점[j].x - 점[i].x, 점[j].y - 점[i].y) < R) { 무.push(j); 이름.add(점[j].s) }
    if (이름.size < 2) continue
    for (const j of 무) { 쓴.add(j); 든점.push([점[j].x, 점[j].y]) }
    const cx = 무.reduce((a, j) => a + 점[j].x, 0) / 무.length, cy = 무.reduce((a, j) => a + 점[j].y, 0) / 무.length
    네모.push([cx - R, cy - R, cx + R, cy + R])
    if (네모.length >= 6) break
  }
  return { 네모, 점들: 든점 }
}
/* 🧭 G237 도면 묶음이 지금까지 옮겨진 만큼(돌림 · 배 · 옮김)을 out.__T 에 쌓아 둠 — 건물 통심(X1 · Y1)을 같은 자리로 옮기려고 */
const 잇기T = (B, A) => ({ a: B.a * A.a - B.b * A.b, b: B.b * A.a + B.a * A.b, tx: B.a * A.tx - B.b * A.ty + B.tx, ty: B.b * A.tx + B.a * A.ty + B.ty })
function 바꾸기(out, T) {
  out.__T = 잇기T(T, out.__T || { a: 1, b: 0, tx: 0, ty: 0 })
  const s = Math.hypot(T.a, T.b)
  for (const [, b] of out) {
    for (const arr of [b.pos, b.pts, b.tri]) {
      if (!arr) continue
      const a = arr.a
      for (let i = 0; i < arr.n; i += 3) {
        const x = a[i], y = a[i + 1]
        a[i] = T.a * x - T.b * y + T.tx; a[i + 1] = T.b * x + T.a * y + T.ty; a[i + 2] *= s
      }
    }
  }
}
function 곱하기(out, k) {
  if (k === 1) return
  out.__T = 잇기T({ a: k, b: 0, tx: 0, ty: 0 }, out.__T || { a: 1, b: 0, tx: 0, ty: 0 })
  for (const [, b] of out) for (const arr of [b.pos, b.pts]) for (let i = 0; i < arr.n; i++) arr.a[i] *= k
}
const 선수 = (out) => { let n = 0; for (const [, b] of out) n += b.pos.n / 6 + b.pts.n / 3; return n }
const 평면꼴 = new Set(['측량', '평면', '종평', '밖'])
const 끔꼴 = new Set(['종단', '횡단못', '상세', '표', '기타', '건축'])

self.onmessage = async (ev) => {
  const d = ev.data || {}
  const files = d.files || (d.buf ? [{ name: '도면.dxf', buf: d.buf }] : [])
  const 성과 = d.성과 && Array.isArray(d.성과.점) && d.성과.점.length >= 2 ? d.성과 : null
  try {
    const 읽은 = []
    const 못읽은 = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const 앞 = i / Math.max(1, files.length), 폭 = 0.7 / Math.max(1, files.length)
      /* 🧠 2026-10-05 — 화면은 파일을 «Blob» 으로 넘깁니다(복사 없이). 여기서 한 장씩 꺼내 읽고 바로 놓아 줍니다 */
      let buf = f.buf || (f.blob ? await f.blob.arrayBuffer() : null)
      if (!buf) { 못읽은.push({ 이름: f.name, 까닭: 'fail' }); continue }
      const kind = sniff(buf)
      if (kind !== 'dxf') { 못읽은.push({ 이름: f.name, 까닭: kind }); continue }
      self.postMessage({ type: 'prog', p: 0.02 + 앞 * 0.7, msg: `${f.name} 읽는 중` })
      const text = decodeBytes(buf)
      buf = null; f.buf = null; f.blob = null
      if (!/(^|\n)\s*0\s*\r?\n\s*SECTION/.test(text.slice(0, 20000))) { 못읽은.push({ 이름: f.name, 까닭: 'notdxf' }); continue }
      let raw = parseDxf(text, (p) => self.postMessage({ type: 'prog', p: 0.02 + (앞 + p * 폭 / 0.7) * 0.7, msg: `${f.name} 선 세우는 중` }), { raw: true })
      if (!raw.stats.ents && !raw.texts.length) { 못읽은.push({ 이름: f.name, 까닭: 'empty' }); continue }
      /* 🧭 G239 선이 너무 많아(300만 개) 끊긴 통합본 — 글자는 끝까지 읽었으니, 층 평면도 제목 둘레만 선을 다시 읽음(겹치는 순서 0 포장 펴기)
           소장님 현장 C · D 식당 건축 통합본: 선 2,465만 개 · 앞 300만 개에 층 평면이 없어 건물이 안 섰음 */
      if (raw.stats.capped) {
        const 제 = 평면제목(raw.texts)
        if (제.length >= 2) {
          const 사이들 = 제.map((t) => Math.min(...제.filter((u) => u !== t).map((u) => Math.hypot(u.x - t.x, u.y - t.y)))).sort((a, b) => a - b)
          const 사이 = Math.min(사이들[Math.floor(사이들.length / 2)], 300000)
          const 범위 = 제.map((t) => [t.x - 0.8 * 사이, t.y - 0.8 * 사이, t.x + 0.8 * 사이, t.y + 0.8 * 사이])
          /* 처음 읽은 300만 개 안에 층 평면 선이 이미 넉넉하면(현장 E 건축도면) 그대로 — 판마다 선 2천 개 넘게 */
          const 판선 = 범위.map(() => 0)
          for (const [, bk] of raw.out) { const a = bk.pos.a; for (let i = 0; i < bk.pos.n; i += 6) { const x = (a[i] + a[i + 3]) / 2, y = (a[i + 1] + a[i + 4]) / 2; for (let k = 0; k < 범위.length; k++) { const r = 범위[k]; if (x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) 판선[k]++ } } }
          if (판선.every((n) => n >= 2000)) 제.length = 0
        }
        if (제.length >= 2) {
          const 사이들 = 제.map((t) => Math.min(...제.filter((u) => u !== t).map((u) => Math.hypot(u.x - t.x, u.y - t.y)))).sort((a, b) => a - b)
          const 사이 = Math.min(사이들[Math.floor(사이들.length / 2)], 300000)
          const 범위 = 제.map((t) => [t.x - 0.8 * 사이, t.y - 0.8 * 사이, t.x + 0.8 * 사이, t.y + 0.8 * 사이])
          self.postMessage({ type: 'prog', p: 0.02 + 앞 * 0.7, msg: `${f.name} — 선이 많아 층 평면 ${제.length}장 둘레만 다시 읽는 중` })
          const r2 = parseDxf(text, null, { raw: true, 범위 })
          if (r2.stats.segs > 1000) { r2.stats.판만 = 제.map((t) => t.s.trim()); raw = r2 }
        }
      }
      읽은.push({ 이름: f.name, raw, 번: 읽은.length, xrefs: raw.xrefs || [] })
    }
    if (!읽은.length && !성과) {
      const k = 못읽은[0] ? 못읽은[0].까닭 : 'fail'
      self.postMessage({ type: 'err', kind: k === 'empty' ? 'fail' : k, msg: 못읽은.map((x) => x.이름).join(', ') })
      return
    }
    self.postMessage({ type: 'prog', p: 0.74, msg: '도면 글자에서 층 높이 찾는 중' })

    const 그룹 = []                       // {종류, 파일:[이름], 제목, out(Map), 층들:[키], 켬, 설명, 글?, 자리?}
    const 쓴 = new Set()
    /* 꺼 둔 층(캐드에서 끔·얼림) — 같은 이름 층은 먼저 읽은 도면 것(화면과 같은 규칙) */
    const 꺼진 = new Map()
    const 층색 = new Map()
    for (const x of 읽은) for (const [k, v] of x.raw.layerInfo) if (!꺼진.has(k)) { 꺼진.set(k, !!(v && v.off)); 층색.set(k, v) }
    const 통계들 = 읽은.map((x) => x.raw.stats)

    /* ① 🏢 건물 — 모든 도면 글자에서 층 높이, 평면도 제목이 가장 많은 도면을 층으로 (파일 통째) */
    const 파일들 = 읽은.map((x) => ({ 이름: x.이름, texts: x.raw.texts }))
    const { 높이, 근거 } = 층높이찾기(파일들)
    /* 🧭 G237 xref 끼워 읽기 — 평면도가 벽 · 기둥 그림을 xref(XREF_PLAN 등)로 끼워 그렸고 그 파일도 같이 올렸으면,
         끼운 자리(자른 테두리 안만)에 그 그림을 넣은 사본으로 층을 쌓습니다(소장님 현장 B: A-101 전체평면도엔 제목 · 글뿐, 벽은 XREF_PLAN) */
    const 이름표 = new Map(읽은.map((y) => [도면이름(y.이름), y]))
    const 끼운사본 = (x) => {
      const 넣을 = (x.xrefs || []).map((r) => ({ r, y: 이름표.get(도면이름(r.이름) || 도면이름(r.경로)), T: 닮음(r.M) }))
        .filter((q) => q.y && q.y !== x && q.T && (q.r.겹 || 1) === 1 && !틀이름.test(도면이름(q.r.이름) || 도면이름(q.r.경로)))
      if (!넣을.length) return null
      const out = new Map()
      const 통 = (k) => { let b = out.get(k); if (!b) { b = 새버킷(); out.set(k, b) } return b }
      for (const [k, b] of x.raw.out) {
        const n = 통(k)
        for (let i = 0; i < b.pos.n; i += 3) n.pos.push3(b.pos.a[i], b.pos.a[i + 1], b.pos.a[i + 2])
        for (let i = 0; i < b.col.n; i += 3) n.col.push3(b.col.a[i], b.col.a[i + 1], b.col.a[i + 2])
        for (let i = 0; i < b.pts.n; i += 3) n.pts.push3(b.pts.a[i], b.pts.a[i + 1], b.pts.a[i + 2])
        for (let i = 0; i < b.pcol.n; i += 3) n.pcol.push3(b.pcol.a[i], b.pcol.a[i + 1], b.pcol.a[i + 2])
      }
      const texts = x.raw.texts.slice()
      const circles = (x.raw.circles || []).slice()
      let 넣은 = 0
      for (const { r, y, T } of 넣을) {
        const 안 = (px, py) => !r.자르기 || (px >= r.자르기[0] && px <= r.자르기[2] && py >= r.자르기[1] && py <= r.자르기[3] && (!r.자른꼴 || 꼴안(r.자른꼴, px, py)))
        const 옮 = (px, py) => [T.a * px - T.b * py + T.tx, T.b * px + T.a * py + T.ty]
        for (const [k, b] of y.raw.out) {
          const a = b.pos.a, c = b.col.a
          let n = null
          for (let i = 0; i < b.pos.n; i += 6) {
            const [p0, q0] = 옮(a[i], a[i + 1]), [p1, q1] = 옮(a[i + 3], a[i + 4])
            if (!안((p0 + p1) / 2, (q0 + q1) / 2)) continue
            if (!n) n = 통(k)
            n.pos.push6(p0, q0, a[i + 2], p1, q1, a[i + 5]); n.col.push3(c[i], c[i + 1], c[i + 2]); n.col.push3(c[i + 3], c[i + 4], c[i + 5]); 넣은++
          }
        }
        for (const t of y.raw.texts) { const [p, q] = 옮(t.x, t.y); if (안(p, q)) texts.push({ ...t, x: p, y: q, ...(t.ax != null ? (() => { const [u, v] = 옮(t.ax, t.ay); return { ax: u, ay: v } })() : {}) }) }
        const 배 = Math.hypot(T.a, T.b)
        for (const c of y.raw.circles || []) { const [p, q] = 옮(c.x, c.y); if (안(p, q)) circles.push({ ...c, x: p, y: q, r: c.r * 배 }) }
      }
      return 넣은 ? { ...x.raw, out, texts, circles, 끼운: 넣을.map((q) => q.y.이름) } : null
    }
    const 평 = 읽은.map((x) => { const 합 = 끼운사본(x); const raw = 합 || x.raw; return { x, raw, 끼운: 합 ? 합.끼운 : null, 제목: 평면제목(raw.texts) } }).filter((q) => q.제목.length >= 2)
    let 건물 = null
    /* 🧭 G237 층 높이는 도면 글자로만(소장님 「모든 도면에 단면도 있고, 높이가 나와. 짐작은 빼」) — 6층 위 남는 높이(옥상 · 옥탑) · 지하 1층 옆 PIT 평면(PIT FL) */
    const 높이로 = (q) => {
      const 줄 = 레벨줄채우기(파일들, q.제목.map((t) => t.층), 높이)       /* 🧭 G239 이름 없는 레벨 줄(FL±0 · FL+5400 …) — 빈 숫자 층만 */
      const h = 줄.h
      const 지 = 지붕채우기(h, 파일들, q.제목.map((t) => t.층)); const 하 = 지하채우기(h, q.제목, q.raw.texts)
      return { h, 더: [...줄.근거, ...지, ...하] }
    }
    if (평.length) {
      평.sort((a, b) => b.제목.length - a.제목.length)
      /* 🧭 G237 제목이 가장 많은 평면도로 쌓아 벽이 10장도 안 서면(벽은 xref 에 · 표지 · 목록) 다음 평면도로 — 다 안 되면 처음 것 */
      let 처음 = null, 고른 = null
      for (const q of 평) {
        const 높 = 높이로(q)
        const s0 = 쌓기(q.raw, q.제목, 높.h, 새버킷)
        if (!s0) continue
        if (!처음) 처음 = { q, s0, 높 }
        if (s0.세운벽 >= 10) { 고른 = { q, s0, 높 }; break }
      }
      const 씀 = 고른 || 처음
      const 주 = 씀 ? 씀.q : 평[0]
      const 지붕 = 씀 ? 씀.높.더 : []
      if (씀) Object.assign(높이, 씀.높.h)          // 전처럼 채운 높이(옥상 · 옥탑 · PIT)를 뒤에서도 씀
      const s = 씀 ? 씀.s0 : null
      if (s) {
        쓴.add(주.x)
        건물 = {
          평면: 주.x.이름,
          층들: s.층들,
          근거: [...근거, ...지붕].filter((g) => s.층들.some((f) => f.층 === g.층)),
          세운벽: s.세운벽,
          빠진: s.빠진,
          참고: [...new Set(근거.flatMap((g) => String(g.파일 || '').split(' · ')).filter((n) => n && n !== 주.x.이름))].slice(0, 6),
        }
        /* 층 높이만 대 준 도면(입면·단면·골구도)은 따로 그리지 않습니다 — 전과 같이 «참고» 로만 */
        for (const x of 읽은) if (건물.참고.includes(x.이름)) 쓴.add(x)
        건물.끼운 = 주.끼운 || []
        그룹.push({ 종류: '건물', 파일: [주.x.이름], 제목: '', out: s.out, 층들: s.층들.map((f) => f.층), 켬: true, 통심: s.통심 || [],
          설명: `층 ${s.층들.length}개 · 벽·기둥 ${s.세운벽}장${주.끼운 && 주.끼운.length ? ` · xref ${주.끼운.join(' · ')} 끼워 읽음` : ''}${s.빠진 && s.빠진.length ? ` · 층 높이 못 찾음(${s.빠진.join(' · ')}) — 그 층은 안 세움` : ''}`,
          /* 🏢 G228 방 이름(«발 전 기 실» → 발전기실) — 배치도 · 계획평면도에 같은 방 이름이 모인 곳 둘레에서 먼저 모양을 찾음 */
          방글: 방이름들(아래층글(주.raw.texts, 주.제목.filter((t) => 높이[t.층] != null), 높이)) })
      }
    }

    /* ② 🗂 박스 나누기 — 파일마다 도곽을 찾아 박스로 나누고 종류를 가립니다 */
    self.postMessage({ type: 'prog', p: 0.78, msg: '도면 안 박스(도곽) 나누는 중' })
    const 항목 = []        // {파일, 파일번, 박스(번호|-1|'밖'), 제목, 종류, raw, 배, 근거}
    /* 🧭 G241 도면틀 xref 펴기(순서 0) — 판 테두리 · 표제란을 xref(XREF_DAN-FORM 등)로 끼워 그린 도면(현장 B 배치도 · 평면도 · 구조도)은
         그 파일만 보면 판 테두리가 없어 판을 못 나눔 → 같이 올린 틀 파일(판 하나 ~ 셋 · 거의 다 그 판)의 가로 · 세로 선과 글자를 끼운 자리로 옮겨 판 찾기에 씀 */
    const 틀정보 = new Map()
    for (const x of 읽은) for (const r of x.xrefs || []) {
      const y = 이름표.get(도면이름(r.이름) || 도면이름(r.경로))
      if (!y || y === x || 틀정보.has(y) || !y.raw) continue
      let 판 = []
      try { 판 = 도곽찾기3d(y.raw, null) } catch (e) { 판 = [] }
      if (!판.length || 판.length > 3) { 틀정보.set(y, null); continue }
      const W = Math.min(...판.map((q) => q.x1 - q.x0))
      const 선 = []
      for (const [, bk] of y.raw.out) {
        const A = bk.pos.a
        for (let i = 0; i < bk.pos.n; i += 6) {
          const dx = Math.abs(A[i + 3] - A[i]), dy = Math.abs(A[i + 4] - A[i + 1])
          if ((dy <= 1e-7 * dx || dx <= 1e-7 * dy) && dx + dy >= 0.02 * W) 선.push(A[i], A[i + 1], A[i + 3], A[i + 4])
        }
      }
      틀정보.set(y, { 선, 글: y.raw.texts || [] })
    }
    const 틀끼움 = (x) => {
      const 넣을 = (x.xrefs || []).map((r) => ({ r, y: 이름표.get(도면이름(r.이름) || 도면이름(r.경로)), T: 닮음(r.M) }))
        .filter((q) => q.y && q.y !== x && q.T && (q.r.겹 || 1) === 1 && 틀정보.get(q.y) && (Math.abs(q.T.b) < 1e-9 * Math.hypot(q.T.a, q.T.b) || Math.abs(q.T.a) < 1e-9 * Math.hypot(q.T.a, q.T.b)))
      if (!넣을.length) return null
      const 옛 = x.raw.틀선 || { a: new Float64Array(0), n: 0 }
      let n = 옛.n
      for (const q of 넣을) n += 틀정보.get(q.y).선.length
      const a = new Float64Array(n)
      a.set(옛.a.subarray(0, 옛.n))
      let k = 옛.n
      const 글 = []
      for (const { y, T } of 넣을) {
        const { 선, 글: G } = 틀정보.get(y)
        for (let i = 0; i < 선.length; i += 4) {
          a[k++] = T.a * 선[i] - T.b * 선[i + 1] + T.tx; a[k++] = T.b * 선[i] + T.a * 선[i + 1] + T.ty
          a[k++] = T.a * 선[i + 2] - T.b * 선[i + 3] + T.tx; a[k++] = T.b * 선[i + 2] + T.a * 선[i + 3] + T.ty
        }
        const 배 = Math.hypot(T.a, T.b)
        for (const t of G) 글.push({ ...t, x: T.a * t.x - T.b * t.y + T.tx, y: T.b * t.x + T.a * t.y + T.ty, h: (t.h || 0) * 배, ...(t.ax != null ? { ax: T.a * t.ax - T.b * t.ay + T.tx, ay: T.b * t.ax + T.a * t.ay + T.ty } : {}) })
      }
      return { ...x.raw, 틀선: { a, n: k }, texts: x.raw.texts.concat(글), 틀끼운: 넣을.length }
    }
    const 건물g = 그룹.find((g) => g.종류 === '건물')
    for (const x of 읽은) {
      if (쓴.has(x)) {
        /* 🧭 G241 건물로 쓴 도면(평면 · 단면 · 입면)도 판(도곽)과 도면명을 읽어 둠 — 화면 «판 보기» 목록 · 소장님 「도면명이 없다는 건 말이 안돼」 */
        if (건물g && x.raw) {
          try {
            const 찾 = 틀끼움(x) || x.raw
            const 판 = 도곽찾기3d(찾, (ly) => !꺼진.get(ly))
            const 이름들 = 박스제목들(찾.texts, 판)
            건물g.판목록 = (건물g.판목록 || []).concat(판.map((r, i) => { const 종 = 도면종류(이름들[i] || '', ''); return { 파일: x.이름, 제목: 이름들[i] || '', 종류: 종 === '종단' || 종 === '횡단' ? '건축' : 종 } }))          /* 건물 도면의 종 · 횡단면도는 건물 단면 */
          } catch (e) { /* 목록만 — 못 읽어도 3D 는 그대로 */ }
        }
        continue
      }
      const 보임 = (ly) => !꺼진.get(ly)
      let 파일종류 = 도면종류('', x.이름)
      /* 박스(도곽)는 늘 먼저 찾습니다 — 파일 이름이 «도면1.dxf» 처럼 아무 말이 없으면, 측량점 글자가 든 종평면도(소장님 도면 08)가
         «측량도면» 으로 잡혀 박스를 안 나누고 통째로 기준 쪽에 붙었습니다(시험으로 확인). 측량도면 짐작은 박스가 없을 때만. */
      const 판찾을 = 틀끼움(x) || x.raw
      const fr = 도곽찾기3d(판찾을, 보임)
      /* 🧭 G237 «현황도 · 현황평면도» 는 이름만 보면 평면 — 안에 측량점(높이 글자 · 기준점)이 있으면 측량도면(기준 1순위).
         소장님 현장 B: 현황평면도(측량점 210 · CP 기준점)를 평면으로 읽어 공사계획평면도가 기준이 됐음 */
      /* 🧭 G241 현황(측량) 도면에 판이 하나뿐이면(틀 xref 를 끼워 생긴 판) — 예전처럼 파일 통째로 측량. 판 안 · 밖으로 나누면 측량점이 갈려
           «평면 + 도곽 밖» 이 되어 측량으로 못 겹쳤음(현장 B 현황평면도 — 판 이름도 표제란 «허가사항 반영» 으로 읽힘) */
      if (fr.length === 1 && 파일종류 === '평면' && 현황이름(x.이름) && 측량다움(x.raw)) fr.length = 0
      if (!fr.length && (파일종류 === '기타' || (파일종류 === '평면' && 현황이름(x.이름))) && 측량다움(x.raw)) 파일종류 = '측량'
      const 단 = 도면단위배(x.raw, fr)
      x.배 = 단.배
      const 넣기 = (o) => 항목.push({ 파일: x.이름, 파일번: x.번, 배: 단.배, 단위근거: 단.근거, ...o })
      if (!fr.length) { 넣기({ 박스: -1, 제목: '', 종류: 파일종류, raw: x.raw }); x.raw = null; continue }
      const 나 = 네모로나누기(x.raw, fr)
      /* 🧭 G240 박스마다 통심(X1 · Y1) — 판 이름 글자가 없는 통합본(현장 C · D 토목 58판)은 «안에 든 것» 으로 종류를 가리고(순서 1),
           건물을 이 판에 통심으로 겹침(순서 4). 큰 축척 판은 기호 원도 큼(최대원 8 m) */
      const 판통심 = (r, 조각) => {
        const 원 = (x.raw.circles || []).filter((c) => c.x > r.x0 && c.x < r.x1 && c.y > r.y0 && c.y < r.y1)
        if (원.length < 4) return []
        const 선 = []
        for (const [, bk] of 조각.out) { const a = bk.pos.a; for (let k = 0; k < bk.pos.n; k += 6) if (Math.hypot(a[k + 3] - a[k], a[k + 4] - a[k + 1]) >= 2500) 선.push([a[k], a[k + 1], a[k + 3], a[k + 4]]) }
        let 기 = []
        try { 기 = 통심기호({ 원, 선, 글자: (조각.texts || []).map((t) => ({ u: String(t.s || '').trim(), x: t.x, y: t.y, h: t.h || 0 })), 최대원: 8000 }) } catch (e) { 기 = [] }
        return 기.map((g) => ({ 글: g.글, 끝: g.끝 }))
      }
      const 제목들 = 박스제목들(판찾을.texts, fr)
      fr.forEach((r, i) => {
        const 제 = 제목들[i]
        let 종 = 도면종류(제, fr.length === 1 ? x.이름 : '')
        if (종 === '기타' && fr.length === 1) 종 = 파일종류
        const 통 = 판통심(r, 나.조각[i])
        /* 판 이름이 없고 통심 X · Y 가 여섯 넘게면 건물 둘레 평면(배치 · 기초 · 토목 계획) — 순서 1 «안에 든 것» */
        const 통글 = new Set(통.map((g) => g.글).filter((u) => /^[XY]\d{1,2}$/.test(u)))
        if (종 === '기타' && !제 && 통글.size >= 6 && [...통글].some((u) => u[0] === 'X') && [...통글].some((u) => u[0] === 'Y')) 종 = '평면'
        if (종 === '평면' && 현황이름(제 || (fr.length === 1 ? x.이름 : '')) && 측량다움(나.조각[i])) 종 = '측량'
        if (종 === '종평') {
          const c = 평면칸(나.조각[i], r)
          if (c) {
            const 둘 = 네모로나누기(나.조각[i], [c])
            넣기({ 박스: i, 제목: 제 + ' — 평면', 종류: '종평', raw: 둘.조각[0], 도곽: c })
            넣기({ 박스: i, 제목: 제 + ' — 종단·표', 종류: '종단', raw: 둘.밖, 도곽: r })
            return
          }
          종 = '종단'      // 평면 칸을 못 찾으면 자리를 맞추지 않습니다(종단 그래프·표가 평면처럼 옮겨지지 않게)
        }
        넣기({ 박스: i, 제목: 제, 종류: 종, raw: 나.조각[i], 도곽: r, 통심: 통.length >= 4 ? 통 : null, 내용종류: 종 === '평면' && !제 ? '통심' : '' })
      })
      /* 🩹 G212 측량 xref 안에 작은 네모(범례 · 표 블록)가 하나둘 있어 «박스» 로 잡히면, 나머지 측량 그림이 전부 «도곽 밖» 이 되어
         기준이 되지 못했습니다(현장 C 측량 xref — 1 m 네모 하나 · 선 103만 개는 밖). 밖이 거의 전부(80%)이고 측량다우면 측량도면 */
      const 밖수 = 선수(나.밖.out)
      const 밖측량 = 파일종류 !== '측량' && 밖수 >= 0.8 * 선수(x.raw.out) && 측량다움(나.밖)
      if (밖수 > 0) 넣기({ 박스: '밖', 제목: 밖측량 ? '' : '도곽 밖', 종류: 파일종류 === '측량' || 밖측량 ? '측량' : '밖', raw: 나.밖 })
      x.raw = null
    }

    /* ③ 🛣 횡단면도 — 같은 파일 · 같은 노선 이름의 박스를 모아 세웁니다(곧은 축). 자리는 ⑦½ 에서 — 평면 노선을 따라, 못 찾으면 곧게 펴 옆에 */
    let 횡단 = null
    const 횡노선 = []
    self.postMessage({ type: 'prog', p: 0.84, msg: '횡단면도(측점·지반고) 찾는 중' })
    {
      const 무리 = new Map()
      for (const it of 항목) {
        const 볼것 = it.종류 === '횡단' || (it.박스 === -1 && !평면꼴.has(it.종류))
        if (!볼것) continue
        const 키 = it.파일번 + '|' + (it.박스 === -1 ? '#' : 묶음이름(it.제목))
        let a = 무리.get(키); if (!a) { a = []; 무리.set(키, a) } a.push(it)
      }
      let k = 0
      for (const [, a] of 무리) {
        const raw = a.length === 1 ? a[0].raw : 도면합치기(a.map((it) => it.raw))
        const 머리 = (++k) + '· '
        const 이름 = a[0].박스 === -1 ? a[0].파일 : 묶음이름(a[0].제목) || a[0].파일
        const 열쇠 = 노선열쇠(a[0].박스 === -1 ? a[0].파일 : a[0].제목)
        /* 🛣 G236 한 파일에 여러 노선(열 위 제목 «Ramp-B» · «Ramp-D»)이면 노선마다 따로 세움 — 제목이 없으면 예전과 같음 */
        let 묶음 = null
        try { 묶음 = 횡단묶기(단면찾기(raw)) } catch (e) { 묶음 = null }
        if (!묶음 || !묶음.some((m) => m.노선글)) {
          let r = null
          try { r = 횡단세우기(raw, 새버킷, 0, 머리, 묶음 && 묶음.length === 1 ? 묶음[0].단면 : null) } catch (e) { r = null }
          if (!r) continue
          for (const it of a) it.쓴 = '횡단'
          횡노선.push({ 파일: 이름, 열쇠, r, 박스: a.length })
          continue
        }
        for (const m of 묶음) {
          let r = null
          try { r = 횡단세우기(raw, 새버킷, 0, 머리 + (m.노선글 ? m.노선글 + '· ' : ''), m.단면) } catch (e) { r = null }
          if (!r) continue
          for (const it of a) it.쓴 = '횡단'
          횡노선.push({ 파일: m.노선글 ? 이름 + ' · ' + m.노선글 : 이름, 열쇠, 노선글: m.노선글 || '', 제목없음: !m.노선글, r, 박스: a.length })
        }
      }
    }

    /* ④ 🏗 구조물 — 평면도 + 단면(EL 글자). 박스가 없는 도면은 통째로, 박스가 있으면 «구조도» 박스가 있는 파일만 그 파일의 남은 박스를 모아서 */
    self.postMessage({ type: 'prog', p: 0.86, msg: '구조물 단면(EL) 찾는 중' })
    const 구조 = []
    {
      const 파일별 = new Map()
      for (const it of 항목) {
        if (it.쓴) continue
        let a = 파일별.get(it.파일번); if (!a) { a = []; 파일별.set(it.파일번, a) } a.push(it)
      }
      for (const [, a] of 파일별) {
        const 통째 = a.length === 1 && a[0].박스 === -1
        let 후보
        if (통째) 후보 = 평면꼴.has(a[0].종류) && a[0].종류 !== '평면' ? [] : a
        else if (a.some((it) => it.종류 === '구조')) 후보 = a.filter((it) => ['구조', '상세', '기타', '평면'].includes(it.종류) && it.박스 !== '밖')
        else 후보 = []
        if (!후보.length) continue
        const raw = 후보.length === 1 ? 후보[0].raw : 도면합치기(후보.map((it) => it.raw))
        let r = null
        try { r = 구조세우기(raw, 새버킷, (구조.length + 1) + '· 구조 ') } catch (e) { r = null }
        if (!r) continue
        for (const it of 후보) it.쓴 = '구조'
        const 이름 = 후보[0].파일
        구조.push({ 파일: 이름, 단면: r.단면, 평면EL: r.평면EL, 빠짐: r.빠짐, 제목: r.제목 })
        그룹.push({ 종류: '구조', 파일: [이름], 제목: 통째 ? '' : `박스 ${후보.length}장`, out: r.out, 층들: r.단면.map((s) => s.층), 켬: true,
          설명: `평면 + 단면 ${r.단면.length - 1}장 · G.L ${r.평면EL.toFixed(2)} m`, 구조r: { 단면: r.단면, 평면EL: r.평면EL } })
      }
    }

    /* ⑤ 🗺 나머지 박스 — 도면 그대로(높이가 든 선은 그 높이). 단위를 mm 로 맞추고, 평면 쪽은 자리 맞춤 후보로 */
    self.postMessage({ type: 'prog', p: 0.88, msg: '같은 글자로 도면 자리 맞추는 중' })
    let 판번 = 0
    for (const it of 항목) {
      if (it.쓴) continue
      if (it.도곽) 테두리빼기(it.raw, it.도곽)        // 종이 테두리는 3D 에서 뺌(횡단 · 구조물은 위에서 이미 세움)
      const out = new Map()
      const 키 = `${it.파일번 + 1}-${++판번}· ${(it.제목 || (it.박스 === -1 ? '도면' : '박스')).slice(0, 40)}`
      for (const [ly, b] of it.raw.out) out.set(키 + '\u0001' + ly, b)
      if (!선수(out)) continue
      곱하기(out, it.배)
      if (it.종류 === '횡단') it.종류 = '횡단못'
      /* 🩹 G212 구조도라 했지만 단면(EL)을 못 읽은 것 — 설명 없이 «구조물» 로 떠 있었음 → 상세 · 표준도로(그림 나누기로 평면 그림만 겹쳐 봄) */
      if (it.종류 === '구조') it.종류 = '상세'
      const 평면 = 평면꼴.has(it.종류)
      /* 📈 종단 표(측점 · 누가거리 · 지반고 · 계획고) — 노선을 찾으면 그 위에 지반선 · 계획선으로 */
      let 종단표 = null
      if (it.종류 === '종단' || it.종류 === '종평') { try { 종단표 = 종단표읽기(it.raw.texts) } catch (e) { 종단표 = null } }
      /* 🧱 G230 흙막이 단면도 — 자리 옮기기 전(선 · 글자가 같은 좌표)에 E.L 로 단 높이 · 굴착 바닥 · 말뚝 끝을 읽어 둠 */
      let 흙단면 = null
      if (/단\s*면/.test(it.제목 || (it.박스 === -1 ? it.파일 : '') || '') && [...out.keys()].some((k) => 흙층(k.slice(k.indexOf('\u0001') + 1)))) {      /* 🧭 G237 박스 없는 도면은 파일 이름(«00-05 가설흙막이 단면도») */
        try { 흙단면 = 흙단면읽기(out, (it.raw.texts || []).map((t) => ({ x: t.x * it.배, y: t.y * it.배, s: t.s }))) } catch (e) { 흙단면 = null }
      }
      그룹.push({
        흙단면,
        종단표, 노선열쇠: 노선열쇠(it.제목 || it.파일), 파일번: it.파일번, 통심: it.통심 || null, 내용종류: it.내용종류 || '',
        종류: it.종류, 파일: [it.파일], 제목: it.제목 || '', 박스: it.박스 !== -1, out, 층들: [키],
        켬: 평면 && it.종류 !== '밖', 평면, 단위근거: it.단위근거,
        /* 꺼 둔 층 글자(수치지도 등)는 «숨» 표 — 그대로 맞는지 확인에는 쓰고, 다른 도면을 붙이는 바탕(pool)에는 안 넣습니다 */
        글: 평면 ? 글짝들(it.raw.texts, it.배, (ly) => !!꺼진.get(ly)) : null,
        이름: it.제목 || it.파일,
        /* 🖼 G212 그림 이름(«…평면도» «…단면도») 찾기용 — 보이는 층 글자만 · 단위 맞춤 */
        글자: (it.raw.texts || []).filter((t) => !꺼진.get(t.ly)).map((t) => ({ x: t.x * it.배, y: t.y * it.배, h: (t.h || 0) * it.배, s: t.s })),
      })
      it.raw = null
    }

    /* ⑥ 📡 측량성과표 — 점(이름 · 북 · 동 · 표고). 캐드 x = 동(E), y = 북(N). 표에 N·E 가 안 적혀 있으면 바꿔 읽어 보고 정합니다 */
    let 측량점 = null
    if (성과) {
      const 글들 = (바꿈) => {
        const L = []
        for (const p of 성과.점) {
          const x = (바꿈 ? p.N : p.E) * 1000, y = (바꿈 ? p.E : p.N) * 1000
          const q = 글열쇠(p.이름, '성과표')
          if (q) L.push({ ...q, x, y, s: p.이름 })
          if (p.Z != null) { const h = 글열쇠(Number(p.Z).toFixed(3), '성과표'); if (h) L.push({ ...h, x, y, s: Number(p.Z).toFixed(3) }) }
        }
        return L
      }
      let 바꿈 = false
      if (!성과.북동확실) {
        /* 두 방향 다 맞춰 보고 짝이 많이 맞는 쪽 */
        const 점수 = (L) => 그룹.filter((g) => g.평면 && g.글 && g.글.length).reduce((s, g) => { const r = 짝맞추기(g.글, L); return s + (r && r.됨 ? r.w : 0) }, 0)
        const a = 점수(글들(false)), b = 점수(글들(true))
        바꿈 = b > a
      }
      const out = new Map()
      const 키 = '측량점· 성과표'
      const b = 새버킷()
      for (const p of 성과.점) {
        const x = (바꿈 ? p.N : p.E) * 1000, y = (바꿈 ? p.E : p.N) * 1000, z = (p.Z ?? 0) * 1000
        b.pts.push3(x, y, z); b.pcol.push3(255, 214, 64)
        /* 점만으로는 작아서 — 높이 1 m 짜리 짧은 기둥과 십자를 같이 */
        b.pos.push6(x, y, z, x, y, z + 1000); b.col.push3(255, 214, 64); b.col.push3(255, 214, 64)
        b.pos.push6(x - 500, y, z, x + 500, y, z); b.col.push3(255, 214, 64); b.col.push3(255, 214, 64)
        b.pos.push6(x, y - 500, z, x, y + 500, z); b.col.push3(255, 214, 64); b.col.push3(255, 214, 64)
      }
      out.set(키 + '\u0001측량점(성과표)', b)
      측량점 = { n: 성과.점.length, 파일: 성과.파일 || '측량성과표', 바꿈, 북동확실: !!성과.북동확실, 높이: 성과.점.filter((p) => p.Z != null).length }
      그룹.unshift({ 종류: '측량점', 파일: [측량점.파일], 제목: `측량점 ${성과.점.length}개`, out, 층들: [키], 켬: true, 평면: true, 글: 글들(바꿈), 이름: 측량점.파일, 성과표: true })
    }

    /* ⑦ 📍 자리 맞춤 — 기준을 정하고, 평면 쪽 박스를 «같은 글자» 로 기준 무리에 붙여 나갑니다 */
    const 꺼짐 = (name) => { const c = name.indexOf('\u0001'); return 꺼진.get(c >= 0 ? name.slice(c + 1) : name) }
    const 표본 = (out) => {
      const 모으기 = (보임만) => {
        /* 층마다 4000 점 남짓만 뽑으므로, 뽑은 점 하나가 «몇 점 몫» 인지(ws)를 같이 둡니다 */
        const xs = [], ys = [], ws = []
        for (const [name, b] of out) {
          if (보임만 && 꺼짐(name)) continue
          for (const [arr, 한] of [[b.pos, 4000], [b.pts, 2000]]) {
            const a = arr.a, st = Math.max(3, Math.floor(arr.n / 3 / 한) * 3)
            for (let i = 0; i < arr.n; i += st) { xs.push(a[i]); ys.push(a[i + 1]); ws.push(st / 3) }
          }
        }
        return { xs, ys, ws }
      }
      const t = 모으기(true)
      if (t.xs.length) { t.보임 = true; return t }
      const f = 모으기(false); f.보임 = false; return f
    }
    const 상자 = (t) => { if (!t.xs.length) return null; const r = 알맹이상자(t.xs, t.ys, t.ws); return [r[0], r[1], r[3], r[4]] }
    const 옮기기 = (out, dx, dy) => 바꾸기(out, { a: 1, b: 0, tx: dx, ty: dy })
    for (const g of 그룹) { g.표본 = 표본(g.out); g.상자 = 상자(g.표본) }

    const 평들 = 그룹.filter((g) => g.평면 && g.상자)
    const 이름에 = (g, re) => re.test(`${g.제목 || ''} ${g.파일.join(' ')}`.replace(/\s+/g, ''))
    const 크기 = (g) => g.표본.ws.reduce((s, w) => s + w, 0)
    /* 기준 차례 — 측량성과표 → 측량도면 → 계획평면도 → 평면도(가장 큰 것) */
    const 차례 = 기준차례
    /* 🧭 G241 측량도면이 여럿이면 «다른 도면과 좌표를 같이 쓰는 것» 먼저(순서 2) — 현장 B: 건축 쪽 «현황측량성과도»(판 이름에 측량)보다
         토목 평면과 같은 좌표를 쓰는 판이 같으면 넓은 것(01-3 현황도 — 토목 평면이 그 안에 다 듦). 그다음 이름(GPS · 측량) */
    const 겹상자 = (p, q) => { const w = Math.min(p[2], q[2]) - Math.max(p[0], q[0]), h = Math.min(p[3], q[3]) - Math.max(p[1], q[1]); if (!(w > 0 && h > 0)) return 0; return (w * h) / Math.max(1e-9, Math.min((p[2] - p[0]) * (p[3] - p[1]), (q[2] - q[0]) * (q[3] - q[1]))) }
    const 측기준 = (g) => { const c = 차례(g); return c === 1 || c === 2 }
    const 공유셈 = new Map()
    const 공유 = (g) => { if (!공유셈.has(g)) 공유셈.set(g, 평들.filter((h) => h !== g && h.파일번 !== g.파일번 && h.종류 !== '밖' && h.상자 && 겹상자(g.상자, h.상자) > 0.3).length); return 공유셈.get(g) }
    const 기준후보 = (평들.some((g) => g.종류 !== '밖') ? 평들.filter((g) => g.종류 !== '밖') : 평들).slice().sort((a, b) => {
      const ca = 측기준(a) ? 1 : 차례(a), cb = 측기준(b) ? 1 : 차례(b)
      if (ca !== cb) return ca - cb
      if (측기준(a) && 측기준(b)) return 공유(b) - 공유(a) || 크기(b) - 크기(a) || 차례(a) - 차례(b)
      return 차례(a) - 차례(b) || 크기(b) - 크기(a)
    })
    let 기준g = null
    const 무리들 = []         // [{ 머리, 들:[g] }]
    /* 🔗 G212 xref 끼움 관계(lib/xref3d.js) — 도면끼리 «캐드에서 끼운 자리» 그대로 */
    const 관계 = 끼움관계(읽은.map((x) => ({ 이름: x.이름, xrefs: x.xrefs, 배: x.배 || 1 })))
    /* 끼움으로 놓인 도곽 밖 · 이름 없는 종이는 기준 그림 위(몸통의 절반 넘게)일 때만 켬 — 캐드 모형 공간 먼 곳의 다른 그림까지 켜지지 않게 */
    const 기준위 = (g) => {
      const 머 = 무리들.length && 무리들[0].머리
      if (!머 || !머.상자 || !g.표본 || !g.표본.xs.length) return false
      const [x0, y0, x1, y1] = 머.상자, mx = (x1 - x0) * 0.1, my = (y1 - y0) * 0.1
      let 안 = 0, 모두 = 0
      for (let i = 0; i < g.표본.xs.length; i++) { 모두 += g.표본.ws[i]; if (g.표본.xs[i] >= x0 - mx && g.표본.xs[i] <= x1 + mx && g.표본.ys[i] >= y0 - my && g.표본.ys[i] <= y1 + my) 안 += g.표본.ws[i] }
      return 모두 > 0 && 안 >= 모두 * 0.5
    }
    const 끼움T = (g, 들) => {
      if (g.파일번 == null) return null
      let 최 = null
      for (const h of 들) {
        if (h.파일번 == null || h.파일번 === g.파일번 || h.종류 === '밖') continue
        const r = 관계(h.파일번, g.파일번)
        if (!r) continue
        /* 배가 1 에서 많이 벗어나면(단위를 잘못 짚었거나 축소 위치도) 쓰지 않음 */
        if (Math.abs(Math.hypot(r.T.a, r.T.b) - 1) > 0.01) continue
        const 점 = (h.기준 ? 3 : 0) + (h.자리 && h.자리.how === '글자' ? 1 : 0) - r.길.length * 0.1
        if (!최 || 점 > 최.점) 최 = { 점, T: h.T ? 잇기(h.T, r.T) : r.T, h, 길: r.길 }
      }
      return 최
    }
    const 붙이기 = (머리, 남은) => {
      const 들 = [머리]
      머리.무리 = 무리들.length
      const 못 = new Map()
      /* ⚠️ 바탕(pool)에는 «보이는 층» 글자만 — 꺼 둔 수치지도 글자는 여러 파일에 똑같이 들어 있어(소장님 도면 02 · 03 · 04 · 08 · 13),
         한 도면이 붙으면 그 수치지도 글자로 엉뚱한 도면(종평 시트 묶음 통째)까지 «그대로 맞음» 으로 줄줄이 붙었습니다(시험으로 확인) */
      const 보이는 = (L) => (L || []).filter((p) => !p.숨)
      let pool = 머리.성과표 || 머리.종류 === '측량' ? (머리.글 || []).slice() : 보이는(머리.글)
      /* 열쇠 → 기준 쪽 자리들 (그대로 둔 채로 맞는 글자가 몇인지 빨리 세려고) */
      const 표 = new Map()
      const 표에 = (L) => { for (const p of L) { let a = 표.get(p.k); if (!a) { a = []; 표.set(p.k, a) } if (a.length < 8) a.push(p) } }
      표에(pool)
      const 그대로맞음 = (L) => {
        let n = 0, w = 0
        const 본 = new Set()
        for (const p of L) {
          if (본.has(p.k)) continue
          const a = 표.get(p.k)
          if (a && a.some((q) => Math.abs(q.x - p.x) <= 2500 && Math.abs(q.y - p.y) <= 2500)) { 본.add(p.k); n++; w += p.w }
        }
        return { n, w }
      }
      const 넣기 = (g) => { if (g.글 && g.종류 !== '밖') { const v = 보이는(g.글); pool = pool.concat(v); 표에(v) } 들.push(g) }
      let 바뀜 = true, 판 = 0
      while (바뀜 && 판++ < 6) {
        바뀜 = false
        /* ㉢(먼저) xref 끼움 — 이미 놓인 도면과 끼움 관계가 있으면 그 자리 그대로(글자 · 좌표 짐작보다 먼저) */
        for (const g of 남은) {
          if (g.무리 != null) continue
          const k = 끼움T(g, 들)
          if (!k) continue
          바꾸기(g.out, k.T)
          if (g.글) g.글 = g.글.map((p) => { const [x, y] = 변환하기(k.T, p.x, p.y); if (p.ax == null) return { ...p, x, y }; const [ax, ay] = 변환하기(k.T, p.ax, p.ay); return { ...p, x, y, ax, ay } })
          g.표본 = 표본(g.out); g.상자 = 상자(g.표본)
          g.T = k.T
          g.무리 = 머리.무리
          g.자리 = { how: '끼움', 길: k.길.slice(0, 3), 회전: 회전도(k.T) }
          if (g.종류 === '밖') g.켬 = 기준위(g)
          넣기(g); 바뀜 = true
        }
        /* ㉠ 같은 글자로 — 이미 제자리(좌표가 같음)인 도면은 옮기지 않습니다.
           ⚠️ 도곽 밖(밖)은 글자로 맞추지 않습니다: 꺼 둔 수치지도 · 다른 도면 사본이 섞여 있어(소장님 도면 02 · 03 · 08 · 13 모두 같은 수치지도가 도곽 밖에 있음)
              엉뚱한 짝으로 맞춰지고, 그 글자가 다른 도면까지 끌고 갔습니다(시험으로 확인). */
        for (const g of 남은) {
          if (g.무리 != null || g.종류 === '밖' || !g.글 || !g.글.length) continue
          const 그대 = 그대로맞음(g.글)
          const r = 짝맞추기(g.글, pool)
          const 거의그대로 = r && r.됨 && Math.abs(회전도(r.T)) < 0.02 && Math.hypot(r.T.tx, r.T.ty) < 2000
          if (그대.n >= 3 && 그대.w >= 2.5 && (!r || !r.됨 || 거의그대로 || r.w < 그대.w * 1.5)) {
            g.무리 = 머리.무리
            g.자리 = { how: '좌표', n: 그대.n, 확인: true }
            넣기(g); 바뀜 = true
            continue
          }
          if (!r || !r.됨) { if (r && (!못.get(g) || r.n > 못.get(g).n)) 못.set(g, r); continue }
          바꾸기(g.out, r.T)
          g.글 = g.글.map((p) => { const [x, y] = 변환하기(r.T, p.x, p.y); if (p.ax == null) return { ...p, x, y }; const [ax, ay] = 변환하기(r.T, p.ax, p.ay); return { ...p, x, y, ax, ay } })
          g.표본 = 표본(g.out); g.상자 = 상자(g.표본)
          g.T = r.T
          g.무리 = 머리.무리
          const 돌 = 회전도(r.T), 축 = 축척(r.T)
          g.자리 = { how: '글자', n: r.n, rms: r.rms / 1000, max: r.max / 1000, 회전: 돌, 축척: r.단위배 ? 1 : 축, 단위배: r.단위배 || 0, 옮김m: Math.hypot(r.T.tx, r.T.ty) / 1000,
            짝: r.짝.slice(0, 40).map((p) => ({ s: p.s, 종: p.종, e: p.e / 1000 })) }
          넣기(g); 바뀜 = true
        }
        /* ㉡ 좌표가 이미 그 무리 자리(30% 또는 300 m 안)에 겹치는 도면은 그대로 — 측량 좌표로 그린 철거계획평면도·토출부 계획도.
              보이는 선(캐드에서 켠 층)이 있는 것만 — 꺼 둔 수치지도만 있는 도곽 밖은 붙이지 않습니다 */
        let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity
        /* 무리 자리는 기준과 «글자로 확인된» 도면으로만 — 좌표가 겹친다고 붙은 도면까지 넣으면 자리가 눈덩이처럼 커집니다 */
        for (const h of 들) { if (!h.상자 || !(h === 머리 || (h.자리 && (h.자리.how === '글자' || (h.자리.how === '좌표' && h.자리.확인))))) continue; X0 = Math.min(X0, h.상자[0]); Y0 = Math.min(Y0, h.상자[1]); X1 = Math.max(X1, h.상자[2]); Y1 = Math.max(Y1, h.상자[3]) }
        /* 넉넉히: 무리 크기의 30% 또는 300 m — 측량 범위 바로 바깥(소장님 도면 13 토출부는 GPS 측량 범위에서 170~500 m 남쪽)도 같은 좌표계면 붙입니다 */
        const m = Math.max(Math.max(X1 - X0, Y1 - Y0) * 0.3, 300000)
        for (const g of 남은) {
          if (g.무리 != null || !g.표본.보임) continue
          /* 도곽 박스(종이 한 장)는 좌표 근처에 «옮겨 둔 사본» 일 수 있어(소장님 도면 13: 1/100 호안블록 계획도 박스가 측량 범위 옆에 놓여 있음),
             같은 글자가 그대로 2개 넘게 맞을 때만 그대로 둡니다 */
          if (g.박스 && g.종류 !== '밖' && 그대로맞음(g.글 || []).n < 2) continue
          const { xs, ys, ws } = g.표본
          let 안 = 0, 모두 = 0
          for (let i = 0; i < xs.length; i++) { 모두 += ws[i]; if (xs[i] >= X0 - m && xs[i] <= X1 + m && ys[i] >= Y0 - m && ys[i] <= Y1 + m) 안 += ws[i] }
          /* 🩹 G212 같은 좌표계 — 측량 범위보다 길게 뻗은 도로 평면 · 종평(현장 A 평면 및 종단면도: 2 km)은 60% 가 안 들어가 옆에 놓였습니다.
             기준과 이 도면이 둘 다 나라 좌표(50 ~ 1000 km)이고, 이 도면 몸통이 기준 범위(±2 km)에 걸치면 같은 좌표로 그린 것 — 그대로 둡니다.
             도곽 박스(종이 한 장)는 «옮겨 둔 사본» 일 수 있어 이 규칙을 쓰지 않습니다(위 글자 확인 그대로) */
          const 나라 = (v) => Math.abs(v) >= 5e7 && Math.abs(v) <= 1e9
          const 같은좌표계 = !g.박스 && g.종류 !== '밖' && g.상자 && Number.isFinite(X0) &&
            나라((X0 + X1) / 2) && 나라((Y0 + Y1) / 2) && 나라((g.상자[0] + g.상자[2]) / 2) && 나라((g.상자[1] + g.상자[3]) / 2) &&
            g.상자[2] - g.상자[0] < 2e7 && g.상자[3] - g.상자[1] < 2e7 &&
            g.상자[0] < X1 + 2e6 && g.상자[2] > X0 - 2e6 && g.상자[1] < Y1 + 2e6 && g.상자[3] > Y0 - 2e6
          if (!(모두 > 0 && 안 >= 모두 * 0.6) && !같은좌표계) continue
          g.무리 = 머리.무리
          g.자리 = { how: '좌표', 까닭: 못.get(g) ? 못.get(g).까닭 : '', ...(모두 > 0 && 안 >= 모두 * 0.6 ? {} : { 같은좌표계: true }) }
          넣기(g); 바뀜 = true
        }
      }
      for (const g of 남은) if (g.무리 == null && 못.get(g)) g.못 = 못.get(g)
      무리들.push({ 머리, 들 })
      return 들
    }
    if (기준후보.length) {
      기준g = 기준후보[0]
      기준g.기준 = true
      기준g.자리 = { how: '기준' }
      붙이기(기준g, 평들.filter((g) => g !== 기준g))
      /* 성과표가 아무 도면과도 안 이어지면 — 도면끼리 따로 맞추고(두 번째 기준), 성과표 점은 처음엔 꺼 둡니다 */
      if (기준g.성과표 && 무리들[0].들.length === 1) {
        const 둘째 = 기준후보.find((g) => g !== 기준g && g.무리 == null)
        if (둘째) {
          둘째.기준 = true; 둘째.자리 = { how: '기준', 둘째: true }
          붙이기(둘째, 평들.filter((g) => g.무리 == null && g !== 둘째))
          기준g.켬 = false
          기준g.자리 = { how: '기준', 안이어짐: true }
        }
      }
    }
    for (const g of 평들) {
      if (g.무리 != null) continue
      g.켬 = false
      g.자리 = { how: '옆', 까닭: g.못 ? g.못.까닭 : '같은 글자(지번·측점·기준점 이름)를 못 찾음', n: g.못 ? g.못.n : 0 }
    }
    /* 밖(도곽 밖 그림)은 기준 무리에 붙었을 때만 켭니다 */
    for (const g of 그룹) if (g.종류 === '밖') g.켬 = g.무리 === 0 && g !== 기준g ? (g.자리 && g.자리.how === '끼움' ? g.켬 : true) : g.켬
    for (const g of 그룹) if (끔꼴.has(g.종류)) g.켬 = false
    /* 🔗 G212 끼움 — 이름 없는 종이(기타) 박스도 xref 끼움 관계가 있으면 그 자리로(현장 D 공사계획평면도의 종이 박스) */
    if (무리들.length) {
      const 들 = 무리들[0].들
      for (const g of 그룹) {
        if (g.무리 != null || g.평면 || g.종류 !== '기타' || !g.상자) continue
        const k = 끼움T(g, 들)
        if (!k) continue
        바꾸기(g.out, k.T); g.표본 = 표본(g.out); g.상자 = 상자(g.표본); g.T = k.T
        g.무리 = 0; g.자리 = { how: '끼움', 길: k.길.slice(0, 3), 회전: 회전도(k.T) }; g.켬 = 기준위(g)
        들.push(g)
      }
    }
    /* 🔗 G212 자른(XCLIP) 끼움 — 같은 측량 xref 를 그림마다 돌려 끼운 종평면도(현장 C 종평면도: 19 곳). 자른 테두리 안의 선을 떼어
          그 끼움 자리로 겹칩니다(테두리 밖 — 종단 그래프 · 표 · 제목은 그대로 옆) */
    if (무리들.length) {
      const 들 = 무리들[0].들
      const 새것 = []
      for (const g of 그룹.slice()) {
        if (g.무리 != null || g.파일번 == null || !g.out || !['평면', '종평', '기타', '밖', '종단', '측량'].includes(g.종류)) continue
        let 최 = null
        for (const h of 들) {
          if (h.파일번 == null || h.파일번 === g.파일번 || h.종류 === '밖' || h.그림) continue
          const L = 관계.구역(g.파일번, h.파일번)
          if (!L.length) continue
          const 점 = (h.기준 ? 2 : 0) + L.length * 0.01
          if (!최 || 점 > 최.점) 최 = { 점, L, h }
        }
        if (!최) continue
        const 상자들 = 최.L.map((r) => r.상자)
        const 어디 = (x, y) => {
          for (let k = 0; k < 상자들.length; k++) { const b = 상자들[k]; if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && (!최.L[k].꼴 || 꼴안(최.L[k].꼴, x, y))) return k }
          return -1
        }
        let 뗌 = 0
        최.L.forEach((r, k) => {
          const 키 = `${g.층들[0]}·끼움${k + 1}`
          const out = 그림떼기(g.out, 어디, k, () => 키, 새버킷)
          if (선수(out) < 20) return
          const T = 최.h.T ? 잇기(최.h.T, r.T) : r.T
          바꾸기(out, T)
          const 원 = (g.제목 && g.제목 !== '도곽 밖' ? g.제목 : '') || g.파일[0].replace(/\.dxf$/i, '')
          const 이 = 그림이름(g.글자 || [], r.상자)
          const h = { 종류: '평면', 파일: g.파일, 파일번: g.파일번, 제목: 이.이름 || `${원} — 그림 ${k + 1}`, out, 층들: [키], 켬: true, 평면: true, 무리: 0, 그림: true, 이름: 이.이름 || 원, T,
            자리: { how: '끼움', 길: [`${g.파일[0]} ← ${r.이름} (자른 자리 ${k + 1})`], 회전: 회전도(T), 그림: 원 } }
          h.표본 = 표본(out); h.상자 = 상자(h.표본)
          새것.push(h); 들.push(h); 뗌++
        })
        if (뗌) { g.그림뗌 = (g.그림뗌 || 0) + 뗌; g.끼움뗌 = true; g.표본 = 표본(g.out); g.상자 = 상자(g.표본) }
      }
      for (const h of 새것) 그룹.push(h)
    }
    /* 🔗 끼움 · 글자 · 좌표로 놓인 도면 중 기준(측량) 그림 밖으로 멀리 나간 부분(위치도 · 다른 종이 · 범례)은 따로 떼어 처음엔 꺼 둠 —
          캐드 모형 공간의 먼 그림까지 켜면 화면이 그것까지 담느라 현장이 작아졌습니다(현장 D 화장실 · 현황 및 철거계획평면도) */
    if (무리들.length && 무리들[0].머리 && 무리들[0].머리.상자) {
      /* 기준 그림 둘레(그 크기만큼 또는 1.5 km) — 측량 범위보다 넓은 사업계획평면도 · 배수로 종평면도(가상지구)는 그대로 켜 두고,
         몇 km 떨어진 위치도 · 다른 종이(현장 D 현황 및 철거계획평면도: 10 km 서쪽에 같은 식재도가 한 벌 더)만 뗌 */
      const [x0, y0, x1, y1] = 무리들[0].머리.상자
      const mx = Math.max((x1 - x0) * 1.0, 1.5e6), my = Math.max((y1 - y0) * 1.0, 1.5e6)
      const 안 = (x, y) => x >= x0 - mx && x <= x1 + mx && y >= y0 - my && y <= y1 + my
      const 새것 = []
      for (const g of 그룹) {
        if (!g.자리 || !['끼움', '글자', '좌표'].includes(g.자리.how) || !g.켬 || !g.out || g.기준 || g.종류 === '땅면') continue
        let 안수 = 0, 밖수 = 0
        for (const [, b] of g.out) { const a = b.pos.a; for (let i = 0; i < b.pos.n; i += 6) { if (안((a[i] + a[i + 3]) / 2, (a[i + 1] + a[i + 4]) / 2)) 안수++; else 밖수++ } }
        if (밖수 < 0.1 * (안수 + 밖수) || 안수 < 20) { if (안수 < 20) g.켬 = false; continue }
        const 키 = `${g.층들[0]}·밖`
        const out = 그림떼기(g.out, (x, y) => (안(x, y) ? -1 : 0), 0, () => 키, 새버킷)
        const h = { ...g, out, 층들: [키], 켬: false, 그림: true, 제목: `${g.제목 || g.파일[0].replace(/\.dxf$/i, '')} — 측량 그림 밖`, 자리: { how: g.자리.how, 기준밖: true }, 글: null, 글자: null, 그림뗌: 0 }
        h.표본 = 표본(out); h.상자 = 상자(h.표본)
        g.표본 = 표본(g.out); g.상자 = 상자(g.표본)
        새것.push(h)
      }
      for (const h of 새것) 그룹.push(h)
      /* 측량 도면이 시 · 군 전체만큼 넓으면(현장 C 측량 xref: 130 km — 마을 그림이 두 벌) 공사 도면 둘레 밖은 떼어 처음엔 꺼 둠 */
      const 머 = 무리들[0].머리
      let p0 = Infinity, q0 = Infinity, p1 = -Infinity, q1 = -Infinity
      for (const g of 그룹) {
        if (g.무리 !== 0 || g === 머 || !g.켬 || !g.상자 || g.종류 === '땅면' || g.종류 === '측량' || g.성과표 || (g.파일번 != null && g.파일번 === 머.파일번)) continue
        p0 = Math.min(p0, g.상자[0]); q0 = Math.min(q0, g.상자[1]); p1 = Math.max(p1, g.상자[2]); q1 = Math.max(q1, g.상자[3])
      }
      if (Number.isFinite(p0) && 머.out && 머.상자) {
        const ex = Math.max((p1 - p0) * 0.5, 1e6), ey = Math.max((q1 - q0) * 0.5, 1e6)
        const 공 = [p0 - ex, q0 - ey, p1 + ex, q1 + ey]
        const 넓 = (머.상자[2] - 머.상자[0]) * (머.상자[3] - 머.상자[1]), 좁 = (공[2] - 공[0]) * (공[3] - 공[1])
        if (넓 > 2 * 좁) {
          const 키 = `${머.층들[0]}·밖`
          const out = 그림떼기(머.out, (x, y) => (x >= 공[0] && x <= 공[2] && y >= 공[1] && y <= 공[3] ? -1 : 0), 0, () => 키, 새버킷)
          if (선수(out) > 0) {
            const h = { 종류: 머.종류, 파일: 머.파일, 파일번: 머.파일번, 제목: `${머.제목 || 머.파일[0].replace(/\.dxf$/i, '')} — 공사 자리 밖`, out, 층들: [키], 켬: false, 평면: true, 무리: 0, 그림: true,
              자리: { how: '기준', 기준밖: true } }
            h.표본 = 표본(out); h.상자 = 상자(h.표본)
            머.표본 = 표본(머.out); 머.상자 = 상자(머.표본)
            그룹.push(h)
          }
        }
      }
    }
    /* 한 가지뿐이면 무조건 켭니다(도면 한 장만 넣었을 때 빈 화면이 되지 않게) */
    if (!그룹.some((g) => g.켬)) for (const g of 그룹) g.켬 = true

    /* ⑦½ 🛣 노선 — 자리를 맞춘 평면도(평면 · 종평 평면 칸)의 측점 글자 + 중심선 → 노선. 같은 이름의 횡단 · 종단을 그 노선 위에 세웁니다.
          (1/2 · 2/2 처럼 여러 장이면 같은 노선으로 모아서 — 이미 측량 좌표에 맞춰져 있으므로 그대로 이어집니다) */
    self.postMessage({ type: 'prog', p: 0.9, msg: '평면도 측점으로 노선 찾는 중' })
    const 노선모음 = new Map()
    for (const g of 그룹) {
      if (!g.평면 || g.무리 == null || !(g.종류 === '평면' || g.종류 === '종평') || !g.글) continue
      const 글 = g.글.filter((p) => p.종 === '측점' && !p.숨)
      if (글.length < 2) continue
      const 열 = g.노선열쇠 || 노선열쇠(g.제목 || g.파일[0])
      let m = 노선모음.get(열)
      if (!m) { m = { 열쇠: 열, 이름: 노선이름(g.제목 || g.파일[0]), 글: [], 이름글: [], 선: {}, 무리: g.무리, 평면: [] }; 노선모음.set(열, m) }
      /* 🛣 G236 가운데 · 오른쪽 맞춤 글자는 맞춤점(캐드가 그리는 자리) — 왼쪽 아래 점은 글자 길이만큼 옆(현장 G 램프 끝 «0+136.8063» 은 17 m) */
      for (const p of 글) m.글.push({ s: p.s, x: p.ax ?? p.x, y: p.ay ?? p.y })
      /* 🛣 G236 노선 이름 글자(«STA.0+63.8(Rramp-B)» · «본선») — 한 평면에 노선이 여럿일 때 나눠 이름 붙임 */
      for (const p of g.글) if (p.종 === '글자' && !p.숨 && 노선이름글(p.s)) m.이름글.push({ s: p.s, x: p.ax ?? p.x, y: p.ay ?? p.y })
      for (const [name, b] of g.out) {
        const ly = name.slice(name.indexOf('\u0001') + 1)
        if (!중심꼴.test(ly) || !b.pos.n) continue
        const a = b.pos.a, S = m.선[ly] || (m.선[ly] = [])
        for (let i = 0; i < b.pos.n; i += 6) S.push([a[i], a[i + 1], a[i + 3], a[i + 4]])
      }
      m.평면.push(g)
    }
    const 노선들 = [], 갈래들 = []
    for (const m of 노선모음.values()) {
      let rs = []
      try { rs = 노선들찾기(m.글, m.선, m.이름글) } catch (e) { rs = [] }
      /* 첫째는 예전 노선 · 둘째부터(갈래 — 같은 평면의 다른 이름 노선)는 횡단 제목이 그 이름을 부를 때만 씀 */
      rs.forEach((r, i) => (i === 0 ? 노선들 : 갈래들).push({ ...m, r, 이름글: r.이름글 || '', 갈래: i > 0 }))
    }
    /* 이름으로 노선 고르기 — 같은 이름(2) 또는 품는 이름(1, 측점 범위가 반 넘게 겹칠 때만).
       같은 노선을 여러 평면도가 그렸으면 «중심선» 으로 찾은 것을 먼저 — 소장님 도면 02 는 측점 글자만 있어 글자 자리(중심에서 왼쪽 3.4 m)로 이었고,
       04 철거계획평면도는 중심선이 있어 그쪽이 바릅니다(시험으로 확인). 노선이 하나뿐이고 측점 범위가 겹치면 이름이 달라도 */
    const 노선고르기 = (열쇠, 범위, 노선글 = '') => {
      const 겹침 = (L) => { if (!범위) return 1; const lo = Math.max(범위[0], L.r.범위[0]), hi = Math.min(범위[1], L.r.범위[1]); return (hi - lo) / Math.max(1, 범위[1] - 범위[0]) }
      /* 🛣 G236 횡단 열 제목(«Ramp-B»)이 있고 평면 노선에 이름(«Rramp-B»)이 붙어 있으면 이름으로만 — 다른 이름의 노선에는 안 얹음 */
      const 이름든 = [...노선들, ...갈래들].filter((L) => L.이름글)
      if (노선글 && 이름든.length) {
        const 후 = 이름든.map((L) => ({ L, k: 노선글같음(노선글, L.이름글) })).filter((c) => c.k > 0)
        if (!후.length) return null
        /* 같은 이름이 여러 벌(평면도마다 · 사본)이면 측량 땅 위 → 횡단 측점을 선이 덮는 몫 → 잘 맞는(rms) 것 */
        const 덮 = (L) => { if (!범위) return 1; const [a0, a1] = L.r.줄범위 || L.r.범위; return Math.max(0, Math.min(범위[1], a1 + 1) - Math.max(범위[0], a0 - 1)) / Math.max(1, 범위[1] - 범위[0]) }
        const 땅 = (L) => Math.round(땅위(L) * 5)
        후.sort((a, b) => b.k - a.k || 땅(b.L) - 땅(a.L) || Math.round(덮(b.L) * 20) - Math.round(덮(a.L) * 20) || a.L.r.rms - b.L.r.rms || b.L.r.n - a.L.r.n)
        return { k: 2, L: 후[0].L, 이름으로: true }
      }
      const 본 = 노선들.filter((L) => !L.갈래)        /* 갈래(이름으로만 부르는 노선)는 이름 열쇠로 안 고름 */
      const 후보 = 본.map((L) => ({ L, k: Math.max(노선같음(열쇠, L.열쇠), ...(L.딴열쇠 || []).map((e) => 노선같음(열쇠, e))), o: 겹침(L) })).filter((c) => c.k === 2 || (c.k === 1 && c.o >= 0.5))
      if (후보.length) {
        const 중 = (c) => (c.L.r.근거 === '중심선' && c.o >= 0.5 ? 1 : 0)
        후보.sort((a, b) => 중(b) - 중(a) || b.k - a.k || b.L.r.n - a.L.r.n)
        return 후보[0]
      }
      if (본.length === 1 && 범위 && 겹침(본[0]) >= 0.5) return { k: 0, L: 본[0] }
      return null
    }
    /* 🛣 G236 노선이 측량 땅 위에 있는 몫(0~1) — 같은 이름 노선이 두 벌(평면도 안 다른 자리 사본 · 위치도)이면 측량 위의 것 */
    const 땅위몫 = new Map()
    const 땅위 = (L) => {
      if (땅위몫.has(L)) return 땅위몫.get(L)
      let v = 0
      if (땅점 && 땅점.length) {
        const 칸 = 땅칸 || (땅칸 = (() => { const m = new Set(); for (const [x, y] of 땅점) m.add(Math.floor(x / 30000) + ',' + Math.floor(y / 30000)); return m })())
        const [s0, s1] = L.r.줄범위 || L.r.범위, n = Math.max(2, Math.min(200, Math.ceil((s1 - s0) / 10)))
        let 안 = 0
        for (let k = 0; k <= n; k++) { const p = L.r.자리(s0 + (s1 - s0) * k / n); if (칸.has(Math.floor(p.x / 30000) + ',' + Math.floor(p.y / 30000))) 안++ }
        v = 안 / (n + 1)
      }
      땅위몫.set(L, v)
      return v
    }
    let 땅칸 = null
    /* 🟫 (G139) 측량 땅 면 — 측량성과표 · 측량도면 · 평면도 안의 «높이 든 점» 을 들로네 삼각형으로(자리 맞춘 무리 안 것만) */
    let 땅면 = null, 땅높이 = null, 땅점 = null, 땅삼 = null      /* 🧰 G224 땅점 · 땅삼 = 3D 활용(토공 · 물길 · 도면 검사)에 넘김 */
    {
      const 점 = [], 본 = new Set(), 출처 = new Set()
      const 넣기 = (x, y, z, 이름) => { const k = Math.round(x / 300) + ',' + Math.round(y / 300); if (본.has(k)) return; 본.add(k); 점.push([x, y, z]); 출처.add(이름) }
      for (const g of 그룹) {
        if (!g.평면 || g.무리 !== 0) continue
        for (const [name, b] of g.out) {
          const ly = name.slice(name.indexOf('\u0001') + 1)
          if (/defpoints/i.test(ly) || !b.pts.n) continue
          const a = b.pts.a
          for (let i = 0; i < b.pts.n; i += 3) if (Math.abs(a[i + 2]) > 1 && Math.abs(a[i + 2]) < 3e6) 넣기(a[i], a[i + 1], a[i + 2], g.성과표 ? g.이름 : g.파일[0])
        }
      }
      if (점.length >= 12) {
        /* 이웃 점 사이 거리(가운데 값)로 «잇지 않을 긴 변» 을 정함 — 점이 없는 논밭 가운데를 가로지르지 않게 */
        const 칸 = new Map()
        for (let i = 0; i < 점.length; i++) { const k = Math.floor(점[i][0] / 20000) + ',' + Math.floor(점[i][1] / 20000); let v = 칸.get(k); if (!v) { v = []; 칸.set(k, v) } v.push(i) }
        const 거리 = []
        for (let i = 0; i < 점.length; i += Math.max(1, Math.floor(점.length / 600))) {
          const [x, y] = 점[i], a = Math.floor(x / 20000), b = Math.floor(y / 20000)
          let d = Infinity
          for (let p = a - 1; p <= a + 1; p++) for (let q = b - 1; q <= b + 1; q++) for (const j of 칸.get(p + ',' + q) || []) if (j !== i) d = Math.min(d, Math.hypot(점[j][0] - x, 점[j][1] - y))
          if (Number.isFinite(d)) 거리.push(d)
        }
        거리.sort((p, q) => p - q)
        const d50 = 거리.length ? 거리[거리.length >> 1] : 10000
        const 최대변 = Math.min(80000, Math.max(25000, 6 * d50))
        let 삼 = []
        try {
          let 삼0 = 삼각망(점, 최대변)
          const 뺄 = 튀는점(점, 삼0)                 /* 🛣 G236 이웃 모두와 15 m 넘게 다른 점(높이 잘못 든 점)은 빼고 다시 이음 */
          if (뺄.size) { const 남 = 점.filter((_, i) => !뺄.has(i)); 점.length = 0; 점.push(...남); 삼0 = 삼각망(점, 최대변) }
          삼 = 가시떼기(점, 삼0)
        } catch (e) { 삼 = [] }       /* 🏭 G234 떨어진 점에 닿은 가시 세모 · 매달린 조각은 뗌 */
        if (삼.length >= 4) {
          const out = new Map(), 키 = '땅면· 측량 땅 면'
          const b = 새버킷(); b.tri = 새버킷().pos; b.trc = 새버킷().col
          const 변 = new Set()
          for (const t of 삼) {
            for (const k of t) { b.tri.push3(점[k][0], 점[k][1], 점[k][2]); b.trc.push3(170, 140, 95) }
            for (const [p, q] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
              const e = p < q ? p + ',' + q : q + ',' + p
              if (변.has(e)) continue
              변.add(e)
              b.pos.push6(점[p][0], 점[p][1], 점[p][2], 점[q][0], 점[q][1], 점[q][2]); b.col.push3(130, 105, 70); b.col.push3(130, 105, 70)
            }
          }
          out.set(키 + '\u0001측량 땅 면', b)
          땅높이 = 높이찾개(점, 삼)
          땅점 = 점; 땅삼 = 삼
          땅면 = { 점: 점.length, 삼각: 삼.length, 최대변: 최대변 / 1000, 출처: [...출처] }
          그룹.push({ 종류: '땅면', 파일: [...출처], 제목: `측량점 ${점.length}개 → 삼각형 ${삼.length}개`, out, 층들: [키], 켬: true, 무리: 0,
            자리: { how: '땅면', 점: 점.length, 삼각: 삼.length, 최대변: 최대변 / 1000 },
            설명: `측량점 ${점.length}개를 삼각형으로 이어 현황 땅 면(점 사이 ${(최대변 / 1000).toFixed(0)} m 넘는 곳은 안 이음)` })
        }
      }
    }
    /* 횡단 — 노선 위로(곧은 축 X = 측점 → 노선 곡선 · Y = 도면 오른쪽 → 진행 방향 오른쪽) */
    if (횡노선.length) {
      const 선것 = [], 곧은것 = []
      /* 🏭 G234 한 노선에 «이름이 꼭 맞는» 횡단이 있으면, 이름을 품기만 한 다른 횡단(«동쪽배수장 유수지» ⊃ «동쪽배수장»)은 그 노선에 안 얹음
           소장님 현장 E 07 유수지 횡단(7개)이 06 동쪽배수장 노선 위에 겹쳐 섰음 — 유수지는 제 평면 노선이 없어 물량만 */
      /* 🛣 G236 제목(«Ramp-B»)이 있는 파일의 제목 없는 단면은 어느 노선인지 몰라 곧게(이름 열쇠로 아무 노선에나 얹지 않음) */
      const 걸러 = 꼭맞음거르기(횡노선.map((h) => (h.제목없음 ? null : 노선고르기(h.열쇠, [h.r.시작, h.r.끝], h.노선글))))
      const 고른노선 = new Set()
      for (let hi = 0; hi < 횡노선.length; hi++) {
        const h = 횡노선[hi]
        const 고른 = 걸러[hi].고른
        if (걸러[hi].까닭) h.안얹음 = 걸러[hi].까닭
        if (!고른 && h.제목없음) h.안얹음 = '같은 파일의 다른 단면에는 노선 제목(열 위 큰 글자)이 있는데 이 단면에는 없어 어느 노선인지 모름'
        else if (!고른 && h.노선글 && [...노선들, ...갈래들].some((L) => L.이름글)) h.안얹음 = `평면도에 «${h.노선글}» 이름의 노선이 없음`
        if (!고른) { 곧은것.push(h); continue }
        const L = 고른.L
        if (고른.이름으로) {
          고른노선.add(L)
          if (!노선들.includes(L)) 노선들.push(L)
          if (!L.글맞음) { L.글맞음 = true; L.이름 = `${L.이름} · ${L.이름글}` }
        }
        /* 횡단 도면과 평면도의 측점 간격이 다르면(횡단은 더한 값으로 짐작 · 평면은 줄 길이로 앎) 평면 쪽으로 */
        const 짝 = h.r.단면.filter((s) => s.풀이).map((s) => [s.측, 측점m로(s.풀이, L.r.간격)]).sort((a, b) => a[0] - b[0])
        const 다름 = 짝.some(([a, b]) => Math.abs(a - b) > 1e-6)
        const 측바꿈 = 다름 ? (x) => {
          if (x <= 짝[0][0]) return x + 짝[0][1] - 짝[0][0]
          for (let i = 1; i < 짝.length; i++) if (x <= 짝[i][0]) { const [a0, b0] = 짝[i - 1], [a1, b1] = 짝[i]; return a1 - a0 > 1e-9 ? b0 + (b1 - b0) * (x - a0) / (a1 - a0) : b1 }
          return x + 짝[짝.length - 1][1] - 짝[짝.length - 1][0]
        } : null
        노선에얹기(h.r.out, L.r, 측바꿈)
        if (다름) for (const s of h.r.단면) { const v = 측바꿈(s.측); s.측 = v; s.이름 = s.글 + ' (' + v.toFixed(2).replace(/\.00$/, '') + ' m)' }
        const 밖 = h.r.단면.filter((s) => s.측 < L.r.범위[0] - L.r.간격 || s.측 > L.r.범위[1] + L.r.간격).length
        h.자리 = { how: '노선', 노선: L.이름, n: L.r.n, 근거: L.r.근거, 간격: L.r.간격, rms: L.r.rms, 어긋: L.r.어긋, 이름다름: 고른.k === 0, 밖, 무리: L.무리 }
        h.노선 = L
        선것.push(h)
      }
      const 노선표 = []
      const 그룹넣기 = (목록, 곧게) => {
        if (!목록.length) return
        const 모음 = new Map(), 층키 = []
        let 어긋 = 0
        for (const h of 목록) {
          if (곧게 && 어긋) 바꾸기(h.r.out, { a: 1, b: 0, tx: 0, ty: 어긋 })
          합치기(모음, h.r.out)
          for (const s of h.r.단면) 층키.push(s.층)
          /* 📐 (G139) 평균단면법 — 측점 사이 (앞 + 뒤) ÷ 2 × 거리 · 노선 위에 섰으면 측량 땅 면으로 잰 터파기(확인용) */
          const 토공 = 평균단면(h.r.단면)
          if (!곧게 && 땅높이 && h.노선) { try { 토공.땅면 = 땅면부피(h.r.단면, h.노선.r, 땅높이) } catch (e) { 토공.땅면 = null } }
          노선표.push({ 토공, 파일: h.파일, 단면: h.r.단면, 시작: Math.min(...h.r.단면.map((s) => s.측)), 끝: Math.max(...h.r.단면.map((s) => s.측)), 폭m: h.r.폭m, 빠짐: h.r.빠짐,
            어긋m: 곧게 ? 어긋 / 1000 : 0, 끌층: h.r.끌층, 박스: h.박스,
            자리: h.자리 || { how: '곧게', 까닭: h.안얹음 || (노선들.length ? `같은 이름(«${h.열쇠 || h.파일}»)의 평면 노선이 없음` : '측점(NO.) 글자와 중심선이 있는 평면도가 없음') } })
          if (곧게) 어긋 += (h.r.폭m + 20) * 1000
        }
        const 이름들 = 목록.map((h) => (h.자리 ? h.자리.노선 : h.파일))
        const 단면수 = 목록.reduce((n, h) => n + h.r.단면.length, 0)
        /* 🛣 G236 제목 있는 파일의 제목 없는 단면만 남은 묶음(어느 노선인지 모름)은 처음엔 꺼 둠 — 엉뚱한 자리에 선 단면처럼 보이지 않게 */
        const 끔 = 곧게 && 목록.every((h) => h.제목없음)
        그룹.push({ 종류: '횡단', 파일: [...new Set(목록.map((h) => h.파일))], 제목: 곧게 ? '' : '평면 노선 따라', out: 모음, 층들: 층키, 켬: !끔,
          끌층: 목록.flatMap((h) => h.r.끌층),
          무리: 곧게 ? null : 목록[0].자리.무리,
          자리: 곧게 ? { how: '곧게', 까닭: 노선들.length ? '같은 이름의 평면 노선이 없음' : '측점(NO.) 글자와 중심선이 있는 평면도가 없음' }
            : { how: '노선', 노선: [...new Set(이름들)].join(' · '), n: 목록.reduce((n, h) => n + h.자리.n, 0), 근거: 목록.some((h) => h.자리.근거 === '측점 글자') ? '측점 글자' : '중심선', 노선수: 목록.length },
          설명: 끔 ? `단면 ${단면수}개 — 노선 제목이 없어 어느 노선인지 몰라 곧게 펴 옆에 둠 · 처음엔 꺼 둠`
            : 곧게 ? `노선 ${목록.length}개 · 단면 ${단면수}개 — 측점·지반고로 높이를 맞춤 · 평면 노선을 못 찾아 곧게 펴 옆에 둠`
            : `노선 ${목록.length}개 · 단면 ${단면수}개 — 평면도 측점 자리에 노선과 직각으로 세움` })
      }
      /* 🛣 G236 횡단을 얹은 노선과 이름이 같은 다른 벌(다른 평면도에 같은 선 · 같은 평면 안 사본)은 노선 목록에서 뺌 — 같은 램프가 3D 에 여러 번 그려지지 않게.
           뺀 것이 그 평면도의 첫째 노선이면 얹은 쪽이 그 평면 이름(열쇠)도 이어받음(그 평면의 종단이 찾아오게) */
      for (const C of 고른노선) {
        for (let i = 노선들.length - 1; i >= 0; i--) {
          const T = 노선들[i]
          if (T === C || 고른노선.has(T) || !T.이름글 || 노선글같음(T.이름글, C.이름글) !== 2) continue
          if (!T.갈래) { C.갈래 = false; if (T.열쇠 !== C.열쇠) (C.딴열쇠 || (C.딴열쇠 = [])).push(T.열쇠) }
          노선들.splice(i, 1)
        }
      }
      그룹넣기(선것, false)
      그룹넣기(곧은것, true)
      횡단 = { 노선: 노선표, 안씀: [] }
    }
    /* 종단 — 표가 있는 종단(종평의 종단·표 칸 포함)을 노선별로 모아 노선 위 지반선 · 계획선 */
    const 종단모음 = []                                   /* 🧰 G224 3D 활용(도면 검사 · 측설표) */
    {
      const 노선별 = new Map()
      for (const g of 그룹) {
        if (!g.종단표 || !g.종단표.줄.length) continue
        const 고른 = 노선고르기(g.노선열쇠, [g.종단표.줄[0].m, g.종단표.줄[g.종단표.줄.length - 1].m])
        if (!고른) { g.종단자리 = { how: '못', 까닭: '같은 이름의 평면 노선이 없음' }; continue }
        let a = 노선별.get(고른.L); if (!a) { a = []; 노선별.set(고른.L, a) }
        a.push(g)
      }
      let k = 0
      for (const [L, gs] of 노선별) {
        const 줄 = gs.flatMap((g) => g.종단표.줄).sort((a, b) => a.m - b.m).filter((r, i, arr) => i === 0 || Math.abs(r.m - arr[i - 1].m) > 1e-6)
        종단모음.push({ 노선: L.이름, 줄: 줄.map((r) => ({ m: r.m, 글: r.글, 지반고: r.지반고, 계획고: r.계획고 })), 파일: [...new Set(gs.flatMap((g) => g.파일))] })
        const 키 = `노선${++k}· ${L.이름}`
        const out = 종단선(줄, L.r, 새버킷, 키)
        if (!out.size) continue
        for (const g of gs) g.종단자리 = { how: '노선', 노선: L.이름, 줄: g.종단표.줄.length }
        /* 횡단 지반고와 종단 지반고가 같은 측점에서 얼마나 맞는지(확인용) */
        let 확인 = null
        if (횡단) {
          const 차 = []
          for (const t of 횡단.노선) if (t.자리 && t.자리.how === '노선' && t.자리.노선 === L.이름) for (const s of t.단면) {
            const r = 줄.find((q) => Math.abs(q.m - s.측) < 0.05)
            if (r && r.지반고 != null && Number.isFinite(s.지반고)) 차.push(Math.abs(r.지반고 - s.지반고))
          }
          if (차.length) { 차.sort((a, b) => a - b); 확인 = { n: 차.length, 가운데: 차[차.length >> 1], 큰: 차[차.length - 1] } }
          for (const t of 횡단.노선) if (확인 && t.자리 && t.자리.노선 === L.이름) t.자리.종단확인 = 확인
        }
        그룹.push({ 종류: '노선', 파일: [...new Set(gs.flatMap((g) => g.파일))], 제목: `${L.이름} — 종단 높이`, out, 층들: [키], 켬: true, 무리: L.무리,
          자리: { how: '노선', 노선: L.이름, n: L.r.n, 근거: L.r.근거, 줄: 줄.length, 확인 },
          설명: `종단 표 ${줄.length}줄(측점 ${줄[0].m.toFixed(0)} ~ ${줄[줄.length - 1].m.toFixed(0)} m) → 노선 위 지반선(갈색) · 계획선(파랑)` })
      }
    }
    for (const g of 그룹) if ((g.종류 === '횡단' || g.종류 === '노선' || g.종류 === '땅면') && !g.표본) { g.표본 = 표본(g.out); g.상자 = 상자(g.표본) }
    const 노선요약 = 노선들.map((L) => ({ 이름: L.이름, 근거: L.r.근거, 층: L.r.층, 간격: L.r.간격, n: L.r.n, 모두: L.r.모두, rms: L.r.rms, 어긋: L.r.어긋, 범위: L.r.범위, 토막: L.r.토막, ...(L.이름글 ? { 이름글: L.이름글, 갈래: !!L.갈래, 줄범위: L.r.줄범위 } : {}), 평면: L.평면.map((g) => g.제목 || g.파일[0]) }))

    /* 🧱 구조물 콘크리트 면 — 평면 바깥(발자국)으로 바닥판(가장 낮은 EL) · 바깥 벽(→ G.L). «면» 단추로 보임
       🩹 G212 — 전에는 측량 도면에 겹친(돌린) «뒤에» 칸으로 채워 벽이 계단처럼 깨졌습니다(펌프장 25.9° 돌림).
          이제 도면 그대로(가로 · 세로 바른 자리)에서 만들고, 겹칠 때 같이 돌립니다(콘크리트 층은 겹치기 틀에서 뺌). */
    const 구조면들 = [], 구조표 = '\u0002구조표'
    for (const g of 그룹) {
      if (g.종류 !== '구조' || !g.구조r) continue
      const 평선 = 누운선(g.out, { 골라: (키, ly) => 키 === g.층들[0] && !꺼진.get(ly) && !/기계|machine|mech|pump|펌프|배관|pipe|전기|elec/i.test(ly) })
      const 낮 = g.구조r.단면.slice(1).map((d) => d.EL && d.EL[0]).filter((v) => Number.isFinite(v)).sort((p, q) => p - q)
      if (!낮.length) continue
      /* 가장 낮은 EL 은 말뚝 · 기초 아래까지 내려간 선일 수 있어 단면들의 «가운데» 아래값을 씀 */
      const 아래 = 낮[Math.floor(낮.length / 2)] * 1000, 위 = g.구조r.평면EL * 1000
      let c = null
      try { c = 콘크리트면(평선, 아래, 위) } catch (e) { c = null }
      if (!c || !c.tri.length) continue
      /* 🧊 G225 BIM 물량 — 평면 겹선으로 «벽 모양» · «바닥 모양»(lib/구조물면.js) · 자리 표(점 셋)를 같이 넣어 겹치기 · 옮기기를 따라가게 */
      try {
        const 벽선 = 누운선(g.out, { 골라: (키, ly) => 키 === g.층들[0] && !꺼진.get(ly) && /구조|콘크리트|conc|wall|벽|토목|str|옹벽|box|박스/i.test(ly) && !/철근|bar|rebar|지시|치수|dim|기계|mech|pump|펌프|배관|pipe|전기|text|글/i.test(ly) })
        /* 📐 G234 평면 자르는 선에 세운 단면의 벽 면 높이 점 → 높이별 벽 · 바닥(구조물면) */
        const 높이 = g.구조r.단면.slice(1).flatMap((d) => d.높이점 || [])
        const 면 = 구조물면(평선, 벽선.length >= 64 ? 벽선 : null, 높이.length >= 2 ? { 높이 } : {})
        if (면 && 면.바닥.length) {
          const 첫 = 면.바닥[0]
          const cx = 첫.reduce((a, q) => a + q[0], 0) / 첫.length, cy = 첫.reduce((a, q) => a + q[1], 0) / 첫.length
          const id = 구조면들.length
          구조면들.push({ g, 면, 아래: 아래 / 1000, 위: 위 / 1000, 기준: [cx, cy], T: null })
          const 표 = 새버킷(), zz = (id + 1) * 1e6
          표.pts.push3(cx, cy, zz); 표.pts.push3(cx + 1000, cy, zz); 표.pts.push3(cx, cy + 1000, zz)
          for (let k = 0; k < 3; k++) 표.pcol.push3(0, 0, 0)
          g.out.set(g.층들[0] + '\u0001' + 구조표, 표)
        }
      } catch (e) { /* 없어도 됨 */ }
      const b = 새버킷(); b.tri = 새버킷().pos; b.trc = 새버킷().col
      for (let i = 0; i < c.tri.length; i += 3) { b.tri.push3(c.tri[i], c.tri[i + 1], c.tri[i + 2]); b.trc.push3(168, 168, 162) }
      for (let i = 0; i < c.선.length; i += 6) { b.pos.push6(c.선[i], c.선[i + 1], c.선[i + 2], c.선[i + 3], c.선[i + 4], c.선[i + 5]); b.col.push3(150, 150, 145); b.col.push3(150, 150, 145) }
      g.out.set(g.층들[0] + '\u0001콘크리트', b)
      g.콘크리트 = { 넓이: c.넓이, 둘레: c.둘레 || 0, 아래: 아래 / 1000, 위: 위 / 1000 }
    }

    /* ⑦¾ 🧲 (G209) 모양으로 겹치기 — 건물 · 구조물 · 글자로 못 맞춘 평면(파일배치도 · 기계 평면)을
          기준 무리(측량도면 · 자리 맞춘 계획평면도)에 그려진 «같은 모양» 자리에 겹칩니다(lib/겹치기3d.js).
          전에는 이 묶음들이 기준 오른쪽에 나란히 놓였습니다(실제 자리와 무관). 못 찾으면 그대로 옆(📍 두 점 찍기). */
    self.postMessage({ type: 'prog', p: 0.915, msg: '건물 · 구조물을 측량 도면의 같은 모양 자리에 겹치는 중' })
    const 겹시작 = Date.now()
    /* 🧭 G246 모양 찾기 마감은 «한 일의 양»(겹치기3d 일셈) — 시계로 끊으면 같은 도면도 돌릴 때마다 답이 달랐음.
         한도는 이 기계에서 예전 시간(한 장 7 · 6 초 · 모두 18 · 25 초)의 1.5 배쯤 */
    const 일0 = 일셈.n, 일 = () => 일셈.n - 일0
    const 배 = globalThis.__일배 || 1        /* 시험용(노드) — 한도 몇 배 */
    const 한도1 = 68e6 * 배, 한도2 = 94e6 * 배, 한장1 = 26e6 * 배, 한장2 = 22e6 * 배
    const 겹친 = []
    {
      const 보이는층 = (키, ly) => !꺼진.get(ly)
      const 바탕그룹 = 그룹.filter((g) => g.무리 === 0 && g.평면 && !g.성과표 && g.종류 !== '밖')
      const 바탕선 = []
      const 더하기 = (L) => { for (let i = 0; i < L.length; i++) 바탕선.push(L[i]) }
      for (const g of 바탕그룹) 더하기(누운선(g.out, { 골라: 보이는층 }))
      /* 🧭 G240 순서 4 — 건물을 먼저 «통심» 으로: 자리 맞춘 판(기준 무리) 가운데 통심(X1 · Y1)이 같은 판에 돌림 · 옮김 그대로(남는 차 0.3 m 안 · 넷 넘게)
           소장님 현장 C · D 식당: 토목 통합본엔 판 이름 글자가 없어 모양 · 글자로는 못 놓았지만 배치 판에 X1 ~ X10 · Y1 ~ Y6 이 있음 */
      {
        const I = { a: 1, b: 0, tx: 0, ty: 0 }, 옮T = (T, e) => [T.a * e[0] - T.b * e[1] + T.tx, T.b * e[0] + T.a * e[1] + T.ty, T.a * e[2] - T.b * e[3] + T.tx, T.b * e[2] + T.a * e[3] + T.ty]
        const 판들 = 그룹.filter((h) => h.무리 === 0 && h.통심 && h.통심.length >= 4 && h.종류 !== '건물')
        for (const g of 그룹.filter((h) => h.종류 === '건물' && h.무리 == null && h.통심 && h.통심.length >= 4)) {
          const T0 = g.out.__T || I
          const 건 = g.통심.map((q) => ({ 글: q.글, 끝: 옮T(T0, q.끝) }))
          let 최 = null
          for (const h of 판들) {
            const Th = h.out.__T || I
            const 판 = h.통심.map((q) => ({ 글: q.글, 끝: 옮T(Th, q.끝) }))
            let r = null
            try { r = 통심겹치기(건, 판) } catch (e) { r = null }
            if (!r || r.최대 > 300 || r.줄수 < 4) continue
            if (!최 || r.줄수 > 최.r.줄수 || (r.줄수 === 최.r.줄수 && r.최대 < 최.r.최대)) 최 = { r, h }
          }
          if (!최) continue
          const c = Math.cos(최.r.θ), sn = Math.sin(최.r.θ)
          바꾸기(g.out, { a: c, b: sn, tx: 최.r.tx, ty: 최.r.ty })
          g.무리 = 0
          g.자리 = { how: '통심', 판: 최.h.제목 || 최.h.파일[0], 줄수: 최.r.줄수, 최대: Math.round(최.r.최대), 글들: 최.r.글들.slice(0, 8), 회전: Math.round(최.r.θ * 180 / Math.PI * 10) / 10 }
          g.표본 = 표본(g.out); g.상자 = 상자(g.표본)
          const 낮 = g.층들.map((k) => ({ k, z: 바닥높이(g.out, (키) => 키 === k) })).filter((q) => q.z != null).sort((a, b) => a.z - b.z)[0]
          g.틀z = 낮 ? 낮.z : 0
          겹친.push(g)
        }
      }
      const 할것 = 그룹.filter((g) => g.무리 == null && (g.종류 === '구조' && g.구조r || g.종류 === '건물' || (g.종류 === '평면' && g.자리 && g.자리.how === '옆')))
      /* 차례: 구조물(큰 것부터) → 건물 → 평면(파일배치도는 놓인 구조물 선도 바탕으로 씀) */
      const 차 = (g) => (g.종류 === '구조' ? 0 : g.종류 === '건물' ? 1 : 2)
      할것.sort((p, q) => 차(p) - 차(q))
      /* 묶음마다 «바닥에 누운 평면 선» 만 틀로 */
      const 틀뽑기 = (g) => {
        if (g.종류 === '구조') return { 선: 누운선(g.out, { 골라: (키, ly) => 키 === g.층들[0] && 보이는층(키, ly) }), z: g.구조r.평면EL * 1000 }
        if (g.종류 === '건물') {
          let 낮 = null, 낮z = Infinity
          for (const k of g.층들) { const z = 바닥높이(g.out, (키) => 키 === k); if (z != null && z < 낮z) { 낮z = z; 낮 = k } }
          if (낮 == null) return null
          return { 선: 누운선(g.out, { 골라: (키, ly) => 키 === 낮 && 보이는층(키, ly), z: 낮z, 창: 300 }), z: 낮z, 층: 낮 }
        }
        return { 선: 누운선(g.out, { 골라: 보이는층 }), z: null }
      }
      let B = null
      for (const g of 할것) {
        if (바탕선.length < 400) break
        /* 한 번에 너무 오래 붙잡지 않게 — 25초가 넘으면 남은 것은 옆에 둠(📍 두 점 찍기) */
        if (일() > 한도1) { g.모양못 = '시간이 오래 걸려 모양 찾기를 건너뜀'; continue }
        const t = 틀뽑기(g)
        if (!t || t.선.length < 120) continue
        /* 🖼 G212 평면 묶음이 수백 m 로 퍼져 있으면(종이 여러 장 · 그림 여러 개) 통째로 견주지 않고 아래 «그림 하나씩» 에서 */
        if (g.종류 === '평면') {
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
          for (let i = 0; i < t.선.length; i += 2) { x0 = Math.min(x0, t.선[i]); x1 = Math.max(x1, t.선[i]); y0 = Math.min(y0, t.선[i + 1]); y1 = Math.max(y1, t.선[i + 1]) }
          if (Math.max(x1 - x0, y1 - y0) > 800000) { g.넓게퍼짐 = true; continue }
        }
        if (!B) B = 바탕만들기(바탕선)
        /* 구조물 · 건물이 먼저 놓였으면 그 둘레(10 m)를 «근처» 로 — 평면(기계 평면도 등)이 그 안에서 맞으면 바깥의 비슷한 자리와 견주지 않음 */
        const 근처 = g.종류 === '평면' ? 겹친.filter((h) => h.종류 !== '평면' && h.상자).map((h) => [h.상자[0] - 10000, h.상자[1] - 10000, h.상자[2] + 10000, h.상자[3] + 10000]) : null
        let r = null
        /* 🏢 G228 건물 — 배치도에 이 건물 방 이름이 둘 넘게 모인 곳이 있으면 그 둘레에서 먼저(비슷한 네모가 여럿인 계획평면도에서 «두 곳 넘게» 로 못 놓던 것) */
        if (g.종류 === '건물' && g.방글 && g.방글.size >= 2) {
          const 방 = 방자리(g.방글, 바탕그룹, t.선)
          if (방.네모.length) {
            try { r = 모양맞추기(t.선, B, { 문턱: 0.45, 근처: 방.네모, 근처문턱: 0.45, 영역: 방.네모, 방점: 방.점들, 마감: Math.min(일0 + 한도1, 일셈.n + 한장1) }) } catch (e) { r = null }
            if (globalThis.__방디버그) console.log('방 자리', 방.점들.length, '→', r && { 됨: r.됨, 까닭: r.까닭, 몫: r.몫, 둘째: r.둘째 })
            if (r && r.됨) r.방이름 = true
            else r = null
          }
        }
        if (!r) try { r = 모양맞추기(t.선, B, { 문턱: 0.5, 근처: 근처 && 근처.length ? 근처 : null, 마감: Math.min(일0 + 한도1, 일셈.n + 한장1) }) } catch (e) { r = null }
        if (!r) continue
        if (!r.됨) { g.모양못 = r.까닭; if (g.자리 && g.자리.how === '옆') g.자리.까닭 = `같은 글자도, 같은 모양도 못 찾음 — ${r.까닭}`; continue }
        바꾸기(g.out, r.T)
        g.무리 = 0
        g.켬 = true
        g.자리 = { how: '모양', 몫: r.몫, 앞: r.맞음비, 뒤: r.거꾸로, 회전: r.회전, 방법: r.방법, 근처: r.근처, 방이름: !!r.방이름 }
        g.표본 = 표본(g.out); g.상자 = 상자(g.표본)
        겹친.push(g)
        g.틀z = t.z
      }
      /* 🏢 건물 높이 — 놓인 구조물 위면 그 G.L, 아니면 측량 땅 면 높이(건물 도면의 ±0 을 그 높이에) */
      for (const g of 겹친) {
        if (g.종류 !== '건물') continue
        const [x0, y0, x1, y1] = g.상자, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
        let dz = null, 근거 = ''
        for (const h of 겹친) if (h.종류 === '구조' && h.상자 && cx > h.상자[0] && cx < h.상자[2] && cy > h.상자[1] && cy < h.상자[3]) { dz = h.구조r.평면EL * 1000; 근거 = `구조물 «${h.파일[0].replace(/\.dxf$/i, '')}» G.L ${h.구조r.평면EL.toFixed(2)} m` }
        if (dz == null && 땅높이) { const z = 땅높이(cx, cy); if (Number.isFinite(z)) { dz = Math.round(z / 10) * 10; 근거 = `측량 땅 면 ${(z / 1000).toFixed(2)} m` } }
        if (dz == null) { g.자리.높이 = '높이 기준을 못 찾아 도면 ±0 그대로'; continue }
        for (const [, b] of g.out) for (const arr of [b.pos, b.pts, b.tri]) { if (!arr) continue; for (let i = 2; i < arr.n; i += 3) arr.a[i] += dz }
        g.자리.높이 = `G.L ±0 → ${근거}`
      }

      /* 🖼 G212 그림 하나씩 — 종이 한 장(박스) · 도면 통째에 평면도 · 단면도 · 표가 같이 그려진 것은 «떨어진 그림» 으로 나눠
            평면 그림만 측량 도면의 같은 모양 자리에 겹칩니다(나머지는 옆 그대로 · lib/그림나누기3d.js).
            엉뚱한 자리에 붙지 않게: 단면 · 상세 · 표 이름이 붙은 그림은 안 봄 · 이름 없는 그림은 문턱 60% · 비슷한 자리와 10% 넘게 앞서야 ·
            한 종이에서 놓인 그림들은 돌림이 같아야(3°) — 다르면 더 잘 맞은 것만 */
      const 그림할것 = 그룹.filter((g) => g.무리 == null && g.out && g.상자 && !g.성과표 && !g.그림 && !g.끼움뗌 &&
        (['평면', '종평', '기타', '상세'].includes(g.종류) || (g.종류 === '밖' && g.자리 && g.자리.how === '옆')))
      const 새그룹 = []
      const 디 = globalThis.__겹치기디버그 ? console.log : () => {}
      /* 찾을 곳 — 측량 도면이 넓으면(시 · 군 전체 xref) 이 공사 자리(글자 · 좌표로 놓인 계획 도면 둘레 1 km)에서만.
         현장 C 측량 xref(선 103만 개)에서 종평면도 그림 하나가 8초를 넘겨 못 찾았습니다 */
      let 영역 = null
      {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
        for (const h of 그룹) {
          if (h.무리 !== 0 || !h.상자 || h.기준 || h.성과표 || h.종류 === '측량' || h.종류 === '땅면' || h.그림) continue
          if (!h.자리 || !['글자', '좌표', '모양'].includes(h.자리.how)) continue
          x0 = Math.min(x0, h.상자[0]); y0 = Math.min(y0, h.상자[1]); x1 = Math.max(x1, h.상자[2]); y1 = Math.max(y1, h.상자[3])
        }
        const 기 = 그룹.find((h) => h.기준 && h.상자)
        if (!Number.isFinite(x0) && 기) { x0 = 기.상자[0]; y0 = 기.상자[1]; x1 = 기.상자[2]; y1 = 기.상자[3] }
        if (Number.isFinite(x0)) {
          const 여 = 1e6
          const r = [x0 - 여, y0 - 여, x1 + 여, y1 + 여]
          /* 기준이 이 영역보다 훨씬 넓을 때만 좁힘(보통 측량 도면은 그대로 다 봄) */
          if (기 && (기.상자[2] - 기.상자[0]) * (기.상자[3] - 기.상자[1]) > 4 * (r[2] - r[0]) * (r[3] - r[1])) 영역 = [r]
        }
      }
      /* ① 묶음마다 그림 나누기 → 후보(묶음, 그림, 이름) 를 모두 모은 뒤 ② «평면도» 라고 적힌 그림부터 · 큰 것부터 견줌
            (배근도 · 상세도 종이가 수십 장이어도 평면 그림이 시간 안에 먼저 보이게) */
      const 후보들 = []
      const 너비 = (p) => Math.max(p.상자[2] - p.상자[0], p.상자[3] - p.상자[1])
      for (const g of 그림할것) {
        if (바탕선.length < 400 || 일() > 한도2) break
        /* 배근 · 철근 · 표준 · 단면 종이는 «평면도» 라고 적힌 그림만 */
        const 상세종이 = g.종류 === '상세' || /배근|철근|조립|표준|단면|입면/.test(g.제목 || '')
        let 나눔 = null
        try { 나눔 = 그림나누기(g.out, { 골라: 보이는층 }) } catch (e) { 나눔 = null }
        if (!나눔) continue
        const 후 = 나눔.그림.filter((p) => p.선 >= 150 && 너비(p) >= 3000 && 너비(p) <= 800000)
        디('🖼', g.종류, g.파일[0], g.제목, '그림', 나눔.그림.length, '후보', 후.length, 후.slice(0, 6).map((p) => `${p.선}선 ${Math.round(너비(p) / 1000)}m`).join(' | '), Date.now() - 겹시작)
        if (!후.length) continue
        /* 그림이 하나뿐이고 통째로 이미 견줘 본 평면이면 다시 안 함 */
        if (나눔.그림.length === 1 && g.종류 === '평면' && !g.넓게퍼짐) continue
        for (const p of 후.slice(0, 6)) {
          const 이 = 그림이름(g.글자 || [], p.상자, g.제목)
          if (이.꼴 === '아님') continue
          if (상세종이 && 이.꼴 !== '평면') continue
          후보들.push({ g, 나눔, p, 이, 차: (이.꼴 === '평면' ? 0 : 1) })
        }
      }
      후보들.sort((a, b) => a.차 - b.차 || b.p.길이 - a.p.길이)
      const 전선들 = new Map()
      const 돌림들 = new Map()     /* 한 종이(묶음)에서 놓인 그림의 돌림 */
      const 뗀수 = new Map()
      for (const c of 후보들) {
        if (일() > 한도2) break
        const { g, 나눔, p, 이 } = c
        if (!전선들.has(g)) 전선들.set(g, 누운선(g.out, { 골라: 보이는층 }))
        const 전선 = 전선들.get(g)
        const 틀 = []
        for (let i = 0; i < 전선.length; i += 4) if (나눔.어디((전선[i] + 전선[i + 2]) / 2, (전선[i + 1] + 전선[i + 3]) / 2) === p.id) 틀.push(전선[i], 전선[i + 1], 전선[i + 2], 전선[i + 3])
        if (틀.length / 4 < 120 || 표같음(틀)) continue
        if (!B) B = 바탕만들기(바탕선)
        let r = null
        try { r = 모양맞추기(틀, B, { 문턱: 이.꼴 === '평면' ? 0.55 : 0.6, 둘째틈: 0.1, 영역, 마감: Math.min(일0 + 한도2, 일셈.n + 한장2) }) } catch (e) { r = null }
        디('   그림', g.제목, p.id, 이.꼴, 이.이름, 틀.length / 4, r && (r.됨 ? '됨' : r.까닭), r && r.몫 != null && r.몫.toFixed(2), Date.now() - 겹시작)
        if (!r || !r.됨) continue
        const 돌림 = 돌림들.get(g)
        if (돌림 != null && Math.abs(((r.회전 - 돌림 + 540) % 360) - 180) > 3) continue
        if (돌림 == null) 돌림들.set(g, r.회전)
        const k = (뗀수.get(g) || 0) + 1
        뗀수.set(g, k)
        const 키 = `${g.층들[0]}·그림${k}`
        const out = 그림떼기(g.out, 나눔.어디, p.id, () => 키, 새버킷)
        바꾸기(out, r.T)
        const 원 = (g.제목 && g.제목 !== '도곽 밖' ? g.제목 : '') || g.파일[0].replace(/\.dxf$/i, '')
        const h = { 종류: '평면', 파일: g.파일, 제목: 이.이름 || `${원} — 그림 ${k}`, out, 층들: [키], 켬: true, 평면: true, 무리: 0, 그림: true, 이름: 이.이름 || 원,
          자리: { how: '모양', 몫: r.몫, 앞: r.맞음비, 뒤: r.거꾸로, 회전: r.회전, 방법: r.방법, 그림: 원 } }
        h.표본 = 표본(out); h.상자 = 상자(h.표본)
        새그룹.push(h)
        g.그림뗌 = (g.그림뗌 || 0) + 1
      }
      for (const g of 뗀수.keys()) { g.표본 = 표본(g.out); g.상자 = 상자(g.표본) }
      for (const h of 새그룹) 그룹.push(h)
    }
    if (globalThis.__겹치기디버그 != null) console.log('겹치기 걸림', Date.now() - 겹시작, 'ms')
    /* ⑧ 📐 나머지 자리 — 기준 무리는 제자리. 나머지(건물·횡단·구조·종단·상세·못 맞춘 평면)는 그 오른쪽에 나란히(사이 20 m 넘게) */
    const 첫무리 = 무리들.length ? 무리들[0].들.filter((g) => g.켬 || g === 무리들[0].머리) : []
    const 바탕 = 첫무리.length ? 첫무리 : []
    let 오른 = -Infinity, 아래 = Infinity, 폭 = 0
    for (const g of 무리들.flatMap((q) => q.들)) {
      if (!g.상자 || (g.성과표 && !g.켬)) continue
      오른 = Math.max(오른, g.상자[2]); 아래 = Math.min(아래, g.상자[1]); 폭 = Math.max(폭, g.상자[2] - g.상자[0])
    }
    for (const q of 무리들.slice(1)) {        // 두 번째 무리(성과표와 안 이어진 도면들)는 그대로 두고, 성과표 점만 꺼 둠
      for (const g of q.들) if (g.상자) { 오른 = Math.max(오른, g.상자[2]); 아래 = Math.min(아래, g.상자[1]) }
    }
    const 나머지 = 그룹.filter((g) => g.무리 == null && g.상자)
    /* 큰 덩어리 · 떨어진 도면은 맨 끝에 — 다른 묶음 자리·틈을 밀어내지 않게 */
    나머지.sort((a, b) => Number(a.종류 === '밖') - Number(b.종류 === '밖'))
    if (!Number.isFinite(오른) && 나머지.length) {
      const g0 = 나머지.shift(); g0.기준 = true; g0.옮김 = [0, 0]; g0.자리 = g0.자리 || { how: '기준' }
      오른 = g0.상자[2]; 아래 = g0.상자[1]; 폭 = g0.상자[2] - g0.상자[0]
    }
    for (const g of 나머지) {
      if (g.종류 === '밖' && g.표본.xs.length) { const r = 무더기상자(g.표본.xs, g.표본.ys, g.표본.ws); g.상자 = [r[0], r[1], r[3], r[4]] }
      const 틈 = Math.max(20000, 0.05 * 폭)
      const dx = 오른 + 틈 - g.상자[0], dy = 아래 - g.상자[1]
      옮기기(g.out, dx, dy)
      g.옮김 = [dx, dy]
      g.상자 = [g.상자[0] + dx, g.상자[1] + dy, g.상자[2] + dx, g.상자[3] + dy]
      오른 = g.상자[2]
      폭 = Math.max(폭, g.상자[2] - g.상자[0])
    }
    void 바탕

    /* 설명 글 */
    const 종이름 = { 측량: '측량도면', 평면: '평면도', 종평: '종평면도의 평면 칸', 밖: '도곽 밖 그림', 측량점: '측량성과표', 종단: '종단면도', 상세: '상세·표준도', 표: '표·목록', 기타: '도면', 건축: '건축 도면' }
    for (const g of 그룹) {
      if (g.종류 === '건물' || g.종류 === '구조') {
        const z = g.자리 || {}
        if (z.how === '통심') g.설명 += ` · «${z.판}» 판에 통심 ${z.글들.join(' · ')}(${z.줄수}줄 · 남는 차 ${z.최대} mm${Math.abs(z.회전) > 0.05 ? ` · 돌림 ${z.회전}°` : ''})으로 겹침`
        else if (z.how === '모양') g.설명 += ` · 측량 도면의 같은 모양 자리에 겹침(${Math.round(z.몫 * 100)}%)`
        else if (g.모양못) { g.설명 += ` · 옆에 둠 — ${g.모양못}`; g.자리 = { how: '옆', 까닭: g.모양못 } }
        if (g.콘크리트) g.설명 += ` · 콘크리트 바닥 ${Math.round(g.콘크리트.넓이)} ㎡ (EL ${g.콘크리트.아래.toFixed(2)} ~ ${g.콘크리트.위.toFixed(2)} m)`
        continue
      }
      if (g.종류 === '횡단' || g.종류 === '노선' || g.종류 === '땅면') continue
      const z = g.자리 || {}
      if (z.기준밖) { g.설명 = '캐드 모형 공간에서 측량 그림 밖에 있는 부분(위치도 · 범례 · 다른 종이) — 같은 도면과 함께 놓음 · 처음엔 꺼 둠'; continue }
      if (z.how === '기준') g.설명 = z.안이어짐 ? '측량 좌표(기준) — 같은 이름을 가진 도면이 없어 도면과 아직 안 이어짐 · 처음엔 꺼 둠'
        : z.둘째 ? '도면끼리의 기준(측량성과표와는 아직 안 이어짐)' : g.성과표 ? '측량 좌표 — 모든 자리의 기준' : g.종류 === '측량' ? '측량도면 — 모든 자리의 기준' : `${종이름[g.종류] || '도면'} — 자리의 기준(측량 자료 없음)`
      else if (z.how === '글자') g.설명 = `같은 글자 ${z.n}쌍으로 맞춤 · 평균 오차 ${z.rms.toFixed(2)} m · 돌림 ${z.회전.toFixed(2)}°${z.단위배 ? ` · 도면 단위를 바로잡음(×${z.단위배})` : Math.abs(z.축척 - 1) > 0.01 ? ` · 축척 ×${z.축척.toFixed(3)}` : ''}`
      else if (z.how === '끼움') g.설명 = `${z.그림 ? `«${z.그림}» 안의 그림 — ` : ''}캐드에서 xref 를 끼운 자리 그대로 겹침${z.길 && z.길.length ? ` (${z.길[z.길.length - 1]})` : ''}${Math.abs(z.회전 || 0) > 0.01 ? ` · 돌림 ${z.회전.toFixed(2)}°` : ''}`
      else if (z.how === '좌표') g.설명 = z.같은좌표계 ? '기준과 같은 측량 좌표로 그린 도면 — 그대로 둠(기준 범위 밖까지 뻗음)' : '좌표가 기준과 같은 자리 — 그대로 둠'
      else if (z.how === '모양') g.설명 = `${z.그림 ? `«${z.그림}» 안의 그림 — ` : ''}측량 도면의 같은 모양 자리에 겹침(${Math.round(z.몫 * 100)}% · 돌림 ${z.회전.toFixed(2)}°)`
      else if (z.how === '옆') g.설명 = `자리를 못 찾아 옆에 둠 — ${z.까닭} · 📍 두 점 찍기로 맞추세요`
      if (g.내용종류 === '통심' && g.설명) g.설명 += ' · 판 이름 글자가 없어 안에 든 통심(X · Y)으로 평면이라 봄'
      else if (g.종류 === '종단') g.설명 = g.종단자리 && g.종단자리.how === '노선' ? `종단 표 ${g.종단자리.줄}줄을 읽어 노선 «${g.종단자리.노선}» 위 지반선·계획선으로 세움 · 이 도면 그림은 처음엔 꺼 둠`
        : g.종단표 ? `종단 표 ${g.종단표.줄.length}줄을 읽었지만 ${g.종단자리 ? g.종단자리.까닭 : '평면 노선을 못 찾음'} · 처음엔 꺼 둠` : '높이 자료(측점·지반고·계획고) — 표를 못 읽음 · 처음엔 꺼 둠'
      else if (g.종류 === '횡단못') g.설명 = '횡단면도 — 이 꼴의 측점·지반고 표(오른쪽 표 · «S T A .»)는 아직 못 읽어 그대로 둠 · 다음 차례에 읽게 함 · 처음엔 꺼 둠'
      else if (g.종류 === '밖' && !g.무리) g.설명 = '도곽 밖 그림(꺼 둔 수치지도 등) — 자리를 몰라 옆에 둠 · 처음엔 꺼 둠'
      else g.설명 = `${종이름[g.종류] || '도면'} — 옆에 둠 · 처음엔 꺼 둠`
      if (g.그림뗌) g.설명 += ` · 이 안의 평면 그림 ${g.그림뗌}개는 측량 도면에 겹침`
    }

    /* 꼭 필요한 자료 — 화면 맨 위 «꼭 넣을 것» 표에 씁니다 */
    const 측량도면 = 그룹.find((g) => g.종류 === '측량')
    const 계획 = 그룹.find((g) => g.평면 && !g.성과표 && g.종류 !== '측량' && g.종류 !== '밖' && !g.그림 && 이름에(g, /계획평면|평면도|배치도|계획도/)) || 그룹.find((g) => g.종류 === '평면' && !g.그림)
    const 이어진 = (g) => g && g.무리 === 0 && 무리들[0] && 무리들[0].머리 && (무리들[0].머리.성과표 || 무리들[0].머리.종류 === '측량')
    const 필요 = {
      측량: 성과 ? { 있음: true, 종류: '성과표', 이름: 측량점.파일, 점: 측량점.n, 이어짐: !!(기준g && 기준g.성과표 && !기준g.자리.안이어짐) }
        : 측량도면 ? { 있음: true, 종류: '측량도면', 이름: 측량도면.파일[0], 이어짐: true } : { 있음: false },
      평면: 계획 ? { 있음: true, 이름: 계획.이름, 이어짐: !!이어진(계획), 자리: (계획.자리 || {}).how } : { 있음: false },
      높이: !!(그룹.some((g) => g.종류 === "횡단") || 그룹.some((g) => g.종류 === "종단") || (성과 && 측량점.높이 > 0) || 땅면),
      /* 🔗 G212 자리를 못 찾은 도면이 끼워 쓴 xref 중 안 올린 것 — 같이 넣으라고 알림 */
      xref: (() => {
        const 올린 = new Set(읽은.map((x) => 도면이름(x.이름)))
        const 못파일 = new Set(그룹.filter((g) => g.무리 == null && g.파일번 != null && ['평면', '종평', '기타', '밖', '상세'].includes(g.종류)).map((g) => g.파일번))
        const 이름들 = new Map()
        for (const x of 읽은) {
          if (!못파일.has(x.번)) continue
          for (const r of x.xrefs || []) {
            const n = 도면이름(r.이름) || 도면이름(r.경로)
            if (!n || 올린.has(n) || 틀이름.test(n)) continue
            if (!이름들.has(n)) 이름들.set(n, String(r.경로 || r.이름).split(/[\\/]/).pop().replace(/\.dwg$/i, ''))
          }
        }
        return [...이름들.values()].slice(0, 8)
      })(),
    }

    /* 🧱 G229 흙막이 도면 글자(규격 «H-298x201x9/14» · 간격 «C.T.C 1,800» · 굴착 깊이)는 아래 활용(흙막이읽기)까지 남김 */
    const 흙묶음 = (g) => g.out && ([...g.out.keys()].some((k) => 흙층(k.slice(k.indexOf('\u0001') + 1))) || 흙막이도면.test(g.제목 || '') || 흙막이도면.test((g.파일 || [])[0] || ''))      /* 🧭 G237 파일 이름(«가설흙막이 …»)도 */
    for (const g of 그룹) { delete g.표본; if (g.글자 && 흙묶음(g)) g.흙글 = g.글자; delete g.글자 }
    /* 🧊 G225 자리 표 읽기 — 겹치기 · 옮기기 뒤 점 셋으로 «원래 → 지금» 바꿈(돌림 · 옮김)을 되찾고 표는 지움 */
    for (const g of 그룹) for (const [name, b] of [...g.out]) {
      if (!name.endsWith('\u0001' + 구조표)) continue
      g.out.delete(name)
      if (b.pts.n < 9) continue
      const a = b.pts.a
      const 배 = Math.hypot(a[3] - a[0], a[4] - a[1]) / 1000
      const e = 구조면들[Math.round(a[2] / 1e6 / (배 || 1)) - 1]
      if (!e || !(배 > 0)) continue
      const ca = (a[3] - a[0]) / 1000, cb = (a[4] - a[1]) / 1000
      e.T = { a: ca, b: cb, tx: a[0] - (ca * e.기준[0] - cb * e.기준[1]), ty: a[1] - (cb * e.기준[0] + ca * e.기준[1]) }
      e.뒤g = g
    }

    /* 합치기 */
    const out = new Map()
    const layerInfo = new Map()
    let stats = null
    for (const g of 그룹) 합치기(out, g.out)
    for (const [k, v] of 꺼진) layerInfo.set(k, { ...(층색.get(k) || {}), off: v })
    for (const x of 통계들) {
      if (!stats) stats = { ...x, skipped: { ...x.skipped }, unknown: { ...x.unknown } }
      else {
        stats.segs += x.segs; stats.pts += x.pts; stats.ents += x.ents
        stats.capped = stats.capped || x.capped; stats.depthCut += x.depthCut
        for (const [k, n] of Object.entries(x.skipped)) stats.skipped[k] = (stats.skipped[k] || 0) + n
        for (const [k, n] of Object.entries(x.unknown)) stats.unknown[k] = (stats.unknown[k] || 0) + n
      }
    }
    if (!stats) stats = { segs: 0, pts: 0, ents: 0, capped: false, skipped: {}, unknown: {}, ver: '', units: 0, depthCut: 0 }
    if (측량점) layerInfo.set('측량점(성과표)', { rgb: [255, 214, 64] })
    if (땅면) layerInfo.set('측량 땅 면', { rgb: [170, 140, 95] })
    if (그룹.some((g) => g.콘크리트)) layerInfo.set('콘크리트', { rgb: [168, 168, 162] })
    if (그룹.some((g) => g.종류 === '노선')) { layerInfo.set('종단 지반선', { rgb: [176, 132, 80] }); layerInfo.set('종단 계획선', { rgb: [80, 160, 255] }); layerInfo.set('종단 깃', { rgb: [150, 150, 150] }) }
    if (횡단) {
      layerInfo.set('땅 면', { rgb: [120, 160, 90] }); layerInfo.set('계획 면', { rgb: [90, 150, 220] })
      /* 0 레이어·틀 레이어는 횡단면도에서 대개 눈금 막대·표 선이라 처음엔 꺼 둡니다 — 횡단만 있을 때만 */
      if (그룹.every((g) => g.종류 === '횡단' || !g.켬)) {
        const 끌 = 그룹.filter((g) => g.종류 === '횡단').flatMap((g) => g.끌층 || [])
        for (const ly of ['0', ...끌]) if (layerInfo.has(ly)) layerInfo.set(ly, { ...layerInfo.get(ly), off: true })
      }
    }
    if (!건물 && (평.length || Object.keys(높이).length) && !그룹.some((g) => g.종류 !== '평면' && g.종류 !== '밖')) {
      건물 = { 실패: true, 평면수: 평.length ? 평[0].제목.length : 0, 높이수: Object.keys(높이).length, 근거 }
    }
    /* 🧰 G224 (2026-10-10) 3D 활용 자료 — 도면 검사 · 측설표 · 구조물 물량 · 물길 · 기성 · 사진 위치 · 안전 그림(lib/활용3d.js)
       좌표는 화면과 같은 mm · «가운데 빼기 전»(화면 = 이 값 − r.center). 실좌표 = 기준이 측량 자료(측량도면 · 측량성과표)일 때만 참 */
    const 활용 = (() => {
      const 기준 = 그룹.find((g) => g.기준)
      const 노선 = []
      for (const L of 노선들) {
        /* 🛣 G236 이름으로 횡단을 얹은 노선은 글자 밖으로 이어진 선(램프 «-0+060» 처럼)까지 */
        const [s0, s1] = L.글맞음 && L.r.줄범위 ? [Math.min(L.r.범위[0], L.r.줄범위[0]), Math.max(L.r.범위[1], L.r.줄범위[1])] : L.r.범위
        if (!(s1 > s0)) continue
        const 걸음 = Math.max(0.5, (s1 - s0) / 4000)
        const 줄 = []
        for (let s = s0; s <= s1 + 1e-9; s += 걸음) { const p = L.r.자리(s); 줄.push(s, p.x, p.y, p.tx, p.ty) }
        if (Math.abs(줄[줄.length - 5] - s1) > 1e-6) { const p = L.r.자리(s1); 줄.push(s1, p.x, p.y, p.tx, p.ty) }
        노선.push({ 이름: L.이름, 간격: L.r.간격, 범위: [s0, s1], 근거: L.r.근거, 무리: L.무리, 줄: Float64Array.from(줄) })
      }
      const 횡 = 횡단 ? 횡단.노선.map((t) => ({
        노선: t.자리 && t.자리.how === '노선' ? t.자리.노선 : null, 파일: t.파일, 까닭: t.자리 && t.자리.how !== '노선' ? t.자리.까닭 || '' : '',
        단면: t.단면.map((s) => {
          const a = s.면적 && !s.면적.이상 ? s.면적 : null
          return { 측: s.측, 이름: s.이름, 글: s.글, 지반고: s.지반고, 계획고: s.계획고, 이상: s.면적 && s.면적.이상 ? s.면적.이상 : '', 표면적: s.표면적 || null,
            면적: a ? { 터파기: a.터파기, 되메우기: a.되메우기, 구조물: a.구조물, 성토: a.성토, 콘크리트: a.콘크리트 || 0, 거푸집: a.거푸집 || 0 } : null,
            바닥: a ? a.바닥 : null, 지반: a ? a.지반 : null, 구조폭: a ? a.구조폭 : null, 구조높: a ? a.구조높 : null, 터폭: a ? a.터폭 : null, 깊이: a ? a.깊이 : 0,
            모양: a && a.모양 ? a.모양 : null }    /* 🧊 G225 BIM 물량 — 콘크리트 · 터파기 · 성토 테두리(o, z m) */
        }),
      })) : []
      const 구 = 그룹.filter((g) => g.종류 === '구조' && g.콘크리트).map((g) => {
        const o = { 이름: g.제목 || g.파일[0], 층: g.층들[0], ...g.콘크리트, 자리: g.자리 ? g.자리.how : '', 파일: g.파일 }
        /* 🧊 G225 BIM 물량 — 벽 · 바닥 다각형(mm · 화면과 같은 자리 · 가운데 빼기 전) */
        const e = 구조면들.find((x) => x.g === g && x.T)
        if (e) {
          const T = e.T, 옮 = (rs) => rs.map((r) => r.map(([x, y]) => [T.a * x - T.b * y + T.tx, T.b * x + T.a * y + T.ty]))
          const 배 = Math.hypot(T.a, T.b)
          const 뒤 = e.뒤g || g
          const 높옮 = (L) => (L ? L.map((w) => ({ 무리: w.무리, 위: w.위, 아래: w.아래, 판: 옮(w.판), 넓이: w.넓이 * 배 * 배, 둘레: w.둘레 * 배, 맞닿음: (w.맞닿음 || []).map((t) => ({ 무리: t.무리, 길이: t.길이 * 배 })) })) : null)
          Object.assign(o, { 바닥판: 옮(e.면.바닥), 벽판: 옮(e.면.벽), 면넓이: { 바닥: e.면.넓이.바닥 * 배 * 배, 벽: e.면.넓이.벽 * 배 * 배 }, 면둘레: { 바닥: e.면.둘레.바닥 * 배, 벽: e.면.둘레.벽 * 배 },
            두께: e.면.두께 * 배, 방: e.면.방, 칸: e.면.칸, 자리: 뒤.자리 ? 뒤.자리.how : o.자리,
            벽들: 높옮(e.면.벽들), 바닥들: 높옮(e.면.바닥들),            /* 📐 G234 높이별(단면 자르는 선) */
            자름: g.구조r.단면.slice(1).map((d) => ({ 이름: d.이름, 자름: d.자름 || '', 높이점: (d.높이점 || []).length, EL: d.EL })) })
        }
        return o
      })
      /* 🏢 G228 (2026-10-10) 건물(층마다 쌓은 건축 평면) — 층 평면 겹선으로 벽 · 바닥 모양(lib/구조물면.js) · 화면 자리(겹치기 · 옮기기 뒤) 그대로
         소장님 「토목 도면을 넣어도, 건축도면을 넣어도, 토목하고 건축이 함께 나오도록 해줘.」 — 부재 일람표가 없는 건물(철골 · 조적 · 건축 평면만)도 3D 로 */
      const 건 = []
      for (const g of 그룹) {
        if (g.종류 !== '건물' || !g.out) continue
        const 층 = []
        const 층정보 = new Map(((건물 && 건물.층들) || []).map((f) => [f.층, f]))
        for (const k of g.층들 || []) {
          const 골라 = (키, ly) => 키 === k && !꺼진.get(ly)
          const z = 바닥높이(g.out, 골라)
          if (z == null) continue
          /* 🧭 G242 치수선(수직선 넷 넘게가 꿰뚫는 곧은 선)은 벽 · 바닥 테두리가 아님 — 치수를 기둥 층에 그린 도면(현장 C 2 · 3층) */
          /* 🧭 G242 설비 · 가구 · 주차 표시 층(덕트 · 배관 · 주방기구 · 주차 칸)은 벽 · 바닥 선이 아님 — 현장 C 3층 공조기계실 덕트가 벽으로 읽혔음 */
          const 설비층 = /기계|설비|mech|hvac|duct|덕트|배관|pipe|plumb|위생|sanit|전기|elec|light|소화|sprink|fire|가구|furn|집기|equip|장비|주방|kitchen|주차|parking|차량|조경|landsc|식재|화단|경계석|배수로|포장|paving/i
          const 선 = 치수선빼기(누운선(g.out, { 골라: (키, ly) => 골라(키, ly) && !설비층.test(ly), z, 창: 300 }))
          if (선.length < 64) continue
          const 벽선 = 치수선빼기(누운선(g.out, { 골라: (키, ly) => 골라(키, ly) && /wall|벽|conc|콘크리트|구조|col|기둥|str|조적|블럭|block|panel|판넬/i.test(ly) && !/hatch|해치|text|dim|치수|가구|furn|창|window|문|door/i.test(ly), z, 창: 300 }))
          let 면 = null
          try { 면 = 구조물면(선, 벽선.length >= 64 ? 벽선 : null, { 벽최소: 70, 벽최대: 1000, 칸최소: 25, 가는바닥: 2500 }) } catch (e) { 면 = null }
          if (!면 || !면.바닥.length) continue
          const f = 층정보.get(k) || {}
          층.push({ 층: k, 이름: f.이름 || k, z0: z, 층고: f.층고 || 0, 바닥판: 면.바닥, 벽판: 면.벽, 넓이: 면.넓이, 둘레: 면.둘레, 두께: 면.두께 })
        }
        층.sort((a, b) => a.z0 - b.z0)
        for (let i = 0; i < 층.length; i++) { const 위 = 층[i + 1]; 층[i].z1 = 위 ? 위.z0 : 층[i].z0 + (층[i].층고 || 0) }
        /* 높이맞춤 = 일꾼이 이미 땅(측량 면) · 구조물 G.L 높이로 올려 놓음(BIM 에서 또 올리지 않게) */
        /* 🧭 G237 통심(X1 · Y1) — 쌓은 자리 → 지금 화면 자리(옮긴 만큼 그대로) · 골조를 이 건물 안 제자리에 겹칠 때 씀 */
        const T = g.out.__T || { a: 1, b: 0, tx: 0, ty: 0 }, 옮 = (x, y) => [T.a * x - T.b * y + T.tx, T.b * x + T.a * y + T.ty]
        const 통심 = (g.통심 || []).map((q) => ({ 글: q.글, 끝: [...옮(q.끝[0], q.끝[1]), ...옮(q.끝[2], q.끝[3])] }))
        if (층.length) 건.push({ 이름: (g.파일 && g.파일[0] || '건물').replace(/\.(dxf|dwg)$/i, ''), 파일: g.파일, 자리: g.자리 ? g.자리.how : '', 방이름: !!(g.자리 && g.자리.방이름), 높이맞춤: !!(g.자리 && /^G\.L ±0 →/.test(g.자리.높이 || '')), 높이글: (g.자리 && g.자리.높이) || '', 층, 통심 })
      }
      /* 🧱 G229 흙막이 · 가설(H-PILE · 토류판 · 띠장 · 버팀보 …) — lib/흙막이.js · 흙막이 안 넓이 = 토류판 줄로 둘러싼 발자국(구조물면) − 둘레 × 판 두께 ÷ 2(가운데 줄 안) */
      let 흙 = []
      try {
        흙 = 흙막이읽기(그룹, (선) => {
          const 면 = 구조물면(선, null, { 벽최소: 70, 칸최소: 50 })
          if (!면 || !면.넓이) return 0
          const 넓 = (r) => { let A = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; A += a[0] * b[1] - b[0] * a[1] } return Math.abs(A / 2) }
          const 줄 = (면.바닥 || []).slice().sort((a, b) => 넓(b) - 넓(a))[0] || null
          return { 넓이: 면.넓이.바닥, 줄 }                // 토류판 바깥 줄 안 · 줄 = 3D 터파기 테두리(가운데 줄로는 흙막이.js 에서)
        })
          .map((h) => ({ ...h, 말뚝: { ...h.말뚝, 자리: h.말뚝.자리.slice(0, 2000) }, 중간말뚝: { ...h.중간말뚝, 자리: h.중간말뚝.자리.slice(0, 2000) } }))
      } catch (e) { 흙 = [] }
      for (const g of 그룹) delete g.흙글
      return {
        흙막이: 흙,
        건물: 건,
        실좌표: !!(기준 && (기준.종류 === '측량' || 기준.종류 === '측량점')), 바꿈: !!(측량점 && 측량점.바꿈),
        땅: 땅점 && 땅삼 ? { 점: Float64Array.from(땅점.flat()), 삼: Int32Array.from(땅삼.flat()) } : null,
        노선, 종단: 종단모음, 횡단: 횡, 구조: 구,
        성과점: 성과 ? 성과.점.slice(0, 5000).map((p) => ({ 이름: p.이름, N: p.N, E: p.E, Z: p.Z })) : [],
      }
    })()
    if (횡단) for (const t of 횡단.노선) for (const s of t.단면) if (s.면적) s.면적 = s.면적.이상 ? { 이상: s.면적.이상 } : { 터파기: s.면적.터파기, 되메우기: s.면적.되메우기, 구조물: s.면적.구조물, 성토: s.면적.성토 }
    self.postMessage({ type: 'prog', p: 0.93, msg: '화면에 올리는 중' })
    const r = finish(out, layerInfo, stats)
    r.건물 = 건물
    r.횡단 = 횡단
    r.구조 = 구조.length ? 구조 : null
    r.그룹 = 그룹.map((g, i) => ({ 번: i, 종류: g.종류, 파일: g.파일, 제목: g.제목 || '', 박스: !!g.박스, 층들: g.층들, 켬: g.켬, 기준: !!g.기준,
      무리: g.무리 ?? null, 자리: g.자리 || null, 옮김: g.옮김 || [0, 0], 설명: g.설명, 떨어짐: g.종류 === '밖' && g.무리 == null, ...(g.판목록 ? { 판목록: g.판목록 } : {}) }))
    r.필요 = 필요
    r.측량점 = 측량점
    r.노선 = 노선요약
    r.땅면 = 땅면
    r.활용 = 활용
    r.파일 = 읽은.map((x) => x.이름)
    r.못읽은 = 못읽은
    const tr = []
    if (활용.땅) tr.push(활용.땅.점.buffer, 활용.땅.삼.buffer)
    for (const L of 활용.노선) tr.push(L.줄.buffer)
    for (const l of r.layers) {
      tr.push(l.pos.buffer, l.col.buffer, l.pts.buffer, l.pcol.buffer)
      if (l.tri) tr.push(l.tri.buffer, l.trn.buffer, l.trc.buffer)
    }
    self.postMessage({ type: 'done', r }, tr)
  } catch (e) {
    /* 🧭 G243 기억이 모자라 멈춘 것은 «mem» 으로 */
    const msg = String((e && e.message) || e)
    self.postMessage({ type: 'err', kind: /memory|allocation|Invalid (string|array|typed array) length/i.test(msg) ? 'mem' : 'fail', msg })
  }
}
