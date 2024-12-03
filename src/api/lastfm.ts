import md5 from "crypto-js/md5";
import { fetch } from "@tauri-apps/plugin-http";

const apiKey = import.meta.env.VITE_APP_LASTFM_API_KEY;
const apiSharedSecret = import.meta.env.VITE_APP_LASTFM_API_SHARED_SECRET;
const baseUrl = window.location.origin;
const url = "https://ws.audioscrobbler.com/2.0/";

const sign = (params: any) => {
    const sortParamsKeys = Object.keys(params).sort();
    const sortedParams = sortParamsKeys.reduce((acc: any, key) => {
        acc[key] = params[key];
        return acc;
    }, {});
    let signature = "";
    for (const [key, value] of Object.entries(sortedParams)) {
        signature += `${key}${value}`;
    }
    return md5(signature + apiSharedSecret).toString();
};

export function lastfmAuth() {
    const url = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${baseUrl}/lastfm/callback`;
    window.open(url);
}

export async function authGetSession(token: string) {
    return new Promise(async (resolve, reject) => {
        const signature = md5(
            `api_key${apiKey}methodauth.getSessiontoken${token}${apiSharedSecret}`
        ).toString();
        const body = new FormData();
        body.append("method", "auth.getSession");
        body.append("format", "json");
        body.append("api_key", apiKey);
        body.append("api_sig", signature);
        body.append("token", token);
        let res = await fetch(url, {
            headers: {
                "User-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.58",
                "Content-Type": "x-www-form-urlencoded",
                Charset: "UTF-8",
            },
            body: body,
            method: "GET",
            connectTimeout: 3 * 1000,
            mode: "cors",
        });
        res.text()
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

export function trackUpdateNowPlaying(params: any) {
    return new Promise(async (resolve, reject) => {
        params.api_key = apiKey;
        params.method = "track.updateNowPlaying";
        params.sk = JSON.parse(localStorage.getItem("lastfm") as string)["key"];
        const signature = sign(params);
        params.api_sig = signature;
        params.format = "json";
        const body = new FormData();
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                body.append(key, params[key]);
            }
        }
        let res = await fetch(url, {
            headers: {
                "User-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.58",
                "Content-Type": "x-www-form-urlencoded",
                Charset: "UTF-8",
            },
            body: body,
            method: "POST",
            connectTimeout: 3 * 1000,
            mode: "cors",
        });
        res.text()
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

export function trackScrobble(params: any) {
    return new Promise(async (resolve, reject) => {
        params.api_key = apiKey;
        params.method = "track.scrobble";
        params.sk = JSON.parse(localStorage.getItem("lastfm") as string)["key"];
        const signature = sign(params);
        params.api_sig = signature;
        params.format = "json";
        const body = new FormData();
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                body.append(key, params[key]);
            }
        }
        let res = await fetch(url, {
            headers: {
                "User-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.58",
                "Content-Type": "x-www-form-urlencoded",
                Charset: "UTF-8",
            },
            body: body,
            method: "POST",
            connectTimeout: 3 * 1000,
            mode: "cors",
        });
        res.text()
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
