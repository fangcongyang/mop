import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    dataStore,
    likedStore,
    modalsStore,
    updateModal,
} from "@/store/coreSlice";
import Modal from "./Modal";
import SvgIcon from "./SvgIcon";
import { useMemo } from "react";
import { resizeImage } from "@/utils/data";
import { showToast } from "@/utils";
import { useTranslation } from "react-i18next";
import { addOrRemoveTrackFromPlaylist } from "@/api/playlist";
import styles from './ModalAddTrackToPlaylist.module.scss';

const ModalAddTrackToPlaylist = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const modals = useAppSelector(modalsStore);
    const liked = useAppSelector(likedStore);
    const data = useAppSelector(dataStore);

    const ownPlaylists = useMemo(() => {
        return liked.playlists.filter(
            (p: any) =>
                p.creator.userId === data.user.userId &&
                p.id !== data.likedSongPlaylistID
        );
    }, [liked.playlists]);

    const close = () => {
        dispatch(
            updateModal({
                modalName: "addTrackToPlaylistModal",
                key: "show",
                value: false,
            })
        );
    };

    const newPlaylist = () => {
        dispatch(
            updateModal({
                modalName: "newPlaylistModal",
                key: "afterCreateAddTrackId",
                value: modals.addTrackToPlaylistModal.selectedTrackId,
            })
        );
        close();
        dispatch(
            updateModal({
                modalName: "newPlaylistModal",
                key: "show",
                value: true,
            })
        );
    };

    const addTrackToPlaylist = (playlistID: number) => {
        addOrRemoveTrackFromPlaylist({
            op: "add",
            pid: playlistID.toString(),
            tracks: modals.addTrackToPlaylistModal.selectedTrackId.toString(),
        }).then((data: any) => {
            if (data.code === 200) {
                close();
                showToast(t("toast.savedToPlaylist"));
            } else {
                close();
                showToast(data.message);
            }
        });
    };

    return (
        <div>
            <Modal
                className={styles.addTrackToPlaylistModal}
                title="添加到歌单"
                width="25vw"
                showFooter={false}
                show={modals.addTrackToPlaylistModal.show}
                close={close}
            >
                <div
                    className={styles.newPlaylistButton}
                    onClick={() => newPlaylist()}
                >
                    <SvgIcon svgName="plus" svgClass={styles.svgIcon}/>
                    新建歌单
                </div>
                {ownPlaylists.map((playlist: any) => {
                    return (
                        <div
                            key={playlist.id}
                            className={styles.playlist}
                            onClick={() => addTrackToPlaylist(playlist.id)}
                        >
                            <img
                                src={resizeImage(playlist.coverImgUrl, 224)}
                                loading="lazy"
                            />
                            <div className={styles.info}>
                                <div className={styles.title}>{playlist.name}</div>
                                <div className={styles.trackCount}>
                                    {playlist.trackCount} 首
                                </div>
                            </div>
                        </div>
                    );
                })}
            </Modal>
        </div>
    );
};

export default ModalAddTrackToPlaylist;
