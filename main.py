import time
import logging
import sys
from datetime import datetime, timezone
 
import config
from market_data import fetch_active_markets, fetch_order_book_features
from strategy import generate_signal
from trader import create_client, get_wallet_balance, already_open, execute_trade
from sheets import connect_sheet, setup_sheet_headers, log_signal, log_trade, log_event
from emailer import alert_trade, alert_error
 
# ── NEW: result checker + P&L reporter ─────────────────────
from result_checker import check_and_update_results, ensure_trades_headers
from pnl_report import write_pnl_report
 
# ── Logging Setup ───────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")
 
REPORT_EVERY_N_LOOPS = int((12 * 3600) / config.LOOP_INTERVAL)  # 12hrs in loops
 
 
# ── MAIN LOOP ───────────────────────────────────────────────
def run():
    logger.info("Starting Money Flow — PAPER TRADE mode")
 
    sheet = connect_sheet()
    setup_sheet_headers(sheet)
 
    # ── NEW: ensure result_input + pnl headers exist ────────
    ensure_trades_headers(sheet)
 
    client = create_client()
 
    loop = 0
 
    while True:
        loop += 1
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
 
        logger.info(f"─── Loop #{loop} | {now} UTC ───")
        log_event("SYSTEM", f"Loop {loop} started")
 
        try:
            markets = fetch_active_markets()
            logger.info(f"Fetched {len(markets)} markets")
            log_event("SYSTEM", f"{len(markets)} markets fetched")
 
            balance = get_wallet_balance(client) if client else 100.0
            logger.info(f"Balance: ${balance:.2f}")
 
            # ── MARKET LOOP ───────────────────────────────
            for market in markets:
                try:
                    ob = fetch_order_book_features(client, market["yes_token_id"])
                    prices = []
 
                    signal = generate_signal(market, ob, prices, balance)
 
                    if not signal:
                        continue
 
                    if already_open(signal["condition_id"]):
                        continue
 
                    # 🔥 SHARES CALCULATION (PnL base)
                    signal["test_investment"] = 100
                    signal["shares_bought"] = round(100 / signal["entry_price"], 2)
 
                    # ⏱️ timestamps
                    signal["timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                    signal["resolution_time"] = (
                        market.get("end_date_iso") or
                        market.get("end_date") or
                        "N/A"
                    )
 
                    logger.info(
                        f"[SIGNAL] {signal['side']} | {signal['slug']} | edge={signal['edge']}"
                    )
 
                    log_event(
                        "SIGNAL",
                        f"{signal['side']} | {signal['slug']} | edge={signal['edge']}"
                    )
 
                    # 📊 Log + Execute
                    log_signal(sheet, signal)
 
                    result = execute_trade(client, signal)
 
                    log_trade(sheet, signal, result)
 
                    alert_trade(signal, result)
 
                except Exception as e:
                    logger.warning(f"Market error: {e}")
                    log_event("ERROR", str(e))
 
        except Exception as e:
            logger.error(f"Main loop error: {e}")
            log_event("CRITICAL", str(e))
            alert_error(str(e))
 
        # ── NEW: check for resolved bets every loop ──────────
        try:
            newly_resolved = check_and_update_results(sheet)
            if newly_resolved:
                log_event("RESULTS", f"{len(newly_resolved)} bet(s) resolved this loop")
        except Exception as e:
            logger.warning(f"Result checker error: {e}")
 
        # ── NEW: write P&L report every 12 hours ────────────
        if loop % REPORT_EVERY_N_LOOPS == 0:
            try:
                logger.info("Writing 12-hour P&L report...")
                write_pnl_report(sheet)
                log_event("REPORT", "12-hour P&L report written")
            except Exception as e:
                logger.warning(f"P&L report error: {e}")
 
        time.sleep(config.LOOP_INTERVAL)
 
 
# ── RUN ─────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        logger.info("Stopped by user. Goodbye.")
        sys.exit(0)
 