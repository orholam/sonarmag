#!/usr/bin/env python3
"""Publish the 2026-09-15 Sonar article pair to Supabase.

Requires SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY with service role).
Anon key will fail RLS.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
URL = os.environ.get("SUPABASE_URL", "https://igrhfqirkbvxbvilfoca.supabase.co").rstrip("/")
KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_SERVICE_KEY")
    or os.environ.get("SUPABASE_KEY")
)


def post(path: str, payload: dict) -> tuple[int, str]:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{URL}{path}",
        data=data,
        method="POST",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main() -> int:
    if not KEY:
        print("MISSING SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        return 2
    # Refuse anon JWT by role claim when possible
    try:
        import base64

        payload = KEY.split(".")[1] + "=="
        role = json.loads(base64.urlsafe_b64decode(payload)).get("role")
        if role and role != "service_role":
            print(f"Refusing key with role={role}; need service_role", file=sys.stderr)
            return 2
    except Exception:
        pass

    for name in ("article-a.json", "article-b.json"):
        row = json.loads((ROOT / name).read_text())
        status, body = post("/rest/v1/articles", row)
        print(name, status, body[:500])
        if status not in (200, 201):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
