import { useState, useEffect, useMemo, useRef, RefObject } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { settingsStore, togglePlaylistCategory } from "@/store/coreSlice";
import SvgIcon from "@/components/SvgIcon";
import { playlistCategories } from "@/utils/staticData";
import styles from "./Explore.module.scss";
import CoverRow from "@/components/CoverRow";
import _ from "lodash";
import { getRecommendPlayList } from "@/utils/playList";
import { highQualityPlaylist, topPlaylist, toplists } from "@/api/playlist";
import ButtonTwoTone from "@/components/ButtonTwoTone";
import ScrollTop from "@/components/ScrollTop";
import Fab from "@mui/material/Fab";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useGetState } from "@/hooks";

interface ExploreProps {
    parentRef: RefObject<HTMLDivElement>;
}

const Explore = (props: ExploreProps) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const location = useLocation();
    const settings = useAppSelector(settingsStore);
    const [activeCategory, setActiveCategory, getActiveCategory] = useGetState("");
    const [showCatOptions, setShowCatOptions] = useState(false);
    const [allBigCats] = useState([
        "language",
        "style",
        "scenes",
        "emotion",
        "theme",
    ]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const playlistsRef = useRef<any[]>([]);
    const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const newActiveCategory =
            location.state?.category === undefined
                ? "all"
                : location.state.category;
        if (activeCategory != newActiveCategory) {
            playlistsRef.current = [];
            goToCategory(newActiveCategory);
        }
    }, [location.state]);

    const init = _.debounce(() => {
        playlistsRef.current = [];
        setShowLoadMoreButton(false);
        setHasMore(true);
        getPlaylist();
    }, 500);

    const subText = useMemo(() => {
        if (activeCategory === "rankingList") return "updateFrequency";
        if (activeCategory === "recommendPlaylists") return "copywriter";
        return "none";
    }, [activeCategory]);

    const goToCategory = (category: string) => {
        setShowCatOptions(false);
        setActiveCategory(category);
        init();
    };

    const getCatsByBigCat = (name: string) => {
        return playlistCategories.filter((c) => c.bigCat === name);
    };

    const toggleCat = (code: string) => {
        dispatch(togglePlaylistCategory(code));
    };

    const getPlaylist = () => {
        let category = getActiveCategory();
        if (category === "recommendPlaylists") {
            return recommendPlayList();
        }
        if (category === "premiumPlaylist") {
            return getHighQualityPlaylist();
        }
        if (category === "rankingList") {
            return getTopLists();
        }
        return getTopPlayList();
    };

    const recommendPlayList = () => {
        getRecommendPlayList(100, true).then((list: any) => {
            playlistsRef.current = [];
            updatePlaylist(list);
            setHasMore(false);
        });
    };

    const getTopPlayList = () => {
        topPlaylist({
            cat: getActiveCategory(),
            offset: playlistsRef.current.length,
        }).then((data: any) => {
            updatePlaylist(data.playlists);
            setHasMore(data.more);
        });
    };

    const getHighQualityPlaylist = () => {
        let lasttime =
            playlistsRef.current.length !== 0
                ? playlistsRef.current[playlistsRef.current.length - 1]
                      .updateTime
                : 0;
        highQualityPlaylist({ limit: 50, lasttime }).then((data: any) => {
            updatePlaylist(data.playlists);
            setHasMore(data.more);
        });
    };

    const getTopLists = () => {
        toplists().then((data: any) => {
            playlistsRef.current = [];
            setHasMore(false);
            updatePlaylist(data.list);
        });
    };

    const updatePlaylist = (playlist: any) => {
        let newPlaylists = _.uniqBy(
            playlistsRef.current.concat(playlist),
            "id"
        );
        playlistsRef.current = newPlaylists;
        setPlaylists(newPlaylists);
        setShowLoadMoreButton(true);
    };

    return (
        <div className={styles.explorePage}>
            <h1>{t("explore.explore")}</h1>
            <div className="buttons">
                {settings.enabledPlaylistCategories.map((category: string) => {
                    return (
                        <div
                            key={category}
                            className={
                                category === activeCategory && !showCatOptions
                                    ? "button active"
                                    : "button"
                            }
                            onClick={() => goToCategory(category)}
                        >
                            {t("explore.category." + category)}
                        </div>
                    );
                })}
                <div
                    className={
                        showCatOptions ? "button more active" : "button more"
                    }
                    onClick={() => setShowCatOptions(!showCatOptions)}
                >
                    <SvgIcon svgName="more" />
                </div>
            </div>
            {showCatOptions ? (
                <div className={styles.panel}>
                    {allBigCats.map((bigCat) => {
                        return (
                            <div key={bigCat} className="big-cat">
                                <div className="name">
                                    {t("explore.bigCat." + bigCat)}
                                </div>
                                <div className="cats">
                                    {getCatsByBigCat(bigCat).map((cat) => {
                                        return (
                                            <div
                                                key={cat.name}
                                                className={
                                                    settings.enabledPlaylistCategories.includes(
                                                        cat.name
                                                    )
                                                        ? "cat active"
                                                        : "cat"
                                                }
                                                onClick={() =>
                                                    toggleCat(cat.code)
                                                }
                                            >
                                                <span>
                                                    {t(
                                                        "explore.category." +
                                                            cat.code
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                ""
            )}
            <div className="playlists">
                <CoverRow
                    type="playlist"
                    items={playlists}
                    subText={subText}
                    showPlayCount={
                        activeCategory !== "rankingList" ? true : false
                    }
                />
            </div>
            {["recommendPlaylists", "rankingList"].includes(activeCategory) ===
            false ? (
                <div className="load-more">
                    {showLoadMoreButton && hasMore ? (
                        <ButtonTwoTone
                            color="grey"
                            onClick={getPlaylist}
                            children={t("common.loadMore")}
                        ></ButtonTwoTone>
                    ) : (
                        ""
                    )}
                </div>
            ) : (
                ""
            )}

            {props.parentRef.current && (
                <ScrollTop parentRef={props.parentRef}>
                    <Fab size="small" aria-label="滚动到顶部">
                        <KeyboardArrowUpIcon />
                    </Fab>
                </ScrollTop>
            )}
        </div>
    );
};

export default Explore;
