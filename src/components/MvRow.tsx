import { FC, memo } from "react";
import _ from "lodash";
import MvRowItem from "./MvRowItem";
import './MvRow.scss';

type MvRowProps = {
    mvs: any[]
    subtitle?: string
    withoutPadding?: boolean,
};

const MvRow: FC<MvRowProps> = memo(({
    mvs= [],
    subtitle= 'artist',
    withoutPadding= false,
}) => {

    const getId = (mv: any) => {
        if (mv.id !== undefined) return mv.id;
        if (mv.vid !== undefined) return mv.vid;
    }

    return (
        <div className={withoutPadding ? 'mvRow withoutPadding' : 'mvRow'}>
            {
                mvs.map((mv: any) => {
                    return (
                        <MvRowItem
                            key={getId(mv)}
                            mvId={getId(mv)}
                            mv={mv} 
                            subtitle={subtitle} />
                    )
                })
            }
        </div>
    )
})

export default MvRow;
