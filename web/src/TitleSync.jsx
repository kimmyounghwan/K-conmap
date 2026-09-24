/**
 * 🏷️ 브라우저 탭 제목 맞추기 (2026-09-24)
 *
 * 소장님: 「다시 한번 사이트 전체 점검 해줘」 → 「고쳐야 하는 거면 고쳐줘」
 *   화면 안에서 옮겨 다니면 1순위·공고·도구·서식·구인구직·분석·입찰 알아보기 쪽은
 *   탭 제목이 «앞 쪽 제목» 그대로 남았습니다 (업체 성적표 → 입찰 알아보기 = 「업체 성적표 만들기」).
 *   그 쪽들이 제목을 스스로 안 바꾸기 때문입니다.
 *
 * ■ 제목을 여기 따로 적지 않습니다.
 *   주소별 HTML(prerender.py 가 굽는 것)에 이미 맞는 <title> 이 있습니다 — 검색엔진이 보는 그 제목.
 *   그 파일의 «앞 4KB» 만 받아 <title> 을 읽습니다 (제목은 220바이트쯤에 있습니다).
 *   새 화면을 만들어도 여기를 고칠 필요가 없습니다. 굽지 않는 주소는 첫 화면 제목이 나옵니다.
 *
 * ■ 제목을 스스로 정하는 쪽(공내역서 채우기·성적표·공고 상세·업체·기관·없는 페이지 …)이 늘 이깁니다.
 *   - 이 부품은 App 맨 위에 둡니다 → 이 효과가 쪽들의 효과보다 «먼저» 돕니다.
 *   - 받아 온 제목은 «탭 제목이 아직 앞 쪽 제목 그대로일 때만» 넣습니다.
 *
 * ■ 한 번 받은 제목은 기억합니다 (뒤로가기·다시 오기는 받지 않음).
 *   받기에 실패하면 앞 쪽 제목 대신 「K-건설맵」 으로 둡니다.
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const 기억 = new Map()   // 주소 → 제목
const 기본 = 'K-건설맵'   // 제목을 못 받았을 때

function 풀기(s) {
  // &amp; &#x27; 같은 것을 글자로
  const t = document.createElement('textarea')
  t.innerHTML = s
  return t.value.trim()
}

export default function TitleSync() {
  const { pathname } = useLocation()
  const 처음 = useRef(true)

  useEffect(() => {
    if (처음.current) {
      // 첫 화면은 주소별 HTML 이 이미 맞는 제목을 줍니다 — 기억만 해 둡니다
      처음.current = false
      if (document.title) 기억.set(pathname, document.title)
      return undefined
    }
    const 옛제목 = document.title
    let 살 = true
    const 넣기 = (t) => { if (살 && t && document.title === 옛제목) document.title = t }

    if (기억.has(pathname)) {
      넣기(기억.get(pathname))
      return () => { 살 = false }
    }
    fetch(pathname, { headers: { Range: 'bytes=0-4095' } })
      .then((r) => (r.ok ? r.text() : ''))
      .then((h) => {
        const m = /<title>([^<]*)<\/title>/i.exec(h || '')
        const t = m ? 풀기(m[1]) : ''
        if (!t) { 넣기(기본); return }
        기억.set(pathname, t)
        넣기(t)
      })
      // 받기 실패 — 앞 쪽 제목이 남는 것보다 사이트 이름이 낫습니다 (기억하지는 않음)
      .catch(() => 넣기(기본))
    return () => { 살 = false }
  }, [pathname])

  return null
}
