import { CSSProperties, FunctionComponent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import TrackListItem from "./TrackListItem";
import { resizeImage } from '@/utils/data';
import ContextMenu, { ContextMenuHandle } from "./ContextMenu";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
    likedStore,
    likeATrack,
    updateModal,
    updateLikedXXX,
} from "@/store/coreSlice"
import auth from "@/utils/auth";
import { showToast } from "@/utils";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { addOrRemoveTrackFromPlaylist } from "@/api/playlist";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { cloudDiskTrackDelete } from "@/api/user";
import { player } from "@/business/player";
import playerEventEmitter from "@/event/playerEventEmitter";
import { PlayerObserver } from "@/type/player";

interface TrackListProps {
    tracks: any[],
    type: "tracklist" | "album" | "playlist" | "cloudDisk",
    id?: number,
    dbclickTrackFunc?: string
    albumObject?: any
    extraContextMenuItem?: string[]
    columnNumber?: number,
    itemKey?: string
    highlightPlayingTrack?: boolean
    removeTrack?: Function
}

const TrackList: FunctionComponent<TrackListProps> = (props) => {
    const { t } = useTranslation();
    const menu = useRef<ContextMenuHandle>(null);
    const dispatch = useAppDispatch()
    const liked = useAppSelector(likedStore);
    const [rightClickedTrack, setRightClickedTrack] = useState(
        {
            id: 0,
            name: '',
            ar: [{ name: '' }],
            al: { picUrl: '' },
            songId: '',
            songName: ''
        }
    )
    const [rightClickedTrackIndex, setRightClickedTrackIndex] = useState(-1);
    const [currentTrackId, setCurrentTrackId] = useState(player.currentTrackId);
    const trackListPlayerObserver = new PlayerObserver("trackList");

    useEffect(() => {
        trackListPlayerObserver.on("currentTrackId", () => {
            setCurrentTrackId(player.currentTrackId);
        })
        player.registerObserver(trackListPlayerObserver);
        return () => {
            player.removeObserver(trackListPlayerObserver);
        }
    })

    const listStyles = () => {
        let ls: CSSProperties = {
        }
        if (props.type === 'tracklist') {
            ls = {
                display: 'grid',
                gap: '4px',
                gridTemplateColumns: `repeat(${props.columnNumber}, 1fr)`,
            }
        }
        return ls
    }

    const playThisList = (trackId: number) => {
        let trackIds;
        switch (props.dbclickTrackFunc) {
            case 'default':
                playThisListDefault(trackId);
                break;
            case 'playTrackOnListByID':
                player.playTrackOnListById(trackId);
                break;
            case 'playPlaylistByID':
                playerEventEmitter.emit('PLAYER:PALY_PLAYLIST', props.id, trackId);
                break;
            case 'playAList':
                trackIds = props.tracks.map(t => t.id || t.songId);
                player.replacePlaylist(trackIds, props.id, 'artist', trackId);
                break;
            case 'dailyTracks':
                trackIds = props.tracks.map(t => t.id);
                player.replacePlaylist(trackIds, '/daily/songs', 'url', trackId);
                break;
            case 'playCloudDisk':
                trackIds = props.tracks.map(t => t.id || t.songId);
                player.replacePlaylist(trackIds, props.id, 'cloudDisk', trackId);
                break;
            default:
                break;
        }
    }

    const playThisListDefault = (trackId: number) => {
        if (props.type === 'playlist') {
            playerEventEmitter.emit('PLAYER:PALY_PLAYLIST', props.id, trackId);
        } else if (props.type === 'album') {
            playerEventEmitter.emit('PLAYER:PLAY_ALBUM', props.id, trackId);
        } else if (props.type === 'tracklist') {
            let trackIds = props.tracks.map(t => t.id);
            player.replacePlaylist(trackIds, props.id, 'artist', trackId);
        }
    }

    const openMenu = (e: MouseEvent, track: any, index = -1) => {
        setRightClickedTrack(track);
        setRightClickedTrackIndex(index);
        menu.current!.openMenu(e);
    }

    const rightClickedTrackComputed = useMemo(() => {
        return props.type === 'cloudDisk'
            ? {
                id: 0,
                name: '',
                ar: [{ name: '' }],
                al: { picUrl: '' },
            }
            : rightClickedTrack;
    }, [rightClickedTrack])

    const isRightClickedTrackLiked = useMemo(() => {
        return liked.songs.includes(rightClickedTrack?.id);
    }, [rightClickedTrack?.id, liked.songs])

    const play = () => {
        player.addTrackToPlayNext(rightClickedTrack.id, true);
    }

    const addToQueue = () => {
        player.addTrackToPlayNext(rightClickedTrack.id);
    }

    const removeTrackFromQueue = () => {
        player.removeTrackFromQueue(rightClickedTrackIndex);
    }

    const removeTrackFromPlaylist = async () => {
        if (!auth.isAccountLoggedIn()) {
            showToast(t('toast.needToLogin'));
            return;
        }
        const confirmed = await confirm(t('trackList.playlistDeleted', rightClickedTrack), { title: t('common.delete'), kind: 'error' });
        if (confirmed) {
            let trackId = rightClickedTrack.id;
            addOrRemoveTrackFromPlaylist({
                op: 'del',
                pid: props.id,
                tracks: trackId,
            }).then((data: any) => {
                showToast(
                    data.body.code === 200
                        ? t('toast.removedFromPlaylist')
                        : data.body.message
                );
                if (props.removeTrack) {
                    props.removeTrack(trackId)
                }
            });
        }
    }

    const addTrackToPlaylist = () => {
        if (!auth.isAccountLoggedIn()) {
            showToast(t('toast.needToLogin'));
            return;
        }
        updateModal({
            modalName: 'addTrackToPlaylistModal',
            key: 'show',
            value: true,
        });
        updateModal({
            modalName: 'addTrackToPlaylistModal',
            key: 'selectedTrackId',
            value: rightClickedTrack.id,
        });
    }

    const copyLink = () => {
        writeText(`https://music.163.com/song?id=${rightClickedTrack.id}`)
            .then(function () {
                showToast(t('toast.copied'));
            })
            .catch(error => {
                showToast(`${t('toast.copyFailed')}${error}`);
            });
    }

    const removeTrackFromCloudDisk = async () => {
        const confirmed = await confirm(t('trackList.cloudDiskDeleted', rightClickedTrack), { title: t('common.delete'), kind: 'error' });
        if (confirmed) {
            let trackId = rightClickedTrack.songId;
            cloudDiskTrackDelete(trackId).then((data: any) => {
                showToast(
                    data.code === 200 ? t('toast.removedFromCloudDisk') : data.message
                );
                let newCloudDisk = liked.cloudDisk.filter(
                    (t: any) => t.songId !== trackId
                );
                dispatch(updateLikedXXX({
                    name: 'cloudDisk',
                    data: newCloudDisk,
                }))
            });
        }
    }

    return (
        <div className="track-list">
            <div style={listStyles()}>
                {
                    props.tracks.map((track: any, index: number) => {
                        return (
                            <TrackListItem
                                key={props.itemKey === 'id' ? track.id : `${track.id}${index}`}
                                trackProp={track}
                                trackNo={index + 1}
                                type={props.type}
                                highlightPlayingTrack={props.highlightPlayingTrack}
                                onDoubleClick={() => playThisList(track.id || track.songId)}
                                onContextMenu={(e: MouseEvent) => openMenu(e, track, index)}
                                rightClickedTrack={rightClickedTrack}
                                playThisList={playThisList}
                                albumObject={props.albumObject}
                                currentTrackId={currentTrackId}
                            />
                        )
                    })
                }
            </div>

            <ContextMenu ref={menu} >
                <div>
                    {
                        props.type !== 'cloudDisk' ?
                            <div>
                                <div className="item-info">
                                    <img
                                        src={resizeImage(rightClickedTrackComputed.al.picUrl, 224)}
                                        loading="lazy"
                                    />
                                    <div className="info">
                                        <div className="title">{rightClickedTrackComputed.name}</div>
                                        <div className="subtitle">{rightClickedTrackComputed.ar[0].name}</div>
                                    </div>
                                </div>
                                <hr />
                            </div>
                            : ''
                    }
                    <div className="item" onClick={play}>{t('common.play')}</div>
                    <div className="item" onClick={addToQueue}>
                        {t('trackList.addToQueue')}
                    </div>
                    {
                        props.extraContextMenuItem?.includes('removeTrackFromQueue') ?
                            <div
                                className="item"
                                onClick={removeTrackFromQueue}
                            >
                                {t('trackList.removeFromQueue')}
                            </div>
                            : ''
                    }
                    {
                        props.type !== 'cloudDisk' ?
                            <div>
                                <hr />
                                {
                                    !isRightClickedTrackLiked ?
                                        <div
                                            className="item"
                                            onClick={() => dispatch(likeATrack(rightClickedTrack.id))}
                                        >
                                            {t('trackList.saveToMyLikedSongs')}
                                        </div> :
                                        <div className="item" onClick={() => dispatch(likeATrack(rightClickedTrack.id))}>
                                            {t('trackList.removeFromMyLikedSongs')}
                                        </div>
                                }
                            </div>
                            : ''
                    }
                    {
                        props.extraContextMenuItem?.includes('removeTrackFromPlaylist') ?
                            <div
                                className="item"
                                onClick={removeTrackFromPlaylist}
                            >
                                {t('trackList.removeFromPlaylist')}
                            </div>
                            : ''
                    }
                    {
                        props.type !== 'cloudDisk' ?
                            <div>
                                <div
                                    className="item"
                                    onClick={addTrackToPlaylist}
                                >
                                    {t('trackList.addToPlaylist')}
                                </div>
                                <div className="item" onClick={copyLink}>
                                    {t('contextMenu.copyUrl')}
                                </div>
                            </div>
                            : ''
                    }
                    {
                        props.extraContextMenuItem?.includes('removeTrackFromCloudDisk') ?
                            <div
                                className="item"
                                onClick={removeTrackFromCloudDisk}
                            >
                                {t('trackList.removeFromCloudDisk')}
                            </div>
                            : ''
                    }
                </div>
            </ContextMenu>
        </div>
    )
}

TrackList.defaultProps = {
    tracks: [],
    type: 'tracklist',
    id: 0,
    dbclickTrackFunc: 'default',
    albumObject: {
        artist: {
            name: '',
        }
    },
    extraContextMenuItem: [],
    columnNumber: 4,
    highlightPlayingTrack: true,
    itemKey: 'id'
}

export default TrackList;