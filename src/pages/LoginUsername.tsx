import { KeyboardEvent, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SvgIcon from '@/components/SvgIcon';
import { throttle } from 'lodash';
import { search } from '@/api/other';
import { resizeImage } from '@/utils/data';
import ButtonTwoTone from '@/components/ButtonTwoTone';
import { setLoginMode, updateData } from '@/store/coreSlice';
import { userPlaylist } from '@/api/user';

const LoginUsername = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [keyword, setKeyword] = useState("");
    const [result, setResult] = useState<any[]>([]);
    const [activeUser, setActiveUser] = useState<any>({});

    const onSearch = () => {
        if (!keyword) return;
        search({ keywords: keyword, limit: 9, type: 1002 }).then(data => {
            setResult(data.result.userprofiles);
            setActiveUser(result[0]);
        });
    }

    const throttleSearch = (e: KeyboardEvent) => throttle(function () {
        if (e.code === "enter") {
            onSearch();
        }
    }, 500)

    const confirm = () => {
        dispatch(updateData({ key: 'user', value: activeUser }));
        dispatch(setLoginMode('username'))
        userPlaylist({
            uid: activeUser.userId,
            limit: 1,
        }).then((data: any) => {
            dispatch(updateData({ key: 'likedSongPlaylistID', value: data.playlist[0].id }));
            navigate("/library");
        });
    }

    return (
        <div className="login">
            <div>
                <div className="title">{t('login.usernameLogin')}</div>
                <div className="section">
                    <div className="search-box">
                        <div className='container'>
                            <SvgIcon svgName='search' />
                            <div className="input">
                                <input
                                    value={keyword}
                                    placeholder={t('login.searchHolder')}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={throttleSearch}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="sestion">
                    <div className="name">
                        {activeUser.nickname === undefined ? t('login.enterTip') : t('login.choose')}
                    </div>
                    <div className="user-list">
                        {
                            result.map((user) => {
                                return (
                                    <div key={user.id}
                                        className={user.nickname == activeUser.nickname ? 'user active' : 'user'}
                                        onClick={() => setActiveUser(user)}>
                                        <img
                                            className="head"
                                            src={resizeImage(user.avatarUrl)}
                                            loading="lazy"
                                        />
                                        <div className="nickname">
                                            {user.nickname}
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
                <ButtonTwoTone
                    className={activeUser.nickname !== undefined ? '' : 'hidden'}
                    onClick={confirm}
                >
                    {t('login.confirm')}
                </ButtonTwoTone>
            </div>
        </div>
    )
}

export default LoginUsername;