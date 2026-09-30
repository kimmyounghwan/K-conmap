# -*- coding: utf-8 -*-
"""📄 공고문 전문(ntext.py) 시험 — python tools/test_ntext.py  (2026-09-30)
진짜 공고문 파일은 저장소에 넣지 않습니다(남의 이름 · 번호). 여기서 작은 hwpx 를 그 자리에서 만들고,
hwp 는 PARA_TEXT 풀기(_para_text)를 바이트로 봅니다."""
import io
import json
import os
import sys
import tempfile
import zipfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import ntext as N

ok = bad = 0


def 봄(이름, 참):
    global ok, bad
    if 참:
        ok += 1
    else:
        bad += 1
        print("✗", 이름)


# ── 공고문 고르기 ──
봄("공고문 hwpx 먼저", N.pick_doc([["설계내역서(A).xlsx", "u1"], ["공고문(A).pdf", "u2"], ["공고문(A).hwpx", "u3"]])[2] == "u3")
봄("공고문 이름 우선", N.pick_doc([["입찰 안내공고.hwpx", "a"], ["공고문(A).pdf", "b"]])[2] == "b")
봄("도면 · 시방 · 설명서 빼기", N.pick_doc([["입찰공고 도면.pdf", "a"], ["공사입찰설명서.hwpx", "b"], ["시방서.hwp", "c"]]) is None)
봄("zip 빼기", N.pick_doc([["공고문.zip", "a"]]) is None)
봄("시담 공고", N.pick_doc([["전자수의시담 공고(○○).hwp", "u9"]])[2] == "u9")
봄("빈 첨부", N.pick_doc(None) is None and N.pick_doc([]) is None)

# ── 글 다듬기 ──
t = N.tidy("가\r\n\r\n\r\n나\t\t다 라﻿\n\n\n\n마")
봄("빈 줄 하나로 · 탭 · 특수 공백", t == "가\n\n나 다 라\n\n마")

# ── hwpx (그 자리에서 만든 것) ──
SEC = """<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
<hp:p><hp:run><hp:t>○○군 공고 제2026-0000호</hp:t></hp:run></hp:p>
<hp:p><hp:run><hp:rect><hp:drawText><hp:subList><hp:p><hp:run><hp:t>입찰 공고</hp:t></hp:run></hp:p></hp:subList></hp:drawText></hp:rect></hp:run></hp:p>
<hp:p><hp:run><hp:t>1. 입찰참가자격</hp:t><hp:tab/><hp:t>토목공사업</hp:t></hp:run></hp:p>
<hp:p><hp:run><hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>입찰서 제출</hp:t></hp:run></hp:p></hp:subList></hp:tc><hp:tc><hp:subList><hp:p><hp:run><hp:t>2026. 10. 1. 10:00</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr>
<hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>개찰</hp:t></hp:run></hp:p></hp:subList></hp:tc><hp:tc><hp:subList><hp:p><hp:run><hp:t>2026. 10. 1. 11:00</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl></hp:run></hp:p>
<hp:p><hp:run><hp:ctrl><hp:header><hp:subList><hp:p><hp:run><hp:t>머리말은 빼야 함</hp:t></hp:run></hp:p></hp:subList></hp:header></hp:ctrl><hp:t>{긴 글}</hp:t></hp:run></hp:p>
</hs:sec>""".replace("{긴 글}", "입찰보증금은 입찰금액의 100분의 5 이상입니다. " * 8)
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w") as z:
    z.writestr("mimetype", "application/hwp+zip")
    z.writestr("Contents/section0.xml", SEC)
t, why = N.extract(buf.getvalue(), ".hwpx")
봄("hwpx 글", t is not None and why == "")
if t:
    ls = t.split("\n")
    봄("hwpx 첫 줄", ls[0] == "○○군 공고 제2026-0000호")
    봄("hwpx 글상자 제목", "입찰 공고" in ls)
    봄("hwpx 탭은 띄어쓰기", "1. 입찰참가자격 토목공사업" in ls)
    봄("hwpx 표는 행마다 한 줄", "입찰서 제출 | 2026. 10. 1. 10:00" in ls and "개찰 | 2026. 10. 1. 11:00" in ls)
    봄("hwpx 머리말 뺌", "머리말은 빼야 함" not in t)

# ── hwp PARA_TEXT ──
def u16(s):
    return s.encode("utf-16-le")
raw = u16("가나") + bytes([11, 0]) + b"\x00" * 14 + u16("다") + bytes([9, 0]) + b"\x00" * 14 + u16("라") + bytes([13, 0])
봄("hwp 확장 컨트롤 8칸 건너뜀 · 탭 · 문단 끝", N._para_text(raw) == "가나다 라\n")

