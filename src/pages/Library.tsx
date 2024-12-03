import {
    useState,
    useRef,
    useMemo,
    useEffect,
    RefObject,
    FunctionComponent,
    MouseEvent,
    ChangeEvent,
} from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useTranslation } from "react-i18next";
import {
    dataStore,
    fetchCloudDisk,
    fetchLikedAlbums,
    fetchLikedArtists,
    fetchLikedMVs,
    fetchLikedPlaylist,
    fetchLikedSongs,
    fetchLikedSongsWithDetails,
    fetchPlayHistory,
    likedStore,
    setLibraryPlaylistFilter,
    updateModal,
} from "@/store/coreSlice";
import { resizeImage } from "@/utils/data";
import { randomNum } from "@/utils/common";
import styles from "./Library.module.scss";
import SvgIcon from "@/components/SvgIcon";
import TrackList from "@/components/TrackList";
import { getLyric } from "@/api/track";
import NProgress from "nprogress";
import _ from "lodash";
import auth from "@/utils/auth";
import { storeData } from "@/utils";
import CoverRow from "@/components/CoverRow";
import MvRow from "@/components/MvRow";
import ContextMenu, { ContextMenuHandle } from "@/components/ContextMenu";
import { useNavigate } from "react-router-dom";
import playerEventEmitter from "@/event/playerEventEmitter";

interface LibraryProps {
    parentRef: RefObject<HTMLDivElement>;
}

