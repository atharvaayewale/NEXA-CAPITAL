#!/bin/bash
# Rebuilds the throwaway headless-browser tooling that /tmp loses on every refresh:
#   /tmp/chromium     headless Chromium binary
#   /tmp/fake/*.so    NSS/NSPR stub libraries it needs in this image
#   /tmp/shot, /tmp/img  node_modules for puppeteer-core and sharp
# Usage: bash tools/devkit/setup.sh   (run from the repo root)
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p /tmp/shot /tmp/fake /tmp/img
if [ ! -d /tmp/shot/node_modules/puppeteer-core ]; then
  (cd /tmp/shot && npm init -y >/dev/null 2>&1 && npm i puppeteer-core @sparticuz/chromium >/dev/null 2>&1)
fi
if [ ! -x /tmp/chromium ]; then
  node -e "
  const fs=require('fs'),zlib=require('zlib');
  fs.createReadStream('/tmp/shot/node_modules/@sparticuz/chromium/bin/chromium.br')
    .pipe(zlib.createBrotliDecompress()).pipe(fs.createWriteStream('/tmp/chromium'))
    .on('finish',()=>{fs.chmodSync('/tmp/chromium',0o755);console.log('chromium extracted');});
  "
fi
if [ ! -d /tmp/img/node_modules/sharp ]; then (cd /tmp/img && npm init -y >/dev/null 2>&1 && npm i sharp >/dev/null 2>&1); fi
cp "$REPO/tools/devkit/stub.c" /tmp/fake/stub.c
cd /tmp/fake
for i in $(seq 1 90); do
  gcc -shared -fPIC -o libnspr4.so stub.c 2>/dev/null
  gcc -shared -fPIC -o libnss3.so stub.c 2>/dev/null
  gcc -shared -fPIC -o libnssutil3.so stub.c 2>/dev/null
  out=$(LD_LIBRARY_PATH=/tmp/fake /tmp/chromium --version 2>&1) || true
  sym=$(echo "$out" | grep -oP "undefined symbol: \K[A-Za-z0-9_]+" | head -1)
  if [ -z "$sym" ]; then echo "chromium ready: $(echo "$out" | tail -1)"; break; fi
  printf 'S(%s)\n' "$sym" >> stub.c
done
echo "tooling ready"
