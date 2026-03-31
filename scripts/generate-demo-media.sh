#!/usr/bin/env bash
#
# generate-demo-media.sh
# Converts raw screen recordings into optimized MP4s and GIFs for the README.
#
# Usage:  ./scripts/generate-demo-media.sh        (from repo root)
#         npm run demo-media                       (via npm alias)
#
# Place raw recordings (.mov or .mp4) in media/raw/.
# Outputs land in media/mp4/ and media/gif/.
#
# This is a local authoring utility — not used in CI/CD.
# ──────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Tunables ──────────────────────────────────────────────────────────
# Adjust these to taste. Width is in pixels; height is auto-scaled.
GIF_FPS=12          # Frames per second for GIFs (10-12 is good for README demos)
GIF_WIDTH=960       # Max width in pixels (height scales proportionally)
MP4_CRF=23          # Constant rate factor for MP4 (lower = higher quality, 18-28 is sane)
# ─────────────────────────────────────────────────────────────────────

RAW_DIR="media/raw"
MP4_DIR="media/mp4"
GIF_DIR="media/gif"

# ── Preflight checks ─────────────────────────────────────────────────

if ! command -v ffmpeg &>/dev/null; then
  echo "❌  ffmpeg is not installed."
  echo ""
  echo "Install it with one of:"
  echo "  macOS:   brew install ffmpeg"
  echo "  Ubuntu:  sudo apt install ffmpeg"
  echo "  Windows: choco install ffmpeg   (or download from https://ffmpeg.org)"
  echo ""
  exit 1
fi

# ── Collect input files ──────────────────────────────────────────────

shopt -s nullglob
INPUT_FILES=("$RAW_DIR"/*.mov "$RAW_DIR"/*.mp4)
shopt -u nullglob

if [ ${#INPUT_FILES[@]} -eq 0 ]; then
  echo "ℹ️  No .mov or .mp4 files found in $RAW_DIR — nothing to do."
  exit 0
fi

# ── Ensure output directories exist ─────────────────────────────────

mkdir -p "$MP4_DIR" "$GIF_DIR"

# ── Process each recording ───────────────────────────────────────────

for src in "${INPUT_FILES[@]}"; do
  basename="$(basename "$src")"
  stem="${basename%.*}"

  mp4_out="$MP4_DIR/${stem}.mp4"
  gif_out="$GIF_DIR/${stem}.gif"

  echo "──────────────────────────────────────────────"
  echo "🎬  Processing: $basename"
  echo ""

  # ── 1. Normalized MP4 ──────────────────────────────────────────────
  # Re-encode to H.264 with yuv420p for broad compatibility.
  # -movflags +faststart enables progressive web playback.
  echo "   → MP4: $mp4_out"
  ffmpeg -y -i "$src" \
    -c:v libx264 -preset medium -crf "$MP4_CRF" \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    "$mp4_out" \
    2>/dev/null

  # ── 2. Optimized GIF (two-pass palettegen/paletteuse) ─────────────
  # Pass 1: generate an optimal 256-color palette from the source.
  # Pass 2: encode the GIF using that palette for much better quality
  #          than a naive single-pass conversion.
  echo "   → GIF: $gif_out"

  PALETTE=$(mktemp /tmp/palette-XXXXXX.png)
  trap 'rm -f "$PALETTE"' EXIT

  FILTERS="fps=${GIF_FPS},scale=${GIF_WIDTH}:-1:flags=lanczos"

  # Pass 1 — palette
  ffmpeg -y -i "$src" \
    -vf "${FILTERS},palettegen=stats_mode=diff" \
    "$PALETTE" \
    2>/dev/null

  # Pass 2 — GIF with palette
  ffmpeg -y -i "$src" -i "$PALETTE" \
    -lavfi "${FILTERS} [x]; [x][1:v] paletteuse=dither=floyd_steinberg" \
    "$gif_out" \
    2>/dev/null

  rm -f "$PALETTE"

  echo "   ✅  Done"
  echo ""
done

echo "══════════════════════════════════════════════"
echo "✅  All files processed."
echo "   MP4s → $MP4_DIR/"
echo "   GIFs → $GIF_DIR/"
echo ""
echo "Reference a GIF in the README like:"
echo '   ![Demo](docs/media/gif/your-file.gif)'
