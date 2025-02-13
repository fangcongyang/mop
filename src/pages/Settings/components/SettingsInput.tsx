import { CSSProperties, FC, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/store/hooks";
import { updateAppConf } from "@/store/coreSlice";
import "./SettingsComponent.scss";
import { isString } from "lodash";

interface SettingsInputProps {
    title: string | ReactElement; // 标题
    titleStyle?: CSSProperties;
    description?: string | ReactElement;
    initValue: string;
    fieldKey: string;
    inputPlaceholder: string;
    callback?: Function; // 回调函数
}

const SettingsInput: FC<SettingsInputProps> = ({
    title = "",
    titleStyle = {},
    description = "",
    initValue = "",
    fieldKey = "",
    inputPlaceholder = "",
    callback = undefined,
}) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState(initValue);

    useEffect(() => {
        setInputValue(initValue);
    }, [initValue]);

    const inputBlur = () => {
        if (initValue === inputValue) return;
        dispatch(
            updateAppConf({
                confName: "settings",
                key: fieldKey,
                value: inputValue,
            })
        );
        callback?.(inputValue);
    };

    return (
        <div className="settings-item">
            <div className="left">
                <div
                    className="title"
                    style={titleStyle ? titleStyle : {}}
                >
                    {isString(title) ? t(title) : title}
                </div>
                {description ? (
                    <div className="description">
                        {isString(description)
                            ? t(description)
                            : description}
                    </div>
                ) : (
                    ""
                )}
            </div>
            <div className="right">
                <input
                    className="text-input margin-right-0"
                    placeholder={inputPlaceholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={inputBlur}
                />
            </div>
        </div>
    );
};

export default SettingsInput;
