import streamlit as st
import pandas as pd
from datetime import datetime, timedelta, timezone
import nano_const
import gspread  # 구글 시트 연결용

# ==========================================
# 🟢 1. 페이지 및 디자인 설정
# ==========================================
st.set_page_config(page_title="k_건설맵", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
    <style>
    .block-container { padding-top: 1.5rem !important; padding-bottom: 1rem !important; }
    .stApp { background-color: #f8fafc; }

    .blue-bar { 
        background-color: #1e3a8a; color: white; 
        border-radius: 8px; margin-bottom: 15px; 
        font-weight: 900; font-size: 28px; letter-spacing: 2px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-align: center;
        padding-top: 35px !important;    
        padding-bottom: 15px !important; 
    }
    .blue-bar p { margin: 0 !important; padding: 0 !important; }
    </style>
""", unsafe_allow_html=True)


# ==========================================
# 🟢 2. 구글 시트 연결 엔진 (마스터 열쇠 사용)
# ==========================================
@st.cache_resource
def init_gsheets():
    try:
        # Streamlit Secrets에 숨겨둔 마스터 열쇠를 가져와서 엑셀 문 열기
        credentials = dict(st.secrets["gcp_service_account"])
        gc = gspread.service_account_from_dict(credentials)

        # 사장님이 만든 'k_map_db' 파일의 첫 번째 시트 열기
        sheet = gc.open("k_map_db").sheet1

        # 만약 시트가 텅텅 비어있으면 1번째 줄에 제목(헤더) 적어주기
        if not sheet.get_all_values():
            sheet.append_row(["ID", "PW", "Name", "Date"])

        return sheet
    except Exception as e:
        return None


# ==========================================
# 🟢 3. 사이드바 메뉴 설정
# ==========================================
with st.sidebar:
    st.markdown("### 🏛️ k_건설맵 메뉴")

    # 🚨 로그인 상태에 따라 환영 인사 출력
    if 'logged_in' in st.session_state and st.session_state['logged_in']:
        st.success(f"👋 {st.session_state['user_name']}님 환영합니다!")

    menu = st.radio("이동할 페이지를 선택하세요:", ["📊 실시간 공고 (홈)", "📝 자유 게시판", "👤 로그인 / 회원가입"])
    st.write("---")
    st.info("💡 최초 1회 로딩 시 조달청 데이터를 가져오느라 약간 느릴 수 있습니다. 이후에는 0.1초 만에 짱 빠르게 열립니다!")

# 🚀 조달청 캐시(기억 장치) 사용
if 'master_data' not in st.session_state:
    with st.spinner("조달청에서 안전하게 2개월치 최신 공고를 싹 쓸어오는 중입니다... (조금만 기다려주세요!)"):
        st.session_state['master_data'] = nano_const.fetch_monster_announcements()

# ==========================================
# 🟢 메뉴 1: 메인 화면 (실시간 공고)
# ==========================================
if menu == "📊 실시간 공고 (홈)":
    st.markdown('<div class="blue-bar"><p>🏛️ k_건설맵 실시간 현황판</p></div>', unsafe_allow_html=True)

    df = st.session_state['master_data'].copy()

    if not df.empty:
        df['정렬용시간'] = pd.to_datetime(df['bidNtceDt'], errors='coerce')
        df = df.sort_values(by='정렬용시간', ascending=False, na_position='last').reset_index(drop=True)

        df['공고일자'] = df['정렬용시간'].dt.strftime('%Y-%m-%d').fillna('날짜미상')
        df['예산금액'] = pd.to_numeric(df['bdgtAmt'], errors='coerce').fillna(0)


        def get_safe_link(row):
            if 'bidNtceDtlUrl' in row and pd.notna(row['bidNtceDtlUrl']) and str(row['bidNtceDtlUrl']).strip() != "":
                return str(row['bidNtceDtlUrl']).replace(":8081", "").replace(":8101", "")
            else:
                return f"https://www.g2b.go.kr/ep/invitation/publish/bidInfoDtl.do?bidno={row['bidNtceNo']}&bidseq={row['bidNtceOrd']}"


        df['🔗 상세내용'] = df.apply(get_safe_link, axis=1)

        KST = timezone(timedelta(hours=9))
        today_str = datetime.now(KST).strftime('%Y-%m-%d')
        today_count = len(df[df['공고일자'] == today_str])

        col1, col2, col3, col4 = st.columns([2, 2, 2, 2])
        with col1:
            st.metric(label="누적 공고(최근 60일)", value=f"{len(df):,}건")
        with col2:
            st.metric(label="오늘(TODAY) 신규", value=f"{today_count}건")
        with col3:
            st.metric(label="데이터 기준일", value=today_str)
        with col4:
            if st.button("🔄 최신 데이터 갱신", use_container_width=True):
                st.cache_data.clear()
                if 'master_data' in st.session_state:
                    del st.session_state['master_data']
                st.rerun()

        st.write("---")

        view_df = df[['bidNtceNo', '공고일자', 'bidNtceNm', 'ntceInsttNm', '예산금액', '🔗 상세내용']]
        view_df.columns = ['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세내용']

        st.dataframe(
            view_df,
            use_container_width=True,
            hide_index=True,
            height=750,
            column_config={
                "상세내용": st.column_config.LinkColumn("상세보기", display_text="공고문 열기"),
                "예산금액": st.column_config.NumberColumn("예산금액(원)", format="%,d")
            }
        )
    else:
        st.warning("🚨 조달청 서버 응답이 지연되고 있습니다. '최신 데이터 갱신' 버튼을 눌러주세요.")

# ==========================================
# 🟢 메뉴 2: 자유 게시판
# ==========================================
elif menu == "📝 자유 게시판":
    st.markdown('<div class="blue-bar"><p>📝 회원 자유 게시판</p></div>', unsafe_allow_html=True)
    st.info("이곳에 회원들이 영업 정보를 교환하거나 질문을 올릴 수 있는 게시판이 만들어질 예정입니다.")

# ==========================================
# 🟢 메뉴 3: 로그인 / 회원가입 (진짜 완성판!)
# ==========================================
elif menu == "👤 로그인 / 회원가입":
    st.markdown('<div class="blue-bar"><p>👤 K_건설맵 로그인</p></div>', unsafe_allow_html=True)

    # 엑셀 DB 연결 확인
    sheet = init_gsheets()

    if sheet is None:
        st.error("🚨 구글 시트(k_map_db) 연결에 실패했습니다. 비밀 열쇠 설정을 다시 확인해주세요!")
    else:
        # 세션 초기화 (처음 들어왔을 때)
        if 'logged_in' not in st.session_state:
            st.session_state['logged_in'] = False
            st.session_state['user_id'] = ""
            st.session_state['user_name'] = ""

        # 이미 로그인한 상태라면?
        if st.session_state['logged_in']:
            with st.container(border=True):
                st.write(f"### 🎉 {st.session_state['user_name']}님, 접속을 환영합니다!")
                st.success("현재 시스템에 정상적으로 로그인되어 있습니다.")

                if st.button("로그아웃", use_container_width=True):
                    st.session_state['logged_in'] = False
                    st.session_state['user_id'] = ""
                    st.session_state['user_name'] = ""
                    st.rerun()

        # 로그인 안 한 상태라면? (로그인/회원가입 탭 보여주기)
        else:
            tab1, tab2 = st.tabs(["🔑 로그인", "📝 회원가입"])

            # ---- [로그인 탭] ----
            with tab1:
                with st.container(border=True):
                    login_id = st.text_input("아이디 (ID)", key="log_id")
                    login_pw = st.text_input("비밀번호 (Password)", type="password", key="log_pw")

                    if st.button("로그인", use_container_width=True):
                        if login_id and login_pw:
                            records = sheet.get_all_records()
                            df_users = pd.DataFrame(records)

                            if not df_users.empty and 'ID' in df_users.columns:
                                df_users['ID'] = df_users['ID'].astype(str)
                                df_users['PW'] = df_users['PW'].astype(str)

                                # 아이디 비밀번호 일치 확인
                                match = df_users[(df_users['ID'] == str(login_id)) & (df_users['PW'] == str(login_pw))]

                                if not match.empty:
                                    st.session_state['logged_in'] = True
                                    st.session_state['user_id'] = str(login_id)
                                    st.session_state['user_name'] = str(match.iloc[0]['Name'])
                                    st.success("로그인 성공! 🎉 화면을 갱신합니다.")
                                    st.rerun()
                                else:
                                    st.error("🚨 아이디 또는 비밀번호가 틀렸습니다.")
                            else:
                                st.error("🚨 아직 등록된 회원이 없습니다. 회원가입을 먼저 진행해주세요!")
                        else:
                            st.warning("아이디와 비밀번호를 모두 입력해주세요.")

            # ---- [회원가입 탭] ----
            with tab2:
                with st.container(border=True):
                    new_id = st.text_input("원하는 아이디", key="reg_id")
                    new_pw = st.text_input("비밀번호", type="password", key="reg_pw")
                    new_pw_check = st.text_input("비밀번호 확인", type="password", key="reg_pw_check")
                    new_name = st.text_input("이름 (또는 닉네임)", key="reg_name")

                    if st.button("회원가입 완료", use_container_width=True):
                        if not new_id or not new_pw or not new_name:
                            st.warning("모든 칸을 빠짐없이 채워주세요!")
                        elif new_pw != new_pw_check:
                            st.error("🚨 비밀번호가 서로 다릅니다. 다시 확인해주세요!")
                        else:
                            records = sheet.get_all_records()
                            df_users = pd.DataFrame(records)

                            # 중복 아이디 검사
                            if not df_users.empty and 'ID' in df_users.columns and str(new_id) in df_users['ID'].astype(
                                    str).values:
                                st.error("🚨 이미 누군가 사용 중인 아이디입니다. 다른 아이디로 시도해주세요.")
                            else:
                                # 중복이 없으면 엑셀 금고에 새 회원 정보 기록!
                                KST = timezone(timedelta(hours=9))
                                now_str = datetime.now(KST).strftime('%Y-%m-%d %H:%M:%S')

                                sheet.append_row([new_id, new_pw, new_name, now_str])
                                st.success(f"🎉 가입을 축하합니다, {new_name}님! 이제 '로그인' 탭으로 가서 접속해주세요.")