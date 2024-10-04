use cached::proc_macro::cached;
use serde::{Deserialize, Serialize};
use tauri::command;

use super::request::{request_handler, Options, Request, CRYPTO_WEAPI};

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ToplistArtistReq {
    pub r#type: Option<i8>,
    pub limit: Option<i8>,
    pub offset: Option<i8>,
    pub total: Option<bool>,
    pub csrf_token: Option<String>,
}

impl Request for ToplistArtistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn toplist_artist(mut data: ToplistArtistReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/toplist/artist";
    if data.r#type.is_none() {
        data.r#type = Some(1);
    }
    if data.limit.is_none() {
        data.limit = Some(100);
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

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ArtistSublistReq {
    pub limit: Option<i16>,
    pub offset: Option<i16>,
    pub total: Option<bool>,
    pub csrf_token: Option<String>,
}

impl Request for ArtistSublistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn artist_sublist(mut data: ArtistSublistReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/artist/sublist";
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

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ArtistSubReq {
    pub artistId: String,
    pub artistIds: Option<String>,
    pub t: String,
    pub csrf_token: Option<String>
}

impl Request for ArtistSubReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn artist_sub(mut data: ArtistSubReq) -> serde_json::Value {
    let mut url = "https://music.163.com/weapi/artist/".to_string();
    url = format!("{}{}", url, data.t);
    if data.artistIds.is_none() {
        data.artistIds = Some(format!("[{}]", data.artistId))
    }

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(&url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ArtistsReq {
    pub id: String,
    pub csrf_token: Option<String>
}

impl Request for ArtistsReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn artists(data: ArtistsReq) -> serde_json::Value {
    let mut url = "https://music.163.com/weapi/v1/artist/".to_string();
    url = format!("{}{}", url, data.id);

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(&url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ArtistMvReq {
    artistId: String,
    pub limit: Option<i16>,
    pub offset: Option<i16>,
    pub total: Option<bool>,
    pub csrf_token: Option<String>,
}

impl Request for ArtistMvReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn artist_mv(mut data: ArtistMvReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/artist/mvs";
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

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct SimiArtistReq {
    artistid: String,
    pub csrf_token: Option<String>,
}

impl Request for SimiArtistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn simi_artist(data: SimiArtistReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/discovery/simiArtist";
    let options = Options::new(Some(CRYPTO_WEAPI));
    
    request_handler(url, data, options).await
}