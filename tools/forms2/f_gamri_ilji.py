# -*- coding: utf-8 -*-
"""공사감리일지 — 새로 만든 서식 (2026-11-16 G701 · 소장님 「오늘 중으로 다 만들자. 서식」 — 101종 첫 묶음)
   → ① 감리일지(법 제25조제6항 — 기록 · 유지 · 감리중간 · 완료보고서에 붙임 규칙 제19조제4항제2호) · 서명 감리원 ↔ 건축사보 배치현황(규칙 제19조제5항) ·
     위법사항 처리(법 제25조제3항 · 제4항 — 시정 · 재시공 요청 · 공사중지 요청 · 따르지 않으면 시정 기간 끝난 날부터 7일 이내 위법건축공사보고서 규칙 제19조제1항) ·
     불이익 금지(제25조제7항) · 처분 · 아직 안 적은 칸
   · 일지(건축법 시행규칙 [별지 제21호서식] <개정 2026. 2. 27.> 칸 차례 그대로 — 한 쪽 · 날짜를 적으면 요일이 저절로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).

근거(국가법령정보센터 · 2026-11-16 · 메모 /home/claude/g10/notes/G701_감리일지_근거.md · 원문 글층 G701_감리일지_원문.txt):
  · 건축법 [시행 2026. 11. 12.] 제25조 ③ 위반 발견 → 건축주에게 알린 뒤 시정 · 재시공 요청 · 따르지 않으면 서면 공사중지 요청 ④ 따르지 않거나 공사를 계속하면 허가권자에게 보고
    ⑥ 감리일지 기록 · 유지 · 감리중간 · 완료보고서 ⑦ 불이익 금지 · 제110조제5호 · 제113조제2항제1호
  · 시행규칙 [시행 2026. 2. 27.] 제19조 ① 시정 등을 요청할 때 명시한 기간이 끝나는 날부터 7일 이내 위법건축공사보고서(별지 제20호서식) ③ 감리일지 = 별지 제21호서식
    ④ 감리중간 · 완료보고서(별지 제22호서식) 첨부 2. 공사감리일지 ⑤ 서명 · 날인한 감리원 ↔ 건축사보 배치현황 확인
■ 짐작 안 함: «7일 이내» 는 끝나는 날 빼고 셈(민법 제157조) — 끝날이 토요일 · 공휴일이면 그다음 날(민법 제161조)은 글로 알림 · «공사   년 월 일(요일)» 줄은 원문 글 차례대로
  (공사명 · 공사 날짜 · 요일 · 날씨) — 날짜를 적으면 요일만 셈."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import FR, H, L

SLUG = "gamri-ilji"
TITLE = "공사감리일지"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "공사감리일지(건축법 시행규칙 별지 제21호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "공사감리일지 — 작성 예시 (날짜를 적으면 요일이 저절로 · 공사명은 다른 서식에 쓴 공사명이 먼저 들어옴)"),
        (3, "① 감리일지 · 배치현황 · 위법사항 처리 · 보고 기한 — 작성 예시 (가상의 업무시설 신축)")]
MULTI = True
SHORT = ("공사감리일지(건축법 시행규칙 별지 제21호서식) — 날짜를 적으면 요일이 저절로 들어가고, 지적사항이 있으면 시정 · 재시공 요청 · 공사중지 요청과 "
         "따르지 않을 때 위법건축공사보고서 기한(시정 기간이 끝난 날부터 7일 · 남은 날), 서명한 감리원이 건축사보 배치현황에 있는지가 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
YOIL = "일월화수목금토"
ND = 8                  # 작업사항 줄

JG = ["지적 없음", "시정 · 재시공 요청", "공사중지 요청(서면)"]
IH = ["따름", "따르지 않음", "확인 전"]

# 판정 · 안내 글(셈 · 파이썬 같은 글)
PJ_0 = "지적사항 없음 — 일지 «지적사항 및 처리결과» 칸은 비워 두거나 «없음» 으로 적음"
PJ_1 = ("위반사항을 건축주에게 알린 뒤 공사시공자에게 시정 · 재시공 요청(법 제25조제3항) — 따르지 않으면 서면으로 공사중지를 요청할 수 있음")
PJ_2 = "공사중지를 서면으로 요청 — 요청받은 공사시공자는 정당한 사유가 없으면 즉시 공사를 중지(법 제25조제3항 후단)"
BG_OK = "✓ 요청을 따름 — 일지 «지적사항 및 처리결과» 에 처리결과를 적음"
BG_A = "위법건축공사보고서(별지 제20호서식)를 허가권자에게 — 시정 기간이 끝난 날("
BG_B = ")부터 7일 이내: "
BG_C = "까지(규칙 제19조제1항 · 법 제25조제4항) · "
BG_WAIT_A = "시정 기간 끝날 "
BG_WAIT_B = " — 그때까지 따르지 않으면 그날부터 7일 이내에 위법건축공사보고서를 허가권자에게(규칙 제19조제1항)"
BG_NEED = "⚠ 요청할 때 정한 시정 기간의 끝날을 적으면 보고 기한을 셉니다"
BS_OK = "✓ 서명한 감리원이 건축사보 배치현황에 있습니다(규칙 제19조제5항)"
BS_NO = "⚠ 서명한 감리원이 배치현황에 없습니다 — 허가권자가 일지 서명 감리원과 건축사보 배치현황이 같은지 확인함(규칙 제19조제5항)"
BIN_OK = "✓ 일지 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
ILJI = ("공사감리자는 감리일지를 기록 · 유지(건축법 제25조제6항 · 서식 규칙 제19조제3항) — 감리중간보고서 · 감리완료보고서(별지 제22호서식)에 "
        "공사감리일지를 붙여 냄(규칙 제19조제4항제2호)")
BULIK = ("건축주나 공사시공자는 시정 · 재시공 요청이나 허가권자 보고를 이유로 공사감리자 지정을 취소하거나 보수 지급을 거부 · 지연하는 등 불이익을 주면 안 됨"
         "(법 제25조제7항)")
CHEOBUN = ("허가권자에게 보고하지 않은 공사감리자 100만원 이하 과태료(법 제113조제2항제1호) · 시정 · 재시공 요청에 따르지 않거나 공사중지 요청을 받고도 "
           "공사를 계속한 공사시공자 2년 이하 징역 또는 1억원 이하 벌금(법 제110조제5호)")

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"지적": JG[1], "시정기한": D(2027, 3, 11), "이행": IH[0], "배치현황": "최지훈, 박서연"}
EX_S = {"일련번호": "제87호", "공사감리자": "정민호", "감리원": "최지훈", "공사명": "가나타워 신축공사", "일자": D(2027, 3, 10), "날씨": "맑음",
        "특기사항": "16시 5층 바닥 콘크리트 타설 예정이었으나 비 예보로 다음 날 오전으로 미룸(공사시공자와 협의)",
        "지적사항": "5층 B-3 보 아래 동바리 간격 1.2 m → 0.9 m 로 보강 요청(구두 · 건축주에게 알림) — 14시 30분 보강 끝난 것 확인"}
EX_W = [("철근콘크리트공사", "5층 바닥 · 보 철근 배근", "철근 규격 · 간격 · 피복 두께 · 이음 위치 확인 — 설계도서와 같음"),
        ("철근콘크리트공사", "거푸집 · 동바리 설치", "동바리 간격 · 수직도 확인 — B-3 보 아래 보강 요청"),
        ("전기공사", "슬래브 매입 배관", "배관 경로 · 고정 상태 확인"),
        ("기계설비공사", "슬리브 위치", "위생 · 소방 배관 슬리브 위치 확인")]

HOWTO = ["1. 공종에는 주요공종 및 단위공종을 기재합니다.",
         "2. 감리착안사항은 공사감리의 주안점 및 점검계획을 기재합니다.",
         "3. 특기사항은 특별히 명확하게 기록되어 있지 않은 내용의 발생·조치사항 등을 기재합니다.",
         "4. 지적사항 및 처리결과는 재시공 및 공사중지 등 구두 또는 서면에 의한 지시내용과 처리결과를 기재합니다."]
PAPER = "210㎜×297㎜[일반용지 60g/㎡)]"


def _ymdf(ref):
    """날짜 → «2027. 3. 10.» — TEXT 날짜 대신(두 번째 계산기 버릇 · G670)"""
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


def _ex(ex, k):
    return EX[k] if ex else None


def _es(ex, k):
    return EX_S[k] if ex else None


def _close(p, r):
    """표 안 «free» 칸(«공사» · «날씨 :» · «(서명 또는 인)» …)에 위 · 아래 선 — 줄 끝 칸은 오른선도(표 테두리가 끊기지 않게)"""
    from openpyxl.styles import Border
    from fb import LINE
    for c in range(1, p.pc + 1):
        bd = p.ws.cell(row=r, column=c).border
        if any(getattr(bd, k) is not None and getattr(bd, k).style for k in ("left", "right", "top", "bottom")):
            continue
        p.ws.cell(row=r, column=c).border = Border(top=LINE, bottom=LINE, right=LINE if c == p.pc else None)


# ── ① 감리일지 · 배치현황 · 위법사항 처리 ─────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  공사감리일지 — 배치현황 · 위법사항 처리 · 보고 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 공사감리자는 감리일지를 기록 · 유지하고(건축법 제25조제6항), 공사감리 중 위반사항을 발견하면 건축주에게 알린 뒤 공사시공자에게 시정 · 재시공을 "
              "요청합니다(같은 조 제3항). 따르지 않으면 허가권자에게 보고합니다(같은 조 제4항). 일지의 날짜를 적으면 요일이 저절로 들어갑니다.")
    sz = {"kind": "text", "size": 7.5}

    g.sec(p, "㉮  감리일지 · 건축사보 배치현황 (법 제25조제6항 · 규칙 제19조)", need=26 * 3 + 10)
    p.row([(3, "감리일지", L), (9, ILJI, {"kind": "text", "size": 7.5})])
    p.row([(3, "배치현황 건축사보", L), (9, I("배치현황", ex=_ex(ex, "배치현황"), size=8.5))], h=26)
    sg = "{감리일지!감리원}"
    p.row([(3, "서명 감리원 확인", L),
           (9, F("배치확인", f'=IF(OR({sg}="",{{배치현황}}=""),"",IF(ISNUMBER(SEARCH({sg},{{배치현황}})),"{BS_OK}","{BS_NO}"))',
                 align="left", size=8.5))], h=30)
    p.row([(3, "", L), (9, "배치현황(영 제19조제10항)에 올린 건축사보 이름을 쉼표로 적으면 일지 «건축사보 또는 감리원» 이름과 견줍니다.", sz)], h=24)

    g.sec(p, "㉯  위법사항 처리 · 위법건축공사보고서 기한 (법 제25조제3항 · 제4항 · 규칙 제19조제1항)", need=26 * 6 + 10)
    p.row([(3, "지적 구분", L), (5, I("지적", ex=_ex(ex, "지적"), dv=",".join(JG), align="center", size=8.5)),
           (4, "일지 «지적사항 및 처리결과» 의 지시", sz)], h=26)
    p.row([(3, "판    정", L),
           (9, F("판정", f'=IF({{지적}}="","",IF({{지적}}="{JG[0]}","{PJ_0}",IF({{지적}}="{JG[1]}","{PJ_1}","{PJ_2}")))',
                 align="left", size=8.5, bold=True))], h=34)
    p.row([(3, "시정 기간 끝날", L), (3, I("시정기한", ex=_ex(ex, "시정기한"), fmt=DT, align="center")),
           (6, "시정 · 재시공 · 공사중지를 요청할 때 정한 기간의 끝날", {"kind": "text", "size": 7})], h=26)
    p.row([(3, "따랐나", L), (3, I("이행", ex=_ex(ex, "이행"), dv=",".join(IH), align="center", size=8.5)), (6, "", FR)], h=26)
    sk = "{시정기한}"
    due = "{시정기한}+7"
    p.row([(3, "보고 기한", L),
           (9, F("보고기한", f'=IF(OR({{지적}}="",{{지적}}="{JG[0]}"),"",IF({{이행}}="{IH[0]}","{BG_OK}",IF(N({sk})=0,"{BG_NEED}",'
                 f'IF({{이행}}="{IH[1]}","{BG_A}"&' + _ymdf(sk) + f'&"{BG_B}"&' + _ymdf(due) + '&"("&' + _yo(due) + f'&")"&"{BG_C}"&'
                 f'IF({due}<TODAY(),"⚠ 지났습니다","오늘부터 "&TEXT({due}-TODAY(),"#,##0")&"일 남음")&" · 이날이 토요일 · 공휴일이면 그다음 날(민법 제161조)",'
                 f'"{BG_WAIT_A}"&' + _ymdf(sk) + '&"("&' + _yo(sk) + f'&")"&"{BG_WAIT_B}"))))', align="left", size=8.5, bold=True))], h=46)
    p.row([(3, "불이익 금지", L), (9, BULIK, {"kind": "text", "size": 7.5})])
    p.row([(3, "처분", L), (9, CHEOBUN, {"kind": "text", "size": 7.5})])

    g.sec(p, "㉰  아직 안 적은 칸", need=26 * 2 + 10)
    BIN = [("일련번호", '{감리일지!일련번호}=""'), ("공사감리자", '{감리일지!공사감리자}=""'), ("공사명", '{감리일지!공사명}=""'),
           ("날짜", 'N({감리일지!일자})=0'), ("날씨", '{감리일지!날씨}=""'), ("작업사항(공종)", 'COUNTA({감리일지!공종[]})=0')]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND(N({감리일지!일자})=0,{감리일지!공사명}="",COUNTA({감리일지!공종[]})=0),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=28)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 지적사항이 있는 날에만 ㉯ 를 고릅니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 사람 · 번호 — 동바리 보강을 요청하고 그날 보강을 확인한 경우)."])
    return p


# ── 감리일지 (별지 제21호서식 — 한 쪽) ───────────────────────────────────
W2 = [12.5] + [78.7 / 23] * 23      # 원문 «작업사항» 왼칸 14% + 잔칸 23
PC2 = len(W2)


def _rng(p, k, n):
    p.k[f"{k}[]"] = f"{p.k[f'{k}#1']}:{p.k[f'{k}#{n}']}"


def ilji(bk, ex):
    p = g.pg(bk, ex, "감리일지", fit=1, widths=W2)
    lab = {"kind": "label", "size": 9}
    l8 = {"kind": "label", "size": 8.5}
    sgn = {"kind": "free", "size": 7.5, "align": "right"}
    fr = {"kind": "free", "size": 9}
    p.row([(16, "■ 건축법 시행규칙 [별지 제21호서식] <개정 2026. 2. 27.>", {"kind": "note", "size": 7.5}), (8, "", FR)], h=16)
    p.title("공 사 감 리 일 지", h=40)
    p.gap(3)
    p.row([(3, "일련번호", l8), (21, I("일련번호", ex=_es(ex, "일련번호"), size=9))], h=26)
    _close(p, p.row([(3, "공사감리자", l8), (6, I("공사감리자", ex=_es(ex, "공사감리자"), align="center", size=9)), (3, "(서명 또는 인)", sgn),
                     (4, "건축사보 또는 감리원", dict(l8, size=7.5)), (5, I("감리원", ex=_es(ex, "감리원"), align="center", size=9)),
                     (3, "(서명 또는 인)", sgn)], h=30))
    _close(p, p.row([(3, "공사명", l8), (6, I("공사명", ex=_es(ex, "공사명"), size=8.5)), (2, "공사", dict(fr, align="right")),
                     (5, I("일자", ex=_es(ex, "일자"), fmt='yyyy"년  "m"월  "d"일"', blank="년        월        일", align="center", size=8.5)),
                     (3, F("요일표시", '=IF(N({일자})=0,"(      요일)","("&' + _yo("{일자}") + '&"요일)")', align="center", size=8.5)),
                     (2, "날씨 :", dict(fr, align="right", size=8.5)), (3, I("날씨", ex=_es(ex, "날씨"), align="center", size=8.5))], h=30))
    p.gap(4)
    hd = dict(H, size=9)
    p.row([(1, "작업사항", dict(lab, rs=ND + 1)), (4, "공종", hd), (6, "감리착안사항", hd), (13, "감리내용", hd)], h=26)
    for i in range(1, ND + 1):
        e = EX_W[i - 1] if (ex and i <= len(EX_W)) else (None, None, None)
        p.row([(4, I(f"공종#{i}", ex=e[0], align="center", size=8)), (6, I(f"착안#{i}", ex=e[1], size=8)), (13, I(f"내용#{i}", ex=e[2], size=8))], h=28)
    _rng(p, "공종", ND)
    p.gap(4)
    p.row([(1, "특기사항", lab), (23, I("특기사항", ex=_es(ex, "특기사항"), size=8.5))], h=90)
    p.row([(1, "지적사항\n및\n처리결과", lab), (23, I("지적사항", ex=_es(ex, "지적사항"), size=8.5))], h=110)
    p.gap(6)
    p.row([(PC2, "작성방법", dict(H, size=9.5))], h=22)
    for t in HOWTO:
        n = text_lines(t, sum(W2) * 10.0 / 8)
        p.row([(PC2, t, {"kind": "free", "size": 8})], h=n * 8 * 1.45 + 6)
    p.row([(PC2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["날짜를 적으면 요일이 저절로 들어갑니다. 공사명은 다른 서식에 쓴 공사명이 먼저 들어옵니다(고쳐 쓰면 그대로)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    ilji(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def expect(pages):
    sm, ij = pages["셈"], pages["감리일지"]
    a, b = {}, {}
    gw, bc = ij.get("감리원") or "", sm.get("배치현황") or ""
    a["배치확인"] = "" if (not gw or not bc) else (BS_OK if gw.lower() in bc.lower() else BS_NO)
    jg = sm.get("지적")
    a["판정"] = "" if not jg else (PJ_0 if jg == JG[0] else PJ_1 if jg == JG[1] else PJ_2)
    sk = _d(sm.get("시정기한"))
    ih = sm.get("이행")
    if not jg or jg == JG[0]:
        a["보고기한"] = ""
    elif ih == IH[0]:
        a["보고기한"] = BG_OK
    elif not sk:
        a["보고기한"] = BG_NEED
    elif ih == IH[1]:
        due = sk + datetime.timedelta(days=7)
        today = datetime.date.today()
        tail = "⚠ 지났습니다" if due < today else f"오늘부터 {(due - today).days:,}일 남음"
        a["보고기한"] = (BG_A + _ymd(sk) + BG_B + _ymd(due) + f"({YOIL[(due.weekday() + 1) % 7]})" + BG_C + tail
                       + " · 이날이 토요일 · 공휴일이면 그다음 날(민법 제161조)")
    else:
        a["보고기한"] = BG_WAIT_A + _ymd(sk) + f"({YOIL[(sk.weekday() + 1) % 7]})" + BG_WAIT_B
    il = _d(ij.get("일자"))
    gj = [ij.get(f"공종#{i}") for i in range(1, ND + 1)]
    miss = [n for n, ok in (("일련번호", not ij.get("일련번호")), ("공사감리자", not ij.get("공사감리자")), ("공사명", not ij.get("공사명")),
                            ("날짜", not il), ("날씨", not ij.get("날씨")), ("작업사항(공종)", not any(x not in (None, "") for x in gj))) if ok]
    started = il or ij.get("공사명") or any(x not in (None, "") for x in gj)
    a["빈칸"] = "" if not started else (BIN_OK if not miss else BIN_A + (" · ".join(miss))[:300])
    b["요일표시"] = "(      요일)" if not il else f"({YOIL[(il.weekday() + 1) % 7]}요일)"
    return {"셈": a, "감리일지": b}


# 엑셀 수식 안 글(따옴표 안)은 255자까지 — 넘으면 엑셀이 파일을 못 엶
for _t in (PJ_0, PJ_1, PJ_2, BG_OK, BG_A, BG_B, BG_C, BG_WAIT_A, BG_WAIT_B, BG_NEED, BS_OK, BS_NO, BIN_OK, BIN_A, *JG, *IH):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _dv in (JG, IH):
    assert len(",".join(_dv)) < 255 and not any("," in x for x in _dv), _dv[0]
