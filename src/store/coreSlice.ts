import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import auth from "@/utils/auth";
import {
    cloudDisk,
    userAccount,
    userLikedSongsIds,
    userPlayHistory,
    userPlaylist,
} from "@/api/user";
import { getPlaylistDetail } from "@/api/playlist";
import { getTrackDetail, likeTrack } from "@/api/track";
import { invoke } from "@tauri-apps/api/core";
import { playlistCategories } from "@/utils/staticData";
import { albumSublist } from "@/api/album";
import { artistSubList } from "@/api/artist";
import { mvSublist } from "@/api/mv";
import _ from "lodash";
import messageEventEmitter from "@/event/messageEventEmitter";

const enabledPlaylistCategories = playlistCategories
    .filter((c) => c.enable)
    .map((c) => c.code);

export interface Shortcut {
    id: string;
    name: string;
    shortcut: string;
    globalShortcut: string;
    isPersonalUse: boolean;
}

interface Settings {
    showUnavailableSongInGreyStyle: boolean;
    title: string;
    enableDiscordRichPresence: boolean;
    lang: string;
    appearance: string;
    musicLanguage: "all" | "zh" | "ea" | "jp" | "kr";
    cacheLimit: number;
    showLyricsTranslation: boolean;
    lyricsBackground: string;
    showLyricsTime: boolean;
    lyricFontSize: number;
    enableUnblockNeteaseMusic: boolean;
    unmSource: string;
    unmEnableFlac: boolean;
    unmSearchMode: string;
    unmJooxCookie: string;
    unmQQCookie: string;
    unmYtDlExe: string;
    unmProxyUri: string;
    closeAppOption: string;
    showLibraryDefault: boolean;
    showPlaylistsByAppleMusic: boolean;
    subTitleDefault: boolean;
    enableReversedMode: boolean;
    proxyProtocol: string;
    proxyServer: string;
    proxyPort: number;
    enableGlobalShortcut: boolean;
    shortcuts: Shortcut[];
    enabledPlaylistCategories: string[];
}

interface Data {
    likedSongPlaylistID: any;
    user: any;
    loginMode: "account" | "username" | "qrCode" | "";
    libraryPlaylistFilter: string;
}

interface Toast {
    show: boolean;
    text: string;
    timer: NodeJS.Timeout | null;
}

interface AddTrackToPlaylistModal {
    show: boolean;
    selectedTrackId: number;
}

interface NewPlaylistModal {
    show: boolean;
    afterCreateAddTrackId: number;
}

interface Modals {
    addTrackToPlaylistModal: AddTrackToPlaylistModal;
    newPlaylistModal: NewPlaylistModal;
}

interface UpdateModal {
    modalName: string;
    key: string;
    value: boolean | number;
}

export interface CoreState {
    showLyrics: boolean;
    mainEnableScrolling: boolean;
    settings: Settings;
    data: Data;
    lastfm: any;
    liked: any;
    toast: Toast;
    dailyTracks: any[];
    modals: Modals;
}

