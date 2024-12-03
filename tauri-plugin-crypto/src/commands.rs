use tauri::{AppHandle, command, Runtime};

use crate::models::*;
use crate::Result;
use crate::CryptoExt;

#[command]
pub(crate) async fn aes_encrypt<R: Runtime>(
    app: AppHandle<R>,
    payload: AesCryptoRequest,
) -> Result<CryptoResponse> {
    app.crypto().aes_encrypt(payload)
}

#[command]
pub(crate) async fn rsa_encrypt<R: Runtime>(
    app: AppHandle<R>,
    payload: RsaCryptoRequest,
) -> Result<CryptoResponse> {
    app.crypto().rsa_encrypt(payload)
}

#[command]
pub(crate) async fn hash_encrypt<R: Runtime>(
    app: AppHandle<R>,
    payload: HashEncryptRequest,
) -> Result<CryptoResponse> {
    app.crypto().hash_encrypt(payload)
}