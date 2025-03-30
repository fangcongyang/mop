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
    public userPlaylist!: Table<any, number>;
    public playlistDetail!: Table<any, number>;
    public localStarTrackId!: Table<any, number>;

    public constructor() {
        super("MopDatabase");
        this.version(1).stores({
            trackDetail: "&id, updateTime",
            trackSources: "&id, createTime",
            lyric: "&id, updateTime",
            album: "&id, updateTime",
        });
        this.version(2).stores({
            userPlaylist: "&id, userId, updateTime",
            playlistDetail: "&id, updateTime",
            localStarTrackId: "id++, trackId, playListId, updateTime",
        });
    }
}

const db = new MopDatabase();

let tracksCacheBytes = 0;

export async function getTrackSource(id: string) {
    const track = await db.trackSources.get(Number(id));
    if (!track || !track.source || track.source?.length == 0) return null;
    console.debug(
        `[debug][db.js] get track from cache 👉 ${track.name} by ${track.artist}`
    );
    return track;
}

export function deleteTrackSource(id: string) {
    db.trackSources.delete(Number(id));
}

export async function cacheUserPlaylist(playlists: any) {
    playlists.map(async (playlist: any) => {
        playlist.updateTime = new Date().getTime();
    });
    await db.userPlaylist.bulkPut(playlists); 
}

export async function getUserPlaylist(userId: string) {
    const playlists = await db.userPlaylist
       .where("userId")
       .equals(Number(userId))
       .toArray();
    if (playlists.length === 0) return undefined;
    return {playlist: playlists};
}

export async function cachePlaylistDetail(id: number, playlistDetail: any) {
    playlistDetail.updateTime = new Date().getTime();
    playlistDetail.id = Number(id);
    await db.playlistDetail.put(playlistDetail);
}

export async function selectPlaylistDetail(id: number) {
    const playlistDetail = await db.playlistDetail.get(Number(id));
    if (!playlistDetail) return undefined;
    const tracks = await db.localStarTrackId.where("playListId").equals(Number(id)).toArray();
    tracks.map((track: any) => {
        playlistDetail.playlist.trackIds.push(track.trackInfo);
        playlistDetail.privileges.push(track.privileges);
    });
    playlistDetail.playlist.trackIds.sort((a: any, b: any) => {
        return b.at - a.at;
    });
    return playlistDetail; 
}

export async function localLikeTrack(uid: number, playListId: number, trackDetail: any, like: boolean){
    const song = trackDetail.songs![0] || undefined;
    if (!song) return;
    if (like) {
        let lst = {
            alg: null,
            at: new Date().getTime(),
            dpr: null,
            f: null,
            id: song.id,
            rcmdReason: "",
            rcmdReasonTitle: "编辑推荐",
            sc: null,
            sr: null,
            t: song.t,
            uid: uid,
            v: song.v,
        }
        await db.localStarTrackId.add({trackId: song.id, playListId, trackInfo: lst, privileges: trackDetail.privileges![0]});
    } else {
        await db.localStarTrackId.where("trackId").equals(Number(song.id)).and((item) => item.playListId == playListId).delete();
    }
}

export async function getLocalLikeTrackIds(playListId: number){
    const tracks = await db.localStarTrackId.where("playListId").equals(Number(playListId)).toArray();
    if (tracks.length === 0) return undefined;
    return tracks.map((track: any) => {
        return track.trackId;
    });
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
        invoke("download_music_arraybuffer", { url, from })
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
