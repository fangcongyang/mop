use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
    App, Manager, Wry
};
use tauri::Emitter;
use tauri::menu::{ IconMenuItemBuilder, Menu, PredefinedMenuItem };

#[allow(non_snake_case)]
#[derive(Clone, serde::Serialize, serde::Deserialize, Debug)]
pub struct Payload {
    pub taryId: Option<String>,
    pub title: Option<String>,
}

// --- SystemTray Menu
pub fn tray_menu(app: &App<Wry>) -> Result<(), Box<dyn std::error::Error>> {
    let play_icon = tauri::image::Image::from_path("./icons/play.png")?;
    let play = IconMenuItemBuilder::new("播放")
        .id("play")
        .icon(play_icon)
        .build(app)?;
    let prev_track_icon = tauri::image::Image::from_path("./icons/play.png")?;
    let prev_track = IconMenuItemBuilder::new("播放")
        .id("prevTrack")
        .icon(prev_track_icon)
        .build(app)?;
    let next_track_icon = tauri::image::Image::from_path("./icons/play.png")?;
    let next_track = IconMenuItemBuilder::new("下一首")
        .id("nextTrack")
        .icon(next_track_icon)
        .build(app)?;
    let play_mode_icon = tauri::image::Image::from_path("./icons/play.png")?;
    let play_mode = IconMenuItemBuilder::new("循环播放")
        .id("playMode")
        .icon(play_mode_icon)
        .build(app)?;
    
    let separator = PredefinedMenuItem::separator(app)?;

    let restart_icon = tauri::image::Image::from_path("./icons/play.png")?;
    let restart = IconMenuItemBuilder::new("重启应用")
        .id("restart")
        .icon(restart_icon)
        .build(app)?;

    let quit = PredefinedMenuItem::quit(app, None)?;
    
    let menu = Menu::with_items(app, 
        &[&play, &prev_track, &next_track, &play_mode, &separator, &restart, &quit])?;
    
    TrayIconBuilder::new().icon(app.default_window_icon().unwrap().clone())
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
        .menu_on_left_click(true)
        .on_menu_event(|app, event| 
            match event.id.as_ref() {
            "play" | "prevTrack" | "nextTrack" => {
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
    Ok(())
}

// pub mod cmd {
//   use tauri::{command, AppHandle, Manager};
//   use crate::conf::AppConf;

//   #[command]
//   pub fn exist_app(app: AppHandle) {
//     let main = app.get_focused_window().unwrap();
//     let app_conf = AppConf::read();
//     let save_window_state = app_conf.systemConf.saveWindowState;
//     if app_conf.isinit {
//       tauri::api::dialog::ask(
//         Some(&app.get_focused_window().unwrap()),
//         "退出",
//         "你确定退出程序吗？按[x]进行退出",
//         move |is_ok| {
//             app_conf
//             .amend(serde_json::json!({ "isinit" : false, "main_close": is_ok }))
//             .write();
//             if is_ok {
//               if save_window_state {
//                 app.save_window_state(StateFlags::all()).expect("保存窗口状态失败");
//               }
//               std::process::exit(0);
//             } else {
//               main.minimize().unwrap();
//             }
//         },
//       );
//     } else if app_conf.main_close {
//       if save_window_state {
//         app.save_window_state(StateFlags::all()).expect("保存窗口状态失败");
//       }
//       std::process::exit(0);
//     } else {
//       main.minimize().unwrap();
//     }
//   }
// }
