"""
pnl_report.py — Writes a 12-hour P&L summary tab to your Google Sheet.
 
New tab is created every 12 hours named: "PnL YYYY-MM-DD HH:MM UTC"
Reads from the existing 'trades' tab. Does NOT modify any existing data.
"""
 
import logging
from datetime import datetime, timezone
 
logger = logging.getLogger(__name__)
 
# Trades tab column positions (1-based)
COL_TIMESTAMP   = 1
COL_SLUG        = 2
COL_QUESTION    = 3
COL_SIDE        = 4
COL_ENTRY_PRICE = 5
COL_SHARES      = 6
COL_SIZE_USDC   = 7
COL_EDGE        = 8
COL_MODEL_PROB  = 9
COL_STATUS      = 10
COL_ORDER_ID    = 11
COL_RESULT      = 12
COL_PNL         = 13
 
HEADER_ROW = 1
 
 
def _safe_float(val: str, default: float = 0.0) -> float:
    try:
        return float(val)
    except (ValueError, TypeError):
        return default
 
 
def _get_or_create_tab(sheet, name: str):
    try:
        return sheet.worksheet(name)
    except Exception:
        return sheet.add_worksheet(title=name, rows=300, cols=20)
 
 
def write_pnl_report(sheet):
    """
    Reads all resolved bets from 'trades' tab and writes a full
    P&L summary to a new timestamped tab.
    """
    if not sheet:
        return
 
    try:
        ws   = sheet.worksheet("trades")
        rows = ws.get_all_values()
    except Exception as e:
        logger.warning(f"Could not read trades tab for report: {e}")
        return
 
    bets = []
 
    for i, row in enumerate(rows):
        excel_row = i + 1
        if excel_row <= HEADER_ROW:
            continue
 
        try:
            result_val = row[COL_RESULT - 1].strip() if len(row) >= COL_RESULT else ""
            if result_val not in ("0", "1"):
                continue  # Skip unresolved
 
            timestamp   = row[COL_TIMESTAMP - 1].strip()   if len(row) >= COL_TIMESTAMP   else ""
            slug        = row[COL_SLUG - 1].strip()        if len(row) >= COL_SLUG        else ""
            question    = row[COL_QUESTION - 1].strip()    if len(row) >= COL_QUESTION    else ""
            side        = row[COL_SIDE - 1].strip()        if len(row) >= COL_SIDE        else ""
            entry_price = _safe_float(row[COL_ENTRY_PRICE - 1] if len(row) >= COL_ENTRY_PRICE else "")
            shares      = _safe_float(row[COL_SHARES - 1]      if len(row) >= COL_SHARES      else "")
            size_usdc   = _safe_float(row[COL_SIZE_USDC - 1]   if len(row) >= COL_SIZE_USDC   else "")
            edge        = _safe_float(row[COL_EDGE - 1]        if len(row) >= COL_EDGE        else "")
            model_prob  = _safe_float(row[COL_MODEL_PROB - 1]  if len(row) >= COL_MODEL_PROB  else "")
            pnl         = _safe_float(row[COL_PNL - 1]         if len(row) >= COL_PNL         else "")
            result      = int(result_val)
 
            won = (side == "YES" and result == 1) or (side == "NO" and result == 0)
 
            # Edge vs model alignment: was model_prob pointing the right way?
            model_aligned = (model_prob >= 0.5 and result == 1) or (model_prob < 0.5 and result == 0)
 
            bets.append({
                "timestamp":     timestamp,
                "slug":          slug,
                "question":      question[:60],
                "side":          side,
                "entry_price":   entry_price,
                "shares":        shares,
                "size_usdc":     size_usdc,
                "edge":          edge,
                "model_prob":    model_prob,
                "result":        result,
                "won":           won,
                "model_aligned": model_aligned,
                "pnl":           pnl,
            })
 
        except Exception:
            continue
 
    if not bets:
        logger.info("No resolved bets to report yet.")
        return
 
    # ── Compute summary stats ──────────────────────────────────
    total       = len(bets)
    correct     = sum(1 for b in bets if b["won"])
    wrong       = total - correct
    accuracy    = correct / total * 100 if total else 0
 
    total_pnl      = sum(b["pnl"]       for b in bets)
    total_invested = sum(b["size_usdc"] for b in bets)
    profit_pct     = (total_pnl / total_invested * 100) if total_invested else 0
 
    avg_edge       = sum(b["edge"]       for b in bets) / total if total else 0
    avg_model_prob = sum(b["model_prob"] for b in bets) / total if total else 0
    avg_entry      = sum(b["entry_price"]for b in bets) / total if total else 0
 
    model_aligned_count = sum(1 for b in bets if b["model_aligned"])
    model_accuracy      = model_aligned_count / total * 100 if total else 0
 
    winning_pnl = sum(b["pnl"] for b in bets if b["won"])
    losing_pnl  = sum(b["pnl"] for b in bets if not b["won"])
    avg_win     = winning_pnl / correct if correct else 0
    avg_loss    = losing_pnl  / wrong   if wrong   else 0
 
    now      = datetime.now(timezone.utc)
    tab_name = f"PnL {now.strftime('%Y-%m-%d %H:%M')} UTC"
 
    try:
        report_ws = _get_or_create_tab(sheet, tab_name)
        report_ws.clear()
    except Exception as e:
        logger.warning(f"Could not create report tab: {e}")
        return
 
    # ── Build report rows ──────────────────────────────────────
    pnl_sign = "+" if total_pnl >= 0 else ""
    rows_out = []
 
    # Title
    rows_out.append(["📊 MONEYFLOW — 12-HOUR P&L REPORT", "", "", "", "", ""])
    rows_out.append([f"Generated: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}", "", "", "", "", ""])
    rows_out.append(["", "", "", "", "", ""])
 
    # ── SUMMARY BLOCK ──
    rows_out.append(["SUMMARY", "", "", "", "", ""])
    rows_out.append(["─" * 30, "", "─" * 30, "", "", ""])
    rows_out.append(["Total Bets Placed",     total,                          "", "Total Invested (USDC)",  f"${total_invested:.2f}",       ""])
    rows_out.append(["✅ Correct",             correct,                        "", "Total PnL (USDC)",       f"{pnl_sign}{total_pnl:.4f}",   ""])
    rows_out.append(["❌ Wrong",               wrong,                          "", "Profit %",               f"{pnl_sign}{profit_pct:.2f}%", ""])
    rows_out.append(["Accuracy",              f"{accuracy:.1f}%",             "", "Avg Edge",               f"{avg_edge:.4f}",              ""])
    rows_out.append(["Avg Entry Price",       f"{avg_entry:.4f}",             "", "Avg Model Prob",          f"{avg_model_prob:.4f}",        ""])
    rows_out.append(["Avg Win (USDC)",        f"+{avg_win:.4f}",              "", "Avg Loss (USDC)",         f"{avg_loss:.4f}",              ""])
    rows_out.append(["Model Alignment",       f"{model_accuracy:.1f}%",       "", "(model_prob vs result)",  "",                            ""])
    rows_out.append(["", "", "", "", "", ""])
 
    # ── EDGE VS RESULT ──
    rows_out.append(["EDGE vs RESULT ALIGNMENT", "", "", "", "", ""])
    rows_out.append(["─" * 30, "", "", "", "", ""])
    rows_out.append(["Model suggested RIGHT direction", f"{model_aligned_count}/{total}", f"{model_accuracy:.1f}%", "", "", ""])
    rows_out.append(["Model suggested WRONG direction", f"{total - model_aligned_count}/{total}", f"{100-model_accuracy:.1f}%", "", "", ""])
    rows_out.append(["", "", "", "", "", ""])
 
    # ── BET-BY-BET DETAIL ──
    rows_out.append(["BET DETAIL", "", "", "", "", "", "", "", "", ""])
    rows_out.append([
        "Timestamp", "Question", "Side",
        "Entry Price", "Shares", "Size (USDC)",
        "Edge", "Model Prob", "Result",
        "Model Right?", "Won?", "PnL (USDC)"
    ])
    rows_out.append(["─" * 20] * 12)
 
    for b in bets:
        result_label  = "YES" if b["result"] == 1 else "NO"
        won_label     = "✅ WIN"  if b["won"]           else "❌ LOSS"
        aligned_label = "✅ YES"  if b["model_aligned"] else "❌ NO"
        pnl_str       = f"+{b['pnl']:.4f}" if b["pnl"] >= 0 else f"{b['pnl']:.4f}"
 
        rows_out.append([
            b["timestamp"],
            b["question"],
            b["side"],
            f"{b['entry_price']:.4f}",
            f"{b['shares']:.2f}",
            f"${b['size_usdc']:.2f}",
            f"{b['edge']:.4f}",
            f"{b['model_prob']:.4f}",
            result_label,
            aligned_label,
            won_label,
            pnl_str,
        ])
 
    rows_out.append(["", "", "", "", "", "", "", "", "", "", "TOTAL PnL", f"{pnl_sign}{total_pnl:.4f}"])
 
    # Write all at once
    try:
        report_ws.update(f"A1", rows_out)
        logger.info(f"✅ P&L report written to tab: '{tab_name}' ({total} bets, PnL={pnl_sign}{total_pnl:.4f})")
    except Exception as e:
        logger.warning(f"Failed to write report rows: {e}")
 