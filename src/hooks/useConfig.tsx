import { useCallback, useEffect } from 'react';
import { useGetState } from './useGetState';
import { store, StoreObserver, StoreEventName } from "../utils/store";
import { debounce } from 'lodash';

interface ConfigOptions {
    page: string; // 可选属性
    sync?: boolean; // 可选属性
}
export const useConfig = (key: StoreEventName, defaultValue: any, options: ConfigOptions) => {
    const [property, setPropertyState, getProperty] = useGetState(defaultValue);
    const { sync = true } = options;
    const storeObserver = new StoreObserver(options.page);

    // 同步到Store (State -> Store)
    const syncToStore = useCallback(
        debounce((v) => {
            store.set(key, v);
        }),
        []
    );

    // 同步到State (Store -> State)
    const syncToState = useCallback((v: any) => {
        if (v !== null) {
            setPropertyState(v);
        } else {
            store.get(key).then((v) => {
                if (v === null) {
                    setPropertyState(defaultValue);
                    store.set(key, defaultValue);
                    store.save();
                } else {
                    setPropertyState(v);
                }
            });
        }
    }, []);

    const setProperty = useCallback((v: any, forceSync = false) => {
        setPropertyState(v);
        const isSync = forceSync || sync;
        isSync && syncToStore(v);
    }, []);

    // 初始化
    useEffect(() => {
        syncToState(null);
        store.registerObserver(storeObserver);
        storeObserver.on(key, (v: any) => {
            setProperty(v);
        });
        if (key.includes("[")) return;
        return () => {
            store.removeObserver(storeObserver);
        };
    }, []);

    return [property, setProperty, getProperty];
};
