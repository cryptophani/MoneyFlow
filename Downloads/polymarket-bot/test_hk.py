import requests

slugs = [
    'highest-temperature-in-hong-kong-on-may-1-2026-27c',
    'will-bitcoin-dip-to-72k-april-27-may-3',
    'will-solana-dip-to-80-april-27-may-3',
    'will-bitcoin-reach-78k-on-april-30',
]

for slug in slugs:
    r = requests.get(f'https://gamma-api.polymarket.com/markets?slug={slug}')
    data = r.json()
    if data:
        m = data[0]
        print(f'FOUND | resolved={m.get("resolved")} | resolution={m.get("resolution")} | {slug[:45]}')
    else:
        print(f'NOT FOUND | {slug[:45]}')