#!/usr/bin/env node
/**
 * Prepares the fan-concept media.
 *
 *   npm run media
 *
 * Sources live in media-src/ (not committed):
 *   covers/*.png      album covers, AI-upscaled (Real-ESRGAN) from the originals
 *   statue.png        the M$NEY cover, AI-upscaled to 2048
 *   face.png          the studio portrait, cropped so its eyes, nose and mouth
 *                     sit exactly on the statue's, AI-upscaled to 2048
 *   photos/*.jpg      live and editorial photos
 *   walk.mp4          the stage walk-out (phone screen recording)
 *   live.mov          the M$NEY Live promo
 *
 * Writes public/media/ and public/img/.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpeg from 'ffmpeg-static'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = (p) => resolve(root, 'media-src', p)
const media = resolve(root, 'public/media')
const img = resolve(root, 'public/img')
mkdirSync(media, { recursive: true })
mkdirSync(img, { recursive: true })

const run = (args) => {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// --- The statue and the face: two sizes each, identical framing. ---------------
for (const name of ['statue', 'face']) {
  for (const [suffix, size] of [['', 2048], ['-m', 1024]]) {
    await sharp(src(`${name}.png`)).resize(size, size).webp({ quality: 86 }).toFile(`${img}/${name}${suffix}.webp`)
  }
  console.log(`→ ${name}`)
}

// --- Covers and photos. ---------------------------------------------------------
for (const f of readdirSync(src('covers'))) {
  await sharp(src(`covers/${f}`)).resize(1200, 1200).webp({ quality: 84 }).toFile(`${img}/cover-${basename(f, extname(f))}.webp`)
  console.log(`→ cover ${f}`)
}
for (const f of readdirSync(src('photos'))) {
  await sharp(src(`photos/${f}`)).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${img}/${basename(f, extname(f))}.webp`)
  console.log(`→ photo ${f}`)
}

// --- Video. -----------------------------------------------------------------------
// The walk-out is scrubbed by scroll: keyframe every 12 frames, no B-frames.
// The screen recording's status bar (top) and black band (bottom) are cropped off.
const scrub = ['-an', '-r', '24', '-g', '12', '-bf', '0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
const WALK = 'crop=1204:2400:43:176,scale=720:-2:flags=lanczos'
run(['-i', src('walk.mp4'), '-vf', WALK, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', ...scrub, `${media}/walk.mp4`])
run(['-i', src('walk.mp4'), '-vf', WALK, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-an', '-r', '24', '-g', '12', `${media}/walk.webm`])
run(['-ss', '0.2', '-i', src('walk.mp4'), '-frames:v', '1', '-vf', WALK, '-q:v', '4', `${media}/walk.jpg`])
console.log('→ walk')

// The live promo loops on its own. Its audio is his music, so it ships silent.
const LIVE = 'scale=960:960:flags=lanczos'
run(['-i', src('live.mov'), '-vf', LIVE, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-an', '-r', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${media}/live.mp4`])
run(['-i', src('live.mov'), '-vf', LIVE, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-an', '-r', '30', `${media}/live.webm`])
run(['-ss', '3', '-i', src('live.mov'), '-frames:v', '1', '-vf', LIVE, '-q:v', '4', `${media}/live.jpg`])
console.log('→ live')
