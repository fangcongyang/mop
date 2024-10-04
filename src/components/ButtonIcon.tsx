import { CSSProperties, FunctionComponent, ReactElement } from 'react';
import "./ButtonIcon.scss";

interface ButtonIconProps {
    children: ReactElement,
    onClick?: React.MouseEventHandler<HTMLElement>,
    className?: string,
    title?: string,
    style?: CSSProperties
}

const ButtonIcon: FunctionComponent<ButtonIconProps> = (props) => {
    return (
        <button
            title={props.title}
            style={props.style}
            className={props.className ? 'button ' + props.className : 'button'}
            onClick={props.onClick}>
            {props.children}
        </button>
    );
}

export default ButtonIcon;