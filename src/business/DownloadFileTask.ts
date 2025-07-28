import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface DownloadTaskInfo {
    event_id: string;
    download_url: string;
    file_path: string;
}

export interface DownloadInfo {
    status: string;
    progress?: number;
    speed?: number;
    content_length?: number;
}

const eventNames = [
    "begin",
    "progress",
    "end",
    "error",
] as const;

type EventName = (typeof eventNames)[number];

export class DownloadFileTask {
    private downloadTaskInfo: DownloadTaskInfo;
    private unlisten?: UnlistenFn;
    private events: Record<EventName, Set<Function>> = {
        "begin": new Set(),
        "progress": new Set(),
        "end": new Set(),
        "error": new Set(),
    };

    constructor(downloadTaskInfo: DownloadTaskInfo) {
        this.downloadTaskInfo = downloadTaskInfo;
        this.initEventListen();
    }
    startDownload() {
        invoke('download_file_task', { downloadTaskInfo: this.downloadTaskInfo });
    }

    async initEventListen() {
        this.unlisten = await listen<DownloadInfo>(this.downloadTaskInfo.event_id, (event) => {
            const eventName = event.payload.status as EventName;
            switch (eventName) {
                case "begin":
                    this.events[eventName].forEach((fn) => fn(event.payload));
                    break;
                case "progress":
                    this.events[eventName].forEach((fn) => fn(event.payload));
                    break;
                case "end":
                case "error":
                    this.events[eventName].forEach((fn) => fn(event.payload));
                    this.unlisten!()
                    break;
            }
        })
    }

    on(eventName: EventName, listener: Function) {
        this.events[eventName].add(listener);
    }

    getDownloadTaskInfo() {
        return this.downloadTaskInfo;
    }
}