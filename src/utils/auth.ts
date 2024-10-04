import Cookies from "js-cookie";
import { Store } from "@reduxjs/toolkit";

interface Auth {
    store: Store | null;
    setCookies(string: string): void;
    getCookie(key: string): string | null;
    removeCookie(key: string): void;
    isAccountLoggedIn(): boolean;
    isUsernameLoggedIn(): boolean;
    isLooseLoggedIn(): boolean;
    isTrackPlayable(track: any): { playable: boolean; reason: string };
    mapTrackPlayableStatus(tracks: any, privileges?: Array<any>): any;
}

const auth: Auth = {
    store: null,

    setCookies(string: string) {
        const cookies = string.split(";;");
        cookies.map((cookie) => {
            document.cookie = cookie;
            const cookieKeyValue = cookie.split(";")[0].split("=");
            localStorage.setItem(
                `cookie-${cookieKeyValue[0]}`,
                cookieKeyValue[1]
            );
        });
    },

    getCookie(key: string) {
        return Cookies.get(key) ?? localStorage.getItem(`cookie-${key}`);
    },

    removeCookie(key: string) {
        Cookies.remove(key);
        localStorage.removeItem(`cookie-${key}`);
    },

    // 账号登录
    isAccountLoggedIn() {
        return (
            this.getCookie("MUSIC_U") !== undefined &&
            this.store?.getState().core.data.loginMode === "account"
        );
    },

    // 用户名搜索（用户数据为只读）
    isUsernameLoggedIn() {
        return this.store?.getState().core.data.loginMode === "username";
    },

    // 账户登录或者用户名搜索都判断为登录，宽松检查
    isLooseLoggedIn() {
        return this.isAccountLoggedIn() || this.isUsernameLoggedIn();
    },

    isTrackPlayable(track: any) {
        const data = this.store?.getState().core.data;
        let result = {
            playable: true,
            reason: "",
        };
        if (track?.privilege?.pl > 0) {
            return result;
        }
        // cloud storage judgement logic
        if (this.isAccountLoggedIn() && track?.privilege?.cs) {
            return result;
        }
        if (track.fee === 1 || track.privilege?.fee === 1) {
            if (this.isAccountLoggedIn() && data.user.vipType === 11) {
                result.playable = true;
            } else {
                result.playable = false;
                result.reason = "VIP Only";
            }
        } else if (track.fee === 4 || track.privilege?.fee === 4) {
            result.playable = false;
            result.reason = "付费专辑";
        } else if (track.noCopyrightRcmd !== null &&
            track.noCopyrightRcmd !== undefined) {
            result.playable = false;
            result.reason = "无版权";
        } else if (track.privilege?.st < 0 && this.isAccountLoggedIn()) {
            result.playable = false;
            result.reason = "已下架";
        }
        return result;
    },

    mapTrackPlayableStatus(tracks: any, privileges = []) {
        if (tracks?.length === undefined) return tracks;
        return tracks.map((t: any) => {
            const privilege = privileges.find((item: any) => item.id === t.id) || {};
            if (t.privilege) {
                Object.assign(t.privilege, privilege);
            } else {
                t.privilege = privilege;
            }
            let result = this.isTrackPlayable(t);
            t.playable = result.playable;
            t.reason = result.reason;
            return t;
        });
    },
};

export default auth;
