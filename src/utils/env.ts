import { type } from "@tauri-apps/plugin-os";
import { getVersion } from '@tauri-apps/api/app';
import { initStore } from "./store";
import { changeLanguage } from ".";

export let osType = '';
export let osDetailType = '';
export let appVersion = '';

function initOsType() {
    try {
        let ot = type();
        osDetailType = ot;
        let newOsType;
        switch (ot) {
            case 'linux':
            case 'windows':
            case 'macos':
                newOsType = "desktop";
                break;
            case 'android':
            case 'ios':
                newOsType = "mobile";
                break;
            default:
                newOsType = "desktop";
                break;
        }
        osType = newOsType;
    } catch (e) {
        let isMobile = window.matchMedia("screen and (max-width: 760px) and (orientation : portrait)").matches;
        if (!isMobile) {
            isMobile = window.matchMedia("screen and (max-width: 1000px) and (orientation : landscape)").matches;
        }
        if (isMobile) {
            osType = "webMobile";
        } else {
            osType = "web";
        }
    }
    return osType;
}

async function initAppVersion() {
    getVersion().then((v) => {
        appVersion = v;
    }).catch(() => {
        appVersion = import.meta.env.VITE_MOP_VERSION;
    })
}

export function initEnv() {
    return new Promise<void>((resolve, _reject) => {
        initOsType();
        initAppVersion();
        initStore(osType).then(async (store) => {
            let lang = await store.get("lang");
            changeLanguage(lang || "en");
            resolve();
        });
    })
}