# -*- coding: utf-8 -*-
"""🗺 이용자 지도 바탕 — 한국 시도 윤곽 + 시·군 161곳 자리 (2026-10-02 · G114)

  소장님: 「건설맵 이용자 지도 만들 수 있어? 실시간으로」 → 「건설맵 사이트에 띄우는 거지 · 다 볼 수 있게」
          「숫자는 나중에 … 지도만 띄우고, 표시가 나오게」 → (클로드 의견) 사랑방 맨 위 · 숫자 없이 점만

  ■ 바탕 자료: npm «korea-sigungu-geocoding» 1.3.1 (MIT) 의 dist/geoData.js — 시군구 252곳 경계(GeoJSON, 경위도)
      한 번만 돌려 web/src/data/한국지도.json 을 만들어 저장소에 둡니다(화면은 이 JSON 만 읽음 · 인터넷 안 씀).
      다시 만들 때: npm pack korea-sigungu-geocoding@1.3.1 → 풀기 → node 로 geoData 를 JSON 으로 →
                   python tools/지도만들기.py <geo.json> web/src/data/한국지도.json   (shapely 필요)
  ■ 시·군 묶기: 광역시 · 특별시 · 세종은 통째로 한 곳. 도는 시군구 코드 앞 네 자리로 구를 시에 붙임
      (구만 있는 용인 · 부천 · 고양 · 청주는 코드로 이름을 채움 · 증평군 43745 는 영동군 43740 과 앞 네 자리가 같아 통째 코드로).
  ■ 영어 이름: 애널리틱스 실시간 «도시» 가 주는 이름(예: Anyang-si · Bucheon-si · Goyang-si · Gwangju — 2026-10-02 화면에서 확인)을
      국어의 로마자 표기법 이름표(아래 영)로 맞춥니다. «-si · -gun» 은 화면(tools/이용자지도.jsx)이 떼고 견줍니다.
      ⚠️ 경기 광주시 = «Gwangju-si» (광주광역시 = «Gwangju») — 떼기 전에 먼저 봅니다. 고성(강원 · 경남)은 같은 이름이라 경남으로.
  ■ 그림: 경도 × cos(36°) · 위도를 그대로 펴서(정거 원통) 100배 — 점과 윤곽이 같은 식이라 어긋나지 않습니다.
      윤곽은 0.012° 로 줄이고 작은 섬은 뺍니다(울릉군 · 제주는 남김).
"""
import json
import math
import sys

from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.ops import unary_union

광역 = {'11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종'}
시도 = {'11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종',
        '41': '경기', '43': '충북', '44': '충남', '46': '전남', '47': '경북', '48': '경남', '50': '제주', '51': '강원', '52': '전북'}
구만 = {'4146': '용인시', '4119': '부천시', '4128': '고양시', '4311': '청주시'}

