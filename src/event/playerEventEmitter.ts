const eventNames = [
    "PLAYER:UPDATE_TITLE",
    "PLAYER:TRACK_GET_COMPLETE",
    "PLAYER:REPLACE_PLAYLIST",
    "PLAYER:PALY_PLAYLIST",
    "PLAYER:PLAY_ARTIST",
    "PLAYER:PLAY_ALBUM",
    "PLAYER:PLAY_INTELLIGENCELIST",
] as const;

type EventName = (typeof eventNames)[number];

class PlayerEventEmitter {
    private listeners: Record<EventName, Set<Function>> = {
        "PLAYER:UPDATE_TITLE": new Set(),
        "PLAYER:TRACK_GET_COMPLETE": new Set(),
        "PLAYER:REPLACE_PLAYLIST": new Set(),
        "PLAYER:PALY_PLAYLIST": new Set(),
        "PLAYER:PLAY_ARTIST": new Set(),
        "PLAYER:PLAY_ALBUM": new Set(),
        "PLAYER:PLAY_INTELLIGENCELIST": new Set(),
    };

    on(eventName: EventName, listener: Function) {
        this.listeners[eventName].add(listener);
    }

    emit(eventName: EventName, ...args: any[]) {
        this.listeners[eventName].forEach((listener) => {
            listener(...args);
        });
    }
}

export default new PlayerEventEmitter();
