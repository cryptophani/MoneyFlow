import json
import time
import logging
import requests
from typing import Optional
from config import GAMMA_URL, DATA_URL, MIN_VOLUME, MIN_LIQUIDITY

logger = logging.getLogger(__name__)

CLOB_REST_URL = "https://clob.polymarket.com"


# ── Safe request helper ─────────────────────────────────────
def _get(url: str, params: dict = None, retries: int = 3):
    for attempt in range(retries):
        try:
            r = requests.get(url, params=params, timeout=10)
            if r.status_code == 429:
                time.sleep(2 ** attempt)
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.warning(f"Request failed ({attempt+1}/{retries}): {e}")
            time.sleep(1)
    return None


# ── Fetch active markets (Gamma API) ────────────────────────
def fetch_active_markets(limit: int = 100) -> list[dict]:
    data = _get(
        f"{GAMMA_URL}/markets",
        params={
            "active": "true",
            "closed": "false",
            "archived": "false",
            "enableOrderBook": "true",
            "limit": limit,
            "order": "volume",
            "ascending": "false",
        }
    )

    if not data:
        return []

    markets = []

    for m in data:
        try:
            volume = float(m.get("volume", 0) or 0)
            liquidity = float(m.get("liquidity", 0) or 0)

            if volume < MIN_VOLUME:
                continue
            if liquidity < MIN_LIQUIDITY:
                continue

            outcomes = json.loads(m.get("outcomes", '["Yes","No"]'))
            outcome_prices = json.loads(m.get("outcomePrices", '[0.5,0.5]'))

            yes_idx = next(
                (i for i, o in enumerate(outcomes) if o.lower() in ("yes", "true")), 0
            )

            yes_price = float(outcome_prices[yes_idx])
            no_price = float(outcome_prices[1 - yes_idx])

            clob_token_ids = m.get("clobTokenIds")
            if isinstance(clob_token_ids, str):
                clob_token_ids = json.loads(clob_token_ids)

            if not clob_token_ids or len(clob_token_ids) < 2:
                continue

            markets.append({
                "condition_id": m.get("conditionId"),
                "gamma_id": str(m.get("id", "")),   # ✅ IMPORTANT FIX
                "question": m.get("question", ""),
                "yes_token_id": clob_token_ids[yes_idx],
                "no_token_id": clob_token_ids[1 - yes_idx],
                "yes_price": yes_price,
                "no_price": no_price,
                "volume": volume,
                "liquidity": liquidity,
                "end_date": m.get("endDate"),
                "end_date_iso": m.get("endDateIso"),
                "slug": m.get("slug", ""),
            })

        except Exception:
            continue

    logger.info(f"Fetched {len(markets)} tradeable markets")
    return markets


# ── Order book (CLOB API) ───────────────────────────────────
def fetch_order_book_features(clob_client, token_id: str) -> dict:
    try:
        data = _get(f"{CLOB_REST_URL}/book", params={"token_id": token_id})

        if not data:
            return {"imbalance": 0.0, "liquidity": 0.0, "spread": 0.0}

        bids = data.get("bids", [])
        asks = data.get("asks", [])

        bid_vol = sum(float(b["price"]) * float(b["size"]) for b in bids[:5])
        ask_vol = sum(float(a["price"]) * float(a["size"]) for a in asks[:5])
        best_bid = float(bids[0]["price"]) if bids else 0.0
        best_ask = float(asks[0]["price"]) if asks else 0.0

        total = bid_vol + ask_vol
        imbalance = (bid_vol - ask_vol) / total if total > 0 else 0.0
        spread = max(0.0, best_ask - best_bid) if best_bid and best_ask else 0.0

        return {
            "imbalance": imbalance,
            "liquidity": total,
            "spread": spread,
            "best_bid": best_bid,
            "best_ask": best_ask,
        }

    except Exception as e:
        logger.warning(f"Order book error: {e}")
        return {"imbalance": 0.0, "liquidity": 0.0, "spread": 0.0}


# ── Price history (CORRECT: Data API + gamma_id) ────────────
def fetch_price_history(gamma_id: str, fidelity: int = 60) -> list[float]:
    if not gamma_id:
        return []

    data = _get(
        f"{DATA_URL}/prices-history",
        params={
            "market": gamma_id,
            "fidelity": fidelity,
        }
    )

    if not data or "history" not in data:
        return []

    return [float(p["p"]) for p in data["history"] if "p" in p]
