# Demo Media Workflow

Local-only workflow for converting raw screen recordings into README-ready GIFs using ffmpeg.

## Directory structure

```
media/
  raw/          ← place raw .mov / .mp4 screen recordings here (gitignored)
  mp4/          ← normalized MP4 outputs (gitignored)
  gif/          ← optimized GIFs for the README (committed to git)
  images/       ← extension icon and other static images
```

## Prerequisites

Install ffmpeg if you don't already have it:

```sh
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg
```

## Running the script

From the repo root:

```sh
# directly
./scripts/generate-demo-media.sh

# or via npm
npm run demo-media
```

The script:

1. Scans `media/raw/` for `.mov` and `.mp4` files.
2. Generates a normalized MP4 in `media/mp4/` (same base filename).
3. Generates an optimized GIF in `media/gif/` using ffmpeg's two-pass `palettegen` / `paletteuse` pipeline.
4. Overwrites existing outputs on rerun — safe to run repeatedly.
5. Does **not** delete raw files.

## Tuning

Open [scripts/generate-demo-media.sh](../scripts/generate-demo-media.sh) and edit the variables at the top:

| Variable    | Default | Notes                                   |
| ----------- | ------- | --------------------------------------- |
| `GIF_FPS`   | 12      | Frames per second (10–12 is ideal)      |
| `GIF_WIDTH` | 960     | Max width in pixels, height auto-scales |
| `MP4_CRF`   | 23      | H.264 quality factor (lower = bigger)   |

## Referencing GIFs in the README

Use a relative path from the repo root:

```markdown
![Status bar demo](media/gif/status_bar.gif)
```

## What gets committed?

| Path          | Tracked in git? |
| ------------- | --------------- |
| `media/raw/*` | No (gitignored) |
| `media/mp4/*` | No (gitignored) |
| `media/gif/*` | **Yes**         |

Raw recordings and intermediate MP4s are large and reproducible, so they stay local.
Only the final GIFs — small and directly referenced by the README — are committed.
