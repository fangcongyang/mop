import { updateTitle } from "@/store/coreSlice";
import playerEventEmitter from "@/event/playerEventEmitter";
import { Store } from "@reduxjs/toolkit";
import { cacheTrackSource } from "@/db";
import { getPlaylistDetail, intelligencePlaylist } from "@/api/playlist";
import { getArtist } from "@/api/artist";
import { getAlbum } from "@/api/album";
import { store } from "@/utils/store";

export const initPlayerListener = (reduxStore: Store) => {
    playerEventEmitter.on("PLAYER:UPDATE_TITLE", (title: any) => {
        reduxStore.dispatch(updateTitle(title));
    });

    playerEventEmitter.on(
        "PLAYER:TRACK_GET_COMPLETE",
        (trackInfo: { track: any; source: any; br: any; from?: string }) => {
            store
                .get("automaticallyCacheSongs")
                .then((automaticallyCacheSongs: boolean) => {
                    if (automaticallyCacheSongs)
                        cacheTrackSource(
                            trackInfo.track,
                            trackInfo.source,
                            trackInfo.br,
                            trackInfo.from
                        );
                });
        }
    );

    playerEventEmitter.on(
        "PLAYER:PALY_PLAYLIST",
        (
            id: number | undefined,
            trackId: string | number = "first",
            noCache = false
        ) => {
            getPlaylistDetail(id, noCache).then((data: any) => {
                let trackIDs = data.playlist.trackIds.map((t: any) => t.id);
                playerEventEmitter.emit(
                    "PLAYER:REPLACE_PLAYLIST",
                    trackIDs,
                    id,
                    "playlist",
                    trackId
                );
            });
        }
    );

    playerEventEmitter.on(
        "PLAYER:PLAY_ARTIST",
        (id: number, trackID = "first") => {
            getArtist(id.toString()).then((data) => {
                let trackIDs = data.hotSongs.map((t: any) => t.id);
                playerEventEmitter.emit(
                    "PLAYER:REPLACE_PLAYLIST",
                    trackIDs,
                    id,
                    "artist",
                    trackID
                );
            });
        }
    );

    playerEventEmitter.on(
        "PLAYER:PLAY_ALBUM",
        (id: number, trackId: string | number = "first") => {
            getAlbum(id).then((data) => {
                let trackIds = data.songs.map((t: any) => t.id);
                playerEventEmitter.emit(
                    "PLAYER:REPLACE_PLAYLIST",
                    trackIds,
                    id,
                    "album",
                    trackId
                );
            });
        }
    );

    playerEventEmitter.on(
        "PLAYER:PLAY_INTELLIGENCELIST",
        (id: number, trackId = "first", noCache = false) => {
            getPlaylistDetail(id, noCache).then((data: any) => {
                const randomId = Math.floor(
                    Math.random() * (data.playlist.trackIds.length + 1)
                );
                const songId = data.playlist.trackIds[randomId].id;
                intelligencePlaylist({ id: songId, pid: id }).then(
                    (result: any) => {
                        let trackIds = result.data.map((t: any) => t.id);
                        playerEventEmitter.emit(
                            "PLAYER:REPLACE_PLAYLIST",
                            trackIds,
                            id,
                            "playlist",
                            trackId
                        );
                    }
                );
            });
        }
    );
};
