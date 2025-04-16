import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from "@/store/hooks";
import styles from './LoginAccount.module.scss';
import SvgIcon from '@/components/SvgIcon';
import auth from '@/utils/auth';
import QRCode from 'qrcode';
import NProgress from 'nprogress';
import _ from "lodash";
import { setLoginMode, fetchUserProfile, fetchLikedPlaylist } from '@/store/coreSlice';
import { useNavigate } from 'react-router-dom';
import { message } from "@tauri-apps/plugin-dialog";
import md5 from 'crypto-js/md5';
import { loginQrCodeCheck, loginQrCodeKey, loginWithEmail, loginWithPhone } from '@/api/auth';

const LoginAccount = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [mode, setMode] = useState("qrCode");
    const [inputFocus, setInputFocus] = useState("phone");
    const qrCodeKey = useRef("");
    const [qrCodeSvg, setQrCodeSvg] = useState("");
    const [qrCodeInformation, setQrCodeInformation] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [processing, setProcessing] = useState(false);
    const [countryCode, setCountryCode] = useState('+86');
    const qrCodeCheckInterval = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (mode === 'qrCode' && !qrCodeCheckInterval.current) {
            getQrCodeKey();
        }
        return () => {
            clearInterval(qrCodeCheckInterval.current);
        }
    }, [mode])

    const login = async () => {
        if (mode === 'phone') {
            await validatePhone();
            if (!processing) return;
            loginWithPhone({
                countrycode: countryCode.replace('+', '').replace(/\s/g, ''),
                phone: phoneNumber.replace(/\s/g, ''),
                password: 'fakePassword',
                md5_password: md5(password).toString(),
            }).then(handleLoginResponse)
                .catch(async (error: any) => {
                    setProcessing(false);
                    await message(`发生错误，请检查你的账号密码是否正确\n${error}`, { title: '登录错误', kind: 'warning' });
                });
        } else {
            validateEmail();
            if (!processing) return;
            loginWithEmail({
                email: email.replace(/\s/g, ''),
                password: 'fakePassword',
                md5_password: md5(password).toString(),
            }).then(handleLoginResponse)
                .catch(async (error: any) => {
                    setProcessing(false);
                    await message(`发生错误，请检查你的账号密码是否正确\n${error}`, { title: '登录错误', kind: 'warning' });
                });
        }
    }

    const validatePhone = async () => {
        let processing = true;
        if (
            countryCode === '' ||
            phoneNumber === '' ||
            password === ''
        ) {
            await message('国家区号或手机号不正确', { title: '登录错误', kind: 'warning' });
            processing = false;
        }
        setProcessing(processing);
        return processing;
    }

    const validateEmail = async () => {
        let processing = true;
        const emailReg =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (
            email === '' ||
            password === '' ||
            !emailReg.test(email)
        ) {
            await message('邮箱不正确', { title: '登录错误', kind: 'warning' });
            processing = false;
        }
        setProcessing(processing);
        return processing;
    }

    const changeMode = (modeName: string) => {
        setMode(modeName);
        if (modeName !== 'qrCode') {
            clearInterval(qrCodeCheckInterval.current);
        }
    }

    const handleLoginResponse = (data: any) => {
        if (!data) {
            setProcessing(false);
            return;
        }
        if (data.code === 200) {
            auth.setCookies(data.cookie);
            dispatch(setLoginMode('account'))
            dispatch(fetchUserProfile()).then(() => {
                dispatch(fetchLikedPlaylist()).then(() => {
                    navigate("/library");
                })
            })
        } else {
            setProcessing(false);
            message(data.msg ?? data.message ?? '账号或密码错误，请检查', { title: 'mop', kind: 'error' });
        }
    }

    const getQrCodeKey = _.debounce(async () => {
        const data: any = await loginQrCodeKey();
        qrCodeKey.current = data.unikey;
        QRCode.toString(
            `https://music.163.com/login?codekey=${data.unikey}`,
            {
                width: 192,
                margin: 0,
                color: {
                    dark: '#335eea',
                    light: '#00000000',
                },
                type: 'svg',
            }
        ).then((svg: any) => {
            setQrCodeSvg(`data:image/svg+xml;utf8,${encodeURIComponent(
                svg
            )}`);
        }).catch((err: any) => {
            console.error(err);
        }).finally(() => {
            NProgress.done();
        });
        checkQrCodeLogin();
    }, 500)

    const checkQrCodeLogin = () => {
        qrCodeCheckInterval.current = setInterval(() => {
            if (qrCodeKey.current === '') return;
            loginQrCodeCheck(qrCodeKey.current).then((result: any) => {
                if (result.code === 800) {
                    // 清除二维码检测
                    clearInterval(qrCodeCheckInterval.current);
                    getQrCodeKey(); // 重新生成QrCode
                    setQrCodeInformation('二维码已失效，请重新扫码');
                } else if (result.code === 802) {
                    setQrCodeInformation('扫描成功，请在手机上确认登录');
                } else if (result.code === 801) {
                    setQrCodeInformation('打开网易云音乐APP扫码登录');
                } else if (result.code === 803) {
                    clearInterval(qrCodeCheckInterval.current);
                    setQrCodeInformation('登录成功，请稍等...');
                    result.code = 200;
                    result.cookie = result.cookie.replaceAll(' HTTPOnly', '');
                    handleLoginResponse(result);
                }
            });
        }, 1000)
    }

    return (
        <div className={styles.login}>
            <div className={styles.loginContainer}>
                <div className={styles.section1}>
                    <img src="/img/logos/netease-music.png" />
                </div>
                <div className={styles.title}>登录网易云账号</div>
                <div className={styles.section2}>
                    {
                        mode === 'phone' ?
                            <div className={styles.inputBox}>
                                <div className={inputFocus === 'phone' ? 'container active' : 'container'}>
                                    <SvgIcon svgName="mobile" />
                                    <div className="inputs">
                                        <input
                                            id="countryCode"
                                            value={countryCode}
                                            placeholder={inputFocus === 'phone' ? '' : '国际区号'}
                                            onFocus={() => setInputFocus('phone')}
                                            onBlur={() => setInputFocus('')}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            onKeyUp={login}
                                        />
                                        <input
                                            id="phoneNumber"
                                            value={phoneNumber}
                                            placeholder={inputFocus === 'phone' ? '' : '手机号'}
                                            onFocus={() => setInputFocus('phone')}
                                            onBlur={() => setInputFocus('')}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            onKeyUp={login}
                                        />
                                    </div>
                                </div>
                            </div>
                            : mode === 'email' ?
                                <div className={styles.inputBox}>
                                    <div className={inputFocus === 'email' ? 'container active' : 'container'}>
                                        <SvgIcon svgName="mail" />
                                        <div className="inputs">
                                            <input
                                                id="email"
                                                value={email}
                                                type="email"
                                                placeholder={inputFocus === 'email' ? '' : '邮箱'}
                                                onFocus={() => setInputFocus('email')}
                                                onBlur={() => setInputFocus('')}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onKeyUp={login}
                                            />
                                        </div>
                                    </div>
                                </div> :
                                <div>
                                    {
                                        qrCodeSvg ?
                                            <div className="qr-code-container">
                                                <img src={qrCodeSvg} loading="lazy" />
                                            </div> : ''
                                    }
                                    <div className="qr-code-info">
                                        {qrCodeInformation}
                                    </div>
                                </div>
                    }
                    {
                        mode !== 'qrCode' ?
                            <div className={styles.inputBox}>
                                <div className={inputFocus === 'password' ? 'container active' : 'container'}>
                                    <SvgIcon svgName="lock" />
                                    <div className="inputs">
                                        <input
                                            id="password"
                                            value={password}
                                            type="password"
                                            placeholder={inputFocus === 'password' ? '' : '密码'}
                                            onFocus={() => setInputFocus('password')}
                                            onBlur={() => setInputFocus('')}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyUp={login}
                                        />
                                    </div>
                                </div>
                            </div>
                            : ''
                    }
                    {
                        mode !== 'qrCode' ?
                            <div className={styles.confirm}>
                                {
                                    !processing ?
                                        <button onClick={login}>
                                            登录
                                        </button>
                                        :
                                        <button className="loading" disabled>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </button>
                                }
                            </div>
                            : ''
                    }
                    <div className={styles.otherLogin}>
                        {
                            mode !== 'email' ?
                                <a onClick={() => changeMode('email')}>
                                    邮箱登录
                                </a>
                                : ''
                        }
                        {
                            mode === 'qrCode' ?
                                <span>|</span>
                                : ''
                        }
                        {
                            mode !== 'phone' ?
                                <a onClick={() => changeMode('phone')}>
                                    手机号登录
                                </a>
                                : ''
                        }
                        {
                            mode !== 'qrCode' ?
                                <span>|</span>
                                : ''
                        }
                        {
                            mode !== 'qrCode' ?
                                <a onClick={() => changeMode('qrCode')}>
                                    二维码登录
                                </a>
                                : ''
                        }
                    </div>
                    {
                        mode !== 'qrCode' ?
                            <div
                                className={styles.notice}
                                dangerouslySetInnerHTML={{
                                    __html: `你的密码会在本地进行 MD5 加密后再传输到网易云 API。<br />
                                Mop 不会传输你的账号数据到任何非网易云音乐官方的服务器。<br />`}}
                            >
                            </div>
                            : ''
                    }
                </div >
            </div >
        </div >
    )
}

export default LoginAccount;