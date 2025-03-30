import auth from '@/utils/auth';
import { cacheAlbum, getAlbumFromCache } from '@/db';
import { invoke } from "@tauri-apps/api/core";

/**
 * 获取专辑内容
 * 说明 : 调用此接口 , 传入专辑 id, 可获得专辑内容
 * @param {number} id
 */
export async function getAlbum(id: number) {
  const fetchLatest = async () => {
    let data: any = await invoke('get_album', { data: { id } });
    if (data.code !== 200) return null
    data = data.data
    cacheAlbum(id, data);
    data.songs = auth.mapTrackPlayableStatus(data.songs);
    return data;
  };

  const result_1 = await getAlbumFromCache(id);
  return result_1 ?? fetchLatest();
}

/**
 * 全部新碟
 * 说明 : 登录后调用此接口 ,可获取全部新碟
 * - limit - 返回数量 , 默认为 30
 * - offset - 偏移数量，用于分页 , 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
 * - area - ALL:全部,ZH:华语,EA:欧美,KR:韩国,JP:日本
 * @param {Object} params
 * @param {number} params.limit
 * @param {number=} params.offset
 * @param {string} params.area
 */
export function newAlbums(params: any) {
  return invoke('album_new', { data: params });
}

/**
 * 获取收藏的专辑（需要登录）
 * 说明 : 调用此接口可获取到用户收藏的专辑
 * - limit : 返回数量 , 默认为 25
 * - offset : 偏移数量，用于分页 , 如 :( 页数 -1)*25, 其中 25 为 limit 的值 , 默认为 0
 * @param {Object} params
 * @param {number} params.limit
 * @param {number=} params.offset
 */
export function albumSublist(params: any) {
  params["timestamp"] = new Date().getTime();
  return invoke("album_sublist", { data: params });
}

/**
 * 收藏/取消收藏专辑
 * 说明 : 调用此接口,可收藏/取消收藏专辑
 * - id - 返专辑 id
 * - t - 1 为收藏,其他为取消收藏
 * @param {Object} params
 * @param {number} params.id
 * @param {number} params.t
 */
export function likeAAlbum(params: any) {
  params.t =  params.t == 1 ? 'sub' : 'unsub'
  return invoke("album_sub", { data: params });
}

/**
 * 获取歌手专辑
 * 说明 : 调用此接口 , 传入歌手 id, 可获得歌手专辑内容
 * - id: 歌手 id
 * - limit: 取出数量 , 默认为 50
 * - offset: 偏移数量 , 用于分页 , 如 :( 页数 -1)*50, 其中 50 为 limit 的值 , 默认为 0
 * @param {Object} params
 * @param {number} params.id
 * @param {number=} params.limit
 * @param {number=} params.offset
 */
export function getArtistAlbum(params: any) {
  return invoke("artist_albums", { data: params });
}

/**
 * 专辑动态信息
 * 说明 : 调用此接口 , 传入专辑 id, 可获得专辑动态信息,如是否收藏,收藏数,评论数,分享数
 * - id - 专辑id
 * @param {number} id
 */
export function albumDynamicDetail(id: number) {
  return invoke("album_detail_dynamic", { data: {id} });
}