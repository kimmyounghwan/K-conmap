# -*- coding: utf-8 -*-
"""굴착기(굴삭기) 체크리스트 — 원본 틀(번호·구분·예시사진·점검기준·점검항목·결과·조치사항, 14항목 2쪽)을 새로 만든 것.

■ 예시 사진은 원본 그대로 씁니다(소장님: 「설명에 필요한 사진은 그대로 쓸 것」). 사진 파일: img/o-excavator-check/NN.jpg
■ 결과 칸은 목록(양호·불량·해당없음)에서 고름 → 맨 위 «판정» 과 아래 «점검 결과» 가 저절로 셈.
"""
import datetime
import os

from fb import F, I

SLUG = "o-excavator-check"
TITLE = "굴착기 점검표"
WHERE = "orig"
PREV = [(1, "빈 서식 1쪽"), (3, "작성 예시 1쪽"), (4, "작성 예시 2쪽")]
PAGES = 2
NSHEETS = 1
SHORT = "굴삭기(굴착기) 체크리스트 (예시 사진 포함). 결과를 목록에서 고르면 판정이 저절로 나옵니다."
NOTE = "예시 사진은 원본 그대로 넣었습니다 — 점검 부위를 알려 주는 참고 사진입니다."

W = [5, 11, 13, 13, 17, 30, 9, 16]
IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img", "o-excavator-check")

ITEMS = [
    ("작업 전\n준비사항", "면허와 보험 가입 여부를 확인할 것",
     ["건설기계 등록증의 총중량 확인 — 3톤 미만은 소형건설기계 조종 면허, 3톤 이상은 굴착기 조종사 면허를 가졌는지 확인",
      "보험 가입과 보장 기간 확인 — 타이어식은 자동차보험, 무한궤도식은 영업배상 책임보험"]),
    ("좌석\n안전띠", "좌석 안전띠가 설치되어 있고, 운행 중에는 착용할 것",
     ["조종석 안전띠 설치 상태 확인", "운행 중 조종원의 안전띠 착용 여부 확인"]),
    ("전동장치\n및\n제동장치", "가속·주행 브레이크·유압장치(집게)의 상태를 확인할 것",
     ["페달의 유격과, 밟았을 때 페달과 바닥판 사이 간격 확인", "주행할 때 브레이크 작동 상태 확인", "작동할 때 이상한 소리가 나는지 확인"]),
    ("조종장치\n(동력\n유압장치)", "유압장치의 상태를 확인할 것",
     ["유압펌프를 작동해 펌프·밸브·호스·배관에서 기름이 새는지 확인", "호스와 배관의 손상 여부 확인"]),
    ("조종장치\n(핸들·레버)", "조종장치(핸들·레버)의 상태를 확인할 것",
     ["주행 중 조종장치 조작 상태에 이상이 없는지 확인", "조종장치 유격이 알맞은지 확인", "위아래·좌우·앞뒤로 덜컥거림이 있는지 확인",
      "레버를 조작한 뒤 중립으로 돌아오는지 확인"]),
    ("작업장치", "버킷 등 작업장치의 정상 작동과 상태를 확인할 것",
     ["버킷의 균열·마모·심한 변형 여부 확인", "버킷 귀삽날·이빨의 손상·풀림 여부 확인", "버킷 안전핀이 제대로 설치되었는지 확인"]),
    ("후사경\n후방카메라\n후방접근\n경보장치", "충돌·협착 사고를 막도록 굴착기 뒤쪽을 볼 수 있는 후사경·후방카메라·후방접근 경보장치를 갖출 것",
     ["후사경과 후방카메라가 설치되어 있는지 확인", "후사경·후방카메라의 고정 상태와 각도 확인", "조종석 안 후방카메라 모니터 작동 여부 확인",
      "후진할 때 경보음이 울리는지 확인"]),
    ("경광등", "어두운 작업장에서도 굴착기 위치와 움직임을 알 수 있도록 경광등을 달 것",
     ["작업할 때 경광등이 켜지는지 확인"]),
    ("차륜\n(타이어·휠\n·무한궤도)", "타이어·휠·무한궤도의 상태를 확인할 것",
     ["균열과 변형 상태 확인", "체결 상태 확인", "타이어 코드층(안쪽 골격)이 드러날 만큼 손상되지 않았을 것", "타이어 홈 깊이가 1.6mm 이상일 것",
      "평평한 곳에서 타이어를 곧게 세운 뒤 찌그러짐으로 공기압 확인", "무한궤도의 트랙·슈·링크핀·롤러 상태 확인"]),
    ("웨이트", "웨이트의 상태를 확인할 것",
     ["추가 웨이트를 쓰는지 확인", "웨이트 고정 볼트·너트의 체결 상태 확인"]),
    ("협착\n방지봉", "협착 방지봉의 설치 상태를 확인할 것",
     ["협착 방지봉 설치 상태 확인", "설치 개수(2개 이상)와 위치(굴착기 뒤쪽) 확인"]),
    ("안전레버", "안전레버의 작동을 확인할 것",
     ["안전레버가 제대로 작동하는지 확인(레버를 내리면 굴착기가 움직이지 않아야 함)", "안전레버의 손상·파손 여부 확인"]),
    ("상부\n선회장치\n(턴테이블)", "상부 선회장치의 정상 작동을 확인할 것",
     ["선회할 때 심한 진동이나 이상한 소리가 나는지 확인", "볼트·너트가 단단히 체결되어 있는지 확인", "선회 중 원하는 위치에서 멈춰 그대로 있는지 확인"]),
    ("등화류", "전조등·후미등이 제대로 작동할 것",
     ["조종석에서 전조등·후미등을 켜 작동 여부 확인"]),
]
# 예시: (항목번호, 줄번호) → (결과, 조치)
EX_BAD = {(9, 4): ("불량", "앞바퀴 오른쪽 교체 — 9/30 재점검")}
EX_NA = {(9, 6): ("해당없음", "타이어식")}


