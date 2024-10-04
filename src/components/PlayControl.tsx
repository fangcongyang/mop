import { FC, MouseEvent } from "react";
import { player } from "@/business/player";
import ButtonIcon from "@/components/ButtonIcon";
import SvgIcon from "@/components/SvgIcon";

interface PlayControlProps {
    playing: boolean; // 播放状态
    className?: string;
}

const PlayControl: FC<PlayControlProps> = ({
    playing= false,
    className= '',
}) => {

    const clickStop = (e: MouseEvent) => {
        e.preventDefault();
        return e;
    }

    const moveToFMTrash = () => {
        player.moveToFMTrash();
    }

    const playPrevTrack = () => {
        player.playPrevTrack();
    }

    const playOrPause = () => { 
        player.playOrPause();
    }

    const playNextTrack = () => {
        player.playNextTrack();
    }

    return (
        <div className={className} onClick={clickStop}>
            {player.isPersonalFM ?
                <ButtonIcon
                    onClick={moveToFMTrash}
                >
                    <SvgIcon svgName="thumbs-down" svgTitle="不喜欢" />
                </ButtonIcon>
                :
                <ButtonIcon
                    onClick={playPrevTrack}
                >
                    <SvgIcon svgName="previous" svgTitle="上一首" />
                </ButtonIcon>
            }
            <ButtonIcon
                className="play"
                onClick={playOrPause}
            >
                <SvgIcon svgTitle={playing ? '播放' : '暂停'} svgName={playing ? 'pause' : 'play'} />
            </ButtonIcon>
            <ButtonIcon title="下一首" onClick={playNextTrack}>
                <SvgIcon svgName="next" />
            </ButtonIcon>
        </div>
    )
}

export default PlayControl;