const initialState: CoreState = {
    showLyrics: false,
    mainEnableScrolling: true,
    settings: {
        showUnavailableSongInGreyStyle: false,
        title: "mop",
        enableDiscordRichPresence: false,
        lang: "zh_ch",
        appearance: "auto",
        musicLanguage: "all",
        cacheLimit: 8192,
        showLyricsTranslation: true,
        lyricsBackground: "true",
        showLyricsTime: true,
        lyricFontSize: 28,
        enableUnblockNeteaseMusic: true,
        unmSource: "",
        unmEnableFlac: false,
        unmSearchMode: "fast-first",
        unmJooxCookie: "",
        unmQQCookie: "",
        unmYtDlExe: "",
        unmProxyUri: "",
        closeAppOption: "exit",
        showLibraryDefault: false,
        showPlaylistsByAppleMusic: true,
        subTitleDefault: false,
        enableReversedMode: false,
        proxyProtocol: "noProxy",
        proxyServer: "",
        proxyPort: 0,
        enableGlobalShortcut: true,
        shortcuts: [
            {
                id: "play",
                name: "播放/暂停",
                shortcut: "CmdOrCtrl+1",
                globalShortcut: "Alt+CommandOrControl+1",
                isPersonalUse: false,
            },
            {
                id: "next",
                name: "下一首",
                shortcut: "CmdOrCtrl+Right",
                globalShortcut: "Alt+CommandOrControl+Right",
                isPersonalUse: false,
            },
            {
                id: "previous",
                name: "上一首",
                shortcut: "CmdOrCtrl+Left",
                globalShortcut: "Alt+CommandOrControl+Left",
                isPersonalUse: false,
            },
            {
                id: "increaseVolume",
                name: "增加音量",
                shortcut: "CmdOrCtrl+Up",
                globalShortcut: "Alt+CommandOrControl+Up",
                isPersonalUse: false,
            },
            {
                id: "decreaseVolume",
                name: "减少音量",
                shortcut: "CmdOrCtrl+Down",
                globalShortcut: "Alt+CommandOrControl+Down",
                isPersonalUse: false,
            },
            {
                id: "like",
                name: "喜欢歌曲",
                shortcut: "CmdOrCtrl+L",
                globalShortcut: "Alt+CommandOrControl+L",
                isPersonalUse: false,
            },
            {
                id: "minimize",
                name: "隐藏/显示播放器",
                shortcut: "CmdOrCtrl+M",
                globalShortcut: "Alt+CommandOrControl+M",
                isPersonalUse: false,
            },
        ],
        enabledPlaylistCategories: enabledPlaylistCategories,
    },
    data: JSON.parse(localStorage.getItem("data") || "{}"),
    lastfm: JSON.parse(localStorage.getItem("lastfm") || "{}"),
    liked: {
        songs: [],
        songsWithDetails: [], // 只有前12首
        playlists: [],
        albums: [],
        artists: [],
        mvs: [],
        cloudDisk: [],
        playHistory: {
            weekData: [],
            allData: [],
        },
    },
    toast: {
        show: false,
        text: "",
        timer: null,
    },
    dailyTracks: [],
    modals: {
        addTrackToPlaylistModal: {
            show: false,
            selectedTrackId: 0,
        },
        newPlaylistModal: {
            show: false,
            afterCreateAddTrackId: 0,
        },
    },
};

export const getAppConf = createAsyncThunk("getAppConf", async () => {
    let appConf: any = await invoke("get_app_conf", {});
    return appConf;
});

export const restoreDefaultShortcuts = createAsyncThunk(
    "restoreDefaultShortcuts",
    async () => {
        let appConf: any = await invoke("restore_default_shortcuts", {});
        return appConf;
    }
);

export interface ConfUpdate {
    confName: string;
    key: string;
    value: string | boolean | number;
}

export const updateAppConf = createAsyncThunk(
    "updateAppConf",
    async (confUpdate: ConfUpdate, _) => {
        return confUpdate;
    }
);

export const fetchUserProfile = createAsyncThunk(
    "users/fetchUserProfile",
    async () => {
        if (!auth.isAccountLoggedIn()) return;
        return await userAccount();
    }
);

export const fetchLikedPlaylist = createAsyncThunk(
    "users/fetchLikedPlaylist",
    async (_, thunkAPI) => {
        const state: any = thunkAPI.getState();
        if (!auth.isLooseLoggedIn()) return;
        if (auth.isAccountLoggedIn()) {
            return await userPlaylist({
                uid: state.core.data.user?.userId,
                limit: 2000, // 最多只加载2000个歌单（等有用户反馈问题再修）
                timestamp: new Date().getTime(),
            });
        } else {
            // TODO:搜索ID登录的用户
        }
    }
);

export const fetchLikedSongs = createAsyncThunk(
    "users/fetchLikedSongs",
    async (_, thunkAPI) => {
        const state: any = thunkAPI.getState();
        if (!auth.isLooseLoggedIn()) return;
        if (auth.isAccountLoggedIn()) {
            return await userLikedSongsIds(state.core.data.user?.userId);
        } else {
            // TODO:搜索ID登录的用户
        }
    }
);

export const fetchLikedSongsWithDetails = createAsyncThunk(
    "users/fetchLikedSongsWithDetails",
    async (_, thunkAPI) => {
        const state: any = thunkAPI.getState();
        let result: any = await getPlaylistDetail(
            state.core.data.likedSongPlaylistID,
            true
        );

        if (result.playlist?.trackIds?.length === 0) {
            return {};
        } else {
            result = await getTrackDetail(
                result.playlist.trackIds
                    .slice(0, 12)
                    .map((t: any) => t.id)
                    .join(",")
            );
            result.name = "songsWithDetails";
            return result;
        }
    }
);

