import { FC, memo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Transition } from "react-transition-group";
import { player } from "@/business/player";
import _ from "lodash";
import './MvRow.scss';

type MvRowItemProps = {
    mvId: string
    mv: any
    subtitle?: string
};

const MvRowItem: FC<MvRowItemProps> = memo((props) => {
    const nodeRef = useRef(null);
    const [mv] = useState<any>(props.mv);
    const [hoverVideo, setHoverVideo] = useState(false);
    const navigate = useNavigate();

    const getTitle = (mv: any) => {
        if (mv.name !== undefined) return mv.name;
        if (mv.title !== undefined) return mv.title;
    }

    const getSubtitle = (mv: any) => {
        if (props.subtitle === 'artist') {
            let artistName = 'null';
            let artistId = 0;
            if (mv.artistName !== undefined) {
                artistName = mv.artistName;
                artistId = mv.artistId;
            } else if (mv.creator !== undefined) {
                artistName = mv.creator[0].userName;
                artistId = mv.creator[0].userId;
            }
            return `<a href="/#/artist/${artistId}">${artistName}</a>`;
        } else if (props.subtitle === 'publishTime') {
            return mv.publishTime;
        }
    }

    const goToMv = (id: string) => {
        let query = { autoplay: player.playing };
        navigate('/mv/' + id, { state: query });
    }

    const getUrl = (mv: any) => {
        let url = mv.imgurl16v9 ?? mv.cover ?? mv.coverUrl ?? '';
        return url.replace(/^http:/, 'https:') + '?param=464y260';
    }

    return (
        <div className="mv">
            <div className="cover"
                onMouseOver={() => setHoverVideo(true)}
                onMouseLeave={() => setHoverVideo(false)}
                onClick={() => goToMv(props.mvId)}>
                <img src={getUrl(mv)} loading="lazy" />
                <Transition nodeRef={nodeRef} in={hoverVideo} name="mv-item-fade" timeout={600}>
                    {(state) => (
                        <div ref={nodeRef} className={`shadow mv-item-fade mv-item-fade-${state}`}
                            style={{ background: 'url(' + getUrl(mv) + ')' }}>
                        </div>
                    )}
                </Transition>
            </div>
            <div className="info">
                <div className="title">
                    <Link to={'/mv/' + props.mvId}>{getTitle(mv)}</Link>
                </div>
                <div className="artist" dangerouslySetInnerHTML={{ __html: getSubtitle(mv) }}></div>
            </div>
        </div>
    );
})

MvRowItem.defaultProps = {
    subtitle: 'artist',
    mv: {}
}

export default MvRowItem;
