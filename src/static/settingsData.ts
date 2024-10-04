import i18n from 'i18next'

export const LANG_SELECT_DATA = [
    {
        name: "🇬🇧 English",
        value: "en",
    },
    {
        name: "🇹🇷 Türkçe",
        value: "tr",
    },
    {
        name: "🇨🇳 简体中文",
        value: "zh_cn",
    },
    {
        name: "繁體中文",
        value: "zh-TW",
    },
]

export function appearanceSelectData() {
    return [
        {
            name: i18n.t('settings.appearance.auto'),
            value: "auto"
        },
        {
            name: "🌞 " + i18n.t('settings.appearance.light'),
            value: "light"
        },
        {
            name: "🌚 " + i18n.t('settings.appearance.dark'),
            value: "dark"
        }
    ]
}

export function musicLanguageSelectData() {
    return [
        {
            name: i18n.t('settings.musicGenrePreference.none'),
            value: "all"
        },
        {
            name: i18n.t('settings.musicGenrePreference.mandarin'),
            value: "zh"
        },
        {
            name: i18n.t('settings.musicGenrePreference.western'),
            value: "ea"
        },
        {
            name: i18n.t('settings.musicGenrePreference.japanese'),
            value: "jp"
        },
        {
            name: i18n.t('settings.musicGenrePreference.korean'),
            value: "kr"
        }
    ]
}

export function musicQualitySelectData() {
    return [
        {
            name: i18n.t('settings.musicQuality.low') + " - 128Kbps",
            value: "128000"
        },
        {
            name: i18n.t('settings.musicQuality.medium') + " - 192Kbps",
            value: "192000"
        },
        {
            name: i18n.t('settings.musicQuality.high') + " - 320Kbps",
            value: "320000"
        },
        {
            name: i18n.t('settings.musicQuality.lossless') + " - FLAC",
            value: "flac"
        },
        {
            name: "Hi-Res",
            value: "999000"
        },
    ]
}

export function cacheLimitSelectData() {
    return [
        {
            name: i18n.t('settings.cacheLimit.none'),
            value: "false"
        },
        {
            name: "500MB",
            value: "512"
        },
        {
            name: "1GB",
            value: "1024"
        },
        {
            name: "2GB",
            value: "2048"
        },
        {
            name: "4GB",
            value: "4096"
        },
        {
            name: "8GB",
            value: "8192"
        },
    ]
}

export function lyricsBackgroundSelectData() {
    return [
        {
            name: i18n.t('settings.lyric.lyricsBackground.off'),
            value: "false"
        },
        {
            name: i18n.t('settings.lyric.lyricsBackground.on'),
            value: "true"
        },
        {
            name: i18n.t('settings.lyric.lyricsBackground.blur'),
            value: "blur"
        },
        {
            name: i18n.t('settings.lyric.lyricsBackground.dynamic'),
            value: "dynamic"
        },
    ]
}

export function lyricFontSizeSelectData() {
    return [
        {
            name: i18n.t('settings.lyricFontSize.small') + " - 16px",
            value: "16"
        },
        {
            name: i18n.t('settings.lyricFontSize.medium') + " - 22px",
            value: "22"
        },
        {
            name: i18n.t('settings.lyricFontSize.large') + " - 28px",
            value: "28"
        },
        {
            name: i18n.t('settings.lyricFontSize.xlarge') + " - 36px",
            value: "36"
        },
    ]
}

export function unmSearchModeSelectData() {
    return [
        {
            name: i18n.t('settings.unm.searchMode.fast'),
            value: "fast-first"
        },
        {
            name: i18n.t('settings.unm.searchMode.order'),
            value: "order-first"
        },
    ]
}

export function proxyProtocolSelectData() {
    return [
        {
            name: i18n.t('settings.proxy.noProxy'),
            value: "noProxy"
        },
        {
            name: i18n.t('settings.proxy.http'),
            value: "HTTP"
        },
        {
            name: i18n.t('settings.proxy.https'),
            value: "HTTPS"
        },
    ]
}

export function closeAppOptionSelectData() {
    return [
        {
            name: i18n.t('settings.closeAppOption.ask'),
            value: "ask"
        },
        {
            name: i18n.t('settings.closeAppOption.exit'),
            value: "exit"
        },
        {
            name: i18n.t('settings.closeAppOption.minimizeToTray'),
            value: "minimizeToTray"
        },
    ]
}