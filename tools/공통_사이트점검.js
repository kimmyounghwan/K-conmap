/* 🧭 모든 탭 «공통» 사이트 점검 — G691 (2026-11-15)
   소장님 11-15 20:3x 「아래로 내리면 공사연결 띠가 사라져」 · 「고쳐줘」 · 「한가지를 올리거나 수정하면 다른게 틀어져. 항상 그래 . 방안 마련해서 재발되지 않게 해」
   쓰는 곳: «올린 뒤 실제 사이트 확인»(모든 G — 바꾼 화면 확인과 따로 · 꼭) · 아침 점검(예약 ⑦)
     크롬 새 탭 https://k-conmap.com/version.json 에서 이 글을 javascript 로 그대로 넣음(«준비»)
     ① window.__공통.찍기()          → «찍음 N»(저장값 사진 · KCMSNAP) — «STOP» 이면 멈추고 그대로 적음
     ② window.__공통.모두([390, 1280]) → 뒤에서 돎(쪽마다 8초쯤 · 14쪽 × 폭) · 바로 «시작»
     ③ window.__공통.글()            → «진행 n/28 — …» 또는 «끝 — 공통 정상 28/28 …» / «⚠️ 틀림 …» (30초마다 다시 부름)
     ④ await window.__공통.되돌림()   → 저장값 되돌림(«ok») · kcmtest_ DB 지움 → 탭 닫기
   하는 일: 같은 출처 틀(iframe)에 앱을 «손님» 으로 띄워(운영자 표식 · 열쇠말 · 로그인 가림 · 쓰기 · 광고 · 쿠팡 막음) 모든 탭에 늘 있어야 하는 것을 잼
     · 머리줄(맨 위 붙음) · 🤝 공사연결 큰 띠(문의 고리) · 쿠팡 맨 위 줄 다음 자리 · 아래 탭(폰) / 위 가로 메뉴(PC) · 바닥글 · 옆으로 넘침 없음 · 오류 0
     · 맨 위 → 맨 아래로 내리며(그림 두 번 기다림 — 화면이 바쁠 때 재는 쪽이 늦지 않게) 머리줄이 늘 맨 위 · 큰 띠가 머리줄 밑으로 지나가면 작은 띠가 보이고 덮이지 않음
   ⚠️ 아이폰만의 어긋남(글자판 오류 꼴 — lib/아이폰자리.js)은 크롬으로 못 봄 → dl/p 의 |아이폰자리|진단-… 숫자로 봄(아침 점검). */
