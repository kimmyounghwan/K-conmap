# -*- coding: utf-8 -*-
"""이력서 — 새로 만든 서식 (2026-11-16 · 소장님 「이력서도 도구화 해서 만들어 줘」 · 「만들어」)
   → ① 경력 사항 다섯 줄마다 근무 기간(시작일부터 끝날 그날까지 꽉 찬 달 · 남은 날 — 재직증명서 · 경력증명서(f_jaejik_gyeongryeok)와 같은 셈)
     · 모두 더한 총 경력(남은 날 30일은 1개월로) · 끝날을 비우면 재직 중 → 작성일까지 · 아직 안 적은 칸
   · 이력서(A4 세로 한 장 — 사진 칸 · 인적 사항 · 학력 · 경력(총 경력 줄) · 자격 · 면허 · 교육 · 훈련 · 기타(병역 · 외국어 · 컴퓨터 · 특기) ·
     «위의 기재 사항은 사실과 틀림이 없습니다.» · 작성일 · 작성자 서명). 소장님께 드린 이력서_서식.docx(11-16)와 같은 칸.
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   📷 사진 칸: 열 머리글 «증명사진»(사이트 사진 칸 — 높이 25pt 넘는 빈 쓰는 칸 · G492) — 작성 예시에는 현장 사진을 넣지 않음(사진예시.js 그림종류 «증명사진»).
■ 법정 서식 없음(구직자가 쓰는 자유 서식) — 가족 · 키 · 몸무게 · 재산 · 출신지역 · 혼인 여부 칸을 두지 않음(채용절차의 공정화에 관한 법률
  [시행 2020. 5. 26.] 제4조의3 — 구인자는 직무에 필요 없는 이런 정보를 요구 · 수집할 수 없음 · 제3조 상시 30명 이상 사업장 · 제6조 채용서류
  거짓 작성 금지 — 근거 /home/claude/g10/notes/이력서_근거.txt · 조문 세 번 확인).
■ 짐작 안 함: 겹친 기간(같은 때 두 곳)은 두 번 셈됨(글로 알림) · 학력 · 교육 기간은 글로 적음(셈 안 함)."""
import calendar
import datetime

import sgw as g
from fb import F, I
from sgw import L

SLUG = "iryeokseo"
TITLE = "이력서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "이력서 — 빈 서식 (A4 한 장 · 사진 칸 · 인적 사항 · 학력 · 경력 · 자격 · 교육 · 기타)"),
        (4, "이력서 — 작성 예시 (가상의 사람 · 회사 · 경력 줄마다 기간 · 총 경력이 저절로)"),
        (3, "① 경력 기간 · 총 경력 · 안 적은 칸 — 작성 예시")]
