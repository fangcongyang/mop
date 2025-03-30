use serde::{Deserialize, Serialize};
use tauri::command;

use super::request::{
    request_handler, LocalCookie, Options, Request, CRYPTO_API, CRYPTO_EAPI, CRYPTO_WEAPI,
};

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct SongDetailReq {
    pub ids: Option<String>,
    pub c: Option<String>,
    pub realIP: Option<String>,
    pub csrf_token: Option<String>,
}

impl Request for SongDetailReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn get_song_detail(mut data: SongDetailReq) -> serde_json::Value {
    let url = "https://music.163.com/api/v3/song/detail";
    let id_str = data.ids.unwrap();
    let ids: Vec<_> = id_str.split(",").collect();
    let ids: Vec<_> = ids
        .iter()
        .map(|id| r#"{"id": "#.to_owned() + id + "}")
        .collect();
    data.c = Some(format!("{}{}{}", "[", ids.join(","), "]"));
    data.ids = None;
    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct SongUrlReq {
    pub id: String,
    pub ids: Option<String>,
    pub br: Option<i64>,
    pub csrf_token: Option<String>,
}

impl Request for SongUrlReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn get_song_url(mut data: SongUrlReq) -> serde_json::Value {
    let url = "https://interface3.music.163.com/eapi/song/enhance/player/url";
    let ids: Vec<_> = data.id.split(",").collect();
    data.ids = Some(serde_json::to_string(&ids).unwrap());
    if data.br.is_none() {
        data.br = Some(999000)
    }

    let mut options = Options::new(Some(CRYPTO_EAPI));
    options.url = Some("/api/song/enhance/player/url".to_owned());
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct LyricReq {
    pub id: i64,
    pub tv: Option<i8>,
    pub lv: Option<i8>,
    pub rv: Option<i8>,
    pub kv: Option<i8>,
    pub csrf_token: Option<String>,
}

impl Request for LyricReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn get_lyric(mut data: LyricReq) -> serde_json::Value {
    let url = "https://music.163.com/api/song/lyric?_nmclfl=1";
    if data.tv.is_none() {
        data.tv = Some(-1)
    }
    if data.lv.is_none() {
        data.lv = Some(-1)
    }
    if data.rv.is_none() {
        data.rv = Some(-1)
    }
    if data.kv.is_none() {
        data.kv = Some(-1)
    }
    let options = Options::new(Some(CRYPTO_API));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ScrobbleReq {
    pub id: i64,
    pub sourceid: String,
    pub time: i16,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct Scrobble {
    pub logs: String,
    pub csrf_token: Option<String>,
}

impl Request for Scrobble {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct Log {
    pub action: String,
    pub json: Json,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct Json {
    pub download: i16,
    pub end: String,
    pub id: i64,
    pub sourceId: String,
    pub time: i16,
    pub r#type: String,
    pub wifi: i16,
    pub source: String,
}

#[command]
pub async fn scrobble(data: ScrobbleReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/feedback/weblog";
    let log = Log {
        action: "play".to_owned(),
        json: Json {
            download: 0,
            end: "playend".to_owned(),
            id: data.id,
            sourceId: data.sourceid,
            time: data.time,
            r#type: "song".to_owned(),
            wifi: 0,
            source: "list".to_owned(),
        },
    };
    let new_data = Scrobble {
        logs: serde_json::to_string(&vec![log]).unwrap(),
        csrf_token: None,
    };
    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, new_data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct LikeReq {
    pub alg: Option<String>,
    pub trackId: i64,
    pub like: bool,
    pub time: Option<String>,
    pub csrf_token: Option<String>,
}

impl Request for LikeReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn like(mut data: LikeReq) -> serde_json::Value {
    let url = "https://music.163.com/api/radio/like";
    if data.alg.is_none() {
        data.alg = Some("itembased".into())
    }
    if data.time.is_none() {
        data.time = Some("3".into())
    }

    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie {
        os: Some("pc".into()),
        appver: Some("2.9.7".into()),
    });
    request_handler(url, data, options).await
}
