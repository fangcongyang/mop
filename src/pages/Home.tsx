import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from 'react-i18next';
import {
  settingsStore
} from "@/store/coreSlice"
import CoverRow from "@/components/CoverRow";
import styles from "./home.module.scss";
import { Link } from "react-router-dom";
import { getRecommendPlayList } from "@/utils/playList";
import _ from "lodash";
import DailyTracksCard from "@/components/DailyTracksCard";
import FMCard from "@/components/FMCard";
import { topListOfArtists } from "@/api/artist";
import { newAlbums } from "@/api/album";
import { toplists } from "@/api/playlist";
import { appleMusicData } from "@/static/homeData";
import NProgress from 'nprogress';
import { useConfig } from "@/hooks/useConfig";

const Home = () => {
  const { t } = useTranslation();
  const settings = useAppSelector(settingsStore);
  const [recommendPlaylist, setRecommendPlaylist] = useState<any>({ items: [] });
  const [recommendArtists, setRecommendArtists] = useState<any>({ items: [], indexList: [] });
  const [newReleasesAlbum, setNewReleasesAlbum] = useState<any>({ items: [] });
  const [topList, setTopList] = useState<any>({ items: [], ids: [19723756, 180106, 60198, 3812895, 60131], })
  const [musicLanguage] = useConfig("musicLanguage", "ALL");

  useEffect(() => {
    loadData();
    return () => {
      if (NProgress.isStarted()) NProgress.done();
    }
  }, [])

  const loadData = _.debounce(() => {
    NProgress.start();
    getRecommendPlayList(10, false).then((items: any) => {
      items && setRecommendPlaylist({ items });
      NProgress.done();
    });
    const topListOfArtistsAreaTable: any = {
      all: null,
      zh: 1,
      ea: 2,
      jp: 4,
      kr: 3,
    };
    topListOfArtists(
      topListOfArtistsAreaTable[musicLanguage ?? 'all']
    ).then((data: any) => {
      let indexList: any = [];
      while (indexList.length < 6) {
        let tmp = ~~(Math.random() * 100);
        if (!indexList.includes(tmp)) indexList.push(tmp);
      }
      setRecommendArtists({
        indexList,
        items: data?.list?.artists.filter((_l: any, index: number) =>
          indexList.includes(index)
        ) ?? []
      })
    });
    newAlbums({
      area: musicLanguage ?? 'ALL',
      limit: 10,
    }).then((data: any) => {
      setNewReleasesAlbum({
        items: data?.albums ?? []
      });
    });
    toplists().then((data: any) => {
      setTopList({
        items: data?.list.filter((l: any) =>
          topList.ids.includes(l.id)
        ) ?? [],
        ids: topList.ids
      })
    });
  }, 500)

  return (
    <div className={styles.home}>
      {
        settings.showPlaylistsByAppleMusic ?
          <div className={styles.indexRow + " " + styles.firstRow}>
            <div className={styles.title}> by Apple Music </div>
            <CoverRow type="playlist" items={appleMusicData} subText="appleMusic" />
          </div> : ''
      }

      <div className={styles.indexRow}>
        <div className={styles.title}>
          {t('home.recommendPlaylist')}
          <Link to="/explore" state={{category: "recommendPlaylists"}}>
            {t('home.seeMore')}
          </Link>
        </div>
        <CoverRow
          type="playlist"
          items={recommendPlaylist.items}
          sub-text="copywriter"
        />
      </div>

      <div className={styles.indexRow}>
        <div className={styles.title}> For You </div>
        <div className="for-you-row">
          <DailyTracksCard />
          <FMCard />
        </div>
      </div>

      <div className={styles.indexRow}>
        <div className={styles.title}>{t('home.recommendArtist')}</div>
        <CoverRow
          type="artist"
          columnNumber={6}
          items={recommendArtists.items}
        />
      </div>

      <div className={styles.indexRow}>
        <div className={styles.title}>
          {t('home.newAlbum')}
          <Link to="/new-album">{t('home.seeMore')}</Link>
        </div>
        <CoverRow
          type="album"
          items={newReleasesAlbum.items}
          subText="artist"
        />
      </div>

      <div className={styles.indexRow}>
        <div className={styles.title}>
          {t('home.rankingList')}
          <Link to="/explore" state={{category: "rankingList"}}>{
            t('home.seeMore')
          }</Link>
        </div>
        <CoverRow
          type="playlist"
          items={topList.items}
          subText="updateFrequency"
        />
      </div>
    </div>
  );
}

export default Home;
