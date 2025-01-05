use base64::{engine::general_purpose, Engine};
use engine::kugou::{KugouEngine, ENGINE_ID as KUGOU_ENGINE_ID};
use engine::ytdl::{YtDlEngine, ENGINE_ID as YTDL_ENGINE_ID};
use reqwest::header::{HeaderMap, REFERER, USER_AGENT};
use serde_json::Value;
use tauri_plugin_http::reqwest;
use std::{borrow::Cow, sync::Arc};
use tauri::command;
use executor::Executor;
use config::ConfigManagerBuilder;
use models::{
    ContextBuilder, RetrievedSongInfo, SearchMode, Song,
};

use crate::conf::get;
use crate::engine::config::ConfigManager;
use crate::engine::models::Context;
use crate::engine::{config, executor, models};
use crate::{engine, utils};

#[command]
pub async fn get_audio_source_from_unblock_music(song: Song) -> Option<RetrievedSongInfo> {
    let mut executor = Executor::new();
    let exe_path = utils::app_install_root().join("resources").join("yt-dlp");
    let config = ConfigManagerBuilder::new()
        .set("ytdl:exe", exe_path.into_os_string().into_string().unwrap())
        .build();

    
    
    let context = create_context(config);

    executor.register(Cow::Borrowed(YTDL_ENGINE_ID), Arc::new(YtDlEngine {}));
    // executor.register(
    //     Cow::Borrowed(BILIBILI_ENGINE_ID),
    //     Arc::new(BilibiliEngine {}),
    // );
    executor.register(Cow::Borrowed(KUGOU_ENGINE_ID), Arc::new(KugouEngine {}));
    // executor.register(Cow::Borrowed(QQ_ENGINE_ID), Arc::new(QQEngine {}));
    let search_result = executor
        .search(
            &[
                Cow::from(YTDL_ENGINE_ID),
                // Cow::from(BILIBILI_ENGINE_ID),
                Cow::from(KUGOU_ENGINE_ID),
                // Cow::from(QQ_ENGINE_ID),
            ],
            &song,
            &context,
        )
        .await;
    if search_result.is_ok() {
        let result = executor.retrieve(&search_result.unwrap(), &context).await;
        if result.is_ok() {
            let mut retrieved_song = result.unwrap();
            if retrieved_song.url.contains("bilivideo.com") {
                retrieved_song.url = get_bili_video_file(retrieved_song.url).await;
            }
            return Some(retrieved_song);
        }
    }
    None
}

fn create_context(config: ConfigManager) -> Context {
    let mut binding = ContextBuilder::default();
    let context_builder = binding
        .config(config)
        .search_mode(SearchMode::OrderFirst);

    let unm_proxy_uri: Option<Value> = get("unmProxyUri");
    match unm_proxy_uri {
        Some(Value::String(proxy_uri)) => {
            context_builder.proxy_uri(Some(Cow::Owned(proxy_uri)));
        }
        _ => {}
    }
    context_builder.build().unwrap()
}

async fn get_bili_video_file(url: String) -> String {
    let mut headers = HeaderMap::new();
    headers.append(REFERER, "https://www.bilibili.com/".parse().unwrap());
    headers.append(USER_AGENT, "okhttp/3.4.1".parse().unwrap());
    let client = reqwest::ClientBuilder::new()
        .default_headers(headers)
        .build()
        .unwrap();
    let response = client.get(url).send().await.unwrap();

    let mut buf = String::new();
    general_purpose::STANDARD.encode_string(&response.bytes().await.unwrap(), &mut buf);
    buf
}
