import { FC } from "react";
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from "@/store/hooks";
import { updateAppConf } from "@/store/coreSlice";
import "./SettingsComponent.scss";
import { isString } from "lodash";

interface SelectData {
    name: string;
    value: string;
}

interface SettingsSelectProps {
    title: string; // 标题
    initValue: string | number;
    fieldKey?: string;
    selectData: SelectData[];
    converNumber?: boolean;
    callback?: Function; // 回调函数
}

const SettingsSelect: FC<SettingsSelectProps> = ({
    title= "",
    initValue= "",
    fieldKey= "",
    selectData= [],
    converNumber= false,
    callback= undefined
}) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    
    const selectChange = (selectValue: string | number) => {
        if (converNumber && isString(selectValue)) {
            selectValue = parseInt(selectValue, 10);
        }
        dispatch(updateAppConf({
            confName: "settings",
            key: fieldKey,
            value: selectValue
        }));
        if (callback) callback(selectValue)
    }

    return (
        <div className="settings-item">
            <div className="left">
                <div className="title"> {t(title)} </div>
            </div>
            <div className="right">
                <select value={initValue} onChange={ (e) => selectChange(e.target.value) } >
                    {
                        selectData.map((sd: SelectData) => {
                            return <option key={sd.value} value={sd.value}>{sd.name}</option>;
                        })
                    }
                </select>
            </div>
        </div>
    )
}

export default SettingsSelect;