import { invoke } from "@tauri-apps/api/core";

/**
 * 获取 mv 数据
 * 说明 : 调用此接口 , 传入 mvid ( 在搜索音乐的时候传 type=1004 获得 ) , 可获取对应 MV 数据 , 数据包含 mv 名字 , 歌手 , 发布时间 , mv 视频地址等数据 ,
 * 其中 mv 视频 网易做了防盗链处理 , 可能不能直接播放 , 需要播放的话需要调用 ' mv 地址' 接口
 * - 调用例子 : /mv/detail?mvid=5436712
 * @param {number} id mv 的 id
 */
export function mvDetail(id: string) {
    return new Promise((resolve, reject) => {
        invoke('mv_detail', { data: {
            id,
            timestamp: new Date().getTime()
        } })
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
 * mv 地址
 * 说明 : 调用此接口 , 传入 mv id,可获取 mv 播放地址
 * - id: mv id
 * - r: 分辨率,默认1080,可从 /mv/detail 接口获取分辨率列表
 * - 调用例子 : /mv/url?id=5436712 /mv/url?id=10896407&r=1080
 * @param {Object} params
 * @param {number} params.id
 * @param {number=} params.r
 */
export function mvUrl(params: any) {
    return new Promise((resolve, reject) => {
        invoke('mv_url', { data: params })
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
 * 相似 mv
 * 说明 : 调用此接口 , 传入 mvid 可获取相似 mv
 * @param {number} mvid
 */
export function simiMv(mvid: string) {
    return new Promise((resolve, reject) => {
        invoke('simi_mv', { data: {mvid} })
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
 * 获取收藏的MV（需要登录）
 * 说明 : 调用此接口可获取到用户收藏的MV
 */
export function mvSublist(params: any) {
    params.timestamp = new Date().getTime();
    return invoke('mv_sublist', { data: params });
}

/**
 * 收藏/取消收藏 MV
 * 说明 : 调用此接口,可收藏/取消收藏 MV
 * - mvid: mv id
 * - t: 1 为收藏,其他为取消收藏
 * @param {Object} params
 * @param {number} params.mvid
 * @param {number=} params.t
 */

export function likeAMv(params: any) {
    params.timestamp = new Date().getTime();
    params.mvId = params.mvid;
    params.t = params.t == 1 ? 'sub' : 'unsub';
    return invoke('mv_sub', { data: params });
}