export const likeATrack = createAsyncThunk(
    "users/likeATrack",
    async (id: number, thunkAPI) => {
        if (!auth.isAccountLoggedIn()) {
            messageEventEmitter.emit(
                "MESSAGE:INFO",
                "此操作需要登录网易云账号"
            );
            return;
        }
        const state: any = thunkAPI.getState();
        let like = true;
        if (state.core.liked.songs.includes(id)) like = false;
        await likeTrack({ trackId: id, like }).catch((_e) => {
            messageEventEmitter.emit(
                "MESSAGE:INFO",
                "操作失败，专辑下架或版权锁定"
            );
        });

        thunkAPI.dispatch(fetchLikedSongsWithDetails);
        if (like === false) {
            return state.core.liked.songs.filter((d: number) => d !== id);
        } else {
            let newLikeSongs = [...state.core.liked.songs];
            newLikeSongs.push(id);
            return newLikeSongs;
        }
    }
);

export const fetchLikedAlbums = createAsyncThunk(
    "users/fetchLikedAlbums",
    async (_) => {
        if (!auth.isAccountLoggedIn()) return;
        let result = albumSublist({ limit: 200 });
        return result;
    }
);

export const fetchLikedArtists = createAsyncThunk(
    "users/fetchLikedArtists",
    async (_) => {
        if (!auth.isAccountLoggedIn()) return;
        let result = artistSubList({ limit: 200 });
        return result;
    }
);

export const fetchLikedMVs = createAsyncThunk(
    "users/fetchLikedMVs",
    async (_) => {
        if (!auth.isAccountLoggedIn()) return;
        let result = mvSublist({ limit: 200 });
        return result;
    }
);

export const fetchCloudDisk = createAsyncThunk(
    "users/fetchCloudDisk",
    async (_) => {
        if (!auth.isAccountLoggedIn()) return;
        return cloudDisk({ limit: 200 });
    }
);

export const fetchPlayHistory = createAsyncThunk(
    "users/fetchPlayHistory",
    async (_, thunkAPI) => {
        if (!auth.isAccountLoggedIn()) return;
        const state: any = thunkAPI.getState();
        const uid = state.core.data.user?.userId.toString();
        return Promise.all([
            userPlayHistory({ uid, type: 0 }),
            userPlayHistory({ uid, type: 1 }),
        ]).then((result: any) => {
            const data: any = {};
            const dataType: any = { 0: "allData", 1: "weekData" };
            if (result[0] && result[1]) {
                for (let i = 0; i < result.length; i++) {
                    const songData = result[i][dataType[i]].map((item: any) => {
                        const song = item.song;
                        song.playCount = item.playCount;
                        return song;
                    });
                    data[dataType[i]] = songData;
                }
                return data;
            }
        });
    }
);

