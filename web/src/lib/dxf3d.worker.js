/* 📦 도면 3D — 읽기 일꾼 (2026-09-25 · 2026-09-26 여러 장 · 건물 세우기)
   100MB 도면을 화면 줄기에서 읽으면 몇 초 동안 화면이 굳습니다. 그래서 따로 읽습니다.
   파일은 이 브라우저 안에서만 읽습니다 — 어디로도 보내지 않습니다.

   ■ 여러 장을 한꺼번에 받습니다 (평면도 + 입면도·단면도·골구도).
     - 평면도 묶음(「지상 2층 평면도」 같은 제목이 둘 이상)이 있고, 다른 도면 글자에서 층 높이를 찾으면
       → 층마다 나눠 제 높이에 쌓고 벽·기둥을 세웁니다 (lib/building3d.js)
     - 아니면 → 전처럼 도면에 적힌 높이 그대로 (여러 장이면 겹쳐 그림) */
import { parseDxf, decodeBytes, sniff, finish, F64, U8, 알맹이상자, 무더기상자 } from './dxf3d.js'
import { 층높이찾기, 지붕채우기, 평면제목, 쌓기 } from './building3d.js'
import { 횡단세우기 } from './횡단3d.js'
import { 구조세우기 } from './구조3d.js'

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

