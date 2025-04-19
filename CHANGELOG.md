## [0.1.2](https://github.com/fangcongyang/mop/compare/0.1.1...0.1.2) (2025-04-19)


### ♻ Code Refactoring | 代码重构

* 优化更新模块和UI样式 ([](https://github.com/fangcongyang/mop/commit/87fec0f))
* **release:** 移除updater脚本并优化发布流程 ([](https://github.com/fangcongyang/mop/commit/8e1169a))


### ✨ Features | 新功能

* 更新版本至0.1.2并添加更新功能 ([](https://github.com/fangcongyang/mop/commit/6e067be))
* **更新:** 添加更新功能及相关组件 ([](https://github.com/fangcongyang/mop/commit/1da4d59))



# [0.1.0](https://github.com/fangcongyang/mop/compare/0.0.51...0.1.0) (2025-04-18)


### ♻ Code Refactoring | 代码重构

* **changelog:** 避免直接修改commit对象以增强代码健壮性 ([](https://github.com/fangcongyang/mop/commit/94a019c))


### ✨ Features | 新功能

* 添加自动更新功能并配置相关依赖 ([](https://github.com/fangcongyang/mop/commit/d476f8f))


### 🎫 Chores | 其他更新

* 更新changelog生成命令并整理CHANGELOG.md ([](https://github.com/fangcongyang/mop/commit/fca68db))
* 添加 @actions/github 依赖并移除不再使用的依赖 ([](https://github.com/fangcongyang/mop/commit/8a6e1fa))


### 📝 Documentation | 文档

* 更新CHANGELOG.md文件中的版本信息 ([](https://github.com/fangcongyang/mop/commit/b5b8785))


### 🔧 Continuous Integration | CI 配置

* 更新 release.yml 以修复 Windows 平台的目标架构配置 ([](https://github.com/fangcongyang/mop/commit/730673b))
* 在 release.yml 中禁用 pnpm 的 frozen-lockfile 选项 ([](https://github.com/fangcongyang/mop/commit/75091ed))
* **workflow:** 简化release.yml中的targets条件表达式 ([](https://github.com/fangcongyang/mop/commit/431c840))
* **workflows:** 更新release.yml中的目标平台条件 ([](https://github.com/fangcongyang/mop/commit/f56e28d))
* **workflows:** 将发布流程中的草稿和预发布设置修改为直接发布预发布版本 ([](https://github.com/fangcongyang/mop/commit/152d5d5))



## [0.0.51](https://github.com/fangcongyang/mop/compare/0.0.50...0.0.51) (2025-04-18)


### 🔧 Continuous Integration | CI 配置

* **workflows:** 更新Windows平台的OpenSSL安装脚本 ([](https://github.com/fangcongyang/mop/commit/a037bcb))



## [0.0.50](https://github.com/fangcongyang/mop/compare/6dcc75e...0.0.50) (2025-04-17)


* refactor()： 移除获取应用配置。 ([](https://github.com/fangcongyang/mop/commit/bac2ff3))
* feat():增加系统菜单图标 ([](https://github.com/fangcongyang/mop/commit/af86d49))
* 完善翻译 ([](https://github.com/fangcongyang/mop/commit/7e767d0))
* 代码优化提交 ([](https://github.com/fangcongyang/mop/commit/0a7a575))
* mop代码优化提交 ([](https://github.com/fangcongyang/mop/commit/35412b9))
* first commit ([](https://github.com/fangcongyang/mop/commit/6dcc75e))


### ♻ Code Refactoring | 代码重构

* 代码格式化处理 ([](https://github.com/fangcongyang/mop/commit/1e4f846))
* 代码遗漏提交 ([](https://github.com/fangcongyang/mop/commit/25872dd))
* 调整服务器响应格式 ([](https://github.com/fangcongyang/mop/commit/d0c90c0))
* 服务响应调整 ([](https://github.com/fangcongyang/mop/commit/d35623c))
* 服务响应调整及代码健壮性调整 ([](https://github.com/fangcongyang/mop/commit/650ab18))
* 删除并更新构建脚本以简化流程 ([](https://github.com/fangcongyang/mop/commit/c7a4f91))
* 设置相关配置切换到文件存储方式 ([](https://github.com/fangcongyang/mop/commit/9b5e75d))
* 依赖升级 ([](https://github.com/fangcongyang/mop/commit/709a7ae))
* 依赖升级 ([](https://github.com/fangcongyang/mop/commit/f13f8b0))
* 移除无效代码 ([](https://github.com/fangcongyang/mop/commit/f0bfd33))
* 移除Linux平台的MPRIS支持 ([](https://github.com/fangcongyang/mop/commit/21e98d5))
* 增加代码健壮性判断 ([](https://github.com/fangcongyang/mop/commit/afcfb65))
* 重构服务器响应 ([](https://github.com/fangcongyang/mop/commit/9ce3939))
* **player:** 提取播放下一首歌曲的超时逻辑到独立方法 ([](https://github.com/fangcongyang/mop/commit/3cdf1c8))
* **player:** 重构播放失败处理逻辑以提升代码可维护性 ([](https://github.com/fangcongyang/mop/commit/9f1a450))
* setting页面功能完善 ([](https://github.com/fangcongyang/mop/commit/51d4d9a))


### ✨ Features | 新功能

* 安卓播放通知栏尝试 ([](https://github.com/fangcongyang/mop/commit/98133cb))
* 播放管理条新增清楚当前歌曲缓存，并重播功能 ([](https://github.com/fangcongyang/mop/commit/c9acc58))
* 前后端版本升级及相关问题处理 ([](https://github.com/fangcongyang/mop/commit/560528e))
* 新增窗口代理支持 ([](https://github.com/fangcongyang/mop/commit/fb7c64c))
* 新增进度条组件 ([](https://github.com/fangcongyang/mop/commit/a5095ea))
* 新增plugin-process插件依赖 ([](https://github.com/fangcongyang/mop/commit/e917272))
* 新增yt-dlp下载更新功能 ([](https://github.com/fangcongyang/mop/commit/d506c0d))
* 增加主题控制 ([](https://github.com/fangcongyang/mop/commit/fc61ae0))
* 增强歌曲like功能。将服务器不支持收藏的歌曲收藏到本地 ([](https://github.com/fangcongyang/mop/commit/3c28792))


### 🐛 Bug Fixes | Bug 修复

* 无法使用添加到歌单功能 ([](https://github.com/fangcongyang/mop/commit/54fbdcf))
* 修复多次点击下一首中间歌曲获取失败导致继续执行下一首的逻辑bug ([](https://github.com/fangcongyang/mop/commit/2adb84a))
* 修复歌曲信息获取失败导致一直提示歌曲加载中问题 ([](https://github.com/fangcongyang/mop/commit/a4eb3e0))
* 修复歌曲loading bug ([](https://github.com/fangcongyang/mop/commit/a9649b6))
* 修复配置get_string方法无法获取number值问题 ([](https://github.com/fangcongyang/mop/commit/3ae3d2c))
* 修复likeATrack中dispatch调用缺少括号的问题 ([](https://github.com/fangcongyang/mop/commit/56759d4))
* 修复Linux构建脚本中缺少的case语句结束符 ([](https://github.com/fangcongyang/mop/commit/51051f0))
* bug修复 ([](https://github.com/fangcongyang/mop/commit/d601126))
* bug修复 ([](https://github.com/fangcongyang/mop/commit/1aa4c85))
* ytdl代理问题 ([](https://github.com/fangcongyang/mop/commit/9edb66f))


### 👷‍ Build System | 构建

* 更新 OpenSSL 依赖版本并调整 CI 配置 ([](https://github.com/fangcongyang/mop/commit/f46f44f))


### 🔧 Continuous Integration | CI 配置

* 更新 GitHub Actions 中使用 actions/download-artifact 的版本至 v4 ([](https://github.com/fangcongyang/mop/commit/91b4b65))
* 更新 Linux 构建脚本以支持 amd64 架构 ([](https://github.com/fangcongyang/mop/commit/292f2ff))
* 更新 release.yml 中的版本号更新逻辑 ([](https://github.com/fangcongyang/mop/commit/8b9a2c7))
* 更新构建脚本和工作流配置 ([](https://github.com/fangcongyang/mop/commit/2df4ad5))
* 更新构建脚本和配置文件以支持不同平台 ([](https://github.com/fangcongyang/mop/commit/21ecd3e))
* 更新构建脚本以修复依赖安装问题 ([](https://github.com/fangcongyang/mop/commit/8620bfe))
* 更新GitHub Actions配置以支持macOS上的OpenSSL安装 ([](https://github.com/fangcongyang/mop/commit/962bdfb))
* 更新Linux构建脚本和依赖项 ([](https://github.com/fangcongyang/mop/commit/0fb3e5d))
* 将 `actions/upload-artifact` 从 v3 升级到 v4 ([](https://github.com/fangcongyang/mop/commit/f5832fd))
* 将工作流中的Ubuntu版本从latest更新为22.04 ([](https://github.com/fangcongyang/mop/commit/75fd5aa))
* 添加Linux构建工作流并修复下载状态拼写错误 ([](https://github.com/fangcongyang/mop/commit/90143c5))
* 添加Linux构建脚本并优化构建流程 ([](https://github.com/fangcongyang/mop/commit/abcddff))
* 修复GitHub Actions配置中的路径和版本更新问题 ([](https://github.com/fangcongyang/mop/commit/5fec9ee))
* 修复Linux构建路径错误 ([](https://github.com/fangcongyang/mop/commit/01b27c7))
* 修复Linux构建路径错误 ([](https://github.com/fangcongyang/mop/commit/c818d06))
* 移除 macOS 和 Windows 的构建任务以简化 CI 流程 ([](https://github.com/fangcongyang/mop/commit/4b94c1d))
* 移除Linux构建产物上传步骤并添加前端依赖安装 ([](https://github.com/fangcongyang/mop/commit/7adac0b))
* 移除Linux构建相关文件并更新release.yml ([](https://github.com/fangcongyang/mop/commit/d590295))
* 优化构建流程并简化 OpenSSL 配置 ([](https://github.com/fangcongyang/mop/commit/882d136))
* 优化GitHub Actions配置和构建脚本 ([](https://github.com/fangcongyang/mop/commit/ddeb119))
* 优化Linux构建脚本的依赖管理和错误处理 ([](https://github.com/fangcongyang/mop/commit/d557f98))
* 优化Linux构建流程并更新发布配置 ([](https://github.com/fangcongyang/mop/commit/385c329))
* 在 release.yml 中全局安装 pnpm 以解决依赖问题 ([](https://github.com/fangcongyang/mop/commit/ba2b631))
* 在Linux构建脚本和发布工作流中添加OpenSSL依赖 ([](https://github.com/fangcongyang/mop/commit/6b5cafe))
* **build-for-linux:** 更新PKG_CONFIG_PATH并添加glib-2.0验证 ([](https://github.com/fangcongyang/mop/commit/b9bba0d))
* **build-for-linux:** 将glib依赖安装步骤移至entrypoint.sh ([](https://github.com/fangcongyang/mop/commit/75f26cc))
* **build-for-linux:** 将PKG_CONFIG_PATH替换为PKG_CONFIG_LIBDIR ([](https://github.com/fangcongyang/mop/commit/1eb588c))
* **build-for-linux:** 添加调试信息以查找glib-2.0.pc文件 ([](https://github.com/fangcongyang/mop/commit/7d0326b))
* **build-for-linux:** 添加更多依赖以支持不同架构的构建 ([](https://github.com/fangcongyang/mop/commit/5a831ca))
* **build-for-linux:** 添加i386架构的libssl-dev依赖并允许跨平台编译 ([](https://github.com/fangcongyang/mop/commit/4e3c57e))
* **build-for-linux:** 添加pkg-config验证并输出编译环境变量 ([](https://github.com/fangcongyang/mop/commit/525358a))
* **build-for-linux:** 修改PKG_CONFIG环境变量配置 ([](https://github.com/fangcongyang/mop/commit/c2a03cb))
* **build-for-linux:** 移除不必要的架构指定 ([](https://github.com/fangcongyang/mop/commit/c9bda87))
* **build-for-linux:** 移除重复依赖安装并更新包名 ([](https://github.com/fangcongyang/mop/commit/d8dbcdb))
* **build-for-linux:** 优化Linux构建脚本的依赖安装 ([](https://github.com/fangcongyang/mop/commit/123077c))
* **build-for-linux:** 在entrypoint.sh中添加sudo命令并导出PKG_CONFIG_PATH ([](https://github.com/fangcongyang/mop/commit/2b92600))
* **workflow:** 更新 macOS 和 Windows 的 OpenSSL 安装配置 ([](https://github.com/fangcongyang/mop/commit/18e1cfb))
* **workflow:** 添加macOS的OpenSSL路径设置并优化窗口透明性代码 ([](https://github.com/fangcongyang/mop/commit/e2a130e))
* **workflow:** 为构建任务添加写权限并简化平台配置 ([](https://github.com/fangcongyang/mop/commit/1878b2e))
* **workflow:** 在 macOS 构建步骤中新增 cmake 安装和构建打包任务 ([](https://github.com/fangcongyang/mop/commit/d8e1cb4))
* **workflows:** 更新Ubuntu构建依赖安装步骤 ([](https://github.com/fangcongyang/mop/commit/89f1247))
* **workflows:** 修复Linux构建路径错误 ([](https://github.com/fangcongyang/mop/commit/fcc0264))



