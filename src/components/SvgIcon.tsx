import {FC, CSSProperties} from 'react';

interface SvgIconProps {
    svgName: string; // svg名字
    svgTitle?: string; // svg标题
    svgStyle?: CSSProperties;
    svgClass?: string,
    color?: string; // 填充颜色
}

const SvgIcon: FC<SvgIconProps> = props => {
    const {svgName, svgTitle, color, svgStyle, svgClass} = props;
    return (
        <svg style={svgStyle} className={svgClass ? 'svg-icon ' + svgClass : 'svg-icon'}>
            { svgTitle ? <title>{svgTitle}</title> : '' }
            <use xlinkHref={'#icon-' + svgName} fill={color} />
        </svg>
    );
}

export default SvgIcon;