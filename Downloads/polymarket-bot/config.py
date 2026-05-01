"""
config.py — all settings loaded from .env
Never hardcode credentials here.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Polymarket ──────────────────────────────────────────────
PRIVATE_KEY     = os.getenv("POLYMARKET_PRIVATE_KEY")
FUNDER          = os.getenv("POLYMARKET_FUNDER")
SIG_TYPE        = int(os.getenv("POLYMARKET_SIG_TYPE", "1"))

CLOB_HOST       = "https://clob.polymarket.com"
GAMMA_URL       = "https://gamma-api.polymarket.com"
DATA_URL        = "https://data-api.polymarket.com"
CHAIN_ID        = 137  # Polygon mainnet

# ── Google Sheets ───────────────────────────────────────────
SHEET_NAME      = os.getenv("SHEET_NAME", "BettingSystem")

# ── Email ───────────────────────────────────────────────────
ALERT_EMAIL     = os.getenv("ALERT_EMAIL")
GMAIL_APP_PASS  = os.getenv("GMAIL_APP_PASSWORD")

# ── Strategy ────────────────────────────────────────────────
MIN_VOLUME      = float(os.getenv("MIN_VOLUME",       "50000"))
MIN_LIQUIDITY   = float(os.getenv("MIN_LIQUIDITY",    "5000"))
KELLY_FRACTION  = float(os.getenv("KELLY_FRACTION",   "0.25"))
MAX_TRADE_USDC  = float(os.getenv("MAX_TRADE_USDC",   "25"))
MIN_RESERVE     = float(os.getenv("MIN_WALLET_RESERVE","20"))
EDGE_THRESHOLD  = float(os.getenv("EDGE_THRESHOLD",   "0.07"))
LOOP_INTERVAL   = int(os.getenv("LOOP_INTERVAL",      "120"))
PAPER_TRADE     = os.getenv("PAPER_TRADE", "true").lower() == "true"

def validate():
    """
    Validate environment variables.
    Skip private key requirement in paper mode.
    """
    missing = []

    if not PAPER_TRADE:
        if not PRIVATE_KEY:
            missing.append("POLYMARKET_PRIVATE_KEY")
        if not FUNDER:
            missing.append("POLYMARKET_FUNDER")

    if missing:
        raise EnvironmentError(
            f"Missing required env vars: {', '.join(missing)}"
        )