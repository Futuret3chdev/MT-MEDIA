#!/bin/sh
set -e
ORIGIN="${MT_API:-https://memetorrent.futuret3ch.com.au}"
DEST="${1:-$HOME/.local/bin/mt}"
DIR=$(dirname "$DEST")
mkdir -p "$DIR"
curl -fsSL "$ORIGIN/cli/mt.js" -o "$DEST"
chmod +x "$DEST"
echo "Installed $DEST"
echo "Try: mt quotes"
