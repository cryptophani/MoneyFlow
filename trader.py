"""
trader.py — real Polymarket CLOB order execution.

Uses the official py-clob-client library.
Handles wallet connection, balance checking, and order placement.
"""

import logging
from typing import Optional
from config import (
    PRIVATE_KEY, FUNDER, SIG_TYPE, CLOB_HOST, CHAIN_ID,
    MIN_RESERVE, PAPER_TRADE
)

logger = logging.getLogger(__name__)


# ── CLOB Client Setup ────────────────────────────────────────

def create_client():
    """
    Disabled CLOB client for paper mode (no wallet needed).
    """
    logger.info("CLOB client disabled (paper mode)")
    return None

# ── Balance Check ─────────────────────────────────────────────

def get_wallet_balance(client) -> float:
    """
    Returns available USDC balance in wallet.
    Deducts MIN_RESERVE to leave a safety buffer.
    """
    try:
        balance_data = client.get_balance_allowance(
            params={"asset_type": "USDC"}
        )
        raw_balance = float(balance_data.get("balance", 0))
        usable = max(0.0, raw_balance - MIN_RESERVE)
        logger.info(f"Wallet balance: ${raw_balance:.2f} USDC "
                    f"(usable after reserve: ${usable:.2f})")
        return usable
    except Exception as e:
        logger.error(f"Balance check failed: {e}")
        return 0.0


# ── Duplicate Trade Guard ─────────────────────────────────────

_open_positions: set[str] = set()  # condition_ids currently traded

def already_open(condition_id: str) -> bool:
    return condition_id in _open_positions

def mark_open(condition_id: str):
    _open_positions.add(condition_id)

def mark_closed(condition_id: str):
    _open_positions.discard(condition_id)


# ── Order Execution ───────────────────────────────────────────

def execute_trade(client, signal: dict) -> dict:
    """
    Places a limit order on Polymarket.

    In PAPER_TRADE mode: logs the order but doesn't submit it.
    In live mode: places a GTC limit order via CLOB.

    Returns result dict with status and details.
    """
    from py_clob_client.clob_types import OrderArgs, OrderType
    from py_clob_client.order_builder.constants import BUY

    token_id    = signal["token_id"]
    price       = signal["entry_price"]
    size_usdc   = signal["size_usdc"]

    # Polymarket uses shares (contracts), not dollars, for size
    # shares = USDC_amount / price
    shares = round(size_usdc / price, 2)

    if PAPER_TRADE:
        logger.info(
            f"[PAPER] Would place: BUY {shares} shares of "
            f"{signal['side']} @ ${price:.3f} | "
            f"Market: {signal['slug']} | Edge: {signal['edge']:.3f}"
        )
        mark_open(signal["condition_id"])
        return {
            "status":    "paper",
            "side":      signal["side"],
            "price":     price,
            "shares":    shares,
            "size_usdc": size_usdc,
            "slug":      signal["slug"],
        }

    # ── Live order ──────────────────────────────────────────
    try:
        order_args = OrderArgs(
            token_id = token_id,
            price    = price,
            size     = shares,
            side     = BUY,  # We always BUY the side we want (YES or NO)
        )

        signed_order = client.create_order(order_args)
        response     = client.post_order(signed_order, OrderType.GTC)

        if response.get("status") in ("matched", "live"):
            mark_open(signal["condition_id"])
            logger.info(
                f"[TRADE] ✅ Placed: BUY {shares} {signal['side']} @ {price} "
                f"| {signal['slug']} | edge={signal['edge']}"
            )
            return {
                "status":    response.get("status"),
                "order_id":  response.get("orderID"),
                "side":      signal["side"],
                "price":     price,
                "shares":    shares,
                "size_usdc": size_usdc,
                "slug":      signal["slug"],
            }
        else:
            logger.warning(f"Order not filled: {response}")
            return {"status": "failed", "response": str(response)}

    except Exception as e:
        logger.error(f"Trade execution failed: {e}")
        return {"status": "error", "error": str(e)}
