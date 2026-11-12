/* 🤝 G662 (2026-11-13) 공사 연결 · 서류 작성대행 띠 — 정적 쪽(소개 · 개인정보 · 약관 · 문의 · ShareOne 설명서)
   소장님 11-13 「모든 페이지에 넣고」 「공사 연결 및 서류 작성은 항상 보이게… 모든 페이지에 달기」
   · 사이트(앱) 쪽은 공사연결띠.jsx 가 그림 — 이 파일은 앱 밖의 정적 쪽(.html)에만 <script src="/cn-band.js" defer>
   · 맨 위에 한 줄 · 내려도 늘 보임(sticky) · 닫기 없음 · 진초록(앱 띠와 같은 색) · 누르면 /contact?k=cn(상담)
   · 상담 쪽(/contact?k=cn) 자신에는 안 붙임 · 로봇(자동 브라우저) · 인쇄엔 안 나옴
   · 숨은 셈 |공사연결|보임(앱과 같은 열쇠 · 이 탭에서 한 번) · |공사연결|정적누름 — 소장님 브라우저(kcm_op) · 자동 브라우저는 안 셈 */
(function () {
  try {
    var ua = navigator.userAgent || ''
    if (/bot|crawl|spider|slurp|headless|lighthouse/i.test(ua)) return
    var 길 = location.pathname.replace(/\.html$/, '')
    if (길 === '/contact' && /[?&]k=cn(&|$)/.test(location.search)) return
    if (document.getElementById('cn-band')) return
    var 셈 = function (k) {
      try {
        if (navigator.webdriver) return
        if (localStorage.getItem('kcm_op')) return
        var url = 'https://k-conmap-default-rtdb.firebaseio.com/dl/p/' + encodeURIComponent(k) + '.json'
        return fetch(url, { headers: { 'X-Firebase-ETag': 'true' }, cache: 'no-store' }).then(function (r) {
          if (!r.ok) return
          var tag = r.headers.get('ETag')
          return r.json().then(function (v) { return fetch(url, { method: 'PUT', headers: { 'if-match': tag }, body: String((Number(v) || 0) + 1) }) })
        }).catch(function () { /* 셈 때문에 막히면 안 됨 */ })
      } catch (e) { /* 없음 */ }
    }
    var st = document.createElement('style')
    st.textContent =
      '#cn-band{position:sticky;top:0;z-index:50;display:block;text-decoration:none;color:#fff;background:linear-gradient(90deg,#047857,#0f766e);' +
      'border-bottom:1px solid #065f46;box-shadow:0 3px 10px rgba(4,120,87,.28);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic",sans-serif}' +
      '#cn-band .i{max-width:900px;margin:0 auto;min-height:38px;padding:4px 14px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
      '#cn-band .t{min-width:0;font-size:13.5px;line-height:1.4}#cn-band b{color:#fff}#cn-band .s{color:#d1fae5;font-size:12.5px}' +
      '#cn-band .g{flex:none;background:#fff;color:#047857;font-weight:800;font-size:12.5px;padding:4px 11px;border-radius:999px;white-space:nowrap}' +
      '@media (max-width:480px){#cn-band .s{display:none}#cn-band .i{padding:4px 10px}}@media print{#cn-band{display:none!important}}'
    document.head.appendChild(st)
    var a = document.createElement('a')
    a.id = 'cn-band'
    a.href = '/contact?k=cn'
    a.setAttribute('role', 'note')
    a.setAttribute('aria-label', '전국 공사 연결 · 건설 서류 작성대행 — 상담 · 견적 받기')
    a.innerHTML = '<span class="i"><span class="t"><b>🤝 전국 공사 연결 · 📄 건설 서류 작성대행</b><span class="s"> — 견본 먼저 보시고 최저가로</span></span><span class="g">상담 · 견적 받기 ▸</span></span>'
    a.addEventListener('click', function (e) {
      e.preventDefault()
      var 감 = false
      var 가기 = function () { if (감) return; 감 = true; location.href = '/contact?k=cn' }
      var p = 셈('|공사연결|정적누름')
      if (p && p.then) { p.then(가기, 가기); setTimeout(가기, 700) } else 가기()
    })
    document.body.insertBefore(a, document.body.firstChild)
    try { if (!sessionStorage.getItem('kcm.cn.seen')) { sessionStorage.setItem('kcm.cn.seen', '1'); 셈('|공사연결|보임') } } catch (e) { /* 이번만 */ }
  } catch (e) { /* 띠 때문에 쪽이 멈추면 안 됨 */ }
})()
