import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { resizeImage } from "@/utils/data";
import MvRow from "@/components/MvRow";
import ButtonTwoTone from "@/components/ButtonTwoTone";
import { artistMv, getArtist } from "@/api/artist";
import NProgress from 'nprogress';
import _ from "lodash";
import "./ArtistMv.scss";

const ArtistMv = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [artist, setArtist] = useState<any>({});
    const [mvs, setMvs] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        loadData();
    }, [id])

    const loadData = _.debounce(() => {
        NProgress.start();
        getArtist(id!).then((data: any) => {
          setArtist(data.artist);
        });
        loadMVs();
    }, 500)

    const loadMVs = () => {
        artistMv({ id: id, limit: 100, offset: mvs.length }).then(
            (data: any) => {
                setMvs(mvs.concat(data.mvs));
                setHasMore(data.hasMore);
                NProgress.done();
            }
        );
    }

    return (
        <div className="artist-mv">
            <h1>
                <img
                    className="avatar"
                    src={resizeImage(artist.img1v1Url, 1024)}
                    loading="lazy"
                />
                {artist.name}'s Music Videos
            </h1>
            <MvRow mvs={mvs} subtitle="publishTime" />
            <div className="load-more">
                <ButtonTwoTone
                    className={hasMore ? "" : "hidden"}
                    color="grey"
                    onClick={loadMVs}>
                    {t('common.loadMore')}
                </ButtonTwoTone>
            </div>
        </div>
    )
}

export default ArtistMv;
