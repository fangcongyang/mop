use std::str::FromStr;

use crate::conf::Shortcut;
use crate::APP;
use log::{info, warn};
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

// Register global shortcuts
pub fn register_shortcut(mut shortcut_conf: Shortcut) -> Shortcut {
    let app_handle = APP.get().unwrap();
    let shortcut_name = shortcut_conf.name.as_str();
    let hotkey = shortcut_conf.globalShortcut.as_str();
    let shortcut_id = shortcut_conf.id.clone();
    let shortcut = tauri_plugin_global_shortcut::Shortcut::from_str(hotkey);
    match shortcut {
        Ok(shortcut) => {
            info!("Shortcut {} triggered", shortcut);
            match app_handle.global_shortcut().on_shortcut(shortcut,  move |app: &AppHandle, _shortcut, _event| {
                let _ = app.emit(shortcut_id.as_str(), "".to_owned());
            }) {
                Ok(()) => {
                    info!(
                        "Registered global shortcut: {} for {}",
                        hotkey, shortcut_name
                    );
                },
                Err(e) => {
                    shortcut_conf.isPersonalUse = true;
                    warn!("Failed to register global shortcut: {} {:?}", hotkey, e)
                }
            }
        },
        Err(e) =>  {
            shortcut_conf.isPersonalUse = true;
            warn!("Failed to register global shortcut: {} {:?}", hotkey, e)
        },
    }
    return shortcut_conf;
}

#[tauri::command]
pub fn register_shortcut_by_frontend(shortcut: Shortcut) -> Result<Shortcut, String> {
    Ok(register_shortcut(shortcut))
}
