# -*- coding: utf-8 -*-
# tab.py — 서식 탭(/forms) 짜임 web/src/data/forms_tab.json 을 만듭니다. python3 tab.py (서식을 더하면 STAGES 에 넣고 다시 돌림)
# 서식 탭(/forms) 짜임 — forms_tab.json 만들기 + 191가지가 빠짐없이 한 번씩 들어갔는지 검사
import json, collections
import os
R = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'web', 'src', 'data') + os.sep
F = {f['slug']: f for f in json.load(open(R + 'forms.json', encoding='utf-8'))['forms']}
O = {f['slug']: f for f in json.load(open(R + 'forms_orig.json', encoding='utf-8'))['forms']}
ALL = {**F, **O}
P = dict(
    wonclick=('/tools/wonclick', '⚡', '공사서류 원클릭 — 한 번 입력으로 서류 24가지', '공사명·금액·날짜를 한 번만 넣으면 착공계·현장대리인계·기성·준공·하자 서류가 채워진 엑셀로. 매크로 없음.'),
    after=('/tools/after-award', '📅', '낙찰 뒤 할 일 달력', '낙찰 통지일·착공일·도급금액을 넣으면 계약·공사대장 통보·안전 서류·보험 신고·하도급 통보 기한이 날짜로.'),
    subchk=('/tools/subcontract-check', '⚖️', '하도급 적정성 판정 — 82% · 64%', '하도급금액을 넣으면 적정성 심사 대상인지, 넘기려면 얼마 이상이어야 하는지.'),
    ratio=('/naeyeok/ratio', '📉', '내역서 비율 맞추기 — 하도급 80% · 실행률', '내역서를 올리면 원하는 비율로 단가·금액을 맞추고 원가계산서까지 따라옵니다.'),
    schedule=('/tools/schedule', '📊', '예정공정표 · S커브 만들기', '공종·금액·공사기간을 넣으면 보할·월별 계획 공정률·막대 공정표·S커브가 한 번에.'),
    safety=('/safety', '🦺', '안전관리계획서 · 유해위험방지계획서 — 대상인가', '공사 종류·규모를 고르면 대상 여부와 준비 서류가 나옵니다.'),
    tuipbi=('/tools/tuipbi', '🏗', '현장 투입비 · 공사일보 — 청구내역서까지', '날마다 출역·장비·자재만 누르면 누적 투입비·공정률, 달마다 노무비·장비·자재 청구내역서.'),
    risk=('/tools/risk', '⚠️', '위험성평가 — 별지 1~5를 사이트에서 바로', '위험요인 사전에서 골라 넣고 위험등급·관리기간은 저절로. 서식과 같은 칸으로 A4 인쇄.'),
    nomubi=('/tools/nomubi', '👷', '일용 노무비 계산기 · 지급명세서', '이름·직종·일당과 일한 날만 누르면 소득세·4대보험 공제와 실지급액, A4 지급명세서와 신고용 집계까지.'),
    gyeonjeok=('/tools/gyeonjeok', '🧾', '공사 견적서 · 원가계산서 만들기', '내역만 적으면 일반관리비·이윤·부가세와 견적금액(한글), 공공식 원가계산서까지 A4 인쇄.'),
    sonik=('/tools/sonik', '💰', '현장 손익 장부 — 매출 · 매입 · 미수금', '기성 청구와 자재·장비·노무·외주를 적으면 현장마다 손익·이익률·미수금·미지급금이 저절로.'),
    jimyeong=('/tools/jimyeong', '🏢', '공사지명원 만들기', '회사 정보·면허·기술인·장비·시공 실적을 한 번 적어 두면 표지·지명원·목차·실적표가 A4로.'),
    sanan=('/tools/sanan', '🦺', '산업안전보건관리비 계상기 · 사용내역서', '고시 별표1로 계상액, 쓴 돈을 적으면 별지 제1호서식 사용내역서가 서식 칸 그대로.'),
    ilbo=('/tools/ilbo', '📝', '작업일보 만들기 — 누계 저절로', '날씨·작업 내용·금일 인원·장비·자재만 적으면 전일까지·누계가 셈된 A4 작업일보. 가입 없음.'),
    singo=('/tools/singo', '📮', '매달 신고 정리 — 원천세 · 근로내용 · 퇴직공제', '한 달 출역으로 기관마다 넣을 숫자와 기한(D-day · 휴일이면 다음 날)을 한 장에.'),
    toejik=('/tools/toejik', '👷', '건설근로자 퇴직공제 집계', '출역으로 근로일수 · 공제부금 · 입찰공고일로 일액(8,700원 · 6,500원) 자동 · 계상액과 견줌.'),
    boheomryo=('/tools/boheomryo', '🧾', '고용 · 산재 보험료 계산기', '노무비율 또는 실제 보수로 개산 · 확정 보험료 · 기한 · 분할 납부.'),
    ilyong=('/tools/ilyong-boheom', '🛡', '일용직 4대보험 가입 판단기', '일한 날만 누르면 국민연금 · 건강보험 가입 대상 · 취득일 · 상실일 · 보험료 달 · 신고 기한.'),
    equip=('/tools/equip', '🚜', '장비 임대료 · 수금 장부', '날마다 사용 시간만 적으면 거래처별 임대료·미수금·A4 청구서가 저절로.'),
    remicon=('/tools/remicon-truck', '🚛', '레미콘 대수 계산기', '콘크리트 물량을 넣으면 필요한 레미콘 차량 대수가 나옵니다.'),
    chgexcel=('/change/excel', '📊', '설계변경 자동계산 엑셀 — 시트 11장', '단가 하나를 고치면 내역 · 증감대비표 · 원가계산서까지 다시 계산됩니다.'),
    twoline=('/change/twoline', '↔️', '설계변경 2줄 자동변환', '당초 한 줄을 당초·변경 두 줄로 바꿔 줍니다.'),
    price=('/tools/price-adjust', '📈', '물가변동 조정금액 계산기', '계약금액과 등락률을 넣으면 조정 가능 여부와 증감액이 나옵니다.'),
    qty=('/jeoksan/run', '🧮', '수량산출서 만들기', '재료표 + 치수표 — 칸을 누르고 도면을 누르면 값이 들어갑니다. 산출서·집계·검산.'),
    defect=('/tools/defect-period', '🛡', '하자담보책임기간 · 하자보수보증금', '공사 종류를 고르면 책임기간·끝나는 날·보증금률과 금액이 나옵니다.'),
    delay=('/tools/delay-penalty', '⏱', '지체상금 계산기', '준공기한과 합격일, 계약금액을 넣으면 지체일수·지체상금·30% 한도까지.'),
    unpaid=('/tools/unpaid', '💸', '미불금 받는 순서', '못 받은 돈의 종류를 고르면 받는 순서와 근거 조문, 시효가 끝날 수 있는 날이 나옵니다.'),
    direct=('/tools/direct-payment', '📨', '직접지급 요청서', '하도급대금은 발주자에게, 임금은 원도급사에게 직접 달라고 요청하는 글이 완성됩니다.'),
)
def prog(k):
    to, ic, t, d = P[k]
    return {'to': to, 'ic': ic, 't': t, 'd': d}
