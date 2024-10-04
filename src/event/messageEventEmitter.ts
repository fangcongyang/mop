const eventNames = ["MESSAGE:INFO"] as const;

type EventName = typeof eventNames[number];

class MessageEventEmitter {
    private listeners: Record<EventName, Set<Function>> = {
        "MESSAGE:INFO": new Set(),
    };

    on(eventName: EventName, listener: Function) {
        this.listeners[eventName].add(listener);
    }

    emit(eventName: EventName, ...args: any[]) {
        this.listeners[eventName].forEach(listener => {
            listener(...args);
        });
    }
}

export default new MessageEventEmitter();