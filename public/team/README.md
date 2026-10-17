# Team assets

Replace these placeholders (keep the filenames, or update paths in `src/content.ts`):

| File | What | Size tip |
|---|---|---|
| `sumaiya.jpg` | Sumaiya's photo (done) | 512x512 |
| `ahmed.jpg` | Ahmed's chat avatar (done, from the elections site) | square headshot |
| `ahmed-card.jpg` | Ahmed's "Your Guide" council card portrait (done) | 640x640 |
| `rafay.jpg` | Abdul Rafay's photo (done) | 512x512 |
| `ahmed-intro.mp4` | Ahmed's 15 sec intro, vertical 9:16 | 720x1280, H.264, no audio needed, under 2 MB |
| `ahmed-intro-poster.jpg` | Video poster (done: Ahmed speaking at AU, cropped 9:16) | 360x640 |

If you switch to .jpg/.webp, update the paths in `src/content.ts`.

Compress the video for slow mobile data:

```bash
ffmpeg -i raw.mp4 -vf "scale=720:-2" -c:v libx264 -crf 30 -preset slow -an -movflags +faststart ahmed-intro.mp4
```
