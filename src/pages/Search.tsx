import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import CoverRow from "@/components/CoverRow";
import TrackList from "@/components/TrackList";
import MvRow from "@/components/MvRow";
import SvgIcon from "@/components/SvgIcon";
import NProgress from 'nprogress';
import { search } from "@/api/other";
import { showToast } from "@/utils";
import { getTrackDetail } from "@/api/track";
import "./Search.scss";
import _ from "lodash";

const Search = () => {
    const { t } = useTranslation();
    const {keywords} = useParams();
    const [searchParams] = useSearchParams();
    const [artists, setArtists] = useState<any[]>([]);
    const [albums, setAlbums] = useState<any[]>([]);
    const [tracks, setTracks] = useState<any[]>([]);
    const [musicVideos, setMusicVideos] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);

    const searchKeywords = useMemo(() => {
        return searchParams.get('keywords') ?? keywords;
    }, [searchParams]);

    useEffect(() => {
        getData();
    }, [searchParams])

    const getData = _.debounce(() => {
        console.log(searchKeywords)
        if (!searchKeywords) return;
        NProgress.start();
        const requestAll = (requests: Promise<{ result: any; type: string; }>[]) => {
            const localKeywords = searchKeywords;
            Promise.all(requests).then(results => {
                if (localKeywords != searchKeywords) return;
                results.map(result => {
                    const searchType = result.type;
                    if (result.result === undefined) return;
                    let newResult = result.result;
                    switch (searchType) {
                        case 'all':
                            newResult = result;
                            break;
                        case 'musicVideos':
                            setMusicVideos(newResult.mvs ?? []);
                            break;
                        case 'artists':
                            setArtists(newResult.artists ?? []);
                            break;
                        case 'albums':
                            setAlbums(newResult.albums ?? []);
                            break;
                        case 'tracks':
                            getTracksDetail(newResult.songs ?? []);
                            break;
                        case 'playlists':
                            setPlaylists(newResult.playlists ?? []);
                            break;
                    }
                });
                NProgress.done();
            });
        };
        const requests = [
            onSearch('artists'),
            onSearch('albums'),
            onSearch('tracks'),
        ];
        const requests2 = [onSearch('musicVideos'), onSearch('playlists')];
        requestAll(requests);
        requestAll(requests2);
    }, 500)

    const onSearch = (type = 'all') => {
        const typeTable: any = {
            all: 1018,
            musicVideos: 1004,
            tracks: 1,
            albums: 10,
            artists: 100,
            playlists: 1000,
        };
        return search({
            keywords: searchKeywords,
            type: typeTable[type],
            limit: 16,
        }).then((result: any) => {
            return { result: result.result, type };
        }).catch((err: any) => {
            showToast(err.response ?
                (err.response.data.msg || err.response.data.message) : err);
            return { result: [], type };
        })
    }

    const haveResult = useMemo(() => {
        return (
            tracks.length +
            artists.length +
            albums.length +
            playlists.length +
            musicVideos.length >
            0
        );
    }, [tracks, artists, albums, playlists, musicVideos]);

    const getTracksDetail = (tracks: any) => {
        const trackIDs = tracks.map((t: any) => t.id);
        if (trackIDs.length === 0) return;
        getTrackDetail(trackIDs.join(',')).then(result => {
            setTracks(result.songs);
        });
    }

    return (
        <div className="search-page">
            <div className={artists.length > 0 || albums.length > 0 ? 'row' : 'row hidden'}>
                <div className={artists.length > 0 ? 'artists' : 'artists hidden'}>
                    <div className="section-title">
                        {t('common.artist')}
                        <Link to={`/search/${searchKeywords}/artists`}>
                            {t('home.seeMore')}
                        </Link>
                    </div>
                    <CoverRow
                        type="artist"
                        columnNumber={3}
                        items={artists.slice(0, 3)}
                        gap="34px 24px"
                    />
                </div>
                <div className="albums">
                    <div className={albums.length > 0 ? 'section-title' : 'section-title hidden'}>
                        {t('common.album')}
                        <Link to={`/search/${searchKeywords}/albums`}>
                            {t('home.seeMore')}
                        </Link>
                    </div>
                    <CoverRow
                        type="album"
                        items={albums.slice(0, 3)}
                        subText="artist"
                        columnNumber={3}
                        subTextFontSize="14px"
                        gap="34px 24px"
                        playButtonSize={26}
                    />
                </div>
            </div>
            <div className={tracks.length > 0 ? 'tracks' : 'tracks hidden'}>
                <div className="section-title">
                    {t('search.song')}
                    <Link to={`/search/${searchKeywords}/tracks`}>
                        {t('home.seeMore')}
                    </Link>
                </div>
                <TrackList tracks={tracks} />
            </div>
            <div className={musicVideos.length > 0 ? 'music-videos' : 'music-videos hidden'}>
                <div className="section-title">
                    {t('search.mv')}
                    <Link to={`/search/${searchKeywords}/music-videos`}>
                        {t('home.seeMore')}
                    </Link>
                </div>
                <MvRow mvs={musicVideos.slice(0, 5)} />
            </div>
            <div className={playlists.length > 0 ? 'playlists' : 'playlists hidden'}>
                <div className="section-title">
                    {t('search.playlist')}
                    <Link to={`/search/${searchKeywords}/playlists`}>
                        {t('home.seeMore')}
                    </Link>
                </div>
                <CoverRow
                    type="playlist"
                    items={playlists.slice(0, 12)}
                    subText="title"
                    columnNumber={5}
                    subTextFontSize="14px"
                    gap="34px 24px"
                    playButtonSize={26}
                />
            </div>
            <div className={!haveResult ? 'no-results' : 'no-results hidden'}>
                <div>
                    <SvgIcon svgName="search" />
                    {searchKeywords!.length === 0 ? '输入关键字搜索' : t('search.noResult')}
                </div>
            </div>
        </div>
    )
}

export default Search;