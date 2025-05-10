import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
    fetchLikedPlaylist,
    likeATrack,
    likedStore,
    dataStore,
    settingsStore,
    toggleLyrics,
    updateModal,
} from "@/store/coreSlice";
import { player } from "@/business/player";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { getListSourcePath, hasListSource } from "@/utils/playList";
import ButtonIcon from "@/components/ButtonIcon";
import VolumeControl from "@/components/VolumeControl";
import SvgIcon from "@/components/SvgIcon";
import auth from "@/utils/auth";
import { backgroundColor } from "@/utils/common";
import { storeData } from "@/utils";
import { formatTrackTime } from "@/utils/data";
import Slider from "@mui/material/Slider";
import styles from "./Lyrics.module.scss";
import PlayControl from "../components/PlayControl";
import { getLyric } from "@/api/track";
import { lyricParser } from "@/utils/lyrics";
import _ from "lodash";
import dayjs from "dayjs";
import { PlayerObserver } from "@/type/player";
import { useConfig } from "@/hooks/useConfig";

interface LyricsProperties {
    className?: string;
}

const Lyrics = forwardRef<HTMLDivElement, LyricsProperties>((props, ref) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const settings = useAppSelector(settingsStore);
    const [lyric, setLyric] = useState([]);
    const [tlyric, setTlyric] = useState([]);
    const [romalyric, setRomalyric] = useState([]);
    const [lyricType, setLyricType] = useState<
        "translation" | "romaPronunciation"
    >("translation");
    const [background, setBackground] = useState("");
    const [highlightLyricIndex, setHighlightLyricIndex] = useState(-1);
    const lyricsInterval = useRef<NodeJS.Timeout | undefined>(undefined);
    const lyricsRef = useRef(null);
    const [date, setDate] = useState("");
    const liked = useAppSelector(likedStore);
    const data = useAppSelector(dataStore);
    const [playing, setPlaying] = useState(player.playing);
    const [progress, setProgress] = useState(player.progress);
    const [isPersonalFM, setIsPersonalFM] = useState(player.isPersonalFM);
    const [repeatMode, setRepeatMode] = useState(player.repeatMode);
    const [shuffle, setShuffle] = useState(player.shuffle);
    const [volume, setVolume] = useState(player.volume);
    const [mute, setMute] = useState(player.mute);
    const [showLyricsTime] = useConfig("showLyricsTime", true);
    const lyricsPlayerObserver: PlayerObserver = new PlayerObserver("lyrics");

    const isCurrentTrackLiked = useMemo(() => {
        return liked.songs.includes(player.currentTrackId);
    }, [player.currentTrackId, liked.songs]);

    const noLyric = useMemo(() => {
        return lyric.length == 0;
    }, [lyric]);

    const theme = useMemo(() => {
        return settings.lyricsBackground === "true" ? "dark" : "auto";
    }, [settings.lyricsBackground]);

    const isShowLyricTypeSwitch = useMemo(() => {
        return romalyric.length > 0 && tlyric.length > 0;
    }, [romalyric, tlyric]);

    const bgImageUrl = useMemo(() => {
        return player.currentTrack?.al?.picUrl + "?param=512y512";
    }, [player.currentTrack]);

    const imageUrl = useMemo(() => {
        return player.currentTrack?.al?.picUrl + "?param=1024y1024";
    }, [player.currentTrack]);

    const currentTrack = useMemo(() => {
        return player.currentTrack;
    }, [player.currentTrack]);

    const registerPlayerObserver = () => {
        lyricsPlayerObserver.on("playing", () => {
            setPlaying(player.playing);
        });

        lyricsPlayerObserver.on("progress", () => {
            setProgress(player.progress);
        });

        lyricsPlayerObserver.on("isPersonalFM", () => {
            setIsPersonalFM(player.isPersonalFM);
        });

        lyricsPlayerObserver.on("repeatMode", () => {
            setRepeatMode(player.repeatMode);
        });

        lyricsPlayerObserver.on("shuffle", () => {
            setShuffle(player.shuffle);
        });

        lyricsPlayerObserver.on("volumeChange", () => {
            if(player.volume != volume) setVolume(player.volume);
        });

        player.registerObserver(lyricsPlayerObserver);
    }

    useEffect(() => {
        registerPlayerObserver();
        initLyric();
        getCoverColor();
        const intervalId = setInterval(() => {
            setDate(dayjs().format("HH:mm:ss"));
        }, 1000);

        return () => {
            clearInterval(lyricsInterval.current);
            clearInterval(intervalId); // 清理定时器
            player.removeObserver(lyricsPlayerObserver);
        };
    }, [settings.lyricsBackground, currentTrack]);

    const artist = useMemo(() => {
        return currentTrack?.ar
            ? currentTrack.ar[0]
            : { id: 0, name: "unknown" };
    }, [currentTrack]);

    const album = useMemo(() => {
        return currentTrack?.al || { id: 0, name: "unknown" };
    }, [currentTrack]);

    const lyricWithTranslation = useMemo(() => {
        let ret: any = [];
        // 空内容的去除
        const lyricFiltered = lyric.filter(({ content }) => Boolean(content));
        // content统一转换数组形式
        if (lyricFiltered.length) {
            lyricFiltered.forEach((l) => {
                const { rawTime, time, content } = l;
                const lyricItem = { time, content, contents: [content] };
                const sameTimeTLyric = tlyric.find(
                    ({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime
                );
                if (sameTimeTLyric) {
                    const { content: tLyricContent } = sameTimeTLyric;
                    if (content) {
                        lyricItem.contents.push(tLyricContent);
                    }
                }
                ret.push(lyricItem);
            });
        } else {
            ret = lyricFiltered.map(({ time, content }) => ({
                time,
                content,
                contents: [content],
            }));
        }
        return ret;
    }, [lyric, tlyric]);

    const lyricWithRomaPronunciation = useMemo(() => {
        let ret: any = [];
        // 空内容的去除
        const lyricFiltered = lyric.filter(({ content }) => Boolean(content));
        // content统一转换数组形式
        if (lyricFiltered.length) {
            lyricFiltered.forEach((l) => {
                const { rawTime, time, content } = l;
                const lyricItem = { time, content, contents: [content] };
                const sameTimeRomaLyric = romalyric.find(
                    ({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime
                );
                if (sameTimeRomaLyric) {
                    const { content: romaLyricContent } = sameTimeRomaLyric;
                    if (content) {
                        lyricItem.contents.push(romaLyricContent);
                    }
                }
                ret.push(lyricItem);
            });
        } else {
            ret = lyricFiltered.map(({ time, content }) => ({
                time,
                content,
                contents: [content],
            }));
        }
        return ret;
    }, [lyric, romalyric]);

    const lyricToShow = useMemo(() => {
        return lyricType === "translation"
            ? lyricWithTranslation
            : lyricWithRomaPronunciation;
    }, [lyricType, lyricWithTranslation, lyricWithRomaPronunciation]);

    const initLyric = _.debounce(() => {
        if (!currentTrack.id) return;
        clearInterval(lyricsInterval.current);
        lyricsInterval.current = undefined;
        setHighlightLyricIndex(-1);
        getLyric(currentTrack.id).then((data) => {
            if (!data?.lrc?.lyric) {
                setLyric([]);
                setTlyric([]);
                setRomalyric([]);
                return false;
            } else {
                let { lyric, tlyric, romalyric } = lyricParser(data);
                lyric = lyric.filter(
                    (l: any) => !/^作(词|曲)\s*(:|：)\s*无$/.exec(l.content)
                );
                let includeAM =
                    lyric.length <= 10 &&
                    lyric.map((l: any) => l.content).includes("纯音乐，请欣赏");
                if (includeAM) {
                    let reg = /^作(词|曲)\s*(:|：)\s*/;
                    let author = currentTrack?.ar[0]?.name;
                    lyric = lyric.filter((l: any) => {
                        let regExpArr = l.content.match(reg);
                        return (
                            !regExpArr ||
                            l.content.replace(regExpArr[0], "") !== author
                        );
                    });
                }
                if (lyric.length === 1 && includeAM) {
                    setLyric([]);
                    setTlyric([]);
                    setRomalyric([]);
                    return false;
                } else {
                    setLyric(lyric);
                    initLyricsInterval(lyric);
                    setTlyric(tlyric);
                    setRomalyric(romalyric);
                    if (tlyric.length * romalyric.length > 0) {
                        setLyricType("translation");
                    } else {
                        setLyricType(
                            lyric.length > 0
                                ? "translation"
                                : "romaPronunciation"
                        );
                    }
                    return true;
                }
            }
        });
    }, 500);

    const hasList = () => {
        return hasListSource();
    };

    const getListPath = () => {
        return getListSourcePath(data.likedSongPlaylistID);
    };

    const addToPlaylist = () => {
        if (!auth.isAccountLoggedIn()) {
            storeData.showToast(t("toast.needToLogin"));
            return;
        }
        dispatch(fetchLikedPlaylist());
        dispatch(updateModal({
            modalName: 'addTrackToPlaylistModal',
            key: 'show',
            value: true,
        }))
        dispatch(updateModal({
            modalName: 'addTrackToPlaylistModal',
            key: 'selectedTrackId',
            value: currentTrack?.id,
        }))
    };

    const lyricFontSize = () => {
        return {
            fontSize: `${settings.lyricFontSize || 28}px`,
        };
    };

    const getCoverColor = () => {
        if (settings.lyricsBackground !== "true") return;
        const cover = currentTrack.al?.picUrl + "?param=256y256";
        backgroundColor(cover, (backgroundColor: string) => {
            setBackground(backgroundColor);
        });
    };

    const switchLyricType = () => {
        setLyricType(
            lyricType === "translation" ? "romaPronunciation" : "translation"
        );
    };

    const clickLyricLine = (value: number, startPlay = false) => {
        // TODO: 双击选择还会选中文字，考虑搞个右键菜单复制歌词
        let jumpFlag = false;
        lyric.filter(function (item: any) {
            if (item.content == "纯音乐，请欣赏") {
                jumpFlag = true;
            }
        });
        if (window.getSelection()?.toString().length === 0 && !jumpFlag) {
            player.seek(value);
        }
        if (startPlay === true) {
            player.play();
        }
    };

    const initLyricsInterval = _.debounce((lyric: any[]) => {
        if (lyricsInterval.current) return;
        let currentHighlightLyricIndex = -1;
        lyricsInterval.current = setInterval(() => {
            const localProgress = player.playing ? player.seek(null, false) ?? 0 : player.progress;
            let oldHighlightLyricIndex = currentHighlightLyricIndex;
            let index = lyric.findIndex((l: any, index) => {
                const nextLyric: any = lyric[index + 1];
                return (
                    localProgress >= l.time &&
                    (nextLyric ? localProgress < nextLyric.time : true)
                );
            });
            if (oldHighlightLyricIndex !== index) {
                currentHighlightLyricIndex = index;
                setHighlightLyricIndex(currentHighlightLyricIndex);
                const el = document.getElementById(`line${index}`);
                if (el)
                    el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
            }
        }, 100);
    }, 1000);

    const onChangeCurrentTrackDuration = (
        _event: Event,
        newValue: number | number[]
    ) => {
        let p = newValue instanceof Array ? newValue[0] : newValue;
        setProgress(p);
        player.progressForcedRefresh = p;
    };

    const volumeChange = (volume: number) => {
        setVolume(volume);
        player.volume = volume;
    }
    
    const muteChange = () => {
        setMute(!mute);
        player.toggleMute();
    }

    return (
        <div
            ref={ref}
            className={
                noLyric
                    ? styles.lyricsPage + " no-lyric" + " " + props.className
                    : styles.lyricsPage + " " + props.className
            }
            data-theme={theme}
        >
            {settings.lyricsBackground === "blur" ||
            settings.lyricsBackground === "dynamic" ? (
                <div
                    className={
                        settings.lyricsBackground === "dynamic"
                            ? "lyrics-background dynamic-background"
                            : "lyrics-background"
                    }
                >
                    <div
                        className="top-right"
                        style={{ backgroundImage: `url(${bgImageUrl})` }}
                    />
                    <div
                        className="bottom-left"
                        style={{ backgroundImage: `url(${bgImageUrl})` }}
                    />
                </div>
            ) : (
                ""
            )}
            {settings.lyricsBackground === "true" ? (
                <div
                    className="gradient-background"
                    style={{ background: background }}
                ></div>
            ) : (
                ""
            )}
            <div className={styles.leftSide}>
                <div>
                    {showLyricsTime ? (
                        <div className="date">{date}</div>
                    ) : (
                        ""
                    )}

                    <div className={styles.cover}>
                        <div className="cover-container">
                            <img src={imageUrl} loading="lazy" />
                            <div
                                className="shadow"
                                style={{ backgroundImage: `url(${imageUrl})` }}
                            ></div>
                        </div>
                    </div>
                    <div className="controls">
                        <div className="top-part">
                            <div className="track-info">
                                <div
                                    className="title"
                                    title={currentTrack.name}
                                >
                                    {hasList() ? (
                                        <Link
                                            to={getListPath()}
                                            onClick={() =>
                                                dispatch(toggleLyrics())
                                            }
                                        >
                                            {currentTrack.name}
                                        </Link>
                                    ) : (
                                        <span>{currentTrack.name}</span>
                                    )}
                                </div>
                                <div className="subtitle">
                                    {artist.id !== 0 ? (
                                        <Link
                                            to={`/artist/${artist.id}`}
                                            onClick={() =>
                                                dispatch(toggleLyrics())
                                            }
                                        >
                                            {artist.name}
                                        </Link>
                                    ) : (
                                        <span>{artist.name}</span>
                                    )}
                                    {album.id !== 0 ? (
                                        <span v-if="album.id !== 0">
                                            -
                                            <Link
                                                to={`/album/${album.id}`}
                                                title={album.name}
                                                onClick={() =>
                                                    dispatch(toggleLyrics())
                                                }
                                            >
                                                {album.name}
                                            </Link>
                                        </span>
                                    ) : (
                                        ""
                                    )}
                                </div>
                            </div>
                            <div className="top-right">
                                <VolumeControl size="medium" volume={volume} mute={mute} onVolumeChange={volumeChange} onMute={muteChange}/>
                                <div className="buttons">
                                    <ButtonIcon
                                        title={t("contextMenu.like")}
                                        onClick={() =>
                                            dispatch(
                                                likeATrack(
                                                    player.currentTrack.id
                                                )
                                            )
                                        }
                                        children={
                                            <SvgIcon
                                                svgName={
                                                    isCurrentTrackLiked
                                                        ? "heart-solid"
                                                        : "heart"
                                                }
                                            />
                                        }
                                    ></ButtonIcon>
                                    <ButtonIcon
                                        title={t("contextMenu.addToPlaylist")}
                                        onClick={addToPlaylist}
                                        children={<SvgIcon svgName="plus" />}
                                    ></ButtonIcon>
                                </div>
                            </div>
                        </div>
                        <div className="progress-bar">
                            <span className="time">
                                {formatTrackTime(progress) || "0:00"}
                            </span>
                            <div className="slider">
                                <Slider
                                    aria-label="time-indicator"
                                    size="medium"
                                    value={progress}
                                    min={0}
                                    step={1}
                                    max={player.currentTrackDuration}
                                    onChange={onChangeCurrentTrackDuration}
                                    valueLabelFormat={formatTrackTime}
                                    valueLabelDisplay="auto"
                                    sx={{
                                        // color: theme.palette.mode === 'dark' ? '#fff' : '#335eea',
                                        color: "var(--color-text)",
                                        padding: "2px 0",
                                        "& .MuiSlider-track": {
                                            border: "none",
                                        },
                                        "& .MuiSlider-thumb": {
                                            width: 0,
                                            height: 0,
                                            backgroundColor: "#fff",
                                            "&:before": {
                                                boxShadow:
                                                    "0 1px 3px 0 #2D2D2D",
                                            },
                                            "&:hover, &.Mui-focusVisible, &.Mui-active":
                                                {
                                                    boxShadow: "none",
                                                },
                                        },
                                        "& .MuiSlider-rail": {
                                            // color: '#2D2D2D',
                                            color: "var(--color-text)",
                                            opacity: 0.28,
                                        },
                                        "&:hover": {
                                            color: "#335eea",
                                            "& .MuiSlider-thumb": {
                                                width: 12,
                                                height: 12,
                                            },
                                        },
                                    }}
                                />
                            </div>
                            <span className="time">
                                {formatTrackTime(player.currentTrackDuration)}
                            </span>
                        </div>
                        <div className="media-controls">
                            {!isPersonalFM ? (
                                <ButtonIcon
                                    v-show=""
                                    title={
                                        repeatMode === "one"
                                            ? t("player.repeatTrack")
                                            : t("player.repeat")
                                    }
                                    className={
                                        repeatMode !== "off"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() => player.toggleRepeatMode()}
                                >
                                    <SvgIcon
                                        svgName={
                                            player.repeatMode !== "one"
                                                ? "repeat"
                                                : "repeat-1"
                                        }
                                    />
                                </ButtonIcon>
                            ) : (
                                ""
                            )}
                            <PlayControl
                                className="middle"
                                playing={playing}
                            />
                            {!isPersonalFM ? (
                                <ButtonIcon
                                    title={t("player.shuffle")}
                                    className={shuffle ? "active" : ""}
                                    onClick={() => setShuffle(!shuffle)}
                                >
                                    <SvgIcon svgName="shuffle" />
                                </ButtonIcon>
                            ) : (
                                ""
                            )}
                            {isShowLyricTypeSwitch &&
                                settings.showLyricsTranslation &&
                                lyricType === "translation" && (
                                    <ButtonIcon
                                        title={t("player.translationLyric")}
                                        onClick={switchLyricType}
                                    >
                                        <span className="lyric-switch-icon">
                                            译
                                        </span>
                                    </ButtonIcon>
                                )}
                            {isShowLyricTypeSwitch &&
                                settings.showLyricsTranslation &&
                                lyricType === "romaPronunciation" && (
                                    <ButtonIcon
                                        title={t("player.pronunciationLyric")}
                                        onClick={switchLyricType}
                                    >
                                        <span className="lyric-switch-icon">
                                            音
                                        </span>
                                    </ButtonIcon>
                                )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.rightSide}>
                <div
                    ref={lyricsRef}
                    className="lyrics-container"
                    style={lyricFontSize()}
                >
                    <div id="line-1" className="line"></div>
                    {lyricToShow.map((line: any, index: number) => {
                        return (
                            <div
                                id={`line${index}`}
                                key={index}
                                className={
                                    highlightLyricIndex === index
                                        ? "highlight line"
                                        : "line"
                                }
                                onClick={() => clickLyricLine(line.time)}
                                onDoubleClick={() =>
                                    clickLyricLine(line.time, true)
                                }
                            >
                                <div className="content">
                                    {line.contents[0] ? (
                                        <span>{line.contents[0]}</span>
                                    ) : (
                                        ""
                                    )}
                                    <br />
                                    {line.contents[1] &&
                                    settings.showLyricsTranslation ? (
                                        <span className="translation">
                                            {line.contents[1]}
                                        </span>
                                    ) : (
                                        ""
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div
                className={styles.closeButton}
                onClick={() => dispatch(toggleLyrics())}
            >
                <SvgIcon svgName="arrow-down" />
            </div>
        </div>
    );
});

export default Lyrics;
