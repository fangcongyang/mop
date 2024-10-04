import { MouseEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ButtonIcon from "@/components/ButtonIcon";
import SvgIcon from "@/components/SvgIcon";
import auth from "@/utils/auth";
import { showToast } from "@/utils";
import { likeAMv, mvDetail, mvUrl, simiMv } from "@/api/mv";
import { formatPlayCount } from "@/utils/data";
import ContextMenu, { ContextMenuHandle } from "@/components/ContextMenu";
import MvRow from "@/components/MvRow";
import { player } from "@/business/player";
import Plyr from 'plyr';
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import _ from "lodash";
import '@/assets/css/plyr.css';
import "./Mv.scss";

const Mv = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const location = useLocation();
    const videoPlayerRef = useRef<HTMLVideoElement>(null);
    const [mv, setMv] = useState({
        url: '',
        data: {
            id: "",
            artistId: '',
            name: '',
            artistName: '',
            playCount: 0,
            publishTime: '',
            cover: ''
        },
        subed: false,
    });
    const [simiMvs, setSimiMvs] = useState<any[]>([])
    const mvMenu = useRef<ContextMenuHandle>(null);
    const videoPlayer = useRef<Plyr | null>(null);

    useEffect(() => {
        if (!videoPlayer.current) {
            initPlayer();
        }
        getData();
    }, [id])

    const initPlayer = _.debounce(() => {
        let videoOptions = {
            settings: ['quality'],
            autoplay: false,
            quality: {
                default: 1080,
                options: [1080, 720, 480, 240],
            },
        };
        if (location.state?.autoplay === 'true') videoOptions.autoplay = true;
        videoPlayer.current = new Plyr(videoPlayerRef.current!, videoOptions);
        videoPlayer.current.volume = player.volume;
        videoPlayer.current.on('playing', () => {
            player.pause();
        });
        getData();
    }, 500)

    const getData = _.debounce(() => {
        mvDetail(id!).then((data: any) => {
            setMv(data);
            let requests = data.data.brs.map((br: any) => {
                return mvUrl({ id, r: br.br });
            });
            Promise.all(requests).then(results => {
                let sources = results.map(result => {
                    return {
                        src: result.data.url.replace(/^http:/, 'https:'),
                        type: 'video/mp4',
                        size: result.data.r,
                    };
                });
                videoPlayer.current!.source = {
                    type: 'video',
                    title: data.data.name,
                    sources: sources,
                    poster: data.data.cover.replace(/^http:/, 'https:'),
                };
            });
        });
        simiMv(id!).then((data: any) => {
            setSimiMvs(data.mvs);
        });
    }, 500)

    const likeMv = () => {
        if (!auth.isAccountLoggedIn()) {
            showToast(t('toast.needToLogin'));
            return;
        }
        likeAMv({
            mvid: mv.data.id,
            t: mv.subed ? 0 : 1,
        }).then((data: any) => {
            if (data.code === 200) {
                let newMv = _.cloneDeep(mv);
                newMv.subed = !newMv.subed;
                setMv(newMv);
            }
        });
    }

    const openMenu = (e: MouseEvent) => {
        mvMenu.current!.openMenu(e);
    }

    const copyUrl = (id: string) => {
        writeText(`https://music.163.com/#/mv?id=${id}`)
            .then(function () {
                showToast(t('toast.copied'));
            })
            .catch(error => {
                showToast(`${t('toast.copyFailed')}${error}`);
            });
    }

    const openInBrowser = (id: string) => {
        const url = `https://music.163.com/#/mv?id=${id}`;
        window.open(url);
    }

    return (
        <div className="mv-page">
            <div className="current-video">
                <div className="video">
                    <video ref={videoPlayerRef} className="plyr"></video>
                </div>
                <div className="video-info">
                    <div className="title">
                        <Link to={'/artist/' + mv.data.artistId}>
                            {mv.data.artistName}
                        </Link>
                        - {mv.data.name}
                        <div className="buttons">
                            <ButtonIcon className="button"
                                onClick={() => likeMv()}>
                                <SvgIcon svgName={mv.subed ? 'heart-solid' : 'heart'} />
                            </ButtonIcon>
                            <ButtonIcon className="button" onClick={openMenu}>
                                <SvgIcon svgName="more"></SvgIcon>
                            </ButtonIcon>
                        </div>
                    </div>
                </div>
                <div className="info">
                    {formatPlayCount(mv.data.playCount)} Views ·
                    {mv.data.publishTime}
                </div>
            </div>
            <div className="more-video">
                <div className="section-title">{t('mv.moreVideo')}</div>
                <MvRow mvs={simiMvs} />
            </div>
            <ContextMenu ref={mvMenu}>
                <div className="item" onClick={() => copyUrl(mv.data.id)}>
                    {t('contextMenu.copyUrl')}
                </div>
                <div className="item" onClick={() => openInBrowser(mv.data.id)}>
                    {t('contextMenu.openInBrowser')}
                </div>
            </ContextMenu >
        </div >
    )
}

export default Mv;