use cached::proc_macro::cached;
use regex::Regex;
use serde::{Deserialize, Serialize};
use tauri::command;

use super::request::{
    request_handler, EmptyReq, LocalCookie, Options, Request, CRYPTO_API, CRYPTO_WEAPI,
};

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct PlaylistDetailReq {
    pub id: i64,
    pub n: Option<u32>,
    pub s: Option<i8>,
    pub csrf_token: Option<String>,
}

impl Request for PlaylistDetailReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn get_playlist_detail(mut data: PlaylistDetailReq) -> serde_json::Value {
    let url = "https://music.163.com/api/v6/playlist/detail";
    if data.n.is_none() {
        data.n = Some(100000u32);
    }
    if data.s.is_none() {
        data.s = Some(8);
    }

    let options = Options::new(Some(CRYPTO_API));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct PlaymodeIntelligenceListReq {
    pub songId: i64,
    pub r#type: Option<String>,
    pub playlistId: Option<i8>,
    pub startMusicId: Option<i8>,
    pub count: Option<i8>,
    pub csrf_token: Option<String>,
}

impl Request for PlaymodeIntelligenceListReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(time = 120, option = false)]
pub async fn playmode_intelligence_list(
    mut data: PlaymodeIntelligenceListReq,
) -> serde_json::Value {
    let url = "https://music.163.com/weapi/playmode/intelligence/list";
    if data.r#type.is_none() {
        data.r#type = Some("fromPlayOne".to_owned());
    }
    if data.count.is_none() {
        data.count = Some(1);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[command]
#[cached(option = false)]
pub async fn daily_recommend_playlist(data: EmptyReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/v1/discovery/recommend/resource";
    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct RecommendPlaylistReq {
    pub limit: Option<i16>,
    pub total: Option<bool>,
    pub n: Option<i32>,
    pub csrf_token: Option<String>,
}

impl Request for RecommendPlaylistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn recommend_playlist(mut data: RecommendPlaylistReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/personalized/playlist";
    if data.limit.is_none() {
        data.limit = Some(30);
    }
    if data.total.is_none() {
        data.total = Some(true);
    }
    if data.n.is_none() {
        data.n = Some(1000);
    }
    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct TopPlaylistReq {
    pub cat: Option<String>,
    pub order: Option<String>,
    pub limit: Option<i16>,
    pub offset: Option<i16>,
    pub total: Option<bool>,
    pub csrf_token: Option<String>,
}

impl Request for TopPlaylistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn top_playlist(mut data: TopPlaylistReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/playlist/list";
    if data.cat.is_none() {
        data.cat = Some("全部".to_owned());
    }
    if data.order.is_none() {
        data.order = Some("hot".to_owned());
    }
    if data.limit.is_none() {
        data.limit = Some(50);
    }
    if data.offset.is_none() {
        data.offset = Some(0);
    }
    if data.total.is_none() {
        data.total = Some(true);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));

    let response = serde_json::to_string(&request_handler(url, data, options).await).unwrap();
    let r = Regex::new(r"avatarImgId_str").unwrap();
    let new_response = r.replace(&response, "avatarImgIdStr");
    serde_json::from_str(&new_response).unwrap()
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct TopPlaylistHighQualityReq {
    pub cat: Option<String>,
    pub limit: Option<i16>,
    pub lasttime: Option<i64>,
    pub total: Option<bool>,
    pub csrf_token: Option<String>,
}

impl Request for TopPlaylistHighQualityReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn top_playlist_high_quality(mut data: TopPlaylistHighQualityReq) -> serde_json::Value {
    let url = "https://music.163.com/api/playlist/highquality/list";
    if data.cat.is_none() {
        data.cat = Some("全部".to_owned());
    }
    if data.limit.is_none() {
        data.limit = Some(50);
    }
    if data.lasttime.is_none() {
        data.lasttime = Some(0);
    }
    if data.total.is_none() {
        data.total = Some(true);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ToplistReq {
    pub csrf_token: Option<String>,
}

impl Request for ToplistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn top_list(data: ToplistReq) -> serde_json::Value {
    let url = "https://music.163.com/api/toplist";
    let options = Options::new(Some(CRYPTO_API));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct RecommendSongsReq {
    pub csrf_token: Option<String>,
}

impl Request for RecommendSongsReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn recommend_songs(data: RecommendSongsReq) -> serde_json::Value {
    let url = "https://music.163.com/api/v3/discovery/recommend/songs";
    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct PlaylistSubscribeReq {
    id: String,
    t: String,
    pub csrf_token: Option<String>,
}

impl Request for PlaylistSubscribeReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn playlist_subscribe(data: PlaylistSubscribeReq) -> serde_json::Value {
    let mut url = "https://music.163.com/weapi/playlist/".to_string();
    url = format!("{}{}", url, data.id);

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(&url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct PlaylistTracksReq {
    op: String,
    pid: String,
    tracks: String,
    trackIds: Option<String>,
    imme: Option<String>,
    pub csrf_token: Option<String>,
}

impl Request for PlaylistTracksReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn playlist_tracks(mut data: PlaylistTracksReq) -> serde_json::Value {
    let mut url: &str = "https://music.163.com/weapi/playlist/manipulate/tracks";
    let mut ids: Vec<_> = data.tracks.split(",").collect();
    data.trackIds = Some(serde_json::to_string(&ids.clone()).unwrap_or("".to_owned()));
    if data.imme.is_none() {
        data.imme = Some("true".to_owned());
    }

    let options = Options::new(Some(CRYPTO_WEAPI));
    let result = request_handler(&url, data.clone(), options.clone()).await;
    match result {
        serde_json::Value::Object(result_data) => {
            if result_data.get("code").unwrap() == 512 {
                url = "https://music.163.com/api/playlist/manipulate/tracks";
                ids.extend(ids.clone());
                data.trackIds = Some(serde_json::to_string(&ids).unwrap_or("".to_owned()));
                request_handler(&url, data, options).await
            } else {
                serde_json::Value::Object(result_data)
            }
        }
        _ => result,
    }
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct PlaylistRemoveReq {
    id: String,
    ids: Option<String>,
    pub csrf_token: Option<String>,
}

impl Request for PlaylistRemoveReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn playlist_remove(mut data: PlaylistRemoveReq) -> serde_json::Value {
    let url: &str = "https://music.163.com/weapi/playlist/remove";
    data.ids = Some(format!("[{}]", data.id));

    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie {
        os: Some("pc".to_owned()),
        appver: None,
    });
    request_handler(&url, data.clone(), options.clone()).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct PlaylistCreateReq {
    name: String,
    privacy: String,
    r#type: Option<String>,
    pub csrf_token: Option<String>,
}

impl Request for PlaylistCreateReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn playlist_create(mut data: PlaylistCreateReq) -> serde_json::Value {
    let url: &str = "https://music.163.com/api/playlist/create";
    if data.r#type.is_none() {
        data.r#type = Some("NORMAL".to_owned());
    }

    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie {
        os: Some("pc".to_owned()),
        appver: None,
    });
    request_handler(&url, data.clone(), options.clone()).await
}
