import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import CoverRow from "@/components/CoverRow";
import TrackList from "@/components/TrackList";
import MvRow from "@/components/MvRow";
import ButtonTwoTone from "@/components/ButtonTwoTone";
import { search } from "@/api/other";
import { getTrackDetail } from "@/api/track";
import _ from "lodash";

const SearchType = () => {
    const { t } = useTranslation();
    const {keywords, type} = useParams();
    const [result, setResult] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(false);

    // const keywords = useMemo(() => {
    //     return searchParams.get('keywords') ?? '';
    // }, [searchParams]);

    // const type = useMemo(() => {
    //     return searchParams.get('type') ?? '';
    // }, [searchParams]);

    useEffect(() => {
        fetchData();
    }, [type, keywords])

    const typeNameTable: any = useMemo(() => {
        return {
            musicVideos: t('search.mv'),
            tracks: t('search.song'),
            albums: t('common.album'),
            artists: t('common.artist'),
            playlists: t('search.playlist'),
        };
    }, [])

    const fetchData = _.debounce(async () => {
        const typeTable: any = {
            musicVideos: 1004,
            tracks: 1,
            albums: 10,
            artists: 100,
            playlists: 1000,
        };
        let newResult: any = await search({
            keywords: keywords,
            type: typeTable[type!],
            offset: result.length,
        });
        newResult = newResult.result;
        setHasMore(newResult.hasMore ?? true);
        switch (type) {
            case 'musicVideos':
                setResult(result.concat(newResult.mvs));
                if (newResult.mvCount <= result.length) {
                    setHasMore(false);
                }
                break;
            case 'artists':
                setResult(result.concat(newResult.artists));
                break;
            case 'albums':
                setResult(result.concat(newResult.albums));
                if (newResult.albumCount <= result.length) {
                    setHasMore(false);
                }
                break;
            case 'tracks':
                getTracksDetail(result.concat(newResult.songs));
                break;
            case 'playlists':
                setResult(result.concat(newResult.playlists));
                break;
        }
    }, 500)

    const getTracksDetail = (result: any) => {
        const trackIds = result.map((t: any) => t.id);
        if (trackIds.length === 0) return;
        getTrackDetail(trackIds.join(',')).then(result => {
            setResult(result.songs);
        });
    }

    return (
        <div className="search">
            <h1>
                <span>{t('search.searchFor')} {typeNameTable[type!]}</span>
                "{keywords}"
            </h1>
            {
                type === 'artists' ?
                    <div>
                        <CoverRow
                            type="artist"
                            items={result}
                            columnNumber={6}
                        />
                    </div>
                    : ''
            }
            {
                type === 'albums' ?
                    <div>
                        <CoverRow
                            type="album"
                            items={result}
                            subText="artist"
                            subTextFontSize="14px"
                        />
                    </div>
                    : ''
            }
            {
                type === 'tracks' ?
                    <div>
                        <TrackList
                            tracks={result}
                            type="playlist"
                            dbClickTrackFunc="playAList"
                        />
                    </div>
                    : ''
            }
            {
                type === 'musicVideos' ?
                    <div>
                        <MvRow mvs={result} />
                    </div>
                    : ''
            }
            {
                type === 'playlists' ?
                    <div>
                        <CoverRow
                            type="playlist"
                            items={result}
                            subText="title"
                        />
                    </div>
                    : ''
            }
            <div className="load-more">
                <ButtonTwoTone
                    className={hasMore ? '' : 'hidden'}
                    color="grey"
                    onClick={() => fetchData()}>
                    {t('common.loadMore')}
                </ButtonTwoTone>
            </div>
        </div>
    )
}

export default SearchType;