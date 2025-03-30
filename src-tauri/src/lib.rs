#[macro_use]
mod macros;

extern crate proc_macro;

use app::{
    cmds, hotkey,
    menu::menu_desktop::{update_tray_icon, PlayStatus},
};
use conf::{get, init_config, init_config_value, is_first_run, set, Shortcut};
use log::{info, LevelFilter};
use once_cell::sync::OnceCell;
use serde_json::{json, Value};
use tauri::{App, Listener, Manager, WebviewWindow, Wry};
use tauri_plugin_log::{Target, TargetKind};

mod api;
mod app;
mod conf;
mod engine;
mod utils;
use api::{
    album, artist, auth, cloud_engine, mv, other, playlist, request::read_cookie_string, track,
    user,
};
use url::Url;

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
        .plugin(tauri_plugin_crypto::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(LevelFilter::Info)
                .max_file_size(50_000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
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
            let mut app_handle = app.handle().clone();
            init_config(&mut app_handle);
            // Check First Run
            if is_first_run() {
                // Open Config Window
                info!("First Run, opening config window");
                init_config_value();
            }

            read_cookie_string();

            let create_window_result = create_window(app);
            if create_window_result.is_err() {
                log::error!(
                    "Create Window Error: {}",
                    create_window_result.err().unwrap()
                );
            }

            #[cfg(target_os = "linux")]
            {
                let app_name = app
                    .app_handle()
                    .config()
                    .product_name
                    .clone()
                    .unwrap_or("".to_owned());
                mpris_linux::init_mpris(app_name);

                app.listen("updateTrackInfo", move |event| {
                    let track =
                        serde_json::from_str::<mpris_linux::TrackInfo>(event.payload()).unwrap();
                    mpris_linux::update_track_info(track);
                });
            }

            #[cfg(desktop)]
            {
                use app::menu::{self};
                app.handle()
                    .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;

                let mut shortcuts: Vec<Shortcut> = vec![];
                let enable_global_shortcut = get("enableGlobalShortcut").unwrap().as_bool();

                // 初始化全局快捷键
                if Some(true) == enable_global_shortcut {
                    get("shortcutList")
                        .unwrap()
                        .as_array()
                        .unwrap()
                        .iter()
                        .for_each(|item| {
                            let shortcut =
                                serde_json::from_value::<Shortcut>(item.clone()).unwrap();
                            shortcuts.push(hotkey::hotkey_desktop::register_shortcut(shortcut));
                        });
                    set("shortcutList", shortcuts);
                }

                menu::menu_desktop::tray_menu(&app)?;

                app.app_handle()
                    .clone()
                    .listen("play_status", move |event| {
                        if let Ok(payload) = serde_json::from_str::<PlayStatus>(&event.payload()) {
                            let _ = update_tray_icon(payload);
                        }
                    });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            conf::cmd::reload_store,
            conf::cmd::restore_default_shortcuts,
            hotkey::cmd::register_shortcut_by_frontend,
            hotkey::cmd::unregister_shortcut_by_frontend,
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
            other::github_repos_info_version,
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
            cmds::open_devtools,
            cmds::download_file_task,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_window(app: &App<Wry>) -> anyhow::Result<WebviewWindow<Wry>, Box<dyn std::error::Error>> {
    let mut webview_window =
        tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("index.html".into()));
    #[cfg(not(target_os = "android"))]
    {
        webview_window = webview_window
            .title("mop")
            .center()
            .inner_size(1440f64, 840f64)
            .fullscreen(false)
            .resizable(true)
            .decorations(false)
            .transparent(true);
    }

    #[allow(unused_assignments)]
    let mut proxy_protocol: Option<Value> = None;
    #[cfg(not(any(target_os = "android", target_os = "macos")))]
    {
        proxy_protocol = get("proxyProtocol");
    }
    match proxy_protocol {
        Some(proxy_protocol) => {
            let pp = proxy_protocol.as_str().unwrap_or("http").to_lowercase();
            if pp == "http" || pp == "socks5" {
                let proxy_server = get("proxyServer").unwrap_or(json!("127.0.0.1".to_string()));
                let proxy_server_str = proxy_server.as_str().unwrap();
                let proxy_port = get("proxyPort").unwrap_or(json!(7897));
                let proxy_port_num = proxy_port.as_u64().unwrap();
                webview_window = webview_window.proxy_url(
                    Url::parse(&format!("{}://{}:{}", pp, proxy_server_str, proxy_port_num))
                        .unwrap(),
                );
            }
            return Ok(webview_window.build()?);
        }
        _none => {
            return Ok(webview_window.build()?);
        }
    }
}
