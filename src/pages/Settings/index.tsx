import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    dataStore,
    settingsStore,
    lastfmStore,
    updateLastfm,
    Shortcut,
    doLogout,
} from "@/store/coreSlice";
import auth from "@/utils/auth";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import SvgIcon from "@/components/SvgIcon";
import { bytesToSize, changeLanguage, storeData } from "@/utils";
import _ from "lodash";
import { clearDB, countDatabaseSize } from "@/db";
import { lastfmAuth } from "@/api/lastfm";
import SettingsSelect from "./components/SettingsSelect";
import {
    LANG_SELECT_DATA,
    appearanceSelectData,
    cacheLimitSelectData,
    closeAppOptionSelectData,
    lyricFontSizeSelectData,
    lyricsBackgroundSelectData,
    musicLanguageSelectData,
    musicQualitySelectData,
    proxyProtocolSelectData,
    unmSearchModeSelectData,
} from "@/static/settingsData";
import SettingsSwitch from "./components/SettingsSwitch";
import SettingsInput from "./components/SettingsInput";
import styles from "./index.module.scss";
import { osDetailType, appVersion } from "@/utils/env";
import { useConfig } from "@/hooks/useConfig";
import { invoke } from "@tauri-apps/api/core";
import { store } from "@/utils/store";
import { DownloadFileTask, DownloadInfo } from "@/business/DownloadFileTask";
import LinearProgressWithLabel from "./components/LinearProgressWithLabel";
import { YT_DLP } from "@/constant";

const validShortcutCodes = ["=", "-", "~", "[", "]", ";", "'", ",", ".", "/"];

