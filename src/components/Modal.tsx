import { FC, ReactElement } from "react";
import "./ButtonIcon.scss";
import SvgIcon from "./SvgIcon";
import "./Modal.scss";

interface Modal {
    show: boolean;
    close: Function;
    title: string;
    showFooter: boolean;
    className?: string;
    width?: string;
    clickOutsideHide?: boolean;
    contentClassName?: string;
    minWidth?: string;
    children: ReactElement[] | ReactElement | string;
    footer?: ReactElement[] | ReactElement;
}

const Modal: FC<Modal> = ({
    show,
    close,
    title = "Title",
    showFooter = true,
    className,
    width = "50vw",
    clickOutsideHide = false,
    contentClassName,
    minWidth = "calc(min(23rem, 100vw))",
    children,
    footer,
}) => {
    const modalStyles = () => {
        return {
            width: width,
            minWidth: minWidth,
        };
    };

    const clickOutside = () => {
        if (clickOutsideHide) {
            close();
        }
    };

    const getClassName = () => {
        let classNames = ["shade"];
        if (className) {
            classNames.push(className);
        }
        if (!show) {
            classNames.push("hidden");
        }
        return classNames.join(" ");
    };

    return (
        <div className={getClassName()} onClick={clickOutside}>
            <div className="modal" style={modalStyles()}>
                <div className="header">
                    <div className="title">{title}</div>
                    <button className="close" onClick={() => close()}>
                        <SvgIcon svgName="x" />
                    </button>
                </div>
                <div
                    className={
                        contentClassName
                            ? contentClassName + " content"
                            : "content"
                    }
                >
                    {children}
                </div>
                {showFooter && footer ? (
                    <div className="footer">{footer}</div>
                ) : (
                    ""
                )}
            </div>
        </div>
    );
};

export default Modal;
