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

const ButtonTwoTone: FunctionComponent<ButtonTwoToneProps> = (props) => {

    const buttonStyle = useMemo(() => {
        let styles: CSSProperties = {
            borderRadius: props.shape === 'round' ? '50%' : '8px',
            padding: `8px ${props.horizontalPadding}px`,
            // height: "38px",
            width: props.shape === 'round' ? '38px' : 'auto',
        };
        if (props.backgroundColor !== '')
            styles.backgroundColor = props.backgroundColor;
        if (props.textColor !== '') styles.color = props.textColor;
        return styles;
    }, [props])

    const buttonClassName = useMemo(() => {
        let classNames = [];
        classNames.push('buttonTwoTone');
        if (props.className) classNames.push(props.className);
        if (props.color) classNames.push(props.color);
        return classNames.join(" ");
    }, [props.className])

    return (
        <button
            style={buttonStyle}
            className={buttonClassName}
            onClick={props.onClick}>
            {props.iconClass ?
                <SvgIcon svgName={props.iconClass} svgClass={props.iconClass} svgStyle={{marginRight:  props.iconButton ? '0px' : '8px'}}/>
                : ''
            }
            {props.children}
        </button>
    );
}

ButtonTwoTone.defaultProps = {
    iconClass: null,
    iconButton: false,
    horizontalPadding: 16,
    color: "blue",
    backgroundColor: '',
    textColor: '',
    shape: 'square'
}

export default ButtonTwoTone;