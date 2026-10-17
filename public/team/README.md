# Team assets

Replace these placeholders (keep the filenames, or update paths in `src/content.ts`):

| File | What | Size tip |
|---|---|---|
| `sumaiya.svg` | Sumaiya's photo | square, 512x512 .webp or .jpg, under 80 KB |
| `ahmed.svg` | Ahmed's photo | square, 512x512 .webp or .jpg, under 80 KB |
| `rafay.svg` | Abdul Rafay's photo | square, 512x512 .webp or .jpg, under 80 KB |
| `ahmed-intro.mp4` | Ahmed's 15 sec intro, vertical 9:16 | 720x1280, H.264, no audio needed, under 2 MB |
| `ahmed-intro-poster.svg` | First frame of the video | 720x1280 .webp, under 60 KB |

If you switch to .jpg/.webp, update the paths in `src/content.ts`.

Compress the video for slow mobile data:

```bash
ffmpeg -i raw.mp4 -vf "scale=720:-2" -c:v libx264 -crf 30 -preset slow -an -movflags +faststart ahmed-intro.mp4
```
