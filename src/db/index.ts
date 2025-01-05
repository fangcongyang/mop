import Dexie, { Table } from "dexie";
import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { decode as base642Buffer } from "@/utils/base64";
import { store } from "@/utils/store";

class MopDatabase extends Dexie {
    public trackDetail!: Table<any, number>;
    public trackSources!: Table<any, number>;
    public lyric!: Table<any, number>;
    public album!: Table<any, number>;

    public constructor() {
        super("MopDatabase");
        this.version(1).stores({
            trackDetail: "&id, updateTime",
            trackSources: "&id, createTime",
            lyric: "&id, updateTime",
            album: "&id, updateTime",
        });
    }
}

const db = new MopDatabase();

let tracksCacheBytes = 0;

export function getTrackSource(id: string) {
    return db.trackSources.get(Number(id)).then((track) => {
        if (!track || !track.source || track.source?.length == 0) return null;
        console.debug(
            `[debug][db.js] get track from cache 👉 ${track.name} by ${track.artist}`
        );
        return track;
    });
}

export function deleteTrackSource(id: string) {
    db.trackSources.delete(Number(id));
}

export async function cacheTrackSource(
    trackInfo: any,
    url: string,
    bitRate: number,
    from = "netease"
) {
    const name = trackInfo.name;
    const artist =
        (trackInfo.ar && trackInfo.ar[0]?.name) ||
        (trackInfo.artists && trackInfo.artists[0]?.name) ||
        "Unknown";
    let cover = trackInfo.al.picUrl;
    if (cover.slice(0, 5) !== "https") {
        cover = "https" + cover.slice(4);
    }
    fetch(`${cover}?param=512y512`, {
        method: "GET",
        headers: {
            "Content-Type": "application/octet-stream",
        }
    });
    fetch(`${cover}?param=224y224`, {
        method: "GET",
        headers: {
            "Content-Type": "application/octet-stream",
        }
    });
    fetch(`${cover}?param=1024y1024`, {
        method: "GET",
        headers: {
            "Content-Type": "application/octet-stream",
        }
    });
    if (url.startsWith("http")) {
        invoke("download_music_arraybuffer", { url })
            .then((response) => {
                const sd = new Uint8Array(response as any);
                db.trackSources.put({
                    id: trackInfo.id,
                    source: sd,
                    bitRate,
                    from,
                    name,
                    artist,
                    createTime: new Date().getTime(),
                });
                console.debug(
                    `[debug][db.js] cached track 👉 ${name} by ${artist}`
                );
                tracksCacheBytes += sd.length;
                deleteExcessCache();
                return { trackId: trackInfo.id, source: sd, bitRate };
            })
            .catch((e) => {
                console.error(e);
            });
    } else {
        const buffer = base642Buffer(url);
        db.trackSources.put({
            id: trackInfo.id,
            source: buffer,
            bitRate,
            from,
            name,
            artist,
            createTime: new Date().getTime(),
        });
        console.debug(`[debug][db.js] cached track 👉 ${name} by ${artist}`);
        tracksCacheBytes += buffer.byteLength;
        deleteExcessCache();
        return { trackId: trackInfo.id, source: buffer, bitRate };
    }
}

async function deleteExcessCache() {
    const cacheLimit = await store.get("cacheLimit");
    if (cacheLimit === 0 || tracksCacheBytes < cacheLimit * Math.pow(1024, 2)) {
        return;
    }
    try {
        const delCache = await db.trackSources.orderBy("createTime").first();
        await db.trackSources.delete(delCache.id);
        tracksCacheBytes -= delCache.source.byteLength;
        console.debug(
            `[debug][db.js] deleteExcessCacheSucces, track: ${delCache.name}, size: ${delCache.source.byteLength}, cacheSize:${tracksCacheBytes}`
        );
        deleteExcessCache();
    } catch (error) {
        console.debug("[debug][db.js] deleteExcessCacheFailed", error);
    }
}

export function cacheAlbum(id: number | string, album: any) {
    db.album.put({
        id: Number(id),
        album,
        updateTime: new Date().getTime(),
    });
}

export async function getAlbumFromCache(id: number | string) {
    const result = await db.album.get(Number(id));
    if (!result) return undefined;
    return result.album;
}

export function cacheTrackDetail(track: any, privileges: any) {
    db.trackDetail.put({
        id: track.id,
        detail: track,
        privileges: privileges,
        updateTime: new Date().getTime(),
    });
}

export function getTrackDetailFromCache(ids: string[]) {
    return db.trackDetail
        .filter((track) => {
            return ids.includes(String(track.id));
        })
        .toArray()
        .then((tracks) => {
            const result = { songs: <any>[], privileges: <any>[] };
            ids.map((id) => {
                const one = tracks.find((t) => String(t.id) === id);
                result.songs.push(one?.detail);
                result.privileges.push(one?.privileges);
            });
            if (result.songs.includes(undefined)) {
                return undefined;
            }
            return result;
        });
}

export function cacheLyric(id: number, lyrics: any) {
    db.lyric.put({
        id,
        lyrics,
        updateTime: new Date().getTime(),
    });
}

export async function getLyricFromCache(id: number) {
    const result = await db.lyric.get(Number(id));
    if (!result) return undefined;
    return result.lyrics;
}

export async function countDatabaseSize() {
    const trackSizes: any = [];
    await db.trackSources.each((track) => {
        trackSizes.push(track.source.byteLength);
    });
    const res = {
        bytes: trackSizes.reduce((s1: any, s2: any) => s1 + s2, 0),
        length: trackSizes.length,
    };
    tracksCacheBytes = res.bytes;
    console.debug(`[debug][db.js] load tracksCacheBytes: ${tracksCacheBytes}`);
    return res;
}

export function clearDB() {
    return new Promise<void>((resolve) => {
        db.tables.forEach(function (table) {
            table.clear();
        });
        resolve();
    });
}
