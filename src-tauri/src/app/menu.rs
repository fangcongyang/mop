#[cfg(desktop)]
pub mod menu_desktop {
    use std::sync::{Arc, Mutex};

    use lazy_static::lazy_static;
    use tauri::menu::{IconMenuItemBuilder, Menu, PredefinedMenuItem};
    use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
    use tauri::{App, AppHandle, Manager, Wry};
    use tauri::Emitter;

    lazy_static! {
        static ref TRAY_ICON_MAP: Arc<Mutex<Option<TrayIcon>>> = Arc::new(Mutex::new(None));
        static ref PLAY_STATUS: Arc<Mutex<PlayStatus>> = Arc::new(Mutex::new(PlayStatus{ playing: false, playMode: "1".to_owned() }));
    }

    #[allow(non_snake_case)]
    #[derive(Clone, serde::Serialize, serde::Deserialize, Debug)]
    pub struct Payload {
        pub taryId: Option<String>,
        pub title: Option<String>,
    }

    #[allow(non_snake_case)]
    #[derive(Clone, serde::Serialize, serde::Deserialize, Debug)]
    pub struct PlayStatus {
        pub playing: bool,
        pub playMode: String,
    }

    // --- SystemTray Menu
    pub fn tray_menu(app: &App<Wry>) -> Result<(), Box<dyn std::error::Error>> {
        let play_status = PLAY_STATUS.lock().unwrap().clone();
        let menu = create_tray_icon(&app.handle().clone(), play_status).unwrap();
        let tray = TrayIconBuilder::new()
            .icon(app.default_window_icon().unwrap().clone())
            .on_tray_icon_event(|tray, event| match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        if !window.is_visible().unwrap() {
                            window.show().unwrap();
                        }
                        if window.is_minimized().unwrap() {
                            window.unminimize().unwrap()
                        }
                        window.set_focus().unwrap();
                    }
                }
                _ => {
                    println!("unhandled event {event:?}");
                }
            })
            .menu(&menu)
            .show_menu_on_left_click(true)
            .on_menu_event(|app, event| match event.id.as_ref() {
                "playOrPause" => {
                    let mut play_status = PLAY_STATUS.lock().unwrap();
                    play_status.playing = !play_status.playing;
                    let menu = create_tray_icon(app, play_status.clone()).unwrap();
                    if let Some(tray) = TRAY_ICON_MAP.lock().unwrap().as_mut() {
                        tray.set_menu(Some(menu)).unwrap();
                    }

                    let _ = app.emit(event.id.0.as_str(), "".to_owned());
                }
                "prevTrack" | "nextTrack" => {
                    let _ = app.emit(event.id.0.as_str(), "".to_owned());
                }
                "restart" => tauri::process::restart(&app.env()),
                "quit" => {
                    std::process::exit(0);
                }
                _ => {
                    println!("menu item {} not handled", event.id.0.as_str());
                }
            })
            .build(app)?;
        let mut tray_icon = TRAY_ICON_MAP.lock().unwrap();
        *tray_icon = Some(tray);
        Ok(())
    }

    fn create_tray_icon(
        app: &AppHandle,
        play_status: PlayStatus,
    ) -> Result<Menu<Wry>, Box<dyn std::error::Error>> {
        let play_icon = if play_status.playing {
            tauri::image::Image::from_path("./assets/pause.png")?
        } else {
            tauri::image::Image::from_path("./assets/play.png")?
        };
        let play = if play_status.playing {
            IconMenuItemBuilder::new("暂停")
                .id("playOrPause")
                .icon(play_icon)
                .build(app)?
        } else {
            IconMenuItemBuilder::new("播放")
                .id("playOrPause")
                .icon(play_icon)
                .build(app)?
        };
        let prev_track_icon = tauri::image::Image::from_path("./assets/previous.png")?;
        let prev_track = IconMenuItemBuilder::new("上一首")
            .id("prevTrack")
            .icon(prev_track_icon)
            .build(app)?;
        let next_track_icon = tauri::image::Image::from_path("./assets/next.png")?;
        let next_track = IconMenuItemBuilder::new("下一首")
            .id("nextTrack")
            .icon(next_track_icon)
            .build(app)?;
        let play_mode_icon = tauri::image::Image::from_path("./assets/repeat.png")?;
        let play_mode = IconMenuItemBuilder::new("循环播放")
            .id("playMode")
            .icon(play_mode_icon)
            .build(app)?;

        let separator = PredefinedMenuItem::separator(app)?;

        let restart_icon = tauri::image::Image::from_path("./assets/restart.png")?;
        let restart = IconMenuItemBuilder::new("重启应用")
            .id("restart")
            .icon(restart_icon)
            .build(app)?;

        let quit = PredefinedMenuItem::quit(app, None)?;

        let menu = Menu::with_items(
            app,
            &[
                &play,
                &prev_track,
                &next_track,
                &play_mode,
                &separator,
                &restart,
                &quit,
            ],
        )?;
        return Ok(menu);
    }

    pub fn update_tray_icon(
        payload: PlayStatus,
    ) -> Result<(), Box<dyn std::error::Error>> {      
        let mut play_status = PLAY_STATUS.lock().unwrap();
        play_status.playing = payload.playing;
        play_status.playMode = payload.playMode.clone();
        if let Some(tray) = TRAY_ICON_MAP.lock().unwrap().as_mut() {
            let menu = create_tray_icon(tray.app_handle(), play_status.clone())?;
            tray.set_menu(Some(menu))?;
        }
        Ok(())
    }
}