export const coreSlice = createSlice({
    name: "core",
    initialState,
    reducers: {
        enableMainScrolling: (state, action: PayloadAction<boolean>) => {
            state.mainEnableScrolling = action.payload;
        },

        updateTitle: (state, action: PayloadAction<string>) => {
            state.settings.title = action.payload;
        },

        updateSettingsData: (
            state,
            action: PayloadAction<{ key: string; value: any }>
        ) => {
            const { key, value } = action.payload;
            (state.settings as any)[key] = value;
        },

        setToast: (state, action: PayloadAction<Toast>) => {
            state.toast = action.payload;
        },

        setLoginMode: (state, action: PayloadAction<string>) => {
            state.data.loginMode = action.payload as
                | "account"
                | "username"
                | "qrCode"
                | "";
        },

        doLogout: (state, action: PayloadAction<string>) => {
            auth.removeCookie("MUSIC_U");
            auth.removeCookie("__csrf");
            state.data.user = {};
            state.data.loginMode = action.payload as
                | "account"
                | "username"
                | "qrCode"
                | "";
            state.data.likedSongPlaylistID = undefined;
        },

        setLibraryPlaylistFilter: (state, action: PayloadAction<string>) => {
            state.data.libraryPlaylistFilter = action.payload;
        },

        updateLastfm: (state, action: PayloadAction<any>) => {
            state.lastfm = action.payload;
        },

        toggleLyrics: (state, _action: PayloadAction<void>) => {
            state.showLyrics = !state.showLyrics;
        },

        togglePlaylistCategory(state, action: PayloadAction<string>) {
            const name = action.payload;
            const index = state.settings.enabledPlaylistCategories.findIndex(
                (c) => c === name
            );
            if (index !== -1) {
                state.settings.enabledPlaylistCategories =
                    state.settings.enabledPlaylistCategories.filter(
                        (c) => c !== name
                    );
            } else {
                state.settings.enabledPlaylistCategories.push(name);
            }
        },

        updateDailyTracks(state, action: PayloadAction<any>) {
            state.dailyTracks = action.payload;
        },

        updateModal(state, action: PayloadAction<UpdateModal>) {
            const updateModal = action.payload;
            (state.modals as any)[updateModal.modalName][updateModal.key] =
                updateModal.value;
            if (updateModal.key === "show") {
                // 100ms的延迟是为等待右键菜单blur之后再disableScrolling
                updateModal.value === true
                    ? state.mainEnableScrolling = false
                    : (state.mainEnableScrolling = true);
            }
        },

        updateData(state, action: PayloadAction<{ key: string; value: any }>) {
            const { key, value } = action.payload;
            (state.data as any)[key] = value;
        },

        updateLikedXXX(
            state,
            action: PayloadAction<{ name: string; data: any }>
        ) {
            const { name, data } = action.payload;
            (state.liked as any)[name] = data;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getAppConf.fulfilled, (state, action) => {
            const appConf: any = action.payload.settings;
            for (let key in state.settings) {
                if (appConf[key]) {
                    (state.settings as any)[key] = appConf[key];
                }
            }
        }),
            builder.addCase(
                restoreDefaultShortcuts.fulfilled,
                (state, action) => {
                    const appConf: any = action.payload.settings;
                    state.settings.shortcuts = appConf.shortcuts;
                }
            ),
            builder.addCase(updateAppConf.fulfilled, (state, action) => {
                const confUpdate: ConfUpdate = action.payload;
                (state as any)[confUpdate.confName][confUpdate.key] =
                    confUpdate.value;
            }),
            builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result.code === 200) {
                    state.data.user = result.profile;
                }
            }),
            builder.addCase(fetchLikedPlaylist.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result && result.playlist) {
                    state.liked.playlists = result.playlist;
                    state.data.likedSongPlaylistID = result.playlist[0].id;
                }
            }),
            builder.addCase(fetchLikedSongs.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result && result.ids) {
                    state.liked.songs = result.ids;
                }
            }),
            builder.addCase(
                fetchLikedSongsWithDetails.fulfilled,
                (state, action) => {
                    const result: any = action.payload;
                    if (result) {
                        state.liked[result.name] = result.songs;
                    }
                }
            ),
            builder.addCase(likeATrack.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result) {
                    state.liked.songs = result;
                }
            }),
            builder.addCase(fetchLikedAlbums.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result && result.data) {
                    state.liked.albums = result.data;
                }
            }),
            builder.addCase(fetchLikedArtists.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result && result.data) {
                    state.liked.artists = result.data;
                }
            }),
            builder.addCase(fetchLikedMVs.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result && result.data) {
                    state.liked.mvs = result.data;
                }
            }),
            builder.addCase(fetchCloudDisk.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result && result.data) {
                    state.liked.cloudDisk = result.data;
                }
            }),
            builder.addCase(fetchPlayHistory.fulfilled, (state, action) => {
                const result: any = action.payload;
                if (result) {
                    state.liked.playHistory = result;
                }
            });
    },
});

export const {
    enableMainScrolling,
    updateTitle,
    setToast,
    setLoginMode,
    doLogout,
    setLibraryPlaylistFilter,
    updateLastfm,
    toggleLyrics,
    togglePlaylistCategory,
    updateDailyTracks,
    updateModal,
    updateData,
    updateLikedXXX,
    updateSettingsData,
} = coreSlice.actions;

export const mainEnableScrollingStore = (state: RootState) =>
    state.core.mainEnableScrolling;

export const loginMode = (state: RootState) => state.core.data.loginMode;

export const settingsStore = (state: RootState) => state.core.settings;

export const dataStore = (state: RootState) => state.core.data;

export const likedStore = (state: RootState) => state.core.liked;

export const toastStore = (state: RootState) => state.core.toast;

export const dailyTracksStore = (state: RootState) => state.core.dailyTracks;

export const lastfmStore = (state: RootState) => state.core.lastfm;

export const showLyricsStore = (state: RootState) => state.core.showLyrics;

export const modalsStore = (state: RootState) => state.core.modals;

export default coreSlice.reducer;
