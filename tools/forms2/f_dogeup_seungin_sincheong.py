# -*- coding: utf-8 -*-
"""유해ㆍ위험작업 도급승인 신청서 — 새로 만든 서식 (2026-11-16 G710 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 도급 작업 구분(법 제58조제1항 각 호 · 제59조제1항 — 도급금지 · 승인 · 안전 및 보건에 관한 평가) · 도급기간(시작 · 끝 → 신청서 «도급기간» 저절로) ·
     승인 유효기간 3년(법 제58조제4항 · 제59조제2항 준용 — 넘으면 연장승인 별지 제32호서식) · 하도급 금지(법 제60조) · 아직 안 적은 칸
   · 신청서(산업안전보건법 시행규칙 [별지 제31호서식] 칸 차례 그대로 — 세로 한 쪽).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 119~1123.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G710_도급승인신청서_원문.txt — 글층 해시 같음 확인):
  · 산업안전보건법 [시행 2026. 10. 27.] 제58조(유해한 작업의 도급금지) ①~⑤ · 제59조(도급의 승인) ① ②(제58조제4항~제8항 준용) · 제60조(하도급 금지)
  · 시행령 [시행 2026. 8. 1.] 제51조(도급승인 대상 작업 — 2026-11-16 15:58 세 번 확인)
  · 시행규칙 [시행 2026. 8. 1.] 제75조제1항(별지 제31호서식 · 첨부 1~3 · 연장 별지 제32호 · 변경 별지 제33호)
■ 짐작 안 함: 3년은 시작일부터 3년 되는 날의 전날까지로 셈(민법 제157조 · 제160조) · 승인 유효기간은 «3년의 범위에서» 정하는 것이라 고용노동부가 정한 기간을 따름(글로 알림) ·
  처리절차 화살표는 원문 글층 «‣» 대신 그림처럼 «▶»."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "dogeup-seungin-sincheong"
TITLE = "유해ㆍ위험작업 도급승인 신청서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "유해ㆍ위험작업 도급승인 신청서(산업안전보건법 시행규칙 별지 제31호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "도급승인 신청서 — 작성 예시 (도급기간이 ① 장에서 저절로)"),
        (3, "① 도급 작업 구분 · 유효기간 3년 · 하도급 금지 — 작성 예시")]
MULTI = True
SHORT = ("유해ㆍ위험작업 도급승인 신청서(산업안전보건법 시행규칙 별지 제31호서식) — 도급 작업을 고르면 도급금지 · 승인 근거가, 도급 시작일 · 끝날을 적으면 "
         "신청서 «도급기간»과 승인 유효기간(3년) 확인이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
YOIL = "일월화수목금토"

GB = ["도금작업", "수은 · 납 · 카드뮴 제련 · 주입 · 가공 · 가열 작업", "허가대상물질 제조 · 사용 작업", "급성 독성 · 피부 부식성 물질 취급 등(영 제51조)"]
GB_TXT = ["도급금지 작업(법 제58조제1항제1호) — 수급인 기술이 전문적이고 사업 운영에 필수 불가결한 경우 고용노동부장관 승인으로 도급(같은 조 제2항제2호) · "
          "승인 전에 안전 및 보건에 관한 평가(같은 조 제3항)",
          "도급금지 작업(법 제58조제1항제2호) — 수급인 기술이 전문적이고 사업 운영에 필수 불가결한 경우 고용노동부장관 승인으로 도급(같은 조 제2항제2호) · "
          "승인 전에 안전 및 보건에 관한 평가(같은 조 제3항)",
          "도급금지 작업(법 제58조제1항제3호 · 제118조제1항 허가대상물질) — 수급인 기술이 전문적이고 사업 운영에 필수 불가결한 경우 고용노동부장관 승인으로 "
          "도급(같은 조 제2항제2호) · 승인 전에 안전 및 보건에 관한 평가(같은 조 제3항)",
          "도급 승인 대상 작업(법 제59조제1항 · 영 제51조 — 중량비율 1% 이상 황산 · 불화수소 · 질산 · 염화수소 취급 설비의 개조 · 분해 · 해체 · 철거 또는 "
          "설비 내부 작업 등 · 화학물질을 모두 없애고 증명자료를 붙여 신고한 경우는 제외) — 도급하려면 고용노동부장관 승인 · 안전 및 보건에 관한 평가"]
YG_OK_A = "✓ 도급기간 "
YG_OK_B = " — 승인 유효기간 3년의 범위 안(법 제58조제4항"
YG_LONG_A = "⚠ 도급기간이 3년을 넘음 — 승인 유효기간은 3년의 범위에서 정하므로 "
YG_LONG_B = "까지가 3년 · 그 뒤는 유효기간 만료 때 연장승인 신청(별지 제32호서식 · 법 제58조제5항"
YG_BAD = "⚠ 도급 끝날이 시작일보다 앞섭니다"
YG_NEED = "⚠ ① 장에 도급 시작일 · 끝날을 적으면 신청서 «도급기간»이 채워지고 유효기간(3년)을 봅니다"
HADO = "승인받은 작업을 도급받은 수급인은 그 작업을 하도급할 수 없음(법 제60조) · 승인 사항을 바꾸려면 변경승인(별지 제33호서식 · 법 제58조제6항)"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"작업": GB[3], "시작일": D(2027, 3, 2), "끝날": D(2027, 8, 31)}
EX_S = {"신청인": "이가람", "전화번호": "000-000-0000", "주소": "가나시 다라구 바사로 12", "상호": "가나화학(주)", "소재지": "가나시 다라구 산단로 34",
        "업종": "기초 화학물질 제조업", "주요생산품": "황산 · 질산", "대표자": "이가람", "근로자수": 180,
        "수급상호": "마바플랜트(주)", "수급업종": "기계설비공사업", "수급소재지": "가나시 마바구 공단로 56", "수급대표": "최지훈", "수급근로자수": 35,
        "작업공정": "황산 저장탱크 배관 개조 · 해체", "공정근로자수": 12, "물질량": "황산(98%) 약 3톤/월", "비고": None,
        "신청일": D(2027, 1, 20)}
HEAD = "■ 산업안전보건법 시행규칙 [별지 제31호서식]"
STATEMENT = ("「산업안전보건법」 제58조 제3항, 제59조제1항 및 같은 법 시행규칙 제75조제1항 및 제78조제1항에 따라 유해하거나 위험한 작업의 도급 승인을 "
             "신청합니다.")
ATTACH = ("1. 도급대상 작업의 공정관련 서류 일체(기계ㆍ설비의 종류 및 운전조건, 유해ㆍ위험물질의 종류ㆍ사용량, 유해ㆍ위험요인의 발생 실태 및 종사 근로자 수 등에 "
          "관한 사항을 포함해야 합니다)\n2. 도급작업 안전보건관리계획서(안전작업절차, 도급 시의 안전ㆍ보건관리 및 도급작업에 대한 안전ㆍ보건시설 등에 관한 사항을 "
          "포함해야 합니다)\n3. 안전 및 보건에 관한 평가 결과")
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(119, 1123)


def prow(p, items, h):
    r = p.r
    cells = []
    c = 1
    for it in items:
        a, b = GX.cols(it[0], it[1])
        assert b >= a, (p.name, r, it[:2])
        while (r, c) in p.occ:
            c += 1
        assert c == a, f"[{p.name}] {r}행 칸 자리 {c} ≠ {a} (x {it[0]})"
        cells.append((b - a + 1,) + tuple(it[2:]))
        c = b + 1
    return p.row(cells, h=h)


def _bd(p, r1, r2, x1, x2, top=True, bot=True, left=True, right=True):
    from openpyxl.styles import Border
    from fb import LINE
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=LINE if (left and c == c1) else None, right=LINE if (right and c == c2) else None,
                                                       top=LINE if (top and r == r1) else None, bottom=LINE if (bot and r == r2) else None)


LB = {"kind": "label", "size": 9.5}
SUB = {"kind": "text", "size": 7.5, "align": "left", "valign": "top"}
GR = {"kind": "label", "size": 7, "align": "left", "valign": "top"}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


SD, ED = "{시작일}", "{끝날}"
LIM = f"(DATE(YEAR({SD})+3,MONTH({SD}),DAY({SD}))-1)"


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  유해ㆍ위험작업 도급승인 신청서 — 작업 구분 · 도급기간 · 유효기간 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 도금 · 수은 · 납 · 카드뮴 · 허가대상물질 작업은 원칙적으로 도급할 수 없고(산업안전보건법 제58조제1항), 수급인 기술이 전문적이고 사업 운영에 필수 "
              "불가결한 경우 고용노동부장관 승인을 받아 도급합니다(같은 조 제2항제2호). 급성 독성 · 피부 부식성 물질 취급 등 대통령령으로 정하는 작업도 승인을 "
              "받아야 합니다(제59조제1항). 신청 전에 안전 및 보건에 관한 평가를 받습니다.")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  도급 작업 구분", need=26 * 3 + 10)
    p.row([(3, "도급 작업", g.L), (5, I("작업", ex=EX["작업"] if ex else None, dv=",".join(GB), align="center", size=8)),
           (4, "법 제58조제1항 각 호(도급금지) · 제59조제1항(승인 대상)", s7)], h=30)
    p.row([(3, "근거", g.L),
           (9, F("근거", '=' + "".join(f'IF({{작업}}="{GB[j]}","{GB_TXT[j]}",' for j in range(4)) + '""' + ")" * 4, align="left", size=8))], h=56)
    g.sec(p, "㉯  도급기간 · 승인 유효기간 (법 제58조제4항 · 제59조제2항)", need=26 * 4 + 10)
    p.row([(3, "도급 시작일", g.L), (5, I("시작일", ex=EX["시작일"] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=24)
    p.row([(3, "도급 끝날", g.L), (5, I("끝날", ex=EX["끝날"] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=24)
    p.row([(3, "유효기간", g.L),
           (9, F("유효", f'=IF(AND(N({SD})=0,N({ED})=0),IF({{작업}}="","","{YG_NEED}"),IF(OR(N({SD})=0,N({ED})=0),"{YG_NEED}",IF({ED}<{SD},"{YG_BAD}",'
                 f'IF({ED}<={LIM},"{YG_OK_A}"&' + _ymdf(SD) + '&" ~ "&' + _ymdf(ED) + f'&"{YG_OK_B}"&IF({{작업}}="{GB[3]}"," · 제59조제2항 준용)",")"),'
                 f'"{YG_LONG_A}"&' + _ymdf(LIM) + f'&"{YG_LONG_B}"&IF({{작업}}="{GB[3]}"," · 제59조제2항 준용)",")")))))', align="left", size=8))], h=44)
    p.row([(3, "하도급 · 변경", g.L), (9, HADO, {"kind": "text", "size": 7.5})])
    g.sec(p, "㉰  아직 안 적은 칸", need=26 * 2 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({신청서!상호}="",{신청서!수급상호}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 신청서의 «도급기간» 은 여기 시작일 · 끝날로 채워집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 번호)."])
    return p


BIN = [("도급 작업(① 장)", '{작업}=""'), ("신청인 성명", '{신청서!신청인}=""'), ("도급인 사업장 명칭", '{신청서!상호}=""'),
       ("수급인 사업장 명칭", '{신청서!수급상호}=""'), ("도급 작업공정", '{신청서!작업공정}=""'), ("도급기간(① 장)", f'OR(N({SD})=0,N({ED})=0)')]


def form(bk, ex):
    p = g.pg(bk, ex, "신청서", fit=1, widths=WP)
    prow(p, [(119, 1123, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(119, 1123, "유해ㆍ위험작업 도급승인 신청서", {"kind": "title", "size": 16})], h=32)
    prow(p, [(119, 371, "접수번호", GR), (371, 621, "접수일시", GR), (621, 872, "처리일", GR), (872, 960, "처리기간", GR), (960, 1123, "14일", GR)], h=24)
    rr = p.r - 1
    _bd(p, rr, rr, 872, 1123)

    def block(lab, rows):
        n = 2 * len(rows)
        first = True
        for row in rows:
            items = [(119, 245, lab, dict(LB, rs=n))] if first else []
            first = False
            items += [(x1, x2, name, SUB) for x1, x2, name, _, _ in row]
            ra = prow(p, items, h=12)
            rb = prow(p, [(x1, x2, inp(k, ex, **kw)) for x1, x2, _, k, kw in row], h=17)
            for x1, x2, _, _, _ in row:
                _bd(p, ra, rb, x1, x2)

    L = {"align": "left"}
    block("신청인", [[(245, 722, "성명", "신청인", L), (722, 1123, "전화번호", "전화번호", L)], [(245, 1123, "주소", "주소", L)]])
    block("도급인", [[(245, 1123, "사업장 명칭", "상호", L)], [(245, 1123, "소재지", "소재지", L)],
                   [(245, 722, "업종", "업종", L), (722, 1123, "주요생산품", "주요생산품", L)],
                   [(245, 722, "대표자 성명", "대표자", L), (722, 1123, "근로자 수", "근로자수", {"align": "left", "fmt": '#,##0"명";;""'})]])
    block("수급인", [[(245, 722, "사업장 명칭", "수급상호", L), (722, 1123, "업종", "수급업종", L)], [(245, 1123, "소재지", "수급소재지", L)],
                   [(245, 722, "대표자 성명", "수급대표", L), (722, 1123, "근로자 수", "수급근로자수", {"align": "left", "fmt": '#,##0"명";;""'})]])
    # 도급내용 — 도급기간은 ① 장 시작일 · 끝날에서
    rows = [[(245, 722, "도급 작업공정", "작업공정", L), (722, 1123, "도급공정 근로자 수", "공정근로자수", {"align": "left", "fmt": '#,##0"명";;""'})],
            [(245, 1123, "도급공정 사용 최대 유해화학 물질량(월)", "물질량", L)]]
    first = True
    for row in rows:
        items = [(119, 245, "도급내용", dict(LB, rs=6))] if first else []
        first = False
        items += [(x1, x2, name, SUB) for x1, x2, name, _, _ in row]
        ra = prow(p, items, h=12)
        rb = prow(p, [(x1, x2, inp(k, ex, **kw)) for x1, x2, _, k, kw in row], h=17)
        for x1, x2, _, _, _ in row:
            _bd(p, ra, rb, x1, x2)
    ra = prow(p, [(245, 1123, "도급기간", SUB)], h=12)
    rb = prow(p, [(245, 1123, F("도급기간", '=IF(OR(N({셈!시작일})=0,N({셈!끝날})=0),"",' + _ymdf("{셈!시작일}") + '&" ~ "&' + _ymdf("{셈!끝날}") + ')',
                                align="left", size=8.5))], h=18)
    _bd(p, ra, rb, 245, 1123)
    prow(p, [(119, 245, "비 고", LB), (245, 1123, inp("비고", ex, align="left"))], h=24)
    p.gap(6)
    n = text_lines(STATEMENT, sum(WP) * 10.0 / 9)
    prow(p, [(119, 1123, STATEMENT, {"kind": "free", "size": 9})], h=max(26, n * 9 * 1.45 + 4))
    prow(p, [(119, 1123, inp("신청일", ex, blank="년          월          일", fmt="date", align="right", size=9), {"border": False})], h=22)
    prow(p, [(119, 600, "", g.FR), (600, 700, "신청인", {"kind": "free", "size": 9, "align": "center"}),
             (700, 960, F("서명신청인", '=IF({신청인}="","",{신청인})', align="center", size=9), {"kind": "free", "border": False}),
             (960, 1123, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=22)
    prow(p, [(119, 1123, "지방고용노동청(지청)장 귀하", {"kind": "free", "size": 13, "bold": True})], h=26)
    p.gap(4)
    n = text_lines(ATTACH, sum(WP[GX.i(245):GX.i(996)]) * 10.0 / 7.5)
    prow(p, [(119, 245, "붙임 서류", {"kind": "label", "size": 8}), (245, 996, ATTACH, {"kind": "text", "size": 7.5}),
             (996, 1123, "수수료\n없음", {"kind": "ctext", "size": 8})], h=max(60, n * 7.5 * 1.45 + 6))
    prow(p, [(119, 1123, "처리절차", {"kind": "head", "size": 8.5})], h=16)
    box = {"kind": "ctext", "size": 7.5}
    arr = {"kind": "cfree", "size": 8}
    E = [(144, 273), (349, 478), (554, 684), (759, 889), (964, 1094)]
    steps = ["신청서\n작성", "검토", "결재", "승인서 작성", "통보"]
    who = ["신청인", "산업안전ㆍ보건\n업무 담당부서", "지방고용노동청\n(지청)장", "산업안전ㆍ보건\n업무 담당부서", "문서 발송\n담당부서"]
    items = [(119, 144, "", g.FR)]
    for j, (a, b) in enumerate(E):
        items.append((a, b, steps[j], box))
        if j < 4:
            items.append((b, E[j + 1][0], "▶", arr))
    items.append((1094, 1123, "", g.FR))
    prow(p, items, h=28)
    items = [(119, 144, "", g.FR)]
    for j, (a, b) in enumerate(E):
        items.append((a - 20 if j else a, b + 20 if j < 4 else b, who[j], {"kind": "cfree", "size": 7}))
        if j < 4:
            items.append((b + 20, E[j + 1][0] - 20, "", g.FR))
    items.append((1094, 1123, "", g.FR))
    prow(p, items, h=24)
    prow(p, [(119, 1123, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["«도급기간» 은 ① 장 시작일 · 끝날로 채워집니다. 서명 칸 이름은 신청인 성명에서 들어옵니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _lim(s):
    """엑셀 DATE(YEAR+3,MONTH,DAY)-1 — 2월 29일이면 3월 1일 - 1"""
    try:
        e = D(s.year + 3, s.month, s.day)
    except ValueError:
        e = D(s.year + 3, 3, 1)
    return e - datetime.timedelta(days=1)


def expect(pages):
    a_in, s_in = pages["셈"], pages["신청서"]
    a, o = {}, {}
    w = a_in.get("작업")
    a["근거"] = GB_TXT[GB.index(w)] if w in GB else ""
    sd, ed = _d(a_in.get("시작일")), _d(a_in.get("끝날"))
    tail = " · 제59조제2항 준용)" if w == GB[3] else ")"
    if not sd and not ed:
        a["유효"] = "" if not w else YG_NEED
    elif not sd or not ed:
        a["유효"] = YG_NEED
    elif ed < sd:
        a["유효"] = YG_BAD
    elif ed <= _lim(sd):
        a["유효"] = f"{YG_OK_A}{_ymd(sd)} ~ {_ymd(ed)}{YG_OK_B}{tail}"
    else:
        a["유효"] = f"{YG_LONG_A}{_ymd(_lim(sd))}{YG_LONG_B}{tail}"
    if not s_in.get("상호") and not s_in.get("수급상호"):
        a["빈칸"] = ""
    else:
        mc = {"도급 작업(① 장)": not w, "신청인 성명": not s_in.get("신청인"), "도급인 사업장 명칭": not s_in.get("상호"),
              "수급인 사업장 명칭": not s_in.get("수급상호"), "도급 작업공정": not s_in.get("작업공정"), "도급기간(① 장)": not (sd and ed)}
        miss = [n for n, _ in BIN if mc[n]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    o["도급기간"] = f"{_ymd(sd)} ~ {_ymd(ed)}" if (sd and ed) else ""
    o["서명신청인"] = s_in.get("신청인") or ""
    return {"셈": a, "신청서": o}


for _t in (*GB_TXT, YG_OK_A, YG_OK_B, YG_LONG_A, YG_LONG_B, YG_BAD, YG_NEED, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _t in GB:
    assert "," not in _t and '"' not in _t
