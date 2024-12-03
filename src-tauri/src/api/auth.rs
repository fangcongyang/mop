use serde::{Serialize, Deserialize};
use tauri::command;
use tauri_plugin_crypto::{CryptoExt, CryptoResponse, HashEncryptRequest};

use crate::APP;

use super::{crypto::HashType, request::{request_handler, LocalCookie, Options, Request, CRYPTO_WEAPI}};

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct LoginCellphoneReq {
    phone: String,
    captcha: Option<String>,
    countrycode: Option<String>,
    password: Option<String>,
    md5_password: Option<String>,
    rememberLogin: Option<String>,
    pub csrf_token: Option<String>
}

impl Request for LoginCellphoneReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn login_cellphone(mut data: LoginCellphoneReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/login/cellphone";
    if data.captcha.is_none() {
        let password;
        if data.md5_password.is_some() {
            password = data.clone().md5_password;
        } else {
            let app = APP.get().unwrap();
            let digest = app
                .crypto()
                .hash_encrypt(HashEncryptRequest {
                    data: data.password.unwrap_or_default(),
                    algorithm: HashType::md5.to_string(),
                })
                .unwrap_or(CryptoResponse::default());
            password = Some(digest.value);
        }
        data.password = password;
    }
    data.rememberLogin = Some("true".to_owned());
    
    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie{ 
        os: Some("ios".to_owned()), 
        appver: Some("8.20.21".to_owned())
    });
    options.ua = Some("pc".to_owned());
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct LoginReq {
    username: String,
    password: Option<String>,
    md5_password: Option<String>,
    rememberLogin: Option<String>,
    pub csrf_token: Option<String>
}

impl Request for LoginReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn login(mut data: LoginReq) -> serde_json::Value {
    let url = "https://music.163.com/api/login";
    let password;
    if data.md5_password.is_some() {
        password = data.clone().md5_password;
    } else {
        let app = APP.get().unwrap();
        let digest = app
            .crypto()
            .hash_encrypt(HashEncryptRequest {
                data: data.password.unwrap_or_default(),
                algorithm: HashType::md5.to_string(),
            })
            .unwrap_or(CryptoResponse::default());
        password = Some(digest.value);
    }
    data.password = password;
    data.rememberLogin = Some("true".to_owned());
    
    let mut options = Options::new(Some(CRYPTO_WEAPI));
    options.cookie = Some(LocalCookie{ 
        os: Some("ios".to_owned()), 
        appver: Some("8.20.21".to_owned())
    });
    options.ua = Some("pc".to_owned());
    request_handler(url, data, options).await
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct QrCodeReq {
    pub r#type: Option<String>,
    pub key: Option<String>,
    pub c: Option<String>,
    pub realIP: Option<String>,
    pub csrf_token: Option<String>
}

impl Request for QrCodeReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

#[command]
pub async fn login_qr_codekey(mut data: QrCodeReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/login/qrcode/unikey";
    data.r#type = Some("1".to_owned());

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}

#[command]
pub async fn login_qr_check(mut data: QrCodeReq) -> serde_json::Value {
    let url = "https://music.163.com/weapi/login/qrcode/client/login";
    data.r#type = Some("1".to_owned());

    let options = Options::new(Some(CRYPTO_WEAPI));
    request_handler(url, data, options).await
}