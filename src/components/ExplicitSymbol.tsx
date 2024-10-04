import { FC, CSSProperties } from "react";
import SvgIcon from "./SvgIcon";

type ExplicitSymbolProps = {
    size?: number;
};

const ExplicitSymbol: FC<ExplicitSymbolProps> = ({ size = 16 }) => {
    const svgStyle = () => {
        const ss: CSSProperties = {
            height: size + "px",
            width: size + "px",
            position: "relative",
            left: "-1px",
        };
        return ss;
    };

    return <SvgIcon svgName="explicit" svgStyle={svgStyle()}></SvgIcon>;
};

export default ExplicitSymbol;
