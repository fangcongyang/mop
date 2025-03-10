import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
    settingsStore,
    toggleLyrics,
    likedStore,
    likeATrack,
    fetchLikedSongs,
    dataStore,
} from "@/store/coreSlice";
import SvgIcon from "./SvgIcon";
import ButtonIcon from "./ButtonIcon";
import { formatTrackTime, resizeImage } from "@/utils/data";
import { clickStop } from "@/utils/common";
import VolumeControl from "./VolumeControl";
import PlayControl from "@/components/PlayControl";
import playerEventEmitter from "@/event/playerEventEmitter";
import Slider from "@mui/material/Slider";
import { getListSourcePath, hasListSource } from "@/utils/playList";
import { player } from "@/business/player";
import "./Player.scss";
import { PlayerObserver } from "@/type/player";
import { useConfig } from "@/hooks/useConfig";
import { deleteTrackSource } from "@/db";
import { emit } from "@tauri-apps/api/event";

const Player = () => {
    let location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(settingsStore);
    const liked = useAppSelector(likedStore);
    const data = useAppSelector(dataStore);
    const [playing, setPlaying] = useState(player.playing);
    const [currentTrack, setCurrentTrack] = useState(player.currentTrack);
    const [currentTrackId, setCurrentTrackId] = useState(player.currentTrackId);
    const [currentAudioSource, setCurrentAudioSource] = useState(
        player.currentAudioSource
    );
    const [progress, setProgress] = useState(player.progress);
    const [isPersonalFM, setIsPersonalFM] = useState(player.isPersonalFM);
    const [repeatMode, setRepeatMode] = useState(player.repeatMode);
    const [shuffle, setShuffle] = useState(player.shuffle);
    const [reversed, setReversed] = useState(player.reversed);
    const [volume, setVolume] = useState(player.volume);
    const [mute, setMute] = useState(player.mute);
    const [loading, setLoading] = useState(player.loading);
    const playerObserver: PlayerObserver = new PlayerObserver("player");
    const [nyancatStyle] = useConfig("nyancatStyle", false);

    const registerPlayerObserver = () => {
        playerObserver.on("playing", () => {
            setPlaying(player.playing);
            emit("play_status", { playing: player.playing, playMode: repeatMode });
        });

        playerObserver.on("currentTrack", () => {
            setCurrentTrack(player.currentTrack);
            setCurrentTrackId(player.currentTrackId);
        });

        playerObserver.on("currentAudioSource", () => {
            setCurrentAudioSource(player.currentAudioSource);
        });

        playerObserver.on("progress", () => {
            setProgress(player.progress);
        });

        playerObserver.on("isPersonalFM", () => {
            setIsPersonalFM(player.isPersonalFM);
        });

        playerObserver.on("repeatMode", () => {
            setRepeatMode(player.repeatMode);
        });

        playerObserver.on("shuffle", () => {
            setShuffle(player.shuffle);
        });

        playerObserver.on("reversed", () => {
            setReversed(player.reversed);
        });

        playerObserver.on("volumeChange", () => {
            setVolume(player.volume);
        });

        playerObserver.on("muteChange", () => {
            setMute(player.mute);
        });

        playerObserver.on("loading", () => {
            setLoading(player.loading);
        });

        player.registerObserver(playerObserver);
    };

    useEffect(() => {
        registerPlayerObserver();
        dispatch(fetchLikedSongs());
        return () => {
            player.removeObserver(playerObserver);
        };
    }, []);

    const playProgressClass = useMemo(() => {
        let playProgressClass = ["progress-bar"];
        if (nyancatStyle) playProgressClass.push("nyancat");
        if (!playing) playProgressClass.push("nyancat-stop");
        return playProgressClass.join(" ");
    }, [playing, nyancatStyle]);

    const isCurrentTrackLiked = useMemo(() => {
        return liked.songs.includes(currentTrackId);
    }, [currentTrackId, liked.songs]);

    const goToAlbum = () => {
        if (currentTrack.al.id === 0) return;
        navigate(`/album/${currentTrack.al.id}`);
    };

    const audioSource = useMemo(() => {
        let audioSource = "音源来自网易云音乐";
        switch (currentAudioSource) {
            case "unm:kuwo":
                audioSource = "音源来自酷我音乐";
                break;
            case "unm:bilibili":
                audioSource = "音源来自bilibili音乐";
                break;
            case "unm:ytdl":
                audioSource = "音源来自ytdl音乐";
                break;
            default:
                break;
        }
        return audioSource;
    }, [currentAudioSource]);

    const hasList = () => {
        return hasListSource();
    };

    const goToList = () => {
        navigate(getListSourcePath(data.likedSongPlaylistID));
    };

    const goToArtist = (arId: string) => {
        navigate(`/artist/${arId}`);
    };

    const goToNextTracksPage = () => {
        if (player.isPersonalFM) return;
        location.pathname === "/next" ? navigate(-1) : navigate("next");
    };

    const onSwitchRepeatMode = () => {
        player.toggleRepeatMode();
    };

    const onToggleLyrics = () => {
        dispatch(toggleLyrics());
    };

    const onChangeCurrentTrackDuration = (
        _event: Event,
        newValue: number | number[]
    ) => {
        let p = newValue instanceof Array ? newValue[0] : newValue;
        setProgress(p);
        player.progressForcedRefresh = p;
    };

    const currentTrackDuration = useMemo(() => {
        const trackDuration = currentTrack.dt || 1000;
        let duration = ~~(trackDuration / 1000);
        return duration > 1 ? duration - 1 : duration;
    }, [currentTrack]);

    const volumeChange = (volume: number) => {
        setVolume(volume);
        player.volume = volume;
    };

    const muteChange = () => {
        setMute(!mute);
        player.toggleMute();
    };

    const onDeleteTrackSource = () => {
        if (currentTrackId) {
            deleteTrackSource(currentTrackId);
            playerEventEmitter.emit("PLAYER:PALY_PLAYLIST", player._getPlaylistSourceId, currentTrackId, false);
        }
    };

    return (
        <div className={`player ${loading ? 'loading' : ''}`}>
            <div className={playProgressClass}>
                {nyancatStyle ? (
                    <Slider
                        aria-label="time-indicator"
                        size="small"
                        value={progress}
                        min={0}
                        step={1}
                        max={currentTrackDuration}
                        onChange={onChangeCurrentTrackDuration}
                        valueLabelFormat={formatTrackTime}
                        valueLabelDisplay="auto"
                        sx={{
                            color: "var(--color-text)",
                            height: "8px",
                            padding: "2px 0",
                            "& .MuiSlider-track": {
                                border: "none",
                            },
                            "& .MuiSlider-thumb": {
                                width: 0,
                                height: 0,
                                backgroundColor: "#fff",
                                "&:hover, &.Mui-focusVisible, &.Mui-active": {
                                    boxShadow: "none",
                                },
                            },
                            "& .MuiSlider-rail": {
                                color: "var(--color-text)",
                                opacity: 0.28,
                            },
                        }}
                    />
                ) : (
                    <Slider
                        aria-label="time-indicator"
                        size="small"
                        value={progress}
                        min={0}
                        step={1}
                        max={currentTrackDuration}
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
                                    boxShadow: "0 1px 3px 0 #2D2D2D",
                                },
                                "&:hover, &.Mui-focusVisible, &.Mui-active": {
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
                )}
            </div>
            <div className="controls">
                <div className="playing">
                    <div className="container" onClick={clickStop}>
                        <img
                            src={
                                currentTrack.al && currentTrack.al.picUrl
                                    ? currentTrack.al.picUrl
                                    : resizeImage("", 224)
                            }
                            loading="lazy"
                            onClick={goToAlbum}
                        />
                        <div className="track-info" title={audioSource}>
                            <div
                                className={hasList() ? "name" : "name has-list"}
                                onClick={() => {
                                    hasList() && goToList();
                                }}
                            >
                                {currentTrack.name}
                            </div>
                            <div className="artist">
                                {currentTrack.ar?.map(
                                    (ar: any, index: number) => {
                                        return (
                                            <span
                                                key={ar.id + "_" + index}
                                                onClick={() =>
                                                    ar.id && goToArtist(ar.id)
                                                }
                                            >
                                                <span
                                                    className={
                                                        ar.id ? "ar" : ""
                                                    }
                                                >
                                                    {" "}
                                                    {ar.name}{" "}
                                                </span>
                                                {index !=
                                                currentTrack.ar!.length - 1 ? (
                                                    <span>, </span>
                                                ) : (
                                                    ""
                                                )}
                                            </span>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                        <div className="like-button">
                            <ButtonIcon
                                onClick={() =>
                                    dispatch(likeATrack(currentTrackId))
                                }
                            >
                                {isCurrentTrackLiked ? (
                                    <SvgIcon
                                        svgName="heart-solid"
                                        svgTitle="喜欢"
                                    ></SvgIcon>
                                ) : (
                                    <SvgIcon
                                        svgName="heart"
                                        svgTitle="不喜欢"
                                    ></SvgIcon>
                                )}
                            </ButtonIcon>
                        </div>
                    </div>
                    <div className="blank"></div>
                </div>
                <div className="middle-control-buttons">
                    <div className="blank"></div>
                    <PlayControl className="container" playing={playing} />
                    <div className="blank"></div>
                </div>
                <div className="right-control-buttons">
                    <div className="blank"></div>
                    <div className="container" onClick={clickStop}>
                        <ButtonIcon
                            title="播放列表"
                            className={
                                location.pathname == "/next"
                                    ? isPersonalFM
                                        ? "active disabled"
                                        : "active"
                                    : ""
                            }
                            onClick={goToNextTracksPage}
                        >
                            <SvgIcon svgName="list" />
                        </ButtonIcon>
                        <ButtonIcon
                            className={
                                repeatMode !== "off"
                                    ? isPersonalFM
                                        ? "active disabled"
                                        : "active"
                                    : ""
                            }
                            title={
                                repeatMode === "one" ? "单曲循环" : "循环播放"
                            }
                            onClick={onSwitchRepeatMode}
                        >
                            <SvgIcon
                                svgName={
                                    repeatMode === "one" ? "repeat-1" : "repeat"
                                }
                            />
                        </ButtonIcon>
                        <ButtonIcon
                            className={
                                shuffle
                                    ? isPersonalFM
                                        ? "active disabled"
                                        : "active"
                                    : ""
                            }
                            title="随机播放"
                            onClick={() => {
                                setShuffle(!shuffle);
                                player.shuffle = !shuffle;
                            }}
                        >
                            <SvgIcon svgName="shuffle" />
                        </ButtonIcon>
                        {settings.enableReversedMode ? (
                            <ButtonIcon
                                className={
                                    reversed
                                        ? isPersonalFM
                                            ? "active disabled"
                                            : "active"
                                        : ""
                                }
                                title="倒序"
                                onClick={() => (player.reversed = !reversed)}
                            >
                                <SvgIcon svgName="sort-up" />
                            </ButtonIcon>
                        ) : (
                            ""
                        )}
                        <VolumeControl
                            volume={volume}
                            mute={mute}
                            onVolumeChange={volumeChange}
                            onMute={muteChange}
                        />
                        <ButtonIcon
                            className="lyrics-button"
                            title="歌词"
                            style={{ marginLeft: "12px" }}
                            onClick={onToggleLyrics}
                        >
                            <SvgIcon svgName="arrow-up" />
                        </ButtonIcon>
                        <ButtonIcon title="删除歌曲缓存" onClick={onDeleteTrackSource}>
                            <SvgIcon svgName="delete" />
                        </ButtonIcon>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Player;
