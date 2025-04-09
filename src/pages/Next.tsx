import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'
import { player } from "@/business/player";
import TrackList from '@/components/TrackList';
import styles from './Next.module.scss';
import _ from 'lodash';
import { getTrackDetail } from '@/api/track';
import { PlayerObserver } from '@/type/player';

const Next = () => {
    const { t } = useTranslation();
    const [tracks, setTracks] = useState<any>([]);
    const [shuffle, setShuffle] = useState(player.shuffle);
    const [currentTrack, setCurrentTrack] = useState<any>(player.currentTrack);
    const [playNextTracks, setPlayNextTracks] = useState<any>([]);
    const [playTrackList, setPlayTrackList] = useState<any>([]);
    const nextPlayerObserver = new PlayerObserver("next");

    useEffect(() => {
        nextPlayerObserver.on("currentTrack", () => {
            setCurrentTrack(player.currentTrack);
            loadTracks();
        })
        nextPlayerObserver.on("shuffle", () => {
            loadTracks();
        })
        player.registerObserver(nextPlayerObserver);
        loadTracks();
        return () => {
            player.removeObserver(nextPlayerObserver);
        }
    }, [])

    useCallback(() => {
        loadTracks();
    }, [currentTrack, player.playNextList])

    const loadTracks = _.debounce(() => {
        let localTracks = tracks;
        if (shuffle !== player.shuffle) {
            setShuffle(player.shuffle);
            localTracks = [];
        }

        // 获取播放列表当前歌曲后100首歌
        let trackIds = player.list.slice(
            player.current + 1,
            player.current + 100
        );

        // 将playNextList的歌曲加进trackIDs
        trackIds.push(...player.playNextList);

        // 获取已经加载了的歌曲
        let loadedTrackIDs = localTracks.map((t: any) => t.id);

        if (trackIds.length > 0) {
            getTrackDetail(trackIds.join(',')).then(data => {
                let newTracks: any[] = data.songs.filter(
                    (t: any) => !loadedTrackIDs.includes(t.id)
                );
                newTracks = localTracks.concat(newTracks);
                setPlayNextTracks(player.playNextList.map(tid => {
                    return newTracks.find((t: any) => t.id === tid);
                }));
                setPlayTrackList(trackIds.map(tid => {
                    return newTracks.find((t: any) => t.id === tid)
                }));
                setTracks(newTracks);
            });
        } else {
            setPlayNextTracks(player.playNextList.map(tid => {
                return localTracks.find((t: any) => t.id === tid);
            }));
            setPlayTrackList(localTracks.filter((t: any) => trackIds.includes(t.id)));
        }
    }, 500)

    return (
        <div className={styles.nextTracks}>
            <h1>{t('next.nowPlaying')}</h1>
            <TrackList
                tracks={[currentTrack]}
                type="playlist"
                dbClickTrackFunc="none"
            />
            {
                playNextTracks.length > 0 ?
                    <div>
                        <h1>插队播放
                            <button onClick={() => player.clearPlayNextList()}>清除队列</button>
                        </h1>
                        <TrackList
                            tracks={playNextTracks}
                            type="playlist"
                            highlightPlayingTrack={false}
                            dbClickTrackFunc="playTrackOnListByID"
                            itemKey="id+index"
                            extraContextMenuItem={['removeTrackFromQueue']}
                        />
                    </div>
                    : ''
            }
            <h1>{t('next.nextUp')}</h1>
            <TrackList
                tracks={playTrackList}
                type="playlist"
                highlightPlayingTrack={false}
                dbClickTrackFunc="playTrackOnListByID"
            />
        </div >
    )
}

export default Next;