STAGES = [
    dict(k='contract', n='①', ic='🖊', h='계약 · 하도급', 짧게='도급·하도급·장비·근로 계약서 · 합의서',
         언제='낙찰 뒤 도급계약, 하도급을 줄 때, 장비·자재·용역·근로 계약을 맺을 때. 정부가 고시한 표준계약서가 있는 계약은 그 원문을 먼저 보십시오.',
         progs=['after', 'subchk', 'ratio', 'jimyeong'],
         slugs='gy-dogeup gy-byeongyeong gy-gongdong gy-hadogeup hadogeup-gyehoek hadogeup-tongbo gy-jikbul nomubi-gubun-haeui gy-imdae gy-jajae gy-unban gy-yongyeok gy-pyegimul gy-sangyong gy-ilyong gy-nda gy-gakseo gy-haeji o-mingan-dogeup cheongryeom sayonginmgye wiimjang'),
    dict(k='start', n='②', ic='🚩', h='착공', 짧게='착공계 · 현장 개설 · 공정표 · 계획서',
         언제='계약 뒤 착공할 때 내는 서류와 공사 초기에 세우는 계획서입니다. 착공계 한 벌은 아래 «꾸러미» 에 차례대로 모아 두었습니다.',
         progs=['wonclick', 'schedule', 'safety'],
         slugs='chakgong o-chakgong-moeum o-chakgong-seoryu daeriin daeriin-byeongyeong hyeonjang-gaeseol hyeonjang-jojikdo bisang-yeonrak hyeonhwangpan gisulin-jungbok gongjeongpyo o-yejeong-gongjeongpyo gongjeong-inryeok jikjeop-sigong-gyehoek gijunjeom doseo-pyoji anjeon-gyehoek yuhae-gyehoek anjeon-jijeong seolgye-anjeon-daejang anjeon-hwangyeong-bi anjeonbi-gyehoek pumjil-gwanri-gyehoek pumjil-gyehoek o-pumjil-siheom o-hwangyeong-lh'),
    dict(k='plan', n='③', ic='📘', h='시공계획서 · 작업계획서', 짧게='공종별 시공계획 · 해체 · 발파 · 야간작업',
         언제='공종을 시작하기 전에 감독(감리) 승인을 받는 계획서입니다. 현장에서 쓰던 원본의 틀을 그대로 옮겼습니다.',
         progs=[],
         slugs='sigong-gyehoek sigong-sangse hasugwangeo-sigong heulmagi-sigong otak-sigong o-gaseol-gyehoekseo o-gaseol-haeche o-dongbari-gyehoekseo o-deck-gyehoekseo o-paengi-gyehoekseo o-jiban-gyehoekseo o-pojang-gyehoekseo o-ascon-jageop o-bangsu-gyehoekseo o-dojang-gyehoekseo o-mijang-gyehoekseo o-balpa-jageop o-hyuil-jageop yagan-jakeop jakeop-heoga'),
    dict(k='daily', n='④', ic='🏗', h='공사 중 — 날마다 · 주마다 · 달마다', 짧게='일보 · 주간·월간 보고 · 회의 · 사진대지',
         언제='공사하는 동안 되풀이해 쓰는 서류입니다. 공사일보·투입비는 사이트에서 바로 쓰는 프로그램이 있습니다.',
         progs=['ilbo', 'tuipbi', 'schedule'],
         slugs='jakeop-ilbo jugan-hyeonhwang gongjeong-jugan-wolgan o-jugan-gongjeong o-hoeui-gongjeongpyo gongjeong-bogo wolgan-bogoseo gongjeong-manhoe jugan-hoeuirok sajin-daeji o-sajindaeji o-konkeuriteu-taseol o-gangu-taseol gongsa-jungji balsong gongmun minwon'),
    dict(k='quality', n='⑤', ic='🔍', h='검측 · 품질 · 자재', 짧게='검측 체크리스트 · 시험 · 자재 승인·수불',
         언제='공종마다 검측을 받고, 자재는 승인 → 반입 검수 → 수불로 관리합니다. 검측 체크리스트는 공종별로 나눠 두었습니다.',
         progs=['remicon'],
         slugs='geomcheuk geomcheuk-yocheong geomcheuk-togong geomcheuk-baesu geomcheuk-gujomul geomcheuk-concrete geomcheuk-malttuk geomcheuk-pojang geomcheuk-psc-gang geomcheuk-budae o-geomcheuk-300 o-geomcheuk-sheetpile gulchak cheolgeun taseol-check remicon yangsaeng gangdo siheom-uiroe gyogeong ncr o-cheukryang-bogoseo jajae-seungin jajae-gonggeupwon o-jajae-seungin o-jajae-hyeonhwang jajae-balju jajae-geomsu jajae-banchul jajae-subulbu'),
    dict(k='safety', n='⑥', ic='🦺', h='안전 · 환경 · 장비 점검', 짧게='TBM · 위험성평가 · 점검표 · 환경',
         언제='날마다·주마다 하는 안전 점검과 교육, 위험성평가, 건설기계 점검표, 환경(비산먼지·소음·폐기물) 기록입니다.',
         progs=['risk', 'sanan', 'safety'],
         slugs='tbm ilil-anjeon wiheom-pyeongga wih-choego wih-susi wih-hoeui wih-gyoyuk wih-seonggwa anjeon-gyoyuk anjeon-hyeobuiche bohogu bigye-check gaseoljeongi hokseo ugi-daechaek achasago sago-bogo anjeonbi-naeyeok o-anjeon-pumjil-bi o-geonseolgigye-check o-excavator-check o-dump-check o-towercrane-check o-lift-check o-gantry-check o-gosojageopdae-gul o-gosojageopdae-sj o-charging-check o-gondola-check o-compressor-check bisan soeum takssu pyegimul'),
    dict(k='labor', n='⑦', ic='👷', h='노무 · 장비', 짧게='출역 · 임금 · 노무비 · 장비 임대',
         언제='근로자 출역과 임금·노무비, 건설기계 반입·가동·임대료를 적는 서류입니다.',
         progs=['nomubi', 'singo', 'toejik', 'boheomryo', 'ilyong', 'tuipbi', 'equip'],
         slugs='chulyeok-ilbo geunroja-myeongbu chamyeoja-silmyeongbu taseol-silmyeongbu imgeum-daejang nomubi jikjeop-nomubi gyejwa-ipgeum janggi-banip janggi-gadong imdaeryo-jeongsan yuryu o-jangbi-gwanri'),
    dict(k='money', n='⑧', ic='💰', h='기성 · 설계변경 · 선금', 짧게='기성 청구 · 설계변경 · 물가변동 · 내역',
         언제='돈과 금액이 걸린 서류입니다 — 선금, 기성 청구, 설계변경·물가변동·공기연장, 내역서·원가계산서.',
         progs=['gyeonjeok', 'sonik', 'chgexcel', 'twoline', 'price', 'qty'],
         slugs='seongeum seongeum-gyehoek o-seongeum gisung-geomsa giseong-daebipyo gisung-cheonggu jibul-gyehoekseo jibul-hwaginseo hadogeup-daegeum siljeong-bogo seolgye-byeongyeong chg-chongwal chg-naeyeok chg-hyeobui chg-ganjeopbi chg-mulga-san mulga gonggi-yeonjang jiche-gammyeon suryang ilwidaega sanchul-naeyeok wonga gongnaeyeok-hanbeol silhaeng-daebipyo'),
    dict(k='end', n='⑨', ic='🏁', h='준공 · 하자 · 대금 받기', 짧게='준공계 · 정산 · 완료 확인 · 대금 청구 · 하자',
         언제='준공 서류와 준공 뒤 하자·대금 문제입니다. 못 받은 돈은 사이트의 미불금 도구로 순서대로 갑니다.',
         progs=['defect', 'delay', 'unpaid', 'direct'],
         slugs='jungong jungong-daega jungong-jeongsan gongsa-wanryo gongsa-daegeum inssu-ingye gy-haja-gakseo haja-wanryo'),
]
T = lambda t, d=None: {'t': t, **({'d': d} if d else {})}
PACKS = [
    dict(k='start', ic='🚩', h='착공할 때', d='착공신고서에 붙이는 서류(「공사계약일반조건」 제17조제1항)와 같은 무렵 내는 것입니다. 공사기간 30일 미만 등은 착공신고서를 안 내게 할 수 있고, 발주기관 계약 특수조건의 목록이 우선입니다.',
         prog='wonclick',
         items=[('chakgong', '착공신고서'), ('daeriin', '현장기술자(현장대리인) 지정신고'), ('gongjeongpyo', '공사공정예정표'),
                ('anjeon-gyehoek', '안전관리계획서 — 대상 공사'), ('pumjil-gyehoek', '품질관리(시험)계획서'), ('o-hwangyeong-lh', '환경관리계획서'),
                ('gongjeong-inryeok', '공정별 인력·장비 투입계획서'), ('sajin-daeji', '착공 전 현장사진'),
                ('jikjeop-sigong-gyehoek', '계약일부터 30일 안 — 대상 공사'), ('anjeonbi-gyehoek', '산업안전보건관리비 사용계획'),
                T('산재·고용보험 가입증명원', '근로복지공단에서 발급')]),
    dict(k='sub', ic='🤝', h='하도급 줄 때', d='하도급 계약을 맺은 날부터 30일 안에 발주자에게 통보합니다(건설산업기본법 제29조).',
         prog='subchk',
         items=['hadogeup-gyehoek', 'gy-hadogeup', 'hadogeup-tongbo', 'gy-jikbul', 'nomubi-gubun-haeui', T('하도급대금 지급보증서', '보증기관에서 발급')]),
    dict(k='giseong', ic='💰', h='기성 청구할 때', d='기성검사를 받고 청구합니다. 노무비·하도급대금을 제대로 줬는지 확인 서류를 같이 요구하는 곳이 많습니다.',
         prog=None,
         items=['gisung-geomsa', 'giseong-daebipyo', 'gisung-cheonggu', 'sajin-daeji', 'nomubi', 'hadogeup-daegeum', 'anjeonbi-naeyeok']),
    dict(k='change', ic='🔁', h='설계변경할 때', d='실정보고 → 승인 → 변경 내역 → 변경계약 차례입니다. 물량이 바뀌기 전에 먼저 보고합니다.',
         prog='chgexcel',
         items=['siljeong-bogo', 'seolgye-byeongyeong', 'chg-naeyeok', 'chg-chongwal', 'chg-hyeobui', 'gonggi-yeonjang', 'chg-ganjeopbi', 'gy-byeongyeong']),
    dict(k='end', ic='🏁', h='준공할 때', d='준공계를 내고 준공검사에 합격하면 준공대가를 청구합니다.',
         prog='defect',
         items=['jungong', ('sajin-daeji', '준공 사진'), 'jungong-jeongsan', 'jungong-daega', 'inssu-ingye', T('하자보수보증서', '보증기관에서 발급')]),
]
seen = collections.Counter()
out_st = []
for s in STAGES:
    sl = s['slugs'].split()
    for x in sl:
        assert x in ALL, ('없는 서식', s['k'], x)
        seen[x] += 1
    out_st.append({k: v for k, v in s.items() if k not in ('slugs', 'progs')} | {'progs': [prog(p) for p in s['progs']], 'slugs': sl})
