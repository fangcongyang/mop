use crate::api::crypto::AesMode::{cbc, ecb};
use base64::{alphabet::Alphabet, engine::general_purpose, Engine};
use lazy_static::lazy_static;
use openssl::{
    hash::{hash, DigestBytes, MessageDigest},
    rsa::{Padding, Rsa},
    symm::{encrypt, Cipher},
};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};

use super::request::Request;

const IV: &[u8] = b"0102030405060708";
const PRESET_KEY: &[u8] = b"0CoJUm6Qyw8W8jud";
const LINUX_API_KEY: &[u8] = b"rFgB&h#%2?^eDg:Q";
const BASE62: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

lazy_static! {
    static ref RSA_PUBLIC_KEY: Vec<u8> = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB\n-----END PUBLIC KEY-----".as_bytes().to_vec();
    static ref EAPIKEY: Vec<u8> = "e82ckenh8dichen8".as_bytes().to_vec();
    static ref CUSTOM: Alphabet = Alphabet::new("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/").unwrap();
}

#[allow(non_camel_case_types)]
pub enum HashType {
    md5,
}

#[allow(non_camel_case_types)]
pub enum AesMode {
    cbc,
    ecb,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CryptoRequset {
    params: Option<String>,
    encSecKey: Option<String>,
    eparams: Option<String>
}

impl Request for CryptoRequset {
    fn set_csrf_token(&mut self, _csrf_token: String) {}
}

pub struct Crypto;

impl Crypto {

    pub fn eapi(url: &str, text: &str) -> CryptoRequset {
        let message = format!("nobody{}use{}md5forencrypt", url, text);
        let digest = hash_encrypt(&message, HashType::md5, hex::encode);
        let data = format!("{}-36cd479b6b5-{}-36cd479b6b5-{}", url, text, digest);
        let params = Self::aes_encrypt(&data, &*EAPIKEY, ecb, Some(IV), |t: &Vec<u8>| {
            hex::encode_upper(t)
        });
        CryptoRequset {
            params: Some(params),
            encSecKey: None,
            eparams: None
        }
    }

    pub fn weapi(text: &str) -> CryptoRequset {
        let mut secret_key = [0u8; 16];
        OsRng.fill_bytes(&mut secret_key);
        let key: Vec<u8> = secret_key
            .iter()
            .map(|i| BASE62[(i % 62) as usize])
            .collect();

        let base64_encode = |t: &Vec<u8>| {
            let mut buf = String::new();
            general_purpose::STANDARD.encode_string(&t, &mut buf);
            buf
        };

        let params1 = Crypto::aes_encrypt(text, PRESET_KEY, cbc, Some(IV), base64_encode);

        let params = Crypto::aes_encrypt(&params1, &key, cbc, Some(IV), base64_encode);

        let enc_sec_key = Crypto::rsa_encrypt(
            std::str::from_utf8(&key.iter().rev().map(|n| *n).collect::<Vec<u8>>()).unwrap(),
            &*RSA_PUBLIC_KEY,
        );
        
        CryptoRequset {
            params: Some(params),
            encSecKey: Some(enc_sec_key),
            eparams: None
        }
    }

    pub fn linuxapi(text: &str) -> CryptoRequset {
        let params = Crypto::aes_encrypt(text, LINUX_API_KEY, ecb, None, |t: &Vec<u8>| {
            hex::encode(t)
        })
        .to_uppercase();
        CryptoRequset {
            params: None,
            encSecKey: None,
            eparams: Some(params)
        }
    }

    pub fn aes_encrypt(
        data: &str,
        key: &[u8],
        mode: AesMode,
        iv: Option<&[u8]>,
        encode: fn(&Vec<u8>) -> String,
    ) -> String {
        let cipher = match mode {
            cbc => Cipher::aes_128_cbc(),
            ecb => Cipher::aes_128_ecb(),
        };
        let cipher_text = encrypt(cipher, key, iv, data.as_bytes()).unwrap();

        encode(&cipher_text)
    }

    pub fn rsa_encrypt(data: &str, key: &Vec<u8>) -> String {
        let rsa = Rsa::public_key_from_pem(key).unwrap();

        let prefix = vec![0u8; 128 - data.len()];

        let data = [&prefix[..], &data.as_bytes()[..]].concat();

        let mut buf = vec![0; rsa.size() as usize];

        rsa.public_encrypt(&data, &mut buf, Padding::NONE).unwrap();

        hex::encode(buf)
    }
}

pub fn hash_encrypt(
    data: &str,
    algorithm: HashType,
    encode: fn(DigestBytes) -> String,
) -> String {
    match algorithm {
        HashType::md5 => encode(hash(MessageDigest::md5(), data.as_bytes()).unwrap()),
    }
}