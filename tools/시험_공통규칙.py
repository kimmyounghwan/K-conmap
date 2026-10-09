# -*- coding: utf-8 -*-
"""🧪 G217 (2026-10-09) 공통 규칙 한 곳(kcm_rules.py) · 수집 입구 번호 소급 — 다시 깨지지 않게 잠급니다.

  소장님: 「근본적인 해결 방안이야?」 → 「해줘」
  ① 규칙이 «한 곳» 인가 — build_json.py · collect.py 가 kcm_rules 의 같은 함수를 쓰는가
  ② 규칙 자체 — 이름 다듬기 · 사업자번호 10자리 · 전남광주통합특별시 지역
  ③ 수집 입구 — collect.archive 가 번호 · 대표를 «같은 공고 · 같은 이름» 일 때만 소급 · 섞인 머리글/겹친 줄 정리 · 두 번 돌려도 그대로
  돌리기: python tools/시험_공통규칙.py   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
"""
import csv
import io
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import kcm_rules as R   # noqa: E402

틀림 = []
셈 = [0]


def 봄(이름, 참, 덧=""):
    셈[0] += 1
    print(("✓ " if 참 else "✗ ") + 이름 + (f" — {덧}" if 덧 else ""))
    if not 참:
        틀림.append(이름)


# ② 규칙 자체
봄("② 이름 다듬기", R.norm_corp("주식회사 호남산업개발") == R.norm_corp("호남산업개발 주식회사") == "호남산업개발")
봄("② 번호 10자리 · 실수 «.0» 살림 · 짧은 것 버림",
   (R.bizno10("705-88-00777"), R.bizno10(7058800777.0), R.bizno10("123")) == ("7058800777", "7058800777", ""))
봄("② 전남광주통합특별시 여수시 → 전남", R.region_of("전남광주통합특별시 여수시") == "전남")
봄("② 전남광주통합특별시 광산구 → 광주", R.region_of("전남광주통합특별시 광산구") == "광주")
봄("② 통합특별시 본청(단서 없음) → 정하지 않음", R.region_of("전남광주통합특별시", "도로 정비공사") == "")
봄("② 옛 이름 전라남도 광양시 → 전남 · 경상북도 → 경북",
   (R.region_of("전라남도 광양시"), R.region_of("경상북도 경주시")) == ("전남", "경북"))

# ① 한 곳인가
try:
    import build_json as B
    봄("① build_json 이 같은 규칙을 씀(norm_corp · region_of · bizno10)",
       B.norm_corp is R.norm_corp and B.region_of is R.region_of and B.bizno10 is R.bizno10)
except ImportError as e:
    print(f"  (① build_json 은 판다스가 없어 건너뜀 — {e})")
try:
    import collect as C   # noqa: E402
except ImportError as e:  # requests 등이 없는 PC — ③ 은 클라우드 · 깃허브에서 돎
    C = None
    print(f"  (① · ③ collect 는 패키지가 없어 건너뜀 — {e})")
if C is not None:
    봄("① collect 가 같은 규칙을 씀", C.R is R)

# ③ 수집 입구 — 번호 · 대표 소급
COLS = C.ARCH_COLS if C is not None else []
with tempfile.TemporaryDirectory() as d:
  if C is not None:
      p = os.path.join(d, "extra_2099-01.csv")
      rows = [
          {"공고번호": "N1", "날짜": "2099-01-02", "1순위업체": "주식회사 가상산업개발"},     # 같은 공고 · 같은 이름 → 채움
          {"공고번호": "N2", "날짜": "2099-01-03", "1순위업체": "가상건설"},                 # 같은 공고지만 이름 다름 → 안 채움
          {"공고번호": "N3", "날짜": "2099-01-04", "1순위업체": "보관함건설"},               # 순위 보관함 1위 → 번호만
          {"공고번호": "N1", "날짜": "2099-01-02", "1순위업체": "주식회사 가상산업개발", "참가업체수": "57"},  # 겹친 줄
      ]
      with io.open(p, "w", encoding="utf-8-sig", newline="") as f:
          w = csv.DictWriter(f, fieldnames=COLS)
          w.writeheader()
          for r in rows[:2]:
              w.writerow({c: r.get(c, "") for c in COLS})
          f.write("﻿" + ",".join(COLS) + "\r\n")          # 2026-07 처럼 섞여 든 머리글
          for r in rows[2:]:
              w.writerow({c: r.get(c, "") for c in COLS})
      first = {"con": {
          "N1": {"win": "주식회사 가상산업개발", "bno": "2222222222", "ceo": "병", "dt": "20990102"},
          "N2": {"win": "엉뚱한건설", "bno": "3333333333", "ceo": "정", "dt": "20990103"},
      }, "serv": {}}
      C.ARCHIVE_DIR = d
      _원 = C.ranks3y.iter_notices
      C.ranks3y.iter_notices = lambda since_ymd=None: iter([("N3", {"r": [[1, "7777777777", "보관함건설", 1, 90.0]]})])
      try:
          C.archive(first, {"con": {}, "serv": {}})
          got = list(csv.DictReader(io.open(p, encoding="utf-8-sig", newline="")))
          by = {r["공고번호"]: r for r in got}
          봄("③ 같은 공고 · 같은 이름 → 번호 · 대표 소급", by["N1"]["사업자번호"] == "2222222222" and by["N1"]["대표자"] == "병",
             f'{by["N1"]["사업자번호"]} {by["N1"]["대표자"]}')
          봄("③ 이름이 다르면 소급 안 함(짐작 안 함)", by["N2"]["사업자번호"] == "", by["N2"]["사업자번호"])
          봄("③ 순위 보관함 1위 줄로 번호 소급", by["N3"]["사업자번호"] == "7777777777", by["N3"]["사업자번호"])
          봄("③ 섞인 머리글 · 겹친 줄 정리(공고마다 한 줄)", len(got) == 3 and sorted(by) == ["N1", "N2", "N3"], f"{len(got)}줄")
          봄("③ 겹친 줄의 값으로 빈 칸 채움(참가업체수)", by["N1"]["참가업체수"] == "57", by["N1"]["참가업체수"])
          before = open(p, "rb").read()
          C.archive(first, {"con": {}, "serv": {}})
          봄("③ 두 번 돌려도 파일 그대로(커밋이 부풀지 않음)", open(p, "rb").read() == before)
      finally:
          C.ranks3y.iter_notices = _원

print(f"\n{셈[0]}개 중 틀림 {len(틀림)}")
sys.exit(1 if 틀림 else 0)
