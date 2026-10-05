/* 📦 도면 3D — 읽기 일꾼 (2026-09-25 · 2026-09-26 여러 장 · 건물 세우기 · 2026-10-05 박스 나누기 · 측량 기준 자리 맞춤)
   100MB 도면을 화면 줄기에서 읽으면 몇 초 동안 화면이 굳습니다. 그래서 따로 읽습니다.
   파일은 이 브라우저 안에서만 읽습니다 — 어디로도 보내지 않습니다.

   ■ 여러 장을 한꺼번에 받습니다 (평면도 + 입면도·단면도·골구도 · 종평면도 · 횡단면도 · 측량도면 · 측량성과표).
     ① 🏢 건물 — 평면도 묶음(「지상 2층 평면도」 같은 제목이 둘 이상) + 층 높이 글자 → 층마다 쌓고 벽·기둥을 세움 (lib/building3d.js)
     ② 🗂 나머지 도면은 «박스(도곽)» 로 나눠 박스마다 종류를 가립니다 (lib/도곽3d.js)
        소장님: 「캐드 안에 박스별로 여러 캐드 파일이 있잖아. 그걸 이용해서 3d로 전환시켜 줘야 하는거 아니야?」
     ③ 🛣 횡단면도 박스는 같은 노선끼리 모아 세우고(lib/횡단3d.js) · 🏗 구조도는 구조물로(lib/구조3d.js)
     ④ 📍 평면 쪽(측량도면 · 평면도 · 종평면도의 평면 칸)은 «같은 글자» 로 기준에 맞춥니다 (lib/자리맞춤.js)
        기준 = 측량성과표 → 측량도면 → 계획평면도 → 가장 큰 평면도 차례
        소장님: 「평면도에도 좌표가 안입혀져 있어. 대부분 그래, 그래서 좌표가 있는 측량도면을 측량성과표 도면을 꼭 넣어달라고 해야 하지 않아.」
        「횡단면도, 종단면도는 좌표로 찾기 힘들잖아. 이건 깊이 높이만 찾아 와야 하고」 → 종단·횡단은 좌표로 맞추지 않습니다
     ⑤ 🛣 (G138) 자리를 맞춘 평면도의 측점 글자 + 중심선으로 노선을 만들고, 같은 이름의 횡단면도를 측점마다 노선과 직각으로 세웁니다.
        종단면도 표(측점 · 누가거리 · 지반고 · 계획고)는 노선 위 지반선 · 계획선으로 (lib/노선3d.js) */
