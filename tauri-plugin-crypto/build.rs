const COMMANDS: &[&str] = &["aes_encrypt,rsa_encrypt,hash_encrypt"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
