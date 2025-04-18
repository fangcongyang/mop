import auth from "@/utils/auth";
import { invoke } from "@tauri-apps/api/core";

/**
 * 获取歌手单曲
 * 说明 : 调用此接口 , 传入歌手 id, 可获得歌手部分信息和热门歌曲
 * @param {number} id - 歌手 id, 可由搜索接口获得
 */
export async function getArtist(id: string) {
    let data: any = await invoke('artists', { data: { id, timestamp: new Date().getTime() } });
    data = data.code === 200 ? data.data : {}
    data.hotSongs = auth.mapTrackPlayableStatus(data.hotSongs);
    return data;
}

/**
 * 获取歌手 mv
 * 说明 : 调用此接口 , 传入歌手 id, 可获得歌手 mv 信息 , 具体 mv 播放地址可调 用/mv传入此接口获得的 mvid 来拿到 , 如 : /artist/mv?id=6452,/mv?mvid=5461064
 * @param {number} params.id 歌手 id, 可由搜索接口获得
 * @param {number} params.offset
 * @param {number} params.limit
 */
export function artistMv(params: any) {
    params.artistId = params.id;
    return new Promise((resolve, reject) => {
        invoke('artist_mv', { data: params })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

/**
 * 歌手榜
 * 说明 : 调用此接口 , 可获取排行榜中的歌手榜
 * - type : 地区
 * 1: 华语
 * 2: 欧美
 * 3: 韩国
 * 4: 日本
 * @param {number=} type
 */
export function topListOfArtists(type = null) {
    let params: any = {};
    if (type) {
        params.type = type;
    }
    return new Promise((resolve, reject) => {
        invoke('toplist_artist', { data: params })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

/**
 * 获取收藏的歌手（需要登录）
 * 说明 : 调用此接口可获取到用户收藏的歌手
 */
export function artistSubList(params: any) {
    params.timestamp = new Date().getTime();
    return new Promise((resolve, reject) => {
        invoke('artist_sublist', { data: params })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

/**
* 收藏歌手
* 说明 : 调用此接口 , 传入歌手 id, 可收藏歌手
* - id: 歌手 id
* - t: 操作,1 为收藏,其他为取消收藏
* @param {Object} params
* @param {number} params.id
* @param {number} params.t
*/
export function followAArtist(params: any) {
    params.t = params.t == 1 ? 'sub' : 'unsub';
    params.artistId = params.id;
    return new Promise((resolve, reject) => {
        invoke('artist_sub', { data: params })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

/**
 * 相似歌手
 * 说明 : 调用此接口 , 传入歌手 id, 可获得相似歌手
 * - id: 歌手 id
 * @param {number} id
 */
export function similarArtistList(id: number) {
    return new Promise((resolve, reject) => {
        invoke('simi_artist', { data: { artistid: id } })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}