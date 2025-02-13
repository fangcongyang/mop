import { useCallback, useEffect } from 'react';
import { useGetState } from './useGetState';
import { store, StoreObserver, StoreEventName } from "../utils/store";
import { debounce } from 'lodash';
import { generateUUID } from '@/utils/common';

export const useConfig = (key: StoreEventName, defaultValue: any, options={sync: true}) => {
    const [property, setPropertyState, getProperty] = useGetState(defaultValue);
    const { sync = true } = options;
    const storeObserver = new StoreObserver(generateUUID());

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
                if (v === null || v === undefined) {
                    setPropertyState(defaultValue);
                    store.set(key, defaultValue);
                    store.save();
                } else {
                    setPropertyState(v);
                }
            });
        }
    }, []);

    const setProperty = useCallback((v: any) => {
        setPropertyState(v);
        // const isSync = forceSync || sync;
        sync && syncToStore(v);
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
