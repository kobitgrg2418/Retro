"""Fetch candidate drink photos from Openverse (CC-licensed, auth-free).

Downloads via Openverse's own thumbnail proxy (reliable in this env) into
scripts/drink-candidates/ so we can eyeball them, then pick + whiten the
best for the menu. Prints title + license for attribution.
"""
import json
import os
import urllib.parse
import urllib.request

OUT = r"C:\Users\ACER NITRO\Desktop\Retro\scripts\drink-candidates"
os.makedirs(OUT, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"

QUERIES = {
    "tea": "masala chai tea cup",
    "limesoda": "lime soda glass drink",
    "beer": "beer glass lager",
    "rum": "glass of rum",
    "wine": "red wine glass",
    "whiskey": "whiskey glass",
}


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read() if binary else json.load(r)


def fetch(slug, term, n=4):
    q = urllib.parse.urlencode({
        "q": term, "page_size": "16",
        "license": "cc0,pdm,by,by-sa",
        "mature": "false",
    })
    data = get("https://api.openverse.org/v1/images/?" + q)
    got = 0
    for r in data.get("results", []):
        thumb = r.get("thumbnail") or r.get("url")
        if not thumb:
            continue
        dest = os.path.join(OUT, f"{slug}_{got}.jpg")
        try:
            blob = get(thumb, binary=True)
            if len(blob) < 2000:
                continue
            with open(dest, "wb") as f:
                f.write(blob)
            print(f"{slug}_{got}  [{r.get('license','?')}] {r.get('title','')[:50]}")
            got += 1
        except Exception as e:
            print("  skip:", str(e)[:60])
        if got >= n:
            break
    if got == 0:
        print(f"{slug}: NO candidates")


for slug, term in QUERIES.items():
    fetch(slug, term)
print("done")
