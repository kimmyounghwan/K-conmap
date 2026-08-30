import { useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * SPA 라 진짜 404 상태코드를 줄 수 없으므로 noindex 로 막는다.
 * 언마운트할 때 robots 태그를 반드시 제거해야 한다 —
 * 안 그러면 다음에 이동한 정상 페이지까지 noindex 가 걸린다.
 */
export default function NotFound() {
  useEffect(() => {
    const m = document.createElement('meta')
    m.name = 'robots'
    m.content = 'noindex'
    document.head.appendChild(m)
    const prev = document.title
    document.title = '페이지를 찾을 수 없습니다 | K-건설맵'
    return () => { m.remove(); document.title = prev }
  }, [])

  return (
    <div className="empty" style={{ paddingTop: 80 }}>
      <div className="big">🚧</div>
      찾으시는 페이지가 없습니다.<br />
      <Link to="/" style={{ color: 'var(--accent)', fontWeight: 700 }}>1순위 현황판으로 →</Link>
    </div>
  )
}
