export interface PlayerInfo {
    progress: number,
    playing: boolean,
    volume: number,
    repeatMode: "off" | "on" | "one",
    shuffle: boolean,
    reversed: boolean,
    currentTrack: any,
    isPersonalFM: boolean,
    mute: boolean,
    enabled: boolean,
    trackAudioSource: string,
}

const eventNames = [
    "playing",
    "currentTrackId",
    "currentTrack",
    "currentAudioSource",
    "progress",
    "isPersonalFM",
    "repeatMode",
    "shuffle",
    "reversed",
    "progressForceRefresh",
    "volumeChange",
    "muteChange",
    "loading",
] as const;

export type PlayerEventName = (typeof eventNames)[number];

export class PlayerObserver {
    private _name: string;
    private _listeners: Record<PlayerEventName, Set<Function>>;

    constructor(name: string) {
        this._name = name;
        this._listeners = {
            "playing": new Set(),
            "currentTrackId": new Set(),
            "currentTrack": new Set(),
            "currentAudioSource": new Set(),
            "progress": new Set(),
            "isPersonalFM": new Set(),
            "repeatMode": new Set(),
            "shuffle": new Set(),
            "reversed": new Set(),
            "progressForceRefresh": new Set(),
            "volumeChange": new Set(),
            "muteChange": new Set(),
            "loading": new Set(),
        };
    }

    on(eventName: PlayerEventName, listener: Function) {
        this._listeners[eventName].add(listener);
    }

    emit(eventName: PlayerEventName, ...args: any[]) {
        this._listeners[eventName].forEach((listener) => {
            listener(...args);
        });
    }

    get name() {
        return this._name;
    }
}

// 播放器专题
export interface PlayerSubject {
    // 注册播放器观察者
    registerObserver(observer: PlayerObserver): void;
    // 移除播放器观察者
    removeObserver(observer: PlayerObserver): void;
    // 播放器通知观察者
    notifyObservers(eventName: PlayerEventName): void;
}