# Polymarket Trading Bot — Setup Guide

## What this is
A real, live trading bot for Polymarket using:
- **Gamma API** → fetches active markets by volume
- **CLOB API** → live order books, limit order execution
- **Data API** → historical prices for RSI + momentum
- **Strategy** → RSI + momentum + order imbalance → edge detection
- **Kelly sizing** → positions sized by edge strength, not fixed amounts
- **Google Sheets** → full trade + signal log
- **Email alerts** → every trade and error

---

## Step 1: Install Python dependencies

```powershell
cd betting-system
pip install -r requirements.txt
```

---

## Step 2: Get your Polymarket credentials

**You need:**
1. A Polymarket account funded with USDC on Polygon
2. Your private key (wallet signing key)
3. Your funder address (public wallet address)

**To export your private key:**
- Go to polymarket.com → Account → Settings → Private Key
- Click "Start Export" → sign in → copy the key
- If you used email/Magic.link to sign up → set `POLYMARKET_SIG_TYPE=1`
- If you used MetaMask → set `POLYMARKET_SIG_TYPE=0`

---

## Step 3: Google Sheets setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google Sheets API** and **Google Drive API**
4. Go to **Credentials** → **Create Service Account**
5. Download the JSON key → rename it to `creds.json` → put in project folder
6. Create a Google Sheet named exactly: `BettingSystem`
7. Add two tabs: `signals` and `trades`
8. Share the sheet with the service account email (found in creds.json) → Editor access

---

## Step 4: Gmail App Password

1. Google Account → Security → 2-Step Verification (enable if not already)
2. Security → App Passwords → Generate
3. Copy the 16-character password

---

## Step 5: Configure .env

```powershell
copy .env.example .env
```

Edit `.env` — fill in every value:
```
POLYMARKET_PRIVATE_KEY=0x...your key...
POLYMARKET_FUNDER=0x...your address...
POLYMARKET_SIG_TYPE=1
SHEET_NAME=BettingSystem
ALERT_EMAIL=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
PAPER_TRADE=true   ← START HERE, flip to false when ready
```

---

## Step 6: Run in paper mode first

```powershell
python main.py
```

You'll see terminal logs. Check:
- ✅ "CLOB client authenticated successfully"
- ✅ "Fetched X tradeable markets"
- ✅ "Connected to Google Sheet"
- ✅ Signals appearing in your Sheets `signals` tab
- ✅ Email alert on startup

**Watch paper mode for at least 2–3 days** before going live.

---

## Step 7: Go live

When you're satisfied with paper signals, edit `.env`:
```
PAPER_TRADE=false
```

**Before going live, check:**
- Your wallet has USDC on Polygon (not Ethereum mainnet)
- You've run the MetaMask allowance script if using MetaMask:
  `python set_allowances.py` (see Polymarket docs)
- `MAX_TRADE_USDC` is set to a comfortable amount ($10–$25 to start)
- `MIN_WALLET_RESERVE` leaves a safety buffer

---

## Automate with Windows Task Scheduler

1. Open Task Scheduler
2. Create Task → name: `PolymarketBot`
3. Trigger → At startup (or At log on)
4. Action:
   - Program: `python`
   - Arguments: `C:\full\path\to\betting-system\main.py`
5. Conditions: uncheck "Start only if on AC power"

---

## Strategy explained

The bot doesn't use a fixed offset. It estimates true probability using:

| Feature | What it measures | Effect |
|---------|-----------------|--------|
| RSI | Is YES overbought or oversold? | Mean-reversion signal |
| Momentum | Recent price trend | Trend-following boost |
| Order imbalance | More buyers vs sellers in order book | Pressure signal |
| Spread | Execution cost | Filters illiquid markets |

**Kelly criterion** sizes each trade based on edge strength:
- Strong edge ($0.10+) → larger position
- Weak edge ($0.07–0.09) → small position
- Capped at `MAX_TRADE_USDC` always

---

## Files explained

| File | Purpose |
|------|---------|
| `main.py` | Main loop — ties everything together |
| `config.py` | All settings from .env |
| `market_data.py` | Gamma + CLOB + Data API fetchers |
| `strategy.py` | RSI + momentum + Kelly signal engine |
| `trader.py` | CLOB client setup + order execution |
| `sheets.py` | Google Sheets logging |
| `emailer.py` | Gmail alerts |
| `requirements.txt` | Python dependencies |
| `.env` | Your credentials (never commit this) |
| `creds.json` | Google service account (never commit this) |

---

## ⚠️ Risk warnings

- Prediction markets are risky. Edge detection is probabilistic, not certain.
- Start with small amounts ($5–$10 per trade) to verify the system works.
- Never fund a trading wallet with money you can't afford to lose.
- US persons are prohibited from trading on Polymarket per their ToS.
- This is not financial advice.
