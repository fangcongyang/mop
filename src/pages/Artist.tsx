import {
    FunctionComponent,
    MouseEvent,
    RefObject,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/store/hooks";
import { formatAlbumType, formatDate, resizeImage } from "@/utils/data";
import { enableMainScrolling } from "@/store/coreSlice";
import ButtonTwoTone from "@/components/ButtonTwoTone";
import auth from "@/utils/auth";
import { showToast } from "@/utils";
import {
    artistMv,
    followAArtist,
    getArtist,
    similarArtistList,
} from "@/api/artist";
import Cover from "@/components/Cover";
import MvRow from "@/components/MvRow";
import CoverRow from "@/components/CoverRow";
import { Transition } from "react-transition-group";
import TrackList from "@/components/TrackList";
import Modal from "@/components/Modal";
import ContextMenu, { ContextMenuHandle } from "@/components/ContextMenu";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import _ from "lodash";
import NProgress from "nprogress";
import { getArtistAlbum } from "@/api/album";
import { player } from "@/business/player";
import "./Artist.scss";
import { getTrackDetail } from "@/api/track";

interface ArtistProps {
    parentRef: RefObject<HTMLDivElement>;
}

const Artist: FunctionComponent<ArtistProps> = (props) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [artist, setArtist] = useState<any>({
        img1v1Url:
            "https://p1.music.126.net/VnZiScyynLG7atLIZ2YPkw==/18686200114669622.jpg",
    });
    const [popularTracks, setPopularTracks] = useState<any[]>([]);
    const [mvs, setMvs] = useState<any[]>([]);
    const [albumsData, setAlbumsData] = useState<any[]>([]);
    const [similarArtists, setSimilarArtists] = useState<any[]>([]);
    const [latestRelease, setLatestRelease] = useState({
        picUrl: "",
        publishTime: 0,
        id: 0,
        name: "",
        type: "",
        size: "",
    });
    const [hasMoreMV, setHasMoreMV] = useState(false);
    const [mvHover, setMvHover] = useState(false);
    const [showMorePopTracks, setShowMorePopTracks] = useState(false);
    const artistMenu = useRef<ContextMenuHandle>(null);
    const latestMVRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData(id);
    }, [id]);

    const loadData = _.debounce((id) => {
        NProgress.start();
        props.parentRef.current!.scrollTo({ top: 0 });
        getArtist(id).then((data) => {
            setArtist(data.artist);
            let trackIds = data.hotSongs.map((t: any) => t.id);
            getTrackDetail(trackIds.join(",")).then((data) => {
                setPopularTracks(data.songs);
                NProgress.done();
            });
        });
        getArtistAlbum({ id: id, limit: 200 }).then((data: any) => {
            setAlbumsData(data.hotAlbums);
            setLatestRelease(data.hotAlbums[0]);
        });
        artistMv({ id }).then((data: any) => {
            setMvs(data.mvs);
            setHasMoreMV(data.hasMore);
        });
        similarArtistList(id).then((data: any) => {
            setSimilarArtists(data.artists);
        });
    }, 500);

    const albums = useMemo(() => {
        return albumsData.filter(
            (a) => a.type === "专辑" || a.type === "精选集"
        );
    }, [albumsData]);

    const latestMV = useMemo(() => {
        const mv = mvs[0] || {};
        return {
            id: mv.id || mv.vid,
            name: mv.name || mv.title,
            coverUrl: `${
                mv.imgurl16v9 || mv.cover || mv.coverUrl
            }?param=464y260`,
            publishTime: mv.publishTime,
        };
    }, [mvs]);

    const eps = useMemo(() => {
        return albumsData.filter((a) =>
            ["EP/Single", "EP", "Single"].includes(a.type)
        );
    }, [albumsData]);

    const scrollTo = (div: string, block = "center") => {
        document.getElementById(div)!.scrollIntoView({
            behavior: "smooth",
            block: block as ScrollLogicalPosition,
        });
    };

    const toggleFullDescription = () => {
        setShowFullDescription(!showFullDescription);
        if (showFullDescription) {
            dispatch(enableMainScrolling(false));
        } else {
            dispatch(enableMainScrolling(true));
        }
    };

    const playPopularSongs = (trackId = "first") => {
        let trackIds = popularTracks.map((t) => t.id);
        player.replacePlaylist(trackIds, artist.id, "artist", trackId);
    };

    const onFollowArtist = () => {
        if (!auth.isAccountLoggedIn()) {
            showToast(t("toast.needToLogin"));
            return;
        }
        followAArtist({
            id: artist.id.toString(),
            t: artist.followed ? 0 : 1,
        }).then((data: any) => {
            if (data.code === 200) {
                artist.followed = !artist.followed;
                setArtist(artist);
            }
        });
    };

    const openMenu = (e: MouseEvent) => {
        artistMenu.current!.openMenu(e);
    };

    const goToMv = (id: string) => {
        navigate("/mv/" + id);
    };

    const copyUrl = (id: string) => {
        writeText(`https://music.163.com/#/artist?id=${id}`)
            .then(function () {
                showToast(t("toast.copied"));
            })
            .catch((error) => {
                showToast(`${t("toast.copyFailed")}${error}`);
            });
    };

    const openInBrowser = (id: number) => {
        const url = `https://music.163.com/#/artist?id=${id}`;
        window.open(url);
    };

    return (
        <div className="artist-page">
            <div className="artist-info">
                <div className="head">
                    <img
                        src={resizeImage(artist.img1v1Url, 1024)}
                        loading="lazy"
                    />
                </div>
                <div>
                    <div className="name">{artist.name}</div>
                    <div className="artist">{t("artist.artist")}</div>
                    <div className="statistics">
                        <a onClick={() => scrollTo("popularTracks")}>
                            {artist.musicSize} {t("common.songs")}
                        </a>
                        ·
                        <a onClick={() => scrollTo("seeMore", "start")}>
                            {artist.albumSize} {t("artist.withAlbums")}
                        </a>
                        ·
                        <a onClick={() => scrollTo("mvs")}>
                            {artist.mvSize} {t("artist.videos")}
                        </a>
                    </div>
                    <div
                        className="description"
                        onClick={toggleFullDescription}
                    >
                        {artist.briefDesc}
                    </div>
                    <div className="buttons">
                        <ButtonTwoTone
                            iconClass="play"
                            onClick={() => playPopularSongs()}
                        >
                            {t("common.play")}
                        </ButtonTwoTone>
                        <ButtonTwoTone color="grey" onClick={onFollowArtist}>
                            <span>
                                {artist.followed
                                    ? t("artist.following")
                                    : t("artist.follow")}
                            </span>
                        </ButtonTwoTone>
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
            {latestRelease !== undefined ? (
                <div className="latest-release">
                    <div className="section-title">
                        {t("artist.latestRelease")}
                    </div>
                    <div className="release">
                        <div className="container">
                            <Cover
                                id={latestRelease.id}
                                imageUrl={resizeImage(latestRelease.picUrl)}
                                type="album"
                                fixedSize={128}
                                playButtonSize={30}
                            />
                            <div className="info">
                                <div className="name">
                                    <Link to={`/album/${latestRelease.id}`}>
                                        {latestRelease.name}
                                    </Link>
                                </div>
                                <div className="date">
                                    {formatDate(latestRelease.publishTime)}
                                </div>
                                <div className="type">
                                    {formatAlbumType(
                                        latestRelease.type,
                                        latestRelease
                                    )}{" "}
                                    ·{latestRelease.size} {t("common.songs")}
                                </div>
                            </div>
                        </div>
                        <div
                            className={
                                latestMV.id
                                    ? "container latest-mv"
                                    : "container latest-mv hidden"
                            }
                        >
                            <div
                                className="cover"
                                onMouseOver={() => setMvHover(true)}
                                onMouseLeave={() => setMvHover(false)}
                                onClick={() => goToMv(latestMV.id)}
                            >
                                <img src={latestMV.coverUrl} loading="lazy" />
                                <Transition
                                    nodeRef={latestMVRef}
                                    in={mvHover}
                                    timeout={600}
                                >
                                    {(state) => (
                                        <div
                                            ref={latestMVRef}
                                            className={`shadow fade fade-${state}`}
                                            style={{
                                                background:
                                                    "url(" +
                                                    latestMV.coverUrl +
                                                    ")",
                                            }}
                                        ></div>
                                    )}
                                </Transition>
                            </div>
                            <div className="info">
                                <div className="name">
                                    <Link to={"/mv/" + latestMV.id}>
                                        {latestMV.name}
                                    </Link>
                                </div>
                                <div className="date">
                                    {formatDate(latestMV.publishTime)}
                                </div>
                                <div className="type">
                                    {t("artist.latestMV")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                ""
            )}
            <div id="popularTracks" className="popular-tracks">
                <div className="section-title">{t("artist.popularSongs")}</div>
                <TrackList
                    tracks={popularTracks.slice(0, showMorePopTracks ? 24 : 12)}
                    type="tracklist"
                />
                <div id="seeMore" className="show-more">
                    <button
                        onClick={() => setShowMorePopTracks(!showMorePopTracks)}
                    >
                        <span>
                            {showMorePopTracks
                                ? t("artist.showLess")
                                : t("artist.showMore")}
                        </span>
                    </button>
                </div>
            </div>
            {albums.length !== 0 ? (
                <div id="albums" className="albums">
                    <div className="section-title">{t("artist.albums")}</div>
                    <CoverRow
                        type="album"
                        items={albums}
                        subText="releaseYear"
                    />
                </div>
            ) : (
                ""
            )}
            {mvs.length !== 0 ? (
                <div id="mvs" className="mvs">
                    <div className="section-title">
                        MVs
                        <Link
                            className={hasMoreMV ? "" : "hidden"}
                            to={`/artist/${artist.id}/mv`}
                        >
                            {t("home.seeMore")}
                        </Link>
                    </div>
                    <MvRow mvs={mvs} subtitle="publishTime" />
                </div>
            ) : (
                ""
            )}
            {eps.length !== 0 ? (
                <div className="eps">
                    <div className="section-title">
                        {t("artist.EPsSingles")}
                    </div>
                    <CoverRow
                        type="album"
                        items={eps}
                        subText="albumType+releaseYear"
                    />
                </div>
            ) : (
                ""
            )}
            {similarArtists.length !== 0 ? (
                <div className="similar-artists">
                    <div className="section-title">
                        {t("artist.similarArtists")}
                    </div>
                    <CoverRow
                        type="artist"
                        columnNumber={6}
                        gap="36px 28px"
                        items={similarArtists.slice(0, 12)}
                    />
                </div>
            ) : (
                ""
            )}
            <Modal
                show={showFullDescription}
                close={toggleFullDescription}
                showFooter={false}
                clickOutsideHide
                title={t("artist.artistDesc")}
            >
                <p className="description-fulltext">{artist.briefDesc}</p>
            </Modal>
            <ContextMenu ref={artistMenu}>
                <div className="item" onClick={() => copyUrl(artist.id)}>
                    {t("contextMenu.copyUrl")}
                </div>
                <div className="item" onClick={() => openInBrowser(artist.id)}>
                    {t("contextMenu.openInBrowser")}
                </div>
            </ContextMenu>
        </div>
    );
};

export default Artist;
