import { useState, MouseEvent, FC, CSSProperties, useRef } from "react";
import {
    useNavigate
} from "react-router-dom";
import { CSSTransition } from 'react-transition-group';
import SvgIcon from './SvgIcon';
import { clickStop } from '@/utils/common';
import styles from './Cover.module.scss';
import playerEventEmitter from "@/event/playerEventEmitter";

type CoverProps = {
    id: number
    type: string
    imageUrl: string
    fixedSize?: number
    playButtonSize: number
    coverHover?: boolean
    alwaysShowShadow?: boolean
    clickCoverToPlay?: boolean
    onContextMenu?: React.MouseEventHandler<HTMLElement>,
};

const Cover: FC<CoverProps> = ({
    id,
    type,
    imageUrl,
    fixedSize= 0,
    playButtonSize= 22,
    coverHover= true,
    alwaysShowShadow,
    clickCoverToPlay= false,
    onContextMenu,
}) => {
    let navigate = useNavigate();
    const [focus, setFocus] = useState(false);
    const nodeRef = useRef(null);

    const playButtonStyles = () => {
        let pbs = playButtonSize + '%'
        let styles = {
            width: pbs,
            height: pbs
        };
        return styles;
    }

    const play = (event: MouseEvent) => {
        clickStop(event);
        const playActions: any = {
            album: "PLAYER:PLAY_ALBUM",
            playlist: "PLAYER:PALY_PLAYLIST",
            artist: "PLAYER:PLAY_ARTIST",
        };
        playerEventEmitter.emit(playActions[type], id);
    }

    const imageStyles = () => {
        let styles: CSSProperties = {};

        if (fixedSize !== 0) {
            let imgs = fixedSize + 'px'
            styles.width = imgs;
            styles.height = imgs;
        }
        if (type === 'artist') styles.borderRadius = '50%';
        return styles;
    }

    const shadowStyles = () => {
        let styles: CSSProperties = {};
        styles.backgroundImage = `url(${imageUrl})`;
        if (type === 'artist') styles.borderRadius = '50%';
        return styles;
    }

    const goTo = () => {
        return navigate(`/${type}/${id}`)
    }

    return (
        <div className={coverHover ? styles.cover + ' ' + styles.coverHover : styles.cover}
            onMouseOver={() => setFocus(true)}
            onMouseLeave={() => setFocus(false)}
            onClick={(e) => clickCoverToPlay ? play(e) : goTo()}
            onContextMenu={onContextMenu}
        >
            <div className={styles.coverContainer}>
                <div className={styles.shade}>
                    {
                        focus ?
                            <button className={styles.playButton} style={playButtonStyles()}
                                onClick={play}
                            >
                                <SvgIcon svgName="play" />
                            </button>
                            : ''
                    }
                </div>
                <img src={imageUrl} style={imageStyles()} loading="lazy" />
                {
                    focus ?
                        <CSSTransition nodeRef={nodeRef} in={coverHover || alwaysShowShadow} classNames="fade" timeout={800}>
                            {(_state) => (
                                <div ref={nodeRef} className="shadow" style={shadowStyles()}>
                                </div>
                            )}
                        </CSSTransition>
                        : ''
                }
            </div>
        </div>
    );
}

export default Cover;