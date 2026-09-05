# -*- coding: utf-8 -*-
"""
tools/formscheck.py — 「모든 서식, 하나도 누락 없이」를 **셀 수 있게** 만듭니다. (2026-09-05)

소장님: 「모든 서식이어야 해.. 하나도 누락없이..」

솔직히 적어 둡니다: 「모든 서식」은 닫힌 집합이 아닙니다.
발주기관마다 자기 서식이 있고, 공종마다 또 다릅니다.
그래서 «다 만들었다» 를 말로 할 게 아니라 **목록을 만들어 놓고 대조**합니다.

아래 MASTER 는 건설 현장에서 실제로 오가는 문서를 갈래별로 적은 것입니다.
`python tools/formscheck.py` 를 돌리면 forms.json 과 대조해
**무엇이 없는지** 를 찍어 줍니다. 없는 것이 나오면 그때 만들면 됩니다.

⚠️ 발주기관이 지정한 서식(공고 붙임)은 우리가 가질 수 없습니다 — 그건 «없음» 이 정상입니다.
⚠️ 법정 서식(전자인계서·유해위험방지계획서 본문 등)도 원문을 쓰는 게 맞습니다.
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "web", "src", "data", "forms.json")

# 갈래 → [(문서 이름, 우리 slug 또는 None(=원문을 써야 하는 것))]
MASTER = {
 "일반": [
   ("대외 공문", "gongmun"), ("문서 발송대장", "balsong"),
   ("공사 회의록", "jugan-hoeuirok"), ("민원 접수·처리대장", "minwon"),
   ("현장 개설 보고서", "hyeonjang-gaeseol"), ("위임장", "wiimjang"),
   ("사용인감계", "sayonginmgye"), ("청렴계약 이행서약서", "cheongryeom"),
 ],
 "계약": [
   ("공사도급계약서", "gy-dogeup"), ("공사 하도급계약서", "gy-hadogeup"),
   ("공동수급협정서", "gy-gongdong"), ("변경계약서", "gy-byeongyeong"),
   ("하도급대금 직접지급 합의서", "gy-jikbul"),
   ("건설기계 임대차계약서", "gy-imdae"), ("자재 구매계약서", "gy-jajae"),
   ("운반계약서", "gy-unban"), ("용역계약서", "gy-yongyeok"),
   ("폐기물 처리 위탁계약서", "gy-pyegimul"),
   ("일용근로계약서", "gy-ilyong"), ("근로계약서", "gy-sangyong"),
   ("계약 해지 합의서", "gy-haeji"), ("이행각서", "gy-gakseo"),
   ("비밀유지계약서", "gy-nda"),
   ("표준하도급계약서(공정위 고시)", None),
   ("건설기계 임대차 표준계약서(국토부 고시)", None),
   ("표준근로계약서(고용부)", None),
 ],
 "공무": [
   ("착공계", "chakgong"), ("현장대리인계", "daeriin"),
   ("현장대리인 변경신고서", "daeriin-byeongyeong"),
   ("공사예정공정표", "gongjeongpyo"), ("선금 신청서", "seongeum"),
   ("선금 사용계획서", "seongeum-gyehoek"),
   ("기성검사원", "gisung-geomsa"), ("기성금 청구서", "gisung-cheonggu"),
   ("실정보고서", "siljeong-bogo"), ("설계변경 요청서", "seolgye-byeongyeong"),
   ("물가변동 계약금액 조정 신청서", "mulga"),
   ("공기연장 신청서", "gonggi-yeonjang"),
   ("공사 중지·재개 통보서", "gongsa-jungji"),
   ("지체상금 감면 신청서", "jiche-gammyeon"),
   ("하도급 통보서", "hadogeup-tongbo"),
   ("하도급대금 지급확인서", "hadogeup-daegeum"),
   ("준공계", "jungong"), ("준공대가 청구서", "jungong-daega"),
   ("준공 정산서", "jungong-jeongsan"),
   ("하자보수 완료확인서", "haja-wanryo"), ("인수인계서", "inssu-ingye"),
   ("계약보증·하자보증 증권(보증기관 서식)", None),
 ],
 "공사": [
   ("작업일보", "jakeop-ilbo"), ("공정 보고서", "gongjeong-bogo"),
   ("공정 만회 대책서", "gongjeong-manhoe"),
   ("시공계획서 표지·목차", "sigong-gyehoek"),
   ("시공상세도 검토 요청서", "sigong-sangse"),
   ("검측요청서", "geomcheuk"),
   ("측량 기준점 인계확인서", "gijunjeom"),
   ("굴착·되메우기 확인서", "gulchak"),
   ("콘크리트 타설 체크리스트", "taseol-check"),
   ("콘크리트 양생 관리대장", "yangsaeng"),
   ("야간·휴일 작업 신청서", "yagan-jakeop"),
   ("공사 사진대지", "sajin-daeji"),
   ("도로점용·굴착 허가(관청 서식)", None),
 ],
 "안전": [
   ("TBM 일지", "tbm"), ("위험성평가표", "wiheom-pyeongga"),
   ("안전보건교육일지", "anjeon-gyoyuk"),
   ("작업허가서", "jakeop-heoga"),
   ("일일 안전점검 체크리스트", "ilil-anjeon"),
   ("비계·고소작업 점검표", "bigye-check"),
   ("가설전기 점검표", "gaseoljeongi"),
   ("안전보건 협의체 회의록", "anjeon-hyeobuiche"),
   ("안전보건 관리자 지정서", "anjeon-jijeong"),
   ("개인보호구 지급대장", "bohogu"),
   ("안전관리비 사용계획서", "anjeonbi-gyehoek"),
   ("안전관리비 사용내역서", "anjeonbi-naeyeok"),
   ("안전관리계획서 표지·목차", "anjeon-gyehoek"),
   ("재해 발생 보고서", "sago-bogo"), ("아차사고 보고서", "achasago"),
   ("비상연락망", "bisang-yeonrak"),
   ("우기·태풍 대비 점검표", "ugi-daechaek"),
   ("혹서기·혹한기 대책", "hokseo"),
   ("유해위험방지계획서(산안법 제출본)", None),
 ],
 "품질": [
   ("품질시험계획서", "pumjil-gyehoek"),
   ("자재 승인요청서", "jajae-seungin"), ("자재 반입검수서", "jajae-geomsu"),
   ("자재 반출 승인서", "jajae-banchul"),
   ("자재 시험 의뢰서", "siheom-uiroe"),
   ("레미콘 반입 검사표", "remicon"),
   ("콘크리트 압축강도 관리대장", "gangdo"),
   ("철근 가공·조립 검사표", "cheolgeun"),
   ("부적합 보고서", "ncr"),
   ("시험장비 검·교정 관리대장", "gyogeong"),
 ],
 "환경": [
   ("폐기물 반출대장", "pyegimul"), ("비산먼지 점검표", "bisan"),
   ("소음·진동 측정 기록부", "soeum"), ("수질·탁수 관리 점검표", "takssu"),
   ("폐기물 전자인계서(올바로 시스템)", None),
 ],
 "노무·장비": [
   ("근로자 명부", "geunroja-myeongbu"), ("임금대장", "imgeum-daejang"),
   ("출역일보", "chulyeok-ilbo"), ("노무비 지급확인서", "nomubi"),
   ("건설기계 반입·반출 확인서", "janggi-banip"),
   ("장비 가동일보", "janggi-gadong"),
   ("장비 임대료 정산서", "imdaeryo-jeongsan"),
   ("유류 사용 관리대장", "yuryu"),
   ("퇴직공제 신고(건설근로자공제회 서식)", None),
 ],
}


def main():
    with open(SRC, encoding="utf-8") as f:
        forms = (json.load(f) or {}).get("forms") or []
    have = {x["slug"] for x in forms}

    print(f"우리가 가진 서식 {len(forms)}가지 · 목록에 적힌 문서 "
          f"{sum(len(v) for v in MASTER.values())}가지\n")
    miss, outside, extra = [], [], []
    listed = set()
    for g, items in MASTER.items():
        need = [(n, s) for n, s in items if s]
        got = [n for n, s in need if s in have]
        gone = [(n, s) for n, s in need if s not in have]
        outs = [n for n, s in items if not s]
        listed |= {s for _, s in need}
        mark = "✅" if not gone else "⛔"
        print(f"{mark} {g:<8} {len(got):2d}/{len(need):2d}"
              + (f"   (원문을 써야 하는 것 {len(outs)}가지)" if outs else ""))
        for n, s in gone:
            miss.append((g, n, s))
            print(f"      ⛔ 없음: {n}  ({s})")
        for n in outs:
            outside.append((g, n))

    extra = sorted(have - listed)
    print()
    if miss:
        print(f"⛔ 만들어야 할 것 {len(miss)}가지 — 위 목록의 «없음» 을 채우세요.")
    else:
        print("✅ 목록에 적힌 서식은 하나도 빠지지 않았습니다.")
    if extra:
        print(f"ℹ️ 목록에 없는데 우리가 가진 것 {len(extra)}가지 — MASTER 에 추가해 두세요:")
        print("   " + ", ".join(extra))
    print(f"\nℹ️ 우리가 만들지 «않는» 것 {len(outside)}가지 — 원문을 쓰는 편이 안전합니다:")
    for g, n in outside:
        print(f"   · [{g}] {n}")
    print("\n※ 발주기관이 공고 붙임으로 준 서식은 여기 없습니다. 그건 그 서식을 쓰세요.")
    return 1 if miss else 0


if __name__ == "__main__":
    sys.exit(main())
