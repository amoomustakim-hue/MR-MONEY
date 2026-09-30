"""
The walking cut-out for the eras section.

1. Mattes: BiRefNet (rembg `birefnet-general-lite`) on the full-resolution
   frames — sharp edges, and unlike the lighter person models it leaves the
   black stage monitor at his feet out of the matte.
2. Compose (this script): keep the largest shape, anchor him by his head so
   he walks on the spot (an outstretched arm must not shift his body), scale
   him to a steady height, and write RGBA frames. With Real-ESRGAN weights,
   the figure is AI-upscaled 4x first, so enlarging him restores detail
   instead of stretching compression blocks.

    python scripts/cutout.py <frames-dir> <mattes-dir> <out-dir> [realesr-general-x4v3.pth]

Frames: the first ~6 s of the stage clip at 20 fps, cropped out of the screen
recording (crop=1204:2400:43:176).
"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC, MATTES, OUT = sys.argv[1:4]
WEIGHTS = sys.argv[4] if len(sys.argv) > 4 else None
W, H = 900, 1200     # output frame
FIG_H = 1060         # head-to-toe height in the output
os.makedirs(OUT, exist_ok=True)

upscale = None
if WEIGHTS:
    import torch, torch.nn as nn, torch.nn.functional as F

    class SRVGGNetCompact(nn.Module):
        def __init__(self, feat=64, convs=32, scale=4):
            super().__init__()
            self.scale = scale
            body = [nn.Conv2d(3, feat, 3, 1, 1), nn.PReLU(feat)]
            for _ in range(convs):
                body += [nn.Conv2d(feat, feat, 3, 1, 1), nn.PReLU(feat)]
            body += [nn.Conv2d(feat, 3 * scale * scale, 3, 1, 1)]
            self.body = nn.Sequential(*body)
            self.shuffle = nn.PixelShuffle(scale)

        def forward(self, x):
            return self.shuffle(self.body(x)) + F.interpolate(x, scale_factor=self.scale, mode='nearest')

    torch.set_num_threads(os.cpu_count())
    net = SRVGGNetCompact()
    st = torch.load(WEIGHTS, map_location='cpu', weights_only=True)
    net.load_state_dict(st.get('params', st))
    net.eval()

    def upscale(rgb):
        with torch.inference_mode():
            x = torch.from_numpy(rgb).permute(2, 0, 1)[None].float() / 255
            return net(x).clamp(0, 1)[0].permute(1, 2, 0).mul(255).round().byte().numpy()

names = sorted(os.path.basename(p) for p in glob.glob(f'{MATTES}/*.png'))
alphas, anchors = [], []
for n in names:
    a = np.array(Image.open(f'{MATTES}/{n}').convert('L')).astype(np.float32) / 255
    lab, k = ndimage.label(a > 0.4)
    if k > 1:
        sizes = ndimage.sum(np.ones_like(a), lab, range(1, k + 1))
        keep = ndimage.binary_dilation(lab == 1 + int(np.argmax(sizes)), iterations=4)
        a *= keep
    ys, xs = np.nonzero(a > 0.5)
    top, bot = ys.min(), ys.max()
    # Anchor on the head (top 11% of the figure), not the whole outline.
    head = a[top:top + int((bot - top) * 0.11)] > 0.5
    hx = np.nonzero(head.any(0))[0]
    cx = (hx.min() + hx.max()) / 2 if len(hx) else (xs.min() + xs.max()) / 2
    # Where he runs off the side of the source frame, fade him out rather than
    # cutting him with a hard vertical line.
    ramp = np.clip(np.minimum(np.arange(a.shape[1]), a.shape[1] - 1 - np.arange(a.shape[1])) / 60, 0, 1)
    a *= ramp[None, :]
    alphas.append(a)
    anchors.append((cx, top, bot))

# Smooth the anchors over time — steady, but still following his real movement.
A = np.array(anchors, np.float32)
k = 4
pad = np.pad(A, ((k, k), (0, 0)), mode='edge')
S = np.stack([pad[i:i + 2 * k + 1].mean(0) for i in range(len(A))])

for n, a, (cx, top, bot) in zip(names, alphas, S):
    rgb = np.array(Image.open(f'{SRC}/{n}').convert('RGB'))
    # Work on a crop around him only: that is what gets upscaled.
    ys, xs = np.nonzero(a > 0.02)
    m = 24
    x0, x1 = max(0, xs.min() - m), min(a.shape[1], xs.max() + m)
    y0, y1 = max(0, ys.min() - m), min(a.shape[0], ys.max() + m)
    crop_rgb, crop_a = rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]
    f = 1
    if upscale:
        crop_rgb, f = upscale(np.ascontiguousarray(crop_rgb)), 4
    alpha = Image.fromarray((crop_a * 255).astype(np.uint8)).resize((crop_rgb.shape[1], crop_rgb.shape[0]), Image.LANCZOS)
    # A hair of softening on the matte edge so it sits in the scene, not on it.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6 * f))
    fig = Image.fromarray(np.dstack([crop_rgb, np.array(alpha)]), 'RGBA')
    scale = FIG_H / max(1.0, bot - top)          # source pixels -> output pixels
    s2 = scale / f                                # crop pixels -> output pixels
    fig = fig.resize((max(1, round(fig.width * s2)), max(1, round(fig.height * s2))), Image.LANCZOS)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ox = round(W / 2 - (cx - x0) * scale)
    oy = round((H - FIG_H) / 2 - (top - y0) * scale)
    out.alpha_composite(fig, (ox, oy)) if ox >= 0 and oy >= 0 else out.paste(fig, (ox, oy), fig)
    out.save(f'{OUT}/{n}')
    print('frame', n, flush=True)
print('frames', len(names))
