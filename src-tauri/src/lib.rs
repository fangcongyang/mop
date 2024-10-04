#[macro_use]
mod macros;

extern crate proc_macro;

use app::{hotkey::{register_shortcut, register_shortcut_by_frontend}, menu, mpris::{ self, TrackInfo}};
use conf::{get, init_config, init_config_value, is_first_run, set, Shortcut};
use log::{info, LevelFilter};
use once_cell::sync::OnceCell;
use tauri::{Listener, Manager};
use tauri_plugin_log::{Target, TargetKind};

mod app;
mod api;
mod utils;
mod engine;
mod conf;
use api::{album, artist, auth, cloud_engine, mv, other, playlist, request::read_cookie_string, track, user};

use crate::app::menu::Payload;

pub static APP: OnceCell<tauri::AppHandle> = OnceCell::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(LevelFilter::Info)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .setup(|app| {
            // Global AppHandle
            APP.get_or_init(|| app.handle().clone());

            info!("Init Config Store");
            init_config(app);
            // Check First Run
            if is_first_run() {
                // Open Config Window
                info!("First Run, opening config window");
                init_config_value();
            }
            
            read_cookie_string();
            
            #[cfg(target_os = "linux")]
            {
                let app_name = app.app_handle().config().package.product_name.clone().unwrap_or("".to_owned());
                mpris::init_mpris(app_name);
            }

            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_global_shortcut::Builder::new().build())?;

            let mut shortcuts: Vec<Shortcut> = vec![];
            let enable_global_shortcut = get("enableGlobalShortcut").unwrap().as_bool();

            // 初始化全局快捷键
            if Some(true) == enable_global_shortcut {
                get("shortcutList").unwrap().as_array().unwrap().iter().for_each(|item| {
                    let shortcut = serde_json::from_value::<Shortcut>(item.clone()).unwrap();
                    shortcuts.push(register_shortcut(shortcut));
                });
                set("shortcutList", shortcuts);
            }

            menu::tray_menu(&app)?;
            
            app.listen("updateTrackInfo", move |event| {
                let track = serde_json::from_str::<TrackInfo>(event.payload()).unwrap();
                mpris::update_track_info(track);
            });

            let app_handle = app.app_handle().clone();
            app.listen("taryEvent", move |event | {
                let payload = serde_json::from_str::<Payload>(event.payload()).unwrap();
                if let Some(menu) = app_handle.menu() {
                    if let Some(m) = menu.get(&payload.taryId.unwrap()) {
                        let _ = m.as_menuitem().unwrap().set_text(payload.title.unwrap());
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            conf::cmd::reload_store,
            register_shortcut_by_frontend,
            playlist::get_playlist_detail,
            playlist::playmode_intelligence_list,
            playlist::daily_recommend_playlist,
            playlist::recommend_playlist,
            playlist::top_playlist,
            playlist::top_playlist_high_quality,
            playlist::top_list,
            playlist::recommend_songs,
            playlist::playlist_subscribe,
            playlist::playlist_tracks,
            playlist::playlist_remove,
            playlist::playlist_create,
            track::get_song_detail,
            track::get_song_url,
            track::get_lyric,
            track::scrobble,
            track::like,
            album::get_album,
            album::album_new,
            album::album_sublist,
            album::album_sub,
            album::artist_albums,
            album::album_detail_dynamic,
            auth::login_qr_codekey,
            auth::login_qr_check,
            auth::login_cellphone,
            auth::login,
            user::user_account,
            user::user_playlist,
            user::user_like_songs_ids,
            user::cloud_del,
            user::user_cloud,
            user::user_record,
            user::cloud,
            other::search,
            other::personal_fm,
            other::fm_trash,
            artist::toplist_artist,
            artist::artist_sublist,
            artist::artist_sub,
            artist::artists,
            artist::artist_mv,
            artist::simi_artist,
            mv::mv_sub,
            mv::mv_detail,
            mv::mv_url,
            mv::simi_mv,
            mv::mv_sublist,
            cloud_engine::get_audio_source_from_unblock_music,
            utils::cmd::download_music_arraybuffer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}