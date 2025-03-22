use anyhow::Result;
use rand::Rng;
use tauri::{path::BaseDirectory, Manager};
use tauri_plugin_http::reqwest::{self, ClientBuilder};
use std::{
    env,
    fs::{self, read_to_string, File},
    path::{Path, PathBuf},
};
use crate::{conf::get_string, APP};

const USER_AGENT_LIST: [&str; 14] = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
    "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89;GameHelper",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1",
    "Mozilla/5.0 (iPad; CPU OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:46.0) Gecko/20100101 Firefox/46.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/603.2.4 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.4",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:46.0) Gecko/20100101 Firefox/46.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/13.1058",
];

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

pub fn get_proxy_client(from: String) -> anyhow::Result<reqwest::ClientBuilder, anyhow::Error> {
    let mut client_builder = reqwest::ClientBuilder::new();
    let unm_proxy_uri = get_string("unmProxyUri");
    if from == "unm:ytdl" && !unm_proxy_uri.is_empty() {
        let proxy = reqwest::Proxy::all(unm_proxy_uri)?;
       
       client_builder = client_builder.proxy(proxy);
    }

    Ok(client_builder)
}

pub async fn download_arraybuffer(url: String, from: String) -> anyhow::Result<Vec<u8>, anyhow::Error> {
    let client_builder = get_proxy_client(from)?;
    let client = client_builder.build()?;

    let response = client.get(url).send().await?;
    
    let bytes = response.bytes().await?;
    Ok(bytes.to_vec())

}

pub fn create_dir_if_not_exists(path: &Path) -> Result<()> {
    if let Some(p) = path.parent() {
        fs::create_dir_all(p)?
    }
    Ok(())
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

pub fn create_request_builder() -> ClientBuilder {
    let client_builder = reqwest::ClientBuilder::new();
    if get_string("proxyProtocol") == "noProxy" || get_string("proxyProtocol") == "" {
        client_builder.no_proxy()
    } else {
        let proxy_url = format!("{}://{}:{}", get_string("proxyProtocol"), get_string("proxyServer"), get_string("proxyPort"));
        client_builder.proxy(reqwest::Proxy::http(proxy_url).unwrap())
    }
}

pub fn choose_user_agent(ua: &str) -> &str {
    let mut rng = rand::rng();
    let i: usize = rng.random_range(0..usize::MAX);
    let index = if ua == "mobile" {
        i % 7
    } else if ua == "pc" {
        i % 5 + 8
    } else if ua.is_empty() {
        i % USER_AGENT_LIST.len()
    } else {
        return ua;
    };
    USER_AGENT_LIST[index]
}

pub mod cmd {

    use tauri::command;

    use super::download_arraybuffer;

    #[command(async)]
    pub async fn download_music_arraybuffer(url: String, from: String) -> Result<Vec<u8>, String> {
        let result = download_arraybuffer(url, from).await;
        match result {
            Ok(bytes) => Ok(bytes),
            Err(e) => Err(e.to_string()),
        }
    }
}
