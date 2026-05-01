from __future__ import annotations

from datetime import datetime, timezone
from statistics import mean
from typing import Any

import config
from market_data import fetch_active_markets, fetch_order_book_features
from strategy import generate_signal


def _format_expiry(market: dict[str, Any]) -> str:
    raw = market.get("end_date_iso") or market.get("end_date")
    if not raw:
        return "Open"

    try:
        expiry = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return expiry.strftime("%b %d, %Y")
    except ValueError:
        return raw


def _build_activity(signals: list[dict[str, Any]], updated_at: datetime) -> list[dict[str, str]]:
    events: list[dict[str, str]] = []
    timestamp = updated_at.strftime("%H:%M UTC")

    if signals:
        top = signals[0]
        events.append(
            {
                "time": timestamp,
                "title": f"Signal ready: {top['side']} {top['slug']}",
                "detail": f"Edge {top['edge']:.3f} with ${top['size_usdc']:.2f} suggested size.",
            }
        )

    events.append(
        {
            "time": timestamp,
            "title": f"Scanned {len(signals)} qualified opportunities",
            "detail": "Markets filtered by liquidity, price bounds, and time to resolution.",
        }
    )
    events.append(
        {
            "time": timestamp,
            "title": "Paper trading guard enabled",
            "detail": "Dashboard reflects simulated position sizing and no live execution.",
        }
    )

    return events


def _demo_snapshot(updated_at: datetime) -> dict[str, Any]:
    signals = [
        {
            "market": "Will the Fed cut rates before September?",
            "slug": "fed-cut-before-september",
            "side": "YES",
            "edge": 0.084,
            "model_prob": 0.612,
            "entry_price": 0.528,
            "size_usdc": 25.0,
            "expiry": "Aug 20, 2026",
            "confidence": 84,
            "status": "Demo",
            "volume": 240000.0,
            "liquidity": 68000.0,
            "imbalance": 0.312,
            "spread": 0.012,
        },
        {
            "market": "Will ETH ETF flows stay positive this week?",
            "slug": "eth-etf-positive-week",
            "side": "NO",
            "edge": 0.071,
            "model_prob": 0.433,
            "entry_price": 0.621,
            "size_usdc": 18.5,
            "expiry": "May 08, 2026",
            "confidence": 71,
            "status": "Demo",
            "volume": 175000.0,
            "liquidity": 42000.0,
            "imbalance": -0.241,
            "spread": 0.009,
        },
        {
            "market": "Will CPI print below consensus next release?",
            "slug": "cpi-below-consensus-next-release",
            "side": "YES",
            "edge": 0.063,
            "model_prob": 0.587,
            "entry_price": 0.524,
            "size_usdc": 14.0,
            "expiry": "May 14, 2026",
            "confidence": 63,
            "status": "Demo",
            "volume": 132000.0,
            "liquidity": 35800.0,
            "imbalance": 0.226,
            "spread": 0.015,
        },
    ]
    markets = [
        {
            "question": signal["market"],
            "volume": signal["volume"],
            "liquidity": signal["liquidity"],
            "yes_price": signal["entry_price"],
        }
        for signal in signals
    ]
    return {
        "updated_at": updated_at,
        "market_count": len(markets),
        "signal_count": len(signals),
        "avg_edge": mean([signal["edge"] for signal in signals]),
        "avg_confidence": mean([signal["confidence"] for signal in signals]),
        "largest_position": max(signal["size_usdc"] for signal in signals),
        "wallet_balance": 100.0,
        "signals": signals,
        "market_scanner": markets,
        "activity": [
            {
                "time": updated_at.strftime("%H:%M UTC"),
                "title": "Demo mode enabled",
                "detail": "Live Polymarket data was unavailable, so seeded opportunities are displayed.",
            },
            {
                "time": updated_at.strftime("%H:%M UTC"),
                "title": "UI remains interactive",
                "detail": "The dashboard layout, controls, and table rendering can still be reviewed end to end.",
            },
            {
                "time": updated_at.strftime("%H:%M UTC"),
                "title": "Paper trading only",
                "detail": "No live orders are created from the dashboard path.",
            },
        ],
        "demo_mode": True,
    }


def collect_dashboard_snapshot(limit: int = 60) -> dict[str, Any]:
    markets = fetch_active_markets(limit=limit)
    wallet_balance = max(config.MAX_TRADE_USDC * 10, 100.0)
    signals: list[dict[str, Any]] = []
    updated_at = datetime.now(timezone.utc)

    if not markets:
        return _demo_snapshot(updated_at)

    for market in markets:
        order_book = fetch_order_book_features(None, market["yes_token_id"])
        signal = generate_signal(market, order_book, [], wallet_balance)
        if not signal:
            continue

        confidence = min(99, max(5, round(abs(signal["edge"]) * 1000)))
        signals.append(
            {
                "market": signal["question"],
                "slug": signal["slug"],
                "side": signal["side"],
                "edge": signal["edge"],
                "model_prob": signal["model_prob"],
                "entry_price": signal["entry_price"],
                "size_usdc": signal["size_usdc"],
                "expiry": _format_expiry(market),
                "confidence": confidence,
                "status": "Active" if signal["edge"] >= config.EDGE_THRESHOLD else "Watch",
                "volume": market["volume"],
                "liquidity": market["liquidity"],
                "imbalance": signal["features"]["imbalance"],
                "spread": signal.get("spread", 0.0),
            }
        )

    signals.sort(key=lambda item: item["edge"], reverse=True)

    avg_edge = mean([signal["edge"] for signal in signals]) if signals else 0.0
    avg_confidence = mean([signal["confidence"] for signal in signals]) if signals else 0.0
    largest_position = max((signal["size_usdc"] for signal in signals), default=0.0)
    return {
        "updated_at": updated_at,
        "market_count": len(markets),
        "signal_count": len(signals),
        "avg_edge": avg_edge,
        "avg_confidence": avg_confidence,
        "largest_position": largest_position,
        "wallet_balance": wallet_balance,
        "signals": signals,
        "market_scanner": markets[:8],
        "activity": _build_activity(signals, updated_at),
        "demo_mode": False,
    }
