export enum Path {
    Home = "/",
    Local = "/local",
    Settings = "/settings",
    Chapter = "/chapter",
    Masks = "/masks",
    Plugins = "/plugins",
    Auth = "/auth",
}

export const YT_DLP = {
    owner: "yt-dlp",
    repo: "yt-dlp",
    downloadInfo: {
        windows: {
            path: "yt-dlp.exe",
            url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
        },
        linux: {
            path: "yt-dlp",
            url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
        },
        macos: {
            path: "yt-dlp_macos",
            url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
        }
    },
}