const Settings = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const data = useAppSelector(dataStore);
    const settings = useAppSelector(settingsStore);
    const lastfm = useAppSelector(lastfmStore);
    const [lang, setLang] = useConfig("lang", "");
    const [automaticallyCacheSongs, setAutomaticallyCacheSongs] = useConfig(
        "automaticallyCacheSongs",
        true
    );
    const [shortcutInput, setShortcutInput] = useState({
        id: "",
        type: "",
        recording: false,
    });
    const recordedShortcut = useRef<any>([]);
    const [tracksCache, setTracksCache] = useState({
        size: "0KB",
        length: 0,
    });
    const [ytdlDownloadProgress, setYtdlDownloadProgress] = useState(0);
    const [ytdlDownloadSpeed, setYtdlDownloadSpeed] = useState(0.0);
    const [ytdlDownloadStatus, setYtdlDownloadStatus] = useConfig("ytdlDownloadStatus", "end");
    const [ytdlVersion, setYtdlVersion] = useConfig("ytdlVersion", "");
    const [latestVersion, setLatestVersion] = useState("");
    const shortcutInputTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
    const [unmProxyUri, setUnmProxyUri] = useConfig("unmProxyUri", "");
    const [proxyProtocol, setProxyProtocol] = useConfig("proxyProtocol", "");
    const [proxyServer, setProxyServer] = useConfig("proxyServer", "");
    const [proxyPort, setProxyPort] = useConfig("proxyPort", "");
    const [shortcutList, setShortcutList] = useConfig("shortcutList", []);
    const [musicQuality, setMusicQuality] = useConfig("musicQuality", 320000);
    const [nyancatStyle, setNyancatStyle] = useConfig("nyancatStyle", false);
    const [enableReversedMode, setEnableReversedMode] = useConfig("enableReversedMode", false);
    const [cacheLimit, setCacheLimit] = useConfig("cacheLimit", "8192")

    useEffect(() => {
        init();
    }, [data]);

    const init = _.debounce(() => {
        countDbSize();
        invoke("github_repos_info_version", { owner: YT_DLP.owner, repo: YT_DLP.repo }).then((latestVersion) => {
            setLatestVersion(latestVersion as string);
        });
    }, 500);

    const countDbSize = () => {
        countDatabaseSize().then(async (data) => {
            if (data === undefined) {
                setTracksCache({
                    size: "0KB",
                    length: 0,
                });
                return;
            }
            const size = await bytesToSize(data.bytes);
            setTracksCache({
                size,
                length: data.length,
            });
        });
    };

    const showUserInfo = useMemo(() => {
        return auth.isLooseLoggedIn() && data.user.nickname;
    }, [data.user]);

    const isLastfmConnected = useMemo(() => {
        return lastfm.key !== undefined;
    }, [lastfm]);

    const recordedShortcutComputed = () => {
        let shortcut: any[] = [];
        recordedShortcut.current.map((e: any) => {
            if (e.keyCode >= 65 && e.keyCode <= 90) {
                // A-Z
                shortcut.push(e.code.replace("Key", ""));
            } else if (e.key === "Meta") {
                // ⌘ Command on macOS
                shortcut.push("Command");
            } else if (["Alt", "Control", "Shift"].includes(e.key)) {
                shortcut.push(e.key);
            } else if (e.keyCode >= 48 && e.keyCode <= 57) {
                // 0-9
                shortcut.push(e.code.replace("Digit", ""));
            } else if (e.keyCode >= 112 && e.keyCode <= 123) {
                // F1-F12
                shortcut.push(e.code);
            } else if (
                [
                    "ArrowRight",
                    "ArrowLeft",
                    "ArrowUp",
                    "ArrowDown",
                    " ",
                ].includes(e.key)
            ) {
                // Arrows
                shortcut.push(e.code.replace("Arrow", ""));
            } else if (validShortcutCodes.includes(e.key)) {
                shortcut.push(e.key);
            }
        });
        const sortTable: any = {
            Control: 1,
            Shift: 2,
            Alt: 3,
            Command: 4,
        };
        shortcut = shortcut.sort((a, b) => {
            if (!sortTable[a] || !sortTable[b]) return 0;
            if (sortTable[a] - sortTable[b] <= -1) {
                return -1;
            } else if (sortTable[a] - sortTable[b] >= 1) {
                return 1;
            } else {
                return 0;
            }
        });
        return shortcut.join("+");
    };

    const clickOutside = () => {
        exitRecordShortcut();
    };

    const exitRecordShortcut = () => {
        if (shortcutInput.recording === false) return;
        setShortcutInput({ id: "", type: "", recording: false });
        recordedShortcut.current = [];
    };

    const logout = () => {
        dispatch(doLogout(""));
        navigate("/home");
    };

    const clearCache = () => {
        clearDB().then(() => {
            countDbSize();
        });
    };

    const lastfmDisconnect = () => {
        localStorage.removeItem("lastfm");
        dispatch(updateLastfm({}));
    };

    const lastfmConnect = () => {
        lastfmAuth();
        let lastfmChecker = setInterval(() => {
            const session = localStorage.getItem("lastfm");
            if (session) {
                dispatch(updateLastfm(JSON.parse(session)));
                clearInterval(lastfmChecker);
            }
        }, 1000);
    };

    const sendProxyConfig = () => {};

    const handleShortcutKeydown = (e: KeyboardEvent) => {
        if (shortcutInput.recording === false) return;
        e.preventDefault();
        if (
            recordedShortcut.current.find(
                (s: { keyCode: any }) => s.keyCode === e.keyCode
            )
        )
            return;
        if (shortcutInputTimeout.current) {
            clearTimeout(shortcutInputTimeout.current);
        }
        recordedShortcut.current.push(e);
        if (
            (e.keyCode >= 65 && e.keyCode <= 90) || // A-Z
            (e.keyCode >= 48 && e.keyCode <= 57) || // 0-9
            (e.keyCode >= 112 && e.keyCode <= 123) || // F1-F12
            ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " "].includes(
                e.key
            ) || // Arrows
            validShortcutCodes.includes(e.key)
        ) {
            shortcutInputTimeout.current = setTimeout(() => {
                saveShortcut();
            }, 500);
        }
    };

    const saveShortcut = async () => {
        const { id, type } = shortcutInput;
        const shortcut = recordedShortcutComputed();
        const containsElement =
            shortcutList.filter((s: Shortcut) => {
                return s.shortcut === shortcut;
            }).length > 0;
        if (containsElement) {
            storeData.showToast("快捷键已存在");
            shortcutInputTimeout.current = undefined;
            setShortcutInput({ id: "", type: "", recording: false });
            recordedShortcut.current = [];
            return;
        }
        let oldShortcut: any = _.cloneDeep(
            shortcutList.find((s: any) => s.id === id)
        );
        await invoke("unregister_shortcut_by_frontend", {
            shortcut: oldShortcut,
        });
        oldShortcut[type] = shortcut;
        let shortcuts = shortcutList.map((s: any) => {
            if (s.id !== id) return s;
            return oldShortcut;
        });
        let s: Shortcut = await invoke("register_shortcut_by_frontend", {
            shortcut: oldShortcut,
        });
        oldShortcut.isPersonalUse = s.isPersonalUse;
        setShortcutList(shortcuts);
        storeData.showToast("快捷键已保存");
        shortcutInputTimeout.current = undefined;
        setShortcutInput({ id: "", type: "", recording: false });
        recordedShortcut.current = [];
    };

    const getGlobalShortcutClass = (
        shortcut: Shortcut,
        isGlobalShortcut = false
    ) => {
        let classNameArr = [];
        classNameArr.push("keyboard-input");
        if (
            shortcutInput.id === shortcut.id &&
            ((!isGlobalShortcut && shortcutInput.type === "shortcut") ||
                (isGlobalShortcut && shortcutInput.type === "globalShortcut"))
        ) {
            classNameArr.push("active");
        }
        if (isGlobalShortcut && shortcut.isPersonalUse) {
            classNameArr.push("error");
        }
        return classNameArr.join(" ");
    };

    const readyToRecordShortcut = (id: string, type: string) => {
        if (
            type === "globalShortcut" &&
            settings.enableGlobalShortcut === false
        ) {
            return;
        }
        setShortcutInput({ id, type, recording: true });
        recordedShortcut.current = [];
    };

    const formatShortcut = (shortcut: String) => {
        shortcut = shortcut
            .replace("+", " + ")
            .replace("Up", "↑")
            .replace("Down", "↓")
            .replace("Right", "→")
            .replace("Left", "←");
        if (lang === "zh_ch") {
            shortcut = shortcut.replace("Space", "空格");
        } else if (lang === "zh-TW") {
            shortcut = shortcut.replace("Space", "空白鍵");
        }
        if (osDetailType === "ios") {
            return shortcut
                .replace("CommandOrControl", "⌘")
                .replace("Command", "⌘")
                .replace("Alt", "⌥")
                .replace("Control", "⌃")
                .replace("Shift", "⇧");
        }
        return shortcut.replace("CommandOrControl", "Ctrl");
    };

    const onRestoreDefaultShortcuts = async () => {
        await invoke("restore_default_shortcuts", {});
        window.location.reload();
    };

    const changeAppearance = (appearance: string) => {
        if (appearance === "auto" || appearance === undefined) {
            appearance = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";
        }
        document.body.setAttribute("data-theme", appearance);
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute("content", appearance === "dark" ? "#222" : "#fff");
    };

    const onChangeLanguage = (lang: string) => {
        changeLanguage(lang);
        setLang(lang);
    };

    const openDevTools = () => {
        invoke("open_devtools");
    };

    const downloadYtDlp = () => {
        if (osDetailType in YT_DLP.downloadInfo){
            const ytDlpInfo = YT_DLP.downloadInfo[osDetailType as keyof typeof YT_DLP.downloadInfo];
            const ytDlpDownloadTask = new DownloadFileTask({
                event_id: "yt-dlp",
                download_url: ytDlpInfo.url,
                file_path: osDetailType + "/" + ytDlpInfo.path,
            })
            ytDlpDownloadTask.on("begin", async (_data: DownloadInfo) => {
                setYtdlDownloadStatus("begin")
            })
            ytDlpDownloadTask.on("progress", async (data: DownloadInfo) => {
                setYtdlDownloadStatus("progress")
                setYtdlDownloadProgress(data.progress!)
                setYtdlDownloadSpeed(data.speed!)
            })
            ytDlpDownloadTask.on("end", async (_data: DownloadInfo) => {
                setYtdlDownloadStatus("end")
                setYtdlVersion(latestVersion)
            })
            ytDlpDownloadTask.startDownload();
        } else {
            
        }
    };

    return (
        <div className={styles.settingsPage} onClick={clickOutside}>
            <div className={styles.container}>
                {showUserInfo ? (
                    <div className={styles.user}>
                        <div className="left">
                            <img
                                className="avatar"
                                src={data.user.avatarUrl}
                                loading="lazy"
                            />
                            <div className="info">
                                <div className="nickname">
                                    {data.user.nickname}
                                </div>
                                <div className="extra-info">
                                    {data.user.vipType !== 0 ? (
                                        <span className="vip">
                                            <img
                                                className="cvip"
                                                src="data:image/png;base64,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"
                                                loading="lazy"
                                            />
                                            <span className="text">
                                                黑胶VIP
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text">
                                            {data.user.signature}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="right">
                            <button onClick={logout}>
                                <SvgIcon svgName="logout" />
                                {t("common.logout")}
                            </button>
                        </div>
                    </div>
                ) : (
                    ""
                )}
                <SettingsSelect
                    title="settings.language"
                    initValue={lang}
                    fieldKey="lang"
                    selectData={LANG_SELECT_DATA}
                    callback={onChangeLanguage}
                />
                <SettingsSelect
                    title="settings.appearance.text"
                    initValue={settings.appearance}
                    fieldKey="appearance"
                    selectData={appearanceSelectData()}
                    callback={changeAppearance}
                />
                <SettingsSelect
                    title="settings.musicGenrePreference.text"
                    initValue={settings.musicLanguage}
                    fieldKey="musicLanguage"
                    selectData={musicLanguageSelectData()}
                />

                <h3>{t("settings.musicQuality.text")}</h3>
                <SettingsSelect
                    title="settings.musicQuality.text"
                    initValue={musicQuality}
                    fieldKey="musicQuality"
                    selectData={musicQualitySelectData()}
                    callback={setMusicQuality}
                />

                <h3>{t("settings.cacheTitle")}</h3>
                <SettingsSwitch
                    inputId="automatically-cache-songs"
                    title="settings.automaticallyCacheSongs"
                    initValue={automaticallyCacheSongs}
                    fieldKey="automaticallyCacheSongs"
                    callback={setAutomaticallyCacheSongs}
                />
                <SettingsSelect
                    title="settings.cacheLimit.text"
                    initValue={cacheLimit}
                    fieldKey="cacheLimit"
                    selectData={cacheLimitSelectData()}
                    callback={(value: any) => setCacheLimit(value)}
                />
                <div className={styles.item}>
                    <div className="left">
                        <div className="title">
                            {t("settings.cacheCount", {
                                song: tracksCache.length,
                                size: tracksCache.size,
                            })}
                        </div>
                    </div>
                    <div className="right">
                        <button onClick={clearCache}>
                            {t("settings.clearSongsCache")}
                        </button>
                    </div>
                </div>

                {/* 歌词 */}
                <h3>{t("settings.lyric.text")}</h3>
                <SettingsSwitch
                    inputId="show-lyrics-translation"
                    title="settings.lyric.showLyricsTranslation"
                    initValue={settings.showLyricsTranslation}
                    fieldKey="showLyricsTranslation"
                />
                <SettingsSelect
                    title="settings.lyric.lyricsBackground.text"
                    initValue={settings.lyricsBackground}
                    fieldKey="lyricsBackground"
                    selectData={lyricsBackgroundSelectData()}
                />
                <SettingsSwitch
                    inputId="show-lyrics-time"
                    title="settings.lyric.showLyricsTime"
                    initValue={settings.showLyricsTime}
                    fieldKey="showLyricsTime"
                />
                <SettingsSelect
                    title="settings.lyricFontSize.text"
                    initValue={settings.lyricFontSize}
                    fieldKey="lyricFontSize"
                    selectData={lyricFontSizeSelectData()}
                    converNumber
                />

                <section className="unm-configuration">
                    <h3>UnblockNeteaseMusic</h3>
                    <SettingsSwitch
                        inputId="enable-unblock-netease-music"
                        title={
                            <div>
                                {t("settings.unm.enable")}
                                <a
                                    href="https://github.com/UnblockNeteaseMusic/server"
                                    target="blank"
                                >
                                    UnblockNeteaseMusic
                                </a>
                            </div>
                        }
                        initValue={settings.enableUnblockNeteaseMusic}
                        fieldKey="enableUnblockNeteaseMusic"
                    />
                    <SettingsInput
                        title="settings.unm.audioSource.title"
                        description={
                            <div>
                                {t("settings.unm.audioSource.desc1")},
                                <a
                                    href="https://github.com/UnblockNeteaseMusic/server-rust/blob/main/README.md#支援的所有引擎"
                                    target="_blank"
                                >
                                    {t("settings.unm.audioSource.desc2")}
                                </a>
                                <br />
                                {t("settings.unm.audioSource.desc3")}{" "}
                                <code>,</code>{" "}
                                {t("settings.unm.audioSource.desc4")} <br />
                                {t("settings.unm.audioSource.desc5")}
                            </div>
                        }
                        initValue={settings.unmSource}
                        fieldKey="unmSource"
                        inputPlaceholder={
                            t("common.example") + " bilibili, kuwo"
                        }
                    />
                    <SettingsSwitch
                        inputId="unm-enable-flac"
                        title="settings.unm.enableFlac.title"
                        initValue={settings.unmEnableFlac}
                        fieldKey="unmEnableFlac"
                        description="settings.unm.enableFlac.desc"
                    />
                    <SettingsSelect
                        title="settings.unm.searchMode.title"
                        initValue={settings.unmSearchMode}
                        fieldKey="unmSearchMode"
                        selectData={unmSearchModeSelectData()}
                    />
                    <SettingsInput
                        title="settings.unm.cookie.joox"
                        description={
                            <div>
                                <a
                                    href="https://github.com/UnblockNeteaseMusic/server-rust/tree/main/engines#joox-cookie-設定說明"
                                    target="_blank"
                                >
                                    {t("settings.unm.cookie.desc1")}
                                </a>
                                {t("settings.unm.cookie.desc2")}
                            </div>
                        }
                        initValue={settings.unmJooxCookie}
                        fieldKey="unmJooxCookie"
                        inputPlaceholder="wmid=..; session_key=.."
                    />
                    <SettingsInput
                        title="settings.unm.cookie.qq"
                        description={
                            <div>
                                <a
                                    href="https://github.com/UnblockNeteaseMusic/server-rust/tree/main/engines#qq-cookie-設定說明"
                                    target="_blank"
                                >
                                    {t("settings.unm.cookie.desc1")}
                                </a>
                                {t("settings.unm.cookie.desc2")}
                            </div>
                        }
                        initValue={settings.unmQQCookie}
                        fieldKey="unmQQCookie"
                        inputPlaceholder="uin=..; qm_keyst=.."
                    />
                    <div className={styles.item}>
                        <div className="left">
                            <div className="title">
                                {t("settings.unm.ytdl")}
                            </div>
                            {
                                ytdlDownloadStatus != 'end' && ytdlDownloadStatus != 'error' ? (
                                    <LinearProgressWithLabel value={ytdlDownloadProgress} downloadspeed={ytdlDownloadSpeed} />
                                ) : <div className="description">当前版本：{ytdlVersion}；最新版本：{latestVersion}</div>
                            }
                        </div>
                        <div className="right">
                            {
                                latestVersion !== ytdlVersion && (
                                    <button onClick={downloadYtDlp}>{ytdlVersion ? '更新' : '下载'}</button>
                                )
                            }
                        </div>
                    </div>
                    <SettingsInput
                        title="settings.unm.proxy.title"
                        description={
                            <div>
                                {t("settings.unm.proxy.desc1")}
                                <br />
                                {t("settings.unm.proxy.desc2")}
                            </div>
                        }
                        initValue={unmProxyUri}
                        fieldKey="unmProxyUri"
                        inputPlaceholder="ex. https://192.168.11.45"
                        callback={(value: string) => {
                            setUnmProxyUri(value);
                        }}
                    />
                </section>

                {/* 第三方 */}
                <h3>{t("settings.thirdParty.text")}</h3>
                <div className={styles.item}>
                    <div className="left">
                        <div className="title">
                            {isLastfmConnected
                                ? t("settings.thirdParty.lastfm.connectedTo", {
                                      name: lastfm.name,
                                  })
                                : t("settings.thirdParty.lastfm.connectTo")}
                        </div>
                    </div>
                    <div className="right">
                        {isLastfmConnected ? (
                            <button onClick={lastfmDisconnect}>
                                {t("settings.thirdParty.lastfm.disconnect")}
                            </button>
                        ) : (
                            <button onClick={lastfmConnect}>
                                {t(
                                    "settings.thirdParty.lastfm.authorizeTheConnection"
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* 其他 */}
                <h3>{t("settings.others")}</h3>
                <SettingsSelect
                    title="settings.closeAppOption.text"
                    initValue={settings.closeAppOption}
                    fieldKey="closeAppOption"
                    selectData={closeAppOptionSelectData()}
                />
                <SettingsSwitch
                    inputId="show-library-default"
                    title="settings.showLibraryDefault"
                    initValue={settings.showLibraryDefault}
                    fieldKey="showLibraryDefault"
                />
                <SettingsSwitch
                    inputId="show-playlists-by-apple-music"
                    title="settings.showPlaylistsByAppleMusic"
                    initValue={settings.showPlaylistsByAppleMusic}
                    fieldKey="showPlaylistsByAppleMusic"
                />
                <SettingsSwitch
                    inputId="sub-title-default"
                    title="settings.subTitleDefault"
                    initValue={settings.subTitleDefault}
                    fieldKey="subTitleDefault"
                />
                <SettingsSwitch
                    inputId="enable-reversed-mode"
                    title="settings.enableReversedMode"
                    initValue={enableReversedMode}
                    fieldKey="enableReversedMode"
                    callback={(value: boolean) => {
                        setEnableReversedMode(value);
                        store.notifyObservers("enableReversedMode", value);
                    }}
                />
                <SettingsSwitch
                    inputId="nyancat-style"
                    title="🐈️ 🏳️‍🌈"
                    titleStyle={{ transform: "scaleX(-1)" }}
                    initValue={nyancatStyle}
                    fieldKey="nyancatStyle"
                    callback={(value: boolean) => {
                        setNyancatStyle(value);
                        store.notifyObservers("nyancatStyle", value);
                    }}
                />
                <div className={styles.item}>
                    <div className="left">
                        <div className="title">打开开发者工具</div>
                    </div>
                    <div className="right">
                        <button onClick={openDevTools}>开发者工具</button>
                    </div>
                </div>

                <h3>{t("settings.proxy.text")}</h3>
                <SettingsSelect
                    title="settings.proxy.proxyProtocol"
                    initValue={proxyProtocol}
                    fieldKey="proxyProtocol"
                    selectData={proxyProtocolSelectData()}
                    callback={(proxyProtocol: string) =>
                        setProxyProtocol(proxyProtocol)
                    }
                />
                <div
                    id="proxy-form"
                    className={proxyProtocol === "noProxy" ? "disabled" : ""}
                >
                    <input
                        value={proxyServer}
                        className="text-input"
                        placeholder={t("settings.proxy.proxyServer")}
                        disabled={proxyProtocol === "noProxy"}
                        onChange={(e) => setProxyServer(e.target.value)}
                    />
                    <input
                        value={proxyPort}
                        className="text-input"
                        placeholder={t("settings.proxy.proxyPort")}
                        type="number"
                        min={1}
                        max={65535}
                        disabled={proxyProtocol === "noProxy"}
                        onChange={(e) => setProxyPort(e.target.valueAsNumber)}
                    />
                    <button onClick={sendProxyConfig}>
                        {t("settings.proxy.updateProxy")}
                    </button>
                </div>

                <h3>{t("settings.shortcut.text")}</h3>
                <SettingsSwitch
                    inputId="enable-enable-global-shortcut"
                    title="settings.shortcut.enableGlobalShortcut"
                    initValue={settings.enableGlobalShortcut}
                    fieldKey="enableGlobalShortcut"
                />
                <div
                    id="shortcut-table"
                    className={
                        !settings.enableGlobalShortcut ? "global-disabled" : ""
                    }
                    tabIndex={0}
                    onKeyDown={handleShortcutKeydown}
                >
                    <div className="row row-head">
                        <div className="col col-function">
                            {t("settings.shortcut.function")}
                        </div>
                        <div className="col">{t("settings.shortcut.text")}</div>
                        <div className="col">
                            {t("settings.shortcut.globalShortcut")}
                        </div>
                    </div>
                    {shortcutList.map((shortcut: Shortcut) => {
                        return (
                            <div key={shortcut.id} className="row">
                                <div className="col col-function">
                                    {t("settings.shortcut." + shortcut.name)}
                                </div>
                                <div className="col">
                                    <div
                                        className={getGlobalShortcutClass(
                                            shortcut
                                        )}
                                        onClick={() =>
                                            readyToRecordShortcut(
                                                shortcut.id,
                                                "shortcut"
                                            )
                                        }
                                    >
                                        {formatShortcut(shortcut.shortcut)}
                                    </div>
                                </div>
                                <div className="col">
                                    <div
                                        className={getGlobalShortcutClass(
                                            shortcut,
                                            true
                                        )}
                                        onClick={() =>
                                            readyToRecordShortcut(
                                                shortcut.id,
                                                "globalShortcut"
                                            )
                                        }
                                    >
                                        {formatShortcut(
                                            shortcut.globalShortcut
                                        )}
                                    </div>
                                    {shortcut.isPersonalUse ? (
                                        <span className="personalUseTip">
                                            {t(
                                                "settings.shortcut.hotkeyIsOccupied"
                                            )}
                                        </span>
                                    ) : (
                                        ""
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <button
                        className="restore-default-shortcut"
                        onClick={onRestoreDefaultShortcuts}
                    >
                        {t("settings.shortcut.restoreDefaultShortcuts")}
                    </button>
                </div>
                <div className="footer">
                    <p className="author">
                        MADE BY
                        <a
                            href="http://github.com/fangcongyang"
                            target="_blank"
                        >
                            fangcongyang
                        </a>
                    </p>
                    <p className="version">v {appVersion}</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
