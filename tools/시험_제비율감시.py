# -*- coding: utf-8 -*-
"""🧪 G350 jebiwatch.py — 조달청 자료실 목록에서 «간접공사비(제비율)» 새 글 고르기 · 메일 글 · 굽기
   python3 tools/시험_제비율감시.py   (인터넷 안 씀 — 목록 HTML 은 10/21 조달청 자료실 줄 꼴을 본떠 지어냄)"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import jebiwatch as W  # noqa: E402

ok = bad = 0


def 봐(c, m):
    global ok, bad
    if c:
        ok += 1
        print("  ✓", m)
    else:
        bad += 1
        print("  ✗", m)


줄 = lambda no, sn, 제목, 날: (f'<tr> <td>{no}</td> <td> <div> <a href="#none" onclick="fn_view(\'{sn}\')"> {제목} </a> </div> </td>'
                               f' <td> <a href="/common/fileDown.do?key=20{sn}&amp;sn=1"><img src="/x.gif"></a> </td> <td> 김가상 </td> <td> {날} </td> <td> 71836 </td> </tr>')
HTML = ("<table><tbody>" +
        줄(4190, "2612300001", "2027년 조달청 시설공사 원가계산 간접공사비(제비율) 적용기준 변경 알림", "2026-12-30") +
        줄(4189, "2611100003", "2026년 시설공사 표준시장단가 공표", "2026-11-10") +
        줄(4185, "2604070010", "2026년 조달청 시설공사 원가계산 간접공사비(제비율) 적용기준 변경 알림", "2026-04-07") +
        줄(3990, "2507010005", "2025년 조달청 시설공사 원가계산 간접공사비(제비율) 적용기준 변경 알림", "2025-07-01") +
        "</tbody></table>")

print("① 목록 읽기")
r = W.줄뽑기(HTML)
봐(len(r) == 3, f"간접공사비 · 제비율 줄만 3개 (받음 {len(r)})")
봐(r[0]["sn"] == "2612300001" and r[0]["날"] == "2026-12-30", "글번호 · 날짜 — 줄 번호(4190) · 첨부 key(12자리) 는 글번호로 안 봄")
봐("간접공사비" in r[0]["제목"] and "71836" not in r[0]["제목"], "제목 = 링크 글")

print("② 새것 고르기(알려진 판 · 옛 글 거름)")
알, 최근 = W.알려진글()
봐("2604070010" in 알 and 최근 == "2026-04-07", f"jebiyul.json 판 글번호 · 최근 게시 {최근}")
옛받기 = W.받기
옛STORE = W.STORE
tmp = tempfile.mkdtemp()
W.STORE = os.path.join(tmp, "jebi_watch.json")
W.받기 = lambda url, timeout=15: HTML if "pageIndex=1" in url else "<table></table>"
st = W.보기(억지=True)
새 = [x["sn"] for x in st["새것"]]
봐(st["ok"] and 새 == ["2612300001"], f"새것 = 2027년 글 하나 (2025 옛 글 · 이미 넣은 4.13 글은 뺌) → {새}")
봐(os.path.exists(W.STORE), "상태 파일 남김(data/store/jebi_watch.json)")
st2 = W.보기()
봐(st2.get("t") == st.get("t"), "6시간 안에는 다시 안 봄")

print("③ 못 읽을 때")
def 실패(url, timeout=15):
    raise OSError("막힘")
W.받기 = 실패
st3 = W.보기(억지=True)
봐(st3.get("ok") is False and st3.get("새것") == st.get("새것"), "못 읽으면 ok: false · 지난 새것 그대로")

print("④ 굽기 · 메일 글")
W.받기 = lambda url, timeout=15: HTML if "pageIndex=1" in url else "<table></table>"
W.보기(억지=True)
dist = os.path.join(tmp, "dist")
pub = W.굽기(dist)
f = os.path.join(dist, "data", "jebi_watch.json")
봐(os.path.exists(f) and json.load(open(f, encoding="utf-8"))["새것"][0]["sn"] == "2612300001", "dist/data/jebi_watch.json — 화면이 읽는 꼴")
글 = W.메일글(pub["새것"])
봐("bbsSn=2612300001" in 글 and "/tools/jebiyul" in 글 and "클로드" not in 글, "메일 글 — 원문 고리 · 도구 주소 · «클로드» 없음")

W.받기 = 옛받기
W.STORE = 옛STORE
print(f"\n{ok} 통과 · {bad} 실패")
sys.exit(1 if bad else 0)
