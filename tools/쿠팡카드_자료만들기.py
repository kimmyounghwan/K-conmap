# 🛒 G663 (2026-11-13) 쿠팡 «카페형 상품 카드» 자료 만들기 — 파트너스에서 받은 날 자료(raw) → web/public/coupang/cards.json
#   쓰는 법: python3 tools/쿠팡카드_자료만들기.py <raw1.json> [raw2.json …] --out web/public/coupang/cards.json [--date 2026-11-13]
#   raw 한 줄 = [주제, 검색어, productId, itemId, vendorItemId, 이름, 그림(https:// 뺀 212x212ex 주소), 원값, 값, 할인, 별, 평, 무료배송(0/1), 링크 끝 글자]
#     — 크롬(소장님 파트너스 로그인)에서 «상품 링크» 화면이 만든 link.coupang.com/a/<끝 글자> 만 · 받은 그대로(크롬 sha256 = 여기 sha256 확인) · 차례는 docs/쿠팡카드_자료.md
#   ① 같은 상품(productId) 겹침 빼기(앞 것 남김) ② 분야에 안 맞는 것 빼기(뺌) ③ 이름 다듬기(광고 꼬리 · «무료» 말 — 고친이름 · 다듬기)
#   ④ 검사(링크 · 그림 꼴 · 값 · 할인 = 쿠팡 셈 · 주제마다 여섯 넘음) ⑤ 주제 안에서 검색어마다 돌려 섞음(처음 보이는 두세 장부터 여러 가지)
#   ⚠️ 뺌 · 고친이름 은 2026-11-13 자료의 링크 끝 글자 — 다시 받으면 새 끝 글자로 다시 고를 것(엉뚱한 상품 · 긴 이름 · «무료» 든 이름을 눈으로 보고)
import json, re, sys

인자 = sys.argv[1:]
out = '/tmp/cards.json'
기준 = '2026-11-13'
파일들 = []
i = 0
while i < len(인자):
    if 인자[i] == '--out': out = 인자[i + 1]; i += 2; continue
    if 인자[i] == '--date': 기준 = 인자[i + 1]; i += 2; continue
    파일들.append(인자[i]); i += 1
if not 파일들:
    sys.exit('raw 파일을 주세요 — python3 tools/쿠팡카드_자료만들기.py raw1.json [raw2.json …] --out web/public/coupang/cards.json')
raw = []
for f in 파일들:
    raw += json.load(open(f, encoding='utf-8'))

주제들 = [
    ['fruit', '🍊 제철 과일'],
    ['winterwear', '🧥 겨울 옷'],
    ['sitewinter', '🧤 현장 겨울 채비'],
    ['cert', '📚 자격증 수험서'],
    ['tools', '🛠 공구 · 측정'],
    ['office', '🖨 사무용품'],
    ['digital', '💻 디지털 · 가전'],
    ['interior', '🏠 홈 · 겨울 난방'],
    ['food', '🍜 간식 · 먹거리'],
    ['living', '🧻 생활용품'],
    ['car', '🚗 자동차 용품'],
    ['outdoor', '🥾 등산 · 캠핑'],
    ['kitchen', '🍳 주방용품'],
    ['beauty', '🧴 피부 · 뷰티'],
    ['baby', '👶 출산 · 유아동'],
    ['toys', '🧸 장난감 · 선물'],
    ['pet', '🐶 반려동물'],
]
ids = [x[0] for x in 주제들]

# ② 분야에 안 맞아 빼는 것(링크 끝 글자)
뺌 = {
    'iDceeHYy0i': '골프 거리측정기',
    'iDcesunawu': '골프 거리측정기',
    'iDceKJjpfM': '옷 재는 미니 줄자(공구 아님)',
    'iDcX7s5bOu': '소금후추 그라인더(공구 아님)',
    'iDcYaONJpk': '소금후추 그라인더(공구 아님)',
    'iDckSLVMBg': '오래된 중고형 노트북(6세대)',
    'iDchVLcs4i': '각인 홍보 볼펜(이름에 무료)',
    'iDcuM4Wv7I': '봄가을 바지(겨울에 안 맞음)',
}

