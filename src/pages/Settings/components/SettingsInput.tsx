import { CSSProperties, FC, ReactElement, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from "@/store/hooks";
import { updateAppConf } from "@/store/coreSlice";
import "./SettingsComponent.scss";
import { isString } from "lodash";

interface SettingsInputProps {
    title: string | ReactElement; // 标题
    titleStyle?: CSSProperties,
    description?: string | ReactElement;
    initValue: string;
    fieldKey: string;
    inputPlaceholder: string;
    callback?: Function; // 回调函数
}

const SettingsInput: FC<SettingsInputProps> = props => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState(props.initValue);
    
    const inputBlur = () => {
        if (props.initValue === inputValue) return;
        dispatch(updateAppConf({
            confName: "settings",
            key: props.fieldKey,
            value: inputValue,
        }));
        if (props.callback) props.callback(inputValue)
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
                        { isString(props.description) ? t(props.description) : props.description }
                    </div>
                    : ''
                }
            </div>
            <div className="right">
                <input
                    className="text-input margin-right-0"
                    placeholder={props.inputPlaceholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={inputBlur}
                />
            </div>
        </div>
    )
}

SettingsInput.defaultProps = {
    title: "",
    titleStyle: {},
    description: "",
    initValue: "",
    fieldKey: "",
    inputPlaceholder: "",
    callback: undefined
}

export default SettingsInput;