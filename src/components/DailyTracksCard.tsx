import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { dailyTracksStore, updateDailyTracks } from "@/store/coreSlice";
import { debounce, sample } from "lodash";
import styles from "./DailyTracksCard.module.scss";
import SvgIcon from "./SvgIcon";
import auth from "@/utils/auth";
import { player } from "@/business/player";
import { storeData } from "@/utils";
import { dailyRecommendTracks } from "@/api/playlist";

const defaultCovers = [
    "https://p2.music.126.net/0-Ybpa8FrDfRgKYCTJD8Xg==/109951164796696795.jpg",
    "https://p2.music.126.net/QxJA2mr4hhb9DZyucIOIQw==/109951165422200291.jpg",
    "https://p1.music.126.net/AhYP9TET8l-VSGOpWAKZXw==/109951165134386387.jpg",
];

const DailyTracksCard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const dailyTracks = useAppSelector(dailyTracksStore);

    useEffect(() => {
        loadDailyTracks();
    }, []);

    const loadDailyTracks = debounce(() => {
        if (!auth.isAccountLoggedIn()) return;
        dailyRecommendTracks()
            .then((result: any) => {
                dispatch(updateDailyTracks(result.data.dailySongs));
            })
            .catch(() => {});
    }, 500);

    const coverUrl = useMemo(() => {
        return `${
            dailyTracks && dailyTracks[0]?.al.picUrl || sample(defaultCovers)
        }?param=1024y1024`;
    }, [dailyTracks]);

    const goToDailyTracks = () => {
        navigate("/daily/songs");
    };

    const playDailyTracks = () => {
        if (!auth.isAccountLoggedIn()) {
            storeData.showToast(t("toast.needToLogin"));
            return;
        }
        let trackIds = dailyTracks.map((t) => t.id);
        player.replacePlaylist(trackIds, "/daily/songs", "url", dailyTracks[0].id);
    };

    return (
        <div className={styles.dailyRecommendCard} onClick={goToDailyTracks}>
            <img src={coverUrl} loading="lazy" />
            <div className="container">
                <div className="title-box">
                    <div className="title">
                        <span>每</span>
                        <span>日</span>
                        <span>推</span>
                        <span>荐</span>
                    </div>
                </div>
            </div>
            <button className="play-button" onClick={playDailyTracks}>
                <SvgIcon svgName="play" />
            </button>
        </div>
    );
};

export default DailyTracksCard;
