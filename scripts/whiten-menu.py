"""Normalize all menu photos to a pure-white background.

Studio shots came on a light grey backdrop which looks like a dirty box
against the white UI. We flood the border-connected background region
(pixels within a colour distance of the median border colour) to pure
white, leaving the dish and its soft contact shadow untouched. Originals
are backed up to public/menu/_orig the first time this runs.
"""
import os
import shutil
from collections import deque

import numpy as np
from PIL import Image

SRC = r"C:\Users\ACER NITRO\Desktop\Retro\packages\client\public\menu"
BACKUP = os.path.join(SRC, "_orig")
TH = 34  # colour distance from background to count as background

os.makedirs(BACKUP, exist_ok=True)
files = sorted(f for f in os.listdir(SRC) if f.lower().endswith((".jpg", ".jpeg", ".png")))

# Back up originals once, then always process from the backup.
for f in files:
    b = os.path.join(BACKUP, f)
    if not os.path.exists(b):
        shutil.copy2(os.path.join(SRC, f), b)


def whiten(src_path, out_path, th=TH):
    im = Image.open(src_path).convert("RGB")
    arr = np.asarray(im).astype(np.int16)
    h, w, _ = arr.shape

    border = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((arr - bg) ** 2).sum(axis=2))
    mask = dist < th  # candidate background pixels

    # Keep only the background region connected to the image border, so
    # light foods in the centre (rice, etc.) are never erased.
    visited = np.zeros((h, w), dtype=bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if mask[y, x] and not visited[y, x]:
                visited[y, x] = True
                dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if mask[y, x] and not visited[y, x]:
                visited[y, x] = True
                dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        if y > 0 and mask[y - 1, x] and not visited[y - 1, x]:
            visited[y - 1, x] = True; dq.append((y - 1, x))
        if y < h - 1 and mask[y + 1, x] and not visited[y + 1, x]:
            visited[y + 1, x] = True; dq.append((y + 1, x))
        if x > 0 and mask[y, x - 1] and not visited[y, x - 1]:
            visited[y, x - 1] = True; dq.append((y, x - 1))
        if x < w - 1 and mask[y, x + 1] and not visited[y, x + 1]:
            visited[y, x + 1] = True; dq.append((y, x + 1))

    out = arr.copy()
    out[visited] = [255, 255, 255]
    changed = int(visited.sum())
    pct = 100.0 * changed / (h * w)
    Image.fromarray(out.astype(np.uint8)).save(out_path, "JPEG", quality=92)
    return pct


for f in files:
    pct = whiten(os.path.join(BACKUP, f), os.path.join(SRC, f))
    print(f"{f:16s} -> {pct:5.1f}% whitened")
print("done", len(files))
