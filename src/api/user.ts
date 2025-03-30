import { getLocalLikeTrackIds } from "@/db";
import { invoke } from "@tauri-apps/api/core";
import { do_invoke } from "./fetch";

export function userAccount() {
    return do_invoke("user_account", { data: {} });
}

export function userPlaylist(data: any) {
    return new Promise((resolve, reject) => {
        invoke("user_playlist", { data })
       .then((data: any) => {
          data = data.code === 200 ? data.data : null
          resolve(data)
       })
       .catch((e) => {
        reject(e)
       })
    }) 
}

/**
 * 喜欢音乐列表（需要登录）
 * 说明 : 调用此接口 , 传入用户 id, 可获取已喜欢音乐id列表(id数组)
 * - uid: 用户 id
 * @param {number} uid
 */
export function userLikedSongsIds(uid: number, playListId: number) {
    return new Promise((resolve, reject) => {
        do_invoke("user_like_songs_ids", { data: { uid, timestamp: new Date().getTime() } })
       .then(async (data: any) => {
          const lids = await getLocalLikeTrackIds(playListId)
          if (lids) {
            data.ids = [...data.ids, ...lids]
          }

          resolve(data)
       })
       .catch((e) => {
        reject(e)
       })
    }) 
}

/**
 * 删除云盘歌曲（需要登录）
 * @param {Array} id
 */
export function cloudDiskTrackDelete(id: string) {
    return do_invoke("cloud_del", { data: { id, timestamp: new Date().getTime() } });
}

/**
 * 获取云盘歌曲（需要登录）
 * 说明 : 登录后调用此接口 , 可获取云盘数据 , 获取的数据没有对应 url, 需要再调用一 次 /song/url 获取 url
 * - limit : 返回数量 , 默认为 200
 * - offset : 偏移数量，用于分页 , 如 :( 页数 -1)*200, 其中 200 为 limit 的值 , 默认为 0
 * @param {Object} params
 * @param {number} params.limit
 * @param {number=} params.offset
 */
export function cloudDisk(params: any) {
    params.timestamp = new Date().getTime();
    return do_invoke("user_cloud", { data: params });
}

/**
 * 获取用户播放记录
 * 说明 : 登录后调用此接口 , 传入用户 id, 可获取用户播放记录
 * - uid : 用户 id
 * - type : type=1 时只返回 weekData, type=0 时返回 allData
 * @param {Object} params
 * @param {number} params.uid
 * @param {number} params.type
 */
export function userPlayHistory(params: any) {
    return do_invoke("user_record", { data: params });
}

/**
 * 上传歌曲到云盘（需要登录）
 */
export function uploadSong(params: any) {
    return do_invoke("cloud", { data: params });
    // let formData = new FormData();
    // formData.append('songFile', file);
    // return request({
    //   url: '/cloud',
    //   method: 'post',
    //   params: {
    //     timestamp: new Date().getTime(),
    //   },
    //   data: formData,
    //   headers: {
    //     'Content-Type': 'multipart/form-data',
    //   },
    //   timeout: 200000,
    // }).catch(error => {
    //   alert(`上传失败，Error: ${error}`);
    // });
  }