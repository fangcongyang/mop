import { MouseEventHandler, useMemo, useState, } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
    settingsStore,
    likedStore,
    likeATrack
} from "@/store/coreSlice"
import SvgIcon from "./SvgIcon";
import ArtistsInLine from "./ArtistsInLine";
import ExplicitSymbol from "./ExplicitSymbol";
import { isNil } from 'lodash';
import styles from './TrackListItem.module.scss'
import { formatTime } from "@/utils/data";

interface TrackListItemProps {
    key: string
    trackProp: any
    trackNo: number
    type: string,
    highlightPlayingTrack?: boolean
    onContextMenu?: MouseEventHandler<HTMLElement>
    onDoubleClick?: MouseEventHandler<HTMLElement>
    rightClickedTrack: any
    playThisList: Function
    albumObject: any
    currentTrackId: number
}

const TrackListItem = (props: TrackListItemProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(settingsStore);
    const liked = useAppSelector(likedStore);
    const [hover, setHover] = useState(false);

    const track = useMemo(() => {
        return props.type === 'cloudDisk'
            ? props.trackProp.simpleSong
            : props.trackProp;
    }, [props.type, props.trackProp])

    const playable = useMemo(() => {
        return track?.privilege?.pl > 0 || track?.playable;
    }, [track])

    const isMenuOpened = useMemo(() => {
        return props.rightClickedTrack.id === track.id ? true : false;
    }, [props.rightClickedTrack.id, track.id])

    const focus = useMemo(() => {
        return (
            (hover && props.rightClickedTrack.id === 0) || isMenuOpened
        );
    }, [hover, props.rightClickedTrack.id])

    const trackClass = () => {
        let trackClass = [styles[props.type]];
        if (!playable && settings.showUnavailableSongInGreyStyle)
            trackClass.push(styles.disable);
        if (isPlaying && props.highlightPlayingTrack)
            trackClass.push(styles.playing);
        if (focus) trackClass.push(styles.focus);
        return trackClass.join(' ');
    }

    const isPlaying = useMemo(() => {
        return props.currentTrackId === track?.id;
    }, [props.currentTrackId, track])

    const isAlbum = useMemo(() => {
        return props.type === 'album';
    }, [props.type])

    const showAlbumName = useMemo(() => {
        return props.type !== 'album' && props.type !== 'trackList';
    }, [props.type])

    const goToAlbum = () => {
        if (track.al.id === 0) return;
        navigate('/album/' + track.al.id)
    }

    const subTitle = useMemo(() => {
        let tn = undefined;
        if (
            track?.tns?.length > 0 &&
            track.name !== track.tns[0]
        ) {
            tn = track.tns[0];
        }

        //优先显示alia
        if (settings.subTitleDefault) {
            return track?.alia?.length > 0 ? track.alia[0] : tn;
        } else {
            return tn === undefined ? track.alia?.[0] : tn;
        }
    }, [track, settings.subTitleDefault])

    const isSubTitle = () => {
        return (
            (track?.tns?.length > 0 &&
                track.name !== track.tns[0]) ||
            track.alia?.length > 0
        );
    }

    const artists = useMemo(() => {
        const { ar, artists } = track;
        if (!isNil(ar)) return ar;
        if (!isNil(artists)) return artists;
        return [];
    }, [track.ar, track.artists])

    const album = useMemo(() => {
        return track.album || track.al || track?.simpleSong?.al;
    }, [track.album, track.al, track?.simpleSong])

    const isLiked = useMemo(() => {
        return liked.songs.includes(track?.id);
    }, [liked.songs, track])

    const showLikeButton = useMemo(() => {
        return props.type !== 'trackList' && props.type !== 'cloudDisk';
    }, [props.type])

    const showTrackTime = useMemo(() => {
        return props.type !== 'trackList';
    }, [props.type])

    const imgUrl = () => {
        let image =
            track?.al?.picUrl ??
            track?.album?.picUrl ??
            'https://p2.music.126.net/UeTuwE7pvjBpypWLudqukA==/3132508627578625.jpg';
        return image + '?param=224y224';
    }

    const likeThisSong = () => {
        dispatch(likeATrack(track.id));
    }

    return (
        <div className={styles.track  + " " + trackClass()}
            title={settings.enableUnblockNeteaseMusic ? track.reason : ''}
            onMouseOver={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onContextMenu={props.onContextMenu}
            onDoubleClick={props.onDoubleClick}>
            {
                !isAlbum ?
                    <img
                        src={imgUrl()}
                        loading="lazy"
                        className={hover ? 'focus' : ''}
                        onClick={goToAlbum}
                    />
                    : ''
            }
            {
                isAlbum ?
                    <div className="no">
                        {
                            focus && playable && !isPlaying ?
                                <button onClick={() => props.playThisList(track.id)}>
                                    <SvgIcon
                                        svgName="play"
                                        svgStyle={{ height: '14px', width: '14px' }}
                                    />
                                </button>
                                : ''
                        }
                        {
                            (!focus || !playable) && !isPlaying ?
                                <span>{props.trackNo}</span>
                                : ''
                        }
                        {
                            isPlaying ?
                                <button>
                                    <SvgIcon
                                        svgName="volume"
                                        svgStyle={{ height: '16px', width: '16px' }}
                                    ></SvgIcon>
                                </button>
                                : ''
                        }
                    </div>
                    : ''
            }
            <div className="title-and-artist">
                <div className="container">
                    <div className="title">
                        {track.name}
                        {
                            isSubTitle() ?
                                <span title={subTitle} className="sub-title">
                                    ({subTitle})
                                </span>
                                : ''
                        }
                        {
                            isAlbum ?
                                <span className="featured">
                                    <ArtistsInLine artists={track.ar}
                                        exclude={props.albumObject.artist.name}
                                        prefix="-"
                                    />
                                </span>
                                : ''
                        }
                        {
                            isAlbum && track.mark === 1318912 ?
                                <span className="explicit-symbol">
                                    <ExplicitSymbol />
                                </span>
                                : ''
                        }
                    </div>
                    {
                        !isAlbum ?
                            <div className="artist">
                                {
                                    track.mark === 1318912 ?
                                        <span
                                            className="explicit-symbol before-artist"
                                        >
                                            <ExplicitSymbol size={15} />
                                        </span>
                                        : ''
                                }
                                <ArtistsInLine artists={artists} />
                            </div>
                            : ''
                    }
                </div>
                <div></div>
            </div>
            {
                showAlbumName ?
                    <div className="album">
                        {
                            album && album.id ?
                                <Link to={`/album/${album.id}`}>{album.name}</Link>
                                : ''
                        }
                        <div></div>
                    </div>
                    : ''
            }
            {
                showLikeButton ?
                    <div className={styles.actions}>
                        <button onClick={likeThisSong}>
                            <SvgIcon
                                svgName="heart"
                                svgStyle={{ visibility: focus && !isLiked ? 'visible' : 'hidden' }} />
                            {
                                isLiked ?
                                    <SvgIcon svgName="heart-solid"></SvgIcon>
                                    : ''
                            }
                        </button >
                    </div >
                    : ''
            }
            {
                showTrackTime ?
                    <div className="time">
                        {formatTime(track.dt)}
                    </div>
                    : ''
            }
            {
                track.playCount ?
                    <div className="count"> {track.playCount}</div>
                    : ''
            }
        </div >
    )
}

export default TrackListItem;