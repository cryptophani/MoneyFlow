import logging
from typing import Optional
from config import EDGE_THRESHOLD, KELLY_FRACTION, MAX_TRADE_USDC, MIN_LIQUIDITY, MIN_VOLUME

logger = logging.getLogger(__name__)


# ── MODEL ───────────────────────────────────────────────
def estimate_model_probability(market, ob_features):
    price = market.get("yes_price", 0.5)
    imbalance = ob_features.get("imbalance", 0)

    volume = market.get("volume", 0)
    liquidity = ob_features.get("liquidity", market.get("liquidity", 0))

    # ❌ Filter bad markets
    if volume < MIN_VOLUME or liquidity < MIN_LIQUIDITY:
        return None

    # ❌ Avoid extreme markets
    if price > 0.9 or price < 0.1:
        return None

    # Signals
    signal_ob = imbalance * 0.03
    signal_price = (0.5 - price) * 0.2

    # Combine
    model_prob = price + signal_ob + signal_price

    return max(0.05, min(0.95, model_prob))


# ── KELLY SIZING ────────────────────────────────────────
def kelly_size(model_prob, market_price, side, wallet_balance):
    if wallet_balance <= 0:
        return 5.0  # fallback for paper trading

    if side == "YES":
        p = model_prob
        price = market_price
    else:
        p = 1.0 - model_prob
        price = 1.0 - market_price

    if price <= 0 or price >= 1:
        return 0.0

    b = (1.0 / price) - 1.0
    q = 1.0 - p
    f = (p * b - q) / b

    if f <= 0:
        return 0.0

    size = f * KELLY_FRACTION * wallet_balance
    return min(round(size, 2), MAX_TRADE_USDC)


# ── MAIN SIGNAL ─────────────────────────────────────────
def generate_signal(market, ob_features, price_history, wallet_balance):
    yes_price = market["yes_price"]
    no_price  = market["no_price"]

    # Filter markets ending more than 7 days away
    from datetime import datetime, timezone
    end_date = market.get("end_date_iso") or market.get("end_date")
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            days_left = (end_dt - datetime.now(timezone.utc)).days
            if days_left > 7:
                return None
        except Exception:
            pass

    # 🚫 Filter bad market types
    question = market["question"].lower()

    if any(x in question for x in [
        "bitcoin", "btc", "solana", "eth",
        "temperature", "weather",
        "hit", "reach", "price"
    ]):
        return None

    # ❌ Skip extreme prices
    if yes_price < 0.03 or yes_price > 0.97:
        return None

    # ✅ Estimate model probability (clean call)
    model_prob = estimate_model_probability(market, ob_features)

    if model_prob is None:
        return None

    # Compute edges
    yes_edge = model_prob - yes_price
    no_edge  = (1 - model_prob) - no_price

    edge = max(yes_edge, no_edge)

    # ❌ Remove weak & fake edges
    if edge < EDGE_THRESHOLD or edge > 0.15:
        return None

    # Decide side
    if yes_edge >= no_edge:
        side = "YES"
        token_id = market["yes_token_id"]
        entry = yes_price
        final_edge = yes_edge
    else:
        side = "NO"
        token_id = market["no_token_id"]
        entry = no_price
        final_edge = no_edge

    # Size
    size = kelly_size(model_prob, yes_price, side, wallet_balance)

    if size <= 0:
        size = 5.0  # fallback

    return {
        "condition_id": market["condition_id"],
        "question": market["question"],
        "slug": market["slug"],
        "side": side,
        "token_id": token_id,
        "entry_price": round(entry, 3),
        "size_usdc": size,
        "edge": round(final_edge, 4),
        "model_prob": round(model_prob, 4),
        "market_price": yes_price,
        "spread": round(ob_features.get("spread", 0.0), 4),
        "features": {
            "imbalance": round(ob_features.get("imbalance", 0.0), 4),
            "liquidity": round(ob_features.get("liquidity", market.get("liquidity", 0.0)), 2),
            "price_deviation": round(model_prob - yes_price, 4),
        },
    }