# 국어의 로마자 표기법 — 시 · 군 이름(시 · 군 뺀 것). 광역시는 시도 이름
영 = {
    '서울': 'seoul', '부산': 'busan', '대구': 'daegu', '인천': 'incheon', '광주': 'gwangju', '대전': 'daejeon', '울산': 'ulsan', '세종': 'sejong',
    '수원': 'suwon', '성남': 'seongnam', '의정부': 'uijeongbu', '안양': 'anyang', '부천': 'bucheon', '광명': 'gwangmyeong', '평택': 'pyeongtaek',
    '동두천': 'dongducheon', '안산': 'ansan', '고양': 'goyang', '과천': 'gwacheon', '구리': 'guri', '남양주': 'namyangju', '오산': 'osan',
    '시흥': 'siheung', '군포': 'gunpo', '의왕': 'uiwang', '하남': 'hanam', '용인': 'yongin', '파주': 'paju', '이천': 'icheon', '안성': 'anseong',
    '김포': 'gimpo', '화성': 'hwaseong', '경기광주': 'gwangjusi', '양주': 'yangju', '포천': 'pocheon', '여주': 'yeoju', '연천': 'yeoncheon',
    '가평': 'gapyeong', '양평': 'yangpyeong',
    '청주': 'cheongju', '충주': 'chungju', '제천': 'jecheon', '보은': 'boeun', '옥천': 'okcheon', '영동': 'yeongdong', '증평': 'jeungpyeong',
    '진천': 'jincheon', '괴산': 'goesan', '음성': 'eumseong', '단양': 'danyang',
    '천안': 'cheonan', '공주': 'gongju', '보령': 'boryeong', '아산': 'asan', '서산': 'seosan', '논산': 'nonsan', '계룡': 'gyeryong',
    '당진': 'dangjin', '금산': 'geumsan', '부여': 'buyeo', '서천': 'seocheon', '청양': 'cheongyang', '홍성': 'hongseong', '예산': 'yesan', '태안': 'taean',
    '목포': 'mokpo', '여수': 'yeosu', '순천': 'suncheon', '나주': 'naju', '광양': 'gwangyang', '담양': 'damyang', '곡성': 'gokseong',
    '구례': 'gurye', '고흥': 'goheung', '보성': 'boseong', '화순': 'hwasun', '장흥': 'jangheung', '강진': 'gangjin', '해남': 'haenam',
    '영암': 'yeongam', '무안': 'muan', '함평': 'hampyeong', '영광': 'yeonggwang', '장성': 'jangseong', '완도': 'wando', '진도': 'jindo', '신안': 'sinan',
    '포항': 'pohang', '경주': 'gyeongju', '김천': 'gimcheon', '안동': 'andong', '구미': 'gumi', '영주': 'yeongju', '영천': 'yeongcheon',
    '상주': 'sangju', '문경': 'mungyeong', '경산': 'gyeongsan', '의성': 'uiseong', '청송': 'cheongsong', '영양': 'yeongyang', '영덕': 'yeongdeok',
    '청도': 'cheongdo', '고령': 'goryeong', '성주': 'seongju', '칠곡': 'chilgok', '예천': 'yecheon', '봉화': 'bonghwa', '울진': 'uljin', '울릉': 'ulleung',
    '창원': 'changwon', '진주': 'jinju', '통영': 'tongyeong', '사천': 'sacheon', '김해': 'gimhae', '밀양': 'miryang', '거제': 'geoje',
    '양산': 'yangsan', '의령': 'uiryeong', '함안': 'haman', '창녕': 'changnyeong', '경남고성': 'goseong', '남해': 'namhae', '하동': 'hadong',
    '산청': 'sancheong', '함양': 'hamyang', '거창': 'geochang', '합천': 'hapcheon',
    '제주': 'jeju', '서귀포': 'seogwipo',
    '춘천': 'chuncheon', '원주': 'wonju', '강릉': 'gangneung', '동해': 'donghae', '태백': 'taebaek', '속초': 'sokcho', '삼척': 'samcheok',
    '홍천': 'hongcheon', '횡성': 'hoengseong', '영월': 'yeongwol', '평창': 'pyeongchang', '정선': 'jeongseon', '철원': 'cheorwon',
    '화천': 'hwacheon', '양구': 'yanggu', '인제': 'inje', '강원고성': 'goseonggangwon', '양양': 'yangyang',
    '전주': 'jeonju', '군산': 'gunsan', '익산': 'iksan', '정읍': 'jeongeup', '남원': 'namwon', '김제': 'gimje', '완주': 'wanju',
    '진안': 'jinan', '무주': 'muju', '장수': 'jangsu', '임실': 'imsil', '순창': 'sunchang', '고창': 'gochang', '부안': 'buan',
}

# 애널리틱스가 «구 · 동네» 를 도시로 줄 때를 대비한 별명(그 도시 하나에만 있는 이름만 — 중구 · 동구 · 서구 · 강서구처럼 겹치는 것은 뺌)
별명 = {
    'seoul': ['gangnam', 'seocho', 'songpa', 'mapo', 'yeongdeungpo', 'gwanak', 'nowon', 'eunpyeong', 'gangdong', 'gangbuk', 'dobong',
              'jungnang', 'seongbuk', 'dongdaemun', 'seongdong', 'gwangjin', 'yongsan', 'jongno', 'yangcheon', 'guro', 'geumcheon',
              'dongjak', 'seodaemun'],
    'busan': ['haeundae', 'suyeong', 'saha', 'sasang', 'yeonje', 'geumjeong', 'dongnae', 'busanjin', 'yeongdo', 'gijang'],
    'incheon': ['bupyeong', 'namdong', 'yeonsu', 'michuhol', 'gyeyang', 'ganghwa', 'ongjin'],
    'daegu': ['suseong', 'dalseo', 'dalseong', 'gunwi'],
    'daejeon': ['yuseong', 'daedeok'],
    'gwangju': ['gwangsan'],
    'ulsan': ['ulju'],
    'seongnam': ['bundang', 'sujeong', 'jungwon'],
    'goyang': ['ilsan', 'ilsandong', 'ilsanseo', 'deogyang'],
    'yongin': ['suji', 'giheung', 'cheoin'],
    'suwon': ['yeongtong', 'paldal', 'jangan', 'gwonseon'],
    'changwon': ['masan', 'jinhae', 'masanhappo', 'masanhoewon', 'uichang', 'seongsan'],
    'jeonju': ['wansan', 'deokjin'],
    'cheongju': ['heungdeok', 'sangdang', 'seowon', 'cheongwon'],
    'cheonan': ['dongnam', 'seobuk'],
    'ansan': ['danwon', 'sangnok'],
    'anyang': ['manan', 'dongan'],
}

