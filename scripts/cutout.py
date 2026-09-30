"""
Cuts Asake out of every frame of the walk-out (rembg, u2net_human_seg), cleans
the matte, then re-centres and re-scales him so he turns in place: the camera
arcs around him in the source, so scrubbing the cut-out reads like a model
turning on a turntable.
"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 560, 1000          # output frame
FIG_H = 900               # his height in the output frame
os.makedirs(OUT, exist_ok=True)
s = new_session('u2net_human_seg')
files = sorted(glob.glob(f'{SRC}/*.png'))[:140]  # after ~9 s he walks out of the bottom of frame

mattes, boxes = [], []
for f in files:
    im = Image.open(f).convert('RGB')
    a = np.array(remove(im, session=s, only_mask=True)).astype(np.float32) / 255
    rgb = np.array(im).astype(np.float32)
    luma = rgb @ [0.299, 0.587, 0.114]
    # Keep the largest blob (him), drop specks.
    lab, n = ndimage.label(a > 0.5)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
        keep = lab == (1 + int(np.argmax(sizes)))
        keep = ndimage.binary_dilation(keep, iterations=3)
        a = a * keep
    ys, xs = np.nonzero(a > 0.5)
    mattes.append((im, a))
    if len(ys):
        x0, x1 = xs.min(), xs.max()
        # Head top from the middle columns only, so a raised arm doesn't count as height.
        mid = a[:, int(x0 + (x1 - x0) * 0.3):int(x0 + (x1 - x0) * 0.7) + 1] > 0.5
        rows = np.nonzero(mid.any(1))[0]
        boxes.append((x0, rows.min() if len(rows) else ys.min(), x1, ys.max()))
    else:
        boxes.append(boxes[-1])
    print('matte', os.path.basename(f), flush=True)

# Smooth the framing over time so re-centring doesn't jitter.
b = np.array(boxes, np.float32)
k = 9
pad = np.pad(b, ((k, k), (0, 0)), mode='edge')
smooth = np.stack([pad[i:i + 2 * k + 1].mean(0) for i in range(len(b))])
for i, ((im, a), (x0, y0, x1, y1)) in enumerate(zip(mattes, smooth)):
    rgba = np.dstack([np.array(im), (a * 255).astype(np.uint8)])
    fig = Image.fromarray(rgba, 'RGBA')
    scale = FIG_H / max(1, (y1 - y0))
    fig = fig.resize((round(fig.width * scale), round(fig.height * scale)), Image.LANCZOS)
    cx, top = (x0 + x1) / 2 * scale, y0 * scale
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(fig, (round(W / 2 - cx), round((H - FIG_H) / 2 - top)))
    canvas.save(f'{OUT}/{i + 1:04d}.png')
print('done', len(mattes))
