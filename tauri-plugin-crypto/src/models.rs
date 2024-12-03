use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AesCryptoRequest {
  pub text: String,
  pub mode: String,
  pub key: String,
  pub iv: Option<String>,
  pub encode: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RsaCryptoRequest {
  pub data: String,
  pub key: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HashEncryptRequest {
  pub data: String,
  pub algorithm: String,
}


#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CryptoResponse {
  pub value: String,
}
