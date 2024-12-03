import { CSSProperties, FC, ReactElement } from "react";
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from "@/store/hooks";
import { updateAppConf } from "@/store/coreSlice";
import "./SettingsComponent.scss";
import { isString } from "lodash";

interface SettingsSelectProps {
    title: string | ReactElement; // 标题
    titleStyle?: CSSProperties,
    description?: string;
    initValue: boolean;
    fieldKey: string;
    inputId: string;
    callback?: Function; // 回调函数
}

const SettingsSwitch: FC<SettingsSelectProps> = ({
    title= "",
    titleStyle= {},
    description= "",
    initValue= false,
    fieldKey= "",
    inputId= "",
    callback= undefined
}) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    
    const switchChange = (switchValue: boolean) => {
        dispatch(updateAppConf({
            confName: "settings",
            key: fieldKey,
            value: switchValue
        }));
        callback?.(switchValue)
    }

    return (
        <div className="settings-item">
            <div className="left">
                <div className="title" style={titleStyle ? titleStyle : {}}> 
                    { isString(title) ? t(title) : title } 
                </div>
                {
                    description ?
                    <div className="description">
                        {t(description)}
                    </div>
                    : ''
                }
            </div>
            <div className="right">
                <div className="toggle">
                    <input
                        id={inputId}
                        type="checkbox"
                        name={inputId}
                        checked={initValue}
                        onChange={(e) => switchChange(e.target.checked)}
                    />
                    <label htmlFor={inputId}></label>
                </div>
            </div>
        </div>
    )
}

export default SettingsSwitch;