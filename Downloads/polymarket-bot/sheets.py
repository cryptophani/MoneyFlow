"""
sheets.py — Google Sheets logging for signals and trades.

Setup:
  1. Create a Google Sheet named exactly as SHEET_NAME in your .env
  2. Add tabs: signals / trades
  3. Enable Google Sheets API in Google Cloud Console
  4. Create Service Account → download JSON → rename to creds.json
  5. Share your Sheet with the service account email (Editor access)
"""

import logging
from datetime import datetime, timezone
from config import SHEET_NAME

logger = logging.getLogger(__name__)
_sheet = None  # cached connection


def connect_sheet():
    """Connects to Google Sheets. Returns sheet object or None on failure."""
    global _sheet
    if _sheet:
        return _sheet

    try:
        import gspread
        from oauth2client.service_account import ServiceAccountCredentials

        scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive",
        ]
        creds  = ServiceAccountCredentials.from_json_keyfile_name("creds.json", scope)
        client = gspread.authorize(creds)
        _sheet = client.open(SHEET_NAME)
        logger.info(f"Connected to Google Sheet: {SHEET_NAME}")
        return _sheet

    except FileNotFoundError:
        logger.warning("creds.json not found — Sheets logging disabled")
        return None
    except Exception as e:
        logger.warning(f"Sheets connection failed: {e} — logging disabled")
        return None


def _now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def log_signal(sheet, signal: dict):
    """Appends a signal row to the 'signals' tab."""
    if not sheet:
        return
    try:
        row = [
            _now_utc(),
            signal.get("slug", ""),
            signal.get("question", "")[:100],
            signal.get("side", ""),
            signal.get("market_price", ""),
            signal.get("model_prob", ""),
            signal.get("edge", ""),
            signal.get("spread", ""),
            str(signal.get("features", {}).get("rsi", "")),
            str(signal.get("features", {}).get("imbalance", "")),
        ]
        sheet.worksheet("signals").append_row(row)
    except Exception as e:
        logger.warning(f"Sheets log_signal failed: {e}")


def log_trade(sheet, signal: dict, result: dict):
    """Appends a trade row to the 'trades' tab."""
    if not sheet:
        return
    try:
        row = [
            _now_utc(),
            signal.get("slug", ""),
            signal.get("question", "")[:100],
            signal.get("side", ""),
            result.get("price", ""),
            result.get("shares", ""),
            result.get("size_usdc", ""),
            signal.get("edge", ""),
            signal.get("model_prob", ""),
            result.get("status", ""),
            result.get("order_id", ""),
        ]
        sheet.worksheet("trades").append_row(row)
    except Exception as e:
        logger.warning(f"Sheets log_trade failed: {e}")


def setup_sheet_headers(sheet):
    """
    Writes headers to both tabs on first run.
    Safe to call every run — checks if headers already exist.
    """
    if not sheet:
        return

    try:
        signals_ws = sheet.worksheet("signals")
        if not signals_ws.row_values(1):
            signals_ws.append_row([
                "timestamp", "slug", "question", "side",
                "market_price", "model_prob", "edge", "spread",
                "rsi", "order_imbalance"
            ])

        trades_ws = sheet.worksheet("trades")
        if not trades_ws.row_values(1):
            trades_ws.append_row([
                "timestamp", "slug", "question", "side",
                "entry_price", "shares", "size_usdc",
                "edge", "model_prob", "status", "order_id"
            ])

        logger.info("Sheet headers verified")

    except Exception as e:
        logger.warning(f"Header setup failed: {e}")

def log_event(event_type, message):
    try:
        sheet = connect_sheet()
        log_tab = sheet.worksheet("logs")

        from datetime import datetime
        log_tab.append_row([
            datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            event_type,
            message
        ])
    except Exception as e:
        print(f"[LOG ERROR] {e}")
