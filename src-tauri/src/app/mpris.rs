#[cfg(target_os = "linux")]
pub mod mpris_linux {
    use lazy_static::lazy_static;

    use souvlaki::{MediaControlEvent, MediaControls, MediaMetadata, PlatformConfig};
    use std::{
        collections::HashMap,
        sync::{Arc, Mutex},
        time::Duration,
    };

    lazy_static! {
        static ref TRACK_NAME: Arc<Mutex<HashMap<String, String>>> = {
            let mut map = HashMap::new();
            map.insert("".to_owned(), "".to_owned());
            Arc::new(Mutex::new(map))
        };
        static ref TRACK_INFO: Arc<Mutex<TrackInfo>> = Arc::new(Mutex::new(TrackInfo::new()));
    }

    #[allow(non_snake_case)]
    #[derive(Clone, serde::Serialize, serde::Deserialize, Debug)]
    pub struct TrackInfo {
        pub title: Option<String>,
        pub album: Option<String>,
        pub artist: Option<String>,
        pub duration: Option<f64>,
        pub cover_url: Option<String>,
    }

    impl TrackInfo {
        pub fn new() -> Self {
            Self {
                title: None,
                album: None,
                artist: None,
                duration: None,
                cover_url: None,
            }
        }
    }

    pub fn update_track_info(new_track: TrackInfo) {
        let mut track = TRACK_INFO.lock().unwrap();
        track.title = new_track.title;
        track.album = new_track.album;
        track.artist = new_track.artist;
        track.duration = new_track.duration;
        track.cover_url = new_track.cover_url;
    }

    pub fn init_mpris(app_name: String) {
        let hwnd = None;

        let config = PlatformConfig {
            dbus_name: "com.tauri.mop",
            display_name: &app_name,
            hwnd,
        };
        let mut controls = MediaControls::new(config).unwrap();

        controls
            .attach(|event: MediaControlEvent| match event {
                // MediaControlEvent::Toggle => app.playing = !app.playing,
                // MediaControlEvent::Play => app.playing = true,
                // MediaControlEvent::Pause => app.playing = false,
                // MediaControlEvent::Next => app.song_index = app.song_index.wrapping_add(1),
                // MediaControlEvent::Previous => {
                //     app.song_index = app.song_index.wrapping_sub(1)
                // }
                // MediaControlEvent::Stop => app.playing = false,
                _ => (),
            })
            .unwrap();

        loop {
            let track = TRACK_INFO.lock().unwrap();
            let mut track_name = TRACK_NAME.lock().unwrap();
            if track.title.is_some()
                && !track_name.contains_key(&track.title.clone().unwrap_or("".to_owned()))
            {
                track_name.insert(track.title.clone().unwrap_or("".to_owned()), "".to_owned());
                let mut duration = None;
                if track.duration.is_some() {
                    duration = Some(Duration::from_secs_f64(track.duration.unwrap()));
                }
                controls
                    .set_metadata(MediaMetadata {
                        title: track.title.as_deref(),
                        album: track.album.as_deref(),
                        artist: track.artist.as_deref(),
                        duration,
                        cover_url: track.cover_url.as_deref(),
                    })
                    .unwrap();
            }
            std::thread::sleep(std::time::Duration::from_millis(200));
        }
    }
}
