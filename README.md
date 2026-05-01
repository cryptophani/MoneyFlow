# MoneyFlow — Polymarket Paper Trading Bot

An automated prediction market trading bot for Polymarket, built for signal generation, edge calculation, and simulated paper trading with both a local Python dashboard and a static web preview for GitHub/Netlify deployments.

---

## What It Does

- Scans live Polymarket markets every 2 minutes
- Calculates edge using market price and orderbook imbalance
- Filters markets by volume, liquidity, time-to-resolution, and question type
- Uses Kelly Criterion for optimal bet sizing
- Logs all signals and trades to Google Sheets
- Sends email alerts on every signal
- Tracks resolved bets and calculates real P&L
- Writes a 12-hour P&L report automatically
- Includes a Streamlit dashboard for local monitoring
- Includes a static frontend preview that can be deployed directly from GitHub on Netlify

---

## Stack

- Python 3.10+
- Polymarket CLOB API
- Google Sheets API for logging
- Gmail SMTP for alerts
- Streamlit for the local dashboard UI
- Static HTML/CSS/JS for GitHub-connected web deployment

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/joshianushka0608-lgtm/MoneyFlow.git
cd MoneyFlow
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```
POLYMARKET_PRIVATE_KEY=your_key_here
POLYMARKET_FUNDER=your_funder_address
PERPLEXITY_API_KEY=your_key_here
SHEET_NAME=MoneyFlow
ALERT_EMAIL=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
MIN_VOLUME=5000
MIN_LIQUIDITY=1000
KELLY_FRACTION=0.25
MAX_TRADE_USDC=25
MIN_WALLET_RESERVE=20
EDGE_THRESHOLD=0.06
LOOP_INTERVAL=120
PAPER_TRADE=true
```

### 4. Add Google Sheets credentials

- Go to Google Cloud Console
- Enable Google Sheets API and Google Drive API
- Create a Service Account and download `creds.json`
- Place `creds.json` in the project root
- Share your Google Sheet with the service account email

### 5. Run

```bash
python main.py
```

### 6. Launch the dashboard

```bash
streamlit run dashboard_app.py
```

### 7. Launch the static web preview

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

---

## Paper Trade Mode

`PAPER_TRADE=true` is the default. In this mode:

- All signals are logged to Google Sheets
- No real orders are placed on Polymarket
- Simulates $100 per bet to track hypothetical P&L
- Safe to run with dummy Polymarket keys

To switch to live trading, set `PAPER_TRADE=false` and add real wallet credentials.

---

## How Edge Is Calculated

```
model_prob = price + orderbook_signal + mean_reversion_term
edge = model_prob - market_price
```

A signal is generated when `edge ≥ EDGE_THRESHOLD`.

Bet size is calculated using Kelly Criterion:

```
Kelly % = (p × b - q) / b
size = Kelly % × KELLY_FRACTION × wallet_balance
```

---

## File Structure

```
MoneyFlow/
├── main.py              # Main loop
├── strategy.py          # Edge calculation + signal generation
├── market_data.py       # Polymarket API fetching
├── trader.py            # Order execution (paper + live)
├── sheets.py            # Google Sheets logging
├── emailer.py           # Email alerts
├── result_checker.py    # Tracks resolved bets
├── pnl_report.py        # 12-hour P&L reports
├── dashboard_app.py     # Streamlit dashboard
├── dashboard_data.py    # Dashboard snapshot builder
├── index.html           # Static deployable dashboard
├── styles.css           # Static dashboard styles
├── app.js               # Static dashboard data + rendering
├── netlify.toml         # Netlify publish configuration
├── config.py            # All settings from .env
├── requirements.txt     # Dependencies
├── .env.example         # Environment variable template
└── SETUP.md             # Quick setup guide
```

---

## Security

- Never commit your `.env` or `creds.json`
- Both should be excluded via `.gitignore`
- Use `PAPER_TRADE=true` until you have validated edge over 100+ simulated bets

---

## Author

Built by Anushka Joshi — [F-Day](https://github.com/joshianushka0608-lgtm)
