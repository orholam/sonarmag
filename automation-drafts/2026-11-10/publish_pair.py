#!/usr/bin/env python3
"""Insert the Nov 10 Sonar article pair. Requires SUPABASE_SERVICE_ROLE_KEY."""
import json, os, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent
URL = os.environ.get('PUBLIC_SUPABASE_URL', 'https://igrhfqirkbvxbvilfoca.supabase.co').rstrip('/')
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SERVICE_KEY')
if not KEY:
    print('Missing SUPABASE_SERVICE_ROLE_KEY', file=sys.stderr)
    sys.exit(2)

def load(name):
    row = json.loads((ROOT / name).read_text())
    row.pop('title_mode', None)
    # drop null highlight fields for companion
    if row.get('highlight_word') is None:
        row.pop('highlight_word', None)
        row.pop('highlight_tone', None)
    return row

def post(row):
    data = json.dumps(row).encode()
    req = urllib.request.Request(
        f'{URL}/rest/v1/articles',
        data=data,
        headers={
            'apikey': KEY,
            'Authorization': f'Bearer {KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode()
            print(resp.status, body[:500])
            return True
    except urllib.error.HTTPError as e:
        print(e.code, e.read().decode()[:1000], file=sys.stderr)
        return False

ok = True
for name in ('article-a.json', 'article-b.json'):
    print('Inserting', name)
    ok = post(load(name)) and ok
sys.exit(0 if ok else 1)
