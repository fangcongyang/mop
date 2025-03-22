use std::fmt;

use crate::APP;
use base64::alphabet::Alphabet;
use lazy_static::lazy_static;
use rand::{rngs::OsRng, TryRngCore};
use serde::{Deserialize, Serialize};
use tauri_plugin_crypto::{
    AesCryptoRequest, CryptoExt, CryptoResponse, HashEncryptRequest, RsaCryptoRequest,
};

use super::request::Request;

const IV: &str = "0102030405060708";
const PRESET_KEY: &str = "0CoJUm6Qyw8W8jud";
const LINUX_API_KEY: &str = "rFgB&h#%2?^eDg:Q";
const BASE62: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const EAPIKEY: &str = "e82ckenh8dichen8";
const RSA_PUBLIC_KEY: &str = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB\n-----END PUBLIC KEY-----";

lazy_static! {
    static ref CUSTOM: Alphabet = Alphabet::new("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/").unwrap();
}

#[allow(non_camel_case_types)]
pub enum HashType {
    md5,
}
// 实现 Display trait
impl fmt::Display for HashType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            HashType::md5 => write!(f, "md5"),
        }
    }
}

#[allow(non_camel_case_types)]
pub enum AesMode {
    cbc,
    ecb,
}

// 实现 Display trait
impl fmt::Display for AesMode {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AesMode::cbc => write!(f, "cbc"),
            AesMode::ecb => write!(f, "ecb"),
        }
    }
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CryptoRequest {
    params: Option<String>,
    encSecKey: Option<String>,
    eparams: Option<String>,
}

impl Request for CryptoRequest {
    fn set_csrf_token(&mut self, _csrf_token: String) {}
}

pub struct Crypto;

impl Crypto {
    pub fn eapi(url: &str, text: &str) -> CryptoRequest {
        let message = format!("nobody{}use{}md5forencrypt", url, text);
        let app = APP.get().unwrap();
        let digest = app
            .crypto()
            .hash_encrypt(HashEncryptRequest {
                data: message,
                algorithm: HashType::md5.to_string(),
            })
            .unwrap_or(CryptoResponse::default());
        let data = format!("{}-36cd479b6b5-{}-36cd479b6b5-{}", url, text, digest.value);
        let params = app
            .crypto()
            .aes_encrypt(AesCryptoRequest {
                text: data,
                mode: AesMode::ecb.to_string(),
                key: EAPIKEY.to_owned(),
                iv: Some(IV.to_owned()),
                encode: "hex".to_owned(),
            })
            .unwrap_or_default();
        CryptoRequest {
            params: Some(params.value),
            encSecKey: None,
            eparams: None,
        }
    }

    pub fn weapi(text: &str) -> CryptoRequest {
        let mut secret_key = [0u8; 16];
        let _ = OsRng.try_fill_bytes(&mut secret_key);
        let key: Vec<u8> = secret_key
            .iter()
            .map(|i| BASE62[(i % 62) as usize])
            .collect();

        let app = APP.get().unwrap();

        let params1 = app
            .crypto()
            .aes_encrypt(AesCryptoRequest {
                text: text.to_owned(),
                mode: AesMode::cbc.to_string(),
                key: PRESET_KEY.to_owned(),
                iv: Some(IV.to_owned()),
                encode: "base64".to_owned(),
            })
            .unwrap_or_default();

        let params = app
            .crypto()
            .aes_encrypt(AesCryptoRequest {
                text: params1.value,
                mode: AesMode::cbc.to_string(),
                key: String::from_utf8(key.clone()).unwrap_or_default(),
                iv: Some(IV.to_owned()),
                encode: "base64".to_owned(),
            })
            .unwrap_or_default();

        let enc_sec_key = app
            .crypto()
            .rsa_encrypt(RsaCryptoRequest {
                data: std::str::from_utf8(&key.iter().rev().map(|n| *n).collect::<Vec<u8>>())
                    .unwrap().to_owned(),
                key: RSA_PUBLIC_KEY.to_owned(),
            })
            .unwrap_or_default();

            
        // info!("待加密的数据:{}，rsa加密后的数据:{}", text, enc_sec_key.value);
        CryptoRequest {
            params: Some(params.value),
            encSecKey: Some(enc_sec_key.value),
            eparams: None,
        }
    }

    pub fn linuxapi(text: &str) -> CryptoRequest {
        let app = APP.get().unwrap();
        let params = app
            .crypto()
            .aes_encrypt(AesCryptoRequest {
                text: text.to_owned(),
                mode: AesMode::ecb.to_string(),
                key: LINUX_API_KEY.to_owned(),
                iv: None,
                encode: "hex".to_owned(),
            })
            .unwrap_or_default();
        CryptoRequest {
            params: None,
            encSecKey: None,
            eparams: Some(params.value.to_uppercase()),
        }
    }
}
