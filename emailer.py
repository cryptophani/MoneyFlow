"""
emailer.py — Gmail alerts for trades and errors.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import ALERT_EMAIL, GMAIL_APP_PASS, PAPER_TRADE

logger = logging.getLogger(__name__)


def send_email(subject: str, body: str):
    """
    Sends a Gmail alert. Fails silently if email isn't configured.
    Uses TLS (port 587) with App Password.
    """
    if not ALERT_EMAIL or not GMAIL_APP_PASS:
        logger.debug("Email not configured — skipping alert")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = ALERT_EMAIL
        msg["To"]      = ALERT_EMAIL

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(ALERT_EMAIL, GMAIL_APP_PASS)
            server.send_message(msg)

        logger.info(f"Email sent: {subject}")

    except Exception as e:
        logger.warning(f"Email failed: {e}")


def alert_trade(signal: dict, result: dict):
    mode = "[PAPER] " if PAPER_TRADE else "[LIVE] "
    subject = f"{mode}Trade: {signal['side']} {signal['slug']} | Edge {signal['edge']:.3f}"

    body = f"""
POLYMARKET TRADE ALERT
{'='*50}
Mode:         {'PAPER (no real money)' if PAPER_TRADE else '🔴 LIVE TRADE'}
Market:       {signal['question']}
Slug:         {signal['slug']}
Direction:    BUY {signal['side']}
Edge:         {signal['edge']:.4f} ({signal['edge']*100:.1f}¢)
Model Prob:   {signal['model_prob']:.4f} ({signal['model_prob']*100:.1f}%)
Market Price: {signal['market_price']:.4f} ({signal['market_price']*100:.1f}¢)
Entry Price:  ${result.get('price', 'N/A')}
Shares:       {result.get('shares', 'N/A')}
Size (USDC):  ${result.get('size_usdc', 'N/A')}
Status:       {result.get('status', 'unknown')}

Features:
  RSI:              {signal['features'].get('rsi', 'N/A')}
  Momentum:         {signal['features'].get('momentum', 'N/A')}
  Order Imbalance:  {signal['features'].get('imbalance', 'N/A')}
  Spread:           {signal.get('spread', 'N/A')}
{'='*50}
"""
    send_email(subject, body)


def alert_error(error_msg: str):
    send_email(
        subject = "⚠️ Polymarket Bot Error",
        body    = f"Bot encountered an error:\n\n{error_msg}"
    )


def alert_startup(wallet_balance: float, n_markets: int):
    mode = "PAPER TRADE MODE" if PAPER_TRADE else "🔴 LIVE TRADE MODE"
    send_email(
        subject = f"🤖 Bot Started — {mode}",
        body    = (
            f"Polymarket bot is running.\n\n"
            f"Mode:           {mode}\n"
            f"Wallet balance: ${wallet_balance:.2f} USDC\n"
            f"Markets scanned: {n_markets}\n"
        )
    )
