import messageEventEmitter from "@/event/messageEventEmitter";
import { setToast } from "@/store/coreSlice";
import { Store } from "@reduxjs/toolkit";
import i18next from "i18next";
import { store } from "@/utils/store";

interface StoreData {
    store: Store | null;
    getBr(): Promise<string>;
    showToast(text: string): void;
}

const storeData: StoreData = {
    store: null,

    async getBr() {
        let quality = await store.get("musicQuality")
        quality = quality ?? '320000';
        return quality === 'flac' ? '350000' : quality;
    },

    showToast(text: string) {
        let timer = this.store?.getState().core.toast.timer;
        if (timer !== null) {
            clearTimeout(timer);
            this.store?.dispatch(
                setToast({
                    show: false,
                    text: "",
                    timer: null,
                })
            );
        }
        this.store?.dispatch(
            setToast({
                show: true,
                text: text,
                timer: setTimeout(() => {
                    this.store?.dispatch(
                        setToast({
                            show: false,
                            text: text,
                            timer: null,
                        })
                    );
                }, 3200),
            })
        );
    }
}

messageEventEmitter.on("MESSAGE:INFO", (text: string) => {
    storeData.showToast(text);
})

async function bytesToSize(bytes: number) {
    let marker = 1024; // Change to 1000 if required
    let decimal = 2; // Change as required
    let kiloBytes = marker;
    let megaBytes = marker * marker;
    let gigaBytes = marker * marker * marker;

    let lang = await store.get("lang");

    if (bytes < kiloBytes) return bytes + (lang === "en" ? " Bytes" : "字节");
    else if (bytes < megaBytes)
        return (bytes / kiloBytes).toFixed(decimal) + " KB";
    else if (bytes < gigaBytes)
        return (bytes / megaBytes).toFixed(decimal) + " MB";
    else return (bytes / gigaBytes).toFixed(decimal) + " GB";
}

function changeLanguage(lang: string) {
    i18next.changeLanguage(lang, (err, _) => {
        if (err) return console.log("something went wrong loading", err);
    });
}

function showToast(text: string) { 
    storeData.showToast(text);
}

export { storeData, bytesToSize, changeLanguage, showToast };