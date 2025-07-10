// Rust端集成示例 - 如何使用Android MediaPlayer功能
// 将此代码集成到你的Tauri应用的main.rs或相关模块中

use tauri::{command, AppHandle, Manager, State};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

// 播放器状态结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackState {
    pub is_playing: bool,
    pub current_position: i64,
    pub duration: i64,
    pub current_track: Option<String>,
}

// 播放器管理器
pub struct MediaPlayerManager {
    pub state: Arc<Mutex<PlaybackState>>,
    pub playlist: Arc<Mutex<Vec<String>>>,
    pub current_index: Arc<Mutex<usize>>,
}

impl MediaPlayerManager {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(PlaybackState {
                is_playing: false,
                current_position: 0,
                duration: 0,
                current_track: None,
            })),
            playlist: Arc::new(Mutex::new(Vec::new())),
            current_index: Arc::new(Mutex::new(0)),
        }
    }
}

// Tauri命令：播放音频文件
#[command]
pub async fn play_audio_file(
    app_handle: AppHandle,
    manager: State<'_, MediaPlayerManager>,
    file_path: String,
) -> Result<(), String> {
    println!("Playing audio file: {}", file_path);
    
    // 调用Android MediaPlayer
    let result = app_handle
        .invoke("plugin:crypto|media_play_track", serde_json::json!({ "uri": file_path }))
        .await;
    
    match result {
        Ok(_) => {
            // 更新本地状态
            if let Ok(mut state) = manager.state.lock() {
                state.current_track = Some(file_path);
                state.is_playing = true;
            }
            Ok(())
        },
        Err(e) => Err(format!("Failed to play audio: {}", e))
    }
}

// Tauri命令：控制播放状态
#[command]
pub async fn control_playback(
    app_handle: AppHandle,
    manager: State<'_, MediaPlayerManager>,
    action: String,
) -> Result<(), String> {
    println!("Controlling playback: {}", action);
    
    let command = match action.as_str() {
        "play" => "plugin:crypto|media_play",
        "pause" => "plugin:crypto|media_pause",
        "stop" => "plugin:crypto|media_stop",
        _ => return Err("Invalid action".to_string())
    };
    
    let result = app_handle.invoke(command, serde_json::json!({})).await;
    
    match result {
        Ok(_) => {
            // 更新本地状态
            if let Ok(mut state) = manager.state.lock() {
                match action.as_str() {
                    "play" => state.is_playing = true,
                    "pause" | "stop" => state.is_playing = false,
                    _ => {}
                }
            }
            Ok(())
        },
        Err(e) => Err(format!("Failed to control playback: {}", e))
    }
}

// Tauri命令：跳转到指定位置
#[command]
pub async fn seek_to_position(
    app_handle: AppHandle,
    manager: State<'_, MediaPlayerManager>,
    position: i64,
) -> Result<(), String> {
    println!("Seeking to position: {}ms", position);
    
    let result = app_handle
        .invoke("plugin:crypto|media_seek", serde_json::json!({ "position": position }))
        .await;
    
    match result {
        Ok(_) => {
            // 更新本地状态
            if let Ok(mut state) = manager.state.lock() {
                state.current_position = position;
            }
            Ok(())
        },
        Err(e) => Err(format!("Failed to seek: {}", e))
    }
}

// Tauri命令：获取播放状态
#[command]
pub async fn get_playback_status(
    app_handle: AppHandle,
    manager: State<'_, MediaPlayerManager>,
) -> Result<PlaybackState, String> {
    // 从Android获取最新状态
    let result = app_handle
        .invoke("plugin:crypto|media_get_status", serde_json::json!({}))
        .await;
    
    match result {
        Ok(status) => {
            if let Ok(status_obj) = serde_json::from_value::<HashMap<String, Value>>(status) {
                let mut state = manager.state.lock().unwrap();
                
                // 更新状态
                if let Some(is_playing) = status_obj.get("is_playing") {
                    state.is_playing = is_playing.as_bool().unwrap_or(false);
                }
                if let Some(position) = status_obj.get("current_position") {
                    state.current_position = position.as_i64().unwrap_or(0);
                }
                if let Some(duration) = status_obj.get("duration") {
                    state.duration = duration.as_i64().unwrap_or(0);
                }
                
                Ok(state.clone())
            } else {
                Err("Failed to parse status".to_string())
            }
        },
        Err(e) => Err(format!("Failed to get status: {}", e))
    }
}