const Library: FunctionComponent<LibraryProps> = (props) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const data = useAppSelector(dataStore);
    const liked = useAppSelector(likedStore);
    const library = useRef(null);
    const playlistTabMenu = useRef<ContextMenuHandle>(null);
    const playModeTabMenu = useRef<ContextMenuHandle>(null);
    const [currentTab, setCurrentTab] = useState("playlists");
    const [playHistoryMode, setPlayHistoryMode] = useState("week");
    const cloudDiskUploadInput = useRef<HTMLInputElement>(null);
    const [pickedLyric, setPickedLyric] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = _.debounce(async () => {
        NProgress.start();
        if (liked.songsWithDetails.length > 0) {
            NProgress.done();
            dispatch(fetchLikedSongsWithDetails());
        } else {
            dispatch(fetchLikedPlaylist()).then(() => {
                dispatch(fetchLikedSongsWithDetails()).then(() => {
                    NProgress.done();
                });
            });
        }
        dispatch(fetchLikedSongs());
        dispatch(fetchLikedAlbums());
        dispatch(fetchLikedArtists());
        dispatch(fetchLikedMVs());
        dispatch(fetchCloudDisk());
        dispatch(fetchPlayHistory());
    }, 500);

    const goToLikedSongsList = async () => {
        navigate("/library/liked-songs");
    };

    const extractLyricPart = (rawLyric: string) => {
        return rawLyric.split("]").pop()!.trim();
    };

    useEffect(() => {
        if (liked.songs.length === 0) {
            return;
        }
        getLyric(liked.songs[randomNum(0, liked.songs.length - 1)]).then(
            (data) => {
                let lyric = "";
                if (data.lrc !== undefined) {
                    const isInstrumental = data.lrc.lyric
                        .split("\n")
                        .filter((l: string) => l.includes("纯音乐，请欣赏"));
                    if (isInstrumental.length === 0) {
                        lyric = data.lrc.lyric;
                    }
                }
                if (!lyric) return;

                const lyricLine = lyric
                    .split("\n")
                    .filter(
                        (line) =>
                            !line.includes("作词") && !line.includes("作曲")
                    );

                // Pick 3 or fewer lyrics based on the lyric lines.
                const lyricsToPick = Math.min(lyricLine.length, 3);

                // The upperBound of the lyric line to pick
                const randomUpperBound = lyricLine.length - lyricsToPick;
                const startLyricLineIndex = randomNum(0, randomUpperBound - 1);

                // Pick lyric lines to render.
                setPickedLyric(
                    lyricLine
                        .slice(
                            startLyricLineIndex,
                            startLyricLineIndex + lyricsToPick
                        )
                        .map(extractLyricPart)
                );
            }
        );
    }, [liked.songs]);

    const playlistFilter = useMemo(() => {
        return data.libraryPlaylistFilter || "all";
    }, [data]);

    const filterPlaylists = useMemo(() => {
        const playlists = liked.playlists.slice(1);
        const userId = data.user.userId;
        if (playlistFilter === "mine") {
            return playlists.filter((p: any) => p.creator.userId === userId);
        } else if (playlistFilter === "liked") {
            return playlists.filter((p: any) => p.creator.userId !== userId);
        }
        return playlists;
    }, [playlistFilter, liked.playlists]);

    const openPlayModeTabMenu = (e: MouseEvent) => {
        playModeTabMenu.current!.openMenu(e);
    };

    const updateCurrentTab = (tab: string) => {
        if (!auth.isAccountLoggedIn() && tab !== "playlists") {
            storeData.showToast(t("toast.needToLogin"));
            return;
        }
        setCurrentTab(tab);
        props.parentRef.current!.scrollTo({ top: 375, behavior: "smooth" });
    };

    const openPlaylistTabMenu = (e: MouseEvent) => {
        playlistTabMenu.current!.openMenu(e);
    };

    const openAddPlaylistModal = () => {
        if (!auth.isAccountLoggedIn()) {
            storeData.showToast(t("toast.needToLogin"));
            return;
        }
        dispatch(
            updateModal({
                modalName: "newPlaylistModal",
                key: "show",
                value: true,
            })
        );
    };

    const selectUploadFiles = async () => {
        cloudDiskUploadInput.current!.click();
    };

    const uploadSongToCloudDisk = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files?.length > 0 && files[0]) {
            const file = files[0];
            const reader = new FileReader();

            reader.addEventListener("load", async () => {
                // 获取文件的内容，它是一个 base64 编码的字符串
                const content = reader.result as string;
                let params = {
                    name: file.name,
                    size: file.size,
                    content,
                };
                console.log(params);
            });

            reader.readAsDataURL(file);
        }

        // const headers: Map<string, string> = new Map();
        // headers.set("Content-Type", "application/json");
        // upload(
        //     "https://example.com/file-upload",
        //     "./path/to/my/file.txt",
        //     (progress, total) => {
        //         if (progress == total) {
        //             //     let newCloudDisk = this.liked.cloudDisk;
        //             //     newCloudDisk.unshift(result.privateCloud);
        //             //     this.$store.commit('updateLikedXXX', {
        //             //       name: 'cloudDisk',
        //             //       data: newCloudDisk,
        //             //     });

        //         }
        //     },
        //     headers
        // ).then(result => {
        //     console.log(result);
        // });
        // uploadSong(files[0]).then(result => {
        //   if (result.code === 200) {
        //   }
        // });
    };

    const changePlaylistFilter = (type: string) => {
        dispatch(setLibraryPlaylistFilter(type));
        window.scrollTo({ top: 375, behavior: "smooth" });
    };

    const playLikedSongs = () => {
        playerEventEmitter.emit(
            "PLAYER:PALY_PLAYLIST",
            liked.playlists[0].id,
            "first",
            true
        );
    };

    const playIntelligenceList = () => {
        playerEventEmitter.emit(
            "PLAYER:PLAY_INTELLIGENCELIST",
            liked.playlists[0].id,
            "first",
            true
        );
    };

    const playHistoryList = useMemo(() => {
        if (playHistoryMode === "week") {
            return liked.playHistory.weekData;
        }
        if (playHistoryMode === "all") {
            return liked.playHistory.allData;
        }
        return [];
    }, [playHistoryMode, liked.playHistory]);

    return (
        <div ref={library}>
            <h1 className={styles.h1}>
                <img
                    className="avatar"
                    src={resizeImage(data.user.avatarUrl)}
                    loading="lazy"
                />
                {data.user.nickname + t("library.sLibrary")}
            </h1>
            <div className={styles.sectionOne}>
                <div className={styles.likedSongs} onClick={goToLikedSongsList}>
                    <div className="top">
                        <p>
                            {pickedLyric.map((line: any, index: number) => {
                                if (line !== "") {
                                    return (
                                        <span key={`${line}${index}`}>
                                            {line}
                                            <br />
                                        </span>
                                    );
                                }
                            })}
                        </p>
                    </div>
                    <div className="bottom">
                        <div className="titles">
                            <div className="title">
                                {t("library.likedSongs")}
                            </div>
                            <div className="sub-title">
                                {liked.songs.length + t("common.songs")}
                            </div>
                        </div>
                        <button onClick={openPlayModeTabMenu}>
                            <SvgIcon svgName="play" />
                        </button>
                    </div>
                </div>
                <div className="songs">
                    <TrackList
                        id={
                            liked.playlists.length > 0
                                ? liked.playlists[0].id
                                : 0
                        }
                        tracks={liked.songsWithDetails}
                        columnNumber={3}
                        dbClickTrackFunc="playPlaylistByID"
                    />
                </div>
            </div>
            <div className={styles.sectionTwo}>
                <div className="tabs-row">
                    <div className="tabs">
                        <div
                            className={
                                currentTab === "playlists"
                                    ? "tab dropdown active"
                                    : "tab dropdown "
                            }
                            onClick={() => {
                                updateCurrentTab("playlists");
                            }}
                        >
                            <span className="text">
                                {
                                    {
                                        all: t(
                                            "library.contextMenu.allPlaylists"
                                        ),
                                        mine: t(
                                            "library.contextMenu.minePlaylists"
                                        ),
                                        liked: t(
                                            "library.contextMenu.likedPlaylists"
                                        ),
                                    }[playlistFilter]
                                }
                            </span>
                            <span
                                className="icon"
                                onClick={openPlaylistTabMenu}
                            >
                                <SvgIcon svgName="dropdown" />
                            </span>
                        </div>
                        <div
                            className={
                                currentTab === "albums" ? "tab active" : "tab"
                            }
                            onClick={() => updateCurrentTab("albums")}
                        >
                            {t("common.album")}
                        </div>
                        <div
                            className={
                                currentTab === "artists" ? "tab active" : "tab"
                            }
                            onClick={() => updateCurrentTab("artists")}
                        >
                            {t("common.artist")}
                        </div>
                        <div
                            className={
                                currentTab === "mvs" ? "tab active" : "tab"
                            }
                            onClick={() => updateCurrentTab("mvs")}
                        >
                            MV
                        </div>
                        <div
                            className={
                                currentTab === "cloudDisk"
                                    ? "tab active"
                                    : "tab"
                            }
                            onClick={() => updateCurrentTab("cloudDisk")}
                        >
                            {t("library.cloudDisk")}
                        </div>
                        <div
                            className={
                                currentTab === "playHistory"
                                    ? "tab active"
                                    : "tab"
                            }
                            onClick={() => updateCurrentTab("playHistory")}
                        >
                            {t("library.playHistory.title")}
                        </div>
                    </div>
                    {currentTab === "playlists" ? (
                        <button
                            className="tab-button"
                            onClick={openAddPlaylistModal}
                        >
                            <SvgIcon svgName="plus" />
                            {t("library.newPlayList")}
                        </button>
                    ) : (
                        ""
                    )}
                    {currentTab === "cloudDisk" ? (
                        <button
                            className="tab-button"
                            onClick={selectUploadFiles}
                        >
                            <SvgIcon svgName="arrow-up-alt" />
                            {t("library.uploadSongs")}
                        </button>
                    ) : (
                        ""
                    )}
                </div>
                {currentTab === "playlists" && liked.playlists.length > 1 ? (
                    <div>
                        <CoverRow
                            items={filterPlaylists}
                            type="playlist"
                            subText="creator"
                            showPlayCount={true}
                        />
                    </div>
                ) : (
                    ""
                )}
                {currentTab === "albums" ? (
                    <div>
                        <CoverRow
                            items={liked.albums}
                            type="album"
                            subText="artist"
                            showPlayCount={true}
                        />
                    </div>
                ) : (
                    ""
                )}
                {currentTab === "artists" ? (
                    <div>
                        <CoverRow
                            items={liked.artists}
                            type="artist"
                            showPlayCount={true}
                        />
                    </div>
                ) : (
                    ""
                )}
                {currentTab === "mvs" ? (
                    <div>
                        <MvRow mvs={liked.mvs} />
                    </div>
                ) : (
                    ""
                )}
                {currentTab === "cloudDisk" ? (
                    <div>
                        <TrackList
                            id={-8}
                            tracks={liked.cloudDisk}
                            type="cloudDisk"
                            columnNumber={3}
                            dbClickTrackFunc="playCloudDisk"
                            extraContextMenuItem={["removeTrackFromCloudDisk"]}
                        />
                    </div>
                ) : (
                    ""
                )}
                {currentTab === "playHistory" ? (
                    <div>
                        <button
                            className={
                                playHistoryMode === "week"
                                    ? "playHistory-button playHistory-button--selected"
                                    : "playHistory-button"
                            }
                            onClick={() => setPlayHistoryMode("week")}
                        >
                            {t("library.playHistory.week")}
                        </button>
                        <button
                            className={
                                playHistoryMode === "all"
                                    ? "playHistory-button playHistory-button--selected"
                                    : "playHistory-button"
                            }
                            onClick={() => setPlayHistoryMode("all")}
                        >
                            {t("library.playHistory.all")}
                        </button>
                        <TrackList
                            tracks={playHistoryList}
                            columnNumber={1}
                        />
                    </div>
                ) : (
                    ""
                )}
            </div>
            <input
                ref={cloudDiskUploadInput}
                type="file"
                style={{ display: "none" }}
                onChange={uploadSongToCloudDisk}
            />
            <ContextMenu
                ref={playlistTabMenu}
                children={
                    <div>
                        <div
                            className="item"
                            onClick={() => changePlaylistFilter("all")}
                        >
                            {t("library.contextMenu.allPlaylists")}
                        </div>
                        <hr />
                        <div
                            className="item"
                            onClick={() => changePlaylistFilter("mine")}
                        >
                            {t("library.contextMenu.minePlaylists")}
                        </div>
                        <div
                            className="item"
                            onClick={() => changePlaylistFilter("liked")}
                        >
                            {t("library.contextMenu.likedPlaylists")}
                        </div>
                    </div>
                }
            ></ContextMenu>

            <ContextMenu
                ref={playModeTabMenu}
                children={
                    <div>
                        <div className="item" onClick={playLikedSongs}>
                            {t("library.likedSongs")}
                        </div>
                        <hr />
                        <div className="item" onClick={playIntelligenceList}>
                            {t("library.cardiacMode")}
                        </div>
                    </div>
                }
            ></ContextMenu>
        </div>
    );
};

export default Library;
