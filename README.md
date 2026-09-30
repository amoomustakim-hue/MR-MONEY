# ASAKE — M$NEY (unofficial fan concept)

From stone to man. The M$NEY cover — Asake carved as a marble relief — breaks
apart under your scroll and the real man is underneath, lined up eye for eye.

> Unofficial fan concept. Not affiliated with Asake, YBNL, Giran Republic or
> EMPIRE. All imagery and music © their owners. Non-commercial; no music is
> hosted here — "Listen" links go to Spotify.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
```

## The page

| # | Section | What happens |
| --- | --- | --- |
| — | The stone | Pinned. A WebGL shader cracks the M$NEY relief into Voronoi shards from the eyes outward; they drop away to reveal the studio portrait. Live photos float around it at their own depths. |
| 01 | The man | A dense editorial column on deep blue, the white-tee portrait opening like a shutter. |
| 02 | The sound | FUJI ——— AMAPIANO, then LAGOS ——— WORLDWIDE: the lime line draws itself and photos land on it. |
| 03 | The walk-out | The stage clip in a portrait frame, scrubbed by scroll, between outlined WALK / OUT. |
| 04 | The records | Five covers on a white wall; choosing one turns the panel its colour and shows the tracklist. |
| 05 | On stage | The M$NEY Live promo, looping silently, with the name in carved capitals. |
| 06 | Signature | The portrait, a last line, the name signed across it. |

Design reference: the "3D statue" athlete site format — royal blue, marble,
a faint grid, a stacked name and a MENU pill in the corner.

## How the statue works

`src/gl/statue.ts` is one fragment shader over two real images: the M$NEY
cover and a studio portrait cropped so its eyes, nose and mouth sit exactly on
the carving's. There is no generated likeness — only the cracks, shading and
dust are procedural. Without WebGL 2 the cover shows as a still.

## Media

`npm run media` builds `public/` from `media-src/` (not committed): covers and
the two hero images were AI-upscaled with Real-ESRGAN first; photos become WebP;
the walk-out is cropped out of its screen recording and encoded for scrubbing
(12-frame GOP, no B-frames); the live promo ships without its audio.
