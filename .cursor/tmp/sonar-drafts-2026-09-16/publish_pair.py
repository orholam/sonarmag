#!/usr/bin/env python3
"""Insert the 2026-09-16 Sonar article pair into Supabase.

Requires SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) plus
PUBLIC_SUPABASE_URL (defaults to the live project). Anon inserts fail RLS.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECT_URL = os.environ.get(
    "PUBLIC_SUPABASE_URL", "https://igrhfqirkbvxbvilfoca.supabase.co"
).rstrip("/")
SERVICE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_SECRET_KEY")
    or ""
)


def load(name: str) -> dict:
    return json.loads((ROOT / name).read_text())


def post_article(row: dict) -> tuple[int, str]:
    url = f"{PROJECT_URL}/rest/v1/articles"
    body = json.dumps(row).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def main() -> int:
    if not SERVICE_KEY:
        print(
            "Missing SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY",
            file=sys.stderr,
        )
        return 2

    rows = [load("article-a.json"), load("article-b.json")]
    # Drop helper note fields if any
    for row in rows:
        row.pop("note", None)

    ok = True
    for row in rows:
        status, text = post_article(row)
        print(f"{row['slug']}: HTTP {status}")
        print(text[:500])
        if status not in (200, 201):
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
