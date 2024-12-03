use base64::{engine::general_purpose, Engine};
use log::info;
use openssl::{
    hash::{hash, MessageDigest},
    rsa::{Padding, Rsa},
    symm::{encrypt, Cipher},
};
use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<Crypto<R>> {
    Ok(Crypto(app.clone()))
}

pub fn base64_encode(t: &Vec<u8>) -> String {
    let mut buf = String::new();
    general_purpose::STANDARD.encode_string(&t, &mut buf);
    buf
}

/// Access to the crypto APIs.
pub struct Crypto<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Crypto<R> {
    pub fn aes_encrypt(&self, payload: AesCryptoRequest) -> crate::Result<CryptoResponse> {
        let cipher = match payload.mode.as_str() {
            "cbc" => Cipher::aes_128_cbc(),
            "ecb" => Cipher::aes_128_ecb(),
            _ => {
                return Err(crate::Error::Crypto(
                    "Not support crypto mode, only support cbc or ecb".to_owned(),
                ))
            }
        };
        let mut iv_byte = None;
        if let Some(iv) = &payload.iv {
            iv_byte = Some(iv.as_bytes());
        }
        let cipher_text = encrypt(
            cipher,
            payload.key.as_bytes(),
            iv_byte,
            payload.text.as_bytes(),
        )
        .unwrap();

        let value;
        if payload.encode == "base64" {
            value = base64_encode(&cipher_text);
        } else {
            value = hex::encode(cipher_text);
        }
        Ok(CryptoResponse { value })
    }

    pub fn rsa_encrypt(&self, payload: RsaCryptoRequest) -> crate::Result<CryptoResponse> {
        let rsa = Rsa::public_key_from_pem(payload.key.as_bytes()).unwrap();
        let data = payload.data;
        let prefix = vec![0u8; 128 - data.len()];
        let data = [&prefix[..], &data.as_bytes()[..]].concat();
        let mut buf = vec![0; rsa.size() as usize];
        info!("rsa encrypt data: {:?}", rsa.size() as usize);
        rsa.public_encrypt(&data, &mut buf, Padding::NONE).unwrap();
        let value = hex::encode(buf);
        Ok(CryptoResponse { value })
    }

    pub fn hash_encrypt(&self, payload: HashEncryptRequest) -> crate::Result<CryptoResponse> {
        let hash_value = match payload.algorithm.as_str() {
            "md5" => hash(MessageDigest::md5(), payload.data.as_bytes()),
            _ => {
                return Err(crate::Error::Crypto(
                    "Not support crypto mode, only support cbc or ecb".to_owned(),
                ))
            }
        };
		match hash_value {
			Ok(value) => {
				Ok(CryptoResponse { value: hex::encode(value) })
			},
			Err(_) => return Err(crate::Error::Crypto(
				"Not support crypto mode, only support cbc or ecb".to_owned(),
			)),
		}
    }
}