self.onmessage = (ev) => {
  const files = (ev.data && ev.data.files) || (ev.data && ev.data.buf ? [{ name: '도면.dxf', buf: ev.data.buf }] : [])
  try {
    const 읽은 = []
    const 못읽은 = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const 앞 = i / files.length, 폭 = 0.8 / files.length
      const kind = sniff(f.buf)
      if (kind !== 'dxf') { 못읽은.push({ 이름: f.name, 까닭: kind }); continue }
      self.postMessage({ type: 'prog', p: 0.02 + 앞 * 0.8, msg: `${f.name} 읽는 중` })
      const text = decodeBytes(f.buf)
      f.buf = null
      if (!/(^|\n)\s*0\s*\r?\n\s*SECTION/.test(text.slice(0, 20000))) { 못읽은.push({ 이름: f.name, 까닭: 'notdxf' }); continue }
      const raw = parseDxf(text, (p) => self.postMessage({ type: 'prog', p: 0.02 + (앞 + p * 폭 / 0.8) * 0.8, msg: `${f.name} 선 세우는 중` }), { raw: true })
      if (!raw.stats.ents && !raw.texts.length) { 못읽은.push({ 이름: f.name, 까닭: 'empty' }); continue }
      읽은.push({ 이름: f.name, raw })
    }
    if (!읽은.length) {
      const k = 못읽은[0] ? 못읽은[0].까닭 : 'fail'
      self.postMessage({ type: 'err', kind: k === 'empty' ? 'fail' : k, msg: 못읽은.map((x) => x.이름).join(', ') })
      return
    }
    self.postMessage({ type: 'prog', p: 0.86, msg: '도면 글자에서 층 높이 찾는 중' })

    /* 🧩 2026-09-27 — 소장님: 「이 도면을 올렸는데, 3d가 완벽하게 안나와. 건축은 아예 없고 왜 그러지?」 「펌프장 구조물도 안나오고」
       전에는 묶음 «전체» 를 건물 아니면 횡단 한 가지로만 세워서, 20장을 넣으면 횡단만 남고 나머지가 빠졌습니다.
       → 도면마다 맞는 방식으로 세워 «한 화면에» 모읍니다: 🏢 건물(평면도+레벨) · 🛣 횡단(측점·지반고) · 🏗 구조물(평면+단면 EL) · 🗺 평면(그대로).
         좌표가 같은 평면도(실제 좌표 — 수치지도·계획평면도)끼리는 제자리에 겹치고, 나머지 묶음은 그 옆에 나란히 둡니다.
         (자리를 옮기는 «기준점 찍기» 는 화면에서 합니다) */
    const 그룹 = []                       // {종류, 파일:[이름], out(Map), 층들:[키], 켬, 설명}
    const 쓴 = new Set()
    /* 도면 단위 → mm 배수. ⚠️ 도면 머리의 단위(INSUNITS)는 믿을 수 없습니다 — 소장님 계획평면도는 «mm» 로 적혀 있는데
       실제로는 m 로 그린 수치지도 좌표였습니다(글자 높이 0.3). 그래서 «글자 높이» 를 먼저 봅니다: 가운데 값이 1.5 아래면 m. */
    const 단위배 = (x) => {
      const hs = x.raw.texts.map((t) => t.h || 0).filter((v) => v > 0).sort((a, b) => a - b)
      if (hs.length >= 5) return hs[Math.floor(hs.length / 2)] < 1.5 ? 1000 : 1
      const u = x.raw.stats.units
      return u === 6 ? 1000 : u === 5 ? 10 : 1
    }

    /* 🏢 건물 — 모든 도면 글자에서 층 높이, 평면도 제목이 가장 많은 도면을 층으로 */
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
        그룹.push({ 종류: '건물', 파일: [주.x.이름], out: s.out, 층들: s.층들.map((f) => f.층), 켬: true,
          설명: `층 ${s.층들.length}개 · 벽·기둥 ${s.세운벽}장` })
      }
    }

    /* 🛣 횡단면도 — 도면마다 따로 찾고, 노선이 여럿이면 옆으로 비켜 놓습니다 */
    let 횡단 = null
    self.postMessage({ type: 'prog', p: 0.88, msg: '횡단면도(측점·지반고) 찾는 중' })
    {
      const 모음 = new Map()
      const 노선 = []
      let 어긋 = 0
      const 층키 = []
      읽은.forEach((x, k) => {
        if (쓴.has(x)) return
        const 머리 = (k + 1) + '· '
        const r = 횡단세우기(x.raw, 새버킷, 어긋, 머리)
        if (!r) return
        쓴.add(x)
        합치기(모음, r.out)
        for (const d of r.단면) 층키.push(d.층)
        노선.push({ 파일: x.이름, 단면: r.단면, 시작: r.시작, 끝: r.끝, 폭m: r.폭m, 빠짐: r.빠짐, 어긋m: 어긋 / 1000, 끌층: r.끌층 })
        어긋 += (r.폭m + 20) * 1000
      })
      if (노선.length) {
        횡단 = { 노선, 안씀: [] }
        그룹.push({ 종류: '횡단', 파일: 노선.map((g) => g.파일), out: 모음, 층들: 층키, 켬: true, 끌층: 노선.flatMap((g) => g.끌층),
          설명: `노선 ${노선.length}개 · 단면 ${층키.length}개` })
      }
    }

    /* 🏗 구조물 — 평면도 + 단면(EL 글자) */
    self.postMessage({ type: 'prog', p: 0.9, msg: '구조물 단면(EL) 찾는 중' })
    const 구조 = []
    읽은.forEach((x, k) => {
      if (쓴.has(x)) return
      let r = null
      try { r = 구조세우기(x.raw, 새버킷, (k + 1) + '· ') } catch (e) { r = null }
      if (!r) return
      쓴.add(x)
      구조.push({ 파일: x.이름, 단면: r.단면, 평면EL: r.평면EL, 빠짐: r.빠짐, 제목: r.제목 })
      그룹.push({ 종류: '구조', 파일: [x.이름], out: r.out, 층들: r.단면.map((d) => d.층), 켬: true,
        설명: `평면 + 단면 ${r.단면.length - 1}장 · G.L ${r.평면EL.toFixed(2)} m` })
    })

    /* 🗺 나머지 — 도면 그대로(높이가 든 선은 그 높이). 단위를 mm 로 맞춥니다 */
    읽은.forEach((x, k) => {
      if (쓴.has(x)) return
      const 배 = 단위배(x)
      const 키 = (k + 1) + '· 도면'
      const out = new Map()
      let 큰 = 0, n = 0, 높은 = 0, 튐 = 0
      for (const [ly, b] of x.raw.out) {
        if (배 !== 1) {
          for (const arr of [b.pos, b.pts]) for (let i = 0; i < arr.n; i++) arr.a[i] *= 배
        }
        for (let i = 0; i < b.pos.n; i += 3) {
          const z = b.pos.a[i + 2]
          if (Math.abs(b.pos.a[i]) > 1e8) 큰++
          if (z !== 0) { if (Math.abs(z) > 3e6) 튐++; else 높은++ }
          n++
        }
        out.set(키 + '\u0001' + ly, b)
      }
      const 실좌표 = n > 0 && 큰 > n * 0.5          // 100km 넘는 좌표 = 실제 좌표(TM)로 그린 평면도
      /* 높이가 든 도면 = 선 끝의 5% 넘게 높이가 있고, 튀는 높이(3km 넘음 — 잘못 찍힌 값)가 거의 없을 때 */
      const 높이있음 = n > 0 && 높은 > n * 0.05 && 튐 < n * 0.001
      /* 처음에 켜는 것은 실제 좌표 평면도만 — 배근도·상세도·표는 옆에 쌓여 화면만 어지럽힙니다(목록에서 켤 수 있음) */
      그룹.push({ 종류: '평면', 파일: [x.이름], out, 층들: [키], 켬: 실좌표, 실좌표,
        설명: 실좌표 ? '실제 좌표 평면도 — 제자리' : 높이있음 ? '높이가 든 선 그대로(처음엔 꺼 둠)' : '높이 정보 없는 도면·상세도(처음엔 꺼 둠)' })
    })
    /* 한 가지뿐이면 무조건 켭니다(도면 한 장만 넣었을 때 빈 화면이 되지 않게) */
    if (!그룹.some((g) => g.켬)) for (const g of 그룹) g.켬 = true

    /* 📐 자리 — 실제 좌표 평면도들은 제자리(기준). 나머지는 그 오른쪽에 나란히(사이 20m 이상) */
    /* 🎯 2026-09-28 — 묶음 자리는 «알맹이» 로(dxf3d.js 알맹이상자). 한 도면 안에 수백 km 떨어진 선이 있어도
       그 묶음이 화면 전체를 차지하거나, 다른 묶음을 300 km 밖으로 밀어내지 않게 합니다. */
    /* 👁 처음 화면에 보일 층만 봅니다 — 캐드에서 꺼 둔(끔·얼림) 층은 자리 잡기에서 뺍니다.
       화면 자리(fitBox)도 «켠 층» 만 보므로 둘이 같은 것을 봐야 합니다.
       ⚠️ 소장님 도면 08: 꺼 둔 수치지도 층(수십 km)으로 자리를 잡았더니, 켜져 있는 시트 선은 180 km 밖에 남아
          08 을 켜면 다시 점만 보였습니다(시험으로 확인). 층 켬/끔은 화면과 같은 규칙(같은 이름 층은 먼저 읽은 도면 것). */
    const 꺼진 = new Map()
    for (const x of 읽은) for (const [k, v] of x.raw.layerInfo) if (!꺼진.has(k)) 꺼진.set(k, !!(v && v.off))
    const 층이름 = (name) => { const c = name.indexOf('\u0001'); return c >= 0 ? name.slice(c + 1) : name }
    const 표본 = (out) => {
      const 모으기 = (보임만) => {
        /* 층마다 4000 점 남짓만 뽑으므로, 뽑은 점 하나가 «몇 점 몫» 인지(ws)를 같이 둡니다 —
           안 그러면 선 몇 개짜리 층이 선 수만 개짜리 층과 같은 무게가 되어 자리가 엉뚱해집니다(08: 1.8 km 어긋남) */
        const xs = [], ys = [], ws = []
        for (const [name, b] of out) {
          if (보임만 && 꺼진.get(층이름(name))) continue
          const a = b.pos.a, st = Math.max(3, Math.floor(b.pos.n / 3 / 4000) * 3)
          for (let i = 0; i < b.pos.n; i += st) { xs.push(a[i]); ys.push(a[i + 1]); ws.push(st / 3) }
        }
        return { xs, ys, ws }
      }
      const t = 모으기(true)
      return t.xs.length ? t : 모으기(false)   // 다 꺼 둔 도면이면(화면도 그땐 모두 켭니다) 전부로
    }
    const 상자 = (t) => {
      if (!t.xs.length) return null
      const r = 알맹이상자(t.xs, t.ys, t.ws)
      return [r[0], r[1], r[3], r[4]]
    }
    const 옮기기 = (out, dx, dy) => {
      for (const [, b] of out) {
        for (const arr of [b.pos, b.pts]) for (let i = 0; i < arr.n; i += 3) { arr.a[i] += dx; arr.a[i + 1] += dy }
        if (b.tri) for (let i = 0; i < b.tri.n; i += 3) { b.tri.a[i] += dx; b.tri.a[i + 1] += dy }
      }
    }
    for (const g of 그룹) { g.표본 = 표본(g.out); g.상자 = 상자(g.표본) }
    /* 🎯 2026-09-28 — 실제 좌표 평면도가 여럿이면 «서로 맞는 무리» 를 기준으로 삼습니다.
       소장님 도면 19장: 03·09 는 같은 자리(수백 m)인데, 08(종평·횡단면도)은 수치지도가 수십 km 넓게 깔리고
       설계 선 일부는 170 km 떨어져 있어, 08 까지 기준으로 두면 화면이 수십~수백 km 가 되어 점만 보였습니다.
       → 두 도면이 «서로» 상대의 자리(넉넉히 넓힌 것) 안에 선의 절반 넘게 들면 같은 무리. 선이 가장 많은 무리가 기준.
         무리에 못 든 실제 좌표 도면은 처음엔 꺼 두고, 옆 묶음들 «맨 끝» 에 나란히 둡니다.
         ⚠️ 처음엔 «제자리 그대로» 두었는데, 켜면(모두 켜기) 화면이 다시 수십 km 가 되어 점만 보였습니다(시험으로 확인) →
            좌표가 서로 맞지 않는 도면은 좌표대로 두어 봐야 볼 수가 없습니다. 다른 도면을 밀어내지 않게 맨 끝에 둡니다. */
    const 선수 = (g) => { let n = 0; for (const [, b] of g.out) n += b.pos.n; return n }
    const 넓힘 = (a) => { const m = Math.max(2e6, 0.5 * Math.max(a[2] - a[0], a[3] - a[1])); return [a[0] - m, a[1] - m, a[2] + m, a[3] + m] }
    const 안비율 = (g, a) => {
      const { xs, ys } = g.표본
      if (!xs.length) return 0
      let n = 0
      for (let i = 0; i < xs.length; i++) if (xs[i] >= a[0] && xs[i] <= a[2] && ys[i] >= a[1] && ys[i] <= a[3]) n++
      return n / xs.length
    }
    const 서로 = (g, h) => 안비율(h, 넓힘(g.상자)) >= 0.5 && 안비율(g, 넓힘(h.상자)) >= 0.5
    const 실들 = 그룹.filter((g) => g.실좌표 && g.상자)
    let 으뜸 = null, 무리 = []
    if (실들.length) {
      let 값 = -1
      for (const g of 실들) {
        const m = 실들.filter((h) => h === g || 서로(g, h))
        const v = m.reduce((n, h) => n + 선수(h), 0)
        if (v > 값) { 값 = v; 으뜸 = g; 무리 = m }
      }
      for (const g of 실들) {
        if (무리.includes(g)) continue
        g.실좌표 = false; g.떨어짐 = true; g.켬 = false
        /* 자리는 «가장 큰 무더기» 로 — 알맹이만으론 두 덩어리를 다 담아 수십 km 가 됩니다(dxf3d.js 무더기상자) */
        if (g.표본.xs.length) { const r = 무더기상자(g.표본.xs, g.표본.ys, g.표본.ws); g.상자 = [r[0], r[1], r[3], r[4]] }
        g.설명 = '실제 좌표로 그렸지만 다른 평면도와 자리가 맞지 않음(수십 km 떨어짐) — 옆에 따로 둠 · 처음엔 꺼 둠'
      }
    }
    const 기준들 = 그룹.filter((g) => g.실좌표 && g.상자)
    /* 나머지는 으뜸 자리 오른쪽에 나란히 */
    let 오른 = -Infinity, 아래 = Infinity, 폭 = 0
    for (const g of 무리) { 오른 = Math.max(오른, g.상자[2]); 아래 = Math.min(아래, g.상자[1]); 폭 = Math.max(폭, g.상자[2] - g.상자[0]) }
    /* 떨어진 실제 좌표 도면은 맨 끝에 — 알맹이가 커도 다른 묶음 자리·틈을 밀어내지 않게 */
    const 나머지 = [...그룹.filter((g) => !g.실좌표 && g.상자 && !g.떨어짐), ...그룹.filter((g) => g.떨어짐 && g.상자)]
    if (!기준들.length && 나머지.length) { const g0 = 나머지.shift(); g0.기준 = true; g0.옮김 = [0, 0]; 오른 = g0.상자[2]; 아래 = g0.상자[1]; 폭 = g0.상자[2] - g0.상자[0] }
    for (const g of 기준들) { g.기준 = true; g.옮김 = [0, 0] }
    for (const g of 나머지) {
      const 틈 = Math.max(20000, 0.05 * 폭)
      const dx = 오른 + 틈 - g.상자[0], dy = 아래 - g.상자[1]
      옮기기(g.out, dx, dy)
      g.옮김 = [dx, dy]
      g.상자 = [g.상자[0] + dx, g.상자[1] + dy, g.상자[2] + dx, g.상자[3] + dy]
      오른 = g.상자[2]
      폭 = Math.max(폭, g.상자[2] - g.상자[0])
    }
    for (const g of 그룹) delete g.표본

    /* 합치기 */
    const out = new Map()
    const layerInfo = new Map()
    let stats = null
    for (const g of 그룹) 합치기(out, g.out)
    for (const x of 읽은) {
      for (const [k, v] of x.raw.layerInfo) if (!layerInfo.has(k)) layerInfo.set(k, v)
      if (!stats) stats = { ...x.raw.stats, skipped: { ...x.raw.stats.skipped }, unknown: { ...x.raw.stats.unknown } }
      else {
        stats.segs += x.raw.stats.segs; stats.pts += x.raw.stats.pts; stats.ents += x.raw.stats.ents
        stats.capped = stats.capped || x.raw.stats.capped; stats.depthCut += x.raw.stats.depthCut
        for (const [k, n] of Object.entries(x.raw.stats.skipped)) stats.skipped[k] = (stats.skipped[k] || 0) + n
        for (const [k, n] of Object.entries(x.raw.stats.unknown)) stats.unknown[k] = (stats.unknown[k] || 0) + n
      }
    }
    if (횡단) {
      layerInfo.set('땅 면', { rgb: [120, 160, 90] }); layerInfo.set('계획 면', { rgb: [90, 150, 220] })
      /* 0 레이어·틀 레이어는 횡단면도에서 대개 눈금 막대·표 선이라 처음엔 꺼 둡니다 — 횡단만 있을 때만(건물·구조물의 0 레이어는 벽일 수 있음) */
      if (그룹.every((g) => g.종류 === '횡단' || !g.켬)) {
        const 끌 = 그룹.find((g) => g.종류 === '횡단').끌층
        for (const ly of ['0', ...끌]) if (layerInfo.has(ly)) layerInfo.set(ly, { ...layerInfo.get(ly), off: true })
      }
    }
    if (!건물 && (평.length || Object.keys(높이).length) && !그룹.some((g) => g.종류 !== '평면')) {
      건물 = { 실패: true, 평면수: 평.length ? 평[0].제목.length : 0, 높이수: Object.keys(높이).length, 근거 }
    }
    self.postMessage({ type: 'prog', p: 0.93, msg: '화면에 올리는 중' })
    const r = finish(out, layerInfo, stats)
    r.건물 = 건물
    r.횡단 = 횡단
    r.구조 = 구조.length ? 구조 : null
    r.그룹 = 그룹.map((g, i) => ({ 번: i, 종류: g.종류, 파일: g.파일, 층들: g.층들, 켬: g.켬, 기준: !!g.기준, 실좌표: !!g.실좌표, 떨어짐: !!g.떨어짐, 옮김: g.옮김 || [0, 0], 설명: g.설명 }))
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
