"""Refresh factual Canadian viewing offers from public title-page structured data.
No API keys, private endpoints, playback requests, or browser scraping required.
Failure preserves the last successful record with a visible stale flag.
"""
import argparse
import datetime as dt
import html
import json
from pathlib import Path
import re
import time
import unicodedata
import urllib.request
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]

def normalize(text):
    text = unicodedata.normalize('NFKD', html.unescape(text)).lower()
    return ''.join(c for c in text if c.isalnum() and not unicodedata.combining(c))

def structured_nodes(page):
    result = []
    for block in re.findall(r'<script[^>]*type=[\'"]application/ld\+json[\'"][^>]*>(.*?)</script>', page, re.S | re.I):
        data = json.loads(block)
        for item in data if isinstance(data, list) else [data]:
            result.extend(item.get('@graph', [item]))
    return result

def movie_node(page, movie):
    nodes = structured_nodes(page)
    names = [movie['title'], *movie.get('aliases', [])]
    for n in nodes:
        types = n.get('@type', [])
        if isinstance(types, str): types = [types]
        if 'Movie' in types and normalize(n.get('name', '')) in [normalize(t) for t in names]:
            if movie['source'] == 'justwatch':
                year = str(n.get('dateCreated', ''))[:4]
                if year != str(movie.get('sourceYear', movie['year'])):
                    raise ValueError(f"Year mismatch: expected {movie['year']}, received {year}")
            return n
    raise ValueError('Expected movie identity missing from structured data')

def extract_offers(page, movie):
    n = movie_node(page, movie)
    if movie['source'] == 'nfb':
        embed = n.get('embedUrl', '')
        if not embed.startswith(movie['url'] + 'embed/player/'):
            raise ValueError('NFB player link missing')
        return [{'provider':'NFB', 'type':'Film player', 'url':movie['url']}], None
    offers = []
    for a in n.get('potentialAction') or []:
        if a.get('@type') != 'WatchAction': continue
        offer = a.get('expectsAcceptanceOf', {})
        region = offer.get('eligibleRegion', {}).get('name')
        currency = offer.get('priceCurrency')
        if region != 'CA': continue
        if currency != 'CAD' and not (currency is None and offer.get('price') in (None, 0)): continue
        if offer.get('availability') != 'https://schema.org/InStock': continue
        target = a.get('target', {})
        url = html.unescape(target.get('urlTemplate', ''))
        if urlparse(url).scheme != 'https': continue
        provider = html.unescape(offer.get('offeredBy', {}).get('name', ''))
        if not provider: continue
        action = offer.get('businessFunction', '').rsplit('/', 1)[-1]
        properties = {p.get('name'):p.get('value') for p in offer.get('additionalProperty', [])}
        if action == 'RentAction': kind = 'Rent'
        elif action == 'SellAction': kind = 'Buy'
        elif properties.get('BillingPeriod'): kind = 'Subscription'
        elif offer.get('price') == 0: kind = 'Free / ads'
        else: kind = 'Stream'
        if provider.lower() in ('hoopla','kanopy'): kind = 'Library access'
        item = {'provider':provider, 'type':kind, 'url':url}
        if not any(o['provider']==provider and o['type']==kind for o in offers): offers.append(item)
    aggregate = n.get('offers') or {}
    visible = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', page, flags=re.S | re.I)
    visible = html.unescape(re.sub(r'<[^>]+>', ' ', visible))
    explicit_empty = normalize(n['name'] + ' is not available for streaming') in normalize(visible)
    if not offers and aggregate.get('offerCount') != 0 and not explicit_empty:
        raise ValueError('Offer structure changed or Canadian offers could not be validated')
    order = {'Subscription':0,'Free / ads':1,'Library access':2,'Stream':3,'Rent':4,'Buy':5}
    return sorted(offers,key=lambda o:(order.get(o['type'],9),o['provider'])), aggregate.get('dateModified')

def fetch_page(url):
    req=urllib.request.Request(url, headers={'User-Agent':'SquarewatchAvailability/1.0 (+https://github.com/polerix/Squarewatch)', 'Accept':'text/html'})
    with urllib.request.urlopen(req, timeout=30) as response:
        final=urlparse(response.geturl())
        expected=urlparse(url)
        if final.hostname != expected.hostname or (expected.hostname=='www.justwatch.com' and not final.path.startswith('/ca/movie/')):
            raise ValueError('Unexpected source redirect')
        return response.read(8_000_000).decode('utf-8')

def refresh_record(movie, previous, now, fetcher=fetch_page):
    try:
        offers, modified = extract_offers(fetcher(movie['url']), movie)
        return {'checkedAt':now, 'sourceUpdatedAt':modified, 'source':movie['source'], 'url':movie['url'], 'offers':offers}, True
    except Exception as error:
        return {**previous, 'attemptedAt':now, 'source':movie['source'], 'url':movie['url'], 'error':str(error), 'offers':previous.get('offers',[])}, False

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--only', nargs='*')
    args=parser.parse_args()
    movies=json.loads((ROOT/'data/movies.json').read_text())
    dest=ROOT/'data/availability.json'
    data=json.loads(dest.read_text()) if dest.exists() else {'country':'CA','movies':{}}
    now=dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
    selected=[m for m in movies if not args.only or m['id'] in args.only]
    if not selected: raise SystemExit('No matching films')
    passed=0
    for movie in selected:
        record,ok=refresh_record(movie,data['movies'].get(movie['id'],{}),now)
        data['movies'][movie['id']]=record
        passed+=ok
        print(f"{'OK' if ok else 'RECHECK'} {movie['id']}: {len(record['offers'])} offers" + ('' if ok else ' / '+record['error']),flush=True)
        time.sleep(0.4)
    data['lastRunAt']=now
    dest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(f'{passed}/{len(selected)} title pages checked successfully.')
    if passed == 0: raise SystemExit(1)

if __name__ == '__main__': main()
