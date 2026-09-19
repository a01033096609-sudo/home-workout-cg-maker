#!/usr/bin/env bash
set -euo pipefail
EXPECTED="e7627516856f398ace1000ae98c117f514817c4ef523dcfba3b489ae68a0c6bd"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cat bundle-xz/app.xz.b64.part.* | tr -d '\r\n' | base64 -d > "$TMP/app.tar.xz"
ACTUAL="$(sha256sum "$TMP/app.tar.xz" | awk '{print $1}')"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "Source bundle checksum mismatch: $ACTUAL" >&2
  exit 23
fi
tar -xJf "$TMP/app.tar.xz" -C .
node restore-baseline.mjs
echo "Source bundle restored: $ACTUAL"
echo "Female instructor baseline restored."
