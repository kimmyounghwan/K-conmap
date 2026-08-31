# -*- coding: utf-8 -*-
"""
inbox.py — «바탕화면에서 받은 자료를 사이트에 태우는» 통로

지금까지는 자료를 내려받으면 파일 이름을 맞추고 코드가 보는 위치에
직접 갖다 놓아야 했습니다. 그 과정에서 컬럼 이름이 다르거나 인코딩이
깨져서 조용히 반영이 안 되는 일이 생깁니다.

이 스크립트는 그걸 없앱니다.
  1) inbox 폴더에 파일을 그냥 던져 넣는다 (csv / xlsx / zip)
  2) python inbox.py 를 돌린다 (run_all.py 가 자동으로 부릅니다)
  3) 컬럼 이름을 알아서 맞추고, 날짜·금액·투찰률 형식을 정리하고,
     중복 공고번호를 걸러 data/extra_*.csv 로 저장한다
  4) build_json.py 가 이 파일을 3년치 원본과 함께 읽어 사이트에 반영한다
  5) 처리한 원본은 inbox/_처리완료/ 로 옮겨 둔다 (지우지 않습니다)

컬럼 이름은 아래 표에 있는 것 중 아무거나 써도 인식합니다.
"""
import os
import re
import glob
import shutil
from datetime import datetime

import pandas as pd

ROOT = os.path.dirname(os.path.abspath(__file__))
INBOX = os.path.join(ROOT, "inbox")
DONE = os.path.join(INBOX, "_처리완료")
DATA = os.path.join(ROOT, "data")

# 표준 컬럼 ← 실제로 들어올 법한 이름들
ALIAS = {
    "공고번호": ["공고번호", "입찰공고번호", "bidNtceNo", "공고번호(차수)", "번호"],
    "공고명":   ["공고명", "입찰건명", "건명", "bidNtceNm", "사업명", "공사명"],
    "발주기관": ["발주기관", "수요기관", "공고기관", "ntceInsttNm", "기관명", "발주처"],
    "날짜":     ["날짜", "개찰일시", "개찰일자", "opengDt", "공고일자", "일자"],
    "1순위업체": ["1순위업체", "낙찰업체", "낙찰자", "업체명", "1순위", "수급인"],
    "투찰금액": ["투찰금액", "낙찰금액", "금액", "계약금액", "투찰가"],
    "투찰률":   ["투찰률", "사정률", "낙찰률", "투찰율", "비율"],
    "전체업체": ["전체업체", "opengCorpInfo", "참여업체"],
}

REQUIRED = ["공고명", "발주기관", "투찰률"]


def log(m):
    print(f"  {m}", flush=True)


def read_table(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".xlsx", ".xls", ".xlsm"):
        try:
            return pd.read_excel(path)
        except Exception as e:
            log(f"엑셀 읽기 실패({os.path.basename(path)}): {e}")
            return None
    comp = "zip" if ext == ".zip" else None
    for enc in ("utf-8-sig", "cp949", "euc-kr"):
        try:
            return pd.read_csv(path, compression=comp, encoding=enc, low_memory=False)
        except Exception:
            continue
    log(f"읽기 실패: {os.path.basename(path)} (csv/xlsx/zip 만 됩니다)")
    return None


def normalize(df):
    """어떤 이름으로 왔든 표준 컬럼으로 맞춘다"""
    lower = {re.sub(r"\s+", "", str(c)).lower(): c for c in df.columns}
    out = pd.DataFrame()
    found = []
    for std, names in ALIAS.items():
        hit = None
        for n in names:
            k = re.sub(r"\s+", "", n).lower()
            if k in lower:
                hit = lower[k]
                break
        if hit is not None:
            out[std] = df[hit]
            found.append(std)
        else:
            out[std] = ""
    return out, found


def clean(df):
    df = df.copy()
    df["투찰률"] = (df["투찰률"].astype(str)
                  .str.replace("%", "", regex=False).str.strip())
    df["투찰률"] = pd.to_numeric(df["투찰률"], errors="coerce")
    df = df[df["투찰률"].notna() & (df["투찰률"] > 0) & (df["투찰률"] <= 200)]
    df["투찰률"] = df["투찰률"].map(lambda v: f"{v}%")

    amt = (df["투찰금액"].astype(str)
           .str.replace(",", "", regex=False)
           .str.replace("원", "", regex=False).str.strip())
    df["투찰금액"] = pd.to_numeric(amt, errors="coerce").fillna(0).astype("int64")

    dt = pd.to_datetime(df["날짜"], errors="coerce")
    df["날짜"] = dt.dt.strftime("%Y-%m-%d %H:%M:%S").fillna("")

    for c in ("공고명", "발주기관", "1순위업체", "공고번호", "전체업체"):
        df[c] = df[c].astype(str).str.strip().replace({"nan": "", "None": ""})

    df = df[(df["공고명"] != "") & (df["발주기관"] != "")]
    return df


def main():
    os.makedirs(INBOX, exist_ok=True)
    os.makedirs(DONE, exist_ok=True)
    os.makedirs(DATA, exist_ok=True)

    files = [p for p in glob.glob(os.path.join(INBOX, "*"))
             if os.path.isfile(p) and
             os.path.splitext(p)[1].lower() in (".csv", ".xlsx", ".xls", ".xlsm", ".zip")]

    print("=" * 52)
    print("  inbox — 받은 자료 반영")
    print("=" * 52)

    if not files:
        log("새로 넣은 파일이 없습니다. (inbox 폴더에 csv/xlsx 를 넣어주세요)")
        return 0

    frames, handled = [], []
    for p in files:
        name = os.path.basename(p)
        raw = read_table(p)
        if raw is None or raw.empty:
            log(f"⏭  {name} — 내용이 없습니다")
            continue
        norm, found = normalize(raw)
        missing = [c for c in REQUIRED if c not in found]
        if missing:
            log(f"⏭  {name} — 필요한 컬럼이 없습니다: {', '.join(missing)}")
            log(f"    (찾은 컬럼: {', '.join(found) if found else '없음'})")
            continue
        cleaned = clean(norm)
        if cleaned.empty:
            log(f"⏭  {name} — 쓸 수 있는 행이 없습니다 (투찰률 확인)")
            continue
        log(f"✔  {name} — {len(cleaned):,}행 인식 (컬럼 {len(found)}개)")
        frames.append(cleaned)
        handled.append(p)

    if not frames:
        log("반영할 자료가 없습니다.")
        return 0

    merged = pd.concat(frames, ignore_index=True)
    before = len(merged)
    merged = merged.drop_duplicates(subset=["공고번호", "공고명"], keep="last")

    stamp = datetime.now().strftime("%Y%m%d_%H%M")
    out = os.path.join(DATA, f"extra_{stamp}.csv")
    merged.to_csv(out, index=False, encoding="utf-8-sig")

    print("-" * 52)
    log(f"저장: data/extra_{stamp}.csv  ({len(merged):,}행, 중복 {before - len(merged):,}행 제거)")

    for p in handled:
        try:
            shutil.move(p, os.path.join(DONE, os.path.basename(p)))
        except Exception:
            pass
    log(f"원본 {len(handled)}개는 inbox/_처리완료/ 로 옮겼습니다")
    log("다음 단계: python build_json.py 를 돌리면 사이트에 반영됩니다")
    return len(merged)


if __name__ == "__main__":
    main()
