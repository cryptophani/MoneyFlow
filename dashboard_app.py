from __future__ import annotations

from datetime import datetime, timezone

import pandas as pd
import streamlit as st

import config
from dashboard_data import collect_dashboard_snapshot


st.set_page_config(
    page_title="MoneyFlow Desk",
    page_icon="MF",
    layout="wide",
    initial_sidebar_state="expanded",
)


@st.cache_data(ttl=90, show_spinner=False)
def load_snapshot() -> dict:
    return collect_dashboard_snapshot()


def refresh_snapshot() -> None:
    load_snapshot.clear()


def _inject_styles() -> None:
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:wght@600;700&display=swap');

        :root {
          --bg: #f6f1e8;
          --card: rgba(255, 252, 247, 0.84);
          --text: #1f2a2a;
          --muted: #60716e;
          --line: rgba(32, 63, 59, 0.10);
          --green: #18895a;
          --blue: #2e6bdb;
        }

        .stApp {
          background:
            radial-gradient(circle at top left, rgba(73, 174, 120, 0.12), transparent 28%),
            radial-gradient(circle at top right, rgba(51, 111, 214, 0.10), transparent 22%),
            linear-gradient(180deg, #f8f3eb 0%, var(--bg) 100%);
          color: var(--text);
          font-family: "DM Sans", sans-serif;
        }

        section[data-testid="stSidebar"] {
          background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(248,243,235,0.92));
          border-right: 1px solid var(--line);
        }

        h1, h2, h3 {
          font-family: "Fraunces", serif;
          color: #152022;
          letter-spacing: -0.02em;
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.5rem 0 1rem 0;
        }

        .brand-icon {
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 0.8rem;
          display: grid;
          place-items: center;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #1a8d5d, #2e6bdb);
          box-shadow: 0 18px 40px rgba(46, 107, 219, 0.16);
        }

        .brand-title {
          font-family: "Fraunces", serif;
          font-size: 1.7rem;
          margin: 0;
        }

        .brand-subtitle {
          margin: 0;
          color: var(--muted);
          font-size: 0.95rem;
        }

        .hero-card,
        .metric-card,
        .section-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(24, 44, 46, 0.07);
        }

        .hero-card {
          padding: 2rem 2.1rem;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.82), rgba(235, 249, 242, 0.75)),
            linear-gradient(130deg, rgba(46,107,219,0.07), rgba(24,137,90,0.07));
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--green);
          font-weight: 700;
          font-size: 0.84rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .live-dot {
          width: 0.55rem;
          height: 0.55rem;
          border-radius: 999px;
          background: var(--green);
          display: inline-block;
        }

        .hero-copy {
          font-family: "Fraunces", serif;
          font-size: clamp(2.3rem, 4vw, 3.8rem);
          line-height: 1.02;
          margin: 1rem 0 0.6rem 0;
          max-width: 12ch;
        }

        .hero-text {
          color: var(--muted);
          font-size: 1.06rem;
          margin-bottom: 1.2rem;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(24, 137, 90, 0.12);
          font-weight: 600;
          color: #205042;
        }

        .hero-stat {
          text-align: right;
        }

        .hero-stat-label {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .hero-stat-value {
          font-family: "Fraunces", serif;
          font-size: clamp(1.9rem, 3vw, 3rem);
          margin: 0.3rem 0;
          color: var(--green);
        }

        .metric-card {
          padding: 1.2rem 1.25rem;
          min-height: 10.5rem;
        }

        .metric-label {
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .metric-value {
          font-family: "Fraunces", serif;
          font-size: 2rem;
          margin: 0.55rem 0 0.25rem 0;
        }

        .metric-note {
          color: var(--muted);
          font-size: 0.88rem;
        }

        .section-card {
          padding: 1.2rem 1.3rem 1rem 1.3rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.8rem;
        }

        .section-title {
          font-family: "Fraunces", serif;
          font-size: 1.5rem;
          margin: 0;
        }

        .section-meta {
          color: var(--muted);
          font-size: 0.88rem;
        }

        .activity-item {
          padding: 0.8rem 0;
          border-top: 1px solid var(--line);
        }

        .activity-item:first-child {
          border-top: 0;
          padding-top: 0.2rem;
        }

        .activity-time {
          color: var(--green);
          font-weight: 700;
          font-size: 0.82rem;
        }

        .activity-title {
          font-weight: 700;
          margin: 0.2rem 0 0.1rem 0;
        }

        .activity-detail {
          color: var(--muted);
          font-size: 0.92rem;
          margin: 0;
        }

        .scanner-row {
          padding: 0.7rem 0;
          border-top: 1px solid var(--line);
        }

        .scanner-row:first-child {
          border-top: 0;
          padding-top: 0.1rem;
        }

        .scanner-market {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .scanner-line {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .scanner-meta {
          color: var(--muted);
          font-size: 0.85rem;
        }

        div[data-testid="stDataFrame"] {
          border: 1px solid var(--line);
          border-radius: 20px;
          overflow: hidden;
        }

        .risk-banner {
          padding: 1rem 1.2rem;
          border-radius: 22px;
          border: 1px solid rgba(24, 137, 90, 0.18);
          background: rgba(255,255,255,0.72);
          color: #33534b;
        }

        @media (max-width: 768px) {
          section[data-testid="stSidebar"] {
            display: none;
          }

          .block-container {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .hero-copy {
            font-size: 3rem;
            max-width: none;
          }

          .hero-stat {
            text-align: left;
          }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _render_sidebar(snapshot: dict) -> None:
    with st.sidebar:
        st.markdown(
            """
            <div class="brand-mark">
              <div class="brand-icon">MF</div>
              <div>
                <p class="brand-title">MoneyFlow</p>
                <p class="brand-subtitle">Polymarket paper-trading desk</p>
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.radio(
            "Workspace",
            ["Dashboard", "Signals", "Markets", "Strategy"],
            index=0,
            label_visibility="collapsed",
        )
        st.markdown("---")
        st.metric("Paper balance", f"${snapshot['wallet_balance']:,.2f}")
        st.metric("Signal threshold", f"{config.EDGE_THRESHOLD:.2%}")
        st.metric("Loop interval", f"{config.LOOP_INTERVAL}s")
        st.caption("Paper trading is enabled. No live orders are sent from this dashboard.")


def _render_hero(snapshot: dict) -> None:
    updated_utc = snapshot["updated_at"].astimezone(timezone.utc).strftime("%b %d, %Y %H:%M UTC")
    col_left, col_right = st.columns([2.1, 1.2], gap="large")

    with col_left:
        st.markdown(
            f"""
            <div class="hero-card">
              <div class="eyebrow"><span class="live-dot"></span> Bot status: paper mode</div>
              <div class="hero-copy">Scanning. Ranking. Simulating.</div>
              <p class="hero-text">Live Polymarket markets are filtered, scored, and surfaced here as paper-trading opportunities.</p>
              <div class="pill">Updated {updated_utc}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col_right:
        st.markdown(
            f"""
            <div class="hero-card hero-stat">
              <div class="hero-stat-label">Highest edge right now</div>
              <div class="hero-stat-value">{snapshot['avg_edge']:.2%}</div>
              <div class="hero-stat-label">Average across {snapshot['signal_count']} qualified signals</div>
              <div style="height: 1rem"></div>
              <div class="hero-stat-label">Suggested max position</div>
              <div class="hero-stat-value">${snapshot['largest_position']:.2f}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


def _render_metrics(snapshot: dict) -> None:
    metrics = [
        ("Tradeable markets", str(snapshot["market_count"]), "Markets passing top-level liquidity filters."),
        ("Signals now", str(snapshot["signal_count"]), "Qualified opportunities after pricing and expiry filters."),
        ("Average edge", f"{snapshot['avg_edge']:.2%}", "Mean edge across current signals."),
        ("Confidence", f"{snapshot['avg_confidence']:.0f}/99", "Derived from signal strength for triage."),
    ]

    cols = st.columns(4, gap="medium")
    for col, (label, value, note) in zip(cols, metrics):
        with col:
            st.markdown(
                f"""
                <div class="metric-card">
                  <div class="metric-label">{label}</div>
                  <div class="metric-value">{value}</div>
                  <div class="metric-note">{note}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )


def _render_signals_table(snapshot: dict) -> None:
    st.markdown(
        """
        <div class="section-card">
          <div class="section-header">
            <p class="section-title">Top Active Signals</p>
            <p class="section-meta">Fresh scan results from the current strategy.</p>
          </div>
        """,
        unsafe_allow_html=True,
    )

    signals = snapshot["signals"][:12]
    if signals:
        frame = pd.DataFrame(
            [
                {
                    "Market": signal["market"],
                    "Direction": signal["side"],
                    "Edge": f"{signal['edge']:.2%}",
                    "Confidence": signal["confidence"],
                    "Entry": f"{signal['entry_price']:.3f}",
                    "Size (USDC)": f"${signal['size_usdc']:.2f}",
                    "Expiry": signal["expiry"],
                    "Status": signal["status"],
                }
                for signal in signals
            ]
        )
        st.dataframe(frame, use_container_width=True, hide_index=True)
    else:
        st.info("No signals qualified in this scan. Lower the thresholds or wait for a new market state.")

    st.markdown("</div>", unsafe_allow_html=True)


def _render_lower_panels(snapshot: dict) -> None:
    col_markets, col_activity, col_controls = st.columns([1.25, 1.05, 1], gap="medium")

    with col_markets:
        st.markdown(
            """
            <div class="section-card">
              <div class="section-header">
                <p class="section-title">Market Scanner</p>
                <p class="section-meta">Highest-volume markets from the latest pull.</p>
              </div>
            """,
            unsafe_allow_html=True,
        )
        for market in snapshot["market_scanner"]:
            st.markdown(
                f"""
                <div class="scanner-row">
                  <div class="scanner-market">{market['question']}</div>
                  <div class="scanner-line">
                    <div class="scanner-meta">Volume ${market['volume']:,.0f}</div>
                    <div class="scanner-meta">YES {market['yes_price']:.2f}</div>
                  </div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)

    with col_activity:
        st.markdown(
            """
            <div class="section-card">
              <div class="section-header">
                <p class="section-title">Recent Activity</p>
                <p class="section-meta">Generated from the current dashboard scan.</p>
              </div>
            """,
            unsafe_allow_html=True,
        )
        for event in snapshot["activity"]:
            st.markdown(
                f"""
                <div class="activity-item">
                  <div class="activity-time">{event['time']}</div>
                  <p class="activity-title">{event['title']}</p>
                  <p class="activity-detail">{event['detail']}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)

    with col_controls:
        st.markdown(
            """
            <div class="section-card">
              <div class="section-header">
                <p class="section-title">Strategy Controls</p>
                <p class="section-meta">Local tuning only. Values are not persisted.</p>
              </div>
            """,
            unsafe_allow_html=True,
        )
        st.selectbox("Mode", ["Paper trading", "Disabled live mode"], index=0)
        st.slider("Risk per trade", min_value=0.5, max_value=5.0, value=float(config.KELLY_FRACTION * 8), step=0.1)
        st.slider("Max open position", min_value=5, max_value=200, value=int(config.MAX_TRADE_USDC), step=5)
        st.slider("Edge threshold", min_value=1, max_value=20, value=int(config.EDGE_THRESHOLD * 100), step=1)
        st.button("Save local view", use_container_width=True, disabled=True)
        st.caption("The current backend remains paper-only. Live trading is intentionally not exposed in the UI.")
        st.markdown("</div>", unsafe_allow_html=True)


def main() -> None:
    _inject_styles()
    snapshot = load_snapshot()
    _render_sidebar(snapshot)

    header_cols = st.columns([1.5, 1, 0.6], gap="medium")
    with header_cols[0]:
        st.title("Dashboard")
    with header_cols[1]:
        st.caption(datetime.now(timezone.utc).strftime("%b %d, %Y %H:%M UTC"))
    with header_cols[2]:
        if st.button("Run scan now", use_container_width=True):
            refresh_snapshot()
            st.rerun()

    _render_hero(snapshot)
    if snapshot.get("demo_mode"):
        st.warning("Demo mode is active because live market data was unavailable during the last scan.")
    st.write("")
    _render_metrics(snapshot)
    st.write("")
    _render_signals_table(snapshot)
    st.write("")
    _render_lower_panels(snapshot)
    st.write("")
    st.markdown(
        """
        <div class="risk-banner">
          Paper trading only. This interface shows simulated sizing and strategy outputs from the current Python bot.
        </div>
        """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
