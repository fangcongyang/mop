use anyhow::Result;
use tauri::{path::BaseDirectory, Manager};
use std::{
    env,
    fs::{self, read_to_string, File},
    path::{Path, PathBuf},
};
use crate::{conf::get_string, APP};

pub fn app_root() -> PathBuf {
    let app_handle = APP.get().unwrap();
    let path = app_handle.path().resolve("", BaseDirectory::AppConfig).unwrap();
    path
}

pub fn exists(path: &Path) -> bool {
    Path::new(path).exists()
}

pub fn app_install_root() -> PathBuf {
    let mut path = env::current_exe().expect("failed to get current exe path");
    path.pop();
    path
}

pub fn create_file(path: &Path) -> Result<File> {
    if let Some(p) = path.parent() {
        fs::create_dir_all(p)?
    }
    File::create(path).map_err(Into::into)
}

pub fn get_proxy_client() -> anyhow::Result<reqwest::ClientBuilder, anyhow::Error> {
    let mut client_builder = reqwest::ClientBuilder::new();
    if !get_string("proxyServer").is_empty() {
        let proxy = reqwest::Proxy::all(format!(
            "{}://{}:{}",
            get_string("proxyProtocol"),
            get_string("proxyServer"),
            get_string("proxyPort")
       ))?;
       
       client_builder = client_builder.proxy(proxy);
    }

    Ok(client_builder)
}

pub async fn download_arraybuffer(url: String) -> anyhow::Result<Vec<u8>, anyhow::Error> {
    let client_builder = get_proxy_client()?;
    let client = client_builder.build()?;

    let response = client.get(url).send().await?;
    
    let bytes = response.bytes().await?;
    Ok(bytes.to_vec())

}

pub fn read_init_data_file(data_name: &str) -> String {
    let mut path = app_install_root();
    path = path.join("initData").join(data_name);
    if !exists(&path) {
        return "[]".to_string();
    }
    let contents = read_to_string(path)
    .expect("Should have been able to read the file");
    contents
}

pub mod cmd {

    use tauri::command;

    use super::download_arraybuffer;

    #[command(async)]
    pub async fn download_music_arraybuffer(url: String) -> Result<Vec<u8>, String> {
        let result = download_arraybuffer(url).await;
        match result {
            Ok(bytes) => Ok(bytes),
            Err(e) => Err(e.to_string()),
        }
    }
}
