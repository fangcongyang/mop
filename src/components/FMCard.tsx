import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { player } from "@/business/player";
import SvgIcon from "./SvgIcon";
import _ from "lodash";
import { resizeImage } from "@/utils/data";
import ArtistsInLine from "./ArtistsInLine";
import ButtonIcon from "./ButtonIcon";
import styles from "./FMCard.module.scss";
import { backgroundColor } from "@/utils/common";

const FMCard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [background, setBackground] = useState('');

    useEffect(() => {
        getColor();
    }, [player.personalFMTrack])

    const nextTrackCover = useMemo(() => {
        return `${player.personalFMNextTrack?.album?.picUrl.replace(
            'http://',
            'https://'
        )}?param=512y512`;
    }, [player.personalFMNextTrack])

    const track = useMemo(() => {
        return player.personalFMTrack;
    }, [player.personalFMTrack])

    const artists = useMemo(() => {
        return track.artists || track.ar || [];
    }, [track])

    const isPlaying = useMemo(() => {
        return player.playing && player.isPersonalFM;
    }, [player.playing, player.isPersonalFM])

    const getColor = () => {
        if (!player.personalFMTrack?.album?.picUrl) return;
        const cover = `${player.personalFMTrack.album.picUrl.replace(
            'http://',
            'https://'
        )}?param=512y512`;
        backgroundColor(cover, (backgroundColor: string) => {
            setBackground(backgroundColor);
        })
    }

    const goToAlbum = () => {
        if (track.album.id === 0) return;
        navigate('/album/' + track.album.id);
    }

    const moveToFMTrash = () => {
        player.moveToFMTrash();
    }
    
    const play = () => {
        player.playPersonalFM();
    }
      
    const next = () => {
        player.playNextFMTrack();
    }

    return (
        <div className={styles.fm} style={{ background }} data-theme="dark">
            <img src={nextTrackCover} style={{ display: "none" }} loading="lazy" />
            <img
                className="cover"
                src={track.album && track.album.picUrl ? resizeImage(track.album.picUrl, 512) : ""}
                loading="lazy"
                onClick={goToAlbum}
            />
            <div className={styles.rightRart}>
                <div className="info">
                    <div className="title">{track.name}</div>
                    <div className="artist">
                        <ArtistsInLine artists={artists} />
                    </div>
                </div>
                <div className="controls">
                    <div className="buttons">
                        <ButtonIcon title="不喜欢" onClick={moveToFMTrash}>
                            <SvgIcon svgName="thumbs-down" />
                        </ButtonIcon>
                        <ButtonIcon
                            title={t(isPlaying ? 'player.pause' : 'player.play')}
                            className="play"
                            onClick={play}
                        >
                            <SvgIcon svgName={isPlaying ? 'pause' : 'play'} />
                        </ButtonIcon>
                        <ButtonIcon title={t('player.next')} onClick={next}>
                            <SvgIcon svgName="next" />
                        </ButtonIcon>
                    </div>
                    <div className="card-name">
                        <SvgIcon svgName="fm" />私人FM
                    </div>
                </div>
            </div>
        </div >
    )
}

export default FMCard;