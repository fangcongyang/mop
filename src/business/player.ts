import { Howl, Howler } from "howler";
import shuffle from "lodash/shuffle";
import { getMP3, getTrackDetail, scrobble } from "@/api/track";
import { getTrackSource } from "@/db";
import auth from "@/utils/auth";
import { invoke } from "@tauri-apps/api/core";
import { decode as base642Buffer } from "@/utils/base64";
import { trackScrobble, trackUpdateNowPlaying } from "@/api/lastfm";
import { fmTrash, personalFM } from "@/api/other";
import { emit } from "@tauri-apps/api/event";
import playerEventEmitter from "@/event/playerEventEmitter";
import messageEventEmitter from "@/event/messageEventEmitter";
import { PlayerEventName, PlayerObserver, PlayerSubject } from "@/type/player";

const PLAY_PAUSE_FADE_DURATION = 200;
const INDEX_IN_PLAY_NEXT = -1;

/**
 * @readonly
 * @enum {string}
 */
const UNPLAYABLE_CONDITION = {
    PLAY_NEXT_TRACK: "playNextTrack",
    PLAY_PREV_TRACK: "playPrevTrack",
};

const excludeSaveKeys = [
    "_howler",
    "_playing",
    "_personalFMLoading",
    "_personalFMNextLoading",
    "_lastProcessFpsDate",
    "_observers",
];

export const delay = (ms: number) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve("");
        }, ms);
    });

function setTitle(track: any) {
    document.title = track
        ? `${track.name} · ${track.ar[0].name} - mop`
        : "mop";
    playerEventEmitter.emit("PLAYER:UPDATE_TITLE", document.title);
}

class Player implements PlayerSubject {
    // 播放器状态
    // 是否正在播放中
    private _playing: boolean;
    // 当前播放歌曲的进度
    private _progress: number;
    // 是否启用Player
    private _enabled: boolean;
    // off | on | one
    private _repeatMode: "off" | "on" | "one";
    // 是否随机播放 true | false
    private _shuffle: boolean;
    // 是否倒序
    private _reversed: boolean;
    // 是否静音
    private _mute: boolean;
    // 0 to 1
    private _volume: number;
    //是否正在私人FM中加载新的track
    private _personalFMLoading: boolean;
    // 是否正在缓存私人FM的下一首歌曲
    private _personalFMNextLoading: boolean;

    // 播放信息
    // 播放列表
    private _list: any[];
    // 当前播放歌曲在播放列表里的index
    private _current: number;
    // 被随机打乱的播放列表，随机播放模式下会使用此播放列表
    private _shuffledList: any[];
    // 当前播放列表的信息
    private _playlistSource: any;
    // 当前播放歌曲的详细信息
    private _currentTrack: any;
    // 当前音乐来源
    private _currentAudioSource: string;
    // 当这个list不为空时，会优先播放这个list的歌
    private _playNextList: number[];
    // 是否是私人FM模式
    private _isPersonalFM: boolean;
    private _personalFMTrack: any;
    private _personalFMNextTrack: any;
    /**
     * The blob records for cleanup.
     *
     * @private
     * @type {string[]}
     */
    private createdBlobRecords: string[];
    private _howler?: Howl | null;
    private _sendTimeInterval?: NodeJS.Timeout;
    private _observers: Set<PlayerObserver>;

    constructor() {
        // 播放器状态
        this._playing = false;
        this._progress = 0;
        this._enabled = true;
        this._repeatMode = "off";
        this._shuffle = false;
        this._reversed = false;
        this._mute = false;
        this._volume = 1;
        this._personalFMLoading = false;
        this._personalFMNextLoading = false;

        // 播放信息
        this._list = [];
        this._current = 0; // 当前播放歌曲在播放列表里的index
        this._shuffledList = [];
        this._playlistSource = { type: "album", id: 123 };
        this._currentTrack = { id: 86827685 };
        this._currentAudioSource = "";
        this._playNextList = [];
        this._isPersonalFM = false;
        this._personalFMTrack = { id: 0 }; // 私人FM当前歌曲
        this._personalFMNextTrack = {
            id: 0,
        }; // 私人FM下一首歌曲信息（为了快速加载下一首）

        this.createdBlobRecords = [];

        this._howler = null;
        this._observers = new Set();
        Object.defineProperty(this, "_howler", {
            enumerable: false,
        });
    }

