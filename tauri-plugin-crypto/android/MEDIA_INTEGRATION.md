# Android Media Session Integration

## 概述

本文档说明了如何在Android端实现完整的媒体播放功能，包括真正的音频播放控制和与Rust后端的双向交互。

## 新增功能

### 🎵 真正的音频播放
- 集成Android MediaPlayer进行实际音频播放
- 支持本地文件和网络音频流
- 完整的播放状态管理和进度跟踪
- 音频焦点管理和后台播放支持

### 🎛️ 完整的播放控制
- 播放/暂停/停止
- 进度跳转和实时进度更新
- 音量控制和播放速度调节
- 播放完成和错误处理

## 架构说明

### 组件结构

1. **MopNotificationService** - 媒体会话服务
   - 创建和管理MediaSession
   - 处理媒体控制回调
   - 与CryptoPlugin通信

2. **CryptoPlugin** - Tauri插件主类
   - 管理服务连接
   - 触发Rust事件
   - 处理媒体事件

3. **MopPlayerReceiver** - 广播接收器
   - 接收媒体控制广播
   - 转发事件到服务

4. **MediaEventHandler** - 事件处理器
   - 验证事件类型
   - 创建事件数据
   - 记录事件日志

### 事件流程

```
用户操作 → MediaSession回调 → triggerRustEvent → CryptoPlugin.triggerMediaEvent → Tauri事件 → Rust后端
```

## 支持的媒体事件

### 控制事件（从系统媒体控制触发）
- `media_play` - 播放
- `media_pause` - 暂停
- `media_next` - 下一首
- `media_previous` - 上一首
- `media_stop` - 停止
- `media_seek` - 跳转

### 状态事件（从MediaPlayer触发）
- `media_completed` - 播放完成
- `media_error` - 播放错误

### 可用的Rust命令
- `media_play_track` - 播放指定音频文件
- `media_play` - 开始播放
- `media_pause` - 暂停播放
- `media_stop` - 停止播放
- `media_seek` - 跳转到指定位置
- `media_get_status` - 获取当前播放状态

## Rust端集成示例

### 1. 调用Android媒体播放命令

```rust
use tauri::{command, AppHandle, Manager};
use serde_json::Value;

// 播放指定音频文件
#[command]
async fn play_audio_file(app_handle: AppHandle, file_path: String) -> Result<(), String> {
    let result = app_handle
        .invoke("plugin:crypto|media_play_track", serde_json::json!({ "uri": file_path }))
        .await;
    
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to play audio: {}", e))
    }
}

// 控制播放状态
#[command]
async fn control_playback(app_handle: AppHandle, action: String) -> Result<(), String> {
    let command = match action.as_str() {
        "play" => "plugin:crypto|media_play",
        "pause" => "plugin:crypto|media_pause",
        "stop" => "plugin:crypto|media_stop",
        _ => return Err("Invalid action".to_string())
    };
    
    let result = app_handle.invoke(command, serde_json::json!({})).await;
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to control playback: {}", e))
    }
}

// 跳转到指定位置
#[command]
async fn seek_to_position(app_handle: AppHandle, position: i64) -> Result<(), String> {
    let result = app_handle
        .invoke("plugin:crypto|media_seek", serde_json::json!({ "position": position }))
        .await;
    
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to seek: {}", e))
    }
}

// 获取播放状态
#[command]
async fn get_playback_status(app_handle: AppHandle) -> Result<Value, String> {
    let result = app_handle
        .invoke("plugin:crypto|media_get_status", serde_json::json!({}))
        .await;
    
    match result {
        Ok(status) => Ok(status),
        Err(e) => Err(format!("Failed to get status: {}", e))
    }
}
```

### 2. 监听媒体控制事件

```rust
use tauri::{AppHandle, Manager};
use serde_json::Value;

// 在main.rs中注册事件监听器
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            
            // 监听媒体控制事件
            app.listen_global("media_control", move |event| {
                if let Some(payload) = event.payload() {
                    handle_media_event(&app_handle, payload);
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 处理媒体事件
fn handle_media_event(app_handle: &AppHandle, payload: &str) {
    match serde_json::from_str::<Value>(payload) {
        Ok(data) => {
            if let Some(event_type) = data["event_type"].as_str() {
                match event_type {
                    "media_play" => {
                        // 处理播放事件
                        println!("Received play command from Android");
                        // 调用播放器播放方法
                    },
                    "media_pause" => {
                        // 处理暂停事件
                        println!("Received pause command from Android");
                        // 调用播放器暂停方法
                    },
                    "media_next" => {
                        // 处理下一首事件
                        println!("Received next command from Android");
                        // 调用播放器下一首方法
                    },
                    "media_previous" => {
                        // 处理上一首事件
                        println!("Received previous command from Android");
                        // 调用播放器上一首方法
                    },
                    _ => {
                        println!("Unknown media event: {}", event_type);
                    }
                }
            }
        },
        Err(e) => {
            eprintln!("Failed to parse media event payload: {}", e);
        }
    }
}
```

### 2. 发送状态更新到Android

```rust
use tauri::{AppHandle, Manager};

// 更新媒体会话状态
pub fn update_media_session_state(app_handle: &AppHandle, is_playing: bool, position: u64, duration: u64) {
    let payload = serde_json::json!({
        "is_playing": is_playing,
        "position": position,
        "duration": duration,
        "timestamp": chrono::Utc::now().timestamp_millis()
    });
    
    // 发送到前端，前端可以进一步处理或发送到Android
    app_handle.emit_all("media_state_update", payload).ok();
}
```

## 权限配置

确保在`AndroidManifest.xml`中添加必要的权限：

```xml
<uses-permission android:name="android.permission.MEDIA_CONTENT_CONTROL" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

## 注意事项

1. **避免循环调用** - MediaSession回调中不要调用`super`方法，避免无限循环
2. **错误处理** - 所有媒体事件处理都包含try-catch块
3. **日志记录** - 使用MediaEventHandler记录所有事件，便于调试
4. **服务生命周期** - 正确管理服务的绑定和解绑
5. **线程安全** - 媒体事件可能在不同线程中触发，注意线程安全

## 调试建议

1. 使用`adb logcat`查看Android日志
2. 过滤标签：`adb logcat | grep -E "(MopNotificationService|CryptoPlugin|MediaEventHandler)"`
3. 检查服务是否正确启动和绑定
4. 验证MediaSession是否处于活动状态