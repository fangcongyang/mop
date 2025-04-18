use cookie::{Cookie, CookieJar};
use lazy_static::lazy_static;
use log::info;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::{
    fmt::Debug,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tauri_plugin_http::reqwest::{self, Error};

use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, COOKIE, REFERER, USER_AGENT};

use crate::{
    api::crypto::Crypto,
    utils::{app_root, choose_user_agent, create_file, create_request_builder, exists},
};

lazy_static! {
    static ref _CSRF: Regex = Regex::new(r"_csrf=(?P<csrf>[^(;|$)]+)").unwrap();
    static ref DOMAIN: Regex = Regex::new(r#"\s*Domain=[^(;|$)]+;*"#).unwrap();
    static ref COOKIE_JAR: Arc<Mutex<CookieJar>> = Arc::new(Mutex::new(CookieJar::new()));
}

const LINUX_USER_AGNET: &str = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36";

const WEAPI_USER_AGNET: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.69";

const COOKIE_PATH: &str = "cookie.txt";

const MUSIC_U: &str = "MUSIC_U";
const MUSIC_A: &str = "MUSIC_A";
pub const CRYPTO_WEAPI: &str = "weapi";
pub const CRYPTO_EAPI: &str = "eapi";
pub const CRYPTO_API: &str = "api";

#[allow(non_snake_case)]
pub trait Request: Clone + Serialize + for<'a> Deserialize<'a> + Debug {
    fn set_csrf_token(&mut self, csrf_token: String);
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct EmptyReq {
    pub csrf_token: Option<String>,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct Options<'a> {
    pub crypto: Option<&'a str>,
    pub realIP: Option<String>,
    pub url: Option<String>,
    pub cookie: Option<LocalCookie>,
    pub ua: Option<String>,
}

impl<'a> Options<'a> {
    pub fn new(crypto: Option<&'a str>) -> Self {
        Self {
            crypto,
            realIP: None,
            url: None,
            cookie: None,
            ua: None,
        }
    }
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct LocalCookie {
    pub os: Option<String>,
    pub appver: Option<String>,
}

impl Request for EmptyReq {
    fn set_csrf_token(&mut self, csrf_token: String) {
        self.csrf_token = Some(csrf_token);
    }
}

fn get_cookie_string(cookie: Option<LocalCookie>) -> String {
    let mut cookie_jar = COOKIE_JAR.lock().unwrap();
    if cookie.is_some() {
        let c = cookie.unwrap();
        cookie_jar.add_original(("os", c.os.unwrap()));
        if c.appver.is_some() {
            cookie_jar.add_original(("appver", c.appver.unwrap()));
        }
    } else {
        if cookie_jar.get(MUSIC_U).is_none() && cookie_jar.get(MUSIC_A).is_none() {
            cookie_jar.add_original(("os", "ios"));
            cookie_jar.add_original(("appver", "8.20.21"));
        }
    }
    cookie_jar.iter().fold(String::from(""), |acc, val| {
        if acc == "" {
            val.to_string()
        } else {
            val.to_string() + "; " + &acc
        }
    })
}

fn get_save_cookie_string() -> String {
    let cookie_jar = COOKIE_JAR.lock().unwrap();
    cookie_jar
        .iter()
        .fold(String::from(""), |acc, val| val.to_string() + ";;" + &acc)
}

pub fn file_path() -> PathBuf {
    let path = app_root().join(COOKIE_PATH);
    if !exists(&path) {
        create_file(&path).unwrap();
    }
    path
}

pub fn save_cookie_string() {
    let _ = std::fs::write(file_path(), get_save_cookie_string());
}

pub fn read_cookie_string() {
    match std::fs::read_to_string(file_path()) {
        Ok(v) => {
            if v == "" {
                return;
            }
            let v_arr: Vec<&str> = v.split(";;").collect();
            let mut cookie_jar = COOKIE_JAR.lock().unwrap();
            for ele in v_arr.clone() {
                let ele_string = ele.to_string();
                if ele_string == "" {
                    continue;
                }
                let arr: Vec<&str> = ele_string.split(";").collect();
                let cookie = Cookie::parse(arr.get(0).unwrap().to_string()).expect("");
                cookie_jar.add_original(cookie);
            }
        }
        Err(err) => {
            println!("读取cookie失败：{:?}", err);
        }
    };
}

pub async fn request_handler(
    url: &str,
    query_params: impl Request,
    mut options: Options<'_>,
) -> serde_json::Value {
    if options.realIP.is_none() {
        options.realIP = Some("211.161.244.70".to_owned());
    }
    handle_response(handle_request(url.to_owned(), "POST", query_params, options).await).await
}

pub async fn handle_request(
    mut url: String,
    method: &str,
    query_params: impl Request,
    options: Options<'_>,
) -> Result<reqwest::Response, Error> {
    let crypto_string = options.crypto.unwrap();
    let crypto = &crypto_string;

    let mut headers: HeaderMap = HeaderMap::new();
    if crypto == &"linuxapi" {
        headers.insert(USER_AGENT, LINUX_USER_AGNET.parse().unwrap());
    } else if crypto == &"weapi" {
        headers.insert(USER_AGENT, WEAPI_USER_AGNET.parse().unwrap());
    } else {
        headers.insert(
            USER_AGENT,
            serde_json::to_value(choose_user_agent(
                &(options.ua.clone()).unwrap_or("".to_owned()),
            ))
            .unwrap()
            .as_str()
            .unwrap()
            .parse()
            .unwrap(),
        );
    }
    if method.to_uppercase() == "POST" {
        headers.insert(
            CONTENT_TYPE,
            "application/x-www-form-urlencoded".parse().unwrap(),
        );
    }
    if url.contains("music.163.com") {
        headers.insert(REFERER, "https://music.163.com".parse().unwrap());
    }
    match options.realIP {
        Some(ip) => {
            let new_ip: HeaderValue = ip.parse().unwrap();
            headers.insert("X-Real-IP", new_ip.clone());
            headers.insert("X-Forwarded-For", new_ip);
        }
        _none => {}
    };

    headers.insert(
        COOKIE,
        get_cookie_string(options.cookie.clone()).parse().unwrap(),
    );

    let empty_cookie = HeaderValue::from_static("");
    let cookie = headers
        .get(COOKIE)
        .unwrap_or(&empty_cookie)
        .to_str()
        .unwrap();

    let body = match crypto {
        &"weapi" => {
            let csrf_token = if let Some(caps) = _CSRF.captures(cookie) {
                caps.name("csrf").unwrap().as_str()
            } else {
                ""
            };

            let mut _params = query_params.clone();
            _params.set_csrf_token(csrf_token.to_owned());
            let w_api = Regex::new(r"\w*api").unwrap();
            let new_url = w_api.replace(&url, "weapi");
            url = new_url.into_owned();
            Some(Crypto::weapi(&serde_json::to_string(&_params).unwrap()))
        }
        &"eapi" => Some(Crypto::eapi(
            &options.url.unwrap_or((&"").to_string()),
            &serde_json::to_string(&query_params).unwrap(),
        )),
        &"linuxapi" => {
            let data = format!(
                r#"{{"method":"{}","url":"{}","params":{:?}}}"#,
                method,
                url.replace("weapi", "api"),
                serde_json::to_string(&query_params)
            );
            url = "https://music.163.com/api/linux/forward".to_owned();
            Some(Crypto::linuxapi(&data))
        }
        _ => None,
    };

    info!("请求地址:{}", url);
    let mut client_builder = create_request_builder();
    client_builder = client_builder.default_headers(headers);
    let client = client_builder.build().unwrap();
    let mut rq = client.post(url);
    if body.is_none() {
        rq = rq.form(&query_params);
    } else {
        rq = rq.form(&body);
    }
    let response = rq.send().await;
    response
}

#[derive(serde::Serialize)]
struct Response<T> {
    code: i32,
    message: String,
    data: T,
}

impl<T> Response<T> {
    fn ok(data: T) -> Self {
        return Self {
            code: 200,
            message: "".to_string(),
            data,
        };
    }

    fn error(message: String, data: T) -> Self {
        return Self {
            code: 500,
            message,
            data,
        };
    }
}

async fn handle_response(response: Result<reqwest::Response, Error>) -> serde_json::Value {
    if response.is_err() {
        return serde_json::to_value(&Response::error(
            response.unwrap_err().to_string(),
            "".to_owned(),
        ))
        .unwrap();
    }
    let rs = response.unwrap();
    {
        let headers = rs.headers();
        let set_cookies = headers.get_all("set-cookie");
        let mut cookie_jar = COOKIE_JAR.lock().unwrap();
        for val in set_cookies {
            let cookie = Cookie::parse(val.to_str().unwrap().to_string()).expect("");
            cookie_jar.add_original(cookie);
        }
    }
    match rs.text().await {
        Ok(d) => {
            let mut data: Map<String, Value> = serde_json::from_str(&d).unwrap();
            data.insert(
                "cookie".to_owned(),
                serde_json::Value::String(get_cookie_string(None)),
            );
            serde_json::to_value(&Response::ok(data)).unwrap()
        }
        Err(r) => serde_json::to_value(&Response::error(r.to_string(), "".to_owned())).unwrap(),
    }
}