    _init() {
        this._loadSelfFromLocalStorage();

        if (this._enabled) {
            // 恢复当前播放歌曲
            this._replaceCurrentTrack(this.currentTrackId, false).then(() => {
                this._howler?.volume(this.volume);
                this._howler?.seek(
                    parseInt(
                        localStorage.getItem("playerCurrentTrackTime") ?? "0"
                    )
                );
            }); // update audio source and init howler
            this._initMediaSession();
        }

        // 初始化私人FM
        if (
            this._personalFMTrack.id === 0 ||
            this._personalFMNextTrack.id === 0 ||
            this._personalFMTrack.id === this._personalFMNextTrack.id
        ) {
            personalFM().then((result: any) => {
                this._personalFMTrack = result.data[0];
                this._personalFMNextTrack = result.data[1];
                return this._personalFMTrack;
            });
        }
    }

    _initMediaSession() {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("play", () => {
                this.play();
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                this.pause();
            });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                this.playPrevTrack();
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                this._playNextTrack(this.isPersonalFM);
            });
            navigator.mediaSession.setActionHandler("stop", () => {
                this.pause();
            });
            navigator.mediaSession.setActionHandler(
                "seekto",
                (event: MediaSessionActionDetails) => {
                    this.seek(event.seekTime!);
                    this._updateMediaSessionPositionState();
                }
            );
            navigator.mediaSession.setActionHandler("seekbackward", (event) => {
                this.seek(this.seek()! - (event.seekOffset || 10));
                this._updateMediaSessionPositionState();
            });
            navigator.mediaSession.setActionHandler("seekforward", (event) => {
                this.seek(this.seek()! + (event.seekOffset || 10));
                this._updateMediaSessionPositionState();
            });
        }
    }

    _updateMediaSessionPositionState() {
        if ("mediaSession" in navigator === false) {
            return;
        }
        if ("setPositionState" in navigator.mediaSession) {
            navigator.mediaSession.setPositionState({
                duration: ~~(this.currentTrack.dt / 1000),
                playbackRate: 1.0,
                position: this.seek(),
            });
        }
    }

    _step() {
        if (this._sendTimeInterval) clearInterval(this._sendTimeInterval);
        this._sendTimeInterval = setInterval(() => {
            if (this._howler?.playing()) {
                let progress = this._howler!.seek();
                this._progress = progress;
                this.notifyObservers("progress");
                localStorage.setItem("playerCurrentTrackTime", progress.toString());
            }
            // if (isCreateMpris) {
            //   ipcRenderer?.send('playerCurrentTrackTime', this._progress);
            // }
        }, 1000);
    }

    saveSelfToLocalStorage() {
        let player: any = {};
        for (let [key, value] of Object.entries(this)) {
            if (excludeSaveKeys.includes(key)) continue;
            player[key] = value;
        }

        localStorage.setItem("player", JSON.stringify(player));
    }

    pause() {
        this._howler?.fade(this.volume, 0, PLAY_PAUSE_FADE_DURATION);

        emit("trayEvent", { trayId: "play", title: "播放" });

        this._howler?.once("fade", () => {
            this._howler?.pause();
            this._setPlaying(false);
            setTitle(null);
            // this._pauseDiscordPresence(this._currentTrack);
        });
    }

    play() {
        if (this._howler?.playing()) return;
        emit("trayEvent", { trayId: "play", title: "暂停" });
        this._howler?.play();

        this._howler?.once("play", () => {
            this._howler?.fade(0, this.volume, PLAY_PAUSE_FADE_DURATION);

            this._setPlaying(true);
            if (this._currentTrack.name) {
                setTitle(this._currentTrack);
            }
            this._playDiscordPresence(this._currentTrack, this.seek(null));
            if (
                JSON.parse(localStorage.getItem("lastfm") || "{}")["key"] !==
                undefined
            ) {
                trackUpdateNowPlaying({
                    artist: this.currentTrack.ar[0].name,
                    track: this.currentTrack.name,
                    album: this.currentTrack.al.name,
                    trackNumber: this.currentTrack.no,
                    duration: ~~(this.currentTrack.dt / 1000),
                });
            }
        });
    }

    playOrPause() {
        if (this._howler?.playing()) {
            this.pause();
        } else {
            this.play();
        }
    }

    _playDiscordPresence(_track: any, _seekTime = 0) {
        // if (
        //     store.getState().core.settings.enableDiscordRichPresence === false
        // ) {
        //     return null;
        // }
        // let copyTrack = { ...track };
        // copyTrack.dt -= seekTime * 1000;
        // ipcRenderer?.send('playDiscordPresence', copyTrack);
    }

    replacePlaylist(
        trackIds: any[],
        playlistSourceId: number | string | undefined,
        playlistSourceType: string,
        autoPlayTrackId: string | number = "first"
    ) {
        this._isPersonalFM = false;
        if (!this._enabled) this._enabled = true;
        this._list = trackIds;
        this._current = 0;
        this._playlistSource = {
            type: playlistSourceType,
            id: playlistSourceId,
        };
        if (this.shuffle) this._shuffleTheList(autoPlayTrackId);
        if (autoPlayTrackId === "first") {
            this._replaceCurrentTrack(this._list[0]);
        } else {
            this._current = trackIds.indexOf(autoPlayTrackId);
            this._replaceCurrentTrack(autoPlayTrackId);
        }
    }

    async _shuffleTheList(firstTrackId = this.currentTrackId) {
        let list = this._list.filter((tid) => tid !== firstTrackId);
        if (firstTrackId === "first") list = this._list;
        this._shuffledList = shuffle(list);
        if (firstTrackId !== "first") this._shuffledList.unshift(firstTrackId);
    }

    addTrackToPlayNext(trackId: number, playNow = false) {
        this._playNextList.push(trackId);
        if (playNow) {
            this.playNextTrack();
        }
    }

    playPersonalFM() {
        this._isPersonalFM = true;
        if (!this._enabled) this._enabled = true;
        if (this.currentTrackId !== this._personalFMTrack.id) {
            this._replaceCurrentTrack(this._personalFMTrack.id, true);
        } else {
            this.playOrPause();
        }
    }

    async moveToFMTrash() {
        this._isPersonalFM = true;
        let id = this._personalFMTrack.id;
        if (await this.playNextFMTrack()) {
            fmTrash(id);
        }
    }

    async playNextFMTrack() {
        if (this._personalFMLoading) {
            return false;
        }

        this._isPersonalFM = true;
        if (!this._personalFMNextTrack) {
            this._personalFMLoading = true;
            let result: any = null;
            let retryCount = 5;
            for (; retryCount >= 0; retryCount--) {
                result = await personalFM().catch(() => null);
                if (!result) {
                    this._personalFMLoading = false;
                    messageEventEmitter.emit(
                        "MESSAGE:INFO",
                        "personal fm timeout"
                    );
                    return false;
                }
                if (result.data?.length > 0) {
                    break;
                } else if (retryCount > 0) {
                    await delay(1000);
                }
            }
            this._personalFMLoading = false;

            if (retryCount < 0) {
                let content = "获取私人FM数据时重试次数过多，请手动切换下一首";
                messageEventEmitter.emit("MESSAGE:INFO", content);
                return false;
            }
            // 这里只能拿到一条数据
            this._personalFMTrack = result.data[0];
        } else {
            if (this._personalFMNextTrack.id === this._personalFMTrack.id) {
                return false;
            }
            this._personalFMTrack = this._personalFMNextTrack;
        }
        if (this._isPersonalFM) {
            this._replaceCurrentTrack(this._personalFMTrack.id);
        }
        this._loadPersonalFMNextTrack();
        return true;
    }

    playPersonNextTrack() {
        if (this.isPersonalFM) {
            this.playNextFMTrack();
        } else {
            this.playNextTrack();
        }
    }

    _getPrevTrack() {
        const next = this._reversed ? this._current + 1 : this._current - 1;
        let trackList: any[] = this._shuffle ? this._shuffledList : this._list;

        // 循环模式开启，则重新播放当前模式下的相对的下一首
        if (this._repeatMode === "on") {
            if (this._reversed && this._current === 0) {
                // 倒序模式，当前歌曲是最后一首，则重新播放列表第一首
                return [trackList[0], 0];
            } else if (trackList.length === this._current + 1) {
                // 正序模式，当前歌曲是第一首，则重新播放列表最后一首
                return [trackList[trackList.length - 1], trackList.length - 1];
            }
        }

        // 返回 [trackId, index]
        return [trackList[next], next];
    }

    playPrevTrack() {
        const [trackId, index] = this._getPrevTrack();
        if (trackId === undefined) return false;
        this._current = index;
        this._replaceCurrentTrack(
            trackId,
            true,
            UNPLAYABLE_CONDITION.PLAY_PREV_TRACK
        );
        return true;
    }

    playNextTrack() {
        // TODO: 切换歌曲时增加加载中的状态
        const [trackID, index] = this._getNextTrack();
        if (trackID === undefined) {
            this._howler?.stop();
            this._setPlaying(false);
            return false;
        }
        let next = index;
        if (index === INDEX_IN_PLAY_NEXT) {
            this._playNextList.shift();
            next = this._current;
        }
        this._current = next;
        this._replaceCurrentTrack(trackID);
        return true;
    }

    _getNextTrack() {
        const next = this._reversed ? this._current - 1 : this._current + 1;
        let trackList: any[] = this._shuffle ? this._shuffledList : this._list;

        if (this._playNextList.length > 0) {
            let trackID = this._playNextList[0];
            return [trackID, INDEX_IN_PLAY_NEXT];
        }

        // 循环模式开启，则重新播放当前模式下的相对的下一首
        if (this._repeatMode === "on") {
            if (this._reversed && this._current === 0) {
                // 倒序模式，当前歌曲是第一首，则重新播放列表最后一首
                return [trackList[trackList.length - 1], trackList.length - 1];
            } else if (trackList.length === this._current + 1) {
                // 正序模式，当前歌曲是最后一首，则重新播放第一首
                return [trackList[0], 0];
            }
        }

        // 返回 [trackID, index]
        return [trackList[next], next];
    }

    _loadSelfFromLocalStorage() {
        const player = JSON.parse(localStorage.getItem("player")!);
        if (!player) return;
        let key: keyof this;
        for (key in this) {
            if (key in player && !excludeSaveKeys.includes(key)) {
                this[key] = player[key];
            }
        }
    }

    async _replaceCurrentTrack(
        id: any,
        autoplay = true,
        ifUnplayableThen = UNPLAYABLE_CONDITION.PLAY_NEXT_TRACK
    ) {
        if (autoplay && this._currentTrack.name) {
            this._scrobble(this.currentTrack, this._howler?.seek());
        }
        const data = await getTrackDetail(id);
        if (data.songs.length == 0) {
            return;
        }
        const track_1 = data.songs[0];
        this.currentTrack = track_1;
        this._updateMediaSessionMetaData(track_1);
        return this._replaceCurrentTrackAudio(
            track_1,
            autoplay,
            true,
            ifUnplayableThen
        );
    }

    _updateMediaSessionMetaData(track: any) {
        if ("mediaSession" in navigator === false) {
            return;
        }
        let artists = track.ar.map((a: any) => a.name);
        const metadata = {
            title: track.name,
            artist: artists.join(","),
            album: track.al.name,
            artwork: [
                {
                    src: track.al.picUrl + "?param=224y224",
                    type: "image/jpg",
                    sizes: "224x224",
                },
                {
                    src: track.al.picUrl + "?param=512y512",
                    type: "image/jpg",
                    sizes: "512x512",
                },
            ],
            length: this.currentTrackDuration,
            trackId: this.current,
            url: "/trackid/" + track.id,
        };

        navigator.mediaSession.metadata = new window.MediaMetadata(metadata);
        // if (isCreateMpris) {
        //   this._updateMprisState(track, metadata);
        // }
    }

    /**
     * @returns 是否成功加载音频，并使用加载完成的音频替换了howler实例
     */
    _replaceCurrentTrackAudio(
        track: any,
        autoplay: boolean,
        isCacheNextTrack: boolean,
        ifUnplayableThen = UNPLAYABLE_CONDITION.PLAY_NEXT_TRACK
    ) {
        let artists = track.ar.map((a: any) => a.name);
        emit("updateTrackInfo", {
            title: track.name,
            album: track.al.name,
            artist: artists.join(","),
            duration: track.dt,
            cover_url: track.al.picUrl,
        });
        return this._getAudioSource(track).then((source) => {
            if (source) {
                let replaced = false;
                if (track.id === this.currentTrackId) {
                    this._playAudioSource(source, autoplay);
                    replaced = true;
                }
                if (isCacheNextTrack) {
                    this._cacheNextTrack();
                }
                return replaced;
            } else {
                messageEventEmitter.emit(
                    "MESSAGE:INFO",
                    `无法播放${track.id} ${track.name}`
                );
                console.warn(`无法播放${track.id} ${track.name}`);
                switch (ifUnplayableThen) {
                    case UNPLAYABLE_CONDITION.PLAY_NEXT_TRACK:
                        this._playNextTrack(this.isPersonalFM);
                        break;
                    case UNPLAYABLE_CONDITION.PLAY_PREV_TRACK:
                        this.playPrevTrack();
                        break;
                    default:
                        messageEventEmitter.emit(
                            "MESSAGE:INFO",
                            `undefined Unplayable condition: ${ifUnplayableThen}`
                        );
                        break;
                }
                return false;
            }
        });
    }

    _playAudioSource(source: string, autoplay = true) {
        Howler.unload();
        this._howler = new Howl({
            src: [source],
            html5: true,
            preload: true,
            format: ["mp3", "flac", "aac", "m4a"],
            onplay: () => {
                requestAnimationFrame(this._step.bind(this));
            },
            onend: () => {
                this._nextTrackCallback();
            },
        });

        this._howler.on("loaderror", (_, errCode) => {
            // https://developer.mozilla.org/en-US/docs/Web/API/MediaError/code
            // code 3: MEDIA_ERR_DECODE
            if (errCode === 3) {
                this._playNextTrack(this._isPersonalFM);
            } else if (errCode === 4) {
                messageEventEmitter.emit(
                    "MESSAGE:INFO",
                    `无法播放: 不支持的音频格式${this._currentTrack.id} ${this._currentTrack.name}`
                );
                console.warn(
                    `无法播放: 不支持的音频格式${this._currentTrack.id} ${this._currentTrack.name}`
                );
                this._playNextTrack(this._isPersonalFM);
            } else {
                const t = this.progress;
                this._replaceCurrentTrackAudio(
                    this.currentTrack,
                    false,
                    false
                ).then((replaced) => {
                    // 如果 replaced 为 false，代表当前的 track 已经不是这里想要替换的track
                    // 此时则不修改当前的歌曲进度
                    if (replaced) {
                        this._howler?.seek(t);
                        this.play();
                    }
                });
            }
        });
        if (autoplay) {
            this.play();
            if (this._currentTrack.name) {
                setTitle(this._currentTrack);
            }
            // setTrayLikeState(store.getState().core.liked.songs.includes(this.currentTrack.id));
        }
    }

    _nextTrackCallback() {
        this._scrobble(this._currentTrack, 0, true);
        if (!this.isPersonalFM && this._repeatMode === "one") {
            this._replaceCurrentTrack(this.currentTrackId);
        } else {
            this._playNextTrack(this.isPersonalFM);
        }
    }

    _loadPersonalFMNextTrack() {
        if (this._personalFMNextLoading) {
            return [false, undefined];
        }
        this._personalFMNextLoading = true;
        return personalFM()
            .then((result: any) => {
                if (!result || !result.data) {
                    this._personalFMNextTrack = undefined;
                } else {
                    this._personalFMNextTrack = result.data[0];
                    this._cacheNextTrack(); // cache next track
                }
                this._personalFMNextLoading = false;
                return [true, this._personalFMNextTrack];
            })
            .catch(() => {
                this._personalFMNextTrack = undefined;
                this._personalFMNextLoading = false;
                return [false, this._personalFMNextTrack];
            });
    }

    _playNextTrack(isPersonal = false) {
        if (isPersonal) {
            this.playNextFMTrack();
        } else {
            this.playNextTrack();
        }
    }

    _cacheNextTrack() {
        let nextTrackID = this._isPersonalFM
            ? this._personalFMNextTrack?.id ?? 0
            : this._getNextTrack()[0];
        if (!nextTrackID) return;
        if (this._personalFMTrack.id == nextTrackID) return;
        getTrackDetail(nextTrackID).then((data) => {
            let track = data.songs[0];
            this._getAudioSource(track);
        });
    }

    async _getAudioSource(track: any) {
        const source = await this._getAudioSourceFromCache(String(track.id));
        const source_1 =
            source ?? (await this._getAudioSourceFromNetease(track));
        return source_1 ?? (await this._getAudioSourceFromUnblockMusic(track));
    }

    async _getAudioSourceFromUnblockMusic(track: any) {
        let artists: any[] = [];
        track.ar.forEach((item: any) => {
            artists.push({
                id: item.id.toString(),
                name: item.name,
            });
        });
        let retrieveSongInfo: any = await invoke(
            "get_audio_source_from_unblock_music",
            {
                song: {
                    id: track.id.toString(),
                    name: track.name,
                    artists,
                },
            }
        )
        if (retrieveSongInfo?.url) {
            playerEventEmitter.emit("PLAYER:TRACK_GET_COMPLETE", {
                track,
                source: retrieveSongInfo.url,
                br: 128000,
                from: `unm:${retrieveSongInfo.source}`,
            });
        }
        if (!retrieveSongInfo) {
            return null;
        }

        this._setCurrentTrackAudioSource(retrieveSongInfo.source);

        if (retrieveSongInfo.source !== "bilibili") {
            return retrieveSongInfo.url;
        }

        const buffer = base642Buffer(retrieveSongInfo.url);
        return this._getAudioSourceBlobURL(buffer);
    }

    _setCurrentTrackAudioSource(audioSource: string) {
        this._currentAudioSource = audioSource;
        this.notifyObservers("currentAudioSource");
    }

    async _getAudioSourceFromCache(id: string) {
        const t = await getTrackSource(id);
        if (!t) return null;
        this._setCurrentTrackAudioSource(t.from);
        return this._getAudioSourceBlobURL(t.source);
    }

    _getAudioSourceBlobURL(data: any) {
        // Create a new object URL.
        const source = URL.createObjectURL(new Blob([data]));

        // Clean up the previous object URLs since we've created a new one.
        // Revoke object URLs can release the memory taken by a Blob,
        // which occupied a large proportion of memory.
        for (const url in this.createdBlobRecords) {
            URL.revokeObjectURL(url);
        }

        // Then, we replace the createBlobRecords with new one with
        // our newly created object URL.
        this.createdBlobRecords = [source];

        return source;
    }

    async _getAudioSourceFromNetease(track: any) {
        let source;
        if (auth.isAccountLoggedIn()) {
            const result_1: any = await getMP3(track.id.toString());
            if (!result_1.data[0]) return null;
            if (!result_1.data[0].url) return null;
            if (result_1.data[0].freeTrialInfo !== null) return null; // 跳过只能试听的歌曲
            source = result_1.data[0].url.replace(/^http:/, "https:");
            playerEventEmitter.emit("PLAYER:TRACK_GET_COMPLETE", {
                track,
                source,
                br: result_1.data[0].br,
            });
        } else {
            source = `https://music.163.com/song/media/outer/url?id=${track.id}`;
        }
        this._setCurrentTrackAudioSource("");
        return source;
    }

    async _scrobble(track: any, time: any, completed = false) {
        console.debug(
            `[debug][Player.js] scrobble track 👉 ${track.name} by ${track.ar[0].name} 👉 time:${time} completed: ${completed}`
        );
        const trackDuration = ~~(track.dt / 1000);
        time = completed ? trackDuration : ~~time;
        scrobble({
            id: track.id,
            sourceid: this._playlistSource.id.toString(),
            time,
        });
        if (
            JSON.parse(localStorage.getItem("lastfm") || "{}")["key"] !==
                undefined &&
            (time >= trackDuration / 2 || time >= 240)
        ) {
            const timestamp = ~~(new Date().getTime() / 1000) - time;
            trackScrobble({
                artist: track.ar[0].name,
                track: track.name,
                timestamp,
                album: track.al.name,
                trackNumber: track.no,
                duration: trackDuration,
            });
        }
    }

    playTrackOnListById(id: number, listName = "default") {
        if (listName === "default") {
            this._current = this._list.findIndex((t) => t === id);
        }
        this._replaceCurrentTrack(id);
    }

    seek(time: null | number = null, _sendMpris = true) {
        // if (isCreateMpris && sendMpris && time) {
        //     ipcRenderer?.send('seeked', time);
        // }
        if (time !== null) {
            this._howler?.seek(time);
            if (this._playing)
                this._playDiscordPresence(
                    this._currentTrack,
                    this.seek(null, false)
                );
        }
        return this._howler === null ? 0 : this._howler?.seek();
    }

    _setPlaying(isPlaying: boolean) {
        this._playing = isPlaying;
        this.notifyObservers("playing");
        // ipcRenderer?.send('updateTrayPlayState', this._playing);
    }

    removeTrackFromQueue(index: number) {
        this._playNextList.splice(index, 1);
    }

    get currentTrackDuration() {
        const trackDuration = this._currentTrack.dt || 1000;
        let duration = ~~(trackDuration / 1000);
        return duration > 1 ? duration - 1 : duration;
    }

    get playing() {
        return this._playing;
    }

    get playlistSource() {
        return this._playlistSource;
    }

    set currentTrack(track: any) {
        this._currentTrack = track;
        this.notifyObservers("currentTrack");
        this.notifyObservers("currentTrackId");
    }

    // 播放信息
    get currentTrack() {
        return this._currentTrack;
    }

    get playNextList() {
        return this._playNextList;
    }

    clearPlayNextList() {
        this._playNextList = [];
    }

    get list() {
        if (this._shuffle) {
            return this._shuffledList;
        }
        return this._list;
    }

    get current() {
        return this._current;
    }

    get volume() {
        return this._volume;
    }

    get progress() {
        return this._progress;
    }

    set progressForcedRefresh(progress: number) {
        this._progress = progress;
        this._howler?.seek(progress);
    }

    set volume(volume) {
        this._volume = volume;
        this.notifyObservers("volumeChange")
        this._howler?.volume(volume);
    }

    get currentTrackId() {
        return this._currentTrack?.id ?? 0;
    }

    get isPersonalFM() {
        return false;
    }

    toggleRepeatMode() {
        if (this._isPersonalFM) return;
        if (this._repeatMode === "on") {
            this.repeatMode = "one";
        } else if (this._repeatMode === "one") {
            this.repeatMode = "off";
        } else {
            this.repeatMode = "on";
        }
    }

    set repeatMode(repeatMode: "on" | "one" | "off") {
        this._repeatMode = repeatMode;
        this.notifyObservers("repeatMode");
    }

    get repeatMode() {
        return this._repeatMode;
    }

    set shuffle(shuffle: boolean) {
        this._shuffle = shuffle;
        if (this._shuffle) {
            this._shuffleTheList("first");
            this._current = this._shuffledList.indexOf(this.currentTrackId);
        } else {
            this._current = this._list.indexOf(this.currentTrackId);
        }
        this.notifyObservers("shuffle");
    }

    get shuffle() {
        return this._shuffle;
    }

    set reversed(reversed: boolean) {
        this._reversed = reversed;
        this.notifyObservers("reversed");
    }

    get reversed() {
        return this._reversed;
    }

    get personalFMTrack() {
        return this._personalFMTrack;
    }

    get personalFMNextTrack() {
        return this._personalFMNextTrack;
    }

    get enabled() {
        return this._enabled;
    }

    set mute(mute: boolean) {
        this._mute = mute;
        this._howler?.mute(mute);
    }

    get mute() {
        return this._mute;
    }

    get currentAudioSource() {
        return this._currentAudioSource;
    }

    toggleMute() {
        this.mute = !this._mute;
        this.notifyObservers("muteChange");
    }

    registerObserver(observer: PlayerObserver): void {
        this._observers.add(observer);
    }

    removeObserver(observer: PlayerObserver): void {
        this._observers.delete(observer);
    }

    notifyObservers(eventName: PlayerEventName): void {
        this._observers.forEach((observer) => {
            observer.emit(eventName);
        });
    }
}

let player = new Player();
player._init();

// 播放器事件
playerEventEmitter.on(
    "PLAYER:REPLACE_PLAYLIST",
    (
        trackIds: any[],
        playlistSourceId: number | string | undefined,
        playlistSourceType: string,
        autoPlayTrackId: string | number = "first"
    ) => {
        player.replacePlaylist(
            trackIds,
            playlistSourceId,
            playlistSourceType,
            autoPlayTrackId
        );
    }
);

player = new Proxy(player, {
    set(target: any, prop, val) {
        target[prop] = val;
        if (prop === "_howler") return true;
        target.saveSelfToLocalStorage();
        //   target.sendSelfToIpcMain();
        return true;
    },
});

export { player };
