use cached::proc_macro::cached;
use serde::{Serialize, Deserialize};
use tauri::command;

use super::request::{request_handler, EmptyReq, Options, Request, CRYPTO_WEAPI};

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct SearchReq {
    keywords: String,
    keyword: Option<String>,
    s: Option<String>,
    // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
    r#type: Option<i16>,
    scene: Option<String>,
    limit: Option<i16>,
    offset: Option<i16>,
    pub csrf_token: Option<String>
}

impl Request for SearchReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn search(mut data: SearchReq) -> serde_json::Value {
    let mut url = "https://music.163.com/weapi/search/get";
    if data.r#type.is_some() && data.clone().r#type.unwrap() == 2000 {
        url = "https://music.163.com/api/search/voice/get";
        data.scene = Some("normal".to_owned());
        data.keyword = Some(data.clone().keywords);
    } else {
        if data.r#type.is_none() {
            data.r#type = Some(1.to_owned());
        }
        data.s = Some(data.clone().keywords);
    }
    if data.limit.is_none() {
        data.limit = Some(30);
    }
    if data.offset.is_none() {
        data.offset = Some(0);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(&url, data, options).await
}

#[command]
pub async fn personal_fm(data: EmptyReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/v1/radio/get";
    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct FmTrashReq {
    pub id: i32,
    pub time: Option<i8>,
    pub csrf_token: Option<String>
}

impl Request for FmTrashReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn fm_trash(data: FmTrashReq) -> serde_json::Value {
    let url = format!("https://music.163.com/weapi/radio/trash/add?alg=RT&songId={}&time={}", data.id, data.time.unwrap_or(25));
    
    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(&url, data, options).await
}