K = 100                       # 1° = 100
COS = math.cos(math.radians(36))
L0, B0 = 124.5, 38.7          # 왼쪽 위 (경도, 위도)


def 펴기(lng, lat):
    return ((lng - L0) * COS * K, (B0 - lat) * K)


def 줄글(poly):
    """다각형 → SVG path (소수 1자리 · 같은 점 거르기)"""
    out = []
    for ring in [poly.exterior]:
        pts = []
        for lng, lat in ring.coords:
            x, y = 펴기(lng, lat)
            p = (round(x, 1), round(y, 1))
            if not pts or p != pts[-1]:
                pts.append(p)
        if len(pts) < 4:
            continue
        out.append('M' + ' '.join(f'{x:g},{y:g}' for x, y in pts) + 'Z')
    return ''.join(out)


def 만들기(geo_path, out_path):
    g = json.load(open(geo_path, encoding='utf-8'))
    묶음 = {}
    시도모양 = {}
    for f in g['features']:
        p = f['properties']
        c, n = p['sig_cd'], p['sig_kor_nm']
        s = shape(f['geometry']).buffer(0)
        시도모양.setdefault(c[:2], []).append(s)
        if c[:2] in 광역:
            key, 이름 = c[:2], 광역[c[:2]]
        else:
            key = c[:4] if n.endswith('구') else c
            if key in 구만:
                이름 = 구만[key]
            elif n.endswith('구') and '시' in n[:-1]:
                이름 = n[:n.index('시') + 1]
            else:
                이름 = n
        묶음.setdefault(key, {'이름': 이름, '시도': c[:2], '모양': []})['모양'].append(s)

    곳 = []
    for key, v in sorted(묶음.items()):
        u = unary_union(v['모양'])
        pt = u.centroid
        if not u.contains(pt):
            pt = u.representative_point()
        줄기 = v['이름'][:-1] if v['이름'][-1:] in ('시', '군') and len(v['이름']) > 2 else v['이름']
        if v['시도'] in 광역:
            줄기 = v['이름']
        if 줄기 == '광주' and v['시도'] == '41':
            줄기 = '경기광주'
        if 줄기 == '고성':
            줄기 = '강원고성' if v['시도'] == '51' else '경남고성'
        e = 영.get(줄기)
        if not e:
            raise SystemExit(f'[멈춤] 영어 이름 없음: {v["이름"]} ({key})')
        x, y = 펴기(pt.x, pt.y)
        이름 = v['이름'] if v['시도'] not in 광역 else (v['이름'] + ('특별시' if v['시도'] == '11' else '특별자치시' if v['시도'] == '36' else '광역시'))
        곳.append({'k': key, 'n': 이름, 'd': 시도[v['시도']], 'e': e, 'x': round(x, 1), 'y': round(y, 1)})

    판 = {}
    for sd, 모양들 in sorted(시도모양.items()):
        u = unary_union(모양들).simplify(0.012, preserve_topology=True)
        polys = list(u.geoms) if isinstance(u, MultiPolygon) else [u]
        남길 = [q for q in polys if q.area > 0.004 or sd in ('50',) or (sd == '47' and q.centroid.x > 130.5)]
        판[시도[sd]] = ''.join(줄글(q) for q in 남길)

    w = round((131.95 - L0) * COS * K)
    h = round((B0 - 33.0) * K)
    있는 = {q['e'] for q in 곳}
    별 = {a: e for e, 들 in 별명.items() if e in 있는 for a in 들 if a not in 있는}
    자료 = {'_': '이용자 지도 바탕 — tools/지도만들기.py 가 만듦(korea-sigungu-geocoding 1.3.1 · MIT). 손으로 고치지 말 것.',
            'vb': [w, h], '판': 판, '곳': 곳, '별': 별}
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(자료, f, ensure_ascii=False, separators=(',', ':'))
    print(f'시·군 {len(곳)}곳 · 시도 {len(판)} · 그림 {w}×{h} · {sum(len(v) for v in 판.values()) // 1024}KB')


if __name__ == '__main__':
    만들기(sys.argv[1], sys.argv[2])
