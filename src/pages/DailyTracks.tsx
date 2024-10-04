import { FunctionComponent, RefObject, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useTranslation } from 'react-i18next';
import NProgress from 'nprogress';
import _ from "lodash";
import TrackList from "@/components/TrackList";
import { dailyTracksStore, updateDailyTracks } from "@/store/coreSlice";
import { dailyRecommendTracks } from "@/api/playlist";
import "./DailyTracks.scss";

interface DailyTracksProps {
    parentRef: RefObject<HTMLDivElement>,
}

const DailyTracks: FunctionComponent<DailyTracksProps> = (props) => {
    const dailyTracks = useAppSelector(dailyTracksStore);
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    useEffect(() => {
        loadData();
    }, [dailyTracks])

    const loadData = _.debounce(() => {
        if (dailyTracks.length === 0) {
            NProgress.start();
            loadDailyTracks();
        }
        props.parentRef.current!.scrollTo(0, 0);
    }, 500)

    const loadDailyTracks = () => {
        dailyRecommendTracks().then((result: any) => {
            dispatch(updateDailyTracks(result.data.dailySongs));
            NProgress.done();
        });
    }

    return (
        <div className="daily-tracks">
            <div className="special-playlist">
                <div className="title gradient"> {t('dailyTracks.dailySongRecommendations')} </div>
                <div className="subtitle">{t('dailyTracks.generatedBasedOnYourMusicalTastes')} · {t('dailyTracks.updatedDaily')}</div>
            </div>
            <TrackList
                tracks={dailyTracks}
                type="playlist"
                dbclickTrackFunc="dailyTracks"
            />
        </div>
    )
}

export default DailyTracks;
