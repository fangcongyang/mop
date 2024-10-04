import auth from '@/utils/auth';
import { invoke } from "@tauri-apps/api/core";

/**
 * 获取歌单详情
 * 说明 : 歌单能看到歌单名字, 但看不到具体歌单内容 , 调用此接口 , 传入歌单 id, 可以获取对应歌单内的所有的音乐(未登录状态只能获取不完整的歌单,登录后是完整的)，
 * 但是返回的trackIds是完整的，tracks 则是不完整的，可拿全部 trackIds 请求一次 song/detail 接口
 * 获取所有歌曲的详情 (https://github.com/Binaryify/NeteaseCloudMusicApi/issues/452)
 * - id : 歌单 id
 * - s : 歌单最近的 s 个收藏者, 默认为8
 * @param {number} id
 * @param {boolean=} noCache
 * @param [options={}] options
 */
export function getPlaylistDetail(id: any, noCache: boolean | undefined = false) {
  return new Promise((resolve, _) => {
    let params: any = { id };
    if (noCache) params.timestamp = new Date().getTime();
    invoke('get_playlist_detail', { data: params }).then((data: any) => {
      if (data.playlist) {
        data.playlist.tracks = auth.mapTrackPlayableStatus(
          data.playlist.tracks,
          data.privileges || []
        );
      }
      resolve(data);
    });
  });
}

/**
 * 每日推荐歌曲
 * 说明 : 调用此接口 , 可获得每日推荐歌曲 ( 需要登录 )
 * @param {Object} params
 * @param {string} params.op
 * @param {string} params.pid
 */
export function dailyRecommendTracks(params = {}) {
  return invoke('recommend_songs', { data: params });
}

/**
 * 心动模式/智能播放
 * 说明 : 登录后调用此接口 , 可获取心动模式/智能播放列表 必选参数 : id : 歌曲 id
 * - id : 歌曲 id
 * - pid : 歌单 id
 * - sid : 要开始播放的歌曲的 id (可选参数)
 * @param {Object} params
 * @param {number=} params.id
 * @param {number=} params.pid
 */
export function intelligencePlaylist(params: any) {
  params.songId = params.id;
  params.playlistId = params.pid;
  params.startMusicId = params.sid || params.id;
  return invoke('playmode_intelligence_list', { data: params });
}

/**
 * 获取每日推荐歌单
 * 说明 : 调用此接口 , 可获得每日推荐歌单 ( 需要登录 )
 * @param {Object} params
 * @param {number=} params.limit
 */
export function dailyRecommendPlaylist(params = {}) {
  return invoke('daily_recommend_playlist', { data: params });
}

/**
 * 推荐歌单
 * 说明 : 调用此接口 , 可获取推荐歌单
 * - limit: 取出数量 , 默认为 30 (不支持 offset)
 * - 调用例子 : /personalized?limit=1
 * @param {Object} params
 * @param {number=} params.limit
 */
export function recommendPlaylist(params: any) {
  return invoke('recommend_playlist', { data: params });
}

/**
 * 歌单 ( 网友精选碟 )
 * 说明 : 调用此接口 , 可获取网友精选碟歌单
 * - order: 可选值为 'new' 和 'hot', 分别对应最新和最热 , 默认为 'hot'
 * - cat: tag, 比如 " 华语 "、" 古风 " 、" 欧美 "、" 流行 ", 默认为 "全部",可从歌单分类接口获取(/playlist/catlist)
 * - limit: 取出歌单数量 , 默认为 50
 * @param {Object} params
 * @param {string} params.order
 * @param {string} params.cat
 * @param {number=} params.limit
 */
export function topPlaylist(params: any) {
  return invoke('top_playlist', { data: params });
}

/**
 * 获取精品歌单
 * 说明 : 调用此接口 , 可获取精品歌单
 * - cat: tag, 比如 " 华语 "、" 古风 " 、" 欧美 "、" 流行 ", 默认为 "全部", 可从精品歌单标签列表接口获取(/playlist/highquality/tags)
 * - limit: 取出歌单数量 , 默认为 20
 * - before: 分页参数,取上一页最后一个歌单的 updateTime 获取下一页数据
 * @param {Object} params
 * @param {string} params.cat
 * @param {number=} params.limit
 * @param {number} params.before
 */
export function highQualityPlaylist(params: any) {
  return invoke('top_playlist_high_quality', { data: params });
}

/**
 * 所有榜单
 * 说明 : 调用此接口,可获取所有榜单 接口地址 : /toplist
 */
export function toplists(params = {}) {
  return invoke('top_list', { data: params });
}

/**
 * 收藏/取消收藏歌单
 * 说明 : 调用此接口, 传入类型和歌单 id 可收藏歌单或者取消收藏歌单
 * - t : 类型,1:收藏,2:取消收藏
 * - id : 歌单 id
 * @param {Object} params
 * @param {number} params.t
 * @param {number} params.id
 */
export function subscribePlaylist(params: any) {
  params.t = params.t === 1 ? 'subscribe' : 'unsubscribe';
  params.timestamp = new Date().getTime();
  return invoke('playlist_subscribe', { data: params });
}

/**
 * 对歌单添加或删除歌曲
 * 说明 : 调用此接口 , 可以添加歌曲到歌单或者从歌单删除某首歌曲 ( 需要登录 )
 * - op: 从歌单增加单曲为 add, 删除为 del
 * - pid: 歌单 id tracks: 歌曲 id,可多个,用逗号隔开
 * @param {Object} params
 * @param {string} params.op
 * @param {string} params.pid
 */
export function addOrRemoveTrackFromPlaylist(params: any) {
  params.timestamp = new Date().getTime();
  return invoke('playlist_tracks', { data: params });
}

/**
 * 删除歌单
 * 说明 : 调用此接口 , 传入歌单id可删除歌单
 * - id : 歌单id,可多个,用逗号隔开
 *  * @param {number} id
 */
export function deletePlaylist(id: string) {
  return invoke('playlist_remove', { data: {id} });
}

/**
 * 新建歌单
 * 说明 : 调用此接口 , 传入歌单名字可新建歌单
 * - name : 歌单名
 * - privacy : 是否设置为隐私歌单，默认否，传'10'则设置成隐私歌单
 * - type : 歌单类型,默认'NORMAL',传 'VIDEO'则为视频歌单
 * @param {Object} params
 * @param {string} params.name
 * @param {number} params.privacy
 * @param {string} params.type
 */
export function createPlaylist(params: any) {
  params.timestamp = new Date().getTime();
  return invoke('playlist_create', { data: params });
}