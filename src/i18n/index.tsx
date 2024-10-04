import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import zh_CN from './locales/zh_CN.json';
// import zh_TW from './locales/zh_TW.json';
import en_US from './locales/en_US.json';
// import ru_RU from './locales/ru_RU.json';
// import pt_BR from './locales/pt_BR.json';

i18n.use(initReactI18next).init({
    resources: {
        en: {
            translation: en_US
        },
        zh_cn: {
            translation: zh_CN
        },
    },
    fallbackLng: 'zh_ch',
    debug: false,
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;