# -*- coding: utf-8 -*-
"""🧪 G216 (2026-10-09) 업체 사업자번호 — 읽기 · 채우기 · 가르기가 다시 깨지지 않게 잠급니다.

  소장님: 「예전에 고쳤잖아. 업체가 쭉 나오면 그 업체 선택하면 분석글이 나오게 분명 고쳤는데, 또 이래…」
          「이번에는 확실하게 고치는거 맞아. 몇 번째 헛 수고만 하잖아.」
  까닭 둘:
    ① 수집분(extra_*.csv) 번호 칸을 숫자로 읽어 «7058800777.0» → 11자리 → 버림 (2026-09 6,782건 전부)
    ② 2026-04~08 수집분은 번호 없이 들어옴 → 같은 이름 다른 회사가 한 칸으로 합쳐짐(호남산업개발 두 회사)
  돌리기: python tools/시험_업체번호채움.py   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
"""
import io
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
try:
    import pandas as pd      # noqa: E402
except ImportError:          # 판다스가 없는 컴퓨터(올리기만 하는 PC)에서는 건너뜀 — 클라우드 · 깃허브는 있음
    print("(pandas 가 없어 건너뜀)")
    sys.exit(0)
import build_json as B       # noqa: E402

B.log = lambda m: None       # 시험 중에는 굽기 글을 찍지 않음
틀림 = []
셈 = [0]


def 봄(이름, 참, 덧=""):
    셈[0] += 1
    print(("✓ " if 참 else "✗ ") + 이름 + (f" — {덧}" if 덧 else ""))
    if not 참:
        틀림.append(이름)


# ① 번호 칸을 «글자» 로 읽는가 — 빈 칸이 섞여도 10자리 그대로
with tempfile.TemporaryDirectory() as d:
    p = os.path.join(d, "extra_2099-01.csv")
    with io.open(p, "w", encoding="utf-8-sig") as f:
        f.write("공고번호,날짜,발주기관,공고명,1순위업체,사업자번호,대표자,투찰금액,투찰률\n")
        f.write("R99A1,2099-01-02,가상시,가상 공사 하나,가상건설(주),7058800777,가나다,1000000,90.1\n")
        f.write("R99A2,2099-01-03,가상시,가상 공사 둘,나라건설,,,2000000,89.9\n")
        f.write("R99A3,2099-01-04,가상시,가상 공사 셋,다온건설,0128800777,라마바,3000000,90.2\n")
    x = B.biz_cols(B.read_extra(p))
    봄("① 빈 칸이 섞인 번호 칸 → 10자리 그대로(실수로 읽어 11자리 되어 버리던 것)", x["bizno"].tolist()[0] == "7058800777", str(x["bizno"].tolist()))
    봄("① 0 으로 시작하는 번호도 그대로", x["bizno"].tolist()[2] == "0128800777", str(x["bizno"].tolist()))
    y = pd.DataFrame({"사업자번호": [7058800777.0, None]})
    y = B.biz_cols(y)
    봄("① 혹시 실수로 읽혀도 «.0» 을 떼고 살림", y["bizno"].tolist() == ["7058800777", ""], str(y["bizno"].tolist()))

# ② 빈 번호 채우기 — 같은 공고 → 상호(하나뿐) → 대표
df = pd.DataFrame({
    "공고번호": ["N1", "N2", "N3", "N4", "N5", "N6"],
    "1순위업체": ["주식회사 가상산업개발", "가상산업개발 주식회사", "가상산업개발 주식회사", "(주)두곳건설", "다른이름건설", "한곳건설(주)"],
    "bizno": ["", "1111111111", "", "", "", ""],
    "ceo": ["", "갑", "", "", "", ""],
    "대표자": ["", "", "", "", "", "을"],
    "dt": pd.to_datetime(["2099-01-01"] * 6),
})
first = {"con": {
    "N1": {"win": "주식회사 가상산업개발", "bno": "2222222222", "ceo": "병", "corps": [["주식회사 가상산업개발", 1, 90.0, "2222222222", "병"]]},
    "N5": {"win": "엉뚱한건설", "bno": "3333333333", "ceo": "정"},                     # 이름이 다르면 공고로 채우지 않음
    "N9": {"win": "x", "corps": [["(주)두곳건설", 1, 90, "4444444444", "무"], ["(주)두곳건설", 1, 90, "5555555555", "기"],
                                 ["한곳건설(주)", 1, 90, "6666666666", "경"]]},
}}
st = B.fill_bizno(df, first=first, rank_iter=iter(()))
b = df["bizno"].tolist(); c = df["ceo"].tolist()
봄("② 같은 공고번호 · 같은 이름 → 그 공고의 번호 · 대표", b[0] == "2222222222" and c[0] == "병", f"{b[0]} {c[0]}")
봄("② 상호가 아는 번호 «한 곳» 하고만 이어지면 채움", b[2] == "1111111111" and c[2] == "갑", f"{b[2]} {c[2]}")
봄("② 같은 상호에 번호가 둘이면 채우지 않음", b[3] == "", b[3])
봄("② 공고번호가 같아도 이름이 다르면 채우지 않음", b[4] == "", b[4])
봄("② 수집분 «대표자» 칸을 씀", c[5] == "을", c[5])
봄("② 서로 다른 회사(주식회사 가상산업개발 · 가상산업개발 주식회사)는 번호가 갈림", b[0] != b[1], f"{b[0]} / {b[1]}")

# ③ 순위 보관함 1위 줄로 채움
df2 = pd.DataFrame({"공고번호": ["M1"], "1순위업체": ["보관함건설"], "bizno": [""], "ceo": [""], "dt": pd.to_datetime(["2099-02-01"])})
B.fill_bizno(df2, first={}, rank_iter=iter([("M1", {"r": [[1, "7777777777", "보관함건설", 1, 90.0], [2, "8888888888", "이등건설", 1, 90.1]]})]))
봄("③ 순위 보관함 1위 줄(같은 이름)로 채움", df2["bizno"].tolist() == ["7777777777"], str(df2["bizno"].tolist()))

# ④ 진짜 자료(있으면) — 번호 칸이 있는 수집분 달은 9할 넘게 번호가 살아야 함
import glob  # noqa: E402
살펴 = []
for p in sorted(glob.glob(os.path.join(ROOT, "data", "extra_*.csv"))):
    try:
        x = B.read_extra(p)
    except Exception:
        continue
    if "사업자번호" not in x.columns:
        continue
    raw = x["사업자번호"].fillna("").astype(str).str.replace(r"[^0-9]", "", regex=True).str.len().between(10, 10)
    if len(x) < 300 or raw.mean() < 0.9:
        continue                                  # 수집 때부터 번호가 없던 달은 여기서 따지지 않음
    got = (B.biz_cols(x)["bizno"] != "").mean()
    살펴.append((os.path.basename(p), round(float(raw.mean()), 3), round(float(got), 3)))
    봄(f"④ {os.path.basename(p)} 원본 번호 {raw.mean():.1%} → 읽은 뒤 {got:.1%}", got >= raw.mean() - 0.001)
if not 살펴:
    print("  (④ 번호 칸이 찬 수집분이 없어 건너뜀)")

print(f"\n{셈[0]}개 중 틀림 {len(틀림)}")
sys.exit(1 if 틀림 else 0)
