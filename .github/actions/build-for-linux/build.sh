#!/bin/bash
set -e

# 安装 glib 依赖
sudo apt-get update
sudo dpkg --add-architecture amd64
sudo apt-get update
sudo apt-get install -y libglib2.0-dev:amd64 libssl-dev:amd64 pkg-config:amd64
sudo apt-get install -y --reinstall glib-2.0-dev:amd64

echo "验证glib安装状态:"
dpkg -l | grep glib-2.0
echo "当前PKG_CONFIG_PATH配置:"
echo $PKG_CONFIG_PATH
pkg-config --modversion glib-2.0

export PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/lib/x86_64-linux-gnu/pkgconfig:${PKG_CONFIG_PATH}"

export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:$PKG_CONFIG_PATH

# pnpm install --resolution-only
pnpm install
if [ "$INPUT_TARGET" = "x86_64-unknown-linux-gnu" ]; then
    pnpm tauri build --target $INPUT_TARGET
else
    pnpm tauri build --target $INPUT_TARGET -b deb rpm
fi