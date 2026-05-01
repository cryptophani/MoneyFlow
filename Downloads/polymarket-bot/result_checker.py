"""
result_checker.py — Checks Polymarket for resolved bets and updates the trades tab.
 
Adds two new columns to existing trades tab (after column 11 / order_id):
  Col 12: result_input   → 1 (YES won) or 0 (NO won)
  Col 13: pnl            → calculated profit/loss in USDC
 
Drop-in module. Does NOT modify any existing columns or logic.
"""
 
import logging
import requests
import time
from datetime import datetime, timezone
 
logger = logging.getLogger(__name__)
 
GAMMA_API = "https://gamma-api.polymarket.com"
 
# Existing trades tab column positions (1-based)
COL_SLUG         = 2
COL_SIDE         = 4
COL_ENTRY_PRICE  = 5
COL_SHARES       = 6
COL_SIZE_USDC    = 7
COL_EDGE         = 8
COL_MODEL_PROB   = 9
COL_STATUS       = 10
COL_ORDER_ID     = 11
 
# NEW columns being added
COL_RESULT_INPUT = 12
COL_PNL          = 13
 
HEADER_ROW = 1
 
 
def _get(url: str, params: dict = None) -> dict | list | None:
    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.warning(f"API error [{url}]: {e}")
        return None
 
 
def fetch_market_result(slug: str) -> tuple[int | None, str]:
    """
    Queries Gamma API for a market by slug.
    Returns (result, status_str):
        result = 1 (YES won), 0 (NO won), None (not resolved yet)
        status_str = 'resolved' | 'closed' | 'open'
    """
    # Try by slug first
    data = _get(f"{GAMMA_API}/markets", params={"slug": slug})
 
    # Fallback: search by condition_id
    if not data or not isinstance(data, list) or len(data) == 0:
        data = _get(f"{GAMMA_API}/markets", params={"condition_id": slug})
 
    if not data or not isinstance(data, list) or len(data) == 0:
        return None, "unknown"
 
    market = data[0]
 
    resolved  = market.get("resolved", False)
    closed    = market.get("closed", False)
    status_str = "resolved" if resolved else ("closed" if closed else "open")
 
    if not resolved:
        return None, status_str
 
    # Check resolution field
    resolution = market.get("resolution", "")
    if isinstance(resolution, str):
        if resolution.lower() in ("yes", "1"):
            return 1, status_str
        elif resolution.lower() in ("no", "0"):
            return 0, status_str
 
    # Fallback: check token prices
    tokens = market.get("tokens", [])
    for token in tokens:
        outcome = token.get("outcome", "").lower()
        price   = float(token.get("price", 0))
        if price >= 0.99:
            return (1 if outcome == "yes" else 0), status_str
 
    return None, status_str
 
 
def compute_pnl(side: str, entry_price: float, shares: float, result: int) -> float:
    """
    PnL formula matching your MoneyFlow sheet logic:
      WIN:  shares * (1 - entry_price)
      LOSS: -shares * entry_price
    """
    won = (side == "YES" and result == 1) or (side == "NO" and result == 0)
    return round(shares * (1 - entry_price) if won else -shares * entry_price, 4)
 
 
def ensure_trades_headers(sheet):
    """Adds result_input and pnl headers if not already present."""
    try:
        ws  = sheet.worksheet("trades")
        row = ws.row_values(1)
 
        # Extend headers if needed
        if len(row) < COL_RESULT_INPUT:
            ws.update_cell(1, COL_RESULT_INPUT, "result_input")
        if len(row) < COL_PNL:
            ws.update_cell(1, COL_PNL, "pnl")
 
        logger.info("Trades tab headers verified (result_input, pnl)")
    except Exception as e:
        logger.warning(f"Header check failed: {e}")
 
 
def check_and_update_results(sheet) -> list[dict]:
    """
    Main function. Call this every loop from main.py.
 
    Scans all rows in 'trades' tab. For any row without a result_input,
    queries Polymarket. If resolved, writes result_input and pnl.
 
    Returns list of newly resolved bets (for reporting).
    """
    if not sheet:
        return []
 
    newly_resolved = []
 
    try:
        ws   = sheet.worksheet("trades")
        rows = ws.get_all_values()
    except Exception as e:
        logger.warning(f"Could not read trades tab: {e}")
        return []
 
    for i, row in enumerate(rows):
        excel_row = i + 1
        if excel_row <= HEADER_ROW:
            continue
 
        # Skip if already resolved
        try:
            existing_result = row[COL_RESULT_INPUT - 1].strip()
        except IndexError:
            existing_result = ""
 
        if existing_result in ("0", "1"):
            continue
 
        # Get slug
        slug = row[COL_SLUG - 1].strip() if len(row) >= COL_SLUG else ""
        if not slug:
            continue
 
        result, status_str = fetch_market_result(slug)
 
        # Always update status
        try:
            current_status = row[COL_STATUS - 1].strip() if len(row) >= COL_STATUS else ""
            if current_status != status_str:
                ws.update_cell(excel_row, COL_STATUS, status_str)
        except Exception:
            pass
 
        if result is None:
            time.sleep(0.3)
            continue
 
        # Parse existing values
        try:
            side        = row[COL_SIDE - 1].strip()        if len(row) >= COL_SIDE        else ""
            entry_price = float(row[COL_ENTRY_PRICE - 1])  if len(row) >= COL_ENTRY_PRICE else 0.0
            shares      = float(row[COL_SHARES - 1])       if len(row) >= COL_SHARES      else 0.0
            size_usdc   = float(row[COL_SIZE_USDC - 1])    if len(row) >= COL_SIZE_USDC   else 0.0
            edge        = float(row[COL_EDGE - 1])         if len(row) >= COL_EDGE        else 0.0
            model_prob  = float(row[COL_MODEL_PROB - 1])   if len(row) >= COL_MODEL_PROB  else 0.0
        except (ValueError, IndexError):
            time.sleep(0.3)
            continue
 
        pnl = compute_pnl(side, entry_price, shares, result)
        won = pnl > 0
 
        # Write result_input and pnl
        ws.update_cell(excel_row, COL_RESULT_INPUT, result)
        ws.update_cell(excel_row, COL_PNL, pnl)
 
        label = "✅ WON" if won else "❌ LOST"
        logger.info(
            f"[RESULT] Row {excel_row} | {label} | {slug} | "
            f"side={side} result={'YES' if result==1 else 'NO'} | PnL={pnl:+.4f}"
        )
 
        newly_resolved.append({
            "row":        excel_row,
            "slug":       slug,
            "side":       side,
            "result":     result,
            "won":        won,
            "entry_price": entry_price,
            "shares":     shares,
            "size_usdc":  size_usdc,
            "edge":       edge,
            "model_prob": model_prob,
            "pnl":        pnl,
        })
 
        time.sleep(0.4)
 
    if newly_resolved:
        logger.info(f"[RESULT] {len(newly_resolved)} bet(s) resolved this loop.")
 
    return newly_resolved
 