dup = [k for k, v in seen.items() if v > 1]
miss = [k for k in ALL if k not in seen]
print('단계', len(STAGES), '· 들어간 서식', len(seen), '/ 전체', len(ALL), '· 두 번', dup, '· 빠짐', miss)
assert not dup and not miss
out_pk = []
for p in PACKS:
    its = []
    for it in p['items']:
        if isinstance(it, str):
            it = {'s': it}
        elif isinstance(it, tuple):
            it = {'s': it[0], 'd': it[1]}
        if 's' in it:
            assert it['s'] in ALL, ('꾸러미 없는 서식', p['k'], it)
        its.append(it)
    out_pk.append({**p, 'items': its, 'prog': prog(p['prog']) if p['prog'] else None})
d = {'_': '서식 탭(/forms) 짜임 — Forms.jsx 와 prerender.py 가 같이 읽습니다. 만든 곳: tools/forms2 (2026-09-29) · 서식을 더하면 stages 의 slugs 에도 넣으십시오(빠지면 화면·미리굽기 모두 «그 밖의 서식» 칸에 모임)',
     'stages': out_st, 'packs': out_pk}
s = json.dumps(d, ensure_ascii=False, indent=1).replace('\n', '\r\n')
open(R + 'forms_tab.json', 'wb').write(s.encode('utf-8'))
print('썼음', len(s))
