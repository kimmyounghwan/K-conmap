import streamlit as st
import pandas as pd
import requests
import pyrebase
import urllib3
import urllib.parse
from datetime import datetime, timedelta, timezone
import time
import re

# ==========================================
# 1. 보안 및 페이지 설정
# ==========================================
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
st.set_page_config(page_title="K-건설맵 Master", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
    <head>
        <meta name="naver-site-verification" content="bfb3f10bce2983b4dd5974ba39d05e3ce5225e73" />
        <meta name="description" content="K-건설맵: 전국 건설 공사 입찰 및 실시간 1순위 개찰 결과를 즉시 확인하세요.">
    </head>
    <style>
        .stApp[data-teststate="running"] .stAppViewBlockContainer { filter: none !important; opacity: 1 !important; }
        [data-testid="stStatusWidget"] { visibility: hidden !important; display: none !important; }
        .stApp { transition: none !important; }
        .main-title { background-color: #1e3a8a; color: white; border-radius: 10px; font-weight: 900; font-size: 28px; text-align: center; padding: 20px; margin-bottom: 25px; }
        .stat-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 10px; }
        .stat-label { font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
        .stat-val { font-size: 17px; font-weight: 800; color: #1e3a8a; }
        .calc-badge { font-size: 10px; color: #ea580c; font-weight: 700; margin-top: 3px; }
    </style>
""", unsafe_allow_html=True)

KST = timezone(timedelta(hours=9))

# ==========================================
# 2. 파이어베이스
# ==========================================
firebaseConfig = {
    "apiKey": "AIzaSyB5uvAzUIbEDTTbxwflTQk3wdzOufc4SE0",
    "authDomain": "k-conmap.firebaseapp.com",
    "databaseURL": "https://k-conmap-default-rtdb.firebaseio.com",
    "projectId": "k-conmap",
    "storageBucket": "k-conmap.firebasestorage.app",
    "messagingSenderId": "230642116525",
    "appId": "1:230642116525:web:f6f3765cf9a7273ba92324"
}
G2B_API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
SAFE_API_KEY = urllib.parse.unquote(G2B_API_KEY)


@st.cache_resource
def init_firebase():
    firebase = pyrebase.initialize_app(firebaseConfig)
    return firebase.auth(), firebase.database()


auth, db = init_firebase()

for k, v in [('logged_in', False), ('user_name', ""), ('user_license', ""), ('user_phone', ""), ('localId', ""),
             ('idToken', "")]:
    if k not in st.session_state: st.session_state[k] = v

# ==========================================
# 3. 상수 / 유틸
# ==========================================
REGION_LIST = ["전국(전체)", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남",
               "제주"]
ALL_LICENSES = ["[종합] 건축공사업", "[종합] 토목공사업", "[종합] 토목건축공사업", "[종합] 조경공사업", "[전문] 지반조성·포장공사업", "[전문] 실내건축공사업",
                "[전문] 철근·콘크리트공사업", "[기타] 전기공사업", "[기타] 정보통신공사업", "[기타] 소방시설공사업"]

BASE = 'http://apis.data.go.kr/1230000'
API_TABLE = {
    'cnstwk': {'notice': f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwk',
               'result': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwk',
               'detail': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwkDtl'},
    'etcwk': {'notice': f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoEtcwk',
              'result': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoEtcwk',
              'detail': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoEtcwkDtl'},
    'servc': {'notice': f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServc',
              'result': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoServc',
              'detail': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoServcDtl'},
    'goods': {'notice': f'{BASE}/ad/BidPublicInfoService/getBidPblancListInfoThng',
              'result': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoThng',
              'detail': f'{BASE}/as/ScsbidInfoService/getOpengResultListInfoThngDtl'},
}


def get_bid_type(bid_no: str) -> str:
    code = bid_no.strip().upper()
    if len(code) < 5: return 'cnstwk'
    return {'CW': 'cnstwk', 'BK': 'etcwk', 'EW': 'etcwk', 'SV': 'servc', 'GD': 'goods'}.get(code[3:5], 'cnstwk')


def filter_by_region(df, sel):
    if sel == "전국(전체)": return df
    rk = {"서울": ["서울"], "부산": ["부산"], "대구": ["대구"], "인천": ["인천"], "광주": ["광주"], "대전": ["대전"], "울산": ["울산"],
          "세종": ["세종"], "경기": ["경기", "경기도"], "강원": ["강원", "강원도"], "충북": ["충북", "충청북도"], "충남": ["충남", "충청남도"],
          "전북": ["전북", "전라북도"], "전남": ["전남", "전라남도"], "경북": ["경북", "경상북도"], "경남": ["경남", "경상남도"], "제주": ["제주"]}
    pat = '|'.join(rk.get(sel, [sel]))
    return df[df['발주기관'].str.contains(pat, na=False) | df['공고명'].str.contains(pat, na=False)]


def get_match_keywords(lic):
    k = []
    if "토목" in lic: k.extend(["토목", "도로", "포장", "하천", "교량", "정비", "관로", "상수도", "하수도"])
    if "건축" in lic: k.extend(["건축", "신축", "증축", "보수", "인테리어", "방수", "도장"])
    if "조경" in lic: k.extend(["조경", "식재", "공원", "수목"])
    if "전기" in lic: k.extend(["전기", "배전", "가로등", "CCTV"])
    if "통신" in lic: k.extend(["통신", "네트워크", "방송"])
    if "소방" in lic: k.extend(["소방", "화재", "스프링클러"])
    if "철근" in lic or "콘크리트" in lic: k.extend(["철콘", "구조물", "옹벽", "배수", "기초"])
    return list(set(k))


def raw_to_int(raw) -> int:
    if raw is None: return 0
    r = str(raw).strip().replace(',', '').replace('원', '').replace('%', '')
    if not r or r in ('0', 'None', 'nan', 'NaN', '-'): return 0
    try:
        return int(float(r))
    except:
        return 0


def fmt_amt(v: int) -> str:
    return f"{v:,}원" if v > 0 else ''


def _safe_list(obj):
    if not obj: return []
    if isinstance(obj, list): return obj
    if isinstance(obj, dict):
        item = obj.get('item')
        return item if isinstance(item, list) else [item] if isinstance(item, dict) else [obj]
    return []


def _api_get(url: str, params: dict, timeout: int = 8) -> list:
    try:
        r = requests.get(url, params={**params, 'serviceKey': SAFE_API_KEY, 'type': 'json'},
                         verify=False, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code == 200:
            return _safe_list(r.json().get('response', {}).get('body', {}).get('items', []))
    except:
        pass
    return []


def get_stats():
    try:
        t_v = db.child("stats").child("total_visits").get().val() or 1828
        u_v = db.child("users").get().val()
        return t_v, len(u_v) if u_v else 0
    except:
        return 1828, 0


def update_stats():
    try:
        if 'visited' not in st.session_state:
            t_v = (db.child("stats").child("total_visits").get().val() or 1828) + 1
            db.child("stats").update({"total_visits": t_v})
            st.session_state['visited'] = True
    except:
        pass


# ==========================================
# 4. 데이터 수집 (업데이트 주기 60초)
# ==========================================
@st.cache_data(ttl=60, show_spinner=False)
def get_hybrid_1st_bids():
    now = datetime.now(KST)
    s_dt = (now - timedelta(days=5)).strftime('%Y%m%d')
    e_dt = now.strftime('%Y%m%d')

    api_items = []
    for url in [API_TABLE['cnstwk']['result'], API_TABLE['etcwk']['result']]:
        api_items.extend(_api_get(url, {'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                                        'inqryBgnDt': s_dt + '0000', 'inqryEndDt': e_dt + '2359'}, timeout=20))

    db_data = db.child("archive_1st").order_by_key().limit_to_last(4000).get().val() or {}
    db_items = list(db_data.values()) if isinstance(db_data, dict) else []
    new_rows = {}
    for item in api_items:
        try:
            bid_no = item.get('bidNtceNo', '')
            info = str(item.get('opengCorpInfo', '')).split('|')[0].split('^')
            if len(info) > 1 and info[0].strip():
                new_rows[bid_no] = {
                    '1순위업체': info[0].strip(), '공고번호': bid_no, '공고차수': item.get('bidNtceOrd', '00'),
                    '날짜': item.get('opengDt', ''), '공고명': item.get('bidNtceNm', ''),
                    '발주기관': item.get('ntceInsttNm', ''),
                    '투찰금액': f"{int(float(info[3])):,}원" if len(info) > 3 else '-',
                    '투찰률': f"{info[4]}%" if len(info) > 4 else '-',
                    '전체업체': item.get('opengCorpInfo', '')
                }
        except:
            continue
    if new_rows: db.child("archive_1st").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['날짜'], errors='coerce')
        df = df.sort_values(by='dt', ascending=False)
        df['날짜'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df


@st.cache_data(ttl=180, show_spinner=False)
def get_hybrid_live_bids():
    now = datetime.now(KST)
    s_dt = now.strftime('%Y%m%d')
    api_items = []
    for url in [API_TABLE['cnstwk']['notice'], API_TABLE['etcwk']['notice']]:
        api_items.extend(_api_get(url, {'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                                        'inqryBgnDt': s_dt + '0000', 'inqryEndDt': s_dt + '2359',
                                        'bidNtceNm': '공사'}, timeout=15))
    db_data = db.child("archive_live").order_by_key().limit_to_last(4000).get().val() or {}
    db_items = list(db_data.values()) if isinstance(db_data, dict) else []
    new_rows = {}
    for item in api_items:
        bid_no = item.get('bidNtceNo', '')
        if bid_no:
            new_rows[bid_no] = {
                '공고번호': bid_no, '공고일자': item.get('bidNtceDt', ''),
                '공고명': item.get('bidNtceNm', ''), '발주기관': item.get('ntceInsttNm', ''),
                '예산금액': int(float(item.get('bdgtAmt', 0))),
                '상세보기': item.get('bidNtceDtlUrl', "https://www.g2b.go.kr/index.jsp")
            }
    if new_rows: db.child("archive_live").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['공고일자'], errors='coerce')
        df = df.sort_values(by='dt', ascending=False)
        df['공고일자'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df


def _fill_corps(corp_raw, res: dict):
    if not corp_raw or str(corp_raw).strip() in ('', 'nan', 'NaN', 'None'): return
    for idx, c in enumerate(str(corp_raw).split('|')[:10]):
        p = c.split('^')
        if len(p) >= 5:
            try:
                res['corps'].append({'순위': f"{idx + 1}위", '업체명': p[0].strip(),
                                     '투찰금액': f"{int(float(p[3])):,}원", '투찰률': f"{p[4].strip()}%"})
            except:
                pass


# ==========================================
# 5. ★ 하이브리드 리포트 엔진 ★
# ==========================================
def fetch_bid_full_detail(bid_no: str, base_ord: str, row) -> dict:
    res = {
        'bss_amt': '', 'est_price': '', 'pre_amt': '', 'suc_amt': '',
        'corps': [], 'has_detail': False, 'bid_type': '', 'sources': {}
    }

    bid_type = get_bid_type(bid_no)
    urls = API_TABLE.get(bid_type, API_TABLE['cnstwk'])

    bss_v, est_v, pre_v = 0, 0, 0
    suc_v = raw_to_int(row.get('투찰금액', ''))
    if suc_v: res['sources']['suc'] = 'API'

    items = _api_get(urls['notice'], {'numOfRows': '5', 'pageNo': '1', 'inqryDiv': '2', 'bidNtceNo': bid_no})
    if items:
        d = items[0]
        if not bss_v: bss_v = raw_to_int(d.get('bssAmt', ''))
        if not est_v: est_v = raw_to_int(d.get('presmptPrce', ''))
        if not pre_v: pre_v = raw_to_int(d.get('exptPrce', ''))
        if bss_v: res['sources']['bss'] = 'API'
        if est_v: res['sources']['est'] = 'API'
        if pre_v: res['sources']['pre'] = 'API'

    for t_ord in [str(base_ord).zfill(2), '00', '01']:
        if bss_v and pre_v: break
        items = _api_get(urls['detail'], {'numOfRows': '1', 'pageNo': '1', 'bidNtceNo': bid_no, 'bidNtceOrd': t_ord})
        if items:
            d = items[0]
            if not bss_v:
                bss_v = raw_to_int(d.get('bssAmt', ''))
                if bss_v: res['sources']['bss'] = 'API'
            if not pre_v:
                pre_v = raw_to_int(d.get('exptPrce', ''))
                if pre_v: res['sources']['pre'] = 'API'
            v = raw_to_int(d.get('sucsfbidAmt', ''))
            if v: suc_v = v
            res['has_detail'] = True
            break

    _fill_corps(row.get('전체업체', ''), res)
    if not res['corps']:
        items = _api_get(urls['result'], {'numOfRows': '1', 'pageNo': '1', 'inqryDiv': '1', 'bidNtceNo': bid_no})
        if items: _fill_corps(items[0].get('opengCorpInfo', ''), res)

    bid_rate = 0.0
    try:
        rs = str(row.get('투찰률', '')).replace('%', '').strip()
        if rs: bid_rate = float(rs)
    except:
        pass

    if suc_v > 0 and bid_rate > 0:
        if not pre_v:
            pre_v = int(round(suc_v / (bid_rate / 100.0)))
            res['sources']['pre'] = 'CALC'
        if not bss_v and pre_v:
            if est_v > 0:
                bss_v = int(round(est_v * 1.1))
            else:
                bss_v = pre_v
            res['sources']['bss'] = 'CALC'
        if not est_v and bss_v > 0:
            est_v = int(round(bss_v / 1.10))
            res['sources']['est'] = 'CALC'

    res['bss_amt'] = fmt_amt(bss_v) or ""
    res['est_price'] = fmt_amt(est_v) or ""
    res['pre_amt'] = fmt_amt(pre_v) or ""
    res['suc_amt'] = fmt_amt(suc_v) or ""

    return res


# ==========================================
# 6. 대시보드 UI
# ==========================================
update_stats()
t_visit, t_user = get_stats()

st.markdown('<div class="main-title">🏛️ K-건설맵</div>', unsafe_allow_html=True)
c1, c2, c3, c4 = st.columns(4)
with c1: st.markdown(
    f'<div class="stat-card"><div class="stat-label">📅 오늘 날짜</div><div class="stat-val">{datetime.now(KST).strftime("%Y-%m-%d")}</div></div>',
    unsafe_allow_html=True)
with c2: st.markdown(
    f'<div class="stat-card"><div class="stat-label">📈 누적 방문</div><div class="stat-val">{t_visit:,}명</div></div>',
    unsafe_allow_html=True)
with c3: st.markdown(
    f'<div class="stat-card"><div class="stat-label">👥 전체 회원수</div><div class="stat-val">{t_user:,}명</div></div>',
    unsafe_allow_html=True)
with c4: st.markdown(
    f'<div class="stat-card"><div class="stat-label">🔔 가동 상태</div><div class="stat-val" style="color:green;">정상 가동 중</div></div>',
    unsafe_allow_html=True)

with st.sidebar:
    st.write(f"### 👷 {'👋 ' + st.session_state['user_name'] + ' 소장님' if st.session_state['logged_in'] else 'K-건설맵 메뉴'}")
    if st.session_state['logged_in']:
        menu_list = ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗", "⚙️ 내 정보 설정"]
    else:
        menu_list = ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗", "👤 로그인 / 회원가입"]
    menu = st.radio("업무 선택", menu_list)
    st.write("---")
    if st.button("🔄 만능 데이터 새로고침"): st.cache_data.clear(); st.rerun()
    if st.session_state['logged_in'] and st.button("🚪 로그아웃"): st.session_state.clear(); st.rerun()

# ==========================================
# 7. 메뉴 라우팅
# ==========================================
if menu == "🏆 1순위 현황판":
    st.markdown("#### 🏆 실시간 1순위 현황판")

    selected_region_1st = st.selectbox("🌍 지역 필터링", REGION_LIST)
    df_w = get_hybrid_1st_bids()

    if not df_w.empty:
        st.markdown(
            "<div style='background-color:#eff6ff; padding:10px 15px; border-radius:6px; color:#1e40af; font-size:13px; margin-bottom:15px;'>💡 <b>이용 안내:</b> 표 맨 왼쪽의 <b>빈 사각형(체크박스)을 클릭</b>하시면 해당 공고의 상세 분석 리포트를 확인할 수 있습니다.</div>",
            unsafe_allow_html=True)

        df_f = filter_by_region(df_w, selected_region_1st)

        event = st.dataframe(df_f[['1순위업체', '날짜', '공고명', '발주기관', '투찰금액', '투찰률']],
                             use_container_width=True, hide_index=True, height=400,
                             selection_mode="single-row", on_select="rerun")

        if len(event.selection.rows) > 0:
            row = df_f.iloc[event.selection.rows[0]]
            bid_no_str = str(row['공고번호']).strip()

            with st.spinner("📡 분석 엔진 가동 중..."):
                det = fetch_bid_full_detail(bid_no_str, row.get('공고차수', '00'), row)

            st.markdown(
                f"<div style='font-size:16px;font-weight:800;color:#1e3a8a;margin-bottom:10px;"
                f"padding:12px;background-color:#f1f5f9;border-radius:6px;border-left:4px solid #2563eb;'>"
                f"📑 [K-건설맵 리포트] {row['공고명']}</div>",
                unsafe_allow_html=True
            )


            def _src_badge(src: str) -> str:
                return {
                    'API': '<div class="calc-badge" style="color:#059669;">✓ 나라장터 공식</div>',
                    'WEB': '<div class="calc-badge" style="color:#2563eb;">🌐 나라장터 웹</div>',
                    'CALC': '<div class="calc-badge" style="color:#ea580c;">🧮 참고용 추정치</div>',
                }.get(src, '')


            m1, m2, m3, m4 = st.columns(4)


            def _card(col, icon, label, val, key, val_color="#1e3a8a"):
                color = val_color if val else "#9ca3af"
                disp_val = val if val else "-"
                badge = _src_badge(det['sources'].get(key, '')) if val else ''
                col.markdown(
                    f'<div class="stat-card"><div class="stat-label">{icon} {label}</div>'
                    f'<div class="stat-val" style="color:{color};">{disp_val}</div>{badge}</div>',
                    unsafe_allow_html=True
                )


            _card(m1, "💰", "기초금액", det['bss_amt'], 'bss')
            _card(m2, "📐", "추정가격", det['est_price'], 'est')
            _card(m3, "🎯", "예정가격", det['pre_amt'], 'pre')
            _card(m4, "🏆", "낙찰금액", det['suc_amt'], 'suc', val_color="#dc2626")

            if 'CALC' in det['sources'].values():
                st.markdown(
                    "<div style='font-size:11px; color:#94a3b8; margin-top:2px; margin-bottom:10px; text-align:right;'>* 🧮 표시는 수집 지연 시 수학 공식을 통해 계산한 참고용 추정치입니다. (기초금액≈추정가격×1.1 또는 예정가격, 예정가격=투찰금액÷투찰률)</div>",
                    unsafe_allow_html=True)

            if det['corps']:
                st.dataframe(pd.DataFrame(det['corps']), use_container_width=True, hide_index=True)
            else:
                st.warning("💡 조달청에서 아직 개찰 상세 성적표를 업로드하지 않았습니다.")

            sc1, sc2 = st.columns(2)
            with sc1:
                st.markdown("💡 **나라장터 정책상 번호 복사가 필요합니다.**")
                st.code(row['공고번호'], language=None)
            with sc2:
                st.write("")
                st.link_button("🚀 나라장터 홈페이지 열기", "https://www.g2b.go.kr/index.jsp", use_container_width=True)
                st.link_button("🏢 업체 네이버 검색", f"https://search.naver.com/search.naver?query={row['1순위업체']} 건설",
                               use_container_width=True)
    else:
        st.warning("데이터를 불러오는 중입니다.")

elif menu == "📊 실시간 공고 (홈)":
    st.markdown("#### 📊 실시간 입찰 공고")
    df_live = get_hybrid_live_bids()
    if not df_live.empty:
        st.markdown(
            "<div style='background-color:#eff6ff; padding:10px 15px; border-radius:6px; color:#1e40af; font-size:13px; margin-bottom:15px;'>💡 <b>이용 안내:</b> 표 맨 왼쪽의 <b>빈 사각형(체크박스)을 클릭</b>하시면 해당 공고의 맞춤형 입찰 시뮬레이터를 확인할 수 있습니다.</div>",
            unsafe_allow_html=True)

        df_f = filter_by_region(df_live, st.selectbox("🌍 지역 필터링", REGION_LIST))

        col_cfg = {"상세보기": st.column_config.LinkColumn("상세보기", display_text="공고보기"),
                   "예산금액": st.column_config.NumberColumn("예산(원)", format="%,d")}

        if st.session_state['logged_in']:
            t1, t2 = st.tabs(["🌐 전체 공고", "✨ 내 면허 맞춤매칭"])
            with t1:
                event_all = st.dataframe(df_f[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']],
                                         use_container_width=True, hide_index=True, height=600, column_config=col_cfg,
                                         selection_mode="single-row", on_select="rerun", key="live_all")
                selected_event = event_all
                selected_df = df_f
            with t2:
                user_lic = st.session_state.get('user_license', '')
                if user_lic and user_lic != "선택안함":
                    kw = get_match_keywords(user_lic)
                    matched = df_f[df_f['공고명'].str.contains('|'.join(kw), na=False)] if kw else df_f
                    event_match = st.dataframe(matched[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']],
                                               use_container_width=True, hide_index=True, height=600,
                                               column_config=col_cfg, selection_mode="single-row", on_select="rerun",
                                               key="live_match")
                    if len(event_match.selection.rows) > 0:
                        selected_event = event_match
                        selected_df = matched
                else:
                    st.info("⚙️ [내 정보 설정] 메뉴에서 보유 면허를 등록하시면, 소장님 면허에 딱 맞는 공고만 걸러서 보여드립니다!")
                    selected_event = event_all
                    selected_df = df_f
        else:
            selected_df = df_f
            selected_event = st.dataframe(df_f[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']],
                                          use_container_width=True, hide_index=True, height=600, column_config=col_cfg,
                                          selection_mode="single-row", on_select="rerun", key="live_guest")

        if len(selected_event.selection.rows) > 0:
            row_live = selected_df.iloc[selected_event.selection.rows[0]]
            bid_no_live = str(row_live['공고번호']).split('-')[0].strip()
            budget = int(row_live['예산금액'])
            agency = row_live['발주기관']

            sim_base_val = budget
            base_label = "예산금액"

            try:
                r = requests.get(f'{BASE}/ad/BidPublicInfoService/getBssamtPblancListInfoCnstwk',
                                 params={'serviceKey': SAFE_API_KEY, 'numOfRows': '1', 'pageNo': '1', 'inqryDiv': '2',
                                         'bidNtceNo': bid_no_live, 'type': 'json'}, verify=False, timeout=3)
                if r.status_code == 200:
                    items = r.json().get('response', {}).get('body', {}).get('items', [])
                    if isinstance(items, dict):
                        items = [items.get('item', {})]
                    elif isinstance(items, list) and len(items) > 0 and isinstance(items[0], dict) and 'item' in items[
                        0]:
                        items = [items[0]['item']]

                    if items and isinstance(items, list) and len(items) > 0:
                        d = items[0]
                        b_val = raw_to_int(d.get('bssAmt', 0))
                        e_val = raw_to_int(d.get('presmptPrce', 0))

                        if b_val > 0:
                            sim_base_val = b_val
                            base_label = "기초금액 (조달청 발표)"
                        elif e_val > 0:
                            sim_base_val = int(e_val * 1.1)
                            base_label = "기초금액 (추정가격×1.1 역산)"
            except:
                pass

            if any(x in agency for x in ['교육청', '교육지원청', '도청', '시청', '군청', '구청', '특별자치']):
                sajeong_range = "97.00% ~ 103.00% (지자체 ±3%)"
            elif any(x in agency for x in ['국토교통부', '조달청', '국가철도공단', '한국토지주택공사', '도로공사']):
                sajeong_range = "98.00% ~ 102.00% (국가기관 ±2%)"
            else:
                sajeong_range = "발주처 공고문 참조"

            st.markdown(
                f"<div style='margin-top:20px; padding:12px; background-color:#eff6ff; border-radius:8px; border-left:4px solid #2563eb;'><b style='color:#1e3a8a; font-size:15px;'>🎯 [입찰 시뮬레이터]</b> <span style='font-size:14px; color:#334155; font-weight:600;'>{row_live['공고명']}</span></div>",
                unsafe_allow_html=True)
            st.markdown(
                f"<div style='font-size:13px; margin-top:8px; margin-bottom:12px;'>💡 발주처(<b>{agency}</b>) 통상 사정률 범위: <b><span style='color:#ea580c;'>{sajeong_range}</span></b></div>",
                unsafe_allow_html=True)

            c1, c2 = st.columns(2)
            with c1:
                sim_base = st.number_input(base_label, value=sim_base_val, step=1000000)
            with c2:
                sim_rate = st.selectbox("투찰 하한율 (%)", ["87.745", "86.745", "87.995", "89.995"], key="live_rate")

            if sim_base > 0:
                st.write("💡 **나노 AI 추천 투찰금액 (사정률 5구간)**")
                tr_cols = st.columns(5)
                rates = [99.0, 99.5, 100.0, 100.5, 101.0]
                labels = ["❄️ 99.0%", "🌬️ 99.5%", "🌤️ 100.0%", "☀️ 100.5%", "🔥 101.0%"]
                for i, r in enumerate(rates):
                    with tr_cols[i]:
                        expected_price = int(sim_base * (r / 100.0) * (float(sim_rate) / 100.0))
                        st.info(f"**{labels[i]}**\n\n**{expected_price:,}원**")

                st.markdown(
                    "<div style='font-size:11px; color:#94a3b8; text-align:left;'>⚠️ A값(국민연금 등 고정 공제비용)이 제외된 순수 산술식입니다. 실제 투찰 시 공고문의 A값을 반드시 공제하세요.</div>",
                    unsafe_allow_html=True)

elif menu == "📁 K-건설 자료실":
    st.subheader("📁 K-건설 자료실")
    if st.session_state['logged_in']:
        with st.expander("✏️ 새 자료 등록"):
            t, c = st.text_input("제목"), st.text_area("내용")
            if st.button("등록") and t and c:
                db.child("posts").push({"author": st.session_state['user_name'], "title": t, "content": c,
                                        "time": datetime.now(KST).strftime("%Y-%m-%d %H:%M")})
                st.toast("등록 완료!", icon="✅")
                time.sleep(1);
                st.rerun()
    posts = db.child("posts").get().val()
    if posts:
        for k, p in reversed(list(posts.items())):
            with st.expander(f"📢 {p['title']} (작성자: {p['author']})"):
                st.write(p['content'])
                if st.session_state['user_name'] in [p['author'], "명환"]:
                    if st.button("🗑️ 삭제", key=k): db.child("posts").child(k).remove(); st.rerun()

elif menu == "💬 K건설챗":
    st.subheader("💬 실시간 현장 소통")
    if st.session_state['logged_in']:
        chat_box = st.container(height=450)
        try:
            chats_data = db.child("k_chat").get().val()
            if chats_data:
                for v in list(chats_data.values())[-30:]: chat_box.write(f"**{v['author']}**: {v['message']}")
        except:
            chat_box.info("대화 로딩 중...")
        if msg := st.chat_input("메시지를 입력하세요"):
            db.child("k_chat").push({"author": st.session_state['user_name'], "message": msg,
                                     "time": datetime.now(KST).strftime("%H:%M")})
            st.rerun()
    else:
        st.info("로그인 후 이용 가능합니다.")

elif menu == "⚙️ 내 정보 설정":
    st.subheader("⚙️ 내 정보 설정")
    t1, t2 = st.tabs(["📝 내 정보 수정", "⚠️ 회원 탈퇴"])

    with t1:
        new_name = st.text_input("성함/직함 수정", value=st.session_state['user_name'])
        new_phone = st.text_input("전화번호 수정", value=st.session_state.get('user_phone', ''))
        curr_lic_str = st.session_state.get('user_license', '')
        curr_lic_list = [l.strip() for l in curr_lic_str.split(',')] if curr_lic_str and curr_lic_str != "선택안함" else []
        curr_lic_list = [l for l in curr_lic_list if l in ALL_LICENSES]

        new_lic = st.multiselect("보유 면허 수정 (매칭용)", ALL_LICENSES, default=curr_lic_list)

        if st.button("내 정보 업데이트"):
            try:
                l_s = ", ".join(new_lic) if new_lic else "선택안함"
                db.child("users").child(st.session_state['localId']).update(
                    {"name": new_name, "phone": new_phone, "license": l_s})
                st.session_state.update({'user_name': new_name, 'user_phone': new_phone, 'user_license': l_s})
                st.toast("🎉 정보가 성공적으로 수정되었습니다!", icon="✅")
            except:
                st.error("정보 수정 중 오류가 발생했습니다.")

    with t2:
        st.warning("회원 탈퇴 시 K-건설맵에 등록된 내 정보가 삭제되며, 복구할 수 없습니다.")
        if st.button("회원 탈퇴 (계정 영구 삭제)", type="primary"):
            try:
                db.child("users").child(st.session_state['localId']).remove()
                auth.delete_user_account(st.session_state['idToken'])
                st.session_state.clear()
                st.success("회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.")
                time.sleep(1.5)
                st.rerun()
            except Exception as e:
                st.error("탈퇴 처리 중 오류가 발생했습니다. 보안을 위해 로그아웃 후 다시 로그인하여 시도해 주세요.")

elif menu == "👤 로그인 / 회원가입":
    st.subheader("👤 회원 정보 관리")
    t1, t2 = st.tabs(["🔑 로그인", "📝 회원가입"])
    with t1:
        le = st.text_input("이메일", key="l_e")
        lp = st.text_input("비밀번호", type="password", key="l_p")

        login_success = False
        if st.button("로그인"):
            try:
                user = auth.sign_in_with_email_and_password(le.strip().lower(), lp)
                info = db.child("users").child(user['localId']).get().val() or {}
                st.session_state.update({'logged_in': True, 'user_name': info.get('name', '소장님'),
                                         'user_license': info.get('license', ''), 'user_phone': info.get('phone', ''),
                                         'localId': user['localId'], 'idToken': user['idToken']})
                login_success = True
            except:
                pass  # 에러 문구 침묵 모드

        if login_success:
            st.rerun()

    with t2:
        re = st.text_input("가입용 이메일", key="r_e")
        rp = st.text_input("비번 (6자 이상)", type="password", key="r_p")
        rn = st.text_input("성함", key="r_n")
        r_phone = st.text_input("전화번호", key="r_phone")
        rl = st.multiselect("보유 면허", ALL_LICENSES, key="r_l")

        if st.button("가입하기"):
            try:
                u = auth.create_user_with_email_and_password(re.strip().lower(), rp)
                db.child("users").child(u['localId']).set(
                    {"name": rn, "phone": r_phone, "license": ", ".join(rl), "email": re.strip().lower()})
                st.success("🎉 가입 성공! 로그인 탭에서 접속해주세요.")
            except:
                st.toast("가입 실패! 형식을 확인하거나 이미 있는 이메일인지 확인하세요.", icon="❌")