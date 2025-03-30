use cached::proc_macro::cached;
use serde::{Deserialize, Serialize};
use tauri::command;

use super::request::{request_handler, Options, Request, CRYPTO_WEAPI};

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct MVSubReq {
    pub mvId: i32,
    pub mvIds: Option<String>,
    pub t: String,
    pub csrf_token: Option<String>,
}

impl Request for MVSubReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn mv_sub(mut data: MVSubReq) -> serde_json::Value {
    let mut url = "https://music.163.com/weapi/mv/".to_string();
    url = format!("{}{}", url, data.t);
    if data.mvIds.is_none() {
        data.mvIds = Some(format!("[{}]", data.mvId))
    }
    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(&url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct MVDetailReq {
    pub id: String,
    pub csrf_token: Option<String>,
}

impl Request for MVDetailReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn mv_detail(data: MVDetailReq) -> serde_json::Value {
    let url = "https://music.163.com/api/v1/mv/detail";
    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct MVUrlReq {
    id: String,
    r: Option<i16>,
    pub csrf_token: Option<String>,
}

impl Request for MVUrlReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn mv_url(mut data: MVUrlReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/song/enhance/play/mv/url";
    if data.r.is_none() {
        data.r = Some(1080);
    }
    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct SimiMVReq {
    pub mvid: String,
    pub csrf_token: Option<String>,
}

impl Request for SimiMVReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn simi_mv(data: SimiMVReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/discovery/simiMV";
    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct MVSublistReq {
    pub limit: Option<i16>,
    pub offset: Option<i16>,
    pub total: Option<bool>,
    pub csrf_token: Option<String>,
}

impl Request for MVSublistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn mv_sublist(mut data: MVSublistReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/cloudvideo/allvideo/sublist";
    if data.limit.is_none() {
        data.limit = Some(25);
    }
    if data.offset.is_none() {
        data.offset = Some(0);
    }
    if data.total.is_none() {
        data.total = Some(true);
    }
    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}
