import { Store, createStore } from "@tauri-apps/plugin-store";
import { appConfigDir, join } from "@tauri-apps/api/path";

const eventNames = ["lang", "automaticallyCacheSongs", "shortcutList", "excludeR18Classes", "r18ClassFilter", 
    "downloadSavePath", "proxyProtocol", "proxyServer", "proxyPort"] as const;

export type StoreEventName = typeof eventNames[number];

export class StoreObserver {
    private _name: string;
    private _listeners: Record<StoreEventName, Set<Function>>;

    constructor(name: string) {
        this._name = name;
        this._listeners = {
            "lang": new Set(),
            "automaticallyCacheSongs": new Set(),
            "shortcutList": new Set(),
            "excludeR18Classes": new Set(),
            "r18ClassFilter": new Set(),
            "downloadSavePath": new Set(),
            "proxyProtocol": new Set(),
            "proxyServer": new Set(),
            "proxyPort": new Set(),
        };
    }

    on(eventName: StoreEventName, listener: Function) {
        this._listeners[eventName].add(listener);
    }

    emit(eventName: StoreEventName, ...args: any[]) {
        this._listeners[eventName].forEach((listener) => {
            listener(...args);
        });
    }

    get name() {
        return this._name;
    }
}

// 播放器专题
export interface StoreSubject {
    // 注册播放器观察者
    registerObserver(observer: StoreObserver): void;
    // 移除播放器观察者
    removeObserver(observer: StoreObserver): void;
    // 播放器通知观察者
    notifyObservers(eventName: StoreEventName, ...args: any[]): void;
}

interface DataStore extends StoreSubject {
    _store?: any;
    _observers: Set<StoreObserver>;
    _init(): Promise<void>;
    set(key: string, value: any): void;
    get(key: string): Promise<any>;
    save(): Promise<void>;
}

export class TauriDataStore implements DataStore {
    _store: Store | undefined;
    _observers: Set<StoreObserver>;

    constructor() {
        this._store = undefined;
        this._observers = new Set();
    }

    async _init() {
        const appConfigDirPath = await appConfigDir();
        const appConfigPath = await join(appConfigDirPath, "mop.json");
        this._store = await createStore(appConfigPath);
        await this._store?.load();
    }

    async set(key: string, value: any) {
        this._store?.set(key, value);
        this._store?.save();
    }

    async get(key: string): Promise<any> {
        return this._store?.get(key);
    }

    async save(): Promise<void> {
        await this._store?.save();
    }

    registerObserver(observer: StoreObserver): void {
        this._observers.add(observer);
    }
    
    removeObserver(observer: StoreObserver): void {
        this._observers.delete(observer);
    }

    notifyObservers(eventName: StoreEventName, ...args: any[]): void {
        this._observers.forEach((observer) => {
            observer.emit(eventName, args);
        });
    }
}

class LocalDataStore implements DataStore {
    _observers: Set<StoreObserver>;

    constructor() {
        this._observers = new Set();
    }
    _store?: any;

    _init(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    set(key: string, value: any) {
        localStorage.setItem(key, value);
    }

    get(key: string): Promise<any> {
        return new Promise((resolve) => {
            const value = localStorage.getItem(key);
            if (value) {
                resolve(value);
            } else {
                resolve(null);
            }
        })
    }

    save(): Promise<void> {
        return Promise.resolve();
    }

    registerObserver(observer: StoreObserver): void {
        this._observers.add(observer);
    }

    removeObserver(observer: StoreObserver): void {
        this._observers.delete(observer);
    }

    notifyObservers(eventName: StoreEventName, ...args: any[]): void {
        this._observers.forEach((observer) => {
            observer.emit(eventName, args);
        });
    }
}

export let store: DataStore = new LocalDataStore();

export async function initStore(osType: string) {
    if (osType.startsWith("web") || osType.startsWith("mobile")) {
        store = new LocalDataStore();
    } else {
        store = new TauriDataStore();
        await store._init();
    }
    return store;
}


