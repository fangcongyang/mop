use cached::proc_macro::cached;
use serde::{Serialize, Deserialize};
use serde_json::{Map, Value};
use tauri::{command, http::{header::USER_AGENT, HeaderMap}};

use crate::utils::{choose_user_agent, create_request_builder};

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

#[command]
#[cached(time = 86400, option = false)]
pub async fn github_repos_info_version(owner: String, repo: String) -> Option<String> {
    let url = format!("https://api.github.com/repos/{}/{}/releases/latest", owner, repo);
    let mut client_builder = create_request_builder();
    let mut headers: HeaderMap = HeaderMap::new();
    headers.insert(
        USER_AGENT,
        serde_json::to_value(choose_user_agent("pc"))
            .unwrap()
            .as_str()
            .unwrap()
            .parse()
            .unwrap(),
    );
    client_builder = client_builder.default_headers(headers);
    let client = client_builder
        .build()
        .unwrap();
    let response = client.get(url).send().await.unwrap();
    match response.text().await {
        Ok(d) => {
            let data: Map<String, Value> = serde_json::from_str(&d).unwrap();
            if let Some(v) = data.get("tag_name") {
                match v {
                    Value::String(tag_name) => Some(tag_name.to_owned()),
                    _ => None,
                }
            } else {
                None
            }
        }
        Err(_r) => None,
    }
}