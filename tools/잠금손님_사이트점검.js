/* 🔒 잠근 도구 11가지 «손님 화면» 사이트 점검 — G690 (2026-11-15) · G784b(11-19) 공무 올인원 더함
   소장님 11-15 「막아 놓은거 다시 점검해. 제발 확실히 해줘」 · 「내가 확인안하고 믿을 수 있게 해주면 안돼???」
   쓰는 곳: 아침 점검(예약) · 올린 뒤 사이트 확인 — 크롬 새 탭 https://k-conmap.com/version.json 에서 이 글을 javascript 로 그대로 넣음(«준비»)
     ① window.__잠금.찍기()          → «찍음 N»(소장님 저장값 사진 · KCMSNAP) — «STOP» 이면 멈추고 그대로 적음
     ② window.__잠금.모두([390])      → 뒤에서 돎(도구마다 20초쯤) · 바로 «시작»
     ③ window.__잠금.글()            → «진행 n/11» 또는 «끝 — 정상 11/11» / «⚠️ …» (30초마다 다시 부름)
     ④ await window.__잠금.되돌림()   → 저장값 되돌림(«ok») · kcmtest_ DB 지움 → 탭 닫기
   하는 일: 같은 출처 틀(iframe)에 앱을 띄워 «손님» 흉내(운영자 표식 · 열쇠말 · 로그인 가림) → 🧪 예시 → 본문 단추를 세 바퀴 모두 누름
     · 받기(a.download · blob) · 인쇄 · 새 창 · 파일 고르기 · 복사는 «막고 적기만» · 파이어베이스 쓰기 · 광고 · 쿠팡 막음 · 다른 쪽으로 가면 적고 돌아옴
     · 본 것: 받은 파일 0 · 인쇄 0 · 새 창 0 · 파일 창 0 · 복사 0 · Ctrl+P 막힘 · 예시 쪽 3까지 · «받기 모양» 단추 0 · 문의 단추 · 🔑 열림띠 없음 · 오류 0
   ⚠️ 틀 안 «kcm.» 저장은 틀 안 빈 저장 · IndexedDB 는 kcmtest_ 이름으로만 — 그래도 ①④ 는 꼭(다른 열쇠가 바뀔 수 있음). 받기 · 쓰기 · 광고 누름은 없음. */
