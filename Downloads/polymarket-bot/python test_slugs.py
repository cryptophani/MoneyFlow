import requests

slugs = [
    'will-amanda-anisimova-be-the-2026-womens-wimbledon-winner',
    'will-google-have-the-best-ai-model-at-the-end-of-may-2026',
    'us-x-iran-permanent-peace-deal-by-may-31-2026-333-871',
]

for slug in slugs:
    r = requests.get(f'https://gamma-api.polymarket.com/markets?slug={slug}')
    data = r.json()
    if data:
        m = data[0]
        resolved = m.get('resolved')
        resolution = m.get('resolution')
        closed = m.get('closed')
        print(f'FOUND | {slug[:50]} | resolved={resolved} | resolution={resolution} | closed={closed}')
    else:
        print(f'NOT FOUND | {slug[:50]}')