MULTI = True
SHORT = ("이력서 — 사진 · 인적 사항 · 학력 · 경력 · 자격 · 교육 · 병역을 적으면 경력 줄마다 근무 기간과 총 경력(○년 ○개월 ○일)이 "
         "저절로 나오고, 그림 PDF로 받습니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
NROW = 5
GRADS = "졸업,졸업 예정,수료,중퇴,재학"
MIL = "군필,미필,면제,해당 없음"

T_NOS = "⚠ 시작날이 없음"
T_NOE = "⚠ 끝날 · 작성일 없음"
T_REV = "⚠ 끝날이 시작날보다 앞섬"
T_NOW = "재직 중 — 작성일까지 "
TOT_A = "총 "
TOT_B = (" — 줄마다 시작일부터 끝날 그날까지 꽉 찬 달과 남은 날을 더함(남은 날 30일은 1개월로 · 같은 때 두 곳이면 두 번 셈됨 · "
         "끝날을 비우면 작성일까지)")
BIN_OK = "✓ 이력서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {}
EX_S = {"사진": None, "성명": "김가나", "영문성명": "KIM GANA", "생년월일": "1985. 3. 2.", "휴대전화": "010-0000-0000",
        "이메일": "gana@example.com", "주소": "가나도 가나시 건설로 1", "지원분야": "건축 현장 공무 · 공정 관리",
        "학기간#1": "2004. 3. ~ 2010. 2.", "학교#1": "가나대학교", "전공#1": "건축공학과", "졸업#1": "졸업", "소재지#1": "가나도",
        "학기간#2": "2001. 3. ~ 2004. 2.", "학교#2": "가나고등학교", "전공#2": None, "졸업#2": "졸업", "소재지#2": "가나도",
        "학기간#3": None, "학교#3": None, "전공#3": None, "졸업#3": None, "소재지#3": None,
        "학기간#4": None, "학교#4": None, "전공#4": None, "졸업#4": None, "소재지#4": None,
        "시작#1": D(2010, 3, 2), "끝#1": D(2015, 12, 31), "회사#1": "다라건설(주)", "직위#1": "공무팀 · 대리", "업무#1": "아파트 신축 현장 공무 · 기성",
        "퇴직#1": "이직",
        "시작#2": D(2016, 1, 4), "끝#2": D(2023, 8, 31), "회사#2": "마바종합건설(주)", "직위#2": "현장 · 과장", "업무#2": "현장 공무 · 공정 관리",
        "퇴직#2": "이직",
        "시작#3": D(2023, 9, 1), "끝#3": None, "회사#3": "사아건설(주)", "직위#3": "현장 · 차장", "업무#3": "공사 관리 · 품질",
        "퇴직#3": None,
        "시작#4": None, "끝#4": None, "회사#4": None, "직위#4": None, "업무#4": None, "퇴직#4": None,
        "시작#5": None, "끝#5": None, "회사#5": None, "직위#5": None, "업무#5": None, "퇴직#5": None,
        "취득일#1": D(2009, 11, 20), "자격명#1": "건축기사", "등급#1": "기사", "발급#1": "한국산업인력공단",
        "취득일#2": D(2015, 5, 15), "자격명#2": "건설안전기사", "등급#2": "기사", "발급#2": "한국산업인력공단",
        "취득일#3": None, "자격명#3": None, "등급#3": None, "발급#3": None,
        "교기간#1": "2024. 6. 10. ~ 6. 14.", "과정#1": "건설사업관리 실무", "교기관#1": "가나건설기술교육원", "교비고#1": "수료",
        "교기간#2": "2010. 3. 5.", "과정#2": "건설업 기초안전보건교육", "교기관#2": "가나안전교육원", "교비고#2": "이수",
        "병역": "군필", "복무": "육군 · 병장 · 2005. 3. ~ 2007. 2.", "외국어": "영어(업무 메일) · 엑셀 · 캐드(CAD)",
        "특기": "공정표 작성 · 기성 정산", "작성일": D(2027, 5, 3)}


def _e(ex, k):
    return EX_S.get(k) if ex else None


def inp(k, ex, **kw):
    kw.setdefault("size", 9)
    kw.setdefault("align", "left")
    return I(k, ex=_e(ex, k), **kw)


# ── 기간 셈(f_jaejik_gyeongryeok _dur 와 같음 — k개월을 마친 다음 날 = EDATE(s,k) · 그 달에 같은 날이 없으면 말일에 끝나 다음 날 · 민법 제160조)
def _S(i):
    return f"{{이력서!시작#{i}}}"


def _EE(i):
    n0 = f"{{이력서!끝#{i}}}"
    return f"IF(N({n0})>0,{n0},N({{이력서!작성일}}))"


def _A(s, k):
    return f"(EDATE({s},{k})+IF(DAY(EDATE({s},{k}))<DAY({s}),1,0))"


def _bad(i):
    s, ee = _S(i), _EE(i)
    return f"OR(N({s})=0,{ee}=0,{ee}<{s})"


def _months_f(i):
    s, E = _S(i), f"({_EE(i)}+1)"
    m0 = f"((YEAR({E})-YEAR({s}))*12+MONTH({E})-MONTH({s}))"
    return f"=IF({_bad(i)},0,{m0}-IF({_A(s, m0)}>{E},1,0))"


def _days_f(i):
    s, E = _S(i), f"({_EE(i)}+1)"
    return f"=IF({_bad(i)},0,{E}-{_A(s, '{달#' + str(i) + '}')})"


def _txt(m, d):
    return f'TRIM(IF(INT({m}/12)>0,INT({m}/12)&"년 ","")&IF(MOD({m},12)>0,MOD({m},12)&"개월 ","")&IF({d}>0,{d}&"일",""))'


def _period_f(i):
    s, n0, ee = _S(i), f"{{이력서!끝#{i}}}", _EE(i)
    return (f'=IF(N({s})=0,IF(N({n0})>0,"{T_NOS}",""),IF({ee}=0,"{T_NOE}",IF({ee}<{s},"{T_REV}",'
            f'IF(N({n0})=0,"{T_NOW}","")&{_txt("{달#" + str(i) + "}", "{날#" + str(i) + "}")})))')


TM = "(" + "+".join(f"N({{달#{i}}})" for i in range(1, NROW + 1)) + ")"
TD = "(" + "+".join(f"N({{날#{i}}})" for i in range(1, NROW + 1)) + ")"
TMM = f"({TM}+INT({TD}/30))"
TDD = f"MOD({TD},30)"

BIN = [("성명", '{이력서!성명}=""'), ("생년월일", '{이력서!생년월일}=""'), ("휴대전화", '{이력서!휴대전화}=""'),
       ("주소", '{이력서!주소}=""'), ("학력 사항(첫 줄 학교명)", '{이력서!학교#1}=""'), ("작성일", 'N({이력서!작성일})=0')]


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  이력서 — 경력 기간 · 총 경력 · 안 적은 칸 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 이력서의 경력 사항 다섯 줄마다 근무 기간(시작일부터 끝날 그날까지 꽉 찬 달과 남은 날)을 셈하고 모두 더합니다. "
              "끝날을 비우면 재직 중으로 보고 작성일까지 셉니다.")
    s7 = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  경력 기간 (이력서의 경력 사항)", need=24 * (NROW + 1) + 46 + 10)
    p.row([(2, "줄", L), (6, "근무 기간(꽉 찬 달 · 남은 날)", L), (2, "달", L), (2, "남은 날", L)], h=20)
    for i in range(1, NROW + 1):
        p.row([(2, f"경력 {i}", L), (6, F(f"기간#{i}", _period_f(i), align="left", size=8.5)),
               (2, F(f"달#{i}", _months_f(i), fmt='#,##0"개월";;""', align="right", size=8.5)),
               (2, F(f"날#{i}", _days_f(i), fmt='#,##0"일";;""', align="right", size=8.5))], h=24)
    p.row([(2, "총 경력", L), (10, F("총경력", f'=IF(AND({TM}=0,{TD}=0),"",{_txt(TMM, TDD)})', align="left", size=9, bold=True))], h=24)
    p.row([(2, "", L), (10, F("총기간", '=IF({총경력}="","","' + TOT_A + '"&{총경력}&"' + TOT_B + '")', align="left", size=8))], h=46)
    g.sec(p, "㉯  아직 안 적은 칸", need=46 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", L),
           (10, F("빈칸", '=IF(AND({이력서!성명}="",{이력서!휴대전화}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst
                  + ',4,300)))', align="left", size=8.5))], h=46)
    p.row([(2, "", L), (10, "※ 가족 · 키 · 몸무게 · 재산 · 출신지역 · 혼인 여부 칸은 두지 않았습니다(구인자는 직무에 필요 없는 이런 정보를 요구하거나 모을 수 없음 — 채용절차의 공정화에 관한 법률 제4조의3 · 상시 30명 이상 사업장 — 제3조). 채용서류는 거짓으로 쓰면 안 됩니다(제6조). 학력 · 교육 기간은 글로 적습니다(셈 안 함).", s7)])
    g.d.done(p)
    p.after_note(["이 장은 이력서의 경력 사항에서 저절로 셈합니다. 이력서 장에 적으세요."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 사람 · 회사 · 학교 · 번호)."])
    return p


# ── 이력서 ──────────────────────────────────────────────────────────────
NC = 96
WP = [91.2 / NC] * NC


def form(bk, ex):
    from openpyxl.styles import Border, Side
    p = g.pg(bk, ex, "이력서", fit=1, widths=WP)
    med = Side(style="medium", color="000000")
    LB = {"kind": "label", "size": 9}
    LBS = {"kind": "label", "size": 8.5}
    IN = {}

    def outer(r1, r2, c1=1, c2=NC):
        for r in range(r1, r2 + 1):
            for c in range(c1, c2 + 1):
                if r in (r1, r2) or c in (c1, c2):
                    b = p.ws.cell(row=r, column=c).border
                    p.ws.cell(row=r, column=c).border = Border(left=med if c == c1 else b.left, right=med if c == c2 else b.right,
                                                               top=med if r == r1 else b.top, bottom=med if r == r2 else b.bottom)

    p.row([(NC, "이    력    서", {"kind": "free", "size": 20, "bold": True, "align": "center"})], h=40)
    p.gap(6)
    # 인적 사항 — 사진 칸(열 머리글 «증명사진»)
    r1 = p.row([(16, "증명사진", LBS), (80, "인  적  사  항", LB)], h=17)
    p.row([(16, inp("사진", ex, align="center"), {"rs": 5}), (13, "성    명", LB), (27, inp("성명", ex, size=10), IN),
           (13, "영문 성명", LB), (27, inp("영문성명", ex), IN)], h=23)
    p.row([(13, "생년월일", LB), (27, inp("생년월일", ex), IN), (13, "휴대전화", LB), (27, inp("휴대전화", ex), IN)], h=23)
    p.row([(13, "이 메 일", LB), (67, inp("이메일", ex), IN)], h=23)
    p.row([(13, "주    소", LB), (67, inp("주소", ex, wrap=True), IN)], h=23)
    r2 = p.row([(13, "지원 분야", LB), (67, inp("지원분야", ex), IN)], h=23)
    outer(r1, r2)
    p.gap(7)
    # 학력 사항
    r1 = p.row([(8, "학력\n사항", dict(LB, rs=5)), (22, "기    간", LBS), (22, "학 교 명", LBS), (20, "전공(학과)", LBS),
                (12, "졸업 구분", LBS), (12, "소 재 지", LBS)], h=18)
    for i in range(1, 5):
        r2 = p.row([(22, inp(f"학기간#{i}", ex, align="center"), IN), (22, inp(f"학교#{i}", ex), IN), (20, inp(f"전공#{i}", ex), IN),
                    (12, inp(f"졸업#{i}", ex, align="center", dv=GRADS), IN), (12, inp(f"소재지#{i}", ex, align="center"), IN)], h=20)
    outer(r1, r2)
    p.gap(7)
    # 경력 사항
    r1 = p.row([(8, "경력\n사항", dict(LB, rs=NROW + 2)), (26, "근무 기간(시작 ~ 끝)", LBS), (18, "회 사 명", LBS), (14, "부서 · 직위", LBS),
                (20, "담당 업무", LBS), (10, "퇴직 사유", LBS)], h=18)
    def nov(r, c):
        """r 행 c | c+1 열 사이 세로줄 없앰(시작 ~ 끝 을 한 칸처럼)"""
        for cc, sd in ((c, "right"), (c + 1, "left")):
            b = p.ws.cell(row=r, column=cc).border
            p.ws.cell(row=r, column=cc).border = Border(left=None if sd == "left" else b.left, right=None if sd == "right" else b.right,
                                                        top=b.top, bottom=b.bottom)

    for i in range(1, NROW + 1):
        r = p.row([(12, inp(f"시작#{i}", ex, fmt=DT, align="center", size=8.5), IN),
                   (2, "~", {"kind": "ctext", "size": 8.5}),
                   (12, inp(f"끝#{i}", ex, fmt=DT, align="center", size=8.5), IN),
                   (18, inp(f"회사#{i}", ex), IN), (14, inp(f"직위#{i}", ex, size=8.5), IN), (20, inp(f"업무#{i}", ex, size=8.5, wrap=True), IN),
                   (10, inp(f"퇴직#{i}", ex, align="center", size=8.5), IN)], h=20)
        nov(r, 20)
        nov(r, 22)
    r2 = p.row([(26, "총 경력(셈)", LBS), (62, F("경력합계표시", '=IF({셈!총경력}="","",{셈!총경력})', align="left", size=9.5, bold=True), IN)],
               h=20)
    outer(r1, r2)
    p.gap(7)
    # 자격 · 면허
    r1 = p.row([(8, "자격\n면허", dict(LB, rs=4)), (18, "취 득 일", LBS), (30, "자격 · 면허명", LBS), (20, "등급 · 번호", LBS),
                (20, "발급 기관", LBS)], h=18)
    for i in range(1, 4):
        r2 = p.row([(18, inp(f"취득일#{i}", ex, fmt=DT, align="center", size=8.5), IN), (30, inp(f"자격명#{i}", ex), IN),
                    (20, inp(f"등급#{i}", ex, align="center"), IN), (20, inp(f"발급#{i}", ex, size=8.5), IN)], h=20)
    outer(r1, r2)
    p.gap(7)
    # 교육 · 훈련
    r1 = p.row([(8, "교육\n훈련", dict(LB, rs=3)), (22, "기    간", LBS), (34, "교육 과정", LBS), (20, "교육 기관", LBS),
                (12, "비    고", LBS)], h=18)
    for i in range(1, 3):
        r2 = p.row([(22, inp(f"교기간#{i}", ex, align="center", size=8.5), IN), (34, inp(f"과정#{i}", ex), IN),
                    (20, inp(f"교기관#{i}", ex, size=8.5), IN), (12, inp(f"교비고#{i}", ex, align="center"), IN)], h=20)
    outer(r1, r2)
    p.gap(7)
    # 기타 사항
    r1 = p.row([(8, "기타\n사항", dict(LB, rs=3)), (16, "병    역", LBS), (16, inp("병역", ex, align="center", dv=MIL), IN),
                (18, "군별 · 계급 · 복무 기간", LBS), (38, inp("복무", ex, size=8.5), IN)], h=20)
    p.row([(16, "외국어 · 컴퓨터", LBS), (72, inp("외국어", ex), IN)], h=20)
    r2 = p.row([(16, "특기 사항", LBS), (72, inp("특기", ex), IN)], h=20)
    outer(r1, r2)
    p.gap(14)
    p.row([(NC, "위의 기재 사항은 사실과 틀림이 없습니다.", {"kind": "free", "size": 11, "align": "center"})], h=22)
    p.gap(6)
    p.row([(NC, inp("작성일", ex, blank="          년        월        일", fmt="date", align="center", size=10.5), {"border": False})], h=22)
    p.gap(8)
    p.row([(46, "", {"kind": "free"}), (10, "작성자", {"kind": "free", "size": 10.5, "align": "center"}),
           (24, F("작성자표시", '=IF({성명}="","",{성명})', align="center", size=10.5), {"border": False}),
           (16, "(서명 또는 인)", {"kind": "free", "size": 9, "align": "left"})], h=24)
    p.end_print()
    p.after_note(["작성일은 오늘 날짜로 먼저 들어갑니다. 사진 칸을 누르면 사진을 넣습니다. 경력 줄마다 기간과 총 경력은 ① 장에서 저절로 셈합니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 사람 · 회사 · 학교 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


# ── 기대값(엑셀 식과 같은 셈) ───────────────────────────────────────────────
def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _ed(d, m):
    y = d.year + (d.month - 1 + m) // 12
    mo = (d.month - 1 + m) % 12 + 1
    return D(y, mo, min(d.day, calendar.monthrange(y, mo)[1]))


def _arise(s, k):
    x = _ed(s, k)
    return x + datetime.timedelta(days=1) if x.day < s.day else x


def _md(s, e):
    E = e + datetime.timedelta(days=1)
    m0 = (E.year - s.year) * 12 + E.month - s.month
    m = m0 - (1 if _arise(s, m0) > E else 0)
    return m, (E - _arise(s, m)).days


def _t(m, d):
    return ((f"{m // 12}년 " if m // 12 > 0 else "") + (f"{m % 12}개월 " if m % 12 > 0 else "") + (f"{d}일" if d > 0 else "")).strip()


def expect(pages):
    sm, sg = pages["셈"], pages["이력서"]
    a, b = {}, {}
    w = _d(sg.get("작성일"))
    tm = td = 0
    for i in range(1, NROW + 1):
        s, e = _d(sg.get(f"시작#{i}")), _d(sg.get(f"끝#{i}"))
        ee = e or w
        if not s or not ee or ee < s:
            m = d = 0
        else:
            m, d = _md(s, ee)
        a[f"달#{i}"], a[f"날#{i}"] = m, d
        tm, td = tm + m, td + d
        if not s:
            a[f"기간#{i}"] = T_NOS if e else ""
        elif not ee:
            a[f"기간#{i}"] = T_NOE
        elif ee < s:
            a[f"기간#{i}"] = T_REV
        else:
            a[f"기간#{i}"] = ("" if e else T_NOW) + _t(m, d)
    tot = "" if (tm == 0 and td == 0) else _t(tm + td // 30, td % 30)
    a["총경력"] = tot
    a["총기간"] = "" if not tot else TOT_A + tot + TOT_B
    if not sg.get("성명") and not sg.get("휴대전화"):
        a["빈칸"] = ""
    else:
        mc = {"성명": not sg.get("성명"), "생년월일": not sg.get("생년월일"), "휴대전화": not sg.get("휴대전화"), "주소": not sg.get("주소"),
              "학력 사항(첫 줄 학교명)": not sg.get("학교#1"), "작성일": not w}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    b["경력합계표시"] = tot
    b["작성자표시"] = sg.get("성명") or ""
    return {"셈": a, "이력서": b}


for _t_ in (T_NOS, T_NOE, T_REV, T_NOW, TOT_A, TOT_B, BIN_OK, BIN_A):
    assert len(_t_) < 255 and '"' not in _t_, _t_[:40]
