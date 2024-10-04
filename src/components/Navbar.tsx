import { useState, useRef, MouseEvent, KeyboardEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { dataStore, doLogout } from '@/store/coreSlice';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SvgIcon from './SvgIcon';
import ButtonIcon from './ButtonIcon';
import ContextMenu, { ContextMenuHandle } from "./ContextMenu";
import { confirm } from "@tauri-apps/plugin-dialog";
import auth from '@/utils/auth';
import styles from "./Navbar.module.scss";

const Navbar = () => {
    const { t } = useTranslation();
    const data = useAppSelector(dataStore);
    const dispatch = useAppDispatch();
    const [, setSearchParams]= useSearchParams();
    const [inputFocus, setInputFocus] = useState(false);
    const [keywords, setKeywords] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const searchInput = useRef<HTMLInputElement>(null);
    const userProfileMenu = useRef<ContextMenuHandle>(null);

    const doSearch = (e: KeyboardEvent) => {
        if (e.key !== "Enter") return;
        if (!keywords) return;
        if (
            location.pathname.startsWith('/search')
        ) {
            setSearchParams({keywords})
            return;
        }
        navigate('/search/' + keywords);
    }

    const showUserProfileMenu = (event: MouseEvent) => {
        userProfileMenu.current!.openMenu(event)
    }

    const looseLoggedIn = useMemo(() => {
        return auth.isLooseLoggedIn();
    }, [data.loginMode])

    const avatarUrl = useMemo(() => {
        return data?.user?.avatarUrl && looseLoggedIn
            ? `${data?.user?.avatarUrl}?param=512y512`
            : 'http://s4.music.126.net/style/web2/img/default/default_avatar.jpg?param=60y60';
    }, [data])

    const toSettings = () => {
        navigate("/settings")
    }

    const logout = async () => {
        const confirmed = await confirm(t('common.logOutSure'), { title: t('common.logout'), kind: 'warning' });
        if (!confirmed) return;
        dispatch(doLogout(""));
        navigate('/');
    }

    const toLogin = () => {
        // navigate("/login")
        navigate("/account")
    }

    const toGitHub = () => {
        window.open('https://github.com/fangcongyang?tab=repositories');
    }

    const go = (where: string) => {
        if (where === 'back') navigate(-1);
        else navigate(1);
    }

    return (
        <div className={styles.navBar}>
            <nav>
                <div className={styles.navigationButtons}>
                    <ButtonIcon
                        onClick={() => go('back')}
                        children={<SvgIcon svgName='arrow-left' svgTitle={t('nav.goBack')} />}
                    />
                    <ButtonIcon
                        children={<SvgIcon svgName='arrow-right' svgTitle={t('nav.advance')} />}
                        onClick={() => go('forward')} />
                </div>
                <div className={styles.navigationLinks}>
                    <Link to="/" className={location.pathname == '/' ? 'active' : ''}>
                        {t('nav.home')}
                    </Link>
                    <Link to="/explore" className={location.pathname == '/explore' ? 'active' : ''}>
                        {t('nav.explore')}
                    </Link>
                    <Link to="/library" className={location.pathname == '/library' ? 'active' : ''}>
                        {t('nav.library')}
                    </Link>
                </div >

                <div className={styles.rightPart}>
                    <div className="search-box">
                        <div className={inputFocus ? 'container active' : 'container'}>
                            <SvgIcon svgName='search' svgTitle={t('nav.search')} svgClass={styles.search} />
                            <div className="input">
                                <input
                                    ref={searchInput}
                                    value={keywords}
                                    type="search"
                                    placeholder={inputFocus ? '' : t('nav.search')}
                                    onKeyDown={doSearch}
                                    onFocus={() => setInputFocus(true)}
                                    onBlur={() => setInputFocus(false)}
                                    onChange={(e) => setKeywords(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <img
                        className="avatar"
                        src={avatarUrl}
                        onClick={showUserProfileMenu}
                        loading="lazy"
                    />
                </div>
            </nav >
            <Outlet />
            <ContextMenu
                ref={userProfileMenu}>
                <div className="item" onClick={toSettings}>
                    <SvgIcon svgName="settings" svgTitle={t('common.settings')} />
                    {t('common.settings')}
                </div>
                {
                    auth.isAccountLoggedIn() ?
                        <div className="item" onClick={logout}>
                            <SvgIcon svgName="logout" svgTitle={t('common.logout')} />
                            {t('common.logout')}
                        </div> :
                        <div className="item" onClick={toLogin}>
                            <SvgIcon svgName="login" svgTitle={t('common.login')} />
                            {t('common.login')}
                        </div>
                }
                <hr />
                <div className="item" onClick={toGitHub}>
                    <SvgIcon svgName="github" svgTitle='Github' />
                    Github
                </div>
            </ContextMenu>
        </div >
    );
}

export default Navbar;