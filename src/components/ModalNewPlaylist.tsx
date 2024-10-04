import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchLikedPlaylist,
    modalsStore,
    updateData,
    updateModal,
} from "@/store/coreSlice";
import Modal from "./Modal";
import { addOrRemoveTrackFromPlaylist, createPlaylist } from "@/api/playlist";
import { showToast } from "@/utils";
import styles from "./ModalNewPlaylist.module.scss";

const ModalNewPlaylist = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const modals = useAppSelector(modalsStore);
    const [title, setTitle] = useState("");
    const [privatePlaylist, setPrivatePlaylist] = useState(false);

    const close = () => {
        dispatch(
            updateModal({
                modalName: "newPlaylistModal",
                key: "show",
                value: false,
            })
        );
        setTitle("");
        setPrivatePlaylist(false);
        resetAfterCreateAddTrackId();
    };

    const onCreatePlaylist = () => {
        let params: any = { name: title, privacy: "0" };
        if (privatePlaylist) params.privacy = "10";
        createPlaylist(params).then((data: any) => {
            if (data.code === 200) {
                if (modals.newPlaylistModal.afterCreateAddTrackId !== 0) {
                    addOrRemoveTrackFromPlaylist({
                        op: "add",
                        pid: data.id,
                        tracks: modals.newPlaylistModal.afterCreateAddTrackId,
                    }).then((data: any) => {
                        if (data.body.code === 200) {
                            showToast(t("toast.savedToPlaylist"));
                        } else {
                            showToast(data.body.message);
                        }
                        resetAfterCreateAddTrackId();
                    });
                }
                showToast("成功创建歌单");
                dispatch(
                    updateData({
                        key: "libraryPlaylistFilter",
                        value: "mine",
                    })
                );
                dispatch(fetchLikedPlaylist());
                close();
            }
        });
    };

    const resetAfterCreateAddTrackId = () => {
        dispatch(
            updateModal({
                modalName: "newPlaylistModal",
                key: "afterCreateAddTrackId",
                value: 0,
            })
        );
    };

    return (
        <div>
            <Modal
                className={styles.addPlaylistModal}
                show={modals.newPlaylistModal.show}
                close={() => close()}
                title="新建歌单"
                width="25vw"
                contentClassName={styles.content}
                showFooter
                footer={
                    <button
                        className="primary block"
                        onClick={() => onCreatePlaylist()}
                    >
                        创建
                    </button>
                }
            >
                <input
                    value={title}
                    type="text"
                    placeholder="歌单标题"
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={40}
                />
                <div className={styles.checkbox}>
                    <input
                        id="checkbox-private"
                        type="checkbox"
                        checked={privatePlaylist}
                        onChange={(e) => setPrivatePlaylist(e.target.checked)}
                    />
                    <label htmlFor="checkbox-private">设置为隐私歌单</label>
                </div>
            </Modal>
        </div>
    );
};

export default ModalNewPlaylist;
