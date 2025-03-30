use cached::proc_macro::cached;
use serde::{Deserialize, Serialize};
use tauri::command;

use super::request::{request_handler, Options, Request, CRYPTO_WEAPI};

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct AlbumReq {
    id: String,
    c: Option<String>,
    pub csrf_token: Option<String>,
}

impl Request for AlbumReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn get_album(data: AlbumReq) -> serde_json::Value {
    let mut url = "https://music.163.com/weapi/v1/album/".to_string();
    url.push_str(&data.id);

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(&url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct AlbumNewReq {
    pub limit: Option<i8>,
    pub offset: Option<i8>,
    pub total: Option<bool>,
    pub area: Option<String>,
    pub csrf_token: Option<String>,
}

impl Request for AlbumNewReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn album_new(mut data: AlbumNewReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/album/new";
    if data.limit.is_none() {
        data.limit = Some(30);
    }
    if data.offset.is_none() {
        data.offset = Some(0);
    }
    if data.total.is_none() {
        data.total = Some(true);
    }
    if data.area.is_none() {
        data.area = Some("ALL".to_owned());
    }

    let options = Options::new(Some(CRYPTO_WEAPI));

    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct AlbumSublistReq {
    pub limit: i16,
    pub offset: Option<i16>,
    pub total: Option<bool>,
    pub csrf_token: Option<String>,
}

impl Request for AlbumSublistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn album_sublist(mut data: AlbumSublistReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/album/sublist";
    if data.offset.is_none() {
        data.offset = Some(0);
    }
    if data.total.is_none() {
        data.total = Some(true);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct AlbumSubReq {
    pub id: String,
    pub t: String,
    pub csrf_token: Option<String>,
}

impl Request for AlbumSubReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn album_sub(data: AlbumSubReq) -> serde_json::Value {
    let mut url = "https://music.163.com/api/album/".to_string();
    url = format!("{}{}", url, data.t);

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(&url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ArtistAlbumsReq {
    id: String,
    pub limit: Option<i16>,
    pub offset: Option<i16>,
    pub total: Option<bool>,
    pub csrf_token: Option<String>,
}

impl Request for ArtistAlbumsReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn artist_albums(mut data: ArtistAlbumsReq) -> serde_json::Value {
    let mut url = "https://music.163.com/weapi/artist/albums/".to_string();
    url = format!("{}{}", url, data.id);
    if data.limit.is_none() {
        data.limit = Some(30);
    }
    if data.offset.is_none() {
        data.offset = Some(0);
    }
    if data.total.is_none() {
        data.total = Some(true);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(&url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct AlbumDetailDynamicReq {
    id: String,
    pub csrf_token: Option<String>,
}

impl Request for AlbumDetailDynamicReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn album_detail_dynamic(data: AlbumDetailDynamicReq) -> serde_json::Value {
    let url = "https://music.163.com/api/album/detail/dynamic";

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}
