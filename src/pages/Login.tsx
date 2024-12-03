
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SvgIcon from "@/components/SvgIcon";
import styles from './login.module.scss';

const Login = () => {
    const [activeCard, setActiveCard] = useState(1);
    const navigate = useNavigate();

    const goTo = (path: string) => {
        navigate(path);
    }

    return (
        <div className={styles.login}>
            <div className={styles.section1}>
                <img src="/img/logos/mop.png" />
                <SvgIcon svgName="x"></SvgIcon>
                <img src="/img/logos/netease-music.png" />
            </div>
            <div className={styles.section2}>
                <div
                    className={styles.card}
                    onMouseOver={() => setActiveCard(1)}
                    onMouseLeave={() => setActiveCard(0)}
                    onClick={() => goTo('/account')}
                >
                    <div className={activeCard === 1 ? 'container active' : 'container'}>
                    <div className="title-info">
                        <div className="title">登录网易云账号</div>
                        <div className="info">可访问全部数据</div>
                    </div>
                    <SvgIcon svgName="arrow-right"></SvgIcon>
                    </div>
                </div>
            <div
                className={styles.card}
                onMouseOver={() => setActiveCard(2)}
                onMouseLeave={() => setActiveCard(0)}
                onClick={() => goTo('/username')}
                >
                <div className={activeCard === 2 ? 'container active' : 'container'}>
                    <div className="title-info">
                        <div className="title">搜索网易云账号</div>
                        <div className="info">只能读取账号公开数据</div>
                    </div>
                    <SvgIcon svgName="arrow-right"></SvgIcon>
                </div>
            </div >
            </div >
        </div >
    )
}

export default Login;