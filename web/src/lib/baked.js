/* 이 문서가 «지금 주소를 위해 미리 구워진 HTML»인지 판별합니다. (2026-09-07)

   ★ 왜 필요한가 - 실제로 난 사고
     robots.txt 가 /data/ 를 막고 있어서 구글 렌더러가 기관·업체 자료를 못 받았습니다.
     그러면 getAgency() 가 null 을 주고, 화면은 그걸 «그런 기관이 없다» 로 읽어
     제목·설명을 대체 문구로 갈아 끼우고 **noindex** 를 걸었습니다.
     미리 구운 좋은 제목·설명·본문이 통째로 지워진 것입니다.
     → «못 받은 것» 과 «없는 것» 은 다릅니다. 구워진 페이지면 지우지 않습니다.

   판별은 prerender.py 가 넣어 둔 canonical 로 합니다.
   ⚠️ React 가 canonical 을 고치기 «전» 에 읽어야 하므로, 모듈을 처음 부를 때 한 번만 읽습니다.
      (SPA 로 이동해 온 경우엔 앞 페이지의 canonical 이라 지금 주소와 안 맞고, 그게 정답입니다)
*/
const BAKED = (() => {
  try {
    const h = document.querySelector('link[rel="canonical"]')?.getAttribute('href')
    if (!h) return ''
    return decodeURIComponent(new URL(h, location.origin).pathname)
  } catch {
    return ''
  }
})()

/** path 예: '/agency/충청북도 청주시' (디코드된 그대로) */
export const wasBaked = (path) => !!BAKED && BAKED === path
export const bakedPath = () => BAKED
