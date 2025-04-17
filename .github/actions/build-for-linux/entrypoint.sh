#!/bin/bash

wget https://nodejs.org/dist/v19.8.1/node-v19.8.1-linux-x64.tar.xz
tar -Jxvf ./node-v19.8.1-linux-x64.tar.xz
export PATH=$(pwd)/node-v19.8.1-linux-x64/bin:$PATH
npm install pnpm -g

rustup target add "$INPUT_TARGET"
rustup toolchain install --force-non-host "$INPUT_TOOLCHAIN"

# 安装通用依赖
apt-get update
apt-get install -y pkg-config openssl libssl-dev


# 安装 glib 依赖
sudo apt-get update
sudo dpkg --add-architecture amd64
sudo apt-get install -y libglib2.0-dev:amd64 libssl-dev:amd64 pkg-config:amd64
sudo apt-get install -y --reinstall glib-2.0-dev:amd64

echo "验证glib安装状态:"
dpkg -l | grep glib-2.0
echo "当前PKG_CONFIG_PATH配置:"
echo $PKG_CONFIG_PATH
pkg-config --modversion glib-2.0

if [ "$INPUT_TARGET" = "x86_64-unknown-linux-gnu" ]; then
    apt-get update
    apt-get install -y libglib2.0-dev libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev patchelf libxdo-dev libxcb1 libxrandr2 libdbus-1-3 libssl-dev
    export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:$PKG_CONFIG_PATH
    export PKG_CONFIG_ALLOW_SYSTEM_CFLAGS=1
elif [ "$INPUT_TARGET" = "i686-unknown-linux-gnu" ]; then
    dpkg --add-architecture i386
    apt-get update
    apt-get install -y libstdc++6:i386 libgdk-pixbuf2.0-dev:i386 libatomic1:i386 gcc-multilib g++-multilib libglib2.0-dev:i386 libwebkit2gtk-4.0-dev:i386 libssl-dev:i386 libgtk-3-dev:i386 librsvg2-dev:i386 patchelf:i386 libxdo-dev:i386 libxcb1:i386 libxrandr2:i386 libdbus-1-3:i386 libayatana-appindicator3-dev:i386
    export PKG_CONFIG_PATH=/usr/lib/i386-linux-gnu/pkgconfig/:$PKG_CONFIG_PATH
    export PKG_CONFIG_SYSROOT_DIR=/
    export PKG_CONFIG_ALLOW_SYSTEM_CFLAGS=1
elif [ "$INPUT_TARGET" = "aarch64-unknown-linux-gnu" ]; then
    dpkg --add-architecture arm64
    apt-get update
    apt-get install -y libncurses6:arm64 libtinfo6:arm64 linux-libc-dev:arm64 libncursesw6:arm64 libcups2:arm64
    apt-get install -y --no-install-recommends g++-aarch64-linux-gnu libc6-dev-arm64-cross libglib2.0-dev:arm64 libssl-dev:arm64 libwebkit2gtk-4.0-dev:arm64 libgtk-3-dev:arm64 patchelf:arm64 librsvg2-dev:arm64 libxdo-dev:arm64 libxcb1:arm64 libxrandr2:arm64 libdbus-1-3:arm64 libayatana-appindicator3-dev:arm64
    export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc
    export CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc
    export CXX_aarch64_unknown_linux_gnu=aarch64-linux-gnu-g++
    export PKG_CONFIG_PATH=/usr/lib/aarch64-linux-gnu/pkgconfig
    export PKG_CONFIG_ALLOW_CROSS=1
    export PKG_CONFIG_ALLOW_SYSTEM_CFLAGS=1
elif [ "$INPUT_TARGET" = "armv7-unknown-linux-gnueabihf" ]; then
    dpkg --add-architecture armhf
    apt-get update
    apt-get install -y libncurses6:armhf libtinfo6:armhf linux-libc-dev:armhf libncursesw6:armhf libcups2:armhf
    apt-get install -y --no-install-recommends g++-arm-linux-gnueabihf libc6-dev-armhf-cross libglib2.0-dev:armhf libssl-dev:armhf libwebkit2gtk-4.0-dev:armhf libgtk-3-dev:armhf patchelf:armhf librsvg2-dev:armhf libxdo-dev:armhf libxcb1:armhf libxrandr2:armhf libdbus-1-3:armhf libayatana-appindicator3-dev:armhf
    export CARGO_TARGET_ARMV7_UNKNOWN_LINUX_GNUEABIHF_LINKER=arm-linux-gnueabihf-gcc
    export CC_armv7_unknown_linux_gnueabihf=arm-linux-gnueabihf-gcc
    export CXX_armv7_unknown_linux_gnueabihf=arm-linux-gnueabihf-g++
    export PKG_CONFIG_PATH=/usr/lib/arm-linux-gnueabihf/pkgconfig
    export PKG_CONFIG_ALLOW_CROSS=1
    export PKG_CONFIG_ALLOW_SYSTEM_CFLAGS=1
else
    echo "Unknown target: $INPUT_TARGET" && exit 1
fi

bash .github/actions/build.sh
# 如果上面的路径不正确，尝试使用相对路径
if [ ! -f .github/actions/build.sh ]; then
    echo "找不到build.sh，尝试其他路径"
    # 尝试在当前目录查找
    if [ -f build.sh ]; then
        bash build.sh
    # 尝试在父目录查找
    elif [ -f ../build.sh ]; then
        bash ../build.sh
    else
        echo "无法找到build.sh文件，构建失败"
        exit 1
    fi
fi