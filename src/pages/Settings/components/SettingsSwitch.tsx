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

const SettingsSwitch: FC<SettingsSelectProps> = props => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    
    const switchChange = (switchValue: boolean) => {
        dispatch(updateAppConf({
            confName: "settings",
            key: props.fieldKey,
            value: switchValue
        }));
        if (props.callback) props.callback(switchValue)
    }

    return (
        <div className="settings-item">
            <div className="left">
                <div className="title" style={props.titleStyle ? props.titleStyle : {}}> 
                    { isString(props.title) ? t(props.title) : props.title } 
                </div>
                {
                    props.description ?
                    <div className="description">
                        {t(props.description)}
                    </div>
                    : ''
                }
            </div>
            <div className="right">
                <div className="toggle">
                    <input
                        id={props.inputId}
                        type="checkbox"
                        name={props.inputId}
                        checked={props.initValue}
                        onChange={(e) => switchChange(e.target.checked)}
                    />
                    <label htmlFor={props.inputId}></label>
                </div>
            </div>
        </div>
    )
}

SettingsSwitch.defaultProps = {
    title: "",
    titleStyle: {},
    description: "",
    initValue: false,
    fieldKey: "",
    inputId: "",
    callback: undefined
}

export default SettingsSwitch;