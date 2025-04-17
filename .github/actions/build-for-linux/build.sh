#!/bin/bash
set -e

# 安装 glib 依赖
sudo apt-get update
sudo apt-get install -y glib-2.0-dev

# pnpm install --resolution-only
pnpm install
if [ "$INPUT_TARGET" = "x86_64-unknown-linux-gnu" ]; then
    pnpm tauri build --target $INPUT_TARGET
else
    pnpm tauri build --target $INPUT_TARGET -b deb rpm
fi