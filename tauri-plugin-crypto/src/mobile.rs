use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_crypto);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<Crypto<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin("com.plugin.crypto", "CryptoPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_crypto)?;
  Ok(Crypto(handle))
}

/// Access to the crypto APIs.
pub struct Crypto<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Crypto<R> {
  pub fn aes_encrypt(&self, payload: AesCryptoRequest) -> crate::Result<CryptoResponse> {
    self
      .0
      .run_mobile_plugin("aes_encrypt", payload)
      .map_err(Into::into)
  }

  pub fn rsa_encrypt(&self, payload: RsaCryptoRequest) -> crate::Result<CryptoResponse> {
    self
      .0
      .run_mobile_plugin("rsa_encrypt", payload)
      .map_err(Into::into)
  }

  pub fn hash_encrypt(&self, payload: HashEncryptRequest) -> crate::Result<CryptoResponse> {
    self
      .0
      .run_mobile_plugin("hash_encrypt", payload)
      .map_err(Into::into)
  }
}