# ── 잠긴 · 옛 · 아닌 파일 ──
봄("옛 한글 3.0", N.extract(b"HWP Document File V3.00 \x1a" + b"\x00" * 100, ".hwp") == (None, "옛 한글(3.0) 문서"))
봄("html 이 오면", N.extract(b"<html>login</html>", ".hwp")[0] is None)
봄("깨진 hwpx", N.extract(b"PK\x03\x04broken", ".hwpx")[0] is None)

# ── 내보내기 — 목록에 있는 것만 · 오래된 것은 저장소에서도 ──
with tempfile.TemporaryDirectory() as d:
    N.NTEXT_DIR = os.path.join(d, "store")
    N.PUB_DIR = os.path.join(d, "pub")
    os.makedirs(N.NTEXT_DIR)
    for no, dt in (("A1", "2026-09-20"), ("B2", "2026-06-01"), ("C3", "2026-09-25")):
        N._save(os.path.join(N.NTEXT_DIR, no + ".json"), {"no": no, "f": "공고문.hwpx", "t": "글" * 300, "cut": 0, "dt": dt})
    os.makedirs(N.PUB_DIR)
    open(os.path.join(N.PUB_DIR, "OLD.json"), "w").write("{}")
    have = N.publish({"con": {"x": {"no": "A1"}}}, keep_days=60, today="2026-09-30")
    봄("목록에 있는 것만 내보냄", have == {"A1"} and sorted(os.listdir(N.PUB_DIR)) == ["A1.json"])
    봄("내보낸 모양", json.load(open(os.path.join(N.PUB_DIR, "A1.json"))) == {"f": "공고문.hwpx", "t": "글" * 300, "cut": 0})
    봄("60일 지난 것은 저장소에서도 지움 · 안 지난 것은 둠", sorted(os.listdir(N.NTEXT_DIR)) == ["A1.json", "C3.json"])

# ── 2026-09-30 #655 — BMP 밖 글자 · 짝 없는 서로게이트 때문에 저장이 터져 회차 전체가 멈췄던 것 ──
봄("hwp 글: 짝 맞는 서로게이트는 한 글자로", N._para_text("가".encode("utf-16le") + "𠀀".encode("utf-16le")) == "가𠀀")
봄("hwp 글: 짝 없는 것은 �", N._para_text("가".encode("utf-16le") + b"\x00\xd8" + "나".encode("utf-16le")) == "가\ufffd나")
봄("다듬기: 짝 없는 서로게이트 지움", N.tidy("a\ud800b\udc00c") == "abc")
import types
_가짜 = types.ModuleType("requests")
_가짜.get = lambda url, **kw: types.SimpleNamespace(status_code=200, content=b"x" * 10)
sys.modules["requests"] = _가짜
_원래 = N.extract
봉 = [0]


def _뽑기(body, ext):
    봉[0] += 1
    return ("글" * 300 + ("\ud800" if 봉[0] == 1 else ""), "")


N.extract = _뽑기
with tempfile.TemporaryDirectory() as d:
    N.NTEXT_DIR = os.path.join(d, "store")
    N.NTEXT_BOOK = os.path.join(d, "book.json")
    st = {"con": {
        "a": {"no": "A1", "dt": "2026-09-30 10:00:00", "close": "2026-12-31 10:00:00", "docs": [["공고문.hwpx", "u1"]]},
        "b": {"no": "B2", "dt": "2026-09-29 10:00:00", "close": "2026-12-31 10:00:00", "docs": [["공고문.hwpx", "u2"]]}}}
    try:
        n = N.fetch(st, "2026-09-30 18:40", "20260930184000")
        터짐 = None
    except Exception as e:
        n, 터짐 = -1, type(e).__name__
    bk = json.load(open(N.NTEXT_BOOK, encoding="utf-8")) if os.path.exists(N.NTEXT_BOOK) else {}
    봄("저장이 터진 한 건 때문에 멈추지 않음", 터짐 is None and n == 1)
    봄("터진 건은 다시 안 봄 · 나머지는 저장", bk.get("A1", {}).get("perm") is True
       and "저장 실패" in bk.get("A1", {}).get("why", "") and os.path.exists(os.path.join(N.NTEXT_DIR, "B2.json")))
N.extract = _원래

print(f"\n공고문 전문 시험: {ok}가지 맞음" + (f" · {bad}가지 틀림" if bad else ""))
sys.exit(1 if bad else 0)
