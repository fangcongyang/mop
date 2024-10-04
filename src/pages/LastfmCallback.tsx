import { authGetSession } from "@/api/lastfm";
import SvgIcon from "@/components/SvgIcon";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateLastfm } from "@/store/coreSlice";
import styles from "./LastfmCallback.module.scss";

const LastfmCallback = () => {
    const dispatch = useAppDispatch();
    const [message, setMessage] = useState("请稍等...");
    const [done, setDone] = useState(false);

    useEffect(() => {
        initLastfmToken();
    }, [window.location.search]);

    const initLastfmToken = _.debounce(() => {
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
          setMessage('连接失败，请重试或联系开发者（无Token）');
          setDone(true);
          return;
        }
        authGetSession(token).then((result: any) => {
          if (!result.data.session) {
            setMessage('连接失败，请重试或联系开发者（无Session）');
            setDone(true);
            return;
          }
          localStorage.setItem('lastfm', JSON.stringify(result.data.session));
          dispatch(updateLastfm(result.data.session));
          setMessage('已成功连接到 Last.fm');
          setDone(true);
        });
    }, 500)

    return (
        <div className={styles.lastfmCallback}>
            <div className="section-1">
                <img src="/img/logos/yesplaymusic.png" />
                <SvgIcon svgName="x" />
                <img src="/img/logos/lastfm.png" />
            </div>
            <div className="message">{message}</div>
            {
                done ?
                    <button onClick={close}> 完成 </button>
                    : ''
            }
        </div >
    );
}

export default LastfmCallback;