// Tauri命令：播放下一首
#[command]
pub async fn play_next(
    app_handle: AppHandle,
    manager: State<'_, MediaPlayerManager>,
) -> Result<(), String> {
    let playlist = manager.playlist.lock().unwrap();
    let mut current_index = manager.current_index.lock().unwrap();
    
    if playlist.is_empty() {
        return Err("Playlist is empty".to_string());
    }
    
    *current_index = (*current_index + 1) % playlist.len();
    let next_track = playlist[*current_index].clone();
    drop(playlist);
    drop(current_index);
    
    play_audio_file(app_handle, manager, next_track).await
}

// Tauri命令：播放上一首
#[command]
pub async fn play_previous(
    app_handle: AppHandle,
    manager: State<'_, MediaPlayerManager>,
) -> Result<(), String> {
    let playlist = manager.playlist.lock().unwrap();
    let mut current_index = manager.current_index.lock().unwrap();
    
    if playlist.is_empty() {
        return Err("Playlist is empty".to_string());
    }
    
    *current_index = if *current_index == 0 {
        playlist.len() - 1
    } else {
        *current_index - 1
    };
    
    let previous_track = playlist[*current_index].clone();
    drop(playlist);
    drop(current_index);
    
    play_audio_file(app_handle, manager, previous_track).await
}

// Tauri命令：设置播放列表
#[command]
pub async fn set_playlist(
    manager: State<'_, MediaPlayerManager>,
    tracks: Vec<String>,
) -> Result<(), String> {
    let mut playlist = manager.playlist.lock().unwrap();
    let mut current_index = manager.current_index.lock().unwrap();
    
    *playlist = tracks;
    *current_index = 0;
    
    Ok(())
}

// 处理来自Android的媒体控制事件
pub fn handle_media_event(app_handle: &AppHandle, payload: &str) {
    if let Ok(data) = serde_json::from_str::<HashMap<String, Value>>(payload) {
        if let Some(event_type) = data["event_type"].as_str() {
            let manager = app_handle.state::<MediaPlayerManager>();
            
            match event_type {
                "media_play" => {
                    println!("Received play command from Android");
                    // 可以在这里添加额外的播放逻辑
                },
                "media_pause" => {
                    println!("Received pause command from Android");
                    // 可以在这里添加额外的暂停逻辑
                },
                "media_next" => {
                    println!("Received next command from Android");
                    let app_handle_clone = app_handle.clone();
                    let manager_clone = manager.inner().clone();
                    
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = play_next(app_handle_clone, State::from(Arc::new(manager_clone))).await {
                            eprintln!("Failed to play next: {}", e);
                        }
                    });
                },
                "media_previous" => {
                    println!("Received previous command from Android");
                    let app_handle_clone = app_handle.clone();
                    let manager_clone = manager.inner().clone();
                    
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = play_previous(app_handle_clone, State::from(Arc::new(manager_clone))).await {
                            eprintln!("Failed to play previous: {}", e);
                        }
                    });
                },
                "media_completed" => {
                    println!("Track completed, playing next");
                    let app_handle_clone = app_handle.clone();
                    let manager_clone = manager.inner().clone();
                    
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = play_next(app_handle_clone, State::from(Arc::new(manager_clone))).await {
                            eprintln!("Failed to auto-play next: {}", e);
                        }
                    });
                },
                "media_error" => {
                    eprintln!("Media playback error occurred");
                    // 处理播放错误
                },
                _ => {
                    println!("Unknown media event: {}", event_type);
                }
            }
        }
    }
}

// 在main.rs中的集成示例
/*
fn main() {
    let media_manager = MediaPlayerManager::new();
    
    tauri::Builder::default()
        .manage(media_manager)
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
        .invoke_handler(tauri::generate_handler![
            play_audio_file,
            control_playback,
            seek_to_position,
            get_playback_status,
            play_next,
            play_previous,
            set_playlist
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
*/