def draw(bk, ex):
    p = bk.page("굴착기 점검표" if not ex else "작성 예시", W, ex=ex, fit_height=0, margins=(0.4, 0.3, 0.45, 0.45))
    L = {"kind": "label"}
    H = {"kind": "head"}
    p.gap(4)
    p.row([(4, "■ 굴착기(굴삭기) 체크리스트", {"kind": "h2", "size": 15, "border": True}), (4, "점  검  자", H)], h=30)
    p.row([(2, "점검 일자", L), (2, I("일자", ex=datetime.date(2026, 9, 29), fmt="date", align="center")),
           (1, "차량 번호", L), (1, I("차량번호", ex="가나 12가 3456 (0.6㎥)", align="center")),
           (1, "운 전 원", L), (1, I("운전원", ex="김운전  (인)", blank="(인)", align="right"))], h=24)
    p.row([(2, "관리감독자", L), (2, I("관리감독자", ex="이감독  (인)", blank="(인)", align="right")),
           (1, "안전관리자", L), (1, I("안전관리자", ex="박안전  (인)", blank="(인)", align="right")),
           (1, "판    정", L), (1, F("판정", "", align="center", bold=True))], h=24)
    p.gap(6)
    hdr = p.row([(1, "번호", H), (1, "구 분", H), (2, "예 시 사 진", H), (1, "점 검 기 준", H), (1, "점 검 항 목", H),
                 (1, "결 과", H), (1, "조 치 사 항", H)], h=24)
    res_cells = []
    starts = {}
    for n, (gu, std, subs) in enumerate(ITEMS, 1):
        k = len(subs)
        r0 = p.r
        starts[n] = r0
        # 줄 높이: 사진이 들어갈 만큼(항목 전체 ≥ 118pt), 글이 길면 더
        from fb import text_lines
        need = [max(17, text_lines(t, W[5] * 10 / 9) * 12.5 + 5) for t in subs]
        std_need = text_lines(std, W[4] * 10 / 9) * 13 + 8
        total = max(88, sum(need), std_need)
        extra = (total - sum(need)) / k
        for j, t in enumerate(subs, 1):
            rr = p.r
            cells = []
            if j == 1:
                cells = [(1, str(n), {"kind": "ctext", "rs": k}), (1, gu, {"kind": "ctext", "rs": k, "size": 9}),
                         (2, "", {"rs": k}), (1, std, {"kind": "text", "rs": k, "size": 9})]
            key = (n, j)
            rv, act = (EX_BAD.get(key) or EX_NA.get(key) or ("양호", None))
            cells += [(1, "- " + t, {"kind": "text", "size": 9}),
                      (1, I(f"결과#{n}-{j}", ex=rv, dv="양호,불량,해당없음", align="center")),
                      (1, I(f"조치#{n}-{j}", ex=act, size=8.5))]
            p.row(cells, h=need[j - 1] + extra)
            res_cells.append(f"G{rr}")
        if n > 1:
            with open(os.path.join(IMG, f"{n:02d}.jpg"), "rb") as f:
                p.place_image(f.read(), 3, 4, r0, p.r - 1)
        if n == 7:
            from openpyxl.worksheet.pagebreak import Break
            p.ws.row_breaks.append(Break(id=p.r - 1))
            p.page1_pt = sum((p.ws.row_dimensions[r].height or 15) for r in range(1, p.r))
    rng = f"G{hdr + 1}:G{p.r - 1}"
    p.gap(6)
    p.row([(2, "점 검 결 과", L),
           (6, F("요약", f'=IF(COUNTA({rng})=0,"","양호 "&COUNTIF({rng},"양호")&" · 불량 "&COUNTIF({rng},"불량")'
                        f'&" · 해당없음 "&COUNTIF({rng},"해당없음")&" · 빈칸 "&COUNTBLANK({rng})&"  (모두 "&ROWS({rng})&"칸)")', align="left"))], h=24)
    # 판정 수식(위쪽 칸) — 범위가 정해진 뒤 채움
    for i, (cell, t) in enumerate(p.formulas):
        if cell.coordinate == p.k["판정"]:
            p.formulas[i] = (cell, f'=IF(COUNTA({rng})=0,"",IF(COUNTIF({rng},"불량")>0,"사용 중지","사용 가능"))')
    p.ws.print_title_rows = f"{hdr}:{hdr}"
    p.end_print()
    p.after_note([
        "결과 칸을 누르면 목록(양호·불량·해당없음)이 나옵니다. 하나라도 «불량» 이면 맨 위 판정이 «사용 중지» 로 바뀝니다.",
        "불량은 조치사항에 무엇을 언제 고쳤는지 적고, 고친 뒤 다시 점검하세요.",
        "예시 사진은 점검 부위를 알려 주는 참고 사진입니다. 발주기관·원청이 정한 점검표가 있으면 그것을 쓰세요.",
    ] if not ex else ["이 시트는 작성 예시입니다(가상의 장비·이름)."])
    return p


def expect(inp):
    vals = [v for k, v in inp.items() if k.startswith("결과#")]
    good = sum(1 for v in vals if v == "양호")
    bad = sum(1 for v in vals if v == "불량")
    na = sum(1 for v in vals if v == "해당없음")
    blank = sum(1 for v in vals if not v)
    return {"판정": "사용 중지" if bad else "사용 가능",
            "요약": f"양호 {good} · 불량 {bad} · 해당없음 {na} · 빈칸 {blank}  (모두 {len(vals)}칸)"}
