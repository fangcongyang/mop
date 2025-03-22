import auth from "@/utils/auth";
import { invoke } from "@tauri-apps/api/core";
import {
    cacheLyric,
    cacheTrackDetail,
    getLyricFromCache,
    getTrackDetailFromCache,
} from "@/db";
import { storeData } from "@/utils";

/**
 * 获取音乐 url
 * 说明 : 使用歌单详情接口后 , 能得到的音乐的 id, 但不能得到的音乐 url, 调用此接口, 传入的音乐 id( 可多个 , 用逗号隔开 ), 可以获取对应的音乐的 url,
 * !!!未登录状态返回试听片段(返回字段包含被截取的正常歌曲的开始时间和结束时间)
 * @param {string} id - 音乐的 id，例如 id=405998841,33894312
 */
export async function getMP3(id: string) {
    const quality = await storeData.getBr();
    return invoke("get_song_url", { data: { id, br: parseInt(quality) } });
}

/**
 * 获取歌曲详情
 * 说明 : 调用此接口 , 传入音乐 id(支持多个 id, 用 , 隔开), 可获得歌曲详情(注意:歌曲封面现在需要通过专辑内容接口获取)
 * @param {string} ids - 音乐 id, 例如 ids=405998841,33894312
 */
export async function getTrackDetail(ids: string | number) {
    const fetchLatest = async () => {
        try {
            const data: any = await invoke("get_song_detail", {
                data: { ids: ids.toString() },
            });
            data.songs.map((song: any) => {
                const privileges = data.privileges.find(
                    (t: any) => t.id === song.id
                );
                cacheTrackDetail(song, privileges);
            });
            data.songs = auth.mapTrackPlayableStatus(data.songs, data.privileges);
            return data;
        } catch (e) {
            return null;
        }
    };

    let idsInArray = [String(ids)];
    if (typeof ids === "string") {
        idsInArray = ids.split(",");
    }

    const result_1 = await getTrackDetailFromCache(idsInArray);
    if (result_1) {
        result_1.songs = auth.mapTrackPlayableStatus(
            result_1.songs,
            result_1.privileges
        );
    }
    return result_1 ?? fetchLatest();
}

/**
 * 获取歌词
 * 说明 : 调用此接口 , 传入音乐 id 可获得对应音乐的歌词 ( 不需要登录 )
 * @param {number} id - 音乐 id
 */
export async function getLyric(id: number) {
    const fetchLatest = async () => {
        let result = await invoke("get_lyric", { data: { id } });
        cacheLyric(id, result);
        return result;
    };

    return getLyricFromCache(id).then((result) => {
        return result ?? fetchLatest();
    });
}

/**
 * 听歌打卡
 * 说明 : 调用此接口 , 传入音乐 id, 来源 id，歌曲时间 time，更新听歌排行数据
 * - id - 歌曲 id
 * - sourceid - 歌单或专辑 id
 * - time - 歌曲播放时间,单位为秒
 * @param {Object} params
 * @param {number} params.id
 * @param {number} params.sourceid
 * @param {number=} params.time
 */
export function scrobble(params: any) {
    params.timestamp = new Date().getTime();
    return invoke("scrobble", { data: params });
}

/**
 * 喜欢音乐
 * 说明 : 调用此接口 , 传入音乐 id, 可喜欢该音乐
 * - id - 歌曲 id
 * - like - 默认为 true 即喜欢 , 若传 false, 则取消喜欢
 * @param {Object} params
 * @param {number} params.id
 * @param {boolean=} [params.like]
 */
export function likeTrack(params: any) {
    params.timestamp = new Date().getTime();
    return invoke("like", { data: params });
}