(() => {
  const 쪽들 = ['/', '/first', '/live', '/svc', '/goods', '/tools', '/forms', '/naeyeok', '/jeoksan', '/my', '/qna', '/analysis', '/change', '/cad']
  const 막을 = (u, m) => { try { const h = new URL(String(u), location.href).hostname; if (/firebaseio\.com$|firebasedatabase\.app$/.test(h) && m !== 'GET') return true; if (/identitytoolkit\.googleapis\.com$|securetoken\.googleapis\.com$/.test(h)) return true; if (/google-analytics\.com$|googletagmanager\.com$|doubleclick\.net$|googlesyndication\.com$|adservice\.google|kakaocdn\.net$|ds\.kakao\.com$/.test(h)) return true; if (/(^|\.)coupang\.com$/.test(h)) return true; return false } catch (e) { return false } }
  const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
  let html = null
  const S = window.__공통 = { 결과: [], 끝: false, 막음: 0, 다: 0 }
  S.찍기 = () => { const K = 'KCMSNAP'; if (localStorage.getItem(K)) return 'STOP: KCMSNAP 이 이미 있음 — 먼저 살펴봄'; const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k) } localStorage.setItem(K, JSON.stringify({ t: Date.now(), n: Object.keys(o).length, o })); return '찍음 ' + Object.keys(o).length }
  S.되돌림 = async () => {
    document.body.innerHTML = ''
    const 이름 = (await indexedDB.databases()).map((x) => x.name).filter((n) => /^kcmtest_/.test(n))
    for (const n of 이름) await new Promise((r) => { const q = indexedDB.deleteDatabase(n); q.onsuccess = q.onerror = q.onblocked = () => r() })
    const K = 'KCMSNAP'; const raw = localStorage.getItem(K); if (!raw) return 'STOP: KCMSNAP 없음 · DB 지움 ' + 이름.length
    const s = JSON.parse(raw), o = s.o; const 지금 = []; for (let i = 0; i < localStorage.length; i++) 지금.push(localStorage.key(i))
    let 지움 = 0, 고침 = 0
    for (const k of 지금) if (k !== K && !(k in o)) { localStorage.removeItem(k); 지움++ }
    for (const [k, v] of Object.entries(o)) if (localStorage.getItem(k) !== v) { localStorage.setItem(k, v); 고침++ }
    let ok = true; for (const [k, v] of Object.entries(o)) if (localStorage.getItem(k) !== v) ok = false
    if (ok) localStorage.removeItem(K)
    return JSON.stringify({ ok, 지움, 고침, 원래: s.n, 지금: localStorage.length, DB지움: 이름.length })
  }
  /* 앱을 손님으로 틀에 띄움 — 잠금손님_사이트점검.js 와 같은 막음(쓰기 · 광고 · 쿠팡 · 로그인 · 운영자 표식) */
  S.띄움 = async (길, 폭) => {
    if (!html) html = await (await fetch('/app.html', { cache: 'no-store' })).text()
    document.body.innerHTML = ''; document.body.style.margin = '0'
    const 높이 = 폭 < 600 ? 844 : 900
    const f = document.createElement('iframe'); f.style.cssText = `width:${폭}px;height:${높이}px;border:0;display:block`; document.body.appendChild(f)
    const w = f.contentWindow, d = f.contentDocument
    d.open(); w.history.replaceState(null, '', 길)
    const 오류 = []
    w.addEventListener('error', (e) => { if (e.message && !/ResizeObserver loop/.test(e.message)) 오류.push(String(e.message).slice(0, 100)) }, true)
    w.addEventListener('unhandledrejection', (e) => 오류.push('R ' + String((e.reason && (e.reason.message || e.reason)) || '').slice(0, 100)))
    const og = w.Storage.prototype.getItem, 가림 = new Set(['kcm_op', 'kcm_lab_ok'])
    const 빈저장 = new Map(), 빈열쇠 = (k) => /^kcm\.|^kcm_(wc|gyeongri|sonik)/i.test(String(k))
    /* 세션 저장(sessionStorage)은 쪽마다 새 빈 저장 — 틀은 탭의 세션 저장을 같이 써서, 앞 쪽이 남긴 «내린 자리» 를 다음 쪽이 되살려 맨 위를 못 재던 것(모의 빌드에서 찾음) */
    const 빈세션 = new Map()
    const os_ = w.Storage.prototype.setItem, or_ = w.Storage.prototype.removeItem
    w.Storage.prototype.getItem = function (k) { if (this === w.sessionStorage) return 빈세션.has(String(k)) ? 빈세션.get(String(k)) : null; if (가림.has(k) || String(k).indexOf('firebase:authUser:') === 0) return null; if (this === w.localStorage && 빈열쇠(k)) return 빈저장.has(k) ? 빈저장.get(k) : null; return og.call(this, k) }
    w.Storage.prototype.setItem = function (k, v) { if (this === w.sessionStorage) { 빈세션.set(String(k), String(v)); return } if (this === w.localStorage && 빈열쇠(k)) { 빈저장.set(String(k), String(v)); return } return os_.call(this, k, v) }
    w.Storage.prototype.removeItem = function (k) { if (this === w.sessionStorage) { 빈세션.delete(String(k)); return } if (this === w.localStorage && 빈열쇠(k)) { 빈저장.delete(String(k)); return } return or_.call(this, k) }
    const idb = w.indexedDB, oo = idb.open.bind(idb), od = idb.deleteDatabase.bind(idb)
    idb.open = function (n, v) { if (n === 'firebaseLocalStorageDb') n = 'kcmtest_막음'; return v === undefined ? oo('kcmtest_' + n) : oo('kcmtest_' + n, v) }
    idb.deleteDatabase = function (n) { return od('kcmtest_' + n) }
    const of = w.fetch.bind(w)
    w.fetch = (input, init = {}) => { const u = typeof input === 'string' ? input : (input && input.url) || String(input); const m = String((init && init.method) || (input && input.method) || 'GET').toUpperCase(); if (막을(u, m)) { S.막음++; return Promise.resolve(new w.Response('null', { status: 200, headers: { 'content-type': 'application/json' } })) } return of(input, init) }
    const xo = w.XMLHttpRequest.prototype.open, xs = w.XMLHttpRequest.prototype.send
    w.XMLHttpRequest.prototype.open = function (m, u) { this.__m = String(m).toUpperCase(); this.__u = String(u); return xo.apply(this, arguments) }
    w.XMLHttpRequest.prototype.send = function () { if (막을(this.__u, this.__m)) { S.막음++; return } return xs.apply(this, arguments) }
    const ws = w.WebSocket.prototype.send
    w.WebSocket.prototype.send = function (x) { if (typeof x === 'string' && /"a":"(p|m|o|om)"/.test(x)) { S.막음++; return } return ws.apply(this, arguments) }
    try { w.navigator.sendBeacon = () => true } catch (e) { /* */ }
    try { Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: async () => {}, write: async () => {}, readText: async () => '' } }) } catch (e) { /* */ }
    w.print = function () {}; w.open = () => null; w.alert = () => {}; w.confirm = () => false; w.prompt = () => null
    d.write(html); d.close()
    const t0 = Date.now()
    while (Date.now() - t0 < 20000) { if (d.querySelector('main.shell h1, main.shell h2, main.shell .card')) break; await 쉬어(300) }
    await 쉬어(2500)
    return { f, w, d, 오류, 높이 }
  }
  const 두그림 = (w) => new Promise((r) => w.requestAnimationFrame(() => w.requestAnimationFrame(() => setTimeout(r, 60))))
  const 보임 = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && el.ownerDocument.defaultView.getComputedStyle(el).display !== 'none' }
  S.점검 = async (길, 폭 = 390) => {
    const { w, d, 오류, 높이 } = await S.띄움(길, 폭)
    const 틀림 = []
    const 머리 = d.querySelector('.topbar'), 큰 = d.querySelector('.noti-band.cn'), 작은 = d.querySelector('.cn-mini'), 쿠팡 = d.querySelector('aside[data-cpg-at="위"]')
    if (!머리) 틀림.push('머리줄 없음')
    if (!보임(큰)) 틀림.push('공사연결 큰 띠 없음')
    else if (!큰.querySelector('a[href^="/contact?k=cn"]') || !/공사 연결/.test(큰.innerText)) 틀림.push('큰 띠 글 · 고리 다름')
    if (!작은) 틀림.push('작은 띠 칸 없음')
    if (큰 && 쿠팡 && !(쿠팡.compareDocumentPosition(큰) & 4)) 틀림.push('큰 띠가 쿠팡 맨 위 줄 앞')
    if (폭 < 600) { const t = d.querySelector('.tabbar'); if (!보임(t)) 틀림.push('아래 탭 없음'); else { const b = Math.round(t.getBoundingClientRect().bottom); if (Math.abs(b - 높이) > 2) 틀림.push('아래 탭 바닥 ' + b + ' ≠ ' + 높이) } }
    else if (!보임(d.querySelector('.railnav'))) 틀림.push('위 가로 메뉴 없음')
    if (!d.querySelector('footer')) 틀림.push('바닥글 없음')
    const 넘침 = d.documentElement.scrollWidth - 폭
    if (넘침 > 1) 틀림.push('옆으로 넘침 ' + 넘침 + 'px')
    /* 내려 보기 — 맨 위 · 큰 띠 바로 밑 · 15 % · 30 % · 50 % · 75 % · 맨 아래 */
    const 끝 = Math.max(0, d.documentElement.scrollHeight - 높이)
    const 띠밑 = 큰 ? Math.round(큰.getBoundingClientRect().bottom + w.scrollY + 40) : 0
    const 자리들 = [...new Set([0, 띠밑, ...[0.15, 0.3, 0.5, 0.75, 1].map((r) => r * 끝)].map((y) => Math.min(끝, Math.max(0, Math.round(y)))))]
    let 잰 = 0, 작은켬 = 0
    for (const y of 자리들) {
      w.scrollTo(0, y); await 두그림(w)
      잰++
      if (!머리 || !큰 || !작은) continue
      const mr = 머리.getBoundingClientRect(), br = 큰.getBoundingClientRect()
      if (Math.abs(mr.top) > 1) 틀림.push(`y${Math.round(w.scrollY)} 머리줄이 맨 위가 아님(${Math.round(mr.top)})`)
      const 지나감 = br.bottom <= mr.bottom + 1
      const 켬 = d.documentElement.classList.contains('cn-mini-on')
      if (지나감 !== 켬) { 틀림.push(`y${Math.round(w.scrollY)} 작은 띠 ${켬 ? '켜짐' : '꺼짐'}(큰 띠 ${지나감 ? '지나감' : '보임'})`); continue }
      if (켬) {
        작은켬++
        const r = 작은.getBoundingClientRect()
        if (!(r.height >= 30 && Math.abs(r.top - mr.bottom) <= 2)) { 틀림.push(`y${Math.round(w.scrollY)} 작은 띠 자리 ${Math.round(r.top)}·${Math.round(r.height)}`); continue }
        const el = d.elementFromPoint(Math.min(r.right - 4, 폭 / 2), r.top + r.height / 2)
        if (!el || !el.closest('.cn-mini')) 틀림.push(`y${Math.round(w.scrollY)} 작은 띠가 덮임(${el ? (el.className || el.tagName) : '없음'})`.slice(0, 120))
      }
    }
    if (끝 > 400 && !작은켬) 틀림.push('내려도 작은 띠가 한 번도 안 보임')
    오류.slice(0, 3).forEach((e) => 틀림.push('오류 ' + e))
    return { 길, 폭, 본길: w.location.pathname, 잰, 작은켬, 높이: d.documentElement.scrollHeight, 틀림: 틀림.slice(0, 8), 정상: !틀림.length }
  }
  S.모두 = (폭들 = [390, 1280]) => {
    S.결과 = []; S.끝 = false; S.다 = 폭들.length * 쪽들.length
    ;(async () => {
      for (const 폭 of 폭들) for (const 길 of 쪽들) {
        try { S.결과.push(await S.점검(길, 폭)) } catch (e) { S.결과.push({ 길, 폭, 정상: false, 틀림: [String(e).slice(0, 100)] }) }
      }
      document.body.innerHTML = ''
      S.끝 = true
    })()
    return '시작 ' + S.다
  }
  S.글 = () => {
    const 맞 = S.결과.filter((x) => x.정상).length, 다 = S.결과.length
    const 틀 = S.결과.filter((x) => !x.정상).map((x) => `${x.길}(${x.폭}) ${x.틀림.join(' · ')}`)
    const 잰 = S.결과.reduce((a, x) => a + (x.잰 || 0), 0), 켬 = S.결과.reduce((a, x) => a + (x.작은켬 || 0), 0)
    return (S.끝 ? '끝 — ' : `진행 ${다}/${S.다} — `) + (틀.length ? `⚠️ 틀림 ${틀.length}: ` + 틀.join(' / ') : `공통 정상 ${맞}/${다}`) + ` · 내려 본 자리 ${잰} · 작은 띠 ${켬} · 쓰기 막음 ${S.막음}`
  }
  return '준비'
})()
