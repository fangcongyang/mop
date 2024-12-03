use base64::{engine::general_purpose, Engine};
use cached::proc_macro::cached;
use regex::Regex;
use reqwest::header;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::command;
use tauri_plugin_crypto::{CryptoExt, CryptoResponse, HashEncryptRequest};
use tauri_plugin_http::reqwest;

use crate::{api::crypto::HashType, APP};

use super::request::{
    request_handler, save_cookie_string, EmptyReq, LocalCookie, Options, Request, CRYPTO_WEAPI,
};

#[command]
pub async fn user_account(data: EmptyReq) -> serde_json::Value {
    let url = "https://music.163.com/api/nuser/account/get";

    let options = Options::new(Some(CRYPTO_WEAPI));
    let value = request_handler(url, data, options).await;
    save_cookie_string();
    value
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct UserPlaylistReq {
    pub uid: i64,
    pub limit: i16,
    pub offset: Option<i8>,
    pub csrf_token: Option<String>,
}

impl Request for UserPlaylistReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn user_playlist(mut data: UserPlaylistReq) -> serde_json::Value {
    let url = "https://music.163.com/api/user/playlist";
    if data.offset.is_none() {
        data.offset = Some(0i8);
    }
    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct UserLikeSongsReq {
    pub uid: i64,
    pub csrf_token: Option<String>,
}

impl Request for UserLikeSongsReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn user_like_songs_ids(data: UserLikeSongsReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/song/like/get";
    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct CloudDelReq {
    id: String,
    songIds: Option<Vec<String>>,
    pub csrf_token: Option<String>,
}

impl Request for CloudDelReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn cloud_del(mut data: CloudDelReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/cloud/del";
    if data.songIds.is_none() {
        data.songIds = Some(vec![data.id.clone()]);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct UserCloudReq {
    limit: Option<i16>,
    offset: Option<i16>,
    pub csrf_token: Option<String>,
}

impl Request for UserCloudReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn user_cloud(mut data: UserCloudReq) -> serde_json::Value {
    let url = "https://music.163.com/api/v1/cloud/get";
    if data.limit.is_none() {
        data.limit = Some(30);
    }
    if data.offset.is_none() {
        data.offset = Some(0);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct UserRecordReq {
    uid: String,
    r#type: Option<i8>,
    pub csrf_token: Option<String>,
}

impl Request for UserRecordReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
#[cached(option = false)]
pub async fn user_record(mut data: UserRecordReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/v1/play/record";
    if data.r#type.is_none() {
        data.r#type = Some(0);
    }

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Clone)]
pub struct Metadata {
    artist: Option<String>,
    album: Option<String>,
    songName: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UploadFileArgs {
    name: String,
    content: Option<String>,
    md5: Option<String>,
    size: Option<usize>,
    metadata: Metadata,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct CloudReq {
    pub csrf_token: Option<String>,
}

impl Request for CloudReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn cloud(mut file: UploadFileArgs) -> serde_json::Value {
    if file.content.is_none() {
        return json!({
            "status": 500,
            "body": {
                "msg": "请上传音乐文件",
                "code": 500,
            }
        });
    }
    let mut ext = "mp3".to_owned();
    if file.name.contains("flac") {
        ext = "flac".to_owned();
    }

    let re_ext = format!(r"\.{}$", ext);
    let filename = Regex::new(&re_ext)
        .unwrap()
        .replace(&file.name, "")
        .to_string();

    // Replace whitespace with an underscore
    let filename = Regex::new(r"\s")
        .unwrap()
        .replace_all(&filename, "_")
        .to_string();

    // Replace '.' with an underscore
    let filename = Regex::new(r"\.")
        .unwrap()
        .replace_all(&filename, "_")
        .to_string();

    let mut options = Options::new(Some(CRYPTO_WEAPI));

    options.cookie = Some(LocalCookie {
        os: Some("pc".to_owned()),
        appver: Some("2.9.7".to_owned()),
    });

    let bitrate = "999000";

    let content = general_purpose::STANDARD
        .decode(file.content.clone().unwrap())
        .unwrap_or("".into());

    let app = APP.get().unwrap();
    let digest = app
        .crypto()
        .hash_encrypt(HashEncryptRequest {
            data: String::from_utf8(content.clone()).unwrap(),
            algorithm: HashType::md5.to_string(),
        })
        .unwrap_or(CryptoResponse::default());
    if file.md5.is_none() {
        file.md5 = Some(digest.value);
        file.size = Some(content.len());
    }

    let file1 = file.clone();

    let cloud_upload_check_res = cloud_upload_check(CloudUploadCheck::new(
        bitrate.to_owned(),
        file1.size.unwrap() as i64,
        file1.md5.unwrap(),
    ))
    .await;
    let mut token_alloc_data = TokenAlloc::new(ext, filename.clone(), file.md5.clone().unwrap());
    let tokio_alloc_res = token_alloc(token_alloc_data.clone()).await;

    let file2 = file.clone();
    match cloud_upload_check_res {
        serde_json::Value::Object(cloud_upload_check_res) => {
            if cloud_upload_check_res["body"]["needUpload"]
                .as_bool()
                .unwrap()
            {
                let bucket = "jd-musicrep-privatecloud-audio-public";
                token_alloc_data.bucket = bucket.to_owned();
                let upload_tokio_alloc_res = token_alloc(token_alloc_data).await;

                match upload_tokio_alloc_res {
                    serde_json::Value::Object(upload_tokio_alloc_res) => {
                        let token = upload_tokio_alloc_res["body"]["result"]["token"]
                            .as_str()
                            .unwrap();
                        let object_key = upload_tokio_alloc_res["body"]["result"]["objectKey"]
                            .as_str()
                            .unwrap()
                            .replace("/", "%2F");
                        let lbs_res = reqwest::get(format!(
                            "https://wanproxy.127.net/lbs?version=1.0&bucketname={}",
                            bucket
                        ))
                        .await;
                        let lbs_json_data = lbs_res
                            .unwrap()
                            .json::<serde_json::Value>()
                            .await
                            .unwrap_or(serde_json::Value::Null);
                        match lbs_json_data {
                            serde_json::Value::Object(lbs) => {
                                let mut headers = header::HeaderMap::new();
                                headers.insert("x-nos-token", token.parse().unwrap());
                                headers.insert("Content-MD5", bucket.parse().unwrap());
                                headers.insert("Content-Type", "audio/mpeg".parse().unwrap());
                                headers.insert(
                                    "Content-Length",
                                    file2.size.unwrap().to_string().parse().unwrap(),
                                );
                                let client = reqwest::Client::builder()
                                    .default_headers(headers)
                                    .build()
                                    .unwrap();
                                let upload_res = client
                                    .post(format!(
                                        "http://{}/{}/{}?offset=0&complete=true&version=1.0",
                                        lbs["upload"][0], bucket, object_key
                                    ))
                                    .body(file2.content.unwrap().clone())
                                    .send()
                                    .await;
                                if !upload_res.is_ok() {
                                    return json!({
                                        "status": 500,
                                        "body": {
                                            "msg": "上传音乐文件失败",
                                            "code": 500,
                                        }
                                    });
                                }
                            }
                            _ => {
                                return json!({
                                    "status": 500,
                                    "body": {
                                        "msg": "上传音乐文件失败",
                                        "code": 500,
                                    }
                                })
                            }
                        }
                    }
                    _ => {
                        return json!({
                            "status": 500,
                            "body": {
                                "msg": "上传音乐文件失败",
                                "code": 500,
                            }
                        })
                    }
                }
            }

            if tokio_alloc_res.is_object() {
                let upload_cloud_info_v2_res = upload_cloud_info_v2(UploadCloudInfoV2::new(
                    file.md5.unwrap(),
                    cloud_upload_check_res["body"]["songId"]
                        .to_owned()
                        .to_string(),
                    filename,
                    file.metadata,
                    bitrate.to_owned(),
                    tokio_alloc_res.as_object().unwrap()["body"]["result"]["resourceId"]
                        .to_string(),
                ))
                .await;
                if upload_cloud_info_v2_res.is_object() {
                    let songid = upload_cloud_info_v2_res["body"]["songId"]
                        .to_owned()
                        .to_string();
                    let cloud_pub_v2_res = cloud_pub_v2(CloudPubV2::new(songid)).await;
                    return merge_json_values(upload_cloud_info_v2_res, cloud_pub_v2_res);
                }
            }
        }
        _ => {}
    }
    json!({
        "status": 500,
        "body": {
            "msg": "上传音乐文件失败",
            "code": 500,
        }
    })
}

fn merge_json_values(base: serde_json::Value, overlay: serde_json::Value) -> serde_json::Value {
    // Ensure both values are objects
    if let (serde_json::Value::Object(mut base_map), serde_json::Value::Object(overlay_map)) =
        (base, overlay.clone())
    {
        // Merge overlay into base
        for (key, value) in overlay_map {
            // If the key already exists in base, merge the values recursively
            if let Some(base_value) = base_map.get_mut(&key) {
                *base_value = merge_json_values(base_value.clone(), value);
            } else {
                // Otherwise, insert the key-value pair
                base_map.insert(key, value);
            }
        }
        // Return the merged map as a Value
        serde_json::Value::Object(base_map)
    } else {
        // If one of the values is not an object, return the overlay value
        overlay
    }
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct CloudUploadCheck {
    bitrate: String,
    ext: String,
    length: i64,
    md5: String,
    songId: String,
    version: i8,
    csrf_token: Option<String>,
}

impl CloudUploadCheck {
    pub fn new(bitrate: String, length: i64, md5: String) -> Self {
        Self {
            bitrate,
            ext: "".to_owned(),
            length,
            md5,
            songId: "0".to_owned(),
            version: 1,
            csrf_token: None,
        }
    }
}

impl Request for CloudUploadCheck {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

async fn cloud_upload_check(data: CloudUploadCheck) -> serde_json::Value {
    let url = "https://interface.music.163.com/api/cloud/upload/check";

    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie {
        os: Some("pc".to_owned()),
        appver: Some("2.9.7".to_owned()),
    });
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct TokenAlloc {
    bucket: String,
    ext: String,
    filename: String,
    local: bool,
    nos_product: i8,
    r#type: String,
    md5: String,
    csrf_token: Option<String>,
}

impl TokenAlloc {
    pub fn new(ext: String, filename: String, md5: String) -> Self {
        Self {
            bucket: "".to_owned(),
            ext,
            filename,
            local: false,
            nos_product: 3,
            r#type: "audio".to_owned(),
            md5,
            csrf_token: None,
        }
    }
}

impl Request for TokenAlloc {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

async fn token_alloc(data: TokenAlloc) -> serde_json::Value {
    let url = "https://music.163.com/weapi/nos/token/alloc";

    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie {
        os: Some("pc".to_owned()),
        appver: Some("2.9.7".to_owned()),
    });
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct UploadCloudInfoV2 {
    md5: String,
    songid: String,
    filename: String,
    song: Option<String>,
    album: Option<String>,
    artist: Option<String>,
    bitrate: String,
    resourceId: String,
    csrf_token: Option<String>,
}

impl UploadCloudInfoV2 {
    pub fn new(
        md5: String,
        songid: String,
        filename: String,
        mut metadata: Metadata,
        bitrate: String,
        resource_id: String,
    ) -> Self {
        if metadata.songName.is_none() {
            metadata.songName = Some(filename.clone());
        }
        if metadata.album.is_none() {
            metadata.album = Some("未知专辑".to_owned());
        }
        if metadata.artist.is_none() {
            metadata.artist = Some("未知艺术家".to_owned());
        }
        Self {
            md5,
            songid,
            filename,
            song: metadata.songName,
            album: metadata.album,
            artist: metadata.artist,
            bitrate,
            resourceId: resource_id,
            csrf_token: None,
        }
    }
}

impl Request for UploadCloudInfoV2 {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

async fn upload_cloud_info_v2(data: UploadCloudInfoV2) -> serde_json::Value {
    let url = "https://music.163.com/api/upload/cloud/info/v2";

    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie {
        os: Some("pc".to_owned()),
        appver: Some("2.9.7".to_owned()),
    });
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct CloudPubV2 {
    songid: String,
    csrf_token: Option<String>,
}

impl CloudPubV2 {
    pub fn new(songid: String) -> Self {
        Self {
            songid,
            csrf_token: None,
        }
    }
}

impl Request for CloudPubV2 {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

async fn cloud_pub_v2(data: CloudPubV2) -> serde_json::Value {
    let url = "https://interface.music.163.com/api/cloud/pub/v2";

    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie {
        os: Some("pc".to_owned()),
        appver: Some("2.9.7".to_owned()),
    });
    request_handler(url, data, options).await
}
