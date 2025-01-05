use log::{info, warn};
use serde_json::{json, Value};
use std::path::PathBuf;
use tauri::{path::BaseDirectory, Manager};

use crate::{utils, APP};
use tauri_plugin_store::StoreExt;

// pub const BUY_COFFEE: &str = "https://www.buymeacoffee.com/lencx";

pub_struct!(Shortcut {
    id: String,
    name: String,
    desc: String,
    shortcut: String,
    globalShortcut: String,
    isPersonalUse: bool,
});
fn get_path(app: &tauri::AppHandle) -> PathBuf {
    let config_path = app.path().resolve("", BaseDirectory::AppConfig).unwrap();
    config_path.join("mop.json")
}

pub fn init_config(app: &mut tauri::AppHandle) {
    let config_path = get_path(app);
    let _ = utils::create_dir_if_not_exists(&config_path);
    info!("Load config from: {:?}", config_path);

    match app.store(config_path) {
        Ok(_) => info!("Config loaded"),
        Err(e) => {
            warn!("Config load error: {:?}", e);
            info!("Config not found, creating new config");
        }
    }
}

#[allow(unused)]
pub fn get(key: &str) -> Option<Value> {
    let app = APP.get().unwrap();
    let store = app.get_store(get_path(app)).unwrap();
    match store.get(key) {
        Some(value) => Some(value.clone()),
        _none => None,
    }
}
pub fn get_string(key: &str) -> String {
    let app = APP.get().unwrap();
    let store = app.get_store(get_path(app)).unwrap();
    match store.get(key) {
        Some(value) => {
            // 尝试将值转换为字符串
            match value {
                // 如果值是字符串
                Value::String(s) => s.clone(),
                // 如果值是数字
                Value::Number(n) => n.to_string(),
                // 其他类型可以根据需要处理
                _ => "".to_owned(),
            }
        }
        _none => "".to_owned(),
    }
}

pub fn set<T: serde::ser::Serialize>(key: &str, value: T) {
    let app = APP.get().unwrap();
    let store = app.get_store(get_path(app)).unwrap();
    store.set(key.to_string(), json!(value));
    store.save().unwrap();
}

pub fn is_first_run() -> bool {
    let app = APP.get().unwrap();
    let store = app.get_store(get_path(app)).unwrap();
    store.length() == 0
}

pub fn init_config_value() {
    let init_config_value_str = utils::read_init_data_file("mop.json");
    if init_config_value_str == "[]" {
        set("appName", "mop");
        return;
    }
    let init_config_value: Value = serde_json::from_str(&init_config_value_str).unwrap();
    init_config_value
        .as_object()
        .unwrap()
        .iter()
        .for_each(|(k, v)| {
            set(k, v.clone());
        });
    restore_default_shortcuts();
}

pub fn restore_default_shortcuts() {
    let init_config_value_str = utils::read_init_data_file("shortcut.json");
    let init_config_value: Value = serde_json::from_str(&init_config_value_str).unwrap();
    set("shortcutList", init_config_value);
}

pub mod cmd {
    use tauri::command;
    use tauri_plugin_store::StoreExt;

    use crate::APP;

    use super::get_path;

    #[command]
    pub fn reload_store() {
        let app = APP.get().unwrap();
        let store = app.get_store(get_path(app)).unwrap();
        store.reload().unwrap();
    }
}