(() => {
  const 도구 = [['/tools/wonclick', ['예시 서류 3가지 화면에서 보기']], ['/tools/sigong', []], ['/tools/anjeon', []], ['/tools/yuhae', []], ['/tools/jungcheo', ['③ 서류 한 벌']],
    ['/tools/colorplan', ['3층 학원', '피난 안내도']], ['/tools/cadfix', []], ['/tools/esc', []], ['/tools/hado-docs', []], ['/tools/gyeongri', ['거래처 원장']], ['/tools/gongmu', []]]
  const 막을 = (u, m) => { try { const h = new URL(String(u), location.href).hostname; if (/firebaseio\.com$|firebasedatabase\.app$/.test(h) && m !== 'GET') return true; if (/identitytoolkit\.googleapis\.com$|securetoken\.googleapis\.com$/.test(h)) return true; if (/google-analytics\.com$|googletagmanager\.com$|doubleclick\.net$|googlesyndication\.com$|adservice\.google|kakaocdn\.net$|ds\.kakao\.com$/.test(h)) return true; if (/(^|\.)coupang\.com$/.test(h)) return true; return false } catch (e) { return false } }
  const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
  const 받기모양 = /⬇|📥|📗|받기|엑셀로|^🔒\s*(PDF|한글|워드|엑셀|PNG|DXF|ZIP|ESC)|내 (평면도|도면) 넣기/
  let html = null
  const S = window.__잠금 = { 결과: [], 끝: false, 막음: 0 }
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
  S.점검 = async (길, 폭 = 390, 뒤 = []) => {
    if (!html) html = await (await fetch('/app.html', { cache: 'no-store' })).text()
    document.body.innerHTML = ''; document.body.style.margin = '0'
    const f = document.createElement('iframe'); f.style.cssText = `width:${폭}px;height:${폭 < 600 ? 844 : 900}px;border:0;display:block`; document.body.appendChild(f)
    const w = f.contentWindow, d = f.contentDocument
    d.open(); w.history.replaceState(null, '', 길)
    const 적 = { 받기: [], 인쇄: 0, 새창: [], 파일창: 0, 복사: 0, 이동: [], 오류: [] }
    w.addEventListener('error', (e) => { if (e.message) 적.오류.push(String(e.message).slice(0, 100)) }, true)
    w.addEventListener('unhandledrejection', (e) => 적.오류.push('R ' + String((e.reason && (e.reason.message || e.reason)) || '').slice(0, 100)))
    const og = w.Storage.prototype.getItem, 가림 = new Set(['kcm_op', 'kcm_lab_ok'])
    const 빈저장 = new Map(), 빈열쇠 = (k) => /^kcm\.|^kcm_(wc|gyeongri|sonik)/i.test(String(k))
    const os_ = w.Storage.prototype.setItem, or_ = w.Storage.prototype.removeItem
    w.Storage.prototype.getItem = function (k) { if (가림.has(k) || String(k).indexOf('firebase:authUser:') === 0) return null; if (this === w.localStorage && 빈열쇠(k)) return 빈저장.has(k) ? 빈저장.get(k) : null; return og.call(this, k) }
    w.Storage.prototype.setItem = function (k, v) { if (this === w.localStorage && 빈열쇠(k)) { 빈저장.set(String(k), String(v)); return } return os_.call(this, k, v) }
    w.Storage.prototype.removeItem = function (k) { if (this === w.localStorage && 빈열쇠(k)) { 빈저장.delete(String(k)); return } return or_.call(this, k) }
    try { w.sessionStorage.removeItem('kcm.손님보기') } catch (e) { /* */ }
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
    try { Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: async () => { 적.복사++ }, write: async () => { 적.복사++ }, readText: async () => '' } }) } catch (e) { /* */ }
    const oc = w.HTMLAnchorElement.prototype.click
    w.HTMLAnchorElement.prototype.click = function () { if (this.download || /^blob:|^data:/.test(this.href)) { 적.받기.push('a ' + (this.download || '').slice(0, 30)); return } return oc.apply(this, arguments) }
    const ic = w.HTMLInputElement.prototype.click
    w.HTMLInputElement.prototype.click = function () { if (this.type === 'file') { 적.파일창++; return } return ic.apply(this, arguments) }
    d.addEventListener('click', (e) => {
      const a = e.target && e.target.closest && e.target.closest('a')
      if (a && (a.download || /^blob:|^data:/.test(a.href || ''))) { e.preventDefault(); 적.받기.push('d ' + (a.download || '')) }
      else if (a && a.target === '_blank') { e.preventDefault(); 적.새창.push(String(a.href).slice(0, 60)) }
      const fi = e.target && e.target.closest && e.target.closest('input[type=file]')
      if (fi) { e.preventDefault(); 적.파일창++ }
    }, true)
    w.print = function () { 적.인쇄++ }
    w.open = (u) => { 적.새창.push(String(u).slice(0, 60)); return null }
    try { w.showOpenFilePicker = async () => { 적.파일창++; throw new Error('막음') }; w.showDirectoryPicker = async () => { 적.파일창++; throw new Error('막음') }; w.showSaveFilePicker = async () => { 적.받기.push('저장창'); throw new Error('막음') } } catch (e) { /* */ }
    w.alert = () => {}; w.confirm = () => false; w.prompt = () => null
    d.write(html); d.close()
    const t0 = Date.now()
    while (Date.now() - t0 < 20000) { if (d.querySelector('h1')) break; await 쉬어(300) }
    await 쉬어(2500)
    const 판 = () => d.querySelector('main.shell') || d.body
    const 보임 = (el) => { const r = el.getBoundingClientRect(); return el.offsetParent !== null && r.width > 0 && r.height > 0 }
    const 밖 = (el) => !!el.closest('.topbar, .tabbar, .railnav, .crumbs, footer, .noti-band, .cn-mini, aside')
    const 단추들 = () => [...판().querySelectorAll('button, [role=button], a.btn, summary')].filter((el) => 보임(el) && !밖(el))
    const 이름 = (el) => (el.innerText || el.getAttribute('aria-label') || el.title || '').replace(/\s+/g, ' ').trim().slice(0, 40)
    const r = { 길, 폭, 잠금상자: !!d.querySelector('.sg-lock'), 열림띠: !!d.querySelector('.kcm-열림띠') }
    const 예시 = 단추들().find((b) => b.tagName === 'BUTTON' && /예시/.test(이름(b)) && !/보기만/.test(이름(b)))
    if (예시) { 예시.click(); await 쉬어(3000) }
    const 누름 = new Set()
    let 누른수 = 0
    for (let 바퀴 = 0; 바퀴 < 3; 바퀴++) {
      let 새 = 0
      for (const b of 단추들()) {
        const 키 = b.tagName + '|' + 이름(b)
        if (누름.has(키)) continue
        누름.add(키); 새++
        if (b.tagName === 'A' && !/blob:|data:/.test(b.href || '') && !b.download) continue
        if (/열기$/.test(이름(b)) && d.querySelector('input[type=password]')) continue
        const 앞길 = w.location.pathname
        try { b.click() } catch (e) { 적.오류.push('click ' + 이름(b)) }
        누른수++
        await 쉬어(350)
        if (w.location.pathname !== 앞길) { 적.이동.push(이름(b) + ' → ' + w.location.pathname); w.history.pushState(null, '', 앞길); w.dispatchEvent(new w.PopStateEvent('popstate')); await 쉬어(1500) }
        if (누른수 > 160) break
      }
      if (!새 || 누른수 > 160) break
      await 쉬어(600)
    }
    for (const g of 뒤) {
      const e = [...판().querySelectorAll('button, [role=tab]')].find((x) => x.offsetParent && x.innerText.replace(/\s+/g, ' ').includes(g))
      if (e) { e.click(); await 쉬어(2500) }
    }
    const 전인쇄 = 적.인쇄
    d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'p', code: 'KeyP', ctrlKey: true, bubbles: true, cancelable: true }))
    await 쉬어(400)
    const 수 = (q) => [...판().querySelectorAll(q)].filter((e) => e.offsetParent !== null).length
    const 받기단추 = [...판().querySelectorAll('button, a.btn')].filter((e) => e.offsetParent !== null && !밖(e) && !/^\/contact\?k=cn/.test(e.getAttribute('href') || '')).map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter((x) => 받기모양.test(x))
    Object.assign(r, {
      누른수, 받기: 적.받기.length, 인쇄: 적.인쇄, 새창: 적.새창.length, 파일창: 적.파일창, 복사: 적.복사, 컨트롤P: 적.인쇄 > 전인쇄 ? '인쇄됨' : '막힘', 이동: 적.이동.slice(0, 3), 오류: 적.오류.slice(0, 3),
      고르기: [...판().querySelectorAll('.sg-pager select')].map((s) => s.options.length), 엑셀장: 수('.xv-장들 button'), ESC탭: 수('.esc-tab'), 원장곳: 수('.gr-chips .chip'),
      받기단추, 문의: 판().querySelectorAll('a[href^="/contact?k=cn"]').length,
    })
    r.정상 = r.잠금상자 && !r.열림띠 && r.받기 === 0 && r.인쇄 === 0 && r.새창 === 0 && r.파일창 === 0 && r.복사 === 0 && r.컨트롤P === '막힘' && !r.이동.length && !r.오류.length &&
      r.고르기.every((n) => n <= 3) && r.엑셀장 <= 3 && r.ESC탭 <= 3 && r.원장곳 <= 2 && !받기단추.length && r.문의 >= 1
    return r
  }
  S.모두 = (폭들 = [390]) => {
    S.결과 = []; S.끝 = false
    ;(async () => {
      for (const 폭 of 폭들) for (const [길, 뒤] of 도구) {
        try { S.결과.push(await S.점검(길, 폭, 뒤)) } catch (e) { S.결과.push({ 길, 폭, 정상: false, 오류: [String(e).slice(0, 100)] }) }
      }
      S.끝 = true
    })()
    return '시작 ' + 폭들.length * 도구.length
  }
  S.글 = () => {
    const 맞 = S.결과.filter((x) => x.정상).length, 다 = S.결과.length
    const 틀 = S.결과.filter((x) => !x.정상).map((x) => `${x.길}(${x.폭}) ${JSON.stringify({ 받기: x.받기, 인쇄: x.인쇄, 새창: x.새창, 파일창: x.파일창, 복사: x.복사, P: x.컨트롤P, 고르기: x.고르기, 엑셀장: x.엑셀장, ESC탭: x.ESC탭, 원장곳: x.원장곳, 받기단추: x.받기단추, 문의: x.문의, 잠금상자: x.잠금상자, 열림띠: x.열림띠, 이동: x.이동, 오류: x.오류 })}`)
    return (S.끝 ? '끝 — ' : `진행 ${다}/${도구.length} — `) + (틀.length ? `⚠️ 틀림 ${틀.length}: ` + 틀.join(' / ') : `정상 ${맞}/${다}`) + ` · 단추 ${S.결과.reduce((a, x) => a + (x.누른수 || 0), 0)}개 누름 · 쓰기 막음 ${S.막음}`
  }
  return '준비'
})()
