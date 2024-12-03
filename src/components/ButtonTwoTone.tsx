import { CSSProperties, FunctionComponent, ReactElement, useMemo } from 'react';
import "./ButtonTwoTone.scss";
import SvgIcon from './SvgIcon';

interface ButtonTwoToneProps {
    iconClass?: string | null,
    iconButton?: boolean
    horizontalPadding?: number
    color?: string
    className?: string,
    backgroundColor?: string
    textColor?: string
    shape?: string
    onClick?: React.MouseEventHandler<HTMLElement>,
    children?: ReactElement | string,
}

const ButtonTwoTone: FunctionComponent<ButtonTwoToneProps> = ({
    iconClass= null,
    iconButton= false,
    horizontalPadding= 16,
    color= "blue",
    className,
    backgroundColor= '',
    textColor= '',
    shape= 'square',
    onClick,
    children
}) => {

    const buttonStyle = useMemo(() => {
        let styles: CSSProperties = {
            borderRadius: shape === 'round' ? '50%' : '8px',
            padding: `8px ${horizontalPadding}px`,
            // height: "38px",
            width: shape === 'round' ? '38px' : 'auto',
        };
        if (backgroundColor !== '')
            styles.backgroundColor = backgroundColor;
        if (textColor !== '') styles.color = textColor;
        return styles;
    }, [])

    const buttonClassName = useMemo(() => {
        let classNames = [];
        classNames.push('buttonTwoTone');
        if (className) classNames.push(className);
        if (color) classNames.push(color);
        return classNames.join(" ");
    }, [className])

    return (
        <button
            style={buttonStyle}
            className={buttonClassName}
            onClick={onClick}>
            {iconClass ?
                <SvgIcon svgName={iconClass} svgClass={iconClass} svgStyle={{marginRight: iconButton ? '0px' : '8px'}}/>
                : ''
            }
            {children}
        </button>
    );
}

export default ButtonTwoTone;