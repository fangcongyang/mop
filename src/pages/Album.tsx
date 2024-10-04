import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { useTranslation } from "react-i18next";
import Cover from "@/components/Cover";
import { formatDate, formatTime, resizeImage } from "@/utils/data";
import ExplicitSymbol from "@/components/ExplicitSymbol";
import { Link, useParams } from "react-router-dom";
import { enableMainScrolling } from "@/store/coreSlice";
import ButtonTwoTone from "@/components/ButtonTwoTone";
import auth from "@/utils/auth";
import { showToast } from "@/utils";
import {
    albumDynamicDetail,
    getAlbum,
    getArtistAlbum,
    likeAAlbum,
} from "@/api/album";
import _ from "lodash";
import TrackList from "@/components/TrackList";
import CoverRow from "@/components/CoverRow";
import Modal from "@/components/Modal";
import ContextMenu, { ContextMenuHandle } from "@/components/ContextMenu";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import NProgress from "nprogress";
import { getTrackDetail } from "@/api/track";
import "./Album.scss";
import playerEventEmitter from "@/event/playerEventEmitter";

const Album = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { id } = useParams();
    const [album, setAlbum] = useState<any>({
        artist: { id: "" },
        name: "",
        publishTime: new Date().getTime(),
    });
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [tracks, setTracks] = useState<any[]>([]);
    const [moreAlbums, setMoreAlbums] = useState<any[]>([]);
    const [dynamicDetail, setDynamicDetail] = useState<any>({});
    const [showFullDescription, setShowFullDescription] = useState(false);
    const albumMenu = useRef<ContextMenuHandle>(null);

    useEffect(() => {
        loadData(id);
    }, [id]);

    const splitAlbumTitle = (title: string) => {
        let keywords = [
            "Bonus Tracks Edition",
            "Complete Edition",
            "Deluxe Edition",
            "Deluxe Version",
            "Tour Edition",
        ];
        for (let keyword of keywords) {
            if (title.includes(keyword) === false) continue;
            return {
                title: title
                    .replace(`(${keyword})`, "")
                    .replace(`: ${keyword}`, "")
                    .replace(`[${keyword}]`, "")
                    .replace(`- ${keyword}`, "")
                    .replace(`${keyword}`, ""),
                subtitle: keyword,
            };
        }
        return {
            title: title,
            subtitle: "",
        };
    };

    const splitSoundtrackAlbumTitle = (title: string) => {
        let keywords = [
            "Music from the Original Motion Picture Score",
            "The Original Motion Picture Soundtrack",
            "Original MGM Motion Picture Soundtrack",
            "Complete Original Motion Picture Score",
            "Original Music From The Motion Picture",
            "Music From The Disney+ Original Movie",
            "Original Music From The Netflix Film",
            "Original Score to the Motion Picture",
            "Original Motion Picture Soundtrack",
            "Soundtrack from the Motion Picture",
            "Original Television Soundtrack",
            "Original Motion Picture Score",
            "Music From the Motion Picture",
            "Music From The Motion Picture",
            "Complete Motion Picture Score",
            "Music from the Motion Picture",
            "Original Videogame Soundtrack",
            "La Bande Originale du Film",
            "Music from the Miniseries",
            "Bande Originale du Film",
            "Die Original Filmmusik",
            "Original Soundtrack",
            "Complete Score",
            "Original Score",
        ];
        for (let keyword of keywords) {
            if (title.includes(keyword) === false) continue;
            return {
                title: title
                    .replace(`(${keyword})`, "")
                    .replace(`: ${keyword}`, "")
                    .replace(`[${keyword}]`, "")
                    .replace(`- ${keyword}`, "")
                    .replace(`${keyword}`, ""),
                subtitle: keyword,
            };
        }
        return {
            title: title,
            subtitle: "",
        };
    };

    const loadData = _.debounce((id) => {
        NProgress.start();
        getAlbum(id).then((data) => {
            const album = data.album;
            setAlbum(album);
            formatTitle();
            NProgress.done();

            // to get explicit mark
            let trackIds = data.songs.map((t: any) => t.id);
            getTrackDetail(trackIds.join(",")).then((data) => {
                setTracks(data.songs);
            });

            // get more album by this artist
            getArtistAlbum({ id: album.artist.id.toString(), limit: 100 }).then(
                (data: any) => {
                    setMoreAlbums(data.hotAlbums);
                }
            );
        });
        albumDynamicDetail(id).then((data: any) => {
            setDynamicDetail(data);
        });
    }, 500);

    const formatTitle = () => {
        let splitTitle = splitSoundtrackAlbumTitle(album.name);
        let splitTitle2 = splitAlbumTitle(splitTitle.title);
        setTitle(splitTitle2.title);
        if (splitTitle.subtitle !== "" && splitTitle2.subtitle !== "") {
            setSubtitle(splitTitle.subtitle + " · " + splitTitle2.subtitle);
        } else {
            setSubtitle(
                splitTitle.subtitle === ""
                    ? splitTitle2.subtitle
                    : splitTitle.subtitle
            );
        }
    };

    const albumTime = useMemo(() => {
        let time = 0;
        tracks.map((t) => (time = time + t.dt));
        return time;
    }, [tracks]);

    const tracksByDisc = useMemo(() => {
        if (tracks.length <= 1) return [];
        const pairs = _.toPairs(_.groupBy(tracks, "cd"));
        return _.sortBy(pairs, (p) => p[0]).map((items) => ({
            disc: items[0],
            tracks: items[1],
        }));
    }, [tracks]);

    const filteredMoreAlbums = useMemo(() => {
        let ma = moreAlbums.filter((a) => a.id !== album.id);
        let realAlbums = ma.filter((a) => a.type === "专辑");
        let eps = ma.filter(
            (a) => a.type === "EP" || (a.type === "EP/Single" && a.size > 1)
        );
        let restItems = ma.filter(
            (a) =>
                realAlbums.find((a1) => a1.id === a.id) === undefined &&
                eps.find((a1) => a1.id === a.id) === undefined
        );
        if (realAlbums.length === 0) {
            return [...realAlbums, ...eps, ...restItems].slice(0, 5);
        } else {
            return [...realAlbums, ...restItems].slice(0, 5);
        }
    }, [moreAlbums]);

    const openMenu = (e: MouseEvent) => {
        albumMenu.current?.openMenu(e);
    };

    const toggleFullDescription = () => {
        setShowFullDescription(!showFullDescription);
        if (showFullDescription) {
            dispatch(enableMainScrolling(false));
        } else {
            dispatch(enableMainScrolling(true));
        }
    };

    const playAlbumById = (id: number, trackId = "first") => {
        playerEventEmitter.emit("PLAYER:PLAY_ALBUM", id, trackId);
    };

    const onLikeAlbum = (toast = false) => {
        if (!auth.isAccountLoggedIn()) {
            showToast(t("toast.needToLogin"));
            return;
        }
        likeAAlbum({
            id: album.id,
            t: dynamicDetail.isSub ? 0 : 1,
        })
            .then((data: any) => {
                if (data.code === 200) {
                    dynamicDetail.isSub = !dynamicDetail.isSub;
                    if (toast === true)
                        showToast(
                            dynamicDetail.isSub
                                ? "已保存到音乐库"
                                : "已从音乐库删除"
                        );
                }
            })
            .catch((error: any) => {
                showToast(`${error.response.data.message || error}`);
            });
    };

    const copyUrl = (id: number) => {
        writeText(`https://music.163.com/#/album?id=${id}`)
            .then(function () {
                showToast(t("toast.copied"));
            })
            .catch((error) => {
                showToast(`${t("toast.copyFailed")}${error}`);
            });
    };

    const openInBrowser = (id: number) => {
        const url = `https://music.163.com/#/album?id=${id}`;
        window.open(url);
    };

    return (
        <div className="album-page">
            <div className="playlist-info">
                <Cover
                    id={album.id}
                    imageUrl={resizeImage(album.picUrl, 1024)}
                    alwaysShowShadow
                    clickCoverToPlay
                    fixedSize={288}
                    type="album"
                    coverHover={false}
                    playButtonSize={18}
                    onContextMenu={openMenu}
                />
                <div className="info">
                    <div className="title" onContextMenu={openMenu}>
                        {" "}
                        {title}
                    </div>
                    {subtitle !== "" ? (
                        <div className="subtitle" onContextMenu={openMenu}>
                            {subtitle}
                        </div>
                    ) : (
                        ""
                    )}
                    <div className="artist">
                        {album.artist.id !== 104700 ? (
                            <span>
                                <span>{album.type} by </span>
                                <Link to={`/artist/${album.artist.id}`}>
                                    {album.artist.name}
                                </Link>
                            </span>
                        ) : (
                            <span>Compilation by Various Artists</span>
                        )}
                    </div>
                    <div className="date-and-count">
                        {album.mark === 1056768 ? (
                            <span className="explicit-symbol">
                                <ExplicitSymbol />
                            </span>
                        ) : (
                            ""
                        )}
                        <span title={formatDate(album.publishTime)}>
                            {new Date(album.publishTime).getFullYear()}
                        </span>
                        <span>
                            {" "}
                            · {album.size} {t("common.songs")}
                        </span>
                        ,{formatTime(albumTime, "Human")}
                    </div>
                    <div
                        className="description"
                        onClick={toggleFullDescription}
                    >
                        {album.description}
                    </div>
                    <div className="buttons" style={{ marginTop: "32px" }}>
                        <ButtonTwoTone
                            iconClass="play"
                            onClick={() => playAlbumById(album.id)}
                        >
                            {t("common.play")}
                        </ButtonTwoTone>
                        <ButtonTwoTone
                            iconClass={
                                dynamicDetail.isSub ? "heart-solid" : "heart"
                            }
                            iconButton
                            horizontalPadding={0}
                            color={dynamicDetail.isSub ? "blue" : "grey"}
                            textColor={dynamicDetail.isSub ? "#335eea" : ""}
                            backgroundColor={
                                dynamicDetail.isSub
                                    ? "var(--color-secondary-bg)"
                                    : ""
                            }
                            onClick={() => onLikeAlbum()}
                        ></ButtonTwoTone>
                        <ButtonTwoTone
                            iconClass="more"
                            iconButton
                            horizontalPadding={0}
                            color="grey"
                            onClick={openMenu}
                        ></ButtonTwoTone>
                    </div>
                </div>
            </div>
            {tracksByDisc.length > 1 ? (
                <div>
                    {tracksByDisc.map((item) => {
                        return (
                            <div key={item.disc}>
                                <h2 className="disc">Disc {item.disc}</h2>
                                <TrackList
                                    id={album.id}
                                    tracks={item.tracks}
                                    type="album"
                                    albumObject={album}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div>
                    <TrackList
                        id={album.id}
                        tracks={tracks}
                        type="album"
                        albumObject={album}
                    />
                </div>
            )}
            <div className="extra-info">
                <div className="album-time"></div>
                <div className="release-date">
                    {t("album.released")}
                    {formatDate(album.publishTime, "MMMM D, YYYY")}
                </div>
                {album.company ? (
                    <div className="copyright"> © {album.company} </div>
                ) : (
                    ""
                )}
            </div>
            {filteredMoreAlbums.length !== 0 ? (
                <div className="more-by">
                    <div className="section-title">
                        More by
                        <Link to={`/artist/${album.artist.id}`}>
                            {album.artist.name}
                        </Link>
                    </div>
                    <div>
                        <CoverRow
                            type="album"
                            items={filteredMoreAlbums}
                            subText="albumType+releaseYear"
                        />
                    </div>
                </div>
            ) : (
                ""
            )}
            <Modal
                show={showFullDescription}
                close={() => toggleFullDescription()}
                showFooter={false}
                clickOutsideHide
                title={t("album.albumDesc")}
            >
                <p className="description-fulltext">{album.description}</p>
            </Modal>
            <ContextMenu ref={albumMenu}>
                <div className="item" onClick={() => onLikeAlbum(true)}>
                    {dynamicDetail.isSub
                        ? t("contextMenu.removeFromLibrary")
                        : t("contextMenu.saveToLibrary")}
                </div>
                <div className="item">{t("contextMenu.addToPlaylist")}</div>
                <div className="item" onClick={() => copyUrl(album.id)}>
                    {t("contextMenu.copyUrl")}
                </div>
                <div className="item" onClick={() => openInBrowser(album.id)}>
                    {t("contextMenu.openInBrowser")}
                </div>
            </ContextMenu>
        </div>
    );
};

export default Album;