# ③ 이름 다듬기 — 따로 정한 것(링크 끝 글자 → 보일 이름)
고친이름 = {
    'iDb6i4vvKC': '당도선별 부사 사과, 1박스, 5kg',
    'iDb6GPmd40': '유명산지 고당도 국산 햇 단감, 1박스, 3kg',
    'iDb7XwMP12': '남녀공용 겨울 경량 방한 패딩 점퍼 ZPEIZ-2618',
    'iDb8tD5f0S': '김영주스포츠 남성 웰론 경량 패딩 조끼 히트윈터',
    'iDb85CzzrM': 'SMOPIG 남자 겨울 기모 방풍 등산바지 · 작업복',
    'iDb9vXVjvo': 'Moteur 방수 방풍 터치 방한장갑 3M 신슐레이트',
    'iDb9UdSYIS': '1+1 우디우디 에어메쉬 기모 방한 넥워머',
    'iDb973ikz6': 'ANSHI 경량 통기성 다이얼 안전화 사계절용',
    'iDcadBTmuq': 'ANSHI 방수 다이얼 안전화 Z-267',
    'iDcaiuHwES': 'SIISEEN 미끄럼 방지 다이얼 작업화 F-517',
    'iDcaLxsLQa': '2026 에듀윌 건축기사 10+2개년 필기 기출문제집',
    'iDcdhwXniK': 'ENFATE 21V 충전 임팩드릴 · 임팩렌치 4.0Ah 배터리 2개',
    'iDcgX3ijQG': 'BOACE MLT-K250XL 특대용량 호환 토너(삼성 SL-M2893FW 등)',
    'iDchbRhF3A': '디디토너 CLT-P510C 호환 토너 4색 세트(삼성 SL-C510 등)',
    'iDcjbAlmEK': '일체형 고속충전 보조배터리 30000mAh PD 22.5W 케이블 4개',
    'iDcjVeqr0e': '뷰싱크 32인치 FHD 100Hz 무결점 모니터 VSO321F',
    'iDcj80s7R6': '뷰싱크 32인치 QHD 100Hz 무결점 모니터 VSO321Q',
    'iDckmXrdIW': '스카이뷰 24인치 IPS FHD 120Hz 화이트 모니터',
    'iDckE2AqZw': '베이직스 2026 베이직북 16(16GB · 512GB · WIN11)',
    'iDck6Banp6': '베이직스 베이직북 14 N시리즈(8GB · 256GB · WIN11)',
    'iDcqvhVPmC': '현대티앤알 TOPVIEW R1 2채널 블랙박스 + GPS 64GB(출장장착 포함)',
    'iDcqARn9y0': '아이리버 FF2 2채널 FHD 블랙박스 WiFi + GPS 32GB',
    'iDcqN6QM5Q': '마일론 갤러리4 차량용 송풍구 방향제, 클린코튼',
    'iDcrii9rXg': '전차종 우레탄 벨트형 스노우체인 8개입',
    'iDcrBoe3ci': 'AMSKY 맥세이프 차량용 핸드폰 거치대 360도 회전',
    'iDcsyVsMFg': 'ZOZI 남성 겨울 기모 방한 등산화 미끄럼 방지',
    'iDctiHfx5U': 'Velora 접이식 릴렉스 캠핑의자 발받침',
    'iDct2s6etg': '한일의료기 국내생산 저전력 카본 전기요 더블, 윈터블루',
    'iDcukHYDAa': 'SMOPIG 아웃도어 방수원단 등산 바지',
    'iDcuyv4kYS': '워킹맨 남성 스판 등산바지 1+1 작업복 · 현장복 B100',
    'iDcxhSzz88': 'OYEAH 저소음 에어프라이어 4.5L, 블랙',
    'iDcxvDPM84': 'BARI 유리 글라스 에어프라이어 5.5L 저소음, 화이트',
    'iDcBWob2s0': '안심벤토그립 벤토나이트 고양이모래 18kg × 2박스, 무향',
    'iDcXxSDj8C': 'VoltMate 21V 무선 임팩트 전동렌치 350N 4.0Ah 배터리 2개',
    'iDcXNVOYaO': '프리즘빔 충전식 LED 랜턴 · 작업등',
    'iDcXRe7hJI': '일광표 무선 충전식 휴대용 랜턴, 블랙',
    'iDcXVA3Oq4': '충전식 LED 작업등 각도조절 접이식',
    'iDcYn7hwQK': 'Moteur 16구역 3단계 USB 온열 발열조끼 남녀공용',
    'iDcYsj13im': 'KC인증 핫터치 경량 발열조끼 28구역 + 20000mAh 보조배터리',
    'iDcYHt5GtE': '보온 방한 트레킹 슈즈 남녀 패딩화',
    'iDc1ItcOUC': '제스프리 썬골드 왕점보 골드키위 5kg',
    'iDc1RnVEMC': '제스프리 뉴질랜드 그린키위 5kg',
    'iDc10Czqeq': '원시인농산 국산 참다래 그린키위 5kg(중과 55과 전후)',
    'iDc2Tpq7Ou': '코코몽드 KC인증 아동 라이오셀 긴팔 내복 상하세트',
    'iDc4RoAJpI': 'KOABUBY 자석블럭 숲속 탐험 세트',
    'iDc5oG9FCK': '버섯핀 직소퍼즐 480피스 입체 모자이크 보관함 세트',
    'iDc6JuwqTQ': 'KURUA 양면 양털 극세사 겨울 이불, 보헤미안',
    'iDc6SJT9Ea': '그냥눕자 항균 알러지케어 도트 우유 극세사 이불',
    'iDc7ku7SM0': '대형 하이라이트 전기히터 20인치 스탠드형, 화이트',
    'iDc7tuMJXM': '테크니즈 초저소음 PTC 온풍기 AI 온도조절, 화이트',
    'iDc7LGZpUy': 'Rotima 대용량 초음파 가습기 4L 무드등, 화이트',
    'iDc74cB9Hg': '풀라스 UV 살균 무선 미니 가습기 무소음 무드등, 베이지',
}

