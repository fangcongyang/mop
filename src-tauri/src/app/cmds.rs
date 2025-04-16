use std::time::Duration;

use futures::TryStreamExt;
use tauri::{Emitter, Manager};
use tauri_plugin_http::reqwest;
use tokio::{io::AsyncWriteExt, sync::watch, time::interval};

use crate::utils;

#[tauri::command]
pub fn open_devtools(app_handle: tauri::AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        if !window.is_devtools_open() {
            window.open_devtools();
        } else {
            window.close_devtools();
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct DownloadTaskInfo {
    event_id: String,
    download_url: String,
    file_path: String,
}

#[derive(serde::Serialize, Clone)]
struct DownloadInfo {
    status: String,
    progress: Option<f64>,
    speed: Option<f64>,
    content_length: Option<f64>,
}

enum DownloadStatus {
    BEGIN,
    PROGRESS,
    END,
    ERROR,
}

impl DownloadStatus {
    fn to_string(&self) -> String {
        match self {
            DownloadStatus::BEGIN => "begin".to_owned(),
            DownloadStatus::PROGRESS => "progress".to_owned(),
            DownloadStatus::END => "end".to_owned(),
            DownloadStatus::ERROR => "error".to_owned(),
        }
    }
}

#[tauri::command]
pub async fn download_file_task(
    app_handle: tauri::AppHandle,
    download_task_info: DownloadTaskInfo,
) {
    download_file_task_async(app_handle, download_task_info).await;
}

pub async fn download_file_task_async(
    app_handle: tauri::AppHandle,
    download_task_info: DownloadTaskInfo,
) {
    let app = app_handle.clone();
    let handle = tokio::spawn(async move {
        if let Err(e) = async {
            // 创建 HTTP 客户端
            let client = reqwest::Client::new();
            let response = client.get(&download_task_info.download_url).send().await?;

            // 获取文件大小
            let total_size = response
                .headers()
                .get(reqwest::header::CONTENT_LENGTH)
                .and_then(|val| val.to_str().ok())
                .and_then(|val| val.parse::<u64>().ok())
                .unwrap_or(0);

            let content_length = total_size as f64 / 1024.0 / 1024.0;
            app.emit(
                &download_task_info.event_id,
                DownloadInfo {
                    status: DownloadStatus::BEGIN.to_string(),
                    progress: Some(0.0),
                    speed: Some(0.0),
                    content_length: Some(content_length),
                },
            )?;

            // 打开文件用于写入
            let mut path = utils::app_install_root();
            path = path.join("resources").join(&download_task_info.file_path);
            utils::create_dir_if_not_exists(&path)?;
            let mut file = tokio::fs::File::create(path).await?;
            let mut stream = response.bytes_stream();

            let mut downloaded: u64 = 0;
            let (tx, rx) = watch::channel(0); // 共享变量，用于通知进度

            // **启动一个独立的任务，每秒发送进度**
            let progress_task = tokio::spawn({
                let app_interval = app.clone();
                let download_task_info_interval = download_task_info.clone();
                async move {
                    let mut interval = interval(Duration::from_secs(1));
                    let mut last_downloaded = 0;

                    loop {
                        interval.tick().await; // **每秒触发**

                        let downloaded = *rx.borrow(); // 获取最新的下载进度
                        let speed = (downloaded - last_downloaded) as f64 / 1024.0 / 1024.0; // MB/s
                        last_downloaded = downloaded;

                        let progress = (downloaded as f64 / total_size as f64) * 100.0;

                        app_interval
                            .emit(
                                &download_task_info_interval.event_id,
                                DownloadInfo {
                                    status: DownloadStatus::PROGRESS.to_string(),
                                    progress: Some((progress * 100.0).round() / 100.0),
                                    speed: Some((speed * 100.0).round() / 100.0),
                                    content_length: Some(content_length),
                                },
                            )
                            .ok();
                    }
                }
            });

            while let Ok(Some(chunk)) = stream.try_next().await {
                file.write_all(&chunk).await?;
                downloaded += chunk.len() as u64;
                tx.send(downloaded).ok(); // **更新进度**
            }

            progress_task.abort();
            app.emit(
                &download_task_info.event_id,
                DownloadInfo {
                    status: DownloadStatus::END.to_string(),
                    progress: Some(100.0),
                    speed: Some(0.0),
                    content_length: Some(content_length),
                },
            )?;
            Ok::<(), Box<dyn std::error::Error>>(()) // 显式返回 Ok(())
        }
        .await
        {
            log::error!("Error downloading file: {}", e);
            app.emit(
                &download_task_info.event_id,
                DownloadInfo {
                    status: DownloadStatus::ERROR.to_string(),
                    progress: None,
                    speed: None,
                    content_length: None,
                },
            )
            .unwrap();
        }
    });
    let _ = handle.await;
}
