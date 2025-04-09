import auth from "./auth";
import { dailyRecommendPlaylist, getPlaylistDetail, recommendPlaylist } from "@/api/playlist";
import { player } from "@/business/player";

const specialPlaylist = [3136952023, 2829883282, 2829816518, 2829896389];

export function hasListSource() {
    return !player.isPersonalFM && player.playlistSource.id !== 0;
}

export function getListSourcePath(likedSongPlaylistId: number) {
    if (player.playlistSource.id === likedSongPlaylistId) {
        return '/library/liked-songs';
    } else if (player.playlistSource.type === 'url') {
        return player.playlistSource.id;
    } else if (player.playlistSource.type === 'cloudDisk') {
        return '/library';
    } else {
        return `/${player.playlistSource.type}/${player.playlistSource.id}`;
    }
}

export async function getRecommendPlayList(limit: number, removePrivateRecommand: boolean) {
    if (auth.isAccountLoggedIn()) {
        const playlists: any = await Promise.all([
            dailyRecommendPlaylist(),
            recommendPlaylist({ limit }),
        ]);
        let recommend = playlists[0]?.recommend ?? [];
        if (recommend.length) {
            if (removePrivateRecommand) recommend = recommend.slice(1);
            await replaceRecommendResult(recommend);
        }
        return recommend.concat(playlists[1]?.result ?? []).slice(0, limit);
    } else {
        const response: any = await recommendPlaylist({ limit });
        return response?.result;
    }
}

async function replaceRecommendResult(recommend: any) {
    for (let r of recommend) {
        if (specialPlaylist.indexOf(r.id) > -1) {
            const data: any = await getPlaylistDetail(r.id, true);
            const playlist = data?.playlist;
            if (playlist) {
                r.name = playlist.name;
                r.picUrl = playlist.coverImgUrl;
            }
        }
    }
}