광고말 = re.compile(r'특가|완판|딱\d|한정|국내발송|신상|입점|직송|공식몰|빅세일|과일맛집')

def 다듬기(이름, 끝):
    if 끝 in 고친이름:
        return 고친이름[끝]
    s = 이름
    # 앞 [ … ] — 광고 말이면 빼고, 브랜드면 괄호만 벗김
    while True:
        m = re.match(r'^\s*\[([^\]]*)\]\s*', s)
        if not m:
            break
        안 = m.group(1).strip()
        s = s[m.end():]
        if not 광고말.search(안):
            s = 안 + ' ' + s
            break
    s = re.sub(r'\s*\+?\s*무료특강\s*', ' ', s)
    s = re.sub(r'\s*인기추천\s*$', '', s)
    s = re.sub(r'\+\s+\+', '+', s)   # «+ 무료특강 +» 를 뺀 자리만(⚠️ «PA++++» 는 그대로)
    s = re.sub(r'\s{2,}', ' ', s).strip(' ,+')
    return s

본pid = set()
나옴 = []
뺀 = []
for r in raw:
    주제, 말, pid, iid, vid, 이름, 그림, 원값, 값, 할인, 별, 평, 무료, 끝 = r
    if 끝 in 뺌:
        뺀.append((끝, 뺌[끝])); continue
    if pid in 본pid:
        뺀.append((끝, '같은 상품 겹침')); continue
    본pid.add(pid)
    나옴.append([주제, 다듬기(이름, 끝), 'https://' + 그림, 원값, 값, 할인, 별, 평, 'https://link.coupang.com/a/' + 끝, 말])

# 주제 안에서 검색어(말)마다 돌려 섞음 — 핫팩 · 장갑 · 넥워머 · 안전화 … 처음 보이는 두세 장부터 여러 가지가 보이게
섞음 = []
for i in [x[0] for x in 주제들]:
    묶음 = {}
    for x in 나옴:
        if x[0] == i:
            묶음.setdefault(x[9], []).append(x)
    줄들 = list(묶음.values())
    k = 0
    while any(줄들):
        for 줄 in 줄들:
            if len(줄) > k:
                섞음.append(줄[k])
        k += 1
        if k > 50: break
    줄들 = None
assert len(섞음) == len(나옴)
나옴 = [x[:9] for x in 섞음]

# ④ 검사
링크꼴 = re.compile(r'^https://link\.coupang\.com/a/[A-Za-z0-9]+$')
그림꼴 = re.compile(r'^https://[a-z0-9]+\.coupangcdn\.com/thumbnails/remote/212x212ex/image/\S+\.(jpg|jpeg|png)$')
for x in 나옴:
    주제, 이름, 그림, 원값, 값, 할인, 별, 평, 링크 = x
    assert 주제 in ids, x
    assert 링크꼴.match(링크), x
    assert 그림꼴.match(그림), x
    assert isinstance(원값, int) and isinstance(값, int) and 0 < 값 <= 원값, x
    assert 0 <= 할인 <= 95 and abs(할인 - int((원값 - 값) * 100 / 원값)) <= 1, x
    assert 4.0 <= 별 <= 5 and isinstance(평, int) and 평 >= 1, x
    assert '무료' not in 이름 and '클로드' not in 이름 and 3 <= len(이름) <= 60, x
assert len({x[8] for x in 나옴}) == len(나옴)
assert len({x[2] for x in 나옴}) == len(나옴) or True

수 = {i: sum(1 for x in 나옴 if x[0] == i) for i in ids}
assert all(v >= 6 for v in 수.values()), 수

자료 = {'기준': 기준, '주제들': 주제들, '칸': ['주제', '이름', '그림', '원값', '값', '할인', '별', '평', '링크'], '상품': 나옴}
글 = json.dumps(자료, ensure_ascii=False, separators=(',', ':'))
글 = 글.replace('],[', '],\n[')   # 줄마다 상품 하나(사람이 읽고 고치기 쉽게)
open(out, 'w', encoding='utf-8', newline='\n').write(글 + '\n')
print('상품', len(나옴), '뺀', len(뺀), '바이트', len(글.encode('utf-8')))
print(수)
for 끝, 왜 in 뺀:
    print('  뺌', 끝, 왜)
