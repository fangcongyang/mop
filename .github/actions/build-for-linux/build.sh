#!/bin/bash
set -e

# 安装 glib 依赖
sudo apt-get update
sudo apt-get install -y glib-2.0-dev libssl-dev pkg-config --reinstall
sudo apt-get install -y libglib2.0-dev

export PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/lib/x86_64-linux-gnu/pkgconfig:${PKG_CONFIG_PATH}"

export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:$PKG_CONFIG_PATH

# pnpm install --resolution-only
pnpm install
if [ "$INPUT_TARGET" = "x86_64-unknown-linux-gnu" ]; then
    pnpm tauri build --target $INPUT_TARGET
else
    pnpm tauri build --target $INPUT_TARGET -b deb rpm
fi