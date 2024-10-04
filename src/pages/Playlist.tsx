import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dataStore, enableMainScrolling, fetchLikedPlaylist } from "@/store/coreSlice";
import Cover from "@/components/Cover";
import ContextMenu, { ContextMenuHandle } from "@/components/ContextMenu";
import { formatDate, resizeImage } from "@/utils/data";
import ButtonTwoTone from "@/components/ButtonTwoTone";
import TrackList from "@/components/TrackList";
import {
    deletePlaylist,
    getPlaylistDetail,
    subscribePlaylist,
} from "@/api/playlist";
import NProgress from "nprogress";
import { getTrackDetail } from "@/api/track";
import Modal from "@/components/Modal";
import { specialPlaylist } from "@/static/playlistData";
import auth from "@/utils/auth";
import { storeData } from "@/utils";
import SvgIcon from "@/components/SvgIcon";
import { confirm, message } from "@tauri-apps/plugin-dialog";
import { player } from "@/business/player";
import "./playlist.scss";

const Playlist = () => {
    const { t } = useTranslation();
    const data = useAppSelector(dataStore);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    let location = useLocation();
    let { id } = useParams();
    const playlistMenu = useRef<ContextMenuHandle>(null);
    const [playlist, setPlaylist] = useState({
        id: 0,
        name: "",
        coverImgUrl: "",
        creator: {
            userId: "",
            nickname: "",
        },
        trackIds: [],
        privacy: 0,
        trackCount: 0,
        updateTime: 0,
        subscribed: false,
        description: "",
        englishTitle: "",
        updateFrequency: "",
    });
    const [tracks, setTracks] = useState<any>([]);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [inputFocus, setInputFocus] = useState(false);
    const [searchInputWidth, setSearchInputWidth] = useState("0px");
    const [displaySearchInPlaylist, setDisplaySearchInPlaylist] =
        useState(false);
    const [inputSearchKeyWords, setInputSearchKeyWords] = useState("");
    const inputSearchKeyWordsRef = useRef("");
    const [searchKeyWords, setSearchKeyWords] = useState("");
    const lastLoadedTrackIndex = useRef(9);
    const [hasMore, setHasMore] = useState(false);
    const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (location.pathname === "/library/liked-songs") {
            loadData(data.likedSongPlaylistID);
        } else {
            loadData(Number.parseInt(id!));
        }
    }, []);

    const specialPlaylistInfo = useMemo(() => {
        return specialPlaylist[playlist.id];
    }, [playlist.id]);

    const loadData = (id: number) => {
        NProgress.start();
        getPlaylistDetail(id, false)
            .then((data: any) => {
                if (data.playlist) {
                    data.playlist.tracks = auth.mapTrackPlayableStatus(
                        data.playlist.tracks,
                        data.privileges || []
                    );
                }
                return data;
            })
            .then((data) => {
                setPlaylist(data.playlist);
                setTracks(data.playlist.tracks);
                NProgress.done();
                lastLoadedTrackIndex.current = data.playlist.tracks.length - 1;
                return data;
            })
            .then(() => {
                if (playlist.trackCount > tracks.length) {
                    loadMore();
                }
            });
    };

    const loadMore = (loadNum = 100) => {
        let trackIds: any[] = playlist.trackIds.filter(
            (t: any, index: number) => {
                if (
                    index > lastLoadedTrackIndex.current &&
                    index <= lastLoadedTrackIndex.current + loadNum
                ) {
                    return t;
                }
            }
        );
        trackIds = trackIds.map((t: any) => t.id);
        getTrackDetail(trackIds.join(",")).then((data) => {
            tracks.push(...data.songs);
            lastLoadedTrackIndex.current += trackIds.length;
            if (lastLoadedTrackIndex.current + 1 === playlist.trackIds.length) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        });
    };

    const isLikeSongsPage = useMemo(() => {
        return location.pathname === "/library/liked-songs";
    }, [location.pathname]);

    const toggleFullDescription = () => {
        setShowFullDescription(!showFullDescription);
        if (showFullDescription) {
            enableMainScrolling(false);
        } else {
            enableMainScrolling(true);
        }
    };

    const playPlaylistById = (trackId = "first") => {
        let trackIds = playlist.trackIds.map((t: any) => t.id);
        player.replacePlaylist(trackIds, playlist.id, "playlist", trackId);
    };

    const inputDebounce = () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setSearchKeyWords(inputSearchKeyWordsRef.current);
        }, 600);
    };

    const filteredTracks = useMemo(() => {
        return tracks.filter(
            (track: any) =>
                (track.name &&
                    track.name
                        .toLowerCase()
                        .includes(searchKeyWords.toLowerCase())) ||
                (track.al.name &&
                    track.al.name
                        .toLowerCase()
                        .includes(searchKeyWords.toLowerCase())) ||
                track.ar.find(
                    (artist: any) =>
                        artist.name &&
                        artist.name
                            .toLowerCase()
                            .includes(searchKeyWords.toLowerCase())
                )
        );
    }, [searchKeyWords, tracks]);

    const isUserOwnPlaylist = useMemo(() => {
        return (
            playlist.creator.userId === data.user.userId &&
            playlist.id !== data.likedSongPlaylistID
        );
    }, [playlist, data]);

    const openMenu = (e: MouseEvent) => {
        playlistMenu.current!.openMenu(e);
    };

    const likePlaylist = (toast = false) => {
        if (!auth.isAccountLoggedIn()) {
            storeData.showToast(t("toast.needToLogin"));
            return;
        }
        subscribePlaylist({
            id: playlist.id,
            t: playlist.subscribed ? 2 : 1,
        }).then((data: any) => {
            if (data.code === 200) {
                playlist.subscribed = !playlist.subscribed;
                if (toast === true)
                    storeData.showToast(
                        playlist.subscribed
                            ? t("playlist.savedToMusicLibrary")
                            : t("playlist.removedFromMusicLibrary")
                    );
            }
            getPlaylistDetail(id, true).then((data: any) => {
                setPlaylist(data.playlist);
            });
        });
    };

    const searchInPlaylist = () => {
        setDisplaySearchInPlaylist(!displaySearchInPlaylist || isLikeSongsPage);
        if (displaySearchInPlaylist == false) {
            setSearchKeyWords("");
            setInputSearchKeyWords("");
        } else {
            setSearchInputWidth("172px");
            loadMore(500);
        }
    };

    const removeTrack = (trackId: string) => {
        if (!auth.isAccountLoggedIn()) {
            storeData.showToast(t("toast.needToLogin"));
            return;
        }
        setTracks(tracks.filter((t: any) => t.id !== trackId));
    };

    const editPlaylist = async () => {
        await message(t("common.functionUnderDevelopment"), {
            title: t("common.tip"),
            kind: "info",
        });
    };

    const onDeletePlaylist = async () => {
        if (!auth.isAccountLoggedIn()) {
            storeData.showToast(t("toast.needToLogin"));
            return;
        }
        const confirmed = await confirm(
            t("playlist.playlistDelete", playlist),
            { title: t("common.delete"), kind: "error" }
        );
        if (confirmed) {
            deletePlaylist(playlist.id.toString()).then(async (data: any) => {
                if (data.code === 200) {
                    await message(t("playlist.playlistDeleted", {name: playlist.name}), {
                        title: t("common.tip"),
                        kind: "warning",
                    });
                    dispatch(fetchLikedPlaylist());
                    navigate(-1);
                } else {
                    await message(t("common.anErrorOccurred"), {
                        title: t("common.tip"),
                        kind: "error",
                    });
                }
            });
        }
    };

    return (
        <div className="playlist">
            <div
                className={
                    specialPlaylistInfo === undefined && !isLikeSongsPage
                        ? "playlistInfo"
                        : "playlistInfo hidden"
                }
            >
                <Cover
                    id={playlist.id}
                    type="playlist"
                    imageUrl={playlist.coverImgUrl}
                    alwaysShowShadow
                    clickCoverToPlay
                    fixedSize={288}
                    coverHover={false}
                    playButtonSize={18}
                    onContextMenu={openMenu}
                />
                <div className="info">
                    <div className="title" onContextMenu={openMenu}>
                        {playlist.privacy === 10 ? (
                            <SvgIcon svgName="lock" />
                        ) : (
                            ""
                        )}
                        {playlist.name}
                    </div>
                    <div className="artist">
                        Playlist by
                        {[
                            5277771961, 5277965913, 5277969451, 5277778542,
                            5278068783,
                        ].includes(playlist.id) ? (
                            <span style={{ fontWeight: 600 }}>Apple Music</span>
                        ) : (
                            ""
                        )}
                        <a
                            href={`https://music.163.com/#/user/home?id=${playlist.creator.userId}`}
                            target="blank"
                        >
                            {playlist.creator.nickname}
                        </a>
                    </div>
                    <div className="date-and-count">
                        {t("playlist.updatedAt")}
                        {formatDate(playlist.updateTime)} ·{" "}
                        {playlist.trackCount}
                        {t("common.songs")}
                    </div>
                    <div
                        className="description"
                        onClick={toggleFullDescription}
                    >
                        {playlist.description}
                    </div>
                    <div className="buttons">
                        <ButtonTwoTone
                            iconClass="play"
                            onClick={() => playPlaylistById()}
                        >
                            <span>{t("common.play")}</span>
                        </ButtonTwoTone>
                        {playlist.creator.userId !== data.user.userId ? (
                            <ButtonTwoTone
                                iconClass={
                                    playlist.subscribed
                                        ? "heart-solid"
                                        : "heart"
                                }
                                iconButton={true}
                                horizontalPadding={0}
                                color={playlist.subscribed ? "blue" : "grey"}
                                textColor={playlist.subscribed ? "#335eea" : ""}
                                backgroundColor={
                                    playlist.subscribed
                                        ? "var(--color-secondary-bg)"
                                        : ""
                                }
                                onClick={() => likePlaylist()}
                            />
                        ) : (
                            ""
                        )}
                        <ButtonTwoTone
                            iconClass="more"
                            iconButton
                            horizontalPadding={0}
                            color="grey"
                            onClick={openMenu}
                        ></ButtonTwoTone>
                    </div>
                </div>
                {displaySearchInPlaylist ? (
                    <div className="searchBox">
                        <div
                            className={
                                inputFocus ? "container active" : "container"
                            }
                        >
                            <SvgIcon svgName="search" />
                            <div className="input">
                                <input
                                    autoFocus
                                    value={inputSearchKeyWords}
                                    placeholder={
                                        inputFocus ? "" : t("playlist.search")
                                    }
                                    onChange={(e) => {
                                        setInputSearchKeyWords(e.target.value);
                                        inputSearchKeyWordsRef.current =
                                            e.target.value;
                                    }}
                                    onInput={() => inputDebounce()}
                                    onFocus={() => setInputFocus(true)}
                                    onBlur={() => setInputFocus(false)}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    ""
                )}
            </div>
            {specialPlaylistInfo !== undefined ? (
                <div className="specialPlaylist">
                    <div
                        className={"title " + specialPlaylistInfo.gradient}
                        onContextMenu={openMenu}
                    >
                        {specialPlaylistInfo.name}
                    </div>
                    <div className="subtitle">
                        {playlist.englishTitle} · {playlist.updateFrequency}
                    </div>

                    <div className="buttons">
                        <ButtonTwoTone
                            iconClass="play"
                            color="grey"
                            onClick={() => playPlaylistById()}
                        >
                            {t("common.play")}
                        </ButtonTwoTone>
                        {playlist.creator.userId !== data.user.userId ? (
                            <ButtonTwoTone
                                iconClass={
                                    playlist.subscribed
                                        ? "heart-solid"
                                        : "heart"
                                }
                                iconButton
                                horizontalPadding={0}
                                color={playlist.subscribed ? "blue" : "grey"}
                                textColor={playlist.subscribed ? "#335eea" : ""}
                                backgroundColor={
                                    playlist.subscribed
                                        ? "var(--color-secondary-bg)"
                                        : ""
                                }
                                onClick={() => likePlaylist()}
                            ></ButtonTwoTone>
                        ) : (
                            ""
                        )}
                        <ButtonTwoTone
                            iconClass="more"
                            iconButton
                            horizontalPadding={0}
                            color="grey"
                            onClick={openMenu}
                        ></ButtonTwoTone>
                    </div>
                </div>
            ) : (
                ""
            )}
            {isLikeSongsPage ? (
                <div className="userInfo">
                    <h1>
                        <img
                            className="avatar"
                            src={resizeImage(data.user.avatarUrl)}
                            loading="lazy"
                        />
                        {data.user.nickname + t("playlist.favoriteMusic")}
                    </h1>
                    <div
                        className="searchBoxLikepage"
                        onClick={searchInPlaylist}
                    >
                        <div
                            className={
                                inputFocus ? "container active" : "container"
                            }
                        >
                            <SvgIcon svgName="search" />
                            <div
                                className="input"
                                style={{ width: searchInputWidth }}
                            >
                                {displaySearchInPlaylist ? (
                                    <input
                                        value={inputSearchKeyWords}
                                        placeholder={
                                            inputFocus
                                                ? ""
                                                : t("playlist.search")
                                        }
                                        onChange={(e) => {
                                            setInputSearchKeyWords(
                                                e.target.value
                                            );
                                            inputSearchKeyWordsRef.current =
                                                e.target.value;
                                        }}
                                        onInput={() => inputDebounce()}
                                        onFocus={() => setInputFocus(true)}
                                        onBlur={() => setInputFocus(false)}
                                    />
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                ""
            )}
            <TrackList
                id={playlist.id}
                tracks={filteredTracks}
                type="playlist"
                extraContextMenuItem={
                    isUserOwnPlaylist ? ["removeTrackFromPlaylist"] : []
                }
                removeTrack={removeTrack}
            />
            <div className="load-more">
                {hasMore ? (
                    <ButtonTwoTone color="grey" onClick={() => loadMore(100)}>
                        {t("common.loadMore")}
                    </ButtonTwoTone>
                ) : (
                    ""
                )}
            </div>
            <Modal
                show={showFullDescription}
                close={toggleFullDescription}
                showFooter={false}
                clickOutsideHide
                title={t("playlist.playlistIntroduction")}
            >
                {playlist.description}
            </Modal>
            <ContextMenu ref={playlistMenu}>
                <div className="item" onClick={() => likePlaylist(true)}>
                    {playlist.subscribed
                        ? t("playlist.removeFromMusicLibrary")
                        : t("playlist.saveToMusicLibrary")}
                </div>
                <div className="item" onClick={searchInPlaylist}>
                    {t("playlist.searchWithinPlaylist")}
                </div>
                {playlist.creator.userId === data.user.userId ? (
                    <div className="item" onClick={editPlaylist}>
                        {t("playlist.editPlaylistInformation")}
                    </div>
                ) : (
                    ""
                )}
                {playlist.creator.userId === data.user.userId ? (
                    <div className="item" onClick={onDeletePlaylist}>
                        {t("playlist.deletePlaylist")}
                    </div>
                ) : (
                    ""
                )}
            </ContextMenu>
        </div>
    );
};

export default Playlist;