import { parseDxf, decodeBytes, sniff, finish, F64, U8, 알맹이상자, 무더기상자 } from './dxf3d.js'
import { 층높이찾기, 지붕채우기, 평면제목, 쌓기 } from './building3d.js'
import { 횡단세우기 } from './횡단3d.js'
import { 구조세우기 } from './구조3d.js'
import { 도곽찾기3d, 박스제목, 도면종류, 네모로나누기, 도면합치기, 평면칸, 묶음이름, 도면단위배, 측량다움, 테두리빼기 } from './도곽3d.js'
import { 글짝들, 글열쇠, 짝맞추기, 변환하기, 회전도, 축척 } from './자리맞춤.js'
import { 노선열쇠, 노선이름, 노선같음, 노선찾기, 종단표읽기, 노선에얹기, 종단선, 측점m로, 중심꼴 } from './노선3d.js'
import { 평균단면, 삼각망, 높이찾개, 땅면부피 } from './토공3d.js'

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
function 바꾸기(out, T) {
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
      const raw = parseDxf(text, (p) => self.postMessage({ type: 'prog', p: 0.02 + (앞 + p * 폭 / 0.7) * 0.7, msg: `${f.name} 선 세우는 중` }), { raw: true })
      if (!raw.stats.ents && !raw.texts.length) { 못읽은.push({ 이름: f.name, 까닭: 'empty' }); continue }
      읽은.push({ 이름: f.name, raw, 번: 읽은.length })
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
    const 평 = 읽은.map((x) => ({ x, 제목: 평면제목(x.raw.texts) })).filter((q) => q.제목.length >= 2)
    let 건물 = null
    if (평.length) {
      const 주 = 평.sort((a, b) => b.제목.length - a.제목.length)[0]
      const 지붕 = 지붕채우기(높이, 파일들, 주.제목.map((t) => t.층))
      const s = 쌓기(주.x.raw, 주.제목, 높이, 새버킷)
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
        그룹.push({ 종류: '건물', 파일: [주.x.이름], 제목: '', out: s.out, 층들: s.층들.map((f) => f.층), 켬: true,
          설명: `층 ${s.층들.length}개 · 벽·기둥 ${s.세운벽}장` })
      }
    }

    /* ② 🗂 박스 나누기 — 파일마다 도곽을 찾아 박스로 나누고 종류를 가립니다 */
    self.postMessage({ type: 'prog', p: 0.78, msg: '도면 안 박스(도곽) 나누는 중' })
    const 항목 = []        // {파일, 파일번, 박스(번호|-1|'밖'), 제목, 종류, raw, 배, 근거}
    for (const x of 읽은) {
      if (쓴.has(x)) continue
      const 보임 = (ly) => !꺼진.get(ly)
      let 파일종류 = 도면종류('', x.이름)
      /* 박스(도곽)는 늘 먼저 찾습니다 — 파일 이름이 «도면1.dxf» 처럼 아무 말이 없으면, 측량점 글자가 든 종평면도(소장님 도면 08)가
         «측량도면» 으로 잡혀 박스를 안 나누고 통째로 기준 쪽에 붙었습니다(시험으로 확인). 측량도면 짐작은 박스가 없을 때만. */
      const fr = 도곽찾기3d(x.raw, 보임)
      if (!fr.length && 파일종류 === '기타' && 측량다움(x.raw)) 파일종류 = '측량'
      const 단 = 도면단위배(x.raw, fr)
      const 넣기 = (o) => 항목.push({ 파일: x.이름, 파일번: x.번, 배: 단.배, 단위근거: 단.근거, ...o })
      if (!fr.length) { 넣기({ 박스: -1, 제목: '', 종류: 파일종류, raw: x.raw }); x.raw = null; continue }
      const 나 = 네모로나누기(x.raw, fr)
      fr.forEach((r, i) => {
        const 제 = 박스제목(x.raw.texts, r)
        let 종 = 도면종류(제, fr.length === 1 ? x.이름 : '')
        if (종 === '기타' && fr.length === 1) 종 = 파일종류
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
        넣기({ 박스: i, 제목: 제, 종류: 종, raw: 나.조각[i], 도곽: r })
      })
      if (선수(나.밖.out) > 0) 넣기({ 박스: '밖', 제목: '도곽 밖', 종류: 파일종류 === '측량' ? '측량' : '밖', raw: 나.밖 })
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
        let r = null
        try { r = 횡단세우기(raw, 새버킷, 0, 머리) } catch (e) { r = null }
        if (!r) continue
        for (const it of a) it.쓴 = '횡단'
        const 이름 = a[0].박스 === -1 ? a[0].파일 : 묶음이름(a[0].제목) || a[0].파일
        횡노선.push({ 파일: 이름, 열쇠: 노선열쇠(a[0].박스 === -1 ? a[0].파일 : a[0].제목), r, 박스: a.length })
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
          설명: `평면 + 단면 ${r.단면.length - 1}장 · G.L ${r.평면EL.toFixed(2)} m` })
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
      const 평면 = 평면꼴.has(it.종류)
      /* 📈 종단 표(측점 · 누가거리 · 지반고 · 계획고) — 노선을 찾으면 그 위에 지반선 · 계획선으로 */
      let 종단표 = null
      if (it.종류 === '종단' || it.종류 === '종평') { try { 종단표 = 종단표읽기(it.raw.texts) } catch (e) { 종단표 = null } }
      그룹.push({
        종단표, 노선열쇠: 노선열쇠(it.제목 || it.파일),
        종류: it.종류, 파일: [it.파일], 제목: it.제목 || '', 박스: it.박스 !== -1, out, 층들: [키],
        켬: 평면 && it.종류 !== '밖', 평면, 단위근거: it.단위근거,
        /* 꺼 둔 층 글자(수치지도 등)는 «숨» 표 — 그대로 맞는지 확인에는 쓰고, 다른 도면을 붙이는 바탕(pool)에는 안 넣습니다 */
        글: 평면 ? 글짝들(it.raw.texts, it.배, (ly) => !!꺼진.get(ly)) : null,
        이름: it.제목 || it.파일,
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
    const 차례 = (g) => (g.성과표 ? 0 : g.종류 === '측량' ? (이름에(g, /GPS|측량/i) ? 1 : 2) : 이름에(g, /계획평면/) && g.종류 === '평면' ? 3 : g.종류 === '평면' ? 4 : g.종류 === '종평' ? 5 : 6)
    const 기준후보 = (평들.some((g) => g.종류 !== '밖') ? 평들.filter((g) => g.종류 !== '밖') : 평들).slice().sort((a, b) => 차례(a) - 차례(b) || 크기(b) - 크기(a))
    let 기준g = null
    const 무리들 = []         // [{ 머리, 들:[g] }]
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
          g.글 = g.글.map((p) => { const [x, y] = 변환하기(r.T, p.x, p.y); return { ...p, x, y } })
          g.표본 = 표본(g.out); g.상자 = 상자(g.표본)
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
          if (!(모두 > 0 && 안 >= 모두 * 0.6)) continue
          g.무리 = 머리.무리
          g.자리 = { how: '좌표', 까닭: 못.get(g) ? 못.get(g).까닭 : '' }
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
    for (const g of 그룹) if (g.종류 === '밖') g.켬 = g.무리 === 0 && g !== 기준g ? true : g.켬
    for (const g of 그룹) if (끔꼴.has(g.종류)) g.켬 = false
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
      if (!m) { m = { 열쇠: 열, 이름: 노선이름(g.제목 || g.파일[0]), 글: [], 선: {}, 무리: g.무리, 평면: [] }; 노선모음.set(열, m) }
      for (const p of 글) m.글.push({ s: p.s, x: p.x, y: p.y })
      for (const [name, b] of g.out) {
        const ly = name.slice(name.indexOf('\u0001') + 1)
        if (!중심꼴.test(ly) || !b.pos.n) continue
        const a = b.pos.a, S = m.선[ly] || (m.선[ly] = [])
        for (let i = 0; i < b.pos.n; i += 6) S.push([a[i], a[i + 1], a[i + 3], a[i + 4]])
      }
      m.평면.push(g)
    }
    const 노선들 = []
    for (const m of 노선모음.values()) {
      let r = null
      try { r = 노선찾기(m.글, m.선) } catch (e) { r = null }
      if (r) 노선들.push({ ...m, r })
    }
    /* 이름으로 노선 고르기 — 같은 이름(2) 또는 품는 이름(1, 측점 범위가 반 넘게 겹칠 때만).
       같은 노선을 여러 평면도가 그렸으면 «중심선» 으로 찾은 것을 먼저 — 소장님 도면 02 는 측점 글자만 있어 글자 자리(중심에서 왼쪽 3.4 m)로 이었고,
       04 철거계획평면도는 중심선이 있어 그쪽이 바릅니다(시험으로 확인). 노선이 하나뿐이고 측점 범위가 겹치면 이름이 달라도 */
    const 노선고르기 = (열쇠, 범위) => {
      const 겹침 = (L) => { if (!범위) return 1; const lo = Math.max(범위[0], L.r.범위[0]), hi = Math.min(범위[1], L.r.범위[1]); return (hi - lo) / Math.max(1, 범위[1] - 범위[0]) }
      const 후보 = 노선들.map((L) => ({ L, k: 노선같음(열쇠, L.열쇠), o: 겹침(L) })).filter((c) => c.k === 2 || (c.k === 1 && c.o >= 0.5))
      if (후보.length) {
        const 중 = (c) => (c.L.r.근거 === '중심선' && c.o >= 0.5 ? 1 : 0)
        후보.sort((a, b) => 중(b) - 중(a) || b.k - a.k || b.L.r.n - a.L.r.n)
        return 후보[0]
      }
      if (노선들.length === 1 && 범위 && 겹침(노선들[0]) >= 0.5) return { k: 0, L: 노선들[0] }
      return null
    }
    /* 🟫 (G139) 측량 땅 면 — 측량성과표 · 측량도면 · 평면도 안의 «높이 든 점» 을 들로네 삼각형으로(자리 맞춘 무리 안 것만) */
    let 땅면 = null, 땅높이 = null
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
        try { 삼 = 삼각망(점, 최대변) } catch (e) { 삼 = [] }
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
      for (const h of 횡노선) {
        const 고른 = 노선고르기(h.열쇠, [h.r.시작, h.r.끝])
        if (!고른) { 곧은것.push(h); continue }
        const L = 고른.L
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
            자리: h.자리 || { how: '곧게', 까닭: 노선들.length ? `같은 이름(«${h.열쇠 || h.파일}»)의 평면 노선이 없음` : '측점(NO.) 글자와 중심선이 있는 평면도가 없음' } })
          if (곧게) 어긋 += (h.r.폭m + 20) * 1000
        }
        const 이름들 = 목록.map((h) => (h.자리 ? h.자리.노선 : h.파일))
        const 단면수 = 목록.reduce((n, h) => n + h.r.단면.length, 0)
        그룹.push({ 종류: '횡단', 파일: [...new Set(목록.map((h) => h.파일))], 제목: 곧게 ? '' : '평면 노선 따라', out: 모음, 층들: 층키, 켬: true,
          끌층: 목록.flatMap((h) => h.r.끌층),
          무리: 곧게 ? null : 목록[0].자리.무리,
          자리: 곧게 ? { how: '곧게', 까닭: 노선들.length ? '같은 이름의 평면 노선이 없음' : '측점(NO.) 글자와 중심선이 있는 평면도가 없음' }
            : { how: '노선', 노선: [...new Set(이름들)].join(' · '), n: 목록.reduce((n, h) => n + h.자리.n, 0), 근거: 목록.some((h) => h.자리.근거 === '측점 글자') ? '측점 글자' : '중심선', 노선수: 목록.length },
          설명: 곧게 ? `노선 ${목록.length}개 · 단면 ${단면수}개 — 측점·지반고로 높이를 맞춤 · 평면 노선을 못 찾아 곧게 펴 옆에 둠`
            : `노선 ${목록.length}개 · 단면 ${단면수}개 — 평면도 측점 자리에 노선과 직각으로 세움` })
      }
      그룹넣기(선것, false)
      그룹넣기(곧은것, true)
      횡단 = { 노선: 노선표, 안씀: [] }
    }
    /* 종단 — 표가 있는 종단(종평의 종단·표 칸 포함)을 노선별로 모아 노선 위 지반선 · 계획선 */
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
    const 노선요약 = 노선들.map((L) => ({ 이름: L.이름, 근거: L.r.근거, 층: L.r.층, 간격: L.r.간격, n: L.r.n, 모두: L.r.모두, rms: L.r.rms, 어긋: L.r.어긋, 범위: L.r.범위, 토막: L.r.토막, 평면: L.평면.map((g) => g.제목 || g.파일[0]) }))

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
      if (g.종류 === '건물' || g.종류 === '횡단' || g.종류 === '구조' || g.종류 === '노선' || g.종류 === '땅면') continue
      const z = g.자리 || {}
      if (z.how === '기준') g.설명 = z.안이어짐 ? '측량 좌표(기준) — 같은 이름을 가진 도면이 없어 도면과 아직 안 이어짐 · 처음엔 꺼 둠'
        : z.둘째 ? '도면끼리의 기준(측량성과표와는 아직 안 이어짐)' : g.성과표 ? '측량 좌표 — 모든 자리의 기준' : g.종류 === '측량' ? '측량도면 — 모든 자리의 기준' : `${종이름[g.종류] || '도면'} — 자리의 기준(측량 자료 없음)`
      else if (z.how === '글자') g.설명 = `같은 글자 ${z.n}쌍으로 맞춤 · 평균 오차 ${z.rms.toFixed(2)} m · 돌림 ${z.회전.toFixed(2)}°${z.단위배 ? ` · 도면 단위를 바로잡음(×${z.단위배})` : Math.abs(z.축척 - 1) > 0.01 ? ` · 축척 ×${z.축척.toFixed(3)}` : ''}`
      else if (z.how === '좌표') g.설명 = '좌표가 기준과 같은 자리 — 그대로 둠'
      else if (z.how === '옆') g.설명 = `자리를 못 찾아 옆에 둠 — ${z.까닭} · 📍 두 점 찍기로 맞추세요`
      else if (g.종류 === '종단') g.설명 = g.종단자리 && g.종단자리.how === '노선' ? `종단 표 ${g.종단자리.줄}줄을 읽어 노선 «${g.종단자리.노선}» 위 지반선·계획선으로 세움 · 이 도면 그림은 처음엔 꺼 둠`
        : g.종단표 ? `종단 표 ${g.종단표.줄.length}줄을 읽었지만 ${g.종단자리 ? g.종단자리.까닭 : '평면 노선을 못 찾음'} · 처음엔 꺼 둠` : '높이 자료(측점·지반고·계획고) — 표를 못 읽음 · 처음엔 꺼 둠'
      else if (g.종류 === '횡단못') g.설명 = '횡단면도 — 이 꼴의 측점·지반고 표(오른쪽 표 · «S T A .»)는 아직 못 읽어 그대로 둠 · 다음 차례에 읽게 함 · 처음엔 꺼 둠'
      else if (g.종류 === '밖' && !g.무리) g.설명 = '도곽 밖 그림(꺼 둔 수치지도 등) — 자리를 몰라 옆에 둠 · 처음엔 꺼 둠'
      else g.설명 = `${종이름[g.종류] || '도면'} — 옆에 둠 · 처음엔 꺼 둠`
    }

    /* 꼭 필요한 자료 — 화면 맨 위 «꼭 넣을 것» 표에 씁니다 */
    const 측량도면 = 그룹.find((g) => g.종류 === '측량')
    const 계획 = 그룹.find((g) => g.평면 && !g.성과표 && g.종류 !== '측량' && 이름에(g, /계획평면|평면도|배치도|계획도/)) || 그룹.find((g) => g.종류 === '평면')
    const 이어진 = (g) => g && g.무리 === 0 && 무리들[0] && 무리들[0].머리 && (무리들[0].머리.성과표 || 무리들[0].머리.종류 === '측량')
    const 필요 = {
      측량: 성과 ? { 있음: true, 종류: '성과표', 이름: 측량점.파일, 점: 측량점.n, 이어짐: !!(기준g && 기준g.성과표 && !기준g.자리.안이어짐) }
        : 측량도면 ? { 있음: true, 종류: '측량도면', 이름: 측량도면.파일[0], 이어짐: true } : { 있음: false },
      평면: 계획 ? { 있음: true, 이름: 계획.이름, 이어짐: !!이어진(계획), 자리: (계획.자리 || {}).how } : { 있음: false },
      높이: !!(그룹.some((g) => g.종류 === "횡단") || 그룹.some((g) => g.종류 === "종단") || (성과 && 측량점.높이 > 0) || 땅면),
    }

    for (const g of 그룹) delete g.표본

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
    if (횡단) for (const t of 횡단.노선) for (const s of t.단면) if (s.면적) s.면적 = s.면적.이상 ? { 이상: s.면적.이상 } : { 터파기: s.면적.터파기, 되메우기: s.면적.되메우기, 구조물: s.면적.구조물, 성토: s.면적.성토 }
    self.postMessage({ type: 'prog', p: 0.93, msg: '화면에 올리는 중' })
    const r = finish(out, layerInfo, stats)
    r.건물 = 건물
    r.횡단 = 횡단
    r.구조 = 구조.length ? 구조 : null
    r.그룹 = 그룹.map((g, i) => ({ 번: i, 종류: g.종류, 파일: g.파일, 제목: g.제목 || '', 박스: !!g.박스, 층들: g.층들, 켬: g.켬, 기준: !!g.기준,
      무리: g.무리 ?? null, 자리: g.자리 || null, 옮김: g.옮김 || [0, 0], 설명: g.설명, 떨어짐: g.종류 === '밖' && g.무리 == null }))
    r.필요 = 필요
    r.측량점 = 측량점
    r.노선 = 노선요약
    r.땅면 = 땅면
    r.파일 = 읽은.map((x) => x.이름)
    r.못읽은 = 못읽은
    const tr = []
    for (const l of r.layers) {
      tr.push(l.pos.buffer, l.col.buffer, l.pts.buffer, l.pcol.buffer)
      if (l.tri) tr.push(l.tri.buffer, l.trn.buffer, l.trc.buffer)
    }
    self.postMessage({ type: 'done', r }, tr)
  } catch (e) {
    self.postMessage({ type: 'err', kind: 'fail', msg: String((e && e.message) || e) })
  }
}
